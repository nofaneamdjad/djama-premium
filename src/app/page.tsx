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
  MessageCircle, Gift, Search, Clock, GraduationCap, UserPlus, Video, Mic, Bell,
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


/* ── Vraie palette DJAMA espace client ── */
const D_SIDEBAR  = "#111318";
const D_CONTENT  = "#07090e";
const D_BORDER   = "rgba(255,255,255,0.07)";
const D_TEXT     = "rgba(255,255,255,0.65)";
const D_MUTED    = "rgba(255,255,255,0.25)";
const D_CARD     = "rgba(255,255,255,0.04)";

/* Groupes sidebar réels */
const MOCK_NAV = [
  { group: null, items: [
    { id: "dashboard", label: "Tableau de bord", Icon: BarChart2 },
  ]},
  { group: "Finance", items: [
    { id: "factures",  label: "Factures",    Icon: Receipt  },
    { id: "tresorerie",label: "Trésorerie",  Icon: Wallet   },
  ]},
  { group: "Commercial", items: [
    { id: "crm",       label: "CRM",         Icon: Users2   },
    { id: "contrats",  label: "Contrats",    Icon: FileCheck2 },
  ]},
  { group: "Intelligence", items: [
    { id: "ia",        label: "Assistant IA", Icon: Zap     },
    { id: "coaching",  label: "Coaching IA",  Icon: Brain   },
  ]},
];

const CYCLE_SCREENS = ["dashboard", "factures", "crm", "ia"] as const;

