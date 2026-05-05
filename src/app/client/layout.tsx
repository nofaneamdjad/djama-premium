"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Calendar, ReceiptText, Sparkles,
  LogOut, Lock, Clock, CheckCircle2, MessageCircle,
  Bell, X,
  CreditCard, Wallet, Users, FileText, Timer, CalendarRange, Search, Star,
  LayoutDashboard, Brain, Zap, Crown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRequireSubscription } from "@/lib/use-require-subscription";

const GOLD = "#c9a55a";

const ALL_TOOLS_NAV = [
  { href: "/client",               label: "Cockpit",      icon: Sparkles,         exact: true as const, color: "#c9a55a" },
  { href: "/client/dashboard",     label: "Dashboard",    icon: LayoutDashboard,  color: "#c9a55a" },
  { href: "/client/factures",      label: "Factures",     icon: ReceiptText,      color: "#4ade80" },
  { href: "/client/crm",           label: "CRM",          icon: Users,            color: "#60a5fa" },
  { href: "/client/depenses",      label: "Dépenses",     icon: CreditCard,       color: "#f97316" },
  { href: "/client/tresorerie",    label: "Trésorerie",   icon: Wallet,           color: "#34d399" },
  { href: "/client/contrats",      label: "Contrats",     icon: FileText,         color: "#c9a55a" },
  { href: "/client/chrono",        label: "Chrono",       icon: Timer,            color: "#a78bfa" },
  { href: "/client/notes",         label: "Notes IA",     icon: StickyNote,       color: "#fbbf24" },
  { href: "/client/planning",      label: "Planning",     icon: Calendar,         color: "#60a5fa" },
  { href: "/client/planification", label: "Équipe",       icon: CalendarRange,    color: "#38bdf8" },
  { href: "/client/reputation",    label: "Réputation",   icon: Star,             color: "#f59e0b" },
  { href: "/client/sourcing",      label: "Sourcing",     icon: Search,           color: "#818cf8" },
  { href: "/coaching-ia/espace",    label: "Coaching IA",  icon: Brain,            color: "#d946ef" },
  { href: "/client/assistant",     label: "Assistant IA", icon: Zap,              color: "#22d3ee" },
  { href: "/client/abonnements",   label: "Abonnements",  icon: Crown,            color: "#c9a55a" },
];

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

  /* Fetch des événements à venir (aujourd'hui + 7j) */
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
    const id = setInterval(load, 60_000); // refresh chaque minute
    return () => clearInterval(id);
  }, [ready]);

  /* Fermeture au clic extérieur */
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
    { label: "Aujourd'hui", evts: todayEvts,    highlight: true,  showDate: false },
    { label: "Demain",      evts: tomorrowEvts,  highlight: false, showDate: false },
    { label: "Cette semaine", evts: laterEvts,   highlight: false, showDate: true  },
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Bouton cloche */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.9 }}
        aria-label={`Notifications planning${badge > 0 ? ` — ${badge} aujourd'hui` : ""}`}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
        title="Notifications planning"
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

      {/* Panel dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0f1117] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          >
            {/* Header dropdown */}
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

            {/* Corps */}
            <div className="max-h-[340px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-white/15" />
                  <p className="text-[0.75rem] text-white/30">Aucun événement cette semaine</p>
                  <Link
                    href="/client/planning"
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold transition hover:opacity-75"
                    style={{ color: GOLD }}
                  >
                    + Ajouter un événement
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  {groups.map(({ label, evts, highlight, showDate }) =>
                    evts.length === 0 ? null : (
                      <div key={label}>
                        {/* Section label */}
                        <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[0.6rem] font-black uppercase tracking-widest"
                          style={{ color: highlight ? GOLD : "rgba(255,255,255,0.25)" }}>
                          {label}
                          {highlight && (
                            <span className="rounded-full bg-[rgba(201,165,90,0.15)] px-1.5 py-0.5" style={{ color: GOLD }}>
                              {evts.length}
                            </span>
                          )}
                        </p>

                        {/* Liste événements */}
                        {evts.map(ev => {
                          const cc = CAT_COLORS[ev.category] ?? CAT_COLORS.autre;
                          return (
                            <Link
                              href="/client/planning"
                              key={ev.id}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.04]"
                            >
                              {/* Icône catégorie */}
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: cc.bg }}
                              >
                                <Calendar size={11} style={{ color: cc.color }} />
                              </div>

                              {/* Texte */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.78rem] font-semibold text-white/85">
                                  {ev.title}
                                </p>
                                <p className="text-[0.67rem] text-white/35">
                                  {showDate ? `${fmtDate(ev.event_date)} · ` : ""}
                                  {ev.event_time ?? "Sans heure"}
                                </p>
                              </div>

                              {/* Dot catégorie */}
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

            {/* Footer */}
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link
                href="/client/planning"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-[0.72rem] font-semibold transition hover:opacity-75"
                style={{ color: GOLD }}
              >
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
          Votre paiement a bien été reçu et enregistré. Notre équipe va activer votre espace client dans les{" "}
          <strong className="text-white/65">plus brefs délais</strong> (généralement sous 24h).
        </p>

        <div className="mb-8 space-y-3 rounded-2xl border border-white/[0.07] bg-[#111113] p-5 text-left">
          {[
            { icon: CheckCircle2, color: "#4ade80", label: "Paiement reçu et validé",                    badge: "Fait",     badgeColor: "#4ade80" },
            { icon: Clock,        color: "#f9a826", label: "Activation de votre accès par DJAMA",         badge: "En cours", badgeColor: "#f9a826" },
            { icon: MessageCircle,color: "#c9a55a", label: "Email de confirmation envoyé dès l'activation", badge: null,    badgeColor: "" },
          ].map(({ icon: Icon, color, label, badge, badgeColor }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{
                  background: `${color}1a`,
                  borderColor: `${color}40`,
                }}
              >
                <Icon size={13} style={{ color }} />
              </div>
              <p className="flex-1 text-sm text-white/55">{label}</p>
              {badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                  style={{ background: `${badgeColor}1a`, color: badgeColor }}
                >
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="https://wa.me/262693523665"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.07)] px-5 py-3 text-sm font-bold text-[#25d366] transition-all hover:bg-[rgba(37,211,102,0.12)]"
          >
            <MessageCircle size={15} /> Contacter DJAMA
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/40 transition-all hover:text-white/70"
          >
            Retour au site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LAYOUT PRINCIPAL
═══════════════════════════════════════════════════ */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { ready, pending } = useRequireSubscription();
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserInitial(email[0]?.toUpperCase() ?? "U");
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
  });

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
    <div className="flex min-h-screen flex-col bg-[#080a0f]">
      {/* Ambient top glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-[280px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.045)] blur-[120px]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 shrink-0 bg-[#080a0f]/96 backdrop-blur-xl">
        {/* Row 1 — Logo + actions */}
        <div className="flex h-12 items-center gap-3 border-b border-[rgba(201,165,90,0.1)] px-4">
          {/* Logo */}
          <Link href="/client" className="group mr-2 flex shrink-0 items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-amber-500/20 blur-sm transition-all group-hover:bg-amber-500/35" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/22 bg-amber-500/14">
                <Sparkles size={13} className="text-amber-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-extrabold leading-none tracking-wider text-[#c9a55a]">DJAMA</p>
              <p className="mt-0.5 text-[8px] font-bold uppercase leading-none tracking-[.18em] text-white/25">Pro</p>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Date */}
          <span className="hidden capitalize text-[11px] font-medium text-white/22 md:inline-flex">
            {today}
          </span>

          {/* Notifications bell */}
          <NotifBell ready={ready} />

          {/* User avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.13)] text-[11px] font-black text-[#c9a55a]">
            {userInitial}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className="flex items-center gap-1 rounded-lg p-1.5 text-white/25 transition-all hover:bg-white/[0.05] hover:text-white/55"
          >
            <LogOut size={13} />
          </button>
        </div>

        {/* Row 2 — Tools nav (scrollable) */}
        <div className="overflow-x-auto scrollbar-none border-b border-white/[0.04] bg-[#080a0f]/80">
          <div className="flex w-max items-center gap-0.5 px-3 py-1.5">
            {ALL_TOOLS_NAV.map(({ href, label, icon: Icon, exact, color }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                    active ? "font-bold" : "text-white/35 hover:bg-white/[0.04] hover:text-white/65"
                  }`}
                  style={active ? {
                    color,
                    background: `${color}14`,
                    outline: `1px solid ${color}28`,
                  } : {}}
                >
                  <Icon size={12} style={active ? { color } : {}} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
