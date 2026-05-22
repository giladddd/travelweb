const fs = require('fs');
const path = require('path');

const categoriesDir = path.join(__dirname, 'categories');
const files = [
  'bags-rental.html',
  'benefits.html',
  'day-bags.html',
  'field.html',
  'general-equipment.html',
  'hygiene.html',
  'rental.html'
];

let updated = 0;
let skipped = 0;
const errors = [];

for (const file of files) {
  const filePath = path.join(categoriesDir, file);
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP (not found): ${file}`);
      skipped++;
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('local-cart.js')) {
      console.log(`SKIP (already has local-cart.js): ${file}`);
      skipped++;
      continue;
    }

    // 1. Add cart count badge
    const cartLinkOld = '>לעגלה שלי<';
    const cartLinkNew = '>לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:none;align-items:center;justify-content:center;margin-right:5px;vertical-align:middle;"></span><';

    if (content.includes(cartLinkOld)) {
      content = content.split(cartLinkOld).join(cartLinkNew);
      console.log(`  [✓] Added cart badge in: ${file}`);
    } else {
      console.log(`  [!] Cart link text not found in: ${file}`);
    }

    // 2. Add script tag before last </body>
    const scriptTag = '<script src="../assets/js/local-cart.js"></script>\n';
    const lastBodyIndex = content.lastIndexOf('</body>');
    if (lastBodyIndex !== -1) {
      content = content.slice(0, lastBodyIndex) + scriptTag + content.slice(lastBodyIndex);
      console.log(`  [✓] Added script tag in: ${file}`);
    } else {
      console.log(`  [!] No </body> found in: ${file}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`UPDATED: ${file}`);
    updated++;

  } catch (err) {
    console.error(`ERROR processing ${file}: ${err.message}`);
    errors.push({ file, error: err.message });
  }
}

console.log('\n--- Summary ---');
console.log(`Updated: ${updated}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors:  ${errors.length}`);
if (errors.length > 0) {
  console.log('Error details:');
  errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
}
