/**
 * המטייל החכם — הזמנות + המטרות לטיול + תזכורות "דוח מצב"
 * מבוסס על סקריפט ההזמנות הקיים: אותו גיליון, אותן לשוניות ועמודות, אותו עיצוב מייל.
 * תוספות: קוד המדריך במייל ללקוח, המטרות לטיול, הרשמה לתזכורות, שליחה יומית, הפסקת תזכורות.
 */

var SHEET_ID = '1CqinHTnLw4cmNHi4UWpLRBDbUFLtow354m5i5351zKo';
var NOTIFY_EMAIL = 'THESMARTTRAVEL3@GMAIL.COM';

var CONFIG = {
  BRAND: 'המטייל החכם',
  GUIDE_CODE: '1000',
  GUIDE_URL: 'https://the-smart-traveller.com/guide.html',
  WHATSAPP: '972523960215',
  DELIVERY_COST: 39,
  REMINDER_SUBJECT: 'המטרות שלי לטיול',
  REMINDER_MONTHS: 12,
  DEFAULT_REMINDER_MONTHS: 6,
  REMINDER_HOUR: 9
};

var MAIN_HEADERS = ['מספר הזמנה','תאריך הזמנה','שם','טלפון','מייל','עיר','רחוב','מספר','תאריך טיסה','הערות','דרך מי הגיע','פריטים','סה"כ','סטטוס','טלפון נוסף','המטרות לטיול','תזכורות'];
var RETURN_HEADERS = ['מספר הזמנה','תאריך הזמנה','שם','טלפון','מייל','תאריך טיסה','חודשי השכרה','תאריך החזרה','פריטים להשכרה','סה"כ','סטטוס'];
var REMINDER_HEADERS = ['מזהה','מספר הזמנה','נוצר','שם','מייל','טלפון','תדירות','תאריך טיסה','תאריך סיום','התזכורת הבאה','נשלחו','סטטוס','המטרות'];
var R = { id: 0, order: 1, created: 2, name: 3, email: 4, phone: 5, freq: 6, flight: 7, end: 8, next: 9, sent: 10, status: 11, goals: 12 };

var FREQ_LABELS = { week: 'כל שבוע', month: 'כל חודש', '2months': 'כל חודשיים' };

var QUESTIONS = [
  'איך אני מרגיש עכשיו, מ-1 עד 10? ולמה?',
  'מה היה הרגע הכי טוב בתקופה האחרונה?',
  'האם אני מתקרב למטרות שלי? מה עוזר לי ומה מפריע?',
  'איך אני מתקדם באתגר שבחרתי? מה השיעור שלמדתי?',
  'מה אני רוצה לשנות או לנסות בתקופה הקרובה?',
  'מה גיליתי על עצמי?'
];

/* ===================== התקנה (מריצים פעם אחת) ===================== */

function setup() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  ['הזמנות', 'משלוחים', 'איסוף עצמי'].forEach(function (n) { ensureHeaders(getOrCreateSheet(ss, n, MAIN_HEADERS), MAIN_HEADERS); });
  getOrCreateSheet(ss, 'החזרות', RETURN_HEADERS);
  var rs = getOrCreateSheet(ss, 'תזכורות', REMINDER_HEADERS);
  rs.getRange('A:M').setNumberFormat('@');

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDueReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDueReminders').timeBased().everyDays(1).atHour(CONFIG.REMINDER_HOUR).create();
  Logger.log('מוכן ✓ נוספה לשונית "תזכורות" והרצה יומית בשעה ' + CONFIG.REMINDER_HOUR + ':00');
}

/* ===================== קבלת הזמנה מהאתר ===================== */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    data.orderId = generateId();
    data.reminder = registerReminder(data);
    writeOrder(data);
    sendEmailToOwner(data);
    if (data.email) sendEmailToCustomer(data);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    Logger.log(err);
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/* ===================== הפסקת תזכורות (הקישור במייל) ===================== */

