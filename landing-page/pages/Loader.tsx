"use client";

import React, { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   NidhiSetu Loader — identical to loader.html.
   The overlay fades out after 5 s and is then cleanly unmounted.
───────────────────────────────────────────────────────────────────────────── */

const NAME_LETTERS = ["N", "i", "d", "h", "i", "S", "e", "t", "u"];

export default function Loader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Notify when loader begins fading out (~4.4s) so hero & navbar entrance kicks in
    const exitTimer = setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("ns-loader-exit"));
        (window as any).__NS_LOADER_EXITED__ = true;
      } catch (e) {}
    }, 4400);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        #ns-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(ellipse 38% 34% at 50% 42%, rgba(255,255,255,.98), rgba(255,255,255,0) 100%),
            linear-gradient(145deg, #fbfcfd 0%, #f4f6f9 100%);
          animation: ldrOverlayOut .55s cubic-bezier(.4,0,.2,1) 4.45s forwards;
        }
        #ns-loader::before {
          content: "";
          position: absolute;
          width: min(74vw, 620px);
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(90,112,145,.075), rgba(90,112,145,0) 68%);
          filter: blur(12px);
          opacity: 0;
          animation: ldrAmbientIn 1.2s ease-out .2s forwards;
        }
        .ldr-stack {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
          transform: translateY(-1.5vh);
        }
        .ldr-logo-wrap {
          position: relative;
          width: clamp(112px, 16vw, 142px);
          height: clamp(112px, 16vw, 142px);
          margin-bottom: 30px;
          perspective: 800px;
        }
        .ldr-logo {
          position: relative;
          width: 100%;
          height: 100%;
          display: block;
          opacity: 0;
          transform: translateY(16px) scale(.88);
          filter: drop-shadow(0 14px 24px rgba(18,25,38,.13));
          animation: ldrLogoIn 1.05s cubic-bezier(.16,1,.3,1) .15s forwards,
                     ldrLogoSettle .8s ease-out 2.55s forwards;
        }
        .ldr-shield {
          fill: none;
          stroke: #fff;
          stroke-width: 86;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          opacity: 0;
          animation: ldrDraw 1.25s cubic-bezier(.65,0,.25,1) .55s forwards;
        }
        .ldr-sprout {
          fill: #fff;
          stroke: #fff;
          transform-box: fill-box;
          transform-origin: 50% 100%;
          transform: scale(.72);
          opacity: 0;
          animation: ldrGrow .75s cubic-bezier(.2,.9,.25,1) 1.55s forwards;
        }
        .ldr-arm { fill: none; stroke: #fff; stroke-width: 78; stroke-linecap: round; }
        .ldr-shine {
          transform: translateX(-1500px) skewX(-18deg);
          animation: ldrShine 1s ease-in-out 2.2s forwards;
        }
        .ldr-eyebrow {
          margin-bottom: 11px;
          color: #7b8492;
          font-size: 10px;
          font-weight: 650;
          letter-spacing: .22em;
          text-transform: uppercase;
          opacity: 0;
          animation: ldrFadeUp .65s ease-out 1.9s forwards;
        }
        .ldr-name {
          display: flex;
          overflow: hidden;
          padding: 3px 2px 7px;
          font-size: clamp(38px, 7vw, 54px);
          font-weight: 700;
          letter-spacing: -.065em;
          line-height: 1;
        }
        .ldr-name span {
          display: inline-block;
          transform: translateY(115%);
          opacity: 0;
          animation: ldrLetterUp .62s cubic-bezier(.16,1,.3,1) forwards;
        }
        .ldr-name span:nth-child(1) { animation-delay: 2.150s; }
        .ldr-name span:nth-child(2) { animation-delay: 2.195s; }
        .ldr-name span:nth-child(3) { animation-delay: 2.240s; }
        .ldr-name span:nth-child(4) { animation-delay: 2.285s; }
        .ldr-name span:nth-child(5) { animation-delay: 2.330s; }
        .ldr-name span:nth-child(6) { animation-delay: 2.375s; }
        .ldr-name span:nth-child(7) { animation-delay: 2.420s; }
        .ldr-name span:nth-child(8) { animation-delay: 2.465s; }
        .ldr-name span:nth-child(9) { animation-delay: 2.510s; }
        .ldr-name .accent { color: #111318; }
        .ldr-rule {
          width: 0;
          height: 1px;
          margin: 18px 0 17px;
          background: linear-gradient(90deg, transparent, rgba(83,107,140,.55), transparent);
          animation: ldrRule .8s ease-out 2.85s forwards;
        }
        .ldr-tagline {
          max-width: 460px;
          color: #737985;
          font-size: clamp(13px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: -.012em;
          line-height: 1.75;
        }
        .ldr-tagline .w {
          display: inline-block;
          opacity: 0;
          transform: translateY(7px);
          filter: blur(3px);
          animation: ldrWordIn .5s ease-out forwards;
        }
        .ldr-w-0 { animation-delay: 2.950s; }
        .ldr-w-1 { animation-delay: 2.985s; }
        .ldr-w-2 { animation-delay: 3.020s; }
        .ldr-w-3 { animation-delay: 3.055s; }
        .ldr-w-4 { animation-delay: 3.090s; }
        .ldr-w-5 { animation-delay: 3.125s; }
        .ldr-w-6 { animation-delay: 3.160s; }
        .ldr-w-7 { animation-delay: 3.195s; }
        .ldr-w-9 { animation-delay: 3.265s; }
        .ldr-w-10 { animation-delay: 3.300s; }
        .ldr-w-11 { animation-delay: 3.335s; }
        .ldr-tagline .line2 { display: block; margin-top: 1px; }
        .ldr-tagline .strong { color: #252a33; font-weight: 600; }
        .ldr-progress {
          position: relative;
          width: 154px;
          height: 2px;
          margin-top: 32px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(17,19,24,.09);
          opacity: 0;
          animation: ldrFadeIn .45s ease-out .35s forwards;
        }
        .ldr-progress i {
          display: block;
          width: 0;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #9aa9bc, #354b68);
          animation: ldrBar 4.1s cubic-bezier(.45,.05,.25,1) .35s forwards;
        }

        @keyframes ldrLogoIn    { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ldrLogoSettle{ to { filter: drop-shadow(0 10px 20px rgba(18,25,38,.11)); } }
        @keyframes ldrDraw      { to { opacity: 1; stroke-dashoffset: 0; } }
        @keyframes ldrGrow      { to { transform: scale(1); opacity: 1; } }
        @keyframes ldrShine     { to { transform: translateX(1700px) skewX(-18deg); } }
        @keyframes ldrLetterUp  { to { transform: translateY(0); opacity: 1; } }
        @keyframes ldrRule      { to { width: min(230px, 58vw); } }
        @keyframes ldrWordIn    { to { opacity: 1; transform: none; filter: blur(0); } }
        @keyframes ldrBar       { to { width: 100%; } }
        @keyframes ldrFadeIn    { to { opacity: 1; } }
        @keyframes ldrFadeUp    { to { opacity: 1; transform: translateY(0); } }
        @keyframes ldrAmbientIn { to { opacity: 1; } }
        @keyframes ldrOverlayOut{ to { opacity: 0; visibility: hidden; } }

        @media (max-width: 480px) {
          .ldr-stack { padding: 22px; }
          .ldr-logo-wrap { margin-bottom: 26px; }
          .ldr-tagline { max-width: 330px; }
        }
        @media (prefers-reduced-motion: reduce) {
          #ns-loader *, #ns-loader::before {
            animation-duration: .01s !important;
            animation-delay: 0s !important;
          }
          #ns-loader { animation: ldrOverlayOut .3s ease 1.2s forwards; }
        }
      `}</style>

      <div id="ns-loader" aria-label="Loading NidhiSetu" role="status" suppressHydrationWarning>
        <div className="ldr-stack" suppressHydrationWarning>
          {/* Logo */}
          <div className="ldr-logo-wrap" suppressHydrationWarning>
            <svg
              className="ldr-logo"
              viewBox="0 0 1254 1254"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="tileClip">
                  <rect width="1254" height="1254" rx="235" />
                </clipPath>
                <linearGradient id="shineGrad" x1="0" x2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset=".5" stopColor="#fff" stopOpacity=".28" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="1254" height="1254" rx="235" fill="#000" />

              {/* Shield */}
              <path
                className="ldr-shield"
                pathLength={1}
                d="M627 188 C760 250 890 295 1016 335 L1016 520 C1016 745 935 885 745 985 Q685 1015 627 1030 Q569 1015 509 985 C319 885 238 745 238 520 L238 335 C364 295 494 250 627 188 Z"
              />

              {/* Sprout */}
              <g className="ldr-sprout">
                <path
                  d="M627 382 Q637 382 640 410 L655 600 L599 600 L614 410 Q617 382 627 382 Z"
                  strokeWidth="2"
                />
                <line className="ldr-arm" x1="438" y1="535" x2="598" y2="660" />
                <line className="ldr-arm" x1="817" y1="535" x2="658" y2="660" />
                <path
                  d="M572 690 L682 690 L660 800 Q627 850 594 800 Z"
                  strokeWidth="30"
                  strokeLinejoin="round"
                />
              </g>

              {/* Shine sweep */}
              <g clipPath="url(#tileClip)">
                <rect
                  className="ldr-shine"
                  x="0"
                  y="-200"
                  width="260"
                  height="1700"
                  fill="url(#shineGrad)"
                />
              </g>
            </svg>
          </div>

          <div className="ldr-eyebrow">FDR VERIFICATION PLATFORM</div>

          <h1 className="ldr-name" aria-label="NidhiSetu" suppressHydrationWarning>
            {NAME_LETTERS.map((letter, i) => (
              <span
                key={i}
                className={i >= 5 ? "accent" : undefined}
                suppressHydrationWarning
              >
                {letter}
              </span>
            ))}
          </h1>

          <div className="ldr-rule" suppressHydrationWarning />

          <p className="ldr-tagline" suppressHydrationWarning>
            <span suppressHydrationWarning>
              <span className="w ldr-w-0" suppressHydrationWarning>Because</span>{" "}
              <span className="w ldr-w-1" suppressHydrationWarning>every</span>{" "}
              <span className="w ldr-w-2" suppressHydrationWarning>FDR</span>{" "}
              <span className="w ldr-w-3" suppressHydrationWarning>deserves</span>{" "}
              <span className="w ldr-w-4" suppressHydrationWarning>more</span>{" "}
              <span className="w ldr-w-5" suppressHydrationWarning>than</span>{" "}
              <span className="w ldr-w-6" suppressHydrationWarning>a</span>{" "}
              <span className="w ldr-w-7" suppressHydrationWarning>glance,</span>
            </span>
            <span className="line2 strong" suppressHydrationWarning>
              <span className="w ldr-w-9" suppressHydrationWarning>it</span>{" "}
              <span className="w ldr-w-10" suppressHydrationWarning>deserves</span>{" "}
              <span className="w ldr-w-11" suppressHydrationWarning>verification.</span>
            </span>
          </p>

          <div className="ldr-progress">
            <i />
          </div>
        </div>
      </div>
    </>
  );
}

