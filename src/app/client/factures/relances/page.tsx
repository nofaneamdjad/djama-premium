"use client";

/**
 * Relances & Recouvrement — Module complet DJAMA
 * 5 onglets : Vue d'ensemble · Factures dues · Automatisation · Modèles · Historique
 */

import {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import { useTheme }   from "@/lib/theme-context";
import Link           from "next/link";
import {
  LayoutDashboard, FileText, Settings2, BookTemplate, History,
  BellRing, TrendingUp, TrendingDown, Users, Send, AlertCircle,
  CheckCircle, Clock, XCircle, Mail, Eye, MoreHorizontal,
  Plus, Trash2, Save, Loader2, Check, X, ChevronDown,
  Sparkles, ArrowLeft, ArrowRight, RefreshCw, ExternalLink,
  ToggleLeft, ToggleRight, Globe, Edit3, Info,
  Search, Filter,
} from "lucide-react";

const YELLOW = "#FFB900";
const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalDu: number;
  facturesCount: number;
  clientsCount: number;
  sent: number;
  failed: number;
  scheduled: number;
  recovered: number;
  trend: { sent30: number; sent90: number; sent365: number };
  weeks: { label: string; from?: string; to?: string; count: number }[];
}

interface FactureDue {
  id: string;
  numero: string;
  clientNom: string;
  clientEmail: string;
  clientSociete: string;
  clientPays: string;
  clientId: string | null;
  montantDu: number;
  devise: string;
  dateEcheance: string;
  daysOverdue: number;
  dernierRelance: string | null;
  relancesCount: number;
  prochaineRelanceIn: number | null;
  statut: string;
}

interface RelanceConfig {
  enabled: boolean;
  delays: number[];
  email_cc: string | null;
  send_time?: string;
  timezone?: string;
  language?: string;
  draft_mode?: boolean;
  excluded_clients?: string[];
  stop_on_dispute?: boolean;
  max_relances?: number;
}

interface Template {
  id: string;
  level: string;
  name: string;
  subject: string;
  body: string;
  is_system?: boolean;
  is_default?: boolean;
}

interface HistoryEntry {
  id: string;
  document_id: string;
  delay_days: number;
  sent_at: string;
  status: string;
  channel: string;
  template_level: string | null;
  message_id: string | null;
  error_message: string | null;
  documents: { numero: string; client_nom: string; client_email?: string; total_ttc?: number; devise?: string } | null;
}

// Modal relance manuelle — 6 étapes
interface RelanceModal {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  facture: FactureDue;
  templateLevel: string;
  subject: string;
  message: string;
  sending: boolean;
  sent: boolean;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "factures",    label: "Factures dues",   icon: FileText },
  { id: "automation",  label: "Automatisation",  icon: Settings2 },
  { id: "templates",   label: "Modèles",         icon: BookTemplate },
  { id: "history",     label: "Historique",      icon: History },
] as const;
type TabId = typeof TABS[number]["id"];

const LEVEL_CONFIG: Record<string, { label: string; color: string; desc: string; warnLegal?: boolean }> = {
  rappel:          { label: "Rappel courtois",          color: "#10b981", desc: "1er contact, ton neutre et bienveillant" },
  amical:          { label: "Relance amicale",          color: "#3b82f6", desc: "Rappel chaleureux avec compréhension" },
  professionnel:   { label: "Relance professionnelle",  color: "#6366f1", desc: "Ton neutre, factuel, clair" },
  ferme:           { label: "Relance ferme",            color: "#f59e0b", desc: "Message urgent mais respectueux" },
  dernier:         { label: "Dernier rappel",           color: "#ef4444", desc: "Dernier avertissement avant action" },
  mise_en_demeure: { label: "Mise en demeure",          color: "#dc2626", desc: "Modèle indicatif — validation humaine requise", warnLegal: true },
};

function fmtAmt(amount: number, devise = "EUR"): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: devise,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString("fr-FR")} ${devise}`;
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 2)    return "à l'instant";
  if (diff < 60)   return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.round(diff / 60)} h`;
  if (diff < 2880) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function retardBadge(days: number) {
  const cls = days >= 60 ? "text-red-400 bg-red-500/10 border-red-500/20"
            : days >= 30 ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
            : days >= 15 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
            :              "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      J+{days}
    </span>
  );
}

