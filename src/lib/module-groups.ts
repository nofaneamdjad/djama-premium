/**
 * MODULE_GROUPS — structure partagée entre /client et /client/dashboard
 * Toute modification ici se propage aux deux pages automatiquement.
 */

import {
  ReceiptText, CreditCard, Wallet,
  Users, FileText, Truck, Package,
  ListTodo, Calendar, CalendarRange, Timer,
  StickyNote,
  Search, Zap, Star, Share2, Brain,
  Building2, Banknote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModuleItem {
  readonly href:  string;
  readonly label: string;
  readonly sub:   string;
  readonly icon:  LucideIcon;
  readonly color: string;
  readonly bg:    string;
}

export interface ModuleGroup {
  readonly label:   string;
  readonly icon:    LucideIcon;
  readonly color:   string;
  readonly modules: readonly ModuleItem[];
}

export const MODULE_GROUPS: readonly ModuleGroup[] = [
  {
    label: "Finance",
    icon:  Wallet,
    color: "#059669",
    modules: [
      { href: "/client/factures",   label: "Factures & Devis", sub: "Créer, envoyer, suivre vos documents",  icon: ReceiptText, color: "#2563eb", bg: "#dbeafe" },
      { href: "/client/depenses",   label: "Dépenses",          sub: "Notes de frais et charges",             icon: CreditCard,  color: "#ea580c", bg: "#ffedd5" },
      { href: "/client/tresorerie", label: "Trésorerie",        sub: "Cash-flow et flux consolidés",          icon: Wallet,      color: "#059669", bg: "#d1fae5" },
    ],
  },
  {
    label: "Commercial",
    icon:  Users,
    color: "#7c3aed",
    modules: [
      { href: "/client/crm",          label: "CRM Clients",  sub: "Contacts, pipeline, relances",   icon: Users,    color: "#7c3aed", bg: "#ede9fe" },
      { href: "/client/contrats",     label: "Contrats",     sub: "Gestion des contrats signés",    icon: FileText, color: "#b45309", bg: "#fef3c7" },
      { href: "/client/fournisseurs", label: "Fournisseurs", sub: "Catalogue et commandes",         icon: Truck,    color: "#166534", bg: "#dcfce7" },
      { href: "/client/stocks",       label: "Stocks",       sub: "Inventaire en temps réel",       icon: Package,  color: "#0d9488", bg: "#ccfbf1" },
    ],
  },
  {
    label: "Opérations",
    icon:  Calendar,
    color: "#4f46e5",
    modules: [
      { href: "/client/productivite", label: "Tâches",   sub: "To-do, projets, suivi",           icon: ListTodo,      color: "#be185d", bg: "#fce7f3" },
      { href: "/client/planning",     label: "Planning", sub: "Agenda et réservations",          icon: Calendar,      color: "#4f46e5", bg: "#e0e7ff" },
      { href: "/client/equipe",       label: "Équipe",   sub: "Membres et planification RH",     icon: CalendarRange, color: "#0891b2", bg: "#cffafe" },
      { href: "/client/chrono",       label: "Chrono",   sub: "Time tracking et rapports",       icon: Timer,         color: "#7c3aed", bg: "#f3e8ff" },
    ],
  },
  {
    label: "Notes",
    icon:  StickyNote,
    color: "#92400e",
    modules: [
      { href: "/client/bloc-notes", label: "Notes", sub: "Notes, cahiers, IA, vocal & canvas", icon: StickyNote, color: "#92400e", bg: "#fef9c3" },
    ],
  },
  {
    label: "Intelligence",
    icon:  Brain,
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
    icon:  Building2,
    color: "#3b82f6",
    modules: [
      { href: "/client/portail", label: "Portail Client", sub: "Espace dédié à vos clients",   icon: Building2, color: "#3b82f6", bg: "#dbeafe" },
      { href: "/client/paie",    label: "Paie & RH",      sub: "Salaires, contrats, effectif", icon: Banknote,  color: "#10b981", bg: "#d1fae5" },
    ],
  },
] as const;
