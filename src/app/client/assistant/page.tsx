"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Zap, Users, Package, Calendar, BarChart2,
  AlertTriangle, PenLine, Loader2, RefreshCw,
  Copy, Clock, CreditCard, Receipt, ListTodo,
  UserCheck, ChevronRight, Menu, X, Send,
  Download, Volume2, VolumeX, FileText, Check,
  Paperclip, Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";
import { useTheme } from "@/lib/theme-context";
import { generatePdf, type PdfData } from "@/lib/pdf/generatePdf";
import { fetchCompanySettings } from "@/lib/pdf/companySettings";
import ArtifactCard from "@/components/assistant/ArtifactCard";
import type { ArtifactData } from "@/lib/ai/tool-registry";

const GOLD = "#c9a55a";

/* ── DJAMA AI Symbol ────────────────────────────────────────────────── */
function DjamaAiSymbol({ size = 20, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="10" y1="2.5" x2="3.5" y2="15.5" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.45"/>
      <line x1="10" y1="2.5" x2="16.5" y2="15.5" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.45"/>
      <line x1="3.5" y1="15.5" x2="16.5" y2="15.5" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.45"/>
      <line x1="10" y1="2.5" x2="10" y2="10" stroke={color} strokeWidth="0.55" strokeLinecap="round" opacity="0.28"/>
      <line x1="3.5" y1="15.5" x2="10" y2="10" stroke={color} strokeWidth="0.55" strokeLinecap="round" opacity="0.28"/>
      <line x1="16.5" y1="15.5" x2="10" y2="10" stroke={color} strokeWidth="0.55" strokeLinecap="round" opacity="0.28"/>
      <circle cx="10" cy="2.5" r="2" fill={color}/>
      <circle cx="3.5" cy="15.5" r="1.55" fill={color} opacity="0.72"/>
      <circle cx="16.5" cy="15.5" r="1.55" fill={color} opacity="0.72"/>
      <circle cx="10" cy="10" r="1.15" fill={color} opacity="0.5"/>
    </svg>
  );
}

/* ── Actions & suggestions ──────────────────────────────────────────── */
const ACTIONS: { icon: LucideIcon; label: string; prompt: string }[] = [
  { icon: DollarSign,    label: "Finances du mois",  prompt: "Analyse mes finances du mois : revenus, dépenses, factures impayées. Donne un résumé actionnable avec les chiffres clés." },
  { icon: Zap,           label: "Tâches urgentes",   prompt: "Quelles sont mes tâches urgentes et en retard ? Que dois-je faire en priorité aujourd'hui ?" },
  { icon: Users,         label: "Clients impayés",   prompt: "Liste les clients avec des factures impayées. Donne les montants, les délais de retard et suggère une action de relance." },
  { icon: Package,       label: "Alertes stock",     prompt: "Quels produits sont en stock faible ou en rupture ? Lesquels dois-je réapprovisionner en urgence ?" },
  { icon: Calendar,      label: "Ma journée",        prompt: "Organise ma journée idéale en tenant compte de mes tâches prioritaires, réunions prévues et objectifs." },
  { icon: BarChart2,     label: "Rapport business",  prompt: "Génère un rapport business complet : revenus, dépenses, tâches terminées, clients actifs, alertes importantes." },
  { icon: AlertTriangle, label: "Risques & alertes", prompt: "Détecte tous les risques business : retards de paiement, stock bas, surcharge équipe, projets en retard." },
  { icon: PenLine,       label: "Créer une facture", prompt: "Crée une facture pour un client, prestation de service, montant 500€ HT, TVA 20%." },
];

const SUGGESTIONS = [
  "Analyser mon activité",
  "Que dois-je faire aujourd'hui ?",
  "Préparer un rapport",
  "Créer une facture",
];

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  modules?: string[];
  loading?: boolean;
  pdfData?: PdfData;
  pdfGenerating?: boolean;
  artifact?: ArtifactData;
  artifactSteps?: string[];
}

interface Conv {
  id: string;
  title: string;
  created_at: string;
}

interface LiveInsights {
  lateTasks:     number;
  urgentTasks:   number;
  unpaidCount:   number;
  unpaidTotal:   number;
  lowStock:      number;
  pendingLeaves: number;
  todayEvents:   number;
}

/* ── Business logic: unchanged ──────────────────────────────────────── */
function isDocRequest(text: string): boolean {
  return /facture|invoice|devis|quote|proposition commerciale|bon de commande/i.test(text);
}

