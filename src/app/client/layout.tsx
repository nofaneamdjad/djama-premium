"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BarChart2, ReceiptText, CreditCard, Wallet,
  Users, FileText, Truck, Package, ListTodo, Calendar,
  CalendarRange, Timer, StickyNote, Search, Zap, Star, Brain,
  Crown, Sparkles, Lock, ChevronRight, X, Menu,
  LogOut, Bell, ArrowRight, CheckCircle2, Share2, User, AlertTriangle,
  Building2, Banknote, FolderOpen, ThumbsUp, BookOpen, MessageSquare, Target,
  Sun, Moon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { getToolTier } from "@/lib/plans";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";
import OnboardingModal from "@/components/OnboardingModal";
import { ThemeProvider, useTheme, ACCENT_OPTIONS } from "@/lib/theme-context";

const GOLD = "#c9a55a";
const DARK = "#111318";

/* ─────────── FREE NAV (outils gratuits) ─────────── */
const FREE_NAV = [
  { href: "/client",           label: "Accueil",          icon: Home,        exact: true  },
  { href: "/client/factures",  label: "Factures & Devis", icon: ReceiptText, exact: false },
  { href: "/client/planning",  label: "Planning",         icon: Calendar,    exact: false },
  { href: "/client/bloc-notes", label: "Notes",            icon: StickyNote,  exact: false },
] as const;

