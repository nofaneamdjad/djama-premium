"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, Timer, CreditCard, FileText, Search,
  Wallet, StickyNote, Calendar, CalendarRange, Brain, Zap, Star, Mic,
  Truck, Package, Bell, BarChart2, Building2, Banknote,
  ChevronRight, LogOut, Settings, LayoutGrid, ListTodo,
  Sparkles, TrendingUp, TrendingDown, Send, Share2,
  Lock, Crown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { getToolTier } from "@/lib/plans";
import OnboardingModal from "@/components/OnboardingModal";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

/* ── Module groups (mirror sidebar) ── */
const MODULE_GROUPS = [
  {
    label: "Finance",
    icon: Wallet,
    color: "#059669",
    modules: [
      { href: "/client/factures",   label: "Factures & Devis", sub: "Créer, envoyer, suivre vos documents",  icon: ReceiptText,   color: "#2563eb", bg: "#dbeafe" },
      { href: "/client/depenses",   label: "Dépenses",          sub: "Notes de frais et charges",             icon: CreditCard,    color: "#ea580c", bg: "#ffedd5" },
      { href: "/client/tresorerie", label: "Trésorerie",        sub: "Cash-flow et flux consolidés",          icon: Wallet,        color: "#059669", bg: "#d1fae5" },
    ],
  },
  {
    label: "Commercial",
    icon: Users,
    color: "#7c3aed",
    modules: [
      { href: "/client/crm",          label: "CRM Clients",    sub: "Contacts, pipeline, relances",    icon: Users,    color: "#7c3aed", bg: "#ede9fe" },
      { href: "/client/contrats",     label: "Contrats",       sub: "Gestion des contrats signés",     icon: FileText, color: "#b45309", bg: "#fef3c7" },
      { href: "/client/fournisseurs", label: "Fournisseurs",   sub: "Catalogue et commandes",          icon: Truck,    color: "#166534", bg: "#dcfce7" },
      { href: "/client/stocks",       label: "Stocks",         sub: "Inventaire en temps réel",        icon: Package,  color: "#0d9488", bg: "#ccfbf1" },
    ],
  },
  {
    label: "Opérations",
    icon: Calendar,
    color: "#4f46e5",
    modules: [
      { href: "/client/productivite", label: "Tâches",          sub: "To-do, projets, suivi",             icon: ListTodo,      color: "#be185d", bg: "#fce7f3" },
      { href: "/client/planning",     label: "Planning",         sub: "Agenda et réservations",            icon: Calendar,      color: "#4f46e5", bg: "#e0e7ff" },
      { href: "/client/equipe",       label: "Équipe",           sub: "Membres et planification RH",       icon: CalendarRange, color: "#0891b2", bg: "#cffafe" },
      { href: "/client/chrono",       label: "Chrono",           sub: "Time tracking et rapports",         icon: Timer,         color: "#7c3aed", bg: "#f3e8ff" },
    ],
  },
  {
    label: "Notes",
    icon: StickyNote,
    color: "#92400e",
    modules: [
      { href: "/client/notes",     label: "Notes IA",   sub: "Prise de notes intelligente",   icon: StickyNote, color: "#92400e", bg: "#fef9c3" },
      { href: "/client/bloc-note", label: "Bloc-note",  sub: "Dictée vocale et mémos",        icon: Mic,        color: "#9d174d", bg: "#fce7f3" },
    ],
  },
  {
    label: "Intelligence",
    icon: Brain,
    color: "#6d28d9",
    modules: [
      { href: "/client/sourcing",          label: "Sourcing IA",        sub: "Trouver clients et partenaires", icon: Search, color: "#6d28d9", bg: "#ede9fe" },
      { href: "/client/assistant",         label: "Assistant IA",       sub: "Relances auto et questions",     icon: Zap,    color: "#0369a1", bg: "#e0f2fe" },
      { href: "/client/reputation",        label: "Réputation",         sub: "Avis, e-réputation, veille",     icon: Star,   color: "#b91c1c", bg: "#fee2e2" },
      { href: "/client/reseaux-sociaux",   label: "Réseaux Sociaux IA", sub: "Planifier et créer du contenu",  icon: Share2, color: "#e1306c", bg: "#fce7f3" },
      { href: "/coaching-ia/espace",       label: "Coaching IA",        sub: "Accompagnement personnalisé",    icon: Brain,  color: "#9d174d", bg: "#fdf2f8" },
    ],
  },
  {
    label: "Gestion",
    icon: Building2,
    color: "#3b82f6",
    modules: [
      { href: "/client/portail", label: "Portail Client", sub: "Espace dédié à vos clients",          icon: Building2, color: "#3b82f6", bg: "#dbeafe" },
      { href: "/client/paie",    label: "Paie & RH",      sub: "Salaires, contrats, effectif",        icon: Banknote,  color: "#10b981", bg: "#d1fae5" },
    ],
  },
] as const;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getDay() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

