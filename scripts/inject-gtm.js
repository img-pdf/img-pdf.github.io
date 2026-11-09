/**
 * inject-gtm.js
 * Injects and updates the Google Tag Manager / Google tag snippet (container: GTM-MH56QT6Z)
 * across all public HTML pages of ImgPDF.
 *
 * Current Google Tag / Google Tag Manager specification:
 * - Asynchronous Google Tag script immediately after <head>
 * - dataLayer and gtag initialization
 * - Noscript iframe immediately after opening <body>
 */

import fs from 'node:fs';
import path from 'node:path';

const GTM_CONTAINER_ID = 'GTM-MH56QT6Z';

const NEW_GTM_HEAD_SNIPPET = `<!-- Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
</script>
<!-- End Google Tag Manager -->\n`;

const GTM_BODY_SNIPPET = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->\n`;

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith('.html') && !file.startsWith('google') && !file.startsWith('yandex')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = walkDir('.');
console.log(`Inspecting ${htmlFiles.length} HTML files...`);

let updatedCount = 0;

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove any previous Google Tag Manager head comment and script block
  if (content.includes('<!-- Google Tag Manager -->')) {
    content = content.replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->\n?/g, '');
  }

  // Remove any previous noscript block
  if (content.includes('<!-- Google Tag Manager (noscript) -->')) {
    content = content.replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\n?/g, '');
  }

  // 1. Inject immediately after <head>
  if (content.includes('<head>\n')) {
    content = content.replace('<head>\n', '<head>\n' + NEW_GTM_HEAD_SNIPPET);
  } else if (content.includes('<head>')) {
    content = content.replace('<head>', '<head>\n' + NEW_GTM_HEAD_SNIPPET);
  } else {
    console.error(`ERROR: No <head> found in ${filePath}`);
    return;
  }

  // 2. Inject immediately after <body>
  if (content.includes('<body>\n')) {
    content = content.replace('<body>\n', '<body>\n' + GTM_BODY_SNIPPET);
  } else if (content.includes('<body>')) {
    content = content.replace('<body>', '<body>\n' + GTM_BODY_SNIPPET);
  } else {
    console.error(`ERROR: No <body> found in ${filePath}`);
    return;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  updatedCount++;
});

console.log(`Updated ${updatedCount} files.`);

// Verification step
let verificationErrors = 0;
htmlFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const headScriptCount = (content.match(/<script async src="https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-MH56QT6Z"><\/script>/g) || []).length;
  const gtagInitCount = (content.match(/gtag\('js', new Date\(\)\);/g) || []).length;
  const noscriptCount = (content.match(/<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-MH56QT6Z"/g) || []).length;

  if (headScriptCount !== 1) {
    console.error(`FAIL: ${filePath} has ${headScriptCount} head async scripts (expected 1)`);
    verificationErrors++;
  }
  if (gtagInitCount !== 1) {
    console.error(`FAIL: ${filePath} has ${gtagInitCount} gtag inits (expected 1)`);
    verificationErrors++;
  }
  if (noscriptCount !== 1) {
    console.error(`FAIL: ${filePath} has ${noscriptCount} noscripts (expected 1)`);
    verificationErrors++;
  }
});

if (verificationErrors === 0) {
  console.log(`✔ SUCCESS: All ${htmlFiles.length} HTML files verified with exactly 1 head script and 1 body noscript!`);
} else {
  console.error(`✖ FAILED: ${verificationErrors} errors found.`);
  process.exit(1);
}
