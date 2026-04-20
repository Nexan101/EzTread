"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { HeroReveal } from "./ui/Animate";

const TireBrandsBackground = dynamic(() => import("./TireBrandsBackground"), {
  ssr: false,
  loading: () => null,
});

export default function HeroSection() {
  return (
    <section className="relative bg-white pt-20 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
      <TireBrandsBackground />

      {/* Orange glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #f97316, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">

        {/* Eyebrow */}
        <HeroReveal delay={0.05}>
          <div className="inline-flex items-center gap-2 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73]">
              Houston&apos;s Local Tire Marketplace
            </span>
          </div>
        </HeroReveal>

        {/* Headline */}
        <HeroReveal delay={0.15}>
          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-[#1d1d1f] leading-[1.05] tracking-tight mb-7">
            Stop Overpaying<br />
            for <span className="text-[#f97316]">Tire Services.</span>
          </h1>
        </HeroReveal>

        {/* Subheadline */}
        <HeroReveal delay={0.28}>
          <p className="text-[19px] sm:text-xl text-[#6e6e73] leading-relaxed max-w-2xl mx-auto mb-10">
            Compare prices for tires, installations, alignments, and more from Houston shops — all in seconds.
            See your{" "}
            <span className="text-[#1d1d1f] font-semibold">true total cost</span>{" "}
            before you commit — no surprises, no hidden fees.
          </p>
        </HeroReveal>

        {/* Primary CTA */}
        <HeroReveal delay={0.38}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/compare"
              className="group relative inline-flex items-center justify-center gap-3 bg-[#f97316] hover:bg-[#ea6b0f] text-white font-bold text-[18px] px-10 py-5 rounded-2xl transition-all duration-200 hover:shadow-2xl hover:shadow-[#f97316]/35 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#f97316]/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Tire Prices Now
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <a
              href="#shops"
              className="inline-flex items-center justify-center gap-2 text-[#6e6e73] hover:text-[#1d1d1f] font-semibold text-[16px] px-7 py-5 rounded-2xl transition-colors duration-200"
            >
              For Shop Owners
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </HeroReveal>

        {/* Trust line */}
        <HeroReveal delay={0.46}>
          <p className="text-sm text-[#a1a1a6] flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Free to use · No account required
          </p>
        </HeroReveal>

      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-[#d2d2d7]/50" aria-hidden="true" />
    </section>
  );
}
