"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import type { PriceResult } from "@/app/api/compare-prices/route";
import type { NearbyShop, NearbyShopLaborEstimate } from "@/app/api/nearby-shops/route";
import { useLocation } from "@/contexts/LocationContext";

type TireCondition = "new" | "used";
type Phase = "form" | "loading" | "results" | "shops" | "error";

interface LaborService { id: string; label: string; desc: string }
interface FormErrors { address?: string; tireSize?: string; selection?: string; gps?: string }
interface GpsLocation { city: string; state: string; display: string }
// Accepts: 225/65R17, 225/65r17, 225/65/17, 225-65-17, 225-65R17
const TIRE_SIZE_REGEX = /^\d{3}[\/\-]\d{2}[Rr\/\-]\d{2}$/;

function normalizeTireSize(raw: string): string {
  // Uppercase, strip spaces
  let s = raw.trim().toUpperCase().replace(/\s+/g, "");
  // Replace dash separators with slash:  225-65R17 → 225/65R17
  s = s.replace(/^(\d{3})-(\d{2})-([Rr]?\d{2})$/, "$1/$2/$3");
  // Replace trailing /17 (slash+digits) with R17:  225/65/17 → 225/65R17
  s = s.replace(/^(\d{3}\/\d{2})\/(\d{2})$/, "$1R$2");
  // Ensure the R is uppercase (already done above via toUpperCase)
  return s;
}
const POPULAR_SIZES   = ["225/65R17", "235/60R18", "245/70R17", "205/55R16"];
const POPULAR_BRANDS  = ["Michelin", "Goodyear", "Bridgestone", "Continental", "Pirelli", "Hankook"];

const LABOR_SERVICES: LaborService[] = [
  { id: "rotation",     label: "Rotation",     desc: "Even tread wear" },
  { id: "balance",      label: "Balance",      desc: "Smooth ride" },
  { id: "alignment",    label: "Alignment",    desc: "Straight tracking" },
  { id: "installation", label: "Installation", desc: "Mount & fit" },
];

/** Show admin-entered text as-is with a single leading $ when missing (not parsed as min/max). */
function laborPriceLabel(v: string | null | undefined): string {
  if (v == null || !String(v).trim()) return "Prices TBD";
  const s = String(v).trim();
  return s.startsWith("$") ? s : `$${s}`;
}

function laborHasAnyEstimate(estimate: NearbyShopLaborEstimate | null): boolean {
  if (!estimate) return false;
  return [estimate.installation, estimate.alignment, estimate.rotation, estimate.balancing].some(
    (x) => x != null && String(x).trim() !== ""
  );
}

const STORE_META: Record<string, { color: string; bg: string; abbr: string }> = {
  costco:        { color: "#005DAA", bg: "#EBF3FB", abbr: "C"  },
  walmart:       { color: "#0071CE", bg: "#EBF4FF", abbr: "W"  },
  sams:          { color: "#0067A0", bg: "#EAF2F8", abbr: "S"  },
  target:        { color: "#CC0000", bg: "#FBEAEA", abbr: "T"  },
  discounttire:  { color: "#E31837", bg: "#FCEAED", abbr: "DT" },
  tirerack:      { color: "#1A3A6B", bg: "#EAF0F9", abbr: "TR" },
  pepboys:       { color: "#D62828", bg: "#FCEAEA", abbr: "PB" },
  simpletire:    { color: "#2563EB", bg: "#EEF3FF", abbr: "ST" },
  other:         { color: "#555555", bg: "#F2F2F2", abbr: "•"  },
};


