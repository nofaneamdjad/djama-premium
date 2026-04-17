"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send, ArrowLeft,
  ShoppingCart, Truck, Users, Settings, Bell, Shield, Star,
  LayoutDashboard, Code2, Briefcase, TrendingUp, Lock, Palette,
  Quote, Globe, Database, WifiOff, CreditCard, CheckSquare,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#fb7185";
const ACCENT_RGB = "251,113,133";

const TYPES_APPS = [
  { icon: ShoppingCart,    color: "#f9a826", rgb: "249,168,38",  title: "Application de réservation", desc: "Hôtels, restaurants, salons, prestataires — permettez à vos clients de réserver en quelques secondes." },
  { icon: Truck,           color: "#60a5fa", rgb: "96,165,250",  title: "Application de livraison",   desc: "Interface client, tracking en temps réel, gestion des livreurs et des zones — tout en un." },
  { icon: Users,           color: ACCENT,    rgb: ACCENT_RGB,    title: "Application communautaire",  desc: "Réseau social de niche, forum, plateforme d'échange ou espace membres avec profils et messagerie." },
  { icon: MessageSquare,   color: "#4ade80", rgb: "74,222,128",  title: "Service client mobile",      desc: "Support intégré, chat en direct, base de connaissances et ticketing dans une app native." },
  { icon: LayoutDashboard, color: "#a78bfa", rgb: "167,139,250", title: "Gestion interne",            desc: "Application métier pour vos équipes : planning, pointage, reporting, accès aux données terrain." },
  { icon: Star,            color: "#f472b6", rgb: "244,114,182", title: "Application de marque",      desc: "App de fidélité, catalogue produits, programme de récompenses — renforcez le lien avec vos clients." },
];

const CE_QUE_NOUS_TRAVAILLONS = [
  { icon: Palette,  color: "#60a5fa", rgb: "96,165,250",  title: "UX / UI soignée",         desc: "Design pensé pour l'usage mobile : navigation fluide, interfaces intuitives, expérience cohérente iOS et Android." },
  { icon: Zap,      color: ACCENT,    rgb: ACCENT_RGB,    title: "Performance",              desc: "Temps de chargement optimisés, gestion du cache, fluidité des animations — une app agréable à utiliser." },
  { icon: Lock,     color: "#4ade80", rgb: "74,222,128",  title: "Sécurité",                 desc: "Authentification sécurisée, chiffrement des données, protection contre les accès non autorisés." },
  { icon: Users,    color: "#f9a826", rgb: "249,168,38",  title: "Espace utilisateur",      desc: "Profils, historique, préférences, favoris — chaque utilisateur a son espace personnalisé." },
  { icon: Bell,     color: "#f472b6", rgb: "244,114,182", title: "Notifications push",       desc: "Alertes personnalisées, rappels, promotions ciblées — restez en contact avec vos utilisateurs." },
  { icon: Code2,    color: "#a78bfa", rgb: "167,139,250", title: "API & intégrations",       desc: "Connexion à vos outils existants (CRM, paiement, analytics, cartographie) via des APIs robustes." },
];

const POUR_QUI = [
  { icon: Briefcase, color: "#60a5fa", rgb: "96,165,250", who: "Startups & entrepreneurs",  desc: "Vous avez une idée d'app et voulez lancer un MVP rapide pour valider votre concept sur le marché.",       tags: ["MVP", "Validation", "Lean"] },
  { icon: Star,      color: ACCENT,    rgb: ACCENT_RGB,   who: "Commerces & marques",       desc: "Fidélisez vos clients, facilitez les achats et renforcez votre présence mobile avec votre propre app.",    tags: ["Fidélité", "App de marque", "Mobile"] },
  { icon: TrendingUp,color: "#4ade80", rgb: "74,222,128", who: "Entreprises & PME",         desc: "Optimisez les opérations terrain, équipez vos équipes mobiles et automatisez vos processus internes.",     tags: ["Terrain", "Opérations", "Équipe"] },
  { icon: Users,     color: "#f9a826", rgb: "249,168,38", who: "Plateformes & marketplaces",desc: "Mettez en relation vendeurs et acheteurs, prestataires et clients dans une app fluide et scalable.",       tags: ["Marketplace", "Two-sided", "Scale"] },
];

