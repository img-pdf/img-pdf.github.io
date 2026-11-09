/**
 * submit-indexnow.js
 * Submits updated, newly published, and deleted canonical URLs to IndexNow.
 *
 * Official IndexNow Specification:
 * - Endpoint: https://api.indexnow.org/indexnow
 * - Host: img-pdf.github.io
 * - Key Location: https://img-pdf.github.io/<key>.txt
 * - Key: 32-character hex key matching key file contents exactly
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const HOST = 'img-pdf.github.io';
const BASE_URL = `https://${HOST}`;
const DEFAULT_KEY = 'e5517a0fefdf3e347b1768a306cfb093';
const KEY = (process.env.INDEXNOW_KEY || DEFAULT_KEY).trim();
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Files and paths never submitted to IndexNow
const EXCLUDED_PATTERNS = [
  /^404\.html$/i,
  /^google.*\.html$/i,
  /^yandex.*\.html$/i,
  /\.txt$/i,
  /\.xml$/i,
  /\.json$/i,
  /\.md$/i,
  /\.yml$/i,
  /\.yaml$/i,
  /\.css$/i,
  /\.js$/i,
  /\.png$/i,
  /\.svg$/i,
  /\.ico$/i,
  /^\.github\//,
  /^scripts\//,
  /^assets\//,
  /^node_modules\//
];

/**
 * Mask key for secure logging
 */
function maskKey(k) {
  if (!k || k.length <= 8) return '****';
  return `${k.slice(0, 4)}...${k.slice(-4)}`;
}

/**
 * Verify key verification file exists on disk
 */
function verifyKeyFile() {
  const keyFilePath = path.join(ROOT_DIR, `${KEY}.txt`);
  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`IndexNow key file missing at: ${keyFilePath}`);
  }
  const fileContent = fs.readFileSync(keyFilePath, 'utf8').trim();
  if (fileContent !== KEY) {
    throw new Error(`IndexNow key file content does not match API key. Found: "${fileContent}", Expected: "${KEY}"`);
  }
  return true;
}

/**
 * Extract canonical URL from HTML file on disk
 */
function getCanonicalFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip noindex pages
    const robots = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
    if (robots && robots[1].toLowerCase().includes('noindex')) {
      return null;
    }

    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      return canonicalMatch[1].trim();
    }
  } catch (err) {
    console.warn(`[IndexNow] Warning reading ${filePath}:`, err.message);
  }
  return null;
}

/**
 * Convert relative HTML path to canonical URL
 */
function pathToUrl(relPath) {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalized === 'index.html') return `${BASE_URL}/`;
  if (normalized.endsWith('/index.html')) {
    return `${BASE_URL}/${normalized.replace(/\/index\.html$/, '/')}`;
  }
  if (normalized.endsWith('.html')) {
    return `${BASE_URL}/${normalized.replace(/\.html$/, '/')}`;
  }
  return null;
}

/**
 * Load all canonical URLs from sitemap.txt
 */
function getAllSitemapUrls() {
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.txt');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('sitemap.txt not found. Please run "npm run build:sitemap" first.');
  }
  return fs.readFileSync(sitemapPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith(BASE_URL));
}

/**
 * Detect changed URLs using git diff
 */
function detectChangedUrls(sinceCommit) {
  const changedUrls = new Set();

  try {
    let diffCommand = '';
    const eventPath = process.env.GITHUB_EVENT_PATH;

    if (sinceCommit) {
      diffCommand = `git diff --name-status ${sinceCommit} HEAD`;
    } else if (eventPath && fs.existsSync(eventPath)) {
      try {
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        const before = eventData.before;
        const after = eventData.after;
        if (before && after && !/^0+$/.test(before)) {
          diffCommand = `git diff --name-status ${before} ${after}`;
        }
      } catch (e) {
        // Fallback to git log
      }
    }

    if (!diffCommand) {
      // Default to last commit diff
      diffCommand = 'git diff --name-status HEAD~1 HEAD';
    }

    console.log(`[IndexNow] Running diff check: ${diffCommand}`);
    const output = execSync(diffCommand, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) continue;
      const status = parts[0];
      const filePath = parts[1];

      // Check if file is excluded
      const isExcluded = EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath));
      if (isExcluded || !filePath.endsWith('.html')) continue;

      const fullPath = path.join(ROOT_DIR, filePath);

      if (status.startsWith('D')) {
        // Deleted page URL
        const deletedUrl = pathToUrl(filePath);
        if (deletedUrl) {
          console.log(`[IndexNow] Detected deleted page: ${deletedUrl}`);
          changedUrls.add(deletedUrl);
        }
      } else {
        // Added or Modified page
        const canonical = getCanonicalFromFile(fullPath) || pathToUrl(filePath);
        if (canonical && canonical.startsWith(BASE_URL)) {
          console.log(`[IndexNow] Detected changed page: ${canonical} (${status})`);
          changedUrls.add(canonical);
        }
      }
    }
  } catch (err) {
    console.warn(`[IndexNow] Note: Git diff check unavailable (${err.message.split('\n')[0]}).`);
  }

  return Array.from(changedUrls);
}

