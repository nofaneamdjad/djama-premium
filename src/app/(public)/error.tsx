"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DJAMA Public Error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(244,63,94,.04)] blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md"
      >
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(244,63,94,.2)] bg-[rgba(244,63,94,.06)]">
            <AlertTriangle size={28} className="text-[#f43f5e]" />
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
          Une erreur est survenue
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          La page n&apos;a pas pu se charger correctement. Réessayez ou revenez à l&apos;accueil.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[#c9a55a] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#b08d57]"
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-7 py-3 text-sm font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            <Home size={14} />
            Accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
