"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BarChart2, ReceiptText, CreditCard, Wallet, BookMarked,
  Users, FileText, Truck, Package, ListTodo, Calendar,
  CalendarRange, Timer, StickyNote, CheckSquare, ScanLine, Network, Search, Zap, Star, Brain,
  Crown, Sparkles, Lock, ChevronLeft, ChevronRight, X, Menu,
  LogOut, Bell, ArrowRight, CheckCircle2, Share2, User, AlertTriangle,
  Building2, Banknote, FolderOpen, ThumbsUp, BookOpen, MessageSquare, Target,
  Sun, Moon, SunMoon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { isPathAllowedForFreeUser } from "@/lib/free-plan";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";
import OnboardingModal from "@/components/OnboardingModal";
import { ThemeProvider, useTheme, ACCENT_OPTIONS } from "@/lib/theme-context";

const GOLD = "#c9a55a";
const DARK = "#111111";

/* ─────────── FREE NAV (outils gratuits) ─────────── */
const FREE_NAV = [
  { href: "/client",           label: "Accueil",          icon: Home,        exact: true  },
  { href: "/client/factures",  label: "Factures & Devis", icon: ReceiptText, exact: false },
  { href: "/client/planning",  label: "Planning",         icon: Calendar,    exact: false },
  { href: "/client/bloc-notes", label: "DJAMA Doc",        icon: StickyNote,  exact: false },
] as const;

/* ─────────── ALL PRO TOOLS (for popup) ─────────── */
const PRO_TOOLS = [
  { href: "/client/dashboard",       label: "Tableau de bord",   icon: BarChart2    },
  { href: "/client/crm",             label: "CRM",               icon: Users        },
  { href: "/client/assistant",       label: "Assistant IA",      icon: Zap          },
  { href: "/client/depenses",        label: "Dépenses",          icon: CreditCard   },
  { href: "/client/tresorerie",      label: "Trésorerie",        icon: Wallet       },
  { href: "/client/comptabilite",    label: "Comptabilité",      icon: BookMarked   },
  { href: "/client/contrats",        label: "Contrats",          icon: FileText     },
  { href: "/client/fournisseurs",    label: "Fournisseurs",      icon: Truck        },
  { href: "/client/stocks",          label: "Stocks",            icon: Package      },
  { href: "/client/productivite",    label: "Tâches",            icon: ListTodo     },
  { href: "/client/equipe",          label: "Équipe",            icon: CalendarRange},
  { href: "/client/chrono",          label: "Chrono",            icon: Timer        },
  { href: "/client/bloc-notes",      label: "DJAMA Doc",         icon: StickyNote   },
  { href: "/client/checklists",      label: "Checklists",        icon: CheckSquare  },
  { href: "/client/scanner",         label: "Scanner",           icon: ScanLine     },
  { href: "/client/mindmap",         label: "Mind Map",          icon: Network      },
  { href: "/client/sourcing",        label: "Sourcing IA",       icon: Search       },
  { href: "/client/projets",         label: "Projets",           icon: FolderOpen   },
  { href: "/client/reseaux-sociaux", label: "Réseaux Sociaux",   icon: Share2       },
  { href: "/coaching-ia/hub",          label: "Coaching IA",       icon: Brain        },
  { href: "/client/portail",         label: "Portail Client",    icon: Building2    },
  { href: "/client/paie",            label: "Paie & RH",         icon: Banknote     },
  { href: "/client/reputation",      label: "Réputation",        icon: ThumbsUp     },
  { href: "/client/blog",            label: "Blog",              icon: BookOpen     },
  { href: "/client/temoignages",     label: "Témoignages",       icon: MessageSquare},
  { href: "/client/planification",   label: "Planification",     icon: Target       },
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
      { href: "/client/factures",     label: "Factures",     icon: ReceiptText, exact: false },
      { href: "/client/depenses",     label: "Dépenses",     icon: CreditCard,  exact: false },
      { href: "/client/tresorerie",   label: "Trésorerie",   icon: Wallet,      exact: false },
      { href: "/client/comptabilite", label: "Comptabilité", icon: BookMarked,  exact: false },
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
      { href: "/client/productivite", label: "Tâches",          icon: ListTodo,      exact: false },
      { href: "/client/planning",     label: "Planning",         icon: Calendar,      exact: false },
      { href: "/client/equipe",       label: "Équipe",           icon: CalendarRange, exact: false },
      { href: "/client/espaces",      label: "Espaces Privés",   icon: Lock,          exact: false },
      { href: "/client/chrono",       label: "Chrono",           icon: Timer,         exact: false },
    ],
  },
  {
    label: "Documents",
    items: [
      { href: "/client/bloc-notes",  label: "DJAMA Doc",  icon: StickyNote,  exact: false },
      { href: "/client/checklists",  label: "Checklists", icon: CheckSquare, exact: false },
      { href: "/client/scanner",     label: "Scanner",    icon: ScanLine,    exact: false },
      { href: "/client/mindmap",     label: "Mind Map",   icon: Network,     exact: false },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/client/sourcing",        label: "Sourcing IA",    icon: Search,     exact: false },
      { href: "/client/assistant",       label: "Assistant IA",   icon: Zap,        exact: false },
      { href: "/client/projets",         label: "Projets",        icon: FolderOpen, exact: false },
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

/* ─────────── NAV ITEM (dark + light mode, + collapsed icon-only) ─────────── */
function DarkNavItem({
  href, label, icon: Icon, exact = false, pathname, onClick,
  dark = true, accent = GOLD, collapsed = false,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; pathname: string; onClick?: () => void;
  dark?: boolean; accent?: string; collapsed?: boolean;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center rounded-lg text-[0.8rem] font-medium transition-all duration-150 ${
        collapsed ? "justify-center py-[7px] mx-1.5" : "gap-2 px-2 py-[5px]"
      } ${
        dark
          ? active ? "text-white" : "text-white/45 hover:text-white/75"
          : active ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
      }`}
      style={active ? {
        background: dark ? `${accent}1c` : `${accent}13`,
        boxShadow: dark ? `inset 0 0 0 1px ${accent}22` : `inset 0 0 0 1px ${accent}1c`,
      } : {}}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
          collapsed ? "h-[30px] w-[30px]" : "h-[22px] w-[22px]"
        }`}
        style={{
          background: active ? `${accent}22` : "transparent",
        }}
      >
        <Icon
          size={collapsed ? 14 : 12}
          strokeWidth={active ? 2.2 : 1.8}
          style={{ color: active ? accent : undefined }}
        />
      </div>
      {!collapsed && <span className="flex-1 truncate leading-none">{label}</span>}
      {!collapsed && active && (
        <motion.span
          layoutId="navActiveDot"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: accent }}
        />
      )}
    </Link>
  );
}

