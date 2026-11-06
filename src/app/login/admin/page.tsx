import AdminLogin from "@landing/login/admin/login";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrator Terminal · NidhiSetu Root Governance",
  description: "AICTE Directorate root governance and institutional compliance administration terminal.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}