function doGet(e) {
  var token = e && e.parameter && e.parameter.unsub;
  if (!token) return page('המטייל החכם', '<p>🌍</p>');
  if (e.parameter.confirm !== '1') {
    var url = ScriptApp.getService().getUrl() + '?unsub=' + encodeURIComponent(token) + '&confirm=1';
    return page('הפסקת תזכורות', '<h2>להפסיק את התזכורות לדוח מצב?</h2>' +
      '<a href="' + url + '" target="_top" style="display:inline-block;margin-top:12px;background:#F97316;color:#fff;font-weight:700;padding:12px 26px;border-radius:50px;text-decoration:none">כן, הפסיקו את התזכורות</a>');
  }
  var sheet = getOrCreateSheet(SpreadsheetApp.openById(SHEET_ID), 'תזכורות', REMINDER_HEADERS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][R.id]) === String(token)) {
      sheet.getRange(i + 1, R.status + 1).setValue('הופסק');
      return page('הוסרתם מהתזכורות', '<h2>✓ הוסרתם מהתזכורות</h2><p>לא נשלח לכם יותר תזכורות לדוח מצב.<br>טיול מהנה! 🌍</p>');
    }
  }
  return page('לא נמצא', '<h2>הקישור לא נמצא</h2><p>ייתכן שכבר הוסרתם מהתזכורות.</p>');
}

/* ===================== שליחה יומית של דוחות מצב ===================== */

function sendDueReminders() {
  var sheet = getOrCreateSheet(SpreadsheetApp.openById(SHEET_ID), 'תזכורות', REMINDER_HEADERS);
  var rows = sheet.getDataRange().getValues();
  var today = todayStr();

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[R.status] !== 'פעיל') continue;
    var next = String(r[R.next]), end = String(r[R.end]);
    if (!next || next > today) continue;
    if (next > end) { sheet.getRange(i + 1, R.status + 1).setValue('הסתיים'); continue; }
    if (MailApp.getRemainingDailyQuota() < 1) { Logger.log('נגמרה המכסה היומית — ימשיך מחר'); return; }

    var sent = Number(r[R.sent] || 0) + 1;
    sendReminderEmail({ id: r[R.id], name: r[R.name], email: r[R.email], end: end, goals: r[R.goals], number: sent });

    var newNext = nextDate(next, r[R.freq]);
    sheet.getRange(i + 1, R.sent + 1).setValue(sent);
    sheet.getRange(i + 1, R.next + 1).setValue(newNext);
    if (newNext > end) sheet.getRange(i + 1, R.status + 1).setValue('הסתיים');
  }
}

/* ===================== גיליון ===================== */

function generateId() {
  return 'HM-' + Math.floor(100000 + Math.random() * 900000);
}

function getOrCreateSheet(ss, name, headers) {
  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(headers);
    s.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#0F172B').setFontColor('#ffffff');
  } else if (s.getLastRow() === 0) {
    s.appendRow(headers);
    s.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#0F172B').setFontColor('#ffffff');
  }
  return s;
}

function ensureHeaders(s, headers) {
  var current = s.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    if (!current[c]) {
      s.getRange(1, c + 1).setValue(headers[c]).setFontWeight('bold').setBackground('#0F172B').setFontColor('#ffffff');
    }
  }
}

function calcReturnDate(flightDate, rentalMonths) {
  try {
    var d = new Date(flightDate);
    d.setMonth(d.getMonth() + rentalMonths);
    d.setDate(d.getDate() + 14);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  } catch(e) { return ''; }
}

function sortedCart(d) {
  var cart = d.cart || [];
  var coaching = cart.filter(function(i){ return i.id && i.id.indexOf('coaching') !== -1; });
  var products = cart.filter(function(i){ return !i.id || i.id.indexOf('coaching') === -1; });
  return coaching.concat(products);
}

function orderTotal(d) {
  var total = (d.cart || []).reduce(function(s,i){ return s+(i.price||0)*(i.qty||1); }, 0);
  if (d.deliveryType === 'delivery') total += CONFIG.DELIVERY_COST;
  return total;
}

