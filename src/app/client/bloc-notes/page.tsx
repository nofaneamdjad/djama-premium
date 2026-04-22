"use client";

/**
 * Bloc-notes DJAMA PRO — v2 premium
 *
 * Nouveautés v2 :
 *   ✨ IA : Améliorer / Résumer / Transformer en tâches (claude-3-haiku)
 *   ⭐ Favoris + 📌 Épinglés (localStorage, persistants per-device)
 *   ↻  Auto-save : 2,5 s après dernière frappe sur note existante
 *   ☑  Checklists : bouton "Insérer case" + mode aperçu interactif
 *   🔤 Compteur de mots en temps réel
 *   📂 Tri par date (↑↓) ou par catégorie
 *   ⚡ Filtres rapides : Favoris / Épinglés
 *   💬 Tagline positionnement SaaS dans l'empty state
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Plus, Search, Trash2, FileDown, Save,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft,
  ChevronDown, Clock, SortAsc, SortDesc, X,
  Sparkles, Wand2, FileText, ListChecks,
  Star, Pin, Check, Eye, EyeOff, CheckSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type Category  = "réunion" | "idées" | "tâches" | "personnel";
type AiAction  = "improve" | "summarize" | "to-tasks";
type SortBy    = "date" | "category";

interface Note {
  id:         string;
  user_id:    string;
  title:      string;
  content:    string;
  category:   Category;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const CATEGORIES = [
  { value: "réunion"   as Category, label: "Réunion",   color: "#60a5fa", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  { value: "idées"     as Category, label: "Idées",     color: "#c9a55a", bg: "rgba(201,165,90,0.12)",  border: "rgba(201,165,90,0.3)"  },
  { value: "tâches"    as Category, label: "Tâches",    color: "#4ade80", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)"   },
  { value: "personnel" as Category, label: "Personnel", color: "#a78bfa", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)"  },
] as const;

const AI_ACTIONS = [
  { action: "improve"   as AiAction, label: "Améliorer",  icon: Wand2,       tip: "Améliore style et grammaire"  },
  { action: "summarize" as AiAction, label: "Résumer",    icon: FileText,    tip: "Génère un résumé en points"   },
  { action: "to-tasks"  as AiAction, label: "En tâches",  icon: ListChecks,  tip: "Transforme en liste de tâches"},
] as const;

/* ── localStorage helpers — favoris & épinglés ── */
const FAV_KEY = "djama_notes_favorites";
const PIN_KEY = "djama_notes_pinned";

function getLocalSet(key: string): Set<string> {
  try {
    if (typeof window === "undefined") return new Set();
    const d = localStorage.getItem(key);
    return d ? new Set(JSON.parse(d) as string[]) : new Set();
  } catch { return new Set(); }
}
function saveLocalSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...s])); } catch {}
}

/* ── Helpers ── */
function getCat(v: Category) {
  return CATEGORIES.find(c => c.value === v) ?? CATEGORIES[3];
}
function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
function fmtDateShort(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

/* ═══════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════════ */

function CategoryBadge({ cat }: { cat: Category }) {
  const c = getCat(cat);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

function Toast({ toast, onClose }: { toast: { type: "success" | "error"; msg: string }; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.35, ease }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.95)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.95)] text-red-300"
      }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 size={16} className="shrink-0 text-green-400" />
        : <AlertCircle  size={16} className="shrink-0 text-red-400" />}
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 text-white/30 hover:text-white/70 transition"><X size={13} /></button>
    </motion.div>
  );
}

function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 8, opacity: 0 }} transition={{ duration: 0.3, ease }}
        className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <h3 className="text-base font-extrabold text-white">Supprimer cette note ?</h3>
        <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel}  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white/90">Annuler</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500">Supprimer</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── ChecklistView — aperçu interactif des cases à cocher ── */
