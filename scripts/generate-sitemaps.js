import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'https://img-pdf.github.io';

// Directories and files to explicitly ignore
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.aistudio',
  'scripts',
  'assets'
]);

const IGNORED_FILES = new Set([
  '404.html'
]);

/**
 * Scan directory recursively for all candidate HTML files
 */
function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        results = results.concat(findHtmlFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      // Exclude verification files (google, yandex) and 404
      if (
        !IGNORED_FILES.has(entry.name) &&
        !entry.name.startsWith('google') &&
        !entry.name.startsWith('yandex')
      ) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Parse HTML file, check eligibility, extract canonical URL and lastmod
 */
function inspectHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT_DIR, filePath);

  // 1. Check for noindex directive
  const robotsMatch = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  if (robotsMatch && robotsMatch[1].toLowerCase().includes('noindex')) {
    console.log(`[SKIP] ${relPath} contains noindex directive.`);
    return null;
  }

  // 2. Extract canonical URL
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) {
    throw new Error(`[ERROR] Missing canonical URL in ${relPath}`);
  }

  const canonicalUrl = canonicalMatch[1].trim();

  // Validate URL format
  if (!canonicalUrl.startsWith(BASE_URL)) {
    throw new Error(`[ERROR] Canonical URL "${canonicalUrl}" in ${relPath} does not match base domain ${BASE_URL}`);
  }

  // 3. Extract truthful file modification date (YYYY-MM-DD)
  const stat = fs.statSync(filePath);
  const lastmod = stat.mtime.toISOString().split('T')[0];

  // 4. Determine priority and changefreq based on URL structure
  const urlPath = canonicalUrl.replace(BASE_URL, '');
  let priority = '0.8';
  let changefreq = 'monthly';

  if (urlPath === '' || urlPath === '/') {
    priority = '1.0';
    changefreq = 'weekly';
  } else if (
    urlPath.startsWith('/image-tools/') ||
    urlPath.startsWith('/pdf-tools/')
  ) {
    // If it is a hub index page
    if (urlPath === '/image-tools/' || urlPath === '/pdf-tools/') {
      priority = '0.8';
      changefreq = 'weekly';
    } else {
      priority = '0.9';
      changefreq = 'monthly';
    }
  } else if (urlPath.startsWith('/guides/')) {
    if (urlPath === '/guides/') {
      priority = '0.8';
      changefreq = 'weekly';
    } else {
      priority = '0.8';
      changefreq = 'monthly';
    }
  } else if (urlPath.startsWith('/blog/')) {
    if (
      urlPath === '/blog/' ||
      urlPath === '/blog/pdf-guides/' ||
      urlPath === '/blog/image-guides/' ||
      urlPath === '/blog/document-guides/'
    ) {
      priority = '0.8';
      changefreq = 'weekly';
    } else {
      priority = '0.8';
      changefreq = 'monthly';
    }
  } else if (
    urlPath.startsWith('/utilities/') ||
    urlPath.startsWith('/developer-tools/') ||
    urlPath.startsWith('/text-tools/')
  ) {
    if (
      urlPath === '/utilities/' ||
      urlPath === '/developer-tools/' ||
      urlPath === '/text-tools/'
    ) {
      priority = '0.8';
      changefreq = 'weekly';
    } else {
      priority = '0.8';
      changefreq = 'monthly';
    }
  } else if (urlPath === '/about/' || urlPath === '/contact/') {
    priority = '0.6';
    changefreq = 'monthly';
  } else if (urlPath === '/privacy/' || urlPath === '/terms/') {
    priority = '0.5';
    changefreq = 'monthly';
  }

  return {
    relPath,
    loc: canonicalUrl,
    lastmod,
    changefreq,
    priority
  };
}

/**
 * Custom sort to ensure clean, structured sitemap ordering:
 * 1. Home
 * 2. Image Tools
 * 3. PDF Tools
 * 4. Guides
 * 5. Blog
 * 6. Utilities
 * 7. Developer Tools
 * 8. Text Tools
 * 9. Trust pages (About, Contact, Privacy, Terms)
 */
