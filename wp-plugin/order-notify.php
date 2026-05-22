<?php
/**
 * order-notify.php
 * Place in the WordPress root of https://the-smart-traveller.com/
 * Handles order notification emails for The Smart Traveller.
 */

// ── Bootstrap WordPress ──────────────────────────────────────────────────────
define( 'ABSPATH_LOADED', true );
require_once __DIR__ . '/wp-load.php';

// ── CORS – allow any origin (needed for local file:// access) ────────────────
header( 'Access-Control-Allow-Origin: *' );
header( 'Access-Control-Allow-Methods: POST, GET, OPTIONS' );
header( 'Access-Control-Allow-Headers: Content-Type, Accept' );
header( 'Content-Type: application/json; charset=utf-8' );

if ( $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
    http_response_code( 204 );
    exit;
}

// ── Constants ────────────────────────────────────────────────────────────────
const NOTIFY_TO    = 'GILADUNNAGU@GMAIL.COM';
const SITE_NAME    = 'המטייל החכם';
const BRAND_ORANGE = '#F97316';
const BRAND_DARK   = '#0d1526';

// ── Helper: send JSON response ───────────────────────────────────────────────
function json_respond( array $data, int $code = 200 ): void {
    http_response_code( $code );
    echo wp_json_encode( $data, JSON_UNESCAPED_UNICODE );
    exit;
}

// ── Helper: format currency ──────────────────────────────────────────────────
function format_price( $amount, string $currency = 'ILS' ): string {
    $symbol = ( $currency === 'ILS' ) ? '₪' : $currency . ' ';
    return $symbol . number_format( (float) $amount, 2 );
}

// ── Build admin HTML email ───────────────────────────────────────────────────
function build_admin_email( array $order ): string {
    $currency = $order['currency'] ?? 'ILS';
    $rows     = '';

    foreach ( $order['items'] as $item ) {
        $name      = esc_html( $item['name']      ?? '' );
        $qty       = (int)    ( $item['qty']       ?? 1  );
        $price     = format_price( $item['price']     ?? 0, $currency );
        $lineTotal = format_price( $item['line_total'] ?? $item['lineTotal'] ?? 0, $currency );

        $rows .= "
        <tr>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;'>{$name}</td>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;'>{$qty}</td>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:left;'>{$price}</td>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:left;font-weight:600;'>{$lineTotal}</td>
        </tr>";
    }

    $subtotal    = format_price( $order['subtotal']    ?? 0, $currency );
    $shipping    = format_price( $order['shipping']   ?? 0, $currency );
    $grandTotal  = format_price( $order['grand_total'] ?? 0, $currency );
    $discountAmt = (float) ( $order['discount'] ?? 0 );
    $discountRow = '';
    if ( $discountAmt > 0 ) {
        $dStr        = format_price( $discountAmt, $currency );
        $discountRow = "<tr>
                <td style='text-align:left;padding:4px 0;color:#16a34a;font-size:13px;'>הנחת ביטוח 5%:</td>
                <td style='text-align:left;padding:4px 0;color:#16a34a;font-size:13px;font-weight:600;'>-{$dStr}</td>
              </tr>";
    }

    $name  = esc_html( $order['customer_name']  ?? 'לא צוין' );
    $phone = esc_html( $order['customer_phone'] ?? 'לא צוין' );
    $email = esc_html( $order['customer_email'] ?? 'לא צוין' );

    $date = date_i18n( 'd/m/Y H:i' );

    $brandDark   = BRAND_DARK;
    $brandOrange = BRAND_ORANGE;

    return <<<HTML
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>הזמנה חדשה – המטייל החכם</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10);">

        <!-- Header -->
        <tr>
          <td style="background:{$brandDark};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-size:26px;color:{$brandOrange};letter-spacing:1px;">המטייל החכם</h1>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">הזמנה חדשה התקבלה</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <!-- Order meta -->
            <p style="margin:0 0 20px;color:#374151;font-size:14px;">
              <strong>תאריך:</strong> {$date}
            </p>

            <!-- Customer details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:26px;">
              <tr>
                <td style="padding:16px 20px;">
                  <h2 style="margin:0 0 12px;font-size:16px;color:{$brandDark};">פרטי לקוח</h2>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;color:#6b7280;font-size:13px;width:110px;">שם:</td>
                      <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">{$name}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#6b7280;font-size:13px;">טלפון:</td>
                      <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">{$phone}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#6b7280;font-size:13px;">אימייל:</td>
                      <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;">{$email}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Products table -->
            <h2 style="margin:0 0 12px;font-size:16px;color:{$brandDark};">פריטים שהוזמנו</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
              <thead>
                <tr style="background:{$brandDark};">
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:right;">מוצר</th>
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:center;">כמות</th>
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:left;">מחיר יח'</th>
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:left;">סה"כ שורה</th>
                </tr>
              </thead>
              <tbody>
                {$rows}
              </tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="text-align:left;padding:4px 0;color:#6b7280;font-size:13px;">סכום ביניים:</td>
                <td style="text-align:left;padding:4px 0;color:#111827;font-size:13px;">{$subtotal}</td>
              </tr>
              <tr>
                <td style="text-align:left;padding:4px 0;color:#6b7280;font-size:13px;">משלוח:</td>
                <td style="text-align:left;padding:4px 0;color:#111827;font-size:13px;">{$shipping}</td>
              </tr>
              {$discountRow}
              <tr>
                <td colspan="2" style="padding:8px 0 0;"><hr style="border:none;border-top:2px solid #e5e7eb;margin:0;"></td>
              </tr>
              <tr>
                <td style="text-align:left;padding:8px 0 0;color:{$brandDark};font-size:16px;font-weight:700;">סה"כ לתשלום:</td>
                <td style="text-align:left;padding:8px 0 0;color:{$brandOrange};font-size:18px;font-weight:700;">{$grandTotal}</td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">הודעה אוטומטית מ-המטייל החכם • the-smart-traveller.com</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
