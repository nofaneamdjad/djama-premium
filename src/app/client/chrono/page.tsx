"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Play, Pause, Square, Plus, Trash2, X, Clock, Euro,
  CalendarDays, Briefcase, User, BarChart2, Target, Settings,
  Coffee, Loader2, TrendingUp, Brain, Tag, CheckCircle,
  FileText, Zap, RefreshCw, Flame, Circle,
  Download, Users, CalendarPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEur } from "@/lib/format";
import Toast, { type ToastData } from "@/components/ui/Toast";
import { useTheme } from "@/lib/theme-context";

type TimerMode = "classic" | "pomodoro" | "countdown" | "focus";
type PomPhase = "work" | "break";
type AppTab   = "timer" | "stats" | "projects" | "billing" | "rapport";

interface TimeEntry {
  id: string;
  user_id: string;
  project: string;
  client_name: string | null;
  description: string | null;
  task_title: string | null;
  date: string;
  duration_minutes: number;
  hourly_rate: number | null;
  category: string | null;
  is_billable: boolean | null;
  is_billed: boolean | null;
  invoice_ref: string | null;
  timer_mode: string | null;
  notes: string | null;
  created_at: string;
}

interface ChronoProject {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  color: string;
  hourly_rate: number;
  budget_hours: number;
  is_active: boolean;
  created_at: string;
}

interface ChronoGoal {
  id: string;
  daily_minutes: number;
  weekly_minutes: number;
  daily_billable_minutes: number;
}

interface ManualDraft {
  task_title: string;
  project: string;
  client_name: string;
  category: string;
  date: string;
  duration_minutes: string;
  hourly_rate: string;
  is_billable: boolean;
  notes: string;
}

interface ProjectDraft {
  name: string;
  client_name: string;
  color: string;
  hourly_rate: string;
  budget_hours: string;
}

interface GoalDraft {
  daily_minutes: string;
  weekly_minutes: string;
  daily_billable_minutes: string;
}

const violet = "#a78bfa";
const ease   = [0.16, 1, 0.3, 1] as const;
const POM_WORK  = 25 * 60;
const POM_BREAK =  5 * 60;

const MODES: { value: TimerMode; label: string; desc: string; color: string }[] = [
  { value: "classic",   label: "Classique",        desc: "Chronomètre libre",      color: "#a78bfa" },
  { value: "pomodoro",  label: "Pomodoro",          desc: "25 min / 5 min pause",   color: "#f87171" },
  { value: "countdown", label: "Compte à rebours",  desc: "Durée définie",          color: "#60a5fa" },
  { value: "focus",     label: "Focus",             desc: "Mode immersif",          color: "#34d399" },
];

const CATEGORIES = [
  { value: "developpement", label: "Développement", color: "#818cf8" },
  { value: "design",        label: "Design",         color: "#f472b6" },
  { value: "meeting",       label: "Réunion",         color: "#fb923c" },
  { value: "commercial",    label: "Commercial",      color: "#c9a55a" },
  { value: "admin",         label: "Administratif",   color: "#94a3b8" },
  { value: "redaction",     label: "Rédaction",       color: "#a3e635" },
  { value: "support",       label: "Support",         color: "#38bdf8" },
  { value: "autre",         label: "Autre",            color: "#a78bfa" },
];

const PROJECT_COLORS = [
  "#a78bfa","#f87171","#60a5fa","#34d399","#c9a55a",
  "#f472b6","#fb923c","#818cf8","#38bdf8","#a3e635",
];

const TABS: { value: AppTab; label: string; Icon: React.ElementType }[] = [
  { value: "timer",    label: "Chrono",    Icon: Timer     },
  { value: "stats",    label: "Stats",     Icon: BarChart2  },
  { value: "projects", label: "Projets",   Icon: Briefcase  },
  { value: "billing",  label: "Facturable",Icon: FileText   },
  { value: "rapport",  label: "Rapport",   Icon: Users      },
];

const fmt = (s: number) => {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};

const fmtMin = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}m` : ""}` : `${min}m`;

const todayISO = () => new Date().toISOString().slice(0,10);

const startOfWeekISO = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0,10);
};

const startOfMonthISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
};

const isoToLabel = (iso: string) => {
  const today     = todayISO();
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if (iso === today)     return "Aujourd'hui";
  if (iso === yesterday) return "Hier";
  return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long"}).format(new Date(iso+"T12:00:00"));
};

const getCategoryColor = (cat: string | null) =>
  CATEGORIES.find(c => c.value === (cat ?? "autre"))?.color ?? "#a78bfa";
const getCategoryLabel = (cat: string | null) =>
  CATEGORIES.find(c => c.value === (cat ?? "autre"))?.label ?? (cat ?? "Autre");

