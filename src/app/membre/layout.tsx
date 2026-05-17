"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, CheckSquare, User, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const GOLD = "#c9a55a";

const NAV = [
  { href: "/membre/dashboard", label: "Accueil",   icon: LayoutDashboard },
  { href: "/membre/chat",      label: "Chat",       icon: MessageSquare   },
  { href: "/membre/taches",    label: "Mes tâches", icon: CheckSquare     },
  { href: "/membre/profil",    label: "Mon profil", icon: User            },
];

export default function MembreLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking]   = useState(true);
  const [memberName, setMemberName] = useState("");
  const [sideOpen, setSideOpen]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.user_metadata?.role !== "member") {
        router.replace("/membre/login");
      } else {
        setMemberName(user.user_metadata?.name ?? user.email ?? "Membre");
        setChecking(false);
      }
    });
  }, [router]);

  if (pathname === "/membre/login") return <>{children}</>;
  if (checking) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
      </div>
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/membre/login");
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.06]"
        style={{ background: "linear-gradient(180deg,#0b101c,#080c16)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <Image src="/logo.png" alt="DJAMA" width={18} height={18} style={{ filter: "brightness(0) invert(1)" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white tracking-wide">DJAMA</p>
            <p className="text-[10px] text-white/30">Espace Équipe</p>
          </div>
        </div>

        {/* Membre info */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-2xl" style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.12)" }}>
          <p className="text-[10px] text-[#c9a55a] font-bold uppercase tracking-widest mb-0.5">Membre</p>
          <p className="text-sm font-semibold text-white truncate">{memberName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? `rgba(201,165,90,0.1)` : "transparent",
                  color: active ? GOLD : "rgba(255,255,255,0.45)",
                  fontWeight: active ? 600 : 400,
                }}>
                <item.icon size={16} />
                {item.label}
                {active && <motion.div layoutId="membre-nav-indicator" className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />}
              </Link>
            );
          })}
        </nav>

        <button onClick={logout}
          className="flex items-center gap-2 px-6 py-4 text-sm text-white/30 hover:text-red-400 border-t border-white/[0.06] transition-all">
          <LogOut size={14} />Déconnexion
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
        style={{ background: "#0b101c" }}>
        <button onClick={() => setSideOpen(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Menu size={18} />
        </button>
        <span className="text-sm font-bold text-white">Espace Équipe</span>
        <span className="ml-auto text-xs text-white/30 truncate max-w-[140px]">{memberName}</span>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSideOpen(false)} />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col border-r border-white/[0.06] md:hidden"
              style={{ background: "#0b101c" }}>
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
                <span className="font-bold text-sm">DJAMA Équipe</span>
                <button onClick={() => setSideOpen(false)} className="p-1 text-white/40 hover:text-white"><X size={16} /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {NAV.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                      style={{ background: active ? `rgba(201,165,90,0.1)` : "transparent", color: active ? GOLD : "rgba(255,255,255,0.45)" }}>
                      <item.icon size={16} />{item.label}
                    </Link>
                  );
                })}
              </nav>
              <button onClick={logout} className="flex items-center gap-2 px-5 py-4 text-sm text-white/30 hover:text-red-400 border-t border-white/[0.06] transition-all">
                <LogOut size={14} />Déconnexion
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 pt-[52px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
