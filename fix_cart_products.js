const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, 'products');
const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'));

let updated = 0;
let skipped = 0;
const errors = [];

for (const file of files) {
  const filePath = path.join(productsDir, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already contains local-cart.js
    if (content.includes('local-cart.js')) {
      console.log(`SKIPPED (already has local-cart.js): ${file}`);
      skipped++;
      continue;
    }

    let changed = false;

    // 1. Add cart count badge
    const badgeTarget = '>לעגלה שלי<';
    const badgeReplacement = '>לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:none;align-items:center;justify-content:center;margin-right:5px;vertical-align:middle;"></span><';

    if (content.includes(badgeTarget)) {
      content = content.split(badgeTarget).join(badgeReplacement);
      changed = true;
    } else {
      console.log(`  WARNING: badge target not found in ${file}`);
    }

    // 2. Add script tag before LAST </body>
    const lastBodyIndex = content.lastIndexOf('</body>');
    if (lastBodyIndex !== -1) {
      content = content.slice(0, lastBodyIndex) +
        '<script src="../assets/js/local-cart.js"></script>\n' +
        content.slice(lastBodyIndex);
      changed = true;
    } else {
      console.log(`  WARNING: </body> not found in ${file}`);
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`UPDATED: ${file}`);
      updated++;
    }
  } catch (err) {
    console.error(`ERROR processing ${file}: ${err.message}`);
    errors.push({ file, error: err.message });
  }
}

console.log('\n--- SUMMARY ---');
console.log(`Total HTML files found: ${files.length}`);
console.log(`Updated: ${updated}`);
console.log(`Skipped (already had local-cart.js): ${skipped}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('Error details:');
  errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
}
