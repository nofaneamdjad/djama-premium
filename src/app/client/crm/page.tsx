"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Trash2, Pencil, X, Loader2, Mail, Phone,
  Building2, Download, UserCheck, ChevronRight, ChevronDown,
  Calendar, Clock, FileText, MessageSquare, Video, PhoneCall,
  Star, Tag, Globe, Linkedin, MapPin, Briefcase, TrendingUp,
  CheckSquare, Square, AlertCircle, Ticket, BarChart2, Filter,
  ArrowUpRight, DollarSign, Target, Activity, Check, SlidersHorizontal,
  Zap, Award, Flag, MoreVertical, Send, Link2, ChevronLeft,
  RefreshCw, PieChart, Layers, Bell, Hash,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */
type ContactType    = "prospect" | "client" | "partenaire" | "fournisseur";
type ContactStatus  = "prospect" | "actif" | "inactif" | "perdu";
type Priority       = "low" | "normal" | "high" | "urgent";
type OppStage       = "nouveau" | "qualifié" | "proposition" | "négociation" | "gagné" | "perdu";
type ActivityType   = "note" | "call" | "email" | "meeting" | "document" | "rdv";
type TaskType       = "action" | "relance" | "rdv" | "deadline" | "appel";
type TicketStatus   = "ouvert" | "en_cours" | "résolu" | "fermé";
type TicketPriority = "basse" | "normale" | "haute" | "urgente";

interface Contact {
  id: string; user_id: string;
  name: string; email: string; phone: string; company: string;
  status: ContactStatus; notes: string;
  /* New fields */
  address?: string; city?: string; country?: string;
  sector?: string; company_size?: string; source?: string;
  priority?: Priority; type?: ContactType;
  website?: string; linkedin?: string;
  budget?: number; interest_level?: number;
  tags?: string[];
  created_at: string; updated_at: string;
}

interface Activity {
  id: string; user_id: string; contact_id: string;
  type: ActivityType; title: string; description: string;
  activity_date: string; duration_min: number; created_at: string;
}

interface Opportunity {
  id: string; user_id: string; contact_id: string | null;
  title: string; amount: number; stage: OppStage;
  probability: number; close_date: string | null;
  product_service: string; notes: string;
  created_at: string; updated_at: string;
  contact?: Pick<Contact, "name" | "company">;
}

interface CrmTask {
  id: string; user_id: string; contact_id: string | null;
  opportunity_id: string | null;
  title: string; description: string; due_date: string | null;
  priority: Priority; done: boolean; type: TaskType;
  created_at: string;
  contact?: Pick<Contact, "name" | "company">;
}

interface SupportTicket {
  id: string; user_id: string; contact_id: string | null;
  title: string; description: string;
  status: TicketStatus; priority: TicketPriority;
  satisfaction: number; created_at: string; updated_at: string;
  contact?: Pick<Contact, "name" | "company">;
}

/* ════════════════════════════════════════════════════════════
   CONSTANTES
════════════════════════════════════════════════════════════ */
const CONTACT_TYPES: Record<ContactType, { label: string; color: string }> = {
  prospect:    { label: "Prospect",    color: "#60a5fa" },
  client:      { label: "Client",      color: "#34d399" },
  partenaire:  { label: "Partenaire",  color: "#a78bfa" },
  fournisseur: { label: "Fournisseur", color: "#fb923c" },
};

