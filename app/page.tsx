import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Pricing } from "@/components/sections/pricing";
import { WhyTaxKosh } from "@/components/sections/why-taxkosh";
import { Testimonials } from "@/components/sections/testimonials";
import { Footer } from "@/components/sections/footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Pricing />
        <WhyTaxKosh />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
