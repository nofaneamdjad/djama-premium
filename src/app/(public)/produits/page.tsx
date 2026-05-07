"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Package, Sparkles, Zap,
  LayoutDashboard, FileText, Users, CreditCard, Calendar,
  StickyNote, Timer, Shield, Globe, Code2, Smartphone,
  Layers, Bot, Palette, Video, Camera, Star,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const vp   = { once: true, margin: "-40px" } as const;

const OUTILS_ESPACE = [
  { icon: FileText,        label: "Factures & Devis",  color: "#c9a55a" },
  { icon: Users,           label: "CRM clients",        color: "#60a5fa" },
  { icon: CreditCard,      label: "Trésorerie",         color: "#4ade80" },
  { icon: Calendar,        label: "Planning",           color: "#a78bfa" },
  { icon: StickyNote,      label: "Notes IA",           color: "#f472b6" },
  { icon: Timer,           label: "Chrono pro",         color: "#fb923c" },
  { icon: Bot,             label: "Assistant IA",       color: "#34d399" },
  { icon: LayoutDashboard, label: "Dashboard",          color: "#c9a55a" },
];

const DIGITAL = [
  {
    href:    "/services/site-vitrine",
    icon:    Globe,
    color:   "#7c6fcd",
    rgb:     "124,111,205",
    title:   "Site Vitrine",
    price:   "Dès 490€",
    desc:    "Site web professionnel, rapide et optimisé SEO. Design moderne, responsive, livré en 7 jours.",
    details: ["Design sur mesure", "SEO optimisé", "Formulaire contact", "Hébergement 1 an"],
  },
  {
    href:    "/services/site-ecommerce",
    icon:    CreditCard,
    color:   "#7c6fcd",
    rgb:     "124,111,205",
    title:   "Site E-commerce",
    price:   "Dès 990€",
    desc:    "Boutique en ligne complète avec paiement sécurisé, gestion des stocks et tableau de bord admin.",
    details: ["Paiement Stripe/PayPal", "Gestion des stocks", "Admin simplifié", "Analytics inclus"],
  },
  {
    href:    "/services/application-mobile",
    icon:    Smartphone,
    color:   "#7c6fcd",
    rgb:     "124,111,205",
    title:   "Application Mobile",
    price:   "Dès 1 900€",
    desc:    "Application iOS et Android sur mesure. React Native pour un code unique, deux plateformes.",
    details: ["iOS & Android", "React Native", "Push notifications", "Publication stores"],
  },
  {
    href:    "/services/automatisation-ia",
    icon:    Bot,
    color:   "#7c6fcd",
    rgb:     "124,111,205",
    title:   "Automatisation IA",
    price:   "Sur devis",
    desc:    "Automatisez vos workflows répétitifs avec Zapier, Make, n8n et les APIs IA. Gagnez des heures chaque semaine.",
    details: ["Zapier / Make / n8n", "Intégration API IA", "CRM & outils métier", "Formation incluse"],
  },
];

const CREATION = [
  {
    href:    "/services/visuels-publicitaires",
    icon:    Palette,
    color:   "#dc5078",
    rgb:     "220,80,120",
    title:   "Visuels Publicitaires",
    price:   "Dès 290€",
    desc:    "Créations graphiques pour vos réseaux sociaux, campagnes publicitaires et supports print.",
    details: ["Posts & stories", "Bannières pub", "Identité visuelle", "Formats multiples"],
  },
  {
    href:    "/services/montage-video",
    icon:    Video,
    color:   "#dc5078",
    rgb:     "220,80,120",
    title:   "Montage Vidéo",
    price:   "Dès 190€",
    desc:    "Montage professionnel de vos vidéos : Reels, YouTube, présentations, témoignages clients.",
    details: ["Sous-titrage auto", "Musique & SFX", "Motion design", "Format adapté"],
  },
  {
    href:    "/services/retouche-photo",
    icon:    Camera,
    color:   "#dc5078",
    rgb:     "220,80,120",
    title:   "Retouche Photo",
    price:   "Dès 49€",
    desc:    "Retouches pro pour produits, portraits, immobilier. Rendus nets, livrés en 48h.",
    details: ["Correction colorimétrique", "Détourage net", "Ambiance & style", "Livraison rapide"],
  },
  {
    href:    "/services/plateforme-web-sur-mesure",
    icon:    Layers,
    color:   "#dc5078",
    rgb:     "220,80,120",
    title:   "Plateforme Sur Mesure",
    price:   "Dès 3 500€",
    desc:    "Développement de plateformes web complexes : SaaS, marketplaces, espaces membres, API.",
    details: ["Architecture scalable", "Auth & rôles", "API REST/GraphQL", "DevOps & CI/CD"],
  },
];

