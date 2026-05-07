"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LayoutDashboard, Star, Calendar, Package, Zap, FileText, Users, CreditCard, Timer, StickyNote } from "lucide-react";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const PRODUITS = [
  {
    href: "/espace-client",
    emoji: "⚡",
    color: "#c9a55a",
    rgb: "201,165,90",
    badge: "Phare",
    title: "Espace Client DJAMA",
    tagline: "Tous vos outils en un seul endroit — 11,90€/mois",
    desc: "Facturation, CRM, trésorerie, planning, notes IA, assistant IA, coaching IA et bien plus. La plateforme tout-en-un pour gérer et développer votre activité.",
    details: [
      "Factures & devis PDF",
      "CRM clients",
      "Trésorerie & dépenses",
      "Planning & agenda",
      "Notes IA",
      "Assistant IA",
      "Coaching IA Premium",
      "Chrono & temps",
    ],
    cta: "Accéder à l'espace",
    featured: true,
  },
  {
    href: "/offres",
    emoji: "💎",
    color: "#a78bfa",
    rgb: "167,139,250",
    badge: "",
    title: "Nos Offres & Tarifs",
    tagline: "Formules adaptées à chaque besoin",
    desc: "Découvrez toutes nos formules : création de site, applications, accompagnement, coaching IA. Tarifs transparents, sans surprise.",
    details: ["Sites vitrine & e-commerce", "Applications sur mesure", "Coaching IA", "Accompagnement entreprise"],
    cta: "Voir les tarifs",
    featured: false,
  },
  {
    href: "/reserver-appel",
    emoji: "📞",
    color: "#34d399",
    rgb: "52,211,153",
    badge: "Gratuit",
    title: "Réserver un Appel Conseil",
    tagline: "30 minutes offertes avec un expert DJAMA",
    desc: "Discutez de votre projet, posez vos questions, obtenez une roadmap claire. Sans engagement, sans pression.",
    details: ["30 minutes offertes", "Expert dédié", "Analyse de votre situation", "Recommandations personnalisées"],
    cta: "Réserver mon appel",
    featured: false,
  },
  {
    href: "/realisations",
    emoji: "🏆",
    color: "#f97316",
    rgb: "249,115,22",
    badge: "",
    title: "Nos Réalisations",
    tagline: "Portfolio & cas clients",
    desc: "Découvrez les projets réalisés pour nos clients : sites web, applications, automatisations, identités visuelles.",
    details: ["Sites web & apps", "Identités visuelles", "Automatisations IA", "Résultats mesurables"],
    cta: "Voir le portfolio",
    featured: false,
  },
];

const OUTILS = [
  { icon: FileText,        label: "Factures & Devis" },
  { icon: Users,           label: "CRM clients" },
  { icon: CreditCard,      label: "Trésorerie" },
  { icon: Calendar,        label: "Planning" },
  { icon: StickyNote,      label: "Notes IA" },
  { icon: Timer,           label: "Chrono" },
  { icon: Zap,             label: "Assistant IA" },
  { icon: LayoutDashboard, label: "Dashboard" },
];

export default function ProduitsPage() {
  return (
    <main className="overflow-x-hidden bg-white">

      {/* Hero */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-16 pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(201,165,90,0.08)] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              <Package size={13} /> Produits DJAMA
            </div>
          </FadeReveal>
          <FadeReveal delay={0.15}>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
              Nos <span className="text-[#c9a55a]">produits</span>
            </h1>
          </FadeReveal>
          <FadeReveal delay={0.3}>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/50">
              Outils professionnels, offres sur mesure, réalisations — tout ce dont vous avez besoin pour développer votre activité.
            </p>
          </FadeReveal>
        </div>
      </section>

      {/* Bandeau outils espace client */}
      <section className="border-y border-[var(--border)] bg-[#f9f7f4] py-6">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Inclus dans l&apos;Espace Client à 11,90€/mois</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {OUTILS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 shadow-sm">
                <Icon size={14} className="text-[#c9a55a]" />
                <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Produits */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={viewport} className="grid gap-5 sm:grid-cols-2">
          {PRODUITS.map(({ href, emoji, color, rgb, badge, title, tagline, desc, details, cta, featured }) => (
            <motion.div key={href} variants={cardReveal} whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-3xl border p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] ${
                featured ? "border-[rgba(201,165,90,0.35)] bg-white sm:col-span-2" : "border-[var(--border)] bg-white"
              }`}>
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `rgba(${rgb},0.12)` }}>
                  {emoji}
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    {badge && (
                      <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest"
                        style={{ color, backgroundColor: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)` }}>
                        {badge}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted)]">{tagline}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-[var(--ink)]">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <ul className={`mt-4 ${featured ? "grid gap-x-8 gap-y-1.5 sm:grid-cols-4" : "space-y-1.5"}`}>
                    {details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                        <CheckCircle2 size={11} style={{ color }} /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={href}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all whitespace-nowrap"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px rgba(${rgb},0.3)` }}>
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-[#0f1117] py-16 text-center">
        <FadeReveal>
          <h2 className="text-2xl font-extrabold text-white md:text-3xl">Prêt à démarrer ?</h2>
          <p className="mt-3 text-sm text-white/40">Essayez l&apos;espace client ou réservez un appel conseil.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/espace-client" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.35)] transition hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]">
              Accéder à l&apos;espace client <ArrowRight size={15} />
            </Link>
            <Link href="/reserver-appel" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white/80 transition hover:bg-white/10">
              Appel gratuit <ArrowRight size={15} />
            </Link>
          </div>
        </FadeReveal>
      </section>
    </main>
  );
}
