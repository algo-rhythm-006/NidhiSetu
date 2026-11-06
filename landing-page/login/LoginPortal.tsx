"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import LoginVisual from "./LoginVisual";
import PageLoader from "@/components/loading-ui/PageLoader";
import "./login.css";

export type RoleType = "college" | "official" | "admin";

interface RoleConfig {
  key: RoleType;
  name: string;
  badge: string;
  titlePrimary: string;
  titleAccent: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitText: string;
}

const ROLES: Record<RoleType, RoleConfig> = {
  college: {
    key: "college",
    name: "College",
    badge: "AICTE Regulatory Oversight · Secure Auth",
    titlePrimary: "College",
    titleAccent: "Portal",
    subtitle: "Centralized FDR registry access, deposit verification, and automated renewal workflows.",
    emailLabel: "Institutional Email",
    emailPlaceholder: "principal@institution.edu.in",
    submitText: "Sign in to College Portal",
  },
  official: {
    key: "official",
    name: "Official",
    badge: "AICTE Regulatory Sentinel · Forensic Console",
    titlePrimary: "Official",
    titleAccent: "Sentinel",
    subtitle: "Forensic verification console for AICTE scrutiny officers and regulatory inspectors.",
    emailLabel: "Official Government Email",
    emailPlaceholder: "officer.sentinel@aicte.gov.in",
    submitText: "Authorize Sentinel Session",
  },
  admin: {
    key: "admin",
    name: "Admin",
    badge: "AICTE Root Governance · Restricted Access",
    titlePrimary: "Administrator",
    titleAccent: "Terminal",
    subtitle: "Directorate oversight, sentinel configuration, root governance, and audit ledger.",
    emailLabel: "Directorate Admin Email",
    emailPlaceholder: "admin.directorate@aicte.gov.in",
    submitText: "Enter Directorate Terminal",
  },
};

const ROLE_KEYS: RoleType[] = ["college", "official", "admin"];

interface LoginPortalProps {
  initialRole?: RoleType | "professional";
}

