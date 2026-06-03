"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, Timer, CreditCard, FileText, Search,
  Wallet, StickyNote, Calendar, CalendarRange, Brain, Zap, Star, Mic,
  Truck, Package, Bell, BarChart2, Building2, Banknote,
  ChevronRight, LogOut, Settings, LayoutGrid, ListTodo,
  TrendingUp, TrendingDown, Send, Share2,
  Lock, Crown, AlertCircle, CheckCircle2, X,
  Clock, ArrowRight, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { getToolTier } from "@/lib/plans";
import OnboardingModal from "@/components/OnboardingModal";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

/* ── Types ── */
interface TodayTask  { id: string; title: string; priority: string; due_date: string }
interface NextEvent  { id: string; title: string; start_at: string; event_type: string }

/* ── Module groups ── */
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
      { href: "/client/sourcing",        label: "Sourcing IA",        sub: "Trouver clients et partenaires", icon: Search, color: "#6d28d9", bg: "#ede9fe" },
      { href: "/client/assistant",       label: "Assistant IA",       sub: "Relances auto et questions",     icon: Zap,    color: "#0369a1", bg: "#e0f2fe" },
      { href: "/client/reputation",      label: "Réputation",         sub: "Avis, e-réputation, veille",     icon: Star,   color: "#b91c1c", bg: "#fee2e2" },
      { href: "/client/reseaux-sociaux", label: "Réseaux Sociaux IA", sub: "Planifier et créer du contenu",  icon: Share2, color: "#e1306c", bg: "#fce7f3" },
      { href: "/coaching-ia/espace",     label: "Coaching IA",        sub: "Accompagnement personnalisé",    icon: Brain,  color: "#9d174d", bg: "#fdf2f8" },
    ],
  },
  {
    label: "Gestion",
    icon: Building2,
    color: "#3b82f6",
    modules: [
      { href: "/client/portail", label: "Portail Client", sub: "Espace dédié à vos clients",    icon: Building2, color: "#3b82f6", bg: "#dbeafe" },
      { href: "/client/paie",    label: "Paie & RH",      sub: "Salaires, contrats, effectif",  icon: Banknote,  color: "#10b981", bg: "#d1fae5" },
    ],
  },
] as const;

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
function getDay() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtEventTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtEventDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getDate() - now.getDate();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (diff === 1 && d.getMonth() === now.getMonth()) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function priorityColor(p: string) {
  if (p === "urgent") return "#ef4444";
  if (p === "high")   return "#f97316";
  if (p === "low")    return "#94a3b8";
  return "#a78bfa";
}