async function buildContext(prompt: string, userId: string): Promise<{ ctx: string; modules: string[] }> {
  const q = prompt.toLowerCase();
  const parts: string[] = [];
  const used: string[]  = [];

  async function get(table: string, sel: string): Promise<Record<string, unknown>[]> {
    try {
      const { data } = await supabase.from(table).select(sel).eq("user_id", userId).limit(80);
      return (data ?? []) as unknown as Record<string, unknown>[];
    } catch { return []; }
  }

  const tasks = await get("productivity_tasks", "title,status,priority,due_date");
  if (tasks.length) {
    const todayStr = new Date().toDateString();
    const late     = tasks.filter(t => t.due_date && new Date(String(t.due_date) + "T00:00:00") < new Date(todayStr) && t.status !== "done");
    const urgent   = tasks.filter(t => t.priority === "urgent");
    const inprog   = tasks.filter(t => t.status === "in_progress");
    used.push("Tâches");
    parts.push(`TÂCHES (${tasks.length} total): ${urgent.length} urgentes · ${late.length} en retard · ${inprog.length} en cours.`);
    if (urgent.length) parts.push(`  ↳ Urgentes: ${urgent.slice(0, 6).map(t => t.title).join(" | ")}`);
    if (late.length)   parts.push(`  ↳ En retard: ${late.slice(0, 4).map(t => t.title).join(" | ")}`);
  }

  if (q.match(/facture|impay|client|paiement|revenu|chiffre|argent|rentr/)) {
    const inv = await get("factures", "statut,montant_ttc,client_nom,date_echeance,numero");
    if (inv.length) {
      used.push("Factures");
      const unpaid  = inv.filter(i => ["en_attente", "envoyée", "retard"].includes(String(i.statut)));
      const paid    = inv.filter(i => i.statut === "payée");
      const tot     = unpaid.reduce((s, i) => s + Number(i.montant_ttc ?? 0), 0);
      const totpaid = paid.reduce((s, i) => s + Number(i.montant_ttc ?? 0), 0);
      const clients = [...new Set(unpaid.map(i => i.client_nom))];
      parts.push(`FACTURES (${inv.length}): ${unpaid.length} impayées = ${tot.toFixed(0)}€ · ${paid.length} payées = ${totpaid.toFixed(0)}€.`);
      if (clients.length) parts.push(`  ↳ Clients impayés: ${clients.slice(0, 6).join(", ")}`);
    }
  }

  if (q.match(/dépense|budget|coût|charge|finance|trésor|cashflow|argent|solde|bilan/)) {
    const dep = await get("depenses", "montant,categorie,date_depense,libelle");
    if (dep.length) {
      used.push("Dépenses");
      const tot = dep.reduce((s, d) => s + Number(d.montant ?? 0), 0);
      const bycat: Record<string, number> = {};
      dep.forEach(d => { const c = String(d.categorie || "Autre"); bycat[c] = (bycat[c] || 0) + Number(d.montant ?? 0); });
      const top3 = Object.entries(bycat).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}: ${v.toFixed(0)}€`).join(" · ");
      parts.push(`DÉPENSES (${dep.length} transactions): total ${tot.toFixed(0)}€. Top catégories: ${top3}.`);
    }
    const tr = await get("tresorerie_transactions", "type,montant,libelle,date_transaction");
    if (tr.length) {
      used.push("Trésorerie");
      const ent = tr.filter(t => t.type === "entree").reduce((s, t) => s + Number(t.montant ?? 0), 0);
      const sor = tr.filter(t => t.type === "sortie").reduce((s, t) => s + Number(t.montant ?? 0), 0);
      parts.push(`TRÉSORERIE: entrées ${ent.toFixed(0)}€ · sorties ${sor.toFixed(0)}€ · solde net ${(ent - sor).toFixed(0)}€`);
    }
  }

  if (q.match(/client|crm|contact|prospect|relation|commercial/)) {
    const crm = await get("crm_clients", "nom,statut,email,chiffre_affaires");
    if (crm.length) {
      used.push("CRM");
      const actifs    = crm.filter(c => c.statut === "client").length;
      const prospects = crm.filter(c => c.statut === "prospect").length;
      const topCA     = crm.sort((a, b) => Number(b.chiffre_affaires ?? 0) - Number(a.chiffre_affaires ?? 0)).slice(0, 5).map(c => c.nom);
      parts.push(`CRM (${crm.length} contacts): ${actifs} clients actifs · ${prospects} prospects. Top clients: ${topCA.join(", ")}.`);
    }
  }

  if (q.match(/stock|inventaire|produit|réappro|fourniss|marchand/)) {
    const st = await get("stock_products", "name,stock_current,stock_minimum,category");
    if (st.length) {
      used.push("Stocks");
      const low  = st.filter(s => Number(s.stock_current) <= Number(s.stock_minimum));
      const zero = st.filter(s => Number(s.stock_current) === 0);
      parts.push(`STOCKS (${st.length} produits): ${low.length} stock faible · ${zero.length} rupture totale.`);
      if (low.length) parts.push(`  ↳ À réapprovisionner: ${low.slice(0, 6).map(s => `${s.name} (${s.stock_current}/${s.stock_minimum})`).join(" · ")}`);
    }
  }

  if (q.match(/planning|agenda|réunion|journée|semaine|événement|organis/)) {
    const today = new Date().toISOString().slice(0, 10);
    const ev    = await get("planning_events", "title,start_at,end_at,event_type,location");
    if (ev.length) {
      used.push("Planning");
      const todayEv  = ev.filter(e => String(e.start_at ?? "").slice(0, 10) === today);
      const upcoming = ev.filter(e => String(e.start_at ?? "").slice(0, 10) > today).slice(0, 8);
      if (todayEv.length)  parts.push(`PLANNING AUJOURD'HUI: ${todayEv.map(e => `${e.title} (${String(e.start_at).slice(11, 16)})`).join(" · ")}`);
      if (upcoming.length) parts.push(`PLANNING À VENIR: ${upcoming.map(e => `${e.title} le ${String(e.start_at).slice(0, 10)}`).join(" · ")}`);
    }
    const goals = await get("planning_goals", "title,status,progress,period");
    if (goals.length) {
      used.push("Objectifs");
      const actifs = goals.filter(g => g.status === "active");
      if (actifs.length) parts.push(`OBJECTIFS ACTIFS: ${actifs.slice(0, 4).map(g => `${g.title} (${g.progress}%)`).join(" · ")}`);
    }
  }

  if (q.match(/équipe|membre|team|congé|collaborat|rh|absence/)) {
    const tm = await get("team_members", "name,role,status,department");
    if (tm.length) {
      used.push("Équipe");
      parts.push(`ÉQUIPE (${tm.length}): ${tm.filter(m => m.status === "active").length} actifs · ${tm.filter(m => m.status === "leave").length} en congé.`);
    }
    const tl = await get("team_leaves", "status,member_name,type,start_date");
    if (tl.length) {
      used.push("Congés");
      const pend = tl.filter(l => l.status === "pending");
      if (pend.length) parts.push(`CONGÉS EN ATTENTE: ${pend.length} demandes: ${pend.slice(0, 4).map(l => l.member_name).join(", ")}`);
    }
  }

  if (q.match(/contrat|accord|convention|document/)) {
    const cont = await get("contracts", "title,status,client_name,amount,end_date");
    if (cont.length) {
      used.push("Contrats");
      const actifs   = cont.filter(c => c.status === "active").length;
      const expiring = cont.filter(c => c.end_date && new Date(String(c.end_date)) < new Date(Date.now() + 30 * 86400000));
      parts.push(`CONTRATS (${cont.length}): ${actifs} actifs. ${expiring.length} expirent dans 30 jours.`);
    }
  }

  if (q.match(/note|idée|document|résumé|compte.rendu/)) {
    const notes = await get("notes", "title,type,created_at");
    if (notes.length) {
      used.push("Notes IA");
      parts.push(`NOTES (${notes.length}): ${notes.slice(0, 5).map(n => n.title).join(" · ")}`);
    }
  }

  const sys = `Tu es DJAMA AI, le cerveau central de la plateforme DJAMA SaaS. Tu as accès aux données réelles de l'utilisateur. Réponds TOUJOURS en français, de façon concise, professionnelle et actionnable. Utilise des listes à puces quand c'est utile. Si tu détectes un problème (impayé, stock bas, retard, surcharge), propose une action concrète immédiate. Ne te contente pas de lister des données — analyse et conseille.`;

  const ctx = parts.length > 0
    ? `${sys}\n\n[DONNÉES TEMPS RÉEL — ${new Date().toLocaleDateString("fr-FR")}]\n${parts.join("\n")}\n[FIN DONNÉES]`
    : sys;

  return { ctx, modules: used };
}

