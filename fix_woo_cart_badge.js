/**
 * fix_woo_cart_badge.js
 * Injects <script src="assets/js/woo-cart-count.js"></script> before </body>
 * in the target HTML files, skipping files that already have the tag.
 *
 * Usage: node fix_woo_cart_badge.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const TARGET_FILES = [
  'index.html',
  'shop.html',
  'order-summary.html',
];

const SCRIPT_TAG = '<script src="assets/js/woo-cart-count.js"></script>';
const INJECT_BEFORE = '</body>';

let updatedCount = 0;
let skippedCount = 0;

TARGET_FILES.forEach(function (filename) {
  const filePath = path.join(ROOT, filename);

  if (!fs.existsSync(filePath)) {
    console.log('[SKIP]    ' + filename + ' — file not found');
    skippedCount++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Already injected?
  if (content.indexOf(SCRIPT_TAG) !== -1) {
    console.log('[SKIP]    ' + filename + ' — tag already present');
    skippedCount++;
    return;
  }

  if (content.indexOf(INJECT_BEFORE) === -1) {
    console.log('[WARN]    ' + filename + ' — </body> not found, skipping');
    skippedCount++;
    return;
  }

  // Replace the LAST occurrence of </body> to be safe with multi-body docs
  const lastIndex = content.lastIndexOf(INJECT_BEFORE);
  content = content.slice(0, lastIndex) + SCRIPT_TAG + '\n' + content.slice(lastIndex);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[UPDATED] ' + filename);
  updatedCount++;
});

console.log('\nDone. ' + updatedCount + ' file(s) updated, ' + skippedCount + ' skipped.');
