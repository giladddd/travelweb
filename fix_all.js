/**
 * fix_all.js — Complete offline repair for smart-traveller local copy
 * Run: node fix_all.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const ROOT = __dirname;

// ── helpers ──────────────────────────────────────────────────────────────────
function fetch(url, binary) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } };
    mod.get(url, opts, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, binary).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(binary ? buf : buf.toString('utf8'));
      });
    }).on('error', reject);
  });
}

function allHtmlFiles(dir) {
  const files = [];
  function walk(d) {
    fs.readdirSync(d).forEach(f => {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.html')) files.push(full);
    });
  }
  walk(dir);
  return files;
}

// ── Step 1: Download Google Fonts locally ────────────────────────────────────
async function downloadFonts() {
  console.log('\n[1] Downloading Google Fonts...');
  const fontDir = path.join(ROOT, 'assets', 'fonts');
  if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

  const fontRequests = [
    { url: 'https://fonts.googleapis.com/css?family=Assistant:300,400,500,600,700,800&display=swap&subset=hebrew,latin', name: 'assistant' },
    { url: 'https://fonts.googleapis.com/css?family=Heebo:300,400,500,600,700,800&display=swap&subset=hebrew,latin', name: 'heebo' }
  ];

  let combinedCss = '';
  for (const req of fontRequests) {
    let css = await fetch(req.url, false);
    // Extract & download font files
    const re = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    const seen = new Set();
    let m;
    let i = 0;
    while ((m = re.exec(css)) !== null) {
      const fontUrl = m[1];
      if (seen.has(fontUrl)) continue;
      seen.add(fontUrl);
      const ext = fontUrl.includes('.woff2') ? 'woff2' : fontUrl.includes('.woff') ? 'woff' : 'ttf';
      const localName = `${req.name}_${i}.${ext}`;
      const outPath = path.join(fontDir, localName);
      if (!fs.existsSync(outPath)) {
        const data = await fetch(fontUrl, true);
        fs.writeFileSync(outPath, data);
      }
      css = css.replace(fontUrl, `../fonts/${localName}`);
      i++;
    }
    combinedCss += css + '\n';
    console.log(`  ${req.name}: ${i} font files`);
  }

  fs.writeFileSync(path.join(ROOT, 'assets', 'css', 'local-fonts.css'), combinedCss, 'utf8');
  console.log('  → assets/css/local-fonts.css written');
}

// ── Step 2: Download Vimeo player JS ─────────────────────────────────────────
async function downloadVimeo() {
  console.log('\n[2] Downloading Vimeo player.js...');
  const out = path.join(ROOT, 'assets', 'js', 'player.vimeo.com_api_player.js');
  if (!fs.existsSync(out)) {
    const data = await fetch('https://player.vimeo.com/api/player.js', false);
    fs.writeFileSync(out, data, 'utf8');
  }
  console.log('  → vimeo player.js saved');
}

// ── Step 3: Patch all HTML files ──────────────────────────────────────────────
function patchHtmlFiles() {
  console.log('\n[3] Patching HTML files...');
  const files = allHtmlFiles(ROOT);
  let patched = 0;

  for (const file of files) {
    if (file.includes('fix_all') || file.includes('server.js')) continue;
    let html = fs.readFileSync(file, 'utf8');
    const original = html;
    const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
    const ap = depth === 0 ? 'assets/' : '../assets/';

    // ── Replace Google Fonts links with local CSS ─────────────────────────
    html = html.replace(
      /<link[^>]*href=['"]https?:\/\/fonts\.googleapis\.com[^'"]*['"][^>]*\/?>/gi,
      ''
    );
    html = html.replace(
      /<link[^>]*href=['"]https?:\/\/fonts\.gstatic\.com[^'"]*['"][^>]*\/?>/gi,
      ''
    );
    // Inject local font CSS once (after first <link> tag)
    const localFontTag = `<link rel='stylesheet' href='${ap}css/local-fonts.css'>`;
    if (!html.includes('local-fonts.css')) {
      html = html.replace(/(<link\s)/i, `${localFontTag}\n$1`);
    }

    // ── Replace Vimeo player.js ───────────────────────────────────────────
    html = html.replace(
      /https?:\/\/player\.vimeo\.com\/api\/player\.js[^'""]*/gi,
      `${ap}js/player.vimeo.com_api_player.js`
    );

    // ── Replace wp-json/wp/v2 API calls (break JS loops trying to load remote data)
    // by injecting a stub for wp.apiFetch
    const wpApiStub = `
<script>
// Offline stub: prevent wp API fetch errors
if(typeof window.wp === 'undefined') window.wp = {};
window.wp.apiFetch = function(){ return Promise.resolve({}); };
if(typeof window.wpApiSettings === 'undefined') window.wpApiSettings = { root:'/', nonce:'' };
</script>`;
    if (!html.includes('Offline stub')) {
      html = html.replace('</head>', wpApiStub + '\n</head>');
    }

    // ── Inline style: replace remaining remote background-image URLs ──────
    html = html.replace(
      /url\(['"]?(https?:\/\/the-smart-traveller\.com\/wp-content\/uploads\/([^'") ]+))['"]?\)/gi,
      (match, fullUrl, imgPath) => {
        const localName = imgPath.replace(/\//g, '_');
        return `url('${ap}images/${localName}')`;
      }
    );

    // ── Remove external tracking/analytics scripts ────────────────────────
    html = html.replace(/<script[^>]*src=['"][^'"]*(?:stats\.wp\.com|quantcast|doubleclick|google-analytics|googletagmanager|pixel\.wp\.com)[^'"]*['"][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=['"][^'"]*(?:stats\.wp\.com|pixel\.wp\.com)[^'"]*['"][^>]*\/?>/gi, '');

    if (html !== original) {
      fs.writeFileSync(file, html, 'utf8');
      patched++;
    }
  }
  console.log(`  → ${patched} files patched`);
}

// ── Step 4: Fix CSS files with remote font references ────────────────────────
function fixCssFonts() {
  console.log('\n[4] Fixing CSS files with remote font references...');
  const cssDir = path.join(ROOT, 'assets', 'css');
  let fixed = 0;
  fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).forEach(f => {
    const fp = path.join(cssDir, f);
    let css = fs.readFileSync(fp, 'utf8');
    const orig = css;
    // Fix remote font URLs in CSS
    css = css.replace(/url\(['"]?(https?:\/\/fonts\.gstatic\.com\/[^'") ]+)['"]?\)/gi, (m, u) => {
      const fname = u.split('/').pop().split('?')[0];
      return `url('../fonts/${fname}')`;
    });
    if (css !== orig) { fs.writeFileSync(fp, css, 'utf8'); fixed++; }
  });
  console.log(`  → ${fixed} CSS files fixed`);
}

