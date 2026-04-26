import Link from "next/link";
import { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="bg-white border-b border-[#e0e0e5] px-5 py-4 flex items-center gap-3">
        <Link href="/" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors text-sm font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          EzTread
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-5 py-16">
        <div className="bg-white rounded-3xl border border-[#d2d2d7] shadow-sm p-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-[#1d1d1f] mb-2">{title}</h1>
          <p className="text-sm text-[#a1a1a6] mb-10">Last updated: {lastUpdated}</p>
          <div className="prose prose-sm max-w-none text-[#1d1d1f] [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-[#3d3d3f] [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:text-[#3d3d3f] [&_li]:mb-1 [&_a]:text-[#f97316] [&_a]:underline [&_hr]:border-[#f0f0f0] [&_hr]:my-8">
            {children}
          </div>
        </div>
        <p className="text-center text-xs text-[#a1a1a6] mt-8">
          Questions? Email <a href="mailto:EzTread@eztread.net" className="text-[#f97316] underline">EzTread@eztread.net</a>
        </p>
      </div>
    </div>
  );
}
