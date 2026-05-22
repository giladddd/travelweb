/**
 * fix_submenu3.js — Replace SUBMENU-PANEL-FIX v2 with v3.
 *
 * v3 fixes the "sub-items show inline" bug by:
 * 1. More aggressive CSS: hides .sub-menu even when li has ue-sub-open
 * 2. JS uses e.stopImmediatePropagation() so the old MENU-TOGGLE-FIX
 *    ue-sub-open handler never fires.
 * 3. After creating panel, actively removes ue-sub-open from li as safety.
 */
const fs   = require('fs');
const path = require('path');
const ROOT = __dirname;

const NEW_BLOCK = `<style>
/* ── SUBMENU-PANEL-FIX v3: slide-in panel for fullscreen menu sub-menus ── */

/* Aggressively hide .sub-menu in ALL states — even when li has ue-sub-open */
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
}

/* Main menu list slides/fades away when a sub-panel is open */
.ue_inner_menu.ue-panel-out {
  transform: translateX(100%) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transition: transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.28s ease !important;
}
.ue_inner_menu {
  transition: transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.28s ease;
  position: relative;
}

/* The slide-in submenu panel — fixed to fill the entire screen */
.ue-sub-panel {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #0F172B;
  transform: translateX(-100%);
  transition: transform 0.32s cubic-bezier(.4,0,.2,1);
  will-change: transform;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
  z-index: 999999;
  padding-top: 30px;
  padding-bottom: 40px;
  box-sizing: border-box;
  direction: rtl;
}
.ue-sub-panel.ue-panel-in {
  transform: translateX(0);
}

/* Back / header row */
.ue-sub-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px 20px;
  cursor: pointer;
  color: #F97316;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 10px;
  box-sizing: border-box;
}
.ue-sub-back-arrow {
  font-size: 24px;
  line-height: 1;
  color: #F97316;
}

/* Sub-panel item list */
.ue-sub-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  text-align: center;
}
.ue-sub-panel ul li {
  width: 100%;
}
.ue-sub-panel ul li a {
  display: block;
  color: #ffffff;
  text-decoration: none;
  font-size: 22px;
  font-weight: 400;
  padding: 13px 20px;
  transition: color 0.15s ease;
  direction: rtl;
  font-family: inherit;
}
.ue-sub-panel ul li a:hover,
.ue-sub-panel ul li a:focus {
  color: #F97316;
}

/* Close (X) button at top-left of panel */
.ue-sub-close {
  position: absolute;
  top: 16px;
  left: 20px;
  width: 44px;
  height: 44px;
  background: #F97316;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  z-index: 1;
  transition: background 0.15s;
}
.ue-sub-close:hover { background: #e05e00; }
/* END SUBMENU-PANEL-FIX v3 */
</style>

<script>
/* ═══ SUBMENU-PANEL-FIX v3 ══════════════════════════════════════════════ */
(function(){
document.addEventListener('DOMContentLoaded', function() {

  document.querySelectorAll('.ue-fullscreen-menu').forEach(function(widget) {
    var innerMenu = widget.querySelector('.ue_inner_menu');
    if (!innerMenu) return;

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

      /* Label for the header (strip the dropdown arrow span text) */
      var parentLabel = '';
      parentLink.childNodes.forEach(function(n) {
        if (n.nodeType === 3) parentLabel += n.textContent.trim();
      });
      if (!parentLabel) parentLabel = parentLink.textContent.trim().replace(/[<>▾›‹]/g,'').trim();

      /* Use capture phase + stopImmediatePropagation so we run BEFORE
         the old MENU-TOGGLE-FIX handler that adds ue-sub-open */
      parentLink.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        /* Safety: remove ue-sub-open if old handler snuck it in */
        li.classList.remove('ue-sub-open');

        /* Remove any existing panel */
        var existing = document.querySelector('.ue-sub-panel');
        if (existing) existing.remove();
        innerMenu.classList.remove('ue-panel-out');

        /* Build the panel */
        var panel = document.createElement('div');
        panel.className = 'ue-sub-panel';

        /* Close (X) button */
        var closeBtn = document.createElement('div');
        closeBtn.className = 'ue-sub-close';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          closeWholeMenu();
          panel.classList.remove('ue-panel-in');
          innerMenu.classList.remove('ue-panel-out');
          setTimeout(function() { panel.remove(); }, 340);
        });
        panel.appendChild(closeBtn);

        /* Back header */
        var back = document.createElement('div');
        back.className = 'ue-sub-back';
        back.innerHTML = '<span class="ue-sub-back-arrow">›</span><span>' + parentLabel + '</span>';
        back.addEventListener('click', function() {
          panel.classList.remove('ue-panel-in');
          innerMenu.classList.remove('ue-panel-out');
          setTimeout(function() { panel.remove(); }, 340);
        });
        panel.appendChild(back);

        /* Sub-items */
        var ul = document.createElement('ul');
        subMenu.querySelectorAll('li').forEach(function(item) {
          var clone = item.cloneNode(true);
          var a = clone.querySelector('a');
          if (a) {
            a.addEventListener('click', function() {
              closeWholeMenu();
              panel.classList.remove('ue-panel-in');
              innerMenu.classList.remove('ue-panel-out');
              setTimeout(function() { panel.remove(); }, 340);
            });
          }
          ul.appendChild(clone);
        });
        panel.appendChild(ul);

        document.body.appendChild(panel);

        /* Animate in */
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            innerMenu.classList.add('ue-panel-out');
            panel.classList.add('ue-panel-in');
          });
        });
      }, true); /* true = capture phase — fires before bubble-phase listeners */
    });
  });

});
})();
/* ══════════════════════════════════════════════════════════════════════════ */
</script>`;

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

// Markers that bound ANY existing SUBMENU-PANEL-FIX block (v1 or v2)
const START_MARKER = '<style>\n/* ── SUBMENU-PANEL-FIX';
const END_SUFFIX   = '</script>';
const END_SENTINEL_V1 = '/* ═══════════════════════════════════════════════════════════════════════════ */\n</script>';
const END_SENTINEL_V2 = '/* ══════════════════════════════════════════════════════════════════════════ */\n</script>';

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes('SUBMENU-PANEL-FIX')) {
    // Not yet patched — inject before </body>
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose < 0) continue;
    html = html.substring(0, bodyClose) + '\n' + NEW_BLOCK + '\n</body>' + html.substring(bodyClose + 7);
    fs.writeFileSync(file, html, 'utf8');
    updated++;
    continue;
  }

  const startIdx = html.indexOf(START_MARKER);
  if (startIdx < 0) continue;

  // Find end: try both sentinel patterns
  let endIdx = -1;
  for (const sentinel of [END_SENTINEL_V2, END_SENTINEL_V1]) {
    const pos = html.indexOf(sentinel, startIdx);
    if (pos >= 0) {
      endIdx = pos + sentinel.length;
      break;
    }
  }

  if (endIdx < 0) {
    // Fallback: find the closing </script> after the JS section
    const jsStart = html.indexOf('<script>', startIdx + 100);
    if (jsStart < 0) continue;
    const jsEnd = html.indexOf('</script>', jsStart);
    if (jsEnd < 0) continue;
    endIdx = jsEnd + '</script>'.length;
  }

  html = html.substring(0, startIdx) + NEW_BLOCK + html.substring(endIdx);
  fs.writeFileSync(file, html, 'utf8');
  updated++;
}

console.log('✓ Applied SUBMENU-PANEL-FIX v3 to ' + updated + ' files.');
