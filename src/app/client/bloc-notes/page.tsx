"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, Plus, Search, Trash2, X, Loader2, Star,
  Save, Sparkles, Wand2, FileText, ListChecks,
  MessageSquare, Mic, Square, Pause, Play, RotateCcw, ArrowLeft,
  Folder, FolderPlus, CheckSquare, BookOpen, Users, Lightbulb,
  Code, ClipboardList, Archive, Download, Brain, RefreshCw,
  Languages, Zap, Check, Hash, BarChart2,
  Book, Pencil, Eraser, ChevronLeft, ChevronRight,
  Undo2, AlignLeft, LayoutGrid, CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NotebookCanvas, {
  type NbStroke, type NbTool, type NbPageStyle,
} from "@/components/NotebookCanvas";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ── Types ─────────────────────────────────────────── */
type NoteType =
  | "texte" | "checklist" | "réunion" | "idée"
  | "compte-rendu" | "journal" | "code" | "vocal";

type AiAction =
  | "improve" | "summarize" | "to-tasks" | "correct"
  | "rephrase" | "translate" | "meeting-report" | "extract-actions" | "chat";

type SortBy  = "date" | "alpha" | "type";
type Section = "all" | "favorites" | "vocal" | "checklist" | "archived" | `folder:${string}`;

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

interface NoteFolder { id: string; name: string; color: string; }
interface Notebook {
  id: string; user_id: string; name: string;
  cover_id: string; page_style: NbPageStyle;
  created_at: string; updated_at: string;
}
interface NotebookPage {
  id: string; notebook_id: string; user_id: string;
  page_number: number; strokes: NbStroke[];
  created_at: string; updated_at: string;
}

type VoiceState = "idle" | "recording" | "paused" | "stopped";

/* ── Constants ─────────────────────────────────────── */
const amber   = "#f59e0b";
const ease    = [0.16, 1, 0.3, 1] as const;
const CHUNK_MS = 5 * 60 * 1000;

const NOTE_TYPES: {
  value: NoteType; label: string; color: string; bg: string;
  border: string; Icon: React.ElementType
}[] = [
  { value:"texte",        label:"Texte",        color:"#94a3b8", bg:"rgba(148,163,184,0.1)",  border:"rgba(148,163,184,0.2)", Icon:FileText      },
  { value:"checklist",    label:"Checklist",    color:"#4ade80", bg:"rgba(74,222,128,0.1)",   border:"rgba(74,222,128,0.2)",  Icon:CheckSquare   },
  { value:"réunion",      label:"Réunion",      color:"#60a5fa", bg:"rgba(96,165,250,0.1)",   border:"rgba(96,165,250,0.2)",  Icon:Users         },
  { value:"idée",         label:"Idée",         color:"#f59e0b", bg:"rgba(245,158,11,0.1)",   border:"rgba(245,158,11,0.2)",  Icon:Lightbulb     },
  { value:"compte-rendu", label:"Compte-rendu", color:"#a78bfa", bg:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.2)", Icon:ClipboardList },
  { value:"journal",      label:"Journal",      color:"#f472b6", bg:"rgba(244,114,182,0.1)",  border:"rgba(244,114,182,0.2)", Icon:BookOpen      },
  { value:"code",         label:"Code",         color:"#38bdf8", bg:"rgba(56,189,248,0.1)",   border:"rgba(56,189,248,0.2)",  Icon:Code          },
  { value:"vocal",        label:"Vocal",        color:"#fb923c", bg:"rgba(251,146,60,0.1)",   border:"rgba(251,146,60,0.2)",  Icon:Mic           },
];

const AI_ACTIONS: { action: AiAction; label: string; icon: React.ElementType; color: string; replaces: boolean }[] = [
  { action:"improve",         label:"Améliorer",  icon:Wand2,        color:"#a78bfa", replaces:true  },
  { action:"correct",         label:"Corriger",   icon:Check,        color:"#4ade80", replaces:true  },
  { action:"rephrase",        label:"Reformuler", icon:RefreshCw,    color:"#60a5fa", replaces:true  },
  { action:"summarize",       label:"Résumer",    icon:FileText,     color:"#f59e0b", replaces:false },
  { action:"to-tasks",        label:"Tâches",     icon:ListChecks,   color:"#34d399", replaces:false },
  { action:"translate",       label:"Traduire",   icon:Languages,    color:"#38bdf8", replaces:true  },
  { action:"meeting-report",  label:"CR Réunion", icon:ClipboardList,color:"#f472b6", replaces:false },
  { action:"extract-actions", label:"Extraire",   icon:Zap,          color:"#fb923c", replaces:false },
  { action:"chat",            label:"Chat IA",    icon:MessageSquare,color:"#c9a55a", replaces:false },
];

const TEMPLATES: { label: string; type: NoteType; icon: LucideIcon; content: string }[] = [
  {
    label:"Réunion", type:"réunion", icon:Users,
    content:`# Réunion — ${new Date().toLocaleDateString("fr-FR")}\n\n**Participants :**\n\n**Ordre du jour :**\n-\n\n**Notes :**\n\n**Décisions prises :**\n-\n\n**Actions à suivre :**\n- [ ]\n- [ ]\n\n**Prochaine réunion :**`,
  },
  {
    label:"Brainstorming", type:"idée", icon:Lightbulb,
    content:`# Brainstorming\n\n**Idée principale :**\n\n**Pistes à explorer :**\n-\n-\n-\n\n**Pour :**\n-\n\n**Contre :**\n-\n\n**Prochaine action :**`,
  },
  {
    label:"Projet", type:"compte-rendu", icon:Zap,
    content:`# Projet :\n\n**Objectif :**\n\n**Étapes clés :**\n1.\n2.\n3.\n\n**Ressources nécessaires :**\n-\n\n**Budget estimé :**\n\n**Deadline :**\n\n**Risques :**\n- `,
  },
  {
    label:"Journal", type:"journal", icon:BookOpen,
    content:`# Journal — ${new Date().toLocaleDateString("fr-FR")}\n\n**Aujourd'hui :**\n\n**Ce qui s'est bien passé :**\n-\n\n**Ce qui peut être amélioré :**\n-\n\n**Apprentissages :**\n\n**Demain :**\n- [ ] `,
  },
  {
    label:"Business Plan", type:"texte", icon:BarChart2,
    content:`# Business Plan\n\n## Vision\n**Mission :**\n\n**Valeur unique :**\n\n## Problème\nLe problème que l'on résout :\n\n## Solution\n\n## Marché cible\n**Segment :**\n\n**Taille estimée :**\n\n## Modèle de revenus\n\n## Concurrence\n\n## Objectifs (6 mois)\n- [ ]\n- [ ] `,
  },
  {
    label:"Notes de cours", type:"texte", icon:BookOpen,
    content:`# Cours :\n\n**Date :** ${new Date().toLocaleDateString("fr-FR")}\n**Formateur :**\n\n## Points clés\n-\n-\n-\n\n## Concepts importants\n\n## Questions à creuser\n-\n\n## Résumé\n\n## Prochaines étapes\n- [ ] `,
  },
];

const FOLDER_COLORS = ["#a78bfa","#60a5fa","#4ade80","#f59e0b","#f472b6","#38bdf8","#fb923c"];

const NB_COVERS = [
  { id:"midnight", label:"Minuit",   g:"linear-gradient(150deg,#0f0c29,#302b63,#24243e)", s:"#0c0a22" },
  { id:"ocean",    label:"Océan",    g:"linear-gradient(150deg,#1a5ea0,#0ea5e9)",         s:"#1a4e80" },
  { id:"forest",   label:"Forêt",    g:"linear-gradient(150deg,#134e5e,#71b280)",         s:"#0d3d4a" },
  { id:"amber",    label:"Ambre",    g:"linear-gradient(150deg,#f59e0b,#b45309)",         s:"#92400e" },
  { id:"crimson",  label:"Cramoisi", g:"linear-gradient(150deg,#991b1b,#dc2626)",         s:"#7f1d1d" },
  { id:"slate",    label:"Ardoise",  g:"linear-gradient(150deg,#0f172a,#334155)",         s:"#0f172a" },
  { id:"purple",   label:"Violet",   g:"linear-gradient(150deg,#3730a3,#7c3aed)",         s:"#2e1065" },
  { id:"emerald",  label:"Émeraude", g:"linear-gradient(150deg,#064e3b,#059669)",         s:"#022c22" },
  { id:"rose",     label:"Rose",     g:"linear-gradient(150deg,#9d174d,#f43f5e)",         s:"#831843" },
  { id:"copper",   label:"Cuivre",   g:"linear-gradient(150deg,#78350f,#b45309)",         s:"#451a03" },
] as const;
type NbCoverId = typeof NB_COVERS[number]["id"];

const NB_PAGE_STYLES: { value: NbPageStyle; label: string; Icon: React.ElementType }[] = [
  { value:"blank",  label:"Blanche",    Icon:Square    },
  { value:"lined",  label:"Lignes",     Icon:AlignLeft },
  { value:"grid",   label:"Carreaux",   Icon:LayoutGrid},
  { value:"dotted", label:"Points",     Icon:Hash      },
  { value:"agenda", label:"Agenda",     Icon:CalendarDays },
];

