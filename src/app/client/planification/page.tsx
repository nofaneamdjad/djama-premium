"use client";
/**
 * Planification SaaS — Grille Employés × Jours
 * Shifts: draft → publish → email par employé
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Plus, ChevronLeft, ChevronRight, Clock, User, Briefcase,
  Trash2, X, Loader2, CheckCircle2, AlertCircle, Send, Users, Tag, Edit2,
  UserPlus, CalendarDays, LayoutList, Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: string | null;
  color: string;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  type: string;
  note: string | null;
  employee_id: string | null;
  status: "draft" | "published";
}

type DraftShift = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  note: string;
  employee_id: string; // "" = open shift
};

type DraftEmployee = {
  name: string;
  email: string;
  role: string;
  color: string;
};

type View = "grille" | "liste";

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const ACCENT = "#38bdf8";
const ease   = [0.16, 1, 0.3, 1] as const;

const SHIFT_TYPES = [
  { value: "tache",     label: "Tâche",     color: "#38bdf8" },
  { value: "chantier",  label: "Chantier",  color: "#4ade80" },
  { value: "reunion",   label: "Réunion",   color: "#a78bfa" },
  { value: "formation", label: "Formation", color: "#f59e0b" },
  { value: "conge",     label: "Congé",     color: "#f87171" },
  { value: "autre",     label: "Autre",     color: "#94a3b8" },
];

const EMPLOYEE_COLORS = [
  "#38bdf8", "#a78bfa", "#4ade80", "#f59e0b",
  "#f87171", "#fb923c", "#e879f9", "#34d399",
];

const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_FULL  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getWeekDays(ref: Date): Date[] {
  const d = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - (d === 0 ? 6 : d - 1));
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x;
  });
}

function toISO(d: Date): string { return d.toISOString().slice(0, 10); }
function todayISO(): string { return toISO(new Date()); }

function fmtWeekRange(days: Date[]): string {
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${days[0].toLocaleDateString("fr-FR", o)} — ${days[6].toLocaleDateString("fr-FR", { ...o, year: "numeric" })}`;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function shiftDur(s: Shift): string {
  const d = timeToMin(s.end_time) - timeToMin(s.start_time);
  if (d <= 0) return "";
  const h = Math.floor(d / 60), m = d % 60;
  return h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}m`;
}

function typeColor(t: string): string { return SHIFT_TYPES.find(x => x.value === t)?.color ?? "#94a3b8"; }
function typeLabel(t: string): string { return SHIFT_TYPES.find(x => x.value === t)?.label ?? t; }

function emptyShift(date?: string, empId?: string): DraftShift {
  return { title: "", date: date ?? todayISO(), start_time: "09:00", end_time: "17:00", type: "tache", note: "", employee_id: empId ?? "" };
}

function emptyEmployee(color?: string): DraftEmployee {
  return { name: "", email: "", role: "", color: color ?? EMPLOYEE_COLORS[0] };
}


/* ══════════════════════════════════════════════════════════
   SHIFT CARD
══════════════════════════════════════════════════════════ */
function ShiftCard({ shift, employee, onEdit, onDelete }: {
  shift: Shift;
  employee?: Employee;
  onEdit: (s: Shift) => void;
  onDelete: (id: string) => void;
}) {
  const color = typeColor(shift.type);
  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease }}
      onClick={() => onEdit(shift)}
      className="group relative flex flex-col gap-0.5 rounded-xl border p-2 text-left transition cursor-pointer"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}28` }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: color }} />
      {/* Published dot */}
      {shift.status === "published" && (
        <div className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-green-400/80" />
      )}
      <div className="pl-2.5 pr-4">
        <p className="text-[0.68rem] font-bold leading-tight text-white/85 truncate">{shift.title}</p>
        <p className="mt-0.5 text-[0.6rem] font-medium" style={{ color }}>
          {shift.start_time}–{shift.end_time}
          {shiftDur(shift) && <span className="ml-1 opacity-50">({shiftDur(shift)})</span>}
        </p>
        {employee && (
          <p className="mt-0.5 flex items-center gap-1 text-[0.57rem] text-white/40 truncate">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: employee.color }} />
            {employee.name}
          </p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(shift.id); }}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100 text-white/20 hover:text-red-400"
      >
        <Trash2 size={9} />
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   INPUT helpers
══════════════════════════════════════════════════════════ */
const inputCls = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-sky-500/40";
const labelCls = "mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30";

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function PlanificationPage() {
  /* ── Core state ── */
  const [userId,     setUserId]     = useState<string | null>(null);
  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [shifts,     setShifts]     = useState<Shift[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<View>("grille");
  const [weekRef,    setWeekRef]    = useState<Date>(new Date());
  const [toast,      setToast]      = useState<ToastData | null>(null);
  const [publishing, setPublishing] = useState(false);

  /* ── Shift modal ── */
  const [shiftModal,  setShiftModal]  = useState(false);
  const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [shiftDraft,  setShiftDraft]  = useState<DraftShift>(emptyShift());
  const [savingShift, setSavingShift] = useState(false);

  /* ── Employee modal ── */
  const [empModal,  setEmpModal]  = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [empDraft,  setEmpDraft]  = useState<DraftEmployee>(emptyEmployee());
  const [savingEmp, setSavingEmp] = useState(false);

  /* ── Delete confirm ── */
  const [delConfirm, setDelConfirm] = useState<{ type: "shift" | "employee"; id: string } | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  /* ── Publish confirm ── */
  const [pubModal, setPubModal] = useState(false);

  /* ── Derived ── */
  const weekDays  = useMemo(() => getWeekDays(weekRef), [weekRef]);
  const today     = todayISO();
  const weekStart = toISO(weekDays[0]);

  const allPublished   = shifts.length > 0 && shifts.every(s => s.status === "published");
  const hasUnpublished = shifts.some(s => s.status === "draft");

  const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg });

  /* ── Fetch employees ── */
  const fetchEmployees = useCallback(async (uid: string) => {
    const { data } = await supabase.from("employees").select("*").eq("user_id", uid).order("created_at").limit(100);
    if (data) setEmployees(data as Employee[]);
  }, []);

  /* ── Fetch shifts ── */
  const fetchShifts = useCallback(async (uid: string, days: Date[]) => {
    setLoading(true);
    const { data } = await supabase
      .from("shifts").select("*")
      .eq("user_id", uid)
      .gte("date", toISO(days[0])).lte("date", toISO(days[6]))
      .order("start_time");
    if (data) setShifts(data as Shift[]);
    setLoading(false);
  }, []);

  /* ── Auth + initial fetch ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await Promise.all([fetchEmployees(user.id), fetchShifts(user.id, weekDays)]);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Refetch on week change ── */
  useEffect(() => {
    if (userId) fetchShifts(userId, weekDays);
  }, [weekRef, userId, weekDays, fetchShifts]);

  /* ── Memoized lookups ── */
  const shiftsByKey = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const k = `${s.employee_id ?? "open"}|${s.date}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return map;
  }, [shifts]);

  const getShiftsFor = (empId: string | null, date: string) =>
    shiftsByKey.get(`${empId ?? "open"}|${date}`) ?? [];

  const empMap = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach(e => m.set(e.id, e));
    return m;
  }, [employees]);

  /* ── Week stats ── */
  const weekStats = useMemo(() => {
    const min = shifts.reduce((a, s) => a + Math.max(0, timeToMin(s.end_time) - timeToMin(s.start_time)), 0);
    const h = Math.floor(min / 60), m = min % 60;
    return { hours: h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}m`, count: shifts.length };
  }, [shifts]);

  /* ── Week navigation ── */
  const prevWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
  const nextWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };
  const goToday  = () => setWeekRef(new Date());

  /* ── Open shift modal ── */
  const openAddShift = (date?: string, empId?: string) => {
    setEditShiftId(null);
    setShiftDraft(emptyShift(date, empId));
    setShiftModal(true);
  };

  const openEditShift = (s: Shift) => {
    setEditShiftId(s.id);
    setShiftDraft({ title: s.title, date: s.date, start_time: s.start_time, end_time: s.end_time, type: s.type, note: s.note ?? "", employee_id: s.employee_id ?? "" });
    setShiftModal(true);
  };

  /* ── Save shift ── */
  const handleSaveShift = async () => {
    const d = shiftDraft;
    if (!d.title.trim()) { showToast("error", "Titre obligatoire"); return; }
    if (timeToMin(d.end_time) <= timeToMin(d.start_time)) { showToast("error", "Fin doit être après le début"); return; }
    if (!userId) return;
    setSavingShift(true);

    const payload = {
      user_id:     userId,
      title:       d.title.trim(),
      date:        d.date,
      start_time:  d.start_time,
      end_time:    d.end_time,
      type:        d.type,
      note:        d.note.trim() || null,
      employee_id: d.employee_id || null,
    };

    if (editShiftId) {
      const { data, error } = await supabase.from("shifts").update(payload).eq("id", editShiftId).select().single();
      if (error) { showToast("error", error.message); setSavingShift(false); return; }
      setShifts(prev => prev.map(s => s.id === editShiftId ? data as Shift : s));
      showToast("success", "Shift modifié ✓");
    } else {
      const { data, error } = await supabase.from("shifts").insert({ ...payload, status: "draft" }).select().single();
      if (error) { showToast("error", error.message); setSavingShift(false); return; }
      const newShift = data as Shift;
      setShifts(prev => [...prev, newShift]);

      /* ── Email immédiat à l'employé assigné ── */
      if (newShift.employee_id) {
        const assignedEmp = employees.find(e => e.id === newShift.employee_id);
        if (assignedEmp?.email) {
          fetch("/api/planification/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title:      newShift.title,
              date:       newShift.date,
              start_time: newShift.start_time,
              end_time:   newShift.end_time,
              type:       newShift.type,
              employee:   assignedEmp.name,
              role:       assignedEmp.role ?? null,
              note:       newShift.note ?? null,
              to_email:   assignedEmp.email,
            }),
          })
            .then(r => r.json())
            .then(j => console.log("[planif] notify →", j))
            .catch(e => console.error("[planif] notify erreur:", e));

          showToast("success", `Shift ajouté ✓ · Email envoyé à ${assignedEmp.name}`);
        } else {
          showToast("success", "Shift ajouté ✓");
        }
      } else {
        showToast("success", "Shift ajouté ✓");
      }
    }

    setSavingShift(false);
    setShiftModal(false);
  };

  /* ── Save employee ── */
  const handleSaveEmployee = async () => {
    const d = empDraft;
    if (!d.name.trim()) { showToast("error", "Nom obligatoire"); return; }
    if (!d.email.trim()) { showToast("error", "Email obligatoire — nécessaire pour les notifications de planning"); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(d.email.trim())) { showToast("error", "Adresse email invalide"); return; }
    if (!userId) return;
    setSavingEmp(true);

    const payload = { user_id: userId, name: d.name.trim(), email: d.email.trim(), role: d.role.trim() || null, color: d.color };

    if (editEmpId) {
      const { data, error } = await supabase.from("employees").update(payload).eq("id", editEmpId).select().single();
      if (error) { showToast("error", error.message); setSavingEmp(false); return; }
      setEmployees(prev => prev.map(e => e.id === editEmpId ? data as Employee : e));
      showToast("success", "Employé modifié ✓");
    } else {
      const { data, error } = await supabase.from("employees").insert(payload).select().single();
      if (error) { showToast("error", error.message); setSavingEmp(false); return; }
      setEmployees(prev => [...prev, data as Employee]);
      showToast("success", "Employé ajouté ✓");
    }

    setSavingEmp(false);
    setEmpModal(false);
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!delConfirm) return;
    setDeleting(true);
    const table = delConfirm.type === "shift" ? "shifts" : "employees";
    const { error } = await supabase.from(table).delete().eq("id", delConfirm.id);
    setDeleting(false);
    if (error) { showToast("error", error.message); setDelConfirm(null); return; }
    if (delConfirm.type === "shift") setShifts(prev => prev.filter(s => s.id !== delConfirm.id));
    else setEmployees(prev => prev.filter(e => e.id !== delConfirm.id));
    setDelConfirm(null);
    showToast("success", "Supprimé ✓");
  };

  /* ── Publish ── */
  const handlePublish = async () => {
    if (!userId) return;
    setPublishing(true);
    setPubModal(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/planning/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ week_start: weekStart }),
      });
      const json = await res.json() as { published?: number; emails_sent?: number; error?: string; warning?: string; missing_email?: string[] };
      if (!res.ok || json.error) throw new Error(json.error ?? "Erreur");
      setShifts(prev => prev.map(s => ({ ...s, status: "published" as const })));
      if (json.warning) {
        showToast("error", `Planning publié mais : ${json.warning}`);
      } else {
        showToast("success", json.emails_sent
          ? `Planning publié ✓ · ${json.emails_sent} email${json.emails_sent > 1 ? "s" : ""} envoyé${json.emails_sent > 1 ? "s" : ""}`
          : "Planning publié ✓ (aucun email — vérifiez les adresses)");
      }
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Erreur publication");
    }
    setPublishing(false);
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[600px] w-[600px] rounded-full bg-[rgba(56,189,248,0.025)] blur-[180px]" />
      </div>

      {/* ══ HEADER ══ */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[rgba(8,10,15,0.92)] px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border"
                 style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }}>
              <CalendarRange size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Planification</h1>
              <p className="text-[0.62rem] text-white/30">
                {shifts.length > 0 ? `${weekStats.count} shifts · ${weekStats.hours}` : "Aucun shift cette semaine"}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
              {(["grille", "liste"] as View[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                  style={view === v ? { backgroundColor: `${ACCENT}20`, color: ACCENT } : { color: "rgba(255,255,255,0.3)" }}
                >
                  {v === "grille" ? <CalendarDays size={11} /> : <LayoutList size={11} />}
                  <span className="capitalize">{v}</span>
                </button>
              ))}
            </div>

            {/* Add employee */}
            <button
              onClick={() => { setEditEmpId(null); setEmpDraft(emptyEmployee(EMPLOYEE_COLORS[employees.length % EMPLOYEE_COLORS.length])); setEmpModal(true); }}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-semibold text-white/50 transition hover:text-white/80"
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Employé</span>
            </button>

            {/* Add shift */}
            <button
              onClick={() => openAddShift()}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition"
              style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}25`, color: ACCENT }}
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Shift</span>
            </button>

            {/* Publish */}
            {allPublished ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400">
                <CheckCircle2 size={13} />
                <span className="hidden sm:inline">Publiée</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => shifts.length > 0 ? setPubModal(true) : showToast("error", "Aucun shift à publier")}
                disabled={publishing || shifts.length === 0}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-white transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", boxShadow: "0 4px 16px rgba(56,189,248,0.25)" }}
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span className="hidden sm:inline">{publishing ? "Publication…" : "Publier"}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ══ WEEK NAV ══ */}
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 pt-4 sm:px-8">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <button onClick={prevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 transition">
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold text-white/80">{fmtWeekRange(weekDays)}</span>
            <div className="flex items-center gap-2">
              {toISO(weekDays[0]) === toISO(getWeekDays(new Date())[0]) && (
                <span className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Semaine en cours</span>
              )}
              {allPublished && <span className="text-[0.58rem] font-bold uppercase tracking-widest text-green-400/80">· publiée</span>}
              {hasUnpublished && shifts.length > 0 && <span className="text-[0.58rem] font-bold uppercase tracking-widest text-amber-400/70">· brouillon</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday}
              className="hidden sm:block rounded-lg border border-white/[0.07] px-3 py-1 text-xs font-semibold text-white/40 hover:text-white/70 transition">
              Aujourd&apos;hui
            </button>
            <button onClick={nextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-4 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : view === "grille" ? (
          /* ════ GRID VIEW ════ */
          <div className="overflow-x-auto pb-4">
            <div style={{ minWidth: "900px" }}>

              {/* Day header row */}
              <div className="mb-2 grid gap-1.5" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <Users size={12} className="text-white/30" />
                  <span className="text-[0.58rem] font-bold uppercase tracking-widest text-white/25">Équipe</span>
                </div>
                {weekDays.map((day, i) => {
                  const iso = toISO(day);
                  const isToday = iso === today;
                  return (
                    <div key={iso} className="rounded-xl border px-2 py-2 text-center transition"
                         style={isToday ? { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}28` } : { borderColor: "rgba(255,255,255,0.05)" }}>
                      <p className="text-[0.58rem] font-bold uppercase tracking-widest"
                         style={{ color: isToday ? ACCENT : "rgba(255,255,255,0.3)" }}>{DAY_SHORT[i]}</p>
                      <p className="text-[0.95rem] font-black" style={{ color: isToday ? ACCENT : "rgba(255,255,255,0.6)" }}>{day.getDate()}</p>
                      <p className="text-[0.5rem] text-white/20">{day.toLocaleDateString("fr-FR", { month: "short" })}</p>
                    </div>
                  );
                })}
              </div>

              {/* Open shifts row */}
              <div className="mb-1.5 grid gap-1.5" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-widest text-amber-400/70">Open</p>
                    <p className="text-[0.57rem] text-white/25">Non assigné</p>
                  </div>
                </div>
                {weekDays.map(day => {
                  const iso = toISO(day);
                  const dayShifts = getShiftsFor(null, iso);
                  return (
                    <div key={iso} className="min-h-[56px] rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] p-1.5">
                      <div className="flex flex-col gap-1">
                        <AnimatePresence initial={false}>
                          {dayShifts.map(s => (
                            <ShiftCard key={s.id} shift={s} onEdit={openEditShift} onDelete={id => setDelConfirm({ type: "shift", id })} />
                          ))}
                        </AnimatePresence>
                        <button onClick={() => openAddShift(iso)}
                          className="flex h-6 w-full items-center justify-center rounded-lg border border-dashed border-white/[0.05] text-white/15 hover:border-white/15 hover:text-white/35 transition">
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Employee rows */}
              {employees.map(emp => (
                <div key={emp.id} className="mb-1.5 grid gap-1.5" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                  {/* Employee label */}
                  <div className="group flex items-center justify-between gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-black text-white"
                           style={{ backgroundColor: `${emp.color}30` }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-bold text-white/80 truncate">{emp.name}</p>
                        {emp.role && <p className="text-[0.57rem] text-white/30 truncate">{emp.role}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => { setEditEmpId(emp.id); setEmpDraft({ name: emp.name, email: emp.email ?? "", role: emp.role ?? "", color: emp.color }); setEmpModal(true); }}
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-white/60 transition"
                      ><Edit2 size={9} /></button>
                      <button
                        onClick={() => setDelConfirm({ type: "employee", id: emp.id })}
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-red-400 transition"
                      ><Trash2 size={9} /></button>
                    </div>
                  </div>
                  {/* Day cells */}
                  {weekDays.map(day => {
                    const iso = toISO(day);
                    const dayShifts = getShiftsFor(emp.id, iso);
                    return (
                      <div key={iso} className="min-h-[56px] rounded-xl border border-white/[0.04] bg-white/[0.01] p-1.5">
                        <div className="flex flex-col gap-1">
                          <AnimatePresence initial={false}>
                            {dayShifts.map(s => (
                              <ShiftCard key={s.id} shift={s} employee={emp} onEdit={openEditShift} onDelete={id => setDelConfirm({ type: "shift", id })} />
                            ))}
                          </AnimatePresence>
                          <button onClick={() => openAddShift(iso, emp.id)}
                            className="flex h-6 w-full items-center justify-center rounded-lg border border-dashed border-white/[0.04] text-white/10 hover:border-white/12 hover:text-white/30 transition">
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Empty employees CTA */}
              {employees.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
                  className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.07] py-10 text-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                    <Users size={18} className="text-white/25" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/50">Aucun employé</p>
                    <p className="mt-0.5 text-xs text-white/25">Ajoutez des membres pour leur assigner des shifts</p>
                  </div>
                  <button
                    onClick={() => { setEditEmpId(null); setEmpDraft(emptyEmployee()); setEmpModal(true); }}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/50 hover:text-white/80 transition"
                  >
                    <UserPlus size={12} /> Ajouter un employé
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* ════ LIST VIEW ════ */
          <div className="space-y-3">
            {weekDays.map((day, i) => {
              const iso = toISO(day);
              const isToday = iso === today;
              const dayShifts = shifts.filter(s => s.date === iso).sort((a, b) => a.start_time.localeCompare(b.start_time));
              return (
                <motion.div key={iso}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease }}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3"
                       style={isToday ? { backgroundColor: `${ACCENT}08` } : {}}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-black"
                           style={isToday
                             ? { backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}40`, color: ACCENT }
                             : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                        {day.getDate()}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={isToday ? { color: ACCENT } : { color: "rgba(255,255,255,0.7)" }}>
                          {DAY_FULL[i]}
                        </p>
                        <p className="text-[0.62rem] text-white/25">
                          {day.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                          {dayShifts.length > 0 && ` · ${dayShifts.length} shift${dayShifts.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => openAddShift(iso)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-white/25 hover:text-white/60 transition">
                      <Plus size={13} />
                    </button>
                  </div>

                  {dayShifts.length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-white/20">Aucun shift</div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      <AnimatePresence initial={false}>
                        {dayShifts.map(s => {
                          const color = typeColor(s.type);
                          const emp   = s.employee_id ? empMap.get(s.employee_id) : undefined;
                          return (
                            <motion.div key={s.id}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                              transition={{ duration: 0.2, ease }}
                              className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition hover:bg-white/[0.02]"
                              onClick={() => openEditShift(s)}
                            >
                              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-white/85">{s.title}</p>
                                  {s.status === "published" && (
                                    <span className="shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[0.55rem] font-bold text-green-400">publié</span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                                  <span className="flex items-center gap-1 text-xs text-white/35">
                                    <Clock size={9} /> {s.start_time}–{s.end_time}
                                    {shiftDur(s) && <span className="text-white/20">({shiftDur(s)})</span>}
                                  </span>
                                  <span className="rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold"
                                        style={{ backgroundColor: `${color}18`, color }}>{typeLabel(s.type)}</span>
                                  {emp
                                    ? <span className="flex items-center gap-1 text-xs text-white/30">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: emp.color }} />
                                        {emp.name}
                                      </span>
                                    : <span className="text-[0.58rem] font-bold text-amber-400/70">Open</span>}
                                </div>
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); setDelConfirm({ type: "shift", id: s.id }); }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] text-white/20 opacity-0 transition hover:border-red-500/30 hover:text-red-400 group-hover:opacity-100"
                              ><Trash2 size={12} /></button>
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

      {/* ══════════════════════════════════════════
          SHIFT MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {shiftModal && (
          <>
            <motion.div key="sb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShiftModal(false)} />
            <motion.div key="ss"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-[2rem] border-t border-x border-white/[0.08] bg-[#0c0e16] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border"
                       style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }}>
                    {editShiftId ? <Edit2 size={13} style={{ color: ACCENT }} /> : <Plus size={14} style={{ color: ACCENT }} />}
                  </div>
                  <h2 className="text-sm font-extrabold text-white">{editShiftId ? "Modifier le shift" : "Nouveau shift"}</h2>
                </div>
                <button onClick={() => setShiftModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">
                {/* Title */}
                <div>
                  <label className={labelCls}>Titre <span style={{ color: ACCENT }}>*</span></label>
                  <input autoFocus value={shiftDraft.title}
                    onChange={e => setShiftDraft(d => ({ ...d, title: e.target.value }))}
                    placeholder="Ex : Réunion hebdo, Chantier Dupont…"
                    className={inputCls}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="flex flex-wrap gap-2">
                    {SHIFT_TYPES.map(t => (
                      <button key={t.value} onClick={() => setShiftDraft(d => ({ ...d, type: t.value }))}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                        style={shiftDraft.type === t.value
                          ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}40`, color: t.color }
                          : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Times */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Date <span style={{ color: ACCENT }}>*</span></label>
                    <input type="date" value={shiftDraft.date}
                      onChange={e => setShiftDraft(d => ({ ...d, date: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Début <span style={{ color: ACCENT }}>*</span></label>
                    <input type="time" value={shiftDraft.start_time}
                      onChange={e => setShiftDraft(d => ({ ...d, start_time: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fin <span style={{ color: ACCENT }}>*</span></label>
                    <input type="time" value={shiftDraft.end_time}
                      onChange={e => setShiftDraft(d => ({ ...d, end_time: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>

                {/* Assign to */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    <User size={10} /> Assigner à
                  </label>
                  {employees.length === 0 ? (
                    <p className="text-xs italic text-white/25">Ajoutez d&apos;abord des employés pour assigner ce shift</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setShiftDraft(d => ({ ...d, employee_id: "" }))}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                        style={shiftDraft.employee_id === ""
                          ? { backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }
                          : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Open shift
                      </button>
                      {employees.map(emp => (
                        <button key={emp.id} onClick={() => setShiftDraft(d => ({ ...d, employee_id: emp.id }))}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                          style={shiftDraft.employee_id === emp.id
                            ? { backgroundColor: `${emp.color}18`, borderColor: `${emp.color}35`, color: emp.color }
                            : { borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: emp.color }} />
                          {emp.name}
                          {emp.role && <span className="opacity-50">· {emp.role}</span>}
                          {!emp.email && (
                            <span title="Pas d'email — aucune notification" className="ml-0.5 text-amber-400/70"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Warn if selected employee has no email */}
                  {shiftDraft.employee_id && (() => {
                    const sel = employees.find(e => e.id === shiftDraft.employee_id);
                    if (!sel || sel.email) return null;
                    return (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2">
                        <AlertCircle size={12} className="shrink-0 text-amber-400" />
                        <p className="text-[0.62rem] text-amber-300/70">
                          <strong>{sel.name}</strong> n&apos;a pas d&apos;email — aucune notification ne sera envoyée.{" "}
                          <button onClick={() => { setShiftModal(false); setTimeout(() => { setEditEmpId(sel.id); setEmpDraft({ name: sel.name, email: "", role: sel.role ?? "", color: sel.color }); setEmpModal(true); }, 150); }}
                            className="underline hover:text-amber-300 transition">
                            Ajouter son email
                          </button>
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    <Tag size={10} /> Note (optionnel)
                  </label>
                  <textarea value={shiftDraft.note}
                    onChange={e => setShiftDraft(d => ({ ...d, note: e.target.value }))}
                    placeholder="Informations complémentaires…" rows={2}
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-sky-500/40"
                  />
                </div>

                {/* Info: email behavior */}
                <div className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <Info size={11} className="mt-0.5 shrink-0 text-white/25" />
                  <p className="text-[0.62rem] leading-relaxed text-white/30">
                    Un email est envoyé{" "}
                    <strong className="text-white/50">immédiatement</strong> à l&apos;employé assigné lors de la création.
                    La <strong className="text-white/50">publication</strong> envoie un récapitulatif complet de la semaine.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-2">
                  <button onClick={() => setShiftModal(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 hover:text-white/60 transition">
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSaveShift}
                    disabled={savingShift || !shiftDraft.title.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg,${ACCENT}cc,#0ea5e9)`, boxShadow: `0 4px 16px ${ACCENT}30` }}
                  >
                    {savingShift && <Loader2 size={14} className="animate-spin" />}
                    {savingShift ? "Enregistrement…" : editShiftId ? "Modifier" : "Ajouter le shift"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          EMPLOYEE MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {empModal && (
          <>
            <motion.div key="eb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setEmpModal(false)} />
            <motion.div key="es"
              initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.25, ease }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border"
                         style={{ backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }}>
                      <UserPlus size={13} style={{ color: ACCENT }} />
                    </div>
                    <h2 className="text-sm font-extrabold text-white">{editEmpId ? "Modifier l'employé" : "Nouvel employé"}</h2>
                  </div>
                  <button onClick={() => setEmpModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nom <span style={{ color: ACCENT }}>*</span></label>
                    <input autoFocus value={empDraft.name}
                      onChange={e => setEmpDraft(d => ({ ...d, name: e.target.value }))}
                      placeholder="Marie Dupont" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Email <span style={{ color: ACCENT }}>*</span>
                      <span className="ml-1 text-white/20 normal-case tracking-normal">(requis — notifications planning)</span>
                    </label>
                    <input type="email" value={empDraft.email}
                      onChange={e => setEmpDraft(d => ({ ...d, email: e.target.value }))}
                      placeholder="marie@exemple.fr"
                      className={`${inputCls} ${empDraft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empDraft.email) ? "border-red-500/40 focus:border-red-500/60" : ""}`} />
                    {empDraft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empDraft.email) && (
                      <p className="mt-1 text-[0.6rem] text-red-400/70">Adresse email invalide</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      <Briefcase size={10} /> Poste / Rôle
                    </label>
                    <input value={empDraft.role}
                      onChange={e => setEmpDraft(d => ({ ...d, role: e.target.value }))}
                      placeholder="Chef de projet, Technicien…" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Couleur</label>
                    <div className="flex gap-2">
                      {EMPLOYEE_COLORS.map(c => (
                        <button key={c} onClick={() => setEmpDraft(d => ({ ...d, color: c }))}
                          className="h-7 w-7 rounded-lg transition"
                          style={{ backgroundColor: c, outline: empDraft.color === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setEmpModal(false)}
                      className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 hover:text-white/60 transition">
                      Annuler
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={handleSaveEmployee}
                      disabled={savingEmp || !empDraft.name.trim() || !empDraft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empDraft.email)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white transition disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg,${ACCENT}cc,#0ea5e9)`, boxShadow: `0 4px 16px ${ACCENT}30` }}
                    >
                      {savingEmp && <Loader2 size={14} className="animate-spin" />}
                      {savingEmp ? "Enregistrement…" : editEmpId ? "Modifier" : "Ajouter"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          PUBLISH CONFIRM MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {pubModal && (() => {
          /* employees with shifts this week but no email */
          const assignedIds = new Set(shifts.map(s => s.employee_id).filter(Boolean));
          const missingEmail = employees.filter(e => assignedIds.has(e.id) && !e.email);
          const canPublish   = missingEmail.length === 0;
          const willEmail    = employees.filter(e => assignedIds.has(e.id) && e.email).length;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.25, ease }}
                className="w-full max-w-sm rounded-[1.75rem] border border-white/[0.08] bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${canPublish ? "border-sky-500/20 bg-sky-500/10" : "border-red-500/20 bg-red-500/10"}`}>
                  {canPublish ? <Send size={18} className="text-sky-400" /> : <AlertCircle size={18} className="text-red-400" />}
                </div>
                <h3 className="text-base font-extrabold text-white">Publier la semaine ?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">
                  <span className="font-semibold text-white/60">{shifts.length} shift{shifts.length > 1 ? "s" : ""}</span> vont être publiés.
                  {canPublish && willEmail > 0 && (
                    <> Un email sera envoyé à{" "}
                      <span className="font-semibold text-white/60">{willEmail} employé{willEmail > 1 ? "s" : ""}</span> avec leur planning personnel.
                    </>
                  )}
                </p>

                {/* Blocking error — missing emails */}
                {missingEmail.length > 0 && (
                  <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={12} className="shrink-0 text-red-400" />
                      <p className="text-[0.65rem] font-bold text-red-400 uppercase tracking-wider">Email manquant — publication bloquée</p>
                    </div>
                    <p className="text-[0.62rem] text-red-300/60 mb-2">
                      Les employés suivants ont des shifts assignés mais <strong>aucun email</strong>. Ajoutez leur email avant de publier :
                    </p>
                    <ul className="space-y-1">
                      {missingEmail.map(emp => (
                        <li key={emp.id} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-white/60">
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: emp.color }} />
                            {emp.name}{emp.role && <span className="text-white/30 font-normal">· {emp.role}</span>}
                          </span>
                          <button
                            onClick={() => { setPubModal(false); setTimeout(() => { setEditEmpId(emp.id); setEmpDraft({ name: emp.name, email: "", role: emp.role ?? "", color: emp.color }); setEmpModal(true); }, 150); }}
                            className="text-[0.6rem] font-bold text-sky-400 hover:text-sky-300 transition underline">
                            Ajouter email
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button onClick={() => setPubModal(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 hover:border-white/15 transition">
                    Annuler
                  </button>
                  <button onClick={handlePublish} disabled={!canPublish}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: canPublish ? "linear-gradient(135deg,#0ea5e9,#38bdf8)" : "rgba(255,255,255,0.06)", boxShadow: canPublish ? "0 4px 16px rgba(56,189,248,0.25)" : "none" }}>
                    <Send size={13} /> Publier &amp; Envoyer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ══ DELETE CONFIRM ══ */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.25, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/[0.08] bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                Supprimer {delConfirm.type === "shift" ? "ce shift" : "cet employé"} ?
              </h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              {delConfirm.type === "employee" && (
                <p className="mt-1 text-xs text-amber-400/60">Les shifts assignés à cet employé deviendront des open shifts.</p>
              )}
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDelConfirm(null)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 hover:border-white/15 transition">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition">
                  {deleting && <Loader2 size={13} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ TOAST ══ */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
