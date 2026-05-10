"use client";

/**
 * Notes IA — v4
 * 8 types • dossiers • tags • archive • 9 actions IA
 * templates • versions • export PDF/TXT/MD
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Plus, Search, Trash2, X, Loader2, Star, Pin,
  ChevronDown, Save, Sparkles, Wand2, FileText, ListChecks,
  MessageSquare, Mic, Square, Pause, Play, RotateCcw, ArrowLeft,
  Folder, FolderPlus, Tag, CheckSquare, BookOpen, Users, Lightbulb,
  Code, ClipboardList, Archive, Download, Clock, Brain, RefreshCw,
  Languages, FileSearch, Zap, Check, MoreHorizontal, Hash,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type NoteType =
  | "texte" | "checklist" | "réunion" | "idée"
  | "compte-rendu" | "journal" | "code" | "vocal";

type AiAction =
  | "improve" | "summarize" | "to-tasks" | "correct"
  | "rephrase" | "translate" | "meeting-report" | "extract-actions" | "chat";

type SortBy  = "date" | "alpha" | "type";
type AppView = "list" | "editor";

interface Note {
  id:            string;
  user_id:       string;
  title:         string;
  content:       string;
  category:      string;
  note_type:     NoteType | null;
  folder_id:     string | null;
  tags:          string[] | null;
  is_archived:   boolean | null;
  is_favorite:   boolean | null;
  linked_entity: string | null;
  word_count:    number | null;
  created_at:    string;
  updated_at:    string;
}

interface NoteFolder {
  id:    string;
  name:  string;
  color: string;
}

type VoiceState = "idle" | "recording" | "paused" | "stopped";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const amber = "#f59e0b";
const ease  = [0.16, 1, 0.3, 1] as const;
const CHUNK_MS = 5 * 60 * 1000;

const NOTE_TYPES: {
  value: NoteType; label: string; color: string; bg: string;
  border: string; Icon: React.ElementType
}[] = [
  { value:"texte",        label:"Texte",        color:"#94a3b8", bg:"rgba(148,163,184,0.1)",  border:"rgba(148,163,184,0.2)", Icon:FileText     },
  { value:"checklist",    label:"Checklist",    color:"#4ade80", bg:"rgba(74,222,128,0.1)",   border:"rgba(74,222,128,0.2)",  Icon:CheckSquare  },
  { value:"réunion",      label:"Réunion",      color:"#60a5fa", bg:"rgba(96,165,250,0.1)",   border:"rgba(96,165,250,0.2)",  Icon:Users        },
  { value:"idée",         label:"Idée",         color:"#f59e0b", bg:"rgba(245,158,11,0.1)",   border:"rgba(245,158,11,0.2)",  Icon:Lightbulb    },
  { value:"compte-rendu", label:"Compte-rendu", color:"#a78bfa", bg:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.2)", Icon:ClipboardList},
  { value:"journal",      label:"Journal",      color:"#f472b6", bg:"rgba(244,114,182,0.1)",  border:"rgba(244,114,182,0.2)", Icon:BookOpen     },
  { value:"code",         label:"Code",         color:"#38bdf8", bg:"rgba(56,189,248,0.1)",   border:"rgba(56,189,248,0.2)",  Icon:Code         },
  { value:"vocal",        label:"Vocal",        color:"#fb923c", bg:"rgba(251,146,60,0.1)",   border:"rgba(251,146,60,0.2)",  Icon:Mic          },
];

const AI_ACTIONS: { action: AiAction; label: string; icon: React.ElementType; color: string; replaces: boolean }[] = [
  { action:"improve",         label:"Améliorer",    icon:Wand2,       color:"#a78bfa", replaces:true  },
  { action:"correct",         label:"Corriger",     icon:Check,       color:"#4ade80", replaces:true  },
  { action:"rephrase",        label:"Reformuler",   icon:RefreshCw,   color:"#60a5fa", replaces:true  },
  { action:"summarize",       label:"Résumer",      icon:FileText,    color:"#f59e0b", replaces:false },
  { action:"to-tasks",        label:"→ Tâches",     icon:ListChecks,  color:"#34d399", replaces:false },
  { action:"translate",       label:"Traduire",     icon:Languages,   color:"#38bdf8", replaces:true  },
  { action:"meeting-report",  label:"CR Réunion",   icon:ClipboardList,color:"#f472b6",replaces:false },
  { action:"extract-actions", label:"Extraire",     icon:Zap,         color:"#fb923c", replaces:false },
  { action:"chat",            label:"Chat IA",      icon:MessageSquare,color:"#c9a55a",replaces:false },
];

const TEMPLATES: { label: string; type: NoteType; icon: string; content: string }[] = [
  {
    label:"Réunion", type:"réunion", icon:"👥",
    content:`# Réunion — ${new Date().toLocaleDateString("fr-FR")}

**Participants :**

**Ordre du jour :**
-

**Notes :**


**Décisions prises :**
-

**Actions à suivre :**
- [ ]
- [ ]

**Prochaine réunion :**`,
  },
  {
    label:"Brainstorming", type:"idée", icon:"💡",
    content:`# Brainstorming

**Idée principale :**


**Pistes à explorer :**
-
-
-

**Pour :**
-

**Contre :**
-

**Prochaine action :**`,
  },
  {
    label:"Projet", type:"compte-rendu", icon:"🚀",
    content:`# Projet :

**Objectif :**


**Étapes clés :**
1.
2.
3.

**Ressources nécessaires :**
-

**Budget estimé :**


**Deadline :**


**Risques :**
- `,
  },
  {
    label:"Journal", type:"journal", icon:"📓",
    content:`# Journal — ${new Date().toLocaleDateString("fr-FR")}

**Aujourd'hui :**


**Ce qui s'est bien passé :**
-

**Ce qui peut être amélioré :**
-

**Apprentissages :**


**Demain :**
- [ ] `,
  },
  {
    label:"Business Plan", type:"texte", icon:"📊",
    content:`# Business Plan

## Vision
**Mission :**

**Valeur unique :**

## Problème
Le problème que l'on résout :

## Solution


## Marché cible
**Segment :**

**Taille estimée :**

## Modèle de revenus


## Concurrence


## Objectifs (6 mois)
- [ ]
- [ ] `,
  },
  {
    label:"Notes de cours", type:"texte", icon:"📚",
    content:`# Cours :

**Date :** ${new Date().toLocaleDateString("fr-FR")}
**Formateur :**

## Points clés
-
-
-

## Concepts importants


## Questions à creuser
-

## Résumé


## Prochaines étapes
- [ ] `,
  },
];

const FOLDER_COLORS = ["#a78bfa","#60a5fa","#4ade80","#f59e0b","#f472b6","#38bdf8","#fb923c"];

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const getNoteType = (n: Note): NoteType => {
  if (n.note_type) return n.note_type;
  // Fallback from old category
  const map: Record<string, NoteType> = { réunion:"réunion", idées:"idée", tâches:"checklist", personnel:"journal" };
  return map[n.category] ?? "texte";
};
const getTypeInfo = (t: NoteType) => NOTE_TYPES.find(x => x.value === t) ?? NOTE_TYPES[0];
const countWords = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(iso));
const fmtDateShort = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short"}).format(new Date(iso));

const FAV_KEY = "djama_notes_favorites";
const getLocalFavs = (): Set<string> => {
  try { const d = localStorage.getItem(FAV_KEY); return d ? new Set(JSON.parse(d) as string[]) : new Set(); } catch { return new Set(); }
};

function fmtSec(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h>0 ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function getCheckProgress(content: string) {
  const lines = content.split("\n");
  const total = lines.filter(l=>/^(\s*)-\s*\[[x~\s]\]/.test(l)).length;
  const done  = lines.filter(l=>/^(\s*)-\s*\[x\]/i.test(l)).length;
  return { total, done };
}

/* ═══════════════════════════════════════════════════════════
   CHECKLIST VIEW (tri-state)
═══════════════════════════════════════════════════════════ */
function ChecklistView({ content, onToggle }: { content: string; onToggle: (c: string) => void }) {
  const lines = content.split("\n");
  function cycle(i: number) {
    const nl = [...lines];
    const l  = nl[i];
    if (/^(\s*-\s*)\[ \]/.test(l))      nl[i] = l.replace(/^(\s*-\s*)\[ \]/,"$1[~]");
    else if (/^(\s*-\s*)\[~\]/.test(l)) nl[i] = l.replace(/^(\s*-\s*)\[~\]/,"$1[x]");
    else                                  nl[i] = l.replace(/^(\s*-\s*)\[x\]/i,"$1[ ]");
    onToggle(nl.join("\n"));
  }
  return (
    <div className="space-y-1.5 py-1">
      {lines.map((line,i)=>{
        const mP = /^(\s*)-\s*\[ \]\s*(.*)/.exec(line);
        const mR = /^(\s*)-\s*\[~\]\s*(.*)/.exec(line);
        const mD = /^(\s*)-\s*\[x\]\s*(.*)/i.exec(line);
        const m  = mP??mR??mD;
        if (m) {
          const state = mD?"done":mR?"progress":"pending";
          const text  = m[2]??"";
          const col   = state==="done"?"#4ade80":state==="progress"?"#f59e0b":"rgba(255,255,255,0.3)";
          return (
            <div key={i} onClick={()=>cycle(i)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-white/[0.04]"
              style={{background:state!=="pending"?`${col}10`:"transparent"}}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border" style={{borderColor:col,background:`${col}18`}}>
                {state==="done"&&<Check size={10} style={{color:col}}/>}
                {state==="progress"&&<span className="text-[8px] font-black" style={{color:col}}>~</span>}
              </div>
              <span className={`flex-1 text-sm ${state==="done"?"text-white/30 line-through":state==="progress"?"text-amber-300/80":"text-white/80"}`}>{text}</span>
            </div>
          );
        }
        return line.trim() ? (
          <p key={i} className="px-3 py-0.5 text-sm text-white/60">{line}</p>
        ) : <div key={i} className="h-1"/>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function BlocNotesPage() {

  /* ── Data ── */
  const [notes,   setNotes]   = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Selection / filters ── */
  const [selected,      setSelected]      = useState<Note|null>(null);
  const [filter,        setFilter]        = useState<"all"|"favorites"|"archived"|string>("all");
  const [typeFilter,    setTypeFilter]    = useState<NoteType|"all">("all");
  const [search,        setSearch]        = useState("");
  const [sortBy,        setSortBy]        = useState<SortBy>("date");
  const [favSet,        setFavSet]        = useState<Set<string>>(new Set());

  /* ── Editor state ── */
  const [dTitle,    setDTitle]    = useState("");
  const [dContent,  setDContent]  = useState("");
  const [dType,     setDType]     = useState<NoteType>("texte");
  const [dFolderId, setDFolderId] = useState<string|null>(null);
  const [dTags,     setDTags]     = useState<string[]>([]);
  const [dLinked,   setDLinked]   = useState("");
  const [dTagInput, setDTagInput] = useState("");
  const [isDirty,   setIsDirty]   = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedAgo,  setSavedAgo]  = useState("");
  const [prevSnap,  setPrevSnap]  = useState<string|null>(null); // version before AI

  /* ── UI ── */
  const [view,          setView]          = useState<AppView>("list");
  const [toast,         setToast]         = useState<ToastData|null>(null);
  const [aiPanel,       setAiPanel]       = useState(false);
  const [aiAction,      setAiAction]      = useState<AiAction>("improve");
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiResult,      setAiResult]      = useState("");
  const [chatPrompt,    setChatPrompt]    = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions,  setShowVersions]  = useState(false);
  const [confirmDel,    setConfirmDel]    = useState(false);
  const [folderModal,   setFolderModal]   = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor,setNewFolderColor]= useState("#a78bfa");
  const [exportMenu,    setExportMenu]    = useState(false);

  /* ── Voice ── */
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceSec,   setVoiceSec]   = useState(0);
  const [voiceTxt,   setVoiceTxt]   = useState("");
  const [voiceLoad,  setVoiceLoad]  = useState(false);

  /* ── Refs ── */
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const saveRef      = useRef<(s?: boolean)=>Promise<void>>(async()=>{});
  const debRef       = useRef<ReturnType<typeof setTimeout>|null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval>|null>(null);
  const chunkRef     = useRef<ReturnType<typeof setInterval>|null>(null);
  const mrRef        = useRef<MediaRecorder|null>(null);
  const blobsRef     = useRef<Blob[]>([]);
  const chunkIdxRef  = useRef(0);
  const txRef        = useRef("");
  const voiceSecRef  = useRef(0);

  /* ── Toast ── */
  const showToast = (type: "success"|"error"|"info", msg: string) => setToast({type,msg} as ToastData);

  /* ── Fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [nRes, fRes] = await Promise.all([
      supabase.from("notes").select("*").order("updated_at",{ascending:false}).limit(500),
      supabase.from("note_folders").select("*").order("name"),
    ]);
    if (nRes.data) setNotes(nRes.data as Note[]);
    if (fRes.data) setFolders(fRes.data as NoteFolder[]);
    setFavSet(getLocalFavs());
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll() }, [fetchAll]);

  /* ── Load note into editor ── */
  const openNote = useCallback((n: Note) => {
    setSelected(n);
    setDTitle(n.title);
    setDContent(n.content);
    setDType(getNoteType(n));
    setDFolderId(n.folder_id ?? null);
    setDTags(n.tags ?? []);
    setDLinked(n.linked_entity ?? "");
    setIsDirty(false);
    setAiPanel(false);
    setAiResult("");
    setPrevSnap(null);
    setSavedAgo("");
    setView("editor");
  }, []);

  /* ── New note ── */
  const createNote = useCallback((type: NoteType = "texte", templateContent = "") => {
    setSelected(null);
    setDTitle("");
    setDContent(templateContent);
    setDType(type);
    setDFolderId(null);
    setDTags([]);
    setDLinked("");
    setIsDirty(!!templateContent);
    setAiPanel(false);
    setAiResult("");
    setPrevSnap(null);
    setSavedAgo("");
    setView("editor");
  }, []);

  /* ── Save ── */
  const handleSave = useCallback(async (silent = false) => {
    if (!dTitle.trim() && !dContent.trim()) return;
    setIsSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setIsSaving(false); return; }

    const payload = {
      title:         dTitle.trim() || "Sans titre",
      content:       dContent,
      note_type:     dType,
      category:      dType, // keep for backward compat
      folder_id:     dFolderId,
      tags:          dTags,
      linked_entity: dLinked.trim(),
      word_count:    countWords(dContent),
      updated_at:    new Date().toISOString(),
    };

    let savedNote: Note | null = null;
    if (selected?.id) {
      const { data, error } = await supabase.from("notes").update(payload).eq("id",selected.id).select().single();
      if (error) { showToast("error",`Erreur : ${error.message}`); setIsSaving(false); return; }
      savedNote = data as Note;
      setNotes(p => p.map(n => n.id===selected.id ? savedNote! : n));
    } else {
      const { data, error } = await supabase.from("notes").insert({...payload,user_id:user.id}).select().single();
      if (error) { showToast("error",`Erreur : ${error.message}`); setIsSaving(false); return; }
      savedNote = data as Note;
      setNotes(p => [savedNote!, ...p]);
      setSelected(savedNote);
    }

    setIsSaving(false);
    setIsDirty(false);
    setSavedAgo("il y a quelques secondes");
    if (!silent) showToast("success","Note sauvegardée ✓");
  }, [dTitle, dContent, dType, dFolderId, dTags, dLinked, selected]);

  saveRef.current = handleSave;

  /* ── Auto-save debounce ── */
  useEffect(() => {
    if (!isDirty) return;
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { void saveRef.current(true) }, 2500);
    return () => { if (debRef.current) clearTimeout(debRef.current) };
  }, [isDirty, dTitle, dContent, dType]);

  /* ── Delete ── */
  async function handleDelete() {
    if (!selected?.id) return;
    const { error } = await supabase.from("notes").delete().eq("id",selected.id);
    if (error) { showToast("error",error.message); return; }
    setNotes(p => p.filter(n => n.id!==selected.id));
    setSelected(null);
    setView("list");
    setConfirmDel(false);
    showToast("success","Note supprimée.");
  }

  /* ── Toggle favorite ── */
  function toggleFav(id: string) {
    const s = new Set(favSet);
    if (s.has(id)) s.delete(id); else s.add(id);
    setFavSet(s);
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])) } catch {}
  }

  /* ── Toggle archive ── */
  async function toggleArchive() {
    if (!selected?.id) return;
    const newVal = !(selected.is_archived ?? false);
    await supabase.from("notes").update({is_archived:newVal}).eq("id",selected.id);
    setNotes(p => p.map(n => n.id===selected.id ? {...n,is_archived:newVal} : n));
    setSelected(s => s ? {...s,is_archived:newVal} : s);
    showToast("success", newVal ? "Note archivée." : "Note désarchivée.");
    if (newVal) { setSelected(null); setView("list"); }
  }

  /* ── Toolbar insert ── */
  function insertFormat(before: string, after = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel   = dContent.slice(start, end);
    const repl  = before + sel + after;
    const newContent = dContent.slice(0, start) + repl + dContent.slice(end);
    setDContent(newContent);
    setIsDirty(true);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 10);
  }

  function insertLinePrefix(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const lines = dContent.split("\n");
    const start = ta.selectionStart;
    let charCount = 0, lineIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) { lineIdx = i; break; }
      charCount += lines[i].length + 1;
    }
    lines[lineIdx] = prefix + lines[lineIdx];
    setDContent(lines.join("\n"));
    setIsDirty(true);
  }

  /* ── AI call ── */
  async function callAI(action: AiAction, customPrompt?: string) {
    if (!dContent.trim() && !dTitle.trim()) { showToast("error","Note vide."); return; }
    setAiAction(action);
    setAiLoading(true);
    setAiResult("");
    setAiPanel(true);

    try {
      const res = await fetch("/api/notes/ai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ action, content:dContent, title:dTitle, prompt:customPrompt }),
      });
      const json = await res.json() as { result?: string; error?: string };
      if (!res.ok || json.error) { showToast("error", json.error ?? "Erreur IA."); setAiLoading(false); return; }
      setAiResult(json.result ?? "");
    } catch { showToast("error","Erreur réseau."); }
    setAiLoading(false);
  }

  function applyAiResult() {
    const ai = AI_ACTIONS.find(a => a.action === aiAction);
    if (ai?.replaces) {
      setPrevSnap(dContent);
      setDContent(aiResult);
    } else {
      setDContent(c => `${c}\n\n---\n${aiResult}`);
    }
    setIsDirty(true);
    setAiPanel(false);
    setAiResult("");
    showToast("success","Résultat IA appliqué ✓");
  }

  /* ── Create folder ── */
  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("note_folders")
      .insert({ user_id:user.id, name:newFolderName.trim(), color:newFolderColor })
      .select().single();
    if (error) { showToast("error",error.message); return; }
    setFolders(f => [...f, data as NoteFolder]);
    setFolderModal(false);
    setNewFolderName("");
    showToast("success","Dossier créé.");
  }

  /* ── Export ── */
  function exportTXT() {
    const blob = new Blob([`${dTitle}\n${"=".repeat(dTitle.length)}\n\n${dContent}`],{type:"text/plain;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${dTitle||"note"}.txt`; a.click();
    showToast("success","Export TXT ✓");
  }

  function exportMarkdown() {
    const blob = new Blob([`# ${dTitle}\n\n${dContent}`],{type:"text/markdown;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${dTitle||"note"}.md`; a.click();
    showToast("success","Export Markdown ✓");
  }

  async function exportPDF() {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit:"mm", format:"a4" });
      const W = doc.internal.pageSize.getWidth() - 40;
      doc.setFontSize(18); doc.setFont("helvetica","bold");
      doc.text(dTitle || "Note", 20, 22);
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(150);
      doc.text(new Date().toLocaleDateString("fr-FR"), 20, 30);
      doc.setTextColor(0); doc.setFontSize(11);
      const lines = doc.splitTextToSize(dContent, W);
      doc.text(lines, 20, 40);
      doc.save(`${dTitle||"note"}.pdf`);
      showToast("success","Export PDF ✓");
    } catch { showToast("error","Erreur PDF — réessayez."); }
  }

  /* ── Voice recording ── */
  async function startVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mime   = ["audio/webm","audio/ogg","audio/mp4"].find(m=>MediaRecorder.isTypeSupported(m));
      const mr     = new MediaRecorder(stream, mime?{mimeType:mime}:undefined);
      mrRef.current = mr; blobsRef.current = []; chunkIdxRef.current = 0;
      mr.ondataavailable = (e) => { if (e.data.size>0) blobsRef.current.push(e.data) };
      mr.start(1000);
      setVoiceState("recording"); setVoiceSec(0); voiceSecRef.current = 0;
      timerRef.current = setInterval(()=>{ voiceSecRef.current++; setVoiceSec(voiceSecRef.current) },1000);
      chunkRef.current = setInterval(()=>{ if(blobsRef.current.length) flushChunk() }, CHUNK_MS);
    } catch { showToast("error","Accès micro refusé.") }
  }

  const flushChunk = useCallback(()=>{
    const blobs = [...blobsRef.current]; blobsRef.current=[];
    if (blobs.length) void transcribeBlob(new Blob(blobs,{type:blobs[0].type}), chunkIdxRef.current++);
  },[]);

  const transcribeBlob = useCallback(async(blob: Blob, idx: number)=>{
    setVoiceLoad(true);
    const fd = new FormData();
    const ext = blob.type.includes("ogg")?"ogg":blob.type.includes("mp4")?"mp4":"webm";
    fd.append("audio", new File([blob],`chunk-${idx}.${ext}`,{type:blob.type}));
    const res  = await fetch("/api/transcribe",{method:"POST",body:fd});
    const data = await res.json() as {text?:string;error?:string};
    if (data.text) {
      const full = txRef.current ? `${txRef.current} ${data.text}` : data.text;
      txRef.current = full;
      setVoiceTxt(full);
    }
    setVoiceLoad(false);
  },[]);

  function pauseVoice()  { mrRef.current?.pause();  if(timerRef.current) clearInterval(timerRef.current); setVoiceState("paused")  }
  function resumeVoice() { mrRef.current?.resume(); timerRef.current=setInterval(()=>{voiceSecRef.current++;setVoiceSec(voiceSecRef.current)},1000); setVoiceState("recording") }
  function stopVoice()   {
    mrRef.current?.stop();
    if(timerRef.current) clearInterval(timerRef.current);
    if(chunkRef.current) clearInterval(chunkRef.current);
    const blobs = [...blobsRef.current]; blobsRef.current=[];
    if(blobs.length) void transcribeBlob(new Blob(blobs,{type:blobs[0].type}), chunkIdxRef.current);
    mrRef.current?.stream?.getTracks().forEach(t=>t.stop());
    setVoiceState("stopped");
  }
  function useVoiceText()  { setDContent(c=>c?`${c}\n\n${voiceTxt}`:voiceTxt); setIsDirty(true); setVoiceState("idle"); setVoiceTxt(""); txRef.current=""; }
  function discardVoice() { setVoiceState("idle"); setVoiceTxt(""); txRef.current="" }

  /* ── Filtered + sorted notes ── */
  const displayNotes = useMemo(() => {
    let ns = notes.filter(n => {
      const archived = n.is_archived ?? false;
      if (filter === "all")      return !archived;
      if (filter === "favorites") return !archived && favSet.has(n.id);
      if (filter === "archived")  return archived;
      return n.folder_id === filter && !archived;
    });
    if (typeFilter !== "all") ns = ns.filter(n => getNoteType(n) === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      ns = ns.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    ns.sort((a,b) => {
      if (sortBy==="alpha") return a.title.localeCompare(b.title);
      if (sortBy==="type")  return getNoteType(a).localeCompare(getNoteType(b));
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return ns;
  }, [notes, filter, typeFilter, search, sortBy, favSet]);

  const counts = useMemo(()=>({
    all:      notes.filter(n=>!(n.is_archived??false)).length,
    favs:     notes.filter(n=>!(n.is_archived??false)&&favSet.has(n.id)).length,
    archived: notes.filter(n=>n.is_archived??false).length,
  }),[notes,favSet]);

  const currentTypeInfo = getTypeInfo(dType);
  const wordCnt = countWords(dContent);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#080a0f] overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0d14] lg:flex">
        <div className="p-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`${amber}18`,border:`1px solid ${amber}30`}}>
              <StickyNote size={15} style={{color:amber}}/>
            </div>
            <span className="text-sm font-extrabold text-white">Notes IA</span>
          </div>

          {/* Filters */}
          <div className="space-y-0.5 mb-4">
            {[
              { key:"all",       label:"Toutes",   count:counts.all,      icon:"📝" },
              { key:"favorites", label:"Favoris",  count:counts.favs,     icon:"⭐" },
              { key:"archived",  label:"Archives", count:counts.archived, icon:"📦" },
            ].map(f=>(
              <button key={f.key} onClick={()=>setFilter(f.key)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${filter===f.key?"text-white bg-white/[0.07]":"text-white/40 hover:text-white/60 hover:bg-white/[0.03]"}`}>
                <span>{f.icon}</span>
                <span className="flex-1 text-left">{f.label}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Folders */}
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Dossiers</span>
            <button onClick={()=>setFolderModal(true)} className="text-white/25 transition hover:text-white/60"><FolderPlus size={13}/></button>
          </div>
          <div className="space-y-0.5 mb-4">
            {folders.map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${filter===f.id?"text-white bg-white/[0.07]":"text-white/40 hover:text-white/60"}`}>
                <div className="h-2 w-2 rounded-full" style={{background:f.color}}/>
                <span className="flex-1 truncate text-left">{f.name}</span>
              </button>
            ))}
            {folders.length===0&&<p className="px-3 text-[0.65rem] text-white/20">Aucun dossier</p>}
          </div>

          <button onClick={()=>{createNote("texte")}}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
            style={{background:`linear-gradient(135deg, ${amber}, #d97706)`,boxShadow:`0 4px 16px ${amber}30`}}>
            <Plus size={13}/> Nouvelle note
          </button>
        </div>
      </div>

      {/* ── LIST PANEL ── */}
      <div className={`flex flex-col border-r border-white/[0.06] bg-[#0c0e16] ${view==="editor"&&selected?"hidden lg:flex":""} w-full lg:w-80 shrink-0`}>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl lg:hidden" style={{background:`${amber}18`,border:`1px solid ${amber}30`}}>
            <StickyNote size={14} style={{color:amber}}/>
          </div>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-[rgba(245,158,11,0.3)]"/>
          </div>
          <button onClick={()=>{createNote("texte")}} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/[0.06]" style={{color:amber}}>
            <Plus size={16}/>
          </button>
          <button onClick={()=>setShowTemplates(true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/[0.06] hover:text-white/60" title="Templates">
            <Hash size={14}/>
          </button>
        </div>

        {/* Sort + type filter */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as SortBy)}
            className="flex-1 rounded-lg border border-white/8 bg-transparent py-1 pl-2 pr-1 text-[0.65rem] text-white/50 outline-none">
            <option value="date">Récentes</option>
            <option value="alpha">A–Z</option>
            <option value="type">Type</option>
          </select>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as NoteType|"all")}
            className="flex-1 rounded-lg border border-white/8 bg-transparent py-1 pl-2 pr-1 text-[0.65rem] text-white/50 outline-none">
            <option value="all">Tous types</option>
            {NOTE_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-white/20"/></div>
          ) : displayNotes.length===0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
              <StickyNote size={28} className="text-white/15"/>
              <p className="text-sm font-bold text-white/30">{search ? "Aucun résultat" : "Aucune note"}</p>
              <button onClick={()=>createNote("texte")} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/50 transition hover:text-white/70">
                + Créer une note
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayNotes.map(n=>{
                const ti = getTypeInfo(getNoteType(n));
                const isFav = favSet.has(n.id);
                const tags = n.tags ?? [];
                const {total,done} = getCheckProgress(n.content);
                return (
                  <motion.div key={n.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    onClick={()=>openNote(n)}
                    className={`cursor-pointer border-b border-white/[0.05] px-4 py-3.5 transition hover:bg-white/[0.04] ${selected?.id===n.id?"bg-white/[0.06]":""}`}>
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="flex-1 truncate text-sm font-bold text-white/90">{n.title||"Sans titre"}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={e=>{e.stopPropagation();toggleFav(n.id)}} className={`transition ${isFav?"text-amber-400":"text-white/15 hover:text-white/50"}`}>
                          <Star size={11} className={isFav?"fill-amber-400":""}/>
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold" style={{color:ti.color,background:ti.bg,border:`1px solid ${ti.border}`}}>
                        <ti.Icon size={9}/>
                        {ti.label}
                      </span>
                      {getNoteType(n)==="checklist"&&total>0&&(
                        <span className="text-[0.6rem] text-white/30">{done}/{total}</span>
                      )}
                      {tags.slice(0,2).map(t=>(
                        <span key={t} className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.6rem] text-white/35">#{t}</span>
                      ))}
                    </div>
                    <p className="mb-1 line-clamp-2 text-xs text-white/35">{n.content.replace(/^#+\s/gm,"").replace(/\[[\sx~]\]\s/g,"").slice(0,120)}</p>
                    <p className="text-[0.6rem] text-white/20">{fmtDateShort(n.updated_at)}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── EDITOR PANEL ── */}
      <div className={`flex flex-1 flex-col overflow-hidden ${view==="list"&&!selected?"hidden lg:flex":""}`}>

        {/* Back button (mobile) */}
        {view==="editor"&&(
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0c0e16] px-4 py-2.5 lg:hidden">
            <button onClick={()=>{setView("list");setSelected(null)}} className="flex items-center gap-1.5 text-xs font-bold text-white/50 transition hover:text-white/80">
              <ArrowLeft size={14}/> Notes
            </button>
          </div>
        )}

        {(!selected && view==="list") ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.07)]">
              <StickyNote size={36} style={{color:amber}}/>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white/80">Capturez vos idées</p>
              <p className="mt-1.5 text-sm text-white/30">Créez une note ou sélectionnez-en une</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {NOTE_TYPES.slice(0,4).map(t=>(
                <button key={t.value} onClick={()=>createNote(t.value)}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition hover:opacity-80"
                  style={{color:t.color,borderColor:`${t.color}30`,background:`${t.color}10`}}>
                  <t.Icon size={12}/>{t.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0c13]">

            {/* Editor top bar */}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0b0d14] px-5 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {NOTE_TYPES.map(t=>(
                  <button key={t.value} onClick={()=>{setDType(t.value);setIsDirty(true)}}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[0.65rem] font-bold transition ${dType===t.value?"text-white":"text-white/30 hover:text-white/60"}`}
                    style={dType===t.value?{background:t.bg,color:t.color,border:`1px solid ${t.border}`}:{}}>
                    <t.Icon size={11}/>{t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {prevSnap&&(
                  <button onClick={()=>{setDContent(prevSnap);setPrevSnap(null);setIsDirty(true);showToast("success","Version précédente restaurée.");}}
                    className="flex items-center gap-1 rounded-xl border border-amber-500/25 bg-amber-500/8 px-2.5 py-1.5 text-[0.65rem] font-bold text-amber-400 transition hover:bg-amber-500/15"
                    title="Annuler l'IA">
                    <RotateCcw size={11}/> Annuler IA
                  </button>
                )}
                <div className="relative">
                  <button onClick={()=>setExportMenu(v=>!v)} className="flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-[0.65rem] font-bold text-white/40 transition hover:text-white/70">
                    <Download size={11}/> Export
                  </button>
                  <AnimatePresence>
                    {exportMenu&&(
                      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                        className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#0f1117] shadow-xl">
                        {[{label:"PDF",fn:exportPDF},{label:"Markdown (.md)",fn:exportMarkdown},{label:"Texte (.txt)",fn:exportTXT}].map(opt=>(
                          <button key={opt.label} onClick={()=>{void opt.fn();setExportMenu(false)}}
                            className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white/90">
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={()=>toggleArchive()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:text-white/70"
                  title={selected?.is_archived?"Désarchiver":"Archiver"}>
                  <Archive size={13}/>
                </button>
                <button onClick={()=>setConfirmDel(true)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/30 transition hover:border-red-500/30 hover:text-red-400">
                  <Trash2 size={13}/>
                </button>
                <button onClick={()=>void handleSave()} disabled={isSaving||!isDirty}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.65rem] font-extrabold text-[#080a0f] transition hover:opacity-90 disabled:opacity-40"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                  {isSaving?<Loader2 size={11} className="animate-spin"/>:<Save size={11}/>}
                  {isSaving?"Enreg…":"Sauver"}
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="border-b border-white/[0.04] px-5 py-3">
              <input value={dTitle} onChange={e=>{setDTitle(e.target.value);setIsDirty(true)}}
                placeholder="Titre de la note…"
                className="w-full bg-transparent text-xl font-extrabold text-white outline-none placeholder:text-white/15"/>
              {/* Tags + folder row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {dTags.map(t=>(
                  <span key={t} onClick={()=>{setDTags(p=>p.filter(x=>x!==t));setIsDirty(true)}}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.65rem] text-white/50 transition hover:bg-red-500/15 hover:text-red-400">
                    #{t}<X size={9}/>
                  </span>
                ))}
                <input value={dTagInput} onChange={e=>setDTagInput(e.target.value)}
                  onKeyDown={e=>{if((e.key==="Enter"||e.key===",")&&dTagInput.trim()){e.preventDefault();const t=dTagInput.trim().toLowerCase().replace(/^#/,"");if(!dTags.includes(t)){setDTags(p=>[...p,t]);setIsDirty(true);}setDTagInput("");}}}
                  placeholder="+ tag"
                  className="w-16 bg-transparent text-[0.65rem] text-white/40 outline-none placeholder:text-white/20"/>
                {dFolderId&&(
                  <span className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[0.65rem] text-white/30">
                    <Folder size={9}/>{folders.find(f=>f.id===dFolderId)?.name}
                  </span>
                )}
                {folders.length>0&&(
                  <select value={dFolderId??""} onChange={e=>{setDFolderId(e.target.value||null);setIsDirty(true)}}
                    className="rounded-full border border-white/10 bg-transparent px-2 py-0.5 text-[0.65rem] text-white/30 outline-none">
                    <option value="">📂 Dossier</option>
                    {folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
                {savedAgo&&<span className="text-[0.6rem] text-white/20">Sauvegardé {savedAgo}</span>}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/[0.04] bg-[#0b0d14] px-4 py-1.5 scrollbar-hide">
              {[
                { label:"H1",  fn:()=>insertLinePrefix("# ")      },
                { label:"H2",  fn:()=>insertLinePrefix("## ")     },
                { label:"H3",  fn:()=>insertLinePrefix("### ")    },
                { label:"B",   fn:()=>insertFormat("**","**")     },
                { label:"I",   fn:()=>insertFormat("*","*")       },
                { label:"`",   fn:()=>insertFormat("`","`")       },
                { label:"```", fn:()=>insertFormat("\n```\n","\n```\n") },
                { label:"—",   fn:()=>insertLinePrefix("")        },
                { label:"• ",  fn:()=>insertLinePrefix("- ")      },
                { label:"☑",   fn:()=>insertLinePrefix("- [ ] ")  },
                { label:"›",   fn:()=>insertLinePrefix("> ")      },
                { label:"🔗",  fn:()=>insertFormat("[","](url)")  },
                { label:"📊",  fn:()=>insertFormat("\n| Col 1 | Col 2 |\n| ----- | ----- |\n| ", " | |\n") },
                { label:"---", fn:()=>setDContent(c=>c+"\n\n---\n\n") },
              ].map((b,i)=>(
                <button key={i} onClick={b.fn} className={`shrink-0 rounded-lg px-2 py-1.5 text-[0.65rem] font-bold text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 ${b.label==="B"?"font-extrabold":""}`}>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex flex-1 overflow-hidden">

              {/* Left: Editor / Checklist view */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {dType==="checklist" ? (
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {getCheckProgress(dContent).total > 0 ? (
                      <>
                        <div className="mb-3">
                          <div className="mb-1 flex justify-between text-[0.6rem] text-white/30">
                            <span>Progression</span>
                            <span>{getCheckProgress(dContent).done}/{getCheckProgress(dContent).total}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-green-400" style={{width:`${getCheckProgress(dContent).total>0?Math.round((getCheckProgress(dContent).done/getCheckProgress(dContent).total)*100):0}%`}}/>
                          </div>
                        </div>
                        <ChecklistView content={dContent} onToggle={c=>{setDContent(c);setIsDirty(true)}}/>
                      </>
                    ) : (
                      <textarea ref={textareaRef} value={dContent} onChange={e=>{setDContent(e.target.value);setIsDirty(true)}}
                        placeholder="- [ ] Tâche 1&#10;- [ ] Tâche 2&#10;- [ ] Tâche 3"
                        className="h-full w-full resize-none bg-transparent text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20"/>
                    )}
                  </div>
                ) : (
                  <textarea ref={textareaRef} value={dContent} onChange={e=>{setDContent(e.target.value);setIsDirty(true)}}
                    placeholder={dType==="code" ? "// Votre code ici…" : dType==="vocal" ? "Transcription vocale…" : "Commencez à écrire…"}
                    className={`flex-1 resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20 ${dType==="code"?"font-mono text-cyan-300/80":""}`}/>
                )}

                {/* Footer bar */}
                <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#0b0d14] px-5 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] text-white/20">{wordCnt} mot{wordCnt!==1?"s":""}</span>
                    <span className="text-[0.6rem] text-white/20">{dContent.length} car.</span>
                    {isDirty&&<span className="text-[0.6rem] text-amber-400/60">● Non sauvegardé</span>}
                  </div>
                  {/* Voice button */}
                  <div className="flex items-center gap-2">
                    {voiceState==="idle" ? (
                      <button onClick={startVoice} className="flex items-center gap-1.5 rounded-xl border border-[rgba(251,146,60,0.25)] bg-[rgba(251,146,60,0.08)] px-3 py-1.5 text-[0.65rem] font-bold text-orange-400 transition hover:bg-[rgba(251,146,60,0.15)]">
                        <Mic size={11}/> Note vocale
                      </button>
                    ):(
                      <div className="flex items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/8 px-3 py-1.5">
                        <span className="text-[0.65rem] font-bold text-orange-400">{fmtSec(voiceSec)}</span>
                        {voiceState==="recording"?<button onClick={pauseVoice}><Pause size={11} className="text-orange-400"/></button>:<button onClick={resumeVoice}><Play size={11} className="text-orange-400"/></button>}
                        <button onClick={stopVoice}><Square size={11} className="text-red-400"/></button>
                        {voiceLoad&&<Loader2 size={11} className="animate-spin text-orange-400"/>}
                        {voiceTxt&&voiceState==="stopped"&&(
                          <><button onClick={useVoiceText} className="text-[0.65rem] font-bold text-green-400">Utiliser</button>
                          <button onClick={discardVoice} className="text-[0.65rem] text-white/30">✕</button></>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked entity */}
                <div className="border-t border-white/[0.04] px-5 py-2">
                  <input value={dLinked} onChange={e=>{setDLinked(e.target.value);setIsDirty(true)}}
                    placeholder="🔗 Lié à : client, projet, contrat… (ex: Client: Ali / Projet: DJAMA)"
                    className="w-full bg-transparent text-[0.65rem] text-white/30 outline-none placeholder:text-white/15"/>
                </div>
              </div>

              {/* Right: AI Panel */}
              <AnimatePresence>
                {aiPanel&&(
                  <motion.div initial={{width:0,opacity:0}} animate={{width:320,opacity:1}} exit={{width:0,opacity:0}}
                    transition={{duration:0.3,ease}} className="overflow-hidden border-l border-white/[0.06] bg-[#0b0d14]"
                    style={{minWidth:0}}>
                    <div className="flex h-full w-80 flex-col p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2"><Brain size={14} style={{color:amber}}/><span className="text-xs font-extrabold text-white">IA Notes</span></div>
                        <button onClick={()=>{setAiPanel(false);setAiResult("")}} className="text-white/30 hover:text-white/70"><X size={14}/></button>
                      </div>

                      {/* Chat input for "chat" action */}
                      {aiAction==="chat"&&(
                        <div className="mb-3">
                          <textarea value={chatPrompt} onChange={e=>setChatPrompt(e.target.value)}
                            placeholder="Instruction : résume, corrige, traduis, génère…"
                            rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(245,158,11,0.3)]"/>
                          <button onClick={()=>void callAI("chat",chatPrompt)} disabled={aiLoading||!chatPrompt.trim()}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-[#080a0f] disabled:opacity-40"
                            style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                            {aiLoading?<Loader2 size={12} className="animate-spin"/>:<MessageSquare size={12}/>} Envoyer
                          </button>
                        </div>
                      )}

                      {aiLoading&&(
                        <div className="flex flex-1 flex-col items-center justify-center gap-3">
                          <Loader2 size={22} className="animate-spin" style={{color:amber}}/>
                          <p className="text-xs text-white/40">IA en cours…</p>
                        </div>
                      )}

                      {!aiLoading&&aiResult&&(
                        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                          <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                            <pre className="whitespace-pre-wrap text-[0.7rem] leading-relaxed text-white/75">{aiResult}</pre>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={applyAiResult} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold text-[#080a0f]" style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                              <Check size={12}/> Appliquer
                            </button>
                            <button onClick={()=>{setAiResult("");setChatPrompt("")}} className="flex flex-1 items-center justify-center rounded-xl border border-white/10 py-2 text-xs font-bold text-white/50">
                              Écarter
                            </button>
                          </div>
                        </div>
                      )}

                      {!aiLoading&&!aiResult&&aiAction!=="chat"&&(
                        <div className="flex flex-1 flex-col items-center justify-center gap-2">
                          <Sparkles size={20} className="text-white/15"/>
                          <p className="text-xs text-white/25 text-center">Résultat IA ici</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Actions row */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.05] bg-[#0b0d14] px-5 py-2.5 scrollbar-hide">
              {AI_ACTIONS.map(a=>(
                <button key={a.action}
                  onClick={()=>{
                    if(a.action==="chat"){setAiAction("chat");setAiPanel(true);setAiResult("");}
                    else void callAI(a.action);
                  }}
                  disabled={aiLoading}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.65rem] font-bold transition hover:opacity-80 disabled:opacity-30"
                  style={{color:a.color,borderColor:`${a.color}30`,background:`${a.color}12`}}>
                  <a.icon size={11}/>{a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: TEMPLATES ── */}
      <AnimatePresence>
        {showTemplates&&(
          <>
            <motion.div key="tb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={()=>setShowTemplates(false)}/>
            <motion.div key="td" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-2xl -translate-y-1/2 rounded-[1.75rem] border border-white/10 bg-[#0c0e16] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">Templates</h2>
                <button onClick={()=>setShowTemplates(false)} className="text-white/30 hover:text-white/70"><X size={15}/></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map(t=>(
                  <button key={t.label} onClick={()=>{createNote(t.type, t.content);setShowTemplates(false);}}
                    className="flex flex-col items-start gap-2 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.06]">
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-sm font-extrabold text-white">{t.label}</span>
                    <span className="text-[0.65rem] text-white/35 line-clamp-2">{t.content.slice(0,80)}…</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL: NOUVEAU DOSSIER ── */}
      <AnimatePresence>
        {folderModal&&(
          <>
            <motion.div key="fb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={()=>setFolderModal(false)}/>
            <motion.div key="fd" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-[1.75rem] border border-white/10 bg-[#0c0e16] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">Nouveau dossier</h2>
                <button onClick={()=>setFolderModal(false)} className="text-white/30 hover:text-white/70"><X size={14}/></button>
              </div>
              <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&void handleCreateFolder()}
                placeholder="Nom du dossier"
                className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[rgba(245,158,11,0.35)]"/>
              <div className="mb-4 flex flex-wrap gap-2">
                {FOLDER_COLORS.map(c=>(
                  <button key={c} onClick={()=>setNewFolderColor(c)}
                    className="h-7 w-7 rounded-full transition hover:scale-110" style={{background:c,outline:newFolderColor===c?"2px solid white":"none",outlineOffset:"2px"}}/>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setFolderModal(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50">Annuler</button>
                <button onClick={handleCreateFolder} disabled={!newFolderName.trim()}
                  className="flex-1 rounded-xl py-2.5 text-sm font-extrabold text-[#080a0f] disabled:opacity-40"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>Créer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm delete ── */}
      <AnimatePresence>
        {confirmDel&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{scale:0.93,y:16,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,opacity:0}} transition={{duration:0.3,ease}}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10"><Trash2 size={18} className="text-red-400"/></div>
              <h3 className="text-base font-extrabold text-white">Supprimer cette note ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={()=>setConfirmDel(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60">Annuler</button>
                <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );
}
