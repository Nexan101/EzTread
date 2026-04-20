import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

/** Freeform price text (digits, decimals, hyphens); stored and shown as-is. */
function parseOptPriceStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().replace(/[–—]/g, "-");
  if (!s) return null;
  s = s.replace(/^\$+\s*/, "").trim();
  if (!s) return null;
  if (s.length > 48) return null;
  if (!/^\d/.test(s)) return null;
  if (!/^[\d.\s\-]+$/i.test(s)) return null;
  return s.replace(/\s*-\s*/g, "-");
}

// GET ?placeId= — single row for editing
export async function GET(req: NextRequest) {
  const placeId = new URL(req.url).searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required." }, { status: 400 });
  }

  const sql = getDb();
  try {
    const rows = await sql`
      SELECT place_id, shop_name, installation, alignment, rotation, balancing, updated_at
      FROM shop_labor_estimates
      WHERE place_id = ${placeId}
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ estimate: null });
    }
    const str = (x: unknown) => {
      if (x == null) return null;
      const t = String(x).trim();
      return t === "" ? null : t;
    };
    return NextResponse.json({
      estimate: {
        place_id: row.place_id as string,
        shop_name: row.shop_name as string,
        installation: str(row.installation),
        alignment: str(row.alignment),
        rotation: str(row.rotation),
        balancing: str(row.balancing),
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/shop-labor-estimates]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// POST — upsert labor estimates for a Google Place
export async function POST(req: NextRequest) {
  const body = await req.json();
  const place_id = body.place_id as string | undefined;
  const shop_name = body.shop_name as string | undefined;
  if (!place_id?.trim() || !shop_name?.trim()) {
    return NextResponse.json({ error: "place_id and shop_name are required." }, { status: 400 });
  }

  function fieldOr400(label: string, raw: unknown): string | null {
    if (raw === null || raw === undefined || String(raw).trim() === "") return null;
    const parsed = parseOptPriceStr(raw);
    if (parsed === null) {
      throw new Error(`INVALID:${label}`);
    }
    return parsed;
  }

  let installation: string | null;
  let alignment: string | null;
  let rotation: string | null;
  let balancing: string | null;
  try {
    installation = fieldOr400("Installation", body.installation);
    alignment = fieldOr400("Alignment", body.alignment);
    rotation = fieldOr400("Rotation", body.rotation);
    balancing = fieldOr400("Balancing", body.balancing);
  } catch (e) {
    const msg = e instanceof Error && e.message.startsWith("INVALID:")
      ? `${e.message.replace("INVALID:", "")}: use digits, optional decimals, optional hyphens (e.g. 25 or 20-40).`
      : "Invalid price value.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const sql = getDb();
  try {
    await sql`
      INSERT INTO shop_labor_estimates (
        place_id, shop_name, installation, alignment, rotation, balancing, updated_at
      )
      VALUES (
        ${place_id.trim()},
        ${shop_name.trim()},
        ${installation},
        ${alignment},
        ${rotation},
        ${balancing},
        NOW()
      )
      ON CONFLICT (place_id) DO UPDATE SET
        shop_name    = EXCLUDED.shop_name,
        installation = EXCLUDED.installation,
        alignment    = EXCLUDED.alignment,
        rotation     = EXCLUDED.rotation,
        balancing    = EXCLUDED.balancing,
        updated_at   = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/shop-labor-estimates]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
