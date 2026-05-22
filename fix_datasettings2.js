/**
 * fix_datasettings2.js — Fix data-settings JSON image URLs using simple string replacement.
 * The URLs in the file look like:
 *   the-smart-traveller.com\/wp-content\/uploads\/2026\/04\/כותרת-1.png
 * (where \/ and \uXXXX are LITERAL characters in the file, not JS escapes)
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

function decodeJsonUnicode(str) {
  // Decode \uXXXX sequences (where \ is a literal backslash in the string)
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function uploadsToLocal(year, month, rawFilename, pre) {
  const filename = decodeJsonUnicode(rawFilename);
  const localName = year + '_' + month + '_' + filename;
  const found = imageIndex[localName.toLowerCase()];
  if (found) return pre + 'assets/images/' + found;
  return pre + 'assets/images/' + localName;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return resolve('exists');
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0' } };
    function get(u) {
      https.get(u, options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) { file.close(); return get(res.headers.location); }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(res.statusCode); });
      }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    }
    get(url);
  });
}

async function run() {
  // Collect unique image filenames to download
  const toDownload = new Map();
  for (const file of allHtmlFiles(ROOT)) {
    const html = fs.readFileSync(file, 'utf8');
    let pos = 0;
    while (true) {
      const idx = html.indexOf('the-smart-traveller.com\\/wp-content\\/uploads\\/', pos);
      if (idx === -1) break;
      // Extract year/month/filename from the path
      // Format: ...uploads\/YYYY\/MM\/FILENAME
      const afterUploads = html.substring(idx + 47); // skip 'the-smart-traveller.com\/wp-content\/uploads\/'
      const yearMatch = afterUploads.match(/^(\d{4})\\\/(\d{2})\\\/([^\s&"<]+)/);
      if (yearMatch) {
        const [, year, month, rawFilename] = yearMatch;
        const filename = decodeJsonUnicode(rawFilename);
        const localName = year + '_' + month + '_' + filename;
        if (!imageIndex[localName.toLowerCase()] && !toDownload.has(localName)) {
          toDownload.set(localName, { year, month, filename });
        }
      }
      pos = idx + 1;
    }
  }

  console.log('Images to download:', toDownload.size);
  for (const [localName, { year, month, filename }] of toDownload) {
    const url = 'https://the-smart-traveller.com/wp-content/uploads/' + year + '/' + month + '/' + encodeURIComponent(filename);
    const dest = path.join(ROOT, 'assets', 'images', localName);
    try {
      const result = await download(url, dest);
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      console.log((result === 'exists' ? 'Exists' : 'Downloaded') + ': ' + localName + ' (' + Math.round(size/1024) + 'KB)');
      if (size > 0) imageIndex[localName.toLowerCase()] = localName;
    } catch(e) {
      console.error('Failed:', localName, '-', e.message);
    }
  }

  // Fix all HTML files
  let totalFixed = 0, totalFiles = 0;
  for (const file of allHtmlFiles(ROOT)) {
    const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
    const pre = depth === 0 ? '' : '../';
    let html = fs.readFileSync(file, 'utf8');
    let count = 0;

    // Replace: https:\/\/the-smart-traveller.com\/wp-content\/uploads\/YYYY\/MM\/FILENAME
    // The backslashes in the file are literal \ chars, and in JS string they stay as \
    let result = '';
    let pos = 0;
    const DOMAIN_PATTERN = 'https:\\/\\/the-smart-traveller.com\\/wp-content\\/uploads\\/';
    while (true) {
      const idx = html.indexOf(DOMAIN_PATTERN, pos);
      if (idx === -1) { result += html.substring(pos); break; }
      result += html.substring(pos, idx);
      const afterUploads = html.substring(idx + DOMAIN_PATTERN.length);
      const yearMatch = afterUploads.match(/^(\d{4})\\\/(\d{2})\\\/([^\s&"<]+)/);
      if (yearMatch) {
        const [matched, year, month, rawFilename] = yearMatch;
        const local = uploadsToLocal(year, month, rawFilename, pre);
        result += local;
        pos = idx + DOMAIN_PATTERN.length + matched.length;
        count++;
      } else {
        result += html[idx];
        pos = idx + 1;
      }
    }
    html = result;

    if (count > 0) {
      fs.writeFileSync(file, html, 'utf8');
      totalFixed += count;
      totalFiles++;
      console.log('  Fixed ' + count + ' in: ' + path.relative(ROOT, file));
    }
  }
  console.log('\n✓ Fixed ' + totalFixed + ' data-settings URLs across ' + totalFiles + ' files.');
}

run().catch(console.error);
