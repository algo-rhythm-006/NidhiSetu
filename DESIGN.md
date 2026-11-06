# Nidhi Setu — Design System
### AICTE FDR Sentinel · v1.0 · React / Next.js + GSAP

> This document is the single source of truth for visual language and motion behavior across Nidhi Setu. Every new page (landing, FDR Registry, Flagged Cases, Renewals, Refund Requests, Reports, Audit Trail, etc.) must be built *from* this system — not styled ad hoc. If a decision isn't covered here, it should be added here before it's shipped.

---

## 0. Design Philosophy

**"Quiet authority."** This is a government compliance product handling financial data (Fixed Deposit Receipts) for institutions regulated by AICTE. The UI has to feel two things simultaneously, and most teams only get one:

1. **Trustworthy & official** — restrained color, high information density done cleanly, no decorative noise, nothing that looks like a template.
2. **Premium & modern** — fintech-grade polish (think Mercury, Linear, Stripe Dashboard), generous whitespace, confident typography, motion that feels engineered, not animated-for-the-sake-of-it.

### Non-negotiables ("no AI slop" checklist)
Reject any screen/component that has:
- ❌ Purple-to-blue gradients, glassmorphism, or generic "SaaS hero" gradient blobs
- ❌ Emoji used as icons
- ❌ Default shadcn/Tailwind UI look with zero customization (rounded-xl everywhere, indigo-600 accents, Inter at default tracking)
- ❌ Centered-everything layouts with no asymmetry or hierarchy
- ❌ Stock illustrations (undraw.co style humans-doing-generic-tasks)
- ❌ Icon soup — every label doesn't need an icon
- ❌ Animations that run on page load with no purpose (confetti, bouncing, spinning logos)
- ❌ Lorem ipsum in shipped work, placeholder "Lorem" avatars
- ✅ Every animation must have a *reason*: direct attention, show causality (this caused that), confirm an action, or reduce perceived wait time. If you can't say why it moves, it shouldn't move.

---

## 1. Color System

Strictly monochrome base + two semantic accents. No decorative color.

### 1.1 Neutrals (the backbone — 90% of the UI)
| Token | Hex | Usage |
|---|---|---|
| `--bg-canvas` | `#FAFAFA` | App background |
| `--bg-surface` | `#FFFFFF` | Cards, sidebar, table rows, modals |
| `--bg-subtle` | `#F4F4F3` | Icon chips, inactive pills, hover states |
| `--bg-muted` | `#EDEDEC` | Disabled fields, skeleton base |
| `--border-default` | `#E7E7E5` | Card borders, dividers |
| `--border-strong` | `#D4D4D2` | Input borders, focus-adjacent |
| `--text-primary` | `#131313` | Headings, numbers, primary labels |
| `--text-secondary` | `#5F5F5C` | Supporting copy, table secondary cells |
| `--text-muted` | `#9A9A96` | Timestamps, placeholder, disabled text |
| `--text-inverse` | `#FFFFFF` | Text on dark surfaces |
| `--surface-inverse` | `#131313` | Active nav pill, primary buttons, critical badges |

### 1.2 Semantic accents (used *only* for meaning, never decoration)
| Token | Hex | Usage |
|---|---|---|
| `--success` | `#16803D` | Positive deltas, "Verified" status, success toasts |
| `--success-bg` | `#EAF6EE` | Success badge background |
| `--danger` | `#C4281C` | Negative deltas, "Critical" priority, errors |
| `--danger-bg` | `#FBEAE8` | Danger badge background |
| `--warning` | `#B5750A` | "Pending"/"High" priority, caution states |
| `--warning-bg` | `#FBF1E1` | Warning badge background |
| `--info` | `#1D5FB0` | Informational links, "In Progress" |
| `--info-bg` | `#EAF1FB` | Info badge background |

**Rule:** A screen should read as grayscale with occasional, deliberate color. If you're reaching for a third accent hue, stop — it's not necessary.

### 1.3 Dark mode (future-proofed, not required for v1)
Invert the neutral ramp (`--bg-canvas → #0E0E0D`, `--bg-surface → #171716`), keep semantic hues but desaturate ~10% and lighten for contrast on dark. Defer full spec until requested.

---

## 2. Typography