HTML;
}

// ── Build customer confirmation HTML email ───────────────────────────────────
function build_customer_email( array $order ): string {
    $currency   = $order['currency'] ?? 'ILS';
    $name       = esc_html( $order['customer_name'] ?? 'לקוח יקר' );
    $grandTotal = format_price( $order['grand_total'] ?? 0, $currency );
    $rows       = '';

    foreach ( $order['items'] as $item ) {
        $itemName  = esc_html( $item['name']      ?? '' );
        $qty       = (int) ( $item['qty']          ?? 1  );
        $lineTotal = format_price( $item['line_total'] ?? $item['lineTotal'] ?? 0, $currency );

        $rows .= "
        <tr>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;'>{$itemName}</td>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;'>{$qty}</td>
            <td style='padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:left;font-weight:600;'>{$lineTotal}</td>
        </tr>";
    }

    $brandDark   = BRAND_DARK;
    $brandOrange = BRAND_ORANGE;
    $discountAmt = (float) ( $order['discount'] ?? 0 );
    $custDiscRow = '';
    if ( $discountAmt > 0 ) {
        $dStr        = format_price( $discountAmt, $currency );
        $custDiscRow = "<tr>
                <td style='text-align:left;padding:4px 0;color:#16a34a;font-size:13px;'>הנחת ביטוח 5%:</td>
                <td style='text-align:left;padding:4px 0;color:#16a34a;font-size:13px;font-weight:600;'>-{$dStr}</td>
              </tr>";
    }

    return <<<HTML
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>אישור הזמנה – המטייל החכם</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10);">

        <!-- Header -->
        <tr>
          <td style="background:{$brandDark};padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-size:26px;color:{$brandOrange};letter-spacing:1px;">המטייל החכם</h1>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">אישור הזמנה</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              שלום <strong>{$name}</strong>,<br>
              תודה על הזמנתך! קיבלנו את פרטי ההזמנה ונחזור אליך בהקדם לאישור סופי.
            </p>

            <!-- Products table -->
            <h2 style="margin:0 0 12px;font-size:16px;color:{$brandDark};">סיכום הזמנה</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
              <thead>
                <tr style="background:{$brandDark};">
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:right;">מוצר</th>
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:center;">כמות</th>
                  <th style="padding:10px 14px;color:#ffffff;font-size:13px;text-align:left;">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {$rows}
              </tbody>
            </table>

            <!-- Grand total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              {$custDiscRow}
              <tr>
                <td colspan="2" style="padding:0 0 8px;"><hr style="border:none;border-top:2px solid #e5e7eb;margin:0;"></td>
              </tr>
              <tr>
                <td style="text-align:left;color:{$brandDark};font-size:16px;font-weight:700;">סה"כ לתשלום:</td>
                <td style="text-align:left;color:{$brandOrange};font-size:18px;font-weight:700;">{$grandTotal}</td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;">
              לשאלות ובירורים ניתן ליצור קשר בכל עת.<br>
              צוות המטייל החכם
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">המטייל החכם • <a href="https://the-smart-traveller.com" style="color:{$brandOrange};text-decoration:none;">the-smart-traveller.com</a></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
HTML;
}

