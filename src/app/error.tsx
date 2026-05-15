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
    console.error("[DJAMA Error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(244,63,94,.05)] blur-[130px]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(244,63,94,.2)] bg-[rgba(244,63,94,.07)]">
            <AlertTriangle size={36} className="text-[#f43f5e]" />
          </div>
        </div>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,.22)] bg-[rgba(244,63,94,.06)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[0.22em] text-[#f43f5e]">
          Erreur inattendue
        </div>

        <h1 className="mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Quelque chose s&apos;est mal passé.
        </h1>

        <p className="mb-10 text-base leading-relaxed text-gray-500">
          Une erreur est survenue. Vous pouvez réessayer ou retourner à l&apos;accueil.
          {error.digest && (
            <span className="mt-2 block text-xs text-gray-300">
              Référence : {error.digest}
            </span>
          )}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(201,165,90,.25)] transition-all hover:bg-[#b08d57]"
          >
            <RefreshCw size={15} />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-3.5 text-sm font-semibold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
          >
            <Home size={15} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
