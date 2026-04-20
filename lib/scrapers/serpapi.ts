/**
 * Google Shopping scraper via SerpAPI.
 *
 * SerpAPI handles all the actual web scraping — it fetches Google Shopping
 * results and returns structured JSON. Results are consistent, fast (~1-2s),
 * and never break due to retailer site changes.
 *
 * Pricing: free tier = 100 searches/month.
 *          Paid plans start at $50/month for 5,000 searches.
 *
 * Docs: https://serpapi.com/google-shopping-api
 *
 * NOTE on URLs: On the free/trial tier, SerpAPI does not return direct retailer
 * `link` fields. We fall back to `product_link` (a Google Shopping page) which
 * still lets users click through and compare. Upgrade to a paid plan to get
 * direct retailer URLs.
 */

import type { PriceResult } from "@/app/api/compare-prices/route";

// Maps a lowercase source string fragment → our storeBrand enum value
const SOURCE_TO_BRAND: Array<[string, PriceResult["storeBrand"]]> = [
  ["discount tire",   "discounttire"],
  ["discounttire",    "discounttire"],
  ["costco",          "costco"],
  ["sam's club",      "sams"],
  ["sams club",       "sams"],
  ["walmart",         "walmart"],
  ["tire rack",       "tirerack"],
  ["tirerack",        "tirerack"],
  ["pep boys",        "pepboys"],
  ["pepboys",         "pepboys"],
  ["simpletire",      "simpletire"],
  ["simple tire",     "simpletire"],
  ["target",          "target"],
];

// Pretty display name for each brand
const BRAND_DISPLAY: Record<PriceResult["storeBrand"], string> = {
  walmart:      "Walmart",
  sams:         "Sam's Club",
  discounttire: "Discount Tire",
  costco:       "Costco",
  target:       "Target",
  tirerack:     "Tire Rack",
  pepboys:      "Pep Boys",
  simpletire:   "SimpleTire",
  other:        "Online Retailer",
};

function resolveStoreBrand(source: string): PriceResult["storeBrand"] {
  const lower = source.toLowerCase().trim();
  for (const [key, brand] of SOURCE_TO_BRAND) {
    if (lower.includes(key)) return brand;
  }
  return "other";
}

interface SerpShoppingResult {
  title?:                    string;
  link?:                     string;         // Direct retailer URL (paid plans only)
  product_link?:             string;         // Google Shopping page (always present)
  source?:                   string;
  price?:                    string;
  extracted_price?:          number;
  delivery?:                 string;
  thumbnail?:                string;
}

interface SerpApiResponse {
  shopping_results?: SerpShoppingResult[];
  error?:            string;
}

/**
 * Scrape Google Shopping for tire prices.
 *
 * @param tireSize  e.g. "245/45R18"
 * @param zipCode   US zip code or city/state string for location context
 * @param brand     Optional tire brand preference (e.g. "Michelin")
 * @param condition "new" | "used"
 */
export async function scrapeGoogleShopping(
  tireSize: string,
  zipCode: string,
  brand?: string,
  condition?: string,
): Promise<PriceResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY environment variable is not set.");
  }

  const conditionLabel = condition === "used" ? "used" : "new";
  const brandPart = brand ? `${brand} ` : "";
  // Embed location in the query for localization (zip/city codes work fine here)
  const query = `${conditionLabel} ${brandPart}${tireSize} tires near ${zipCode}`;

  const params = new URLSearchParams({
    engine:  "google_shopping",
    q:       query,
    gl:      "us",
    hl:      "en",
    num:     "40",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[serpapi] HTTP error:", res.status, text.slice(0, 200));
    throw new Error(`SerpAPI returned ${res.status}`);
  }

  const data: SerpApiResponse = await res.json();

  if (data.error) {
    console.error("[serpapi] API error:", data.error);
    throw new Error(data.error);
  }

  const raw = data.shopping_results ?? [];
  console.log(`[serpapi] ${raw.length} raw results`);

  // Deduplicate: one result per source/store name (keep the cheapest)
  const bySource = new Map<string, PriceResult>();

  for (const item of raw) {
    const source = item.source ?? "";
    if (!source) continue;

    const tirePrice = item.extracted_price ?? 0;
    if (tirePrice <= 5) continue;

    const title = item.title ?? "";
    if (!title) continue;

    // Use direct retailer link if available; fall back to Google Shopping page
    const url = item.link ?? item.product_link ?? "";
    if (!url) continue;

    const storeBrand = resolveStoreBrand(source);
    const store = BRAND_DISPLAY[storeBrand] !== "Online Retailer"
      ? BRAND_DISPLAY[storeBrand]
      : source; // Show actual retailer name for "other" stores

    // Keep the cheapest result per source
    const existing = bySource.get(source);
    if (existing && existing.tirePrice <= tirePrice) continue;

    bySource.set(source, {
      store,
      storeBrand,
      tireName:     title,
      tirePrice,
      installPrice: null,
      total:        tirePrice,
      url,
      inStock:      true,
      note:         item.delivery ?? undefined,
    });
  }

  const results = Array.from(bySource.values());
  console.log(`[serpapi] ${results.length} results after dedup (sources: ${[...bySource.keys()].join(", ")})`);
  return results;
}
