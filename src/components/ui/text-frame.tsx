"use client";

import React, { useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface TextFrameProps {
  children: React.ReactNode;
  className?: string;
  theme?: "atmosphere" | "light" | "default";
  lineStyle?: "dashed" | "solid";
  showCursor?: boolean;
  cursorLabel?: string;
  animate?: boolean;
}

// 8 Bounding Box Handles: 4 Corners + 4 Edge Midpoints
const HANDLES = [
  { id: "tl", x: "0", y: "0" },
  { id: "tm", x: "calc(50% - 0.08em)", y: "0" },
  { id: "tr", x: "calc(100% - 0.16em)", y: "0" },
  { id: "mr", x: "calc(100% - 0.16em)", y: "calc(50% - 0.08em)" },
  { id: "br", x: "calc(100% - 0.16em)", y: "calc(100% - 0.16em)" },
  { id: "bm", x: "calc(50% - 0.08em)", y: "calc(100% - 0.16em)" },
  { id: "bl", x: "0", y: "calc(100% - 0.16em)" },
  { id: "ml", x: "0", y: "calc(50% - 0.08em)" },
];

export default function TextFrame({
  children,
  className = "",
  theme = "atmosphere",
  lineStyle = "solid",
  showCursor = true,
  cursorLabel,
  animate = true,
}: TextFrameProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<SVGRectElement>(null);
  const handlesRef = useRef<SVGGElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `tf-grad-${uid}`;

  const isAtmosphere = theme === "atmosphere";

  // GSAP Entrance & Floating Cursor Animation
  useGSAP(
    () => {
      if (!animate || !containerRef.current) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // 1. Reveal frame line
      if (frameRef.current) {
        tl.fromTo(
          frameRef.current,
          { scale: 0.92, opacity: 0, transformOrigin: "center center" },
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.4)" },
          0.1
        );
      }

      // 2. Text is always visible, subtle micro-entrance
      if (textRef.current) {
        tl.fromTo(
          textRef.current,
          { opacity: 0.85, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          0.15
        );
      }

      // 3. Pop in the 8 handles with spring stagger
      if (handlesRef.current) {
        const handleEls = handlesRef.current.children;
        tl.fromTo(
          handleEls,
          { scale: 0, opacity: 0, transformOrigin: "center center" },
          {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            stagger: 0.035,
            ease: "back.out(2)",
          },
          0.45
        );
      }

      // 4. Cursor flies in to the bottom-right corner and starts gentle breathing float
      if (cursorRef.current && showCursor) {
        tl.fromTo(
          cursorRef.current,
          { opacity: 0, scale: 0.4, x: 18, y: 18 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.55,
            ease: "back.out(1.7)",
          },
          0.75
        );

        // Subtle idle floating animation
        gsap.to(cursorRef.current, {
          y: -3,
          x: -1,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.3,
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <>
      <style>{`
        .tf-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.10em 0.28em 0.14em;
          margin: 0 0.10em;
          vertical-align: baseline;
          white-space: nowrap;
          user-select: none;
        }
        .tf-theme-atmosphere .tf-text {
          position: relative;
          z-index: 2;
          display: inline-block;
          font-family: inherit;
          font-weight: inherit;
          font-size: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          background: linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 45%, #FFFFFF 100%);
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: #C4B5FD; /* Fallback */
          text-shadow: 0 0 28px rgba(165, 180, 252, 0.45);
        }
        .tf-theme-light .tf-text,
        .tf-theme-default .tf-text {
          position: relative;
          z-index: 2;
          display: inline-block;
          font-family: inherit;
          font-weight: inherit;
          font-size: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          background: linear-gradient(135deg, #3730A3 0%, #5B52D6 45%, #4F46E5 100%);
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: #5B52D6; /* Fallback */
          text-shadow: 0 2px 14px rgba(91, 82, 214, 0.22);
        }
        .tf-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }
        .tf-cursor-wrap {
          position: absolute;
          bottom: -0.42em;
          right: -0.46em;
          z-index: 10;
          pointer-events: none;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tf-cursor-tag {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #5B52D6;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
      `}</style>

      <span
        ref={containerRef}
        className={cn(
          "tf-container",
          isAtmosphere ? "tf-theme-atmosphere" : "tf-theme-light",
          className
        )}
        suppressHydrationWarning
      >
        {/* SVG Selection Bounding Box & 8 Handles */}
        <svg
          className="tf-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          suppressHydrationWarning
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isAtmosphere ? (
                <>
                  <stop offset="0%" stopColor="#746FB9" stopOpacity="0.14" />
                  <stop offset="50%" stopColor="#453F8C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#A6A3DC" stopOpacity="0.18" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#5B52D6" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#5B52D6" stopOpacity="0.14" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Bounding Box Border */}
          <rect
            ref={frameRef}
            x="0.08em"
            y="0.08em"
            width="calc(100% - 0.16em)"
            height="calc(100% - 0.16em)"
            strokeWidth={lineStyle === "dashed" ? "0.012em" : "0.015em"}
            stroke={isAtmosphere ? "rgba(196, 181, 253, 0.85)" : "#5B52D6"}
            strokeDasharray={lineStyle === "dashed" ? "0.16em 0.12em" : undefined}
            fill={`url(#${gradientId})`}
            rx="0.06em"
          />

          {/* 8 Bounding Box Handles */}
          <g ref={handlesRef}>
            {HANDLES.map((h) => (
              <rect
                key={h.id}
                x={h.x}
                y={h.y}
                width="0.16em"
                height="0.16em"
                rx="0.02em"
                strokeWidth="0.014em"
                stroke={isAtmosphere ? "#C4B5FD" : "#5B52D6"}
                fill={isAtmosphere ? "#080718" : "#FFFFFF"}
              />
            ))}
          </g>
        </svg>

        {/* The Text Itself (Guaranteed Visible + Radiant) */}
        <span
          ref={textRef}
          className="tf-text"
          suppressHydrationWarning
        >
          {children}
        </span>

        {/* Figma/Design Pointer Cursor */}
        {showCursor && (
          <div
            ref={cursorRef}
            className="tf-cursor-wrap"
            aria-hidden="true"
            suppressHydrationWarning
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
            >
              <path
                d="M4 3L11.5 21L14.2 13.8L21.4 11.1L4 3Z"
                fill={isAtmosphere ? "#0A0A0B" : "#5B52D6"}
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>

            {cursorLabel && (
              <span className="tf-cursor-tag">{cursorLabel}</span>
            )}
          </div>
        )}
      </span>
    </>
  );
}

export { TextFrame };
