import type { Metadata } from "next";
import { gebuk } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "NidhiSetu — AICTE FDR Sentinel | Institutional FDR Verification Platform",
  description:
    "Official verification, lifecycle monitoring, and compliance assurance platform for Fixed Deposit Receipts under AICTE regulatory oversight.",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon-32.png",
    apple: "/apple-touch-icon.png",
  },
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
