/**
 * Direct Sam's Club product-search scraper.
 *
 * Sam's Club serves search results as JSON from their Vivaldi API, which is
 * publicly accessible for browsing (membership required to purchase). This
 * lets us pull real-time tire prices without relying solely on Google Shopping.
 */

import type { PriceResult } from "@/app/api/compare-prices/route";

interface SamsProduct {
  displayName?: string;
  name?: string;
  currentPrice?: { finalPrice?: number; minPrice?: number };
  salePrice?: number;
  imageUrl?: string;
  productPageUrl?: string;
  skuId?: string;
  itemNumber?: string;
  onlineInventory?: { status?: string };
  storeInventory?: { status?: string };
  shippingOptions?: { shipToHome?: boolean; freeShipping?: boolean };
}

interface SamsApiResponse {
  payload?: {
    records?: SamsProduct[];
  };
}

export async function scrapeSamsClub(
  tireSize: string,
  brand?: string,
): Promise<PriceResult[]> {
  try {
    const brandPart = brand ? `${brand} ` : "";
    const searchTerm = encodeURIComponent(`${brandPart}${tireSize} tire`);

    const url =
      `https://www.samsclub.com/api/node/vivaldi/v2/products/search` +
      `?searchTerm=${searchTerm}&pageSize=12&startIndex=0&sortKey=price&sortOrder=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.samsclub.com/",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[samsclub] API returned ${res.status}`);
      return [];
    }

    const data: SamsApiResponse = await res.json();
    const records = data?.payload?.records ?? [];

    const results: PriceResult[] = [];

    for (const item of records) {
      const title = item.displayName ?? item.name ?? "";
      if (!isTireListing(title)) continue;

      const price =
        item.currentPrice?.finalPrice ??
        item.currentPrice?.minPrice ??
        item.salePrice;

      if (!price || price <= 5) continue;

      const productPath = item.productPageUrl
        ? item.productPageUrl.startsWith("http")
          ? item.productPageUrl
          : `https://www.samsclub.com${item.productPageUrl}`
        : `https://www.samsclub.com/search?searchTerm=${searchTerm}`;

      const hasDelivery = item.shippingOptions?.shipToHome ?? false;
      const inStoreStatus = item.storeInventory?.status;
      const hasPickup =
        inStoreStatus === "IN_STOCK" || inStoreStatus === "LIMITED";

      let stockLabel: string | undefined;
      if (inStoreStatus === "LIMITED") stockLabel = "Limited stock";
      else if (hasPickup) stockLabel = "In stock";

      results.push({
        store: "Sam's Club",
        storeBrand: "sams",
        tireName: title,
        tireBrand: extractBrand(title),
        tireSize,
        condition: /\b(used|refurbished|take-?off|pull-?off)\b/i.test(title)
          ? "used"
          : "new",
        tirePrice: price,
        installPrice: null,
        total: price,
        url: productPath,
        inStock: true,
        taxIncluded: false,
        hasDelivery,
        hasPickup,
        deliveryLabel: item.shippingOptions?.freeShipping
          ? "Free shipping"
          : hasDelivery
          ? "Shipping available"
          : undefined,
        stockLabel,
      });
    }

    console.log(`[samsclub] direct scraper found ${results.length} results`);
    return results;
  } catch (err) {
    console.error("[samsclub] scraper error:", err);
    return [];
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

const TIRE_RE = [
  /\d{3}\/\d{2}[Rr]\d{2}/,
  /\btires?\b/i,
  /\btyres?\b/i,
  /\ball.season\b/i,
  /\ball.terrain\b/i,
  /\bwinter\b/i,
  /\bsummer\b/i,
  /\bp\d{3}/i,
  /\blt\d{3}/i,
];

function isTireListing(title: string): boolean {
  return TIRE_RE.some((re) => re.test(title));
}

const KNOWN_BRANDS = [
  "Michelin","BFGoodrich","Uniroyal","Goodyear","Dunlop","Kelly","Bridgestone",
  "Firestone","Continental","General","Pirelli","Yokohama","Toyo","Falken",
  "Hankook","Kumho","Cooper","Mastercraft","Nexen","Nitto","Nokian",
  "Sumitomo","GT Radial","Hercules","Ironman","Starfire","Douglas","Fuzion",
  "Sailun","Lionhart","Milestar","Radar","Wild Country","Accelera",
];

function extractBrand(title: string): string | undefined {
  const upper = title.toUpperCase();
  return KNOWN_BRANDS.find((b) => upper.includes(b.toUpperCase()));
}
