import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | EzTread",
  description: "How EzTread collects, uses, and protects your information.",
};

const LAST_UPDATED = "April 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f7] pt-14">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#6e6e73] mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#6e6e73] mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-gray max-w-none space-y-10 text-[15px] text-[#3a3a3c] leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">1. Who We Are</h2>
              <p>
                EzTread (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the EzTread website and tire price comparison service. This policy explains what information we collect when you use our service and how we use it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">2. Information We Collect</h2>
              <h3 className="text-base font-semibold text-[#1d1d1f] mb-2">Information you provide</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email address and password when you create an account</li>
                <li>Tire size, brand preference, and zip code when you search for prices</li>
                <li>Contact information if you submit a quote request</li>
              </ul>
              <h3 className="text-base font-semibold text-[#1d1d1f] mt-4 mb-2">Information collected automatically</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Location data:</strong> If you grant permission, we use your browser&rsquo;s geolocation API to determine your approximate location. Your coordinates are temporarily stored in your browser&rsquo;s localStorage (up to 24 hours) to avoid repeated location requests. Your location is sent to Google Maps APIs to find nearby tire shops; it is not stored on our servers.
                </li>
                <li>Standard web server logs (IP address, browser type, pages visited) for security and debugging.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide the tire price comparison and local shop search features</li>
                <li>To authenticate your account and maintain your session</li>
                <li>To find tire shops near you using Google Maps</li>
                <li>To search for tire prices using OpenAI&rsquo;s web search capability</li>
                <li>To improve our service and diagnose technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">4. Third-Party Services</h2>
              <p>We use the following third-party services that may process your data:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Supabase</strong> — Authentication and database hosting. Your account credentials are stored securely via Supabase. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">Supabase Privacy Policy</a>.
                </li>
                <li>
                  <strong>Google Maps Platform</strong> — Location geocoding and local business search. Your location data is sent to Google to find nearby tire shops. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">Google Privacy Policy</a>.
                </li>
                <li>
                  <strong>OpenAI</strong> — Tire price search. Your tire size and zip code are sent to OpenAI to search the web for prices. See <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">OpenAI Privacy Policy</a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">5. Data Retention</h2>
              <p>
                Account data is retained until you delete your account. Location data is not stored on our servers. Browser localStorage data (coordinates) expires within 24 hours and can be cleared by you at any time through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">6. Your Rights</h2>
              <p>
                You may request deletion of your account and associated data at any time by contacting us. You can revoke location permission through your browser settings at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">7. Children&rsquo;s Privacy</h2>
              <p>
                Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. The date at the top of this page reflects the most recent revision. Continued use of EzTread after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-3">9. Contact Us</h2>
              <p>
                If you have questions about this privacy policy, please contact us at{" "}
                <a href="mailto:privacy@eztread.com" className="text-[#f97316] hover:underline">privacy@eztread.com</a>.
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
