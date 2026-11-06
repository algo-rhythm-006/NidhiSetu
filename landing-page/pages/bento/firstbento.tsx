"use client";

import React, { useEffect, useRef } from "react";
import { gebuk } from "@/lib/fonts";
import TextFrame from "@/components/ui/text-frame";

export default function FirstBento() {
  const secRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;

    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN").format(Math.round(n));

    const runCounts = (root: HTMLElement) => {
      const counters = root.querySelectorAll<HTMLElement>("[data-count]");
      counters.forEach((el) => {
        const to = parseFloat(el.getAttribute("data-count") || "0");
        const pre = el.getAttribute("data-pre") || "";
        const suf = el.getAttribute("data-suf") || "";
        const dur = 1700;
        const delay = parseFloat(el.getAttribute("data-delay") || "0");
        let t0: number | null = null;

        if (reduce) {
          el.textContent = pre + fmt(to) + suf;
          return;
        }

        const step = (t: number) => {
          if (t0 === null) t0 = t + delay;
          const k = Math.min(1, Math.max(0, (t - t0) / dur));
          const e = 1 - Math.pow(1 - k, 3);
          el.textContent = pre + fmt(to * e) + suf;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    if (!("IntersectionObserver" in window)) {
      sec.classList.add("in");
      runCounts(sec);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              runCounts(e.target as HTMLElement);
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

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <>
      <style>{`
        .fb-sec {
          position: relative;
          width: 100%;
          padding: clamp(70px, 9vw, 120px) clamp(16px, 4vw, 40px);
          background: radial-gradient(60% 420px at 50% 0%, rgba(120, 110, 240, .09), rgba(120, 110, 240, 0) 72%),
                      radial-gradient(50% 360px at 50% 100%, rgba(120, 110, 240, .07), rgba(120, 110, 240, 0) 72%),
                      #ffffff;
          box-sizing: border-box;
          z-index: 10;
        }

        .fb-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .fb-i {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: none;
        }

        /* Tech logos bar */
        .fb-trust {
          text-align: center;
          margin-bottom: clamp(40px, 6vw, 72px);
        }

        .fb-cap {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          color: #6E6C85;
          margin-bottom: 18px;
        }

        .fb-cap b {
          color: #5B52D6;
          font-weight: 600;
        }

        .fb-tiles {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: clamp(8px, 1.2vw, 14px);
        }

        .fb-lg {
          height: clamp(54px, 5.8vw, 72px);
          border-radius: 18px;
          background: #F5F4FB;
          display: grid;
          place-items: center;
          color: #8F8DAA;
          font-size: clamp(14px, 1.4vw, 17px);
          white-space: nowrap;
          border: 1px solid rgba(15, 20, 40, .03);
          transition: color .3s, background .3s, transform .4s;
        }

        .fb-lg:hover {
          color: #0A0A18;
          background: #ECEAF7;
          transform: translateY(-3px);
        }

        .fb-lg.m1 { font-weight: 800; letter-spacing: -.04em; }
        .fb-lg.m2 { font-weight: 700; letter-spacing: -.03em; }
        .fb-lg.m3 { font-weight: 600; }
        .fb-lg.m4 { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-weight: 600; }
        .fb-lg.m5 { font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 600; letter-spacing: -.04em; }
        .fb-lg.m6 { font-weight: 300; letter-spacing: .16em; text-transform: uppercase; font-size: clamp(11px, 1.2vw, 13.5px); }

        /* Headings */
        .fb-head {
          text-align: center;
          max-width: 780px;
          margin: 0 auto clamp(36px, 5vw, 60px);
        }

        .fb-pill {
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

        .fb-pill .fb-i { width: 14px; height: 14px; stroke-width: 2; color: #5B52D6; }

        .fb-head h2 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 700;
          letter-spacing: -.035em;
          line-height: 1.1;
          color: #0A0A18;
          margin: 18px 0 14px;
        }

        .fb-lead {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(14.5px, 1.5vw, 16.5px);
          line-height: 1.6;
          color: #6E6C85;
          margin: 0 auto;
        }

        /* 3-column Cards Grid */
        .fb-grid3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: clamp(14px, 1.8vw, 22px);
        }

        .fb-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          border-radius: clamp(22px, 2.6vw, 32px);
          background: #F5F4FB;
          padding: clamp(20px, 2.2vw, 28px);
          border: 1px solid rgba(15, 20, 40, .04);
          display: flex;
          flex-direction: column;
          min-height: clamp(480px, 46vw, 560px);
          transition: transform .6s cubic-bezier(.2, .8, .2, 1), box-shadow .6s cubic-bezier(.2, .8, .2, 1);
        }

        .fb-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0;
          transition: opacity .4s;
          background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, .95), rgba(255, 255, 255, 0) 65%);
        }

        .fb-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 60px -34px rgba(30, 40, 100, .35);
        }

        .fb-card:hover::before { opacity: 1; }

        .fb-ico {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #ffffff;
          display: grid;
          place-items: center;
          color: #5B52D6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, .05), 0 0 0 1px rgba(15, 20, 40, .04);
        }

        .fb-ico .fb-i { width: 20px; height: 20px; }

        .fb-card h3 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(19px, 1.8vw, 23px);
          font-weight: 700;
          letter-spacing: -.025em;
          margin: 16px 0 8px;
          color: #0A0A18;
        }

        .fb-card .fb-d {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          line-height: 1.55;
          color: #6E6C85;
          max-width: 38ch;
        }

        .fb-panel {
          margin-top: auto;
          background: #ffffff;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 0 0 1px rgba(15, 20, 40, .04);
        }

        /* Card 1 Specifics */
        .fb-okc {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #1FA971;
          display: grid;
          place-items: center;
          margin: 2px 0 12px;
        }

        .fb-okc svg {
          width: 24px;
          height: 24px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 2.6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .fb-okc path {
          stroke-dasharray: 26;
          stroke-dashoffset: 26;
        }

        .in .fb-okc { animation: fbPop .6s cubic-bezier(.2, .9, .3, 1.3) .7s both; }
        .in .fb-okc path { animation: fbDraw .5s ease 1.1s forwards; }

        .fb-panel h4 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -.01em;
          color: #0A0A18;
        }

        .fb-panel .sm {
          font-size: 11.5px;
          color: #6E6C85;
          margin-top: 3px;
        }

        .fb-sum {
          margin-top: 16px;
          background: #F3F2FA;
          border-radius: 16px;
          padding: 14px;
        }

        .fb-sum .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          padding: 6px 0;
          color: #6E6C85;
          opacity: 0;
        }

        .fb-sum .row b {
          color: #0A0A18;
          font-weight: 600;
          font-size: 12.5px;
          font-variant-numeric: tabular-nums;
        }

        .in .fb-sum .row {
          animation: fbFadeUp .5s ease forwards;
          animation-delay: calc(1.3s + var(--r, 0) * .18s);
        }

        .fb-dl {
          margin-top: 10px;
          width: 100%;
          height: 40px;
          border-radius: 12px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #0A0A18;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .06);
          border: 0;
          cursor: pointer;
          transition: background .25s, color .25s, transform .25s;
        }

        .fb-dl:hover {
          background: #0B0B1E;
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* Card 2: Blue Audit Card */
        .fb-card.blue {
          background: linear-gradient(185deg, #0A0A1E 0%, #1B1962 30%, #3B3593 62%, #6C66C8 100%);
          color: #ffffff;
          border: 0;
        }

        .fb-card.blue::before {
          background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(190, 186, 255, .22), rgba(190, 186, 255, 0) 65%) !important;
        }

        .fb-card.blue .fb-ico {
          background: rgba(255, 255, 255, .12);
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, .22) inset;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .fb-card.blue h3 { color: #ffffff !important; }
        .fb-card.blue .fb-d { color: rgba(255, 255, 255, .74) !important; }

        .fb-clouds {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(70% 34% at 50% 58%, rgba(139, 132, 255, .42), transparent 72%),
                      radial-gradient(60% 22% at 18% 102%, rgba(200, 196, 255, .40), transparent 70%),
                      radial-gradient(50% 20% at 88% 104%, rgba(200, 196, 255, .40), transparent 70%);
        }

        .fb-chain {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 9px;
          position: relative;
        }

        .fb-step {
          display: flex;
          align-items: center;
          gap: 11px;
          height: 46px;
          padding: 0 14px;
          border-radius: 15px;
          font-size: 13px;
          font-weight: 500;
          background: rgba(255, 255, 255, .10);
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, .18) inset;
          opacity: 0;
          transform: translateX(-14px);
        }

        .fb-step .tk {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .22);
          display: grid;
          place-items: center;
          flex: none;
          transition: background .4s, color .4s;
        }

        .fb-step .tk svg {
          width: 12px;
          height: 12px;
          fill: none;
          stroke: #ffffff;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .in .fb-step {
          animation: fbStepIn .7s cubic-bezier(.2, .8, .2, 1) forwards, fbLit 7s ease-in-out infinite;
          animation-delay: calc(.9s + var(--k) * .16s), calc(2.2s + var(--k) * .9s);
        }

        .in .fb-step .tk {
          animation: fbLitTk 7s ease-in-out infinite;
          animation-delay: calc(2.2s + var(--k) * .9s);
        }

        /* Card 3: Discrepancy */
        .fb-cmp {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 14px;
        }

        .fb-pr {
          display: flex;
          align-items: center;
          gap: 11px;
          height: 54px;
          padding: 0 13px;
          border-radius: 16px;
          background: #F3F2FA;
        }

        .fb-pr .ti {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ffffff;
          display: grid;
          place-items: center;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .06);
          color: #5B52D6;
          flex: none;
        }

        .fb-pr .ti .fb-i { width: 15px; height: 15px; }

        .fb-pr small {
          display: block;
          font-size: 10.5px;
          color: #6E6C85;
        }

        .fb-pr b {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -.01em;
          font-variant-numeric: tabular-nums;
          color: #0A0A18;
        }

        .fb-fee {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 14px 2px 12px;
          font-size: 12px;
          color: #6E6C85;
        }

        .fb-fee .bad {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
          color: #E04B4B;
          background: #FDEBEB;
          padding: 5px 11px;
          border-radius: 999px;
        }

        .fb-fee .bad i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #E04B4B;
          animation: fbPulse 2s ease-out infinite;
        }

        .fb-btn-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          width: 100%;
          padding: 0 20px;
          border-radius: 999px;
          background: #0B0B1E;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          border: 0;
          cursor: pointer;
          transition: transform .25s, box-shadow .25s;
        }

        .fb-btn-dark:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, .45);
        }

        .in .fb-cmp .fb-pr {
          animation: fbFadeUp .6s ease both;
          animation-delay: calc(.9s + var(--r, 0) * .2s);
        }

        .in .fb-fee, .in .fb-btn-dark {
          animation: fbFadeUp .6s ease both;
          animation-delay: 1.7s;
        }

        /* Animations */
        .fb-rv {
          opacity: 0;
          transform: translateY(34px) scale(.98);
        }

        .in .fb-rv {
          animation: fbUp .95s cubic-bezier(.2, .8, .2, 1) forwards;
          animation-delay: calc(.08s + var(--d, 0) * .12s);
        }

        @keyframes fbUp { to { opacity: 1; transform: none; } }
        @keyframes fbPop { 0% { transform: scale(.5); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fbDraw { to { stroke-dashoffset: 0; } }
        @keyframes fbFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes fbPulse { 0% { box-shadow: 0 0 0 0 rgba(224, 75, 75, .45); } 70% { box-shadow: 0 0 0 10px rgba(224, 75, 75, 0); } 100% { box-shadow: 0 0 0 0 rgba(224, 75, 75, 0); } }
        @keyframes fbStepIn { to { opacity: 1; transform: none; } }
        @keyframes fbLit { 0%, 22%, 100% { background: rgba(255, 255, 255, .10); color: #fff; } 6%, 16% { background: #fff; color: #25224F; } }
        @keyframes fbLitTk { 0%, 22%, 100% { background: rgba(255, 255, 255, .28); } 6%, 16% { background: #5B52D6; } }

        @media (max-width: 980px) {
          .fb-grid3 { grid-template-columns: 1fr; }
          .fb-card { min-height: 0; }
          .fb-panel, .fb-chain { margin-top: 26px; }
          .fb-tiles { grid-template-columns: repeat(3, 1fr); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fb-rv, .fb-step, .in .fb-sum .row, .in .fb-cmp .fb-pr, .in .fb-fee, .in .fb-btn-dark {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Embedded SVG Icons Sprite */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="fb-star" viewBox="0 0 24 24">
          <path d="M12 3v18M4.200 7.500l15.600 9M4.200 16.500l15.600-9" />
        </symbol>
        <symbol id="fb-scan" viewBox="0 0 24 24">
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
        </symbol>
        <symbol id="fb-download" viewBox="0 0 24 24">
          <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
        </symbol>
        <symbol id="fb-shield" viewBox="0 0 24 24">
          <path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z" />
          <path d="m8.500 12 2.500 2.500 4.500-4.500" />
        </symbol>
        <symbol id="fb-flag" viewBox="0 0 24 24">
          <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
        </symbol>
        <symbol id="fb-doc" viewBox="0 0 24 24">
          <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />
        </symbol>
        <symbol id="fb-bank" viewBox="0 0 24 24">
          <path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />
        </symbol>
      </svg>

      <section ref={secRef} className="fb-sec" id="verification" suppressHydrationWarning>
        <div className="fb-wrap" suppressHydrationWarning>
          {/* Trust Tech Logos */}
          <div className="fb-trust" suppressHydrationWarning>
            <p className="fb-cap fb-rv" style={{ "--d": 0 } as React.CSSProperties} suppressHydrationWarning>
              <b>Built with</b> trusted, open technology at every layer of the platform
            </p>
            <div className="fb-tiles" suppressHydrationWarning>
              <div className="fb-lg m1 fb-rv" style={{ "--d": 1 } as React.CSSProperties} suppressHydrationWarning>React</div>
              <div className="fb-lg m2 fb-rv" style={{ "--d": 2 } as React.CSSProperties} suppressHydrationWarning>TypeScript</div>
              <div className="fb-lg m3 fb-rv" style={{ "--d": 3 } as React.CSSProperties} suppressHydrationWarning>Spring Boot</div>
              <div className="fb-lg m4 fb-rv" style={{ "--d": 4 } as React.CSSProperties} suppressHydrationWarning>PostgreSQL</div>
              <div className="fb-lg m5 fb-rv" style={{ "--d": 5 } as React.CSSProperties} suppressHydrationWarning>FastAPI</div>
              <div className="fb-lg m6 fb-rv" style={{ "--d": 6 } as React.CSSProperties} suppressHydrationWarning>OpenCV</div>
            </div>
          </div>

          {/* Heading Block */}
          <div className="fb-head" suppressHydrationWarning>
            <span className="fb-pill fb-rv" style={{ "--d": 1 } as React.CSSProperties} suppressHydrationWarning>
              <svg className="fb-i">
                <use href="#fb-star" />
              </svg>
              Why Choose Us
            </span>
            <h2 className="fb-rv" style={{ "--d": 2 } as React.CSSProperties} suppressHydrationWarning>
              Everything for <TextFrame theme="light" lineStyle="solid">Smarter</TextFrame> FDR Management
            </h2>
            <p className="fb-lead fb-rv" style={{ "--d": 3 } as React.CSSProperties} suppressHydrationWarning>
              Manage FDR records with speed, security and confidence. From manual tracking to streamlined verification.
            </p>
          </div>

          {/* 3 Bento Cards */}
          <div className="fb-grid3" suppressHydrationWarning>
            {/* Card 1: OCR Extraction */}
            <article
              className="fb-card fb-rv"
              style={{ "--d": 3 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="fb-ico" suppressHydrationWarning>
                <svg className="fb-i">
                  <use href="#fb-scan" />
                </svg>
              </div>
              <h3 suppressHydrationWarning>OCR-Based Extraction</h3>
              <p className="fb-d" suppressHydrationWarning>
                Upload an FDR and every field is captured automatically, in seconds, with no manual typing.
              </p>
              <div className="fb-panel" suppressHydrationWarning>
                <div className="fb-okc" suppressHydrationWarning>
                  <svg viewBox="0 0 24 24">
                    <path d="m5.500 12.500 4.500 4.500 8.500-9.500" />
                  </svg>
                </div>
                <h4 suppressHydrationWarning>Extraction Complete</h4>
                <p className="sm" suppressHydrationWarning>FDR details have been captured successfully</p>
                <div className="fb-sum" suppressHydrationWarning>
                  <div className="row" style={{ "--r": 0 } as React.CSSProperties} suppressHydrationWarning>
                    <span>FDR No.</span>
                    <b>FD-48213</b>
                  </div>
                  <div className="row" style={{ "--r": 1 } as React.CSSProperties} suppressHydrationWarning>
                    <span>Maturity</span>
                    <b>25 DEC 2026</b>
                  </div>
                  <div className="row" style={{ "--r": 2 } as React.CSSProperties} suppressHydrationWarning>
                    <span>Amount</span>
                    <b>₹20,00,000</b>
                  </div>
                  <button className="fb-dl" suppressHydrationWarning>
                    <svg className="fb-i">
                      <use href="#fb-download" />
                    </svg>
                    Download report
                  </button>
                </div>
              </div>
            </article>

            {/* Card 2: Audit-Ready by Design (Luminous Blue/Purple) */}
            <article
              className="fb-card blue fb-rv"
              style={{ "--d": 4 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="fb-clouds" suppressHydrationWarning />
              <div className="fb-ico" suppressHydrationWarning>
                <svg className="fb-i">
                  <use href="#fb-shield" />
                </svg>
              </div>
              <h3 suppressHydrationWarning>Audit-Ready by Design</h3>
              <p className="fb-d" suppressHydrationWarning>
                Role-based access, human approval and a complete audit trail on every single decision.
              </p>
              <div className="fb-chain" suppressHydrationWarning>
                <div className="fb-step" style={{ "--k": 0 } as React.CSSProperties} suppressHydrationWarning>
                  <span className="tk"><svg viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7" /></svg></span>
                  OCR Data Extraction
                </div>
                <div className="fb-step" style={{ "--k": 1 } as React.CSSProperties} suppressHydrationWarning>
                  <span className="tk"><svg viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7" /></svg></span>
                  Rule-Based Validation
                </div>
                <div className="fb-step" style={{ "--k": 2 } as React.CSSProperties} suppressHydrationWarning>
                  <span className="tk"><svg viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7" /></svg></span>
                  Priority-Based Tracking
                </div>
                <div className="fb-step" style={{ "--k": 3 } as React.CSSProperties} suppressHydrationWarning>
                  <span className="tk"><svg viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7" /></svg></span>
                  Official Approval
                </div>
                <div className="fb-step" style={{ "--k": 4 } as React.CSSProperties} suppressHydrationWarning>
                  <span className="tk"><svg viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7" /></svg></span>
                  Audit Trail
                </div>
              </div>
            </article>

            {/* Card 3: Discrepancy Detection */}
            <article
              className="fb-card fb-rv"
              style={{ "--d": 5 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="fb-ico" suppressHydrationWarning>
                <svg className="fb-i">
                  <use href="#fb-flag" />
                </svg>
              </div>
              <h3 suppressHydrationWarning>Discrepancy Detection</h3>
              <p className="fb-d" suppressHydrationWarning>
                Missing details and mismatches between the document and the bank record are flagged instantly.
              </p>
              <div className="fb-panel" suppressHydrationWarning>
                <h4 suppressHydrationWarning>Compare Details</h4>
                <div className="fb-cmp" suppressHydrationWarning>
                  <div className="fb-pr" style={{ "--r": 0 } as React.CSSProperties} suppressHydrationWarning>
                    <span className="ti">
                      <svg className="fb-i"><use href="#fb-doc" /></svg>
                    </span>
                    <div>
                      <small>As per document</small>
                      <b>₹10,00,000</b>
                    </div>
                  </div>
                  <div className="fb-pr" style={{ "--r": 1 } as React.CSSProperties} suppressHydrationWarning>
                    <span className="ti">
                      <svg className="fb-i"><use href="#fb-bank" /></svg>
                    </span>
                    <div>
                      <small>As per bank record</small>
                      <b>₹1,00,000</b>
                    </div>
                  </div>
                </div>
                <div className="fb-fee" suppressHydrationWarning>
                  <span>Variance found</span>
                  <span className="bad">
                    <i />
                    <span data-count="900000" data-pre="₹" data-delay="1200">
                      ₹0
                    </span>
                  </span>
                </div>
                <button className="fb-btn-dark" suppressHydrationWarning>
                  <svg className="fb-i"><use href="#fb-flag" /></svg>
                  Flag for Review
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
