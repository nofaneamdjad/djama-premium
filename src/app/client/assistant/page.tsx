"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Zap, Users, Package, Calendar, BarChart2,
  AlertTriangle, PenLine, Loader2, RefreshCw,
  Copy, Sparkles, Clock, CreditCard, Receipt, ListTodo,
  UserCheck, ChevronRight, Menu, X, Send,
  Download, Volume2, VolumeX, BookMarked, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";
import { useTheme } from "@/lib/theme-context";
import { APP_ICONS } from "@/components/AppIcons";
import { generatePdf, type PdfData } from "@/lib/pdf/generatePdf";
import { fetchCompanySettings } from "@/lib/pdf/companySettings";

const CYAN   = "#22d3ee";
const VIOLET = "#8b5cf6";

const ACTIONS: { icon: LucideIcon; label: string; color: string; prompt: string }[] = [
  { icon: DollarSign,    label: "Finances du mois",     color: "#10b981", prompt: "Analyse mes finances du mois : revenus, dépenses, factures impayées. Donne un résumé actionnable avec les chiffres clés." },
  { icon: Zap,           label: "Tâches urgentes",      color: "#ef4444", prompt: "Quelles sont mes tâches urgentes et en retard ? Que dois-je faire en priorité aujourd'hui ?" },
  { icon: Users,         label: "Clients impayés",      color: "#f59e0b", prompt: "Liste les clients avec des factures impayées. Donne les montants, les délais de retard et suggère une action de relance." },
  { icon: Package,       label: "Alertes stock",        color: "#8b5cf6", prompt: "Quels produits sont en stock faible ou en rupture ? Lesquels dois-je réapprovisionner en urgence ?" },
  { icon: Calendar,      label: "Ma journée",           color: "#3b82f6", prompt: "Organise ma journée idéale en tenant compte de mes tâches prioritaires, réunions prévues et objectifs." },
  { icon: BarChart2,     label: "Rapport business",     color: CYAN,      prompt: "Génère un rapport business complet : revenus, dépenses, tâches terminées, clients actifs, alertes importantes." },
  { icon: AlertTriangle, label: "Risques & alertes",    color: "#f97316", prompt: "Détecte tous les risques business : retards de paiement, stock bas, surcharge équipe, projets en retard." },
  { icon: PenLine,       label: "Créer une facture",    color: "#a78bfa", prompt: "Crée une facture pour un client, prestation de service, montant 500€ HT, TVA 20%." },
];

const SUGGESTIONS = [
  "Crée une facture pour Jean Martin, mission de conseil 1200€ HT",
  "Génère un devis pour Sophie Dupont, développement site web 3500€",
  "Quel est mon chiffre d'affaires ce mois-ci ?",
  "Qui sont mes clients les plus actifs ?",
  "Quels fournisseurs coûtent le plus cher ?",
  "Combien de tâches j'ai en retard ?",
];

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  modules?: string[];
  loading?: boolean;
  pdfData?: PdfData;
  pdfGenerating?: boolean;
}

function isDocRequest(text: string): boolean {
  return /facture|invoice|devis|quote|proposition commerciale|bon de commande/i.test(text);
}

