"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Calendar, ReceiptText,
  LogOut, Lock, Clock, CheckCircle2, MessageCircle,
  Bell, X, Menu,
  CreditCard, Wallet, Users, FileText, Timer, CalendarRange, Search, Star,
  LayoutDashboard, Brain, Zap, Mic, ChevronRight,
  Package, Truck, ListTodo, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireSubscription } from "@/lib/use-require-subscription";

const GOLD = "#c9a55a";
const NAVY = "#0a0f1e";
const SIDEBAR_BG = "#070c18";
const BORDER = "rgba(255,255,255,0.06)";

type NavEntry = { href: string; label: string; icon: React.ElementType; exact?: boolean };

const NAV_GROUPS: { label: string | null; items: NavEntry[] }[] = [
  {
    label: null,
    items: [
      { href: "/client",           label: "Cockpit",      icon: LayoutDashboard, exact: true },
      { href: "/client/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/client/factures",   label: "Factures & Devis", icon: ReceiptText  },
      { href: "/client/depenses",   label: "Dépenses",         icon: CreditCard   },
      { href: "/client/tresorerie", label: "Trésorerie",       icon: Wallet       },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/client/crm",         label: "CRM",          icon: Users    },
      { href: "/client/contrats",    label: "Contrats",     icon: FileText },
      { href: "/client/fournisseurs",label: "Fournisseurs", icon: Truck    },
      { href: "/client/stocks",      label: "Stocks",       icon: Package  },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/client/productivite", label: "Tâches",       icon: ListTodo      },
      { href: "/client/planning",     label: "Planning",     icon: Calendar      },
      { href: "/client/equipe",       label: "Équipe",       icon: CalendarRange },
      { href: "/client/chrono",       label: "Chrono",       icon: Timer         },
    ],
  },
  {
    label: "Notes",
    items: [
      { href: "/client/notes",    label: "Notes IA",   icon: StickyNote },
      { href: "/client/bloc-note",label: "Bloc-note",  icon: Mic        },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/client/sourcing",    label: "Sourcing IA",  icon: Search },
      { href: "/client/assistant",   label: "Assistant IA", icon: Zap    },
      { href: "/client/reputation",  label: "Réputation",   icon: Star   },
      { href: "/coaching-ia/espace", label: "Coaching IA",  icon: Brain  },
    ],
  },
];

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
        aria-label={`Notifications${badge > 0 ? ` — ${badge} aujourd'hui` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
      >
        <Bell size={15} />
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.52rem] font-black"
            style={{ background: GOLD, color: "#07090f" }}>
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
            className="absolute right-0 top-10 z-50 w-76 overflow-hidden rounded-xl border shadow-2xl"
            style={{ background: "#0d1220", borderColor: BORDER }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: BORDER }}>
              <span className="text-xs font-semibold text-slate-300">Événements à venir</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-slate-500 hover:text-slate-300 transition">
                <X size={13} />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Calendar size={20} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs text-slate-500">Aucun événement cette semaine</p>
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
                      <p className="px-4 pb-1 pt-3 text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                      {evts.map(ev => (
                        <Link href="/client/planning" key={ev.id} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.03]">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: GOLD }} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-200">{ev.title}</p>
                            <p className="text-[0.65rem] text-slate-500">
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

            <div className="border-t px-4 py-2.5" style={{ borderColor: BORDER }}>
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

