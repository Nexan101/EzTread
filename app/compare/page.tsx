import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Compare Tire Prices | EzTread",
  description: "Compare tire prices + installation fees from local Houston shops. Find your true total installed cost before you buy.",
};

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f7] pt-14">
        <SearchWidget />
      </main>
      <Footer />
    </>
  );
}
