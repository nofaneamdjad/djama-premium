"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  StickyNote, Calendar, ReceiptText, Sparkles,
  ArrowRight, Shield, ChevronRight,
  Timer, Users, Wallet, CreditCard, FileText, Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { NotificationsResponse } from "@/lib/assistant/types";

const ease = [0.16, 1, 0.3, 1] as const;

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/* ═══════════════════════════════════════════════
   OUTILS ACTIFS
═══════════════════════════════════════════════ */
type ActiveTool = {
  id:          string;
  href:        string;
  icon:        React.ElementType;
  label:       string;
  desc:        string;
  color:       string;
  bg:          string;
  border:      string;
  hoverBorder: string;
  glow:        string;
  tags:        readonly string[];
};

const ACTIVE_TOOLS: ActiveTool[] = [
  {
    id: "notes",
    href: "/client/notes",
    icon: StickyNote,
    label: "Bloc-notes IA",
    desc: "Notes professionnelles avec résumé et export PDF automatiques.",
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.07)",
    border: "rgba(201,165,90,0.16)",
    hoverBorder: "rgba(201,165,90,0.45)",
    glow: "rgba(201,165,90,0.14)",
    tags: ["Réunion", "Export PDF"],
  },
  {
    id: "planning",
    href: "/client/planning",
    icon: Calendar,
    label: "Planning & Agenda",
    desc: "Visualisez votre agenda client semaine par semaine.",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.16)",
    hoverBorder: "rgba(59,130,246,0.45)",
    glow: "rgba(59,130,246,0.12)",
    tags: ["Semaine", "RDV"],
  },
  {
    id: "factures",
    href: "/client/factures",
    icon: ReceiptText,
    label: "Factures & Devis",
    desc: "Générez factures et devis professionnels en PDF.",
    color: "#4ade80",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.16)",
    hoverBorder: "rgba(34,197,94,0.45)",
    glow: "rgba(34,197,94,0.12)",
    tags: ["PDF", "TVA"],
  },
];

/* ═══════════════════════════════════════════════
   NOUVEAUX OUTILS ACTIFS
═══════════════════════════════════════════════ */
const SECONDARY_TOOLS = [
  { id: "crm",        href: "/client/crm",        icon: Users,      label: "CRM Client",   desc: "Gérez vos contacts et votre pipeline.",        color: "#60a5fa", border: "rgba(59,130,246,0.18)", hover: "rgba(59,130,246,0.40)" },
  { id: "chrono",     href: "/client/chrono",     icon: Timer,      label: "Chrono Pro",   desc: "Suivez votre temps par projet et client.",      color: "#a78bfa", border: "rgba(139,92,246,0.18)",  hover: "rgba(139,92,246,0.40)"  },
  { id: "depenses",   href: "/client/depenses",   icon: CreditCard, label: "Dépenses Pro", desc: "Enregistrez vos dépenses en 1 clic.",           color: "#f97316", border: "rgba(249,115,22,0.18)", hover: "rgba(249,115,22,0.40)"  },
  { id: "tresorerie", href: "/client/tresorerie", icon: Wallet,     label: "Trésorerie",   desc: "Flux de trésorerie et prévisions en temps réel.",color: "#4ade80", border: "rgba(74,222,128,0.18)", hover: "rgba(74,222,128,0.40)"  },
  { id: "contrats",   href: "/client/contrats",   icon: FileText,   label: "Contrats IA",  desc: "Générez et gérez vos contrats types avec l'IA.", color: "#c9a55a", border: "rgba(201,165,90,0.18)", hover: "rgba(201,165,90,0.40)"  },
  { id: "reputation", href: "/client/reputation", icon: Star,       label: "Réputation",   desc: "Collectez et valorisez vos avis clients.",      color: "#f59e0b", border: "rgba(245,158,11,0.18)", hover: "rgba(245,158,11,0.40)"  },
];

