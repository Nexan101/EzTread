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

// GET — fetch current pricing for the owner's shop
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const placeId = await getOwnerPlaceId(user.email);
  if (!placeId) return NextResponse.json({ error: "No shop connected to your account." }, { status: 404 });

  const sql = getDb();
  try {
    const [row] = await sql`
      SELECT shop_name, installation, alignment, rotation, balancing
      FROM shop_labor_estimates
      WHERE place_id = ${placeId}
    `;
    return NextResponse.json({ pricing: row ?? null, place_id: placeId });
  } catch (err) {
    console.error("[GET /api/shop-dashboard/pricing]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// POST — upsert pricing for the owner's shop
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const placeId = await getOwnerPlaceId(user.email);
  if (!placeId) return NextResponse.json({ error: "No shop connected to your account." }, { status: 404 });

  const { shop_name, installation, alignment, rotation, balancing } = await req.json();
  if (!shop_name) return NextResponse.json({ error: "shop_name is required." }, { status: 400 });

  const sql = getDb();
  try {
    await sql`
      INSERT INTO shop_labor_estimates (place_id, shop_name, installation, alignment, rotation, balancing, updated_at)
      VALUES (
        ${placeId}, ${shop_name},
        ${installation ?? null}, ${alignment ?? null},
        ${rotation ?? null}, ${balancing ?? null},
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
    console.error("[POST /api/shop-dashboard/pricing]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
