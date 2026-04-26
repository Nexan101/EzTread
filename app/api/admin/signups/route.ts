import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plan   = searchParams.get("plan");   // "basic" | "premium" | null (all)
  const status = searchParams.get("status"); // "active" | "canceled" | null (all)
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);

  let query = supabaseAdmin
    .from("plan_signups")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (plan && plan !== "all") query = query.eq("plan", plan);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, count, error } = await query;

  if (error) {
    console.error("[GET /api/admin/signups]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signups: data ?? [], total: count ?? 0 });
}
