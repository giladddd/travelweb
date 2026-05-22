/**
 * fix_submenu4.js — Remove the old sub-menu toggle code from MENU-TOGGLE-FIX
 * that fights with SUBMENU-PANEL-FIX.
 *
 * Removes from every HTML file:
 *  1) The JS block that adds/removes ue-sub-open on click
 *  2) The CSS that shows .sub-menu when ue-sub-open is set
 *
 * Keeps everything else in MENU-TOGGLE-FIX (checkbox handler, z-index CSS, etc.)
 */
const fs   = require('fs');
const path = require('path');
const ROOT = __dirname;

// ── Exact strings to remove ──────────────────────────────────────────────────

const REMOVE_JS = `
  // Fix the sub-menu toggle (arrow expand/collapse)
  document.querySelectorAll('.ue_inner_menu .menu-item-has-children > a').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var li = this.parentElement;
      var sub = li.querySelector('.sub-menu');
      if (!sub) return;
      // Allow navigation to happen for the parent link href
      var currentlyOpen = li.classList.contains('ue-sub-open');
      // Close all siblings
      var siblings = li.parentElement.querySelectorAll('.menu-item-has-children.ue-sub-open');
      siblings.forEach(function(s) { s.classList.remove('ue-sub-open'); });
      if (!currentlyOpen) {
        e.preventDefault();
        li.classList.add('ue-sub-open');
      }
    });
  });`;

const REMOVE_CSS = `/* ── Sub-menu show when parent has ue-sub-open ── */
.ue_inner_menu .menu-item-has-children .sub-menu { display: none; }
.ue_inner_menu .menu-item-has-children.ue-sub-open .sub-menu { display: block; }`;

// ─────────────────────────────────────────────────────────────────────────────

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
let updated = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (html.includes(REMOVE_JS)) {
    html = html.replace(REMOVE_JS, '');
    changed = true;
  }

  if (html.includes(REMOVE_CSS)) {
    html = html.replace(REMOVE_CSS, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    updated++;
  }
}

console.log('✓ Removed old sub-menu toggle code from ' + updated + ' files.');
