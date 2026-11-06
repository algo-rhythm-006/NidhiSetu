import CollegeLogin from "@/components/auth/CollegeLogin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "College Login · NidhiSetu Institutional FDR Sentinel",
  description: "Secure login portal for colleges and universities to manage Fixed Deposit Receipts under AICTE regulatory oversight.",
};

export default function CollegeLoginPage() {
  return <CollegeLogin />;
}

