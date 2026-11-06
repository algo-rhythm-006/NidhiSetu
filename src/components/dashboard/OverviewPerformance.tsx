"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import type { PeriodKey, PeriodStats } from "./types";

const PERIODS: Record<PeriodKey, PeriodStats> = {
  day: {
    tag: "last 24 hours",
    cur: [184, 166, 14, 90.2],
    prev: [172, 150, 17, 87.2],
  },
  week: {
    tag: "last 7 days",
    cur: [1284, 1162, 94, 90.5],
    prev: [1126, 1004, 101, 89.2],
  },
  month: {
    tag: "last 30 days",
    cur: [5420, 4910, 382, 90.6],
    prev: [4988, 4421, 395, 88.6],
  },
  year: {
    tag: "last 12 months",
    cur: [61308, 55872, 4106, 91.1],
    prev: [54210, 48730, 4388, 89.9],
  },
};

const STAT_TITLES = [
  "FDRs Submitted",
  "Verified",
  "In Review",
  "Success Rate",
];

interface OverviewPerformanceProps {
  isReady?: boolean;
}

export default function OverviewPerformance({ isReady = true }: OverviewPerformanceProps) {
  const [period, setPeriod] = useState<PeriodKey>("week");
  const segRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const valueRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtextRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep track of current numeric values for smooth interpolations
  const curValuesRef = useRef<number[]>([0, 0, 0, 0]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  // Format helper for Indian numeric notation
  const formatNum = (idx: number, val: number) => {
    if (idx === 3) return val.toFixed(1) + "%";
    return new Intl.NumberFormat("en-IN").format(Math.round(val));
  };

  // Position sliding indicator with GSAP spring
  const placeIndicator = (animate: boolean = true) => {
    if (!segRef.current || !indRef.current) return;
    const activeBtn = segRef.current.querySelector<HTMLButtonElement>("button.on");
    if (!activeBtn) return;

    const vars = { x: activeBtn.offsetLeft, width: activeBtn.offsetWidth };
    if (animate) {
      gsap.to(indRef.current, { ...vars, duration: 0.55, ease: "back.out(1.4)" });
    } else {
      gsap.set(indRef.current, vars);
    }
  };

  // Slower, eye-catching counter animation
  const animateCounters = (targetPeriod: PeriodKey, isFirst: boolean) => {
    const p = PERIODS[targetPeriod];

    // Kill any active tweens
    tweensRef.current.forEach((t) => t.kill());
    tweensRef.current = [];

    p.cur.forEach((targetVal, i) => {
      const el = valueRefs.current[i];
      if (!el) return;

      const fromVal = curValuesRef.current[i];
      const obj = { v: fromVal };

      const dur = isFirst ? 2.4 : 1.3;
      const delay = isFirst ? 0.45 : 0;

      const tw = gsap.to(obj, {
        v: targetVal,
        duration: dur,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          curValuesRef.current[i] = obj.v;
          el.textContent = formatNum(i, obj.v);
        },
      });

      tweensRef.current.push(tw);
    });

    // Subtext transition on tab switch
    if (!isFirst) {
      subtextRefs.current.forEach((el) => {
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
          );
        }
      });
    }
  };

  // Initial load
  useEffect(() => {
    if (!isReady) return;
    placeIndicator(false);
    animateCounters("week", true);

    return () => {
      tweensRef.current.forEach((t) => t.kill());
    };
  }, [isReady]);

  const handlePeriodChange = (pk: PeriodKey) => {
    if (pk === period) return;
    setPeriod(pk);
    requestAnimationFrame(() => {
      placeIndicator(true);
      animateCounters(pk, false);
    });
  };

  const pData = PERIODS[period];

  return (
    <section>
      <div className="sec-head">
        <h2>Overview performance</h2>

        {/* Segmented Period Tabs with sliding indicator */}
        <div className="seg" id="seg" ref={segRef} role="tablist" aria-label="Performance Period">
          <span className="seg-ind" id="segInd" ref={indRef} />
          {(["day", "week", "month", "year"] as PeriodKey[]).map((pk) => {
            const isSelected = period === pk;
            return (
              <button
                key={pk}
                type="button"
                className={isSelected ? "on" : ""}
                onClick={() => handlePeriodChange(pk)}
                role="tab"
                aria-selected={isSelected}
              >
                {pk.charAt(0).toUpperCase() + pk.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Cell Metric Grid with subtle hover interactions */}
      <div className="card stats" id="stats" style={{ transition: "box-shadow 0.3s ease" }}>
        {STAT_TITLES.map((title, i) => {
          const prevVal =
            i === 3
              ? pData.prev[i].toFixed(1) + "%"
              : new Intl.NumberFormat("en-IN").format(pData.prev[i]);
          return (
            <div
              key={title}
              className="cell"
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              style={{ transition: "background-color 0.25s ease" }}
            >
              <div className="k">{title}</div>
              <div
                className="v"
                ref={(el) => {
                  valueRefs.current[i] = el;
                }}
              >
                0
              </div>
              <div
                className="s"
                ref={(el) => {
                  subtextRefs.current[i] = el;
                }}
              >
                From last {prevVal} ({pData.tag})
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