function writeOrder(d) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd.M.yyyy, HH:mm');
  var cart = d.cart || [];

  var itemsList = sortedCart(d).map(function(i, idx) {
    var line = (idx+1) + '. ' + i.name;
    if (i.mode === 'rent' && i.duration) line += ' (' + i.duration + ' חודשים)';
    line += ' | כמות: ' + (i.qty||1);
    line += ' | ' + (i.mode==='rent' ? 'השכרה' : i.mode==='free' ? 'חינם' : 'קנייה');
    if (i.price > 0) line += ' | ₪' + ((i.price||0)*(i.qty||1));
    return line;
  }).join('\n');

  var goals = d.tripGoals;
  var reminderStr = d.reminder ? FREQ_LABELS[d.reminder.freq] + ' עד ' + fmtDate(d.reminder.end) : '';
  var statusStr = d.deliveryType === 'delivery' ? 'ממתין לשליחה' : 'ממתין לאיסוף';
  var mainRow = [d.orderId, dateStr, d.name||'', d.phone||'', d.email||'', d.city||'', d.street||'', d.streetNumber||'',
    d.flightDate||'', d.notes||'', d.referral||'', itemsList, orderTotal(d), statusStr,
    d.phone2||'', goals ? goals.summary||'' : '', reminderStr];

  getOrCreateSheet(ss, 'הזמנות', MAIN_HEADERS).appendRow(mainRow);
  if (d.deliveryType === 'delivery') {
    getOrCreateSheet(ss, 'משלוחים', MAIN_HEADERS).appendRow(mainRow);
  } else {
    getOrCreateSheet(ss, 'איסוף עצמי', MAIN_HEADERS).appendRow(mainRow);
  }

  var rentalItems = cart.filter(function(i){ return i.mode === 'rent'; });
  if (rentalItems.length > 0) {
    var maxMonths = Math.max.apply(null, rentalItems.map(function(i){ return parseInt(i.duration)||1; }));
    var returnDate = calcReturnDate(d.flightDate, maxMonths);
    var rentalStr = rentalItems.map(function(i){ return i.name + ' (' + (i.duration||1) + ' חודשים) ×' + (i.qty||1); }).join(' | ');
    var rentalTotal = rentalItems.reduce(function(s,i){ return s+(i.price||0)*(i.qty||1); }, 0);
    getOrCreateSheet(ss, 'החזרות', RETURN_HEADERS).appendRow([d.orderId, dateStr, d.name||'', d.phone||'', d.email||'', d.flightDate||'', maxMonths, returnDate, rentalStr, rentalTotal, 'בהשכרה']);
  }
}

function rentalMonths(d) {
  var rent = (d.cart || []).filter(function(i){ return i.mode === 'rent'; });
  if (!rent.length) return 0;
  return Math.max.apply(null, rent.map(function(i){ return parseInt(i.duration) || 1; }));
}

function registerReminder(d) {
  var g = d.tripGoals;
  var flightRaw = d.flightDate || g && g.flightDate;
  if (!g || !g.reminders || !d.email || !/^\d{4}-\d{2}-\d{2}/.test(String(flightRaw || '')) || !FREQ_LABELS[g.frequency]) return null;
  var flight = String(flightRaw).slice(0, 10);
  var months = Math.min(rentalMonths(d) || CONFIG.DEFAULT_REMINDER_MONTHS, CONFIG.REMINDER_MONTHS);
  var end = addMonths(flight, months);
  var next = nextDate(flight, g.frequency);
  var reminder = { id: Utilities.getUuid(), freq: g.frequency, end: end, next: next };
  var sheet = getOrCreateSheet(SpreadsheetApp.openById(SHEET_ID), 'תזכורות', REMINDER_HEADERS);
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, REMINDER_HEADERS.length).setNumberFormat('@').setValues([[
    reminder.id, d.orderId, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd.M.yyyy, HH:mm'),
    d.name||'', d.email, d.phone||'', g.frequency, flight, end, next, '0',
    next > end ? 'הסתיים' : 'פעיל', g.summary||''
  ]]);
  return reminder;
}

/* ===================== מיילים ===================== */

