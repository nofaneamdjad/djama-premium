"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardList, Building2, FileText, Search, Handshake } from "lucide-react";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ACCOMPAGNEMENTS = [
  {
    href: "/services/assistance-administrative",
    icon: ClipboardList, color: "#60a5fa", rgb: "96,165,250",
    title: "Assistance Administrative",
    tagline: "Démarches simplifiées",
    desc: "Gestion de vos démarches administratives courantes : rédaction de courriers, suivi de dossiers, organisation documentaire.",
    details: ["Courriers & rédaction", "Suivi de dossiers", "Organisation documentaire", "Rapidité & rigueur"],
  },
  {
    href: "/services/creation-auto-entrepreneur",
    icon: Building2, color: "#a78bfa", rgb: "167,139,250",
    title: "Créer son Entreprise",
    tagline: "De l'idée à l'immatriculation",
    desc: "Accompagnement complet pour créer votre auto-entreprise ou micro-entreprise : statut juridique, immatriculation, premiers pas.",
    details: ["Choix du statut juridique", "Immatriculation en 48h", "Ouverture compte pro", "Premier bilan prévisionnel"],
  },
  {
    href: "/services/declarations-urssaf",
    icon: FileText, color: "#34d399", rgb: "52,211,153",
    title: "Déclarations URSSAF",
    tagline: "Conformité garantie",
    desc: "Calcul et déclaration de vos cotisations sociales. Suivi de vos obligations légales pour éviter pénalités et régularisations.",
    details: ["Calcul cotisations", "Déclarations en ligne", "Suivi trimestriel", "Alertes & rappels"],
  },
  {
    href: "/services/marches-publics",
    icon: Handshake, color: "#f97316", rgb: "249,115,22",
    title: "Marchés Publics",
    tagline: "Appels d'offres & dossiers",
    desc: "Constitution et dépôt de dossiers de réponse aux appels d'offres publics. Veille des marchés correspondant à votre activité.",
    details: ["Veille appels d'offres", "Constitution du dossier", "Dépôt & suivi", "Accompagnement post-attribution"],
  },
  {
    href: "/services/recherche-fournisseurs",
    icon: Search, color: "#fbbf24", rgb: "251,191,36",
    title: "Recherche de Fournisseurs",
    tagline: "Sourcing & mise en relation",
    desc: "Identification et sélection de fournisseurs qualifiés selon vos critères : prix, qualité, délais, localisation.",
    details: ["Analyse de besoins", "Sourcing ciblé", "Comparatif fournisseurs", "Négociation & mise en relation"],
  },
];

export default function AccompagnementPage() {
  return (
    <main className="overflow-x-hidden bg-white">

      {/* Hero */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-16 pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(52,211,153,0.07)] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#34d399]">
              <ClipboardList size={13} /> Accompagnement DJAMA
            </div>
          </FadeReveal>
          <FadeReveal delay={0.15}>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
              Notre <span className="text-[#34d399]">accompagnement</span>
            </h1>
          </FadeReveal>
          <FadeReveal delay={0.3}>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/50">
              Gestion administrative, création d'entreprise, URSSAF, marchés publics — nous gérons vos démarches pour que vous vous concentriez sur votre cœur de métier.
            </p>
          </FadeReveal>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={viewport}
          className="grid gap-5 sm:grid-cols-2">
          {ACCOMPAGNEMENTS.map(({ href, icon: Icon, color, rgb, title, tagline, desc, details }) => (
            <motion.div key={href} variants={cardReveal} whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `rgba(${rgb},0.12)`, color }}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{tagline}</span>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--ink)]">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              <ul className="mt-4 space-y-1.5">
                {details.map(d => (
                  <li key={d} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                    <CheckCircle2 size={11} style={{ color }} /> {d}
                  </li>
                ))}
              </ul>
              <Link href={href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
                style={{ color }}
              >
                En savoir plus <ArrowRight size={13} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-[#0f1117] py-16 text-center">
        <FadeReveal>
          <h2 className="text-2xl font-extrabold text-white md:text-3xl">Besoin d'un accompagnement sur mesure ?</h2>
          <p className="mt-3 text-sm text-white/40">Discutons de votre situation en 30 minutes.</p>
          <Link href="/reserver-appel" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.35)] transition hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]">
            Appel conseil gratuit <ArrowRight size={15} />
          </Link>
        </FadeReveal>
      </section>
    </main>
  );
}
