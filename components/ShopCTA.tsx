const BENEFITS = [
  "Free premium listing for 3 months",
  "Receive ready-to-book customer leads",
  "List all your services — tires, alignments, and more",
  "Manage your services and pricing online",
  "Appear first when customers search nearby",
  "Dedicated analytics and performance dashboard",
];

import { SlideLeft, SlideRight, Stagger, StaggerItem } from "./ui/Animate";

export default function ShopCTA() {
  return (
    <section id="shops" className="py-28 bg-[#1d1d1f]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* Left: copy */}
          <SlideLeft className="text-white">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-5">
              For Shop Owners
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
              More customers.
              <br />
              <span className="text-[#f97316]">Less effort.</span>
            </h2>
            <p className="text-[17px] text-[#a1a1a6] leading-relaxed mb-10 max-w-lg">
              Join Houston&apos;s fastest-growing tire services marketplace and get discovered by
              customers actively searching for tires, alignments, and installations right now.
            </p>

            <Stagger className="space-y-4" staggerDelay={0.08}>
              {BENEFITS.map((benefit) => (
                <StaggerItem key={benefit} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#f97316]/20 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-[#d2d2d7]">{benefit}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </SlideLeft>

          {/* Right: card */}
          <SlideRight className="bg-white rounded-3xl p-8 sm:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 bg-[#f5f5f7] rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[#1d1d1f] text-[17px] leading-tight">Shop Partner Program</h3>
                <p className="text-xs text-[#6e6e73] mt-0.5">Start free for 3 months</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[#f5f5f7] rounded-2xl p-6 mb-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#6e6e73] mb-1.5">After free trial</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#1d1d1f]">$149</span>
                    <span className="text-[#6e6e73] text-sm">/month</span>
                  </div>
                  <p className="text-xs text-[#6e6e73] mt-1">Cancel anytime · No setup fees</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6e6e73] mb-1">Avg. monthly ROI</p>
                  <p className="text-2xl font-bold text-green-600">$2,400<span className="text-base font-normal text-[#6e6e73]">+</span></p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href="#"
              className="block w-full bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-[15px] text-center py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-[#f97316]/25 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40"
            >
              Join as a Shop Partner
            </a>

            <p className="text-center text-xs text-[#a1a1a6] mt-3.5">
              No credit card required for trial
            </p>

            {/* Avatars */}
            <div className="mt-7 pt-7 border-t border-[#f5f5f7] flex items-center gap-3">
              <div className="flex -space-x-2">
                {["Q", "H", "L", "B"].map((l) => (
                  <div key={l} className="w-8 h-8 rounded-full bg-[#f5f5f7] border-2 border-white flex items-center justify-center text-xs font-bold text-[#6e6e73]">
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#6e6e73]">
                <span className="font-semibold text-[#1d1d1f]">50+ shops</span> already growing with EzTread
              </p>
            </div>
          </SlideRight>

        </div>
      </div>
    </section>
  );
}
