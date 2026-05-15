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
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-[#f8f9fa] py-14 sm:py-20">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[200px] w-[500px] rounded-full bg-[rgba(99,102,241,.04)] blur-[80px]" />
        </div>
        <div className="pointer-events-none absolute right-[10%] top-[30%] h-[140px] w-[200px] rounded-full bg-[rgba(201,165,90,.04)] blur-[60px]" />

        <div className="relative mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[0.72rem] font-semibold text-gray-500 transition-all duration-200 hover:border-[rgba(201,165,90,.4)] hover:text-[#c9a55a] shadow-[0_1px_4px_rgba(0,0,0,.06)]"
          >
            <ArrowLeft size={12} />
            Retour à l&apos;accueil
          </Link>

          {/* Gold accent line */}
          <div className="mb-5 h-[2px] w-10 rounded-full bg-gradient-to-r from-[#c9a55a] to-[#c9a55a]/40" />

          <h1 className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]">
            {title}
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,.05)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]/70" />
            <span className="text-[0.62rem] font-bold text-gray-400">
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
            "text-gray-600 text-[0.92rem] leading-relaxed",
            /* headings */
            "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-2.5",
            "[&_h2]:text-[0.95rem] [&_h2]:font-extrabold [&_h2]:text-gray-800 [&_h2]:tracking-wide",
            /* paragraphs */
            "[&_p]:mt-3 [&_p]:leading-[1.85] [&_p]:text-gray-600",
            /* lists */
            "[&_ul]:mt-3 [&_ul]:pl-5 [&_ul]:space-y-1.5",
            "[&_li]:text-gray-600 [&_li]:leading-relaxed",
            "[&_li::marker]:text-[#c9a55a]",
            /* bold */
            "[&_strong]:text-gray-800 [&_strong]:font-semibold",
            /* links */
            "[&_a]:text-[#6366f1] [&_a]:no-underline [&_a]:transition-opacity [&_a]:duration-150 [&_a:hover]:opacity-75",
          ].join(" ")}
        >
          {children}
        </div>

        {/* Back to home bottom */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:border-[rgba(201,165,90,.4)] hover:text-[#c9a55a]"
          >
            <ArrowLeft size={14} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
