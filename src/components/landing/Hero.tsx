"use client";

import React, { useEffect, useRef } from "react";
import Navbar from "./Navbar";
import ArrowFillButton from "@/components/ui/arrow-fill-button";
import SpecularButton from "@/components/ui/specular-button";
import ShinyText from "@/components/ui/shiny-text";
import TextFrame from "@/components/ui/text-frame";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────
   WebGL atmosphere — identical shader to the HTML
───────────────────────────────────────────────────*/
const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = [
  "#ifdef GL_FRAGMENT_PRECISION_HIGH",
  "precision highp float;",
  "#else",
  "precision mediump float;",
  "#endif",
  "uniform vec2 uRes; uniform float uTime, uFlip, uIntro; uniform vec2 uMouse;",
  "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
  "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
  "  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}",
  "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}",
  "vec3 ramp(float m){",
  "  float k=m*8.; vec3 c=vec3(1.);",
  "  c=mix(c,vec3(.949,.945,.980),clamp(k,0.,1.));",
  "  c=mix(c,vec3(.831,.827,.933),clamp(k-1.,0.,1.));",
  "  c=mix(c,vec3(.651,.639,.863),clamp(k-2.,0.,1.));",
  "  c=mix(c,vec3(.455,.435,.725),clamp(k-3.,0.,1.));",
  "  c=mix(c,vec3(.271,.247,.549),clamp(k-4.,0.,1.));",
  "  c=mix(c,vec3(.145,.133,.310),clamp(k-5.,0.,1.));",
  "  c=mix(c,vec3(.063,.059,.149),clamp(k-6.,0.,1.));",
  "  c=mix(c,vec3(.016,.016,.039),clamp(k-7.,0.,1.));",
  "  return c;}",
  "void main(){",
  "  vec2 uv=gl_FragCoord.xy/uRes;",
  "  float w=mix(uv.y,1.-uv.y,uFlip);",
  "  float x=(uv.x-.5)*2.;",
  "  float t=uTime*.05;",
  "  float a0=mix(.28,.30,uFlip);",
  "  float arch=1.-min(x*x,1.);",
  "  float base=w+.17*arch+uMouse.y*-.02;",
  "  float m0=clamp((base-a0)/.72,0.,1.);",
  "  float band=smoothstep(.02,.32,m0)*(1.-smoothstep(.62,1.,m0));",
  "  vec2 q=vec2(x*1.05+t*1.6,w*2.1-t);",
  "  vec2 wq=vec2(fbm(q+vec2(0.,t)),fbm(q+vec2(5.2,1.3)-t));",
  "  float f=fbm(q*1.15+wq*1.9);",
  "  float m=clamp((base+(f-.5)*.34*band-a0)/.72,0.,1.);",
  "  m=mix(m,m*m*(3.-2.*m),.4);",
  "  m=clamp(m-(1.-uIntro)*.5,0.,1.);",
  "  vec3 c=ramp(m);",
  "  float wisp=smoothstep(.50,.82,f)*band;",
  "  c=mix(c,vec3(.78,.77,.97),wisp*.20);",
  "  float bl=exp(-(pow((x-uMouse.x*.25)/.6,2.)+pow((w-.40)/.15,2.)));",
  "  c+=vec3(.30,.27,.62)*bl*.34*smoothstep(.12,.45,m)*(1.-smoothstep(.55,.9,m));",
  "  c*=1.-.40*smoothstep(.50,1.,abs(x))*smoothstep(.25,.85,m);",
  "  c=mix(vec3(1.),c,smoothstep(0.,.05,m));",
  "  c+=(hash(gl_FragCoord.xy)-.5)*(2.4/255.);",
  "  gl_FragColor=vec4(clamp(c,0.,1.),1.);}",
].join("\n");

