"use client";

import React from "react";
import { UpRightArrowIcon } from "./Icons";
import type { ActivityItem } from "./types";

const ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    initials: "DE",
    avatarBg: "linear-gradient(135deg, #2D6A4F, #1B4332)",
    badgeBg: "#2E9B4A",
    badgeIcon: "check",
    name: "David Elson",
    action: "verified FDR #FD-48213",
    time: "6 mins ago",
  },
  {
    id: "act-2",
    initials: "KB",
    avatarBg: "linear-gradient(135deg, #5B6CFF, #3A44B5)",
    badgeBg: "#4C6FFF",
    badgeIcon: "plus",
    name: "Kurt Bates",
    action: "submitted a new FDR",
    time: "16 mins ago",
  },
  {
    id: "act-3",
    initials: "EL",
    avatarBg: "linear-gradient(135deg, #C7872B, #8A5A12)",
    badgeBg: "#D64545",
    badgeIcon: "alert",
    name: "Eddie Lake",
    action: "flagged a mismatch on #FD-48199",
    time: "20 mins ago",
  },
  {
    id: "act-4",
    initials: "PS",
    avatarBg: "linear-gradient(135deg, #B0508B, #7A2F63)",
    badgeBg: "#2E9B4A",
    badgeIcon: "check",
    name: "Patricia Sanders",
    action: "verified 12 FDRs in bulk",
    time: "32 mins ago",
  },
];

export default function RecentActivitiesCard() {
  return (
    <div className="r-sec">
      <div className="r-head">
        <h2>Recent Activities</h2>
        <a href="#activities" className="see" title="See all recent activities">
          <span>See All</span>
          <span className="i">
            <UpRightArrowIcon size={12} />
          </span>
        </a>
      </div>

      <div className="card acts">
        {ACTIVITIES.map((act) => (
          <div key={act.id} className="act">
            <span className="av" style={{ background: act.avatarBg }}>
              {act.initials}
              <i className="badge" style={{ background: act.badgeBg }}>
                {act.badgeIcon === "check" && (
                  <svg viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
                {act.badgeIcon === "plus" && (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                {act.badgeIcon === "alert" && (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 6v8M12 18h.01" />
                  </svg>
                )}
              </i>
            </span>

            <div className="t">
              <b>{act.name}</b> {act.action}
              <small>{act.time}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
