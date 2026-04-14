"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, ArrowRight, CheckCircle2, Sparkles, ChevronDown, Globe,
  Search, Smartphone, Shield, TrendingUp, Star, Briefcase, ShoppingBag,
  Users, Building2, Code2, Palette, MessageSquare, Zap, Clock, ArrowLeft,
  BadgeCheck, Rocket, HeartHandshake, Layers, Lock,
  Phone, FileText, LayoutDashboard, HelpCircle, Image,
  Wrench, CheckSquare, CircleCheck, Eye,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease = [0.16, 1, 0.3, 1] as const;
const A  = "#4ade80";
const AR = "74,222,128";

/* ═══════════════════════════════════════ DATA ═══════════════════════════════════════ */

const POURQUOI_VITRINE = [
  { icon: BadgeCheck,    c: "#4ade80", r: "74,222,128",   t: "Image professionnelle",  d: "Un site soigné inspire confiance en quelques secondes. Vos prospects vous jugent avant même de vous appeler." },
  { icon: Search,        c: "#60a5fa", r: "96,165,250",   t: "Visible sur Google",     d: "Avec le bon SEO de base, vos futurs clients vous trouvent sur Google — sans payer de publicité." },
  { icon: MessageSquare, c: "#f9a826", r: "249,168,38",   t: "Recevez des demandes",   d: "Formulaire, WhatsApp intégré, appel direct — vos prospects peuvent vous joindre en un clic." },
  { icon: Layers,        c: "#f472b6", r: "244,114,182",  t: "Présentez vos services", d: "Photos, tarifs, références, réalisations — tout pour convaincre avant le premier échange." },
  { icon: Globe,         c: "#a78bfa", r: "167,139,250",  t: "Présent 24h/24",         d: "Votre site travaille pour vous même la nuit. Un visiteur à 23h peut devenir client le lendemain." },
  { icon: TrendingUp,    c: "#34d399", r: "52,211,153",   t: "Avantage concurrentiel", d: "La majorité de vos concurrents ont déjà un site. Ne pas en avoir, c'est leur laisser le terrain." },
];

const INCLUS = [
  { icon: Palette,       c: "#4ade80", r: "74,222,128",  t: "Design sur mesure",       d: "Maquette validée avec vous. Couleurs, typo, ambiance — rien de générique." },
  { icon: Smartphone,    c: "#60a5fa", r: "96,165,250",  t: "Responsive mobile",       d: "Parfait sur iPhone, Android, tablette et desktop. Testé partout." },
  { icon: MessageSquare, c: "#f9a826", r: "249,168,38",  t: "Formulaire de contact",   d: "Anti-spam, notifications email. Aucune demande ne passe inaperçue." },
  { icon: Phone,         c: "#f472b6", r: "244,114,182", t: "WhatsApp intégré",        d: "Bouton flottant ou CTA WhatsApp direct — vos clients chattent en un tap." },
  { icon: Search,        c: "#a78bfa", r: "167,139,250", t: "SEO de base",             d: "Métas, titres H1-H6, sitemap.xml — les fondations pour Google." },
  { icon: Lock,          c: "#34d399", r: "52,211,153",  t: "SSL + HTTPS",             d: "Certificat SSL, conformité RGPD, mentions légales incluses." },
  { icon: Zap,           c: "#fb923c", r: "251,146,60",  t: "Site rapide",             d: "Code optimisé, images compressées, chargement < 2 secondes." },
  { icon: Globe,         c: "#e879f9", r: "232,121,249", t: "Mise en ligne",           d: "Configuration domaine, hébergement, déploiement — clé en main." },
  { icon: HeartHandshake,c: "#4ade80", r: "74,222,128",  t: "Support post-livraison",  d: "2 semaines de support incluses. Maintenance mensuelle disponible." },
];

