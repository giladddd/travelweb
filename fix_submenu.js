/**
 * fix_submenu.js — Add fullscreen-menu slide-in panel behavior for
 * "המדריך המלא לטיול" (and any other menu-item-has-children).
 *
 * When user clicks a parent nav item that has children, the main menu
 * slides out and a new panel slides in showing the sub-items —
 * exactly like the UCFullscreenMenu plugin does on the live site.
 * A "< back" header at the top returns to the main list.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const CSS_AND_JS = `
<style>
/* ── SUBMENU-PANEL-FIX: slide-in panel for fullscreen menu sub-menus ── */

/* Main menu list slides away when a sub-panel is open */
.ue_inner_menu.ue-panel-out {
  transform: translateX(100%) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transition: transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.32s ease !important;
}
.ue_inner_menu {
  transition: transform 0.32s cubic-bezier(.4,0,.2,1), opacity 0.32s ease;
  will-change: transform, opacity;
}

/* The slide-in submenu panel */
.ue-sub-panel {
  position: absolute;
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
  z-index: 20;
  padding-top: 40px;
  padding-bottom: 40px;
  box-sizing: border-box;
}
.ue-sub-panel.ue-panel-in {
  transform: translateX(0);
}

/* Back button row */
.ue-sub-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px 24px;
  cursor: pointer;
  color: #F97316;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 16px;
  box-sizing: border-box;
}
.ue-sub-back svg {
  flex-shrink: 0;
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
  padding: 14px 20px;
  transition: color 0.15s ease;
  direction: rtl;
}
.ue-sub-panel ul li a:hover,
.ue-sub-panel ul li a:focus {
  color: #F97316;
}

/* Hide existing .sub-menu (we render them in the panel instead) */
.ue_inner_menu .sub-menu {
  display: none !important;
}
/* END SUBMENU-PANEL-FIX */
</style>

<script>
/* ═══ SUBMENU-PANEL-FIX ══════════════════════════════════════════════════ */
(function(){
document.addEventListener('DOMContentLoaded', function() {

  /* Find all fullscreen-menu widgets */
  document.querySelectorAll('.ue-fullscreen-menu').forEach(function(widget) {
    var innerMenu = widget.querySelector('.ue_inner_menu');
    if (!innerMenu) return;
    var menuContainer = innerMenu.parentElement; // the container that holds both panels

    /* For each parent nav item with children */
    innerMenu.querySelectorAll('.menu-item-has-children > a').forEach(function(parentLink) {
      var li = parentLink.parentElement;
      var subMenu = li.querySelector('.sub-menu');
      if (!subMenu) return;

      /* The label shown in the panel's back-button row */
      var parentLabel = parentLink.childNodes[0].textContent.trim();

      parentLink.addEventListener('click', function(e) {
        e.preventDefault();

        /* Build the slide-in panel */
        var panel = document.createElement('div');
        panel.className = 'ue-sub-panel';

        /* Back button */
        var back = document.createElement('div');
        back.className = 'ue-sub-back';
        back.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
          '<span>' + parentLabel + '</span>';

        back.addEventListener('click', function() {
          /* Slide panel back out */
          panel.classList.remove('ue-panel-in');
          innerMenu.classList.remove('ue-panel-out');
          setTimeout(function() { panel.remove(); }, 340);
        });
        panel.appendChild(back);

        /* Clone the sub-items into the panel */
        var ul = document.createElement('ul');
        subMenu.querySelectorAll('li').forEach(function(item) {
          var clone = item.cloneNode(true);
          /* Make sure clicking a sub-item navigates AND closes the menu */
          var a = clone.querySelector('a');
          if (a) {
            a.addEventListener('click', function() {
              /* Close the whole fullscreen menu */
              var cb = widget.querySelector('.checkbox-toggle');
              if (cb) {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
              }
              widget.classList.remove('menu-opened');
              document.body.classList.remove('menu-opened');
              document.documentElement.classList.remove('uc-force-disable-page-scroll','menu-opened');
              /* Remove panel */
              panel.remove();
              innerMenu.classList.remove('ue-panel-out');
            });
          }
          ul.appendChild(clone);
        });
        panel.appendChild(ul);

        /* Attach panel to the same container as the inner menu */
        menuContainer.style.position = 'relative';
        menuContainer.style.overflow = 'hidden';
        menuContainer.appendChild(panel);

        /* Trigger animation on next frame */
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            innerMenu.classList.add('ue-panel-out');
            panel.classList.add('ue-panel-in');
          });
        });
      });
    });
  });

});
})();
/* ═══════════════════════════════════════════════════════════════════════════ */
</script>
`;

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
let fixed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // Skip if already patched
  if (html.includes('SUBMENU-PANEL-FIX')) {
    continue;
  }

  // Inject before </body>
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose < 0) continue;

  html = html.substring(0, bodyClose) + CSS_AND_JS + '\n</body>' + html.substring(bodyClose + 7);
  fs.writeFileSync(file, html, 'utf8');
  fixed++;
}

console.log('✓ Submenu panel fix injected into ' + fixed + ' files.');
