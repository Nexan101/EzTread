import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "DMCA & Copyright Policy — EzTread",
  description: "EzTread's copyright policy and DMCA takedown procedures.",
};

export default function DmcaPage() {
  return (
    <LegalLayout title="DMCA & Copyright Policy" lastUpdated="April 26, 2025">
      <p>
        EzTread respects intellectual property rights and expects users to do the same. This policy
        outlines how we handle copyright matters under the Digital Millennium Copyright Act (DMCA).
      </p>

      <hr />

      <h2>1. Copyright Ownership</h2>
      <p>
        Shop owners retain full ownership of all content they submit to EzTread, including photos,
        descriptions, and branding materials. EzTread owns the platform design, code, and
        non-user-submitted content.
      </p>

      <h2>2. License Granted to EzTread</h2>
      <p>
        By uploading content to EzTread, you grant us a non-exclusive, worldwide, royalty-free license to:
      </p>
      <ul>
        <li>Display your content on EzTread.com and related services</li>
        <li>Resize, compress, or optimize images for platform performance</li>
        <li>Use your business name and logo in search results and marketing materials</li>
        <li>Cache and distribute content via CDN for performance</li>
      </ul>
      <p>This license ends when you remove your content or close your account.</p>

      <h2>3. Prohibited Uploads</h2>
      <p>You may not upload content that:</p>
      <ul>
        <li>Infringes on another party's copyright, trademark, or trade secret</li>
        <li>Uses stock photos or images without proper licensing</li>
        <li>Includes third-party logos without authorization</li>
        <li>Reproduces copyrighted text without permission</li>
      </ul>

      <h2>4. Reporting Copyright Infringement (DMCA Takedown)</h2>
      <p>
        If you believe your copyrighted work has been posted on EzTread without authorization, send
        a written notice to <a href="mailto:EzTread@eztread.net">EzTread@eztread.net</a> containing:
      </p>
      <ul>
        <li>Your name, address, phone number, and email</li>
        <li>Identification of the copyrighted work you claim has been infringed</li>
        <li>The URL or location of the allegedly infringing content on EzTread</li>
        <li>A statement that you have a good faith belief the use is not authorized</li>
        <li>A statement under penalty of perjury that the information is accurate and you are the copyright owner or authorized agent</li>
        <li>Your physical or electronic signature</li>
      </ul>
      <p>We will process valid DMCA notices within 5 business days.</p>

      <h2>5. Counter-Notice Procedure</h2>
      <p>
        If your content was removed and you believe it was a mistake, send a counter-notice to
        <a href="mailto:EzTread@eztread.net"> EzTread@eztread.net</a> containing:
      </p>
      <ul>
        <li>Your name, address, and phone number</li>
        <li>Identification of the removed content and its previous location</li>
        <li>A statement under penalty of perjury that the removal was a mistake or misidentification</li>
        <li>Your consent to the jurisdiction of Texas federal court</li>
        <li>Your physical or electronic signature</li>
      </ul>
      <p>
        If we receive a valid counter-notice, we may restore the content within 10–14 business days
        unless the original claimant files a court action.
      </p>

      <h2>6. Repeat Infringers</h2>
      <p>
        EzTread will terminate accounts of users who repeatedly infringe on intellectual property rights.
      </p>
    </LegalLayout>
  );
}
