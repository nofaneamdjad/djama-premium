import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

const GOLDR = "201,165,90";
const GOLD  = "#c9a55a";

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
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg,#0d0a1e 0%,#080d1a 45%,#060c14 100%)" }}
    >
      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden pb-14 pt-[100px] sm:pt-[120px]"
        style={{ background: "linear-gradient(160deg,#1a0e30 0%,#0d1829 55%,#071525 100%)" }}
      >
        {/* Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[500px] rounded-full blur-[100px]"
            style={{ background: `rgba(${GOLDR},0.07)` }} />
          <div className="absolute right-[10%] top-[40%] h-[160px] w-[160px] rounded-full blur-[55px]"
            style={{ background: "rgba(96,165,250,0.05)" }} />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          {/* Back link */}
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold transition-all duration-200 hover:brightness-110"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <ArrowLeft size={12} />
            Retour à l&apos;accueil
          </Link>

          {/* Icon + badge */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border"
              style={{
                background: `rgba(${GOLDR},0.1)`,
                borderColor: `rgba(${GOLDR},0.25)`,
              }}
            >
              <Scale size={20} style={{ color: GOLD }} />
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: `rgba(${GOLDR},0.25)`, background: `rgba(${GOLDR},0.08)`, color: GOLD }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
              Document légal
            </div>
          </div>

          {/* Gold accent line */}
          <div className="mb-5 h-[2px] w-10 rounded-full" style={{ background: `linear-gradient(90deg,${GOLD},rgba(${GOLDR},0.3))` }} />

          <h1 className="text-[2rem] font-extrabold leading-tight text-white sm:text-[2.6rem]">
            {title}
          </h1>

          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD, opacity: 0.7 }} />
            <span className="text-[0.62rem] font-bold text-white/30">
              Dernière mise à jour : {lastUpdated}
            </span>
          </div>
        </div>

        {/* Fondu bas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: "linear-gradient(to bottom,transparent,rgba(6,12,20,0.7))" }} />
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div
          className={[
            "max-w-none",
            /* headings */
            "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:pb-2.5",
            "[&_h2]:border-b [&_h2]:border-white/[0.07]",
            "[&_h2]:text-[0.95rem] [&_h2]:font-extrabold [&_h2]:tracking-wide",
            /* paragraphs */
            "[&_p]:mt-3 [&_p]:leading-[1.85] [&_p]:text-[0.92rem]",
            /* lists */
            "[&_ul]:mt-3 [&_ul]:pl-5 [&_ul]:space-y-1.5",
            "[&_li]:leading-relaxed [&_li]:text-[0.92rem]",
            /* links */
            "[&_a]:no-underline [&_a]:transition-opacity [&_a]:duration-150 [&_a:hover]:opacity-75",
          ].join(" ")}
          style={{
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <style>{`
            [data-legal] h2 { color: rgba(255,255,255,0.8); }
            [data-legal] p  { color: rgba(255,255,255,0.5); }
            [data-legal] li { color: rgba(255,255,255,0.5); }
            [data-legal] li::marker { color: ${GOLD}; }
            [data-legal] strong { color: rgba(255,255,255,0.8); font-weight: 600; }
            [data-legal] a { color: ${GOLD}; }
          `}</style>
          <div data-legal>
            {children}
          </div>
        </div>

        {/* Séparateur + retour */}
        <div className="mt-16 border-t pt-10" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
            style={{
              borderColor: `rgba(${GOLDR},0.25)`,
              background: `rgba(${GOLDR},0.07)`,
              color: GOLD,
            }}
          >
            <ArrowLeft size={14} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
