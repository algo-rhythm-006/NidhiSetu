"use client";

import React from "react";

interface ArrowFillButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  text: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export default function ArrowFillButton({
  text,
  href = "#",
  className = "",
  onClick,
  ...props
}: ArrowFillButtonProps) {
  return (
    <>
      <style>{`
        .arrow-fill-interactive-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 9999px;
          background: #ffffff;
          color: #0A0A0B;
          padding: 6px 6px 6px 22px;
          height: 48px;
          box-sizing: border-box;
          overflow: hidden;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 12px 30px -6px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          gap: 12px;
        }
        .arrow-fill-interactive-btn:hover {
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.35);
        }
        .arrow-fill-interactive-btn:active {
          transform: scale(0.96);
        }
        .af-circle {
          position: absolute;
          right: 6px;
          top: 50%;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0A0A0B;
          transform: translateY(-50%) scale(1);
          transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1);
          pointer-events: none;
          z-index: 1;
        }
        .arrow-fill-interactive-btn:hover .af-circle {
          transform: translateY(-50%) scale(16);
        }
        .af-text {
          position: relative;
          z-index: 2;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #0A0A0B;
          transition: color 0.3s ease;
          white-space: nowrap;
          user-select: none;
        }
        .arrow-fill-interactive-btn:hover .af-text {
          color: #FFFFFF;
        }
        .af-icon-wrap {
          position: relative;
          z-index: 2;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0A0A0B;
          transition: background 0.3s ease;
          flex-shrink: 0;
        }
        .arrow-fill-interactive-btn:hover .af-icon-wrap {
          background: rgba(255, 255, 255, 0.18);
        }
        .af-svg-arrow {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .arrow-fill-interactive-btn:hover .af-svg-arrow {
          transform: translate(2px, -2px);
        }
      `}</style>
      <a
        href={href}
        onClick={onClick}
        className={`arrow-fill-interactive-btn ${className}`}
        suppressHydrationWarning
        {...props}
      >
        {/* Expanding circular fill on hover */}
        <span className="af-circle" aria-hidden="true" suppressHydrationWarning />

        {/* Button Text */}
        <span className="af-text" suppressHydrationWarning>
          {text}
        </span>

        {/* Tilted Arrow Pill Icon */}
        <span className="af-icon-wrap" suppressHydrationWarning>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="af-svg-arrow"
            suppressHydrationWarning
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </span>
      </a>
    </>
  );
}
