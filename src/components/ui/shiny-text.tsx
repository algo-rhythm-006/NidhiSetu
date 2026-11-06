"use client";

import React from "react";

interface ShinyTextProps {
  text?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export default function ShinyText({
  text,
  children,
  disabled = false,
  speed = 3.5,
  className = "",
}: ShinyTextProps) {
  const content = children || text;

  return (
    <>
      <style>{`
        @keyframes nsShinyTextSweep {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -180% 0;
          }
        }
        .ns-shiny-text {
          display: inline-block;
          background-image: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0.52) 0%,
            rgba(255, 255, 255, 0.52) 36%,
            #ffffff 48%,
            #ffffff 52%,
            rgba(255, 255, 255, 0.52) 64%,
            rgba(255, 255, 255, 0.52) 100%
          );
          background-size: 260% 100%;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          animation: nsShinyTextSweep linear infinite;
        }
      `}</style>
      <span
        className={`ns-shiny-text ${className}`}
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: disabled ? "paused" : "running",
        }}
        suppressHydrationWarning
      >
        {content}
      </span>
    </>
  );
}
