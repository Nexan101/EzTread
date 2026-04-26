import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Stripe from "stripe";

// Required: tell Next.js not to parse the body — Stripe needs the raw bytes
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const shopId  = session.metadata?.shop_id;
        const amount  = (session.amount_total ?? 0) / 100; // convert cents → dollars

        // Always record the premium plan signup
        await supabaseAdmin.from("plan_signups").insert({
          plan:               "premium",
          shop_id:            shopId ?? null,
          email:              session.customer_details?.email ?? null,
          stripe_session_id:  session.id,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          amount_cents:       session.amount_total ?? null,
          status:             "active",
        }).then(() => {}).catch(e => console.warn("[Stripe Webhook] plan_signups insert failed:", e));

        // Grant shop_owner role so the user can access /shop-dashboard
        const userId = session.metadata?.user_id;
        if (userId) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: "shop_owner" },
          }).catch(e => console.warn("[Stripe Webhook] role grant failed:", e));
        }

        if (shopId) {
          await supabaseAdmin.from("leads").insert({
            shop_id:    shopId,
            amount,
            charged:    true,
            session_id: session.id,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const shopId = sub.metadata?.shop_id;
        const status = sub.status; // "active" | "past_due" | "canceled" etc.

        if (shopId) {
          await supabaseAdmin
            .from("shops")
            .update({ subscription_status: status, stripe_subscription_id: sub.id })
            .eq("id", shopId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const shopId = sub.metadata?.shop_id;

        if (shopId) {
          await supabaseAdmin
            .from("shops")
            .update({ subscription_status: "canceled", stripe_subscription_id: null })
            .eq("id", shopId);
        }

        // Mark the matching plan signup as canceled
        await supabaseAdmin
          .from("plan_signups")
          .update({ status: "canceled" })
          .eq("stripe_customer_id", typeof sub.customer === "string" ? sub.customer : "")
          .eq("plan", "premium")
          .then(() => {}).catch(e => console.warn("[Stripe Webhook] plan_signups cancel failed:", e));

        // Revoke shop_owner role
        const shopIdForUser = sub.metadata?.shop_id;
        if (!shopIdForUser) break;
        const { data: shopRow } = await supabaseAdmin
          .from("shops")
          .select("email")
          .eq("id", shopIdForUser)
          .single()
          .catch(() => ({ data: null }));
        if (shopRow?.email) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const match = users.find(u => u.email?.toLowerCase() === shopRow.email.toLowerCase());
          if (match) {
            await supabaseAdmin.auth.admin.updateUserById(match.id, {
              app_metadata: { role: null },
            }).catch(e => console.warn("[Stripe Webhook] role revoke failed:", e));
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("[Stripe] Payment failed for customer:", invoice.customer);
        break;
      }

      default:
        // Unhandled event — safe to ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