const PROCESSUS = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90", title: "Cadrage & vision",          desc: "On définit ensemble les fonctionnalités clés, les utilisateurs cibles et les objectifs de l'application." },
  { num: "02", icon: Palette,       color: "#60a5fa", rgb: "96,165,250", title: "Design UX/UI",              desc: "Wireframes, maquettes interactives et validation du parcours utilisateur avant tout développement." },
  { num: "03", icon: Code2,         color: ACCENT,    rgb: ACCENT_RGB,   title: "Développement",             desc: "Développement agile par sprints, avec démonstrations régulières pour valider chaque fonctionnalité." },
  { num: "04", icon: CheckCircle2,  color: "#4ade80", rgb: "74,222,128", title: "Tests & publication",       desc: "Tests complets, corrections, publication sur l'App Store et Google Play, suivi post-lancement." },
];

const CE_QUE_VOUS_OBTENEZ = [
  { label: "Cadrage & vision produit",    desc: "Définition des fonctionnalités clés, utilisateurs cibles, parcours et MVP.",                   icon: Briefcase,    color: "251,113,133" },
  { label: "Design UX/UI mobile",         desc: "Maquettes interactives, design system, prototypage validé avant développement.",                icon: Palette,      color: "96,165,250"  },
  { label: "Développement iOS & Android", desc: "Application native ou React Native — une base de code pour les deux plateformes.",              icon: Smartphone,   color: "74,222,128"  },
  { label: "Backend & API",               desc: "Serveur, base de données, authentification, notifications push — tout l'écosystème.",           icon: Code2,        color: "249,168,38"  },
  { label: "Tests & publication stores",  desc: "Tests complets, soumission App Store et Google Play, conformité aux guidelines.",               icon: CheckCircle2, color: "244,114,182" },
  { label: "Support post-lancement",      desc: "Suivi des crashes, mises à jour, nouvelles fonctionnalités selon les retours utilisateurs.",     icon: Shield,       color: "167,139,250" },
];

const EXEMPLES_PROJETS = [
  { icon: ShoppingCart, color: "#fb7185", rgb: "251,113,133", titre: "App de réservation",     desc: "Application iOS/Android pour un réseau de salons de coiffure — réservation, fidélité et notifications push.",   resultat: "30% de no-show en moins grâce aux rappels auto" },
  { icon: Truck,        color: "#60a5fa", rgb: "96,165,250",  titre: "App de livraison",       desc: "Interface client + interface livreur avec tracking GPS en temps réel et gestion des statuts de commande.",         resultat: "4.8/5 sur l'App Store dès la 1ère semaine" },
  { icon: Users,        color: "#4ade80", rgb: "74,222,128",  titre: "Réseau social de niche", desc: "Plateforme communautaire pour passionnés de sport — profils, fil d'actualité, événements et messagerie privée.",   resultat: "2 000 membres actifs en 3 mois" },
];

const PROCESSUS_STEPS = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90",  label: "Analyse",        desc: "Cadrage du projet" },
  { num: "02", icon: Palette,       color: "#60a5fa", rgb: "96,165,250",  label: "Prototype UX",   desc: "Maquettes validées" },
  { num: "03", icon: Code2,         color: ACCENT,    rgb: ACCENT_RGB,    label: "Développement",  desc: "Sprints agiles" },
  { num: "04", icon: CheckSquare,   color: "#4ade80", rgb: "74,222,128",  label: "Tests",          desc: "QA multi-devices" },
  { num: "05", icon: Globe,         color: "#a78bfa", rgb: "167,139,250", label: "Publication",    desc: "App Store & Play" },
];

const TABLE_INCLUS = [
  { label: "Application iOS (App Store)",          icon: Smartphone,   color: "251,113,133" },
  { label: "Application Android (Google Play)",    icon: Smartphone,   color: "96,165,250"  },
  { label: "Design UX/UI mobile complet",          icon: Palette,      color: "74,222,128"  },
  { label: "Backend & API sur mesure",             icon: Database,     color: "249,168,38"  },
  { label: "Notifications push",                   icon: Bell,         color: "244,114,182" },
  { label: "Authentification utilisateurs",        icon: Lock,         color: "167,139,250" },
  { label: "Mode hors ligne (cache local)",        icon: WifiOff,      color: "52,211,153"  },
  { label: "Maintenance & support post-lancement", icon: Shield,       color: "201,165,90"  },
];

