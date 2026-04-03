"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function PaiementConfirmePage() {
  return (
    <div className="hero-dark hero-grid flex min-h-screen items-center justify-center px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[rgba(52,211,153,0.08)] blur-[120px]" />
        <div className="absolute h-[400px] w-[400px] rounded-full bg-[rgba(176,141,87,0.06)] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease }}
        className="relative z-10 mx-auto max-w-md text-center"
      >
        {/* Icône succès */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 inline-flex"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)]"
            style={{ boxShadow: "0 0 48px rgba(52,211,153,0.2)" }}
          >
            <CheckCircle2 size={44} style={{ color: "#34d399" }} />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.4 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
        >
          <Sparkles size={9} /> Abonnement activé
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.5 }}
          className="mb-4 text-4xl font-black text-white"
        >
          Bienvenue dans votre espace !
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.65 }}
          className="mb-2 text-base leading-relaxed text-white/55"
        >
          Votre paiement de <span className="font-bold text-white">11,90 €</span> a bien été reçu.
          Vos identifiants vous ont été envoyés par email.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.75 }}
          className="mb-10 text-sm text-white/35"
        >
          Vous pouvez accéder à votre espace client dès maintenant.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.85 }}
          className="flex flex-col items-center gap-3"
        >
          <Link
            href="/client"
            className="btn-primary w-full max-w-xs justify-center py-4 text-base"
          >
            <LayoutDashboard size={17} />
            Accéder à mon espace
            <ArrowRight size={15} />
          </Link>
          <Link href="/" className="text-sm text-white/30 underline underline-offset-2 hover:text-white/60 transition-colors">
            Retour à l&apos;accueil
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
