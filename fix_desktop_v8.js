/**
 * fix_desktop_v8.js — Combined: submenu slide-in panel (v7) + localStorage cart
 * Single clean injection from the 566KB original base.
 */
const fs = require('fs');
const path = require('path');
const SRC_ROOT = 'C:/Users/gilad/smart_traveller_local';
const DST_ROOT = 'C:/Users/gilad/OneDrive/שולחן העבודה';
// קוראים תמיד מ-index.html (המקור הנקי) — כך שהחלפות טקסט עובדות בכל ריצה
const sourcePath = path.join(SRC_ROOT, 'index.html');
const filePath = path.join(DST_ROOT, 'smart_traveller_home.html');
let html = fs.readFileSync(sourcePath, 'utf8');

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
  .replace(/href='(?:\.\.\/)?assets\//g,  `href='${LOCAL_ASSETS}assets/`)
  .replace(/href="(?:\.\.\/)?assets\//g,  `href="${LOCAL_ASSETS}assets/`)
  .replace(/src='(?:\.\.\/)?assets\//g,   `src='${LOCAL_ASSETS}assets/`)
  .replace(/src="(?:\.\.\/)?assets\//g,   `src="${LOCAL_ASSETS}assets/`);

// ── הסר local-cart.js — יש לנו מימוש משלנו (ST_CART), local-cart עושה redirect ──
cleanBase = cleanBase.replace(/<script[^>]*local-cart\.js[^>]*><\/script>/gi, '');

// ── תיקון קישורי בית: index.html → smart_traveller_home.html ─────────────────
cleanBase = cleanBase.replace(/href=("|')\.\.\/index\.html\1/g, 'href=$1../smart_traveller_home.html$1');
cleanBase = cleanBase.replace(/href=("|')index\.html\1/g, 'href=$1smart_traveller_home.html$1');

// ── Fix broken regex in index.html (HTTrack artifact) ────────────────────────
// Original: replace(//$/,'') → should be replace(/\/$/, '')
cleanBase = cleanBase.replace(/replace\(\/\/\$\/,\s*''\)/g, "replace(/\\/$/,'')");

// ── "לחנות שלנו" → "אשמח לשמוע עוד פרטים" (כפתור hero) ────────────────────────
cleanBase = cleanBase.replace(
  /<span class="elementor-button-text">לחנות שלנו<\/span>/g,
  '<span class="elementor-button-text">אשמח לשמוע עוד פרטים</span>'
);

// ── כותרת hero (2 שורות) ─────────────────────────────────────────────────────
cleanBase = cleanBase.replace(/הטיול הגדול שלך מתחיל כאן/g, 'הכל לטיול הגדול<br>במקום אחד');

// ── פסקת hero: 3 שורות חדשות ─────────────────────────────────────────────────
cleanBase = cleanBase.replace(
  /<p>משכירים מוצילות פרימיום[\s\S]*?במקום אחד\.<\/p>/,
  '<p>משלבים קנייה והשכרה של ציוד בהתאמה אישית<br />מקבלים ליווי בהכנה ובירוקרטיה לטיול בחינם<br />קל משתלם חכם</p>'
);

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

// ── חילוץ מחירי הווריאציות (ה-JSON של data-product_variations פגום, regex במקום JSON.parse) ──
var variationPrices = {};
var vMatch = cleanBase.match(/data-product_variations="([^"]*)"/);
if(vMatch){
  var vDec = vMatch[1].replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&amp;/g,'&');
  var vRe = /\{"attributes":\{([^}]*)\}[\s\S]*?"display_price":([0-9.]+)/g, vM;
  while((vM = vRe.exec(vDec))){
    var aStr = vM[1];
    var pk = (aStr.match(/"attribute_pa_package":"([^"]*)"/)||[])[1]||'';
    var mo = (aStr.match(/"attribute_pa_months":"([^"]*)"/)||[])[1]||'';
    if(pk||mo) variationPrices[pk+'|'+mo] = parseFloat(vM[2]);
  }
}
console.log('Variation prices extracted:', Object.keys(variationPrices).length);
const varPricesJson = JSON.stringify(variationPrices);

// ── CSS ──────────────────────────────────────────────────────────────────────
const SENTINEL = '<!-- ST_INJECT_v8 -->';
const css = `${SENTINEL}<style>
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&display=swap');
/* ── פונט אחיד לכל האתר — Assistant (פרט לאייקונים) ── */
body, body *:not(i):not([class*="fa-"]):not([class*="eicon"]) {
  font-family:'Assistant',sans-serif !important;
}
/* ── Prevent horizontal scroll on all devices ── */
html, body { overflow-x:hidden !important; max-width:100% !important; }
* { box-sizing:border-box; }
.elementor-section, .e-con, .elementor-container { max-width:100% !important; }
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
/* דסקטופ — סל ימין, מוסתר במובייל */
@media (min-width:768px) {
  [data-id="4a25f86"] { order:3 !important; display:flex !important; align-items:center !important; }
  [data-id="4a25f86"] .elementor-icon { color:#fff !important; font-size:22px !important; }
  [data-id="4a25f86"] .elementor-icon svg { width:24px !important; height:24px !important; fill:#fff !important; }
  [data-id="f2b4aaa"] { display:none !important; }
}
/* מובייל — סל שמאל, לוגו ימין */
@media (max-width:767px) {
  [data-id="4a25f86"] { display:none !important; }
  [data-id="37de25e"] { order:1 !important; }
  [data-id="fe7d88b"] { order:2 !important; }
  [data-id="f2b4aaa"] { order:3 !important; display:flex !important; align-items:center !important; }
}
/* ── Hero section: 90% מגובה המסך ── */
[data-id="23e0e31"] { min-height:90vh !important; display:flex !important; flex-direction:column !important; justify-content:center !important; }
/* ── דפי משנה: לבטל את ה-SHE ולהחזיר את ה-header לזרימה רגילה ── */
body.st-subpage header.xpro-theme-builder-header,
body.st-subpage [data-id="da64efe"],
body.st-subpage .she-header-yes,
body.st-subpage .she-header-transparent-yes {
  position:relative !important;
  background:#fff !important;
  transform:none !important;
  top:auto !important;
  margin-top:0 !important;
}
body.st-subpage #content { padding-top:20px !important; margin-top:0 !important; }
body.st-subpage .ast-container { padding-top:0 !important; }
body.st-subpage .elementor[data-elementor-type="wp-page"] > .elementor-element:first-child,
body.st-subpage .elementor[data-elementor-type="archive"] > .elementor-element:first-child { margin-top:0 !important; }
/* ── Hero — הגדלת כותרת וטקסט ── */
[data-id="14da8d3"] .elementor-heading-title { font-size:42px !important; line-height:1.2 !important; }
[data-id="366cae4"], [data-id="366cae4"] p { font-size:20px !important; line-height:1.7 !important; }
/* ── Hero buttons: extra spacing ── */
[data-id="9530b7e"] { margin-bottom:20px !important; }
[data-id="7bcc2ce"] { margin-top:6px !important; }
/* ── XPRO swatches — עיצוב כמו כפתורי שלב 2 ── */
.xpro_swatches { display:flex !important; flex-wrap:wrap !important; gap:8px !important; }
.xpro_swatches .swatch_label {
  background:#F97316 !important; color:#fff !important;
  border:2px solid transparent !important; border-radius:20px !important;
  padding:8px 16px !important; font-size:13px !important; font-weight:600 !important;
  cursor:pointer !important; opacity:0.55 !important; transition:all 0.2s !important;
  /* override XPRO circle defaults */
  width:auto !important; height:auto !important; min-width:unset !important;
  line-height:1.3 !important; white-space:nowrap !important;
  display:inline-flex !important; align-items:center !important; justify-content:center !important;
}
.xpro_swatches .swatch_label:hover { opacity:0.8 !important; }
.xpro_swatches .swatch_label.selected {
  opacity:1 !important; border-color:#fff !important;
  box-shadow:0 0 0 2px #F97316 !important;
}
.xpro_swatches .xpro_swatch__tooltip { display:none !important; }
/* ── תצוגת מחיר הווריאציה ── */
.st-var-price { text-align:center; font-size:24px; font-weight:800; color:#F97316; margin:16px 0 10px; }
/* ── כפיית גלריית המוצר להיות גלויה (offline — WC JS לא מאתחל) ── */
.woocommerce-product-gallery,
.woocommerce-product-gallery__wrapper,
.woocommerce-product-gallery__image,
.flex-viewport,
.flex-control-nav { opacity:1 !important; visibility:visible !important; }
.woocommerce-product-gallery img { opacity:1 !important; max-width:100% !important; height:auto !important; }
/* ── אקורדיון שאלות נפוצות (לבן + כתום) ── */
.st-faq { max-width:600px; margin:50px auto 60px; padding:0 16px; direction:rtl; }
.st-faq-title { text-align:center; font-size:28px; font-weight:800; color:#F97316; margin-bottom:28px; font-family:inherit; }
.st-faq-list { display:flex; flex-direction:column; gap:14px; }
.st-faq-item { background:#fff; border-radius:14px; overflow:hidden; border:2px solid #F97316; box-shadow:0 2px 10px rgba(0,0,0,0.06); transition:box-shadow 0.2s, background 0.2s; }
.st-faq-item.open { background:#fff8f0; box-shadow:0 4px 16px rgba(249,115,22,0.18); }
.st-faq-q { display:flex; align-items:center; gap:14px; width:100%; padding:18px 20px; background:transparent; border:none; color:#222; font-family:inherit; font-size:16px; font-weight:700; cursor:pointer; text-align:right; direction:rtl; line-height:1.4; }
.st-faq-q-text { flex:1; }
.st-faq-icon { width:32px; height:32px; border-radius:50%; background:#F97316; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:400; line-height:1; transition:transform 0.3s ease; flex-shrink:0; }
.st-faq-item.open .st-faq-icon { transform:rotate(45deg); }
.st-faq-a { max-height:0; overflow:hidden; transition:max-height 0.35s ease; }
.st-faq-item.open .st-faq-a { max-height:500px; }
.st-faq-a-inner { padding:0 22px 20px; color:#555; font-size:14.5px; line-height:1.75; }
/* ── קרוסלת וידאו (UCE owl → סליידר משלנו) ── */
.ue-video-carousel.st-vc-viewport { position:relative; overflow:hidden; width:100%; max-width:340px; margin:0 auto; }
.st-vc-track { display:flex; transition:transform 0.4s ease; }
.st-vc-track .ue_vc_item { flex:0 0 100%; width:100%; box-sizing:border-box; }
.ue-hover-image-video { position:relative; border-radius:14px; overflow:hidden; background:#000; }
.ue-hover-image-video iframe.ue-video { width:100%; aspect-ratio:9/16; display:block; border:0; }
.ue-hover-image-video .ue-image { display:none; }
.ue-hover-image-video .ue-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.15); cursor:pointer; }
.ue-hover-image-video .ue-overlay-icon { width:62px; height:62px; background:#ff0000; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; box-shadow:0 4px 14px rgba(0,0,0,0.4); }
.st-vc-dots { display:flex; gap:7px; justify-content:center; margin-top:14px; flex-wrap:wrap; }
.st-vc-dots span { width:9px; height:9px; border-radius:50%; background:#cbd5e1; cursor:pointer; transition:background 0.2s; display:block; }
.st-vc-dots span.active { background:#F97316; }
.st-vc-arrow { position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border:none; border-radius:50%; background:rgba(255,255,255,0.92); color:#0F172B; font-size:22px; font-weight:700; cursor:pointer; z-index:5; display:flex; align-items:center; justify-content:center; line-height:1; }
.st-vc-prev { left:8px; }
.st-vc-next { right:8px; }
/* ── Lead form modal ── */
.st-lead-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:2147483600; display:flex; align-items:center; justify-content:center; padding:20px; }
.st-lead-card { background:#fff; border-radius:16px; width:100%; max-width:380px; padding:26px 22px 22px; direction:rtl; box-shadow:0 10px 50px rgba(0,0,0,0.4); position:relative; box-sizing:border-box; }
.st-lead-title { font-size:21px; font-weight:800; color:#F97316; margin-bottom:5px; }
.st-lead-sub { font-size:13px; color:#888; margin-bottom:16px; }
.st-lead-field { margin-bottom:12px; }
.st-lead-field label { display:block; font-size:13px; font-weight:600; color:#444; margin-bottom:5px; }
.st-lead-field input { width:100%; box-sizing:border-box; border:1px solid #d1d5db; border-radius:8px; padding:11px 12px; font-size:15px; font-family:inherit; direction:rtl; outline:none; }
.st-lead-field input:focus { border-color:#F97316; }
.st-lead-submit { width:100%; padding:13px; background:#F97316; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; margin-top:4px; }
.st-lead-submit:hover { background:#ea6c0a; }
.st-lead-submit:disabled { background:#f5c49a; cursor:default; }
.st-lead-x { position:absolute; top:12px; left:14px; width:30px; height:30px; border:none; background:#f3f4f6; border-radius:50%; font-size:15px; color:#666; cursor:pointer; line-height:1; }
/* END SUBMENU-PANEL-FIX v8 */
</style>`;

// ── JS ────────────────────────────────────────────────────────────────────────
const js = `<script>
/* SUBMENU-PANEL-FIX v8 + CART */
(function(){
  /* ── SVG icons ── */
  var SVG=${svgJson};
  var TG_ICONS=${tgJson};
  /* ── מפת מחירי וריאציות (חולצה מ-data-product_variations) ── */
  var ST_VAR_PRICES=${varPricesJson};
  /* ── נתיב יחסי ל-order-summary לפי מיקום הדף הנוכחי ── */
  var ORDER_SUMMARY_URL=(location.pathname.toLowerCase().indexOf('/categories/')>=0)?'../order-summary.html':'order-summary.html';
  /* ── סימון דף משנה (לא הבית) — מאפשר ריווח מעל התוכן ── */
  (function(){
    var p=location.pathname.toLowerCase();
    var isHome=/\\/(smart_traveller_home|index)\\.html$/.test(p)||p==='/'||p.endsWith('/');
    if(!isHome){
      if(document.body) document.body.classList.add('st-subpage');
      else document.addEventListener('DOMContentLoaded',function(){document.body.classList.add('st-subpage');});
    }
  })();
  /* ── הסרת classes ו-inline styles של תוסף SHE בדפי משנה ── */
  function stripSHE(){
    document.querySelectorAll('.she-header-yes, .she-header-transparent-yes, .she-header-stick-yes, .she-shrink-yes').forEach(function(el){
      el.classList.remove('she-header-yes','she-header-transparent-yes','she-header-stick-yes','she-shrink-yes');
      el.style.position=''; el.style.top=''; el.style.transform='';
    });
  }
  if(document.body && document.body.classList.contains('st-subpage')) stripSHE();
  else document.addEventListener('DOMContentLoaded',function(){ if(document.body.classList.contains('st-subpage')) stripSHE(); });
  setTimeout(function(){ if(document.body && document.body.classList.contains('st-subpage')) stripSHE(); },600);
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

  /* ── חוסם AJAX של WC שגורם ל-redirect ── */
  (function patchAjax(){
    if(!window.jQuery){setTimeout(patchAjax,50);return;}
    var _orig=jQuery.ajax;
    jQuery.ajax=function(url,settings){
      var u=typeof url==='string'?url:((url&&url.url)||'');
      if(u.indexOf('wc-ajax=')>=0){
        var fake={done:function(){return fake;},fail:function(){return fake;},always:function(){return fake;}};
        return fake;
      }
      return _orig.apply(this,arguments);
    };
  })();
  function patchWcParams(){
    if(window.wc_add_to_cart_params) window.wc_add_to_cart_params.cart_redirect_after_add='no';
  }
  patchWcParams(); setTimeout(patchWcParams,200);

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
        iconLink.href=ORDER_SUMMARY_URL;
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

  /* ── מציאת מחיר הווריאציה הנבחרת והצגתו ── */
  function updateVariationPrice(form){
    var selected={};
    form.querySelectorAll('.xpro_swatches').forEach(function(c){
      var s=c.querySelector('.swatch.selected');
      var an=c.getAttribute('data-attribute_name');
      if(s&&an) selected[an]=s.getAttribute('data-value');
    });
    var key=(selected['attribute_pa_package']||'')+'|'+(selected['attribute_pa_months']||'');
    var price=ST_VAR_PRICES[key];
    var box=form.querySelector('.st-var-price');
    if(!box){
      box=document.createElement('div');
      box.className='st-var-price';
      var btn=form.querySelector('.single_add_to_cart_button');
      var anchor=btn?(btn.closest('.woocommerce-variation-add-to-cart')||btn):null;
      if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(box,anchor);
      else form.appendChild(box);
    }
    if(price||price===0){
      box.textContent='₪ '+Number(price).toFixed(2);
      box.setAttribute('data-price',price);
      box.style.display='block';
    } else {
      box.style.display='none';
      box.removeAttribute('data-price');
    }
  }

  /* ── XPRO variation swatch handler ── */
  document.addEventListener('click',function(e){
    var sw=e.target.closest&&e.target.closest('.xpro_swatches .swatch');
    if(!sw) return;
    var container=sw.closest('.xpro_swatches');
    if(!container) return;
    container.querySelectorAll('.swatch').forEach(function(s){s.classList.remove('selected','active');});
    sw.classList.add('selected');
    var attrName=container.getAttribute('data-attribute_name');
    if(attrName){
      var sel=document.querySelector('select[name="'+attrName+'"]');
      if(sel){sel.value=sw.getAttribute('data-value')||'';sel.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    var form=sw.closest('form.variations_form,form.cart');
    if(form){
      var allGroups=form.querySelectorAll('.xpro_swatches');
      var allSelected=true;
      allGroups.forEach(function(g){if(!g.querySelector('.swatch.selected'))allSelected=false;});
      if(allSelected){
        var addBtn=form.querySelector('.single_add_to_cart_button');
        if(addBtn){
          addBtn.removeAttribute('disabled');
          addBtn.classList.remove('disabled','wc-variation-is-unavailable');
          var varInput=form.querySelector('input.variation_id');
          if(varInput&&(!varInput.value||varInput.value==='0'))varInput.value='1';
        }
        updateVariationPrice(form);
      }
    }
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
    // selected variations — XPRO swatches first, fallback to hidden selects
    var varParts=[];
    if(form){
      form.querySelectorAll('.xpro_swatches').forEach(function(container){
        var sel=container.querySelector('.swatch.selected');
        if(sel){var txt=sel.textContent.trim();if(txt)varParts.push(txt);}
      });
      if(!varParts.length){
        form.querySelectorAll('select[name^="attribute_"]').forEach(function(sel){
          var opt=sel.querySelector('option:checked');
          var val=opt?opt.textContent.trim():'';
          if(val && val!=='בחר' && val!=='בחירת אפשרות') varParts.push(val);
        });
      }
    }
    var name=varParts.length?baseName+' — '+varParts.join(' | '):baseName;
    // price: מחיר הווריאציה שהוצג, ואז fallback
    var price='';
    if(form){
      var pBox=form.querySelector('.st-var-price');
      if(pBox && pBox.getAttribute('data-price')) price=pBox.getAttribute('data-price')+' ₪';
    }
    if(!price){
      var priceEl=document.querySelector('.woocommerce-variation-price .woocommerce-Price-amount')
                 ||document.querySelector('.summary .price .woocommerce-Price-amount');
      price=priceEl?priceEl.textContent.trim():'';
    }
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

  /* ── "אשמח לשמוע עוד" — טופס יצירת קשר ── */
  function openLeadForm(){
    if(document.querySelector('.st-lead-overlay')) return;
    var ov=document.createElement('div');
    ov.className='st-lead-overlay';
    ov.innerHTML=
      '<div class="st-lead-card">'+
        '<button class="st-lead-x">✕</button>'+
        '<div class="st-lead-title">אשמח לשמוע עוד</div>'+
        '<div class="st-lead-sub">השאירו פרטים ונחזור אליכם בהקדם</div>'+
        '<div class="st-lead-field"><label>שם מלא</label><input type="text" id="st-lead-name" placeholder="שם מלא"></div>'+
        '<div class="st-lead-field"><label>טלפון</label><input type="tel" id="st-lead-phone" placeholder="050-0000000"></div>'+
        '<button class="st-lead-submit" id="st-lead-send">שליחה</button>'+
      '</div>';
    document.body.appendChild(ov);
    function close(){ if(ov.parentNode) ov.remove(); }
    ov.querySelector('.st-lead-x').addEventListener('click',close);
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov.querySelector('#st-lead-send').addEventListener('click',function(){
      var name=(document.getElementById('st-lead-name')||{}).value||'';
      var phone=(document.getElementById('st-lead-phone')||{}).value||'';
      if(!name.trim()){ document.getElementById('st-lead-name').focus(); return; }
      if(!phone.trim()){ document.getElementById('st-lead-phone').focus(); return; }
      var sbtn=this; sbtn.textContent='שולח...'; sbtn.disabled=true;
      var payload={ type:'lead', customer_name:name, customer_phone:phone };
      fetch('https://the-smart-traveller.com/order-notify.php',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
      }).then(function(r){ if(!r.ok) throw 0; return r; })
      .then(function(){
        ov.querySelector('.st-lead-card').innerHTML=
          '<div style="text-align:center;padding:24px 10px;"><div style="font-size:42px;">😊</div>'+
          '<div style="font-size:18px;font-weight:800;color:#16a34a;margin-top:10px;">תודה! ניצור קשר בקרוב</div></div>';
        setTimeout(close,2600);
      })
      .catch(function(){
        var body='שם: '+name+'\\nטלפון: '+phone;
        window.location.href='mailto:GILADUNNAGU@GMAIL.COM?subject='+encodeURIComponent('פנייה חדשה מהאתר')+'&body='+encodeURIComponent(body);
        sbtn.textContent='שליחה'; sbtn.disabled=false;
      });
    });
  }
  document.addEventListener('click',function(e){
    var btn=e.target.closest&&e.target.closest('[data-id="9530b7e"] a.elementor-button');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openLeadForm();
  },true);

  /* ── קרוסלת וידאו — סליידר משלנו במקום owl-carousel ── */
  function initVideoCarousel(){
    document.querySelectorAll('.ue-video-carousel').forEach(function(car){
      if(car.dataset.stVc) return;
      var items=Array.prototype.slice.call(car.querySelectorAll('.ue_vc_item'));
      if(!items.length) return;
      car.dataset.stVc='1';
      var track=document.createElement('div');
      track.className='st-vc-track';
      items.forEach(function(it){ track.appendChild(it); });
      car.innerHTML='';
      car.classList.remove('owl-carousel','owl-theme','uc_carousel');
      car.classList.add('st-vc-viewport');
      car.appendChild(track);
      var idx=0;
      var dots=document.createElement('div'); dots.className='st-vc-dots';
      function go(i){
        idx=(i+items.length)%items.length;
        track.style.transform='translateX('+(-idx*100)+'%)';
        for(var k=0;k<dots.children.length;k++) dots.children[k].className=(k===idx?'active':'');
      }
      items.forEach(function(it,i){
        var d=document.createElement('span');
        d.addEventListener('click',function(){ go(i); });
        dots.appendChild(d);
      });
      var prev=document.createElement('button'); prev.type='button'; prev.className='st-vc-arrow st-vc-prev'; prev.innerHTML='‹';
      var next=document.createElement('button'); next.type='button'; next.className='st-vc-arrow st-vc-next'; next.innerHTML='›';
      prev.addEventListener('click',function(){ go(idx-1); });
      next.addEventListener('click',function(){ go(idx+1); });
      car.appendChild(prev); car.appendChild(next);
      if(car.parentNode) car.parentNode.insertBefore(dots,car.nextSibling);
      go(0);
    });
  }
  /* לחיצה על כפתור הנגן → הפעלת הסרטון */
  document.addEventListener('click',function(e){
    var ov=e.target.closest&&e.target.closest('.ue-hover-image-video .ue-overlay');
    if(!ov) return;
    e.preventDefault();e.stopPropagation();
    var item=ov.closest('.ue-hover-image-video');
    var iframe=item&&item.querySelector('iframe.ue-video');
    if(iframe){
      var src=iframe.getAttribute('src')||'';
      src=src.replace(/autoplay=0/,'autoplay=1').replace(/controls=0/,'controls=1').replace(/mute=1/,'mute=0');
      if(src.indexOf('autoplay=')<0) src+=(src.indexOf('?')<0?'?':'&')+'autoplay=1';
      iframe.setAttribute('src',src);
    }
    ov.style.display='none';
  },true);

  /* ── הוספת אייקוני TikTok ו-WhatsApp לכל widget אייקוני סושיאל ── */
  function addSocialIcons(){
    var TIKTOK='M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z';
    var WHATSAPP='M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z';
    function makeItem(name,label,viewBox,path){
      return '<span class="elementor-grid-item" role="listitem">'+
        '<a class="elementor-icon elementor-social-icon elementor-social-icon-'+name+'" target="_blank" href="#">'+
          '<span class="elementor-screen-only">'+label+'</span>'+
          '<svg aria-hidden="true" class="e-font-icon-svg e-fab-'+name+'" viewBox="'+viewBox+'" xmlns="http://www.w3.org/2000/svg"><path d="'+path+'"></path></svg>'+
        '</a>'+
      '</span>';
    }
    document.querySelectorAll('.elementor-social-icons-wrapper').forEach(function(w){
      if(w.dataset.stSocialDone) return;
      if(w.querySelector('.elementor-social-icon-tiktok')||w.querySelector('.elementor-social-icon-whatsapp')) return;
      w.insertAdjacentHTML('beforeend', makeItem('tiktok','TikTok','0 0 448 512',TIKTOK));
      w.insertAdjacentHTML('beforeend', makeItem('whatsapp','WhatsApp','0 0 448 512',WHATSAPP));
      w.dataset.stSocialDone='1';
    });
  }

  /* ── הסרת מקטע 4 הכרטיסים מתחת לסרטון ── */
  function removeFourSteps(){
    var el=document.querySelector('[data-id="43fe08c"]');
    if(el&&el.parentNode) el.parentNode.removeChild(el);
  }
  /* ── הסרת מקטע "הבית של המטיילים" (מופיע גם בפוטר) ── */
  function removeContactBlock(){
    var el=document.querySelector('[data-id="435120e"]');
    if(el&&el.parentNode) el.parentNode.removeChild(el);
  }

  /* ── אקורדיון שאלות נפוצות (רק בדף הבית — מתחת לקרוסלת הוידאו) ── */
  function initFaq(){
    if(document.getElementById('st-faq')) return;
    var videoSection=document.querySelector('[data-id="eb30a0b"]');
    if(!videoSection||!videoSection.parentNode) return;
    var faqs=[
      {q:'איך עובד ההשכרה?', a:'בוחרים את החבילה באתר ומסמנים את מספר החודשים, מוסיפים לעגלה ומשלימים את הפרטים. הציוד יישלח אליכם לפני יציאתכם לטיול.'},
      {q:'איך עובדת ההחזרה?', a:'בסיום הטיול אורזים את הציוד באותה אריזה ושולחים אלינו לפי ההנחיות שתקבלו. אנחנו מטפלים בניקוי ובבדיקה.'},
      {q:'האם יש ביטוח על התיקים?', a:'כן — יש כיסוי ביטוחי מלא על כל הציוד שמושכר, ללא תוספת עלות. זמינות 24/7 לאורך כל הטיול.'},
      {q:'מה זה ליווי בהכנה לטיול?', a:'אנחנו עוזרים לכם להתכונן: רשימת ציוד מותאמת אישית, ייעוץ ויזות וביטוחים, וכל שאלה שתעלה — בחינם.'},
      {q:'מה זה שילוב של קנייה והשכרה?', a:'ציוד שכדאי לקנות (מתאמים, ליינר, סט אישי) משולב עם ציוד יקר שעדיף לשכור (מוצ\\'ילה, תיק יום). חבילה אחת — חוסך זמן וכסף.'}
    ];
    function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c];});}
    var faq=document.createElement('section');
    faq.id='st-faq'; faq.className='st-faq';
    faq.innerHTML='<h2 class="st-faq-title">שאלות נפוצות</h2><div class="st-faq-list">'+
      faqs.map(function(f){
        return '<div class="st-faq-item">'+
          '<button class="st-faq-q" type="button"><span class="st-faq-q-text">'+esc(f.q)+'</span><span class="st-faq-icon">+</span></button>'+
          '<div class="st-faq-a"><div class="st-faq-a-inner">'+esc(f.a)+'</div></div>'+
        '</div>';
      }).join('')+
      '</div>';
    videoSection.parentNode.insertBefore(faq, videoSection.nextSibling);
    faq.addEventListener('click',function(e){
      var btn=e.target.closest&&e.target.closest('.st-faq-q');
      if(!btn) return;
      btn.parentElement.classList.toggle('open');
    });
  }

  /* ── Init ── */
  function neutraliseAddToCart(){
    // הסר class ו-href, ואז clone כדי לנקות native listeners
    document.querySelectorAll('.uc-button-addcart').forEach(function(btn){
      btn.classList.remove('ajax_add_to_cart','add_to_cart_button');
      btn.removeAttribute('href');
      var clone=btn.cloneNode(true);
      btn.parentNode.replaceChild(clone,btn);
    });
    // מנטרל jQuery delegated handlers (WC + UCE)
    if(window.jQuery){
      jQuery(document.body).off('click','.ajax_add_to_cart');
      jQuery(document.body).off('click','.add_to_cart_button');
      jQuery(document.body).off('click','.uc-button-addcart');
      jQuery(document).off('click','.ajax_add_to_cart');
    }
  }
  function init(){
    updateBadges();
    neutraliseAddToCart();
    initVideoCarousel();
    removeFourSteps();
    removeContactBlock();
    initFaq();
    addSocialIcons();
    // הרץ שוב אחרי 800ms — כדי לתפוס handlers שנרשמו מאוחר
    setTimeout(neutraliseAddToCart, 800);
    setTimeout(initVideoCarousel, 800);
    setTimeout(removeFourSteps, 800);
    setTimeout(removeContactBlock, 800);
    setTimeout(initFaq, 800);
    setTimeout(addSocialIcons, 800);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else { init(); }
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
console.log('  ', 'smart_traveller_home.html');

// ── עיבוד שאר עמודי התפריט (קטגוריות + shop + about + guide) ─────────────────
function processOtherPage(srcRel, dstRel){
  var srcPath = path.join(SRC_ROOT, srcRel);
  var dstPath = path.join(DST_ROOT, dstRel);
  var isSubpage = srcRel.indexOf('/') >= 0;
  var orderSummaryRel = isSubpage ? '../order-summary.html' : 'order-summary.html';
  var homeRel = isSubpage ? '../smart_traveller_home.html' : 'smart_traveller_home.html';

  var src = fs.readFileSync(srcPath, 'utf8');
  // הסר את סגירות ה-tags כדי שנוכל להוסיף את ה-CSS+JS שלנו
  var cut = src.lastIndexOf('\n</body>');
  var base = cut > 0 ? src.substring(0, cut) : src.replace(/\n<\/body>\n<\/html>$/, '');

  // נתיבי assets (גם assets/ וגם ../assets/)
  base = base
    .replace(/href='(?:\.\.\/)?assets\//g,  `href='${LOCAL_ASSETS}assets/`)
    .replace(/href="(?:\.\.\/)?assets\//g,  `href="${LOCAL_ASSETS}assets/`)
    .replace(/src='(?:\.\.\/)?assets\//g,   `src='${LOCAL_ASSETS}assets/`)
    .replace(/src="(?:\.\.\/)?assets\//g,   `src="${LOCAL_ASSETS}assets/`);

  // תיקון regex שבור (HTTrack)
  base = base.replace(/replace\(\/\/\$\/,\s*''\)/g, "replace(/\\/$/,'')");

  // jQuery → CDN
  base = base.replace(
    /<script[^>]*src="(?:\.\.\/)?index\.html[^"]*\/jquery\.min\.js[^"]*"[^>]*><\/script>/gi,
    '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>'
  );
  base = base.replace(/<script[^>]*src="(?:\.\.\/)?index\.html[^"]*jquery-migrate[^"]*"[^>]*><\/script>/gi, '');
  base = base.replace(/<script[^>]*src="(?:\.\.\/)?index\.html[^"]*"[^>]*><\/script>/gi, '');

  // הסר local-cart.js
  base = base.replace(/<script[^>]*local-cart\.js[^>]*><\/script>/gi, '');

  // קישורי בית
  base = base.replace(/href=("|')\.\.\/index\.html\1/g, `href=$1${homeRel}$1`);
  base = base.replace(/href=("|')index\.html\1/g, `href=$1${homeRel}$1`);

  // אייקון סל בכותרת
  base = base.replace(
    /class="elementor-icon([^"]*)"\s+href="https:\/\/the-smart-traveller\.com\/[^"]*(%D7%A1|%d7%a1)[^"]*"/g,
    `class="elementor-icon$1 st-cart-icon-link" href="${orderSummaryRel}"`
  );

  // קישור "לעגלה שלי" בתפריט
  base = base.replace(
    /href="https:\/\/the-smart-traveller\.com\/[^"]*%d7%a1%d7%99%d7%9b%d7%95%d7%9d[^"]*"(\s+class="menu-link")?>לעגלה שלי<\/a>/g,
    `href="${orderSummaryRel}" class="menu-link">לעגלה שלי <span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;align-items:center;justify-content:center;margin-right:4px;vertical-align:middle;"></span></a>`
  );

  var out = base + '\n' + css + '\n' + js + '\n</body>\n</html>';
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, out, 'utf8');
  console.log('  ', dstRel, '(' + Math.round(out.length/1024) + 'KB)');
}

[
  'categories/bags-rental.html',
  'categories/day-bags.html',
  'categories/rental.html',
  'categories/general-equipment.html',
  'categories/field.html',
  'categories/hygiene.html',
  'categories/benefits.html',
  'shop.html',
  'about.html',
  'guide.html'
].forEach(function(p){ processOtherPage(p, p); });

console.log('Done!');
