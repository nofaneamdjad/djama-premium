"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, Mail, ArrowLeft, CreditCard, Package, Users, Settings,
  Smartphone, Shield, TrendingUp, Star, Briefcase, Globe,
  BarChart3, Truck, Palette, Code2, LayoutDashboard, HelpCircle,
  BadgeCheck, Rocket, HeartHandshake, Lock, Bell, Search,
  X, ArrowRightLeft, Clock, DollarSign, RefreshCw, Layers,
  ShoppingBag, Building2, Wrench, FileText, CheckSquare,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Palette émeraude / commerce ─────────────────── */
const E  = "#34d399";   // emerald-400
const ER = "52,211,153";
const E2 = "#10b981";   // emerald-600
const O  = "#f97316";   // orange accent
const OR = "249,115,22";
const G  = "#c9a55a";   // gold DJAMA
const GR = "201,165,90";

/* ═══════════════════════════════════════ DATA ══════════════════════════════════════ */

const POURQUOI_VENDRE = [
  { icon: DollarSign,  c: E,        r: ER,          t: "Revenus 24h/24, 7j/7",   d: "Votre boutique vend pendant que vous dormez. Aucun vendeur, aucun local — juste des commandes qui arrivent." },
  { icon: Globe,       c: "#60a5fa",r: "96,165,250", t: "Clientèle mondiale",     d: "Vendez en France, en Europe ou à l'international. Votre marché devient illimité." },
  { icon: TrendingUp,  c: O,        r: OR,           t: "Scalabilité immédiate",  d: "Doublez votre catalogue sans doubler vos coûts. Le numérique scale là où le physique plafonne." },
  { icon: RefreshCw,   c: "#f9a826",r: "249,168,38", t: "Automatisation totale",  d: "Commandes, paiements, emails de confirmation — tout se gère sans vous. Vous pilotez, pas vous exécutez." },
  { icon: BarChart3,   c: "#a78bfa",r: "167,139,250",t: "Données & analytics",   d: "Sachez exactement qui achète quoi, d'où, et quand. Prenez des décisions basées sur les faits, pas les intuitions." },
  { icon: ShoppingBag, c: "#f472b6",r: "244,114,182",t: "Coût d'acquisition bas", d: "SEO produit + réseaux sociaux = trafic qualifié à moindre coût. Chaque euro investi en marketing est traçable." },
];

const FONCTIONNALITES = [
  { icon: Package,       c: E,        r: ER,           t: "Fiches produits premium",  d: "Photos multi-vues, variantes (taille, couleur), descriptions optimisées SEO, avis clients intégrés." },
  { icon: ShoppingCart,  c: O,        r: OR,           t: "Panier & checkout fluide",  d: "Tunnel d'achat optimisé pour réduire l'abandon panier. 1-click checkout disponible." },
  { icon: CreditCard,    c: "#4ade80",r: "74,222,128", t: "Paiement sécurisé",         d: "Stripe + PayPal + CB. 3D Secure, remboursements, abonnements — tout géré nativement." },
  { icon: Settings,      c: "#f9a826",r: "249,168,38", t: "Dashboard commandes",       d: "Interface admin pour gérer commandes, stocks, expéditions, retours en temps réel." },
  { icon: Users,         c: "#60a5fa",r: "96,165,250", t: "Espace client",             d: "Comptes clients, suivi commandes, historique, wishlist, programme de fidélité optionnel." },
  { icon: Bell,          c: "#a78bfa",r: "167,139,250",t: "Emails automatiques",       d: "Confirmation de commande, suivi livraison, relance panier abandonné — tout automatisé." },
  { icon: Smartphone,    c: "#f472b6",r: "244,114,182",t: "Mobile-first",              d: "+60% des achats se font sur mobile. Votre boutique est parfaite sur tous les écrans." },
  { icon: Search,        c: G,        r: GR,           t: "SEO produits",              d: "Balises métas, rich snippets, sitemap produits — vos articles apparaissent sur Google Shopping." },
  { icon: Truck,         c: "#fb923c",r: "251,146,60", t: "Livraison & stocks",        d: "Gestion des transporteurs, frais de port automatiques, alertes de stock bas." },
];

