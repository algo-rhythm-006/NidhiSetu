"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { BellIcon, UpRightArrowIcon } from "./Icons";

export default function AdvisorCard() {
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellRef.current) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 3 });
    tl.to(bellRef.current, { rotation: 16, duration: 0.1 })
      .to(bellRef.current, { rotation: -14, duration: 0.12 })
      .to(bellRef.current, { rotation: 10, duration: 0.1 })
      .to(bellRef.current, { rotation: -6, duration: 0.1 })
      .to(bellRef.current, { rotation: 0, duration: 0.15 });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="r-sec">
      <div className="r-head">
        <h2>Verification Advisor</h2>
        <a href="#advisor" className="see" title="See all advisor notifications">
          <span>See All</span>
          <span className="i">
            <UpRightArrowIcon size={12} />
          </span>
        </a>
      </div>

      <div className="card adv">
        <div className="adv-top">
          <div className="bell">
            <div ref={bellRef} id="bellIc" style={{ display: "grid", placeItems: "center" }}>
              <BellIcon size={17} />
            </div>
          </div>
          <div>
            <b>Bulk verification is live</b>
            <p>
              Verify up to 500 FDRs at once and cut manual checking from hours to minutes.
            </p>
          </div>
        </div>

        <div className="foot">
          <button
            type="button"
            className="pill-btn"
            onClick={() => alert("Advisor guide")}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
