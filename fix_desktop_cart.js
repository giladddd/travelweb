/**
 * fix_desktop_cart.js
 * Adds localStorage cart to smart_traveller_home.html on the desktop.
 * Also creates order-summary.html on the desktop.
 */
const fs = require('fs');
const path = require('path');

const desktopDir = 'C:/Users/gilad/OneDrive/שולחן העבודה';
const mainFile = desktopDir + '/smart_traveller_home.html';

// ── 1. Patch main file ──────────────────────────────────────────────────────

let html = fs.readFileSync(mainFile, 'utf8');
console.log('Desktop file size:', Math.round(html.length / 1024), 'KB');

// (a) Fix cart link: change live-site URL → local order-summary.html
const liveCartRe = /href="https:\/\/the-smart-traveller\.com\/%d7%a1%d7%99%d7%9b%d7%95%d7%9d-%d7%94%d7%96%d7%9e%d7%a0%d7%94\/"[^>]*class="menu-link">לעגלה שלי<\/a>/g;
const hasLiveCart = html.match(liveCartRe);
console.log('Live cart links found:', hasLiveCart ? hasLiveCart.length : 0);

html = html.replace(liveCartRe,
  'href="order-summary.html" class="menu-link">לעגלה שלי ' +
  '<span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;align-items:center;justify-content:center;margin-right:4px;vertical-align:middle;"></span></a>'
);

// Also catch alternate encoding
html = html.replace(
  /href="https:\/\/the-smart-traveller\.com\/[^"]*סיכום[^"]*"[^>]*class="menu-link">לעגלה שלי<\/a>/g,
  'href="order-summary.html" class="menu-link">לעגלה שלי ' +
  '<span class="st-cart-badge" style="display:none;background:#F97316;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;align-items:center;justify-content:center;margin-right:4px;vertical-align:middle;"></span></a>'
);

// (b) Skip if already has cart script
if (html.includes('ST_CART_INLINE')) {
  console.log('Cart script already present, skipping JS injection.');
} else {
  // (b) Inject inline cart JS before </body>
  const cartJS = `
<script>
/* ST_CART_INLINE — localStorage cart for desktop file */
(function(){
  var CART_KEY='st_cart';
  function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch(e){return[];}}
  function saveCart(c){try{localStorage.setItem(CART_KEY,JSON.stringify(c));}catch(e){}}
  function getCount(){return getCart().reduce(function(n,it){return n+(it.qty||1);},0);}
  function updateBadges(){
    var count=getCount();
    document.querySelectorAll('.st-cart-badge').forEach(function(el){
      el.textContent=count;
      el.style.display=count>0?'inline-flex':'none';
    });
  }
  function addItem(id,name,price,image){
    var cart=getCart(),found=false;
    cart.forEach(function(it){if(it.id===id){it.qty=(it.qty||1)+1;found=true;}});
    if(!found) cart.push({id:id,name:name,price:price,image:image,qty:1});
    saveCart(cart);
    updateBadges();
  }
  function getInfo(btn){
    var id=(btn.getAttribute('data-product_id')||'').trim();
    var card=btn.closest('.uc_overlay_image_carousel,.uc_post_grid_item,[class*="uc_woocommerce"]')||btn.parentElement;
    var walk=card;
    for(var i=0;i<6&&walk;i++){
      var t=walk.querySelector('.uc_post_title a,.uc_post_title,.product_title');
      if(t){card=walk;break;}
      walk=walk.parentElement;
    }
    var nameEl=card&&(card.querySelector('.uc_post_title a')||card.querySelector('.uc_post_title'));
    var name=nameEl?nameEl.textContent.trim():('מוצר #'+id);
    var priceEl=card&&card.querySelector('.woocommerce-Price-amount');
    var price=priceEl?priceEl.textContent.trim():'';
    var imgEl=card&&card.querySelector('img');
    var image=imgEl?(imgEl.src||''):'';
    return {id:id,name:name,price:price,image:image};
  }
  // Intercept "הוסיפו לחבילה / להזמנה" buttons
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.uc-button-addcart');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var info=getInfo(btn);
    addItem(info.id,info.name,info.price,info.image);
    // Visual feedback
    var wrapper=btn.querySelector('.ue-inner-btn-wrapper');
    var labelSpan=null;
    if(wrapper){
      wrapper.querySelectorAll('span').forEach(function(s){
        if(!s.querySelector('i,svg')&&s.textContent.trim()) labelSpan=s;
      });
    }
    if(labelSpan){
      var orig=labelSpan.textContent;
      labelSpan.textContent='✓ נוסף לסל';
      btn.style.cssText+=';background:#16a34a!important;';
      setTimeout(function(){
        labelSpan.textContent=orig;
        btn.style.background='';
        window.location.href='order-summary.html';
      },800);
    } else {
      window.location.href='order-summary.html';
    }
  },true);
  // Init
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
</script>`;

  const lastBody = html.lastIndexOf('</body>');
  if (lastBody > 0) {
    html = html.substring(0, lastBody) + cartJS + '\n</body>' + html.substring(lastBody + 7);
    console.log('Cart JS injected before </body>');
  }
}

fs.writeFileSync(mainFile, html, 'utf8');
console.log('Main file updated. Size:', Math.round(html.length / 1024), 'KB');

// ── 2. Create order-summary.html on desktop ─────────────────────────────────

