"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export default function ClientNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-sm"
      >
        {/* 404 */}
        <div
          className="mb-6 select-none text-[5rem] font-black leading-none tracking-tighter"
          style={{
            background: "linear-gradient(135deg, #c9a55a 0%, #e8cc94 50%, #c9a55a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <h2 className="mb-3 text-xl font-extrabold text-white">
          Page introuvable
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/40">
          Cette page n&apos;existe pas dans votre espace client. Retournez au tableau de bord.
        </p>

        <Link
          href="/client"
          className="inline-flex items-center gap-2 rounded-xl bg-[#c9a55a] px-7 py-3 text-sm font-bold text-[#09090b] shadow-[0_8px_24px_rgba(201,165,90,0.28)] transition hover:bg-[#d9b56a]"
        >
          <LayoutDashboard size={15} />
          Tableau de bord
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    </div>
  );
}