function buildEmailHtml(d, isOwner) {
  var delivery = d.deliveryType === 'delivery';
  var total = orderTotal(d);

  var itemRows = sortedCart(d).map(function(i) {
    var typeLabel = i.mode === 'rent'
      ? '🎒 השכרה ' + (i.duration||1) + ' חודשים'
      : i.mode === 'free' ? '🎁 חינם' : '🛒 קנייה';
    var priceLabel = i.price > 0 ? '₪' + ((i.price||0)*(i.qty||1)) : 'חינם';
    var bg = i.id && i.id.indexOf('coaching') !== -1 ? '#FFF7ED' : '#ffffff';
    return '<tr style="background:' + bg + ';border-bottom:1px solid #F1F5F9">' +
      '<td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:600;color:#0F172B">' +
        esc(i.name) + (i.qty > 1 ? ' <span style="color:#64748B;font-weight:400">×' + esc(i.qty) + '</span>' : '') +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;font-size:13px;color:#64748B">' + typeLabel + '</td>' +
      '<td style="padding:12px 16px;text-align:left;font-size:15px;font-weight:700;color:#F97316">' + priceLabel + '</td>' +
    '</tr>';
  }).join('');

  if (delivery) {
    itemRows += '<tr style="background:#F8FAFC;border-bottom:1px solid #F1F5F9">' +
      '<td style="padding:12px 16px;text-align:right;font-size:14px;color:#64748B">🚚 משלוח עד הבית</td>' +
      '<td style="padding:12px 16px;text-align:center;font-size:13px;color:#64748B">שירות</td>' +
      '<td style="padding:12px 16px;text-align:left;font-size:15px;font-weight:700;color:#F97316">₪' + CONFIG.DELIVERY_COST + '</td>' +
    '</tr>';
  }

  var deliveryInfo = delivery
    ? '🚚 משלוח — ' + esc(d.city) + ', ' + esc(d.street) + ' ' + esc(d.streetNumber)
    : '🏪 איסוף עצמי';

  var header = isOwner
    ? '<div style="background:#0F172B;padding:28px 32px">' +
        '<div style="font-size:22px;font-weight:800;color:#F97316;margin-bottom:4px">🛒 הזמנה חדשה!</div>' +
        '<div style="font-size:14px;color:#94A3B8">המטייל החכם — מערכת הזמנות · ' + esc(d.orderId) + '</div>' +
      '</div>'
    : '<div style="background:#0F172B;padding:28px 32px">' +
        '<div style="font-size:22px;font-weight:800;color:#22C55E;margin-bottom:4px">✅ קיבלנו את ההזמנה שלך!</div>' +
        '<div style="font-size:14px;color:#94A3B8">היי ' + esc(d.name) + ', תודה שבחרת במטייל החכם 🎒</div>' +
      '</div>';

  var guideBox = isOwner ? '' :
    '<div style="background:#0F172B;border-radius:14px;padding:18px;text-align:center;margin-bottom:24px">' +
      '<div style="font-size:14px;color:#CBD5E1">🎁 הקוד שלך למדריך המורחב</div>' +
      '<div style="font-size:34px;font-weight:900;letter-spacing:4px;color:#FB923C;margin:6px 0">' + esc(CONFIG.GUIDE_CODE) + '</div>' +
      '<a href="' + CONFIG.GUIDE_URL + '" style="color:#ffffff;font-weight:700;font-size:14px">לפתיחת המדריך ←</a>' +
    '</div>';

  var details =
    '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
      row2col('🧾 מספר הזמנה', d.orderId) +
      row2col('👤 שם', d.name) +
      row2col('📞 טלפון', d.phone) +
      (d.phone2 ? row2col('📞 טלפון לשליח', d.phone2) : '') +
      (d.email ? row2col('📧 מייל', d.email) : '') +
      row2col('✈️ תאריך טיסה', d.flightDate) +
      row2colHtml('📦 משלוח', deliveryInfo) +
      (d.referral ? row2col('📣 הגיע דרך', d.referral) : '') +
      (d.notes ? row2col('📝 הערות', d.notes) : '') +
    '</table>';

  var goals = d.tripGoals ? goalsHtml(d.tripGoals, !isOwner) : '';
  var reminderNote = d.reminder
    ? '<div style="margin-top:16px;padding:12px 16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;font-size:14px;color:#166534">' +
        '⏰ ' + (isOwner ? 'נרשם/ה לתזכורות דוח מצב' : 'נזכיר לך במייל לעשות דוח מצב') + ' <b>' + FREQ_LABELS[d.reminder.freq] + '</b>' +
        ' — הראשונה ב-' + fmtDate(d.reminder.next) + ', עד ' + fmtDate(d.reminder.end) + '.' +
        (isOwner ? '' : ' כל התזכורות יגיעו במייל בנושא "' + esc(CONFIG.REMINDER_SUBJECT) + '".') +
      '</div>'
    : '';

  var footer = isOwner
    ? '<p style="margin:0;font-size:12px;color:#94A3B8">הזמנה זו נשלחה אוטומטית ממערכת המטייל החכם</p>'
    : '<p style="margin:0;font-size:13px;color:#64748B">נחזור אליך בקרוב לתיאום 😊<br>לכל שאלה: <a href="https://wa.me/' + CONFIG.WHATSAPP + '" style="color:#F97316">וואטסאפ</a></p>' +
      (d.reminder ? unsubLine(d.reminder) : '');

  return '<!DOCTYPE html><html dir="rtl" lang="he"><body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,sans-serif">' +
    '<div style="max-width:580px;margin:32px auto;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">' +
      header +
      '<div style="background:#ffffff;padding:28px 32px">' +
        guideBox +
        details +
        '<div style="font-size:13px;font-weight:700;color:#64748B;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">פירוט הזמנה</div>' +
        '<table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">' +
          '<thead><tr style="background:#F8FAFC">' +
            '<th style="padding:10px 16px;text-align:right;font-size:12px;color:#64748B;font-weight:700">פריט</th>' +
            '<th style="padding:10px 16px;text-align:center;font-size:12px;color:#64748B;font-weight:700">סוג</th>' +
            '<th style="padding:10px 16px;text-align:left;font-size:12px;color:#64748B;font-weight:700">מחיר</th>' +
          '</tr></thead>' +
          '<tbody>' + itemRows + '</tbody>' +
        '</table>' +
        '<div style="margin-top:20px;padding:16px 20px;background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-radius:12px;border:1px solid #FED7AA;display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:15px;font-weight:700;color:#92400E">סה"כ לתשלום</span>' +
          '<span style="font-size:24px;font-weight:900;color:#EA580C">₪' + total + '</span>' +
        '</div>' +
        goals +
        reminderNote +
      '</div>' +
      '<div style="background:#F8FAFC;padding:16px 32px;text-align:center">' + footer + '</div>' +
    '</div></body></html>';
}

