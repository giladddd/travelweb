(function() {
  // Hide old WordPress headers immediately
  var hideOld = document.createElement('style');
  hideOld.textContent = '.xpro-theme-builder-header, .onetap-header-top, #masthead, .ast-header-wrap, #ast-fixed-header, .open_side_menu { display:none !important; }';
  document.head.appendChild(hideOld);

  // CSS
  var style = document.createElement('style');
  style.textContent = `
    .sh-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10000; }
    .sh-overlay.open { display:block; }
    .sh-panel {
      position:fixed; top:0; right:-320px; width:300px; height:100vh;
      background:#0F172B; z-index:10001; overflow:hidden;
      transition:right 0.3s ease; padding:20px 24px; box-sizing:border-box;
    }
    .sh-panel.open { right:0; }
    .sh-close-btn { background:none; border:none; color:#94A3B8; font-size:26px; cursor:pointer; display:block; text-align:left; width:100%; padding:4px 0 16px; }
    .sh-close-btn:hover { color:white; }
    .sh-nav a { display:block; color:#CBD5E1; font-size:16px; font-weight:600; padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.08); transition:color 0.2s; text-decoration:none; font-family:'Assistant',sans-serif; }
    .sh-nav a:hover { color:#F97316; }
    .sh-guide-btn { display:block; width:100%; text-align:right; background:none; border:none; border-bottom:1px solid rgba(255,255,255,0.08); color:#CBD5E1; font-size:16px; font-weight:600; font-family:'Assistant',sans-serif; padding:11px 0; cursor:pointer; transition:color 0.2s; }
    .sh-guide-btn:hover { color:#F97316; }
    .sh-sub-panel { position:absolute; top:0; right:-100%; width:100%; height:100%; background:#0F172B; padding:20px 24px; overflow-y:auto; transition:right 0.3s ease; box-sizing:border-box; }
    .sh-sub-panel.open { right:0; }
    .sh-back-btn { display:block; width:100%; text-align:right; background:none; border:none; border-bottom:2px solid #F97316; color:#F97316; font-size:15px; font-weight:700; font-family:'Assistant',sans-serif; padding:10px 0 14px; cursor:pointer; margin-bottom:8px; }
    .sh-social { display:flex; gap:20px; margin-top:24px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08); }
    .sh-social a { font-size:22px; text-decoration:none; }
    .sh-header { position:fixed; top:0; right:0; left:0; z-index:9999; background:#FAECE3; height:70px; display:flex; align-items:center; justify-content:space-between; padding:0 24px; box-shadow:0 1px 8px rgba(0,0,0,0.1); }
    .sh-hamburger { display:flex; flex-direction:column; gap:5px; cursor:pointer; padding:6px; border:none; background:none; }
    .sh-hamburger span { display:block; width:24px; height:2px; background:#0F172B; border-radius:2px; }
    .sh-logo img { height:48px; width:auto; display:block; }
    .sh-cart { display:flex; align-items:center; gap:6px; background:#F97316; color:white; border-radius:50px; padding:8px 16px; font-size:14px; font-weight:700; text-decoration:none; white-space:nowrap; }
    .sh-cart-count { background:white; color:#F97316; border-radius:50%; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; }
    .sh-header-left { display:flex; align-items:center; gap:12px; }
    body { padding-top:70px !important; }
    .sh-float-btns { position:fixed; left:16px; bottom:20px; z-index:999; display:flex; flex-direction:column; gap:10px; }
    .sh-float-btn { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 4px 12px rgba(0,0,0,0.2); transition:transform 0.2s; text-decoration:none; }
    .sh-float-btn:hover { transform:scale(1.1); }
    .sh-float-wa { background:#25D366; }
    .sh-float-ig { background:radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%); }
    .sh-float-tt { background:#000; }
    .sh-float-acc { position:fixed; right:16px; bottom:20px; z-index:999; width:50px; height:50px; border-radius:50%; background:#1A56DB; display:flex; align-items:center; justify-content:center; font-size:24px; box-shadow:0 4px 12px rgba(0,0,0,0.2); cursor:pointer; border:none; transition:transform 0.2s; }
    .sh-float-acc:hover { transform:scale(1.1); }
  `;
  document.head.appendChild(style);

  // Determine path prefix based on page location
  var isInSubdir = window.location.pathname.indexOf('/categories/') !== -1;
  var prefix = isInSubdir ? '../' : '';

  // Inject header
  var header = document.createElement('header');
  header.className = 'sh-header';
  header.innerHTML = `
    <div class="sh-header-left">
      <button class="sh-hamburger" id="sh-hamburger"><span></span><span></span><span></span></button>
      <a href="${prefix}index.html" class="sh-logo"><img src="${prefix}assets/images/2024_03_cropped-logo.png" alt="המטייל החכם"></a>
    </div>
    <a href="${prefix}order-summary.html" class="sh-cart"><span class="sh-cart-count" id="sh-cart-count">0</span> ₪<span id="sh-cart-total">0</span></a>
  `;
  document.body.insertBefore(header, document.body.firstChild);

  // Side panel
  var overlay = document.createElement('div');
  overlay.className = 'sh-overlay';
  overlay.id = 'sh-overlay';

  var panel = document.createElement('div');
  panel.className = 'sh-panel';
  panel.id = 'sh-panel';
  panel.innerHTML = `
    <button class="sh-close-btn" id="sh-close">✕</button>
    <nav class="sh-nav">
      <a href="${prefix}index.html">דף הבית</a>
      <a href="${prefix}categories/bags-rental.html">מוצ'ילות להשכרה</a>
      <a href="${prefix}categories/day-bags.html">תיקי יום להשכרה</a>
      <a href="${prefix}categories/rental.html">ציוד טיילים להשכרה</a>
      <a href="${prefix}categories/general-equipment.html">ציוד כללי לקנייה</a>
      <a href="${prefix}categories/field.html">ציוד שטח לקנייה</a>
      <a href="${prefix}categories/hygiene.html">מוצרי הגיינה לקנייה</a>
      <a href="${prefix}categories/benefits.html">הטבות בהכנה בחינם</a>
      <a href="${prefix}about.html">אודות</a>
      <a href="${prefix}order-summary.html" style="color:#F97316">לעגלה שלי 🛒</a>
      <a href="https://wa.me/972523960215" target="_blank" style="color:#25D366">לשיחה עם מומחי הטיול 💬</a>
      <button class="sh-guide-btn" id="sh-guide-btn">המדריך המלא לטיול <span style="font-size:12px">◀</span></button>
    </nav>
    <div class="sh-sub-panel" id="sh-sub-panel">
      <button class="sh-back-btn" id="sh-back-btn">▶ חזרה לתפריט</button>
      <nav class="sh-nav">
        <a href="${prefix}guide.html">📋 כל המדריך</a>
        <a href="${prefix}guide.html#TG_2">שלב 2: יבשות ויעדים</a>
        <a href="${prefix}guide.html#TG_3">שלב 3: קבוצות ווואטסאפ</a>
        <a href="${prefix}guide.html#TG_4">שלב 4: תכנון תקציב</a>
        <a href="${prefix}guide.html#TG_5">שלב 5: אשראי למטיילים</a>
        <a href="${prefix}guide.html#TG_6">שלב 6: ויזות</a>
        <a href="${prefix}guide.html#TG_7">שלב 7: חיסונים</a>
        <a href="${prefix}guide.html#TG_8">שלב 8: ביטוח נסיעות</a>
        <a href="${prefix}guide.html#TG_9">שלב 9: חברים מחלצים</a>
        <a href="${prefix}guide.html#TG_10">שלב 10: מסמכים</a>
        <a href="${prefix}guide.html#TG_11">שלב 11: אפליקציות לטיול</a>
        <a href="${prefix}guide.html#TG_12">שלב 12: ציוד</a>
        <a href="${prefix}guide.html#TG_13">שלב 13: הזמנת סים</a>
        <a href="${prefix}guide.html#TG_14">שלב 14: כרטיס טיסה פיקטיבי</a>
        <a href="${prefix}guide.html#TG_15">שלב 15: הזמנת טיסה</a>
        <a href="${prefix}guide.html#TG_16">שלב 16: מקום לינה ראשון</a>
        <a href="${prefix}guide.html#TG_17">שלב 17: ביטוח לאומי</a>
      </nav>
    </div>
    <div class="sh-social">
      <a href="https://www.facebook.com/share/14hoGSftwcy/" target="_blank">📘</a>
      <a href="https://www.instagram.com/the_smart_traveler_il" target="_blank">📷</a>
      <a href="https://www.tiktok.com/@the_smart_traveller" target="_blank">🎵</a>
    </div>
  `;

  document.body.insertBefore(overlay, document.body.firstChild);
  document.body.insertBefore(panel, document.body.firstChild);

  // Float buttons
  var floatBtns = document.createElement('div');
  floatBtns.className = 'sh-float-btns';
  floatBtns.innerHTML = `
    <a href="https://wa.me/972523960215" target="_blank" class="sh-float-btn sh-float-wa">💬</a>
    <a href="https://www.instagram.com/the_smart_traveler_il" target="_blank" class="sh-float-btn sh-float-ig">📷</a>
    <a href="https://www.tiktok.com/@the_smart_traveller" target="_blank" class="sh-float-btn sh-float-tt">🎵</a>
  `;
  var floatAcc = document.createElement('button');
  floatAcc.className = 'sh-float-acc';
  floatAcc.title = 'נגישות';
  floatAcc.innerHTML = '♿';
  floatAcc.onclick = function() {
    document.body.style.fontSize = document.body.style.fontSize === '120%' ? '' : '120%';
  };
  document.body.appendChild(floatBtns);
  document.body.appendChild(floatAcc);

  // Cart count from localStorage
  function updateCart() {
    try {
      var cart = JSON.parse(localStorage.getItem('smartCart') || '[]');
      var count = cart.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
      var total = cart.reduce(function(s, i) { return s + (i.price || 0) * (i.qty || 1); }, 0);
      var el = document.getElementById('sh-cart-count');
      var tel = document.getElementById('sh-cart-total');
      if (el) el.textContent = count;
      if (tel) tel.textContent = total.toFixed(0);
    } catch(e) {}
  }
  updateCart();
  window.addEventListener('storage', updateCart);

  // Menu logic
  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('sh-sub-panel').classList.remove('open');
  }
  document.getElementById('sh-hamburger').addEventListener('click', openPanel);
  document.getElementById('sh-close').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.getElementById('sh-guide-btn').addEventListener('click', function() {
    document.getElementById('sh-sub-panel').classList.add('open');
  });
  document.getElementById('sh-back-btn').addEventListener('click', function() {
    document.getElementById('sh-sub-panel').classList.remove('open');
  });
})();
