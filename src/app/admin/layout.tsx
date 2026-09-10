"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Activity, AlertTriangle,
  Users, Building2, UserCheck, Mail,
  CreditCard, Banknote, Receipt, FileText, Tag,
  Shield, LayoutGrid, Sliders, Lock,
  Star, MessageSquare, Briefcase, Edit3, Award, Calendar,
  Brain, Camera, Film, Palette,
  Terminal, ShieldCheck, Webhook, Send, Settings, Wrench,
  LogOut, Menu, X, ChevronDown, Search, Bell,
} from "lucide-react";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const SIDE_W = 248;

/* ── Structure de navigation ──────────────────────────────── */
type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number };
type NavGroup = { id: string; label: string; icon: React.ElementType; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview", label: "Vue générale", icon: LayoutDashboard,
    items: [
      { href: "/admin",           label: "Dashboard",      icon: LayoutDashboard, exact: true },
      { href: "/admin/activite",  label: "Activité",       icon: Activity         },
      { href: "/admin/alertes",   label: "Alertes",        icon: AlertTriangle    },
    ],
  },
  {
    id: "users", label: "Utilisateurs", icon: Users,
    items: [
      { href: "/admin/clients",      label: "Utilisateurs",  icon: Users        },
      { href: "/admin/entreprises",  label: "Entreprises",   icon: Building2    },
      { href: "/admin/membres",      label: "Membres",       icon: UserCheck    },
      { href: "/admin/invitations",  label: "Invitations",   icon: Mail         },
    ],
  },
  {
    id: "finance", label: "Abonnements & finances", icon: CreditCard,
    items: [
      { href: "/admin/acces",      label: "Abonnements",  icon: Shield      },
      { href: "/admin/paiements",  label: "Paiements",    icon: CreditCard  },
      { href: "/admin/factures",   label: "Factures",     icon: Receipt     },
      { href: "/admin/virements",  label: "Virements",    icon: Banknote    },
      { href: "/admin/devis",      label: "Devis",        icon: FileText    },
      { href: "/admin/coupons",    label: "Coupons",      icon: Tag         },
    ],
  },
  {
    id: "apps", label: "Applications DJAMA", icon: LayoutGrid,
    items: [
      { href: "/admin/applications", label: "Applications",  icon: LayoutGrid  },
      { href: "/admin/plans",        label: "Plans",         icon: Sliders     },
      { href: "/admin/permissions",  label: "Permissions",   icon: Lock        },
    ],
  },
  {
    id: "content", label: "Contenu & business", icon: Edit3,
    items: [
      { href: "/admin/realisations",  label: "Réalisations",   icon: Star         },
      { href: "/admin/temoignages",   label: "Témoignages",    icon: Award        },
      { href: "/admin/partenaires",   label: "Partenaires",    icon: Building2    },
      { href: "/admin/services",      label: "Services",       icon: Briefcase    },
      { href: "/admin/contenu",       label: "Contenu du site",icon: Edit3        },
      { href: "/admin/messages",      label: "Messages",       icon: MessageSquare},
      { href: "/admin/reservations",  label: "Réservations",   icon: Calendar     },
    ],
  },
  {
    id: "creative", label: "Services créatifs", icon: Brain,
    items: [
      { href: "/admin/coaching-ia",    label: "Coaching IA",    icon: Brain   },
      { href: "/admin/retouche-photo", label: "Retouche photo", icon: Camera  },
      { href: "/admin/montage-video",  label: "Montage vidéo",  icon: Film    },
      { href: "/admin/visuels",        label: "Visuels",        icon: Palette },
    ],
  },
  {
    id: "system", label: "Système", icon: Settings,
    items: [
      { href: "/admin/logs",        label: "Logs d'audit",  icon: Terminal   },
      { href: "/admin/securite",    label: "Sécurité",      icon: ShieldCheck},
      { href: "/admin/webhooks",    label: "Webhooks",      icon: Webhook    },
      { href: "/admin/emails",      label: "Emails",        icon: Send       },
      { href: "/admin/settings",    label: "Identité",      icon: Building2  },
      { href: "/admin/parametres",  label: "Paramètres",    icon: Settings   },
      { href: "/admin/maintenance", label: "Maintenance",   icon: Wrench     },
    ],
  },
];

