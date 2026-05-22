/**
 * fix_remaining.js — Fix remaining issues identified by comparison agents:
 *
 * 1. data-thumb="../index.htmlwp-content/uploads/..." → ../assets/images/YYYY_MM_filename
 *    (all product pages — thumbnail strip was broken)
 *
 * 2. data-image="index.htmlwp-content/uploads/..." → assets/images/YYYY_MM_filename
 *    (guide page — lightbox full-size images were broken)
 *
 * 3. Product card image links href='javascript:void(0)' → href='products/xxx.html'
 *    (index.html + all category pages — clicking product image did nothing)
 *
 * 4. Hero subtitle spacing: "ביטוחים,ייעוץ" → "ביטוחים, ייעוץ"
 *    (index.html)
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

// Build local image index
const imageIndex = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets', 'images'))) {
  imageIndex[f.toLowerCase()] = f;
}

function uploadsToLocal(year, month, filename, pre) {
  const localName = year + '_' + month + '_' + filename;
  const found = imageIndex[localName.toLowerCase()];
  return pre + 'assets/images/' + (found || localName);
}

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

const files = allHtmlFiles(ROOT);
let totalFixed = 0;

for (const file of files) {
  const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
  const pre = depth === 0 ? '' : '../';

  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // ── 1. Fix data-thumb attributes ─────────────────────────────────────────────
  // Pattern: data-thumb="../index.htmlwp-content/uploads/YYYY/MM/filename"
  html = html.replace(
    /(data-thumb=["'])(?:(?:\.\.\/)*index\.html)?(wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s]+))(["'])/gi,
    (match, attr, uploadsPath, year, month, filename, end) => {
      count++;
      return attr + uploadsToLocal(year, month, filename, pre) + end;
    }
  );

  // ── 2. Fix data-image attributes ─────────────────────────────────────────────
  // Pattern: data-image="index.htmlwp-content/uploads/YYYY/MM/filename"
  html = html.replace(
    /(data-image=["'])(?:(?:\.\.\/)*index\.html)?(wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s]+))(["'])/gi,
    (match, attr, uploadsPath, year, month, filename, end) => {
      count++;
      return attr + uploadsToLocal(year, month, filename, pre) + end;
    }
  );

  // ── 3. Fix product card image links: javascript:void(0) → product URL ────────
  // Strategy: find each href='javascript:void(0)' that is a product image wrapper,
  // then look ahead up to 700 chars for the uc_title <a> with the real product href.
  if (html.includes("href='javascript:void(0)'")) {
    let result = '';
    let pos = 0;
    while (true) {
      const voidIdx = html.indexOf("href='javascript:void(0)'", pos);
      if (voidIdx === -1) { result += html.substring(pos); break; }

      // Make sure this is inside a product image wrapper (uc_post_grid_style_one_image)
      const before = html.substring(Math.max(0, voidIdx - 150), voidIdx);
      const isProductCard = /uc_post_grid_style_one_image/.test(before);

      if (!isProductCard) {
        // Not a product card — skip this void(0)
        result += html.substring(pos, voidIdx + 1);
        pos = voidIdx + 1;
        continue;
      }

      // Look ahead for uc_title link (within 700 chars)
      const ahead = html.substring(voidIdx, voidIdx + 700);
      const titleMatch = ahead.match(/class="uc_title"><a href="([^"]+)"/);

      if (titleMatch) {
        const productHref = titleMatch[1];
        result += html.substring(pos, voidIdx);
        result += "href='" + productHref + "'";
        pos = voidIdx + "href='javascript:void(0)'".length;
        count++;
      } else {
        result += html.substring(pos, voidIdx + 1);
        pos = voidIdx + 1;
      }
    }
    html = result;
  }

  // ── 4. Fix hero subtitle spacing (index.html only) ───────────────────────────
  if (html.includes('ביטוחים,ייעוץ')) {
    html = html.replace(/ביטוחים,ייעוץ/g, 'ביטוחים, ייעוץ');
    count++;
  }

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    totalFixed += count;
    console.log(`  Fixed ${count} in: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\n✓ Fixed ${totalFixed} total issues across all HTML files.`);
