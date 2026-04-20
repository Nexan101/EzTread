import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const iso = startOfMonth.toISOString();

    const [
      { count: totalShops },
      { count: shopsThisMonth },
      { count: totalLeads },
      { count: leadsThisMonth },
      { data: recentShops },
      { data: recentLeads },
      { data: revenueData },
    ] = await Promise.all([
      supabaseAdmin.from("shops").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("shops").select("*", { count: "exact", head: true }).gte("created_at", iso),
      supabaseAdmin.from("leads").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("leads").select("*", { count: "exact", head: true }).gte("created_at", iso),
      supabaseAdmin.from("shops").select("id,name,city,state,created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("leads").select("amount").eq("charged", true).gte("created_at", iso),
    ]);

    const revenueThisMonth = (revenueData ?? []).reduce(
      (sum, l) => sum + (Number(l.amount) || 0), 0
    );

    return NextResponse.json({
      totalShops: totalShops ?? 0,
      shopsThisMonth: shopsThisMonth ?? 0,
      totalLeads: totalLeads ?? 0,
      leadsThisMonth: leadsThisMonth ?? 0,
      revenueThisMonth,
      recentShops: recentShops ?? [],
      recentLeads: recentLeads ?? [],
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}

