"use client";

import React, { useEffect, useRef } from "react";
import { gebuk } from "@/lib/fonts";
import TextFrame from "@/components/ui/text-frame";

export default function SecondBento() {
  const secRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;

    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN").format(Math.round(n));

    const runCounts = (root: HTMLElement) => {
      const counters = root.querySelectorAll<HTMLElement>("[data-count]");
      counters.forEach((el) => {
        const to = parseFloat(el.getAttribute("data-count") || "0");
        const pre = el.getAttribute("data-pre") || "";
        const suf = el.getAttribute("data-suf") || "";
        const dur = 1700;
        const delay = parseFloat(el.getAttribute("data-delay") || "0");
        let t0: number | null = null;

        if (reduce) {
          el.textContent = pre + fmt(to) + suf;
          return;
        }

        const step = (t: number) => {
          if (t0 === null) t0 = t + delay;
          const k = Math.min(1, Math.max(0, (t - t0) / dur));
          const e = 1 - Math.pow(1 - k, 3);
          el.textContent = pre + fmt(to * e) + suf;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    if (!("IntersectionObserver" in window)) {
      sec.classList.add("in");
      runCounts(sec);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              runCounts(e.target as HTMLElement);
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      io.observe(sec);
      return () => io.disconnect();
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <>
      <style>{`
        .sb-sec {
          position: relative;
          width: 100%;
          padding: clamp(70px, 9vw, 120px) clamp(16px, 4vw, 40px);
          background: radial-gradient(60% 420px at 50% 0%, rgba(120, 110, 240, .08), rgba(120, 110, 240, 0) 72%),
                      radial-gradient(50% 360px at 50% 100%, rgba(120, 110, 240, .06), rgba(120, 110, 240, 0) 72%),
                      #ffffff;
          box-sizing: border-box;
          z-index: 10;
        }

        .sb-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .sb-i {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: none;
        }

        /* Heading Block */
        .sb-head2 {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: clamp(34px, 5vw, 56px);
        }

        .sb-head-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .sb-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 16px 0 12px;
          border-radius: 999px;
          border: 1px solid #E6E4F3;
          background: #ffffff;
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 12.5px;
          font-weight: 600;
          color: #0A0A18;
          box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
        }

        .sb-pill .sb-i {
          width: 14px;
          height: 14px;
          stroke-width: 2;
          color: #5B52D6;
        }

        .sb-head2 h2 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(30px, 4.5vw, 54px);
          font-weight: 700;
          letter-spacing: -.035em;
          line-height: 1.1;
          color: #0A0A18;
          max-width: 12em;
          margin: 0;
        }

        .sb-head2 .lead {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(14px, 1.4vw, 16px);
          line-height: 1.6;
          color: #6E6C85;
          max-width: 380px;
          margin: 0;
          padding-bottom: 6px;
        }

        /* Bento Grid */
        .sb-bento {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(14px, 1.8vw, 22px);
        }

        .sb-bento .wide {
          grid-column: 1 / -1;
        }

        .sb-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          border-radius: clamp(22px, 2.6vw, 32px);
          background: #F5F4FB;
          padding: clamp(20px, 2.2vw, 28px);
          border: 1px solid rgba(15, 20, 40, .04);
          transition: transform .6s cubic-bezier(.2, .8, .2, 1), box-shadow .6s cubic-bezier(.2, .8, .2, 1);
        }

        .sb-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0;
          transition: opacity .4s;
          background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, .95), rgba(255, 255, 255, 0) 65%);
        }

        .sb-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 30px 60px -34px rgba(30, 40, 100, .35);
        }

        .sb-card:hover::before { opacity: 1; }

        .sb-ico {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #ffffff;
          display: grid;
          place-items: center;
          color: #5B52D6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, .05), 0 0 0 1px rgba(15, 20, 40, .04);
        }

        .sb-ico .sb-i { width: 20px; height: 20px; }

        .sb-tall {
          min-height: clamp(470px, 44vw, 540px);
          display: flex;
          flex-direction: column;
        }

        .sb-tall h3 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(19px, 1.8vw, 23px);
          font-weight: 700;
          letter-spacing: -.025em;
          margin: 16px 0 8px;
          color: #0A0A18;
        }

        .sb-tall .d {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          line-height: 1.55;
          color: #6E6C85;
          max-width: 38ch;
        }

        .sb-stage {
          position: relative;
          margin-top: auto;
          height: clamp(250px, 24vw, 290px);
        }

        /* Card 1: Registry Phone Widget */
        .sb-phone {
          position: absolute;
          left: 50%;
          bottom: -18px;
          width: min(78%, 300px);
          transform: translateX(-50%);
          background: #ffffff;
          border-radius: 30px 30px 0 0;
          padding: 18px 18px 0;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .05), 0 20px 40px -24px rgba(30, 40, 100, .3);
          height: 100%;
        }

        .sb-ph-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          font-weight: 600;
          color: #0A0A18;
        }

        .sb-ph-top i {
          width: 30px;
          height: 6px;
          border-radius: 6px;
          background: #0E0E10;
        }

        .sb-ph-name {
          margin-top: 18px;
          font-size: 11.5px;
          font-weight: 600;
          color: #0A0A18;
        }

        .sb-ph-big {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -.04em;
          margin: 4px 0 2px;
          font-variant-numeric: tabular-nums;
          color: #0A0A18;
        }

        .sb-ph-sub {
          font-size: 10.5px;
          color: #6E6C85;
        }

        .sb-bars {
          display: flex;
          align-items: flex-end;
          gap: 7px;
          height: 86px;
          margin-top: 16px;
        }

        .sb-bars i {
          flex: 1;
          border-radius: 7px 7px 3px 3px;
          background: #DEDBF7;
          transform-origin: bottom;
          transform: scaleY(0);
          height: var(--h);
        }

        .sb-bars i.hi {
          background: #5B52D6;
        }

        .in .sb-bars i {
          animation: sbGrow .9s cubic-bezier(.2, .8, .2, 1) forwards;
          animation-delay: calc(1s + var(--b, 0) * .08s);
        }

        .sb-lab {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #9C9AB4;
          margin-top: 7px;
        }

        .sb-float {
          position: absolute;
          z-index: 3;
          background: #ffffff;
          border-radius: 16px;
          padding: 11px 14px;
          box-shadow: 0 14px 34px -14px rgba(30, 40, 100, .4), 0 0 0 1px rgba(15, 20, 40, .04);
          display: flex;
          align-items: center;
          gap: 11px;
          animation: sbBob 5s ease-in-out infinite;
        }

        .sb-float .ci {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          background: #ECEAFB;
          color: #5B52D6;
          display: grid;
          place-items: center;
        }

        .sb-float .ci .sb-i { width: 17px; height: 17px; }

        .sb-float small {
          display: block;
          font-size: 10px;
          color: #6E6C85;
        }

        .sb-float b {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -.02em;
          font-variant-numeric: tabular-nums;
          color: #0A0A18;
        }

        .sb-f1 {
          right: -1%;
          top: -9%;
        }

        /* Card 2: Forensic Tamper Screen */
        .sb-doc-stack {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(74%, 290px);
          aspect-ratio: 3 / 3.4;
          transform: translate(-50%, -46%);
        }

        .sb-sheet {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .05), 0 24px 40px -24px rgba(30, 40, 100, .35);
          padding: 18px;
        }

        .sb-sheet.s3 {
          transform: translate(-22px, 14px) rotate(-7deg);
          background: linear-gradient(160deg, #DDDAF6, #B7B2EA);
        }

        .sb-sheet.s2 {
          transform: translate(16px, 8px) rotate(5deg);
          background: linear-gradient(160deg, #EEEDFA, #CFCBF2);
        }

        .sb-sheet.s1 { overflow: hidden; }

        .sb-ln {
          height: 7px;
          border-radius: 5px;
          background: #EAE8F6;
          margin-bottom: 9px;
        }

        .sb-ln.w1 { width: 62%; }
        .sb-ln.w2 { width: 88%; }
        .sb-ln.w3 { width: 74%; }
        .sb-ln.w4 { width: 50%; }

        .sb-hd {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
          font-size: 11px;
          font-weight: 600;
          color: #0A0A18;
        }

        .sb-hd .lg {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #ECEAFB;
          color: #5B52D6;
          display: grid;
          place-items: center;
        }

        .sb-hd .lg .sb-i { width: 14px; height: 14px; }

        .sb-seal {
          position: absolute;
          right: 16px;
          bottom: 16px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          border: 2px dashed #B5B0E6;
          display: grid;
          place-items: center;
          color: #948EDA;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .06em;
        }

        .sb-box {
          position: absolute;
          right: 8px;
          bottom: 8px;
          width: 78px;
          height: 78px;
          border-radius: 16px;
          border: 2px solid #E04B4B;
          opacity: 0;
        }

        .in .sb-box { animation: sbBoxIn 6s ease-in-out 2s infinite; }

        .sb-beam {
          position: absolute;
          left: 0;
          right: 0;
          height: 46px;
          top: -46px;
          background: linear-gradient(180deg, rgba(91, 82, 214, 0), rgba(91, 82, 214, .28));
          border-bottom: 2px solid rgba(91, 82, 214, .9);
        }

        .in .sb-beam { animation: sbScan 3.2s ease-in-out 1.2s infinite; }

        .sb-float.f2 {
          left: 2%;
          top: auto;
          bottom: 10%;
          background: #0B0B1E;
          color: #ffffff;
          box-shadow: 0 18px 34px -14px rgba(10, 10, 40, .6);
          animation-delay: -2s;
        }

        .sb-float.f2 .ci {
          background: rgba(255, 255, 255, .12);
          color: #6EE7B7;
        }

        .sb-float.f2 small { color: rgba(255, 255, 255, .6); }
        .sb-float.f2 b { font-size: 15px; color: #ffffff; }

        /* Card 3: Wide Layout */
        .sb-wide {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: clamp(18px, 3vw, 40px);
          align-items: stretch;
          padding-bottom: clamp(18px, 2vw, 26px);
        }

        .sb-wide .l {
          display: flex;
          flex-direction: column;
        }

        .sb-wide h3 {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: clamp(24px, 2.7vw, 34px);
          font-weight: 700;
          letter-spacing: -.035em;
          margin-top: 18px;
          max-width: 14em;
          color: #0A0A18;
        }

        .sb-wide .d {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 14px;
          max-width: 44ch;
          margin-top: 8px;
          color: #6E6C85;
          line-height: 1.55;
        }

        .sb-ticks {
          list-style: none;
          margin: 22px 0 26px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
        }

        .sb-ticks li {
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 13.5px;
          color: #2B2F3A;
        }

        .sb-ticks .k {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          display: grid;
          place-items: center;
          color: #5B52D6;
          box-shadow: 0 0 0 1px rgba(15, 20, 40, .08);
          flex: none;
        }

        .sb-ticks .k .sb-i { width: 12px; height: 12px; stroke-width: 2.6; }

        .sb-wide .btn-dark {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          height: 46px;
          padding: 5px 6px 5px 22px;
          border-radius: 999px;
          background: #0B0B1E;
          color: #ffffff;
          font-family: var(--font-gebuk), "Comfortaa", sans-serif !important;
          font-size: 13.5px;
          font-weight: 700;
          border: 0;
          cursor: pointer;
          align-self: flex-start;
          margin-top: auto;
          text-decoration: none;
          box-shadow: 0 8px 24px -6px rgba(11, 11, 30, 0.35);
          transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
        }

        .sb-wide .btn-dark:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px -8px rgba(11, 11, 30, 0.5);
        }

        .sb-btn-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #ffffff;
          color: #0B0B1E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .25s ease, transform .25s ease, color .25s ease;
        }

        .sb-wide .btn-dark:hover .sb-btn-circle {
          background: #5B52D6;
          color: #ffffff;
          transform: scale(1.05);
        }

        .sb-btn-arrow {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform .3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sb-wide .btn-dark:hover .sb-btn-arrow {
          transform: translate(2px, -2px);
        }

        .sb-wide .r {
          position: relative;
          min-height: 400px;
        }

        .sb-req {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          padding: 20px;
          background: #ffffff;
          border-radius: 22px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 0 0 1px rgba(15, 20, 40, .04);
        }

        .sb-req-h {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .sb-req-h b {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -.01em;
          color: #0A0A18;
        }

        .sb-req-h small {
          display: block;
          font-size: 11px;
          color: #6E6C85;
          font-weight: 400;
          margin-top: 2px;
        }

        .sb-chip {
          font-size: 10.5px;
          font-weight: 600;
          padding: 5px 11px;
          border-radius: 999px;
          background: #ECEAFB;
          color: #453F8C;
        }

        .sb-track {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin: 8px 6px 6px;
        }

        .sb-track::before {
          content: "";
          position: absolute;
          left: 12.5%;
          right: 12.5%;
          top: 14px;
          height: 3px;
          border-radius: 3px;
          background: #E6E3F5;
        }

        .sb-track::after {
          content: "";
          position: absolute;
          left: 12.5%;
          top: 14px;
          height: 3px;
          border-radius: 3px;
          background: #5B52D6;
          width: 0;
        }

        .in .sb-track::after {
          animation: sbFillTrack 1.6s cubic-bezier(.5, 0, .2, 1) 1.1s forwards;
        }

        .sb-nd {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 10.5px;
          color: #6E6C85;
        }

        .sb-nd i {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          margin: 0 auto 8px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 0 2px #E6E3F5;
          color: #B6B3D0;
          transition: all .4s;
        }

        .sb-nd i svg { width: 14px; height: 14px; }

        .in .sb-nd.done i {
          animation: sbNodeOn .5s ease forwards;
          animation-delay: calc(1.1s + var(--n, 0) * .55s);
        }

        .in .sb-nd.cur i {
          animation: sbNodeCur 2s ease-in-out 2.4s infinite;
        }

        .sb-nd.done { color: #2B2F3A; font-weight: 500; }
        .sb-nd.cur { color: #453F8C; font-weight: 600; }

        .sb-mini {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .sb-mini div {
          background: #F3F2FA;
          border-radius: 14px;
          padding: 12px 14px;
        }

        .sb-mini small {
          display: block;
          font-size: 10.5px;
          color: #6E6C85;
        }

        .sb-mini b {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -.025em;
          font-variant-numeric: tabular-nums;
          color: #0A0A18;
        }

        .sb-log {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sb-log div {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          padding: 8px 2px;
          border-top: 1px solid #EAE8F6;
          opacity: 0;
          color: #0A0A18;
        }

        .sb-log i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #5B52D6;
          flex: none;
        }

        .sb-log i.rd { background: #E04B4B; }
        .sb-log i.gn { background: #1FA971; }

        .sb-log small {
          margin-left: auto;
          font-size: 10.5px;
          color: #9C9AB4;
        }

        .in .sb-log div {
          animation: sbFadeUp .5s ease forwards;
          animation-delay: calc(1.8s + var(--r, 0) * .2s);
        }

        .sb-people {
          position: absolute;
          right: -6px;
          bottom: -4px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 14px;
          background: #ffffff;
          border-radius: 18px;
          padding: 12px 16px;
          box-shadow: 0 16px 36px -16px rgba(30, 40, 100, .45), 0 0 0 1px rgba(15, 20, 40, .04);
          animation: sbBob 5.5s ease-in-out -1s infinite;
        }

        .sb-av { display: flex; }

        .sb-av i {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          margin-left: -8px;
          display: grid;
          place-items: center;
          font-style: normal;
          font-size: 9.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .sb-av i:first-child { margin-left: 0; }

        .sb-people small {
          display: block;
          font-size: 10px;
          color: #6E6C85;
        }

        .sb-people b {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #0A0A18;
        }

        /* Animations */
        .sb-rv { opacity: 0; transform: translateY(34px) scale(.98); }
        .in .sb-rv {
          animation: sbUp .95s cubic-bezier(.2, .8, .2, 1) forwards;
          animation-delay: calc(.08s + var(--d, 0) * .12s);
        }

        @keyframes sbUp { to { opacity: 1; transform: none; } }
        @keyframes sbGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes sbFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sbBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes sbScan { 0% { transform: translateY(0); } 100% { transform: translateY(430px); } }
        @keyframes sbBoxIn { 0%, 38%, 100% { opacity: 0; transform: scale(1.2); } 46%, 78% { opacity: 1; transform: scale(1); } }
        @keyframes sbFillTrack { to { width: 50%; } }
        @keyframes sbNodeOn { to { background: #5B52D6; color: #ffffff; box-shadow: 0 0 0 2px #5B52D6; } }
        @keyframes sbNodeCur { 0%, 100% { box-shadow: 0 0 0 2px #5B52D6, 0 0 0 0 rgba(91, 82, 214, .35); color: #5B52D6; } 50% { box-shadow: 0 0 0 2px #5B52D6, 0 0 0 9px rgba(91, 82, 214, 0); color: #5B52D6; } }

        @media (max-width: 860px) {
          .sb-head2 { flex-direction: column; align-items: flex-start; gap: 14px; }
          .sb-bento, .sb-wide { grid-template-columns: 1fr; }
          .sb-wide .r { min-height: 360px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sb-rv, .in .sb-bars i, .in .sb-log div {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Embedded SVG Icons Sprite */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="sb-star" viewBox="0 0 24 24">
          <path d="M12 3v18M4.200 7.500l15.600 9M4.200 16.500l15.600-9" />
        </symbol>
        <symbol id="sb-layers" viewBox="0 0 24 24">
          <path d="M12 3 3 8l9 5 9-5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />
        </symbol>
        <symbol id="sb-chart" viewBox="0 0 24 24">
          <path d="M4 21V11h5v10zM9.500 21V4h5v17zM15 21v-6h5v6z" />
        </symbol>
        <symbol id="sb-scan" viewBox="0 0 24 24">
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
        </symbol>
        <symbol id="sb-bank" viewBox="0 0 24 24">
          <path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />
        </symbol>
        <symbol id="sb-shield" viewBox="0 0 24 24">
          <path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z" />
          <path d="m8.500 12 2.500 2.500 4.500-4.500" />
        </symbol>
        <symbol id="sb-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </symbol>
        <symbol id="sb-check" viewBox="0 0 24 24">
          <path d="m5 12.500 4.500 4.500L19 7" />
        </symbol>
        <symbol id="sb-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
        <symbol id="sb-lock" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </symbol>
      </svg>

      <section ref={secRef} className="sb-sec" id="sentinel" suppressHydrationWarning>
        <div className="sb-wrap" suppressHydrationWarning>
          {/* Header */}
          <div className="sb-head2" suppressHydrationWarning>
            <div className="sb-head-left" suppressHydrationWarning>
              <span className="sb-pill sb-rv" style={{ "--d": 0 } as React.CSSProperties} suppressHydrationWarning>
                <svg className="sb-i">
                  <use href="#sb-star" />
                </svg>
                Platform Features
              </span>
              <h2 className="sb-rv" style={{ "--d": 1 } as React.CSSProperties} suppressHydrationWarning>
                Everything You Need to <TextFrame theme="light" lineStyle="solid">Manage</TextFrame> Your FDRs
              </h2>
            </div>
            <p className="lead sb-rv" style={{ "--d": 2 } as React.CSSProperties} suppressHydrationWarning>
              Powerful tools that help institutions and officials register, verify, track and release FDRs, all from one secure platform.
            </p>
          </div>

          {/* 3 Bento Cards Grid */}
          <div className="sb-bento" suppressHydrationWarning>
            {/* 1. Centralized FDR Registry */}
            <article
              className="sb-card sb-tall sb-rv"
              style={{ "--d": 1 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="sb-ico" suppressHydrationWarning>
                <svg className="sb-i"><use href="#sb-layers" /></svg>
              </div>
              <h3 suppressHydrationWarning>Centralized FDR Registry</h3>
              <p className="d" suppressHydrationWarning>
                Keep every institution&apos;s FDR records in one secure, searchable registry. No more scattered files.
              </p>
              <div className="sb-stage" suppressHydrationWarning>
                <div className="sb-float sb-f1" suppressHydrationWarning>
                  <span className="ci">
                    <svg className="sb-i"><use href="#sb-chart" /></svg>
                  </span>
                  <div>
                    <small>Active FDRs</small>
                    <b data-count="1162" data-delay="900">0</b>
                  </div>
                </div>
                <div className="sb-phone" suppressHydrationWarning>
                  <div className="sb-ph-top" suppressHydrationWarning>
                    <span>Registry</span>
                    <i />
                    <span>Live</span>
                  </div>
                  <div className="sb-ph-name" suppressHydrationWarning>Total records tracked</div>
                  <div className="sb-ph-big" data-count="1284" data-delay="700" suppressHydrationWarning>0</div>
                  <div className="sb-ph-sub" suppressHydrationWarning>Institution-wise · updated just now</div>
                  <div className="sb-bars" suppressHydrationWarning>
                    <i style={{ "--h": "42%", "--b": 0 } as React.CSSProperties} />
                    <i style={{ "--h": "58%", "--b": 1 } as React.CSSProperties} />
                    <i style={{ "--h": "48%", "--b": 2 } as React.CSSProperties} />
                    <i className="hi" style={{ "--h": "92%", "--b": 3 } as React.CSSProperties} />
                    <i style={{ "--h": "64%", "--b": 4 } as React.CSSProperties} />
                    <i style={{ "--h": "76%", "--b": 5 } as React.CSSProperties} />
                    <i style={{ "--h": "54%", "--b": 6 } as React.CSSProperties} />
                    <i style={{ "--h": "68%", "--b": 7 } as React.CSSProperties} />
                  </div>
                  <div className="sb-lab" suppressHydrationWarning>
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                  </div>
                </div>
              </div>
            </article>

            {/* 2. Forensic Tamper Screening */}
            <article
              className="sb-card sb-tall sb-rv"
              style={{ "--d": 2 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="sb-ico" suppressHydrationWarning>
                <svg className="sb-i"><use href="#sb-scan" /></svg>
              </div>
              <h3 suppressHydrationWarning>Forensic Tamper Screening</h3>
              <p className="d" suppressHydrationWarning>
                Screen for suspicious pixel edits and copied bank seals before a case ever reaches an official.
              </p>
              <div className="sb-stage" suppressHydrationWarning>
                <div className="sb-doc-stack" suppressHydrationWarning>
                  <div className="sb-sheet s3" suppressHydrationWarning />
                  <div className="sb-sheet s2" suppressHydrationWarning />
                  <div className="sb-sheet s1" suppressHydrationWarning>
                    <div className="sb-hd" suppressHydrationWarning>
                      <span className="lg">
                        <svg className="sb-i"><use href="#sb-bank" /></svg>
                      </span>
                      Fixed Deposit Receipt
                    </div>
                    <div className="sb-ln w2" suppressHydrationWarning />
                    <div className="sb-ln w1" suppressHydrationWarning />
                    <div className="sb-ln w3" suppressHydrationWarning />
                    <div className="sb-ln w4" suppressHydrationWarning />
                    <div className="sb-ln w2" suppressHydrationWarning />
                    <div className="sb-seal" suppressHydrationWarning>SEAL</div>
                    <div className="sb-box" suppressHydrationWarning />
                    <div className="sb-beam" suppressHydrationWarning />
                  </div>
                </div>
                <div className="sb-float f2" suppressHydrationWarning>
                  <span className="ci">
                    <svg className="sb-i"><use href="#sb-shield" /></svg>
                  </span>
                  <div>
                    <small>Forensic check</small>
                    <b>Low risk</b>
                  </div>
                </div>
              </div>
            </article>

            {/* 3. Wide Card: Release Request Tracking & Maturity Alerts */}
            <article
              className="sb-card wide sb-wide sb-rv"
              style={{ "--d": 3 } as React.CSSProperties}
              onPointerMove={handlePointerMove}
              suppressHydrationWarning
            >
              <div className="l" suppressHydrationWarning>
                <div className="sb-ico" suppressHydrationWarning>
                  <svg className="sb-i"><use href="#sb-clock" /></svg>
                </div>
                <h3 suppressHydrationWarning>Release Request Tracking &amp; Maturity Alerts</h3>
                <p className="d" suppressHydrationWarning>
                  Follow every release request from submission to official approval, and get alerted before each maturity date.
                </p>
                <ul className="sb-ticks" suppressHydrationWarning>
                  <li suppressHydrationWarning>
                    <span className="k">
                      <svg className="sb-i"><use href="#sb-check" /></svg>
                    </span>
                    Automated alerts before every maturity date
                  </li>
                  <li suppressHydrationWarning>
                    <span className="k">
                      <svg className="sb-i"><use href="#sb-check" /></svg>
                    </span>
                    Role-based access with complete audit logs
                  </li>
                  <li suppressHydrationWarning>
                    <span className="k">
                      <svg className="sb-i"><use href="#sb-check" /></svg>
                    </span>
                    Human approval on every final decision
                  </li>
                </ul>
                <button className="btn-dark" suppressHydrationWarning>
                  <span>Request a demo</span>
                  <span className="sb-btn-circle" aria-hidden="true" suppressHydrationWarning>
                    <svg className="sb-btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="r" suppressHydrationWarning>
                <div className="sb-req" suppressHydrationWarning>
                  <div className="sb-req-h" suppressHydrationWarning>
                    <div>
                      <b>Release Request #RR-2041</b>
                      <small>Submitted by College Portal</small>
                    </div>
                    <span className="sb-chip">Under review</span>
                  </div>

                  <div className="sb-track" suppressHydrationWarning>
                    <div className="sb-nd done" style={{ "--n": 0 } as React.CSSProperties} suppressHydrationWarning>
                      <i><svg className="sb-i"><use href="#sb-check" /></svg></i>
                      Submitted
                    </div>
                    <div className="sb-nd done" style={{ "--n": 1 } as React.CSSProperties} suppressHydrationWarning>
                      <i><svg className="sb-i"><use href="#sb-check" /></svg></i>
                      Verified
                    </div>
                    <div className="sb-nd cur" suppressHydrationWarning>
                      <i><svg className="sb-i"><use href="#sb-clock" /></svg></i>
                      Review
                    </div>
                    <div className="sb-nd" suppressHydrationWarning>
                      <i><svg className="sb-i"><use href="#sb-lock" /></svg></i>
                      Released
                    </div>
                  </div>

                  <div className="sb-mini" suppressHydrationWarning>
                    <div suppressHydrationWarning>
                      <small>Pending cases</small>
                      <b data-count="94" data-delay="1000">0</b>
                    </div>
                    <div suppressHydrationWarning>
                      <small>FDRs tracked</small>
                      <b data-count="1284" data-delay="1100">0</b>
                    </div>
                  </div>

                  <div className="sb-log" suppressHydrationWarning>
                    <div style={{ "--r": 0 } as React.CSSProperties} suppressHydrationWarning>
                      <i className="gn" />
                      Documents verified by officer
                      <small>6 mins ago</small>
                    </div>
                    <div style={{ "--r": 1 } as React.CSSProperties} suppressHydrationWarning>
                      <i className="rd" />
                      Mismatch flagged on FD-48199
                      <small>20 mins ago</small>
                    </div>
                    <div style={{ "--r": 2 } as React.CSSProperties} suppressHydrationWarning>
                      <i />
                      Maturity alert sent to institution
                      <small>1 hr ago</small>
                    </div>
                  </div>
                </div>

                <div className="sb-people" suppressHydrationWarning>
                  <div className="sb-av" suppressHydrationWarning>
                    <i style={{ background: "#2D6A4F" }}>DE</i>
                    <i style={{ background: "#4C6FFF" }}>KB</i>
                    <i style={{ background: "#C7872B" }}>EL</i>
                    <i style={{ background: "#B0508B" }}>PS</i>
                  </div>
                  <div suppressHydrationWarning>
                    <small>Officials online</small>
                    <b>24</b>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
