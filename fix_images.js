/**
 * fix_images.js — Fix all broken image paths across all HTML files.
 *
 * Handles three patterns:
 *  1. style="background-image: url(index.htmlwp-content/uploads/...)"
 *  2. src="index.htmlwp-content/uploads/..." (and ../index.html...)
 *  3. data-settings JSON with "https:\/\/the-smart-traveller.com\/wp-content\/uploads\/..."
 *
 * Converts all wp-content/uploads/YYYY/MM/filename  →  assets/images/YYYY_MM_filename
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

// Build index of available local images (filename → local path)
const imageIndex = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets', 'images'))) {
  imageIndex[f.toLowerCase()] = f;
}

/**
 * Given a wp-content/uploads/YYYY/MM/filename path, return the local asset path.
 * pre = '' for root pages, '../' for depth-1 pages.
 */
function uploadsToLocal(uploadsPath, pre) {
  const m = uploadsPath.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/(.+)/i);
  if (!m) return null;
  const [, year, month, filename] = m;
  const localName = year + '_' + month + '_' + filename;
  // Try exact match first, then lowercase
  const found = imageIndex[localName] || imageIndex[localName.toLowerCase()];
  if (found) return pre + 'assets/images/' + found;
  // File not downloaded – return the path anyway (might be a resized variant we don't have)
  return pre + 'assets/images/' + localName;
}

const files = allHtmlFiles(ROOT);
let totalFixed = 0;
let totalFiles = 0;

for (const file of files) {
  const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
  const pre = depth === 0 ? '' : '../';

  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // ── 1. Fix url() in style attributes: url(index.htmlwp-content/...) ─────────
  html = html.replace(/url\((['"]?)(?:(?:\.\.\/)*index\.html)(wp-content\/uploads\/[^)'"\s]+)\1\)/gi, (match, q, uploadsPath) => {
    const local = uploadsToLocal(uploadsPath, pre);
    if (!local) return match;
    count++;
    return `url(${q}${local}${q})`;
  });

  // ── 2. Fix url() still pointing to the domain ────────────────────────────────
  html = html.replace(/url\((['"]?)https?:\/\/the-smart-traveller\.com\/(wp-content\/uploads\/[^)'"\s]+)\1\)/gi, (match, q, uploadsPath) => {
    const local = uploadsToLocal(uploadsPath, pre);
    if (!local) return match;
    count++;
    return `url(${q}${local}${q})`;
  });

  // ── 3. Fix src/data-src/data-large_image/data-bg attributes ─────────────────
  html = html.replace(/((?:src|data-src|data-large_image|data-bg|data-srcset)=["'])(?:(?:\.\.\/)*index\.html)(wp-content\/uploads\/[^"'\s,]+)(["'])/gi, (match, attr, uploadsPath, end) => {
    const local = uploadsToLocal(uploadsPath, pre);
    if (!local) return match;
    count++;
    return attr + local + end;
  });

  // ── 4. Fix src/data attrs still pointing to the domain ──────────────────────
  html = html.replace(/((?:src|data-src|data-large_image|data-bg)=["'])https?:\/\/the-smart-traveller\.com\/(wp-content\/uploads\/[^"'\s]+)(["'])/gi, (match, attr, uploadsPath, end) => {
    const local = uploadsToLocal(uploadsPath, pre);
    if (!local) return match;
    count++;
    return attr + local + end;
  });

  // ── 5. Fix data-settings JSON: escaped domain URLs ───────────────────────────
  // Pattern: "url":"https:\/\/the-smart-traveller.com\/wp-content\/uploads\/YYYY\/MM\/file"
  html = html.replace(/"url"\s*:\s*"https?:\\\/\\\/the-smart-traveller\.com\\\/wp-content\\\/uploads\\\/(\d{4})\\\/(\d{2})\\\/([^"\\]+)"/gi, (match, year, month, filename) => {
    const localName = year + '_' + month + '_' + filename;
    const found = imageIndex[localName] || imageIndex[localName.toLowerCase()];
    const localFile = found || localName;
    const localUrl = pre + 'assets/images/' + localFile;
    count++;
    return '"url":"' + localUrl + '"';
  });

  // ── 6. Fix data-settings JSON: other image fields (id, width, height are ok) –
  // Also fix "src" inside JSON data-settings
  html = html.replace(/"src"\s*:\s*"https?:\\\/\\\/the-smart-traveller\.com\\\/wp-content\\\/uploads\\\/(\d{4})\\\/(\d{2})\\\/([^"\\]+)"/gi, (match, year, month, filename) => {
    const localName = year + '_' + month + '_' + filename;
    const found = imageIndex[localName] || imageIndex[localName.toLowerCase()];
    const localFile = found || localName;
    const localUrl = pre + 'assets/images/' + localFile;
    count++;
    return '"src":"' + localUrl + '"';
  });

  // ── 7. Fix data-settings: sizes array URLs ───────────────────────────────────
  html = html.replace(/https?:\\\/\\\/the-smart-traveller\.com\\\/wp-content\\\/uploads\\\/(\d{4})\\\/(\d{2})\\\/([^"\\,\s]+)/gi, (match, year, month, filename) => {
    const localName = year + '_' + month + '_' + filename;
    const found = imageIndex[localName] || imageIndex[localName.toLowerCase()];
    const localFile = found || localName;
    count++;
    return pre + 'assets/images/' + localFile;
  });

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    totalFixed += count;
    totalFiles++;
    console.log(`  Fixed ${count} image refs in: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\n✓ Fixed ${totalFixed} broken image references across ${totalFiles} files.`);