// ── Step 5: Inject comprehensive widget fix into ALL HTML pages ───────────────
function injectWidgetFixes() {
  console.log('\n[5] Injecting widget fixes into all pages...');
  const files = allHtmlFiles(ROOT);
  let injected = 0;

  const fixScript = `
<style>
/* ── Offline widget fixes ── */
/* Content tabs: show first panel by default */
.tab-container.panes:first-of-type { display: block; }
/* Accordion: show first panel */
.uc_accordion_item:first-child .uc_accordion_content { display: block !important; }
/* Ensure nav menu visible */
.ast-desktop-header-wrap { display: block; }
/* Sticky header */
.site-header { position: sticky; top: 0; z-index: 999; }
/* Fix Elementor hidden elements that rely on scroll triggers */
.elementor-invisible { opacity: 1 !important; transform: none !important; }
/* Remove WC notices that show due to missing sessions */
.woocommerce-notices-wrapper:empty { display: none; }
</style>
<script>
/* ── Offline widget controller ── */
(function() {
  document.addEventListener('DOMContentLoaded', function() {

    // ── Content Tabs (uc_content_tabs) ──────────────────────────────────
    function initTabs(container) {
      var btns   = container.querySelectorAll('[data-content-id]');
      var panels = container.querySelectorAll('.tab-container.panes');
      if (!btns.length) return;
      // hide all, show first
      panels.forEach(function(p) { p.style.display = 'none'; });
      if (panels[0]) panels[0].style.display = 'block';
      btns.forEach(function(btn, idx) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          panels.forEach(function(p) { p.style.display = 'none'; });
          btns.forEach(function(b) { b.classList.remove('ue-tab-active','active'); });
          var tid = this.getAttribute('data-content-id');
          var t   = document.getElementById(tid);
          if (t) { t.style.display = 'block'; }
          else if (panels[idx]) { panels[idx].style.display = 'block'; }
          this.classList.add('ue-tab-active','active');
        });
      });
      // mark first active
      btns[0] && btns[0].classList.add('ue-tab-active','active');
    }
    document.querySelectorAll('[id^="uc_content_tabs"]').forEach(initTabs);

    // ── Accordion ────────────────────────────────────────────────────────
    document.querySelectorAll('.uc_accordion_title, .ue-accordion-title, [class*="accordion"] .uc_title').forEach(function(title) {
      title.style.cursor = 'pointer';
      title.addEventListener('click', function() {
        var content = this.nextElementSibling;
        if (!content) return;
        var isOpen = content.style.display !== 'none' && content.style.display !== '';
        content.style.display = isOpen ? 'none' : 'block';
        this.classList.toggle('active', !isOpen);
      });
    });

    // ── Fullscreen / hamburger nav menu ──────────────────────────────────
    document.querySelectorAll('.menu-toggle, .ast-mobile-menu-trigger, .hamburger, [class*="menu-toggle"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var nav = document.querySelector('.ast-mobile-header-wrap, #ast-mobile-popup, .ast-primary-menu, nav.navigation-accessibility, .main-navigation');
        if (nav) {
          var open = nav.style.display === 'block' || nav.classList.contains('toggled');
          nav.style.display = open ? '' : 'block';
          nav.classList.toggle('toggled', !open);
          document.body.classList.toggle('ast-header-break-point', !open);
        }
      });
    });

    // ── Fullscreen navigation menu (unlimited elements) ──────────────────
    document.querySelectorAll('[class*="fullscreen_nav"] .uc_menu_icon, [id*="fullscreen_navigation"] .uc_menu_icon').forEach(function(icon) {
      icon.addEventListener('click', function() {
        var menu = this.closest('[id^="uc_fullscreen"], [class*="fullscreen_nav"]');
        if (menu) menu.classList.toggle('uc-open');
      });
    });

    // ── Elementor tabs widget ─────────────────────────────────────────────
    document.querySelectorAll('.e-n-tabs-heading .e-n-tab-title').forEach(function(tab, idx, all) {
      tab.addEventListener('click', function() {
        var parent = this.closest('.e-n-tabs');
        if (!parent) return;
        parent.querySelectorAll('.e-n-tab-title').forEach(function(t) { t.setAttribute('aria-selected','false'); });
        parent.querySelectorAll('.e-n-tabs-content > .e-con').forEach(function(c) { c.style.display = 'none'; });
        this.setAttribute('aria-selected','true');
        var target = parent.querySelector('#' + this.getAttribute('aria-controls'));
        if (target) target.style.display = 'flex';
      });
    });
    // show first elementor tab
    document.querySelectorAll('.e-n-tabs').forEach(function(tabs) {
      var first = tabs.querySelector('.e-n-tab-title');
      if (first) first.click();
    });

    // ── Video carousel hover ──────────────────────────────────────────────
    document.querySelectorAll('[class*="video_carousel"] video, [class*="video-carousel"] video').forEach(function(v) {
      v.addEventListener('mouseenter', function() { this.play(); });
      v.addEventListener('mouseleave', function() { this.pause(); });
    });

    // ── Smooth scroll for anchor links ────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        var id = this.getAttribute('href').slice(1);
        var el = document.getElementById(id) || document.querySelector('[name="' + id + '"]');
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    // ── Fix: Elementor animation-invisible elements ───────────────────────
    var obs = null;
    if ('IntersectionObserver' in window) {
      obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('elementor-invisible');
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'none';
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.elementor-invisible').forEach(function(el) { obs.observe(el); });
    } else {
      document.querySelectorAll('.elementor-invisible').forEach(function(el) {
        el.classList.remove('elementor-invisible');
      });
    }

  });
})();
</script>`;

  for (const file of files) {
    if (file.includes('fix_all') || file.includes('server.js')) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('Offline widget controller')) continue; // already injected
    html = html.replace('</body>', fixScript + '\n</body>');
    fs.writeFileSync(file, html, 'utf8');
    injected++;
  }
  console.log(`  → ${injected} files injected`);
}

