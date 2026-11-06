"use client";

import { Loader, Hero, FirstBento, SecondBento, Faq, Footer } from "@/components/landing";
import SlowManifestoReveal from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-white text-[#0A0A0B]" suppressHydrationWarning>
      {/* 1. Animated splash loader (client-only splash animation) */}
      <Loader />

      {/* 2. Hero section with WebGL atmosphere + product showcase */}
      <Hero />

      {/* 3. Slow Manifesto Reveal section (bg-white, text-black) */}
      <SlowManifestoReveal>
        NidhiSetu is an institutional regulatory intelligence platform built for university governance and AICTE compliance. It brings autonomous forensic verification into institutional Fixed Deposit Receipts — ensuring absolute cryptographic authenticity, real-time liquidity oversight, and zero documentation fraud. Governed under regulatory protocol, every endowment and reserve deposit remains verifiable, legally certified, and fully accounted for. NidhiSetu turns regulatory compliance from a periodic audit into continuous institutional trust.
      </SlowManifestoReveal>

      {/* 4. First Bento: Why Choose Us & Smarter FDR Management */}
      <FirstBento />

      {/* 5. Second Bento: Features, Registry, Forensic & Lifecycle Management */}
      <SecondBento />

      {/* 6. FAQ Section */}
      <Faq />

      {/* 7. Atmospheric closing footer */}
      <Footer />
    </div>
  );
}
