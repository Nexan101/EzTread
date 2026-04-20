import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "EzTread - Compare Tire Prices & Installation Costs in Houston",
  description:
    "Find the cheapest tires with installation. Compare total installed prices from local Houston tire shops. See tire price + labor + all fees before you buy.",
  keywords:
    "tire prices, cheap tires, tire installation Houston, compare tire prices, tire shops near me",
  openGraph: {
    title: "EzTread - Compare Tire Prices & Installation Costs in Houston",
    description:
      "Find the cheapest tires with installation. Compare total installed prices from local Houston tire shops.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
