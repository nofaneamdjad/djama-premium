"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Calendar, ReceiptText, Sparkles,
  LogOut, Lock, Clock, CheckCircle2, MessageCircle,
  Bell, X, Menu,
  CreditCard, Wallet, Users, FileText, Timer, CalendarRange, Search, Star,
  LayoutDashboard, Brain, Zap, Mic, ChevronRight,
  Globe, Package, Truck, ListTodo,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireSubscription } from "@/lib/use-require-subscription";

const GOLD = "#c9a55a";

/* ═══════════════════════════════════════════════════
   NAVIGATION — groupée par catégorie
═══════════════════════════════════════════════════ */
type NavEntry = { href: string; label: string; icon: React.ElementType; color: string; exact?: boolean };

const NAV_GROUPS: { label: string | null; items: NavEntry[] }[] = [
  {
    label: null,
    items: [
      { href: "/client",           label: "Cockpit",      icon: Sparkles,       exact: true, color: "#c9a55a" },
      { href: "/client/dashboard", label: "Dashboard",    icon: LayoutDashboard,             color: "#c9a55a" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/client/factures",   label: "Factures",    icon: ReceiptText,   color: "#4ade80" },
      { href: "/client/crm",        label: "CRM",         icon: Users,         color: "#60a5fa" },
      { href: "/client/depenses",   label: "Dépenses",    icon: CreditCard,    color: "#f97316" },
      { href: "/client/tresorerie", label: "Trésorerie",  icon: Wallet,        color: "#34d399" },
      { href: "/client/contrats",   label: "Contrats IA", icon: FileText,      color: "#c9a55a" },
      { href: "/client/stocks",       label: "Stocks",        icon: Package,       color: "#10b981" },
      { href: "/client/fournisseurs", label: "Fournisseurs",  icon: Truck,         color: "#8b5cf6" },
    ],
  },
  {
    label: "Productivité",
    items: [
      { href: "/client/productivite",   label: "Tâches",      icon: ListTodo,     color: "#8b5cf6" },
      { href: "/client/chrono",        label: "Chrono",      icon: Timer,        color: "#a78bfa" },
      { href: "/client/notes",         label: "Notes IA",    icon: StickyNote,   color: "#fbbf24" },
      { href: "/client/bloc-note",     label: "Bloc Note",   icon: Mic,          color: "#a78bfa" },
      { href: "/client/planning",      label: "Planning",    icon: Calendar,     color: "#60a5fa" },
      { href: "/client/equipe",        label: "Équipe",      icon: CalendarRange,color: "#38bdf8" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/client/sourcing",   label: "Sourcing IA",   icon: Search,  color: "#818cf8" },
      { href: "/coaching-ia/espace",label: "Coaching IA",   icon: Brain,   color: "#d946ef" },
      { href: "/client/assistant",  label: "Assistant IA",  icon: Zap,     color: "#22d3ee" },
      { href: "/client/reputation", label: "Réputation",    icon: Star,    color: "#f59e0b" },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
type UpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  category: string;
};

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  travail:   { color: "#c9a55a", bg: "rgba(201,165,90,0.12)" },
  réunion:   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  personnel: { color: "#4ade80", bg: "rgba(74,222,128,0.10)" },
  autre:     { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

function isoToday() { return new Date().toISOString().split("T")[0]; }
function isoTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function isoIn7() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
  });
}

/* ═══════════════════════════════════════════════════
   CLOCHE NOTIFICATIONS
═══════════════════════════════════════════════════ */
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
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true, nullsFirst: false });
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

  const today    = isoToday();
  const tomorrow = isoTomorrow();
  const todayEvts    = events.filter(e => e.event_date === today);
  const tomorrowEvts = events.filter(e => e.event_date === tomorrow);
  const laterEvts    = events.filter(e => e.event_date > tomorrow);
  const badge        = todayEvts.length;

  const groups = [
    { label: "Aujourd'hui",   evts: todayEvts,    highlight: true,  showDate: false },
    { label: "Demain",        evts: tomorrowEvts, highlight: false, showDate: false },
    { label: "Cette semaine", evts: laterEvts,    highlight: false, showDate: true  },
  ];

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.9 }}
        aria-label={`Notifications${badge > 0 ? ` — ${badge} aujourd'hui` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
      >
        <Bell size={15} />
        {badge > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a55a] text-[0.52rem] font-black text-[#09090b]"
          >
            {badge > 9 ? "9+" : badge}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0f1117] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={13} style={{ color: GOLD }} />
                <span className="text-[0.78rem] font-bold text-white">Événements à venir</span>
                {events.length > 0 && (
                  <span className="rounded-full bg-[rgba(201,165,90,0.14)] px-1.5 py-0.5 text-[0.6rem] font-black" style={{ color: GOLD }}>
                    {events.length}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-white/25 transition hover:text-white/60">
                <X size={13} />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-white/15" />
                  <p className="text-[0.75rem] text-white/30">Aucun événement cette semaine</p>
                  <Link href="/client/planning" onClick={() => setOpen(false)}
                    className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold transition hover:opacity-75"
                    style={{ color: GOLD }}>
                    + Ajouter un événement
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  {groups.map(({ label, evts, highlight, showDate }) =>
                    evts.length === 0 ? null : (
                      <div key={label}>
                        <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[0.6rem] font-black uppercase tracking-widest"
                          style={{ color: highlight ? GOLD : "rgba(255,255,255,0.25)" }}>
                          {label}
                          {highlight && (
                            <span className="rounded-full bg-[rgba(201,165,90,0.15)] px-1.5 py-0.5" style={{ color: GOLD }}>
                              {evts.length}
                            </span>
                          )}
                        </p>
                        {evts.map(ev => {
                          const cc = CAT_COLORS[ev.category] ?? CAT_COLORS.autre;
                          return (
                            <Link href="/client/planning" key={ev.id} onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.04]">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl" style={{ background: cc.bg }}>
                                <Calendar size={11} style={{ color: cc.color }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.78rem] font-semibold text-white/85">{ev.title}</p>
                                <p className="text-[0.67rem] text-white/35">
                                  {showDate ? `${fmtDate(ev.event_date)} · ` : ""}
                                  {ev.event_time ?? "Sans heure"}
                                </p>
                              </div>
                              <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cc.color }} />
                            </Link>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link href="/client/planning" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-[0.72rem] font-semibold transition hover:opacity-75"
                style={{ color: GOLD }}>
                <Calendar size={11} /> Voir le planning complet
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ÉCRAN EN ATTENTE D'ACTIVATION
═══════════════════════════════════════════════════ */
function PendingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-0 bg-[#080a0f] px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-[rgba(249,168,38,0.06)] blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)]">
          <Clock size={36} className="text-[#f9a826]" />
        </div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.07)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#f9a826]">
          <CheckCircle2 size={11} /> Paiement confirmé
        </div>
        <h1 className="mb-4 text-2xl font-black text-white sm:text-3xl">
          Votre accès sera activé prochainement
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-white/40">
          Votre paiement a bien été reçu. Notre équipe va activer votre espace dans les{" "}
          <strong className="text-white/65">plus brefs délais</strong> (généralement sous 24h).
        </p>
        <div className="mb-8 space-y-3 rounded-2xl border border-white/[0.07] bg-[#111113] p-5 text-left">
          {[
            { icon: CheckCircle2, color: "#4ade80", label: "Paiement reçu et validé",                     badge: "Fait",     badgeColor: "#4ade80" },
            { icon: Clock,        color: "#f9a826", label: "Activation de votre accès par DJAMA",          badge: "En cours", badgeColor: "#f9a826" },
            { icon: MessageCircle,color: "#c9a55a", label: "Email de confirmation envoyé dès l'activation", badge: null,      badgeColor: "" },
          ].map(({ icon: Icon, color, label, badge, badgeColor }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{ background: `${color}1a`, borderColor: `${color}40` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <p className="flex-1 text-sm text-white/55">{label}</p>
              {badge && (
                <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                  style={{ background: `${badgeColor}1a`, color: badgeColor }}>
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="https://wa.me/262693523665" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.07)] px-5 py-3 text-sm font-bold text-[#25d366] transition-all hover:bg-[rgba(37,211,102,0.12)]">
            <MessageCircle size={15} /> Contacter DJAMA
          </a>
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/40 transition-all hover:text-white/70">
            Retour au site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SIDEBAR NAV ITEM
═══════════════════════════════════════════════════ */
function NavItem({
  href, label, icon: Icon, color, exact = false, pathname, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  color: string; exact?: boolean; pathname: string;
  onClick?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] font-semibold transition-all duration-150 ${
        active
          ? "text-white"
          : "text-white/40 hover:bg-white/[0.04] hover:text-white/75"
      }`}
      style={active ? { background: `${color}18`, color } : {}}
    >
      {/* Active left bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
          style={{ background: color }}
        />
      )}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
        style={active
          ? { background: `${color}22`, border: `1px solid ${color}33` }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }
        }
      >
        <Icon size={13} style={{ color: active ? color : "rgba(255,255,255,0.35)" }} />
      </div>
      <span className="flex-1">{label}</span>
      {active && <ChevronRight size={11} style={{ color }} className="opacity-60" />}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════
   LAYOUT PRINCIPAL
═══════════════════════════════════════════════════ */
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

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (pending) return <PendingScreen />;

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
    <div className="flex h-screen overflow-hidden bg-[#080a0f]">

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : undefined }}
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col
          border-r border-white/[0.06] bg-[#0a0b10]
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:static lg:z-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
          <Link href="/client" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg blur-sm" style={{ background: GOLD + "30" }} />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{ backgroundColor: GOLD + "15", borderColor: GOLD + "28" }}>
                <Sparkles size={14} style={{ color: GOLD }} />
              </div>
            </div>
            <div>
              <p className="text-[0.92rem] font-black leading-none tracking-wider" style={{ color: GOLD }}>DJAMA</p>
              <p className="mt-0.5 text-[0.6rem] font-bold uppercase leading-none tracking-[.18em] text-white/25">Pro</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/25 hover:text-white/60 lg:hidden transition">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="mb-1 px-3 text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/20">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    color={item.color}
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
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[0.7rem] font-black"
              style={{ borderColor: GOLD + "30", background: GOLD + "12", color: GOLD }}>
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.72rem] font-semibold text-white/70">{userEmail || "Mon compte"}</p>
              <p className="text-[0.6rem] text-white/25">DJAMA PRO</p>
            </div>
            <button onClick={handleLogout} title="Se déconnecter"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/55">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ══════════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#080a0f]/95 px-4 backdrop-blur-xl">
          {/* Hamburger mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70 lg:hidden"
          >
            <Menu size={16} />
          </button>

          {/* Page title (mobile) */}
          <div className="flex-1 lg:hidden">
            <p className="text-sm font-bold text-white/70 capitalize">
              {NAV_GROUPS.flatMap(g => g.items).find(item =>
                item.exact ? pathname === item.href : pathname.startsWith(item.href)
              )?.label ?? "Espace client"}
            </p>
          </div>

          <div className="hidden flex-1 lg:block" />

          {/* Actions */}
          <NotifBell ready={ready} />

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[0.7rem] font-black"
            style={{ borderColor: GOLD + "30", background: GOLD + "12", color: GOLD }}>
            {userInitial}
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