const PROCESSUS = [
  { icon: BarChart3,  c: G,        r: GR,           t: "Stratégie",       d: "Analyse de votre marché, positionnement produit, choix technique.",      duration: "Jour 1"    },
  { icon: Layers,     c: "#60a5fa",r: "96,165,250",  t: "Architecture",    d: "Structure catalogue, catégories, tunnel d'achat, parcours client.",      duration: "Jours 2–3" },
  { icon: Palette,    c: "#a78bfa",r: "167,139,250", t: "Design",          d: "Maquette validée avec vous : pages, fiches produits, checkout.",          duration: "Jours 4–6" },
  { icon: Code2,      c: E,        r: ER,           t: "Développement",   d: "Intégration complète — front, back, panier, comptes, emails auto.",       duration: "Jours 7–12"},
  { icon: CreditCard, c: O,        r: OR,           t: "Paiement & tests",d: "Configuration Stripe/PayPal, tests end-to-end, sécurité, performance.",   duration: "Jours 13–14"},
  { icon: Rocket,     c: "#f9a826",r: "249,168,38",  t: "Mise en ligne",   d: "Déploiement + formation admin + support 1 mois inclus.",                 duration: "Jour 15"   },
];

const AVANT = [
  { t: "Ventes limitées à votre zone",    d: "Impossible de toucher des clients à 50 km ou à l'étranger." },
  { t: "Horaires d'ouverture contraints", d: "0 vente le dimanche soir. Votre boutique ferme, vos concurrents en ligne, non." },
  { t: "Gestion manuelle des commandes",  d: "Téléphone, WhatsApp, Excel — chronophage, sources d'erreurs." },
  { t: "Aucune donnée client",            d: "Vous ne savez pas qui achète, ce qu'il veut, ni quand il revient." },
  { t: "Stock difficile à piloter",       d: "Ruptures fréquentes ou sur-stock. Aucune visibilité en temps réel." },
];

const APRES = [
  { t: "Ventes partout, tout le temps",   d: "France, Europe, monde entier — votre boutique ne dort jamais." },
  { t: "Boutique ouverte 24h/24",         d: "Des commandes arrivent même la nuit, le week-end, pendant vos vacances." },
  { t: "Commandes gérées automatiquement",d: "Confirmation, facture, suivi livraison — tout part sans intervention manuelle." },
  { t: "Analytics complets",              d: "Sachez exactement qui achète, d'où, et comment ils vous ont trouvés." },
  { t: "Stocks pilotés en temps réel",    d: "Alertes automatiques, seuils configurables. Plus jamais de rupture surprise." },
];

const POURQUOI_DJAMA = [
  { icon: HeartHandshake,c: E,        r: ER,           t: "Accompagnement humain",       d: "Un expert dédié de la stratégie à la livraison. Pas de ticket de support — un vrai interlocuteur." },
  { icon: Zap,           c: O,        r: OR,           t: "Performance boutique",        d: "Optimisé pour la vitesse et les conversions. Lighthouse 90+, Core Web Vitals au vert." },
  { icon: Shield,        c: "#4ade80",r: "74,222,128", t: "Sécurité niveau bancaire",    d: "SSL, 3D Secure, données chiffrées, conformité RGPD et PCI-DSS." },
  { icon: TrendingUp,    c: "#60a5fa",r: "96,165,250", t: "Orienté conversion",          d: "UX pensée pour vendre : fiches produits, checkout, relances — chaque détail augmente votre CA." },
  { icon: RefreshCw,     c: "#a78bfa",r: "167,139,250",t: "Évolutif à l'infini",         d: "Nouveaux produits, nouvelles fonctions, marketplaces — votre boutique grandit avec votre business." },
  { icon: BadgeCheck,    c: G,        r: GR,           t: "Intégrations pro",            d: "Stripe, Klaviyo, Google Analytics, Meta Pixel, Colissimo, Mondial Relay — l'écosystème complet." },
];