const CURRENCY = '₪';
const orderSummaryHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he-IL">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>סיכום הזמנה – המטייל החכם</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1526; color: #e2e8f0; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; min-height: 100vh; }
  .header { background: #0f172b; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .header-logo { color: #F97316; font-size: 18px; font-weight: 800; text-decoration: none; }
  .header-back { color: #94a3b8; font-size: 14px; text-decoration: none; padding: 8px 16px; border: 1px solid #334155; border-radius: 6px; }
  .header-back:hover { color: #e2e8f0; border-color: #475569; }
  .container { max-width: 800px; margin: 0 auto; padding: 32px 20px; }
  h1 { font-size: 22px; font-weight: 800; color: #F97316; margin-bottom: 24px; }
  #cart-wrapper { background: #0f172b; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 12px 16px; color: #64748b; font-size: 13px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.07); text-align: right; }
  td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .product-img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; }
  .product-name { color: #e2e8f0; font-size: 15px; }
  .product-price { color: #94a3b8; font-size: 14px; }
  .qty-box { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 28px; height: 28px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; border-radius: 4px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .qty-num { min-width: 20px; text-align: center; color: #e2e8f0; font-size: 15px; }
  .line-total { color: #F97316; font-weight: 700; font-size: 15px; }
  .remove-btn { background: none; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 4px; }
  .remove-btn:hover { color: #ef4444; }
  .summary-bar { margin-top: 20px; padding: 18px 20px; background: #0f172b; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .total-label { color: #94a3b8; font-size: 15px; }
  .total-price { color: #F97316; font-size: 20px; font-weight: 800; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; margin-top: 14px; }
  .btn-back { padding: 10px 20px; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; text-decoration: none; font-size: 14px; }
  .btn-clear { padding: 10px 20px; border: 1px solid #ef4444; border-radius: 6px; background: transparent; color: #ef4444; font-size: 14px; cursor: pointer; }
  .empty-msg { text-align: center; padding: 48px 24px; color: #64748b; font-size: 16px; }
  .empty-link { display: inline-block; margin-top: 16px; padding: 12px 28px; background: #F97316; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<div class="header">
  <a href="smart_traveller_home.html" class="header-back">← חזור לאתר</a>
  <a href="smart_traveller_home.html" class="header-logo">המטייל החכם</a>
</div>
<div class="container">
  <h1>🛒 סיכום הזמנה שלכם</h1>
  <div id="cart-wrapper"></div>
</div>
<script>
var CURRENCY='${CURRENCY}';
function getCart(){try{return JSON.parse(localStorage.getItem('st_cart'))||[];}catch(e){return[];}}
function saveCart(c){try{localStorage.setItem('st_cart',JSON.stringify(c));}catch(e){}}
function priceNum(s){return parseFloat((s||'').replace(/[^\\d.]/g,''))||0;}
function render(){
  var cart=getCart();
  var wrap=document.getElementById('cart-wrapper');
  if(!cart.length){
    wrap.innerHTML='<div class="empty-msg">הסל שלך ריק 🎒<br><a href="smart_traveller_home.html" class="empty-link">חזור לחנות</a></div>';
    return;
  }
  var totalQty=0,totalPrice=0;
  cart.forEach(function(it){totalQty+=it.qty||1;totalPrice+=priceNum(it.price)*(it.qty||1);});
  var rows=cart.map(function(it){
    var img=it.image?'<img src="'+it.image+'" class="product-img">':'<div style="width:56px;height:56px;background:#1e293b;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>';
    var line=(priceNum(it.price)*(it.qty||1)).toFixed(2);
    return '<tr>'+
      '<td>'+img+'</td>'+
      '<td class="product-name">'+it.name+'</td>'+
      '<td class="product-price">'+it.price+'</td>'+
      '<td><div class="qty-box">'+
        '<button class="qty-btn" onclick="changeQty(\''+it.id+'\',-1)">−</button>'+
        '<span class="qty-num">'+(it.qty||1)+'</span>'+
        '<button class="qty-btn" onclick="changeQty(\''+it.id+'\',1)">+</button>'+
      '</div></td>'+
      '<td class="line-total">'+line+' '+CURRENCY+'</td>'+
      '<td><button class="remove-btn" onclick="removeItem(\''+it.id+'\')">✕</button></td>'+
    '</tr>';
  }).join('');
  wrap.innerHTML=
    '<table><thead><tr><th></th><th>מוצר</th><th>מחיר</th><th>כמות</th><th>סה"כ</th><th></th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table>'+
    '<div class="summary-bar">'+
      '<span class="total-label">פריטים: <strong style="color:#e2e8f0">'+totalQty+'</strong></span>'+
      '<span class="total-price">סה"כ: '+totalPrice.toFixed(2)+' '+CURRENCY+'</span>'+
    '</div>'+
    '<div class="actions">'+
      '<a href="smart_traveller_home.html" class="btn-back">המשך קנייה</a>'+
      '<button class="btn-clear" onclick="clearCart()">רוקן סל</button>'+
    '</div>';
}
function removeItem(id){saveCart(getCart().filter(function(it){return it.id!==id;}));render();}
function changeQty(id,d){var c=getCart();c.forEach(function(it){if(it.id===id)it.qty=Math.max(1,(it.qty||1)+d);});saveCart(c);render();}
function clearCart(){saveCart([]);render();}
document.addEventListener('DOMContentLoaded',render);
</script>
</body>
</html>`;

fs.writeFileSync(desktopDir + '/order-summary.html', orderSummaryHtml, 'utf8');
console.log('order-summary.html created on desktop');
console.log('Done!');
