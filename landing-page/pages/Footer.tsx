"use client";

import React, { useEffect, useRef } from "react";
import { gebuk } from "@/lib/fonts";
import TextFrame from "@/components/ui/text-frame";

/* ─────────────────────────────────────────────────
   WebGL atmosphere — identical to footer-gradient-animated (1).html
   flip = 1  →  dark-at-bottom (footer)
───────────────────────────────────────────────────*/
const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
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
  "  float k=m*8.;",
  "  vec3 c=vec3(1.);",
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
    return () => {};
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
    return () => {};
  }

  const pr = glx.createProgram()!;
  glx.attachShader(pr, vs);
  glx.attachShader(pr, fs);
  glx.linkProgram(pr);
  if (!glx.getProgramParameter(pr, glx.LINK_STATUS)) {
    host.classList.add("no-gl");
    return () => {};
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

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup = () => {};
    const raf = requestAnimationFrame(() => {
      if (canvasRef.current && hostRef.current) {
        cleanup = initWebGL(canvasRef.current, hostRef.current, 1);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return (
    <>
      <style>{`
        /* ===== FULL WIDTH FOOTER ARCHITECTURE ===== */
        .ft-wrapper {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(28px, 4.5vh, 48px) 0 0;
          box-sizing: border-box;
          background: #ffffff;
        }

        /* WebGL Background */
        .atmo-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          background: #fff;
        }
        .atmo-bg canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          opacity: 0;
          transition: opacity .9s ease;
        }
        .atmo-bg canvas.ready {
          opacity: 1 !important;
        }
        .atmo-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            #FFFFFF 20.0%, #F2F1FA 28.7%, #D4D3EE 37.5%,
            #A6A3DC 46.2%, #746FB9 55.0%, #453F8C 63.7%,
            #25224F 72.5%, #100F26 81.2%, #04040A 90.0%
          );
        }
        @media (prefers-reduced-motion: reduce) {
          .atmo-bg canvas { transition: none !important; }
        }

        /* Scroll Reveal */
        .rv { opacity: 0; transform: translateY(24px); }
        .in .rv {
          animation: ftUp 1s cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay: calc(0.2s + var(--d, 0) * 0.12s);
        }
        @keyframes ftUp { to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .rv { opacity: 1; transform: none; animation: none !important; }
        }

        /* ── 1. TOP SECTION: Full Width, uses Navbar NidhiSetu Font (Comfortaa) ── */
        .ft-inner-top {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 100%;
          padding: 0 clamp(20px, 4vw, 60px);
          box-sizing: border-box;
          text-align: center;
        }

        .cta-box h2 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(24px, 3.4vw, 44px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: #0A0A0B;
          margin: 0 auto;
          max-width: 860px;
        }

        /* 4 Frosted Glass Social Cards — Bigger, Tactile & Luxe */
        .social-cards-row {
          margin-top: clamp(16px, 2.4vh, 26px);
          display: flex;
          gap: clamp(14px, 2vw, 24px);
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        .social-card {
          width: clamp(92px, 8.8vw, 126px);
          height: clamp(54px, 5.6vh, 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.95);
          color: #475569;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, background 0.25s ease, color 0.2s ease;
        }
        .social-card:hover {
          transform: translateY(-3px) scale(1.03);
          background: rgba(255, 255, 255, 0.98);
          border-color: #ffffff;
          box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.14), inset 0 1px 2px #ffffff;
          color: #0F172A;
        }

        /* ── 2. MIDDLE SECTION: 3 Columns with Generous, Balanced Breathing Room ── */
        .cols-grid {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          max-width: 100%;
          padding: 0 clamp(28px, 8vw, 140px);
          text-align: center;
          box-sizing: border-box;
        }
        .col-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          min-width: 110px;
        }
        .col-header {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #ffffff;
          margin-bottom: 7px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        }
        .col-link {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          display: block;
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          padding: 2px 0;
          transition: color 0.2s, transform 0.2s;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }
        .col-link:hover {
          color: #ffffff !important;
          transform: translateY(-1px);
        }

        /* ── 3. BOTTOM SECTION: Giant Full-Screen Wordmark with Premium Gradient ── */
        .wordmark {
          position: relative;
          z-index: 2;
          text-align: center;
          line-height: 0.74;
          user-select: none;
          width: 100%;
          max-width: 100%;
          display: block;
          white-space: nowrap;
          box-sizing: border-box;
          padding: 0 clamp(8px, 1.2vw, 24px);
          font-size: clamp(72px, 17.2vw, 320px);
          font-weight: 900 !important;
          letter-spacing: -0.038em;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Aeonik-Bold", "Arial Black", sans-serif !important;
          /* Premium Metallic Graphite Gradient with Natural Base Dissolve */
          background: linear-gradient(
            180deg,
            #8A909D 0%,
            #636977 30%,
            #434854 60%,
            #272B33 82%,
            rgba(15, 17, 23, 0.35) 100%
          );
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          margin-bottom: -0.06em;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.6));
        }

        /* Premium Bottom Vignette Gradient — 100% Natural, Silky Smooth Fade to Black */
        .ft-bottom-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: clamp(80px, 14vh, 140px);
          pointer-events: none;
          z-index: 3;
          background: linear-gradient(
            to top,
            #04040A 0%,
            rgba(4, 4, 10, 0.85) 25%,
            rgba(4, 4, 10, 0.4) 65%,
            transparent 100%
          );
        }

        @media (max-width: 640px) {
          .cols-grid {
            padding: 0 16px;
          }
          .social-card { width: 78px; height: 50px; border-radius: 16px; }
        }
      `}</style>

      <footer className="ft-wrapper" suppressHydrationWarning>
        {/* Pure WebGL Atmosphere Background */}
        <div ref={hostRef} className="atmo-bg" aria-hidden="true" suppressHydrationWarning>
          <canvas ref={canvasRef} suppressHydrationWarning />
        </div>

        {/* Top: Full Width, Navbar NidhiSetu Font (Comfortaa) */}
        <div className={`ft-inner-top cta-box ${gebuk.className}`} suppressHydrationWarning>
          <h2 className="rv" style={{ "--d": 0 } as React.CSSProperties} suppressHydrationWarning>
            Modern Workflows Powered<br />by <TextFrame theme="light" lineStyle="solid">Smart</TextFrame> AI Agents
          </h2>

          <div className="social-cards-row rv" style={{ "--d": 1 } as React.CSSProperties} suppressHydrationWarning>
            {/* Facebook */}
            <a href="#facebook" className="social-card" aria-label="Facebook" suppressHydrationWarning>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a href="#linkedin" className="social-card" aria-label="LinkedIn" suppressHydrationWarning>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>

            {/* X */}
            <a href="#twitter" className="social-card" aria-label="X" suppressHydrationWarning>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href="#instagram" className="social-card" aria-label="Instagram" suppressHydrationWarning>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        {/* 2. Middle: 3 Columns Spanning Full Width with Navbar NidhiSetu Font */}
        <div className={`cols-grid rv ${gebuk.className}`} style={{ "--d": 2 } as React.CSSProperties} suppressHydrationWarning>
          {/* [Company] */}
          <div className="col-item" suppressHydrationWarning>
            <span className="col-header" suppressHydrationWarning>[Company]</span>
            <a href="#about" className="col-link" suppressHydrationWarning>About</a>
            <a href="#careers" className="col-link" suppressHydrationWarning>Careers</a>
            <a href="#blog" className="col-link" suppressHydrationWarning>Blog</a>
            <a href="#contact" className="col-link" suppressHydrationWarning>Contact</a>
          </div>

          {/* [Product] */}
          <div className="col-item" suppressHydrationWarning>
            <span className="col-header" suppressHydrationWarning>[Product]</span>
            <a href="#features" className="col-link" suppressHydrationWarning>Features</a>
            <a href="#pricing" className="col-link" suppressHydrationWarning>Pricing</a>
            <a href="#usecases" className="col-link" suppressHydrationWarning>Use Cases</a>
            <a href="#integrations" className="col-link" suppressHydrationWarning>Integrations</a>
            <a href="#api" className="col-link" suppressHydrationWarning>API</a>
          </div>

          {/* [Resources] */}
          <div className="col-item" suppressHydrationWarning>
            <span className="col-header" suppressHydrationWarning>[Resources]</span>
            <a href="#help" className="col-link" suppressHydrationWarning>Help Center</a>
            <a href="#docs" className="col-link" suppressHydrationWarning>Documentation</a>
            <a href="#faq" className="col-link" suppressHydrationWarning>FAQ</a>
          </div>
        </div>

        {/* 3. Bottom: Giant Full-Screen Wordmark */}
        <div className="wordmark rv" style={{ "--d": 3 } as React.CSSProperties} aria-hidden="true" suppressHydrationWarning>
          NidhiSetu
        </div>

        {/* Premium Bottom Vignette Gradient — Natural Cosmic Black Grounding */}
        <div className="ft-bottom-gradient" aria-hidden="true" suppressHydrationWarning />
      </footer>
    </>
  );
}
