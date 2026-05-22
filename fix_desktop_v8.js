/**
 * fix_desktop_v8.js — Combined: submenu slide-in panel (v7) + localStorage cart
 * Single clean injection from the 566KB original base.
 */
const fs = require('fs');
const filePath = 'C:/Users/gilad/OneDrive/שולחן העבודה/smart_traveller_home.html';
let html = fs.readFileSync(filePath, 'utf8');

// ── Strip all previous injections → back to clean base ───────────────────────
// Primary: find our unique sentinel tag (added from v8 onwards)
let cutPoint = html.indexOf('<!-- ST_INJECT_v8 -->');
// Secondary: find the last </body> tag
if (cutPoint < 0) cutPoint = html.lastIndexOf('\n</body>');
// Tertiary: strip just the closing tags
let cleanBase = cutPoint > 0 ? html.substring(0, cutPoint) : html.replace(/\n<\/body>\n<\/html>$/, '');
// ── Also strip any OLD blocks baked in before the sentinel existed ────────────
// Remove old CSS injection blocks that start with our specific marker comment
cleanBase = cleanBase.replace(
  /<style>\s*\/\* ── SUBMENU-PANEL-FIX v8 ──[\s\S]*?\/\* END SUBMENU-PANEL-FIX v8 \*\/\s*<\/style>/g,
  ''
);
// Remove old JS injection blocks that start with our specific marker comment
cleanBase = cleanBase.replace(
  /<script>\s*\/\* SUBMENU-PANEL-FIX v8 \+ CART \*\/[\s\S]*?\/\* END SUBMENU-PANEL-FIX v8 \+ CART \*\/\s*<\/script>/g,
  ''
);
// Also neutralise any stale uc-button-addcart redirect handlers baked into old base
cleanBase = cleanBase.replace(
  /window\.location\.href\s*=\s*'order-summary\.html'/g,
  '/* redirect removed by ST_INJECT_v8 */'
);
console.log('Clean base:', Math.round(cleanBase.length / 1024), 'KB');

// ── Fix relative asset paths → absolute file:// so Desktop HTML can load CSS ─
// assets/ is in C:/Users/gilad/smart_traveller_local/assets/ (not on Desktop)
const LOCAL_ASSETS = 'file:///C:/Users/gilad/smart_traveller_local/';
cleanBase = cleanBase
  .replace(/href='assets\//g,  `href='${LOCAL_ASSETS}assets/`)
  .replace(/href="assets\//g,  `href="${LOCAL_ASSETS}assets/`)
  .replace(/src='assets\//g,   `src='${LOCAL_ASSETS}assets/`)
  .replace(/src="assets\//g,   `src="${LOCAL_ASSETS}assets/`);

// ── Fix broken regex in index.html (HTTrack artifact) ────────────────────────
// Original: replace(//$/,'') → should be replace(/\/$/, '')
cleanBase = cleanBase.replace(/replace\(\/\/\$\/,\s*''\)/g, "replace(/\\/$/,'')");

// ── Fix jQuery: HTTrack broke the path → load from CDN ───────────────────────
// 1. Main jQuery → CDN (must match ONLY jquery.min.js, not migrate or ui)
cleanBase = cleanBase.replace(
  /<script[^>]*src="index\.html[^"]*\/jquery\.min\.js[^"]*"[^>]*><\/script>/gi,
  '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>'
);
// 2. jquery-migrate → remove (not needed)
cleanBase = cleanBase.replace(
  /<script[^>]*src="index\.html[^"]*jquery-migrate[^"]*"[^>]*><\/script>/gi,
  ''
);
// 3. Any remaining index.html-prefixed scripts (wp-includes, wp-emoji, etc.) → remove
cleanBase = cleanBase.replace(
  /<script[^>]*src="index\.html[^"]*"[^>]*><\/script>/gi,
  ''
);

// ── Fix cart links in clean base (live URL → local) ──────────────────────────
let cleanHtml = cleanBase;

// 1. Fix menu text link "לעגלה שלי" (lowercase hex, mobile menu)
cleanHtml = cleanHtml.replace(
  /href="https:\/\/the-smart-traveller\.com\/[^"]*%d7%a1%d7%99%d7%9b%d7%95%d7%9d[^"]*"(\s+class="menu-link")?>לעגלה שלי<\/a>/g,
  'href="order-summary.html" class="menu-link">לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;align-items:center;justify-content:center;margin-right:4px;vertical-align:middle;"></span></a>'
);
// Re-run safe
cleanHtml = cleanHtml.replace(
  /href="order-summary\.html" class="menu-link">לעגלה שלי<\/a>/g,
  'href="order-summary.html" class="menu-link">לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;align-items:center;justify-content:center;margin-right:4px;vertical-align:middle;"></span></a>'
);

// 2. Fix header cart ICON link (class BEFORE href in Elementor HTML)
const cartIconBefore = (cleanHtml.match(/class="elementor-icon[^"]*"\s+href="https:\/\/the-smart-traveller\.com\/[^"]*(%D7%A1|%d7%a1)[^"]*"/g)||[]).length;
console.log('Cart icon matches found:', cartIconBefore);
cleanHtml = cleanHtml.replace(
  /class="elementor-icon([^"]*)"\s+href="https:\/\/the-smart-traveller\.com\/[^"]*(%D7%A1|%d7%a1)[^"]*"/g,
  'class="elementor-icon$1 st-cart-icon-link" href="order-summary.html"'
);

