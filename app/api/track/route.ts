import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/utils/rateLimit";
import { createHash } from "crypto";
import postgres from "postgres";

const VALID_EVENTS = new Set(["page_view", "price_compare"]);

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

async function ensureTable(sql: ReturnType<typeof postgres>) {
  await sql`
    CREATE TABLE IF NOT EXISTS site_events (
      id         BIGSERIAL PRIMARY KEY,
      event_type TEXT        NOT NULL,
      ip_hash    TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_site_events_type_day
      ON site_events (event_type, date_trunc('day', created_at))
  `;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const { event_type } = await req.json();
    if (!VALID_EVENTS.has(event_type)) {
      return NextResponse.json({ ok: false, error: "Invalid event." }, { status: 400 });
    }

    const ipHash = createHash("sha256").update(ip + process.env.CRON_SECRET!).digest("hex");
    const sql = getDb();

    try {
      await ensureTable(sql);

      if (event_type === "page_view") {
        // Count at most one page_view per IP per calendar day
        const existing = await sql`
          SELECT id FROM site_events
          WHERE event_type = 'page_view'
            AND ip_hash    = ${ipHash}
            AND date_trunc('day', created_at) = date_trunc('day', NOW())
          LIMIT 1
        `;
        if (existing.length === 0) {
          await sql`INSERT INTO site_events (event_type, ip_hash) VALUES ('page_view', ${ipHash})`;
        }
      } else {
        await sql`INSERT INTO site_events (event_type, ip_hash) VALUES (${event_type}, ${ipHash})`;
      }

      return NextResponse.json({ ok: true });
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[POST /api/track]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
