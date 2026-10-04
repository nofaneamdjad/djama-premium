"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Menu, Bell, Crown, ChevronRight, X, AlertTriangle,
  Sun, Moon, SunMoon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme, ACCENT_OPTIONS } from "@/lib/theme-context";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";

const GOLD = "#c9a55a";

type UpcomingEvent = {
  id: string; title: string;
  event_date: string; event_time: string | null; category: string;
};
type OverdueDoc = { id: string; numero: string; client_nom: string; total_ttc: number };

function isoToday()    { return new Date().toISOString().split("T")[0]; }
function isoTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function isoIn7()      { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; }
function fmtEvtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── ThemeToggle ─── */
function ThemeToggle() {
  const { isDark, mode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Thème"
        className="flex h-8 w-8 items-center justify-center rounded-lg transition"
        style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {mode === "dark"  ? <Moon    size={15} /> :
         mode === "light" ? <Sun     size={15} /> :
                            <SunMoon size={15} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl p-3"
            style={{
              background: isDark ? "rgba(10,14,26,0.97)" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.45)" : "0 8px 40px rgba(0,0,0,0.12)",
            }}
          >
            {/* Accent colors */}
            <p className={`mb-2 text-[0.58rem] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>
              Couleur
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ACCENT_OPTIONS.map(({ value, name: accName, label }) => (
                <button
                  key={value}
                  onClick={() => setAccent(value, accName)}
                  title={label}
                  className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: value,
                    boxShadow: accent === value ? `0 0 0 2px ${isDark ? "#0a0e1a" : "#fff"}, 0 0 0 3.5px ${value}` : undefined,
                  }}
                />
              ))}
            </div>

            {/* Mode */}
            <p className={`mb-2 text-[0.58rem] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>
              Mode d&apos;affichage
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ["dark",  Moon,    "Sombre"],
                ["auto",  SunMoon, "Auto"],
                ["light", Sun,     "Clair"],
              ] as const).map(([m, Icon, lbl]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[0.68rem] font-semibold transition-all ${
                    mode === m ? "text-white" : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"
                  }`}
                  style={mode === m
                    ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 16px ${accent}40` }
                    : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }
                  }
                >
                  <Icon size={13} />
                  {lbl}
                </button>
              ))}
            </div>
            {mode === "auto" && (
              <p className={`mt-2 text-[0.58rem] text-center ${isDark ? "text-white/20" : "text-gray-400"}`}>
                Sombre 20h–7h · Clair 7h–20h
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── NotifBell ─── */
function NotifBell({ ready }: { ready: boolean }) {
  const { isDark } = useTheme();
  const [open,    setOpen]    = useState(false);
  const [events,  setEvents]  = useState<UpcomingEvent[]>([]);
  const [overdue, setOverdue] = useState<OverdueDoc[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [evtRes, overdueRes] = await Promise.all([
        supabase.from("agenda_events")
          .select("id, title, event_date, event_time, category")
          .eq("user_id", user.id)
          .gte("event_date", isoToday())
          .lte("event_date", isoIn7())
          .order("event_date", { ascending: true }),
        supabase.from("documents")
          .select("id, numero, client_nom, total_ttc")
          .eq("user_id", user.id)
          .eq("statut", "en_retard")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (evtRes.data)     setEvents(evtRes.data as UpcomingEvent[]);
      if (overdueRes.data) setOverdue(overdueRes.data as OverdueDoc[]);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  const today        = isoToday();
  const tomorrow     = isoTomorrow();
  const todayEvts    = events.filter(e => e.event_date === today);
  const tomorrowEvts = events.filter(e => e.event_date === tomorrow);
  const laterEvts    = events.filter(e => e.event_date > tomorrow);
  const totalBadge   = todayEvts.length + overdue.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${totalBadge > 0 ? ` — ${totalBadge}` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg transition"
        style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <Bell size={15} />
        {totalBadge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.52rem] font-black"
            style={{ background: overdue.length > 0 ? "#ef4444" : GOLD, color: "#fff" }}>
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl"
            style={{
              background: isDark ? "rgba(10,14,26,0.97)" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.45)" : "0 8px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              <span className="text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>Notifications</span>
              <button onClick={() => setOpen(false)} style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)" }}>
                <X size={13} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {overdue.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-wider text-red-400/70">
                    <AlertTriangle size={9} className="inline mr-1" />Factures en retard
                  </p>
                  {overdue.map(inv => (
                    <Link href="/client/factures" key={inv.id} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 transition"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                        <AlertTriangle size={10} className="text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>
                          {inv.client_nom || inv.numero || "Facture"}
                        </p>
                        <p className="text-[0.65rem] text-red-400/70">
                          {new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(inv.total_ttc ?? 0)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  <div className="mx-4 my-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                </div>
              )}
              {events.length === 0 && overdue.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="mx-auto mb-2" style={{ color: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)" }} />
                  <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>Aucune notification</p>
                </div>
              ) : events.length > 0 && (
                <div className="py-1">
                  <p className="px-4 pb-1 pt-2 text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.35)" }}>Agenda</p>
                  {[
                    { label: "Aujourd'hui",   evts: todayEvts,    showDate: false },
                    { label: "Demain",        evts: tomorrowEvts, showDate: false },
                    { label: "Cette semaine", evts: laterEvts,    showDate: true  },
                  ].map(({ label, evts, showDate }) => evts.length === 0 ? null : (
                    <div key={label}>
                      <p className="px-4 pb-1 pt-2 text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.30)" }}>{label}</p>
                      {evts.map(ev => (
                        <Link href="/client/planning" key={ev.id} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 transition"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium" style={{ color: isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)" }}>{ev.title}</p>
                            <p className="text-[0.65rem]" style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)" }}>
                              {showDate ? `${fmtEvtDate(ev.event_date)} · ` : ""}{ev.event_time ?? "Sans heure"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              <Link href="/client/planning" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-medium transition hover:opacity-75"
                style={{ color: GOLD }}>
                Voir le planning complet <ChevronRight size={11} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── TopBar ─── */
interface TopBarProps {
  isPremium: boolean;
  userInitial: string;
  isReady: boolean;
  isGated: boolean;
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  onProModalOpen: () => void;
}

export default function TopBar({
  isPremium, userInitial, isReady, isGated,
  onMenuOpen, onSearchOpen, onProModalOpen,
}: TopBarProps) {
  const { isDark, accent } = useTheme();

  return (
    <header
      className="flex h-[52px] shrink-0 items-center gap-2 px-3"
      style={
        isDark
          ? { background: "rgba(9,9,14,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }
          : { background: "rgba(252,253,255,0.96)", borderBottom: "1px solid rgba(0,0,0,0.07)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }
      }
    >
      {/* Mobile hamburger */}
      <button onClick={onMenuOpen} aria-label="Ouvrir le menu"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition lg:hidden ${
          isDark ? "text-white/35 hover:bg-white/[0.07] hover:text-white/65" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        }`}>
        <Menu size={15} />
      </button>

      {/* Search bar (desktop) */}
      <button
        onClick={onSearchOpen}
        className={`hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 transition ${
          isDark
            ? "bg-white/[0.04] text-white/25 hover:bg-white/[0.07] hover:text-white/45 border border-white/[0.06]"
            : "bg-[#f7f7fa] text-gray-400 hover:bg-[#f0f0f4] hover:text-gray-500 border border-[#eaeaef]"
        }`}
        style={{ minWidth: 220 }}
      >
        <Search size={13} />
        <span className="flex-1 text-left text-sm">Rechercher…</span>
        <kbd className={`rounded px-1.5 py-0.5 text-[0.58rem] font-mono ${
          isDark ? "bg-white/[0.05] border border-white/[0.07] text-white/25" : "bg-white border border-[#e0e0ea] text-gray-400"
        }`}>⌘K</kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={onSearchOpen}
        aria-label="Rechercher"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition sm:hidden ${
          isDark ? "text-white/35 hover:bg-white/[0.07] hover:text-white/65" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
      >
        <Search size={15} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        {/* +Créer */}
        <Link
          href="/client/factures"
          className="hidden sm:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8rem] font-semibold transition hover:opacity-88"
          style={{ background: `${accent}14`, border: `1px solid ${accent}28`, color: accent }}
        >
          <span style={{ fontSize: "0.9em", lineHeight: 1 }}>+</span>
          <span>Créer</span>
        </Link>

        {!isPremium && (
          <button onClick={onProModalOpen}
            className="hidden md:flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[0.78rem] font-bold transition hover:opacity-90"
            style={{ background: accent, color: "#0a0a0a" }}>
            <Crown size={10} /> PRO
          </button>
        )}

        {!isGated && <FloatingAIAssistant />}
        <ThemeToggle />
        <NotifBell ready={isReady} />
        <Link href="/client/profil"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[0.6rem] font-bold transition hover:opacity-75"
          style={{ background: `${accent}12`, border: `1px solid ${accent}22`, color: accent }}
          title="Mon profil">
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
