/**
 * fix_new_product_links.js — Fix URL-encoded Hebrew hrefs in the 7 newly downloaded
 * product pages. The old products were fixed by fix_links.js but the new pages
 * came from a fresh download and still have encoded Hebrew paths.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const newProducts = [
  'products/gregory-deva-60.html',
  'products/osprey-aura-65.html',
  'products/kestrel-lt-65.html',
  'products/kyte-lt-65.html',
  'products/kyte-68.html',
  'products/osprey-kestarel-68.html',
  'products/osprey-skarab-34l.html',
];

// URL map: decoded Hebrew slug (lowercase) → local relative path (from products/)
const urlMap = {
  // Main pages
  'חנות': '../shop.html',
  'המדריך-המלא-לטיול': '../guide.html',
  'about': '../about.html',
  'תקנון-ומדיניות-פרטיות': '../terms.html',
  'סיכום-הזמנה': '../order-summary.html',

  // Category pages
  'product-category/תיקים-להשכרה': '../categories/bags-rental.html',
  'product-category/תיקי-יום': '../categories/day-bags.html',
  'product-category/להשכרה': '../categories/rental.html',
  'product-category/ציוד-כללי': '../categories/general-equipment.html',
  'product-category/שטח': '../categories/field.html',
  'product-category/הגיינה': '../categories/hygiene.html',
  'product-category/הטבות': '../categories/benefits.html',
};

// Also decode URL-encoded product slugs that point to ../ (live site product links)
// These get handled as ../products/slug.html

function decodeHebrew(encoded) {
  try {
    return decodeURIComponent(encoded);
  } catch(e) {
    return encoded;
  }
}

let totalFixed = 0;

for (const relPath of newProducts) {
  const file = path.join(ROOT, relPath);
  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Fix href="../%XX%XX.../" patterns (URL-encoded Hebrew relative paths)
  html = html.replace(/href="(\.\.\/)((?:%[0-9A-Fa-f]{2}[-/]?)+\/?)(\/?#[^"]*)?"/g, (match, pre, encodedPath, anchor) => {
    const decoded = decodeHebrew(encodedPath).replace(/\/$/, '');
    anchor = anchor || '';

    // Check if it's a known top-level page
    if (urlMap[decoded]) {
      const local = urlMap[decoded] + (anchor ? anchor.replace(/^\//, '') : '');
      count++;
      return 'href="' + local + '"';
    }

    // Check product-category paths
    const catMatch = decoded.match(/^product-category\/(.+)/);
    if (catMatch) {
      const cat = 'product-category/' + catMatch[1];
      if (urlMap[cat]) {
        count++;
        return 'href="' + urlMap[cat] + '"';
      }
    }

    // Check product paths: ../product/slug/ → ../products/slug.html
    const prodMatch = decoded.match(/^product\/(.+)/);
    if (prodMatch) {
      count++;
      return 'href="../products/' + prodMatch[1] + '.html"';
    }

    return match; // leave unchanged if not recognized
  });

  // Also fix the guide anchor links that are separate pattern:
  // href="../%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A-%D7%94%D7%9E%D7%9C%D7%90-%D7%9C%D7%98%D7%99%D7%95%D7%9C/#TG_N"
  html = html.replace(/href="\.\.\/(%[0-9A-Fa-f]{2}[^"#]*)#(TG_\d+)"/gi, (match, encodedPath, anchor) => {
    const decoded = decodeHebrew(encodedPath).replace(/\/$/, '');
    if (decoded === 'המדריך-המלא-לטיול' || urlMap[decoded] === '../guide.html') {
      count++;
      return 'href="../guide.html#' + anchor + '"';
    }
    return match;
  });

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    totalFixed += count;
    console.log('Fixed ' + count + ' in: ' + relPath);
  } else {
    console.log('No changes needed: ' + relPath);
  }
}

console.log('\n✓ Fixed ' + totalFixed + ' URL-encoded Hebrew hrefs in new product pages.');
