// ============================================================
// Smart Traveller – client-side cart (no PHP backend)
// ============================================================

// Suppress WooCommerce variation-selection alerts immediately
window.alert = function() {};

// ============================================================
// Cart helpers – run synchronously so badge updates on load
// ============================================================
var SmartCart = (function() {
    var STORAGE_KEY = 'smartCart';

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch (e) { return []; }
    }

    function save(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

    function addItem(item) {
        var items = load();
        items.push(item);
        save(items);
        return items;
    }

    // Read active xpro swatch selections from form
    function readVariations(form) {
        var variations = {};
        if (!form) return variations;
        form.querySelectorAll('.xpro_swatches').forEach(function(group) {
            var attrName = group.getAttribute('data-attribute_name') || '';
            var selected = group.querySelector('.swatch.selected');
            if (selected) {
                var tooltip = selected.querySelector('.xpro_swatch__tooltip');
                variations[attrName] = tooltip ? tooltip.textContent.trim() : (selected.getAttribute('data-value') || '');
            } else {
                var sel = form.querySelector('select[data-attribute_name="' + attrName + '"]');
                if (sel && sel.value) {
                    var opt = sel.querySelector('option[value="' + sel.value + '"]');
                    variations[attrName] = opt ? opt.textContent.trim() : sel.value;
                }
            }
        });
        return variations;
    }

    // Read current price – prefer variation price, fall back to base price
    function readPrice(form) {
        var container = form ? (form.closest('.summary, .entry-summary') || document) : document;
        var el = container.querySelector('.woocommerce-variation-price .woocommerce-Price-amount bdi')
               || container.querySelector('.price .woocommerce-Price-amount bdi')
               || document.querySelector('.price .woocommerce-Price-amount bdi');
        if (!el) return 0;
        var num = parseFloat(el.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }

    function readProductName() {
        var el = document.querySelector('h1.product_title');
        return el ? el.textContent.trim() : document.title.trim();
    }

    function readProductId(form) {
        if (!form) return '';
        var inp = form.querySelector('input[name="add-to-cart"]');
        return inp ? inp.value : (form.getAttribute('data-product_id') || '');
    }

    // Parse price from either a number or a string like "₪269.00"
    function parsePrice(p) {
        if (typeof p === 'number') return isNaN(p) ? 0 : p;
        if (!p) return 0;
        var n = parseFloat(String(p).replace(/[^\d.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    // Update cart badge and total in header widget
    function updateBadge() {
        var items = load();
        var count = items.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
        var total = items.reduce(function(s, i) { return s + parsePrice(i.price) * (i.qty || 1); }, 0);

        // Count bubble: data-counter attribute on icon span
        document.querySelectorAll('.elementor-button-icon[data-counter]').forEach(function(el) {
            el.setAttribute('data-counter', count);
        });

        // Badge elements used by the theme cart widget
        document.querySelectorAll('.smart-cart-badge, .uc_side_menu_single_count').forEach(function(el) {
            el.textContent = count;
        });

        // Subtotal text
        document.querySelectorAll('.hfe-subtotal .woocommerce-Price-amount.amount').forEach(function(el) {
            var sym = el.querySelector('.woocommerce-Price-currencySymbol');
            if (!sym) {
                sym = document.createElement('span');
                sym.className = 'woocommerce-Price-currencySymbol';
                sym.innerHTML = '&#8362;';
            }
            el.textContent = total.toFixed(2) + ' ';
            el.appendChild(sym);
        });
    }

    // Update badge immediately on every page load
    updateBadge();

    return { load: load, addItem: addItem, readVariations: readVariations, readPrice: readPrice, readProductName: readProductName, readProductId: readProductId, updateBadge: updateBadge, _parsePrice: parsePrice };
})();

// ============================================================
// jQuery-dependent setup
// ============================================================
jQuery(document).ready(function($) {

    // Suppress WooCommerce dialogs
    if (window.wc_add_to_cart_params) { window.wc_add_to_cart_params.i18n_make_a_selection_text = ''; }
    $(document).on('wc_variation_form_error check_variations', function(e) { e.stopImmediatePropagation(); return false; });

    // --------------------------------------------------------
    // Side menu submenu collapse / toggle
    // --------------------------------------------------------

    // --------------------------------------------------------
    // Add-to-cart intercept (capture phase = before WooCommerce)
    // --------------------------------------------------------
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.single_add_to_cart_button, .uc-button-addcart, .add_to_cart_button');
        if (!btn) return;
        e.preventDefault();
        e.stopImmediatePropagation();

        btn.classList.remove('disabled', 'wc-variation-selection-needed', 'loading');

        var form = btn.closest('form.variations_form, form.cart');
        var card = btn.closest('.uc_post_grid_style_one_item, .ue-item, .product, .type-product, [class*="product_item"], [class*="product-item"], li.product');
        var productName = '';
        var price = 0;
        var productId = btn.getAttribute('data-product_id') || '';
        var variations = {};

        if (form) {
            // Single product page with a form — read everything from the form context
            productId = SmartCart.readProductId(form) || productId;
            variations = SmartCart.readVariations(form);
            price = SmartCart.readPrice(form);
            var summary = form.closest('.summary, .entry-summary, .product');
            var h1 = summary ? summary.querySelector('h1.product_title, h1, h2') : null;
            productName = h1 ? h1.textContent.trim() : SmartCart.readProductName();
        } else {
            // Grid product button — name from data attribute, price from card DOM
            productName = btn.getAttribute('data-product_name') || '';
            if (card) {
                // Always try to read price from card (regardless of productName)
                var priceEl = card.querySelector('.ue_grid_prices bdi, .woocommerce-Price-amount bdi, .price bdi');
                if (priceEl) {
                    price = parseFloat(priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                }
                // Only read name from DOM if data-product_name was missing
                if (!productName) {
                    var nameEl = card.querySelector('.uc_title a, .woocommerce-loop-product__title, .product-title, h2, h3');
                    if (nameEl) productName = nameEl.textContent.trim();
                }
            }
            if (!productName) productName = SmartCart.readProductName();
        }

        // Save to cart
        SmartCart.addItem({ id: productId, name: productName, price: price, variations: variations, qty: 1, addedAt: Date.now() });

        // Visual feedback: green button for 3 seconds, then restore
        var origHTML   = btn.innerHTML;
        var origBg     = btn.style.backgroundColor;
        var origBorder = btn.style.borderColor;
        var origColor  = btn.style.color;
        btn.style.backgroundColor = '#22c55e';
        btn.style.borderColor = '#16a34a';
        btn.style.color = '#ffffff';
        btn.style.pointerEvents = 'none';
        btn.innerHTML = '✓ נוסף לסל';

        setTimeout(function() {
            btn.innerHTML = origHTML;
            btn.style.backgroundColor = origBg;
            btn.style.borderColor = origBorder;
            btn.style.color = origColor;
            btn.style.pointerEvents = '';
        }, 3000);

        // Update badge
        SmartCart.updateBadge();
    }, true);

    // Block form submit from cart/variations forms
    // --------------------------------------------------------
    // Price update based on variation selection
    // --------------------------------------------------------
    function updateVariationPrice() {
        var form = document.querySelector('form.variations_form');
        if (!form) return;
        var variations = JSON.parse(form.getAttribute('data-product_variations') || '[]');
        if (!variations.length) return;

        // Collect selected attributes
        var selected = {};
        form.querySelectorAll('select[data-attribute_name]').forEach(function(sel) {
            var an = sel.getAttribute('data-attribute_name') || sel.name;
            if (sel.value) selected[an] = sel.value;
        });
        form.querySelectorAll('.xpro_swatches').forEach(function(group) {
            var attr = group.getAttribute('data-attribute_name');
            var sw = group.querySelector('.swatch.selected');
            if (sw) selected[attr] = sw.getAttribute('data-value');
        });

        // Find matching variation
        var match = variations.find(function(v) {
            return Object.keys(v.attributes).every(function(k) {
                return !selected[k] || v.attributes[k] === selected[k] || v.attributes[k] === '';
            });
        });

        var livePrice = document.getElementById('smart-price-display');
        if (match && livePrice) {
            var dp = parseFloat(match.display_price) || 0;
            livePrice.innerHTML = dp.toFixed(2) + '&nbsp;&#8362;';
        } else if (!match && livePrice && Object.keys(selected).length > 0) {
            livePrice.textContent = 'בחר אפשרות';
        }
        // Also update the main price block for SmartCart to read
        var priceEl = document.querySelector('.price .woocommerce-Price-amount bdi');
        if (match && priceEl) {
            var dp2 = parseFloat(match.display_price) || 0;
            priceEl.innerHTML = dp2.toFixed(2) + '&nbsp;<span class="woocommerce-Price-currencySymbol">&#8362;</span>';
        }
    }

    // Month picker: toggle list + select option
    $(document).on('click', '#smart-month-trigger', function(e) {
        e.stopPropagation();
        var list = document.getElementById('smart-month-list');
        if (!list) return;
        list.style.display = list.style.display === 'none' ? 'flex' : 'none';
    });

    $(document).on('click', '.smart-month-opt', function(e) {
        e.stopPropagation();
        var val = this.getAttribute('data-value');
        var text = this.textContent.trim();
        // Update hidden select
        var sel = document.querySelector('select[data-attribute_name="attribute_pa_months"]')
                || document.querySelector('select[name="attribute_pa_months"]')
                || document.getElementById('pa_months');
        if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
        // Update trigger label
        var trigger = document.getElementById('smart-month-trigger');
        if (trigger) trigger.textContent = text + ' ▾';
        // Update selected class on opts
        document.querySelectorAll('.smart-month-opt').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
        // Close list
        var list = document.getElementById('smart-month-list');
        if (list) list.style.display = 'none';
        // Update price
        updateVariationPrice();
    });

    // Close list when clicking outside the picker
    document.addEventListener('click', function(e) {
        if (e.target.closest('#smart-month-picker')) return;
        var list = document.getElementById('smart-month-list');
        if (list) list.style.display = 'none';
    });

    // Swatch click: toggle selected class + sync hidden select + update price
    document.addEventListener('click', function(e) {
        var swatch = e.target.closest('.xpro_swatches .swatch');
        if (!swatch) return;
        var group = swatch.closest('.xpro_swatches');
        // Remove selected from siblings
        group.querySelectorAll('.swatch').forEach(function(s) { s.classList.remove('selected'); });
        // Add selected to clicked
        swatch.classList.add('selected');
        // Sync hidden select
        var val = swatch.getAttribute('data-value');
        var attr = group.getAttribute('data-attribute_name');
        if (attr) {
            var sel = document.querySelector('select[name="' + attr + '"]')
                   || document.querySelector('select[data-attribute_name="' + attr + '"]');
            if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
        }
        setTimeout(updateVariationPrice, 30);
    }, true);

    // Run on load with default 4-month selection
    setTimeout(updateVariationPrice, 200);

    // Mobile step CTA click handler
    document.addEventListener('click', function(e) {
        var cta = e.target.closest('.mobile-step1-cta');
        if (!cta) return;
        var nav = document.querySelector('.ue-tabs.uc_tab_nav');
        if (nav) {
            var top = nav.getBoundingClientRect().top + window.scrollY - 85;
            window.scrollTo({ top: top, behavior: 'smooth' });
            setTimeout(function() {
                var tab = document.querySelector('[data-hash-id="#ue-tab2"]');
                if (tab) tab.click();
            }, 400);
        }
    });

    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('cart') || e.target.classList.contains('variations_form')) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    // --------------------------------------------------------
    // Fix Owl video carousels that initialized at 0 width
    // (causes one giant full-width video). Refresh once the
    // container has real width, and clip the scaled video.
    // --------------------------------------------------------
    (function() {
        // Force 16:9 aspect ratio on video carousel items via CSS + JS height fix
        var st = document.createElement('style');
        st.textContent =
            '.ue-video-carousel .ue_vc_item{overflow:hidden !important;}' +
            '.ue-video-carousel .ue-hover-image-video{overflow:hidden !important; position:relative !important; padding-bottom:56.25% !important; height:0 !important;}' +
            '.ue-video-carousel .ue-video{position:absolute !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important;}' +
            '.ue-video-carousel .owl-item{overflow:hidden !important;}';
        document.head.appendChild(st);

        function fixCarouselHeight() {
            document.querySelectorAll('.ue-video-carousel').forEach(function(c) {
                var w = c.getBoundingClientRect().width;
                if (!w) return;
                // Owl shows 3 items on desktop, 1 on mobile — derive item width from stage
                var stageOuter = c.querySelector('.owl-stage-outer');
                var itemW = stageOuter ? stageOuter.getBoundingClientRect().width / (window.innerWidth < 768 ? 1 : 3) : w / 3;
                var h = Math.round(itemW * 0.5625); // 16:9
                c.querySelectorAll('.owl-item').forEach(function(item) {
                    item.style.height = h + 'px';
                    item.style.overflow = 'hidden';
                });
            });
        }

        function refreshOwl() {
            if (!window.jQuery || !jQuery.fn || !jQuery.fn.owlCarousel) return;
            jQuery('.owl-carousel.owl-loaded').each(function() {
                if (this.getBoundingClientRect().width > 0) {
                    jQuery(this).trigger('refresh.owl.carousel');
                }
            });
            fixCarouselHeight();
        }
        jQuery(window).on('load', function() {
            setTimeout(refreshOwl, 300);
            setTimeout(refreshOwl, 1200);
            setTimeout(fixCarouselHeight, 2000);
        });
        var rt;
        jQuery(window).on('resize', function() {
            clearTimeout(rt);
            rt = setTimeout(refreshOwl, 200);
        });
        setTimeout(refreshOwl, 800);
    })();

    // --------------------------------------------------------
    // Order-summary page: render smartCart from localStorage
    // --------------------------------------------------------
    var emptyCartMsg = document.querySelector('.wc-empty-cart-message');
    if (emptyCartMsg) {

        function renderCart() {
            var cartItems = SmartCart.load();
            var wooDiv = emptyCartMsg.parentNode;

            // Remove any previous render
            var prev = document.getElementById('smart-cart-summary');
            if (prev) prev.remove();

            if (cartItems.length === 0) {
                emptyCartMsg.style.display = 'none';
                var prevEmpty = document.getElementById('smart-cart-empty');
                if (!prevEmpty) {
                    var emptyHtml = '<div id="smart-cart-empty" style="text-align:center;padding:40px 20px;color:#9ca3af;background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.07);">'
                        + '<div style="font-size:3rem;margin-bottom:12px;">🛒</div>'
                        + '<p style="font-size:1.1rem;font-weight:700;color:#374151;margin:0 0 8px;">הסל ריק</p>'
                        + '<p style="font-size:0.9rem;margin:0 0 20px;">הוסיפו מוצרים מדף המוצרים</p>'
                        + '<a href="index.html" style="display:inline-block;background:#f97316;color:#fff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:700;">חזרה לחנות</a>'
                        + '</div>';
                    wooDiv.insertAdjacentHTML('beforeend', emptyHtml);
                }
                return;
            }
            // Remove empty state if cart now has items
            var existingEmpty = document.getElementById('smart-cart-empty');
            if (existingEmpty) existingEmpty.remove();

            emptyCartMsg.style.display = 'none';

            // Deduplicate: merge items with same product id + same variations into one row
            var hebrewKeyMap = {
                'Package': 'חבילה', 'package': 'חבילה',
                'Months': 'חודשים', 'months': 'חודשים',
                'attribute_pa_package': 'חבילה',
                'attribute_pa_months': 'חודשים'
            };

            function varKey(item) {
                return (item.id || item.name || '') + '||' + JSON.stringify(item.variations || {});
            }

            var mergedMap = [];
            var keyToIdx = {};
            cartItems.forEach(function(item) {
                var k = varKey(item);
                if (keyToIdx.hasOwnProperty(k)) {
                    mergedMap[keyToIdx[k]].qty = (mergedMap[keyToIdx[k]].qty || 1) + (item.qty || 1);
                } else {
                    keyToIdx[k] = mergedMap.length;
                    mergedMap.push(Object.assign({}, item, { qty: item.qty || 1 }));
                }
            });

            // Persist the deduplicated array so event-handler indices stay aligned
            localStorage.setItem('smartCart', JSON.stringify(mergedMap));
            SmartCart.updateBadge();

            var total = mergedMap.reduce(function(s, item) {
                return s + (SmartCart._parsePrice(item.price) * (item.qty || 1));
            }, 0);

            var rows = mergedMap.map(function(item, idx) {
                var variationsHtml = '';
                if (item.variations && Object.keys(item.variations).length) {
                    var pairs = Object.keys(item.variations).map(function(k) {
                        var label = hebrewKeyMap[k] || hebrewKeyMap[k.replace(/^attribute_pa_/, '')] || k.replace(/^attribute_pa_/, '').replace(/_/g, ' ');
                        return '<span class="sc-var-key">' + label + ':</span>&nbsp;' + item.variations[k];
                    });
                    variationsHtml = '<div class="sc-variations">' + pairs.join('<span class="sc-var-sep"> | </span>') + '</div>';
                }
                var parsedPrice = SmartCart._parsePrice(item.price);
                var unitPrice = (item.price && parsedPrice > 0) ? parsedPrice.toFixed(2) : null;
                var qty = item.qty || 1;
                return '<tr class="sc-row" data-idx="' + idx + '">'
                    + '<td class="sc-name-cell"><div class="sc-name">' + item.name + '</div>' + variationsHtml + '</td>'
                    + '<td class="sc-qty-cell">'
                    +   '<div class="sc-qty-control">'
                    +     '<button class="sc-qty-btn sc-qty-plus" data-idx="' + idx + '">+</button>'
                    +     '<span class="sc-qty-val">' + qty + '</span>'
                    +     '<button class="sc-qty-btn sc-qty-minus" data-idx="' + idx + '">&minus;</button>'
                    +   '</div>'
                    + '</td>'
                    + '<td class="sc-price-cell">' + (unitPrice !== null ? unitPrice + '&nbsp;<span class="sc-sym">&#8362;</span>' : '&mdash;') + '</td>'
                    + '<td class="sc-remove-cell"><button class="sc-remove-btn" data-idx="' + idx + '" title="הסר מהסל">&#x2715;</button></td>'
                    + '</tr>';
            }).join('');

            var tableHtml = '<div id="smart-cart-summary">'
                + '<style>'
                + '@import url("https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap");'
                + '#smart-cart-summary{'
                +   'direction:rtl;font-family:"Assistant",sans-serif;'
                +   'background:#fff;border-radius:12px;'
                +   'box-shadow:0 2px 16px rgba(0,0,0,.08);'
                +   'overflow:hidden;margin-bottom:32px;'
                + '}'
                + '#smart-cart-summary .sc-table-wrap{overflow-x:auto}'
                + '#smart-cart-summary table{'
                +   'width:100%;border-collapse:collapse;min-width:520px'
                + '}'
                + '#smart-cart-summary thead tr{'
                +   'background:#0F172B;color:#fff'
                + '}'
                + '#smart-cart-summary thead th{'
                +   'padding:13px 16px;text-align:right;font-size:13px;font-weight:600;'
                +   'white-space:nowrap;letter-spacing:.3px'
                + '}'
                + '#smart-cart-summary thead th.sc-th-remove{width:36px;text-align:center}'
                + '#smart-cart-summary tbody tr:nth-child(even){background:#fafafa}'
                + '#smart-cart-summary tbody tr:hover{background:#fff7ed}'
                + '#smart-cart-summary td{'
                +   'padding:14px 16px;border-bottom:1px solid #f0f0f0;'
                +   'vertical-align:middle;font-size:14px;color:#0F172B'
                + '}'
                + '#smart-cart-summary .sc-name{font-weight:600;font-size:14px;line-height:1.4}'
                + '#smart-cart-summary .sc-variations{'
                +   'font-size:12px;color:#64748b;margin-top:4px;line-height:1.5'
                + '}'
                + '#smart-cart-summary .sc-var-key{text-transform:capitalize;font-weight:600}'
                + '#smart-cart-summary .sc-var-sep{color:#cbd5e1;margin:0 4px}'
                + '#smart-cart-summary .sc-sym{font-size:.85em}'
                + '#smart-cart-summary .sc-price-cell{'
                +   'white-space:nowrap;font-weight:600;color:#374151;font-size:14px'
                + '}'
                + '#smart-cart-summary .sc-subtotal{'
                +   'white-space:nowrap;font-weight:700;color:#0F172B;font-size:14px'
                + '}'
                + '#smart-cart-summary .sc-qty-control{'
                +   'display:inline-flex;align-items:center;'
                +   'border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden'
                + '}'
                + '#smart-cart-summary .sc-qty-btn{'
                +   'background:#f8fafc;border:none;cursor:pointer;'
                +   'width:30px;height:30px;font-size:16px;font-weight:700;'
                +   'color:#f97316;line-height:1;transition:background .15s'
                + '}'
                + '#smart-cart-summary .sc-qty-btn:hover{background:#fff7ed}'
                + '#smart-cart-summary .sc-qty-val{'
                +   'min-width:28px;text-align:center;font-size:14px;font-weight:600;'
                +   'padding:0 4px;color:#0F172B'
                + '}'
                + '#smart-cart-summary .sc-remove-cell{text-align:center;width:36px}'
                + '#smart-cart-summary .sc-remove-btn{'
                +   'background:none;border:none;cursor:pointer;'
                +   'color:#cbd5e1;font-size:15px;padding:4px;'
                +   'border-radius:50%;width:26px;height:26px;'
                +   'display:inline-flex;align-items:center;justify-content:center;'
                +   'transition:background .15s,color .15s'
                + '}'
                + '#smart-cart-summary .sc-remove-btn:hover{background:#fee2e2;color:#dc2626}'
                + '#smart-cart-summary tfoot tr{'
                +   'background:#0F172B'
                + '}'
                + '#smart-cart-summary tfoot td{'
                +   'padding:16px;border-bottom:none;color:#fff;font-weight:700;font-size:15px'
                + '}'
                + '#smart-cart-summary .sc-total-label{color:#94a3b8;font-size:13px;font-weight:400}'
                + '#smart-cart-summary .sc-total-amount{font-size:18px;color:#f97316}'
                + '</style>'
                + '<div class="sc-table-wrap"><table>'
                + '<thead><tr>'
                + '<th>מוצר</th>'
                + '<th>כמות</th>'
                + '<th>מחיר</th>'
                + '<th class="sc-th-remove"></th>'
                + '</tr></thead>'
                + '<tbody>' + rows + '</tbody>'
                + '<tfoot><tr>'
                + '<td colspan="2"><span class="sc-total-label">סך הכל</span></td>'
                + '<td colspan="2" style="text-align:left"><span class="sc-total-amount">' + total.toFixed(2) + '&nbsp;&#8362;</span></td>'
                + '</tr></tfoot>'
                + '</table></div>'
                + '</div>';

            wooDiv.insertAdjacentHTML('beforeend', tableHtml);

            // Delegated event handler for +/−/remove
            document.getElementById('smart-cart-summary').addEventListener('click', function(e) {
                var items = SmartCart.load();

                var removeBtn = e.target.closest('.sc-remove-btn');
                if (removeBtn) {
                    var ridx = parseInt(removeBtn.getAttribute('data-idx'), 10);
                    items.splice(ridx, 1);
                    localStorage.setItem('smartCart', JSON.stringify(items));
                    SmartCart.updateBadge();
                    renderCart();
                    return;
                }

                var plusBtn = e.target.closest('.sc-qty-plus');
                if (plusBtn) {
                    var pidx = parseInt(plusBtn.getAttribute('data-idx'), 10);
                    items[pidx].qty = (items[pidx].qty || 1) + 1;
                    localStorage.setItem('smartCart', JSON.stringify(items));
                    SmartCart.updateBadge();
                    renderCart();
                    return;
                }

                var minusBtn = e.target.closest('.sc-qty-minus');
                if (minusBtn) {
                    var midx = parseInt(minusBtn.getAttribute('data-idx'), 10);
                    var curQty = items[midx].qty || 1;
                    if (curQty <= 1) {
                        items.splice(midx, 1);
                    } else {
                        items[midx].qty = curQty - 1;
                    }
                    localStorage.setItem('smartCart', JSON.stringify(items));
                    SmartCart.updateBadge();
                    renderCart();
                    return;
                }
            });
        }

        renderCart();
    }
});
