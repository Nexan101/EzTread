import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Support & Contact — EzTread",
  description: "Contact EzTread support, legal, and privacy teams.",
};

export default function SupportPage() {
  return (
    <LegalLayout title="Support & Contact" lastUpdated="April 26, 2025">
      <p>
        We&apos;re here to help. Choose the right contact below for the fastest response.
      </p>

      <hr />

      <h2>Contact Us</h2>

      <h3>General Support</h3>
      <p>
        For questions about listings, pricing, account access, or general help:<br />
        <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a><br />
        Response time: 1–2 business days
      </p>

      <h3>Legal & Terms</h3>
      <p>
        For terms of service questions, DMCA notices, or legal matters:<br />
        <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a><br />
        Response time: 2–3 business days
      </p>

      <h3>Privacy</h3>
      <p>
        For data deletion requests, privacy policy questions, or CCPA/GDPR inquiries:<br />
        <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a><br />
        Response time: 5 business days (data requests may take up to 30 days)
      </p>

      <h3>Profile Removal</h3>
      <p>
        To request removal of your shop profile:<br />
        Email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a> with your shop name and the email address associated with your account.
      </p>

      <hr />

      <h2>Frequently Asked Questions</h2>

      <h3>How do I update my shop pricing?</h3>
      <p>
        Log in to your <a href="/shop-dashboard">Shop Dashboard</a> and navigate to the Pricing tab.
        Changes take effect immediately on your public profile.
      </p>

      <h3>How long does profile verification take?</h3>
      <p>
        New shop profiles are reviewed within 1–2 business days. You&apos;ll receive an email
        when your profile is approved and live.
      </p>

      <h3>Can I remove a customer review?</h3>
      <p>
        You cannot pay to remove reviews. However, you may report reviews that violate our
        <a href="/acceptable-use"> Acceptable Use Policy</a> by emailing support. We&apos;ll
        investigate and remove reviews that are fake, abusive, or otherwise policy-violating.
      </p>

      <h3>How do I upgrade to Premium?</h3>
      <p>
        Visit <a href="/join">our pricing page</a> to compare plans and upgrade. Premium includes
        priority placement, lead notifications, and full analytics.
      </p>

      <h3>Is my pricing really visible to competitors?</h3>
      <p>
        Yes. EzTread is a public platform. All listed pricing is visible to all internet users,
        including other shops. This is clearly disclosed during signup.
      </p>

      <h3>How do I delete my account?</h3>
      <p>
        Email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a> with your shop name
        and registered email. We&apos;ll process your deletion within 5 business days.
      </p>
    </LegalLayout>
  );
}
