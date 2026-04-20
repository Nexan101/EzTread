"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/types/shop";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d);
      })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
        {error}
        <p className="mt-2 text-xs text-red-500">Make sure your Supabase env vars are set and the SQL schema has been run.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Shops"
          value={stats?.totalShops ?? 0}
          sub="All time"
          color="bg-orange-50"
          icon={<svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Shops This Month"
          value={stats?.shopsThisMonth ?? 0}
          sub="New additions"
          color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Leads This Month"
          value={stats?.leadsThisMonth ?? 0}
          sub={`${stats?.totalLeads ?? 0} all time`}
          color="bg-green-50"
          icon={<svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Revenue This Month"
          value={`$${(stats?.revenueThisMonth ?? 0).toFixed(2)}`}
          sub="From charged leads"
          color="bg-purple-50"
          icon={<svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shops */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Shops</h2>
            <Link href="/admin/shops" className="text-xs font-semibold text-orange-500 hover:text-orange-600">
              View all →
            </Link>
          </div>
          {!stats?.recentShops?.length ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No shops yet.</p>
              <Link href="/admin/shops/add" className="mt-3 inline-block text-sm font-semibold text-orange-500 hover:text-orange-600">
                Add your first shop →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/admin/shops/${shop.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-sm">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{shop.name}</p>
                      <p className="text-xs text-gray-400">{shop.city}, {shop.state}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(shop.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/admin/leads" className="text-xs font-semibold text-orange-500 hover:text-orange-600">
              View all →
            </Link>
          </div>
          {!stats?.recentLeads?.length ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No leads yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lead.customer_name ?? "Unknown"}</p>
                    <p className="text-xs text-gray-400">{lead.tire_size} · {lead.quantity} tires</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    lead.status === "new" ? "bg-blue-100 text-blue-600" :
                    lead.status === "converted" ? "bg-green-100 text-green-600" :
                    lead.status === "lost" ? "bg-red-100 text-red-500" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Ready to add a new shop?</h2>
          <p className="text-orange-100 text-sm mt-1">Fill in the details from your visit and we&apos;ll handle the rest.</p>
        </div>
        <Link
          href="/admin/shops/add"
          className="shrink-0 bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
        >
          Add Shop →
        </Link>
      </div>
    </div>
  );
}