function exportTimesheet(entries: TimeEntry[], from?: string, to?: string) {
  const rows = entries
    .filter(e => (!from || e.date >= from) && (!to || e.date <= to))
    .sort((a, b) => a.date.localeCompare(b.date));
  const cols = ["Date","Projet","Client","Tâche","Catégorie","Durée (min)","Durée (h)","Taux €/h","Montant €","Facturable","Mode"];
  const lines = [cols.join(";")];
  for (const e of rows) {
    const earn = e.hourly_rate && (e.is_billable ?? true) ? ((e.duration_minutes / 60) * e.hourly_rate).toFixed(2) : "0";
    lines.push([
      e.date, e.project, e.client_name ?? "", e.task_title ?? "",
      getCategoryLabel(e.category),
      String(e.duration_minutes), (e.duration_minutes / 60).toFixed(2),
      String(e.hourly_rate ?? 0), earn,
      (e.is_billable ?? true) ? "Oui" : "Non", e.timer_mode ?? "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  }
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `timesheet_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function exportICS(entries: TimeEntry[]) {
  const pad = (n: number) => String(n).padStart(2,"0");
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0",
    "PRODID:-//DJAMA Premium//Chrono//FR","CALSCALE:GREGORIAN",
  ];
  for (const e of entries) {
    const d = new Date(e.date + "T09:00:00");
    const start = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T090000`;
    const endMs  = d.getTime() + e.duration_minutes * 60_000;
    const ed     = new Date(endMs);
    const end    = `${ed.getFullYear()}${pad(ed.getMonth()+1)}${pad(ed.getDate())}T${pad(ed.getHours())}${pad(ed.getMinutes())}00`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@djama-chrono`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${(e.task_title || e.project).replace(/[,;\\]/g,"")} [${fmtMin(e.duration_minutes)}]`,
      ...(e.client_name ? [`DESCRIPTION:Client: ${e.client_name}\\nProjet: ${e.project}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "chrono_sessions.ics";
  a.click(); URL.revokeObjectURL(url);
}

const emptyManual = (): ManualDraft => ({
  task_title:"", project:"", client_name:"", category:"autre",
  date:todayISO(), duration_minutes:"", hourly_rate:"", is_billable:true, notes:"",
});
const emptyProject = (): ProjectDraft => ({
  name:"", client_name:"", color:"#a78bfa", hourly_rate:"", budget_hours:"",
});

export default function ChronoPage() {
  const { isDark } = useTheme();
  const router = useRouter();

    const [mode,         setMode]         = useState<TimerMode>("classic");
  const [running,      setRunning]      = useState(false);
  const [paused,       setPaused]       = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [startMs,      setStartMs]      = useState<number|null>(null);

    const [pomPhase,  setPomPhase]  = useState<PomPhase>("work");
  const [pomCycle,  setPomCycle]  = useState(0);

    const [cdH, setCdH] = useState("0");
  const [cdM, setCdM] = useState("25");
  const cdTarget = ((parseInt(cdH,10)||0)*3600) + ((parseInt(cdM,10)||25)*60);

    const [sTitle,    setSTitle]    = useState("");
  const [sProject,  setSProject]  = useState("");
  const [sClient,   setSClient]   = useState("");
  const [sCat,      setSCat]      = useState("autre");
  const [sRate,     setSRate]     = useState("");
  const [sBillable, setSBillable] = useState(true);
  const [sNotes,    setSNotes]    = useState("");

    const [entries,  setEntries]  = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<ChronoProject[]>([]);
  const [goal,     setGoal]     = useState<ChronoGoal|null>(null);

    const [tab,       setTab]       = useState<AppTab>("timer");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [toast,     setToast]     = useState<ToastData|null>(null);

    const [manualOpen,    setManualOpen]    = useState(false);
  const [manualDraft,   setManualDraft]   = useState<ManualDraft>(emptyManual());
  const [manualSaving,  setManualSaving]  = useState(false);
  const [projOpen,      setProjOpen]      = useState(false);
  const [projDraft,     setProjDraft]     = useState<ProjectDraft>(emptyProject());
  const [projSaving,    setProjSaving]    = useState(false);
  const [goalOpen,      setGoalOpen]      = useState(false);
  const [goalDraft,     setGoalDraft]     = useState<GoalDraft>({ daily_minutes:"480", weekly_minutes:"2400", daily_billable_minutes:"360" });
  const [goalSaving,    setGoalSaving]    = useState(false);
  const [confirmDel,    setConfirmDel]    = useState<string|null>(null);
  const [deleting,      setDeleting]      = useState<string|null>(null);
  const [creatingInv,   setCreatingInv]   = useState<string|null>(null);

    const intervalRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const modeRef        = useRef<TimerMode>("classic");
  const pomPhaseRef    = useRef<PomPhase>("work");
  const pomCycleRef    = useRef(0);
  const cdTargetRef    = useRef(25*60);
  const sessionRef     = useRef({ title:"", project:"", client:"", cat:"autre", rate:"", billable:true, notes:"" });

    useEffect(() => { modeRef.current     = mode     }, [mode]);
  useEffect(() => { pomPhaseRef.current = pomPhase }, [pomPhase]);
  useEffect(() => { pomCycleRef.current = pomCycle }, [pomCycle]);
  useEffect(() => { cdTargetRef.current = cdTarget }, [cdTarget]);
  useEffect(() => {
    sessionRef.current = { title:sTitle, project:sProject, client:sClient, cat:sCat, rate:sRate, billable:sBillable, notes:sNotes };
  }, [sTitle,sProject,sClient,sCat,sRate,sBillable,sNotes]);

    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, []);

    const showToast = (type: "success"|"error"|"info", msg: string) =>
    setToast({ type, msg } as ToastData);

    const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const uid = user.id;
    const [eRes, pRes, gRes] = await Promise.all([
      supabase.from("time_entries").select("*").eq("user_id",uid).order("date",{ascending:false}).order("created_at",{ascending:false}).limit(500),
      supabase.from("chrono_projects").select("*").eq("user_id",uid).eq("is_active",true).order("name").limit(100),
      supabase.from("chrono_goals").select("*").eq("user_id",uid).limit(1),
    ]);
    if (eRes.error) showToast("error", "Erreur réseau — impossible de charger les sessions");
    else if (eRes.data) setEntries(eRes.data as TimeEntry[]);
    if (pRes.error) showToast("error", "Erreur réseau — impossible de charger les projets");
    else if (pRes.data) setProjects(pRes.data as ChronoProject[]);
    if (gRes.data?.length) setGoal(gRes.data[0] as ChronoGoal);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll() }, [fetchAll]);

    function startTimerInterval(fromMs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - fromMs) / 1000);
      setElapsed(newElapsed);
      const m = modeRef.current;
      if (m === "pomodoro") {
        const lim = pomPhaseRef.current === "work" ? POM_WORK : POM_BREAK;
        if (newElapsed >= lim) handlePomodoroPhaseEnd();
      } else if (m === "countdown") {
        if (newElapsed >= cdTargetRef.current) handleCountdownEnd();
      }
    }, 1000);
  }

  function handleStart() {
    const now = Date.now();
    setStartMs(now);
    setElapsed(0);
    setRunning(true);
    setPaused(false);
    if (mode === "pomodoro") {
      setPomPhase("work"); pomPhaseRef.current = "work";
      setPomCycle(0);      pomCycleRef.current = 0;
    }
    startTimerInterval(now);
  }

  function handlePause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPaused(true);
  }

  function handleResume() {
    const resumeMs = Date.now() - elapsed * 1000;
    setStartMs(resumeMs);
    setRunning(true);
    setPaused(false);
    startTimerInterval(resumeMs);
  }

  async function handleStop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPaused(false);
    setFocusMode(false);
    const mins = Math.max(1, Math.round(elapsed / 60));
    await saveSession(mins, modeRef.current);
    setElapsed(0);
    setStartMs(null);
  }

  function handlePomodoroPhaseEnd() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const phase   = pomPhaseRef.current;
    const cycle   = pomCycleRef.current;
    if (phase === "work") {
      void saveSession(Math.round(POM_WORK/60), "pomodoro", cycle+1);
      pomCycleRef.current = cycle+1; setPomCycle(cycle+1);
      pomPhaseRef.current = "break"; setPomPhase("break");
      showToast("success", `Pomodoro #${cycle+1} terminé — Pause 5 min.`);
    } else {
      pomPhaseRef.current = "work"; setPomPhase("work");
      showToast("info", "Pause terminée — au travail !");
    }
    setElapsed(0);
    const newMs = Date.now();
    setStartMs(newMs);
    startTimerInterval(newMs);
  }

  async function handleCountdownEnd() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); setPaused(false);
    const mins = Math.max(1, Math.round(cdTargetRef.current/60));
    setElapsed(0); setStartMs(null);
    await saveSession(mins, "countdown");
  }

    async function saveSession(mins: number, timerMode: string, pomodoroNum?: number) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const s = sessionRef.current;
    const title = pomodoroNum ? (s.title ? `${s.title} (Pomodoro #${pomodoroNum})` : `Pomodoro #${pomodoroNum}`) : (s.title || "");
    const { error } = await supabase.from("time_entries").insert({
      user_id:          user.id,
      task_title:       title,
      project:          s.project || "Sans projet",
      client_name:      s.client || null,
      description:      s.title || null,
      category:         s.cat,
      date:             todayISO(),
      duration_minutes: mins,
      hourly_rate:      s.rate ? parseFloat(s.rate) : null,
      is_billable:      s.billable,
      is_billed:        false,
      timer_mode:       timerMode,
      notes:            s.notes || "",
    });
    setSaving(false);
    if (error) { showToast("error", `Erreur : ${error.message}`); }
    else       { showToast("success", `Session enregistrée — ${fmtMin(mins)}`); void fetchAll(); }
  }

    async function handleManualSave() {
    if (!manualDraft.project.trim()) { showToast("error","Projet requis."); return; }
    const mins = parseInt(manualDraft.duration_minutes,10);
    if (!mins||mins<=0) { showToast("error","Durée invalide."); return; }
    setManualSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setManualSaving(false); return; }
    const { error } = await supabase.from("time_entries").insert({
      user_id:user.id, task_title:manualDraft.task_title||"",
      project:manualDraft.project.trim(), client_name:manualDraft.client_name||null,
      description:manualDraft.task_title||null, category:manualDraft.category,
      date:manualDraft.date||todayISO(), duration_minutes:mins,
      hourly_rate:manualDraft.hourly_rate?parseFloat(manualDraft.hourly_rate):null,
      is_billable:manualDraft.is_billable, is_billed:false,
      timer_mode:"manual", notes:manualDraft.notes||"",
    });
    setManualSaving(false);
    if (error) showToast("error",error.message);
    else { showToast("success","Entrée ajoutée."); setManualOpen(false); setManualDraft(emptyManual()); void fetchAll(); }
  }

    async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("time_entries").delete().eq("id",id);
    setDeleting(null); setConfirmDel(null);
    if (error) showToast("error",error.message);
    else { setEntries(p=>p.filter(e=>e.id!==id)); showToast("success","Supprimé."); }
  }

    async function handleSaveProject() {
    if (!projDraft.name.trim()) { showToast("error","Nom requis."); return; }
    setProjSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setProjSaving(false); return; }
    const { error } = await supabase.from("chrono_projects").insert({
      user_id:user.id, name:projDraft.name.trim(), client_name:projDraft.client_name||"",
      color:projDraft.color, hourly_rate:projDraft.hourly_rate?parseFloat(projDraft.hourly_rate):0,
      budget_hours:projDraft.budget_hours?parseFloat(projDraft.budget_hours):0,
    });
    setProjSaving(false);
    if (error) showToast("error",error.message);
    else { showToast("success","Projet créé."); setProjOpen(false); setProjDraft(emptyProject()); void fetchAll(); }
  }

    async function handleSaveGoal() {
    setGoalSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setGoalSaving(false); return; }
    const payload = {
      user_id:user.id,
      daily_minutes:parseInt(goalDraft.daily_minutes,10)||480,
      weekly_minutes:parseInt(goalDraft.weekly_minutes,10)||2400,
      daily_billable_minutes:parseInt(goalDraft.daily_billable_minutes,10)||360,
    };
    const { error } = goal
      ? await supabase.from("chrono_goals").update(payload).eq("id",goal.id)
      : await supabase.from("chrono_goals").insert(payload);
    setGoalSaving(false);
    if (error) showToast("error",error.message);
    else { showToast("success","Objectifs mis à jour."); setGoalOpen(false); void fetchAll(); }
  }

    async function handleMarkBilled(id: string) {
    const { error } = await supabase.from("time_entries").update({is_billed:true}).eq("id",id);
    if (error) showToast("error",error.message);
    else { setEntries(p=>p.map(e=>e.id===id?{...e,is_billed:true}:e)); showToast("success","Marqué facturé."); }
  }

  async function handleMarkAllBilled(ids: string[]) {
    const { error } = await supabase.from("time_entries").update({ is_billed: true }).in("id", ids);
    if (error) { showToast("error", error.message); return; }
    setEntries(p => p.map(e => ids.includes(e.id) ? { ...e, is_billed: true } : e));
    showToast("success", `${ids.length} entrée${ids.length > 1 ? "s" : ""} marquée${ids.length > 1 ? "s" : ""} facturée${ids.length > 1 ? "s" : ""}.`);
  }

  async function handleCreateInvoice(proj: string, ents: TimeEntry[]) {
    if (creatingInv) return;
    setCreatingInv(proj);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast("error", "Non connecté."); return; }

      const year = new Date().getFullYear();
      const clientNom = ents[0]?.client_name ?? "";
      const totalHt = ents.reduce((a, e) => e.hourly_rate ? a + (e.duration_minutes / 60) * e.hourly_rate : a, 0);
      const tva20 = Math.round(totalHt * 0.2 * 100) / 100;

      // Numéro unique : timestamp-based pour éviter les conflits
      const suffix = Date.now().toString().slice(-5);
      const numero = `FAC-${year}-C${suffix}`;

      const today = new Date().toISOString().slice(0, 10);

      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        user_id: user.id,
        type: "facture",
        numero,
        statut: "brouillon",
        sujet: `Prestations ${proj}`,
        client_nom: clientNom,
        client_societe: "",
        date_document: today,
        devise: "EUR",
        total_ht: totalHt,
        total_tva: tva20,
        total_ttc: Math.round((totalHt + tva20) * 100) / 100,
        emetteur_nom: "", emetteur_email: "", emetteur_adresse: "", emetteur_ville: "",
        emetteur_code_postal: "", emetteur_pays: "", emetteur_siret: "", emetteur_tva: "",
        emetteur_logo: "", rib_titulaire: "", rib_iban: "", rib_bic: "", rib_banque: "",
        client_email: "", client_telephone: "", client_adresse: "", client_ville: "",
        client_code_postal: "", client_pays: "", client_tva: "",
        remise_pct: 0, acompte: 0, notes: "", conditions: "", mentions_legales: "",
        couleur: "#c9a55a", template: "modern",
      }).select("id").single();

      if (docErr || !doc) { showToast("error", docErr?.message ?? "Erreur création"); return; }

      const rows = ents.map((e, i) => ({
        document_id: doc.id,
        position: i,
        description: e.task_title || e.description || "Prestation",
        unit: "h",
        quantity: Math.round((e.duration_minutes / 60) * 100) / 100,
        unit_price: e.hourly_rate ?? 0,
        vat_rate: 20,
        remise_pct: 0,
      }));

      await supabase.from("document_items").insert(rows);
      await supabase.from("time_entries").update({ is_billed: true, invoice_ref: numero }).in("id", ents.map(e => e.id));
      setEntries(p => p.map(e => ents.find(x => x.id === e.id) ? { ...e, is_billed: true, invoice_ref: numero } : e));

      showToast("success", `Facture ${numero} créée — redirection…`);
      setTimeout(() => router.push("/client/factures"), 1200);
    } finally {
      setCreatingInv(null);
    }
  }

    const today      = todayISO();
  const weekStart  = startOfWeekISO();
  const monthStart = startOfMonthISO();

  const todayStats = useMemo(() => {
    const te = entries.filter(e=>e.date===today);
    const minutes  = te.reduce((a,e)=>a+e.duration_minutes,0);
    const billable = te.filter(e=>e.is_billable??true).reduce((a,e)=>a+e.duration_minutes,0);
    const earnings = te.reduce((a,e)=>(e.hourly_rate&&(e.is_billable??true))?a+(e.duration_minutes/60)*e.hourly_rate:a,0);
    return { minutes, billable, earnings, sessions:te.length };
  },[entries,today]);

  const weekStats = useMemo(() => {
    const we = entries.filter(e=>e.date>=weekStart);
    const minutes = we.reduce((a,e)=>a+e.duration_minutes,0);
    const earnings= we.reduce((a,e)=>(e.hourly_rate&&(e.is_billable??true))?a+(e.duration_minutes/60)*e.hourly_rate:a,0);
    return { minutes, earnings };
  },[entries,weekStart]);

  const monthStats = useMemo(() => {
    const me = entries.filter(e=>e.date>=monthStart);
    const minutes = me.reduce((a,e)=>a+e.duration_minutes,0);
    const earnings= me.reduce((a,e)=>(e.hourly_rate&&(e.is_billable??true))?a+(e.duration_minutes/60)*e.hourly_rate:a,0);
    return { minutes, earnings };
  },[entries,monthStart]);

  const projectStats = useMemo(() => {
    const map = new Map<string,{minutes:number;earnings:number;color:string}>();
    for (const e of entries) {
      if (!map.has(e.project)) {
        const p = projects.find(p=>p.name===e.project);
        map.set(e.project,{minutes:0,earnings:0,color:p?.color??"#a78bfa"});
      }
      const ps = map.get(e.project)!;
      ps.minutes += e.duration_minutes;
      if (e.hourly_rate&&(e.is_billable??true)) ps.earnings += (e.duration_minutes/60)*e.hourly_rate;
    }
    return Array.from(map.entries()).map(([name,d])=>({name,...d})).sort((a,b)=>b.minutes-a.minutes).slice(0,8);
  },[entries,projects]);

  const dailyData = useMemo(() => {
    return Array.from({length:7},(_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-(6-i));
      const iso = d.toISOString().slice(0,10);
      const minutes = entries.filter(e=>e.date===iso).reduce((a,e)=>a+e.duration_minutes,0);
      const label = i===6 ? "Auj." : new Intl.DateTimeFormat("fr-FR",{weekday:"short"}).format(d);
      return { iso, label, minutes };
    });
  },[entries]);

  const catBreakdown = useMemo(() => {
    const map = new Map<string,number>();
    for (const e of entries.filter(e=>e.date>=weekStart)) {
      const k = e.category||"autre";
      map.set(k,(map.get(k)??0)+e.duration_minutes);
    }
    const total = Array.from(map.values()).reduce((a,b)=>a+b,0);
    return Array.from(map.entries()).map(([cat,mins])=>({cat,mins,pct:total?Math.round((mins/total)*100):0})).sort((a,b)=>b.mins-a.mins);
  },[entries,weekStart]);

  const unbilled = useMemo(()=>entries.filter(e=>(e.is_billable??true)&&!e.is_billed),[entries]);
  const unbilledAmt = useMemo(()=>unbilled.reduce((a,e)=>e.hourly_rate?a+(e.duration_minutes/60)*e.hourly_rate:a,0),[unbilled]);

  const [tsFrom, setTsFrom] = useState(() => startOfMonthISO());
  const [tsTo,   setTsTo]   = useState(() => todayISO());

  const clientStats = useMemo(() => {
    const map = new Map<string,{ minutes:number; earnings:number; billable:number; sessions:number }>();
    for (const e of entries) {
      const k = e.client_name?.trim() || "Sans client";
      if (!map.has(k)) map.set(k,{ minutes:0, earnings:0, billable:0, sessions:0 });
      const cs = map.get(k)!;
      cs.minutes   += e.duration_minutes;
      cs.sessions  += 1;
      cs.billable  += (e.is_billable ?? true) ? e.duration_minutes : 0;
      if (e.hourly_rate && (e.is_billable ?? true)) cs.earnings += (e.duration_minutes/60)*e.hourly_rate;
    }
    return Array.from(map.entries())
      .map(([name,d]) => ({ name,...d }))
      .sort((a,b) => b.minutes - a.minutes);
  },[entries]);

  const rapportEntries = useMemo(()=>entries.filter(e=>e.date>=tsFrom&&e.date<=tsTo),[entries,tsFrom,tsTo]);
  const rapportTotals  = useMemo(()=>({
    minutes:  rapportEntries.reduce((a,e)=>a+e.duration_minutes,0),
    earnings: rapportEntries.reduce((a,e)=>e.hourly_rate&&(e.is_billable??true)?a+(e.duration_minutes/60)*e.hourly_rate:a,0),
    sessions: rapportEntries.length,
    billable: rapportEntries.filter(e=>e.is_billable??true).reduce((a,e)=>a+e.duration_minutes,0),
  }),[rapportEntries]);

  const dailyGoalPct = goal ? Math.min(100,Math.round((todayStats.minutes/goal.daily_minutes)*100)) : null;

  const aiInsights = useMemo(()=>{
    const insights:string[]=[];
    const last50 = entries.slice(0,50);
    const tot = last50.reduce((a,e)=>a+e.duration_minutes,0);
    const bil = last50.filter(e=>e.is_billable??true).reduce((a,e)=>a+e.duration_minutes,0);
    const ratio = tot>0?Math.round((bil/tot)*100):0;
    if (ratio<60)    insights.push(`${ratio}% d'heures facturables — objectif : dépasser 70%.`);
    else if (ratio>=80) insights.push(`Excellent ratio facturable : ${ratio}% — continuez ainsi !`);
    const avg7 = dailyData.reduce((a,d)=>a+d.minutes,0)/7;
    if (todayStats.minutes>avg7*1.2&&avg7>30) insights.push(`🔥 +${Math.round(((todayStats.minutes/avg7)-1)*100)}% au-dessus de votre moyenne quotidienne.`);
    else if (todayStats.minutes<avg7*0.5&&avg7>60) insights.push(`💤 Journée en dessous de votre moyenne (${fmtMin(Math.round(avg7))}/j).`);
    if (catBreakdown.length>0) insights.push(`Cette semaine : ${getCategoryLabel(catBreakdown[0].cat)} = ${catBreakdown[0].pct}% de votre temps.`);
    if (unbilledAmt>0) insights.push(`${fmtEur(unbilledAmt)} d'heures non facturées — à facturer dans l'onglet Facturable.`);
    if (pomCycle>0) insights.push(`🍅 ${pomCycle} Pomodoro${pomCycle>1?"s":""} terminé${pomCycle>1?"s":""} aujourd'hui !`);
    return insights.slice(0,4);
  },[entries,todayStats,dailyData,catBreakdown,unbilledAmt,pomCycle]);

    let timerDisplay = fmt(elapsed);
  let timerColor   = paused ? "#f59e0b" : running ? violet : "rgba(255,255,255,0.5)";
  let timerGlow    = paused ? "rgba(245,158,11,0.3)" : running ? "rgba(167,139,250,0.35)" : "transparent";

  if (mode==="pomodoro") {
    const lim = pomPhase==="work" ? POM_WORK : POM_BREAK;
    const rem = Math.max(0,lim-elapsed);
    timerDisplay = fmt(rem);
    timerColor   = pomPhase==="work" ? "#f87171" : "#34d399";
    timerGlow    = pomPhase==="work" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)";
  } else if (mode==="countdown") {
    const rem = Math.max(0,cdTarget-elapsed);
    timerDisplay = fmt(rem);
    timerColor   = rem<60 ? "#f87171" : "#60a5fa";
    timerGlow    = rem<60 ? "rgba(248,113,113,0.3)" : "rgba(96,165,250,0.3)";
  }

  const pomPct  = mode==="pomodoro" ? Math.min(1, elapsed/(pomPhase==="work"?POM_WORK:POM_BREAK)) : 0;
  const cdPct   = (mode==="countdown"&&cdTarget>0) ? Math.min(1, elapsed/cdTarget) : 0;
  const circR   = 60; const circC = 2*Math.PI*circR;

    const grouped = useMemo(()=>{
    const map = new Map<string,TimeEntry[]>();
    for (const e of entries) {
      if (!map.has(e.date)) map.set(e.date,[]);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries()).sort((a,b)=>b[0].localeCompare(a[0]));
  },[entries]);

    const projHours = useMemo(()=>{
    const m = new Map<string,number>();
    for (const e of entries) m.set(e.project,(m.get(e.project)??0)+e.duration_minutes);
    return m;
  },[entries]);

    const isFocusActive = focusMode && (running||paused);

    return (
    <div className={`min-h-screen ${isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]"}`}>

            <AnimatePresence>
        {isFocusActive && (
          <motion.div
            key="focus-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080e]"
          >
            <div className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(ellipse 60% 50% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)"}} />
            <button onClick={()=>setFocusMode(false)} className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:text-white/70">
              <X size={16}/>
            </button>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/30">{sProject||"Focus"}</p>
            <div className="font-mono text-[5rem] font-bold leading-none tracking-tighter sm:text-[7rem]" style={{color:"#34d399",textShadow:"0 0 60px rgba(52,211,153,0.4)"}}>
              {timerDisplay}
            </div>
            {paused&&<span className="mt-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">EN PAUSE</span>}
            <div className="mt-10 flex items-center gap-5">
              {running ? (
                <button onClick={handlePause} className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 transition hover:bg-amber-500/20">
                  <Pause size={20} style={{color:"#f59e0b"}}/>
                </button>
              ) : (
                <button onClick={handleResume} className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 transition hover:bg-emerald-500/20">
                  <Play size={20} className="ml-0.5 fill-emerald-400 text-emerald-400"/>
                </button>
              )}
              <button onClick={handleStop} disabled={saving} className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] shadow-[0_6px_24px_rgba(139,92,246,0.4)] transition hover:opacity-90 disabled:opacity-50">
                {saving?<Loader2 size={22} className="animate-spin text-white"/>:<Square size={20} className="fill-white text-white"/>}
              </button>
            </div>
            {sRate&&elapsed>0&&<p className="mt-6 text-sm font-bold" style={{color:"#c9a55a"}}>{fmtEur((elapsed/3600)*parseFloat(sRate))} estimé</p>}
          </motion.div>
        )}
      </AnimatePresence>

            <div className="relative z-10 overflow-hidden border-b border-white/6 px-5 py-4 sm:px-8"
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#eef0f8,#e8ebf5,#eef0f8)" }}>
        {/* Gold shimmer line */}
        <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:0.9,ease:"easeOut"}}
          className="absolute inset-x-0 top-0 h-[2px] origin-left"
          style={{background:`linear-gradient(90deg,${violet},${violet}aa,${violet}22,transparent)`}}/>
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full opacity-[0.07]"
          style={{background:`radial-gradient(circle,${violet},transparent 70%)`}}/>
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full opacity-[0.04]"
          style={{background:`radial-gradient(circle,${violet},transparent 70%)`}}/>
        <div className="relative z-10 mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{backgroundColor:`${violet}14`,borderColor:`${violet}28`}}>
              <Timer size={18} style={{color:violet}}/>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Chrono Pro</h1>
              <p className="text-[0.65rem] text-white/30">{entries.length} session{entries.length!==1?"s":""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>exportICS(entries)} title="Sync calendrier (ICS)"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:border-sky-500/30 hover:text-sky-400">
              <CalendarPlus size={15}/>
            </button>
            <button onClick={()=>exportTimesheet(entries)} title="Export timesheet CSV"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:border-emerald-500/30 hover:text-emerald-400">
              <Download size={15}/>
            </button>
            <button onClick={()=>{setGoalDraft({daily_minutes:String(goal?.daily_minutes??480),weekly_minutes:String(goal?.weekly_minutes??2400),daily_billable_minutes:String(goal?.daily_billable_minutes??360)});setGoalOpen(true)}}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:border-white/20 hover:text-white/60" title="Objectifs">
              <Target size={15}/>
            </button>
            <button onClick={()=>{setManualDraft(emptyManual());setManualOpen(true)}}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
              style={{background:violet,boxShadow:`0 4px 16px ${violet}40`}}>
              <Plus size={13}/> Ajout manuel
            </button>
          </div>
        </div>
      </div>

            <div className="relative z-10 border-b border-white/6 bg-[#07080e]/60 px-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl">
          {TABS.map(t=>(
            <button key={t.value} onClick={()=>setTab(t.value)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition ${tab===t.value?"text-white":"text-white/40 hover:text-white/60"}`}>
              <t.Icon size={13}/>
              {t.label}
              {t.value==="billing"&&unbilled.length>0&&(
                <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold" style={{background:"#f87171",color:"#fff"}}>
                  {unbilled.length}
                </span>
              )}
              {tab===t.value&&(
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{background:violet}}/>
              )}
            </button>
          ))}
        </div>
      </div>

            <div className="relative z-10 mx-auto max-w-5xl px-5 py-5 sm:px-8">

                {tab==="timer"&&(
          <div className="space-y-4">

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {label:"Aujourd'hui",value:fmtMin(todayStats.minutes),sub:`${todayStats.sessions} session${todayStats.sessions!==1?"s":""}`,color:"#a78bfa"},
                {label:"Facturable",value:fmtMin(todayStats.billable),sub:"heures",color:"#34d399"},
                {label:"Revenus",value:todayStats.earnings>0?fmtEur(todayStats.earnings):"—",sub:"aujourd'hui",color:"#c9a55a"},
                {label:"Objectif",value:dailyGoalPct!==null?`${dailyGoalPct}%`:"—",sub:goal?`/${fmtMin(goal.daily_minutes)}`:"Non défini",color:dailyGoalPct!==null&&dailyGoalPct>=100?"#34d399":"#a78bfa"},
              ].map((k,i)=>(
                <div key={i} className="flex flex-col justify-between rounded-xl border border-white/6 bg-white/4 px-4 py-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{k.label}</p>
                  <p className="mt-1 text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                  <p className="text-[0.65rem] text-white/30">{k.sub}</p>
                </div>
              ))}
            </div>

                        {dailyGoalPct!==null&&(
              <div className="overflow-hidden rounded-xl border border-white/6 bg-white/4 px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50">Objectif quotidien</span>
                  <span className="text-xs font-bold" style={{color:dailyGoalPct>=100?"#34d399":violet}}>{dailyGoalPct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div className="h-full rounded-full" initial={{width:0}} animate={{width:`${dailyGoalPct}%`}} transition={{duration:0.8,ease:[0.16,1,0.3,1]}}
                    style={{background:dailyGoalPct>=100?"#34d399":violet}}/>
                </div>
              </div>
            )}

                        <div className="flex gap-2 flex-wrap">
              {MODES.map(m=>(
                <button key={m.value} onClick={()=>{if(!running&&!paused){setMode(m.value);modeRef.current=m.value;setElapsed(0);}}}
                  disabled={running||paused}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed ${mode===m.value?"border-current bg-current/10":"border-white/10 bg-transparent text-white/40 hover:border-white/20 hover:text-white/60"}`}
                  style={mode===m.value?{color:m.color,borderColor:`${m.color}40`}:{}}>
                  <Circle size={7} className="fill-current"/>
                  {m.label}
                </button>
              ))}
            </div>

                        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease}}
              className="overflow-hidden rounded-2xl border border-white/6 bg-white/4 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

              <AnimatePresence>
                {(running||paused)&&(
                  <motion.div key={running?"r":"p"} initial={{scaleX:0}} animate={{scaleX:1}} exit={{scaleX:0}}
                    style={{transformOrigin:"left",background:`linear-gradient(to right, ${timerColor}, ${timerColor}aa)`}}
                    className="h-0.5 w-full"/>
                )}
              </AnimatePresence>

                            {mode==="pomodoro"&&(
                <>
                  {pomPhase==="break"&&running&&(
                    <motion.div initial={{opacity:0}} animate={{opacity:1}}
                      className="flex items-center justify-center gap-2 border-b border-emerald-500/20 bg-emerald-500/[0.07] px-6 py-2">
                      <Coffee size={14} style={{color:"#34d399"}} className="animate-pulse"/>
                      <span className="text-[11px] font-black tracking-widest uppercase" style={{color:"#34d399"}}>
                        ☕ Pause Pomodoro — Repose-toi !
                      </span>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between border-b border-white/6 px-6 py-3">
                    <div className="flex items-center gap-2">
                      {pomPhase==="work" ? <Flame size={14} style={{color:"#f87171"}}/> : <Coffee size={14} style={{color:"#34d399"}}/>}
                      <span className="text-xs font-bold" style={{color:pomPhase==="work"?"#f87171":"#34d399"}}>
                        {pomPhase==="work" ? "TRAVAIL" : "PAUSE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Array.from({length:Math.min(8,pomCycle+1)},(_,i)=>(
                        <div key={i} className="h-2 w-2 rounded-full" style={{background:i<pomCycle?"#f87171":"rgba(248,113,113,0.25)"}}/>
                      ))}
                      {pomCycle>0&&<span className="ml-1 text-[0.65rem] text-white/30">#{pomCycle}</span>}
                    </div>
                  </div>
                </>
              )}

              <div className="px-6 py-7 sm:px-8">

                                {mode==="countdown"&&!running&&!paused&&(
                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-xs font-bold text-white/40">Durée :</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="23" value={cdH} onChange={e=>setCdH(e.target.value)}
                        className="w-16 rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-center text-sm font-bold text-white outline-none focus:border-[rgba(96,165,250,0.45)]"
                        placeholder="0"/>
                      <span className="text-white/40 text-sm">h</span>
                      <input type="number" min="0" max="59" value={cdM} onChange={e=>setCdM(e.target.value)}
                        className="w-16 rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-center text-sm font-bold text-white outline-none focus:border-[rgba(96,165,250,0.45)]"
                        placeholder="25"/>
                      <span className="text-white/40 text-sm">min</span>
                    </div>
                  </div>
                )}

                                <div className="mb-6 grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Titre de la tâche</label>
                    <input value={sTitle} onChange={e=>setSTitle(e.target.value)} placeholder="Ex: Design landing page…"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Projet</label>
                    <input list="proj-list" value={sProject} onChange={e=>setSProject(e.target.value)} placeholder="Nom du projet"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                    <datalist id="proj-list">{projects.map(p=><option key={p.id} value={p.name}/>)}</datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Client</label>
                    <input value={sClient} onChange={e=>setSClient(e.target.value)} placeholder="Nom du client"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Catégorie</label>
                    <select value={sCat} onChange={e=>setSCat(e.target.value)}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[rgba(167,139,250,0.4)]">
                      {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Taux horaire (€)</label>
                    <input type="number" min="0" step="5" value={sRate} onChange={e=>setSRate(e.target.value)} placeholder="75"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div className="flex items-end pb-0.5">
                    <button onClick={()=>setSBillable(b=>!b)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${sBillable?"border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] text-emerald-400":"border-white/10 text-white/30"}`}>
                      <CheckCircle size={13}/>
                      {sBillable?"Facturable":"Non facturable"}
                    </button>
                  </div>
                </div>

                                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="relative flex items-center justify-center">
                    {(mode==="pomodoro"||mode==="countdown")&&(
                      <svg width={140} height={140} className="absolute -inset-[22px]" style={{transform:"rotate(-90deg)"}}>
                        <circle cx={70} cy={70} r={circR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3}/>
                        <circle cx={70} cy={70} r={circR} fill="none" stroke={timerColor} strokeWidth={3}
                          strokeDasharray={circC} strokeDashoffset={circC*(1-(mode==="pomodoro"?pomPct:cdPct))}
                          strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
                      </svg>
                    )}
                    <div>
                      <motion.div className="font-mono font-bold leading-none tracking-tighter"
                        style={{fontSize:"3.8rem",color:timerColor,textShadow:`0 0 50px ${timerGlow}`}}>
                        {timerDisplay}
                      </motion.div>
                      {paused&&<div className="mt-1.5 text-center"><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/12 px-3 py-1 text-[0.65rem] font-black tracking-widest uppercase text-amber-400 animate-pulse"><Pause size={9}/> En pause</span></div>}
                      {sRate&&elapsed>0&&running&&(
                        <p className="mt-1 text-center text-sm font-bold" style={{color:"#c9a55a"}}>
                          {fmtEur((elapsed/3600)*parseFloat(sRate))}
                        </p>
                      )}
                    </div>
                  </div>

                                    <div className="flex flex-col items-center gap-3">
                    {!running&&!paused ? (
                      <div className="flex flex-col items-center gap-2">
                        <button onClick={handleStart} disabled={saving}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] shadow-[0_6px_24px_rgba(139,92,246,0.45)] transition active:scale-95 disabled:opacity-40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.55)]">
                          <Play size={22} className="ml-1 fill-white text-white"/>
                        </button>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">Démarrer</span>
                      </div>
                    ):(
                      <div className="flex items-end gap-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <button onClick={running?handlePause:handleResume}
                            className={`flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 ${running?"bg-amber-500/15 border border-amber-500/40":"bg-emerald-500/15 border border-emerald-500/40"}`}>
                            {running?<Pause size={18} style={{color:"#f59e0b"}}/>:<Play size={18} className="ml-0.5 fill-emerald-400 text-emerald-400"/>}
                          </button>
                          <span className="text-[0.6rem] font-bold uppercase" style={{color:running?"#f59e0b":"#34d399"}}>{running?"Pause":"Reprendre"}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <button onClick={handleStop} disabled={saving}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-[0_6px_24px_rgba(239,68,68,0.4)] transition active:scale-95 disabled:opacity-40">
                            {saving?<Loader2 size={20} className="animate-spin text-white"/>:<Square size={18} className="fill-white text-white"/>}
                          </button>
                          <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">{saving?"Enreg…":"Arrêter"}</span>
                        </div>
                        {mode==="focus"&&(
                          <div className="flex flex-col items-center gap-1.5">
                            <button onClick={()=>setFocusMode(true)}
                              className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 transition hover:bg-emerald-500/20">
                              <Zap size={16} style={{color:"#34d399"}}/>
                            </button>
                            <span className="text-[0.6rem] font-bold uppercase text-white/30">Focus</span>
                          </div>
                        )}
                      </div>
                    )}
                    {(running||paused)&&mode==="focus"&&!focusMode&&(
                      <button onClick={()=>setFocusMode(true)} className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-[0.65rem] font-bold text-emerald-400 transition hover:bg-emerald-500/15">
                        <Zap size={11}/> Mode Focus
                      </button>
                    )}
                  </div>
                </div>

                                <div className="mt-5">
                  <input value={sNotes} onChange={e=>setSNotes(e.target.value)} placeholder="Notes optionnelles pour cette session…"
                    className="w-full rounded-xl border border-white/6 bg-transparent px-3.5 py-2 text-sm text-white/50 placeholder:text-white/18 outline-none focus:border-[rgba(167,139,250,0.25)]"/>
                </div>
              </div>
            </motion.div>

                        <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-white/30">Historique</span>
                {loading&&<Loader2 size={12} className="animate-spin text-white/20"/>}
              </div>
              {grouped.length===0&&!loading?(
                <div className="flex flex-col items-center gap-4 rounded-xl border border-white/6 bg-white/4 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.08)]">
                    <Timer size={24} style={{color:violet}}/>
                  </div>
                  <p className="text-sm font-bold text-white/60">Aucune session — démarrez le chrono !</p>
                </div>
              ):(
                <div className="space-y-4">
                  {grouped.map(([date,day])=>(
                    <div key={date}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5"><CalendarDays size={11} className="text-white/25"/><span className="text-xs font-bold text-white/40">{isoToLabel(date)}</span></div>
                        <span className="text-[0.65rem] text-white/25">Total: {fmtMin(day.reduce((a,e)=>a+e.duration_minutes,0))}</span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/6 bg-white/4">
                        {day.map((e,i)=>{
                          const earn = e.hourly_rate&&(e.is_billable??true)?(e.duration_minutes/60)*e.hourly_rate:null;
                          return (
                            <div key={e.id} className={`group flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/4 ${i!==day.length-1?"border-b border-white/5":""}`}>
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{background:`${getCategoryColor(e.category)}18`,border:`1px solid ${getCategoryColor(e.category)}30`}}>
                                <Tag size={11} style={{color:getCategoryColor(e.category)}}/>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2">
                                  <span className="truncate text-sm font-bold text-white/90">{e.task_title||e.project}</span>
                                  {e.task_title&&<span className="text-xs text-white/30">{e.project}</span>}
                                  {e.client_name&&<span className="flex items-center gap-1 text-xs text-white/30"><User size={9}/>{e.client_name}</span>}
                                  {!(e.is_billable??true)&&<span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{background:"rgba(148,163,184,0.1)",color:"#94a3b8"}}>NF</span>}
                                  {e.is_billed&&<span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{background:"rgba(52,211,153,0.1)",color:"#34d399"}}>FACTURÉ</span>}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="text-sm font-extrabold" style={{color:violet}}>{fmtMin(e.duration_minutes)}</span>
                                {earn!==null&&<p className="text-[0.65rem] font-semibold" style={{color:"rgba(201,165,90,0.8)"}}>{fmtEur(earn)}</p>}
                              </div>
                              <button onClick={()=>setConfirmDel(e.id)} className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/20 opacity-0 transition hover:border-red-500/30 hover:text-red-400 group-hover:opacity-100">
                                <Trash2 size={11}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

                {tab==="stats"&&(
          <div className="space-y-5">

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {label:"Aujourd'hui",value:fmtMin(todayStats.minutes),sub:fmtEur(todayStats.earnings),color:"#a78bfa"},
                {label:"Cette semaine",value:fmtMin(weekStats.minutes),sub:fmtEur(weekStats.earnings),color:"#60a5fa"},
                {label:"Ce mois",value:fmtMin(monthStats.minutes),sub:fmtEur(monthStats.earnings),color:"#c9a55a"},
                {label:"Non facturé",value:fmtEur(unbilledAmt),sub:`${unbilled.length} entrée${unbilled.length!==1?"s":""}`,color:"#f87171"},
              ].map((k,i)=>(
                <div key={i} className="rounded-xl border border-white/6 bg-white/4 px-5 py-4">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{k.label}</p>
                  <p className="mt-2 text-2xl font-bold" style={{color:k.color}}>{k.value}</p>
                  <p className="mt-0.5 text-xs text-white/30">{k.sub}</p>
                </div>
              ))}
            </div>

                        <div className="rounded-xl border border-white/6 bg-white/4 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">7 Derniers jours</p>
              {(() => {
                const maxMin = Math.max(...dailyData.map(d=>d.minutes),1);
                return (
                  <div className="flex items-end gap-2 h-28">
                    {dailyData.map((d,i)=>(
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[0.6rem] font-bold text-white/40">{d.minutes>0?fmtMin(d.minutes):""}</span>
                        <div className="w-full rounded-t-lg transition-all" style={{height:`${Math.max(4,(d.minutes/maxMin)*80)}px`,background:d.iso===today?violet:"rgba(167,139,250,0.25)"}}/>
                        <span className="text-[0.6rem] font-bold text-white/30">{d.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

                        <div className="rounded-xl border border-white/6 bg-white/4 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Temps par projet</p>
              {projectStats.length===0?(
                <p className="py-6 text-center text-sm text-white/25">Aucune donnée</p>
              ):(
                <div className="space-y-3">
                  {projectStats.map((ps,i)=>{
                    const maxMin = projectStats[0]?.minutes||1;
                    return (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{background:ps.color}}/>
                            <span className="text-xs font-bold text-white/80">{ps.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold" style={{color:ps.color}}>{fmtMin(ps.minutes)}</span>
                            {ps.earnings>0&&<span className="text-[0.65rem] text-white/30">{fmtEur(ps.earnings)}</span>}
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                          <div className="h-full rounded-full" style={{width:`${(ps.minutes/maxMin)*100}%`,background:ps.color,opacity:0.7}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

                        <div className="rounded-xl border border-white/6 bg-white/4 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Catégories cette semaine</p>
              {catBreakdown.length===0?(
                <p className="py-6 text-center text-sm text-white/25">Aucune donnée</p>
              ):(
                <div className="space-y-3">
                  {catBreakdown.map((c,i)=>(
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-xs font-bold text-white/60">{getCategoryLabel(c.cat)}</div>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-white/6">
                          <div className="h-full rounded-full" style={{width:`${c.pct}%`,background:getCategoryColor(c.cat)}}/>
                        </div>
                      </div>
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-xs font-extrabold" style={{color:getCategoryColor(c.cat)}}>{c.pct}%</span>
                        <span className="ml-1 text-[0.6rem] text-white/25">{fmtMin(c.mins)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

                        {aiInsights.length>0&&(
              <div className="rounded-xl border border-[rgba(167,139,250,0.15)] bg-[rgba(139,92,246,0.06)] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Brain size={16} style={{color:violet}}/>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{color:violet}}>Analyse IA Productivité</p>
                </div>
                <div className="space-y-2.5">
                  {aiInsights.map((ins,i)=>(
                    <div key={i} className="rounded-xl border border-white/6 bg-white/4 px-4 py-2.5 text-sm text-white/70">{ins}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

                {tab==="projects"&&(
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/30">{projects.length} Projet{projects.length!==1?"s":""}</p>
              <button onClick={()=>{setProjDraft(emptyProject());setProjOpen(true)}}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
                style={{background:violet,boxShadow:`0 4px 16px ${violet}40`}}>
                <Plus size={13}/> Nouveau projet
              </button>
            </div>

            {loading?(
              <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-white/20"/></div>
            ):projects.length===0?(
              <div className="flex flex-col items-center gap-4 rounded-xl border border-white/6 bg-white/4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.08)]">
                  <Briefcase size={24} style={{color:violet}}/>
                </div>
                <p className="text-sm font-bold text-white/60">Aucun projet — créez votre premier !</p>
              </div>
            ):(
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map(p=>{
                  const mins = projHours.get(p.name)??0;
                  const earn = p.hourly_rate>0?(mins/60)*p.hourly_rate:0;
                  const budgetPct = p.budget_hours>0?Math.min(100,Math.round((mins/60/p.budget_hours)*100)):null;
                  return (
                    <div key={p.id} className="rounded-xl border border-white/6 bg-white/4 p-5">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl" style={{background:`${p.color}20`,border:`1px solid ${p.color}40`}}>
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="h-3 w-3 rounded-full" style={{background:p.color}}/>
                            </div>
                          </div>
                          <div>
                            <p className="font-extrabold text-white">{p.name}</p>
                            {p.client_name&&<p className="text-xs text-white/40">{p.client_name}</p>}
                          </div>
                        </div>
                        <button onClick={()=>{setSProject(p.name);setSRate(String(p.hourly_rate||""));setTab("timer");}}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-white/40 transition hover:border-white/20 hover:text-white/60">
                          Chrono
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Temps total</p>
                          <p className="mt-0.5 text-lg font-bold" style={{color:p.color}}>{fmtMin(mins)}</p>
                        </div>
                        {p.hourly_rate>0&&(
                          <div>
                            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Revenus</p>
                            <p className="mt-0.5 text-lg font-bold" style={{color:"#c9a55a"}}>{fmtEur(earn)}</p>
                          </div>
                        )}
                      </div>
                      {budgetPct!==null&&(
                        <div>
                          <div className="mb-1 flex justify-between text-[0.6rem] text-white/30">
                            <span>Budget {fmtMin(Math.round(p.budget_hours*60))}</span>
                            <span className={budgetPct>=90?"text-red-400":""}>{budgetPct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                            <div className="h-full rounded-full" style={{width:`${budgetPct}%`,background:budgetPct>=90?"#f87171":p.color}}/>
                          </div>
                        </div>
                      )}
                      {p.hourly_rate>0&&(
                        <p className="mt-2 text-[0.65rem] text-white/25">{p.hourly_rate}€/h</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

                        {projectStats.filter(ps=>!projects.find(p=>p.name===ps.name)).length>0&&(
              <div className="rounded-xl border border-white/6 bg-white/4 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/30">Autres projets (sans fiche)</p>
                <div className="space-y-2">
                  {projectStats.filter(ps=>!projects.find(p=>p.name===ps.name)).map((ps,i)=>(
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/4 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{background:ps.color}}/>
                        <span className="text-sm font-bold text-white/80">{ps.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold" style={{color:ps.color}}>{fmtMin(ps.minutes)}</span>
                        {ps.earnings>0&&<span className="text-xs text-white/30">{fmtEur(ps.earnings)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

                {tab==="rapport"&&(
          <div className="space-y-5">

            {/* Date range + export */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/6 bg-white/4 p-4">
              <div>
                <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Du</p>
                <input type="date" value={tsFrom} onChange={e=>setTsFrom(e.target.value)}
                  className="rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-sm text-white outline-none focus:border-[rgba(167,139,250,0.4)]"/>
              </div>
              <div>
                <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Au</p>
                <input type="date" value={tsTo} onChange={e=>setTsTo(e.target.value)}
                  className="rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-sm text-white outline-none focus:border-[rgba(167,139,250,0.4)]"/>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={()=>exportTimesheet(entries,tsFrom,tsTo)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/15">
                  <Download size={12}/>Timesheet CSV
                </button>
                <button onClick={()=>exportICS(rapportEntries)}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/8 px-4 py-2 text-xs font-bold text-sky-400 transition hover:bg-sky-500/15">
                  <CalendarPlus size={12}/>Sync Calendrier
                </button>
              </div>
            </div>

            {/* Period KPIs */}
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                {label:"Sessions",   value:String(rapportTotals.sessions),  color:"#a78bfa"},
                {label:"Durée totale",value:fmtMin(rapportTotals.minutes),  color:"#60a5fa"},
                {label:"Facturable", value:fmtMin(rapportTotals.billable),  color:"#34d399"},
                {label:"Revenus",    value:rapportTotals.earnings>0?fmtEur(rapportTotals.earnings):"—", color:"#c9a55a"},
              ].map((k,i)=>(
                <div key={i} className="rounded-xl border border-white/6 bg-white/4 px-4 py-3.5">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{k.label}</p>
                  <p className="mt-1.5 text-xl font-bold" style={{color:k.color}}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Client breakdown */}
            <div className="rounded-xl border border-white/6 bg-white/4 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/6 px-5 py-3">
                <Users size={13} style={{color:violet}}/>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Temps par client</p>
              </div>
              {clientStats.length===0?(
                <p className="py-8 text-center text-sm text-white/25">Aucune donnée</p>
              ):(
                <div className="divide-y divide-white/5">
                  {clientStats.map((cs,i)=>{
                    const maxMin = clientStats[0]?.minutes||1;
                    const billPct = cs.minutes>0?Math.round((cs.billable/cs.minutes)*100):0;
                    return (
                      <div key={i} className="px-5 py-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User size={12} style={{color:violet}}/>
                            <span className="text-sm font-bold text-white/85">{cs.name}</span>
                            <span className="text-[10px] text-white/30">{cs.sessions} session{cs.sessions!==1?"s":""}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-extrabold" style={{color:violet}}>{fmtMin(cs.minutes)}</span>
                            {cs.earnings>0&&<span className="text-sm font-bold" style={{color:"#c9a55a"}}>{fmtEur(cs.earnings)}</span>}
                            <span className="text-[10px] text-emerald-400/70">{billPct}% factu.</span>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                          <div className="h-full rounded-full" style={{width:`${(cs.minutes/maxMin)*100}%`,background:violet,opacity:0.65}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Entries table for the period */}
            {rapportEntries.length>0&&(
              <div className="rounded-xl border border-white/6 bg-white/4 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/6 px-5 py-3">
                  <FileText size={13} className="text-white/30"/>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">{rapportEntries.length} entrée{rapportEntries.length!==1?"s":""} sur la période</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {rapportEntries.slice(0,50).map(e=>{
                    const earn = e.hourly_rate&&(e.is_billable??true)?(e.duration_minutes/60)*e.hourly_rate:null;
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{background:`${getCategoryColor(e.category)}18`}}>
                          <div className="h-1.5 w-1.5 rounded-full" style={{background:getCategoryColor(e.category)}}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white/80">{e.task_title||e.project}</p>
                          <p className="text-[10px] text-white/30">{e.date} · {e.client_name||"—"}</p>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{color:violet}}>{fmtMin(e.duration_minutes)}</span>
                        {earn!==null&&<span className="text-xs shrink-0" style={{color:"#c9a55a"}}>{fmtEur(earn)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="billing"&&(
          <div className="space-y-4">

                        <div className="flex items-center justify-between rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Total non facturé</p>
                <p className="mt-1 text-3xl font-bold" style={{color:"#c9a55a"}}>{fmtEur(unbilledAmt)}</p>
                <p className="mt-0.5 text-xs text-white/30">{unbilled.length} entrée{unbilled.length!==1?"s":""}</p>
              </div>
              {unbilledAmt>0&&(
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] px-3 py-1.5">
                    <TrendingUp size={12} style={{color:"#c9a55a"}}/>
                    <span className="text-xs font-bold" style={{color:"#c9a55a"}}>Prêt à facturer</span>
                  </div>
                  <p className="text-[0.65rem] text-white/30">Cliquez "Créer facture" par projet</p>
                </div>
              )}
            </div>

            {unbilled.length===0?(
              <div className="flex flex-col items-center gap-4 rounded-xl border border-white/6 bg-white/4 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/8">
                  <CheckCircle size={24} className="text-emerald-400"/>
                </div>
                <p className="text-sm font-bold text-white/60">Aucune heure non facturée 🎉</p>
                <p className="text-xs text-white/25">Tout est à jour !</p>
              </div>
            ):(
              (() => {

                const byProject = new Map<string,TimeEntry[]>();
                for (const e of unbilled) {
                  if (!byProject.has(e.project)) byProject.set(e.project,[]);
                  byProject.get(e.project)!.push(e);
                }
                return (
                  <div className="space-y-4">
                    {Array.from(byProject.entries()).map(([proj,ents])=>{
                      const projMins = ents.reduce((a,e)=>a+e.duration_minutes,0);
                      const projAmt  = ents.reduce((a,e)=>e.hourly_rate?a+(e.duration_minutes/60)*e.hourly_rate:a,0);
                      return (
                        <div key={proj} className="overflow-hidden rounded-xl border border-white/6 bg-white/4">
                          <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Briefcase size={13} style={{color:violet}}/>
                              <span className="font-extrabold text-white">{proj}</span>
                              <span className="text-xs text-white/30">{fmtMin(projMins)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {projAmt>0&&<span className="font-extrabold" style={{color:"#c9a55a"}}>{fmtEur(projAmt)}</span>}
                              {projAmt > 0 && (
                                <button onClick={()=>{ void handleCreateInvoice(proj, ents); }} disabled={!!creatingInv}
                                  className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-3 py-1.5 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.18)] disabled:opacity-40">
                                  {creatingInv===proj ? <Loader2 size={11} className="animate-spin"/> : <FileText size={11}/>}
                                  Créer facture
                                </button>
                              )}
                              <button onClick={()=>{ void handleMarkAllBilled(ents.map(e=>e.id)); }}
                                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/15">
                                <CheckCircle size={11}/>Tout marquer facturé
                              </button>
                            </div>
                          </div>
                          {ents.map((e,i)=>{
                            const earn = e.hourly_rate?(e.duration_minutes/60)*e.hourly_rate:null;
                            return (
                              <div key={e.id} className={`flex items-center gap-3 px-5 py-3 ${i!==ents.length-1?"border-b border-white/4":""}`}>
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{background:`${getCategoryColor(e.category)}15`}}>
                                  <div className="h-1.5 w-1.5 rounded-full" style={{background:getCategoryColor(e.category)}}/>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-white/80">{e.task_title||e.description||"Session"}</p>
                                  <p className="text-[0.65rem] text-white/30">{isoToLabel(e.date)} · {e.client_name||"—"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-bold" style={{color:violet}}>{fmtMin(e.duration_minutes)}</p>
                                  {earn!==null&&<p className="text-xs text-white/30">{fmtEur(earn)}</p>}
                                </div>
                                <button onClick={()=>handleMarkBilled(e.id)}
                                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 text-emerald-500/50 transition hover:border-emerald-500/40 hover:text-emerald-400">
                                  <CheckCircle size={12}/>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

            <AnimatePresence>
        {manualOpen&&(
          <>
            <motion.div key="mb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" onClick={()=>setManualOpen(false)}/>
            <motion.div key="ms" initial={{y:"100%",opacity:0}} animate={{y:0,opacity:1}} exit={{y:"100%",opacity:0}}
              transition={{type:"spring",damping:30,stiffness:260}}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-[2rem] border-t border-x border-white/8 bg-[#0e1420] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]">
              <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-white/15"/></div>
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(139,92,246,0.1)]">
                    <Plus size={14} style={{color:violet}}/>
                  </div>
                  <h2 className="text-sm font-extrabold text-white">Ajout manuel</h2>
                </div>
                <button onClick={()=>setManualOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:text-white/70"><X size={15}/></button>
              </div>
              <div className="max-h-[72vh] overflow-y-auto px-6 py-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Titre de la tâche</label>
                    <input value={manualDraft.task_title} onChange={e=>setManualDraft(d=>({...d,task_title:e.target.value}))} placeholder="Ex: Revue de code..."
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Projet <span style={{color:violet}}>*</span></label>
                    <input list="mproj-list" value={manualDraft.project} onChange={e=>setManualDraft(d=>({...d,project:e.target.value}))} placeholder="Nom du projet"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                    <datalist id="mproj-list">{projects.map(p=><option key={p.id} value={p.name}/>)}</datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Client</label>
                    <input value={manualDraft.client_name} onChange={e=>setManualDraft(d=>({...d,client_name:e.target.value}))} placeholder="Nom du client"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Catégorie</label>
                    <select value={manualDraft.category} onChange={e=>setManualDraft(d=>({...d,category:e.target.value}))}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[rgba(167,139,250,0.4)]">
                      {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Date</label>
                    <input type="date" value={manualDraft.date} onChange={e=>setManualDraft(d=>({...d,date:e.target.value}))}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Durée (min) <span style={{color:violet}}>*</span></label>
                    <input type="number" min="1" value={manualDraft.duration_minutes} onChange={e=>setManualDraft(d=>({...d,duration_minutes:e.target.value}))} placeholder="60"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Taux horaire (€)</label>
                    <input type="number" min="0" step="5" value={manualDraft.hourly_rate} onChange={e=>setManualDraft(d=>({...d,hourly_rate:e.target.value}))} placeholder="75"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div className="flex items-end">
                    <button onClick={()=>setManualDraft(d=>({...d,is_billable:!d.is_billable}))}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${manualDraft.is_billable?"border-emerald-500/30 bg-emerald-500/10 text-emerald-400":"border-white/10 text-white/30"}`}>
                      <CheckCircle size={13}/>{manualDraft.is_billable?"Facturable":"Non facturable"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Notes</label>
                  <textarea value={manualDraft.notes} onChange={e=>setManualDraft(d=>({...d,notes:e.target.value}))} placeholder="Notes optionnelles…" rows={2}
                    className="w-full resize-none rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.35)]"/>
                </div>
                {manualDraft.hourly_rate&&manualDraft.duration_minutes&&manualDraft.is_billable&&(
                  <div className="flex items-center justify-between rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.06)] px-4 py-3">
                    <span className="text-xs text-white/40">Revenus estimés</span>
                    <span className="text-sm font-extrabold" style={{color:"#c9a55a"}}>{fmtEur((parseInt(manualDraft.duration_minutes,10)/60)*parseFloat(manualDraft.hourly_rate))}</span>
                  </div>
                )}
                <div className="flex gap-3 pb-2">
                  <button onClick={()=>setManualOpen(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20">Annuler</button>
                  <button onClick={handleManualSave} disabled={manualSaving||!manualDraft.project.trim()||!manualDraft.duration_minutes}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-40"
                    style={{background:`linear-gradient(135deg, ${violet}, #7c3aed)`,boxShadow:`0 4px 16px ${violet}30`}}>
                    {manualSaving&&<Loader2 size={13} className="animate-spin"/>}
                    {manualSaving?"Enregistrement…":"Ajouter"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {projOpen&&(
          <>
            <motion.div key="pb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" onClick={()=>setProjOpen(false)}/>
            <motion.div key="pd" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:10}}
              transition={{duration:0.3,ease}} className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl border border-white/8 bg-[#0e1420] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">Nouveau projet</h2>
                <button onClick={()=>setProjOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-white/70"><X size={15}/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Nom <span style={{color:violet}}>*</span></label>
                  <input value={projDraft.name} onChange={e=>setProjDraft(d=>({...d,name:e.target.value}))} placeholder="Nom du projet"
                    className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                </div>
                <div>
                  <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Client</label>
                  <input value={projDraft.client_name} onChange={e=>setProjDraft(d=>({...d,client_name:e.target.value}))} placeholder="Nom du client"
                    className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Taux (€/h)</label>
                    <input type="number" min="0" step="5" value={projDraft.hourly_rate} onChange={e=>setProjDraft(d=>({...d,hourly_rate:e.target.value}))} placeholder="75"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                  <div>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Budget (h)</label>
                    <input type="number" min="0" step="1" value={projDraft.budget_hours} onChange={e=>setProjDraft(d=>({...d,budget_hours:e.target.value}))} placeholder="40"
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_COLORS.map(c=>(
                      <button key={c} onClick={()=>setProjDraft(d=>({...d,color:c}))}
                        className="h-7 w-7 rounded-lg transition hover:scale-110" style={{background:c,outline:projDraft.color===c?"2px solid white":"none",outlineOffset:"2px"}}/>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setProjOpen(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50">Annuler</button>
                  <button onClick={handleSaveProject} disabled={projSaving||!projDraft.name.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white disabled:opacity-40"
                    style={{background:`linear-gradient(135deg, ${violet}, #7c3aed)`}}>
                    {projSaving&&<Loader2 size={13} className="animate-spin"/>}
                    Créer le projet
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {goalOpen&&(
          <>
            <motion.div key="gb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" onClick={()=>setGoalOpen(false)}/>
            <motion.div key="gd" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:10}}
              transition={{duration:0.3,ease}} className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl border border-white/8 bg-[#0e1420] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5"><Settings size={15} style={{color:violet}}/><h2 className="text-sm font-extrabold text-white">Objectifs quotidiens</h2></div>
                <button onClick={()=>setGoalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 hover:text-white/70"><X size={15}/></button>
              </div>
              <div className="space-y-4">
                {[
                  {label:"Objectif quotidien (min)",key:"daily_minutes",placeholder:"480"},
                  {label:"Objectif hebdomadaire (min)",key:"weekly_minutes",placeholder:"2400"},
                  {label:"Heures facturables/jour (min)",key:"daily_billable_minutes",placeholder:"360"},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{f.label}</label>
                    <input type="number" min="0" value={goalDraft[f.key as keyof GoalDraft]} onChange={e=>setGoalDraft(d=>({...d,[f.key]:e.target.value}))} placeholder={f.placeholder}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(167,139,250,0.4)]"/>
                    <p className="mt-0.5 text-[0.6rem] text-white/25">= {fmtMin(parseInt(goalDraft[f.key as keyof GoalDraft],10)||0)}</p>
                  </div>
                ))}
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setGoalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50">Annuler</button>
                  <button onClick={handleSaveGoal} disabled={goalSaving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white"
                    style={{background:`linear-gradient(135deg, ${violet}, #7c3aed)`}}>
                    {goalSaving&&<Loader2 size={13} className="animate-spin"/>}Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {confirmDel&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div initial={{scale:0.93,y:16,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,y:8,opacity:0}} transition={{duration:0.3,ease}}
              className="w-full max-w-sm rounded-3xl border border-white/8 bg-[#0e1420] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10"><Trash2 size={18} className="text-red-400"/></div>
              <h3 className="text-base font-extrabold text-white">Supprimer cette entrée ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={()=>setConfirmDel(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60">Annuler</button>
                <button onClick={()=>handleDelete(confirmDel)} disabled={deleting===confirmDel}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50">
                  {deleting===confirmDel&&<Loader2 size={13} className="animate-spin"/>}Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