// ── Build a test order payload ────────────────────────────────────────────────
function test_order(): array {
    return [
        'customer_name'  => 'ישראל ישראלי',
        'customer_phone' => '050-1234567',
        'customer_email' => NOTIFY_TO,
        'currency'       => 'ILS',
        'subtotal'       => 290,
        'shipping'       => 30,
        'grand_total'    => 320,
        'items'          => [
            [ 'name' => 'כרית נסיעות ארגונומית',  'qty' => 1, 'price' => 149, 'lineTotal' => 149 ],
            [ 'name' => 'מנעול TSA מקצועי',        'qty' => 2, 'price' => 49,  'lineTotal' => 98  ],
            [ 'name' => 'מארגן טיסה פרימיום',      'qty' => 1, 'price' => 43,  'lineTotal' => 43  ],
        ],
    ];
}

// ── Send order emails ─────────────────────────────────────────────────────────
function send_order_emails( array $order ): void {
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . SITE_NAME . ' <no-reply@the-smart-traveller.com>',
    ];

    // Admin email
    $adminSubject = 'הזמנה חדשה התקבלה – ' . SITE_NAME;
    wp_mail( NOTIFY_TO, $adminSubject, build_admin_email( $order ), $headers );

    // Customer confirmation (only if a valid email was provided)
    $customerEmail = sanitize_email( $order['customer_email'] ?? '' );
    if ( $customerEmail && $customerEmail !== NOTIFY_TO ) {
        $customerName    = $order['customer_name'] ?? '';
        $customerSubject = 'אישור הזמנה – ' . SITE_NAME;
        wp_mail( $customerEmail, $customerSubject, build_customer_email( $order ), $headers );
    }
}

// ── Validate order payload ────────────────────────────────────────────────────
function validate_order( array $data ): ?string {
    $required = [ 'customer_name', 'items', 'grand_total' ];
    foreach ( $required as $field ) {
        if ( empty( $data[ $field ] ) ) {
            return "חסר שדה חובה: {$field}";
        }
    }
    if ( ! is_array( $data['items'] ) || count( $data['items'] ) === 0 ) {
        return 'רשימת מוצרים ריקה';
    }
    foreach ( $data['items'] as $i => $item ) {
        if ( empty( $item['name'] ) ) {
            return "מוצר #" . ( $i + 1 ) . ": חסר שם";
        }
    }
    return null;
}

// ── Routing ───────────────────────────────────────────────────────────────────

// GET ?test=1  →  send a test email
if ( $_SERVER['REQUEST_METHOD'] === 'GET' ) {
    if ( isset( $_GET['test'] ) && $_GET['test'] === '1' ) {
        send_order_emails( test_order() );
        json_respond( [ 'success' => true, 'message' => 'Test email sent to ' . NOTIFY_TO ] );
    }
    json_respond( [ 'success' => false, 'error' => 'Use POST with JSON body, or GET ?test=1' ], 400 );
}

// POST  →  process real order
if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
    json_respond( [ 'success' => false, 'error' => 'Method not allowed' ], 405 );
}

$raw = file_get_contents( 'php://input' );
if ( ! $raw ) {
    json_respond( [ 'success' => false, 'error' => 'Empty request body' ], 400 );
}

$order = json_decode( $raw, true );
if ( json_last_error() !== JSON_ERROR_NONE ) {
    json_respond( [ 'success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg() ], 400 );
}

$validationError = validate_order( $order );
if ( $validationError !== null ) {
    json_respond( [ 'success' => false, 'error' => $validationError ], 422 );
}

send_order_emails( $order );

json_respond( [ 'success' => true ] );
