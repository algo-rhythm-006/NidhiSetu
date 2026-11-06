"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import TwinOrbit from "./twin-orbit";

export interface PageLoaderProps {
  text?: string;
  subtext?: string;
  onFinish?: () => void;
  minDuration?: number;
}

export function PageLoader({
  text = "Authorizing Sentinel Session...",
  subtext = "AICTE Cryptographic FDR Ledger Synchronization",
  onFinish,
  minDuration = 850,
}: PageLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.95, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }

    const timer = setTimeout(() => {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.02,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => {
            onFinishRef.current?.();
          },
        });
      } else {
        onFinishRef.current?.();
      }
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  return (
    <div
      ref={containerRef}
      className="page-loader-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(12px)",
        color: "#100f26",
        fontFamily: 'var(--font-gebuk), "Comfortaa", "Nunito", sans-serif',
      }}
    >
      <div
        ref={contentRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            position: "relative",
          }}
        >
          <TwinOrbit size={16} color="#453F8C" secondaryColor="#746FB9" duration="1.1s" />
        </div>

        <h3
          style={{
            marginTop: "24px",
            fontSize: "17px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#100F26",
            margin: "24px 0 0 0",
          }}
        >
          {text}
        </h3>

        <p
          style={{
            marginTop: "8px",
            fontSize: "12.5px",
            fontWeight: 500,
            color: "#746FB9",
            maxWidth: "360px",
            lineHeight: 1.5,
            margin: "8px 0 0 0",
          }}
        >
          {subtext}
        </p>

        <div
          style={{
            marginTop: "22px",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            borderRadius: "999px",
            border: "1px solid #D4D3EE",
            backgroundColor: "#F2F1FA",
            padding: "5px 14px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#453F8C",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#2FBF71",
              display: "inline-block",
            }}
          />
          <span>AICTE Sentinel Level-3 Handshake</span>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;

