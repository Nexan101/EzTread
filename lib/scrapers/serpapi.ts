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
 * URLs: SerpAPI's free tier omits direct retailer `link` fields. For known
 * retailers we construct a direct search URL on their own site instead, so
 * "View Deal" always opens the retailer — not a Google Shopping page.
 */

import type { PriceResult } from "@/app/api/compare-prices/route";

// ── Listing quality filters ───────────────────────────────────────────────

/**
 * A listing title must reference tires/tyres or contain a size pattern to be
 * included. This blocks clothing, electronics, and other off-topic results that
 * Google Shopping occasionally surfaces for keyword reasons.
 */
function isTireRelatedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    lower.includes("tire") ||
    lower.includes("tyre") ||
    /\d{3}[/\-]\d{2}[rR]\d{2}/.test(title)   // e.g. 225/65R17 or 225-65R17
  );
}

/**
 * Store-name fragments that indicate a non-automotive retailer.
 * Only applied to "other" storeBrand — known tire chains are never blocked.
 */
const NON_TIRE_STORE_FRAGMENTS = [
  // Clothing / fashion
  "fashion", "clothing", "apparel", "wear", "boutique", "textile",
  "littlewoods", "asos", "primark", "zara", "uniqlo", "h&m",
  "shein", "boohoo", "missguided", "pretty little thing",
  // Shoes
  "shoes", "footwear", "boots store", "sneaker",
  // Beauty / personal care
  "beauty", "cosmetic", "makeup", "skincare", "hair salon",
  // Furniture / home
  "furniture", "home decor", "bedding", "mattress", "kitchenware",
  // Electronics (non-auto)
  "phone store", "laptop", "gadget",
  // Food / grocery
  "grocery", "supermarket", "food store",
  // Jewellery
  "jewelry", "jewellery", "jeweller",
];

function isBlockedStore(source: string, storeBrand: PriceResult["storeBrand"]): boolean {
  if (storeBrand !== "other") return false;  // known tire chains always pass
  const lower = source.toLowerCase();
  return NON_TIRE_STORE_FRAGMENTS.some((frag) => lower.includes(frag));
}

// ── Store brand mapping ───────────────────────────────────────────────────

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
  extensions?:               string[];       // Badges like "Limited supply", "In Stock"
}

const KNOWN_TIRE_BRANDS = [
  "Michelin", "Goodyear", "Bridgestone", "Continental", "Pirelli", "Hankook",
  "Kumho", "Falken", "Cooper", "BFGoodrich", "Yokohama", "Toyo", "Nitto",
  "General", "Nexen", "Sumitomo", "Firestone", "Mastercraft", "Zeta", "Ironman",
  "Hercules", "Sentury", "Primewell", "Landsail", "Westlake", "Accelera",
  "Multi-Mile", "Milestar", "Fuzion", "Douglas", "Uniroyal", "Dunlop",
  "Kelly", "Starfire", "GT Radial", "Radar", "Thunderer", "Arroyo",
  "RoadOne", "RoadX", "Antares", "Atlas", "Crosswind", "Sailun",
  "Lionhart", "Fullway", "Prinx", "Arizonian", "Wild Country",
];

function extractTireBrand(title: string): string | undefined {
  for (const brand of KNOWN_TIRE_BRANDS) {
    if (new RegExp(`^${brand.replace(/[-\s]/g, "[\\s\\-]")}\\b`, "i").test(title)) return brand;
  }
  for (const brand of KNOWN_TIRE_BRANDS) {
    if (new RegExp(`\\b${brand.replace(/[-\s]/g, "[\\s\\-]")}\\b`, "i").test(title)) return brand;
  }
  return undefined;
}

function parseDelivery(delivery: string | undefined): {
  taxIncluded: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  deliveryLabel: string | undefined;
} {
  if (!delivery) {
    return { taxIncluded: false, hasDelivery: false, hasPickup: false, deliveryLabel: undefined };
  }
  const lower = delivery.toLowerCase();
  const taxIncluded = lower.includes("tax");
  const hasPickup = lower.includes("pickup") || lower.includes("pick up") || lower.includes("in-store");
  const hasDelivery = lower.includes("delivery") || lower.includes("shipping");
  const label = delivery
    .split(/[·•,]/)
    .map((s) => s.trim())
    .filter((s) => !s.toLowerCase().includes("tax"))
    .join(" · ")
    .trim() || undefined;
  return { taxIncluded, hasDelivery, hasPickup, deliveryLabel: label };
}

