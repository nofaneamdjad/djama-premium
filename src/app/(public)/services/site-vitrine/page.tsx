"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, ArrowRight, CheckCircle2, Sparkles, ChevronDown, Globe,
  Search, Smartphone, Shield, TrendingUp, Star, Briefcase, ShoppingBag,
  Users, Building2, Code2, Palette, MessageSquare, Zap, Clock, ArrowLeft,
  BadgeCheck, Rocket, HeartHandshake, Layers, Lock,
  Phone, FileText, LayoutDashboard, HelpCircle, Image as ImageIcon,
  Wrench, CheckSquare, Eye, X, ArrowRightLeft,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette violet / bleu lumineux ──────────────── */
const V  = "#a78bfa";   // violet light
const VR = "167,139,250";
const V2 = "#8b5cf6";   // violet deep
const B  = "#60a5fa";   // blue
const BR = "96,165,250";
const G  = "#c9a55a";   // gold DJAMA
const GR = "201,165,90";

/* ═══════════════════════════════════════ DATA ══════════════════════════════════════ */

const POUR_QUI = [
  { icon: Briefcase,   c: V,        r: VR,          t: "Entrepreneurs",          d: "Lancez votre activité avec une vitrine crédible dès le premier jour." },
  { icon: Wrench,      c: "#4ade80", r: "74,222,128", t: "Artisans & BTP",        d: "Galerie travaux, devis en ligne, zones d'intervention cartographiées." },
  { icon: ShoppingBag, c: "#f9a826", r: "249,168,38", t: "Commerces locaux",      d: "Horaires, menu, localisation, système de réservation en ligne." },
  { icon: Users,       c: "#f472b6", r: "244,114,182",t: "Associations",          d: "Mission, équipe, adhérents, événements et appels aux dons." },
  { icon: Building2,   c: B,        r: BR,           t: "Professions libérales",  d: "Image sobre et professionnelle, prise de RDV, formulaire sécurisé." },
  { icon: Star,        c: G,        r: GR,           t: "Freelances",             d: "Portfolio, témoignages clients, tarifs clairs et CTA direct." },
];

const INCLUS = [
  { icon: Palette,        c: V,        r: VR,           t: "Design sur mesure",       d: "Maquette validée avec vous. Couleurs, typo, ambiance — rien de générique." },
  { icon: Smartphone,     c: B,        r: BR,           t: "Responsive mobile",        d: "Parfait sur iPhone, Android, tablette et desktop. Testé partout." },
  { icon: MessageSquare,  c: "#f9a826",r: "249,168,38",  t: "Formulaire de contact",   d: "Anti-spam, notifications email instantanées. Aucune demande ne passe." },
  { icon: Phone,          c: "#f472b6",r: "244,114,182", t: "WhatsApp intégré",        d: "Bouton flottant ou CTA WhatsApp direct — vos clients chattent en un tap." },
  { icon: Search,         c: "#4ade80",r: "74,222,128",  t: "SEO de base",             d: "Métas, titres H1–H6, sitemap.xml — les fondations pour Google." },
  { icon: Lock,           c: G,        r: GR,           t: "SSL + HTTPS",              d: "Certificat SSL, conformité RGPD, mentions légales incluses." },
  { icon: Zap,            c: "#fb923c",r: "251,146,60",  t: "Performance < 2s",        d: "Code optimisé, images compressées, Lighthouse 90+." },
  { icon: Globe,          c: "#e879f9",r: "232,121,249", t: "Mise en ligne clé en main",d: "Configuration domaine, hébergement, déploiement — tout géré." },
  { icon: HeartHandshake, c: "#4ade80",r: "74,222,128",  t: "Support post-livraison",  d: "2 semaines de retouches incluses. Maintenance mensuelle disponible." },
];

const METHODE = [
  { icon: MessageSquare,c: G,        r: GR,           t: "Contact",       d: "Échange de 15 min pour cerner votre activité et vos attentes.",   duration: "Jour 1"    },
  { icon: FileText,     c: V,        r: VR,           t: "Brief",         d: "Questionnaire détaillé, inspirations visuelles, recueil du contenu.", duration: "Jours 2–3" },
  { icon: Palette,      c: B,        r: BR,           t: "Design",        d: "Maquette complète soumise pour validation. Aucun dev sans votre accord.", duration: "Jours 4–6" },
  { icon: Code2,        c: "#4ade80",r: "74,222,128",  t: "Développement", d: "Intégration rapide et propre, responsive, testé sur tous les appareils.", duration: "Jours 7–9" },
  { icon: Rocket,       c: "#f9a826",r: "249,168,38",  t: "Mise en ligne", d: "Publication sur votre domaine + formation CMS de 30 min incluse.",  duration: "Jour 10"   },
];

