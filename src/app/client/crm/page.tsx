"use client";

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Trash2, Pencil, X, Loader2, Mail, Phone,
  Building2, Download, Upload, UserCheck, ChevronRight, ChevronDown,
  Calendar, Clock, FileText, MessageSquare, Video, PhoneCall,
  Star, Tag, Globe, Linkedin, MapPin, Briefcase, TrendingUp,
  CheckSquare, Square, AlertCircle, AlertTriangle, Ticket, BarChart2, Filter,
  ArrowUpRight, DollarSign, Target, Activity, Check, SlidersHorizontal,
  Zap, Award, Flag, MoreVertical, Send, Link2, ChevronLeft,
  RefreshCw, PieChart, Layers, Bell, Hash, CheckCircle, XCircle, Sparkles,
  Bug, HelpCircle, CreditCard, Key, Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
);
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/lib/use-organization";
import { useCrmPermissions } from "@/lib/use-crm-permissions";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import Pagination from "@/components/client/Pagination";
import { GridSkeleton } from "@/components/client/Skeleton";
import EmptyState from "@/components/client/EmptyState";
import { validate, ContactSchema } from "@/lib/schemas/client";
import { useTheme } from "@/lib/theme-context";

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
    address?: string; city?: string; country?: string;
  sector?: string; company_size?: string; source?: string;
  priority?: Priority; type?: ContactType;
  website?: string; linkedin?: string;
  budget?: number; interest_level?: number;
  tags?: string[];
  next_relance?: string;
  created_at: string; updated_at: string;
  deleted_at?: string | null;
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

interface OrgMember {
  user_id: string;
  display_name: string | null;
  role: string;
}

interface CrmTask {
  id: string; user_id: string; contact_id: string | null;
  opportunity_id: string | null;
  title: string; description: string; due_date: string | null;
  priority: Priority; done: boolean; type: TaskType;
  assigned_to: string | null;
  reminder_at: string | null;
  created_at: string;
  contact?: Pick<Contact, "name" | "company">;
}

type TicketCategory = "bug" | "question" | "facturation" | "accès" | "autre";

interface SupportTicket {
  id: string; user_id: string; contact_id: string | null;
  title: string; description: string;
  status: TicketStatus; priority: TicketPriority;
  category: TicketCategory | null;
  satisfaction: number;
  resolved_at: string | null;
  created_at: string; updated_at: string;
  contact?: Pick<Contact, "name" | "company">;
}

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

const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const ease = [0.16, 1, 0.3, 1] as const;

function computeLeadScore(c: Contact, activitiesCount: number): number {
  let s = 0;
  s += c.priority === "urgent" ? 25 : c.priority === "high" ? 15 : c.priority === "normal" ? 5 : 0;
  s += Math.min((c.interest_level ?? 0) * 6, 30);
  if (c.budget && c.budget > 0) s += Math.min(Math.floor(c.budget / 1000) * 2, 15);
  s += Math.min(activitiesCount * 3, 15);
  if (c.email) s += 5;
  if (c.phone) s += 5;
  if (c.status === "actif") s += 5;
  if (c.status === "perdu") s = Math.max(0, s - 20);
  return Math.min(s, 100);
}

function computeHeatScore(activities: Activity[], opportunities: Opportunity[], tasks: CrmTask[]): {
  score: number; label: string; color: string;
} {
  const now  = new Date();
  const today = now.toISOString().slice(0, 10);
  let s = 0;

  if (activities.length > 0) {
    const lastMs  = Math.max(...activities.map(a => new Date(a.activity_date).getTime()));
    const daysAgo = (now.getTime() - lastMs) / 86_400_000;
    if      (daysAgo <  7) s += 40;
    else if (daysAgo < 30) s += 25;
    else if (daysAgo < 90) s += 10;
    s += Math.min(activities.length * 2, 10);
  }

  const openOpps = opportunities.filter(o => !["perdu", "en_pause"].includes(o.stage));
  s += Math.min(openOpps.length * 15, 30);

  const overdue = tasks.filter(t => !t.done && t.due_date && t.due_date < today);
  s -= Math.min(overdue.length * 5, 15);

  s = Math.max(0, Math.min(100, s));
  const label = s >= 70 ? "Brûlant" : s >= 40 ? "Chaud" : s >= 20 ? "Tiède" : "Froid";
  const color = s >= 70 ? "#ef4444" : s >= 40 ? "#f97316" : s >= 20 ? "#f59e0b" : "#94a3b8";
  return { score: s, label, color };
}

function groupActivitiesByPeriod(acts: Activity[]): { label: string; items: Activity[] }[] {
  const now      = new Date();
  const today    = now.toISOString().slice(0, 10);
  const weekAgo  = new Date(now.getTime() - 7  * 86_400_000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const groups   = [
    { label: "Aujourd'hui",   items: [] as Activity[] },
    { label: "Cette semaine", items: [] as Activity[] },
    { label: "Ce mois",       items: [] as Activity[] },
    { label: "Plus ancien",   items: [] as Activity[] },
  ];
  for (const a of acts) {
    const d = a.activity_date.slice(0, 10);
    if      (d === today)    groups[0].items.push(a);
    else if (d >= weekAgo)   groups[1].items.push(a);
    else if (d >= monthAgo)  groups[2].items.push(a);
    else                     groups[3].items.push(a);
  }
  return groups.filter(g => g.items.length > 0);
}

function getCloseDateUrgency(close_date: string | null | undefined): "overdue" | "this-week" | null {
  if (!close_date) return null;
  const today    = new Date().toISOString().slice(0, 10);
  const weekEnd  = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  if (close_date < today)    return "overdue";
  if (close_date <= weekEnd) return "this-week";
  return null;
}

// ── RFC 4180 CSV parser / writer ───────────────────────────────────
function parseRFC4180(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const row: string[] = [];
    while (i < n) {
      if (text[i] === '"') {
        i++;
        let field = "";
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += text[i++]; }
        }
        row.push(field);
      } else {
        let field = "";
        while (i < n && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i++];
        }
        row.push(field.trim());
      }
      if (i < n && text[i] === ",") { i++; continue; }
      break;
    }
    if (i < n && text[i] === "\r") i++;
    if (i < n && text[i] === "\n") i++;
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

