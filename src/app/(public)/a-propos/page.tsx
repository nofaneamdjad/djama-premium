"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Mail, MessageCircle, Users, Lightbulb,
  Zap, ShieldCheck, HeartHandshake, Star, Globe,
  CheckCircle2, Rocket, Target, FileText,
  TrendingUp, BookOpen, Brain,
} from "lucide-react";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const BG    = "linear-gradient(175deg, #1a0c35 0%, #0d0821 50%, #060c18 100%)";

/* ── Données ───────────────────────────────────────────────── */
const STATS = [
  { value: "2022", label: "Année de création",   sub: "fondée par Nofane AMDJAD",    color: GOLD        },
  { value: "50+",  label: "Clients accompagnés",  sub: "entrepreneurs & entreprises", color: "#a78bfa"   },
  { value: "100+", label: "Projets livrés",        sub: "web, apps, design, vidéo",   color: "#38bdf8"   },
  { value: "24h",  label: "Délai de réponse",      sub: "réactivité garantie",        color: "#4ade80"   },
];

const VALUES = [
  { Icon: ShieldCheck,    color: "#4ade80", title: "Fiabilité",       desc: "Délais respectés, livrables soignés, communication transparente à chaque étape." },
  { Icon: TrendingUp,     color: GOLD,      title: "Croissance",      desc: "Chaque solution est pensée pour augmenter concrètement votre chiffre d'affaires." },
  { Icon: Target,         color: "#38bdf8", title: "Efficacité",      desc: "Des process optimisés pour livrer vite et bien — sans technicité inutile." },
  { Icon: HeartHandshake, color: "#f472b6", title: "Accompagnement",  desc: "Un suivi humain et personnalisé — pas un ticket de support anonyme." },
  { Icon: Lightbulb,      color: "#a78bfa", title: "Innovation",      desc: "Veille constante pour intégrer l'IA et les meilleures technologies disponibles." },
  { Icon: Globe,          color: "#f97316", title: "Accessibilité",   desc: "Des solutions adaptées à tous — artisan, auto-entrepreneur, PME ou étudiant." },
];

const TEAM = [
  { name: "Nofane AMDJAD",          role: "Fondateur & CEO",                    initials: "NA", color: GOLD,      bio: "En 2022, Nofane constate que de nombreuses petites entreprises ne savent pas répondre aux marchés publics ni privés, ni accéder aux aides disponibles. Il crée DJAMA pour combler ce manque.", tags: ["Marchés publics & privés","Stratégie digitale","IA & Automatisation"] },
  { name: "Pôle Analyse de Marché", role: "Analystes & Rédacteurs de dossiers", initials: "AM", color: "#f59e0b", bio: "Décryptage des appels d'offres, identification des opportunités et rédaction de dossiers solides pour maximiser vos chances sur marchés publics et privés.", tags: ["Analyse de marché","Rédaction de dossiers","Appels d'offres"] },
  { name: "Pôle Sourcing",          role: "Experts sourcing & Négociateurs",    initials: "SF", color: "#4ade80", bio: "Recherche, sélection et négociation des meilleurs fournisseurs adaptés à votre activité — en France et à l'international — pour réduire vos coûts.", tags: ["Sourcing international","Négociation fournisseurs","Optimisation coûts"] },
  { name: "Pôle Création",          role: "Développeurs, Designers & Vidéastes",initials: "PC", color: "#a78bfa", bio: "Conception de sites web, applications, visuels et montages vidéo. Chaque livrable est pensé pour projeter une image professionnelle et générer des résultats.", tags: ["Création web & app","Design & identité","Montage vidéo"] },
  { name: "Pôle Coaching & Soutien",role: "Coaches IA & Professeurs experts",   initials: "CS", color: "#38bdf8", bio: "Coaches spécialisés en intelligence artificielle et professeurs experts pour accompagner entrepreneurs et étudiants dans leur montée en compétences.", tags: ["Coaching IA","Soutien scolaire","Formations"] },
];

const MILESTONES = [
  { year: "2022", color: GOLD,      title: "Naissance de DJAMA",              desc: "Nofane AMDJAD crée DJAMA après avoir constaté que beaucoup de petites entreprises ne savaient pas répondre aux marchés publics et privés, ni accéder aux aides ou trouver des fournisseurs adaptés." },
  { year: "2023", color: "#a78bfa", title: "Expansion des services",           desc: "DJAMA étend son offre : création web, applications, design, montage vidéo et accompagnement administratif complet — tout pour aider les entrepreneurs à augmenter leur CA." },
  { year: "2025", color: "#38bdf8", title: "50+ clients, 100+ projets",        desc: "Un cap symbolique franchi — une communauté d'entrepreneurs qui nous font confiance pour développer leur activité et décrocher de nouveaux marchés." },
  { year: "2026", color: "#4ade80", title: "Plateforme DJAMA PRO + Coaching IA",desc: "Premier outil tout-en-un : factures, CRM, trésorerie, contrats IA. En parallèle : lancement du Coaching IA et du Soutien Scolaire avec des professeurs experts." },
];

