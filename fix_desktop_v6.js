/**
 * fix_desktop_v6.js — Match reference design exactly:
 *   - Icon on LEFT (teal color, no box)
 *   - Text on RIGHT (white, right-aligned)
 *   - No chevron on items
 *   - Clean separators
 */
const fs = require('fs');
const filePath = 'C:/Users/gilad/OneDrive/שולחן העבודה/smart_traveller_home.html';
let html = fs.readFileSync(filePath, 'utf8');

// Strip previous injection
const cutPoint = html.indexOf('<style>\n/* ── SUBMENU-PANEL-FIX');
const cleanHtml = cutPoint > 0 ? html.substring(0, cutPoint) : html.replace(/\n<\/body>\n<\/html>$/, '');
console.log('Clean:', Math.round(cleanHtml.length / 1024), 'KB');

// SVG icons (Feather Icons, MIT)
const SVG = {
  globe:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  cloud:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  message: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  dollar:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  card:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  file:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  medical: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  shield:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  users:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  docs:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  phone:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  pack:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  plane:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  home:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  tag:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  wifi:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  def:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};

const TG_ICONS = {
  'TG_2':'globe','TG_3':'cloud','TG_4':'message','TG_5':'dollar',
  'TG_6':'card','TG_7':'file','TG_8':'medical','TG_9':'shield',
  'TG_10':'users','TG_11':'docs','TG_12':'phone','TG_13':'pack',
  'TG_14':'plane','TG_15':'home','TG_16':'tag','TG_17':'wifi',
  'TG_18':'card','TG_1':'globe',
};

const svgJson = JSON.stringify(SVG);
const tgJson  = JSON.stringify(TG_ICONS);

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `<style>
/* ── SUBMENU-PANEL-FIX v6 ── */

.ue-fullscreen-menu .ue_menu {
  height: 100vh !important; width: 100vw !important;
}
.ue-fullscreen-menu.menu-opened .ue_menu {
  visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;
}
.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu {
  visibility: visible !important; transform: scale(1) !important;
}
.ue_inner_menu .sub-menu, .ue_inner_menu li > ul.sub-menu {
  display: none !important; visibility: hidden !important;
  height: 0 !important; overflow: hidden !important;
}
.ue_inner_menu.ue-panel-out {
  transform: translateX(110%) !important; opacity: 0 !important;
  pointer-events: none !important;
  transition: transform 0.28s ease, opacity 0.22s ease !important;
}

/* ── Panel ── */
.ue-sub-panel {
  position: fixed !important; inset: 0 !important;
  width: 100% !important; height: 100% !important;
  background: #0d1526 !important;
  transform: translateX(-100%);
  transition: transform 0.28s ease;
  display: flex !important; flex-direction: column !important;
  overflow-y: auto !important; z-index: 2147483647 !important;
  direction: rtl; box-sizing: border-box !important; margin: 0 !important;
}
.ue-sub-panel.ue-panel-in { transform: translateX(0) !important; }

/* Top bar */
.ue-panel-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 16px; flex-shrink: 0;
}
.ue-panel-sitename {
  color: #fff; font-size: 16px; font-weight: 800; font-family: inherit;
  letter-spacing: 0.5px;
}
.ue-panel-x {
  width: 30px; height: 30px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: #64748b;
  font-size: 17px; line-height: 1; transition: color 0.15s;
}
.ue-panel-x:hover { color: #fff; }

/* Category row */
.ue-panel-catrow {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 20px; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 6px; flex-shrink: 0;
}
.ue-panel-catname { color: #e2e8f0; font-size: 15px; font-weight: 600; font-family: inherit; }
.ue-panel-catarrow { color: #475569; font-size: 17px; }

/* Items */
.ue-sub-panel ul { list-style: none; padding: 0 0 30px; margin: 0; width: 100%; }
.ue-sub-panel ul li { width: 100%; }
.ue-sub-panel ul li a {
  display: flex; align-items: center;
  padding: 0 20px;
  height: 52px;
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  direction: rtl; transition: background 0.12s;
}
.ue-sub-panel ul li:last-child a { border-bottom: none; }

/* Text on RIGHT (first in RTL flex = start = right) */
.ue-panel-item-text {
  flex: 1; color: #e2e8f0; font-size: 15px; font-weight: 400;
  font-family: inherit; text-align: right;
}
/* Icon on LEFT (last in RTL flex = end = left) */
.ue-panel-item-icon {
  width: 22px; height: 22px; flex-shrink: 0;
  color: #2dd4bf;
  display: flex; align-items: center; justify-content: center;
}

.ue-sub-panel ul li a:hover { background: rgba(255,255,255,0.04); }
.ue-sub-panel ul li a:hover .ue-panel-item-text { color: #F97316; }
.ue-sub-panel ul li a:hover .ue-panel-item-icon { color: #F97316; }
/* END SUBMENU-PANEL-FIX v6 */
</style>`;

