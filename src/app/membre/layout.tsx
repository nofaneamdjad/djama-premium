"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, User, LogOut, Menu, X,
  Package, Receipt, Users, FolderOpen, BarChart2, Briefcase, BookOpen,
  CheckSquare, Calendar, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

// Mapping app_slug → icône + label + route
const APP_META: Record<string, { label: string; icon: React.ElementType; href: string }> = {
  dashboard:      { label: "Accueil",       icon: LayoutDashboard, href: "/membre/dashboard"   },
  messages:       { label: "Messages",      icon: MessageSquare,   href: "/membre/messages"     },
  documents:      { label: "Documents",     icon: FileText,        href: "/membre/documents"    },
  factures:       { label: "Factures",      icon: Receipt,         href: "/membre/factures"     },
  depenses:       { label: "Dépenses",      icon: Receipt,         href: "/membre/depenses"     },
  crm:            { label: "CRM",           icon: Users,           href: "/membre/crm"          },
  contrats:       { label: "Contrats",      icon: FileText,        href: "/membre/contrats"     },
  stocks:         { label: "Stocks",        icon: Package,         href: "/membre/stocks"       },
  projets:        { label: "Projets",       icon: FolderOpen,      href: "/membre/projets"      },
  equipe:         { label: "Équipe",        icon: Users,           href: "/membre/equipe"       },
  planning:       { label: "Planning",      icon: Calendar,        href: "/membre/planning"     },
  taches:         { label: "Tâches",        icon: CheckSquare,     href: "/membre/taches"       },
  comptabilite:   { label: "Comptabilité",  icon: BarChart2,       href: "/membre/comptabilite" },
  tresorerie:     { label: "Trésorerie",    icon: BarChart2,       href: "/membre/tresorerie"   },
  assistant:      { label: "Assistant IA",  icon: BookOpen,        href: "/membre/assistant"    },
  sourcing:       { label: "Sourcing",      icon: Briefcase,       href: "/membre/sourcing"     },
  fournisseurs:   { label: "Fournisseurs",  icon: Briefcase,       href: "/membre/fournisseurs" },
};

// Pages toujours présentes (sans permission requise)
const ALWAYS_NAV = [
  { href: "/membre/dashboard", label: "Accueil",    icon: LayoutDashboard },
  { href: "/membre/messages",  label: "Messages",   icon: MessageSquare   },
  { href: "/membre/documents", label: "Documents",  icon: FileText        },
  { href: "/membre/profil",    label: "Mon profil", icon: User            },
];

type NavItem = { href: string; label: string; icon: React.ElementType };