/* ── Quick Action Button (Revolut style) ── */
function QuickAction({ href, icon: Icon, label, color, bg, delay = 0, locked = false }: {
  href: string; icon: React.ElementType; label: string; color: string; bg: string;
  delay?: number; locked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.65 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 22, delay }}
    >
      <Link href={href} className="flex flex-col items-center gap-1.5 group">
        <motion.div
          whileTap={{ scale: 0.80 }}
          whileHover={{ scale: 1.13, y: -5, boxShadow: `0 12px 30px ${locked ? "rgba(201,165,90,0.4)" : color + "55"}` }}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: bg, opacity: locked ? 0.7 : 1 }}
        >
          <Icon size={20} style={{ color }} strokeWidth={1.8} />
          {locked && (
            <div
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full shadow-sm"
              style={{ background: GOLD }}
            >
              <Lock size={6} color="white" strokeWidth={3} />
            </div>
          )}
        </motion.div>
        <span className="text-[10px] font-medium text-white/50 group-hover:text-white/85 transition-colors">{label}</span>
      </Link>
    </motion.div>
  );
}

/* ── Stat pill ── */
function StatPill({ label, value, color, loading, delay = 0 }: {
  label: string; value: string; color: string; loading: boolean; delay?: number;
}) {
  const num   = parseInt(value, 10);
  const isNum = !isNaN(num);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (loading || !isNum) { setCount(0); return; }
    if (num === 0) { setCount(0); return; }
    const steps  = 32;
    const stepMs = 700 / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCount(Math.min(Math.round((num / steps) * i), num));
      if (i >= steps) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
  }, [value, loading, num, isNum]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24, delay }}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-3"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
    >
      {loading
        ? <div className="h-4 w-10 animate-pulse rounded-md" style={{ background: "rgba(255,255,255,0.13)" }} />
        : <motion.p
            key={value}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="text-[15px] font-bold leading-none"
            style={{ color }}
          >
            {isNum ? count : value}
          </motion.p>
      }
      <p className="text-[9.5px] text-white/35">{label}</p>
    </motion.div>
  );
}

