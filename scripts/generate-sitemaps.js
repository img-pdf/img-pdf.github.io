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
 * Parse HTML file, check eligibility, extract canonical URL, alternates and lastmod
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

  // 3. Extract hreflang alternates if present
  const alternates = [];
  const hreflangRegex = /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["']/gi;
  let match;
  while ((match = hreflangRegex.exec(content)) !== null) {
    alternates.push({
      hreflang: match[1].trim(),
      href: match[2].trim()
    });
  }

  // 4. Extract truthful file modification date (YYYY-MM-DD)
  const stat = fs.statSync(filePath);
  const lastmod = stat.mtime.toISOString().split('T')[0];

  // 5. Determine priority and changefreq based on URL structure
  const urlPath = canonicalUrl.replace(BASE_URL, '');
  let priority = '0.8';
  let changefreq = 'monthly';

  if (urlPath === '' || urlPath === '/' || urlPath === '/en/' || urlPath === '/pt-br/') {
    priority = '1.0';
    changefreq = 'weekly';
  } else if (
    urlPath.startsWith('/en/compress-pdf/') ||
    urlPath.startsWith('/pt-br/comprimir-pdf/') ||
    urlPath.startsWith('/image-tools/') ||
    urlPath.startsWith('/pdf-tools/')
  ) {
    if (urlPath === '/image-tools/' || urlPath === '/pdf-tools/') {
      priority = '0.8';
      changefreq = 'weekly';
    } else {
      priority = '0.9';
      changefreq = 'monthly';
    }
  } else if (urlPath.startsWith('/guides/')) {
    priority = urlPath === '/guides/' ? '0.8' : '0.8';
    changefreq = urlPath === '/guides/' ? 'weekly' : 'monthly';
  } else if (urlPath.startsWith('/blog/')) {
    priority = '0.8';
    changefreq = 'monthly';
  } else if (
    urlPath.startsWith('/utilities/') ||
    urlPath.startsWith('/developer-tools/') ||
    urlPath.startsWith('/text-tools/')
  ) {
    priority = '0.8';
    changefreq = 'monthly';
  } else if (
    urlPath.includes('/about/') ||
    urlPath.includes('/sobre/') ||
    urlPath.includes('/contact/') ||
    urlPath.includes('/contato/')
  ) {
    priority = '0.6';
    changefreq = 'monthly';
  } else if (
    urlPath.includes('/privacy') ||
    urlPath.includes('/politica') ||
    urlPath.includes('/terms') ||
    urlPath.includes('/termos')
  ) {
    priority = '0.5';
    changefreq = 'monthly';
  }

  return {
    relPath,
    loc: canonicalUrl,
    alternates,
    lastmod,
    changefreq,
    priority
  };
}

/**
 * Custom sort to ensure clean, structured sitemap ordering:
 * 1. Home (/, /en/, /pt-br/)
 * 2. High-value tools (/en/compress-pdf/, /pt-br/comprimir-pdf/, /image-tools/, /pdf-tools/)
 * 3. Guides & Blog
 * 4. Utilities
 * 5. Trust & Legal
 */
function sortPages(a, b) {
  const getOrderWeight = (url) => {
    const p = url.replace(BASE_URL, '');
    if (p === '/' || p === '') return 10;
    if (p === '/en/') return 11;
    if (p === '/pt-br/') return 12;

    if (p === '/en/compress-pdf/') return 21;
    if (p === '/pt-br/comprimir-pdf/') return 22;

    if (p === '/image-tools/') return 25;
    if (p.startsWith('/image-tools/')) return 26;
    if (p === '/pdf-tools/') return 28;
    if (p.startsWith('/pdf-tools/')) return 29;

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

    if (p.includes('/about') || p.includes('/sobre')) return 80;
    if (p.includes('/contact') || p.includes('/contato')) return 85;
    if (p.includes('/privacy') || p.includes('/politica')) return 90;
    if (p.includes('/terms') || p.includes('/termos')) return 95;

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
  console.log('--- Generating Multilingual Dual Sitemaps (XML & TXT) for ImgPDF ---');

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

  // 1. Build multilingual sitemap.xml with xhtml namespace
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const page of pages) {
    xml += '  <url>\n';
    xml += `    <loc>${page.loc}</loc>\n`;

    // Add alternate links if page has hreflang mappings
    if (page.alternates && page.alternates.length > 0) {
      for (const alt of page.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>\n`;
      }
    }

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

  console.log(`✔ Generated multilingual sitemap.xml (${Buffer.byteLength(xml, 'utf8')} bytes, ${pages.length} URLs)`);
  console.log(`✔ Generated Sitemap.xml (${Buffer.byteLength(xml, 'utf8')} bytes)`);
  console.log(`✔ Generated sitemap.txt (${Buffer.byteLength(txt, 'utf8')} bytes, ${pages.length} URLs)`);
  console.log(`✔ Generated Sitemap.txt (${Buffer.byteLength(txt, 'utf8')} bytes)`);
  console.log('--- Dual Sitemap generation completed successfully ---');
}

main();
