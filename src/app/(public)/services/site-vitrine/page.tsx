"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Globe, Search, Smartphone, Shield, TrendingUp, Star,
  Briefcase, ShoppingBag, Users, Building2, Code2, Palette,
  MessageSquare, Zap, Clock, ArrowLeft, CheckSquare,
  BarChart3, Lock, Wifi, HeartHandshake, BadgeCheck,
  Layers, Pencil, Rocket, Eye,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#4ade80";
const ACCENT_RGB = "74,222,128";

/* ─── DATA ─────────────────────────────────────────────── */

const STATS = [
  { value: "10j",   label: "Délai moyen livraison", color: ACCENT_RGB },
  { value: "+60%",  label: "Contacts entrants",      color: "96,165,250" },
  { value: "100%",  label: "Responsive garanti",     color: "249,168,38" },
  { value: "Top 3", label: "Google en 2 mois",       color: "244,114,182" },
];

const CE_QUE_VOUS_OBTENEZ = [
  { icon: Palette,      color: "#4ade80", rgb: "74,222,128",   title: "Design sur mesure",         desc: "Maquette validée avec vous avant développement. Couleurs, typographie, ambiance — 100% unique." },
  { icon: Smartphone,   color: "#60a5fa", rgb: "96,165,250",   title: "Responsive mobile-first",   desc: "Parfait sur iPhone, Android, tablette et desktop. Testé sur tous les appareils." },
  { icon: Search,       color: "#f9a826", rgb: "249,168,38",   title: "SEO de base inclus",        desc: "Balises méta, H1-H6, sitemap.xml, robots.txt — les fondations pour être trouvé sur Google." },
  { icon: MessageSquare,color: "#f472b6", rgb: "244,114,182",  title: "Formulaire de contact",     desc: "Formulaire anti-spam avec notifications email. Aucune demande client ne passe inaperçue." },
  { icon: Lock,         color: "#a78bfa", rgb: "167,139,250",  title: "SSL + sécurité",            desc: "HTTPS, certificat SSL, protection des données — conforme RGPD, mentions légales incluses." },
  { icon: HeartHandshake,color:"#34d399", rgb: "52,211,153",   title: "Formation & support",       desc: "On vous forme à gérer votre contenu. Disponibles après livraison pour toute question." },
];

const POUR_QUI = [
  { icon: Briefcase,   color: "#60a5fa", rgb: "96,165,250",  who: "Entrepreneurs",              desc: "Lancez votre activité avec une vitrine crédible qui rassure vos premiers clients.",       tags: ["Lancement", "Crédibilité"] },
  { icon: ShoppingBag, color: ACCENT,    rgb: ACCENT_RGB,    who: "Commerces & restaurants",    desc: "Présentez vos services, horaires, localisation et menu — simple et efficace.",             tags: ["Horaires", "Réservation"] },
  { icon: Star,        color: "#f9a826", rgb: "249,168,38",  who: "Freelances & artisans",      desc: "Montrez votre portfolio, vos tarifs et captez des leads qualifiés en continu.",           tags: ["Portfolio", "Devis"] },
  { icon: Building2,   color: "#f472b6", rgb: "244,114,182", who: "Professions libérales",      desc: "Médecins, avocats, experts-comptables — une présence sobre et professionnelle.",          tags: ["Confiance", "RGPD"] },
  { icon: Users,       color: "#a78bfa", rgb: "167,139,250", who: "Associations & marques",     desc: "Présentez votre mission, votre équipe et vos actions dans un site clair.",               tags: ["Mission", "Équipe"] },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90", title: "Échange & brief",    desc: "On analyse votre activité, vos concurrents et vos attentes pour le site." },
  { num: "02", icon: Palette,       color: "#60a5fa", rgb: "96,165,250", title: "Maquette & design",  desc: "Maquette complète soumise pour validation — aucun développement sans votre accord." },
  { num: "03", icon: Code2,         color: ACCENT,    rgb: ACCENT_RGB,   title: "Développement",      desc: "Code propre, performant, testé sur mobile, tablette et desktop." },
  { num: "04", icon: Rocket,        color: "#4ade80", rgb: "74,222,128", title: "Mise en ligne",      desc: "Déploiement sur votre domaine, SSL, formation CMS et suivi post-lancement." },
];