### 2.1 Typeface
- **Primary (UI, body, headings — everything, single family):** the native system font stack. Zero web-font request, zero FOUT/FOIT flash, loads instantly on every OS the product is actually used on (Windows-heavy government/institutional desktops included, via the fallback chain).
  ```css
  --font-sans:
    -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji";
  ```
  Apply `var(--font-sans)` on `html`/`body` globally. No `next/font/google`, no CDN link, no local woff2 — this removes a render-blocking dependency entirely.
- **Numerals:** enable `font-variant-numeric: tabular-nums` on every stat, table cell, and currency value. Non-negotiable — this is what makes dashboard numbers feel "engineered" instead of "typed."
- **Do not** use a serif anywhere. Do not load a second family — the system stack already varies tastefully per OS (San Francisco on Mac/iOS, Segoe UI on Windows), which is intentional, not a compromise.

### 2.2 Type scale (desktop → mobile fluid via `clamp()`)
| Token | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `display` | `clamp(2.5rem, 4vw, 4.5rem)` | 600 | 1.05 | Landing hero only |
| `h1` | `2rem / 32px` | 600 | 1.2 | Page title ("Dashboard") |
| `h2` | `1.25rem / 20px` | 600 | 1.3 | Card/section titles ("FDR Trends") |
| `h3` | `1rem / 16px` | 600 | 1.4 | Table headers, card labels |
| `stat-xl` | `clamp(1.75rem, 2vw, 2.25rem)` | 700 | 1.1 | Stat card big numbers |
| `body` | `0.9375rem / 15px` | 400 | 1.55 | Default UI text |
| `body-sm` | `0.8125rem / 13px` | 400 | 1.5 | Table cells, captions |
| `micro` | `0.75rem / 12px` | 500 | 1.4 | Badges, timestamps, overlines |

**Tracking:** −0.01em on everything 20px+; 0 below that. Never positive letter-spacing except `micro`/overline labels (+0.04em, uppercase).

---

## 3. Spacing, Grid & Radius

### 3.1 Spacing scale
4px base unit: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96`. No arbitrary values (no `17px`, no `22px`).

### 3.2 Layout grid
- **Sidebar:** fixed `260px`, collapses to `72px` icon-rail at `<1280px` (not hidden — AICTE admins work on institutional desktops primarily, but tablet support matters for site visits).
- **Content max-width:** `1440px`, centered, `32px` outer padding (`20px` on mobile).
- **Card grid:** 12-column CSS grid, `20px` gutter. Stat cards: 5-up desktop → 2-up tablet → 1-up mobile.
- **Section vertical rhythm:** `32px` between major sections, `16px` between card and its own internal sub-elements.

### 3.3 Radius
| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Badges, small buttons, input fields |
| `--radius-md` | `12px` | Cards, dropdowns, modals |
| `--radius-lg` | `16px` | Large containers (hero panels on landing) |
| `--radius-pill` | `999px` | Nav active state, toggle pills, avatar |

### 3.4 Elevation
No heavy drop shadows — this product reads as flat/bordered, with shadow reserved for *interactive lift only* (hover, dragging, modals):
```css
--shadow-rest: 0 1px 2px rgba(0,0,0,0.04);
--shadow-hover: 0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
--shadow-modal: 0 24px 64px rgba(0,0,0,0.16);
```
Default card state = border only, **no shadow**. Shadow appears on hover/focus as a motion cue (see §5.3).

---

## 4. Iconography & Imagery

- **Icon set:** [Lucide](https://lucide.dev) (outline, 1.5px stroke, matches the screenshot exactly). Never mix icon sets.
- **Icon sizing:** `16px` inline with text, `20px` in nav/buttons, `24px` inside stat-card icon chips.
- **Icon chips:** `40×40px`, `--radius-md`, `--bg-subtle` background, icon centered, `--text-primary` stroke. Never colored per-category (keeps the monochrome discipline) — color lives in the badge/number, not the icon.
- **Avatars:** circle, `--bg-subtle` fallback with initials if no photo, never generic silhouette placeholder art.
- **No stock photography.** If the landing page needs imagery: use abstract generative line-art (SVG, matches brand mark) or real product screenshots — never humans-in-an-office stock photos.
- **Government emblem** (Ashoka Lion / "Government of India" lockup): fixed placement, never resized/recolored, always full contrast — this is a compliance requirement, not a style choice.

---

## 5. Motion System — GSAP

> **Principle: every section animates, but motion is a layer of meaning, not decoration.** Default easing across the entire product is `power3.out` for entrances and `power2.inOut` for state changes — never the GSAP default linear/power1, which reads as cheap.

> **Coverage rule: no static div.** This isn't "animate the cards and call it done." Every structural container on every screen — page wrapper, section header, sidebar footer, topbar icon cluster, dropdown panel, table header row, individual table cell contents, modal overlay, tooltip, breadcrumb trail, pagination control, form field, empty-state block — enters with *something*, even if it's a 150ms opacity fade. The scale of the motion should match the importance of the element (a hero number gets a count-up; a breadcrumb gets a 4px fade-slide), but nothing simply snaps into existence. §5.7 is the per-element checklist to audit a screen against before calling it done.

### 5.1 Setup (Next.js / React)

```bash
npm install gsap
```
```tsx
// lib/gsap.ts — register once, app-wide
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, useGSAP);

