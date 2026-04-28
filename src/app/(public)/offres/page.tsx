"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight, CheckCircle2, Sparkles, Star,
  Zap, Brain, Globe, LayoutDashboard, Smartphone,
  ShoppingCart, Palette, Briefcase, Building2,
  TrendingUp, HeartHandshake, MessageCircle,
  Shield, ChevronDown, Network, Receipt,
  Users, Globe2,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";

/* ══════════════════════════════════════════════════════
   DONNÉES
══════════════════════════════════════════════════════ */

type ProfileId = "independant" | "pme" | "creatif";

const PROFILES = [
  {
    id: "independant" as ProfileId,
    icon: Briefcase,
    label: "Indépendant",
    sublabel: "Auto-entrepreneur · Freelance",
    color: GOLD,
    rgb: GOLDR,
    badge: "Le plus populaire",
    pitch: "L'essentiel pour lancer et gérer votre activité seul. Des outils pros à prix accessible, payez à la mission.",
    startingFrom: "11,90€",
    startingUnit: "/mois",
    recommended: [
      { name: "DJAMA Pro", desc: "11 outils de gestion tout-en-un", price: "11,90€/mois", href: "/espace-client", highlight: true },
      { name: "Site vitrine",   desc: "Présence digitale professionnelle",  price: "À partir de 490€",  href: "/services/site-vitrine",              highlight: false },
      { name: "Coaching IA",    desc: "Maîtrisez l'IA pour votre business", price: "190€ unique",        href: "/services/coaching-ia",               highlight: false },
      { name: "Création AE",    desc: "Immatriculation + conseil statut",   price: "À partir de 49€",   href: "/services/creation-auto-entrepreneur", highlight: false },
    ],
  },
  {
    id: "pme" as ProfileId,
    icon: Building2,
    label: "PME",
    sublabel: "Entreprise · 2 à 50 salariés",
    color: "#60a5fa",
    rgb: "96,165,250",
    badge: null,
    pitch: "Digitalisez votre activité avec des outils sur mesure. Sites, apps, sourcing et accompagnement stratégique.",
    startingFrom: "11,90€",
    startingUnit: "/mois",
    recommended: [
      { name: "DJAMA Pro",         desc: "11 outils de gestion tout-en-un",     price: "11,90€/mois",       href: "/espace-client",                highlight: false },
      { name: "Site e-commerce",   desc: "Boutique en ligne + paiement",         price: "À partir de 990€",  href: "/services/site-ecommerce",       highlight: false },
      { name: "Application mobile",desc: "App iOS & Android",                    price: "À partir de 1 900€",href: "/services/application-mobile",   highlight: false },
      { name: "Sourcing international", desc: "Fournisseurs qualifiés + négo.", price: "Sur devis",          href: "/services/recherche-fournisseurs",highlight: false },
    ],
  },
  {
    id: "creatif" as ProfileId,
    icon: Palette,
    label: "Créatif / Agence",
    sublabel: "Studio · Agence · Startup",
    color: "#a78bfa",
    rgb: "167,139,250",
    badge: null,
    pitch: "Production visuelle, automatisation IA et plateformes sur mesure. L'expertise technique pour des projets ambitieux.",
    startingFrom: "190€",
    startingUnit: "/ projet",
    recommended: [
      { name: "Visuels publicitaires",  desc: "Affiches, flyers, réseaux sociaux",  price: "À partir de 290€",   href: "/services/visuels-publicitaires",     highlight: false },
      { name: "Montage vidéo",          desc: "Reels, teasers, clips",               price: "À partir de 190€",   href: "/services/montage-video",             highlight: false },
      { name: "Plateforme sur mesure",  desc: "SaaS, dashboard, outil métier",       price: "À partir de 3 500€", href: "/services/plateforme-web-sur-mesure", highlight: false },
      { name: "Automatisation IA",      desc: "Workflows, bots, IA sur mesure",      price: "À partir de 490€",   href: "/services/automatisation-ia",         highlight: false },
    ],
  },
] as const;

