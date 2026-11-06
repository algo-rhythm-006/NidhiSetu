"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_MANIFESTO =
  "NidhiSetu is an institutional regulatory intelligence platform built for university governance and AICTE compliance. It brings autonomous forensic verification into institutional Fixed Deposit Receipts — ensuring absolute cryptographic authenticity, real-time liquidity oversight, and zero documentation fraud. Governed under regulatory protocol, every endowment and reserve deposit remains verifiable, legally certified, and fully accounted for. NidhiSetu turns regulatory compliance from a periodic audit into continuous institutional trust.";

interface SlowManifestoRevealProps {
  children?: string;
  className?: string;
}

export default function SlowManifestoReveal({
  children = DEFAULT_MANIFESTO,
  className = "",
}: SlowManifestoRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  const words = useMemo(() => {
    return children.split(/(\s+)/).map((word, i) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span key={i} className="manifesto-word">
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const handleRefresh = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("ns-loader-exit", handleRefresh);
    window.addEventListener("load", handleRefresh);
    const timer = setTimeout(handleRefresh, 1000);

    return () => {
      window.removeEventListener("ns-loader-exit", handleRefresh);
      window.removeEventListener("load", handleRefresh);
      clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const wordElements = textRef.current?.querySelectorAll(".manifesto-word");
      if (!wordElements || wordElements.length === 0 || !sectionRef.current) return;

      // Animate from first word to last word across the entire scroll track
      const tween = gsap.to(wordElements, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <>
      <style>{`
        /* Native Sticky Track: 250vh provides ~150vh of smooth sticky scrolling */
        .manifesto-track {
          position: relative;
          width: 100%;
          height: 250vh !important;
          min-height: 250vh !important;
          background: #ffffff;
          z-index: 15;
          display: block;
        }

        /* Sticky container locks into view when track hits top: 0, and naturally unlocks at bottom */
        .manifesto-sticky {
          position: sticky !important;
          top: 0 !important;
          left: 0;
          width: 100%;
          height: 100vh !important;
          min-height: 100vh !important;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 clamp(20px, 4vw, 60px);
          box-sizing: border-box;
          overflow: hidden;
          pointer-events: none;
        }

        .manifesto-text {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif !important;
          /* Balanced size: fits comfortably inside the viewport in 5-6 lines */
          font-size: clamp(18px, 2.2vw, 32px) !important;
          line-height: 1.55 !important;
          font-weight: 500 !important;
          letter-spacing: -0.018em !important;
          text-align: center;
          max-width: 1060px;
          width: 100%;
          color: #0A0A0B;
          margin: 0 auto;
          user-select: none;
          pointer-events: auto;
        }

        .manifesto-word {
          display: inline-block;
          opacity: 0.18;
          filter: blur(2px);
          transform: translateY(6px);
          color: #0A0A0B;
          will-change: transform, opacity, filter;
        }

        @media (max-width: 768px) {
          .manifesto-track {
            height: 220vh !important;
            min-height: 220vh !important;
          }
          .manifesto-text {
            font-size: clamp(16px, 4.4vw, 24px) !important;
            line-height: 1.48 !important;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className={`manifesto-track ${className}`}
        suppressHydrationWarning
      >
        <div className="manifesto-sticky" suppressHydrationWarning>
          <p ref={textRef} className="manifesto-text" suppressHydrationWarning>
            {words}
          </p>
        </div>
      </section>
    </>
  );
}
