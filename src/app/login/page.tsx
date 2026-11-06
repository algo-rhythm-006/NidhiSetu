import CollegeLogin from "@/components/auth/CollegeLogin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login · NidhiSetu Institutional FDR Sentinel",
  description: "Secure login for institutions, regulatory officials, and AICTE administrators.",
};

export default function LoginPage() {
  return <CollegeLogin />;
}

