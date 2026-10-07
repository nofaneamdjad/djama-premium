"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Plus, List, Settings, Clock, User, Trash2, Pencil,
  ChevronRight, ChevronLeft, ChevronDown, Search, Filter, X, Check,
  Phone, Mail, Building2, MapPin, Video, Link2, Copy, Share2,
  Globe, Zap, AlertCircle, Loader2, MoreVertical, ExternalLink,
  CalendarClock, Users, Sliders, BookOpen, QrCode, CheckCircle2,
  XCircle, Timer, Calendar, LayoutGrid, BarChart2, AlignJustify,
  ChevronUp, Eye, EyeOff, RefreshCw, Tag, Sparkles, Send, Bot,
  Bell, BellOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/lib/use-organization";
import { useTheme } from "@/lib/theme-context";
import { useSwipe } from "@/lib/use-swipe";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import { ToastStack, useToastStack, type ToastType } from "@/components/ui/ToastStack";
import EmptyState from "@/components/client/EmptyState";

const ease   = [0.22, 1, 0.36, 1] as const;
const GOLD   = "#c9a55a";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type AppTab = "agenda" | "liste" | "types" | "disponibilites" | "page-pub" | "stats" | "parametres";

type RdvStatus  = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
type LocType    = "visio" | "presential" | "phone" | "custom";

interface RdvType {
  id:                   string;
  name:                 string;
  description:          string;
  duration_minutes:     number;
  color:                string;
  location_type:        LocType;
  location_value:       string;
  buffer_before_min:    number;
  buffer_after_min:     number;
  max_per_day:          number;
  advance_notice_hours: number;
  booking_window_days:  number;
  auto_confirm:         boolean;
  is_public:            boolean;
  is_active:            boolean;
}

interface Contact {
  id:         string;
  first_name: string;
  last_name:  string;
  email:      string;
  phone:      string;
}

interface StaffMember {
  id:           string;
  name:         string;
  avatar_color: string;
  position:     string;
  status:       string;
}

interface RdvAppointment {
  id:             string;
  rdv_type_id:    string | null;
  contact_id:     string | null;
  client_name:    string;
  client_email:   string;
  client_phone:   string;
  client_company: string;
  start_at:       string;
  end_at:         string;
  status:         RdvStatus;
  internal_notes: string;
  client_notes:   string;
  source:         string;
  cancel_token:   string;
  created_at:     string;
  assigned_staff_id?: string | null;
  rdv_types?:     { name: string; color: string; duration_minutes: number } | null;
  contacts?:      Contact | null;
  team_members?:  { id: string; name: string; avatar_color: string } | null;
}

interface AvailSlot {
  id:          string;
  day_of_week: number;
  start_time:  string;
  end_time:    string;
}

interface BookingPage {
  id:               string;
  token:            string;
  slug:             string | null;
  page_title:       string;
  page_description: string;
  accent_color:     string;
  is_active:        boolean;
}

