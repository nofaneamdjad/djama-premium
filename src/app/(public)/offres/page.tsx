"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight, CheckCircle2, Sparkles, Star,
  Zap, Brain, Globe, LayoutDashboard,
  Palette, Briefcase, Building2,
  TrendingUp, HeartHandshake, MessageCircle,
  Shield, ChevronDown, Network, Receipt,
  Users,
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
    pitch: "L'essentiel pour lancer et gérer votre activité seul.",
    startingFrom: "11,90 €",
    startingUnit: "/mois",
    recommended: [
      { name: "DJAMA Pro",     price: "11,90 €/mois",  href: "/espace-client",                highlight: true  },
      { name: "Site vitrine",  price: "Dès 490 €",      href: "/services/site-vitrine",        highlight: false },
      { name: "Coaching IA",   price: "190 € unique",   href: "/services/coaching-ia",         highlight: false },
      { name: "Création AE",   price: "Dès 49 €",       href: "/services/creation-auto-entrepreneur", highlight: false },
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
    pitch: "Digitalisez votre activité avec des outils sur mesure.",
    startingFrom: "490 €",
    startingUnit: "/ projet",
    recommended: [
      { name: "Site e-commerce",        price: "Dès 990 €",      href: "/services/site-ecommerce",        highlight: false },
      { name: "Application mobile",     price: "Dès 1 900 €",    href: "/services/application-mobile",    highlight: false },
      { name: "DJAMA Pro",              price: "11,90 €/mois",   href: "/espace-client",                  highlight: false },
      { name: "Sourcing international", price: "Sur devis",       href: "/services/recherche-fournisseurs",highlight: false },
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
    pitch: "Production visuelle, IA et plateformes pour projets ambitieux.",
    startingFrom: "190 €",
    startingUnit: "/ projet",
    recommended: [
      { name: "Visuels publicitaires", price: "Dès 290 €",    href: "/services/visuels-publicitaires",    highlight: false },
      { name: "Montage vidéo",         price: "Dès 190 €",    href: "/services/montage-video",            highlight: false },
      { name: "Plateforme sur mesure", price: "Dès 3 500 €",  href: "/services/plateforme-web-sur-mesure",highlight: false },
      { name: "Automatisation IA",     price: "Dès 490 €",    href: "/services/automatisation-ia",        highlight: false },
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
      {
        name: "DJAMA Pro — abonnement mensuel",
        desc: "11 outils pros : factures, CRM, agenda, trésorerie, contrats IA, sourcing…",
        price: "11,90 €/mois",
        tag: "Sans engagement",
        href: "/espace-client",
      },
    ],
  },
  {
    category: "Création web & mobile",
    color: "#60a5fa",
    rgb: "96,165,250",
    icon: Globe,
    services: [
      { name: "Site vitrine",              desc: "Site pro jusqu'à 5 pages, responsive, formulaire de contact, SEO local",     price: "Dès 490 €",    tag: "Livraison 10 j.", href: "/services/site-vitrine" },
      { name: "Site e-commerce",           desc: "Boutique en ligne, catalogue, paiement sécurisé, gestion des commandes",     price: "Dès 990 €",    tag: null,              href: "/services/site-ecommerce" },
      { name: "Application mobile",        desc: "App iOS & Android ou React Native, design sur mesure",                       price: "Dès 1 900 €",  tag: null,              href: "/services/application-mobile" },
      { name: "Plateforme web sur mesure", desc: "SaaS, outil métier, dashboard, marketplace — dev complet",                   price: "Dès 3 500 €",  tag: null,              href: "/services/plateforme-web-sur-mesure" },
    ],
  },
  {
    category: "IA & Automatisation",
    color: "#a78bfa",
    rgb: "167,139,250",
    icon: Brain,
    services: [
      { name: "Coaching IA",       desc: "6 modules · 20 chapitres · 4 h d'accompagnement · accès 3 mois",    price: "190 €",      tag: "Garantie 7 j.", href: "/services/coaching-ia" },
      { name: "Automatisation IA", desc: "Workflows, chatbots, bots IA et automatisations métier sur mesure",  price: "Dès 490 €",  tag: null,            href: "/services/automatisation-ia" },
    ],
  },
  {
    category: "Création visuelle",
    color: "#f472b6",
    rgb: "244,114,182",
    icon: Palette,
    services: [
      { name: "Visuels publicitaires", desc: "Affiches, flyers, réseaux sociaux, identité visuelle, branding",         price: "Dès 290 €", tag: null, href: "/services/visuels-publicitaires" },
      { name: "Montage vidéo",         desc: "Reels, teasers, vidéos institutionnelles, sous-titrage",                  price: "Dès 190 €", tag: null, href: "/services/montage-video" },
      { name: "Retouche photo",        desc: "Retouche pro, fond blanc, mise en lumière, détourage",                    price: "Dès 49 €",  tag: null, href: "/services/retouche-photo" },
    ],
  },
  {
    category: "Accompagnement & administratif",
    color: "#f59e0b",
    rgb: "245,158,11",
    icon: HeartHandshake,
    services: [
      { name: "Création auto-entrepreneur",  desc: "Immatriculation, choix du statut, conseil et démarches complètes",        price: "Dès 49 €",       tag: null, href: "/services/creation-auto-entrepreneur" },
      { name: "Déclarations URSSAF",         desc: "Déclarations mensuelles ou trimestrielles, suivi des cotisations",         price: "Dès 29 €/mois",  tag: null, href: "/services/declarations-urssaf" },
      { name: "Assistance administrative",   desc: "Courriers, démarches, gestion des documents professionnels",               price: "Sur devis",       tag: null, href: "/services/assistance-administrative" },
      { name: "Soutien scolaire",            desc: "Cours particuliers toutes matières, collège & lycée, présentiel ou online", price: "14 €/heure",     tag: null, href: "/services/soutien-scolaire" },
    ],
  },
  {
    category: "Développement business",
    color: "#34d399",
    rgb: "52,211,153",
    icon: TrendingUp,
    services: [
      { name: "Sourcing international",  desc: "Recherche et mise en relation avec des fournisseurs qualifiés à l'international", price: "Sur devis", tag: null, href: "/services/recherche-fournisseurs" },
      { name: "Marchés publics & privés", desc: "Aide aux appels d'offres, constitution de dossiers, conseil stratégique",        price: "Sur devis", tag: null, href: "/services/marches-publics" },
    ],
  },
] as const;

