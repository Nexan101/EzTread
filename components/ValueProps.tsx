"use client";

import { FadeUp, Stagger, StaggerItem } from "./ui/Animate";

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "No Hidden Fees",
    description:
      "See the full cost upfront — tires, installation, alignment, disposal, and every fee itemized before you commit. What you see is what you pay.",
    tag: "Zero surprise charges",
    tagColor: "text-green-600 bg-green-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: "Compare Local Shops",
    description:
      "Tire service prices vary wildly across Houston. EzTread puts every shop side-by-side so you can instantly spot the best deal near you.",
    tag: "Save $65–90 on average",
    tagColor: "text-blue-600 bg-blue-50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Fast & Free",
    description:
      "Get quotes for tires, installations, alignments, and more from local Houston shops in seconds — no account, no phone calls, no pressure.",
    tag: "Results in 30 seconds",
    tagColor: "text-orange-600 bg-orange-50",
  },
];

export default function ValueProps() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <FadeUp className="max-w-2xl mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-4">
            Why EzTread
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
            The smarter way to shop for tire services.
          </h2>
          <p className="mt-5 text-[17px] text-[#6e6e73] leading-relaxed">
            Most people overpay because they call shops one by one with no way to compare.
            EzTread shows you every quote, every fee, all in one place.
          </p>
        </FadeUp>

        {/* Cards */}
        <Stagger className="grid md:grid-cols-3 gap-5" staggerDelay={0.12}>
          {VALUE_PROPS.map((prop, i) => (
            <StaggerItem key={prop.title}>
              <div className="group bg-[#f5f5f7] hover:bg-white rounded-3xl p-8 border border-transparent hover:border-[#d2d2d7] transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1">
                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-[#1d1d1f] mb-6 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  {prop.icon}
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#a1a1a6] mb-3 block">
                  0{i + 1}
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">{prop.title}</h3>
                <p className="text-[15px] text-[#6e6e73] leading-relaxed mb-5">{prop.description}</p>
                <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full ${prop.tagColor}`}>
                  {prop.tag}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
