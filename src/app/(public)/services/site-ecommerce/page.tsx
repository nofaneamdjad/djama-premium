"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
  Zap, User, Mail, Phone, MessageSquare, Loader2, Send, ArrowLeft,
  CreditCard, Package, Users, Settings, Smartphone, Shield,
  TrendingUp, Star, Briefcase, Globe, BarChart3, Truck,
  Quote, CheckSquare, Palette, Code2, LayoutDashboard,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainer, staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ease       = [0.16, 1, 0.3, 1] as const;
const ACCENT     = "#f97316";
const ACCENT_RGB = "249,115,22";

const CE_QUE_COMPREND = [
  { icon: Package,     color: "#60a5fa", rgb: "96,165,250",  title: "Pages produits",          desc: "Fiches produits complètes avec photos, descriptions, variantes (taille, couleur) et avis clients." },
  { icon: ShoppingCart,color: ACCENT,    rgb: ACCENT_RGB,    title: "Panier & tunnel d'achat", desc: "Parcours d'achat fluide et optimisé pour réduire l'abandon panier et maximiser les conversions." },
  { icon: CreditCard,  color: "#4ade80", rgb: "74,222,128",  title: "Paiement intégré",        desc: "Stripe, PayPal, carte bancaire — paiements sécurisés avec gestion des remboursements et abonnements." },
  { icon: Settings,    color: "#f9a826", rgb: "249,168,38",  title: "Gestion des commandes",   desc: "Interface d'administration pour gérer les commandes, les stocks, les expéditions et les retours." },
  { icon: Users,       color: "#f472b6", rgb: "244,114,182", title: "Espace client",           desc: "Création de compte, suivi des commandes, historique d'achats et gestion des adresses de livraison." },
  { icon: Smartphone,  color: "#a78bfa", rgb: "167,139,250", title: "Responsive mobile",       desc: "Expérience d'achat optimisée sur smartphone — aujourd'hui plus de 60% des achats se font sur mobile." },
];

const POUR_QUI = [
  { icon: Briefcase,  color: "#60a5fa", rgb: "96,165,250", who: "Entrepreneurs",         desc: "Vous lancez un nouveau produit ou voulez vendre en ligne sans gérer une infrastructure complexe.",       tags: ["Lancement", "Produits", "Vente"] },
  { icon: Star,       color: ACCENT,    rgb: ACCENT_RGB,   who: "Commerces physiques",   desc: "Complétez votre boutique physique avec un canal de vente en ligne disponible 24h/24.",                    tags: ["Click & Collect", "Stock unifié", "Local"] },
  { icon: Globe,      color: "#4ade80", rgb: "74,222,128", who: "Marques & créateurs",   desc: "Artisans, créateurs, marques de niche — vendez directement à vos clients sans intermédiaire.",            tags: ["DTC", "Marque", "Artisan"] },
  { icon: TrendingUp, color: "#f9a826", rgb: "249,168,38", who: "Revendeurs & dropshipping", desc: "Boutique multi-produits, intégration fournisseurs, gestion des marges et synchronisation des stocks.", tags: ["Dropshipping", "Multi-produits", "Flux"] },
];

const POURQUOI_VENDRE = [
  { icon: Globe,     color: "#60a5fa", rgb: "96,165,250", title: "Vendre 24h/24, 7j/7",       desc: "Votre boutique ne ferme jamais. Générez des ventes même pendant votre sommeil, dans le monde entier." },
  { icon: TrendingUp,color: ACCENT,    rgb: ACCENT_RGB,   title: "Croissance scalable",        desc: "Pas de limite physique de stock ou de superficie — ajoutez des produits et des marchés à volonté." },
  { icon: BarChart3, color: "#4ade80", rgb: "74,222,128", title: "Données & analytics",        desc: "Suivez vos ventes, panier moyen, taux de conversion et comportement clients en temps réel." },
  { icon: Shield,    color: "#f9a826", rgb: "249,168,38", title: "Paiements sécurisés",        desc: "Vos clients paient en toute confiance — certificat SSL, conformité PCI DSS, protection anti-fraude." },
];

