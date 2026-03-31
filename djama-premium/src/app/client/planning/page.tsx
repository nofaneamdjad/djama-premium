"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, Clock, Tag, AlignLeft,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type Category = "travail" | "réunion" | "personnel" | "autre";

interface AgendaEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;       // "YYYY-MM-DD"
  start_time: string | null; // "HH:MM"
  end_time: string | null;
  category: Category;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const CATS: { value: Category; label: string; color: string; bg: string; border: string }[] = [
  { value: "travail",   label: "Travail",   color: "#60a5fa", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  { value: "réunion",   label: "Réunion",   color: "#c9a55a", bg: "rgba(201,165,90,0.12)",  border: "rgba(201,165,90,0.3)"  },
  { value: "personnel", label: "Personnel", color: "#a78bfa", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)"  },
  { value: "autre",     label: "Autre",     color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)" },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function getCat(v: Category) {
  return CATS.find((c) => c.value === v) ?? CATS[3];
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}

function fmtTime(t: string | null) {
  return t ? t.slice(0, 5) : "";
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */

function CategoryBadge({ cat }: { cat: Category }) {
  const c = getCat(cat);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

function Toast({ toast, onClose }: {
  toast: { type: "success" | "error"; msg: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.96)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.96)] text-red-300"
      }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 size={15} className="shrink-0 text-green-400" />
        : <AlertCircle size={15} className="shrink-0 text-red-400" />
      }
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 text-white/30 hover:text-white/70 transition">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ── Champ formulaire ── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-widest text-white/35">
        {label}
      </label>
      {children}
    </div>
  );
}

function FInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.4)" }}
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL AJOUT / ÉDITION
═══════════════════════════════════════════════════════════ */
interface EventForm {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  category: Category;
}

const EMPTY_FORM: EventForm = {
  title: "", description: "", date: todayISO(),
  start_time: "", end_time: "", category: "travail",
};

