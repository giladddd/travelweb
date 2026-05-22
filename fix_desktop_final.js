/**
 * fix_desktop_final.js
 * Start from the clean 566KB original, inject one simple SUBMENU-PANEL-FIX
 * that uses document-level capture (most reliable — fires before ANY other handler).
 */
const fs = require('fs');
const filePath = 'C:/Users/gilad/OneDrive/שולחן העבודה/smart_traveller_home.html';
let html = fs.readFileSync(filePath, 'utf8');

// Get clean original (before any of our injections)
const cutPoint = html.indexOf('<style>\n/* ── SUBMENU-PANEL-FIX');
const cleanHtml = cutPoint > 0 ? html.substring(0, cutPoint) : html.replace(/\n<\/body>\n<\/html>$/, '');
console.log('Clean part:', Math.round(cleanHtml.length / 1024), 'KB');

const lines = [];

// ── CSS ──────────────────────────────────────────────────────────────────────
lines.push('<style>');
lines.push('/* ── SUBMENU-PANEL-FIX v4 ── */');
lines.push('');

// Force UCE fullscreen menu to cover full viewport
lines.push('.ue-fullscreen-menu .ue_menu {');
lines.push('  height: 100vh !important;');
lines.push('  width: 100vw !important;');
lines.push('  box-sizing: border-box !important;');
lines.push('}');
lines.push('.ue-fullscreen-menu.menu-opened .ue_menu {');
lines.push('  visibility: visible !important;');
lines.push('  opacity: 1 !important;');
lines.push('  pointer-events: auto !important;');
lines.push('}');
lines.push('.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu {');
lines.push('  visibility: visible !important;');
lines.push('  transform: scale(1) !important;');
lines.push('}');
lines.push('');

// Hide sub-menus in ALL states
lines.push('.ue_inner_menu .sub-menu,');
lines.push('.ue_inner_menu li > ul.sub-menu {');
lines.push('  display: none !important;');
lines.push('  visibility: hidden !important;');
lines.push('  height: 0 !important;');
lines.push('  overflow: hidden !important;');
lines.push('}');
lines.push('');

// Slide-out animation for main menu when panel opens
lines.push('.ue_inner_menu.ue-panel-out {');
lines.push('  transform: translateX(110%) !important;');
lines.push('  opacity: 0 !important;');
lines.push('  pointer-events: none !important;');
lines.push('  transition: transform 0.28s ease, opacity 0.22s ease !important;');
lines.push('}');
lines.push('');

// Sub-panel — full screen overlay
lines.push('.ue-sub-panel {');
lines.push('  position: fixed !important;');
lines.push('  inset: 0 !important;');
lines.push('  width: 100% !important;');
lines.push('  height: 100% !important;');
lines.push('  background: #0F172B !important;');
lines.push('  transform: translateX(-100%);');
lines.push('  transition: transform 0.28s ease;');
lines.push('  display: flex !important;');
lines.push('  flex-direction: column !important;');
lines.push('  overflow-y: auto !important;');
lines.push('  z-index: 2147483647 !important;');
lines.push('  direction: rtl;');
lines.push('  box-sizing: border-box !important;');
lines.push('  margin: 0 !important;');
lines.push('}');
lines.push('.ue-sub-panel.ue-panel-in { transform: translateX(0) !important; }');
lines.push('');

// Panel header
lines.push('.ue-sub-header {');
lines.push('  display: flex; align-items: center; justify-content: space-between;');
lines.push('  padding: 18px 20px;');
lines.push('  border-bottom: 1px solid rgba(255,255,255,0.10);');
lines.push('  flex-shrink: 0;');
lines.push('}');
lines.push('.ue-sub-header-title { color:#fff; font-size:17px; font-weight:700; font-family:inherit; }');
lines.push('.ue-sub-close {');
lines.push('  width:34px; height:34px; display:flex; align-items:center; justify-content:center;');
lines.push('  cursor:pointer; color:#94a3b8; font-size:20px; line-height:1;');
lines.push('}');
lines.push('.ue-sub-close:hover { color:#fff; }');
lines.push('');