const METHODE = [
  { n: "01", icon: MessageSquare, c: "#c9a55a", r: "201,165,90", t: "Échange",       d: "On parle de votre activité, vos clients cibles et vos attentes." },
  { n: "02", icon: Palette,       c: "#60a5fa", r: "96,165,250", t: "Maquette",      d: "Design complet soumis pour validation. Aucun dev sans votre accord." },
  { n: "03", icon: Code2,         c: A,         r: AR,           t: "Développement", d: "Code propre, rapide, testé sur tous les appareils." },
  { n: "04", icon: Eye,           c: "#f472b6", r: "244,114,182",t: "Corrections",   d: "Vous testez, on ajuste. Jusqu'à satisfaction complète." },
  { n: "05", icon: Rocket,        c: "#f9a826", r: "249,168,38", t: "Mise en ligne", d: "Publication sur votre domaine + formation CMS incluse." },
];

const PAGES_POSSIBLES = [
  { icon: LayoutDashboard, c: "#4ade80", r: "74,222,128",  t: "Accueil",      d: "Présentation percutante et CTA visible." },
  { icon: Users,           c: "#60a5fa", r: "96,165,250",  t: "À propos",     d: "Votre histoire, vos valeurs, votre équipe." },
  { icon: Layers,          c: "#f9a826", r: "249,168,38",  t: "Services",     d: "Détail de vos offres et tarifs." },
  { icon: Image,           c: "#f472b6", r: "244,114,182", t: "Réalisations", d: "Portfolio, galerie, études de cas." },
  { icon: MessageSquare,   c: "#a78bfa", r: "167,139,250", t: "Contact",      d: "Formulaire, carte, coordonnées." },
  { icon: HelpCircle,      c: "#34d399", r: "52,211,153",  t: "FAQ",          d: "Réponses aux questions fréquentes." },
];

const POUR_QUI = [
  { icon: Briefcase,   c: "#60a5fa", r: "96,165,250",  t: "Entrepreneurs",         d: "Lancez votre activité avec une vitrine crédible." },
  { icon: Wrench,      c: A,         r: AR,            t: "Artisans",              d: "Galerie, devis en ligne, zones d'intervention." },
  { icon: ShoppingBag, c: "#f9a826", r: "249,168,38",  t: "Commerces locaux",      d: "Horaires, menu, localisation, réservation." },
  { icon: Users,       c: "#f472b6", r: "244,114,182", t: "Associations",          d: "Mission, équipe, adhérents, actualités." },
  { icon: Building2,   c: "#a78bfa", r: "167,139,250", t: "Professions libérales", d: "Image sobre, prise de RDV, formulaire." },
  { icon: Star,        c: "#34d399", r: "52,211,153",  t: "Freelances",            d: "Portfolio, tarifs, témoignages clients." },
];

const POURQUOI_DJAMA = [
  { icon: HeartHandshake, c: "#4ade80", r: "74,222,128",  t: "Accompagnement humain",     d: "Un interlocuteur unique du brief à la livraison. Réponse sous 24h." },
  { icon: Palette,        c: "#60a5fa", r: "96,165,250",  t: "Design propre et moderne",  d: "Pas de template vendu 100 fois. Chaque site est unique." },
  { icon: Zap,            c: "#f9a826", r: "249,168,38",  t: "Sites rapides et légers",   d: "Code optimisé, sans page builder lourd. Vos visiteurs n'attendent pas." },
  { icon: Wrench,         c: "#f472b6", r: "244,114,182", t: "Adapté à votre métier",     d: "Artisan, médecin, e-commerçant — on parle votre langage." },
  { icon: TrendingUp,     c: "#a78bfa", r: "167,139,250", t: "Évolutif",                  d: "Nouvelles pages, blog, boutique, espace client — votre site grandit avec vous." },
  { icon: Shield,         c: "#34d399", r: "52,211,153",  t: "Support après livraison",   d: "On reste disponibles. Pas d'abandon une fois le projet terminé." },
];

const OFFRE_INCLUS = [
  "Design sur mesure validé avec vous",
  "Responsive mobile, tablette et desktop",
  "Formulaire de contact fonctionnel",
  "SEO de base (métas, H1-H6, sitemap)",
  "Certificat SSL + HTTPS",
  "Mentions légales + politique RGPD",
  "Formation à la gestion du contenu",
  "2 semaines de support post-livraison",
];

