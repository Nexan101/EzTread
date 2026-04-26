import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import postgres from "postgres";

// Revalidate every 24 hours
export const revalidate = 86400;

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

export async function GET() {
  const sql = getDb();

  try {
    const [
      { count: shopCount },
      visitors,
      comparisons,
    ] = await Promise.all([
      supabaseAdmin.from("shops").select("*", { count: "exact", head: true }),
      sql`
        SELECT COUNT(*) AS count
        FROM site_events
        WHERE event_type = 'page_view'
      `.catch(() => [{ count: "0" }]),
      sql`
        SELECT COUNT(*) AS count
        FROM site_events
        WHERE event_type = 'price_compare'
      `.catch(() => [{ count: "0" }]),
    ]);

    return NextResponse.json({
      shops:       shopCount       ?? 0,
      visitors:    Number((visitors as Array<{ count: string }>)[0]?.count    ?? 0),
      comparisons: Number((comparisons as Array<{ count: string }>)[0]?.count ?? 0),
    });
  } catch (err) {
    console.error("[GET /api/public-stats]", err);
    return NextResponse.json({ shops: 0, visitors: 0, comparisons: 0 }, { status: 500 });
  } finally {
    await sql.end();
  }
}
