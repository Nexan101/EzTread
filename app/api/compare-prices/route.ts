import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/utils/rateLimit";
import { scrapeGoogleShopping } from "@/lib/scrapers/serpapi";

// Google Shopping scraping is fast (~1-2s) — 15s is plenty
export const maxDuration = 15;

export interface PriceResult {
  store: string;
  storeBrand: "costco" | "walmart" | "sams" | "target" | "discounttire" | "tirerack" | "pepboys" | "simpletire" | "other";
  tireName: string;
  tirePrice: number;
  installPrice: number | null;
  total: number;
  url: string;
  inStock: boolean;
  note?: string;
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

    const results = await scrapeGoogleShopping(
      tireSize.trim(),
      zipCode,
      brand?.trim() || undefined,
      condition,
    );

    if (!results.length) {
      return NextResponse.json({
        results: [],
        zipCode,
        error: "No prices found for that tire size. Try a different size or check back later.",
      });
    }

    // Sort cheapest first
    results.sort((a, b) => a.total - b.total);

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