const NB_COLORS = ["#1e293b","#dc2626","#2563eb","#16a34a","#d97706","#7c3aed","#db2777","#0891b2"];
const NB_WIDTHS: { label: string; v: number }[] = [
  { label:"S", v:1.5 },{ label:"M", v:3 },{ label:"L", v:8 },{ label:"XL",v:18 },
];

/* ── Helpers ───────────────────────────────────────── */
const getNoteType = (n: Note): NoteType => {
  if (n.note_type) return n.note_type;
  const map: Record<string, NoteType> = { réunion:"réunion", idées:"idée", tâches:"checklist", personnel:"journal" };
  return map[n.category] ?? "texte";
};
const getTypeInfo = (t: NoteType) => NOTE_TYPES.find(x => x.value === t) ?? NOTE_TYPES[0];

const TYPE_DESC: Record<NoteType, string> = {
  "texte":        "Document libre, prose, essai",
  "checklist":    "Liste de tâches à cocher",
  "réunion":      "Ordre du jour, participants",
  "idée":         "Brainstorming, pistes",
  "compte-rendu": "Synthèse et décisions",
  "journal":      "Notes quotidiennes",
  "code":         "Snippets, documentation",
  "vocal":        "Transcription dictée",
};

const countWords  = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
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
  const total = lines.filter(l => /^(\s*)-\s*\[[x~\s]\]/.test(l)).length;
  const done  = lines.filter(l => /^(\s*)-\s*\[x\]/i.test(l)).length;
  return { total, done };
}