function statusBadge(status: string) {
  if (status === "sent")      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><CheckCircle size={10}/> Envoyé</span>;
  if (status === "failed")    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400"><XCircle size={10}/> Échec</span>;
  if (status === "scheduled") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400"><Clock size={10}/> Programmé</span>;
  if (status === "cancelled") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400"><XCircle size={10}/> Annulé</span>;
  return <span className="text-[11px] text-gray-400">{status}</span>;
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function RelancesPage() {
  const { isDark } = useTheme();

  const [tab,   setTab]   = useState<TabId>("overview");
  const [toast, setToast] = useState<{ type: "ok" | "err" | "info"; msg: string } | null>(null);

  // Data
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [factures,  setFactures]  = useState<FactureDue[]>([]);
  const [config,    setConfig]    = useState<RelanceConfig>({ enabled: false, delays: [7, 14, 30], email_cc: null });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage,  setHistPage]  = useState(1);
  const [histStatus,setHistStatus]= useState("");

  // Loading
  const [loadStats, setLoadStats] = useState(true);
  const [loadFact,  setLoadFact]  = useState(false);
  const [loadConf,  setLoadConf]  = useState(true);
  const [loadTpl,   setLoadTpl]   = useState(true);
  const [loadHist,  setLoadHist]  = useState(false);

  // UI
  const [search,       setSearch]       = useState("");
  const [sortFact,     setSortFact]     = useState("retard_desc");
  const [configDirty,  setConfigDirty]  = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editTpl,      setEditTpl]      = useState<Template | null>(null);
  const [tplDirty,     setTplDirty]     = useState(false);
  const [savingTpl,    setSavingTpl]    = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [previewMode,  setPreviewMode]  = useState<"desktop" | "mobile">("desktop");
  const [menuFactId,   setMenuFactId]   = useState<string | null>(null);

  // Modal relance manuelle
  const [relModal, setRelModal] = useState<RelanceModal | null>(null);

  // Thème
  const bg   = isDark ? "bg-[#0f1117]"             : "bg-gray-50";
  const bg2  = isDark ? "bg-white/[0.03]"           : "bg-white";
  const bd   = isDark ? "border-white/[0.07]"       : "border-gray-200";
  const t1   = isDark ? "text-white"                : "text-gray-900";
  const t2   = isDark ? "text-white/60"             : "text-gray-600";
  const t3   = isDark ? "text-white/35"             : "text-gray-400";
  const thbg = isDark ? "bg-white/[0.03]"           : "bg-gray-50";
  const inp  = isDark
    ? "bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/20 focus:border-[#FFB900]/40"
    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[#FFB900]/50";

  function showToast(type: "ok" | "err" | "info", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  }

  // ── Chargement ────────────────────────────────────────────────────────────────

  const loadStats_ = useCallback(async () => {
    setLoadStats(true);
    try {
      const r = await fetch("/api/relances/stats");
      if (r.ok) setStats(await r.json() as Stats);
    } catch { /* silencieux */ }
    finally { setLoadStats(false); }
  }, []);

  const loadFactures = useCallback(async () => {
    setLoadFact(true);
    try {
      const sp = new URLSearchParams({ search, sort: sortFact });
      const r  = await fetch(`/api/relances/factures-dues?${sp}`);
      if (r.ok) {
        const j = await r.json() as { factures: FactureDue[] };
        setFactures(j.factures ?? []);
      }
    } catch { /* silencieux */ }
    finally { setLoadFact(false); }
  }, [search, sortFact]);

  const loadConfig = useCallback(async () => {
    setLoadConf(true);
    try {
      const r = await fetch("/api/relances/config");
      if (r.ok) {
        const j = await r.json() as { config: RelanceConfig };
        setConfig(j.config);
      }
    } catch { /* silencieux */ }
    finally { setLoadConf(false); }
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoadTpl(true);
    try {
      const r = await fetch("/api/relances/templates");
      if (r.ok) {
        const j = await r.json() as { templates: Template[] };
        setTemplates(j.templates ?? []);
      }
    } catch { /* silencieux */ }
    finally { setLoadTpl(false); }
  }, []);

  const loadHistory_ = useCallback(async (p = 1, st = "") => {
    setLoadHist(true);
    try {
      const sp = new URLSearchParams({ page: String(p), ...(st ? { status: st } : {}) });
      const r  = await fetch(`/api/relances/history?${sp}`);
      if (r.ok) {
        const j = await r.json() as { entries: HistoryEntry[]; total: number };
        setHistory(j.entries ?? []);
        setHistTotal(j.total ?? 0);
      }
    } catch { /* silencieux */ }
    finally { setLoadHist(false); }
  }, []);

  useEffect(() => {
    if (tab === "overview")   void loadStats_();
    if (tab === "factures")   void loadFactures();
    if (tab === "automation") void loadConfig();
    if (tab === "templates")  void loadTemplates();
    if (tab === "history")    void loadHistory_(1, histStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => { if (tab === "factures") void loadFactures(); }, [search, sortFact]); // eslint-disable-line
  useEffect(() => { if (tab === "history")  void loadHistory_(histPage, histStatus); }, [histPage, histStatus]); // eslint-disable-line

  // Charger les factures aussi pour le tableau priorités de l'overview
  useEffect(() => {
    if (tab === "overview" && factures.length === 0 && !loadFact) void loadFactures();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Config ────────────────────────────────────────────────────────────────────

  function patchConfig<K extends keyof RelanceConfig>(key: K, val: RelanceConfig[K]) {
    setConfig(c => ({ ...c, [key]: val }));
    setConfigDirty(true);
  }

  async function saveConfig() {
    setSavingConfig(true);
    try {
      const r = await fetch("/api/relances/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled:         config.enabled,
          delays:          config.delays,
          email_cc:        config.email_cc || null,
          send_time:       config.send_time,
          timezone:        config.timezone,
          language:        config.language,
          draft_mode:      config.draft_mode,
          stop_on_dispute: config.stop_on_dispute,
          max_relances:    config.max_relances,
        }),
      });
      if (!r.ok) throw new Error();
      setConfigDirty(false);
      showToast("ok", "Configuration enregistrée");
    } catch { showToast("err", "Erreur lors de l'enregistrement"); }
    finally { setSavingConfig(false); }
  }

  function addDelay() {
    if (config.delays.length >= 8) return;
    const next = (config.delays[config.delays.length - 1] ?? 0) + 7;
    patchConfig("delays", [...config.delays, next].sort((a, b) => a - b));
  }

  function removeDelay(idx: number) {
    const d = config.delays.filter((_, i) => i !== idx);
    patchConfig("delays", d.length ? d : [7]);
  }

  function updateDelay(idx: number, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n <= 0) return;
    const d = [...config.delays];
    d[idx] = n;
    patchConfig("delays", d.sort((a, b) => a - b));
  }

  // ── Workflow relance manuelle ─────────────────────────────────────────────────

  function openRelanceModal(f: FactureDue, level = "amical") {
    setRelModal({ step: 1, facture: f, templateLevel: level, subject: "", message: "", sending: false, sent: false });
  }

  async function relanceStep2() {
    if (!relModal) return;
    setRelModal(m => m ? { ...m, step: 2 } : m);
  }

  async function relanceStep3() {
    if (!relModal) return;
    setRelModal(m => m ? { ...m, step: 3 } : m);
  }

  async function loadPreview() {
    if (!relModal) return;
    setRelModal(m => m ? { ...m, sending: true } : m);
    try {
      const r = await fetch("/api/relances/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: relModal.facture.id, templateLevel: relModal.templateLevel, preview: true }),
      });
      const j = await r.json() as { subject: string; message: string; to?: string; error?: string };
      if (j.error) { showToast("err", j.error); setRelModal(m => m ? { ...m, sending: false } : m); return; }
      setRelModal(m => m ? { ...m, step: 4, subject: j.subject, message: j.message, sending: false } : m);
    } catch {
      showToast("err", "Impossible de charger l'aperçu");
      setRelModal(m => m ? { ...m, sending: false } : m);
    }
  }

  async function relanceStep5() {
    if (!relModal) return;
    setRelModal(m => m ? { ...m, step: 5 } : m);
  }

  async function confirmSend() {
    if (!relModal) return;
    setRelModal(m => m ? { ...m, step: 6, sending: true } : m);
    try {
      const r = await fetch("/api/relances/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId:    relModal.facture.id,
          templateLevel: relModal.templateLevel,
          subject:       relModal.subject,
          message:       relModal.message,
        }),
      });
      const j = await r.json() as { ok?: boolean; error?: string; simulated?: boolean };
      if (j.error) {
        showToast("err", j.error);
        setRelModal(m => m ? { ...m, sending: false, step: 5 } : m);
        return;
      }
      setRelModal(m => m ? { ...m, sending: false, sent: true } : m);
      void loadStats_();
      void loadFactures();
    } catch {
      showToast("err", "Erreur lors de l'envoi");
      setRelModal(m => m ? { ...m, sending: false, step: 5 } : m);
    }
  }

  // ── Modèles ───────────────────────────────────────────────────────────────────

  async function saveTemplate() {
    if (!editTpl) return;
    setSavingTpl(true);
    try {
      const r = await fetch("/api/relances/templates", {
        method: editTpl.id.startsWith("system-") ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTpl.id.startsWith("system-")
          ? { level: editTpl.level, name: editTpl.name, subject: editTpl.subject, body: editTpl.body }
          : { id: editTpl.id, name: editTpl.name, subject: editTpl.subject, body: editTpl.body }),
      });
      if (!r.ok) throw new Error();
      showToast("ok", "Modèle enregistré");
      setTplDirty(false);
      void loadTemplates();
    } catch { showToast("err", "Erreur lors de l'enregistrement"); }
    finally { setSavingTpl(false); }
  }

  async function generateAI() {
    if (!editTpl) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/relances/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateLevel: editTpl.level, language: config.language ?? "fr", existingBody: editTpl.body }),
      });
      const j = await r.json() as { subject?: string; body?: string; error?: string };
      if (j.error) { showToast("err", j.error); return; }
      setEditTpl(t => t ? { ...t, subject: j.subject ?? t.subject, body: j.body ?? t.body } : t);
      setTplDirty(true);
      showToast("ok", "Contenu généré — vérifiez avant enregistrement");
    } catch { showToast("err", "Service IA indisponible"); }
    finally { setAiLoading(false); }
  }

  function insertVar(variable: string) {
    if (!editTpl) return;
    setEditTpl(t => t ? { ...t, body: t.body + ` {{${variable}}}` } : t);
    setTplDirty(true);
  }

  // ── Chart ─────────────────────────────────────────────────────────────────────

  const chartMax = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, ...stats.weeks.map(w => w.count));
  }, [stats]);

  const hasChartData = useMemo(() => stats ? stats.weeks.some(w => w.count > 0) : false, [stats]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>

      {/* ── Header ── */}
      <div className={`flex shrink-0 items-center justify-between border-b ${bd} ${isDark ? "bg-[#0f1117]" : "bg-white"} px-5 py-3`}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,185,0,0.12)", border: "1px solid rgba(255,185,0,0.25)" }}>
            <BellRing size={14} style={{ color: YELLOW }}/>
          </div>
          <div>
            <p className={`text-sm font-bold leading-none ${t1}`}>Relances & Recouvrement</p>
            <p className={`mt-0.5 text-[11px] ${t3}`}>Gestion automatisée des factures impayées</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            config.enabled
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
              : `border-transparent ${isDark ? "bg-white/[0.05] text-white/30" : "bg-gray-100 text-gray-400"}`
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${config.enabled ? "bg-emerald-400" : "bg-gray-400"}`}/>
            {config.enabled ? "Automatisation active" : "Automatisation inactive"}
          </div>
          {tab === "automation" && configDirty && (
            <button onClick={() => void saveConfig()} disabled={savingConfig}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
              style={{ background: YELLOW }}>
              {savingConfig ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
              Enregistrer
            </button>
          )}
          {tab === "templates" && editTpl && tplDirty && (
            <button onClick={() => void saveTemplate()} disabled={savingTpl}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
              style={{ background: YELLOW }}>
              {savingTpl ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
              Enregistrer
            </button>
          )}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className={`flex shrink-0 border-b ${bd} ${isDark ? "bg-[#0f1117]" : "bg-white"} px-5`}>
        {TABS.map(t => {
          const Icon   = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-semibold transition"
              style={active
                ? { borderColor: YELLOW, color: YELLOW }
                : { borderColor: "transparent", color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
              <Icon size={12}/>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ─── VUE D'ENSEMBLE ─── */}
        {tab === "overview" && (
          <div className="p-5 space-y-4">
            {loadStats ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/>
              </div>
            ) : !stats ? (
              <div className={`rounded-2xl border ${bd} ${bg2} p-8 text-center`}>
                <AlertCircle size={28} className="mx-auto mb-3 text-red-400"/>
                <p className={`text-sm ${t2}`}>Impossible de charger les statistiques</p>
                <button onClick={() => void loadStats_()} className={`mt-3 text-xs ${t3} hover:underline`}>Réessayer</button>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Montant en retard",   value: fmtAmt(stats.totalDu),     icon: TrendingDown, color: "#ef4444", sub: `${stats.facturesCount} facture${stats.facturesCount > 1 ? "s" : ""}` },
                    { label: "Clients concernés",   value: String(stats.clientsCount), icon: Users,        color: YELLOW,    sub: "avec retard de paiement" },
                    { label: "Relances envoyées",   value: String(stats.sent),         icon: Send,         color: "#10b981", sub: `${stats.trend.sent30} sur 30 j · ${stats.trend.sent90} sur 90 j` },
                    { label: "Montant récupéré",    value: fmtAmt(stats.recovered),    icon: TrendingUp,   color: "#6366f1", sub: "après relance identifiée" },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className={`rounded-2xl border ${bd} ${bg2} p-4`}>
                        <div className="flex items-start justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                            style={{ background: `${card.color}18` }}>
                            <Icon size={14} style={{ color: card.color }}/>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${t3}`}>
                            {card.label}
                          </span>
                        </div>
                        <p className={`mt-3 text-2xl font-bold tabular-nums ${t1}`}>{card.value}</p>
                        <p className={`mt-0.5 text-xs ${t3}`}>{card.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Diagnostic si clientsCount=0 mais facturesCount>0 */}
                {stats.clientsCount === 0 && stats.facturesCount > 0 && (
                  <div className={`flex items-start gap-3 rounded-xl border border-amber-500/20 px-4 py-3`}
                    style={{ background: "rgba(245,158,11,0.06)" }}>
                    <Info size={14} className="mt-0.5 shrink-0 text-amber-400"/>
                    <div>
                      <p className={`text-xs font-semibold text-amber-400`}>
                        {stats.facturesCount} facture{stats.facturesCount > 1 ? "s" : ""} en retard · 0 client lié au répertoire
                      </p>
                      <p className={`mt-0.5 text-[11px] ${t3}`}>
                        Ces factures ont été créées avec un client saisi en texte libre, sans lien vers une fiche du répertoire.
                        Le montant en retard est exact. Pour lier ces factures à des fiches clients, ouvrez chaque facture
                        et associez-la manuellement au client correspondant dans le répertoire.
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicateurs secondaires — libellés explicites */}
                <div className={`grid grid-cols-2 gap-3 rounded-2xl border ${bd} ${bg2} p-4 sm:grid-cols-4`}>
                  {[
                    { label: "Relances programmées",    val: stats.scheduled, color: "#3b82f6", icon: Clock },
                    { label: "Envois échoués",          val: stats.failed,    color: "#ef4444", icon: XCircle },
                    { label: "Envoyées · 30 derniers jours", val: stats.trend.sent30, color: YELLOW,    icon: Send },
                    { label: "Envoyées · 90 derniers jours", val: stats.trend.sent90, color: "#10b981", icon: Send },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${item.color}18` }}>
                          <Icon size={12} style={{ color: item.color }}/>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold tabular-nums ${t1}`}>{item.val}</p>
                          <p className={`text-[10px] leading-tight ${t3}`}>{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Graphique semaines — compact si vide */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-4`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${t1}`}>Évolution des relances</p>
                      <p className={`text-xs ${t3}`}>12 dernières semaines</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: YELLOW }}/>
                      <span className={`text-xs ${t3}`}>Envoyées</span>
                    </div>
                  </div>

                  {!hasChartData ? (
                    <div className={`flex items-center gap-3 rounded-xl border ${bd} px-4 py-3`}
                      style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${YELLOW}10` }}>
                        <Send size={14} style={{ color: YELLOW }}/>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${t2}`}>Aucune relance envoyée sur cette période</p>
                        <p className={`text-[11px] ${t3}`}>Le graphique s'affichera automatiquement dès le premier envoi.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1" style={{ height: 72 }}>
                      {stats.weeks.map((w, i) => {
                        const pct = chartMax > 0 ? (w.count / chartMax) : 0;
                        const h   = Math.max(4, Math.round(pct * 64));
                        return (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${w.label} : ${w.count} relance${w.count > 1 ? "s" : ""}`}>
                            <div className="relative flex w-full items-end" style={{ height: 64 }}>
                              {w.count > 0 && (
                                <div className="absolute bottom-0 w-full rounded-t-sm"
                                  style={{ height: h, background: `${YELLOW}${pct > 0.5 ? "CC" : "66"}` }}/>
                              )}
                            </div>
                            <span className={`text-[9px] ${t3}`}>{w.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tableau factures prioritaires */}
                {stats.facturesCount > 0 && (
                  <div className={`rounded-2xl border ${bd} ${bg2}`}>
                    <div className={`flex items-center justify-between border-b ${bd} px-4 py-3`}>
                      <div>
                        <p className={`text-sm font-bold ${t1}`}>Factures prioritaires</p>
                        <p className={`text-xs ${t3}`}>Actions directes sans quitter le tableau de bord</p>
                      </div>
                      <button onClick={() => setTab("factures")}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: YELLOW }}>
                        Toutes les factures <ArrowRight size={11}/>
                      </button>
                    </div>
                    {loadFact ? (
                      <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin" style={{ color: YELLOW }}/></div>
                    ) : factures.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className={`text-xs ${t3}`}>Chargement des factures…</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: 760 }}>
                          <thead>
                            <tr className={`border-b ${bd} ${thbg}`}>
                              {["Facture", "Client", "Montant", "Échéance", "Retard", "Dernière relance", "Actions"].map((h, i) => (
                                <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider ${t3}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {factures.slice(0, 5).map(f => (
                              <tr key={f.id} className={`border-b last:border-0 ${bd} transition ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                                <td className="px-3 py-2.5">
                                  <Link href={`/client/factures/documents?id=${f.id}`}
                                    className="text-xs font-bold hover:underline"
                                    style={{ color: YELLOW }}>{f.numero}</Link>
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className={`max-w-[130px] truncate text-xs font-semibold ${t1}`}>{f.clientNom || f.clientSociete || "—"}</p>
                                  {f.clientPays && <p className={`text-[10px] ${t3}`}>{f.clientPays}</p>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className={`text-xs font-bold tabular-nums ${t1}`}>{fmtAmt(f.montantDu, f.devise)}</p>
                                  {f.devise !== "EUR" && <p className={`text-[9px] ${t3}`}>{f.devise}</p>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className={`text-xs ${t2}`}>{fmtDate(f.dateEcheance)}</p>
                                </td>
                                <td className="px-3 py-2.5">{retardBadge(f.daysOverdue)}</td>
                                <td className="px-3 py-2.5">
                                  {f.dernierRelance
                                    ? <p className={`text-xs ${t2}`}>{timeAgo(f.dernierRelance)}</p>
                                    : <p className={`text-xs ${t3}`}>Jamais</p>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <Link href={`/client/factures/documents?id=${f.id}`}
                                      title="Voir la facture"
                                      className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-gray-100"}`}>
                                      <ExternalLink size={12} className={t3}/>
                                    </Link>
                                    <button
                                      title="Préparer une relance"
                                      onClick={() => openRelanceModal(f)}
                                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-black"
                                      style={{ background: YELLOW }}>
                                      <Send size={10}/> Relancer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {stats.facturesCount === 0 && (
                  <div className={`flex flex-col items-center gap-3 rounded-2xl border ${bd} ${bg2} py-10 text-center`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${YELLOW}12` }}>
                      <CheckCircle size={20} style={{ color: YELLOW }}/>
                    </div>
                    <p className={`text-sm font-bold ${t1}`}>Aucune facture en retard</p>
                    <p className={`text-xs ${t3}`}>Toutes vos factures sont à jour. Excellent travail !</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── FACTURES DUES ─── */}
        {tab === "factures" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className={`flex flex-1 items-center gap-2 rounded-xl border ${bd} px-3 py-2 ${isDark ? "bg-white/[0.03]" : "bg-white"}`}
                style={{ minWidth: 200 }}>
                <Search size={13} className={t3}/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Numéro, client, société…"
                  className={`flex-1 bg-transparent text-sm outline-none ${t1}`}/>
                {search && <button onClick={() => setSearch("")}><X size={12} className={t3}/></button>}
              </div>
              <select value={sortFact} onChange={e => setSortFact(e.target.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium outline-none ${inp}`}>
                <option value="retard_desc">Retard ↓</option>
                <option value="retard_asc">Retard ↑</option>
                <option value="montant_desc">Montant ↓</option>
                <option value="montant_asc">Montant ↑</option>
                <option value="echeance_asc">Échéance</option>
              </select>
              <button onClick={() => void loadFactures()}
                className={`flex items-center gap-1.5 rounded-xl border ${bd} px-3 py-2 text-xs font-medium ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                <RefreshCw size={12}/> Actualiser
              </button>
            </div>

            {loadFact ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/>
              </div>
            ) : factures.length === 0 ? (
              <div className={`flex flex-col items-center gap-3 rounded-2xl border ${bd} ${bg2} py-16 text-center`}>
                <CheckCircle size={28} style={{ color: YELLOW }}/>
                <p className={`text-sm font-bold ${t1}`}>Aucune facture en retard</p>
                <p className={`text-xs ${t3}`}>{search ? "Modifiez votre recherche" : "Toutes vos factures sont à jour"}</p>
              </div>
            ) : (
              <div className={`overflow-hidden rounded-2xl border ${bd}`}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: 900 }}>
                    <thead>
                      <tr className={`border-b ${bd} ${thbg}`}>
                        {["Facture", "Client", "Montant dû", "Devise", "Échéance", "Retard", "Relances", "Prochaine", "Actions"].map((h, i) => (
                          <th key={i} className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${t3}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {factures.map(f => (
                        <tr key={f.id} className={`border-b last:border-0 ${bd} transition ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                          <td className="px-3 py-3">
                            <Link href={`/client/factures/documents?id=${f.id}`}
                              className="text-xs font-bold hover:underline"
                              style={{ color: YELLOW }}>{f.numero}</Link>
                          </td>
                          <td className="overflow-hidden px-3 py-3">
                            <p className={`max-w-[150px] truncate text-sm font-semibold ${t1}`}>{f.clientNom || f.clientSociete}</p>
                            {f.clientSociete && f.clientNom && <p className={`max-w-[150px] truncate text-xs ${t3}`}>{f.clientSociete}</p>}
                            {f.clientPays && <p className={`text-xs ${t3}`}>{f.clientPays}</p>}
                          </td>
                          <td className="px-3 py-3">
                            <p className={`text-sm font-bold tabular-nums ${t1}`}>{fmtAmt(f.montantDu, f.devise)}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-xs font-mono ${t2}`}>{f.devise}</span>
                          </td>
                          <td className="px-3 py-3"><p className={`text-xs ${t2}`}>{fmtDate(f.dateEcheance)}</p></td>
                          <td className="px-3 py-3">{retardBadge(f.daysOverdue)}</td>
                          <td className="px-3 py-3">
                            <span className={`text-sm font-bold tabular-nums ${f.relancesCount > 0 ? t1 : t3}`}>{f.relancesCount}</span>
                            {f.dernierRelance && <p className={`text-[10px] ${t3}`}>{timeAgo(f.dernierRelance)}</p>}
                          </td>
                          <td className="px-3 py-3">
                            {f.prochaineRelanceIn !== null
                              ? <p className={`text-xs ${t2}`}>dans {f.prochaineRelanceIn}j</p>
                              : <p className={`text-xs ${t3}`}>—</p>}
                          </td>
                          <td className="relative px-3 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openRelanceModal(f)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-black"
                                style={{ background: YELLOW }}>
                                <Send size={10}/> Relancer
                              </button>
                              <div className="relative">
                                <button onClick={() => setMenuFactId(prev => prev === f.id ? null : f.id)}
                                  className={`rounded-lg p-1.5 transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-gray-100"}`}>
                                  <MoreHorizontal size={13} className={t3}/>
                                </button>
                                {menuFactId === f.id && (
                                  <div className={`absolute right-0 top-9 z-20 w-44 rounded-xl border ${bd} ${isDark ? "bg-[#1a1f2e]" : "bg-white"} shadow-xl p-1`}
                                    onMouseLeave={() => setMenuFactId(null)}>
                                    <Link href={`/client/factures/documents?id=${f.id}`}
                                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"} ${t2}`}>
                                      <ExternalLink size={11}/> Voir la facture
                                    </Link>
                                    {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
                                      <button key={lvl}
                                        onClick={() => { openRelanceModal(f, lvl); setMenuFactId(null); }}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: cfg.color }}/>
                                        <span className={t1}>{cfg.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── AUTOMATISATION ─── */}
        {tab === "automation" && (
          <div className="p-5 space-y-4">
            {loadConf ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/></div>
            ) : (
              <>
                {/* Activation */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm font-bold ${t1}`}>Relances automatiques</p>
                      <p className={`mt-1 text-xs ${t2}`}>
                        DJAMA détecte les factures en retard et envoie automatiquement des relances personnalisées selon votre calendrier.
                        Les doublons sont bloqués : une seule relance par facture par jour.
                      </p>
                    </div>
                    <button onClick={() => patchConfig("enabled", !config.enabled)} className="mt-0.5 shrink-0 transition hover:opacity-80">
                      {config.enabled
                        ? <ToggleRight size={34} style={{ color: YELLOW }}/>
                        : <ToggleLeft  size={34} className={t3}/>}
                    </button>
                  </div>
                  {config.enabled && (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <Check size={11}/> Actif — traitement quotidien selon votre calendrier
                      </p>
                    </div>
                  )}
                </div>

                {/* Calendrier */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${t1}`}>Calendrier de relance</p>
                      <p className={`mt-0.5 text-xs ${t2}`}>Délais après l'échéance (en jours). Maximum 8 niveaux.</p>
                    </div>
                    {config.delays.length < 8 && (
                      <button onClick={addDelay}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${bd} ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                        <Plus size={11}/> Ajouter
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {config.delays.map((d, i) => {
                      const ordinal = i === 0 ? "1re" : `${i + 1}e`;
                      const tone    = d >= 60 ? "Mise en demeure" : d >= 30 ? "Ferme" : d >= 15 ? "Professionnel" : d >= 7 ? "Amical" : "Rappel";
                      const color   = d >= 60 ? "#dc2626" : d >= 30 ? "#ef4444" : d >= 15 ? "#f59e0b" : d >= 7 ? "#10b981" : "#6366f1";
                      return (
                        <div key={i} className={`flex items-center gap-3 rounded-xl border ${bd} px-4 py-3`}>
                          <span className={`w-20 shrink-0 text-xs font-semibold ${t3}`}>{ordinal} relance</span>
                          <span className={`text-xs ${t3}`}>J+</span>
                          <input type="number" min="1" max="365" value={d}
                            onChange={e => updateDelay(i, e.target.value)}
                            className={`w-16 rounded-lg border px-2 py-1 text-right text-sm font-semibold tabular-nums outline-none ${inp}`}/>
                          <span className={`text-xs ${t3}`}>jours</span>
                          <span className="ml-auto text-xs font-bold" style={{ color }}>{tone}</span>
                          {config.delays.length > 1 && (
                            <button onClick={() => removeDelay(i)} className={`${t3} hover:text-red-400`}>
                              <Trash2 size={13}/>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Paramètres d'envoi */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5 space-y-4`}>
                  <p className={`text-sm font-bold ${t1}`}>Paramètres d'envoi</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`mb-1.5 block text-xs font-semibold ${t2}`}>Heure d'envoi</label>
                      <input type="time" value={config.send_time ?? "09:00"}
                        onChange={e => patchConfig("send_time", e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}/>
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-xs font-semibold ${t2}`}>Fuseau horaire</label>
                      <select value={config.timezone ?? "Europe/Paris"}
                        onChange={e => patchConfig("timezone", e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}>
                        {["Europe/Paris","Europe/London","Africa/Dakar","Africa/Abidjan","Africa/Douala","Africa/Nairobi","Africa/Johannesburg","Africa/Lagos","Africa/Casablanca","Africa/Algiers","Africa/Antananarivo","Indian/Mauritius","Indian/Mayotte","Indian/Reunion","America/New_York","America/Los_Angeles","Asia/Dubai","UTC"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-xs font-semibold ${t2}`}>Langue des messages</label>
                      <select value={config.language ?? "fr"}
                        onChange={e => patchConfig("language", e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}>
                        {[{code:"fr",label:"Français"},{code:"en",label:"English"},{code:"ar",label:"العربية"},{code:"sw",label:"Kiswahili"},{code:"mg",label:"Malagasy"}].map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-xs font-semibold ${t2}`}>Max. relances par facture</label>
                      <input type="number" min="1" max="10" value={config.max_relances ?? 5}
                        onChange={e => patchConfig("max_relances", parseInt(e.target.value, 10))}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}/>
                    </div>
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-xs font-semibold ${t2}`}>Copie email (CC)</label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-white border-gray-200"}`}>
                      <Mail size={13} className={t3}/>
                      <input type="email" value={config.email_cc ?? ""}
                        onChange={e => patchConfig("email_cc", e.target.value || null)}
                        placeholder="votre@email.com"
                        className={`flex-1 bg-transparent text-sm outline-none ${t1}`}/>
                      {config.email_cc && <button onClick={() => patchConfig("email_cc", null)}><X size={12} className={t3}/></button>}
                    </div>
                  </div>
                </div>

                {/* Conditions d'arrêt */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5 space-y-3`}>
                  <div>
                    <p className={`text-sm font-bold ${t1}`}>Conditions d'arrêt automatique</p>
                    <p className={`mt-0.5 text-xs ${t2}`}>Arrêt garanti dans ces situations — aucun envoi en double possible</p>
                  </div>
                  {[
                    "Facture intégralement payée",
                    "Facture annulée ou invalidée",
                    "Paiement partiel : montant restant dû nul ou négatif",
                    "Brouillon ou statut non émis",
                    "Suspension manuelle demandée",
                    "Nombre maximum de relances atteint",
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border ${bd} px-4 py-2.5`}>
                      <div className="flex h-4 w-4 items-center justify-center rounded"
                        style={{ background: YELLOW, border: `1px solid ${YELLOW}` }}>
                        <Check size={10} className="text-black"/>
                      </div>
                      <span className={`flex-1 text-xs ${t1}`}>{item}</span>
                      <span className={`text-[10px] ${t3}`}>Toujours actif</span>
                    </div>
                  ))}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5`}
                    style={{ background: `${YELLOW}08`, borderColor: `${YELLOW}20` }}>
                    <div onClick={() => patchConfig("stop_on_dispute", !config.stop_on_dispute)}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded"
                      style={{ background: config.stop_on_dispute ? YELLOW : "transparent", border: `1px solid ${config.stop_on_dispute ? YELLOW : "#6b7280"}` }}>
                      {config.stop_on_dispute && <Check size={10} className="text-black"/>}
                    </div>
                    <span className={`flex-1 text-xs ${t1}`}>Arrêter en cas de litige signalé</span>
                    <span className={`text-[10px] ${t3}`}>Configurable</span>
                  </label>
                </div>

                {/* Mode brouillon */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-bold ${t1}`}>Mode brouillon</p>
                      <p className={`mt-0.5 text-xs ${t2}`}>Les relances sont préparées mais nécessitent une approbation manuelle avant envoi</p>
                    </div>
                    <button onClick={() => patchConfig("draft_mode", !config.draft_mode)} className="shrink-0">
                      {config.draft_mode
                        ? <ToggleRight size={30} style={{ color: YELLOW }}/>
                        : <ToggleLeft  size={30} className={t3}/>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── MODÈLES ─── */}
        {tab === "templates" && (
          <div className="p-5">
            {loadTpl ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/></div>
            ) : (
              <div className="flex gap-4" style={{ minHeight: 480 }}>
                {/* Liste */}
                <div className="flex w-56 shrink-0 flex-col gap-1">
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${t3}`}>Bibliothèque</p>
                  {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => {
                    const tpl    = templates.find(t => t.level === lvl);
                    const active = editTpl?.level === lvl;
                    return (
                      <button key={lvl}
                        onClick={() => { setEditTpl(tpl ?? { id: `system-${lvl}`, level: lvl, name: cfg.label, subject: "", body: "" }); setTplDirty(false); }}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition"
                        style={active
                          ? { background: `${YELLOW}18`, borderColor: `${YELLOW}30`, color: YELLOW }
                          : { borderColor: "transparent", color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: cfg.color }}/>
                        <span className="truncate">{cfg.label}</span>
                        {cfg.warnLegal && <span className="ml-auto text-[9px]">⚠</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Éditeur */}
                <div className="flex flex-1 flex-col gap-3 overflow-hidden min-w-0">
                  {!editTpl ? (
                    <div className={`flex flex-1 flex-col items-center justify-center rounded-2xl border ${bd} ${bg2}`}>
                      <BookTemplate size={28} className={t3}/>
                      <p className={`mt-3 text-sm ${t3}`}>Sélectionnez un modèle</p>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center justify-between rounded-2xl border ${bd} ${bg2} px-4 py-3`}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: LEVEL_CONFIG[editTpl.level]?.color }}/>
                          <p className={`text-sm font-bold ${t1}`}>{LEVEL_CONFIG[editTpl.level]?.label ?? editTpl.level}</p>
                          <p className={`text-xs ${t3} hidden sm:block`}>{LEVEL_CONFIG[editTpl.level]?.desc}</p>
                        </div>
                        <button onClick={() => void generateAI()} disabled={aiLoading}
                          className="flex items-center gap-1.5 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400 disabled:opacity-50">
                          {aiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                          Générer avec l'IA
                        </button>
                      </div>

                      {LEVEL_CONFIG[editTpl.level]?.warnLegal && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-2.5">
                          <Info size={13} className="mt-0.5 shrink-0 text-amber-400"/>
                          <p className="text-xs text-amber-400">
                            Modèle indicatif. Valeur juridique dépendante de la législation de votre pays. Validation par un professionnel recommandée avant envoi.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className={`mb-1 block text-xs font-semibold ${t2}`}>Objet de l'email</label>
                        <input value={editTpl.subject}
                          onChange={e => { setEditTpl(t => t ? { ...t, subject: e.target.value } : t); setTplDirty(true); }}
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}
                          placeholder="Objet du message…"/>
                      </div>

                      <div>
                        <p className={`mb-1.5 text-xs font-semibold ${t2}`}>Variables disponibles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["client_nom","entreprise","numero","montant","devise","date_echeance","date_emission","jours_retard","entreprise_nom","entreprise_email","entreprise_adresse"].map(v => (
                            <button key={v} onClick={() => insertVar(v)}
                              className={`rounded-lg border px-2 py-0.5 text-[11px] font-mono transition ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.07]" : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                              {`{{${v}}}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-1 gap-3 min-h-0">
                        <textarea value={editTpl.body}
                          onChange={e => { setEditTpl(t => t ? { ...t, body: e.target.value } : t); setTplDirty(true); }}
                          className={`flex-1 rounded-xl border px-3 py-3 text-sm font-mono leading-relaxed outline-none resize-none ${inp}`}
                          style={{ minHeight: 200 }}
                          placeholder="Corps du message…"/>
                        <div className="flex flex-col gap-2 shrink-0" style={{ width: 230 }}>
                          <div className="flex items-center gap-1 text-[11px]">
                            {["desktop","mobile"].map(m => (
                              <button key={m} onClick={() => setPreviewMode(m as "desktop"|"mobile")}
                                className="rounded-md px-2 py-0.5 font-medium"
                                style={previewMode === m ? { background: YELLOW, color: "#000" } : { color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}>
                                {m === "desktop" ? "Bureau" : "Mobile"}
                              </button>
                            ))}
                          </div>
                          <div className={`overflow-hidden rounded-xl border ${bd} ${isDark ? "bg-[#09090b]" : "bg-white"}`}
                            style={{ width: previewMode === "mobile" ? 190 : 230 }}>
                            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${YELLOW},transparent)` }}/>
                            <div className="p-3">
                              <p className="text-xs font-black tracking-widest" style={{ color: YELLOW }}>{editTpl.name.toUpperCase()}</p>
                              <div className="mt-2 rounded-md p-2 text-[9px] leading-relaxed"
                                style={{ background: `${YELLOW}08`, border: `1px solid ${YELLOW}18`, color: YELLOW }}>
                                {"📄 Réf: {{numero}} · {{montant}}"}
                              </div>
                              <div className={`mt-2 text-[9px] leading-relaxed ${isDark ? "text-white/60" : "text-gray-600"}`}
                                style={{ whiteSpace: "pre-wrap" }}>
                                {editTpl.body.slice(0, 180)}{editTpl.body.length > 180 ? "…" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── HISTORIQUE ─── */}
        {tab === "history" && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {["","sent","failed","scheduled","cancelled"].map(s => (
                <button key={s}
                  onClick={() => { setHistStatus(s); setHistPage(1); }}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                  style={histStatus === s
                    ? { background: YELLOW, color: "#000", borderColor: YELLOW }
                    : { borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb", color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}>
                  {s === "" ? "Tous" : s === "sent" ? "Envoyés" : s === "failed" ? "Échoués" : s === "scheduled" ? "Programmés" : "Annulés"}
                </button>
              ))}
              <button onClick={() => void loadHistory_(histPage, histStatus)}
                className={`ml-auto flex items-center gap-1.5 rounded-xl border ${bd} px-3 py-1.5 text-xs font-medium ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                <RefreshCw size={12}/> Actualiser
              </button>
            </div>

            {loadHist ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/></div>
            ) : history.length === 0 ? (
              <div className={`flex flex-col items-center gap-3 rounded-2xl border ${bd} ${bg2} py-16 text-center`}>
                <History size={28} className={t3}/>
                <p className={`text-sm font-bold ${t1}`}>Aucun historique</p>
                <p className={`text-xs ${t3}`}>Les relances envoyées apparaîtront ici avec leur statut complet</p>
              </div>
            ) : (
              <>
                <div className={`overflow-hidden rounded-2xl border ${bd}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: 820 }}>
                      <thead>
                        <tr className={`border-b ${bd} ${thbg}`}>
                          {["Date", "Facture", "Client", "Destinataire", "Canal", "Modèle", "Statut"].map((h, i) => (
                            <th key={i} className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${t3}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(e => (
                          <tr key={e.id} className={`border-b last:border-0 ${bd} transition ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                            <td className="px-3 py-3">
                              <p className={`text-xs ${t1}`}>{fmtDate(e.sent_at)}</p>
                              <p className={`text-[10px] ${t3}`}>{timeAgo(e.sent_at)}</p>
                            </td>
                            <td className="px-3 py-3">
                              <p className={`text-xs font-semibold ${t1}`}>{e.documents?.numero ?? "—"}</p>
                              <p className={`text-[10px] ${t3}`}>J+{e.delay_days}</p>
                            </td>
                            <td className="overflow-hidden px-3 py-3">
                              <p className={`max-w-[130px] truncate text-xs ${t1}`}>{e.documents?.client_nom ?? "—"}</p>
                            </td>
                            <td className="overflow-hidden px-3 py-3">
                              <p className={`max-w-[130px] truncate text-[11px] ${t2}`}>{e.documents?.client_email ?? "—"}</p>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`flex items-center gap-1 text-xs ${t2}`}><Mail size={10}/> {e.channel || "email"}</span>
                            </td>
                            <td className="px-3 py-3">
                              <p className={`text-xs ${t2}`}>{e.template_level ? (LEVEL_CONFIG[e.template_level]?.label ?? e.template_level) : "—"}</p>
                            </td>
                            <td className="px-3 py-3">
                              {statusBadge(e.status || "sent")}
                              {e.error_message && (
                                <p className="mt-0.5 max-w-[120px] truncate text-[9px] text-red-400" title={e.error_message}>{e.error_message}</p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {histTotal > PAGE_SIZE && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${t3}`}>{(histPage - 1) * PAGE_SIZE + 1}–{Math.min(histPage * PAGE_SIZE, histTotal)} sur {histTotal}</span>
                    <div className="flex gap-2">
                      <button disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)}
                        className={`flex items-center gap-1 rounded-lg border ${bd} px-3 py-1.5 text-xs disabled:opacity-40 ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                        <ArrowLeft size={12}/> Préc.
                      </button>
                      <button disabled={histPage * PAGE_SIZE >= histTotal} onClick={() => setHistPage(p => p + 1)}
                        className={`flex items-center gap-1 rounded-lg border ${bd} px-3 py-1.5 text-xs disabled:opacity-40 ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                        Suiv. <ArrowRight size={12}/>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL RELANCE MANUELLE — 6 ÉTAPES
      ══════════════════════════════════════════════════════════ */}
      {relModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => { if (!relModal.sending) setRelModal(null); }}>
          <div
            className={`w-full max-w-lg rounded-2xl border ${bd} shadow-2xl ${isDark ? "bg-[#141922]" : "bg-white"}`}
            onClick={e => e.stopPropagation()}>

            {/* En-tête modal */}
            <div className={`flex items-center justify-between border-b ${bd} px-5 py-4`}>
              <div>
                <p className={`text-sm font-bold ${t1}`}>Relance manuelle</p>
                <p className={`text-xs ${t3}`}>
                  {relModal.sent ? "Relance envoyée avec succès" : `Étape ${relModal.step} sur 6 — ${relModal.facture.numero}`}
                </p>
              </div>
              <button onClick={() => { if (!relModal.sending) setRelModal(null); }} className={t3} disabled={relModal.sending}>
                <X size={16}/>
              </button>
            </div>

            {/* Stepper */}
            {!relModal.sent && (
              <div className="flex items-center gap-1.5 px-5 pt-4">
                {[1,2,3,4,5,6].map(s => (
                  <div key={s} className="flex flex-1 items-center gap-1">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                      style={relModal.step >= s
                        ? { background: YELLOW, color: "#000" }
                        : { background: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb", color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                      {relModal.step > s ? <Check size={9}/> : s}
                    </div>
                    {s < 6 && <div className="h-px flex-1" style={{ background: relModal.step > s ? YELLOW : isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}/>}
                  </div>
                ))}
              </div>
            )}

            <div className="p-5 space-y-4">

              {/* SUCCÈS */}
              {relModal.sent && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${YELLOW}15` }}>
                    <CheckCircle size={28} style={{ color: YELLOW }}/>
                  </div>
                  <div>
                    <p className={`text-base font-bold ${t1}`}>Relance envoyée</p>
                    <p className={`mt-1 text-sm ${t2}`}>La relance a été envoyée à {relModal.facture.clientEmail || relModal.facture.clientNom}</p>
                    <p className={`mt-0.5 text-xs ${t3}`}>L'envoi est enregistré dans l'historique</p>
                  </div>
                  <button onClick={() => setRelModal(null)}
                    className="rounded-xl px-6 py-2 text-sm font-bold text-black"
                    style={{ background: YELLOW }}>
                    Fermer
                  </button>
                </div>
              )}

              {/* ÉTAPE 1 — Sélectionner la facture */}
              {!relModal.sent && relModal.step === 1 && (
                <>
                  <div className={`rounded-xl border ${bd} p-4`} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${t3}`}>Facture sélectionnée</p>
                        <p className={`mt-1 text-base font-bold ${t1}`}>{relModal.facture.numero}</p>
                        <p className={`text-sm ${t2}`}>{relModal.facture.clientNom || relModal.facture.clientSociete}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold tabular-nums ${t1}`}>{fmtAmt(relModal.facture.montantDu, relModal.facture.devise)}</p>
                        <p className={`text-xs ${t3}`}>Échéance {fmtDate(relModal.facture.dateEcheance)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {retardBadge(relModal.facture.daysOverdue)}
                      {relModal.facture.clientEmail
                        ? <span className={`inline-flex items-center gap-1 text-xs ${t2}`}><Mail size={10}/>{relModal.facture.clientEmail}</span>
                        : <span className="text-xs text-red-400">⚠ Pas d'adresse email enregistrée</span>}
                    </div>
                  </div>
                  {!relModal.facture.clientEmail && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-3">
                      <p className="text-xs text-amber-400">
                        Cette facture n'a pas d'adresse email client. L'envoi sera simulé localement mais aucun email ne partira.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ÉTAPE 2 — Vérifier le destinataire */}
              {!relModal.sent && relModal.step === 2 && (
                <>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${t3}`}>Destinataire confirmé</p>
                  <div className={`rounded-xl border ${bd} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: `${YELLOW}20`, color: YELLOW }}>
                        {(relModal.facture.clientNom || relModal.facture.clientSociete || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${t1}`}>{relModal.facture.clientNom || relModal.facture.clientSociete || "—"}</p>
                        <p className={`text-xs ${t3}`}>{relModal.facture.clientEmail || "Aucune adresse email"}</p>
                        {relModal.facture.clientPays && <p className={`text-xs ${t3}`}>{relModal.facture.clientPays}</p>}
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-xl border ${bd} p-3 text-xs ${t2}`}>
                    <p><span className={`font-semibold ${t1}`}>Montant dû :</span> {fmtAmt(relModal.facture.montantDu, relModal.facture.devise)}</p>
                    <p className="mt-1"><span className={`font-semibold ${t1}`}>Jours de retard :</span> J+{relModal.facture.daysOverdue}</p>
                    <p className="mt-1"><span className={`font-semibold ${t1}`}>Relances précédentes :</span> {relModal.facture.relancesCount}</p>
                  </div>
                </>
              )}

              {/* ÉTAPE 3 — Choisir le modèle */}
              {!relModal.sent && relModal.step === 3 && (
                <>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${t3}`}>Choisir le ton de la relance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
                      <button key={lvl}
                        onClick={() => setRelModal(m => m ? { ...m, templateLevel: lvl } : m)}
                        className="flex items-start gap-2 rounded-xl border p-3 text-left transition"
                        style={relModal.templateLevel === lvl
                          ? { borderColor: cfg.color, background: `${cfg.color}12` }
                          : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
                        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cfg.color }}/>
                        <div>
                          <p className={`text-xs font-bold ${t1}`}>{cfg.label}</p>
                          <p className={`text-[10px] ${t3}`}>{cfg.desc}</p>
                          {cfg.warnLegal && <p className="mt-0.5 text-[9px] text-amber-400">⚠ Vérification légale conseillée</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ÉTAPE 4 — Prévisualiser (chargement puis affichage) */}
              {!relModal.sent && relModal.step === 4 && (
                <>
                  <div className={`rounded-xl border ${bd} px-3 py-2`}>
                    <span className={`text-[10px] font-bold uppercase ${t3}`}>Objet</span>
                    <p className={`text-sm font-semibold ${t1}`}>{relModal.subject || "Chargement…"}</p>
                  </div>
                  <div className={`max-h-56 overflow-y-auto rounded-xl border ${bd} px-4 py-3`}>
                    <p className={`whitespace-pre-wrap text-sm leading-relaxed ${t2}`}>
                      {relModal.message || "Chargement du contenu…"}
                    </p>
                  </div>
                  <p className={`text-[10px] ${t3}`}>
                    Modèle : {LEVEL_CONFIG[relModal.templateLevel]?.label} — Destinataire : {relModal.facture.clientEmail || "(simulation)"}
                  </p>
                </>
              )}

              {/* ÉTAPE 5 — Modifier le texte */}
              {!relModal.sent && relModal.step === 5 && (
                <>
                  <div>
                    <label className={`mb-1 block text-xs font-semibold ${t2}`}>Objet</label>
                    <input value={relModal.subject}
                      onChange={e => setRelModal(m => m ? { ...m, subject: e.target.value } : m)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}/>
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs font-semibold ${t2}`}>Message</label>
                    <textarea value={relModal.message}
                      onChange={e => setRelModal(m => m ? { ...m, message: e.target.value } : m)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm font-mono leading-relaxed outline-none resize-none ${inp}`}
                      rows={8}/>
                  </div>
                </>
              )}

              {/* ÉTAPE 6 — Confirmation finale */}
              {!relModal.sent && relModal.step === 6 && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  {relModal.sending ? (
                    <>
                      <Loader2 size={28} className="animate-spin" style={{ color: YELLOW }}/>
                      <p className={`text-sm ${t2}`}>Envoi en cours…</p>
                    </>
                  ) : (
                    <>
                      <div className={`rounded-xl border border-amber-500/20 px-4 py-3 text-left`}
                        style={{ background: "rgba(245,158,11,0.06)" }}>
                        <p className={`text-xs font-bold text-amber-400`}>Confirmation requise</p>
                        <p className={`mt-1 text-xs ${t2}`}>
                          Vous allez envoyer une relance <strong>{LEVEL_CONFIG[relModal.templateLevel]?.label}</strong> à{" "}
                          <strong>{relModal.facture.clientEmail || relModal.facture.clientNom}</strong> pour la facture{" "}
                          <strong>{relModal.facture.numero}</strong> ({fmtAmt(relModal.facture.montantDu, relModal.facture.devise)}).
                        </p>
                        {!relModal.facture.clientEmail && (
                          <p className="mt-1 text-xs text-amber-400">Pas d'email → la relance sera simulée (non envoyée réellement).</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer modal */}
            {!relModal.sent && (
              <div className={`flex justify-end gap-2 border-t ${bd} px-5 py-3`}>
                {relModal.step > 1 && !relModal.sending && (
                  <button
                    onClick={() => setRelModal(m => m ? { ...m, step: Math.max(1, m.step - 1) as RelanceModal["step"] } : m)}
                    className={`flex items-center gap-1 rounded-xl border ${bd} px-4 py-2 text-xs font-semibold ${t2} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                    <ArrowLeft size={12}/> Précédent
                  </button>
                )}

                {relModal.step === 1 && (
                  <button onClick={() => void relanceStep2()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                    style={{ background: YELLOW }}>
                    Vérifier le destinataire <ArrowRight size={12}/>
                  </button>
                )}
                {relModal.step === 2 && (
                  <button onClick={() => void relanceStep3()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                    style={{ background: YELLOW }}>
                    Choisir le modèle <ArrowRight size={12}/>
                  </button>
                )}
                {relModal.step === 3 && (
                  <button onClick={() => void loadPreview()} disabled={relModal.sending}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
                    style={{ background: YELLOW }}>
                    {relModal.sending ? <Loader2 size={12} className="animate-spin"/> : <Eye size={12}/>}
                    Prévisualiser
                  </button>
                )}
                {relModal.step === 4 && (
                  <button onClick={() => void relanceStep5()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                    style={{ background: YELLOW }}>
                    <Edit3 size={12}/> Modifier le texte
                  </button>
                )}
                {relModal.step === 5 && (
                  <button onClick={() => setRelModal(m => m ? { ...m, step: 6 } : m)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                    style={{ background: YELLOW }}>
                    Confirmer l'envoi <ArrowRight size={12}/>
                  </button>
                )}
                {relModal.step === 6 && !relModal.sending && (
                  <button onClick={() => void confirmSend()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black"
                    style={{ background: YELLOW }}>
                    <Send size={12}/> Envoyer maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold shadow-xl lg:bottom-6 ${
          toast.type === "ok"  ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400" :
          toast.type === "err" ? "border-red-500/20 bg-red-500/15 text-red-400" :
                                 "border-blue-500/20 bg-blue-500/15 text-blue-400"
        }`}>
          {toast.type === "ok" ? <Check size={13}/> : toast.type === "err" ? <X size={13}/> : <Info size={13}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
