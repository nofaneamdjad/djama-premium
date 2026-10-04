"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Plus, Trash2, X, Star, Sparkles,
  Loader2, ArrowLeft, ClipboardList, ChevronDown, ChevronRight,
  AlertTriangle, Flag, Calendar, User, Tag, CornerDownRight,
  RotateCcw, Check, MessageSquare, History, Settings,
  Lock, Users, Globe, Pin, Archive,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;

const PALETTE = [
  "#6366f1","#ec4899","#f59e0b","#10b981",
  "#0ea5e9","#c9a55a","#ef4444","#14b8a6",
  "#f97316","#84cc16",
];

const PRIORITY_META = {
  low:    { label: "Faible",  color: "#64748b", Icon: Flag },
  normal: { label: "Normal",  color: "#6366f1", Icon: Flag },
  high:   { label: "Haute",   color: "#f59e0b", Icon: AlertTriangle },
  urgent: { label: "Urgente", color: "#ef4444", Icon: AlertTriangle },
} as const;

type Priority = "low" | "normal" | "high" | "urgent";
type Visibility = "private" | "team" | "shared";

interface Subtask { id: string; text: string; done: boolean }

interface CheckItem {
  id: string;
  text: string;
  description?: string | null;
  done: boolean;
  starred: boolean;
  priority: Priority;
  due_date?: string | null;
  assignee_id?: string | null;
  tags: string[];
  subtasks: Subtask[];
  sort_order: number;
  section_id?: string | null;
  done_at?: string | null;
  created_at?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  collapsed: boolean;
  sort_order: number;
}

interface Checklist {
  id: string;
  title: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  visibility: Visibility;
  status: string;
  pinned: boolean;
  owner_id?: string;
  checklist_items?: CheckItem[];
  checklist_sections?: ChecklistSection[];
  created_at: string;
  updated_at: string;
}

