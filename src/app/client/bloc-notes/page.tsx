"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Plus, Search, Star, Trash2, Archive, ArchiveRestore,
  Folder, Bold, Italic, Underline as UnderlineIcon, List,
  ListOrdered, CheckSquare, Code2, Quote, Link2,
  Heading1, Heading2, Heading3, MoreVertical, FileText,
  Pin, PinOff, Check, AlertCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import Toast, { type ToastData, type ToastType } from "@/components/ui/Toast";

const GOLD = "#c9a55a";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Note {
  id: string;
  title: string;
  content: string;
  is_favorite: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  folder_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  doc_type?: string;
}

interface NoteFolder { id: string; name: string; color: string; }

type Section = "all" | "recent" | "favorites" | "archived" | `folder:${string}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)     return "À l'instant";
  if (s < 3600)   return `${Math.round(s / 60)} min`;
  if (s < 86400)  return `${Math.round(s / 3600)} h`;
  if (s < 604800) return `${Math.round(s / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ── ToolbarBtn ────────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick, active = false, title, children, isDark,
}: {
  onClick: () => void; active?: boolean; title?: string;
  children: React.ReactNode; isDark: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded transition-colors shrink-0"
      style={{
        background: active
          ? (isDark ? "rgba(201,165,90,0.2)" : "rgba(201,165,90,0.15)")
          : "transparent",
        color: active ? GOLD : isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
      }}
    >
      {children}
    </button>
  );
}

