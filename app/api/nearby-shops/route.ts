import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { rateLimit } from "@/lib/utils/rateLimit";

export const maxDuration = 15;

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// ── Exclusion filters ────────────────────────────────────────────────────────

// Car brands that signal a new-car dealership when they appear as whole words.
// Tire-service chains that happen to carry a brand name (e.g. "Goodyear Tire
// Center") are NOT in this list.
const DEALERSHIP_BRANDS = [
  "acura","aston martin","audi","bentley","bmw","buick","cadillac",
  "chevrolet","chevy","chrysler","dodge","ferrari","fiat","ford",
  "genesis","gmc","honda","hyundai","infiniti","jaguar","jeep","kia",
  "lamborghini","land rover","lexus","lincoln","lotus","maserati",
  "mazda","mclaren","mercedes","mitsubishi","nissan","porsche","ram",
  "rolls-royce","subaru","tesla","toyota","volkswagen","volvo","vw",
];

// Subtract shops that are purely dealerships or parts retailers.
// Tire-service shops (Midas, Firestone, Pep Boys, etc.) are intentionally kept.
const BLOCKED_PHRASES = [
  "auto parts","parts store","auto mall","car dealership",
  "autonation","auto nation",
  "autozone","o'reilly","oreilly","advance auto parts","napa auto parts",
];

// These suffixes strongly indicate a dealership context — used with brand check
const DEALERSHIP_SUFFIXES = ["of ", "auto group","motors","automotive group","car sales"];

function isExcluded(name: string): boolean {
  const lower = name.toLowerCase();

  // 1. Pure phrase match for parts stores / dealership groups
  if (BLOCKED_PHRASES.some((p) => lower.includes(p))) return true;

  // 2. Car brand appears as a whole word AND name also looks like a dealership
  //    (has a dealership suffix or no tire-related word at all)
  const hasTireWord = /\btire|tyre|wheel|lube|alignment|rotation\b/i.test(lower);
  if (!hasTireWord) {
    const hasDealerBrand = DEALERSHIP_BRANDS.some((brand) => {
      const re = new RegExp(`\\b${brand.replace(/[-\s]/g, "[\\s\\-]")}\\b`, "i");
      return re.test(lower);
    });
    if (hasDealerBrand) {
      // Only exclude if it also has a dealership-like suffix (e.g. "Ford of Katy")
      const hasDealerSuffix = DEALERSHIP_SUFFIXES.some((s) => lower.includes(s));
      if (hasDealerSuffix) return true;
      // Or if it has NO service/repair word at all (pure sales lot)
      const hasServiceWord = /\brepair|service|shop|center|mechanic|fix|care\b/i.test(lower);
      if (!hasServiceWord) return true;
    }
  }

  return false;
}

/** Admin-entered estimated labor prices (per shop / Google Place). Freeform text; shown on cards with a leading $ if omitted. */
export interface NearbyShopLaborEstimate {
  installation: string | null;
  alignment: string | null;
  rotation: string | null;
  balancing: string | null;
}

