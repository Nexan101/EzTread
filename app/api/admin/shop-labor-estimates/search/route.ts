import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";

  if (!q) return NextResponse.json({ error: "Query is required." }, { status: 400 });

  const textQuery = location ? `${q} ${location}` : q;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery, maxResultCount: 10 }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    return NextResponse.json({ error: "Places search failed." }, { status: 500 });
  }

  let pricedIds = new Set<string>();
  try {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
    const rows = await sql`
      SELECT place_id FROM shop_labor_estimates
      WHERE COALESCE(TRIM(installation::text), '') <> ''
         OR COALESCE(TRIM(alignment::text), '') <> ''
         OR COALESCE(TRIM(rotation::text), '') <> ''
         OR COALESCE(TRIM(balancing::text), '') <> ''
    `;
    pricedIds = new Set(rows.map((r) => r.place_id as string));
    await sql.end();
  } catch {
    // table may not exist yet
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (data.places ?? []).map((p: any) => ({
    placeId: p.id ?? "",
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    hasEstimate: pricedIds.has(p.id ?? ""),
  }));

  return NextResponse.json({ results });
}