const OFFRE_OPTIONS = [
  "Blog ou espace actualités",
  "WhatsApp / live chat intégré",
  "Système de prise de RDV",
  "Boutique e-commerce",
  "Maintenance mensuelle",
  "Référencement SEO avancé",
];

const FAQ = [
  { q: "Combien de temps pour livrer mon site ?",             a: "Entre 1 et 3 semaines selon le nombre de pages. Un site 3 pages peut être livré en 7 jours si vous avez votre contenu prêt." },
  { q: "Le nom de domaine est-il inclus ?",                   a: "Le domaine (env. 15€/an) et l'hébergement sont généralement à votre charge. On vous guide pour tout configurer — aucune compétence technique requise." },
  { q: "Puis-je modifier le contenu moi-même ?",              a: "Oui. On intègre un CMS simple si vous souhaitez modifier vos textes et images sans faire appel à un développeur." },
  { q: "Mon site sera-t-il bien positionné sur Google ?",     a: "On applique les bonnes pratiques SEO de base incluses dans chaque site. Un accompagnement SEO avancé est disponible en option." },
  { q: "Combien coûte un site vitrine ?",                     a: "Notre offre démarre à 490€ tout inclus. Le tarif final dépend du nombre de pages et des fonctionnalités. Devis gratuit et sans engagement." },
];

const TEMOIGNAGES = [
  { i: "M", c: AR,          n: "Marie L.",   r: "Sophrologue",       s: 5, t: "Site créé en 10 jours, résultat bluffant. J'ai eu mes 3 premiers contacts en moins d'une semaine après la mise en ligne." },
  { i: "T", c: "96,165,250",n: "Thomas B.",  r: "Artisan menuisier", s: 5, t: "Je ne connaissais rien au web. L'équipe a tout géré, expliqué chaque étape et livré un site que mes clients adorent." },
  { i: "C", c: "249,168,38",n: "Camille D.", r: "Coach business",    s: 5, t: "Site clean, rapide et bien positionné sur Google en quelques semaines. Exactement ce que je voulais." },
];

