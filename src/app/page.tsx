"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantDJAMA from "@/components/AssistantDJAMA";
import { LanguageProvider } from "@/lib/language-context";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Mail, Users2, Shield, ShieldCheck,
  CheckCircle2, Sparkles, HeartHandshake,
  Globe, Brain,
  Code2, BarChart3, Briefcase,
  Receipt, CalendarRange, StickyNote, Timer, CreditCard, Gem, Star,
  Truck, Package, ListTodo, Zap, Wallet, Building2, Banknote,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import PartnerLogosSection from "@/components/PartnerLogosSection";
import TestimonialsSection from "@/components/TestimonialsSection";

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

const ESPACE_TOOLS = [
  { icon: Receipt,       color: GOLD,       title: "Factures & devis",       desc: "Documents pro en quelques clics." },
  { icon: CalendarRange, color: "#60a5fa",  title: "Agenda & Planification",  desc: "Rendez-vous, équipes et tâches." },
  { icon: StickyNote,    color: "#4ade80",  title: "Bloc-notes pro",          desc: "Idées et mémos centralisés." },
  { icon: Brain,         color: "#a78bfa",  title: "Coach Business IA",       desc: "Conseils précis et actionnables." },
  { icon: Users2,        color: "#22d3ee",  title: "CRM Client",              desc: "Contacts, prospects et historique." },
  { icon: Timer,         color: "#fb923c",  title: "Chrono Pro",              desc: "Temps par projet et rentabilité." },
  { icon: CreditCard,    color: "#f43f5e",  title: "Dépenses Pro",            desc: "Frais pro par catégorie." },
  { icon: Wallet,        color: "#34d399",  title: "Trésorerie",              desc: "Flux, solde et finances." },
  { icon: ShieldCheck,   color: "#eab308",  title: "Contrats IA",             desc: "Contrats personnalisés en secondes." },
  { icon: Globe,         color: "#f59e0b",  title: "Sourcing IA",             desc: "Fournisseurs et marchés publics." },
  { icon: Truck,         color: "#16a34a",  title: "Fournisseurs",            desc: "Catalogue et commandes." },
  { icon: Package,       color: "#0d9488",  title: "Stocks",                  desc: "Inventaire en temps réel." },
  { icon: ListTodo,      color: "#be185d",  title: "Tâches",                  desc: "To-do, projets et suivi." },
  { icon: Users2,        color: "#0891b2",  title: "Équipe",                  desc: "Membres et planification RH." },
  { icon: StickyNote,    color: "#92400e",  title: "Notes IA",                desc: "Prise de notes intelligente." },
  { icon: Zap,           color: "#0369a1",  title: "Assistant IA",            desc: "Relances auto et conseils." },
  { icon: Star,          color: "#b91c1c",  title: "Réputation",              desc: "Avis et e-réputation." },
  { icon: Zap,           color: "#e1306c",  title: "Réseaux Sociaux IA",      desc: "Planifiez et créez du contenu." },
  { icon: Building2,     color: "#3b82f6",  title: "Portail Client",           desc: "Espace dédié à chaque client." },
  { icon: Banknote,      color: "#10b981",  title: "Paie & RH",                desc: "Fiches de paie et cotisations." },
] as const;

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
  { value: "50+",  label: "clients\naccompagnés", Icon: Users2      },
  { value: "100+", label: "projets\nlivrés",       Icon: Briefcase   },
  { value: "Sans", label: "engagement",            Icon: ShieldCheck },
];

