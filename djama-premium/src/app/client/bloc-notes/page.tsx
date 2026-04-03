"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Plus, Search, Trash2, FileDown, Save,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft,
  ChevronDown, Clock, SortAsc, SortDesc, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type Category = "réunion" | "idées" | "tâches" | "personnel";

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: Category;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const CATEGORIES: {
  value: Category; label: string; color: string; bg: string; border: string;
}[] = [
  { value: "réunion",   label: "Réunion",   color: "#60a5fa", bg: "rgba(59,130,246,0.12)",   border: "rgba(59,130,246,0.3)"   },
  { value: "idées",     label: "Idées",     color: "#c9a55a", bg: "rgba(201,165,90,0.12)",   border: "rgba(201,165,90,0.3)"   },
  { value: "tâches",    label: "Tâches",    color: "#4ade80", bg: "rgba(34,197,94,0.12)",    border: "rgba(34,197,94,0.3)"    },
  { value: "personnel", label: "Personnel", color: "#a78bfa", bg: "rgba(139,92,246,0.12)",   border: "rgba(139,92,246,0.3)"   },
];

function getCat(v: Category) {
  return CATEGORIES.find((c) => c.value === v) ?? CATEGORIES[3];
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function fmtDateShort(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
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
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.35, ease }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.95)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.95)] text-red-300"
      }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 size={16} className="shrink-0 text-green-400" />
        : <AlertCircle size={16} className="shrink-0 text-red-400" />
      }
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 text-white/30 hover:text-white/70 transition">
        <X size={13} />
      </button>
    </motion.div>
  );
}

function ConfirmDialog({
  onConfirm, onCancel,
}: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 8, opacity: 0 }}
        transition={{ duration: 0.3, ease }}
        className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <h3 className="text-base font-extrabold text-white">Supprimer cette note ?</h3>
        <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white/90"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT PDF
