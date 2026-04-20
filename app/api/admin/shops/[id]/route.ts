import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { geocodeAddress } from "@/lib/utils/geocode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { data, error } = await supabaseAdmin
      .from("shops")
      .select(`*, shop_services(*), shop_tire_ranges(*), leads(*)`)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    return NextResponse.json({ shop: data });
  } catch (err) {
    console.error("[GET /api/admin/shops/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch shop." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { services, tire_ranges, ...shopData } = body;

    // Re-geocode if address changed
    if (shopData.address && shopData.city && shopData.state && shopData.zip) {
      const coords = await geocodeAddress(
        shopData.address, shopData.city, shopData.state, shopData.zip
      );
      shopData.latitude = coords.lat;
      shopData.longitude = coords.lng;
    }

    const { error: shopError } = await supabaseAdmin
      .from("shops").update(shopData).eq("id", id);
    if (shopError) throw shopError;

    if (services) {
      const { data: existing } = await supabaseAdmin
        .from("shop_services").select("id").eq("shop_id", id).single();
      if (existing) {
        await supabaseAdmin.from("shop_services")
          .update({ ...services, updated_at: new Date().toISOString() }).eq("shop_id", id);
      } else {
        await supabaseAdmin.from("shop_services").insert({ ...services, shop_id: id });
      }
    }

    if (tire_ranges?.length) {
      await supabaseAdmin.from("shop_tire_ranges").delete().eq("shop_id", id);
      await supabaseAdmin.from("shop_tire_ranges")
        .insert(tire_ranges.map((r: object) => ({ ...r, shop_id: id })));
    }

    const { data: updated } = await supabaseAdmin
      .from("shops").select(`*, shop_services(*), shop_tire_ranges(*)`).eq("id", id).single();

    return NextResponse.json({ success: true, shop: updated });
  } catch (err) {
    console.error("[PUT /api/admin/shops/[id]]", err);
    return NextResponse.json({ error: "Failed to update shop." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin.from("shops").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/shops/[id]]", err);
    return NextResponse.json({ error: "Failed to delete shop." }, { status: 500 });
  }
}
