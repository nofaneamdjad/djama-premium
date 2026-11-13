"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import DjamaRobot from "@/components/DjamaRobot";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Mail, Users2, ShieldCheck,
  CheckCircle2, Sparkles,
  Globe, Brain, X,
  Code2, BarChart3, Briefcase,
  Receipt, CalendarRange, StickyNote, Timer, CreditCard, Gem, Star,
  Truck, Package, ListTodo, Zap, Wallet, Building2, Banknote,
  Network, FolderOpen, Share2, ShoppingBag, Bot, BarChart2,
  Store, Contact2, CalendarPlus, QrCode, PenLine, ShoppingCart,
  Landmark, FileCheck2, BookOpen, Target,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { APPS_DATA } from "@/lib/applications-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import StripeButton from "@/components/ui/StripeButton";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#FFB900";
const GOLDR = "255,185,0";

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

const HOME_CURSIVE: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontStyle: "normal",
  fontWeight: 800,
};

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


const PUBLIC_APP_ICONS = [
  /* 0 – Factures & devis */
  <svg key="p0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <defs><linearGradient id="pub0" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#FFB900"/></linearGradient></defs>
    <rect width="48" height="48" rx="12" fill="url(#pub0)"/>
    <rect x="12" y="10" width="20" height="26" rx="3" fill="white" fillOpacity="0.95"/>
    <rect x="15" y="16" width="14" height="2" rx="1" fill="#FFB900"/>
    <rect x="15" y="20" width="11" height="2" rx="1" fill="#FFB900" fillOpacity="0.6"/>
    <rect x="15" y="24" width="9" height="2" rx="1" fill="#FFB900" fillOpacity="0.4"/>
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
      className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[0.75rem] font-bold text-gray-600 transition hover:text-[#FFB900] disabled:opacity-60">
      {loading ? <Gem size={11} className="animate-spin" style={{ color: GOLD }} /> : null}
      {loading ? "…" : <><ArrowRight size={11} /> Acheter</>}
    </button>
  );
}