/* ── Message renderer ───────────────────────────────────────────────── */
function MsgContent({ text, isDark }: { text: string; isDark: boolean }) {
  const tx = isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.78)";
  const txH = isDark ? "#ffffff" : "#111827";
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: React.ReactNode[] = [];

  function flushList() {
    if (listBuf.length) {
      out.push(<ul key={`ul-${out.length}`} className="space-y-1 my-1.5 pl-1">{listBuf}</ul>);
      listBuf = [];
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith("## ") || line.startsWith("### ")) {
      flushList();
      out.push(<p key={i} className="text-sm font-bold mt-3 mb-1 first:mt-0" style={{ color: txH }}>{line.replace(/^#{2,3}\s/, "")}</p>);
    } else if (line.match(/^[-•*]\s/)) {
      const content = line.replace(/^[-•*]\s/, "");
      listBuf.push(
        <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: tx }}>
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0" style={{ background: GOLD, opacity: 0.8 }} />
          <span>{bold(content, isDark)}</span>
        </li>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, "");
      const num = line.match(/^(\d+)\./)?.[1];
      listBuf.push(
        <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: tx }}>
          <span className="shrink-0 text-xs font-bold" style={{ color: GOLD }}>{num}.</span>
          <span>{bold(content, isDark)}</span>
        </li>
      );
    } else if (line.trim() === "") {
      flushList();
      out.push(<div key={i} className="h-1" />);
    } else {
      flushList();
      out.push(<p key={i} className="text-sm leading-relaxed" style={{ color: tx }}>{bold(line, isDark)}</p>);
    }
  });
  flushList();
  return <div className="space-y-0.5">{out}</div>;
}

function bold(text: string, isDark: boolean): React.ReactNode {
  const txH = isDark ? "#ffffff" : "#111827";
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold" style={{ color: txH }}>{p}</strong> : p
  );
}

/* ── PDF download button ────────────────────────────────────────────── */
function DocDownloadButton({ pdfData, isDark }: { pdfData: PdfData; isDark: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const co = await fetchCompanySettings();
      await generatePdf({ ...pdfData, company: co });
    } catch {}
    setLoading(false);
  }

  const bdr = isDark ? `1px solid ${GOLD}40` : `1px solid ${GOLD}55`;
  const bg  = isDark ? `${GOLD}12` : `${GOLD}10`;

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95 disabled:opacity-60"
      style={{ background: bg, border: bdr, color: isDark ? GOLD : "#8a6a28" }}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
      {loading ? "Génération…" : `Télécharger ${pdfData.type === "invoice" ? "Facture" : "Devis"} PDF`}
    </button>
  );
}

