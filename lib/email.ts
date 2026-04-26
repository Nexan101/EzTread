import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ShopSignupEmailData, AdminNewShopEmailData, EmailResult, EmailType } from "@/types/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM         = "EzTread <EzTread@eztread.net>";
const REPLY_TO     = "EzTread@eztread.net";
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? "https://eztread.com";
const ADMIN_EMAIL  = (process.env.ADMIN_EMAILS ?? "EzTread@eztread.net").split(",")[0].trim();

// ─── Logging ──────────────────────────────────────────────────────────────────

async function logEmail(params: {
  type: EmailType;
  recipientEmail: string;
  shopId?: string;
  success: boolean;
  error?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("email_logs").insert({
    email_type:    params.type,
    recipient_email: params.recipientEmail,
    shop_id:       params.shopId ?? null,
    success:       params.success,
    error_message: params.error ?? null,
    email_service: "resend",
    metadata:      params.metadata ?? null,
  }).then(() => {}).catch(e => console.warn("[email_logs] insert failed:", e));
}

// ─── Shop signup confirmation (sent to shop owner) ─────────────────────────────

export async function sendShopSignupConfirmation(shop: ShopSignupEmailData): Promise<EmailResult> {
  const subject = "Welcome to EzTread — Profile Pending Review";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#f97316;padding:32px 40px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:rgba(255,255,255,0.2);border-radius:10px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                <span style="color:#ffffff;font-weight:900;font-size:22px;line-height:44px;">E</span>
              </td>
              <td style="padding-left:14px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">EzTread</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr><td style="padding:40px 40px 0;">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1f2937;line-height:1.2;">
          Welcome to EzTread, ${shop.shopName}!
        </h1>
        <p style="margin:0 0 28px;font-size:16px;color:#6b7280;line-height:1.6;">
          Thank you for creating a free shop profile. Your profile is <strong style="color:#1f2937;">under review</strong> and will be activated within <strong style="color:#1f2937;">1–2 business days</strong>.
        </p>

        <!-- Profile Details Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">📋 Profile Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:14px;width:100px;vertical-align:top;">Shop</td>
                <td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">${shop.shopName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">Address</td>
                <td style="padding:6px 0;color:#1f2937;font-size:14px;">${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">Phone</td>
                <td style="padding:6px 0;color:#1f2937;font-size:14px;">${shop.phone}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">Email</td>
                <td style="padding:6px 0;color:#1f2937;font-size:14px;">${shop.email}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">Plan</td>
                <td style="padding:6px 0;">
                  <span style="background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">FREE — Basic</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- What Happens Next -->
        <h2 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1f2937;">What Happens Next</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          ${[
            "We'll verify your business information",
            "You'll receive an activation email when approved",
            "Your profile will go live on EzTread.com",
            "Customers can find you in search results",
          ].map((step, i) => `
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:28px;height:28px;background:#f97316;border-radius:50%;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:13px;font-weight:700;line-height:28px;">${i + 1}</span>
                  </td>
                  <td style="padding-left:12px;color:#374151;font-size:14px;line-height:1.5;">${step}</td>
                </tr>
              </table>
            </td>
          </tr>`).join("")}
        </table>

        <!-- What You Get -->
        <h2 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1f2937;">What You Get (Free Plan)</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          ${[
            "Public listing on EzTread.com",
            "Appear in customer tire searches",
            "Basic shop profile page",
            "Display your pricing information",
          ].map(item => `
          <tr>
            <td style="padding:5px 0;color:#374151;font-size:14px;">
              <span style="color:#16a34a;font-weight:700;margin-right:8px;">✓</span>${item}
            </td>
          </tr>`).join("")}
        </table>

        <!-- Important Reminders -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#c2410c;">⚠ Important Reminders</p>
            <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.9;">
              <li>Your pricing is visible to <strong>all customers and competitors</strong></li>
              <li>Keep your information accurate and up-to-date</li>
              <li>You're responsible for quality of service to customers</li>
              <li>Customer reviews will be public</li>
              <li>Read our <a href="${APP_URL}/terms/shop-owners" style="color:#3b82f6;text-decoration:underline;">Shop Owner Terms of Service</a></li>
            </ul>
          </td></tr>
        </table>

        <!-- Upgrade CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:28px 28px 24px;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#ffffff;">Want More Customers?</p>
            <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;">Upgrade to Premium ($149/mo) to get:</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${[
                "Direct customer lead notifications",
                "Priority search placement",
                "Featured shop badge",
                "Full analytics dashboard",
              ].map(item => `
              <tr>
                <td style="padding:4px 0;color:#d1d5db;font-size:14px;">
                  <span style="color:#f97316;margin-right:8px;">●</span>${item}
                </td>
              </tr>`).join("")}
            </table>
            <a href="${APP_URL}/join"
               style="display:inline-block;background:#f97316;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              Upgrade to Premium →
            </a>
          </td></tr>
        </table>

        <!-- Dashboard CTA -->
        <div style="text-align:center;margin-bottom:32px;">
          <a href="${APP_URL}/shop-dashboard"
             style="display:inline-block;background:#f3f4f6;color:#1f2937;font-weight:600;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;border:1px solid #e5e7eb;">
            Go to Shop Dashboard →
          </a>
        </div>

        <!-- Support -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;margin-bottom:32px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1f2937;">Questions or Need Changes?</p>
            <p style="margin:0;font-size:14px;color:#6b7280;">
              Reply to this email or contact:
              <a href="mailto:${REPLY_TO}" style="color:#3b82f6;text-decoration:underline;">${REPLY_TO}</a>
            </p>
          </td></tr>
        </table>

        <p style="margin:0 0 32px;font-size:16px;color:#374151;font-weight:600;">Thanks for joining EzTread!</p>

      </td></tr>

      <!-- Footer -->
      <tr>
        <td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.6;">
            This email confirms your acceptance of our
            <a href="${APP_URL}/terms/shop-owners" style="color:#6b7280;text-decoration:underline;">Shop Owner Terms of Service</a>
            and
            <a href="${APP_URL}/privacy" style="color:#6b7280;text-decoration:underline;">Privacy Policy</a>.
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            To request profile removal: <a href="mailto:${REPLY_TO}" style="color:#6b7280;">${REPLY_TO}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from:     FROM,
      to:       shop.email,
      replyTo:  REPLY_TO,
      subject,
      html,
    });

    const messageId = result.data?.id;
    await logEmail({
      type:           "shop_signup_confirmation",
      recipientEmail: shop.email,
      shopId:         shop.shopId,
      success:        true,
      messageId,
      metadata:       { shopName: shop.shopName, city: shop.city, state: shop.state },
    });

    console.log(`[email] shop_signup_confirmation → ${shop.email} ✓ (${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] shop_signup_confirmation → ${shop.email} ✗`, message);
    await logEmail({
      type:           "shop_signup_confirmation",
      recipientEmail: shop.email,
      shopId:         shop.shopId,
      success:        false,
      error:          message,
    });
    return { success: false, error: message };
  }
}