const SERVICES = [
  { Icon: FileText,   color: GOLD,      title: "Marchés publics & privés", desc: "Rédaction et soumission de vos réponses aux appels d'offres pour décrocher de nouveaux contrats." },
  { Icon: TrendingUp, color: "#4ade80", title: "Aides & subventions",      desc: "Identification et accompagnement pour accéder aux aides auxquelles votre entreprise a droit." },
  { Icon: Globe,      color: "#38bdf8", title: "Fournisseurs & sourcing",  desc: "Recherche de fournisseurs adaptés à votre activité, en France et à l'international." },
  { Icon: Rocket,     color: "#a78bfa", title: "Création web & app",       desc: "Sites vitrines, e-commerce, applications — conçus pour générer des résultats concrets." },
  { Icon: Brain,      color: "#f472b6", title: "Coaching IA",              desc: "Apprenez à utiliser l'IA pour automatiser vos tâches et développer votre activité plus vite." },
  { Icon: BookOpen,   color: "#f97316", title: "Soutien scolaire",         desc: "Des cours avec des professeurs experts pour accompagner vos enfants dans leur réussite scolaire." },
];

/* ── Photo fondateur ──────────────────────────────────────── */
function FounderPhoto() {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="relative w-full max-w-[320px] md:max-w-full">
      <div className="absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl" style={{ background: `radial-gradient(ellipse, ${GOLD}80, transparent 70%)` }} />
      <div className="relative overflow-hidden rounded-[1.75rem]" style={{ boxShadow: `0 0 0 1.5px ${GOLD}40, 0 24px 60px rgba(0,0,0,0.40)` }}>
        {imgError ? (
          <div className="flex aspect-square w-full items-center justify-center" style={{ background: `linear-gradient(135deg, rgba(${GOLDR},0.10), rgba(${GOLDR},0.04))` }}>
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-black" style={{ backgroundColor: `rgba(${GOLDR},0.15)`, color: GOLD, border: `2px solid rgba(${GOLDR},0.30)` }}>NA</span>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.30)" }}>Photo bientôt disponible</span>
            </div>
          </div>
        ) : (
          <Image src="/founder-nofane.jpg" alt="Nofane AMDJAD — Fondateur DJAMA" width={420} height={420} className="w-full object-cover" priority onError={() => setImgError(true)} />
        )}
      </div>
    </div>
  );
}