function initWebGL(cv: HTMLCanvasElement, host: HTMLDivElement, flip: number) {
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const gl = cv.getContext("webgl", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  }) as WebGLRenderingContext | null;

  if (!gl) {
    host.classList.add("no-gl");
    host.parentElement?.classList.add("in");
    return () => { };
  }

  const glx: WebGLRenderingContext = gl;

  function sh(type: number, src: string) {
    const o = glx.createShader(type)!;
    glx.shaderSource(o, src);
    glx.compileShader(o);
    if (!glx.getShaderParameter(o, glx.COMPILE_STATUS)) {
      console.warn(glx.getShaderInfoLog(o));
      return null;
    }
    return o;
  }
  const vs = sh(glx.VERTEX_SHADER, VS),
    fs = sh(glx.FRAGMENT_SHADER, FS);
  if (!vs || !fs) {
    host.classList.add("no-gl");
    host.parentElement?.classList.add("in");
    return () => { };
  }

  const pr = glx.createProgram()!;
  glx.attachShader(pr, vs);
  glx.attachShader(pr, fs);
  glx.linkProgram(pr);
  if (!glx.getProgramParameter(pr, glx.LINK_STATUS)) {
    host.classList.add("no-gl");
    host.parentElement?.classList.add("in");
    return () => { };
  }
  glx.useProgram(pr);

  const buf = glx.createBuffer();
  glx.bindBuffer(glx.ARRAY_BUFFER, buf);
  glx.bufferData(
    glx.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    glx.STATIC_DRAW
  );
  const loc = glx.getAttribLocation(pr, "p");
  glx.enableVertexAttribArray(loc);
  glx.vertexAttribPointer(loc, 2, glx.FLOAT, false, 0, 0);

  const uRes = glx.getUniformLocation(pr, "uRes");
  const uTime = glx.getUniformLocation(pr, "uTime");
  const uFlip = glx.getUniformLocation(pr, "uFlip");
  const uIntro = glx.getUniformLocation(pr, "uIntro");
  const uMouse = glx.getUniformLocation(pr, "uMouse");
  glx.uniform1f(uFlip, flip);

  let scale = Math.min(window.devicePixelRatio || 1, 1) * 0.6;

  function resize() {
    const w = Math.max(2, Math.round(host.clientWidth * scale));
    const h = Math.max(2, Math.round(host.clientHeight * scale));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
      glx.viewport(0, 0, w, h);
      glx.uniform2f(uRes, w, h);
    }
  }

  const ro = new (window.ResizeObserver ||
    class {
      observe() {
        resize();
        window.addEventListener("resize", resize);
      }
      disconnect() {
        window.removeEventListener("resize", resize);
      }
    })(resize);
  ro.observe(host);

  let tx = 0,
    ty = 0,
    mx = 0,
    my = 0;
  if (!reduce) {
    window.addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX / innerWidth - 0.5;
        ty = e.clientY / innerHeight - 0.5;
      },
      { passive: true }
    );
  }

  let t0 = performance.now(),
    last = t0,
    introStart: number | null = null;
  let visible = true,
    raf = 0,
    frames = 0,
    acc = 0;

  function ease(k: number) {
    k = Math.max(0, Math.min(1, k));
    return 1 - Math.pow(1 - k, 3);
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = now - last;
    last = now;
    if (dt < 250) {
      acc += dt;
      frames++;
    }
    if (frames === 45) {
      if (acc / frames > 24 && scale > 0.3) {
        scale *= 0.75;
        resize();
      }
      frames = 0;
      acc = 0;
    }
    mx += (tx - mx) * 0.035;
    my += (ty - my) * 0.035;
    if (introStart === null) introStart = now;
    const intro = reduce ? 1 : ease((now - introStart) / 2600);
    glx.uniform1f(uTime, reduce ? 4 : (now - t0) / 1000);
    glx.uniform1f(uIntro, intro);
    glx.uniform2f(uMouse, mx, my);
    glx.drawArrays(glx.TRIANGLES, 0, 3);
    if (!cv.classList.contains("ready")) cv.classList.add("ready");
  }

  function start() {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (es) => {
        visible = es[0].isIntersecting;
        if (visible) {
          host.parentElement?.classList.add("in");
          start();
        } else stop();
      },
      { threshold: 0.05 }
    ).observe(host);
  } else {
    host.parentElement?.classList.add("in");
    start();
  }
  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  return stop;
}

