/**
 * fix_cart_product_buttons.js
 * Adds "הוסף לסל" button to individual product pages that are missing it.
 * Extracts product ID from body class (postid-NNNN), hidden input, or filename fallback.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'products');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updated = 0, skipped = 0, errors = 0;
const results = [];

files.forEach(function(file) {
  const filePath = path.join(dir, file);
  try {
    let html = fs.readFileSync(filePath, 'utf8');

    // Skip if already has the button
    if (html.includes('st-single-add-to-cart')) {
      console.log('  [skip] already has button: ' + file);
      skipped++;
      return;
    }

    // Skip if doesn't have the empty price tag
    if (!html.includes('<p class="price"></p>')) {
      console.log('  [skip] no empty price tag: ' + file);
      skipped++;
      return;
    }

    // Method 1: Extract product ID from body class: postid-NNNN
    var idMatch = html.match(/postid-(\d+)/);
    var productId = idMatch ? idMatch[1] : '';
    var idMethod = idMatch ? 'postid in body class' : '';

    // Method 2: Fallback - hidden input comment_post_ID
    if (!productId) {
      var m2 = html.match(/comment_post_ID['"]\s+value=['"](\d+)['"]/);
      if (m2) {
        productId = m2[1];
        idMethod = 'comment_post_ID hidden input';
      }
    }

    // Method 3: Filename fallback
    if (!productId) {
      productId = path.basename(file, '.html');
      idMethod = 'filename fallback';
    }

    // Build button HTML exactly as specified
    var buttonHtml = '<p class="price"></p>\n' +
      '<div class="st-single-add-to-cart" style="margin-top:16px;">\n' +
      '  <button class="uc-button-addcart product_type_simple add_to_cart_button" data-product_id="' + productId + '" data-quantity="1" style="display:block;width:100%;max-width:300px;padding:14px 24px;background:#F97316;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;">\n' +
      '    <span class="ue-inner-btn-wrapper" style="display:flex;align-items:center;justify-content:center;gap:8px;">\n' +
      '      <span>🛒</span>\n' +
      '      <span>הוסף לסל</span>\n' +
      '    </span>\n' +
      '  </button>\n' +
      '</div>';

    html = html.replace('<p class="price"></p>', buttonHtml);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('  UPDATED: ' + file + ' (product_id=' + productId + ', method: ' + idMethod + ')');
    results.push({ file: file, productId: productId, method: idMethod });
    updated++;
  } catch(e) {
    console.log('  ERROR: ' + file + ' - ' + e.message);
    errors++;
  }
});

console.log('\n--- SUMMARY ---');
console.log('Files updated: ' + updated);
console.log('Files skipped: ' + skipped);
if (errors > 0) console.log('Errors: ' + errors);
if (results.length > 0) {
  console.log('\nProduct IDs found:');
  results.forEach(function(r) {
    console.log('  ' + r.file + ' -> ' + r.productId + ' (' + r.method + ')');
  });
}
