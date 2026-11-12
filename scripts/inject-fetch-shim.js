/**
 * scripts/inject-fetch-shim.js
 * Injects a robust Window.fetch setter compatibility shim immediately after <head>
 * across all public HTML pages.
 *
 * Prevents "TypeError: Cannot set property fetch of #<Window> which has only a getter"
 * when extensions, test executors, or proxies assign `window.fetch = ...`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const FETCH_SHIM = `<script>
(function(){try{var f=window.fetch;Object.defineProperty(window,"fetch",{get:function(){return f},set:function(v){f=v},configurable:true,enumerable:true});if(typeof Window!=="undefined"&&Window.prototype){Object.defineProperty(Window.prototype,"fetch",{get:function(){return f},set:function(v){f=v},configurable:true,enumerable:true})}}catch(e){}})();
</script>\n`;

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.aistudio') {
        results = results.concat(walkDir(fullPath));
      }
    } else if (file.endsWith('.html') && !file.startsWith('google') && !file.startsWith('yandex')) {
      results.push(fullPath);
    }
  }
  return results;
}

export function injectFetchShimAll() {
  const htmlFiles = walkDir(ROOT_DIR);
  let updated = 0;

  for (const filePath of htmlFiles) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already contains fetch shim
    if (content.includes('Object.defineProperty(window,"fetch"') || content.includes("Object.defineProperty(window, 'fetch'")) {
      continue;
    }

    if (content.includes('<head>\n')) {
      content = content.replace('<head>\n', '<head>\n' + FETCH_SHIM);
    } else if (content.includes('<head>')) {
      content = content.replace('<head>', '<head>\n' + FETCH_SHIM);
    } else {
      continue;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
  }

  console.log(`✔ Injected Window.fetch compatibility shim into ${updated} HTML files.`);
}

if (process.argv[1] && process.argv[1].endsWith('inject-fetch-shim.js')) {
  injectFetchShimAll();
}