function detectCondition(
  title: string,
  searchCondition: string | undefined,
): "new" | "used" {
  const lower = title.toLowerCase();
  // Explicit used signals in the title
  if (
    lower.includes("used") ||
    lower.includes("pre-owned") ||
    lower.includes("preowned") ||
    lower.includes("take-off") ||
    lower.includes("takeoff") ||
    lower.includes("take off") ||
    lower.includes("pull-off") ||
    lower.includes("pulloff")
  ) return "used";
  // Explicit new signals
  if (lower.startsWith("new ") || lower.includes(" new ") || lower.includes("(new)")) return "new";
  // Fall back to whatever the user searched for
  return searchCondition === "used" ? "used" : "new";
}

/**
 * Extract a mileage warranty figure from a product title.
 * e.g. "65,000-Mile Warranty" → "65,000 mi"
 *      "60K Mile Warranty"    → "60K mi"
 */
function extractMileWarranty(title: string): string | undefined {
  // Match e.g. "65,000-mile", "60,000 mile", "65k-mile", "50K mile"
  const m = title.match(/(\d[\d,]*\s*[Kk]?)\s*[-–]?\s*[Mm]ile\b/);
  if (!m) return undefined;
  const raw = m[1].trim();
  return `${raw} mi`;
}

/** Maps common terrain descriptors found in tire titles to a clean label. */
function extractTerrain(title: string): string | undefined {
  if (/\bA\/T\b|All[\s-]Terrain/i.test(title))  return "All-Terrain";
  if (/\bM\/T\b|Mud[\s-]Terrain/i.test(title))  return "Mud-Terrain";
  if (/\bA\/W\b|All[\s-]Weather/i.test(title))  return "All-Weather";
  if (/\bA\/S\b|All[\s-]Season/i.test(title))   return "All-Season";
  if (/\bH\/T\b|Highway[\s-]Terrain/i.test(title)) return "Highway";
  if (/\bwinter\b|\bsnow\b/i.test(title))        return "Winter";
  if (/\bsummer\b/i.test(title))                 return "Summer";
  if (/\bperformance\b/i.test(title))            return "Performance";
  return undefined;
}

/** Returns true if the title references a run-flat tire. */
function extractRunFlat(title: string): boolean {
  return /run[\s-]?flat|\brft\b|\brof\b/i.test(title);
}

function extractStockLabel(extensions: string[] | undefined): string | undefined {
  if (!extensions) return undefined;
  for (const ext of extensions) {
    const lower = ext.toLowerCase();
    if (
      lower.includes("limited") || lower.includes("only") || lower.includes(" left") ||
      lower.includes("in stock") || lower.includes("available") || lower.match(/\d+\s*(in stock|available)/)
    ) {
      return ext;
    }
  }
  return undefined;
}

interface SerpApiResponse {
  shopping_results?: SerpShoppingResult[];
  error?:            string;
}

/**
 * Build a direct search URL on the retailer's own website for a given tire size.
 * Falls back to the SerpAPI-provided URL (Google Shopping page) for unknown stores.
 */
function buildRetailerUrl(
  storeBrand: PriceResult["storeBrand"],
  tireSize: string,
  fallback: string,
): string {
  // Parse 235/60R18 → { width: "235", ratio: "60", diameter: "18" }
  const m = tireSize.match(/^(\d{3})\/(\d{2})[Rr](\d{2})$/);
  if (!m) return fallback;
  const [, width, ratio, diameter] = m;
  const slug  = `${width}-${ratio}r${diameter}`;           // 235-60r18
  const query = encodeURIComponent(`${tireSize} tire`);    // 235%2F60R18+tire

  switch (storeBrand) {
    case "discounttire":
      return `https://www.discounttire.com/tires/${slug}`;
    case "tirerack":
      return `https://www.tirerack.com/tires/TireSearchResults.jsp` +
             `?displayWidth=${width}&displayRatio=${ratio}&displayDiameter=${diameter}&inchSize=${diameter}`;
    case "simpletire":
      return `https://www.simpletire.com/search?q=${encodeURIComponent(tireSize)}`;
    case "walmart":
      return `https://www.walmart.com/search?q=${query}`;
    case "sams":
      return `https://www.samsclub.com/search?searchTerm=${query}`;
    case "costco":
      return `https://www.costco.com/CatalogSearch?dept=All&keyword=${query}`;
    case "pepboys":
      return `https://www.pepboys.com/tires/size/${width}/${ratio}/${diameter}`;
    case "target":
      return `https://www.target.com/s?searchTerm=${query}`;
    default:
      return fallback; // unknown retailer — keep whatever SerpAPI gave us
  }
}