/* ═══════════════════════════════════════════════
   CARTE OUTIL ACTIF
═══════════════════════════════════════════════ */
function ActiveToolCard({
  tool, delay, isRecent, onOpen,
}: {
  tool: ActiveTool; delay: number; isRecent: boolean; onOpen: () => void;
}) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2, ease } }}
    >
      <Link href={tool.href} onClick={onOpen} className="group block h-full">
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300"
          style={{ background: tool.bg, borderColor: tool.border }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = tool.hoverBorder;
            el.style.boxShadow = `0 12px 40px ${tool.glow}`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = tool.border;
            el.style.boxShadow = "none";
          }}
        >
          {/* Coin glow */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full opacity-20 blur-[50px]"
            style={{ background: tool.color }}
          />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ color: tool.color, background: tool.bg, borderColor: tool.border }}
            >
              <Icon size={18} />
            </div>
            <div className="flex items-center gap-1.5">
              {isRecent && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/25 font-bold uppercase tracking-wider">
                  Récent
                </span>
              )}
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{ color: tool.color, background: "rgba(255,255,255,0.04)", border: `1px solid ${tool.border}` }}
              >
                Actif
              </span>
            </div>
          </div>

          <h3 className="relative text-[15px] font-extrabold text-white mb-1.5">{tool.label}</h3>
          <p className="relative text-xs leading-snug text-white/35 flex-1 mb-4">{tool.desc}</p>

          {/* Tags */}
          <div className="relative flex flex-wrap gap-1 mb-4">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ color: tool.color, background: tool.bg, border: `1px solid ${tool.border}` }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div
            className="relative flex items-center gap-1.5 text-xs font-bold transition-all duration-200 group-hover:gap-2.5"
            style={{ color: tool.color }}
          >
            Ouvrir l&apos;outil
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
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
  const [ready,          setReady]          = useState(false);
  const [notifs,         setNotifs]         = useState<NotificationsResponse | null>(null);
  const [loadingNotifs,  setLoadingNotifs]  = useState(true);
  const [recentToolIds,  setRecentToolIds]  = useState<string[]>([]);

  /* Auth */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login?redirect=/client"; return; }
      setReady(true);
    });
  }, []);

  /* Notifications pour la carte Assistant */
  useEffect(() => {
    if (!ready) return;
    fetch("/api/assistant/notifications")
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then((data: NotificationsResponse | null) => {
        setNotifs(data);
        setLoadingNotifs(false);
      });
  }, [ready]);

  /* Outils récemment utilisés (localStorage) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("djama_recent_tools");
      if (raw) {
        const data = JSON.parse(raw) as { id: string; at: number }[];
        setRecentToolIds([...data].sort((a, b) => b.at - a.at).map(d => d.id));
      }
    } catch { /* ignore */ }
  }, []);

  const trackUsage = (toolId: string) => {
    try {
      const raw = localStorage.getItem("djama_recent_tools");
      const data: { id: string; at: number }[] = raw ? JSON.parse(raw) : [];
      const filtered = data.filter(d => d.id !== toolId);
      filtered.push({ id: toolId, at: Date.now() });
      localStorage.setItem("djama_recent_tools", JSON.stringify(filtered.slice(-10)));
    } catch { /* ignore */ }
  };

  /* Tri par récence */
  const sortedTools = [...ACTIVE_TOOLS].sort((a, b) => {
    const ai = recentToolIds.indexOf(a.id);
    const bi = recentToolIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-[#080a0f]">

      {/* ── Glows + grille ── */}
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

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-14">

        {/* ── Welcome ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="mb-10"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            <Sparkles size={9} />
            Tableau de bord
          </div>
          <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            Bonjour 👋
          </h2>
          <p className="mt-3 max-w-lg text-base text-white/35">
            Votre suite d&apos;outils professionnels —{" "}
            <span className="font-semibold text-white/60">10 outils actifs</span>
            {" "}disponibles maintenant.
          </p>
        </motion.div>

        {/* ════════════════════════════════════════
            ASSISTANT IA — carte vedette
        ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease, delay: 0.06 }}
          className="mb-8"
        >
          <Link href="/client/assistant" className="group block">
            <div
              className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.2)] p-7 transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(201,165,90,0.09) 0%, rgba(201,165,90,0.03) 60%, transparent 100%)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(201,165,90,0.42)";
                el.style.boxShadow = "0 20px 70px rgba(201,165,90,0.11)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(201,165,90,0.2)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Glows */}
              <div className="pointer-events-none absolute -top-16 right-8 h-64 w-64 rounded-full bg-[rgba(201,165,90,0.07)] blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-8 left-16 h-40 w-40 rounded-full bg-[rgba(201,165,90,0.04)] blur-[60px]" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">

                {/* Gauche : icône + info */}
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.10)]">
                    <Sparkles size={26} className="text-[#c9a55a]" />
                    {!loadingNotifs && notifs && notifs.urgent_count > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#080a0f]">
                        {notifs.urgent_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-extrabold text-white">Assistant IA</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(201,165,90,0.15)] border border-[rgba(201,165,90,0.25)] text-[#c9a55a] font-bold uppercase tracking-wider">
                        Nouveau
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                        Actif
                      </span>
                    </div>
                    <p className="text-sm text-white/38 leading-relaxed mb-3">
                      Coach business IA · Radar argent perdu · Relances intelligentes
                    </p>

                    {/* Pill alertes */}
                    {loadingNotifs ? (
                      <div className="h-7 w-52 animate-pulse rounded-xl bg-white/[0.04]" />
                    ) : notifs && notifs.urgent_count > 0 ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-bold text-red-400">
                          {notifs.urgent_count} alerte{notifs.urgent_count > 1 ? "s" : ""}
                          {" "}· {fmtEur(notifs.total_at_risk)} à récupérer
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/12">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-emerald-400/80">
                          Aucune alerte — tout est à jour
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Droite : CTA */}
                <div className="flex sm:flex-col items-center justify-end flex-shrink-0">
                  <div className="flex items-center gap-2 rounded-2xl border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.12)] px-5 py-2.5 text-sm font-bold text-[#c9a55a] transition-all group-hover:bg-[rgba(201,165,90,0.20)] group-hover:gap-3">
                    Ouvrir
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

              </div>
            </div>
          </Link>
        </motion.div>

        {/* ════════════════════════════════════════
            MES OUTILS
        ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18, ease }}
          className="mb-4 flex items-center gap-3"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">
            Mes outils
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-[10px] text-white/15">3 actifs</span>
        </motion.div>

        <div className="mb-12 grid gap-4 grid-cols-2 lg:grid-cols-3">
          {sortedTools.map((tool, i) => (
            <ActiveToolCard
              key={tool.id}
              tool={tool}
              delay={0.2 + i * 0.08}
              isRecent={recentToolIds.length > 0 && recentToolIds[0] === tool.id}
              onOpen={() => trackUsage(tool.id)}
            />
          ))}
        </div>

        {/* ════════════════════════════════════════
            NOUVEAUX OUTILS
        ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease }}
          className="mb-4 flex items-center gap-3"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">
            Nouveaux outils
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span className="text-[10px] text-white/15">6 actifs</span>
        </motion.div>

        <div className="mb-12 grid gap-3 grid-cols-2 sm:grid-cols-3">
          {SECONDARY_TOOLS.map(({ id, href, icon: Icon, label, desc, color, border, hover }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease, delay: 0.48 + i * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
              onClick={() => trackUsage(id)}
            >
              <Link href={href} className="group flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 h-full transition-all duration-250"
                style={{ borderColor: border, background: `rgba(255,255,255,0.018)` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ color, borderColor: border, background: `rgba(255,255,255,0.04)` }}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{ color, background: "rgba(255,255,255,0.04)", border: `1px solid ${border}` }}>
                    Actif
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-white/80 mb-0.5">{label}</p>
                  <p className="text-xs text-white/28 leading-snug">{desc}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-1.5"
                  style={{ color }}>
                  Ouvrir
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Footer info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.75, ease }}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/6 bg-[rgba(15,17,23,0.5)] px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <Shield size={14} className="shrink-0 text-white/20" />
            <p className="text-xs text-white/35">
              Accès sécurisé · abonnement{" "}
              <span className="font-semibold text-[#c9a55a]">11,90 €/mois</span>
              {" "}· outils exclusifs DJAMA
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
