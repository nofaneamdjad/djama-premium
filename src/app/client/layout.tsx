"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BarChart2, ReceiptText, CreditCard, Wallet,
  Users, FileText, Truck, Package, ListTodo, Calendar,
  CalendarRange, Timer, StickyNote, Mic, Search, Zap, Star, Brain,
  Crown, Sparkles, Lock, ChevronRight, X, Menu,
  LogOut, Bell, ArrowRight, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { getToolTier } from "@/lib/plans";

const GOLD = "#c9a55a";
const DARK = "#111318";

/* ─────────── FREE NAV (4 tools always visible) ─────────── */
const FREE_NAV = [
  { href: "/client",           label: "Accueil",          icon: Home,        exact: true  },
  { href: "/client/factures",  label: "Factures & Devis", icon: ReceiptText, exact: false },
  { href: "/client/planning",  label: "Planning",         icon: Calendar,    exact: false },
  { href: "/client/bloc-note", label: "Bloc-note",        icon: Mic,         exact: false },
] as const;

/* ─────────── ALL PRO TOOLS (for popup) ─────────── */
const PRO_TOOLS = [
  { href: "/client/dashboard",    label: "Tableau de bord",  icon: BarChart2    },
  { href: "/client/crm",          label: "CRM",              icon: Users        },
  { href: "/client/assistant",    label: "Assistant IA",     icon: Zap          },
  { href: "/client/depenses",     label: "Dépenses",         icon: CreditCard   },
  { href: "/client/tresorerie",   label: "Trésorerie",       icon: Wallet       },
  { href: "/client/contrats",     label: "Contrats",         icon: FileText     },
  { href: "/client/fournisseurs", label: "Fournisseurs",     icon: Truck        },
  { href: "/client/stocks",       label: "Stocks",           icon: Package      },
  { href: "/client/productivite", label: "Tâches",           icon: ListTodo     },
  { href: "/client/equipe",       label: "Équipe",           icon: CalendarRange},
  { href: "/client/chrono",       label: "Chrono",           icon: Timer        },
  { href: "/client/notes",        label: "Notes IA",         icon: StickyNote   },
  { href: "/client/sourcing",     label: "Sourcing IA",      icon: Search       },
  { href: "/client/reputation",   label: "Réputation",       icon: Star         },
  { href: "/coaching-ia/espace",  label: "Coaching IA",      icon: Brain        },
] as const;

/* ─────────── PREMIUM GROUPED NAV ─────────── */
const PREMIUM_GROUPS = [
  {
    label: null,
    items: [
      { href: "/client",           label: "Accueil",         icon: Home,      exact: true  },
      { href: "/client/dashboard", label: "Tableau de bord", icon: BarChart2, exact: false },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/client/factures",   label: "Factures",   icon: ReceiptText, exact: false },
      { href: "/client/depenses",   label: "Dépenses",   icon: CreditCard,  exact: false },
      { href: "/client/tresorerie", label: "Trésorerie", icon: Wallet,      exact: false },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/client/crm",          label: "CRM",          icon: Users,    exact: false },
      { href: "/client/contrats",     label: "Contrats",     icon: FileText, exact: false },
      { href: "/client/fournisseurs", label: "Fournisseurs", icon: Truck,    exact: false },
      { href: "/client/stocks",       label: "Stocks",       icon: Package,  exact: false },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/client/productivite", label: "Tâches",   icon: ListTodo,      exact: false },
      { href: "/client/planning",     label: "Planning",  icon: Calendar,      exact: false },
      { href: "/client/equipe",       label: "Équipe",    icon: CalendarRange, exact: false },
      { href: "/client/chrono",       label: "Chrono",    icon: Timer,         exact: false },
    ],
  },
  {
    label: "Notes & IA",
    items: [
      { href: "/client/notes",       label: "Notes IA",     icon: StickyNote, exact: false },
      { href: "/client/bloc-note",   label: "Bloc-note",    icon: Mic,        exact: false },
      { href: "/client/sourcing",    label: "Sourcing IA",  icon: Search,     exact: false },
      { href: "/client/assistant",   label: "Assistant IA", icon: Zap,        exact: false },
      { href: "/client/reputation",  label: "Réputation",   icon: Star,       exact: false },
      { href: "/coaching-ia/espace", label: "Coaching IA",  icon: Brain,      exact: false },
    ],
  },
] as const;

type UpcomingEvent = {
  id: string; title: string;
  event_date: string; event_time: string | null; category: string;
};

function isoToday()    { return new Date().toISOString().split("T")[0]; }
function isoTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
function isoIn7()      { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; }
function fmtEvtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