function HomeContent() {
  const data                  = getSiteData();
  const { lang }              = useLanguage();
  const HOME_GROUPED = ["Finance","Ventes","Commercial","Opérations","Digital","Intelligence","Notes","Gestion"]
    .map((cat) => ({ cat, apps: APPS_DATA.filter((a) => a.category === cat) }))
    .filter(({ apps }) => apps.length > 0);
  const { settings, get }     = useSiteSettings();
  const [parAn, setParAn]     = useState(false);
  const [payMode, setPayMode] = useState<"card" | "paypal" | "virement">("card");
  const [virEmail, setVirEmail] = useState("");
  const [virSent, setVirSent]   = useState(false);

  return (
    <div className="overflow-hidden">

      {/* ══════════════════════════════════════════════════════
           HERO — Chantier C.1 V3 : colonne unique, ERP
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pb-20 pt-[108px] sm:pb-28 sm:pt-[160px]"
        style={{ background: "#0A0A0A" }}
      >
        {/* Robot Compagnon V2 — coin bas-droit, hors flux */}
        <div
          className="pointer-events-none absolute bottom-6 right-6 z-20 opacity-40"
          aria-hidden="true"
        >
          <DjamaRobot size={32} state="idle" theme="dark" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#BFC3C9" }}
          >
            {lang === "ar"
              ? "برنامج إدارة المؤسسات"
              : lang === "en"
              ? "BUSINESS MANAGEMENT SOFTWARE"
              : "LOGICIEL DE GESTION D'ENTREPRISE"}
          </motion.p>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.08 }}
            className="text-[2.5rem] font-black leading-[1.07] tracking-tight text-white sm:text-[3.4rem] lg:text-[4rem]"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
          >
            {lang === "ar"
              ? "برنامج إدارة المؤسسات"
              : lang === "en"
              ? "Business management software"
              : "Logiciel de gestion d'entreprise"}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.18 }}
            className="mt-6 max-w-xl text-[1rem] leading-[1.7]"
            style={{ color: "#BFC3C9" }}
          >
            {lang === "ar"
              ? "وحّد عملاءك وفواتيرك وشؤونك المالية ومشاريعك وفرقك في منصة ذكية مصممة لتبسيط يومك."
              : lang === "en"
              ? "Centralize your clients, invoices, finances, projects and teams in an intelligent platform designed to simplify your daily work."
              : "Centralisez vos clients, vos factures, vos finances, vos projets et vos équipes dans une plateforme intelligente conçue pour simplifier votre quotidien."}
          </motion.p>

          {/* Séparateur discret */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease, delay: 0.24 }}
            className="mt-8 h-px w-12"
            style={{ background: "#333333" }}
          />

          {/* CTAs — rectangulaires */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.3 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            {/* Principal : blanc / texte noir */}
            <Link
              href="/espace-client"
              className="inline-flex items-center justify-center gap-2 px-7 text-[0.88rem] font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: "#FFFFFF", borderRadius: 5, height: 46 }}
            >
              {lang === "ar" ? "اكتشف DJAMA" : lang === "en" ? "Discover DJAMA" : "Découvrir DJAMA"}
              <ArrowRight size={14} />
            </Link>
            {/* Secondaire : transparent / texte blanc / bordure grise */}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 text-[0.88rem] font-semibold text-white transition-opacity hover:opacity-80 active:opacity-70"
              style={{ background: "transparent", border: "1px solid #444444", borderRadius: 5, height: 46 }}
            >
              {lang === "ar" ? "احجز عرضًا توضيحيًا" : lang === "en" ? "Get a demo" : "Obtenir une démo"}
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           APPLICATIONS — catalogue complet 45 apps
      ══════════════════════════════════════════════════════ */}
      <section id="outils" className="pb-10 pt-10" style={{ background: "#f4f5f7" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          {/* En-tête de section — aligné à gauche, compact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-7"
          >
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[0.63rem] font-bold uppercase tracking-[.22em]"
              style={{ borderColor: "rgba(255,185,0,0.35)", background: "rgba(255,185,0,0.07)", color: "#b45309" }}
            >
              Les applications DJAMA
            </div>
            <h2 className="text-[1.5rem] font-extrabold leading-tight text-gray-900 sm:text-[1.75rem]">
              Tous les outils pour gérer votre entreprise.
            </h2>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-gray-500">
              De la facturation à la gestion des équipes, DJAMA réunit vos applications professionnelles dans un seul espace.
            </p>
          </motion.div>

          {/* Grille par catégorie */}
          {HOME_GROUPED.map(({ cat, apps }, gi) => (
            <motion.div key={cat}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.35, ease, delay: gi * 0.04 }}
              className="mb-6"
            >
              {/* Titre catégorie — bold italic, style App Library */}
              <h3 className="mb-3 text-[1.35rem] text-gray-900 sm:text-[1.5rem]"
                style={{ fontWeight: 800, fontStyle: "italic", letterSpacing: "-0.01em" }}>
                {cat}
              </h3>

              {/* Carte blanche contenant la grille */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-y-5 gap-x-2 sm:grid-cols-4 lg:grid-cols-6">
                  {apps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <Link
                        key={app.slug}
                        href={`/applications/${app.slug}`}
                        className="group flex flex-col items-center gap-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,185,0,0.5)] rounded-xl"
                      >
                        {/* Icône iOS squircle — taille augmentée */}
                        <div style={{
                          width: 66, height: 66, borderRadius: "27%",
                          background: app.color, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)",
                          position: "relative", overflow: "hidden",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                          className="group-hover:scale-105 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.22)]"
                        >
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(150deg, rgba(255,255,255,0.22) 0%, transparent 52%)",
                            borderRadius: "inherit", pointerEvents: "none",
                          }} />
                          <Icon size={30} color="white" strokeWidth={1.6} style={{ position: "relative", zIndex: 1 }} />
                        </div>
                        <p className="w-full text-[0.72rem] font-semibold leading-tight text-gray-700 group-hover:text-gray-900">
                          {app.label}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <PartnerLogosSection />
      <TestimonialsSection dynamic />


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
              style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontWeight: 800 }}>
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
            { n: "44", label: "outils inclus" },
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
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontWeight: 700, color: GOLD }}
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
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontWeight: 700 }}>
            Libérez
          </p>
          <p className="mb-10 text-[2.4rem] leading-tight sm:text-[3.2rem]"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontStyle: "italic", fontWeight: 600, color: "#5dc8be" }}>
            votre potentiel de croissance
          </p>

          {/* Bouton principal */}
          <Link
            href="/client"
            className="inline-flex items-center justify-center rounded-2xl px-10 py-4 text-[1rem] font-bold text-black transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[.97]"
            style={{ background: GOLD, boxShadow: `0 8px 32px rgba(${GOLDR},0.30)` }}
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
