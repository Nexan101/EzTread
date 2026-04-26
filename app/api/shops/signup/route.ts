import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { geocodeAddress } from "@/lib/utils/geocode";
import { sendShopSignupConfirmation, sendAdminNewShopNotification } from "@/lib/email";
import { createHash } from "crypto";
import { z } from "zod";

const SignupSchema = z.object({
  name:    z.string().min(1, "Shop name required"),
  address: z.string().min(1, "Address required"),
  city:    z.string().min(1, "City required"),
  state:   z.string().length(2, "2-letter state code required"),
  zip:     z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP required"),
  phone:   z.string().min(10, "Valid phone required"),
  email:   z.string().email("Valid email required"),
  website: z.string().url().optional().or(z.literal("")),

  installation:  z.string().min(1, "Installation price required"),
  balancing:     z.string().optional(),
  alignment:     z.string().optional(),
  rotation:      z.string().optional(),

  budget_min: z.coerce.number().min(0).optional(),   budget_max: z.coerce.number().min(0).optional(),   budget_brands: z.string().optional(),
  mid_min:    z.coerce.number().min(0).optional(),   mid_max:    z.coerce.number().min(0).optional(),   mid_brands:    z.string().optional(),
  premium_min:z.coerce.number().min(0).optional(),   premium_max:z.coerce.number().min(0).optional(),   premium_brands:z.string().optional(),

  description:    z.string().max(500).optional(),
  specialties:    z.array(z.string()).optional(),
  hours:          z.string().optional(),
  extra_services: z.array(z.string()).optional(),

  ack_public:       z.literal(true, "Required"),
  ack_accurate:     z.literal(true, "Required"),
  ack_terms:        z.literal(true, "Required"),
  ack_privacy:      z.literal(true, "Required"),
  ack_authorized:   z.literal(true, "Required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate shop (same name + address)
    const { data: existing } = await supabaseAdmin
      .from("shops")
      .select("id")
      .ilike("name", data.name)
      .ilike("address", data.address)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "A shop with this name and address already exists on EzTread." },
        { status: 409 }
      );
    }

    // Geocode address
    let coords = { lat: null as number | null, lng: null as number | null };
    try {
      const c = await geocodeAddress(data.address, data.city, data.state, data.zip);
      coords = { lat: c.lat, lng: c.lng };
    } catch {
      return NextResponse.json({ error: "Could not verify address. Please check your street address and ZIP code." }, { status: 400 });
    }

    // Create shop (status: pending)
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .insert({
        name:      data.name,
        address:   data.address,
        city:      data.city,
        state:     data.state,
        zip:       data.zip,
        phone:     data.phone,
        email:     data.email,
        website:   data.website || null,
        latitude:  coords.lat,
        longitude: coords.lng,
        status:    "pending",
        notes:     data.description || null,
      })
      .select()
      .single();

    if (shopError) throw shopError;

    // Create shop_services (using shop_labor_estimates table format)
    await supabaseAdmin.from("shop_labor_estimates").insert({
      shop_id:      shop.id,
      shop_name:    data.name,
      installation: data.installation || null,
      balancing:    data.balancing || null,
      alignment:    data.alignment || null,
      rotation:     data.rotation || null,
    }).then(() => {}, e => console.warn("labor estimates insert failed:", e));

    // Create shop_tire_ranges (skip if not provided)
    // (tire ranges removed from signup flow)

    // Log terms acceptance
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    await supabaseAdmin.from("shop_terms_acceptance").insert({
      shop_id:          shop.id,
      terms_version:    "v1.0",
      privacy_version:  "v1.0",
      ip_address:       ipHash,
      user_agent:       req.headers.get("user-agent") ?? null,
      signup_data:      {
        specialties:    data.specialties,
        hours:          data.hours,
        extra_services: data.extra_services,
      },
    }).throwOnError().then(() => {}, e => console.warn("terms log failed:", e));

    // Record plan signup
    await supabaseAdmin.from("plan_signups").insert({
      plan:      "basic",
      shop_id:   shop.id,
      shop_name: data.name,
      email:     data.email,
      phone:     data.phone,
      city:      data.city,
      state:     data.state,
      status:    "active",
    }).then(() => {}, e => console.warn("plan_signups insert failed:", e));

    // Send emails (non-blocking) — full details for rich template
    Promise.allSettled([
      sendShopSignupConfirmation({
        shopName: data.name,
        address:  data.address,
        city:     data.city,
        state:    data.state,
        zip:      data.zip,
        phone:    data.phone,
        email:    data.email,
        shopId:   shop.id,
      }),
      sendAdminNewShopNotification({
        shopName: data.name,
        address:  data.address,
        city:     data.city,
        state:    data.state,
        zip:      data.zip,
        phone:    data.phone,
        email:    data.email,
        shopId:   shop.id,
      }),
    ]);

    return NextResponse.json({ success: true, shopId: shop.id });
  } catch (err) {
    console.error("[POST /api/shops/signup]", err);
    return NextResponse.json({ error: "Failed to create shop. Please try again." }, { status: 500 });
  }
}