// Back row
lines.push('.ue-sub-back-row {');
lines.push('  display:flex; align-items:center; gap:8px; padding:12px 20px;');
lines.push('  cursor:pointer; color:#F97316; font-size:14px; font-weight:600;');
lines.push('  background:rgba(249,115,22,0.07); border-bottom:1px solid rgba(255,255,255,0.07);');
lines.push('  font-family:inherit;');
lines.push('}');
lines.push('');

// Item list
lines.push('.ue-sub-panel ul { list-style:none; padding:6px 0 24px; margin:0; width:100%; }');
lines.push('.ue-sub-panel ul li { width:100%; }');
lines.push('.ue-sub-panel ul li a {');
lines.push('  display:flex; align-items:center; justify-content:space-between;');
lines.push('  color:#e2e8f0; text-decoration:none;');
lines.push('  font-size:16px; font-weight:400; padding:15px 20px;');
lines.push('  border-bottom:1px solid rgba(255,255,255,0.05);');
lines.push('  direction:rtl; font-family:inherit;');
lines.push('  transition: background 0.12s, color 0.12s;');
lines.push('}');
lines.push('.ue-sub-panel ul li:last-child a { border-bottom:none; }');
lines.push('.ue-sub-panel ul li a::after { content:"›"; color:#475569; font-size:20px; }');
lines.push('.ue-sub-panel ul li a:hover, .ue-sub-panel ul li a:focus {');
lines.push('  background:rgba(249,115,22,0.08); color:#F97316;');
lines.push('}');
lines.push('.ue-sub-panel ul li a:hover::after { color:#F97316; }');
lines.push('/* END SUBMENU-PANEL-FIX v4 */');
lines.push('</style>');
lines.push('');

