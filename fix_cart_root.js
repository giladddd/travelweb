const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\gilad\\smart_traveller_local';
const files = ['index.html', 'shop.html', 'about.html', 'guide.html', 'terms.html'];

const badgeOld = '>לעגלה שלי<';
const badgeNew = '>לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:none;align-items:center;justify-content:center;margin-right:5px;vertical-align:middle;"></span><';

const scriptTag = '<script src="assets/js/local-cart.js"></script>\n';

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(rootDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add cart count badge
  if (content.includes(badgeOld)) {
    content = content.split(badgeOld).join(badgeNew);
    modified = true;
    console.log(`  [badge] replaced in ${file}`);
  } else {
    console.log(`  [badge] pattern NOT found in ${file}`);
  }

  // 2. Add script tag before last </body>
  const lastBodyIdx = content.lastIndexOf('</body>');
  if (lastBodyIdx !== -1) {
    // Only add if not already present
    if (!content.includes('assets/js/local-cart.js')) {
      content = content.slice(0, lastBodyIdx) + scriptTag + content.slice(lastBodyIdx);
      modified = true;
      console.log(`  [script] inserted in ${file}`);
    } else {
      console.log(`  [script] already present in ${file}, skipping`);
    }
  } else {
    console.log(`  [script] </body> NOT found in ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`UPDATED: ${file}`);
  } else {
    console.log(`NO CHANGES: ${file}`);
  }
}

console.log(`\nDone. ${updatedCount} file(s) updated successfully.`);
