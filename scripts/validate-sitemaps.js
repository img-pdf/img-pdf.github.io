import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'https://img-pdf.github.io';

const EXPECTED_XML_SITEMAP = 'https://img-pdf.github.io/sitemap.xml';
const EXPECTED_TXT_SITEMAP = 'https://img-pdf.github.io/sitemap.txt';

let errors = [];
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
    console.error(`  \u2718 FAIL: ${message}`);
  } else {
    passed++;
  }
}

console.log('=== STARTING AUTOMATED SITEMAP & ROBOTS VALIDATION ===\n');

// 1. Verify robots.txt
console.log('1. Validating robots.txt...');
const robotsPath = path.join(ROOT_DIR, 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt file must exist in repository root');

if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(
    robotsContent.includes(`Sitemap: ${EXPECTED_XML_SITEMAP}`),
    `robots.txt must contain "Sitemap: ${EXPECTED_XML_SITEMAP}"`
  );
  assert(
    robotsContent.includes(`Sitemap: ${EXPECTED_TXT_SITEMAP}`),
    `robots.txt must contain "Sitemap: ${EXPECTED_TXT_SITEMAP}"`
  );
  assert(
    robotsContent.includes('User-agent: *'),
    'robots.txt must contain "User-agent: *"'
  );
  assert(
    robotsContent.includes('Allow: /'),
    'robots.txt must contain "Allow: /"'
  );
}

// 2. Verify sitemap.txt
console.log('\n2. Validating sitemap.txt...');
const txtPath = path.join(ROOT_DIR, 'sitemap.txt');
assert(fs.existsSync(txtPath), 'sitemap.txt must exist in repository root');

let txtUrls = [];
if (fs.existsSync(txtPath)) {
  const txtRaw = fs.readFileSync(txtPath);
  
  // Check BOM
  assert(!txtRaw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), 'sitemap.txt must not contain a UTF-8 BOM');

  const txtContent = txtRaw.toString('utf8');
  txtUrls = txtContent.trim().split('\n').map(l => l.trim()).filter(Boolean);
  
  assert(txtUrls.length > 0, 'sitemap.txt must contain at least 1 URL');

  // Check uniqueness
  const uniqueTxtUrls = new Set(txtUrls);
  assert(uniqueTxtUrls.size === txtUrls.length, `sitemap.txt contains duplicates: ${txtUrls.length} lines vs ${uniqueTxtUrls.size} unique`);

  // Check valid HTTPS and canonical domain
  for (const u of txtUrls) {
    assert(u.startsWith(BASE_URL), `URL in sitemap.txt must start with ${BASE_URL}: "${u}"`);
    assert(!u.includes(' '), `URL in sitemap.txt must not contain whitespace: "${u}"`);
    assert(!u.includes('<') && !u.includes('>'), `URL in sitemap.txt must not contain HTML/XML tags: "${u}"`);
  }
}

// 3. Verify sitemap.xml
console.log('\n3. Validating sitemap.xml...');
const xmlPath = path.join(ROOT_DIR, 'sitemap.xml');
assert(fs.existsSync(xmlPath), 'sitemap.xml must exist in repository root');

let xmlUrls = [];
if (fs.existsSync(xmlPath)) {
  const xmlRaw = fs.readFileSync(xmlPath);
  assert(!xmlRaw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), 'sitemap.xml must not contain a UTF-8 BOM');

  const xmlContent = xmlRaw.toString('utf8');
  assert(xmlContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml must begin with XML 1.0 declaration');
  assert(xmlContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml must have correct sitemaps.org namespace');
  assert(xmlContent.endsWith('</urlset>\n') || xmlContent.endsWith('</urlset>'), 'sitemap.xml must properly close </urlset>');

  // Check for illegal unescaped characters in XML
  assert(!xmlContent.includes(' & ') && !xmlContent.includes(' &<'), 'sitemap.xml must not contain unescaped ampersands');
  assert(!xmlContent.includes('<!--'), 'sitemap.xml must avoid comments inside urlset for strict schema compliance');

  const locMatches = [...xmlContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  xmlUrls = locMatches;
  assert(xmlUrls.length > 0, 'sitemap.xml must contain at least 1 <loc> element');

  const uniqueXmlUrls = new Set(xmlUrls);
  assert(uniqueXmlUrls.size === xmlUrls.length, `sitemap.xml contains duplicates: ${xmlUrls.length} entries vs ${uniqueXmlUrls.size} unique`);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const lastmodMatches = [...xmlContent.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1].trim());
  for (const d of lastmodMatches) {
    assert(dateRegex.test(d), `lastmod "${d}" must strictly match YYYY-MM-DD format`);
  }
}

// 4. Parity check between XML and TXT
console.log('\n4. Checking 1:1 Parity between XML and TXT sitemaps...');
assert(
  xmlUrls.length === txtUrls.length,
  `URL count mismatch: sitemap.xml has ${xmlUrls.length}, sitemap.txt has ${txtUrls.length}`
);

if (xmlUrls.length === txtUrls.length) {
  let mismatches = 0;
  for (let i = 0; i < xmlUrls.length; i++) {
    if (xmlUrls[i] !== txtUrls[i]) {
      mismatches++;
      errors.push(`URL order/value mismatch at row ${i + 1}: XML="${xmlUrls[i]}", TXT="${txtUrls[i]}"`);
    }
  }
  assert(mismatches === 0, `Found ${mismatches} URL mismatches between XML and TXT sitemaps`);
}

// 5. Verify that every URL corresponds to a real, indexable physical file
console.log('\n5. Verifying physical existence and indexability of every URL on disk...');
for (const u of xmlUrls) {
  const route = u.replace(BASE_URL, '').replace(/^\//, '');
  let expectedFile;
  if (route === '') {
    expectedFile = path.join(ROOT_DIR, 'index.html');
  } else if (route.endsWith('/')) {
    expectedFile = path.join(ROOT_DIR, route, 'index.html');
  } else {
    expectedFile = path.join(ROOT_DIR, route);
  }

  const exists = fs.existsSync(expectedFile);
  assert(exists, `URL "${u}" does not correspond to an existing file: expected "${path.relative(ROOT_DIR, expectedFile)}"`);

  if (exists) {
    const fileContent = fs.readFileSync(expectedFile, 'utf8');
    const hasNoIndex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(fileContent);
    assert(!hasNoIndex, `URL "${u}" is listed in sitemap but contains a "noindex" meta tag`);

    // Verify canonical tag matches
    const canonicalMatch = fileContent.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    assert(canonicalMatch !== null, `URL "${u}" file is missing a canonical link tag`);
    if (canonicalMatch) {
      assert(
        canonicalMatch[1].trim() === u,
        `URL "${u}" canonical tag points to "${canonicalMatch[1]}" instead of itself`
      );
    }
  }
}

// 6. Final report and process exit
console.log('\n=== VALIDATION SUMMARY ===');
console.log(`Checks passed: ${passed}`);
console.log(`Errors found:  ${errors.length}`);

if (errors.length > 0) {
  console.error('\n\u2718 SITEMAP VALIDATION FAILED WITH THE FOLLOWING ERRORS:');
  errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
  process.exit(1);
} else {
  console.log(`\n\u2714 ALL SITEMAP AND ROBOTS CHECKS PASSED SUCCESSFULLY (${xmlUrls.length} URLs validated)!`);
  process.exit(0);
}