function HomeContent() {
  const data                  = getSiteData();
  useLanguage();
  const { settings }          = useSiteSettings();


  return (
    <div className="overflow-hidden">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-5 pb-20 pt-[108px] sm:pb-28 sm:pt-[136px]"
        style={{ background: "linear-gradient(160deg, #1e0d42 0%, #0d1829 52%, #071525 100%)" }}
      >
        {/* Orbes de fond */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 -right-28 h-[580px] w-[580px] rounded-full blur-[130px]"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-24 -left-32 h-[480px] w-[480px] rounded-full blur-[110px]"
            style={{ background: `radial-gradient(circle, rgba(${GOLDR},0.20) 0%, transparent 70%)` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[700px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeIn}
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.20em]"
            style={{
              borderColor: `rgba(${GOLDR},0.38)`,
              background: `rgba(${GOLDR},0.10)`,
              color: GOLD,
            }}
          >
            <Sparkles size={11} />
            Agence &amp; Plateforme Digitale
          </motion.div>

          {/* Titre Caveat */}
          <motion.h1
            variants={fadeIn}
            className="text-[3.4rem] leading-[1.05] sm:text-[5rem]"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 800, color: "#ffffff" }}
          >
            Créez.{" "}
            <span style={{ color: GOLD }}>Gérez.</span>
            <br />
            Grandissez.
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            variants={fadeIn}
            className="mt-5 text-[0.97rem] font-medium leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Tout ce qu&apos;il faut pour bâtir, piloter et développer votre activité —
            <br className="hidden sm:block" />
            réuni en un seul écosystème.
          </motion.p>

          {/* Pastilles d'activités — liens cliquables */}
          <motion.div
            variants={fadeIn}
            className="mt-7 flex flex-wrap justify-center gap-2.5"
          >
            {([
              { label: "Site & E-Commerce",  color: "#60a5fa",  Icon: Globe,           href: "/services/site-vitrine"               },
              { label: "App Mobile",         color: "#a78bfa",  Icon: Code2,           href: "/services/application-mobile"         },
              { label: "Outils SaaS",        color: GOLD,       Icon: Gem,             href: "/espace-client"                       },
              { label: "Coaching IA",        color: "#4ade80",  Icon: Brain,           href: "/services/coaching-ia"                },
              { label: "Vidéo & Visuels",    color: "#f472b6",  Icon: Star,            href: "/services/montage-video"              },
              { label: "Accompagnement",     color: "#34d399",  Icon: HeartHandshake,  href: "/services/assistance-administrative"  },
            ] as const).map(({ label, color, Icon, href }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18, ease }}
              >
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.75rem] font-semibold transition-all duration-200"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}40`,
                    color,
                    boxShadow: `0 2px 12px ${color}18`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${color}30`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}70`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${color}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${color}18`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${color}18`;
                  }}
                >
                  <Icon size={13} strokeWidth={1.8} />
                  {label}
                  <ArrowRight size={10} style={{ opacity: 0.6 }} />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={fadeIn}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[1rem] font-bold text-white shadow-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.015] active:scale-[.98]"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #b08d45 100%)` }}
            >
              Découvrir nos services <ArrowRight size={15} />
            </Link>
            <Link
              href="/espace-client"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-[1rem] font-semibold text-white transition-all duration-200 hover:bg-white/8 active:scale-[.98]"
              style={{ borderColor: "rgba(255,255,255,0.20)" }}
            >
              Espace client →
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeIn}
            className="mt-10 grid grid-cols-3 gap-3 border-t pt-8"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {HERO_STATS.map(({ value, label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl px-2 py-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${GOLDR},0.16)`, color: GOLD }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[1.35rem] font-extrabold leading-none text-white">
                  <SmartStat value={value} />
                </span>
                <span
                  className="text-center text-[0.7rem] leading-snug"
                  style={{ color: "rgba(255,255,255,0.42)", whiteSpace: "pre-line" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Fondu vers la section suivante */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: "linear-gradient(to bottom, transparent 0%, #ededf3 100%)" }}
        />
      </section>

      {/* ── Espace client tools — style espace-client ──────── */}
      <section id="outils" className="bg-[#ededf3] pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-6 pt-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: `${GOLD}cc` }}>
              20 outils inclus
            </p>
            <h2 className="text-xl font-black text-gray-900 sm:text-3xl">
              Tout ce dont vous avez besoin,{" "}
              <span style={{ color: GOLD }}>enfin réuni.</span>
            </h2>
            <div className="mt-5">
              <Link
                href="/espace-client"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.92rem] font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", boxShadow: "0 4px 20px rgba(99,102,241,.30)" }}
              >
                S&apos;abonner — 11,90€/mois <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>

          {/* Grille style espace-client */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-5"
          >
            {ESPACE_TOOLS.map(({ icon: Icon, color, title }) => (
              <motion.div
                key={title}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }}
                className="flex flex-col items-center gap-3"
              >
                <Link href="/espace-client" className="block">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_22px_rgba(0,0,0,0.16)]">
                    <Icon size={30} style={{ color }} strokeWidth={1.5} />
                  </div>
                </Link>
                <p className="max-w-[88px] text-center text-[0.7rem] font-medium leading-tight text-gray-600">
                  {title}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Récap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/60 bg-white px-6 py-4 shadow-sm sm:gap-12"
          >
            {([
              { val: "20",     label: "outils inclus",  color: "#6366f1" },
              { val: "11,90€", label: "/ mois",         color: GOLD      },
              { val: "Sans",   label: "engagement",     color: "#10b981" },
              { val: "✓",      label: "accès immédiat", color: "#f59e0b" },
            ] as const).map(({ val, label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[1.25rem] font-extrabold leading-none" style={{ color }}>{val}</span>
                <span className="text-[0.75rem] font-medium text-gray-400">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services ticker ────────────────────────────────── */}
      <section className="overflow-hidden bg-white py-14 sm:py-20">

        {/* Header */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto mb-10 max-w-xl px-6 text-center"
        >
          <motion.div
            variants={fadeIn}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,.25)] bg-[rgba(99,102,241,.08)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
            style={{ color: "#6366f1" }}
          >
            <Sparkles size={11} /> Nos services
          </motion.div>
          <motion.h2
            variants={fadeIn}
            className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]"
          >
            Tout ce que DJAMA peut faire{" "}
            <span style={{ color: "#6366f1" }}>pour vous</span>.
          </motion.h2>
          <motion.p variants={fadeIn} className="mt-3 text-[0.9rem] text-gray-500">
            Création digitale, outils pros, coaching IA et accompagnement — tout en un seul endroit.
          </motion.p>
        </motion.div>

        {/* ── Grand écran / App Showcase ── */}
        <div className="relative mx-auto mb-14 max-w-5xl px-4 sm:px-6">
          {/* Halo glow derrière l'écran */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 -bottom-6 h-24 rounded-full blur-[40px] opacity-40"
            style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#6366f1)" }}
          />

          {/* Cadre écran */}
          <div
            className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,.16)]"
            style={{
              background: "linear-gradient(135deg,#eef0ff 0%,#f3f0ff 50%,#e8ecff 100%)",
              border: "1.5px solid rgba(255,255,255,0.9)",
            }}
          >
            {/* Reflet haut */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)" }}
            />

            {/* Barre navigateur */}
            <div className="relative z-10 flex items-center gap-2 border-b border-white/60 bg-white/60 px-5 py-3 backdrop-blur-md">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-3 flex-1 rounded-full bg-white/80 px-4 py-1.5 text-[0.62rem] text-gray-400 backdrop-blur-sm">
                🔒 djama.space — Tous nos services
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-3 w-3 rounded-full bg-gray-200" />
              </div>
            </div>

            {/* Grille des services */}
            <div className="relative z-10 p-5 sm:p-8">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:gap-4 lg:grid-cols-8">
                {([
                  { Icon: Globe,         color: "#60a5fa", label: "Site Vitrine",             href: "/services/site-vitrine"               },
                  { Icon: CreditCard,    color: "#4ade80", label: "E-Commerce",               href: "/services/site-ecommerce"             },
                  { Icon: Code2,         color: "#a78bfa", label: "App Mobile",               href: "/services/application-mobile"         },
                  { Icon: BarChart3,     color: "#6366f1", label: "Plateforme Web",           href: "/services/plateforme-web-sur-mesure"  },
                  { Icon: Gem,           color: "#22d3ee", label: "Solutions\nDigitales",     href: "/services/solutions-digitales"        },
                  { Icon: Brain,         color: GOLD,      label: "Automatisation\nIA",       href: "/services/automatisation-ia"          },
                  { Icon: Star,          color: "#f59e0b", label: "Montage\nVidéo",           href: "/services/montage-video"              },
                  { Icon: Sparkles,      color: "#f472b6", label: "Retouche\nPhoto",          href: "/services/retouche-photo"             },
                  { Icon: Sparkles,      color: "#ec4899", label: "Visuels\nPublicitaires",   href: "/services/visuels-publicitaires"      },
                  { Icon: Brain,         color: "#a78bfa", label: "Coaching IA",              href: "/services/coaching-ia"                },
                  { Icon: Users2,        color: "#60a5fa", label: "Soutien\nScolaire",        href: "/services/soutien-scolaire"           },
                  { Icon: HeartHandshake,color: "#34d399", label: "Assistance\nAdmin",        href: "/services/assistance-administrative"  },
                  { Icon: Briefcase,     color: GOLD,      label: "Auto-\nEntrepreneur",      href: "/services/creation-auto-entrepreneur" },
                  { Icon: Receipt,       color: "#6366f1", label: "Déclarations\nURSSAF",     href: "/services/declarations-urssaf"        },
                  { Icon: Globe,         color: "#22d3ee", label: "Marchés\nPublics",         href: "/services/marches-publics"            },
                  { Icon: Shield,        color: "#f97316", label: "Recherche\nFournisseurs",  href: "/services/recherche-fournisseurs"     },
                ] as const).map(({ Icon, color, label, href }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.75, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.045, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.08, y: -5, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.94 }}
                  >
                    <Link
                      href={href}
                      className="flex flex-col items-center gap-2 rounded-2xl p-2 transition-colors duration-200 hover:bg-white/40"
                    >
                      {/* Tuile icône */}
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,.10)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,.18)] sm:h-16 sm:w-16"
                        style={{ background: "#ffffff" }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                          style={{ background: `${color}18` }}
                        >
                          <Icon size={22} style={{ color }} strokeWidth={1.7} />
                        </div>
                      </div>
                      {/* Label */}
                      <span
                        className="text-center text-[0.58rem] font-semibold leading-tight text-gray-500 sm:text-[0.62rem]"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Barre du bas — status bar */}
              <div className="mt-6 flex items-center justify-between border-t border-white/60 pt-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                  />
                  <span className="text-[0.6rem] font-semibold text-gray-400">16 services disponibles</span>
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[0.6rem] font-bold text-[#6366f1] backdrop-blur-sm transition hover:bg-white"
                >
                  Voir tout <ArrowRight size={9} />
                </Link>
              </div>
            </div>

            {/* Reflet bas */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
              style={{ background: "linear-gradient(0deg,rgba(255,255,255,0.3) 0%,transparent 100%)" }}
            />
          </div>

          {/* "Pied" de l'écran */}
          <div className="mx-auto mt-1 h-2 w-32 rounded-b-lg bg-gray-200/80" />
          <div className="mx-auto h-1.5 w-20 rounded-b-xl bg-gray-300/60" />
        </div>

        {/* ── Sunburst "Libérez votre potentiel" ── */}
        <div className="relative flex items-center justify-center overflow-hidden py-12 sm:py-16">

          {/* Rayons animés */}
          {([
            { angle: -148, h: 72,  w: 5, delay: 0.00, heart: true  },
            { angle: -122, h: 52,  w: 4, delay: 0.05, heart: false },
            { angle: -100, h: 88,  w: 5, delay: 0.10, heart: false },
            { angle: -78,  h: 60,  w: 4, delay: 0.14, heart: false },
            { angle: -56,  h: 96,  w: 5, delay: 0.18, heart: false },
            { angle: -35,  h: 56,  w: 4, delay: 0.22, heart: false },
            { angle: -14,  h: 82,  w: 5, delay: 0.26, heart: false },
            { angle: 10,   h: 64,  w: 4, delay: 0.30, heart: false },
            { angle: 35,   h: 90,  w: 5, delay: 0.34, heart: false },
            { angle: 58,   h: 55,  w: 4, delay: 0.38, heart: true  },
            { angle: 82,   h: 72,  w: 5, delay: 0.42, heart: false },
          ] as const).map(({ angle, h, w, delay, heart }, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${w}px`,
                height: `${h}px`,
                marginLeft: `-${w / 2}px`,
                marginTop: `-${h}px`,
                borderRadius: "99px",
                background: "linear-gradient(to top, #f59e0b, #fbbf24)",
                transformOrigin: "center bottom",
                transform: `rotate(${angle}deg)`,
              }}
            >
              {heart && (
                <span
                  style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "14px",
                    lineHeight: 1,
                  }}
                >♥</span>
              )}
            </motion.div>
          ))}

          {/* Texte central */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 px-6 text-center"
          >
            <p
              className="leading-[1.15] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Libérez
            </p>
            <p
              className="leading-[1.1] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              votre{" "}
              <span
                style={{
                  color: "#0d9488",
                  textDecoration: "underline",
                  textDecorationColor: "#0d9488",
                  textUnderlineOffset: "4px",
                }}
              >
                potentiel de
              </span>
            </p>
            <p
              className="leading-[1.15] text-[2.6rem] sm:text-[3.6rem]"
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                color: "#0d9488",
              }}
            >
              croissance
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="mt-6"
            >
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-[0.88rem] font-semibold text-gray-500 transition-all hover:border-[rgba(99,102,241,.4)] hover:bg-[rgba(99,102,241,.05)] hover:text-[#6366f1]"
              >
                Voir tous nos services <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ── Processus — stepper compact ───────────────────── */}
      <section className="bg-[#f0f2f5] py-10 sm:py-14">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-4xl px-5"
        >
          {/* Titre court */}
          <motion.div variants={fadeIn} className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.09)] px-3.5 py-1.5 text-[0.63rem] font-bold uppercase tracking-[.22em]" style={{ color: "#b08d57" }}>
              <Sparkles size={9} /> Notre processus
            </div>
            <p className="text-[0.8rem] font-semibold text-gray-400">De l&apos;idée au lancement en 4 étapes</p>
          </motion.div>

          {/* Stepper card */}
          <motion.div
            variants={fadeIn}
            className="relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,.07)] border border-gray-100"
          >
            {/* Ligne de connexion */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[52px] left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-px"
              style={{ background: "linear-gradient(90deg,#c9a55a,#a78bfa,#60a5fa,#4ade80)" }}
            />

            <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
              {SCHEMA_STEPS.map(({ num, icon: Icon, color, title }, idx) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col items-center gap-3 px-4 py-7 text-center ${
                    idx < 3 ? "sm:border-r border-gray-100" : ""
                  } ${idx === 1 ? "border-t sm:border-t-0 border-gray-100" : ""} ${idx === 3 ? "border-t sm:border-t-0 border-gray-100" : ""}`}
                >
                  {/* Icône cercle */}
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm"
                    style={{ background: `${color}15`, border: `2px solid ${color}30` }}
                  >
                    <Icon size={20} style={{ color }} />
                    {/* Numéro badge */}
                    <span
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] font-black text-white shadow-sm"
                      style={{ background: color }}
                    >{num}</span>
                  </div>

                  {/* Titre */}
                  <span className="text-[0.8rem] font-bold leading-snug text-gray-800">{title}</span>
                </motion.div>
              ))}
            </div>

            {/* Barre de progression bottom */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#c9a55a 0%,#a78bfa 33%,#60a5fa 66%,#4ade80 100%)" }} />
          </motion.div>
        </motion.div>
      </section>

      <PartnerLogosSection />
      <TestimonialsSection dynamic />

      {/* ── Formation IA ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f0f2f5] py-12 sm:py-16">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-4xl px-5"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div variants={fadeIn}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,.35)] bg-[rgba(167,139,250,.09)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.22em]"
              style={{ color: "#7c5cbf" }}
            >
              <Brain size={10} /> Formation Intelligence Artificielle
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-[1.9rem] font-extrabold leading-tight text-gray-900 sm:text-[2.4rem]">
              Maîtrisez l&apos;IA,{" "}
              <span style={{ color: "#a78bfa" }}>transformez votre activité</span>.
            </motion.h2>
            <motion.p variants={fadeIn} className="mt-3 text-[0.9rem] text-gray-500">
              6 modules · 20 chapitres · 4h d&apos;accompagnement expert · Accès 3 mois
            </motion.p>
          </div>

          {/* Card principale */}
          <motion.div variants={cardReveal}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_6px_30px_rgba(0,0,0,.10)]"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#a78bfa] via-[#7c5cbf] to-[#6366f1]" />

            <div className="grid gap-0 sm:grid-cols-2">

              {/* ── Gauche : ce que vous allez savoir faire ── */}
              <div className="p-6 sm:border-r border-gray-100">
                <p className="mb-4 text-[0.65rem] font-black uppercase tracking-[.18em] text-[#a78bfa]">Ce que vous allez maîtriser</p>

                <ul className="space-y-3">
                  {([
                    { icon: Sparkles,      color: "#a78bfa", text: "Générer emails, devis et contrats en 30 secondes" },
                    { icon: Brain,         color: "#60a5fa", text: "Gagner 5 à 15h de travail par semaine avec l'IA" },
                    { icon: Users2,        color: "#f9a826", text: "Prospecter et trouver des clients grâce à l'IA" },
                    { icon: BarChart3,     color: "#4ade80", text: "Créer du contenu marketing 10× plus vite" },
                    { icon: Briefcase,     color: "#f472b6", text: "Analyser vos données business en quelques secondes" },
                    { icon: HeartHandshake,color: "#34d399", text: "Déléguer vos tâches répétitives à des agents IA" },
                  ] as const).map(({ icon: Icon, color, text }) => (
                    <li key={text} className="flex items-start gap-2.5 text-[0.78rem] text-gray-600">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}18` }}>
                        <Icon size={11} style={{ color }} />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>

                {/* Inclus */}
                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5">
                  <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">Inclus dans la formation</p>
                  <ul className="space-y-1.5">
                    {[
                      "Assistant IA pédagogique disponible 24h/7j",
                      "Quiz, résumés IA et fiches PDF pour chaque cours",
                      "Bibliothèque de prompts prêts à l'emploi",
                      "Comparateur interactif : ChatGPT, Claude, Gemini…",
                      "Plan d'action IA personnalisé par module",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[0.73rem] text-gray-500">
                        <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(74,222,128,.25)] bg-[rgba(74,222,128,.07)] px-3 py-2">
                  <Shield size={11} style={{ color: "#4ade80" }} />
                  <span className="text-[0.68rem] font-semibold text-emerald-600">Satisfait ou remboursé — 7 jours, sans justification</span>
                </div>
              </div>

              {/* ── Droite : tarification ── */}
              <div className="flex flex-col gap-3 p-6">

                {/* Option ABONNÉ — mis en avant */}
                <div
                  className="relative overflow-hidden rounded-2xl p-5"
                  style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.10) 0%,rgba(99,102,241,0.08) 100%)", border: "1.5px solid rgba(167,139,250,.4)" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#a78bfa] px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-white">
                      <Sparkles size={9} /> Abonnés DJAMA Pro
                    </div>
                    <span className="text-[0.65rem] font-bold text-[#4ade80]">✓ Accès immédiat</span>
                  </div>

                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-[2.4rem] font-black leading-none" style={{ color: "#a78bfa" }}>GRATUIT</span>
                    <span className="mb-1.5 text-[0.7rem] font-semibold text-gray-400 line-through">190€</span>
                  </div>
                  <p className="text-[0.75rem] text-gray-500">
                    Inclus avec l&apos;abonnement{" "}
                    <span className="font-bold text-gray-700">DJAMA Pro</span>{" "}
                    à seulement{" "}
                    <span className="font-bold" style={{ color: GOLD }}>11,90€/mois</span>
                  </p>
                  <p className="mt-1 text-[0.68rem] text-gray-400">
                    + 20 outils pros inclus · Sans engagement · Résiliable à tout moment
                  </p>

                  <Link
                    href="/espace-client"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-[0.875rem] font-bold text-white shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[.98]"
                    style={{ background: "linear-gradient(135deg,#a78bfa,#7c5cbf)" }}
                  >
                    S&apos;abonner — Formation offerte <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[0.6rem] font-bold text-gray-300 uppercase tracking-wide">ou</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Option SEUL */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Achat individuel</p>
                  <div className="mt-1.5 flex items-end gap-2">
                    <span className="text-[1.6rem] font-extrabold leading-none text-gray-800">190€</span>
                    <div className="mb-1 flex flex-col">
                      <span className="text-[0.62rem] font-bold text-gray-400 line-through">350€</span>
                      <span className="text-[0.6rem] text-gray-400">paiement unique · accès 3 mois</span>
                    </div>
                  </div>
                  <Link
                    href="/services/coaching-ia"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[0.8rem] font-bold text-gray-600 transition hover:border-[rgba(167,139,250,.4)] hover:text-[#a78bfa]"
                  >
                    Voir la formation <ArrowRight size={12} />
                  </Link>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Final CTA — bande compacte ─────────────────────── */}
      <section className="bg-white px-5 pb-16 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1e1035 100%)",
            boxShadow: "0 20px 60px rgba(99,102,241,0.22), 0 4px 20px rgba(0,0,0,0.18)",
          }}
        >
          {/* Barre dorée top */}
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,#c9a55a,#e8cc94,#c9a55a)` }} />

          <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">

            {/* Titre court */}
            <h2 className="text-[1.7rem] font-extrabold leading-tight text-white sm:text-[2.1rem]">
              Lancez votre projet{" "}
              <span style={{ color: GOLD }}>dès aujourd&apos;hui</span>.
            </h2>

            {/* Bullets horizontaux */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {[
                { icon: CheckCircle2, text: "Sans engagement" },
                { icon: CheckCircle2, text: "Réponse sous 24h" },
                { icon: CheckCircle2, text: "Appel offert" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-[0.75rem] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <Icon size={11} style={{ color: "#4ade80" }} />
                  {text}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-[0.92rem] font-bold text-[#0f172a] transition-all duration-200 hover:scale-[1.03] active:scale-[.97]"
                style={{ background: `linear-gradient(135deg,#c9a55a,#e8cc94)` }}
              >
                Démarrer un projet <ArrowRight size={14} />
              </Link>
              <Link
                href="/espace-client"
                className="flex items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 text-[0.92rem] font-bold text-white transition-all duration-200 hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.18)" }}
              >
                Accès espace client
              </Link>
            </div>

          </div>
        </motion.div>
      </section>

    </div>
  );
}
