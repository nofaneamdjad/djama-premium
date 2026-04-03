"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StickyNote, Calendar, ReceiptText, LayoutDashboard, LogOut, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireSubscription } from "@/lib/use-require-subscription";

const NAV = [
  { href: "/client",          label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/client/notes",    label: "Bloc-notes", icon: StickyNote },
  { href: "/client/planning", label: "Planning",   icon: Calendar },
  { href: "/client/factures", label: "Factures",   icon: ReceiptText },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useRequireSubscription();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Loading / Vérification d'accès ── */
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#080a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
        <div className="text-center">
          <p className="text-xs font-semibold text-white/40">Vérification de l&apos;accès…</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.65rem] text-white/20">
            <Lock size={9} /> Espace sécurisé DJAMA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080a0f]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#080a0f]/90 px-4 backdrop-blur-xl">
        {/* Logo DJAMA compact */}
        <Link href="/client" className="group mr-4 flex items-center gap-2">
          <span className="text-base font-bold tracking-widest text-[#c9a55a] transition-opacity group-hover:opacity-80">
            DJAMA
          </span>
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none tracking-widest text-white/30">
            Pro
          </span>
        </Link>

        {/* Navigation outils */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.12)] text-[#c9a55a]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
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
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
          title="Se déconnecter"
        >
          <LogOut size={14} />
          <span className="hidden text-xs sm:inline">Déconnexion</span>
        </button>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
