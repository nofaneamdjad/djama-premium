/**
 * MODULE_GROUPS — structure partagée entre /client et /client/dashboard.
 * Toute modification ici se propage aux deux pages automatiquement.
 */

import {
  ReceiptText, CreditCard, Wallet, BookMarked,
  Users, FileText, Truck, Package,
  ListTodo, Calendar, CalendarRange, Timer,
  StickyNote, CheckSquare, ScanLine, Network,
  Search, Zap, Star, Share2, Brain, FolderOpen,
  Building2, Banknote, BookOpen, MessageSquare, Target,
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
      { href: "/client/factures",   label: "Factures & Devis", sub: "Créer, envoyer, suivre vos documents",  icon: ReceiptText,  color: "#2563eb", bg: "#dbeafe" },
      { href: "/client/depenses",   label: "Dépenses",          sub: "Notes de frais et charges",             icon: CreditCard,   color: "#ea580c", bg: "#ffedd5" },
      { href: "/client/tresorerie", label: "Trésorerie",        sub: "Cash-flow et flux consolidés",          icon: Wallet,       color: "#059669", bg: "#d1fae5" },
      { href: "/client/comptabilite", label: "Comptabilité",     sub: "Bilan, TVA et journal comptable",       icon: BookMarked,   color: "#0891b2", bg: "#e0f2fe" },
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
      { href: "/client/bloc-notes",  label: "Notes",       sub: "Notes, cahiers, IA, vocal & canvas", icon: StickyNote,   color: "#92400e", bg: "#fef9c3" },
      { href: "/client/checklists",  label: "Checklists",  sub: "Listes de vérification rapides",      icon: CheckSquare,  color: "#10b981", bg: "#d1fae5" },
      { href: "/client/scanner",     label: "Scanner",     sub: "Scanner et archiver vos documents",   icon: ScanLine,     color: "#0ea5e9", bg: "#e0f2fe" },
      { href: "/client/mindmap",     label: "Mind Map",    sub: "Cartes mentales et brainstorm",        icon: Network,      color: "#8b5cf6", bg: "#ede9fe" },
    ],
  },
  {
    label: "Intelligence",
    icon:  Brain,
    color: "#6d28d9",
    modules: [
      { href: "/client/sourcing",        label: "Sourcing IA",        sub: "Trouver clients et partenaires", icon: Search,     color: "#6d28d9", bg: "#ede9fe" },
      { href: "/client/assistant",       label: "Assistant IA",       sub: "Relances auto et questions",     icon: Zap,        color: "#0369a1", bg: "#e8f4fd" },
      { href: "/client/projets",         label: "Projets",            sub: "Gestion de projets et suivi",    icon: FolderOpen, color: "#d97706", bg: "#fff3e0" },
      { href: "/client/reseaux-sociaux", label: "Réseaux Sociaux IA", sub: "Planifier et créer du contenu",  icon: Share2,     color: "#e1306c", bg: "#fce7f3" },
      { href: "/coaching-ia/espace",     label: "Coaching IA",        sub: "Accompagnement personnalisé",    icon: Brain,      color: "#9d174d", bg: "#faf0ff" },
    ],
  },
  {
    label: "Gestion",
    icon:  Building2,
    color: "#3b82f6",
    modules: [
      { href: "/client/portail",       label: "Portail Client",  sub: "Espace dédié à vos clients",      icon: Building2,    color: "#3b82f6", bg: "#dbeafe" },
      { href: "/client/paie",          label: "Paie & RH",       sub: "Salaires, contrats, effectif",    icon: Banknote,     color: "#10b981", bg: "#d1fae5" },
      { href: "/client/reputation",    label: "Réputation",      sub: "Avis, e-réputation, veille",      icon: Star,         color: "#b91c1c", bg: "#fef2f2" },
      { href: "/client/blog",          label: "Blog",            sub: "Rédigez et gérez vos articles",   icon: BookOpen,     color: "#0369a1", bg: "#f0f9ff" },
      { href: "/client/temoignages",   label: "Témoignages",     sub: "Avis clients et réputation",      icon: MessageSquare,color: "#9a3412", bg: "#ffedd5" },
      { href: "/client/planification", label: "Planification",   sub: "OKRs et stratégie long terme",    icon: Target,       color: "#075985", bg: "#cffafe" },
    ],
  },
] as const;