function goalsHtml(g, forCustomer) {
  return '<div style="margin-top:24px;font-size:13px;font-weight:700;color:#64748B;margin-bottom:10px">' +
      (forCustomer ? '🎯 המטרות שלך לטיול' : '🎯 המטרות של המטייל') + '</div>' +
    '<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:14px 16px;font-size:14px;color:#0F172B;white-space:pre-wrap;line-height:1.7">' +
      esc(g.summary || '') + '</div>' +
    (forCustomer ? questionsHtml() : '');
}

function questionsHtml() {
  return '<div style="margin-top:18px;font-size:13px;font-weight:700;color:#64748B;margin-bottom:6px">✍️ תרגיל הכתיבה לדוח המצב</div>' +
    '<ol style="margin:0;padding-right:20px;font-size:14px;color:#334155;line-height:1.9">' +
    QUESTIONS.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>';
}

function unsubLine(reminder) {
  var url = ScriptApp.getService().getUrl() + '?unsub=' + encodeURIComponent(reminder.id);
  return '<p style="margin:12px 0 0;font-size:11px;color:#94A3B8">התזכורות נעצרות אוטומטית ב-' + fmtDate(reminder.end) +
    ' · <a href="' + url + '" style="color:#94A3B8">להפסקת התזכורות</a></p>';
}

function row2col(label, value) {
  return row2colHtml(label, esc(value));
}

