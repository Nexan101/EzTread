import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") ?? "";
  const search = searchParams.get("search") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    let query = supabaseAdmin
      .from("shops")
      .select(
        `*, shop_services(*), shop_tire_ranges(*)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) query = query.ilike("city", `%${city}%`);
    if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,zip.eq.${search}`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ shops: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/admin/shops]", err);
    return NextResponse.json({ error: "Failed to fetch shops." }, { status: 500 });
  }
}