// ── Step 6: Fix guide page accordion (specific heavy page) ───────────────────
function fixGuidePage() {
  console.log('\n[6] Checking guide page...');
  const guidePath = path.join(ROOT, 'guide.html');
  if (!fs.existsSync(guidePath)) { console.log('  guide.html not found'); return; }
  let html = fs.readFileSync(guidePath, 'utf8');

  // The guide page uses TG_ id anchors for its sections — make sure they work
  // It uses Elementor tabs with data-tab-index; wire them up
  const guideTabFix = `
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Guide page tab groups (TG_ anchors)
    document.querySelectorAll('[data-tab]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var group = this.closest('[data-tabs]') || this.parentElement.parentElement;
        var idx   = this.getAttribute('data-tab');
        group.querySelectorAll('[data-tab]').forEach(function(b) { b.classList.remove('active','e-active'); });
        group.querySelectorAll('[data-tab-index]').forEach(function(c) { c.style.display = 'none'; });
        this.classList.add('active','e-active');
        var content = group.querySelector('[data-tab-index="' + idx + '"]');
        if (content) content.style.display = 'block';
      });
    });
    // Show first tab in each group
    document.querySelectorAll('[data-tabs]').forEach(function(g) {
      var first = g.querySelector('[data-tab]');
      if (first) first.click();
    });
  });
})();
</script>`;
  if (!html.includes('Guide page tab groups')) {
    html = html.replace('</body>', guideTabFix + '\n</body>');
    fs.writeFileSync(guidePath, html, 'utf8');
  }
  console.log('  → guide.html patched');
}

// ── Step 7: Fix CSS background-image URLs that still use remote domain ────────
function fixCssBackgrounds() {
  console.log('\n[7] Fixing CSS background URLs in all CSS...');
  const cssDir = path.join(ROOT, 'assets', 'css');
  let fixed = 0;
  fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).forEach(f => {
    const fp = path.join(cssDir, f);
    let css = fs.readFileSync(fp, 'utf8');
    const orig = css;
    css = css.replace(
      /url\(['"]?(https?:\/\/the-smart-traveller\.com\/wp-content\/uploads\/([^'") ]+))['"]?\)/gi,
      (match, fullUrl, imgPath) => `url('../images/${imgPath.replace(/\//g,'_')}')`
    );
    if (css !== orig) { fs.writeFileSync(fp, css, 'utf8'); fixed++; }
  });
  console.log(`  → ${fixed} CSS files updated`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await downloadFonts();
    await downloadVimeo();
    patchHtmlFiles();
    fixCssFonts();
    fixCssBackgrounds();
    injectWidgetFixes();
    fixGuidePage();
    console.log('\n✓ All fixes applied. Refresh your browser at http://localhost:8080/\n');
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
