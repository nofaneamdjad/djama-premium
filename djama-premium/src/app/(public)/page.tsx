"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Globe, Brain, GraduationCap,
  Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles, StickyNote, Calendar, ReceiptText,
  Code2, Layers, TrendingUp, Clock, FileText,
  Briefcase, MessageSquare, ChevronRight, Lock,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport } from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const data = getSiteData();

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════
          1. HERO PREMIUM
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        {/* Glows décoratifs */}
        <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-[700px] w-[700px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[140px]" />
        <div className="pointer-events-none absolute right-[-80px] bottom-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.05)] blur-[110px]" />
        <div className="pointer-events-none absolute left-[50%] top-[30%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.04)] blur-[90px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-40">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_440px]">

            {/* ── Texte gauche ── */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="mb-8"
              >
                <span className="badge badge-gold-dark">
                  <Sparkles size={10} /> Agence digitale · La Réunion
                </span>
              </motion.div>

              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={["Votre présence", "digitale,", "réinventée."]}
                  highlight={2}
                  stagger={0.16}
                  wordStagger={0.06}
                  delay={0.1}
                  lineClassName="block"
                />
              </h1>

              <FadeReveal delay={0.65} as="p" className="mt-7 max-w-lg text-xl leading-relaxed text-white/50">
                Sites web, outils professionnels et accompagnement digital pour
                entrepreneurs, entreprises et particuliers.
              </FadeReveal>

              <FadeReveal delay={0.8} className="mt-10 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary px-7 py-4 text-base">
                  Découvrir les services <ArrowRight size={16} />
                </Link>
                <Link href="/realisations" className="btn-ghost px-7 py-4 text-base">
                  Voir les réalisations
                </Link>
              </FadeReveal>

              {/* Preuves sociales */}
              <FadeReveal delay={0.95} className="mt-12 flex items-center gap-5 border-t border-white/[0.07] pt-10">
                <div className="flex -space-x-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{ zIndex: 5 - i }}
                      className="h-9 w-9 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className="fill-[#c9a55a] text-[#c9a55a]" />
                    ))}
                  </div>
                  <p className="text-sm text-white/40">
                    <span className="font-bold text-white/70">+50 clients satisfaits</span> depuis 2022
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* ── Card droite ── */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.35, ease }}
            >
              <div className="glass-card overflow-hidden p-0 shadow-premium-lg">
                {/* Barre titre */}
                <div className="border-b border-white/[0.07] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <span className="text-[0.6rem] font-semibold tracking-widest text-white/25 uppercase">
                    espace client DJAMA
                  </span>
                  <span className="badge badge-gold-dark text-[0.58rem] py-0.5">PRO</span>
                </div>

                {/* Outils */}
                <div className="p-5 space-y-2.5">
                  {[
                    { icon: ReceiptText, label: "Factures & Devis",  sub: "PDF, TVA, logo, RIB",         color: "#4ade80" },
                    { icon: Calendar,    label: "Planning & Agenda",  sub: "Jour · Semaine · Mois",        color: "#60a5fa" },
                    { icon: StickyNote,  label: "Bloc-notes pro",     sub: "Catégories, export PDF",       color: "#c9a55a" },
                  ].map(({ icon: Icon, label, sub, color }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.55 + i * 0.1, ease }}
                      className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08]"
                        style={{ background: `${color}18` }}
                      >
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/85">{label}</p>
                        <p className="text-[0.62rem] text-white/35 truncate">{sub}</p>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400/70 shrink-0" />
                    </motion.div>
                  ))}
                </div>

                {/* Pricing line */}
                <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/35">Accès illimité</p>
                    <p className="text-sm font-bold text-[#c9a55a]">{data.offers.abonnement}</p>
                  </div>
                  <Link
                    href="/abonnement"
                    className="flex items-center gap-1.5 rounded-xl bg-[#c9a55a] px-3.5 py-1.5 text-xs font-bold text-[#09090b] transition hover:brightness-110"
                  >
                    Démarrer <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════
          2. CHIFFRES / CRÉDIBILITÉ
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: Users,      value: "50+",  label: "Clients accompagnés",       sub: "depuis 2022"           },
            { icon: Code2,      value: "100%", label: "Solutions personnalisées",   sub: "sur mesure, toujours"  },
            { icon: Zap,        value: "3×",   label: "Plus rapide grâce à l'IA",  sub: "automatisation réelle" },
            { icon: Clock,      value: "24h",  label: "Délai de réponse garanti",  sub: "en semaine"            },
          ].map(({ icon: Icon, value, label, sub }) => (
            <motion.div
              key={label}
              variants={cardReveal}
              className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_12px_40px_rgba(201,165,90,0.1)]"
            >
              <div className="mb-3 inline-flex rounded-xl bg-[rgba(201,165,90,0.08)] p-3">
                <Icon size={20} className="text-[#c9a55a]" />
              </div>
              <p className="text-4xl font-black tracking-tight text-[var(--ink)]">{value}</p>
              <p className="mt-1.5 text-sm font-bold text-[var(--ink)]">{label}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. SERVICES
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> Nos services
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Des services digitaux", "qui génèrent des résultats."]}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.06}
                />
              </h2>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/services" className="btn-primary text-sm">
                Tous les services <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Cards services */}
          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Globe,
                color: "#60a5fa",
                tag: "Web",
                title: "Sites web & Applications",
                desc: "Sites vitrines, e-commerce et applications web sur mesure. Design moderne, performances optimales, SEO inclus.",
                items: ["Site vitrine premium", "Application web / SaaS", "E-commerce", "Refonte & optimisation SEO"],
                href: "/services",
              },
              {
                icon: Layers,
                color: "#a78bfa",
                tag: "Design",
                title: "Création & Design visuel",
                desc: "Montage vidéo, retouche photo, visuels pour les réseaux. Votre image à la hauteur de votre ambition.",
                items: ["Montage vidéo professionnel", "Design graphique", "Visuels réseaux sociaux", "Branding & identité"],
                href: "/services",
              },
              {
                icon: Brain,
                color: "#c9a55a",
                tag: "IA",
                title: "Coaching IA",
                desc: "Apprenez à utiliser l'intelligence artificielle pour automatiser vos tâches et faire croître votre activité.",
                items: ["3 mois d'accompagnement", "Séances individuelles", "Outils IA sélectionnés", "Suivi personnalisé"],
                href: "/coaching-ia",
              },
              {
                icon: GraduationCap,
                color: "#4ade80",
                tag: "Scolaire",
                title: "Soutien scolaire",
                desc: "Cours particuliers de la 6e à la Terminale, toutes matières, adaptés au rythme et au niveau de chaque élève.",
                items: ["6e → Terminale, toutes matières", "Cours à la carte ou réguliers", "Flexibilité totale", "Progression mesurable"],
                href: "/soutien-scolaire",
              },
              {
                icon: Briefcase,
                color: "#f97316",
                tag: "Admin",
                title: "Accompagnement administratif",
                desc: "Aide aux démarches administratives, rédaction de courriers, gestion documentaire. Simplifié pour vous.",
                items: ["Démarches en ligne", "Rédaction de courriers", "Gestion documentaire", "Conseil & orientation"],
                href: "/services",
              },
              {
                icon: MessageSquare,
                color: "#ec4899",
                tag: "Digital",
                title: "Accompagnement digital",
                desc: "Formation aux outils numériques, prise en main d'un smartphone ou PC. Accessible à tous, sans jargon.",
                items: ["Formation outils digitaux", "Prise en main PC / smartphone", "Réseaux sociaux", "Sécurité numérique"],
                href: "/services",
              },
            ].map(({ icon: Icon, color, tag, title, desc, items, href }) => (
              <motion.div key={title} variants={cardReveal}>
                <Link
                  href={href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_20px_60px_rgba(0,0,0,0.09)]"
                >
                  {/* Tag */}
                  <span
                    className="mb-5 self-start rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
                    style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}
                  >
                    {tag}
                  </span>
                  <div
                    className="mb-4 inline-flex rounded-2xl p-3 transition-all duration-300"
                    style={{ background: `${color}12` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <ul className="mt-5 space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
                        <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="mt-6 flex items-center gap-1.5 text-xs font-bold transition-all duration-300 group-hover:gap-3"
                    style={{ color }}
                  >
                    En savoir plus <ArrowRight size={12} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. OUTILS PRO DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-32">
        <div className="pointer-events-none absolute left-[20%] top-0 h-[500px] w-[600px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[5%] bottom-0 h-[350px] w-[400px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Lock size={10} /> Espace client sécurisé
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal
                  lines={["Outils professionnels.", "Un seul abonnement."]}
                  highlight={0}
                  stagger={0.14}
                  wordStagger={0.07}
                  lineClassName="text-white"
                />
              </h2>
              <FadeReveal delay={0.3} as="p" className="mt-4 max-w-md text-base text-white/45">
                Gérez votre activité avec des outils SaaS pensés pour les
                indépendants, les auto-entrepreneurs et les TPE.
              </FadeReveal>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/abonnement" className="btn-primary text-sm">
                Voir l&apos;abonnement — {data.offers.abonnement} <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* 3 outil cards */}
          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ReceiptText,
                label: "Factures & Devis",
                color: "#4ade80",
                bg: "rgba(34,197,94,0.07)",
                border: "rgba(34,197,94,0.18)",
                desc: "Créez des documents professionnels en quelques secondes. Logo, couleurs, TVA, RIB, export PDF.",
                features: ["Numérotation automatique", "Export PDF premium", "Suivi des statuts (brouillon/envoyé/payé)", "Coordonnées bancaires RIB"],
              },
              {
                icon: Calendar,
                label: "Planning & Agenda",
                color: "#60a5fa",
                bg: "rgba(59,130,246,0.07)",
                border: "rgba(59,130,246,0.18)",
                desc: "Visualisez et organisez votre agenda en vue Jour, Semaine ou Mois. Ajoutez des événements facilement.",
                features: ["Vue Aujourd'hui / Semaine / Mois", "Catégories par couleur", "Note rapide intégrée", "Horloge en temps réel"],
              },
              {
                icon: StickyNote,
                label: "Bloc-notes pro",
                color: "#c9a55a",
                bg: "rgba(201,165,90,0.07)",
                border: "rgba(201,165,90,0.18)",
                desc: "Rédigez, organisez et retrouvez vos notes par catégorie. Sauvegarde automatique, export PDF.",
                features: ["Catégories : Réunion, Tâches, Idées", "Recherche instantanée", "Export PDF en un clic", "Sauvegarde cloud automatique"],
              },
            ].map(({ icon: Icon, label, color, bg, border, desc, features }) => (
              <motion.div
                key={label}
                variants={cardReveal}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border p-7 transition-all duration-400"
                style={{ background: bg, borderColor: border }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 24px 64px ${color}1e, 0 0 0 1px ${color}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Corner glow */}
                <div
                  className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-20 blur-[55px] transition-opacity duration-400 group-hover:opacity-40"
                  style={{ background: color }}
                />

                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{ color, background: bg, borderColor: border }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-white">{label}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/40">{desc}</p>

                <ul className="mt-6 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-white/55">
                      <CheckCircle2 size={12} style={{ color }} className="shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <FadeReveal delay={0.4} className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              Déjà client ? Accéder à l&apos;espace pro <ChevronRight size={14} />
            </Link>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. RÉALISATIONS
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
        >
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> Portfolio
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Des projets concrets,", "des livrables irréprochables."]}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.06}
                />
              </h2>
              <FadeReveal delay={0.25} as="p" className="mt-4 max-w-md text-base text-[var(--muted)]">
                Du brief initial au livrable final, chaque projet est traité avec rigueur et exigence.
              </FadeReveal>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/realisations" className="btn-primary text-sm">
                Voir toutes les réalisations <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {[
              {
                num: "01",
                tag: "Site web",
                tagColor: "#c9a55a",
                title: "Site vitrine professionnel",
                desc: "Design sur mesure, performances mobile-first, SEO optimisé. Livré en moins de 2 semaines.",
                accentColor: "#c9a55a",
              },
              {
                num: "02",
                tag: "Application SaaS",
                tagColor: "#60a5fa",
                title: "Plateforme de gestion métier",
                desc: "Interface SaaS complète avec tableau de bord, authentification sécurisée et base de données.",
                accentColor: "#60a5fa",
              },
              {
                num: "03",
                tag: "Identité visuelle",
                tagColor: "#a78bfa",
                title: "Branding & design visuel",
                desc: "Logo, charte graphique, déclinaisons réseaux. Une image cohérente sur tous les supports.",
                accentColor: "#a78bfa",
              },
            ].map(({ num, tag, tagColor, title, desc, accentColor }) => (
              <motion.div
                key={num}
                variants={cardReveal}
                className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)]"
              >
                {/* Image zone */}
                <div
                  className="relative h-52 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}10 0%, rgba(250,250,250,1) 100%)`,
                  }}
                >
                  {/* Tag */}
                  <div className="absolute left-4 top-4">
                    <span
                      className="rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
                      style={{ color: tagColor, background: `${tagColor}16`, border: `1px solid ${tagColor}35` }}
                    >
                      {tag}
                    </span>
                  </div>
                  {/* Grand numéro décoratif */}
                  <div
                    className="absolute bottom-3 right-4 select-none text-[90px] font-black leading-none opacity-[0.06]"
                    style={{ color: accentColor }}
                  >
                    {num}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ background: `${accentColor}0c` }}>
                    <Link
                      href="/realisations"
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold backdrop-blur-md transition"
                      style={{ color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}40` }}
                    >
                      Voir le projet <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
                {/* Contenu */}
                <div className="p-6">
                  <h3 className="font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <div
                    className="mt-4 flex items-center gap-1.5 text-xs font-bold transition-all duration-300 group-hover:gap-3"
                    style={{ color: accentColor }}
                  >
                    Voir le projet <ArrowRight size={11} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. POURQUOI DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-16 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Pourquoi nous choisir
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Ce qui nous distingue", "vraiment."]}
                highlight={1}
                stagger={0.14}
                wordStagger={0.07}
                lineClassName="justify-center"
              />
            </h2>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                color: "#c9a55a",
                title: "Fiabilité totale",
                desc: "Délais respectés, livrables propres, communication claire. Zéro mauvaise surprise.",
              },
              {
                icon: Zap,
                color: "#60a5fa",
                title: "Rapidité d'exécution",
                desc: "Grâce à l'IA et nos process rodés, nous livrons 3× plus vite sans sacrifier la qualité.",
              },
              {
                icon: TrendingUp,
                color: "#4ade80",
                title: "Orienté résultats",
                desc: "Chaque décision de design ou de code est guidée par un seul objectif : votre performance.",
              },
              {
                icon: Users,
                color: "#a78bfa",
                title: "Accompagnement humain",
                desc: "Un interlocuteur unique, disponible et attentif, qui comprend votre secteur et vos contraintes.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group flex flex-col gap-5 rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}12` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. OFFRES / TARIFS
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
        >
          <div className="mb-16 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Nos offres
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Des offres claires,", "adaptées à vos besoins."]}
                highlight={0}
                stagger={0.13}
                wordStagger={0.06}
                lineClassName="justify-center"
              />
            </h2>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Globe,
                color: "#60a5fa",
                title: "Sites web & Applications",
                price: "Sur devis",
                priceNote: "selon le projet",
                items: ["Site vitrine", "Application web", "E-commerce", "Refonte"],
                href: "/contact",
                cta: "Demander un devis",
                featured: false,
              },
              {
                icon: ReceiptText,
                color: "#c9a55a",
                title: "Outils pro DJAMA",
                price: data.offers.abonnement,
                priceNote: "accès illimité",
                items: ["Factures & Devis PDF", "Planning & Agenda", "Bloc-notes pro", "Espace client sécurisé"],
                href: "/abonnement",
                cta: "S'abonner maintenant",
                featured: true,
              },
              {
                icon: Brain,
                color: "#a78bfa",
                title: "Coaching IA",
                price: data.offers.coaching,
                priceNote: "3 mois d'accompagnement",
                items: ["Séances individuelles", "Outils IA sélectionnés", "Automatisation de tâches", "Suivi personnalisé"],
                href: "/coaching-ia",
                cta: "Découvrir le coaching",
                featured: false,
              },
              {
                icon: GraduationCap,
                color: "#4ade80",
                title: "Soutien scolaire",
                price: data.offers.soutien,
                priceNote: "par heure de cours",
                items: ["6e → Terminale", "Toutes matières", "Cours à domicile / en ligne", "Flexibilité totale"],
                href: "/soutien-scolaire",
                cta: "Réserver un cours",
                featured: false,
              },
            ].map(({ icon: Icon, color, title, price, priceNote, items, href, cta, featured }) => (
              <motion.div key={title} variants={cardReveal}>
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-300 hover:-translate-y-1 ${
                    featured
                      ? "border-[rgba(201,165,90,0.4)] bg-[var(--ink)] shadow-[0_20px_60px_rgba(201,165,90,0.15)]"
                      : "border-[var(--border)] bg-white shadow-sm hover:border-transparent hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)]"
                  }`}
                >
                  {featured && (
                    <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgba(201,165,90,0.08)] blur-[60px]" />
                  )}
                  {featured && (
                    <div className="absolute right-4 top-4">
                      <span className="badge badge-gold-dark text-[0.58rem]">Populaire</span>
                    </div>
                  )}
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `${color}14` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className={`font-extrabold ${featured ? "text-white" : "text-[var(--ink)]"}`}>{title}</h3>
                  <div className="mt-4 mb-5">
                    <p className="text-2xl font-black" style={{ color }}>{price}</p>
                    <p className={`text-xs mt-0.5 ${featured ? "text-white/40" : "text-[var(--muted)]"}`}>{priceNote}</p>
                  </div>
                  <ul className="flex-1 space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className={`flex items-center gap-2.5 text-sm ${featured ? "text-white/65" : "text-[var(--muted)]"}`}>
                        <CheckCircle2 size={13} style={{ color }} className="shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href}
                    className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      featured
                        ? "bg-gradient-to-r from-[#c9a55a] to-[#b08d57] text-[#09090b] hover:brightness-110 hover:shadow-[0_8px_24px_rgba(201,165,90,0.35)]"
                        : "border border-[var(--border)] text-[var(--ink)] hover:border-transparent hover:bg-[var(--ink)] hover:text-white"
                    }`}
                  >
                    {cta} <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.22)] bg-[var(--ink)] px-8 py-20 text-center shadow-premium-lg md:px-16"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute left-[15%] top-[-60px] h-[350px] w-[450px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-40px] right-[10%] h-[280px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[90px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Parlons de votre projet
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Créons ensemble", "votre solution digitale."]}
                highlight={0}
                stagger={0.15}
                wordStagger={0.07}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.3} as="p" className="mx-auto mt-6 max-w-xl text-lg text-white/45">
              Devis gratuit, réponse sous 24h. Nous étudions votre projet sérieusement
              et proposons la meilleure solution pour votre activité.
            </FadeReveal>

            <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                Demander un devis gratuit <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost px-8 py-4 text-base">
                Découvrir les services
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.55} className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
              <a
                href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-sm text-white/35 transition hover:text-white/65"
              >
                <Mail size={13} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/35">
                <CheckCircle2 size={13} className="text-[#c9a55a]" />
                Sans engagement · Réponse garantie 24h
              </span>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/35">
                <FileText size={13} className="text-[#c9a55a]" />
                Devis gratuit & détaillé
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
