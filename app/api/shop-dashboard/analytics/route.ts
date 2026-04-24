import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import postgres from "postgres";

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

async function getOwnerPlaceId(email: string): Promise<string | null> {
  const sql = getDb();
  try {
    const [claim] = await sql`
      SELECT shop_id FROM shop_claims
      WHERE LOWER(owner_email) = LOWER(${email})
      LIMIT 1
    `;
    return claim?.shop_id ?? null;
  } finally {
    await sql.end();
  }
}

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_CONFIG: Record<Period, { trunc: string; interval: string; format: string }> = {
  daily:   { trunc: "day",   interval: "30 days",  format: "Mon DD" },
  weekly:  { trunc: "week",  interval: "84 days",  format: "Mon DD" },
  monthly: { trunc: "month", interval: "12 months", format: "Mon YYYY" },
  yearly:  { trunc: "year",  interval: "5 years",  format: "YYYY" },
};

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const placeId = await getOwnerPlaceId(user.email);
  if (!placeId) return NextResponse.json({ error: "No shop connected." }, { status: 404 });

  const period = (req.nextUrl.searchParams.get("period") ?? "daily") as Period;
  const config = PERIOD_CONFIG[period] ?? PERIOD_CONFIG.daily;

  const sql = getDb();
  try {
    // Ensure the table exists (first-run safety)
    await sql`
      CREATE TABLE IF NOT EXISTS shop_analytics (
        id         BIGSERIAL PRIMARY KEY,
        place_id   TEXT NOT NULL,
        event_type TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_shop_analytics_lookup
        ON shop_analytics (place_id, event_type, created_at DESC)
    `;

    // Time-series data grouped by period and event type
    const rows = await sql.unsafe(`
      SELECT
        DATE_TRUNC('${config.trunc}', created_at) AS period,
        event_type,
        COUNT(*)::int AS count
      FROM shop_analytics
      WHERE place_id = $1
        AND created_at > NOW() - INTERVAL '${config.interval}'
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `, [placeId]);

    // All-time totals
    const [totals] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'impression')::int        AS total_impressions,
        COUNT(*) FILTER (WHERE event_type = 'quote_click')::int       AS total_quote_clicks,
        COUNT(*) FILTER (WHERE event_type = 'directions_click')::int  AS total_directions_clicks
      FROM shop_analytics
      WHERE place_id = ${placeId}
    `;

    // Build a map of period → { impressions, quote_clicks, directions_clicks }
    const periodMap = new Map<string, { impressions: number; quote_clicks: number; directions_clicks: number }>();
    for (const row of rows) {
      const key = new Date(row.period as string).toISOString();
      if (!periodMap.has(key)) {
        periodMap.set(key, { impressions: 0, quote_clicks: 0, directions_clicks: 0 });
      }
      const entry = periodMap.get(key)!;
      if (row.event_type === "impression")        entry.impressions        = row.count as number;
      if (row.event_type === "quote_click")       entry.quote_clicks       = row.count as number;
      if (row.event_type === "directions_click")  entry.directions_clicks  = row.count as number;
    }

    const series = Array.from(periodMap.entries()).map(([period, counts]) => ({
      period,
      ...counts,
      conversions: counts.quote_clicks + counts.directions_clicks,
    }));

    const totalImpressions      = totals?.total_impressions ?? 0;
    const totalQuoteClicks      = totals?.total_quote_clicks ?? 0;
    const totalDirectionsClicks = totals?.total_directions_clicks ?? 0;
    const totalConversions      = totalQuoteClicks + totalDirectionsClicks;
    const conversionRate        = totalImpressions > 0
      ? Math.round((totalConversions / totalImpressions) * 1000) / 10
      : 0;

    return NextResponse.json({
      series,
      summary: {
        totalImpressions,
        totalConversions,
        totalQuoteClicks,
        totalDirectionsClicks,
        conversionRate,
      },
    });
  } catch (err) {
    console.error("[GET /api/shop-dashboard/analytics]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