const TEMOIGNAGES = [
  { name: "Julien F.",  activite: "Fondateur d'une app de réservation", note: 5, avis: "DJAMA a transformé mon idée en application fonctionnelle en moins de 3 mois. Design soigné, performances excellentes, et un accompagnement au top du début à la fin." },
  { name: "Sarah K.",  activite: "Directrice marketplace locale",       note: 5, avis: "Notre marketplace est en ligne sur iOS et Android. L'équipe a géré tout le processus — du design à la publication. On a 400 utilisateurs actifs le premier mois." },
  { name: "Marc D.",   activite: "Gérant d'une chaîne de restaurants",  note: 5, avis: "L'app de réservation a réduit nos no-shows de 30%. Les notifications push automatiques ont changé la donne. Je recommande sans hésitation." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps pour développer une application ?", a: "Un MVP fonctionnel est généralement livrable en 6 à 16 semaines selon la complexité. Nous découpons le projet en sprints pour vous livrer rapidement et valider au fur et à mesure." },
  { q: "Est-elle disponible sur iOS et Android ?", a: "Oui. Nous utilisons React Native ou Flutter pour livrer une application disponible sur les deux plateformes à partir d'une seule base de code, ce qui réduit les coûts et les délais." },
  { q: "Puis-je modifier l'application après la livraison ?", a: "Oui. Toutes nos apps sont documentées et conçues pour évoluer. Nous pouvons ajouter des fonctionnalités, corriger des bugs ou adapter l'interface selon vos retours utilisateurs." },
  { q: "La maintenance est-elle incluse ?", a: "Un suivi post-lancement est inclus. Pour une maintenance longue durée (mises à jour OS, nouvelles fonctionnalités, monitoring), nous proposons des contrats de maintenance dédiés." },
  { q: "Puis-je connecter mon application à mon site ou mon CRM ?", a: "Oui. Nous développons ou connectons des APIs pour intégrer votre app à vos outils existants : site web, CRM, ERP, base de données, paiement, analytics, etc." },
  { q: "Quel est le budget pour une application mobile ?", a: "Cela dépend de la complexité et du nombre de fonctionnalités. Contactez-nous pour une estimation transparente et personnalisée, sans engagement." },
];

const TYPE_APP_OPTIONS = ["Application de réservation", "Application de livraison", "Application communautaire", "App de marque / fidélité", "Outil de gestion interne", "Marketplace", "Autre"];
const PUBLIC_OPTIONS   = ["Grand public (B2C)", "Entreprises (B2B)", "Équipes internes", "Professionnels d'un secteur", "Autre"];

function isEmailValid(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function FieldInput({ icon: Icon, type = "text", placeholder, value, onChange, validate, required }: {
  icon: React.ElementType; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; validate?: (v: string) => boolean; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isValid = validate ? validate(value) : value.length > 0;
  const showOk  = touched && value && isValid;
  const showErr = touched && value && validate && !isValid;
  const border  = showErr ? "rgba(248,113,113,0.5)" : showOk ? "rgba(52,211,153,0.45)" : focused ? `rgba(${ACCENT_RGB},0.5)` : "rgba(255,255,255,0.09)";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200"
      style={{ borderColor: border, boxShadow: focused ? `0 0 0 3px rgba(${ACCENT_RGB},0.08)` : "none" }}>
      <Icon size={15} className="shrink-0" style={{ color: focused || value ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setTouched(true); }} required={required}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
      <AnimatePresence>
        {showOk && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckCircle2 size={14} className="text-[#34d399]" /></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function FieldSelect({ icon: Icon, placeholder, value, onChange, options }: {
  icon: React.ElementType; placeholder: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const border = value ? "rgba(52,211,153,0.35)" : focused ? `rgba(${ACCENT_RGB},0.45)` : "rgba(255,255,255,0.09)";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 transition-all duration-200" style={{ borderColor: border }}>
      <Icon size={15} className="shrink-0" style={{ color: value || focused ? ACCENT : "rgba(255,255,255,0.25)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}
        className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="pointer-events-none shrink-0 text-white/25" />
      {value && <CheckCircle2 size={13} className="shrink-0 text-[#34d399]" />}
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(251,113,133,0.25)] hover:shadow-sm" onClick={onToggle}>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <p className="text-sm font-semibold text-[#09090b] leading-relaxed">{q}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{ borderColor: open ? `rgba(${ACCENT_RGB},0.4)` : "rgba(0,0,0,0.1)", background: open ? `rgba(${ACCENT_RGB},0.08)` : "transparent" }}>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
            <ChevronDown size={14} style={{ color: open ? ACCENT : "#6b7280" }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <p className="border-t border-black/[0.05] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#4b5563]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DevisForm() {
  const [nom,      setNom]      = useState("");
  const [email,    setEmail]    = useState("");
  const [tel,      setTel]      = useState("");
  const [typeApp,  setTypeApp]  = useState("");
  const [publicVise, setPublicVise] = useState("");
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const canSubmit = nom && isEmailValid(email) && typeApp && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Application mobile — ${typeApp}${publicVise ? ` / ${publicVise}` : ""}`, message }) });
      if (!res.ok) throw new Error(); setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); } finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(251,113,133,0.12)]">
        <CheckCircle2 size={26} style={{ color: ACCENT }} />
      </div>
      <h3 className="mb-2 text-lg font-extrabold text-white">Demande envoyée !</h3>
      <p className="text-sm text-white/50">Nous vous répondons sous 24h pour analyser votre projet.</p>
    </motion.div>
  );

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport} transition={{ duration: 0.55, ease }} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={User} placeholder="Votre nom" value={nom} onChange={setNom} required />
        <FieldInput icon={Mail} type="email" placeholder="Adresse email" value={email} onChange={setEmail} validate={isEmailValid} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput icon={Phone} type="tel" placeholder="Téléphone (optionnel)" value={tel} onChange={setTel} />
        <FieldSelect icon={Smartphone} placeholder="Type d'application" value={typeApp} onChange={setTypeApp} options={TYPE_APP_OPTIONS} />
      </div>
      <FieldSelect icon={Users} placeholder="Public visé" value={publicVise} onChange={setPublicVise} options={PUBLIC_OPTIONS} />
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre besoin (concept, fonctionnalités clés, contexte, inspiration…)" value={message}
            onChange={(e) => setMessage(e.target.value)} rows={5} required
            className="flex-1 resize-none bg-transparent pb-4 text-sm text-white placeholder-white/25 outline-none" />
        </div>
        <div className="border-t border-white/[0.05] px-4 py-2 text-right">
          <span className="text-[0.6rem] text-white/20">{message.length} caractères</span>
        </div>
      </div>
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={!canSubmit || sending}
        className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Parler de mon application</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

export default function ApplicationMobilePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <>
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, #1a0810 0%, #0e0409 40%, #090306 70%, #050205 100%)",
            minHeight: "min(80vh, 720px)",
          }}>
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(251,113,133,0.04) 1.5px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(251,113,133,0.10) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)" }} />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 pb-16 pt-28 lg:flex-row lg:gap-16 lg:pb-0 lg:pt-0" style={{ minHeight: "min(80vh, 720px)" }}>

            {/* GAUCHE */}
            <div className="flex flex-1 flex-col items-start lg:py-16">
              <motion.div {...fadeIn} className="mb-7">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                  <ArrowLeft size={13} /> Tous les services
                </Link>
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold"
                style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.07)`, color: ACCENT }}>
                <Smartphone size={12} /> Application mobile
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                <MultiLineReveal lines={["Créez votre application", "mobile"]}
                  highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08} lineClassName="justify-start" />
              </h1>
              <FadeReveal delay={0.2}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Application iOS et Android sur mesure pour digitaliser votre activité et améliorer l'expérience de vos utilisateurs.
                </p>
              </FadeReveal>
              <FadeReveal delay={0.3}>
                <div className="mb-8 flex flex-wrap gap-3">
                  <Link href="/contact?besoin=Application+mobile" className="btn-primary px-7 py-3.5 text-sm">Parler de mon application <ArrowRight size={15} /></Link>
                  <Link href="#exemples" className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white">Voir des exemples</Link>
                </div>
              </FadeReveal>
              <FadeReveal delay={0.42}>
                <div className="flex flex-wrap gap-2.5">
                  {[{ emoji: "📱", label: "iOS & Android" }, { emoji: "⚡", label: "Performances optimisées" }, { emoji: "🔒", label: "Sécurité des données" }].map(({ emoji, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">{emoji} {label}</span>
                  ))}
                </div>
              </FadeReveal>
            </div>

            {/* DROITE — mockup smartphone */}
            <div className="w-full flex-shrink-0 lg:w-[46%] lg:py-12">
              <motion.div initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                className="relative mx-auto w-full max-w-[300px]">
                <div className="pointer-events-none absolute -inset-8 rounded-3xl blur-3xl"
                  style={{ background: "radial-gradient(ellipse, rgba(251,113,133,0.12) 0%, rgba(244,114,182,0.07) 50%, transparent 70%)" }} />

                {/* Smartphone shell */}
                <div className="relative mx-auto overflow-hidden rounded-[2.5rem] border-[6px] border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
                  style={{ background: "#0d0d0f", aspectRatio: "9/19" }}>
                  {/* Notch */}
                  <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full" style={{ background: "#0d0d0f", border: "2px solid rgba(255,255,255,0.06)" }} />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-4 pb-1 pt-3" style={{ background: "#111115" }}>
                    <span className="text-[0.5rem] font-bold text-white/40">9:41</span>
                    <div className="flex gap-1">
                      {[3, 4, 5].map(n => <div key={n} className="rounded-sm bg-white/40" style={{ width: 3, height: n }} />)}
                      <div className="ml-0.5 h-2 w-3 rounded-sm border border-white/30">
                        <div className="h-full rounded-sm bg-white/60" style={{ width: "70%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Header app */}
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5" style={{ background: "#111115" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.25)` }} />
                      <div className="h-2 w-14 rounded-full bg-white/30" />
                    </div>
                    <Bell size={12} style={{ color: ACCENT }} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2 p-3" style={{ background: "#0d0d0f" }}>
                    {/* Bannière */}
                    <div className="rounded-2xl p-3" style={{ background: `rgba(${ACCENT_RGB},0.08)` }}>
                      <div className="mb-1.5 h-1.5 w-16 rounded-full" style={{ background: `rgba(${ACCENT_RGB},0.5)` }} />
                      <div className="mb-1 h-3 w-4/5 rounded-full bg-white/40" />
                      <div className="mb-2.5 h-2 w-3/5 rounded-full bg-white/20" />
                      <div className="h-6 w-20 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.4)` }} />
                    </div>
                    {/* Cards stat */}
                    <div className="grid grid-cols-2 gap-2">
                      {[{ c: ACCENT_RGB, label: "Utilisateurs", val: "2.4k" }, { c: "96,165,250", label: "Sessions", val: "8.1k" }].map(({ c, label, val }) => (
                        <div key={label} className="rounded-2xl border border-white/[0.07] p-2.5" style={{ background: "#111115" }}>
                          <p className="mb-0.5 text-[0.55rem] text-white/35">{label}</p>
                          <p className="text-sm font-black" style={{ color: `rgb(${c})` }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    {/* Liste items */}
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] p-2.5" style={{ background: "#111115" }}>
                        <div className="h-8 w-8 shrink-0 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.1)` }} />
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-3/4 rounded-full bg-white/25" />
                          <div className="h-1 w-1/2 rounded-full bg-white/12" />
                        </div>
                        <div className="h-5 w-10 rounded-xl" style={{ background: `rgba(${ACCENT_RGB},0.2)` }} />
                      </div>
                    ))}
                  </div>

                  {/* Bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-white/[0.07] px-4 py-2.5" style={{ background: "#111115" }}>
                    {[LayoutDashboard, Users, Bell, Settings].map((Icon, i) => (
                      <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${i === 0 ? "" : ""}`}
                        style={{ background: i === 0 ? `rgba(${ACCENT_RGB},0.15)` : "transparent" }}>
                        <Icon size={13} style={{ color: i === 0 ? ACCENT : "rgba(255,255,255,0.3)" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badge iOS */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -right-4 top-16 hidden rounded-2xl border border-white/[0.12] px-3 py-2 shadow-xl lg:block" style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <Smartphone size={12} style={{ color: ACCENT }} />
                    <div><p className="text-[0.6rem] font-bold text-white">iOS & Android</p><p className="text-[0.55rem] text-white/35">Une seule codebase</p></div>
                  </div>
                </motion.div>
                {/* Badge performances */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85, duration: 0.5 }}
                  className="absolute -left-4 bottom-20 hidden rounded-2xl border border-white/[0.12] px-3 py-2 shadow-xl lg:block" style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <Zap size={12} style={{ color: "#f9a826" }} />
                    <div><p className="text-[0.6rem] font-bold text-white">MVP en 6–16 sem.</p><p className="text-[0.55rem] text-white/35">Livraison rapide</p></div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TYPES D'APPS */}
        <section className="bg-[#160a0d] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Applications que nous créons</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Types d'applications</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TYPES_APPS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CE QUE NOUS TRAVAILLONS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre approche</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que nous travaillons sur chaque app</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_NOUS_TRAVAILLONS.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* POUR QUI */}
        <section className="bg-[#160a0d] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Profils</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce service est fait pour vous si…</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POUR_QUI.map(({ icon: Icon, color, rgb, who, desc, tags }) => (
                <motion.div key={who} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{who}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-white/45">{desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => <span key={t} className="rounded-full border px-2.5 py-1 text-[0.6rem] font-medium" style={{ borderColor: `rgba(${rgb},0.25)`, color, background: `rgba(${rgb},0.07)` }}>{t}</span>)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* PROCESSUS — TIMELINE */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre processus</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">De l'idée à la publication</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-sm text-white/45">5 étapes claires pour aller de votre concept à une application publiée sur les stores.</motion.p>
            </motion.div>
            {/* Desktop horizontal */}
            <div className="hidden sm:block">
              <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="relative grid grid-cols-5 gap-0">
                <div className="absolute left-[10%] right-[10%] top-[28px] h-px"
                  style={{ background: `linear-gradient(90deg, rgba(${ACCENT_RGB},0.15), rgba(${ACCENT_RGB},0.4), rgba(${ACCENT_RGB},0.15))` }} />
                {PROCESSUS_STEPS.map(({ num, icon: Icon, color, rgb, label, desc }) => (
                  <motion.div key={num} variants={cardReveal} className="group flex flex-col items-center px-3 text-center">
                    <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 group-hover:scale-110"
                      style={{ background: `rgba(${rgb},0.12)`, borderColor: `rgba(${rgb},0.45)`, boxShadow: `0 0 20px rgba(${rgb},0.18)` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className="mb-1 text-[0.6rem] font-black uppercase tracking-widest" style={{ color: `rgba(${rgb},0.6)` }}>{num}</span>
                    <p className="mb-1 text-sm font-bold text-white">{label}</p>
                    <p className="text-[0.7rem] leading-relaxed text-white/40">{desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            {/* Mobile vertical */}
            <div className="sm:hidden">
              <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="space-y-0">
                {PROCESSUS_STEPS.map(({ num, icon: Icon, color, rgb, label, desc }, i) => (
                  <motion.div key={num} variants={cardReveal} className="relative flex gap-4">
                    {i < PROCESSUS_STEPS.length - 1 && (
                      <div className="absolute left-[19px] top-[48px] h-full w-px" style={{ background: `rgba(${rgb},0.2)` }} />
                    )}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ background: `rgba(${rgb},0.12)`, borderColor: `rgba(${rgb},0.4)` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 pb-6 pt-1">
                      <p className="mb-0.5 text-[0.6rem] font-black uppercase tracking-widest" style={{ color: `rgba(${rgb},0.6)` }}>{num} · {label}</p>
                      <p className="text-xs leading-relaxed text-white/50">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* TABLEAU DES FONCTIONNALITÉS */}
        <section className="bg-[#160a0d] py-14 sm:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans votre projet</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que vous obtenez</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-md text-sm text-white/45">Tout ce qui est compris dans chaque application mobile livrée par DJAMA.</motion.p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.5, ease }}
              className="overflow-hidden rounded-3xl border border-white/[0.10]">
              <div className="grid grid-cols-[1fr_80px] items-center border-b border-white/[0.10] px-5 py-3.5"
                style={{ background: "rgba(251,113,133,0.05)" }}>
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/35">Fonctionnalité</p>
                <p className="text-center text-[0.65rem] font-black uppercase tracking-widest text-white/35">Inclus</p>
              </div>
              {TABLE_INCLUS.map(({ label, icon: Icon, color }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport}
                  transition={{ duration: 0.35, delay: i * 0.06, ease }}
                  className={`grid grid-cols-[1fr_80px] items-center px-5 py-4 transition-all hover:bg-white/[0.03] ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${color},0.1)` }}>
                      <Icon size={14} style={{ color: `rgb(${color})` }} />
                    </div>
                    <p className="text-sm text-white/80">{label}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: "rgba(251,113,133,0.12)", border: "1px solid rgba(251,113,133,0.3)" }}>
                      <CheckCircle2 size={13} style={{ color: ACCENT }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* EXEMPLES D'APPLICATIONS */}
        <section id="exemples" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Références</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Exemples d'applications créées</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-sm text-white/45">Quelques applications réalisées pour nos clients, de différents secteurs.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid items-start gap-6 sm:grid-cols-3">
              {EXEMPLES_PROJETS.map(({ icon: Icon, color, rgb, titre, desc, resultat }, idx) => (
                <motion.div key={titre} variants={cardReveal}
                  className="overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.06]">
                  {/* Mini smartphone mockup */}
                  <div className="flex items-center justify-center py-6" style={{ background: "#111115" }}>
                    <div className="relative overflow-hidden rounded-[1.5rem] border-[4px] border-white/[0.10] shadow-xl"
                      style={{ background: "#0d0d0f", width: 100, aspectRatio: "9/19" }}>
                      {/* Header */}
                      <div className="border-b border-white/[0.08] px-2 py-1.5" style={{ background: "#111115" }}>
                        <div className="h-1 w-8 rounded-full bg-white/20 mx-auto" />
                      </div>
                      {/* App content */}
                      <div className="p-2 space-y-1.5">
                        <div className="rounded-lg p-2" style={{ background: `rgba(${rgb},0.1)` }}>
                          <div className="mb-1 h-1.5 w-full rounded-full" style={{ background: `rgba(${rgb},0.4)` }} />
                          <div className="h-1 w-3/4 rounded-full bg-white/20" />
                        </div>
                        {[1, 2, 3].map(n => (
                          <div key={n} className="flex items-center gap-1.5 rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="h-5 w-5 shrink-0 rounded-lg" style={{ background: `rgba(${rgb},0.15)` }} />
                            <div className="flex-1 space-y-0.5">
                              <div className="h-1 w-full rounded-full bg-white/20" />
                              <div className="h-1 w-2/3 rounded-full bg-white/10" />
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Bottom nav */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-white/[0.07] py-1.5" style={{ background: "#111115" }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="h-3 w-3 rounded-full" style={{ background: i === 0 ? `rgba(${rgb},0.5)` : "rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Texte */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${rgb},0.12)` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white">{titre}</h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-white/50">{desc}</p>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: `rgba(${rgb},0.25)`, background: `rgba(${rgb},0.06)` }}>
                      <TrendingUp size={11} style={{ color }} />
                      <p className="text-[0.65rem] font-semibold leading-tight" style={{ color }}>{resultat}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* TÉMOIGNAGES */}
        <section className="bg-[#160a0d] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Avis clients</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que disent nos clients</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid items-start gap-5 sm:grid-cols-3">
              {TEMOIGNAGES.map(({ name, activite, note, avis }) => (
                <motion.div key={name} variants={cardReveal}
                  className="flex flex-col rounded-3xl border border-white/[0.10] bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/[0.17] hover:bg-white/[0.07]">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: note }).map((_, i) => <Star key={i} size={13} fill="#f9a826" style={{ color: "#f9a826" }} />)}
                  </div>
                  <Quote size={20} className="mb-3 opacity-20" style={{ color: ACCENT }} />
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-white/65">{avis}</p>
                  <div className="flex items-center gap-3 border-t border-white/[0.07] pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-[0.65rem] font-black"
                      style={{ background: `rgba(${ACCENT_RGB},0.15)`, color: ACCENT }}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{name}</p>
                      <p className="text-[0.65rem] text-white/35">{activite}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA DEVIS */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport}>
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Parlons de votre application</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mb-8 max-w-md text-sm text-white/60">
                Décrivez votre idée — on analyse la faisabilité et on revient vers vous sous 24h avec une proposition.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
                <Link href="/contact?besoin=Application+mobile" className="btn-primary px-8 py-4 text-base">
                  Parler de mon application <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.p variants={fadeIn} className="mt-5 text-xs text-white/25">🔒 Sans engagement · Réponse sous 24h · Devis gratuit</motion.p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#160a0d] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Questions fréquentes</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Vous avez des questions ?</motion.h2>
            </motion.div>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => <FaqItem key={i} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-[#160a0d] pb-14 pt-14 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Lancez votre application mobile</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Partagez votre concept — on le transforme en application iOS & Android professionnelle, utile et agréable à utiliser.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact?besoin=Application+mobile" className="btn-primary px-8 py-4 text-base">Parler de mon application <ArrowRight size={16} /></Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">Voir tous nos services</Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
