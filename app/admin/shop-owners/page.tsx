"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";

interface SelectedShop {
  place_id: string;
  name: string;
  address: string;
}

interface ShopClaim {
  id: number;
  shop_id: string;
  shop_name: string;
  owner_email: string;
  created_at: string;
}

export default function ShopOwnersPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  // DB setup
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState("");

  // Google Places
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [placesError, setPlacesError] = useState("");

  // Selected shop from Google
  const [selectedShop, setSelectedShop] = useState<SelectedShop | null>(null);

  // Existing claims
  const [claims, setClaims] = useState<ShopClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // Form
  const [ownerEmail, setOwnerEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");

  // Remove modal
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // placesLoaded is set by the Script onLoad callback below

  // Wire up autocomplete once Places is loaded
  useEffect(() => {
    if (!placesLoaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment"],
      fields: ["place_id", "name", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.place_id) return;
      setSelectedShop({
        place_id: place.place_id,
        name: place.name ?? "",
        address: place.formatted_address ?? "",
      });
    });
  }, [placesLoaded]);

  // Setup DB then load claims
  useEffect(() => {
    fetch("/api/admin/setup-db", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setDbError(d.error); return; }
        setDbReady(true);
      })
      .catch((e) => setDbError(String(e)));
  }, []);

  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    const res = await fetch("/api/admin/shop-claims");
    const data = await res.json();
    setClaims(data.claims ?? []);
    setClaimsLoading(false);
  }, []);

  useEffect(() => {
    if (dbReady) fetchClaims();
  }, [dbReady, fetchClaims]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedShop || !ownerEmail.trim()) return;
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/admin/shop-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: selectedShop.place_id,
        shop_name: selectedShop.name,
        owner_email: ownerEmail.trim(),
      }),
    });
    const data = await res.json();
    if (data.error) {
      setSaveError(data.error);
    } else {
      setSelectedShop(null);
      setOwnerEmail("");
      if (inputRef.current) inputRef.current.value = "";
      fetchClaims();
      showToast(`Connected ${selectedShop.name} to ${ownerEmail.trim()}`);
    }
    setSaving(false);
  }

  async function handleRemove() {
    if (!removeId) return;
    setRemoving(true);
    await fetch("/api/admin/shop-claims", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop_id: removeId }),
    });
    setRemoveId(null);
    setRemoving(false);
    fetchClaims();
    showToast("Connection removed.");
  }

  if (dbError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
        {dbError}
        <p className="mt-2 text-xs text-red-500">Make sure your DATABASE_URL env var is set.</p>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const claimedPlaceIds = new Set(claims.map((c) => c.shop_id));

  return (
    <div className="space-y-8 max-w-4xl">

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setPlacesLoaded(true)}
        onError={() => setPlacesError("Failed to load Google Places. Check your API key.")}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Assign section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Connect Shop to Owner</h2>
        <p className="text-sm text-gray-500 mb-6">
          Search Google Maps for a shop, enter the owner&apos;s login email, and connect them. They&apos;ll be able to access it from their dashboard.
        </p>

        <form onSubmit={handleAssign} className="space-y-5">

          {/* Google Places search */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Search Google Maps
            </label>

            {selectedShop ? (
              <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedShop.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedShop.address}</p>
                    {claimedPlaceIds.has(selectedShop.place_id) && (
                      <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                        Already connected
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShop(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-4"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={placesLoaded ? "Type a shop name or address…" : "Loading Google Maps…"}
                  disabled={!placesLoaded}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
                {placesError && (
                  <p className="mt-1.5 text-xs text-red-500">{placesError}</p>
                )}
              </div>
            )}
          </div>

          {/* Owner email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Owner Email
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="shopowner@example.com"
              required
              className="w-full h-10 px-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Must match their login email. They also need the <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">shop_owner</code> role in Supabase or their email in <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">SHOP_OWNER_EMAILS</code>.
            </p>
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>
          )}

          <button
            type="submit"
            disabled={!selectedShop || !ownerEmail.trim() || saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
            Connect Shop
          </button>
        </form>
      </div>

      {/* Existing connections */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Connections</h2>
          <span className="text-sm text-gray-400">{claims.length} connection{claims.length !== 1 ? "s" : ""}</span>
        </div>

        {claimsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No shops have been connected to an owner yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                    {claim.shop_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{claim.shop_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{claim.owner_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-300 hidden sm:block">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setRemoveId(claim.shop_id)}
                    className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-gray-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove confirmation modal */}
      {removeId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">Remove Connection?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              The shop owner will lose access to this shop&apos;s dashboard. You can reconnect them at any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveId(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRemove} disabled={removing} className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {removing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