const ALL_SERVICES = [
  {
    category: "Outils & SaaS",
    color: GOLD,
    rgb: GOLDR,
    icon: LayoutDashboard,
    services: [
      { name: "DJAMA Pro — abonnement mensuel", desc: "11 outils pros réunis : factures, CRM, agenda, trésorerie, contrats IA, sourcing…", price: "11,90€/mois", tag: "Sans engagement", href: "/espace-client" },
    ],
  },
  {
    category: "Création web & mobile",
    color: "#60a5fa",
    rgb: "96,165,250",
    icon: Globe,
    services: [
      { name: "Site vitrine",              desc: "Site pro jusqu'à 5 pages, responsive, formulaire de contact, référencement local",       price: "À partir de 490€",   tag: "Livraison 10 j.",   href: "/services/site-vitrine" },
      { name: "Site e-commerce",           desc: "Boutique en ligne, catalogue produits, paiement sécurisé, gestion des commandes",         price: "À partir de 990€",   tag: null,                href: "/services/site-ecommerce" },
      { name: "Application mobile",        desc: "App native iOS & Android ou React Native, design sur mesure",                             price: "À partir de 1 900€", tag: null,                href: "/services/application-mobile" },
      { name: "Plateforme web sur mesure", desc: "SaaS, outil métier, dashboard, marketplace — architecture et développement complets",     price: "À partir de 3 500€", tag: null,                href: "/services/plateforme-web-sur-mesure" },
    ],
  },
  {
    category: "IA & Automatisation",
    color: "#a78bfa",
    rgb: "167,139,250",
    icon: Brain,
    services: [
      { name: "Coaching IA",        desc: "Formation : 6 modules · 20 chapitres · 4h accompagnement expert · accès 3 mois",  price: "190€ — paiement unique",  tag: "Garantie 7 jours", href: "/services/coaching-ia" },
      { name: "Automatisation IA",  desc: "Création de workflows, chatbots, bots IA et automatisations métier sur mesure",    price: "À partir de 490€",        tag: null,               href: "/services/automatisation-ia" },
    ],
  },
  {
    category: "Création visuelle",
    color: "#f472b6",
    rgb: "244,114,182",
    icon: Palette,
    services: [
      { name: "Visuels publicitaires", desc: "Affiches, flyers, visuels réseaux sociaux, identité visuelle, branding",             price: "À partir de 290€", tag: null, href: "/services/visuels-publicitaires" },
      { name: "Montage vidéo",         desc: "Reels, teasers, vidéos institutionnelles, sous-titrage, transitions pro",             price: "À partir de 190€", tag: null, href: "/services/montage-video" },
      { name: "Retouche photo",        desc: "Retouche professionnelle, fond blanc, mise en lumière, détourage",                    price: "À partir de 49€",  tag: null, href: "/services/retouche-photo" },
    ],
  },
  {
    category: "Accompagnement & administratif",
    color: "#f59e0b",
    rgb: "245,158,11",
    icon: HeartHandshake,
    services: [
      { name: "Création auto-entrepreneur",  desc: "Immatriculation, choix du statut juridique, conseil et démarches complètes",      price: "À partir de 49€",     tag: null,               href: "/services/creation-auto-entrepreneur" },
      { name: "Déclarations URSSAF",         desc: "Déclarations mensuelles ou trimestrielles, suivi des cotisations, assistance",     price: "À partir de 29€/mois", tag: null,               href: "/services/declarations-urssaf" },
      { name: "Assistance administrative",   desc: "Courriers, démarches administratives, gestion des documents professionnels",      price: "Sur devis",            tag: null,               href: "/services/assistance-administrative" },
      { name: "Soutien scolaire",            desc: "Cours particuliers toutes matières, collège et lycée, à domicile ou en ligne",    price: "14€/heure",            tag: null,               href: "/services/soutien-scolaire" },
    ],
  },
  {
    category: "Développement business",
    color: "#34d399",
    rgb: "52,211,153",
    icon: TrendingUp,
    services: [
      { name: "Sourcing international",  desc: "Recherche, sélection et mise en relation avec des fournisseurs à l'international",  price: "Sur devis", tag: null, href: "/services/recherche-fournisseurs" },
      { name: "Marchés publics & privés",desc: "Aide aux appels d'offres, constitution de dossiers de candidature, conseil",        price: "Sur devis", tag: null, href: "/services/marches-publics" },
    ],
  },
] as const;

