"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import Sidebar from "./Sidebar";
import Header from "./Header";
import UpgradeBanner from "./UpgradeBanner";
import OverviewPerformance from "./OverviewPerformance";
import VerifiedValueChart from "./VerifiedValueChart";
import AdvisorCard from "./AdvisorCard";
import FdrStatusCard from "./FdrStatusCard";
import RecentActivitiesCard from "./RecentActivitiesCard";
import { ChatIcon, MenuIcon, ShieldIcon } from "./Icons";
import PageLoader from "@/components/loading-ui/PageLoader";
import "./dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll and animate mobile drawer content whenever it opens
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      const sideEl = document.getElementById("side");
      if (sideEl) {
        const items = sideEl.querySelectorAll(".ws, .search, #nav > *:not(.hl), .sec, .side-bottom");
        if (items.length) {
          gsap.fromTo(
            items,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.45, stagger: 0.03, ease: "power2.out", delay: 0.08 }
          );
        }
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Master GSAP Intro Sequence & Button Micro-Interactions (Cinematic & Eye-Catching)
  useEffect(() => {
    if (isLoading || !rootRef.current) return;
    const G = gsap;

    // Master Entrance Timeline with deliberate, luxurious pacing
    const tl = G.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });

    tl.fromTo(
      ".side-in",
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.1 }
    )
      .fromTo(
        ".brand-row, .ws, .search, .menu-label",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.65, stagger: 0.06 },
        0.18
      )
      .fromTo(
        "#nav > *:not(.hl)",
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, stagger: 0.04 },
        0.38
      )
      .fromTo(
        ".side-bottom",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75 },
        0.55
      )
      .fromTo(
        ".banner",
        { y: -24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85 },
        0.5
      )
      .fromTo(
        ".sec-head, .rev-head",
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.12 },
        0.65
      )
      .fromTo(
        "#stats",
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95 },
        0.75
      )
      .fromTo(
        ".cell",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, stagger: 0.1 },
        0.9
      )
      .fromTo(
        "#revCard",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95 },
        1.05
      )
      .fromTo(
        ".r-head",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.14 },
        0.85
      )
      .fromTo(
        ".adv, .list, .acts",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, stagger: 0.14 },
        0.95
      )
      .fromTo(
        ".act",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.08 },
        1.35
      )
      .fromTo(
        ".fab",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.75, ease: "back.out(2)" },
        1.3
      );

    // Interactive Button Micro-Animations (smooth hover lift & tap squeeze)
    const interactiveButtons = rootRef.current.querySelectorAll(
      ".btn-black, .pill-btn, .fab, .icon-btn, .select, .sq, .mobile-verify-cta, .hamburger-btn, .mobile-close-btn"
    );

    const cleanupFns: Array<() => void> = [];

    interactiveButtons.forEach((btn) => {
      const el = btn as HTMLElement;
      const onEnter = () => G.to(el, { y: -2.5, duration: 0.35, ease: "power2.out" });
      const onLeave = () => G.to(el, { y: 0, scale: 1, duration: 0.35, ease: "power2.out" });
      const onDown = () => G.to(el, { scale: 0.95, duration: 0.14 });
      const onUp = () => G.to(el, { scale: 1, duration: 0.3, ease: "back.out(3)" });

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);

      cleanupFns.push(() => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerup", onUp);
      });
    });

    // Card hover elevation interactions
    const cards = rootRef.current.querySelectorAll(".card");
    cards.forEach((card) => {
      const el = card as HTMLElement;
      const onEnter = () => G.to(el, { y: -2, boxShadow: "0 14px 34px rgba(0,0,0,0.06)", duration: 0.35, ease: "power2.out" });
      const onLeave = () => G.to(el, { y: 0, boxShadow: "none", duration: 0.35, ease: "power2.out" });

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);

      cleanupFns.push(() => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      });
    });

    return () => {
      tl.kill();
      cleanupFns.forEach((fn) => fn());
    };
  }, [isLoading]);

  // Animated Sidebar Collapse / Expand with GSAP
  const isCollapsedRef = useRef(false);

  const handleToggleCollapse = () => {
    const side = document.getElementById("side");
    const nav = document.getElementById("nav");
    const hl = document.getElementById("hl");
    if (!side) return;

    isCollapsedRef.current = !isCollapsedRef.current;
    const isNowCollapsed = isCollapsedRef.current;
    setCollapsed(isNowCollapsed);

    const hideEls = document.querySelectorAll(
      ".hide-c, .lbl, .menu-label, .sec .plus, .sec .chev"
    );

    const placeHL = () => {
      if (!nav || !hl) return;
      const activeEl = nav.querySelector<HTMLElement>(".nav-item.active");
      if (!activeEl) return;
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      gsap.set(hl, { y: itemRect.top - navRect.top + nav.scrollTop, height: itemRect.height });
    };

    if (isNowCollapsed) {
      // Fold open submenus first
      document.querySelectorAll(".nav-item.has-sub.open").forEach((el) => el.classList.remove("open"));
      document.querySelectorAll(".sub").forEach((sub) => gsap.to(sub, { height: 0, duration: 0.3 }));
      document.querySelectorAll(".nav-item .chev").forEach((chev) => gsap.to(chev, { rotation: 0, duration: 0.3 }));

      // Fade out labels
      gsap.to(hideEls, { opacity: 0, duration: 0.22, ease: "power2.out" });

      // Smoothly animate width to 76
      gsap.to(side, {
        width: 76,
        duration: 0.65,
        ease: "power3.inOut",
        onUpdate: placeHL,
        onComplete: () => {
          side.classList.add("collapsed");
          placeHL();
        },
      });

      // Rotate collapse button icon
      gsap.to("#collapse svg, .collapse-icon", {
        rotation: 180,
        duration: 0.55,
        ease: "power3.inOut",
      });
    } else {
      // Remove collapsed class immediately so elements are in DOM with opacity 0
      side.classList.remove("collapsed");
      gsap.set(hideEls, { opacity: 0 });

      // Smoothly animate width to 248
      gsap.to(side, {
        width: 248,
        duration: 0.65,
        ease: "power3.inOut",
        onUpdate: placeHL,
        onComplete: placeHL,
      });

      // Fade labels back in gracefully
      gsap.to(hideEls, { opacity: 1, duration: 0.4, delay: 0.28, ease: "power2.out" });

      // Rotate collapse button icon back to 0
      gsap.to("#collapse svg, .collapse-icon", {
        rotation: 0,
        duration: 0.55,
        ease: "power3.inOut",
      });
    }
  };

  const handleVerifyClick = () => {
    alert("Open FDR Verification Modal / File Upload");
  };

  const handleFabClick = () => {
    alert("Open AI Regulatory Sentinel Assistant");
  };

  return (
    <div ref={rootRef} className="dashboard-app">
      {/* Mobile Top Navigation Bar (Visible only on <= 900px) */}
      <header className="mobile-top-bar">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar menu"
          title="Open menu"
        >
          <MenuIcon size={20} />
        </button>

        <div className="mobile-brand">
          <img
            src="/logo.png"
            alt="NidhiSetu"
            className="mobile-brand-logo"
          />
          <span className="mobile-brand-name">NidhiSetu</span>
        </div>

        <button
          type="button"
          className="mobile-verify-cta"
          onClick={handleVerifyClick}
          aria-label="Verify FDR"
          title="Verify FDR"
        >
          <ShieldIcon size={14} />
          <span>Verify</span>
        </button>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`mobile-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Collapsible Left Navigation Sidebar (Desktop sticky, Mobile/Tablet slide-over drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Dashboard Canvas */}
      <main className="main">
        <div className="wrap">
          {/* Header */}
          <Header onVerifyClick={handleVerifyClick} />

          {/* Dismissible Upgrade Banner */}
          <UpgradeBanner />

          {/* 2-Column Responsive Dashboard Layout */}
          <div className="grid">
            {/* Left Primary Section */}
            <section>
              <OverviewPerformance isReady={!isLoading} />
              <VerifiedValueChart isReady={!isLoading} />
            </section>

            {/* Right Sentinel & Activity Section */}
            <aside>
              <AdvisorCard />
              <FdrStatusCard />
              <RecentActivitiesCard />
            </aside>
          </div>
        </div>
      </main>

      {/* Page Switching & Initial Load Twin-Orbit Animation */}
      {isLoading && (
        <PageLoader
          text="Authorizing Sentinel Session..."
          subtext="AICTE Cryptographic FDR Ledger Synchronization"
          minDuration={1100}
          onFinish={() => setIsLoading(false)}
        />
      )}

      {/* Floating Regulatory Sentinel AI Assistant Button */}
      <button
        type="button"
        className="fab"
        onClick={handleFabClick}
        aria-label="Open AI Regulatory Sentinel Chat"
        title="AI Regulatory Sentinel Chat"
      >
        <ChatIcon size={19} />
      </button>
    </div>
  );
}