function DocDownloadButton({ pdfData, isDark }: { pdfData: PdfData; isDark: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const co = await fetchCompanySettings();
      await generatePdf({ ...pdfData, company: co });
    } catch {
      // silently fail — generatePdf triggers browser download
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-semibold transition active:scale-95 disabled:opacity-60"
      style={{
        background: isDark ? "rgba(34,211,238,0.12)" : "rgba(34,211,238,0.10)",
        border: "1px solid rgba(34,211,238,0.35)",
        color: isDark ? "#22d3ee" : "#0891b2",
      }}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
      {loading ? "Génération…" : `Télécharger ${pdfData.type === "invoice" ? "Facture" : "Devis"} PDF`}
    </button>
  );
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
    const st = await get("stock_products", "name,quantity,min_quantity,category");
    if (st.length) {
      used.push("Stocks");
      const low  = st.filter(s => Number(s.quantity) <= Number(s.min_quantity));
      const zero = st.filter(s => Number(s.quantity) === 0);
      parts.push(`STOCKS (${st.length} produits): ${low.length} stock faible · ${zero.length} rupture totale.`);
      if (low.length) parts.push(`  ↳ À réapprovisionner: ${low.slice(0, 6).map(s => `${s.name} (${s.quantity}/${s.min_quantity})`).join(" · ")}`);
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

function MsgContent({ text }: { text: string }) {
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
      out.push(<p key={i} className="text-[0.82rem] font-bold text-white/95 mt-3 mb-1 first:mt-0">{line.replace(/^#{2,3}\s/, "")}</p>);
    } else if (line.match(/^[-•*]\s/)) {
      const content = line.replace(/^[-•*]\s/, "");
      listBuf.push(
        <li key={i} className="flex gap-2 text-[0.8rem] text-white/82 leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0 flex-none" style={{ background: CYAN }} />
          <span>{bold(content)}</span>
        </li>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, "");
      const num = line.match(/^(\d+)\./)?.[1];
      listBuf.push(
        <li key={i} className="flex gap-2 text-[0.8rem] text-white/82 leading-relaxed">
          <span className="shrink-0 text-[0.7rem] font-bold" style={{ color: CYAN }}>{num}.</span>
          <span>{bold(content)}</span>
        </li>
      );
    } else if (line.trim() === "") {
      flushList();
      out.push(<div key={i} className="h-1" />);
    } else {
      flushList();
      out.push(<p key={i} className="text-[0.8rem] text-white/82 leading-relaxed">{bold(line)}</p>);
    }
  });
  flushList();

  return <div className="space-y-0.5">{out}</div>;
}

function bold(text: string): React.ReactNode {
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{p}</strong> : p
  );
}

function InsightsPanel({ insights, loading }: { insights: LiveInsights | null; loading: boolean }) {
  const items: { icon: LucideIcon; label: string; value: number | string; color: string; warn: boolean }[] = insights ? [
    { icon: Zap,        label: "Tâches urgentes",  value: insights.urgentTasks,                  color: "#ef4444", warn: insights.urgentTasks > 0 },
    { icon: Clock,      label: "En retard",         value: insights.lateTasks,                    color: "#f97316", warn: insights.lateTasks > 0 },
    { icon: CreditCard, label: "Factures impayées", value: insights.unpaidCount,                  color: "#f59e0b", warn: insights.unpaidCount > 0 },
    { icon: DollarSign, label: "Montant impayé",    value: `${insights.unpaidTotal.toFixed(0)}€`, color: "#10b981", warn: false },
    { icon: Package,    label: "Stock faible",      value: insights.lowStock,                     color: "#8b5cf6", warn: insights.lowStock > 0 },
    { icon: Calendar,   label: "Réunions du jour",  value: insights.todayEvents,                  color: CYAN,      warn: false },
  ] : [];

  return (
    <div className="space-y-2">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-white/30 py-4">
          <Loader2 size={12} className="animate-spin" /> Chargement…
        </div>
      )}
      {!loading && items.map(item => (
        <div key={item.label}
          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${item.warn ? "border-white/[0.1] bg-white/[0.03]" : "border-white/[0.05] bg-transparent"}`}>
          <div className="flex items-center gap-2">
            <item.icon size={14} style={{ color: item.color }} />
            <span className="text-[0.72rem] text-white/55">{item.label}</span>
          </div>
          <span className={`text-sm font-bold ${item.warn ? "animate-pulse" : ""}`}
            style={{ color: item.color }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SidebarInner({
  convs, activeConv, onNew, onSend, onSelect, onClose,
  memNote, onMemChange,
}: {
  convs: Conv[];
  activeConv: string | null;
  onNew: () => void;
  onSend: (prompt: string) => void;
  onSelect: (id: string) => void;
  onClose?: () => void;
  memNote: string;
  onMemChange: (v: string) => void;
}) {
  return (
    <>
            <div className="px-4 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: CYAN + "20", border: `1px solid ${CYAN}30` }}>
              <Sparkles size={14} style={{ color: CYAN }} />
            </div>
            <div>
              <p className="text-[0.82rem] font-semibold text-white/90">DJAMA AI</p>
              <p className="text-[0.58rem] text-white/30">Cerveau central</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white/70 rounded-lg transition">
              <X size={18} />
            </button>
          )}
        </div>
        <button onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})` }}>
          + Nouvelle conversation
        </button>
      </div>

            <div className="px-3 py-3 border-b border-white/[0.06] shrink-0">
        <p className="text-[0.65rem] font-medium text-white/35 mb-2 px-1">Actions rapides</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map(a => (
            <button key={a.label}
              onClick={() => { onSend(a.prompt); onClose?.(); }}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2 py-2.5 text-center transition hover:border-white/10 hover:bg-white/[0.04] active:scale-95">
              <a.icon size={18} style={{ color: a.color }} />
              <span className="text-[0.58rem] text-white/50 leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="text-[0.65rem] font-medium text-white/35 mb-2 px-2">Historique</p>
        {convs.length === 0 && (
          <p className="text-center text-[0.68rem] text-white/20 py-4">Aucune conversation</p>
        )}
        {convs.map(c => (
          <button key={c.id} onClick={() => { onSelect(c.id); onClose?.(); }}
            className={`w-full text-left rounded-lg px-2.5 py-2.5 text-xs transition mb-0.5 ${activeConv === c.id
              ? "text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/75"}`}
            style={activeConv === c.id ? { background: CYAN + "18" } : {}}>
            <p className="truncate font-medium">{c.title}</p>
            <p className="text-[0.58rem] text-white/25 mt-0.5">
              {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
          </button>
        ))}
      </div>

      {/* Mémoire persistante */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BookMarked size={11} style={{ color: CYAN }} />
          <p className="text-[0.63rem] font-semibold text-white/35">Contexte mémorisé</p>
        </div>
        <textarea
          value={memNote}
          onChange={e => onMemChange(e.target.value)}
          placeholder="Ex: Freelance à Paris, TJM 450€, client principal Acme Corp…"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[0.66rem] text-white/65 placeholder:text-white/20 outline-none focus:border-cyan-500/30 transition scrollbar-none"
        />
        {memNote.trim() && (
          <p className="mt-1 text-[0.56rem] px-0.5" style={{ color: CYAN + "90" }}>
            ✓ Inclus dans chaque conversation
          </p>
        )}
      </div>
    </>
  );
}

function InsightsInner({
  insights, insLoading, onRefresh, onClose,
}: {
  insights: LiveInsights | null;
  insLoading: boolean;
  onRefresh: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <p className="text-xs font-bold text-white/60">Tableau de bord live</p>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white/70 rounded-lg transition">
            <X size={18} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!onClose && (
          <p className="text-[0.65rem] font-medium text-white/35">Tableau de bord live</p>
        )}

        <InsightsPanel insights={insights} loading={insLoading} />

        <button onClick={onRefresh}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2.5 text-xs text-white/30 hover:text-white/60 hover:border-white/15 transition">
          <RefreshCw size={11} /> Actualiser
        </button>

        <div>
          <p className="text-[0.65rem] font-medium text-white/35 mb-2">Accès rapides</p>
          {([
            { Icon: Receipt,   label: "Factures",  href: "/client/factures"     },
            { Icon: ListTodo,  label: "Tâches",    href: "/client/productivite" },
            { Icon: Users,     label: "CRM",       href: "/client/crm"          },
            { Icon: Package,   label: "Stocks",    href: "/client/stocks"       },
            { Icon: Calendar,  label: "Planning",  href: "/client/planning"     },
            { Icon: UserCheck, label: "Équipe",    href: "/client/equipe"       },
          ] as { Icon: LucideIcon; label: string; href: string }[]).map(s => (
            <a key={s.href} href={s.href}
              className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-xs text-white/45 hover:bg-white/[0.04] hover:text-white/75 transition">
              <s.Icon size={13} className="text-white/30" />
              <span>{s.label}</span>
              <ChevronRight size={11} className="ml-auto text-white/20" />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AssistantPage() {
  const { isDark } = useTheme();
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
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const [mem,          setMem]          = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
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
    setMsgs((data ?? []).map((m: Record<string, unknown>) => ({
      id: String(m.id), role: m.role as "user" | "assistant",
      content: String(m.content),
      modules: Array.isArray(m.modules_used) ? m.modules_used.map(String) : [],
    })));
  }, []);

  const loadInsights = useCallback(async () => {
    setInsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setInsLoading(false); return; }
      setUserId(authUser.id);
      const uid = authUser.id;
      const [tasks, inv, st, lv, ev, memRow] = await Promise.all([
        supabase.from("productivity_tasks").select("status,priority,due_date").eq("user_id", uid).limit(200),
        supabase.from("factures").select("statut,montant_ttc").eq("user_id", uid).limit(200),
        supabase.from("stock_products").select("quantity,min_quantity").eq("user_id", uid).limit(200),
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
      const low     = stList.filter(s => Number(s.quantity) <= Number(s.min_quantity)).length;
      const pLeaves = lvList.filter(l => l.status === "pending").length;
      const todayEv = evList.filter(e => String(e.start_at ?? "").slice(0, 10) === todayIso).length;

      setInsights({
        lateTasks: late, urgentTasks: urgent,
        unpaidCount: unpaid.length,
        unpaidTotal: unpaid.reduce((s, i) => s + Number(i.montant_ttc ?? 0), 0),
        lowStock: low, pendingLeaves: pLeaves, todayEvents: todayEv,
      });
    } catch {  }
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

    await supabase.from("ai_messages").insert({
      conversation_id: convId, role: "user", content: trimmed,
    });

    setConsulting(["…"]);
    const uid = userId || (await supabase.auth.getUser()).data.user?.id || "";
    const { ctx, modules } = await buildContext(trimmed, uid);
    const sysCtx = mem.trim()
      ? `${ctx}\n\n[CONTEXTE MÉMORISÉ UTILISATEUR]\n${mem.trim()}\n[FIN CONTEXTE]`
      : ctx;
    setConsulting(modules.length > 0 ? modules : []);

    const aId = crypto.randomUUID();
    setMsgs(ms => [...ms, { id: aId, role: "assistant", content: "", modules, loading: true }]);

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", content: sysCtx, prompt: trimmed }),
      });
      const d = await res.json();
      const reply = String(d.result ?? d.error ?? "Désolé, je n'ai pas pu répondre.");

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

      await supabase.from("ai_messages").insert({
        conversation_id: convId, role: "assistant", content: reply, modules_used: modules,
      });

      // Si l'utilisateur demande un document, extraire les données PDF
      if (isDocRequest(trimmed)) {
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

  return (
    <div className={`flex h-[calc(100dvh-56px)] overflow-hidden ${isDark ? "bg-[#07080e] text-white" : "bg-[#f0f2fb] text-gray-900 ai-light"}`}>
      {!isDark && (
        <style>{`
          .ai-light [class*="border-white/"] { border-color: rgba(12,24,100,0.09) !important; }
          .ai-light [class*="bg-white/[0.0"] { background-color: rgba(12,24,100,0.03) !important; }
          .ai-light [class*="hover:bg-white/"]:hover { background-color: rgba(12,24,100,0.05) !important; }
          .ai-light .text-white { color: #111827 !important; }
          .ai-light [class*="text-white/9"] { color: rgba(12,18,50,0.90) !important; }
          .ai-light [class*="text-white/8"] { color: rgba(12,18,50,0.82) !important; }
          .ai-light [class*="text-white/7"] { color: rgba(12,18,50,0.65) !important; }
          .ai-light [class*="text-white/6"] { color: rgba(12,18,50,0.58) !important; }
          .ai-light [class*="text-white/5"] { color: rgba(12,18,50,0.52) !important; }
          .ai-light [class*="text-white/4"] { color: rgba(12,18,50,0.45) !important; }
          .ai-light [class*="text-white/3"] { color: rgba(12,18,50,0.38) !important; }
          .ai-light [class*="text-white/2"] { color: rgba(12,18,50,0.28) !important; }
          .ai-light [class*="text-white/1"] { color: rgba(12,18,50,0.18) !important; }
          .ai-light [class*="hover:text-white/"]:hover { color: rgba(12,18,50,0.75) !important; }
          .ai-light textarea { color: #111827 !important; }
          .ai-light textarea::placeholder { color: rgba(12,18,50,0.30) !important; }
          .ai-light input::placeholder { color: rgba(12,18,50,0.30) !important; }
        `}</style>
      )}

            <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={`fixed left-0 top-0 bottom-0 w-[300px] z-50 flex flex-col lg:hidden overflow-hidden border-r ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-[rgba(12,24,100,0.09)]"}`}
            >
              <SidebarInner
                convs={convs}
                activeConv={activeConv}
                onNew={handleNew}
                onSend={send}
                onSelect={selectConv}
                onClose={() => setShowSidebar(false)}
                memNote={mem}
                onMemChange={setMem}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <div className={`hidden lg:flex w-[260px] shrink-0 flex-col border-r ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-[rgba(12,24,100,0.09)] bg-white"}`}>
        <SidebarInner
          convs={convs}
          activeConv={activeConv}
          onNew={handleNew}
          onSend={send}
          onSelect={selectConv}
          memNote={mem}
          onMemChange={setMem}
        />
      </div>

            <div className="flex-1 flex flex-col min-w-0">

                <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-white/[0.06] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
                        <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden shrink-0 h-9 w-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition">
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white/85 truncate">
                {activeConv ? convs.find(c => c.id === activeConv)?.title ?? "Conversation" : "Assistant IA"}
              </h1>
              <p className="hidden sm:block text-[0.62rem] text-white/30 truncate">
                Connecté à tous vos modules DJAMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
                        {consulting.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1">
                  <Loader2 size={11} className="animate-spin text-cyan-400" />
                  <span className="text-[0.62rem] text-cyan-300 max-w-[120px] truncate">
                    {consulting.join(", ")}
                  </span>
                </div>
                <Loader2 size={14} className="animate-spin text-cyan-400 sm:hidden" />
              </div>
            )}
            {msgs.length > 0 && (
              <button onClick={exportConv} title="Exporter la conversation"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] px-2.5 py-2 text-xs text-white/40 hover:border-white/15 hover:text-white/70 transition">
                <Download size={13} />
                <span className="hidden sm:inline font-medium">Export</span>
              </button>
            )}
                        <button
              onClick={() => setShowInsights(s => !s)}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs transition ${showInsights
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                : "border-white/[0.07] text-white/40 hover:border-white/15"}`}>
              <BarChart2 size={13} />
              <span className="hidden sm:inline font-medium">Live</span>
            </button>
          </div>
        </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

                    <AnimatePresence>
            {showActions && msgs.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-5 md:space-y-7">

                                <div className="text-center pt-4 pb-2">
                  <div className="mx-auto mb-4 h-14 w-14 overflow-hidden rounded-2xl"
                    style={isDark ? {} : {
                      background: "rgba(34,211,238,0.09)",
                      border: "1px solid rgba(34,211,238,0.22)",
                      boxShadow: "0 4px 18px rgba(34,211,238,0.12), 0 2px 8px rgba(12,24,100,0.07)",
                    }}>
                    {APP_ICONS["/client/assistant"]}
                  </div>
                  <h2 className="text-xl font-bold text-white/90 mb-2">Bonjour</h2>
                  <p className="text-sm text-white/45 max-w-sm mx-auto leading-relaxed px-2">
                    Je suis DJAMA AI, votre assistant business intelligent — factures, tâches, clients, stocks en temps réel.
                  </p>
                </div>

                                <div>
                  <p className="text-[0.65rem] font-medium text-white/35 mb-3 text-center">Actions rapides</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACTIONS.map(a => (
                      <button key={a.label} onClick={() => send(a.prompt)}
                        className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 text-center transition active:scale-95"
                        style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.85)", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.09)"}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(12,24,100,0.06)" }}>
                        <a.icon size={22} style={{ color: a.color }} />
                        <span className="text-[0.65rem] text-white/55 leading-snug">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                                <div>
                  <p className="text-[0.65rem] font-medium text-white/35 mb-3 text-center">Essayez de demander…</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)}
                        className={`rounded-full px-3.5 py-2 text-xs transition active:scale-95 ${isDark ? "border border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-cyan-500/30 hover:text-cyan-300 hover:bg-cyan-500/10" : "border border-[rgba(12,24,100,0.12)] bg-white/80 text-[rgba(12,18,50,0.55)] hover:border-[rgba(201,165,90,0.45)] hover:text-[#8a6a28] hover:bg-[rgba(201,165,90,0.08)]"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

                    <AnimatePresence initial={false}>
            {msgs.map(m => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex gap-2 md:gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                                <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold ${m.role === "user"
                  ? "bg-violet-500/20 border border-violet-500/30"
                  : "border border-cyan-500/30"}`}
                  style={m.role === "assistant"
                    ? { background: CYAN + "15", color: "#22d3ee" }
                    : { color: isDark ? "#c4b5fd" : "#6d28d9" }}>
                  {m.role === "user" ? "U" : <Sparkles size={13} style={{ color: CYAN }} />}
                </div>

                                <div className={`max-w-[84%] md:max-w-[76%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-2xl px-3.5 md:px-4 py-3 ${m.role === "user"
                    ? "rounded-tr-sm border border-violet-500/20"
                    : "rounded-tl-sm border border-white/[0.07]"}`}
                    style={m.role === "user"
                      ? { background: isDark ? "rgba(124,58,237,0.18)" : "rgba(109,40,217,0.07)" }
                      : { background: isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.85)", borderLeft: `2px solid ${CYAN}40` }}>

                    {m.loading ? (
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map(j => (
                          <motion.span key={j} className="h-1.5 w-1.5 rounded-full"
                            style={{ background: CYAN }}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.15 }} />
                        ))}
                      </div>
                    ) : m.role === "assistant" ? (
                      <MsgContent text={m.content} />
                    ) : (
                      <p className="text-sm text-white/88 leading-relaxed">{m.content}</p>
                    )}
                  </div>

                                    {m.role === "assistant" && !m.loading && (
                    <div className="flex items-center gap-1.5 flex-wrap px-1">
                      {m.modules?.map(mod => (
                        <span key={mod} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[0.58rem] text-cyan-300/70">
                          {mod}
                        </span>
                      ))}
                      <button onClick={() => copyMsg(m.content)}
                        className="flex items-center gap-1 rounded-full border border-white/[0.06] px-2.5 py-1 text-[0.62rem] text-white/30 hover:text-white/60 hover:border-white/15 transition ml-0.5">
                        <Copy size={9} /> Copier
                      </button>
                      <button onClick={() => speakMsg(m.content, m.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.62rem] transition ${speakingId === m.id ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/15"}`}>
                        {speakingId === m.id ? <VolumeX size={9} /> : <Volume2 size={9} />}
                        {speakingId === m.id ? "Stop" : "Écouter"}
                      </button>
                      {m.pdfGenerating && (
                        <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 px-2.5 py-1 text-[0.62rem] text-cyan-300/60">
                          <Loader2 size={9} className="animate-spin" /> Préparation doc…
                        </span>
                      )}
                      {m.pdfData && !m.pdfGenerating && (
                        <DocDownloadButton pdfData={m.pdfData} isDark={isDark} />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

                <div className="shrink-0 border-t border-white/[0.06] px-3 sm:px-5 md:px-6 py-3 md:py-4">
          <div className="flex items-end gap-2 md:gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] px-3 md:px-4 py-2.5 md:py-3 focus-within:border-cyan-500/40 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez une question sur vos finances, tâches, clients…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25 max-h-32 scrollbar-none"
              style={{ lineHeight: "1.5" }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition disabled:opacity-30 hover:opacity-90 active:scale-95"
              style={{ background: sending ? VIOLET + "60" : `linear-gradient(135deg, ${CYAN}, ${VIOLET})` }}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="hidden md:block text-center text-[0.6rem] text-white/18 mt-2">
            Maj+Entrée pour saut de ligne · DJAMA AI a accès à vos données en temps réel
          </p>
        </div>
      </div>

            <AnimatePresence>
        {showInsights && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setShowInsights(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 bottom-0 w-[300px] z-50 bg-white/[0.025] border-l border-white/[0.06] flex flex-col lg:hidden overflow-hidden"
            >
              <InsightsInner
                insights={insights}
                insLoading={insLoading}
                onRefresh={loadInsights}
                onClose={() => setShowInsights(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

            <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", damping: 22 }}
            className="hidden lg:flex shrink-0 flex-col border-l border-white/[0.06] bg-white/[0.025] overflow-hidden">
            <div className="w-[260px] h-full flex flex-col overflow-hidden">
              <InsightsInner
                insights={insights}
                insLoading={insLoading}
                onRefresh={loadInsights}
              />
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
