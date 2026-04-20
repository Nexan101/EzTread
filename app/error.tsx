"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Something went wrong</h1>
          <p className="text-[15px] text-[#6e6e73] mb-8">
            An unexpected error occurred. Please try again or return home.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="h-10 px-5 bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="h-10 px-5 border border-[#d2d2d7] hover:border-[#a1a1a6] bg-white text-[#1d1d1f] font-semibold text-sm rounded-xl transition-colors flex items-center"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
