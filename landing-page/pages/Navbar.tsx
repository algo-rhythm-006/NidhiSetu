"use client";

import React from "react";
import PillNav from "@/components/ui/pill-nav";
import { gebuk } from "@/lib/fonts";

export default function Navbar() {
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
        .ns-nav {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1220px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
        }
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
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .ns-logo:hover { opacity: 0.85; transform: translateY(-1px); }

        /* Login button — high contrast with animated circular fill */
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
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          gap: 12px;
        }
        .ns-login-btn:hover {
          border-color: rgba(255, 255, 255, 0.65);
          box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 255, 255, 0.25);
        }
        .ns-login-btn:active { transform: scale(0.96); }

        /* Expanding white circle fill */
        .ns-login-fill {
          position: absolute;
          right: 4px;
          top: 50%;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ffffff;
          transform: translateY(-50%) scale(1);
          transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1);
          pointer-events: none;
          z-index: 1;
        }
        .ns-login-btn:hover .ns-login-fill {
          transform: translateY(-50%) scale(14);
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

        /* Circular icon container holding the black tilted arrow */
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
      <nav className="ns-nav" aria-label="Main" suppressHydrationWarning>
        <a href="/" className={`ns-logo ${gebuk.className}`} suppressHydrationWarning>
          NidhiSetu
        </a>

        <div className="ns-nav-center" suppressHydrationWarning>
          <PillNav items={navItems} />
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
    </>
  );
}
