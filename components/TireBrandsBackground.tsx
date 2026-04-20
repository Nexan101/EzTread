"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BrandItem {
  name: string;
  x: number;       // % from left
  y: number;       // % from top
  size: number;    // px
  opacity: number;
  rotation: number;
  depth: number;   // parallax strength
  blur: number;    // px
  color: string;
  duration: number;
  delay: number;
}

// Spread brands across the full hero, varying depth/size/opacity for a layered look
const BRANDS: BrandItem[] = [
  { name: "Michelin",    x:  3,  y:  8,  size: 58, opacity: 0.09, rotation: -7,  depth: 0.6, blur: 2, color: "#1d1d1f", duration: 7,   delay: 0   },
  { name: "Bridgestone", x: 72,  y:  4,  size: 38, opacity: 0.07, rotation:  5,  depth: 1.2, blur: 3, color: "#1d1d1f", duration: 9,   delay: 1.2 },
  { name: "Goodyear",    x: 14,  y: 68,  size: 50, opacity: 0.09, rotation: 11,  depth: 0.7, blur: 2, color: "#f97316", duration: 8,   delay: 2.4 },
  { name: "Pirelli",     x: 58,  y: 78,  size: 46, opacity: 0.08, rotation: -5,  depth: 1.0, blur: 3, color: "#1d1d1f", duration: 6.5, delay: 0.6 },
  { name: "Continental", x: 38,  y: 12,  size: 30, opacity: 0.06, rotation:  8,  depth: 1.4, blur: 4, color: "#1d1d1f", duration: 10,  delay: 3.0 },
  { name: "Dunlop",      x: 84,  y: 42,  size: 42, opacity: 0.07, rotation: -12, depth: 0.9, blur: 3, color: "#f97316", duration: 7.5, delay: 1.8 },
  { name: "Firestone",   x:  1,  y: 44,  size: 28, opacity: 0.05, rotation: 14,  depth: 1.1, blur: 4, color: "#1d1d1f", duration: 9,   delay: 4.0 },
  { name: "Yokohama",    x: 53,  y: 53,  size: 34, opacity: 0.06, rotation: -17, depth: 1.3, blur: 4, color: "#1d1d1f", duration: 8.5, delay: 2.8 },
  { name: "Toyo Tires",  x: 27,  y: 84,  size: 54, opacity: 0.09, rotation:  6,  depth: 0.7, blur: 2, color: "#f97316", duration: 7,   delay: 0.9 },
  { name: "Hankook",     x: 68,  y: 22,  size: 40, opacity: 0.07, rotation: -9,  depth: 1.2, blur: 3, color: "#1d1d1f", duration: 6,   delay: 3.6 },
  { name: "Kumho",       x: 18,  y: 28,  size: 24, opacity: 0.05, rotation: 19,  depth: 1.5, blur: 5, color: "#1d1d1f", duration: 11,  delay: 1.4 },
  { name: "Nitto",       x: 88,  y: 68,  size: 48, opacity: 0.08, rotation: -14, depth: 0.8, blur: 2, color: "#f97316", duration: 7.5, delay: 2.6 },
  { name: "Falken",      x: 46,  y: 36,  size: 36, opacity: 0.05, rotation: 10,  depth: 1.4, blur: 5, color: "#1d1d1f", duration: 9.5, delay: 0.4 },
  { name: "BFGoodrich",  x:  6,  y: 90,  size: 22, opacity: 0.04, rotation: -8,  depth: 1.7, blur: 6, color: "#1d1d1f", duration: 12,  delay: 5.0 },
  { name: "Cooper",      x: 63,  y: 91,  size: 30, opacity: 0.06, rotation:  5,  depth: 1.3, blur: 4, color: "#1d1d1f", duration: 8,   delay: 2.0 },
  { name: "Nexen",       x: 33,  y: 57,  size: 26, opacity: 0.05, rotation: -20, depth: 1.6, blur: 5, color: "#f97316", duration: 10,  delay: 3.4 },
  { name: "General",     x: 78,  y: 88,  size: 20, opacity: 0.04, rotation: 15,  depth: 1.8, blur: 6, color: "#1d1d1f", duration: 13,  delay: 5.5 },
  { name: "Kenda",       x: 48,  y:  1,  size: 44, opacity: 0.07, rotation: -5,  depth: 0.9, blur: 3, color: "#1d1d1f", duration: 8,   delay: 2.2 },
  { name: "Sumitomo",    x: 92,  y: 18,  size: 26, opacity: 0.05, rotation: -10, depth: 1.5, blur: 5, color: "#1d1d1f", duration: 10,  delay: 4.2 },
  { name: "Uniroyal",    x: 22,  y: 50,  size: 20, opacity: 0.04, rotation:  12, depth: 1.9, blur: 6, color: "#1d1d1f", duration: 12,  delay: 6.0 },
];

