"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Play, Square, Plus, Trash2, X,
  CheckCircle2, AlertCircle, Loader2,
  Clock, Euro, CalendarDays, Briefcase, User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface TimeEntry {
  id: string;
  user_id: string;
  project: string;
  client_name: string;
  description: string;
  date: string;
  duration_minutes: number;
  hourly_rate: number | null;
  created_at: string;
}

interface ManualDraft {
  project: string;
  client_name: string;
  description: string;
  date: string;
  duration_minutes: string;
  hourly_rate: string;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

/* ═══════════════════════════════════════════════════════════
   FORMATEURS
═══════════════════════════════════════════════════════════ */
const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const fmtDur = (min: number) =>
  min >= 60
    ? `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}m` : ""}`
    : `${min}m`;

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoToLabel(iso: string): string {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Aujourd'hui";
  if (iso === yesterday) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso + "T12:00:00"),
  );
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function emptyManualDraft(): ManualDraft {
  return { project: "", client_name: "", description: "", date: todayISO(), duration_minutes: "", hourly_rate: "" };
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; msg: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.97)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.97)] text-red-300"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-400" />
      ) : (
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 text-white/30 hover:text-white/60">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function ChronoPage() {
  /* ── Entries ── */
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* ── Timer state ── */
  const [running, setRunning] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerClient, setTimerClient] = useState("");
  const [timerRate, setTimerRate] = useState("");
  const [timerDesc, setTimerDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Manual modal ── */
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(emptyManualDraft());
  const [manualSaving, setManualSaving] = useState(false);

  /* ── Helpers ── */
  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
  }

  /* ── Fetch ── */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      showToast("error", `Chargement impossible : ${error.message}`);
    } else {
      setEntries((data as TimeEntry[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* ── Timer tick ── */
  useEffect(() => {
    if (running && startMs !== null) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, startMs]);

  /* ── Start timer ── */
  function handleStart() {
    const now = Date.now();
    setStartMs(now);
    setElapsed(0);
    setRunning(true);
  }

  /* ── Stop timer & save ── */
  async function handleStop() {
    if (!running || startMs === null) return;
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const finalElapsed = Math.floor((Date.now() - startMs) / 1000);
    const duration_minutes = Math.max(1, Math.round(finalElapsed / 60));

    setSaving(true);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      showToast("error", "Non connecté. Veuillez vous reconnecter.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id,
      project: timerProject.trim() || "Sans projet",
      client_name: timerClient.trim() || null,
      description: timerDesc.trim() || null,
      date: todayISO(),
      duration_minutes,
      hourly_rate: timerRate ? parseFloat(timerRate) : null,
    });

    setSaving(false);
    if (error) {
      showToast("error", `Erreur : ${error.message}`);
    } else {
      showToast("success", `Session enregistrée — ${fmtDur(duration_minutes)}`);
      setElapsed(0);
      setStartMs(null);
      await fetchEntries();
    }
  }

  /* ── Delete entry ── */
  async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    setDeleting(null);
    setConfirmDelete(null);
    if (error) {
      showToast("error", error.message);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("success", "Entrée supprimée.");
    }
  }

  /* ── Manual save ── */
  async function handleManualSave() {
    if (!manualDraft.project.trim()) {
      showToast("error", "Le projet est obligatoire.");
      return;
    }
    const mins = parseInt(manualDraft.duration_minutes, 10);
    if (!mins || mins <= 0) {
      showToast("error", "La durée doit être supérieure à 0.");
      return;
    }
    setManualSaving(true);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      showToast("error", "Non connecté.");
      setManualSaving(false);
      return;
    }

    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id,
      project: manualDraft.project.trim(),
      client_name: manualDraft.client_name.trim() || null,
      description: manualDraft.description.trim() || null,
      date: manualDraft.date || todayISO(),
      duration_minutes: mins,
      hourly_rate: manualDraft.hourly_rate ? parseFloat(manualDraft.hourly_rate) : null,
    });

    setManualSaving(false);
    if (error) {
      showToast("error", `Erreur : ${error.message}`);
    } else {
      showToast("success", "Entrée ajoutée.");
      setManualOpen(false);
      setManualDraft(emptyManualDraft());
      await fetchEntries();
    }
  }

  /* ── Weekly stats ── */
  const weekStats = useMemo(() => {
    const weekStart = startOfWeekISO();
    const weekEntries = entries.filter((e) => e.date >= weekStart);
    const totalMinutes = weekEntries.reduce((acc, e) => acc + e.duration_minutes, 0);
    const totalEarnings = weekEntries.reduce((acc, e) => {
      if (e.hourly_rate && e.hourly_rate > 0) {
        return acc + (e.duration_minutes / 60) * e.hourly_rate;
      }
      return acc;
    }, 0);
    return { totalMinutes, totalEarnings };
  }, [entries]);

  /* ── Group entries by date ── */
  const grouped = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of entries) {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  /* ── Day totals ── */
  function dayTotal(dayEntries: TimeEntry[]) {
    return dayEntries.reduce((acc, e) => acc + e.duration_minutes, 0);
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[6%] h-[500px] w-[500px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[150px]" />
        <div className="absolute bottom-[5%] right-[8%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[130px]" />
      </div>

      {/* ── Sub-header ── */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.09)]">
              <Timer size={16} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Chrono Pro</h1>
              <p className="text-[0.65rem] text-white/30">
                {entries.length} entrée{entries.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setManualDraft(emptyManualDraft()); setManualOpen(true); }}
            className="flex items-center gap-2 rounded-xl border border-[rgba(167,139,250,0.25)] bg-[rgba(139,92,246,0.1)] px-4 py-2 text-xs font-semibold text-[#a78bfa] transition hover:bg-[rgba(139,92,246,0.18)]"
          >
            <Plus size={14} />
            Ajout manuel
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-6 sm:px-8 space-y-6">

        {/* ── TIMER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="overflow-hidden rounded-[1.75rem] border border-[rgba(167,139,250,0.15)] bg-[rgba(15,17,23,0.7)] shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        >
          {/* Running indicator bar */}
          <AnimatePresence>
            {running && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.5, ease }}
                style={{ transformOrigin: "left" }}
                className="h-0.5 w-full bg-gradient-to-r from-[#a78bfa] to-[#7c3aed]"
              />
            )}
          </AnimatePresence>

          <div className="px-6 py-7 sm:px-8 sm:py-8">
            {/* Project / client row */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                  Projet
                </label>
                <input
                  value={timerProject}
                  onChange={(e) => setTimerProject(e.target.value)}
                  disabled={running}
                  placeholder="Nom du projet…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/18 focus:border-[rgba(167,139,250,0.45)] disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                  Client
                </label>
                <input
                  value={timerClient}
                  onChange={(e) => setTimerClient(e.target.value)}
                  disabled={running}
                  placeholder="Nom du client…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/18 focus:border-[rgba(167,139,250,0.45)] disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                  Taux horaire (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={timerRate}
                  onChange={(e) => setTimerRate(e.target.value)}
                  disabled={running}
                  placeholder="75"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/18 focus:border-[rgba(167,139,250,0.45)] disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Timer display + button */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Digital clock */}
              <div className="flex flex-col items-center sm:items-start">
                <motion.span
                  key={Math.floor(elapsed / 60)}
                  className="font-mono text-[3.5rem] font-black leading-none tracking-tight sm:text-[4.5rem]"
                  style={{
                    color: running ? "#a78bfa" : "rgba(255,255,255,0.6)",
                    textShadow: running ? "0 0 40px rgba(167,139,250,0.4)" : "none",
                  }}
                >
                  {fmt(elapsed)}
                </motion.span>
                {timerRate && elapsed > 0 && (
                  <span className="mt-1 text-sm font-semibold text-[rgba(167,139,250,0.7)]">
                    {fmtEur((elapsed / 3600) * parseFloat(timerRate))} estimé
                  </span>
                )}
              </div>

              {/* Start / Stop */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={running ? handleStop : handleStart}
                  disabled={saving}
                  className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition active:scale-95 disabled:opacity-40 ${
                    running
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_6px_24px_rgba(239,68,68,0.4)]"
                      : "bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] shadow-[0_6px_24px_rgba(139,92,246,0.45)]"
                  }`}
                >
                  {saving ? (
                    <Loader2 size={22} className="animate-spin text-white" />
                  ) : running ? (
                    <Square size={20} className="fill-white text-white" />
                  ) : (
                    <Play size={22} className="ml-1 fill-white text-white" />
                  )}
                </button>
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                  {saving ? "Enregistrement…" : running ? "Arrêter" : "Démarrer"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-5">
              <input
                value={timerDesc}
                onChange={(e) => setTimerDesc(e.target.value)}
                placeholder="Description optionnelle de la session…"
                className="w-full rounded-xl border border-white/8 bg-transparent px-3.5 py-2 text-sm text-white/60 placeholder:text-white/18 outline-none transition hover:border-white/15 focus:border-[rgba(167,139,250,0.3)]"
              />
            </div>
          </div>
        </motion.div>

        {/* ── WEEKLY SUMMARY ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.55)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.09)]">
              <Clock size={16} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                Heures cette semaine
              </p>
              <p className="mt-0.5 text-xl font-black text-white">
                {fmtDur(weekStats.totalMinutes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.55)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <Euro size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                Revenus cette semaine
              </p>
              <p className="mt-0.5 text-xl font-black" style={{ color: "#c9a55a" }}>
                {weekStats.totalEarnings > 0 ? fmtEur(weekStats.totalEarnings) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── ENTRIES LIST ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/40">
              Historique
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-white/20" />
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/8 bg-[rgba(15,17,23,0.5)] py-20 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.07)]">
                <Timer size={24} style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <p className="text-base font-bold text-white/80">Aucune session enregistrée</p>
                <p className="mt-1 text-sm text-white/30">
                  Démarrez le chronomètre ou ajoutez une entrée manuellement.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {grouped.map(([date, dayEntries]) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    {/* Date header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={12} className="text-white/25" />
                        <span className="text-xs font-bold text-white/50">{isoToLabel(date)}</span>
                      </div>
                      <span className="text-[0.65rem] font-semibold text-white/30">
                        Total : {fmtDur(dayTotal(dayEntries))}
                      </span>
                    </div>

                    {/* Day entries */}
                    <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.55)]">
                      <AnimatePresence initial={false}>
                        {dayEntries.map((entry, idx) => {
                          const earnings =
                            entry.hourly_rate && entry.hourly_rate > 0
                              ? (entry.duration_minutes / 60) * entry.hourly_rate
                              : null;
                          return (
                            <motion.div
                              key={entry.id}
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -16 }}
                              transition={{ duration: 0.2, ease }}
                              className={`group flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/3 ${
                                idx !== dayEntries.length - 1 ? "border-b border-white/5" : ""
                              }`}
                            >
                              {/* Icon */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(167,139,250,0.18)] bg-[rgba(139,92,246,0.08)]">
                                <Briefcase size={13} style={{ color: "#a78bfa" }} />
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="truncate text-sm font-bold text-white/90">
                                    {entry.project}
                                  </span>
                                  {entry.client_name && (
                                    <span className="flex items-center gap-1 text-xs text-white/40">
                                      <User size={9} />
                                      {entry.client_name}
                                    </span>
                                  )}
                                </div>
                                {entry.description && (
                                  <p className="mt-0.5 truncate text-xs text-white/35">
                                    {entry.description}
                                  </p>
                                )}
                              </div>

                              {/* Duration + earnings */}
                              <div className="shrink-0 text-right">
                                <span
                                  className="text-sm font-extrabold"
                                  style={{ color: "#a78bfa" }}
                                >
                                  {fmtDur(entry.duration_minutes)}
                                </span>
                                {earnings !== null && (
                                  <p className="text-[0.65rem] font-semibold text-[rgba(201,165,90,0.8)]">
                                    {fmtEur(earnings)}
                                  </p>
                                )}
                              </div>

                              {/* Delete */}
                              <button
                                onClick={() => setConfirmDelete(entry.id)}
                                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/25 opacity-0 transition hover:border-red-500/30 hover:text-red-400 group-hover:opacity-100"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Manual add bottom sheet ── */}
      <AnimatePresence>
        {manualOpen && (
          <>
            <motion.div
              key="manual-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setManualOpen(false)}
            />
            <motion.div
              key="manual-sheet"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-[2rem] border-t border-x border-white/10 bg-[#0c0e16] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.1)]">
                    <Plus size={14} style={{ color: "#a78bfa" }} />
                  </div>
                  <h2 className="text-sm font-extrabold text-white">Ajout manuel</h2>
                </div>
                <button
                  onClick={() => setManualOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:text-white/70"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="max-h-[72vh] overflow-y-auto px-6 py-5 space-y-4">
                {/* Project */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Projet <span style={{ color: "#a78bfa" }}>*</span>
                  </label>
                  <input
                    value={manualDraft.project}
                    onChange={(e) => setManualDraft((d) => ({ ...d, project: e.target.value }))}
                    placeholder="Nom du projet"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.45)]"
                  />
                </div>

                {/* Client + date */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Client
                    </label>
                    <input
                      value={manualDraft.client_name}
                      onChange={(e) => setManualDraft((d) => ({ ...d, client_name: e.target.value }))}
                      placeholder="Nom du client"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.45)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Date
                    </label>
                    <input
                      type="date"
                      value={manualDraft.date}
                      onChange={(e) => setManualDraft((d) => ({ ...d, date: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.45)]"
                    />
                  </div>
                </div>

                {/* Duration + rate */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Durée (minutes) <span style={{ color: "#a78bfa" }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualDraft.duration_minutes}
                      onChange={(e) => setManualDraft((d) => ({ ...d, duration_minutes: e.target.value }))}
                      placeholder="60"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.45)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Taux horaire (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={manualDraft.hourly_rate}
                      onChange={(e) => setManualDraft((d) => ({ ...d, hourly_rate: e.target.value }))}
                      placeholder="75"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.45)]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Description
                  </label>
                  <textarea
                    value={manualDraft.description}
                    onChange={(e) => setManualDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Description de la session…"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(167,139,250,0.4)]"
                  />
                </div>

                {/* Earnings preview */}
                {manualDraft.hourly_rate && manualDraft.duration_minutes && (
                  <div className="flex items-center justify-between rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.06)] px-4 py-3">
                    <span className="text-xs text-white/40">Revenus estimés</span>
                    <span className="text-sm font-extrabold" style={{ color: "#c9a55a" }}>
                      {fmtEur(
                        (parseInt(manualDraft.duration_minutes, 10) / 60) *
                          parseFloat(manualDraft.hourly_rate),
                      )}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pb-2">
                  <button
                    onClick={() => setManualOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white/70"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={
                      manualSaving ||
                      !manualDraft.project.trim() ||
                      !manualDraft.duration_minutes
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] py-2.5 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {manualSaving && <Loader2 size={14} className="animate-spin" />}
                    {manualSaving ? "Enregistrement…" : "Ajouter l'entrée"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm delete ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer cette entrée ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting === confirmDelete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting === confirmDelete && <Loader2 size={13} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
