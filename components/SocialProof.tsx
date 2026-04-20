const RETAILERS = ["SimpleTire", "Tire Rack", "Discount Tire", "Mavis Tires", "Local Shops"];

import { FadeUp, Stagger, StaggerItem } from "./ui/Animate";

export default function SocialProof() {
  return (
    <section className="py-28 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Stats row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24" staggerDelay={0.1}>
          {[
            { value: "10,000+", label: "Quotes generated" },
            { value: "50+", label: "Houston tire shops" },
            { value: "$75", label: "Average savings" },
            { value: "4.9", label: "Customer rating" },
          ].map((stat) => (
            <StaggerItem key={stat.label} className="bg-white rounded-3xl p-8 border border-[#d2d2d7] text-center hover:shadow-md hover:shadow-black/5 transition-shadow duration-300">
              <div className="text-4xl font-bold text-[#1d1d1f] tabular-nums mb-2">
                {stat.value}
                {stat.label === "Customer rating" && <span className="text-yellow-400 ml-0.5">★</span>}
              </div>
              <div className="text-[13px] text-[#6e6e73]">{stat.label}</div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Logos */}
        <FadeUp className="mb-0">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#a1a1a6] text-center mb-8">
            Tire services compared from local Houston shops & national retailers
          </p>
          <Stagger className="flex flex-wrap justify-center items-center gap-3" staggerDelay={0.07}>
            {RETAILERS.map((name) => (
              <StaggerItem key={name} className="bg-white border border-[#d2d2d7] rounded-full px-5 py-2.5 text-[13px] font-semibold text-[#6e6e73]">
                {name}
              </StaggerItem>
            ))}
          </Stagger>
        </FadeUp>
      </div>
    </section>
  );
}