// Decorative tire ring positions
const RINGS = [
  { cx: 12,  cy: 18,  r: 90,  opacity: 0.04, depth: 0.5 },
  { cx: 82,  cy: 55,  r: 130, opacity: 0.03, depth: 1.0 },
  { cx:  5,  cy: 78,  r: 70,  opacity: 0.04, depth: 0.7 },
  { cx: 92,  cy: 10,  r: 110, opacity: 0.025, depth: 1.3 },
  { cx: 48,  cy: 95,  r: 95,  opacity: 0.03, depth: 0.9 },
  { cx: 35,  cy: 35,  r: 60,  opacity: 0.035, depth: 1.5 },
  { cx: 68,  cy: 72,  r: 80,  opacity: 0.03, depth: 1.1 },
];

function TireRing({ r, opacity }: { r: number; opacity: number }) {
  const spokes = 10;
  return (
    <svg
      width={r * 2}
      height={r * 2}
      viewBox={`0 0 ${r * 2} ${r * 2}`}
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Outer tread ring */}
      <circle cx={r} cy={r} r={r - 6} stroke="#1d1d1f" strokeWidth="12" />
      {/* Hub ring */}
      <circle cx={r} cy={r} r={r * 0.28} stroke="#1d1d1f" strokeWidth="8" />
      {/* Inner rim */}
      <circle cx={r} cy={r} r={r * 0.62} stroke="#1d1d1f" strokeWidth="4" strokeDasharray="6 6" />
      {/* Spokes */}
      {Array.from({ length: spokes }).map((_, j) => {
        const angle = (j / spokes) * Math.PI * 2 - Math.PI / 2;
        const x1 = r + Math.cos(angle) * r * 0.3;
        const y1 = r + Math.sin(angle) * r * 0.3;
        const x2 = r + Math.cos(angle) * r * 0.6;
        const y2 = r + Math.sin(angle) * r * 0.6;
        return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1d1d1f" strokeWidth="5" strokeLinecap="round" />;
      })}
      {/* Tread blocks */}
      {Array.from({ length: 16 }).map((_, j) => {
        const angle = (j / 16) * Math.PI * 2;
        const x1 = r + Math.cos(angle) * (r * 0.73);
        const y1 = r + Math.sin(angle) * (r * 0.73);
        const x2 = r + Math.cos(angle) * (r * 0.92);
        const y2 = r + Math.sin(angle) * (r * 0.92);
        return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1d1d1f" strokeWidth="7" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export default function TireBrandsBackground() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMouse({ x: 0.5, y: 0.5 });
    });
  }, []);

  useEffect(() => {
    const section = sectionRef.current?.closest("section") as HTMLElement | null;
    if (!section) return;
    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const px = mouse.x - 0.5; // -0.5 → 0.5
  const py = mouse.y - 0.5;

  return (
    <>
      <style>{`
        @keyframes tireBrandFloat {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-10px); }
        }
      `}</style>

      <div
        ref={sectionRef}
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* ── Brand name labels ── */}
        {BRANDS.map((b) => {
          const dx = px * b.depth * 50;
          const dy = py * b.depth * 35;
          return (
            <div
              key={b.name}
              style={{
                position: "absolute",
                left: `${b.x}%`,
                top: `${b.y}%`,
                transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${b.rotation}deg)`,
                transition: "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: `${b.size}px`,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: b.color,
                  opacity: b.opacity,
                  whiteSpace: "nowrap",
                  animation: `tireBrandFloat ${b.duration}s ease-in-out ${b.delay}s infinite`,
                  fontFamily: "var(--font-sans, -apple-system, system-ui, sans-serif)",
                }}
              >
                {b.name}
              </span>
            </div>
          );
        })}

        {/* ── Tire ring SVGs ── */}
        {RINGS.map((ring, i) => {
          const dx = px * ring.depth * 40;
          const dy = py * ring.depth * 30;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${ring.cx}%`,
                top: `${ring.cy}%`,
                transform: `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0)`,
                transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            >
              <TireRing r={ring.r} opacity={ring.opacity} />
            </div>
          );
        })}

        {/* ── Gradient veil: keeps brands from competing with the text ── */}
        {/* Centre fade so brands near the content area are dimmer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 30% 45%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.15) 100%)",
          }}
        />
      </div>
    </>
  );
}