gsap.defaults({ ease: "power3.out", duration: 0.6 });
export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, useGSAP };
```
*(As of the 2025 Webflow acquisition, **all** GSAP plugins — SplitText, DrawSVG, MorphSVG, Flip, etc. — are 100% free for commercial use. No Club GreenSock license needed.)*

**Always use `useGSAP()` (the official `@gsap/react` hook), never raw `useEffect` + manual cleanup** — it auto-reverts/cleans animations on unmount and handles React 18 Strict Mode double-invocation correctly. Always scope selectors with a `ref` container, never global `document.querySelector`.

### 5.2 Motion tokens
| Token | Value | Used for |
|---|---|---|
| `ease-entrance` | `power3.out` | Elements appearing |
| `ease-exit` | `power2.in` | Elements leaving |
| `ease-state` | `power2.inOut` | Toggles, tab switches, height changes |
| `ease-bounce` | `back.out(1.4)` | Success confirmations only (sparingly) |
| `dur-micro` | `0.15s` | Hover/press feedback |
| `dur-sm` | `0.3s` | Badge/button state change |
| `dur-md` | `0.6s` | Card/section entrance |
| `dur-lg` | `0.9s` | Hero/chart draw-in |
| `stagger-tight` | `0.04s` | Table rows, list items |
| `stagger-default` | `0.08s` | Cards, nav items |

### 5.3 Section-by-section spec (Dashboard reference)

**App shell (on first load / route mount) — every region of the shell participates, not just the content cards:**
```js
const tl = gsap.timeline();
tl.from(".sidebar-logo", { opacity: 0, x: -12, duration: 0.5 })
  .from(".sidebar-nav-item", { opacity: 0, x: -12, stagger: 0.05 }, "-=0.3")
  .from(".sidebar-footer-emblem", { opacity: 0, duration: 0.4 }, "-=0.2")
  .from(".topbar-title", { opacity: 0, y: 10 }, "-=0.5")
  .from(".topbar-subtitle", { opacity: 0, y: 8 }, "-=0.35")
  .from(".topbar-daterange", { opacity: 0, x: 8, duration: 0.4 }, "-=0.3")
  .from([".topbar-bell", ".topbar-avatar"], { opacity: 0, scale: 0.9, stagger: 0.05, duration: 0.3 }, "-=0.3")
  .from(".stat-card", { opacity: 0, y: 16, stagger: 0.08 }, "-=0.2")
  .from([".chart-panel", ".queue-panel"], { opacity: 0, y: 20, stagger: 0.1 }, "-=0.3")
  .from(".panel-header", { opacity: 0, y: 6, stagger: 0.04 }, "-=0.4")
  .from(".period-toggle-pill", { opacity: 0, scale: 0.92, stagger: 0.03 }, "-=0.3")
  .from(".table-header-cell", { opacity: 0, y: -4, stagger: 0.02 }, "-=0.4")
  .from(".quick-action-card", { opacity: 0, y: 16, stagger: 0.06 }, "-=0.3");
