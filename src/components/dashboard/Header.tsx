"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ShieldIcon } from "./Icons";

interface HeaderProps {
  userName?: string;
  onVerifyClick?: () => void;
}

export default function Header({ userName = "Jenny", onVerifyClick }: HeaderProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    const chars = headingRef.current.querySelectorAll(".ch");
    if (chars.length) {
      gsap.fromTo(
        chars,
        { yPercent: 115, opacity: 0, rotate: 6 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.8,
          stagger: 0.035,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }

    if (btnRef.current) {
      gsap.fromTo(
        btnRef.current,
        { scale: 0.7, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: "back.out(2)",
          delay: 0.35,
        }
      );
    }
  }, [userName]);

  const greetingText = `Hello, ${userName}!`;

  return (
    <div className="hd" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
      <h1 id="hello" ref={headingRef} aria-label={greetingText} style={{ margin: 0 }}>
        {greetingText.split("").map((c, i) => (
          <span key={i} className="ch" aria-hidden="true">
            {c === " " ? "\u00A0" : c}
          </span>
        ))}
      </h1>

      <button
        id="verifyBtn"
        ref={btnRef}
        type="button"
        className="btn-black"
        onClick={onVerifyClick}
        aria-label="Verify FDR"
        title="Initiate Fixed Deposit Receipt Verification"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "9px",
          height: "46px",
          padding: "0 22px",
          borderRadius: "999px",
          backgroundColor: "#0E0E0F",
          color: "#ffffff",
          fontSize: "13.5px",
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          cursor: "pointer",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <span className="i" style={{ display: "inline-flex", alignItems: "center", color: "#ffffff", stroke: "#ffffff" }}>
          <ShieldIcon size={17} />
        </span>
        <span style={{ color: "#ffffff" }}>Verify FDR</span>
      </button>
    </div>
  );
}
