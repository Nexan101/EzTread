import { FadeUp } from "./ui/Animate";

const BRANDS: { name: string; color: string; weight?: string }[] = [
  { name: "MICHELIN",    color: "#009A44", weight: "800" },
  { name: "Bridgestone", color: "#E31837", weight: "700" },
  { name: "FIRESTONE",   color: "#CC0000", weight: "800" },
  { name: "Goodyear",    color: "#003087", weight: "700" },
  { name: "Continental", color: "#111111", weight: "600" },
  { name: "BFGoodrich",  color: "#CC0000", weight: "800" },
  { name: "PIRELLI",     color: "#CE1126", weight: "800" },
  { name: "General Tire",color: "#B22222", weight: "700" },
  { name: "Uniroyal",    color: "#1B3A8C", weight: "700" },
  { name: "TOYO TIRES",  color: "#E2001A", weight: "800" },
  { name: "YOKOHAMA",    color: "#003DA5", weight: "800" },
  { name: "Dunlop",      color: "#111111", weight: "700" },
  { name: "HANKOOK",     color: "#DA291C", weight: "800" },
  { name: "Kelly",       color: "#CC0000", weight: "700" },
  { name: "Gislaved",    color: "#B22222", weight: "700" },
  { name: "Falken",      color: "#E31837", weight: "800" },
  { name: "Nitto",       color: "#111111", weight: "700" },
];

export default function PriceComparison() {
  return (
    <section id="brands" className="py-12 bg-[#f5f5f7] border-y border-[#e0e0e5] overflow-hidden">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 mb-8">
        <FadeUp>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] text-center">
            Brands We Compare
          </p>
        </FadeUp>
      </div>

      <div className="relative flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        {[0, 1].map((set) => (
          <ul
            key={set}
            aria-hidden={set === 1}
            className="flex shrink-0 items-center gap-12 animate-marquee"
          >
            {BRANDS.map((brand) => (
              <li key={brand.name} className="shrink-0">
                <span
                  style={{
                    color: brand.color,
                    fontWeight: brand.weight ?? "700",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: "18px",
                    letterSpacing: "-0.01em",
                    opacity: 0.7,
                    transition: "opacity 0.2s",
                  }}
                  className="hover:opacity-100 whitespace-nowrap cursor-default"
                >
                  {brand.name}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 36s linear infinite;
        }
      `}</style>
    </section>
  );
}
