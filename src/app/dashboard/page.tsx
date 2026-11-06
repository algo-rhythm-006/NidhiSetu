import React from "react";
import type { Metadata } from "next";
import Dashboard from "@frontend/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "NidhiSetu Dashboard — FDR Verification & Regulatory Oversight",
  description: "AI-driven FDR registry, cryptographic liquidity verification, and regulatory scrutiny console.",
};

export default function DashboardPage() {
  return <Dashboard />;
}

