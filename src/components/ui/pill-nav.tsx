"use client";

import React, { useState } from "react";

export interface NavItem {
  label: string;
  href: string;
}

interface PillNavProps {
  items: NavItem[];
  activeItem?: string;
  className?: string;
  theme?: "dark" | "light";
  onItemClick?: (item: NavItem) => void;
}

export default function PillNav({
  items,
  activeItem,
  className = "",
  theme = "dark",
  onItemClick,
}: PillNavProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  return (
    <>
      <style>{`
        .pill-nav-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 5px 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .pill-nav-link {
          position: relative;
          padding: 7px 15px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          border-radius: 9999px;
          transition: color 0.25s ease;
          cursor: pointer;
          white-space: nowrap;
          z-index: 2;
        }
        .pill-nav-link:hover, .pill-nav-link.active {
          color: #ffffff;
        }
        .pill-bg-indicator {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: -1;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pill-bg-indicator.active {
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.25);
        }
        .pill-bg-indicator.hovered {
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: none;
        }

        /* ── Light Theme: Self-contained floating pill capsule only ── */
        .pill-nav-container.theme-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 6px 24px -2px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9);
        }
        .pill-nav-container.theme-light .pill-nav-link {
          color: rgba(10, 10, 11, 0.72);
        }
        .pill-nav-container.theme-light .pill-nav-link:hover,
        .pill-nav-container.theme-light .pill-nav-link.active {
          color: #0A0A0B;
        }
        .pill-nav-container.theme-light .pill-bg-indicator.active {
          background: rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        .pill-nav-container.theme-light .pill-bg-indicator.hovered {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
      `}</style>
      <nav
        className={`pill-nav-container ${theme === "light" ? "theme-light" : ""} ${className}`}
        aria-label="Primary Navigation"
        suppressHydrationWarning
      >
        {items.map((item, index) => {
          const isActive = activeItem ? activeItem === item.label : selectedIdx === index;
          const isHovered = hoveredIdx === index;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`pill-nav-link ${isActive ? "active" : ""}`}
              suppressHydrationWarning
              onClick={(e) => {
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  setSelectedIdx(index);
                  onItemClick?.(item);
                  const el = document.querySelector(item.href);
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Background pill for hover/active */}
              {(isActive || isHovered) && (
                <span
                  className={`pill-bg-indicator ${isActive ? "active" : "hovered"}`}
                  aria-hidden="true"
                />
              )}
              {item.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
