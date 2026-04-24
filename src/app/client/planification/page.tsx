"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Plus, ChevronLeft, ChevronRight,
  Clock, User, Briefcase, Trash2, X, Loader2,
  CheckCircle2, AlertCircle, CalendarDays, LayoutList,
  Tag, Bell,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface PlanningSlot {
  id: string;
  user_id: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  start_time: string;     // "HH:MM"
  end_time: string;       // "HH:MM"
  type: string;
  employee: string | null;
  role: string | null;
  note: string | null;
  created_at: string;
}

type DraftSlot = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  employee: string;
  role: string;
  note: string;
  notify_email: string;    // email destinataire (optionnel)
};

type View = "semaine" | "liste";

/* ═══════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT = "#38bdf8";

const SLOT_TYPES: { value: string; label: string; color: string }[] = [
  { value: "tache",     label: "Tâche",       color: "#38bdf8" },
  { value: "reunion",   label: "Réunion",     color: "#a78bfa" },
  { value: "chantier",  label: "Chantier",    color: "#4ade80" },
  { value: "formation", label: "Formation",   color: "#f59e0b" },
  { value: "conge",     label: "Congé",       color: "#f87171" },
  { value: "autre",     label: "Autre",       color: "#94a3b8" },
];

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_LABELS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function getWeekDays(ref: Date): Date[] {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return toISO(new Date());
}

function fmtWeekRange(days: Date[]): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = days[0].toLocaleDateString("fr-FR", opts);
  const end = days[6].toLocaleDateString("fr-FR", { ...opts, year: "numeric" });
  return `${start} — ${end}`;
}

function fmtDayHeader(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotDuration(s: PlanningSlot): string {
  const diff = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}m`;
}

function typeColor(type: string): string {
  return SLOT_TYPES.find((t) => t.value === type)?.color ?? "#94a3b8";
}
function typeLabel(type: string): string {
  return SLOT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function emptyDraft(date?: string): DraftSlot {
  return {
    title: "", date: date ?? todayISO(),
    start_time: "09:00", end_time: "10:00",
    type: "tache", employee: "", role: "", note: "",
    notify_email: "",
  };
}

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl ${
        toast.type === "success"
          ? "border-sky-500/20 bg-[rgba(15,23,42,0.97)] text-sky-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.97)] text-red-300"
      }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-sky-400" />
        : <AlertCircle  size={15} className="mt-0.5 shrink-0 text-red-400" />}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 text-white/30 hover:text-white/60">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SLOT CARD
═══════════════════════════════════════════════════════ */
function SlotCard({
  slot,
  onDelete,
}: {
  slot: PlanningSlot;
  onDelete: (id: string) => void;
}) {
  const color = typeColor(slot.type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease }}
      className="group relative flex flex-col gap-1 rounded-xl border p-2.5 text-left transition"
      style={{
        backgroundColor: `${color}12`,
        borderColor: `${color}30`,
      }}
    >
      {/* Color bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="pl-2">
        <p className="text-[0.75rem] font-bold leading-tight text-white/90 truncate">
          {slot.title}
        </p>
        <p className="mt-0.5 text-[0.65rem] font-medium" style={{ color }}>
          {slot.start_time}–{slot.end_time}
          {slotDuration(slot) && <span className="ml-1 opacity-60">({slotDuration(slot)})</span>}
        </p>
        {slot.employee && (
          <p className="mt-0.5 flex items-center gap-1 text-[0.62rem] text-white/40 truncate">
            <User size={8} /> {slot.employee}
            {slot.role && <span className="text-white/25">· {slot.role}</span>}
          </p>
        )}
      </div>
      {/* Delete on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(slot.id); }}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100 hover:text-red-400 text-white/20"
      >
        <Trash2 size={10} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function PlanificationPage() {
  /* ── State ── */
  const [slots, setSlots]         = useState<PlanningSlot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState<string | null>(null);
  const [view, setView]           = useState<View>("semaine");
  const [weekRef, setWeekRef]     = useState<Date>(new Date());
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* ── Modal ── */
  const [modalOpen, setModalOpen]   = useState(false);
  const [draft, setDraft]           = useState<DraftSlot>(emptyDraft());
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  /* ── Week days ── */
  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);
  const today    = todayISO();

  /* ── Show toast ── */
  const showToast = (type: "success" | "error", msg: string) =>
    setToast({ type, msg });

  /* ── Fetch slots for current week ── */
  const fetchSlots = useCallback(async (uid: string, days: Date[]) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("planning_slots")
      .select("*")
      .eq("user_id", uid)
      .gte("date", toISO(days[0]))
      .lte("date", toISO(days[6]))
      .order("start_time");
    if (!error && data) setSlots(data as PlanningSlot[]);
    setLoading(false);
  }, []);

  /* ── Auth + initial fetch ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchSlots(user.id, weekDays);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Refetch on week change ── */
  useEffect(() => {
    if (userId) fetchSlots(userId, weekDays);
  }, [weekRef, userId, fetchSlots, weekDays]);

  /* ── Navigate week ── */
  const prevWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
  const nextWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };
  const goToday  = () => setWeekRef(new Date());

  /* ── Open modal on a specific day ── */
  const openAddModal = (date?: string) => {
    setDraft(emptyDraft(date));
    setModalOpen(true);
  };

  /* ── Save slot + notify ── */
  const handleSave = async () => {
    if (!draft.title.trim()) { showToast("error", "Titre obligatoire"); return; }
    if (!draft.start_time || !draft.end_time) { showToast("error", "Heures requises"); return; }
    if (timeToMinutes(draft.end_time) <= timeToMinutes(draft.start_time)) {
      showToast("error", "L'heure de fin doit être après l'heure de début"); return;
    }
    if (!userId) return;
    setSaving(true);

    /* 1. Insert Supabase */
    const { data, error } = await supabase
      .from("planning_slots")
      .insert({
        user_id:    userId,
        title:      draft.title.trim(),
        date:       draft.date,
        start_time: draft.start_time,
        end_time:   draft.end_time,
        type:       draft.type,
        employee:   draft.employee.trim() || null,
        role:       draft.role.trim() || null,
        note:       draft.note.trim() || null,
      })
      .select()
      .single();

    if (error) {
      setSaving(false);
      showToast("error", error.message);
      return;
    }

    setSlots((prev) => [...prev, data as PlanningSlot].sort((a, b) =>
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
    ));
    setModalOpen(false);

    /* 2. Notifications (fire-and-forget — ne bloque pas l'UX) */
    const notifyPayload: Record<string, string | null | undefined> = {
      title:      draft.title.trim(),
      date:       draft.date,
      start_time: draft.start_time,
      end_time:   draft.end_time,
      type:       draft.type,
      employee:   draft.employee.trim() || null,
      role:       draft.role.trim() || null,
      note:       draft.note.trim() || null,
      to_email:   draft.notify_email.trim() || undefined,
    };

    fetch("/api/planification/notify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(notifyPayload),
    })
      .then(async (r) => {
        const json = await r.json() as { results?: Record<string, string>; errors?: Record<string, string> };
        if (json.errors && Object.keys(json.errors).length > 0) {
          console.warn("[notify] erreurs partielles", json.errors);
        }
      })
      .catch((e) => console.warn("[notify] fetch error", e));

    setSaving(false);
    showToast(
      "success",
      draft.notify_email.trim()
        ? "Créneau ajouté · notification envoyée ✓"
        : "Créneau ajouté ✓"
    );
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    const { error } = await supabase.from("planning_slots").delete().eq("id", confirmDel);
    setDeleting(false);
    setConfirmDel(null);
    if (error) { showToast("error", error.message); return; }
    setSlots((prev) => prev.filter((s) => s.id !== confirmDel));
    showToast("success", "Créneau supprimé");
  };

  /* ── Slots grouped by date ── */
  const slotsByDate = useMemo(() => {
    const map = new Map<string, PlanningSlot[]>();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return map;
  }, [slots]);

  /* ── Week stats ── */
  const weekStats = useMemo(() => {
    const total = slots.reduce((acc, s) => {
      return acc + Math.max(0, timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
    }, 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return { label: h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}m`, count: slots.length };
  }, [slots]);

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[15%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(56,189,248,0.03)] blur-[160px]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[rgba(8,10,15,0.9)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }}
            >
              <CalendarRange size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Planification</h1>
              <p className="text-[0.65rem] text-white/30">
                {slots.length > 0
                  ? `${weekStats.count} créneaux · ${weekStats.label} planifiés`
                  : "Aucun créneau cette semaine"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
              {(["semaine", "liste"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    view === v
                      ? "text-white"
                      : "text-white/30 hover:text-white/60"
                  }`}
                  style={view === v ? { backgroundColor: `${ACCENT}20`, color: ACCENT } : {}}
                >
                  {v === "semaine" ? <CalendarDays size={12} /> : <LayoutList size={12} />}
                  <span className="capitalize">{v}</span>
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAddModal()}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition"
              style={{
                backgroundColor: `${ACCENT}15`,
                borderColor: `${ACCENT}30`,
                color: ACCENT,
              }}
            >
              <Plus size={14} />
              Nouveau créneau
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Week navigator ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-5 sm:px-8">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <button
            onClick={prevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 transition hover:border-white/15 hover:text-white/70"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold text-white/80">{fmtWeekRange(weekDays)}</span>
            {toISO(weekDays[0]) === toISO(getWeekDays(new Date())[0]) && (
              <span className="text-[0.6rem] font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
                Semaine en cours
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="hidden sm:block rounded-lg border border-white/[0.07] px-3 py-1 text-xs font-semibold text-white/40 transition hover:text-white/70"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={nextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 transition hover:border-white/15 hover:text-white/70"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-5 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : view === "semaine" ? (
          /* ══ VUE SEMAINE ══ */
          <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
            {weekDays.map((day, i) => {
              const iso      = toISO(day);
              const isToday  = iso === today;
              const daySlots = slotsByDate.get(iso) ?? [];

              return (
                <div key={iso} className="min-w-[110px]">
                  {/* Day header */}
                  <div
                    className={`mb-2 rounded-xl border px-2 py-2 text-center transition ${
                      isToday
                        ? "border-transparent"
                        : "border-white/[0.05] bg-transparent"
                    }`}
                    style={isToday ? { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` } : {}}
                  >
                    <p
                      className="text-[0.6rem] font-bold uppercase tracking-widest"
                      style={{ color: isToday ? ACCENT : "rgba(255,255,255,0.3)" }}
                    >
                      {DAY_LABELS[i]}
                    </p>
                    <p
                      className={`text-base font-black ${isToday ? "" : "text-white/60"}`}
                      style={isToday ? { color: ACCENT } : {}}
                    >
                      {day.getDate()}
                    </p>
                    <p className="text-[0.55rem] text-white/20">
                      {day.toLocaleDateString("fr-FR", { month: "short" })}
                    </p>
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-1.5">
                    <AnimatePresence initial={false}>
                      {daySlots.map((s) => (
                        <SlotCard key={s.id} slot={s} onDelete={setConfirmDel} />
                      ))}
                    </AnimatePresence>

                    {/* Add button */}
                    <button
                      onClick={() => openAddModal(iso)}
                      className="group flex h-8 w-full items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-white/15 transition hover:border-white/20 hover:text-white/40"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ══ VUE LISTE ══ */
          <div className="space-y-4">
            {weekDays.map((day, i) => {
              const iso      = toISO(day);
              const isToday  = iso === today;
              const daySlots = slotsByDate.get(iso) ?? [];

              return (
                <motion.div
                  key={iso}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease }}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
                >
                  {/* Day header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]"
                    style={isToday ? { backgroundColor: `${ACCENT}08` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-black"
                        style={
                          isToday
                            ? { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}40`, color: ACCENT }
                            : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                        }
                      >
                        {day.getDate()}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isToday ? "" : "text-white/70"}`}
                           style={isToday ? { color: ACCENT } : {}}>
                          {DAY_LABELS_FULL[i]}
                        </p>
                        <p className="text-[0.62rem] text-white/25">
                          {fmtDayHeader(day)}
                          {daySlots.length > 0 && ` · ${daySlots.length} créneau${daySlots.length > 1 ? "x" : ""}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openAddModal(iso)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-white/25 transition hover:border-white/20 hover:text-white/60"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Slots */}
                  {daySlots.length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-white/20">
                      Aucun créneau
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      <AnimatePresence initial={false}>
                        {daySlots.map((s) => {
                          const color = typeColor(s.type);
                          return (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -16 }}
                              transition={{ duration: 0.2, ease }}
                              className="group flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.02]"
                            >
                              {/* Color dot */}
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white/85 truncate">
                                  {s.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  <span className="flex items-center gap-1 text-xs text-white/35">
                                    <Clock size={10} /> {s.start_time}–{s.end_time}
                                    {slotDuration(s) && (
                                      <span className="text-white/20">({slotDuration(s)})</span>
                                    )}
                                  </span>
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold"
                                    style={{ backgroundColor: `${color}18`, color }}
                                  >
                                    {typeLabel(s.type)}
                                  </span>
                                  {s.employee && (
                                    <span className="flex items-center gap-1 text-xs text-white/30">
                                      <User size={9} /> {s.employee}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Delete */}
                              <button
                                onClick={() => setConfirmDel(s.id)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] text-white/20 opacity-0 transition hover:border-red-500/30 hover:text-red-400 group-hover:opacity-100"
                              >
                                <Trash2 size={12} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL — Nouveau créneau
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-[2rem] border-t border-x border-white/[0.08] bg-[#0c0e16] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl border"
                    style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }}
                  >
                    <Plus size={14} style={{ color: ACCENT }} />
                  </div>
                  <h2 className="text-sm font-extrabold text-white">Nouveau créneau</h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:text-white/70"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">

                {/* Titre */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Titre <span style={{ color: ACCENT }}>*</span>
                  </label>
                  <input
                    autoFocus
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Ex : Réunion équipe, Chantier Dupont…"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-sky-500/40"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SLOT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setDraft((d) => ({ ...d, type: t.value }))}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                        style={
                          draft.type === t.value
                            ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}40`, color: t.color }
                            : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                        }
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Heures */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Date <span style={{ color: ACCENT }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Début <span style={{ color: ACCENT }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={draft.start_time}
                      onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Fin <span style={{ color: ACCENT }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={draft.end_time}
                      onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-500/40"
                    />
                  </div>
                </div>

                {/* Employé + Rôle */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      <User size={10} /> Employé / Personne
                    </label>
                    <input
                      value={draft.employee}
                      onChange={(e) => setDraft((d) => ({ ...d, employee: e.target.value }))}
                      placeholder="Marie Dupont"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-sky-500/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      <Briefcase size={10} /> Poste / Rôle
                    </label>
                    <input
                      value={draft.role}
                      onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                      placeholder="Technicien, Chef de projet…"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-sky-500/40"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    <Tag size={10} /> Note (optionnel)
                  </label>
                  <textarea
                    value={draft.note}
                    onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                    placeholder="Informations complémentaires…"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-sky-500/40"
                  />
                </div>

                {/* ── Notification email ── */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-3 flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    <Bell size={10} /> Notification email (optionnel)
                  </p>
                  <input
                    type="email"
                    value={draft.notify_email}
                    onChange={(e) => setDraft((d) => ({ ...d, notify_email: e.target.value }))}
                    placeholder="employeur@exemple.fr"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/15 outline-none transition focus:border-sky-500/30"
                  />
                  <p className="mt-1.5 text-[0.58rem] text-white/20">
                    Laissez vide pour utiliser NOTIFY_TO_EMAIL (variable d&apos;env)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 transition hover:text-white/60"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving || !draft.title.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}cc, #0ea5e9)`,
                      boxShadow: `0 4px 16px ${ACCENT}30`,
                    }}
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Enregistrement…" : "Ajouter le créneau"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ Confirm delete ══ */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/[0.08] bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer ce créneau ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmDel(null)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/15"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting && <Loader2 size={13} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Toast ══ */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
