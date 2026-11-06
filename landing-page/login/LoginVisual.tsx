"use client";

import React, { useEffect } from "react";
import type { RoleType } from "./LoginPortal";

interface LoginVisualProps {
  role: RoleType;
}

const ROLE_IMAGES: Record<RoleType, { src: string; alt: string }> = {
  college: {
    src: "/college.jpeg",
    alt: "NidhiSetu College Portal Visual",
  },
  official: {
    src: "/official.jpeg",
    alt: "NidhiSetu Official Regulatory Visual",
  },
  admin: {
    src: "/admin.jpeg",
    alt: "NidhiSetu Administrator Visual",
  },
};

const ALL_ROLES: RoleType[] = ["college", "official", "admin"];

export default function LoginVisual({ role }: LoginVisualProps) {
  // Preload all 3 images into browser cache so switching has 0 latency
  useEffect(() => {
    ALL_ROLES.forEach((r) => {
      const img = new Image();
      img.src = ROLE_IMAGES[r].src;
    });
  }, []);

  return (
    <div
      className="lg-visual-root"
      aria-hidden="true"
      suppressHydrationWarning
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#04040A",
        borderRadius: "inherit",
      }}
    >
      {ALL_ROLES.map((r) => {
        const isActive = role === r;
        return (
          <img
            key={r}
            src={ROLE_IMAGES[r].src}
            alt={ROLE_IMAGES[r].alt}
            className={`lg-img-layer ${isActive ? "active" : "inactive"}`}
            loading="eager"
            decoding="async"
            suppressHydrationWarning
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              borderRadius: "inherit",
              pointerEvents: "none",
              userSelect: "none",
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 2 : 1,
              transition: "opacity 0.35s ease-in-out",
              willChange: "opacity",
            }}
          />
        );
      })}
    </div>
  );
}
