import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/utils/rateLimit";
import postgres from "postgres";

const VALID_EVENTS = new Set(["impression", "quote_click", "directions_click"]);

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // 60 events per IP per minute to allow batch impressions without abuse
  if (!rateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = await req.json();

    // Accept either a single event or a batch
    const raw: Array<{ place_id: string; event_type: string }> = Array.isArray(body.events)
      ? body.events
      : [{ place_id: body.place_id, event_type: body.event_type }];

    // Validate and sanitize
    const events = raw.filter(
      (e) => typeof e.place_id === "string" && e.place_id.length > 0 && VALID_EVENTS.has(e.event_type)
    );

    if (!events.length) {
      return NextResponse.json({ ok: false, error: "No valid events." }, { status: 400 });
    }

    const sql = getDb();
    try {
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
      await sql`
        INSERT INTO shop_analytics (place_id, event_type)
        VALUES ${sql(events.map((e) => [e.place_id, e.event_type]))}
      `;
      return NextResponse.json({ ok: true });
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[POST /api/analytics/event]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