/* ─────────────────────────────────────────────────
   Hero Component
───────────────────────────────────────────────────*/
export default function Hero() {
  const heroRootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);

  const badgeRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const logoBadgeRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);

  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /* GSAP Entrance Timeline — triggered right after loader exit */
  useGSAP(
    () => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });

      tlRef.current = tl;

      // ── Phase 1: Navbar elements smoothly drop down from top ──
      // 1. NidhiSetu Logo drops from top
      tl.fromTo(
        ".ns-logo",
        { opacity: 0, y: -50, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, ease: "power3.out" }
      );

      // 2. Middle 5 links capsule container drops from top
      tl.fromTo(
        ".pill-nav-container",
        { opacity: 0, y: -45, scale: 0.94, filter: "blur(4px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.0, ease: "power3.out" },
        "-=0.85"
      );

      // 3. Middle 5 nav links cascade down with stagger
      tl.fromTo(
        ".pill-nav-link",
        { opacity: 0, y: -18 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power2.out" },
        "-=0.75"
      );

      // 4. Login button on the right drops from top
      tl.fromTo(
        ".ns-login-btn",
        { opacity: 0, y: -50, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, ease: "power3.out" },
        "-=0.9"
      );

      // ── Phase 2: Central hero elements animate slowly and smoothly ──
      // 5. Regulatory Badge drops gently from above
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -26, scale: 0.92, filter: "blur(6px)" },
          { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.0, ease: "power2.out" },
          "-=0.25"
        );
      }

      // 6. Headline Line 1 floats up slowly and smoothly with blur clear
      if (line1Ref.current) {
        tl.fromTo(
          line1Ref.current,
          { opacity: 0, y: 45, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out" },
          "-=0.45"
        );
      }

      // 7. Logo badge shield rotates and blooms into place
      if (logoBadgeRef.current) {
        tl.fromTo(
          logoBadgeRef.current,
          { opacity: 0, scale: 0.35, rotate: -15 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.95, ease: "back.out(2)" },
          "-=0.85"
        );
      }

      // 8. Headline Line 2 floats up slowly and smoothly
      if (line2Ref.current) {
        tl.fromTo(
          line2Ref.current,
          { opacity: 0, y: 45, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out" },
          "-=0.8"
        );
      }

      // 9. Subtitle fades up gently
      if (subtitleRef.current) {
        tl.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 26, filter: "blur(6px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05, ease: "power2.out" },
          "-=0.7"
        );
      }

      // 10. CTA Buttons pop up smoothly with stagger
      if (ctaGroupRef.current) {
        tl.fromTo(
          ctaGroupRef.current.children,
          { opacity: 0, y: 24, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.95, stagger: 0.16, ease: "power3.out" },
          "-=0.6"
        );
      }
    },
    { scope: heroRootRef }
  );

  /* Play the entrance timeline when the splash loader exits */
  useEffect(() => {
    // If loader already exited or isn't active
    if (typeof window !== "undefined" && (window as any).__NS_LOADER_EXITED__) {
      tlRef.current?.play();
      return;
    }

    const handleLoaderExit = () => {
      tlRef.current?.play();
    };

    window.addEventListener("ns-loader-exit", handleLoaderExit, { once: true });

    // Fallback timer: in case event wasn't caught, start after loader exits
    const fallbackTimer = setTimeout(() => {
      tlRef.current?.play();
    }, 3600);

    return () => {
      window.removeEventListener("ns-loader-exit", handleLoaderExit);
      clearTimeout(fallbackTimer);
    };
  }, []);

  /* WebGL — initialise AFTER browser has painted */
  useEffect(() => {
    let cleanup = () => { };
    const raf = requestAnimationFrame(() => {
      if (canvasRef.current && hostRef.current) {
        cleanup = initWebGL(canvasRef.current, hostRef.current, 0);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  /* Laptop reveal — handled by GSAP ScrollTrigger above */
  useEffect(() => {
    // No-op: ScrollTrigger in useGSAP handles this
  }, []);

  const heroStyle: React.CSSProperties = {
    position: "relative",
    minHeight: 1120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: 80,
  };

  const atmoBgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    zIndex: 0,
    background: "#fff",
  };

  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    opacity: 0,
    transition: "opacity .9s ease",
  };

  return (
    <>
      <style>{`
        .atmo-hero-canvas.ready { opacity: 1 !important; }

        .atmo-hero-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            #04040A 14.0%, #100F26 22.8%, #25224F 32.5%,
            #453F8C 42.2%, #746FB9 52.0%, #A6A3DC 62.8%,
            #D4D3EE 72.5%, #F2F1FA 82.2%, #FFFFFF 94.0%
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .atmo-hero-canvas { transition: none !important; }
        }

        .rv { opacity: 0; transform: translateY(22px); }
        .in .rv {
          animation: nsReveal 1s cubic-bezier(.2,.8,.2,1) forwards;
        }
        .in .rv-0 { animation-delay: 0.35s; }
        .in .rv-1 { animation-delay: 0.47s; }
        .in .rv-2 { animation-delay: 0.59s; }
        .in .rv-3 { animation-delay: 0.71s; }
        .in .rv-4 { animation-delay: 0.83s; }
        @keyframes nsReveal { to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .rv { opacity: 1; transform: none; animation: none !important; }
        }

        /* Static Dashboard Image Presentation directly in WebGL Atmosphere */
        .ns-dashboard-wrap {
          opacity: 1;
          transform: none;
        }

        @keyframes emeraldRadar {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 128, 61, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(22, 128, 61, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 128, 61, 0); }
        }
        .radar-pulse {
          animation: emeraldRadar 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }

        .hero-content-wrap {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: clamp(28px, 4.5vh, 56px) 24px 0;
          color: #ffffff;
          width: 100%;
          max-width: 1260px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          font-weight: 500;
          padding: 6px 16px 6px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.25);
          cursor: default;
          user-select: none;
        }
        .hero-badge-ver {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
        }
        .hero-heading {
          margin-top: 32px;
          font-size: clamp(30px, 4.2vw, 56px);
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.18;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .hero-line {
          display: inline-block;
          vertical-align: middle;
        }
        .hero-text-primary {
          display: inline-block;
          background: linear-gradient(180deg, #FFFFFF 15%, #E2E8F0 50%, #94A3B8 90%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: #E2E8F0;
          text-shadow: 0 2px 20px rgba(10, 8, 40, 0.35);
        }
        .hero-text-grey {
          display: inline-block;
          background: linear-gradient(180deg, #CBD5E1 15%, #94A3B8 55%, #64748B 95%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: #94A3B8;
          text-shadow: 0 2px 18px rgba(10, 8, 40, 0.3);
        }
        .hero-logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 0.88em;
          height: 0.88em;
          vertical-align: -0.08em;
          margin: 0 0.16em;
          border-radius: 0.24em;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(80, 72, 160, 0.95) 0%, rgba(37, 34, 79, 0.98) 100%);
          border: 1.5px solid rgba(196, 181, 253, 0.5);
          box-shadow:
            0 0 32px 4px rgba(120, 110, 215, 0.75),
            0 8px 24px rgba(0, 0, 0, 0.45),
            inset 0 1px 1px rgba(255, 255, 255, 0.45);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .hero-logo-badge:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow:
            0 0 38px 6px rgba(166, 163, 220, 0.9),
            0 12px 28px rgba(0, 0, 0, 0.55),
            inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }
        .hero-logo-badge-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-logo-badge-sheen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, transparent 55%);
        }
        .hero-subtitle {
          margin: 24px auto 0;
          max-width: 600px;
          font-size: clamp(14px, 1.35vw, 16.5px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.62);
          text-shadow: 0 1px 12px rgba(10, 8, 40, 0.4);
          font-weight: 400;
          letter-spacing: 0.01em;
          -webkit-font-smoothing: antialiased;
        }
        .hero-cta-group {
          margin-top: 36px;
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        .hero-dashboard-container {
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 1380px;
          margin-top: 60px;
          padding: 0 clamp(16px, 3vw, 36px);
          display: flex;
          justify-content: center;
        }
        .hero-dashboard-frame {
          position: relative;
          width: 100%;
          max-width: 1280px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 90px -20px rgba(10, 8, 40, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.25);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .hero-dashboard-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }
        .hero-dashboard-sheen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 20%);
        }

        @media (max-width: 768px) {
        }
      `}</style>

      {/* ── HERO SECTION WITH EMBEDDED WEBGL ATMOSPHERE ── */}
      <section ref={heroRootRef} style={heroStyle} suppressHydrationWarning>
        {/* Full-bleed WebGL Atmosphere canvas */}
        <div
          ref={hostRef}
          className="atmo-hero-bg"
          aria-hidden="true"
          style={atmoBgStyle}
          suppressHydrationWarning
        >
          <canvas
            ref={canvasRef}
            className="atmo-hero-canvas"
            style={canvasStyle}
            suppressHydrationWarning
          />
        </div>

        <Navbar />

        {/* Hero Content */}
        <div className="hero-content-wrap" suppressHydrationWarning>
          {/* Improved Apple Glassmorphism Badge */}
          <div ref={badgeRef} className="hero-badge" suppressHydrationWarning>
            {/* Live emerald verification pulse indicator */}
            <span
              className="radar-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#16803D",
                display: "inline-block",
              }}
              suppressHydrationWarning
            />
            {/* React Bits ShinyText across the entire badge */}
            <ShinyText
              text="AICTE Regulatory Oversight · Official FDR Sentinel v1.0"
              speed={3.2}
              className="tracking-wide font-medium"
            />
          </div>

          {/* Modernized Headline with Inline Logo Badge and TextFrame */}
          <h1 className="hero-heading" suppressHydrationWarning>
            <span ref={line1Ref} className="hero-line hero-line-1" suppressHydrationWarning>
              <span className="hero-text-primary" suppressHydrationWarning>Every FDR</span>{" "}
              <span ref={logoBadgeRef} className="hero-logo-badge" suppressHydrationWarning>
                <img
                  src="/logo.jpeg"
                  alt="NidhiSetu Shield"
                  className="hero-logo-badge-img"
                  loading="eager"
                  suppressHydrationWarning
                />
                <span className="hero-logo-badge-sheen" aria-hidden="true" />
              </span>{" "}
              <span className="hero-text-grey" suppressHydrationWarning>Deserves</span>
            </span>
            <br className="hero-br" />
            <span ref={line2Ref} className="hero-line hero-line-2" suppressHydrationWarning>
              <span className="hero-text-primary" suppressHydrationWarning>Institutional</span>{" "}
              <TextFrame theme="atmosphere" showCursor lineStyle="solid">
                Verification
              </TextFrame>
            </span>
          </h1>

          {/* Subtitle in grey-600 neutral tone */}
          <p ref={subtitleRef} className="hero-subtitle" suppressHydrationWarning>
            Automated verification, lifecycle monitoring, and regulatory
            compliance assurance for Fixed Deposit Receipts under AICTE regulatory
            oversight.
          </p>

          {/* Call to Actions */}
          <div ref={ctaGroupRef} className="hero-cta-group" suppressHydrationWarning>
            {/* ArrowFill primary button with tilted arrow */}
            <ArrowFillButton text="Start Verification" href="#verification" />

            {/* Specular glass secondary — matching 48px height with sentinel screen icon */}
            <SpecularButton variant="glass" href="#dashboard-preview">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.9 }}
                suppressHydrationWarning
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Explore Sentinel Platform</span>
            </SpecularButton>
          </div>
        </div>

        {/* ── DASHBOARD IMAGE DIRECTLY IN WEBGL ATMOSPHERE ── */}
        <div
          id="dashboard-preview"
          ref={laptopRef}
          className="ns-dashboard-wrap hero-dashboard-container"
          suppressHydrationWarning
        >
          {/* Clean wide presentation of dashboard.jpeg directly in WebGL */}
          <div className="hero-dashboard-frame" suppressHydrationWarning>
            {/* Real Dashboard Image (C:\Users\Prithvi\Desktop\nidhiSetu\public\dashboard.jpeg) */}
            <img
              src="/dashboard.jpeg"
              alt="NidhiSetu AICTE FDR Sentinel Dashboard"
              className="hero-dashboard-img"
              loading="eager"
              suppressHydrationWarning
            />

            {/* Subtle Apple Glassmorphic Sheen across the top */}
            <div
              className="hero-dashboard-sheen"
              aria-hidden="true"
              suppressHydrationWarning
            />
          </div>
        </div>
      </section>
    </>
  );
}