const PACKS = [
  {
    name:        "Starter",
    price:       "890€",
    sub:         "Jusqu'à 50 produits — Livré en 10 jours",
    color:       "#60a5fa",
    rgb:         "96,165,250",
    recommended: false,
    features: [
      "Boutique jusqu'à 50 produits",
      "Paiement Stripe + PayPal",
      "Panier & checkout optimisé",
      "Espace client basique",
      "Emails de confirmation auto",
      "Responsive mobile & desktop",
      "SEO produits de base",
      "Support 1 mois",
    ],
    cta: "Lancer mon Starter",
  },
  {
    name:        "Pro",
    price:       "1 490€",
    sub:         "Produits illimités — Livré en 15 jours",
    color:       E,
    rgb:         ER,
    recommended: true,
    features: [
      "Produits & catégories illimités",
      "Paiement Stripe + PayPal + CB",
      "Dashboard admin complet",
      "Relance panier abandonné",
      "Programme de fidélité",
      "Google Analytics + Meta Pixel",
      "SEO avancé + Google Shopping",
      "Formation admin (1h)",
      "Support 2 mois",
    ],
    cta: "Choisir le pack Pro",
  },
  {
    name:        "Enterprise",
    price:       "Sur devis",
    sub:         "Sur mesure — Fonctions avancées",
    color:       G,
    rgb:         GR,
    recommended: false,
    features: [
      "Architecture sur mesure",
      "Marketplace multi-vendeurs",
      "Abonnements & SaaS billing",
      "ERP / logistique connectés",
      "A/B testing & CRO",
      "SEO contenu mensuel",
      "Intégrations API illimitées",
      "Support prioritaire dédié",
    ],
    cta: "Demander un devis",
  },
];

const FAQ = [
  { q: "Quelle plateforme utilisez-vous pour les boutiques ?",     a: "On travaille principalement avec Next.js + Stripe pour un maximum de performance et flexibilité, ou Shopify selon vos besoins. On choisit ensemble la solution la plus adaptée à votre catalogue et vos objectifs." },
  { q: "Combien de temps pour livrer une boutique e-commerce ?",   a: "Entre 10 et 15 jours pour un projet Starter/Pro. Un projet Enterprise plus complexe peut prendre 3 à 6 semaines. On établit un planning précis avant de commencer." },
  { q: "Les paiements sont-ils vraiment sécurisés ?",              a: "Oui. On intègre Stripe et PayPal, qui sont certifiés PCI-DSS niveau 1 — le plus haut niveau de sécurité pour les paiements en ligne. 3D Secure activé par défaut." },
  { q: "Puis-je gérer mes produits et commandes moi-même ?",       a: "Absolument. On vous remet une interface admin simple et intuitive, avec une formation incluse. Ajout de produits, gestion des commandes, suivi des stocks — tout est à votre portée." },
  { q: "Peut-on vendre à l'international ?",                       a: "Oui. Multi-devises, multi-langues, taxes locales (TVA UE, etc.), transporteurs internationaux — tout peut être configuré selon votre marché cible." },
  { q: "Que se passe-t-il après la livraison ?",                   a: "Support inclus pendant 1 à 2 mois selon le pack. Au-delà, on propose une maintenance mensuelle, des évolutions ponctuelles, ou un accompagnement growth continu." },
];

const TEMOIGNAGES = [
  { i: "S", c: ER,           n: "Sophie M.",  r: "Créatrice bijoux",   s: 5, t: "Ma boutique est en ligne depuis 3 mois. J'ai déjà réalisé 47 ventes sans dépenser un euro de publicité. Le SEO produit fonctionne vraiment." },
  { i: "K", c: OR,           n: "Karim B.",   r: "Dropshipping mode",  s: 5, t: "De 0 à 300 commandes en 2 mois. L'interface admin est simple, les paiements tombent automatiquement. DJAMA a tout géré." },
  { i: "L", c: "167,139,250",n: "Laura D.",   r: "Coach & formations", s: 5, t: "Je vends maintenant mes formations en ligne avec abonnement. Le tunnel d'achat a été pensé pour convertir — ça se voit sur les chiffres." },
];

const POUR_QUI = [
  { icon: Briefcase,  c: E,        r: ER,           t: "E-commerçants",          d: "Lancement d'une boutique de A à Z, ou refonte d'un site existant." },
  { icon: Wrench,     c: O,        r: OR,           t: "Artisans & créateurs",   d: "Vendez vos créations au-delà de votre région, sans intermédiaire." },
  { icon: Building2,  c: "#60a5fa",r: "96,165,250", t: "Commerces physiques",    d: "Ouvrez un canal de vente en ligne complémentaire à votre boutique." },
  { icon: Users,      c: "#a78bfa",r: "167,139,250",t: "Formateurs & coachs",   d: "Vendez formations, ebooks, contenus digitaux ou abonnements." },
  { icon: Globe,      c: "#f472b6",r: "244,114,182",t: "Marques & labels",       d: "Boutique DTC directe, sans marketplace, avec votre identité propre." },
  { icon: Star,       c: G,        r: GR,           t: "Dropshipping",           d: "Catalogue fournisseur connecté, commandes automatisées, zéro stock." },
];

