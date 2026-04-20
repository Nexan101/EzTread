"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ShopWithRelations } from "@/types/shop";

const TIER_COLORS: Record<string, string> = {
  budget: "bg-gray-100 text-gray-600",
  "mid-range": "bg-blue-100 text-blue-600",
  premium: "bg-orange-100 text-orange-600",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-600",
  contacted: "bg-yellow-100 text-yellow-600",
  converted: "bg-green-100 text-green-600",
  lost: "bg-red-100 text-red-500",
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [shop, setShop] = useState<ShopWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/shops/${id}`)
      .then((r) => r.json())
      .then((d) => setShop(d.shop ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/admin/shops/${id}`, { method: "DELETE" });
    router.push("/admin/shops");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Shop not found.</p>
        <Link href="/admin/shops" className="mt-3 inline-block text-sm font-semibold text-orange-500">← All Shops</Link>
      </div>
    );
  }

  const svc = shop.shop_services;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-xl">
              {shop.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{shop.address}, {shop.city}, {shop.state} {shop.zip}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${shop.premium_tier === "premium" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                  {shop.premium_tier}
                </span>
                {shop.google_rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">{Number(shop.google_rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/shops/${id}/edit`} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </Link>
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Info</h2>
          <InfoRow label="Phone" value={shop.phone} />
          <InfoRow label="Email" value={shop.email} />
          <InfoRow label="Added" value={new Date(shop.created_at).toLocaleDateString()} />
          <InfoRow label="Lat / Lng" value={shop.latitude ? `${shop.latitude}, ${shop.longitude}` : null} />
        </div>

        {/* Installation Pricing */}
        {svc && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Installation Pricing / tire</h2>
            <InfoRow label="Mount & Balance" value={`$${Number(svc.mounting_balancing_per_tire).toFixed(2)}`} />
            <InfoRow label="Disposal" value={`$${Number(svc.disposal_per_tire).toFixed(2)}`} />
            <InfoRow label="Valve Stems" value={`$${Number(svc.valve_stems_per_tire).toFixed(2)}`} />
            <InfoRow label="TPMS" value={`$${Number(svc.tpms_per_tire).toFixed(2)}`} />
            {svc.alignment_cost && <InfoRow label="Alignment" value={`$${Number(svc.alignment_cost).toFixed(2)}`} />}
            {svc.road_hazard_per_tire && <InfoRow label="Road Hazard" value={`$${Number(svc.road_hazard_per_tire).toFixed(2)}/tire`} />}
            <InfoRow label="Free Rotation" value={svc.free_rotation ? "Yes ✓" : "No"} />
          </div>
        )}
      </div>

      {/* Tire Ranges */}
      {shop.shop_tire_ranges?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tire Price Ranges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {shop.shop_tire_ranges.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_COLORS[r.tier]}`}>
                  {r.tier}
                </span>
                <p className="text-xl font-bold text-gray-900 mt-3">
                  ${Number(r.min_price).toFixed(0)}–${Number(r.max_price).toFixed(0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">per tire</p>
                {r.example_brands && <p className="text-xs text-gray-500 mt-2">{r.example_brands}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {shop.notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Visit Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{shop.notes}</p>
        </div>
      )}

      {/* Leads */}
      {shop.leads && shop.leads.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lead History ({shop.leads.length})</h2>
          <div className="space-y-2">
            {shop.leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{lead.customer_name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-400">{lead.tire_size} · {lead.quantity} tires · {new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-center mb-1">Delete {shop.name}?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">All services, tire ranges, and leads will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
