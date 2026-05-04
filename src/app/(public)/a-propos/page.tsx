"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Mail, MessageCircle, Users, Lightbulb,
  Zap, ShieldCheck, HeartHandshake, Star, Globe,
  CheckCircle2, Rocket, Target, Clock, FileText,
  TrendingUp, BookOpen, Brain, Quote,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

const STATS = [
  { value: "2022", label: "Année de création",  sub: "fondée par Nofane AMDJAD",    color: "#c9a55a" },
  { value: "50+",  label: "Clients accompagnés", sub: "entrepreneurs & entreprises", color: "#a78bfa" },
  { value: "100+", label: "Projets livrés",       sub: "web, apps, design, vidéo",   color: "#38bdf8" },
  { value: "24h",  label: "Délai de réponse",     sub: "réactivité garantie",        color: "#4ade80" },
];

const VALUES = [
  { Icon: ShieldCheck,   color: "#4ade80", title: "Fiabilité",       desc: "Délais respectés, livrables soignés, communication transparente à chaque étape." },
  { Icon: TrendingUp,    color: "#c9a55a", title: "Croissance",      desc: "Chaque solution est pensée pour augmenter concrètement votre chiffre d'affaires." },
  { Icon: Target,        color: "#38bdf8", title: "Efficacité",      desc: "Des process optimisés pour livrer vite et bien — sans technicité inutile." },
  { Icon: HeartHandshake,color: "#f472b6", title: "Accompagnement",  desc: "Un suivi humain et personnalisé — pas un ticket de support anonyme." },
  { Icon: Lightbulb,     color: "#a78bfa", title: "Innovation",      desc: "Veille constante pour intégrer l'IA et les meilleures technologies disponibles." },
  { Icon: Globe,         color: "#f97316", title: "Accessibilité",   desc: "Des solutions adaptées à tous — artisan, auto-entrepreneur, PME ou étudiant." },
];

const TEAM = [
  {
    name: "Nofane AMDJAD",
    role: "Fondateur & CEO",
    initials: "NA",
    color: "#c9a55a",
    bio: "En 2022, Nofane constate que de nombreuses petites entreprises ne savent pas répondre aux marchés publics ni privés, ni accéder aux aides disponibles. Il crée DJAMA pour combler ce manque — en accompagnant les entrepreneurs sur leurs démarches, leurs fournisseurs et leur croissance.",
    tags: ["Marchés publics & privés", "Stratégie digitale", "IA & Automatisation"],
  },
  {
    name: "Pôle Analyse de Marché",
    role: "Analystes & Rédacteurs de dossiers",
    initials: "AM",
    color: "#f59e0b",
    bio: "Une équipe spécialisée dans l'étude et l'analyse de marché. Elle décrypte les appels d'offres, identifie les opportunités, et prépare des dossiers solides et convaincants pour maximiser vos chances de remporter marchés publics et privés.",
    tags: ["Analyse de marché", "Rédaction de dossiers", "Appels d'offres"],
  },
  {
    name: "Pôle Sourcing & Fournisseurs",
    role: "Experts sourcing & Négociateurs",
    initials: "SF",
    color: "#4ade80",
    bio: "Des experts qui cherchent, sélectionnent et négocient pour vous les meilleurs fournisseurs adaptés à votre activité — en France et à l'international. L'objectif : vous obtenir les meilleures conditions pour réduire vos coûts et booster votre rentabilité.",
    tags: ["Sourcing international", "Négociation fournisseurs", "Optimisation des coûts"],
  },
  {
    name: "Pôle Création",
    role: "Développeurs, Designers & Vidéastes",
    initials: "PC",
    color: "#a78bfa",
    bio: "Une équipe créative dédiée à la conception de sites web, applications, visuels et montages vidéo. Chaque livrable est pensé pour projeter une image professionnelle et générer des résultats.",
    tags: ["Création web & app", "Design & identité", "Montage vidéo"],
  },
  {
    name: "Pôle Coaching & Soutien",
    role: "Coaches IA & Professeurs experts",
    initials: "CS",
    color: "#38bdf8",
    bio: "Des coaches spécialisés en intelligence artificielle et des professeurs experts pour accompagner entrepreneurs et étudiants dans leur montée en compétences — à leur rythme.",
    tags: ["Coaching IA", "Soutien scolaire", "Formations"],
  },
];

