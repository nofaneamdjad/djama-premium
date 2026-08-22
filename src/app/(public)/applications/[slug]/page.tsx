"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Calendar, CheckCircle2, Users, Star, Zap as ZapIcon } from "lucide-react";
import { getAppBySlug } from "@/lib/applications-data";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-60px" };

/* ── Mockups UI premium — style dark app ── */
function FeatureVisual({ index, color }: { index: number; color: string; bg?: string }) {
  const c = color;
  const style = index % 4;

  const Shell = ({ children, title = "djama.space" }: { children: React.ReactNode; title?: string }) => (
    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: "#111827" }}>
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <span className="ml-2 flex-1 rounded bg-white/8 px-3 py-1 text-[0.6rem] text-white/30">{title}</span>
      </div>
      {children}
    </div>
  );

  if (style === 0) {
    /* Dashboard analytique — courbe + KPIs + mini tableau */
    const pts = "0,90 40,72 80,80 120,52 160,60 200,28 240,38 280,20 320,32 360,10 400,18";
    const area = `${pts} 400,110 0,110`;
    const bars = [55, 72, 48, 88, 62, 95, 78];
    return (
      <Shell title="djama.space · Tableau de bord">
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar mini */}
          <div className="flex w-10 flex-col items-center gap-4 border-r border-white/8 py-4">
            {[c, "rgba(255,255,255,0.2)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.12)"].map((bg, i) => (
              <div key={i} className="h-6 w-6 rounded-lg" style={{ background: bg }} />
            ))}
          </div>
          {/* Contenu principal */}
          <div className="flex-1 p-4">
            {/* KPIs */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[["CA", "24 380 €", "+18%"], ["Clients", "48", "+3"], ["Marge", "66 %", "+2pt"]].map(([l, v, d]) => (
                <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[0.58rem] font-semibold uppercase tracking-wider" style={{ color: c }}>{l}</p>
                  <p className="mt-0.5 text-[1rem] font-extrabold text-white">{v}</p>
                  <p className="text-[0.6rem] text-green-400">{d}</p>
                </div>
              ))}
            </div>
            {/* Courbe SVG */}
            <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[0.62rem] font-semibold text-white/60">Revenus · 30 derniers jours</p>
                <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold" style={{ background: `${c}25`, color: c }}>+18% vs mois précédent</span>
              </div>
              <svg viewBox="0 0 400 110" className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`grd-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={c} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={area} fill={`url(#grd-${index})`} />
                <polyline points={pts} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="400" cy="18" r="4" fill={c} />
              </svg>
            </div>
            {/* Barres mini */}
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="mb-2 text-[0.58rem] font-semibold text-white/50">Ventes par semaine</p>
              <div className="flex items-end gap-1.5" style={{ height: 40 }}>
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? c : `${c}40` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (style === 1) {
    /* Liste détaillée — tableau app avec lignes riches */
    const rows = [
      { ref: "#2024-089", client: "Entreprise Soleil", date: "21 août", montant: "3 200 €", statut: "Envoyée", dot: "#22c55e" },
      { ref: "#2024-088", client: "Cabinet Martin & Co", date: "18 août", montant: "1 850 €", statut: "Payée",   dot: c },
      { ref: "#2024-087", client: "SARL Technova",       date: "14 août", montant: "640 €",   statut: "En retard",dot: "#ef4444" },
      { ref: "#2024-086", client: "Freelance A. Diop",   date: "10 août", montant: "2 100 €", statut: "Payée",   dot: c },
    ];
    return (
      <Shell title="djama.space · Factures">
        <div style={{ minHeight: 340 }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <div className="flex gap-2">
              {["Toutes", "Payées", "En attente"].map((t, i) => (
                <span key={t} className="rounded-lg px-3 py-1 text-[0.65rem] font-semibold"
                  style={i === 0 ? { background: `${c}25`, color: c } : { color: "rgba(255,255,255,0.4)" }}>{t}</span>
              ))}
            </div>
            <div className="h-6 w-24 rounded-lg" style={{ background: c }} />
          </div>
          {/* Entêtes col */}
          <div className="grid grid-cols-4 border-b border-white/6 px-4 py-2" style={{ gridTemplateColumns: "1fr 1.5fr auto auto" }}>
            {["Référence", "Client", "Montant", "Statut"].map(h => (
              <span key={h} className="text-[0.58rem] font-bold uppercase tracking-wider text-white/30">{h}</span>
            ))}
          </div>
          {/* Lignes */}
          <div className="divide-y divide-white/5">
            {rows.map((r, i) => (
              <div key={i} className="grid items-center px-4 py-3 transition-colors hover:bg-white/[0.03]"
                style={{ gridTemplateColumns: "1fr 1.5fr auto auto" }}>
                <span className="text-[0.72rem] font-mono text-white/70">{r.ref}</span>
                <div>
                  <p className="text-[0.72rem] font-semibold text-white/90">{r.client}</p>
                  <p className="text-[0.6rem] text-white/35">{r.date}</p>
                </div>
                <span className="text-[0.75rem] font-bold text-white mr-4">{r.montant}</span>
                <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                  style={{ background: `${r.dot}20`, color: r.dot }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />{r.statut}
                </span>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5">
            <span className="text-[0.62rem] text-white/30">4 résultats · Total : 7 790 €</span>
            <div className="flex gap-1">
              {[1,2,3].map(n => (
                <span key={n} className="flex h-5 w-5 items-center justify-center rounded text-[0.6rem]"
                  style={n === 1 ? { background: c, color: "#000" } : { color: "rgba(255,255,255,0.3)" }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (style === 2) {
    /* Assistant IA — interface chat */
    const msgs = [
      { me: false, text: "Génère un devis pour Entreprise Soleil — Projet web 3 mois, budget 12 000 €" },
      { me: true, text: "✓ Devis créé · Réf. DEV-2024-047 · 12 000 € HT · Validité 30 jours" },
      { me: false, text: "Ajoute une ligne option maintenance mensuelle à 350 €/mois" },
      { me: true, text: "✓ Ligne ajoutée · Nouveau total : 12 350 € HT (+ options récurrentes)" },
    ];
    return (
      <Shell title="djama.space · Assistant IA">
        <div style={{ minHeight: 340 }}>
          {/* Entête chat */}
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${c}30` }}>
              <span className="text-[0.7rem] font-extrabold" style={{ color: c }}>IA</span>
            </div>
            <div>
              <p className="text-[0.75rem] font-bold text-white">Assistant DJAMA</p>
              <p className="text-[0.6rem] text-green-400">● En ligne · Répond en &lt; 2s</p>
            </div>
          </div>
          {/* Messages */}
          <div className="flex flex-col gap-3 px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-[0.72rem] leading-relaxed"
                  style={m.me
                    ? { background: `${c}20`, color: c, borderBottomLeftRadius: 4 }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", borderBottomRightRadius: 4 }
                  }>
                  {m.text}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl px-3 py-2" style={{ background: `${c}15`, borderBottomLeftRadius: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: c, opacity: 0.4 + i * 0.3 }} />
                ))}
              </div>
            </div>
          </div>
          {/* Input */}
          <div className="border-t border-white/8 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-2 w-32 rounded-full bg-white/20" />
              <div className="ml-auto h-6 w-6 rounded-lg" style={{ background: c }} />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* style === 3 : Calendrier / Planner */
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const nums = [19, 20, 21, 22, 23, 24, 25];
  const events = [
    { day: 0, label: "Réunion équipe", time: "9h00", h: 40 },
    { day: 1, label: "Appel client", time: "11h30", h: 30 },
    { day: 2, label: "Présentation", time: "14h00", h: 50 },
    { day: 4, label: "Démo DJAMA", time: "16h00", h: 35 },
  ];
  return (
    <Shell title="djama.space · Planification">
      <div style={{ minHeight: 340 }}>
        {/* Nav semaine */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
          <span className="text-[0.7rem] font-bold text-white/70">Semaine du 19 août 2026</span>
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-lg bg-white/8" />
            <div className="h-6 w-6 rounded-lg bg-white/8" />
            <div className="h-6 w-20 rounded-lg" style={{ background: c }} />
          </div>
        </div>
        {/* Grille jours */}
        <div className="grid px-3 py-2" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((d, i) => (
            <div key={i} className="text-center">
              <p className="text-[0.58rem] font-semibold text-white/30">{d}</p>
              <p className={`mt-1 rounded-full py-0.5 text-[0.75rem] font-bold ${i === 2 ? "text-black" : "text-white/70"}`}
                style={i === 2 ? { background: c } : {}}>{nums[i]}</p>
            </div>
          ))}
        </div>
        {/* Zone événements */}
        <div className="relative px-3 pb-3" style={{ minHeight: 200 }}>
          <div className="grid h-full" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4, height: 190 }}>
            {Array.from({ length: 7 }).map((_, col) => {
              const ev = events.find(e => e.day === col);
              return (
                <div key={col} className="relative rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {ev && (
                    <div className="absolute left-1 right-1 top-4 rounded-lg px-1.5 py-1" style={{ background: col === 2 ? c : `${c}30`, height: ev.h }}>
                      <p className="text-[0.58rem] font-bold leading-tight" style={{ color: col === 2 ? "#000" : c }}>{ev.label}</p>
                      <p className="text-[0.52rem]" style={{ color: col === 2 ? "#00000080" : `${c}80` }}>{ev.time}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* Mockup UI générique dark pour chaque app */
function AppMockup({ app }: { app: ReturnType<typeof getAppBySlug> & object }) {
  const AppIcon = app.icon;
  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: "linear-gradient(135deg,#1e1b2e 0%,#15122a 60%,#0f0d1f 100%)" }}
    >
      {/* Barre titre */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <span className="ml-2 flex-1 rounded bg-white/8 px-3 py-1 text-[0.65rem] text-white/30">
          djama.space · {app.label}
        </span>
      </div>

      {/* Sidebar + Contenu */}
      <div className="flex min-h-[320px] sm:min-h-[400px]">
        {/* Sidebar */}
        <div className="hidden w-44 border-r border-white/8 px-3 py-4 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: app.bg }}>
              <AppIcon size={16} style={{ color: app.color }} />
            </div>
            <div className="h-2 w-16 rounded-full bg-white/20" />
          </div>
          {[0.9, 0.6, 0.75, 0.5, 0.65, 0.45].map((op, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: app.color, opacity: i === 0 ? 1 : 0.35 }} />
              <div className="h-1.5 rounded-full bg-white/20" style={{ width: `${op * 80}px` }} />
            </div>
          ))}
        </div>

        {/* Zone principale */}
        <div className="flex-1 px-5 py-5">
          {/* Barre actions */}
          <div className="mb-5 flex items-center justify-between">
            <div className="h-2.5 w-24 rounded-full bg-white/20" />
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-lg" style={{ background: GOLD, opacity: 0.9 }} />
              <div className="h-7 w-7 rounded-lg bg-white/10" />
            </div>
          </div>

          {/* Table / Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: i === 0 ? `${app.color}18` : "rgba(255,255,255,0.04)", border: i === 0 ? `1px solid ${app.color}30` : "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded" style={{ background: app.bg, opacity: 0.8 }}>
                    <AppIcon size={12} style={{ color: app.color, margin: "6px auto", display: "block" }} />
                  </div>
                  <div className="h-2 w-16 rounded-full bg-white/25" />
                </div>
                <div className="mb-1 h-5 w-12 rounded-md" style={{ background: `${app.color}50` }} />
                <div className="h-1.5 w-20 rounded-full bg-white/15" />
                <div className="mt-1 h-1.5 w-14 rounded-full bg-white/10" />
              </div>
            ))}
          </div>

          {/* Graph ligne */}
          <div className="mt-4 rounded-xl bg-white/[0.03] p-3">
            <div className="mb-2 h-1.5 w-20 rounded-full bg-white/20" />
            <svg viewBox="0 0 240 48" className="w-full" fill="none">
              <path d="M0 40 C30 35 50 20 80 22 C110 24 120 10 150 8 C175 6 200 18 240 12" stroke={app.color} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
              <path d="M0 40 C30 35 50 20 80 22 C110 24 120 10 150 8 C175 6 200 18 240 12 V48 H0Z" fill={`${app.color}15`} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const AppIcon = app.icon;
  const crossApp = app.crossSell ? getAppBySlug(app.crossSell.slug) : undefined;
  const CrossIcon = crossApp?.icon;

  return (
    <main className="min-h-screen bg-white">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-100 bg-white px-6 pt-[88px]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 py-3 text-[0.78rem] text-gray-400">
          <Link href="/applications" className="flex items-center gap-1 transition-colors hover:text-gray-700">
            <ArrowLeft size={12} /> Toutes les applications
          </Link>
          <span>/</span>
          <span style={{ color: app.color }} className="font-semibold">{app.category}</span>
          <span>/</span>
          <span className="text-gray-600">{app.label}</span>
        </div>
      </div>

      {/* ── Hero — split layout Odoo ── */}
      <section className="overflow-hidden bg-white px-6 pb-0 pt-12 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: app.bg }}
                >
                  <AppIcon size={20} style={{ color: app.color }} />
                </span>
                <span
                  className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em]"
                  style={{ color: app.color }}
                >
                  {app.category}
                </span>
              </div>

              <h1 className="text-[2.2rem] font-extrabold leading-[1.1] text-gray-900 sm:text-[3rem]">
                {app.hero.title}
              </h1>
              <p className="mt-5 text-[1.05rem] leading-relaxed text-gray-500">
                {app.hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/espace-client"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[0.95rem] font-extrabold text-black shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                >
                  Lancez-vous — C&apos;est gratuit ! <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-[0.95rem] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <Calendar size={15} />
                  Rencontrer un conseiller
                </Link>
              </div>

              {/* Réassurance */}
              <div className="mt-6 flex flex-wrap gap-4 text-[0.8rem] text-gray-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> Accès instantané</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> Aucune carte requise</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> IA native incluse</span>
              </div>
            </motion.div>

            {/* Mockup — dépasse visuellement en bas */}
            <motion.div
              initial={{ opacity: 0, x: 24, y: 16 }} animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="relative lg:translate-y-8"
            >
              <AppMockup app={app} />
              {/* Reflet bas */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 left-4 right-4 h-8 blur-xl"
                style={{ background: `${app.color}30` }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bandeau valeur — fond coloré léger ── */}
      <section className="mt-24 px-6 py-10" style={{ background: `${app.bg}80` }}>
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="flex items-start gap-4 sm:items-center"
          >
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 sm:mt-0" style={{ color: app.color }} />
            <p className="text-[1.05rem] font-medium leading-relaxed text-gray-700">
              {app.valueProposition}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Fonctionnalités — sections alternées Odoo ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-16 text-center"
          >
            <h2 className="text-[2rem] font-extrabold text-gray-900 sm:text-[2.6rem]">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-3 text-[0.95rem] text-gray-500">
              {app.label} inclut toutes les fonctionnalités clés pour votre activité, enrichies par l&apos;IA.
            </p>
          </motion.div>

          <div className="flex flex-col gap-20 sm:gap-28">
            {app.features.map((feat, i) => {
              const FeatIcon = feat.icon;
              const reverse = i % 2 !== 0;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.55, ease }}
                  className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:direction-rtl" : ""}`}
                >
                  {/* Texte */}
                  <div className={reverse ? "lg:order-2" : ""}>
                    <div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: app.bg }}
                    >
                      <FeatIcon size={24} style={{ color: app.color }} />
                    </div>
                    <h3 className="text-[1.6rem] font-extrabold text-gray-900 sm:text-[2rem]">
                      {feat.title}
                    </h3>
                    <p className="mt-4 text-[1rem] leading-relaxed text-gray-500">
                      {feat.description}
                    </p>
                    <Link
                      href="/espace-client"
                      className="mt-6 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold transition-colors"
                      style={{ color: app.color }}
                    >
                      Essayer maintenant <ArrowRight size={14} />
                    </Link>
                  </div>

                  {/* Visuel */}
                  <div className={reverse ? "lg:order-1" : ""}>
                    <FeatureVisual index={i} color={app.color} bg={app.bg} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bandeau stats ── */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="grid grid-cols-3 divide-x divide-gray-200 text-center"
          >
            {[
              { n: "1 200+", label: "entrepreneurs actifs", icon: Users },
              { n: "4.9/5", label: "satisfaction clients", icon: Star },
              { n: "< 5 min", label: "pour démarrer", icon: ZapIcon },
            ].map(({ n, label, icon: Icon }) => (
              <div key={label} className="px-4 py-4">
                <Icon size={18} className="mx-auto mb-2" style={{ color: app.color }} />
                <p className="text-[1.6rem] font-extrabold text-gray-900 sm:text-[2rem]"
                  style={{ fontFamily: "'Caveat', cursive" }}>{n}</p>
                <p className="mt-0.5 text-[0.75rem] font-medium uppercase tracking-wider text-gray-400">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA principal ── */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-xl"
        >
          <h2 className="text-[2rem] font-extrabold text-gray-900 sm:text-[2.6rem]">
            Prêt à essayer {app.label} ?
          </h2>
          <p className="mt-3 text-[0.95rem] text-gray-500">
            Inclus dans votre abonnement DJAMA · Accès immédiat · IA native
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace-client"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[1rem] font-extrabold text-black shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              Commencer gratuitement <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-8 py-4 text-[1rem] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Calendar size={15} /> Contacter un conseiller
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Cross-sell — style Odoo ── */}
      {app.crossSell && crossApp && CrossIcon && (
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-center text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gray-400">
              Application complémentaire
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease }}
            >
              <Link
                href={`/applications/${app.crossSell.slug}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                    style={{ background: crossApp.bg }}
                  >
                    <CrossIcon size={26} style={{ color: crossApp.color }} />
                  </div>
                  <div>
                    <p className="text-[1rem] font-bold text-gray-900">{crossApp.label}</p>
                    <p className="mt-0.5 text-[0.85rem] text-gray-500">{app.crossSell.teaser}</p>
                  </div>
                </div>
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[0.88rem] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: crossApp.color }}
                >
                  Découvrir <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}