const INCLUS = [
  { label: "Design professionnel sur mesure",   ok: true },
  { label: "Responsive mobile & desktop",        ok: true },
  { label: "SEO de base (métas, sitemap…)",      ok: true },
  { label: "Formulaire de contact fonctionnel",  ok: true },
  { label: "Certificat SSL + HTTPS",             ok: true },
  { label: "Mentions légales + RGPD",            ok: true },
  { label: "Formation à la gestion du contenu",  ok: true },
  { label: "Support post-livraison",             ok: true },
];

const NON_INCLUS = [
  { label: "Nom de domaine (env. 15€/an)",      ok: false },
  { label: "Hébergement (env. 5–15€/mois)",     ok: false },
  { label: "Rédaction des textes",              ok: false },
  { label: "Photos/visuels professionnels",     ok: false },
];

const OFFRES = [
  {
    nom: "Essentiel",
    prix: "490",
    sous: "Site 1 à 3 pages",
    couleur: ACCENT_RGB,
    accent: ACCENT,
    features: [
      "Design unique sur mesure",
      "Responsive mobile-first",
      "Formulaire de contact",
      "SEO de base",
      "SSL + HTTPS",
      "Livraison en 1–2 semaines",
    ],
    popular: false,
  },
  {
    nom: "Professionnel",
    prix: "890",
    sous: "Site 4 à 6 pages",
    couleur: "129,140,248",
    accent: "#818cf8",
    features: [
      "Tout de l'offre Essentiel",
      "Jusqu'à 6 pages",
      "Blog ou actualités",
      "Intégration WhatsApp",
      "Google Analytics",
      "Livraison en 2–3 semaines",
    ],
    popular: true,
  },
  {
    nom: "Premium",
    prix: "Sur devis",
    sous: "Site 7+ pages ou complexe",
    couleur: "249,168,38",
    accent: "#f9a826",
    features: [
      "Tout de l'offre Professionnel",
      "Pages illimitées",
      "Animations avancées",
      "Espace client / portail",
      "Maintenance mensuelle",
      "Délai selon cahier des charges",
    ],
    popular: false,
  },
];

const EXEMPLES = [
  {
    icon: Briefcase,
    color: "#4ade80", rgb: "74,222,128",
    titre: "Cabinet d'avocat",
    desc: "5 pages sobres avec prise de RDV intégrée, formulaire de premier contact et FAQ juridique.",
    resultat: "+60% de contacts entrants",
    bars: [30, 55, 80, 95, 100],
  },
  {
    icon: ShoppingBag,
    color: "#60a5fa", rgb: "96,165,250",
    titre: "Artisan électricien",
    desc: "Site local avec galerie de réalisations, zones d'intervention et devis en ligne rapide.",
    resultat: "Top 3 Google en 2 mois",
    bars: [20, 45, 68, 85, 100],
  },
  {
    icon: Star,
    color: "#f9a826", rgb: "249,168,38",
    titre: "Coach sportif freelance",
    desc: "Portfolio programmes, tarifs, témoignages et calendrier de réservation pour séances.",
    resultat: "Agenda complet en 3 mois",
    bars: [25, 50, 70, 88, 100],
  },
];

