/**
 * fix_menu2.js — Patch the menu overlay to be full-height and match live site appearance
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

// Additional CSS to inject after the existing MENU-TOGGLE-FIX style block
const EXTRA_CSS = `
<style>
/* ── MENU-OVERLAY-PATCH: full-height overlay matching live site ── */
/* The .ue_menu has position:fixed but no height, add 100vh */
.ue-fullscreen-menu .ue_menu {
  height: 100vh;
}
/* When open: make overlay fully visible */
.ue-fullscreen-menu.menu-opened .ue_menu {
  visibility: visible !important;
  opacity: 1 !important;
}
/* Inner menu: full height with dark background via CSS var */
.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu {
  visibility: visible !important;
  transform: scale(1) !important;
  opacity: 1 !important;
  background-color: #0F172B;
  width: 100%;
  justify-content: center;
  align-items: center;
}
/* Nav items: large centered text like live site */
.ue-fullscreen-menu .ue_menu .uc-list-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: center;
}
.ue-fullscreen-menu .ue_menu .uc-list-menu li a {
  font-size: clamp(18px, 3vw, 28px);
  line-height: 2;
  color: #fff;
  display: block;
}
.ue-fullscreen-menu .ue_menu .uc-list-menu .current-menu-item > a,
.ue-fullscreen-menu .ue_menu .uc-list-menu li a:hover {
  color: #F97316;
}
/* Sub-menu items */
.ue-fullscreen-menu .ue_menu .sub-menu {
  list-style: none;
  padding: 0;
}
.ue-fullscreen-menu .ue_menu .sub-menu li a {
  font-size: clamp(14px, 2vw, 20px);
  color: #aaa;
}
/* Inner menu box: vertically centered */
.ue-fullscreen-menu .ue_menu .ue_inner_menu-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 40px 20px;
}
</style>`;

const files = allHtmlFiles(ROOT);
let patched = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('MENU-OVERLAY-PATCH')) continue;
  if (!html.includes('MENU-TOGGLE-FIX')) continue; // only patch files with the menu fix

  // Insert before </body>
  html = html.replace('</body>', EXTRA_CSS + '\n</body>');
  fs.writeFileSync(file, html, 'utf8');
  patched++;
}

console.log(`✓ Menu overlay patch applied to ${patched} pages.`);
