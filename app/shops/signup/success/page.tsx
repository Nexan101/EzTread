import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Profile Submitted — EzTread" };

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-12 border border-[#d2d2d7] shadow-sm max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-3">Profile Submitted!</h1>
        <p className="text-[#6e6e73] mb-6 leading-relaxed">
          Your shop profile is now <strong>pending review</strong>. Our team will verify your
          business information within <strong>1–2 business days</strong>.
        </p>

        <div className="bg-[#f5f5f7] rounded-2xl p-5 text-left mb-8 space-y-3">
          <p className="text-sm font-semibold text-[#1d1d1f]">What happens next:</p>
          <ul className="text-sm text-[#6e6e73] space-y-2">
            <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Check your email for a confirmation</li>
            <li className="flex gap-2"><span className="text-[#f97316] font-bold">→</span> We verify your business info (1–2 days)</li>
            <li className="flex gap-2"><span className="text-[#f97316] font-bold">→</span> You receive an approval email</li>
            <li className="flex gap-2"><span className="text-[#f97316] font-bold">→</span> Your profile goes live on EzTread</li>
          </ul>
        </div>

        <Link href="/shop-dashboard"
          className="block w-full bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-[15px] py-4 rounded-2xl transition-all duration-200 mb-3">
          Go to Shop Dashboard
        </Link>
        <Link href="/" className="block text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  );
}
