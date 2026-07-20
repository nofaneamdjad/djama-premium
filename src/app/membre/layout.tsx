"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, CheckSquare, User, LogOut, Menu, X, CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const GOLD = "#c9a55a";

const NAV = [
  { href: "/membre/dashboard", label: "Accueil",    icon: LayoutDashboard, badge: null         },
  { href: "/membre/chat",      label: "Chat",        icon: MessageSquare,   badge: "chat"       },
  { href: "/membre/reunions",  label: "Réunions",    icon: CalendarDays,    badge: "reunions"   },
  { href: "/membre/taches",    label: "Mes tâches",  icon: CheckSquare,     badge: "taches"     },
  { href: "/membre/profil",    label: "Mon profil",  icon: User,            badge: null         },
];

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <motion.span
      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
      className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </motion.span>
  );
}

export default function MembreLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking]     = useState(true);
  const [memberName, setMemberName] = useState("");
  const [sideOpen, setSideOpen]     = useState(false);
  const [badges, setBadges]         = useState<Record<string, number>>({ chat: 0, reunions: 0, taches: 0 });
  const [teamId, setTeamId]         = useState("");
  const [memberId, setMemberId]     = useState<string | null>(null);
  const [spaceId, setSpaceId]       = useState<string | null>(null);

  const loadBadges = useCallback(async (tid: string, mid: string | null, sid: string | null) => {
    const now     = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const lastChatSeen = localStorage.getItem(`membre_last_chat_${tid}`) ?? "1970-01-01";

    const chatQ = supabase.from("team_messages").select("id", { count: "exact", head: true })
      .eq("user_id", tid).neq("channel", "annonces").gt("created_at", lastChatSeen);
    const reunQ = supabase.from("team_meetings").select("id", { count: "exact", head: true })
      .eq("user_id", tid).eq("status", "planned")
      .gte("date_at", todayStart.toISOString()).lte("date_at", todayEnd.toISOString());
    const taskQ = mid
      ? supabase.from("team_tasks").select("id", { count: "exact", head: true })
          .eq("user_id", tid).eq("assigned_to", mid).neq("status", "done")
      : supabase.from("team_tasks").select("id", { count: "exact", head: true })
          .eq("user_id", tid).neq("status", "done");

    const [chatR, reunR, tacheR] = await Promise.all([
      sid ? chatQ.eq("space_id", sid) : chatQ,
      sid ? reunQ.eq("space_id", sid) : reunQ,
      sid ? taskQ.eq("space_id", sid) : taskQ,
    ]);

    setBadges({
      chat:     chatR.count    ?? 0,
      reunions: reunR.count    ?? 0,
      taches:   tacheR.count   ?? 0,
    });
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role;
      if (!user || (role !== "member" && role !== "chef")) {
        if (process.env.NODE_ENV === "development") {
          setMemberName("Aperçu Dev");
          setChecking(false);
        } else {
          router.replace("/membre/login");
        }
      } else {
        const name = user.user_metadata?.name ?? user.email ?? "Membre";
        const tid  = user.user_metadata?.team_id ?? user.id;
        const mid  = user.user_metadata?.member_id ?? null;
        const sid  = user.user_metadata?.space_id ?? null;
        setMemberName(name);
        setTeamId(tid);
        setMemberId(mid);
        setSpaceId(sid);
        setChecking(false);
        void loadBadges(tid, mid, sid);
      }
    });
  }, [router, loadBadges]);

  /* Clear badge when navigating to the page */
  useEffect(() => {
    if (!teamId) return;
    if (pathname.startsWith("/membre/chat")) {
      localStorage.setItem(`membre_last_chat_${teamId}`, new Date().toISOString());
      setBadges(b => ({ ...b, chat: 0 }));
    }
    if (pathname.startsWith("/membre/reunions")) setBadges(b => ({ ...b, reunions: 0 }));
    if (pathname.startsWith("/membre/taches"))   setBadges(b => ({ ...b, taches: 0 }));
  }, [pathname, teamId]);

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

  const totalBadges = Object.values(badges).reduce((a, b) => a + b, 0);

  function NavItems({ onClick }: { onClick?: () => void }) {
    return (
      <>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const count  = item.badge ? (badges[item.badge] ?? 0) : 0;
          return (
            <Link key={item.href} href={item.href} onClick={onClick}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: active ? `rgba(201,165,90,0.1)` : "transparent",
                color: active ? GOLD : "rgba(255,255,255,0.45)",
                fontWeight: active ? 600 : 400,
              }}>
              <item.icon size={16} />
              {item.label}
              <AnimatePresence>
                {count > 0 && !active
                  ? <Badge key="badge" count={count} />
                  : active
                    ? <motion.div key="dot" layoutId="membre-nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                    : null
                }
              </AnimatePresence>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.06]"
        style={{ background: "linear-gradient(180deg,#0b101c,#080c16)" }}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,165,90,0.1)" }}>
            <Image src="/logo.png" alt="DJAMA" width={18} height={18} style={{ filter: "brightness(0) invert(1)" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white tracking-wide">DJAMA</p>
            <p className="text-[10px] text-white/30">Espace Équipe</p>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-4 rounded-2xl" style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.12)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#c9a55a] font-bold uppercase tracking-widest mb-0.5">Membre</p>
            {totalBadges > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {totalBadges > 9 ? "9+" : totalBadges}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white truncate">{memberName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItems />
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
          className="relative p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Menu size={18} />
          {totalBadges > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          )}
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
                <NavItems onClick={() => setSideOpen(false)} />
              </nav>
              <button onClick={logout} className="flex items-center gap-2 px-5 py-4 text-sm text-white/30 hover:text-red-400 border-t border-white/[0.06] transition-all">
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
