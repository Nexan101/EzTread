"use client";

import { useEffect, useState, useCallback } from "react";
import type { Lead } from "@/types/shop";

const STATUS_OPTIONS = ["all", "new", "contacted", "converted", "lost"] as const;
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-600",
  contacted: "bg-yellow-100 text-yellow-600",
  converted: "bg-green-100 text-green-600",
  lost: "bg-red-100 text-red-500",
};

function exportCSV(leads: Lead[]) {
  const headers = ["Name", "Email", "Phone", "Tire Size", "Qty", "Shop", "Status", "Charged", "Amount", "Date"];
  const rows = leads.map((l) => [
    l.customer_name ?? "", l.customer_email ?? "", l.customer_phone ?? "",
    l.tire_size ?? "", l.quantity, l.shop?.name ?? "", l.status,
    l.charged ? "Yes" : "No", l.amount ?? "", new Date(l.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "eztread-leads.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    fetchLeads();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-1">{total} lead{total !== 1 ? "s" : ""}</span>
        <div className="ml-auto">
          <button
            onClick={() => exportCSV(leads)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tire Request</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-gray-400 text-sm">No leads found.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{lead.customer_name ?? "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{lead.customer_phone ?? lead.customer_email ?? ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{lead.tire_size ?? "—"}</p>
                      <p className="text-xs text-gray-400">{lead.quantity} tires · {lead.quality_tier ?? ""}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{lead.shop?.name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {lead.amount ? (
                        <span className="font-semibold text-gray-900">${Number(lead.amount).toFixed(2)}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {["contacted", "converted", "lost"].map((s) => (
                          lead.status !== s && (
                            <button
                              key={s}
                              onClick={() => updateStatus(lead.id, s)}
                              disabled={updating === lead.id}
                              className="text-xs font-medium text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors capitalize"
                            >
                              {updating === lead.id ? "…" : `→ ${s}`}
                            </button>
                          )
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
