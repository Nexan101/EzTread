"use client";

import { useEffect, useRef, useState } from "react";
import { Stagger, StaggerItem } from "./ui/Animate";
const CACHE_KEY = "eztread_public_stats";
const CACHE_TTL = 86_400_000; // 24 hours in ms

interface Stats {
  shops: number;
  visitors: number;
  comparisons: number;
}

function useAnimatedCount(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else setValue(target);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}

function StatCard({ value, label, suffix = "", prefix = "", loading }: {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  loading: boolean;
}) {
  const count = useAnimatedCount(value);
  const display = loading
    ? "—"
    : `${prefix}${count.toLocaleString()}${suffix}`;

  return (
    <div className="bg-white rounded-3xl p-8 border border-[#d2d2d7] text-center hover:shadow-md hover:shadow-black/5 transition-shadow duration-300">
      <div className={`text-4xl font-bold tabular-nums mb-2 transition-colors duration-300 ${loading ? "text-[#d2d2d7]" : "text-[#1d1d1f]"}`}>
        {display}
      </div>
      <div className="text-[13px] text-[#6e6e73]">{label}</div>
      {!loading && (
        <span className="inline-block mt-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Live" />
      )}
    </div>
  );
}

export default function SocialProof() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setStats(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/public-stats");
        if (res.ok) {
          const data: Stats = await res.json();
          setStats(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const STAT_CARDS = [
    { value: stats?.shops ?? 0,       label: "Houston tire shops",   suffix: "+" },
    { value: stats?.visitors ?? 0,     label: "People visited",       suffix: "" },
    { value: stats?.comparisons ?? 0,  label: "Prices compared",      suffix: "" },
    { value: 75,                        label: "Average savings",      prefix: "$" },
  ];

  return (
    <section className="py-28 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-2">Live Updates Daily</p>
        </div>

        {/* Live stats row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24" staggerDelay={0.1}>
          {STAT_CARDS.map((s) => (
            <StaggerItem key={s.label}>
              <StatCard {...s} loading={loading && s.label !== "Average savings"} />
            </StaggerItem>
          ))}
        </Stagger>

      </div>
    </section>
  );
}
