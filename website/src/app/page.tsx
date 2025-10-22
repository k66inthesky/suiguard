import CTA from "@/components/CTA";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
// import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <Features />
      {/* <Pricing /> */}
      {/* <Testimonials /> */}
      {/* <FAQ /> */}
      <CTA />
      <Footer />
    </div>
  );
}
