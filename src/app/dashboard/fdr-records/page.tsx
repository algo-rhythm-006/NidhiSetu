import React from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "FDR Records — NidhiSetu FDR Sentinel",
  description: "Complete institutional Fixed Deposit Receipt records and deposit status.",
};

export default function FdrRecordsPage() {
  return <Dashboard initialTab="all-fdrs" />;
}