const TEMOIGNAGES = [
  { initial: "M", color: ACCENT_RGB,    name: "Marie L.",   role: "Sophrologue",       stars: 5, avis: "DJAMA a créé mon site en 10 jours. Résultat bluffant. J'ai eu mes 3 premiers contacts en moins d'une semaine après la mise en ligne." },
  { initial: "T", color: "96,165,250",  name: "Thomas B.",  role: "Artisan menuisier", stars: 5, avis: "Je n'y connaissais rien au web. L'équipe a tout géré, m'a expliqué chaque étape et livré un site que mes clients adorent. Vraiment top." },
  { initial: "C", color: "249,168,38",  name: "Camille D.", role: "Coach business",    stars: 5, avis: "Site clean, rapide et bien positionné sur Google en quelques semaines. Exactement ce que je voulais. Je recommande sans hésiter." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps pour livrer mon site ?",         a: "Entre 1 et 4 semaines selon le nombre de pages et votre disponibilité pour les retours. Un mini-site 3 pages peut être livré en 7 jours." },
  { q: "Puis-je modifier le contenu moi-même ?",          a: "Oui. Nous intégrons un CMS simple (Sanity ou Notion) si vous souhaitez modifier textes et images sans nous contacter." },
  { q: "Le nom de domaine est-il inclus ?",               a: "Le domaine et l'hébergement sont à votre charge (environ 15–30€/an). On vous guide pour les commander et on s'occupe de la configuration." },
  { q: "Mon site sera-t-il bien référencé sur Google ?",  a: "Nous appliquons les bonnes pratiques SEO de base. Pour un référencement avancé, nous proposons un accompagnement SEO dédié." },
  { q: "Puis-je demander des modifications après livraison ?", a: "Oui. Nous incluons 2 semaines de support post-livraison avec corrections mineures. Des contrats de maintenance mensuelle sont également disponibles." },
  { q: "Acceptez-vous de petits budgets ?",               a: "Notre offre Essentiel démarre à 490€. Pour des besoins plus simples, contactez-nous — on trouve toujours une solution adaptée." },
];

export default function SiteVitrinePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="bg-[#07070a] overflow-x-hidden">

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section className="relative min-h-0 sm:min-h-[90vh] flex items-center overflow-hidden">

          {/* Backgrounds */}
          <div className="pointer-events-none absolute inset-0">
            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.025]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "55px 55px" }} />
            {/* Glow vert gauche */}
            <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.07, 0.12, 0.07] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-32 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px]"
              style={{ background: `radial-gradient(circle, rgba(${ACCENT_RGB},1) 0%, transparent 70%)` }} />
            {/* Glow bleu droite */}
            <div className="absolute right-0 top-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.05]"
              style={{ background: "radial-gradient(circle, rgba(96,165,250,1) 0%, transparent 70%)" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 w-full py-20 sm:py-24 lg:py-0">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* LEFT */}
              <div>
                <motion.div {...fadeIn} className="mb-6">
                  <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={12} /> Tous les services
                  </Link>
                </motion.div>

                <motion.div {...fadeIn} transition={{ delay: 0.06 }}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold"
                  style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.07)`, color: ACCENT }}>
                  <Monitor size={12} /> Site vitrine professionnel
                </motion.div>

                <h1 className="mb-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight text-white">
                  <MultiLineReveal
                    lines={["Votre site vitrine", "professionnel,", "livré en 10 jours"]}
                    highlight={2} stagger={0.12} wordStagger={0.055} delay={0.08}
                    lineClassName="justify-start"
                  />
                </h1>

                <FadeReveal delay={0.28}>
                  <p className="mb-8 max-w-lg text-base sm:text-lg leading-relaxed text-white/55">
                    Design sur mesure, responsive, SEO optimisé et formulaire de contact — tout ce qu'il faut pour convertir vos visiteurs en clients.
                  </p>
                </FadeReveal>

                <FadeReveal delay={0.36}>
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Link href="/contact?besoin=Création+de+site+web"
                      className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.03] active:scale-[0.98]"
                      style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.9) 0%, rgba(52,211,153,0.8) 100%)`, color: "#07070a" }}>
                      Créer mon site vitrine <ArrowRight size={15} />
                    </Link>
                    <a href="#exemples"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.08] hover:text-white hover:border-white/20">
                      Voir des exemples
                    </a>
                  </div>
                </FadeReveal>

                <FadeReveal delay={0.44}>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { emoji: "⚡", label: "Livraison en 10 jours" },
                      { emoji: "📈", label: "SEO optimisé" },
                      { emoji: "📱", label: "Mobile first" },
                      { emoji: "🔒", label: "SSL inclus" },
                    ].map(({ emoji, label }) => (
                      <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
                        {emoji} {label}
                      </span>
                    ))}
                  </div>
                </FadeReveal>
              </div>

              {/* RIGHT — browser mockup */}
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.75, ease, delay: 0.3 }}
                className="relative hidden lg:block"
              >
                {/* glow behind */}
                <div className="pointer-events-none absolute -inset-8 rounded-3xl blur-3xl opacity-30"
                  style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, rgba(96,165,250,0.2) 50%, transparent 70%)` }} />

                {/* Browser window */}
                <div className="relative overflow-hidden rounded-[20px] border border-white/[0.11] shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
                  style={{ background: "#0d0d0f" }}>

                  {/* Browser bar */}
                  <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3" style={{ background: "#111115" }}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                      <span className="flex-1 text-[0.6rem] text-white/30">www.votre-site.fr</span>
                      <Globe size={9} className="text-white/20" />
                    </div>
                  </div>

                  {/* Site nav */}
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3" style={{ background: "#0a0a0c" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md" style={{ background: `rgba(${ACCENT_RGB},0.25)` }} />
                      <div className="h-2 w-16 rounded-full bg-white/20" />
                    </div>
                    <div className="flex items-center gap-3">
                      {[40, 50, 45].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-white/15" style={{ width: w }} />)}
                    </div>
                    <div className="h-6 w-16 rounded-full" style={{ background: `rgba(${ACCENT_RGB},0.2)` }} />
                  </div>

                  {/* Hero block */}
                  <div className="px-5 py-6" style={{ background: "linear-gradient(135deg, #0e160f 0%, #0a1214 100%)" }}>
                    <motion.div animate={{ width: ["30%", "45%", "30%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-2 h-2 rounded-full" style={{ background: `rgba(${ACCENT_RGB},0.4)` }} />
                    <div className="mb-1.5 h-4 w-3/4 rounded-full bg-white/50" />
                    <div className="mb-4 h-4 w-1/2 rounded-full bg-white/25" />
                    <div className="space-y-1.5 mb-5">
                      <div className="h-2 w-full rounded-full bg-white/10" />
                      <div className="h-2 w-4/5 rounded-full bg-white/10" />
                      <div className="h-2 w-3/5 rounded-full bg-white/08" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-24 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.4)` }} />
                      <div className="h-7 w-20 rounded-xl border border-white/10" />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 p-3" style={{ background: "#0b0b0d" }}>
                    {[
                      { v: "247", l: "Visiteurs", c: ACCENT_RGB },
                      { v: "4.9", l: "Note Google", c: "249,168,38" },
                      { v: "38", l: "Contacts", c: "96,165,250" },
                    ].map(({ v, l, c }) => (
                      <div key={l} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "#111115" }}>
                        <p className="text-base font-bold mb-0.5" style={{ color: `rgba(${c},0.9)` }}>{v}</p>
                        <p className="text-[0.55rem] text-white/35">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cards services */}
                  <div className="grid grid-cols-3 gap-2 px-3 pb-3" style={{ background: "#0b0b0d" }}>
                    {[
                      { c: ACCENT_RGB }, { c: "96,165,250" }, { c: "244,114,182" }
                    ].map(({ c }, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.07] p-3" style={{ background: "#0e0e11" }}>
                        <div className="mb-2 w-6 h-6 rounded-lg" style={{ background: `rgba(${c},0.15)` }} />
                        <div className="mb-1 h-1.5 w-full rounded-full bg-white/20" />
                        <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3" style={{ background: "#090909" }}>
                    <div className="h-1.5 w-20 rounded-full bg-white/10" />
                    <div className="flex gap-2">
                      {[0,1,2].map(i => <div key={i} className="w-5 h-5 rounded-full bg-white/[0.07]" />)}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 }}
                  className="absolute -right-4 top-14 rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl"
                  style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <Search size={13} style={{ color: ACCENT }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">SEO optimisé</p>
                      <p className="text-[0.52rem] text-white/35">Top 3 Google</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
                  className="absolute -left-4 bottom-20 rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl"
                  style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <Smartphone size={13} style={{ color: "#60a5fa" }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">Mobile first</p>
                      <p className="text-[0.52rem] text-white/35">100% responsive</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-3 right-12 rounded-2xl border border-[rgba(74,222,128,0.2)] px-3.5 py-2.5"
                  style={{ background: "rgba(74,222,128,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    <p className="text-[0.6rem] font-semibold text-[#4ade80]">Livraison en 10 jours</p>
                  </div>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            STATS
        ══════════════════════════════════════════ */}
        <section className="py-8 sm:py-12 px-6 border-y border-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <motion.div key={s.label} variants={cardReveal} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold mb-1" style={{ color: `rgba(${s.color},0.9)` }}>{s.value}</p>
                  <p className="text-xs text-white/45 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CE QUE VOUS OBTENEZ
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <Sparkles size={13} style={{ color: ACCENT }} /> Ce qui est inclus
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ce que vous obtenez avec<br /><span style={{ color: ACCENT }}>chaque site vitrine</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto text-base">
                Pas de template générique. Chaque site est conçu de A à Z pour votre activité.
              </motion.p>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CE_QUE_VOUS_OBTENEZ.map((item) => (
                <motion.div key={item.title} variants={cardReveal}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.14] hover:bg-white/[0.055] transition-all duration-300 cursor-default">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `rgba(${item.rgb},0.12)` }}>
                    <item.icon size={22} style={{ color: item.color }} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            PROCESSUS 4 ÉTAPES
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full opacity-10"
              style={{ background: `linear-gradient(to bottom, transparent, rgba(${ACCENT_RGB},1), transparent)` }} />
          </div>
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <Zap size={13} style={{ color: ACCENT }} /> Notre processus
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                De l'idée à la mise en ligne<br /><span style={{ color: ACCENT }}>en 4 étapes</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto">
                Un processus rodé pour livrer vite, sans surprise et avec un résultat que vous aimez vraiment.
              </motion.p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ETAPES.map((e, i) => (
                <motion.div key={e.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease }}
                  className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.12] transition-all duration-300">
                  {/* number */}
                  <div className="text-[2.5rem] font-black leading-none mb-4 select-none"
                    style={{ color: `rgba(${e.rgb},0.15)`, fontVariantNumeric: "tabular-nums" }}>
                    {e.num}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `rgba(${e.rgb},0.12)` }}>
                    <e.icon size={19} style={{ color: e.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{e.title}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{e.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            POUR QUI
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <Users size={13} style={{ color: ACCENT }} /> Pour qui ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Un site vitrine pour <span style={{ color: ACCENT }}>tout type d'activité</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
                Que vous soyez entrepreneur, artisan ou professionnel libéral — on a l'habitude de votre secteur.
              </motion.p>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {POUR_QUI.map((p) => (
                <motion.div key={p.who} variants={cardReveal}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.13] hover:bg-white/[0.05] transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `rgba(${p.rgb},0.12)` }}>
                    <p.icon size={19} style={{ color: p.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{p.who}</h3>
                  <p className="text-sm text-white/50 mb-4 leading-relaxed">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map(t => (
                      <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-white/55">{t}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            INCLUS / NON INCLUS
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6" style={{ background: "rgba(255,255,255,0.012)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <CheckSquare size={13} style={{ color: ACCENT }} /> Transparence totale
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ce qui est <span style={{ color: ACCENT }}>inclus</span> — et ce qui ne l'est pas
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto">
                Aucune mauvaise surprise. On vous dit exactement ce que comprend chaque projet.
              </motion.p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* INCLUS */}
              <motion.div {...fadeIn} viewport={viewport}
                className="rounded-3xl border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.04)] p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `rgba(${ACCENT_RGB},0.15)` }}>
                    <CheckCircle2 size={18} style={{ color: ACCENT }} />
                  </div>
                  <h3 className="font-bold text-white text-base">Inclus dans tous nos sites</h3>
                </div>
                <div className="space-y-3">
                  {INCLUS.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <CheckCircle2 size={15} style={{ color: ACCENT }} className="shrink-0" />
                      <span className="text-sm text-white/80">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* NON INCLUS */}
              <motion.div {...fadeIn} viewport={viewport} transition={{ delay: 0.1 }}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.07]">
                    <Layers size={18} className="text-white/50" />
                  </div>
                  <h3 className="font-bold text-white/70 text-base">En option / à votre charge</h3>
                </div>
                <div className="space-y-3">
                  {NON_INCLUS.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                      <span className="text-sm text-white/50">{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-white/30 leading-relaxed">
                  On vous guide pour tout configurer — aucune compétence technique requise.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TARIFS
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <BadgeCheck size={13} style={{ color: ACCENT }} /> Tarifs clairs
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                À partir de <span style={{ color: ACCENT }}>490€</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
                Pas d'abonnement caché. Un tarif fixe, validé avec vous avant le début du projet.
              </motion.p>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-5">
              {OFFRES.map((o, i) => (
                <motion.div key={o.nom} variants={cardReveal}
                  className={`relative rounded-3xl border p-7 flex flex-col transition-all duration-300 ${o.popular ? "border-white/20 scale-[1.03]" : "border-white/[0.07]"}`}
                  style={{ background: o.popular ? `rgba(${o.couleur},0.06)` : "rgba(255,255,255,0.025)" }}>
                  {o.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[0.65rem] font-bold text-[#07070a]"
                      style={{ background: `rgba(${o.couleur},1)` }}>
                      LE PLUS POPULAIRE
                    </div>
                  )}

                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: o.accent }}>{o.nom}</p>
                    <p className="text-3xl font-extrabold text-white mb-1">
                      {o.prix === "Sur devis" ? <span className="text-2xl">Sur devis</span> : <>{o.prix}<span className="text-lg font-normal text-white/50">€</span></>}
                    </p>
                    <p className="text-xs text-white/40">{o.sous}</p>
                  </div>

                  <div className="space-y-3 mb-8 flex-1">
                    {o.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle2 size={14} style={{ color: o.accent }} className="shrink-0" />
                        <span className="text-sm text-white/70">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/contact?besoin=Création+de+site+web"
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-90 ${o.popular ? "text-[#07070a]" : "text-white border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.09]"}`}
                    style={o.popular ? { background: `rgba(${o.couleur},1)` } : {}}>
                    Démarrer <ArrowRight size={14} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.p {...fadeIn} viewport={viewport} className="text-center text-xs text-white/30 mt-8">
              Tous les tarifs sont HT · Acompte de 50% à la commande · Solde à la livraison
            </motion.p>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            EXEMPLES
        ══════════════════════════════════════════ */}
        <section id="exemples" className="py-12 sm:py-24 px-6" style={{ background: "rgba(255,255,255,0.012)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <Eye size={13} style={{ color: ACCENT }} /> Exemples concrets
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Des résultats <span style={{ color: ACCENT }}>mesurables</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto">
                Quelques exemples de sites réalisés — et ce qu'ils ont apporté concrètement.
              </motion.p>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-6">
              {EXEMPLES.map((ex) => (
                <motion.div key={ex.titre} variants={cardReveal}
                  className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col">
                  {/* mini chart */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: `rgba(${ex.rgb},0.9)` }} />
                      <div className="h-1.5 w-20 rounded-full" style={{ background: `rgba(${ex.rgb},0.2)` }} />
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                      {ex.bars.map((h, i) => (
                        <motion.div key={i}
                          initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                          transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease }}
                          className="flex-1 rounded-t"
                          style={{ background: `rgba(${ex.rgb},${0.3 + i * 0.12})` }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${ex.rgb},0.12)` }}>
                      <ex.icon size={18} style={{ color: ex.color }} />
                    </div>
                    <h3 className="font-bold text-white">{ex.titre}</h3>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed mb-4 flex-1">{ex.desc}</p>
                  <div className="flex items-center gap-2 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/[0.07] px-3 py-2">
                    <TrendingUp size={13} className="text-[#4ade80] shrink-0" />
                    <span className="text-xs font-semibold text-[#4ade80]">{ex.resultat}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TÉMOIGNAGES
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-8 sm:mb-16">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <Star size={13} style={{ color: "#f9a826" }} /> Avis clients
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ce que disent <span style={{ color: ACCENT }}>nos clients</span>
              </motion.h2>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="grid md:grid-cols-3 gap-6">
              {TEMOIGNAGES.map((t) => (
                <motion.div key={t.name} variants={cardReveal}
                  className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-7 flex flex-col gap-5">
                  <div className="flex gap-1">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} fill="#f9a826" stroke="none" />
                    ))}
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed flex-1 italic">"{t.avis}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#07070a] shrink-0"
                      style={{ background: `rgba(${t.color},0.9)` }}>
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6" style={{ background: "rgba(255,255,255,0.012)" }}>
          <div className="max-w-3xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-6">
                <MessageSquare size={13} style={{ color: ACCENT }} /> Questions fréquentes
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Vous avez des <span style={{ color: ACCENT }}>questions ?</span>
              </motion.h2>
            </motion.div>

            <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <motion.div key={i} variants={cardReveal}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.03] transition-colors">
                    <span className="text-sm font-semibold text-white/90">{item.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
                      <ChevronDown size={15} className="text-white/40" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <p className="px-6 pb-5 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-4">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CTA FINAL
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-24 px-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px]"
              style={{ background: `radial-gradient(circle, rgba(${ACCENT_RGB},1) 0%, transparent 70%)` }} />
          </div>

          <div className="max-w-4xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport}
              className="relative rounded-3xl border border-white/[0.1] p-10 sm:p-14 text-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.05) 0%, rgba(96,165,250,0.04) 50%, transparent 100%)` }}>

              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/60 mb-8">
                <Rocket size={13} style={{ color: ACCENT }} /> Prêt à démarrer ?
              </motion.div>

              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
                Votre site vitrine,<br /><span style={{ color: ACCENT }}>livré en 10 jours</span>
              </motion.h2>

              <motion.p variants={fadeIn} className="text-white/50 text-base sm:text-lg max-w-xl mx-auto mb-10">
                Design sur mesure, responsive, SEO-ready — à partir de 490€. Devis gratuit et sans engagement.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 mb-10">
                <Link href="/contact?besoin=Création+de+site+web"
                  className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] shadow-xl"
                  style={{ background: `linear-gradient(135deg, rgba(${ACCENT_RGB},0.95), rgba(52,211,153,0.85))`, color: "#07070a" }}>
                  Créer mon site vitrine <ArrowRight size={16} />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.05] px-8 py-4 text-sm font-semibold text-white/75 transition-all hover:bg-white/[0.09] hover:text-white">
                  Poser une question
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-6">
                {[
                  { icon: Clock,        label: "Réponse sous 24h"  },
                  { icon: Shield,       label: "Sans engagement"    },
                  { icon: BadgeCheck,   label: "Devis gratuit"      },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-white/35">
                    <Icon size={12} style={{ color: ACCENT }} />
                    {label}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
