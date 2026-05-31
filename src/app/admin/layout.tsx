"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Shield, FileText,
  Calendar, Briefcase, Star, Edit3, Settings, LogOut,
  Menu, X, ChevronRight, MessageSquare, Award, Receipt, Building2,
  BarChart3, Camera, Film, Palette, Brain, Banknote,
} from "lucide-react";

const GOLD = "#c9a55a";
const SIDEBAR_BG  = "#111318";
const PAGE_BG     = "#07090e";
const TOPBAR_BG   = "#111318";
const BORDER      = "rgba(255,255,255,0.07)";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Clients & Revenus",
    items: [
      { href: "/admin/clients",      label: "Clients",      icon: Users            },
      { href: "/admin/paiements",    label: "Paiements",    icon: CreditCard       },
      { href: "/admin/acces",        label: "Accès",        icon: Shield           },
      { href: "/admin/virements",    label: "Virements",    icon: Banknote         },
    ],
  },
  {
    label: "Documents",
    items: [
      { href: "/admin/devis",        label: "Devis",        icon: FileText         },
      { href: "/admin/factures",     label: "Factures",     icon: Receipt          },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/reservations", label: "Réservations", icon: Calendar         },
      { href: "/admin/services",     label: "Services",     icon: Briefcase        },
      { href: "/admin/messages",     label: "Messages",     icon: MessageSquare    },
    ],
  },
  {
    label: "Contenu",
    items: [
      { href: "/admin/realisations",   label: "Réalisations",   icon: Star           },
      { href: "/admin/temoignages",    label: "Témoignages",    icon: Award          },
      { href: "/admin/partenaires",    label: "Partenaires",    icon: BarChart3      },
      { href: "/admin/contenu",        label: "Contenu",        icon: Edit3          },
    ],
  },
  {
    label: "Services créatifs",
    items: [
      { href: "/admin/coaching-ia",    label: "Coaching IA",    icon: Brain          },
      { href: "/admin/retouche-photo", label: "Retouche photo", icon: Camera         },
      { href: "/admin/montage-video",  label: "Montage vidéo",  icon: Film           },
      { href: "/admin/visuels",        label: "Visuels",        icon: Palette        },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/settings",     label: "Identité",     icon: Building2        },
      { href: "/admin/parametres",   label: "Paramètres",   icon: Settings         },
    ],
  },
];

function NavItem({
  href, label, icon: Icon, exact = false, pathname, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; pathname: string; onClick?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[0.8rem] font-medium transition-colors duration-150 ${
        active ? "text-white" : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
      }`}
      style={active ? { background: `${GOLD}14` } : {}}
    >
      <span
        className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity"
        style={{ background: GOLD, opacity: active ? 1 : 0 }}
      />
      <Icon size={13} style={{ color: active ? GOLD : undefined }} strokeWidth={active ? 2.2 : 1.8} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open,   setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  const activeLabel = NAV_GROUPS.flatMap(g => g.items)
    .find(n => "exact" in n && n.exact ? pathname === n.href : pathname.startsWith(n.href))
    ?.label ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: PAGE_BG }}>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[220px] shrink-0 flex-col transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}` }}
      >
        {/* Logo */}
        <div className="flex h-[52px] shrink-0 items-center justify-between px-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}28` }}>
              <span className="text-[0.68rem] font-black" style={{ color: GOLD }}>D</span>
            </div>
            <div className="leading-none">
              <p className="text-[0.88rem] font-black text-white tracking-tight">DJAMA</p>
              <p className="mt-0.5 text-[0.52rem] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Admin</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="text-white/25 transition hover:text-white/60 lg:hidden">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="mb-1.5 px-2.5 text-[0.56rem] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.22)" }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.href}
                    {...item}
                    exact={"exact" in item ? item.exact : false}
                    pathname={pathname}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.78rem] font-medium text-white/30 transition hover:bg-white/[0.04] hover:text-white/60"
          >
            <LogOut size={13} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex h-[52px] shrink-0 items-center gap-4 px-5"
          style={{ background: TOPBAR_BG, borderBottom: `1px solid ${BORDER}` }}
        >
          <button onClick={() => setOpen(true)} className="text-white/35 transition hover:text-white/70 lg:hidden">
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[0.9rem] font-bold text-white truncate">{activeLabel}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
            <div className="flex h-5 w-5 items-center justify-center rounded-full text-[0.58rem] font-black"
              style={{ background: `${GOLD}20`, color: GOLD }}>
              A
            </div>
            <span className="hidden text-[0.75rem] text-white/45 sm:block">Admin DJAMA</span>
            <ChevronRight size={11} className="text-white/20" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
