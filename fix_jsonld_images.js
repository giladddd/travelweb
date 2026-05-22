/**
 * fix_jsonld_images.js — Fix remaining index.htmlwp-content/uploads paths
 * in JSON-LD structured data and WooCommerce JS config blocks.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

function allHtmlFiles(dir) {
  const files = [];
  function walk(d) {
    fs.readdirSync(d).forEach(f => {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.html') && !f.includes('fix_')) files.push(full);
    });
  }
  walk(dir);
  return files;
}

const imageIndex = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets', 'images'))) {
  imageIndex[f.toLowerCase()] = f;
}

function fixUploadsPath(year, month, filename, pre) {
  const clean = filename.replace(/[?#].*$/, '');
  const localName = year + '_' + month + '_' + clean;
  const found = imageIndex[localName.toLowerCase()];
  return pre + 'assets/images/' + (found || localName);
}

let totalFixed = 0;

for (const file of allHtmlFiles(ROOT)) {
  const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
  const pre = depth === 0 ? '' : '../';
  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Fix: (../)?index.htmlwp-content/uploads/YYYY/MM/filename
  // These are the remaining ones in JSON-LD and JS config
  html = html.replace(
    /(?:\.\.\/)?index\.htmlwp-content\/uploads\/(\d{4})\/(\d{2})\/([^\s"'<\\)]+)/g,
    (match, year, month, filename) => {
      count++;
      return fixUploadsPath(year, month, filename, pre);
    }
  );

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    totalFixed += count;
    console.log('  Fixed ' + count + ' in: ' + path.relative(ROOT, file));
  }
}

console.log('\n✓ Fixed ' + totalFixed + ' JSON-LD/JS image paths.');
