<?php
/**
 * Plugin Name: Smart Traveller – Email Notifications
 * Description: שולח מייל ל-GILADUNNAGU@GMAIL.COM על כל הוספה לסל, הזמנה חדשה, וביקורת מוצר
 * Version: 1.0.0
 * Author: המטייל החכם
 * Text Domain: st-notifications
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'ST_NOTIFY_EMAIL', 'GILADUNNAGU@GMAIL.COM' );
define( 'ST_SITE_NAME',   'המטייל החכם' );

/* ══════════════════════════════════════════════════════════
   1. הוספת מוצר לסל (WooCommerce add_to_cart)
   ══════════════════════════════════════════════════════════ */
add_action( 'woocommerce_add_to_cart', 'st_notify_add_to_cart', 10, 6 );

function st_notify_add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {

    $product = wc_get_product( $product_id );
    if ( ! $product ) return;

    $product_name  = $product->get_name();
    $product_price = wc_price( $product->get_price() );
    $product_url   = get_permalink( $product_id );
    $cart_url      = wc_get_cart_url();

    /* מידע על הגולש */
    $user_ip    = $_SERVER['REMOTE_ADDR'] ?? 'לא ידוע';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $time       = current_time( 'd/m/Y H:i:s' );

    /* כותרת */
    $subject = '[' . ST_SITE_NAME . '] מוצר נוסף לסל: ' . $product_name;

    /* גוף המייל */
    $body = st_email_wrapper( '
        <h2 style="color:#F97316;margin:0 0 18px;">&#128722; מוצר נוסף לסל!</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;width:35%;">מוצר</td>
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">' . esc_html( $product_name ) . '</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">כמות</td>
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">' . intval( $quantity ) . '</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">מחיר ליחידה</td>
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">' . $product_price . '</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">IP גולש</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . esc_html( $user_ip ) . '</td>
            </tr>
            <tr>
                <td style="padding:10px;color:#555;">תאריך ושעה</td>
                <td style="padding:10px;">' . esc_html( $time ) . '</td>
            </tr>
        </table>

        <p style="margin:0 0 10px;">
            <a href="' . esc_url( $product_url ) . '" style="background:#F97316;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:700;margin-left:8px;">
                צפה במוצר
            </a>
            <a href="' . esc_url( $cart_url ) . '" style="background:#0d1526;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:700;">
                צפה בסל
            </a>
        </p>
    ' );

    st_send( $subject, $body );
}


/* ══════════════════════════════════════════════════════════
   2. הזמנה חדשה – פרטים מלאים (new order)
   ══════════════════════════════════════════════════════════ */
add_action( 'woocommerce_checkout_order_created', 'st_notify_new_order', 10, 1 );

function st_notify_new_order( $order ) {
    if ( ! $order instanceof WC_Order ) return;

    $order_id      = $order->get_id();
    $order_number  = $order->get_order_number();
    $order_total   = $order->get_formatted_order_total();
    $order_status  = wc_get_order_status_name( $order->get_status() );
    $order_url     = $order->get_edit_order_url();
    $time          = current_time( 'd/m/Y H:i:s' );

    /* פרטי לקוח */
    $billing_name  = $order->get_billing_first_name() . ' ' . $order->get_billing_last_name();
    $billing_email = $order->get_billing_email();
    $billing_phone = $order->get_billing_phone();
    $billing_city  = $order->get_billing_city();

    /* מוצרים */
    $items_html = '';
    foreach ( $order->get_items() as $item ) {
        $product   = $item->get_product();
        $item_name = $item->get_name();
        $item_qty  = $item->get_quantity();
        $item_total = wc_price( $item->get_total() );
        $img_url   = '';
        if ( $product && $product->get_image_id() ) {
            $img_url = wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' );
        }
        $img_tag = $img_url
            ? '<img src="' . esc_url( $img_url ) . '" style="width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-left:10px;">'
            : '<span style="font-size:24px;vertical-align:middle;margin-left:10px;">📦</span>';

        $items_html .= '
            <tr>
                <td style="padding:12px 10px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">' . $img_tag . '</td>
                <td style="padding:12px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">' . esc_html( $item_name ) . '</td>
                <td style="padding:12px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">' . intval( $item_qty ) . '</td>
                <td style="padding:12px 10px;border-bottom:1px solid #f0f0f0;color:#F97316;font-weight:700;">' . $item_total . '</td>
            </tr>';
    }

    $subject = '[' . ST_SITE_NAME . '] הזמנה חדשה #' . $order_number . ' – ' . $billing_name;

    $body = st_email_wrapper( '
        <h2 style="color:#F97316;margin:0 0 18px;">&#128230; הזמנה חדשה #' . esc_html( $order_number ) . '!</h2>

        <h3 style="color:#333;font-size:15px;margin:0 0 10px;border-bottom:2px solid #F97316;padding-bottom:6px;">פרטי לקוח</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;color:#555;width:35%;">שם</td>
                <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">' . esc_html( $billing_name ) . '</td>
            </tr>
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;color:#555;">אימייל</td>
                <td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:' . esc_attr( $billing_email ) . '">' . esc_html( $billing_email ) . '</a></td>
            </tr>
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;color:#555;">טלפון</td>
                <td style="padding:8px;border-bottom:1px solid #eee;"><a href="tel:' . esc_attr( $billing_phone ) . '">' . esc_html( $billing_phone ) . '</a></td>
            </tr>
            <tr>
                <td style="padding:8px;color:#555;">עיר</td>
                <td style="padding:8px;">' . esc_html( $billing_city ) . '</td>
            </tr>
        </table>

        <h3 style="color:#333;font-size:15px;margin:0 0 10px;border-bottom:2px solid #F97316;padding-bottom:6px;">מוצרים שהוזמנו</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
                <tr style="background:#f8f8f8;">
                    <th style="padding:10px;text-align:right;font-size:12px;color:#888;"></th>
                    <th style="padding:10px;text-align:right;font-size:12px;color:#888;">מוצר</th>
                    <th style="padding:10px;text-align:center;font-size:12px;color:#888;">כמות</th>
                    <th style="padding:10px;text-align:right;font-size:12px;color:#888;">סה"כ</th>
                </tr>
            </thead>
            <tbody>' . $items_html . '</tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:8px;">
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eee;color:#555;">סטטוס הזמנה</td>
                <td style="padding:12px 16px;border-bottom:1px solid #eee;font-weight:600;">' . esc_html( $order_status ) . '</td>
            </tr>
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eee;color:#555;">תאריך</td>
                <td style="padding:12px 16px;border-bottom:1px solid #eee;">' . esc_html( $time ) . '</td>
            </tr>
            <tr>
                <td style="padding:14px 16px;font-size:16px;font-weight:700;">סה"כ לתשלום</td>
                <td style="padding:14px 16px;font-size:18px;font-weight:800;color:#F97316;">' . $order_total . '</td>
            </tr>
        </table>

        <p>
            <a href="' . esc_url( $order_url ) . '" style="background:#F97316;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">
                צפה בהזמנה בניהול
            </a>
        </p>
    ' );

    st_send( $subject, $body );
}


/* ══════════════════════════════════════════════════════════
   3. ביקורת מוצר חדשה (WooCommerce review)
   ══════════════════════════════════════════════════════════ */
add_action( 'comment_post', 'st_notify_review', 10, 2 );

function st_notify_review( $comment_id, $approved ) {
    $comment = get_comment( $comment_id );
    if ( ! $comment ) return;

    $post_id   = $comment->comment_post_ID;
    $post_type = get_post_type( $post_id );

    /* רק ביקורות על מוצרי WooCommerce */
    if ( $post_type !== 'product' ) return;

    $product_name  = get_the_title( $post_id );
    $product_url   = get_permalink( $post_id );
    $reviewer_name = $comment->comment_author;
    $reviewer_email= $comment->comment_author_email;
    $review_text   = $comment->comment_content;
    $rating        = get_comment_meta( $comment_id, 'rating', true );
    $time          = current_time( 'd/m/Y H:i:s' );

    $stars = $rating ? str_repeat( '⭐', intval( $rating ) ) : '—';

    $subject = '[' . ST_SITE_NAME . '] ביקורת חדשה על: ' . $product_name;

    $body = st_email_wrapper( '
        <h2 style="color:#F97316;margin:0 0 18px;">&#11088; ביקורת מוצר חדשה</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;width:35%;">מוצר</td>
                <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">
                    <a href="' . esc_url( $product_url ) . '">' . esc_html( $product_name ) . '</a>
                </td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">שם הכותב</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . esc_html( $reviewer_name ) . '</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">אימייל</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">
                    <a href="mailto:' . esc_attr( $reviewer_email ) . '">' . esc_html( $reviewer_email ) . '</a>
                </td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">דירוג</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . $stars . ' (' . intval( $rating ) . '/5)</td>
            </tr>
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">תאריך</td>
                <td style="padding:10px;border-bottom:1px solid #eee;">' . esc_html( $time ) . '</td>
            </tr>
        </table>

        <div style="background:#f9f9f9;border-right:4px solid #F97316;padding:16px 20px;border-radius:6px;margin-bottom:20px;color:#333;font-style:italic;">
            ' . nl2br( esc_html( $review_text ) ) . '
        </div>
    ' );

    st_send( $subject, $body );
}


/* ══════════════════════════════════════════════════════════
   4. Contact Form 7 (אם קיים באתר)
   ══════════════════════════════════════════════════════════ */
add_action( 'wpcf7_mail_sent', 'st_notify_cf7', 10, 1 );

function st_notify_cf7( $contact_form ) {
    $submission = WPCF7_Submission::get_instance();
    if ( ! $submission ) return;

    $posted_data = $submission->get_posted_data();
    $form_title  = $contact_form->title();
    $time        = current_time( 'd/m/Y H:i:s' );

    $fields_html = '';
    foreach ( $posted_data as $key => $value ) {
        if ( strpos( $key, '_wpcf7' ) === 0 ) continue;
        $val = is_array( $value ) ? implode( ', ', $value ) : $value;
        $fields_html .= '
            <tr>
                <td style="padding:8px 10px;border-bottom:1px solid #eee;color:#555;width:35%;">' . esc_html( $key ) . '</td>
                <td style="padding:8px 10px;border-bottom:1px solid #eee;">' . nl2br( esc_html( $val ) ) . '</td>
            </tr>';
    }

    $subject = '[' . ST_SITE_NAME . '] טופס נשלח: ' . $form_title;

    $body = st_email_wrapper( '
        <h2 style="color:#F97316;margin:0 0 18px;">&#128235; טופס נשלח – ' . esc_html( $form_title ) . '</h2>
        <p style="color:#888;margin-bottom:16px;">נשלח ב: ' . esc_html( $time ) . '</p>
        <table style="width:100%;border-collapse:collapse;">' . $fields_html . '</table>
    ' );

    st_send( $subject, $body );
}


/* ══════════════════════════════════════════════════════════
   5. Elementor Forms (אם קיים באתר)
   ══════════════════════════════════════════════════════════ */
add_action( 'elementor_pro/forms/new_record', 'st_notify_elementor_form', 10, 2 );

function st_notify_elementor_form( $record, $handler ) {
    $form_name   = $record->get_form_settings( 'form_name' );
    $raw_fields  = $record->get( 'fields' );
    $time        = current_time( 'd/m/Y H:i:s' );

    $fields_html = '';
    foreach ( $raw_fields as $field ) {
        $fields_html .= '
            <tr>
                <td style="padding:8px 10px;border-bottom:1px solid #eee;color:#555;width:35%;">' . esc_html( $field['title'] ) . '</td>
                <td style="padding:8px 10px;border-bottom:1px solid #eee;">' . nl2br( esc_html( $field['value'] ) ) . '</td>
            </tr>';
    }

    $subject = '[' . ST_SITE_NAME . '] טופס Elementor: ' . ( $form_name ?: 'טופס' );

    $body = st_email_wrapper( '
        <h2 style="color:#F97316;margin:0 0 18px;">&#128235; טופס נשלח – ' . esc_html( $form_name ?: 'טופס' ) . '</h2>
        <p style="color:#888;margin-bottom:16px;">נשלח ב: ' . esc_html( $time ) . '</p>
        <table style="width:100%;border-collapse:collapse;">' . $fields_html . '</table>
    ' );

    st_send( $subject, $body );
}


/* ══════════════════════════════════════════════════════════
   עזר: שליחת מייל + עיצוב wrapper
   ══════════════════════════════════════════════════════════ */
function st_send( $subject, $html_body ) {
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . ST_SITE_NAME . ' <noreply@the-smart-traveller.com>',
    ];
    wp_mail( ST_NOTIFY_EMAIL, $subject, $html_body, $headers );
}

function st_email_wrapper( $content ) {
    return '
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;">
        <div style="max-width:620px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background:#0d1526;padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
                <span style="color:#F97316;font-size:18px;font-weight:800;">המטייל החכם</span>
                <span style="color:#64748b;font-size:12px;">the-smart-traveller.com</span>
            </div>

            <!-- Body -->
            <div style="padding:28px 28px 12px;">
                ' . $content . '
            </div>

            <!-- Footer -->
            <div style="background:#f8f8f8;padding:16px 28px;border-top:1px solid #eee;text-align:center;">
                <p style="margin:0;color:#aaa;font-size:12px;">
                    התראה אוטומטית מ-<a href="https://the-smart-traveller.com" style="color:#F97316;text-decoration:none;">המטייל החכם</a>
                    &nbsp;|&nbsp; לא להשיב למייל זה
                </p>
            </div>
        </div>
    </body>
    </html>';
}
