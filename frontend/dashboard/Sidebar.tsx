"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  HomeIcon,
  ListIcon,
  ShieldIcon,
  UsersIcon,
  PinIcon,
  ChartIcon,
  GridIcon,
  EyeOffIcon,
  LinkIcon,
  BagIcon,
  GearIcon,
  LogoutIcon,
  SearchIcon,
  DownIcon,
  UpDownIcon,
  PlusIcon,
  CollapseIcon,
  CloseIcon,
} from "./Icons";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const WORKSPACES = [
  "Main Workspace",
  "AICTE Central Sentinel",
  "Regional Scrutiny Cell",
  "Institutional Registry Hub",
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [selectedWs, setSelectedWs] = useState("Main Workspace");
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navRef = useRef<HTMLElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const isInitialRef = useRef(true);

  const wsMenuRef = useRef<HTMLDivElement>(null);
  const wsChevRef = useRef<HTMLSpanElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userChevRef = useRef<HTMLSpanElement>(null);

  // Position floating highlight pill
  useEffect(() => {
    if (!navRef.current || !hlRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>(".nav-item.active");
    if (!activeEl) return;

    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const y = itemRect.top - navRect.top + navRef.current.scrollTop;

    if (isInitialRef.current) {
      gsap.set(hlRef.current, { y, height: itemRect.height });
      isInitialRef.current = false;
    } else {
      gsap.to(hlRef.current, {
        y,
        height: itemRect.height,
        duration: 0.45,
        ease: "power3.out",
      });
    }
  }, [activeTab, collapsed]);

  // Submenu toggle with smooth height and child stagger
  const toggleSubmenu = (btn: HTMLElement) => {
    const sub = btn.nextElementSibling as HTMLElement;
    const chev = btn.querySelector(".chev") as HTMLElement;
    const isOpen = btn.classList.toggle("open");

    if (sub) {
      if (isOpen) {
        gsap.to(sub, {
          height: "auto",
          duration: 0.5,
          ease: "power3.inOut",
          onUpdate: () => {
            if (!navRef.current || !hlRef.current) return;
            const activeEl = navRef.current.querySelector<HTMLElement>(".nav-item.active");
            if (!activeEl) return;
            const navRect = navRef.current.getBoundingClientRect();
            const itemRect = activeEl.getBoundingClientRect();
            gsap.set(hlRef.current, { y: itemRect.top - navRect.top + navRef.current.scrollTop });
          },
        });

        // Stagger child links
        const links = sub.querySelectorAll("button, a");
        if (links.length) {
          gsap.fromTo(
            links,
            { x: -10, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out", delay: 0.1 }
          );
        }
      } else {
        gsap.to(sub, {
          height: 0,
          duration: 0.4,
          ease: "power3.inOut",
          onUpdate: () => {
            if (!navRef.current || !hlRef.current) return;
            const activeEl = navRef.current.querySelector<HTMLElement>(".nav-item.active");
            if (!activeEl) return;
            const navRect = navRef.current.getBoundingClientRect();
            const itemRect = activeEl.getBoundingClientRect();
            gsap.set(hlRef.current, { y: itemRect.top - navRect.top + navRef.current.scrollTop });
          },
        });
      }
    }
    if (chev) {
      gsap.to(chev, {
        rotation: isOpen ? 180 : 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }
  };

  const toggleSection = (sec: HTMLElement, bodyId: string) => {
    const body = document.getElementById(bodyId);
    const chev = sec.querySelector(".chev") as HTMLElement;
    const closed = sec.classList.toggle("closed");

    if (body) {
      gsap.to(body, {
        height: closed ? 0 : "auto",
        duration: 0.45,
        ease: "power3.inOut",
        onUpdate: () => {
          if (!navRef.current || !hlRef.current) return;
          const activeEl = navRef.current.querySelector<HTMLElement>(".nav-item.active");
          if (!activeEl) return;
          const navRect = navRef.current.getBoundingClientRect();
          const itemRect = activeEl.getBoundingClientRect();
          gsap.set(hlRef.current, { y: itemRect.top - navRect.top + navRef.current.scrollTop });
        },
      });
    }
    if (chev) {
      gsap.to(chev, {
        rotation: closed ? -90 : 0,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  };

  // Toggle Workspace Dropdown
  const handleToggleWsDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (collapsed) {
      onToggleCollapse();
      return;
    }
    if (!wsDropdownOpen) {
      setWsDropdownOpen(true);
      if (wsChevRef.current) {
        gsap.to(wsChevRef.current, { rotation: 180, duration: 0.4, ease: "power3.out" });
      }
      requestAnimationFrame(() => {
        if (wsMenuRef.current) {
          gsap.fromTo(
            wsMenuRef.current,
            { opacity: 0, y: -12, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }
          );
          const items = wsMenuRef.current.querySelectorAll("button");
          if (items.length) {
            gsap.fromTo(
              items,
              { x: -10, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out", delay: 0.08 }
            );
          }
        }
      });
    } else {
      if (wsChevRef.current) {
        gsap.to(wsChevRef.current, { rotation: 0, duration: 0.35, ease: "power3.inOut" });
      }
      if (wsMenuRef.current) {
        gsap.to(wsMenuRef.current, {
          opacity: 0,
          y: -8,
          scale: 0.96,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => setWsDropdownOpen(false),
        });
      } else {
        setWsDropdownOpen(false);
      }
    }
  };

  // Toggle User Profile Dropdown
  const handleToggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (collapsed) {
      onToggleCollapse();
      return;
    }
    if (!userDropdownOpen) {
      setUserDropdownOpen(true);
      if (userChevRef.current) {
        gsap.to(userChevRef.current, { rotation: 180, duration: 0.4, ease: "power3.out" });
      }
      requestAnimationFrame(() => {
        if (userMenuRef.current) {
          gsap.fromTo(
            userMenuRef.current,
            { opacity: 0, y: 12, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }
          );
          const items = userMenuRef.current.querySelectorAll("button, a");
          if (items.length) {
            gsap.fromTo(
              items,
              { x: -10, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out", delay: 0.08 }
            );
          }
        }
      });
    } else {
      if (userChevRef.current) {
        gsap.to(userChevRef.current, { rotation: 0, duration: 0.35, ease: "power3.inOut" });
      }
      if (userMenuRef.current) {
        gsap.to(userMenuRef.current, {
          opacity: 0,
          y: 8,
          scale: 0.96,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => setUserDropdownOpen(false),
        });
      } else {
        setUserDropdownOpen(false);
      }
    }
  };

  return (
    <aside className={`side ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`} id="side">
      <div className="side-in">
        {/* Brand Row */}
        <div className="brand-row">
          <div
            className="brand"
            id="brand"
            title={collapsed ? "Click to expand sidebar" : "NidhiSetu"}
            onClick={() => {
              if (collapsed) onToggleCollapse();
            }}
            style={{ cursor: collapsed ? "pointer" : "default" }}
          >
            <span className="logo">
              <img
                src="/logo.png"
                alt="NidhiSetu"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </span>
            <span className="brand-name hide-c">NidhiSetu</span>
          </div>

          <button
            type="button"
            className="icon-btn hide-c desktop-collapse-btn"
            id="collapse"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <CollapseIcon size={15} />
          </button>

          {onCloseMobile && (
            <button
              type="button"
              className="icon-btn mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Workspace Selector Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ws"
            title="Switch Workspace"
            onClick={handleToggleWsDropdown}
          >
            <span className="ws-ic">
              <BagIcon size={18} />
            </span>
            <span className="ws-name hide-c">{selectedWs}</span>
            <span ref={wsChevRef} className="ws-chev hide-c" style={{ display: "inline-flex" }}>
              <UpDownIcon size={14} />
            </span>
          </button>

          {wsDropdownOpen && !collapsed && (
            <div
              ref={wsMenuRef}
              style={{
                position: "absolute",
                top: "48px",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #E8E8EA",
                padding: "6px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.14)",
              }}
            >
              <div style={{ padding: "6px 8px", fontSize: "11px", color: "#8E8E93", fontWeight: 600 }}>
                SELECT WORKSPACE
              </div>
              {WORKSPACES.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setSelectedWs(w);
                    setWsDropdownOpen(false);
                    if (wsChevRef.current) gsap.to(wsChevRef.current, { rotation: 0, duration: 0.3 });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: selectedWs === w ? 600 : 500,
                    background: selectedWs === w ? "#F3F3F4" : "transparent",
                    color: "#101010",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>{w}</span>
                  {selectedWs === w && <span style={{ color: "#2E9B4A", fontSize: "12px" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div
          className="search"
          title="Search (⌘ K)"
          onClick={() => {
            if (collapsed) onToggleCollapse();
          }}
        >
          <SearchIcon size={17} />
          <span className="hide-c">Search</span>
          <kbd className="hide-c">⌘ K</kbd>
        </div>

        <div className="menu-label hide-c">Menu</div>

        {/* Navigation List */}
        <nav id="nav" ref={navRef}>
          {/* Active Highlight Pill */}
          <span className="hl" id="hl" ref={hlRef} />

          {/* Home */}
          <button
            type="button"
            className={`nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => handleSelectTab("home")}
          >
            <HomeIcon size={18} />
            <span className="lbl">Home</span>
          </button>

          {/* FDR Records Submenu */}
          <button
            type="button"
            className={`nav-item has-sub ${activeTab.startsWith("fdr") ? "active" : ""}`}
            onClick={(e) => {
              if (collapsed) {
                onToggleCollapse();
              } else {
                toggleSubmenu(e.currentTarget);
              }
            }}
          >
            <ListIcon size={18} />
            <span className="lbl">FDR Records</span>
            <span className="chev">
              <DownIcon size={13} />
            </span>
          </button>
          <div className="sub">
            <button type="button" onClick={() => handleSelectTab("all-fdrs")}>All FDRs</button>
            <button type="button" onClick={() => handleSelectTab("upload-fdr")}>Upload FDR</button>
            <button type="button" onClick={() => handleSelectTab("archived")}>Archived</button>
          </div>

          {/* Verifications Submenu */}
          <button
            type="button"
            className={`nav-item has-sub ${activeTab.startsWith("verif") ? "active" : ""}`}
            onClick={(e) => {
              if (collapsed) {
                onToggleCollapse();
              } else {
                toggleSubmenu(e.currentTarget);
              }
            }}
          >
            <ShieldIcon size={18} />
            <span className="lbl">Verifications</span>
            <span className="chev">
              <DownIcon size={13} />
            </span>
          </button>
          <div className="sub">
            <button type="button" onClick={() => handleSelectTab("pending")}>Pending</button>
            <button type="button" onClick={() => handleSelectTab("verified")}>Verified</button>
            <button type="button" onClick={() => handleSelectTab("flagged")}>Flagged</button>
          </div>

          {/* Clients */}
          <button
            type="button"
            className={`nav-item ${activeTab === "clients" ? "active" : ""}`}
            onClick={() => handleSelectTab("clients")}
          >
            <UsersIcon size={18} />
            <span className="lbl">Clients</span>
          </button>

          {/* Alerts */}
          <button
            type="button"
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => handleSelectTab("alerts")}
          >
            <PinIcon size={18} />
            <span className="lbl">Alerts</span>
          </button>

          {/* Analytics */}
          <button
            type="button"
            className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => handleSelectTab("analytics")}
          >
            <ChartIcon size={18} />
            <span className="lbl">Analytics</span>
          </button>

          {/* Integrations Header */}
          <div
            className="sec"
            onClick={(e) => {
              if (collapsed) {
                onToggleCollapse();
                return;
              }
              if ((e.target as HTMLElement).closest(".plus")) return;
              toggleSection(e.currentTarget, "g1");
            }}
          >
            <span className="chev">
              <DownIcon size={12} />
            </span>
            <span className="lbl">Integrations</span>
            <button
              type="button"
              className="plus"
              aria-label="Add Integration"
              onClick={(e) => {
                e.stopPropagation();
                alert("Add Bank API integration");
              }}
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <div className="gbody" id="g1">
            <button
              type="button"
              className={`nav-item ${activeTab === "bank-apis" ? "active" : ""}`}
              onClick={() => handleSelectTab("bank-apis")}
            >
              <GridIcon size={17} />
              <span className="lbl">Bank APIs</span>
            </button>
          </div>

          {/* Channels Header */}
          <div
            className="sec"
            onClick={(e) => {
              if (collapsed) {
                onToggleCollapse();
                return;
              }
              if ((e.target as HTMLElement).closest(".plus")) return;
              toggleSection(e.currentTarget, "g2");
            }}
          >
            <span className="chev">
              <DownIcon size={12} />
            </span>
            <span className="lbl">Channels</span>
            <button
              type="button"
              className="plus"
              aria-label="Add Channel"
              onClick={(e) => {
                e.stopPropagation();
                alert("Add Channel channel");
              }}
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <div className="gbody" id="g2">
            <button
              type="button"
              className={`nav-item ${activeTab === "web-portal" ? "active" : ""}`}
              onClick={() => handleSelectTab("web-portal")}
            >
              <BagIcon size={17} />
              <span className="lbl">Web Portal</span>
              <span className="i eye">
                <EyeOffIcon size={16} />
              </span>
            </button>
            <button
              type="button"
              className={`nav-item ${activeTab === "verify-link" ? "active" : ""}`}
              onClick={() => handleSelectTab("verify-link")}
            >
              <LinkIcon size={17} />
              <span className="lbl">Verify via Link</span>
              <span className="i eye">
                <EyeOffIcon size={16} />
              </span>
            </button>
          </div>
        </nav>

        {/* User Card & Bottom Actions */}
        <div className="side-bottom" style={{ position: "relative" }}>
          {userDropdownOpen && !collapsed && (
            <div
              ref={userMenuRef}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                right: 0,
                marginBottom: "8px",
                zIndex: 50,
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #E8E8EA",
                padding: "6px",
                boxShadow: "0 18px 42px rgba(0, 0, 0, 0.16)",
              }}
            >
              <div style={{ padding: "6px 8px", fontSize: "11px", color: "#8E8E93", fontWeight: 600 }}>
                ACCOUNT SETTINGS
              </div>
              <button
                type="button"
                onClick={() => {
                  alert("Institutional Profile: AICTE Scrutiny Level 3");
                  setUserDropdownOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Institutional Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Forensic Keyrings active: Node 802");
                  setUserDropdownOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Forensic Keyrings
              </button>
              <div style={{ height: "1px", background: "#EFEFF1", margin: "4px 0" }} />
              <Link
                href="/login"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#D64545",
                  textAlign: "left",
                }}
              >
                Sign out
              </Link>
            </div>
          )}

          <div
            className="user"
            onClick={handleToggleUserDropdown}
            style={{ cursor: "pointer" }}
            title="Account Options"
          >
            <span className="av">JW</span>
            <div className="meta hide-c">
              <b>Jenny Wilson</b>
              <small>jenny@nidhisetu.in</small>
            </div>
            <span ref={userChevRef} className="hide-c" style={{ display: "inline-flex" }}>
              <DownIcon size={13} />
            </span>
          </div>

          <button
            type="button"
            className="bt-item"
            onClick={() => alert("Settings modal")}
          >
            <GearIcon size={17} />
            <span className="hide-c">Settings</span>
          </button>

          <Link href="/login" className="bt-item" title="Log out">
            <LogoutIcon size={17} />
            <span className="hide-c">Log out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
