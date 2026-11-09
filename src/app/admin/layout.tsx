"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Activity, AlertTriangle, TrendingUp,
  Users, Building2, UserCheck, Mail, History,
  Cpu, UserCog, Shield, CreditCard, Sliders, ClipboardCheck, ScrollText,
  Briefcase, MessageSquare, Terminal, LayoutGrid, Banknote,
  Receipt, FileText, Tag, Lock, FlaskConical, BarChart2,
  HeadphonesIcon, Bug, Flame, MonitorDot,
  Brain,
  ShieldCheck, Webhook, Send, Settings, Wrench, Globe, Megaphone,
  LogOut, Menu, X, ChevronDown, Search, Bell,
  ChevronsLeft, ChevronsRight, BarChart3, Sun, Moon,
  Zap, DollarSign, RefreshCcw, Undo2, TestTube2, Server,
} from "lucide-react";
import { HQ, V, HQThemeStyle } from "@/components/hq";

/* ─────────────────────────────────────────────────────────────
   NAVIGATION — 8 groupes organisés
───────────────────────────────────────────────────────────── */
type NavItem  = { href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number };
type NavGroup = { id: string; label: string; icon: React.ElementType; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  /* ── A. Vue générale ────────────────────────────────────── */
  {
    id: "vue", label: "Vue générale", icon: BarChart3,
    items: [
      { href: "/admin",             label: "Tableau de bord", icon: LayoutDashboard, exact: true },
      { href: "/admin/activite",    label: "Activité",        icon: Activity         },
      { href: "/admin/alertes",     label: "Alertes",         icon: AlertTriangle    },
      { href: "/admin/rapports",    label: "Rapports",        icon: BarChart2        },
    ],
  },
  /* ── B. Clients ────────────────────────────────────────── */
  {
    id: "clients", label: "Clients", icon: Users,
    items: [
      { href: "/admin/clients",     label: "Utilisateurs",   icon: Users     },
      { href: "/admin/entreprises", label: "Entreprises",    icon: Building2 },
      { href: "/admin/membres",     label: "Membres",        icon: UserCheck },
      { href: "/admin/invitations", label: "Invitations",    icon: Mail      },
    ],
  },
  /* ── C. Abonnements & Revenus ──────────────────────────── */
  {
    id: "revenus", label: "Abonnements & Revenus", icon: CreditCard,
    items: [
      { href: "/admin/plans",          label: "Offres",         icon: Sliders   },
      { href: "/admin/abonnements",     label: "Abonnements",    icon: Shield    },
      { href: "/admin/paiements",      label: "Paiements",      icon: CreditCard },
      { href: "/admin/factures",       label: "Facturation",    icon: Receipt   },
      { href: "/admin/coupons",        label: "Coupons",        icon: Tag       },
      { href: "/admin/essais",         label: "Essais gratuits",icon: TestTube2 },
      { href: "/admin/resiliations",   label: "Résiliations",   icon: RefreshCcw },
      { href: "/admin/remboursements", label: "Remboursements", icon: Undo2     },
    ],
  },
  /* ── D. Applications & IA ──────────────────────────────── */
  {
    id: "applications", label: "Applications & IA", icon: LayoutGrid,
    items: [
      { href: "/admin/applications",   label: "Catalogue",      icon: LayoutGrid },
      { href: "/admin/hq/feature-flags", label: "Feature Flags",icon: Sliders   },
      { href: "/admin/ia",             label: "Intelligence IA", icon: Brain     },
      { href: "/admin/monitoring",     label: "Monitoring",      icon: MonitorDot },
    ],
  },
  /* ── E. Exploitation logiciel ──────────────────────────── */
  {
    id: "exploitation", label: "Exploitation", icon: Server,
    items: [
      { href: "/admin/support",     label: "Support",       icon: HeadphonesIcon },
      { href: "/admin/messages",    label: "Messages",      icon: MessageSquare  },
      { href: "/admin/tickets",     label: "Tickets",       icon: ClipboardCheck },
      { href: "/admin/incidents",   label: "Incidents",     icon: Flame          },
      { href: "/admin/bugs",        label: "Bugs",          icon: Bug            },
      { href: "/admin/maintenance", label: "Maintenance",   icon: Wrench         },
      { href: "/admin/webhooks",    label: "Webhooks",      icon: Webhook        },
    ],
  },
  /* ── F. DJAMA HQ — Personnel ───────────────────────────── */
  {
    id: "hq", label: "DJAMA HQ", icon: Cpu,
    items: [
      { href: "/admin/hq",                label: "Vue d'ensemble",  icon: LayoutDashboard, exact: true },
      { href: "/admin/hq/employes",       label: "Employés",        icon: UserCog      },
      { href: "/admin/hq/departements",   label: "Départements",    icon: Building2    },
      { href: "/admin/hq/roles",          label: "Rôles",           icon: Shield       },
      { href: "/admin/hq/approbations",   label: "Approbations",    icon: ClipboardCheck },
      { href: "/admin/hq/audit",          label: "Journal interne", icon: ScrollText   },
    ],
  },
  /* ── G. Commercialisation SaaS ─────────────────────────── */
  {
    id: "commercial", label: "Commercialisation", icon: Megaphone,
    items: [
      { href: "/admin/beta",      label: "Bêta publique",  icon: FlaskConical },
      { href: "/admin/waitlist",  label: "Liste d'attente",icon: History      },
      { href: "/admin/prospects", label: "Prospects",      icon: TrendingUp   },
      { href: "/admin/campagnes", label: "Campagnes",      icon: Megaphone    },
    ],
  },
  /* ── H. Sécurité & Paramètres ──────────────────────────── */
  {
    id: "securite", label: "Sécurité & Paramètres", icon: Settings,
    items: [
      { href: "/admin/administrateurs", label: "Administrateurs",  icon: UserCog     },
      { href: "/admin/sessions",       label: "Sessions actives", icon: Lock        },
      { href: "/admin/securite",       label: "Journal d'audit",  icon: ShieldCheck },
      { href: "/admin/emails",         label: "Emails système",   icon: Send        },
      { href: "/admin/settings",       label: "Identité SaaS",    icon: Building2   },
      { href: "/admin/parametres",     label: "Paramètres",       icon: Settings    },
      { href: "/admin/permissions",    label: "Permissions",      icon: Lock        },
    ],
  },
  /* ── Site vitrine (hors périmètre SaaS — masqué par défaut) */
  {
    id: "vitrine", label: "Site vitrine", icon: Globe,
    items: [
      { href: "/admin/blog",         label: "Blog",          icon: FileText    },
      { href: "/admin/contenu",      label: "Contenu site",  icon: Globe       },
      { href: "/admin/services",     label: "Services",      icon: Briefcase   },
      { href: "/admin/partenaires",  label: "Partenaires",   icon: Building2   },
      { href: "/admin/realisations", label: "Réalisations",  icon: DollarSign  },
      { href: "/admin/temoignages",  label: "Témoignages",   icon: MessageSquare },
      { href: "/admin/reservations", label: "Réservations",  icon: ClipboardCheck },
      { href: "/admin/coaching-ia",  label: "Coaching IA",   icon: Brain       },
    ],
  },
];

