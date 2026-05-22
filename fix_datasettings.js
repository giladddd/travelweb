/**
 * fix_datasettings.js — Fix all data-settings JSON image URLs still pointing to live domain.
 *
 * In the HTML, Elementor stores image data as JSON-in-HTML-attribute:
 *   data-settings="...&quot;url&quot;:&quot;https:\/\/the-smart-traveller.com\/wp-content\/uploads\/YYYY\/MM\/filename&quot;..."
 *
 * The actual characters in the file (raw UTF-8) look like:
 *   &quot;url&quot;:&quot;https:\/\/the-smart-traveller.com\/wp-content\/uploads\/2026\/04\/כ...-1.png&quot;
 *
 * We convert these to local asset paths.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs   = require('fs');
const path = require('path');
const https = require('https');

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

// Decode JSON unicode escapes like כ → כ
function decodeJsonUnicode(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

// Convert a wp-content/uploads path to local asset path
function uploadsToLocal(year, month, rawFilename, pre) {
  const filename = decodeJsonUnicode(rawFilename).replace(/\\\//g, '/').split('?')[0];
  const localName = year + '_' + month + '_' + filename;
  const found = imageIndex[localName.toLowerCase()];
  if (found) return pre + 'assets/images/' + found;
  return pre + 'assets/images/' + localName; // file may not exist but at least the path is correct
}

// Download a file from the live site
function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      return resolve('exists');
    }
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' } };
    function get(url) {
      https.get(url, options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close(); return get(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(res.statusCode); });
      }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    }
    get(url);
  });
}

// ── PASS 1: collect all missing images and download them ─────────────────────
const toDownload = new Map(); // localName → { year, month, filename }

for (const file of allHtmlFiles(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  // Pattern: the-smart-traveller.com\/wp-content\/uploads\/YYYY\/MM\/filename
  // In the JS string: backslash-forwardslash sequences appear as \/ (two chars)
  const pattern = /the-smart-traveller\.com\\\/wp-content\\\/uploads\\\/(\d{4})\\\/(\d{2})\\\/([^&"<\s\\]+(?:\\u[0-9a-fA-F]{4}[^&"<\s\\]*)*)/g;
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const [, year, month, rawFilename] = m;
    const filename = decodeJsonUnicode(rawFilename);
    const localName = year + '_' + month + '_' + filename;
    if (!imageIndex[localName.toLowerCase()]) {
      toDownload.set(localName, { year, month, filename });
    }
  }
}

async function run() {
  // Download missing images
  for (const [localName, { year, month, filename }] of toDownload) {
    const url = 'https://the-smart-traveller.com/wp-content/uploads/' + year + '/' + month + '/' + encodeURIComponent(filename);
    const dest = path.join(ROOT, 'assets', 'images', localName);
    try {
      const result = await download(url, dest);
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      console.log((result === 'exists' ? 'Exists' : 'Downloaded') + ': ' + localName + ' (' + Math.round(size/1024) + 'KB)');
      if (size > 0) imageIndex[localName.toLowerCase()] = localName;
    } catch(e) {
      console.error('Failed:', localName, e.message);
    }
  }

  // ── PASS 2: fix all data-settings URLs in HTML files ───────────────────────
  let totalFixed = 0, totalFiles = 0;

  for (const file of allHtmlFiles(ROOT)) {
    const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
    const pre = depth === 0 ? '' : '../';

    let html = fs.readFileSync(file, 'utf8');
    let count = 0;

    // Fix URLs: the-smart-traveller.com\/wp-content\/uploads\/YYYY\/MM\/filename
    html = html.replace(
      /https?:\\\/\\\/the-smart-traveller\.com\\\/wp-content\\\/uploads\\\/(\d{4})\\\/(\d{2})\\\/([^&"<\s\\]+(?:\\u[0-9a-fA-F]{4}[^&"<\s\\]*)*)/g,
      (match, year, month, rawFilename) => {
        const local = uploadsToLocal(year, month, rawFilename, pre);
        count++;
        return local;
      }
    );

    if (count > 0) {
      fs.writeFileSync(file, html, 'utf8');
      totalFixed += count;
      totalFiles++;
      console.log('  Fixed ' + count + ' data-settings URLs in: ' + path.relative(ROOT, file));
    }
  }

  console.log('\n✓ Fixed ' + totalFixed + ' data-settings image URLs across ' + totalFiles + ' files.');
  if (toDownload.size > 0) {
    console.log('  Downloaded ' + toDownload.size + ' missing images.');
  }
}

run().catch(console.error);