const cartLinkCount = (cleanHtml.match(/st-cart-badge/g)||[]).length;
console.log('Cart badge spans added:', cartLinkCount);

// SVG icons
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
const SENTINEL = '<!-- ST_INJECT_v8 -->';
const css = `${SENTINEL}<style>
/* ── SUBMENU-PANEL-FIX v8 ── */
.ue-fullscreen-menu .ue_menu { height:100vh!important;width:100vw!important; }
.ue-fullscreen-menu.menu-opened .ue_menu { visibility:visible!important;opacity:1!important;pointer-events:auto!important; }
.ue-fullscreen-menu.menu-opened .ue_menu .ue_inner_menu { visibility:visible!important;transform:scale(1)!important; }
.ue_inner_menu .sub-menu,.ue_inner_menu li > ul.sub-menu { display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important; }
.ue_inner_menu.ue-panel-out { transform:translateX(110%)!important;opacity:0!important;pointer-events:none!important;transition:transform 0.28s ease,opacity 0.22s ease!important; }
.ue-sub-panel { position:fixed!important;inset:0!important;width:100%!important;height:100%!important;background:#0d1526!important;transform:translateX(-100%);transition:transform 0.28s ease;display:flex!important;flex-direction:column!important;overflow-y:auto!important;z-index:2147483647!important;direction:rtl;box-sizing:border-box!important;margin:0!important; }
.ue-sub-panel.ue-panel-in { transform:translateX(0)!important; }
.ue-panel-topbar { display:flex;align-items:center;justify-content:space-between;padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.10);flex-shrink:0; }
.ue-panel-title { color:#fff;font-size:16px;font-weight:700;font-family:inherit;flex:1;text-align:center; }
.ue-panel-back { display:flex;align-items:center;gap:5px;cursor:pointer;color:#2dd4bf;font-size:14px;font-weight:600;font-family:inherit;padding:6px 4px;border-radius:6px;transition:color 0.15s;flex-shrink:0; }
.ue-panel-back:hover { color:#F97316; }
.ue-panel-back svg { flex-shrink:0; }
.ue-panel-x { width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;font-size:18px;line-height:1;transition:color 0.15s;flex-shrink:0; }
.ue-panel-x:hover { color:#fff; }
.ue-sub-panel ul { list-style:none;padding:0 0 30px;margin:0;width:100%; }
.ue-sub-panel ul li { width:100%; }
.ue-sub-panel ul li a { display:flex;align-items:center;padding:0 20px;height:54px;text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.06);direction:rtl;transition:background 0.15s;gap:14px; }
.ue-sub-panel ul li:last-child a { border-bottom:none; }
.ue-panel-item-text { flex:1;color:#e2e8f0;font-size:16px;font-weight:400;font-family:inherit;text-align:right; }
.ue-panel-item-icon { width:22px;height:22px;flex-shrink:0;color:#2dd4bf;display:flex;align-items:center;justify-content:center; }
.ue-sub-panel ul li a:hover { background:rgba(255,255,255,0.05); }
.ue-sub-panel ul li a:hover .ue-panel-item-text { color:#F97316; }
.ue-sub-panel ul li a:hover .ue-panel-item-icon { color:#F97316; }
/* ── Main menu redesign (match sub-panel style) ── */
#uc_fullscreen_navigation_menu_elementor_fe7d88b.menu-opened .ue-input-wrapper-align { display:none !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .ue_inner_menu-box { display:flex !important; flex-direction:column !important; height:100% !important; }
.ue-menu-list-wrap { flex:1 !important; overflow-y:auto !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu { list-style:none !important; padding:0 !important; margin:0 !important; width:100% !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li { padding:0 !important; width:100% !important; display:block !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li > a.menu-link { display:flex !important; align-items:center !important; padding:0 20px !important; height:54px !important; width:100% !important; border-bottom:1px solid rgba(255,255,255,0.06) !important; color:#e2e8f0 !important; font-size:16px !important; font-weight:400 !important; direction:rtl !important; box-sizing:border-box !important; text-decoration:none !important; gap:14px !important; transition:background 0.15s !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li > a.menu-link:hover { color:#F97316 !important; background:rgba(255,255,255,0.05) !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li.current-menu-item > a.menu-link { color:#F97316 !important; }
/* ── Drop-arrow: kill with every trick available ── */
#uc_fullscreen_navigation_menu_elementor_fe7d88b .ue_inner_menu_expand_icon,
#uc_fullscreen_navigation_menu_elementor_fe7d88b .ue_inner_menu_collapse_icon { display:none !important; visibility:hidden !important; height:0 !important; max-height:0 !important; overflow:hidden !important; pointer-events:none !important; }
/* ── Chevron on expandable item (CSS-only) ── */
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li.menu-item-has-children > a.menu-link { justify-content:space-between !important; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .uc-list-menu > li.menu-item-has-children > a.menu-link::after { content:'\\2039'; flex-shrink:0; color:#64748b; font-size:22px; font-weight:300; line-height:1; }
#uc_fullscreen_navigation_menu_elementor_fe7d88b .dropdown-menu-toggle { display:none !important; }
/* Cart icon badge positioning */
.elementor-icon-wrapper { position: relative; }
/* ── Header: cart far-left, logo far-right (RTL) ── */
[data-id="e4ae80a"] { display:flex !important; flex-direction:row !important; justify-content:space-between !important; align-items:center !important; width:100% !important; }
[data-id="37de25e"] { order:1 !important; }
[data-id="fe7d88b"] { order:2 !important; flex:1 !important; display:flex !important; justify-content:center !important; }
/* Desktop cart icon — force visible and styled */
[data-id="4a25f86"] { order:3 !important; display:flex !important; align-items:center !important; }
[data-id="4a25f86"] .elementor-icon { color:#fff !important; font-size:22px !important; }
[data-id="4a25f86"] .elementor-icon svg { width:24px !important; height:24px !important; fill:#fff !important; }
/* Mobile cart icon — שמאל במובייל */
@media (min-width:768px) { [data-id="f2b4aaa"] { display:none !important; } }
@media (max-width:767px) {
  [data-id="37de25e"] { order:1 !important; }
  [data-id="fe7d88b"] { order:2 !important; }
  [data-id="f2b4aaa"] { order:3 !important; display:flex !important; align-items:center !important; }
}
/* ── Hero buttons: extra spacing ── */
[data-id="9530b7e"] { margin-bottom:20px !important; }
[data-id="7bcc2ce"] { margin-top:6px !important; }
/* END SUBMENU-PANEL-FIX v8 */
</style>`;

