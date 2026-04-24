import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import postgres from "postgres";

function getDb() {
  return postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  try {
    const [claim] = await sql`
      SELECT shop_id, shop_name, created_at
      FROM shop_claims
      WHERE LOWER(owner_email) = LOWER(${user.email})
      LIMIT 1
    `;

    if (!claim) {
      return NextResponse.json({ shop: null });
    }

    return NextResponse.json({ shop: claim });
  } catch (err) {
    console.error("[GET /api/shop-dashboard/my-shop]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
