import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturesGrid from "@/components/FeaturesGrid";
import DetailSections from "@/components/DetailSections";
import ProtocolsSection from "@/components/ProtocolsSection";
import ApiTestingSection from "@/components/ApiTestingSection";
import MoreFeatures from "@/components/MoreFeatures";
import DownloadCTA from "@/components/DownloadCTA";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal"; // Import the wrapper
import BioSection from "@/components/BioSection";

export const metadata: Metadata = {
  title: "Kairo — Native API Client for macOS, Windows & Linux",
  description:
    "Kairo is a blazing-fast native API client built with Rust. Scriptable requests, cloud sync, WebSocket/SSE/GraphQL/gRPC support, and built-in load testing — privacy-first and zero lock-in.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kairo",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Windows, Linux",
  description:
    "A blazing-fast native API client built with Rust. HTTP, WebSocket, SSE, GraphQL, gRPC — with scriptable requests, cloud sync, and zero lock-in.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  softwareVersion: "1.1.3 Alpha",
  url: "https://www.kairoapp.dev",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex flex-col gap-24 py-12"> 
        {/* Hero usually loads instantly without scroll triggers, but you can animate it if desired */}
        <Hero />
        
        <ScrollReveal>
          <FeaturesGrid />
        </ScrollReveal>
        
        <ScrollReveal>
          <DetailSections />
        </ScrollReveal>
        
        <ScrollReveal>
          <ProtocolsSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <ApiTestingSection />
        </ScrollReveal>
        
        <ScrollReveal>
          <MoreFeatures />
        </ScrollReveal>
        
        {/* <ScrollReveal>
          <DownloadCTA />
        </ScrollReveal> */}

        {/* Rendered beautifully inside the main structural layout container right before the footer triggers */}
        
        <div id="get-kairo" className="scroll-mt-24 flex flex-col gap-16">
          <ScrollReveal>
            <div className="mx-auto max-w-5xl px-6 w-full">
              <BioSection imageSrc="/bio.png" maskSrc="mask.avif"/>
            </div>
          </ScrollReveal>
          
          <ScrollReveal>
            <DownloadCTA />
          </ScrollReveal>
        </div>

      </main>
      <Footer />
    </div>
  );
}