// ── JS ───────────────────────────────────────────────────────────────────────
lines.push('<script>');
lines.push('/* SUBMENU-PANEL-FIX v4 — document capture, most reliable */');
lines.push('(function() {');
lines.push('  var initialized = false;');
lines.push('');
lines.push('  function closeWholeMenu(widget) {');
lines.push('    if (!widget) return;');
lines.push('    var cb = widget.querySelector(\'.checkbox-toggle\');');
lines.push('    if (cb) { cb.checked = false; cb.dispatchEvent(new Event(\'change\')); }');
lines.push('    widget.classList.remove(\'menu-opened\');');
lines.push('    document.body.classList.remove(\'menu-opened\');');
lines.push('    document.documentElement.classList.remove(\'uc-force-disable-page-scroll\', \'menu-opened\');');
lines.push('  }');
lines.push('');
lines.push('  function removePanel(panel, innerMenu) {');
lines.push('    panel.classList.remove(\'ue-panel-in\');');
lines.push('    if (innerMenu) innerMenu.classList.remove(\'ue-panel-out\');');
lines.push('    setTimeout(function() { if (panel.parentNode) panel.remove(); }, 320);');
lines.push('  }');
lines.push('');
lines.push('  function openPanel(link) {');
lines.push('    var li = link.parentElement;');
lines.push('    var subMenu = li ? li.querySelector(\'.sub-menu\') : null;');
lines.push('    if (!subMenu) return;');
lines.push('    var innerMenu = link.closest(\'.ue_inner_menu\');');
lines.push('    var widget = link.closest(\'.ue-fullscreen-menu\');');
lines.push('    if (!innerMenu || !widget) return;');
lines.push('');
lines.push('    // Remove ue-sub-open if UCE set it');
lines.push('    li.classList.remove(\'ue-sub-open\');');
lines.push('');
lines.push('    // Remove any existing panel');
lines.push('    var old = document.querySelector(\'.ue-sub-panel\');');
lines.push('    if (old) old.remove();');
lines.push('    innerMenu.classList.remove(\'ue-panel-out\');');
lines.push('');
lines.push('    // Get label');
lines.push('    var label = \'\';');
lines.push('    link.childNodes.forEach(function(n) {');
lines.push('      if (n.nodeType === 3) label += n.textContent.trim();');
lines.push('    });');
lines.push('    if (!label) label = link.textContent.trim().replace(/[<>▾›‹□↑↓]/g, \'\').trim();');
lines.push('');
lines.push('    // Build panel');
lines.push('    var panel = document.createElement(\'div\');');
lines.push('    panel.className = \'ue-sub-panel\';');
lines.push('');
lines.push('    // Header');
lines.push('    var hdr = document.createElement(\'div\');');
lines.push('    hdr.className = \'ue-sub-header\';');
lines.push('    var ttl = document.createElement(\'span\');');
lines.push('    ttl.className = \'ue-sub-header-title\';');
lines.push('    ttl.textContent = label;');
lines.push('    var cls = document.createElement(\'div\');');
lines.push('    cls.className = \'ue-sub-close\';');
lines.push('    cls.innerHTML = \'&#10005;\';');
lines.push('    cls.addEventListener(\'click\', function(e) {');
lines.push('      e.stopPropagation();');
lines.push('      closeWholeMenu(widget);');
lines.push('      removePanel(panel, innerMenu);');
lines.push('    });');
lines.push('    hdr.appendChild(ttl); hdr.appendChild(cls);');
lines.push('    panel.appendChild(hdr);');
lines.push('');
lines.push('    // Back row');
lines.push('    var back = document.createElement(\'div\');');
lines.push('    back.className = \'ue-sub-back-row\';');
lines.push('    back.innerHTML = \'<span style="font-size:18px">‹</span><span>חזרה לתפריט</span>\';');
lines.push('    back.addEventListener(\'click\', function() { removePanel(panel, innerMenu); });');
lines.push('    panel.appendChild(back);');
lines.push('');
lines.push('    // Items');
lines.push('    var ul = document.createElement(\'ul\');');
lines.push('    subMenu.querySelectorAll(\'li\').forEach(function(item) {');
lines.push('      var clone = item.cloneNode(true);');
lines.push('      var a = clone.querySelector(\'a\');');
lines.push('      if (a) {');
lines.push('        a.addEventListener(\'click\', function() {');
lines.push('          closeWholeMenu(widget);');
lines.push('          removePanel(panel, innerMenu);');
lines.push('        });');
lines.push('      }');
lines.push('      ul.appendChild(clone);');
lines.push('    });');
lines.push('    panel.appendChild(ul);');
lines.push('');
lines.push('    document.body.appendChild(panel);');
lines.push('');
lines.push('    // Animate in');
lines.push('    requestAnimationFrame(function() {');
lines.push('      requestAnimationFrame(function() {');
lines.push('        if (innerMenu) innerMenu.classList.add(\'ue-panel-out\');');
lines.push('        panel.classList.add(\'ue-panel-in\');');
lines.push('      });');
lines.push('    });');
lines.push('  }');
lines.push('');
lines.push('  // Register at DOCUMENT level, capture phase — fires before ALL other handlers');
lines.push('  document.addEventListener(\'click\', function(e) {');
lines.push('    var link = e.target.closest(\'.ue_inner_menu .menu-item-has-children > a\');');
lines.push('    if (!link) return;');
lines.push('    e.preventDefault();');
lines.push('    e.stopPropagation();');
lines.push('    e.stopImmediatePropagation();');
lines.push('    openPanel(link);');
lines.push('  }, true);');
lines.push('');
lines.push('})();');
lines.push('/* END SUBMENU-PANEL-FIX v4 JS */');
lines.push('</script>');

const block = lines.join('\n');
const result = cleanHtml + '\n' + block + '\n</body>\n</html>';
console.log('Final size:', Math.round(result.length / 1024), 'KB');

// Quick sanity check
const count = (result.match(/SUBMENU-PANEL-FIX/g) || []).length;
console.log('SUBMENU-PANEL-FIX count:', count);

fs.writeFileSync(filePath, result, 'utf8');
console.log('Done!');
