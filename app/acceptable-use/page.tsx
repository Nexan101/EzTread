import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — EzTread",
  description: "Rules governing acceptable use of the EzTread platform.",
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" lastUpdated="April 26, 2025">
      <p>
        This Acceptable Use Policy governs how you may use EzTread. Violations may result in
        account suspension or permanent removal from the platform.
      </p>

      <hr />

      <h2>1. Prohibited Actions</h2>
      <p>The following are strictly prohibited on EzTread:</p>

      <h3>False or Misleading Information</h3>
      <ul>
        <li>Submitting inaccurate business names, addresses, or contact details</li>
        <li>Listing prices you do not honor</li>
        <li>Claiming certifications or licenses you do not hold</li>
      </ul>

      <h3>Impersonation</h3>
      <ul>
        <li>Creating profiles for businesses you do not own or represent</li>
        <li>Impersonating another shop, person, or EzTread staff</li>
      </ul>

      <h3>Review Manipulation</h3>
      <ul>
        <li>Submitting fake positive reviews for your own shop</li>
        <li>Submitting fake negative reviews for competitors</li>
        <li>Offering incentives in exchange for reviews</li>
        <li>Attempting to remove legitimate negative reviews through payment or coercion</li>
      </ul>

      <h3>Spam and Harassment</h3>
      <ul>
        <li>Sending unsolicited commercial messages to customers or other shops</li>
        <li>Harassing, threatening, or intimidating customers or EzTread staff</li>
        <li>Repeatedly contacting users who have opted out</li>
      </ul>

      <h3>Illegal or Harmful Content</h3>
      <ul>
        <li>Uploading content that infringes copyrights, trademarks, or other intellectual property</li>
        <li>Posting illegal, obscene, or defamatory content</li>
        <li>Engaging in any activity that violates applicable laws</li>
      </ul>

      <h3>Technical Abuse</h3>
      <ul>
        <li>Scraping or harvesting data from EzTread without permission</li>
        <li>Attempting to circumvent security measures or access controls</li>
        <li>Overloading platform infrastructure through automated requests</li>
        <li>Reverse engineering or copying EzTread's software</li>
      </ul>

      <h2>2. Enforcement</h2>
      <p>Violations will result in escalating consequences:</p>
      <ul>
        <li><strong>First offense:</strong> Written warning via email</li>
        <li><strong>Second offense:</strong> Temporary suspension (7–30 days)</li>
        <li><strong>Severe or repeated violations:</strong> Permanent removal, no refund of any fees paid</li>
      </ul>
      <p>
        EzTread reserves the right to bypass the warning/suspension process and immediately remove
        any listing for severe violations (fraud, illegal activity, credible threats).
      </p>

      <h2>3. Reporting Violations</h2>
      <p>
        To report a policy violation, email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a> with:
      </p>
      <ul>
        <li>The shop name or URL in question</li>
        <li>A description of the violation</li>
        <li>Any supporting evidence (screenshots, etc.)</li>
      </ul>
      <p>We aim to respond to all reports within 3 business days.</p>

      <h2>4. Contact</h2>
      <p>Questions? Email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a></p>
    </LegalLayout>
  );
}