/* ── Item de navigation ───────────────────────────────────── */
function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[5px] text-[0.79rem] font-medium transition-all duration-100 ${
        active
          ? "text-white"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
      }`}
      style={active ? { background: `rgba(${GOLDR},0.10)` } : {}}
    >
      {/* Indicateur actif */}
      <span
        className="absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r-full transition-opacity duration-150"
        style={{ background: GOLD, opacity: active ? 1 : 0 }}
      />
      <Icon
        size={13}
        strokeWidth={active ? 2.2 : 1.8}
        style={{ color: active ? GOLD : undefined, flexShrink: 0 }}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[0.58rem] font-bold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

/* ── Section repliable ────────────────────────────────────── */
function NavSection({
  group, pathname, collapsed, onToggle, onNavClick, searchQuery,
}: {
  group: NavGroup;
  pathname: string;
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

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-100 rounded-lg ${
          hasActive ? "text-white/60" : "text-white/22 hover:text-white/40"
        }`}
      >
        <GIcon size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span className="flex-1 text-left truncate">{group.label}</span>
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
            <NavLink key={item.href} item={item} pathname={pathname} onClick={onNavClick} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Layout principal ─────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Sections repliées (persistées en localStorage)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("djama_admin_collapsed") ?? "{}");
    } catch { return {}; }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("djama_admin_collapsed", JSON.stringify(collapsed));
    }
  }, [collapsed]);

  // Fermer mobile sur navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  const toggleSection = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  // Label de la page courante
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(n =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href)
  );
  const activeLabel = activeItem?.label ?? "Admin";

  const BORDER = "rgba(255,255,255,0.07)";
  const SIDEBAR_BG = "#0f1117";
  const PAGE_BG    = "#090b10";
  const TOPBAR_BG  = "#0f1117";

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside
      className={`flex flex-col h-full`}
      style={{
        width: `${SIDE_W}px`,
        background: SIDEBAR_BG,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[56px] shrink-0 items-center justify-between px-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <Link href="/admin" className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `rgba(${GOLDR},0.10)`, border: `1px solid rgba(${GOLDR},0.20)` }}
          >
            <span className="text-[0.68rem] font-black" style={{ color: GOLD }}>D</span>
          </div>
          <div className="leading-none">
            <p className="text-[0.875rem] font-black text-white tracking-tight">DJAMA</p>
            <p className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Console Admin
            </p>
          </div>
        </Link>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1 text-white/30 hover:text-white/60">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={11} className="shrink-0 text-white/25" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="min-w-0 flex-1 bg-transparent text-[0.76rem] text-white/70 outline-none placeholder:text-white/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/25 hover:text-white/50">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-3 space-y-3"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_GROUPS.map(group => (
          <NavSection
            key={group.id}
            group={group}
            pathname={pathname}
            collapsed={!!collapsed[group.id]}
            onToggle={() => toggleSection(group.id)}
            onNavClick={() => setMobileOpen(false)}
            searchQuery={search}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.76rem] font-medium text-white/25 transition hover:bg-white/[0.04] hover:text-white/50"
        >
          <LayoutGrid size={12} />
          <span>Voir le site</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.76rem] font-medium text-white/25 transition hover:bg-white/[0.04] hover:text-white/50"
        >
          <LogOut size={12} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: PAGE_BG, fontFamily: "inherit" }}
    >
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex shrink-0" style={{ width: `${SIDE_W}px` }}>
        <Sidebar />
      </div>

      {/* Sidebar mobile (slide-in) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: `${SIDE_W}px` }}
      >
        <Sidebar isMobile />
      </div>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex h-[56px] shrink-0 items-center gap-3 px-4 lg:px-6"
          style={{ background: TOPBAR_BG, borderBottom: `1px solid ${BORDER}` }}
        >
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 text-white/30 transition hover:text-white/70 lg:hidden"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb / titre page */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-white/22 text-[0.72rem]">
              <span>Admin</span>
              <span>/</span>
              <span className="text-white/70 font-semibold">{activeLabel}</span>
            </div>
          </div>

          {/* Actions topbar */}
          <div className="flex items-center gap-2">
            {/* Notif */}
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.05] hover:text-white/60">
              <Bell size={15} />
            </button>

            {/* Avatar admin */}
            <div
              className="flex h-8 items-center gap-2.5 rounded-lg px-2.5"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-black"
                style={{ background: `rgba(${GOLDR},0.18)`, color: GOLD }}
              >
                A
              </div>
              <span className="hidden text-[0.72rem] font-medium text-white/45 sm:block">
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
