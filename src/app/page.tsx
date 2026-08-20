"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Mail, Users2, Shield, ShieldCheck,
  CheckCircle2, Sparkles, HeartHandshake,
  Globe, Brain, Check, X,
  Code2, BarChart3, Briefcase,
  Receipt, CalendarRange, StickyNote, Timer, CreditCard, Gem, Star,
  Truck, Package, ListTodo, Zap, Wallet, Building2, Banknote,
  Network, FolderOpen, Share2, ShoppingBag, Bot, BarChart2,
  Store, Contact2, CalendarPlus, QrCode, PenLine, ShoppingCart,
  Landmark, FileCheck2, BookOpen, Target,
  MessageCircle, Gift, Search, Clock, GraduationCap, UserPlus, Video, Mic,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import StripeButton from "@/components/ui/StripeButton";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref  = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !done.current) {
        done.current = true;
        let n = 0;
        const step = Math.max(1, Math.ceil(to / 40));
        const id = setInterval(() => {
          n = Math.min(n + step, to);
          setCount(n);
          if (n >= to) clearInterval(id);
        }, 22);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function SmartStat({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  return <><CountUp to={parseInt(match[1], 10)} />{match[2]}</>;
}

const SCHEMA_STEPS = [
  { num: "01", icon: Sparkles,  color: GOLD,       bg: `rgba(${GOLDR},.07)`,    border: `rgba(${GOLDR},.22)`,    title: "Idée / besoin",               desc: "Vous arrivez avec un besoin, un projet ou un problème à résoudre." },
  { num: "02", icon: Brain,     color: "#a78bfa",  bg: "rgba(167,139,250,.07)", border: "rgba(167,139,250,.22)", title: "Assistant IA DJAMA",          desc: "L'IA vous guide, clarifie vos options et vous aide à choisir la bonne direction." },
  { num: "03", icon: Code2,     color: "#60a5fa",  bg: "rgba(96,165,250,.07)",  border: "rgba(96,165,250,.22)",  title: "Construction de la solution", desc: "Site, application, outil métier, automatisation ou espace client sur mesure." },
  { num: "04", icon: BarChart3, color: "#4ade80",  bg: "rgba(74,222,128,.06)",  border: "rgba(74,222,128,.20)",  title: "Croissance & gestion",        desc: "Vous pilotez, améliorez et développez votre activité avec une base solide." },
] as const;

const TICKER_ITEMS = [
  "Sites web", "Plateformes SaaS", "Automatisation", "Applications",
  "E-commerce", "Outils métiers", "IA", "Design", "SEO",
] as const;

const TOOL_GROUPS_LANDING = [
  {
    label: "Finance", color: "#059669", bg: "#d1fae5", icon: Wallet,
    tools: [
      { icon: Receipt,      label: "Factures & Devis" },
      { icon: CreditCard,   label: "Dépenses" },
      { icon: Wallet,       label: "Trésorerie" },
      { icon: BarChart2,    label: "Comptabilité IA" },
      { icon: Landmark,     label: "Connexion bancaire" },
      { icon: FileCheck2,   label: "Déclarations" },
    ],
  },
  {
    label: "Commercial", color: "#7c3aed", bg: "#ede9fe", icon: Users2,
    tools: [
      { icon: Users2,    label: "CRM Clients" },
      { icon: ShieldCheck, label: "Contrats IA" },
      { icon: Truck,     label: "Fournisseurs" },
      { icon: Package,   label: "Stocks" },
    ],
  },
  {
    label: "Opérations", color: "#4f46e5", bg: "#e0e7ff", icon: CalendarRange,
    tools: [
      { icon: ListTodo,      label: "Tâches" },
      { icon: CalendarRange, label: "Planning" },
      { icon: Users2,        label: "Équipe" },
      { icon: Timer,         label: "Chrono" },
    ],
  },
  {
    label: "Notes & Docs", color: "#92400e", bg: "#fef3c7", icon: StickyNote,
    tools: [
      { icon: StickyNote,  label: "Notes IA" },
      { icon: CheckCircle2, label: "Checklists" },
      { icon: Globe,       label: "Scanner" },
      { icon: Network,     label: "Mind Map" },
    ],
  },
  {
    label: "Intelligence IA", color: "#6d28d9", bg: "#f3e8ff", icon: Brain,
    tools: [
      { icon: Globe,       label: "Sourcing IA" },
      { icon: Zap,         label: "Assistant IA" },
      { icon: FolderOpen,  label: "Projets" },
      { icon: Share2,      label: "Réseaux Sociaux IA" },
      { icon: Brain,       label: "Coaching IA" },
    ],
  },
  {
    label: "Ventes", color: "#ec4899", bg: "#fce7f3", icon: ShoppingBag,
    tools: [
      { icon: CalendarPlus, label: "Rendez-vous" },
      { icon: QrCode,       label: "Liens paiement" },
      { icon: PenLine,      label: "Signature" },
      { icon: ShoppingBag,  label: "Boutique" },
      { icon: ShoppingCart, label: "Caisse POS" },
    ],
  },
  {
    label: "Digital", color: "#0891b2", bg: "#e0f2fe", icon: BarChart2,
    tools: [
      { icon: Mail,       label: "Email Marketing" },
      { icon: Bot,        label: "Chatbot IA" },
      { icon: BarChart2,  label: "Analytics" },
      { icon: Store,      label: "Marketplace" },
      { icon: Contact2,   label: "Carte de visite" },
    ],
  },
  {
    label: "Gestion", color: "#3b82f6", bg: "#dbeafe", icon: Building2,
    tools: [
      { icon: Building2,   label: "Portail Client" },
      { icon: Banknote,    label: "Paie & RH" },
      { icon: Star,        label: "Réputation" },
      { icon: BookOpen,    label: "Blog" },
      { icon: Globe,       label: "Créateur de site IA" },
      { icon: Target,      label: "Planification OKR" },
      { icon: Briefcase,   label: "Agences" },
    ],
  },
] as const;

const ESPACE_TOOLS_20 = [
  "Factures & Devis", "Agenda", "Notes IA", "Coaching IA",
  "CRM Clients", "Chrono", "Dépenses", "Trésorerie",
  "Contrats IA", "Stocks", "Assistant IA", "Sourcing IA",
  "Réseaux Sociaux", "Mind Map", "Scanner", "Site Web IA",
  "Blog IA", "Réputation", "Portail Client", "Paie & RH",
] as const;

const RIVALS: Record<typeof ESPACE_TOOLS_20[number], string> = {
  "Factures & Devis": "QuickBooks",
  "Agenda":           "Calendly",
  "Notes IA":         "Notion",
  "Coaching IA":      "Udemy",
  "CRM Clients":      "HubSpot",
  "Chrono":           "Toggl",
  "Dépenses":         "Expensify",
  "Trésorerie":       "Sage",
  "Contrats IA":      "DocuSign",
  "Stocks":           "Zoho",
  "Assistant IA":     "ChatGPT",
  "Sourcing IA":      "LinkedIn",
  "Réseaux Sociaux":  "Hootsuite",
  "Mind Map":         "Miro",
  "Scanner":          "Adobe Scan",
  "Site Web IA":      "Wix",
  "Blog IA":          "WordPress",
  "Réputation":       "Trustpilot",
  "Portail Client":   "Notion",
  "Paie & RH":        "PayFit",
};

const RIVAL_PRICES: Record<typeof ESPACE_TOOLS_20[number], number> = {
  "Factures & Devis": 29,
  "Agenda":           12,
  "Notes IA":         10,
  "Coaching IA":      20,
  "CRM Clients":      45,
  "Chrono":           10,
  "Dépenses":          8,
  "Trésorerie":       25,
  "Contrats IA":      25,
  "Stocks":           20,
  "Assistant IA":     20,
  "Sourcing IA":      39,
  "Réseaux Sociaux":  50,
  "Mind Map":         10,
  "Scanner":           8,
  "Site Web IA":      20,
  "Blog IA":           8,
  "Réputation":       99,
  "Portail Client":   16,
  "Paie & RH":        49,
};

type ToolEntry = { name: string; rival: string; price: number; icon: React.ElementType; g: string };
const TOOLS_DATA_48: ToolEntry[] = [
  // ── Finance & Compta ──
  { name: "Factures & Devis",      rival: "QuickBooks",       price: 29, icon: Receipt,        g: "linear-gradient(135deg,#f59e0b,#c9a55a)" },
  { name: "Dépenses",              rival: "Expensify",        price: 8,  icon: CreditCard,     g: "linear-gradient(135deg,#f43f5e,#be123c)" },
  { name: "Trésorerie",            rival: "Sage",             price: 25, icon: Wallet,         g: "linear-gradient(135deg,#34d399,#059669)" },
  { name: "Comptabilité",          rival: "FreshBooks",       price: 15, icon: Banknote,       g: "linear-gradient(135deg,#4ade80,#16a34a)" },
  { name: "Banque",                rival: "Qonto",            price: 9,  icon: Landmark,       g: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  { name: "Déclarations Fiscales", rival: "Indy",             price: 20, icon: FileCheck2,     g: "linear-gradient(135deg,#818cf8,#4338ca)" },
  { name: "Paie & RH",            rival: "PayFit",           price: 49, icon: Users2,         g: "linear-gradient(135deg,#818cf8,#4f46e5)" },
  { name: "Liens de Paiement",    rival: "Stripe",           price: 15, icon: ShoppingCart,   g: "linear-gradient(135deg,#6366f1,#4f46e5)" },
  // ── Commerce & Ventes ──
  { name: "CRM",                  rival: "HubSpot",          price: 45, icon: Contact2,       g: "linear-gradient(135deg,#22d3ee,#0891b2)" },
  { name: "Boutique en ligne",    rival: "Shopify",          price: 32, icon: Store,          g: "linear-gradient(135deg,#86efac,#16a34a)" },
  { name: "Caisse / POS",        rival: "Square",           price: 15, icon: ShoppingBag,    g: "linear-gradient(135deg,#fb923c,#ea580c)" },
  { name: "Marketplace",          rival: "Malt",             price: 20, icon: Globe,          g: "linear-gradient(135deg,#f97316,#c2410c)" },
  { name: "Agences",             rival: "Comet",            price: 15, icon: Briefcase,      g: "linear-gradient(135deg,#a78bfa,#6d28d9)" },
  { name: "Portail Client",      rival: "Notion",           price: 16, icon: FolderOpen,     g: "linear-gradient(135deg,#c084fc,#7c3aed)" },
  // ── Marketing & Com ──
  { name: "Email Marketing",     rival: "Mailchimp",        price: 13, icon: Mail,           g: "linear-gradient(135deg,#fde68a,#f59e0b)" },
  { name: "Réseaux Sociaux",    rival: "Hootsuite",        price: 50, icon: Share2,         g: "linear-gradient(135deg,#fb923c,#d97706)" },
  { name: "Blog IA",            rival: "WordPress",        price: 8,  icon: PenLine,        g: "linear-gradient(135deg,#60a5fa,#3b82f6)" },
  { name: "Site Web IA",        rival: "Wix",              price: 20, icon: Code2,          g: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
  { name: "Réputation",         rival: "Trustpilot",       price: 99, icon: Star,           g: "linear-gradient(135deg,#facc15,#ca8a04)" },
  { name: "Avis Clients",       rival: "Google My Biz.",   price: 30, icon: HeartHandshake, g: "linear-gradient(135deg,#f472b6,#be185d)" },
  { name: "Carte de Visite",    rival: "Canva",            price: 13, icon: Gem,            g: "linear-gradient(135deg,#64748b,#334155)" },
  { name: "Chatbot IA",         rival: "Intercom",         price: 39, icon: MessageCircle,  g: "linear-gradient(135deg,#34d399,#0d9488)" },
  { name: "Analytics",          rival: "Hotjar",           price: 39, icon: BarChart2,      g: "linear-gradient(135deg,#f97316,#c2410c)" },
  // ── IA & Productivité ──
  { name: "Assistant IA",       rival: "ChatGPT",          price: 20, icon: Bot,            g: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  { name: "Coaching IA",        rival: "Udemy",            price: 20, icon: Brain,          g: "linear-gradient(135deg,#a78bfa,#6d28d9)" },
  { name: "Contrats IA",        rival: "DocuSign",         price: 25, icon: Shield,         g: "linear-gradient(135deg,#facc15,#ca8a04)" },
  { name: "Sourcing IA",        rival: "LinkedIn",         price: 39, icon: Target,         g: "linear-gradient(135deg,#22d3ee,#0284c7)" },
  { name: "Signature Élec.",    rival: "HelloSign",        price: 20, icon: Zap,            g: "linear-gradient(135deg,#fbbf24,#d97706)" },
  { name: "Bloc-notes",         rival: "Notion",           price: 10, icon: StickyNote,     g: "linear-gradient(135deg,#4ade80,#16a34a)" },
  { name: "Mind Maps",          rival: "Miro",             price: 10, icon: Network,        g: "linear-gradient(135deg,#f472b6,#db2777)" },
  // ── Opérations ──
  { name: "Stocks & Inventaire",rival: "Zoho",             price: 20, icon: Package,        g: "linear-gradient(135deg,#fbbf24,#d97706)" },
  { name: "Fournisseurs",       rival: "SAP Ariba",        price: 20, icon: Truck,          g: "linear-gradient(135deg,#94a3b8,#475569)" },
  { name: "Rendez-vous",        rival: "Calendly",         price: 12, icon: CalendarRange,  g: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  { name: "Agenda",             rival: "Google Cal.",      price: 8,  icon: CalendarPlus,   g: "linear-gradient(135deg,#ec4899,#db2777)" },
  { name: "Projets",            rival: "Asana",            price: 13, icon: ListTodo,       g: "linear-gradient(135deg,#f59e0b,#b45309)" },
  { name: "Planification Strat.",rival: "Monday.com",      price: 17, icon: BarChart3,      g: "linear-gradient(135deg,#34d399,#047857)" },
  { name: "Checklists",         rival: "Todoist",          price: 5,  icon: CheckCircle2,   g: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
  { name: "Scanner",            rival: "Adobe Scan",       price: 8,  icon: QrCode,         g: "linear-gradient(135deg,#64748b,#334155)" },
  // ── Équipe & Admin ──
  { name: "Équipe",             rival: "BambooHR",         price: 35, icon: UserPlus,       g: "linear-gradient(135deg,#2dd4bf,#0d9488)" },
  { name: "Espaces Privés",     rival: "Slack",            price: 8,  icon: Building2,      g: "linear-gradient(135deg,#818cf8,#4338ca)" },
  { name: "Productivité",       rival: "Notion",           price: 10, icon: Sparkles,       g: "linear-gradient(135deg,#c084fc,#6d28d9)" },
  { name: "Chrono Pro",         rival: "Toggl",            price: 10, icon: Timer,          g: "linear-gradient(135deg,#fb923c,#ea580c)" },
];

const PUBLIC_APP_ICONS = [
  /* 0 – Factures & devis */
  <svg key="p0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub0" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#c9a55a"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub0)"/>
    <rect x="12" y="10" width="20" height="26" rx="3" fill="white" fillOpacity="0.95"/>
    <rect x="15" y="16" width="14" height="2" rx="1" fill="#c9a55a"/>
    <rect x="15" y="20" width="11" height="2" rx="1" fill="#c9a55a" fillOpacity="0.6"/>
    <rect x="15" y="24" width="9" height="2" rx="1" fill="#c9a55a" fillOpacity="0.4"/>
    <circle cx="31" cy="33" r="7" fill="#f59e0b"/>
    <path d="M27.5 33l2.5 2.5 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,

  /* 1 – Agenda & Planification */
  <svg key="p1" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub1)"/>
    <rect x="9" y="14" width="30" height="24" rx="4" fill="white" fillOpacity="0.92"/>
    <rect x="9" y="14" width="30" height="9" rx="4" fill="white" fillOpacity="0.3"/>
    <rect x="9" y="19" width="30" height="4" fill="white" fillOpacity="0.3"/>
    <rect x="16" y="10" width="3" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
    <rect x="29" y="10" width="3" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
    <circle cx="17" cy="28" r="1.8" fill="#3b82f6"/>
    <circle cx="24" cy="28" r="1.8" fill="#3b82f6"/>
    <circle cx="31" cy="28" r="1.8" fill="#3b82f6"/>
    <circle cx="17" cy="34" r="1.8" fill="#6366f1" fillOpacity="0.5"/>
    <circle cx="24" cy="34" r="2.5" fill="#6366f1"/>
    <circle cx="31" cy="34" r="1.8" fill="#6366f1" fillOpacity="0.5"/>
  </svg>,

  /* 2 – Bloc-notes pro */
  <svg key="p2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#4ade80"/><stop offset="1" stopColor="#16a34a"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub2)"/>
    <rect x="11" y="9" width="22" height="28" rx="3" fill="white" fillOpacity="0.92"/>
    <circle cx="15" cy="13" r="1.5" fill="#4ade80"/>
    <circle cx="15" cy="18" r="1.5" fill="#4ade80"/>
    <circle cx="15" cy="23" r="1.5" fill="#4ade80"/>
    <rect x="18" y="12" width="11" height="2" rx="1" fill="#16a34a" fillOpacity="0.5"/>
    <rect x="18" y="17" width="9" height="2" rx="1" fill="#16a34a" fillOpacity="0.5"/>
    <rect x="18" y="22" width="11" height="2" rx="1" fill="#16a34a" fillOpacity="0.5"/>
    <rect x="18" y="27" width="7" height="2" rx="1" fill="#16a34a" fillOpacity="0.4"/>
    <path d="M28 32l4-4 4 4-4 4z" fill="#16a34a" fillOpacity="0.85"/>
    <rect x="33" y="25" width="3" height="8" rx="1.5" transform="rotate(45 33 25)" fill="#4ade80"/>
  </svg>,

  /* 3 – Coach Business IA */
  <svg key="p3" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub3" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub3)"/>
    <rect x="9" y="13" width="26" height="18" rx="6" fill="white" fillOpacity="0.92"/>
    <path d="M18 31l-4 5v-5z" fill="white" fillOpacity="0.92"/>
    <circle cx="17" cy="22" r="2.2" fill="#a78bfa"/>
    <circle cx="24" cy="22" r="2.2" fill="#a78bfa"/>
    <circle cx="31" cy="22" r="2.2" fill="#a78bfa"/>
    <circle cx="37" cy="12" r="6" fill="#7c3aed"/>
    <path d="M37 9v6M34 12h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>,

  /* 4 – CRM Client */
  <svg key="p4" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub4" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#0891b2"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub4)"/>
    <circle cx="24" cy="17" r="7" fill="white" fillOpacity="0.95"/>
    <path d="M13 38 C13 31.373 18.373 26 25 26 C31.627 26 37 31.373 37 38" fill="white" fillOpacity="0.95"/>
    <circle cx="10" cy="21" r="4" fill="white" fillOpacity="0.55"/>
    <path d="M5 35 C5 31.134 8.134 28 12 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.55"/>
    <circle cx="38" cy="21" r="4" fill="white" fillOpacity="0.55"/>
    <path d="M43 35 C43 31.134 39.866 28 36 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.55"/>
  </svg>,

  /* 5 – Chrono Pro */
  <svg key="p5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub5" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#ea580c"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub5)"/>
    <circle cx="24" cy="28" r="13" fill="white" fillOpacity="0.92"/>
    <rect x="20" y="10" width="8" height="5" rx="2.5" fill="white" fillOpacity="0.9"/>
    <line x1="24" y1="28" x2="24" y2="19" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="24" y1="28" x2="31" y2="29" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="28" r="2.5" fill="#ea580c"/>
    <line x1="24" y1="16" x2="24" y2="18" stroke="#fb923c" strokeWidth="2" strokeOpacity="0.5"/>
    <line x1="36" y1="28" x2="34" y2="28" stroke="#fb923c" strokeWidth="2" strokeOpacity="0.5"/>
    <line x1="12" y1="28" x2="14" y2="28" stroke="#fb923c" strokeWidth="2" strokeOpacity="0.5"/>
  </svg>,

  /* 6 – Dépenses Pro */
  <svg key="p6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub6" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#f43f5e"/><stop offset="1" stopColor="#be123c"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub6)"/>
    <rect x="7" y="15" width="28" height="18" rx="4" fill="white" fillOpacity="0.92"/>
    <rect x="7" y="21" width="28" height="5" fill="white" fillOpacity="0.35"/>
    <rect x="11" y="28" width="5" height="3" rx="1" fill="#f43f5e" fillOpacity="0.5"/>
    <rect x="18" y="28" width="9" height="3" rx="1" fill="#f43f5e" fillOpacity="0.35"/>
    <circle cx="37" cy="31" r="8" fill="#be123c"/>
    <path d="M34 29.5l3 3 3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="37" y1="27" x2="37" y2="32.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>,

  /* 7 – Trésorerie */
  <svg key="p7" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub7" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#34d399"/><stop offset="1" stopColor="#059669"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub7)"/>
    <rect x="8" y="30" width="8" height="10" rx="2" fill="white" fillOpacity="0.6"/>
    <rect x="20" y="22" width="8" height="18" rx="2" fill="white" fillOpacity="0.8"/>
    <rect x="32" y="13" width="8" height="27" rx="2" fill="white" fillOpacity="0.95"/>
    <path d="M10 28l12-9 8 4 10-13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8"/>
    <circle cx="38" cy="11" r="3" fill="white" fillOpacity="0.9"/>
  </svg>,

  /* 8 – Contrats IA */
  <svg key="p8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub8" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#facc15"/><stop offset="1" stopColor="#ca8a04"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub8)"/>
    <rect x="10" y="9" width="20" height="26" rx="3" fill="white" fillOpacity="0.92"/>
    <rect x="13" y="15" width="14" height="2" rx="1" fill="#ca8a04" fillOpacity="0.6"/>
    <rect x="13" y="20" width="11" height="2" rx="1" fill="#ca8a04" fillOpacity="0.5"/>
    <rect x="13" y="25" width="8" height="2" rx="1" fill="#ca8a04" fillOpacity="0.4"/>
    <path d="M34 26 L28 28.5 L28 35 C28 39.5 34 42 34 42 C34 42 40 39.5 40 35 L40 28.5 Z" fill="#ca8a04"/>
    <path d="M31 34 L33.5 36.5 L37.5 32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,

  /* 9 – Sourcing IA */
  <svg key="p9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub9" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#d97706"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub9)"/>
    <circle cx="21" cy="22" r="12" fill="white" fillOpacity="0.92"/>
    <path d="M9 22h24M21 10 C18 13 16 17 16 22 C16 27 18 31 21 34M21 10 C24 13 26 17 26 22 C26 27 24 31 21 34" stroke="#d97706" strokeWidth="1.3" strokeOpacity="0.6"/>
    <circle cx="37" cy="37" r="7" fill="#d97706"/>
    <circle cx="37" cy="37" r="4" fill="white" fillOpacity="0.9"/>
    <line x1="40.5" y1="40.5" x2="44" y2="44" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>,

  /* 10 – Fournisseurs */
  <svg key="p10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub10" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#4ade80"/><stop offset="1" stopColor="#166534"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub10)"/>
    <rect x="6" y="18" width="24" height="16" rx="3" fill="white" fillOpacity="0.92"/>
    <path d="M30 26h8l-3-8h-5v8z" fill="white" fillOpacity="0.85"/>
    <rect x="31" y="21" width="5" height="5" rx="1" fill="#166534" fillOpacity="0.4"/>
    <circle cx="14" cy="36" r="4" fill="white" fillOpacity="0.95"/>
    <circle cx="14" cy="36" r="2" fill="#166534" fillOpacity="0.6"/>
    <circle cx="33" cy="36" r="4" fill="white" fillOpacity="0.95"/>
    <circle cx="33" cy="36" r="2" fill="#166534" fillOpacity="0.6"/>
  </svg>,

  /* 11 – Stocks */
  <svg key="p11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub11" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#14b8a6"/><stop offset="1" stopColor="#0f766e"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub11)"/>
    <rect x="8" y="29" width="32" height="11" rx="3" fill="white" fillOpacity="0.7"/>
    <rect x="12" y="19" width="24" height="11" rx="3" fill="white" fillOpacity="0.82"/>
    <rect x="16" y="10" width="16" height="10" rx="3" fill="white" fillOpacity="0.95"/>
    <line x1="24" y1="10" x2="24" y2="20" stroke="#0f766e" strokeWidth="1.5" strokeOpacity="0.45"/>
    <line x1="24" y1="19" x2="24" y2="30" stroke="#0f766e" strokeWidth="1.5" strokeOpacity="0.35"/>
    <line x1="24" y1="29" x2="24" y2="40" stroke="#0f766e" strokeWidth="1.5" strokeOpacity="0.25"/>
  </svg>,

  /* 12 – Tâches */
  <svg key="p12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub12" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#f472b6"/><stop offset="1" stopColor="#be185d"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub12)"/>
    <rect x="9" y="9" width="24" height="30" rx="3" fill="white" fillOpacity="0.92"/>
    <circle cx="15" cy="18" r="3" fill="#f472b6"/>
    <path d="M13.5 18l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="21" y="17" width="9" height="2" rx="1" fill="#be185d" fillOpacity="0.5"/>
    <circle cx="15" cy="25" r="3" fill="#f472b6"/>
    <path d="M13.5 25l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="21" y="24" width="7" height="2" rx="1" fill="#be185d" fillOpacity="0.4"/>
    <circle cx="15" cy="32" r="3" fill="white" stroke="#f472b6" strokeWidth="1.5"/>
    <rect x="21" y="31" width="9" height="2" rx="1" fill="#be185d" fillOpacity="0.3"/>
    <circle cx="33" cy="35" r="7" fill="#be185d"/>
    <path d="M30 35l2.5 2.5 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,

  /* 13 – Équipe */
  <svg key="p13" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub13" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0891b2"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub13)"/>
    <circle cx="17" cy="19" r="5.5" fill="white" fillOpacity="0.65"/>
    <path d="M8 38 C8 32.5 12 28.5 17 28.5 C22 28.5 26 32.5 26 38" fill="white" fillOpacity="0.65"/>
    <circle cx="31" cy="17" r="7" fill="white" fillOpacity="0.95"/>
    <path d="M21 38 C21 31.6 25.5 27 31 27 C36.5 27 41 31.6 41 38" fill="white" fillOpacity="0.95"/>
  </svg>,

  /* 14 – Notes IA */
  <svg key="p14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub14" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#92400e"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub14)"/>
    <path d="M10 11 H32 V31 L24 39 H10 Z" fill="white" fillOpacity="0.92"/>
    <path d="M32 31 L24 39 V31 Z" fill="#92400e" fillOpacity="0.35"/>
    <rect x="13" y="17" width="14" height="2" rx="1" fill="#92400e" fillOpacity="0.5"/>
    <rect x="13" y="22" width="11" height="2" rx="1" fill="#92400e" fillOpacity="0.4"/>
    <rect x="13" y="27" width="8" height="2" rx="1" fill="#92400e" fillOpacity="0.3"/>
    <circle cx="36" cy="13" r="7" fill="#92400e"/>
    <path d="M36 7 L33 14 L35.5 14 L33.5 19 L40 13 L37 13 Z" fill="white" fillOpacity="0.95"/>
  </svg>,

  /* 15 – Assistant IA */
  <svg key="p15" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub15" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub15)"/>
    <path d="M26 8 L15 27 L22 27 L19 40 L34 21 L27 21 Z" fill="white" fillOpacity="0.95"/>
    <circle cx="10" cy="14" r="2" fill="white" fillOpacity="0.45"/>
    <circle cx="39" cy="11" r="2.5" fill="white" fillOpacity="0.5"/>
    <circle cx="38" cy="36" r="2" fill="white" fillOpacity="0.4"/>
  </svg>,

  /* 16 – Réputation */
  <svg key="p16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub16" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#f87171"/><stop offset="1" stopColor="#b91c1c"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub16)"/>
    <path d="M24 8 L27.5 19 L39.5 19 L30 25.5 L33.5 37 L24 30.5 L14.5 37 L18 25.5 L8.5 19 L20.5 19 Z" fill="white" fillOpacity="0.95"/>
    <circle cx="9" cy="11" r="2" fill="white" fillOpacity="0.4"/>
    <circle cx="39" cy="10" r="2.5" fill="white" fillOpacity="0.45"/>
    <circle cx="40" cy="38" r="2" fill="white" fillOpacity="0.35"/>
    <circle cx="8" cy="39" r="2" fill="white" fillOpacity="0.35"/>
  </svg>,

  /* 17 – Réseaux Sociaux IA */
  <svg key="p17" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub17" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#e1306c"/><stop offset="1" stopColor="#833ab4"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub17)"/>
    <rect x="14" y="8" width="20" height="32" rx="4" fill="white" fillOpacity="0.92"/>
    <rect x="17" y="14" width="7" height="7" rx="2" fill="#e1306c" fillOpacity="0.55"/>
    <rect x="26" y="14" width="5" height="7" rx="2" fill="#833ab4" fillOpacity="0.55"/>
    <rect x="17" y="23" width="5" height="7" rx="2" fill="#833ab4" fillOpacity="0.55"/>
    <rect x="24" y="23" width="7" height="7" rx="2" fill="#e1306c" fillOpacity="0.55"/>
    <circle cx="37" cy="35" r="7" fill="#e1306c"/>
    <path d="M37 40 C34 37 31 34.5 31 32 C31 30.3 32.3 29 34 29 C35.2 29 36.3 29.8 37 31 C37.7 29.8 38.8 29 40 29 C41.7 29 43 30.3 43 32 C43 34.5 40 37 37 40Z" fill="white" fillOpacity="0.95"/>
  </svg>,

  /* 18 – Portail Client */
  <svg key="p18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub18" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub18)"/>
    {/* Bâtiment */}
    <rect x="10" y="17" width="26" height="22" rx="2" fill="white" fillOpacity="0.92"/>
    {/* Toit */}
    <path d="M7 19 L23 8 L39 19" fill="white" fillOpacity="0.55"/>
    {/* Fenêtres */}
    <rect x="14" y="22" width="6" height="5" rx="1" fill="#3b82f6" fillOpacity="0.45"/>
    <rect x="27" y="22" width="6" height="5" rx="1" fill="#3b82f6" fillOpacity="0.45"/>
    {/* Porte */}
    <rect x="19" y="29" width="9" height="10" rx="2" fill="#7c3aed" fillOpacity="0.55"/>
    {/* Badge personne */}
    <circle cx="37" cy="13" r="7" fill="#7c3aed"/>
    <circle cx="37" cy="11" r="2.5" fill="white" fillOpacity="0.9"/>
    <path d="M32.5 18 C32.5 15.5 34.6 14 37 14 C39.4 14 41.5 15.5 41.5 18" fill="white" fillOpacity="0.9"/>
  </svg>,

  /* 19 – Paie & RH */
  <svg key="p19" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub19" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#10b981"/><stop offset="1" stopColor="#065f46"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub19)"/>
    {/* Billet */}
    <rect x="6" y="14" width="32" height="20" rx="4" fill="white" fillOpacity="0.92"/>
    {/* Bande centrale */}
    <rect x="6" y="21" width="32" height="6" fill="white" fillOpacity="0.22"/>
    {/* Cercle valeur */}
    <circle cx="22" cy="24" r="5.5" fill="#10b981" fillOpacity="0.18"/>
    <circle cx="22" cy="24" r="3.5" fill="#10b981" fillOpacity="0.35"/>
    {/* Barre € */}
    <rect x="21" y="20" width="2" height="8" rx="1" fill="#065f46" fillOpacity="0.6"/>
    <rect x="18.5" y="22.5" width="7" height="1.5" rx="0.75" fill="#065f46" fillOpacity="0.6"/>
    <rect x="18.5" y="25" width="7" height="1.5" rx="0.75" fill="#065f46" fillOpacity="0.5"/>
    {/* Points coins */}
    <circle cx="10" cy="24" r="2" fill="#10b981" fillOpacity="0.4"/>
    <circle cx="34" cy="24" r="2" fill="#10b981" fillOpacity="0.4"/>
    {/* Badge personne + check */}
    <circle cx="37" cy="13" r="7" fill="#065f46"/>
    <circle cx="37" cy="11" r="2.5" fill="white" fillOpacity="0.85"/>
    <path d="M32.5 18 C32.5 15.5 34.6 14 37 14 C39.4 14 41.5 15.5 41.5 18" fill="white" fillOpacity="0.85"/>
    <path d="M34.5 11.5 L36.5 13.5 L40 10" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
];