/* ─────────── ALL PRO TOOLS (for popup) ─────────── */
const PRO_TOOLS = [
  { href: "/client/dashboard",       label: "Tableau de bord",   icon: BarChart2    },
  { href: "/client/crm",             label: "CRM",               icon: Users        },
  { href: "/client/assistant",       label: "Assistant IA",      icon: Zap          },
  { href: "/client/depenses",        label: "Dépenses",          icon: CreditCard   },
  { href: "/client/tresorerie",      label: "Trésorerie",        icon: Wallet       },
  { href: "/client/contrats",        label: "Contrats",          icon: FileText     },
  { href: "/client/fournisseurs",    label: "Fournisseurs",      icon: Truck        },
  { href: "/client/stocks",          label: "Stocks",            icon: Package      },
  { href: "/client/productivite",    label: "Tâches",            icon: ListTodo     },
  { href: "/client/equipe",          label: "Équipe",            icon: CalendarRange},
  { href: "/client/chrono",          label: "Chrono",            icon: Timer        },
  { href: "/client/bloc-notes",      label: "Notes",             icon: StickyNote   },
  { href: "/client/sourcing",        label: "Sourcing IA",       icon: Search       },
  { href: "/client/projets",          label: "Projets",           icon: FolderOpen   },
  { href: "/client/reseaux-sociaux", label: "Réseaux Sociaux",   icon: Share2       },
  { href: "/coaching-ia/espace",     label: "Coaching IA",       icon: Brain        },
  { href: "/client/portail",         label: "Portail Client",    icon: Building2    },
  { href: "/client/paie",            label: "Paie & RH",         icon: Banknote     },
  { href: "/client/reputation",      label: "Réputation",        icon: ThumbsUp     },
  { href: "/client/blog",            label: "Blog",               icon: BookOpen     },
  { href: "/client/temoignages",     label: "Témoignages",        icon: MessageSquare},
  { href: "/client/planification",   label: "Planification",      icon: Target       },
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
      { href: "/client/bloc-notes",       label: "Notes",          icon: StickyNote, exact: false },
      { href: "/client/sourcing",        label: "Sourcing IA",    icon: Search,     exact: false },
      { href: "/client/assistant",       label: "Assistant IA",   icon: Zap,        exact: false },
      { href: "/client/projets",          label: "Projets",        icon: FolderOpen, exact: false },
      { href: "/client/reseaux-sociaux", label: "Réseaux Sociaux",icon: Share2,     exact: false },
      { href: "/coaching-ia/espace",     label: "Coaching IA",    icon: Brain,      exact: false },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/client/portail",         label: "Portail Client", icon: Building2,    exact: false },
      { href: "/client/paie",            label: "Paie & RH",      icon: Banknote,     exact: false },
      { href: "/client/reputation",      label: "Réputation",     icon: ThumbsUp,     exact: false },
      { href: "/client/blog",            label: "Blog",            icon: BookOpen,     exact: false },
      { href: "/client/temoignages",     label: "Témoignages",    icon: MessageSquare,exact: false },
      { href: "/client/planification",   label: "Planification",  icon: Target,       exact: false },
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

/* ─────────── NAV ITEM (dark + light mode) ─────────── */
function DarkNavItem({
  href, label, icon: Icon, exact = false, pathname, onClick,
  dark = true, accent = GOLD,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; pathname: string; onClick?: () => void;
  dark?: boolean; accent?: string;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[0.8rem] font-medium transition-colors duration-150 ${
        dark
          ? active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
          : active ? "text-gray-900" : "text-gray-500 hover:text-gray-800 hover:bg-black/[0.04]"
      }`}
      style={active ? { background: dark ? `${accent}1c` : `${accent}14` } : {}}
    >
      <span
        className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity"
        style={{ background: accent, opacity: active ? 1 : 0 }}
      />
      <Icon size={14} style={{ color: active ? accent : undefined }} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/* ─────────── THEME TOGGLE BUTTON ─────────── */
function ThemeToggle() {
  const { mode, accent, accentName, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = mode === "dark";

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
        title="Changer le thème"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          isDark
            ? "text-white/40 hover:bg-white/[0.07] hover:text-white/70"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
      >
        {isDark ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
            style={{
              background: isDark ? "rgba(15,18,28,0.97)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.09)",
            }}
          >
            {/* Mode toggle */}
            <div className="p-3" style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
              <p className={`mb-2 text-[0.58rem] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>
                Mode d&apos;affichage
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {([["dark", Moon, "Sombre"], ["light", Sun, "Clair"]] as const).map(([m, Icon, lbl]) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[0.75rem] font-semibold transition-all ${
                      mode === m
                        ? "text-white"
                        : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"
                    }`}
                    style={mode === m
                      ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 16px ${accent}40` }
                      : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }
                    }
                  >
                    <Icon size={12} />
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── NOTIF BELL ─────────── */
type OverdueDoc = { id: string; numero: string; client_nom: string; total_ttc: number };

function NotifBell({ ready }: { ready: boolean }) {
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
        supabase
          .from("agenda_events")
          .select("id, title, event_date, event_time, category")
          .eq("user_id", user.id)
          .gte("event_date", isoToday())
          .lte("event_date", isoIn7())
          .order("event_date", { ascending: true }),
        supabase
          .from("documents")
          .select("id, numero, client_nom, total_ttc")
          .eq("user_id", user.id)
          .eq("statut", "en_retard")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (evtRes.data) setEvents(evtRes.data as UpcomingEvent[]);
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
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
            className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
            style={{ background: "rgba(10,14,26,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-xs font-semibold text-white/80">Notifications</span>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70 transition">
                <X size={13} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Overdue invoices */}
              {overdue.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-wider text-red-400/70">
                    ⚠ Factures en retard
                  </p>
                  {overdue.map(inv => (
                    <Link href="/client/factures" key={inv.id} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.04]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                        <AlertTriangle size={10} className="text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/80">
                          {inv.client_nom || inv.numero || "Facture"}
                        </p>
                        <p className="text-[0.65rem] text-red-400/70">
                          {new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(inv.total_ttc ?? 0)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  <div className="mx-4 my-2 border-t border-white/[0.07]" />
                </div>
              )}
              {/* Upcoming events */}
              {events.length === 0 && overdue.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/40">Aucune notification</p>
                </div>
              ) : events.length > 0 && (
                <div className="py-1">
                  <p className="px-4 pb-1 pt-2 text-[0.6rem] font-bold uppercase tracking-wider text-white/30">Agenda</p>
                  {[
                    { label: "Aujourd'hui",   evts: todayEvts,    showDate: false },
                    { label: "Demain",        evts: tomorrowEvts, showDate: false },
                    { label: "Cette semaine", evts: laterEvts,    showDate: true  },
                  ].map(({ label, evts, showDate }) => evts.length === 0 ? null : (
                    <div key={label}>
                      <p className="px-4 pb-1 pt-2 text-[0.6rem] font-semibold uppercase tracking-wider text-white/20">{label}</p>
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
            <div className="relative overflow-hidden rounded-2xl"
              style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
              <div className="pointer-events-none absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `${GOLD}1a` }} />

              <div className="relative flex items-center justify-between px-5 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}25` }}>
                    <Crown size={16} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">DJAMA PRO</h3>
                    <p className="text-[0.62rem] text-white/35">{PRO_TOOLS.length} outils professionnels</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white/60">
                  <X size={13} />
                </button>
              </div>

              <div className="relative grid max-h-56 grid-cols-2 gap-1 overflow-y-auto px-4 pb-1"
                style={{ scrollbarWidth: "none" }}>
                {PRO_TOOLS.map(({ href, label, icon: Icon }) => (
                  <div key={href}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${GOLD}12` }}>
                      <Icon size={10} style={{ color: GOLD }} />
                    </div>
                    <span className="truncate text-[0.72rem] font-medium text-white/60">{label}</span>
                  </div>
                ))}
              </div>

              <div className="relative p-4 pt-3.5">
                <a href="/client/abonnements" onClick={onClose}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 20px rgba(201,165,90,0.35)" }}>
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Crown size={14} />
                  Débloquer DJAMA PRO — 11,90€/mois
                  <ArrowRight size={13} />
                </a>
                <p className="mt-2.5 text-center text-[0.6rem] text-white/25">
                  Sans engagement · Résiliable à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── PREMIUM GATE — blur + cadenas + popup ─────────── */
function PremiumGateMockRows() {
  return (
    <div className="pointer-events-none select-none overflow-hidden" aria-hidden>
      {/* mock header */}
      <div className="flex items-center gap-3 border-b border-gray-200/60 bg-white px-5 py-4">
        <div className="h-8 w-8 rounded-xl bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-gray-200" />
          <div className="h-2 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="ml-auto h-8 w-20 rounded-xl bg-gray-200" />
      </div>
      {/* mock content rows */}
      {[100, 80, 90, 65, 75, 55, 85].map((w, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
          <div className="h-9 w-9 rounded-xl bg-gray-200/80" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            <div className="h-2 w-24 rounded-full bg-gray-100" />
          </div>
          <div className="h-6 w-14 rounded-full bg-gray-200/70" />
        </div>
      ))}
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: "#f6f7f9" }}>

      {/* Blurred mock content */}
      <div className="absolute inset-0" style={{ filter: "blur(3px)", transform: "scale(1.02)", transformOrigin: "top" }}>
        <PremiumGateMockRows />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(246,247,249,0.82)" }} />

      {/* Centered card */}
      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          {/* Glow border */}
          <div className="absolute inset-0 rounded-3xl opacity-40 blur-sm"
            style={{ background: `linear-gradient(135deg, ${GOLD}28, transparent 60%)` }} />

          <div className="relative overflow-hidden rounded-3xl bg-white px-7 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.12)] text-center"
            style={{ border: "1px solid rgba(201,165,90,0.15)" }}>

            {/* Top glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
              style={{ background: `linear-gradient(180deg, ${GOLD}22, transparent)` }} />

            {/* Lock badge */}
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 20, delay: 0.12 }}
              className="relative mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
              style={{ background: `linear-gradient(135deg, ${GOLD}18, ${GOLD}08)`, border: `1.5px solid ${GOLD}28` }}
            >
              <Crown size={30} style={{ color: GOLD }} />
              {/* Small lock pip */}
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, border: "2px solid white" }}>
                <Lock size={10} color="white" strokeWidth={2.5} />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest"
                style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}22` }}>
                <Sparkles size={8} /> DJAMA PRO
              </div>
              <h2 className="mt-2 text-xl font-extrabold text-gray-900">Outil PRO requis</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                Passez à PRO pour débloquer cet outil<br />et les 19 autres modules avancés.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.28 }}
              className="mt-5 flex flex-wrap justify-center gap-1.5"
            >
              {["CRM", "Trésorerie", "Contrats IA", "Assistant IA", "Portail Client", "Paie & RH", "+ 13 autres"].map(f => (
                <span key={f} className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold"
                  style={{ background: `${GOLD}0d`, color: `${GOLD}cc`, border: `1px solid ${GOLD}1a` }}>
                  {f}
                </span>
              ))}
            </motion.div>

            {/* Check list */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              className="mt-5 space-y-2 text-left"
            >
              {["Accès complet immédiat", "Tous les outils débloqués", "Résiliable à tout moment"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: GOLD }} className="shrink-0" />
                  <span className="text-[0.8rem] text-gray-500">{f}</span>
                </div>
              ))}
            </motion.div>

            {/* Price */}
            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-gray-900">11,90</span>
              <span className="text-lg font-bold text-gray-400">€</span>
              <span className="mb-0.5 text-sm text-gray-400">/mois</span>
            </div>

            {/* CTA */}
            <motion.a
              href="/client/abonnements"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.42 }}
              className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-[#0a0a0a]"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                boxShadow: "0 6px 24px rgba(201,165,90,0.35)",
              }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Crown size={14} />
              Débloquer DJAMA PRO
              <ArrowRight size={13} />
            </motion.a>

            <Link href="/client" className="mt-3 block text-center text-[0.7rem] text-gray-300 transition hover:text-gray-500">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────── GLOBAL SEARCH MODAL ─────────── */
type SearchResult = {
  id: string;
  type: "document" | "event";
  title: string;
  subtitle: string;
  href: string;
};

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setQuery(""); setResults([]); onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 80); }
    else { setQuery(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const q = query.trim();
        const [docsRes, eventsRes] = await Promise.all([
          supabase.from("documents")
            .select("id, numero, client_nom, type, total_ttc")
            .or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%`)
            .eq("user_id", user.id)
            .limit(6),
          supabase.from("agenda_events")
            .select("id, title, event_date")
            .ilike("title", `%${q}%`)
            .eq("user_id", user.id)
            .limit(4),
        ]);
        if (cancelled) return;
        const res: SearchResult[] = [];
        (docsRes.data ?? []).forEach(d => {
          const typ = (d.type as string) || "document";
          res.push({
            id: d.id as string, type: "document",
            title: `${d.numero || "—"} · ${d.client_nom || "Client"}`,
            subtitle: `${typ.charAt(0).toUpperCase() + typ.slice(1)} · ${
              new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                .format((d.total_ttc as number) ?? 0)
            }`,
            href: "/client/factures",
          });
        });
        (eventsRes.data ?? []).forEach(e => {
          res.push({
            id: e.id as string, type: "event",
            title: e.title as string,
            subtitle: new Date((e.event_date as string) + "T12:00:00").toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long",
            }),
            href: "/client/planning",
          });
        });
        setResults(res);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[10vh] z-[61] w-full max-w-lg -translate-x-1/2 px-4"
          >
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.75)",
              }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Search size={14} className="shrink-0 text-white/30" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher factures, événements, clients…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {searching ? (
                  <div className="relative h-4 w-4 shrink-0">
                    <div className="absolute inset-0 rounded-full" style={{ border: "1.5px solid rgba(201,165,90,0.18)" }} />
                    <motion.div className="absolute inset-0 rounded-full"
                      style={{ border: "1.5px solid transparent", borderTopColor: GOLD }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                  </div>
                ) : (
                  <kbd className="rounded px-1.5 py-0.5 text-[0.52rem] text-white/20 hidden sm:block"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    ESC
                  </kbd>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="max-h-[52vh] overflow-y-auto py-1.5" style={{ scrollbarWidth: "none" }}>
                  {results.map((r) => {
                    const Icon = r.type === "event" ? Calendar : ReceiptText;
                    return (
                      <Link key={r.id} href={r.href} onClick={close}
                        className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.05]">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}18` }}>
                          <Icon size={12} style={{ color: GOLD }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white/80">{r.title}</p>
                          <p className="truncate text-[0.65rem] text-white/35">{r.subtitle}</p>
                        </div>
                        <ArrowRight size={12} className="shrink-0 text-white/20" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {query.trim() && !searching && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-white/30">Aucun résultat pour &ldquo;{query}&rdquo;</p>
                  <p className="mt-1 text-[0.65rem] text-white/20">Numéro de facture, nom de client, événement…</p>
                </div>
              )}

              {/* Hints (empty state) */}
              {!query && (
                <div className="px-4 py-4">
                  <p className="mb-3 text-[0.58rem] font-bold uppercase tracking-wider text-white/20">Rechercher dans</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: ReceiptText, label: "Factures & devis", desc: "Numéro, nom du client" },
                      { icon: Calendar,    label: "Agenda",            desc: "Titre de l'événement"  },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                          style={{ background: "rgba(255,255,255,0.05)" }}>
                          <Icon size={11} className="text-white/30" />
                        </div>
                        <span className="text-xs text-white/35">{label}</span>
                        <span className="text-[0.62rem] text-white/20">— {desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <kbd className="rounded px-1.5 py-0.5 text-[0.55rem] text-white/25"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      ⌘K
                    </kbd>
                    <span className="text-[0.6rem] text-white/20">pour ouvrir la recherche depuis n&apos;importe où</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── BOTTOM NAV (mobile only) ─────────── */
function BottomNav({ pathname, dark = false, accent = GOLD }: { pathname: string; dark?: boolean; accent?: string }) {
  const items = [
    { href: "/client",            label: "Accueil",    icon: Home,        exact: true  },
    { href: "/client/factures",   label: "Factures",   icon: ReceiptText, exact: false },
    { href: "/client/depenses",   label: "Dépenses",   icon: CreditCard,  exact: false },
    { href: "/client/tresorerie", label: "Trésorerie", icon: Wallet,      exact: false },
    { href: "/client/profil",     label: "Profil",     icon: User,        exact: false },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden"
      style={{
        background: dark ? "#111318" : "#ffffff",
        borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: dark ? "0 -4px 20px rgba(0,0,0,0.24)" : "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-opacity active:opacity-70"
            >
              <motion.div
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{ color: active ? accent : dark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}
                />
              </motion.div>
              <span
                className="text-[9.5px] font-semibold"
                style={{ color: active ? accent : dark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}
              >
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavDot"
                  className="absolute bottom-1 h-1 w-1 rounded-full"
                  style={{ background: accent }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ─────────── LAYOUT ─────────── */
/* Pages that carry their own dark background — topbar adapts accordingly */
const DARK_PAGES = [
  "/client",
  "/client/dashboard",
  "/client/abonnements",
  "/client/tresorerie",
  "/client/equipe",
  "/client/planning",
  "/client/productivite",
  "/client/contrats",
  "/client/assistant",
  "/client/reseaux-sociaux",
  "/client/bloc-note",
  "/client/bloc-notes",
  "/client/chrono",
  "/client/sourcing",
  "/client/notes",
  "/client/projets",
  "/client/coaching-ia",
  "/client/stocks",
  "/client/fournisseurs",
  "/client/crm",
  "/client/depenses",
  "/client/factures",
  "/client/paie",
  "/client/portail",
  "/client/reputation",
  "/client/blog",
  "/client/temoignages",
  "/client/planification",
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </ThemeProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { mode, accent, isDark } = useTheme();
  const pathname     = usePathname();
  const subscription = useSubscription();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);

  /* ── detect dark pages for consistent background ── */
  const isDarkPage = DARK_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));

  /* Pages with their own complete mobile nav — hide the global bottom bar */
  const hasOwnMobileNav = pathname.startsWith("/client/bloc-notes");

  const { level, isPremium, name, email } = subscription;
  const userInitial = (name?.[0] ?? email?.[0] ?? "U").toUpperCase();
  const displayName = name || email || "Mon compte";
  const isReady     = level !== "loading" && level !== "unauthenticated";

  /* Block premium pages for free users — gate replaces content */
  const isGated = level === "free" && getToolTier(pathname) === "premium";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── #8: ⌘K / Ctrl+K opens global search ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ── Loading ── */
  if (level === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090e]">
        {/* Orb gold centré */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: GOLD }}
        />
        {/* DJAMA */}
        <motion.span
          initial={{ opacity: 0, scale: 0.82, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="relative mb-10 text-[3rem] font-black text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          DJAMA
        </motion.span>
        {/* Spinner gold */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="relative h-7 w-7"
        >
          <div className="absolute inset-0 rounded-full"
            style={{ border: "2px solid rgba(201,165,90,0.18)" }} />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid transparent", borderTopColor: GOLD }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  if (level === "unauthenticated") return null;

  return (
    <div
      className="client-app flex h-screen overflow-hidden"
      data-theme={mode}
      style={{
        background: isDark ? (isDarkPage ? "#07090e" : "#f6f7f9") : "#f4f5f9",
        transition: "background 0.3s ease",
        colorScheme: mode,
      }}
    >
      {/* Global search */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* PRO discovery modal */}
      <ProToolsModal open={proModalOpen} onClose={() => setProModalOpen(false)} />

      {/* ── SIDEBAR DESKTOP (toujours dans le flux flex à lg+) ── */}
      <aside
        className="hidden lg:flex w-[13.625rem] flex-shrink-0 flex-col"
        style={{
          background: isDark ? "#111318" : "#ffffff",
          borderRight: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
          boxShadow: isDark ? "none" : "1px 0 0 rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <div className="flex h-[52px] shrink-0 items-center px-4"
          style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
          <Link href="/client" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
              <Sparkles size={13} style={{ color: accent }} />
            </div>
            <div className="leading-none">
              <p className="text-[0.88rem] font-bold" style={{ color: accent }}>DJAMA</p>
              <p className="mt-0.5 text-[0.5rem] uppercase tracking-widest"
                style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                {isPremium ? "PRO · Actif" : "Plan Gratuit"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
          {!isPremium ? (
            <>
              <p className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                Outils gratuits
              </p>
              <div className="space-y-0.5">
                {FREE_NAV.map(item => (
                  <DarkNavItem key={item.href} {...item} pathname={pathname} onClick={() => {}} dark={isDark} accent={accent} />
                ))}
              </div>
              <div className="mx-2 my-4" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }} />
              <button
                onClick={() => setProModalOpen(true)}
                className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.78rem] font-medium transition-all"
                style={{ background: `${accent}0c`, border: `1px solid ${accent}1a`, color: accent }}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${accent}14` }}>
                  <Lock size={9} style={{ color: accent }} />
                </div>
                <span className="flex-1 text-left">Débloquer les outils PRO</span>
                <ChevronRight size={11} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href="/client/abonnements"
                className="mt-2 block text-center text-[0.63rem] font-medium transition hover:opacity-70"
                style={{ color: `${accent}70` }}>
                Voir DJAMA PRO →
              </a>
            </>
          ) : (
            PREMIUM_GROUPS.map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                {group.label && (
                  <p className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <DarkNavItem key={item.href} {...item} pathname={pathname} onClick={() => {}} dark={isDark} accent={accent} />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* User footer */}
        <div className="shrink-0 p-2" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <Link href="/client/profil"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold transition hover:opacity-75"
              style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
              title="Mon profil">
              {userInitial}
            </Link>
            <Link href="/client/profil" className="group min-w-0 flex-1">
              <p className={`truncate text-[0.72rem] font-medium transition ${isDark ? "text-white/65 group-hover:text-white/85" : "text-gray-600 group-hover:text-gray-900"}`}>
                {displayName}
              </p>
              <p className="text-[0.55rem]" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>
                {isPremium ? "DJAMA PRO" : "Plan Gratuit"}
              </p>
            </Link>
            <button onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${isDark ? "text-white/25 hover:bg-white/5 hover:text-white/60" : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"}`}>
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR MOBILE (overlay animé, uniquement quand sidebarOpen) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-40 flex w-[13.625rem] flex-col"
              style={{
                background: isDark ? "#111318" : "#ffffff",
                borderRight: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* Logo + bouton fermer */}
              <div className="flex h-[52px] shrink-0 items-center justify-between px-4"
                style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
                <Link href="/client" className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                    <Sparkles size={13} style={{ color: accent }} />
                  </div>
                  <div className="leading-none">
                    <p className="text-[0.88rem] font-bold" style={{ color: accent }}>DJAMA</p>
                    <p className="mt-0.5 text-[0.5rem] uppercase tracking-widest"
                      style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                      {isPremium ? "PRO · Actif" : "Plan Gratuit"}
                    </p>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} aria-label="Fermer"
                  className={`transition ${isDark ? "text-white/25 hover:text-white/60" : "text-gray-300 hover:text-gray-600"}`}>
                  <X size={14} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
                {!isPremium ? (
                  <>
                    <p className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                      style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                      Outils gratuits
                    </p>
                    <div className="space-y-0.5">
                      {FREE_NAV.map(item => (
                        <DarkNavItem key={item.href} {...item} pathname={pathname}
                          onClick={() => setSidebarOpen(false)} dark={isDark} accent={accent} />
                      ))}
                    </div>
                    <div className="mx-2 my-4" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }} />
                    <button
                      onClick={() => { setProModalOpen(true); setSidebarOpen(false); }}
                      className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.78rem] font-medium transition-all"
                      style={{ background: `${accent}0c`, border: `1px solid ${accent}1a`, color: accent }}
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `${accent}14` }}>
                        <Lock size={9} style={{ color: accent }} />
                      </div>
                      <span className="flex-1 text-left">Débloquer les outils PRO</span>
                      <ChevronRight size={11} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <a href="/client/abonnements"
                      className="mt-2 block text-center text-[0.63rem] font-medium transition hover:opacity-70"
                      style={{ color: `${accent}70` }}>
                      Voir DJAMA PRO →
                    </a>
                  </>
                ) : (
                  PREMIUM_GROUPS.map((group, gi) => (
                    <div key={gi} className={gi > 0 ? "mt-4" : ""}>
                      {group.label && (
                        <p className="mb-1.5 px-2.5 text-[0.57rem] font-semibold uppercase tracking-widest"
                          style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                          {group.label}
                        </p>
                      )}
                      <div className="space-y-0.5">
                        {group.items.map(item => (
                          <DarkNavItem key={item.href} {...item} pathname={pathname}
                            onClick={() => setSidebarOpen(false)} dark={isDark} accent={accent} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </nav>

              {/* User footer */}
              <div className="shrink-0 p-2" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <Link href="/client/profil"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold transition hover:opacity-75"
                    style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
                    title="Mon profil">
                    {userInitial}
                  </Link>
                  <Link href="/client/profil" className="group min-w-0 flex-1">
                    <p className={`truncate text-[0.72rem] font-medium transition ${isDark ? "text-white/65 group-hover:text-white/85" : "text-gray-600 group-hover:text-gray-900"}`}>
                      {displayName}
                    </p>
                    <p className="text-[0.55rem]" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>
                      {isPremium ? "DJAMA PRO" : "Plan Gratuit"}
                    </p>
                  </Link>
                  <button onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${isDark ? "text-white/25 hover:bg-white/5 hover:text-white/60" : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"}`}>
                    <LogOut size={12} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex h-[52px] shrink-0 items-center gap-3 px-4"
          style={
            isDark
              ? { background: "#111318", borderBottom: "1px solid rgba(255,255,255,0.07)" }
              : { background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
          }
        >
          <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition lg:hidden ${
              isDark ? "text-white/40 hover:bg-white/[0.07] hover:text-white/70" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}>
            <Menu size={16} />
          </button>

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              isDark
                ? "bg-white/[0.05] text-white/30 hover:bg-white/[0.08] hover:text-white/50 border border-white/[0.07]"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
            }`}
            style={{ minWidth: 200 }}
          >
            <Search size={13} />
            <span className="flex-1 text-left text-[0.78rem]">Rechercher…</span>
            <kbd className={`rounded px-1.5 py-0.5 text-[0.52rem] ${
              isDark ? "bg-white/[0.06] border border-white/[0.08] text-white/20" : "bg-white border border-gray-200 text-gray-400"
            }`}>⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition sm:hidden ${
              isDark ? "text-white/40 hover:bg-white/[0.07] hover:text-white/70" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <Search size={16} />
          </button>

          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {!isPremium && (
              <button onClick={() => setProModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.72rem] font-bold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
                <Crown size={11} /> Voir DJAMA PRO
              </button>
            )}
            {!isGated && <FloatingAIAssistant isDark={isDark} />}
            <ThemeToggle />
            <NotifBell ready={isReady} />
            <Link href="/client/profil"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[0.65rem] font-bold transition hover:opacity-75"
              style={{ background: `${accent}12`, border: `1px solid ${accent}22`, color: accent }}
              title="Mon profil">
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Page — gated for free users on premium routes */}
        <main className={`flex-1 overflow-auto ${hasOwnMobileNav ? "" : "pb-16 lg:pb-0"}`}>
          {isGated ? <PremiumGate /> : children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {!hasOwnMobileNav && <BottomNav pathname={pathname} dark={isDark} accent={accent} />}

      {/* Onboarding — affiché une seule fois à la première connexion */}
      <OnboardingModal name={name?.split(" ")[0]} />
    </div>
  );
}
