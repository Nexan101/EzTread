import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Use — EzTread",
  description: "EzTread's general terms of use for all platform users.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" lastUpdated="April 26, 2025">
      <p>
        Welcome to EzTread. By accessing or using our platform, you agree to these Terms of Use.
        If you are a shop owner, additional terms in our{" "}
        <a href="/terms/shop-owners">Shop Owner Terms of Service</a> also apply.
      </p>

      <hr />

      <h2>1. Platform Description</h2>
      <p>
        EzTread is a tire price comparison platform that allows consumers to compare tire and
        installation costs from local shops. We do not sell tires or perform installation services.
        We are a marketplace connecting consumers with independent tire businesses.
      </p>

      <h2>2. User Accounts</h2>
      <ul>
        <li>You must be 18 or older to create an account</li>
        <li>You are responsible for maintaining the security of your account credentials</li>
        <li>You may not share account access with others</li>
        <li>You must provide accurate information when creating an account</li>
        <li>We may suspend accounts that violate these terms</li>
      </ul>

      <h2>3. Acceptable Use</h2>
      <p>You agree to use EzTread only for lawful purposes and in accordance with our{" "}
        <a href="/acceptable-use">Acceptable Use Policy</a>. You may not use EzTread to:
      </p>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Submit false or misleading information</li>
        <li>Harass or harm other users</li>
        <li>Attempt to gain unauthorized access to our systems</li>
        <li>Scrape or harvest data without permission</li>
      </ul>

      <h2>4. Content Standards</h2>
      <p>User-submitted content must be:</p>
      <ul>
        <li>Accurate and not misleading</li>
        <li>Free of illegal, obscene, or defamatory material</li>
        <li>Owned by you or used with permission</li>
        <li>Relevant to the platform's purpose</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        The EzTread platform, design, logo, and software are owned by EzTread and protected by
        copyright and trademark law. You may not copy, modify, or distribute our platform code
        or design without written permission. See our <a href="/dmca">DMCA Policy</a> for
        copyright infringement procedures.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        EzTread is provided "as is" without warranties of any kind. We are not liable for:
      </p>
      <ul>
        <li>Inaccuracies in shop listings</li>
        <li>Service quality or outcomes from listed shops</li>
        <li>Any indirect, incidental, or consequential damages</li>
        <li>Platform downtime or data loss</li>
      </ul>
      <p>See our full <a href="/disclaimer">Disclaimer</a> for more details.</p>

      <h2>7. Dispute Resolution</h2>
      <p>
        Any disputes between you and EzTread will be governed by the laws of Texas, USA.
        Before filing any legal claim, you agree to contact us at{" "}
        <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a> to attempt informal resolution.
      </p>

      <h2>8. Changes to Terms</h2>
      <p>
        We may update these terms at any time. We'll notify registered users of material changes
        by email. Continued use of EzTread after changes constitutes acceptance of the new terms.
      </p>

      <h2>9. Other Policies</h2>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms/shop-owners">Shop Owner Terms</a></li>
        <li><a href="/acceptable-use">Acceptable Use Policy</a></li>
        <li><a href="/dmca">DMCA & Copyright Policy</a></li>
        <li><a href="/disclaimer">Disclaimer</a></li>
      </ul>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>
      </p>
    </LegalLayout>
  );
}
