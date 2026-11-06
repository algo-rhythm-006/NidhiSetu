"use client";

import React, { useRef, useState } from "react";

interface SpecularButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
  href?: string;
  variant?: "glass" | "dark" | "light";
  onClick?: () => void;
}

export default function SpecularButton({
  children,
  className = "",
  href = "#",
  variant = "glass",
  onClick,
  ...props
}: SpecularButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <>
      <style>{`
        .specular-interactive-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          height: 48px;
          padding: 0 24px;
          box-sizing: border-box;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          text-decoration: none;
          overflow: hidden;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.26);
          color: #ffffff;
          box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.28);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .specular-interactive-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.42);
          box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 255, 255, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          transform: translateY(-1.5px);
        }
        .specular-interactive-btn:active {
          transform: scale(0.96);
        }
        .specular-btn-content {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #FFFFFF;
          transition: text-shadow 0.25s ease;
          white-space: nowrap;
          user-select: none;
        }
        .specular-interactive-btn:hover .specular-btn-content {
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
        }
      `}</style>
      <a
        ref={buttonRef}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`specular-interactive-btn ${className}`}
        suppressHydrationWarning
        {...props}
      >
        {/* Dynamic Specular Spotlight tracking mouse pointer */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.25s ease",
            background: `radial-gradient(110px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.45), transparent 70%)`,
            borderRadius: "inherit",
            zIndex: 1,
          }}
          aria-hidden="true"
          suppressHydrationWarning
        />

        {/* Dynamic Specular Edge Rim Light */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: 1,
            pointerEvents: "none",
            opacity: isHovered ? 1 : 0.6,
            transition: "opacity 0.25s ease",
            background: `radial-gradient(90px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.85), transparent 60%)`,
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            zIndex: 1,
          }}
          aria-hidden="true"
          suppressHydrationWarning
        />

        {/* Button Content */}
        <span className="specular-btn-content" suppressHydrationWarning>
          {children}
        </span>
      </a>
    </>
  );
}
