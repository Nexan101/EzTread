const SHOPS = [
  { name: "QuickFit Tires", tirePrice: 500, installation: 120, fees: 40, isBest: false },
  { name: "HoustonTire Pro", tirePrice: 480, installation: 80, fees: 35, isBest: true },
  { name: "Lone Star Wheels", tirePrice: 490, installation: 150, fees: 45, isBest: false },
];

import { FadeUp, ScaleUp } from "./ui/Animate";

export default function PriceComparison() {
  const totals = SHOPS.map((s) => s.tirePrice + s.installation + s.fees);
  const best = Math.min(...totals);
  const worst = Math.max(...totals);
  const savings = worst - best;

  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <FadeUp className="max-w-xl mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-4">
            Real Example
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
            See What You Save
          </h2>
          <p className="mt-5 text-[17px] text-[#6e6e73] leading-relaxed">
            Same tire, same size — very different total costs.{" "}
            <strong className="text-[#1d1d1f] font-semibold">225/65R17 (set of 4)</strong> in Houston.
          </p>
        </FadeUp>

        {/* Table */}
        <ScaleUp className="rounded-3xl overflow-hidden border border-[#d2d2d7] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]" aria-label="Tire shop price comparison">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
                  {["Shop", "Tires (4)", "Install", "Fees", "Total"].map((col, i) => (
                    <th
                      key={col}
                      className={`px-6 py-4 text-[11px] font-semibold tracking-widest uppercase text-[#6e6e73] ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHOPS.map((shop, i) => {
                  const total = shop.tirePrice + shop.installation + shop.fees;
                  const isBest = total === best;
                  return (
                    <tr
                      key={shop.name}
                      className={`border-b border-[#f5f5f7] last:border-0 transition-colors ${isBest ? "bg-green-50/60" : "bg-white hover:bg-[#fafafa]"}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${isBest ? "bg-green-500 text-white" : "bg-[#f5f5f7] text-[#6e6e73]"}`}>
                            {shop.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[15px] font-semibold text-[#1d1d1f]">{shop.name}</span>
                            {isBest && (
                              <span className="ml-2.5 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Best Price
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right text-[15px] text-[#6e6e73]">${shop.tirePrice}</td>
                      <td className="px-6 py-5 text-right text-[15px] text-[#6e6e73]">${shop.installation}</td>
                      <td className="px-6 py-5 text-right text-[15px] text-[#6e6e73]">${shop.fees}</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-[17px] font-bold tabular-nums ${isBest ? "text-green-600" : "text-[#1d1d1f]"}`}>
                          ${total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScaleUp>

        {/* Savings callout */}
        <FadeUp delay={0.15} className="mt-6 bg-[#f5f5f7] rounded-3xl px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-[17px] font-semibold text-[#1d1d1f]">
              Comparing saves you{" "}
              <span className="text-green-600 font-bold">${savings}</span> on this set
            </p>
            <p className="text-sm text-[#6e6e73] mt-1">
              Same tires, same quality — just a smarter shop choice.
            </p>
          </div>
          <a
            href="/compare"
            className="shrink-0 bg-[#1d1d1f] hover:bg-[#3d3d3f] text-white font-semibold text-[14px] px-6 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/20 whitespace-nowrap"
          >
            Find My Price →
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