function DjamaScreenContent({ screen }: { screen: string }) {
  if (screen === "dashboard") return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[0.58rem] font-semibold uppercase tracking-widest" style={{ color: D_MUTED }}>Bonjour · Août 2026</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "CA du mois",  value: "18 400 €", badge: "+12%",    ok: true  },
          { label: "Factures",    value: "7",         badge: "2 retards",ok: false },
          { label: "Clients",     value: "34",        badge: "+3 ce mois",ok: true },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3" style={{ background: D_CARD, border: D_BORDER }}>
            <p className="text-[0.55rem]" style={{ color: D_MUTED }}>{k.label}</p>
            <p className="mt-1 text-[0.9rem] font-black text-white">{k.value}</p>
            <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold"
              style={{ background: k.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                       color: k.ok ? "#34d399" : "#f87171" }}>
              {k.badge}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3" style={{ background: D_CARD, border: D_BORDER }}>
        <p className="mb-2 text-[0.55rem] font-semibold" style={{ color: D_MUTED }}>CA · 6 derniers mois</p>
        <div className="flex items-end gap-1.5 h-10">
          {[40, 55, 48, 70, 62, 88].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? GOLD : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>
      <div className="rounded-xl p-3" style={{ background: D_CARD, border: D_BORDER }}>
        <p className="mb-2 text-[0.55rem] font-semibold" style={{ color: D_MUTED }}>Actions rapides</p>
        <div className="flex gap-2">
          {["Facture", "Devis", "Dépense", "Contact"].map(a => (
            <div key={a} className="flex-1 rounded-lg py-1.5 text-center text-[0.52rem] font-bold"
              style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}25` }}>
              {a}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "factures") return (
    <div className="flex flex-col gap-0 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-bold text-white">Factures & Devis</p>
        <span className="rounded-lg px-2.5 py-1 text-[0.58rem] font-bold"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}25` }}>+ Nouvelle facture</span>
      </div>
      <div className="mb-2 grid grid-cols-4 gap-2 text-[0.52rem] font-semibold uppercase tracking-wider" style={{ color: D_MUTED }}>
        <span>Numéro</span><span>Client</span><span className="text-right">Montant</span><span className="text-right">Statut</span>
      </div>
      {[
        { ref: "2026-089", client: "Groupe Esseba",   amount: "3 200 €", s: "Payée",      ok: true  },
        { ref: "2026-088", client: "Entreprise Koné", amount: "1 840 €", s: "En retard",  ok: false },
        { ref: "2026-087", client: "SCI Bézavana",    amount: "5 100 €", s: "En attente", ok: null  },
        { ref: "2026-086", client: "Maison Jasmina",  amount: "920 €",   s: "Payée",      ok: true  },
      ].map((f, i) => (
        <div key={f.ref} className="grid grid-cols-4 items-center gap-2 py-2 text-[0.62rem]"
          style={{ borderTop: i === 0 ? D_BORDER : D_BORDER }}>
          <span className="font-mono text-[0.55rem]" style={{ color: D_MUTED }}>#{f.ref}</span>
          <span className="font-semibold text-white truncate">{f.client}</span>
          <span className="text-right font-black text-white">{f.amount}</span>
          <span className="text-right">
            <span className="rounded-full px-1.5 py-0.5 text-[0.5rem] font-semibold"
              style={{ background: f.ok === true ? "rgba(16,185,129,0.15)" : f.ok === false ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                       color: f.ok === true ? "#34d399" : f.ok === false ? "#f87171" : D_MUTED }}>
              {f.s}
            </span>
          </span>
        </div>
      ))}
    </div>
  );

  if (screen === "crm") return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[0.7rem] font-bold text-white">CRM — Pipeline</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { col: "Prospects", color: "#6366f1", count: 3, items: ["Startup Tekki", "Agence Soleil", "Mr. Diallo"] },
          { col: "En cours",  color: GOLD,      count: 2, items: ["Groupe Esseba", "SCI Bézavana"]               },
          { col: "Gagnés",    color: "#10b981", count: 3, items: ["Ent. Koné", "M. Jasmina", "Tech Réunion"]    },
        ].map(col => (
          <div key={col.col}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                <p className="text-[0.58rem] font-bold" style={{ color: D_MUTED }}>{col.col}</p>
              </div>
              <span className="rounded-full px-1.5 text-[0.5rem] font-bold" style={{ background: `${col.color}20`, color: col.color }}>{col.count}</span>
            </div>
            {col.items.map(item => (
              <div key={item} className="mb-1 rounded-lg px-2 py-2 text-[0.58rem] font-semibold"
                style={{ background: D_CARD, border: D_BORDER, color: D_TEXT }}>
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="mb-1 text-[0.7rem] font-bold text-white">Assistant IA</p>
      <div className="flex flex-col gap-2">
        {[
          { who: "Vous",  msg: "Génère une relance pour la facture #2026-088",  right: true  },
          { who: "DJAMA IA", msg: "Relance envoyée à Entreprise Koné — Objet : Rappel facture échue, réponse attendue sous 48h.", right: false },
          { who: "Vous",  msg: "Résumé du CA de ce mois ?",         right: true  },
          { who: "DJAMA IA", msg: "CA août 2026 : 18 400 € — en hausse de +12% vs juillet. 34 clients actifs.", right: false },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.25 }}
            className={`flex ${m.right ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-xl px-2.5 py-1.5 text-[0.6rem] leading-snug"
              style={{ background: m.right ? `${GOLD}22` : D_CARD,
                       border: `1px solid ${m.right ? `${GOLD}30` : D_BORDER}`,
                       color: m.right ? "#f5e6cc" : D_TEXT }}>
              <p className="mb-0.5 text-[0.5rem] font-bold" style={{ color: m.right ? GOLD : D_MUTED }}>{m.who}</p>
              {m.msg}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DjamaVideoSection() {
  const [step,     setStep]     = useState(0);
  const [playing,  setPlaying]  = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const DURATION = 4500;
    const TICK = 60;
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += TICK;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
      if (elapsed >= DURATION) { elapsed = 0; setStep(s => (s + 1) % CYCLE_SCREENS.length); }
    }, TICK);
    return () => clearInterval(t);
  }, [playing, step]);

  const activeId = CYCLE_SCREENS[step];

  return (
    <section className="py-0" style={{ background: "linear-gradient(160deg, #0d1f37 0%, #0f2744 45%, #0a1929 100%)" }}>
      {/* Dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ backgroundImage: "radial-gradient(circle, rgba(201,165,90,0.055) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Hero text */}
      <div className="relative px-6 pb-10 pt-20 text-center sm:pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.8, ease }}>
          <p className="mb-4 text-[0.72rem] font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>
            Bienvenue dans la nouvelle ère
          </p>
          <h2 className="text-[2.8rem] font-black leading-[1.05] text-white sm:text-[4.5rem]"
            style={{ fontFamily: "'Caveat', cursive" }}>
            Votre business,{" "}
            <span style={{ background: `linear-gradient(90deg, ${GOLD}, #e8c97a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              enfin unifié.
            </span>
          </h2>
          <p className="mt-5 text-[1rem] sm:text-[1.1rem]" style={{ color: "rgba(186,210,255,0.65)" }}>
            Factures · CRM · IA · Paie · Projets — tout sur une seule plateforme.
          </p>
        </motion.div>
      </div>

      {/* Product mockup */}
      <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.7, ease, delay: 0.15 }}>

          <div className="overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: D_CONTENT, border: "1px solid rgba(255,255,255,0.1)" }}>

            {/* macOS browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#1a1d26", borderBottom: D_BORDER }}>
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <div className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1"
                style={{ background: "rgba(255,255,255,0.06)", border: D_BORDER, minWidth: 180 }}>
                <ShieldCheck size={9} className="text-green-400" />
                <span className="text-[0.65rem]" style={{ color: D_MUTED }}>app.djama.space</span>
              </div>
            </div>

            {/* App layout */}
            <div className="flex" style={{ minHeight: 360 }}>

              {/* Sidebar — vraie DJAMA */}
              <div className="flex w-[148px] shrink-0 flex-col" style={{ background: D_SIDEBAR, borderRight: D_BORDER }}>
                {/* Logo */}
                <div className="flex h-[44px] items-center gap-2 px-3" style={{ borderBottom: D_BORDER }}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}28` }}>
                    <Sparkles size={11} style={{ color: GOLD }} />
                  </div>
                  <div className="leading-none">
                    <p className="text-[0.8rem] font-bold" style={{ color: GOLD }}>DJAMA</p>
                    <p className="text-[0.45rem] uppercase tracking-widest" style={{ color: D_MUTED }}>PRO · Actif</p>
                  </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-hidden px-1.5 py-2">
                  {MOCK_NAV.map((section, si) => (
                    <div key={si} className={si > 0 ? "mt-3" : ""}>
                      {section.group && (
                        <p className="mb-1 px-2 text-[0.47rem] font-semibold uppercase tracking-wider" style={{ color: D_MUTED }}>
                          {section.group}
                        </p>
                      )}
                      {section.items.map(({ id, label, Icon }) => {
                        const active = id === activeId;
                        return (
                          <button key={id} onClick={() => { setStep(CYCLE_SCREENS.indexOf(id as typeof CYCLE_SCREENS[number])); setProgress(0); }}
                            className="relative flex w-full items-center gap-2 rounded-lg px-2 py-[5px] text-left text-[0.68rem] font-medium transition-colors"
                            style={{ background: active ? `${GOLD}1c` : "transparent",
                                     color: active ? GOLD : D_TEXT }}>
                            {active && <span className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-r-full" style={{ background: GOLD }} />}
                            <Icon size={12} style={{ color: active ? GOLD : undefined }} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>

                {/* User footer */}
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderTop: D_BORDER }}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.58rem] font-bold"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}22`, color: GOLD }}>
                    A
                  </div>
                  <div className="leading-none">
                    <p className="text-[0.6rem] font-medium" style={{ color: D_TEXT }}>Awa Diallo</p>
                    <p className="text-[0.45rem]" style={{ color: D_MUTED }}>DJAMA PRO</p>
                  </div>
                </div>
              </div>

              {/* Main */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <div className="flex h-[44px] shrink-0 items-center gap-2 px-3" style={{ background: D_SIDEBAR, borderBottom: D_BORDER }}>
                  <div className="flex flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: D_BORDER, maxWidth: 200 }}>
                    <Search size={10} style={{ color: D_MUTED }} />
                    <span className="text-[0.6rem]" style={{ color: D_MUTED }}>Rechercher…</span>
                    <kbd className="ml-auto rounded px-1 py-0.5 text-[0.45rem]"
                      style={{ background: "rgba(255,255,255,0.06)", border: D_BORDER, color: D_MUTED }}>⌘K</kbd>
                  </div>
                  <div className="flex-1" />
                  <Bell size={13} style={{ color: D_MUTED }} />
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg text-[0.58rem] font-bold"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}22`, color: GOLD }}>A</div>
                </div>

                {/* Page content */}
                <div className="flex-1 overflow-hidden" style={{ background: D_CONTENT }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={step}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                      <DjamaScreenContent screen={activeId} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Progress controls */}
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: D_SIDEBAR, borderTop: D_BORDER }}>
              <button onClick={() => setPlaying(p => !p)}
                className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: D_MUTED }}>
                {playing
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8" rx="0.8"/><rect x="6" y="1" width="3" height="8" rx="0.8"/></svg>
                  : <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1l7 4-7 4V1z"/></svg>
                }
              </button>
              <div className="relative flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%`, background: GOLD }} />
              </div>
              <div className="flex gap-1">
                {CYCLE_SCREENS.map((_, i) => (
                  <button key={i} onClick={() => { setStep(i); setProgress(0); }}
                    className="h-0.5 rounded-full transition-all duration-300"
                    style={{ width: i === step ? 18 : 5, background: i === step ? GOLD : "rgba(255,255,255,0.2)" }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

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
           VIDEO ANIMATION — "IA au cœur de votre business"
      ══════════════════════════════════════════════════════ */}
      <DjamaVideoSection />

      <PartnerLogosSection />
      <TestimonialsSection dynamic />

      {/* ── Texte manifeste ───────────────────────── */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.7, ease }}>
            <p className="text-[1.15rem] font-black leading-snug text-gray-900 sm:text-[1.4rem]">
              Imaginez une vaste collection d&apos;applications professionnelles à votre disposition.
            </p>
            <p className="mt-4 text-[1rem] leading-relaxed text-gray-500">
              Vous avez quelque chose à améliorer ? Il existe une app pour ça.
            </p>
            <p className="text-[1rem] leading-relaxed text-gray-500">
              Aucune complexité, aucun frais, une simple installation en un clic.
            </p>
            <p className="mt-8 text-[1rem] leading-relaxed text-gray-500">
              Chaque application simplifie un processus et permet à davantage de personnes d&apos;agir.
            </p>
            <p className="text-[1rem] leading-relaxed text-gray-500">
              Imaginez l&apos;impact lorsque chacun dispose de l&apos;outil adapté à ses besoins, enrichi par l&apos;IA native.
            </p>
          </motion.div>
        </div>
      </section>

      {false && <><section className="overflow-hidden bg-[#f4f5f7] py-20 sm:py-28">
        <style>{`
          @keyframes djBb{from{width:0}to{width:var(--bw,100%)}}
          @keyframes djBd{0%,60%,100%{opacity:0}30%{opacity:1}}
          @keyframes djBs{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
          @keyframes djPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
          @keyframes djCount{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
          .dj-bar{width:0;animation:djBb 1.8s ease-out var(--bd,0s) forwards}
          .dj-d1{animation:djBd 1.3s infinite}
          .dj-d2{animation:djBd 1.3s .22s infinite}
          .dj-d3{animation:djBd 1.3s .44s infinite}
          .dj-ping{animation:djPing 2s ease-out infinite}
          .dj-s1{animation:djBs .45s ease-out .25s both}
          .dj-s2{animation:djBs .45s ease-out .65s both}
          .dj-s3{animation:djBs .45s ease-out 1.05s both}
          .dj-s4{animation:djBs .45s ease-out 1.45s both}
          .dj-s5{animation:djBs .45s ease-out 1.85s both}
          .dj-s6{animation:djBs .45s ease-out 2.25s both}
          .dj-count{animation:djCount .5s ease-out .4s both}
        `}</style>

        <div className="mx-auto max-w-6xl px-6">

          {/* Titre */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.65, ease }}
            className="mb-14 text-center">
            <h2 className="text-[2.6rem] leading-[1.1] text-gray-900 sm:text-[4rem]"
              style={{ fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
              Tout ce dont vous avez{" "}
              <span className="relative inline-block whitespace-nowrap">
                besoin.
                <span className="pointer-events-none absolute -bottom-1 left-0 right-0 h-[5px] rounded-full"
                  style={{ background: `linear-gradient(90deg,transparent,rgba(${GOLDR},0.6) 20%,rgba(${GOLDR},0.6) 80%,transparent)` }} />
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[0.95rem] text-gray-500">
              48 outils professionnels. Une seule plateforme. Un seul abonnement.
            </p>
          </motion.div>

          {/* Bento grid — layout asymétrique 3 cols */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
            className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-3">

            {/* ── Card 1 — Facturation IA — dark · 2 cols */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 28px 64px rgba(0,0,0,0.25)" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl p-6 sm:col-span-2"
              style={{ background: "linear-gradient(135deg,#111827 0%,#1a253a 100%)", minHeight: 288, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
                style={{ background: `radial-gradient(circle,rgba(${GOLDR},0.14) 0%,transparent 70%)` }} />
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `rgba(${GOLDR},0.14)` }}>
                  <Receipt size={17} style={{ color: GOLD }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: GOLD + "99" }}>Finance</p>
                  <p className="text-[0.92rem] font-black text-white">Facturation IA</p>
                </div>
              </div>
              {/* Mini invoice */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[0.52rem] font-bold text-white">Facture #2026-094</span>
                  <span className="rounded-full px-2 py-0.5 text-[0.4rem] font-bold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>✓ Envoyée</span>
                </div>
                {[
                  { label: "Consulting stratégie", qty: "8h", price: "1 600 €", cls: "dj-s1" },
                  { label: "Développement web", qty: "12h", price: "2 400 €", cls: "dj-s2" },
                  { label: "Formation IA", qty: "4h", price: "800 €", cls: "dj-s3" },
                ].map(({ label, qty, price, cls }) => (
                  <div key={label} className={`${cls} mb-1 flex items-center justify-between rounded-lg px-2 py-1.5`}
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-[0.46rem]" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                    <span className="text-[0.44rem]" style={{ color: "rgba(255,255,255,0.3)" }}>{qty}</span>
                    <span className="text-[0.5rem] font-bold text-white">{price}</span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <span className="text-[0.5rem] text-gray-400">Total TTC</span>
                  <span className="dj-count text-[0.9rem] font-black" style={{ color: GOLD }}>4 800 €</span>
                </div>
              </div>
            </motion.div>

            {/* ── Card 2 — CRM Clients — blanc · 1 col */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(0,0,0,0.10)", borderColor: "#60a5fa44" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl bg-white p-6"
              style={{ border: "1px solid rgba(0,0,0,0.06)", minHeight: 288 }}>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(96,165,250,0.12)" }}>
                  <Users2 size={17} style={{ color: "#60a5fa" }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: "#60a5fa99" }}>Commercial</p>
                  <p className="text-[0.92rem] font-black text-gray-900">CRM Clients</p>
                </div>
              </div>
              {/* Kanban */}
              <div className="flex gap-1.5">
                {[
                  { label: "Prospects", color: "#94a3b8", cards: ["Groupe A", "M. Diallo"], cls: ["dj-s1", "dj-s2"] },
                  { label: "Devis", color: "#f59e0b", cards: ["SCI Béza…"], cls: ["dj-s3"] },
                  { label: "Signés", color: "#4ade80", cards: ["Koné & Co"], cls: ["dj-s4"] },
                ].map(({ label, color, cards, cls }) => (
                  <div key={label} className="flex-1 rounded-xl p-1.5" style={{ background: `${color}0d` }}>
                    <p className="mb-1.5 text-[0.4rem] font-bold uppercase tracking-wider" style={{ color }}>{label}</p>
                    {cards.map((c, i) => (
                      <div key={c} className={`${cls[i]} mb-1 rounded-lg px-1.5 py-1.5 text-[0.4rem] font-semibold text-gray-700`}
                        style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{c}</div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Stat */}
              <div className="mt-3 flex items-center gap-2 rounded-xl px-2.5 py-2"
                style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div className="relative h-2 w-2 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: "#4ade80" }} />
                  <div className="dj-ping absolute inset-0 rounded-full" style={{ background: "#4ade80" }} />
                </div>
                <span className="text-[0.46rem] text-gray-500">34 clients actifs · +3 ce mois</span>
              </div>
            </motion.div>

            {/* ── Card 3 — Assistant IA — blanc · 1 col */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(0,0,0,0.10)", borderColor: "#a78bfa44" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl bg-white p-6"
              style={{ border: "1px solid rgba(0,0,0,0.06)", minHeight: 240 }}>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(167,139,250,0.12)" }}>
                  <Brain size={17} style={{ color: "#a78bfa" }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: "#a78bfa99" }}>Intelligence</p>
                  <p className="text-[0.92rem] font-black text-gray-900">Assistant IA</p>
                </div>
              </div>
              {/* Chat animé */}
              <div className="flex flex-col gap-2">
                <div className="dj-s1 ml-auto max-w-[85%] rounded-xl rounded-br-none px-2.5 py-1.5"
                  style={{ background: "rgba(167,139,250,0.10)" }}>
                  <p className="text-[0.45rem] text-gray-700">Génère une relance pour la facture #2026-088</p>
                </div>
                <div className="dj-s2 rounded-xl rounded-bl-none px-2.5 py-1.5"
                  style={{ background: "#f8f7ff", border: "1px solid rgba(167,139,250,0.18)" }}>
                  <p className="mb-0.5 text-[0.4rem] font-bold" style={{ color: "#a78bfa" }}>DJAMA IA</p>
                  <p className="text-[0.45rem] text-gray-600">Relance envoyée à Ent. Koné — réponse attendue sous 48h.</p>
                </div>
                <div className="dj-s3 ml-auto max-w-[85%] rounded-xl rounded-br-none px-2.5 py-1.5"
                  style={{ background: "rgba(167,139,250,0.10)" }}>
                  <p className="text-[0.45rem] text-gray-700">Résumé du CA de ce mois ?</p>
                </div>
                {/* Typing */}
                <div className="dj-s4 flex w-fit items-center gap-1 rounded-xl rounded-bl-none px-2.5 py-1.5"
                  style={{ background: "#f8f7ff", border: "1px solid rgba(167,139,250,0.18)" }}>
                  <span className="dj-d1 h-1.5 w-1.5 rounded-full" style={{ background: "#a78bfa" }} />
                  <span className="dj-d2 h-1.5 w-1.5 rounded-full" style={{ background: "#a78bfa" }} />
                  <span className="dj-d3 h-1.5 w-1.5 rounded-full" style={{ background: "#a78bfa" }} />
                </div>
              </div>
            </motion.div>

            {/* ── Card 4 — Paie & RH — dark · 2 cols */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 28px 64px rgba(0,0,0,0.25)" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl p-6 sm:col-span-2"
              style={{ background: "linear-gradient(135deg,#111827 0%,#1a253a 100%)", minHeight: 240, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full"
                style={{ background: "radial-gradient(circle,rgba(74,222,128,0.10) 0%,transparent 70%)" }} />
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(74,222,128,0.12)" }}>
                  <CreditCard size={17} style={{ color: "#4ade80" }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: "#4ade8099" }}>Ressources humaines</p>
                  <p className="text-[0.92rem] font-black text-white">Paie & RH</p>
                </div>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[0.44rem] font-bold"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>Conforme OHADA</span>
              </div>
              {/* Bars */}
              <div className="flex flex-col gap-3">
                {[
                  { label: "Cadres", pct: "85%", color: "#4ade80", amt: "4 200 €", delay: "0s" },
                  { label: "Techniciens", pct: "62%", color: "#60a5fa", amt: "2 800 €", delay: "0.2s" },
                  { label: "Agents", pct: "44%", color: GOLD, amt: "1 950 €", delay: "0.4s" },
                ].map(({ label, pct, color, amt, delay }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[0.46rem]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                      <span className="text-[0.5rem] font-bold" style={{ color }}>{amt}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="dj-bar h-full rounded-full" style={{ "--bw": pct, "--bd": delay, background: color } as React.CSSProperties} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Card 5 — Gestion de projets — blanc · 1 col */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(0,0,0,0.10)", borderColor: "#fb923c44" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl bg-white p-6"
              style={{ border: "1px solid rgba(0,0,0,0.06)", minHeight: 220 }}>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(251,146,60,0.12)" }}>
                  <FolderOpen size={17} style={{ color: "#fb923c" }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: "#fb923c99" }}>Opérations</p>
                  <p className="text-[0.92rem] font-black text-gray-900">Gestion de projets</p>
                </div>
              </div>
              {/* Task list */}
              <div className="flex flex-col gap-1.5">
                {[
                  { task: "Livraison client Esseba", done: true, cls: "dj-s1" },
                  { task: "Rapport mensuel Q3", done: true, cls: "dj-s2" },
                  { task: "Formation équipe", done: false, cls: "dj-s3" },
                  { task: "Audit fournisseurs", done: false, cls: "dj-s4" },
                ].map(({ task, done, cls }) => (
                  <div key={task}
                    className={`${cls} flex items-center gap-2 rounded-lg px-2 py-1.5`}
                    style={{ background: done ? "rgba(251,146,60,0.06)" : "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: done ? "rgba(251,146,60,0.18)" : "transparent", border: done ? "none" : "1.5px solid rgba(0,0,0,0.15)" }}>
                      {done && <span style={{ color: "#fb923c", fontSize: "0.45rem", lineHeight: 1 }}>✓</span>}
                    </div>
                    <span className="text-[0.46rem]"
                      style={{ color: done ? "#fb923c" : "#6b7280", textDecoration: done ? "line-through" : "none", opacity: done ? 0.65 : 1 }}>{task}</span>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div className="dj-bar h-full rounded-full" style={{ "--bw": "65%", "--bd": "0.3s", background: "#fb923c" } as React.CSSProperties} />
                </div>
                <span className="text-[0.46rem] font-bold" style={{ color: "#fb923c" }}>65%</span>
              </div>
            </motion.div>

            {/* ── Card 6 — Sourcing & Marchés — blanc · 2 cols */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
              whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(0,0,0,0.10)", borderColor: "#34d39944" }}
              transition={{ duration: 0.22 }}
              className="relative overflow-hidden rounded-2xl bg-white p-6 sm:col-span-2"
              style={{ border: "1px solid rgba(0,0,0,0.06)", minHeight: 220 }}>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <Truck size={17} style={{ color: "#34d399" }} strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.15em]" style={{ color: "#34d39999" }}>Sourcing</p>
                  <p className="text-[0.92rem] font-black text-gray-900">Sourcing & Marchés</p>
                </div>
              </div>
              {/* Badges pays animés */}
              <div className="flex flex-wrap gap-2">
                {[
                  { flag: "🇫🇷", country: "France", type: "Marché public", color: "#3b82f6", cls: "dj-s1" },
                  { flag: "🇨🇲", country: "Cameroun", type: "Appel d'offres", color: "#34d399", cls: "dj-s2" },
                  { flag: "🇸🇳", country: "Sénégal", type: "Fournisseur", color: GOLD, cls: "dj-s3" },
                  { flag: "🇨🇮", country: "Côte d'Ivoire", type: "Marché public", color: "#f87171", cls: "dj-s4" },
                  { flag: "🇲🇦", country: "Maroc", type: "Appel d'offres", color: "#a78bfa", cls: "dj-s5" },
                  { flag: "🇬🇦", country: "Gabon", type: "Fournisseur", color: "#fb923c", cls: "dj-s6" },
                ].map(({ flag, country, type, color, cls }) => (
                  <div key={country}
                    className={`${cls} flex items-center gap-1.5 rounded-full px-2.5 py-1.5`}
                    style={{ background: `${color}0f`, border: `1px solid ${color}22` }}>
                    <span style={{ fontSize: "0.75rem" }}>{flag}</span>
                    <div>
                      <p className="text-[0.46rem] font-bold leading-none" style={{ color }}>{country}</p>
                      <p className="mt-0.5 text-[0.38rem] leading-none text-gray-400">{type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>

        </div>
      </section></> }

      {/* ── Chiffres clés ── */}
      <section className="bg-white pb-4 pt-0">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="mx-auto grid max-w-2xl grid-cols-3 divide-x divide-gray-100 px-6"
        >
          {[
            { n: "48", label: "outils inclus" },
            { n: "1 200+", label: "entrepreneurs actifs" },
            { n: "1 clic", label: "pour installer" },
          ].map(({ n, label }) => (
            <motion.div
              key={label}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
              className="flex flex-col items-center gap-1 px-4 py-6 text-center"
            >
              <span
                className="text-[2rem] leading-none sm:text-[2.4rem]"
                style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, color: GOLD }}
              >
                {n}
              </span>
              <span className="text-[0.72rem] font-medium uppercase tracking-widest text-gray-400">
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Final CTA — style manifeste ── */}
      <section className="relative overflow-hidden bg-white px-5 py-24 text-center sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          {/* Burst décoratif doré */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <svg viewBox="0 0 96 96" width="96" height="96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              {/* Cœur */}
              <path d="M48 32c0-6-5-10-10-10s-10 5-10 10c0 10 20 22 20 22s20-12 20-22c0-5-5-10-10-10s-10 4-10 10z"
                fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinejoin="round" opacity="0.7"/>
              {/* Rayons */}
              <line x1="48" y1="4" x2="48" y2="14" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="48" y1="82" x2="48" y2="92" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="4" y1="48" x2="14" y2="48" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="82" y1="48" x2="92" y2="48" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="14" y1="14" x2="21" y2="21" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
              <line x1="75" y1="75" x2="82" y2="82" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
              <line x1="82" y1="14" x2="75" y2="21" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
              <line x1="14" y1="82" x2="21" y2="75" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
              <line x1="48" y1="4" x2="52" y2="10" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
              <line x1="48" y1="4" x2="44" y2="10" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>

          {/* Titre */}
          <p className="text-[3rem] leading-none text-gray-900 sm:text-[4rem]"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
            Libérez
          </p>
          <p className="mb-10 text-[2.4rem] leading-tight sm:text-[3.2rem]"
            style={{ fontFamily: "'Caveat', cursive", fontStyle: "italic", fontWeight: 600, color: "#5dc8be" }}>
            votre potentiel de croissance
          </p>

          {/* Bouton principal */}
          <Link
            href="/client"
            className="inline-flex items-center justify-center rounded-2xl px-10 py-4 text-[1rem] font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[.97]"
            style={{ background: "#5c3d60", boxShadow: "0 8px 32px rgba(92,61,96,0.30)" }}
          >
            Lancez-vous — C&apos;est gratuit !
          </Link>

          {/* Flèche + réassurance */}
          <div className="mt-6 flex flex-col items-center gap-1">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#5dc8be" aria-hidden>
              <path d="M12 4l-1.4 1.4L17.2 11H4v2h13.2l-6.6 5.6L12 20l9-8-9-8z" transform="rotate(-90 12 12)"/>
            </svg>
            <p className="text-[0.82rem] text-gray-400">Aucune carte de crédit requise</p>
            <p className="text-[0.82rem] text-gray-400">Accès instantané</p>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
