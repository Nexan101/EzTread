import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Disclaimer — EzTread",
  description: "Important disclaimers about EzTread's tire price comparison platform.",
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" lastUpdated="April 26, 2025">
      <p>
        Please read this disclaimer carefully before using EzTread. By accessing or using our platform,
        you acknowledge and accept the following limitations.
      </p>

      <hr />

      <h2>1. Independent Business Notice</h2>
      <p>
        All tire shops listed on EzTread are independent businesses. They are not employees,
        agents, partners, or affiliates of EzTread. EzTread does not control, direct, or supervise
        the operations, pricing, or conduct of any listed shop.
      </p>

      <h2>2. No Warranty on Information Accuracy</h2>
      <p>
        Pricing, availability, hours, and services listed on EzTread are provided by shop owners
        and may not always be current or accurate. EzTread:
      </p>
      <ul>
        <li>Does not verify all pricing in real time</li>
        <li>Cannot guarantee that listed prices match actual prices at the time of service</li>
        <li>Is not responsible for discrepancies between listed and actual prices</li>
        <li>Makes no warranties, express or implied, about the completeness or accuracy of listings</li>
      </ul>

      <h2>3. User Responsibility</h2>
      <p>Before engaging a tire shop, you are responsible for:</p>
      <ul>
        <li>Verifying current pricing directly with the shop</li>
        <li>Confirming the shop holds required business licenses and certifications</li>
        <li>Reading customer reviews and conducting your own due diligence</li>
        <li>Obtaining written quotes before authorizing any work</li>
      </ul>

      <h2>4. Limitation of Liability</h2>
      <p>EzTread shall not be liable for:</p>
      <ul>
        <li>Vehicle damage resulting from services performed by listed shops</li>
        <li>Personal injury or property damage arising from shop services</li>
        <li>Financial losses due to pricing discrepancies</li>
        <li>Disputes between customers and shops</li>
        <li>Any indirect, incidental, or consequential damages arising from use of this platform</li>
      </ul>
      <p>
        In no event shall EzTread's total liability exceed the amount you paid to EzTread (if any)
        in the 12 months preceding the claim.
      </p>

      <h2>5. Third-Party Links</h2>
      <p>
        EzTread may contain links to third-party websites. We are not responsible for the content,
        privacy practices, or accuracy of any third-party site. Links do not constitute endorsement.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions? Email <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a>
      </p>
    </LegalLayout>
  );
}
