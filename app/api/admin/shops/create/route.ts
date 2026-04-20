import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { geocodeAddress } from "@/lib/utils/geocode";
import { z } from "zod";

const TireRangeSchema = z.object({
  tier: z.enum(["budget", "mid-range", "premium"]),
  min_price: z.number().min(0),
  max_price: z.number().min(0),
  example_brands: z.string().optional(),
});

const CreateShopSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5).max(10),
  phone: z.string().min(10),
  email: z.string().email(),
  google_rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  services: z.object({
    mounting_balancing_per_tire: z.number().min(0),
    valve_stems_per_tire: z.number().min(0),
    disposal_per_tire: z.number().min(0),
    tpms_per_tire: z.number().min(0),
    alignment_cost: z.number().min(0).optional().nullable(),
    free_rotation: z.boolean(),
    road_hazard_per_tire: z.number().min(0).optional().nullable(),
  }),
  tire_ranges: z.array(TireRangeSchema).length(3),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateShopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { services, tire_ranges, ...shopData } = parsed.data;

    // Geocode address
    const coords = await geocodeAddress(
      shopData.address,
      shopData.city,
      shopData.state,
      shopData.zip
    );

    // Create shop
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .insert({ ...shopData, latitude: coords.lat, longitude: coords.lng })
      .select()
      .single();

    if (shopError) throw shopError;

    // Create services
    const { error: svcError } = await supabaseAdmin
      .from("shop_services")
      .insert({ ...services, shop_id: shop.id });
    if (svcError) throw svcError;

    // Create tire ranges
    const { error: rangeError } = await supabaseAdmin
      .from("shop_tire_ranges")
      .insert(tire_ranges.map((r) => ({ ...r, shop_id: shop.id })));
    if (rangeError) throw rangeError;

    return NextResponse.json({ success: true, shopId: shop.id, shop });
  } catch (err) {
    console.error("[POST /api/admin/shops/create]", err);
    return NextResponse.json({ error: "Failed to create shop." }, { status: 500 });
  }
}