const PAGES_POSSIBLES = [
  { icon: LayoutDashboard, c: V,        r: VR,          t: "Accueil",       d: "Présentation percutante et CTA visible au-dessus du pli." },
  { icon: Users,           c: B,        r: BR,          t: "À propos",      d: "Votre histoire, vos valeurs, votre équipe ou parcours." },
  { icon: Layers,          c: "#f9a826",r: "249,168,38", t: "Services",      d: "Détail de vos offres, tarifs, conditions." },
  { icon: ImageIcon,       c: "#f472b6",r: "244,114,182",t: "Réalisations",  d: "Portfolio, galerie photos, études de cas." },
  { icon: MessageSquare,   c: "#4ade80",r: "74,222,128", t: "Contact",       d: "Formulaire, carte interactive, coordonnées complètes." },
  { icon: HelpCircle,      c: G,        r: GR,          t: "FAQ",           d: "Réponses aux questions fréquentes pour rassurer vos prospects." },
];

const POURQUOI_DJAMA = [
  { icon: HeartHandshake, c: V,        r: VR,           t: "Accompagnement humain",     d: "Un interlocuteur unique du brief à la livraison. Réponse sous 24h garantie." },
  { icon: Palette,        c: B,        r: BR,           t: "Design unique à chaque fois",d: "Pas de template vendu 100 fois. Votre site est conçu de zéro pour vous." },
  { icon: Zap,            c: "#f9a826",r: "249,168,38",  t: "Sites rapides et légers",  d: "Code sur mesure, sans page builder lourd. Vos visiteurs n'attendent pas." },
  { icon: Wrench,         c: "#f472b6",r: "244,114,182", t: "Adapté à votre métier",    d: "Artisan, médecin, e-commerçant — on connaît les spécificités de votre secteur." },
  { icon: TrendingUp,     c: "#4ade80",r: "74,222,128",  t: "Évolutif dans le temps",   d: "Blog, boutique, espace client — votre site grandit avec votre activité." },
  { icon: Shield,         c: G,        r: GR,           t: "Support après livraison",   d: "On ne disparaît pas après le paiement. Support inclus, maintenance disponible." },
];

const AVANT = [
  { t: "Invisible sur Google",         d: "Vos prospects ne vous trouvent pas — et vont chez vos concurrents." },
  { t: "Image non professionnelle",    d: "Un numéro seul sur Google Maps n'inspire pas confiance." },
  { t: "0 demande automatique",        d: "Chaque contact dépend du bouche-à-oreille ou des réseaux sociaux." },
  { t: "Dépendant des plateformes",    d: "Si l'algorithme change, votre visibilité disparaît du jour au lendemain." },
  { t: "Indisponible la nuit",         d: "Un visiteur à 23h ne peut pas vous laisser ses coordonnées." },
];

const APRES = [
  { t: "Visible sur Google 24h/24",    d: "Vos futurs clients vous trouvent au moment précis où ils en ont besoin." },
  { t: "Image haut de gamme",          d: "Un design soigné qui inspire confiance en moins de 5 secondes." },
  { t: "+3 à 10 demandes / mois",      d: "Formulaire, WhatsApp, appel direct — tout fonctionne en automatique." },
  { t: "Présence 100% propriétaire",   d: "Votre site vous appartient. Personne ne peut vous le retirer." },
  { t: "Disponible en permanence",     d: "Vos prospects peuvent vous contacter à toute heure, même le week-end." },
];