// ─── Admin new shop notification ───────────────────────────────────────────────

export async function sendAdminNewShopNotification(shop: AdminNewShopEmailData): Promise<EmailResult> {
  const subject = `New Shop Signup: ${shop.shopName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

      <tr>
        <td style="background:#1f2937;padding:24px 32px;">
          <p style="margin:0;color:#f97316;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">EzTread Admin</p>
          <h1 style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:700;">New Shop Signup</h1>
        </td>
      </tr>

      <tr><td style="padding:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:14px;width:110px;">Shop Name</td>
                <td style="padding:7px 0;color:#1f2937;font-size:14px;font-weight:600;">${shop.shopName}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:14px;">Address</td>
                <td style="padding:7px 0;color:#1f2937;font-size:14px;">${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:14px;">Phone</td>
                <td style="padding:7px 0;color:#1f2937;font-size:14px;">${shop.phone}</td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:14px;">Email</td>
                <td style="padding:7px 0;color:#1f2937;font-size:14px;">
                  <a href="mailto:${shop.email}" style="color:#3b82f6;">${shop.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:7px 0;color:#6b7280;font-size:14px;">Shop ID</td>
                <td style="padding:7px 0;color:#9ca3af;font-size:12px;font-family:monospace;">${shop.shopId}</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:12px;">
              <a href="${APP_URL}/admin/shops/${shop.shopId}"
                 style="display:inline-block;background:#f97316;color:#ffffff;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;">
                Review in Admin →
              </a>
            </td>
            <td>
              <a href="${APP_URL}/admin/shops"
                 style="display:inline-block;background:#f3f4f6;color:#374151;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;border:1px solid #e5e7eb;">
                All Shops
              </a>
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject,
      html,
    });

    const messageId = result.data?.id;
    await logEmail({
      type:           "admin_new_shop_notification",
      recipientEmail: ADMIN_EMAIL,
      shopId:         shop.shopId,
      success:        true,
      messageId,
      metadata:       { shopName: shop.shopName },
    });

    console.log(`[email] admin_new_shop_notification → ${ADMIN_EMAIL} ✓ (${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] admin_new_shop_notification → ${ADMIN_EMAIL} ✗`, message);
    await logEmail({
      type:           "admin_new_shop_notification",
      recipientEmail: ADMIN_EMAIL,
      shopId:         shop.shopId,
      success:        false,
      error:          message,
    });
    return { success: false, error: message };
  }
}

// ─── Deletion confirmation ─────────────────────────────────────────────────────

export async function sendDeletionConfirmation(shop: { name: string; email: string }) {
  return resend.emails.send({
    from:    FROM,
    to:      shop.email,
    replyTo: REPLY_TO,
    subject: "EzTread — Profile Deletion Confirmed",
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;padding:40px;">
      <tr><td>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1f2937;">Profile Deletion Confirmed</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
          Your shop profile for <strong>${shop.name}</strong> has been removed from EzTread.
          Your data will be fully purged within 30 days per our Privacy Policy.
        </p>
        <p style="margin:0;font-size:13px;color:#9ca3af;">
          Questions? Email <a href="mailto:${REPLY_TO}" style="color:#3b82f6;">${REPLY_TO}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}
