import React from "react";
import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Settings — NidhiSetu FDR Sentinel",
  description: "Sentinel configuration, security policies, and workspace settings.",
};

export default function SettingsPage() {
  return <Dashboard initialTab="settings" />;
}

