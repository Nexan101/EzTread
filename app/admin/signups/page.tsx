"use client";

import { useEffect, useState, useCallback } from "react";

interface PlanSignup {
  id: string;
  plan: "basic" | "premium";
  shop_id: string | null;
  shop_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  amount_cents: number | null;
  status: "pending" | "active" | "canceled" | "failed";
  created_at: string;
}

const PLAN_OPTIONS   = ["all", "basic", "premium"] as const;
const STATUS_OPTIONS = ["all", "active", "pending", "canceled", "failed"] as const;

const PLAN_COLORS: Record<string, string> = {
  basic:   "bg-blue-50 text-blue-600",
  premium: "bg-orange-50 text-orange-600",
};

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-600",
  failed:   "bg-gray-100 text-gray-500",
};

function exportCSV(signups: PlanSignup[]) {
  const headers = [
    "Plan", "Shop Name", "Email", "Phone", "City", "State",
    "Status", "Amount ($)", "Stripe Session ID", "Stripe Customer ID", "Date",
  ];
  const rows = signups.map((s) => [
    s.plan,
    s.shop_name ?? "",
    s.email ?? "",
    s.phone ?? "",
    s.city ?? "",
    s.state ?? "",
    s.status,
    s.amount_cents != null ? (s.amount_cents / 100).toFixed(2) : "",
    s.stripe_session_id ?? "",
    s.stripe_customer_id ?? "",
    new Date(s.created_at).toLocaleDateString(),
  ]);

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((r) => r.map(escape).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `eztread-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SignupsPage() {
  const [signups, setSignups]     = useState<PlanSignup[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [planFilter, setPlanFilter]     = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchSignups = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (planFilter !== "all")   params.set("plan",   planFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/signups?${params}`);
    const data = await res.json();
    setSignups(data.signups ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [planFilter, statusFilter]);

  useEffect(() => { fetchSignups(); }, [fetchSignups]);

  const basicCount   = signups.filter((s) => s.plan === "basic").length;
  const premiumCount = signups.filter((s) => s.plan === "premium").length;
  const premiumRevenue = signups
    .filter((s) => s.plan === "premium" && s.status === "active" && s.amount_cents)
    .reduce((sum, s) => sum + (s.amount_cents ?? 0), 0) / 100;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Signups</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Basic / Premium</p>
          <p className="text-3xl font-bold text-gray-900">
            <span className="text-blue-600">{basicCount}</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-orange-500">{premiumCount}</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Premium Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${premiumRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Plan filter */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PLAN_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                planFilter === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {/* Status filter */}
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
        <span className="text-sm text-gray-500">{total} signup{total !== 1 ? "s" : ""}</span>
        <div className="ml-auto">
          <button
            onClick={() => exportCSV(signups)}
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop / Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : signups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="text-gray-400 text-sm">No signups found.</p>
                  </td>
                </tr>
              ) : (
                signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PLAN_COLORS[signup.plan] ?? "bg-gray-100 text-gray-500"}`}>
                        {signup.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{signup.shop_name ?? "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{signup.email ?? signup.phone ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {signup.city && signup.state ? `${signup.city}, ${signup.state}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[signup.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {signup.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {signup.amount_cents != null ? (
                        <span className="font-semibold text-gray-900">
                          ${(signup.amount_cents / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(signup.created_at).toLocaleDateString()}
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
