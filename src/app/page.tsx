import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Listings from "@/components/Listings";
import Ecosystem from "@/components/Ecosystem";
import ProductWorkingDemo from "@/components/ProductWorkingDemo";
import TopRenters from "@/components/TopRenters";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Listings />
      <Ecosystem />
      <ProductWorkingDemo />
      <TopRenters />
      <Footer />
    </main>
  );
}
