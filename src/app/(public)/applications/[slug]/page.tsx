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
    const pts = "0,90 40,72 80,80 120,52 160,60 200,28 240,38 280,20 320,32 360,10 400,18";
    const area = `${pts} 400,110 0,110`;
    const bars = [55, 72, 48, 88, 62, 95, 78];
    return (
      <Shell title="djama.space · Tableau de bord">
        <div className="flex" style={{ minHeight: 340 }}>
          <div className="flex w-10 flex-col items-center gap-4 border-r border-white/8 py-4">
            {[c, "rgba(255,255,255,0.2)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.12)"].map((bg, i) => (
              <div key={i} className="h-6 w-6 rounded-lg" style={{ background: bg }} />
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[["CA", "24 380 €", "+18%"], ["Clients", "48", "+3"], ["Marge", "66 %", "+2pt"]].map(([l, v, d]) => (
                <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[0.58rem] font-semibold uppercase tracking-wider" style={{ color: c }}>{l}</p>
                  <p className="mt-0.5 text-[1rem] font-extrabold text-white">{v}</p>
                  <p className="text-[0.6rem] text-green-400">{d}</p>
                </div>
              ))}
            </div>
            <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[0.62rem] font-semibold text-white/60">Revenus · 30 derniers jours</p>
                <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold" style={{ background: `${c}25`, color: c }}>+18%</span>
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
    const rows = [
      { ref: "#2024-089", client: "Entreprise Soleil", date: "21 août", montant: "3 200 €", statut: "Envoyée", dot: "#22c55e" },
      { ref: "#2024-088", client: "Cabinet Martin & Co", date: "18 août", montant: "1 850 €", statut: "Payée",   dot: c },
      { ref: "#2024-087", client: "SARL Technova",       date: "14 août", montant: "640 €",   statut: "En retard",dot: "#ef4444" },
      { ref: "#2024-086", client: "Freelance A. Diop",   date: "10 août", montant: "2 100 €", statut: "Payée",   dot: c },
    ];
    return (
      <Shell title="djama.space · Factures">
        <div style={{ minHeight: 340 }}>
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <div className="flex gap-2">
              {["Toutes", "Payées", "En attente"].map((t, i) => (
                <span key={t} className="rounded-lg px-3 py-1 text-[0.65rem] font-semibold"
                  style={i === 0 ? { background: `${c}25`, color: c } : { color: "rgba(255,255,255,0.4)" }}>{t}</span>
              ))}
            </div>
            <div className="h-6 w-24 rounded-lg" style={{ background: c }} />
          </div>
          <div className="grid grid-cols-4 border-b border-white/6 px-4 py-2" style={{ gridTemplateColumns: "1fr 1.5fr auto auto" }}>
            {["Référence", "Client", "Montant", "Statut"].map(h => (
              <span key={h} className="text-[0.58rem] font-bold uppercase tracking-wider text-white/30">{h}</span>
            ))}
          </div>
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
    const msgs = [
      { me: false, text: "Génère un devis pour Entreprise Soleil — Projet web 3 mois, budget 12 000 €" },
      { me: true, text: "✓ Devis créé · Réf. DEV-2024-047 · 12 000 € HT · Validité 30 jours" },
      { me: false, text: "Ajoute une ligne option maintenance mensuelle à 350 €/mois" },
      { me: true, text: "✓ Ligne ajoutée · Nouveau total : 12 350 € HT (+ options récurrentes)" },
    ];
    return (
      <Shell title="djama.space · Assistant IA">
        <div style={{ minHeight: 340 }}>
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${c}30` }}>
              <span className="text-[0.7rem] font-extrabold" style={{ color: c }}>IA</span>
            </div>
            <div>
              <p className="text-[0.75rem] font-bold text-white">Assistant DJAMA</p>
              <p className="text-[0.6rem] text-green-400">● En ligne · Répond en &lt; 2s</p>
            </div>
          </div>
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
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl px-3 py-2" style={{ background: `${c}15`, borderBottomLeftRadius: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: c, opacity: 0.4 + i * 0.3 }} />
                ))}
              </div>
            </div>
          </div>
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
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
          <span className="text-[0.7rem] font-bold text-white/70">Semaine du 19 août 2026</span>
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-lg bg-white/8" />
            <div className="h-6 w-6 rounded-lg bg-white/8" />
            <div className="h-6 w-20 rounded-lg" style={{ background: c }} />
          </div>
        </div>
        <div className="grid px-3 py-2" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((d, i) => (
            <div key={i} className="text-center">
              <p className="text-[0.58rem] font-semibold text-white/30">{d}</p>
              <p className={`mt-1 rounded-full py-0.5 text-[0.75rem] font-bold ${i === 2 ? "text-black" : "text-white/70"}`}
                style={i === 2 ? { background: c } : {}}>{nums[i]}</p>
            </div>
          ))}
        </div>
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

/* ── Doodle arrow SVG ── */
function DoodleArrow({ color }: { color: string }) {
  return (
    <svg width="52" height="36" viewBox="0 0 52 36" fill="none" aria-hidden>
      <path d="M4 32 C12 8, 35 2, 48 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M43 9 L48 14 L42 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
    </svg>
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

      {/* ── Hero — centré style Odoo ── */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-14 text-center sm:pt-20">
        {/* Lueur de fond douce */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% -5%, ${app.bg}90 0%, transparent 65%)` }} />

        <div className="relative mx-auto max-w-3xl">

          {/* Icône catégorie */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="mb-5 flex items-center justify-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: app.bg }}>
              <AppIcon size={22} style={{ color: app.color }} />
            </span>
            <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em]" style={{ color: app.color }}>
              {app.category}
            </span>
          </motion.div>

          {/* Annotation "Facile" style Odoo */}
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.05 }}
            className="mb-1 flex items-center justify-center gap-1"
          >
            <span
              className="text-[1.25rem] italic text-gray-400"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Facile à prendre en main
            </span>
            <DoodleArrow color={app.color} />
          </motion.div>

          {/* Titre héro */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.1 }}
            className="text-[2.8rem] font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-[4rem]"
          >
            {app.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.18 }}
            className="mx-auto mt-5 max-w-xl text-[1.08rem] leading-relaxed text-gray-500"
          >
            {app.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.26 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[0.95rem] font-extrabold text-black shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              {"Lancez-vous — C'est gratuit !"} <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-[0.95rem] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <Calendar size={15} /> Rencontrer un conseiller
            </Link>
          </motion.div>

          {/* Réassurance */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="mt-5 flex flex-wrap justify-center gap-5 text-[0.8rem] text-gray-400"
          >
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> Accès instantané</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> Aucune carte requise</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: app.color }} /> IA native incluse</span>
          </motion.div>
        </div>
      </section>

      {/* ── Bandeau valeur ── */}
      <section className="px-6 py-8" style={{ background: `${app.bg}70` }}>
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

      {/* ── Fonctionnalités — sections alternées style Odoo ── */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-28">
            {app.features.map((feat, i) => {
              const reverse = i % 2 !== 0;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, ease }}
                  className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20"
                >
                  {/* Texte */}
                  <div className={reverse ? "lg:order-2" : ""}>
                    {/* Titre manuscrit style Odoo */}
                    <h3
                      className="mb-5 text-[3rem] font-bold leading-snug text-gray-900 sm:text-[3.8rem]"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      {feat.title}
                    </h3>
                    <p className="text-[1.05rem] leading-relaxed text-gray-500">
                      {feat.description}
                    </p>
                    <Link
                      href="/login"
                      className="mt-6 inline-flex items-center gap-1.5 text-[0.92rem] font-semibold transition-colors hover:opacity-70"
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

      {/* ── Stats — style Odoo avec Caveat ── */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="grid grid-cols-3 divide-x divide-gray-200 text-center"
          >
            {[
              { n: "1 200+", label: "entrepreneurs actifs", icon: Users },
              { n: "4.9/5",  label: "satisfaction clients", icon: Star },
              { n: "< 5 min",label: "pour démarrer",        icon: ZapIcon },
            ].map(({ n, label, icon: Icon }) => (
              <div key={label} className="px-4 py-5">
                <Icon size={18} className="mx-auto mb-2" style={{ color: app.color }} />
                <p className="text-[2.4rem] font-bold leading-none text-gray-900 sm:text-[3rem]"
                  style={{ fontFamily: "'Caveat', cursive" }}>{n}</p>
                <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-wider text-gray-400">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Cross-sell — bulle style Odoo ── */}
      {app.crossSell && crossApp && CrossIcon && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease }}
              className="relative flex items-start gap-5 overflow-hidden rounded-2xl p-7 shadow-sm"
              style={{ background: `${crossApp.bg}60`, border: `1px solid ${crossApp.color}25` }}
            >
              {/* Icône app cross-sell */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow"
                style={{ background: crossApp.bg }}
              >
                <CrossIcon size={26} style={{ color: crossApp.color }} />
              </div>

              {/* Texte bulle */}
              <div>
                <p
                  className="mb-1 text-[1.5rem] font-bold leading-snug text-gray-800"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {"Vous cherchez à aller plus loin ?"}
                </p>
                <p className="text-[0.9rem] text-gray-600">
                  {app.crossSell.teaser}{" "}
                  <Link
                    href={`/applications/${crossApp.slug}`}
                    className="font-semibold underline decoration-2 underline-offset-2 transition-opacity hover:opacity-70"
                    style={{ color: crossApp.color }}
                  >
                    Découvrez {crossApp.label} →
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA principal ── */}
      <section className="bg-white px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-xl"
        >
          <p
            className="mb-3 text-[3rem] font-bold leading-tight text-gray-900 sm:text-[3.8rem]"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {"Prêt à vous lancer ?"}
          </p>
          <p className="text-[0.95rem] text-gray-500">
            Inclus dans votre abonnement DJAMA · Accès immédiat · IA native
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
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

    </main>
  );
}