/* ═══════════════════════════════════════ PAGE ══════════════════════════════════════ */
export default function SiteEcommercePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-[#07070a] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24">

        {/* Backgrounds */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: `linear-gradient(rgba(${ER},.7) 1px,transparent 1px),linear-gradient(90deg,rgba(${ER},.7) 1px,transparent 1px)`, backgroundSize: "52px 52px" }} />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [.06, .12, .06] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-40 top-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(circle,rgba(${ER},1) 0%,transparent 70%)` }} />
          <div className="absolute right-0 top-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${OR},1) 0%,transparent 70%)` }} />
          <div className="absolute right-1/3 bottom-0 w-[280px] h-[280px] rounded-full blur-[80px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${GR},1) 0%,transparent 70%)` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
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

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease, delay: .05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[.72rem] font-bold"
                style={{ borderColor: `rgba(${ER},.3)`, background: `rgba(${ER},.08)`, color: E }}
              >
                <ShoppingCart size={11} /> Boutique e-commerce
                <span className="ml-1 rounded-full px-2 py-0.5 text-[.6rem] font-extrabold text-[#07070a]"
                  style={{ background: E }}>VENTES</span>
              </motion.div>

              <h1 className="mb-5 text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.07] tracking-tight">
                <MultiLineReveal
                  lines={["Vendez en ligne,", "encaissez", "automatiquement."]}
                  highlight={1}
                  stagger={.13}
                  wordStagger={.055}
                  delay={.08}
                  lineClassName="justify-start"
                />
              </h1>

              <FadeReveal delay={.28}>
                <p className="mb-7 max-w-lg text-base sm:text-lg leading-relaxed text-white/50">
                  Boutique complète, paiement Stripe intégré, gestion des commandes automatisée. Votre business tourne 24h/24 sans que vous leviez le petit doigt.
                </p>
              </FadeReveal>

              {/* Price block */}
              <FadeReveal delay={.36}>
                <div className="mb-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: `rgba(${ER},.22)`, background: `rgba(${ER},.06)` }}>
                  <div>
                    <p className="text-[.65rem] font-bold uppercase tracking-widest text-white/35 mb-0.5">À partir de</p>
                    <p className="text-[2rem] font-extrabold leading-none" style={{ color: E }}>890€</p>
                  </div>
                  <div className="h-10 w-px bg-white/[0.08]" />
                  <div className="space-y-1">
                    {["Paiement Stripe inclus", "Livré en 15 jours", "Devis gratuit"].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-white/55">
                        <CheckCircle2 size={11} className="shrink-0" style={{ color: E }} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeReveal>

              <FadeReveal delay={.44}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Site+e-commerce"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(52,211,153,0.28)]"
                    style={{ background: `linear-gradient(135deg,${E2},${E})`, color: "#07070a" }}>
                    Lancer ma boutique <ArrowRight size={15} />
                  </Link>
                  <a href="#tarifs"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                    Voir les tarifs
                  </a>
                </div>
              </FadeReveal>
            </div>

            {/* Right: store dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .75, ease, delay: .3 }}
              className="relative"
            >
              {/* Glow */}
              <div className="pointer-events-none absolute -inset-8 rounded-3xl blur-3xl opacity-[0.22]"
                style={{ background: `radial-gradient(ellipse,rgba(${ER},.6) 0%,rgba(${OR},.3) 55%,transparent 75%)` }} />

              {/* Browser */}
              <div className="relative overflow-hidden rounded-[20px] border border-white/[0.1] shadow-[0_48px_110px_rgba(0,0,0,.8)]"
                style={{ background: "#0d0d10" }}>

                {/* Tab bar */}
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5"
                  style={{ background: "#111116" }}>
                  <div className="flex gap-1.5">
                    {["#ff5f57","#ffbd2e","#28c840"].map(bg => (
                      <div key={bg} className="w-2.5 h-2.5 rounded-full" style={{ background: bg }} />
                    ))}
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 mx-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: E }} />
                    <span className="flex-1 text-[.58rem] text-white/30">ma-boutique.fr</span>
                    <span className="text-[.5rem] text-white/20">ssl</span>
                  </div>
                </div>

                {/* Store nav */}
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5"
                  style={{ background: "#0a0a0d" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg" style={{ background: `rgba(${ER},.28)` }} />
                    <div className="h-1.5 w-14 rounded-full bg-white/20" />
                  </div>
                  <div className="flex gap-4">
                    {[36, 44, 38, 28].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-white/14" style={{ width: w }} />
                    ))}
                  </div>
                  {/* Cart icon */}
                  <div className="relative w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${ER},.12)` }}>
                    <ShoppingCart size={12} style={{ color: E }} />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[.45rem] font-extrabold flex items-center justify-center text-[#07070a]"
                      style={{ background: E }}>3</div>
                  </div>
                </div>

                {/* Products grid */}
                <div className="p-3 grid grid-cols-3 gap-2"
                  style={{ background: "linear-gradient(135deg,#0e150f 0%,#0a0d10 100%)" }}>
                  {[
                    ["Produit Premium", "89€", ER],
                    ["Collection Pro",  "149€", "96,165,250"],
                    ["Pack Starter",    "49€",  OR],
                  ].map(([name, price, c]) => (
                    <div key={name} className="rounded-xl border border-white/[0.07] overflow-hidden"
                      style={{ background: "#0e0e12" }}>
                      {/* Product image */}
                      <div className="h-14 flex items-center justify-center"
                        style={{ background: `rgba(${c},.07)` }}>
                        <div className="w-8 h-8 rounded-xl" style={{ background: `rgba(${c},.22)` }} />
                      </div>
                      {/* Info */}
                      <div className="p-2">
                        <div className="h-1 w-3/4 rounded-full bg-white/22 mb-1.5" />
                        <div className="flex items-center justify-between">
                          <p className="text-[.6rem] font-extrabold" style={{ color: `rgba(${c},.9)` }}>{price}</p>
                          <div className="h-3.5 w-6 rounded-md" style={{ background: `rgba(${c},.25)` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1.5 p-2.5" style={{ background: "#0b0b0e" }}>
                  {[
                    ["€1,247","Aujourd'hui", ER],
                    ["23",    "Commandes",   OR],
                    ["94%",   "Satisfaction","249,168,38"],
                  ].map(([v, l, c]) => (
                    <div key={l} className="rounded-xl border border-white/[0.06] p-2.5" style={{ background: "#111116" }}>
                      <p className="text-sm font-extrabold" style={{ color: `rgba(${c},.9)` }}>{v}</p>
                      <p className="text-[.52rem] text-white/35">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="px-2.5 pb-3 pt-1" style={{ background: "#0b0b0e" }}>
                  <div className="rounded-xl border border-white/[0.06] p-3" style={{ background: "#0e0e12" }}>
                    <div className="flex items-end gap-1 h-8">
                      {[30, 50, 38, 62, 48, 75, 55, 80, 60, 90, 68, 100].map((h, i) => (
                        <motion.div key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: .8 + i * .06, duration: .4, ease }}
                          className="flex-1 rounded-sm"
                          style={{ background: i === 11 ? E : `rgba(${ER},.25)` }}
                        />
                      ))}
                    </div>
                    <p className="text-[.5rem] text-white/25 mt-1.5">Revenus — 12 derniers jours</p>
                  </div>
                </div>
              </div>

              {/* Floating: new order */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 top-10 rounded-xl border border-white/[0.12] px-3 py-2 shadow-xl hidden sm:block"
                style={{ background: "#14141a" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: `rgba(${ER},.15)` }}>
                    <ShoppingCart size={10} style={{ color: E }} />
                  </div>
                  <div>
                    <p className="text-[.58rem] font-bold text-white">Nouvelle commande</p>
                    <p className="text-[.5rem] text-white/35">€89 · il y a 2 min</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating: revenue chip */}
              <motion.div
                animate={{ y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 right-10 rounded-xl border px-3.5 py-2 hidden sm:flex items-center gap-2"
                style={{ borderColor: `rgba(${ER},.28)`, background: `rgba(${ER},.08)` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: E }} />
                <p className="text-[.58rem] font-semibold" style={{ color: E }}>+€1,247 aujourd&apos;hui</p>
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
            ["15j",    "Délai moyen de livraison",    ER],
            ["+€12k",  "CA moyen généré en 6 mois",   OR],
            ["99.9%",  "Uptime garanti",               "249,168,38"],
            ["60%+",   "Des achats se font sur mobile","244,114,182"],
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
              <Users size={12} style={{ color: E }} /> Pour qui ?
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Une boutique pour <span style={{ color: E }}>chaque type de business</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Produits physiques, formations, abonnements, dropshipping — on maîtrise tous les modèles.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {POUR_QUI.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
          3. POURQUOI VENDRE EN LIGNE
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 w-[350px] h-[350px] rounded-full blur-[90px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${OR},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <TrendingUp size={12} style={{ color: E }} /> Pourquoi vendre en ligne ?
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Les raisons de <span style={{ color: E }}>passer au digital</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              En 2025, le commerce en ligne croît 3× plus vite que le physique. Ne pas y être, c'est laisser votre marché à vos concurrents.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POURQUOI_VENDRE.map(item => (
              <motion.div key={item.t} variants={cardReveal}
                whileHover={{ y: -5, transition: { duration: .22 } }}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 120%,rgba(${item.r},.11) 0%,transparent 65%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `rgba(${item.r},.12)` }}>
                  <item.icon size={19} style={{ color: item.c }} />
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{item.t}</p>
                <p className="text-xs text-white/45 leading-relaxed">{item.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. AVANT / APRÈS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 w-[320px] h-[320px] rounded-full blur-[90px] opacity-[0.05]"
            style={{ background: `radial-gradient(circle,rgba(${ER},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <ArrowRightLeft size={12} style={{ color: E }} /> Transformation
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Avant votre boutique <span style={{ color: E }}>— après DJAMA</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              La différence concrète entre un business limité à sa zone géographique et un business qui scale.
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
                  <p className="font-extrabold text-[#f87171] text-sm">Sans boutique en ligne</p>
                  <p className="text-[.65rem] text-white/30">Business traditionnel</p>
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
                style={{ borderColor: `rgba(${ER},.4)`, background: `rgba(${ER},.1)` }}>
                <ArrowRight size={16} style={{ color: E }} />
              </div>
            </motion.div>

            {/* APRÈS */}
            <motion.div
              initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .55, ease, delay: .1 }}
              className="rounded-2xl border p-6"
              style={{ borderColor: `rgba(${ER},.22)`, background: `rgba(${ER},.05)` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `rgba(${ER},.15)` }}>
                  <CheckCircle2 size={14} style={{ color: E }} />
                </div>
                <div>
                  <p className="font-extrabold text-sm" style={{ color: E }}>Avec DJAMA</p>
                  <p className="text-[.65rem] text-white/30">Business digitalisé</p>
                </div>
              </div>
              <div className="space-y-3.5">
                {APRES.map(item => (
                  <div key={item.t} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `rgba(${ER},.15)`, border: `1px solid rgba(${ER},.3)` }}>
                      <CheckCircle2 size={7} style={{ color: E }} />
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
          5. FONCTIONNALITÉS INCLUSES
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <CheckSquare size={12} style={{ color: E }} /> Fonctionnalités incluses
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Tout ce qu&apos;il faut <span style={{ color: E }}>pour vendre en ligne</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Pas de plugin fragile, pas de raccourci. Chaque fonctionnalité est intégrée proprement.
            </motion.p>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FONCTIONNALITES.map(item => (
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
          6. PROCESSUS ANIMÉ (6 étapes)
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 w-[380px] h-[380px] rounded-full blur-[100px] opacity-[0.04]"
            style={{ background: `radial-gradient(circle,rgba(${ER},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Zap size={12} style={{ color: E }} /> Notre méthode
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              De zéro à boutique en ligne <span style={{ color: E }}>en 15 jours</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Un process rigoureux qui garantit une boutique qui vend dès le premier jour.
            </motion.p>
          </motion.div>

          {/* Desktop — 6 steps en 2 rangées de 3 */}
          <div className="hidden lg:grid grid-cols-3 gap-6 relative">
            {/* Row connector top */}
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: true }} transition={{ duration: 1.2, ease, delay: .4 }}
              className="absolute top-9 left-[17%] right-[17%] h-px origin-left"
              style={{ background: `linear-gradient(90deg,rgba(${ER},.6),rgba(${OR},.6))` }}
            />
            {PROCESSUS.map((e, i) => (
              <motion.div key={e.t}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: .15 + i * .11, duration: .5, ease }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative w-[72px] h-[72px] rounded-2xl border-2 flex items-center justify-center mb-4 z-10"
                  style={{ borderColor: `rgba(${e.r},.4)`, background: `rgba(${e.r},.08)` }}>
                  <e.icon size={22} style={{ color: e.c }} />
                  <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-[.58rem] font-extrabold flex items-center justify-center text-[#07070a]"
                    style={{ background: e.c }}>{i + 1}</span>
                </div>
                <p className="font-bold text-white text-sm mb-1">{e.t}</p>
                <p className="text-xs text-white/45 leading-relaxed mb-2.5 max-w-[160px]">{e.d}</p>
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[.6rem] font-bold"
                  style={{ color: e.c }}>
                  {e.duration}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Mobile — vertical */}
          <div className="lg:hidden space-y-3 relative">
            <div className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: `linear-gradient(180deg,transparent,rgba(${ER},.35),rgba(${OR},.35),transparent)` }} />
            {PROCESSUS.map((e, i) => (
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
          7. TARIFS — 3 PACKS
      ══════════════════════════════════════════ */}
      <section id="tarifs" className="py-16 sm:py-24 px-5 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,.012)" }}>
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [.04, .08, .04] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[130px]"
            style={{ background: `radial-gradient(ellipse,rgba(${ER},.8) 0%,rgba(${OR},.6) 50%,transparent 70%)` }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-14">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <BadgeCheck size={12} style={{ color: E }} /> Tarifs clairs
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              L&apos;offre qui correspond <span style={{ color: E }}>à votre ambition</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-xl mx-auto text-sm sm:text-base">
              Tarif fixe validé avant le début. 50% à la commande, solde à la livraison.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PACKS.map((pack, i) => (
              <motion.div key={pack.name}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * .11, duration: .5, ease }}
                className={`relative rounded-3xl border p-6 flex flex-col transition-all duration-300 ${
                  pack.recommended ? "scale-[1.02] shadow-[0_0_60px_rgba(52,211,153,0.14)]" : "hover:border-white/[0.15]"
                }`}
                style={{
                  borderColor: pack.recommended ? `rgba(${pack.rgb},.35)` : `rgba(${pack.rgb},.12)`,
                  background:  pack.recommended ? `rgba(${pack.rgb},.07)` : "rgba(255,255,255,.025)",
                }}
              >
                {pack.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[.62rem] font-extrabold uppercase tracking-wider text-[#07070a] shadow-lg"
                      style={{ background: `linear-gradient(135deg,${E2},${E})` }}>
                      <Sparkles size={9} /> Recommandé
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `rgba(${pack.rgb},.15)` }}>
                      <ShoppingCart size={14} style={{ color: pack.color }} />
                    </div>
                    <p className="font-extrabold text-white">{pack.name}</p>
                  </div>
                  <p className="text-3xl font-extrabold leading-none mb-1.5" style={{ color: pack.color }}>
                    {pack.price}
                  </p>
                  <p className="text-xs text-white/40">{pack.sub}</p>
                </div>
                <div className="flex-1 space-y-2.5 mb-6">
                  {pack.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} style={{ color: pack.color }} className="shrink-0" />
                      <span className="text-sm text-white/72">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/contact?besoin=Site+e-commerce&pack=${pack.name}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                  style={
                    pack.recommended
                      ? { background: `linear-gradient(135deg,${E2},${E})`, color: "#07070a" }
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
            Tous les tarifs sont HT · Paiement en 2× · Devis gratuit sous 24h
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. SÉCURITÉ & CONFIANCE
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Shield size={12} style={{ color: E }} /> Fiabilité & sécurité
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">
              Pourquoi choisir <span style={{ color: E }}>DJAMA</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-white/45 max-w-lg mx-auto text-sm sm:text-base">
              Une boutique e-commerce c&apos;est votre outil de revenus. On ne plaisante pas avec la qualité ni la sécurité.
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

          {/* Trust badges row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: .5, ease, delay: .2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              [Lock,       "SSL & HTTPS",       ER],
              [CreditCard, "PCI-DSS Stripe",    OR],
              [Shield,     "3D Secure",         "96,165,250"],
              [Globe,      "RGPD conforme",     GR],
              [BarChart3,  "99.9% uptime",      "249,168,38"],
              [Truck,      "Multi-transporteurs","244,114,182"],
            ].map(([Icon, label, c]) => (
              <div key={label as string}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/55">
                <Icon size={12} style={{ color: `rgba(${c},.9)` }} />
                {label as string}
              </div>
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
            style={{ background: `radial-gradient(ellipse,rgba(${ER},1) 0%,transparent 70%)` }} />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} viewport={viewport} className="text-center mb-12">
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-4">
              <Star size={12} style={{ color: "#f9a826" }} /> Résultats concrets
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Ils vendent déjà <span style={{ color: E }}>en ligne</span>
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
              <HelpCircle size={12} style={{ color: E }} /> Questions fréquentes
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-2xl sm:text-3xl font-extrabold mb-3">
              Vos questions, <span style={{ color: E }}>nos réponses</span>
            </motion.h2>
          </motion.div>
          <motion.div {...staggerContainerFast} viewport={viewport} className="space-y-2.5">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={cardReveal}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: openFaq === i ? `rgba(${ER},.3)` : "rgba(255,255,255,.07)",
                  background:  openFaq === i ? `rgba(${ER},.05)` : "rgba(255,255,255,.03)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white/88 leading-snug">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: .22 }} className="shrink-0">
                    <ChevronDown size={14} style={{ color: openFaq === i ? E : "rgba(255,255,255,.38)" }} />
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
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [.05, .1, .05] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px]"
            style={{ background: `radial-gradient(ellipse,rgba(${ER},.9) 0%,rgba(${OR},.6) 55%,transparent 70%)` }}
          />
          <div className="absolute inset-0 opacity-[0.016]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="max-w-3xl mx-auto relative">
          <motion.div {...staggerContainer} viewport={viewport}
            className="relative rounded-3xl border p-8 sm:p-14 text-center overflow-hidden"
            style={{ borderColor: `rgba(${ER},.22)`, background: `rgba(${ER},.04)` }}
          >
            <div className="absolute top-0 left-0 w-24 h-24 rounded-br-3xl border-b border-r"
              style={{ borderColor: `rgba(${ER},.15)` }} />
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-3xl border-t border-l"
              style={{ borderColor: `rgba(${ER},.15)` }} />
            <div className="pointer-events-none absolute -top-10 right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: `rgba(${ER},1)` }} />
            <div className="pointer-events-none absolute -bottom-10 left-10 w-28 h-28 rounded-full blur-3xl opacity-15"
              style={{ background: `rgba(${OR},1)` }} />

            <motion.div variants={fadeIn}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/55 mb-7">
              <Rocket size={12} style={{ color: E }} /> Prêt à vendre en ligne ?
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="relative text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold mb-5 leading-tight">
              Votre boutique en ligne,<br />
              <span style={{
                background: `linear-gradient(135deg,${E},${O})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                livrée en 15 jours.
              </span>
            </motion.h2>

            <motion.p variants={fadeIn}
              className="relative text-white/45 text-base max-w-md mx-auto mb-9">
              Boutique complète, paiements intégrés, gestion automatisée. À partir de <strong className="text-white/75">890€</strong>, devis gratuit sous 24h.
            </motion.p>

            <motion.div variants={fadeIn} className="relative flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <Link href="/contact?besoin=Site+e-commerce"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all duration-200 hover:scale-[1.02] shadow-[0_0_40px_rgba(52,211,153,0.22)] hover:shadow-[0_0_60px_rgba(52,211,153,0.38)]"
                style={{ background: `linear-gradient(135deg,${E2},${E})`, color: "#07070a" }}>
                Lancer ma boutique <ArrowRight size={15} />
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
                [Shield,    "Paiement sécurisé"],
                [BadgeCheck,"Devis gratuit"],
                [Star,      "Paiement en 2×"],
              ].map(([Icon, l]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-xs text-white/35">
                  <Icon size={11} style={{ color: E }} />
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
