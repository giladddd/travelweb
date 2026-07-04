/**
 * local-cart.js — Smart Traveller offline cart
 * Uses localStorage to store cart items.
 * Works on shop.html, categories/*, products/* pages.
 */
(function () {
  'use strict';

  var CART_KEY = 'st_cart';

  /* ── Storage helpers ─────────────────────────────────── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
  }
  function getTotalCount() {
    return getCart().reduce(function (n, it) { return n + (it.qty || 1); }, 0);
  }

  /* ── CSS injection ───────────────────────────────────── */
  (function injectCSS() {
    var style = document.createElement('style');
    style.textContent =
      '.elementor-icon-wrapper { position: relative !important; }' +
      '.st-icon-count {' +
        'position: absolute !important;' +
        'top: -5px !important;' +
        'left: -5px !important;' +
        'background: #F97316 !important;' +
        'color: #fff !important;' +
        'font-size: 11px !important;' +
        'font-weight: 800 !important;' +
        'min-width: 19px !important;' +
        'height: 19px !important;' +
        'border-radius: 10px !important;' +
        'padding: 0 4px !important;' +
        'display: none;' +
        'align-items: center !important;' +
        'justify-content: center !important;' +
        'z-index: 9999 !important;' +
        'line-height: 1 !important;' +
        'pointer-events: none !important;' +
      '}';
    var head = document.head || document.getElementsByTagName('head')[0];
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  })();

  /* ── Badge update ────────────────────────────────────── */
  function applyIconBadge(count) {
    var cartSvg = document.querySelector('svg.e-fas-shopping-cart');
    if (!cartSvg) return false;
    var wrapper = cartSvg.closest('.elementor-icon-wrapper') || cartSvg.parentElement;
    var iconLink = cartSvg.closest('a');
    /* Fix link to local page */
    if (iconLink && iconLink.href && iconLink.href.indexOf('order-summary') < 0) {
      var isSubdir = window.location.pathname.includes('/products/') || window.location.pathname.includes('/categories/');
      iconLink.href = isSubdir ? '../order-summary.html' : 'order-summary.html';
    }
    var badge = wrapper.querySelector('.st-icon-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'st-icon-count';
      wrapper.appendChild(badge);
    }
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    return true;
  }

  function updateBadges() {
    var count = getTotalCount();
    /* Text badge next to "לעגלה שלי" in nav */
    document.querySelectorAll('.st-cart-badge').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
    /* Icon badge on cart SVG — use MutationObserver + setTimeout fallbacks */
    if (!applyIconBadge(count)) {
      /* Watch for the SVG being added to the DOM asynchronously */
      var observer = new MutationObserver(function (mutations, obs) {
        if (applyIconBadge(count)) {
          obs.disconnect();
        }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      /* setTimeout fallbacks in case MutationObserver misses it */
      var retries = [500, 1500, 3000, 5000];
      retries.forEach(function (delay) {
        setTimeout(function () {
          if (applyIconBadge(count)) {
            observer.disconnect();
          }
        }, delay);
      });
    }
  }

  /* ── Add item ────────────────────────────────────────── */
  function addItem(productId, name, price, image) {
    var cart = getCart();
    var found = false;
    cart.forEach(function (it) {
      if (it.id === productId) { it.qty = (it.qty || 1) + 1; found = true; }
    });
    if (!found) {
      cart.push({ id: productId, name: name, price: price, image: image, qty: 1 });
    }
    saveCart(cart);
    updateBadges();
  }

  /* ── Extract product info from button context ────────── */
  function getProductInfo(btn) {
    var productId = (btn.getAttribute('data-product_id') || '').trim();

    /* Walk up to find the product card */
    var card = btn.closest('.uc_overlay_image_carousel') ||
               btn.closest('[id*="uc_woocommerce"]') ||
               btn.parentElement;

    var nameEl = card && (
      card.querySelector('.uc_post_title a') ||
      card.querySelector('.uc_post_title') ||
      card.querySelector('.product_title') ||
      card.querySelector('h1, h2, h3')
    );
    var name = nameEl ? nameEl.textContent.trim() : ('מוצר #' + productId);

    var priceEl = card && card.querySelector('.woocommerce-Price-amount');
    var price = priceEl ? priceEl.textContent.trim() : '';

    var imgEl = card && card.querySelector('img.uc_product_image, img');
    var image = imgEl ? (imgEl.src || imgEl.getAttribute('src') || '') : '';

    return { id: productId, name: name, price: price, image: image };
  }

  /* ── Determine cart URL based on current path ────────── */
  function cartUrl() {
    var p = window.location.pathname;
    return (p.includes('/products/') || p.includes('/categories/'))
      ? '../order-summary.html'
      : 'order-summary.html';
  }

  /* ── Handler for carousel "הוסיפו להזמנה" buttons ─────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.uc-button-addcart');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var info = getProductInfo(btn);
    addItem(info.id, info.name, info.price, info.image);

    /* Visual feedback */
    var wrapper = btn.querySelector('.ue-inner-btn-wrapper');
    if (wrapper) {
      var spans = wrapper.querySelectorAll('span');
      var labelSpan = null;
      spans.forEach(function (s) {
        if (!s.querySelector('i') && !s.querySelector('svg') && s.textContent.trim()) {
          labelSpan = s;
        }
      });
      if (labelSpan) {
        var origText = labelSpan.textContent;
        labelSpan.textContent = '✓ נוסף לסל';
        btn.style.cssText += ';background:#16a34a!important;';
        setTimeout(function () {
          labelSpan.textContent = origText;
          btn.style.background = '';
          window.location.href = cartUrl();
        }, 900);
        return;
      }
    }
    window.location.href = cartUrl();
  }, true);

  /* ── Handler for WooCommerce single-product form submit ── */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.classList.contains('cart')) return;
    e.preventDefault();
    e.stopPropagation();

    /* Product ID from submit button value (name="add-to-cart") */
    var submitBtn = form.querySelector('button[name="add-to-cart"]');
    var productId = submitBtn ? (submitBtn.value || '').trim() : '';

    /* Quantity */
    var qtyInput = form.querySelector('input.qty');
    var qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;

    /* Product name from page h1 */
    var h1 = document.querySelector('h1.product_title, .entry-title');
    var name = h1 ? h1.textContent.trim() : ('מוצר #' + productId);

    /* Price from entry-summary */
    var priceEl = document.querySelector('.entry-summary .woocommerce-Price-amount');
    var price = priceEl ? priceEl.textContent.trim() : '';

    /* Image */
    var imgEl = document.querySelector('.woocommerce-product-gallery img, .wp-post-image');
    var image = imgEl ? (imgEl.src || '') : '';

    /* Add qty times */
    for (var i = 0; i < qty; i++) {
      addItem(productId, name, price, image);
    }

    /* Button feedback */
    if (submitBtn) {
      var origText = submitBtn.textContent;
      submitBtn.textContent = '✓ נוסף לסל';
      submitBtn.style.cssText += ';background:#16a34a!important;';
      setTimeout(function () {
        submitBtn.textContent = origText;
        submitBtn.style.background = '';
        window.location.href = cartUrl();
      }, 900);
    } else {
      window.location.href = cartUrl();
    }
  }, true);

  /* ── Init ────────────────────────────────────────────── */
  function init() { updateBadges(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API (used by order-summary.html) ─────────── */
  window.ST_CART = {
    getCart: getCart,
    saveCart: saveCart,
    getTotalCount: getTotalCount,
    updateBadges: updateBadges,
    removeItem: function (productId) {
      var cart = getCart().filter(function (it) { return it.id !== productId; });
      saveCart(cart);
      updateBadges();
    },
    changeQty: function (productId, delta) {
      var cart = getCart();
      cart.forEach(function (it) {
        if (it.id === productId) { it.qty = Math.max(1, (it.qty || 1) + delta); }
      });
      saveCart(cart);
      updateBadges();
    },
    clearCart: function () { saveCart([]); updateBadges(); }
  };

})();
