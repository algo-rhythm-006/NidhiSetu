"use client";

import React, { useState, useEffect, useRef } from "react";
import PillNav from "@/components/ui/pill-nav";
import { gebuk } from "@/lib/fonts";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      // Switch content colors when scrolled past the dark hero gradient into light sections (~380px)
      if (currentScrollY >= 380) {
        setIsLight(true);
      } else {
        setIsLight(false);
      }

      // When at the very top of the page, always show in dark mode
      if (currentScrollY <= 25) {
        setHidden(false);
        setIsLight(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      const delta = currentScrollY - lastScrollY.current;
      // Scroll threshold to ignore micro-scroll jitter
      if (Math.abs(delta) < 8) return;

      if (delta > 0 && currentScrollY > 80) {
        // Scrolling DOWN -> smoothly hide
        setHidden(true);
      } else if (delta < 0) {
        // Scrolling UP -> smoothly reveal
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Overview", href: "#" },
    { label: "Verification", href: "#verification" },
    { label: "Institutions", href: "#institutions" },
    { label: "AI Sentinel", href: "#sentinel" },
    { label: "Regulatory FAQ", href: "#faq" },
  ];

  return (
    <>
      <style>{`
        /* ── Navbar Header Container ──
           Completely transparent in ALL modes. No background, no backdrop blur bar,
           no border, no box shadow. Only the individual contents float. */
        .ns-navbar-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 1000;
          display: flex;
          justify-content: center;
          pointer-events: none;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(0);
        }

        .ns-navbar-header.is-hidden {
          transform: translateY(-115%);
        }

        .ns-navbar-header.theme-light {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .ns-nav {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1220px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          pointer-events: auto;
          background: transparent !important;
        }

        /* ── Logo ── */
        .ns-logo {
          font-size: clamp(24px, 2.4vw, 34px);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #ffffff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          user-select: none;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
          transition: color 0.3s ease, opacity 0.2s ease, transform 0.2s ease, text-shadow 0.3s ease;
        }
        .ns-logo:hover { opacity: 0.85; transform: translateY(-1px); }

        /* Logo turns deep black in light theme */
        .ns-navbar-header.theme-light .ns-logo {
          color: #0A0A0B;
          text-shadow: 0 1px 12px rgba(255, 255, 255, 0.7);
        }

        /* ── Login button ── */
        .ns-login-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 9999px;
          height: 38px;
          padding: 4px 4px 4px 18px;
          box-sizing: border-box;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-decoration: none;
          overflow: hidden;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s ease,
                      border-color 0.25s ease,
                      background-color 0.3s ease;
          gap: 12px;
        }
        .ns-login-btn:hover {
          border-color: rgba(255, 255, 255, 0.65);
          box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 255, 255, 0.25);
        }
        .ns-login-btn:active { transform: scale(0.96); }

        /* Login button turns solid black in Light Theme */
        .ns-navbar-header.theme-light .ns-login-btn {
          background: #0A0A0B;
          color: #ffffff;
          border: 1px solid #0A0A0B;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
        }
        .ns-navbar-header.theme-light .ns-login-btn:hover {
          border-color: #0A0A0B;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.26);
        }

        /* Expanding circle fill */
        .ns-login-fill {
          position: absolute;
          right: 4px;
          top: 50%;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ffffff;
          transform: translateY(-50%) scale(1);
          transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1), background-color 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }
        .ns-login-btn:hover .ns-login-fill {
          transform: translateY(-50%) scale(14);
        }

        .ns-navbar-header.theme-light .ns-login-fill {
          background: #27272a;
        }

        .ns-login-text {
          position: relative;
          z-index: 2;
          white-space: nowrap;
          user-select: none;
          color: #ffffff;
          transition: color 0.3s ease;
        }
        .ns-login-btn:hover .ns-login-text {
          color: #0A0A0B;
        }
        .ns-navbar-header.theme-light .ns-login-btn:hover .ns-login-text {
          color: #ffffff;
        }

        /* Circular icon container holding the arrow */
        .ns-login-icon {
          position: relative;
          z-index: 2;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
          transition: background 0.3s ease;
        }

        .ns-login-arrow {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: block;
        }
        .ns-login-btn:hover .ns-login-arrow {
          transform: translate(2px, -2px);
        }

        .ns-nav-center { display: flex; justify-content: center; }
        .ns-nav-right { display: flex; align-items: center; gap: 12px; }
        @media (max-width: 890px) { .ns-nav-center { display: none !important; } }
      `}</style>
      <header
        className={`ns-navbar-header ${isLight ? "theme-light" : ""} ${hidden ? "is-hidden" : ""}`}
        aria-label="Main Navigation Header"
        suppressHydrationWarning
      >
        <nav className="ns-nav" aria-label="Main" suppressHydrationWarning>
          <a href="/" className={`ns-logo ${gebuk.className}`} suppressHydrationWarning>
            NidhiSetu
          </a>

          <div className="ns-nav-center" suppressHydrationWarning>
            <PillNav items={navItems} theme={isLight ? "light" : "dark"} />
          </div>

          <div className="ns-nav-right" suppressHydrationWarning>
            <a href="/login" className="ns-login-btn" suppressHydrationWarning>
              <span className="ns-login-fill" aria-hidden="true" suppressHydrationWarning />
              <span className="ns-login-text" suppressHydrationWarning>Login</span>
              <span className="ns-login-icon" suppressHydrationWarning>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0A0A0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ns-login-arrow"
                  suppressHydrationWarning
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </span>
            </a>
          </div>
        </nav>
      </header>

      {/* Structural layout spacer preserving exact Hero vertical dimensions */}
      <div
        className="ns-navbar-spacer"
        style={{
          width: "100%",
          height: 88,
          pointerEvents: "none",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
    </>
  );
}
