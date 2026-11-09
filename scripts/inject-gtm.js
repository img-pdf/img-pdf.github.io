/**
 * inject-gtm.js
 * Injects Google Tag Manager (container: GTM-MH56QT6Z) into all public HTML pages of ImgPDF.
 * Follows the official Google Tag Manager installation specification:
 * - Head snippet as high as possible in <head>
 * - Noscript iframe immediately after opening <body>
 */

import fs from 'node:fs';
import path from 'node:path';

const GTM_CONTAINER_ID = 'GTM-MH56QT6Z';

const GTM_HEAD_SNIPPET = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');</script>
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
console.log(`Found ${htmlFiles.length} HTML files to inspect.`);

let updatedCount = 0;
let alreadyInstalledCount = 0;

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(GTM_CONTAINER_ID)) {
    alreadyInstalledCount++;
    return;
  }

  // 1. Inject into <head>
  if (content.includes('<head>\n')) {
    content = content.replace('<head>\n', '<head>\n' + GTM_HEAD_SNIPPET);
  } else if (content.includes('<head>')) {
    content = content.replace('<head>', '<head>\n' + GTM_HEAD_SNIPPET);
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

console.log(`Updated: ${updatedCount} files.`);
console.log(`Already installed: ${alreadyInstalledCount} files.`);

// Verification step
let verificationErrors = 0;
htmlFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = (content.match(new RegExp(GTM_CONTAINER_ID, 'g')) || []).length;
  if (matches !== 2) {
    console.error(`VERIFICATION FAILED for ${filePath}: found ${matches} occurrences of ${GTM_CONTAINER_ID} (expected 2)`);
    verificationErrors++;
  }
});

if (verificationErrors === 0) {
  console.log(`✔ SUCCESS: All ${htmlFiles.length} HTML files verified with exactly 2 GTM instances (head + body noscript).`);
} else {
  console.error(`✖ FAILED: ${verificationErrors} files failed verification.`);
  process.exit(1);
}
