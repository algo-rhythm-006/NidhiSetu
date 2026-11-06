import OfficialLogin from "@/components/auth/OfficialLogin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulatory Official Login · NidhiSetu Forensic Sentinel",
  description: "Forensic verification portal for AICTE scrutiny officers and regulatory inspectors.",
};

export default function OfficialLoginPage() {
  return <OfficialLogin />;
}