/* ── Séparateur de section ────────────────────────────────── */
function SectionDivider({ color = GOLD }: { color?: string }) {
  return (
    <div className="mx-auto my-0 h-px w-full max-w-5xl" style={{ background: `linear-gradient(90deg, transparent, ${color}20, transparent)` }} />
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function AProposPage() {
  return (
    <main className="overflow-x-hidden" style={{ background: BG }}>

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:pb-32 sm:pt-44">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[120px]" style={{ background: `rgba(${GOLDR},0.07)` }} />
          <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full blur-[80px]" style={{ background: "rgba(167,139,250,0.05)" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: `rgba(${GOLDR},0.30)`, backgroundColor: `rgba(${GOLDR},0.08)` }}>
              <Star size={11} fill={GOLD} style={{ color: GOLD }} />
              Notre histoire & notre équipe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Aider les entrepreneurs<br />
            <span style={{ color: GOLD }}>à aller plus loin.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "rgba(255,255,255,0.50)" }}
          >
            Créée en 2022 par Nofane AMDJAD, DJAMA accompagne les petites entreprises
            dans leurs marchés publics et privés, leurs aides, leurs fournisseurs,
            leur présence digitale — et depuis 2026, leur maîtrise de l&apos;IA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            <Link href="/contact" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(201,165,90,0.35)] transition-shadow hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]" style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">Démarrer un projet <ArrowRight size={15} /></span>
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 rounded-2xl border px-7 py-3.5 text-sm font-bold transition" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)" }}>
              Nos services
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══ STATS ═════════════════════════════════════════════ */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(({ value, label, sub, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.4, ease, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl px-5 py-5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                <p className="mt-1 text-xs font-bold text-white">{label}</p>
                <p className="mt-0.5 text-[0.6rem]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══ FONDATEUR ═════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: `rgba(${GOLDR},0.25)`, backgroundColor: `rgba(${GOLDR},0.08)` }}>
              Le fondateur
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              La personne derrière DJAMA.
            </h2>
          </FadeReveal>

          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }} className="flex flex-col items-center md:items-start">
              <FounderPhoto />
              <div className="relative mt-5 w-full max-w-[320px] overflow-hidden rounded-2xl p-5 md:max-w-full" style={{ border: `1px solid rgba(${GOLDR},0.20)`, background: `rgba(${GOLDR},0.05)` }}>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${GOLDR},0.50), transparent)` }} />
                <p className="text-lg font-black text-white">Nofane AMDJAD</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: GOLD }}>Fondateur & CEO de DJAMA</p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  &ldquo;J&apos;ai créé DJAMA pour que chaque entrepreneur ait accès aux mêmes opportunités,
                  peu importe son niveau ou son budget.&rdquo;
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.6, ease, delay: 0.1 }} className="space-y-4">
              {[
                { color: GOLD,      Icon: Brain,   label: "Pourquoi DJAMA",    text: "En 2022, Nofane constate que des centaines de petites entreprises perdent des marchés publics et privés faute de savoir comment répondre aux appels d'offres. Elles ignorent aussi les aides disponibles et n'ont pas accès aux bons fournisseurs. DJAMA est né pour corriger cette injustice." },
                { color: "#a78bfa", Icon: Users,   label: "À qui on s'adresse", text: "Artisans, auto-entrepreneurs, TPE, PME — toute personne qui veut développer son activité, décrocher de nouveaux clients et se professionnaliser, sans avoir besoin d'une grande structure derrière elle." },
                { color: "#4ade80", Icon: Rocket,  label: "Ce qu'on apporte",   items: ["Réponses aux marchés publics & privés clés en main","Accès aux aides et subventions disponibles","Sourcing et négociation fournisseurs","Création web, app, design et vidéo sur mesure","Coaching IA + soutien scolaire avec experts","Plateforme d'outils professionnels tout-en-un"] },
              ].map(({ color, Icon, label, text, items }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: color + "18", border: `1px solid ${color}30` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
                  </div>
                  {text && <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>{text}</p>}
                  {items && (
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider color="#a78bfa" />

      {/* ═══ TIMELINE ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: `rgba(${GOLDR},0.25)`, backgroundColor: `rgba(${GOLDR},0.08)` }}>
              Notre parcours
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              De 2022 à aujourd&apos;hui.
            </h2>
          </FadeReveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {MILESTONES.map(({ year, color, title, desc }, i) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                className="relative flex gap-4 overflow-hidden rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl" style={{ background: color }} />
                <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ backgroundColor: color + "15", color, border: `1px solid ${color}30` }}>
                  {year}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider color="#38bdf8" />

      {/* ═══ NOS SERVICES ══════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.25)", backgroundColor: "rgba(56,189,248,0.06)" }}>
              Ce que DJAMA fait pour vous
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Une offre complète,{" "}
              <span style={{ color: GOLD }}>un seul interlocuteur.</span>
            </h2>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map(({ Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ scale: 1.02, y: -3 }}
                className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}12 0%, transparent 60%)` }} />
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider color="#a78bfa" />

      {/* ═══ VALEURS ═══════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)", backgroundColor: "rgba(167,139,250,0.06)" }}>
              Ce en quoi nous croyons
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Nos valeurs, notre ADN.
            </h2>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {VALUES.map(({ Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ scale: 1.02, y: -3 }}
                className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}12 0%, transparent 60%)` }} />
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider color="#38bdf8" />

      {/* ═══ ÉQUIPE ════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.25)", backgroundColor: "rgba(56,189,248,0.06)" }}>
              <Users size={10} /> Les pôles de DJAMA
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Notre équipe.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Une équipe pluridisciplinaire qui s&apos;investit dans votre réussite comme si c&apos;était la sienne.
            </p>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TEAM.map(({ name, role, initials, color, bio, tags }) => (
              <motion.div
                key={name}
                variants={cardReveal}
                whileHover={{ scale: 1.015, y: -3 }}
                className="group relative overflow-hidden rounded-[1.5rem] p-6 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[1.5rem]" style={{ background: `linear-gradient(90deg, ${color}60, ${color}20)` }} />
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black" style={{ backgroundColor: color + "18", color, border: `1.5px solid ${color}35` }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">{name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{role}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" style={{ background: `rgba(${GOLDR},0.07)` }} />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <FadeReveal>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Prêt à travailler<br />
              <span style={{ color: GOLD }}>avec nous ?</span>
            </h2>
          </FadeReveal>
          <FadeReveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Décrivez votre projet — nous vous répondons sous 24h avec une proposition claire, adaptée et sans engagement.
            </p>
          </FadeReveal>
          <FadeReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(201,165,90,0.35)] transition-shadow hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]" style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">Démarrer un projet <ArrowRight size={15} /></span>
              </Link>
              <a href="https://wa.me/262693523665" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition" style={{ border: "1px solid rgba(37,211,102,0.25)", background: "rgba(37,211,102,0.08)", color: "#25d366" }}>
                <MessageCircle size={15} /> WhatsApp direct
              </a>
              <a href="mailto:contact@djama.space" className="flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}>
                <Mail size={14} /> contact@djama.space
              </a>
            </div>
          </FadeReveal>
        </div>
      </section>

    </main>
  );
}
