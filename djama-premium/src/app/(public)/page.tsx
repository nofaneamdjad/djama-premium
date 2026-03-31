"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Globe, Brain, GraduationCap, Wrench,
  Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles, StickyNote, Calendar, ReceiptText,
  Code2, Layers, TrendingUp, Clock,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport } from "@/lib/animations";
import { WordReveal, MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const data = getSiteData();

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        {/* Glows */}
        <div className="pointer-events-none absolute left-[10%] top-[15%] h-[600px] w-[600px] rounded-full bg-[rgba(201,165,90,0.09)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[-80px] bottom-[10%] h-[350px] w-[350px] rounded-full bg-[rgba(59,130,246,0.06)] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-36">
          <div className="grid items-center gap-14 lg:grid-cols-2">

            {/* Texte gauche */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease }}
                className="mb-7"
              >
                <span className="badge badge-gold-dark">
                  <Sparkles size={10} /> Agence digitale & SaaS — La Réunion
                </span>
              </motion.div>

              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={["Agence digitale.", "Outils SaaS.", "Résultats réels."]}
                  highlight={2}
                  stagger={0.18}
                  wordStagger={0.07}
                  delay={0.1}
                  lineClassName="block"
                />
              </h1>

              <FadeReveal delay={0.6} as="p" className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
                Sites web, applications sur mesure, outils de gestion pro et coaching IA.
                Tout ce dont votre activité a besoin — dans un seul endroit.
              </FadeReveal>

              <FadeReveal delay={0.75} className="mt-9 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-primary">
                  Demander un devis <ArrowRight size={15} />
                </Link>
                <Link href="/services" className="btn-ghost">
                  Découvrir les services
                </Link>
              </FadeReveal>

              {/* Preuves sociales */}
              <FadeReveal delay={0.9} className="mt-10 flex items-center gap-5 border-t border-white/8 pt-8">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ zIndex: 5 - i }}
                      className="h-8 w-8 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={11} className="fill-[#c9a55a] text-[#c9a55a]"/>)}
                  </div>
                  <p className="text-sm text-white/45">
                    <span className="font-bold text-white/75">+50 clients</span> accompagnés depuis 2022
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* Card droite */}
            <motion.div
              initial={{ opacity: 0, y: 44, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.4, ease }}
            >
              <div className="glass-card overflow-hidden p-0 shadow-premium-lg">
                {/* Header card */}
                <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/70"/>
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"/>
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/70"/>
                  </div>
                  <span className="text-[0.65rem] font-medium text-white/30 tracking-wider uppercase">espace client DJAMA</span>
                  <span className="badge badge-gold-dark text-[0.58rem]">Pro</span>
                </div>

                {/* Outils liste */}
                <div className="p-6 space-y-3">
                  {[
                    { icon: ReceiptText, label: "Factures & Devis",   sub: "PDF, TVA, logo, statuts",         color: "#4ade80"  },
                    { icon: Calendar,    label: "Planning & Agenda",   sub: "Aujourd'hui · Semaine · Mois",    color: "#60a5fa"  },
                    { icon: StickyNote,  label: "Bloc-notes pro",      sub: "Catégories, export PDF",          color: "#c9a55a"  },
                  ].map(({ icon: Icon, label, sub, color }, i) => (
                    <motion.div key={label}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease }}
                      className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/4 px-4 py-3 transition hover:bg-white/7"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8"
                        style={{ background: `${color}18` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/85">{label}</p>
                        <p className="text-[0.65rem] text-white/35 truncate">{sub}</p>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400/70 shrink-0" />
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-white/8 px-6 py-4">
                  <Link href="/abonnement"
                    className="flex items-center justify-between text-sm font-semibold text-[#c9a55a] transition hover:opacity-75">
                    <span>Accéder à l&apos;espace client</span>
                    <ArrowRight size={14}/>
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════
          2. CHIFFRES / CONFIANCE
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: Users,      value: "50+",   label: "Clients accompagnés",   sub: "depuis 2022"           },
            { icon: Code2,      value: "30+",   label: "Projets livrés",        sub: "sites, apps, outils"   },
            { icon: Zap,        value: "3×",    label: "Plus rapide avec l'IA", sub: "automatisation réelle" },
            { icon: Clock,      value: "24h",   label: "Délai de réponse",      sub: "garanti en semaine"    },
          ].map(({ icon: Icon, value, label, sub }) => (
            <motion.div key={label} variants={cardReveal}
              className="card-premium flex flex-col items-center gap-1.5 p-6 text-center">
              <div className="mb-2 inline-flex rounded-xl bg-[rgba(201,165,90,0.08)] p-2.5">
                <Icon size={20} className="text-[#c9a55a]" />
              </div>
              <p className="text-3xl font-black tracking-tight text-[var(--ink)]">{value}</p>
              <p className="text-sm font-bold text-[var(--ink)]">{label}</p>
              <p className="text-xs text-[var(--muted)]">{sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. SERVICES
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> Ce que nous faisons
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Des services digitaux", "qui génèrent des résultats."]}
                  highlight={1}
                  stagger={0.14}
                  wordStagger={0.065}
                />
              </h2>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/services" className="btn-primary text-sm">
                Voir tous les services <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Globe,
                color: "#60a5fa",
                title: "Sites web & Applications",
                desc: "Sites vitrines, e-commerce, applications web sur mesure. Design moderne et performances au premier plan.",
                items: ["Site vitrine premium", "Application web", "E-commerce", "Refonte & optimisation"],
                href: "/services",
              },
              {
                icon: Layers,
                color: "#a78bfa",
                title: "Création & Design",
                desc: "Montage vidéo, retouche photo, visuels pour les réseaux. Votre image, enfin à la hauteur de votre ambition.",
                items: ["Montage vidéo", "Design graphique", "Visuels sociaux", "Branding"],
                href: "/services",
              },
              {
                icon: Brain,
                color: "#c9a55a",
                title: "Coaching IA",
                desc: "Apprenez à utiliser l'IA pour automatiser vos tâches, gagner du temps et faire évoluer votre activité.",
                items: ["3 mois d'accompagnement", "Séances individuelles", "Outils sélectionnés", "Suivi personnalisé"],
                href: "/coaching-ia",
              },
              {
                icon: GraduationCap,
                color: "#4ade80",
                title: "Soutien scolaire",
                desc: "Cours particuliers pour les élèves de la 6e à la Terminale, toutes matières, à votre rythme.",
                items: ["6e → Terminale", "Toutes matières", "Cours à la carte", "Flexibilité totale"],
                href: "/soutien-scolaire",
              },
            ].map(({ icon: Icon, color, title, desc, items, href }) => (
              <motion.div key={title} variants={cardReveal}>
                <Link href={href} className="group card-premium flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-5 inline-flex rounded-2xl p-3 transition-colors"
                    style={{ background: `${color}14` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2.5"
                    style={{ color }}>
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
      <section className="hero-dark relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-[30%] top-0 h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[120px]" />
        <div className="pointer-events-none absolute right-[10%] bottom-0 h-[350px] w-[350px] rounded-full bg-[rgba(96,165,250,0.06)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Sparkles size={10} /> Espace client
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal
                  lines={["Trois outils pro.", "Un seul abonnement."]}
                  highlight={0}
                  stagger={0.15}
                  wordStagger={0.07}
                  lineClassName="text-white"
                />
              </h2>
              <FadeReveal delay={0.3} as="p" className="mt-4 max-w-md text-base text-white/50">
                Accédez à votre espace client DJAMA et gérez votre activité avec des outils pensés pour les pros.
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
                bg: "rgba(34,197,94,0.08)",
                border: "rgba(34,197,94,0.2)",
                desc: "Créez des factures et devis professionnels en quelques secondes. Logo, couleurs, TVA, RIB, export PDF.",
                features: ["Numérotation automatique", "Export PDF premium", "Suivi des statuts", "Coordonnées bancaires"],
              },
              {
                icon: Calendar,
                label: "Planning & Agenda",
                color: "#60a5fa",
                bg: "rgba(59,130,246,0.08)",
                border: "rgba(59,130,246,0.2)",
                desc: "Visualisez et organisez votre agenda en vue Jour, Semaine ou Mois. Ajoutez des événements en un clic.",
                features: ["Vue Aujourd'hui / Semaine / Mois", "Catégories par couleur", "Note rapide intégrée", "Horloge en temps réel"],
              },
              {
                icon: StickyNote,
                label: "Bloc-notes pro",
                color: "#c9a55a",
                bg: "rgba(201,165,90,0.08)",
                border: "rgba(201,165,90,0.2)",
                desc: "Rédigez, organisez et retrouvez vos notes professionnelles par catégorie. Exportez en PDF en un clic.",
                features: ["Catégories : Réunion, Tâches, Idées", "Recherche instantanée", "Export PDF", "Sauvegarde automatique"],
              },
            ].map(({ icon: Icon, label, color, bg, border, desc, features }) => (
              <motion.div key={label} variants={cardReveal}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300"
                style={{ background: bg, borderColor: border }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${color}22`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {/* Glow coin */}
                <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full opacity-25 blur-[50px]"
                  style={{ background: color }} />

                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{ color, background: bg, borderColor: border }}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-extrabold text-white">{label}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/45">{desc}</p>

                <ul className="mt-5 space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-white/55">
                      <CheckCircle2 size={11} style={{ color }} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Accès CTA */}
          <FadeReveal delay={0.4} className="mt-10 text-center">
            <Link href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
              Déjà client ? Se connecter à l&apos;espace pro <ArrowRight size={14} />
            </Link>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. RÉALISATIONS
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
        >
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> Réalisations
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Des projets concrets,", "des livrables irréprochables."]}
                  highlight={1}
                  stagger={0.14}
                  wordStagger={0.065}
                />
              </h2>
              <FadeReveal delay={0.25} as="p" className="mt-4 max-w-md text-base text-[var(--muted)]">
                Chaque projet est traité avec rigueur, du brief initial au livrable final.
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
                title: "Site vitrine professionnel",
                desc: "Design sur mesure, optimisation SEO, performances mobile-first. Livré en moins de 2 semaines.",
                color: "#c9a55a",
              },
              {
                num: "02",
                tag: "Application",
                title: "Plateforme de gestion métier",
                desc: "Interface SaaS complète avec tableau de bord, authentification, base de données sécurisée.",
                color: "#60a5fa",
              },
              {
                num: "03",
                tag: "Création visuelle",
                title: "Identité de marque & visuels",
                desc: "Logo, charte graphique, déclinaisons réseaux sociaux. Une image cohérente sur tous les supports.",
                color: "#a78bfa",
              },
            ].map(({ num, tag, title, desc, color }) => (
              <motion.div key={num} variants={cardReveal}
                className="group card-premium overflow-hidden transition-all duration-300 hover:-translate-y-1">
                {/* Image zone */}
                <div className="relative h-48 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${color}12 0%, rgba(8,10,15,0.04) 100%)` }}>
                  <div className="absolute left-5 top-5">
                    <span className="rounded-full border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
                      style={{ color, borderColor: `${color}40`, background: `${color}14` }}>
                      {tag}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-5 text-[72px] font-black leading-none select-none opacity-[0.07]"
                    style={{ color }}>
                    {num}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `${color}0d` }}>
                    <Link href="/realisations"
                      className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition"
                      style={{ color, borderColor: `${color}50`, background: `${color}14` }}>
                      Voir le projet <ArrowRight size={12}/>
                    </Link>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. POURQUOI DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Pourquoi nous choisir
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Ce qui nous distingue", "vraiment."]}
                highlight={1}
                stagger={0.15}
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
                desc: "Délais respectés, livrables propres, communication claire. Aucune mauvaise surprise.",
              },
              {
                icon: Zap,
                color: "#60a5fa",
                title: "Rapidité d'exécution",
                desc: "Grâce à l'IA et nos process rodés, nous livrons 3× plus vite sans jamais sacrifier la qualité.",
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
                desc: "Un interlocuteur unique, disponible, qui comprend votre secteur et vos contraintes.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <motion.div key={title} variants={cardReveal}
                className="card-premium flex flex-col gap-4 p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: `${color}14` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.2)] bg-[var(--ink)] px-8 py-16 text-center shadow-premium-lg md:px-16"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute left-[20%] top-0 h-[300px] w-[400px] rounded-full bg-[rgba(201,165,90,0.09)] blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 right-[15%] h-[250px] w-[300px] rounded-full bg-[rgba(96,165,250,0.06)] blur-[80px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Parlons de votre projet
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Prêt à passer à", "la vitesse supérieure ?"]}
                highlight={1}
                stagger={0.16}
                wordStagger={0.08}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.3} as="p" className="mx-auto mt-5 max-w-lg text-lg text-white/50">
              Devis gratuit, réponse sous 24h. On étudie votre projet sérieusement
              et on vous propose la meilleure solution.
            </FadeReveal>

            <FadeReveal delay={0.45} className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-3.5 text-base">
                Demander un devis gratuit <ArrowRight size={16} />
              </Link>
              <Link href="/abonnement" className="btn-ghost px-8 py-3.5 text-base">
                Voir les offres
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.55} className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
              <a href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-sm text-white/40 transition hover:text-white/70">
                <Mail size={13} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/40">
                <CheckCircle2 size={13} className="text-[#c9a55a]" />
                Sans engagement · Réponse garantie 24h
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
