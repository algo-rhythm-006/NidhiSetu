import AdminLogin from "@/components/auth/AdminLogin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrator Terminal · NidhiSetu Root Governance",
  description: "AICTE Directorate root governance and institutional compliance administration terminal.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}

