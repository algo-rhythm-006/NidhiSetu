import React from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Institutions — NidhiSetu FDR Sentinel",
  description: "Institutional FDR registry and university accreditation monitoring.",
};

export default function InstitutionsPage() {
  return <Dashboard initialTab="clients" />;
}

