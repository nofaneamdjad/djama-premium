"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { useMemo } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Confetti particle ──────────────────────────────────── */
const COLORS = [
  "#c9a55a", "#e8cc94", "#34d399", "#60a5fa",
  "#a78bfa", "#f472b6", "#fbbf24", "#ffffff",
];

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: 5 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.4,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
        shape: Math.random() > 0.5 ? "circle" : "rect",
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 1, rotate: p.rotate, scale: 1 }}
          animate={{
            y: "110vh",
            x: `calc(${p.x}vw + ${p.drift}px)`,
            opacity: [1, 1, 0],
            rotate: p.rotate + 360 * (Math.random() > 0.5 ? 1 : -1),
            scale: [1, 0.85, 0.5],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 0.6,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            background: p.color,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function PaiementConfirmePage() {
  return (
    <div className="hero-dark hero-grid relative flex min-h-screen items-center justify-center overflow-hidden px-6">

      {/* Confetti */}
      <Confetti />

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
          {/* Pulse ring */}
          <span className="absolute inline-flex h-24 w-24 rounded-full bg-[rgba(52,211,153,0.18)] animate-ping" style={{ animationDuration: "1.4s", animationIterationCount: 2 }} />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)]"
            style={{ boxShadow: "0 0 48px rgba(52,211,153,0.25)" }}
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
          Bienvenue dans votre espace&nbsp;!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.65 }}
          className="mb-2 text-base leading-relaxed text-white/55"
        >
          Votre paiement de{" "}
          <span className="font-bold text-white">11,90&nbsp;€</span> a bien été reçu.
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
          <Link
            href="/"
            className="text-sm text-white/30 underline underline-offset-2 transition-colors hover:text-white/60"
          >
            Retour à l&apos;accueil
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
