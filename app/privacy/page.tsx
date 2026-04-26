import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — EzTread",
  description: "How EzTread collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="April 26, 2025">
      <p>
        Your privacy matters to us. This Privacy Policy explains how EzTread ("we," "us," "our")
        collects, uses, and shares information when you use our platform.
      </p>

      <hr />

      <h2>1. Information We Collect</h2>

      <h3>From Shop Owners</h3>
      <ul>
        <li>Business name, address, phone number, email, and website</li>
        <li>Pricing and service information</li>
        <li>Business hours and specialties</li>
        <li>IP address and user agent at signup (for terms acceptance logging)</li>
      </ul>

      <h3>From Customers</h3>
      <ul>
        <li>Tire size and vehicle information submitted in search queries</li>
        <li>General location (city/ZIP) for local shop matching</li>
        <li>Anonymous usage data (pages visited, clicks, search terms)</li>
      </ul>

      <h3>Automatically Collected</h3>
      <ul>
        <li>IP address (hashed for privacy)</li>
        <li>Browser type and version</li>
        <li>Referring URLs and navigation patterns</li>
        <li>Session cookies and preferences</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li><strong>Shop data:</strong> Displayed publicly on EzTread for comparison and search</li>
        <li><strong>Customer searches:</strong> Used to generate price comparisons and match local shops</li>
        <li><strong>Analytics:</strong> Aggregate, anonymized data to improve platform performance</li>
        <li><strong>Communications:</strong> Account notifications, verification emails, support responses</li>
        <li><strong>Legal compliance:</strong> Terms acceptance logging, fraud prevention</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <ul>
        <li><strong>Shop profiles are public</strong> — visible to all internet users, including competitors</li>
        <li>Customer search data may be shared with the shops whose results are returned</li>
        <li>We do not sell personal data to third parties</li>
        <li>We may share data with service providers (hosting, email, analytics) under strict confidentiality agreements</li>
        <li>We may disclose data when required by law or to protect our rights</li>
      </ul>

      <h2>4. No Data Selling</h2>
      <p>
        We do not sell, rent, or trade your personal information to any third party for their
        marketing purposes. Period.
      </p>

      <h2>5. Cookies</h2>
      <ul>
        <li><strong>Session cookies:</strong> Keep you logged in during your visit</li>
        <li><strong>Preference cookies:</strong> Remember your search settings and location</li>
        <li><strong>Analytics cookies:</strong> Anonymous tracking of platform usage (no personal identification)</li>
      </ul>
      <p>You can disable cookies in your browser settings, though some features may not work correctly.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
        <li><strong>Update:</strong> Correct inaccurate information through your dashboard</li>
        <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
        <li><strong>Export:</strong> Request a machine-readable copy of your data</li>
        <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time</li>
      </ul>
      <p>To exercise these rights, email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>.</p>

      <h2>7. CCPA (California Residents)</h2>
      <p>California residents have additional rights under the California Consumer Privacy Act:</p>
      <ul>
        <li>Right to know what personal information we collect and why</li>
        <li>Right to delete personal information</li>
        <li>Right to opt out of the sale of personal information (we do not sell data)</li>
        <li>Right to non-discrimination for exercising privacy rights</li>
      </ul>

      <h2>8. GDPR (EU Residents)</h2>
      <p>If you are in the European Union, you have rights under the GDPR including:</p>
      <ul>
        <li>Right to access, rectification, and erasure</li>
        <li>Right to data portability</li>
        <li>Right to restrict or object to processing</li>
        <li>Right to lodge a complaint with your local supervisory authority</li>
      </ul>
      <p>Our legal basis for processing shop owner data is contractual necessity and legitimate interest.</p>

      <h2>9. Security</h2>
      <ul>
        <li>All data is transmitted over SSL/TLS encryption</li>
        <li>Passwords are hashed and never stored in plain text</li>
        <li>IP addresses are hashed before storage</li>
        <li>We conduct regular security reviews of our infrastructure</li>
      </ul>

      <h2>10. Children's Privacy</h2>
      <p>
        EzTread is not intended for children under 13. We do not knowingly collect personal
        information from children. If you believe a child has provided us information, contact us
        immediately at <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>.
      </p>

      <h2>11. Policy Updates</h2>
      <p>
        We may update this Privacy Policy periodically. We will notify registered users of material
        changes by email. The "Last updated" date at the top reflects the most recent revision.
      </p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions or requests: <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>
      </p>
    </LegalLayout>
  );
}