export default function SearchWidget() {
  // Form state — location
  const [address, setAddress]     = useState("");
  const [tireActive, setTireActive] = useState(true);
  const [condition, setCondition] = useState<TireCondition>("new");
  const [tireSize, setTireSize]   = useState("");
  const [brand, setBrand]         = useState("");
  const [laborActive, setLaborActive] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [errors, setErrors]       = useState<FormErrors>({});

  // Location mode: "manual" = typed fields, "gps" = device GPS
  const [locationMode, setLocationMode]   = useState<"manual" | "gps">("manual");
  const [gpsLocation, setGpsLocation]     = useState<GpsLocation | null>(null);
  const [gpsResolving, setGpsResolving]   = useState(false);

  // Location context
  const { coords, status, requestLocation } = useLocation();

  // When GPS coords arrive while in GPS mode, reverse-geocode them
  useEffect(() => {
    if (locationMode !== "gps" || !coords) return;
    if (gpsLocation) return; // already resolved
    async function resolve() {
      setGpsResolving(true);
      try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords!.lat},${coords!.lng}&key=${key}`
        );
        const data = await res.json();
        if (data.status === "OK" && data.results?.[0]) {
          const parts = data.results[0].address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
          const city  = parts.find((c) => c.types.includes("locality"))?.long_name ?? "";
          const st    = parts.find((c) => c.types.includes("administrative_area_level_1"))?.short_name ?? "";
          const zip   = parts.find((c) => c.types.includes("postal_code"))?.long_name ?? "";
          setGpsLocation({ city, state: st, display: [city, st, zip].filter(Boolean).join(", ") });
          setErrors((p) => ({ ...p, gps: undefined }));
        } else {
          setErrors((p) => ({ ...p, gps: "Couldn't resolve your location — try entering it manually." }));
        }
      } catch {
        setErrors((p) => ({ ...p, gps: "Couldn't resolve your location — try entering it manually." }));
      } finally {
        setGpsResolving(false);
      }
    }
    resolve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, locationMode]);

  // Results state
  const [phase, setPhase]         = useState<Phase>("form");
  const [results, setResults]     = useState<PriceResult[]>([]);
  const [shops, setShops]         = useState<NearbyShop[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [apiError, setApiError]   = useState("");
  const [searchMeta, setSearchMeta] = useState<{ tireSize: string; location: string; condition: TireCondition } | null>(null);

  // Shop filter state
  const [shopSearch, setShopSearch]         = useState("");
  const [filterOpenNow, setFilterOpenNow]   = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [filterMaxInstall, setFilterMaxInstall]     = useState(0);
  const [filterMaxAlignment, setFilterMaxAlignment] = useState(0);
  const [filterMaxRotation, setFilterMaxRotation]   = useState(0);
  const [filterMaxBalancing, setFilterMaxBalancing] = useState(0);
  const [filterMaxMiles, setFilterMaxMiles]         = useState(15);


  function toggleService(id: string) {
    // Deactivate tires when a labor service is selected
    setTireActive(false);
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!laborActive) setLaborActive(true);
    if (errors.selection) setErrors((p) => ({ ...p, selection: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};

    if (locationMode === "gps") {
      if (gpsResolving) errs.gps = "Still detecting your location — please wait a moment.";
      else if (!gpsLocation) errs.gps = "Location not available. Please enter your address manually.";
    } else {
      if (!address.trim()) errs.address = "Enter your address or zip code";
    }

    // Exactly one side must be active
    if (!tireActive && selectedServices.size === 0)
      errs.selection = "Select either Tires or a Labor service to continue";

    // Tire size is only required when the Tires column is active
    if (tireActive) {
      if (!tireSize.trim()) {
        errs.tireSize = "Enter a tire size to compare prices";
      } else {
        const normalized = normalizeTireSize(tireSize);
        if (!TIRE_SIZE_REGEX.test(normalized)) {
          errs.tireSize = "Use format 225/65R17";
        } else {
          setTireSize(normalized);
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setPhase("loading");

    // Build location info based on which mode the user chose
    const locationStr = locationMode === "gps" && gpsLocation
      ? gpsLocation.display
      : address.trim();

    // ── Labor-only: find nearby shops ──────────────────────────────────────
    if (!tireActive && selectedServices.size > 0) {
      try {
        const body: Record<string, unknown> =
          locationMode === "gps" && coords
            ? { lat: coords.lat, lng: coords.lng }
            : { zipCode: address.trim() };

        const res = await fetch("/api/nearby-shops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.error && !data.shops?.length) {
          setApiError(data.error);
          setPhase("error");
        } else {
          setShops(data.shops ?? []);
          setVisibleCount(6);
          setPhase("shops");
        }
      } catch {
        setApiError("Network error — please try again.");
        setPhase("error");
      }
      return;
    }

    // ── Tires (with optional labor): compare prices ────────────────────────
    setSearchMeta({ tireSize: tireSize.trim(), location: locationStr, condition });
    try {
      const res = await fetch("/api/compare-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: locationStr,   // resolved location string gives AI context
          tireSize: tireSize.trim(),
          condition,
          brand: brand.trim() || undefined,
          services: selectedServices.size > 0 ? [...selectedServices] : undefined,
        }),
      });

      const data = await res.json();
      if (data.error && data.results?.length === 0) {
        setApiError(data.error);
        setPhase("error");
      } else {
        setResults(data.results ?? []);
        setPhase("results");
      }
    } catch {
      setApiError("Network error — please try again.");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("form");
    setResults([]);
    setShops([]);
    setApiError("");
    setSearchMeta(null);
    setAddress("");
    setShopSearch("");
    setFilterOpenNow(false);
    setFilterVerified(false);
    setFilterMinRating(0);
    setFilterMaxInstall(0);
    setFilterMaxAlignment(0);
    setFilterMaxRotation(0);
    setFilterMaxBalancing(0);
    setFilterMaxMiles(15);
  }

  function handleUseCurrentLocation() {
    setLocationMode("gps");
    setGpsLocation(null);
    setErrors((p) => ({ ...p, state: undefined, city: undefined, zipCode: undefined, gps: undefined }));
    if (status !== "granted" || !coords) {
      requestLocation();
    }
  }

  /* ─────────────────────────────── LOADING ─────────────────────────────── */
  if (phase === "loading") {
    return (
      <section id="search" className="py-24 bg-[#f5f5f7]">
        <div className="max-w-xl mx-auto px-5 text-center">
          <div className="bg-white rounded-3xl border border-[#d2d2d7] px-10 py-16 shadow-sm">
            {/* Animated tire spinner */}
            <div className="relative w-20 h-20 mx-auto mb-7">
              <div className="absolute inset-0 rounded-full border-4 border-[#f5f5f7]" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#f97316] animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-[#e5e5ea]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  <path strokeLinecap="round" strokeWidth={2} d="M12 5v2M12 17v2M5 12H7M17 12h2" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">Scanning prices…</h3>
            <p className="text-[#6e6e73] text-[15px] mb-6">
              Searching <span className="font-semibold text-[#f97316]">{searchMeta?.tireSize}</span> near{" "}
              <span className="font-semibold text-[#1d1d1f]">{searchMeta?.location}</span>
            </p>
            <p className="text-sm font-semibold text-[#a1a1a6] animate-pulse">
              Looking Through Stores…
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ─────────────────────────────── ERROR ───────────────────────────────── */
  if (phase === "error") {
    return (
      <section id="search" className="py-24 bg-[#f5f5f7]">
        <div className="max-w-xl mx-auto px-5 text-center">
          <div className="bg-white rounded-3xl border border-[#d2d2d7] px-10 py-14 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">No Results Found</h3>
            <p className="text-[#6e6e73] text-[15px] mb-6">{apiError}</p>
            <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:text-[#ea6b0f] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Try a different search
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ─────────────────────────────── SHOPS (labor-only) ─────────────────── */
  if (phase === "shops") {
    const serviceLabels = LABOR_SERVICES.filter((s) => selectedServices.has(s.id)).map((s) => s.label);

    const activeFilterCount =
      (filterOpenNow ? 1 : 0) +
      (filterVerified ? 1 : 0) +
      (filterMinRating > 0 ? 1 : 0) +
      (filterMaxInstall > 0 ? 1 : 0) +
      (filterMaxAlignment > 0 ? 1 : 0) +
      (filterMaxRotation > 0 ? 1 : 0) +
      (filterMaxBalancing > 0 ? 1 : 0) +
      (filterMaxMiles < 15 ? 1 : 0);

    const filteredShops = shops.filter((shop) => {
      if (shopSearch && !shop.name.toLowerCase().includes(shopSearch.toLowerCase()) &&
          !shop.address.toLowerCase().includes(shopSearch.toLowerCase())) return false;
      if (filterOpenNow && shop.isOpen !== true) return false;
      if (filterVerified && !shop.isVerified) return false;
      if (filterMinRating > 0 && (shop.rating == null || shop.rating < filterMinRating)) return false;
      const checkPrice = (max: number, val: string | null | undefined) => {
        if (max === 0 || !val) return true;
        const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
        return isNaN(num) || num <= max;
      };
      if (!checkPrice(filterMaxInstall, shop.laborEstimate?.installation)) return false;
      if (!checkPrice(filterMaxAlignment, shop.laborEstimate?.alignment)) return false;
      if (!checkPrice(filterMaxRotation, shop.laborEstimate?.rotation)) return false;
      if (!checkPrice(filterMaxBalancing, shop.laborEstimate?.balancing)) return false;
      if (shop.distanceMeters != null) {
        const shopMiles = shop.distanceMeters / 1609.34;
        if (shopMiles > filterMaxMiles) return false;
      }
      return true;
    });

    return (
      <section id="search" className="pt-6 pb-12 bg-[#f5f5f7]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">

          {/* Compact header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            {/* Title */}
            <div className="shrink-0">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-0.5">Nearby Shops</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-[#1d1d1f]">Shops Near You</h2>
                <span className="text-sm text-[#6e6e73]">
                  Within {filterMaxMiles} mi · <span className="font-semibold text-[#f97316]">{filteredShops.length}</span>{filteredShops.length !== shops.length ? ` of ${shops.length}` : ""} shops
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {serviceLabels.map((l) => (
                  <span key={l} className="text-xs font-semibold bg-[#f97316]/10 text-[#f97316] px-2.5 py-1 rounded-full">{l}</span>
                ))}
              </div>
            </div>

            {/* Search bar — centre of the header */}
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder="Search by shop name or area…"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#d2d2d7] text-[14px] text-[#1d1d1f] placeholder-[#a1a1a6] shadow-sm focus:outline-none focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] transition-all"
                suppressHydrationWarning
              />
            </div>

            {/* New Search button */}
            <button
              onClick={reset}
              className="shrink-0 flex items-center gap-2 text-sm font-semibold text-[#6e6e73] hover:text-[#1d1d1f] bg-white border border-[#e5e5ea] px-4 py-2.5 rounded-xl transition-all hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              New Search
            </button>
          </div>

          {/* Trust callout */}
          <div className="flex items-start gap-3 bg-white border border-green-200 rounded-2xl px-4 py-3 shadow-sm mb-5">
            <div className="mt-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              <span className="font-semibold text-green-700">Verified shops</span> have prices &amp; estimates confirmed directly with EzTread — what you see is what you pay.{" "}
              <span className="font-semibold text-orange-600">⭐ Recommended</span> shops are hand-picked by our team for quality and reliability.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-6 items-start">

            {/* ── Left filter panel ── */}
            <div className="w-72 shrink-0 space-y-4 sticky top-24">

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">Filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setFilterOpenNow(false); setFilterVerified(false); setFilterMinRating(0); setFilterMaxInstall(0); setFilterMaxAlignment(0); setFilterMaxRotation(0); setFilterMaxBalancing(0); setFilterMaxMiles(15); }}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Status */}
                <div>
                  <p className="text-[12px] font-semibold text-[#1d1d1f] mb-2">Status</p>
                  <div className="space-y-2">
                    {[
                      { label: "Open Now", state: filterOpenNow, set: setFilterOpenNow },
                      { label: "Verified Only", state: filterVerified, set: setFilterVerified },
                    ].map(({ label, state: s, set }) => (
                      <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => set(!s)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${s ? "bg-[#f97316] border-[#f97316]" : "border-[#d2d2d7] group-hover:border-[#f97316]/60"}`}
                        >
                          {s && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-[13px] text-[#1d1d1f]" onClick={() => set(!s)}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Distance slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-semibold text-[#1d1d1f]">Distance</p>
                    <span className="text-[12px] font-bold text-[#f97316]">
                      {filterMaxMiles === 1 ? "1 mile" : `${filterMaxMiles} miles`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={filterMaxMiles}
                    onChange={(e) => setFilterMaxMiles(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#f97316] bg-[#e5e5ea]"
                    style={{
                      background: `linear-gradient(to right, #f97316 ${((filterMaxMiles - 1) / 14) * 100}%, #e5e5ea ${((filterMaxMiles - 1) / 14) * 100}%)`
                    }}
                    suppressHydrationWarning
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[#a1a1a6]">1 mi</span>
                    <span className="text-[10px] text-[#a1a1a6]">15 mi</span>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <p className="text-[12px] font-semibold text-[#1d1d1f] mb-2">Minimum Rating</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[0, 3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setFilterMinRating(r)}
                        className={`py-1.5 px-2 rounded-xl text-[12px] font-semibold border transition-all ${filterMinRating === r ? "bg-[#f97316] border-[#f97316] text-white" : "border-[#e5e5ea] text-[#6e6e73] hover:border-[#f97316]/50 hover:text-[#f97316]"}`}
                      >
                        {r === 0 ? "Any" : `${r}+ ★`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service price ranges */}
                <div>
                  <p className="text-[12px] font-semibold text-[#1d1d1f] mb-3">Budget by Service</p>
                  <div className="space-y-3">
                    {[
                      { label: "Installation", val: filterMaxInstall, set: setFilterMaxInstall, opts: [0, 25, 50, 100] },
                      { label: "Alignment",    val: filterMaxAlignment, set: setFilterMaxAlignment, opts: [0, 50, 100, 150] },
                      { label: "Rotation",     val: filterMaxRotation,  set: setFilterMaxRotation,  opts: [0, 20, 40, 60]  },
                      { label: "Balancing",    val: filterMaxBalancing, set: setFilterMaxBalancing, opts: [0, 15, 30, 50]  },
                    ].map(({ label, val, set, opts }) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold text-[#6e6e73] mb-1.5">{label}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {opts.map((p) => (
                            <button
                              key={p}
                              onClick={() => set(p)}
                              className={`py-1 px-1 rounded-lg text-[11px] font-semibold border transition-all ${val === p ? "bg-[#f97316] border-[#f97316] text-white" : "border-[#e5e5ea] text-[#6e6e73] hover:border-[#f97316]/50 hover:text-[#f97316]"}`}
                            >
                              {p === 0 ? "Any" : `≤$${p}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <p className="text-[11px] text-[#a1a1a6] text-center pt-1">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
                  </p>
                )}
              </div>
            </div>

            {/* ── Right: shop cards ── */}
            <div className="flex-1 min-w-0">
              {shops.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#d2d2d7] px-10 py-14 text-center shadow-sm">
                  <p className="text-xl font-bold text-[#1d1d1f] mb-2">No shops found nearby</p>
                  <p className="text-[#6e6e73] mb-6">Try a different address or expand your search.</p>
                  <button onClick={reset} className="text-sm font-semibold text-[#f97316] hover:text-[#ea6b0f] transition-colors">← Try another search</button>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#d2d2d7] px-10 py-14 text-center shadow-sm">
                  <p className="text-xl font-bold text-[#1d1d1f] mb-2">No shops match your filters</p>
                  <button onClick={() => { setFilterOpenNow(false); setFilterVerified(false); setFilterMinRating(0); setFilterMaxInstall(0); setShopSearch(""); }} className="text-sm font-semibold text-[#f97316] hover:text-[#ea6b0f] transition-colors">Clear all filters</button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredShops.slice(0, visibleCount).map((shop, idx) => {
                      const miles = (shop.distanceMeters / 1609.34).toFixed(1);
                      const quoteQuery = new URLSearchParams({ placeId: shop.placeId, name: shop.name, address: shop.address });
                      if (shop.phone) quoteQuery.set("phone", shop.phone);
                      return (
                        <div key={shop.placeId + idx} className="bg-white rounded-3xl border border-[#e5e5ea] shadow-md hover:shadow-xl hover:shadow-black/8 hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
                          {/* Photo */}
                          <div className="h-44 bg-[#f5f5f7] overflow-hidden relative">
                            {shop.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={shop.photoUrl} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-[#c7c7cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">{miles} mi</div>
                            {(shop.isVerified || shop.isRecommended) && (
                              <div className="absolute top-2.5 left-2.5 flex flex-row gap-1">
                                {shop.isVerified && (
                                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </div>
                                )}
                                {shop.isRecommended && (
                                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                                    ⭐ Recommended
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-bold text-[#1d1d1f] text-[15px] leading-snug">{shop.name}</p>
                              {shop.isOpen === true && <span className="shrink-0 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Open</span>}
                              {shop.isOpen === false && <span className="shrink-0 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Closed</span>}
                            </div>

                            <p className="text-sm text-[#6e6e73] mb-3 leading-snug">{shop.address}</p>

                            {shop.rating != null && (
                              <div className="flex items-center gap-1.5 mb-3">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((s) => (
                                    <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(shop.rating!) ? "text-[#f97316]" : "text-[#d2d2d7]"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm font-bold text-[#1d1d1f]">{shop.rating.toFixed(1)}</span>
                                {shop.totalRatings != null && <span className="text-xs text-[#a1a1a6]">({shop.totalRatings.toLocaleString()})</span>}
                              </div>
                            )}

                            {shop.phone && (
                              <p className="text-sm text-[#6e6e73] mb-3 flex items-center gap-1.5">
                                <svg className="w-4 h-4 shrink-0 text-[#a1a1a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {shop.phone}
                              </p>
                            )}

                            <div className="mb-4 rounded-2xl border border-[#e5e5ea] bg-[#fafafa] px-3 py-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6e6e73] mb-2">Estimated Prices</p>
                              {!laborHasAnyEstimate(shop.laborEstimate) ? (
                                <p className="text-sm text-[#6e6e73]">Prices TBD</p>
                              ) : (
                                <ul className="space-y-1.5 text-[13px]">
                                  {[
                                    { label: "Installation", val: shop.laborEstimate!.installation },
                                    { label: "Alignment", val: shop.laborEstimate!.alignment },
                                    { label: "Rotation", val: shop.laborEstimate!.rotation },
                                    { label: "Balancing", val: shop.laborEstimate!.balancing },
                                  ].map(({ label, val }) => (
                                    <li key={label} className="flex justify-between gap-2">
                                      <span className="text-[#6e6e73]">{label}:</span>
                                      <span className="font-semibold text-[#1d1d1f] tabular-nums">{laborPriceLabel(val)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="mt-auto flex gap-2">
                              <a href={shop.mapsUrl} target="_blank" rel="noopener noreferrer"
                                className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl text-sm font-bold bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white transition-all active:scale-95">
                                <span className="truncate">Directions</span>
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                              <Link href={`/quote?${quoteQuery.toString()}`}
                                className="shrink-0 flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-bold border-2 border-[#f97316] text-[#f97316] bg-white hover:bg-[#f97316]/8 transition-all active:scale-95">
                                Quote
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {visibleCount < filteredShops.length && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setVisibleCount((c) => c + 12)}
                        className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold bg-white border-2 border-[#e5e5ea] text-[#1d1d1f] hover:border-[#f97316] hover:text-[#f97316] transition-all active:scale-95 shadow-sm"
                      >
                        Load More
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ─────────────────────────────── RESULTS ─────────────────────────────── */
  if (phase === "results") {
    return (
      <section id="search" className="py-24 bg-[#f5f5f7]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-1">Price Comparison</p>
              <h2 className="text-3xl font-bold text-[#1d1d1f]">
                {searchMeta?.condition === "new" ? "New" : "Used"}{" "}
                <span className="text-[#f97316]">{searchMeta?.tireSize}</span>
              </h2>
              <p className="text-sm text-[#6e6e73] mt-1">
                Near <span className="font-semibold text-[#1d1d1f]">{searchMeta?.location}</span>
                {" · "}{results.length} store{results.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <button
              onClick={reset}
              className="shrink-0 flex items-center gap-2 text-sm font-semibold text-[#6e6e73] hover:text-[#1d1d1f] bg-white border border-[#e5e5ea] px-4 py-2.5 rounded-xl transition-all hover:shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              New Search
            </button>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d2d2d7] px-10 py-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#a1a1a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">No online prices found</h3>
              <p className="text-[#6e6e73] text-[15px] mb-6">
                The major retailers may not stock this tire size online right now. Try a different size or brand.
              </p>
              <button onClick={reset} className="text-sm font-semibold text-[#f97316] hover:text-[#ea6b0f] transition-colors">
                ← Try another search
              </button>
            </div>
          ) : (
            <>
              {/* Sort note */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results
                  .filter((r) => r.tirePrice > 5)
                  .slice()
                  .sort((a, b) => a.total - b.total)
                  .map((r, idx) => {
                    const meta = STORE_META[r.storeBrand] ?? { color: "#6e6e73", bg: "#f5f5f7", abbr: "?" };
                    const isBest = idx === 0;
                    return (
                      <div
                        key={r.store + idx}
                        className={`relative bg-white rounded-3xl border-2 flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-black/8 hover:-translate-y-0.5 ${
                          isBest ? "border-[#f97316] shadow-lg shadow-orange-100" : "border-[#e5e5ea] shadow-sm"
                        }`}
                      >
                        {isBest && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                            BEST PRICE
                          </div>
                        )}

                        <div className="p-6 flex-1 flex flex-col">
                          {/* Store badge */}
                          <div className="flex items-center gap-3 mb-5">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.abbr}
                            </div>
                            <div>
                              <p className="font-bold text-[#1d1d1f] text-base">{r.store}</p>
                              {r.inStock ? (
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">In Stock</span>
                              ) : (
                                <span className="text-xs font-semibold text-[#a1a1a6] bg-[#f5f5f7] px-2 py-0.5 rounded-full">Check Availability</span>
                              )}
                            </div>
                          </div>

                          {/* Tire name */}
                          <p className="text-[13px] text-[#6e6e73] leading-snug mb-5 min-h-[2.5rem]">{r.tireName}</p>

                          {/* Price breakdown */}
                          <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-5 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#6e6e73]">Tire price</span>
                              <span className="text-sm font-semibold text-[#1d1d1f]">${r.tirePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#6e6e73]">Installation</span>
                              <span className="text-sm font-semibold text-[#1d1d1f]">
                                {r.installPrice != null ? `$${r.installPrice.toFixed(2)}` : "—"}
                              </span>
                            </div>
                            <div className="border-t border-[#e5e5ea] pt-2.5 flex justify-between items-center">
                              <span className="text-sm font-bold text-[#1d1d1f]">Total / tire</span>
                              <span className="text-lg font-black" style={{ color: isBest ? "#f97316" : "#1d1d1f" }}>
                                ${r.total.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {r.note && (
                            <p className="text-[11px] text-[#a1a1a6] mb-4 flex items-start gap-1.5">
                              <svg className="w-3 h-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {r.note}
                            </p>
                          )}

                          {/* CTA */}
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                              isBest
                                ? "bg-[#f97316] hover:bg-[#ea6b0f] text-white shadow-sm hover:shadow-md hover:shadow-[#f97316]/30"
                                : "bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white"
                            }`}
                          >
                            View Deal
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Disclaimer */}
              <p className="mt-6 text-center text-[12px] text-[#a1a1a6] max-w-lg mx-auto leading-relaxed">
                Prices are retrieved in real-time by AI and may differ from in-store pricing. Always confirm with the retailer before purchasing.
                Installation fees are per tire and may vary by location.
              </p>
            </>
          )}
        </div>
      </section>
    );
  }

  /* ─────────────────────────────── FORM ────────────────────────────────── */
  return (
    <section id="search" className="py-6 bg-[#f5f5f7]">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-2">Price Comparison</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight leading-tight max-w-2xl mx-auto">
            You Tell Us What You&rsquo;re Looking For
            <span className="block text-[#f97316]">and We Will Compare It</span>
          </h2>
          <p className="mt-2 text-[15px] text-[#6e6e73]">
            We scan through multiple stores in your area.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">

          {/* Location — single address bar */}
          <div className="bg-white rounded-3xl border border-[#d2d2d7] shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold text-[#1d1d1f] uppercase tracking-wider">Your Location</p>
              {locationMode === "manual" ? (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[#f97316] hover:text-[#ea6b0f] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use Current Location
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setLocationMode("manual"); setGpsLocation(null); setErrors((p) => ({ ...p, gps: undefined })); }}
                  className="text-[12px] font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                >
                  Enter manually
                </button>
              )}
            </div>

            {locationMode === "gps" ? (
              <div className="flex items-center gap-3 min-h-[44px]">
                {gpsResolving || (status === "requesting" && !coords) ? (
                  <div className="flex items-center gap-2 text-[14px] text-[#6e6e73]">
                    <div className="w-4 h-4 border-2 border-[#f97316]/30 border-t-[#f97316] rounded-full animate-spin" />
                    Detecting your location…
                  </div>
                ) : gpsLocation ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#f97316]/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">{gpsLocation.display}</p>
                      <p className="text-[11px] text-[#6e6e73]">Using your current location</p>
                    </div>
                  </div>
                ) : status === "denied" || status === "unavailable" ? (
                  <p className="text-[13px] text-red-500 font-medium">
                    Location access denied.{" "}
                    <button type="button" onClick={() => { setLocationMode("manual"); setErrors((p) => ({ ...p, gps: undefined })); }} className="underline">
                      Enter manually
                    </button>
                  </p>
                ) : (
                  <p className="text-[13px] text-[#6e6e73]">Waiting for location…</p>
                )}
                {errors.gps && <p className="ml-auto text-[11px] text-red-500 font-medium">{errors.gps}</p>}
              </div>
            ) : (
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1a6] pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                  }}
                  placeholder="Enter your address, city, or zip code"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border text-[#1d1d1f] text-[15px] placeholder-[#a1a1a6] bg-[#f5f5f7] transition-all focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] ${
                    errors.address ? "border-red-400" : "border-transparent focus:border-[#f97316]/30"
                  }`}
                  suppressHydrationWarning
                />
                {errors.address && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{errors.address}</p>}
              </div>
            )}
          </div>

          {/* Two columns */}
          <div className="grid sm:grid-cols-2 gap-5">

            {/* ── Left: Tires ── */}
            <div className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden ${tireActive ? "border-[#f97316] shadow-lg shadow-orange-100" : "border-[#e5e5ea] shadow-sm"}`}>
              <button
                type="button"
                onClick={() => {
                  const next = !tireActive;
                  setTireActive(next);
                  // Mutual exclusion: clear labor when activating tires
                  if (next) { setSelectedServices(new Set()); setLaborActive(false); }
                  if (errors.selection) setErrors((p) => ({ ...p, selection: undefined }));
                }}
                className="w-full flex items-center justify-between p-6 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${tireActive ? "bg-[#f97316] text-white" : "bg-[#f5f5f7] text-[#6e6e73] group-hover:bg-[#eaeaea]"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                      <path strokeLinecap="round" strokeWidth={1.8} d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-bold text-xl ${tireActive ? "text-[#f97316]" : "text-[#1d1d1f]"}`}>Tires</p>
                    <p className="text-sm text-[#6e6e73]">Compare new &amp; used tire prices</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${tireActive ? "border-[#f97316] bg-[#f97316]" : "border-[#d2d2d7]"}`}>
                  {tireActive && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              <div className="px-6 pb-6 space-y-5 border-t border-[#f5f5f7]">
                  {/* New / Used */}
                  <div className="pt-5">
                    <p className="text-[12px] font-bold text-[#6e6e73] uppercase tracking-wider mb-2">Condition</p>
                    <div className="flex rounded-xl bg-[#f5f5f7] p-1 gap-1">
                      {(["new", "used"] as TireCondition[]).map((val) => (
                        <button key={val} type="button" onClick={() => setCondition(val)}
                          className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-200 ${condition === val ? "bg-white text-[#f97316] shadow-sm border border-[#e5e5ea]" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}>
                          {val === "new" ? "🆕 New" : "♻️ Used"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tire size */}
                  <div>
                    <label htmlFor="tireSize" className="block text-[12px] font-bold text-[#6e6e73] uppercase tracking-wider mb-2">
                      Tire Size <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="tireSize"
                      type="text"
                      value={tireSize}
                      onChange={(e) => {
                        const normalized = normalizeTireSize(e.target.value);
                        setTireSize(normalized);
                        if (errors.tireSize) setErrors((p) => ({ ...p, tireSize: undefined }));
                      }}
                      placeholder="225/65R17"
                      className={`w-full h-11 px-4 rounded-xl border text-[#1d1d1f] text-[15px] placeholder-[#a1a1a6] bg-[#f5f5f7] transition-all focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] ${errors.tireSize ? "border-red-400" : "border-transparent focus:border-[#f97316]/30"}`}
                      suppressHydrationWarning
                    />
                    {errors.tireSize && <p className="mt-1 text-xs text-red-500 font-medium">{errors.tireSize}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_SIZES.map((s) => (
                        <button key={s} type="button"
                          onClick={() => { setTireSize(s); if (errors.tireSize) setErrors((p) => ({ ...p, tireSize: undefined })); }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${tireSize === s ? "bg-[#f97316] text-white" : "bg-[#f0f0f5] text-[#6e6e73] hover:bg-[#e8e8ed]"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label htmlFor="brand" className="block text-[12px] font-bold text-[#6e6e73] uppercase tracking-wider mb-2">
                      Brand <span className="text-[#a1a1a6] normal-case font-normal">(optional)</span>
                    </label>
                    <input id="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                      placeholder="Any brand"
                      className="w-full h-11 px-4 rounded-xl border border-transparent text-[#1d1d1f] text-[15px] placeholder-[#a1a1a6] bg-[#f5f5f7] transition-all focus:outline-none focus:bg-white focus:border-[#f97316]/30 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                      suppressHydrationWarning
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_BRANDS.map((b) => (
                        <button key={b} type="button" onClick={() => setBrand((prev) => prev === b ? "" : b)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${brand === b ? "bg-[#f97316] text-white" : "bg-[#f0f0f5] text-[#6e6e73] hover:bg-[#e8e8ed]"}`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
            </div>

            {/* ── Right: Labor ── */}
            <div className={`bg-white rounded-3xl border-2 transition-all duration-300 ${laborActive && selectedServices.size > 0 ? "border-[#f97316] shadow-lg shadow-orange-100" : "border-[#e5e5ea] shadow-sm"}`}>
              <div className="flex items-center gap-4 p-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${laborActive && selectedServices.size > 0 ? "bg-[#f97316] text-white" : "bg-[#f5f5f7] text-[#6e6e73]"}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-xl ${laborActive && selectedServices.size > 0 ? "text-[#f97316]" : "text-[#1d1d1f]"}`}>Labor</p>
                    {selectedServices.size > 0 && <span className="text-xs font-bold bg-[#f97316] text-white px-2 py-0.5 rounded-full">{selectedServices.size}</span>}
                  </div>
                  <p className="text-sm text-[#6e6e73]">Select all services you need</p>
                </div>
              </div>

              <div className="px-6 pb-6 grid grid-cols-2 gap-3 border-t border-[#f5f5f7] pt-5">
                {LABOR_SERVICES.map((svc) => {
                  const active = selectedServices.has(svc.id);
                  return (
                    <button key={svc.id} type="button" onClick={() => toggleService(svc.id)} aria-pressed={active}
                      className={`relative flex flex-col items-center text-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none ${active ? "border-[#f97316] bg-[#f97316]/5 shadow-sm shadow-orange-100" : "border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#eaeaea] hover:border-[#d2d2d7]"}`}
                    >
                      {active && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#f97316] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <ServiceIcon id={svc.id} active={active} />
                      <div>
                        <p className={`font-bold text-[14px] ${active ? "text-[#f97316]" : "text-[#1d1d1f]"}`}>{svc.label}</p>
                        <p className="text-[11px] text-[#6e6e73] mt-0.5">{svc.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {errors.selection && (
            <p className="text-center text-sm text-red-500 font-medium">{errors.selection}</p>
          )}

          {/* CTA */}
          <button type="submit"
            className="w-full h-14 bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-[16px] rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-[#f97316]/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Find Me the Best Price
          </button>

          <p className="text-center text-[12px] text-[#a1a1a6]">
            Free · No account required · Powered by AI
          </p>
        </form>
      </div>
    </section>
  );
}

function ServiceIcon({ id, active }: { id: string; active: boolean }) {
  const cls = `w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#f97316] text-white" : "bg-white text-[#6e6e73]"}`;
  if (id === "rotation") return <div className={cls}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>;
  if (id === "balance") return <div className={cls}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l9-3 9 3M3 12l9-3 9 3M3 18l9-3 9 3" /></svg></div>;
  if (id === "alignment") return <div className={cls}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m-8-8h16" /><circle cx="12" cy="12" r="4" strokeWidth={1.8} /></svg></div>;
  return <div className={cls}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>;
}
