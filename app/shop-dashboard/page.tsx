"use client";

import { useEffect, useState } from "react";

interface ShopClaim {
  shop_id: string;
  shop_name: string;
  created_at: string;
}

export default function ShopDashboard() {
  const [shop, setShop] = useState<ShopClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/shop-dashboard/my-shop")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setShop(d.shop ?? null);
      })
      .catch(() => setError("Failed to load shop data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
        {error}
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium text-sm">No shop connected yet.</p>
        <p className="text-gray-400 text-xs mt-1">Contact your admin to link your account to a shop.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected shop banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-4">
        <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
          {shop.shop_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Connected to</p>
          <h1 className="text-xl font-bold text-gray-900">{shop.shop_name}</h1>
        </div>
      </div>
    </div>
  );
}
