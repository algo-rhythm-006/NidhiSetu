import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NidhiSetu Dashboard — FDR Verification & Regulatory Oversight",
  description: "AI-driven FDR registry, cryptographic liquidity verification, and regulatory scrutiny console.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

