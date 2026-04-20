"use client";

import { useEffect, useState, useCallback } from "react";

interface VerifiedShop {
  place_id: string;
  shop_name: string;
  created_at: string;
}

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  isVerified: boolean;
  isRecommended: boolean;
}

export default function VerifiedShopsPage() {
  const [ready, setReady]               = useState(false);
  const [setupError, setSetupError]     = useState("");

  // ── Verified ──────────────────────────────────────────────
  const [verified, setVerified]         = useState<VerifiedShop[]>([]);
  const [loadingList, setLoadingList]   = useState(true);

  // ── Recommended ───────────────────────────────────────────
  const [recommended, setRecommended]       = useState<VerifiedShop[]>([]);
  const [loadingRec, setLoadingRec]         = useState(true);

  // ── Shared search ─────────────────────────────────────────
  const [query, setQuery]               = useState("");
  const [location, setLocation]         = useState("");
  const [searching, setSearching]       = useState(false);
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [searchError, setSearchError]   = useState("");

  const [toastMsg, setToastMsg]         = useState("");
  const [toastType, setToastType]       = useState<"success" | "error">("success");

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }

  // Ensure the verified_shops table exists before doing anything
  useEffect(() => {
    fetch("/api/admin/setup-db", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTimeout(() => setReady(true), 600);
        else setSetupError(d.error ?? "Database setup failed.");
      })
      .catch(() => setSetupError("Could not connect to the database."));
  }, []);

  const fetchVerified = useCallback(async () => {
    setLoadingList(true);
    const res  = await fetch("/api/admin/verified-shops");
    const data = await res.json();
    setVerified(data.shops ?? []);
    setLoadingList(false);
  }, []);

  const fetchRecommended = useCallback(async () => {
    setLoadingRec(true);
    const res  = await fetch("/api/admin/recommended-shops");
    const data = await res.json();
    setRecommended(data.shops ?? []);
    setLoadingRec(false);
  }, []);

  useEffect(() => {
    if (ready) { fetchVerified(); fetchRecommended(); }
  }, [ready, fetchVerified, fetchRecommended]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);

    const params = new URLSearchParams({ q: query.trim(), location: location.trim() });
    const res  = await fetch(`/api/admin/verified-shops/search?${params}`);
    const data = await res.json();
    setSearching(false);

    if (data.error) { setSearchError(data.error); return; }

    const recSet = new Set(recommended.map((r) => r.place_id));
    const mapped = (data.results ?? []).map((r: SearchResult) => ({
      ...r,
      isRecommended: recSet.has(r.placeId),
    }));
    setResults(mapped);
    if (!mapped.length) setSearchError("No shops found. Try a different name or location.");
  }

  async function handleVerify(shop: SearchResult) {
    const res = await fetch("/api/admin/verified-shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: shop.placeId, shop_name: shop.name }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showToast(`Failed to verify: ${data.error ?? `HTTP ${res.status}`}`, "error");
      return;
    }
    showToast(`✓ "${shop.name}" is now Verified`);
    fetchVerified();
    setResults((prev) => prev.map((r) => r.placeId === shop.placeId ? { ...r, isVerified: true } : r));
  }

  async function handleUnverify(placeId: string, name: string) {
    const res = await fetch("/api/admin/verified-shops", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: placeId }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showToast(data.error ?? "Failed to remove verification.", "error");
      return;
    }
    showToast(`Removed verification from "${name}"`);
    fetchVerified();
    setResults((prev) => prev.map((r) => r.placeId === placeId ? { ...r, isVerified: false } : r));
  }

  async function handleRecommend(shop: SearchResult) {
    const res = await fetch("/api/admin/recommended-shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: shop.placeId, shop_name: shop.name }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showToast(`Failed to recommend: ${data.error ?? `HTTP ${res.status}`}`, "error");
      return;
    }
    showToast(`⭐ "${shop.name}" is now Recommended`);
    fetchRecommended();
    setResults((prev) => prev.map((r) => r.placeId === shop.placeId ? { ...r, isRecommended: true } : r));
  }

  async function handleUnrecommend(placeId: string, name: string) {
    const res = await fetch("/api/admin/recommended-shops", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: placeId }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showToast(data.error ?? "Failed to remove recommendation.", "error");
      return;
    }
    showToast(`Removed recommendation from "${name}"`);
    fetchRecommended();
    setResults((prev) => prev.map((r) => r.placeId === placeId ? { ...r, isRecommended: false } : r));
  }

  if (setupError) {
    return (
      <div className="max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Database setup failed</p>
          <p className="text-xs text-red-500 font-mono">{setupError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 ${toastType === "error" ? "bg-red-600" : "bg-gray-900"}`}>
          {toastType === "error"
            ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          }
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shop Titles</h2>
        <p className="text-sm text-gray-500 mt-1">
          <strong>Verified</strong> shops have accurate prices &amp; estimates and appear first with a green badge.{" "}
          <strong>Recommended</strong> shops are highlighted with an orange star and also sorted to the top.
        </p>
      </div>

      {/* Search to add */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Find a Shop to Tag</h3>
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Shop name (e.g. Sun Auto Tire)"
            className="flex-1 min-w-48 h-10 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or zip (e.g. Houston, TX)"
            className="flex-1 min-w-40 h-10 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
          <button
            type="submit"
            disabled={searching || !query.trim() || !ready}
            className="h-10 px-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {searching ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching…</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Search</>
            )}
          </button>
        </form>

        {searchError && <p className="mt-3 text-sm text-red-500">{searchError}</p>}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <div key={r.placeId} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 truncate">{r.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Verified button */}
                  {r.isVerified ? (
                    <>
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                      <button onClick={() => handleUnverify(r.placeId, r.name)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Remove</button>
                    </>
                  ) : (
                    <button onClick={() => handleVerify(r)} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Verify
                    </button>
                  )}
                  {/* Recommended button */}
                  {r.isRecommended ? (
                    <>
                      <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                        ⭐ Recommended
                      </span>
                      <button onClick={() => handleUnrecommend(r.placeId, r.name)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Remove</button>
                    </>
                  ) : (
                    <button onClick={() => handleRecommend(r)} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">
                      ⭐ Recommend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current verified shops */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-900">Currently Verified</h3>
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{verified.length}</span>
        </div>

        {!ready || loadingList ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
            {!ready ? "Setting up database…" : "Loading…"}
          </div>
        ) : verified.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No verified shops yet. Search above to add one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {verified.map((shop) => (
              <div key={shop.place_id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{shop.shop_name}</p>
                    <p className="text-xs text-gray-400 truncate font-mono">{shop.place_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnverify(shop.place_id, shop.shop_name)}
                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current recommended shops */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-900">Currently Recommended</h3>
          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{recommended.length}</span>
        </div>

        {!ready || loadingRec ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
            {!ready ? "Setting up database…" : "Loading…"}
          </div>
        ) : recommended.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">⭐</div>
            <p className="text-sm text-gray-500">No recommended shops yet. Search above to add one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommended.map((shop) => (
              <div key={shop.place_id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shrink-0 text-sm">
                    ⭐
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{shop.shop_name}</p>
                    <p className="text-xs text-gray-400 truncate font-mono">{shop.place_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnrecommend(shop.place_id, shop.shop_name)}
                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