```
Every selector above is a *region*, not a single hero element — the sidebar footer and the government emblem fade in just as deliberately as the stat cards, just at lower amplitude (shorter distance, shorter duration) so the hierarchy of motion matches the hierarchy of importance. Nothing on the shell should appear via a hard cut once this timeline is wired up.

- **Sidebar nav:** active-state background pill uses **`Flip`** to slide/morph between nav items on route change rather than a cross-fade — this is what makes navigation feel "engineered."
- **Stat cards:** the big number count-up uses a tweened proxy object, not literal DOM mutation each frame:
  ```js
  gsap.to({ val: 0 }, {
    val: 2400, duration: 1.1, ease: "power2.out",
    onUpdate: function () { el.textContent = Math.round(this.targets()[0].val).toLocaleString("en-IN"); }
  });
  ```
  Delta arrows (`↑12%`) fade + nudge in *after* the count finishes, not simultaneously — sequencing implies causality.
  Hover: card lifts `y: -3`, `--shadow-hover` fades in, `dur-micro`, icon chip scales to `1.05`.

- **Line chart ("FDR Trends"):** draw the SVG path in using `DrawSVGPlugin` (`drawSVG: "0% 0%"` → `"0% 100%"`, `dur-lg`, scrubbed in on `ScrollTrigger` if below the fold, otherwise on mount). Data points pop in with `scale: 0 → 1`, `back.out(1.7)`, staggered along the path timing. Period toggle (7D/30D/3M/1Y) swap re-draws the path via `MorphSVGPlugin` between the two path shapes instead of hard-cutting — reads as the trend line *reshaping itself*.

- **Priority Queue table:** rows stagger in `stagger-tight` on mount/filter/sort. On re-sort, use `Flip.from()` to animate rows into their new position (not a flash re-render) — this alone is the single highest-leverage motion upgrade for a data table.

- **Badges (Critical/High/Medium, status pills):** no entrance animation beyond the row stagger they're part of. "Critical" badges get a slow `opacity: 1 → 0.7 → 1` breathing pulse (`3s` loop, `sine.inOut`) — subtle enough to not be distracting, present enough to draw the eye to urgent items. Never pulse more than one priority tier.

- **Quick Action cards:** on hover, chevron (`→`) translates `x: 0 → 4px`; icon chip background shifts `--bg-subtle → --surface-inverse` with icon inverting to white, `dur-sm`, `ease-state`. On click, a quick `scale: 0.98` press-down before navigation (tactile confirmation).

- **Dropdowns ("Last 7 days" etc.):** animate `height: auto` via GSAP (not CSS `transition: height`, which can't animate to `auto` cleanly) — measure target height with a hidden clone, tween `height` + stagger-fade menu items in, `dur-sm`.

- **Toasts / notifications (bell icon):** slide in from top-right, `y: -12 → 0` + fade, `back.out(1.2)`; auto-dismiss animates out `power2.in` with a shrinking width progress bar tied to the same timeline duration (so the bar and the dismissal are mathematically linked, not two separate timers).

### 5.4 Landing page specific
- **Hero headline:** `SplitText` into lines (or chars for short headlines), masked reveal (`yPercent: 110 → 0` per line inside an `overflow:hidden` wrapper), `stagger: 0.08`, `power4.out`.
- **Scroll-triggered sections:** every landing section fades/slides in once on first entry into viewport (`ScrollTrigger`, `start: "top 80%"`, `toggleActions: "play none none none"` — **never** `"play reverse play reverse"**, which causes nauseating flicker on scroll-up/down).
- **Stat/proof counters** on landing reuse the exact count-up pattern from §5.3, triggered by `ScrollTrigger` instead of mount.
- **Sticky nav:** background goes from transparent → `--bg-surface` + `--shadow-rest` as user scrolls past hero, driven by `ScrollTrigger` with `scrub: true` for a tied-to-scroll-position feel (not a hard class toggle at a breakpoint).

### 5.5 Page transitions (Next.js App Router)
Use a shared layout-level GSAP context: outgoing content fades/slides out (`dur-sm`), route resolves, incoming content runs its own mount timeline (§5.3 pattern). Keep the sidebar/topbar **static** across transitions — only the content region animates, reinforcing that navigation is local, not a full reload.