function row2colHtml(label, html) {
  return '<tr>' +
    '<td style="padding:8px 0;color:#64748B;font-size:13px;width:130px;vertical-align:top">' + label + '</td>' +
    '<td style="padding:8px 0;font-size:14px;font-weight:600;color:#0F172B">' + html + '</td>' +
  '</tr>';
}

function sendEmailToOwner(d) {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '🛒 הזמנה חדשה — ' + (d.name||'לקוח') + ' | המטייל החכם',
    htmlBody: buildEmailHtml(d, true),
    replyTo: d.email || NOTIFY_EMAIL
  });
}

function sendEmailToCustomer(d) {
  if (!d.email) return;
  MailApp.sendEmail({
    to: d.email,
    subject: d.tripGoals ? '✅ קיבלנו את ההזמנה שלך + ' + CONFIG.REMINDER_SUBJECT + ' — המטייל החכם' : '✅ קיבלנו את ההזמנה שלך — המטייל החכם',
    htmlBody: buildEmailHtml(d, false),
    name: CONFIG.BRAND,
    replyTo: NOTIFY_EMAIL
  });
}

function sendReminderEmail(r) {
  var html = '<!DOCTYPE html><html dir="rtl" lang="he"><body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,sans-serif">' +
    '<div style="max-width:580px;margin:32px auto;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">' +
      '<div style="background:#0F172B;padding:28px 32px">' +
        '<div style="font-size:22px;font-weight:800;color:#F97316;margin-bottom:4px">✍️ דוח מצב #' + r.number + '</div>' +
        '<div style="font-size:14px;color:#94A3B8">היי ' + esc(r.name) + ', הגיע הזמן לעצור לכמה דקות 🌍</div>' +
      '</div>' +
      '<div style="background:#ffffff;padding:28px 32px">' +
        '<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7">קראו את המטרות שהגדרתם לפני הטיול, וענו על השאלות. מומלץ לכתוב את התשובות כתשובה למייל הזה — ככה כל המסע נשמר במקום אחד.</p>' +
        '<div style="font-size:13px;font-weight:700;color:#64748B;margin-bottom:10px">🎯 המטרות שלך לטיול</div>' +
        '<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:14px 16px;font-size:14px;color:#0F172B;white-space:pre-wrap;line-height:1.7">' + esc(r.goals) + '</div>' +
        questionsHtml() +
        '<div style="margin-top:18px;padding:12px 16px;background:#F8FAFC;border-radius:12px;font-size:14px;color:#475569;line-height:1.7">🧭 <b>בדיקת כיוון:</b> מרגישים רחוקים מהמטרות? מספיק שינוי קטן אחד — להאט, להישאר עוד כמה ימים במקום שאוהבים, להתנדב שבוע, או לטייל כמה ימים לבד.</div>' +
      '</div>' +
      '<div style="background:#F8FAFC;padding:16px 32px;text-align:center">' +
        '<p style="margin:0;font-size:13px;color:#64748B">טיול מהנה! 🌍<br>' + CONFIG.BRAND + '</p>' +
        unsubLine({ id: r.id, end: r.end }) +
      '</div>' +
    '</div></body></html>';
  MailApp.sendEmail({
    to: r.email,
    subject: CONFIG.REMINDER_SUBJECT,
    htmlBody: html,
    name: CONFIG.BRAND,
    replyTo: NOTIFY_EMAIL
  });
}

/* ===================== תאריכים ועזר ===================== */

function todayStr() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

function parseDate(s) { var p = String(s).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }

function toStr(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

function addMonths(s, m) {
  var d = parseDate(s);
  var x = new Date(d.getFullYear(), d.getMonth() + m, 1);
  var last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(d.getDate(), last));
  return toStr(x);
}

function nextDate(s, freq) {
  if (freq === 'week') { var d = parseDate(s); d.setDate(d.getDate() + 7); return toStr(d); }
  return addMonths(s, freq === '2months' ? 2 : 1);
}

function fmtDate(s) { var d = parseDate(s); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2); }

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function page(title, body) {
  return HtmlService.createHtmlOutput('<div dir="rtl" style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px">' + body + '</div>')
    .setTitle(title);
}

