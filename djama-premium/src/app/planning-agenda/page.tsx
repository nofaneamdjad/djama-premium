"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Plus, Trash2, Edit3, Save, X,
  ChevronLeft, ChevronRight, Sun, Sunset, Moon,
  CheckCircle2, AlertCircle, Loader2, AlignLeft,
  StickyNote, LayoutGrid, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type View     = "today" | "week" | "month";
type Category = "travail" | "réunion" | "personnel" | "autre";

interface AgendaEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  start_time: string | null;
  end_time:   string | null;
  category:   Category;
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

const DAYS_FR   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getCat(v: Category) { return CATS.find(c => c.value === v) ?? CATS[3]; }

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}
function fmtTime(t: string | null) { return t ? t.slice(0, 5) : ""; }

/* Lundi de la semaine contenant une date ISO */
function getMondayOf(iso: string): Date {
  const d = new Date(iso + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0=Lun
  d.setDate(d.getDate() - dow);
  return d;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function dateToISO(d: Date): string {
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}
function fmtFR(iso: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", opts).format(new Date(y, m - 1, day));
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */
function CatBadge({ cat }: { cat: Category }) {
  const c = getCat(cat);
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function Toast({ toast, onClose }: { toast: { type: "success"|"error"; msg: string }; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity:0, y:24, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:8 }} transition={{ duration:0.3, ease }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
        toast.type==="success" ? "border-green-500/20 bg-[rgba(15,23,42,0.96)] text-green-300"
                               : "border-red-500/20 bg-[rgba(15,23,42,0.96)] text-red-300"}`}>
      {toast.type==="success" ? <CheckCircle2 size={15} className="shrink-0 text-green-400"/> : <AlertCircle size={15} className="shrink-0 text-red-400"/>}
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 text-white/30 hover:text-white/70 transition"><X size={12}/></button>
    </motion.div>
  );
}

/* ── Champ formulaire ── */
function FInput({ value, onChange, placeholder, type="text" }:
  { value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div animate={{ opacity: focused ? 1 : 0 }} transition={{ duration:0.15 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow:"0 0 0 2px rgba(201,165,90,0.4)" }}/>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20"/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL ÉVÉNEMENT
═══════════════════════════════════════════════════════════ */
interface EventForm { title:string; description:string; date:string; start_time:string; end_time:string; category:Category }
const EMPTY_FORM = (date:string): EventForm => ({ title:"", description:"", date, start_time:"", end_time:"", category:"travail" });

function EventModal({ initial, onSave, onClose, saving }:
  { initial:EventForm; onSave:(f:EventForm)=>void; onClose:()=>void; saving:boolean }) {
  const [form, setForm] = useState<EventForm>(initial);
  const upd = (k: keyof EventForm, v: string) => setForm(f=>({...f,[k]:v}));

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div initial={{ scale:0.93, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
        exit={{ scale:0.95, y:10, opacity:0 }} transition={{ duration:0.3, ease }}
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f1117] shadow-[0_32px_80px_rgba(0,0,0,0.7)]">

        <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <Calendar size={14} style={{ color:"#c9a55a" }}/>
            </div>
            <h3 className="text-sm font-extrabold text-white">
              {initial.title ? "Modifier l'événement" : "Nouvel événement"}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/30 transition hover:text-white/70"><X size={16}/></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Titre *</label>
            <FInput value={form.title} onChange={v=>upd("title",v)} placeholder="Ex: Réunion client, RDV médecin…"/>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Date *</label>
            <FInput type="date" value={form.date} onChange={v=>upd("date",v)}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Début</label>
              <FInput type="time" value={form.start_time} onChange={v=>upd("start_time",v)}/>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Fin</label>
              <FInput type="time" value={form.end_time} onChange={v=>upd("end_time",v)}/>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATS.map(c=>(
                <button key={c.value} type="button" onClick={()=>upd("category",c.value)}
                  className="rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition"
                  style={form.category===c.value
                    ? { color:c.color, background:c.bg, border:`1px solid ${c.border}` }
                    : { color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-white/35">Description</label>
            <textarea value={form.description} onChange={e=>upd("description",e.target.value)}
              placeholder="Détails, adresse, notes…" rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"/>
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/6 px-6 py-4">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80">
            Annuler
          </button>
          <button onClick={()=>form.title.trim()&&onSave(form)} disabled={saving||!form.title.trim()||!form.date}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] py-2.5 text-sm font-extrabold text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,165,90,0.3)] transition hover:shadow-[0_4px_20px_rgba(201,165,90,0.4)] disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
            Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARTE ÉVÉNEMENT
═══════════════════════════════════════════════════════════ */
function EventCard({ ev, onEdit, onDelete, deleting }:
  { ev:AgendaEvent; onEdit:(e:AgendaEvent)=>void; onDelete:(id:string)=>void; deleting:boolean }) {
  const c = getCat(ev.category);
  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-16 }}
      transition={{ duration:0.22, ease }}
      className="group relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-4 transition hover:border-white/15">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-[1.25rem]" style={{ background:c.color }}/>
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-white truncate">{ev.title}</p>
            <CatBadge cat={ev.category}/>
          </div>
          {(ev.start_time||ev.end_time) && (
            <p className="flex items-center gap-1 text-xs text-white/40 mb-1">
              <Clock size={10}/>
              {fmtTime(ev.start_time)}{ev.end_time ? ` → ${fmtTime(ev.end_time)}` : ""}
            </p>
          )}
          {ev.description && (
            <p className="flex items-start gap-1 text-xs text-white/30 line-clamp-1">
              <AlignLeft size={10} className="mt-0.5 shrink-0"/>{ev.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={()=>onEdit(ev)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-white/25 hover:text-white/80">
            <Edit3 size={11}/>
          </button>
          <button onClick={()=>onDelete(ev.id)} disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40">
            {deleting ? <Loader2 size={11} className="animate-spin"/> : <Trash2 size={11}/>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function PlanningAgendaPage() {

  /* ── State général ─────────────────────────────────── */
  const [view,       setView]       = useState<View>("today");
  const [events,     setEvents]     = useState<AgendaEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string|null>(null);
  const [toast,      setToast]      = useState<{type:"success"|"error";msg:string}|null>(null);
  const [modal,      setModal]      = useState<false|"new"|AgendaEvent>(false);
  const [modalDate,  setModalDate]  = useState(todayISO());

  /* ── Horloge en direct ─────────────────────────────── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Calendrier mois ───────────────────────────────── */
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDate,  setSelDate]  = useState(todayISO());

  /* ── Semaine : offset de semaines depuis aujourd'hui ─ */
  const [weekOffset, setWeekOffset] = useState(0);

  /* ── Note rapide ───────────────────────────────────── */
  const [quickNote,   setQuickNote]   = useState("");
  const [savingNote,  setSavingNote]  = useState(false);

  /* ── Charger les événements (plage large) ──────────── */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    // Fetch 3 mois autour du mois courant pour couvrir semaine + mois + today
    const from = `${calYear}-${String(calMonth-1<0?12:calMonth).padStart(2,"0")}-01`;
    const to   = new Date(calYear, calMonth + 2, 0);
    const toISO = dateToISO(to);
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .gte("date", `${calYear}-01-01`)
      .lte("date", `${calYear}-12-31`)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false });

    if (error) showToast("error","Impossible de charger les événements.");
    else setEvents((data as AgendaEvent[]) ?? []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function showToast(type:"success"|"error", msg:string) { setToast({type,msg}); }

  /* ── CRUD ──────────────────────────────────────────── */
  async function handleSave(form: EventForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("error","Non connecté."); return; }
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
      const { data, error } = await supabase.from("agenda_events").update(payload).eq("id",modal.id).select().single();
      if (error) showToast("error",error.message);
      else { setEvents(p=>p.map(e=>e.id===modal.id?(data as AgendaEvent):e)); showToast("success","Événement modifié."); setModal(false); }
    } else {
      const { data, error } = await supabase.from("agenda_events").insert({...payload,user_id:user.id}).select().single();
      if (error) showToast("error",error.message);
      else { setEvents(p=>[...p,data as AgendaEvent].sort((a,b)=>a.date.localeCompare(b.date)||(a.start_time??"").localeCompare(b.start_time??""))); showToast("success","Événement ajouté."); setModal(false); }
    }
    setSaving(false);
  }

  async function handleDelete(id:string) {
    setDeleting(id);
    const { error } = await supabase.from("agenda_events").delete().eq("id",id);
    if (error) showToast("error",error.message);
    else { setEvents(p=>p.filter(e=>e.id!==id)); showToast("success","Événement supprimé."); }
    setDeleting(null);
  }

  async function handleSaveNote() {
    if (!quickNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingNote(true);
    const today = todayISO();
    await supabase.from("notes").insert({
      user_id:  user.id,
      title:    `Note rapide — ${fmtFR(today, {day:"2-digit",month:"long",year:"numeric"})}`,
      content:  quickNote.trim(),
      category: "idées",
    });
    setSavingNote(false);
    setQuickNote("");
    showToast("success","Note sauvegardée dans le Bloc-notes.");
  }

  function openModal(date: string) {
    setModalDate(date);
    setModal("new");
  }

  /* ── Dérivations ────────────────────────────────────── */
  const todayStr = todayISO();

  // Événements indexés par date
  const byDate = useMemo(() => {
    const m: Record<string,AgendaEvent[]> = {};
    for (const ev of events) { if (!m[ev.date]) m[ev.date]=[]; m[ev.date].push(ev); }
    return m;
  }, [events]);

  // Aujourd'hui groupé par période
  const todayEvents = useMemo(() => byDate[todayStr] ?? [], [byDate, todayStr]);
  const matin    = todayEvents.filter(e => e.start_time && e.start_time < "12:00");
  const aprem    = todayEvents.filter(e => e.start_time && e.start_time >= "12:00" && e.start_time < "18:00");
  const soir     = todayEvents.filter(e => e.start_time && e.start_time >= "18:00");
  const noTime   = todayEvents.filter(e => !e.start_time);

  // Semaine courante
  const weekMonday = useMemo(() => {
    const base = getMondayOf(todayStr);
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [todayStr, weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({length:7}, (_,i) => {
      const d = addDays(weekMonday, i);
      return { iso: dateToISO(d), date: d, dow: i };
    }),
  [weekMonday]);

  // Calendrier mois
  const calDays = useMemo(() => {
    const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
    const inMonth  = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number|null)[] = [];
    for (let i=0;i<firstDow;i++) cells.push(null);
    for (let d=1;d<=inMonth;d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  /* ── Heure formatée ─────────────────────────────────── */
  const timeStr = now.toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dateStr = now.toLocaleDateString("fr-FR", {weekday:"long",day:"numeric",month:"long",year:"numeric"});

  /* ── Vue Aujourd'hui ────────────────────────────────── */
  function PeriodSection({ label, icon: Icon, evs, emptyMsg }:
    { label:string; icon:React.ElementType; evs:AgendaEvent[]; emptyMsg:string }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={13} className="text-white/30"/>
          <span className="text-xs font-bold uppercase tracking-widest text-white/30">{label}</span>
          {evs.length>0 && <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[0.6rem] font-bold text-white/40">{evs.length}</span>}
        </div>
        {evs.length===0 ? (
          <p className="text-xs text-white/18 italic pl-5 pb-2">{emptyMsg}</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {evs.map(ev=>(
                <EventCard key={ev.id} ev={ev} onEdit={e=>setModal(e)} onDelete={handleDelete} deleting={deleting===ev.id}/>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[20%] top-[5%] h-[600px] w-[600px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[150px]"/>
        <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.04)] blur-[120px]"/>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="relative z-10 border-b border-white/6 bg-[rgba(8,10,15,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">

          <div className="flex items-center gap-3">
            <a href="/client" className="flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60 sm:hidden">
              <ArrowLeft size={13}/>
            </a>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <Calendar size={16} style={{ color:"#c9a55a" }}/>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-white">Planning & Agenda</p>
              <p className="text-[0.6rem] text-white/25">{events.length} événement{events.length!==1?"s":""} cette année</p>
            </div>
          </div>

          {/* Horloge */}
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-center">
              <p className="text-lg font-mono font-black tabular-nums text-white leading-none">{timeStr}</p>
              <p className="text-[0.6rem] capitalize text-white/30 leading-tight">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/client" className="hidden items-center gap-1.5 rounded-xl border border-white/8 px-3 py-2 text-xs font-semibold text-white/40 transition hover:border-white/20 hover:text-white/70 sm:flex">
              <ArrowLeft size={12}/> Espace client
            </a>
            <button onClick={()=>openModal(todayStr)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]">
              <Plus size={14}/> Ajouter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex gap-0 border-t border-white/6 px-5 sm:px-8">
          {(["today","week","month"] as View[]).map(v=>(
            <button key={v} onClick={()=>setView(v)}
              className={`relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
                view===v ? "text-[#c9a55a]" : "text-white/30 hover:text-white/60"}`}>
              {v==="today"?"Aujourd'hui":v==="week"?"Semaine":"Mois"}
              {view===v && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#c9a55a]"/>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Corps ──────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-8">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-white/20"/>
          </div>
        ) : (

          <>
            {/* ════════════ VUE AUJOURD'HUI ════════════ */}
            {view==="today" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

                {/* Colonne principale : événements */}
                <div className="space-y-6">
                  {/* Date mobile */}
                  <div className="flex items-center justify-between sm:hidden">
                    <div>
                      <p className="text-lg font-black capitalize text-white">{now.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
                      <p className="font-mono text-sm text-white/40">{timeStr}</p>
                    </div>
                    <button onClick={()=>openModal(todayStr)}
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.3)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]">
                      <Plus size={12}/> Ajouter
                    </button>
                  </div>

                  {/* Aucun événement */}
                  {todayEvents.length===0 && (
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                      className="flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-white/6 bg-[rgba(15,17,23,0.4)] py-14 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
                        <Sun size={22} className="text-white/20"/>
                      </div>
                      <p className="text-sm font-semibold text-white/30">Journée libre</p>
                      <p className="text-xs text-white/20">Aucun événement planifié aujourd&apos;hui</p>
                      <button onClick={()=>openModal(todayStr)}
                        className="mt-1 flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-4 py-2 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]">
                        <Plus size={12}/> Planifier un événement
                      </button>
                    </motion.div>
                  )}

                  {/* Sections temporelles */}
                  {todayEvents.length>0 && (
                    <div className="space-y-6">
                      <PeriodSection label="Matin"       icon={Sun}    evs={matin}  emptyMsg="Rien le matin"/>
                      <PeriodSection label="Après-midi"  icon={Sunset} evs={aprem}  emptyMsg="Rien l'après-midi"/>
                      <PeriodSection label="Soir"        icon={Moon}   evs={soir}   emptyMsg="Rien le soir"/>
                      {noTime.length>0 && <PeriodSection label="Non planifié" icon={LayoutGrid} evs={noTime} emptyMsg=""/>}
                    </div>
                  )}
                </div>

                {/* Colonne droite : note rapide + résumé */}
                <div className="space-y-4">

                  {/* Note rapide */}
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <StickyNote size={13} style={{ color:"#c9a55a" }}/>
                      <span className="text-xs font-bold uppercase tracking-widest text-white/40">Note rapide</span>
                    </div>
                    <textarea value={quickNote} onChange={e=>setQuickNote(e.target.value)}
                      placeholder="Capture une idée, une info, un mémo…" rows={5}
                      className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/20 outline-none leading-relaxed"/>
                    <button onClick={handleSaveNote} disabled={savingNote||!quickNote.trim()}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(201,165,90,0.25)] py-2 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)] disabled:opacity-40">
                      {savingNote ? <Loader2 size={11} className="animate-spin"/> : <Save size={11}/>}
                      Sauvegarder dans Bloc-notes
                    </button>
                  </div>

                  {/* Résumé semaine */}
                  <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Ce mois</p>
                    <div className="space-y-2.5">
                      {(["travail","réunion","personnel","autre"] as Category[]).map(cat=>{
                        const c  = getCat(cat);
                        const n  = events.filter(e=>e.category===cat && e.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).length;
                        return (
                          <div key={cat} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background:c.color }}/>
                              <span className="text-xs text-white/40">{c.label}</span>
                            </div>
                            <span className="text-xs font-bold text-white/60">{n}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-white/6 pt-2 flex items-center justify-between">
                        <span className="text-xs text-white/40">Total</span>
                        <span className="text-xs font-extrabold text-[#c9a55a]">{events.filter(e=>e.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prochains événements */}
                  {(() => {
                    const upcoming = events.filter(e=>e.date>todayStr).slice(0,4);
                    if (!upcoming.length) return null;
                    return (
                      <div className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">À venir</p>
                        <div className="space-y-2">
                          {upcoming.map(ev=>{
                            const [,mm,dd] = ev.date.split("-").map(Number);
                            return (
                              <button key={ev.id} onClick={()=>{setView("today");}}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/4">
                                <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white/5">
                                  <span className="text-[0.5rem] font-bold uppercase text-white/30">{MONTHS_FR[mm-1].slice(0,3)}</span>
                                  <span className="text-sm font-extrabold leading-none text-white">{dd}</span>
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white/70 truncate">{ev.title}</p>
                                  {ev.start_time&&<p className="text-[0.6rem] text-white/30">{fmtTime(ev.start_time)}</p>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ════════════ VUE SEMAINE ════════════ */}
            {view==="week" && (
              <div>
                {/* Navigation semaine */}
                <div className="mb-5 flex items-center justify-between">
                  <button onClick={()=>setWeekOffset(w=>w-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80">
                    <ChevronLeft size={16}/>
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-extrabold text-white">
                      {fmtFR(weekDays[0].iso,{day:"numeric",month:"long"})} — {fmtFR(weekDays[6].iso,{day:"numeric",month:"long",year:"numeric"})}
                    </p>
                    {weekOffset===0 && <p className="text-[0.6rem] text-[#c9a55a] font-semibold uppercase tracking-widest">Semaine actuelle</p>}
                  </div>
                  <button onClick={()=>setWeekOffset(w=>w+1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80">
                    <ChevronRight size={16}/>
                  </button>
                </div>

                {/* Grille 7 jours */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {weekDays.map(({iso,dow})=>{
                    const isToday = iso===todayStr;
                    const dayEvs  = byDate[iso] ?? [];
                    const [,mm,dd] = iso.split("-").map(Number);
                    return (
                      <div key={iso}
                        className={`flex min-h-[160px] flex-col rounded-[1.25rem] border p-3 transition ${
                          isToday ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.05)]" : "border-white/8 bg-[rgba(15,17,23,0.55)]"}`}>
                        {/* Entête jour */}
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className={`text-[0.65rem] font-bold uppercase tracking-wider ${isToday?"text-[#c9a55a]":"text-white/30"}`}>{DAYS_FR[dow]}</p>
                            <p className={`text-xl font-black leading-none ${isToday?"text-[#c9a55a]":"text-white/70"}`}>{dd}</p>
                            <p className="text-[0.55rem] text-white/25">{MONTHS_FR[mm-1].slice(0,3)}</p>
                          </div>
                          <button onClick={()=>openModal(iso)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-white/30 transition hover:border-white/25 hover:text-white/70">
                            <Plus size={11}/>
                          </button>
                        </div>
                        {/* Événements du jour */}
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          {dayEvs.length===0
                            ? <p className="text-[0.6rem] italic text-white/15">Aucun</p>
                            : dayEvs.slice(0,3).map(ev=>{
                                const c=getCat(ev.category);
                                return (
                                  <button key={ev.id} onClick={()=>setModal(ev)}
                                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-white/5"
                                    style={{ borderLeft:`2px solid ${c.color}` }}>
                                    <span className="flex-1 min-w-0 text-[0.65rem] font-semibold text-white/70 truncate">{ev.title}</span>
                                  </button>
                                );
                              })
                          }
                          {dayEvs.length>3 && <p className="text-[0.6rem] text-white/25 pl-1">+{dayEvs.length-3} autre{dayEvs.length-3>1?"s":""}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ VUE MOIS ════════════ */}
            {view==="month" && (
              <div className="mx-auto max-w-4xl">
                {/* Navigation mois */}
                <div className="mb-5 flex items-center justify-between">
                  <button onClick={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80">
                    <ChevronLeft size={16}/>
                  </button>
                  <p className="text-base font-extrabold text-white">{MONTHS_FR[calMonth]} {calYear}</p>
                  <button onClick={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 text-white/40 transition hover:border-white/20 hover:text-white/80">
                    <ChevronRight size={16}/>
                  </button>
                </div>

                {/* Entêtes jours */}
                <div className="mb-2 grid grid-cols-7">
                  {DAYS_FR.map(d=>(
                    <div key={d} className="text-center text-[0.6rem] font-bold uppercase tracking-wider text-white/25 py-1">{d}</div>
                  ))}
                </div>

                {/* Grille */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day,idx)=>{
                    if (!day) return <div key={`e-${idx}`}/>;
                    const iso       = toISO(calYear,calMonth,day);
                    const isToday   = iso===todayStr;
                    const isSel     = iso===selDate;
                    const dayEvs    = byDate[iso] ?? [];
                    return (
                      <button key={iso} onClick={()=>setSelDate(iso)}
                        className={`relative flex flex-col items-center rounded-xl py-2 px-1 transition group ${
                          isSel ? "bg-gradient-to-b from-[#c9a55a] to-[#b08d45] shadow-[0_4px_12px_rgba(201,165,90,0.4)]"
                               : isToday ? "border border-[rgba(201,165,90,0.4)]"
                               : "hover:bg-white/5"}`}>
                        <span className={`text-sm font-bold ${isSel?"text-[#0a0a0a]":isToday?"text-[#c9a55a]":"text-white/60"}`}>{day}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvs.slice(0,3).map(ev=>(
                            <span key={ev.id} className="h-1 w-1 rounded-full" style={{ background: isSel?"rgba(0,0,0,0.5)":getCat(ev.category).color }}/>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Événements du jour sélectionné */}
                <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-extrabold capitalize text-white">
                      {fmtFR(selDate,{weekday:"long",day:"numeric",month:"long"})}
                    </p>
                    <button onClick={()=>openModal(selDate)}
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.09)]">
                      <Plus size={11}/> Ajouter
                    </button>
                  </div>
                  {(byDate[selDate]??[]).length===0 ? (
                    <p className="text-sm text-white/25 italic">Aucun événement ce jour.</p>
                  ) : (
                    <div className="space-y-2">
                      {(byDate[selDate]??[]).map(ev=>(
                        <EventCard key={ev.id} ev={ev} onEdit={e=>setModal(e)} onDelete={handleDelete} deleting={deleting===ev.id}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {modal!==false && (
          <EventModal
            initial={typeof modal==="object"
              ? { title:modal.title, description:modal.description, date:modal.date, start_time:modal.start_time??"", end_time:modal.end_time??"", category:modal.category }
              : EMPTY_FORM(modalDate)}
            onSave={handleSave} onClose={()=>setModal(false)} saving={saving}/>
        )}
      </AnimatePresence>

      {/* ── Toast ──────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
