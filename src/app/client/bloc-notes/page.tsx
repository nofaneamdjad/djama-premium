"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react";
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
  ListOrdered, CheckSquare, Code2, Quote,
  Heading1, Heading2, Heading3, MoreVertical, FileText,
  Pin, PinOff, Check, AlertCircle, X, FolderPlus, Tag,
  Link2 as LinkIcon, User, Briefcase, Unlink,
  Wand2, Sparkles, ChevronLeft,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import Toast, { type ToastData, type ToastType } from "@/components/ui/Toast";

const GOLD = "#c9a55a";
const FOLDER_COLORS = ["#c9a55a", "#a78bfa", "#34d399", "#60a5fa", "#f87171", "#fb923c"];

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
  note_type?: string;
  doc_type?: string;
  linked_entity?: string | null;
  created_at: string;
  updated_at: string;
}

interface NoteFolder  { id: string; name: string; color: string; }
interface EntityItem  { id: string; label: string; sub: string; }
interface LinkedEntity { type: "contact" | "project"; id: string; label: string; }

type Section = "all" | "recent" | "favorites" | "archived" | "checklists" | `folder:${string}`;

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

function checklistStats(html: string): { checked: number; total: number } {
  if (!html.includes('data-type="taskItem"')) return { checked: 0, total: 0 };
  const total   = (html.match(/data-type="taskItem"/g)  ?? []).length;
  const checked = (html.match(/data-checked="true"/g)   ?? []).length;
  return { checked, total };
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "rgba(201,165,90,0.28)", color: "inherit", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
      : part,
  );
}