/* ===================== בדיקות ===================== */

function weeklyTest() {
  var order1 = {
    name: 'בדיקה — משלוח',
    phone: '050-1111111',
    email: NOTIFY_EMAIL,
    flightDate: '2026-11-15',
    deliveryType: 'delivery',
    city: 'תל אביב', street: 'דיזנגוף', streetNumber: '50',
    notes: 'בדיקה אוטומטית',
    referral: 'אינסטגרם',
    cart: [
      {id: 'coaching-plus', name: 'המטייל החכם פלוס', price: 197, qty: 1, mode: 'buy', duration: null},
      {id: 'bag-both-m3', name: "מוצ'ילה + תיק יום", price: 469, qty: 1, mode: 'rent', duration: 3},
      {id: '3920', name: 'מטען נייד 20,000mAh', price: 169, qty: 1, mode: 'buy', duration: null}
    ]
  };

  var order2 = {
    name: 'בדיקה — איסוף עצמי',
    phone: '050-2222222',
    email: '',
    flightDate: '2026-12-01',
    deliveryType: 'pickup',
    city: '', street: '', streetNumber: '',
    notes: '',
    referral: 'חבר',
    cart: [
      {id: 'coaching-checkup', name: "המטייל החכם צ'ק אפ ובטיחות — בחינם", price: 0, qty: 1, mode: 'buy', duration: null},
      {id: '1946', name: 'פנס ראש', price: 50, qty: 1, mode: 'buy', duration: null},
      {id: '3045', name: 'מנעול וכבל', price: 49, qty: 1, mode: 'buy', duration: null}
    ]
  };

  [order1, order2].forEach(function(o) {
    o.orderId = generateId();
    writeOrder(o);
    sendEmailToOwner(o);
    if (o.email) sendEmailToCustomer(o);
  });

  MailApp.sendEmail(NOTIFY_EMAIL, '✅ בדיקה שבועית — Script עובד', 'הסקריפט פעיל. נשלחו 2 הזמנות בדיקה.');
}

/** בדיקה של המטרות והתזכורות: שולח הזמנת בדיקה עם מטרות + דוח מצב #1 למייל העסק */
function testGoalsAndReminder() {
  var flight = addMonths(todayStr(), -1);
  var res = doPost({ postData: { contents: JSON.stringify({
    name: 'בדיקה — מטרות ותזכורות', phone: '050-3333333', email: NOTIFY_EMAIL,
    flightDate: flight, deliveryType: 'pickup', notes: 'בדיקה — להתעלם', referral: 'בדיקה',
    cart: [{ id: 'trip-goals', name: '🎯 המטרות שלי לטיול + דוח מצב במייל כל חודש', price: 0, qty: 1, mode: 'free' }],
    tripGoals: {
      summary: '🎯 המסע שלי — המטרות לטיול\n\nהערכים שלי: 🧗 הרפתקה, 💛 נתינה\nהמטרות שלי:\n• לטפס על הר געש\nהאתגר שלי: לפתוח שיחה עם מישהו חדש כל יום',
      reminders: true, frequency: 'month', flightDate: flight
    }
  }) } });
  Logger.log(res.getContent());
  sendDueReminders();
  Logger.log('נשלחו למייל העסק: הזמנה, אישור ללקוח עם קוד ומטרות, ודוח מצב #1. בגיליון: שורה בהזמנות + בלשונית תזכורות.');
}

/** עוצר תזכורות של הזמנות בדיקה (שם שמתחיל ב'בדיקה') */
function stopTestReminders() {
  var sheet = getOrCreateSheet(SpreadsheetApp.openById(SHEET_ID), 'תזכורות', REMINDER_HEADERS);
  var rows = sheet.getDataRange().getValues();
  var n = 0;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][R.name]).indexOf('בדיקה') === 0 && rows[i][R.status] === 'פעיל') {
      sheet.getRange(i + 1, R.status + 1).setValue('בדיקה — הופסק');
      n++;
    }
  }
  Logger.log('נעצרו ' + n + ' תזכורות בדיקה');
}