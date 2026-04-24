import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

// GET — list all shop owner connections
export async function GET() {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT id, shop_id, shop_name, owner_email, created_at
      FROM shop_claims
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ claims: rows });
  } catch (err) {
    console.error("[GET /api/admin/shop-claims]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// POST — connect a shop to an owner email
export async function POST(req: NextRequest) {
  const { shop_id, shop_name, owner_email } = await req.json();
  if (!shop_id || !shop_name || !owner_email) {
    return NextResponse.json(
      { error: "shop_id, shop_name, and owner_email are required." },
      { status: 400 }
    );
  }

  const sql = getDb();
  try {
    const [row] = await sql`
      INSERT INTO shop_claims (shop_id, shop_name, owner_email)
      VALUES (${shop_id}, ${shop_name}, ${owner_email.toLowerCase().trim()})
      ON CONFLICT (shop_id) DO UPDATE
        SET shop_name   = EXCLUDED.shop_name,
            owner_email = EXCLUDED.owner_email
      RETURNING id, shop_id, shop_name, owner_email, created_at
    `;
    return NextResponse.json({ claim: row });
  } catch (err) {
    console.error("[POST /api/admin/shop-claims]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}

// DELETE — remove a shop owner connection by shop_id
export async function DELETE(req: NextRequest) {
  const { shop_id } = await req.json();
  if (!shop_id) {
    return NextResponse.json({ error: "shop_id is required." }, { status: 400 });
  }

  const sql = getDb();
  try {
    await sql`DELETE FROM shop_claims WHERE shop_id = ${shop_id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/shop-claims]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
