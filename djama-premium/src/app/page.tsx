"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Globe, Palette, Wrench,
  Mail, MessageCircle, Star, Zap, Users,
  CheckCircle2, Sparkles,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast,
  cardReveal, viewport,
} from "@/lib/animations";
import { WordReveal, MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";

/* ─── Section wrapper ────────────────────────── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Badge animé ────────────────────────────── */
function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <motion.span variants={fadeIn} className={`badge ${dark ? "badge-gold-dark" : "badge-gold-light"}`}>
      <Sparkles size={11} />
      {children}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function Home() {
  const data = getSiteData();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section ref={heroRef} className="hero-dark hero-grid relative min-h-screen overflow-hidden">

        {/* Glow parallax */}
        <motion.div style={{ y: glowY }}
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 flex justify-center">
          <div className="h-[600px] w-[700px] rounded-full bg-[rgba(176,141,87,0.12)] blur-[120px]" />
        </motion.div>
        <div className="pointer-events-none absolute right-[-150px] top-[30%] -z-0 h-[400px] w-[400px] rounded-full bg-[rgba(176,141,87,0.06)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-36 pb-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* ── Texte ── */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <span className="badge badge-gold-dark">
                  <Sparkles size={11} />
                  Services digitaux premium
                </span>
              </motion.div>

              {/* Titre hero — 3 lignes, chaque mot glisse depuis son masque */}
              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={["Votre présence", "digitale", "réinventée."]}
                  highlight={1}
                  stagger={0.18}
                  wordStagger={0.07}
                  delay={0.1}
                  lineClassName="block"
                />
              </h1>

              {/* Sous-titre */}
              <FadeReveal delay={0.55} as="p" className="mt-7 max-w-lg text-lg leading-relaxed text-white/55">
                Sites web, applications, outils pro, coaching IA — une agence qui
                transforme vos idées en expériences mémorables.
              </FadeReveal>

              {/* CTAs */}
              <FadeReveal delay={0.7} className="mt-10 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary">
                  Découvrir les services <ArrowRight size={16} />
                </Link>
                <Link href="/portfolio" className="btn-ghost">
                  Voir les réalisations
                </Link>
              </FadeReveal>

              {/* Preuves sociales */}
              <FadeReveal delay={0.85} className="mt-10 flex items-center gap-4 border-t border-white/8 pt-8">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ zIndex: 4 - i }}
                      className="h-8 w-8 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]" />
                  ))}
                </div>
                <p className="text-sm text-white/45">
                  <span className="font-bold text-white/80">50+ clients</span> nous font confiance
                </p>
              </FadeReveal>
            </div>

            {/* ── Glassmorphism card ── */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass-card p-6 shadow-premium-lg">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/60">Nos offres</span>
                  <span className="badge badge-gold-dark">Active</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Sites web & applications",      price: "Sur devis"              },
                    { label: "Outils DJAMA (factures/devis)", price: data.offers.abonnement   },
                    { label: "Coaching IA",                   price: data.offers.coaching     },
                    { label: "Soutien scolaire",              price: data.offers.soutien      },
                  ].map(({ label, price }, i) => (
                    <motion.div key={label}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.55, delay: 0.55 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={14} className="text-[#c9a55a]" />
                        <span className="text-sm font-medium text-white/75">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-[#c9a55a]">{price}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="my-5 divider-gold" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.05, duration: 0.5 }}
                >
                  <Link href="/contact" className="btn-primary w-full justify-center">
                    Demander un devis <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { icon: Users,         value: "50+",  label: "Clients accompagnés"  },
            { icon: Star,          value: "100%", label: "Satisfaction client"   },
            { icon: Zap,           value: "3×",   label: "Plus rapide avec l'IA" },
            { icon: MessageCircle, value: "24h",  label: "Délai de réponse"      },
          ].map(({ icon: Icon, value, label }) => (
            <motion.div key={label} variants={cardReveal}
              className="card-premium flex flex-col items-center gap-2 p-6 text-center">
              <div className="mb-1 inline-flex rounded-xl bg-[rgba(176,141,87,0.08)] p-2.5">
                <Icon size={22} className="text-[#c9a55a]" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">{value}</p>
              <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          À PROPOS
      ══════════════════════════════════════ */}
      <Section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <Badge>À propos</Badge>

            <h2 className="display-section mt-5 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Une agence qui fait", "la différence."]}
                highlight={1}
                stagger={0.16}
                wordStagger={0.075}
              />
            </h2>

            <FadeReveal delay={0.25} as="p" className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
              DJAMA est spécialisée dans les services digitaux, les outils professionnels
              et l&apos;accompagnement sur mesure. Notre mission : vous donner une image
              forte, moderne et cohérente.
            </FadeReveal>

            <FadeReveal delay={0.38} as="p" className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
              De la création de sites web aux outils de gestion automatisés, nous
              concevons des solutions utiles, élégantes et adaptées à vos vrais besoins.
            </FadeReveal>

            <FadeReveal delay={0.5} className="mt-8">
              <Link href="/services" className="btn-primary">
                Nos services <ArrowRight size={16} />
              </Link>
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-4">
            {[
              { title: "Vision premium",   desc: "Construire une image durable, forte et cohérente.", icon: Star },
              { title: "Qualité garantie", desc: "Rendus propres, modernes et professionnels à chaque projet.", icon: CheckCircle2 },
              { title: "Accompagnement",   desc: "Un suivi clair, sérieux et personnalisé à chaque étape.", icon: Zap },
            ].map(({ title, desc, icon: Icon }) => (
              <motion.div key={title} variants={cardReveal} className="card-premium p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex-shrink-0 rounded-lg bg-[rgba(176,141,87,0.1)] p-2">
                    <Icon size={18} className="text-[#c9a55a]" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--ink)]">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════
          SERVICES
      ══════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={11} /> Services
              </motion.span>

              <h2 className="display-section mt-5 text-[var(--ink)]">
                <MultiLineReveal
                  lines={["Ce que nous", "créons pour vous."]}
                  highlight={1}
                  stagger={0.15}
                  wordStagger={0.07}
                />
              </h2>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/services" className="btn-primary text-sm">
                Voir tous <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Globe, title: "Services digitaux",
                desc: "Sites web, applications, plateformes et outils sur mesure pour booster votre activité.",
                items: ["Site vitrine", "Application web", "E-commerce"],
              },
              {
                icon: Palette, title: "Création visuelle",
                desc: "Montage vidéo, retouche photo, visuels publicitaires et identité visuelle de marque.",
                items: ["Montage vidéo", "Design graphique", "Branding"],
              },
              {
                icon: Wrench, title: "Outils & accompagnement",
                desc: "Factures, devis, coaching IA, accompagnement administratif et soutien scolaire.",
                items: ["Factures & devis", "Coaching IA", "Soutien scolaire"],
              },
            ].map(({ icon: Icon, title, desc, items }) => (
              <motion.div key={title} variants={cardReveal} className="card-premium group p-7">
                <div className="mb-5 inline-flex rounded-2xl bg-[rgba(176,141,87,0.08)] p-3.5 transition-colors group-hover:bg-[rgba(176,141,87,0.14)]">
                  <Icon size={26} className="text-[#c9a55a]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                <ul className="mt-5 space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <span className="h-1 w-1 rounded-full bg-[#c9a55a]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          OFFRES
      ══════════════════════════════════════ */}
      <Section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <Badge>Tarifs</Badge>

          <h2 className="display-section mt-5 text-[var(--ink)]">
            <MultiLineReveal
              lines={["Des offres claires,", "sans surprise."]}
              highlight={1}
              stagger={0.16}
              wordStagger={0.07}
              lineClassName="justify-center"
            />
          </h2>

          <FadeReveal delay={0.3} as="p" className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">
            Des solutions simples et professionnelles adaptées à chaque besoin.
          </FadeReveal>
        </div>

        <motion.div variants={staggerContainerFast} className="grid gap-6 md:grid-cols-3">
          {[
            {
              href: "/abonnement", title: "Outils DJAMA",
              desc: "Factures, devis, planning et organisation professionnelle.",
              price: data.offers.abonnement,
              features: ["Générateur de factures", "Devis automatiques", "Planning intégré", "Support prioritaire"],
              featured: false,
            },
            {
              href: "/coaching-ia", title: "Coaching IA",
              desc: "Maîtrisez l'IA pour automatiser et faire évoluer votre activité.",
              price: data.offers.coaching,
              features: ["3 mois d'accompagnement", "Séances individuelles", "Outils IA sélectionnés", "Suivi personnalisé"],
              featured: true,
            },
            {
              href: "/soutien-scolaire", title: "Soutien scolaire",
              desc: "Aide aux élèves de la 6e à la Terminale.",
              price: data.offers.soutien,
              features: ["Cours à la carte", "Toutes matières", "6e → Terminale", "Flexibilité totale"],
              featured: false,
            },
          ].map(({ href, title, desc, price, features, featured }) => (
            <motion.div key={href} variants={cardReveal}>
              <Link href={href} className={`group relative flex h-full flex-col rounded-[var(--radius-lg)] p-7 transition-all duration-300 ${
                featured
                  ? "bg-[var(--ink)] text-white border border-[rgba(201,165,90,0.3)] shadow-premium-lg hover:border-[rgba(201,165,90,0.5)]"
                  : "card-premium"
              }`}>
                {featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#c9a55a] to-[#e8cc94] px-4 py-1 text-xs font-bold text-[var(--ink)]">
                    Populaire
                  </span>
                )}
                <h3 className={`text-xl font-bold ${featured ? "text-white" : "text-[var(--ink)]"}`}>{title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-white/60" : "text-[var(--muted)]"}`}>{desc}</p>
                <p className={`mt-6 text-3xl font-extrabold tracking-tight ${featured ? "text-gold" : "text-[var(--ink)]"}`}>{price}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${featured ? "text-white/70" : "text-[var(--muted)]"}`}>
                      <CheckCircle2 size={14} className="flex-shrink-0 text-[#c9a55a]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`mt-7 flex items-center gap-1.5 text-sm font-bold transition-all group-hover:gap-3 ${featured ? "text-[#c9a55a]" : "text-[var(--ink)]"}`}>
                  Accéder <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ══════════════════════════════════════
          PORTFOLIO
      ══════════════════════════════════════ */}
      <section className="hero-dark py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Sparkles size={11} /> Portfolio
              </motion.span>

              <h2 className="display-section mt-5 text-white">
                <MultiLineReveal
                  lines={["Quelques", "réalisations."]}
                  highlight={1}
                  stagger={0.16}
                  wordStagger={0.07}
                  lineClassName="text-white"
                />
              </h2>
            </div>
            <motion.div variants={fadeIn}>
              <Link href="/portfolio" className="btn-ghost text-sm">
                Tout voir <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {["Projet client 1", "Projet client 2", "Projet client 3"].map((item, i) => (
              <motion.div key={item} variants={cardReveal} className="glass-card group overflow-hidden">
                <div className="relative h-52 overflow-hidden rounded-t-[var(--radius-lg)] bg-gradient-to-br from-[rgba(176,141,87,0.1)] to-[rgba(255,255,255,0.03)]">
                  <div className="absolute inset-0 flex items-center justify-center text-[80px] font-extrabold text-white/5 select-none">
                    0{i + 1}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(176,141,87,0.08)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-sm font-bold text-white/80">Voir le projet →</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white/85">{item}</h3>
                  <p className="mt-1.5 text-sm text-white/45">Identité visuelle, support digital ou contenu créatif.</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(176,141,87,0.2)] bg-[var(--ink)] p-12 text-center shadow-premium-lg"
        >
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[500px] rounded-full bg-[rgba(176,141,87,0.1)] blur-[80px]" />
          </div>

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={11} /> Contact
            </motion.span>

            <h2 className="display-section mt-5 text-white">
              <MultiLineReveal
                lines={["Parlons de", "votre projet."]}
                highlight={1}
                stagger={0.16}
                wordStagger={0.08}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.3} as="p" className="mx-auto mt-5 max-w-xl text-lg text-white/50">
              DJAMA vous accompagne dans la mise en place de solutions
              modernes, utiles et professionnelles.
            </FadeReveal>

            <FadeReveal delay={0.42} className="mt-5 flex flex-col items-center gap-2">
              <a href={`mailto:${data.contact.email}`}
                className="inline-flex items-center gap-2 text-base font-medium text-white/50 hover:text-white transition-colors">
                <Mail size={15} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <a href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-medium text-white/50 hover:text-white transition-colors">
                <MessageCircle size={15} className="text-[#c9a55a]" />
                {data.contact.whatsapp}
              </a>
            </FadeReveal>

            <FadeReveal delay={0.55} className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary">
                Nous contacter <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost">
                Explorer les services
              </Link>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