/* ── ChecklistView ─────────────────────────────────── */
function ChecklistView({ content, onToggle }: { content: string; onToggle: (c: string) => void }) {
  const lines = content.split("\n");
  function cycle(i: number) {
    const nl = [...lines], l = nl[i];
    if (/^(\s*-\s*)\[ \]/.test(l))      nl[i] = l.replace(/^(\s*-\s*)\[ \]/,"$1[~]");
    else if (/^(\s*-\s*)\[~\]/.test(l)) nl[i] = l.replace(/^(\s*-\s*)\[~\]/,"$1[x]");
    else                                  nl[i] = l.replace(/^(\s*-\s*)\[x\]/i,"$1[ ]");
    onToggle(nl.join("\n"));
  }
  return (
    <div className="space-y-1.5 py-1">
      {lines.map((line,i) => {
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
                {state==="progress"&&<span className="text-[8px] font-bold" style={{color:col}}>~</span>}
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

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function BlocNotesPage() {

  /* ── Data state ── */
  const [notes,     setNotes]     = useState<Note[]>([]);
  const [folders,   setFolders]   = useState<NoteFolder[]>([]);
  const [loading,   setLoading]   = useState(true);

  /* ── Selection ── */
  const [selected,  setSelected]  = useState<Note|null>(null);
  const [section,   setSection]   = useState<Section>("all");
  const [search,    setSearch]    = useState("");
  const [sortBy,    setSortBy]    = useState<SortBy>("date");
  const [favSet,    setFavSet]    = useState<Set<string>>(new Set());

  /* ── Draft editor ── */
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
  const [prevSnap,  setPrevSnap]  = useState<string|null>(null);

  /* ── UI state ── */
  const [mobilePanel,    setMobilePanel]    = useState<"list"|"editor">("list");
  const [toast,          setToast]          = useState<ToastData|null>(null);
  const [aiPanel,        setAiPanel]        = useState(false);
  const [aiAction,       setAiAction]       = useState<AiAction>("improve");
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiResult,       setAiResult]       = useState("");
  const [chatPrompt,     setChatPrompt]     = useState("");
  const [showTemplates,  setShowTemplates]  = useState(false);
  const [confirmDel,     setConfirmDel]     = useState(false);
  const [folderModal,    setFolderModal]    = useState(false);
  const [newFolderName,  setNewFolderName]  = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#a78bfa");
  const [exportMenu,     setExportMenu]     = useState(false);

  /* ── Voice ── */
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceSec,   setVoiceSec]   = useState(0);
  const [voiceTxt,   setVoiceTxt]   = useState("");
  const [voiceLoad,  setVoiceLoad]  = useState(false);

  /* ── Notebooks (Canvas) ── */
  const [hasMore,       setHasMore]       = useState(false);
  const [notebooks,     setNotebooks]     = useState<Notebook[]>([]);
  const [activeNb,      setActiveNb]      = useState<Notebook|null>(null);
  const [nbPages,       setNbPages]       = useState<NotebookPage[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [nbStrokes,     setNbStrokes]     = useState<NbStroke[]>([]);
  const [nbHistory,     setNbHistory]     = useState<NbStroke[][]>([]);
  const [nbTool,        setNbTool]        = useState<NbTool>("pen");
  const [nbColor,       setNbColor]       = useState("#1e293b");
  const [nbWidthIdx,    setNbWidthIdx]    = useState(1);
  const [nbDirty,       setNbDirty]       = useState(false);
  const [nbSaving,      setNbSaving]      = useState(false);
  const [createNbOpen,  setCreateNbOpen]  = useState(false);
  const [nbName,        setNbName]        = useState("");
  const [nbCoverId,     setNbCoverId]     = useState<string>("midnight");
  const [nbPageStyleV,  setNbPageStyleV]  = useState<NbPageStyle>("lined");
  const [nbCreating,    setNbCreating]    = useState(false);
  const nbSaveTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  /* ── Refs ── */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveRef     = useRef<(s?: boolean)=>Promise<void>>(async()=>{});
  const debRef      = useRef<ReturnType<typeof setTimeout>|null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const chunkRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const mrRef       = useRef<MediaRecorder|null>(null);
  const blobsRef    = useRef<Blob[]>([]);
  const chunkIdxRef = useRef(0);
  const txRef       = useRef("");
  const voiceSecRef = useRef(0);

  const showToast = (type: "success"|"error"|"info", msg: string) => setToast({type,msg} as ToastData);

  /* ══ Data fetching ══ */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [nRes, fRes] = await Promise.all([
      supabase.from("notes").select("*").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(50),
      supabase.from("note_folders").select("*").eq("user_id",user.id).order("name"),
    ]);
    if (nRes.data) {
      setNotes(nRes.data as Note[]);
      setHasMore(nRes.data.length === 50);
      setFavSet(new Set((nRes.data as Note[]).filter(n => n.is_favorite).map(n => n.id)));
    }
    if (fRes.data) setFolders(fRes.data as NoteFolder[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const loadMore = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notes").select("*")
      .eq("user_id", user.id).order("updated_at", { ascending: false })
      .range(notes.length, notes.length + 49);
    if (data) {
      setNotes(p => [...p, ...(data as Note[])]);
      setHasMore(data.length === 50);
    }
  }, [notes.length]);

  /* ══ Notebook CRUD ══ */
  const fetchNotebooks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notebooks").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
    if (data) setNotebooks(data as Notebook[]);
  }, []);

  useEffect(() => { void fetchNotebooks(); }, [fetchNotebooks]);

  const fetchNbPages = useCallback(async (nbId: string) => {
    const { data } = await supabase.from("notebook_pages").select("*").eq("notebook_id",nbId).order("page_number");
    if (data) {
      const pages = (data as NotebookPage[]).map(p => ({ ...p, strokes: (Array.isArray(p.strokes)?p.strokes:[]) as NbStroke[] }));
      setNbPages(pages);
      setActivePageIdx(0);
      setNbStrokes(pages[0]?.strokes ?? []);
      setNbHistory([]);
      setNbDirty(false);
    }
  }, []);

  const openNotebook = useCallback(async (nb: Notebook) => {
    setActiveNb(nb);
    await fetchNbPages(nb.id);
  }, [fetchNbPages]);

  const createNotebook = useCallback(async () => {
    if (!nbName.trim()) return;
    setNbCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNbCreating(false); return; }
    const { data: nb, error } = await supabase.from("notebooks")
      .insert({ user_id:user.id, name:nbName.trim(), cover_id:nbCoverId, page_style:nbPageStyleV })
      .select().single();
    if (error || !nb) { showToast("error","Erreur création cahier"); setNbCreating(false); return; }
    await supabase.from("notebook_pages").insert({ notebook_id:nb.id, user_id:user.id, page_number:1, strokes:[] });
    setNotebooks(prev => [nb as Notebook, ...prev]);
    setCreateNbOpen(false);
    setNbName(""); setNbCoverId("midnight"); setNbPageStyleV("lined");
    setNbCreating(false);
    await openNotebook(nb as Notebook);
    showToast("success","Cahier créé");
  }, [nbName, nbCoverId, nbPageStyleV, openNotebook]);

  const addNbPage = useCallback(async () => {
    if (!activeNb) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const nextNum = (nbPages[nbPages.length-1]?.page_number ?? 0) + 1;
    const { data: page } = await supabase.from("notebook_pages")
      .insert({ notebook_id:activeNb.id, user_id:user.id, page_number:nextNum, strokes:[] })
      .select().single();
    if (page) {
      const np = { ...page as NotebookPage, strokes: [] };
      setNbPages(prev => [...prev, np]);
      setActivePageIdx(nbPages.length);
      setNbStrokes([]); setNbHistory([]); setNbDirty(false);
    }
  }, [activeNb, nbPages]);

  const saveNbPage = useCallback(async (strokes: NbStroke[], silent = true) => {
    const page = nbPages[activePageIdx];
    if (!page) return;
    setNbSaving(true);
    await supabase.from("notebook_pages").update({
      strokes: strokes as unknown as Record<string,unknown>[],
      updated_at: new Date().toISOString(),
    }).eq("id",page.id);
    setNbPages(prev => prev.map((p,i) => i===activePageIdx ? {...p,strokes} : p));
    setNbDirty(false); setNbSaving(false);
    if (!silent) showToast("success","Page sauvegardée");
  }, [nbPages, activePageIdx]);

  const handleNbStrokes = useCallback((newStrokes: NbStroke[]) => {
    setNbStrokes(newStrokes);
    setNbHistory(h => [...h.slice(-30), newStrokes.slice(0,-1)]);
    setNbDirty(true);
    if (nbSaveTimerRef.current) clearTimeout(nbSaveTimerRef.current);
    nbSaveTimerRef.current = setTimeout(() => { void saveNbPage(newStrokes); }, 1800);
  }, [saveNbPage]);

  const nbUndo = useCallback(() => {
    if (!nbHistory.length) return;
    const prev = nbHistory[nbHistory.length-1];
    setNbStrokes(prev); setNbHistory(h => h.slice(0,-1)); setNbDirty(true);
    if (nbSaveTimerRef.current) clearTimeout(nbSaveTimerRef.current);
    nbSaveTimerRef.current = setTimeout(() => { void saveNbPage(prev); }, 1800);
  }, [nbHistory, saveNbPage]);

  const selectNbPage = useCallback((idx: number) => {
    setActivePageIdx(idx);
    setNbStrokes(nbPages[idx]?.strokes ?? []);
    setNbHistory([]); setNbDirty(false);
  }, [nbPages]);

  const deleteNotebook = useCallback(async (nb: Notebook) => {
    if (!window.confirm(`Supprimer le cahier "${nb.name}" ? Cette action est irréversible.`)) return;
    await supabase.from("notebooks").delete().eq("id",nb.id);
    setNotebooks(prev => prev.filter(n => n.id!==nb.id));
    if (activeNb?.id === nb.id) { setActiveNb(null); setNbPages([]); }
    showToast("success","Cahier supprimé");
  }, [activeNb]);

  /* ══ Note CRUD ══ */
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
    setMobilePanel("editor");
  }, []);

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
    setMobilePanel("editor");
  }, []);

  const handleSave = useCallback(async (silent = false) => {
    if (!dTitle.trim() && !dContent.trim()) return;
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSaving(false); return; }
    const payload = {
      title:         dTitle.trim() || "Sans titre",
      content:       dContent,
      note_type:     dType,
      category:      dType,
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
    setIsSaving(false); setIsDirty(false);
    setSavedAgo("il y a quelques secondes");
    if (!silent) showToast("success","Note sauvegardée");
  }, [dTitle, dContent, dType, dFolderId, dTags, dLinked, selected]);

  saveRef.current = handleSave;

  useEffect(() => {
    if (!isDirty) return;
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { void saveRef.current(true); }, 2500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [isDirty, dTitle, dContent, dType]);

  async function handleDelete() {
    if (!selected?.id) return;
    const { error } = await supabase.from("notes").delete().eq("id",selected.id);
    if (error) { showToast("error",error.message); return; }
    setNotes(p => p.filter(n => n.id!==selected.id));
    setSelected(null); setMobilePanel("list"); setConfirmDel(false);
    showToast("success","Note supprimée.");
  }

  function toggleFav(id: string) {
    const newVal = !favSet.has(id);
    const s = new Set(favSet);
    if (newVal) s.add(id); else s.delete(id);
    setFavSet(s);
    setNotes(p => p.map(n => n.id === id ? { ...n, is_favorite: newVal } : n));
    void supabase.from("notes").update({ is_favorite: newVal }).eq("id", id);
  }

  async function toggleArchive() {
    if (!selected?.id) return;
    const newVal = !(selected.is_archived ?? false);
    await supabase.from("notes").update({is_archived:newVal}).eq("id",selected.id);
    setNotes(p => p.map(n => n.id===selected.id ? {...n,is_archived:newVal} : n));
    setSelected(s => s ? {...s,is_archived:newVal} : s);
    showToast("success", newVal ? "Note archivée." : "Note désarchivée.");
    if (newVal) { setSelected(null); setMobilePanel("list"); }
  }

  function insertFormat(before: string, after = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = dContent.slice(start, end);
    const newContent = dContent.slice(0,start) + before + sel + after + dContent.slice(end);
    setDContent(newContent); setIsDirty(true);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start+before.length, start+before.length+sel.length); }, 10);
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
    setDContent(lines.join("\n")); setIsDirty(true);
  }

  async function callAI(action: AiAction, customPrompt?: string) {
    if (!dContent.trim() && !dTitle.trim()) { showToast("error","Note vide."); return; }
    setAiAction(action); setAiLoading(true); setAiResult(""); setAiPanel(true);
    try {
      const res = await fetch("/api/notes/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action, content:dContent, title:dTitle, prompt:customPrompt }),
      });
      const json = await res.json() as { result?: string; error?: string };
      if (!res.ok || json.error) { showToast("error", json.error ?? "Erreur IA."); setAiLoading(false); return; }
      setAiResult(json.result ?? "");
    } catch { showToast("error","Erreur réseau."); }
    setAiLoading(false);
  }

  function applyAiResult() {
    const ai = AI_ACTIONS.find(a => a.action === aiAction);
    if (ai?.replaces) { setPrevSnap(dContent); setDContent(aiResult); }
    else { setDContent(c => `${c}\n\n---\n${aiResult}`); }
    setIsDirty(true); setAiPanel(false); setAiResult("");
    showToast("success","Résultat IA appliqué");
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("note_folders")
      .insert({ user_id:user.id, name:newFolderName.trim(), color:newFolderColor })
      .select().single();
    if (error) { showToast("error",error.message); return; }
    setFolders(f => [...f, data as NoteFolder]);
    setFolderModal(false); setNewFolderName("");
    showToast("success","Dossier créé.");
  }

  function exportTXT() {
    const blob = new Blob([`${dTitle}\n${"=".repeat(dTitle.length)}\n\n${dContent}`],{type:"text/plain;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${dTitle||"note"}.txt`; a.click();
    showToast("success","Export TXT");
  }
  function exportMarkdown() {
    const blob = new Blob([`# ${dTitle}\n\n${dContent}`],{type:"text/markdown;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${dTitle||"note"}.md`; a.click();
    showToast("success","Export Markdown");
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
      showToast("success","Export PDF");
    } catch { showToast("error","Erreur PDF — réessayez."); }
  }

  /* ── Voice recording ── */
  async function startVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mime = ["audio/webm","audio/ogg","audio/mp4"].find(m => MediaRecorder.isTypeSupported(m));
      const mr = new MediaRecorder(stream, mime?{mimeType:mime}:undefined);
      mrRef.current = mr; blobsRef.current = []; chunkIdxRef.current = 0;
      mr.ondataavailable = (e) => { if (e.data.size>0) blobsRef.current.push(e.data); };
      mr.start(1000);
      setVoiceState("recording"); setVoiceSec(0); voiceSecRef.current = 0;
      timerRef.current = setInterval(() => { voiceSecRef.current++; setVoiceSec(voiceSecRef.current); }, 1000);
      chunkRef.current = setInterval(() => { if (blobsRef.current.length) flushChunk(); }, CHUNK_MS);
    } catch (err) {
      const name = (err as DOMException).name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError")
        showToast("error","Permission microphone refusée — autorisez dans les réglages");
      else if (name === "NotFoundError")
        showToast("error","Aucun microphone détecté");
      else showToast("error","Impossible d'accéder au microphone");
    }
  }

  const transcribeBlob = useCallback(async (blob: Blob, idx: number) => {
    setVoiceLoad(true);
    const fd = new FormData();
    const ext = blob.type.includes("ogg")?"ogg":blob.type.includes("mp4")?"mp4":"webm";
    fd.append("audio", new File([blob],`chunk-${idx}.${ext}`,{type:blob.type}));
    const res  = await fetch("/api/transcribe",{method:"POST",body:fd});
    const data = await res.json() as {text?:string;error?:string};
    if (data.text) {
      const full = txRef.current ? `${txRef.current} ${data.text}` : data.text;
      txRef.current = full; setVoiceTxt(full);
    }
    setVoiceLoad(false);
  }, []);

  const flushChunk = useCallback(() => {
    const blobs = [...blobsRef.current]; blobsRef.current = [];
    if (blobs.length) void transcribeBlob(new Blob(blobs,{type:blobs[0].type}), chunkIdxRef.current++);
  }, [transcribeBlob]);

  function pauseVoice()  { mrRef.current?.pause(); if (timerRef.current) clearInterval(timerRef.current); setVoiceState("paused"); }
  function resumeVoice() { mrRef.current?.resume(); timerRef.current=setInterval(()=>{voiceSecRef.current++;setVoiceSec(voiceSecRef.current);},1000); setVoiceState("recording"); }
  function stopVoice() {
    mrRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkRef.current) clearInterval(chunkRef.current);
    const blobs = [...blobsRef.current]; blobsRef.current = [];
    if (blobs.length) void transcribeBlob(new Blob(blobs,{type:blobs[0].type}), chunkIdxRef.current);
    mrRef.current?.stream?.getTracks().forEach(t => t.stop());
    setVoiceState("stopped");
  }
  function useVoiceText()  { setDContent(c => c ? `${c}\n\n${voiceTxt}` : voiceTxt); setIsDirty(true); setVoiceState("idle"); setVoiceTxt(""); txRef.current=""; }
  function discardVoice()  { setVoiceState("idle"); setVoiceTxt(""); txRef.current=""; }

  /* ══ Derived data ══ */
  const displayNotes = useMemo(() => {
    let ns = notes.filter(n => {
      const arch = n.is_archived ?? false;
      if (section === "all")       return !arch;
      if (section === "favorites") return !arch && favSet.has(n.id);
      if (section === "archived")  return arch;
      if (section === "vocal")     return !arch && getNoteType(n) === "vocal";
      if (section === "checklist") return !arch && getNoteType(n) === "checklist";

      if (section.startsWith("folder:")) return !arch && n.folder_id === section.slice(7);
      return !arch;
    });
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
  }, [notes, section, favSet, search, sortBy]);

  const counts = useMemo(() => ({
    all:       notes.filter(n => !(n.is_archived??false)).length,
    favs:      notes.filter(n => !(n.is_archived??false) && favSet.has(n.id)).length,
    archived:  notes.filter(n => n.is_archived??false).length,
    vocal:     notes.filter(n => !(n.is_archived??false) && getNoteType(n)==="vocal").length,
    checklist: notes.filter(n => !(n.is_archived??false) && getNoteType(n)==="checklist").length,
  }), [notes, favSet]);

  const wordCnt = countWords(dContent);
  const isCanvas = false;

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-[#07080e]">

      {/* ══ SIDEBAR (desktop only) ══ */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-[#0e1420] border-r border-white/[0.06]">
        <div className="flex flex-col h-full p-3 gap-0">

          {/* Brand */}
          <div className="px-2 py-3 mb-1">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/18">Notes</p>
          </div>

          {/* Main sections */}
          <div className="space-y-0.5 mb-4">
            {([
              { key:"all",       label:"Toutes",    Icon:StickyNote,  count:counts.all       },
              { key:"favorites", label:"Favoris",   Icon:Star,        count:counts.favs      },
              { key:"checklist", label:"Checklist", Icon:CheckSquare, count:counts.checklist },
              { key:"vocal",     label:"Vocal",     Icon:Mic,         count:counts.vocal     },
              { key:"archived",  label:"Archives",  Icon:Archive,     count:counts.archived  },
            ] as const).map(item => (
              <button key={item.key}
                onClick={() => {
                  setSection(item.key as Section);
                  setSelected(null);
                  setActiveNb(null);
                  setMobilePanel("list");
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[0.76rem] font-semibold transition-all duration-150 ${
                  section === item.key
                    ? "bg-white/[0.09] text-white"
                    : "text-white/38 hover:text-white/65 hover:bg-white/[0.04]"
                }`}>
                <item.Icon size={13} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && (
                  <span className="text-[0.58rem] tabular-nums text-white/22">{item.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Divider + Folders */}
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[0.56rem] font-black uppercase tracking-[0.15em] text-white/18">Dossiers</span>
            <button onClick={() => setFolderModal(true)}
              className="text-white/20 transition hover:text-white/50 rounded-lg p-0.5">
              <FolderPlus size={12}/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 mb-4 min-h-0" style={{scrollbarWidth:"none"}}>
            {folders.map(f => (
              <button key={f.id}
                onClick={() => { setSection(`folder:${f.id}` as Section); setSelected(null); setMobilePanel("list"); }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-[0.73rem] font-semibold transition-all ${
                  section === `folder:${f.id}`
                    ? "bg-white/[0.07] text-white"
                    : "text-white/32 hover:text-white/58 hover:bg-white/[0.03]"
                }`}>
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:f.color}}/>
                <span className="flex-1 truncate text-left">{f.name}</span>
              </button>
            ))}
            {folders.length === 0 && (
              <p className="px-3 pt-1 text-[0.6rem] text-white/18">Aucun dossier</p>
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => isCanvas ? setCreateNbOpen(true) : createNote("texte")}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[0.76rem] font-bold text-[#0a0a0a] transition hover:opacity-90 active:scale-[0.98]"
            style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",boxShadow:"0 4px 18px rgba(245,158,11,0.22)"}}>
            <Plus size={13}/>
            {isCanvas ? "Nouveau cahier" : "Nouvelle note"}
          </button>
        </div>
      </aside>

      {/* ══ LIST PANEL ══ */}
      <div className={`flex-col bg-[#12151c] border-r border-white/[0.06]
        shrink-0 w-full lg:w-80
        ${mobilePanel === "editor" ? "hidden lg:flex" : "flex"}`}>

        {/* ─ CANVAS: notebooks grid ─ */}
        {isCanvas ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-[0.84rem] font-black text-white">Cahiers</span>
              <button onClick={() => setCreateNbOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/[0.06]"
                style={{color:amber}}>
                <Plus size={15}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{scrollbarWidth:"none"}}>
              {notebooks.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{background:`${amber}0e`,border:`1px solid ${amber}1a`}}>
                    <Book size={24} style={{color:`${amber}80`}}/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/50">Aucun cahier</p>
                    <p className="text-xs text-white/22 mt-1">Créez votre premier cahier numérique</p>
                  </div>
                  <button onClick={() => setCreateNbOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#0a0a0a]"
                    style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                    <Plus size={11}/> Nouveau cahier
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {notebooks.map(nb => {
                    const cov = NB_COVERS.find(c => c.id===nb.cover_id) ?? NB_COVERS[0];
                    const isActive = activeNb?.id === nb.id;
                    return (
                      <motion.div key={nb.id} className="flex flex-col items-center gap-2 group">
                        <motion.button
                          onClick={() => void openNotebook(nb)}
                          whileHover={{scale:1.04,y:-2}} whileTap={{scale:0.97}}
                          className="relative w-full"
                          style={{aspectRatio:"3/4",
                            outline: isActive ? `2px solid ${amber}` : "none",
                            borderRadius:"8px",
                            outlineOffset: isActive ? "2px" : "0px"}}>
                          <div className="absolute left-0 inset-y-0 w-[14%] rounded-l-lg" style={{background:cov.s,boxShadow:"inset -3px 0 8px rgba(0,0,0,0.3)"}}/>
                          <div className="absolute left-[12%] inset-y-0 right-0 rounded-r-lg overflow-hidden shadow-xl" style={{background:cov.g}}>
                            <div className="absolute inset-0 flex flex-col gap-4 pt-5 px-3 opacity-15">
                              {[0,1,2,3].map(i => <div key={i} className="h-px bg-white"/>)}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 pt-5 pb-2">
                              <p className="text-[0.58rem] font-black text-white/90 line-clamp-2 leading-tight">{nb.name}</p>
                            </div>
                          </div>
                        </motion.button>
                        <div className="flex w-full items-center justify-between px-0.5">
                          <span className="text-[0.65rem] font-semibold text-white/45 truncate flex-1">{nb.name}</span>
                          <button onClick={() => void deleteNotebook(nb)}
                            className="shrink-0 p-1.5 -m-1 text-white/40 hover:text-red-400/70 active:text-red-400 transition ml-1">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* New notebook card */}
                  <div className="flex flex-col items-center gap-2">
                    <motion.button
                      onClick={() => setCreateNbOpen(true)}
                      whileHover={{scale:1.04,y:-2}} whileTap={{scale:0.97}}
                      className="relative w-full flex items-center justify-center rounded-lg border-2 border-dashed border-white/10 transition hover:border-amber-400/25"
                      style={{aspectRatio:"3/4"}}>
                      <Plus size={18} className="text-white/18"/>
                    </motion.button>
                    <span className="text-[0.65rem] text-white/22">Nouveau</span>
                  </div>
                </div>
              )}
            </div>

            {/* Page list when notebook open (only on desktop) */}
            {activeNb && (
              <div className="border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <ChevronLeft size={12} className="text-white/30 cursor-pointer hover:text-white/60" onClick={() => setActiveNb(null)}/>
                  <span className="flex-1 text-[0.7rem] font-bold text-white/55 truncate">{activeNb.name}</span>
                  <div className="flex items-center gap-1">
                    {nbPages.map((_,idx) => (
                      <button key={idx} onClick={() => selectNbPage(idx)}
                        className={`h-5 w-5 rounded-md text-[0.52rem] font-bold transition ${activePageIdx===idx?"text-[#0a0a0a]":"text-white/35 hover:bg-white/[0.06]"}`}
                        style={activePageIdx===idx?{background:amber}:{}}>
                        {idx+1}
                      </button>
                    ))}
                    <button onClick={() => void addNbPage()}
                      className="flex h-5 w-5 items-center justify-center rounded-md text-white/22 hover:text-white/55 transition">
                      <Plus size={10}/>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ─ NOTES LIST ─ */
          <>
            {/* Header — premium zone */}
            <div className="relative overflow-hidden"
              style={{background:"linear-gradient(180deg,rgba(245,158,11,0.05) 0%,transparent 100%)"}}>
              {/* Ambient glow */}
              <div className="pointer-events-none absolute -top-8 -left-6 h-28 w-28 rounded-full opacity-[0.13]"
                style={{background:"radial-gradient(circle,#f59e0b,transparent 70%)"}}/>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{background:"linear-gradient(90deg,rgba(245,158,11,0.55),rgba(245,158,11,0.12),transparent)"}}/>
              <div className="relative flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  {/* Section icon badge */}
                  <div className="flex h-[1.9rem] w-[1.9rem] shrink-0 items-center justify-center rounded-xl"
                    style={{background:"rgba(245,158,11,0.09)",border:"1px solid rgba(245,158,11,0.17)"}}>
                    {section === "favorites"
                      ? <Star size={13} style={{color:amber}}/>
                      : section === "archived"
                      ? <Archive size={13} className="text-white/45"/>
                      : section === "vocal"
                      ? <Mic size={13} style={{color:amber}}/>
                      : section === "checklist"
                      ? <ListChecks size={13} style={{color:amber}}/>
                      : section.startsWith("folder:")
                      ? <Folder size={13} style={{color:amber}}/>
                      : <StickyNote size={13} style={{color:amber}}/>}
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-black leading-tight text-white/88">
                      {section === "all" ? "Toutes les notes"
                        : section === "favorites" ? "Favoris"
                        : section === "archived" ? "Archives"
                        : section === "vocal" ? "Notes vocales"
                        : section === "checklist" ? "Checklists"
                        : folders.find(f => section === `folder:${f.id}`)?.name ?? "Notes"}
                    </p>
                    {displayNotes.length > 0 && (
                      <p className="mt-px text-[0.56rem] font-semibold text-white/28">
                        {displayNotes.length} note{displayNotes.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowTemplates(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/28 transition hover:bg-white/[0.05] hover:text-white/55">
                    <Hash size={13}/>
                  </button>
                  <button onClick={() => createNote("texte")}
                    className="flex h-7 w-7 items-center justify-center rounded-xl transition active:scale-95"
                    style={{background:"rgba(245,158,11,0.11)",border:"1px solid rgba(245,158,11,0.2)",color:amber}}>
                    <Plus size={14}/>
                  </button>
                </div>
              </div>
              <div className="h-[1px]" style={{background:"linear-gradient(90deg,rgba(245,158,11,0.2),rgba(255,255,255,0.05),transparent)"}}/>
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.06] px-3 py-2.5">
              <div className="relative">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/22"/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-8 pr-7 py-1.5 text-[0.76rem] text-white placeholder:text-white/22 outline-none transition focus:border-amber-400/35"/>
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/55">
                    <X size={10}/>
                  </button>
                )}
              </div>
            </div>

            {/* Sort tabs */}
            <div className="flex items-center border-b border-white/[0.05] px-3 pt-1.5 pb-0">
              {([{v:"date",l:"Récentes"},{v:"alpha",l:"A–Z"},{v:"type",l:"Type"}] as {v:SortBy;l:string}[]).map(s => (
                <button key={s.v} onClick={() => setSortBy(s.v)}
                  className="relative shrink-0 px-3 pb-2 text-[0.63rem] font-bold transition-colors"
                  style={{color:sortBy===s.v?"rgba(255,255,255,0.82)":"rgba(255,255,255,0.26)"}}>
                  {s.l}
                  {sortBy===s.v && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{background:amber}}/>}
                </button>
              ))}
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto pb-20 lg:pb-0" style={{scrollbarWidth:"none"}}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={18} className="animate-spin text-white/20"/>
                </div>
              ) : displayNotes.length === 0 ? (
                search ? (
                  <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                      <Search size={18} className="text-white/18"/>
                    </div>
                    <p className="text-sm font-semibold text-white/35">Aucun résultat pour &ldquo;{search}&rdquo;</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <div className="rounded-2xl px-4 py-3"
                      style={{background:"linear-gradient(135deg,rgba(245,158,11,0.07),rgba(245,158,11,0.02))",border:"1px solid rgba(245,158,11,0.12)"}}>
                      <p className="text-[0.62rem] font-black uppercase tracking-widest mb-0.5" style={{color:"rgba(245,158,11,0.55)"}}>Démarrer</p>
                      <p className="text-[0.82rem] font-black text-white">Choisissez un type de note</p>
                      <p className="text-[0.68rem] text-white/30 mt-0.5">Idées, réunions, décisions ou checklists</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {NOTE_TYPES.map(t => (
                        <motion.button key={t.value} onClick={() => createNote(t.value)}
                          whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                          className="flex flex-col items-start gap-2.5 rounded-2xl p-3.5 text-left"
                          style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.065)"}}>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background:`${t.color}12`,border:`1px solid ${t.color}20`}}>
                            <t.Icon size={13} style={{color:t.color}}/>
                          </div>
                          <div>
                            <p className="text-[0.75rem] font-bold text-white/82">{t.label}</p>
                            <p className="text-[0.6rem] text-white/28 mt-0.5 leading-snug">{TYPE_DESC[t.value]}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <AnimatePresence initial={false}>
                  {displayNotes.map((n,idx) => {
                    const ti     = getTypeInfo(getNoteType(n));
                    const isFav  = favSet.has(n.id);
                    const tags   = n.tags ?? [];
                    const {total,done} = getCheckProgress(n.content);
                    const isActive = selected?.id === n.id;
                    return (
                      <motion.div key={n.id} layout
                        initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        transition={{duration:0.16,delay:idx*0.02}}
                        onClick={() => openNote(n)}
                        className="group relative cursor-pointer"
                        style={{borderBottom:"1px solid rgba(255,255,255,0.035)"}}>
                        {/* Type accent bar */}
                        <div className="absolute left-0 inset-y-0 w-[3px] rounded-r-sm transition-all duration-200"
                          style={{background:isActive?`linear-gradient(180deg,${ti.color},${ti.color}50)`:`${ti.color}22`}}/>
                        <div className={`pl-5 pr-4 py-3.5 transition-colors duration-150 ${isActive?"bg-white/[0.052]":"hover:bg-white/[0.025]"}`}>
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <p className={`flex-1 truncate text-[0.85rem] font-semibold leading-snug ${isActive?"text-white":"text-white/75 group-hover:text-white/90"}`}>
                              {n.title || "Sans titre"}
                            </p>
                            <span className="shrink-0 text-[0.56rem] tabular-nums text-white/20">{fmtDateShort(n.updated_at)}</span>
                          </div>
                          <p className="text-[0.68rem] leading-relaxed text-white/28 line-clamp-2">
                            {n.content.replace(/^#+\s/gm,"").replace(/\[[\sx~]\]\s/g,"").replace(/\*\*/g,"").slice(0,200) || "Note vide"}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[0.56rem] font-bold uppercase tracking-wider" style={{color:`${ti.color}68`}}>
                              {ti.label}{getNoteType(n)==="checklist"&&total>0?` · ${done}/${total}`:""}{tags[0]?` · #${tags[0]}`:""}
                            </span>
                            <button onClick={e=>{e.stopPropagation();toggleFav(n.id)}}
                              className={`transition-all duration-150 ${isFav?"text-amber-300":"text-transparent group-hover:text-white/16"}`}>
                              <Star size={9} className={isFav?"fill-amber-300":""}/>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              {/* Load more */}
              {hasMore && (
                <div className="px-4 py-3">
                  <button onClick={() => void loadMore()}
                    className="w-full rounded-xl border border-white/[0.07] py-2 text-[0.7rem] font-semibold text-white/30 transition hover:border-white/14 hover:text-white/55">
                    Charger plus de notes…
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className={`flex-1 flex-col overflow-hidden bg-[#0d1117]
        ${mobilePanel === "list" ? "hidden lg:flex" : "flex"}`}>

        {/* ─ CANVAS EDITOR ─ */}
        {isCanvas && activeNb ? (
          <div className="flex flex-col h-full overflow-hidden">

            {/* Canvas toolbar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#07080e] px-4 py-2.5 flex-wrap">
              <button onClick={() => setActiveNb(null)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.68rem] font-bold text-white/40 transition hover:bg-white/[0.05] hover:text-white/70">
                <ChevronLeft size={12}/> Cahiers
              </button>
              <div className="h-4 w-px bg-white/[0.08] mx-1"/>
              <span className="text-[0.76rem] font-black text-white/70 truncate max-w-[120px]">{activeNb.name}</span>
              <span className="text-[0.65rem] text-white/22">— p.{nbPages[activePageIdx]?.page_number ?? 1}</span>

              <div className="ml-auto flex items-center gap-1.5">
                {/* Undo */}
                <button onClick={nbUndo} disabled={!nbHistory.length}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/32 transition hover:bg-white/[0.05] hover:text-white/65 disabled:opacity-25">
                  <Undo2 size={13}/>
                </button>
                <div className="h-4 w-px bg-white/[0.08]"/>
                {/* Tools */}
                {([{t:"pen" as NbTool,I:Pencil},{t:"eraser" as NbTool,I:Eraser}]).map(({t,I}) => (
                  <button key={t} onClick={() => setNbTool(t)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${nbTool===t?"text-amber-300 bg-amber-400/12":"text-white/32 hover:bg-white/[0.05] hover:text-white/65"}`}>
                    <I size={13}/>
                  </button>
                ))}
                <div className="h-4 w-px bg-white/[0.08]"/>
                {/* Colors */}
                <div className="flex items-center gap-1">
                  {NB_COLORS.map(c => (
                    <button key={c} onClick={() => setNbColor(c)}
                      className={`h-4 w-4 rounded-full border-2 transition-transform hover:scale-110 ${nbColor===c?"border-white/60 scale-110":"border-transparent"}`}
                      style={{background:c}}/>
                  ))}
                  <label className="relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-white/18 overflow-hidden">
                    <span className="text-[0.5rem] text-white/35">+</span>
                    <input type="color" value={nbColor} onChange={e => setNbColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0"/>
                  </label>
                </div>
                <div className="h-4 w-px bg-white/[0.08]"/>
                {/* Widths */}
                <div className="flex items-center gap-0.5">
                  {NB_WIDTHS.map((w,i) => (
                    <button key={i} onClick={() => setNbWidthIdx(i)}
                      className={`flex h-6 min-w-[20px] items-center justify-center rounded-md text-[0.56rem] font-black transition ${nbWidthIdx===i?"bg-amber-400/14 text-amber-300":"text-white/28 hover:bg-white/[0.04] hover:text-white/55"}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/[0.08]"/>
                {/* Save state */}
                {nbSaving ? (
                  <Loader2 size={11} className="animate-spin text-amber-400/55"/>
                ) : nbDirty ? (
                  <span className="text-[0.56rem] text-amber-400/55">Sauvegarde…</span>
                ) : (
                  <span className="text-[0.56rem] text-white/18">Sauvegardé</span>
                )}
                <button onClick={() => void saveNbPage(nbStrokes, false)}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[0.62rem] font-bold text-white/40 transition hover:border-white/18 hover:text-white/65">
                  <Save size={10}/> Sauver
                </button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="relative flex-1 overflow-hidden" style={{background:"#e8e6e0"}}>
              <div className="absolute inset-3 rounded-lg shadow-2xl overflow-hidden">
                <NotebookCanvas
                  pageStyle={activeNb.page_style}
                  strokes={nbStrokes}
                  onStrokesChange={handleNbStrokes}
                  tool={nbTool}
                  penColor={nbColor}
                  penWidth={NB_WIDTHS[nbWidthIdx]?.v ?? 3}
                />
              </div>
              {activePageIdx > 0 && (
                <button onClick={() => selectNbPage(activePageIdx-1)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/55 transition hover:bg-black/35">
                  <ChevronLeft size={15}/>
                </button>
              )}
              {activePageIdx < nbPages.length-1 && (
                <button onClick={() => selectNbPage(activePageIdx+1)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/55 transition hover:bg-black/35">
                  <ChevronRight size={15}/>
                </button>
              )}
            </div>
          </div>

        ) : isCanvas && !activeNb ? (
          /* ─ CANVAS empty state ─ */
          <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden p-10 text-center">
            <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full opacity-[0.06]"
              style={{background:"radial-gradient(circle,#a78bfa,transparent 70%)"}}/>
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full opacity-[0.05]"
              style={{background:"radial-gradient(circle,#a78bfa,transparent 70%)"}}/>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.16)"}}>
              <Pencil size={28} style={{color:"rgba(167,139,250,0.55)"}}/>
            </div>
            <div className="space-y-2">
              <p className="text-[1.3rem] font-black tracking-tight text-white/88">Cahiers numériques</p>
              <p className="text-[0.82rem] text-white/30 leading-relaxed max-w-[18rem] mx-auto">
                Dessinez, annotez, prenez des notes à la main — lignes, carreaux, points ou page vierge.
              </p>
            </div>
            <button onClick={() => setCreateNbOpen(true)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
              style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",boxShadow:"0 4px 18px rgba(245,158,11,0.2)"}}>
              <Plus size={14}/> Nouveau cahier
            </button>
          </div>

        ) : !selected ? (
          /* ─ NOTE empty state ─ */
          <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden p-10 text-center">
            <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full opacity-[0.07]"
              style={{background:"radial-gradient(circle,#f59e0b,transparent 70%)"}}/>
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full opacity-[0.05]"
              style={{background:"radial-gradient(circle,#f59e0b,transparent 70%)"}}/>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{background:"linear-gradient(135deg,rgba(245,158,11,0.09),rgba(245,158,11,0.03))",border:"1px solid rgba(245,158,11,0.16)",boxShadow:"0 0 40px rgba(245,158,11,0.05)"}}>
              <StickyNote size={28} style={{color:"rgba(245,158,11,0.6)"}}/>
            </div>
            <div className="space-y-2.5">
              <p className="text-[1.4rem] font-black tracking-tight text-white/90">Espace de travail</p>
              <p className="text-[0.83rem] text-white/30 leading-relaxed max-w-[20rem] mx-auto">
                Sélectionnez une note ou créez-en une nouvelle — idées, réunions, décisions, checklists.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[280px]">
              {NOTE_TYPES.slice(0,4).map(t => (
                <motion.button key={t.value} onClick={() => createNote(t.value)}
                  whileHover={{scale:1.025,y:-1}} whileTap={{scale:0.975}}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-left"
                  style={{background:`${t.color}0c`,border:`1px solid ${t.color}1c`}}>
                  <t.Icon size={14} style={{color:t.color}}/>
                  <div>
                    <p className="text-xs font-bold text-white/70">{t.label}</p>
                    <p className="text-[0.56rem] mt-0.5 truncate" style={{color:`${t.color}60`}}>{TYPE_DESC[t.value]}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <button onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] px-4 py-2 text-[0.7rem] font-semibold text-white/25 transition hover:border-white/10 hover:text-white/42">
              <Hash size={11}/> Voir les templates
            </button>
          </div>

        ) : (
          /* ─ NOTE EDITOR ─ */
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Mobile back bar */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#07080e] px-4 py-2.5 lg:hidden">
              <button onClick={() => { setMobilePanel("list"); setSelected(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-white/45 transition hover:text-white/75">
                <ArrowLeft size={14}/> Retour
              </button>
            </div>

            {/* Editor toolbar */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#07080e] px-5 py-2.5 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {NOTE_TYPES.map(t => (
                  <button key={t.value} onClick={() => { setDType(t.value); setIsDirty(true); }}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[0.62rem] font-bold transition ${dType===t.value?"":"text-white/28 hover:text-white/55"}`}
                    style={dType===t.value?{background:t.bg,color:t.color,border:`1px solid ${t.border}`}:{}}>
                    <t.Icon size={10}/>{t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {prevSnap && (
                  <button onClick={() => { setDContent(prevSnap); setPrevSnap(null); setIsDirty(true); showToast("success","Version précédente restaurée."); }}
                    className="flex items-center gap-1 rounded-lg border border-amber-500/22 bg-amber-500/7 px-2 py-1.5 text-[0.62rem] font-bold text-amber-400 transition hover:bg-amber-500/14">
                    <RotateCcw size={10}/> Annuler IA
                  </button>
                )}
                <div className="relative">
                  <button onClick={() => setExportMenu(v => !v)}
                    className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[0.62rem] font-bold text-white/35 transition hover:text-white/65">
                    <Download size={10}/> Export
                  </button>
                  <AnimatePresence>
                    {exportMenu && (
                      <motion.div initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}
                        className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0e1420] shadow-xl">
                        {[{label:"PDF",fn:exportPDF},{label:"Markdown (.md)",fn:exportMarkdown},{label:"Texte (.txt)",fn:exportTXT}].map(opt => (
                          <button key={opt.label} onClick={() => { void opt.fn(); setExportMenu(false); }}
                            className="flex w-full items-center px-4 py-2.5 text-xs font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white/85">
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => void toggleArchive()}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/28 transition hover:text-white/65"
                  title={selected.is_archived ? "Désarchiver" : "Archiver"}>
                  <Archive size={12}/>
                </button>
                <button onClick={() => setConfirmDel(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/28 transition hover:border-red-500/28 hover:text-red-400">
                  <Trash2 size={12}/>
                </button>
                <button onClick={() => void handleSave()} disabled={isSaving||!isDirty}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.62rem] font-extrabold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-35"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                  {isSaving ? <Loader2 size={10} className="animate-spin"/> : <Save size={10}/>}
                  {isSaving ? "Enreg…" : "Sauver"}
                </button>
              </div>
            </div>

            {/* Title + tags */}
            <div className="border-b border-white/[0.04] px-5 py-3">
              <input value={dTitle} onChange={e => { setDTitle(e.target.value); setIsDirty(true); }}
                placeholder="Titre de la note…"
                className="w-full bg-transparent text-xl font-extrabold text-white outline-none placeholder:text-white/12"/>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {dTags.map(t => (
                  <span key={t} onClick={() => { setDTags(p => p.filter(x => x!==t)); setIsDirty(true); }}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[0.62rem] text-white/45 transition hover:bg-red-500/14 hover:text-red-400">
                    #{t}<X size={8}/>
                  </span>
                ))}
                <input value={dTagInput} onChange={e => setDTagInput(e.target.value)}
                  onKeyDown={e => { if ((e.key==="Enter"||e.key===",") && dTagInput.trim()) { e.preventDefault(); const t=dTagInput.trim().toLowerCase().replace(/^#/,""); if (!dTags.includes(t)) { setDTags(p=>[...p,t]); setIsDirty(true); } setDTagInput(""); } }}
                  placeholder="+ tag"
                  className="w-14 bg-transparent text-[0.62rem] text-white/35 outline-none placeholder:text-white/18"/>
                {folders.length > 0 && (
                  <select value={dFolderId??""} onChange={e => { setDFolderId(e.target.value||null); setIsDirty(true); }}
                    className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[0.62rem] text-white/35 outline-none appearance-none hover:border-white/18 transition">
                    <option value="">Dossier</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
                {savedAgo && <span className="text-[0.58rem] text-white/18">Sauvegardé {savedAgo}</span>}
              </div>
            </div>

            {/* Format bar */}
            <div className="flex items-center gap-0 overflow-x-auto border-b border-white/[0.04] bg-[#07080e] px-4 py-1.5" style={{scrollbarWidth:"none"}}>
              {[
                { label:"H1",  fn:()=>insertLinePrefix("# ")          },
                { label:"H2",  fn:()=>insertLinePrefix("## ")         },
                { label:"B",   fn:()=>insertFormat("**","**")         },
                { label:"I",   fn:()=>insertFormat("*","*")           },
                { label:"`",   fn:()=>insertFormat("`","`")           },
                { label:"• ",  fn:()=>insertLinePrefix("- ")          },
                { label:"☑",   fn:()=>insertLinePrefix("- [ ] ")      },
                { label:"›",   fn:()=>insertLinePrefix("> ")          },
                { label:"lien",fn:()=>insertFormat("[","](url)")      },
                { label:"---", fn:()=>setDContent(c=>c+"\n\n---\n\n") },
              ].map((b,i) => (
                <button key={i} onClick={b.fn}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-[0.62rem] font-bold text-white/35 transition hover:bg-white/[0.05] hover:text-white/75">
                  {b.label}
                </button>
              ))}
            </div>

            {/* Editor body + AI panel */}
            <div className="flex flex-1 overflow-hidden">

              {/* Text / checklist editor */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {dType === "checklist" ? (
                  <div className="flex-1 overflow-y-auto px-5 py-4" style={{scrollbarWidth:"none"}}>
                    {getCheckProgress(dContent).total > 0 ? (
                      <>
                        <div className="mb-4">
                          <div className="mb-1 flex justify-between text-[0.58rem] text-white/28">
                            <span>Progression</span>
                            <span>{getCheckProgress(dContent).done}/{getCheckProgress(dContent).total}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-green-400" style={{width:`${getCheckProgress(dContent).total>0?Math.round((getCheckProgress(dContent).done/getCheckProgress(dContent).total)*100):0}%`,transition:"width 0.3s ease"}}/>
                          </div>
                        </div>
                        <ChecklistView content={dContent} onToggle={c => { setDContent(c); setIsDirty(true); }}/>
                      </>
                    ) : (
                      <textarea ref={textareaRef} value={dContent} onChange={e => { setDContent(e.target.value); setIsDirty(true); }}
                        placeholder={"- [ ] Tâche 1\n- [ ] Tâche 2\n- [ ] Tâche 3"}
                        className="h-full w-full resize-none bg-transparent text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20"/>
                    )}
                  </div>
                ) : (
                  <textarea ref={textareaRef} value={dContent} onChange={e => { setDContent(e.target.value); setIsDirty(true); }}
                    placeholder={dType==="code" ? "// Votre code ici…" : dType==="vocal" ? "Transcription vocale…" : "Commencez à écrire…"}
                    className={`flex-1 resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-white/82 outline-none placeholder:text-white/18 ${dType==="code"?"font-mono text-cyan-300/82":""}`}
                    style={{scrollbarWidth:"none"}}/>
                )}

                {/* Status bar + voice */}
                <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#07080e] px-5 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.58rem] text-white/18">{wordCnt} mot{wordCnt!==1?"s":""}</span>
                    <span className="text-[0.58rem] text-white/18">{dContent.length} car.</span>
                    {isDirty && <span className="text-[0.58rem] text-amber-400/55">— non sauvegardé</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {voiceState === "idle" ? (
                      <button onClick={startVoice}
                        className="flex items-center gap-1.5 rounded-lg border border-orange-500/22 bg-orange-500/7 px-2.5 py-1.5 text-[0.62rem] font-bold text-orange-400/80 transition hover:bg-orange-500/14">
                        <Mic size={10}/> Note vocale
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-orange-500/22 bg-orange-500/7 px-2.5 py-1.5">
                        <span className="text-[0.62rem] font-bold text-orange-400 tabular-nums">{fmtSec(voiceSec)}</span>
                        {voiceState==="recording"
                          ? <button onClick={pauseVoice}><Pause size={10} className="text-orange-400"/></button>
                          : <button onClick={resumeVoice}><Play size={10} className="text-orange-400"/></button>}
                        <button onClick={stopVoice}><Square size={10} className="text-red-400"/></button>
                        {voiceLoad && <Loader2 size={10} className="animate-spin text-orange-400"/>}
                        {voiceTxt && voiceState==="stopped" && (
                          <>
                            <button onClick={useVoiceText} className="text-[0.62rem] font-bold text-green-400">Utiliser</button>
                            <button onClick={discardVoice} className="text-white/28 hover:text-white/55"><X size={9}/></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked entity */}
                <div className="border-t border-white/[0.03] px-5 py-1.5">
                  <input value={dLinked} onChange={e => { setDLinked(e.target.value); setIsDirty(true); }}
                    placeholder="Lié à : client, projet, contrat…"
                    className="w-full bg-transparent text-[0.6rem] text-white/28 outline-none placeholder:text-white/14"/>
                </div>
              </div>

              {/* AI panel slide-in */}
              <AnimatePresence>
                {aiPanel && (
                  <motion.div initial={{width:0,opacity:0}} animate={{width:300,opacity:1}} exit={{width:0,opacity:0}}
                    transition={{duration:0.28,ease}}
                    className="overflow-hidden border-l border-white/[0.06] bg-[#07080e]"
                    style={{minWidth:0}}>
                    <div className="flex h-full w-[300px] flex-col p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain size={13} style={{color:amber}}/>
                          <span className="text-xs font-extrabold text-white">Assistant IA</span>
                        </div>
                        <button onClick={() => { setAiPanel(false); setAiResult(""); }} className="text-white/28 hover:text-white/65">
                          <X size={13}/>
                        </button>
                      </div>

                      {aiAction === "chat" && (
                        <div className="mb-3">
                          <textarea value={chatPrompt} onChange={e => setChatPrompt(e.target.value)}
                            placeholder="Instruction : résume, corrige, traduis, génère…"
                            rows={3}
                            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-amber-400/28"/>
                          <button onClick={() => void callAI("chat", chatPrompt)} disabled={aiLoading||!chatPrompt.trim()}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-[#0a0a0a] disabled:opacity-35"
                            style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                            {aiLoading ? <Loader2 size={11} className="animate-spin"/> : <MessageSquare size={11}/>} Envoyer
                          </button>
                        </div>
                      )}

                      {aiLoading && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3">
                          <Loader2 size={20} className="animate-spin" style={{color:amber}}/>
                          <p className="text-xs text-white/35">IA en cours…</p>
                        </div>
                      )}

                      {!aiLoading && aiResult && (
                        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                          <div className="flex-1 overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3" style={{scrollbarWidth:"none"}}>
                            <pre className="whitespace-pre-wrap text-[0.68rem] leading-relaxed text-white/72">{aiResult}</pre>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={applyAiResult}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold text-[#0a0a0a]"
                              style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                              <Check size={11}/> Appliquer
                            </button>
                            <button onClick={() => { setAiResult(""); setChatPrompt(""); }}
                              className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.08] py-2 text-xs font-bold text-white/45">
                              Écarter
                            </button>
                          </div>
                        </div>
                      )}

                      {!aiLoading && !aiResult && aiAction !== "chat" && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2">
                          <Sparkles size={18} className="text-white/12"/>
                          <p className="text-xs text-white/22 text-center">Résultat IA ici</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI actions bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.05] bg-[#07080e] px-5 py-2.5" style={{scrollbarWidth:"none"}}>
              {AI_ACTIONS.map(a => (
                <button key={a.action}
                  onClick={() => {
                    if (a.action === "chat") { setAiAction("chat"); setAiPanel(true); setAiResult(""); }
                    else void callAI(a.action);
                  }}
                  disabled={aiLoading}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.62rem] font-bold transition hover:opacity-80 disabled:opacity-28"
                  style={{color:a.color,borderColor:`${a.color}28`,background:`${a.color}0e`}}>
                  <a.icon size={10}/>{a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ MOBILE BOTTOM BAR ══ */}
      <div className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-white/[0.06] bg-[#0e1420]/95 px-2 pb-safe backdrop-blur-sm lg:hidden"
        style={{paddingBottom:"max(env(safe-area-inset-bottom), 8px)", paddingTop:"8px"}}>
        <button onClick={() => setMobilePanel("list")}
          className={`flex flex-col items-center gap-1 px-4 py-1 ${mobilePanel === "list" ? "text-white" : "text-white/35"}`}>
          <StickyNote size={18}/>
          <span className="text-[0.55rem] font-bold">Notes</span>
        </button>
        <button onClick={() => createNote("texte")}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#0a0a0a] transition active:scale-95"
          style={{background:`linear-gradient(135deg,${amber},#d97706)`,boxShadow:`0 4px 16px rgba(245,158,11,0.3)`}}>
          <Plus size={20}/>
        </button>
        <button onClick={() => { setFolderModal(true); }}
          className="flex flex-col items-center gap-1 px-4 py-1 text-white/35">
          <Folder size={18}/>
          <span className="text-[0.55rem] font-bold">Dossiers</span>
        </button>
        {mobilePanel === "editor" && selected ? (
          <button onClick={() => { setMobilePanel("list"); setSelected(null); }}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35">
            <ArrowLeft size={18}/>
            <span className="text-[0.55rem] font-bold">Retour</span>
          </button>
        ) : (
          <button onClick={() => setShowTemplates(true)}
            className="flex flex-col items-center gap-1 px-4 py-1 text-white/35">
            <Hash size={18}/>
            <span className="text-[0.55rem] font-bold">Templates</span>
          </button>
        )}
      </div>

      {/* ══ MODALS ══ */}

      {/* Templates */}
      <AnimatePresence>
        {showTemplates && (
          <>
            <motion.div key="tb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowTemplates(false)}/>
            <motion.div key="td" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-2xl -translate-y-1/2 rounded-2xl border border-white/[0.09] bg-[#0e1420] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">Templates</h2>
                <button onClick={() => setShowTemplates(false)} className="text-white/30 hover:text-white/65"><X size={15}/></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map(t => {
                  const TIcon = t.icon;
                  return (
                    <button key={t.label}
                      onClick={() => { createNote(t.type, t.content); setShowTemplates(false); }}
                      className="flex flex-col items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition hover:border-white/14 hover:bg-white/[0.055]">
                      <TIcon size={20} className="text-white/45 mb-0.5"/>
                      <span className="text-sm font-extrabold text-white">{t.label}</span>
                      <span className="text-[0.62rem] text-white/32 line-clamp-2">{t.content.slice(0,80)}…</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Folder modal */}
      <AnimatePresence>
        {folderModal && (
          <>
            <motion.div key="fb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setFolderModal(false)}/>
            <motion.div key="fd" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-white/[0.09] bg-[#0e1420] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">Nouveau dossier</h2>
                <button onClick={() => setFolderModal(false)} className="text-white/30 hover:text-white/65"><X size={14}/></button>
              </div>
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key==="Enter" && void handleCreateFolder()}
                placeholder="Nom du dossier"
                className="mb-4 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-400/32"/>
              <div className="mb-5 flex flex-wrap gap-2">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setNewFolderColor(c)}
                    className="h-7 w-7 rounded-full transition hover:scale-110"
                    style={{background:c,outline:newFolderColor===c?"2px solid white":"none",outlineOffset:"2px"}}/>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setFolderModal(false)}
                  className="flex-1 rounded-xl border border-white/[0.09] py-2.5 text-sm font-semibold text-white/45">Annuler</button>
                <button onClick={() => void handleCreateFolder()} disabled={!newFolderName.trim()}
                  className="flex-1 rounded-xl py-2.5 text-sm font-extrabold text-[#0a0a0a] disabled:opacity-35"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>Créer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div initial={{scale:0.93,y:16,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.95,opacity:0}}
              transition={{duration:0.25,ease}}
              className="w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#0e1420] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/18 bg-red-500/9">
                <Trash2 size={16} className="text-red-400"/>
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer cette note ?</h3>
              <p className="mt-1.5 text-sm text-white/38">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmDel(false)}
                  className="flex-1 rounded-xl border border-white/[0.09] py-2.5 text-sm font-semibold text-white/55">Annuler</button>
                <button onClick={() => void handleDelete()}
                  className="flex-1 rounded-xl bg-red-500/75 py-2.5 text-sm font-bold text-white transition hover:bg-red-500">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Notebook modal */}
      <AnimatePresence>
        {createNbOpen && (
          <>
            <motion.div key="nb-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => { if (!nbCreating) setCreateNbOpen(false); }}/>
            <motion.div key="nb-modal" initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              transition={{duration:0.26,ease}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-[#0e1420] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`${amber}16`,border:`1px solid ${amber}24`}}>
                    <Book size={14} style={{color:amber}}/>
                  </div>
                  <h2 className="text-base font-black text-white">Nouveau cahier</h2>
                </div>
                <button onClick={() => setCreateNbOpen(false)} className="text-white/28 transition hover:text-white/65">
                  <X size={16}/>
                </button>
              </div>

              <label className="block mb-4">
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/28 block mb-2">Nom du cahier</span>
                <input autoFocus value={nbName} onChange={e => setNbName(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && nbName.trim() && void createNotebook()}
                  placeholder="Ex : Réunions clients Q3…"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-amber-400/38"/>
              </label>

              <div className="mb-4">
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/28 block mb-2.5">Couverture</span>
                <div className="grid grid-cols-5 gap-2">
                  {NB_COVERS.map(c => (
                    <button key={c.id} onClick={() => setNbCoverId(c.id)}
                      className={`relative h-10 rounded-xl overflow-hidden transition-transform hover:scale-105 ${nbCoverId===c.id?"ring-2 ring-amber-400 ring-offset-1 ring-offset-[#161b22]":""}`}
                      style={{background:c.g}} title={c.label}>
                      {nbCoverId===c.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={11} className="text-white drop-shadow"/>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/28 block mb-2.5">Style de page</span>
                <div className="grid grid-cols-5 gap-2">
                  {NB_PAGE_STYLES.map(s => (
                    <button key={s.value} onClick={() => setNbPageStyleV(s.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-center transition-all ${nbPageStyleV===s.value?"border-amber-400/38 bg-amber-400/[0.07]":"border-white/[0.07] bg-white/[0.02] hover:border-white/14"}`}>
                      <s.Icon size={14} className={nbPageStyleV===s.value?"text-amber-300":"text-white/32"}/>
                      <span className={`text-[0.55rem] font-bold ${nbPageStyleV===s.value?"text-amber-300":"text-white/28"}`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-5 flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="relative w-10 h-14 shrink-0">
                  <div className="absolute left-0 inset-y-0 w-[14%] rounded-l-sm" style={{background:NB_COVERS.find(c=>c.id===nbCoverId)?.s??""}}/>
                  <div className="absolute left-[12%] inset-y-0 right-0 rounded-r-sm overflow-hidden" style={{background:NB_COVERS.find(c=>c.id===nbCoverId)?.g??""}}/>
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">{nbName || "Mon cahier"}</p>
                  <p className="text-[0.62rem] text-white/28 mt-0.5">
                    {NB_PAGE_STYLES.find(s=>s.value===nbPageStyleV)?.label} · {NB_COVERS.find(c=>c.id===nbCoverId)?.label}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCreateNbOpen(false)} disabled={nbCreating}
                  className="flex-1 rounded-xl border border-white/[0.09] py-2.5 text-sm font-semibold text-white/45 transition hover:border-white/18 hover:text-white/65">
                  Annuler
                </button>
                <button onClick={() => void createNotebook()} disabled={!nbName.trim()||nbCreating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-38"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                  {nbCreating ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                  Créer le cahier
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>{toast && <Toast toast={toast} onClose={() => setToast(null)}/>}</AnimatePresence>
    </div>
  );
}