const PACKS = [
  {
    name:        "Essentiel",
    price:       "490€",
    sub:         "3 à 5 pages — Livré en 7 jours",
    color:       B,
    rgb:         BR,
    recommended: false,
    features: [
      "Design sur mesure (3–5 pages)",
      "Responsive mobile & desktop",
      "Formulaire de contact anti-spam",
      "SEO de base (métas, sitemap)",
      "Certificat SSL + HTTPS",
      "Mentions légales RGPD incluses",
      "Support 2 semaines",
    ],
    cta: "Choisir Essentiel",
  },
  {
    name:        "Pro",
    price:       "790€",
    sub:         "5 à 8 pages — Livré en 10 jours",
    color:       V,
    rgb:         VR,
    recommended: true,
    features: [
      "Design sur mesure (5–8 pages)",
      "Responsive mobile & desktop",
      "Blog ou espace actualités",
      "WhatsApp + formulaire avancé",
      "SEO avancé + Google Analytics",
      "Formation CMS incluse (30 min)",
      "Support 1 mois",
      "1 révision majeure gratuite",
    ],
    cta: "Choisir le pack Pro",
  },
  {
    name:        "Sur mesure",
    price:       "Sur devis",
    sub:         "Pages illimitées — Fonctions custom",
    color:       G,
    rgb:         GR,
    recommended: false,
    features: [
      "Pages & fonctionnalités illimitées",
      "Boutique e-commerce complète",
      "Système de réservation / RDV",
      "Espace client sécurisé",
      "SEO & contenus mensuels",
      "Intégrations API sur mesure",
      "Support prioritaire continu",
    ],
    cta: "Demander un devis",
  },
];

const FAQ = [
  { q: "Combien de temps pour livrer mon site ?",          a: "Entre 7 et 10 jours selon le nombre de pages. Un site 3 pages peut être livré en 7 jours si vous avez votre contenu prêt. On vous accompagne aussi pour la rédaction." },
  { q: "Le nom de domaine est-il inclus ?",                a: "Le domaine (env. 15€/an) et l'hébergement sont généralement à votre charge. On vous guide étape par étape pour tout configurer — aucune compétence technique requise." },
  { q: "Puis-je modifier le contenu moi-même ?",           a: "Oui. On intègre un CMS simple (type Notion, Sanity ou WordPress allégé) si vous souhaitez modifier vos textes et images sans faire appel à un développeur." },
  { q: "Mon site sera-t-il bien positionné sur Google ?",  a: "On applique les bonnes pratiques SEO de base incluses dans chaque site (métas, titres, sitemap, vitesse). Un accompagnement SEO avancé est disponible en option." },
  { q: "Combien coûte un site vitrine ?",                  a: "Notre offre démarre à 490€ tout inclus. Le tarif final dépend du nombre de pages et des fonctionnalités souhaitées. Devis gratuit et sans engagement sous 24h." },
  { q: "Que se passe-t-il après la livraison ?",           a: "Vous bénéficiez de 2 à 4 semaines de retouches incluses (selon le pack). Au-delà, une maintenance mensuelle est disponible à partir de 49€/mois." },
];

const TEMOIGNAGES = [
  { i: "M", c: VR,           n: "Marie L.",   r: "Sophrologue",       s: 5, t: "Site créé en 10 jours, résultat bluffant. J'ai eu mes 3 premiers contacts en moins d'une semaine après la mise en ligne." },
  { i: "T", c: BR,           n: "Thomas B.",  r: "Artisan menuisier", s: 5, t: "Je ne connaissais rien au web. L'équipe a tout géré, expliqué chaque étape et livré un site que mes clients adorent." },
  { i: "C", c: "249,168,38", n: "Camille D.", r: "Coach business",    s: 5, t: "Site clean, rapide et bien positionné sur Google en quelques semaines. Exactement ce que je voulais." },
];

