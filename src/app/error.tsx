"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur côté client (sans exposer les détails à l'utilisateur)
    console.error("[DJAMA Error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] px-6 text-center">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(244,63,94,0.05)] blur-[130px]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md"
      >
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(244,63,94,0.25)] bg-[rgba(244,63,94,0.08)]">
            <AlertTriangle size={36} className="text-[#f43f5e]" />
          </div>
        </div>

        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,0.28)] bg-[rgba(244,63,94,0.07)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[0.22em] text-[#f43f5e]">
          Erreur inattendue
        </div>

        <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
          Quelque chose s&apos;est mal passé.
        </h1>

        <p className="mb-10 text-base leading-relaxed text-white/40">
          Une erreur est survenue. Vous pouvez réessayer ou retourner à l&apos;accueil.
          {error.digest && (
            <span className="mt-2 block text-xs text-white/20">
              Référence : {error.digest}
            </span>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-8 py-3.5 text-sm font-bold text-[#09090b] shadow-[0_8px_28px_rgba(201,165,90,0.28)] transition-all hover:bg-[#d9b56a]"
          >
            <RefreshCw size={15} />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/60 transition-all hover:border-white/20 hover:text-white"
          >
            <Home size={15} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
