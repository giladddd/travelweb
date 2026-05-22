/**
 * fix_links.js — Fix all broken href links created by the over-broad domain replacement
 * Problem: "https://the-smart-traveller.com/" was replaced with "index.html"
 * so "https://the-smart-traveller.com/about/" became "index.htmlabout/"
 */
const fs   = require('fs');
const path = require('path');

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

// Category slug → local filename
const catMap = {
  '%d7%94%d7%92%d7%99%d7%99%d7%a0%d7%94':             'hygiene',
  '%d7%94%d7%98%d7%91%d7%95%d7%aa':                   'benefits',
  '%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94':             'rental',
  '%d7%a6%d7%99%d7%95%d7%93-%d7%9b%d7%9c%d7%9c%d7%99':'general-equipment',
  '%d7%a9%d7%98%d7%97':                                'field',
  '%d7%aa%d7%99%d7%a7%d7%99-%d7%99%d7%95%d7%9d':      'day-bags',
  '%d7%aa%d7%99%d7%a7%d7%99%d7%9d-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94': 'bags-rental'
};

// Page slug → local filename (no prefix)
const pageMap = {
  'about/':                                            'about.html',
  '%d7%94%d7%9e%d7%93%d7%a8%d7%99%d7%9a-%d7%94%d7%9e%d7%9c%d7%90-%d7%9c%d7%98%d7%99%d7%95%d7%9c/': 'guide.html',
  '%d7%97%d7%a0%d7%95%d7%aa/':                        'shop.html',
  '%d7%a1%d7%99%d7%9b%d7%95%d7%9d-%d7%94%d7%96%d7%9e%d7%a0%d7%94/': 'order-summary.html',
  '%d7%aa%d7%a7%d7%a0%d7%95%d7%9f-%d7%95%d7%9e%d7%93%d7%99%d7%a0%d7%99%d7%95%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%95%d7%aa/': 'terms.html',
  // uppercase variants
  '%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A-%D7%94%D7%9E%D7%9C%D7%90-%D7%9C%D7%98%D7%99%D7%95%D7%9C/': 'guide.html',
  '%D7%97%D7%A0%D7%95%D7%AA/':                        'shop.html',
  '%D7%A1%D7%99%D7%9B%D7%95%D7%9D-%D7%94%D7%96%D7%9E%D7%A0%D7%94/': 'order-summary.html',
  '%D7%AA%D7%A7%D7%A0%D7%95%D7%9F-%D7%95%D7%9E%D7%93%D7%99%D7%A0%D7%99%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%95%D7%AA/': 'terms.html',
};

function resolveHref(href, depth) {
  // depth 0 = root pages, depth 1 = products/ or categories/
  const pre = depth === 0 ? '' : '../';

  // ── Pattern 1: broken links like "index.htmlPATH" or "../index.htmlPATH" ────
  // This happened when https://the-smart-traveller.com/ was replaced with index.html
  const brokenMatch = href.match(/^(?:\.\.\/)*index\.html(.+)$/i);
  if (brokenMatch) {
    const rest = brokenMatch[1];
    return resolveRelativePath(rest, pre);
  }

  // ── Pattern 2: still starts with the domain ────────────────────────────────
  const domainMatch = href.match(/^https?:\/\/the-smart-traveller\.com\/?(.*)$/i);
  if (domainMatch) {
    const rest = domainMatch[1];
    if (!rest) return pre + 'index.html';
    return resolveRelativePath(rest, pre);
  }

  return null; // no change needed
}

function resolveRelativePath(rest, pre) {
  // strip query string and anchor for mapping, preserve anchor only
  const queryIdx = rest.indexOf('?');
  const anchorIdx = rest.indexOf('#');
  let anchor = '';
  let p = rest;

  if (anchorIdx !== -1) {
    anchor = rest.substring(anchorIdx);
    p = rest.substring(0, anchorIdx);
  }
  if (queryIdx !== -1 && (anchorIdx === -1 || queryIdx < anchorIdx)) {
    p = rest.substring(0, queryIdx); // strip query string entirely (offline)
  }

  if (!p || p === '/') return pre + 'index.html' + anchor;

  // wp-content/uploads → local assets/images
  const uploadsMatch = p.match(/^wp-content\/uploads\/(\d{4})\/(\d{2})\/(.+)$/i);
  if (uploadsMatch) {
    const [, year, month, filename] = uploadsMatch;
    return pre + 'assets/images/' + year + '_' + month + '_' + filename + anchor;
  }

  // product-category (with or without query string)
  const catMatch = p.match(/^product-category\/([^/?#]+)\/?$/i);
  if (catMatch) {
    const slug = catMatch[1].toLowerCase();
    if (catMap[slug]) return pre + 'categories/' + catMap[slug] + '.html' + anchor;
  }

  // product
  const prodMatch = p.match(/^product\/([^/?#]+)\/?$/i);
  if (prodMatch) {
    const slug = prodMatch[1].toLowerCase();
    return pre + 'products/' + slug + '.html' + anchor;
  }

  // known pages
  const pLower = p.toLowerCase();
  for (const [key, val] of Object.entries(pageMap)) {
    if (pLower === key.toLowerCase() || pLower.startsWith(key.toLowerCase().replace(/\/$/, ''))) {
      const pageAnchorIdx = p.indexOf('#');
      if (pageAnchorIdx !== -1) anchor = p.substring(pageAnchorIdx);
      return pre + val + anchor;
    }
  }

  // fallback: unknown path → no change
  return null;
}

const files = allHtmlFiles(ROOT);
let totalFixed = 0;
let totalLinks = 0;

for (const file of files) {
  const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Fix href attributes
  html = html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    const fixed = resolveHref(href, depth);
    if (fixed !== null && fixed !== href) {
      count++;
      return `href=${quote}${fixed}${quote}`;
    }
    return match;
  });

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    totalFixed++;
    totalLinks += count;
    console.log(`  Fixed ${count} links in: ${path.relative(ROOT, file)}`);
  }
}

console.log(`\n✓ Fixed ${totalLinks} broken links across ${totalFixed} files.`);