const MILESTONES = [
  {
    year: "2022",
    color: "#c9a55a",
    title: "Naissance de DJAMA",
    desc: "Nofane AMDJAD crée DJAMA après avoir constaté que beaucoup de petites entreprises ne savaient pas répondre aux marchés publics et privés, ni comment accéder aux aides ou trouver des fournisseurs adaptés.",
  },
  {
    year: "2023",
    color: "#a78bfa",
    title: "Expansion des services",
    desc: "DJAMA étend son offre : création de sites web, applications, design, montage vidéo et accompagnement administratif complet — tout pour aider les entrepreneurs à augmenter leur chiffre d'affaires.",
  },
  {
    year: "2025",
    color: "#38bdf8",
    title: "50+ clients, 100+ projets",
    desc: "Un cap symbolique franchi — une communauté d'entrepreneurs qui nous font confiance pour développer leur activité et décrocher de nouveaux marchés.",
  },
  {
    year: "2026",
    color: "#4ade80",
    title: "Lancement de la plateforme DJAMA PRO",
    desc: "Premier outil tout-en-un : factures, CRM, trésorerie, chrono, contrats IA et bien plus. En parallèle : lancement du Coaching IA et du Soutien Scolaire avec des professeurs experts.",
  },
];

const TEMOIGNAGES = [
  {
    text: "Grâce à DJAMA, j'ai décroché mon premier marché public en 3 semaines. Le dossier était béton et le suivi impeccable.",
    author: "Karim B.",
    role: "Artisan électricien",
    initials: "KB",
    color: "#c9a55a",
  },
  {
    text: "J'avais aucune idée comment trouver des fournisseurs à l'étranger. L'équipe a tout géré — les recherches, les négociations, les devis. Résultat : -30% sur mes coûts.",
    author: "Samira L.",
    role: "Gérante boutique en ligne",
    initials: "SL",
    color: "#a78bfa",
  },
  {
    text: "Le site web livré en 5 jours, pro et moderne. Et le coaching IA m'a permis d'automatiser mes relances clients — je gagne 2h par jour.",
    author: "Thomas M.",
    role: "Consultant indépendant",
    initials: "TM",
    color: "#38bdf8",
  },
];

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function AProposPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-[700px] w-[700px] rounded-full bg-[rgba(201,165,90,0.05)] blur-[180px]" />
        <div className="absolute right-[-10%] top-[30%] h-[500px] w-[500px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[150px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-[rgba(56,189,248,0.03)] blur-[130px]" />
      </div>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden pb-16 pt-40 sm:pt-48">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6 flex justify-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: GOLD, borderColor: GOLD + "35", backgroundColor: GOLD + "10" }}
            >
              <Star size={11} fill={GOLD} style={{ color: GOLD }} />
              Notre histoire & notre équipe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="text-center text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
          >
            <span className="text-white">Aider les entrepreneurs</span>
            <br />
            <span style={{ color: GOLD }}>à aller plus loin.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-white/50 sm:text-lg"
          >
            Créée en 2022 par Nofane AMDJAD, DJAMA accompagne les petites entreprises
            dans leurs marchés publics et privés, leurs aides, leurs fournisseurs,
            leur présence digitale — et depuis 2026, leur maîtrise de l'IA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.25 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link href="/contact" className="btn-primary px-6 py-3">
              Démarrer un projet <ArrowRight size={15} />
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              Nos services
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════ */}
      <section className="relative z-10 pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(({ value, label, sub, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.7)] px-5 py-5 text-center"
              >
                <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}30 0%, transparent 70%)` }} />
                <p className="relative text-3xl font-black" style={{ color }}>{value}</p>
                <p className="relative mt-1 text-xs font-bold text-white/75">{label}</p>
                <p className="relative mt-0.5 text-[0.6rem] text-white/30">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FONDATEUR — photo + bio
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-12 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: GOLD, borderColor: GOLD + "30", backgroundColor: GOLD + "0d" }}
            >
              Le fondateur
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              La personne derrière DJAMA.
            </h2>
          </motion.div>

          {/* 2-col layout : photo gauche, bio droite */}
          <div className="grid gap-10 md:grid-cols-2 md:items-start">

            {/* ── Photo + identité ── */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="flex flex-col items-center md:items-start"
            >
              {/* Cadre photo */}
              <div className="relative">
                {/* Halo doré derrière */}
                <div
                  className="absolute -inset-3 rounded-[2rem] blur-xl opacity-30"
                  style={{ background: `radial-gradient(ellipse, ${GOLD}60, transparent 70%)` }}
                />
                {/* Bordure dorée subtile */}
                <div
                  className="absolute inset-0 rounded-[1.75rem]"
                  style={{ boxShadow: `0 0 0 2px ${GOLD}35, 0 24px 60px rgba(0,0,0,0.6)` }}
                />
                <div className="relative overflow-hidden rounded-[1.75rem]">
                  <Image
                    src="/founder-nofane.jpg"
                    alt="Nofane AMDJAD — Fondateur de DJAMA"
                    width={420}
                    height={420}
                    className="w-full max-w-[340px] object-cover md:max-w-full"
                    priority
                  />
                </div>
              </div>

              {/* Bloc identité sous la photo */}
              <div
                className="relative mt-5 w-full max-w-[340px] overflow-hidden rounded-2xl border p-5 md:max-w-full"
                style={{ borderColor: GOLD + "28", backgroundColor: GOLD + "0a" }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}50, transparent)` }} />
                <p className="text-xl font-black text-white">Nofane AMDJAD</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: GOLD }}>Fondateur & CEO de DJAMA</p>
                <p className="mt-2 text-xs leading-relaxed text-white/50">
                  "J'ai créé DJAMA pour que chaque entrepreneur ait accès aux mêmes opportunités,
                  peu importe son niveau ou son budget."
                </p>
              </div>
            </motion.div>

            {/* ── Bio structurée ── */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
              className="space-y-6"
            >

              {/* Pourquoi */}
              <div className="rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: GOLD + "18", border: `1px solid ${GOLD}30` }}>
                    <Brain size={14} style={{ color: GOLD }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Pourquoi DJAMA</p>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  En 2022, Nofane constate que des centaines de petites entreprises perdent des marchés
                  publics et privés faute de savoir comment répondre aux appels d'offres. Elles ignorent
                  aussi les aides disponibles et n'ont pas accès aux bons fournisseurs. DJAMA est né pour
                  corriger cette injustice.
                </p>
              </div>

              {/* À qui on s'adresse */}
              <div className="rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#a78bfa18", border: "1px solid #a78bfa30" }}>
                    <Users size={14} style={{ color: "#a78bfa" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>À qui on s'adresse</p>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  Artisans, auto-entrepreneurs, TPE, PME — toute personne qui veut développer
                  son activité, décrocher de nouveaux clients et se professionnaliser, sans avoir
                  besoin d'une grande structure derrière elle.
                </p>
              </div>

              {/* Ce qu'on apporte */}
              <div className="rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#4ade8018", border: "1px solid #4ade8030" }}>
                    <Rocket size={14} style={{ color: "#4ade80" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>Ce qu'on apporte</p>
                </div>
                <ul className="space-y-2">
                  {[
                    "Réponses aux marchés publics & privés clés en main",
                    "Accès aux aides et subventions disponibles",
                    "Sourcing et négociation fournisseurs",
                    "Création web, app, design et vidéo sur mesure",
                    "Coaching IA + soutien scolaire avec experts",
                    "Plateforme d'outils professionnels tout-en-un",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/55">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#4ade80]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HISTOIRE / TIMELINE
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: GOLD, borderColor: GOLD + "30", backgroundColor: GOLD + "0d" }}
            >
              Notre parcours
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              De 2022 à aujourd'hui.
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MILESTONES.map(({ year, color, title, desc }, i) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                className="relative overflow-hidden flex gap-4 rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-4"
              >
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl" style={{ background: color }} />
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                  style={{ backgroundColor: color + "18", color, border: `1px solid ${color}35` }}
                >
                  {year}
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CE QU'ON FAIT
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#38bdf8", borderColor: "#38bdf830", backgroundColor: "#38bdf80d" }}
            >
              Ce que DJAMA fait pour vous
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Une offre complète,<br />
              <span style={{ color: GOLD }}>un seul interlocuteur.</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: FileText,   color: "#c9a55a", title: "Marchés publics & privés", desc: "Nous vous aidons à rédiger et soumettre vos réponses aux appels d'offres pour décrocher de nouveaux contrats." },
              { Icon: TrendingUp, color: "#4ade80", title: "Aides & subventions",      desc: "Identification et accompagnement pour accéder aux aides auxquelles votre entreprise a droit." },
              { Icon: Globe,      color: "#38bdf8", title: "Fournisseurs & sourcing",  desc: "Recherche de fournisseurs adaptés à votre activité, en France et à l'international." },
              { Icon: Rocket,     color: "#a78bfa", title: "Création web & app",       desc: "Sites vitrines, e-commerce, applications web — conçus pour générer des résultats concrets." },
              { Icon: Brain,      color: "#f472b6", title: "Coaching IA",              desc: "Apprenez à utiliser l'IA pour automatiser vos tâches et développer votre activité plus vite." },
              { Icon: BookOpen,   color: "#f97316", title: "Soutien scolaire",         desc: "Des cours avec des professeurs experts pour accompagner vos enfants dans leur réussite scolaire." },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.65)] p-5"
              >
                <div className="pointer-events-none absolute inset-0 opacity-25" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}22 0%, transparent 60%)` }} />
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: color + "18", borderColor: color + "35" }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white/90">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/45">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          VALEURS
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#a78bfa", borderColor: "#a78bfa30", backgroundColor: "#a78bfa0d" }}
            >
              Ce en quoi nous croyons
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Nos valeurs, notre ADN.
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.65)] p-5"
              >
                <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}20 0%, transparent 60%)` }} />
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: color + "18", borderColor: color + "35" }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white/90">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/45">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TÉMOIGNAGES
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#4ade80", borderColor: "#4ade8030", backgroundColor: "#4ade800d" }}
            >
              <Star size={10} fill="#4ade80" style={{ color: "#4ade80" }} />
              Ils nous font confiance
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Ce que disent<br />
              <span style={{ color: GOLD }}>nos clients.</span>
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {TEMOIGNAGES.map(({ text, author, role, initials, color }, i) => (
              <motion.div
                key={author}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-6 flex flex-col"
              >
                <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${color}12 0%, transparent 60%)` }} />
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

                {/* Guillemets */}
                <Quote size={24} className="relative mb-3 shrink-0 opacity-30" style={{ color }} />

                {/* Texte */}
                <p className="relative flex-1 text-sm leading-relaxed text-white/60 italic">"{text}"</p>

                {/* Auteur */}
                <div className="relative mt-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    style={{ backgroundColor: color + "20", color, border: `1px solid ${color}35` }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{author}</p>
                    <p className="text-[0.65rem] text-white/35">{role}</p>
                  </div>
                  {/* Étoiles */}
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={10} fill="#f59e0b" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Résultats clés */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { value: "50+",  label: "Clients satisfaits",        color: "#c9a55a" },
              { value: "100+", label: "Marchés & projets réalisés", color: "#4ade80" },
              { value: "-30%", label: "Coûts fournisseurs en moy.", color: "#38bdf8" },
              { value: "5★",   label: "Note moyenne clients",      color: "#f59e0b" },
            ].map(({ value, label, color }) => (
              <div key={label} className="relative overflow-hidden rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.6)] px-4 py-4 text-center">
                <div className="pointer-events-none absolute inset-0 opacity-15" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}40 0%, transparent 70%)` }} />
                <p className="relative text-2xl font-black" style={{ color }}>{value}</p>
                <p className="relative mt-0.5 text-[0.65rem] text-white/45">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ÉQUIPE
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-10 text-center"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#38bdf8", borderColor: "#38bdf830", backgroundColor: "#38bdf80d" }}
            >
              <Users size={10} />
              Les pôles de DJAMA
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Notre équipe.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/40">
              Une équipe pluridisciplinaire qui s'investit dans votre réussite comme si c'était la sienne.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map(({ name, role, initials, color, bio, tags }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-6"
              >
                <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${color}14 0%, transparent 60%)` }} />
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                <div className="relative mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black" style={{ backgroundColor: color + "20", color, border: `2px solid ${color}40` }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">{name}</p>
                    <p className="mt-0.5 text-xs text-white/40">{role}</p>
                  </div>
                </div>
                <p className="relative text-xs leading-relaxed text-white/45">{bio}</p>
                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-[0.6rem] font-semibold text-white/40">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════ */}
      <section className="relative z-10 pb-24 pt-8">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
          >
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Prêt à travailler<br />
              <span style={{ color: GOLD }}>avec nous ?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
              Décrivez votre projet — nous vous répondons sous 24h avec une proposition
              claire, adaptée et sans engagement.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-7 py-3.5 text-sm">
                Démarrer un projet <ArrowRight size={15} />
              </Link>
              <a
                href="https://wa.me/262693523665"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.08)] px-6 py-3.5 text-sm font-semibold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.14)]"
              >
                <MessageCircle size={15} />
                WhatsApp direct
              </a>
              <a
                href="mailto:contact@djama.space"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/55 transition hover:border-white/20 hover:text-white/80"
              >
                <Mail size={14} />
                contact@djama.space
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