/* ═══════════════════════════════════════ PAGE ═══════════════════════════════════════ */
export default function SiteVitrinePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="bg-[#07070a] text-white overflow-x-hidden">

        {/* ── 1. HERO ── */}
        <section className="relative overflow-hidden pt-20 pb-14 sm:pt-28 sm:pb-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-[0.025]"
              style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize:"52px 52px" }} />
            <motion.div animate={{ scale:[1,1.07,1], opacity:[.06,.1,.06] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
              className="absolute -left-40 top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[110px]"
              style={{ background:`radial-gradient(circle,rgba(${AR},1) 0%,transparent 70%)` }} />
            <div className="absolute right-0 top-0 w-[380px] h-[380px] rounded-full blur-[90px] opacity-[0.04]"
              style={{ background:"radial-gradient(circle,rgba(96,165,250,1) 0%,transparent 70%)" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-5">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

              {/* Texte gauche */}
              <div>
                <motion.div {...fadeIn} className="mb-5">
                  <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={11} /> Tous les services
                  </Link>
                </motion.div>

                <motion.div {...fadeIn} transition={{ delay:.06 }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[.72rem] font-semibold"
                  style={{ borderColor:`rgba(${AR},.3)`, background:`rgba(${AR},.07)`, color:A }}>
                  <Monitor size={11} /> Site vitrine professionnel
                </motion.div>

                <h1 className="mb-5 text-4xl sm:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.08] tracking-tight">
                  <MultiLineReveal lines={["Un site vitrine","qui convertit","vos visiteurs"]}
                    highlight={2} stagger={.12} wordStagger={.055} delay={.08} lineClassName="justify-start" />
                </h1>

                <FadeReveal delay={.26}>
                  <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/55">
                    Design sur mesure, responsive, SEO-ready et formulaire de contact — tout ce qu'il faut pour être crédible en ligne et générer des clients.
                  </p>
                </FadeReveal>

                <FadeReveal delay={.34}>
                  <div className="flex flex-wrap gap-3 mb-7">
                    <Link href="/contact?besoin=Création+de+site+web"
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition-all hover:opacity-90 hover:scale-[1.02]"
                      style={{ background:`linear-gradient(135deg,rgba(${AR},.92),rgba(52,211,153,.82))`, color:"#07070a" }}>
                      Créer mon site vitrine <ArrowRight size={15} />
                    </Link>
                    <a href="#tarifs"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                      Voir les tarifs
                    </a>
                  </div>
                </FadeReveal>

                <FadeReveal delay={.42}>
                  <div className="flex flex-wrap gap-2">
                    {[["⚡","Site rapide"],["📈","SEO optimisé"],["📱","Mobile first"],["🚀","Livré en 10j"]].map(([e,l]) => (
                      <span key={l} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[.72rem] font-medium text-white/60">
                        {e} {l}
                      </span>
                    ))}
                  </div>
                </FadeReveal>
              </div>

              {/* Mockup droite */}
              <motion.div initial={{ opacity:0, y:28, scale:.95 }} animate={{ opacity:1, y:0, scale:1 }}
                transition={{ duration:.7, ease, delay:.28 }} className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-3xl blur-3xl opacity-20"
                  style={{ background:`radial-gradient(ellipse,rgba(${AR},.5) 0%,rgba(96,165,250,.3) 50%,transparent 70%)` }} />
                {/* Browser */}
                <div className="relative overflow-hidden rounded-[18px] border border-white/[0.11] shadow-[0_32px_80px_rgba(0,0,0,.65)]" style={{ background:"#0d0d0f" }}>
                  <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4 py-2.5" style={{ background:"#111115" }}>
                    <div className="flex gap-1.5">
                      {["#ff5f57","#ffbd2e","#28c840"].map(bg => <div key={bg} className="w-2.5 h-2.5 rounded-full" style={{ background:bg }} />)}
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:A }} />
                      <span className="flex-1 text-[.58rem] text-white/30">www.votre-site.fr</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2" style={{ background:"#0a0a0c" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md" style={{ background:`rgba(${AR},.25)` }} />
                      <div className="h-1.5 w-14 rounded-full bg-white/20" />
                    </div>
                    <div className="flex gap-3">{[36,48,40].map((w,i) => <div key={i} className="h-1.5 rounded-full bg-white/15" style={{ width:w }} />)}</div>
                    <div className="h-5 w-14 rounded-full" style={{ background:`rgba(${AR},.22)` }} />
                  </div>
                  <div className="px-4 py-5" style={{ background:"linear-gradient(135deg,#0e160f 0%,#0a1214 100%)" }}>
                    <motion.div animate={{ width:["28%","44%","28%"] }} transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
                      className="mb-1.5 h-1.5 rounded-full" style={{ background:`rgba(${AR},.45)` }} />
                    <div className="mb-1 h-3.5 w-3/4 rounded-full bg-white/45" />
                    <div className="mb-3 h-3 w-1/2 rounded-full bg-white/22" />
                    <div className="space-y-1 mb-4">{[100,80,62].map((w,i) => <div key={i} className="h-1.5 rounded-full bg-white/10" style={{ width:`${w}%` }} />)}</div>
                    <div className="flex gap-2">
                      <div className="h-6 w-20 rounded-xl" style={{ background:`rgba(${AR},.38)` }} />
                      <div className="h-6 w-16 rounded-xl border border-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-2.5" style={{ background:"#0b0b0d" }}>
                    {[["247","Visites",AR],["4.9","Note","249,168,38"],["38","Leads","96,165,250"]].map(([v,l,c]) => (
                      <div key={l} className="rounded-xl border border-white/[0.06] p-2.5" style={{ background:"#111115" }}>
                        <p className="text-sm font-extrabold" style={{ color:`rgba(${c},.9)` }}>{v}</p>
                        <p className="text-[.52rem] text-white/35">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5" style={{ background:"#0b0b0d" }}>
                    {[AR,"96,165,250","244,114,182"].map((c,i) => (
                      <div key={i} className="rounded-xl border border-white/[0.06] p-2.5" style={{ background:"#0e0e11" }}>
                        <div className="mb-1.5 w-5 h-5 rounded-lg" style={{ background:`rgba(${c},.15)` }} />
                        <div className="mb-1 h-1 w-full rounded-full bg-white/18" />
                        <div className="h-1 w-2/3 rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.9 }}
                  className="absolute -right-3 top-12 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block" style={{ background:"#141418" }}>
                  <div className="flex items-center gap-2">
                    <Search size={12} style={{ color:A }} />
                    <div><p className="text-[.58rem] font-bold text-white">SEO optimisé</p><p className="text-[.52rem] text-white/35">Top 3 Google</p></div>
                  </div>
                </motion.div>
                <motion.div animate={{ y:[0,-5,0] }} transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
                  className="absolute -bottom-3 right-10 rounded-xl border border-[rgba(74,222,128,.2)] px-3 py-2" style={{ background:"rgba(74,222,128,.06)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    <p className="text-[.58rem] font-semibold text-[#4ade80]">Livré en 10 jours</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="border-y border-white/[0.05] py-6 px-5" style={{ background:"rgba(255,255,255,.013)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[["10j","Livraison moyenne",AR],["+ 60%","Contacts entrants","96,165,250"],["Top 3","Google en 2 mois","249,168,38"],["100%","Responsive garanti","244,114,182"]].map(([v,l,c]) => (
              <motion.div key={l} {...fadeIn} viewport={viewport} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold mb-0.5" style={{ color:`rgba(${c},.9)` }}>{v}</p>
                <p className="text-[.68rem] text-white/40 font-medium">{l}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 2. POURQUOI UN SITE VITRINE ── */}
        <section className="py-12 sm:py-20 px-5">
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <Sparkles size={12} style={{ color:A }} /> Pourquoi en avoir un ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                Pourquoi votre activité a besoin <span style={{ color:A }}>d'un site vitrine</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                En 2025, ne pas avoir de site, c'est laisser vos concurrents capter vos clients potentiels.
              </motion.p>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {POURQUOI_VITRINE.map(item => (
                <motion.div key={item.t} variants={cardReveal}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.13] hover:bg-white/[0.055] transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background:`rgba(${item.r},.12)` }}>
                    <item.icon size={19} style={{ color:item.c }} />
                  </div>
                  <h3 className="font-bold text-white mb-1.5 text-sm">{item.t}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{item.d}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 3. CE QU'ON INCLUT ── */}
        <section className="py-12 sm:py-20 px-5" style={{ background:"rgba(255,255,255,.012)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <CheckSquare size={12} style={{ color:A }} /> Ce qui est inclus
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                Tout ce qu'on <span style={{ color:A }}>inclut dans chaque site</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                Pas de surprise. Voici exactement ce que vous obtenez à chaque projet.
              </motion.p>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INCLUS.map(item => (
                <motion.div key={item.t} variants={cardReveal}
                  className="group flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] hover:bg-white/[0.055] transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background:`rgba(${item.r},.12)` }}>
                    <item.icon size={17} style={{ color:item.c }} />
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

        {/* ── 4. MÉTHODE ── */}
        <section className="py-12 sm:py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <Zap size={12} style={{ color:A }} /> Notre méthode
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                De l'idée au site en ligne <span style={{ color:A }}>en 5 étapes</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                Un processus clair, sans surprise, avec vous à chaque décision clé.
              </motion.p>
            </motion.div>
            {/* Desktop timeline */}
            <div className="hidden lg:flex items-start gap-0 relative mb-0">
              <div className="pointer-events-none absolute top-9 left-0 right-0 h-px"
                style={{ background:`linear-gradient(90deg,transparent,rgba(${AR},.22),rgba(${AR},.22),transparent)` }} />
              {METHODE.map((e, i) => (
                <motion.div key={e.n} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ delay:i*.1, duration:.45, ease }}
                  className="flex-1 flex flex-col items-center text-center px-2">
                  <div className="relative w-[68px] h-[68px] rounded-2xl border-2 flex items-center justify-center mb-3.5 z-10"
                    style={{ borderColor:`rgba(${e.r},.35)`, background:`rgba(${e.r},.08)` }}>
                    <e.icon size={21} style={{ color:e.c }} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                      style={{ background:e.c }}>{i+1}</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                </motion.div>
              ))}
            </div>
            {/* Mobile */}
            <div className="lg:hidden space-y-3">
              {METHODE.map((e, i) => (
                <motion.div key={e.n} initial={{ opacity:0, x:-18 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ delay:i*.07, duration:.4, ease }}
                  className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:`rgba(${e.r},.12)` }}>
                    <e.icon size={17} style={{ color:e.c }} />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[.52rem] font-extrabold flex items-center justify-center text-[#07070a]"
                      style={{ background:e.c }}>{i+1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm mb-0.5">{e.t}</p>
                    <p className="text-xs text-white/45 leading-relaxed">{e.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. PAGES POSSIBLES ── */}
        <section className="py-12 sm:py-20 px-5" style={{ background:"rgba(255,255,255,.012)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <FileText size={12} style={{ color:A }} /> Structure du site
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                Les pages <span style={{ color:A }}>que l'on peut créer</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                On compose votre site selon vos besoins — de 1 à 10+ pages, chacune pensée pour convertir.
              </motion.p>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PAGES_POSSIBLES.map(item => (
                <motion.div key={item.t} variants={cardReveal}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                    style={{ background:`rgba(${item.r},.12)` }}>
                    <item.icon size={19} style={{ color:item.c }} />
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 6. POUR QUI ── */}
        <section className="py-12 sm:py-20 px-5">
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <Users size={12} style={{ color:A }} /> Pour qui ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                Un site pour <span style={{ color:A }}>chaque type d'activité</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                On connaît les spécificités de chaque secteur — et on adapte votre site en conséquence.
              </motion.p>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {POUR_QUI.map(item => (
                <motion.div key={item.t} variants={cardReveal}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background:`rgba(${item.r},.12)` }}>
                    <item.icon size={17} style={{ color:item.c }} />
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{item.t}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 7. POURQUOI DJAMA ── */}
        <section className="py-12 sm:py-20 px-5" style={{ background:"rgba(255,255,255,.012)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <Star size={12} style={{ color:"#f9a826" }} /> Pourquoi nous ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                Pourquoi choisir <span style={{ color:A }}>DJAMA</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-lg mx-auto text-sm sm:text-base">
                On ne fait pas que coder des sites. On accompagne votre activité vers plus de visibilité.
              </motion.p>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {POURQUOI_DJAMA.map(item => (
                <motion.div key={item.t} variants={cardReveal}
                  className="group flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background:`rgba(${item.r},.12)` }}>
                    <item.icon size={17} style={{ color:item.c }} />
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

        {/* ── 8. TARIFS ── */}
        <section id="tarifs" className="py-12 sm:py-20 px-5">
          <div className="max-w-4xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <BadgeCheck size={12} style={{ color:A }} /> Tarifs transparents
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
                À partir de <span style={{ color:A }}>490€</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 max-w-xl mx-auto text-sm sm:text-base">
                Tarif fixe validé avant le début. Aucun frais caché. 50% à la commande, solde à la livraison.
              </motion.p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div {...fadeIn} viewport={viewport}
                className="rounded-3xl border border-[rgba(74,222,128,.18)] p-6"
                style={{ background:"rgba(74,222,128,.04)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`rgba(${AR},.15)` }}>
                    <CircleCheck size={17} style={{ color:A }} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-sm">Offre de base</p>
                    <p className="text-xs text-white/40">À partir de 490€</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {OFFRE_INCLUS.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} style={{ color:A }} className="shrink-0" />
                      <span className="text-sm text-white/80">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div {...fadeIn} viewport={viewport} transition={{ delay:.1 }}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.07]">
                    <Layers size={16} className="text-white/50" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white/70 text-sm">Options disponibles</p>
                    <p className="text-xs text-white/35">Sur devis complémentaire</p>
                  </div>
                </div>
                <div className="space-y-2.5 mb-5">
                  {OFFRE_OPTIONS.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                      <span className="text-sm text-white/55">{f}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/30 border-t border-white/[0.06] pt-4">
                  Le tarif final dépend du nombre de pages et des fonctionnalités souhaitées. Devis gratuit sans engagement.
                </p>
              </motion.div>
            </div>
            <motion.div {...fadeIn} viewport={viewport} className="mt-6 text-center">
              <Link href="/contact?besoin=Création+de+site+web"
                className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background:`linear-gradient(135deg,rgba(${AR},.9),rgba(52,211,153,.8))`, color:"#07070a" }}>
                Obtenir mon devis gratuit <ArrowRight size={15} />
              </Link>
              <p className="mt-2.5 text-xs text-white/30">Sans engagement · Réponse sous 24h</p>
            </motion.div>
          </div>
        </section>

        {/* ── TÉMOIGNAGES ── */}
        <section className="py-12 sm:py-20 px-5" style={{ background:"rgba(255,255,255,.012)" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9 sm:mb-12">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <Star size={12} style={{ color:"#f9a826" }} /> Avis clients
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
                Ce que disent <span style={{ color:A }}>nos clients</span>
              </motion.h2>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="grid sm:grid-cols-3 gap-4">
              {TEMOIGNAGES.map(t => (
                <motion.div key={t.n} variants={cardReveal}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length:t.s }).map((_,i) => <Star key={i} size={12} fill="#f9a826" stroke="none" />)}
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed flex-1 italic">"{t.t}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#07070a] shrink-0"
                      style={{ background:`rgba(${t.c},.9)` }}>{t.i}</div>
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

        {/* ── 9. FAQ ── */}
        <section className="py-12 sm:py-20 px-5">
          <div className="max-w-2xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-9">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
                <HelpCircle size={12} style={{ color:A }} /> Questions fréquentes
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
                Vos questions, <span style={{ color:A }}>nos réponses</span>
              </motion.h2>
            </motion.div>
            <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
              {FAQ.map((item, i) => (
                <motion.div key={i} variants={cardReveal}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
                    <span className="text-sm font-semibold text-white/90 leading-snug">{item.q}</span>
                    <motion.div animate={{ rotate: openFaq===i ? 180 : 0 }} transition={{ duration:.22 }} className="shrink-0">
                      <ChevronDown size={14} className="text-white/40" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq===i && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                        exit={{ height:0, opacity:0 }} transition={{ duration:.22 }}>
                        <p className="px-5 pb-4 text-sm text-white/55 leading-relaxed border-t border-white/[0.05] pt-3">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 10. CTA FINAL ── */}
        <section className="py-12 sm:py-20 px-5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <motion.div animate={{ scale:[1,1.05,1], opacity:[.04,.08,.04] }} transition={{ duration:7, repeat:Infinity, ease:"easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[110px]"
              style={{ background:`radial-gradient(circle,rgba(${AR},1) 0%,transparent 70%)` }} />
          </div>
          <div className="max-w-3xl mx-auto">
            <motion.div {...staggerContainer} viewport={viewport}
              className="relative rounded-3xl border border-white/[0.1] p-8 sm:p-12 text-center overflow-hidden"
              style={{ background:`linear-gradient(135deg,rgba(${AR},.05) 0%,rgba(96,165,250,.04) 60%,transparent 100%)` }}>
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-6">
                <Rocket size={12} style={{ color:A }} /> Prêt à démarrer ?
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                Votre site vitrine,<br /><span style={{ color:A }}>livré en 10 jours</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-8">
                Design unique, responsive, SEO-ready. À partir de 490€, devis gratuit et sans engagement.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center gap-3 mb-7">
                <Link href="/contact?besoin=Création+de+site+web"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] shadow-xl"
                  style={{ background:`linear-gradient(135deg,rgba(${AR},.95),rgba(52,211,153,.85))`, color:"#07070a" }}>
                  Créer mon site vitrine <ArrowRight size={15} />
                </Link>
                <Link href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                  Parler de mon projet
                </Link>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-5">
                {[[Clock,"Réponse sous 24h"],[Shield,"Sans engagement"],[BadgeCheck,"Devis gratuit"]].map(([Icon,l]) => (
                  <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                    <Icon size={11} style={{ color:A }} />
                    {l as string}
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