const FAQ = [
  {
    q: "Les prix incluent-ils la maintenance et le support ?",
    a: "L'abonnement DJAMA Pro (11,90 €/mois) inclut le support et les mises à jour des outils. Pour les créations web, un devis de maintenance peut être établi séparément.",
  },
  {
    q: "Puis-je cumuler plusieurs services ?",
    a: "Absolument. La plupart des clients combinent DJAMA Pro avec une création web et du coaching IA. Nous proposons des tarifs dégressifs sur les packs combinés.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "DJAMA Pro est sans engagement, résiliable à tout moment. Les prestations ponctuelles sont payées à la livraison. Le Coaching IA bénéficie d'une garantie 7 jours.",
  },
  {
    q: "Comment obtenir un devis pour les services 'Sur devis' ?",
    a: "Remplissez le formulaire de contact ou écrivez-nous sur WhatsApp. Nous répondons sous 24h avec une première estimation, puis un devis après un appel découverte gratuit.",
  },
] as const;

/* ══════════════════════════════════════════════════════
   FAQ ITEM
══════════════════════════════════════════════════════ */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeIn}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-colors duration-200 hover:border-gray-300"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-black"
            style={{ background: `rgba(${GOLDR},.12)`, color: GOLD }}
          >
            {String(idx + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-gray-700">{q}</span>
        </div>
        <ChevronDown
          size={15}
          className="shrink-0 text-gray-400 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 px-6 py-4">
              <p className="text-sm leading-relaxed text-gray-500">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="w-full overflow-x-hidden bg-white">

      {/* ══════════════════════ HERO ══════════════════════════ */}
      <section className="relative overflow-hidden bg-white pt-[108px] pb-28 sm:pt-[128px]">
        <div className="pointer-events-none absolute -left-32 -top-16 h-[500px] w-[500px] animate-float-slow rounded-full bg-[rgba(201,165,90,.05)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[-60px] top-[30%] h-[350px] w-[350px] animate-float-delayed rounded-full bg-[rgba(167,139,250,.04)] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]" style={{ color: "#b08d57" }}>
              <Sparkles size={10} />
              Tarifs transparents &amp; profils adaptés
            </span>
          </motion.div>

          <h1 className="display-hero text-gray-900">
            <MultiLineReveal
              lines={["Choisissez votre profil,", "connaissez vos prix."]}
              highlight={1}
              stagger={0.14}
              wordStagger={0.055}
              delay={0.06}
              lineClassName="justify-center"
            />
          </h1>

          <FadeReveal
            delay={0.55}
            as="p"
            className="mx-auto mt-6 max-w-[500px] text-base leading-[1.85] text-gray-500"
          >
            Indépendant, PME ou créatif — trouvez les services DJAMA qui correspondent
            à vos besoins et votre budget. Pas de surprise, pas d&apos;engagement caché.
          </FadeReveal>

          <FadeReveal delay={0.7} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: Shield,        label: "Sans engagement" },
              { icon: Zap,           label: "Accès immédiat"  },
              { icon: MessageCircle, label: "Devis en 24h"    },
              { icon: Star,          label: "50+ clients"     },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-[0.78rem] font-semibold text-gray-500"
              >
                <Icon size={12} style={{ color: GOLD }} />
                {label}
              </span>
            ))}
          </FadeReveal>
        </div>
      </section>

      {/* ══════════════════════ PROFILS ═══════════════════════ */}
      <section className="relative overflow-hidden bg-[#f8f9fa] py-20 sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,.03)] blur-[160px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
              style={{ color: GOLD }}
            >
              <Users size={11} /> Quel est votre profil ?
            </motion.div>
            <h2 className="display-section text-gray-900">
              <MultiLineReveal
                lines={["Les packs recommandés", "par profil."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-gray-900"
              />
            </h2>
          </div>

          {/* Tabs */}
          <motion.div variants={fadeIn} className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {PROFILES.map((p) => {
              const isActive = activeProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    borderColor: isActive ? `rgba(${p.rgb},.5)`   : "rgba(0,0,0,.12)",
                    background:  isActive ? `rgba(${p.rgb},.12)` : "rgba(0,0,0,.03)",
                    color:       isActive ? p.color               : "rgba(0,0,0,.4)",
                    boxShadow:   isActive ? `0 0 18px rgba(${p.rgb},.15)` : "none",
                  }}
                >
                  <p.icon size={14} />
                  {p.label}
                </button>
              );
            })}
          </motion.div>

          {/* Pack actif */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
            >
              <div
                className="relative overflow-hidden rounded-3xl border bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)]"
                style={{
                  borderColor: `rgba(${active.rgb},.25)`,
                }}
              >
                {/* Top accent bar */}
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,transparent,${active.color},transparent)` }} />

                <div className="relative grid gap-0 lg:grid-cols-[1fr_280px]">

                  {/* ─── Left : info + services ─── */}
                  <div className="p-8 lg:pr-10">

                    {/* Profile header */}
                    <div className="mb-6 flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                          background:   `rgba(${active.rgb},.14)`,
                          borderColor:  `rgba(${active.rgb},.3)`,
                          boxShadow:    `0 0 20px rgba(${active.rgb},.2)`,
                        }}
                      >
                        <active.icon size={26} style={{ color: active.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-extrabold text-gray-900">{active.label}</h3>
                          {active.badge && (
                            <span
                              className="rounded-full border px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[.14em]"
                              style={{
                                borderColor: `rgba(${active.rgb},.4)`,
                                background:  `rgba(${active.rgb},.12)`,
                                color:       active.color,
                              }}
                            >
                              {active.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-400">{active.sublabel}</p>
                      </div>
                    </div>

                    <p className="mb-8 text-[0.95rem] leading-relaxed text-gray-500">{active.pitch}</p>

                    {/* Services recommandés — grille alignée */}
                    <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[.2em] text-gray-400">
                      Services recommandés
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-gray-200">
                      {active.recommended.map(({ name, price, href, highlight }, i) => (
                        <Link
                          key={name}
                          href={href}
                          className={`group flex items-center justify-between gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-gray-50 ${
                            i !== active.recommended.length - 1 ? "border-b border-gray-200" : ""
                          } ${highlight ? "bg-gray-50" : ""}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle2
                              size={14}
                              className="shrink-0"
                              style={{ color: highlight ? active.color : "rgba(0,0,0,.2)" }}
                            />
                            <span
                              className="text-sm font-semibold leading-tight text-gray-700 group-hover:text-gray-900 truncate"
                            >
                              {name}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className="text-sm font-black whitespace-nowrap"
                              style={{ color: active.color }}
                            >
                              {price}
                            </span>
                            <ArrowRight
                              size={12}
                              className="opacity-0 transition-opacity group-hover:opacity-60"
                              style={{ color: active.color }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* ─── Right : price + CTA ─── */}
                  <div className="flex flex-col items-center justify-center gap-5 border-t border-gray-200 p-8 text-center lg:border-l lg:border-t-0">
                    <div>
                      <p className="mb-2 text-[0.62rem] font-black uppercase tracking-[.22em] text-gray-400">
                        À partir de
                      </p>
                      <p className="text-[3rem] font-black leading-none tracking-tight text-gray-900">
                        {active.startingFrom}
                      </p>
                      <p className="mt-1.5 text-[0.75rem] font-semibold text-gray-400">
                        {active.startingUnit}
                      </p>
                    </div>

                    <Link
                      href="/contact?besoin=devis"
                      className="btn-primary group relative w-full max-w-[200px] overflow-hidden py-3 text-sm"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Obtenir un devis
                        <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
                    </Link>

                    <Link
                      href="/espace-client"
                      className="w-full max-w-[200px] rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-center text-sm font-semibold text-gray-500 transition-all duration-200 hover:border-gray-300 hover:text-gray-700"
                    >
                      Voir DJAMA Pro
                    </Link>

                    <p className="text-[0.62rem] text-gray-400">
                      Sans engagement · Réponse sous 24h
                    </p>
                  </div>

                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ══════════════════════ TARIFS ════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-20 sm:py-28">
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[350px] w-[350px] rounded-full bg-[rgba(96,165,250,.03)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-5xl px-6"
        >
          {/* Header */}
          <div className="mb-14 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
              style={{ color: GOLD }}
            >
              <Receipt size={11} /> Grille tarifaire complète
            </motion.div>
            <h2 className="display-section text-gray-900">
              <MultiLineReveal
                lines={["Tous les services,", "tous les tarifs."]}
                highlight={1} stagger={0.1} wordStagger={0.04}
                lineClassName="justify-center text-gray-900"
              />
            </h2>
            <FadeReveal delay={0.2} as="p" className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500">
              Tarifs indicatifs — les projets &quot;Sur devis&quot; font l&apos;objet d&apos;une estimation gratuite sous 24h.
            </FadeReveal>
          </div>

          {/* Table par catégorie */}
          <motion.div variants={staggerContainerFast} className="space-y-4">
            {ALL_SERVICES.map(({ category, color, rgb, icon: CatIcon, services }) => (
              <motion.div
                key={category}
                variants={cardReveal}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)]"
              >
                {/* En-tête catégorie */}
                <div
                  className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5"
                  style={{ background: `rgba(${rgb},.04)` }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl border"
                    style={{ background: `rgba(${rgb},.12)`, borderColor: `rgba(${rgb},.28)` }}
                  >
                    <CatIcon size={14} style={{ color }} />
                  </div>
                  <h3
                    className="text-[0.72rem] font-extrabold uppercase tracking-[.18em]"
                    style={{ color }}
                  >
                    {category}
                  </h3>
                </div>

                {/* Lignes de service — 2 colonnes fixes : [info] [prix] */}
                <div className="divide-y divide-gray-100">
                  {services.map(({ name, desc, price, tag, href }) => (
                    <Link
                      key={name}
                      href={href}
                      className="group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-gray-50"
                    >
                      {/* Colonne 1 : nom + desc */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 leading-none">
                          <span className="text-[0.9rem] font-semibold text-gray-700 transition-colors group-hover:text-gray-900">
                            {name}
                          </span>
                          {tag && (
                            <span
                              className="rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[.1em]"
                              style={{
                                borderColor: `rgba(${rgb},.3)`,
                                background:  `rgba(${rgb},.08)`,
                                color,
                              }}
                            >
                              {tag}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[0.78rem] leading-snug text-gray-400">
                          {desc}
                        </p>
                      </div>

                      {/* Colonne 2 : prix — largeur fixe, toujours aligné à droite */}
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span
                          className="w-[120px] text-right text-[0.88rem] font-black"
                          style={{ color }}
                        >
                          {price}
                        </span>
                        <ArrowRight
                          size={13}
                          className="shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-50"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Note devis */}
          <FadeReveal delay={0.3} className="mt-8 flex justify-center">
            <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3">
              <MessageCircle size={13} style={{ color: GOLD }} />
              <p className="text-[0.78rem] text-gray-500">
                Devis gratuit pour tous les services &quot;Sur devis&quot; —{" "}
                <Link
                  href="/contact"
                  className="font-semibold underline underline-offset-2 transition-colors hover:opacity-75"
                  style={{ color: GOLD }}
                >
                  contactez-nous
                </Link>
              </p>
            </div>
          </FadeReveal>
        </motion.div>
      </section>

      {/* ══════════════════════ FAQ ═══════════════════════════ */}
      <section className="relative overflow-hidden bg-[#f8f9fa] py-20 sm:py-24">
        <div className="pointer-events-none absolute left-[-60px] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[rgba(167,139,250,.04)] blur-[90px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-3xl px-6"
        >
          <div className="mb-10 text-center">
            <motion.div
              variants={fadeIn}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em] text-gray-400"
            >
              <Sparkles size={10} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Tout ce que vous devez savoir sur les tarifs
            </motion.h2>
          </div>

          <motion.div variants={staggerContainerFast} className="space-y-2.5">
            {FAQ.map(({ q, a }, idx) => (
              <FaqItem key={q} q={q} a={a} idx={idx} />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ CTA FINAL ═════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] px-8 py-20 text-center md:px-16"
          style={{ background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%)" }}
        >
          <div className="relative z-10">
            <motion.span variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em] text-white">
              <Network size={10} /> Rejoignez l&apos;écosystème DJAMA
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Prêt à démarrer ?", "On s'occupe du reste."]}
                highlight={0} stagger={0.13} wordStagger={0.065}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.26} as="p" className="mx-auto mt-5 max-w-md text-base leading-[1.8] text-white/70">
              Appel découverte gratuit · Devis sous 24h · Sans engagement
            </FadeReveal>

            <FadeReveal delay={0.4} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="btn-primary group relative overflow-hidden px-8 py-[0.9rem] text-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Obtenir un devis gratuit
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -translate-x-full bg-white/[.08] transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link
                href="/espace-client"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/30 bg-white/10 px-8 py-[0.95rem] font-bold text-white transition hover:bg-white/20"
              >
                Essayer DJAMA Pro — 11,90 €/mois
              </Link>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