function ChecklistView({ content, onToggle }: { content: string; onToggle: (c: string) => void }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 py-1">
      {lines.map((line, i) => {
        const unchecked = line.match(/^(\s*)-\s*\[\s*\]\s*(.*)/);
        const checked   = line.match(/^(\s*)-\s*\[x\]\s*(.*)/i);

        if (unchecked || checked) {
          const isDone = !!checked;
          const indent = (unchecked ?? checked)![1].length;
          const text   = (unchecked ?? checked)![2];
          return (
            <div key={i} className="flex items-center gap-2.5" style={{ paddingLeft: `${indent * 8}px` }}>
              <button
                onClick={() => {
                  const nl = [...lines];
                  nl[i] = isDone
                    ? `${ (unchecked ?? checked)![1] }- [ ] ${text}`
                    : `${ (unchecked ?? checked)![1] }- [x] ${text}`;
                  onToggle(nl.join("\n"));
                }}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
                style={{
                  borderColor: isDone ? "#4ade80" : "rgba(255,255,255,0.2)",
                  background:  isDone ? "rgba(74,222,128,0.12)" : "transparent",
                }}
              >
                {isDone && <Check size={10} className="text-green-400" />}
              </button>
              <span className={`text-[0.95rem] leading-relaxed transition ${isDone ? "text-white/35 line-through" : "text-white/80"}`}>
                {text || "\u00a0"}
              </span>
            </div>
          );
        }

        return (
          <p key={i} className={`text-[0.95rem] leading-relaxed text-white/80 ${!line ? "h-5" : ""}`}>
            {line || ""}
          </p>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT PDF (inchangé)
═══════════════════════════════════════════════════════════════ */
function exportPDF(note: Note) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cat = getCat(note.category);
  const W = 210, margin = 20, maxWidth = W - margin * 2;
  doc.setFillColor(8, 10, 15);
  doc.rect(0, 0, W, 55, "F");
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(201, 165, 90);
  doc.text(cat.label.toUpperCase(), margin, 20);
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(note.title || "Sans titre", maxWidth) as string[];
  doc.text(titleLines, margin, 30);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(130, 130, 130);
  doc.text(`Modifiée le ${fmtDate(note.updated_at)}`, margin, 48);
  doc.setDrawColor(201, 165, 90); doc.setLineWidth(0.4); doc.line(margin, 56, W - margin, 56);
  doc.setFontSize(10.5); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
  const bodyLines = doc.splitTextToSize(note.content || "(note vide)", maxWidth) as string[];
  const lineH = 5.5; let y = 66;
  for (const line of bodyLines) {
    if (y > 277) { doc.addPage(); y = margin; }
    doc.text(line, margin, y); y += lineH;
  }
  doc.setFontSize(7.5); doc.setTextColor(160, 160, 160);
  doc.text("DJAMA — Bloc-notes Pro", margin, 290);
  doc.text("Page 1", W - margin, 290, { align: "right" });
  doc.save(`${(note.title || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function BlocNotesPage() {
  /* ── Notes & sélection ── */
  const [notes,      setNotes]      = useState<Note[]>([]);
  const [selected,   setSelected]   = useState<Note | null>(null);
  const [draft,      setDraft]      = useState<Partial<Note>>({});
  const [dirty,      setDirty]      = useState(false);

  /* ── États de chargement ── */
  const [loadingAll, setLoadingAll] = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [aiLoading,  setAiLoading]  = useState<AiAction | null>(null);

  /* ── UI ── */
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast,      setToast]      = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const [preview,    setPreview]    = useState(false);  // mode aperçu checklist

  /* ── Filtres ── */
  const [query,      setQuery]      = useState("");
  const [filterCat,  setFilterCat]  = useState<Category | "tous">("tous");
  const [filterFav,  setFilterFav]  = useState(false);
  const [sortDir,    setSortDir]    = useState<"desc" | "asc">("desc");
  const [sortBy,     setSortBy]     = useState<SortBy>("date");

  /* ── Favoris & épinglés (localStorage) ── */
  const [favorites,  setFavorites]  = useState<Set<string>>(new Set());
  const [pinned,     setPinned]     = useState<Set<string>>(new Set());

  /* ── Refs ── */
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const handleSaveRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});

  /* ── Charger les notes ── */
  const fetchNotes = useCallback(async () => {
    setLoadingAll(true);
    const { data, error } = await supabase
      .from("notes").select("*").order("updated_at", { ascending: false });
    if (error) showToast("error", "Impossible de charger les notes.");
    else       setNotes((data as Note[]) ?? []);
    setLoadingAll(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  /* ── Charger favoris/épinglés depuis localStorage ── */
  useEffect(() => {
    setFavorites(getLocalSet(FAV_KEY));
    setPinned(getLocalSet(PIN_KEY));
  }, []);

  /* ── Ctrl+S ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && dirty) {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty]);

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft.content]);

  /* ── Toast ── */
  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
  }

  /* ── Sauvegarder ── */
  const handleSave = useCallback(async (silent = false) => {
    if (!draft.title?.trim() && !draft.content?.trim()) {
      if (!silent) showToast("error", "La note doit avoir un titre ou du contenu.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (!silent) showToast("error", "Non connecté."); return; }

    if (!silent) setSaving(true);

    const payload = {
      title:    draft.title    ?? "",
      content:  draft.content  ?? "",
      category: draft.category ?? "personnel",
    };

    let saved: Note | null = null;

    if (selected) {
      const { data, error } = await supabase
        .from("notes").update(payload).eq("id", selected.id).select().single();
      if (error) { if (!silent) showToast("error", error.message); if (!silent) setSaving(false); return; }
      saved = data as Note;
      setNotes(prev => prev.map(n => n.id === saved!.id ? saved! : n));
    } else {
      const { data, error } = await supabase
        .from("notes").insert({ ...payload, user_id: user.id }).select().single();
      if (error) { if (!silent) showToast("error", error.message); if (!silent) setSaving(false); return; }
      saved = data as Note;
      setNotes(prev => [saved!, ...prev]);
    }

    setSelected(saved);
    setDraft({ title: saved.title, content: saved.content, category: saved.category });
    setDirty(false);
    if (!silent) { setSaving(false); showToast("success", "Note enregistrée."); }
  }, [draft, selected]);

  /* ── Sync ref ── */
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  /* ── Auto-save (2,5 s après dernière frappe, note existante seulement) ── */
  useEffect(() => {
    if (!dirty || !selected?.id) return;
    const timer = setTimeout(async () => {
      setAutoSaving(true);
      await handleSaveRef.current(true);
      setAutoSaving(false);
    }, 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, draft.content, draft.category, dirty, selected?.id]);

  /* ── Supprimer ── */
  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    const { error } = await supabase.from("notes").delete().eq("id", selected.id);
    setDeleting(false);
    setConfirmDel(false);
    if (error) { showToast("error", error.message); return; }
    setNotes(prev => prev.filter(n => n.id !== selected.id));
    setSelected(null); setDraft({}); setDirty(false); setMobileView("list");
    showToast("success", "Note supprimée.");
  }

  /* ── Sélectionner / Créer ── */
  function openNote(note: Note) {
    setSelected(note);
    setDraft({ title: note.title, content: note.content, category: note.category });
    setDirty(false); setPreview(false); setMobileView("editor");
  }

  function newNote() {
    setSelected(null);
    setDraft({ title: "", content: "", category: "idées" });
    setDirty(true); setPreview(false); setMobileView("editor");
    setTimeout(() => (document.getElementById("note-title") as HTMLInputElement)?.focus(), 80);
  }

  function updateDraft(key: keyof Note, value: string) {
    setDraft(d => ({ ...d, [key]: value }));
    setDirty(true);
  }

  /* ── Favoris & épinglés ── */
  function toggleFavorite(noteId: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      saveLocalSet(FAV_KEY, next);
      return next;
    });
  }

  function togglePin(noteId: string) {
    setPinned(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      saveLocalSet(PIN_KEY, next);
      return next;
    });
  }

  /* ── IA ── */
  async function runAI(action: AiAction) {
    if (!draft.content?.trim() && !draft.title?.trim()) {
      showToast("error", "Écrivez quelque chose avant d'utiliser l'IA.");
      return;
    }
    setAiLoading(action);
    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: draft.content ?? "", title: draft.title ?? "" }),
      });
      const { result, error } = await res.json() as { result?: string; error?: string };
      if (error) throw new Error(error);
      if (!result) throw new Error("Réponse vide");

      if (action === "to-tasks") {
        setDraft(d => ({ ...d, content: result, category: "tâches" as Category }));
        showToast("success", "✅ Transformé en liste de tâches — pensez à sauvegarder.");
      } else {
        setDraft(d => ({ ...d, content: result }));
        showToast("success", action === "improve" ? "✨ Note améliorée — pensez à sauvegarder." : "📋 Résumé généré — pensez à sauvegarder.");
      }
      setDirty(true);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erreur IA.");
    } finally {
      setAiLoading(null);
    }
  }

  /* ── Insérer une case à cocher ── */
  function insertCheckItem() {
    const content = draft.content ?? "";
    const sep     = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
    const newContent = `${content}${sep}- [ ] `;
    updateDraft("content", newContent);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = newContent.length; }
    }, 0);
  }

  /* ── Filtres & tri ── */
  const filtered = useMemo(() => {
    let list = [...notes];

    if (filterCat !== "tous") list = list.filter(n => n.category === filterCat);
    if (filterFav)            list = list.filter(n => favorites.has(n.id));

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    if (sortBy === "category") {
      list.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      list.sort((a, b) => {
        const ta = new Date(a.updated_at).getTime();
        const tb = new Date(b.updated_at).getTime();
        return sortDir === "desc" ? tb - ta : ta - tb;
      });
    }

    // Épinglés toujours en premier
    list.sort((a, b) => (pinned.has(b.id) ? 1 : 0) - (pinned.has(a.id) ? 1 : 0));

    return list;
  }, [notes, filterCat, filterFav, query, sortBy, sortDir, favorites, pinned]);

  const wordCount = useMemo(() => countWords(draft.content ?? ""), [draft.content]);
  const hasContent = draft.title !== undefined || draft.content !== undefined;

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col bg-[#080a0f]">

      {/* ── Glows de fond ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[20%] top-[10%] h-[500px] w-[500px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full bg-[rgba(124,111,205,0.04)] blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.85)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <StickyNote size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">Bloc-notes</h1>
                <span className="rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)] px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#c9a55a]">
                  PRO
                </span>
              </div>
              <p className="text-[0.64rem] text-white/30 hidden sm:block">
                Capturez vos idées, organisez votre travail et améliorez vos notes avec l&apos;IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[0.7rem] text-white/25 sm:block">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={newNote}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]"
            >
              <Plus size={14} /> Nouvelle note
            </button>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-0 overflow-hidden sm:gap-5 sm:px-5 sm:py-5">

        {/* ════════════════════════════════════════════
            PANNEAU GAUCHE — LISTE
        ════════════════════════════════════════════ */}
        <motion.aside
          className={`flex w-full flex-col border-r border-white/6 bg-[rgba(15,17,23,0.6)] sm:w-[300px] sm:flex-none sm:rounded-[1.5rem] sm:border sm:border-white/8 ${
            mobileView === "editor" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Search + filtres */}
          <div className="space-y-2.5 border-b border-white/6 p-4">

            {/* Barre de recherche */}
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)] focus:ring-1 focus:ring-[rgba(201,165,90,0.15)]"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filtres catégorie */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterCat("tous")}
                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition ${
                  filterCat === "tous" ? "bg-white/12 text-white" : "text-white/30 hover:text-white/60"
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setFilterCat(filterCat === c.value ? "tous" : c.value)}
                  className="rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition"
                  style={
                    filterCat === c.value
                      ? { color: c.color, background: c.bg, border: `1px solid ${c.border}` }
                      : { color: "rgba(255,255,255,0.3)" }
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Filtres rapides + tri */}
            <div className="flex items-center justify-between gap-2">
              {/* Favoris */}
              <button
                onClick={() => setFilterFav(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.65rem] font-bold transition ${
                  filterFav
                    ? "bg-[rgba(201,165,90,0.12)] text-[#c9a55a] border border-[rgba(201,165,90,0.3)]"
                    : "text-white/25 hover:text-white/50"
                }`}
              >
                <Star size={11} fill={filterFav ? "#c9a55a" : "none"} />
                Favoris
              </button>

              {/* Tri */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortBy("date")}
                  className={`rounded-lg px-2 py-1 text-[0.62rem] font-bold transition ${sortBy === "date" ? "bg-white/8 text-white/70" : "text-white/25 hover:text-white/45"}`}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy("category")}
                  className={`rounded-lg px-2 py-1 text-[0.62rem] font-bold transition ${sortBy === "category" ? "bg-white/8 text-white/70" : "text-white/25 hover:text-white/45"}`}
                >
                  Catégorie
                </button>
                {sortBy === "date" && (
                  <button
                    onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                    className="text-white/25 hover:text-white/55 transition"
                  >
                    {sortDir === "desc" ? <SortDesc size={12} /> : <SortAsc size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste des notes */}
          <div className="flex-1 overflow-y-auto">
            {loadingAll ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-white/20" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <StickyNote size={24} className="text-white/15" />
                <p className="text-sm text-white/25">
                  {query || filterCat !== "tous" || filterFav ? "Aucun résultat" : "Aucune note"}
                </p>
                {!query && filterCat === "tous" && !filterFav && (
                  <button
                    onClick={newNote}
                    className="mt-1 flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] px-3 py-1.5 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.1)]"
                  >
                    <Plus size={12} /> Créer une note
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map(note => {
                  const isFav = favorites.has(note.id);
                  const isPin = pinned.has(note.id);
                  const isActive = selected?.id === note.id;
                  return (
                    <motion.div
                      key={note.id} layout
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25, ease }}
                      className={`group relative border-b border-white/5 transition hover:bg-white/[0.035] ${
                        isActive ? "bg-white/[0.05]" : ""
                      }`}
                    >
                      {/* Indicateur actif */}
                      {isActive && (
                        <motion.div layoutId="note-indicator"
                          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-[#c9a55a]"
                        />
                      )}

                      {/* Contenu cliquable */}
                      <button className="w-full px-4 py-3.5 text-left" onClick={() => openNote(note)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isPin && <Pin size={10} className="shrink-0 text-[#a78bfa]" fill="#a78bfa" />}
                            {isFav && <Star size={10} className="shrink-0 text-[#c9a55a]" fill="#c9a55a" />}
                            <p className="line-clamp-1 text-sm font-bold text-white/90">
                              {note.title || <span className="text-white/30 italic">Sans titre</span>}
                            </p>
                          </div>
                          <CategoryBadge cat={note.category} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/35">
                          {note.content || <span className="italic">Note vide</span>}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[0.6rem] text-white/20">
                          <Clock size={9} />{fmtDateShort(note.updated_at)}
                        </div>
                      </button>

                      {/* Actions rapides au hover */}
                      <div className="absolute right-3 top-3 hidden items-center gap-1 group-hover:flex">
                        <button
                          onClick={e => { e.stopPropagation(); togglePin(note.id); }}
                          title={isPin ? "Désépingler" : "Épingler"}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 transition hover:bg-white/12"
                        >
                          <Pin size={10} className={isPin ? "text-[#a78bfa]" : "text-white/30"} fill={isPin ? "#a78bfa" : "none"} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite(note.id); }}
                          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 transition hover:bg-white/12"
                        >
                          <Star size={10} className={isFav ? "text-[#c9a55a]" : "text-white/30"} fill={isFav ? "#c9a55a" : "none"} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.aside>

        {/* ════════════════════════════════════════════
            PANNEAU DROIT — ÉDITEUR
        ════════════════════════════════════════════ */}
        <main className={`flex flex-1 flex-col ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
          {hasContent ? (
            <motion.div
              key={selected?.id ?? "new"}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex h-full flex-col rounded-none bg-[rgba(15,17,23,0.6)] sm:rounded-[1.5rem] sm:border sm:border-white/8"
            >

              {/* ── Toolbar principale ── */}
              <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-3">
                {/* Retour mobile */}
                <button onClick={() => setMobileView("list")} className="flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white/70 sm:hidden">
                  <ArrowLeft size={14} /> Notes
                </button>

                {/* Statut save */}
                <div className="hidden items-center gap-2 sm:flex">
                  {autoSaving && (
                    <span className="flex items-center gap-1.5 text-[0.6rem] text-white/30">
                      <Loader2 size={9} className="animate-spin" /> Sauvegarde auto…
                    </span>
                  )}
                  {!autoSaving && dirty && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-2.5 py-1 text-[0.6rem] font-semibold text-[#c9a55a]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" /> Non sauvegardé
                    </motion.span>
                  )}
                  {!autoSaving && !dirty && selected && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] text-white/25">
                      <CheckCircle2 size={11} className="text-green-500/60" /> Enregistré
                    </span>
                  )}
                </div>

                {/* Actions droite */}
                <div className="ml-auto flex items-center gap-1.5">
                  {/* Favoris (note ouverte) */}
                  {selected && (
                    <button
                      onClick={() => toggleFavorite(selected.id)}
                      title={favorites.has(selected.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-xs font-semibold transition hover:border-[rgba(201,165,90,0.3)] hover:bg-[rgba(201,165,90,0.07)]"
                    >
                      <Star size={13} className={favorites.has(selected.id) ? "text-[#c9a55a]" : "text-white/40"} fill={favorites.has(selected.id) ? "#c9a55a" : "none"} />
                    </button>
                  )}
                  {/* Épingler (note ouverte) */}
                  {selected && (
                    <button
                      onClick={() => togglePin(selected.id)}
                      title={pinned.has(selected.id) ? "Désépingler" : "Épingler"}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-xs font-semibold transition hover:border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.07)]"
                    >
                      <Pin size={13} className={pinned.has(selected.id) ? "text-[#a78bfa]" : "text-white/40"} fill={pinned.has(selected.id) ? "#a78bfa" : "none"} />
                    </button>
                  )}
                  {/* Aperçu checklist */}
                  <button
                    onClick={() => setPreview(v => !v)}
                    title={preview ? "Mode édition" : "Mode aperçu checklist"}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                      preview
                        ? "border-[rgba(96,165,250,0.3)] bg-[rgba(59,130,246,0.08)] text-[#60a5fa]"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span className="hidden sm:inline">{preview ? "Éditer" : "Aperçu"}</span>
                  </button>
                  {/* Export PDF */}
                  {selected && (
                    <button
                      onClick={() => exportPDF({ ...selected, ...draft } as Note)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80"
                    >
                      <FileDown size={13} /><span className="hidden sm:inline">PDF</span>
                    </button>
                  )}
                  {/* Supprimer */}
                  {selected && (
                    <button
                      onClick={() => setConfirmDel(true)} disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                    >
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}
                  {/* Sauvegarder */}
                  <button
                    onClick={() => handleSaveRef.current()}
                    disabled={saving || autoSaving || !dirty}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,165,90,0.3)] transition hover:shadow-[0_4px_20px_rgba(201,165,90,0.45)] disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Enregistrer
                  </button>
                </div>
              </div>

              {/* ── Zone IA ── */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-[rgba(201,165,90,0.025)] px-5 py-2.5">
                <div className="flex items-center gap-1.5 mr-1">
                  <Sparkles size={11} className="text-[#c9a55a]" />
                  <span className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-white/25">IA</span>
                </div>
                {AI_ACTIONS.map(({ action, label, icon: Icon, tip }) => (
                  <button
                    key={action}
                    onClick={() => runAI(action)}
                    disabled={!!aiLoading}
                    title={tip}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      aiLoading === action
                        ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.12)] text-[#c9a55a] shadow-[0_0_12px_rgba(201,165,90,0.2)]"
                        : "border-white/[0.08] text-white/45 hover:border-[rgba(201,165,90,0.3)] hover:bg-[rgba(201,165,90,0.07)] hover:text-[#c9a55a]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {aiLoading === action
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Icon size={11} />
                    }
                    {label}
                  </button>
                ))}
                {/* Insérer case à cocher */}
                {!preview && (
                  <button
                    onClick={insertCheckItem}
                    title="Insérer une case à cocher"
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/35 transition hover:border-white/20 hover:text-white/60"
                  >
                    <CheckSquare size={11} />
                    <span className="hidden sm:inline">Case à cocher</span>
                  </button>
                )}
              </div>

              {/* ── Zone édition ── */}
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">

                {/* Titre */}
                <input
                  id="note-title" type="text"
                  value={draft.title ?? ""}
                  onChange={e => updateDraft("title", e.target.value)}
                  placeholder="Titre de la note…"
                  className="w-full border-none bg-transparent text-2xl font-extrabold text-white placeholder:text-white/20 outline-none sm:text-3xl"
                />

                {/* Méta : catégorie + date */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select
                      value={draft.category ?? "idées"}
                      onChange={e => updateDraft("category", e.target.value)}
                      className="appearance-none rounded-full border py-1 pl-3 pr-7 text-[0.65rem] font-bold uppercase tracking-wider outline-none transition cursor-pointer"
                      style={(() => {
                        const c = getCat((draft.category as Category) ?? "idées");
                        return { color: c.color, background: c.bg, borderColor: c.border };
                      })()}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value} style={{ background: "#0f1117", color: "#fff" }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60" />
                  </div>
                  {selected && (
                    <span className="flex items-center gap-1 text-[0.65rem] text-white/25">
                      <Clock size={10} /> Modifiée le {fmtDate(selected.updated_at)}
                    </span>
                  )}
                </div>

                {/* Divider or */}
                <div className="my-5 h-px w-full bg-gradient-to-r from-[rgba(201,165,90,0.25)] via-[rgba(201,165,90,0.08)] to-transparent" />

                {/* Contenu : aperçu checklist OU textarea */}
                {preview ? (
                  <div className="flex-1">
                    <ChecklistView
                      content={draft.content ?? ""}
                      onToggle={c => { updateDraft("content", c); }}
                    />
                    {!(draft.content?.trim()) && (
                      <p className="text-sm italic text-white/20">Note vide — passez en mode édition pour écrire.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={draft.content ?? ""}
                    onChange={e => updateDraft("content", e.target.value)}
                    placeholder="Commencez à écrire… Utilisez l'IA pour améliorer, résumer ou transformer votre note."
                    className="min-h-[240px] w-full flex-1 resize-none border-none bg-transparent text-[0.95rem] leading-relaxed text-white/80 placeholder:text-white/18 outline-none focus:placeholder:text-white/10 transition-colors"
                    style={{ height: "auto" }}
                  />
                )}
              </div>

              {/* ── Footer : compteur de mots + auto-save ── */}
              <div className="flex items-center justify-between border-t border-white/5 px-6 py-2.5 sm:px-8">
                <span className="text-[0.62rem] text-white/20">
                  {wordCount} mot{wordCount !== 1 ? "s" : ""}
                  {draft.content ? ` · ${draft.content.length} caractères` : ""}
                </span>
                {autoSaving && (
                  <span className="flex items-center gap-1.5 text-[0.62rem] text-white/25">
                    <Loader2 size={9} className="animate-spin" /> Sauvegarde…
                  </span>
                )}
                {!autoSaving && !dirty && selected && (
                  <span className="flex items-center gap-1.5 text-[0.62rem] text-green-500/40">
                    <CheckCircle2 size={9} /> Enregistré
                  </span>
                )}
              </div>

            </motion.div>
          ) : (
            /* ── Empty state — positionnement SaaS ── */
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-5 rounded-none p-8 text-center sm:rounded-[1.5rem] sm:border sm:border-white/8 sm:bg-[rgba(15,17,23,0.4)]"
            >
              {/* Icône animée */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)]"
              >
                <StickyNote size={28} style={{ color: "#c9a55a" }} />
              </motion.div>

              {/* Tagline SaaS */}
              <div>
                <p className="text-lg font-extrabold text-white">Bloc-notes IA</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/40">
                  Capturez vos idées, organisez votre travail et améliorez vos notes avec l&apos;IA.
                </p>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: Sparkles,    label: "Améliorer avec l'IA" },
                  { icon: Star,        label: "Favoris"              },
                  { icon: Pin,         label: "Épingler"             },
                  { icon: CheckSquare, label: "Checklists"           },
                  { icon: FileDown,    label: "Export PDF"           },
                ].map(f => (
                  <span key={f.label} className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                    <f.icon size={11} className="text-[#c9a55a]" />
                    {f.label}
                  </span>
                ))}
              </div>

              <button
                onClick={newNote}
                className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-5 py-2.5 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]"
              >
                <Plus size={15} /> Nouvelle note
              </button>
            </motion.div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {confirmDel && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
