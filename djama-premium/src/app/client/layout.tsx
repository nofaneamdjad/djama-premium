"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StickyNote, Calendar, ReceiptText, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/client/notes", label: "Bloc-notes", icon: StickyNote },
  { href: "/client/planning", label: "Planning", icon: Calendar },
  { href: "/client/factures", label: "Factures", icon: ReceiptText },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-14 border-b border-white/[0.06] bg-[#080a0f]/90 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0 sticky top-0 z-40">
        {/* Logo DJAMA compact */}
        <Link href="/client" className="flex items-center gap-2 mr-4 group">
          <span className="font-bold text-base tracking-widest text-[#c9a55a] group-hover:opacity-80 transition-opacity">
            DJAMA
          </span>
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest leading-none border border-white/10 rounded px-1.5 py-0.5">
            Pro
          </span>
        </Link>

        {/* Navigation outil */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[rgba(201,165,90,0.12)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all ml-auto"
          title="Se déconnecter"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline text-xs">Déconnexion</span>
        </button>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