/* ─────────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────────── */
const STATUS_META: Record<RdvStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  confirmed: { label: "Confirmé",    color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  cancelled: { label: "Annulé",      color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  completed: { label: "Terminé",     color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  no_show:   { label: "Absent",      color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const LOC_META: Record<LocType, { label: string; Icon: React.ElementType }> = {
  visio:       { label: "Visioconférence", Icon: Video   },
  presential:  { label: "En présentiel",  Icon: MapPin  },
  phone:       { label: "Téléphone",      Icon: Phone   },
  custom:      { label: "Lien externe",   Icon: Link2   },
};

const DAYS_FR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const DAYS_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

const DEFAULT_AVAIL: Omit<AvailSlot, "id">[] = [
  { day_of_week: 1, start_time: "09:00", end_time: "12:00" },
  { day_of_week: 1, start_time: "14:00", end_time: "18:00" },
  { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
  { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
  { day_of_week: 4, start_time: "09:00", end_time: "17:00" },
  { day_of_week: 5, start_time: "09:00", end_time: "17:00" },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}
function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function avatarColor(name: string): string {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#0ea5e9","#c9a55a"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Badge statut
───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: RdvStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold"
      style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Modal de création/édition RDV
───────────────────────────────────────────────────────── */
interface NewRdvModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<RdvAppointment>) => Promise<void>;
  types: RdvType[];
  staff: StaffMember[];
  isDark: boolean;
  editData?: RdvAppointment | null;
  initialDate?: string;
  initialTime?: string;
}

function NewRdvModal({ open, onClose, onSave, types, staff, isDark, editData, initialDate, initialTime }: NewRdvModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    client_name:       editData?.client_name       ?? "",
    client_email:      editData?.client_email      ?? "",
    client_phone:      editData?.client_phone      ?? "",
    client_company:    editData?.client_company    ?? "",
    rdv_type_id:       editData?.rdv_type_id       ?? (types[0]?.id ?? ""),
    date:              editData ? editData.start_at.slice(0, 10) : (initialDate ?? today),
    start_time:        editData ? fmtTime(editData.start_at) : (initialTime ?? "09:00"),
    status:            (editData?.status ?? "confirmed") as RdvStatus,
    internal_notes:    editData?.internal_notes    ?? "",
    assigned_staff_id: editData?.assigned_staff_id ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    if (editData) {
      setForm({
        client_name:       editData.client_name,
        client_email:      editData.client_email,
        client_phone:      editData.client_phone,
        client_company:    editData.client_company,
        rdv_type_id:       editData.rdv_type_id ?? (types[0]?.id ?? ""),
        date:              editData.start_at.slice(0, 10),
        start_time:        fmtTime(editData.start_at),
        status:            editData.status,
        internal_notes:    editData.internal_notes,
        assigned_staff_id: editData.assigned_staff_id ?? "",
      });
    } else {
      setForm((f) => ({
        ...f,
        date:       initialDate ?? todayIso,
        start_time: initialTime ?? "09:00",
        rdv_type_id: types[0]?.id ?? "",
        assigned_staff_id: "",
      }));
    }
  }, [editData, types, initialDate, initialTime]);

  const selectedType = types.find((t) => t.id === form.rdv_type_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_name.trim() || !form.client_email.trim()) return;
    setSaving(true);
    const dur = selectedType?.duration_minutes ?? 30;
    const startAt = new Date(`${form.date}T${form.start_time}:00`);
    const endAt   = new Date(startAt.getTime() + dur * 60000);
    await onSave({
      client_name:       form.client_name,
      client_email:      form.client_email,
      client_phone:      form.client_phone,
      client_company:    form.client_company,
      rdv_type_id:       form.rdv_type_id || null,
      start_at:          startAt.toISOString(),
      end_at:            endAt.toISOString(),
      status:            form.status,
      internal_notes:    form.internal_notes,
      assigned_staff_id: form.assigned_staff_id || null,
    });
    setSaving(false);
  }

  const s = {
    overlay: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4",
    backdrop: "absolute inset-0 bg-black/60",
    panel:    `relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${isDark ? "bg-[#0f1117] border-white/[0.09]" : "bg-white border-black/[0.08]"}`,
    label:    `block mb-1 text-[0.68rem] font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#0e1420]/45"}`,
    input:    `w-full rounded-xl px-3 py-2 text-[13px] outline-none border transition-colors ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25 focus:border-[#c9a55a]/50" : "bg-black/[0.03] border-black/[0.08] text-[#0e1420] placeholder:text-[#0e1420]/30 focus:border-[#c9a55a]/60"}`,
    pri:      isDark ? "text-white" : "text-[#0e1420]",
    sec:      isDark ? "text-white/50" : "text-[#0e1420]/55",
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className={s.overlay}>
        <motion.div className={s.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className={s.panel} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25, ease }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-base font-black ${s.pri}`}>{editData ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h2>
            <button onClick={onClose} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de RDV */}
            {types.length > 0 && (
              <div>
                <label className={s.label}>Type de rendez-vous</label>
                <select className={s.input} value={form.rdv_type_id} onChange={(e) => setForm((f) => ({ ...f, rdv_type_id: e.target.value }))}>
                  <option value="">— Sans type —</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({fmtDuration(t.duration_minutes)})</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={s.label}>Prénom et nom *</label>
                <input className={s.input} required value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Sophie Martin" />
              </div>
              <div>
                <label className={s.label}>Email *</label>
                <input className={s.input} type="email" required value={form.client_email} onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))} placeholder="sophie@exemple.fr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={s.label}>Téléphone</label>
                <input className={s.input} value={form.client_phone} onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))} placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label className={s.label}>Entreprise</label>
                <input className={s.input} value={form.client_company} onChange={(e) => setForm((f) => ({ ...f, client_company: e.target.value }))} placeholder="Nom entreprise" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={s.label}>Date *</label>
                <input className={s.input} type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className={s.label}>Heure *</label>
                <input className={s.input} type="time" required value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className={s.label}>Statut</label>
              <select className={s.input} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RdvStatus }))}>
                {(Object.keys(STATUS_META) as RdvStatus[]).map((k) => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
              </select>
            </div>

            <div>
              <label className={s.label}>Notes internes</label>
              <textarea className={`${s.input} resize-none`} rows={2} value={form.internal_notes} onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))} placeholder="Notes visibles uniquement par votre équipe…" />
            </div>

            {staff.length > 0 && (
              <div>
                <label className={s.label}>Assigné à</label>
                <select className={s.input} value={form.assigned_staff_id} onChange={(e) => setForm((f) => ({ ...f, assigned_staff_id: e.target.value }))}>
                  <option value="">— Non assigné —</option>
                  {staff.map((m) => <option key={m.id} value={m.id}>{m.name}{m.position ? ` · ${m.position}` : ""}</option>)}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${isDark ? "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]" : "bg-black/[0.06] text-[#0e1420]/60 hover:bg-black/[0.09]"}`}>Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-black text-white" style={{ background: `linear-gradient(135deg, ${GOLD}, #a07840)` }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editData ? "Enregistrer" : "Créer le rendez-vous"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Modal de création/édition d'un type de RDV
───────────────────────────────────────────────────────── */
interface TypeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<RdvType>) => Promise<void>;
  isDark: boolean;
  editData?: RdvType | null;
}

function TypeModal({ open, onClose, onSave, isDark, editData }: TypeModalProps) {
  const [form, setForm] = useState<Partial<RdvType>>({
    name:                 editData?.name ?? "",
    description:          editData?.description ?? "",
    duration_minutes:     editData?.duration_minutes ?? 30,
    color:                editData?.color ?? GOLD,
    location_type:        editData?.location_type ?? "visio",
    location_value:       editData?.location_value ?? "",
    buffer_before_min:    editData?.buffer_before_min ?? 0,
    buffer_after_min:     editData?.buffer_after_min ?? 15,
    max_per_day:          editData?.max_per_day ?? 10,
    advance_notice_hours: editData?.advance_notice_hours ?? 2,
    booking_window_days:  editData?.booking_window_days ?? 60,
    auto_confirm:         editData?.auto_confirm ?? true,
    is_public:            editData?.is_public ?? true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) setForm({ ...editData });
  }, [editData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const s = {
    panel:   `relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#0f1117] border-white/[0.09]" : "bg-white border-black/[0.08]"}`,
    label:   `block mb-1 text-[0.68rem] font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#0e1420]/45"}`,
    input:   `w-full rounded-xl px-3 py-2 text-[13px] outline-none border transition-colors ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25 focus:border-[#c9a55a]/50" : "bg-black/[0.03] border-black/[0.08] text-[#0e1420] placeholder:text-[#0e1420]/30 focus:border-[#c9a55a]/60"}`,
    pri:     isDark ? "text-white" : "text-[#0e1420]",
    sec:     isDark ? "text-white/50" : "text-[#0e1420]/55",
    section: `text-[0.65rem] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-white/30" : "text-[#0e1420]/35"}`,
  };

  const COLORS = [GOLD, "#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#ef4444"];
  const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className={s.panel} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25, ease }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-base font-black ${s.pri}`}>{editData ? "Modifier le type" : "Nouveau type de rendez-vous"}</h2>
            <button onClick={onClose} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Infos de base */}
            <div className="space-y-3">
              <p className={s.section}>Informations</p>
              <div>
                <label className={s.label}>Nom *</label>
                <input className={s.input} required value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Consultation, Coaching, Appel découverte…" />
              </div>
              <div>
                <label className={s.label}>Description</label>
                <textarea className={`${s.input} resize-none`} rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Visible sur la page de réservation publique" />
              </div>

              {/* Durée */}
              <div>
                <label className={s.label}>Durée</label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <button key={d} type="button"
                      onClick={() => setForm((f) => ({ ...f, duration_minutes: d }))}
                      className="rounded-lg px-3 py-1 text-[12px] font-semibold border transition-all"
                      style={form.duration_minutes === d
                        ? { background: `${GOLD}18`, color: GOLD, borderColor: `${GOLD}44` }
                        : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }
                      }>
                      {fmtDuration(d)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label className={s.label}>Couleur</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px ${isDark ? "#0f1117" : "#fff"}, 0 0 0 4px ${c}` : "none" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-3">
              <p className={s.section}>Lieu</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LOC_META) as LocType[]).map((k) => {
                  const { label, Icon } = LOC_META[k];
                  return (
                    <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, location_type: k }))}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition-all"
                      style={form.location_type === k
                        ? { background: `${GOLD}12`, color: GOLD, borderColor: `${GOLD}40` }
                        : { background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }
                      }>
                      <Icon size={14} />{label}
                    </button>
                  );
                })}
              </div>
              {(form.location_type === "custom" || form.location_type === "visio") && (
                <input className={s.input} value={form.location_value ?? ""} onChange={(e) => setForm((f) => ({ ...f, location_value: e.target.value }))} placeholder={form.location_type === "visio" ? "https://meet.google.com/…" : "Adresse ou lien"} />
              )}
            </div>

            {/* Paramètres */}
            <div className="space-y-3">
              <p className={s.section}>Paramètres</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={s.label}>Tampon avant (min)</label>
                  <input className={s.input} type="number" min={0} max={60} value={form.buffer_before_min ?? 0} onChange={(e) => setForm((f) => ({ ...f, buffer_before_min: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={s.label}>Tampon après (min)</label>
                  <input className={s.input} type="number" min={0} max={60} value={form.buffer_after_min ?? 15} onChange={(e) => setForm((f) => ({ ...f, buffer_after_min: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={s.label}>Délai minimum (h)</label>
                  <input className={s.input} type="number" min={0} max={168} value={form.advance_notice_hours ?? 2} onChange={(e) => setForm((f) => ({ ...f, advance_notice_hours: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={s.label}>Fenêtre de réservation (j)</label>
                  <input className={s.input} type="number" min={1} max={365} value={form.booking_window_days ?? 60} onChange={(e) => setForm((f) => ({ ...f, booking_window_days: Number(e.target.value) }))} />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                {[
                  { key: "auto_confirm" as const,  label: "Confirmation automatique" },
                  { key: "is_public"   as const,  label: "Visible sur la page publique" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-3">
                    <div className="relative" onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}>
                      <div className="h-5 w-9 rounded-full transition-colors" style={{ background: form[key] ? GOLD : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
                      <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ transform: form[key] ? "translateX(16px)" : "none" }} />
                    </div>
                    <span className={`text-[13px] ${isDark ? "text-white/70" : "text-[#0e1420]/70"}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${isDark ? "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]" : "bg-black/[0.06] text-[#0e1420]/60 hover:bg-black/[0.09]"}`}>Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-black text-white" style={{ background: `linear-gradient(135deg, ${GOLD}, #a07840)` }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editData ? "Enregistrer" : "Créer le type"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   VUE — Agenda (Phase 3)
───────────────────────────────────────────────────────── */
const HOUR_H   = 60;   // px per hour in time grid
const GRID_START = 7;  // 07:00
const GRID_END   = 20; // 20:00
const GRID_HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => i + GRID_START);

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eventsForDay(appointments: RdvAppointment[], d: Date): RdvAppointment[] {
  const iso = isoDay(d);
  return appointments.filter((a) => a.start_at.startsWith(iso) && a.status !== "cancelled");
}

function eventStyle(a: RdvAppointment): React.CSSProperties {
  const start = new Date(a.start_at);
  const end   = new Date(a.end_at);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin   = end.getHours()   * 60 + end.getMinutes();
  const top    = Math.max(0, (startMin - GRID_START * 60) / 60) * HOUR_H;
  const height = Math.max(20, (endMin - startMin) / 60 * HOUR_H - 2);
  return { top, height, left: 2, right: 2, position: "absolute" };
}

function timeFromClick(e: React.MouseEvent<HTMLDivElement>): string {
  const rect = e.currentTarget.getBoundingClientRect();
  const y    = e.clientY - rect.top;
  const totalMin = GRID_START * 60 + Math.round(y / HOUR_H * 60 / 30) * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(Math.min(h, GRID_END - 1)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function AgendaView({ appointments, isDark, onNewRdv, onEdit }: {
  appointments: RdvAppointment[];
  isDark: boolean;
  onNewRdv: (date?: string, time?: string) => void;
  onEdit: (a: RdvAppointment) => void;
}) {
  const today = new Date();
  const [calView,  setCalView]  = useState<"week" | "day" | "month">("week");
  const [offset,   setOffset]   = useState(0); // weeks/months/days offset from today
  const [focusDay, setFocusDay] = useState<Date | null>(null);

  const dp = {
    pri:    isDark ? "text-white"         : "text-[#0e1420]",
    sec:    isDark ? "text-white/50"      : "text-[#0e1420]/55",
    mut:    isDark ? "text-white/25"      : "text-[#0e1420]/30",
    border: isDark ? "border-white/[0.05]" : "border-black/[0.06]",
    hover:  isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.03]",
    cell:   isDark ? "bg-white/[0.02]"   : "bg-black/[0.02]",
  };

  /* ── Navigation ── */
  function navigate(dir: 1 | -1) {
    setOffset((o) => o + dir);
  }
  function goToday() {
    setOffset(0);
    setFocusDay(null);
  }

  /* ── Dates selon vue ── */
  const refDay = new Date(today);
  if (calView === "week") {
    refDay.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7); // lundi
  } else if (calView === "day") {
    const base = focusDay ?? today;
    refDay.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
    refDay.setDate(refDay.getDate() + offset);
  } else {
    refDay.setDate(1);
    refDay.setMonth(today.getMonth() + offset);
  }

  const weekDays = calView !== "month"
    ? Array.from({ length: calView === "week" ? 7 : 1 }, (_, i) => {
        const d = new Date(refDay);
        d.setDate(refDay.getDate() + i);
        return d;
      })
    : [];

  /* ── Label période ── */
  let periodLabel = "";
  if (calView === "week" && weekDays.length === 7) {
    const first = weekDays[0], last = weekDays[6];
    if (first.getMonth() === last.getMonth()) {
      periodLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(first);
    } else {
      periodLabel = `${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(first)} – ${new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(last)}`;
    }
  } else if (calView === "day" && weekDays.length === 1) {
    periodLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(weekDays[0]);
  } else {
    periodLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(refDay);
  }

  /* ── Grille temps (semaine / jour) ── */
  function TimeGrid() {
    const cols = weekDays.length;
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-[480px]">
          {/* Header jours */}
          <div className={`sticky top-0 z-10 grid border-b ${dp.border} ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}
            style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}>
            <div className={`border-r ${dp.border}`} />
            {weekDays.map((d) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={d.toISOString()} className={`border-r py-2 text-center last:border-r-0 ${dp.border}`}>
                  <p className={`text-[0.6rem] font-bold uppercase tracking-wider ${dp.mut}`}>{DAYS_SHORT[d.getDay()]}</p>
                  <button
                    onClick={() => { setFocusDay(d); setCalView("day"); setOffset(0); }}
                    className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold transition hover:opacity-80 ${isToday ? "text-white" : dp.pri}`}
                    style={isToday ? { background: GOLD } : {}}>
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Corps : time gutter + colonnes relatives */}
          <div className={`grid`} style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}>
            {/* Gutter horaire */}
            <div className={`border-r ${dp.border}`}>
              {GRID_HOURS.map((h) => (
                <div key={h} className={`border-b ${dp.border} flex items-start justify-end pr-1.5`}
                  style={{ height: HOUR_H }}>
                  <span className={`text-[0.55rem] -translate-y-2 ${dp.mut}`}>{h}:00</span>
                </div>
              ))}
            </div>

            {/* Colonnes jours */}
            {weekDays.map((d) => {
              const evts = eventsForDay(appointments, d);
              const totalH = GRID_HOURS.length * HOUR_H;
              return (
                <div key={d.toISOString()} className={`relative border-r last:border-r-0 ${dp.border} cursor-pointer ${dp.hover}`}
                  style={{ height: totalH }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-evt]")) return;
                    const t = timeFromClick(e);
                    onNewRdv(isoDay(d), t);
                  }}>
                  {/* Lignes horaires */}
                  {GRID_HOURS.map((h) => (
                    <div key={h} className={`absolute w-full border-b ${dp.border}`}
                      style={{ top: (h - GRID_START) * HOUR_H, height: HOUR_H }} />
                  ))}
                  {/* Ligne heure actuelle */}
                  {d.toDateString() === today.toDateString() && (() => {
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    const top = (nowMin - GRID_START * 60) / 60 * HOUR_H;
                    if (top < 0 || top > GRID_HOURS.length * HOUR_H) return null;
                    return (
                      <div className="absolute z-10 flex items-center" style={{ top, left: 0, right: 0 }}>
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                        <div className="flex-1 h-px" style={{ background: "#ef4444" }} />
                      </div>
                    );
                  })()}
                  {/* Événements */}
                  {evts.map((a) => {
                    const st = eventStyle(a);
                    const dur = Math.round((new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000);
                    const short = (st.height as number) < 36;
                    return (
                      <div key={a.id} data-evt="1"
                        className="rounded overflow-hidden px-1.5 py-0.5 cursor-pointer hover:brightness-110 transition-[filter] select-none"
                        style={{ ...st, background: (a.rdv_types?.color ?? GOLD) + "dd" }}
                        onClick={(e) => { e.stopPropagation(); onEdit(a); }}>
                        <p className="text-[0.62rem] font-bold text-white leading-tight truncate">
                          {fmtTime(a.start_at)}{!short && ` · ${a.client_name}`}
                        </p>
                        {!short && <p className="text-[0.58rem] text-white/70 truncate">{fmtDuration(dur)}</p>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Vue mois ── */
  function MonthGrid() {
    const year  = refDay.getFullYear();
    const month = refDay.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    // Start grid on Monday of week containing firstDay
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

    const cells: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= lastDay || cells.length % 7 !== 0) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
      if (cells.length > 42) break;
    }

    return (
      <div className="flex-1 overflow-auto p-3">
        {/* Jours semaine */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.slice(1).concat(DAYS_SHORT[0]).map((d) => (
            <div key={d} className={`text-center text-[0.6rem] font-bold uppercase py-1 ${dp.mut}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d) => {
            const evts   = eventsForDay(appointments, d);
            const isThisMonth = d.getMonth() === month;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={d.toISOString()}
                className={`rounded-xl p-1.5 min-h-[72px] cursor-pointer transition-colors border ${dp.border} ${dp.hover} ${!isThisMonth ? "opacity-30" : ""}`}
                onClick={() => { setFocusDay(d); setCalView("day"); setOffset(0); }}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold mx-auto ${isToday ? "text-white" : dp.pri}`}
                  style={isToday ? { background: GOLD } : {}}>
                  {d.getDate()}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {evts.slice(0, 2).map((a) => (
                    <div key={a.id} className="truncate rounded px-1 py-0 text-[0.55rem] font-semibold text-white"
                      style={{ background: a.rdv_types?.color ?? GOLD }}>
                      {fmtTime(a.start_at)} {a.client_name}
                    </div>
                  ))}
                  {evts.length > 2 && (
                    <p className={`text-[0.52rem] font-semibold pl-1 ${dp.sec}`}>+{evts.length - 2}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ── */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-2 ${isDark ? "border-white/[0.06]" : "border-black/[0.07]"}`}>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
            <ChevronLeft size={15} className={dp.sec} />
          </button>
          <button onClick={() => navigate(1)} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
            <ChevronRight size={15} className={dp.sec} />
          </button>
          <span className={`ml-1 text-[13px] font-semibold capitalize min-w-[180px] ${dp.pri}`}>{periodLabel}</span>
          {offset !== 0 && (
            <button onClick={goToday}
              className={`ml-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition ${isDark ? "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]" : "bg-black/[0.05] text-[#0e1420]/50 hover:bg-black/[0.08]"}`}>
              Aujourd'hui
            </button>
          )}
        </div>
        <div className={`flex gap-0.5 rounded-xl p-0.5 ${isDark ? "bg-white/[0.05]" : "bg-black/[0.05]"}`}>
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => { setCalView(v); setOffset(0); }}
              className="rounded-lg px-3 py-1 text-[11.5px] font-semibold transition-all"
              style={calView === v
                ? { background: GOLD, color: "#fff" }
                : { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {calView === "month" ? <MonthGrid /> : <TimeGrid />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Drawer de détail RDV (Phase 4)
───────────────────────────────────────────────────────── */
interface DrawerProps {
  rdv:      RdvAppointment | null;
  isDark:   boolean;
  onClose:  () => void;
  onEdit:   (a: RdvAppointment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: RdvStatus) => void;
  onLinkContact:  (rdvId: string, contact: Contact | null) => Promise<void>;
  onSaveNotes:    (rdvId: string, notes: string) => Promise<void>;
}

function RdvDetailDrawer({ rdv, isDark, onClose, onEdit, onDelete, onStatusChange, onLinkContact, onSaveNotes }: DrawerProps) {
  const [notes,       setNotes]       = useState(rdv?.internal_notes ?? "");
  const [notesDirty,  setNotesDirty]  = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [contacts,    setContacts]    = useState<Contact[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [linkMode,    setLinkMode]    = useState(false);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    setNotes(rdv?.internal_notes ?? "");
    setNotesDirty(false);
    setSearchQ("");
    setContacts([]);
    setLinkMode(false);
  }, [rdv?.id]);

  /* Search contacts */
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setContacts([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const q = searchQ.toLowerCase();
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, phone")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(6);
      setContacts((data as Contact[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  async function saveNotes() {
    if (!rdv || !notesDirty) return;
    setSavingNotes(true);
    await onSaveNotes(rdv.id, notes);
    setNotesDirty(false);
    setSavingNotes(false);
  }

  async function copyToken() {
    if (!rdv?.cancel_token) return;
    const url = `${window.location.origin}/book/cancel/${rdv.cancel_token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const dp = {
    bg:     isDark ? "bg-[#0a0b12]"          : "bg-white",
    border: isDark ? "border-white/[0.07]"   : "border-black/[0.08]",
    pri:    isDark ? "text-white"             : "text-[#0e1420]",
    sec:    isDark ? "text-white/50"          : "text-[#0e1420]/55",
    mut:    isDark ? "text-white/25"          : "text-[#0e1420]/30",
    lbl:    `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-[#0e1420]/35"}`,
    row:    isDark ? "border-white/[0.05]"   : "border-black/[0.06]",
    inset:  isDark ? "bg-white/[0.04]"       : "bg-black/[0.03]",
    input:  `w-full rounded-xl px-3 py-2 text-[12.5px] outline-none border transition-colors ${isDark ? "bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 focus:border-[#c9a55a]/50" : "bg-black/[0.03] border-black/[0.08] text-[#0e1420] placeholder:text-[#0e1420]/30 focus:border-[#c9a55a]/50"}`,
  };

  const dur = rdv
    ? Math.round((new Date(rdv.end_at).getTime() - new Date(rdv.start_at).getTime()) / 60000)
    : 0;

  const acColor = rdv ? avatarColor(rdv.client_name) : GOLD;

  const QUICK_STATUS: { s: RdvStatus; label: string; color: string }[] = [
    { s: "confirmed",  label: "Confirmer",  color: "#10b981" },
    { s: "completed",  label: "Terminé",    color: "#6366f1" },
    { s: "no_show",    label: "Absent",     color: "#94a3b8" },
    { s: "cancelled",  label: "Annuler",    color: "#ef4444" },
  ];

  return (
    <AnimatePresence>
      {rdv && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className={`fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-sm border-l shadow-2xl ${dp.bg} ${dp.border}`}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}>

            {/* Header */}
            <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${dp.row}`}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-black text-white"
                  style={{ background: acColor }}>
                  {initials(rdv.client_name)}
                </div>
                <div>
                  <p className={`font-bold text-[13.5px] leading-tight ${dp.pri}`}>{rdv.client_name}</p>
                  <p className={`text-[11px] ${dp.sec}`}>{rdv.client_company || rdv.client_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(rdv)} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
                  <Pencil size={14} className={dp.sec} />
                </button>
                <button onClick={onClose} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
                  <X size={14} className={dp.sec} />
                </button>
              </div>
            </div>

            {/* Scroll content */}
            <div className="flex-1 overflow-y-auto">
              {/* Statut + changement rapide */}
              <div className={`border-b px-4 py-3 ${dp.row}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className={dp.lbl}>Statut</p>
                  <StatusBadge status={rdv.status} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_STATUS.filter((q) => q.s !== rdv.status).map(({ s, label, color }) => (
                    <button key={s}
                      onClick={() => onStatusChange(rdv.id, s)}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-all hover:opacity-80"
                      style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & heure */}
              <div className={`border-b px-4 py-3 space-y-2 ${dp.row}`}>
                <p className={dp.lbl}>Rendez-vous</p>
                <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${dp.inset}`}>
                  <CalendarDays size={14} style={{ color: GOLD }} />
                  <div>
                    <p className={`text-[12.5px] font-semibold ${dp.pri}`}>{fmtDate(rdv.start_at)}</p>
                    <p className={`text-[11px] ${dp.sec}`}>{fmtTime(rdv.start_at)} · {fmtDuration(dur)}</p>
                  </div>
                </div>
                {rdv.rdv_types && (
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${dp.inset}`}>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: rdv.rdv_types.color }} />
                    <span className={`text-[12px] font-semibold ${dp.pri}`}>{rdv.rdv_types.name}</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className={`border-b px-4 py-3 space-y-2 ${dp.row}`}>
                <div className="flex items-center justify-between">
                  <p className={dp.lbl}>Contact</p>
                  <button onClick={() => setLinkMode(!linkMode)}
                    className={`text-[10.5px] font-semibold transition ${isDark ? "text-white/40 hover:text-white/70" : "text-[#0e1420]/40 hover:text-[#0e1420]/70"}`}>
                    {rdv.contacts ? "Changer" : linkMode ? "Annuler" : "+ Lier au CRM"}
                  </button>
                </div>

                {rdv.contacts && !linkMode ? (
                  <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${dp.inset}`}>
                    <div className="flex items-center gap-2">
                      <User size={13} className={dp.sec} />
                      <div>
                        <p className={`text-[12px] font-semibold ${dp.pri}`}>{rdv.contacts.first_name} {rdv.contacts.last_name}</p>
                        <p className={`text-[10.5px] ${dp.sec}`}>{rdv.contacts.email}</p>
                      </div>
                    </div>
                    <button onClick={() => onLinkContact(rdv.id, null)} className="text-[10px] text-red-400 hover:text-red-500 transition">Délier</button>
                  </div>
                ) : linkMode ? (
                  <div>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 mb-1.5 ${isDark ? "bg-white/[0.04] border-white/[0.09]" : "bg-white border-black/[0.09]"}`}>
                      <Search size={12} className={dp.sec} />
                      <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} autoFocus
                        placeholder="Nom, email…"
                        className={`flex-1 bg-transparent text-[12px] outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-[#0e1420] placeholder:text-[#0e1420]/30"}`} />
                      {searching && <Loader2 size={11} className="animate-spin shrink-0" style={{ color: GOLD }} />}
                    </div>
                    {contacts.length > 0 && (
                      <div className={`rounded-xl border overflow-hidden ${dp.border}`}>
                        {contacts.map((c) => (
                          <button key={c.id}
                            onClick={() => { onLinkContact(rdv.id, c); setLinkMode(false); setSearchQ(""); setContacts([]); }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition border-b last:border-b-0 ${dp.row} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.03]"}`}>
                            <User size={12} className={dp.sec} />
                            <span className={`font-semibold ${dp.pri}`}>{c.first_name} {c.last_name}</span>
                            <span className={`ml-auto text-[10.5px] ${dp.sec}`}>{c.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQ.length >= 2 && !searching && contacts.length === 0 && (
                      <p className={`text-[11px] text-center py-2 ${dp.mut}`}>Aucun contact trouvé</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {rdv.client_email && (
                      <a href={`mailto:${rdv.client_email}`} className={`flex items-center gap-2 text-[12px] ${dp.sec} hover:underline`}>
                        <Mail size={12} className="shrink-0" />{rdv.client_email}
                      </a>
                    )}
                    {rdv.client_phone && (
                      <a href={`tel:${rdv.client_phone}`} className={`flex items-center gap-2 text-[12px] ${dp.sec} hover:underline`}>
                        <Phone size={12} className="shrink-0" />{rdv.client_phone}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Notes client (lecture seule) */}
              {rdv.client_notes && (
                <div className={`border-b px-4 py-3 ${dp.row}`}>
                  <p className={`${dp.lbl} mb-2`}>Note du client</p>
                  <p className={`text-[12.5px] leading-relaxed ${dp.sec}`}>{rdv.client_notes}</p>
                </div>
              )}

              {/* Notes internes (éditable) */}
              <div className={`border-b px-4 py-3 ${dp.row}`}>
                <p className={`${dp.lbl} mb-2`}>Notes internes</p>
                <textarea
                  className={`${dp.input} resize-none`}
                  rows={3}
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                  placeholder="Visible uniquement par votre équipe…"
                />
                {notesDirty && (
                  <button onClick={saveNotes} disabled={savingNotes}
                    className="mt-1.5 flex items-center gap-1 rounded-lg px-3 py-1 text-[11.5px] font-bold text-white transition"
                    style={{ background: GOLD }}>
                    {savingNotes ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Enregistrer
                  </button>
                )}
              </div>

              {/* Tokens publics */}
              <div className={`border-b px-4 py-3 ${dp.row}`}>
                <p className={`${dp.lbl} mb-2`}>Lien d'annulation</p>
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-black/[0.03] border-black/[0.08]"}`}>
                  <span className={`flex-1 truncate text-[11px] font-mono ${dp.sec}`}>
                    /book/cancel/{rdv.cancel_token?.slice(0, 8)}…
                  </span>
                  <button onClick={copyToken}
                    className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold transition-all"
                    style={{ color: copied ? "#10b981" : GOLD }}>
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>

              {/* Méta */}
              <div className={`px-4 py-3 space-y-1 ${dp.row}`}>
                <div className={`flex justify-between text-[11px] ${dp.sec}`}>
                  <span>Source</span>
                  <span className="capitalize font-semibold">{rdv.source}</span>
                </div>
                <div className={`flex justify-between text-[11px] ${dp.sec}`}>
                  <span>Créé le</span>
                  <span className="font-semibold">{fmtDate(rdv.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className={`shrink-0 flex items-center justify-between gap-2 border-t px-4 py-3 ${dp.row}`}>
              <button onClick={() => onDelete(rdv.id)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-red-400 transition hover:bg-red-400/10">
                <Trash2 size={13} />Supprimer
              </button>
              <button onClick={() => onEdit(rdv)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-black text-white"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #a07840)` }}>
                <Pencil size={13} />Modifier
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   VUE — Liste des rendez-vous
───────────────────────────────────────────────────────── */
type ListFilter = "upcoming" | "today" | "past" | "cancelled" | "all";

function ListeView({ appointments, staff, isDark, onEdit, onDelete, onStatusChange, onSelect, loading }: {
  appointments: RdvAppointment[];
  staff: StaffMember[];
  isDark: boolean;
  onEdit:  (a: RdvAppointment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: RdvStatus) => void;
  onSelect: (a: RdvAppointment) => void;
  loading: boolean;
}) {
  const [filter,       setFilter]       = useState<ListFilter>("upcoming");
  const [search,       setSearch]       = useState("");
  const [staffFilter,  setStaffFilter]  = useState<string>("");
  const [menuId,       setMenuId]       = useState<string | null>(null);

  const now = new Date();

  const filtered = appointments.filter((a) => {
    const start = new Date(a.start_at);
    const matchFilter = filter === "all"
      ? true
      : filter === "upcoming"
      ? start > now && a.status !== "cancelled"
      : filter === "today"
      ? start.toDateString() === now.toDateString()
      : filter === "past"
      ? start < now && a.status !== "cancelled"
      : a.status === "cancelled";

    const q = search.toLowerCase();
    const matchSearch = !q || [a.client_name, a.client_email, a.client_company].some((v) => v.toLowerCase().includes(q));

    const matchStaff = !staffFilter
      ? true
      : staffFilter === "__none__"
      ? !a.assigned_staff_id
      : a.assigned_staff_id === staffFilter;

    return matchFilter && matchSearch && matchStaff;
  });

  const dp = {
    pri:  isDark ? "text-white"          : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"       : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/25"       : "text-[#0e1420]/30",
    row:  isDark ? "hover:bg-white/[0.025]" : "hover:bg-black/[0.025]",
    div:  isDark ? "divide-white/[0.05]" : "divide-black/[0.06]",
    head: isDark ? "bg-white/[0.02]"     : "bg-black/[0.02]",
    border: isDark ? "border-white/[0.07]" : "border-black/[0.07]",
  };

  const FILTERS: { key: ListFilter; label: string }[] = [
    { key: "upcoming",  label: "À venir"    },
    { key: "today",     label: "Aujourd'hui" },
    { key: "past",      label: "Passés"     },
    { key: "cancelled", label: "Annulés"    },
    { key: "all",       label: "Tous"       },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filtres + recherche */}
      <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-2 shrink-0 ${isDark ? "border-white/[0.06]" : "border-black/[0.07]"}`}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all"
              style={filter === f.key
                ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }
              }>{f.label}</button>
          ))}
        </div>
        {staff.length > 0 && (
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className={`rounded-xl border px-2.5 py-1.5 text-[11.5px] font-semibold outline-none transition ${isDark ? "bg-white/[0.04] border-white/[0.09] text-white/60" : "bg-white border-black/[0.09] text-[#0e1420]/70"}`}
          >
            <option value="">Tous les membres</option>
            <option value="__none__">Non assignés</option>
            {staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <div className={`ml-auto flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] ${isDark ? "bg-white/[0.04] border-white/[0.09]" : "bg-white border-black/[0.09]"}`}>
          <Search size={13} className={isDark ? "text-white/30" : "text-[#0e1420]/30"} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email, entreprise…"
            className={`w-40 bg-transparent outline-none text-[12px] ${isDark ? "text-white placeholder:text-white/25" : "text-[#0e1420] placeholder:text-[#0e1420]/30"}`} />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun rendez-vous"
            description={search ? "Aucun résultat pour cette recherche." : "Créez votre premier rendez-vous."}
          />
        ) : (
          <table className="w-full min-w-[700px] border-collapse text-[12.5px]">
            <thead>
              <tr className={`border-b text-left ${dp.head} ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                {["Client", "Type", "Date", "Heure", "Durée", "Statut", ""].map((h) => (
                  <th key={h} className={`px-4 py-2.5 font-semibold ${dp.mut}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dp.div}`}>
              {filtered.map((a) => {
                const dur = a.rdv_types?.duration_minutes ?? Math.round((new Date(a.end_at).getTime() - new Date(a.start_at).getTime()) / 60000);
                const acColor = avatarColor(a.client_name);
                return (
                  <tr key={a.id} onClick={() => onSelect(a)} className={`transition-colors cursor-pointer ${dp.row}`}>
                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black text-white"
                          style={{ background: acColor }}>
                          {initials(a.client_name)}
                        </div>
                        <div>
                          <p className={`font-semibold ${dp.pri}`}>{a.client_name}</p>
                          {a.client_company && <p className={`text-[11px] ${dp.sec}`}>{a.client_company}</p>}
                          {a.team_members && (
                            <p className="mt-0.5 flex items-center gap-1 text-[10px]" style={{ color: a.team_members.avatar_color }}>
                              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: a.team_members.avatar_color }} />
                              {a.team_members.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      {a.rdv_types ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ background: `${a.rdv_types.color}18`, color: a.rdv_types.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.rdv_types.color }} />
                          {a.rdv_types.name}
                        </span>
                      ) : <span className={dp.mut}>—</span>}
                    </td>
                    {/* Date */}
                    <td className={`px-4 py-3 ${dp.pri}`}>{fmtDate(a.start_at)}</td>
                    {/* Heure */}
                    <td className={`px-4 py-3 font-semibold ${dp.pri}`}>{fmtTime(a.start_at)}</td>
                    {/* Durée */}
                    <td className={`px-4 py-3 ${dp.sec}`}>{fmtDuration(dur)}</td>
                    {/* Statut */}
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === a.id ? null : a.id); }}
                          className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
                          <MoreVertical size={14} className={dp.sec} />
                        </button>
                        <AnimatePresence>
                          {menuId === a.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className={`absolute right-0 top-8 z-20 w-44 rounded-xl border shadow-xl py-1 ${isDark ? "bg-[#0f1117] border-white/[0.1]" : "bg-white border-black/[0.09]"}`}
                            >
                              <button onClick={() => { onEdit(a); setMenuId(null); }} className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] transition ${isDark ? "hover:bg-white/[0.06] text-white/70" : "hover:bg-black/[0.04] text-[#0e1420]/70"}`}><Pencil size={13} />Modifier</button>
                              {a.status === "pending" && <button onClick={() => { onStatusChange(a.id, "confirmed"); setMenuId(null); }} className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] transition ${isDark ? "hover:bg-white/[0.06] text-white/70" : "hover:bg-black/[0.04] text-[#0e1420]/70"}`}><CheckCircle2 size={13} />Confirmer</button>}
                              {a.status !== "cancelled" && a.status !== "completed" && <button onClick={() => { onStatusChange(a.id, "cancelled"); setMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-red-400 transition hover:bg-red-400/10"><XCircle size={13} />Annuler</button>}
                              <div className={`my-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"}`} />
                              <button onClick={() => { onDelete(a.id); setMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-red-500 transition hover:bg-red-500/10"><Trash2 size={13} />Supprimer</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VUE — Types de rendez-vous
───────────────────────────────────────────────────────── */
function TypesView({ types, isDark, onEdit, onDelete, onToggle, loading }: {
  types:    RdvType[];
  isDark:   boolean;
  onEdit:   (t: RdvType) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  loading:  boolean;
}) {
  const dp = {
    pri:  isDark ? "text-white"       : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"    : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/25"    : "text-[#0e1420]/30",
    card: isDark ? "border-white/[0.07] bg-white/[0.025]" : "border-black/[0.07] bg-white shadow-sm",
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12"><Loader2 size={24} className="animate-spin" style={{ color: GOLD }} /></div>
  );

  return (
    <div className="p-4 sm:p-6">
      {types.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Aucun type de rendez-vous"
          description="Créez vos premiers types pour structurer vos disponibilités."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => {
            const { Icon } = LOC_META[t.location_type];
            return (
              <motion.div key={t.id} layout
                className={`rounded-2xl border p-4 transition-opacity ${dp.card} ${!t.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: t.color }} />
                    <div>
                      <p className={`font-bold text-[13.5px] ${dp.pri}`}>{t.name}</p>
                      {t.description && <p className={`text-[11.5px] ${dp.sec} mt-0.5 line-clamp-1`}>{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit(t)} className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.06]"}`}><Pencil size={13} className={dp.sec} /></button>
                    <button onClick={() => onDelete(t.id)} className="rounded-lg p-1.5 transition hover:bg-red-500/10"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>

                <div className={`mt-3 flex flex-wrap gap-1.5 text-[11px] ${dp.sec}`}>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.05]"}`}>
                    <Clock size={10} />{fmtDuration(t.duration_minutes)}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.05]"}`}>
                    <Icon size={10} />{LOC_META[t.location_type].label}
                  </span>
                  {t.buffer_after_min > 0 && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.05]"}`}>
                      <Timer size={10} />+{t.buffer_after_min} min
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2 text-[11px]">
                    {t.auto_confirm && <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} />Auto-confirmation</span>}
                    {!t.is_public && <span className={`inline-flex items-center gap-1 ${dp.mut}`}><EyeOff size={11} />Privé</span>}
                  </div>
                  <button onClick={() => onToggle(t.id, !t.is_active)}
                    className="text-[11px] font-semibold transition"
                    style={{ color: t.is_active ? GOLD : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    {t.is_active ? "Actif" : "Inactif"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   VUE — Disponibilités
───────────────────────────────────────────────────────── */
function DisponibilitesView({ slots, isDark, onAdd, onDelete, loading }: {
  slots:    AvailSlot[];
  isDark:   boolean;
  onAdd:    (day: number, start: string, end: string) => Promise<void>;
  onDelete: (id: string) => void;
  loading:  boolean;
}) {
  const [addingDay, setAddingDay]   = useState<number | null>(null);
  const [newSlot, setNewSlot]       = useState({ start: "09:00", end: "17:00" });
  const [saving, setSaving]         = useState(false);

  const dp = {
    pri:  isDark ? "text-white"       : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"    : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/25"    : "text-[#0e1420]/30",
    card: isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-black/[0.07] bg-white shadow-sm",
    input:`rounded-lg px-2 py-1 text-[12px] border outline-none transition ${isDark ? "bg-white/[0.06] border-white/[0.1] text-white" : "bg-black/[0.04] border-black/[0.09] text-[#0e1420]"}`,
  };

  async function handleAdd(day: number) {
    setSaving(true);
    await onAdd(day, newSlot.start, newSlot.end);
    setAddingDay(null);
    setSaving(false);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className={`mb-4 rounded-2xl border p-4 ${dp.card}`}>
        <p className={`text-[0.62rem] font-bold uppercase tracking-widest ${dp.mut}`}>Fuseau horaire</p>
        <p className={`mt-1 text-[13px] font-semibold ${dp.pri}`}>Indian/Mayotte (UTC+3)</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8"><Loader2 size={20} className="animate-spin" style={{ color: GOLD }} /></div>
      ) : (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const daySlots = slots.filter((s) => s.day_of_week === day);
            const isAdding = addingDay === day;
            return (
              <div key={day} className={`rounded-2xl border p-3 ${dp.card}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-[13px] font-bold ${dp.pri}`}>{DAYS_FR[day]}</p>
                  {daySlots.length === 0 && !isAdding && (
                    <p className={`text-[11.5px] ${dp.mut}`}>Indisponible</p>
                  )}
                  <button onClick={() => setAddingDay(isAdding ? null : day)}
                    className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${isDark ? "hover:bg-white/[0.07] text-white/50" : "hover:bg-black/[0.05] text-[#0e1420]/50"}`}>
                    {isAdding ? "Annuler" : "+ Plage"}
                  </button>
                </div>

                {daySlots.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {daySlots.map((sl) => (
                      <div key={sl.id} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ${isDark ? "bg-white/[0.07]" : "bg-black/[0.05]"}`} style={{ color: GOLD }}>
                        <Clock size={10} />{sl.start_time.slice(0, 5)} – {sl.end_time.slice(0, 5)}
                        <button onClick={() => onDelete(sl.id)} className="ml-0.5 opacity-50 hover:opacity-100 transition"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {isAdding && (
                  <div className="mt-3 flex items-center gap-2">
                    <input type="time" className={dp.input} value={newSlot.start} onChange={(e) => setNewSlot((n) => ({ ...n, start: e.target.value }))} />
                    <span className={dp.mut}>–</span>
                    <input type="time" className={dp.input} value={newSlot.end} onChange={(e) => setNewSlot((n) => ({ ...n, end: e.target.value }))} />
                    <button onClick={() => handleAdd(day)} disabled={saving}
                      className="flex items-center gap-1 rounded-lg px-3 py-1 text-[12px] font-bold text-white"
                      style={{ background: GOLD }}>
                      {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      Ajouter
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

/* ─────────────────────────────────────────────────────────
   VUE — Page publique
───────────────────────────────────────────────────────── */
function PagePubView({ bookingPage, isDark, types, onSave }: {
  bookingPage: BookingPage | null;
  isDark: boolean;
  types: RdvType[];
  onSave: (data: Partial<BookingPage>) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<BookingPage>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bookingPage) setForm({ page_title: bookingPage.page_title, page_description: bookingPage.page_description, accent_color: bookingPage.accent_color });
  }, [bookingPage]);

  const url = bookingPage ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${bookingPage.token}` : null;

  async function copyLink() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setEditing(false);
  }

  const dp = {
    pri:  isDark ? "text-white"       : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"    : "text-[#0e1420]/55",
    card: isDark ? "border-white/[0.07] bg-white/[0.025]" : "border-black/[0.07] bg-white shadow-sm",
    input:`w-full rounded-xl px-3 py-2 text-[13px] outline-none border transition-colors ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-[#0e1420]"}`,
    lbl:  `block mb-1 text-[0.68rem] font-semibold uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#0e1420]/45"}`,
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-5">
      {/* Lien de réservation */}
      <div className={`rounded-2xl border p-5 ${dp.card}`}>
        <p className={`text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>Lien de réservation</p>
        {url ? (
          <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-black/[0.03] border-black/[0.08]"}`}>
            <Globe size={13} style={{ color: GOLD }} className="shrink-0" />
            <span className={`flex-1 truncate text-[12px] font-mono ${dp.sec}`}>{url}</span>
            <button onClick={copyLink}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-bold transition-all"
              style={{ background: copied ? "rgba(16,185,129,0.15)" : `${GOLD}18`, color: copied ? "#10b981" : GOLD }}>
              {copied ? <><Check size={11} />Copié</> : <><Copy size={11} />Copier</>}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
              <ExternalLink size={13} className={dp.sec} />
            </a>
          </div>
        ) : (
          <p className={`mt-2 text-sm ${dp.sec}`}>La page sera générée automatiquement à la première sauvegarde.</p>
        )}
      </div>

      {/* Configuration */}
      <div className={`rounded-2xl border p-5 ${dp.card}`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>Configuration de la page</p>
          <button onClick={() => setEditing(!editing)}
            className={`rounded-lg px-3 py-1 text-[11.5px] font-semibold transition ${isDark ? "bg-white/[0.06] text-white/60 hover:bg-white/[0.1]" : "bg-black/[0.06] text-[#0e1420]/60 hover:bg-black/[0.09]"}`}>
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className={dp.lbl}>Titre de la page</label>
              <input className={dp.input} value={form.page_title ?? ""} onChange={(e) => setForm((f) => ({ ...f, page_title: e.target.value }))} />
            </div>
            <div>
              <label className={dp.lbl}>Description</label>
              <textarea className={`${dp.input} resize-none`} rows={3} value={form.page_description ?? ""} onChange={(e) => setForm((f) => ({ ...f, page_description: e.target.value }))} />
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-black text-white" style={{ background: `linear-gradient(135deg, ${GOLD}, #a07840)` }}>
              {saving && <Loader2 size={14} className="animate-spin" />}Enregistrer
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className={`text-sm font-semibold ${dp.pri}`}>{bookingPage?.page_title ?? "Prendre un rendez-vous"}</p>
            {bookingPage?.page_description && <p className={`text-[12.5px] ${dp.sec}`}>{bookingPage.page_description}</p>}
          </div>
        )}
      </div>

      {/* Types publics */}
      <div className={`rounded-2xl border p-5 ${dp.card}`}>
        <p className={`mb-3 text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>Types visibles sur la page</p>
        {types.filter((t) => t.is_public && t.is_active).length === 0 ? (
          <p className={`text-[12.5px] ${dp.sec}`}>Aucun type public actif. Activez "Visible sur la page publique" dans vos types.</p>
        ) : (
          <div className="space-y-2">
            {types.filter((t) => t.is_public && t.is_active).map((t) => (
              <div key={t.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${isDark ? "bg-white/[0.04]" : "bg-black/[0.03]"}`}>
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                <span className={`flex-1 text-[12.5px] font-semibold ${dp.pri}`}>{t.name}</span>
                <span className={`text-[11.5px] ${dp.sec}`}>{fmtDuration(t.duration_minutes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STATS RDV — Phase 16
───────────────────────────────────────────────────────── */
type StatPeriod = "7j" | "30j" | "mois" | "tout";

function StatsView({
  appointments,
  types,
  isDark,
}: {
  appointments: RdvAppointment[];
  types: RdvType[];
  isDark: boolean;
}) {
  const [period, setPeriod] = useState<StatPeriod>("30j");

  const dp = isDark
    ? { card: "#2c2c2e", border: "rgba(255,255,255,0.08)", text: "#f5f5f7", sec: "#a1a1aa", mut: "#6b7280", seg: "#3a3a3c" }
    : { card: "#ffffff",  border: "#e5e7eb",               text: "#111827", sec: "#6b7280", mut: "#9ca3af", seg: "#f3f4f6" };

  // ── Filtrage par période ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const now  = new Date();
    const cuts: Record<StatPeriod, Date | null> = {
      "7j":   new Date(now.getTime() - 7  * 86400_000),
      "30j":  new Date(now.getTime() - 30 * 86400_000),
      "mois": new Date(now.getFullYear(), now.getMonth(), 1),
      "tout": null,
    };
    const cut = cuts[period];
    return cut
      ? appointments.filter(a => new Date(a.start_at) >= cut)
      : appointments;
  }, [appointments, period]);

  // ── KPI ──────────────────────────────────────────────────────────
  const total      = filtered.length;
  const confirmed  = filtered.filter(a => a.status === "confirmed").length;
  const cancelled  = filtered.filter(a => a.status === "cancelled").length;
  const noShow     = filtered.filter(a => a.status === "no_show").length;
  const completed  = filtered.filter(a => a.status === "completed").length;
  const pending    = filtered.filter(a => a.status === "pending").length;
  const paidCount  = filtered.filter(a => (a as RdvAppointment & { payment_status?: string }).payment_status === "paid").length;
  const confRate   = total > 0 ? Math.round((confirmed + completed) / total * 100) : 0;
  const noShowRate = total > 0 ? Math.round(noShow / total * 100) : 0;

  // ── Par type ─────────────────────────────────────────────────────
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(a => {
      const name = a.rdv_types?.name ?? "Sans type";
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filtered]);

  // ── Par source ───────────────────────────────────────────────────
  const publicCount   = filtered.filter(a => a.source === "public").length;
  const internalCount = filtered.filter(a => a.source !== "public").length;

  // ── Évolution 30 jours ───────────────────────────────────────────
  const sparkData = useMemo(() => {
    const days = 30;
    const now  = new Date();
    const counts: number[] = Array(days).fill(0);
    appointments.forEach(a => {
      const diff = Math.floor((now.getTime() - new Date(a.start_at).getTime()) / 86400_000);
      if (diff >= 0 && diff < days) counts[days - 1 - diff]++;
    });
    return counts;
  }, [appointments]);

  const sparkMax = Math.max(...sparkData, 1);
  const W = 300, H = 56;
  const pts = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * W;
    const y = H - (v / sparkMax) * (H - 6);
    return `${x},${y}`;
  }).join(" ");

  const PERIOD_OPTS: { key: StatPeriod; label: string }[] = [
    { key: "7j",   label: "7 jours" },
    { key: "30j",  label: "30 jours" },
    { key: "mois", label: "Ce mois" },
    { key: "tout", label: "Tout" },
  ];

  function KpiTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
    return (
      <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: accent ?? dp.text, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 11, color: dp.sec }}>{sub}</span>}
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Sélecteur période */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PERIOD_OPTS.map(o => (
          <button
            key={o.key}
            onClick={() => setPeriod(o.key)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${period === o.key ? GOLD : dp.border}`,
              background: period === o.key ? `${GOLD}18` : "transparent",
              color: period === o.key ? GOLD : dp.sec,
              cursor: "pointer",
            }}
          >{o.label}</button>
        ))}
        {total > 0 && <span style={{ marginLeft: "auto", fontSize: 12, color: dp.sec, alignSelf: "center" }}>{total} rendez-vous</span>}
      </div>

      {/* KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        <KpiTile label="Total" value={total} />
        <KpiTile label="Confirmés" value={confirmed + completed} sub={`${confRate}% du total`} accent="#10b981" />
        <KpiTile label="Annulés" value={cancelled} sub={total > 0 ? `${Math.round(cancelled/total*100)}%` : "—"} accent="#ef4444" />
        <KpiTile label="No-shows" value={noShow} sub={`${noShowRate}% du total`} accent="#94a3b8" />
        {paidCount > 0 && <KpiTile label="Paiements" value={paidCount} sub="confirmés Stripe" accent={GOLD} />}
        {pending > 0 && <KpiTile label="En attente" value={pending} accent="#f59e0b" />}
      </div>

      {/* Répartition par statut */}
      {total > 0 && (
        <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Répartition par statut</p>
          <div style={{ display: "flex", height: 10, borderRadius: 9999, overflow: "hidden", gap: 2, marginBottom: 12 }}>
            {([
              { key: "confirmed",  count: confirmed,                   color: "#10b981" },
              { key: "completed",  count: completed,                   color: "#6366f1" },
              { key: "pending",    count: pending,                     color: "#f59e0b" },
              { key: "cancelled",  count: cancelled,                   color: "#ef4444" },
              { key: "no_show",    count: noShow,                      color: "#94a3b8" },
            ] as { key: string; count: number; color: string }[]).filter(s => s.count > 0).map(s => (
              <div key={s.key} style={{ flex: s.count, background: s.color, minWidth: 2 }} title={`${s.count}`} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
            {[
              { label: "Confirmé",  count: confirmed,  color: "#10b981" },
              { label: "Terminé",   count: completed,  color: "#6366f1" },
              { label: "En attente",count: pending,    color: "#f59e0b" },
              { label: "Annulé",    count: cancelled,  color: "#ef4444" },
              { label: "No-show",   count: noShow,     color: "#94a3b8" },
            ].filter(s => s.count > 0).map(s => (
              <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: dp.sec }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: s.color, display: "inline-block", flexShrink: 0 }} />
                {s.label} — {s.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Par type de RDV */}
      {byType.length > 0 && (
        <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Par type de rendez-vous</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byType.map(([name, count]) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: dp.text, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{name}</span>
                  <span style={{ fontSize: 12, color: dp.sec, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{count} · {total > 0 ? Math.round(count/total*100) : 0}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: dp.seg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total > 0 ? (count/total*100) : 0}%`, background: GOLD, borderRadius: 9999, transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Évolution 30 jours + Source */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "stretch" }}>
        {/* Sparkline 30j */}
        <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Évolution — 30 derniers jours</p>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block", overflow: "visible" }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
                <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={pts}
              fill="none"
              stroke={GOLD}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polygon
              points={`0,${H} ${pts} ${W},${H}`}
              fill="url(#sparkGrad)"
            />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: dp.mut, marginTop: 4 }}>
            <span>J-30</span><span>Aujourd'hui</span>
          </div>
        </div>

        {/* Source */}
        <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px", minWidth: 130 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Source</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Public",  count: publicCount,   color: GOLD },
              { label: "Interne", count: internalCount, color: "#6366f1" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</span>
                <span style={{ fontSize: 11, color: dp.sec }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Types configurés */}
      {types.length > 0 && (
        <div style={{ background: dp.card, border: `1px solid ${dp.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: dp.mut, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Types configurés ({types.length})</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {types.map(t => (
              <span key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, background: dp.seg, color: dp.text }}>
                <span style={{ width: 7, height: 7, borderRadius: 9999, background: t.color, flexShrink: 0 }} />
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ASSISTANT IA RDV
───────────────────────────────────────────────────────── */
interface AiMessage { role: "user" | "assistant"; content: string }
interface AiContext {
  today_date:         string;
  today_appointments: { client_name: string; start_time: string; type_name: string; status: string }[];
  upcoming_count:     number;
  types:              { name: string; duration_minutes: number }[];
}

function RdvAIPanel({
  isDark,
  context,
  onClose,
}: {
  isDark: boolean;
  context: AiContext;
  onClose: () => void;
}) {
  const dp = isDark
    ? { bg: "#1c1c1e", card: "#2c2c2e", border: "rgba(255,255,255,0.08)", text: "#f5f5f7", sec: "#a1a1aa", inp: "#3a3a3c" }
    : { bg: "#f3f4f6", card: "#ffffff", border: "#e5e7eb",               text: "#111827", sec: "#6b7280", inp: "#f9fafb"  };

  const SUGGESTED = [
    "Quelle est ma journée aujourd'hui ?",
    "Rédige un rappel pour mon prochain client",
    "Suggère une description pour un nouveau type de RDV",
    "Combien de rendez-vous ai-je cette semaine ?",
  ];

  const [messages,  setMessages]  = useState<AiMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: AiMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/rdv/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });
      const data = await r.json();
      setMessages(m => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Erreur." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Problème réseau. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", right: 0, bottom: 0, top: 0,
      width: "min(380px, 100vw)",
      background: dp.bg, borderLeft: `1px solid ${dp.border}`,
      display: "flex", flexDirection: "column",
      zIndex: 60, boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${dp.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={16} color={GOLD} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: dp.text }}>Assistant IA — RDV</div>
          <div style={{ fontSize: 11, color: dp.sec }}>Powered by Claude Haiku</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: dp.sec, display: "flex", padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: dp.sec, margin: "0 0 4px" }}>Suggestions :</p>
            {SUGGESTED.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 12,
                  background: dp.card, border: `1px solid ${dp.border}`,
                  color: dp.text, textAlign: "left", cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              padding: "9px 12px",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: m.role === "user" ? GOLD : dp.card,
              border: m.role === "assistant" ? `1px solid ${dp.border}` : "none",
              color: m.role === "user" ? "white" : dp.text,
              fontSize: 13, lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: "12px 12px 12px 2px", background: dp.card, border: `1px solid ${dp.border}` }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite", color: GOLD }} />
            <span style={{ fontSize: 12, color: dp.sec }}>En train de répondre…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${dp.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Posez une question sur vos RDV…"
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 13,
            background: dp.inp, border: `1px solid ${dp.border}`,
            color: dp.text, outline: "none", fontFamily: "inherit",
          }}
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            padding: "9px 12px", borderRadius: 8, border: "none",
            background: input.trim() && !loading ? GOLD : dp.border,
            color: input.trim() && !loading ? "white" : dp.sec,
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex", alignItems: "center", transition: "background 0.15s",
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function RendezVousPage() {
  const { isDark } = useTheme();
  const orgState   = useOrganization();
  const { toasts, add: _toastAdd, remove: dismiss } = useToastStack();
  const pushToast = ({ type, message }: { type: ToastType; message: string }) =>
    _toastAdd(message, type);

  const [tab,          setTab]          = useState<AppTab>("liste");
  const [appointments, setAppointments] = useState<RdvAppointment[]>([]);
  const [types,        setTypes]        = useState<RdvType[]>([]);
  const [showAI,       setShowAI]       = useState(false);
  const [pushEnabled,  setPushEnabled]  = useState(false);
  const [pushLoading,  setPushLoading]  = useState(false);
  const [slots,        setSlots]        = useState<AvailSlot[]>([]);
  const [bookingPage,  setBookingPage]  = useState<BookingPage | null>(null);
  const [staff,        setStaff]        = useState<StaffMember[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [showNewRdv,   setShowNewRdv]   = useState(false);
  const [showNewType,  setShowNewType]  = useState(false);
  const [editRdv,      setEditRdv]      = useState<RdvAppointment | null>(null);
  const [editType,     setEditType]     = useState<RdvType | null>(null);
  const [prefilledDate,  setPrefilledDate]  = useState<string | undefined>();
  const [prefilledTime,  setPrefilledTime]  = useState<string | undefined>();
  const [selectedRdv,    setSelectedRdv]    = useState<RdvAppointment | null>(null);

  const userId = (orgState as { status: string; org?: { id: string } }).status === "ready"
    ? undefined
    : undefined;

  /* ── Fetch appointments ── */
  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    const { data, error } = await supabase
      .from("rdv_appointments")
      .select("*, rdv_types(name, color, duration_minutes), contacts(id, first_name, last_name, email, phone), team_members(id, name, avatar_color)")
      .order("start_at", { ascending: true });
    if (!error && data) setAppointments(data as RdvAppointment[]);
    setLoadingAppts(false);
  }, []);

  /* ── Fetch types ── */
  const fetchTypes = useCallback(async () => {
    setLoadingTypes(true);
    const { data, error } = await supabase
      .from("rdv_types")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setTypes(data as RdvType[]);
    setLoadingTypes(false);
  }, []);

  /* ── Fetch availability ── */
  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true);
    const { data, error } = await supabase
      .from("rdv_availability")
      .select("*")
      .order("day_of_week");
    if (!error && data) setSlots(data as AvailSlot[]);
    setLoadingSlots(false);
  }, []);

  /* ── Fetch booking page ── */
  const fetchBookingPage = useCallback(async () => {
    const { data } = await supabase.from("rdv_booking_pages").select("*").single();
    if (data) setBookingPage(data as BookingPage);
  }, []);

  /* ── Fetch staff (team_members actifs) ── */
  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("team_members")
      .select("id, name, avatar_color, position, status")
      .eq("status", "active")
      .order("name");
    if (data) setStaff(data as StaffMember[]);
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchTypes();
    fetchSlots();
    fetchBookingPage();
    fetchStaff();
  }, [fetchAppointments, fetchTypes, fetchSlots, fetchBookingPage, fetchStaff]);

  /* ── Push notifications ── */
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY !== "string") return;
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub))
    ).catch(() => {});
  }, []);

  async function togglePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      pushToast({ type: "error", message: "Les notifications push ne sont pas supportées." });
      return;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      pushToast({ type: "error", message: "VAPID non configuré." });
      return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        setPushEnabled(false);
        pushToast({ type: "success", message: "Notifications désactivées." });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { pushToast({ type: "error", message: "Non connecté." }); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
        const j = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            subscription: { endpoint: sub.endpoint, keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" } },
          }),
        });
        setPushEnabled(true);
        pushToast({ type: "success", message: "Notifications activées pour les RDV." });
      }
    } catch (err) {
      console.error("[push] toggle error:", err);
      pushToast({ type: "error", message: "Erreur lors de la gestion des notifications." });
    } finally {
      setPushLoading(false);
    }
  }

  /* ── Créer / éditer RDV ── */
  async function saveRdv(data: Partial<RdvAppointment>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editRdv) {
      const { error } = await supabase.from("rdv_appointments").update(data).eq("id", editRdv.id);
      if (error) { pushToast({ type: "error", message: "Erreur lors de la mise à jour." }); return; }
      pushToast({ type: "success", message: "Rendez-vous mis à jour." });
    } else {
      const orgId = orgState.status === "ready" ? orgState.org.id : null;
      const { error } = await supabase.from("rdv_appointments").insert({
        ...data,
        user_id: user.id,
        organization_id: orgId,
        source: "internal",
      });
      if (error) { pushToast({ type: "error", message: "Erreur lors de la création." }); return; }
      pushToast({ type: "success", message: "Rendez-vous créé." });
    }
    setShowNewRdv(false);
    setEditRdv(null);
    fetchAppointments();
  }

  /* ── Supprimer RDV ── */
  async function deleteRdv(id: string) {
    const { error } = await supabase.from("rdv_appointments").delete().eq("id", id);
    if (error) { pushToast({ type: "error", message: "Erreur lors de la suppression." }); return; }
    pushToast({ type: "success", message: "Rendez-vous supprimé." });
    fetchAppointments();
  }

  /* ── Changer statut RDV ── */
  async function changeStatus(id: string, status: RdvStatus) {
    const { error } = await supabase.from("rdv_appointments").update({ status }).eq("id", id);
    if (error) { pushToast({ type: "error", message: "Erreur." }); return; }
    pushToast({ type: "success", message: `Statut mis à jour : ${STATUS_META[status].label}` });
    fetchAppointments();
  }

  /* ── Lier contact CRM ── */
  async function linkContact(rdvId: string, contact: Contact | null) {
    const { error } = await supabase
      .from("rdv_appointments")
      .update({ contact_id: contact?.id ?? null })
      .eq("id", rdvId);
    if (error) { pushToast({ type: "error", message: "Erreur lors de la liaison." }); return; }
    pushToast({ type: "success", message: contact ? `Contact lié : ${contact.first_name} ${contact.last_name}` : "Contact délié." });
    fetchAppointments();
    // Update selectedRdv in place
    setSelectedRdv((prev) => prev?.id === rdvId ? { ...prev, contact_id: contact?.id ?? null, contacts: contact } : prev);
  }

  /* ── Sauvegarder notes ── */
  async function saveNotes(rdvId: string, notes: string) {
    const { error } = await supabase
      .from("rdv_appointments")
      .update({ internal_notes: notes })
      .eq("id", rdvId);
    if (error) { pushToast({ type: "error", message: "Erreur." }); return; }
    pushToast({ type: "success", message: "Notes enregistrées." });
    setSelectedRdv((prev) => prev?.id === rdvId ? { ...prev, internal_notes: notes } : prev);
    fetchAppointments();
  }

  /* ── Créer / éditer type ── */
  async function saveType(data: Partial<RdvType>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editType) {
      const { error } = await supabase.from("rdv_types").update(data).eq("id", editType.id);
      if (error) { pushToast({ type: "error", message: "Erreur." }); return; }
      pushToast({ type: "success", message: "Type mis à jour." });
    } else {
      const orgId = orgState.status === "ready" ? orgState.org.id : null;
      const { error } = await supabase.from("rdv_types").insert({
        ...data,
        user_id: user.id,
        organization_id: orgId,
      });
      if (error) { pushToast({ type: "error", message: "Erreur lors de la création." }); return; }
      pushToast({ type: "success", message: "Type créé." });
    }
    setShowNewType(false);
    setEditType(null);
    fetchTypes();
  }

  /* ── Supprimer type ── */
  async function deleteType(id: string) {
    const { error } = await supabase.from("rdv_types").delete().eq("id", id);
    if (error) { pushToast({ type: "error", message: "Erreur." }); return; }
    pushToast({ type: "success", message: "Type supprimé." });
    fetchTypes();
  }

  /* ── Toggle type actif ── */
  async function toggleType(id: string, active: boolean) {
    await supabase.from("rdv_types").update({ is_active: active }).eq("id", id);
    fetchTypes();
  }

  /* ── Ajouter disponibilité ── */
  async function addSlot(day: number, start: string, end: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const orgId = orgState.status === "ready" ? orgState.org.id : null;
    const { error } = await supabase.from("rdv_availability").insert({
      user_id: user.id,
      organization_id: orgId,
      day_of_week: day,
      start_time: start,
      end_time:   end,
    });
    if (error) { pushToast({ type: "error", message: error.message }); return; }
    pushToast({ type: "success", message: "Plage ajoutée." });
    fetchSlots();
  }

  /* ── Supprimer disponibilité ── */
  async function deleteSlot(id: string) {
    await supabase.from("rdv_availability").delete().eq("id", id);
    fetchSlots();
  }

  /* ── Sauvegarder page publique ── */
  async function saveBookingPage(data: Partial<BookingPage>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const orgId = orgState.status === "ready" ? orgState.org.id : null;

    if (bookingPage) {
      await supabase.from("rdv_booking_pages").update(data).eq("id", bookingPage.id);
    } else {
      const { data: newPage } = await supabase.from("rdv_booking_pages").insert({
        ...data,
        user_id: user.id,
        organization_id: orgId,
      }).select().single();
      if (newPage) setBookingPage(newPage as BookingPage);
    }
    pushToast({ type: "success", message: "Page sauvegardée." });
    fetchBookingPage();
  }

  /* ── Compteurs pour le header ── */
  const today = new Date().toDateString();
  const todayCount    = appointments.filter((a) => new Date(a.start_at).toDateString() === today && a.status !== "cancelled").length;
  const upcomingCount = appointments.filter((a) => new Date(a.start_at) > new Date() && a.status === "confirmed").length;

  /* ── Design tokens ── */
  const dp = {
    bg:     isDark ? "bg-[#07080e]"              : "bg-[#f0f2f5]",
    topbar: isDark ? "bg-[#07080e] border-white/[0.06]" : "bg-white border-black/[0.07]",
    nav:    isDark ? "bg-[#0a0b12] border-white/[0.06]" : "bg-white border-black/[0.07]",
    pri:    isDark ? "text-white"                : "text-[#0e1420]",
    sec:    isDark ? "text-white/50"             : "text-[#0e1420]/55",
    mut:    isDark ? "text-white/25"             : "text-[#0e1420]/30",
    content:isDark ? "bg-[#07080e]"              : "bg-[#f0f2f5]",
  };

  const TABS: { key: AppTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "agenda",          label: "Agenda",         icon: Calendar     },
    { key: "liste",           label: "Rendez-vous",    icon: List,         badge: upcomingCount || undefined },
    { key: "types",           label: "Types de RDV",   icon: Tag          },
    { key: "disponibilites",  label: "Disponibilités", icon: CalendarClock },
    { key: "page-pub",        label: "Page publique",  icon: Globe        },
    { key: "stats",           label: "Statistiques",   icon: BarChart2    },
    { key: "parametres",      label: "Paramètres",     icon: Settings     },
  ];

  const TAB_KEYS = TABS.map(t => t.key);
  const swipe = useSwipe(
    () => { const i = TAB_KEYS.indexOf(tab); if (i < TAB_KEYS.length - 1) setTab(TAB_KEYS[i + 1]); },
    () => { const i = TAB_KEYS.indexOf(tab); if (i > 0) setTab(TAB_KEYS[i - 1]); },
  );

  return (
    <div className={`flex flex-col h-[calc(100vh-56px)] overflow-hidden ${dp.bg}`}>
      <ToastStack toasts={toasts} remove={dismiss} />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className={`shrink-0 border-b px-4 py-3 sm:px-6 ${dp.topbar}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={CalendarDays} color={GOLD} />
            <div>
              <h1 className={`text-[17px] font-black ${dp.pri}`}>Rendez-vous</h1>
              <p className={`text-[10.5px] ${dp.sec}`}>
                {todayCount > 0 ? `${todayCount} aujourd'hui` : "Planifiez vos rendez-vous"} · {upcomingCount} à venir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNewType(true)}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.06]" : "border-black/[0.1] text-[#0e1420]/60 hover:bg-black/[0.04]"}`}>
              <Tag size={13} />Créer un type
            </button>
            <button
              onClick={() => { setTab("page-pub"); }}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.06]" : "border-black/[0.1] text-[#0e1420]/60 hover:bg-black/[0.04]"}`}>
              <Share2 size={13} />Partager ma page
            </button>
            {/* Bell push notification */}
            {"serviceWorker" in (typeof navigator !== "undefined" ? navigator : {}) && (
              <button
                onClick={togglePush}
                disabled={pushLoading}
                title={pushEnabled ? "Désactiver les notifications" : "Activer les notifications RDV"}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.06]" : "border-black/[0.1] text-[#0e1420]/60 hover:bg-black/[0.04]"} ${pushLoading ? "opacity-40" : ""}`}>
                {pushEnabled ? <Bell size={14} style={{ color: GOLD }} /> : <BellOff size={14} />}
              </button>
            )}
            <button
              onClick={() => setShowNewRdv(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #a07840)` }}>
              <Plus size={14} />Nouveau RDV
            </button>
          </div>
        </div>
      </div>

      {/* ── NAV TABS ────────────────────────────────────────── */}
      <div className={`shrink-0 flex items-center gap-0.5 overflow-x-auto no-scrollbar border-b px-3 ${dp.nav}`}>
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition-all border-b-2 ${
              tab === key
                ? "border-[#c9a55a] text-[#c9a55a]"
                : `border-transparent ${dp.sec} hover:${dp.pri}`
            }`}>
            <Icon size={13} />
            <span className="hidden sm:block">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white" style={{ background: GOLD }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENU ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" {...swipe}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="h-full overflow-auto"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease }}
          >
            {tab === "agenda" && (
              <AgendaView
                appointments={appointments}
                isDark={isDark}
                onNewRdv={(date, time) => { setPrefilledDate(date); setPrefilledTime(time); setEditRdv(null); setShowNewRdv(true); }}
                onEdit={(a) => { setEditRdv(a); setShowNewRdv(true); }}
              />
            )}
            {tab === "liste" && (
              <ListeView
                appointments={appointments}
                staff={staff}
                isDark={isDark}
                onEdit={(a) => { setEditRdv(a); setShowNewRdv(true); setSelectedRdv(null); }}
                onDelete={(id) => { deleteRdv(id); setSelectedRdv(null); }}
                onStatusChange={changeStatus}
                onSelect={(a) => setSelectedRdv(a)}
                loading={loadingAppts}
              />
            )}
            {tab === "types" && (
              <TypesView
                types={types}
                isDark={isDark}
                onEdit={(t) => { setEditType(t); setShowNewType(true); }}
                onDelete={deleteType}
                onToggle={toggleType}
                loading={loadingTypes}
              />
            )}
            {tab === "disponibilites" && (
              <DisponibilitesView
                slots={slots}
                isDark={isDark}
                onAdd={addSlot}
                onDelete={deleteSlot}
                loading={loadingSlots}
              />
            )}
            {tab === "page-pub" && (
              <PagePubView
                bookingPage={bookingPage}
                isDark={isDark}
                types={types}
                onSave={saveBookingPage}
              />
            )}
            {tab === "stats" && (
              <StatsView appointments={appointments} types={types} isDark={isDark} />
            )}
            {tab === "parametres" && (
              <div className="p-4 sm:p-6">
                <p className={`text-[0.62rem] font-bold uppercase tracking-widest ${dp.mut}`}>Paramètres</p>
                <p className={`mt-3 text-sm ${dp.sec}`}>Configuration avancée — bientôt disponible (Phase 10 : notifications, Phase 11 : calendriers externes).</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── DRAWER DÉTAIL ────────────────────────────────────── */}
      <RdvDetailDrawer
        rdv={selectedRdv}
        isDark={isDark}
        onClose={() => setSelectedRdv(null)}
        onEdit={(a) => { setSelectedRdv(null); setEditRdv(a); setShowNewRdv(true); }}
        onDelete={(id) => { deleteRdv(id); setSelectedRdv(null); }}
        onStatusChange={(id, s) => { changeStatus(id, s); setSelectedRdv((prev) => prev?.id === id ? { ...prev, status: s } : prev); }}
        onLinkContact={linkContact}
        onSaveNotes={saveNotes}
      />

      {/* ── MODALS ──────────────────────────────────────────── */}
      <NewRdvModal
        open={showNewRdv}
        onClose={() => { setShowNewRdv(false); setEditRdv(null); setPrefilledDate(undefined); setPrefilledTime(undefined); }}
        onSave={saveRdv}
        types={types}
        staff={staff}
        isDark={isDark}
        editData={editRdv}
        initialDate={prefilledDate}
        initialTime={prefilledTime}
      />
      <TypeModal
        open={showNewType}
        onClose={() => { setShowNewType(false); setEditType(null); }}
        onSave={saveType}
        isDark={isDark}
        editData={editType}
      />

      {/* ── ASSISTANT IA — bouton flottant ──────────────────── */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          title="Assistant IA"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 48, height: 48, borderRadius: 9999,
            background: GOLD, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(201,165,90,0.45)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <Sparkles size={20} color="white" />
        </button>
      )}

      {/* ── ASSISTANT IA — panel ────────────────────────────── */}
      {showAI && (() => {
        const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Indian/Mayotte" });
        const todayStr = new Date().toLocaleDateString("fr-CA", { timeZone: "Indian/Mayotte" }); // YYYY-MM-DD
        const todayAppts = appointments
          .filter(a => a.start_at.slice(0, 10) === todayStr && a.status !== "cancelled")
          .map(a => ({
            client_name: a.client_name,
            start_time:  new Date(a.start_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mayotte" }),
            type_name:   a.rdv_types?.name ?? "RDV",
            status:      a.status,
          }));
        const upcoming7 = appointments.filter(a => {
          const d = new Date(a.start_at);
          const now = new Date();
          const in7 = new Date(now.getTime() + 7 * 86400_000);
          return d >= now && d <= in7 && a.status !== "cancelled";
        }).length;

        return (
          <RdvAIPanel
            isDark={isDark}
            context={{
              today_date:         today,
              today_appointments: todayAppts,
              upcoming_count:     upcoming7,
              types:              types.map(t => ({ name: t.name, duration_minutes: t.duration_minutes })),
            }}
            onClose={() => setShowAI(false)}
          />
        );
      })()}
    </div>
  );
}
