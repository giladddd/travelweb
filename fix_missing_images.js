/**
 * fix_missing_images.js — Download critical missing images from the live site
 * and fix thumbnail paths to use available full-size images as fallback.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const imgDir = path.join(ROOT, 'assets', 'images');

// Priority images to download (those that show on homepage and category pages)
const criticalImages = [
  // Category icons visible on homepage
  '2026/04/המטייל-החכם-הטבות.png',
  '2026/04/המטייל-החכם-תיקים.png',
  '2026/04/המטייל-החכם-הגיינה.png',
  '2026/04/המטייל-החכם-להשכרה.png',
  '2026/04/המטייל-החכם-כללי.png',
  '2026/04/המטייל-החכם-שטח.png',
  '2026/04/המטייל-החכם-תיק-יום.png',
  // Product image variations
  '2026/04/כותרת.png',
  '2026/04/כותרת-1.png',
  '2026/04/כותרת-2.png',
  // Video thumbnails
  '2026/05/כותרת-6.png',
  '2026/05/כותרת-7.png',
  // Logo sizes
  '2024/03/cropped-logo-32x32.png',
  '2024/03/cropped-logo-180x180.png',
  '2024/03/cropped-logo-192x192.png',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return resolve('exists');
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' } };
    function get(u) {
      https.get(u, options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return resolve(res.statusCode);
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(res.statusCode); });
      }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    }
    get(url);
  });
}

async function run() {
  console.log('Downloading critical missing images...\n');
  for (const imgPath of criticalImages) {
    const [, year, month, filename] = imgPath.match(/^(\d{4})\/(\d{2})\/(.+)$/);
    const localName = year + '_' + month + '_' + filename;
    const dest = path.join(imgDir, localName);
    const url = 'https://the-smart-traveller.com/wp-content/uploads/' + year + '/' + month + '/' + encodeURIComponent(filename);

    try {
      const result = await download(url, dest);
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      if (result === 'exists') {
        console.log('  Already exists: ' + localName);
      } else if (result === 200 && size > 0) {
        console.log('  Downloaded: ' + localName + ' (' + Math.round(size/1024) + 'KB)');
      } else {
        console.log('  Not found (HTTP ' + result + '): ' + localName);
      }
    } catch(e) {
      console.log('  Error: ' + localName + ' - ' + e.message);
    }
  }

  console.log('\nFixing thumbnail srcset paths to use available images...');
  // Build image index
  const imageFiles = fs.readdirSync(imgDir);
  const imageIndex = {};
  for (const f of imageFiles) {
    imageIndex[f.toLowerCase()] = f;
  }

  // For each missing thumbnail (e.g. file-150x150.jpg), find the full-size version
  function findFallback(filename) {
    // Try to find base name without size suffix
    const noSize = filename.replace(/-\d+x\d+(\.[^.]+)$/, '$1');
    if (noSize !== filename) {
      const found = imageIndex[noSize.toLowerCase()];
      if (found) return found;
    }
    return null;
  }

  // Fix srcset attributes in all HTML files to remove missing thumbnail variants
  const htmlFiles = [];
  function walk(d) {
    fs.readdirSync(d).forEach(f => {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.html') && !f.includes('fix_')) htmlFiles.push(full);
    });
  }
  walk(ROOT);

  let totalFixed = 0;
  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf8');
    let count = 0;

    // Fix srcset attributes: replace missing thumbnail paths with full-size
    html = html.replace(/(assets\/images\/)([^"'\s,]+)/g, (match, prefix, filename) => {
      const cleanFilename = filename.replace(/&quot;.*/, ''); // strip any trailing garbage
      if (!imageIndex[cleanFilename.toLowerCase()]) {
        const fallback = findFallback(cleanFilename);
        if (fallback) {
          count++;
          return prefix + fallback;
        }
      }
      return match;
    });

    if (count > 0) {
      fs.writeFileSync(file, html, 'utf8');
      totalFixed += count;
      console.log('  Fixed ' + count + ' thumbnail paths in: ' + path.relative(ROOT, file));
    }
  }
  console.log('\n✓ Fixed ' + totalFixed + ' thumbnail fallback paths.');
}

run().catch(console.error);