export default function ProduitsPage() {
  return (
    <div className="w-full overflow-x-hidden bg-[#09090b]">

      {/* ════════════════════════════════════════════════════
          §1 · HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-24 pt-20 sm:pb-32 sm:pt-36">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.09)] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#c9a55a]"
          >
            <Package size={11} /> Produits & Services DJAMA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="display-hero text-white"
          >
            Tout ce qu&apos;il faut pour{" "}
            <span className="text-[#c9a55a]">gérer</span>{" "}
            et{" "}
            <span className="text-[#7c6fcd]">développer</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg"
          >
            Espace client tout-en-un, sites web, applications, automatisation IA,
            création de contenu. Des outils et services pensés pour votre activité.
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §2 · ESPACE CLIENT — fond blanc (produit phare)
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#b08d45]">
              <Star size={9} fill="#b08d45" /> Produit phare · 11,90€/mois
            </span>
            <h2 className="display-section text-[#09090b]">
              Espace Client{" "}
              <span className="text-[#c9a55a]">DJAMA</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6b7280]">
              Facturation, CRM, trésorerie, planning, notes IA, assistant IA et bien plus.
              La plateforme tout-en-un pour gérer et développer votre activité.
            </p>
          </motion.div>

          {/* Outils grid */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {OUTILS_ESPACE.map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${color}15`, boxShadow: `0 0 0 1px ${color}22` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-[#09090b]">{label}</span>
              </motion.div>
            ))}
          </div>

          {/* Price + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.03)] shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
          >
            <div className="h-[2px] bg-gradient-to-r from-[#c9a55a] via-[#e8cc94] to-[#c9a55a]" />
            <div className="flex flex-col items-center gap-5 p-8 sm:flex-row sm:justify-between">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-[2.8rem] font-black leading-none tracking-tight text-[#09090b]">11,90€</span>
                  <span className="mb-1.5 text-sm font-semibold text-[#9ca3af]">/mois</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#4b5563]">Tous les outils inclus · Sans engagement</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["✓ Factures PDF", "✓ CRM", "✓ Planning", "✓ IA"].map(f => (
                    <span key={f} className="rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)] px-2.5 py-0.5 text-[0.65rem] font-bold text-[#b08d45]">{f}</span>
                  ))}
                </div>
              </div>
              <Link
                href="/espace-client"
                className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black transition hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", boxShadow: "0 4px 20px rgba(201,165,90,0.4)" }}
              >
                Accéder à l&apos;espace <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §3 · DIGITAL — fond sombre
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(124,111,205,0.06)] blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(124,111,205,0.3)] bg-[rgba(124,111,205,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7c6fcd]">
              <Code2 size={9} /> Développement Digital
            </span>
            <h2 className="display-section text-white">
              Sites, apps et{" "}
              <span className="text-[#7c6fcd]">automatisations.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
              Des solutions digitales sur mesure, développées rapidement et livrées clés en main.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {DIGITAL.map(({ href, icon: Icon, color, rgb, title, price, desc, details }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] transition-all hover:border-white/[0.13] hover:bg-white/[0.05]"
              >
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg, rgb(${rgb}), transparent)` }} />
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                      style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}
                    >
                      <Icon size={22} style={{ color }} />
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[0.65rem] font-black tabular-nums"
                      style={{ color, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)` }}
                    >
                      {price}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-extrabold text-white">{title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-white/50">{desc}</p>
                  <div className="mb-5 grid grid-cols-2 gap-y-1.5">
                    {details.map(d => (
                      <span key={d} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={10} style={{ color }} /> {d}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
                    style={{ color }}
                  >
                    En savoir plus <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §4 · CRÉATION DE CONTENU — fond blanc
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(220,80,120,0.3)] bg-[rgba(220,80,120,0.06)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#dc5078]">
              <Sparkles size={9} /> Création de Contenu
            </span>
            <h2 className="display-section text-[#09090b]">
              Visuels, vidéos et{" "}
              <span className="text-[#dc5078]">identité visuelle.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#6b7280]">
              Des créations professionnelles pour tous vos supports — réseaux, publicité, web.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CREATION.map(({ href, icon: Icon, color, rgb, title, price, desc, details }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                    style={{ background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.18)` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[0.65rem] font-black tabular-nums"
                    style={{ color, background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.2)` }}
                  >
                    {price}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-extrabold text-[#09090b]">{title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-[#6b7280]">{desc}</p>
                <div className="mb-5 grid grid-cols-2 gap-y-1.5">
                  {details.map(d => (
                    <span key={d} className="flex items-center gap-1.5 text-xs text-[#4b5563]">
                      <CheckCircle2 size={10} style={{ color }} /> {d}
                    </span>
                  ))}
                </div>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ color }}
                >
                  En savoir plus <ArrowRight size={13} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §5 · CTA FINAL — fond sombre
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(201,165,90,0.07)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.55, ease }}
          className="relative z-10 mx-auto max-w-lg px-4 text-center sm:px-6"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-xs font-bold text-[#f9a826]">
            <Zap size={11} /> Démarrez dès aujourd&apos;hui
          </span>
          <h2 className="display-section mb-4 text-white">
            Prêt à{" "}
            <span className="text-[#c9a55a]">passer à l&apos;action ?</span>
          </h2>
          <p className="mb-8 text-sm text-white/40">
            Essayez l&apos;espace client ou réservez un appel conseil gratuit de 30 minutes.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/espace-client"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", boxShadow: "0 4px 20px rgba(201,165,90,0.4)" }}
            >
              Espace Client — 11,90€/mois <ArrowRight size={14} />
            </Link>
            <Link
              href="/reserver-appel"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/[0.2] hover:bg-white/[0.08]"
            >
              Appel gratuit <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.68rem] text-white/25">
            <span className="flex items-center gap-1.5"><Shield size={9} className="text-[#c9a55a]" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><Zap size={9} className="text-[#c9a55a]" /> Accès immédiat</span>
            <span className="flex items-center gap-1.5"><Star size={9} className="text-[#c9a55a]" /> Tous les outils inclus</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