/* Groupes repliés par défaut */
const DEFAULT_COLLAPSED: Record<string, boolean> = {
  revenus:      true,
  applications: true,
  commercial:   true,
  vitrine:      true,  /* hors périmètre SaaS — masqué par défaut */
};

/* ─────────────────────────────────────────────────────────────
   NAV LINK
───────────────────────────────────────────────────────────── */
function NavLink({
  item,
  pathname,
  compact,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  compact: boolean;
  onClick?: () => void;
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      className="group relative flex items-center rounded-lg transition-all duration-100"
      style={{
        gap: compact ? 0 : "10px",
        padding: compact ? "7px" : "5px 10px 5px 10px",
        justifyContent: compact ? "center" : undefined,
        background: active ? `rgba(${V.goldR},0.09)` : "transparent",
        color: active ? V.text : V.textMuted,
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = V.surface;
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Indicateur actif */}
      {active && !compact && (
        <span
          className="absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ background: V.gold }}
        />
      )}

      <Icon
        size={14}
        strokeWidth={active ? 2.2 : 1.8}
        style={{ color: active ? V.gold : "inherit", flexShrink: 0 }}
      />

      {!compact && (
        <span className="flex-1 truncate text-[0.8125rem] font-medium">{item.label}</span>
      )}

      {!compact && item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}

      {compact && item.badge !== undefined && item.badge > 0 && (
        <span
          className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 text-[0.5rem] font-bold text-white"
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAV SECTION (groupe repliable)
───────────────────────────────────────────────────────────── */
function NavSection({
  group, pathname, compact, collapsed, onToggle, onNavClick, searchQuery,
}: {
  group: NavGroup;
  pathname: string;
  compact: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavClick: () => void;
  searchQuery: string;
}) {
  const GIcon = group.icon;
  const hasActive = group.items.some(item =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const filteredItems = searchQuery
    ? group.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : group.items;

  if (searchQuery && filteredItems.length === 0) return null;

  if (compact) {
    /* Mode compact : juste les icônes, sans titre de groupe */
    return (
      <div className="flex flex-col items-center gap-px py-1">
        <div className="mb-1 h-px w-8" style={{ background: V.border }} />
        {group.items.map(item => (
          <NavLink key={item.href} item={item} pathname={pathname} compact onClick={onNavClick} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100"
        style={{ color: hasActive ? V.textSub : V.textFaint }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = V.textMuted}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = hasActive ? V.textSub : V.textFaint}
      >
        <GIcon size={10} strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <span className="flex-1 truncate text-left text-[0.67rem] font-bold uppercase tracking-[0.11em]">
          {group.label}
        </span>
        <ChevronDown
          size={9}
          strokeWidth={2.5}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
        />
      </button>

      {!collapsed && (
        <div className="mt-0.5 space-y-px pl-1">
          {filteredItems.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} compact={false} onClick={onNavClick} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LAYOUT PRINCIPAL
───────────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [compact,        setCompact]        = useState(false);
  const [search,         setSearch]         = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [theme,          setTheme]          = useState<"dark" | "light">("dark");
  const searchRef = useRef<HTMLInputElement>(null);

  /* Sections repliées — {} sur SSR (évite hydration mismatch), localStorage après mount */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("djama_admin_collapsed");
      setCollapsed(stored ? JSON.parse(stored) : DEFAULT_COLLAPSED);
    } catch {
      setCollapsed(DEFAULT_COLLAPSED);
    }
  }, []);

  /* Compact (localStorage) */
  useEffect(() => {
    try {
      const v = localStorage.getItem("djama_admin_compact");
      if (v !== null) setCompact(v === "1");
    } catch { /* */ }
  }, []);

  /* Thème clair/sombre (localStorage) */
  useEffect(() => {
    try {
      const t = localStorage.getItem("djama_admin_theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch { /* */ }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("djama_admin_theme", next); } catch { /* */ }
      return next;
    });
  };

  const toggleCompact = () => {
    setCompact(prev => {
      const next = !prev;
      try { localStorage.setItem("djama_admin_compact", next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  };

  /* Persistance collapsed */
  useEffect(() => {
    try { localStorage.setItem("djama_admin_collapsed", JSON.stringify(collapsed)); } catch { /* */ }
  }, [collapsed]);

  /* Badge messages */
  useEffect(() => {
    fetch("/api/admin/messages", { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data))
          setUnreadMessages((data as { status?: string }[]).filter(m => m.status === "nouveau").length);
      })
      .catch(() => {});
  }, [pathname]);

  /* Fermer mobile sur navigation */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Raccourci clavier Cmd/Ctrl+K → focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!compact) {
          setMobileOpen(true);
          setTimeout(() => searchRef.current?.focus(), 100);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [compact]);

  /* Badge sur "Messages" — useMemo AVANT tout return conditionnel */
  const navGroups = useMemo(() =>
    NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(item =>
        item.href === "/admin/messages" ? { ...item, badge: unreadMessages } : item
      ),
    })),
    [unreadMessages]
  );

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  const toggleSection = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  /* Breadcrumb : Admin / Groupe / Page */
  const allItems = navGroups.flatMap(g => g.items);
  const activeItem = allItems.find(n =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href)
  );
  const activeGroup = navGroups.find(g => g.items.some(n =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href)
  ));

  /* ── Sidebar ───────────────────────────────────────────────── */
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside
      className="flex h-full flex-col"
      style={{
        width: compact && !isMobile ? `${V.sidebarCompactW}px` : `${V.sidebarW}px`,
        background: V.sidebar,
        borderRight: `1px solid ${V.border}`,
        transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* En-tête logo */}
      <div
        className="flex h-[60px] shrink-0 items-center px-3"
        style={{ borderBottom: `1px solid ${V.border}` }}
      >
        <Link
          href="/admin"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: V.goldDim, border: `1px solid ${V.goldBorder}` }}
          >
            <span className="text-[0.7rem] font-black" style={{ color: V.gold }}>D</span>
          </div>
          {(!compact || isMobile) && (
            <div className="min-w-0 leading-none">
              <p className="truncate text-[0.875rem] font-black tracking-tight" style={{ color: V.text }}>DJAMA</p>
              <p className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-[0.2em]" style={{ color: V.gold }}>
                Console Admin
              </p>
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="shrink-0 p-1 transition"
            style={{ color: V.textFaint }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = V.textMuted}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = V.textFaint}
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={toggleCompact}
            className="shrink-0 rounded-md p-1 transition"
            style={{ color: V.textFaint }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = V.textSub}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = V.textFaint}
            title={compact ? "Développer la sidebar" : "Réduire la sidebar"}
          >
            {compact ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
          </button>
        )}
      </div>

      {/* Recherche (masquée en compact) */}
      {(!compact || isMobile) && (
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${V.border}` }}>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: V.surface, border: `1px solid ${V.border}` }}
          >
            <Search size={11} className="shrink-0" style={{ color: V.textFaint }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="min-w-0 flex-1 bg-transparent text-[0.78rem] outline-none"
              style={{ color: V.textSub, caretColor: V.gold }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: V.textFaint }}>
                <X size={10} />
              </button>
            )}
            {!search && (
              <kbd className="hidden sm:block rounded px-1 text-[0.55rem] font-mono" style={{ background: V.border, color: V.textFaint }}>
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3"
        style={{ scrollbarWidth: "none", padding: compact && !isMobile ? "12px 8px" : "12px 8px" }}
      >
        {compact && !isMobile ? (
          /* Mode compact : icônes centrées */
          <div className="flex flex-col items-center gap-px">
            {navGroups.map(g => (
              <SidebarCompactGroup key={g.id} group={g} pathname={pathname} onNavClick={() => setMobileOpen(false)} />
            ))}
          </div>
        ) : (
          /* Mode développé : groupes avec labels */
          <div className="space-y-3">
            {navGroups.map(group => (
              <NavSection
                key={group.id}
                group={group}
                pathname={pathname}
                compact={false}
                collapsed={!!collapsed[group.id]}
                onToggle={() => toggleSection(group.id)}
                onNavClick={() => setMobileOpen(false)}
                searchQuery={search}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${V.border}` }}>
        {!compact || isMobile ? (
          <>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium transition"
              style={{ color: V.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = V.textMuted}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = V.textFaint}
            >
              <LayoutGrid size={12} style={{ flexShrink: 0 }} />
              <span>Voir le site</span>
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium transition"
              style={{ color: V.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = V.textMuted}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = V.textFaint}
            >
              <LogOut size={12} style={{ flexShrink: 0 }} />
              <span>Déconnexion</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Link href="/" target="_blank" title="Voir le site" className="flex h-8 w-8 items-center justify-center rounded-lg transition" style={{ color: V.textFaint }}>
              <LayoutGrid size={13} />
            </Link>
            <button onClick={logout} title="Déconnexion" className="flex h-8 w-8 items-center justify-center rounded-lg transition" style={{ color: V.textFaint }}>
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div
      data-hq-theme={theme}
      className="flex h-screen overflow-hidden"
      style={{ background: V.bg, fontFamily: "inherit" }}
    >
      <HQThemeStyle theme={theme} />
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div
        className="hidden shrink-0 md:flex"
        style={{
          width: compact ? `${V.sidebarCompactW}px` : `${V.sidebarW}px`,
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <SidebarContent />
      </div>

      {/* Sidebar mobile (drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: `${V.sidebarW}px` }}
      >
        <SidebarContent isMobile />
      </div>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header
          className="flex h-[60px] shrink-0 items-center gap-3 px-4 md:px-5"
          style={{ background: V.sidebar, borderBottom: `1px solid ${V.border}` }}
        >
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-1.5 transition md:hidden"
            style={{ color: V.textMuted }}
          >
            <Menu size={17} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="text-[0.73rem]" style={{ color: V.textFaint }}>Admin</span>
            {activeGroup && (
              <>
                <span className="text-[0.68rem]" style={{ color: V.textFaint }}>/</span>
                <span className="hidden text-[0.73rem] sm:block" style={{ color: V.textFaint }}>
                  {activeGroup.label}
                </span>
                <span className="hidden text-[0.68rem] sm:block" style={{ color: V.textFaint }}>/</span>
              </>
            )}
            {activeItem && (
              <span className="truncate text-[0.78rem] font-semibold" style={{ color: V.textSub }}>
                {activeItem.label}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Toggle thème */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: V.textMuted }}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = V.surface}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Bell */}
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: V.textMuted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = V.surface}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <Bell size={15} />
              {unreadMessages > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* Profil */}
            <div
              className="flex h-8 items-center gap-2 rounded-lg px-2.5"
              style={{ background: V.surface, border: `1px solid ${V.border}` }}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-black"
                style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}
              >
                A
              </div>
              <span className="hidden text-[0.73rem] font-medium sm:block" style={{ color: V.textSub }}>
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Contenu de page */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "24px 20px", scrollbarWidth: "thin", scrollbarColor: `${V.border} transparent` }}
        >
          <style>{`
            @media (min-width: 768px) { main { padding: 32px 36px; } }
            @keyframes hq-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
            main > * { animation: hq-fadein 180ms ease both; }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPACT GROUP — icônes centrées avec séparateur
───────────────────────────────────────────────────────────── */
function SidebarCompactGroup({
  group,
  pathname,
  onNavClick,
}: {
  group: NavGroup;
  pathname: string;
  onNavClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-px">
      <div className="my-1.5 h-px w-8" style={{ background: V.border }} />
      {group.items.map(item => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            title={item.label}
            aria-label={item.label}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-100"
            style={{
              background: active ? `rgba(${V.goldR},0.12)` : "transparent",
              color:      active ? V.gold : V.textMuted,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = V.surfaceHov; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 text-[0.5rem] font-bold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