### 5.6 Performance & accessibility rules (hard requirements)
1. **Animate only `transform` and `opacity`** wherever possible. Never animate `width`, `top`/`left`, `margin`, or `box-shadow` directly in a scrubbed/looped animation — causes layout thrash. (Height-auto dropdowns in §5.3 are the sanctioned exception, done via measured JS, not CSS.)
2. **`will-change` sparingly** — only on elements mid-animation, removed after (`clearProps` on complete).
3. **Respect `prefers-reduced-motion`:** wrap all entrance timelines in a `gsap.matchMedia()` block; reduced-motion users get `duration: 0.01` / opacity-only crossfades, no stagger, no scroll-scrub, no pulsing badges.
   ```js
   let mm = gsap.matchMedia();
   mm.add("(prefers-reduced-motion: no-preference)", () => { /* full motion */ });
   mm.add("(prefers-reduced-motion: reduce)", () => { /* instant/opacity-only */ });
   ```
4. **Never block interactivity** — a user must be able to click a stat card, nav item, or button *before* its entrance animation finishes. No `pointer-events: none` during entrance tweens.
5. **One `ScrollTrigger` instance per element max** — kill/refresh on route change (`ScrollTrigger.getAll().forEach(t => t.kill())` in cleanup) to avoid trigger buildup across SPA navigation.
6. Target **60fps**; profile with Chrome Performance panel on a throttled 6x CPU before considering a motion "done."

### 5.7 Universal coverage checklist
Run every screen against this before marking it done. If a row's element exists on the screen and has no motion, the screen isn't finished.

| Element | Motion |
|---|---|
| Page/route wrapper | Content region crossfades in on mount (§5.5) |
| Section header (e.g. "FDR Trends") | Fade + 6px slide, part of shell stagger |
| Sidebar nav item | Fade + slide (mount); `Flip` pill (active state change) |
| Sidebar footer / emblem | Fade in, lowest priority in the stagger order |
| Topbar title/subtitle | Fade + slide, leads the shell timeline |
| Topbar icons (bell, avatar) | Fade + scale 0.9→1, trailing the title |
| Date-range / filter dropdown | Fade + slide on mount; measured `height:auto` tween on open (§5.3) |
| Stat card | Fade + slide in; number count-up; hover lift |
| Chart panel | `DrawSVGPlugin` path draw; point pop-in |
| Period toggle pills | Fade + scale in; active state crossfades background |
| Table header row | Fade + −4px slide (fast, tight stagger) |
| Table rows | Stagger in on mount; `Flip.from()` on re-sort/re-filter |
| Table cell badges | Inherit row stagger — no separate entrance, avoids double-motion |
| Quick-action / list cards | Fade + slide; hover chevron nudge + icon-chip invert |
| Buttons | Press `scale(0.97)`; disabled state fades opacity, no bounce |
| Form fields | Fade + slide on mount; focus ring expands from the label edge, not a hard cut |
| Modal / dialog | Overlay fades; panel scales `0.96→1` + fades, `back.out(1.2)` |
| Dropdown / select menu | Measured height tween + staggered item fade (§5.3) |
| Tooltip | Fade + 4px slide toward anchor, `dur-micro` |
| Toast / notification | Slide + fade in; linked dismiss-timer progress bar (§5.3, §8) |
| Breadcrumb trail | Fade + stagger-tight, lowest amplitude on the page |
| Pagination control | Fade in with the table; page-change crossfades the row set via `Flip` |
| Empty state | Icon/illustration scales in `back.out`, text fades in after (§8.3) |
| Error / validation message | Shake + fade-in (§8.2) |
| Skeleton loader | GSAP-driven gradient sweep, not CSS `@keyframes` (§8.4) |

---

## 6. Core Components

### 6.1 Buttons
| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `--surface-inverse` | white | none | Main CTA, one per view |
| Secondary | `--bg-surface` | `--text-primary` | `--border-default` | Default actions |
| Ghost | transparent | `--text-secondary` | none | Tertiary/inline actions |
| Danger | `--danger` | white | none | Destructive confirms only |

Height `40px` default / `36px` compact / `48px` landing CTA. Radius `--radius-sm`. Press state: `scale(0.97)`, `dur-micro`.

