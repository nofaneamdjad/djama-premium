"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Mail, MessageCircle, Users, Lightbulb,
  Zap, ShieldCheck, HeartHandshake, Star, Globe,
  CheckCircle2, Rocket, Target, Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

const STATS = [
  { value: "50+",  label: "Clients accompagnés",  sub: "entrepreneurs & entreprises",   color: "#c9a55a" },
  { value: "100+", label: "Projets livrés",        sub: "sites, apps, outils, design",   color: "#a78bfa" },
  { value: "100%", label: "Sur mesure",            sub: "chaque solution est unique",    color: "#38bdf8" },
  { value: "24h",  label: "Délai de réponse",      sub: "réactivité garantie",           color: "#4ade80" },
];

const VALUES = [
  {
    Icon: ShieldCheck,
    color: "#4ade80",
    title: "Fiabilité",
    desc: "Délais respectés, livrables soignés, communication transparente à chaque étape du projet.",
  },
  {
    Icon: Zap,
    color: "#f59e0b",
    title: "Rapidité",
    desc: "Des process optimisés avec l'IA pour livrer vite, sans jamais compromettre la qualité.",
  },
  {
    Icon: Target,
    color: "#38bdf8",
    title: "Efficacité",
    desc: "Chaque solution est pensée pour produire de vrais résultats mesurables pour votre activité.",
  },
  {
    Icon: HeartHandshake,
    color: "#f472b6",
    title: "Accompagnement",
    desc: "Un suivi humain, personnalisé et adapté à votre réalité — pas un ticket de support anonyme.",
  },
  {
    Icon: Lightbulb,
    color: "#a78bfa",
    title: "Innovation",
    desc: "Veille technologique constante pour intégrer les meilleures solutions disponibles sur le marché.",
  },
  {
    Icon: Globe,
    color: "#c9a55a",
    title: "Accessibilité",
    desc: "Des solutions modernes pour tous les profils — entrepreneur, PME, particulier ou étudiant.",
  },
];

const TEAM = [
  {
    name: "Ibrahima D.",
    role: "Fondateur & Directeur",
    initials: "ID",
    color: "#c9a55a",
    bio: "Passionné de technologie et de digital, Ibrahima a fondé DJAMA avec la conviction que chaque entrepreneur mérite des outils modernes et un accompagnement humain de qualité.",
    tags: ["Développement web", "IA & Automatisation", "Stratégie digitale"],
  },
  {
    name: "Équipe DJAMA",
    role: "Développeurs & Designers",
    initials: "DJ",
    color: "#a78bfa",
    bio: "Une équipe pluridisciplinaire de développeurs, designers et experts IA qui travaillent ensemble pour livrer des solutions sur mesure à chaque client.",
    tags: ["Design UI/UX", "Développement", "Créativité"],
  },
  {
    name: "Pôle Accompagnement",
    role: "Conseillers & Coaches",
    initials: "PA",
    color: "#38bdf8",
    bio: "Des spécialistes de l'administratif, du coaching IA et du soutien scolaire, dédiés à vous aider à progresser dans votre vie professionnelle et personnelle.",
    tags: ["Administratif", "Coaching IA", "Soutien scolaire"],
  },
];

const MILESTONES = [
  { year: "2022", title: "Création de DJAMA",           desc: "Lancement de l'activité avec les premiers services de création web." },
  { year: "2023", title: "Suite d'outils PRO",           desc: "Développement de l'espace client avec factures, planning et outils métier." },
  { year: "2024", title: "Intégration de l'IA",          desc: "Ajout du coaching IA, de l'assistant intelligent et de la génération de contrats." },
  { year: "2025", title: "50+ clients, 100+ projets",    desc: "Franchissement d'un cap majeur — une communauté d'entrepreneurs qui nous fait confiance." },
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
            <span className="text-white">Une vision moderne</span>
            <br />
            <span style={{ color: GOLD }}>du digital.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-white/50 sm:text-lg"
          >
            DJAMA est née d'une conviction simple : chaque entrepreneur mérite des outils
            professionnels modernes et un accompagnement humain de qualité — sans se ruiner,
            sans technicité inutile.
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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
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
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HISTOIRE / MISSION
      ════════════════════════════════════════════ */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">

            {/* Text */}
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
                Née pour simplifier<br />
                <span style={{ color: GOLD }}>le quotidien des pros.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                DJAMA est une plateforme qui combine création digitale, outils professionnels
                et accompagnement personnalisé. L'idée de départ est simple : pourquoi les
                entrepreneurs devraient-ils jongler entre 10 outils différents pour gérer leur
                activité ?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                En centralisant factures, planning, chrono, CRM, trésorerie et bien plus dans
                un seul espace, DJAMA permet à chaque professionnel de se concentrer sur ce
                qui compte vraiment — développer son activité.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {["Suite d'outils PRO", "Accompagnement humain", "IA intégrée", "100% sur mesure"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/55"
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
              {MILESTONES.map(({ year, title, desc }, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                  className="flex gap-4 rounded-2xl border border-white/7 bg-[rgba(15,17,23,0.6)] p-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    style={{ backgroundColor: GOLD + "18", color: GOLD, border: `1px solid ${GOLD}30` }}
                  >
                    {year}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/85">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/40">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
              Une équipe passionnée, pluridisciplinaire et disponible — prête à s'investir
              dans votre projet comme si c'était le sien.
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
                {/* Subtle top glow */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${color}18 0%, transparent 60%)` }}
                />
                {/* Top gradient bar */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

                {/* Avatar */}
                <div className="relative mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
                    style={{ backgroundColor: color + "20", color, border: `2px solid ${color}40` }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">{name}</p>
                    <p className="mt-0.5 text-xs text-white/40">{role}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="relative text-xs leading-relaxed text-white/45">{bio}</p>

                {/* Tags */}
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
            {/* Gradient top */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }} />
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
                  Nous ne sommes pas une agence classique. Nous combinons technologie de pointe,
                  accompagnement humain et tarifs accessibles pour que chaque entrepreneur —
                  quel que soit son niveau — puisse avancer.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { Icon: Rocket,       color: "#c9a55a", text: "Livraison rapide grâce à nos workflows optimisés"   },
                  { Icon: CheckCircle2, color: "#4ade80", text: "Qualité premium sur chaque livrable"                },
                  { Icon: HeartHandshake, color: "#f472b6", text: "Accompagnement humain, pas un ticket anonyme"     },
                  { Icon: Clock,        color: "#38bdf8", text: "Réponse sous 24h, tous les jours"                   },
                  { Icon: Users,        color: "#a78bfa", text: "Équipe pluridisciplinaire à votre service"          },
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
