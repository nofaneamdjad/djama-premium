"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  { href: "/admin/temoignages",  label: "Témoignages",  icon: Star },
  { href: "/admin/partenaires",  label: "Partenaires",  icon: Award },
  { href: "/admin/contenu",      label: "Contenu",      icon: Edit3 },
  { href: "/admin/settings",     label: "Identité",     icon: Building2 },
  { href: "/admin/parametres",   label: "Paramètres",   icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  const activeLabel = NAV.find(n =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
  )?.label ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-gray-900">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[230px] shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-[1.05rem]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)]">
              <span className="text-[0.7rem] font-black text-[#c9a55a]">D</span>
            </div>
            <div>
              <p className="text-[0.88rem] font-black tracking-tight text-gray-900 leading-none">DJAMA</p>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[#c9a55a] leading-none mt-0.5">Admin</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors">
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
                      ? "bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <Icon
                    size={14}
                    className={active ? "text-[#c9a55a]" : "text-gray-400 group-hover:text-gray-600 transition-colors"}
                  />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight size={11} className="opacity-60" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-[0.6rem] text-[0.82rem] font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6 py-[0.85rem] shadow-[0_1px_4px_rgba(0,0,0,.04)]">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu size={19} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[0.92rem] font-bold text-gray-800 truncate">{activeLabel}</p>
            <p className="text-[0.68rem] text-gray-400 hidden sm:block">Espace admin DJAMA</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(201,165,90,0.16)] text-[0.6rem] font-black text-[#c9a55a]">
              A
            </div>
            <span className="text-[0.78rem] text-gray-500 hidden sm:block">Admin DJAMA</span>
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