/* ─────────── DARK NAV ITEM ─────────── */
function DarkNavItem({
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
      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[0.8rem] font-medium transition-colors duration-150 ${
        active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
      }`}
      style={active ? { background: "rgba(201,165,90,0.11)" } : {}}
    >
      <span
        className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity"
        style={{ background: GOLD, opacity: active ? 1 : 0 }}
      />
      <Icon size={14} style={{ color: active ? GOLD : undefined }} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/* ─────────── NOTIF BELL ─────────── */
function NotifBell({ ready }: { ready: boolean }) {
  const [open,   setOpen]   = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("agenda_events")
        .select("id, title, event_date, event_time, category")
        .eq("user_id", user.id)
        .gte("event_date", isoToday())
        .lte("event_date", isoIn7())
        .order("event_date", { ascending: true });
      if (data) setEvents(data as UpcomingEvent[]);
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
  const badge        = todayEvts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${badge > 0 ? ` — ${badge}` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <Bell size={15} />
        {badge > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.52rem] font-black"
            style={{ background: GOLD, color: "#fff" }}
          >
            {badge > 9 ? "9+" : badge}
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
            className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
            style={{ background: "rgba(10,14,26,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-xs font-semibold text-white/80">Événements à venir</span>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70 transition">
                <X size={13} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {events.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Calendar size={20} className="mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/40">Aucun événement cette semaine</p>
                  <Link href="/client/planning" onClick={() => setOpen(false)}
                    className="mt-2 inline-block text-xs font-medium transition hover:opacity-80"
                    style={{ color: GOLD }}>
                    + Ajouter
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  {[
                    { label: "Aujourd'hui",   evts: todayEvts,    showDate: false },
                    { label: "Demain",        evts: tomorrowEvts, showDate: false },
                    { label: "Cette semaine", evts: laterEvts,    showDate: true  },
                  ].map(({ label, evts, showDate }) => evts.length === 0 ? null : (
                    <div key={label}>
                      <p className="px-4 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-wider text-white/30">{label}</p>
                      {evts.map(ev => (
                        <Link href="/client/planning" key={ev.id} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.04]">
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white/80">{ev.title}</p>
                            <p className="text-[0.65rem] text-white/40">
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
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
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

/* ─────────── PRO TOOLS MODAL ─────────── */
function ProToolsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Glow */}
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `${GOLD}1a` }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}25` }}
                  >
                    <Crown size={16} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Outils DJAMA PRO</h3>
                    <p className="text-[0.62rem] text-white/35">{PRO_TOOLS.length} outils professionnels</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white/60"
                  aria-label="Fermer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Tools grid */}
              <div
                className="relative grid max-h-56 grid-cols-2 gap-1 overflow-y-auto px-4 pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {PRO_TOOLS.map(({ href, label, icon: Icon }) => (
                  <div
                    key={href}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${GOLD}12` }}
                    >
                      <Icon size={10} style={{ color: GOLD }} />
                    </div>
                    <span className="truncate text-[0.72rem] font-medium text-white/60">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="relative p-4 pt-3.5">
                <a
                  href="/client/abonnements"
                  onClick={onClose}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a]"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                    boxShadow: `0 4px 20px rgba(201,165,90,0.35)`,
                  }}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Crown size={14} />
                  Débloquer tout — 11,90€/mois
                  <ArrowRight size={13} />
                </a>
                <p className="mt-2.5 text-center text-[0.6rem] text-white/25">
                  30 jours d&apos;essai gratuit · Sans engagement
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── UPGRADE MODAL (premium page blocked) ─────────── */
function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `${GOLD}18` }}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white/60"
              >
                <X size={13} />
              </button>

              <div className="relative p-7">
                {/* Icon + title */}
                <div className="mb-5 flex flex-col items-center gap-3 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28` }}
                  >
                    <Crown size={22} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Outil PRO</h2>
                    <p className="mt-1 text-sm text-white/40">Disponible avec l&apos;abonnement DJAMA PRO</p>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-5 space-y-2.5">
                  {[
                    "CRM & gestion clients",
                    "Trésorerie & dépenses",
                    "Contrats & factures illimitées",
                    "Assistant & Coaching IA",
                    "Tous les outils sans restriction",
                  ].map(feat => (
                    <div key={feat} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} style={{ color: GOLD }} className="shrink-0" />
                      <p className="text-sm text-white/60">{feat}</p>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-5 text-center">
                  <span className="text-4xl font-black text-white">11,90€</span>
                  <span className="ml-1.5 text-sm text-white/35">/mois</span>
                  <p className="mt-1 text-[0.7rem] text-white/25">Sans engagement · Résiliable à tout moment</p>
                </div>

                {/* CTA */}
                <a
                  href="/client/abonnements"
                  onClick={onClose}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-extrabold text-[#0a0a0a] transition-shadow hover:shadow-[0_8px_32px_rgba(201,165,90,0.5)]"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                    boxShadow: "0 4px 20px rgba(201,165,90,0.35)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Crown size={14} /> Passer au plan PRO <ArrowRight size={13} />
                </a>
                <button
                  onClick={onClose}
                  className="mt-3 w-full text-center text-xs text-white/25 transition hover:text-white/45"
                >
                  Continuer gratuitement
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── TRIAL BANNER (slim elegant strip) ─────────── */
function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);
  const urgent = daysLeft <= 5;
  const accent = urgent ? "#fb923c" : GOLD;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex shrink-0 items-center justify-between overflow-hidden px-4 py-2"
          style={{
            background: urgent ? "rgba(251,146,60,0.07)" : `${GOLD}09`,
            borderBottom: `1px solid ${urgent ? "rgba(251,146,60,0.15)" : `${GOLD}18`}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={10} style={{ color: accent }} />
            <span className="text-xs font-medium" style={{ color: accent }}>
              {urgent
                ? `Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai`
                : `✨ Essai gratuit · ${daysLeft} jours restants`}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="/client/abonnements"
              className="rounded-lg px-2.5 py-1 text-[0.65rem] font-bold transition hover:opacity-80"
              style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}20` }}
            >
              Passer PRO
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="flex h-5 w-5 items-center justify-center rounded text-gray-300 transition hover:text-gray-500"
              aria-label="Fermer"
            >
              <X size={10} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────── LAYOUT ─────────── */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const subscription = useSubscription();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);

  const { level, isPremium, trialDaysLeft, name, email } = subscription;
  const userInitial = (name?.[0] ?? email?.[0] ?? "U").toUpperCase();
  const displayName = name || email || "Mon compte";
  const isReady     = level !== "loading" && level !== "unauthenticated";

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (level === "free" && getToolTier(pathname) === "premium") {
      setUpgradeModal(true);
    } else {
      setUpgradeModal(false);
    }
  }, [pathname, level]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Loading ── */
  if (level === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: DARK }}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
        <p className="text-xs text-white/30">Chargement…</p>
      </div>
    );
  }

  if (level === "unauthenticated") return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f6f7f9" }}>

      {/* Modals */}
      <ProToolsModal open={proModalOpen} onClose={() => setProModalOpen(false)} />
      <UpgradeModal  open={upgradeModal} onClose={() => setUpgradeModal(false)} />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR (Dark, minimal) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[218px] flex-col
          transition-transform duration-250 ease-out
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: DARK, borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div
          className="flex h-[52px] shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Link href="/client" className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}28` }}
            >
              <Sparkles size={13} style={{ color: GOLD }} />
            </div>
            <div className="leading-none">
              <p className="text-[0.88rem] font-bold" style={{ color: GOLD }}>DJAMA</p>
              <p className="mt-0.5 text-[0.5rem] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                {isPremium ? "PRO · Actif" : "Plan gratuit"}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer"
            className="text-white/25 transition hover:text-white/60 lg:hidden"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>

          {!isPremium ? (
            /* FREE USER — limited nav + PRO button */
            <>
              <p
                className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Outils gratuits
              </p>

              <div className="space-y-0.5">
                {FREE_NAV.map(item => (
                  <DarkNavItem
                    key={item.href}
                    {...item}
                    pathname={pathname}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </div>

              <div className="mx-2 my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

              {/* PRO button */}
              <button
                onClick={() => { setProModalOpen(true); setSidebarOpen(false); }}
                className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.78rem] font-medium transition-all"
                style={{
                  background: `${GOLD}0c`,
                  border: `1px solid ${GOLD}1a`,
                  color: GOLD,
                }}
              >
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${GOLD}14` }}
                >
                  <Lock size={9} style={{ color: GOLD }} />
                </div>
                <span className="flex-1 text-left">+ 14 outils PRO</span>
                <ChevronRight
                  size={11}
                  className="opacity-40 transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <a
                href="/client/abonnements"
                className="mt-2 block text-center text-[0.63rem] font-medium transition hover:opacity-70"
                style={{ color: `${GOLD}70` }}
              >
                Essai gratuit 30j →
              </a>
            </>
          ) : (
            /* PREMIUM USER — full grouped nav */
            PREMIUM_GROUPS.map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                {group.label && (
                  <p
                    className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <DarkNavItem
                      key={item.href}
                      {...item}
                      pathname={pathname}
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* User footer */}
        <div className="shrink-0 p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <Link
              href="/client/profil"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold transition hover:opacity-75"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}22`, color: GOLD }}
              title="Mon profil"
            >
              {userInitial}
            </Link>
            <Link href="/client/profil" className="group min-w-0 flex-1">
              <p className="truncate text-[0.72rem] font-medium text-white/65 transition group-hover:text-white/85">
                {displayName}
              </p>
              <p className="text-[0.55rem]" style={{ color: "rgba(255,255,255,0.28)" }}>
                {level === "premium" ? "PRO" : level === "trial" ? `Essai · ${trialDaysLeft}j` : "Gratuit"}
              </p>
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/25 transition hover:bg-white/5 hover:text-white/60"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Trial banner */}
        {level === "trial" && trialDaysLeft > 0 && (
          <TrialBanner daysLeft={trialDaysLeft} />
        )}

        {/* Topbar */}
        <header
          className="flex h-[52px] shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 lg:hidden"
          >
            <Menu size={16} />
          </button>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {!isPremium && (
              <button
                onClick={() => setProModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.72rem] font-bold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
              >
                <Crown size={11} /> Passer PRO
              </button>
            )}
            <NotifBell ready={isReady} />
            <Link
              href="/client/profil"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[0.65rem] font-bold transition hover:opacity-75"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}22`, color: GOLD }}
              title="Mon profil"
            >
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