export default function Page() {
  return (
    <LanguageProvider>
      <Navbar />
      <main><HomeContent /></main>
      <Footer />
      <AssistantDJAMA />
    </LanguageProvider>
  );
}

const HERO_STATS = [
  { value: "1200+", label: "abonnés\nDJAMA Pro",   Icon: Gem         },
  { value: "50+",   label: "clients\naccompagnés", Icon: Users2      },
  { value: "100+",  label: "projets\nlivrés",       Icon: Briefcase   },
  { value: "Sans",  label: "engagement",            Icon: ShieldCheck },
];

function CoachingPayButton() {
  const [loading, setLoading] = useState(false);
  async function pay() {
    setLoading(true);
    try {
      const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      const res  = await fetch("/api/checkout/coaching-ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id ?? null, userEmail: user?.email ?? null }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }
  return (
    <button onClick={pay} disabled={loading}
      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[0.75rem] font-bold text-gray-600 transition hover:text-[#c9a55a] disabled:opacity-60">
      {loading ? <Gem size={11} className="animate-spin" style={{ color: GOLD }} /> : null}
      {loading ? "…" : <><ArrowRight size={11} /> Acheter</>}
    </button>
  );
}

function HomeContent() {
  const data                  = getSiteData();
  const { lang }              = useLanguage();
  const { settings, get }     = useSiteSettings();
  const [parAn, setParAn]     = useState(false);
  const [payMode, setPayMode] = useState<"card" | "paypal" | "virement">("card");
  const [virEmail, setVirEmail] = useState("");
  const [virSent, setVirSent]   = useState(false);
  const [sansMode, setSansMode] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());


  return (
    <div className="overflow-hidden">

      {/* ══════════════════════════════════════════════════════
           HERO — style Odoo : blanc, Caveat, surligneur or
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white px-5 pb-16 pt-[108px] sm:pb-24 sm:pt-[150px]">
        {/* Léger halo doré centré */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[380px] w-[700px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle, rgba(${GOLDR},0.10) 0%, transparent 70%)` }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="relative z-10 mx-auto max-w-3xl px-4 text-center"
        >
          {/* H1 — surligneur ÉPAIS style Odoo exact */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="text-[3.6rem] leading-[1.12] text-gray-900 sm:text-[5.8rem]"
            style={{ fontFamily: lang === "ar" ? "inherit" : "'Caveat', cursive", fontWeight: 800 }}
          >
            {lang === "ar" ? "كل أعمالك على " : lang === "en" ? "Your entire business on " : "Tout votre business sur "}
            <span
              className="inline-block"
              style={{
                background: `rgba(${GOLDR}, 0.88)`,
                borderRadius: "5px",
                padding: "2px 10px",
                color: "#1a0800",
              }}
            >
              {lang === "ar" ? "منصة واحدة." : lang === "en" ? "one platform." : "une seule plateforme."}
            </span>
          </motion.h1>

          {/* Sous-titre — "Simple, efficace, et abordable !" avec trait brushstroke bleu */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            className="mt-4 text-[2rem] leading-[1.15] text-gray-600 sm:text-[2.9rem]"
            style={{ fontFamily: lang === "ar" ? "inherit" : "'Caveat', cursive", fontWeight: 600 }}
          >
            {lang === "ar" ? (
              <>بسيط، فعّال، و<span className="relative inline-block">بأسعار معقولة !<svg aria-hidden viewBox="0 0 220 10" style={{ position: "absolute", bottom: "-3px", left: 0, width: "100%", height: "9px" }} preserveAspectRatio="none"><path d="M2 6 C40 1, 90 9, 140 5 C185 2, 210 8, 218 6" stroke="#60a5fa" strokeWidth="3.5" fill="none" strokeLinecap="round"/></svg></span></>
            ) : lang === "en" ? (
              <>Simple, powerful, and{" "}<span className="relative inline-block">affordable !<svg aria-hidden viewBox="0 0 180 10" style={{ position: "absolute", bottom: "-3px", left: 0, width: "100%", height: "9px" }} preserveAspectRatio="none"><path d="M2 6 C30 1, 70 9, 110 5 C148 2, 170 8, 178 6" stroke="#60a5fa" strokeWidth="3.5" fill="none" strokeLinecap="round"/></svg></span></>
            ) : (
              <>Simple, efficace, et{" "}<span className="relative inline-block">abordable !<svg aria-hidden viewBox="0 0 180 10" style={{ position: "absolute", bottom: "-3px", left: 0, width: "100%", height: "9px" }} preserveAspectRatio="none"><path d="M2 6 C30 1, 70 9, 110 5 C148 2, 170 8, 178 6" stroke="#60a5fa" strokeWidth="3.5" fill="none" strokeLinecap="round"/></svg></span></>
            )}
          </motion.h2>

          {/* CTAs — bouton doré plein + bouton gris léger */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.25 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <motion.div className="relative" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.40, 0, 0.40] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #d4aa6a)`, filter: "blur(14px)" }}
              />
              <Link href="/espace-client"
                className="relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-9 py-4 text-[1rem] font-black text-[#100800]"
                style={{ background: `linear-gradient(135deg,${GOLD} 0%,#e2ba70 45%,#b08d45 100%)`, boxShadow: `0 8px 30px rgba(${GOLDR},0.45)` }}>
                <motion.div animate={{ x: ["-100%","220%"] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <Gem size={15} className="relative z-10 shrink-0" />
                <span className="relative z-10">
                  {lang === "ar" ? "ابدأ الآن — مجانًا" : lang === "en" ? "Start now — It's free" : "Commence maintenant — C'est gratuit"}
                </span>
                <ArrowRight size={14} className="relative z-10 shrink-0" />
              </Link>
            </motion.div>
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-9 py-4 text-[1rem] font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-100 active:scale-[.98]">
              {lang === "ar" ? "تواصل مع مستشار →" : lang === "en" ? "Talk to an advisor →" : "Rencontrer un conseiller →"}
            </Link>
          </motion.div>

          {/* Annotation prix manuscrite — style Odoo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-5 text-[1.05rem] text-gray-400"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {lang === "ar" ? "↗ 11,90€ شهريًا لجميع الأدوات الـ 48" : lang === "en" ? "↗ 11.90€/month for ALL 48 tools" : "↗ 11,90€/mois pour TOUS les 48 outils"}
          </motion.p>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
           APP GRID — style Odoo pur : fond gris, cartes blanches
      ══════════════════════════════════════════════════════ */}
      <section id="outils" className="bg-[#f4f5f7] pb-16 pt-14">
        <div className="mx-auto max-w-5xl px-6">

          {/* Grille 5 cols — cartes BLANCHES + animation "Imagine sans DJAMA" intégrée */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
            className="grid grid-cols-4 gap-3 sm:grid-cols-5 items-start">
            {ESPACE_TOOLS_20.map((title, i) => {
              const rival = RIVALS[title];
              return (
                <motion.div key={title}
                  variants={{ hidden: { opacity: 0, scale: 0.88, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease } } }}
                  className="flex flex-col items-center">
                  <Link href="/espace-client" className="group block w-full">
                    <motion.div
                      animate={sansMode ? { opacity: rival ? 0.30 : 0.52, scale: 0.94 } : { opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      whileHover={sansMode ? {} : { scale: 1.06, y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2.5 rounded-2xl bg-white px-2 py-4 shadow-sm">
                      <div className="h-[68px] w-[68px] overflow-hidden rounded-[18px]">
                        {PUBLIC_APP_ICONS[i]}
                      </div>
                      <p className="text-center text-[0.68rem] font-semibold leading-tight text-gray-500 group-hover:text-gray-800 transition-colors">
                        {title}
                      </p>
                    </motion.div>
                  </Link>

                  {/* Zone concurrent — visible uniquement si sansMode + rival */}
                  <AnimatePresence>
                    {sansMode && rival && (
                      <motion.div
                        key={`rival-${i}`}
                        className="flex flex-col items-center pt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                      >
                        <svg width="20" height="34" viewBox="0 0 20 34" overflow="visible">
                          <motion.path d="M 10 0 C 10 11, 4 21, 10 30"
                            stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.36, delay: i * 0.04, ease: "easeOut" }}
                          />
                          <motion.path d="M 6 26 L 10 34 L 14 26"
                            stroke="#7c3aed" strokeWidth="2" fill="none"
                            strokeLinecap="round" strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.1, delay: i * 0.04 + 0.34 }}
                          />
                        </svg>
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 + 0.36 }}
                          className="mt-0.5 text-center"
                          style={{ fontFamily: "'Caveat', cursive", fontSize: "1.2rem", fontWeight: 700, color: "#7c3aed", lineHeight: 1.1 }}
                        >
                          {rival}
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Toggle + compteur coût + lien */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSansMode(v => !v)}
                className="flex items-center gap-3 rounded-full px-3 py-2 transition-colors hover:bg-gray-200/60"
              >
                <motion.div
                  animate={{ backgroundColor: sansMode ? "#7c3aed" : "#d1d5db" }}
                  transition={{ duration: 0.2 }}
                  className="relative h-6 w-11 flex-shrink-0 rounded-full"
                >
                  <motion.div
                    animate={{ x: sansMode ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                  />
                </motion.div>
                <span className="text-[0.9rem] font-semibold text-gray-700">Imaginez sans DJAMA</span>
                <AnimatePresence>
                  {sansMode && (
                    <motion.span key="shock"
                      initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -12, 12, 0] }}
                      exit={{ scale: 0 }} transition={{ duration: 0.3 }} className="text-lg">
                      😱
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Résumé coût — visible quand sansMode ON */}
              <AnimatePresence>
                {sansMode && (
                  <motion.div
                    key="cost"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="overflow-hidden pl-3"
                  >
                    <p className="text-[0.82rem] leading-snug text-gray-500">
                      Pour remplacer les <strong className="text-gray-800">48 outils DJAMA</strong> il vous faudrait :{" "}
                      <span className="font-black" style={{ color: "#7c3aed" }}>~48 abonnements · 600€+/mois</span>
                    </p>
                    <p className="mt-0.5 text-[0.78rem] text-gray-400">
                      vs DJAMA Pro :{" "}
                      <strong style={{ color: GOLD }}>11,90€/mois</strong> tout inclus
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/espace-client"
              className="inline-flex items-center gap-1.5 text-[0.88rem] font-bold transition-opacity hover:opacity-70 shrink-0"
              style={{ color: sansMode ? "#7c3aed" : GOLD }}>
              {sansMode ? "Revenir à DJAMA" : "Voir tous les 48 outils"}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Grand texte — style Odoo exact */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mt-14 max-w-3xl">
            <p className="text-[1.05rem] leading-relaxed text-gray-700">
              <strong className="font-black text-gray-900">Imaginez une vaste collection d&apos;applications professionnelles à votre disposition.</strong>
            </p>
            <p className="mt-2 text-[1.05rem] leading-relaxed text-gray-700">
              Vous avez quelque chose à améliorer ? Il existe une application pour ça.
            </p>
            <p className="text-[1.05rem] leading-relaxed text-gray-700">
              Pas de complexité, pas de frais, juste une installation en un clic.
            </p>
            <p className="mt-6 text-[1.05rem] leading-relaxed text-gray-700">
              Chaque application simplifie un processus et donne plus de moyens à un plus grand nombre de personnes.
            </p>
            <p className="text-[1.05rem] leading-relaxed text-gray-700">
              Imaginez l&apos;impact lorsque chacun obtient l&apos;outil adapté à la tâche, adapté avec une IA native.
            </p>
            <motion.div className="relative mt-7 inline-flex" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-2xl"
                style={{ background: `linear-gradient(135deg,${GOLD},#d4aa6a)`, filter: "blur(12px)" }}
              />
              <Link href="/espace-client"
                className="relative flex items-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5 text-[0.95rem] font-black text-[#100800]"
                style={{ background: `linear-gradient(135deg,${GOLD} 0%,#e2ba70 45%,#b08d45 100%)`, boxShadow: `0 6px 24px rgba(${GOLDR},0.40)` }}>
                <motion.div animate={{ x: ["-100%","220%"] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <Gem size={14} className="relative z-10 shrink-0" />
                <span className="relative z-10">Démarrer maintenant</span>
                <ArrowRight size={13} className="relative z-10 shrink-0" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
           CALCULATEUR D'ÉCONOMIES — style Odoo
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#f4f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">

          {/* Titre */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-10 text-center">
            <h2 className="text-[2.6rem] leading-[1.1] text-gray-900 sm:text-[3.4rem]"
              style={{ fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
              Calculez vos économies
            </h2>
            <p className="mt-3 text-[0.95rem] text-gray-500">
              Sélectionnez les outils que vous utilisez déjà
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">

            {/* ── Grille des outils ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease }}
              className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {TOOLS_DATA_48.map(({ name, rival, icon: Icon, g }) => {
                  const sel = selectedTools.has(name);
                  return (
                    <motion.button key={name} onClick={() => setSelectedTools(prev => {
                      const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n;
                    })}
                      whileTap={{ scale: 0.90 }}
                      className="relative flex flex-col items-center gap-2 p-2 transition-all duration-150"
                    >
                      <div className="relative">
                        <motion.div
                          animate={sel ? { scale: 1.08 } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="flex h-[68px] w-[68px] items-center justify-center"
                          style={{
                            background: g,
                            borderRadius: "22px",
                            boxShadow: sel
                              ? `0 0 0 3px ${GOLD}, 0 8px 20px rgba(0,0,0,0.18)`
                              : "0 4px 12px rgba(0,0,0,0.14)"
                          }}
                        >
                          <Icon size={34} className="text-white" strokeWidth={1.4} />
                        </motion.div>
                        <AnimatePresence>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                              style={{ background: GOLD }}>
                              <Check size={10} strokeWidth={3} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-center text-[0.62rem] font-semibold leading-tight text-gray-700">{name}</span>
                      <span className="text-center text-[0.55rem] text-gray-400">{rival}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                <button onClick={() => setSelectedTools(new Set(TOOLS_DATA_48.map(t => t.name)))}
                  className="text-[0.72rem] font-semibold text-gray-400 transition-colors hover:text-gray-700">
                  Tout sélectionner
                </button>
                <span className="text-gray-200">·</span>
                <button onClick={() => setSelectedTools(new Set())}
                  className="text-[0.72rem] font-semibold text-gray-400 transition-colors hover:text-gray-700">
                  Effacer
                </button>
                <span className="ml-auto text-[0.7rem] text-gray-400">
                  {selectedTools.size} / {TOOLS_DATA_48.length} sélectionnés
                </span>
              </div>
            </motion.div>

            {/* ── Panneau de droite ── */}
            <div className="space-y-3 lg:sticky lg:top-24">

              {/* Concurrents */}
              <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport} transition={{ duration: 0.5, ease }}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3.5">
                  <p className="text-[0.82rem] font-bold text-gray-900">Applications à remplacer</p>
                  <p className="text-[0.65rem] text-gray-400">Sans DJAMA, vous payez :</p>
                </div>
                <div className="min-h-[72px] px-5 py-3">
                  {selectedTools.size === 0 ? (
                    <p className="py-2 text-[0.75rem] italic text-gray-400">← Sélectionnez des outils</p>
                  ) : (
                    <div className="space-y-1.5">
                      <AnimatePresence>
                        {Array.from(selectedTools).map(name => {
                          const t = TOOLS_DATA_48.find(x => x.name === name);
                          if (!t) return null;
                          return (
                            <motion.div key={name}
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between overflow-hidden">
                              <span className="text-[0.75rem] text-gray-600">{t.rival}</span>
                              <span className="text-[0.75rem] font-bold text-gray-800">
                                {t.price}€<span className="text-[0.6rem] font-normal text-gray-400">/mois</span>
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {selectedTools.size > 0 && (
                  <div className="border-t border-gray-100 bg-red-50 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.78rem] font-bold text-gray-800">TOTAL</span>
                      <span className="text-[1rem] font-black text-red-500">
                        {Array.from(selectedTools).reduce((s, name) => s + (TOOLS_DATA_48.find(x => x.name === name)?.price ?? 0), 0)}€<span className="text-[0.65rem] font-normal">/mois</span>
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* DJAMA */}
              <div className="rounded-2xl border px-5 py-4"
                style={{ background: `rgba(${GOLDR},0.05)`, borderColor: `rgba(${GOLDR},0.3)` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.8rem] font-bold text-gray-900">Toutes les apps DJAMA</p>
                    <p className="text-[0.62rem] text-gray-500">48 outils inclus</p>
                  </div>
                  <span className="text-[1.1rem] font-black" style={{ color: GOLD }}>
                    11,90€<span className="text-[0.65rem] font-normal text-gray-500">/mois</span>
                  </span>
                </div>
              </div>

              {/* Économies */}
              <AnimatePresence>
                {selectedTools.size > 0 && (() => {
                  const saving = Array.from(selectedTools).reduce((s, name) => s + (TOOLS_DATA_48.find(x => x.name === name)?.price ?? 0), 0) - 11.90;
                  return saving > 0 ? (
                    <motion.div key="saving"
                      initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 22 }}
                      className="rounded-2xl border border-gray-100 bg-white px-5 py-5 text-center shadow-sm">
                      <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Vos économies</p>
                      <p className="text-[2.4rem] font-black leading-none"
                        style={{ fontFamily: "'Caveat', cursive" }}>
                        <span style={{ background: `rgba(${GOLDR},0.28)`, borderRadius: "6px", padding: "0 8px", color: "#6b4200" }}>
                          {saving.toFixed(0)}€/mois
                        </span>
                      </p>
                      <p className="mt-2 text-[0.7rem] text-gray-500">
                        soit <strong className="text-gray-700">{(saving * 12).toFixed(0)}€ économisés par an</strong>
                      </p>
                    </motion.div>
                  ) : null;
                })()}
              </AnimatePresence>

              {/* CTA */}
              <Link href="/espace-client"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[0.9rem] font-black text-black transition-all hover:shadow-[0_6px_24px_rgba(201,165,90,0.35)]"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)` }}>
                <Gem size={13} /> Essayer gratuitement <ArrowRight size={13} />
              </Link>
              <p className="text-center text-[0.65rem] text-gray-400">11,90€/mois · Sans engagement · Accès immédiat</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           SOCIAL PROOF — "1 200 Utilisateurs heureux" style Odoo
      ══════════════════════════════════════════════════════ */}
      <section className="overflow-hidden bg-white py-16 sm:py-24">

        {/* Ligne haute */}
        <div className="flex items-end gap-3 pb-2" style={{ marginLeft: "-2%", width: "112%" }}>
          <div className="h-[88px] w-[88px] flex-shrink-0 rounded-[18px] opacity-60" style={{ background: "#9b59b6" }} />
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-44.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[80px] w-[80px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-63.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[100px] w-[100px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-71.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-56.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[84px] w-[84px] flex-shrink-0 rounded-[18px] opacity-55" style={{ background: "#e5e7eb" }} />
          <div className="h-[92px] w-[92px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-76.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[88px] w-[88px] flex-shrink-0 rounded-[18px] opacity-70" style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)` }} />
          <div className="h-[100px] w-[100px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-22.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[80px] w-[80px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-74.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-45.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[84px] w-[84px] flex-shrink-0 rounded-[18px] opacity-50" style={{ background: "#9b59b6" }} />
        </div>

        {/* Texte central */}
        <div className="my-10 px-6 text-center">
          <div className="relative inline-block">
            <span className="absolute -top-7 right-2"
              style={{ fontFamily: "'Caveat', cursive", color: GOLD, fontSize: "1.35rem", fontWeight: 700, display: "inline-block", transform: "rotate(-5deg)" }}>
              heureux
            </span>
            <h2 className="text-[2.6rem] font-black leading-tight text-gray-900 sm:text-[4rem]"
              style={{ fontFamily: "'Caveat', cursive" }}>
              Rejoignez{" "}
              <span style={{ color: GOLD }}>1 200</span>{" "}
              Utilisateurs
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-gray-400">
            qui développent leur entreprise avec DJAMA
          </p>
          <motion.div className="mt-7 inline-block" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/espace-client"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[0.9rem] font-extrabold text-black transition-all hover:shadow-[0_6px_24px_rgba(201,165,90,0.35)]"
              style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)` }}>
              Commencer gratuitement <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        {/* Ligne basse */}
        <div className="flex items-start gap-3 pt-2" style={{ marginLeft: "1%", width: "112%" }}>
          <div className="h-[100px] w-[100px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-83.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[80px] w-[80px] flex-shrink-0 rounded-[18px] opacity-50" style={{ background: "#e5e7eb" }} />
          <div className="h-[92px] w-[92px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-62.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-62.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[84px] w-[84px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-64.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[100px] w-[100px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-19.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[76px] w-[76px] flex-shrink-0 rounded-[18px] opacity-60" style={{ background: "#7c3aed" }} />
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-61.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[88px] w-[88px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-68.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[92px] w-[92px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/women-28.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-[80px] w-[80px] flex-shrink-0 rounded-[18px] opacity-60" style={{ background: "#9b59b6" }} />
          <div className="h-[96px] w-[96px] flex-shrink-0 rounded-full overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.13)" }}>
            <img src="/avatars/men-36.jpg" alt="" className="w-full h-full object-cover" />
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
           TÉMOIGNAGE FONDATEUR — style Odoo quote card
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f8f8] py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-8 rounded-2xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:gap-12 sm:p-10"
            style={{ border: "1px solid rgba(0,0,0,0.05)" }}>

            {/* Citation gauche */}
            <div className="flex-1">
              <span className="mb-5 block text-[3.5rem] leading-none" style={{ color: GOLD, fontFamily: "serif" }}>&ldquo;&ldquo;</span>
              <p className="text-[1.05rem] font-semibold leading-relaxed text-gray-800">
                J&apos;ai créé DJAMA parce que chaque entrepreneur, où qu&apos;il soit dans le monde, mérite des outils aussi puissants que les grandes entreprises mondiales — mais accessibles, simples, et pensés pour eux. Notre marché, c&apos;est le monde entier. Chaque outil que nous construisons est une porte ouverte vers l&apos;indépendance économique.
              </p>
            </div>

            {/* Photo + identité droite */}
            <div className="flex shrink-0 flex-col items-center gap-3 sm:items-center">
              <div className="h-[100px] w-[100px] overflow-hidden rounded-full"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                <img src="/founder-nofane.jpg" alt="Nofane AMDJAD" className="h-full w-full object-cover" />
              </div>
              <div className="text-center">
                <p className="text-[0.95rem] font-black text-gray-900">Nofane AMDJAD</p>
                <p className="text-[0.78rem] text-gray-400">Fondateur de DJAMA</p>
              </div>
              <img src="/logo.png" alt="DJAMA" className="mt-1 h-[28px] w-auto object-contain opacity-80" />
            </div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
           DIFFÉRENCIATEURS — style Odoo "conçu pour faire la différence"
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">

          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.55, ease }}
            className="mb-10 text-[2.2rem] leading-[1.1] text-gray-900 sm:text-[2.8rem]"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
            Une plateforme{" "}
            <span style={{ background: "linear-gradient(180deg,transparent 52%,rgba(96,165,250,0.32) 52%)", padding: "0 5px" }}>
              conçue
            </span>{" "}
            pour faire la différence.
          </motion.h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.45, ease }}
              className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <h3 className="mb-3 text-[1.1rem] font-black text-gray-900">Pas de baratin</h3>
              <p className="text-[0.88rem] leading-relaxed italic text-gray-500">
                &ldquo;Avec la plupart des logiciels, vous obtenez ce que vous espériez. Avec DJAMA, vous obtenez ce que vous voyez — et souvent plus.&rdquo;
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.45, ease, delay: 0.08 }}
              className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <h3 className="mb-3 text-[1.1rem] font-black text-gray-900">Support humain direct</h3>
              <p className="text-[0.88rem] leading-relaxed text-gray-500">
                Un vrai conseiller DJAMA disponible sur WhatsApp. Pas de chatbot, pas de ticket, une vraie personne — en français, disponible dès maintenant.
              </p>
              <a href="https://wa.me/262693523665" target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-[#25d366] transition-opacity hover:opacity-70">
                <ArrowRight size={13} /> Contacter DJAMA
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <PartnerLogosSection />
      <TestimonialsSection dynamic />

      {/* ══════════════════════════════════════════════════════
           COACHING IA — style Odoo : blanc, Caveat, animations
      ══════════════════════════════════════════════════════ */}
      <section className="overflow-hidden bg-[#f4f5f7] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.20em]"
              style={{ borderColor: `rgba(${GOLDR},0.35)`, background: `rgba(${GOLDR},0.08)`, color: GOLD }}>
              <Brain size={10} /> Coaching IA DJAMA
            </span>
          </motion.div>

          {/* Headline Caveat Odoo */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
            className="mb-14 text-center">
            <h2 className="text-[2.8rem] leading-[1.1] text-gray-900 sm:text-[4rem]"
              style={{ fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
              Maîtrisez l&apos;IA,{" "}
              <span style={{ background: `linear-gradient(180deg,transparent 58%,rgba(${GOLDR},0.38) 58%)`, padding: "0 6px" }}>
                transformez
              </span>{" "}
              votre activité.
            </h2>
            <p className="mt-4 text-[0.95rem] text-gray-500">
              20 cours vidéo · Quiz &amp; activités · Jeux IA · Accès 3 mois · Valeur réelle 190€
            </p>
          </motion.div>

          {/* 4 modules — stagger Odoo */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
            className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", icon: Brain,      title: "Prompt Engineering",    desc: "Maîtrisez ChatGPT & Claude comme un expert" },
              { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  icon: Zap,        title: "Automatisation IA",     desc: "Gagnez 5 à 15h par semaine sans effort" },
              { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  icon: Sparkles,   title: "Contenu & Images IA",   desc: "Créez textes, visuels et agents autonomes" },
              { color: GOLD,      bg: `rgba(${GOLDR},0.08)`,    icon: BarChart3,  title: "Business en ligne",     desc: "Marketing, projets réels et revenus IA" },
            ] as const).map(({ color, bg, icon: Icon, title, desc }) => (
              <motion.div key={title}
                variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
                className="group rounded-2xl bg-white p-5 shadow-sm transition-all duration-300"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                whileHover={{ y: -6, boxShadow: `0 16px 40px rgba(0,0,0,0.10)`, borderColor: color + "44" }}
                transition={{ duration: 0.25 }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: bg, border: `1px solid ${color}28` }}>
                  <Icon size={20} style={{ color }} strokeWidth={1.7} />
                </div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="mt-1.5 text-[0.78rem] leading-relaxed text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA centrale — 2 colonnes */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.55, ease, delay: 0.1 }}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm sm:grid sm:grid-cols-2">

            {/* Gauche — offre Pro */}
            <div className="flex flex-col justify-center gap-5 p-8 sm:border-r sm:border-gray-100">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-wider text-[#100800]"
                style={{ background: `linear-gradient(135deg,${GOLD},#e2ba70)` }}>
                <Sparkles size={9} /> Abonnés DJAMA Pro
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-[3rem] font-black leading-none" style={{ color: GOLD }}>GRATUIT</span>
                  <span className="mb-1.5 text-[0.8rem] text-gray-400 line-through">190€</span>
                </div>
                <p className="mt-2 text-[0.88rem] text-gray-500">
                  Inclus avec <strong className="text-gray-900">DJAMA Pro</strong> à{" "}
                  <strong style={{ color: GOLD }}>11,90€/mois</strong> seulement
                </p>
              </div>
              <ul className="space-y-2.5">
                {([
                  { color: GOLD,      text: "20 cours vidéo + quiz interactifs" },
                  { color: "#60a5fa", text: "Jeux IA & mises en situation réelles" },
                  { color: "#4ade80", text: "Accès 3 mois · Certificat de complétion" },
                ] as const).map(({ color, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-[0.82rem] text-gray-600">
                    <CheckCircle2 size={14} style={{ color }} className="shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)" }}>
                <Shield size={11} style={{ color: "#4ade80" }} />
                <span className="text-[0.68rem] font-semibold text-emerald-700">Satisfait ou remboursé — 7 jours</span>
              </div>
              <motion.div className="relative" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}>
                <Link href="/espace-client"
                  className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[0.95rem] font-black text-[#100800] transition hover:opacity-90"
                  style={{ background: `linear-gradient(135deg,${GOLD} 0%,#e2ba70 45%,#b08d45 100%)`, boxShadow: `0 8px 24px rgba(${GOLDR},0.40)` }}>
                  S&apos;abonner — Formation offerte <ArrowRight size={14} />
                </Link>
              </motion.div>
            </div>

            {/* Droite — ou achat direct */}
            <div className="flex flex-col justify-center gap-5 bg-[#fafafa] p-8">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-gray-400">Ou accès individuel</p>
              <div className="flex items-end gap-2">
                <span className="text-[2.8rem] font-black leading-none text-gray-900">190€</span>
                <span className="mb-1.5 text-[0.8rem] text-gray-400 line-through">350€</span>
                <span className="mb-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[0.58rem] font-black uppercase text-red-600">−46%</span>
              </div>
              <p className="text-[0.85rem] text-gray-500">Paiement unique · Accès 3 mois complet</p>
              <CoachingPayButton />
              <Link href="/services/coaching-ia"
                className="inline-flex items-center gap-1.5 text-[0.8rem] font-bold transition-opacity hover:opacity-70"
                style={{ color: GOLD }}>
                Voir le programme complet <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Tarifs — Découverte / Pro ───────────────────────── */}
      <section className="bg-white py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-3xl px-6"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full border px-4 py-1.5 text-[0.62rem] font-bold uppercase tracking-widest"
              style={{ borderColor: `rgba(${GOLDR},0.30)`, background: `rgba(${GOLDR},0.08)`, color: GOLD }}>
              Tarifs
            </span>
            <h2 className="mt-2 text-[1.8rem] font-black text-gray-900">Simple et transparent</h2>
            <p className="mt-2 text-[0.85rem] text-gray-500">Deux offres claires. Sans frais cachés, sans engagement.</p>

            {/* Toggle Par an / Par mois */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold transition-colors ${parAn ? "text-gray-900" : "text-gray-400"}`}>
                Par an
                {parAn && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-700">
                    −2 mois offerts
                  </span>
                )}
              </span>
              <button
                onClick={() => setParAn(!parAn)}
                aria-label="Basculer facturation annuelle / mensuelle"
                className="relative h-6 w-11 rounded-full transition-colors duration-300"
                style={{ background: parAn ? GOLD : "#d1d5db" }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                  style={{ transform: parAn ? "translateX(22px)" : "translateX(2px)" }}
                />
              </button>
              <span className={`text-sm font-semibold transition-colors ${!parAn ? "text-gray-900" : "text-gray-400"}`}>
                Par mois
              </span>
            </div>
          </div>

          {/* 2 cartes */}
          <div className="grid items-center gap-5 sm:grid-cols-2">

            {/* Gratuit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.45, ease }}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">Gratuit</p>
              <h3 className="mb-4 text-[1.4rem] font-black text-gray-900">Découverte</h3>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-[2.6rem] font-black leading-none text-gray-900">0 €</span>
                <span className="text-sm text-gray-400">/mois</span>
              </div>
              <p className="mb-6 mt-1 text-xs text-gray-400">Pour découvrir DJAMA gratuitement.</p>
              <ul className="mb-7 flex-1 space-y-3">
                {["Factures & devis (5 max.)", "Planning", "Bloc-notes", "1 utilisateur"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[0.82rem] text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                      <Check size={11} className="text-gray-400" strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-700 transition hover:border-[#c9a55a] hover:text-[#c9a55a]">
                Commencer gratuitement
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.45, ease, delay: 0.1 }}
              className="relative flex flex-col rounded-2xl p-7 sm:p-9"
              style={{ background: `linear-gradient(150deg,${GOLD} 0%,#e2ba70 50%,#b08d45 100%)`, boxShadow: `0 24px 64px rgba(${GOLDR},0.38),0 6px 18px rgba(${GOLDR},0.20)` }}
            >
              <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-5 py-[6px] text-[0.58rem] font-black uppercase tracking-widest text-white shadow-lg">
                ★ Recommandé
              </div>
              <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-widest text-[#100800]/50">Pro</p>
              <h3 className="mb-4 text-[1.4rem] font-black text-[#100800]">Professionnel</h3>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-[2.6rem] font-black leading-none text-[#100800]">{parAn ? "9,90 €" : "11,90 €"}</span>
                <span className="text-sm text-[#100800]/50">/mois</span>
              </div>
              {parAn ? (
                <p className="mb-6 mt-1 text-xs text-[#100800]/50"><span className="line-through">11,90 €/mois</span> · Facturé 118,80 €/an</p>
              ) : (
                <p className="mb-6 mt-1 text-xs text-[#100800]/50">Facturation mensuelle · Résiliable à tout moment</p>
              )}
              <ul className="mb-7 flex-1 space-y-3">
                {["Tout le plan Gratuit", "48 outils professionnels", "IA Business & Coaching", "Création de comptes employés", "Gestion des rôles et permissions", "Support prioritaire"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[0.82rem] text-[#100800]/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/40">
                      <Check size={11} className="text-[#100800]" strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {/* Sélecteur mode de paiement */}
              <div className="mb-4 flex gap-1.5">
                {([
                  { id: "card",     label: "💳 CB" },
                  { id: "paypal",   label: "🅿 PayPal" },
                  { id: "virement", label: "🏦 Virement" },
                ] as const).map(({ id, label }) => (
                  <button key={id} onClick={() => setPayMode(id)}
                    className="flex-1 rounded-xl py-2 text-[0.7rem] font-bold transition-all"
                    style={payMode === id
                      ? { background: "rgba(0,0,0,0.18)", color: "#100800", border: "1px solid rgba(0,0,0,0.25)" }
                      : { background: "rgba(255,255,255,0.30)", color: "rgba(16,8,0,0.55)", border: "1px solid rgba(255,255,255,0.40)" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Paiement CB via Stripe */}
              {payMode === "card" && (
                <StripeButton
                  billing={parAn ? "yearly" : "monthly"}
                  label={parAn ? "Commencer — 9,90€/mois →" : "Commencer — 11,90€/mois →"}
                  className="rounded-xl py-3 text-sm font-black"
                />
              )}

              {/* Paiement PayPal */}
              {payMode === "paypal" && (
                <motion.a
                  href="/api/checkout/coaching-ia/paypal"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.18 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white"
                  style={{ background: "linear-gradient(135deg,#003087,#009cde)", boxShadow: "0 4px 14px rgba(0,48,135,0.45)" }}>
                  Payer avec PayPal →
                </motion.a>
              )}

              {/* Paiement Virement */}
              {payMode === "virement" && (
                <div className="space-y-2">
                  {virSent ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-green-400"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <Check size={15} /> Demande envoyée — on vous recontacte !
                    </div>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={virEmail}
                        onChange={e => setVirEmail(e.target.value)}
                        placeholder="Votre email pro"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.40)", border: "1px solid rgba(0,0,0,0.12)", color: "#100800" }}
                      />
                      <button
                        onClick={async () => {
                          if (!virEmail.trim()) return;
                          try {
                            await fetch("/api/checkout/coaching-ia/virement", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: virEmail, fullName: "Prospect DJAMA Pro" }),
                            });
                            setVirSent(true);
                          } catch { /* silent */ }
                        }}
                        className="w-full rounded-xl py-3 text-sm font-black text-white transition-all"
                        style={{ background: "linear-gradient(135deg,#1e3a5f,#2563eb)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                        Demander les coordonnées bancaires →
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="mt-3 text-center text-[0.6rem] text-[#100800]/40">✓ Sécurisé · ✓ Accès immédiat · ✓ Sans engagement</p>
            </motion.div>

          </div>
          <p className="mt-6 text-center text-[0.62rem] text-gray-400">Paiement sécurisé par Stripe · Sans préavis · Résiliable à tout moment</p>
        </motion.div>
      </section>

      {/* ── Final CTA — style Odoo : fond blanc, titre Caveat, or ── */}
      <section className="relative overflow-hidden bg-[#f4f5f7] px-5 py-20 sm:py-28">
        {/* Halo doré léger */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[300px] w-[600px] rounded-full blur-[120px]"
            style={{ background: `radial-gradient(circle, rgba(${GOLDR},0.12) 0%, transparent 70%)` }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          {/* Titre Caveat — style Odoo */}
          <h2 className="text-[2.8rem] leading-[1.08] text-gray-900 sm:text-[3.8rem]"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
            {lang === "ar"
              ? <>ابدأ مشروعك <span style={{ color: GOLD, textDecoration: "underline wavy", textUnderlineOffset: "6px", textDecorationColor: `rgba(${GOLDR},0.5)` }}>اليوم.</span></>
              : lang === "en"
              ? <>Launch your project <span style={{ color: GOLD, textDecoration: "underline wavy", textUnderlineOffset: "6px", textDecorationColor: `rgba(${GOLDR},0.5)` }}>today.</span></>
              : <>Libérez votre <span style={{ background: `linear-gradient(180deg,transparent 58%,rgba(${GOLDR},0.38) 58%)`, padding: "0 4px" }}>potentiel</span> de croissance.</>
            }
          </h2>

          {/* Sous-titre */}
          <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-gray-500">
            {lang === "ar"
              ? "من الفكرة إلى الإطلاق — DJAMA يرافقك في كل خطوة بحلول تناسب ميزانيتك وأهدافك."
              : lang === "en"
              ? "From idea to launch — DJAMA supports you at every step with solutions tailored to your budget and goals."
              : "De l'idée à la mise en ligne — DJAMA vous accompagne à chaque étape avec des solutions adaptées à votre budget et vos objectifs."
            }
          </p>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {(lang === "ar"
              ? ["بدون التزام", "رد خلال 24 ساعة", "مكالمة مجانية"]
              : lang === "en"
              ? ["No commitment", "Response within 24h", "Free call included"]
              : ["Sans engagement", "Réponse sous 24h", "Appel offert"]
            ).map((text) => (
              <span key={text} className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-gray-500">
                <CheckCircle2 size={12} style={{ color: "#4ade80" }} />
                {text}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[1rem] font-black text-[#100800] transition-all duration-200 hover:scale-[1.03] active:scale-[.97]"
              style={{
                background: `linear-gradient(135deg,${GOLD} 0%,#e2ba70 45%,#b08d45 100%)`,
                boxShadow: `0 8px 30px rgba(${GOLDR},0.45)`,
              }}
            >
              {lang === "ar" ? "ابدأ مشروعي" : lang === "en" ? "Start my project" : "Démarrer un projet"}
              <ArrowRight size={15} />
            </Link>
            <a
              href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-[1rem] font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[.97]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden style={{ color: "#25d366" }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-14 grid grid-cols-3 gap-4 border-t border-gray-200 pt-10"
          >
            {(lang === "ar"
              ? [{ value: "+50", label: "عميلاً مرافَقاً" }, { value: "24h", label: "وقت الرد" }, { value: "100%", label: "رضا العملاء" }]
              : lang === "en"
              ? [{ value: "50+", label: "clients supported" }, { value: "24h", label: "response time" }, { value: "100%", label: "client satisfaction" }]
              : [{ value: "50+", label: "clients accompagnés" }, { value: "24h", label: "délai de réponse" }, { value: "100%", label: "satisfaction client" }]
            ).map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span className="text-[1.6rem] font-extrabold leading-none" style={{ color: GOLD }}>{value}</span>
                <span className="text-center text-[0.65rem] leading-snug text-gray-400">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
