import React from "react";
import Link from "next/link";
import { ShieldCheckIcon } from "../../landing-page/pages/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-[#131313] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F4F4F3] border border-[#E7E7E5] flex items-center justify-center mb-6">
        <ShieldCheckIcon size={32} className="text-[#5F5F5C]" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-[#131313]">Record Not Found</h1>
      <p className="mt-2 text-sm text-[#5F5F5C] max-w-md">
        The requested verification record or page does not exist within the AICTE FDR Sentinel
        registry.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#131313] text-white hover:bg-black transition-all cursor-pointer"
      >
        Return to Platform Home
      </Link>
    </div>
  );
}

