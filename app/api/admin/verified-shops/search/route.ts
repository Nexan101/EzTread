import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q")?.trim() ?? "";
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

  // Fetch current verified IDs to pre-mark results
  const { data: verifiedRows } = await supabaseAdmin.from("verified_shops").select("place_id");
  const verifiedIds = new Set((verifiedRows ?? []).map((r: { place_id: string }) => r.place_id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (data.places ?? []).map((p: any) => ({
    placeId: p.id ?? "",
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    isVerified: verifiedIds.has(p.id ?? ""),
  }));

  return NextResponse.json({ results });
}