/* ── Custom app icons (Odoo / iOS style) ── */
const APP_ICONS: Record<string, React.ReactElement> = {
  "/client/factures": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig0" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#1d4ed8"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig0)"/>
      <rect x="12" y="9" width="18" height="24" rx="3" fill="white" opacity="0.2"/>
      <rect x="12" y="9" width="18" height="24" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="16" y="16" width="10" height="1.8" rx="0.9" fill="white"/>
      <rect x="16" y="20" width="7" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <rect x="16" y="24" width="8.5" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <circle cx="33" cy="33" r="8" fill="#22c55e"/>
      <path d="M29.5 33.5L32 36L36.5 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/depenses": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#dc2626"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig1)"/>
      <rect x="8" y="16" width="32" height="20" rx="4" fill="white" opacity="0.2"/>
      <rect x="8" y="16" width="32" height="20" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="8" y="21" width="32" height="4" fill="white" opacity="0.3"/>
      <rect x="12" y="28" width="8" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <path d="M34 10 L34 20 M30 14 L34 10 L38 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/tresorerie": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399"/><stop offset="1" stopColor="#059669"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig2)"/>
      <rect x="9" y="32" width="6" height="10" rx="2" fill="white" opacity="0.9" transform="translate(0,-6)"/>
      <rect x="19" y="26" width="6" height="10" rx="2" fill="white" opacity="0.9" transform="translate(0,-4)"/>
      <rect x="29" y="20" width="6" height="10" rx="2" fill="white" opacity="0.9" transform="translate(0,-2)"/>
      <path d="M12 28 L22 22 L32 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="32" cy="17" r="2.5" fill="white"/>
    </svg>
  ),
  "/client/crm": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig3)"/>
      <circle cx="24" cy="16" r="7" fill="white" opacity="0.25"/>
      <circle cx="24" cy="16" r="5" fill="white" opacity="0.7"/>
      <path d="M10 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M10 36c0-7.732 6.268-10 14-10s14 2.268 14 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
    </svg>
  ),
  "/client/contrats": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#b45309"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig4)"/>
      <rect x="11" y="8" width="22" height="28" rx="3" fill="white" opacity="0.2"/>
      <rect x="11" y="8" width="22" height="28" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="15" y="15" width="14" height="1.8" rx="0.9" fill="white"/>
      <rect x="15" y="20" width="10" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="15" y="25" width="12" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <path d="M15 31 Q18 28 21 31 Q24 34 27 31" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
    </svg>
  ),
  "/client/fournisseurs": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig5" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4ade80"/><stop offset="1" stopColor="#166534"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig5)"/>
      <rect x="6" y="19" width="22" height="14" rx="3" fill="white" opacity="0.25"/>
      <rect x="6" y="19" width="22" height="14" rx="3" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <path d="M28 24 L38 24 L42 31 L42 33 L28 33 Z" fill="white" opacity="0.25"/>
      <path d="M28 24 L38 24 L42 31 L42 33 L28 33 Z" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="14" cy="35" r="3.5" fill="white"/>
      <circle cx="35" cy="35" r="3.5" fill="white"/>
      <rect x="6" y="23" width="7" height="6" rx="1" fill="white" opacity="0.6"/>
    </svg>
  ),
  "/client/stocks": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig6" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0d9488"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig6)"/>
      <rect x="14" y="27" width="20" height="12" rx="2.5" fill="white" opacity="0.25"/>
      <rect x="14" y="27" width="20" height="12" rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <rect x="16" y="17" width="16" height="11" rx="2.5" fill="white" opacity="0.35"/>
      <rect x="16" y="17" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <rect x="18" y="9" width="12" height="9" rx="2.5" fill="white" opacity="0.55"/>
      <rect x="18" y="9" width="12" height="9" rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.8"/>
    </svg>
  ),
  "/client/productivite": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig7" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f472b6"/><stop offset="1" stopColor="#be185d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig7)"/>
      <rect x="10" y="13" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="13" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="15" cy="16" r="2.5" fill="white" opacity="0.8"/>
      <rect x="10" y="23" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="23" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <rect x="10" y="33" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="33" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <path d="M13 26.5 L15 28.5 L19 24.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 36.5 L15 38.5 L19 34.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/planning": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig8" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#4f46e5"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig8)"/>
      <rect x="9" y="14" width="30" height="26" rx="4" fill="white" opacity="0.2"/>
      <rect x="9" y="14" width="30" height="26" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="9" y="14" width="30" height="9" rx="4" fill="white" opacity="0.3"/>
      <rect x="9" y="18" width="30" height="5" fill="white" opacity="0.15"/>
      <rect x="16" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <rect x="29" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <circle cx="20" cy="31" r="3" fill="white" opacity="0.9"/>
      <rect x="26" y="29" width="8" height="2" rx="1" fill="white" opacity="0.6"/>
      <rect x="26" y="33" width="5" height="2" rx="1" fill="white" opacity="0.4"/>
    </svg>
  ),
  "/client/equipe": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig9" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0891b2"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig9)"/>
      <circle cx="17" cy="18" r="5.5" fill="white" opacity="0.6"/>
      <circle cx="31" cy="18" r="5.5" fill="white" opacity="0.6"/>
      <path d="M5 36c0-6.627 5.373-10 12-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M43 36c0-6.627-5.373-10-12-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <circle cx="24" cy="20" r="6" fill="white" opacity="0.9"/>
      <path d="M12 38c0-6.627 5.373-10 12-10s12 3.373 12 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),
  "/client/chrono": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig10" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig10)"/>
      <circle cx="24" cy="27" r="13" fill="white" opacity="0.18"/>
      <circle cx="24" cy="27" r="13" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="24" cy="27" r="9" fill="white" opacity="0.12"/>
      <line x1="24" y1="27" x2="24" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="27" x2="29" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="27" r="2" fill="white"/>
      <rect x="21" y="9" width="6" height="3" rx="1.5" fill="white" opacity="0.8"/>
      <path d="M34 13 L37 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/notes": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig11" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fde047"/><stop offset="1" stopColor="#d97706"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig11)"/>
      <rect x="11" y="10" width="22" height="28" rx="3" fill="white" opacity="0.25"/>
      <rect x="11" y="10" width="22" height="28" rx="3" stroke="white" strokeWidth="1.5" opacity="0.55"/>
      <rect x="11" y="10" width="4" height="28" rx="3" fill="white" opacity="0.3"/>
      <rect x="17" y="17" width="12" height="1.8" rx="0.9" fill="white"/>
      <rect x="17" y="22" width="9" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="17" y="27" width="10.5" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <path d="M35 10 L38 7 L41 10 L38 13 Z" fill="white" opacity="0.9"/>
      <path d="M32 13 L35 10 L41 10 L38 13 Z" fill="white" opacity="0.5"/>
    </svg>
  ),
  "/client/bloc-note": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig12" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fb7185"/><stop offset="1" stopColor="#9d174d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig12)"/>
      <rect x="19" y="9" width="10" height="18" rx="5" fill="white" opacity="0.25"/>
      <rect x="19" y="9" width="10" height="18" rx="5" stroke="white" strokeWidth="1.5" opacity="0.65"/>
      <path d="M14 24c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <line x1="24" y1="34" x2="24" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <line x1="18" y1="40" x2="30" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/sourcing": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig13" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig13)"/>
      <circle cx="21" cy="21" r="10" fill="white" opacity="0.18"/>
      <circle cx="21" cy="21" r="10" stroke="white" strokeWidth="2" opacity="0.6"/>
      <line x1="28" y1="28" x2="38" y2="38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M18 17 L21 14 L24 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <path d="M21 14 L21 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M17 22 L25 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/assistant": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig14" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig14)"/>
      <path d="M26 8 L20 24 H27 L22 40 L36 20 H28 L34 8 Z" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/reputation": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig15" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f87171"/><stop offset="1" stopColor="#b91c1c"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig15)"/>
      <path d="M24 9 L27.5 19.5 H38.5 L30 26 L33 37 L24 30.5 L15 37 L18 26 L9.5 19.5 H20.5 Z" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/reseaux-sociaux": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig17" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1306c"/><stop offset="1" stopColor="#833ab4"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig17)"/>
      <rect x="14" y="8" width="20" height="32" rx="4" fill="white" opacity="0.92"/>
      <rect x="17" y="14" width="7" height="7" rx="2" fill="#e1306c" opacity="0.55"/>
      <rect x="26" y="14" width="5" height="7" rx="2" fill="#833ab4" opacity="0.55"/>
      <rect x="17" y="23" width="5" height="7" rx="2" fill="#833ab4" opacity="0.55"/>
      <rect x="24" y="23" width="7" height="7" rx="2" fill="#e1306c" opacity="0.55"/>
      <circle cx="37" cy="35" r="7" fill="#e1306c"/>
      <path d="M37 40 C34 37 31 34.5 31 32 C31 30.3 32.3 29 34 29 C35.2 29 36.3 29.8 37 31 C37.7 29.8 38.8 29 40 29 C41.7 29 43 30.3 43 32 C43 34.5 40 37 37 40Z" fill="white" opacity="0.95"/>
    </svg>
  ),
  "/coaching-ia/espace": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig16" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9a8d4"/><stop offset="1" stopColor="#9d174d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig16)"/>
      <circle cx="24" cy="18" r="9" fill="white" opacity="0.2"/>
      <circle cx="24" cy="18" r="9" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <path d="M20 15 Q20 11 24 11 Q28 11 28 15 Q28 18 25 19 L25 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85"/>
      <circle cx="25" cy="24.5" r="1.2" fill="white" opacity="0.85"/>
      <path d="M12 38 Q12 30 24 30 Q36 30 36 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/portail": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig18" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig18)"/>
      {/* Building */}
      <rect x="11" y="16" width="26" height="22" rx="3" fill="white" opacity="0.18"/>
      <rect x="11" y="16" width="26" height="22" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      {/* Roof triangle */}
      <path d="M8 18 L24 8 L40 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
      {/* Door */}
      <rect x="20" y="27" width="8" height="11" rx="2" fill="white" opacity="0.85"/>
      {/* Windows */}
      <rect x="14" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
      <rect x="28" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
    </svg>
  ),
  "/client/paie": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig19" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399"/><stop offset="1" stopColor="#065f46"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig19)"/>
      {/* Card */}
      <rect x="7" y="14" width="34" height="22" rx="4" fill="white" opacity="0.18"/>
      <rect x="7" y="14" width="34" height="22" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="7" y="19" width="34" height="6" fill="white" opacity="0.12"/>
      {/* Euro symbol */}
      <text x="18" y="32" fontSize="14" fontWeight="bold" fill="white" opacity="0.9" fontFamily="Arial">€</text>
      {/* People icons */}
      <circle cx="34" cy="30" r="3" fill="white" opacity="0.8"/>
      <path d="M28 38c0-3.314 2.686-4 6-4s6 .686 6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      {/* Salary bars */}
      <rect x="9" y="28" width="4" height="5" rx="1" fill="white" opacity="0.7"/>
      <rect x="14" y="25" width="4" height="8" rx="1" fill="white" opacity="0.7"/>
    </svg>
  ),
};

