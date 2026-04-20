import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shop_id") ?? "";
  const status = searchParams.get("status") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    let query = supabaseAdmin
      .from("leads")
      .select(`*, shop:shops(id,name,city)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (shopId) query = query.eq("shop_id", shopId);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ leads: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/admin/leads]", err);
    return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("leads").update({ status }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/leads]", err);
    return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
  }
}

