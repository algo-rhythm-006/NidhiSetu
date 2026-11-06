"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { DownIcon, DotsIcon } from "./Icons";
import type { TimeRangeKey, ChartDataRange } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VALS = [281.2, 300.4, 349.8, 281.9, 283.3, 285.1, 328.6, 327.2, 387.54, 335.4, 354.9, 377.8];

const DATA: Record<TimeRangeKey, ChartDataRange> = {
  "Last Year": { labels: MONTHS, v: VALS, base: 270 },
  "Last 6 Months": { labels: MONTHS.slice(6), v: VALS.slice(6), base: 285.1 },
  "Last 3 Months": { labels: MONTHS.slice(9), v: VALS.slice(9), base: 387.54 },
};

function formatINR(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

interface VerifiedValueChartProps {
  isReady?: boolean;
}

export default function VerifiedValueChart({ isReady = true }: VerifiedValueChartProps) {
  const [rangeKey, setRangeKey] = useState<TimeRangeKey>("Last Year");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(() => {
    const maxVal = Math.max(...VALS);
    const maxI = VALS.indexOf(maxVal);
    return maxI >= 0 ? maxI : VALS.length - 1;
  });

  const isInitialMount = useRef(true);
  const totalElRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const barsGroupRef = useRef<SVGGElement>(null);
  const vlineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectChevRef = useRef<HTMLSpanElement>(null);

  const [chartWidth, setChartWidth] = useState(620);
  const chartHeight = 150;
  const padding = 12;

  const currentData = DATA[rangeKey];
  const n = currentData.v.length;

  // Responsive chart width
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute total sum and animate counter with GSAP directly to DOM text
  const totalSum = useMemo(() => {
    return currentData.v.reduce((a, b) => a + b, 0) * 100000;
  }, [currentData]);

  useEffect(() => {
    if (!isReady || !totalElRef.current) return;
    const isFirst = isInitialMount.current;
    const targetEl = totalElRef.current;
    const obj = { val: 0 };

    // Slower, eye-catching counter deceleration
    const tween = gsap.to(obj, {
      val: totalSum,
      duration: isFirst ? 2.2 : 1.4,
      delay: isFirst ? 0.4 : 0,
      ease: "power2.out",
      onUpdate: () => {
        targetEl.textContent = formatINR(obj.val);
      },
    });

    return () => {
      tween.kill();
    };
  }, [isReady, totalSum]);

  // Points coordinates mathematically calculated across available width
  const { xs, ys, points, dstr } = useMemo(() => {
    const W = chartWidth;
    const H = chartHeight;
    const pad = padding;
    const seg = (W - pad * 2) / (n - 1 || 1);

    const calcXs = currentData.v.map((_, i) => pad + i * seg);
    const calcYs = currentData.v.map((v) => H - (v / 400) * H);

    const pts = currentData.v.map((v, i) => ({
      x: calcXs[i],
      y: calcYs[i],
      v,
      label: currentData.labels[i],
    }));

    const pathD = calcXs.map((x, i) => (i ? "L" : "M") + x.toFixed(2) + " " + calcYs[i].toFixed(2)).join(" ");

    return { xs: calcXs, ys: calcYs, points: pts, dstr: pathD };
  }, [currentData, chartWidth, n]);

  // Set default active index to peak value
  useEffect(() => {
    const maxVal = Math.max(...currentData.v);
    const maxI = currentData.v.indexOf(maxVal);
    setActiveIdx(maxI >= 0 ? maxI : n - 1);
  }, [rangeKey, currentData]);

  // Exact linear interpolation yAt(x)
  const yAt = (x: number) => {
    const W = chartWidth;
    const pad = padding;
    const seg = (W - pad * 2) / (n - 1 || 1);
    const i = Math.min(n - 2, Math.max(0, Math.floor((x - pad) / seg)));
    const x0 = xs[i];
    const x1 = xs[i + 1] || x0;
    const t = x1 === x0 ? 0 : Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
    return ys[i] + (ys[i + 1] - ys[i]) * t;
  };

  // Generate vertical density bars every 3px from yAt(x) straight down to baseline y2 = chartHeight
  const barLines = useMemo(() => {
    const lines = [];
    const pad = padding;
    for (let x = pad; x <= chartWidth - pad; x += 3) {
      lines.push({ x, y1: yAt(x), y2: chartHeight });
    }
    return lines;
  }, [xs, ys, chartWidth]);

  // Animate the line drawing, sweeping bar wave, and tooltip popping with GSAP (eye-catchingly smooth & deliberate)
  useEffect(() => {
    if (!isReady || !lineRef.current) return;
    const line = lineRef.current;
    const len = line.getTotalLength ? line.getTotalLength() : 800;
    const isFirst = isInitialMount.current;

    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;

    const bars = barsGroupRef.current?.querySelectorAll("line");
    if (bars && bars.length) {
      bars.forEach((b) => {
        b.setAttribute("y1", String(chartHeight));
        b.removeAttribute("transform");
        b.style.transform = "";
      });
      gsap.set(bars, { opacity: 0 });
    }

    if (vlineRef.current) gsap.set(vlineRef.current, { opacity: 0 });
    if (dotRef.current) gsap.set(dotRef.current, { opacity: 0, scale: 0.5 });
    if (tipRef.current) gsap.set(tipRef.current, { opacity: 0, scale: 0.8 });

    const delay = isFirst ? 0.45 : 0.05;
    const tl = gsap.timeline({ delay });

    // Slower, dramatic line draw
    tl.to(line, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" }, 0);

    // Slower, hypnotic ripple across density bars growing from bottom baseline
    if (bars && bars.length) {
      tl.to(
        bars,
        {
          attr: {
            y1: (i: number) => (barLines[i] ? barLines[i].y1 : chartHeight),
          },
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          stagger: { amount: 1.6, from: "start" },
        },
        0.15
      );
    }

    if (vlineRef.current && dotRef.current) {
      tl.to(vlineRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.7)
        .to(dotRef.current, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2.5)" }, 1.8);
    }

    if (tipRef.current) {
      tl.to(tipRef.current, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, 1.85);
    }

    if (isFirst) {
      isInitialMount.current = false;
    }

    return () => {
      tl.kill();
    };
  }, [isReady, rangeKey, chartWidth]);

  // Tooltip details for active index
  const safeActiveIdx = Math.min(n - 1, Math.max(0, activeIdx));
  const activePt = points[safeActiveIdx] || points[points.length - 1] || { x: 500, y: 30, v: 387.54, label: "Sep" };
  const prevVal = safeActiveIdx > 0 ? currentData.v[safeActiveIdx - 1] : currentData.base;
  const pctDelta = prevVal > 0 ? ((activePt.v - prevVal) / prevVal) * 100 : 0;

  // Tooltip positioning coordinates (centered directly over active point)
  const tipWidth = 145;
  const tipHeight = 55;
  const tx = Math.min(chartWidth - tipWidth, Math.max(0, activePt.x - tipWidth / 2));
  const ty = Math.max(-55, activePt.y - tipHeight - 12);

  // Pointer move handler with smooth tracker animation
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let closest = 0;
    let minD = 1e9;
    xs.forEach((x, i) => {
      const d = Math.abs(x - px);
      if (d < minD) {
        minD = d;
        closest = i;
      }
    });

    if (closest !== activeIdx) {
      setActiveIdx(closest);
      const pt = points[closest];
      if (dotRef.current) {
        gsap.to(dotRef.current, { attr: { cx: pt.x, cy: pt.y }, duration: 0.4, ease: "power3.out" });
      }
      if (vlineRef.current) {
        gsap.to(vlineRef.current, { attr: { x1: pt.x, x2: pt.x, y1: pt.y, y2: chartHeight }, duration: 0.4, ease: "power3.out" });
      }
    }
  };

  // Eye-Catching GSAP Dropdown Menu Animation with Staggered Items & Rotating Chevron
  const toggleMenu = () => {
    if (!menuOpen) {
      setMenuOpen(true);
      if (selectChevRef.current) {
        gsap.to(selectChevRef.current, { rotation: 180, duration: 0.4, ease: "power3.out" });
      }
      requestAnimationFrame(() => {
        if (menuRef.current) {
          // Dropdown container entrance
          gsap.fromTo(
            menuRef.current,
            { opacity: 0, y: -14, scale: 0.92, transformOrigin: "100% 0%" },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }
          );

          // Stagger items inside the dropdown
          const items = menuRef.current.querySelectorAll("button");
          if (items.length) {
            gsap.fromTo(
              items,
              { opacity: 0, x: -10 },
              { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: "power2.out", delay: 0.1 }
            );
          }
        }
      });
    } else {
      if (selectChevRef.current) {
        gsap.to(selectChevRef.current, { rotation: 0, duration: 0.35, ease: "power3.inOut" });
      }
      if (menuRef.current) {
        gsap.to(menuRef.current, {
          opacity: 0,
          y: -8,
          scale: 0.95,
          duration: 0.28,
          ease: "power2.in",
          onComplete: () => setMenuOpen(false),
        });
      } else {
        setMenuOpen(false);
      }
    }
  };

  return (
    <div className="rev-head-wrap" style={{ marginTop: "30px" }}>
      <div className="rev-head">
        <h2>Verified Value</h2>

        <div className="rev-tools">
          <button
            type="button"
            className="select"
            onClick={toggleMenu}
            aria-label="Filter period"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
          >
            <span>{rangeKey}</span>
            <span ref={selectChevRef} className="i" style={{ display: "inline-flex", alignItems: "center" }}>
              <DownIcon size={12} />
            </span>
          </button>

          <button
            type="button"
            className="sq"
            onClick={() => alert("Chart preferences")}
            aria-label="More chart options"
          >
            <span className="i">
              <DotsIcon size={16} />
            </span>
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="menu"
              style={{
                opacity: 1,
                visibility: "visible",
                boxShadow: "0 18px 42px rgba(0, 0, 0, 0.16)",
                border: "1px solid #E8E8EA",
                borderRadius: "14px",
                padding: "6px",
              }}
            >
              {(["Last Year", "Last 6 Months", "Last 3 Months"] as TimeRangeKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={rangeKey === k ? "on" : ""}
                  onClick={() => {
                    setRangeKey(k);
                    setMenuOpen(false);
                    if (selectChevRef.current) {
                      gsap.to(selectChevRef.current, { rotation: 0, duration: 0.3 });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    borderRadius: "9px",
                    fontWeight: rangeKey === k ? 600 : 500,
                  }}
                >
                  <span>{k}</span>
                  {rangeKey === k && (
                    <span style={{ fontSize: "12px", color: "#2E9B4A" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card rev-card" id="revCard" style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
        <div className="k">Total FDR Value Verified</div>
        <div className="big" id="total" ref={totalElRef}>
          ₹0
        </div>
        <div className="sub2" id="gain">
          You verified <b>+{formatINR(currentData.v[currentData.v.length - 1] * 100000)}</b> this month
        </div>

        {/* Chart Area */}
        <div className="chart">
          {/* Y-Axis Labels */}
          <div className="yax" id="yax">
            {[400, 300, 200, 100, 0].map((v) => (
              <span key={v} style={{ top: `${(1 - v / 400) * 100}%` }}>
                {v}
              </span>
            ))}
          </div>

          {/* Plot Surface */}
          <div className="plotwrap" id="plotwrap">
            <div
              ref={containerRef}
              id="plot"
              style={{ height: chartHeight }}
              onPointerMove={handlePointerMove}
            >
              <svg width={chartWidth} height={chartHeight} style={{ overflow: "visible", display: "block" }}>
                {/* Vertical density bars */}
                <g ref={barsGroupRef}>
                  {barLines.map((l, i) => (
                    <line
                      key={i}
                      x1={l.x}
                      x2={l.x}
                      y1={l.y1}
                      y2={l.y2}
                      stroke="#CBCBCF"
                      strokeWidth={1}
                    />
                  ))}
                </g>

                {/* Primary Trend Line */}
                <path
                  ref={lineRef}
                  d={dstr}
                  fill="none"
                  stroke="#111111"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active Indicator Line & Dot with Soft Glow */}
                {activePt && (
                  <>
                    <line
                      ref={vlineRef}
                      x1={activePt.x}
                      x2={activePt.x}
                      y1={activePt.y}
                      y2={chartHeight}
                      stroke="#111111"
                      strokeWidth={1.5}
                    />
                    <circle
                      ref={dotRef}
                      cx={activePt.x}
                      cy={activePt.y}
                      r={5.5}
                      fill="#ffffff"
                      stroke="#111111"
                      strokeWidth={2.5}
                    />
                  </>
                )}
              </svg>

              {/* Floating Tooltip */}
              {activePt && (
                <div
                  ref={tipRef}
                  id="tip"
                  style={{
                    left: `${tx}px`,
                    top: `${ty}px`,
                    transform: "none",
                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.14)",
                    borderRadius: "14px",
                    transition: "left 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), top 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)",
                  }}
                >
                  <small id="tDate">24 {activePt.label} 2025</small>
                  <div className="row">
                    <b id="tVal">{formatINR(activePt.v * 100000)}</b>
                    <span className={`d ${pctDelta < 0 ? "neg" : ""}`} id="tDelta">
                      {pctDelta >= 0 ? "+" : "−"}
                      {Math.abs(pctDelta).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div id="xl">
              {points.map((p, i) => (
                <span key={i} style={{ left: `${p.x}px` }}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
