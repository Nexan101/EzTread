import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote | EzTread",
  description: "Request a tire installation quote directly from a local shop.",
};

type Search = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return typeof v === "string" ? v : v[0];
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const shopName = first(sp.name);
  const address = first(sp.address);
  const phone = first(sp.phone);

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-[#f5f5f7] py-20 px-5 sm:px-8">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-3">Request a quote</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-4">
            {shopName ? `Quote from ${shopName}` : "Get a quote"}
          </h1>
          <p className="text-[17px] text-[#6e6e73] leading-relaxed mb-8">
            This page is coming soon. You&rsquo;ll be able to request pricing from this shop directly from EzTread.
          </p>
          {(address || phone) && (
            <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm px-6 py-5 text-left text-sm text-[#6e6e73] mb-8 space-y-1">
              {address && <p>{address}</p>}
              {phone && <p className="font-medium text-[#1d1d1f]">{phone}</p>}
            </div>
          )}
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#f97316] hover:text-[#ea6b0f] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to search
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
