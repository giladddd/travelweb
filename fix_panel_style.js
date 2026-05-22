/**
 * fix_panel_style.js — Update SUBMENU-PANEL-FIX CSS to match reference design
 * (item-list style with right-aligned text, chevrons, site colors)
 * Applies to: smart_traveller_home.html on desktop
 */
const fs = require('fs');

const NEW_CSS = `<style>
/* ── SUBMENU-PANEL-FIX v3 ── */

/* Hide all sub-menus completely in ALL states */
.ue_inner_menu .sub-menu,
.ue_inner_menu .menu-item-has-children > .sub-menu,
.ue_inner_menu .menu-item-has-children.ue-sub-open > .sub-menu,
.ue_inner_menu li.ue-sub-open > .sub-menu,
.ue_inner_menu li > ul.sub-menu {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  max-height: 0 !important;
  overflow: hidden !important;
  height: 0 !important;
}

/* Main menu slides right when sub-panel opens */
.ue_inner_menu.ue-panel-out {
  transform: translateX(100%) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transition: transform 0.30s cubic-bezier(.4,0,.2,1), opacity 0.25s ease !important;
}
.ue_inner_menu {
  transition: transform 0.30s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
}

/* ── Sub-panel overlay ── */
.ue-sub-panel {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #0F172B;
  transform: translateX(-100%);
  transition: transform 0.30s cubic-bezier(.4,0,.2,1);
  will-change: transform;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow-y: auto;
  z-index: 9999999;
  box-sizing: border-box;
  direction: rtl;
}
.ue-sub-panel.ue-panel-in { transform: translateX(0); }

/* ── Panel header ── */
.ue-sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
  flex-shrink: 0;
}
.ue-sub-header-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  font-family: inherit;
}
.ue-sub-close {
  width: 36px; height: 36px;
  background: transparent;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  font-size: 22px;
  line-height: 1;
  transition: color 0.15s;
  padding: 0;
}
.ue-sub-close:hover { color: #ffffff; }

/* ── Back row ── */
.ue-sub-back-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 20px;
  cursor: pointer;
  color: #F97316;
  font-size: 14px;
  font-weight: 600;
  background: rgba(249,115,22,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-family: inherit;
}
.ue-sub-back-row:hover { color: #ffab6e; }

/* ── Items list ── */
.ue-sub-panel ul {
  list-style: none;
  padding: 6px 0 0 0;
  margin: 0;
  width: 100%;
}
.ue-sub-panel ul li { width: 100%; }
.ue-sub-panel ul li a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #e2e8f0;
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  padding: 15px 20px;
  transition: background 0.12s, color 0.12s;
  direction: rtl;
  font-family: inherit;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.ue-sub-panel ul li:last-child a { border-bottom: none; }
.ue-sub-panel ul li a::after {
  content: '›';
  color: #475569;
  font-size: 20px;
  flex-shrink: 0;
  margin-right: 4px;
  transition: color 0.12s;
}
.ue-sub-panel ul li a:hover,
.ue-sub-panel ul li a:focus {
  background: rgba(249,115,22,0.08);
  color: #F97316;
}
.ue-sub-panel ul li a:hover::after,
.ue-sub-panel ul li a:focus::after { color: #F97316; }
/* END SUBMENU-PANEL-FIX v3 */
</style>`;

