import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/utils/rateLimit";
import { scrapeGoogleShopping } from "@/lib/scrapers/serpapi";
import { scrapeSamsClub } from "@/lib/scrapers/samsClub";

// Allow extra time for parallel scraping (Google Shopping + direct scrapers)
export const maxDuration = 20;

export interface PriceResult {
  store: string;
  storeBrand: "costco" | "walmart" | "sams" | "target" | "discounttire" | "tirerack" | "pepboys" | "simpletire" | "other";
  tireName: string;
  tireBrand?: string;
  tireSize?: string;
  condition: "new" | "used";
  tirePrice: number;
  installPrice: number | null;
  total: number;
  url: string;
  inStock: boolean;
  thumbnail?: string;
  taxIncluded?: boolean;
  hasDelivery?: boolean;
  hasPickup?: boolean;
  deliveryLabel?: string;
  stockLabel?: string;
  note?: string;
  mileWarranty?: string;
  terrain?: string;
  runFlat?: boolean;
}

export interface ComparePricesResponse {
  results: PriceResult[];
  zipCode: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  // 10 requests per IP per minute — scraping is cheap but still rate-limit for safety
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json(
      { results: [], zipCode: "", error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const { zipCode, tireSize, condition, brand } = await req.json();

    if (!tireSize || !zipCode) {
      return NextResponse.json(
        { results: [], zipCode, error: "Tire size and zip code are required." },
        { status: 400 }
      );
    }

    const cleanSize  = tireSize.trim();
    const cleanBrand = brand?.trim() || undefined;

    // Run Google Shopping scraper and Sam's Club direct scraper in parallel
    const [serpResults, samsResults] = await Promise.all([
      scrapeGoogleShopping(cleanSize, zipCode, cleanBrand, condition),
      scrapeSamsClub(cleanSize, cleanBrand),
    ]);

    // Merge: prefer Sam's Club direct result over a Google Shopping hit for
    // the same store (direct prices are more accurate and link to the product).
    const samsFromSerp = serpResults.filter((r) => r.storeBrand !== "sams");
    const directSams   = samsResults.length > 0 ? samsResults : serpResults.filter((r) => r.storeBrand === "sams");
    let results = [...samsFromSerp, ...directSams];

    // If the user requested a specific brand, drop any result whose title
    // doesn't contain that brand name. Google Shopping sometimes returns
    // off-brand results when a brand query is used.
    if (cleanBrand) {
      const brandLower = cleanBrand.toLowerCase();
      results = results.filter(
        (r) =>
          r.tireName.toLowerCase().includes(brandLower) ||
          r.tireBrand?.toLowerCase() === brandLower
      );
    }

    // Costco does not list tire prices on Google Shopping — always inject a
    // "See pricing" card so users know to check there, unless a real Costco
    // price somehow surfaced from the search.
    const hasCostco = results.some((r) => r.storeBrand === "costco");
    if (!hasCostco) {
      const m = cleanSize.match(/^(\d{3})\/(\d{2})[Rr](\d{2})$/);
      const costcoUrl = m
        ? `https://www.costco.com/tires.html`
        : `https://www.costco.com/CatalogSearch?dept=All&keyword=${encodeURIComponent(cleanSize + " tire")}`;
      results.push({
        store: "Costco",
        storeBrand: "costco",
        tireName: `${cleanSize} tires — members-only pricing`,
        tireSize: cleanSize,
        condition: "new",
        tirePrice: 0,
        installPrice: null,
        total: 0,
        url: costcoUrl,
        inStock: true,
        hasPickup: true,
        note: "Costco tire prices are only available in-store or on Costco.com (membership required). Click to view current pricing.",
      });
    }

    if (results.filter((r) => r.tirePrice > 0).length === 0) {
      return NextResponse.json({
        results: [],
        zipCode,
        error: "No prices found for that tire size. Try a different size or check back later.",
      });
    }

    // Sort: real prices (cheapest first), then $0 placeholder cards last
    results.sort((a, b) => {
      if (a.tirePrice === 0 && b.tirePrice > 0) return 1;
      if (b.tirePrice === 0 && a.tirePrice > 0) return -1;
      return a.total - b.total;
    });

    return NextResponse.json({ results, zipCode } satisfies ComparePricesResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[compare-prices] Error:", message);
    return NextResponse.json(
      {
        results: [],
        zipCode: "",
        error: "Unable to fetch prices right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