/* ── App icon renderer ── */
function AppModuleIcon({ href, locked = false }: { href: string; locked?: boolean }) {
  const icon = APP_ICONS[href];
  if (!icon) return null;
  return (
    <div
      className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-opacity duration-200"
      style={{ opacity: locked ? 0.5 : 1 }}
    >
      {icon}
    </div>
  );
}

/* ── Module Row (Revolut/Odoo style) — tier-aware ── */
type AnyModule = { href: string; label: string; icon: React.ElementType; color: string; bg: string; sub?: string };

function ModuleRow({ mod, index, last, isPremium }: {
  mod: AnyModule; index: number; last: boolean; isPremium: boolean;
}) {
  const tier = getToolTier(mod.href);
  const isLocked = tier === "premium" && !isPremium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, delay: 0.04 + index * 0.025, ease }}
    >
      <Link href={mod.href} className="group block">
        <motion.div
          whileTap={{ scale: 0.985 }}
          className={`flex items-center gap-3.5 px-4 py-3 transition-colors
            ${isLocked
              ? "hover:bg-amber-50/70 active:bg-amber-50"
              : "hover:bg-gray-50 active:bg-gray-100"}
            ${!last ? "border-b border-gray-100" : ""}`}
        >
          {/* Icon with lock badge overlay */}
          <div className="relative shrink-0">
            <AppModuleIcon href={mod.href} locked={isLocked} />
            {isLocked && (
              <div
                className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-md"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", border: "1.5px solid #fff" }}
              >
                <Lock size={8} color="white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Label + sub */}
          <div className="flex-1 min-w-0">
            <p className={`text-[13.5px] font-semibold leading-tight ${isLocked ? "text-gray-500" : "text-gray-800"}`}>
              {mod.label}
            </p>
            {mod.sub && (
              <p className={`text-[11px] mt-0.5 truncate ${isLocked ? "text-gray-350" : "text-gray-400"}`}>
                {isLocked ? "Accès PRO requis" : mod.sub}
              </p>
            )}
          </div>

          {/* Right badge */}
          {isLocked ? (
            <div
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
              style={{
                background: "rgba(201,165,90,0.10)",
                border: "1px solid rgba(201,165,90,0.30)",
                color: GOLD,
              }}
            >
              <Crown size={7} />
              PRO
            </div>
          ) : tier === "free" ? (
            <div
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
              style={{
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.22)",
                color: "#16a34a",
              }}
            >
              Gratuit
            </div>
          ) : (
            <ChevronRight size={15} className="shrink-0 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-400" />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Notif badge ── */
function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
export default function CockpitPage() {
  const { isPremium, isFree } = useSubscription();

  const [firstName,  setFirstName]  = useState("");
  const [initial,    setInitial]    = useState("?");
  const [kpiLoading, setKpiLoading] = useState(true);
  const [caMonth,    setCaMonth]    = useState(0);
  const [nbContacts, setNbContacts] = useState(0);
  const [nbFactures, setNbFactures] = useState(0);
  const [caEvo,      setCaEvo]      = useState<number | null>(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = (
        (user.user_metadata?.full_name as string | undefined)
        || (user.user_metadata?.name as string | undefined)
        || ""
      ).trim();
      const emailFallback = user.email?.split("@")[0] ?? "";
      const name = fullName || (emailFallback.charAt(0).toUpperCase() + emailFallback.slice(1));
      const fn = fullName ? fullName.split(" ")[0] : name;
      setFirstName(fn);
      setInitial(fn.charAt(0).toUpperCase());

      const now    = new Date();
      const y      = now.getFullYear();
      const m      = String(now.getMonth() + 1).padStart(2, "0");
      const start  = `${y}-${m}-01`;
      const end    = `${y}-${m}-31`;
      const prevM  = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY  = now.getMonth() === 0 ? y - 1 : y;
      const pStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const pEnd   = `${prevY}-${String(prevM).padStart(2, "0")}-31`;

      const [facRes, prevRes, crmRes, pendRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pStart).lte("date_emission", pEnd),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
      ]);

      const ca     = (facRes.data  ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      setCaMonth(ca);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const totalModules = MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0);

  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#f8f9fa" }}>

      {/* Onboarding modal — shown once after first login */}
      <OnboardingModal name={firstName} />

      {/* ══════════════════════════════════════════════
          HEADER — Premium dashboard
      ══════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(145deg,#0a0f1e 0%,#0f1729 55%,#0c1220 100%)" }}
      >
        {/* Gold shimmer top */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease }}
          className="absolute inset-x-0 top-0 h-[1px] origin-left"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,165,90,0.7) 40%, rgba(201,165,90,0.3) 70%, transparent 100%)" }}
        />
        {/* Orb ambiance */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.07, 0.14, 0.07] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-16 left-1/2 h-[280px] w-[500px] -translate-x-1/2 rounded-full blur-[90px]"
          style={{ background: "rgba(201,165,90,0.18)" }}
        />
        <motion.div
          animate={{ y: [0, 16, 0], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[300px] rounded-full blur-[80px]"
          style={{ background: "rgba(96,165,250,0.08)" }}
        />

        <div className="relative mx-auto max-w-4xl px-5 pt-4 pb-5">

          {/* ── Top bar ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className="flex items-center justify-between mb-5"
          >
            {/* Greeting */}
            <div>
              <p className="text-[0.62rem] font-medium capitalize tracking-widest text-white/30">{getDay()}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-white/70">
                {getGreeting()}{firstName && <span className="text-white">, {firstName}</span>}
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href="/client/dashboard" className="relative">
                <motion.div whileTap={{ scale: 0.88 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Bell size={13} className="text-white/50" />
                  {nbFactures > 0 && <NotifBadge count={nbFactures} />}
                </motion.div>
              </Link>
              <div className="relative" ref={menuRef}>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-black shadow-[0_0_16px_rgba(201,165,90,0.4)]"
                  style={{ background: "linear-gradient(135deg,#d4aa5f,#b08d45)" }}
                >{initial}</motion.button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity:0, scale:0.92, y:-6 }}
                      animate={{ opacity:1, scale:1, y:0 }}
                      exit={{ opacity:0, scale:0.92, y:-6 }}
                      transition={{ duration:0.16, ease }}
                      className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                      style={{ border:"1px solid rgba(0,0,0,0.07)" }}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-[12px] font-bold text-gray-900">{firstName}</p>
                        <p className="text-[10.5px] text-gray-400">{isPremium ? "DJAMA PRO ✦" : "Plan Gratuit"}</p>
                      </div>
                      {[
                        { icon:LayoutGrid, label:"Dashboard",  href:"/client/dashboard"  },
                        { icon:Settings,   label:"Abonnement", href:"/client/abonnements" },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50">
                            <Icon size={13} className="text-gray-400" />
                            <span className="flex-1 text-[12.5px] font-medium text-gray-700">{item.label}</span>
                            <ChevronRight size={11} className="text-gray-300" />
                          </Link>
                        );
                      })}
                      <button
                        onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-red-50 border-t border-gray-100"
                      >
                        <LogOut size={13} className="text-red-400" />
                        <span className="text-[12.5px] font-medium text-red-400">Se déconnecter</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── CA Card glassmorphism ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.08, ease }}
            className="mb-4 rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* CA + évolution */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">
                  Chiffre d&apos;affaires · {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
                {kpiLoading ? (
                  <div className="h-9 w-32 animate-pulse rounded-xl" style={{ background:"rgba(255,255,255,0.08)" }}/>
                ) : (
                  <motion.p
                    initial={{ opacity:0, y:6 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.3, delay:0.18, ease }}
                    className="text-[2.4rem] font-black leading-none tracking-tight text-white"
                  >
                    {fmtEurInt(caMonth)}
                  </motion.p>
                )}
              </div>

              {!kpiLoading && caEvo !== null ? (
                <motion.div
                  initial={{ opacity:0, scale:0.85 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ duration:0.28, delay:0.25, ease }}
                  className="flex flex-col items-end gap-1"
                >
                  <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
                    style={{
                      background: caEvo >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                      border: `1px solid ${caEvo >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}>
                    {caEvo >= 0
                      ? <TrendingUp size={12} color="#4ade80"/>
                      : <TrendingDown size={12} color="#f87171"/>
                    }
                    <span className="text-[12px] font-black" style={{ color: caEvo >= 0 ? "#4ade80" : "#f87171" }}>
                      {caEvo >= 0 ? "+" : ""}{caEvo}%
                    </span>
                  </div>
                  <span className="text-[9px] text-white/20">vs mois préc.</span>
                </motion.div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.2)" }}>
                  <BarChart2 size={11} style={{ color: GOLD }} />
                </div>
              )}
            </div>

            {/* Mini stats row */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Contacts CRM",    val: kpiLoading ? "…" : String(nbContacts), color: "#60a5fa" },
                { label: "Factures en att.", val: kpiLoading ? "…" : String(nbFactures), color: nbFactures > 0 ? "#f87171" : "#4ade80" },
                { label: "Évolution",        val: kpiLoading ? "…" : caEvo !== null ? `${caEvo >= 0 ? "+" : ""}${caEvo}%` : "—", color: caEvo === null ? "#a78bfa" : caEvo >= 0 ? "#4ade80" : "#f87171" },
              ].map(s => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center rounded-xl py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[14px] font-black" style={{ color: s.color }}>{s.val}</span>
                  <span className="mt-0.5 text-[9px] text-white/25 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Quick actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18, ease }}
            className="grid grid-cols-4 gap-2"
          >
            {[
              { href:"/client/factures", icon:ReceiptText, label:"Facture",  color:"#c9a55a", bg:"rgba(201,165,90,0.14)",  locked:false },
              { href:"/client/factures", icon:Send,        label:"Devis",    color:"#60a5fa", bg:"rgba(59,130,246,0.12)",  locked:false },
              { href:"/client/depenses", icon:CreditCard,  label:"Dépense",  color:"#f97316", bg:"rgba(249,115,22,0.12)",  locked:isFree },
              { href:"/client/crm",      icon:Users,        label:"Clients",  color:"#a78bfa", bg:"rgba(167,139,250,0.12)", locked:isFree },
            ].map((a, i) => {
              const AIcon = a.icon;
              return (
                <motion.div key={a.label}
                  initial={{ opacity:0, y:10, scale:0.9 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ type:"spring", stiffness:380, damping:22, delay: 0.22 + i * 0.06 }}
                >
                  <Link href={a.href}
                    className="relative flex flex-col items-center gap-1.5 rounded-2xl py-3 transition active:scale-95"
                    style={{ background: a.bg, border: `1px solid ${a.color}22` }}
                  >
                    <AIcon size={18} style={{ color: a.color }} strokeWidth={1.8} />
                    <span className="text-[10px] font-semibold" style={{ color: a.color }}>{a.label}</span>
                    {a.locked && (
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full shadow-sm"
                        style={{ background: GOLD }}>
                        <Lock size={6} color="black" strokeWidth={3} />
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT — Module groups
      ══════════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-5 sm:px-6">

        {/* Free-tier upgrade nudge banner */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3"
            style={{
              background: "linear-gradient(135deg, rgba(201,165,90,0.08), rgba(176,141,69,0.05))",
              border: "1px solid rgba(201,165,90,0.22)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(201,165,90,0.15)" }}
              >
                <Crown size={13} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Débloquez tous les modules</p>
                <p className="text-[10.5px] text-gray-400">17 outils PRO · 11,90€/mois · Sans engagement</p>
              </div>
            </div>
            <Link
              href="/client/abonnements"
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}
            >
              Voir PRO
            </Link>
          </motion.div>
        )}

        {/* Module groups */}
        <div className="space-y-3">
          {MODULE_GROUPS.map((group, gi) => {
            const GroupIcon = group.icon;
            // Check if ALL modules in this group are premium (for group-level PRO badge)
            const allPremium = group.modules.every(m => getToolTier(m.href) === "premium");
            const groupIsLocked = allPremium && isFree;

            return (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + gi * 0.05, ease }}
                className="overflow-hidden rounded-2xl bg-white"
                style={{
                  boxShadow: groupIsLocked
                    ? "0 2px 12px rgba(201,165,90,0.08), 0 8px 24px rgba(0,0,0,0.04)"
                    : "0 2px 12px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)",
                  border: groupIsLocked
                    ? "1px solid rgba(201,165,90,0.18)"
                    : "1px solid rgba(0,0,0,0.05)",
                }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg"
                      style={{ background: `${group.color}18` }}
                    >
                      <GroupIcon size={13} style={{ color: group.color }} strokeWidth={2}/>
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 tracking-wide">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {groupIsLocked && (
                      <div
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          background: "rgba(201,165,90,0.10)",
                          border: "1px solid rgba(201,165,90,0.25)",
                          color: GOLD,
                        }}
                      >
                        <Crown size={7} /> PRO
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-gray-300 tabular-nums">{group.modules.length}</span>
                  </div>
                </div>

                {/* Module rows */}
                {group.modules.map((mod, mi) => (
                  <ModuleRow
                    key={mod.href}
                    mod={mod as AnyModule}
                    index={gi * 6 + mi}
                    last={mi === group.modules.length - 1}
                    isPremium={isPremium}
                  />
                ))}
              </motion.div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-300">
          DJAMA PRO · {totalModules} modules · Données en temps réel
        </p>
      </div>
    </div>
  );
}
