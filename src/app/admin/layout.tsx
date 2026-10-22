"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Activity, AlertTriangle, TrendingUp,
  Users, Building2, UserCheck, Mail,
  Cpu, UserCog, Shield, CreditCard, Sliders, ClipboardCheck, ScrollText,
  Briefcase, MessageSquare, Terminal, LayoutGrid, Banknote,
  Receipt, FileText, Tag, Lock, FlaskConical,
  Edit3, HeadphonesIcon, Star, Award, Globe, Calendar,
  Brain, Camera, Film, Palette,
  ShieldCheck, Webhook, Send, Settings, Wrench,
  LogOut, Menu, X, ChevronDown, Search, Bell,
  ChevronsLeft, ChevronsRight, BarChart3,
} from "lucide-react";
import { HQ } from "@/components/hq";

/* ─────────────────────────────────────────────────────────────
   NAVIGATION — 8 groupes organisés
───────────────────────────────────────────────────────────── */
type NavItem  = { href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number };
type NavGroup = { id: string; label: string; icon: React.ElementType; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: "direction", label: "Direction", icon: BarChart3,
    items: [
      { href: "/admin",             label: "Dashboard",      icon: LayoutDashboard, exact: true },
      { href: "/admin/hq/direction",label: "Direction HQ",   icon: TrendingUp       },
      { href: "/admin/activite",    label: "Activité",       icon: Activity         },
      { href: "/admin/alertes",     label: "Alertes",        icon: AlertTriangle    },
    ],
  },
  {
    id: "clients", label: "Clients & Entreprises", icon: Users,
    items: [
      { href: "/admin/clients",      label: "Utilisateurs",  icon: Users       },
      { href: "/admin/entreprises",  label: "Entreprises",   icon: Building2   },
      { href: "/admin/membres",      label: "Membres",       icon: UserCheck   },
      { href: "/admin/invitations",  label: "Invitations",   icon: Mail        },
    ],
  },
  {
    id: "hq", label: "DJAMA HQ", icon: Cpu,
    items: [
      { href: "/admin/hq",                label: "Vue d'ensemble",  icon: LayoutDashboard, exact: true },
      { href: "/admin/hq/employes",       label: "Employés",        icon: UserCog      },
      { href: "/admin/hq/departements",   label: "Départements",    icon: Building2    },
      { href: "/admin/hq/roles",          label: "Rôles",           icon: Shield       },
      { href: "/admin/hq/approbations",   label: "Approbations",    icon: ClipboardCheck },
      { href: "/admin/hq/clients",        label: "Clients HQ",      icon: Users        },
      { href: "/admin/hq/revenus",        label: "Revenus",         icon: CreditCard   },
      { href: "/admin/hq/feature-flags",  label: "Feature Flags",   icon: Sliders      },
    ],
  },
  {
    id: "espaces", label: "Espaces professionnels", icon: Briefcase,
    items: [
      { href: "/admin/hq/commercial",   label: "Commercial",   icon: TrendingUp      },
      { href: "/admin/hq/support",      label: "Support HQ",   icon: MessageSquare   },
      { href: "/admin/hq/informatique", label: "Informatique", icon: Terminal        },
      { href: "/admin/hq/marketing",    label: "Marketing",    icon: LayoutGrid      },
      { href: "/admin/hq/finance",      label: "Finance",      icon: Banknote        },
      { href: "/admin/hq/rh",           label: "RH",           icon: UserCheck       },
    ],
  },
  {
    id: "plateforme", label: "Plateforme", icon: LayoutGrid,
    items: [
      { href: "/admin/applications", label: "Applications",  icon: LayoutGrid   },
      { href: "/admin/acces",        label: "Abonnements",   icon: Shield       },
      { href: "/admin/paiements",    label: "Paiements",     icon: CreditCard   },
      { href: "/admin/factures",     label: "Factures",      icon: Receipt      },
      { href: "/admin/virements",    label: "Virements",     icon: Banknote     },
      { href: "/admin/devis",        label: "Devis",         icon: FileText     },
      { href: "/admin/coupons",      label: "Coupons",       icon: Tag          },
      { href: "/admin/plans",        label: "Plans",         icon: Sliders      },
      { href: "/admin/permissions",  label: "Permissions",   icon: Lock         },
      { href: "/admin/beta",         label: "Bêta publique", icon: FlaskConical },
    ],
  },
  {
    id: "contenu", label: "Contenu & Support", icon: Edit3,
    items: [
      { href: "/admin/messages",     label: "Messages",      icon: MessageSquare   },
      { href: "/admin/support",      label: "Support",       icon: HeadphonesIcon  },
      { href: "/admin/blog",         label: "Blog",          icon: Edit3           },
      { href: "/admin/services",     label: "Services",      icon: Briefcase       },
      { href: "/admin/partenaires",  label: "Partenaires",   icon: Building2       },
      { href: "/admin/realisations", label: "Réalisations",  icon: Star            },
      { href: "/admin/temoignages",  label: "Témoignages",   icon: Award           },
      { href: "/admin/contenu",      label: "Contenu site",  icon: Globe           },
      { href: "/admin/reservations", label: "Réservations",  icon: Calendar        },
    ],
  },
  {
    id: "creativite", label: "Services créatifs", icon: Brain,
    items: [
      { href: "/admin/coaching-ia",    label: "Coaching IA",    icon: Brain   },
      { href: "/admin/retouche-photo", label: "Retouche photo", icon: Camera  },
      { href: "/admin/montage-video",  label: "Montage vidéo",  icon: Film    },
      { href: "/admin/visuels",        label: "Visuels",        icon: Palette },
    ],
  },
  {
    id: "systeme", label: "Sécurité & Système", icon: Settings,
    items: [
      { href: "/admin/hq/audit",   label: "Journal d'audit", icon: ScrollText  },
      { href: "/admin/securite",   label: "Sécurité",        icon: ShieldCheck },
      { href: "/admin/webhooks",   label: "Webhooks",        icon: Webhook     },
      { href: "/admin/emails",     label: "Emails",          icon: Send        },
      { href: "/admin/settings",   label: "Identité",        icon: Building2   },
      { href: "/admin/parametres", label: "Paramètres",      icon: Settings    },
      { href: "/admin/maintenance",label: "Maintenance",     icon: Wrench      },
    ],
  },
];

