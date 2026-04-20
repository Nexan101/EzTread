import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

// GET — list all recommended shops
export async function GET() {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT place_id, shop_name, created_at
      FROM recommended_shops
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ shops: rows });
  } catch (err) {
    console.error("[GET /api/admin/recommended-shops]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// POST — mark a shop as recommended
export async function POST(req: NextRequest) {
  const { place_id, shop_name } = await req.json();
  if (!place_id || !shop_name) {
    return NextResponse.json({ error: "place_id and shop_name are required." }, { status: 400 });
  }

  const sql = getDb();
  try {
    await sql`
      INSERT INTO recommended_shops (place_id, shop_name)
      VALUES (${place_id}, ${shop_name})
      ON CONFLICT (place_id) DO UPDATE SET shop_name = EXCLUDED.shop_name
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/recommended-shops]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// DELETE — remove recommended status
export async function DELETE(req: NextRequest) {
  const { place_id } = await req.json();
  if (!place_id) {
    return NextResponse.json({ error: "place_id is required." }, { status: 400 });
  }

  const sql = getDb();
  try {
    await sql`DELETE FROM recommended_shops WHERE place_id = ${place_id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/recommended-shops]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