function EventModal({
  initial, onSave, onClose, saving,
}: {
  initial: EventForm;
  onSave: (f: EventForm) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EventForm>(initial);
  const upd = (k: keyof EventForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ duration: 0.3, ease }}
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f1117] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
      >
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <Calendar size={14} style={{ color: "#c9a55a" }} />
            </div>
            <h3 className="text-sm font-extrabold text-white">
              {initial.title ? "Modifier l'événement" : "Nouvel événement"}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/30 transition hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        {/* Corps */}
        <div className="space-y-4 px-6 py-5">
          <FormField label="Titre *">
            <FInput value={form.title} onChange={(v) => upd("title", v)} placeholder="Ex: Réunion client, RDV médecin…" />
          </FormField>

          <FormField label="Date *">
            <FInput type="date" value={form.date} onChange={(v) => upd("date", v)} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Heure début">
              <FInput type="time" value={form.start_time} onChange={(v) => upd("start_time", v)} />
            </FormField>
            <FormField label="Heure fin">
              <FInput type="time" value={form.end_time} onChange={(v) => upd("end_time", v)} />
            </FormField>
          </div>

          <FormField label="Catégorie">
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => upd("category", c.value)}
                  className="rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition"
                  style={
                    form.category === c.value
                      ? { color: c.color, background: c.bg, border: `1px solid ${c.border}` }
                      : { color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Description">
            <div className="relative">
              <textarea
                value={form.description}
                onChange={(e) => upd("description", e.target.value)}
                placeholder="Détails, adresse, notes…"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"
              />
            </div>
          </FormField>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/6 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80"
          >
            Annuler
          </button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            disabled={saving || !form.title.trim() || !form.date}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] py-2.5 text-sm font-extrabold text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,165,90,0.3)] transition hover:shadow-[0_4px_20px_rgba(201,165,90,0.4)] disabled:opacity-50"
          >
            {saving
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />
            }
            Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function PlanningPage() {
  const [events,     setEvents]     = useState<AgendaEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* Calendrier */
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());   // 0-based
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  /* Modal */
  const [modal, setModal] = useState<false | "new" | AgendaEvent>(false);

  /* Suppression */
  const [deleting, setDeleting] = useState<string | null>(null);

  /* ── Charger les événements du mois ──────────────────── */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay  = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      showToast("error", "Impossible de charger les événements.");
    } else {
      setEvents((data as AgendaEvent[]) ?? []);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── Toast ───────────────────────────────────────────── */
  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
  }

  /* ── Navigation mois ─────────────────────────────────── */
  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  /* ── Grille du calendrier ────────────────────────────── */
  const calendarDays = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    // Convertir en lundi-premier (0=Lun, 6=Dim)
    const offset = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Compléter pour avoir des rangées complètes
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  /* ── Index événements par date ───────────────────────── */
  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  /* ── Événements du jour sélectionné ─────────────────── */
  const selectedEvents = useMemo(
    () => eventsByDate[selectedDate] ?? [],
    [eventsByDate, selectedDate]
  );

  /* ── Sauvegarder (créer ou modifier) ─────────────────── */
  async function handleSave(form: EventForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("error", "Non connecté."); return; }

    setSaving(true);

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      date:        form.date,
      start_time:  form.start_time || null,
      end_time:    form.end_time   || null,
      category:    form.category,
    };

    if (typeof modal === "object") {
      /* Mise à jour */
      const { data, error } = await supabase
        .from("agenda_events")
        .update(payload)
        .eq("id", modal.id)
        .select()
        .single();
      if (error) { showToast("error", error.message); }
      else {
        setEvents((prev) => prev.map((e) => (e.id === modal.id ? (data as AgendaEvent) : e)));
        showToast("success", "Événement modifié.");
        setModal(false);
      }
    } else {
      /* Création */
      const { data, error } = await supabase
        .from("agenda_events")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) { showToast("error", error.message); }
      else {
        setEvents((prev) => [...prev, data as AgendaEvent].sort((a, b) =>
          a.date.localeCompare(b.date) || (a.start_time ?? "").localeCompare(b.start_time ?? "")
        ));
        showToast("success", "Événement ajouté.");
        setModal(false);
      }
    }

    setSaving(false);
  }

  /* ── Supprimer ───────────────────────────────────────── */
  async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) showToast("error", error.message);
    else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showToast("success", "Événement supprimé.");
    }
    setDeleting(null);
  }

  /* ── Formater la date sélectionnée ──────────────────── */
  function fmtSelected(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    }).format(date);
  }

  /* ── Aujourd'hui dans ce mois ? ─────────────────────── */
  const todayStr = todayISO();
  const todayInView =
    now.getFullYear() === year && now.getMonth() === month;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen flex-col bg-[#080a0f]">

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[20%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.04)] blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.85)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/client" className="flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60 sm:hidden">
              <ArrowLeft size={13} /> Retour
            </a>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <Calendar size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Planning & Agenda</h1>
              <p className="text-[0.65rem] text-white/30">
                {events.length} événement{events.length !== 1 ? "s" : ""} ce mois
              </p>
            </div>
          </div>

          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Corps */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-5 py-5 sm:flex-row">

        {/* ── Calendrier ─────────────────────────────── */}
        <div className="w-full rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5 sm:w-[320px] sm:flex-none">

          {/* Navigation mois */}
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-sm font-extrabold text-white">
              {MONTHS_FR[month]} {year}
            </span>

            <button
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="mb-2 grid grid-cols-7 gap-0">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-[0.6rem] font-bold uppercase tracking-wider text-white/25">
                {d}
              </div>
            ))}
          </div>

          {/* Grille jours */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const iso = toISO(year, month, day);
              const isToday   = iso === todayStr;
              const isSelected = iso === selectedDate;
              const hasEvents = !!(eventsByDate[iso]?.length);

              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-gradient-to-b from-[#c9a55a] to-[#b08d45] text-[#0a0a0a] shadow-[0_4px_12px_rgba(201,165,90,0.4)]"
                      : isToday
                      ? "border border-[rgba(201,165,90,0.4)] text-[#c9a55a]"
                      : "text-white/60 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <span
                      className={`mt-0.5 h-1 w-1 rounded-full ${
                        isSelected ? "bg-[#0a0a0a]/50" : "bg-[#c9a55a]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bouton aujourd'hui */}
          {!todayInView && (
            <button
              onClick={() => {
                setYear(now.getFullYear());
                setMonth(now.getMonth());
                setSelectedDate(todayISO());
              }}
              className="mt-4 w-full rounded-xl border border-white/8 py-2 text-xs font-semibold text-white/35 transition hover:border-white/18 hover:text-white/60"
            >
              Revenir à aujourd&apos;hui
            </button>
          )}

          {/* Légende catégories */}
          <div className="mt-5 space-y-1.5 border-t border-white/6 pt-4">
            {CATS.map((c) => (
              <div key={c.value} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="text-[0.65rem] text-white/35">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panneau droit : événements du jour ─────── */}
        <div className="flex flex-1 flex-col">

          {/* Titre du jour */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold capitalize text-white">
                {fmtSelected(selectedDate)}
              </h2>
              <p className="text-xs text-white/30">
                {selectedEvents.length === 0
                  ? "Aucun événement"
                  : `${selectedEvents.length} événement${selectedEvents.length > 1 ? "s" : ""}`
                }
              </p>
            </div>
            <button
              onClick={() => setModal("new")}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {/* Liste événements */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-white/20" />
            </div>
          ) : selectedEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-white/6 bg-[rgba(15,17,23,0.4)] py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
                <Calendar size={22} className="text-white/20" />
              </div>
              <p className="text-sm font-semibold text-white/30">Journée libre</p>
              <p className="text-xs text-white/20">Aucun événement planifié</p>
              <button
                onClick={() => {
                  setModal("new");
                }}
                className="mt-2 flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-4 py-2 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]"
              >
                <Plus size={12} /> Planifier un événement
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {selectedEvents.map((ev) => {
                  const c = getCat(ev.category);
                  return (
                    <motion.div
                      key={ev.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease }}
                      className="group relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 transition hover:border-white/15"
                    >
                      {/* Barre couleur gauche */}
                      <div
                        className="absolute left-0 top-0 h-full w-1 rounded-l-[1.25rem]"
                        style={{ background: c.color }}
                      />

                      <div className="flex items-start justify-between gap-4 pl-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-base font-bold text-white truncate">
                              {ev.title}
                            </h3>
                            <CategoryBadge cat={ev.category} />
                          </div>

                          {(ev.start_time || ev.end_time) && (
                            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                              <Clock size={11} />
                              {fmtTime(ev.start_time)}
                              {ev.end_time && ` → ${fmtTime(ev.end_time)}`}
                            </div>
                          )}

                          {ev.description && (
                            <div className="flex items-start gap-1.5 text-xs text-white/35">
                              <AlignLeft size={11} className="mt-0.5 shrink-0" />
                              <p className="line-clamp-2">{ev.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => setModal(ev)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/40 transition hover:border-white/25 hover:text-white/80"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            disabled={deleting === ev.id}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/15 text-red-400/50 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                          >
                            {deleting === ev.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Vue de tous les événements du mois si jour sélectionné a 0 event */}
          {!loading && events.length > 0 && selectedEvents.length === 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/20">
                Prochains événements du mois
              </p>
              <div className="space-y-2">
                {events.slice(0, 5).map((ev) => {
                  const [, mm, dd] = ev.date.split("-").map(Number);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedDate(ev.date)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-2.5 text-left transition hover:bg-white/6"
                    >
                      <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-white/6 text-center">
                        <span className="text-[0.55rem] font-bold uppercase text-white/30">{MONTHS_FR[mm - 1].slice(0, 3)}</span>
                        <span className="text-sm font-extrabold leading-none text-white">{dd}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 truncate">{ev.title}</p>
                        {ev.start_time && <p className="text-[0.65rem] text-white/30">{fmtTime(ev.start_time)}</p>}
                      </div>
                      <CategoryBadge cat={ev.category} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ajout / édition ─────────────────────── */}
      <AnimatePresence>
        {modal !== false && (
          <EventModal
            initial={
              typeof modal === "object"
                ? {
                    title:       modal.title,
                    description: modal.description,
                    date:        modal.date,
                    start_time:  modal.start_time ?? "",
                    end_time:    modal.end_time   ?? "",
                    category:    modal.category,
                  }
                : { ...EMPTY_FORM, date: selectedDate }
            }
            onSave={handleSave}
            onClose={() => setModal(false)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

    </div>
  );
}
