"use client";

import React, { useState, useRef } from "react";
import gsap from "gsap";
import { CrownIcon, UpRightArrowIcon, CloseIcon } from "./Icons";

export default function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    if (!bannerRef.current) {
      setDismissed(true);
      return;
    }
    const b = bannerRef.current;
    gsap.to(b, { opacity: 0, scale: 0.98, duration: 0.25, ease: "power2.in" });
    gsap.to(b, {
      height: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.5,
      delay: 0.15,
      ease: "power3.inOut",
      onComplete: () => setDismissed(true),
    });
  };

  if (dismissed) return null;

  return (
    <div className="banner" id="banner" ref={bannerRef}>
      <span className="i crown">
        <CrownIcon size={19} />
      </span>
      <span>Upgrade your plan to unlock bulk FDR verification</span>
      <button
        type="button"
        className="pill-btn"
        onClick={() => alert("Select Plan Modal")}
      >
        <span>Select Plan</span>
        <UpRightArrowIcon size={11} />
      </button>
      <button
        type="button"
        className="x"
        id="closeBanner"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <CloseIcon size={15} />
      </button>
    </div>
  );
}