/**
 * Scrape Google Shopping for tire prices.
 *
 * Runs multiple queries in parallel — a broad local query plus retailer-specific
 * queries — so major stores like Discount Tire always appear in results.
 * All results are merged and deduplicated by source (cheapest kept).
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

  // Run a broad local query plus targeted queries for major retailers that don't
  // always surface in general Google Shopping results.
  const queries = [
    // Broad location-aware search — catches most retailers
    `${conditionLabel} ${brandPart}${tireSize} tires near ${zipCode}`,
    // Retailer-specific queries to guarantee major stores appear
    `Discount Tire ${conditionLabel} ${brandPart}${tireSize} tire`,
    `Tire Rack ${conditionLabel} ${brandPart}${tireSize} tire`,
    `SimpleTire ${conditionLabel} ${brandPart}${tireSize} tire`,
    `Sam's Club ${conditionLabel} ${brandPart}${tireSize} tire`,
    `Costco ${conditionLabel} ${brandPart}${tireSize} tire`,
  ];

  function buildParams(q: string): string {
    return new URLSearchParams({
      engine:  "google_shopping",
      q,
      gl:      "us",
      hl:      "en",
      num:     "20",
      api_key: apiKey as string,
    }).toString();
  }

  const responses = await Promise.all(
    queries.map((q) =>
      fetch(`https://serpapi.com/search.json?${buildParams(q)}`, { next: { revalidate: 0 } })
        .then((r) => r.json() as Promise<SerpApiResponse>)
        .catch((err) => {
          console.error(`[serpapi] query failed ("${q}"):`, err);
          return { shopping_results: [] } as SerpApiResponse;
        })
    )
  );

  // Verify at least the primary query succeeded
  const primary = responses[0];
  if (primary.error) {
    console.error("[serpapi] API error:", primary.error);
    throw new Error(primary.error);
  }

  // Merge all results; deduplicate by source — keep the cheapest per store
  const bySource = new Map<string, PriceResult>();

  for (const data of responses) {
    const raw = data.shopping_results ?? [];

    for (const item of raw) {
      const source = item.source ?? "";
      if (!source) continue;

      const tirePrice = item.extracted_price ?? 0;
      if (tirePrice <= 5) continue;

      const title = item.title ?? "";
      if (!title) continue;

      const fallbackUrl = item.link ?? item.product_link ?? "";
      if (!fallbackUrl) continue;

      const storeBrand = resolveStoreBrand(source);

      // Drop listings whose title isn't clearly about tires (e.g. clothing results)
      if (!isTireRelatedTitle(title)) continue;

      // Drop known non-automotive "other" stores (e.g. clothing retailers)
      if (isBlockedStore(source, storeBrand)) continue;

      const store = BRAND_DISPLAY[storeBrand] !== "Online Retailer"
        ? BRAND_DISPLAY[storeBrand]
        : source;

      // Always link to the retailer's own site, not a Google Shopping page
      const url = buildRetailerUrl(storeBrand, tireSize, fallbackUrl);

      // Keep only the cheapest listing per source
      const existing = bySource.get(source);
      if (existing && existing.tirePrice <= tirePrice) continue;

      const { taxIncluded, hasDelivery, hasPickup, deliveryLabel } = parseDelivery(item.delivery);
      const stockLabel = extractStockLabel(item.extensions);

      bySource.set(source, {
        store,
        storeBrand,
        tireName:      title,
        tireBrand:     extractTireBrand(title),
        condition:     detectCondition(title, condition),
        tirePrice,
        installPrice:  null,
        total:         tirePrice,
        url,
        inStock:       true,
        taxIncluded,
        hasDelivery,
        hasPickup,
        deliveryLabel,
        stockLabel,
        note:          item.delivery ?? undefined,
        mileWarranty:  extractMileWarranty(title) || undefined,
        terrain:       extractTerrain(title)      || undefined,
        runFlat:       extractRunFlat(title)      || undefined,
      });
    }
  }

  const results = Array.from(bySource.values());
  console.log(`[serpapi] ${results.length} results after merge+dedup (sources: ${[...bySource.keys()].join(", ")})`);
  return results;
}
