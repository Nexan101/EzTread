"use client";

import { useEffect, useState, FormEvent } from "react";

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  hasEstimate: boolean;
}

export default function LaborEstimatesPage() {
  const [ready, setReady] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [installation, setInstallation] = useState("");
  const [alignment, setAlignment] = useState("");
  const [rotation, setRotation] = useState("");
  const [balancing, setBalancing] = useState("");
  const [tpms, setTpms] = useState("");
  const [patch, setPatch] = useState("");
  const [saving, setSaving] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }

  useEffect(() => {
    fetch("/api/admin/setup-db", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTimeout(() => setReady(true), 600);
        else setSetupError(d.error ?? "Database setup failed.");
      })
      .catch(() => setSetupError("Could not connect to the database."));
  }, []);

  async function loadEstimate(shop: SearchResult) {
    setSelected(shop);
    setLoadingEstimate(true);
    setInstallation("");
    setAlignment("");
    setRotation("");
    setBalancing("");
    setTpms("");
    setPatch("");
    try {
      const res = await fetch(`/api/admin/shop-labor-estimates?placeId=${encodeURIComponent(shop.placeId)}`);
      const data = await res.json();
      if (data.estimate) {
        const e = data.estimate;
        setInstallation(e.installation != null ? String(e.installation) : "");
        setAlignment(e.alignment != null ? String(e.alignment) : "");
        setRotation(e.rotation != null ? String(e.rotation) : "");
        setBalancing(e.balancing != null ? String(e.balancing) : "");
        setTpms(e.tpms != null ? String(e.tpms) : "");
        setPatch(e.patch != null ? String(e.patch) : "");
      }
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setSelected(null);

    const params = new URLSearchParams({ q: query.trim(), location: location.trim() });
    const res = await fetch(`/api/admin/shop-labor-estimates/search?${params}`);
    const data = await res.json();
    setSearching(false);

    if (data.error) {
      setSearchError(data.error);
      return;
    }
    setResults(data.results ?? []);
    if (!data.results?.length) setSearchError("No shops found. Try a different name or location.");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/admin/shop-labor-estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: selected.placeId,
        shop_name: selected.name,
        installation: installation.trim() || null,
        alignment: alignment.trim() || null,
        rotation: rotation.trim() || null,
        balancing: balancing.trim() || null,
        tpms: tpms.trim() || null,
        patch: patch.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok || data.error) {
      showToast(data.error ?? "Save failed.", "error");
      return;
    }
    showToast(`Saved labor prices for “${selected.name}”`);
    const anyFilled = Boolean(
      installation.trim() || alignment.trim() || rotation.trim() || balancing.trim() || tpms.trim() || patch.trim()
    );
    setResults((prev) =>
      prev.map((r) =>
        r.placeId === selected.placeId ? { ...r, hasEstimate: anyFilled } : r
      )
    );
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

  const inputCls =
    "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  return (
    <div className="space-y-8 max-w-4xl">
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-50 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 ${toastType === "error" ? "bg-red-600" : "bg-gray-900"}`}
        >
          {toastMsg}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Labor price estimates</h2>
        <p className="text-sm text-gray-500 mt-1">
          Search for a shop on Google Places and type how you want each price to read—one number or a short range. The site shows the same text you save (with a $ if you didn’t type one).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Find a shop</h3>
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Shop name"
            disabled={!ready}
            className="flex-1 min-w-48 h-10 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or zip (optional)"
            disabled={!ready}
            className="flex-1 min-w-40 h-10 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          <button
            type="submit"
            disabled={searching || !query.trim() || !ready}
            className="h-10 px-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <p className="mt-3 text-sm text-red-500">{searchError}</p>}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <div
                key={r.placeId}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 truncate">{r.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.hasEstimate && (
                    <span className="text-[10px] font-bold uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      Saved
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => loadEstimate(r)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200 bg-white"
                  >
                    {selected?.placeId === r.placeId ? "Selected" : "Edit prices"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Prices for {selected.name}</h3>
          <p className="text-xs text-gray-500 font-mono mb-4 truncate">{selected.placeId}</p>

          {loadingEstimate ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 max-w-md">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Installation ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={installation}
                    onChange={(e) => setInstallation(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 25"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Alignment ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 85"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Rotation ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rotation}
                    onChange={(e) => setRotation(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 20-40"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Balancing ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={balancing}
                    onChange={(e) => setBalancing(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 15"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">TPMS Sensor ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tpms}
                    onChange={(e) => setTpms(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 40"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Patch ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={patch}
                    onChange={(e) => setPatch(e.target.value)}
                    className={`${inputCls} mt-1`}
                    placeholder="e.g. 20"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Digits, decimals, and hyphens only—type the label you want (not interpreted as a strict min/max). Leave blank to clear. Shops with no prices show “Prices TBD” on the site.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-6 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? "Saving…" : "Save prices"}
              </button>
            </form>
          )}
        </div>
      )}

      {!ready && (
        <p className="text-sm text-gray-400 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          Setting up database…
        </p>
      )}
    </div>
  );
}