export interface NearbyShop {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  totalRatings: number | null;
  phone: string | null;
  isOpen: boolean | null;
  weekdayDescriptions: string[] | null;
  website: string | null;
  photoUrl: string | null;
  distanceMeters: number;
  mapsUrl: string;
  isVerified: boolean;
  isRecommended: boolean;
  laborEstimate: NearbyShopLaborEstimate | null;
}

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  // 10 requests per IP per minute to protect Google Maps quota
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json(
      { shops: [], error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const { lat, lng, zipCode, city, state } = await req.json();

    // Resolve center — typed location always wins over GPS.
    // Priority: zip code → city+state → GPS (last resort only)
    let center: { lat: number; lng: number } | null = null;
    if (zipCode) {
      center = await geocodeAddress(String(zipCode));
    }
    if (!center && (city || state)) {
      const query = [city, state].filter(Boolean).join(", ");
      center = await geocodeAddress(query);
    }
    if (!center && lat && lng) {
      // GPS fallback — only used when no typed location was provided
      center = { lat: Number(lat), lng: Number(lng) };
    }

    if (!center) {
      return NextResponse.json(
        { shops: [], error: "Could not determine your location. Check your zip code." },
        { status: 400 }
      );
    }

    // Run multiple text searches in parallel — mirrors how Google Maps finds
    // shops matching "tire shop", "tires", "tire installation", etc.
    // Results are merged and deduplicated by place ID.
    const SEARCH_QUERIES = [
      "tire shop",
      "tires",
      "tire installation",
      "tire rotation balancing",
      "wheel alignment tire",
      "new used tires",
    ];

    const FIELD_MASK = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.nationalPhoneNumber",
      "places.regularOpeningHours",
      "places.photos",
      "places.websiteUri",
    ].join(",");

    const locationBias = {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 24140, // 15 miles
      },
    };

    const searchResponses = await Promise.all(
      SEARCH_QUERIES.map((textQuery) =>
        fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": MAPS_KEY!,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({ textQuery, maxResultCount: 20, locationBias }),
        }).then((r) => r.json())
      )
    );

    // Merge all results, deduplicate by place ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPlaces: any[] = [];
    for (const data of searchResponses) {
      for (const place of data.places ?? []) {
        if (place.id && !seen.has(place.id)) {
          seen.add(place.id);
          rawPlaces.push(place);
        }
      }
    }

    if (!rawPlaces.length) {
      return NextResponse.json({
        shops: [],
        center,
        error: "No tire shops found within 15 miles.",
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shops: NearbyShop[] = rawPlaces.map((p: any) => {
      const shopLat: number = p.location?.latitude ?? 0;
      const shopLng: number = p.location?.longitude ?? 0;
      const distanceMeters = haversine(center!.lat, center!.lng, shopLat, shopLng);

      let photoUrl: string | null = null;
      if (p.photos?.[0]?.name) {
        photoUrl = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=200&key=${MAPS_KEY}`;
      }

      return {
        placeId: p.id ?? "",
        name: p.displayName?.text ?? "Unknown Shop",
        address: p.formattedAddress ?? "",
        lat: shopLat,
        lng: shopLng,
        rating: p.rating ?? null,
        totalRatings: p.userRatingCount ?? null,
        phone: p.nationalPhoneNumber ?? null,
        isOpen: p.regularOpeningHours?.openNow ?? null,
        weekdayDescriptions: p.regularOpeningHours?.weekdayDescriptions ?? null,
        website: p.websiteUri ?? null,
        photoUrl,
        distanceMeters,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        isVerified: false,
        isRecommended: false,
        laborEstimate: null,
      };
    });

    // Fetch verified and recommended place IDs from the database
    let verifiedIds     = new Set<string>();
    let recommendedIds  = new Set<string>();
    if (process.env.DATABASE_URL) {
      try {
        const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });
        const [vRows, rRows] = await Promise.all([
          sql`SELECT place_id FROM verified_shops`,
          sql`SELECT place_id FROM recommended_shops`,
        ]);
        verifiedIds    = new Set(vRows.map((r) => r.place_id as string));
        recommendedIds = new Set(rRows.map((r) => r.place_id as string));
        await sql.end();
      } catch {
        // Tables may not exist yet — treat all as unverified / unrecommended
      }
    }

    // Remove dealerships and auto-parts stores, then mark verified + recommended
    const filtered = shops
      .filter((s) => !isExcluded(s.name))
      .map((s) => ({
        ...s,
        isVerified:    verifiedIds.has(s.placeId),
        isRecommended: recommendedIds.has(s.placeId),
      }));

    // Sort: recommended/verified first, then tire-named shops, then by distance
    filtered.sort((a, b) => {
      const aTop = (a.isVerified || a.isRecommended) ? 0 : 1;
      const bTop = (b.isVerified || b.isRecommended) ? 0 : 1;
      if (aTop !== bTop) return aTop - bTop;
      const aTire = /tire|tyre|wheel/i.test(a.name) ? 0 : 1;
      const bTire = /tire|tyre|wheel/i.test(b.name) ? 0 : 1;
      if (aTire !== bTire) return aTire - bTire;
      return a.distanceMeters - b.distanceMeters;
    });

    const placeIds = filtered.map((s) => s.placeId).filter(Boolean);
    const estimateByPlace = new Map<string, NearbyShopLaborEstimate>();
    if (placeIds.length && process.env.DATABASE_URL) {
      try {
        const sqlConn = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });
        const rows = await sqlConn`
          SELECT place_id, installation, alignment, rotation, balancing
          FROM shop_labor_estimates
          WHERE place_id IN ${sqlConn(placeIds)}
        `;
        const asPriceStr = (x: unknown) => {
          if (x == null) return null;
          const t = String(x).trim();
          return t === "" ? null : t;
        };
        for (const r of rows) {
          estimateByPlace.set(r.place_id as string, {
            installation: asPriceStr(r.installation),
            alignment: asPriceStr(r.alignment),
            rotation: asPriceStr(r.rotation),
            balancing: asPriceStr(r.balancing),
          });
        }
        await sqlConn.end();
      } catch {
        // table may be missing until setup-db runs
      }
    }

    const shopsOut = filtered.map((s) => ({
      ...s,
      laborEstimate: estimateByPlace.get(s.placeId) ?? null,
    }));

    return NextResponse.json({ shops: shopsOut, center });
  } catch (err) {
    console.error("[nearby-shops]", err);
    return NextResponse.json(
      { shops: [], error: "Failed to find nearby shops. Please try again." },
      { status: 500 }
    );
  }
}