/* ── Insights panel ─────────────────────────────────────────────────── */
function InsightsPanel({ insights, loading, isDark }: { insights: LiveInsights | null; loading: boolean; isDark: boolean }) {
  const bdr = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const tx  = isDark ? "rgba(255,255,255,0.52)" : "rgba(0,0,0,0.52)";

  const items: { icon: LucideIcon; label: string; value: number | string; warn: boolean; warnColor: string }[] = insights ? [
    { icon: Zap,        label: "Tâches urgentes",  value: insights.urgentTasks,                  warn: insights.urgentTasks > 0,  warnColor: "#ef4444" },
    { icon: Clock,      label: "En retard",         value: insights.lateTasks,                    warn: insights.lateTasks > 0,    warnColor: "#f97316" },
    { icon: CreditCard, label: "Factures impayées", value: insights.unpaidCount,                  warn: insights.unpaidCount > 0,  warnColor: "#f59e0b" },
    { icon: DollarSign, label: "Montant impayé",    value: `${insights.unpaidTotal.toFixed(0)}€`, warn: false,                     warnColor: GOLD },
    { icon: Package,    label: "Stock faible",      value: insights.lowStock,                     warn: insights.lowStock > 0,     warnColor: "#f59e0b" },
    { icon: Calendar,   label: "Réunions du jour",  value: insights.todayEvents,                  warn: false,                     warnColor: GOLD },
  ] : [];

  return (
    <div className="space-y-1.5">
      {loading && (
        <div className="flex items-center gap-2 py-4" style={{ color: tx }}>
          <Loader2 size={12} className="animate-spin" />
          <span className="text-xs">Chargement…</span>
        </div>
      )}
      {!loading && items.map(item => {
        const accent = item.warn ? item.warnColor : GOLD;
        return (
          <div key={item.label}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition"
            style={{ border: `1px solid ${item.warn ? item.warnColor + "22" : bdr}`, background: item.warn ? `${item.warnColor}09` : "transparent" }}>
            <div className="flex items-center gap-2">
              <item.icon size={13} style={{ color: accent }} />
              <span className="text-sm" style={{ color: tx }}>{item.label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: accent }}>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Conv grouping ──────────────────────────────────────────────────── */
function groupConvs(convs: Conv[]): { label: string; items: Conv[] }[] {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yest  = today - 86400000;
  const week  = today - 6 * 86400000;

  const toDay  = convs.filter(c => new Date(c.created_at).getTime() >= today);
  const toYest = convs.filter(c => { const t = new Date(c.created_at).getTime(); return t >= yest && t < today; });
  const toWeek = convs.filter(c => { const t = new Date(c.created_at).getTime(); return t >= week && t < yest; });
  const older  = convs.filter(c => new Date(c.created_at).getTime() < week);

  return [
    { label: "Aujourd'hui",     items: toDay  },
    { label: "Hier",            items: toYest },
    { label: "7 derniers jours", items: toWeek },
    { label: "Plus ancien",     items: older  },
  ].filter(g => g.items.length > 0);
}

/* ── Sidebar ────────────────────────────────────────────────────────── */
function SidebarInner({
  convs, activeConv, onNew, onSelect, onClose,
  memNote, onMemChange, isDark,
}: {
  convs: Conv[]; activeConv: string | null;
  onNew: () => void; onSelect: (id: string) => void;
  onClose?: () => void; memNote: string;
  onMemChange: (v: string) => void; isDark: boolean;
}) {
  const [search, setSearch] = useState("");
  const bdr   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const tx    = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)";
  const txMut = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.42)";
  const txDim = isDark ? "rgba(255,255,255,0.26)" : "rgba(0,0,0,0.30)";
  const surH  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const filtered = search.trim()
    ? convs.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : convs;
  const groups = groupConvs(filtered);

  return (
    <>
      {/* Header */}
      <div className="shrink-0 px-4 py-4" style={{ borderBottom: `1px solid ${bdr}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}28` }}>
              <DjamaAiSymbol size={14} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: tx }}>DJAMA AI</p>
              <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: txDim }}>Assistant central</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: txMut }}
              onMouseEnter={e => (e.currentTarget.style.background = surH)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* New conversation button */}
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${GOLD}30`,
            color: GOLD,
          }}>
          + Nouvelle conversation
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: `1px solid ${bdr}` }}>
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-2"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${bdr}` }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke={txDim} strokeWidth="1.5"/><line x1="11" y1="11" x2="15" y2="15" stroke={txDim} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: tx }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: txDim }}>
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: "none" }}>
        {convs.length === 0 && (
          <div className="px-3 py-6 text-center">
            <DjamaAiSymbol size={24} color={txDim} />
            <p className="mt-3 text-xs" style={{ color: txDim }}>Démarrez votre première conversation</p>
          </div>
        )}
        {groups.map(group => (
          <div key={group.label} className="mb-3">
            <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: txDim }}>{group.label}</p>
            {group.items.map(c => (
              <button key={c.id} onClick={() => { onSelect(c.id); onClose?.(); }}
                className="w-full text-left rounded-lg px-2.5 py-2 text-xs mb-0.5 transition"
                style={{
                  background: activeConv === c.id ? `${GOLD}14` : "transparent",
                  color: activeConv === c.id ? tx : txMut,
                  border: activeConv === c.id ? `1px solid ${GOLD}22` : "1px solid transparent",
                }}
                onMouseEnter={e => { if (activeConv !== c.id) (e.currentTarget.style.background = surH); }}
                onMouseLeave={e => { if (activeConv !== c.id) (e.currentTarget.style.background = "transparent"); }}>
                <p className="truncate font-medium" style={{ color: activeConv === c.id ? tx : txMut }}>{c.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: txDim }}>
                  {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Context mémorisé — la fonctionnalité est réelle (table ai_memories) */}
      <div className="shrink-0 px-3 py-3" style={{ borderTop: `1px solid ${bdr}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: txDim }}>Votre contexte</p>
          {memNote.trim() && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: `${GOLD}90` }}>
              <Check size={8} />Actif
            </span>
          )}
        </div>
        <textarea
          value={memNote}
          onChange={e => onMemChange(e.target.value)}
          placeholder="Ex : Freelance à Paris, TJM 450€, client principal Acme Corp…"
          rows={2}
          className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none transition"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${bdr}`,
            color: tx,
            scrollbarWidth: "none",
          }}
        />
        <p className="mt-1 text-[11px]" style={{ color: txDim }}>Inclus dans chaque conversation</p>
      </div>
    </>
  );
}

/* ── Insights panel right ───────────────────────────────────────────── */
function InsightsInner({
  insights, insLoading, onRefresh, onClose, isDark,
}: {
  insights: LiveInsights | null;
  insLoading: boolean;
  onRefresh: () => void;
  onClose?: () => void;
  isDark: boolean;
}) {
  const bdr   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const tx    = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)";
  const txMut = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.42)";

  return (
    <>
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${bdr}` }}>
          <p className="text-sm font-semibold" style={{ color: txMut }}>Données DJAMA</p>
          <button onClick={onClose} className="p-1.5 rounded-lg transition" style={{ color: txMut }}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "none" }}>
        {!onClose && (
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: txMut }}>Données DJAMA</p>
        )}

        <InsightsPanel insights={insights} loading={insLoading} isDark={isDark} />

        <button onClick={onRefresh}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs transition"
          style={{ border: `1px solid ${bdr}`, color: txMut }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${GOLD}35`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}>
          <RefreshCw size={11} /> Actualiser
        </button>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: txMut }}>Accès directs</p>
          {([
            { Icon: Receipt,   label: "Factures",  href: "/client/factures"     },
            { Icon: ListTodo,  label: "Tâches",    href: "/client/productivite" },
            { Icon: Users,     label: "CRM",       href: "/client/crm"          },
            { Icon: Package,   label: "Stocks",    href: "/client/stocks"       },
            { Icon: Calendar,  label: "Planning",  href: "/client/planning"     },
            { Icon: UserCheck, label: "Équipe",    href: "/client/equipe"       },
          ] as { Icon: LucideIcon; label: string; href: string }[]).map(s => (
            <a key={s.href} href={s.href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs transition"
              style={{ color: txMut }}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <s.Icon size={12} style={{ color: isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.28)" }} />
              <span style={{ color: tx }}>{s.label}</span>
              <ChevronRight size={10} className="ml-auto" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.20)" }} />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function AssistantPage() {
  const { isDark, accent } = useTheme();
  const gold = accent || GOLD;

  const [convs,        setConvs]        = useState<Conv[]>([]);
  const [activeConv,   setActiveConv]   = useState<string | null>(null);
  const [msgs,         setMsgs]         = useState<Msg[]>([]);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [consulting,   setConsulting]   = useState<string[]>([]);
  const [showActions,  setShowActions]  = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [insights,     setInsights]     = useState<LiveInsights | null>(null);
  const [insLoading,   setInsLoading]   = useState(true);
  const [toastData,    setToastData]    = useState<ToastData | null>(null);
  const [userId,       setUserId]       = useState<string>("");
  const [userName,     setUserName]     = useState<string>("vous");
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const [mem,          setMem]          = useState<string>("");

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const memSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, type: ToastData["type"] = "success") => {
    setToastData({ msg, type });
    setTimeout(() => setToastData(null), 3000);
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (memSaveTimer.current) clearTimeout(memSaveTimer.current);
    memSaveTimer.current = setTimeout(() => {
      void supabase.from("ai_memories").upsert(
        { user_id: userId, memory_text: mem, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }, 1500);
    return () => { if (memSaveTimer.current) clearTimeout(memSaveTimer.current); };
  }, [mem, userId]);

  function exportConv() {
    if (!msgs.length) return;
    const title = convs.find(c => c.id === activeConv)?.title ?? "conversation";
    const text = msgs
      .map(m => `**${m.role === "user" ? "Vous" : "DJAMA AI"}** :\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([`# ${title}\n\n${text}`], { type: "text/markdown;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Conversation exportée !");
  }

  function speakMsg(content: string, id: string) {
    if (!("speechSynthesis" in window)) { toast("TTS non supporté sur ce navigateur", "error"); return; }
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = content.replace(/\*\*/g, "").replace(/^#{1,3}\s/gm, "");
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "fr-FR";
    utter.rate = 1.05;
    utter.onend  = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  }

  const loadConvs = useCallback(async () => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id,title,created_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    setConvs((data ?? []) as Conv[]);
  }, []);

  const loadMsgs = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content,modules_used,created_at")
      .eq("conversation_id", convId)
      .order("created_at");

    const rawMsgs = (data ?? []) as Record<string, unknown>[];

    // Récupérer les artifacts: parsés depuis le sentinel JSON (pas de table DB requise)
    const pendingArtifacts: { msgId: string; bucket: string; path: string; meta: ArtifactData }[] = [];

    const rawMapped = rawMsgs.map((m) => {
      const modules = Array.isArray(m.modules_used) ? m.modules_used.map(String) : [];
      const artSentinel = modules.find(mod => mod.startsWith("artifact:"));
      let artifact: ArtifactData | undefined;

      if (artSentinel) {
        const sentinelVal = artSentinel.slice(9); // strip "artifact:"
        if (sentinelVal.startsWith("{")) {
          // New format: full JSON
          try {
            const parsed = JSON.parse(sentinelVal) as {
              id: string; type: string; title: string; file_name: string;
              file_size?: number; mime_type: string; bucket?: string; path?: string;
              metadata?: Record<string, unknown>;
            };
            artifact = {
              id: parsed.id, type: parsed.type as ArtifactData["type"],
              title: parsed.title, file_name: parsed.file_name,
              file_size: parsed.file_size, mime_type: parsed.mime_type,
              download_url: "",
              storage_bucket: parsed.bucket, storage_path: parsed.path,
              metadata: parsed.metadata,
            };
            if (parsed.bucket && parsed.path) {
              pendingArtifacts.push({ msgId: String(m.id), bucket: parsed.bucket, path: parsed.path, meta: artifact });
            }
          } catch { /* ignore parse errors */ }
        }
        // Old format (plain uuid): skip — artifact_files may not exist
      }

      return {
        id: String(m.id), role: m.role as "user" | "assistant",
        content: String(m.content),
        modules: modules.filter(mod => !mod.startsWith("artifact:")),
        artifact,
      };
    });

    setMsgs(rawMapped);

    // Générer les URLs signées en arrière-plan (ne bloque pas l'affichage)
    for (const { msgId, bucket, path, meta } of pendingArtifacts) {
      try {
        const signRes = await fetch("/api/artifacts/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket, path }),
        });
        if (signRes.ok) {
          const { url } = await signRes.json() as { url?: string };
          if (url) {
            setMsgs(ms => ms.map(m => m.id === msgId
              ? { ...m, artifact: m.artifact ? { ...m.artifact, download_url: url } : m.artifact }
              : m
            ));
          }
        }
      } catch { /* ignore, user still sees the card without download button */ }
    }
  }, []);

  const loadInsights = useCallback(async () => {
    setInsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setInsLoading(false); return; }
      setUserId(authUser.id);
      const name = authUser.user_metadata?.full_name as string | undefined
        || authUser.user_metadata?.name as string | undefined
        || authUser.email?.split("@")[0];
      if (name) setUserName(name.split(" ")[0]);

      const uid = authUser.id;
      const [tasks, inv, st, lv, ev, memRow] = await Promise.all([
        supabase.from("productivity_tasks").select("status,priority,due_date").eq("user_id", uid).limit(200),
        supabase.from("factures").select("statut,montant_ttc").eq("user_id", uid).limit(200),
        supabase.from("stock_products").select("stock_current,stock_minimum").eq("user_id", uid).limit(200),
        supabase.from("team_leaves").select("status").eq("user_id", uid).limit(50),
        supabase.from("planning_events").select("start_at").eq("user_id", uid).limit(50),
        supabase.from("ai_memories").select("memory_text").eq("user_id", uid).maybeSingle(),
      ]);
      if (memRow.data?.memory_text) setMem(memRow.data.memory_text as string);

      const todayStr = new Date().toDateString();
      const todayIso = new Date().toISOString().slice(0, 10);
      const taskList = (tasks.data ?? []) as Record<string, unknown>[];
      const invList  = (inv.data   ?? []) as Record<string, unknown>[];
      const stList   = (st.data    ?? []) as Record<string, unknown>[];
      const lvList   = (lv.data    ?? []) as Record<string, unknown>[];
      const evList   = (ev.data    ?? []) as Record<string, unknown>[];

      const late    = taskList.filter(t => t.due_date && new Date(String(t.due_date) + "T00:00:00") < new Date(todayStr) && t.status !== "done").length;
      const urgent  = taskList.filter(t => t.priority === "urgent").length;
      const unpaid  = invList.filter(i => ["en_attente", "envoyée", "retard"].includes(String(i.statut)));
      const low     = stList.filter(s => Number(s.stock_current) <= Number(s.stock_minimum)).length;
      const pLeaves = lvList.filter(l => l.status === "pending").length;
      const todayEv = evList.filter(e => String(e.start_at ?? "").slice(0, 10) === todayIso).length;

      setInsights({
        lateTasks: late, urgentTasks: urgent,
        unpaidCount: unpaid.length,
        unpaidTotal: unpaid.reduce((s, i) => s + Number(i.montant_ttc ?? 0), 0),
        lowStock: low, pendingLeaves: pLeaves, todayEvents: todayEv,
      });
    } catch (err) {
      console.error("[assistant/insights]", err);
    }
    setInsLoading(false);
  }, []);

  useEffect(() => { loadConvs(); loadInsights(); }, [loadConvs, loadInsights]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const newConv = useCallback(async (): Promise<string> => {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id || "";
    if (!uid) return "";
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ title: "Nouvelle conversation", user_id: uid })
      .select("id,title,created_at")
      .single();
    if (error || !data) return "";
    const conv = data as Conv;
    setConvs(cs => [conv, ...cs]);
    setActiveConv(conv.id);
    setMsgs([]);
    setShowActions(true);
    return conv.id;
  }, [userId]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setShowActions(false);
    setInput("");

    let convId = activeConv;
    if (!convId) {
      convId = await newConv();
      if (!convId) { setSending(false); return; }
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMsgs(ms => [...ms, userMsg]);

    const uid = userId || (await supabase.auth.getUser()).data.user?.id || "";
    await supabase.from("ai_messages").insert({
      conversation_id: convId, role: "user", content: trimmed, user_id: uid,
    });

    setConsulting(["…"]);
    const { ctx, modules } = await buildContext(trimmed, uid);
    const sysCtx = mem.trim()
      ? `${ctx}\n\n[CONTEXTE MÉMORISÉ UTILISATEUR]\n${mem.trim()}\n[FIN CONTEXTE]`
      : ctx;
    setConsulting(modules.length > 0 ? modules : []);
    const aId = crypto.randomUUID();
    setMsgs(ms => [...ms, { id: aId, role: "assistant", content: "", modules, loading: true }]);

    try {
      const res = await fetch("/api/assistant/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, context: sysCtx, conversation_id: convId, memory: mem }),
      });
      const d = await res.json() as {
        mode?: string; text?: string; result?: string; error?: string;
        artifact?: ArtifactData; steps?: string[];
      };

      const reply = String(d.text ?? d.result ?? d.error ?? "Désolé, je n'ai pas pu répondre.");
      const artifact = d.artifact;
      const artifactSteps = d.steps;

      setMsgs(ms => ms.map(m => m.id === aId ? { ...m, loading: false, content: "" } : m));
      let i = 0;
      const STEP = 4;
      await new Promise<void>(resolve => {
        const iv = setInterval(() => {
          i = Math.min(i + STEP, reply.length);
          setMsgs(ms => ms.map(m => m.id === aId ? { ...m, content: reply.slice(0, i) } : m));
          if (i >= reply.length) { clearInterval(iv); resolve(); }
        }, 8);
      });

      if (artifact) {
        setMsgs(ms => ms.map(m => m.id === aId ? { ...m, artifact, artifactSteps } : m));
      }

      // Store full artifact metadata in sentinel so it can be restored without artifact_files table
      const modulesToStore = artifact
        ? [...modules, `artifact:${JSON.stringify({
            id: artifact.id, type: artifact.type, title: artifact.title,
            file_name: artifact.file_name, file_size: artifact.file_size,
            mime_type: artifact.mime_type,
            bucket: artifact.storage_bucket ?? "djama-artifacts",
            path: artifact.storage_path ?? "",
            metadata: artifact.metadata,
          })}`]
        : modules;
      await supabase.from("ai_messages").insert({
        conversation_id: convId, role: "assistant", content: reply,
        modules_used: modulesToStore, user_id: uid,
      });

      // Fallback PDF pour factures/devis (ancien système, si tools ne génère pas d'artefact)
      if (!artifact && isDocRequest(trimmed)) {
        setMsgs(ms => ms.map(m => m.id === aId ? { ...m, pdfGenerating: true } : m));
        try {
          const docRes = await fetch("/api/assistant/generate-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed }),
          });
          if (docRes.ok) {
            const docJson = await docRes.json() as { docData?: PdfData };
            if (docJson.docData) {
              setMsgs(ms => ms.map(m =>
                m.id === aId ? { ...m, pdfData: docJson.docData as PdfData, pdfGenerating: false } : m
              ));
            } else {
              setMsgs(ms => ms.map(m => m.id === aId ? { ...m, pdfGenerating: false } : m));
            }
          } else {
            setMsgs(ms => ms.map(m => m.id === aId ? { ...m, pdfGenerating: false } : m));
          }
        } catch {
          setMsgs(ms => ms.map(m => m.id === aId ? { ...m, pdfGenerating: false } : m));
        }
      }

      if (msgs.length === 0) {
        const title = trimmed.length > 50 ? trimmed.slice(0, 50) + "…" : trimmed;
        await supabase.from("ai_conversations").update({ title }).eq("id", convId);
        setConvs(cs => cs.map(c => c.id === convId ? { ...c, title } : c));
      }
    } catch {
      setMsgs(ms => ms.map(m => m.id === aId
        ? { ...m, loading: false, content: "Erreur de connexion à l'IA. Vérifiez votre connexion." }
        : m));
    }

    setConsulting([]);
    setSending(false);
    inputRef.current?.focus();
  }, [activeConv, sending, msgs.length, newConv]);

  const selectConv = async (id: string) => {
    setActiveConv(id);
    setShowActions(false);
    await loadMsgs(id);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const copyMsg = (content: string) => {
    navigator.clipboard.writeText(content).then(() => toast("Copié !"));
  };

  const handleNew = () => {
    setActiveConv(null);
    setMsgs([]);
    setShowActions(true);
    setShowSidebar(false);
  };

  /* ── Style tokens ── */
  const bg     = isDark ? "#07080e"                    : "#f8f7f4";
  const sbBg   = isDark ? "rgba(11,12,18,0.99)"        : "#ffffff";
  const bdr    = isDark ? "rgba(255,255,255,0.07)"      : "rgba(0,0,0,0.07)";
  const tx     = isDark ? "rgba(255,255,255,0.88)"      : "rgba(0,0,0,0.85)";
  const txMut  = isDark ? "rgba(255,255,255,0.42)"      : "rgba(0,0,0,0.42)";
  const txDim  = isDark ? "rgba(255,255,255,0.26)"      : "rgba(0,0,0,0.30)";
  const sur    = isDark ? "rgba(255,255,255,0.03)"      : "rgba(255,255,255,0.85)";
  const surH   = isDark ? "rgba(255,255,255,0.055)"     : "rgba(255,255,255,1)";
  const inpBg  = isDark ? "rgba(255,255,255,0.03)"      : "rgba(255,255,255,0.9)";

  /* Consulting label */
  const consultingLabel = consulting[0] === "…"
    ? "Analyse de votre demande…"
    : consulting.length > 0
      ? `Consultation : ${consulting.join(", ")}`
      : null;

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100dvh - 56px)", background: bg, color: tx }}>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex w-[290px] flex-col overflow-hidden lg:hidden"
              style={{ background: sbBg, borderRight: `1px solid ${bdr}` }}>
              <SidebarInner convs={convs} activeConv={activeConv} onNew={handleNew} onSelect={selectConv}
                onClose={() => setShowSidebar(false)} memNote={mem} onMemChange={setMem} isDark={isDark} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[255px] shrink-0 flex-col overflow-hidden"
        style={{ background: sbBg, borderRight: `1px solid ${bdr}` }}>
        <SidebarInner convs={convs} activeConv={activeConv} onNew={handleNew} onSelect={selectConv}
          memNote={mem} onMemChange={setMem} isDark={isDark} />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Topbar */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${bdr}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => setShowSidebar(true)}
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
              style={{ color: txMut }}>
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate" style={{ color: tx }}>
                {activeConv ? (convs.find(c => c.id === activeConv)?.title ?? "Conversation") : "DJAMA AI"}
              </h1>
              <p className="hidden sm:block text-xs" style={{ color: txDim }}>
                Connecté à tous vos modules
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Consulting indicator */}
            {consultingLabel && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ border: `1px solid ${gold}35`, background: `${gold}0f` }}>
                <Loader2 size={10} className="animate-spin" style={{ color: gold }} />
                <span className="max-w-[140px] truncate text-xs font-medium" style={{ color: gold }}>
                  {consultingLabel}
                </span>
              </div>
            )}
            {consultingLabel && <Loader2 size={13} className="animate-spin sm:hidden" style={{ color: gold }} />}

            {msgs.length > 0 && (
              <button onClick={exportConv}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition"
                style={{ border: `1px solid ${bdr}`, color: txMut }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${gold}35`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}>
                <Download size={12} />
                <span className="hidden sm:inline font-medium">Exporter</span>
              </button>
            )}

            <button
              onClick={() => setShowInsights(s => !s)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition"
              style={{
                border: showInsights ? `1px solid ${gold}50` : `1px solid ${bdr}`,
                background: showInsights ? `${gold}12` : "transparent",
                color: showInsights ? gold : txMut,
              }}>
              <Database size={12} />
              <span className="hidden sm:inline font-medium">Données</span>
            </button>
          </div>

          {/* Gold accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${gold}38, transparent)` }} />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 space-y-5"
          style={{ scrollbarWidth: "none" }}>

          {/* Welcome screen */}
          <AnimatePresence>
            {showActions && msgs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center gap-6 py-6 max-w-xl mx-auto w-full">

                {/* Symbol + greeting */}
                <div className="text-center">
                  {/* Gold glow */}
                  <div className="relative mx-auto mb-5 h-12 w-12">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-30"
                      style={{ background: gold }} />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: isDark ? `${gold}14` : `${gold}10`, border: `1px solid ${gold}28` }}>
                      <DjamaAiSymbol size={22} color={gold} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-1.5" style={{ color: tx }}>
                    Bonjour, <span style={{ color: gold }}>{userName}</span>
                  </h2>
                  <p className="text-sm" style={{ color: txMut }}>
                    Que souhaitez-vous faire dans DJAMA ?
                  </p>
                </div>

                {/* Composer (sur l'écran d'accueil) */}
                <ComposerBox
                  input={input} setInput={setInput} sending={sending}
                  onSend={() => send(input)} inputRef={inputRef} handleKey={handleKey}
                  isDark={isDark} gold={gold} bdr={bdr} inpBg={inpBg} tx={tx} txMut={txMut} txDim={txDim}
                />

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full px-4 py-1.5 text-xs font-medium transition"
                      style={{
                        border: `1px solid ${bdr}`,
                        background: sur,
                        color: txMut,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${gold}45`;
                        (e.currentTarget as HTMLElement).style.color = gold;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = bdr;
                        (e.currentTarget as HTMLElement).style.color = txMut;
                      }}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* Quick actions compact grid */}
                <div className="w-full">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest"
                    style={{ color: txDim }}>Actions rapides</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {ACTIONS.map(a => {
                      const warnItem = insights && (
                        (a.label === "Tâches urgentes"  && insights.urgentTasks  > 0) ||
                        (a.label === "Clients impayés"  && insights.unpaidCount  > 0) ||
                        (a.label === "Alertes stock"    && insights.lowStock     > 0) ||
                        (a.label === "Risques & alertes" && (insights.lateTasks > 0 || insights.urgentTasks > 0))
                      );
                      return (
                        <button key={a.label} onClick={() => send(a.prompt)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all active:scale-95"
                          style={{
                            background: warnItem ? `${gold}09` : sur,
                            border: `1px solid ${warnItem ? gold + "30" : bdr}`,
                            color: warnItem ? gold : txMut,
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = surH)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = warnItem ? `${gold}09` : sur)}>
                          <a.icon size={13} style={{ color: warnItem ? gold : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", flexShrink: 0 }} />
                          <span className="truncate leading-tight">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence initial={false}>
            {msgs.map(m => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                {/* Avatar */}
                <div className={`shrink-0 h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold`}
                  style={m.role === "assistant"
                    ? { background: `${gold}14`, border: `1px solid ${gold}28` }
                    : { background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", border: `1px solid ${bdr}` }}>
                  {m.role === "user"
                    ? <span style={{ color: tx }}>{userName[0]?.toUpperCase() ?? "V"}</span>
                    : <DjamaAiSymbol size={12} color={gold} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] md:max-w-[74%] flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <p className="text-[11px] font-medium mb-0.5 px-0.5" style={{ color: txDim }}>
                    {m.role === "user" ? userName : "DJAMA AI"}
                  </p>
                  <div className="rounded-2xl px-4 py-3"
                    style={m.role === "user"
                      ? {
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                        border: `1px solid ${bdr}`,
                        borderTopRightRadius: 6,
                      }
                      : {
                        background: sur,
                        border: `1px solid ${bdr}`,
                        borderTopLeftRadius: 6,
                        borderLeft: `2px solid ${gold}50`,
                        boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)",
                      }}>
                    {m.loading ? (
                      <div className="flex items-center gap-1.5 py-0.5">
                        {[0, 1, 2].map(j => (
                          <motion.span key={j} className="h-1.5 w-1.5 rounded-full"
                            style={{ background: gold }}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 0.85, delay: j * 0.17 }} />
                        ))}
                      </div>
                    ) : m.role === "assistant" ? (
                      <MsgContent text={m.content} isDark={isDark} />
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: tx }}>{m.content}</p>
                    )}
                  </div>

                  {/* Actions sous message IA */}
                  {m.role === "assistant" && !m.loading && (
                    <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                      {m.modules?.map(mod => (
                        <span key={mod} className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ border: `1px solid ${gold}22`, background: `${gold}0c`, color: `${gold}b0` }}>
                          {mod}
                        </span>
                      ))}
                      <button onClick={() => copyMsg(m.content)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition"
                        style={{ border: `1px solid ${bdr}`, color: txDim }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = tx)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = txDim)}>
                        <Copy size={9} /> Copier
                      </button>
                      <button onClick={() => speakMsg(m.content, m.id)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition"
                        style={{
                          border: speakingId === m.id ? `1px solid ${gold}45` : `1px solid ${bdr}`,
                          background: speakingId === m.id ? `${gold}12` : "transparent",
                          color: speakingId === m.id ? gold : txDim,
                        }}>
                        {speakingId === m.id ? <VolumeX size={9} /> : <Volume2 size={9} />}
                        {speakingId === m.id ? "Stop" : "Écouter"}
                      </button>
                      {m.pdfGenerating && (
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                          style={{ border: `1px solid ${gold}25`, color: `${gold}90` }}>
                          <Loader2 size={9} className="animate-spin" /> Préparation doc…
                        </span>
                      )}
                      {m.pdfData && !m.pdfGenerating && (
                        <DocDownloadButton pdfData={m.pdfData} isDark={isDark} />
                      )}
                    </div>
                  )}
                  {m.artifact && (
                    <ArtifactCard artifact={m.artifact} steps={m.artifactSteps} isDark={isDark} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Composer — fixé en bas quand conversation active */}
        {(!showActions || msgs.length > 0) && (
          <div className="shrink-0 px-4 sm:px-6 md:px-8 py-3.5"
            style={{ borderTop: `1px solid ${bdr}` }}>
            <ComposerBox
              input={input} setInput={setInput} sending={sending}
              onSend={() => send(input)} inputRef={inputRef} handleKey={handleKey}
              isDark={isDark} gold={gold} bdr={bdr} inpBg={inpBg} tx={tx} txMut={txMut} txDim={txDim}
            />
          </div>
        )}
      </div>

      {/* Insights column — mobile drawer */}
      <AnimatePresence>
        {showInsights && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.60)" }}
              onClick={() => setShowInsights(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex w-[290px] flex-col overflow-hidden lg:hidden"
              style={{ background: sbBg, borderLeft: `1px solid ${bdr}` }}>
              <InsightsInner insights={insights} insLoading={insLoading} onRefresh={loadInsights}
                onClose={() => setShowInsights(false)} isDark={isDark} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Insights column — desktop */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 255, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", damping: 22 }}
            className="hidden lg:flex shrink-0 flex-col overflow-hidden"
            style={{ borderLeft: `1px solid ${bdr}`, background: sbBg }}>
            <div className="w-[255px] h-full flex flex-col overflow-hidden">
              <InsightsInner insights={insights} insLoading={insLoading} onRefresh={loadInsights} isDark={isDark} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastData && <Toast toast={toastData} onClose={() => setToastData(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Composer box (shared between welcome + conversation) ───────────── */
function ComposerBox({
  input, setInput, sending, onSend, inputRef, handleKey,
  isDark, gold, bdr, inpBg, tx, txMut, txDim,
}: {
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isDark: boolean; gold: string; bdr: string; inpBg: string;
  tx: string; txMut: string; txDim: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full space-y-1.5">
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all"
        style={{
          background: inpBg,
          border: `1px solid ${focused ? gold + "45" : bdr}`,
          boxShadow: focused
            ? (isDark ? `0 0 0 3px ${gold}0f, 0 4px 16px rgba(0,0,0,0.18)` : `0 0 0 3px ${gold}12, 0 2px 8px rgba(0,0,0,0.06)`)
            : (isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)"),
        }}>
        {/* Attach */}
        <button className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl transition"
          style={{ color: txDim }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = gold)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = txDim)}>
          <Paperclip size={14} />
        </button>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Demandez à DJAMA…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none max-h-32"
          style={{
            color: tx,
            lineHeight: "1.5",
            scrollbarWidth: "none",
          }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
        />

        {/* Send */}
        <button
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-25 hover:opacity-90 active:scale-95"
          style={{
            background: input.trim() && !sending ? gold : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
            color: input.trim() && !sending ? "#0a0a0a" : txMut,
          }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
      <p className="text-center text-[11px]" style={{ color: txDim }}>
        Maj+Entrée pour saut de ligne · DJAMA AI peut utiliser les données auxquelles vous avez accès
      </p>
    </div>
  );
}