function toRFC4180Row(values: (string | number | null | undefined)[]): string {
  return values.map(v => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(",") + "\r\n";
}

const CSV_EXPORT_HEADERS = ["Nom","Société","Email","Téléphone","Statut","Type","Secteur","Source","Ville","Budget","Notes","Prochaine relance","Créé le"];

const EMAIL_TEMPLATES = [
  { id: "relance",      label: "Relance J+7",          subject: "Suite à notre échange",               body: "Bonjour {nom},\n\nJe me permets de revenir vers vous suite à notre dernier échange.\n\nAvez-vous eu l'occasion d'étudier notre proposition ? Je reste disponible pour répondre à vos questions.\n\nCordialement" },
  { id: "proposition",  label: "Envoi proposition",     subject: "Notre proposition — {société}",        body: "Bonjour {nom},\n\nComme convenu, veuillez trouver ci-joint notre proposition commerciale.\n\nN'hésitez pas à me contacter pour en discuter.\n\nCordialement" },
  { id: "remerciement", label: "Remerciement réunion",  subject: "Merci pour notre réunion",             body: "Bonjour {nom},\n\nMerci pour le temps que vous nous avez accordé.\n\nComme évoqué, nous revenons vers vous rapidement.\n\nBonne journée," },
  { id: "suivi",        label: "Suivi mensuel",         subject: "Point mensuel — {société}",            body: "Bonjour {nom},\n\nJ'espère que tout se passe bien de votre côté.\n\nN'hésitez pas à nous faire part de vos retours ou besoins.\n\nCordialement" },
  { id: "bienvenue",    label: "Bienvenue client",      subject: "Bienvenue !",                          body: "Bonjour {nom},\n\nNous sommes ravis de vous accueillir parmi nos clients.\n\nNous restons à votre disposition pour toute question.\n\nL'équipe" },
] as const;

interface CustomEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const TEMPLATE_VARIABLES = [
  { token: "{nom}",      hint: "Prénom du contact" },
  { token: "{société}",  hint: "Société du contact" },
  { token: "{date}",     hint: "Date du jour" },
  { token: "{budget}",   hint: "Budget du contact" },
];

function resolveVars(s: string, contact: Pick<Contact, "name" | "company" | "budget">): string {
  const prenom = contact.name.split(" ")[0];
  const today  = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return s
    .replace(/\{nom\}/g,     prenom)
    .replace(/\{société\}/g, contact.company || "votre entreprise")
    .replace(/\{date\}/g,    today)
    .replace(/\{budget\}/g,  contact.budget ? `${Number(contact.budget).toLocaleString("fr-FR")} €` : "");
}

function Badge({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
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
  const isDark = useDark();
  return (
    <div className="space-y-1">
      {label && <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>{label}</label>}
      <input {...props}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20 focus:border-white/20" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-gray-300"}`} />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const isDark = useDark();
  return (
    <div className="space-y-1">
      {label && <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>{label}</label>}
      <textarea {...props} rows={3}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20 focus:border-white/20" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-gray-300"}`} />
    </div>
  );
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const isDark = useDark();
  return (
    <div className="space-y-1">
      {label && <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>{label}</label>}
      <select {...props}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors appearance-none"
        style={{ backgroundColor: isDark ? "#0d1117" : "#f9fafb", color: isDark ? "#ffffff" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
        {children}
      </select>
    </div>
  );
}

function PipelineView({
  opportunities, contacts, onUpdate, onDelete, onAdd, loading, canDelete,
}: {
  opportunities: Opportunity[];
  contacts: Contact[];
  onUpdate: (id: string, data: Partial<Opportunity>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (data: Partial<Opportunity>) => Promise<void>;
  loading: boolean;
  canDelete: boolean;
}) {
  const [addModal, setAddModal]     = useState<OppStage | null>(null);
  const [editOpp, setEditOpp]       = useState<Opportunity | null>(null);
  const [form, setForm]             = useState<Partial<Opportunity>>({});
  const [draggedId, setDraggedId]   = useState<string | null>(null);
  const [dragOver, setDragOver]     = useState<OppStage | null>(null);
  const isDark = useDark();

  const stageKeys = Object.keys(STAGES) as OppStage[];
  const byStage = useMemo(() => {
    const m: Record<OppStage, Opportunity[]> = {} as Record<OppStage, Opportunity[]>;
    stageKeys.forEach(s => { m[s] = []; });
    opportunities.forEach(o => { m[o.stage]?.push(o); });
    return m;
  }, [opportunities]);

  const totalByStage = (stage: OppStage) =>
    byStage[stage].reduce((s, o) => s + (o.amount ?? 0), 0);

  const forecastByStage = useMemo(() => {
    const m: Record<OppStage, number> = {} as Record<OppStage, number>;
    stageKeys.forEach(s => {
      m[s] = byStage[s].reduce((acc, o) => acc + (o.amount ?? 0) * ((o.probability ?? 0) / 100), 0);
    });
    return m;
  }, [byStage]);

  const activeStages  = stageKeys.filter(s => s !== "perdu");
  const forecastTotal = activeStages.reduce((acc, s) => acc + forecastByStage[s], 0);
  const wonTotal      = totalByStage("gagné");
  const totalOpps     = opportunities.length;
  const wonOpps       = byStage["gagné"].length;
  const winRate       = totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 100) : 0;

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
      {/* ── Résumé pipeline ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pipeline actif",    value: fmtEur(activeStages.reduce((a, s) => a + totalByStage(s), 0)), color: "#f59e0b", icon: TrendingUp },
          { label: "Prévisionnel",      value: fmtEur(forecastTotal), color: "#34d399", icon: Target,
            hint: "Pondéré par probabilité" },
          { label: "CA gagné",          value: fmtEur(wonTotal),      color: "#a78bfa", icon: CheckCircle },
          { label: "Taux de conversion",value: `${winRate} %`,        color: "#60a5fa", icon: Award },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={11} style={{ color: s.color }}/>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>{s.label}</span>
            </div>
            <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
            {s.hint && <div className={`text-[11px] mt-0.5 ${isDark ? "text-white/20" : "text-gray-400"}`}>{s.hint}</div>}
          </div>
        ))}
      </div>

      {/* ── Tiles par étape ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stageKeys.filter(s => s !== "perdu").map(stage => {
          const total    = totalByStage(stage);
          const forecast = forecastByStage[stage];
          const count    = byStage[stage].length;
          return (
            <div key={stage} className={`rounded-2xl border p-2.5 text-center ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</div>
              <div className={`text-base font-black ${isDark ? "text-white" : "text-gray-900"}`}>{count}</div>
              {total > 0 && <div className={`text-[11px] mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>{fmtEur(total)}</div>}
              {forecast > 0 && stage !== "gagné" && (
                <div className="text-[10px] mt-0.5 text-emerald-500">~{fmtEur(forecast)}</div>
              )}
            </div>
          );
        })}
      </div>

            <div className="flex gap-3 overflow-x-auto pb-3">
        {stageKeys.map(stage => (
          <div key={stage}
          className="shrink-0 w-64 rounded-2xl border flex flex-col transition-colors"
          style={{
            background: dragOver === stage ? `${STAGES[stage].color}08` : isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)",
            borderColor: dragOver === stage ? `${STAGES[stage].color}50` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
          onDrop={async e => {
            e.preventDefault(); setDragOver(null);
            if (!draggedId) return;
            const opp = opportunities.find(o => o.id === draggedId);
            if (opp && opp.stage !== stage) await onUpdate(draggedId, { stage, probability: STAGES[stage].prob });
            setDraggedId(null);
          }}>
                        <div className={`flex items-center justify-between p-3 border-b ${isDark ? "border-white/[0.05]" : "border-gray-100"}`}>
              <div>
                <span className="text-xs font-black uppercase tracking-widest"
                  style={{ color: STAGES[stage].color }}>{STAGES[stage].label}</span>
                <span className={`ml-1.5 text-xs ${isDark ? "text-white/25" : "text-gray-400"}`}>({byStage[stage].length})</span>
              </div>
              {stage !== "gagné" && stage !== "perdu" && (
                <button onClick={() => openAdd(stage)}
                  className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-white/[0.05] hover:bg-white/10 text-white/40 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700"}`}>
                  <Plus size={10}/>
                </button>
              )}
            </div>
                        <div className="flex flex-col gap-2 p-2 flex-1 min-h-[100px]">
              {byStage[stage].map(opp => {
                const urgency = getCloseDateUrgency(opp.close_date);
                const isActive = stage !== "gagné" && stage !== "perdu";
                return (
                  <motion.div key={opp.id} layout
                    draggable
                    onDragStart={e => { e.stopPropagation(); setDraggedId(opp.id); }}
                    onDragEnd={() => setDraggedId(null)}
                    className={`rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all group ${isDark ? "border-white/[0.06] bg-white/[0.03] hover:border-white/10" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    style={draggedId === opp.id ? { opacity: 0.45 } : {}}
                    onClick={() => openEdit(opp)}>
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm font-semibold leading-tight flex-1 min-w-0 ${isDark ? "text-white" : "text-gray-900"}`}>{opp.title}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {isActive && (
                          <>
                            <button title="Marquer Gagné"
                              onClick={e => { e.stopPropagation(); onUpdate(opp.id, { stage: "gagné", probability: 100 }); }}
                              className="text-emerald-400/60 hover:text-emerald-400 transition-colors">
                              <CheckCircle size={11}/>
                            </button>
                            <button title="Marquer Perdu"
                              onClick={e => { e.stopPropagation(); onUpdate(opp.id, { stage: "perdu", probability: 0 }); }}
                              className={`${isDark ? "text-white/20" : "text-gray-300"} hover:text-red-400 transition-colors`}>
                              <XCircle size={11}/>
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={e => { e.stopPropagation(); onDelete(opp.id); }}
                            className={`${isDark ? "text-white/20" : "text-gray-300"} hover:text-red-500 transition-colors`}>
                            <Trash2 size={10}/>
                          </button>
                        )}
                      </div>
                    </div>
                    {opp.contact && (
                      <p className={`text-xs mt-1 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                        {opp.contact.name}{opp.contact.company ? ` · ${opp.contact.company}` : ""}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                      {opp.amount > 0 && (
                        <span className="text-xs font-black" style={{ color: STAGES[stage].color }}>
                          {fmtEur(opp.amount)}
                        </span>
                      )}
                      {opp.close_date && (
                        <span className={`text-xs ml-auto flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${
                          urgency === "overdue"   ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                          urgency === "this-week" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          isDark ? "text-white/30" : "text-gray-400"
                        }`}>
                          {urgency && <AlertCircle size={8}/>}
                          {fmtDate(opp.close_date)}
                        </span>
                      )}
                    </div>
                    {opp.probability > 0 && opp.stage !== "gagné" && (
                      <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${opp.probability}%`, backgroundColor: STAGES[stage].color }}/>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {/* ── Slot de drop visuel ─── */}
              {dragOver === stage && draggedId && (
                <div className="h-12 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0"
                  style={{ borderColor: `${STAGES[stage].color}50` }}>
                  <span className="text-xs font-semibold" style={{ color: STAGES[stage].color }}>
                    Déposer ici
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

            <AnimatePresence>
        {(addModal || editOpp) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setAddModal(null); setEditOpp(null); setForm({}); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-white"}`}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className={`font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{editOpp ? "Modifier l'opportunité" : "Nouvelle opportunité"}</h3>
                <button onClick={() => { setAddModal(null); setEditOpp(null); setForm({}); }}
                  className={`${isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"} transition-colors`}><X size={16}/></button>
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
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                <button onClick={save} disabled={!form.title}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
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

function TachesView({
  tasks, contacts, members, onToggle, onDelete, onAdd, onUpdate, canDelete,
}: {
  tasks: CrmTask[];
  contacts: Contact[];
  members: OrgMember[];
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (data: Partial<CrmTask>) => Promise<void>;
  onUpdate: (id: string, data: Partial<CrmTask>) => Promise<void>;
  canDelete: boolean;
}) {
  const [filter, setFilter]   = useState<"all" | "today" | "late" | "done" | "mine">("all");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm]       = useState<Partial<CrmTask>>({ priority: "normal", type: "action" });
  const today = new Date().toISOString().split("T")[0];
  const isDark = useDark();
  const notifiedRef = useRef<Set<string>>(new Set());

  /* ── Rappels client-side (browser Notification) ───────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    tasks.forEach(t => {
      if (!t.reminder_at || t.done || notifiedRef.current.has(t.id)) return;
      if (t.reminder_at > now || t.reminder_at < oneHourAgo) return;
      notifiedRef.current.add(t.id);
      new Notification(`Rappel : ${t.title}`, {
        body: t.contact ? `Contact : ${t.contact.name}` : t.description || undefined,
        icon: "/icon-192.png",
        tag: `crm-task-${t.id}`,
      });
    });
  }, [tasks]);

  const currentUserId = useMemo(() => {
    return members.find(() => true)?.user_id ?? null;
  }, [members]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (filter === "done")  return t.done;
    if (filter === "today") return !t.done && t.due_date === today;
    if (filter === "late")  return !t.done && t.due_date && t.due_date < today;
    if (filter === "mine")  return !t.done && !!t.assigned_to;
    return !t.done;
  }), [tasks, filter, today]);

  const counts = useMemo(() => ({
    all:   tasks.filter(t => !t.done).length,
    today: tasks.filter(t => !t.done && t.due_date === today).length,
    late:  tasks.filter(t => !t.done && t.due_date && t.due_date < today).length,
    mine:  tasks.filter(t => !t.done && !!t.assigned_to).length,
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { id: "all",   label: "En cours" },
            { id: "today", label: "Aujourd'hui" },
            { id: "late",  label: "En retard" },
            ...(members.length > 0 ? [{ id: "mine", label: "Assignées" }] : []),
            { id: "done",  label: "Terminées" },
          ] as { id: typeof filter; label: string }[]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${filter === f.id ? (isDark ? "bg-white/10 text-white" : "bg-black/[0.06] text-gray-900") : (isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-700")}`}>
              {f.label}
              {counts[f.id] > 0 && <span className={`ml-1.5 rounded-full px-1.5 text-xs ${
                f.id === "late" ? "bg-red-500/20 text-red-400" : (isDark ? "bg-white/10 text-white/50" : "bg-black/[0.06] text-gray-500")}`}>{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={11}/> Nouvelle tâche
        </button>
      </div>

            {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-sm">
          {filter === "done" ? "Aucune tâche terminée" : "Aucune tâche en cours"}
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
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 group ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <button onClick={() => onToggle(task.id, !task.done)} className="mt-0.5 shrink-0 transition-colors"
                    style={{ color: task.done ? "#34d399" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>
                    {task.done ? <CheckSquare size={16}/> : <Square size={16}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${task.done ? (isDark ? "line-through text-white/30" : "line-through text-gray-400") : (isDark ? "text-white" : "text-gray-900")}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                        style={{ color: pColor }}>
                        <TaskIcon size={9}/>{task.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.contact && (
                        <span className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                          {task.contact.name}{task.contact.company ? ` · ${task.contact.company}` : ""}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`text-xs flex items-center gap-0.5 ${isLate ? "text-red-400" : (isDark ? "text-white/30" : "text-gray-400")}`}>
                          <Calendar size={9}/>{fmtDate(task.due_date)}
                          {isLate && " · En retard"}
                        </span>
                      )}
                      {task.reminder_at && (
                        <span className={`text-xs flex items-center gap-0.5 ${isDark ? "text-amber-400/60" : "text-amber-500"}`}
                          title={`Rappel : ${new Date(task.reminder_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}>
                          <Bell size={9}/>
                          {new Date(task.reminder_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {task.assigned_to && (() => {
                        const m = members.find(x => x.user_id === task.assigned_to);
                        const label = m?.display_name ?? "Assigné";
                        const initials = label.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                        return (
                          <span className={`text-xs flex items-center gap-1 rounded-full px-1.5 py-0.5 ${isDark ? "bg-white/[0.06] text-white/50" : "bg-gray-100 text-gray-500"}`}
                            title={`Assigné à : ${label}`}>
                            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                              style={{ background: "#a78bfa" }}>{initials}</span>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {canDelete && (
                    <button onClick={() => onDelete(task.id)}
                      className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0 mt-0.5 ${isDark ? "text-white/20" : "text-gray-300"}`}>
                      <Trash2 size={12}/>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

            <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setAddModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-white"}`}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className={`font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Nouvelle tâche</h3>
                <button onClick={() => setAddModal(false)} className={isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}><X size={16}/></button>
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
              <div className="grid grid-cols-2 gap-3">
                <Input label="Échéance" type="date" value={form.due_date ?? ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))}/>
                <div className="space-y-1">
                  <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    Rappel <Bell size={9} className="inline mb-0.5"/>
                  </label>
                  <input type="datetime-local" value={form.reminder_at?.slice(0, 16) ?? ""}
                    onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white focus:border-white/20" : "border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-300"}`}
                    style={{ colorScheme: isDark ? "dark" : "light" }}/>
                </div>
              </div>
              <Select label="Contact lié" value={form.contact_id ?? ""} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value || null }))}>
                <option value="">— Aucun —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </Select>
              {members.length > 0 && (
                <Select label="Assigné à" value={form.assigned_to ?? ""} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value || null }))}>
                  <option value="">— Non assigné —</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name ?? m.user_id.slice(0, 8)} ({m.role})
                    </option>
                  ))}
                </Select>
              )}
              <Textarea label="Description" placeholder="Détails…" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
              <div className="flex gap-2">
                <button onClick={() => setAddModal(false)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                <button onClick={saveTask} disabled={!form.title}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
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

type ContactAIInsight = {
  resume:           string;
  prochaine_action: string;
  risque:           "faible" | "moyen" | "élevé";
  score_engagement: number;
  tags_suggeres:    string[];
};

type CrmRapport = {
  score_sante:         number;
  resume_executif:     string;
  points_forts:        string[];
  alertes:             string[];
  recommandations:     string[];
  contacts_a_relancer: { nom: string; societe: string; raison: string }[];
  objectif_semaine:    string;
};

function RapportView({
  contacts, opportunities, tasks, tickets, activities,
}: {
  contacts: Contact[];
  opportunities: Opportunity[];
  tasks: CrmTask[];
  tickets: SupportTicket[];
  activities: Activity[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const { add: toast } = useToastStack();

  const [rapport, setRapport]             = useState<CrmRapport | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapportOpen, setRapportOpen]     = useState(false);
  const isDark = useDark();

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

    const byStatus: Record<string, number> = { prospect: 0, actif: 0, inactif: 0, perdu: 0 };
    contacts.forEach(c => { if (c.status in byStatus) byStatus[c.status]++; });

    const bySector: Record<string, number> = {};
    contacts.forEach(c => { if (c.sector) bySector[c.sector] = (bySector[c.sector] ?? 0) + 1; });
    const topSectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Weekly activity count — last 8 weeks
    const weekLabels: string[] = [];
    const weekCounts: number[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(Date.now() - (w + 1) * 7 * 86_400_000);
      const end   = new Date(Date.now() - w * 7 * 86_400_000);
      const label = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      weekLabels.push(label);
      weekCounts.push(
        activities.filter(a => {
          const d = new Date(a.activity_date);
          return d >= start && d < end;
        }).length,
      );
    }

    // Monthly pipeline amount — last 6 months (by close_date)
    const monthLabels: string[] = [];
    const monthPipeline: number[] = [];
    const monthWon: number[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - m);
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthLabels.push(label);
      const monthOpps = opportunities.filter(o => o.close_date?.startsWith(ym));
      monthPipeline.push(monthOpps.filter(o => o.stage !== "perdu").reduce((s, o) => s + (o.amount ?? 0), 0));
      monthWon.push(monthOpps.filter(o => o.stage === "gagné").reduce((s, o) => s + (o.amount ?? 0), 0));
    }

    return { actifs, prospects, totalOpp, caMtot, convRate, overdueTasks, openTickets, byStage, byType, byStatus, topSectors, totalContacts: contacts.length, weekLabels, weekCounts, monthLabels, monthPipeline, monthWon };
  }, [contacts, opportunities, tasks, tickets, activities]);

  async function runRapportIA() {
    setRapportLoading(true);
    setRapportOpen(false);
    try {
      /* top contacts by won CA */
      const wonMap = new Map<string, { name: string; company: string; amount: number }>();
      opportunities.filter(o => o.stage === "gagné").forEach(o => {
        if (o.contact_id && o.contact) {
          const prev = wonMap.get(o.contact_id);
          if (prev) prev.amount += o.amount ?? 0;
          else wonMap.set(o.contact_id, { name: o.contact.name, company: o.contact.company ?? "", amount: o.amount ?? 0 });
        }
      });
      const topContacts = [...wonMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);

      /* top open opportunities by amount */
      const topOpps = opportunities
        .filter(o => o.stage !== "perdu")
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .slice(0, 5)
        .map(o => ({ title: o.title, amount: o.amount ?? 0, stage: STAGES[o.stage].label }));

      /* stage summary string */
      const stageSummary = (Object.keys(STAGES) as OppStage[])
        .map(s => {
          const { count, amount } = stats.byStage[s];
          return count > 0 ? `${STAGES[s].label}: ${count} opp. (${fmtEur(amount)})` : null;
        })
        .filter(Boolean)
        .join(", ") || "Aucune opportunité";

      /* upcoming relances */
      const nextRelances = contacts
        .filter(c => c.next_relance)
        .sort((a, b) => (a.next_relance! > b.next_relance! ? 1 : -1))
        .slice(0, 5)
        .map(c => ({ name: c.name, company: c.company ?? "", date: c.next_relance! }));

      const res = await fetch("/api/crm-rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalContacts: stats.totalContacts,
          actifs:        stats.actifs,
          prospects:     stats.prospects,
          partenaires:   stats.byType["partenaire"]  ?? 0,
          fournisseurs:  stats.byType["fournisseur"] ?? 0,
          totalOpp:      stats.totalOpp,
          caMtot:        stats.caMtot,
          convRate:      stats.convRate,
          overdueTasks:  stats.overdueTasks,
          openTickets:   stats.openTickets,
          topContacts,
          topOpps,
          stageSummary,
          nextRelances,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json() as CrmRapport;
      setRapport(data);
      setRapportOpen(true);
    } catch {
      toast("Erreur lors de l'analyse IA — réessayez dans quelques instants.", "error");
    } finally {
      setRapportLoading(false);
    }
  }

  /* score gauge constants */
  const score       = rapport?.score_sante ?? 0;
  const R           = 28;
  const circ        = 2 * Math.PI * R;
  const dashOffset  = circ * (1 - score / 100);
  const scoreColor  = score >= 70 ? "#34d399" : score >= 45 ? "#f59e0b" : "#f87171";

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
    <div className="space-y-5">

      {/* ── Header + bouton Analyse IA ── */}
      <div className="flex items-center justify-between">
        <p className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Synthèse CRM</p>
        <button
          onClick={runRapportIA}
          disabled={rapportLoading}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 hover:brightness-110 active:scale-95"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}
        >
          {rapportLoading
            ? <Loader2 size={11} className="animate-spin"/>
            : <Zap size={11}/>
          }
          {rapportLoading ? "Analyse…" : "Analyse IA"}
        </button>
      </div>

      {/* ── Panneau IA ── */}
      <AnimatePresence>
        {rapportOpen && rapport && (
          <motion.div
            key="rapport-ia"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 space-y-5"
            style={{ background: "linear-gradient(135deg,rgba(201,165,90,0.07),rgba(201,165,90,0.03))", border: "1px solid rgba(201,165,90,0.18)" }}
          >
            {/* Score + résumé */}
            <div className="flex items-start gap-5">
              {/* Gauge */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <svg width={72} height={72} viewBox="0 0 72 72">
                  <circle cx={36} cy={36} r={R} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth={5}/>
                  <circle
                    cx={36} cy={36} r={R} fill="none"
                    stroke={scoreColor} strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`${circ}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 36 36)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                  <text x={36} y={40} textAnchor="middle" fill={scoreColor} fontSize={15} fontWeight={900} fontFamily="inherit">{score}</text>
                </svg>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Score</p>
              </div>

              {/* Résumé */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#c9a55a" }}>Résumé exécutif</p>
                <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-gray-700"}`}>{rapport.resume_executif}</p>
              </div>
            </div>

            {/* Points forts + Alertes */}
            <div className="grid sm:grid-cols-2 gap-4">
              {rapport.points_forts.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400/70 mb-2.5">Points forts</p>
                  <ul className="space-y-1.5">
                    {rapport.points_forts.map((pt, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                        <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400"/>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.alertes.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
                  <p className="text-xs font-black uppercase tracking-widest text-red-400/70 mb-2.5">Alertes</p>
                  <ul className="space-y-1.5">
                    {rapport.alertes.map((al, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                        <AlertCircle size={10} className="mt-0.5 shrink-0 text-red-400"/>
                        {al}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommandations */}
            {rapport.recommandations.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "rgba(201,165,90,0.7)" }}>Recommandations</p>
                <ol className="space-y-2">
                  {rapport.recommandations.map((r, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                      <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[11px] font-black"
                        style={{ background: "rgba(201,165,90,0.15)", color: "#c9a55a" }}>{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Contacts à relancer */}
            {rapport.contacts_a_relancer.length > 0 && (
              <div>
                <p className={`text-xs font-black uppercase tracking-widest mb-2.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>Contacts à relancer</p>
                <div className="space-y-1.5">
                  {rapport.contacts_a_relancer.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: "rgba(201,165,90,0.15)", color: "#c9a55a" }}>
                          {c.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isDark ? "text-white/80" : "text-gray-800"}`}>{c.nom}</p>
                          {c.societe && <p className={`text-xs truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{c.societe}</p>}
                        </div>
                      </div>
                      <p className={`text-xs shrink-0 text-right max-w-[45%] leading-snug ${isDark ? "text-white/40" : "text-gray-500"}`}>{c.raison}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objectif semaine */}
            {rapport.objectif_semaine && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
                <Flag size={12} className="shrink-0 mt-0.5" style={{ color: "#c9a55a" }}/>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(201,165,90,0.6)" }}>Objectif de la semaine</p>
                  <p className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{rapport.objectif_semaine}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-2xl border p-4 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>{k.label}</p>
              <k.icon size={13} style={{ color: k.color }}/>
            </div>
            <p className={`font-black ${isDark ? "text-white" : "text-gray-900"} ${k.big ? "text-base" : "text-xl"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Doughnut contacts ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Pipeline horizontal bar chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Pipeline commercial</h3>
          <div style={{ height: 180 }}>
            <Bar
              data={{
                labels: (Object.keys(STAGES) as OppStage[]).map(s => STAGES[s].label),
                datasets: [
                  {
                    label: "Opportunités",
                    data: (Object.keys(STAGES) as OppStage[]).map(s => stats.byStage[s].count),
                    backgroundColor: (Object.keys(STAGES) as OppStage[]).map(s => STAGES[s].color + "cc"),
                    borderColor:     (Object.keys(STAGES) as OppStage[]).map(s => STAGES[s].color),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      afterLabel: (ctx) => {
                        const stage = (Object.keys(STAGES) as OppStage[])[ctx.dataIndex];
                        const amt = stats.byStage[stage].amount;
                        return amt > 0 ? fmtEur(amt) : "";
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", font: { size: 10 }, stepSize: 1 },
                    grid:  { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
                  },
                  y: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", font: { size: 10 } },
                    grid:  { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Contacts by status — Doughnut */}
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Contacts par statut</h3>
          <div className="flex items-center gap-4">
            <div style={{ height: 140, width: 140, flexShrink: 0 }}>
              <Doughnut
                data={{
                  labels: ["Prospect", "Actif", "Inactif", "Perdu"],
                  datasets: [{
                    data: [stats.byStatus.prospect, stats.byStatus.actif, stats.byStatus.inactif, stats.byStatus.perdu],
                    backgroundColor: ["#a78bfa", "#34d399", "#94a3b8", "#f87171"],
                    borderColor:     isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.8)",
                    borderWidth: 2,
                    hoverOffset: 6,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "60%",
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } },
                  },
                }}
              />
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: "Prospect", color: "#a78bfa", val: stats.byStatus.prospect },
                { label: "Actif",    color: "#34d399", val: stats.byStatus.actif },
                { label: "Inactif",  color: "#94a3b8", val: stats.byStatus.inactif },
                { label: "Perdu",    color: "#f87171", val: stats.byStatus.perdu },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}/>
                    <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-600"}`}>{s.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${isDark ? "text-white/40" : "text-gray-500"}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {stats.topSectors.length > 0 && (
            <>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-2 mt-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Top secteurs</h3>
              <div className="space-y-1">
                {stats.topSectors.map(([sector, count]) => (
                  <div key={sector} className="flex items-center justify-between">
                    <span className={`text-xs truncate ${isDark ? "text-white/50" : "text-gray-600"}`}>{sector}</span>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Activités par semaine + Opportunités par mois ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Weekly activity line chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Activités (8 semaines)</h3>
          <div style={{ height: 150 }}>
            <Line
              data={{
                labels: stats.weekLabels,
                datasets: [{
                  label: "Activités",
                  data: stats.weekCounts,
                  borderColor: "#60a5fa",
                  backgroundColor: "rgba(96,165,250,0.12)",
                  borderWidth: 2,
                  pointRadius: 3,
                  pointBackgroundColor: "#60a5fa",
                  tension: 0.35,
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", font: { size: 9 }, maxRotation: 0 },
                    grid:  { display: false },
                  },
                  y: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", font: { size: 9 }, stepSize: 1 },
                    grid:  { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Monthly pipeline + won bar chart */}
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Pipeline / CA par mois</h3>
          <div style={{ height: 150 }}>
            <Bar
              data={{
                labels: stats.monthLabels,
                datasets: [
                  {
                    label: "Pipeline",
                    data: stats.monthPipeline,
                    backgroundColor: "rgba(245,158,11,0.5)",
                    borderColor: "#f59e0b",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "CA gagné",
                    data: stats.monthWon,
                    backgroundColor: "rgba(52,211,153,0.5)",
                    borderColor: "#34d399",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)", font: { size: 9 }, boxWidth: 10, padding: 8 },
                  },
                  tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtEur(ctx.parsed.y ?? 0)}` } },
                },
                scales: {
                  x: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", font: { size: 9 } },
                    grid:  { display: false },
                  },
                  y: {
                    ticks: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", font: { size: 9 }, callback: (v) => fmtEur(Number(v)) },
                    grid:  { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const SLA_HOURS: Record<TicketPriority, number> = {
  urgente: 4, haute: 24, normale: 72, basse: 168,
};

const TICKET_CATEGORIES: Record<TicketCategory, { label: string; icon: LucideIcon }> = {
  bug:         { label: "Bug",         icon: Bug },
  question:    { label: "Question",    icon: HelpCircle },
  facturation: { label: "Facturation", icon: CreditCard },
  accès:       { label: "Accès",       icon: Key },
  autre:       { label: "Autre",       icon: FileText },
};

function computeSla(ticket: SupportTicket): { elapsed: number; breached: boolean; label: string; color: string; deadlineStr: string } {
  if (ticket.status === "résolu" || ticket.status === "fermé") {
    const resMs = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : Date.now();
    const mins  = Math.round((resMs - new Date(ticket.created_at).getTime()) / 60_000);
    const label = mins < 60 ? `Résolu en ${mins} min` : mins < 1440 ? `Résolu en ${Math.round(mins/60)}h` : `Résolu en ${Math.round(mins/1440)}j`;
    return { elapsed: 1, breached: false, label, color: "#34d399", deadlineStr: "" };
  }
  const slaMs   = SLA_HOURS[ticket.priority] * 3_600_000;
  const created = new Date(ticket.created_at).getTime();
  const elapsed = (Date.now() - created) / slaMs;
  const deadline = new Date(created + slaMs);
  const deadlineStr = deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const breached = elapsed >= 1;
  const label = breached ? "SLA dépassé" : elapsed >= 0.8 ? "Bientôt dépassé" : "Dans les délais";
  const color  = breached ? "#f87171"    : elapsed >= 0.8 ? "#fb923c"          : "#34d399";
  return { elapsed: Math.min(elapsed, 1), breached, label, color, deadlineStr };
}

const PRIORITY_ORDER: Record<TicketPriority, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };

function TicketsGlobalView({
  tickets, contacts, onAdd, onUpdate, onDelete, canDelete,
}: {
  tickets: SupportTicket[];
  contacts: Contact[];
  onAdd: (data: Partial<SupportTicket>) => Promise<void>;
  onUpdate: (id: string, data: Partial<SupportTicket>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canDelete: boolean;
}) {
  const [filter, setFilter]   = useState<TicketStatus | "tous">("tous");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm]       = useState<Partial<SupportTicket>>({ status: "ouvert", priority: "normale", category: null });
  const isDark  = useDark();
  const today   = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const TICKET_PRIORITIES: Record<TicketPriority, string> = {
    basse: "#94a3b8", normale: "#60a5fa", haute: "#fb923c", urgente: "#f87171",
  };

  const sorted = useMemo(() => [...tickets].sort((a, b) => {
    const ao = PRIORITY_ORDER[a.priority], bo = PRIORITY_ORDER[b.priority];
    if (ao !== bo) return ao - bo;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }), [tickets]);

  const filtered = useMemo(() =>
    filter === "tous" ? sorted : sorted.filter(t => t.status === filter),
    [sorted, filter]);

  const counts = useMemo(() => ({
    tous:     tickets.length,
    ouvert:   tickets.filter(t => t.status === "ouvert").length,
    en_cours: tickets.filter(t => t.status === "en_cours").length,
    résolu:   tickets.filter(t => t.status === "résolu").length,
    fermé:    tickets.filter(t => t.status === "fermé").length,
  }), [tickets]);

  const stats = useMemo(() => {
    const open    = tickets.filter(t => t.status === "ouvert" || t.status === "en_cours");
    const breached = open.filter(t => computeSla(t).breached).length;
    const resolved = tickets.filter(t => t.resolved_at && t.resolved_at >= weekAgo).length;
    const urgent   = tickets.filter(t => t.priority === "urgente" && (t.status === "ouvert" || t.status === "en_cours")).length;
    return { open: open.length, breached, resolved, urgent };
  }, [tickets, weekAgo]);

  async function save() {
    if (!form.title) return;
    await onAdd(form);
    setAddModal(false);
    setForm({ status: "ouvert", priority: "normale", category: null });
  }

  return (
    <div className="space-y-4">
      {/* ── Stats SLA ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Ouverts",           value: stats.open,     color: "#60a5fa" },
          { label: "Urgents",           value: stats.urgent,   color: "#f87171" },
          { label: "SLA dépassé",       value: stats.breached, color: "#fb923c" },
          { label: "Résolus (7 jours)", value: stats.resolved, color: "#34d399" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-2.5 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-white"}`}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className={`text-[11px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtres + bouton ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {(["tous","ouvert","en_cours","résolu","fermé"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1 text-xs font-bold transition-all"
              style={{ background: filter===f ? "rgba(201,165,90,0.15)" : "transparent", color: filter===f ? "#c9a55a" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}>
              {f === "tous" ? "Tous" : f === "en_cours" ? "En cours" : f.charAt(0).toUpperCase()+f.slice(1)}
              {counts[f] > 0 && <span className="ml-1.5 text-xs opacity-70">{counts[f]}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={11}/> Nouveau ticket
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={`py-16 text-center text-sm ${isDark ? "text-white/20" : "text-gray-300"}`}>
          <Ticket size={36} className="mx-auto mb-4 opacity-20"/>
          Aucun ticket {filter !== "tous" ? `"${filter}"` : ""}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map(ticket => {
              const sla = computeSla(ticket);
              const isOpen = ticket.status === "ouvert" || ticket.status === "en_cours";
              return (
                <motion.div key={ticket.id} layout initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, height:0 }}
                  className={`rounded-2xl border p-4 group ${isDark ? "border-white/[0.06]" : "border-gray-200"} ${sla.breached && isOpen ? (isDark ? "border-red-500/20" : "border-red-200") : ""}`}
                  style={{ background: isDark ? "rgba(7,8,14,0.8)" : "rgba(255,255,255,0.95)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{ticket.title}</p>
                        {ticket.category && (
                          <span className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/[0.05] text-white/40" : "bg-gray-100 text-gray-500"}`}>
                            {(() => { const Icon = TICKET_CATEGORIES[ticket.category].icon; return <Icon size={9} className="flex-shrink-0" />; })()}
                            {TICKET_CATEGORIES[ticket.category].label}
                          </span>
                        )}
                      </div>
                      {ticket.contact && (
                        <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>{ticket.contact.name}{ticket.contact.company ? ` · ${ticket.contact.company}` : ""}</p>
                      )}
                      {ticket.description && <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-white/35" : "text-gray-400"}`}>{ticket.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <Badge label={TICKET_STATUSES[ticket.status].label} color={TICKET_STATUSES[ticket.status].color}/>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${TICKET_PRIORITIES[ticket.priority]}18`, color: TICKET_PRIORITIES[ticket.priority] }}>
                        {ticket.priority}
                      </span>
                      {canDelete && (
                        <button onClick={() => onDelete(ticket.id)}
                          className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${isDark ? "text-white/20" : "text-gray-300"}`}>
                          <Trash2 size={11}/>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── SLA bar ──────────────────────────────── */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: sla.color }}>{sla.label}</span>
                      {isOpen && <span className={`text-[11px] ${isDark ? "text-white/20" : "text-gray-400"}`} title="Échéance SLA">⏱ {sla.deadlineStr}</span>}
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${sla.elapsed * 100}%`, backgroundColor: sla.color }}/>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="relative">
                      <select value={ticket.status}
                        onChange={e => {
                          const newStatus = e.target.value as TicketStatus;
                          const update: Partial<SupportTicket> = { status: newStatus };
                          if (newStatus === "résolu" && !ticket.resolved_at) {
                            update.resolved_at = new Date().toISOString();
                          }
                          onUpdate(ticket.id, update);
                        }}
                        className={`rounded-lg border pl-2 pr-6 py-1 text-xs outline-none appearance-none ${isDark ? "border-white/[0.08] bg-white/[0.05] text-white/60 [color-scheme:dark]" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                        {(["ouvert","en_cours","résolu","fermé"] as TicketStatus[]).map(s =>
                          <option key={s} value={s}>{TICKET_STATUSES[s].label}</option>)}
                      </select>
                      <ChevronDown size={8} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-white/30" : "text-gray-400"}`}/>
                    </div>
                    <p className={`text-xs ml-auto ${isDark ? "text-white/25" : "text-gray-400"}`}>{fmtDate(ticket.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setAddModal(false)}>
            <motion.div initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:40, opacity:0 }}
              transition={{ type:"spring", stiffness:300, damping:30 }}
              className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}
              style={{ background: isDark ? "rgba(7,8,14,0.98)" : "rgba(255,255,255,0.98)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className={`font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Nouveau ticket</h3>
                <button onClick={() => setAddModal(false)} className={isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}><X size={16}/></button>
              </div>
              <Input label="Objet *" placeholder="Décrire le problème…" value={form.title ?? ""} onChange={e => setForm(f=>({...f, title: e.target.value}))}/>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Priorité" value={form.priority ?? "normale"} onChange={e => setForm(f=>({...f, priority: e.target.value as TicketPriority}))}>
                  {(["urgente","haute","normale","basse"] as TicketPriority[]).map(p => (
                    <option key={p} value={p} style={{ color: TICKET_PRIORITIES[p] }}>
                      {p.charAt(0).toUpperCase()+p.slice(1)} · SLA {SLA_HOURS[p]}h
                    </option>
                  ))}
                </Select>
                <Select label="Catégorie" value={form.category ?? ""} onChange={e => setForm(f=>({...f, category: (e.target.value as TicketCategory) || null}))}>
                  <option value="">— Aucune —</option>
                  {(Object.entries(TICKET_CATEGORIES) as [TicketCategory, { label: string; icon: LucideIcon }][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </Select>
              </div>
              <Select label="Contact lié" value={form.contact_id ?? ""} onChange={e => setForm(f=>({...f, contact_id: e.target.value || null}))}>
                <option value="">— Aucun —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
              </Select>
              <Textarea label="Description" placeholder="Détails du ticket…" value={form.description ?? ""} onChange={e => setForm(f=>({...f, description: e.target.value}))}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAddModal(false)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                <button onClick={save} disabled={!form.title}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                  Créer le ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactDetail({
  contact, activities, opportunities, tasks, tickets,
  onClose, onUpdate, onDeleteContact,
  onAddActivity, onDeleteActivity,
  onAddTask, onToggleTask, onDeleteTask,
  onAddTicket, onUpdateTicket, onDeleteTicket,
  onAddOpportunity, onEmail,
  allContacts,
  perms,
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
  onAddOpportunity: (data: Partial<Opportunity>) => Promise<void>;
  onEmail: () => void;
  allContacts: Contact[];
  perms: { can_create: boolean; can_edit: boolean; can_delete: boolean };
}) {
  const [tab, setTab]       = useState<"infos" | "activites" | "opps" | "taches" | "tickets" | "documents">("infos");
  const [linkedDocs, setLinkedDocs] = useState<{ id: string; numero: string; type: string; statut: string; total_ttc: number; date_document: string }[]>([]);

  useEffect(() => {
    if (!contact.id) return;
    supabase.from("documents")
      .select("id,numero,type,statut,total_ttc,date_document")
      .eq("contact_id", contact.id)
      .order("date_document", { ascending: false })
      .limit(50)
      .then(({ data }) => setLinkedDocs((data as typeof linkedDocs) ?? []));
  }, [contact.id]);
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState<Partial<Contact>>({ ...contact });
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [quickNote, setQuickNote]     = useState("");
  const [newAct, setNewAct]           = useState<Partial<Activity> | null>(null);
  const [newOpp, setNewOpp] = useState<Partial<Opportunity> | null>(null);
  const [newTask, setNewTask] = useState<Partial<CrmTask> | null>(null);
  const [newTicket, setNewTicket] = useState<Partial<SupportTicket> | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [insight, setInsight]           = useState<ContactAIInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const isDark = useDark();

  async function fetchInsight() {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const res = await fetch("/api/crm-ia/contact-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contact.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInsightError(json.error ?? "Erreur analyse IA");
      } else {
        setInsight(json as ContactAIInsight);
      }
    } catch {
      setInsightError("Erreur réseau");
    } finally {
      setInsightLoading(false);
    }
  }

  const typeColor = CONTACT_TYPES[contact.type ?? "prospect"]?.color ?? "#60a5fa";

  async function saveEdit() {
    await onUpdate(form);
    setEditing(false);
  }

  const TABS = [
    { id: "infos",      label: "Infos",        icon: Briefcase },
    { id: "activites",  label: "Activités",    icon: Activity },
    { id: "opps",       label: "Opportunités", icon: TrendingUp },
    { id: "taches",     label: "Tâches",       icon: CheckSquare },
    { id: "tickets",    label: "Tickets",      icon: Ticket },
    { id: "documents",  label: "Documents",    icon: FileText },
  ] as const;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className={`fixed inset-y-0 right-0 z-40 flex flex-col w-full sm:w-[520px] border-l shadow-2xl overflow-hidden ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-white"}`}>

            <div className={`shrink-0 p-5 border-b ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
        <div className="flex items-start gap-3">
          <Avatar name={contact.name} color={typeColor} size={44}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base font-black ${isDark ? "text-white" : "text-gray-900"}`}>{contact.name}</h2>
              <Badge label={CONTACT_TYPES[contact.type ?? "prospect"]?.label ?? "Prospect"}
                color={typeColor}/>
              <Badge label={STATUSES[contact.status].label}
                color={STATUSES[contact.status].color} bg={STATUSES[contact.status].bg}/>
            </div>
            {contact.company && <p className={`text-sm mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>{contact.company}</p>}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {contact.email  && <a href={`mailto:${contact.email}`}  className={`flex items-center gap-1 text-xs transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}><Mail  size={10}/>{contact.email}</a>}
              {contact.phone  && <a href={`tel:${contact.phone}`}     className={`flex items-center gap-1 text-xs transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}><Phone size={10}/>{contact.phone}</a>}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={fetchInsight}
              disabled={insightLoading}
              title="Analyse IA du contact"
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${
                insight
                  ? (isDark ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30" : "bg-violet-100 text-violet-600 hover:bg-violet-200")
                  : (isDark ? "bg-white/[0.04] text-white/30 hover:text-violet-300 hover:bg-violet-500/10" : "bg-gray-100 text-gray-400 hover:text-violet-600 hover:bg-violet-50")
              }`}>
              {insightLoading ? <Loader2 size={13} className="animate-spin"/> : <Sparkles size={13}/>}
            </button>
            {contact.email && (
              <button onClick={onEmail} title={`Envoyer un email à ${contact.email}`}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300" : "bg-blue-50 text-blue-400 hover:bg-blue-100 hover:text-blue-600"}`}>
                <Send size={13}/>
              </button>
            )}
            {perms.can_edit && (
              <button onClick={() => setEditing(!editing)}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.08]" : "bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200"}`}>
                <Pencil size={13}/>
              </button>
            )}
            <button onClick={onClose}
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/[0.04] text-white/30 hover:text-white hover:bg-white/[0.08]" : "bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200"}`}>
              <X size={13}/>
            </button>
          </div>
        </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Opportunités", value: opportunities.length, color: "#a78bfa" },
            { label: "Tâches",       value: tasks.filter(t => !t.done).length, color: "#f59e0b" },
            { label: "Tickets",      value: tickets.filter(t => t.status !== "fermé").length, color: "#60a5fa" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2 text-center ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className={`text-[11px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Score de chaleur ─────────────────────────────── */}
        {(() => {
          const heat = computeHeatScore(activities, opportunities, tasks);
          return (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Flame size={13} className={isDark ? "text-white/30" : "text-gray-400"} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Chaleur contact</span>
                </div>
                <span className={`text-xs font-black`} style={{ color: heat.color }}>{heat.label} · {heat.score}</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${heat.score}%`, background: `linear-gradient(90deg, ${heat.color}99, ${heat.color})` }}/>
              </div>
            </div>
          );
        })()}

        {/* ── Note rapide ──────────────────────────────────── */}
        {perms.can_create && (
          <div className="mt-3">
            {!quickNoteOpen ? (
              <button onClick={() => setQuickNoteOpen(true)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
                <MessageSquare size={11}/> Note rapide
              </button>
            ) : (
              <div className={`rounded-xl border p-3 space-y-2 ${isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                <textarea
                  autoFocus
                  rows={3}
                  placeholder="Résumé, action à suivre, point important…"
                  value={quickNote}
                  onChange={e => setQuickNote(e.target.value)}
                  className={`w-full resize-none text-sm rounded-lg p-2 outline-none ${isDark ? "bg-white/[0.04] text-white placeholder-white/20 border border-white/[0.08]" : "bg-white text-gray-900 placeholder-gray-300 border border-gray-200"}`}
                />
                <div className="flex gap-2">
                  <button onClick={() => { setQuickNoteOpen(false); setQuickNote(""); }}
                    className={`flex-1 text-xs rounded-lg border py-1.5 transition-colors ${isDark ? "border-white/[0.08] text-white/40 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                    Annuler
                  </button>
                  <button
                    disabled={!quickNote.trim()}
                    onClick={async () => {
                      await onAddActivity({
                        type: "note",
                        title: "Note rapide",
                        description: quickNote.trim(),
                        activity_date: new Date().toISOString().split("T")[0],
                        duration_min: 0,
                      });
                      setQuickNote("");
                      setQuickNoteOpen(false);
                    }}
                    className="flex-1 text-xs rounded-lg py-1.5 font-bold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Insight IA ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(insight || insightError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`shrink-0 border-b px-5 py-3 ${isDark ? "border-white/[0.06] bg-violet-500/[0.04]" : "border-violet-100 bg-violet-50/60"}`}>
            {insightError ? (
              <p className="text-xs text-red-400">{insightError}</p>
            ) : insight && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={11} className={isDark ? "text-violet-400" : "text-violet-500"}/>
                    <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-violet-400/70" : "text-violet-500/80"}`}>Analyse IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      insight.risque === "élevé"  ? "bg-red-500/15 text-red-400" :
                      insight.risque === "moyen"  ? "bg-amber-500/15 text-amber-400" :
                                                    "bg-emerald-500/15 text-emerald-400"
                    }`}>Risque {insight.risque}</span>
                    <span className={`text-xs ${isDark ? "text-white/25" : "text-gray-400"}`}>
                      Score {insight.score_engagement}/100
                    </span>
                    <button onClick={() => { setInsight(null); setInsightError(null); }}
                      className={`text-xs transition-opacity ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
                      <X size={10}/>
                    </button>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-gray-600"}`}>{insight.resume}</p>
                <div className={`rounded-lg px-2.5 py-2 border ${isDark ? "border-violet-500/20 bg-violet-500/[0.06]" : "border-violet-200 bg-violet-50"}`}>
                  <div className="flex items-start gap-1.5">
                    <Zap size={10} className={`mt-0.5 shrink-0 ${isDark ? "text-violet-400" : "text-violet-500"}`}/>
                    <p className={`text-xs font-semibold ${isDark ? "text-violet-300" : "text-violet-700"}`}>{insight.prochaine_action}</p>
                  </div>
                </div>
                {insight.tags_suggeres?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {insight.tags_suggeres.map(tag => (
                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-md ${isDark ? "bg-white/[0.06] text-white/40" : "bg-gray-100 text-gray-500"}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

            <div className={`shrink-0 flex border-b overflow-x-auto ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id ? (isDark ? "border-white text-white" : "border-gray-900 text-gray-900") : (isDark ? "border-transparent text-white/30 hover:text-white/60" : "border-transparent text-gray-400 hover:text-gray-600")}`}>
            <t.icon size={10}/>{t.label}
          </button>
        ))}
      </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

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
                    <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Intérêt (0-5)</label>
                    <div className="flex gap-1 mt-1.5">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, interest_level: n }))}
                          className="transition-colors" style={{ color: (form.interest_level ?? 0) >= n ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
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
                    className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                  <button onClick={saveEdit}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                      <item.icon size={11} className={`mt-0.5 shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
                      <div>
                        <p className={`text-[11px] uppercase tracking-wider ${isDark ? "text-white/25" : "text-gray-400"}`}>{item.label}</p>
                        <p className={`text-sm break-all ${isDark ? "text-white/70" : "text-gray-700"}`}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                                <div className="flex gap-3 flex-wrap">
                  {contact.budget && contact.budget > 0 && (
                    <div className={`rounded-xl px-3 py-2 ${isDark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                      <p className={`text-[11px] mb-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}>Budget</p>
                      <p className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>{fmtEur(contact.budget)}</p>
                    </div>
                  )}
                  {contact.priority && contact.priority !== "normal" && (
                    <div className={`rounded-xl px-3 py-2 ${isDark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                      <p className={`text-[11px] mb-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}>Priorité</p>
                      <p className="text-sm font-bold" style={{ color: PRIORITIES[contact.priority].color }}>
                        {PRIORITIES[contact.priority].label}
                      </p>
                    </div>
                  )}
                  {contact.interest_level && contact.interest_level > 0 && (
                    <div className={`rounded-xl px-3 py-2 ${isDark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                      <p className={`text-[11px] mb-1 ${isDark ? "text-white/25" : "text-gray-400"}`}>Intérêt</p>
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
                  <div className={`rounded-xl p-3 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                    <p className={`text-[11px] uppercase tracking-wider mb-1 ${isDark ? "text-white/25" : "text-gray-400"}`}>Notes</p>
                    <p className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? "text-white/60" : "text-gray-600"}`}>{contact.notes}</p>
                  </div>
                )}

                                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {contact.tags.map(tag => (
                      <span key={tag} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${isDark ? "bg-white/[0.05] text-white/40" : "bg-gray-100 text-gray-500"}`}>
                        <Hash size={8}/>{tag}
                      </span>
                    ))}
                  </div>
                )}

                                {perms.can_delete && (
                  <div className={`pt-2 border-t ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                    {!confirmDel ? (
                      <button onClick={() => setConfirmDel(true)}
                        className="text-xs text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1">
                        <Trash2 size={10}/> Supprimer ce contact
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400">Confirmer la suppression ?</span>
                        <button onClick={onDeleteContact} className="text-xs font-bold text-red-400 hover:text-red-300">Oui</button>
                        <button onClick={() => setConfirmDel(false)} className={`text-xs ${isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>Non</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

                {tab === "activites" && (
          <div className="space-y-4">
            <button onClick={() => setNewAct({ type: "note", activity_date: new Date().toISOString().split("T")[0] })}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
              <Plus size={13}/> Ajouter une activité
            </button>

            {newAct !== null && (
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
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
                  <button onClick={() => setNewAct(null)} className={`flex-1 rounded-xl border py-2 text-xs transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                  <button disabled={!newAct.title}
                    onClick={async () => { await onAddActivity(newAct); setNewAct(null); }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {activities.length === 0 && !newAct && (
              <p className={`text-center text-sm py-6 ${isDark ? "text-white/20" : "text-gray-300"}`}>Aucune activité enregistrée</p>
            )}

                        <div className="space-y-5">
              {groupActivitiesByPeriod(
                [...activities].sort((a, b) => b.activity_date.localeCompare(a.activity_date))
              ).map(group => (
                <div key={group.label}>
                  <div className={`flex items-center gap-2 mb-3`}>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? "text-white/25" : "text-gray-400"}`}>{group.label}</span>
                    <div className={`flex-1 h-px ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`}/>
                  </div>
                  <div className="relative space-y-0">
                    <div className={`absolute left-[14px] top-0 bottom-0 w-px ${isDark ? "bg-white/[0.05]" : "bg-gray-200"}`}/>
                    {group.items.map(act => {
                      const Icon  = ACTIVITY_ICONS[act.type];
                      const color = ACTIVITY_COLORS[act.type];
                      const isEmail = act.type === "email";
                      return (
                        <div key={act.id} className="flex gap-3 pb-5 group relative">
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 border ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}
                            style={{ backgroundColor: `${color}22` }}>
                            <Icon size={11} style={{ color }}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{act.title}</p>
                              {perms.can_delete && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => onDeleteActivity(act.id)} className={`${isDark ? "text-white/20" : "text-gray-300"} hover:text-red-400`}>
                                    <Trash2 size={10}/>
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(act.activity_date)}</p>
                            {isEmail && act.description ? (
                              <EmailActivityPreview body={act.description} isDark={isDark}/>
                            ) : act.description ? (
                              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-white/40" : "text-gray-500"}`}>{act.description}</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                {tab === "opps" && (
          <div className="space-y-3">
            <button onClick={() => setNewOpp({ stage: "nouveau", amount: 0, probability: 20, contact_id: contact.id })}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
              <Plus size={13}/> Nouvelle opportunité
            </button>

            {newOpp !== null && (
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                <Input label="Titre *" placeholder="Ex: Contrat annuel SaaS" value={newOpp.title ?? ""}
                  onChange={e => setNewOpp(o => ({ ...o, title: e.target.value }))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Étape" value={newOpp.stage ?? "nouveau"} onChange={e => setNewOpp(o => ({ ...o, stage: e.target.value as OppStage }))}>
                    {(["nouveau","qualifié","proposition","négociation","gagné","perdu"] as OppStage[]).map(s =>
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </Select>
                  <Input label="Montant (€)" type="number" value={newOpp.amount ?? ""}
                    onChange={e => setNewOpp(o => ({ ...o, amount: +e.target.value }))}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Probabilité (%)" type="number" min={0} max={100} value={newOpp.probability ?? ""}
                    onChange={e => setNewOpp(o => ({ ...o, probability: +e.target.value }))}/>
                  <Input label="Clôture prévue" type="date" value={newOpp.close_date ?? ""}
                    onChange={e => setNewOpp(o => ({ ...o, close_date: e.target.value || null }))}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNewOpp(null)} className={`flex-1 rounded-xl border py-2 text-xs transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                  <button disabled={!newOpp.title}
                    onClick={async () => { await onAddOpportunity(newOpp); setNewOpp(null); }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>Créer</button>
                </div>
              </div>
            )}

            {opportunities.length === 0 && !newOpp && (
              <p className={`text-center text-sm py-6 ${isDark ? "text-white/20" : "text-gray-300"}`}>Aucune opportunité</p>
            )}
            {opportunities.map(opp => (
              <div key={opp.id} className={`rounded-2xl border p-4 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{opp.title}</p>
                    {opp.product_service && <p className={`text-xs mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{opp.product_service}</p>}
                  </div>
                  <Badge label={STAGES[opp.stage].label} color={STAGES[opp.stage].color}/>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {opp.amount > 0 && <span className="text-sm font-black" style={{ color: STAGES[opp.stage].color }}>{fmtEur(opp.amount)}</span>}
                  {opp.probability > 0 && <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>{opp.probability}% proba.</span>}
                  {opp.close_date && <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}><Calendar size={9} className="inline mr-0.5"/>{fmtDate(opp.close_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

                {tab === "taches" && (
          <div className="space-y-3">
            <button onClick={() => setNewTask({ type: "action", priority: "normal", contact_id: contact.id })}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
              <Plus size={13}/> Nouvelle tâche
            </button>

            {newTask !== null && (
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                <Input label="Titre *" value={newTask.title ?? ""} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={newTask.type ?? "action"} onChange={e => setNewTask(t => ({ ...t, type: e.target.value as TaskType }))}>
                    {(["action","relance","rdv","deadline","appel"] as TaskType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input label="Échéance" type="date" value={newTask.due_date ?? ""} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value || null }))}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNewTask(null)} className={`flex-1 rounded-xl border py-2 text-xs transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                  <button disabled={!newTask.title}
                    onClick={async () => { await onAddTask(newTask); setNewTask(null); }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>Créer</button>
                </div>
              </div>
            )}

            {tasks.map(task => {
              const isLate = !task.done && task.due_date && task.due_date < today;
              return (
                <div key={task.id} className={`flex items-start gap-3 rounded-2xl border p-3 group ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <button onClick={() => onToggleTask(task.id, !task.done)} style={{ color: task.done ? "#34d399" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>
                    {task.done ? <CheckSquare size={15}/> : <Square size={15}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${task.done ? (isDark ? "line-through text-white/30" : "line-through text-gray-400") : (isDark ? "text-white" : "text-gray-900")}`}>{task.title}</p>
                    {task.due_date && (
                      <p className={`text-xs mt-0.5 flex items-center gap-1 ${isLate ? "text-red-400" : (isDark ? "text-white/30" : "text-gray-400")}`}>
                        <Calendar size={9}/>{fmtDate(task.due_date)}
                      </p>
                    )}
                  </div>
                  {perms.can_delete && (
                    <button onClick={() => onDeleteTask(task.id)} className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${isDark ? "text-white/20" : "text-gray-300"}`}>
                      <Trash2 size={11}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

                {tab === "tickets" && (
          <div className="space-y-3">
            <button onClick={() => setNewTicket({ status: "ouvert", priority: "normale", contact_id: contact.id })}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
              <Plus size={13}/> Nouveau ticket
            </button>

            {newTicket !== null && (
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
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
                  <button onClick={() => setNewTicket(null)} className={`flex-1 rounded-xl border py-2 text-xs transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
                  <button disabled={!newTicket.title}
                    onClick={async () => { await onAddTicket(newTicket); setNewTicket(null); }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>Créer</button>
                </div>
              </div>
            )}

            {tickets.map(ticket => (
              <div key={ticket.id} className={`rounded-2xl border p-4 group ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{ticket.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={TICKET_STATUSES[ticket.status].label} color={TICKET_STATUSES[ticket.status].color}/>
                    {perms.can_delete && (
                      <button onClick={() => onDeleteTicket(ticket.id)} className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${isDark ? "text-white/20" : "text-gray-300"}`}>
                        <Trash2 size={10}/>
                      </button>
                    )}
                  </div>
                </div>
                {ticket.description && <p className={`text-xs mt-1.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{ticket.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Select value={ticket.status} onChange={e => onUpdateTicket(ticket.id, { status: e.target.value as TicketStatus })}
                    className="text-xs !py-1 !px-2 rounded-lg">
                    {(["ouvert","en_cours","résolu","fermé"] as TicketStatus[]).map(s =>
                      <option key={s} value={s}>{TICKET_STATUSES[s].label}</option>)}
                  </Select>
                  <p className={`text-xs ml-auto ${isDark ? "text-white/25" : "text-gray-400"}`}>{fmtDate(ticket.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-2">
            {linkedDocs.length === 0 ? (
              <div className={`py-12 text-center text-sm ${isDark ? "text-white/20" : "text-gray-300"}`}>
                <FileText size={32} className="mx-auto mb-3 opacity-20"/>
                Aucun document lié à ce contact
              </div>
            ) : linkedDocs.map(doc => {
              const isFacture = doc.type === "facture";
              const isDevis   = doc.type === "devis";
              const statusColor = doc.statut === "payé" ? "#22c55e" : doc.statut === "en_retard" ? "#ef4444" : doc.statut === "envoyé" ? "#38bdf8" : isDark ? "rgba(255,255,255,0.3)" : "#9ca3af";
              return (
                <a key={doc.id} href="/client/factures"
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${isDark ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]" : "border-gray-100 bg-white hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isFacture ? (isDark ? "bg-amber-400/10" : "bg-amber-50") : isDevis ? (isDark ? "bg-blue-400/10" : "bg-blue-50") : (isDark ? "bg-purple-400/10" : "bg-purple-50")}`}>
                      <FileText size={13} style={{ color: isFacture ? "#f59e0b" : isDevis ? "#38bdf8" : "#a78bfa" }}/>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{doc.numero || "(brouillon)"}</p>
                      <p className={`text-xs capitalize ${isDark ? "text-white/30" : "text-gray-400"}`}>{doc.type} · {fmtDate(doc.date_document)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>{fmtEur(doc.total_ttc)}</p>
                    <p className="text-xs font-semibold" style={{ color: statusColor }}>{doc.statut}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmailActivityPreview({ body, isDark }: { body: string; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const preview = body.split("\n").filter(Boolean).slice(0, 2).join(" · ");
  return (
    <div className="mt-1">
      <button onClick={() => setExpanded(v => !v)}
        className={`flex items-center gap-1 text-xs transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
        <ChevronDown size={9} className={`transition-transform ${expanded ? "rotate-180" : ""}`}/>
        {expanded ? "Masquer" : preview || "Voir le corps"}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}>
            <pre className={`mt-1.5 text-xs leading-relaxed whitespace-pre-wrap rounded-lg p-2.5 ${isDark ? "bg-white/[0.04] text-white/50" : "bg-gray-50 text-gray-600"}`}>
              {body}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmailComposeModal({ contact, customTemplates, onClose, onSent, onSaveTemplate, onDeleteTemplate }: {
  contact: Contact;
  customTemplates: CustomEmailTemplate[];
  onClose: () => void;
  onSent: (subject: string, body: string) => void;
  onSaveTemplate: (t: Omit<CustomEmailTemplate, "id">) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}) {
  const [subject,      setSubject]      = useState("");
  const [body,         setBody]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [newTmplOpen,  setNewTmplOpen]  = useState(false);
  const [newTmplName,  setNewTmplName]  = useState("");
  const [newTmplSubj,  setNewTmplSubj]  = useState("");
  const [newTmplBody,  setNewTmplBody]  = useState("");
  const [savingTmpl,   setSavingTmpl]   = useState(false);
  const [previewMode,  setPreviewMode]  = useState(false);
  const isDark = useDark();

  const fill = (s: string, b: string) => {
    setSubject(resolveVars(s, contact));
    setBody(resolveVars(b, contact));
    setPreviewMode(false);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    if (contact.email) {
      window.open(
        `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        "_blank",
      );
    }
    onSent(subject, body);
    setSending(false);
  };

  const handleSaveTemplate = async () => {
    if (!newTmplName.trim() || !newTmplSubj.trim() || !newTmplBody.trim()) return;
    setSavingTmpl(true);
    await onSaveTemplate({ name: newTmplName.trim(), subject: newTmplSubj.trim(), body: newTmplBody.trim() });
    setNewTmplName(""); setNewTmplSubj(""); setNewTmplBody("");
    setNewTmplOpen(false);
    setSavingTmpl(false);
  };

  const allTemplates: { id: string; displayName: string; subject: string; body: string; custom: boolean }[] = [
    ...EMAIL_TEMPLATES.map(t => ({ id: t.id, displayName: t.label, subject: t.subject, body: t.body, custom: false })),
    ...customTemplates.map(t => ({ id: t.id, displayName: t.name, subject: t.subject, body: t.body, custom: true })),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 max-h-[92vh] overflow-y-auto ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}
        style={{ background: isDark ? "rgba(7,8,14,0.98)" : "rgba(255,255,255,0.98)" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "#60a5fa18", border: "1px solid #60a5fa30" }}>
              <Mail size={14} style={{ color: "#60a5fa" }}/>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Composer un email</h3>
              <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>{contact.email || "Aucun email enregistré"}</p>
            </div>
          </div>
          <button onClick={onClose} className={`transition-colors ${isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}><X size={16}/></button>
        </div>

        {/* ── Templates ──────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-gray-400"}`}>Templates</p>
            <button onClick={() => setNewTmplOpen(v => !v)}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${isDark ? "text-white/25 hover:text-white/50" : "text-gray-400 hover:text-gray-600"}`}>
              <Plus size={10}/> Nouveau
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTemplates.map(tmpl => (
              <div key={tmpl.id} className="relative group flex items-center gap-0.5">
                <button onClick={() => fill(tmpl.subject, tmpl.body)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${isDark ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-white/60 hover:text-white" : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700"}`}>
                  {tmpl.custom && <span className="text-[10px] mr-1" style={{ color: "#c9a55a" }}>★</span>}
                  {tmpl.displayName}
                </button>
                {tmpl.custom && (
                  <button onClick={() => onDeleteTemplate(tmpl.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}
                    title="Supprimer ce template">
                    <X size={9}/>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Nouveau template inline */}
          <AnimatePresence>
            {newTmplOpen && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                className={`mt-3 rounded-2xl border p-3 space-y-2 overflow-hidden ${isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Nouveau template</p>
                <input value={newTmplName} onChange={e => setNewTmplName(e.target.value)} placeholder="Nom du template…"
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20" : "border-gray-200 bg-white text-gray-900 placeholder-gray-400"}`}/>
                <input value={newTmplSubj} onChange={e => setNewTmplSubj(e.target.value)} placeholder="Objet (ex: Suivi {société})…"
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20" : "border-gray-200 bg-white text-gray-900 placeholder-gray-400"}`}/>
                <textarea value={newTmplBody} onChange={e => setNewTmplBody(e.target.value)} rows={4} placeholder={"Corps du template…\nVariables : {nom}, {société}, {date}, {budget}"}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none resize-none ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20" : "border-gray-200 bg-white text-gray-900 placeholder-gray-400"}`}/>
                {/* Variables helper */}
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.map(v => (
                    <button key={v.token} title={v.hint}
                      onClick={() => setNewTmplBody(b => b + v.token)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-mono border transition-all ${isDark ? "border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70" : "border-gray-200 bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
                      {v.token}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setNewTmplOpen(false)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${isDark ? "border-white/[0.08] text-white/40 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                    Annuler
                  </button>
                  <button onClick={handleSaveTemplate} disabled={savingTmpl || !newTmplName.trim()}
                    className="flex-1 rounded-lg py-1.5 text-xs font-bold disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    {savingTmpl ? "Sauvegarde…" : "Sauvegarder"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Champs email ───────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Objet</label>
            {subject && (
              <button onClick={() => setPreviewMode(v => !v)}
                className={`text-[11px] transition-colors ${isDark ? "text-white/25 hover:text-white/50" : "text-gray-400 hover:text-gray-600"}`}>
                {previewMode ? "Masquer aperçu" : "Aperçu"}
              </button>
            )}
          </div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet de l'email…"
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20 focus:border-white/20" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-gray-300"}`}/>
        </div>

        <div className="space-y-1">
          <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Message</label>
          {previewMode ? (
            <div className={`w-full rounded-xl border px-3 py-2.5 text-sm min-h-[140px] whitespace-pre-wrap ${isDark ? "border-white/[0.08] bg-white/[0.02] text-white/80" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
              {resolveVars(body, contact) || <span className="opacity-30">Votre message…</span>}
            </div>
          ) : (
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Votre message…"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20 focus:border-white/20" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-gray-300"}`}/>
          )}
        </div>

        {/* ── Variables helper ───────────────────────────── */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className={`text-[11px] mr-1 ${isDark ? "text-white/20" : "text-gray-400"}`}>Variables :</span>
          {TEMPLATE_VARIABLES.map(v => (
            <button key={v.token} title={v.hint}
              onClick={() => setBody(b => b + v.token)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono border transition-all ${isDark ? "border-white/[0.08] bg-white/[0.03] text-white/35 hover:text-white/60" : "border-gray-200 bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
              {v.token}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
          <button onClick={send} disabled={sending || !subject.trim() || !body.trim() || !contact.email}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" }}>
            {sending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
            {sending ? "Envoi…" : contact.email ? "Ouvrir client email" : "Pas d'email"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CRMPage() {
  const router = useRouter();

  const [contacts,        setContacts]        = useState<Contact[]>([]);
  const [contactsTotal,   setContactsTotal]   = useState(0);
  const [contactsPage,    setContactsPage]    = useState(1);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [activities,      setActivities]      = useState<Activity[]>([]);
  const [opportunities,   setOpportunities]   = useState<Opportunity[]>([]);
  const [tasks,           setTasks]           = useState<CrmTask[]>([]);
  const [tickets,         setTickets]         = useState<SupportTicket[]>([]);
  const [orgMembers,      setOrgMembers]      = useState<OrgMember[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomEmailTemplate[]>([]);

  const [loading,       setLoading]       = useState(true);
  const [mainTab,       setMainTab]       = useState<"contacts" | "pipeline" | "taches" | "tickets" | "rapport">("contacts");
  const [selected,      setSelected]      = useState<Contact | null>(null);

  const [query,         setQuery]         = useState("");
  const [filterStatus,  setFilterStatus]  = useState<ContactStatus | "tous">("tous");
  const [filterType,    setFilterType]    = useState<ContactType | "tous">("tous");
  const [sortBy,        setSortBy]        = useState<"date" | "name" | "budget" | "relance" | "score">("date");

  const [addModal,      setAddModal]      = useState(false);
  const [editContact,   setEditContact]   = useState<Contact | null>(null);
  const [emailContact,  setEmailContact]  = useState<Contact | null>(null);
  const [form,          setForm]          = useState<Partial<Contact>>({ status: "prospect", type: "prospect" });
  const [formErrors,    setFormErrors]    = useState<Record<string, string>>({});
  const [saveError,     setSaveError]     = useState("");
  const [corbeilleOpen, setCorbeilleOpen] = useState(false);
  const [deletedContacts, setDeletedContacts] = useState<Contact[]>([]);
  const [dupWarning,    setDupWarning]    = useState<{ contact: Contact; onConfirm: () => void } | null>(null);
  const [importPreview, setImportPreview] = useState<{
    rows: Array<Partial<Contact>>;
    skipped: number;
    invalid: number;
    fileName: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const { isDark } = useTheme();
  const orgState  = useOrganization();
  const orgId     = orgState.status === "ready" ? orgState.org.id : null;
  const perms     = useCrmPermissions();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
      else if (process.env.NODE_ENV !== "development") router.replace("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CONTACTS_PAGE_SIZE = 50;

  const buildContactsQuery = useCallback((
    pg: number, q: string, status: ContactStatus | "tous",
    type: ContactType | "tous", sort: "date" | "name" | "budget" | "relance" | "score",
    withCount: boolean,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qb: any = supabase.from("contacts")
      .select("*", withCount ? { count: "exact" } : undefined)
      .is("deleted_at", null);
    if (q.trim()) {
      const esc = q.replace(/[%_]/g, "\\$&");
      qb = qb.or(`name.ilike.%${esc}%,company.ilike.%${esc}%,email.ilike.%${esc}%,phone.ilike.%${esc}%`);
    }
    if (status !== "tous") qb = qb.eq("status", status);
    if (type   !== "tous") qb = qb.eq("type",   type);
    switch (sort) {
      case "name":    qb = qb.order("name",         { ascending: true });  break;
      case "budget":  qb = qb.order("budget",       { ascending: false, nullsFirst: false }); break;
      case "relance": qb = qb.order("next_relance", { ascending: true,  nullsFirst: false }); break;
      default:        qb = qb.order("updated_at",   { ascending: false }); break;
    }
    if (pg > 0) qb = qb.range((pg - 1) * CONTACTS_PAGE_SIZE, pg * CONTACTS_PAGE_SIZE - 1);
    return qb;
  }, []);

  const loadContactPage = useCallback(async (
    pg: number, q: string, status: ContactStatus | "tous",
    type: ContactType | "tous", sort: "date" | "name" | "budget" | "relance" | "score",
  ) => {
    setContactsLoading(true);
    const { data, count, error } = await buildContactsQuery(pg, q, status, type, sort, true);
    setContactsLoading(false);
    if (error) { toast("Impossible de charger les contacts", "error"); return; }
    let list = (data ?? []) as Contact[];
    if (sort === "score") {
      list = [...list].sort((a, b) => {
        const sa = computeLeadScore(a, activities.filter(x => x.contact_id === a.id).length);
        const sb = computeLeadScore(b, activities.filter(x => x.contact_id === b.id).length);
        return sb - sa;
      });
    }
    setContacts(list);
    setContactsTotal(count ?? 0);
    setContactsPage(pg);
  }, [buildContactsQuery, activities]);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // ⚠️ On évite les jointures FK (*, contacts(name,company)) qui dépendent
      // du cache schema PostgREST — on résout les noms de contacts localement.
      // Pas de filtre user_id — RLS garantit l'isolation (user_id = auth.uid() OU org member)
      const [ctRes, acRes, opRes, tkRes, tiRes] = await Promise.all([
        buildContactsQuery(1, "", "tous", "tous", "date", true),
        supabase.from("contact_activities").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("crm_tasks").select("*").order("due_date", { ascending: true }).limit(500),
        supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(500),
      ]);

      const contactsList = (ctRes.data ?? []) as Contact[];
      const lookupContact = (contactId: unknown): Pick<Contact, "name"|"company"> | undefined => {
        const c = contactsList.find(x => x.id === contactId);
        return c ? { name: c.name, company: c.company } : undefined;
      };

      if (ctRes.error) toast("Impossible de charger les contacts", "error");
      else {
        setContacts(contactsList);
        setContactsTotal(ctRes.count ?? 0);
        setContactsPage(1);
      }

      if (acRes.error) {
        console.error("[CRM] activities error:", acRes.error);
        if (acRes.error.code !== "42P01") toast(`Activités — ${acRes.error.code ?? "?"}: ${acRes.error.message}`, "error");
      } else if (acRes.data) setActivities(acRes.data as Activity[]);

      if (opRes.error) {
        console.error("[CRM] opportunities error:", opRes.error);
        if (opRes.error.code !== "42P01") toast(`Opportunités — ${opRes.error.code ?? "?"}: ${opRes.error.message}`, "error");
      } else if (opRes.data) setOpportunities(opRes.data.map((o: Record<string, unknown>) => ({
        ...o, contact: lookupContact(o.contact_id),
      })) as Opportunity[]);

      if (tkRes.error) {
        if (tkRes.error.code !== "42P01") toast("Impossible de charger les tâches", "error");
      } else if (tkRes.data) setTasks(tkRes.data.map((t: Record<string, unknown>) => ({
        ...t, contact: lookupContact(t.contact_id),
      })) as CrmTask[]);

      if (tiRes.error) {
        if (tiRes.error.code !== "42P01") toast("Impossible de charger les tickets", "error");
      } else if (tiRes.data) setTickets(tiRes.data.map((t: Record<string, unknown>) => ({
        ...t, contact: lookupContact(t.contact_id),
      })) as SupportTicket[]);

    } catch {
      // Erreur réseau — silencieux
    } finally {
      setLoading(false);
    }
  }, [userId, buildContactsQuery]);

  useEffect(() => { if (userId) loadAll(); }, [userId, loadAll]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("organization_members")
      .select("user_id, display_name, role")
      .eq("organization_id", orgId)
      .is("suspended_at", null)
      .then(({ data }) => setOrgMembers((data as OrgMember[]) ?? []));
    supabase.from("email_templates")
      .select("id, name, subject, body")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setCustomTemplates((data as CustomEmailTemplate[]) ?? []));
  }, [orgId]);

  // Recharge la page 1 côté serveur à chaque changement de filtre/tri (debounce 300ms)
  const filtersRef = useRef({ query, filterStatus, filterType, sortBy });
  filtersRef.current = { query, filterStatus, filterType, sortBy };
  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      const f = filtersRef.current;
      loadContactPage(1, f.query, f.filterStatus, f.filterType, f.sortBy);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterStatus, filterType, sortBy, userId]);

  async function saveCustomTemplate(t: Omit<CustomEmailTemplate, "id">) {
    if (!orgId || !userId) return;
    const { data, error } = await supabase.from("email_templates")
      .insert({ ...t, org_id: orgId, created_by: userId })
      .select("id, name, subject, body")
      .single();
    if (!error && data) setCustomTemplates(ts => [...ts, data as CustomEmailTemplate]);
  }

  async function deleteCustomTemplate(id: string) {
    await supabase.from("email_templates").delete().eq("id", id);
    setCustomTemplates(ts => ts.filter(t => t.id !== id));
  }

  async function doSaveContact() {
    if (!userId) return;
    if (editContact) {
      const { error } = await supabase.from("contacts").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editContact.id);
      if (error) { setSaveError(error.message); return; }
      setContacts(cs => cs.map(c => c.id === editContact.id ? { ...c, ...form } as Contact : c));
      if (selected?.id === editContact.id) setSelected(s => s ? { ...s, ...form } as Contact : s);
      toast("Contact mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("contacts").insert({ ...form, user_id: userId, organization_id: orgId ?? null }).select().single();
      if (error || !data) { setSaveError(error?.message ?? "Erreur de création"); return; }
      setContacts(cs => [data as Contact, ...cs]);
      toast("Contact créé", "success");
    }
    setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); setFormErrors({}); setSaveError("");
  }

  async function saveContact() {
    if (!userId) return;
    setSaveError("");
    const errors = validate(ContactSchema, form);
    if (errors !== null) { setFormErrors(errors); return; }
    // Détection doublon email (uniquement à la création)
    if (!editContact && form.email) {
      const existing = contacts.find(c => c.email === form.email);
      if (existing) {
        setDupWarning({ contact: existing, onConfirm: doSaveContact });
        return;
      }
    }
    await doSaveContact();
  }

  async function deleteContact(id: string) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("contacts").update({ deleted_at: now }).eq("id", id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    const removed = contacts.find(c => c.id === id);
    setContacts(cs => cs.filter(c => c.id !== id));
    if (removed) setDeletedContacts(ds => [{ ...removed, deleted_at: now }, ...ds]);
    setSelected(null);
    toast("Contact archivé — restaurable depuis la corbeille", "success");
  }

  async function restoreContact(id: string) {
    const { error } = await supabase.from("contacts").update({ deleted_at: null }).eq("id", id);
    if (error) { toast("Erreur lors de la restauration", "error"); return; }
    const restored = deletedContacts.find(c => c.id === id);
    setDeletedContacts(ds => ds.filter(c => c.id !== id));
    if (restored) setContacts(cs => [{ ...restored, deleted_at: null }, ...cs]);
    toast("Contact restauré", "success");
  }

  async function purgeContact(id: string) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression définitive", "error"); return; }
    setDeletedContacts(ds => ds.filter(c => c.id !== id));
    toast("Contact supprimé définitivement", "success");
  }

  async function loadDeletedContacts() {
    const { data } = await supabase.from("contacts")
      .select("id,name,company,email,deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50);
    setDeletedContacts((data as Contact[]) ?? []);
  }

  async function updateContact(id: string, data: Partial<Contact>) {
    const { error } = await supabase.from("contacts").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast("Erreur", "error"); return; }
    setContacts(cs => cs.map(c => c.id === id ? { ...c, ...data } as Contact : c));
    setSelected(s => s?.id === id ? { ...s, ...data } as Contact : s);
    toast("Enregistré", "success");
  }

    async function addActivity(contactId: string, data: Partial<Activity>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("contact_activities").insert({
      ...data, user_id: userId, contact_id: contactId, organization_id: orgId ?? null,
    }).select().single();
    if (error) { toast("Erreur lors de l'ajout de l'activité", "error"); return; }
    if (d) { setActivities(a => [d as Activity, ...a]); toast("Activité ajoutée", "success"); }
  }

  async function deleteActivity(id: string) {
    const { error } = await supabase.from("contact_activities").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setActivities(a => a.filter(x => x.id !== id));
  }

    async function addOpportunity(data: Partial<Opportunity>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("opportunities").insert({ ...data, user_id: userId, organization_id: orgId ?? null }).select().single();
    if (error) { toast("Erreur lors de la création de l'opportunité", "error"); return; }
    if (d) {
      const opp = d as Opportunity;
      if (opp.contact_id) {
        const c = contacts.find(c => c.id === opp.contact_id);
        if (c) opp.contact = { name: c.name, company: c.company };
      }
      setOpportunities(o => [opp, ...o]);
      toast("Opportunité créée", "success");
    }
  }

  async function updateOpportunity(id: string, data: Partial<Opportunity>) {
    const { error } = await supabase.from("opportunities").update(data).eq("id", id);
    if (error) { toast("Erreur de mise à jour de l'opportunité", "error"); return; }
    setOpportunities(o => o.map(op => op.id === id ? { ...op, ...data } : op));
    toast("Opportunité mise à jour", "success");
  }

  async function deleteOpportunity(id: string) {
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setOpportunities(o => o.filter(op => op.id !== id));
  }

    async function addTask(data: Partial<CrmTask>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("crm_tasks").insert({ ...data, user_id: userId, organization_id: orgId ?? null }).select().single();
    if (error) { toast("Erreur lors de la création de la tâche", "error"); return; }
    if (d) {
      const task = d as CrmTask;
      if (task.contact_id) {
        const c = contacts.find(c => c.id === task.contact_id);
        if (c) task.contact = { name: c.name, company: c.company };
      }
      setTasks(t => [...t, task]);
      toast("Tâche créée", "success");
    }
  }

  async function toggleTask(id: string, done: boolean) {
    const { error } = await supabase.from("crm_tasks").update({ done }).eq("id", id);
    if (error) { toast("Erreur lors de la mise à jour de la tâche", "error"); return; }
    setTasks(t => t.map(task => task.id === id ? { ...task, done } : task));
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setTasks(t => t.filter(task => task.id !== id));
  }

    async function addTicket(data: Partial<SupportTicket>) {
    if (!userId || !data.title) return;
    const { data: d, error } = await supabase.from("tickets").insert({ ...data, user_id: userId, organization_id: orgId ?? null }).select().single();
    if (error) { toast("Erreur lors de la création du ticket", "error"); return; }
    if (d) {
      const ticket = d as SupportTicket;
      if (ticket.contact_id) {
        const c = contacts.find(c => c.id === ticket.contact_id);
        if (c) ticket.contact = { name: c.name, company: c.company };
      }
      setTickets(t => [ticket, ...t]);
      toast("Ticket créé", "success");
    }
  }

  async function updateTicket(id: string, data: Partial<SupportTicket>) {
    const { error } = await supabase.from("tickets").update(data).eq("id", id);
    if (error) { toast("Erreur de mise à jour du ticket", "error"); return; }
    setTickets(t => t.map(tk => tk.id === id ? { ...tk, ...data } : tk));
  }

  async function deleteTicket(id: string) {
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression", "error"); return; }
    setTickets(t => t.filter(tk => tk.id !== id));
  }

  async function exportCSV() {
    // Requête sans .range() pour exporter TOUS les contacts correspondant aux filtres
    const { data, error } = await buildContactsQuery(0, query, filterStatus, filterType, sortBy, false);
    if (error || !data) { toast("Erreur lors de l'export", "error"); return; }
    let csv = "﻿" + toRFC4180Row(CSV_EXPORT_HEADERS);
    for (const c of data as Contact[]) {
      csv += toRFC4180Row([
        c.name, c.company ?? "", c.email ?? "", c.phone ?? "",
        c.status, c.type ?? "prospect", c.sector ?? "", c.source ?? "",
        c.city ?? "", c.budget != null ? c.budget : "", c.notes ?? "",
        c.next_relance ?? "", fmtDate(c.created_at),
      ]);
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast(`${(data as Contact[]).length} contact(s) exportés`, "success");
  }

  // Pagination serveur — contacts est déjà la bonne page, filtrée et triée côté serveur
  const pageItems  = contacts;
  const page       = contactsPage;
  const totalItems = contactsTotal;
  const totalPages = Math.max(1, Math.ceil(contactsTotal / CONTACTS_PAGE_SIZE));
  const setPage    = (pg: number) => loadContactPage(pg, query, filterStatus, filterType, sortBy);

    const selectedActivities    = useMemo(() => activities.filter(a => a.contact_id === selected?.id), [activities, selected]);
  const selectedOpportunities = useMemo(() => opportunities.filter(o => o.contact_id === selected?.id), [opportunities, selected]);
  const selectedTasks         = useMemo(() => tasks.filter(t => t.contact_id === selected?.id), [tasks, selected]);
  const selectedTickets       = useMemo(() => tickets.filter(t => t.contact_id === selected?.id), [tickets, selected]);

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueRelances = useMemo(() =>
    contacts.filter(c => c.next_relance && c.next_relance < todayStr && c.status !== "perdu"),
  [contacts, todayStr]);
  const [relanceBannerDismissed, setRelanceBannerDismissed] = useState(false);

  const MAIN_TABS = [
    { id: "contacts", label: "Contacts",  icon: Users,       badge: contacts.length },
    { id: "pipeline", label: "Pipeline",  icon: TrendingUp,  badge: opportunities.filter(o => o.stage !== "perdu").length },
    { id: "taches",   label: "Tâches",    icon: CheckSquare, badge: tasks.filter(t => !t.done).length },
    { id: "tickets",  label: "Tickets",   icon: Ticket,      badge: tickets.filter(t => t.status === "ouvert" || t.status === "en_cours").length },
    { id: "rapport",  label: "Rapport",   icon: BarChart2,   badge: 0 },
  ] as const;

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selected) { setSelected(null); return; }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey) {
        setForm({ status: "prospect", type: "prospect" });
        setEditContact(null);
        setAddModal(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = "";
    const text = await file.text();
    const parsed = parseRFC4180(text);
    if (parsed.length < 2) { toast("Fichier CSV vide ou sans données", "error"); return; }

    const rawHeaders = parsed[0].map(h => h.replace(/^﻿/, "").trim().toLowerCase());
    const col = (keywords: string[]) =>
      rawHeaders.findIndex(h => keywords.some(k => h.includes(k)));

    const nameIdx    = col(["nom", "name", "prénom", "prenom", "contact"]);
    const emailIdx   = col(["email", "mail", "courriel"]);
    const phoneIdx   = col(["phone", "tél", "tel", "téléphone", "mobile"]);
    const compIdx    = col(["sociét", "company", "entreprise", "société"]);
    const sectorIdx  = col(["secteur", "sector", "industrie"]);
    const sourceIdx  = col(["source", "origine"]);
    const cityIdx    = col(["ville", "city"]);
    const budgetIdx  = col(["budget"]);
    const notesIdx   = col(["notes", "commentaire", "remarque"]);
    const statusIdx  = col(["statut", "status"]);

    if (nameIdx < 0) { toast("Colonne 'nom' introuvable dans le CSV", "error"); return; }

    const existingEmails = new Set(contacts.map(c => c.email?.toLowerCase()).filter(Boolean));
    let skipped = 0;
    let invalid = 0;
    const rows: Array<Partial<Contact>> = [];

    for (const cols of parsed.slice(1)) {
      const name = (nameIdx >= 0 ? cols[nameIdx] : "") ?? "";
      if (!name.trim()) { invalid++; continue; }
      const email  = emailIdx  >= 0 ? (cols[emailIdx]  ?? "").trim() : "";
      const phone  = phoneIdx  >= 0 ? (cols[phoneIdx]  ?? "").trim() : "";
      const company = compIdx  >= 0 ? (cols[compIdx]   ?? "").trim() : "";
      const sector = sectorIdx >= 0 ? (cols[sectorIdx] ?? "").trim() : "";
      const source = sourceIdx >= 0 ? (cols[sourceIdx] ?? "").trim() : "";
      const city   = cityIdx   >= 0 ? (cols[cityIdx]   ?? "").trim() : "";
      const notes  = notesIdx  >= 0 ? (cols[notesIdx]  ?? "").trim() : "";
      const budgetRaw = budgetIdx >= 0 ? (cols[budgetIdx] ?? "").replace(/[^\d.]/g, "") : "";
      const budget = budgetRaw ? Number(budgetRaw) : undefined;

      if (email && existingEmails.has(email.toLowerCase())) { skipped++; continue; }

      const validStatuses: ContactStatus[] = ["prospect","actif","inactif","perdu"];
      const rawStatus = statusIdx >= 0 ? (cols[statusIdx] ?? "").trim().toLowerCase() as ContactStatus : "prospect";
      const status: ContactStatus = validStatuses.includes(rawStatus) ? rawStatus : "prospect";

      rows.push({ name: name.trim(), email: email || undefined, phone: phone || undefined,
        company: company || undefined, sector: sector || undefined, source: source || undefined,
        city: city || undefined, budget, notes: notes || undefined, status, type: "prospect" as ContactType });
    }

    if (!rows.length && skipped === 0) { toast("Aucun contact valide trouvé", "error"); return; }
    setImportPreview({ rows, skipped, invalid, fileName: file.name });
  }

  async function confirmImport() {
    if (!importPreview || !userId) return;
    setImporting(true);
    const toInsert = importPreview.rows.map(r => ({ ...r, user_id: userId, organization_id: orgId ?? null }));
    const CHUNK = 50;
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const { data, error } = await supabase.from("contacts").insert(toInsert.slice(i, i + CHUNK)).select();
      if (error) { toast("Erreur import: " + error.message, "error"); break; }
      if (data) { setContacts(cs => [...(data as Contact[]), ...cs]); inserted += data.length; }
    }
    setImporting(false);
    setImportPreview(null);
    const parts = [`${inserted} contact${inserted > 1 ? "s" : ""} importé${inserted > 1 ? "s" : ""}`];
    if (importPreview.skipped > 0) parts.push(`${importPreview.skipped} doublon${importPreview.skipped > 1 ? "s" : ""} ignoré${importPreview.skipped > 1 ? "s" : ""}`);
    if (importPreview.invalid > 0) parts.push(`${importPreview.invalid} ligne${importPreview.invalid > 1 ? "s" : ""} invalide${importPreview.invalid > 1 ? "s" : ""}`);
    toast(parts.join(" · "), "success");
  }

    return (
    <DarkCtx.Provider value={isDark}>
    <div className={`relative flex h-full flex-col gap-0 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden shrink-0" style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#f0f2f5,#f5f7fa,#f0f2f5)" }}>
        <div className="pointer-events-none absolute -top-16 -left-12 h-48 w-48 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle,#c9a55a,transparent 65%)" }}/>
        <div className="pointer-events-none absolute -bottom-12 right-8 h-40 w-40 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle,#7c3aed,transparent 65%)" }}/>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),rgba(124,58,237,0.25),transparent)" }}/>
        <div className="relative px-4 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>CRM</h1>
                <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                  {contactsTotal} contact{contactsTotal !== 1 ? "s" : ""} · {opportunities.filter(o => o.stage !== "perdu").length} opportunités actives
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {perms.can_create && (
                <label title="Importer CSV"
                  className="h-9 rounded-xl flex items-center gap-1.5 px-3 cursor-pointer transition-all hover:brightness-110"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                  <Upload size={13} className={isDark ? "text-white/50" : "text-gray-500"}/>
                  <span className={`hidden sm:inline text-sm font-semibold ${isDark ? "text-white/50" : "text-gray-500"}`}>Importer</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV}/>
                </label>
              )}
              {perms.can_export && (
                <button onClick={exportCSV} title="Exporter CSV"
                  className="h-9 rounded-xl flex items-center gap-1.5 px-3 transition-all hover:brightness-110"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                  <Download size={13} className={isDark ? "text-white/50" : "text-gray-500"}/>
                  <span className={`hidden sm:inline text-sm font-semibold ${isDark ? "text-white/50" : "text-gray-500"}`}>Exporter</span>
                </button>
              )}
              <button
                onClick={() => { setCorbeilleOpen(true); void loadDeletedContacts(); }}
                title="Corbeille"
                className={`h-9 w-9 rounded-xl flex items-center justify-center relative transition-all hover:brightness-110 ${isDark ? "bg-white/[0.04] border border-white/[0.08]" : "bg-white border border-black/[0.08]"}`}>
                <Trash2 size={13} className={isDark ? "text-white/30" : "text-gray-400"}/>
                {deletedContacts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[11px] font-black text-white flex items-center justify-center">
                    {deletedContacts.length > 9 ? "9+" : deletedContacts.length}
                  </span>
                )}
              </button>
              {perms.can_create && (
                <button onClick={() => { setForm({ status: "prospect", type: "prospect" }); setEditContact(null); setAddModal(true); }}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                  <Plus size={13}/> Nouveau contact
                </button>
              )}
            </div>
          </div>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { label: "Contacts",       value: contactsTotal,                                                       color: "#c9a55a", icon: Users,       onClick: () => { setMainTab("contacts"); setFilterStatus("tous"); } },
              { label: "Actifs",         value: contacts.filter(c => c.status === "actif").length,                 color: "#34d399", icon: UserCheck,    onClick: () => { setMainTab("contacts"); setFilterStatus("actif"); } },
              { label: "Pipeline",       value: fmtEur(opportunities.filter(o=>o.stage!=="perdu").reduce((s,o)=>s+(o.amount??0),0)), color: "#38bdf8", icon: TrendingUp, onClick: () => setMainTab("pipeline") },
              { label: "Tâches en cours",value: tasks.filter(t => !t.done).length,                                 color: "#f59e0b", icon: CheckSquare,  onClick: () => setMainTab("taches") },
            ].map(k => (
              <motion.button key={k.label} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ type:"spring", stiffness:300, damping:30, delay: 0.04 * MAIN_TABS.findIndex(t=>t.id==="contacts") }}
                onClick={k.onClick}
                className="rounded-xl p-3 flex items-center gap-2.5 text-left transition-all hover:brightness-105 active:scale-[0.97]"
                style={{
                  background: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.9)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                  boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${k.color}1c` }}>
                  <k.icon size={14} style={{ color: k.color }}/>
                </div>
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-white/30" : "text-gray-400"}`}>{k.label}</p>
                  <p className={`text-sm font-black mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>{k.value}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className={`shrink-0 px-4 sm:px-6 py-2.5 flex gap-1 overflow-x-auto ${isDark ? "border-b border-white/[0.05] bg-[#07080e]" : "border-b border-black/[0.05] bg-[#f0f2f5]"}`}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-[0.97]"
            style={{
              background: mainTab === t.id ? "rgba(201,165,90,0.14)" : "transparent",
              color: mainTab === t.id ? "#c9a55a" : (isDark ? "rgba(255,255,255,0.35)" : "rgba(17,24,39,0.45)"),
              border: mainTab === t.id ? "1px solid rgba(201,165,90,0.28)" : "1px solid transparent",
              boxShadow: mainTab === t.id ? "0 1px 6px rgba(201,165,90,0.12)" : "none",
            }}>
            <t.icon size={11}/>
            {t.label}
            {t.badge > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[11px] font-black"
                style={{
                  background: mainTab === t.id ? "rgba(201,165,90,0.2)" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"),
                  color: mainTab === t.id ? "#c9a55a" : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)"),
                }}>
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

            <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${selected ? "hidden sm:block" : ""}`}>

          {loading ? (
            <div className="flex h-full items-center justify-center py-20">
              <div className={`h-7 w-7 animate-spin rounded-full border-2 border-t-[#c9a55a] ${isDark ? "border-white/10" : "border-black/10"}`}/>
            </div>
          ) : (

            <>
                            {mainTab === "contacts" && (
                <div className="space-y-4">

                  {/* ── Overdue relances banner ── */}
                  {overdueRelances.length > 0 && !relanceBannerDismissed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Bell size={13} className="mt-0.5 shrink-0 text-orange-400"/>
                          <div>
                            <p className="text-sm font-bold text-orange-300">
                              {overdueRelances.length} relance{overdueRelances.length > 1 ? "s" : ""} en retard
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {overdueRelances.slice(0, 5).map(c => (
                                <button key={c.id} onClick={() => setSelected(c)}
                                  className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-300/80 hover:bg-orange-500/25 transition-colors">
                                  {c.name} · {fmtDate(c.next_relance)}
                                </button>
                              ))}
                              {overdueRelances.length > 5 && (
                                <span className="text-xs text-orange-400/60">+{overdueRelances.length - 5} autres</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setRelanceBannerDismissed(true)} className="shrink-0 text-orange-400/50 hover:text-orange-300 transition-colors">
                          <X size={13}/>
                        </button>
                      </div>
                    </motion.div>
                  )}

                                    <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
                      <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Rechercher un contact, une société…"
                        className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/20 focus:border-white/15" : "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-gray-300"}`}/>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as ContactStatus | "tous"); }}
                        className="rounded-xl border px-3 py-2 text-sm outline-none appearance-none"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.6)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                        <option value="tous">Tous statuts</option>
                        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={filterType} onChange={e => { setFilterType(e.target.value as ContactType | "tous"); }}
                        className="rounded-xl border px-3 py-2 text-sm outline-none appearance-none"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.6)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                        <option value="tous">Tous types</option>
                        {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={sortBy} onChange={e => { setSortBy(e.target.value as "date" | "name" | "budget" | "relance" | "score"); }}
                        className="rounded-xl border px-3 py-2 text-sm outline-none appearance-none"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: isDark ? "rgba(255,255,255,0.6)" : "#374151", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", colorScheme: isDark ? "dark" : "light" }}>
                        <option value="date">Plus récent</option>
                        <option value="name">Nom A→Z</option>
                        <option value="budget">Budget ↓</option>
                        <option value="relance">Prochaine relance</option>
                        <option value="score">Score lead ↓</option>
                      </select>
                    </div>
                  </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                    {(Object.keys(STATUSES) as ContactStatus[]).map(s => {
                      const count = contacts.filter(c => c.status === s).length;
                      const isActive = filterStatus === s;
                      const isOther  = filterStatus !== "tous" && !isActive;
                      return count > 0 ? (
                        <button key={s} onClick={() => setFilterStatus(isActive ? "tous" : s)}
                          className="flex items-center gap-1.5 text-xs font-bold rounded-xl px-2.5 py-1 transition-all"
                          style={{
                            color: STATUSES[s].color,
                            background: isActive ? `${STATUSES[s].color}1a` : "transparent",
                            border: `1px solid ${isActive ? `${STATUSES[s].color}38` : "transparent"}`,
                            opacity: isOther ? 0.35 : 1,
                          }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUSES[s].color }}/>
                          {STATUSES[s].label} <span className="font-black">({count})</span>
                        </button>
                      ) : null;
                    })}
                    {contactsLoading && (
                      <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white/20" : "text-gray-400"}`}>
                        <Loader2 size={9} className="animate-spin"/> Chargement…
                      </span>
                    )}
                  </div>

                                    {contacts.length === 0 && !contactsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`}>
                        <Users size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
                      </div>
                      <p className={`text-sm font-bold mb-1 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                        {contactsTotal === 0 ? "Aucun contact pour l'instant" : "Aucun résultat"}
                      </p>
                      <p className={`text-sm ${isDark ? "text-white/20" : "text-gray-400"}`}>
                        {contactsTotal === 0 ? "Ajoutez votre premier contact ou importez un fichier CSV." : "Modifiez les filtres pour voir plus de contacts."}
                      </p>
                      {contactsTotal === 0 && perms.can_create && (
                        <button onClick={() => { setForm({ status: "prospect", type: "prospect" }); setEditContact(null); setAddModal(true); }}
                          className="mt-5 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                          <Plus size={13}/> Ajouter un contact
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {pageItems.map(c => {
                          const typeColor = CONTACT_TYPES[c.type ?? "prospect"]?.color ?? "#60a5fa";
                          const isSelected = selected?.id === c.id;
                          const cActivities = activities.filter(a => a.contact_id === c.id).length;
                          const cOpps = opportunities.filter(o => o.contact_id === c.id && o.stage !== "perdu").length;
                          const score = computeLeadScore(c, cActivities);
                          const scoreColor = score >= 70 ? "#34d399" : score >= 40 ? "#f59e0b" : "#94a3b8";
                          return (
                            <motion.div key={c.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              onClick={() => setSelected(isSelected ? null : c)}
                              className={`flex items-center gap-3 rounded-2xl cursor-pointer transition-all group overflow-hidden ${
                                isSelected
                                  ? isDark ? "bg-white/[0.06]" : "bg-gray-100/80"
                                  : isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-white hover:bg-gray-50"}`}
                              style={{
                                padding: "14px",
                                border: isSelected
                                  ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`
                                  : `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`,
                                borderLeftWidth: "3px",
                                borderLeftColor: STATUSES[c.status].color,
                                boxShadow: isSelected
                                  ? (isDark ? "0 4px 16px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.07)")
                                  : "none",
                              }}>
                              <Avatar name={c.name} color={typeColor} size={38}/>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{c.name}</span>
                                  <Badge label={STATUSES[c.status].label} color={STATUSES[c.status].color} bg={STATUSES[c.status].bg}/>
                                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full hidden sm:inline-flex items-center gap-0.5"
                                    title={`Score lead : ${score}/100`}
                                    style={{ color: scoreColor, background: `${scoreColor}18`, border: `1px solid ${scoreColor}30` }}>
                                    <Target size={7}/>{score}
                                  </span>
                                  {c.priority === "high" && <Flag size={10} className="text-orange-400"/>}
                                  {c.priority === "urgent" && <Flag size={10} className="text-red-400"/>}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  {c.company && <span className={`text-xs truncate ${isDark ? "text-white/40" : "text-gray-500"}`}>{c.company}</span>}
                                  {c.sector  && <span className={`text-xs truncate ${isDark ? "text-white/25" : "text-gray-400"}`}>{c.sector}</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {c.email && <span className={`text-xs truncate flex items-center gap-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}><Mail size={8}/>{c.email}</span>}
                                  {c.phone && <span className={`text-xs flex items-center gap-0.5 ${isDark ? "text-white/25" : "text-gray-400"}`}><Phone size={8}/>{c.phone}</span>}
                                  {c.next_relance && (
                                    <span className="text-[11px] flex items-center gap-0.5"
                                      style={{ color: c.next_relance < new Date().toISOString().split("T")[0] ? "#f87171" : "#f59e0b" }}>
                                      <Bell size={7}/> {fmtDate(c.next_relance)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {cOpps > 0 && (
                                  <div className="text-center hidden sm:block">
                                    <div className="text-xs font-black" style={{ color: "#a78bfa" }}>{cOpps}</div>
                                    <div className={`text-[10px] ${isDark ? "text-white/20" : "text-gray-400"}`}>opp.</div>
                                  </div>
                                )}
                                {c.budget && c.budget > 0 && (
                                  <div className="text-right hidden lg:block">
                                    <div className={`text-xs font-black ${isDark ? "text-white/60" : "text-gray-600"}`}>{fmtEur(c.budget)}</div>
                                    <div className={`text-[10px] ${isDark ? "text-white/20" : "text-gray-400"}`}>budget</div>
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  {c.email && (
                                    <button onClick={e => { e.stopPropagation(); setEmailContact(c); }} title={`Email : ${c.email}`}
                                      className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-blue-400 hover:bg-blue-400/10 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
                                      <Mail size={11}/>
                                    </button>
                                  )}
                                  {c.phone && (
                                    <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} title={c.phone}
                                      className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-green-400 hover:bg-green-400/10 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
                                      <Phone size={11}/>
                                    </a>
                                  )}
                                  <button onClick={e => {
                                    e.stopPropagation();
                                    const d = new Date(); d.setDate(d.getDate() + 7);
                                    void updateContact(c.id, { next_relance: d.toISOString().split("T")[0] });
                                    toast("Relance planifiée dans 7 jours", "success");
                                  }} title="Planifier relance +7j"
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-orange-400 hover:bg-orange-400/10 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
                                    <Bell size={11}/>
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); setForm({ ...c }); setEditContact(c); setAddModal(true); }}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-white hover:bg-white/10 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
                                    <Pencil size={11}/>
                                  </button>
                                </div>
                                <ChevronRight size={13} className={`transition-transform ${isDark ? "text-white/20" : "text-gray-400"} ${isSelected ? "rotate-90" : ""}`}/>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {totalPages > 1 && (
                        <div className="pt-2">
                          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={CONTACTS_PAGE_SIZE}/>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

                            {mainTab === "pipeline" && (
                <PipelineView
                  opportunities={opportunities}
                  contacts={contacts}
                  onUpdate={updateOpportunity}
                  onDelete={deleteOpportunity}
                  onAdd={addOpportunity}
                  loading={loading}
                  canDelete={!perms.loading && perms.can_delete}
                />
              )}

                            {mainTab === "taches" && (
                <TachesView
                  tasks={tasks}
                  contacts={contacts}
                  members={orgMembers}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onAdd={addTask}
                  onUpdate={async () => {}}
                  canDelete={!perms.loading && perms.can_delete}
                />
              )}

              {mainTab === "tickets" && (
                <TicketsGlobalView
                  tickets={tickets}
                  contacts={contacts}
                  onAdd={addTicket}
                  onUpdate={updateTicket}
                  onDelete={deleteTicket}
                  canDelete={!perms.loading && perms.can_delete}
                />
              )}

                            {mainTab === "rapport" && (
                <RapportView contacts={contacts} opportunities={opportunities} tasks={tasks} tickets={tickets} activities={activities}/>
              )}
            </>
          )}
        </div>

                <AnimatePresence>
          {selected && (
            <>
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
                onAddOpportunity={addOpportunity}
                onEmail={() => setEmailContact(selected)}
                allContacts={contacts}
                perms={perms}
              />
            </>
          )}
        </AnimatePresence>
      </div>

            <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); setSaveError(""); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}
              style={{ background: isDark ? "rgba(7,8,14,0.98)" : "rgba(255,255,255,0.98)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>{editContact ? "Modifier le contact" : "Nouveau contact"}</h3>
                <button onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); setSaveError(""); }}
                  className={`${isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}><X size={16}/></button>
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
              <div className="grid grid-cols-2 gap-3">
                <Input label="Budget estimé (€)" type="number" value={form.budget ?? ""} onChange={e => setForm(f => ({ ...f, budget: +e.target.value }))}/>
                <Input label="Prochaine relance" type="date" value={form.next_relance ?? ""} onChange={e => setForm(f => ({ ...f, next_relance: e.target.value || undefined }))}/>
              </div>
              <Textarea label="Notes" placeholder="Informations complémentaires…" value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>

              {/* Tags */}
              <div className="space-y-1">
                <label className={`block text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Tags</label>
                <div className={`flex flex-wrap gap-1.5 min-h-[36px] rounded-xl border p-2 ${isDark ? "border-white/[0.08] bg-white/[0.04]" : "border-gray-200 bg-gray-50"}`}>
                  {(form.tags ?? []).map(tag => (
                    <span key={tag} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${isDark ? "bg-white/[0.08] text-white/70" : "bg-gray-200 text-gray-700"}`}>
                      {tag}
                      <button type="button" onClick={() => setForm(f => ({ ...f, tags: (f.tags ?? []).filter(t => t !== tag) }))}
                        className={`ml-0.5 ${isDark ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}><X size={9}/></button>
                    </span>
                  ))}
                  <input placeholder="Ajouter un tag…"
                    className={`bg-transparent text-sm outline-none flex-1 min-w-[80px] ${isDark ? "text-white placeholder-white/20" : "text-gray-900 placeholder-gray-400"}`}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === ",") && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const tag = e.currentTarget.value.trim().toLowerCase();
                        if (!(form.tags ?? []).includes(tag)) setForm(f => ({ ...f, tags: [...(f.tags ?? []), tag] }));
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <p className={`text-[11px] ${isDark ? "text-white/20" : "text-gray-400"}`}>Entrée ou virgule pour ajouter</p>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <AlertTriangle size={13} className="shrink-0"/>{saveError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAddModal(false); setEditContact(null); setForm({ status: "prospect", type: "prospect" }); setSaveError(""); }}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-800"}`}>Annuler</button>
                <button onClick={saveContact} disabled={!form.name}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                  {editContact ? "Mettre à jour" : "Créer le contact"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {emailContact && (
          <EmailComposeModal
            contact={emailContact}
            customTemplates={customTemplates}
            onSaveTemplate={saveCustomTemplate}
            onDeleteTemplate={deleteCustomTemplate}
            onClose={() => setEmailContact(null)}
            onSent={async (subject, body) => {
              await addActivity(emailContact.id, {
                type: "email",
                title: subject,
                description: body,
                activity_date: new Date().toISOString().split("T")[0],
                duration_min: 0,
              });
              toast(`Email enregistré · client email ouvert`, "success");
              setEmailContact(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Corbeille (contacts soft-deletés) ───────────────────── */}
      <AnimatePresence>
        {corbeilleOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCorbeilleOpen(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Trash2 size={18} className="text-red-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Corbeille</h2>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{deletedContacts.length}</span>
                </div>
                <button onClick={() => setCorbeilleOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {deletedContacts.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">La corbeille est vide</p>
                ) : deletedContacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-500 truncate">{c.company}</p>}
                      {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      <button
                        onClick={() => restoreContact(c.id)}
                        className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Restaurer
                      </button>
                      {perms.can_delete && (
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer définitivement « ${c.name} » ? Cette action est irréversible.`)) {
                              purgeContact(c.id);
                            }
                          }}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Avertissement doublon ───────────────────────────────── */}
      <AnimatePresence>
        {dupWarning && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Doublon détecté</h2>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Un contact avec cette adresse email existe déjà :
                </p>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{dupWarning.contact.name}</p>
                  {dupWarning.contact.company && <p className="text-xs text-gray-500">{dupWarning.contact.company}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{dupWarning.contact.email}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Voulez-vous créer un second contact avec la même adresse email ?
                </p>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => setDupWarning(null)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    dupWarning.onConfirm();
                    setDupWarning(null);
                  }}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                >
                  Continuer quand même
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal prévisualisation import CSV ───────────────────── */}
      <AnimatePresence>
        {importPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { if (!importing) setImportPreview(null); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}
              style={{ background: isDark ? "rgba(7,8,14,0.98)" : "rgba(255,255,255,0.98)" }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>Prévisualisation import</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>{importPreview.fileName}</p>
                </div>
                <button onClick={() => setImportPreview(null)} disabled={importing}
                  className={isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}><X size={16}/></button>
              </div>

              {/* Résumé */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "À importer",  value: importPreview.rows.length,   color: "#34d399" },
                  { label: "Doublons",    value: importPreview.skipped,        color: "#fb923c" },
                  { label: "Invalides",   value: importPreview.invalid,        color: "#f87171" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border p-2.5 text-center ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className={`text-[11px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Aperçu des 5 premières lignes */}
              {importPreview.rows.length > 0 && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/25" : "text-gray-400"}`}>
                    Aperçu ({Math.min(5, importPreview.rows.length)} sur {importPreview.rows.length})
                  </p>
                  <div className="space-y-1.5">
                    {importPreview.rows.slice(0, 5).map((r, i) => (
                      <div key={i} className={`rounded-xl border px-3 py-2 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{r.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {r.company && <span className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>{r.company}</span>}
                          {r.email   && <span className={`text-xs ${isDark ? "text-blue-400/60" : "text-blue-500"}`}>{r.email}</span>}
                          {r.phone   && <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>{r.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importPreview.rows.length === 0 && (
                <p className={`text-sm text-center py-4 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  Aucun nouveau contact à importer (tous en doublon ou invalides).
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setImportPreview(null)} disabled={importing}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors disabled:opacity-40 ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                  Annuler
                </button>
                <button onClick={confirmImport}
                  disabled={importing || importPreview.rows.length === 0}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                  {importing
                    ? <><Loader2 size={13} className="animate-spin"/> Import en cours…</>
                    : `Importer ${importPreview.rows.length} contact${importPreview.rows.length > 1 ? "s" : ""}`
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </DarkCtx.Provider>
  );
}
