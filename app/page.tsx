import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EzTread — Compare Tire Prices & Find Local Shops",
  description: "Find the best tire prices at Walmart, Costco, Discount Tire, and Sam's Club. Then get installation quotes from trusted local tire shops near you.",
  openGraph: {
    title: "EzTread — Compare Tire Prices & Find Local Shops",
    description: "Find the best tire prices and installation costs in one place.",
    url: "https://eztread.com",
    siteName: "EzTread",
    locale: "en_US",
    type: "website",
  },
};
import HeroSection from "@/components/HeroSection";
import ValueProps from "@/components/ValueProps";
import HowItWorks from "@/components/HowItWorks";
import PriceComparison from "@/components/PriceComparison";
import ShopCTA from "@/components/ShopCTA";
import SocialProof from "@/components/SocialProof";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";

export default function Home() {
  return (
    <>
      <Navbar />
      <PageTracker />

      <main>
        {/* 1. Hero — above-the-fold hook with headline + CTA */}
        <HeroSection />

        {/* 3. How It Works — 3-step process to reduce friction */}
        <HowItWorks />

        {/* 4. Price Comparison Table — concrete savings proof */}
        <PriceComparison />

        {/* 5. Social Proof — stats, logos, testimonials */}
        <SocialProof />

        {/* 6. Shop Owner CTA — B2B conversion section */}
        <ShopCTA />

      </main>

      <Footer />
    </>
  );
}
