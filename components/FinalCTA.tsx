import { FadeUp, Stagger, StaggerItem } from "./ui/Animate";

export default function FinalCTA() {
  return (
    <section className="py-36 bg-[#1d1d1f] relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(ellipse, #f97316, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <FadeUp>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-6">
            Get Started
          </p>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
            Ready to stop
            <br />
            overpaying?
          </h2>
          <p className="text-[17px] sm:text-lg text-[#a1a1a6] mb-12 max-w-lg mx-auto leading-relaxed">
            Compare tire services from 50+ Houston shops in seconds — tires, installations,
            alignments, and more. Free, no account needed.
          </p>
        </FadeUp>

        <FadeUp delay={0.18}>
          <a
            href="/compare"
            className="inline-flex items-center gap-2.5 bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-[17px] px-9 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-[#f97316]/30 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40"
            style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
          >
            Search Tire Services Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </FadeUp>

        <Stagger className="mt-12 flex flex-wrap justify-center items-center gap-6 text-[13px] text-[#6e6e73]" staggerDelay={0.1}>
          {[
            "10,000+ service quotes generated",
            "50+ verified Houston shops",
            "Average savings of $75",
          ].map((item) => (
            <StaggerItem key={item} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#f97316] shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {item}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
