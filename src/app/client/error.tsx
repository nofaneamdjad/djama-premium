"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DJAMA Client Error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-sm"
      >
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.07)]">
            <AlertTriangle size={24} className="text-[#f43f5e]" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-extrabold text-gray-900">
          Erreur de chargement
        </h2>
        <p className="mb-7 text-sm text-gray-500">
          Ce module n&apos;a pas pu se charger. Réessayez ou retournez au tableau de bord.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[#c9a55a] px-6 py-2.5 text-sm font-bold text-[#09090b] transition hover:bg-[#d9b56a]"
          >
            <RefreshCw size={13} />
            Réessayer
          </button>
          <Link
            href="/client"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            <LayoutDashboard size={13} />
            Tableau de bord
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