function sortPages(a, b) {
  const getOrderWeight = (url) => {
    const p = url.replace(BASE_URL, '');
    if (p === '/' || p === '') return 10;
    if (p === '/image-tools/') return 20;
    if (p.startsWith('/image-tools/')) return 25;
    if (p === '/pdf-tools/') return 30;
    if (p.startsWith('/pdf-tools/')) return 35;
    if (p === '/guides/') return 40;
    if (p.startsWith('/guides/')) return 45;
    if (p === '/blog/') return 46;
    if (p.startsWith('/blog/')) return 48;
    if (p === '/utilities/') return 50;
    if (p.startsWith('/utilities/')) return 55;
    if (p === '/developer-tools/') return 60;
    if (p.startsWith('/developer-tools/')) return 65;
    if (p === '/text-tools/') return 70;
    if (p.startsWith('/text-tools/')) return 75;
    if (p === '/about/') return 80;
    if (p === '/contact/') return 85;
    if (p === '/privacy/') return 90;
    if (p === '/terms/') return 95;
    return 100;
  };

  const weightA = getOrderWeight(a.loc);
  const weightB = getOrderWeight(b.loc);

  if (weightA !== weightB) {
    return weightA - weightB;
  }
  return a.loc.localeCompare(b.loc);
}

/**
 * Main generator execution
 */
function main() {
  console.log('--- Generating Dual Sitemaps (XML & TXT) for ImgPDF ---');

  const htmlFiles = findHtmlFiles(ROOT_DIR);
  console.log(`Found ${htmlFiles.length} candidate HTML files in workspace.`);

  const pages = [];
  const seenUrls = new Set();

  for (const file of htmlFiles) {
    const pageInfo = inspectHtmlFile(file);
    if (!pageInfo) continue;

    if (seenUrls.has(pageInfo.loc)) {
      throw new Error(`[ERROR] Duplicate canonical URL detected: ${pageInfo.loc} (from ${pageInfo.relPath})`);
    }

    seenUrls.add(pageInfo.loc);
    pages.push(pageInfo);
  }

  // Sort pages
  pages.sort(sortPages);

  console.log(`Verified ${pages.length} unique, canonical, indexable pages.`);

  // 1. Build sitemap.xml
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of pages) {
    xml += '  <url>\n';
    xml += `    <loc>${page.loc}</loc>\n`;
    xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  // 2. Build sitemap.txt
  const txt = pages.map(p => p.loc).join('\n') + '\n';

  // Write outputs (both lowercase canonical and uppercase fallback)
  const xmlPath = path.join(ROOT_DIR, 'sitemap.xml');
  const xmlUpperPath = path.join(ROOT_DIR, 'Sitemap.xml');
  const txtPath = path.join(ROOT_DIR, 'sitemap.txt');
  const txtUpperPath = path.join(ROOT_DIR, 'Sitemap.txt');

  fs.writeFileSync(xmlPath, xml, 'utf8');
  fs.writeFileSync(xmlUpperPath, xml, 'utf8');
  fs.writeFileSync(txtPath, txt, 'utf8');
  fs.writeFileSync(txtUpperPath, txt, 'utf8');

  console.log(`\u2714 Generated sitemap.xml (${Buffer.byteLength(xml, 'utf8')} bytes, ${pages.length} URLs)`);
  console.log(`\u2714 Generated Sitemap.xml (${Buffer.byteLength(xml, 'utf8')} bytes)`);
  console.log(`\u2714 Generated sitemap.txt (${Buffer.byteLength(txt, 'utf8')} bytes, ${pages.length} URLs)`);
  console.log(`\u2714 Generated Sitemap.txt (${Buffer.byteLength(txt, 'utf8')} bytes)`);
  console.log('--- Dual Sitemap generation completed successfully ---');
}

main();