const STATUSES: Record<ContactStatus, { label: string; color: string; bg: string }> = {
  prospect: { label: "Prospect",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  actif:    { label: "Actif",     color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  inactif:  { label: "Inactif",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  perdu:    { label: "Perdu",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const STAGES: Record<OppStage, { label: string; color: string; prob: number }> = {
  nouveau:      { label: "Nouveau",      color: "#60a5fa", prob: 10 },
  qualifié:     { label: "Qualifié",     color: "#a78bfa", prob: 30 },
  proposition:  { label: "Proposition",  color: "#fb923c", prob: 50 },
  négociation:  { label: "Négociation",  color: "#f59e0b", prob: 70 },
  gagné:        { label: "Gagné",        color: "#34d399", prob: 100 },
  perdu:        { label: "Perdu",        color: "#f87171", prob: 0 },
};

const PRIORITIES: Record<Priority, { label: string; color: string }> = {
  low:    { label: "Basse",   color: "#94a3b8" },
  normal: { label: "Normale", color: "#60a5fa" },
  high:   { label: "Haute",   color: "#fb923c" },
  urgent: { label: "Urgente", color: "#f87171" },
};

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  note: FileText, call: PhoneCall, email: Mail,
  meeting: Video, document: FileText, rdv: Calendar,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  note: "#94a3b8", call: "#34d399", email: "#60a5fa",
  meeting: "#a78bfa", document: "#fb923c", rdv: "#f59e0b",
};

const SECTORS = [
  "Tech / Digital", "Commerce / Retail", "BTP / Immobilier",
  "Santé / Médical", "Finance / Assurance", "Transport / Logistique",
  "Éducation", "Restauration / Hôtellerie", "Marketing / Communication",
  "Industrie", "Agriculture", "Autre",
];

const SOURCES = [
  "Réseau / Bouche-à-oreille", "Site web", "Réseaux sociaux",
  "LinkedIn", "Publicité", "Salon / Événement",
  "Partenaire", "Appel entrant", "Autre",
];

const TICKET_STATUSES: Record<TicketStatus, { label: string; color: string }> = {
  ouvert:    { label: "Ouvert",    color: "#60a5fa" },
  en_cours:  { label: "En cours",  color: "#f59e0b" },
  résolu:    { label: "Résolu",    color: "#34d399" },
  fermé:     { label: "Fermé",     color: "#94a3b8" },
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const ease = [0.16, 1, 0.3, 1] as const;

/* ════════════════════════════════════════════════════════════
   MINI-COMPOSANTS PARTAGÉS
════════════════════════════════════════════════════════════ */
function Badge({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: bg ?? `${color}1a` }}>
      {label}
    </span>
  );
}

function Avatar({ name, color = "#60a5fa", size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="shrink-0 flex items-center justify-center rounded-full font-black"
      style={{ width: size, height: size, backgroundColor: `${color}22`, color, fontSize: size * 0.35 }}>
      {initials || "?"}
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[0.62rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <input {...props}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[0.8rem] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors" />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[0.62rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <textarea {...props} rows={3}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[0.8rem] text-white placeholder-white/20 outline-none focus:border-white/20 resize-none transition-colors" />
    </div>
  );
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[0.62rem] font-bold uppercase tracking-widest text-white/30">{label}</label>}
      <select {...props}
        className="w-full rounded-xl border border-white/[0.08] bg-[#0f1117] px-3 py-2 text-[0.8rem] text-white outline-none focus:border-white/20 transition-colors">
        {children}
      </select>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PIPELINE VIEW
════════════════════════════════════════════════════════════ */
function PipelineView({
  opportunities, contacts, onUpdate, onDelete, onAdd, loading,
}: {
  opportunities: Opportunity[];
  contacts: Contact[];
  onUpdate: (id: string, data: Partial<Opportunity>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (data: Partial<Opportunity>) => Promise<void>;
  loading: boolean;
}) {
  const [addModal, setAddModal]   = useState<OppStage | null>(null);
  const [editOpp, setEditOpp]     = useState<Opportunity | null>(null);
  const [form, setForm]           = useState<Partial<Opportunity>>({});

  const stageKeys = Object.keys(STAGES) as OppStage[];
  const byStage = useMemo(() => {
    const m: Record<OppStage, Opportunity[]> = {} as Record<OppStage, Opportunity[]>;
    stageKeys.forEach(s => { m[s] = []; });
    opportunities.forEach(o => { m[o.stage]?.push(o); });
    return m;
  }, [opportunities]);

  const totalByStage = (stage: OppStage) =>
    byStage[stage].reduce((s, o) => s + (o.amount ?? 0), 0);

  function openAdd(stage: OppStage) {
    setForm({ stage, probability: STAGES[stage].prob });
    setAddModal(stage);
  }
  function openEdit(o: Opportunity) {
    setForm({ ...o });
    setEditOpp(o);
  }

  async function save() {
    if (!form.title) return;
    if (editOpp) {
      await onUpdate(editOpp.id, form);
      setEditOpp(null);
    } else {
      await onAdd(form);
      setAddModal(null);
    }
    setForm({});
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Résumé pipeline */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stageKeys.filter(s => s !== "perdu").map(stage => {
          const total = totalByStage(stage);
          const count = byStage[stage].length;
          return (
            <div key={stage} className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-3 text-center">
              <div className="text-[0.58rem] font-bold uppercase tracking-widest mb-1"
                style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</div>
              <div className="text-base font-black text-white">{count}</div>
              {total > 0 && <div className="text-[0.6rem] text-white/40 mt-0.5">{fmtEur(total)}</div>}
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {stageKeys.map(stage => (
          <div key={stage} className="shrink-0 w-64 rounded-2xl border border-white/[0.06] bg-[#0a0b10] flex flex-col">
            {/* Header colonne */}
            <div className="flex items-center justify-between p-3 border-b border-white/[0.05]">
              <div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest"
                  style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</span>
                <span className="ml-1.5 text-[0.6rem] text-white/25">({byStage[stage].length})</span>
              </div>
              {stage !== "gagné" && stage !== "perdu" && (
                <button onClick={() => openAdd(stage)}
                  className="h-5 w-5 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                  <Plus size={10}/>
                </button>
              )}
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2 p-2 flex-1 min-h-[100px]">
              {byStage[stage].map(opp => (
                <motion.div key={opp.id} layout
                  className="rounded-xl border border-white/[0.06] bg-[#0f1117] p-3 cursor-pointer hover:border-white/10 transition-all group"
                  onClick={() => openEdit(opp)}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[0.72rem] font-semibold text-white leading-tight">{opp.title}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={e => { e.stopPropagation(); onDelete(opp.id); }}
                        className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={10}/>
                      </button>
                    </div>
                  </div>
                  {opp.contact && (
                    <p className="text-[0.62rem] text-white/40 mt-1">
                      {opp.contact.name}{opp.contact.company ? ` · ${opp.contact.company}` : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {opp.amount > 0 && (
                      <span className="text-[0.68rem] font-black" style={{ color: STAGES[stage].color }}>
                        {fmtEur(opp.amount)}
                      </span>
                    )}
                    {opp.close_date && (
                      <span className="text-[0.6rem] text-white/30 ml-auto">{fmtDate(opp.close_date)}</span>
                    )}
                  </div>
                  {opp.probability > 0 && opp.stage !== "gagné" && (
                    <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${opp.probability}%`, backgroundColor: STAGES[stage].color }}/>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal add/edit opportunité */}
      <AnimatePresence>
        {(addModal || editOpp) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setAddModal(null); setEditOpp(null); setForm({}); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f1117] p-6 space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white text-sm">{editOpp ? "Modifier l'opportunité" : "Nouvelle opportunité"}</h3>
                <button onClick={() => { setAddModal(null); setEditOpp(null); setForm({}); }}
                  className="text-white/30 hover:text-white transition-colors"><X size={16}/></button>
              </div>
              <Input label="Titre *" placeholder="Ex: Mission conseil Q2" value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Montant (€)" type="number" placeholder="0" value={form.amount ?? ""} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}/>
                <Input label="Probabilité (%)" type="number" min="0" max="100" value={form.probability ?? ""} onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Étape" value={form.stage ?? "nouveau"} onChange={e => setForm(f => ({ ...f, stage: e.target.value as OppStage }))}>
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Input label="Date de clôture" type="date" value={form.close_date ?? ""} onChange={e => setForm(f => ({ ...f, close_date: e.target.value || null }))}/>
              </div>
              <Select label="Contact" value={form.contact_id ?? ""} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value || null }))}>
                <option value="">— Aucun contact —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </Select>
              <Input label="Produit / Service" placeholder="Ex: Abonnement pro, Mission X" value={form.product_service ?? ""} onChange={e => setForm(f => ({ ...f, product_service: e.target.value }))}/>
              <Textarea label="Notes" placeholder="Contexte, conditions…" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAddModal(null); setEditOpp(null); setForm({}); }}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-white/50 hover:text-white transition-colors">Annuler</button>
                <button onClick={save} disabled={!form.title}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-[#0a0b10] transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: addModal ? STAGES[addModal].color : STAGES[editOpp?.stage ?? "nouveau"].color }}>
                  {editOpp ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TÂCHES VIEW
════════════════════════════════════════════════════════════ */
function TachesView({
  tasks, contacts, onToggle, onDelete, onAdd, onUpdate,
}: {
  tasks: CrmTask[];
  contacts: Contact[];
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (data: Partial<CrmTask>) => Promise<void>;
  onUpdate: (id: string, data: Partial<CrmTask>) => Promise<void>;
}) {
  const [filter, setFilter]   = useState<"all" | "today" | "late" | "done">("all");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm]       = useState<Partial<CrmTask>>({ priority: "normal", type: "action" });
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => tasks.filter(t => {
    if (filter === "done")  return t.done;
    if (filter === "today") return !t.done && t.due_date === today;
    if (filter === "late")  return !t.done && t.due_date && t.due_date < today;
    return !t.done;
  }), [tasks, filter, today]);

  const counts = useMemo(() => ({
    all:   tasks.filter(t => !t.done).length,
    today: tasks.filter(t => !t.done && t.due_date === today).length,
    late:  tasks.filter(t => !t.done && t.due_date && t.due_date < today).length,
    done:  tasks.filter(t => t.done).length,
  }), [tasks, today]);

  async function saveTask() {
    if (!form.title) return;
    await onAdd(form);
    setAddModal(false);
    setForm({ priority: "normal", type: "action" });
  }

  const TASK_ICONS: Record<TaskType, React.ElementType> = {
    action: Zap, relance: RefreshCw, rdv: Calendar, deadline: Flag, appel: PhoneCall,
  };

  return (
    <div className="space-y-4">
      {/* Filtres + bouton */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {(["all","today","late","done"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === f ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              {f === "all" ? "En cours" : f === "today" ? "Aujourd'hui" : f === "late" ? "En retard" : "Terminées"}
              {counts[f] > 0 && <span className={`ml-1.5 rounded-full px-1.5 text-[0.6rem] ${
                f === "late" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/50"}`}>{counts[f]}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
          <Plus size={11}/> Nouvelle tâche
        </button>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-sm">
          {filter === "done" ? "Aucune tâche terminée" : "Aucune tâche en cours 🎉"}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map(task => {
              const isLate = !task.done && task.due_date && task.due_date < today;
              const TaskIcon = TASK_ICONS[task.type ?? "action"];
              const pColor = PRIORITIES[task.priority ?? "normal"].color;
              return (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0f1117] p-3.5 group">
                  <button onClick={() => onToggle(task.id, !task.done)} className="mt-0.5 shrink-0 transition-colors"
                    style={{ color: task.done ? "#34d399" : "rgba(255,255,255,0.2)" }}>
                    {task.done ? <CheckSquare size={16}/> : <Square size={16}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[0.78rem] font-semibold ${task.done ? "line-through text-white/30" : "text-white"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider"
                        style={{ color: pColor }}>
                        <TaskIcon size={9}/>{task.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.contact && (
                        <span className="text-[0.65rem] text-white/35">
                          {task.contact.name}{task.contact.company ? ` · ${task.contact.company}` : ""}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`text-[0.65rem] flex items-center gap-0.5 ${isLate ? "text-red-400" : "text-white/30"}`}>
                          <Calendar size={9}/>{fmtDate(task.due_date)}
                          {isLate && " · En retard"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0 mt-0.5">
                    <Trash2 size={12}/>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal add task */}
      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setAddModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f1117] p-6 space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white text-sm">Nouvelle tâche</h3>
                <button onClick={() => setAddModal(false)} className="text-white/30 hover:text-white"><X size={16}/></button>
              </div>
              <Input label="Titre *" placeholder="Intitulé de la tâche" value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Type" value={form.type ?? "action"} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))}>
                  {(["action","relance","rdv","deadline","appel"] as TaskType[]).map(t =>
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </Select>
                <Select label="Priorité" value={form.priority ?? "normal"} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </div>
              <Input label="Échéance" type="date" value={form.due_date ?? ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))}/>
              <Select label="Contact lié" value={form.contact_id ?? ""} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value || null }))}>
                <option value="">— Aucun —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </Select>
              <Textarea label="Description" placeholder="Détails…" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
              <div className="flex gap-2">
                <button onClick={() => setAddModal(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-white/50 hover:text-white">Annuler</button>
                <button onClick={saveTask} disabled={!form.title}
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-40">
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RAPPORT VIEW
════════════════════════════════════════════════════════════ */
function RapportView({
  contacts, opportunities, tasks, tickets,
}: {
  contacts: Contact[];
  opportunities: Opportunity[];
  tasks: CrmTask[];
  tickets: SupportTicket[];
}) {
  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const actifs     = contacts.filter(c => c.status === "actif").length;
    const prospects  = contacts.filter(c => c.status === "prospect").length;
    const totalOpp   = opportunities.filter(o => o.stage !== "perdu").reduce((s, o) => s + (o.amount ?? 0), 0);
    const wons       = opportunities.filter(o => o.stage === "gagné");
    const caMtot     = wons.reduce((s, o) => s + (o.amount ?? 0), 0);
    const convRate   = opportunities.length > 0 ? Math.round(wons.length / opportunities.length * 100) : 0;
    const overdueTasks = tasks.filter(t => !t.done && t.due_date && t.due_date < today).length;
    const openTickets  = tickets.filter(t => t.status === "ouvert" || t.status === "en_cours").length;

    const byStage: Record<OppStage, { count: number; amount: number }> = {} as Record<OppStage, { count: number; amount: number }>;
    (Object.keys(STAGES) as OppStage[]).forEach(s => { byStage[s] = { count: 0, amount: 0 }; });
    opportunities.forEach(o => {
      if (byStage[o.stage]) {
        byStage[o.stage].count++;
        byStage[o.stage].amount += o.amount ?? 0;
      }
    });

    const byType: Record<string, number> = {};
    contacts.forEach(c => { byType[c.type ?? "prospect"] = (byType[c.type ?? "prospect"] ?? 0) + 1; });

    const bySector: Record<string, number> = {};
    contacts.forEach(c => { if (c.sector) bySector[c.sector] = (bySector[c.sector] ?? 0) + 1; });
    const topSectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { actifs, prospects, totalOpp, caMtot, convRate, overdueTasks, openTickets, byStage, byType, topSectors, totalContacts: contacts.length };
  }, [contacts, opportunities, tasks, tickets]);

  const kpis = [
    { label: "Contacts total",     value: stats.totalContacts, icon: Users,       color: "#60a5fa" },
    { label: "Clients actifs",     value: stats.actifs,        icon: UserCheck,   color: "#34d399" },
    { label: "Prospects",          value: stats.prospects,     icon: Target,      color: "#a78bfa" },
    { label: "Pipeline total",     value: fmtEur(stats.totalOpp), icon: TrendingUp, color: "#f59e0b", big: true },
    { label: "CA gagné",           value: fmtEur(stats.caMtot),   icon: Award,      color: "#34d399", big: true },
    { label: "Taux conversion",    value: `${stats.convRate}%`, icon: PieChart,    color: "#fb923c" },
    { label: "Tâches en retard",   value: stats.overdueTasks,  icon: AlertCircle, color: stats.overdueTasks > 0 ? "#f87171" : "#94a3b8" },
    { label: "Tickets ouverts",    value: stats.openTickets,   icon: Ticket,      color: stats.openTickets > 0 ? "#fb923c" : "#94a3b8" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{k.label}</p>
              <k.icon size={13} style={{ color: k.color }}/>
            </div>
            <p className={`font-black text-white ${k.big ? "text-base" : "text-xl"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Pipeline par étape */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 mb-4">Pipeline commercial</h3>
          <div className="space-y-2.5">
            {(Object.keys(STAGES) as OppStage[]).map(stage => {
              const { count, amount } = stats.byStage[stage];
              const maxCount = Math.max(...Object.values(stats.byStage).map(v => v.count), 1);
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-[0.62rem] w-20 shrink-0" style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: STAGES[stage].color }}/>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[0.6rem] text-white/40">{count} opp.</span>
                    {amount > 0 && <span className="text-[0.6rem] text-white/25 ml-1">· {fmtEur(amount)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Répartition par type */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-5">
          <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 mb-4">Répartition contacts</h3>
          <div className="space-y-3">
            {(Object.keys(CONTACT_TYPES) as ContactType[]).map(type => {
              const count = stats.byType[type] ?? 0;
              const pct = contacts.length > 0 ? Math.round(count / contacts.length * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-[0.62rem] w-20 shrink-0" style={{ color: CONTACT_TYPES[type].color }}>{CONTACT_TYPES[type].label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CONTACT_TYPES[type].color }}/>
                  </div>
                  <span className="text-[0.62rem] text-white/40 shrink-0 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          {stats.topSectors.length > 0 && (
            <>
              <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 mb-3 mt-5">Top secteurs</h3>
              <div className="space-y-1.5">
                {stats.topSectors.map(([sector, count]) => (
                  <div key={sector} className="flex items-center justify-between">
                    <span className="text-[0.7rem] text-white/50 truncate">{sector}</span>
                    <span className="text-[0.65rem] font-bold text-white/30 shrink-0 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CONTACT DETAIL PANEL
════════════════════════════════════════════════════════════ */
function ContactDetail({
  contact, activities, opportunities, tasks, tickets,
  onClose, onUpdate, onDeleteContact,
  onAddActivity, onDeleteActivity,
  onAddTask, onToggleTask, onDeleteTask,
  onAddTicket, onUpdateTicket, onDeleteTicket,
  allContacts,
}: {
  contact: Contact;
  activities: Activity[];
  opportunities: Opportunity[];
  tasks: CrmTask[];
  tickets: SupportTicket[];
  onClose: () => void;
  onUpdate: (data: Partial<Contact>) => Promise<void>;
  onDeleteContact: () => Promise<void>;
  onAddActivity: (data: Partial<Activity>) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  onAddTask: (data: Partial<CrmTask>) => Promise<void>;
  onToggleTask: (id: string, done: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddTicket: (data: Partial<SupportTicket>) => Promise<void>;
  onUpdateTicket: (id: string, data: Partial<SupportTicket>) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
  allContacts: Contact[];
}) {
  const [tab, setTab]       = useState<"infos" | "activites" | "opps" | "taches" | "tickets">("infos");
  const [editing, setEditing] = useState(false);
  const [form, setForm]     = useState<Partial<Contact>>({ ...contact });
  const [newAct, setNewAct] = useState<Partial<Activity> | null>(null);
  const [newTask, setNewTask] = useState<Partial<CrmTask> | null>(null);
  const [newTicket, setNewTicket] = useState<Partial<SupportTicket> | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const typeColor = CONTACT_TYPES[contact.type ?? "prospect"]?.color ?? "#60a5fa";

  async function saveEdit() {
    await onUpdate(form);
    setEditing(false);
  }

  const TABS = [
    { id: "infos",     label: "Infos",       icon: Briefcase },
    { id: "activites", label: "Activités",   icon: Activity },
    { id: "opps",      label: "Opportunités",icon: TrendingUp },
    { id: "taches",    label: "Tâches",      icon: CheckSquare },
    { id: "tickets",   label: "Tickets",     icon: Ticket },
  ] as const;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 flex flex-col w-full sm:w-[520px] border-l border-white/[0.06] bg-[#0a0b10] shadow-2xl overflow-hidden">

      {/* Header contact */}
      <div className="shrink-0 p-5 border-b border-white/[0.06]">
        <div className="flex items-start gap-3">
          <Avatar name={contact.name} color={typeColor} size={44}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white">{contact.name}</h2>
              <Badge label={CONTACT_TYPES[contact.type ?? "prospect"]?.label ?? "Prospect"}
                color={typeColor}/>
              <Badge label={STATUSES[contact.status].label}
                color={STATUSES[contact.status].color} bg={STATUSES[contact.status].bg}/>
            </div>
            {contact.company && <p className="text-[0.72rem] text-white/40 mt-0.5">{contact.company}</p>}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {contact.email  && <a href={`mailto:${contact.email}`}  className="flex items-center gap-1 text-[0.65rem] text-white/30 hover:text-white/60 transition-colors"><Mail  size={10}/>{contact.email}</a>}
              {contact.phone  && <a href={`tel:${contact.phone}`}     className="flex items-center gap-1 text-[0.65rem] text-white/30 hover:text-white/60 transition-colors"><Phone size={10}/>{contact.phone}</a>}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => setEditing(!editing)}
              className="h-8 w-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
              <Pencil size={13}/>
            </button>
            <button onClick={onClose}
              className="h-8 w-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
              <X size={13}/>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Opportunités", value: opportunities.length, color: "#a78bfa" },
            { label: "Tâches",       value: tasks.filter(t => !t.done).length, color: "#f59e0b" },
            { label: "Tickets",      value: tickets.filter(t => t.status !== "fermé").length, color: "#60a5fa" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] p-2 text-center">
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[0.58rem] text-white/25">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-white/[0.06] overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id ? "border-white text-white" : "border-transparent text-white/30 hover:text-white/60"}`}>
            <t.icon size={10}/>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── INFOS ── */}
        {tab === "infos" && (
          <div className="space-y-4">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nom *" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
                  <Input label="Société" value={form.company ?? ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}/>
                  <Input label="Email" type="email" value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
                  <Input label="Téléphone" value={form.phone ?? ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
                </div>
                <Input label="Adresse" value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Ville" value={form.city ?? ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}/>
                  <Input label="Pays" value={form.country ?? ""} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={form.type ?? "prospect"} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContactType }))}>
                    {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  <Select label="Statut" value={form.status ?? "prospect"} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContactStatus }))}>
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Secteur" value={form.sector ?? ""} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select label="Source" value={form.source ?? ""} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Priorité" value={form.priority ?? "normal"} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  <Input label="Taille société" placeholder="TPE / PME / ETI" value={form.company_size ?? ""} onChange={e => setForm(f => ({ ...f, company_size: e.target.value }))}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Budget estimé (€)" type="number" value={form.budget ?? ""} onChange={e => setForm(f => ({ ...f, budget: +e.target.value }))}/>
                  <div className="space-y-1">
                    <label className="block text-[0.62rem] font-bold uppercase tracking-widest text-white/30">Intérêt (0-5)</label>
                    <div className="flex gap-1 mt-1.5">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, interest_level: n }))}
                          className="transition-colors" style={{ color: (form.interest_level ?? 0) >= n ? "#f59e0b" : "rgba(255,255,255,0.15)" }}>
                          <Star size={16} fill={(form.interest_level ?? 0) >= n ? "#f59e0b" : "none"}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Input label="Site web" placeholder="https://..." value={form.website ?? ""} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}/>
                <Input label="LinkedIn" placeholder="linkedin.com/in/..." value={form.linkedin ?? ""} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}/>
                <Textarea label="Notes" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setForm({ ...contact }); }}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-white/50 hover:text-white">Annuler</button>
                  <button onClick={saveEdit}
                    className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/15">
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Infos clés */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: MapPin,     label: "Adresse",  value: [contact.address, contact.city, contact.country].filter(Boolean).join(", ") },
                    { icon: Briefcase,  label: "Secteur",  value: contact.sector },
                    { icon: Users,      label: "Taille",   value: contact.company_size },
                    { icon: ArrowUpRight, label: "Source", value: contact.source },
                    { icon: Globe,      label: "Site",     value: contact.website },
                    { icon: Linkedin,   label: "LinkedIn", value: contact.linkedin },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="flex items-start gap-2">
                      <item.icon size={11} className="mt-0.5 shrink-0 text-white/25"/>
                      <div>
                        <p className="text-[0.58rem] text-white/25 uppercase tracking-wider">{item.label}</p>
                        <p className="text-[0.72rem] text-white/70 break-all">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Budget / Intérêt / Priorité */}
                <div className="flex gap-3 flex-wrap">
                  {contact.budget && contact.budget > 0 && (
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-[0.58rem] text-white/25 mb-0.5">Budget</p>
                      <p className="text-sm font-black text-white">{fmtEur(contact.budget)}</p>
                    </div>
                  )}
                  {contact.priority && contact.priority !== "normal" && (
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-[0.58rem] text-white/25 mb-0.5">Priorité</p>
                      <p className="text-sm font-bold" style={{ color: PRIORITIES[contact.priority].color }}>
                        {PRIORITIES[contact.priority].label}
                      </p>
                    </div>
                  )}
                  {contact.interest_level && contact.interest_level > 0 && (
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-[0.58rem] text-white/25 mb-1">Intérêt</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={12} fill={n <= (contact.interest_level ?? 0) ? "#f59e0b" : "none"}
                            color={n <= (contact.interest_level ?? 0) ? "#f59e0b" : "rgba(255,255,255,0.2)"}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[0.58rem] text-white/25 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-[0.72rem] text-white/60 leading-relaxed whitespace-pre-line">{contact.notes}</p>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {contact.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.62rem] text-white/40">
                        <Hash size={8}/>{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Danger zone */}
                <div className="pt-2 border-t border-white/[0.04]">
                  {!confirmDel ? (
                    <button onClick={() => setConfirmDel(true)}
                      className="text-[0.65rem] text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1">
                      <Trash2 size={10}/> Supprimer ce contact
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[0.65rem] text-red-400">Confirmer la suppression ?</span>
                      <button onClick={onDeleteContact} className="text-[0.65rem] font-bold text-red-400 hover:text-red-300">Oui</button>
                      <button onClick={() => setConfirmDel(false)} className="text-[0.65rem] text-white/30 hover:text-white">Non</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITÉS ── */}
        {tab === "activites" && (
          <div className="space-y-4">
            <button onClick={() => setNewAct({ type: "note", activity_date: new Date().toISOString().split("T")[0] })}
              className="flex items-center gap-2 text-[0.72rem] font-bold text-white/40 hover:text-white transition-colors">
              <Plus size={13}/> Ajouter une activité
            </button>

            {newAct !== null && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0f1117] p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={newAct.type ?? "note"} onChange={e => setNewAct(a => ({ ...a, type: e.target.value as ActivityType }))}>
                    {(["note","call","email","meeting","document","rdv"] as ActivityType[]).map(t =>
                      <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input label="Date" type="date" value={newAct.activity_date?.split("T")[0] ?? today}
                    onChange={e => setNewAct(a => ({ ...a, activity_date: e.target.value }))}/>
                </div>
                <Input label="Titre *" placeholder="Ex: Appel découverte" value={newAct.title ?? ""}
                  onChange={e => setNewAct(a => ({ ...a, title: e.target.value }))}/>
                <Textarea label="Détails" placeholder="Résumé, points abordés…" value={newAct.description ?? ""}
                  onChange={e => setNewAct(a => ({ ...a, description: e.target.value }))}/>
                <div className="flex gap-2">
                  <button onClick={() => setNewAct(null)} className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs text-white/50 hover:text-white">Annuler</button>
                  <button disabled={!newAct.title}
                    onClick={async () => { await onAddActivity(newAct); setNewAct(null); }}
                    className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40">
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {activities.length === 0 && !newAct && (
              <p className="text-center text-white/20 text-sm py-6">Aucune activité enregistrée</p>
            )}

            {/* Timeline */}
            <div className="relative space-y-0">
              <div className="absolute left-[14px] top-0 bottom-0 w-px bg-white/[0.05]"/>
              {activities.sort((a, b) => b.activity_date.localeCompare(a.activity_date)).map(act => {
                const Icon = ACTIVITY_ICONS[act.type];
                const color = ACTIVITY_COLORS[act.type];
                return (
                  <div key={act.id} className="flex gap-3 pb-5 group relative">
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 border border-white/[0.08]"
                      style={{ backgroundColor: `${color}22` }}>
                      <Icon size={11} style={{ color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[0.72rem] font-semibold text-white">{act.title}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => onDeleteActivity(act.id)} className="text-white/20 hover:text-red-400">
                            <Trash2 size={10}/>
                          </button>
                        </div>
                      </div>
                      <p className="text-[0.6rem] text-white/30 mt-0.5">{fmtDate(act.activity_date)}</p>
                      {act.description && <p className="text-[0.68rem] text-white/40 mt-1 leading-relaxed">{act.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── OPPORTUNITÉS ── */}
        {tab === "opps" && (
          <div className="space-y-3">
            {opportunities.length === 0 && (
              <p className="text-center text-white/20 text-sm py-6">Aucune opportunité</p>
            )}
            {opportunities.map(opp => (
              <div key={opp.id} className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.78rem] font-bold text-white">{opp.title}</p>
                    {opp.product_service && <p className="text-[0.62rem] text-white/35 mt-0.5">{opp.product_service}</p>}
                  </div>
                  <Badge label={STAGES[opp.stage].label} color={STAGES[opp.stage].color}/>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {opp.amount > 0 && <span className="text-sm font-black" style={{ color: STAGES[opp.stage].color }}>{fmtEur(opp.amount)}</span>}
                  {opp.probability > 0 && <span className="text-[0.62rem] text-white/30">{opp.probability}% proba.</span>}
                  {opp.close_date && <span className="text-[0.62rem] text-white/30"><Calendar size={9} className="inline mr-0.5"/>{fmtDate(opp.close_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TÂCHES ── */}
        {tab === "taches" && (
          <div className="space-y-3">
            <button onClick={() => setNewTask({ type: "action", priority: "normal", contact_id: contact.id })}
              className="flex items-center gap-2 text-[0.72rem] font-bold text-white/40 hover:text-white transition-colors">
              <Plus size={13}/> Nouvelle tâche
            </button>

            {newTask !== null && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0f1117] p-4 space-y-3">
                <Input label="Titre *" value={newTask.title ?? ""} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={newTask.type ?? "action"} onChange={e => setNewTask(t => ({ ...t, type: e.target.value as TaskType }))}>
                    {(["action","relance","rdv","deadline","appel"] as TaskType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input label="Échéance" type="date" value={newTask.due_date ?? ""} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value || null }))}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNewTask(null)} className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs text-white/50 hover:text-white">Annuler</button>
                  <button disabled={!newTask.title}
                    onClick={async () => { await onAddTask(newTask); setNewTask(null); }}
                    className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-bold text-white disabled:opacity-40">Créer</button>
                </div>
              </div>
            )}

            {tasks.map(task => {
              const isLate = !task.done && task.due_date && task.due_date < today;
              return (
                <div key={task.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0f1117] p-3 group">
                  <button onClick={() => onToggleTask(task.id, !task.done)} style={{ color: task.done ? "#34d399" : "rgba(255,255,255,0.2)" }}>
                    {task.done ? <CheckSquare size={15}/> : <Square size={15}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.72rem] font-semibold ${task.done ? "line-through text-white/30" : "text-white"}`}>{task.title}</p>
                    {task.due_date && (
                      <p className={`text-[0.62rem] mt-0.5 flex items-center gap-1 ${isLate ? "text-red-400" : "text-white/30"}`}>
                        <Calendar size={9}/>{fmtDate(task.due_date)}
                      </p>
                    )}
                  </div>
                  <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                    <Trash2 size={11}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TICKETS ── */}
        {tab === "tickets" && (
          <div className="space-y-3">
            <button onClick={() => setNewTicket({ status: "ouvert", priority: "normale", contact_id: contact.id })}
              className="flex items-center gap-2 text-[0.72rem] font-bold text-white/40 hover:text-white transition-colors">
              <Plus size={13}/> Nouveau ticket
            </button>

            {newTicket !== null && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0f1117] p-4 space-y-3">
                <Input label="Objet *" value={newTicket.title ?? ""} onChange={e => setNewTicket(t => ({ ...t, title: e.target.value }))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Priorité" value={newTicket.priority ?? "normale"} onChange={e => setNewTicket(t => ({ ...t, priority: e.target.value as TicketPriority }))}>
                    {(["basse","normale","haute","urgente"] as TicketPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <Select label="Statut" value={newTicket.status ?? "ouvert"} onChange={e => setNewTicket(t => ({ ...t, status: e.target.value as TicketStatus }))}>
                    {(["ouvert","en_cours","résolu","fermé"] as TicketStatus[]).map(s => <option key={s} value={s}>{TICKET_STATUSES[s].label}</option>)}
                  </Select>
                </div>
                <Textarea label="Description" value={newTicket.description ?? ""} onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))}/>
                <div className="flex gap-2">
                  <button onClick={() => setNewTicket(null)} className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs text-white/50 hover:text-white">Annuler</button>
                  <button disabled={!newTicket.title}
                    onClick={async () => { await onAddTicket(newTicket); setNewTicket(null); }}
                    className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-bold text-white disabled:opacity-40">Créer</button>
                </div>
              </div>
            )}

            {tickets.map(ticket => (
              <div key={ticket.id} className="rounded-2xl border border-white/[0.06] bg-[#0f1117] p-4 group">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.72rem] font-semibold text-white">{ticket.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={TICKET_STATUSES[ticket.status].label} color={TICKET_STATUSES[ticket.status].color}/>
                    <button onClick={() => onDeleteTicket(ticket.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                      <Trash2 size={10}/>
                    </button>
                  </div>
                </div>
                {ticket.description && <p className="text-[0.65rem] text-white/35 mt-1.5">{ticket.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Select value={ticket.status} onChange={e => onUpdateTicket(ticket.id, { status: e.target.value as TicketStatus })}
                    className="text-[0.6rem] !py-1 !px-2 rounded-lg">
                    {(["ouvert","en_cours","résolu","fermé"] as TicketStatus[]).map(s =>
                      <option key={s} value={s}>{TICKET_STATUSES[s].label}</option>)}
                  </Select>
                  <p className="text-[0.6rem] text-white/25 ml-auto">{fmtDate(ticket.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════ */
export default function CRMPage() {
  /* ── State ── */
  const [contacts,      setContacts]      = useState<Contact[]>([]);
  const [activities,    setActivities]    = useState<Activity[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks,         setTasks]         = useState<CrmTask[]>([]);
  const [tickets,       setTickets]       = useState<SupportTicket[]>([]);

  const [loading,       setLoading]       = useState(true);
  const [mainTab,       setMainTab]       = useState<"contacts" | "pipeline" | "taches" | "rapport">("contacts");
  const [selected,      setSelected]      = useState<Contact | null>(null);

  const [query,         setQuery]         = useState("");
  const [filterStatus,  setFilterStatus]  = useState<ContactStatus | "tous">("tous");
  const [filterType,    setFilterType]    = useState<ContactType | "tous">("tous");

  const [addModal,      setAddModal]      = useState(false);
  const [editContact,   setEditContact]   = useState<Contact | null>(null);
  const [form,          setForm]          = useState<Partial<Contact>>({ status: "prospect", type: "prospect" });
  const [toast,         setToast]         = useState<ToastData | null>(null);
  const [userId,        setUserId]        = useState<string | null>(null);

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
  }, []);

  /* ── Load all data ── */
  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [ctRes, acRes, opRes, tkRes, tiRes] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(500),
      supabase.from("contact_activities").select("*").eq("user_id", userId).order("activity_date", { ascending: false }).limit(500),
      supabase.from("opportunities").select("*, contacts(name,company)").eq("user_id", userId).order("updated_at", { ascending: false }).limit(200),
      supabase.from("crm_tasks").select("*, contacts(name,company)").eq("user_id", userId).order("due_date", { ascending: true }).limit(200),
      supabase.from("tickets").select("*, contacts(name,company)").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    ]);
    if (ctRes.data) setContacts(ctRes.data as Contact[]);
    if (acRes.data) setActivities(acRes.data as Activity[]);
    if (opRes.data) setOpportunities(opRes.data.map((o: Record<string, unknown>) => ({
      ...o, contact: o.contacts as Pick<Contact, "name"|"company"> | undefined,
    })) as Opportunity[]);
    if (tkRes.data) setTasks(tkRes.data.map((t: Record<string, unknown>) => ({
      ...t, contact: t.contacts as Pick<Contact, "name"|"company"> | undefined,
    })) as CrmTask[]);
    if (tiRes.data) setTickets(tiRes.data.map((t: Record<string, unknown>) => ({
      ...t, contact: t.contacts as Pick<Contact, "name"|"company"> | undefined,
    })) as SupportTicket[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) loadAll(); }, [userId, loadAll]);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  /* ── Contacts CRUD ── */
  async function saveContact() {
    if (!form.name || !userId) return;
    if (editContact) {
      const { error } = await supabase.from("contacts").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editContact.id);
      if (error) return showToast("Erreur de mise à jour", "error");
      setContacts(cs => cs.map(c => c.id === editContact.id ? { ...c, ...form } as Contact : c));
      if (selected?.id === editContact.id) setSelected(s => s ? { ...s, ...form } as Contact : s);
      showToast("Contact mis à jour");
    } else {
      const { data, error } = await supabase.from("contacts").insert({ ...form, user_id: userId }).select().single();
      if (error || !data) return showToast("Erreur de création", "error");
      setContacts(cs => [data as Contact, ...cs]);
      showToast("Contact créé ✓");
    }
    setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" });
  }

  async function deleteContact(id: string) {
    await supabase.from("contacts").delete().eq("id", id);
    setContacts(cs => cs.filter(c => c.id !== id));
    setSelected(null);
    showToast("Contact supprimé");
  }

  async function updateContact(id: string, data: Partial<Contact>) {
    const { error } = await supabase.from("contacts").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return showToast("Erreur", "error");
    setContacts(cs => cs.map(c => c.id === id ? { ...c, ...data } as Contact : c));
    setSelected(s => s?.id === id ? { ...s, ...data } as Contact : s);
    showToast("Enregistré ✓");
  }

  /* ── Activities ── */
  async function addActivity(contactId: string, data: Partial<Activity>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("contact_activities").insert({
      ...data, user_id: userId, contact_id: contactId,
    }).select().single();
    if (!error && d) { setActivities(a => [d as Activity, ...a]); showToast("Activité ajoutée ✓"); }
  }

  async function deleteActivity(id: string) {
    await supabase.from("contact_activities").delete().eq("id", id);
    setActivities(a => a.filter(x => x.id !== id));
  }

  /* ── Opportunities ── */
  async function addOpportunity(data: Partial<Opportunity>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("opportunities").insert({ ...data, user_id: userId }).select().single();
    if (!error && d) {
      const opp = d as Opportunity;
      if (opp.contact_id) {
        const c = contacts.find(c => c.id === opp.contact_id);
        if (c) opp.contact = { name: c.name, company: c.company };
      }
      setOpportunities(o => [opp, ...o]);
      showToast("Opportunité créée ✓");
    }
  }

  async function updateOpportunity(id: string, data: Partial<Opportunity>) {
    await supabase.from("opportunities").update(data).eq("id", id);
    setOpportunities(o => o.map(op => op.id === id ? { ...op, ...data } : op));
    showToast("Opportunité mise à jour ✓");
  }

  async function deleteOpportunity(id: string) {
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities(o => o.filter(op => op.id !== id));
  }

  /* ── Tasks ── */
  async function addTask(data: Partial<CrmTask>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("crm_tasks").insert({ ...data, user_id: userId }).select().single();
    if (!error && d) {
      const task = d as CrmTask;
      if (task.contact_id) {
        const c = contacts.find(c => c.id === task.contact_id);
        if (c) task.contact = { name: c.name, company: c.company };
      }
      setTasks(t => [...t, task]);
      showToast("Tâche créée ✓");
    }
  }

  async function toggleTask(id: string, done: boolean) {
    await supabase.from("crm_tasks").update({ done }).eq("id", id);
    setTasks(t => t.map(task => task.id === id ? { ...task, done } : task));
  }

  async function deleteTask(id: string) {
    await supabase.from("crm_tasks").delete().eq("id", id);
    setTasks(t => t.filter(task => task.id !== id));
  }

  /* ── Tickets ── */
  async function addTicket(data: Partial<SupportTicket>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("tickets").insert({ ...data, user_id: userId }).select().single();
    if (!error && d) {
      const ticket = d as SupportTicket;
      if (ticket.contact_id) {
        const c = contacts.find(c => c.id === ticket.contact_id);
        if (c) ticket.contact = { name: c.name, company: c.company };
      }
      setTickets(t => [ticket, ...t]);
      showToast("Ticket créé ✓");
    }
  }

  async function updateTicket(id: string, data: Partial<SupportTicket>) {
    await supabase.from("tickets").update(data).eq("id", id);
    setTickets(t => t.map(tk => tk.id === id ? { ...tk, ...data } : tk));
  }

  async function deleteTicket(id: string) {
    await supabase.from("tickets").delete().eq("id", id);
    setTickets(t => t.filter(tk => tk.id !== id));
  }

  /* ── Export CSV ── */
  function exportCSV() {
    const rows = filtered.map(c => [
      c.name, c.company ?? "", c.email ?? "", c.phone ?? "",
      c.status, c.type ?? "prospect", c.sector ?? "", c.source ?? "",
      c.city ?? "", c.budget ?? 0, fmtDate(c.created_at),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = ["Nom,Société,Email,Téléphone,Statut,Type,Secteur,Source,Ville,Budget,Créé le", ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "contacts.csv";
    a.click();
  }

  /* ── Filtered contacts ── */
  const filtered = useMemo(() => contacts.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "tous" || c.status === filterStatus;
    const matchType   = filterType   === "tous" || c.type   === filterType;
    return matchQ && matchStatus && matchType;
  }), [contacts, query, filterStatus, filterType]);

  /* ── Contact detail data ── */
  const selectedActivities    = useMemo(() => activities.filter(a => a.contact_id === selected?.id), [activities, selected]);
  const selectedOpportunities = useMemo(() => opportunities.filter(o => o.contact_id === selected?.id), [opportunities, selected]);
  const selectedTasks         = useMemo(() => tasks.filter(t => t.contact_id === selected?.id), [tasks, selected]);
  const selectedTickets       = useMemo(() => tickets.filter(t => t.contact_id === selected?.id), [tickets, selected]);

  const MAIN_TABS = [
    { id: "contacts", label: "Contacts",     icon: Users,      badge: contacts.length },
    { id: "pipeline", label: "Pipeline",     icon: TrendingUp, badge: opportunities.filter(o => o.stage !== "perdu").length },
    { id: "taches",   label: "Tâches",       icon: CheckSquare,badge: tasks.filter(t => !t.done).length },
    { id: "rapport",  label: "Rapport",      icon: BarChart2,  badge: 0 },
  ] as const;

  /* ── Render ── */
  return (
    <div className="relative flex h-full flex-col gap-0">
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)}/>}
      </AnimatePresence>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 p-4 sm:p-6 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">CRM</h1>
          <p className="text-[0.65rem] text-white/30 mt-0.5">
            {contacts.length} contacts · {opportunities.filter(o => o.stage !== "perdu").length} opportunités actives
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="h-8 w-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Exporter CSV">
            <Download size={14}/>
          </button>
          <button onClick={() => { setForm({ status: "prospect", type: "prospect" }); setEditContact(null); setAddModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-[0.75rem] font-bold text-white hover:bg-white/15 transition-colors">
            <Plus size={13}/> Nouveau contact
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="shrink-0 flex border-b border-white/[0.05] px-4 sm:px-6 overflow-x-auto">
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-3.5 text-[0.67rem] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              mainTab === t.id ? "border-white text-white" : "border-transparent text-white/30 hover:text-white/60"}`}>
            <t.icon size={11}/>{t.label}
            {t.badge > 0 && (
              <span className={`rounded-full px-1.5 text-[0.58rem] ${mainTab === t.id ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/30"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${selected ? "hidden sm:block" : ""}`}>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-white/20"/>
            </div>
          ) : (

            <>
              {/* ── CONTACTS VIEW ── */}
              {mainTab === "contacts" && (
                <div className="space-y-4">
                  {/* Filtres */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"/>
                      <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Rechercher un contact, une société…"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-4 py-2.5 text-[0.8rem] text-white placeholder-white/20 outline-none focus:border-white/15"/>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ContactStatus | "tous")}
                        className="rounded-xl border border-white/[0.08] bg-[#0f1117] px-3 py-2 text-[0.75rem] text-white/60 outline-none">
                        <option value="tous">Tous statuts</option>
                        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={filterType} onChange={e => setFilterType(e.target.value as ContactType | "tous")}
                        className="rounded-xl border border-white/[0.08] bg-[#0f1117] px-3 py-2 text-[0.75rem] text-white/60 outline-none">
                        <option value="tous">Tous types</option>
                        {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Count */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {(Object.keys(STATUSES) as ContactStatus[]).map(s => {
                      const count = contacts.filter(c => c.status === s).length;
                      return count > 0 ? (
                        <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "tous" : s)}
                          className="flex items-center gap-1.5 text-[0.62rem] font-bold transition-opacity"
                          style={{ color: STATUSES[s].color, opacity: filterStatus !== "tous" && filterStatus !== s ? 0.35 : 1 }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUSES[s].color }}/>
                          {STATUSES[s].label} ({count})
                        </button>
                      ) : null;
                    })}
                    {filtered.length !== contacts.length && (
                      <span className="text-[0.6rem] text-white/20">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {/* Contact list */}
                  {filtered.length === 0 ? (
                    <div className="text-center py-16 text-white/20">
                      <Users size={36} className="mx-auto mb-4 opacity-20"/>
                      <p className="text-sm">{contacts.length === 0 ? "Aucun contact — ajoutez votre premier !" : "Aucun résultat"}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {filtered.map(c => {
                          const typeColor = CONTACT_TYPES[c.type ?? "prospect"]?.color ?? "#60a5fa";
                          const isSelected = selected?.id === c.id;
                          const cActivities = activities.filter(a => a.contact_id === c.id).length;
                          const cOpps = opportunities.filter(o => o.contact_id === c.id && o.stage !== "perdu").length;
                          return (
                            <motion.div key={c.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              onClick={() => setSelected(isSelected ? null : c)}
                              className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all group ${
                                isSelected ? "border-white/15 bg-white/[0.06]" : "border-white/[0.05] bg-[#0f1117] hover:border-white/10 hover:bg-white/[0.03]"}`}>
                              <Avatar name={c.name} color={typeColor} size={38}/>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[0.82rem] font-bold text-white truncate">{c.name}</span>
                                  <Badge label={STATUSES[c.status].label} color={STATUSES[c.status].color} bg={STATUSES[c.status].bg}/>
                                  {c.priority === "high" && <Flag size={10} className="text-orange-400"/>}
                                  {c.priority === "urgent" && <Flag size={10} className="text-red-400"/>}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  {c.company && <span className="text-[0.65rem] text-white/40 truncate">{c.company}</span>}
                                  {c.sector  && <span className="text-[0.6rem] text-white/25 truncate">{c.sector}</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  {c.email && <span className="text-[0.62rem] text-white/25 truncate flex items-center gap-0.5"><Mail size={8}/>{c.email}</span>}
                                  {c.phone && <span className="text-[0.62rem] text-white/25 flex items-center gap-0.5"><Phone size={8}/>{c.phone}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {cOpps > 0 && (
                                  <div className="text-center hidden sm:block">
                                    <div className="text-xs font-black" style={{ color: "#a78bfa" }}>{cOpps}</div>
                                    <div className="text-[0.52rem] text-white/20">opp.</div>
                                  </div>
                                )}
                                {c.budget && c.budget > 0 && (
                                  <div className="text-right hidden lg:block">
                                    <div className="text-[0.7rem] font-black text-white/60">{fmtEur(c.budget)}</div>
                                    <div className="text-[0.52rem] text-white/20">budget</div>
                                  </div>
                                )}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={e => { e.stopPropagation(); setForm({ ...c }); setEditContact(c); setAddModal(true); }}
                                    className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                    <Pencil size={11}/>
                                  </button>
                                </div>
                                <ChevronRight size={13} className={`text-white/20 transition-transform ${isSelected ? "rotate-90" : ""}`}/>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* ── PIPELINE VIEW ── */}
              {mainTab === "pipeline" && (
                <PipelineView
                  opportunities={opportunities}
                  contacts={contacts}
                  onUpdate={updateOpportunity}
                  onDelete={deleteOpportunity}
                  onAdd={addOpportunity}
                  loading={loading}
                />
              )}

              {/* ── TÂCHES VIEW ── */}
              {mainTab === "taches" && (
                <TachesView
                  tasks={tasks}
                  contacts={contacts}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onAdd={addTask}
                  onUpdate={async () => {}}
                />
              )}

              {/* ── RAPPORT VIEW ── */}
              {mainTab === "rapport" && (
                <RapportView contacts={contacts} opportunities={opportunities} tasks={tasks} tickets={tickets}/>
              )}
            </>
          )}
        </div>

        {/* ── CONTACT DETAIL PANEL ── */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Overlay mobile */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/40 sm:hidden"
                onClick={() => setSelected(null)}/>
              <ContactDetail
                contact={selected}
                activities={selectedActivities}
                opportunities={selectedOpportunities}
                tasks={selectedTasks}
                tickets={selectedTickets}
                onClose={() => setSelected(null)}
                onUpdate={async (data) => updateContact(selected.id, data)}
                onDeleteContact={() => deleteContact(selected.id)}
                onAddActivity={async (data) => addActivity(selected.id, data)}
                onDeleteActivity={deleteActivity}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onAddTicket={addTicket}
                onUpdateTicket={updateTicket}
                onDeleteTicket={deleteTicket}
                allContacts={contacts}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── MODAL ADD / EDIT CONTACT ── */}
      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0f1117] p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white">{editContact ? "Modifier le contact" : "Nouveau contact"}</h3>
                <button onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); }}
                  className="text-white/30 hover:text-white"><X size={16}/></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Input label="Nom complet *" placeholder="Prénom NOM" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></div>
                <Input label="Société" placeholder="Entreprise" value={form.company ?? ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}/>
                <Input label="Email" type="email" placeholder="email@..." value={form.email ?? ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
                <Input label="Téléphone" placeholder="+33 6..." value={form.phone ?? ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
                <Input label="Adresse" placeholder="Rue..." value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/>
                <Input label="Ville" value={form.city ?? ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}/>
                <Input label="Pays" value={form.country ?? ""} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select label="Type" value={form.type ?? "prospect"} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContactType }))}>
                  {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Select label="Statut" value={form.status ?? "prospect"} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContactStatus }))}>
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Select label="Secteur" value={form.sector ?? ""} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                  <option value="">— Secteur —</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select label="Source" value={form.source ?? ""} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">— Source —</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select label="Priorité" value={form.priority ?? "normal"} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Input label="Taille société" placeholder="TPE / PME / ETI" value={form.company_size ?? ""} onChange={e => setForm(f => ({ ...f, company_size: e.target.value }))}/>
              </div>
              <Input label="Budget estimé (€)" type="number" value={form.budget ?? ""} onChange={e => setForm(f => ({ ...f, budget: +e.target.value }))}/>
              <Textarea label="Notes" placeholder="Informations complémentaires…" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); }}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-white/50 hover:text-white">Annuler</button>
                <button onClick={saveContact} disabled={!form.name}
                  className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-40">
                  {editContact ? "Mettre à jour" : "Créer le contact"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