// ── JS ────────────────────────────────────────────────────────────────────────
const js = `<script>
/* SUBMENU-PANEL-FIX v8 + CART */
(function(){
  /* ── SVG icons ── */
  var SVG=${svgJson};
  var TG_ICONS=${tgJson};
  function getIcon(href){
    if(!href) return SVG.def;
    var m=href.match(/#(TG_\\d+)/);
    if(m&&TG_ICONS[m[1]]&&SVG[TG_ICONS[m[1]]]) return SVG[TG_ICONS[m[1]]];
    return SVG.def;
  }

  /* ── Menu helpers ── */
  function closeWholeMenu(widget){
    var cb=widget&&widget.querySelector('.checkbox-toggle');
    if(cb){cb.checked=false;cb.dispatchEvent(new Event('change'));}
    if(widget) widget.classList.remove('menu-opened');
    document.body.classList.remove('menu-opened');
    document.documentElement.classList.remove('uc-force-disable-page-scroll','menu-opened');
  }
  function removePanel(panel,innerMenu){
    panel.classList.remove('ue-panel-in');
    if(innerMenu) innerMenu.classList.remove('ue-panel-out');
    setTimeout(function(){if(panel.parentNode)panel.remove();},300);
  }
  function openPanel(link){
    var li=link.parentElement;
    var subMenu=li&&li.querySelector('.sub-menu');
    if(!subMenu) return;
    var innerMenu=link.closest('.ue_inner_menu');
    var widget=link.closest('.ue-fullscreen-menu');
    if(!innerMenu||!widget) return;
    li.classList.remove('ue-sub-open');
    var old=document.querySelector('.ue-sub-panel');
    if(old) old.remove();
    innerMenu.classList.remove('ue-panel-out');
    var label='';
    link.childNodes.forEach(function(n){if(n.nodeType===3)label+=n.textContent.trim();});
    if(!label) label=link.textContent.trim().replace(/[<>▾›‹□↑↓]/g,'').trim();
    var panel=document.createElement('div');
    panel.className='ue-sub-panel';
    /* Top bar: [back chevron + תפריט] [sub-title] [✕] */
    var topbar=document.createElement('div');
    topbar.className='ue-panel-topbar';
    var backBtn=document.createElement('div');
    backBtn.className='ue-panel-back';
    backBtn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg><span>תפריט</span>';
    backBtn.addEventListener('click',function(){removePanel(panel,innerMenu);});
    var titleEl=document.createElement('span');
    titleEl.className='ue-panel-title';
    titleEl.textContent=label;
    var xBtn=document.createElement('div');
    xBtn.className='ue-panel-x';
    xBtn.innerHTML='&#10005;';
    xBtn.addEventListener('click',function(e){e.stopPropagation();closeWholeMenu(widget);removePanel(panel,innerMenu);});
    topbar.appendChild(backBtn);topbar.appendChild(titleEl);topbar.appendChild(xBtn);
    panel.appendChild(topbar);
    /* Items */
    var ul=document.createElement('ul');
    subMenu.querySelectorAll('li').forEach(function(item){
      var origA=item.querySelector('a');
      if(!origA) return;
      var li2=document.createElement('li');
      var a=document.createElement('a');
      a.href=origA.getAttribute('href')||'#';
      var txt=document.createElement('span');
      txt.className='ue-panel-item-text';
      txt.textContent=origA.textContent.trim();
      var ico=document.createElement('span');
      ico.className='ue-panel-item-icon';
      ico.innerHTML=getIcon(origA.getAttribute('href'));
      a.appendChild(txt);a.appendChild(ico);
      a.addEventListener('click',function(){closeWholeMenu(widget);removePanel(panel,innerMenu);});
      li2.appendChild(a);ul.appendChild(li2);
    });
    panel.appendChild(ul);
    document.body.appendChild(panel);
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      innerMenu.classList.add('ue-panel-out');
      panel.classList.add('ue-panel-in');
    });});
  }

  /* ── Main menu redesign (topbar + chevron) ── */
  function initMainMenu(){
    var widget=document.querySelector('#uc_fullscreen_navigation_menu_elementor_fe7d88b');
    if(!widget) return;
    var innerMenuBox=widget.querySelector('.ue_inner_menu-box');
    if(!innerMenuBox||innerMenuBox.querySelector('.ue-main-topbar')) return;
    var topbar=document.createElement('div');
    topbar.className='ue-panel-topbar ue-main-topbar';
    var titleEl=document.createElement('span');
    titleEl.className='ue-panel-title';
    titleEl.textContent='תפריט';
    var xBtn=document.createElement('div');
    xBtn.className='ue-panel-x';
    xBtn.innerHTML='&#10005;';
    xBtn.addEventListener('click',function(){
      var cb=widget.querySelector('.checkbox-toggle');
      if(cb){cb.checked=false;cb.dispatchEvent(new Event('change'));}
      widget.classList.remove('menu-opened');
      document.body.classList.remove('menu-opened');
      document.documentElement.classList.remove('uc-force-disable-page-scroll','menu-opened');
    });
    topbar.appendChild(titleEl);topbar.appendChild(xBtn);
    innerMenuBox.insertBefore(topbar,innerMenuBox.firstChild);
    for(var i=0;i<innerMenuBox.children.length;i++){
      if(innerMenuBox.children[i].querySelector('.uc-list-menu')){
        innerMenuBox.children[i].classList.add('ue-menu-list-wrap');break;
      }
    }
    /* Physically remove expand/collapse arrows so plugin JS can't re-show them */
    widget.querySelectorAll('.ue_inner_menu_expand_icon,.ue_inner_menu_collapse_icon').forEach(function(el){el.remove();});
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initMainMenu);}
  else{initMainMenu();}

  /* ── Submenu click capture (fires before ALL other handlers) ── */
  document.addEventListener('click',function(e){
    var link=e.target.closest&&e.target.closest('.ue_inner_menu .menu-item-has-children > a');
    if(!link) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openPanel(link);
  },true);

  /* ── Cart (localStorage) ── */
  var CART_KEY='st_cart';
  function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch(e){return[];}}
  function saveCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c));}catch(e){}}
  function getCount(){return getCart().reduce(function(n,it){return n+(it.qty||1);},0);}
  function applyIconBadge(count){
    // Apply badge to ALL cart icons (mobile + desktop) so whichever is visible gets the count
    var svgs=document.querySelectorAll('svg.e-fas-shopping-cart');
    if(!svgs.length) return false;
    svgs.forEach(function(cartSvg){
      var iconLink=cartSvg.closest('a');
      var wrapper=cartSvg.closest('.elementor-icon-wrapper')||cartSvg.parentElement;
      // Fix the link to point locally
      if(iconLink && iconLink.href && iconLink.href.indexOf('order-summary')<0){
        iconLink.href='order-summary.html';
      }
      // Add/update badge
      var badge=wrapper.querySelector('.st-icon-count');
      if(!badge){
        badge=document.createElement('span');
        badge.className='st-icon-count';
        badge.style.cssText='position:absolute;top:-5px;left:-5px;background:#F97316;color:#fff;'+
          'font-size:11px;font-weight:800;min-width:19px;height:19px;border-radius:10px;'+
          'padding:0 4px;display:none;align-items:center;justify-content:center;'+
          'z-index:9999;line-height:1;pointer-events:none;';
        wrapper.style.position='relative';
        wrapper.appendChild(badge);
      }
      badge.textContent=count;
      badge.style.display=count>0?'inline-flex':'none';
    });
    return true;
  }
  function updateBadges(){
    var count=getCount();
    // Text badges (menu link)
    document.querySelectorAll('.st-cart-badge').forEach(function(el){
      el.textContent=count;
      el.style.display=count>0?'inline-flex':'none';
    });
    // Icon badge — retry if not in DOM yet (loads async from live site JS)
    if(!applyIconBadge(count)){
      setTimeout(function(){applyIconBadge(count);},600);
      setTimeout(function(){applyIconBadge(count);},2000);
    }
  }
  function addItem(id,name,price,image){
    var cart=getCart(),found=false;
    cart.forEach(function(it){if(it.id===id){it.qty=(it.qty||1)+1;found=true;}});
    if(!found) cart.push({id:id,name:name,price:price,image:image,qty:1});
    saveCart(cart);updateBadges();
  }
  function getProductInfo(btn){
    var id=(btn.getAttribute('data-product_id')||'').trim();
    var card=btn;
    for(var i=0;i<8;i++){
      if(!card.parentElement) break;
      card=card.parentElement;
      if(card.querySelector('.uc_title')) break;
    }
    var nameEl=card.querySelector('.uc_title a')||card.querySelector('.uc_title');
    var name=nameEl?nameEl.textContent.trim():('מוצר #'+id);
    var priceEl=card.querySelector('.woocommerce-Price-amount');
    var price=priceEl?priceEl.textContent.trim():'';
    var imgEl=card.querySelector('img');
    var image=imgEl?(imgEl.src||''):'';
    return {id:id,name:name,price:price,image:image};
  }

  /* ── Cart button click capture ── */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.uc-button-addcart');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    var info=getProductInfo(btn);
    addItem(info.id,info.name,info.price,info.image);
    // Find the text label span inside the button
    var labelSpan=null;
    btn.querySelectorAll('span').forEach(function(s){if(!s.querySelector('i,svg,span')&&s.textContent.trim())labelSpan=s;});
    if(!labelSpan) labelSpan=btn; // fallback: use button itself
    var origText=labelSpan.textContent.trim();
    var origStyle=btn.getAttribute('style')||'';
    labelSpan.textContent='✓ נוסף לסל!';
    btn.style.cssText+=';background:#16a34a!important;border-color:#16a34a!important;color:#fff!important;cursor:default!important;';
    // Stay on page — revert after 2.5s
    setTimeout(function(){
      labelSpan.textContent=origText;
      btn.setAttribute('style',origStyle);
    },2500);
  },true);

  /* ── Single product page: intercept form submit & button click ── */
  function getSingleProductInfo(btn){
    var form=btn.closest('form.variations_form,form.cart');
    // product ID
    var id='';
    if(form){
      id=form.getAttribute('data-product_id')||'';
      var hi=form.querySelector('input[name="add-to-cart"]');
      if(hi) id=hi.value||id;
    }
    if(!id) id='product';
    // base name
    var titleEl=document.querySelector('h1.product_title');
    var baseName=titleEl?titleEl.textContent.trim():('מוצר #'+id);
    // selected variations (human-readable option text)
    var varParts=[];
    if(form){
      form.querySelectorAll('select[name^="attribute_"]').forEach(function(sel){
        var opt=sel.querySelector('option:checked');
        var val=opt?opt.textContent.trim():'';
        if(val && val!=='בחר') varParts.push(val);
      });
    }
    var name=varParts.length?baseName+' — '+varParts.join(' | '):baseName;
    // price: variation-specific first, then base
    var priceEl=document.querySelector('.woocommerce-variation-price .woocommerce-Price-amount')
               ||document.querySelector('.summary .price .woocommerce-Price-amount');
    var price=priceEl?priceEl.textContent.trim():'';
    // image
    var imgEl=document.querySelector('.woocommerce-product-gallery__image img.wp-post-image')
             ||document.querySelector('img.wp-post-image');
    var image=imgEl?(imgEl.src||''):'';
    return {id:id,name:name,price:price,image:image};
  }
  function handleSingleAddToCart(btn){
    var info=getSingleProductInfo(btn);
    addItem(info.id,info.name,info.price,info.image);
    // Turn button green and show confirmation — stay on page
    var orig=btn.textContent.trim();
    var origStyle=btn.getAttribute('style')||'';
    btn.textContent='✓ נוסף לסל!';
    btn.style.cssText+=';background:#16a34a!important;border-color:#16a34a!important;color:#fff!important;cursor:default!important;';
    // After 2.5s revert back so user can add more
    setTimeout(function(){
      btn.textContent=orig;
      btn.setAttribute('style',origStyle);
    },2500);
  }
  // click on the button
  document.addEventListener('click',function(e){
    var btn=e.target.closest('button.single_add_to_cart_button');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    handleSingleAddToCart(btn);
  },true);
  // also intercept form submit (Enter key / programmatic submit)
  document.addEventListener('submit',function(e){
    if(!e.target.classList.contains('cart')&&!e.target.classList.contains('variations_form')) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    var btn=e.target.querySelector('button.single_add_to_cart_button');
    if(btn) handleSingleAddToCart(btn);
  },true);

  /* ── Init ── */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',updateBadges);
  } else { updateBadges(); }
  window.ST_CART={
    getCart:getCart,saveCart:saveCart,getCount:getCount,updateBadges:updateBadges,
    removeItem:function(id){saveCart(getCart().filter(function(it){return it.id!==id;}));updateBadges();},
    changeQty:function(id,d){var c=getCart();c.forEach(function(it){if(it.id===id)it.qty=Math.max(1,(it.qty||1)+d);});saveCart(c);updateBadges();},
    clearCart:function(){saveCart([]);updateBadges();}
  };
})();
/* END SUBMENU-PANEL-FIX v8 + CART */
</script>`;

const result = cleanHtml + '\n' + css + '\n' + js + '\n</body>\n</html>';
console.log('Final size:', Math.round(result.length / 1024), 'KB');
fs.writeFileSync(filePath, result, 'utf8');
console.log('Done!');