// ── ToolbarBtn ────────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick, active = false, title, children, isDark, "aria-label": ariaLabel,
}: {
  onClick: () => void; active?: boolean; title?: string;
  children: React.ReactNode; isDark: boolean; "aria-label"?: string;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      aria-label={ariaLabel ?? title}
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
  note, selected, onClick, onStar, isDark, searchQuery = "",
}: {
  note: Note; selected: boolean; onClick: () => void;
  onStar: (e: React.MouseEvent) => void; isDark: boolean; searchQuery?: string;
}) {
  const preview = stripHtml(note.content).slice(0, 90) || "Note vide";
  const tc = isDark ? "rgba(255,255,255,0.88)" : "#111827";
  const tm = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const { checked, total } = checklistStats(note.content);

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
          {/* Title row avec badge épingle */}
          <div className="flex items-center gap-1 mb-0.5">
            {note.is_pinned && (
              <Pin size={9} style={{ color: GOLD, opacity: 0.65, flexShrink: 0 }} />
            )}
            <p className="text-sm font-medium truncate leading-tight"
              style={{ color: selected ? GOLD : tc }}>
              {highlightText(note.title || "Sans titre", searchQuery)}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed line-clamp-2"
            style={{ color: tm }}>
            {highlightText(preview, searchQuery)}
          </p>
          {total > 0 ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                <div style={{
                  width: `${Math.round((checked / total) * 100)}%`,
                  height: "100%",
                  background: checked === total ? "#34d399" : GOLD,
                  transition: "width 0.3s",
                }} />
              </div>
              <span className="text-[10px] shrink-0" style={{ color: checked === total ? "#34d399" : tm }}>
                {checked}/{total}
              </span>
            </div>
          ) : (
            <p className="text-[10px] mt-1" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db" }}>
              {fmtDate(note.updated_at)}
            </p>
          )}
        </div>
        {/* Étoile : toujours visible si favorite, sinon visible au hover */}
        <button
          onClick={onStar}
          className={`${note.is_favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity p-1 shrink-0 mt-0.5 rounded`}
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
  const [wordCount,      setWordCount]      = useState(0);
  const [noteTags,       setNoteTags]       = useState<string[]>([]);
  const [tagInput,       setTagInput]       = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName,  setNewFolderName]  = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderCtxId,    setFolderCtxId]    = useState<string | null>(null);
  const [moveMenuId,     setMoveMenuId]     = useState<string | null>(null);
  const [showLinkPicker,  setShowLinkPicker]  = useState(false);
  const [linkPickerTab,   setLinkPickerTab]   = useState<"contact" | "project">("contact");
  const [entitySearch,    setEntitySearch]    = useState("");
  const [entityList,      setEntityList]      = useState<{ contacts: EntityItem[]; projects: EntityItem[] } | null>(null);
  const [loadingEntities, setLoadingEntities] = useState(false);
  // Phase 8 — Transform
  const [showTransformMenu, setShowTransformMenu] = useState(false);
  // Phase 9 — AI
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiResult,    setAiResult]    = useState<{ action: string; text: string } | null>(null);

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const titleRef      = useRef("");
  const isSavingRef   = useRef(false);
  const searchRef     = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const ctxRef        = useRef<HTMLDivElement>(null);
  const tagInputRef   = useRef<HTMLInputElement>(null);
  const folderCtxRef  = useRef<HTMLDivElement>(null);
  const linkPickerRef    = useRef<HTMLDivElement>(null);
  const transformMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const note = notes.find((n) => n.id === selectedId);
    setNoteTags(note?.tags ?? []);
    setTagInput("");
  }, [selectedId, notes]);

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
      const res = await fetch("/api/notes/document?section=all&sort=updated&limit=100&doc_type=note");
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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        editor?.chain().focus().toggleTaskList().run();
      }
      if (e.key === "Escape") {
        setCtxMenuId(null);
        setFolderCtxId(null);
        setShowLinkPicker(false);
        setEntitySearch("");
        setShowTransformMenu(false);
        setShowAiPanel(false);
        setAiResult(null);
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

  // Close ctx menus on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ctxMenuId && ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtxMenuId(null);
        setMoveMenuId(null);
      }
      if (folderCtxId && folderCtxRef.current && !folderCtxRef.current.contains(e.target as Node)) {
        setFolderCtxId(null);
      }
      if (showLinkPicker && linkPickerRef.current && !linkPickerRef.current.contains(e.target as Node)) {
        setShowLinkPicker(false);
        setEntitySearch("");
      }
      if (showTransformMenu && transformMenuRef.current && !transformMenuRef.current.contains(e.target as Node)) {
        setShowTransformMenu(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ctxMenuId, folderCtxId, showLinkPicker, showTransformMenu]);

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
      editor.commands.setContent("", { emitUpdate: false });
      setTitleValue("");
      titleRef.current = "";
      setWordCount(0);
      setNoteTags([]);
      setTagInput("");
      return;
    }
    const note = notes.find((n) => n.id === selectedId);
    if (!note) return;
    // Update refs BEFORE setContent to avoid onUpdate saving to wrong note
    titleRef.current = note.title;
    setTitleValue(note.title);
    setNoteTags(note.tags ?? []);
    setTagInput("");
    editor.commands.setContent(note.content || "", { emitUpdate: false });
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

  // ── Create checklist ─────────────────────────────────────────────────────
  async function handleNewChecklist() {
    if (creating) return;
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    setCreating(true);
    const defaultContent = [
      '<ul data-type="taskList">',
      '<li data-type="taskItem" data-checked="false"><p>Élément 1</p></li>',
      '<li data-type="taskItem" data-checked="false"><p>Élément 2</p></li>',
      '<li data-type="taskItem" data-checked="false"><p>Élément 3</p></li>',
      '</ul>',
    ].join("");
    try {
      const res = await fetch("/api/notes/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nouvelle checklist", content: defaultContent, doc_type: "note", note_type: "checklist" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const id = data.document?.id ?? data.id;
      const newNote: Note = {
        id, title: "Nouvelle checklist", content: defaultContent,
        is_favorite: false, is_archived: false, is_pinned: false,
        folder_id: null, tags: [], note_type: "checklist", doc_type: "note",
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(id);
      setSection("checklists");
      setMobileView("editor");
      setTimeout(() => titleInputRef.current?.select(), 60);
    } catch {
      showToast("error", "Impossible de créer la checklist.");
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

  // ── Dossiers ──────────────────────────────────────────────────────────────
  async function createFolder() {
    if (!newFolderName.trim() || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/notes/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      });
      if (!res.ok) throw new Error();
      const { folder } = await res.json();
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      setShowFolderModal(false);
      setNewFolderName("");
      setNewFolderColor(FOLDER_COLORS[0]);
      showToast("success", `Dossier "${folder.name}" créé.`);
    } catch {
      showToast("error", "Erreur lors de la création du dossier.");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function deleteFolder(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFolderCtxId(null);
    if (section === `folder:${folderId}`) setSection("all");
    // Notes du dossier → folder_id = NULL via ON DELETE SET NULL côté DB
    setNotes((prev) => prev.map((n) => n.folder_id === folderId ? { ...n, folder_id: null } : n));
    const res = await fetch(`/api/notes/folder/${folderId}`, { method: "DELETE" });
    if (!res.ok) {
      if (folder) setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("error", "Erreur lors de la suppression du dossier.");
    } else {
      showToast("success", "Dossier supprimé.");
    }
  }

  async function moveNote(noteId: string, folderId: string | null) {
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, folder_id: folderId } : n));
    setCtxMenuId(null);
    setMoveMenuId(null);
    await fetch(`/api/notes/document/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    }).catch(() => showToast("error", "Erreur déplacement."));
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  async function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9àâäéèêëîïôùûüç\-_]/g, "").slice(0, 32);
    if (!tag || !selectedId || noteTags.includes(tag)) { setTagInput(""); return; }
    const next = [...noteTags, tag];
    setNoteTags(next);
    setTagInput("");
    setNotes((prev) => prev.map((n) => n.id === selectedId ? { ...n, tags: next } : n));
    await fetch(`/api/notes/document/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    }).catch(() => showToast("error", "Erreur sauvegarde tag."));
  }

  async function removeTag(tag: string) {
    if (!selectedId) return;
    const next = noteTags.filter((t) => t !== tag);
    setNoteTags(next);
    setNotes((prev) => prev.map((n) => n.id === selectedId ? { ...n, tags: next } : n));
    await fetch(`/api/notes/document/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    }).catch(() => showToast("error", "Erreur sauvegarde tag."));
  }

  // ── Transform (Phase 8) ──────────────────────────────────────────────────
  function convertToChecklist() {
    if (!editor || !selectedId) return;
    const lines = editor.getText().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<ul data-type="taskList">${lines.map((l) =>
      `<li data-type="taskItem" data-checked="false"><p>${esc(l)}</p></li>`,
    ).join("")}</ul>`;
    editor.commands.setContent(html, { emitUpdate: false });
    scheduleAutosave(selectedId, titleRef.current, editor.getHTML());
    setShowTransformMenu(false);
    showToast("success", "Contenu converti en checklist.");
  }

  async function convertToDocument() {
    if (!selectedId) return;
    setNotes((prev) => prev.map((n) => n.id === selectedId ? { ...n, doc_type: "document" } : n));
    setShowTransformMenu(false);
    await fetch(`/api/notes/document/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_type: "document" }),
    }).catch(() => showToast("error", "Erreur conversion."));
    showToast("success", "Note convertie en Document.");
  }

  // ── IA légère (Phase 9) ───────────────────────────────────────────────────
  async function runAiAction(action: "summarize" | "improve" | "extract") {
    if (!selectedId || !editor) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: editor.getText() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "IA");
      const { result } = await res.json();
      setAiResult({ action, text: result as string });
    } catch (e) {
      showToast("error", (e as Error).message || "Erreur IA.");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiResult || !editor || !selectedId) return;
    const html = aiResult.text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .split("\n").map((l) => `<p>${l}</p>`).join("");
    editor.commands.setContent(html, { emitUpdate: false });
    scheduleAutosave(selectedId, titleRef.current, editor.getHTML());
    setAiResult(null);
  }

  // ── Liens CRM/Projet ─────────────────────────────────────────────────────
  async function loadEntityList(q = "") {
    setLoadingEntities(true);
    try {
      const res = await fetch(`/api/notes/entities${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntityList(data as { contacts: EntityItem[]; projects: EntityItem[] });
    } catch {
      showToast("error", "Erreur chargement des entités.");
    } finally {
      setLoadingEntities(false);
    }
  }

  async function linkEntity(type: "contact" | "project", id: string, label: string) {
    if (!selectedId) return;
    const payload: LinkedEntity = { type, id, label };
    setNotes((prev) =>
      prev.map((n) => n.id === selectedId ? { ...n, linked_entity: JSON.stringify(payload) } : n),
    );
    setShowLinkPicker(false);
    setEntitySearch("");
    await fetch(`/api/notes/document/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linked_entity: JSON.stringify(payload) }),
    }).catch(() => showToast("error", "Erreur sauvegarde lien."));
  }

  async function unlinkEntity() {
    if (!selectedId) return;
    setNotes((prev) =>
      prev.map((n) => n.id === selectedId ? { ...n, linked_entity: null } : n),
    );
    await fetch(`/api/notes/document/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linked_entity: null }),
    }).catch(() => showToast("error", "Erreur suppression lien."));
  }

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
      } else if (section === "checklists") {
        r = r.filter((n) => n.content.includes('data-type="taskItem"'));
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
    if (section === "all")        return "Toutes les notes";
    if (section === "recent")     return "Récentes";
    if (section === "favorites")  return "Favoris";
    if (section === "archived")   return "Archivées";
    if (section === "checklists") return "Checklists";
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
          className={`flex flex-col shrink-0 border-r overflow-hidden ${mobileView === "editor" ? "hidden md:flex" : "flex"}`}
          style={{ width: 240, background: listBg, borderColor: border }}
        >
          {/* Header: title + creation buttons */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
            <p className="text-xs font-bold" style={{ color: textPrimary }}>Bloc-notes</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => void handleNewChecklist()}
                disabled={creating}
                title="Nouvelle checklist (Ctrl+Shift+L)"
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  color: textMuted,
                  opacity: creating ? 0.6 : 1,
                }}
              >
                <CheckSquare size={13} />
              </button>
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
          </div>

          {/* Section tabs */}
          <div className="flex items-center gap-0.5 px-2 pb-2 shrink-0 overflow-x-auto">
            {(
              [
                { id: "all",        label: "Toutes" },
                { id: "recent",     label: "Récentes" },
                { id: "favorites",  label: "Favoris" },
                { id: "checklists", label: "Checklists" },
                { id: "archived",   label: "Archivées" },
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
                <div key={f.id} className="relative shrink-0">
                  <button
                    onClick={() => setSection(key)}
                    onContextMenu={(e) => { e.preventDefault(); setFolderCtxId(f.id); }}
                    className="px-2 py-1 rounded-md text-[11px] transition-colors flex items-center gap-1 pr-5"
                    style={{
                      background: active ? "rgba(201,165,90,0.12)" : "transparent",
                      color: active ? GOLD : textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Folder size={10} style={{ color: f.color || GOLD }} />
                    {f.name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFolderCtxId(folderCtxId === f.id ? null : f.id); }}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100
                      transition-opacity p-0.5 rounded"
                    style={{ color: textMuted }}
                    title="Options dossier"
                  >
                    <X size={9} />
                  </button>
                  {folderCtxId === f.id && (
                    <div
                      ref={folderCtxRef}
                      className="absolute left-0 top-full mt-1 z-50 rounded-lg border shadow-xl py-1"
                      style={{
                        background: isDark ? "#16213e" : "#fff",
                        borderColor: border, minWidth: 150,
                        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
                      }}
                    >
                      <button
                        onClick={() => void deleteFolder(f.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                        style={{ color: "#ef4444" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <Trash2 size={11} /> Supprimer le dossier
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Bouton nouveau dossier */}
            <button
              onClick={() => setShowFolderModal(true)}
              className="shrink-0 px-2 py-1 rounded-md text-[11px] transition-colors flex items-center gap-1"
              style={{ color: textMuted }}
              title="Nouveau dossier"
            >
              <FolderPlus size={11} />
            </button>
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
                {/* Compteur de résultats */}
                {search.trim() && (
                  <p className="text-[10px] px-1 pb-1 pt-0.5" style={{ color: textMuted }}>
                    {filteredNotes.length} résultat{filteredNotes.length !== 1 ? "s" : ""}
                  </p>
                )}
                {filteredNotes.map((note, idx) => {
                  const prev = filteredNotes[idx - 1];
                  const showDivider = idx > 0 && prev.is_pinned && !note.is_pinned;
                  return (
                  <Fragment key={note.id}>
                    {showDivider && (
                      <div className="mx-1 my-1 border-t" style={{ borderColor: border }} />
                    )}
                  <div className="relative group/row">
                    <NoteItem
                      note={note}
                      selected={selectedId === note.id}
                      onClick={() => selectNote(note.id)}
                      onStar={(e) => void toggleFavorite(note, e)}
                      isDark={isDark}
                      searchQuery={search}
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

                        {/* Déplacer vers */}
                        {folders.length > 0 && (
                          <>
                            <div className="my-1 border-t" style={{ borderColor: border }} />
                            <p className="px-3 py-1 text-[10px] uppercase tracking-wide" style={{ color: textMuted }}>
                              Déplacer vers
                            </p>
                            {note.folder_id !== null && (
                              <button
                                onClick={() => { void moveNote(note.id, null); setCtxMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs"
                                style={{ color: textPrimary }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                              >
                                <Folder size={12} /> Aucun dossier
                              </button>
                            )}
                            {folders.filter(f => f.id !== note.folder_id).map(f => (
                              <button
                                key={f.id}
                                onClick={() => { void moveNote(note.id, f.id); setCtxMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs"
                                style={{ color: textPrimary }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                              >
                                <Folder size={12} style={{ color: f.color }} /> {f.name}
                              </button>
                            ))}
                          </>
                        )}

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
                  </Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Editor ──────────────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
          style={{ background: editorBg }}
        >
          {selectedId ? (
            <>
              {/* Editor header */}
              <div
                className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
                style={{ borderColor: border, background: toolbarBg }}
              >
                {/* Mobile back (Phase 10) */}
                <button
                  className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors"
                  style={{ color: textMuted }}
                  aria-label="Retour à la liste"
                  onClick={() => setMobileView("list")}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <ChevronLeft size={16} />
                </button>

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
                      <LinkIcon size={13} />
                    </ToolbarBtn>

                    <div className="w-px h-4 mx-1 shrink-0" style={{ background: border }} />

                    {/* Transform (Phase 8) */}
                    <div className="relative" ref={transformMenuRef}>
                      <ToolbarBtn
                        isDark={isDark}
                        active={showTransformMenu}
                        title="Transformer"
                        onClick={() => setShowTransformMenu((v) => !v)}
                        aria-label="Transformer la note"
                      >
                        <Wand2 size={13} />
                      </ToolbarBtn>
                      {showTransformMenu && (
                        <div
                          className="absolute left-0 top-full mt-1 z-40 rounded-xl border shadow-xl"
                          style={{
                            background: isDark ? "#16213e" : "#fff",
                            borderColor: border, width: 190,
                            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
                          }}
                        >
                          <button
                            onClick={() => convertToChecklist()}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] rounded-t-xl transition-colors"
                            style={{ color: textPrimary }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <CheckSquare size={12} style={{ color: GOLD }} />
                            Convertir en checklist
                          </button>
                          <button
                            onClick={() => void convertToDocument()}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] rounded-b-xl transition-colors"
                            style={{ color: textPrimary }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <FileText size={12} style={{ color: "#60a5fa" }} />
                            Convertir en Document
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AI actions (Phase 9) */}
                    <ToolbarBtn
                      isDark={isDark}
                      active={showAiPanel}
                      title="Actions IA"
                      onClick={() => { setShowAiPanel((v) => !v); setAiResult(null); }}
                      aria-label="Actions IA"
                    >
                      <Sparkles size={13} />
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

              {/* AI panel (Phase 9) */}
              {showAiPanel && selectedId && (
                <div
                  className="px-4 py-3 border-b shrink-0 flex flex-col gap-2"
                  style={{ background: isDark ? "rgba(201,165,90,0.05)" : "rgba(201,165,90,0.03)", borderColor: border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: GOLD }}>
                      <Sparkles size={11} /> Actions IA
                    </span>
                    <button
                      onClick={() => { setShowAiPanel(false); setAiResult(null); }}
                      className="p-0.5 rounded transition-opacity opacity-50 hover:opacity-100"
                      aria-label="Fermer le panneau IA"
                    >
                      <X size={11} style={{ color: textMuted }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["summarize", "improve", "extract"] as const).map((action) => {
                      const labels = { summarize: "Résumer", improve: "Améliorer", extract: "Extraire tâches" };
                      return (
                        <button
                          key={action}
                          onClick={() => void runAiAction(action)}
                          disabled={aiLoading}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            background: isDark ? "rgba(201,165,90,0.15)" : "rgba(201,165,90,0.1)",
                            color: GOLD,
                            border: `1px solid rgba(201,165,90,0.3)`,
                            opacity: aiLoading ? 0.5 : 1,
                            cursor: aiLoading ? "wait" : "pointer",
                          }}
                        >
                          {labels[action]}
                        </button>
                      );
                    })}
                    {aiLoading && (
                      <div className="flex items-center gap-1" style={{ color: textMuted }}>
                        <div className="w-3 h-3 rounded-full border animate-spin"
                          style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }} />
                        <span className="text-[10px]">Traitement…</span>
                      </div>
                    )}
                  </div>
                  {aiResult && (
                    <div
                      className="rounded-lg px-3 py-2 text-[11px] whitespace-pre-wrap"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        color: textPrimary, border: `1px solid ${border}`, maxHeight: 160, overflowY: "auto",
                      }}
                    >
                      {aiResult.text}
                    </div>
                  )}
                  {aiResult && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => applyAiResult()}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #a8821f)` }}
                      >
                        Appliquer
                      </button>
                      <button
                        onClick={() => setAiResult(null)}
                        className="px-2.5 py-1 rounded-lg text-[11px] transition-opacity opacity-60 hover:opacity-100"
                        style={{ color: textMuted }}
                      >
                        Ignorer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Title + content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6">
                  {/* Title */}
                  <input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const plain = e.clipboardData.getData("text/plain");
                      handleTitleChange((titleValue + plain).slice(0, 255));
                    }}
                    placeholder="Titre de la note"
                    aria-label="Titre de la note"
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
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {noteTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                        style={{
                          background: isDark ? "rgba(201,165,90,0.15)" : "rgba(201,165,90,0.1)",
                          color: GOLD,
                          border: `1px solid rgba(201,165,90,0.3)`,
                        }}
                      >
                        <Tag size={9} />
                        {tag}
                        <button
                          onClick={() => void removeTag(tag)}
                          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          style={{ lineHeight: 1 }}
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={tagInputRef}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          void addTag(tagInput);
                        } else if (e.key === "Backspace" && !tagInput && noteTags.length > 0) {
                          void removeTag(noteTags[noteTags.length - 1]);
                        }
                      }}
                      placeholder={noteTags.length === 0 ? "Ajouter un tag…" : "+"}
                      className="bg-transparent border-none outline-none text-[11px] min-w-[80px]"
                      style={{ color: textMuted }}
                    />
                  </div>

                  {/* Lien CRM/Projet */}
                  {(() => {
                    const note = notes.find((n) => n.id === selectedId);
                    const linked: LinkedEntity | null = (() => {
                      try { return note?.linked_entity ? JSON.parse(note.linked_entity) as LinkedEntity : null; }
                      catch { return null; }
                    })();
                    return (
                      <div className="relative mb-3 flex items-center gap-2 flex-wrap">
                        {linked ? (
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                              borderColor: border, color: textPrimary,
                            }}
                          >
                            {linked.type === "contact"
                              ? <User size={10} style={{ color: "#60a5fa" }} />
                              : <Briefcase size={10} style={{ color: "#a78bfa" }} />}
                            <span>{linked.label}</span>
                            <button
                              onClick={() => void unlinkEntity()}
                              className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <Unlink size={9} />
                            </button>
                          </span>
                        ) : null}

                        <div className="relative">
                          <button
                            onClick={() => {
                              if (!showLinkPicker) {
                                setLinkPickerTab("contact");
                                setEntitySearch("");
                                void loadEntityList();
                              }
                              setShowLinkPicker((v) => !v);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors"
                            style={{
                              background: showLinkPicker
                                ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                                : "transparent",
                              color: textMuted,
                              border: `1px dashed ${border}`,
                            }}
                          >
                            <LinkIcon size={9} />
                            {linked ? "Changer" : "Lier à…"}
                          </button>

                          {showLinkPicker && (
                            <div
                              ref={linkPickerRef}
                              className="absolute left-0 top-full mt-1.5 z-40 rounded-xl border shadow-xl"
                              style={{
                                background: isDark ? "#16213e" : "#fff",
                                borderColor: border, width: 260,
                                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
                              }}
                            >
                              {/* Tabs */}
                              <div className="flex border-b" style={{ borderColor: border }}>
                                {(["contact", "project"] as const).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => { setLinkPickerTab(t); setEntitySearch(""); void loadEntityList(); }}
                                    className="flex-1 py-2 text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                                    style={{
                                      color: linkPickerTab === t ? GOLD : textMuted,
                                      borderBottom: linkPickerTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
                                      fontWeight: linkPickerTab === t ? 600 : 400,
                                    }}
                                  >
                                    {t === "contact" ? <User size={10} /> : <Briefcase size={10} />}
                                    {t === "contact" ? "Contact" : "Projet"}
                                  </button>
                                ))}
                              </div>
                              {/* Search */}
                              <div className="px-2 pt-2 pb-1">
                                <input
                                  autoFocus
                                  value={entitySearch}
                                  onChange={(e) => {
                                    setEntitySearch(e.target.value);
                                    void loadEntityList(e.target.value);
                                  }}
                                  placeholder="Rechercher…"
                                  className="w-full rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                                  style={{ background: inputBg, color: textPrimary, border: `1px solid ${border}` }}
                                />
                              </div>
                              {/* List */}
                              <div className="overflow-y-auto max-h-44 pb-1">
                                {loadingEntities ? (
                                  <p className="text-center py-4 text-[11px]" style={{ color: textMuted }}>Chargement…</p>
                                ) : (() => {
                                  const items = linkPickerTab === "contact"
                                    ? (entityList?.contacts ?? [])
                                    : (entityList?.projects ?? []);
                                  if (items.length === 0) return (
                                    <p className="text-center py-4 text-[11px]" style={{ color: textMuted }}>
                                      Aucun résultat
                                    </p>
                                  );
                                  return items.map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => void linkEntity(linkPickerTab, item.id, item.label)}
                                      className="w-full flex flex-col items-start px-3 py-2 text-left transition-colors"
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                    >
                                      <span className="text-[12px]" style={{ color: textPrimary }}>{item.label}</span>
                                      {item.sub && <span className="text-[10px]" style={{ color: textMuted }}>{item.sub}</span>}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Editor */}
                  <EditorContent editor={editor} />
                </div>
              </div>

              {/* Status bar */}
              <div
                className="flex items-center justify-between px-6 py-1.5 border-t shrink-0"
                style={{ borderColor: border }}
              >
                <div className="flex items-center gap-3">
                  {wordCount > 0 && (
                    <span className="text-[10px]" style={{ color: textMuted }}>
                      {wordCount} mot{wordCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {(() => {
                    const n = notes.find((n) => n.id === selectedId);
                    if (!n) return null;
                    const { checked: ck, total: tot } = checklistStats(n.content);
                    if (tot === 0) return null;
                    const done = ck === tot;
                    return (
                      <span className="text-[10px] flex items-center gap-1"
                        style={{ color: done ? "#34d399" : textMuted }}>
                        <CheckSquare size={10} />
                        {ck}/{tot} tâche{tot > 1 ? "s" : ""}
                        {done && " ✓"}
                      </span>
                    );
                  })()}
                </div>
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

      {/* Modal : nouveau dossier */}
      {showFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowFolderModal(false); setNewFolderName(""); } }}
        >
          <div
            className="w-80 rounded-2xl border p-6 flex flex-col gap-4"
            style={{ background: isDark ? "#16213e" : "#fff", borderColor: border }}
            onKeyDown={(e) => { if (e.key === "Escape") { setShowFolderModal(false); setNewFolderName(""); } }}
          >
            <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Nouveau dossier</h3>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void createFolder(); }}
              placeholder="Nom du dossier"
              className="w-full rounded-lg px-3 py-2 text-sm border bg-transparent outline-none"
              style={{ borderColor: border, color: textPrimary }}
            />
            <div>
              <p className="text-[11px] mb-2" style={{ color: textMuted }}>Couleur</p>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className="w-6 h-6 rounded-full transition-transform"
                    style={{
                      background: c,
                      transform: newFolderColor === c ? "scale(1.25)" : "scale(1)",
                      outline: newFolderColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => { setShowFolderModal(false); setNewFolderName(""); }}
                className="px-4 py-2 text-xs rounded-lg"
                style={{ color: textMuted }}
              >
                Annuler
              </button>
              <button
                onClick={() => void createFolder()}
                disabled={!newFolderName.trim() || creatingFolder}
                className="px-4 py-2 text-xs rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ background: newFolderColor }}
              >
                {creatingFolder ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {toast && <Toast key={`${toast.type}-${toast.msg}`} toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