export default function LoginPortal({ initialRole = "college" }: LoginPortalProps) {
  const router = useRouter();

  // Normalize initialRole to one of the 3 supported role types
  const normalizedInitialRole: RoleType = useMemo(() => {
    if (initialRole === "official" || initialRole === "professional") return "official";
    if (initialRole === "admin") return "admin";
    return "college";
  }, [initialRole]);

  const [role, setRole] = useState<RoleType>(normalizedInitialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSwitchingPage, setIsSwitchingPage] = useState(false);

  const pageRootRef = useRef<HTMLDivElement>(null);
  const formBoxRef = useRef<HTMLDivElement>(null);
  const currentRole = ROLES[role];

  // Sync role if initialRole prop updates
  useEffect(() => {
    setRole(normalizedInitialRole);
  }, [normalizedInitialRole]);

  // Smooth micro-transition when role is switched
  const switchRole = (newRole: RoleType) => {
    if (newRole === role) return;
    setRole(newRole);
    if (typeof window !== "undefined") {
      // Use replaceState preserving state to avoid polluting history stack and keep Next.js router in sync
      window.history.replaceState(window.history.state, "", `/login/${newRole}`);
    }

    if (formBoxRef.current) {
      const animEls = formBoxRef.current.querySelectorAll(".anim-target");
      if (animEls.length) {
        gsap.fromTo(
          animEls,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.03, ease: "power2.out" }
        );
      }
    }
  };

  // Initial mount subtle entrance & bfcache back-navigation restore
  useEffect(() => {
    // Always guarantee full opacity and active state on mount or back navigation
    if (pageRootRef.current) {
      pageRootRef.current.style.opacity = "1";
    }
    setSubmitting(false);
    setIsSwitchingPage(false);

    // Sync role with URL pathname if back/forward button was used
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p.includes("official")) setRole("official");
      else if (p.includes("admin")) setRole("admin");
      else if (p.includes("college")) setRole("college");
    }

    const handleRestore = () => {
      if (pageRootRef.current) {
        pageRootRef.current.style.opacity = "1";
      }
      setSubmitting(false);
      setIsSwitchingPage(false);
      if (typeof window !== "undefined") {
        const p = window.location.pathname;
        if (p.includes("official")) setRole("official");
        else if (p.includes("admin")) setRole("admin");
        else if (p.includes("college")) setRole("college");
      }
    };

    window.addEventListener("pageshow", handleRestore);
    window.addEventListener("popstate", handleRestore);

    if (formBoxRef.current) {
      const animEls = formBoxRef.current.querySelectorAll(".anim-target");
      if (animEls.length) {
        gsap.fromTo(
          animEls,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: "power3.out", delay: 0.05 }
        );
      }
    }

    return () => {
      window.removeEventListener("pageshow", handleRestore);
      window.removeEventListener("popstate", handleRestore);
    };
  }, []);

  // Form submission: launch page loader before navigating to dashboard
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isSwitchingPage) return;
    setSubmitting(true);
    setIsSwitchingPage(true);
  };

  const handleGoogleSignIn = () => {
    if (submitting || isSwitchingPage) return;
    setSubmitting(true);
    setIsSwitchingPage(true);
  };

  return (
    <div ref={pageRootRef} className="login-page-root">
      {/* LEFT COLUMN: Header, Form & Footer */}
      <div className="login-left-col">
        {/* Top Header Bar */}
        <header className="login-header-bar">
          <Link href="/" className="login-logo-link" title="Back to NidhiSetu Home">
            NidhiSetu
          </Link>

          {/* Desktop Role Toggle Pills */}
          <div className="login-role-pills">
            {ROLE_KEYS.map((k) => {
              const isActive = k === role;
              return (
                <button
                  key={k}
                  type="button"
                  className={`login-role-tab ${isActive ? "active" : ""}`}
                  onClick={() => switchRole(k)}
                >
                  {ROLES[k].name}
                </button>
              );
            })}
          </div>

          {/* Mobile Role Dropdown */}
          <div className="login-role-mobile">
            <button
              type="button"
              className="login-mobile-select-btn"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle role menu"
            >
              <span>{currentRole.name}</span>
              <span className={`chev ${mobileMenuOpen ? "open" : ""}`}>▼</span>
            </button>
            {mobileMenuOpen && (
              <div className="login-mobile-dropdown">
                {ROLE_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`login-mobile-dropdown-item ${k === role ? "active" : ""}`}
                    onClick={() => {
                      switchRole(k);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>{ROLES[k].name}</span>
                    {k === role && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Centered Form Section */}
        <main className="login-main-section">
          <div ref={formBoxRef} className="login-form-box">
            {/* Regulatory Badge */}
            <div className="login-badge anim-target">
              <span className="badge-dot" />
              <span>{currentRole.badge}</span>
            </div>

            {/* Portal Heading */}
            <h1 className="login-title anim-target">
              {currentRole.titlePrimary} <span className="title-accent">{currentRole.titleAccent}</span>
            </h1>

            {/* Subtitle */}
            <p className="login-subtitle anim-target">{currentRole.subtitle}</p>

            {/* Just Email and Password */}
            <form onSubmit={handleSubmit} className="login-form-el">
              {/* Email Field */}
              <div className="login-field anim-target">
                <label className="field-label">{currentRole.emailLabel}</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    placeholder={currentRole.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-field anim-target">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter institutional password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Row: Keep signed in & Forgot password */}
              <div className="login-aux-row anim-target">
                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password recovery instructions dispatched to registered institution administrator.");
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Solid Black Submit Pill with ↗ on right */}
              <button
                type="submit"
                className="login-submit-pill anim-target"
                disabled={submitting}
              >
                <span className="submit-label">
                  {submitting ? "Signing in..." : currentRole.submitText}
                </span>
                <span className="submit-arrow-circle">↗</span>
              </button>

              {/* Divider */}
              <div className="login-divider anim-target">
                <span>or continue with</span>
              </div>

              {/* Sign in with Google */}
              <button
                type="button"
                className="login-google-btn anim-target"
                onClick={handleGoogleSignIn}
                disabled={submitting}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </form>

            {/* Institutional Register Prompt */}
            <p className="login-register-prompt anim-target">
              Need institutional onboarding?{" "}
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  alert("AICTE Institutional Onboarding portal opening.");
                }}
              >
                Register here
              </a>
            </p>
          </div>
        </main>

        {/* Bottom Footer */}
        <footer className="login-bottom-bar">
          <span>© 2026 NidhiSetu · AI Sentinel Protected</span>
        </footer>
      </div>

      {/* RIGHT COLUMN: The Image Card (Clean, a bit smaller than half, rounded, no circles) */}
      <div className="login-right-col">
        <div
          className="login-image-card"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            maxHeight: "calc(100vh - 36px)",
            borderRadius: "28px",
            overflow: "hidden",
            backgroundColor: "#04040A",
            boxShadow: "0 18px 48px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          <LoginVisual role={role} />
        </div>
      </div>

      {/* Page Switching Twin Orbit Loader */}
      {isSwitchingPage && (
        <PageLoader
          text={`Authorizing ${currentRole.name} Session...`}
          subtext="Cryptographic Keyring Handshake with AICTE Sentinel"
          minDuration={1000}
          onFinish={() => {
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}
