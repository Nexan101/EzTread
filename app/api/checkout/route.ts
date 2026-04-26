import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // Require a logged-in user so we can grant them shop_owner access after payment
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in before purchasing." }, { status: 401 });
    }

    const { plan = "monthly" } = await req.json();

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_PRICE_ID_YEARLY!
        : process.env.STRIPE_PRICE_ID_MONTHLY!;

    // If price IDs aren't configured yet, fall back to the static payment link
    if (!priceId || priceId.startsWith("price_REPLACE")) {
      return NextResponse.json(
        { fallback_url: "https://buy.stripe.com/fZubIT8a94mu1A56emeQM00" },
        { status: 200 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode:              "embedded_page",
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items:           [{ price: priceId, quantity: 1 }],
      customer_email:       user.email,
      metadata:             { user_id: user.id, email: user.email ?? "" },
      return_url:           `${process.env.NEXT_PUBLIC_APP_URL}/join/complete?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ client_secret: session.client_secret });
  } catch (err) {
    console.error("[POST /api/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
