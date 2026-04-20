import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | EzTread",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-[#d2d2d7] mb-4">404</p>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Page not found</h1>
        <p className="text-[15px] text-[#6e6e73] mb-8">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/compare"
            className="h-10 px-5 bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Compare Prices
          </Link>
          <Link
            href="/"
            className="h-10 px-5 border border-[#d2d2d7] hover:border-[#a1a1a6] bg-white text-[#1d1d1f] font-semibold text-sm rounded-xl transition-colors flex items-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
