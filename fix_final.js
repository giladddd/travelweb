/**
 * fix_final.js — Final sweep: stubs, broken links, carousel init, nav fix
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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

// ── The comprehensive inline patch added to every page ────────────────────────
const FINAL_FIX = `
<script>
/* ═══ OFFLINE-FINAL-FIX ═══════════════════════════════════════════════════ */
(function(){

// ── 1. Stub XMLHttpRequest calls to admin-ajax / wp-json ──────────────────
var _XHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  var xhr = new _XHR();
  var origOpen = xhr.open.bind(xhr);
  xhr.open = function(method, url) {
    if (typeof url === 'string' && (url.indexOf('admin-ajax') !== -1 || url.indexOf('wp-json') !== -1 || url.indexOf('wp-cron') !== -1)) {
      url = 'data:application/json,{}';
    }
    return origOpen(method, url);
  };
  return xhr;
};
// Stub fetch for same
var _fetch = window.fetch;
window.fetch = function(url, opts) {
  if (typeof url === 'string' && (url.indexOf('admin-ajax') !== -1 || url.indexOf('wp-json') !== -1)) {
    return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }
  return _fetch ? _fetch(url, opts) : Promise.reject(new Error('fetch unavailable'));
};

// ── 2. Fix all internal links pointing to the-smart-traveller.com ─────────
document.addEventListener('DOMContentLoaded', function() {
  var depth = window.location.pathname.split('/').filter(Boolean).length;
  var prefix = depth > 0 ? '../' : '';

  var pageMap = {
    '/':                                                         prefix + 'index.html',
    '/%d7%94%d7%9e%d7%93%d7%a8%d7%99%d7%9a-%d7%94%d7%9e%d7%9c%d7%90-%d7%9c%d7%98%d7%99%d7%95%d7%9c/': prefix + 'guide.html',
    '/%d7%97%d7%a0%d7%95%d7%aa/':                               prefix + 'shop.html',
    '/%d7%a1%d7%99%d7%9b%d7%95%d7%9d-%d7%94%d7%96%d7%9e%d7%a0%d7%94/': prefix + 'order-summary.html',
    '/about/':                                                   prefix + 'about.html',
    '/%d7%aa%d7%a7%d7%a0%d7%95%d7%9f-%d7%95%d7%9e%d7%93%d7%99%d7%a0%d7%99%d7%95%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%95%d7%aa/': prefix + 'terms.html'
  };

  document.querySelectorAll('a[href]').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    if (!href.includes('the-smart-traveller.com')) return;
    try {
      var u = new URL(href);
      var p = u.pathname.toLowerCase();
      if (pageMap[p]) { a.href = pageMap[p]; return; }
      if (p.startsWith('/product-category/')) {
        var slug = p.replace('/product-category/','').replace('/','');
        var catMap = {
          '%d7%94%d7%92%d7%99%d7%99%d7%a0%d7%94':'hygiene',
          '%d7%94%d7%98%d7%91%d7%95%d7%aa':'benefits',
          '%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94':'rental',
          '%d7%a6%d7%99%d7%95%d7%93-%d7%9b%d7%9c%d7%9c%d7%99':'general-equipment',
          '%d7%a9%d7%98%d7%97':'field',
          '%d7%aa%d7%99%d7%a7%d7%99-%d7%99%d7%95%d7%9d':'day-bags',
          '%d7%aa%d7%99%d7%a7%d7%99%d7%9d-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94':'bags-rental'
        };
        if (catMap[slug]) { a.href = prefix + 'categories/' + catMap[slug] + '.html'; return; }
      }
      if (p.startsWith('/product/')) {
        var ps = p.replace('/product/','').replace(/\/$/,'');
        a.href = prefix + 'products/' + ps + '.html';
        return;
      }
      // Remove dead external links
      a.removeAttribute('href');
      a.style.cursor = 'default';
    } catch(e) {}
  });

  // ── 3. Swiper carousels — re-init after page load ────────────────────────
  if (typeof Swiper !== 'undefined') {
    document.querySelectorAll('.swiper:not(.swiper-initialized), .swiper-container:not(.swiper-initialized)').forEach(function(el) {
      try {
        new Swiper(el, {
          loop: true,
          autoplay: { delay: 4000, disableOnInteraction: false },
          slidesPerView: 'auto',
          spaceBetween: 16,
          navigation: {
            nextEl: el.querySelector('.swiper-button-next'),
            prevEl: el.querySelector('.swiper-button-prev')
          },
          pagination: {
            el: el.querySelector('.swiper-pagination'),
            clickable: true
          }
        });
      } catch(e) {}
    });
  }

  // ── 4. Owl carousel re-init ──────────────────────────────────────────────
  if (typeof jQuery !== 'undefined' && typeof jQuery.fn.owlCarousel !== 'undefined') {
    jQuery('.owl-carousel:not(.owl-loaded)').owlCarousel({
      rtl: true,
      items: 3,
      loop: true,
      autoplay: true,
      autoplayTimeout: 4000,
      margin: 16,
      nav: true,
      responsive: { 0:{items:1}, 600:{items:2}, 1000:{items:3} }
    });
  }

  // ── 5. Fullscreen navigation menu ────────────────────────────────────────
  function openClose(menu) {
    if (!menu) return;
    var open = menu.classList.contains('uc-active') || menu.style.display === 'flex';
    if (open) {
      menu.classList.remove('uc-active');
      menu.style.display = '';
      document.body.style.overflow = '';
    } else {
      menu.classList.add('uc-active');
      menu.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  // Trigger button → opens fullscreen overlay
  document.querySelectorAll('[id*="fullscreen"] .uc_menu_icon, [class*="fullscreen"] .uc_menu_icon, .uc-fs-trigger, [id*="fullscreen_navigation"] .ue-btn').forEach(function(btn) {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      var overlay = document.querySelector('[id*="fullscreen"] .uc-fs-overlay, [id*="fullscreen_navigation"] .uc-fs-content, .uc-fs-overlay');
      if (!overlay) overlay = this.closest('[id*="fullscreen_navigation"]') || this.closest('[class*="fullscreen"]');
      openClose(overlay);
    });
  });

  // Close button inside overlay
  document.querySelectorAll('.uc-fs-close, [class*="close-btn"], [class*="fs-close"]').forEach(function(btn) {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var overlay = this.closest('.uc-fs-overlay, [id*="fullscreen"]');
      if (overlay) openClose(overlay);
    });
  });

  // Escape key closes any open overlay
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.uc-active, .uc-fs-overlay[style*="flex"]').forEach(function(el) {
        el.classList.remove('uc-active');
        el.style.display = '';
        document.body.style.overflow = '';
      });
    }
  });

  // ── 6. Sticky header fix ──────────────────────────────────────────────────
  var header = document.querySelector('header.site-header, .ast-site-header-wrap, header');
  if (header && !header.style.position) {
    var origTop = header.getBoundingClientRect().top + window.scrollY;
    window.addEventListener('scroll', function() {
      if (window.scrollY > origTop + 50) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    });
  }

  // ── 7. WooCommerce: prevent cart fragment errors ─────────────────────────
  if (typeof wc_cart_fragments_params !== 'undefined') {
    wc_cart_fragments_params.ajax_url = 'data:application/json,{}';
  }

  // ── 8. Video hover play ───────────────────────────────────────────────────
  document.querySelectorAll('[class*="video-hover"] video, [class*="video_carousel"] video').forEach(function(v) {
    v.muted = true;
    v.loop  = true;
    v.parentElement.addEventListener('mouseenter', function() { v.play().catch(function(){}); });
    v.parentElement.addEventListener('mouseleave', function() { v.pause(); v.currentTime = 0; });
  });

  // ── 9. CSS transitions: add a class to body after load ───────────────────
  document.body.classList.add('site-loaded');
  setTimeout(function() {
    document.querySelectorAll('[data-wow-delay], [data-aos]').forEach(function(el) {
      el.classList.add('wow-animated', 'aos-animate', 'animated');
    });
  }, 300);

});

})();
/* ═══════════════════════════════════════════════════════════════════════════ */
</script>
<style>
/* ── Header scrolled state ── */
.header-scrolled { box-shadow: 0 2px 10px rgba(0,0,0,.15); }
/* ── Ensure animations fire on load ── */
body.site-loaded .wow { visibility: visible !important; animation-play-state: running !important; }
body.site-loaded [data-aos] { opacity: 1 !important; transform: none !important; transition: opacity .5s, transform .5s; }
/* ── Fullscreen nav overlay ── */
[id*="fullscreen_navigation"] .uc-fs-overlay,
[id*="fullscreen"] .uc-fs-content { display: none; }
[id*="fullscreen_navigation"] .uc-fs-overlay.uc-active,
[id*="fullscreen"] .uc-fs-content.uc-active { display: flex !important; }
</style>`;

// ── Apply to all HTML files ───────────────────────────────────────────────────
const files = allHtmlFiles(ROOT);
let patched = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('OFFLINE-FINAL-FIX')) continue;

  // Also fix any remaining the-smart-traveller.com links in href (not CSS/JS/img)
  // that the build script may have missed (anchor tags to root pages)
  const depth = file.replace(ROOT + path.sep, '').split(path.sep).length - 1;
  const pp = depth === 0 ? '' : '../';

  // Fix the site title/logo link
  html = html.replace(/href=["']https?:\/\/the-smart-traveller\.com["']/gi, `href="${pp}index.html"`);

  // Remove wp-cron pings
  html = html.replace(/<link[^>]*wp-cron[^>]*\/?>/gi, '');

  // Inject FINAL_FIX before </body>
  html = html.replace('</body>', FINAL_FIX + '\n</body>');
  fs.writeFileSync(file, html, 'utf8');
  patched++;
}
console.log(`✓ Final fix applied to ${patched} pages.`);
console.log('  Refresh http://localhost:8080/ to see all changes.');
