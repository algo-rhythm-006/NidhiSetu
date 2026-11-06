"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { UpRightArrowIcon } from "./Icons";
import type { FdrStatusItem } from "./types";

const INITIAL_STATUS: FdrStatusItem[] = [
  { label: "Verified", count: 1162 },
  { label: "In review", count: 94 },
  { label: "Rejected", count: 28 },
];

export default function FdrStatusCard() {
  const numRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    INITIAL_STATUS.forEach((item, i) => {
      const el = numRefs.current[i];
      if (!el) return;

      const obj = { v: 0 };
      gsap.to(obj, {
        v: item.count,
        duration: 1.6,
        delay: 0.35 + i * 0.1,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = new Intl.NumberFormat("en-IN").format(Math.round(obj.v));
        },
      });
    });
  }, []);

  return (
    <div className="r-sec">
      <div className="r-head">
        <h2>FDR Status</h2>
        <a href="#status" className="see" title="See all FDR statuses">
          <span>See All</span>
          <span className="i">
            <UpRightArrowIcon size={12} />
          </span>
        </a>
      </div>

      <div className="card list">
        {INITIAL_STATUS.map((item, i) => (
          <div key={item.label} className="li">
            <span>{item.label}</span>
            <b
              ref={(el) => {
                numRefs.current[i] = el;
              }}
              data-n={item.count}
            >
              0
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
