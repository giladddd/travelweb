/**
 * woo-cart-count.js
 * Reads WooCommerce cart count from localStorage fragments and displays
 * an orange badge on every svg.e-fas-shopping-cart icon in the page.
 *
 * No jQuery dependency — plain ES5-compatible JS.
 * Also hooks jQuery wc_fragments_loaded / wc_fragment_refresh when jQuery
 * is available so the badge stays in sync after AJAX cart updates.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Constants                                                           */
  /* ------------------------------------------------------------------ */
  var BADGE_ID_PREFIX   = 'woo-cart-badge-';
  var RETRY_DELAY_MS    = 600;
  var MAX_RETRIES       = 10;
  var retryCount        = 0;

  /* ------------------------------------------------------------------ */
  /*  1. Read the cart count from WooCommerce localStorage fragments      */
  /* ------------------------------------------------------------------ */
  function getCartCountFromFragments() {
    try {
      /* WooCommerce stores fragments under a key that looks like:
         "wc_fragments_<store_hash>"  – iterate all localStorage keys.
         The value is a JSON object whose keys are CSS selectors and whose
         values are HTML strings for the corresponding widget.            */
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('wc_fragments') === 0 || key.indexOf('woocommerce_cart_fragment') === 0) {
          var raw = localStorage.getItem(key);
          if (!raw) continue;

          var fragments;
          try { fragments = JSON.parse(raw); } catch (e) { continue; }

          /* fragments is an object: { "selector": "html string", ... }   */
          if (typeof fragments !== 'object' || fragments === null) continue;

          /* a) Direct cart_count property (some themes expose this)      */
          if (typeof fragments.cart_count !== 'undefined') {
            return parseInt(fragments.cart_count, 10) || 0;
          }

          /* b) Scan every HTML fragment for a recognisable count pattern */
          var fragmentValues = Object.values ? Object.values(fragments) : Object.keys(fragments).map(function(k){ return fragments[k]; });
          for (var j = 0; j < fragmentValues.length; j++) {
            var html = fragmentValues[j];
            if (typeof html !== 'string') continue;

            /* WooCommerce mini-cart: "X items" / "1 item"               */
            var m = html.match(/(\d+)\s+item/i);
            if (m) return parseInt(m[1], 10);

            /* data-count attribute used by some themes                  */
            m = html.match(/data-count=['"']?(\d+)['"']?/i);
            if (m) return parseInt(m[1], 10);

            /* class="count">N<  as emitted by WooCommerce widget        */
            m = html.match(/class=["'][^"']*count[^"']*["'][^>]*>\s*(\d+)\s*</i);
            if (m) return parseInt(m[1], 10);

            /* cart-contents: "N"  JSON-like embedded value              */
            m = html.match(/"cart_count"\s*:\s*(\d+)/i);
            if (m) return parseInt(m[1], 10);
          }
        }
      }
    } catch (e) {
      /* localStorage may be blocked in some browsers – fail silently    */
    }
    return null; // fragments not found yet
  }

  /* ------------------------------------------------------------------ */
  /*  2. DOM helpers                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Returns all cart SVG elements in the document.
   */
  function getCartSVGs() {
    return document.querySelectorAll('svg.e-fas-shopping-cart');
  }

  /**
   * Given an SVG element, return the nearest positioned ancestor that
   * can serve as the badge's offset parent.  We walk up to find the
   * .elementor-icon-wrapper, falling back to the direct parentElement.
   */
  function getBadgeParent(svg) {
    var el = svg.parentElement; // <a class="elementor-icon">
    if (!el) return null;
    var wrapper = el.parentElement; // <div class="elementor-icon-wrapper">
    return wrapper || el;
  }

  /* ------------------------------------------------------------------ */
  /*  3. Badge creation / update                                          */
  /* ------------------------------------------------------------------ */

  function ensureBadge(parent, index) {
    var id = BADGE_ID_PREFIX + index;
    var badge = document.getElementById(id);
    if (!badge) {
      badge = document.createElement('span');
      badge.id = id;

      /* Inline styles so the badge works regardless of external CSS     */
      badge.style.cssText = [
        'position:absolute',
        'top:-6px',
        'left:-6px',
        'min-width:18px',
        'height:18px',
        'padding:0 4px',
        'border-radius:50px',
        'background:#f97316',   /* orange-500 */
        'color:#ffffff',
        'font-size:11px',
        'font-weight:700',
        'line-height:18px',
        'text-align:center',
        'pointer-events:none',
        'z-index:9999',
        'display:none',
        'box-sizing:border-box',
        'font-family:sans-serif',
        'letter-spacing:0'
      ].join(';');

      /* The wrapper must be position:relative so the badge offsets correctly */
      var currentPosition = window.getComputedStyle(parent).position;
      if (currentPosition === 'static') {
        parent.style.position = 'relative';
      }

      parent.appendChild(badge);
    }
    return badge;
  }

  function updateAllBadges(count) {
    var svgs = getCartSVGs();
    for (var i = 0; i < svgs.length; i++) {
      var parent = getBadgeParent(svgs[i]);
      if (!parent) continue;

      var badge = ensureBadge(parent, i);
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  4. Main refresh function (called on init + on cart events)          */
  /* ------------------------------------------------------------------ */

  function refreshBadge() {
    var count = getCartCountFromFragments();

    if (count === null) {
      /* Fragments not available yet – retry                             */
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(refreshBadge, RETRY_DELAY_MS);
      }
      return;
    }

    retryCount = 0; // reset so future calls can also retry if needed
    updateAllBadges(count);
  }

  /* ------------------------------------------------------------------ */
  /*  5. jQuery event hooks (wc_fragments_loaded, wc_fragment_refresh)   */
  /* ------------------------------------------------------------------ */

  function bindJQueryEvents() {
    if (typeof window.jQuery === 'function') {
      window.jQuery(document.body)
        .on('wc_fragments_loaded wc_fragment_refresh added_to_cart removed_from_cart', function () {
          /* Give WooCommerce a tick to write the updated fragments       */
          setTimeout(refreshBadge, 150);
        });
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /*  6. Bootstrap                                                        */
  /* ------------------------------------------------------------------ */

  function init() {
    refreshBadge();

    /* Attempt to bind jQuery events; if jQuery isn't loaded yet, retry  */
    if (!bindJQueryEvents()) {
      var jqRetry = 0;
      var jqInterval = setInterval(function () {
        jqRetry++;
        if (bindJQueryEvents() || jqRetry > 20) {
          clearInterval(jqInterval);
        }
      }, 500);
    }

    /* Also listen to storage changes so another tab's cart update       */
    /* propagates here without a full page reload.                       */
    window.addEventListener('storage', function (e) {
      if (e.key && (e.key.indexOf('wc_fragments') === 0 || e.key.indexOf('woocommerce_cart_fragment') === 0)) {
        setTimeout(refreshBadge, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
