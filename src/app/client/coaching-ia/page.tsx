"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, BarChart3, CalendarCheck2, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

const MODULES = [
  {
    icon: Target,
    title: "Objectifs",
    description: "Définissez et suivez vos objectifs personnels et professionnels avec un accompagnement IA.",
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.08)",
    border: "rgba(201,165,90,0.2)",
    soon: false,
  },
  {
    icon: BarChart3,
    title: "Progression",
    description: "Visualisez votre progression semaine après semaine et identifiez vos points de blocage.",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    soon: false,
  },
  {
    icon: CalendarCheck2,
    title: "Sessions",
    description: "Planifiez vos sessions de coaching, accédez aux replays et notes de chaque session.",
    color: "#4ade80",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    soon: true,
  },
  {
    icon: BookOpen,
    title: "Ressources",
    description: "Accédez aux exercices, templates et supports personnalisés de votre programme.",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    soon: true,
  },
];

export default function CoachingIAPage() {
  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[6%] h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.05)] blur-[150px]" />
        <div className="absolute bottom-[10%] right-[8%] h-[400px] w-[400px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-10 sm:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)] shadow-[0_0_40px_rgba(201,165,90,0.12)]">
            <Sparkles size={28} style={{ color: "#c9a55a" }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Espace Coaching IA
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/40">
            Votre accompagnement personnalisé pour atteindre vos objectifs professionnels.
          </p>
        </motion.div>

        {/* Coming soon banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.1 }}
          className="mb-8 overflow-hidden rounded-[1.5rem] border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)]"
        >
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)]">
              <Sparkles size={18} style={{ color: "#c9a55a" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#c9a55a]">Module en cours de déploiement</p>
              <p className="mt-0.5 text-xs text-white/35">
                Votre espace coaching IA sera disponible après activation de votre programme.
                En attendant, utilisez l&apos;Assistant IA pour obtenir de l&apos;aide immédiate.
              </p>
            </div>
            <Link
              href="/client/assistant"
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] px-4 py-2 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.18)] sm:flex"
            >
              Assistant IA <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* Module cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.15 + i * 0.07 }}
                className="relative overflow-hidden rounded-[1.5rem] border bg-[rgba(15,17,23,0.6)] p-5"
                style={{ borderColor: mod.border }}
              >
                {mod.soon && (
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Bientôt
                  </div>
                )}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: mod.bg, border: `1px solid ${mod.border}` }}
                >
                  <Icon size={20} style={{ color: mod.color }} />
                </div>
                <h2 className="text-base font-extrabold text-white">{mod.title}</h2>
                <p className="mt-1.5 text-sm text-white/40 leading-relaxed">{mod.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA assistant */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-4 text-center"
        >
          <p className="text-sm text-white/30">
            En attendant l&apos;ouverture complète du coaching, posez vos questions à votre assistant IA.
          </p>
          <Link
            href="/client/assistant"
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-3 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_24px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_32px_rgba(201,165,90,0.45)] hover:opacity-95"
          >
            <Sparkles size={15} />
            Accéder à l&apos;Assistant IA
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
