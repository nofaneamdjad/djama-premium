"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, CheckCircle, XCircle, Clock,
  Loader2, RefreshCw, X, Search,
  LayoutGrid, CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Reservation = {
  id:           string;
  client_name:  string;
  client_email: string;
  service:      string;
  scheduled_at: string;
  duration_min: number;
  status:       string;
  notes:        string;
  created_at:   string;
};

type FilterStatus = "tous" | "confirmé" | "en attente" | "annulé" | "terminé";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusStyle(s: string) {
  if (s === "confirmé")   return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "en attente") return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "annulé")     return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "terminé")    return "text-white/35 bg-white/[0.06]";
  return "text-white/40 bg-white/[0.06]";
}

function serviceColor(t: string) {
  if (t.toLowerCase().includes("découverte")) return "#c9a55a";
  if (t.toLowerCase().includes("coaching"))   return "#a78bfa";
  if (t.toLowerCase().includes("soutien"))    return "#60a5fa";
  return "#4ade80";
}

function formatScheduledAt(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  } catch {
    return { date: iso, time: "" };
  }
}

function isUpcoming(iso: string) {
  try {
    return new Date(iso) > new Date();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Calendar View
// ---------------------------------------------------------------------------

function CalendarView({
  reservations,
  month,
  onMonthChange,
}: {
  reservations: Reservation[];
  month: Date;
  onMonthChange: (d: Date) => void;
}) {
  const year = month.getFullYear();
  const mon  = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  // Group reservations by date
  const byDate: Record<string, Reservation[]> = {};
  for (const r of reservations) {
    if (!r.scheduled_at) continue;
    const d = new Date(r.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === mon) {
      const key = d.getDate().toString();
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(r);
    }
  }

  const days: (number | null)[] = [];
  // Start from Monday: convert getDay() (0=Sun) to Monday-first
  const startOffset = (firstDay + 6) % 7;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  // Pad to complete last week
  while (days.length % 7 !== 0) days.push(null);

  const monthLabel = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === mon && today.getDate() === d;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={() => onMonthChange(new Date(year, mon - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-xl text-white/35 hover:bg-white/[0.06] hover:text-white/65 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className="text-[0.92rem] font-black text-white capitalize">{monthLabel}</p>
        <button onClick={() => onMonthChange(new Date(year, mon + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-xl text-white/35 hover:bg-white/[0.06] hover:text-white/65 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-white/[0.04]">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
          <div key={d} className="py-2.5 text-center text-[0.66rem] font-bold uppercase tracking-[0.08em] text-white/20">{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[80px] border-b border-r border-white/[0.04]" />;
          const dayReservations = byDate[d.toString()] ?? [];
          return (
            <div key={i} className={`min-h-[80px] border-b border-r border-white/[0.04] p-2 transition-colors hover:bg-white/[0.02] ${isToday(d) ? "bg-[rgba(201,165,90,0.04)]" : ""}`}>
              <div className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.75rem] font-bold ${isToday(d) ? "bg-[#c9a55a] text-[#09090b]" : "text-white/30"}`}>
                {d}
              </div>
              <div className="space-y-0.5">
                {dayReservations.slice(0, 3).map(r => (
                  <div key={r.id} className={`truncate rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                    r.status === "confirmé"   ? "bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                    r.status === "en attente" ? "bg-[rgba(251,191,36,0.12)] text-[#fbbf24]" :
                    r.status === "annulé"     ? "bg-[rgba(248,113,113,0.10)] text-[#f87171]" :
                    "bg-white/[0.06] text-white/35"
                  }`}>
                    {new Date(r.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {r.client_name}
                  </div>
                ))}
                {dayReservations.length > 3 && (
                  <div className="text-[0.58rem] text-white/25">+{dayReservations.length - 3} autres</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [updating,     setUpdating]     = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"cards" | "calendar">("cards");
  const [calMonth,     setCalMonth]     = useState(() => new Date());

  const loadRef = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchReservations(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (error) {
        console.error("[Admin Reservations] fetch error:", error);
        setLoadError("Impossible de charger les réservations.");
        return;
      }

      setReservations((data ?? []) as Reservation[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    fetchReservations();
  }, []);

  // ── Update status ────────────────────────────────────────────────────────

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[Admin Reservations] update error:", error);
    } else {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
    setUpdating(null);
  }

  // ── Filtered ─────────────────────────────────────────────────────────────

  const filtered = reservations.filter(r => {
    const matchStatus = filterStatus === "tous" || r.status === filterStatus;
    const matchSearch = !search ||
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.client_email.toLowerCase().includes(search.toLowerCase()) ||
      r.service.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const confirmed  = reservations.filter(r => r.status === "confirmé").length;
  const pending    = reservations.filter(r => r.status === "en attente").length;
  const cancelled  = reservations.filter(r => r.status === "annulé").length;
  const upcoming   = reservations.filter(r => r.status === "confirmé" && isUpcoming(r.scheduled_at)).length;

  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: "tous",       label: "Tous",       count: reservations.length },
    { key: "confirmé",   label: "Confirmés",  count: confirmed },
    { key: "en attente", label: "En attente", count: pending },
    { key: "annulé",     label: "Annulés",    count: cancelled },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Réservations</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {loading ? "Chargement…" : `${confirmed} confirmée${confirmed !== 1 ? "s" : ""} · ${pending} en attente · ${upcoming} à venir`}
          </p>
        </div>
        <button
          onClick={() => fetchReservations(false)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181c] px-3.5 py-2.5 text-[0.8rem] text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",       value: reservations.length, color: "rgba(255,255,255,0.5)" },
          { label: "Confirmés",   value: confirmed,           color: "#4ade80" },
          { label: "En attente",  value: pending,             color: "#fbbf24" },
          { label: "À venir",     value: upcoming,            color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#18181c] px-4 py-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">{s.label}</p>
            {loading ? (
              <div className="h-7 w-10 rounded-lg bg-white/[0.07] animate-pulse" />
            ) : (
              <p className="text-[1.6rem] font-black" style={{ color: s.color }}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {loadError && (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-5 py-4 text-[0.84rem] text-[#f87171]">
          <X size={15} /> {loadError}
        </div>
      )}

      {/* Filter tabs + search + view toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilterStatus(t.key)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.8rem] font-semibold transition-all ${
              filterStatus === t.key
                ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white/65 border border-transparent"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
              filterStatus === t.key ? "bg-[rgba(201,165,90,0.2)] text-[#c9a55a]" : "bg-white/[0.07] text-white/30"
            }`}>
              {loading ? "·" : t.count}
            </span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-48 rounded-xl border border-white/[0.07] bg-[#18181c] py-2 pl-8 pr-3 text-[0.8rem] text-white placeholder-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.35)]"
          />
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-[#18181c] p-1">
          <button onClick={() => setView("cards")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-all ${view === "cards" ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a]" : "text-white/35 hover:text-white/60"}`}>
            <LayoutGrid size={13} /> Cartes
          </button>
          <button onClick={() => setView("calendar")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-all ${view === "calendar" ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a]" : "text-white/35 hover:text-white/60"}`}>
            <CalendarDays size={13} /> Calendrier
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : view === "calendar" ? (
        <CalendarView
          reservations={reservations}
          month={calMonth}
          onMonthChange={setCalMonth}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#18181c] py-16">
          <Calendar size={32} className="text-white/15" />
          <p className="text-[0.88rem] text-white/30">
            {search || filterStatus !== "tous"
              ? "Aucune réservation pour ces filtres"
              : "Aucune réservation pour le moment"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(r => {
            const { date, time } = formatScheduledAt(r.scheduled_at);
            const color = serviceColor(r.service);
            const isUpdating = updating === r.id;
            const soon = isUpcoming(r.scheduled_at) && r.status === "confirmé";

            return (
              <div
                key={r.id}
                className={`rounded-2xl border bg-[#18181c] p-5 transition-all ${
                  soon ? "border-[rgba(74,222,128,0.15)]" : "border-white/[0.06]"
                }`}
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}14` }}
                    >
                      <Calendar size={15} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[0.84rem] font-bold text-white/85">{r.client_name}</p>
                      <p className="text-[0.72rem] truncate max-w-[140px]" style={{ color }}>{r.service}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                    {soon && (
                      <span className="text-[0.6rem] text-[#4ade80]/70 font-semibold">À venir</span>
                    )}
                  </div>
                </div>

                {/* Date / heure */}
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <Clock size={13} className="text-white/25 shrink-0" />
                  <span className="text-[0.8rem] text-white/50">
                    {date}{time ? ` à ${time}` : ""}
                    {r.duration_min ? ` · ${r.duration_min} min` : ""}
                  </span>
                </div>

                {/* Email */}
                <p className="mb-1 text-[0.73rem] text-white/30 truncate">{r.client_email}</p>

                {/* Notes */}
                {r.notes && (
                  <p className="mb-3 text-[0.7rem] text-white/20 line-clamp-2">{r.notes}</p>
                )}

                {/* Actions */}
                {r.status === "en attente" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "confirmé")}
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[rgba(74,222,128,0.12)] py-2 text-[0.78rem] font-bold text-[#4ade80] transition-colors hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                      Confirmer
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "annulé")}
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[rgba(248,113,113,0.10)] py-2 text-[0.78rem] font-bold text-[#f87171] transition-colors hover:bg-[rgba(248,113,113,0.16)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                      Annuler
                    </button>
                  </div>
                )}
                {r.status === "confirmé" && (
                  <div className="mt-3">
                    <button
                      onClick={() => updateStatus(r.id, "terminé")}
                      disabled={isUpdating}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] py-2 text-[0.76rem] font-semibold text-white/35 transition-colors hover:bg-white/[0.09] hover:text-white/60 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Marquer terminé
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
