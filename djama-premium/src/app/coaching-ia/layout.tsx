"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Lock, BookOpen, Bot, Calendar, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireCoachingIA } from "@/lib/use-require-coaching-ia";

const NAV = [
  { href: "/coaching-ia/espace",             label: "Tableau de bord",  icon: LayoutDashboard },
  { href: "/coaching-ia/espace#cours",       label: "Mes cours",        icon: BookOpen },
  { href: "/coaching-ia/espace#assistant",   label: "Assistant IA",     icon: Bot },
  { href: "/coaching-ia/espace#reserver",    label: "Réserver",         icon: Calendar },
];

export default function CoachingIALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, user } = useRequireCoachingIA();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#07080e]">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-white/40">Vérification de l&apos;accès…</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.65rem] text-white/20">
            <Lock size={9} /> Espace Coaching IA DJAMA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07080e]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#07080e]/95 px-4 backdrop-blur-xl">
        {/* Logo + badge */}
        <Link href="/coaching-ia/espace" className="group mr-4 flex items-center gap-2">
          <span className="text-base font-bold tracking-widest text-[#a78bfa] transition-opacity group-hover:opacity-80">
            DJAMA
          </span>
          <span className="rounded border border-[rgba(167,139,250,0.3)] px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-[#a78bfa]/70">
            Coaching IA
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.includes("#") && pathname === href.split("#")[0]);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + déconnexion */}
        <div className="ml-auto flex items-center gap-3">
          {user?.name && (
            <span className="hidden text-xs text-white/25 sm:block">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
            title="Se déconnecter"
          >
            <LogOut size={14} />
            <span className="hidden text-xs sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
