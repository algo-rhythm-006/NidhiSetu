import React from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Verification Console — NidhiSetu FDR Sentinel",
  description: "Cryptographic liquidity verification and AICTE scrutiny audit console.",
};

export default function VerificationPage() {
  return <Dashboard initialTab="verifications" />;
}