interface AiOp {
  op: "add_item" | "update_item" | "delete_item" | "reorder" | "update_title" | "add_section";
  [key: string]: unknown;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const TEMPLATES = [
  { label: "Lancement produit",   color: "#6366f1", items: [
    { text: "Définir les objectifs du lancement", priority: "urgent" as Priority },
    { text: "Préparer la page de vente", priority: "high" as Priority },
    { text: "Créer la séquence email", priority: "high" as Priority },
    { text: "Configurer les paiements", priority: "urgent" as Priority },
    { text: "Tester le tunnel d'achat", priority: "high" as Priority },
    { text: "Préparer le support client", priority: "normal" as Priority },
    { text: "Planifier les annonces réseaux sociaux", priority: "normal" as Priority },
    { text: "Analyser les premiers résultats J+3", priority: "low" as Priority },
  ]},
  { label: "Admin mensuel",       color: "#10b981", items: [
    { text: "Envoyer les factures du mois", priority: "urgent" as Priority },
    { text: "Relancer les impayés", priority: "high" as Priority },
    { text: "Saisir les notes de frais", priority: "normal" as Priority },
    { text: "Calculer le CA mensuel", priority: "high" as Priority },
    { text: "Vérifier les prélèvements", priority: "normal" as Priority },
    { text: "Préparer la déclaration TVA", priority: "urgent" as Priority },
  ]},
  { label: "Onboarding client",   color: "#f59e0b", items: [
    { text: "Envoyer le contrat signé", priority: "urgent" as Priority },
    { text: "Créer l'espace client", priority: "high" as Priority },
    { text: "Réunion de lancement", priority: "high" as Priority },
    { text: "Accès aux outils partagés", priority: "normal" as Priority },
    { text: "Premier rapport d'avancement", priority: "normal" as Priority },
    { text: "Recueil des premiers retours", priority: "low" as Priority },
  ]},
  { label: "Recrutement",         color: "#ec4899", items: [
    { text: "Rédiger la fiche de poste", priority: "high" as Priority },
    { text: "Publier les annonces", priority: "high" as Priority },
    { text: "Trier les candidatures", priority: "normal" as Priority },
    { text: "Planifier les entretiens", priority: "normal" as Priority },
    { text: "Vérifier les références", priority: "normal" as Priority },
    { text: "Envoyer l'offre au candidat retenu", priority: "urgent" as Priority },
  ]},
];

// ── Composant item de checklist ─────────────────────────────────
function CheckItemRow({
  item, color, isDark, onToggle, onStar, onDelete, onUpdate,
}: {
  item: CheckItem; color: string; isDark: boolean;
  onToggle: () => void; onStar: () => void; onDelete: () => void;
  onUpdate: (patch: Partial<CheckItem>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [editingText, setEditingText] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const meta = PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
  const subtasksDone = item.subtasks.filter(s => s.done).length;

  function commitText() {
    if (editText.trim() && editText.trim() !== item.text) {
      onUpdate({ text: editText.trim() });
    }
    setEditingText(false);
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    const subtasks = [...item.subtasks, { id: uid(), text: newSubtask.trim(), done: false }];
    onUpdate({ subtasks });
    setNewSubtask("");
  }

  function toggleSubtask(subId: string) {
    const subtasks = item.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s);
    onUpdate({ subtasks });
  }

  return (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ duration: 0.16 }}
      className="group rounded-xl transition-all"
      style={{
        background: item.done
          ? (isDark ? "rgba(255,255,255,0.015)" : "rgba(12,24,100,0.01)")
          : (isDark ? "rgba(255,255,255,0.04)" : "rgba(12,24,100,0.035)"),
        border: `1px solid ${item.done
          ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(12,24,100,0.05)")
          : (isDark ? "rgba(255,255,255,0.08)" : "rgba(12,24,100,0.09)")}`,
      }}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-2.5">
        {/* Checkbox */}
        <button onClick={onToggle} className="mt-0.5 shrink-0 transition-transform active:scale-90">
          {item.done
            ? <CheckCircle2 size={18} style={{ color }} />
            : <Circle size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />}
        </button>

        {/* Corps */}
        <div className="flex-1 min-w-0">
          {editingText ? (
            <input
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={commitText}
              onKeyDown={e => { if (e.key === "Enter") commitText(); if (e.key === "Escape") { setEditText(item.text); setEditingText(false); } }}
              className="w-full bg-transparent text-[13px] text-white outline-none border-b border-white/20"
            />
          ) : (
            <p
              onDoubleClick={() => { setEditingText(true); setEditText(item.text); }}
              className={`text-[13px] leading-snug cursor-default select-none ${item.done ? "line-through text-white/25" : "text-white/80"}`}
              title="Double-clic pour modifier"
            >
              {item.text}
            </p>
          )}

          {/* Meta : priorité + date + tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {item.priority !== "normal" && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ color: meta.color, background: `${meta.color}18` }}>
                <meta.Icon size={8} />{meta.label}
              </span>
            )}
            {item.due_date && (
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ color: "rgba(255,255,255,0.40)", background: "rgba(255,255,255,0.06)" }}>
                <Calendar size={8} />{new Date(item.due_date).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
              </span>
            )}
            {item.tags.map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ color: "rgba(255,255,255,0.40)", background: "rgba(255,255,255,0.06)" }}>
                #{tag}
              </span>
            ))}
            {item.subtasks.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ color: subtasksDone === item.subtasks.length ? "#4ade80" : "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}>
                {subtasksDone}/{item.subtasks.length} sous-tâches
              </span>
            )}
          </div>

          {/* Sous-tâches dépliées */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden mt-2">
                <div className="space-y-1 pl-2 border-l-2 border-white/10">
                  {item.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-1.5">
                      <button onClick={() => toggleSubtask(sub.id)}>
                        {sub.done
                          ? <CheckCircle2 size={12} style={{ color }} />
                          : <Circle size={12} className="text-white/25" />}
                      </button>
                      <span className={`text-[11px] ${sub.done ? "line-through text-white/25" : "text-white/60"}`}>{sub.text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CornerDownRight size={9} className="text-white/20 shrink-0" />
                    <input
                      value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addSubtask(); }}
                      placeholder="Ajouter une sous-tâche…"
                      className="flex-1 bg-transparent text-[10.5px] text-white/60 placeholder:text-white/20 outline-none"
                    />
                    {newSubtask && (
                      <button onClick={addSubtask} className="text-white/40 hover:text-white/70">
                        <Plus size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          {item.subtasks.length > 0 && (
            <button onClick={() => setExpanded(v => !v)} className="p-1 text-white/20 hover:text-white/50">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)} className="p-1 text-white/20 hover:text-white/50" title="Sous-tâches">
            <CornerDownRight size={12} />
          </button>
          <button onClick={onStar} className="p-1 transition-colors">
            <Star size={12} className={item.starred ? "text-yellow-400 fill-yellow-400" : "text-white/20 hover:text-yellow-400"} />
          </button>
          <button onClick={onDelete} className="p-1 text-white/15 hover:text-red-400 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Panneau IA ───────────────────────────────────────────────────
function AiPanel({
  checklist, isDark, onApplied, onClose,
}: {
  checklist: Checklist;
  isDark: boolean;
  onApplied: () => void;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOps, setPendingOps] = useState<AiOp[] | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(uid());

  async function getSuggestions() {
    if (!instruction.trim() || loading) return;
    setLoading(true); setError(null); setPendingOps(null);
    try {
      const res = await fetch(`/api/checklists/${checklist.id}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json() as { ops?: AiOp[]; error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur IA"); return; }
      setPendingOps(data.ops ?? []);
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  async function applyOps() {
    if (!pendingOps?.length) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/checklists/${checklist.id}/ai-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops: pendingOps, ai_session_id: sessionId.current }),
      });
      if (res.ok) {
        setPendingOps(null); setInstruction("");
        sessionId.current = uid();
        onApplied();
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Erreur d'application");
      }
    } catch { setError("Erreur réseau"); }
    finally { setApplying(false); }
  }

  function describeOp(op: AiOp): string {
    if (op.op === "add_item")    return `Ajouter : "${op.text}"`;
    if (op.op === "update_item") return `Modifier item ${String(op.id ?? "").slice(0,6)}…`;
    if (op.op === "delete_item") return `Supprimer item ${String(op.id ?? "").slice(0,6)}…`;
    if (op.op === "reorder")     return `Réorganiser ${(op.order as string[]).length} items`;
    if (op.op === "update_title") return `Renommer → "${op.title}"`;
    if (op.op === "add_section") return `Ajouter section "${op.title}"`;
    return op.op;
  }

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl"
            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <Sparkles size={13} style={{ color: "#c9a55a" }} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-white/80">Assistant IA</p>
            <p className="text-[9px] text-white/30">Modifie la checklist</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5">
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Zone de saisie */}
        <div className="rounded-xl p-3" style={{ background: isDark ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.18)" }}>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) getSuggestions(); }}
            placeholder="Ex: Ajoute 3 tâches de suivi post-lancement, supprime les tâches faites, réorganise par priorité…"
            rows={4}
            className="w-full bg-transparent text-[12px] text-white/80 placeholder:text-white/25 resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[9px] text-white/20">Cmd+Enter pour envoyer</span>
            <button
              onClick={getSuggestions}
              disabled={!instruction.trim() || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-30 transition"
              style={{ background: "linear-gradient(135deg,#c9a55a,#6366f1)" }}
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {loading ? "Analyse…" : "Suggérer"}
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
            <AlertTriangle size={11} className="shrink-0" />{error}
          </div>
        )}

        {/* Opérations suggérées */}
        {pendingOps && (
          <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}>
            <p className="text-[10px] font-semibold text-white/40 mb-2 uppercase tracking-wide">
              {pendingOps.length} modification{pendingOps.length > 1 ? "s" : ""} suggérée{pendingOps.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-1.5 mb-3">
              {pendingOps.length === 0 ? (
                <p className="text-[11px] text-white/30 text-center py-3">Aucune modification à apporter</p>
              ) : (
                pendingOps.map((op, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-[11px]"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.07)"}` }}>
                    <span className="shrink-0 mt-0.5 text-[9px] font-mono px-1 rounded" style={{ background: "rgba(124,58,237,0.20)", color: "#c9a55a" }}>
                      {op.op}
                    </span>
                    <span className="text-white/60 leading-relaxed">{describeOp(op)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Apply / Cancel */}
            {pendingOps.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={applyOps}
                  disabled={applying}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold text-white transition"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                >
                  {applying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {applying ? "Application…" : "Appliquer"}
                </button>
                <button
                  onClick={() => { setPendingOps(null); setInstruction(""); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-white/50 transition hover:text-white/70"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(12,24,100,0.09)"}` }}
                >
                  <X size={12} /> Annuler
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Suggestions rapides */}
        {!pendingOps && !loading && (
          <div>
            <p className="text-[10px] font-semibold text-white/30 mb-2 uppercase tracking-wide">Suggestions rapides</p>
            <div className="space-y-1">
              {[
                "Trier les tâches par priorité",
                "Ajouter des tâches de suivi",
                "Renommer les items vagues",
                "Supprimer les tâches terminées",
                "Diviser en sections par thème",
              ].map(s => (
                <button key={s}
                  onClick={() => setInstruction(s)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-white/50 transition hover:text-white/70"
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//   PAGE PRINCIPALE
// ══════════════════════════════════════════════
export default function ChecklistsPage() {
  const { isDark } = useTheme();

  // ── State global ──────────────────────────────
  const [lists, setLists] = useState<Checklist[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── UI panels ─────────────────────────────────
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAiGenerate, setShowAiGenerate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  // ── Création ──────────────────────────────────
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(PALETTE[0]);
  const [draftVisibility, setDraftVisibility] = useState<Visibility>("private");
  const [creating, setCreating] = useState(false);

  // ── Génération IA ─────────────────────────────
  const [aiTopic, setAiTopic] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ title: string; color: string; items: { text: string; priority: string }[] } | null>(null);

  // ── Ajout item ────────────────────────────────
  const [newItem, setNewItem] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<Priority>("normal");
  const [addingItem, setAddingItem] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── History ───────────────────────────────────
  const [history, setHistory] = useState<{ id: string; action: string; description: string; created_at: string }[]>([]);

  // ── Chargement liste ──────────────────────────
  const loadLists = useCallback(async () => {
    try {
      const res = await fetch("/api/checklists");
      if (res.ok) {
        const data = await res.json() as { checklists: Checklist[] };
        setLists(data.checklists ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLists(); }, [loadLists]);

  // ── Chargement détail ─────────────────────────
  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/checklists/${id}`);
      if (res.ok) {
        const data = await res.json() as { checklist: Checklist };
        setDetail(data.checklist);
      }
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => {
    if (activeId) { void loadDetail(activeId); }
    else { setDetail(null); }
  }, [activeId, loadDetail]);

  // ── Créer une checklist ───────────────────────
  async function createList(opts?: { title?: string; color?: string; items?: { text: string; priority?: string }[] }) {
    const title = opts?.title ?? draft.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          color: opts?.color ?? draftColor,
          visibility: draftVisibility,
          items: opts?.items ?? [],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { checklist: Checklist };
        setLists(prev => [data.checklist, ...prev]);
        setActiveId(data.checklist.id);
        setShowCreate(false); setShowAiGenerate(false); setShowTemplates(false);
        setDraft(""); setAiTopic(""); setAiPreview(null);
        setTimeout(() => itemRef.current?.focus(), 100);
      }
    } finally { setCreating(false); }
  }

  // ── Générer avec l'IA ─────────────────────────
  async function generateWithAi() {
    if (!aiTopic.trim() || aiLoading) return;
    setAiLoading(true); setAiPreview(null);
    try {
      const res = await fetch("/api/checklists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, context: aiContext }),
      });
      const data = await res.json() as { title?: string; color?: string; items?: { text: string; priority: string }[]; error?: string };
      if (res.ok && data.title && data.items) {
        setAiPreview({ title: data.title, color: data.color ?? PALETTE[0], items: data.items });
        setDraft(data.title);
        setDraftColor(data.color ?? PALETTE[0]);
      }
    } finally { setAiLoading(false); }
  }

  // ── Confirmer création depuis preview IA ──────
  async function confirmAiCreation() {
    if (!aiPreview) return;
    await createList({ title: aiPreview.title, color: aiPreview.color, items: aiPreview.items });
  }

  // ── Ajouter un item ───────────────────────────
  async function addItem() {
    if (!newItem.trim() || !detail || addingItem) return;
    setAddingItem(true);
    const tempId = uid();
    const optimistic: CheckItem = {
      id: tempId, text: newItem.trim(), done: false, starred: false,
      priority: newItemPriority, tags: [], subtasks: [], sort_order: (detail.checklist_items?.length ?? 0),
    };
    setDetail(prev => prev ? { ...prev, checklist_items: [...(prev.checklist_items ?? []), optimistic] } : prev);
    setNewItem("");
    try {
      const res = await fetch(`/api/checklists/${detail.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimistic.text, priority: newItemPriority }),
      });
      if (res.ok) {
        const data = await res.json() as { item: CheckItem };
        setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.map(i => i.id === tempId ? data.item : i) } : prev);
        void loadLists();
      } else {
        setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.filter(i => i.id !== tempId) } : prev);
      }
    } finally { setAddingItem(false); itemRef.current?.focus(); }
  }

  // ── Toggle item ───────────────────────────────
  async function toggleItem(itemId: string) {
    if (!detail) return;
    const item = detail.checklist_items?.find(i => i.id === itemId);
    if (!item) return;
    const newDone = !item.done;
    setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.map(i => i.id === itemId ? { ...i, done: newDone } : i) } : prev);
    await fetch(`/api/checklists/${detail.id}/items/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });
  }

  // ── Toggle star ───────────────────────────────
  async function toggleStar(itemId: string) {
    if (!detail) return;
    const item = detail.checklist_items?.find(i => i.id === itemId);
    if (!item) return;
    const newStar = !item.starred;
    setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.map(i => i.id === itemId ? { ...i, starred: newStar } : i) } : prev);
    await fetch(`/api/checklists/${detail.id}/items/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: newStar }),
    });
  }

  // ── Supprimer item ────────────────────────────
  async function deleteItem(itemId: string) {
    if (!detail) return;
    setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.filter(i => i.id !== itemId) } : prev);
    await fetch(`/api/checklists/${detail.id}/items/${itemId}`, { method: "DELETE" });
    void loadLists();
  }

  // ── Mettre à jour item ────────────────────────
  async function updateItem(itemId: string, patch: Partial<CheckItem>) {
    if (!detail) return;
    setDetail(prev => prev ? { ...prev, checklist_items: prev.checklist_items?.map(i => i.id === itemId ? { ...i, ...patch } : i) } : prev);
    await fetch(`/api/checklists/${detail.id}/items/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  // ── Supprimer liste ───────────────────────────
  async function deleteList(id: string) {
    setLists(prev => prev.filter(l => l.id !== id));
    if (activeId === id) { setActiveId(null); setDetail(null); }
    await fetch(`/api/checklists/${id}`, { method: "DELETE" });
  }

  // ── Épingler / désépingler ────────────────────
  async function togglePin(id: string, current: boolean) {
    setLists(prev => prev.map(l => l.id === id ? { ...l, pinned: !current } : l));
    await fetch(`/api/checklists/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !current }),
    });
  }

  // ── Charger historique ────────────────────────
  async function loadHistory() {
    if (!detail) return;
    const res = await fetch(`/api/checklists/${detail.id}/history`);
    if (res.ok) {
      const data = await res.json() as { history: typeof history };
      setHistory(data.history ?? []);
    }
    setHistoryOpen(true);
  }

  // ── Annuler une opération IA ──────────────────
  async function undoHistoryEntry(historyId: string) {
    if (!detail) return;
    await fetch(`/api/checklists/${detail.id}/history`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history_id: historyId }),
    });
    void loadDetail(detail.id);
    setHistoryOpen(false);
  }

  // ── Stats de la liste active ──────────────────
  const items = detail?.checklist_items ?? [];
  const doneCount  = items.filter(i => i.done).length;
  const totalCount = items.length;
  const progress   = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const filteredItems = items.filter(i => {
    if (filter === "active") return !i.done;
    if (filter === "done")   return i.done;
    return true;
  }).sort((a, b) => a.sort_order - b.sort_order);

  const visIcon = { private: Lock, team: Users, shared: Globe };

  // ═══════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════
  return (
    <div className={`flex h-[calc(100vh-56px)] overflow-hidden ${isDark ? "bg-[#07080e]" : "bg-[#f0f2fb] cl-light"}`}>
      {!isDark && (
        <style>{`
          .cl-light [class*="border-white/"] { border-color: rgba(12,24,100,0.09) !important; }
          .cl-light .text-white              { color: #111827 !important; }
          .cl-light .text-white\\/80         { color: rgba(12,18,50,0.82) !important; }
          .cl-light .text-white\\/60         { color: rgba(12,18,50,0.60) !important; }
          .cl-light .text-white\\/40, .cl-light .text-white\\/35 { color: rgba(12,18,50,0.45) !important; }
          .cl-light .text-white\\/30         { color: rgba(12,18,50,0.36) !important; }
          .cl-light .text-white\\/25         { color: rgba(12,18,50,0.30) !important; }
          .cl-light .text-white\\/20, .cl-light .text-white\\/15 { color: rgba(12,18,50,0.22) !important; }
          .cl-light input.bg-transparent     { color: #111827 !important; }
          .cl-light input::placeholder, .cl-light textarea::placeholder { color: rgba(12,18,50,0.30) !important; }
        `}</style>
      )}

      {/* ═══ SIDEBAR ═══════════════════════════════════════════ */}
      <div className={`flex flex-col w-full md:w-[268px] shrink-0 border-r border-white/[0.06] ${activeId ? "hidden md:flex" : "flex"}`}>

        {/* Header sidebar */}
        <div className="relative px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-[15px] font-black text-white">Checklists</h1>
                <p className="text-[9px] text-white/30">{lists.length} liste{lists.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button
              onClick={() => { setShowCreate(v => !v); setTimeout(() => inputRef.current?.focus(), 60); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 12px rgba(201,165,90,0.30)` }}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Stats globales */}
          {!loading && lists.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { label: "Listes",  val: lists.length,                                          color: GOLD },
                { label: "Actives", val: lists.filter(l => (l.checklist_items as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0).length, color: "#60a5fa" },
                { label: "Épinglées", val: lists.filter(l => l.pinned).length,                   color: "#f59e0b" },
              ].map(s => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center rounded-xl py-2"
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.025)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}>
                  <span className="text-[15px] font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-[8px] text-white/25 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire création */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="rounded-2xl p-3.5 space-y-3 mb-1"
                  style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>

                  {/* Titre */}
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") createList(); if (e.key === "Escape") setShowCreate(false); }}
                    placeholder="Nom de la liste…"
                    className="w-full bg-transparent text-[12.5px] text-white placeholder:text-white/30 outline-none"
                  />

                  {/* Palette couleur */}
                  <div className="flex gap-1.5 flex-wrap">
                    {PALETTE.map(c => (
                      <button key={c} onClick={() => setDraftColor(c)}
                        className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, outline: draftColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                    ))}
                  </div>

                  {/* Visibilité */}
                  <div className="flex gap-1.5">
                    {(["private","team","shared"] as Visibility[]).map(v => {
                      const Icon = visIcon[v];
                      return (
                        <button key={v} onClick={() => setDraftVisibility(v)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition"
                          style={draftVisibility === v
                            ? { background: `${draftColor}20`, border: `1px solid ${draftColor}50`, color: draftColor }
                            : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(12,24,100,0.08)"}`, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(12,18,50,0.40)" }
                          }>
                          <Icon size={10} />
                          {v === "private" ? "Privée" : v === "team" ? "Équipe" : "Partagée"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => createList()}
                      disabled={!draft.trim() || creating}
                      className="flex-1 rounded-xl py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
                      style={{ background: draft.trim() ? `linear-gradient(135deg, ${GOLD}, #b08d45)` : "rgba(255,255,255,0.08)" }}>
                      {creating ? "Création…" : "Créer vide"}
                    </button>
                    <button onClick={() => setShowCreate(false)}
                      className="rounded-xl px-3 py-1.5 text-[11px] text-white/40 hover:text-white/60"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.05)" }}>
                      Annuler
                    </button>
                  </div>

                  {/* Bouton génération IA */}
                  <button
                    onClick={() => setShowAiGenerate(v => !v)}
                    className="w-full flex items-center gap-1.5 justify-center rounded-xl py-1.5 text-[10.5px] font-semibold transition"
                    style={{ color: "#c9a55a", border: "1px dashed rgba(167,139,250,0.30)" }}>
                    <Sparkles size={10} />{showAiGenerate ? "Masquer l'IA" : "Générer avec l'IA"}
                  </button>

                  {/* Panel génération IA */}
                  <AnimatePresence>
                    {showAiGenerate && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden space-y-2">
                        <input
                          value={aiTopic}
                          onChange={e => setAiTopic(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") generateWithAi(); }}
                          placeholder="Sujet : lancement produit, admin mensuel…"
                          className="w-full bg-transparent text-[11.5px] text-white placeholder:text-white/25 outline-none border-b border-purple-500/25 pb-0.5"
                        />
                        <input
                          value={aiContext}
                          onChange={e => setAiContext(e.target.value)}
                          placeholder="Contexte optionnel…"
                          className="w-full bg-transparent text-[11px] text-white placeholder:text-white/20 outline-none"
                        />
                        <button onClick={generateWithAi}
                          disabled={aiLoading || !aiTopic.trim()}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#6366f1)" }}>
                          {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {aiLoading ? "Génération…" : "Générer la liste"}
                        </button>

                        {/* Prévisualisation IA */}
                        {aiPreview && (
                          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="rounded-xl p-3 space-y-2"
                            style={{ background: `${aiPreview.color}10`, border: `1px solid ${aiPreview.color}30` }}>
                            <p className="text-[11px] font-bold" style={{ color: aiPreview.color }}>{aiPreview.title}</p>
                            <div className="space-y-0.5">
                              {aiPreview.items.map((it, i) => (
                                <p key={i} className="text-[10px] text-white/60 flex items-center gap-1">
                                  <Circle size={6} className="shrink-0 text-white/20" />{it.text}
                                </p>
                              ))}
                            </div>
                            <button onClick={confirmAiCreation}
                              disabled={creating}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
                              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                              <Check size={10} />{creating ? "Création…" : "Confirmer et créer"}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton templates */}
          <button onClick={() => setShowTemplates(v => !v)}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-white/40 transition hover:text-white/60 mb-1"
            style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}>
            <span className="flex items-center gap-1.5"><Sparkles size={10} style={{ color: GOLD }} />Modèles professionnels</span>
            {showTemplates ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                <div className="space-y-1.5 pt-1 pb-2">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.label} onClick={() => createList({ title: tpl.label, color: tpl.color, items: tpl.items })}
                      disabled={creating}
                      className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5 disabled:opacity-50"
                      style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(12,24,100,0.02)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}` }}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: tpl.color }} />
                        <p className="text-[11px] font-semibold text-white/70">{tpl.label}</p>
                        <span className="ml-auto text-[9px] text-white/25">{tpl.items.length} tâches</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${GOLD}55,transparent)` }} />
        </div>

        {/* Liste des checklists */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1.5 pt-2">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(12,24,100,0.04)" }} />
            ))
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-12 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
                <ClipboardList size={24} style={{ color: `${GOLD}80` }} />
              </div>
              <p className="text-[12px] font-semibold text-white/25">Aucune checklist</p>
              <p className="text-[10px] text-white/15">Crée ta première liste ou utilise un modèle</p>
            </div>
          ) : (
            <>
              {/* Épinglées */}
              {lists.filter(l => l.pinned).length > 0 && (
                <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest px-1 pt-1 pb-0.5">Épinglées</p>
              )}
              {lists.map((list, idx) => {
                const itemsArr = (list.checklist_items ?? []) as unknown as { count: number }[];
                const count = itemsArr[0]?.count ?? 0;
                const VisIcon = visIcon[list.visibility];
                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => setActiveId(list.id)}
                      className="w-full rounded-2xl p-3.5 text-left transition-all"
                      style={{
                        background: activeId === list.id ? `${list.color}12` : (isDark ? "rgba(255,255,255,0.025)" : "rgba(12,24,100,0.02)"),
                        border: activeId === list.id ? `1.5px solid ${list.color}45` : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: list.color, boxShadow: activeId === list.id ? `0 0 8px ${list.color}60` : "none" }} />
                        <p className="flex-1 text-[12.5px] font-semibold text-white/80 truncate">{list.title}</p>
                        <VisIcon size={9} className="text-white/20 shrink-0" />
                        {list.pinned && <Pin size={9} style={{ color: GOLD }} className="shrink-0" />}
                        <span className="text-[10px] tabular-nums shrink-0" style={{ color: isDark ? "rgba(255,255,255,0.20)" : "rgba(12,18,50,0.28)" }}>{count}</span>
                      </div>
                      {list.description && (
                        <p className="text-[10px] text-white/30 truncate pl-4 mb-1">{list.description}</p>
                      )}
                    </button>

                    {/* Actions groupe hover */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); togglePin(list.id, list.pinned); }}
                        className="p-1 rounded-lg hover:bg-white/10">
                        <Pin size={9} style={{ color: list.pinned ? GOLD : "rgba(255,255,255,0.20)" }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteList(list.id); }}
                        className="p-1 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ═══ PANNEAU DÉTAIL ════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}>
        {!activeId || !detail ? (
          /* État vide */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22` }}>
              <ClipboardList size={32} style={{ color: `${GOLD}50` }} />
            </motion.div>
            <div>
              <p className="text-[14px] font-bold text-white/25 mb-1">Sélectionne une liste</p>
              <p className="text-[11px] text-white/15">ou crée-en une nouvelle via le bouton +</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white/20" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative px-5 pt-5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => { setActiveId(null); setShowAiPanel(false); }}
                  className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.06)" }}>
                  <ArrowLeft size={14} className="text-white/60" />
                </button>
                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ background: detail.color, boxShadow: `0 0 10px ${detail.color}70` }} />
                  <h2 className="text-[17px] font-black text-white truncate">{detail.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setShowAiPanel(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition"
                    style={showAiPanel
                      ? { background: "rgba(124,58,237,0.20)", border: "1px solid rgba(124,58,237,0.40)", color: "#c9a55a" }
                      : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(12,24,100,0.08)"}`, color: isDark ? "rgba(255,255,255,0.40)" : "rgba(12,18,50,0.45)" }
                    }>
                    <Sparkles size={11} />IA
                  </button>
                  <button onClick={() => { void loadHistory(); }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition hover:text-white/60 hover:bg-white/5">
                    <History size={13} />
                  </button>
                  <button onClick={() => deleteList(detail.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Barre progression */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)" }}>
                  <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease }}
                    className="h-full rounded-full"
                    style={{ background: progress === 100 ? "linear-gradient(90deg,#4ade80,#22c55e)" : `linear-gradient(90deg, ${detail.color}, ${detail.color}bb)` }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums shrink-0"
                  style={{ color: progress === 100 ? "#4ade80" : isDark ? "rgba(255,255,255,0.35)" : "rgba(12,18,50,0.40)" }}>
                  {doneCount}/{totalCount}
                </span>
              </div>

              {/* Filtres */}
              <div className="flex gap-1.5">
                {(["all","active","done"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-all"
                    style={filter === f
                      ? { background: `${detail.color}20`, border: `1px solid ${detail.color}50`, color: detail.color }
                      : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(12,24,100,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.08)"}`, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(12,18,50,0.42)" }
                    }>
                    {f === "all" ? `Tout (${totalCount})` : f === "active" ? `À faire (${totalCount - doneCount})` : `Faits (${doneCount})`}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
              <AnimatePresence initial={false}>
                {filteredItems.length === 0 ? (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-2 py-12 text-center">
                    <ClipboardList size={28} className="text-white/10" />
                    <p className="text-[11px] text-white/20">{filter === "done" ? "Aucune tâche terminée" : "Aucune tâche — ajoute-en ci-dessous"}</p>
                  </motion.div>
                ) : (
                  filteredItems.map(item => (
                    <CheckItemRow
                      key={item.id}
                      item={item}
                      color={detail.color}
                      isDark={isDark}
                      onToggle={() => toggleItem(item.id)}
                      onStar={() => toggleStar(item.id)}
                      onDelete={() => deleteItem(item.id)}
                      onUpdate={patch => updateItem(item.id, patch)}
                    />
                  ))
                )}
              </AnimatePresence>

              {/* Message 100% */}
              <AnimatePresence>
                {progress === 100 && totalCount > 0 && (
                  <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                    className="flex flex-col items-center gap-2 mt-4 py-5 rounded-2xl"
                    style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
                    <CheckCircle2 size={28} className="text-emerald-400" />
                    <p className="text-[12.5px] font-bold text-emerald-400">Tout est terminé !</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Zone d'ajout */}
            <div className="px-5 pb-5 pt-3 border-t border-white/[0.05]">
              {/* Priorité rapide */}
              <div className="flex gap-1 mb-2">
                {(["normal","high","urgent"] as Priority[]).map(p => {
                  const m = PRIORITY_META[p];
                  return (
                    <button key={p} onClick={() => setNewItemPriority(p)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[9.5px] font-semibold transition"
                      style={newItemPriority === p
                        ? { background: `${m.color}20`, border: `1px solid ${m.color}50`, color: m.color }
                        : { background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.07)"}`, color: isDark ? "rgba(255,255,255,0.30)" : "rgba(12,18,50,0.35)" }
                      }>
                      <m.Icon size={8} />{m.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  ref={itemRef}
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addItem(); }}
                  placeholder="Ajouter une tâche… (Entrée)"
                  className={`flex-1 rounded-xl px-4 py-3 text-[12.5px] outline-none transition-all ${isDark ? "text-white placeholder:text-white/25" : "text-gray-800 placeholder:text-gray-400"}`}
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    border: `1.5px solid ${newItem ? detail.color + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"}`,
                    boxShadow: newItem ? `0 0 0 3px ${detail.color}10` : "none",
                  }}
                />
                <button onClick={addItem} disabled={!newItem.trim() || addingItem}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition shadow-lg disabled:opacity-40"
                  style={{ background: newItem.trim() ? `linear-gradient(135deg, ${detail.color}, ${detail.color}cc)` : "rgba(255,255,255,0.07)", boxShadow: newItem.trim() ? `0 4px 14px ${detail.color}40` : "none" }}>
                  {addingItem ? <Loader2 size={16} className="animate-spin text-white" /> : <Plus size={18} color="white" strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ PANNEAU IA ════════════════════════════════════════ */}
      <AnimatePresence>
        {showAiPanel && detail && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="flex-shrink-0 overflow-hidden"
            style={{ minWidth: 0 }}
          >
            <div className="h-full w-[300px]" style={{ background: isDark ? "#07080e" : "#f0f2fb" }}>
              <AiPanel
                checklist={detail}
                isDark={isDark}
                onApplied={() => { void loadDetail(detail.id); void loadLists(); }}
                onClose={() => setShowAiPanel(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DRAWER HISTORIQUE ═════════════════════════════════ */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setHistoryOpen(false)} />
            <motion.div initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
              transition={{ type:"spring", stiffness:320, damping:35 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[320px] flex flex-col"
              style={{ background: isDark ? "#0d0e17" : "#f8f9ff", borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(12,24,100,0.10)"}` }}>

              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <History size={15} style={{ color: GOLD }} />
                  <p className="text-[14px] font-bold text-white/80">Historique IA</p>
                </div>
                <button onClick={() => setHistoryOpen(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5">
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-[11px] text-white/25 text-center py-8">Aucune modification IA</p>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="rounded-xl p-3"
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(12,24,100,0.08)"}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold text-white/70">{h.description ?? h.action}</p>
                          <p className="text-[9px] text-white/25 mt-0.5">{new Date(h.created_at).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</p>
                        </div>
                        {h.action === "ai_batch" && (
                          <button onClick={() => undoHistoryEntry(h.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition"
                            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.06)", color: isDark ? "rgba(255,255,255,0.50)" : "rgba(12,18,50,0.55)" }}>
                            <RotateCcw size={9} />Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