const NEW_JS = `<script>
/* ═══ SUBMENU-PANEL-FIX v3 ══════════════════════════════════════════════ */
(function(){
function initSubPanel() {
  document.querySelectorAll('.ue-fullscreen-menu').forEach(function(widget) {
    var innerMenu = widget.querySelector('.ue_inner_menu');
    if (!innerMenu) return;
    if (innerMenu.dataset.subPanelReady) return;
    innerMenu.dataset.subPanelReady = '1';

    function closeWholeMenu() {
      var cb = widget.querySelector('.checkbox-toggle');
      if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
      widget.classList.remove('menu-opened');
      document.body.classList.remove('menu-opened');
      document.documentElement.classList.remove('uc-force-disable-page-scroll','menu-opened');
    }

    innerMenu.querySelectorAll('.menu-item-has-children > a').forEach(function(parentLink) {
      var li = parentLink.parentElement;
      var subMenu = li.querySelector('.sub-menu');
      if (!subMenu) return;

      var parentLabel = '';
      parentLink.childNodes.forEach(function(n) {
        if (n.nodeType === 3) parentLabel += n.textContent.trim();
      });
      if (!parentLabel) parentLabel = parentLink.textContent.trim().replace(/[<>▾›‹□]/g,'').trim();

      parentLink.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        li.classList.remove('ue-sub-open');

        var existing = document.querySelector('.ue-sub-panel');
        if (existing) existing.remove();
        innerMenu.classList.remove('ue-panel-out');

        /* Build panel */
        var panel = document.createElement('div');
        panel.className = 'ue-sub-panel';

        /* Header row */
        var header = document.createElement('div');
        header.className = 'ue-sub-header';

        var title = document.createElement('span');
        title.className = 'ue-sub-header-title';
        title.textContent = parentLabel;

        var closeBtn = document.createElement('div');
        closeBtn.className = 'ue-sub-close';
        closeBtn.innerHTML = '&#10005;';
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          closeWholeMenu();
          panel.classList.remove('ue-panel-in');
          innerMenu.classList.remove('ue-panel-out');
          setTimeout(function() { panel.remove(); }, 320);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        /* Back row */
        var backRow = document.createElement('div');
        backRow.className = 'ue-sub-back-row';
        backRow.innerHTML = '<span style="font-size:16px;line-height:1">‹</span><span>חזרה לתפריט</span>';
        backRow.addEventListener('click', function() {
          panel.classList.remove('ue-panel-in');
          innerMenu.classList.remove('ue-panel-out');
          setTimeout(function() { panel.remove(); }, 320);
        });
        panel.appendChild(backRow);

        /* Items */
        var ul = document.createElement('ul');
        subMenu.querySelectorAll('li').forEach(function(item) {
          var clone = item.cloneNode(true);
          var a = clone.querySelector('a');
          if (a) {
            a.addEventListener('click', function() {
              closeWholeMenu();
              panel.classList.remove('ue-panel-in');
              innerMenu.classList.remove('ue-panel-out');
              setTimeout(function() { panel.remove(); }, 320);
            });
          }
          ul.appendChild(clone);
        });
        panel.appendChild(ul);

        document.body.appendChild(panel);

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            innerMenu.classList.add('ue-panel-out');
            panel.classList.add('ue-panel-in');
          });
        });
      }, true); /* capture phase */
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSubPanel);
} else {
  initSubPanel();
}
if (typeof jQuery !== 'undefined') {
  jQuery(document).ready(function() { setTimeout(initSubPanel, 150); });
}
})();
/* ══════════════════════════════════════════════════════════════════════════ */
</script>`;

const filePath = 'C:/Users/gilad/OneDrive/שולחן העבודה/smart_traveller_home.html';
let html = fs.readFileSync(filePath, 'utf8');

// Remove existing SUBMENU-PANEL-FIX block (CSS + JS)
const blockStart = html.indexOf('<style>\n/* ── SUBMENU-PANEL-FIX v3 ──');
const scriptEnd = html.indexOf('/* ═══════════════════════════════════════════════════════════════════════════ */\n</script>', blockStart);
const blockEnd = scriptEnd + '/* ═══════════════════════════════════════════════════════════════════════════ */\n</script>'.length;

console.log('Block found:', blockStart > 0, '| End:', blockEnd);

html = html.substring(0, blockStart) + NEW_CSS + '\n' + NEW_JS + html.substring(blockEnd);
fs.writeFileSync(filePath, html, 'utf8');
console.log('Done! Panel CSS+JS updated with new design.');