const ETAPES = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90",  title: "Analyse du projet",       desc: "On étudie votre catalogue, votre logistique, vos cibles et vos concurrents pour poser les bases." },
  { num: "02", icon: ShoppingCart,  color: "#60a5fa", rgb: "96,165,250",  title: "Design & maquette",       desc: "Design de la boutique, parcours d'achat optimisé, mise en valeur des produits et de la marque." },
  { num: "03", icon: Settings,      color: ACCENT,    rgb: ACCENT_RGB,    title: "Développement & intégration", desc: "Développement de la boutique, intégration des produits, paramétrage des paiements et livraisons." },
  { num: "04", icon: CheckCircle2,  color: "#4ade80", rgb: "74,222,128",  title: "Lancement & formation",   desc: "Mise en ligne, tests complets, formation à l'administration de la boutique et suivi post-lancement." },
];

const CE_QUE_VOUS_OBTENEZ = [
  { label: "Design boutique",    desc: "Charte graphique, pages produits, page panier, tunnel d'achat — optimisés conversion.",          icon: Star,       color: "249,115,22"  },
  { label: "Catalogue produits", desc: "Intégration de votre catalogue, variantes, descriptions, photos et gestion des stocks.",          icon: Package,    color: "96,165,250"  },
  { label: "Paiement sécurisé",  desc: "Stripe, PayPal, carte bancaire — intégration complète avec gestion des remboursements.",          icon: CreditCard, color: "74,222,128"  },
  { label: "Espace client",      desc: "Compte client, suivi des commandes, historique d'achats, adresses de livraison.",                 icon: Users,      color: "249,168,38"  },
  { label: "Mobile-first",       desc: "Boutique optimisée pour mobile — plus de 60% des achats se font sur smartphone.",                 icon: Smartphone, color: "244,114,182" },
  { label: "Formation & support",desc: "Formation à l'administration de la boutique, ajout de produits, gestion des commandes.",          icon: Shield,     color: "167,139,250" },
];

const EXEMPLES_PROJETS = [
  { icon: Package, color: "#f97316", rgb: "249,115,22",  titre: "Boutique de cosmétiques",    desc: "Boutique DTC avec 80 produits, programme de fidélité, abonnements mensuels et intégration Stripe.",                  resultat: "12K€ de CA le 1er mois d'ouverture" },
  { icon: Truck,   color: "#60a5fa", rgb: "96,165,250",  titre: "Marketplace multi-vendeurs", desc: "Plateforme mettant en relation artisans et acheteurs — espace vendeur dédié, commissions automatisées.",             resultat: "40 vendeurs actifs en 6 mois" },
  { icon: Globe,   color: "#4ade80", rgb: "74,222,128",  titre: "Boutique digitale",          desc: "Vente de formations en ligne et produits téléchargeables avec accès sécurisé et livraison instantanée.",             resultat: "0 retour client, 4.9/5 de satisfaction" },
];

const PROCESSUS_STEPS = [
  { num: "01", icon: MessageSquare, color: "#c9a55a", rgb: "201,165,90",  label: "Analyse",       desc: "Étude de votre projet" },
  { num: "02", icon: Palette,       color: "#60a5fa", rgb: "96,165,250",  label: "Design",        desc: "Maquette validée" },
  { num: "03", icon: Code2,         color: ACCENT,    rgb: ACCENT_RGB,    label: "Développement", desc: "Boutique sur mesure" },
  { num: "04", icon: CreditCard,    color: "#4ade80", rgb: "74,222,128",  label: "Paiement",      desc: "Intégration Stripe" },
  { num: "05", icon: Globe,         color: "#a78bfa", rgb: "167,139,250", label: "Mise en ligne", desc: "Lancement & suivi" },
];

const TABLE_INCLUS = [
  { label: "Catalogue produits (variantes, photos, stocks)", icon: Package,       color: "249,115,22"  },
  { label: "Paiement sécurisé (Stripe / PayPal)",           icon: CreditCard,    color: "96,165,250"  },
  { label: "Gestion des commandes & expéditions",           icon: Truck,         color: "74,222,128"  },
  { label: "Espace client & suivi de commande",             icon: Users,         color: "249,168,38"  },
  { label: "Responsive mobile-first",                       icon: Smartphone,    color: "244,114,182" },
  { label: "SEO e-commerce (métas, schema, sitemap)",       icon: BarChart3,     color: "167,139,250" },
  { label: "Tableau de bord admin",                         icon: LayoutDashboard, color: "52,211,153"},
  { label: "Formation & support post-lancement",            icon: Shield,        color: "201,165,90"  },
];