### 6.2 Badges / Status Pills
`padding: 4px 10px`, `--radius-sm` (not pill — matches screenshot's rounded-rect, not full pill), `micro` type, weight 600. Background = semantic `-bg` token, text = full-strength semantic token, **except** "Critical" which inverts to `--surface-inverse` solid fill + white text for maximum salience (matches screenshot).

### 6.3 Cards
`--bg-surface`, `1px solid --border-default`, `--radius-md`, `24px` padding (`20px` compact). Default: no shadow. Hover (if interactive): `--shadow-hover` + `translateY(-2px)`.

### 6.4 Sidebar Nav Item
`48px` height, `--radius-sm`, icon (20px) + label, `12px` gap. Inactive: `--text-secondary`. Active: `--bg-subtle` background, `--text-primary`, weight 600, driven by the `Flip`-animated sliding pill described in §5.3.

### 6.5 Table
Header row: `micro` uppercase, `--text-muted`, `--border-default` bottom border, no background. Rows: `56px` height, `--border-default` bottom hairline only (no zebra striping — keeps it premium, not spreadsheet-y), hover: `--bg-canvas` background fade-in `dur-micro`.

### 6.6 Stat Card
Icon chip (§4) top-left, label (`body-sm`, `--text-secondary`) beside/below it, big number (`stat-xl`, tabular-nums), delta row: arrow glyph + percentage in semantic color + `"vs last 7 days"` in `--text-muted`.

---

## 7. Content & Voice
- Numbers always in Indian numbering format (`2,400` not `2400`; lakhs/crores grouping where the figure exceeds 1 lakh — i.e., `1,00,000` not `100,000`).
- Dates: `DD MMM YYYY` (e.g., `27 Apr 2026`), never ambiguous `MM/DD/YYYY`.
- Status/priority language is factual, never alarmist: "Critical" not "URGENT!!", "Expiring < 90d" not "⚠️ Hurry!".
- Empty states and errors are written in plain, respectful language appropriate for a government platform — no jokey copy ("Oops! 🙈").

---

## 8. Feedback, Messaging & State System

> A government financial product lives or dies on whether users trust what it tells them. Every message — success, error, warning, empty, loading — follows the tone rules in §7 and the motion rules below. Nothing pops up unannounced and nothing disappears without the user being able to read it first.

### 8.1 Toast / inline notification types
| Type | Icon | Border/accent | Use for |
|---|---|---|---|
| Success | check-circle (Lucide) | `--success` left border, `--success-bg` fill | "FDR verified", "Report exported" |
| Error | alert-circle | `--danger` left border, `--danger-bg` fill | Failed save, validation blocker, API failure |
| Warning | alert-triangle | `--warning` left border, `--warning-bg` fill | "FDR expiring in 12 days", unsaved-changes caution |
| Info | info | `--info` left border, `--info-bg` fill | Background process started, neutral confirmations |

Structure: icon (20px) + message (`body-sm`, max 2 lines, truncate beyond) + optional single action link + close (×). Stack top-right, `12px` gap, newest on top, max 3 visible (overflow collapses to "+2 more").

**Motion:** enter `y: -12 → 0` + `opacity: 0 → 1`, `back.out(1.2)`, `dur-sm`. A linked countdown bar along the bottom edge drives both the visual countdown *and* the exit — the bar's tween `onComplete` triggers the toast's exit tween, so they can never desync:
```js
const tl = gsap.timeline({ onComplete: () => removeToast(id) });
tl.set(progressBar, { scaleX: 1, transformOrigin: "left" })
  .to(progressBar, { scaleX: 0, duration: 4.5, ease: "none" })
  .to(toastEl, { opacity: 0, x: 24, duration: 0.3, ease: "power2.in" }, "-=0.3");
```
Error toasts get a longer dwell (`7s`) and no auto-dismiss on critical failures — the user must close it, so they can't miss something that blocked an action involving money.

### 8.2 Inline form validation
- **On blur, not on keystroke** — never interrupt someone mid-type. Validate the full field once they leave it.
- **Error state:** field border → `--danger`, a `micro`-sized message appears below in `--danger` with the alert-circle icon, field does a single short horizontal shake (`x: 0 → -4 → 4 → -2 → 0`, `0.35s`, `power1.inOut`) — confined and quick, never cartoonish.
- **Success state** (for multi-step forms / async checks like bank-account verification): border → `--success`, a checkmark draws in via `DrawSVGPlugin` (`0% → 100%`, `0.4s`) rather than popping, because a drawn checkmark reads as "verified," a popped one reads as "decorated."
- **Field-level messages are specific, never generic:** "IFSC code must be 11 characters" not "Invalid input."

### 8.3 Empty states
Every list/table/queue that can be empty (no flagged cases, no refund requests, a filtered table with zero matches) gets a real empty state, never a blank white panel:
- Centered icon (outline, `--text-muted`, 32px) in a `64px` `--bg-subtle` circle, scales in `0 → 1` with `back.out(1.6)`.
- One-line heading ("No flagged cases") + one supporting line in `--text-secondary` explaining *why* ("All FDRs are currently within compliance thresholds."), fading in `0.15s` after the icon.
- If actionable, a single secondary button ("Clear filters" / "View all cases") fades in last.
- **Never** a generic "Nothing here!" — the message should answer "is this expected or did something break?"

### 8.4 Loading states
- **Skeletons**, not spinners, for any content with known structure (stat cards, table rows, chart panel) — preserves layout, avoids content jump.
  ```js
  gsap.to(".skeleton-shimmer", {
    backgroundPosition: "200% 0", duration: 1.4, ease: "none", repeat: -1
  });
  ```
  Linear gradient sweep across `--bg-subtle` → `--bg-muted` → `--bg-subtle`, driven by GSAP (not a CSS `@keyframes` shimmer) so it can be killed instantly and cleanly when real content swaps in.
- **Crossfade, never flash:** skeleton fades out (`0.2s`) at the same moment real content fades in (`0.2s`, overlapping) — no frame where the user sees a blank gap.
- **Spinners** are reserved for actions with *no* predictable layout (file upload, report generation) — a single rotating arc (`rotation: 360`, `1s`, `linear`, `repeat: -1`), never a bouncing-dots pattern.
- Any action over ~1.5s gets a progress label ("Generating report… 2 of 4 sections"), not a bare spinner — reduces perceived wait, per the motion philosophy in §5.

### 8.5 Confirmation & destructive actions
Any irreversible action (deleting an FDR record, reversing a verification) requires a modal confirmation — never a browser `confirm()`, never a single-click destructive button. Modal panel: overlay fades `0 → 0.4` opacity black, panel scales `0.96 → 1` + fades, `back.out(1.2)`, `0.3s`. Primary action in the modal is the **cancel/safe** option visually (secondary button style for "Delete" with `--danger` text only, not a solid danger-filled button) — this is a deliberate friction choice for a financial-records product, not a style default.

### 8.6 System/error pages (404, 500, access-denied)
Same shell (sidebar + topbar stay mounted where auth allows) rather than a blank unbranded page. Icon + heading + one plain-language sentence + a single way back ("Return to Dashboard"). Entrance: icon `back.out`, text fades in after — identical pattern to §8.3 empty states, because structurally they're the same kind of message ("there's nothing to show you here, here's why, here's what to do").

---

## 9. File/Folder Convention (Next.js)

```
/components
  /ui              → Button, Badge, Card, Dropdown (primitives, no business logic)
  /dashboard       → StatCard, TrendChart, PriorityQueue, QuickActions
  /layout          → Sidebar, Topbar, PageShell
/lib
  gsap.ts          → registered plugin export (§5.1)
  motion/          → reusable timeline factories, e.g. staggerIn(), countUp(), flipSort()
/styles
  tokens.css       → all CSS custom properties from §1–3
```
Motion logic lives in `/lib/motion/*` as composable functions (`countUp(el, value)`, `staggerIn(selector, container)`) — **never inline one-off GSAP calls duplicated across components.** Every component that animates should import from this shared layer so easing/duration/stagger stay consistent product-wide without being retyped.

---

## 10. Open Items / Next Steps
- [ ] Confirm official AICTE brand color constraints (if any exist beyond the emblem usage) before locking palette for print/PDF exports (Reports section).
- [ ] WCAG 2.1 AA contrast audit once final palette is in code (`--text-secondary` on `--bg-surface` is borderline — verify ≥4.5:1).
- [ ] Landing page section-by-section wireframe spec — separate doc once this system is approved.
- [ ] Decide final toast dwell times and max-stack count with real usage data once the product is in front of AICTE admins (§8.1 values are a reasonable v1 default, not user-tested).
