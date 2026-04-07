"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Shield, FileText,
  Calendar, Briefcase, Star, Edit3, Settings, LogOut,
  Menu, X, ChevronRight, MessageSquare, Award, Receipt, Building2,
} from "lucide-react";

const NAV = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/clients",      label: "Clients",      icon: Users },
  { href: "/admin/paiements",    label: "Paiements",    icon: CreditCard },
  { href: "/admin/acces",        label: "Accès",        icon: Shield },
  { href: "/admin/devis",        label: "Devis",        icon: FileText },
  { href: "/admin/factures",     label: "Factures",     icon: Receipt },
  { href: "/admin/reservations", label: "Réservations", icon: Calendar },
  { href: "/admin/services",     label: "Services",     icon: Briefcase },
  { href: "/admin/realisations", label: "Réalisations", icon: Star },
  { href: "/admin/messages",     label: "Messages",     icon: MessageSquare },
  { href: "/admin/partenaires",  label: "Partenaires",  icon: Award },
  { href: "/admin/contenu",      label: "Contenu",      icon: Edit3 },
  { href: "/admin/settings",     label: "Identité",     icon: Building2 },
  { href: "/admin/parametres",   label: "Paramètres",   icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open,    setOpen]    = useState(false);
  const [authed,  setAuthed]  = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setAuthed(true); return; }
    const ok = typeof window !== "undefined" && localStorage.getItem("djama_admin") === "ok";
    if (!ok) router.replace("/admin/login");
    else setAuthed(true);
  }, [pathname, router]);

  if (!authed) return null;
  if (pathname === "/admin/login") return <>{children}</>;

  const logout = () => {
    localStorage.removeItem("djama_admin");
    router.replace("/admin/login");
  };

  const activeLabel = NAV.find(n =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  )?.label ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-white">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[230px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0f0f12] transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-[1.1rem]">
          <div>
            <p className="text-[0.95rem] font-black tracking-tight text-white">DJAMA</p>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a]">Admin</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/30 hover:text-white/60 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-2.5 rounded-xl px-3 py-[0.6rem] text-[0.82rem] font-medium transition-all duration-150 ${
                    active
                      ? "bg-[rgba(201,165,90,0.11)] text-[#c9a55a]"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/75"
                  }`}
                >
                  <Icon
                    size={14}
                    className={active ? "text-[#c9a55a]" : "text-white/28 group-hover:text-white/55 transition-colors"}
                  />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight size={11} className="opacity-60" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-[0.6rem] text-[0.82rem] font-medium text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#0f0f12] px-6 py-[0.9rem]">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-white/35 hover:text-white/65 transition-colors"
          >
            <Menu size={19} />
          </button>
          <div className="flex-1">
            <p className="text-[0.78rem] text-white/30">{activeLabel}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(201,165,90,0.16)] text-[0.6rem] font-black text-[#c9a55a]">
              A
            </div>
            <span className="text-[0.78rem] text-white/45">Admin DJAMA</span>
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
