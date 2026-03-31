"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles, StickyNote, Calendar, ReceiptText,
  TrendingUp, FileText, Search, Wrench, HeartHandshake,
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
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        <div className="pointer-events-none absolute left-[-80px] top-[-60px] h-[700px] w-[700px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[140px]" />
        <div className="pointer-events-none absolute right-[-60px] bottom-[8%] h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.05)] blur-[110px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-36 pt-44">
          <div className="flex flex-col items-center text-center">

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="mb-8"
            >
              <span className="badge badge-gold-dark">
                <Sparkles size={10} /> Création digitale &amp; outils professionnels
              </span>
            </motion.div>

            <h1 className="display-hero max-w-4xl text-white">
              <MultiLineReveal
                lines={["Votre présence digitale,", "simplifiée."]}
                highlight={1}
                stagger={0.16}
                wordStagger={0.06}
                delay={0.1}
                lineClassName="block justify-center"
              />
            </h1>

            <FadeReveal delay={0.65} as="p" className="mt-7 max-w-2xl text-xl leading-relaxed text-white/50">
              DJAMA accompagne particuliers, entrepreneurs et entreprises dans la création
              de leur présence digitale, leurs outils professionnels et leurs projets numériques.
            </FadeReveal>

            <FadeReveal delay={0.8} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/realisations" className="btn-primary px-7 py-4 text-base">
                Découvrir les réalisations <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost px-7 py-4 text-base">
                Découvrir les services
              </Link>
            </FadeReveal>

            {/* Preuves sociales */}
            <FadeReveal delay={0.95} className="mt-14 flex items-center justify-center gap-5 border-t border-white/[0.07] pt-10">
              <div className="flex -space-x-2.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{ zIndex: 5 - i }}
                    className="h-9 w-9 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="fill-[#c9a55a] text-[#c9a55a]" />
                  ))}
                </div>
                <p className="text-sm text-white/40">
                  <span className="font-bold text-white/70">+50 clients</span> font confiance à DJAMA
                </p>
              </div>
            </FadeReveal>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════
          2. CRÉDIBILITÉ
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: Users,      value: "50+",   label: "Clients accompagnés",      sub: "depuis 2022"                    },
            { icon: TrendingUp, value: "2022",   label: "Projets réalisés depuis",  sub: "sites, apps, outils, design"   },
            { icon: Zap,        value: "100%",   label: "Solutions sur mesure",     sub: "adaptées à chaque besoin"       },
            { icon: HeartHandshake, value: "∞",  label: "Support & accompagnement", sub: "humain, disponible, réactif"   },
          ].map(({ icon: Icon, value, label, sub }) => (
            <motion.div
              key={label}
              variants={cardReveal}
              className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_12px_40px_rgba(201,165,90,0.09)]"
            >
              <div className="mb-3 inline-flex rounded-xl bg-[rgba(201,165,90,0.08)] p-3">
                <Icon size={20} className="text-[#c9a55a]" />
              </div>
              <p className="text-3xl font-black tracking-tight text-[var(--ink)]">{value}</p>
              <p className="mt-1.5 text-sm font-bold text-[var(--ink)] leading-snug">{label}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. PRÉSENTATION DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Texte */}
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> À propos de DJAMA
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Une vision moderne", "du digital."]}
                  highlight={1}
                  stagger={0.14}
                  wordStagger={0.065}
                />
              </h2>
              <FadeReveal delay={0.2} as="p" className="mt-5 text-base leading-relaxed text-[var(--muted)]">
                DJAMA est une plateforme qui combine <strong className="text-[var(--ink)]">création digitale</strong>,{" "}
                <strong className="text-[var(--ink)]">outils professionnels</strong> et{" "}
                <strong className="text-[var(--ink)]">accompagnement</strong>.
              </FadeReveal>
              <FadeReveal delay={0.3} as="p" className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                L&apos;objectif est d&apos;aider les entrepreneurs, entreprises et particuliers à développer
                leur présence digitale avec des solutions simples, modernes et efficaces.
              </FadeReveal>
              <FadeReveal delay={0.45} className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary text-sm">
                  Nos services <ArrowRight size={14} />
                </Link>
                <Link href="/contact" className="btn-ghost text-sm">
                  Prendre contact
                </Link>
              </FadeReveal>
            </div>

            {/* Bloc valeurs */}
            <motion.div variants={staggerContainerFast} className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Shield,   color: "#c9a55a", title: "Fiabilité",           desc: "Délais respectés, livrables soignés, communication transparente." },
                { icon: Zap,      color: "#60a5fa", title: "Rapidité",            desc: "Des process optimisés avec l'IA pour livrer vite, sans compromis." },
                { icon: TrendingUp, color: "#4ade80", title: "Efficacité",        desc: "Chaque solution est pensée pour produire de vrais résultats." },
                { icon: Users,    color: "#a78bfa", title: "Accompagnement",      desc: "Un suivi humain, personnalisé et adapté à votre réalité." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <motion.div
                  key={title}
                  variants={cardReveal}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 inline-flex rounded-xl p-2.5" style={{ background: `${color}12` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="text-sm font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. RÉALISATIONS
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
        >
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> Réalisations
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Des projets concrets,", "des livrables irréprochables."]}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.06}
                />
              </h2>
              <FadeReveal delay={0.2} as="p" className="mt-4 max-w-md text-base text-[var(--muted)]">
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
                accent: "#c9a55a",
              },
              {
                num: "02",
                tag: "Application SaaS",
                tagColor: "#60a5fa",
                title: "Plateforme de gestion métier",
                desc: "Interface SaaS avec tableau de bord, authentification sécurisée et base de données cloud.",
                accent: "#60a5fa",
              },
              {
                num: "03",
                tag: "Identité visuelle",
                tagColor: "#a78bfa",
                title: "Branding & design visuel",
                desc: "Logo, charte graphique, déclinaisons réseaux. Une image cohérente sur tous les supports.",
                accent: "#a78bfa",
              },
            ].map(({ num, tag, tagColor, title, desc, accent }) => (
              <motion.div
                key={num}
                variants={cardReveal}
                className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)]"
              >
                {/* Zone visuelle */}
                <div
                  className="relative h-52 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${accent}0e 0%, #fafafa 100%)` }}
                >
                  <span
                    className="absolute left-4 top-4 rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider"
                    style={{ color: tagColor, background: `${tagColor}16`, border: `1px solid ${tagColor}30` }}
                  >
                    {tag}
                  </span>
                  <div
                    className="absolute bottom-3 right-4 select-none text-[90px] font-black leading-none opacity-[0.06]"
                    style={{ color: accent }}
                  >
                    {num}
                  </div>
                  {/* Hover CTA */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ background: `${accent}0c` }}
                  >
                    <Link
                      href="/realisations"
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold backdrop-blur-md"
                      style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}
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
                    style={{ color: accent }}
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
          5. OUTILS DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-[20%] top-0 h-[500px] w-[600px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[5%] bottom-0 h-[350px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Texte gauche */}
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Wrench size={10} /> Espace client
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal
                  lines={["Des outils pour", "simplifier votre quotidien."]}
                  highlight={0}
                  stagger={0.14}
                  wordStagger={0.06}
                  lineClassName="text-white"
                />
              </h2>
              <FadeReveal delay={0.25} as="p" className="mt-5 text-base leading-relaxed text-white/45">
                Gestion de documents, organisation, automatisation et espace client sécurisé.
                Tout ce dont vous avez besoin en un seul endroit.
              </FadeReveal>
              <FadeReveal delay={0.4} className="mt-8 flex flex-wrap gap-3">
                <Link href="/abonnement" className="btn-primary text-sm">
                  Découvrir les outils — {data.offers.abonnement} <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/15 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Déjà client ? Se connecter
                </Link>
              </FadeReveal>
            </div>

            {/* Cards outils */}
            <motion.div variants={staggerContainerFast} className="flex flex-col gap-3">
              {[
                {
                  icon: ReceiptText,
                  label: "Factures & Devis",
                  sub: "Créez des documents professionnels en quelques secondes. PDF, TVA, logo, RIB.",
                  color: "#4ade80",
                },
                {
                  icon: Calendar,
                  label: "Planning & Agenda",
                  sub: "Organisez votre agenda en vue Jour, Semaine ou Mois. Intuitive et rapide.",
                  color: "#60a5fa",
                },
                {
                  icon: StickyNote,
                  label: "Bloc-notes pro",
                  sub: "Rédigez et organisez vos notes par catégorie. Export PDF, sauvegarde automatique.",
                  color: "#c9a55a",
                },
              ].map(({ icon: Icon, label, sub, color }, i) => (
                <motion.div
                  key={label}
                  variants={cardReveal}
                  className="flex items-start gap-4 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.04] p-5 transition-all duration-300 hover:bg-white/[0.07]"
                  style={{ transitionDelay: `${i * 0.05}s` }}
                >
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08]"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="font-bold text-white/90">{label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/40">{sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. APPROCHE
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-16 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Notre approche
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Une approche", "simple et efficace."]}
                highlight={1}
                stagger={0.14}
                wordStagger={0.07}
                lineClassName="justify-center"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-5 max-w-xl text-base text-[var(--muted)]">
              Trois étapes claires pour transformer votre idée en une solution digitale concrète.
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                color: "#c9a55a",
                title: "Comprendre votre besoin",
                desc: "Nous prenons le temps d'écouter votre projet, vos contraintes et vos objectifs. Pas de solution générique — une analyse précise de votre situation.",
              },
              {
                step: "02",
                icon: Wrench,
                color: "#60a5fa",
                title: "Créer une solution adaptée",
                desc: "Site web, application, outil ou stratégie digitale : chaque livrable est pensé sur mesure pour répondre exactement à ce dont vous avez besoin.",
              },
              {
                step: "03",
                icon: HeartHandshake,
                color: "#4ade80",
                title: "Vous accompagner dans la durée",
                desc: "La relation ne s'arrête pas à la livraison. Suivi, formation, évolutions : nous restons disponibles pour que votre projet continue de progresser.",
              },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <motion.div
                key={step}
                variants={cardReveal}
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_20px_56px_rgba(0,0,0,0.09)]"
              >
                {/* Numéro décoratif */}
                <div
                  className="absolute right-5 top-4 select-none text-6xl font-black leading-none opacity-[0.05]"
                  style={{ color }}
                >
                  {step}
                </div>
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}12` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-base font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                <div
                  className="mt-5 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-14"
                  style={{ background: color }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.2)] bg-[var(--ink)] px-8 py-20 text-center shadow-premium-lg md:px-16"
        >
          <div className="pointer-events-none absolute left-[12%] top-[-50px] h-[350px] w-[450px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-40px] right-[8%] h-[280px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[90px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> Parlons de votre projet
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Parlons de", "votre projet."]}
                highlight={1}
                stagger={0.15}
                wordStagger={0.08}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.3} as="p" className="mx-auto mt-6 max-w-xl text-lg text-white/45">
              Que vous ayez besoin d&apos;un site, d&apos;outils professionnels ou d&apos;un accompagnement,
              DJAMA vous aide à construire des solutions digitales modernes et efficaces.
            </FadeReveal>

            <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                Demander un devis <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="btn-ghost px-8 py-4 text-base">
                Nous contacter
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
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/35">
                <FileText size={13} className="text-[#c9a55a]" />
                Devis gratuit &amp; détaillé
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