/* ── Custom app icons ── */
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
      <rect x="11" y="16" width="26" height="22" rx="3" fill="white" opacity="0.18"/>
      <rect x="11" y="16" width="26" height="22" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <path d="M8 18 L24 8 L40 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
      <rect x="20" y="27" width="8" height="11" rx="2" fill="white" opacity="0.85"/>
      <rect x="14" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
      <rect x="28" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
    </svg>
  ),
  "/client/paie": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ig19" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399"/><stop offset="1" stopColor="#065f46"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ig19)"/>
      <rect x="7" y="14" width="34" height="22" rx="4" fill="white" opacity="0.18"/>
      <rect x="7" y="14" width="34" height="22" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="7" y="19" width="34" height="6" fill="white" opacity="0.12"/>
      <text x="18" y="32" fontSize="14" fontWeight="bold" fill="white" opacity="0.9" fontFamily="Arial">€</text>
      <circle cx="34" cy="30" r="3" fill="white" opacity="0.8"/>
      <path d="M28 38c0-3.314 2.686-4 6-4s6 .686 6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <rect x="9" y="28" width="4" height="5" rx="1" fill="white" opacity="0.7"/>
      <rect x="14" y="25" width="4" height="8" rx="1" fill="white" opacity="0.7"/>
    </svg>
  ),

  /* ── Icônes Quick Actions ── */
  "qa/devis": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa0" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#0ea5e9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa0)"/>
      <rect x="12" y="8" width="18" height="24" rx="3" fill="white" opacity="0.18"/>
      <rect x="12" y="8" width="18" height="24" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="16" y="15" width="10" height="1.8" rx="0.9" fill="white"/>
      <rect x="16" y="19" width="7" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <rect x="16" y="23" width="8.5" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <rect x="26" y="29" width="11" height="3" rx="1.5" fill="white" opacity="0.15"/>
      <path d="M27 37 L35 29 L38.5 32.5 L30.5 40.5 L27 40.5 Z" fill="white" opacity="0.9"/>
      <path d="M33 31 L36.5 34.5" stroke="rgba(99,102,241,0.4)" strokeWidth="1.2"/>
    </svg>
  ),
  "qa/contact": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa1)"/>
      <circle cx="24" cy="16" r="7.5" fill="white" opacity="0.22"/>
      <circle cx="24" cy="16" r="5.5" fill="white" opacity="0.75"/>
      <path d="M10 38 C10 29.163 16.268 24 24 24 C31.732 24 38 29.163 38 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M10 38 C10 31 16.268 27 24 27 C31.732 27 38 31 38 38" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.88"/>
      <circle cx="35" cy="34" r="6" fill="white"/>
      <path d="M32.5 34 L34.5 36 L38 32" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "qa/note": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#b45309"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa2)"/>
      <rect x="10" y="9" width="24" height="30" rx="4" fill="white" opacity="0.18"/>
      <rect x="10" y="9" width="24" height="30" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="10" y="9" width="5" height="30" rx="4" fill="white" opacity="0.22"/>
      <rect x="10" y="9" width="5" height="30" rx="0" fill="white" opacity="0.08"/>
      <rect x="17" y="16" width="13" height="2" rx="1" fill="white"/>
      <rect x="17" y="21" width="9.5" height="1.6" rx="0.8" fill="white" opacity="0.7"/>
      <rect x="17" y="26" width="11" height="1.6" rx="0.8" fill="white" opacity="0.7"/>
      <rect x="17" y="31" width="7.5" height="1.6" rx="0.8" fill="white" opacity="0.5"/>
      <circle cx="36" cy="36" r="7" fill="white"/>
      <path d="M33 36 L35.5 38.5 L39 34" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "qa/timer": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0891b2"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa3)"/>
      <circle cx="24" cy="28" r="14" fill="white" opacity="0.12"/>
      <circle cx="24" cy="28" r="14" stroke="white" strokeWidth="1.8" opacity="0.45"/>
      <circle cx="24" cy="28" r="10" fill="white" opacity="0.08"/>
      <circle cx="24" cy="28" r="2.5" fill="white"/>
      <line x1="24" y1="28" x2="24" y2="19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="24" y1="28" x2="30" y2="32" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="20" y="9" width="8" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
      <path d="M36 12 L39.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <path d="M12 12 L8.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <circle cx="24" cy="19" r="1.2" fill="white" opacity="0.6"/>
      <circle cx="34" cy="28" r="1" fill="white" opacity="0.5"/>
    </svg>
  ),
};

