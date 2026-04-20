import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | EzTread",
  description: "Terms and conditions for using the EzTread tire price comparison service.",
};

const LAST_UPDATED = "April 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f7] pt-14">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-[#6e6e73] mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-10 text-[15px] text-[#3a3a3c] leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using EzTread (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">2. Description of Service</h2>
              <p>
                EzTread is a tire price comparison tool that helps consumers find and compare tire prices from major retailers and locate nearby tire installation shops. Tire prices displayed are sourced from third-party retailers via automated web search and may not reflect current or accurate pricing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">3. Price Information Disclaimer</h2>
              <p>
                <strong>Prices shown on EzTread are for informational purposes only.</strong> We use AI-powered web search to retrieve pricing from third-party retailer websites. This information:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>May be outdated, incomplete, or inaccurate</li>
                <li>Does not constitute a binding offer or guarantee of availability</li>
                <li>May differ from prices at checkout on retailer websites</li>
                <li>Should be independently verified before making any purchase decision</li>
              </ul>
              <p className="mt-3">
                EzTread is not affiliated with Walmart, Sam&rsquo;s Club, Costco, Discount Tire, or any other retailer listed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">4. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to overload, disrupt, or gain unauthorized access to our systems</li>
                <li>Scrape, crawl, or systematically extract data from the Service</li>
                <li>Use automated scripts to make excessive requests to our APIs</li>
                <li>Misrepresent your identity or affiliation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">6. Intellectual Property</h2>
              <p>
                The EzTread name, logo, and website design are owned by EzTread. Tire pricing data is sourced from third-party retailers and is their respective property. You may not reproduce or distribute our proprietary content without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, EzTread shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including reliance on any pricing information displayed. Your sole remedy for dissatisfaction with the Service is to stop using it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">8. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or accuracy of information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">9. Changes to Terms</h2>
              <p>
                We may modify these terms at any time. The date at the top of this page reflects the most recent revision. Continued use of the Service after changes constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">10. Governing Law</h2>
              <p>
                These terms are governed by the laws of the State of Texas, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">11. Contact</h2>
              <p>
                Questions about these terms? Contact us at{" "}
                <a href="mailto:legal@eztread.com" className="text-[#f97316] hover:underline">legal@eztread.com</a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#e5e5ea]">
            <Link href="/" className="text-sm font-medium text-[#f97316] hover:text-[#ea6b0f] transition-colors">
              ← Back to EzTread
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