/* ═══════════════════════════════════════ PAGE ══════════════════════════════════════ */
export default function SiteVitrinePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24">

        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.022]"
            style={{ backgroundImage: `linear-gradient(rgba(${VR},.7) 1px,transparent 1px),linear-gradient(90deg,rgba(${VR},.7) 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
          {/* Orbs */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.07, .13, .07] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-40 top-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(circle,rgba(${VR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-0 top-0 w-[420px] h-[420px] rounded-full blur-[100px] opacity-[0.06]"
            style={{ background: `radial-gradient(circle,rgba(${BR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/3 bottom-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${GR},1) 0%,transparent 70%)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: copy ── */}
            <div>
              {/* Back link */}
              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .45, ease }}
                className="mb-5"
              >
                <Link href="/services"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                  <ArrowLeft size={11} /> Tous les services
                </Link>
              </motion.div>

              {/* Badge service */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease, delay: .05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[.72rem] font-bold"
                style={{ borderColor: `rgba(${VR},.3)`, background: `rgba(${VR},.08)`, color: V }}
              >
                <Monitor size={11} /> Site vitrine professionnel
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-[#07070a]"
                  style={{ background: V }}>PRO</span>
              </motion.div>

              {/* Headline */}
              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Un site vitrine", "qui travaille", "pour vous."]}
                  highlight={1}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              {/* Subline */}
              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  Design sur mesure, responsive, SEO-ready et formulaire de contact — tout ce qu&apos;il faut pour être crédible en ligne et générer des clients chaque semaine.
                </p>
              </FadeReveal>

              {/* Price block */}
              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${VR},.22)`, background: `rgba(${VR},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">À partir de</p>
                    <p className="text-[2rem] font-extrabold leading-none" style={{ color: V }}>490€</p>
                  </div>
                  <div className="h-10 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Devis gratuit", "Livré en 10 jours", "Sans engagement"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="text-[#4ade80] shrink-0" /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              {/* CTAs */}
              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Création+de+site+web"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(167,139,250,0.28)]"
                    style={{ background: `linear-gradient(135deg,${V2},${B})`, color: "#fff" }}>
                    Créer mon site vitrine <ArrowRight size={15} />
                  </Link>
                  <a href="#tarifs"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir les tarifs
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* ── Right: browser mockup ── */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .75, ease, delay: .3 }}
              className="relative"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute -inset-8 rounded-3xl blur-3xl opacity-[0.28]"
                style={{ background: `radial-gradient(ellipse,rgba(${VR},.6) 0%,rgba(${BR},.35) 55%,transparent 75%)` }} />

              {/* Browser */}
              <div className="relative overflow-hidden rounded-[20px] border border-white/[0.1] shadow-[0_48px_110px_rgba(0,0,0,.8)]"
                style={{ background: "#0d0d10" }}>

                {/* Tab bar */}
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5"
                  style={{ background: "#111116" }}>
                  <div className="flex gap-1.5">
                    {["#ff5f57", "#ffbd2e", "#28c840"].map(bg => (
                      <div key={bg} className="w-2.5 h-2.5 rounded-full" style={{ background: bg }} />
                    ))}
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 mx-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                    <span className="flex-1 text-[.58rem] text-white/30">www.votre-activite.fr</span>
                    <span className="text-[.5rem] text-white/20">ssl</span>
                  </div>
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5"
                  style={{ background: "#0a0a0d" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg" style={{ background: `rgba(${VR},.28)` }} />
                    <div className="h-1.5 w-16 rounded-full bg-white/20" />
                  </div>
                  <div className="flex gap-4">
                    {[36, 46, 40, 30].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-white/14" style={{ width: w }} />
                    ))}
                  </div>
                  <div className="h-6 w-16 rounded-full"
                    style={{ background: `linear-gradient(135deg,rgba(${VR},.55),rgba(${BR},.45))` }} />
                </div>

                {/* Hero content */}
                <div className="px-4 py-5"
                  style={{ background: "linear-gradient(135deg,#0e0d16 0%,#0a0d14 100%)" }}>
                  <motion.div
                    animate={{ width: ["28%", "50%", "28%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-2 h-1.5 rounded-full"
                    style={{ background: `linear-gradient(90deg,rgba(${VR},.7),rgba(${BR},.5))` }}
                  />
                  <div className="mb-1 h-3.5 w-3/4 rounded-full bg-white/40" />
                  <div className="mb-3 h-2.5 w-1/2 rounded-full bg-white/18" />
                  <div className="space-y-1.5 mb-4">
                    {[100, 82, 64].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-white/10" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    <div className="h-7 w-24 rounded-xl"
                      style={{ background: `linear-gradient(135deg,rgba(${VR},.65),rgba(${BR},.5))` }} />
                    <div className="h-7 w-18 rounded-xl border border-white/10" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1.5 p-2.5" style={{ background: "#0b0b0e" }}>
                  {[["247", "Visites", VR], ["4.9★", "Note", "249,168,38"], ["38", "Leads", BR]].map(([v, l, c]) => (
                    <div key={l} className="rounded-xl border border-white/[0.06] p-2.5" style={{ background: "#111116" }}>
                      <p className="text-sm font-extrabold" style={{ color: `rgba(${c},.9)` }}>{v}</p>
                      <p className="text-[.52rem] text-white/35">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Card row */}
                <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5" style={{ background: "#0b0b0e" }}>
                  {[VR, BR, "244,114,182"].map((c, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] p-2.5" style={{ background: "#0e0e12" }}>
                      <div className="mb-1.5 w-5 h-5 rounded-lg" style={{ background: `rgba(${c},.15)` }} />
                      <div className="mb-1 h-1 w-full rounded-full bg-white/16" />
                      <div className="h-1 w-2/3 rounded-full bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 top-10 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141a" }}
              >
                <div className="flex items-center gap-2">
                  <Search size={12} style={{ color: V }} />
                  <div>
                    <p className="text-[.58rem] font-bold text-white">SEO optimisé</p>
                    <p className="text-[.5rem] text-white/35">Top 3 Google</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 right-10 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                style={{ borderColor: `rgba(${VR},.28)`, background: `rgba(${VR},.08)` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: V }} />
                <p className="text-[.58rem] font-semibold" style={{ color: V }}>Livré en 10 jours</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div className="border-y border-white/[0.05] py-5 px-5"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            ["10j",   "Délai moyen de livraison",  VR],
            ["+60%",  "Contacts entrants en plus",  BR],
            ["Top 3", "Google en moins de 2 mois",  "249,168,38"],
            ["100%",  "Sites responsive garantis",  "244,114,182"],
          ].map(([v, l, c]) => (
            <motion.div key={l} {...fadeIn} viewport={viewport} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold mb-0.5" style={{ color: `rgba(${c},.9)` }}>{v}</p>
              <p className="text-[.68rem] text-white/40 font-medium">{l}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. POUR QUI
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Users size={12} style={{ color: V }} /> Pour qui ?
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Un site pour <span style={{ color: V }}>chaque type d&apos;activité</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              On connaît les spécificités de chaque secteur — et on adapte votre site en conséquence.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {POUR_QUI.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at 50% 120%,rgba(${item.r},.12) 0%,transparent 65%)` }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={17} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. AVANT / APRÈS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 w-[350px] h-[350px] rounded-full blur-[90px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${VR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <ArrowRightLeft size={12} style={{ color: V }} /> Transformation
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Avant votre site <span style={{ color: V }}>— après DJAMA</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              La différence entre une activité invisible et une activité qui attire des clients chaque semaine.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-[1fr_56px_1fr] gap-4 items-start">
            {/* AVANT */}
            <motion.div
              initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease }}
              className="rounded-2xl border border-[rgba(248,113,113,.18)] p-6"
              style={{ background: "rgba(248,113,113,.04)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[rgba(248,113,113,.15)]">
                  <X size={14} className="text-[#f87171]" />
                </div>
                <div>
                  <p className="font-extrabold text-[#f87171] text-sm">Sans site web</p>
                  <p className="text-[.65rem] text-white/30">Situation actuelle</p>
                </div>
              </div>
              <div className="space-y-3.5">
                {AVANT.map(item => (
                  <div key={item.t} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-[rgba(248,113,113,.12)] border border-[rgba(248,113,113,.22)] flex items-center justify-center shrink-0">
                      <X size={7} className="text-[#f87171]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/65 leading-snug">{item.t}</p>
                      <p className="text-xs text-white/35 leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: .5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: .35, ease, delay: .2 }}
              className="flex items-center justify-center self-center my-4 md:my-0"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border shadow-lg"
                style={{ borderColor: `rgba(${VR},.4)`, background: `rgba(${VR},.1)` }}>
                <ArrowRight size={16} style={{ color: V }} />
              </div>
            </motion.div>

            {/* APRÈS */}
            <motion.div
              initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease, delay: .1 }}
              className="rounded-2xl border p-6"
              style={{ borderColor: `rgba(${VR},.22)`, background: `rgba(${VR},.05)` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `rgba(${VR},.15)` }}>
                  <CheckCircle2 size={14} style={{ color: V }} />
                </div>
                <div>
                  <p className="font-extrabold text-sm" style={{ color: V }}>Avec DJAMA</p>
                  <p className="text-[.65rem] text-white/30">Après livraison</p>
                </div>
              </div>
              <div className="space-y-3.5">
                {APRES.map(item => (
                  <div key={item.t} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `rgba(${VR},.15)`, border: `1px solid rgba(${VR},.3)` }}>
                      <CheckCircle2 size={7} style={{ color: V }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/85 leading-snug">{item.t}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. CE QUI EST INCLUS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <CheckSquare size={12} style={{ color: V }} /> Ce qui est inclus
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Tout ce qu&apos;on <span style={{ color: V }}>inclut dans chaque site</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Pas de surprise, pas de frais cachés. Voici exactement ce que vous obtenez à chaque projet.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INCLUS.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -4, transition: { duration: .2 } }}
                className="group relative flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.13] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 100%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={17} style={{ color: item.c }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. PROCESSUS ANIMÉ
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 w-[380px] h-[380px] rounded-full blur-[100px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${BR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: V }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De l&apos;idée au site en ligne <span style={{ color: V }}>en 10 jours</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Un processus transparent, avec vous à chaque décision clé. Zéro surprise.
            </motion.p>
          </motion.div>

          {/* Desktop timeline */}
          <div className="hidden lg:block relative">
            {/* Track line (dimmed) */}
            <div className="absolute top-9 left-[9%] right-[9%] h-px"
              style={{ background: `linear-gradient(90deg,transparent,rgba(${VR},.18),rgba(${BR},.18),transparent)` }} />
            {/* Animated progress line */}
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.4, ease, delay: .35 }}
              className="absolute top-9 left-[9%] right-[9%] h-px origin-left"
              style={{ background: `linear-gradient(90deg,${V},${B})` }}
            />

            <div className="flex items-start">
              {METHODE.map((e, i) => (
                <motion.div key={e.t}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: .2 + i * .13, duration: .5, ease }}
                  className="flex-1 flex flex-col items-center text-center px-3"
                >
                  {/* Icon circle */}
                  <div className="relative w-[72px] h-[72px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                    style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                    <e.icon size={22} style={{ color: e.c }} />
                    <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                      style={{ background: e.c }}>{i + 1}</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed mb-2.5">{e.d}</p>
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[.6rem] font-bold"
                    style={{ color: e.c }}>
                    {e.duration}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${VR},.35),rgba(${BR},.35),transparent)` }} />
            {METHODE.map((e, i) => (
              <motion.div key={e.t}
                initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * .08, duration: .4, ease }}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 ml-10"
              >
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `rgba(${e.r},.12)` }}>
                  <e.icon size={16} style={{ color: e.c }} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[.5rem] font-extrabold flex items-center justify-center text-[#07070a]"
                    style={{ background: e.c }}>{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-white text-sm">{e.t}</p>
                    <span className="text-[.6rem] font-bold" style={{ color: e.c }}>{e.duration}</span>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. PAGES POSSIBLES
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <FileText size={12} style={{ color: V }} /> Structure du site
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Les pages <span style={{ color: V }}>que l&apos;on peut créer</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              De 1 à 10+ pages, chacune pensée pour convertir vos visiteurs en clients.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PAGES_POSSIBLES.map((item, i) => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .2 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 text-center cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 110%,rgba(${item.r},.12) 0%,transparent 60%)` }} />
                {i === 0 && (
                  <span className="absolute top-2 right-2 text-[.55rem] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: `rgba(${VR},.15)`, color: V }}>
                    Page clé
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={18} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. TARIFS — 3 PACKS
      ══════════════════════════════════════════ */}
      <section id="tarifs" className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [.04, .08, .04] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(ellipse,rgba(${VR},.9) 0%,rgba(${BR},.7) 50%,transparent 70%)` }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <BadgeCheck size={12} style={{ color: V }} /> Tarifs transparents
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Des offres <span style={{ color: V }}>claires, sans surprise</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-xl mx-auto text-sm sm:text-base">
              Tarif fixe validé avant le début. 50% à la commande, solde à la livraison. Aucun frais caché.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PACKS.map((pack, i) => (
              <motion.div key={pack.name}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * .11, duration: .5, ease }}
                className={`relative rounded-3xl border p-6 flex flex-col transition-all duration-300 ${
                  pack.recommended
                    ? "scale-[1.02] shadow-[0_0_60px_rgba(167,139,250,0.15)]"
                    : "hover:border-white/[0.15]"
                }`}
                style={{
                  borderColor: pack.recommended ? `rgba(${pack.rgb},.35)` : `rgba(${pack.rgb},.12)`,
                  background:  pack.recommended ? `rgba(${pack.rgb},.07)` : "rgba(255,255,255,.025)",
                }}
              >
                {pack.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[.62rem] font-extrabold uppercase tracking-wider text-[#07070a] shadow-lg"
                      style={{ background: `linear-gradient(135deg,${V},${B})` }}>
                      <Sparkles size={9} /> Recommandé
                    </span>
                  </div>
                )}

                {/* Pack header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `rgba(${pack.rgb},.15)` }}>
                      <Monitor size={14} style={{ color: pack.color }} />
                    </div>
                    <p className="font-extrabold text-white">{pack.name}</p>
                  </div>
                  <p className="text-3xl font-extrabold leading-none mb-1.5" style={{ color: pack.color }}>
                    {pack.price}
                  </p>
                  <p className="text-xs text-white/40">{pack.sub}</p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-2.5 mb-6">
                  {pack.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} style={{ color: pack.color }} className="shrink-0" />
                      <span className="text-sm text-white/72">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/contact?besoin=Création+de+site+web&pack=${pack.name}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={
                    pack.recommended
                      ? { background: `linear-gradient(135deg,${V2},${B})`, color: "#fff" }
                      : { border: `1px solid rgba(${pack.rgb},.25)`, background: `rgba(${pack.rgb},.07)`, color: pack.color }
                  }
                >
                  {pack.cta} <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeIn} viewport={viewport}
            className="mt-6 text-center text-xs text-white/28">
            Tous les tarifs sont HT · Paiement en 2× · Devis gratuit et sans engagement sous 24h
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. PREUVES DE VALEUR — POURQUOI DJAMA
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: G }} /> Pourquoi nous ?
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Pourquoi choisir <span style={{ color: V }}>DJAMA</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              On ne fait pas que coder des sites. On accompagne votre activité vers plus de visibilité et de clients.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POURQUOI_DJAMA.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -4, transition: { duration: .2 } }}
                className="group relative flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 0% 100%,rgba(${item.r},.1) 0%,transparent 60%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={18} style={{ color: item.c }} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. TÉMOIGNAGES
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[500px] h-[200px] rounded-full blur-[80px] opacity-[0.05]"
            style={{ background: `radial-gradient(ellipse,rgba(${VR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: "#f9a826" }} /> Avis clients
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Ce que disent <span style={{ color: V }}>nos clients</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-3 gap-4">
            {TEMOIGNAGES.map(t => (
              <motion.div key={t.n} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .2 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col gap-4 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 110%,rgba(${t.c},.08) 0%,transparent 60%)` }} />
                <div className="flex gap-0.5">
                  {Array.from({ length: t.s }).map((_, i) => (
                    <Star key={i} size={13} fill="#f9a826" stroke="none" />
                  ))}
                </div>
                <p className="text-sm text-white/65 leading-relaxed flex-1 italic">&ldquo;{t.t}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#07070a] shrink-0"
                    style={{ background: `rgba(${t.c},.9)` }}>{t.i}</div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{t.n}</p>
                    <p className="text-xs text-white/40">{t.r}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          10. FAQ
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <HelpCircle size={12} style={{ color: V }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: V }}>nos réponses</span>
            </motion.h2>
          </motion.div>

          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${VR},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${VR},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? V : "rgba(255,255,255,.38)" }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }}
                    >
                      <p className="px-5 pb-4 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-3">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          11. CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-5 relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [.05, .1, .05] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px]"
            style={{ background: `radial-gradient(ellipse,rgba(${VR},.9) 0%,rgba(${BR},.6) 55%,transparent 70%)` }}
          />
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.016]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${VR},.22)`, background: `rgba(${VR},.04)` }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-24 h-24 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${VR},.15)` }} />
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${VR},.15)` }} />

            {/* Floating orbs inside card */}
            <div className="pointer-events-none absolute -top-10 right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: `rgba(${VR},1)` }} />
            <div className="pointer-events-none absolute -bottom-10 left-10 w-28 h-28 rounded-full blur-3xl opacity-15"
              style={{ background: `rgba(${BR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <Rocket size={12} style={{ color: V }} /> Prêt à démarrer ?
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Votre site vitrine,<br />
              <span style={{
                background: `linear-gradient(135deg,${V},${B})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                livré en 10 jours.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Design unique, responsive, SEO-ready. À partir de <strong className="text-white/75">490€</strong>, devis gratuit et sans engagement.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <Link href="/contact?besoin=Création+de+site+web"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(139,92,246,0.25)] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)]"
                style={{ background: `linear-gradient(135deg,${V2},${B})`, color: "#fff" }}>
                Créer mon site vitrine <ArrowRight size={15} />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                Parler de mon projet
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="relative flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                [Clock,     "Réponse sous 24h"],
                [Shield,    "Sans engagement"],
                [BadgeCheck,"Devis gratuit"],
                [Star,      "Paiement en 2×"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: V }} />
                  {l as string}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