function AppModuleIcon({ href, locked = false }: { href: string; locked?: boolean }) {
  const icon = APP_ICONS[href];
  if (!icon) return null;
  return (
    <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-opacity duration-200"
      style={{ opacity: locked ? 0.5 : 1 }}>
      {icon}
    </div>
  );
}

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
            ${isLocked ? "hover:bg-amber-50/70 active:bg-amber-50" : "hover:bg-gray-50 active:bg-gray-100"}
            ${!last ? "border-b border-gray-100" : ""}`}
        >
          <div className="relative shrink-0">
            <AppModuleIcon href={mod.href} locked={isLocked} />
            {isLocked && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-md"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", border: "1.5px solid #fff" }}>
                <Lock size={8} color="white" strokeWidth={2.5} />
              </div>
            )}
          </div>
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
          {isLocked ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(201,165,90,0.10)", border: "1px solid rgba(201,165,90,0.30)", color: GOLD }}>
              <Crown size={7} /> PRO
            </div>
          ) : tier === "free" ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)", color: "#16a34a" }}>
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

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────── */
export default function CockpitPage() {
  const { isPremium, isFree } = useSubscription();

  /* ── État KPIs ── */
  const [firstName,      setFirstName]      = useState("");
  const [initial,        setInitial]        = useState("?");
  const [kpiLoading,     setKpiLoading]     = useState(true);
  const [caMonth,        setCaMonth]        = useState(0);
  const [depensesMonth,  setDepensesMonth]  = useState(0);
  const [nbContacts,     setNbContacts]     = useState(0);
  const [nbFactures,     setNbFactures]     = useState(0);
  const [caEvo,          setCaEvo]          = useState<number | null>(null);

  /* ── État "Aujourd'hui" ── */
  const [todayTasks,   setTodayTasks]   = useState<TodayTask[]>([]);
  const [nextEvent,    setNextEvent]    = useState<NextEvent | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayLoading, setTodayLoading] = useState(true);

  /* ── UI ── */
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [showAlert, setShowAlert] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── Chargement données ── */
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

      const now   = new Date();
      const y     = now.getFullYear();
      const m     = String(now.getMonth() + 1).padStart(2, "0");
      const start = `${y}-${m}-01`;
      const end   = `${y}-${m}-31`;
      const prevM = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY = now.getMonth() === 0 ? y - 1 : y;
      const pS    = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const pE    = `${prevY}-${String(prevM).padStart(2, "0")}-31`;
      const today = todayStr();

      const [facRes, prevRes, crmRes, pendRes, expRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pS).lte("date_emission", pE),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
        supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", start).lte("date", end),
      ]);

      const ca     = (facRes.data  ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const exp    = (expRes.data  ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

      setCaMonth(ca);
      setDepensesMonth(exp);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);

      /* ── Données "Aujourd'hui" ── */
      const [taskRes, eventRes, overdueRes] = await Promise.all([
        supabase
          .from("productivity_tasks")
          .select("id, title, priority, due_date")
          .eq("user_id", user.id)
          .neq("status", "done")
          .lte("due_date", today)
          .order("due_date", { ascending: true })
          .limit(3),
        supabase
          .from("planning_events")
          .select("id, title, start_at, event_type")
          .eq("user_id", user.id)
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "facture")
          .eq("statut", "envoyée")
          .lt("due_date", today),
      ]);

      setTodayTasks((taskRes.data ?? []) as TodayTask[]);
      setNextEvent(eventRes.data as NextEvent | null);
      setOverdueCount(overdueRes.count ?? 0);
      setTodayLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── Recherche modules ── */
  const allModules = useMemo(
    () => MODULE_GROUPS.flatMap(g => g.modules.map(m => ({ ...m, group: g.label }))),
    []
  );
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return MODULE_GROUPS;
    const q = search.toLowerCase();
    return MODULE_GROUPS
      .map(g => ({ ...g, modules: g.modules.filter(m => m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)) }))
      .filter(g => g.modules.length > 0);
  }, [search]);

  const totalModules = allModules.length;
  const netMonth = caMonth - depensesMonth;

  /* ─────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────── */
  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#f2f4f7" }}>

      <OnboardingModal name={firstName} />

      {/* ══════════════════════════════════════════
          HEADER SOMBRE
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(145deg,#0a0f1e 0%,#0f1729 55%,#0c1220 100%)" }}
      >
        {/* Shimmer gold top */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease }}
          className="absolute inset-x-0 top-0 h-[1px] origin-left"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,165,90,0.7) 40%, rgba(201,165,90,0.3) 70%, transparent 100%)" }}
        />
        {/* Orb ambiance */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.13, 0.06] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-20 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[90px]"
          style={{ background: "rgba(201,165,90,0.2)" }}
        />
        <motion.div
          animate={{ y: [0, 16, 0], opacity: [0.03, 0.09, 0.03] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[300px] rounded-full blur-[80px]"
          style={{ background: "rgba(96,165,250,0.08)" }}
        />

        <div className="relative mx-auto max-w-4xl px-5 pt-4 pb-6">

          {/* ── Top bar ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className="flex items-center justify-between mb-5"
          >
            <div>
              <p className="text-[0.62rem] font-medium capitalize tracking-widest text-white/30">{getDay()}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-white/70">
                {getGreeting()}{firstName && <span className="text-white">, {firstName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link href="/client/factures">
                <motion.div whileTap={{ scale: 0.88 }} className="relative flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Bell size={13} className="text-white/50" />
                  {(nbFactures + overdueCount) > 0 && <NotifBadge count={nbFactures + overdueCount} />}
                </motion.div>
              </Link>
              {/* Avatar menu */}
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
                        <div className="mt-1 flex items-center gap-1.5">
                          {isPremium ? (
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                              style={{ background: "rgba(201,165,90,0.12)", color: GOLD }}>
                              <Crown size={7}/> DJAMA PRO
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-gray-400">Plan Gratuit</span>
                          )}
                        </div>
                      </div>
                      {[
                        { icon:LayoutGrid, label:"Dashboard",  href:"/client/abonnements" },
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

          {/* ── KPI Card enrichi ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.08, ease }}
            className="mb-4 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
          >
            {/* ── Ligne 1 : label + badges ── */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                CA · {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </p>
              <div className="flex items-center gap-1.5">
                {!kpiLoading && caEvo !== null && (
                  <div className="flex items-center gap-1 rounded-xl px-2 py-1"
                    style={{
                      background: caEvo >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                      border: `1px solid ${caEvo >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}>
                    {caEvo >= 0 ? <TrendingUp size={11} color="#4ade80"/> : <TrendingDown size={11} color="#f87171"/>}
                    <span className="text-[11px] font-black" style={{ color: caEvo >= 0 ? "#4ade80" : "#f87171" }}>
                      {caEvo >= 0 ? "+" : ""}{caEvo}%
                    </span>
                  </div>
                )}
                {!kpiLoading && (
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-[9px] text-white/30 uppercase tracking-wide">Net</span>
                    <span className="text-[11px] font-black ml-0.5" style={{ color: netMonth >= 0 ? "#4ade80" : "#f87171" }}>
                      {netMonth >= 0 ? "+" : ""}{fmtEurInt(netMonth)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Ligne 2 : grand nombre CA ── */}
            <div className="mb-3">
              {kpiLoading ? (
                <div className="h-12 w-36 animate-pulse rounded-xl" style={{ background:"rgba(255,255,255,0.08)" }}/>
              ) : (
                <motion.p
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.18, ease }}
                  className="text-[3.2rem] font-black leading-none tracking-tight text-white"
                >
                  {fmtEurInt(caMonth)}
                </motion.p>
              )}
            </div>

            {/* Barre CA / Dépenses */}
            {!kpiLoading && (caMonth > 0 || depensesMonth > 0) && (
              <div className="mt-3 mb-3">
                <div className="flex justify-between text-[9px] text-white/30 mb-1">
                  <span>Dépenses {fmtEurInt(depensesMonth)}</span>
                  <span>{caMonth > 0 ? Math.round((depensesMonth / caMonth) * 100) : 0}% du CA</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${caMonth > 0 ? Math.min((depensesMonth / caMonth) * 100, 100) : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: depensesMonth / caMonth > 0.7 ? "#f87171" : depensesMonth / caMonth > 0.4 ? "#fbbf24" : "#4ade80" }}
                  />
                </div>
              </div>
            )}

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Contacts",      val: kpiLoading ? "…" : String(nbContacts),  color: "#60a5fa" },
                { label: "En attente",    val: kpiLoading ? "…" : String(nbFactures),  color: nbFactures > 0 ? "#f87171" : "#4ade80" },
                { label: "Dépenses",      val: kpiLoading ? "…" : fmtEurInt(depensesMonth), color: "#fb923c" },
              ].map(s => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center rounded-xl py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[13px] font-black" style={{ color: s.color }}>{s.val}</span>
                  <span className="mt-0.5 text-[9px] text-white/25 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Quick Actions × 6 — vraies icônes SVG style app ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18, ease }}
            className="grid grid-cols-6 gap-2"
          >
            {([
              { href:"/client/factures", iconKey:"/client/factures", label:"Facture",  locked:false },
              { href:"/client/factures", iconKey:"qa/devis",         label:"Devis",    locked:false },
              { href:"/client/depenses", iconKey:"/client/depenses", label:"Dépense",  locked:isFree },
              { href:"/client/crm",      iconKey:"qa/contact",       label:"Contact",  locked:isFree },
              { href:"/client/notes",    iconKey:"qa/note",          label:"Note",     locked:false },
              { href:"/client/chrono",   iconKey:"qa/timer",         label:"Timer",    locked:isFree },
            ] as { href:string; iconKey:string; label:string; locked:boolean }[]).map((a, i) => (
              <motion.div key={a.label}
                initial={{ opacity:0, y:12, scale:0.85 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ type:"spring", stiffness:420, damping:22, delay: 0.22 + i * 0.045 }}
              >
                <Link href={a.href} className="relative flex flex-col items-center gap-1.5 transition active:scale-95">
                  {/* Icône SVG app-style */}
                  <div className="relative h-[52px] w-[52px] overflow-hidden rounded-[14px] shadow-[0_5px_16px_rgba(0,0,0,0.28)]"
                    style={{ opacity: a.locked ? 0.72 : 1 }}>
                    {APP_ICONS[a.iconKey]}
                  </div>
                  <span className="text-[9.5px] font-semibold text-white/80 tracking-wide leading-none">{a.label}</span>
                  {a.locked && (
                    <div className="absolute -bottom-0.5 right-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full shadow-sm"
                      style={{ background: GOLD, border: "1.5px solid rgba(255,255,255,0.5)" }}>
                      <Lock size={7} color="white" strokeWidth={3} />
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* ── Wave transition sombre → clair ── */}
        <svg viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none"
          className="w-full block" style={{ marginBottom: "-1px", height: "48px" }}>
          <path d="M0,20 C200,48 500,4 720,24 C940,44 1240,8 1440,28 L1440,48 L0,48 Z" fill="#f2f4f7"/>
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          CONTENU CLAIR
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-4 sm:px-6">

        {/* ── Alerte factures en retard ── */}
        <AnimatePresence>
          {overdueCount > 0 && showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.28, ease }}
              className="mb-3 overflow-hidden"
            >
              <Link href="/client/factures">
                <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.12)" }}>
                      <AlertCircle size={14} color="#ef4444" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-bold text-red-600">
                        {overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard de paiement
                      </p>
                      <p className="text-[10.5px] text-red-400">Relancer vos clients →</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); setShowAlert(false); }}
                    className="text-red-300 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Banner upgrade PRO ── */}
        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3"
            style={{
              background: "linear-gradient(135deg, rgba(201,165,90,0.10), rgba(176,141,69,0.06))",
              border: "1px solid rgba(201,165,90,0.22)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(201,165,90,0.15)" }}>
                <Crown size={13} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Débloquez tous les modules</p>
                <p className="text-[10.5px] text-gray-400">{totalModules} outils PRO · 11,90€/mois · Sans engagement</p>
              </div>
            </div>
            <Link
              href="/client/abonnements"
              className="shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}
            >
              <Sparkles size={10} /> Voir PRO
            </Link>
          </motion.div>
        )}

        {/* ── Section "Aujourd'hui" ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease }}
          className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {/* Tâches */}
          <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: "rgba(190,24,93,0.08)" }}>
                  <ListTodo size={13} style={{ color: "#be185d" }} strokeWidth={2.2} />
                </div>
                <span className="text-[12px] font-bold text-gray-700">Tâches à faire</span>
              </div>
              <Link href="/client/productivite" className="text-[10.5px] font-semibold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-0.5">
                Tout voir <ArrowRight size={10} />
              </Link>
            </div>
            {todayLoading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-8 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }}/>)}
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#f8faf8" }}>
                <CheckCircle2 size={14} color="#4ade80" />
                <span className="text-[11.5px] text-gray-500">Rien en retard — beau travail !</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {todayTasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                  return (
                    <Link key={task.id} href="/client/productivite">
                      <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: priorityColor(task.priority) }} />
                        <span className="flex-1 text-[12px] font-medium text-gray-700 truncate">{task.title}</span>
                        {task.due_date && (
                          <span className={`text-[9.5px] shrink-0 font-semibold ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                            {isOverdue
                              ? <span className="flex items-center gap-0.5"><AlertCircle size={9} className="inline shrink-0" style={{color:"#ef4444"}}/> retard</span>
                              : "aujourd'hui"}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prochain RDV + indicateur mensuel */}
          <div className="space-y-3">
            {/* Prochain événement */}
            <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: "rgba(79,70,229,0.08)" }}>
                    <Calendar size={13} style={{ color: "#4f46e5" }} strokeWidth={2.2} />
                  </div>
                  <span className="text-[12px] font-bold text-gray-700">Prochain RDV</span>
                </div>
                <Link href="/client/planning" className="text-[10.5px] font-semibold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-0.5">
                  Planning <ArrowRight size={10} />
                </Link>
              </div>
              {todayLoading ? (
                <div className="h-12 rounded-xl animate-pulse" style={{ background: "#f3f4f6" }}/>
              ) : nextEvent ? (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-center w-10 rounded-xl py-1.5"
                    style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.1)" }}>
                    <div className="text-[18px] font-black leading-none text-indigo-600">
                      {new Date(nextEvent.start_at).getDate()}
                    </div>
                    <div className="text-[8px] uppercase tracking-wide text-indigo-400 font-semibold">
                      {new Date(nextEvent.start_at).toLocaleDateString("fr-FR", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-800 truncate">{nextEvent.title}</p>
                    <p className="text-[10.5px] text-gray-400">
                      {fmtEventDate(nextEvent.start_at)} · {fmtEventTime(nextEvent.start_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-gray-300" />
                  <span className="text-[11.5px] text-gray-400">Aucun événement à venir</span>
                </div>
              )}
            </div>

            {/* Compteur mensuel */}
            <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.14)" }}>
              <div className="flex items-center gap-2">
                <BarChart2 size={14} style={{ color: GOLD }} />
                <span className="text-[11.5px] font-semibold text-gray-600">
                  {new Date().toLocaleDateString("fr-FR", { month: "long" })} en cours
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-black" style={{ color: GOLD }}>
                  {kpiLoading ? "…" : fmtEurInt(caMonth)}
                </span>
                {!kpiLoading && caEvo !== null && (
                  <span className="text-[9.5px] font-bold" style={{ color: caEvo >= 0 ? "#4ade80" : "#f87171" }}>
                    {caEvo >= 0
                      ? <TrendingUp size={10} className="inline" style={{color:"#4ade80"}}/>
                      : <TrendingDown size={10} className="inline" style={{color:"#f87171"}}/>
                    }{Math.abs(caEvo)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Barre de recherche modules ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25, ease }}
          className="relative mb-4"
        >
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-[13px] text-gray-700 placeholder:text-gray-400 shadow-sm outline-none transition focus:ring-2"
            style={{
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: search ? `0 0 0 2px rgba(201,165,90,0.2), 0 2px 8px rgba(0,0,0,0.06)` : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </motion.div>

        {/* ── Résultats de recherche ── */}
        {search.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease }}
            className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm"
            style={{ border: "1px solid rgba(0,0,0,0.05)" }}
          >
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                <Search size={20} className="text-gray-300" />
                <p className="text-[12px]">Aucun module trouvé pour &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              filteredGroups.flatMap(g => g.modules).map((mod, mi, arr) => (
                <ModuleRow
                  key={mod.href + mi}
                  mod={mod as AnyModule}
                  index={mi}
                  last={mi === arr.length - 1}
                  isPremium={isPremium}
                />
              ))
            )}
          </motion.div>
        )}

        {/* ── Module groups ── */}
        {!search.trim() && (
          <div className="space-y-3">
            {MODULE_GROUPS.map((group, gi) => {
              const GroupIcon = group.icon;
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
                      ? "0 2px 12px rgba(201,165,90,0.08), 0 8px 24px rgba(0,0,0,0.03)"
                      : "0 2px 12px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03)",
                    border: groupIsLocked
                      ? "1px solid rgba(201,165,90,0.18)"
                      : "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Header groupe */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${group.color}18` }}>
                        <GroupIcon size={13} style={{ color: group.color }} strokeWidth={2}/>
                      </div>
                      <span className="text-[12px] font-bold text-gray-700 tracking-wide">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {groupIsLocked && (
                        <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(201,165,90,0.10)", border: "1px solid rgba(201,165,90,0.25)", color: GOLD }}>
                          <Crown size={7} /> PRO
                        </div>
                      )}
                      <span className="text-[10px] font-semibold text-gray-300 tabular-nums">{group.modules.length}</span>
                    </div>
                  </div>

                  {/* Lignes modules */}
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
        )}

        {/* ── Footer ── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {isFree && (
            <Link
              href="/client/abonnements"
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12px] font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}
            >
              <Crown size={12} /> Passer à DJAMA PRO — 11,90€/mois
            </Link>
          )}
          <p className="text-[10.5px] text-gray-400">
            DJAMA PRO · {totalModules} modules · Données en temps réel
          </p>
        </div>
      </div>
    </div>
  );
}