// ── JS ───────────────────────────────────────────────────────────────────────
const js = `<script>
/* SUBMENU-PANEL-FIX v6 */
(function() {
  var SVG = ${svgJson};
  var TG_ICONS = ${tgJson};

  function getIcon(href) {
    if (!href) return SVG.def;
    var m = href.match(/#(TG_\\d+)/);
    if (m && TG_ICONS[m[1]] && SVG[TG_ICONS[m[1]]]) return SVG[TG_ICONS[m[1]]];
    return SVG.def;
  }

  function closeWholeMenu(widget) {
    var cb = widget && widget.querySelector('.checkbox-toggle');
    if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
    if (widget) widget.classList.remove('menu-opened');
    document.body.classList.remove('menu-opened');
    document.documentElement.classList.remove('uc-force-disable-page-scroll','menu-opened');
  }

  function removePanel(panel, innerMenu) {
    panel.classList.remove('ue-panel-in');
    if (innerMenu) innerMenu.classList.remove('ue-panel-out');
    setTimeout(function() { if (panel.parentNode) panel.remove(); }, 300);
  }

  function openPanel(link) {
    var li = link.parentElement;
    var subMenu = li && li.querySelector('.sub-menu');
    if (!subMenu) return;
    var innerMenu = link.closest('.ue_inner_menu');
    var widget    = link.closest('.ue-fullscreen-menu');
    if (!innerMenu || !widget) return;

    li.classList.remove('ue-sub-open');
    var old = document.querySelector('.ue-sub-panel');
    if (old) old.remove();
    innerMenu.classList.remove('ue-panel-out');

    // Label
    var label = '';
    link.childNodes.forEach(function(n){ if (n.nodeType===3) label += n.textContent.trim(); });
    if (!label) label = link.textContent.trim().replace(/[<>▾›‹□↑↓]/g,'').trim();

    // Panel
    var panel = document.createElement('div');
    panel.className = 'ue-sub-panel';

    // Top bar: [site name]  [X]
    var topbar = document.createElement('div');
    topbar.className = 'ue-panel-topbar';
    var site = document.createElement('span');
    site.className = 'ue-panel-sitename';
    site.textContent = 'המטייל החכם';
    var xBtn = document.createElement('div');
    xBtn.className = 'ue-panel-x';
    xBtn.innerHTML = '&#10005;';
    xBtn.addEventListener('click', function(e) {
      e.stopPropagation(); closeWholeMenu(widget); removePanel(panel, innerMenu);
    });
    topbar.appendChild(site); topbar.appendChild(xBtn);
    panel.appendChild(topbar);

    // Category row: [label]  [‹]
    var catRow = document.createElement('div');
    catRow.className = 'ue-panel-catrow';
    var catName = document.createElement('span');
    catName.className = 'ue-panel-catname';
    catName.textContent = label;
    var catArr = document.createElement('span');
    catArr.className = 'ue-panel-catarrow';
    catArr.innerHTML = '&#8249;';
    catRow.appendChild(catName); catRow.appendChild(catArr);
    catRow.addEventListener('click', function() { removePanel(panel, innerMenu); });
    panel.appendChild(catRow);

    // Items: [text]  [icon]  (RTL: text on right, icon on left)
    var ul = document.createElement('ul');
    subMenu.querySelectorAll('li').forEach(function(item) {
      var origA = item.querySelector('a');
      if (!origA) return;
      var li2 = document.createElement('li');
      var a = document.createElement('a');
      a.href = origA.getAttribute('href') || '#';

      // Text (goes to RIGHT in RTL flex)
      var txt = document.createElement('span');
      txt.className = 'ue-panel-item-text';
      txt.textContent = origA.textContent.trim();

      // Icon (goes to LEFT in RTL flex = appended last)
      var ico = document.createElement('span');
      ico.className = 'ue-panel-item-icon';
      ico.innerHTML = getIcon(origA.getAttribute('href'));

      a.appendChild(txt);
      a.appendChild(ico);

      a.addEventListener('click', function() {
        closeWholeMenu(widget); removePanel(panel, innerMenu);
      });
      li2.appendChild(a); ul.appendChild(li2);
    });
    panel.appendChild(ul);
    document.body.appendChild(panel);

    requestAnimationFrame(function() { requestAnimationFrame(function() {
      innerMenu.classList.add('ue-panel-out');
      panel.classList.add('ue-panel-in');
    }); });
  }

  // Document-level capture — fires before ALL other handlers
  document.addEventListener('click', function(e) {
    var link = e.target.closest && e.target.closest('.ue_inner_menu .menu-item-has-children > a');
    if (!link) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    openPanel(link);
  }, true);

})();
/* END SUBMENU-PANEL-FIX v6 */
</script>`;

const result = cleanHtml + '\n' + css + '\n' + js + '\n</body>\n</html>';
console.log('Final size:', Math.round(result.length / 1024), 'KB');
fs.writeFileSync(filePath, result, 'utf8');
console.log('Done!');
