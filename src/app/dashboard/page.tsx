import React from "react";
import type { Metadata } from "next";
import Dashboard from "@frontend/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "NidhiSetu Dashboard — FDR Verification & Regulatory Oversight",
  description: "AI-driven FDR registry, cryptographic liquidity verification, and regulatory scrutiny console.",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function DashboardPage() {
  return <Dashboard />;
}

