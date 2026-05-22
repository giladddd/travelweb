/**
 * fix_missing_products.js — Download the 7 missing product pages
 * (backpacks + day-bag) and localize them to match the existing products.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT = __dirname;
const PRODUCTS_DIR = path.join(ROOT, 'products');

const missingProducts = [
  'gregory-deva-60',
  'osprey-aura-65',
  'kestrel-lt-65',
  'kyte-lt-65',
  'kyte-68',
  'osprey-kestarel-68',
  'osprey-skarab-34l',
];

// Build local image index
const imageIndex = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets', 'images'))) {
  imageIndex[f.toLowerCase()] = f;
}

function get(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    };
    function doGet(u) {
      https.get(u, options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doGet(res.headers.location);
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }).on('error', reject);
    }
    doGet(url);
  });
}

function uploadsToLocal(uploadsPath, pre) {
  const m = uploadsPath.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/(.+)/i);
  if (!m) return null;
  const [, year, month, filename] = m;
  const clean = filename.split('?')[0];
  const localName = year + '_' + month + '_' + clean;
  const found = imageIndex[localName.toLowerCase()];
  if (found) return pre + 'assets/images/' + found;
  return pre + 'assets/images/' + localName;
}

async function downloadImage(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'exists';
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0' } };
    function doGet(u) {
      https.get(u, options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) { file.close(); return doGet(res.headers.location); }
        if (res.statusCode !== 200) { file.close(); fs.unlink(dest, () => {}); return resolve(res.statusCode); }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(200); });
      }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    }
    doGet(url);
  });
}

function localize(html, slug) {
  const pre = '../'; // products/ is depth 1

  // ── Replace all live domain links with local paths ───────────────────────
  // Home / base URL
  html = html.replace(/https?:\/\/the-smart-traveller\.com\//g, '../');
  // Catch any missed www variants
  html = html.replace(/https?:\/\/www\.the-smart-traveller\.com\//g, '../');

  // ── Fix wp-content/uploads paths that got prefix '../' ───────────────────
  // Pattern: src="../wp-content/uploads/YYYY/MM/filename"
  html = html.replace(/((?:src|data-src|data-large_image|data-bg|data-srcset|data-thumb|data-image)=["'])\.\.\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s,]+)(["'])/gi,
    (match, attr, year, month, filename, end) => {
      const local = uploadsToLocal('wp-content/uploads/' + year + '/' + month + '/' + filename, pre);
      return local ? attr + local + end : match;
    }
  );

  // Fix url() background images
  html = html.replace(/url\((['"]?)\.\.\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^)'"\s]+)\1\)/gi,
    (match, q, year, month, filename) => {
      const local = uploadsToLocal('wp-content/uploads/' + year + '/' + month + '/' + filename, pre);
      return local ? `url(${q}${local}${q})` : match;
    }
  );

  // Fix href="../wp-content/uploads/..." (image lightbox links)
  html = html.replace(/(href=["'])\.\.\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s]+\.(png|jpg|jpeg|webp|gif|svg))(["'])/gi,
    (match, attr, year, month, filename, ext, end) => {
      const local = uploadsToLocal('wp-content/uploads/' + year + '/' + month + '/' + filename, pre);
      return local ? attr + local + end : match;
    }
  );

  // Fix any remaining absolute uploads paths
  html = html.replace(/((?:src|data-src|data-large_image|data-bg|data-thumb|data-image)=["'])(?:https?:\/\/the-smart-traveller\.com\/)?wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s,]+)(["'])/gi,
    (match, attr, year, month, filename, end) => {
      const local = uploadsToLocal('wp-content/uploads/' + year + '/' + month + '/' + filename, pre);
      return local ? attr + local + end : match;
    }
  );

  // ── Fix page links ────────────────────────────────────────────────────────
  // Product links: ../product/slug/ → ../products/slug.html (already done by base replacement)
  // But base replacement turned https://the-smart-traveller.com/product/x/ into ../product/x/
  // We need ../product/slug/ → ../products/slug.html
  html = html.replace(/href=["']\.\.\/product\/([^"'\s\/?#]+)\/?["']/gi, (match, slug) => {
    return `href="../products/${slug}.html"`;
  });
  // Category links
  html = html.replace(/href=["']\.\.\/product-category\/([^"'\s\/?#]+)\/?["']/gi, (match, cat) => {
    const catMap = {
      '%d7%aa%d7%99%d7%a7%d7%99%d7%9d-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94': 'bags-rental',
      '%d7%aa%d7%99%d7%a7%d7%99-%d7%99%d7%95%d7%9d': 'day-bags',
      '%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94': 'rental',
      '%d7%a6%d7%99%d7%95%d7%93-%d7%9b%d7%9c%d7%9c%d7%99': 'general-equipment',
      '%d7%a9%d7%98%d7%97': 'field',
      '%d7%94%d7%92%d7%99%d7%99%d7%a0%d7%94': 'hygiene',
      '%d7%94%d7%98%d7%91%d7%95%d7%aa': 'benefits',
    };
    // Also handle Hebrew directly
    const hebrewMap = {
      'תיקים-להשכרה': 'bags-rental',
      'תיקי-יום': 'day-bags',
      'להשכרה': 'rental',
      'ציוד-כללי': 'general-equipment',
      'שטח': 'field',
      'הגיינה': 'hygiene',
      'הטבות': 'benefits',
    };
    const mapped = catMap[cat.toLowerCase()] || hebrewMap[cat] || cat;
    return `href="../categories/${mapped}.html"`;
  });
  // Main nav links
  html = html.replace(/href=["']\.\.\/חנות\/?["']/gi, 'href="../shop.html"');
  html = html.replace(/href=["']\.\.\/המדריך-המלא-לטיול\/?["']/gi, 'href="../guide.html"');
  html = html.replace(/href=["']\.\.\/about\/?["']/gi, 'href="../about.html"');
  html = html.replace(/href=["']\.\.\/תקנון-ומדיניות-פרטיות\/?["']/gi, 'href="../terms.html"');
  html = html.replace(/href=["']\.\.\/סיכום-הזמנה\/?["']/gi, 'href="../order-summary.html"');
  // Home link: href="../" → href="../index.html"
  html = html.replace(/href=["']\.\.\/?["']/g, 'href="../index.html"');

  // ── Fix data-settings JSON (escaped domain URLs) ─────────────────────────
  // After base replacement, these become: ..\/wp-content\/uploads\/YYYY\/MM\/filename
  // Or: ..\\/wp-content\\/uploads\\/...
  html = html.replace(
    /(?:https?:(?:\\\/|\/){2}the-smart-traveller\.com(?:\\\/|\/)|\.\.(?:\\\/|\/)?)wp-content(?:\\\/|\/)uploads(?:\\\/|\/)(\d{4})(?:\\\/|\/)(\d{2})(?:\\\/|\/)([^\s&"<\\]+)/g,
    (match, year, month, rawFilename) => {
      const filename = rawFilename.replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)));
      const localName = year + '_' + month + '_' + filename;
      const found = imageIndex[localName.toLowerCase()];
      return pre + 'assets/images/' + (found || localName);
    }
  );

  // ── Fix remaining ../... paths that are WP infrastructure ─────────────────
  // These are broken non-content paths — just leave them; they don't affect visuals

  return html;
}

async function downloadProductImages(html, slug) {
  // Find all wp-content image URLs still in the HTML (ones we haven't localized yet)
  const imgPattern = /https?:\/\/the-smart-traveller\.com\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^\s"'<]+)/g;
  let m;
  while ((m = imgPattern.exec(html)) !== null) {
    const [, year, month, filename] = m;
    const clean = filename.replace(/[?#].*$/, '');
    const localName = year + '_' + month + '_' + clean;
    if (!imageIndex[localName.toLowerCase()]) {
      const dest = path.join(ROOT, 'assets', 'images', localName);
      const url = 'https://the-smart-traveller.com/wp-content/uploads/' + year + '/' + month + '/' + encodeURIComponent(clean);
      try {
        const r = await downloadImage(url, dest);
        if (r === 200 || r === 'exists') {
          const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
          if (size > 0) {
            imageIndex[localName.toLowerCase()] = localName;
            console.log('    Downloaded image:', localName, '(' + Math.round(size/1024) + 'KB)');
          }
        }
      } catch(e) {
        console.log('    Image download failed:', localName, '-', e.message);
      }
    }
  }
}

// Also look for the existing product template to copy the menu/fix_all JS
function getTemplateSuffix() {
  // Read an existing product page to extract the inline fix_all.js and menu patches
  const existingFiles = fs.readdirSync(PRODUCTS_DIR);
  if (existingFiles.length === 0) return '';
  const sample = fs.readFileSync(path.join(PRODUCTS_DIR, existingFiles[0]), 'utf8');
  // Extract everything after </html> or the menu/fix_all patches
  // Actually, the fix_all JS is injected before </body> — check if it's there
  const fixAllIdx = sample.indexOf('<!-- MENU-TOGGLE-FIX -->');
  if (fixAllIdx >= 0) {
    return sample.substring(fixAllIdx);
  }
  return '';
}

async function run() {
  console.log('Downloading 7 missing product pages...\n');

  const templateSuffix = getTemplateSuffix();

  for (const slug of missingProducts) {
    const url = 'https://the-smart-traveller.com/product/' + slug + '/';
    const destFile = path.join(PRODUCTS_DIR, slug + '.html');

    if (fs.existsSync(destFile)) {
      console.log('Already exists:', slug + '.html');
      continue;
    }

    console.log('Fetching:', url);
    try {
      const { status, body } = await get(url);
      if (status !== 200) {
        console.log('  HTTP', status, '- skipping');
        continue;
      }
      console.log('  Got', Math.round(body.length / 1024) + 'KB — downloading images...');

      // Download any images referenced in the page
      await downloadProductImages(body, slug);

      // Localize the HTML
      let html = localize(body, slug);

      // Inject menu fix if template has it and this page doesn't
      if (templateSuffix && !html.includes('MENU-TOGGLE-FIX')) {
        html = html.replace(/<\/body>/, templateSuffix.replace('</html>', '') + '\n</body>');
      }

      fs.writeFileSync(destFile, html, 'utf8');
      console.log('  Saved:', slug + '.html');
    } catch(e) {
      console.error('  Error:', e.message);
    }
  }

  console.log('\nDone! Run node fix_remaining.js again to fix data-thumb/data-image in new files.');
}

run().catch(console.error);
