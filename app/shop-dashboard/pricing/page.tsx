"use client";

import { useEffect, useState } from "react";

interface Pricing {
  shop_name: string;
  installation: string | null;
  alignment: string | null;
  rotation: string | null;
  balancing: string | null;
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "e.g. 25"}
          className="w-full h-10 pl-7 pr-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  );
}

export default function PricingPage() {
  const [shopName, setShopName] = useState("");
  const [installation, setInstallation] = useState("");
  const [alignment, setAlignment] = useState("");
  const [rotation, setRotation] = useState("");
  const [balancing, setBalancing] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    fetch("/api/shop-dashboard/pricing")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        if (d.pricing) {
          const p: Pricing = d.pricing;
          setShopName(p.shop_name ?? "");
          setInstallation(p.installation ?? "");
          setAlignment(p.alignment ?? "");
          setRotation(p.rotation ?? "");
          setBalancing(p.balancing ?? "");
        }
      })
      .catch(() => setError("Failed to load pricing."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/shop-dashboard/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_name: shopName,
          installation: installation.trim() || null,
          alignment: alignment.trim() || null,
          rotation: rotation.trim() || null,
          balancing: balancing.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else showToast("Pricing updated — changes are live on your listing.");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700">
          These prices appear on your shop&apos;s listing when customers compare nearby shops. Leave a field blank to hide it. You can enter ranges like <strong>25–30</strong> or labels like <strong>Free</strong>.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Installation services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Installation Services</h2>
          <p className="text-sm text-gray-500 mb-5">Per-tire fees shown to customers on your listing.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Installation / tire"
              hint="Mount & balance per tire"
              value={installation}
              onChange={setInstallation}
              placeholder="e.g. 20"
            />
            <Field
              label="Balancing / tire"
              hint="Wheel balancing per tire"
              value={balancing}
              onChange={setBalancing}
              placeholder="e.g. 15"
            />
            <Field
              label="Alignment"
              hint="Full wheel alignment (total)"
              value={alignment}
              onChange={setAlignment}
              placeholder="e.g. 89"
            />
            <Field
              label="Rotation"
              hint="Tire rotation — enter Free if included"
              value={rotation}
              onChange={setRotation}
              placeholder="e.g. Free"
            />
          </div>
        </div>

        {/* Live preview */}
        {(installation || alignment || rotation || balancing) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-semibold text-gray-900 text-sm">Preview — how it appears on your listing</h2>
            </div>
            <div className="space-y-2">
              {installation && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Installation</span>
                  <span className="font-semibold text-gray-900">${installation}/tire</span>
                </div>
              )}
              {balancing && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balancing</span>
                  <span className="font-semibold text-gray-900">${balancing}/tire</span>
                </div>
              )}
              {alignment && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Alignment</span>
                  <span className="font-semibold text-gray-900">${alignment}</span>
                </div>
              )}
              {rotation && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rotation</span>
                  <span className="font-semibold text-gray-900">
                    {rotation.toLowerCase() === "free" ? "Free" : `$${rotation}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !shopName}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? "Saving…" : "Save & Publish"}
        </button>
      </form>
    </div>
  );
}
