import type { Metadata } from "next";
import { gebuk } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "NidhiSetu — AICTE FDR Sentinel | Institutional FDR Verification Platform",
  description:
    "Official verification, lifecycle monitoring, and compliance assurance platform for Fixed Deposit Receipts under AICTE regulatory oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased scroll-smooth ${gebuk.variable} ${gebuk.className}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
