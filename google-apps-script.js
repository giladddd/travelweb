// ============================================================
// Smart Traveller — Order Handler
// 1. Append row to Google Sheet
// 2. Email business (THESMARTTRAVEL3@GMAIL.COM)
// 3. Email customer
//
// SETUP:
//   1. Replace SHEET_ID below with your Google Sheet ID
//   2. Deploy → New deployment → Web app
//      Execute as: Me | Who has access: Anyone
//   3. Copy the web app URL into order-summary.html
// ============================================================

var SHEET_ID   = 'YOUR_GOOGLE_SHEET_ID_HERE'; // ← שנה לכאן
var BIZ_EMAIL  = 'THESMARTTRAVEL3@GMAIL.COM';
var SHEET_NAME = 'הזמנות';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // --- Write to Sheet ---
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'תאריך', 'שם', 'טלפון', 'מייל', 'מין',
        'עיר', 'רחוב', 'מספר', 'תאריך טיסה',
        'הערות', 'ביטוח', 'דרך מי הגיע',
        'פריטים', 'סה"כ'
      ]);
    }

    var items = (data.cart || []).map(function(i) {
      return i.name + ' ×' + (i.qty||1) + ' ₪' + i.price;
    }).join(' | ');

    var total = (data.cart || []).reduce(function(s,i){
      return s + (i.price||0)*(i.qty||1);
    }, 0);

    sheet.appendRow([
      new Date().toLocaleString('he-IL'),
      data.name || '', data.phone || '', data.email || '',
      data.gender || '', data.city || '', data.street || '',
      data.streetNumber || '', data.flightDate || '',
      data.notes || '', data.insurance ? 'כן' : 'לא',
      data.referral || '', items, '₪' + total
    ]);

    // --- Email to business ---
    var bizBody = '<div dir="rtl" style="font-family:Arial;font-size:15px">'
      + '<h2>🎒 הזמנה חדשה — המטייל החכם</h2>'
      + '<table style="border-collapse:collapse;width:100%">'
      + row('שם', data.name) + row('טלפון', data.phone)
      + row('מייל', data.email) + row('מין', data.gender)
      + row('עיר', data.city) + row('רחוב', (data.street||'') + ' ' + (data.streetNumber||''))
      + row('תאריך טיסה', data.flightDate) + row('הערות', data.notes)
      + row('ביטוח', data.insurance ? 'כן ✅' : 'לא') + row('הגיע דרך', data.referral)
      + '</table>'
      + '<h3>פריטים:</h3><p>' + items + '</p>'
      + '<h3>סה"כ: ₪' + total + '</h3>'
      + '</div>';

    MailApp.sendEmail({
      to: BIZ_EMAIL,
      subject: '🎒 הזמנה חדשה מ-' + (data.name||'לקוח'),
      htmlBody: bizBody
    });

    // --- Email to customer ---
    if (data.email) {
      var custBody = '<div dir="rtl" style="font-family:Arial;font-size:15px">'
        + '<h2>שלום ' + (data.name||'') + ' 👋</h2>'
        + '<p>קיבלנו את הזמנתך! ניצור איתך קשר בהקדם לסגירת כל הפרטים.</p>'
        + '<h3>הפריטים שבחרת:</h3>'
        + '<p>' + items + '</p>'
        + '<p><strong>סה"כ: ₪' + total + '</strong></p>'
        + '<br><p>בברכה,<br>צוות המטייל החכם 🎒</p>'
        + '</div>';

      MailApp.sendEmail({
        to: data.email,
        subject: 'קיבלנו את הזמנתך — המטייל החכם 🎒',
        htmlBody: custBody
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Smart Traveller Order Handler is running.');
}

function row(label, val) {
  return '<tr><td style="padding:6px 12px;border:1px solid #eee;font-weight:bold">'
    + label + '</td><td style="padding:6px 12px;border:1px solid #eee">'
    + (val||'—') + '</td></tr>';
}
