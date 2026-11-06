"use client";

import React, { useState, useEffect, useRef } from "react";
import { gebuk } from "@/lib/fonts";
import TextFrame from "@/components/ui/text-frame";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "What is NidhiSetu?",
    a: "NidhiSetu is a centralized portal that helps institutions and officials manage FDR records, verify documents, track maturity dates, monitor renewals and process release requests with less manual effort.",
  },
  {
    q: "Is my institution's data secure?",
    a: "Yes. Access is role-based, every action is written to an audit log, and every FDR is treated as untrusted until it is independently verified. AI flags the risks, while authorized officials make the final decision.",
  },
  {
    q: "How does NidhiSetu verify an FDR?",
    a: "Each document is read with OCR-based extraction, then a validation engine checks fields, amounts, dates and consistency. It is screened for tampering and copied bank seals, and can be confirmed through an independent, authorized bank verification channel.",
  },
  {
    q: "Can it detect duplicate or tampered documents?",
    a: "Yes. Duplicate detection identifies repeated FDR records and suspicious reuse, while OpenCV-based forensic screening looks for suspicious pixel edits and copied bank seals before a case reaches an official.",
  },
  {
    q: "Will we be alerted before an FDR matures?",
    a: "Yes. Automated maturity alerts notify users about upcoming maturities and renewals, so deadlines are not missed. Pending cases and release request status are visible in one place.",
  },
  {
    q: "Who makes the final decision on a case?",
    a: "Authorized officials always do. The AI only flags risks and discrepancies, human approval is required for every final decision, and each decision is recorded in the audit trail.",
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(1); // 02 open by default
  const secRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;

    if (!("IntersectionObserver" in window)) {
      sec.classList.add("in");
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      io.observe(sec);
      return () => io.disconnect();
    }
  }, []);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <>
      <style>{`
        .faq-sec {
          position: relative;
          width: 100%;
          padding: clamp(70px, 9vw, 120px) clamp(16px, 4vw, 40px);
          background: radial-gradient(60% 420px at 50% 0%, rgba(120, 110, 240, .08), rgba(120, 110, 240, 0) 72%),
                      radial-gradient(50% 360px at 50% 100%, rgba(120, 110, 240, .06), rgba(120, 110, 240, 0) 72%),
                      #ffffff;
          box-sizing: border-box;
          z-index: 10;
        }

        .faq-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .faq-i {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: none;
        }

        /* 2-column Grid */
        .faq-grid {
          display: grid;
          grid-template-columns: minmax(260px, .8fr) 1.45fr;
          grid-template-areas: "head list" "support list";
          grid-template-rows: auto 1fr;
          gap: clamp(28px, 4vw, 48px) clamp(28px, 6vw, 84px);
        }

        .faq-fhead {
          grid-area: head;
        }

        .faq-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 16px 0 12px;
          border-radius: 999px;
          border: 1px solid #E6E4F3;
          background: #ffffff;
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 12.5px;
          font-weight: 600;
          color: #0A0A18;
          box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
        }

        .faq-pill .faq-i { width: 14px; height: 14px; stroke-width: 2; color: #5B52D6; }

        .faq-fhead h2 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 700;
          letter-spacing: -.035em;
          line-height: 1.1;
          color: #0A0A18;
          margin: 20px 0 16px;
          max-width: 8em;
        }

        .faq-fhead .lead {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(14.5px, 1.5vw, 16.5px);
          line-height: 1.6;
          color: #6E6C85;
          max-width: 32ch;
          margin: 0;
        }

        /* Questions List */
        .faq-list {
          grid-area: list;
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1vw, 12px);
        }

        .faq-q {
          background: #F5F4FB;
          border-radius: 22px;
          border: 1px solid transparent;
          transition: background .45s, box-shadow .45s, border-color .45s, transform .45s cubic-bezier(.2, .8, .2, 1);
        }

        .faq-q:hover {
          transform: translateX(4px);
        }

        .faq-q.open {
          background: #ffffff;
          border-color: #E6E4F3;
          box-shadow: 0 24px 50px -32px rgba(50, 40, 150, .45);
          transform: none;
        }

        .faq-qb {
          width: 100%;
          display: grid;
          grid-template-columns: 44px 1fr 34px;
          align-items: center;
          gap: 6px;
          text-align: left;
          padding: clamp(16px, 1.8vw, 22px) clamp(16px, 1.8vw, 22px) clamp(16px, 1.8vw, 22px) clamp(16px, 1.8vw, 24px);
          border-radius: 22px;
          background: none;
          border: 0;
          cursor: pointer;
          font: inherit;
          color: inherit;
        }

        .faq-qb:focus-visible {
          outline: 2px solid #5B52D6;
          outline-offset: 2px;
        }

        .faq-n {
          font-size: 12.5px;
          color: #9C9AB4;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: .02em;
        }

        .faq-qt {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(15px, 1.45vw, 17.5px);
          font-weight: 600;
          letter-spacing: -.015em;
          line-height: 1.35;
          color: #0A0A18;
        }

        .faq-pm {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .07);
          transition: background .4s, box-shadow .4s, transform .5s cubic-bezier(.2, .8, .2, 1);
        }

        .faq-pm::before,
        .faq-pm::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 12px;
          height: 1.8px;
          margin: -.9px 0 0 -6px;
          border-radius: 2px;
          background: #0A0A18;
          transition: transform .5s cubic-bezier(.2, .8, .2, 1), background .4s;
        }

        .faq-pm::after {
          transform: rotate(90deg);
        }

        .faq-q:hover .faq-pm {
          box-shadow: 0 0 0 1px rgba(91, 82, 214, .4);
        }

        .faq-q.open .faq-pm {
          background: #5B52D6;
          box-shadow: none;
          transform: rotate(180deg);
        }

        .faq-q.open .faq-pm::before,
        .faq-q.open .faq-pm::after {
          background: #ffffff;
        }

        .faq-q.open .faq-pm::after {
          transform: rotate(0);
        }

        /* Accordion Body */
        .faq-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows .55s cubic-bezier(.2, .8, .2, 1);
        }

        .faq-q.open .faq-a {
          grid-template-rows: 1fr;
        }

        .faq-a > div {
          overflow: hidden;
        }

        .faq-a p {
          margin: 0 clamp(50px, 6vw, 72px) 0 clamp(60px, 6vw, 74px);
          padding-bottom: clamp(18px, 2vw, 24px);
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 14px;
          line-height: 1.7;
          color: #6E6C85;
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity .4s ease, transform .5s cubic-bezier(.2, .8, .2, 1);
        }

        .faq-q.open .faq-a p {
          opacity: 1;
          transform: none;
          transition-delay: .12s;
        }

        /* Support Sidebar Card */
        .faq-support {
          grid-area: support;
          align-self: end;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          border-radius: clamp(22px, 2.6vw, 30px);
          padding: clamp(22px, 2.4vw, 30px);
          color: #ffffff;
          background: linear-gradient(185deg, #0A0A1E 0%, #1B1962 34%, #3B3593 70%, #6C66C8 100%);
        }

        .faq-support::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(70% 40% at 50% 90%, rgba(190, 186, 255, .45), transparent 70%),
                      radial-gradient(60% 36% at 80% 10%, rgba(139, 132, 255, .35), transparent 72%);
        }

        .faq-support .ico {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .12);
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, .22) inset;
          display: grid;
          place-items: center;
        }

        .faq-support .ico .faq-i { width: 20px; height: 20px; }

        .faq-support h3 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(20px, 2vw, 24px);
          font-weight: 700;
          letter-spacing: -.03em;
          margin: 16px 0 8px;
          color: #ffffff;
        }

        .faq-support p {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, .74);
          max-width: 32ch;
          margin: 0;
        }

        .faq-btn-light {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          height: 46px;
          padding: 5px 6px 5px 20px;
          margin-top: 22px;
          border-radius: 999px;
          background: #ffffff;
          color: #0A0A18;
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 6px 20px -6px rgba(0, 0, 0, 0.25);
          transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
          width: fit-content;
        }

        .faq-btn-light:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -10px rgba(0, 0, 0, .45);
        }

        .faq-btn-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #0A0A18;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .25s ease, transform .25s ease;
        }

        .faq-btn-light:hover .faq-btn-circle {
          background: #5B52D6;
          transform: scale(1.05);
        }

        .faq-btn-arrow {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform .3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-btn-light:hover .faq-btn-arrow {
          transform: translate(2px, -2px);
        }

        /* Entrance Animations */
        .faq-rv {
          opacity: 0;
          transform: translateY(34px) scale(.98);
        }

        .in .faq-rv {
          animation: faqUp .95s cubic-bezier(.2, .8, .2, 1) forwards;
          animation-delay: calc(.08s + var(--d, 0) * .12s);
        }

        @keyframes faqUp { to { opacity: 1; transform: none; } }

        @media (max-width: 900px) {
          .faq-grid {
            grid-template-columns: 1fr;
            grid-template-areas: "head" "list" "support";
            grid-template-rows: none;
          }
          .faq-fhead h2 { max-width: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-rv {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Embedded SVG Icons Sprite */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="faq-help" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.500 9.200a2.500 2.500 0 1 1 3.600 2.200c-.7.4-1.100 1-1.100 1.800M12 17h.01" />
        </symbol>
        <symbol id="faq-chat" viewBox="0 0 24 24">
          <path d="M21 12a8 8 0 0 1-11.500 7.200L4 20l1-4.600A8 8 0 1 1 21 12z" />
          <path d="M9 12h.01M12 12h.01M15 12h.01" />
        </symbol>
        <symbol id="faq-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
      </svg>

      <section ref={secRef} className="faq-sec" id="faq" suppressHydrationWarning>
        <div className="faq-wrap" suppressHydrationWarning>
          <div className="faq-grid" suppressHydrationWarning>
            {/* Header */}
            <div className="faq-fhead" suppressHydrationWarning>
              <span className="faq-pill faq-rv" style={{ "--d": 0 } as React.CSSProperties} suppressHydrationWarning>
                <svg className="faq-i"><use href="#faq-help" /></svg>
                FAQ
              </span>
              <h2 className="faq-rv" style={{ "--d": 1 } as React.CSSProperties} suppressHydrationWarning>
                Frequently Asked <TextFrame theme="light" lineStyle="solid">Questions</TextFrame>
              </h2>
              <p className="lead faq-rv" style={{ "--d": 2 } as React.CSSProperties} suppressHydrationWarning>
                Everything you need to know about NidhiSetu, explained clearly and simply.
              </p>
            </div>

            {/* Accordion Questions List */}
            <div className="faq-list" suppressHydrationWarning>
              {FAQS.map((faq, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`faq-q faq-rv ${isOpen ? "open" : ""}`}
                    style={{ "--d": idx + 1 } as React.CSSProperties}
                    suppressHydrationWarning
                  >
                    <button
                      className="faq-qb"
                      onClick={() => toggle(idx)}
                      aria-expanded={isOpen}
                      id={`q${idx}`}
                      suppressHydrationWarning
                    >
                      <span className="faq-n" suppressHydrationWarning>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="faq-qt" suppressHydrationWarning>
                        {faq.q}
                      </span>
                      <span className="faq-pm" aria-hidden="true" suppressHydrationWarning />
                    </button>
                    <div className="faq-a" role="region" aria-labelledby={`q${idx}`} suppressHydrationWarning>
                      <div suppressHydrationWarning>
                        <p suppressHydrationWarning>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Support Sidebar Card */}
            <aside className="faq-support faq-rv" style={{ "--d": 4 } as React.CSSProperties} suppressHydrationWarning>
              <div className="ico" suppressHydrationWarning>
                <svg className="faq-i"><use href="#faq-chat" /></svg>
              </div>
              <h3 suppressHydrationWarning>Still Have Questions?</h3>
              <p suppressHydrationWarning>
                Our team is here to help with anything you need to know about NidhiSetu.
              </p>
              <a className="faq-btn-light" href="#contact" suppressHydrationWarning>
                <span>Contact Support</span>
                <span className="faq-btn-circle" aria-hidden="true" suppressHydrationWarning>
                  <svg className="faq-btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </a>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

