"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Mail, MessageCircle, Users, Lightbulb,
  Zap, ShieldCheck, HeartHandshake, Star, Globe,
  CheckCircle2, Rocket, Target, Clock, FileText,
  TrendingUp, BookOpen, Brain,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

const STATS = [
  { value: "2022", label: "Année de création",       sub: "fondée par Nofane AMDJAD",      color: "#c9a55a" },
  { value: "50+",  label: "Clients accompagnés",      sub: "entrepreneurs & entreprises",   color: "#a78bfa" },
  { value: "100+", label: "Projets livrés",            sub: "web, apps, design, vidéo",      color: "#38bdf8" },
  { value: "24h",  label: "Délai de réponse",          sub: "réactivité garantie",           color: "#4ade80" },
];

const VALUES = [
  {
    Icon: ShieldCheck,
    color: "#4ade80",
    title: "Fiabilité",
    desc: "Délais respectés, livrables soignés, communication transparente à chaque étape.",
  },
  {
    Icon: TrendingUp,
    color: "#c9a55a",
    title: "Croissance",
    desc: "Chaque solution est pensée pour augmenter concrètement votre chiffre d'affaires.",
  },
  {
    Icon: Target,
    color: "#38bdf8",
    title: "Efficacité",
    desc: "Des process optimisés pour livrer vite et bien — sans technicité inutile.",
  },
  {
    Icon: HeartHandshake,
    color: "#f472b6",
    title: "Accompagnement",
    desc: "Un suivi humain et personnalisé — pas un ticket de support anonyme.",
  },
  {
    Icon: Lightbulb,
    color: "#a78bfa",
    title: "Innovation",
    desc: "Veille constante pour intégrer l'IA et les meilleures technologies disponibles.",
  },
  {
    Icon: Globe,
    color: "#f97316",
    title: "Accessibilité",
    desc: "Des solutions adaptées à tous — artisan, auto-entrepreneur, PME ou étudiant.",
  },
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

          {/* Badge */}
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

          {/* Title */}
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

          {/* Subtitle */}
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

          {/* CTA */}
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
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}30 0%, transparent 70%)` }}
                />
                <p className="relative text-3xl font-black" style={{ color }}>{value}</p>
                <p className="relative mt-1 text-xs font-bold text-white/75">{label}</p>
                <p className="relative mt-0.5 text-[0.6rem] text-white/30">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HISTOIRE / MISSION
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">

            {/* Texte fondateur */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
            >
              <span
                className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
                style={{ color: GOLD, borderColor: GOLD + "30", backgroundColor: GOLD + "0d" }}
              >
                Notre histoire
              </span>
              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                Tout est parti d'un<br />
                <span style={{ color: GOLD }}>constat simple.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                En 2022, Nofane AMDJAD remarque que beaucoup de petites entreprises
                ne savent pas comment répondre à un marché public ou privé, ne connaissent
                pas les aides auxquelles elles ont droit, et peinent à trouver des fournisseurs
                adaptés à leur activité.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Il crée DJAMA avec une mission claire : accompagner les entrepreneurs pour
                qu'ils augmentent leur chiffre d'affaires, accèdent aux bonnes opportunités
                et gèrent leur activité sans se noyer dans les démarches administratives.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                En parallèle, DJAMA propose la création de sites web, d'applications, de
                visuels et de montages vidéo pour donner à chaque entrepreneur une image
                professionnelle à la hauteur de ses ambitions.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                En 2026, DJAMA franchit une nouvelle étape avec le lancement de sa
                plateforme d'outils tout-en-un, de son programme Coaching IA et de
                son service de soutien scolaire avec des professeurs experts.
              </p>

              {/* Tags services */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Marchés publics & privés",
                  "Aides & subventions",
                  "Fournisseurs",
                  "Création web & app",
                  "Design & vidéo",
                  "Coaching IA",
                  "Soutien scolaire",
                  "Plateforme PRO",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
              className="space-y-4"
            >
              {MILESTONES.map(({ year, color, title, desc }, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                  className="relative overflow-hidden flex gap-4 rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-4"
                >
                  {/* Left accent */}
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CE QU'ON FAIT CONCRÈTEMENT
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#38bdf8", borderColor: "#38bdf830", backgroundColor: "#38bdf80d" }}
            >
              Ce que DJAMA fait pour vous
            </span>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Une offre complète,<br />
              <span style={{ color: GOLD }}>un seul interlocuteur.</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: FileText,      color: "#c9a55a", title: "Marchés publics & privés", desc: "Nous vous aidons à rédiger et soumettre vos réponses aux appels d'offres pour décrocher de nouveaux contrats." },
              { Icon: TrendingUp,    color: "#4ade80", title: "Aides & subventions",       desc: "Identification et accompagnement pour accéder aux aides auxquelles votre entreprise a droit." },
              { Icon: Globe,         color: "#38bdf8", title: "Fournisseurs & sourcing",   desc: "Recherche de fournisseurs adaptés à votre activité, en France et à l'international." },
              { Icon: Rocket,        color: "#a78bfa", title: "Création web & app",        desc: "Sites vitrines, e-commerce, applications web — conçus pour générer des résultats concrets." },
              { Icon: Brain,         color: "#f472b6", title: "Coaching IA",               desc: "Apprenez à utiliser l'IA pour automatiser vos tâches et développer votre activité plus vite." },
              { Icon: BookOpen,      color: "#f97316", title: "Soutien scolaire",          desc: "Des cours avec des professeurs experts pour accompagner vos enfants dans leur réussite scolaire." },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.65)] p-5"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}22 0%, transparent 60%)` }}
                />
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ backgroundColor: color + "18", borderColor: color + "35" }}
                >
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#a78bfa", borderColor: "#a78bfa30", backgroundColor: "#a78bfa0d" }}
            >
              Ce en quoi nous croyons
            </span>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
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
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}20 0%, transparent 60%)` }}
                />
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ backgroundColor: color + "18", borderColor: color + "35" }}
                >
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
              style={{ color: "#38bdf8", borderColor: "#38bdf830", backgroundColor: "#38bdf80d" }}
            >
              <Users size={10} />
              Les personnes derrière DJAMA
            </span>
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Notre équipe.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/40">
              Une équipe passionnée, pluridisciplinaire et disponible — qui s'investit
              dans votre réussite comme si c'était la sienne.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {TEAM.map(({ name, role, initials, color, bio, tags }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-6"
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${color}16 0%, transparent 60%)` }}
                />
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />

                {/* Avatar */}
                <div className="relative mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black"
                    style={{ backgroundColor: color + "20", color, border: `2px solid ${color}40` }}
                  >
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
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-[0.6rem] font-semibold text-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          POURQUOI DJAMA
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="relative overflow-hidden rounded-[2rem] border bg-[rgba(15,17,23,0.75)] p-8 sm:p-10"
            style={{ borderColor: GOLD + "25" }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)` }} />
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${GOLD}07 0%, transparent 60%)` }} />

            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span
                  className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
                  style={{ color: GOLD, borderColor: GOLD + "30", backgroundColor: GOLD + "0d" }}
                >
                  Notre différence
                </span>
                <h2 className="text-2xl font-black text-white sm:text-3xl">
                  Pourquoi choisir<br />
                  <span style={{ color: GOLD }}>DJAMA ?</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  Chez DJAMA, on ne vend pas juste un service — on s'implique dans votre
                  réussite. De la réponse aux appels d'offres à la création de votre site,
                  en passant par le coaching IA, on est là à chaque étape.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { Icon: FileText,      color: "#c9a55a",  text: "Aide concrète sur les marchés publics et privés"         },
                  { Icon: CheckCircle2,  color: "#4ade80",  text: "Accompagnement pour accéder aux aides et subventions"     },
                  { Icon: HeartHandshake,color: "#f472b6",  text: "Relation humaine directe — pas un ticket de support"      },
                  { Icon: Clock,         color: "#38bdf8",  text: "Réponse sous 24h, tous les jours"                         },
                  { Icon: Zap,           color: "#a78bfa",  text: "Plateforme PRO tout-en-un lancée en 2026"                 },
                  { Icon: BookOpen,      color: "#f97316",  text: "Coaching IA & soutien scolaire avec experts"              },
                ].map(({ Icon, color, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: color + "18", border: `1px solid ${color}30` }}
                    >
                      <Icon size={13} style={{ color }} />
                    </div>
                    <p className="text-xs font-semibold text-white/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
