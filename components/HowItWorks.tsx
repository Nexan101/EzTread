const STEPS = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Enter your tire size, service type (tires, alignment, installation, etc.), and your Houston zip code. Takes less than 30 seconds.",
  },
  {
    number: "02",
    title: "Compare shops side-by-side",
    description:
      "See a full breakdown from local Houston shops — service cost, labor, fees, and total price all in one view. No hidden charges.",
  },
  {
    number: "03",
    title: "Book your appointment",
    description:
      "Pick the best deal, lock in your price, and schedule your service directly — fully online, no phone calls required.",
  },
];

import { FadeUp, Stagger, StaggerItem } from "./ui/Animate";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <FadeUp className="max-w-xl mb-20">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-4">
            Simple Process
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
            How It Works
          </h2>
          <p className="mt-5 text-[17px] text-[#6e6e73] leading-relaxed">
            Find and book the best tire service deal near you in under a minute.
          </p>
        </FadeUp>

        {/* Steps */}
        <Stagger className="grid md:grid-cols-3 gap-8 relative" staggerDelay={0.15}>
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-7 left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] h-px bg-[#d2d2d7]" aria-hidden="true" />

          {STEPS.map((step) => (
            <StaggerItem key={step.number} className="relative">
              <div className="w-14 h-14 bg-white rounded-2xl border border-[#d2d2d7] flex items-center justify-center mb-7 shadow-sm relative z-10">
                <span className="text-base font-bold text-[#f97316] font-mono tracking-tight">{step.number}</span>
              </div>
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-3 leading-snug">{step.title}</h3>
              <p className="text-[15px] text-[#6e6e73] leading-relaxed">{step.description}</p>
            </StaggerItem>
          ))}
        </Stagger>

        {/* CTA */}
        <FadeUp delay={0.2} className="mt-16 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="/compare"
            className="inline-flex items-center gap-2 bg-[#1d1d1f] hover:bg-[#3d3d3f] text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/20"
          >
            Get Started — It&apos;s Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-[#6e6e73]">No account required</p>
        </FadeUp>
      </div>
    </section>
  );
}