/* ─────────────────────────────────────────────────
   PENDING SCREEN
───────────────────────────────────────────────── */
function PendingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-0 px-6" style={{ background: NAVY }}>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{ background: "rgba(201,165,90,0.08)", borderColor: "rgba(201,165,90,0.2)" }}>
          <Clock size={28} style={{ color: GOLD }} />
        </div>
        <h1 className="mb-3 text-xl font-bold text-white">Votre accès sera activé prochainement</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-400">
          Votre paiement a bien été reçu. Notre équipe activera votre espace sous 24h.
        </p>
        <div className="mb-6 space-y-2.5 rounded-xl border p-4 text-left" style={{ borderColor: BORDER, background: "#0d1220" }}>
          {[
            { icon: CheckCircle2,  color: "#4ade80", label: "Paiement reçu et validé",           badge: "Fait",     badgeColor: "#4ade80" },
            { icon: Clock,         color: GOLD,      label: "Activation de votre accès par DJAMA", badge: "En cours", badgeColor: GOLD },
            { icon: MessageCircle, color: "#60a5fa", label: "Email de confirmation à l'activation", badge: null,       badgeColor: "" },
          ].map(({ icon: Icon, color, label, badge, badgeColor }, i) => (
            <div key={i} className="flex items-center gap-3">
              <Icon size={14} style={{ color }} />
              <p className="flex-1 text-sm text-slate-300">{label}</p>
              {badge && (
                <span className="rounded-md px-2 py-0.5 text-[0.65rem] font-semibold"
                  style={{ background: `${badgeColor}1a`, color: badgeColor }}>
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <a href="https://wa.me/262693523665" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#25d366] transition hover:opacity-80"
            style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
            <MessageCircle size={15} /> Contacter DJAMA
          </a>
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
            style={{ borderColor: BORDER }}>
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────── */
function NavItem({
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
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium transition-colors duration-100 ${
        active
          ? "text-white"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
      style={active ? { background: `${GOLD}14` } : {}}
    >
      {/* Active indicator */}
      <span
        className="absolute left-0 h-4 w-0.5 rounded-r-full transition-opacity"
        style={{ background: GOLD, opacity: active ? 1 : 0 }}
      />
      <Icon
        size={14}
        style={{ color: active ? GOLD : undefined }}
        className={active ? "" : "text-slate-500 group-hover:text-slate-300"}
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────
   LAYOUT
───────────────────────────────────────────────── */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { ready, pending } = useRequireSubscription();
  const [userInitial, setUserInitial] = useState("U");
  const [userEmail,   setUserEmail]   = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserInitial(email[0]?.toUpperCase() ?? "U");
      setUserEmail(email);
    });
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const currentLabel = NAV_GROUPS
    .flatMap(g => g.items)
    .find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))
    ?.label ?? "Espace client";

  if (pending) return <PendingScreen />;

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: NAVY }}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Lock size={10} /> Vérification de l&apos;accès…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: NAVY }}>

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

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-56 flex-col
          border-r transition-transform duration-250 ease-out
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: SIDEBAR_BG, borderColor: BORDER }}
      >
        {/* Logo */}
        <div className="flex h-13 shrink-0 items-center justify-between border-b px-4 py-3.5" style={{ borderColor: BORDER }}>
          <Link href="/client" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}28` }}>
              <Sparkles size={13} style={{ color: GOLD }} />
            </div>
            <div className="leading-none">
              <p className="text-[0.88rem] font-bold tracking-wide" style={{ color: GOLD }}>DJAMA</p>
              <p className="text-[0.55rem] uppercase tracking-widest text-slate-600 mt-0.5">Pro</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="text-slate-500 hover:text-slate-300 transition lg:hidden">
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-2 py-2 scrollbar-none">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.label && (
                <p className="mb-1 px-2.5 text-[0.6rem] font-semibold uppercase tracking-wider text-slate-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-px relative">
                {group.items.map(item => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    exact={item.exact ?? false}
                    pathname={pathname}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t p-2" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}25`, color: GOLD }}>
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.72rem] font-medium text-slate-300">{userEmail || "Mon compte"}</p>
              <p className="text-[0.58rem] text-slate-600">DJAMA PRO</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-400">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENU ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="flex h-13 shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: BORDER, background: `${SIDEBAR_BG}f0`, backdropFilter: "blur(12px)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200 lg:hidden">
            <Menu size={16} />
          </button>

          {/* Breadcrumb mobile */}
          <p className="flex-1 text-sm font-semibold text-slate-200 lg:hidden">{currentLabel}</p>

          <div className="hidden flex-1 lg:block" />

          <div className="flex items-center gap-2">
            <NotifBell ready={ready} />
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[0.65rem] font-bold"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}25`, color: GOLD }}>
              {userInitial}
            </div>
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
