"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface SeriesPoint {
  period: string;
  impressions: number;
  conversions: number;
  quote_clicks: number;
  directions_clicks: number;
}

interface Summary {
  totalImpressions: number;
  totalConversions: number;
  totalQuoteClicks: number;
  totalDirectionsClicks: number;
  conversionRate: number;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily",   label: "Daily"   },
  { key: "weekly",  label: "Weekly"  },
  { key: "monthly", label: "Monthly" },
  { key: "yearly",  label: "Yearly"  },
];

function formatPeriodLabel(iso: string, period: Period): string {
  const d = new Date(iso);
  if (period === "yearly")  return d.getFullYear().toString();
  if (period === "monthly") return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600 capitalize">{p.name}:</span>
          <span className="font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check premium status once on mount
  useEffect(() => {
    fetch("/api/shop-dashboard/my-shop")
      .then((r) => r.json())
      .then((d) => setIsPremium(!!d.isPremium))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    function fetchData(showSpinner = true) {
      if (showSpinner) setLoading(true);
      setError("");
      fetch(`/api/shop-dashboard/analytics?period=${period}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.error) { setError(d.error); return; }
          setSummary(d.summary);
          setSeries(
            (d.series as SeriesPoint[]).map((p) => ({
              ...p,
              label: formatPeriodLabel(p.period, period),
            }))
          );
          setLastUpdated(new Date());
        })
        .catch(() => { if (!cancelled) setError("Failed to load analytics."); })
        .finally(() => { if (!cancelled && showSpinner) setLoading(false); });
    }

    fetchData(true);

    // Silently refresh every 30 seconds so new impressions appear without a reload
    const interval = setInterval(() => fetchData(false), 30_000);

    // Also refresh when the browser tab becomes visible again
    function onVisibility() {
      if (document.visibilityState === "visible") fetchData(false);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [period]);

  const chartData = series.map((p) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: (p as any).label ?? formatPeriodLabel(p.period, period),
    Impressions: p.impressions,
    Directions: p.directions_clicks,
  }));

  return (
    <div className="space-y-6">

      {/* Period selector */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit shadow-sm">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              period === key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* All analytics content — blurred for free plan */}
      <div className="relative">

        {/* Blur + lock overlay for non-premium */}
        {!isPremium && (
          <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-8" style={{ backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.5)" }}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl px-8 py-8 max-w-sm">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">Premium Feature</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Upgrade to Premium to unlock full analytics — views, direction clicks, conversion rates, and performance trends.
              </p>
              <a
                href="/join"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3 rounded-xl transition-colors text-center"
              >
                Upgrade to Premium — $149/mo →
              </a>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Views"
            value={summary?.totalImpressions.toLocaleString() ?? "—"}
            sub="Times shown in listings"
            color="text-blue-600"
          />
          <StatCard
            label="Directions Clicks"
            value={summary?.totalDirectionsClicks.toLocaleString() ?? "—"}
            sub="Customers asked for directions"
            color="text-orange-500"
          />
          <StatCard
            label="Conversion Rate"
            value={
              summary
                ? `${summary.totalImpressions > 0 ? Math.round((summary.totalDirectionsClicks / summary.totalImpressions) * 1000) / 10 : 0}%`
                : "—"
            }
            sub="Directions ÷ Views"
            color="text-green-600"
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">
              {period === "daily" ? "Last 30 Days" :
               period === "weekly" ? "Last 12 Weeks" :
               period === "monthly" ? "Last 12 Months" : "Yearly Overview"}
            </h2>
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">No data yet for this period.</p>
              <p className="text-xs text-gray-400 mt-1">Data appears once customers find your shop in listings.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6e6e73" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6e6e73" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }}
                  formatter={(value) => <span style={{ color: "#1d1d1f", fontWeight: 600 }}>{value}</span>}
                />
                <Bar dataKey="Impressions" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line
                  type="monotone"
                  dataKey="Directions"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: "#f97316", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}