/**
 * Send POST request to IndexNow API
 */
async function submitToIndexNow(urlList, isDryRun = false) {
  if (!urlList || urlList.length === 0) {
    console.log('[IndexNow] 0 URLs to submit. Nothing to do.');
    return { success: true, count: 0 };
  }

  // Deduplicate and filter URLs
  const cleanUrls = Array.from(new Set(urlList)).filter(url => {
    return typeof url === 'string' &&
      url.startsWith(BASE_URL) &&
      !url.includes('404') &&
      !url.includes('.txt');
  });

  if (cleanUrls.length === 0) {
    console.log('[IndexNow] No eligible canonical URLs to submit.');
    return { success: true, count: 0 };
  }

  console.log(`\n--- IndexNow Submission Details ---`);
  console.log(`Host:         ${HOST}`);
  console.log(`Key:          ${maskKey(KEY)}`);
  console.log(`Key Location: ${KEY_LOCATION}`);
  console.log(`Total URLs:   ${cleanUrls.length}`);
  console.log(`Endpoint:     ${INDEXNOW_ENDPOINT}`);
  console.log(`URLs to be submitted:`);
  cleanUrls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  if (isDryRun) {
    console.log(`\n[DRY RUN] Skipping actual HTTP POST request.`);
    return { success: true, count: cleanUrls.length, dryRun: true };
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: cleanUrls
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'ImgPDF-IndexNow-Client/1.0'
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const statusText = response.statusText;
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (_) {}

    console.log(`\n[IndexNow Response] HTTP ${status} ${statusText}`);
    if (responseText) {
      console.log(`Response message: ${responseText}`);
    }

    if (status === 200) {
      console.log(`✔ SUCCESS: ${cleanUrls.length} URL(s) submitted successfully to IndexNow!`);
      return { success: true, count: cleanUrls.length, status };
    } else if (status === 202) {
      console.log(`✔ ACCEPTED (HTTP 202): IndexNow received ${cleanUrls.length} URL(s). Key verification / queueing in progress.`);
      return { success: true, count: cleanUrls.length, status };
    } else if (status === 400) {
      console.error(`✖ ERROR 400: Invalid format or missing parameters in request payload.`);
      return { success: false, status, message: responseText };
    } else if (status === 403) {
      console.error(`✖ ERROR 403: Key not valid or keyLocation (${KEY_LOCATION}) not verified on live site.`);
      return { success: false, status, message: responseText };
    } else if (status === 422) {
      console.error(`✖ ERROR 422: URLs do not belong to host ${HOST} or key mismatch.`);
      return { success: false, status, message: responseText };
    } else if (status === 429) {
      console.warn(`⚠ WARNING 429: Too many requests. Rate limit encountered.`);
      return { success: false, status, message: responseText };
    } else {
      console.warn(`⚠ Notice: Received unexpected response HTTP ${status}.`);
      return { success: false, status, message: responseText };
    }
  } catch (netErr) {
    console.error(`✖ Network error connecting to IndexNow:`, netErr.message);
    // Return gracefully so deployment pipeline is not halted by temporary third-party API outage
    return { success: false, error: netErr.message };
  }
}

/**
 * Main execution handler
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isAll = args.includes('--all');
  const urlsIndex = args.indexOf('--urls');
  const sinceIndex = args.indexOf('--since');

  console.log('=== ImgPDF IndexNow Protocol Client ===');

  // 1. Verify key file
  try {
    verifyKeyFile();
    console.log(`✔ Verification key verified: ${maskKey(KEY)} (${KEY}.txt)`);
  } catch (err) {
    console.error(`✖ Key verification failed:`, err.message);
    process.exit(1);
  }

  let urlsToSubmit = [];

  if (isAll) {
    console.log('[Mode: All] Loading all canonical URLs from sitemap.txt...');
    urlsToSubmit = getAllSitemapUrls();
  } else if (urlsIndex !== -1 && args[urlsIndex + 1]) {
    console.log('[Mode: Explicit URLs] Submitting specified URLs...');
    urlsToSubmit = args[urlsIndex + 1].split(',').map(u => u.trim());
  } else {
    console.log('[Mode: Changed Only] Detecting newly published, modified, or deleted URLs...');
    const sinceCommit = sinceIndex !== -1 ? args[sinceIndex + 1] : null;
    urlsToSubmit = detectChangedUrls(sinceCommit);
  }

  if (urlsToSubmit.length === 0) {
    console.log('\n✔ No changed canonical URLs detected. No submission needed.');
    console.log('(To force-submit all website pages, run: node scripts/submit-indexnow.js --all)');
    process.exit(0);
  }

  const result = await submitToIndexNow(urlsToSubmit, isDryRun);

  if (result.success) {
    console.log('\n--- IndexNow processing finished successfully ---');
    process.exit(0);
  } else {
    // If it is a 403 or network error on non-live dev environments, warn but exit 0 to preserve build
    console.warn('\n--- IndexNow finished with notice (check details above) ---');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal IndexNow runner error:', err);
  process.exit(1);
});
