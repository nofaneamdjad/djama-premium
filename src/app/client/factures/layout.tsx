"use client";

/**
 * Layout Factures & Devis — Sidebar de navigation interne à l'application.
 * S'insère dans le layout global /client/ (DesktopSidebar + TopBar déjà présents).
 * Thème clair/sombre via useTheme(). Sidebar repliable via localStorage.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, FileSignature, Users,
  Building2, Settings2, ChevronRight, ChevronLeft, ReceiptText,
  Bell, BarChart2, Grid3X3, Images, Plus, Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#FFB900";

interface NavItem {
  href:    string;
  label:   string;
  icon:    React.ElementType;
  badge?:  string;
  exact?:  boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Navigation",
    items: [
      { href: "/client/factures",                      label: "Vue d'ensemble",    icon: LayoutDashboard, exact: true },
      { href: "/client/factures/agent",                 label: "DJAMA IA",          icon: Sparkles },
      { href: "/client/factures/factures/nouveau",     label: "Créer une facture", icon: Plus },
      { href: "/client/factures/devis/nouveau",        label: "Créer un devis",    icon: Plus },
      { href: "/client/factures/factures",             label: "Factures",          icon: ReceiptText },
      { href: "/client/factures/devis",                label: "Devis",             icon: FileSignature },
      { href: "/client/factures/clients",              label: "Clients",           icon: Users },
      { href: "/client/factures/relances",             label: "Relances",          icon: Bell },
    ],
  },
  {
    label: "Outils",
    items: [
      { href: "/client/factures/galerie",    label: "Galerie des modèles", icon: Images },
      { href: "/client/factures/catalogue",  label: "Catalogue",           icon: Grid3X3 },
    ],
  },
  {
    label: "Analyse",
    items: [
      { href: "/client/factures/stats",      label: "Statistiques",   icon: BarChart2 },
    ],
  },
  {
    label: "Réglages",
    items: [
      { href: "/client/factures/entreprise", label: "Mon entreprise", icon: Building2 },
      { href: "/client/factures/parametres", label: "Paramètres",     icon: Settings2 },
    ],
  },
];

function NavLink({ item, active, isDark }: { item: NavItem; active: boolean; isDark: boolean }) {
  const Icon = item.icon;

  const activeStyle = {
    color: GOLD,
    background: isDark ? "rgba(255,185,0,0.12)" : "rgba(255,185,0,0.10)",
    border: `1px solid ${isDark ? "rgba(255,185,0,0.22)" : "rgba(255,185,0,0.30)"}`,
  };

  const inactiveStyle = {
    color: isDark ? "rgba(255,255,255,0.55)" : "#374151",
    border: "1px solid transparent",
  };

  return (
    <Link
      href={item.href}
      className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:opacity-80"
      style={active ? activeStyle : inactiveStyle}
    >
      <Icon
        size={15}
        strokeWidth={active ? 2.2 : 1.8}
        style={{ color: active ? GOLD : (isDark ? "rgba(255,255,255,0.45)" : "#6b7280"), flexShrink: 0 }}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
          style={{ background: "rgba(255,185,0,0.12)", color: GOLD }}
        >
          {item.badge}
        </span>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r" style={{ background: GOLD }} />
      )}
    </Link>
  );
}

function FacturesSidebar({ isDark, onCollapse }: { isDark: boolean; onCollapse: () => void }) {
  const pathname = usePathname();

  const bg       = isDark ? "rgba(255,255,255,0.015)" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.07)"  : "#e5e7eb";
  const divider  = isDark ? "rgba(255,255,255,0.06)"  : "#e5e7eb";
  const titleCol = isDark ? "rgba(255,255,255,0.80)"  : "#111827";
  const subCol   = isDark ? "rgba(255,255,255,0.30)"  : "#9ca3af";
  const navLabel = isDark ? "rgba(255,255,255,0.20)"  : "#9ca3af";
  const footerCol= isDark ? "rgba(255,255,255,0.35)"  : "#6b7280";
  const footerBg = isDark ? "rgba(255,255,255,0.03)"  : "rgba(0,0,0,0.03)";
  const footerBd = isDark ? "rgba(255,255,255,0.06)"  : "#e5e7eb";
  const goldDim  = isDark ? "rgba(255,185,0,0.12)"    : "rgba(255,185,0,0.10)";
  const goldBd   = isDark ? "rgba(255,185,0,0.22)"    : "rgba(255,185,0,0.30)";
  const chevCol  = isDark ? "rgba(255,255,255,0.25)"  : "#9ca3af";

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <nav
      className="flex h-full flex-col border-r"
      style={{ width: 196, minWidth: 196, background: bg, borderColor: border }}
    >
      {/* App header with collapse button */}
      <div
        className="flex items-center gap-2 px-3 py-4"
        style={{ borderBottom: `1px solid ${divider}` }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: goldDim, border: `1px solid ${goldBd}` }}
        >
          <ReceiptText size={13} style={{ color: GOLD }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold" style={{ color: titleCol }}>Facturation</div>
          <div className="text-[10px]" style={{ color: subCol }}>Factures & Devis</div>
        </div>
        <button
          onClick={onCollapse}
          title="Réduire la navigation"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:opacity-60"
          style={{ color: chevCol }}
        >
          <ChevronLeft size={13} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              className="mb-1 px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: navLabel }}
            >
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map(item => (
                <NavLink key={item.href} item={item} active={isActive(item)} isDark={isDark} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-3"
        style={{ borderTop: `1px solid ${divider}` }}
      >
        <Link
          href="/client/factures/documents"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
          style={{ color: footerCol, background: footerBg, border: `1px solid ${footerBd}` }}
        >
          <FileText size={11} />
          <span className="truncate">Éditeur complet</span>
          <ChevronRight size={9} className="ml-auto shrink-0" />
        </Link>
      </div>
    </nav>
  );
}

function CollapsedStrip({ isDark, onExpand }: { isDark: boolean; onExpand: () => void }) {
  const bg     = isDark ? "rgba(255,255,255,0.015)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)"  : "#e5e7eb";
  const col    = isDark ? "rgba(255,255,255,0.30)"  : "#9ca3af";

  return (
    <div
      className="flex h-full flex-col items-center border-r py-3"
      style={{ width: 44, minWidth: 44, background: bg, borderColor: border }}
    >
      <button
        onClick={onExpand}
        title="Ouvrir la navigation"
        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-60"
        style={{ color: col }}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function FacturesMobileNav({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();

  const bg     = isDark ? "rgba(255,255,255,0.015)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)"  : "#e5e7eb";

  const allItems: NavItem[] = [
    ...NAV_GROUPS.flatMap(g => g.items),
    { href: "/client/factures/documents", label: "Éditeur", icon: FileText },
  ];

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <nav
      className="lg:hidden shrink-0 flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1.5 scrollbar-none"
      style={{ background: bg, borderColor: border }}
    >
      {allItems.map(item => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-all"
            style={
              active
                ? { color: GOLD, background: isDark ? "rgba(255,185,0,0.12)" : "rgba(255,185,0,0.10)" }
                : { color: isDark ? "rgba(255,255,255,0.45)" : "#6b7280" }
            }
          >
            <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[9px] font-semibold leading-tight whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function FacturesLayout({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("factures-nav-open");
      if (stored !== null) setNavOpen(stored === "true");
    } catch {}
  }, []);

  function toggleNav() {
    setNavOpen(prev => {
      const next = !prev;
      try { localStorage.setItem("factures-nav-open", String(next)); } catch {}
      return next;
    });
  }

  if (pathname.startsWith("/client/factures/agent")) return <>{children}</>;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar : masquée sur mobile, visible à partir de lg */}
      <div className="hidden h-full lg:flex">
        {navOpen
          ? <FacturesSidebar isDark={isDark} onCollapse={toggleNav} />
          : <CollapsedStrip isDark={isDark} onExpand={toggleNav} />
        }
      </div>

      {/* Zone principale avec nav mobile en haut */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <FacturesMobileNav isDark={isDark} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