// ── NoteItem ──────────────────────────────────────────────────────────────────
function NoteItem({
  note, selected, onClick, onStar, isDark,
}: {
  note: Note; selected: boolean; onClick: () => void;
  onStar: (e: React.MouseEvent) => void; isDark: boolean;
}) {
  const preview = stripHtml(note.content).slice(0, 90) || "Note vide";
  const tc = isDark ? "rgba(255,255,255,0.88)" : "#111827";
  const tm = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="w-full text-left px-3 py-3 rounded-lg transition-colors group relative cursor-pointer"
      style={{
        background: selected
          ? isDark ? "rgba(201,165,90,0.09)" : "rgba(201,165,90,0.07)"
          : "transparent",
        borderLeft: `2px solid ${selected ? GOLD : "transparent"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate mb-0.5 leading-tight"
            style={{ color: selected ? GOLD : tc }}>
            {note.title || "Sans titre"}
          </p>
          <p className="text-[11px] leading-relaxed line-clamp-2"
            style={{ color: tm }}>
            {preview}
          </p>
          <p className="text-[10px] mt-1" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db" }}>
            {fmtDate(note.updated_at)}
          </p>
        </div>
        <button
          onClick={onStar}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0 mt-0.5 rounded"
          title={note.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star size={11}
            fill={note.is_favorite ? GOLD : "none"}
            style={{ color: note.is_favorite ? GOLD : tm }}
          />
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function BlocNotes() {
  const { isDark } = useTheme();

  const [notes,      setNotes]      = useState<Note[]>([]);
  const [folders,    setFolders]    = useState<NoteFolder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [section,    setSection]    = useState<Section>("all");
  const [search,     setSearch]     = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [creating,   setCreating]   = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "editor">("editor");
  const [toast,      setToast]      = useState<ToastData | null>(null);
  const [ctxMenuId,  setCtxMenuId]  = useState<string | null>(null);
  const [wordCount,  setWordCount]  = useState(0);

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const titleRef      = useRef("");
  const isSavingRef   = useRef(false);
  const searchRef     = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const ctxRef        = useRef<HTMLDivElement>(null);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // ── Tiptap ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList.configure({ HTMLAttributes: { class: "bn-task-list" } }),
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Écrivez votre note…" }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "bn-editor focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      scheduleAutosave(selectedIdRef.current, titleRef.current, editor.getHTML());
      const txt = editor.getText().trim();
      setWordCount(txt ? txt.split(/\s+/).length : 0);
    },
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes/document?section=all&sort=updated&limit=200&doc_type=note");
      if (!res.ok) throw new Error();
      const { documents, folders: f } = await res.json();
      setNotes((documents ?? []) as Note[]);
      setFolders(f ?? []);
    } catch {
      showToast("error", "Erreur lors du chargement des notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        void handleNewNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (selectedIdRef.current && editor) {
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
          }
          void doSave(selectedIdRef.current, titleRef.current, editor.getHTML());
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush save when tab goes to background
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden" && selectedIdRef.current && editor && saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        void doSave(selectedIdRef.current, titleRef.current, editor.getHTML());
      }
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Close ctx menu on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ctxMenuId && ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtxMenuId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ctxMenuId]);

  // ── Switch note into editor ───────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    // Cancel any pending autosave before switching notes
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveStatus("idle");
    if (!selectedId) {
      editor.commands.setContent("", false);
      setTitleValue("");
      titleRef.current = "";
      setWordCount(0);
      return;
    }
    const note = notes.find((n) => n.id === selectedId);
    if (!note) return;
    // Update refs BEFORE setContent to avoid onUpdate saving to wrong note
    titleRef.current = note.title;
    setTitleValue(note.title);
    editor.commands.setContent(note.content || "", false);
    const txt = editor.getText().trim();
    setWordCount(txt ? txt.split(/\s+/).length : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Autosave ──────────────────────────────────────────────────────────────
  function scheduleAutosave(noteId: string | null, title: string, content: string) {
    if (!noteId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(() => void doSave(noteId, title, content), 800);
  }

  async function doSave(noteId: string, title: string, content: string) {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const res = await fetch(`/api/notes/document/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error();
      const now = new Date().toISOString();
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, title, content, updated_at: now } : n)),
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }

  function handleTitleChange(val: string) {
    setTitleValue(val);
    titleRef.current = val;
    if (editor) scheduleAutosave(selectedIdRef.current, val, editor.getHTML());
  }

  // ── Create note ───────────────────────────────────────────────────────────
  async function handleNewNote() {
    if (creating) return;
    // Cancel pending autosave for current note before switching
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { title: "", content: "", doc_type: "note" };
      if (section.startsWith("folder:")) body.folder_id = section.replace("folder:", "");
      const res = await fetch("/api/notes/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const id = data.document?.id ?? data.id;
      const newNote: Note = {
        id, title: "", content: "",
        is_favorite: false, is_archived: false, is_pinned: false,
        folder_id: (section.startsWith("folder:") ? section.replace("folder:", "") : null),
        tags: [], doc_type: "note",
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(id);
      setSection("all");
      setMobileView("editor");
      setTimeout(() => titleInputRef.current?.focus(), 60);
    } catch {
      showToast("error", "Impossible de créer la note.");
    } finally {
      setCreating(false);
    }
  }

  // ── Select note ───────────────────────────────────────────────────────────
  function selectNote(id: string) {
    setSelectedId(id);
    setMobileView("editor");
    setCtxMenuId(null);
  }

  // ── Toggle favorite ───────────────────────────────────────────────────────
  async function toggleFavorite(note: Note, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !note.is_favorite;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_favorite: next } : n)));
    await fetch(`/api/notes/document/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: next }),
    }).catch(() => showToast("error", "Erreur mise à jour."));
  }

  // ── Toggle pin ────────────────────────────────────────────────────────────
  async function togglePin(note: Note) {
    const next = !note.is_pinned;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_pinned: next } : n)));
    setCtxMenuId(null);
    await fetch(`/api/notes/document/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: next }),
    }).catch(() => showToast("error", "Erreur mise à jour."));
  }

  // ── Archive ───────────────────────────────────────────────────────────────
  async function archiveNote(noteId: string) {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_archived: true } : n)));
    if (selectedId === noteId) { setSelectedId(null); setMobileView("list"); }
    setCtxMenuId(null);
    const res = await fetch(`/api/notes/document/${noteId}`, { method: "DELETE" });
    if (!res.ok) {
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_archived: false } : n)));
      showToast("error", "Erreur lors de l'archivage.");
    } else {
      showToast("success", "Note archivée.");
    }
  }

  // ── Restore ───────────────────────────────────────────────────────────────
  async function restoreNote(noteId: string) {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, is_archived: false } : n)));
    await fetch(`/api/notes/document/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: false }),
    }).catch(() => showToast("error", "Erreur restauration."));
    showToast("success", "Note restaurée.");
  }

  // ── Delete permanently ────────────────────────────────────────────────────
  async function deleteNote(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedId === noteId) { setSelectedId(null); setMobileView("list"); }
    setCtxMenuId(null);
    await fetch(`/api/notes/document/${noteId}?permanent=true`, { method: "DELETE" })
      .catch(() => showToast("error", "Erreur suppression."));
    showToast("success", "Note supprimée définitivement.");
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(type: ToastType, msg: string) { setToast({ type, msg }); }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredNotes = useMemo(() => {
    let r: Note[];
    if (section === "archived") {
      r = notes.filter((n) => n.is_archived);
    } else {
      r = notes.filter((n) => !n.is_archived);
      if (section === "recent") {
        const cut = Date.now() - 7 * 86_400_000;
        r = r.filter((n) => new Date(n.updated_at).getTime() > cut);
      } else if (section === "favorites") {
        r = r.filter((n) => n.is_favorite);
      } else if (section.startsWith("folder:")) {
        const fid = section.replace("folder:", "");
        r = r.filter((n) => n.folder_id === fid);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          stripHtml(n.content).toLowerCase().includes(q),
      );
    }
    return r.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, section, search]);

  const sectionLabel = (() => {
    if (section === "all")       return "Toutes les notes";
    if (section === "recent")    return "Récentes";
    if (section === "favorites") return "Favoris";
    if (section === "archived")  return "Archivées";
    if (section.startsWith("folder:")) {
      const fid = section.replace("folder:", "");
      return folders.find((f) => f.id === fid)?.name ?? "Dossier";
    }
    return "Notes";
  })();

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg          = isDark ? "#05091a" : "#f0f2f5";
  const sidebarBg   = isDark ? "#080f1e" : "#ffffff";
  const listBg      = isDark ? "#07111f" : "#fafafa";
  const editorBg    = isDark ? "#05091a" : "#ffffff";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "rgba(255,255,255,0.88)" : "#111827";
  const textMuted   = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6";
  const toolbarBg   = isDark ? "#09121f" : "#f9fafb";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .bn-editor { color: ${textPrimary}; font-size: 0.9375rem; line-height: 1.7; }
        .bn-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 1.1rem 0 0.4rem; line-height: 1.25; }
        .bn-editor h2 { font-size: 1.2rem; font-weight: 600; margin: 0.9rem 0 0.3rem; line-height: 1.3; }
        .bn-editor h3 { font-size: 1.05rem; font-weight: 600; margin: 0.7rem 0 0.25rem; }
        .bn-editor p  { margin: 0.2rem 0; }
        .bn-editor ul,
        .bn-editor ol { padding-left: 1.4rem; margin: 0.25rem 0; }
        .bn-editor ul { list-style: disc; }
        .bn-editor ol { list-style: decimal; }
        .bn-editor li { margin: 0.1rem 0; }
        .bn-editor blockquote {
          border-left: 3px solid ${GOLD};
          margin: 0.6rem 0; padding: 0.1rem 0 0.1rem 0.9rem;
          opacity: 0.7; font-style: italic;
        }
        .bn-editor code {
          background: rgba(201,165,90,0.1); border-radius: 4px;
          padding: 0.1rem 0.35rem; font-size: 0.84rem; font-family: monospace;
        }
        .bn-editor pre {
          background: ${isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.05)"};
          border-radius: 8px; padding: 0.9rem 1rem; margin: 0.5rem 0;
          overflow-x: auto;
        }
        .bn-editor pre code { background: none; padding: 0; }
        .bn-editor a { color: ${GOLD}; text-decoration: underline; }
        .bn-editor strong { font-weight: 600; }
        .bn-editor em { font-style: italic; }
        .bn-editor u  { text-decoration: underline; }
        .bn-task-list { list-style: none !important; padding-left: 0.1rem !important; }
        .bn-task-list li { display: flex !important; align-items: flex-start; gap: 0.55rem; margin: 0.25rem 0; }
        .bn-task-list li input[type="checkbox"] { accent-color: ${GOLD}; cursor: pointer; margin-top: 4px; }
        .bn-task-list li[data-checked="true"] > div { text-decoration: line-through; opacity: 0.45; }
        .bn-editor p.is-empty:only-child::before {
          content: attr(data-placeholder); float: left; height: 0;
          pointer-events: none; color: ${textMuted};
        }
        .bn-editor:focus-visible { outline: none; }
      `}</style>

      <div className="flex overflow-hidden" style={{ height: "100vh", background: bg }}>

        {/* No Bloc-notes sidebar — section nav is in the list header */}

        {/* ── Note list ───────────────────────────────────────────────── */}
        <div
          className="flex flex-col shrink-0 border-r overflow-hidden"
          style={{ width: 240, background: listBg, borderColor: border }}
        >
          {/* Header: title + new note button */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
            <p className="text-xs font-bold" style={{ color: textPrimary }}>Bloc-notes</p>
            <button
              onClick={() => void handleNewNote()}
              disabled={creating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #a8821f)`,
                opacity: creating ? 0.6 : 1,
              }}
            >
              <Plus size={12} />
              Nouvelle
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex items-center gap-0.5 px-2 pb-2 shrink-0 overflow-x-auto">
            {(
              [
                { id: "all",       label: "Toutes" },
                { id: "recent",    label: "Récentes" },
                { id: "favorites", label: "Favoris" },
                { id: "archived",  label: "Archivées" },
              ] as const
            ).map(({ id, label }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className="shrink-0 px-2 py-1 rounded-md text-[11px] transition-colors"
                  style={{
                    background: active ? "rgba(201,165,90,0.12)" : "transparent",
                    color: active ? GOLD : textMuted,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
            {folders.map((f) => {
              const key = `folder:${f.id}` as Section;
              const active = section === key;
              return (
                <button
                  key={f.id}
                  onClick={() => setSection(key)}
                  className="shrink-0 px-2 py-1 rounded-md text-[11px] transition-colors flex items-center gap-1"
                  style={{
                    background: active ? "rgba(201,165,90,0.12)" : "transparent",
                    color: active ? GOLD : textMuted,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Folder size={10} style={{ color: f.color || GOLD }} />
                  {f.name}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="px-2 pb-2 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: textMuted }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-lg text-[11px] py-1.5 pl-7 pr-3 outline-none"
                style={{
                  background: inputBg, border: `1px solid ${border}`,
                  color: textPrimary,
                }}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: textMuted }}>
                  <Plus size={10} className="rotate-45" />
                </button>
              )}
            </div>
          </div>

          <div className="border-t shrink-0" style={{ borderColor: border }} />

          {/* Notes */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }} />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <FileText size={28} style={{ color: textMuted, opacity: 0.4 }} />
                <p className="text-xs" style={{ color: textMuted }}>
                  {search ? "Aucun résultat" : "Aucune note"}
                </p>
                {!search && (
                  <button onClick={() => void handleNewNote()}
                    className="text-xs mt-1 underline underline-offset-2"
                    style={{ color: GOLD }}>
                    Créer une note
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="relative group/row">
                    <NoteItem
                      note={note}
                      selected={selectedId === note.id}
                      onClick={() => selectNote(note.id)}
                      onStar={(e) => void toggleFavorite(note, e)}
                      isDark={isDark}
                    />
                    {/* Context menu trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCtxMenuId(ctxMenuId === note.id ? null : note.id);
                      }}
                      className="absolute right-1 top-2.5 opacity-0 group-hover/row:opacity-100
                        transition-opacity p-1 rounded"
                      style={{ color: textMuted }}
                    >
                      <MoreVertical size={12} />
                    </button>

                    {/* Context menu */}
                    {ctxMenuId === note.id && (
                      <div
                        ref={ctxRef}
                        className="absolute right-1 top-7 z-50 rounded-lg border shadow-xl py-1"
                        style={{
                          background: isDark ? "#16213e" : "#fff",
                          borderColor: border, minWidth: 170,
                          boxShadow: isDark
                            ? "0 8px 32px rgba(0,0,0,0.5)"
                            : "0 8px 24px rgba(0,0,0,0.12)",
                        }}
                      >
                        {[
                          {
                            label: note.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris",
                            Icon: Star,
                            action: (e: React.MouseEvent) => void toggleFavorite(note, e),
                          },
                          {
                            label: note.is_pinned ? "Désépingler" : "Épingler",
                            Icon: note.is_pinned ? PinOff : Pin,
                            action: () => void togglePin(note),
                          },
                        ].map(({ label, Icon, action }) => (
                          <button
                            key={label}
                            onClick={action}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs
                              transition-colors"
                            style={{
                              color: textPrimary,
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            <Icon size={12} />
                            {label}
                          </button>
                        ))}

                        <div className="my-1 border-t" style={{ borderColor: border }} />

                        {section === "archived" ? (
                          <>
                            <button
                              onClick={() => void restoreNote(note.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs"
                              style={{ color: textPrimary }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <ArchiveRestore size={12} /> Restaurer
                            </button>
                            <button
                              onClick={() => void deleteNote(note.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs"
                              style={{ color: "#ef4444" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <Trash2 size={12} /> Supprimer définitivement
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => void archiveNote(note.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs"
                            style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            <Archive size={12} /> Archiver
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Editor ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          style={{ background: editorBg }}
        >
          {selectedId ? (
            <>
              {/* Editor header */}
              <div
                className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
                style={{ borderColor: border, background: toolbarBg }}
              >
                {/* Mobile back */}
                {/* back button for narrow viewports — Phase 10 */}

                {/* Toolbar */}
                {editor && (
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <ToolbarBtn isDark={isDark} active={editor.isActive("bold")} title="Gras (Ctrl+B)"
                      onClick={() => editor.chain().focus().toggleBold().run()}>
                      <Bold size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("italic")} title="Italique (Ctrl+I)"
                      onClick={() => editor.chain().focus().toggleItalic().run()}>
                      <Italic size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("underline")} title="Souligné (Ctrl+U)"
                      onClick={() => editor.chain().focus().toggleUnderline().run()}>
                      <UnderlineIcon size={13} />
                    </ToolbarBtn>

                    <div className="w-px h-4 mx-1 shrink-0"
                      style={{ background: border }} />

                    <ToolbarBtn isDark={isDark} active={editor.isActive("heading", { level: 1 })} title="Titre 1"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                      <Heading1 size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("heading", { level: 2 })} title="Titre 2"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                      <Heading2 size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("heading", { level: 3 })} title="Titre 3"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                      <Heading3 size={13} />
                    </ToolbarBtn>

                    <div className="w-px h-4 mx-1 shrink-0"
                      style={{ background: border }} />

                    <ToolbarBtn isDark={isDark} active={editor.isActive("bulletList")} title="Liste à puces"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}>
                      <List size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("orderedList")} title="Liste numérotée"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("taskList")} title="Checklist"
                      onClick={() => editor.chain().focus().toggleTaskList().run()}>
                      <CheckSquare size={13} />
                    </ToolbarBtn>

                    <div className="w-px h-4 mx-1 shrink-0"
                      style={{ background: border }} />

                    <ToolbarBtn isDark={isDark} active={editor.isActive("blockquote")} title="Citation"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                      <Quote size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("code")} title="Code inline"
                      onClick={() => editor.chain().focus().toggleCode().run()}>
                      <Code2 size={13} />
                    </ToolbarBtn>
                    <ToolbarBtn isDark={isDark} active={editor.isActive("link")} title="Lien"
                      onClick={() => {
                        const url = window.prompt("URL du lien :");
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                        else editor.chain().focus().unsetLink().run();
                      }}>
                      <Link2 size={13} />
                    </ToolbarBtn>
                  </div>
                )}

                {/* Save status */}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  {saveStatus === "saving" && (
                    <>
                      <div className="w-3 h-3 rounded-full border animate-spin shrink-0"
                        style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }} />
                      <span className="text-[10px]" style={{ color: GOLD }}>Enregistrement…</span>
                    </>
                  )}
                  {saveStatus === "saved" && (
                    <>
                      <Check size={11} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} />
                      <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                        Enregistré
                      </span>
                    </>
                  )}
                  {saveStatus === "error" && (
                    <>
                      <AlertCircle size={11} style={{ color: "#ef4444" }} />
                      <span className="text-[10px]" style={{ color: "#ef4444" }}>Erreur</span>
                    </>
                  )}
                </div>
              </div>

              {/* Title + content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6">
                  {/* Title */}
                  <input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Titre de la note"
                    className="w-full bg-transparent border-none outline-none font-bold mb-4"
                    style={{
                      fontSize: "1.6rem",
                      color: textPrimary,
                      lineHeight: 1.25,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        editor?.commands.focus();
                      }
                      if (e.key === "Tab") {
                        e.preventDefault();
                        editor?.commands.focus("end");
                      }
                    }}
                  />
                  {/* Editor */}
                  <EditorContent editor={editor} />
                </div>
              </div>

              {/* Status bar */}
              <div
                className="flex items-center justify-between px-6 py-1.5 border-t shrink-0"
                style={{ borderColor: border }}
              >
                <span className="text-[10px]" style={{ color: textMuted }}>
                  {wordCount > 0 ? `${wordCount} mot${wordCount > 1 ? "s" : ""}` : ""}
                </span>
                <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db" }}>
                  {(() => {
                    const n = notes.find((n) => n.id === selectedId);
                    return n ? `Modifié ${fmtDate(n.updated_at)}` : "";
                  })()}
                </span>
              </div>
            </>
          ) : (
            /* Empty state — no note selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(201,165,90,0.1)" }}
              >
                <FileText size={28} style={{ color: GOLD }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>
                  Sélectionnez une note
                </p>
                <p className="text-xs" style={{ color: textMuted }}>
                  ou créez-en une nouvelle avec{" "}
                  <kbd className="font-mono text-[10px]">Ctrl+N</kbd>
                </p>
              </div>
              <button
                onClick={() => void handleNewNote()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity mt-2"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, #a8821f)`,
                  boxShadow: "0 3px 12px rgba(201,165,90,0.3)",
                }}
              >
                <Plus size={14} />
                Nouvelle note
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {toast && <Toast key={`${toast.type}-${toast.msg}`} toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