const FAQ = [
  {
    q: "Les prix incluent-ils la maintenance et le support ?",
    a: "L'abonnement DJAMA Pro (11,90€/mois) inclut le support DJAMA et les mises à jour des outils. Pour les créations web et apps, un devis de maintenance peut être établi séparément selon vos besoins.",
  },
  {
    q: "Puis-je cumuler plusieurs services ?",
    a: "Absolument. La plupart de nos clients combinent le DJAMA Pro (base de gestion) avec une création web et/ou du coaching IA. Nous proposons des tarifs dégressifs sur les packs combinés — contactez-nous pour un devis personnalisé.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "L'abonnement DJAMA Pro est sans engagement, résiliable à tout moment. Les prestations ponctuelles (site, app, visuels) sont payées à la livraison selon le devis signé. Le Coaching IA bénéficie d'une garantie satisfait ou remboursé 7 jours.",
  },
  {
    q: "Comment obtenir un devis pour les services 'Sur devis' ?",
    a: "Remplissez le formulaire de contact ou envoyez-nous un message WhatsApp avec votre besoin. Nous vous répondons sous 24h avec une première estimation, puis un devis détaillé après un appel découverte gratuit de 30 minutes.",
  },
] as const;

/* ══════════════════════════════════════════════════════
   COMPOSANT FAQ ITEM
══════════════════════════════════════════════════════ */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeIn}
      className="overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.025] transition-all duration-200 hover:border-white/[.12]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-black"
            style={{ background: `rgba(${GOLDR},.12)`, color: GOLD }}>
            {String(idx + 1).padStart(2, "0")}
          </span>
          <span className="text-[0.92rem] font-bold text-white/82">{q}</span>
        </div>
        <ChevronDown
          size={16}
          className="shrink-0 text-white/30 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="border-t border-white/[.05] px-6 py-4">
          <p className="text-[0.86rem] leading-relaxed text-white/50">{a}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function OffresPage() {
  const [activeProfile, setActiveProfile] = useState<ProfileId>("independant");
  const active = PROFILES.find((p) => p.id === activeProfile)!;

  return (
    <div className="bg-[#09090b] w-full overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-16 h-[500px] w-[500px] animate-float-slow rounded-full bg-[rgba(201,165,90,.06)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[350px] w-[350px] animate-float-delayed rounded-full bg-[rgba(167,139,250,.05)] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-28 pt-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease }}
            className="mb-7"
          >
            <span className="badge badge-gold-dark relative inline-flex items-center gap-1.5">
              <Sparkles size={10} />
              Tarifs transparents &amp; profils adaptés
            </span>
          </motion.div>

          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Choisissez votre profil,", "connaissez vos prix."]}
              highlight={1}
              stagger={0.14}
              wordStagger={0.055}
              delay={0.06}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal delay={0.55} as="p" className="mx-auto mt-6 max-w-[520px] text-[1.05rem] leading-[1.85] text-white/50">
            Indépendant, PME ou créatif — trouvez les services DJAMA qui correspondent
            à vos besoins et votre budget. Pas de surprise, pas d&apos;engagement caché.
          </FadeReveal>

          {/* Badges preuves */}
          <FadeReveal delay={0.7} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Shield,      label: "Sans engagement"   },
              { icon: Zap,         label: "Accès immédiat"    },
              { icon: MessageCircle, label: "Devis en 24h"   },
              { icon: Star,        label: "50+ clients"        },
            ].map(({ icon: Icon, label }) => (
              <span key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.03] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white/45"
              >
                <Icon size={12} style={{ color: GOLD }} />
                {label}
              </span>
            ))}
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
      </section>

      {/* ══ SÉLECTEUR DE PROFIL ══════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0e0b18] py-20 sm:py-28">
        <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,.04)] blur-[150px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.div variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
              style={{ color: GOLD }}
            >
              <Users size={11} /> Quel est votre profil ?
            </motion.div>
            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["Les packs recommandés", "par profil."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
          </div>

          {/* Tabs */}
          <motion.div variants={fadeIn} className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {PROFILES.map((p) => {
              const isActive = activeProfile === p.id;
              return (
                <button key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[0.82rem] font-bold transition-all duration-200"
                  style={{
                    borderColor: isActive ? `rgba(${p.rgb},.45)` : "rgba(255,255,255,.08)",
                    background:  isActive ? `rgba(${p.rgb},.12)` : "rgba(255,255,255,.03)",
                    color: isActive ? p.color : "rgba(255,255,255,.4)",
                    boxShadow: isActive ? `0 0 20px rgba(${p.rgb},.15)` : "none",
                  }}
                >
                  <p.icon size={14} />
                  {p.label}
                </button>
              );
            })}
          </motion.div>

          {/* Pack actif */}
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="relative overflow-hidden rounded-[2rem] border"
              style={{ borderColor: `rgba(${active.rgb},.3)`, background: `rgba(${active.rgb},.03)` }}
            >
              {/* Top bar */}
              <div className="h-[3px] w-full"
                style={{ background: `linear-gradient(90deg,transparent,${active.color},transparent)` }} />
              {/* Top glow */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-52"
                style={{ background: `radial-gradient(ellipse 80% 80% at 50% 0%, rgba(${active.rgb},.1), transparent)` }} />

              <div className="relative grid gap-8 p-8 lg:grid-cols-[1fr_auto]">
                {/* Left: description */}
                <div>
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                      style={{ background: `rgba(${active.rgb},.14)`, borderColor: `rgba(${active.rgb},.3)`, boxShadow: `0 0 20px rgba(${active.rgb},.22)` }}>
                      <active.icon size={26} style={{ color: active.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-extrabold text-white">{active.label}</h3>
                        {active.badge && (
                          <span className="rounded-full border px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[.16em]"
                            style={{ borderColor: `rgba(${active.rgb},.4)`, background: `rgba(${active.rgb},.12)`, color: active.color }}>
                            {active.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[0.82rem] text-white/35">{active.sublabel}</p>
                    </div>
                  </div>
                  <p className="mb-7 max-w-md text-[0.95rem] leading-relaxed text-white/50">{active.pitch}</p>

                  {/* Services recommandés */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {active.recommended.map(({ name, desc, price, href, highlight }) => (
                      <Link key={name} href={href}
                        className="group/s relative flex items-start gap-3.5 overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:brightness-110"
                        style={{
                          borderColor: highlight ? `rgba(${active.rgb},.4)` : "rgba(255,255,255,.07)",
                          background:  highlight ? `rgba(${active.rgb},.07)` : "rgba(255,255,255,.025)",
                        }}
                      >
                        {highlight && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg,transparent,${active.color},transparent)` }} />
                        )}
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0"
                          style={{ color: highlight ? active.color : "rgba(255,255,255,.2)" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.88rem] font-bold text-white/88">{name}</p>
                          <p className="mt-0.5 text-[0.72rem] text-white/38">{desc}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[0.78rem] font-black" style={{ color: active.color }}>{price}</p>
                          <ArrowRight size={11} className="ml-auto mt-1 opacity-0 transition-opacity group-hover/s:opacity-100"
                            style={{ color: active.color }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right: starting from + CTA */}
                <div className="flex flex-col items-center justify-center gap-5 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] px-8 py-8 text-center lg:min-w-[220px]">
                  <p className="text-[0.62rem] font-black uppercase tracking-[.22em] text-white/30">
                    À partir de
                  </p>
                  <div>
                    <p className="text-[3.2rem] font-black leading-none tracking-tight text-white">
                      {active.startingFrom}
                    </p>
                    <p className="mt-1 text-[0.72rem] font-semibold text-white/35">{active.startingUnit}</p>
                  </div>
                  <Link href="/contact?besoin=devis"
                    className="btn-primary group relative w-full overflow-hidden py-3 text-[0.88rem]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Obtenir un devis
                      <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
                  </Link>
                  <Link href="/espace-client"
                    className="w-full rounded-xl border border-white/[.08] bg-white/[.03] py-2.5 text-center text-[0.82rem] font-semibold text-white/45 transition-all duration-200 hover:border-white/[.15] hover:text-white/70"
                  >
                    Voir DJAMA Pro
                  </Link>
                  <p className="text-[0.62rem] text-white/20">Sans engagement · Réponse sous 24h</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ TOUS LES TARIFS ══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-20 sm:py-28">
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[350px] w-[350px] rounded-full bg-[rgba(96,165,250,.04)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
              style={{ color: GOLD }}
            >
              <Receipt size={11} /> Grille tarifaire complète
            </motion.div>
            <h2 className="display-section text-white">
              <MultiLineReveal
                lines={["Tous les services,", "tous les tarifs."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-white"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/40">
              Tarifs indicatifs — les projets sur devis font l&apos;objet d&apos;une estimation gratuite sous 24h.
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="space-y-6">
            {ALL_SERVICES.map(({ category, color, rgb, icon: CatIcon, services }) => (
              <motion.div key={category} variants={cardReveal}
                className="overflow-hidden rounded-[1.5rem] border border-white/[.07] bg-white/[.025]"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 border-b border-white/[.06] px-6 py-4"
                  style={{ background: `rgba(${rgb},.04)` }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${rgb},.12)`, borderColor: `rgba(${rgb},.28)` }}>
                    <CatIcon size={16} style={{ color }} />
                  </div>
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[.16em]" style={{ color }}>
                    {category}
                  </h3>
                </div>

                {/* Service rows */}
                <div className="divide-y divide-white/[.04]">
                  {services.map(({ name, desc, price, tag, href }) => (
                    <Link key={name} href={href}
                      className="group flex flex-col items-start gap-2 px-6 py-4 transition-all duration-200 hover:bg-white/[.025] sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.9rem] font-bold text-white/82 transition-colors group-hover:text-white">
                            {name}
                          </span>
                          {tag && (
                            <span className="rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[.12em]"
                              style={{ borderColor: `rgba(${rgb},.3)`, background: `rgba(${rgb},.08)`, color }}>
                              {tag}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[0.78rem] leading-snug text-white/35">{desc}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[0.92rem] font-black" style={{ color }}>{price}</span>
                        <ArrowRight size={13} className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-white/50" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Note devis */}
          <FadeReveal delay={0.35} className="mt-8 flex justify-center">
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/[.06] bg-white/[.02] px-5 py-3">
              <MessageCircle size={13} style={{ color: GOLD }} />
              <p className="text-[0.78rem] text-white/35">
                Tous les tarifs &quot;Sur devis&quot; font l&apos;objet d&apos;une estimation gratuite —
                <Link href="/contact" className="ml-1 font-semibold underline underline-offset-2 transition-colors hover:text-white/65" style={{ color: GOLD }}>
                  contactez-nous
                </Link>
              </p>
            </div>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══ FAQ TARIFS ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0c0b13] py-20 sm:py-24">
        <div className="pointer-events-none absolute left-[-60px] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[rgba(167,139,250,.05)] blur-[90px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-3xl px-6"
        >
          <div className="mb-10 text-center">
            <motion.div variants={fadeIn}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em] text-white/35"
            >
              <Sparkles size={10} /> FAQ
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl font-extrabold text-white/90 sm:text-3xl">
              Questions fréquentes sur les tarifs
            </motion.h2>
          </div>

          <motion.div variants={staggerContainerFast} className="space-y-2.5">
            {FAQ.map(({ q, a }, idx) => (
              <FaqItem key={q} q={q} a={a} idx={idx} />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border bg-[#0d0d10] px-8 py-20 text-center md:px-16"
          style={{ borderColor: "rgba(201,165,90,.2)" }}
        >
          <div className="pointer-events-none absolute left-[8%] top-[-60px] h-[280px] w-[360px] animate-float-slow rounded-full bg-[rgba(201,165,90,.07)] blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-40px] right-[6%] h-[220px] w-[260px] animate-float-delayed rounded-full bg-[rgba(96,165,250,.05)] blur-[65px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Network size={10} /> Rejoignez l&apos;écosystème DJAMA
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Prêt à démarrer ?", "On s'occupe du reste."]}
                highlight={0} stagger={0.13} wordStagger={0.065}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.26} as="p" className="mx-auto mt-5 max-w-md text-[1rem] leading-[1.82] text-white/40">
              Appel découverte gratuit · Devis sous 24h · Sans engagement
            </FadeReveal>

            <FadeReveal delay={0.4} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact"
                className="btn-primary group relative overflow-hidden px-8 py-[0.95rem] text-[0.925rem]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Obtenir un devis gratuit
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link href="/espace-client"
                className="btn-ghost px-8 py-[0.95rem] text-[0.925rem]"
              >
                Essayer DJAMA Pro — 11,90€/mois
              </Link>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
