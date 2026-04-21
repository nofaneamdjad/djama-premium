// Shared layout component for legal pages — server component, no "use client"
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b]">

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/[.06] bg-[#0f0f13] py-14 sm:py-20">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[200px] w-[500px] rounded-full bg-[rgba(201,165,90,.05)] blur-[80px]" />
        </div>
        <div className="pointer-events-none absolute right-[10%] top-[30%] h-[140px] w-[200px] rounded-full bg-[rgba(96,165,250,.03)] blur-[60px]" />

        <div className="relative mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[.09] bg-white/[.03] px-3.5 py-1.5 text-[0.72rem] font-semibold text-white/38 transition-all duration-200 hover:border-[rgba(201,165,90,.28)] hover:text-[#c9a55a]"
          >
            <ArrowLeft size={12} />
            Retour à l&apos;accueil
          </Link>

          {/* Gold accent line */}
          <div className="mb-5 h-[2px] w-10 rounded-full bg-gradient-to-r from-[#c9a55a] to-[#c9a55a]/40" />

          <h1 className="text-[1.9rem] font-extrabold leading-tight text-white sm:text-[2.4rem]">
            {title}
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-3.5 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]/60" />
            <span className="text-[0.62rem] font-bold text-white/32">
              Dernière mise à jour : {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div
          className={[
            "max-w-none",
            "text-white/55 text-[0.92rem] leading-relaxed",
            /* headings */
            "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-white/[.07] [&_h2]:pb-2.5",
            "[&_h2]:text-[0.95rem] [&_h2]:font-extrabold [&_h2]:text-white/88 [&_h2]:tracking-wide",
            /* paragraphs */
            "[&_p]:mt-3 [&_p]:leading-[1.85] [&_p]:text-white/55",
            /* lists */
            "[&_ul]:mt-3 [&_ul]:pl-5 [&_ul]:space-y-1.5",
            "[&_li]:text-white/52 [&_li]:leading-relaxed",
            "[&_li::marker]:text-[#c9a55a]",
            /* bold */
            "[&_strong]:text-white/82 [&_strong]:font-semibold",
            /* links */
            "[&_a]:text-[#c9a55a] [&_a]:no-underline [&_a]:transition-opacity [&_a]:duration-150 [&_a:hover]:opacity-75",
          ].join(" ")}
        >
          {children}
        </div>

        {/* Back to home bottom */}
        <div className="mt-16 border-t border-white/[.06] pt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-5 py-2.5 text-sm font-semibold text-white/40 transition-all duration-200 hover:border-[rgba(201,165,90,.28)] hover:text-[#c9a55a]"
          >
            <ArrowLeft size={14} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