const TEMOIGNAGES = [
  { name: "Aïcha M.", activite: "Boutique cosmétiques", note: 5, avis: "Boutique livrée en 3 semaines. Design impeccable, tunnel d'achat fluide. On a fait 12K€ de CA le premier mois — au-delà de nos espérances." },
  { name: "Kevin R.",  activite: "Créateur de contenu", note: 5, avis: "Je vends mes formations en ligne depuis ma boutique DJAMA. Tout est automatisé — livraison instantanée, accès sécurisé. Zéro prise de tête." },
  { name: "Sophie L.", activite: "Artisane bijoux",     note: 5, avis: "Mon site est beau, rapide et mon téléphone sonne depuis. L'équipe a tout expliqué et est toujours disponible. Je recommande à 100%." },
];

const FAQ_ITEMS = [
  { q: "Combien de temps pour créer une boutique ?", a: "Entre 3 et 8 semaines selon la complexité. Un catalogue de moins de 50 produits peut être livré en 2 à 3 semaines. Nous découpons le projet en étapes pour vous livrer rapidement." },
  { q: "Quels moyens de paiement sont disponibles ?", a: "Nous intégrons Stripe (carte bancaire, Apple Pay, Google Pay), PayPal et tout autre moyen conforme PCI DSS. Les paiements sont sécurisés avec certificat SSL." },
  { q: "Puis-je gérer mes produits moi-même ?", a: "Oui. Vous disposez d'une interface d'administration pour ajouter, modifier, archiver vos produits et gérer vos commandes, sans aucune compétence technique." },
  { q: "La boutique est-elle optimisée mobile ?", a: "Absolument. Nous développons en mobile-first : plus de 60% des achats se font sur smartphone. Votre boutique est parfaite sur tous les écrans." },
  { q: "Puis-je ajouter des produits facilement ?", a: "Oui. L'interface admin vous permet d'ajouter des produits, variantes, photos et prix en quelques clics. Nous vous formons à l'utilisation à la livraison." },
  { q: "Quel est le budget pour un site e-commerce ?", a: "Cela dépend du nombre de produits et des fonctionnalités. Contactez-nous pour un devis transparent et personnalisé, sans engagement." },
];

const TYPE_PRODUITS_OPTIONS = ["Produits physiques", "Produits numériques / téléchargements", "Services en ligne", "Abonnements", "Mix produits physiques et numériques", "Autre"];
const NB_PRODUITS_OPTIONS   = ["Moins de 20 produits", "20 à 100 produits", "100 à 500 produits", "Plus de 500 produits"];

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
    <div className="cursor-pointer rounded-2xl border border-white/[0.07] bg-white transition-all duration-200 hover:border-[rgba(249,115,22,0.25)] hover:shadow-sm" onClick={onToggle}>
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
  const [nom,        setNom]        = useState("");
  const [email,      setEmail]      = useState("");
  const [tel,        setTel]        = useState("");
  const [typeProduits, setTypeProduits] = useState("");
  const [nbProduits, setNbProduits] = useState("");
  const [message,    setMessage]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const canSubmit = nom && isEmailValid(email) && typeProduits && message.length > 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!canSubmit) return;
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, phone: tel, source: "devis",
          subject: `Site e-commerce — ${typeProduits}${nbProduits ? ` / ${nbProduits}` : ""}`, message }) });
      if (!res.ok) throw new Error(); setSent(true);
    } catch { setError("Une erreur est survenue. Réessayez ou contactez-nous directement."); } finally { setSending(false); }
  }

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-[rgba(249,115,22,0.25)] bg-[rgba(249,115,22,0.05)] p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(249,115,22,0.12)]">
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
        <FieldSelect icon={Package} placeholder="Type de produits" value={typeProduits} onChange={setTypeProduits} options={TYPE_PRODUITS_OPTIONS} />
      </div>
      <FieldSelect icon={ShoppingCart} placeholder="Nombre approximatif de produits" value={nbProduits} onChange={setNbProduits} options={NB_PRODUITS_OPTIONS} />
      <div className="rounded-2xl border bg-white/[0.04] transition-all duration-200"
        style={{ borderColor: message.length > 5 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.09)" }}>
        <div className="flex items-start gap-3 px-4 pt-4">
          <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: message ? ACCENT : "rgba(255,255,255,0.25)" }} />
          <textarea placeholder="Décrivez votre projet (produits, cible, fonctionnalités souhaitées, concurrents…)" value={message}
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
        {sending ? <><Loader2 size={17} className="animate-spin" /> Envoi en cours…</> : <><Send size={17} /> Lancer ma boutique</>}
      </button>
      <p className="text-center text-[0.68rem] text-white/20">🔒 Confidentialité garantie · Réponse sous 24h · Sans engagement</p>
    </motion.form>
  );
}