/* ─────────── THEME TOGGLE BUTTON ─────────── */
function ThemeToggle() {
  const { mode, accent, accentName, setMode, setAccent, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  const TopbarIcon = mode === "auto" ? SunMoon : isDark ? Moon : Sun;

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
        <TopbarIcon size={15} />
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
                      mode === m
                        ? "text-white"
                        : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"
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
              <button onClick={() => setOpen(false)} className="transition" style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)" }}>
                <X size={13} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Overdue invoices */}
              {overdue.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-wider text-red-400/70">
                    <AlertTriangle size={9} className="inline mr-1" />Factures en retard
                  </p>
                  {overdue.map(inv => (
                    <Link href="/client/factures" key={inv.id} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 transition"
                      style={{ ["--hover-bg" as string]: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
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
              {/* Upcoming events */}
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

/* ─────────── FREE APP GATE — app non sélectionnée ─────────── */
function FreeAppGate() {
  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: "#f6f7f9" }}>
      <div className="absolute inset-0" style={{ filter: "blur(3px)", transform: "scale(1.02)", transformOrigin: "top" }}>
        <PremiumGateMockRows />
      </div>
      <div className="absolute inset-0" style={{ background: "rgba(246,247,249,0.82)" }} />

      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          <div className="absolute inset-0 rounded-3xl opacity-40 blur-sm"
            style={{ background: "linear-gradient(135deg, #4a3f5c28, transparent 60%)" }} />

          <div className="relative overflow-hidden rounded-3xl bg-white px-7 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.12)] text-center"
            style={{ border: "1px solid rgba(74,63,92,0.15)" }}>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-20"
              style={{ background: "linear-gradient(180deg, #4a3f5c22, transparent)" }} />

            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 20, delay: 0.12 }}
              className="relative mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
              style={{ background: "rgba(74,63,92,0.08)", border: "1.5px solid rgba(74,63,92,0.18)" }}
            >
              <Lock size={30} style={{ color: "#4a3f5c" }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
              <h2 className="mt-2 text-xl font-extrabold text-gray-900">Application non sélectionnée</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                Cette application ne fait pas partie de vos{" "}
                <strong className="text-gray-600">2 apps gratuites</strong>.<br />
                Passez au plan Standard pour tout débloquer.
              </p>
            </motion.div>

            <motion.a
              href="/tarification"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.32 }}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #4a3f5c, #6b5c80)", boxShadow: "0 6px 24px rgba(74,63,92,0.3)" }}
            >
              <Sparkles size={14} />
              Changer de forfait
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

/* ─────────── GLOBAL SEARCH / COMMAND PALETTE ─────────── */
type SearchHit = {
  id: string;
  group: string;
  HitIcon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  href: string;
};

const CP_QUICK_ACTIONS = [
  { label: "Créer une facture",    href: "/client/factures",  QIcon: ReceiptText, color: "#22c55e" },
  { label: "Ajouter un client",    href: "/client/crm",       QIcon: Users,       color: "#60a5fa" },
  { label: "Nouvelle dépense",     href: "/client/depenses",  QIcon: CreditCard,  color: "#f97316" },
  { label: "Ouvrir le calendrier", href: "/client/planning",  QIcon: Calendar,    color: "#a78bfa" },
] as const;

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [query,   setQuery]   = useState("");
  const [hits,    setHits]    = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selIdx,  setSelIdx]  = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowsRef  = useRef<Record<number, HTMLElement | null>>({});

  const c = isDark
    ? { bg: "#161718", sur: "#1e2022", bdr: "rgba(255,255,255,0.08)", tx: "rgba(255,255,255,0.90)", tx2: "rgba(255,255,255,0.52)", tx3: "rgba(255,255,255,0.28)", hov: "rgba(255,255,255,0.045)", sel: "rgba(201,165,90,0.09)" }
    : { bg: "#ffffff", sur: "#f6f7f9", bdr: "rgba(0,0,0,0.09)",       tx: "rgba(0,0,0,0.85)",       tx2: "rgba(0,0,0,0.50)",       tx3: "rgba(0,0,0,0.35)",       hov: "rgba(0,0,0,0.030)",      sel: "rgba(201,165,90,0.07)" };

  const close = useCallback(() => {
    setQuery(""); setHits([]); setSelIdx(0); onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 60); setSelIdx(0); }
    else { setQuery(""); setHits([]); }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) { setHits([]); setLoading(false); return; }
    setSelIdx(0);
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const q = query.trim();
        const fmt    = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
        const fmtDt  = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

        const [docsRes, clientsRes, expRes, evtRes] = await Promise.all([
          supabase.from("documents")
            .select("id, numero, client_nom, type, total_ttc, statut")
            .or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%`)
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .limit(5),
          supabase.from("clients_crm")
            .select("id, nom, email, telephone")
            .or(`nom.ilike.%${q}%,email.ilike.%${q}%`)
            .eq("user_id", user.id)
            .limit(4),
          supabase.from("expenses")
            .select("id, description, amount, category, date")
            .or(`description.ilike.%${q}%,category.ilike.%${q}%`)
            .eq("user_id", user.id)
            .limit(4),
          supabase.from("agenda_events")
            .select("id, title, event_date")
            .ilike("title", `%${q}%`)
            .eq("user_id", user.id)
            .limit(3),
        ]);

        if (cancelled) return;
        const results: SearchHit[] = [];

        for (const d of docsRes.data ?? []) {
          const isDevis = (d.type as string) === "devis";
          const statut  = (d.statut as string) ?? "";
          results.push({
            id: d.id as string, group: isDevis ? "DEVIS" : "FACTURES",
            HitIcon: ReceiptText,
            iconBg:    isDevis ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)",
            iconColor: isDevis ? "#fbbf24" : "#22c55e",
            title: `${(d.numero as string) || "—"}  ·  ${(d.client_nom as string) || "Client"}`,
            sub:   fmt((d.total_ttc as number) ?? 0),
            badge: statut,
            badgeColor: statut === "payé" ? "#22c55e" : statut === "en_retard" ? "#ef4444" : GOLD,
            href: "/client/factures",
          });
        }
        for (const c2 of clientsRes.data ?? []) {
          results.push({
            id: c2.id as string, group: "CLIENTS",
            HitIcon: Users, iconBg: "rgba(96,165,250,0.12)", iconColor: "#60a5fa",
            title: c2.nom as string,
            sub:   (c2.email as string) || (c2.telephone as string) || "Contact",
            href: "/client/crm",
          });
        }
        for (const e of expRes.data ?? []) {
          results.push({
            id: e.id as string, group: "DÉPENSES",
            HitIcon: CreditCard, iconBg: "rgba(239,68,68,0.10)", iconColor: "#ef4444",
            title: (e.description as string) || (e.category as string) || "Dépense",
            sub:   `${fmt((e.amount as number) ?? 0)} · ${fmtDt(e.date as string)}`,
            href: "/client/depenses",
          });
        }
        for (const ev of evtRes.data ?? []) {
          results.push({
            id: ev.id as string, group: "AGENDA",
            HitIcon: Calendar, iconBg: "rgba(167,139,250,0.12)", iconColor: "#a78bfa",
            title: ev.title as string,
            sub:   fmtDt(ev.event_date as string),
            href: "/client/planning",
          });
        }
        const qLow = q.toLowerCase();
        let appCount = 0;
        for (const tool of PRO_TOOLS) {
          if (appCount >= 3) break;
          if (tool.label.toLowerCase().includes(qLow)) {
            results.push({
              id: tool.href, group: "APPLICATIONS",
              HitIcon: tool.icon, iconBg: `${GOLD}14`, iconColor: GOLD,
              title: tool.label, sub: tool.href.replace("/client/", "djama/"),
              href: tool.href,
            });
            appCount++;
          }
        }
        setHits(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  const groups = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    for (const h of hits) {
      if (!map.has(h.group)) map.set(h.group, []);
      map.get(h.group)!.push(h);
    }
    return map;
  }, [hits]);

  function hitIdx(group: string, localIdx: number) {
    let offset = 0;
    for (const [g, arr] of groups.entries()) {
      if (g === group) return offset + localIdx;
      offset += arr.length;
    }
    return localIdx;
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { close(); return; }
      if (hits.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx(i => { const next = (i + 1) % hits.length; rowsRef.current[next]?.scrollIntoView({ block: "nearest" }); return next; });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx(i => { const next = (i - 1 + hits.length) % hits.length; rowsRef.current[next]?.scrollIntoView({ block: "nearest" }); return next; });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const h = hits[selIdx];
        if (h) { router.push(h.href); close(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hits, selIdx, close, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-[60]"
            style={{ background: isDark ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.25)", backdropFilter: "blur(3px)" }}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.975, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.975, y: -6 }}
            transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[10vh] z-[61] w-full -translate-x-1/2 px-4 sm:px-0"
            style={{ maxWidth: 660 }}
          >
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: c.bg,
                border: `1px solid ${c.bdr}`,
                boxShadow: isDark
                  ? "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)"
                  : "0 16px 48px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* ── Input bar ── */}
              <div className="flex items-center gap-3 px-4"
                style={{ height: 54, borderBottom: `1px solid ${c.bdr}` }}>
                <Search size={16} style={{ color: c.tx3, flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher dans DJAMA…"
                  className="flex-1 bg-transparent text-[0.92rem] font-medium outline-none"
                  style={{ color: c.tx, caretColor: GOLD }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading ? (
                  <motion.div className="h-[15px] w-[15px] shrink-0 rounded-full"
                    style={{ borderWidth: 1.5, borderStyle: "solid", borderTopColor: GOLD, borderRightColor: c.bdr, borderBottomColor: c.bdr, borderLeftColor: c.bdr }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <kbd className="hidden shrink-0 rounded-md px-1.5 py-0.5 text-[0.52rem] font-mono sm:block"
                    style={{ background: c.sur, border: `1px solid ${c.bdr}`, color: c.tx3 }}>
                    ESC
                  </kbd>
                )}
              </div>

              {/* ── Scrollable body ── */}
              <div className="max-h-[58vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {/* No result */}
                {query.trim() && !loading && hits.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <Search size={22} style={{ color: c.tx3 }} />
                    <p className="text-[0.875rem] font-semibold" style={{ color: c.tx2 }}>Aucun résultat</p>
                    <p className="text-[0.70rem]" style={{ color: c.tx3 }}>Essayez un autre mot-clé</p>
                  </div>
                )}

                {/* Grouped results */}
                {hits.length > 0 && (
                  <div className="py-1.5">
                    {Array.from(groups.entries()).map(([group, groupHits]) => (
                      <div key={group}>
                        <p className="px-4 pb-1 pt-3 text-[0.53rem] font-bold uppercase tracking-[0.14em]"
                          style={{ color: c.tx3 }}>
                          {group}
                        </p>
                        {groupHits.map((h, li) => {
                          const fi  = hitIdx(group, li);
                          const sel = fi === selIdx;
                          return (
                            <Link
                              key={h.id}
                              href={h.href}
                              onClick={close}
                              ref={el => { rowsRef.current[fi] = el as HTMLElement | null; }}
                              className="flex items-center gap-3 px-4 py-[9px] transition-colors"
                              style={{
                                background: sel ? c.sel : "transparent",
                                borderLeft: sel ? `2px solid ${GOLD}` : "2px solid transparent",
                              }}
                              onMouseEnter={() => setSelIdx(fi)}
                            >
                              <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg"
                                style={{ background: h.iconBg }}>
                                <h.HitIcon size={13} style={{ color: h.iconColor }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.80rem] font-semibold leading-tight" style={{ color: c.tx }}>{h.title}</p>
                                <p className="truncate text-[0.63rem] leading-tight mt-0.5" style={{ color: c.tx2 }}>{h.sub}</p>
                              </div>
                              {h.badge && (
                                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.50rem] font-bold uppercase tracking-wide"
                                  style={{ background: `${h.badgeColor}14`, color: h.badgeColor, border: `1px solid ${h.badgeColor}25` }}>
                                  {h.badge}
                                </span>
                              )}
                              <ArrowRight size={11} style={{ color: sel ? GOLD : c.tx3, flexShrink: 0 }} />
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Initial state — no query */}
                {!query.trim() && (
                  <div className="py-2">
                    <p className="px-4 pb-1 pt-3 text-[0.53rem] font-bold uppercase tracking-[0.14em]" style={{ color: c.tx3 }}>
                      Actions rapides
                    </p>
                    {CP_QUICK_ACTIONS.map(({ label, href, QIcon, color }) => (
                      <Link key={href} href={href} onClick={close}
                        className="flex items-center gap-3 px-4 py-[9px] transition-colors"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.hov; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${color}12` }}>
                          <QIcon size={13} style={{ color }} />
                        </div>
                        <span className="flex-1 text-[0.80rem] font-medium" style={{ color: c.tx }}>{label}</span>
                        <ArrowRight size={11} style={{ color: c.tx3, flexShrink: 0 }} />
                      </Link>
                    ))}
                    <div className="mx-4 mt-3 pt-3" style={{ borderTop: `1px solid ${c.bdr}` }}>
                      <p className="mb-1.5 text-[0.53rem] font-bold uppercase tracking-[0.14em]" style={{ color: c.tx3 }}>
                        Sources disponibles
                      </p>
                      <div className="flex flex-wrap gap-1.5 pb-2">
                        {[
                          { label: "Factures", color: "#22c55e" },
                          { label: "Clients",  color: "#60a5fa" },
                          { label: "Dépenses", color: "#ef4444" },
                          { label: "Agenda",   color: "#a78bfa" },
                          { label: "Apps",     color: GOLD      },
                        ].map(({ label, color }) => (
                          <span key={label} className="rounded-full px-2 py-0.5 text-[0.58rem] font-semibold"
                            style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center gap-4 px-4 py-2"
                style={{ borderTop: `1px solid ${c.bdr}` }}>
                {[["↑↓","naviguer"], ["↵","ouvrir"], ["Esc","fermer"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <kbd className="rounded px-1 py-0.5 text-[0.46rem] font-mono"
                      style={{ background: c.sur, border: `1px solid ${c.bdr}`, color: c.tx3 }}>{key}</kbd>
                    <span className="text-[0.52rem]" style={{ color: c.tx3 }}>{label}</span>
                  </div>
                ))}
                <span className="ml-auto text-[0.52rem] font-bold tracking-wider" style={{ color: `${GOLD}70` }}>DJAMA</span>
              </div>
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
        background: dark ? "rgba(9,9,14,0.97)" : "rgba(252,253,255,0.97)",
        borderTop: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: dark ? "0 -4px 24px rgba(0,0,0,0.28)" : "0 -4px 16px rgba(0,0,0,0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
  "/client/comptabilite",
  "/client/checklists",
  "/client/scanner",
  "/client/mindmap",
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
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [proModalOpen,     setProModalOpen]     = useState(false);
  const [searchOpen,       setSearchOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("djama-sidebar-collapsed") === "true") setSidebarCollapsed(true);
    } catch {}
  }, []);

  function toggleCollapsed() {
    setSidebarCollapsed(v => {
      const next = !v;
      try { localStorage.setItem("djama-sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }

  /* ── detect dark pages for consistent background ── */
  const isDarkPage = DARK_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));

  /* Pages with their own complete mobile nav — hide the global bottom bar */
  const hasOwnMobileNav = pathname.startsWith("/client/bloc-notes");

  const { level, isPremium, name, email, freeApps } = subscription;
  const userInitial = (name?.[0] ?? email?.[0] ?? "U").toUpperCase();
  const displayName = name || email || "Mon compte";
  const isReady     = level !== "loading" && level !== "unauthenticated";

  /* Block pages for free users whose chosen apps don't include this route */
  const isGated = level === "free" && isReady && !isPathAllowedForFreeUser(pathname, freeApps);

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
            style={{ borderWidth: "2px", borderStyle: "solid", borderTopColor: GOLD, borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }}
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
      className="client-app djama-app-shell flex h-screen overflow-hidden"
      data-theme={mode}
      style={{
        transition: "background 0.3s ease",
        colorScheme: mode,
      }}
    >
      {/* Global search */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* PRO discovery modal */}
      <ProToolsModal open={proModalOpen} onClose={() => setProModalOpen(false)} />

      {/* ── SIDEBAR DESKTOP ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 52 : 210 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-shrink-0 flex-col overflow-hidden"
        style={{
          background: isDark ? "rgba(11,12,18,0.99)" : "rgba(255,255,255,0.98)",
          borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo */}
        <div
          className="flex h-[48px] shrink-0 items-center"
          style={{
            padding: sidebarCollapsed ? "0 11px" : "0 14px",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Link href="/client" className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md"
              style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
            >
              <Sparkles size={12} style={{ color: accent }} />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 leading-none">
                <p className="text-[0.85rem] font-bold truncate" style={{ color: accent }}>DJAMA</p>
                <p className="text-[0.45rem] uppercase tracking-widest mt-0.5"
                  style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                  {isPremium ? "PRO · Actif" : "Plan Gratuit"}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none", padding: sidebarCollapsed ? "8px 0" : "8px 6px" }}>
          {!isPremium ? (
            <>
              {!sidebarCollapsed && (
                <p className="mb-1 px-2 text-[0.55rem] font-bold uppercase tracking-[0.14em]"
                  style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)" }}>
                  Outils gratuits
                </p>
              )}
              <div className="space-y-px">
                {FREE_NAV.map(item => (
                  <DarkNavItem key={item.href} {...item} pathname={pathname} onClick={() => {}} dark={isDark} accent={accent} collapsed={sidebarCollapsed} />
                ))}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="mx-2 my-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                  <button
                    onClick={() => setProModalOpen(true)}
                    className="group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.75rem] font-semibold transition-all"
                    style={{ background: `${accent}0c`, border: `1px solid ${accent}18`, color: accent }}
                  >
                    <Lock size={9} style={{ color: accent }} />
                    <span className="flex-1 text-left">Outils PRO</span>
                    <ChevronRight size={10} className="opacity-40" />
                  </button>
                </>
              )}
            </>
          ) : (
            PREMIUM_GROUPS.map((group, gi) => (
              <div key={gi} style={{ marginTop: gi > 0 && !sidebarCollapsed ? 16 : gi > 0 ? 8 : 0 }}>
                {group.label && !sidebarCollapsed && (
                  <p className="px-2 mb-1 text-[0.55rem] font-bold uppercase tracking-[0.14em]"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)" }}>
                    {group.label}
                  </p>
                )}
                {group.label && sidebarCollapsed && gi > 0 && (
                  <div className="mx-2 my-1" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                )}
                <div className="space-y-px">
                  {group.items.map(item => (
                    <DarkNavItem key={item.href} {...item} pathname={pathname} onClick={() => {}} dark={isDark} accent={accent} collapsed={sidebarCollapsed} />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 p-2.5">
              <Link href="/client/profil"
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-[0.6rem] font-bold transition hover:opacity-75"
                style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
                title="Mon profil">
                {userInitial}
              </Link>
              <Link href="/client/profil" className="group min-w-0 flex-1">
                <p className={`truncate text-[0.7rem] font-semibold transition ${isDark ? "text-white/65 group-hover:text-white/85" : "text-gray-600 group-hover:text-gray-900"}`}>
                  {displayName}
                </p>
              </Link>
              <button onClick={toggleCollapsed} aria-label="Réduire la sidebar"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
                <ChevronLeft size={12} />
              </button>
              <button onClick={handleLogout} aria-label="Se déconnecter"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
                <LogOut size={11} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <Link href="/client/profil"
                className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-[0.6rem] font-bold transition hover:opacity-75"
                style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
                title={displayName}>
                {userInitial}
              </Link>
              <button onClick={toggleCollapsed} aria-label="Développer la sidebar"
                className={`flex h-[22px] w-[22px] items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

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
                background: isDark ? "rgba(11,12,18,0.99)" : "rgba(255,255,255,0.99)",
                borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {/* Logo + bouton fermer */}
              <div className="flex h-[52px] shrink-0 items-center justify-between px-4"
                style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
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
                    <div className="mx-2 my-4" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
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
                    <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                      {group.label && (
                        <p className="mb-1 px-2 text-[0.78rem]"
                          style={{
                            fontFamily: "'Georgia','Times New Roman',serif",
                            fontStyle: "italic",
                            fontWeight: 700,
                            color: isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.30)",
                          }}>
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
          className="flex h-[48px] shrink-0 items-center gap-2 px-3"
          style={
            isDark
              ? { background: "rgba(9,9,14,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }
              : { background: "rgba(252,253,255,0.96)", borderBottom: "1px solid rgba(0,0,0,0.07)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }
          }
        >
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition lg:hidden ${
              isDark ? "text-white/35 hover:bg-white/[0.07] hover:text-white/65" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}>
            <Menu size={15} />
          </button>

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`hidden sm:flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition ${
              isDark
                ? "bg-white/[0.04] text-white/25 hover:bg-white/[0.07] hover:text-white/45 border border-white/[0.06]"
                : "bg-[#f7f7fa] text-gray-400 hover:bg-[#f0f0f4] hover:text-gray-500 border border-[#eaeaef]"
            }`}
            style={{ minWidth: 180 }}
          >
            <Search size={12} />
            <span className="flex-1 text-left text-[0.75rem]">Rechercher…</span>
            <kbd className={`rounded px-1 py-0.5 text-[0.5rem] font-mono ${
              isDark ? "bg-white/[0.05] border border-white/[0.07] text-white/18" : "bg-white border border-[#e0e0ea] text-gray-400"
            }`}>⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition sm:hidden ${
              isDark ? "text-white/35 hover:bg-white/[0.07] hover:text-white/65" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <Search size={15} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            {/* + Créer — CTA doré, toujours visible */}
            <Link
              href="/client/factures"
              className="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.72rem] font-semibold transition hover:opacity-88"
              style={{ background: `${accent}14`, border: `1px solid ${accent}28`, color: accent }}
            >
              <span style={{ fontSize: "0.9em", lineHeight: 1 }}>+</span>
              <span>Créer</span>
            </Link>

            {!isPremium && (
              <button onClick={() => setProModalOpen(true)}
                className="hidden md:flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[0.68rem] font-bold transition hover:opacity-90"
                style={{ background: `${accent}`, color: "#0a0a0a" }}>
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

        {/* Page — gated for free users on non-selected apps */}
        <main className={`flex-1 overflow-auto ${hasOwnMobileNav ? "" : "pb-16 lg:pb-0"}`}>
          {isGated ? <FreeAppGate /> : children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {!hasOwnMobileNav && <BottomNav pathname={pathname} dark={isDark} accent={accent} />}

      {/* Onboarding — affiché une seule fois à la première connexion */}
      <OnboardingModal name={name?.split(" ")[0]} />
    </div>
  );
}