/* Groupes repliés par défaut (peu fréquents) */
const DEFAULT_COLLAPSED: Record<string, boolean> = {
  plateforme: true,
  contenu:    true,
  creativite: true,
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
        background: active ? `rgba(${HQ.goldR},0.09)` : "transparent",
        color: active ? HQ.text : HQ.textMuted,
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Indicateur actif */}
      {active && !compact && (
        <span
          className="absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ background: HQ.gold }}
        />
      )}

      <Icon
        size={14}
        strokeWidth={active ? 2.2 : 1.8}
        style={{ color: active ? HQ.gold : "inherit", flexShrink: 0 }}
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
        <div className="mb-1 h-px w-8" style={{ background: HQ.border }} />
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
        style={{ color: hasActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = hasActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)"}
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

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  const toggleSection = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  /* Badge sur "Messages" */
  const navGroups = useMemo(() =>
    NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.map(item =>
        item.href === "/admin/messages" ? { ...item, badge: unreadMessages } : item
      ),
    })),
    [unreadMessages]
  );

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
        width: compact && !isMobile ? `${HQ.sidebarCompactW}px` : `${HQ.sidebarW}px`,
        background: HQ.sidebar,
        borderRight: `1px solid ${HQ.border}`,
        transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* En-tête logo */}
      <div
        className="flex h-[60px] shrink-0 items-center px-3"
        style={{ borderBottom: `1px solid ${HQ.border}` }}
      >
        <Link
          href="/admin"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: HQ.goldDim, border: `1px solid ${HQ.goldBorder}` }}
          >
            <span className="text-[0.7rem] font-black" style={{ color: HQ.gold }}>D</span>
          </div>
          {(!compact || isMobile) && (
            <div className="min-w-0 leading-none">
              <p className="truncate text-[0.875rem] font-black tracking-tight text-white">DJAMA</p>
              <p className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-[0.2em]" style={{ color: HQ.gold }}>
                Console Admin
              </p>
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="shrink-0 p-1 text-white/25 transition hover:text-white/60"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={toggleCompact}
            className="shrink-0 rounded-md p-1 text-white/20 transition hover:text-white/50"
            title={compact ? "Développer la sidebar" : "Réduire la sidebar"}
          >
            {compact ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
          </button>
        )}
      </div>

      {/* Recherche (masquée en compact) */}
      {(!compact || isMobile) && (
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${HQ.border}` }}>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${HQ.border}` }}
          >
            <Search size={11} className="shrink-0" style={{ color: HQ.textFaint }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="min-w-0 flex-1 bg-transparent text-[0.78rem] outline-none"
              style={{ color: "rgba(255,255,255,0.70)", caretColor: HQ.gold }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: HQ.textFaint }}>
                <X size={10} />
              </button>
            )}
            {!search && (
              <kbd className="hidden sm:block rounded px-1 text-[0.55rem] font-mono" style={{ background: "rgba(255,255,255,0.06)", color: HQ.textFaint }}>
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
      <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${HQ.border}` }}>
        {!compact || isMobile ? (
          <>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium transition"
              style={{ color: HQ.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = HQ.textMuted}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = HQ.textFaint}
            >
              <LayoutGrid size={12} style={{ flexShrink: 0 }} />
              <span>Voir le site</span>
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium transition"
              style={{ color: HQ.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = HQ.textMuted}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = HQ.textFaint}
            >
              <LogOut size={12} style={{ flexShrink: 0 }} />
              <span>Déconnexion</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Link href="/" target="_blank" title="Voir le site" className="flex h-8 w-8 items-center justify-center rounded-lg transition" style={{ color: HQ.textFaint }}>
              <LayoutGrid size={13} />
            </Link>
            <button onClick={logout} title="Déconnexion" className="flex h-8 w-8 items-center justify-center rounded-lg transition" style={{ color: HQ.textFaint }}>
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: HQ.bg, fontFamily: "inherit" }}
    >
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
          width: compact ? `${HQ.sidebarCompactW}px` : `${HQ.sidebarW}px`,
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <SidebarContent />
      </div>

      {/* Sidebar mobile (drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: `${HQ.sidebarW}px` }}
      >
        <SidebarContent isMobile />
      </div>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header
          className="flex h-[60px] shrink-0 items-center gap-3 px-4 md:px-5"
          style={{ background: HQ.sidebar, borderBottom: `1px solid ${HQ.border}` }}
        >
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-1.5 transition md:hidden"
            style={{ color: HQ.textMuted }}
          >
            <Menu size={17} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="text-[0.73rem]" style={{ color: HQ.textFaint }}>Admin</span>
            {activeGroup && (
              <>
                <span className="text-[0.68rem]" style={{ color: HQ.textFaint }}>/</span>
                <span className="hidden text-[0.73rem] sm:block" style={{ color: HQ.textFaint }}>
                  {activeGroup.label}
                </span>
                <span className="hidden text-[0.68rem] sm:block" style={{ color: HQ.textFaint }}>/</span>
              </>
            )}
            {activeItem && (
              <span className="truncate text-[0.78rem] font-semibold" style={{ color: HQ.textSub }}>
                {activeItem.label}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Bell */}
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: HQ.textMuted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"}
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
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${HQ.border}` }}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-black"
                style={{ background: HQ.goldDim, color: HQ.gold, border: `1px solid ${HQ.goldBorder}` }}
              >
                A
              </div>
              <span className="hidden text-[0.73rem] font-medium sm:block" style={{ color: HQ.textSub }}>
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Contenu de page */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "24px 20px", scrollbarWidth: "thin", scrollbarColor: `${HQ.border} transparent` }}
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
      <div className="my-1.5 h-px w-8" style={{ background: HQ.border }} />
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
              background: active ? `rgba(${HQ.goldR},0.12)` : "transparent",
              color:      active ? HQ.gold : HQ.textMuted,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
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