export default function SiteEcommercePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, #1a0e06 0%, #0f0702 40%, #0a0603 70%, #060402 100%)",
            minHeight: "min(80vh, 720px)",
          }}
        >
          {/* Grille de fond */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgba(249,115,22,0.04) 1.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(249,168,38,0.07) 0%, transparent 70%)" }} />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 pb-16 pt-28 lg:flex-row lg:gap-16 lg:pb-0 lg:pt-0" style={{ minHeight: "min(80vh, 720px)" }}>

            {/* ── GAUCHE ── */}
            <div className="flex flex-1 flex-col items-start lg:py-16">
              <motion.div {...fadeIn} className="mb-7">
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50 transition-colors hover:text-white">
                  <ArrowLeft size={13} /> Tous les services
                </Link>
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold"
                style={{ borderColor: `rgba(${ACCENT_RGB},0.3)`, background: `rgba(${ACCENT_RGB},0.07)`, color: ACCENT }}>
                <ShoppingCart size={12} /> Boutique e-commerce
              </motion.div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                <MultiLineReveal
                  lines={["Créez votre boutique", "en ligne"]}
                  highlight={1} stagger={0.12} wordStagger={0.055} delay={0.08}
                  lineClassName="justify-start"
                />
              </h1>
              <FadeReveal delay={0.2}>
                <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
                  Une boutique e-commerce rapide, sécurisée et optimisée pour vendre vos produits en ligne — prête à générer des ventes dès le lancement.
                </p>
              </FadeReveal>
              <FadeReveal delay={0.3}>
                <div className="mb-8 flex flex-wrap gap-3">
                  <Link href="#devis" className="btn-primary px-7 py-3.5 text-sm">
                    Lancer ma boutique <ArrowRight size={15} />
                  </Link>
                  <Link href="#exemples"
                    className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/[0.1] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/65 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
                    Voir des exemples
                  </Link>
                </div>
              </FadeReveal>
              <FadeReveal delay={0.42}>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { emoji: "💳", label: "Paiement sécurisé" },
                    { emoji: "📦", label: "Gestion des commandes" },
                    { emoji: "📱", label: "Mobile first" },
                  ].map(({ emoji, label }) => (
                    <span key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
                      {emoji} {label}
                    </span>
                  ))}
                </div>
              </FadeReveal>
            </div>

            {/* ── DROITE : mockup boutique ── */}
            <div className="w-full flex-shrink-0 lg:w-[52%] lg:py-12">
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                className="relative mx-auto w-full max-w-[560px]"
              >
                <div className="pointer-events-none absolute -inset-6 rounded-3xl blur-3xl"
                  style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.10) 0%, rgba(249,168,38,0.06) 50%, transparent 70%)" }} />

                {/* Fenêtre navigateur */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                  style={{ background: "#0d0d0f" }}>
                  {/* Barre nav */}
                  <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3" style={{ background: "#111115" }}>
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                      <span className="flex-1 text-[0.6rem] text-white/30">www.ma-boutique.fr</span>
                      <Shield size={10} className="text-white/20" />
                    </div>
                  </div>

                  {/* Header boutique */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3" style={{ background: "#0a0a0c" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md" style={{ background: `rgba(${ACCENT_RGB},0.25)` }} />
                      <div className="h-2 w-20 rounded-full bg-white/20" />
                    </div>
                    <div className="hidden items-center gap-4 sm:flex">
                      {["Boutique", "Collections", "Promotions"].map((t) => (
                        <div key={t} className="h-1.5 rounded-full bg-white/15" style={{ width: `${t.length * 5}px` }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "rgba(249,115,22,0.15)" }}>
                        <ShoppingCart size={10} style={{ color: ACCENT }} />
                      </div>
                    </div>
                  </div>

                  {/* Grille produits */}
                  <div className="p-4" style={{ background: "#0d0d0f" }}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="h-2 w-24 rounded-full bg-white/20" />
                      <div className="flex gap-1.5">
                        {["Tous", "Nouveautés", "Promos"].map((f) => (
                          <div key={f} className="rounded-full px-2 py-0.5 text-[0.5rem]"
                            style={{ background: f === "Tous" ? `rgba(${ACCENT_RGB},0.2)` : "rgba(255,255,255,0.05)", color: f === "Tous" ? ACCENT : "rgba(255,255,255,0.3)" }}>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { c: ACCENT_RGB, price: "29€", label: "Produit 1" },
                        { c: "96,165,250", price: "49€", label: "Produit 2" },
                        { c: "249,168,38", price: "19€", label: "Produit 3" },
                      ].map(({ c, price, label }, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-white/[0.07]" style={{ background: "#111115" }}>
                          <div className="flex h-14 items-center justify-center" style={{ background: `rgba(${c},0.08)` }}>
                            <Package size={16} style={{ color: `rgb(${c})` }} />
                          </div>
                          <div className="p-2">
                            <div className="mb-1 h-1.5 w-full rounded-full bg-white/20" />
                            <div className="flex items-center justify-between">
                              <span className="text-[0.55rem] font-black" style={{ color: `rgb(${c})` }}>{price}</span>
                              <div className="h-4 w-4 rounded-md" style={{ background: `rgba(${c},0.2)` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Panier */}
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2" style={{ background: "#111115" }}>
                      <ShoppingCart size={11} style={{ color: ACCENT }} />
                      <div className="flex-1">
                        <div className="h-1.5 w-2/3 rounded-full bg-white/15" />
                      </div>
                      <div className="rounded-lg px-2 py-1 text-[0.55rem] font-bold" style={{ background: `rgba(${ACCENT_RGB},0.25)`, color: ACCENT }}>
                        Acheter
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge paiement sécurisé */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -right-3 top-14 hidden rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl lg:block"
                  style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <CreditCard size={13} style={{ color: ACCENT }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">Paiement sécurisé</p>
                      <p className="text-[0.55rem] text-white/35">Stripe & PayPal</p>
                    </div>
                  </div>
                </motion.div>

                {/* Badge ventes */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  className="absolute -left-3 bottom-14 hidden rounded-2xl border border-white/[0.12] px-3.5 py-2.5 shadow-xl lg:block"
                  style={{ background: "#141418" }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} style={{ color: "#4ade80" }} />
                    <div>
                      <p className="text-[0.6rem] font-bold text-white">Prêt à vendre</p>
                      <p className="text-[0.55rem] text-white/35">Dès le lancement</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CE QUE COMPREND LA BOUTIQUE */}
        <section className="bg-[#150900] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans le service</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que comprend votre boutique</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CE_QUE_COMPREND.map(({ icon: Icon, color, rgb, title, desc }) => (
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
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Profils concernés</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pour qui est ce service ?</motion.h2>
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

        {/* POURQUOI VENDRE EN LIGNE */}
        <section className="bg-[#150900] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Les bénéfices</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Pourquoi vendre en ligne avec une boutique propre</motion.h2>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {POURQUOI_VENDRE.map(({ icon: Icon, color, rgb, title, desc }) => (
                <motion.div key={title} variants={cardReveal} className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `rgba(${rgb},0.1)` }}><Icon size={20} style={{ color }} /></div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-white/45">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* PROCESSUS — TIMELINE */}
        <section className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-14 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Notre méthode</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Processus de création</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-sm text-white/45">De l'analyse à la mise en ligne — une méthode éprouvée en 5 étapes claires.</motion.p>
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
        <section className="bg-[#150900] py-14 sm:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Inclus dans votre boutique</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Ce que vous obtenez</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-md text-sm text-white/45">Tout ce qui est compris dans chaque boutique e-commerce livrée par DJAMA.</motion.p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.5, ease }}
              className="overflow-hidden rounded-3xl border border-white/[0.10]">
              <div className="grid grid-cols-[1fr_80px] items-center border-b border-white/[0.10] px-5 py-3.5"
                style={{ background: "rgba(249,115,22,0.05)" }}>
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
                      style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)" }}>
                      <CheckCircle2 size={13} style={{ color: ACCENT }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* EXEMPLES DE BOUTIQUES */}
        <section id="exemples" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-12 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Références</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Exemples de boutiques créées</motion.h2>
              <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-lg text-sm text-white/45">Quelques boutiques réalisées pour nos clients, de différents secteurs.</motion.p>
            </motion.div>
            <motion.div variants={staggerContainerFast} initial="hidden" whileInView="show" viewport={viewport} className="grid items-start gap-6 sm:grid-cols-3">
              {EXEMPLES_PROJETS.map(({ icon: Icon, color, rgb, titre, desc, resultat }, idx) => (
                <motion.div key={titre} variants={cardReveal}
                  className="overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.06]">
                  {/* Mini boutique mockup */}
                  <div className="relative overflow-hidden border-b border-white/[0.08]" style={{ background: "#0d0d0f" }}>
                    <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2" style={{ background: "#111115" }}>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                        <div className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                        <div className="h-2 w-2 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="flex flex-1 items-center gap-1 rounded px-2 py-0.5 text-[0.5rem] text-white/20" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-1 w-1 rounded-full" style={{ background: color }} />
                        {idx === 0 ? "boutique-mode.fr" : idx === 1 ? "ma-bijouterie.fr" : "mes-creations.fr"}
                      </div>
                      <div className="flex h-4 w-4 items-center justify-center rounded" style={{ background: `rgba(${rgb},0.2)` }}>
                        <ShoppingCart size={8} style={{ color }} />
                      </div>
                    </div>
                    <div className="p-3">
                      {/* Banner */}
                      <div className="mb-2 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: `rgba(${rgb},0.08)` }}>
                        <div>
                          <div className="mb-1 h-1.5 w-20 rounded-full" style={{ background: `rgba(${rgb},0.5)` }} />
                          <div className="h-2.5 w-28 rounded-full bg-white/35" />
                        </div>
                        <div className="h-6 w-14 rounded-lg" style={{ background: `rgba(${rgb},0.35)` }} />
                      </div>
                      {/* Produits grid */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="overflow-hidden rounded-lg border border-white/[0.06]" style={{ background: "#111115" }}>
                            <div className="flex h-10 items-center justify-center" style={{ background: `rgba(${rgb},0.06)` }}>
                              <Package size={11} style={{ color: `rgb(${rgb})` }} />
                            </div>
                            <div className="px-1.5 py-1">
                              <div className="mb-0.5 h-1 w-full rounded-full bg-white/15" />
                              <div className="h-1.5 w-1/2 rounded-full" style={{ background: `rgba(${rgb},0.3)` }} />
                            </div>
                          </div>
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
        <section className="bg-[#150900] py-14 sm:py-24">
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
                    {Array.from({ length: note }).map((_, i) => (
                      <Star key={i} size={13} fill="#f9a826" style={{ color: "#f9a826" }} />
                    ))}
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

        {/* FORMULAIRE */}
        <section id="devis" className="bg-[#09090b] py-14 sm:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewport} className="mb-10 text-center">
              <motion.p variants={fadeIn} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Passez à l'action</motion.p>
              <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">Lancez votre boutique</motion.h2>
              <motion.p variants={fadeIn} className="mt-4 text-sm text-white/45">Décrivez votre projet e-commerce — on revient vers vous sous 24h avec une approche personnalisée.</motion.p>
            </motion.div>
            <DevisForm />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#150900] py-14 sm:py-24">
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
        <section className="relative overflow-hidden bg-[#150900] pb-14 pt-14 sm:pb-24 sm:pt-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: `radial-gradient(ellipse, rgba(${ACCENT_RGB},0.4) 0%, transparent 70%)` }} />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport} transition={{ duration: 0.6, ease }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `rgba(${ACCENT_RGB},0.12)` }}>
                <Sparkles size={26} style={{ color: ACCENT }} />
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Lancez votre boutique en ligne</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/50 max-w-md mx-auto">Boutique clé en main, optimisée pour convertir, prête à accueillir vos premiers clients dès le lancement.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="#devis" className="btn-primary px-8 py-4 text-base">Créer ma boutique <ArrowRight size={16} /></Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/70 transition-all hover:bg-white/[0.07] hover:text-white">Voir tous nos services</Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