═══════════════════════════════════════════════════════════════ */
function exportPDF(note: Note) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cat = getCat(note.category);
  const W = 210;
  const margin = 20;
  const maxWidth = W - margin * 2;

  // ── Fond header ─────────────────────────────────────────────
  doc.setFillColor(8, 10, 15);
  doc.rect(0, 0, W, 55, "F");

  // ── Badge catégorie ──────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(201, 165, 90);
  doc.text(cat.label.toUpperCase(), margin, 20);

  // ── Titre ────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(note.title || "Sans titre", maxWidth) as string[];
  doc.text(titleLines, margin, 30);

  // ── Date ─────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(`Modifiée le ${fmtDate(note.updated_at)}`, margin, 48);

  // ── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(201, 165, 90);
  doc.setLineWidth(0.4);
  doc.line(margin, 56, W - margin, 56);

  // ── Contenu ──────────────────────────────────────────────────
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);

  const bodyLines = doc.splitTextToSize(note.content || "(note vide)", maxWidth) as string[];
  const lineH = 5.5;
  let y = 66;

  for (const line of bodyLines) {
    if (y > 277) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  }

  // ── Footer ───────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text("DJAMA — Bloc-notes", margin, 290);
  doc.text(
    `Page 1`,
    W - margin,
    290,
    { align: "right" }
  );

  const safeName = (note.title || "note").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${safeName}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function BlocNotesPage() {
  const [notes,      setNotes]      = useState<Note[]>([]);
  const [selected,   setSelected]   = useState<Note | null>(null);
  const [draft,      setDraft]      = useState<Partial<Note>>({});
  const [dirty,      setDirty]      = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast,      setToast]      = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Filtres
  const [query,      setQuery]      = useState("");
  const [filterCat,  setFilterCat]  = useState<Category | "tous">("tous");
  const [sortDir,    setSortDir]    = useState<"desc" | "asc">("desc");

  // Mobile: afficher editor ou liste
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Charger les notes ────────────────────────────────────── */
  const fetchNotes = useCallback(async () => {
    setLoadingAll(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: sortDir === "asc" });

    if (error) {
      showToast("error", "Impossible de charger les notes.");
    } else {
      setNotes((data as Note[]) ?? []);
    }
    setLoadingAll(false);
  }, [sortDir]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  /* ── Ctrl+S pour sauvegarder ─────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && dirty) {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, draft, selected]);

  /* ── Auto-resize textarea ────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft.content]);

  /* ── Toast helper ─────────────────────────────────────────── */
  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
  }

  /* ── Sélectionner une note ───────────────────────────────── */
  function openNote(note: Note) {
    setSelected(note);
    setDraft({ title: note.title, content: note.content, category: note.category });
    setDirty(false);
    setMobileView("editor");
  }

  /* ── Nouvelle note (draft local) ─────────────────────────── */
  function newNote() {
    setSelected(null);
    setDraft({ title: "", content: "", category: "idées" });
    setDirty(true);
    setMobileView("editor");
    setTimeout(() => {
      (document.getElementById("note-title") as HTMLInputElement)?.focus();
    }, 80);
  }

  /* ── Modifier le draft ───────────────────────────────────── */
  function updateDraft(key: keyof Note, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }

  /* ── Sauvegarder ─────────────────────────────────────────── */
  async function handleSave() {
    if (!draft.title?.trim() && !draft.content?.trim()) {
      showToast("error", "La note doit avoir un titre ou du contenu.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("error", "Non connecté."); return; }

    setSaving(true);

    const payload = {
      title:    draft.title    ?? "",
      content:  draft.content  ?? "",
      category: draft.category ?? "personnel",
    };

    let saved: Note | null = null;

    if (selected) {
      // Mise à jour
      const { data, error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", selected.id)
        .select()
        .single();
      if (error) { showToast("error", error.message); setSaving(false); return; }
      saved = data as Note;
      setNotes((prev) => prev.map((n) => (n.id === saved!.id ? saved! : n)));
    } else {
      // Création
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) { showToast("error", error.message); setSaving(false); return; }
      saved = data as Note;
      setNotes((prev) => [saved!, ...prev]);
    }

    setSelected(saved);
    setDraft({ title: saved.title, content: saved.content, category: saved.category });
    setDirty(false);
    setSaving(false);
    showToast("success", "Note enregistrée.");
  }

  /* ── Supprimer ───────────────────────────────────────────── */
  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    const { error } = await supabase.from("notes").delete().eq("id", selected.id);
    setDeleting(false);
    setConfirmDel(false);

    if (error) { showToast("error", error.message); return; }
    setNotes((prev) => prev.filter((n) => n.id !== selected.id));
    setSelected(null);
    setDraft({});
    setDirty(false);
    setMobileView("list");
    showToast("success", "Note supprimée.");
  }

  /* ── Filtres & recherche ─────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...notes];
    if (filterCat !== "tous") list = list.filter((n) => n.category === filterCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, filterCat, query]);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex flex-col bg-[#080a0f]">

      {/* Glow de fond */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[20%] top-[10%] h-[500px] w-[500px] rounded-full bg-[rgba(176,141,87,0.04)] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full bg-[rgba(124,111,205,0.04)] blur-[120px]" />
      </div>

      {/* Header page */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.85)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.09)]">
              <StickyNote size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Bloc-notes</h1>
              <p className="text-[0.65rem] text-white/35">
                {notes.length} note{notes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={newNote}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:shadow-[0_6px_24px_rgba(201,165,90,0.45)]"
          >
            <Plus size={14} /> Nouvelle note
          </button>
        </div>
      </div>

      {/* Corps principal */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-0 overflow-hidden sm:gap-5 sm:px-5 sm:py-5">

        {/* ── Panneau gauche : liste ──────────────────────── */}
        <motion.aside
          className={`flex w-full flex-col border-r border-white/6 bg-[rgba(15,17,23,0.6)] sm:w-[300px] sm:flex-none sm:rounded-[1.5rem] sm:border sm:border-white/8 ${
            mobileView === "editor" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Search + filtres */}
          <div className="space-y-2.5 border-b border-white/6 p-4">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"
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
                  filterCat === "tous"
                    ? "bg-white/12 text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilterCat(filterCat === c.value ? "tous" : c.value)}
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition`}
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

            {/* Tri */}
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-white/30 transition hover:text-white/60"
            >
              {sortDir === "desc" ? <SortDesc size={12} /> : <SortAsc size={12} />}
              {sortDir === "desc" ? "Plus récentes en premier" : "Plus anciennes en premier"}
            </button>
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
                  {query || filterCat !== "tous" ? "Aucun résultat" : "Aucune note"}
                </p>
                {!query && filterCat === "tous" && (
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
                {filtered.map((note) => (
                  <motion.button
                    key={note.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease }}
                    onClick={() => openNote(note)}
                    className={`group w-full border-b border-white/5 px-4 py-3.5 text-left transition hover:bg-white/4 ${
                      selected?.id === note.id ? "bg-white/6" : ""
                    }`}
                  >
                    {/* Barre de sélection gauche */}
                    {selected?.id === note.id && (
                      <motion.div
                        layoutId="note-indicator"
                        className="absolute left-0 h-12 w-0.5 rounded-r-full bg-[#c9a55a]"
                        style={{ marginTop: "-0.875rem" }}
                      />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-bold text-white/90">
                        {note.title || <span className="text-white/30 italic">Sans titre</span>}
                      </p>
                      <CategoryBadge cat={note.category} />
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/35">
                      {note.content || <span className="italic">Note vide</span>}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[0.6rem] text-white/20">
                      <Clock size={9} />
                      {fmtDateShort(note.updated_at)}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.aside>

        {/* ── Panneau droit : éditeur ─────────────────────── */}
        <main
          className={`flex flex-1 flex-col ${
            mobileView === "list" ? "hidden sm:flex" : "flex"
          }`}
        >
          {draft.title !== undefined || draft.content !== undefined ? (
            <motion.div
              key={selected?.id ?? "new"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex h-full flex-col rounded-none bg-[rgba(15,17,23,0.6)] sm:rounded-[1.5rem] sm:border sm:border-white/8"
            >
              {/* Toolbar éditeur */}
              <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-3.5">
                {/* Bouton retour mobile */}
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white/70 sm:hidden"
                >
                  <ArrowLeft size={14} /> Notes
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  {dirty && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-2.5 py-1 text-[0.6rem] font-semibold text-[#c9a55a]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />
                      Non sauvegardé
                    </motion.span>
                  )}
                  {!dirty && selected && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] text-white/25">
                      <CheckCircle2 size={11} className="text-green-500/60" />
                      Enregistré
                    </span>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {/* Export PDF */}
                  {selected && (
                    <button
                      onClick={() => exportPDF({ ...selected, ...draft } as Note)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white/80"
                    >
                      <FileDown size={13} />
                      <span className="hidden sm:inline">Exporter PDF</span>
                    </button>
                  )}

                  {/* Supprimer */}
                  {selected && (
                    <button
                      onClick={() => setConfirmDel(true)}
                      disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                    >
                      {deleting
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />
                      }
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}

                  {/* Sauvegarder */}
                  <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,165,90,0.3)] transition hover:shadow-[0_4px_20px_rgba(201,165,90,0.45)] disabled:opacity-50"
                  >
                    {saving
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Save size={13} />
                    }
                    Enregistrer
                  </button>
                </div>
              </div>

              {/* Champs édition */}
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">

                {/* Titre */}
                <input
                  id="note-title"
                  type="text"
                  value={draft.title ?? ""}
                  onChange={(e) => updateDraft("title", e.target.value)}
                  placeholder="Titre de la note…"
                  className="w-full border-none bg-transparent text-2xl font-extrabold text-white placeholder:text-white/20 outline-none sm:text-3xl"
                />

                {/* Catégorie + date */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select
                      value={draft.category ?? "idées"}
                      onChange={(e) => updateDraft("category", e.target.value as Category)}
                      className="appearance-none rounded-full border py-1 pl-3 pr-7 text-[0.65rem] font-bold uppercase tracking-wider outline-none transition cursor-pointer"
                      style={(() => {
                        const c = getCat(draft.category as Category ?? "idées");
                        return { color: c.color, background: c.bg, borderColor: c.border };
                      })()}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} style={{ background: "#0f1117", color: "#fff" }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60" />
                  </div>

                  {selected && (
                    <span className="flex items-center gap-1 text-[0.65rem] text-white/25">
                      <Clock size={10} />
                      Modifiée le {fmtDate(selected.updated_at)}
                    </span>
                  )}
                </div>

                {/* Divider doré */}
                <div className="my-5 h-px w-full bg-gradient-to-r from-[rgba(201,165,90,0.25)] via-[rgba(201,165,90,0.08)] to-transparent" />

                {/* Contenu */}
                <textarea
                  ref={textareaRef}
                  value={draft.content ?? ""}
                  onChange={(e) => updateDraft("content", e.target.value)}
                  placeholder="Commencez à écrire votre note…"
                  className="min-h-[240px] w-full flex-1 resize-none border-none bg-transparent text-[0.95rem] leading-relaxed text-white/80 placeholder:text-white/20 outline-none"
                  style={{ height: "auto" }}
                />
              </div>
            </motion.div>
          ) : (
            /* Empty state éditeur */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-4 rounded-none p-8 text-center sm:rounded-[1.5rem] sm:border sm:border-white/8 sm:bg-[rgba(15,17,23,0.4)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.07)]">
                <StickyNote size={28} style={{ color: "#c9a55a" }} />
              </div>
              <div>
                <p className="text-base font-bold text-white">Sélectionnez une note</p>
                <p className="mt-1 text-sm text-white/35">
                  ou créez-en une nouvelle pour commencer
                </p>
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

      {/* ── Confirmation suppression ───────────────────────── */}
      <AnimatePresence>
        {confirmDel && (
          <ConfirmDialog
            onConfirm={handleDelete}
            onCancel={() => setConfirmDel(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
