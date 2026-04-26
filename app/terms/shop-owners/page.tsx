import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Shop Owner Terms of Service — EzTread",
  description: "Terms governing shop owner participation on the EzTread platform.",
};

export default function ShopOwnerTermsPage() {
  return (
    <LegalLayout title="Shop Owner Terms of Service" lastUpdated="April 26, 2025">
      <p>
        These Shop Owner Terms of Service ("Shop Terms") govern your participation as a business
        on the EzTread platform. By creating or maintaining a shop profile, you agree to these terms
        in addition to our <a href="/terms">General Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
      </p>

      <hr />

      <h2>1. Service Description</h2>
      <p>EzTread provides a free tier listing that includes:</p>
      <ul>
        <li>A public shop profile page displaying your business information and pricing</li>
        <li>Visibility in EzTread search results for customers in your area</li>
        <li>A basic profile with address, hours, phone number, and service pricing</li>
      </ul>
      <p>
        The free tier does not include priority placement, lead notifications, analytics, or other
        features available in the Premium plan.
      </p>

      <h2>2. Shop Responsibilities</h2>
      <p>As a shop owner or authorized representative, you agree to:</p>
      <ul>
        <li>Provide accurate, truthful, and complete business information</li>
        <li>Keep pricing and service information current and up to date</li>
        <li>Respond to customers professionally and honor published pricing</li>
        <li>Maintain all required business licenses and comply with applicable laws</li>
        <li>Notify EzTread promptly of any changes to your business status</li>
        <li>Ensure all staff interacting with EzTread-referred customers maintain professional conduct</li>
      </ul>

      <h2>3. Prohibited Actions</h2>
      <p>You may not:</p>
      <ul>
        <li>Submit false, misleading, or fraudulent business information</li>
        <li>Impersonate another business or individual</li>
        <li>Manipulate reviews, ratings, or rankings through artificial means</li>
        <li>Use EzTread to engage in any illegal business practices</li>
        <li>Harass, threaten, or discriminate against customers</li>
        <li>Bait-and-switch on advertised pricing</li>
        <li>Create multiple profiles for the same business location</li>
      </ul>

      <h2>4. Public Display Notice</h2>
      <p>
        <strong>By listing on EzTread, you explicitly acknowledge and agree that:</strong>
      </p>
      <ul>
        <li>Your shop name, address, phone number, hours, and pricing will be publicly visible to all internet users</li>
        <li>Your pricing information will be visible to your competitors</li>
        <li>EzTread may display your information in search results, comparison tables, and marketing materials</li>
        <li>You cannot restrict which customers or businesses view your public profile</li>
      </ul>

      <h2>5. Customer Reviews</h2>
      <ul>
        <li>Customers may leave public reviews of your shop on EzTread</li>
        <li>Reviews are public and visible to all users</li>
        <li>You cannot pay to remove or suppress negative reviews</li>
        <li>You may respond to reviews professionally through your dashboard</li>
        <li>EzTread reserves the right to remove reviews that violate our policies</li>
      </ul>

      <h2>6. No Guarantees</h2>
      <p>
        EzTread does not guarantee any customers, leads, revenue, or business results from your listing.
        Search ranking, visibility, and referral volume may vary and are not guaranteed.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        You retain ownership of all content you submit (photos, descriptions, pricing). By submitting
        content, you grant EzTread a non-exclusive, royalty-free license to display, resize, and
        distribute your content on the platform and in related marketing materials.
      </p>

      <h2>8. Liability Disclaimer</h2>
      <p>
        EzTread is a listing and comparison platform only. We are not responsible for:
      </p>
      <ul>
        <li>The quality of tire services provided by listed shops</li>
        <li>Vehicle damage, injuries, or disputes arising from shop services</li>
        <li>Customer complaints about your shop's products or workmanship</li>
        <li>Pricing discrepancies between your listing and actual charges</li>
      </ul>

      <h2>9. Termination</h2>
      <ul>
        <li>You may request profile removal at any time by emailing <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a></li>
        <li>EzTread may suspend or remove your profile for violations of these terms, without prior notice</li>
        <li>Upon termination, your public profile will be removed within 5 business days</li>
      </ul>

      <h2>10. Data Usage</h2>
      <p>
        Your business information is collected and used as described in our <a href="/privacy">Privacy Policy</a>.
        By creating a profile, you consent to this data usage.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These terms are governed by the laws of the State of Texas, USA. Any disputes shall be
        resolved in the courts of Harris County, Texas.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these terms, contact us at <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>.
      </p>
    </LegalLayout>
  );
}
