import Link from "next/link";

const CUSTOMER_LINKS = [
  { label: "How It Works", href: "#" },
  { label: "Popular Tire Sizes", href: "#" },
  { label: "Houston Tire Shops", href: "#" },
  { label: "Tire Buying Guide", href: "#" },
  { label: "Blog", href: "#" },
];

const SHOP_LINKS = [
  { label: "Become a Partner", href: "#shops" },
  { label: "Pricing", href: "#" },
  { label: "Wholesale Dashboard", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Contact Us", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-10">

        {/* Top grid */}
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-[#d2d2d7]">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center group-hover:bg-[#ea6b0f] transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="2.5" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">EzTread</span>
            </Link>

            <p className="text-[13px] text-[#a1a1a6] italic mb-5">Compare. Save. Drive Easy.</p>

            <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-7 max-w-xs">
              Houston&apos;s local tire services marketplace. Compare prices for tires,
              installations, alignments, and more — from shops near you.
            </p>

            {/* Socials */}
            <div className="flex gap-2.5">
              {[
                {
                  label: "Twitter / X",
                  icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
                  viewBox: "0 0 24 24",
                  filled: true,
                },
                {
                  label: "Instagram",
                  icon: (
                    <path
                      fillRule="evenodd"
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                      clipRule="evenodd"
                    />
                  ),
                  viewBox: "0 0 24 24",
                  filled: true,
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-8 h-8 bg-[#e8e8ed] hover:bg-[#1d1d1f] hover:text-white text-[#6e6e73] rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox={social.viewBox} aria-hidden="true">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Customers */}
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#6e6e73] mb-5">
              For Customers
            </h3>
            <ul className="space-y-3.5">
              {CUSTOMER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-[#1d1d1f] hover:text-[#f97316] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shops */}
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#6e6e73] mb-5">
              For Shops
            </h3>
            <ul className="space-y-3.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-[#1d1d1f] hover:text-[#f97316] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-[#a1a1a6]">
          <p>
            &copy; {new Date().getFullYear()} EzTread, Inc. All rights reserved. &middot; Made in Houston, TX
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-[#1d1d1f] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1d1d1f] transition-colors">Terms of Service</Link>
            <Link href="/sitemap.xml" className="hover:text-[#1d1d1f] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
