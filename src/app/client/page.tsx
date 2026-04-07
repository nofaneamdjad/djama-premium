"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  StickyNote, Calendar, ReceiptText,
  Sparkles, ArrowRight, Shield, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

/* ═══════════════════════════════════════════════
   OUTILS
═══════════════════════════════════════════════ */
const TOOLS = [
  {
    id: "notes",
    href: "/client/notes",
    icon: StickyNote,
    label: "Bloc-notes",
    desc: "Créez, organisez et exportez vos notes professionnelles par catégorie.",
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.07)",
    border: "rgba(201,165,90,0.16)",
    hoverBorder: "rgba(201,165,90,0.45)",
    glow: "rgba(201,165,90,0.14)",
    tags: ["Réunion", "Idées", "Tâches", "Export PDF"],
  },
  {
    id: "planning",
    href: "/client/planning",
    icon: Calendar,
    label: "Planning & Agenda",
    desc: "Visualisez et gérez votre agenda client semaine par semaine.",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.16)",
    hoverBorder: "rgba(59,130,246,0.45)",
    glow: "rgba(59,130,246,0.12)",
    tags: ["Semaine", "Rendez-vous", "Calendrier"],
  },
  {
    id: "factures",
    href: "/client/factures",
    icon: ReceiptText,
    label: "Factures & Devis",
    desc: "Générez des factures et devis professionnels en PDF en quelques secondes.",
    color: "#4ade80",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.16)",
    hoverBorder: "rgba(34,197,94,0.45)",
    glow: "rgba(34,197,94,0.12)",
    tags: ["PDF", "TVA", "Logo", "Devis"],
  },
] as const;

/* ═══════════════════════════════════════════════
   CARTE OUTIL
═══════════════════════════════════════════════ */
function ToolCard({ tool, delay }: { tool: (typeof TOOLS)[number]; delay: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease, delay }}
      whileHover={{ y: -4, transition: { duration: 0.22, ease } }}
    >
      <Link href={tool.href} className="group block h-full">
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-7 transition-all duration-300"
          style={{ background: tool.bg, borderColor: tool.border }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = tool.hoverBorder;
            el.style.boxShadow = `0 16px 56px ${tool.glow}`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = tool.border;
            el.style.boxShadow = "none";
          }}
        >
          {/* Coin glow */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-30 blur-[60px]"
            style={{ background: tool.color }}
          />

          {/* Icône */}
          <div
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border"
            style={{ color: tool.color, background: tool.bg, borderColor: tool.border }}
          >
            <Icon size={22} />
          </div>

          <h3 className="mb-2 text-xl font-extrabold text-white">{tool.label}</h3>
          <p className="mb-6 flex-1 text-sm leading-relaxed text-white/40">{tool.desc}</p>

          {/* Tags */}
          <div className="mb-7 flex flex-wrap gap-1.5">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
                style={{ color: tool.color, background: tool.bg, border: `1px solid ${tool.border}` }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div
            className="flex items-center gap-2 text-sm font-bold transition-all duration-200 group-hover:gap-3"
            style={{ color: tool.color }}
          >
            Ouvrir l&apos;outil
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE DASHBOARD
═══════════════════════════════════════════════ */
export default function ClientDashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login?redirect=/client";
        return;
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-[#080a0f]">

      {/* ── Glows + grille ───────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[25%] top-[8%] h-[650px] w-[650px] rounded-full bg-[rgba(176,141,87,0.05)] blur-[160px]" />
        <div className="absolute bottom-[5%] right-[15%] h-[450px] w-[450px] rounded-full bg-[rgba(59,130,246,0.04)] blur-[130px]" />
        <div className="absolute bottom-[30%] left-[5%] h-[350px] w-[350px] rounded-full bg-[rgba(139,92,246,0.03)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.013]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Contenu ──────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-14">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            <Sparkles size={9} />
            Tableau de bord
          </div>

          <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            Bonjour, bienvenue 👋
          </h2>
          <p className="mt-3 max-w-lg text-base text-white/35">
            Vos{" "}
            <span className="font-semibold text-white/60">3 outils professionnels</span>{" "}
            sont disponibles ci-dessous. Cliquez sur un outil pour commencer.
          </p>
        </motion.div>

        {/* ── 3 cartes outils ──────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} delay={0.08 + i * 0.1} />
          ))}
        </div>

        {/* ── Barre info bas ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55, ease }}
          className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/6 bg-[rgba(15,17,23,0.5)] px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <Shield size={14} className="shrink-0 text-white/20" />
            <p className="text-xs text-white/35">
              Accès sécurisé · abonnement{" "}
              <span className="font-semibold text-[#c9a55a]">11,90 €/mois</span> · outils exclusifs DJAMA
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-white/25 transition hover:text-white/50"
          >
            Retour au site <ChevronRight size={11} />
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