type OrgInfo = {
  id: string;
  name: string;
  logo_url: string | null;
  role: string;
};

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function MembreLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [checking, setChecking]     = useState(true);
  const [memberName, setMemberName] = useState("");
  const [org, setOrg]               = useState<OrgInfo | null>(null);
  const [navItems, setNavItems]     = useState<NavItem[]>(ALWAYS_NAV);
  const [sideOpen, setSideOpen]     = useState(false);
  const [unreadMsg, setUnreadMsg]   = useState(0);

  const loadPermissions = useCallback(async (userId: string, orgId: string) => {
    const { data: perms } = await supabase
      .from("organization_permissions")
      .select("app_slug")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("can_view", true);

    const permSlugs = new Set((perms ?? []).map(p => p.app_slug));
    const dynamicItems: NavItem[] = [];

    for (const slug of permSlugs) {
      const meta = APP_META[slug];
      if (meta && !ALWAYS_NAV.some(n => n.href === meta.href)) {
        dynamicItems.push({ href: meta.href, label: meta.label, icon: meta.icon });
      }
    }

    // Tri alphabétique par label pour les items dynamiques
    dynamicItems.sort((a, b) => a.label.localeCompare(b.label));

    setNavItems([...ALWAYS_NAV, ...dynamicItems]);
  }, []);

  const loadUnread = useCallback(async (orgId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("org_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_deleted", false)
      .gt("created_at",
        // Messages depuis la dernière lecture (fallback : 7 jours)
        new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
      );

    setUnreadMsg(count ?? 0);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (process.env.NODE_ENV === "development") {
          setMemberName("Aperçu Dev");
          setChecking(false);
          return;
        }
        router.replace("/membre/login?redirect=" + encodeURIComponent(pathname));
        return;
      }

      // Déterminer l'org active (depuis user_metadata ou première membership active)
      let orgId = user.user_metadata?.active_org_id as string | undefined;

      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, role, suspended_at, display_name, organizations!inner(id, name, logo_url)")
        .eq("user_id", user.id)
        .is("suspended_at", null);

      if (!memberships || memberships.length === 0) {
        if (process.env.NODE_ENV !== "development") {
          await supabase.auth.signOut();
          router.replace("/membre/login");
          return;
        }
        setMemberName(user.user_metadata?.name ?? user.email ?? "Membre");
        setChecking(false);
        return;
      }

      // Trouver l'org active ou prendre la première
      const activeMembership = memberships.find(m => m.organization_id === orgId) ?? memberships[0];
      const resolvedOrgId = activeMembership.organization_id;
      orgId = resolvedOrgId;

      const orgRaw = activeMembership.organizations;
      const orgData = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { id: string; name: string; logo_url: string | null };

      setOrg({ id: orgData.id, name: orgData.name, logo_url: orgData.logo_url, role: activeMembership.role });
      setMemberName(
        (activeMembership.display_name as string | null) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "Membre"
      );

      // Mettre à jour last_seen_at silencieusement
      supabase.rpc("update_member_last_seen", { p_org_id: resolvedOrgId }).then(() => {});

      await loadPermissions(user.id, resolvedOrgId);
      await loadUnread(resolvedOrgId);

      setChecking(false);
    }

    init();
  }, [router, pathname, loadPermissions, loadUnread]);

  if (pathname === "/membre/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
      </div>
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/membre/login");
  }

  function NavItems({ onClick }: { onClick?: () => void }) {
    return (
      <>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const isMsg  = item.href === "/membre/messages";
          return (
            <Link key={item.href} href={item.href} onClick={onClick}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background:  active ? `rgba(201,165,90,0.1)` : "transparent",
                color:       active ? GOLD : "rgba(255,255,255,0.5)",
                fontWeight:  active ? 600 : 400,
              }}
            >
              <item.icon size={16} />
              {item.label}
              {isMsg && !active && unreadMsg > 0 && <Badge count={unreadMsg} />}
              {active && (
                <motion.div layoutId="membre-nav-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: GOLD }}
                />
              )}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#080c16", color: "#fff" }}>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.06]"
        style={{ background: "linear-gradient(180deg,#0b101c,#080c16)" }}>

        {/* Logo org */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(201,165,90,0.1)" }}>
            {org?.logo_url
              ? <img src={org.logo_url} alt="" className="h-8 w-8 object-cover" />
              : <Image src="/logo-white.png" alt="DJAMA" width={20} height={20} className="object-contain" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white tracking-wide truncate">{org?.name ?? "DJAMA"}</p>
            <p className="text-[10px] text-white/30 capitalize">{org?.role ?? "membre"}</p>
          </div>
        </div>

        {/* Membre info */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-2xl"
          style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.12)" }}>
          <p className="text-[10px] text-[#c9a55a] font-bold uppercase tracking-widest mb-0.5">Connecté</p>
          <p className="text-sm font-semibold text-white truncate">{memberName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItems />
          {/* Paramètres profil tout en bas */}
          <Link href="/membre/profil"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm mt-2 transition-all"
            style={{
              color: pathname.startsWith("/membre/profil") ? GOLD : "rgba(255,255,255,0.3)",
              background: pathname.startsWith("/membre/profil") ? "rgba(201,165,90,0.1)" : "transparent",
            }}
          >
            <Settings size={15} />Paramètres
          </Link>
        </nav>

        <button onClick={logout}
          className="flex items-center gap-2 px-6 py-4 text-sm text-white/30 hover:text-red-400 border-t border-white/[0.06] transition-all">
          <LogOut size={14} />Déconnexion
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
        style={{ background: "#0b101c" }}>
        <button onClick={() => setSideOpen(true)}
          className="relative p-1.5 rounded-lg text-white/40 hover:text-white transition-all">
          <Menu size={18} />
          {unreadMsg > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
        <span className="text-sm font-bold text-white truncate">{org?.name ?? "Espace Équipe"}</span>
        <span className="ml-auto text-xs text-white/30 truncate max-w-[130px]">{memberName}</span>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setSideOpen(false)} />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col border-r border-white/[0.06] md:hidden"
              style={{ background: "#0b101c" }}>
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
                <span className="font-bold text-sm text-white">{org?.name ?? "Espace Équipe"}</span>
                <button onClick={() => setSideOpen(false)} className="p-1 text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <NavItems onClick={() => setSideOpen(false)} />
              </nav>
              <button onClick={logout}
                className="flex items-center gap-2 px-5 py-4 text-sm text-white/30 hover:text-red-400 border-t border-white/[0.06] transition-all">
                <LogOut size={14} />Déconnexion
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 pt-[52px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
