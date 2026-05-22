/**
 * fix_menu.js — Fix fullscreen navigation menu toggle (UCFullscreenMenu offline)
 * Problem: The original UCFullscreenMenu JS isn't available offline.
 *          It should add/remove the "menu-opened" class on the widget div
 *          when the checkbox-toggle is checked/unchecked.
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

const MENU_FIX = `
<script>
/* ═══ MENU-TOGGLE-FIX ══════════════════════════════════════════════════════ */
(function(){
document.addEventListener('DOMContentLoaded', function() {

  // UCFullscreenMenu offline fix:
  // The original plugin adds/removes "menu-opened" class on the widget div
  // when the checkbox-toggle input changes. We replicate that here.
  document.querySelectorAll('.ue-fullscreen-menu .checkbox-toggle').forEach(function(cb) {
    var widget = cb.closest('.ue-fullscreen-menu');
    if (!widget) return;

    // Sync initial state
    if (cb.checked) {
      widget.classList.add('menu-opened');
      document.body.classList.add('menu-opened');
    }

    cb.addEventListener('change', function() {
      if (this.checked) {
        widget.classList.add('menu-opened');
        document.body.classList.add('menu-opened');
        document.documentElement.classList.add('uc-force-disable-page-scroll', 'menu-opened');
      } else {
        widget.classList.remove('menu-opened');
        document.body.classList.remove('menu-opened');
        document.documentElement.classList.remove('uc-force-disable-page-scroll', 'menu-opened');
      }
    });

    // Also: clicking anywhere on the overlay (not on links) closes the menu
    var menu = widget.querySelector('.ue_menu');
    if (menu) {
      menu.addEventListener('click', function(e) {
        // Close when clicking the overlay background itself
        if (e.target === menu) {
          cb.checked = false;
          cb.dispatchEvent(new Event('change'));
        }
      });
    }
  });

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
  });

});
})();
/* ═══════════════════════════════════════════════════════════════════════════ */
</script>
<style>
/* ── Sub-menu show when parent has ue-sub-open ── */
.ue_inner_menu .menu-item-has-children .sub-menu { display: none; }
.ue_inner_menu .menu-item-has-children.ue-sub-open .sub-menu { display: block; }
/* ── Ensure ue_menu overlay is above everything ── */
.ue-fullscreen-menu .ue_menu {
  z-index: 999999;
}
/* ── Show overlay when menu-opened ── */
.ue-fullscreen-menu.menu-opened .ue_menu {
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu {
  visibility: visible !important;
  transform: scale(1) !important;
}
.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu > div > div {
  opacity: 1 !important;
}
</style>`;

const files = allHtmlFiles(ROOT);
let patched = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('MENU-TOGGLE-FIX')) continue;
  if (!html.includes('ue-fullscreen-menu')) continue; // skip pages without the menu

  html = html.replace('</body>', MENU_FIX + '\n</body>');
  fs.writeFileSync(file, html, 'utf8');
  patched++;
  console.log('  Patched:', path.relative(ROOT, file));
}

console.log(`\n✓ Menu fix applied to ${patched} pages.`);
