"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mic, X, Pin, Archive, Trash2, Palette,
  Loader2, Plus, Check, AlignLeft, RotateCcw,
  StopCircle, Hash, Pencil, Globe, ArrowRight,
  FileText, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Toast, { type ToastData } from "@/components/ui/Toast";

type NoteType  = "text" | "checklist" | "voice";
type FilterKey = "all" | "pinned" | "checklist" | "voice" | "archived";

interface Item { id: string; text: string; done: boolean }
interface QNote {
  id: string; type: NoteType; title: string; content: string;
  items: Item[]; color: string; tags: string[];
  is_pinned: boolean; is_archived: boolean;
  reminder_at: string | null; created_at: string; updated_at: string;
}

const PAL = [
  { bg: "#1a1a2e", ac: "#a78bfa" },
  { bg: "#2d1515", ac: "#f87171" },
  { bg: "#2d1f12", ac: "#fb923c" },
  { bg: "#2b2a12", ac: "#fbbf24" },
  { bg: "#122d1c", ac: "#34d399" },
  { bg: "#122b29", ac: "#2dd4bf" },
  { bg: "#12202d", ac: "#60a5fa" },
  { bg: "#1e122d", ac: "#c084fc" },
  { bg: "#2d1220", ac: "#f472b6" },
];

const FILTERS: { key: FilterKey; label: string; icon: LucideIcon }[] = [
  { key: "all",       label: "Tout",      icon: AlignLeft },
  { key: "pinned",    label: "Épinglées", icon: Pin },
  { key: "checklist", label: "Tâches",    icon: Check },
  { key: "voice",     label: "Vocales",   icon: Mic },
  { key: "archived",  label: "Archives",  icon: Archive },
];

const AI_ACTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "correct",   label: "Corriger",   icon: Pencil },
  { id: "summarize", label: "Résumer",    icon: AlignLeft },
  { id: "to-tasks",  label: "Tâches",     icon: ArrowRight },
  { id: "rephrase",  label: "Reformuler", icon: RotateCcw },
  { id: "translate", label: "Traduire",   icon: Globe },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const acOf = (color: string) => PAL.find(p => p.bg === color)?.ac ?? "#a78bfa";

function parseRow(row: Record<string, unknown>): QNote {
  const content = (row.content as string) ?? "";
  let items: Item[] = [];
  if (row.type === "checklist") {
    try { items = JSON.parse(content); } catch { items = []; }
  }
  return {
    id:          row.id as string,
    type:        (row.type as NoteType) ?? "text",
    title:       (row.title as string) ?? "",
    content,
    items,
    color:       (row.color as string) ?? PAL[0].bg,
    tags:        (row.tags as string[]) ?? [],
    is_pinned:   Boolean(row.is_pinned),
    is_archived: Boolean(row.is_archived),
    reminder_at: (row.reminder_at as string | null) ?? null,
    created_at:  (row.created_at as string) ?? "",
    updated_at:  (row.updated_at as string) ?? "",
  };
}

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000)     return "À l'instant";
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)} min`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ActionBtn({
  children, onClick, title, danger = false,
}: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-all ${danger
        ? "text-white/40 hover:text-red-400 hover:bg-red-500/15"
        : "text-white/40 hover:text-white hover:bg-white/10"}`}>
      {children}
    </button>
  );
}

function NoteCard({
  note, onOpen, onPin, onArchive, onDelete, onColor,
}: {
  note: QNote; onOpen: () => void; onPin: () => void;
  onArchive: () => void; onDelete: () => void; onColor: (c: string) => void;
}) {
  const [hover,   setHover]   = useState(false);
  const [showPal, setShowPal] = useState(false);
  const ac = acOf(note.color);

  return (
    <motion.div layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="relative rounded-2xl border cursor-pointer"
      style={{ background: note.color, borderColor: hover ? ac : `${ac}30` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowPal(false); }}
      onClick={() => !showPal && onOpen()}>

      {note.is_pinned && (
        <div className="absolute top-2.5 right-2.5 z-10" style={{ color: ac }}>
          <Pin size={11} fill="currentColor" />
        </div>
      )}

      <div className="p-4 pb-2 min-h-[90px]">
        {note.title && <p className="font-semibold text-sm text-white mb-1.5 line-clamp-1 pr-5">{note.title}</p>}

        {note.type === "checklist" ? (
          <div className="space-y-1.5">
            {note.items.slice(0, 4).map(i => (
              <div key={i.id} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: ac, background: i.done ? ac : "transparent" }}>
                  {i.done && <Check size={9} className="text-black" strokeWidth={3} />}
                </div>
                <span className={`text-xs leading-tight ${i.done ? "line-through text-white/30" : "text-white/65"}`}>{i.text}</span>
              </div>
            ))}
            {note.items.length > 4 && <span className="text-[10px] text-white/25">+{note.items.length - 4} autres</span>}
          </div>
        ) : note.type === "voice" ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${ac}20` }}>
              <Mic size={13} style={{ color: ac }} />
            </div>
            <p className="text-xs text-white/55 line-clamp-3 flex-1">{note.content || "Note vocale"}</p>
          </div>
        ) : (
          <p className="text-xs text-white/60 line-clamp-5 whitespace-pre-line leading-relaxed">{note.content}</p>
        )}
      </div>

      {note.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border"
              style={{ borderColor: `${ac}40`, color: ac, background: `${ac}12` }}>#{t}</span>
          ))}
        </div>
      )}

      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] text-white/20">{relTime(note.updated_at)}</span>
        {note.type === "checklist" && note.items.length > 0 && (
          <span className="text-[10px] text-white/20">
            {note.items.filter(i => i.done).length}/{note.items.length}
          </span>
        )}
      </div>

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 rounded-b-2xl"
            style={{ background: `linear-gradient(transparent, ${note.color}e0 35%, ${note.color})` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex gap-0.5">
              <ActionBtn onClick={onPin} title={note.is_pinned ? "Désépingler" : "Épingler"}>
                <Pin size={13} fill={note.is_pinned ? "currentColor" : "none"} />
              </ActionBtn>
              <ActionBtn onClick={onArchive} title="Archiver"><Archive size={13} /></ActionBtn>
              <ActionBtn onClick={onDelete} title="Supprimer" danger><Trash2 size={13} /></ActionBtn>
            </div>
            <div className="relative">
              <ActionBtn onClick={() => setShowPal(p => !p)} title="Couleur"><Palette size={13} /></ActionBtn>
              <AnimatePresence>
                {showPal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute bottom-9 right-0 flex gap-1 p-2 rounded-xl border border-white/10 shadow-xl z-50 bg-[#1a1a2e]">
                    {PAL.map(p => (
                      <button key={p.bg}
                        onClick={() => { onColor(p.bg); setShowPal(false); }}
                        className="w-5 h-5 rounded-full border-2 hover:scale-125 transition-transform"
                        style={{ background: p.bg, borderColor: note.color === p.bg ? p.ac : "transparent" }} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BlocNotePage() {


  const [notes,   setNotes]   = useState<QNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<FilterKey>("all");
  const [toastData, setToastData] = useState<ToastData | null>(null);

    const [creating, setCreating] = useState(false);
  const [dType,    setDType]    = useState<NoteType>("text");
  const [dTitle,   setDTitle]   = useState("");
  const [dContent, setDContent] = useState("");
  const [dItems,   setDItems]   = useState<Item[]>([{ id: uid(), text: "", done: false }]);
  const [dColor,   setDColor]   = useState(PAL[0].bg);
  const [dTags,    setDTags]    = useState<string[]>([]);
  const [dTagIn,   setDTagIn]   = useState("");
  const [showDPal, setShowDPal] = useState(false);
  const createRef   = useRef<HTMLDivElement>(null);
  const cTextRef    = useRef<HTMLTextAreaElement>(null);
  const cItemRef    = useRef<HTMLInputElement>(null);

    const [editNote, setEditNote] = useState<QNote | null>(null);
  const [eDraft,   setEDraft]   = useState<Partial<QNote>>({});
  const [saving,   setSaving]   = useState(false);
  const [showEPal, setShowEPal] = useState(false);
  const [eTagIn,   setETagIn]   = useState("");

    const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState("");
  const [aiAction,  setAiAction]  = useState("");

    const [recording,    setRecording]    = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

    const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("quick_notes").select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at",  { ascending: false });
    setNotes((data ?? []).map((r: Record<string, unknown>) => parseRow(r)));
    setLoading(false);

  }, []);

  useEffect(() => { load(); }, [load]);

    useEffect(() => {
    if (!creating) return;
    const fn = (e: MouseEvent) => {
      if (!createRef.current?.contains(e.target as Node)) commitCreate();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);

  }, [creating, dTitle, dContent, dItems, dColor, dTags]);

    const visible = useMemo(() => {
    let l = notes;
    if      (filter === "archived")   l = l.filter(n =>  n.is_archived);
    else if (filter === "pinned")     l = l.filter(n =>  n.is_pinned && !n.is_archived);
    else if (filter === "checklist")  l = l.filter(n =>  n.type === "checklist" && !n.is_archived);
    else if (filter === "voice")      l = l.filter(n =>  n.type === "voice" && !n.is_archived);
    else                              l = l.filter(n => !n.is_archived);
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return l;
  }, [notes, filter, search]);

  const pinned = visible.filter(n =>  n.is_pinned);
  const others = visible.filter(n => !n.is_pinned);

    function openCreate(type: NoteType = "text") {
    setDType(type); setDTitle(""); setDContent("");
    setDItems([{ id: uid(), text: "", done: false }]);
    setDColor(PAL[0].bg); setDTags([]); setDTagIn(""); setShowDPal(false);
    setCreating(true);
    if (type === "voice") startRec(true);
    else setTimeout(() => { (type === "checklist" ? cItemRef : cTextRef).current?.focus(); }, 80);
  }

  async function commitCreate() {
    if (!creating) return;
    const has = dType === "checklist" ? dItems.some(i => i.text.trim()) : dContent.trim() || dTitle.trim();
    if (!has) { setCreating(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const content = dType === "checklist"
      ? JSON.stringify(dItems.filter(i => i.text.trim()))
      : dContent;

    const { data, error } = await supabase.from("quick_notes").insert({
      user_id: user.id, type: dType, title: dTitle, content,
      color: dColor, tags: dTags, is_pinned: false, is_archived: false,
    }).select().single();

    if (error) { setToastData({ type: "error", msg: "Erreur de sauvegarde" }); return; }
    setNotes(p => [parseRow(data as Record<string, unknown>), ...p]);
    setCreating(false);
    setToastData({ type: "success", msg: "Note créée" });
  }

    const dAddItem  = () => setDItems(p => [...p, { id: uid(), text: "", done: false }]);
  const dToggle   = (id: string) => setDItems(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const dSetText  = (id: string, text: string) => setDItems(p => p.map(i => i.id === id ? { ...i, text } : i));
  const dRemove   = (id: string) => setDItems(p => p.filter(i => i.id !== id));

    async function patchNote(id: string, changes: Partial<QNote>) {
    const db: Record<string, unknown> = { ...changes };
    if (changes.items !== undefined) { db.content = JSON.stringify(changes.items); delete db.items; }
    delete db.id; delete db.created_at;
    await supabase.from("quick_notes").update(db).eq("id", id);
    setNotes(p => p.map(n => n.id === id ? { ...n, ...changes } : n));
    if (editNote?.id === id) setEditNote(p => p ? { ...p, ...changes } : null);
  }

  async function delNote(id: string) {
    await supabase.from("quick_notes").delete().eq("id", id);
    setNotes(p => p.filter(n => n.id !== id));
    if (editNote?.id === id) setEditNote(null);
    setToastData({ type: "success", msg: "Supprimée" });
  }

    async function startRec(forDraft = false) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        transcribeBlob(blob, forDraft);
      };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { setToastData({ type: "error", msg: "Micro non disponible" }); }
  }

  function stopRec() { mediaRef.current?.stop(); setRecording(false); }

  async function transcribeBlob(blob: Blob, forDraft: boolean) {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("file", blob, "audio.webm");
      const res = await fetch("/api/notes/transcribe", { method: "POST", body: form });
      const { text = "" } = await res.json() as { text?: string };
      if (forDraft) setDContent(p => (p ? `${p}\n${text}` : text).trim());
      else setEDraft(p => ({ ...p, content: (`${p.content ?? editNote?.content ?? ""}\n${text}`).trim() }));
    } catch { setToastData({ type: "error", msg: "Transcription échouée" }); }
    finally { setTranscribing(false); }
  }

    async function callAI(action: string, content: string) {
    if (!content.trim()) { setToastData({ type: "error", msg: "Contenu vide" }); return; }
    setAiLoading(true); setAiAction(action); setAiResult("");
    try {
      const r = await fetch("/api/notes/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content }),
      });
      const j = await r.json() as { result?: string; error?: string };
      setAiResult(j.result ?? j.error ?? "Erreur");
    } catch { setAiResult("Erreur réseau"); }
    finally { setAiLoading(false); }
  }

  function applyAI() {
    if (!aiResult || !editNote) return;
    const replaces = ["correct","rephrase","translate","improve"].includes(aiAction);
    setEDraft(p => ({
      ...p,
      content: replaces ? aiResult : (`${p.content ?? editNote.content}\n\n${aiResult}`),
    }));
    setAiResult(""); setAiAction("");
  }

    function openEdit(n: QNote) {
    setEditNote(n); setEDraft({ ...n });
    setAiResult(""); setAiAction(""); setShowEPal(false); setETagIn("");
  }

  async function saveEdit() {
    if (!editNote) return;
    setSaving(true);
    await patchNote(editNote.id, eDraft as Partial<QNote>);
    setSaving(false);
    setToastData({ type: "success", msg: "Sauvegardé" });
  }

  const eItems: Item[] = (eDraft.type ?? editNote?.type) === "checklist"
    ? (eDraft.items ?? editNote?.items ?? []) : [];

  const eUpdateItems = (fn: (p: Item[]) => Item[]) =>
    setEDraft(p => ({ ...p, items: fn(p.items ?? editNote?.items ?? []) }));

  const editAc  = acOf(eDraft.color  ?? editNote?.color  ?? PAL[0].bg);
  const editBg  =      eDraft.color  ?? editNote?.color  ?? PAL[0].bg;
  const eTags   =      eDraft.tags   ?? editNote?.tags   ?? [];

    return (
    <div className="min-h-screen bg-[#0a0f1e] text-white pb-24">
      <AnimatePresence>
        {toastData && <Toast toast={toastData} onClose={() => setToastData(null)} />}
      </AnimatePresence>

            <div className="sticky top-0 z-30 bg-[#0a0f1e]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <FileText size={20} className="text-emerald-400"/>
            <h1 className="font-bold text-lg">Bloc Note</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              Capture rapide
            </span>
          </div>
          <div className="relative w-48 sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-8 pr-7 py-1.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
          <span className="text-xs text-white/25 hidden sm:block">
            {notes.filter(n => !n.is_archived).length} note{notes.filter(n => !n.is_archived).length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

                <div ref={createRef}>
          {!creating ? (
            <div className="flex gap-2 flex-wrap">
              {(["text","checklist","voice"] as NoteType[]).map(t => (
                <button key={t} onClick={() => openCreate(t)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-sm text-white/55 hover:text-white transition-all">
                  {t === "text"      && <><AlignLeft size={15} />Texte</>}
                  {t === "checklist" && <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Checklist</>}
                  {t === "voice"     && <><Mic size={15} />Vocal</>}
                </button>
              ))}
              <button onClick={() => openCreate()}
                className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                <Plus size={15} />Nouvelle
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
              className="rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: dColor, borderColor: `${acOf(dColor)}40` }}>

                            <div className="flex gap-1 px-4 pt-3">
                {(["text","checklist","voice"] as NoteType[]).map(t => (
                  <button key={t} onClick={() => { setDType(t); if (t === "voice") startRec(true); }}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: dType === t ? `${acOf(dColor)}30` : "transparent",
                      color:      dType === t ? acOf(dColor) : "rgba(255,255,255,.35)",
                    }}>
                    {t === "text" ? "Texte" : t === "checklist" ? "Checklist" : "Vocal"}
                  </button>
                ))}
              </div>

                            <input value={dTitle} onChange={e => setDTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full px-4 py-2 bg-transparent text-sm font-semibold text-white placeholder:text-white/20 focus:outline-none" />

                            {dType === "text" && (
                <textarea ref={cTextRef} value={dContent} onChange={e => setDContent(e.target.value)}
                  placeholder="Écris ta note ici…" rows={4}
                  className="w-full px-4 py-1 bg-transparent text-sm text-white/75 placeholder:text-white/20 focus:outline-none resize-none leading-relaxed" />
              )}

              {dType === "checklist" && (
                <div className="px-4 py-1 space-y-2">
                  {dItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <button onClick={() => dToggle(item.id)}
                        className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all"
                        style={{ borderColor: acOf(dColor), background: item.done ? acOf(dColor) : "transparent" }}>
                        {item.done && <Check size={9} className="text-black" strokeWidth={3} />}
                      </button>
                      <input ref={idx === 0 ? cItemRef : undefined}
                        value={item.text} onChange={e => dSetText(item.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") { e.preventDefault(); dAddItem(); }
                          if (e.key === "Backspace" && !item.text && dItems.length > 1) dRemove(item.id);
                        }}
                        placeholder="Élément…"
                        className="flex-1 bg-transparent text-sm text-white/75 placeholder:text-white/20 focus:outline-none" />
                      {dItems.length > 1 && (
                        <button onClick={() => dRemove(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={dAddItem} className="flex items-center gap-1 text-xs mt-1 transition-all"
                    style={{ color: acOf(dColor) }}>
                    <Plus size={12} />Ajouter
                  </button>
                </div>
              )}

              {dType === "voice" && (
                <div className="px-4 py-2 space-y-2">
                  {recording ? (
                    <button onClick={stopRec}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm animate-pulse">
                      <StopCircle size={14} />Arrêter l&apos;enregistrement
                    </button>
                  ) : transcribing ? (
                    <span className="flex items-center gap-2 text-sm text-white/40">
                      <Loader2 size={13} className="animate-spin" />Transcription en cours…
                    </span>
                  ) : (
                    <button onClick={() => startRec(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                      style={{ background: `${acOf(dColor)}15`, border: `1px solid ${acOf(dColor)}35`, color: acOf(dColor) }}>
                      <Mic size={14} />Enregistrer
                    </button>
                  )}
                  {dContent && (
                    <p className="text-xs text-white/55 bg-white/5 rounded-xl p-3 whitespace-pre-line leading-relaxed">
                      {dContent}
                    </p>
                  )}
                </div>
              )}

                            <div className="flex items-center gap-2 px-4 pb-3 pt-2 flex-wrap border-t border-white/5 mt-2">
                <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                  {dTags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${acOf(dColor)}18`, color: acOf(dColor) }}>
                      #{t}<button onClick={() => setDTags(p => p.filter(x => x !== t))}><X size={8} /></button>
                    </span>
                  ))}
                  <input value={dTagIn} onChange={e => setDTagIn(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === " ") && dTagIn.trim()) {
                        e.preventDefault();
                        const tag = dTagIn.trim().replace(/^#/, "");
                        if (tag && !dTags.includes(tag)) setDTags(p => [...p, tag]);
                        setDTagIn("");
                      }
                    }}
                    placeholder="#tag"
                    className="text-xs bg-transparent text-white/50 placeholder:text-white/15 focus:outline-none w-14" />
                </div>
                <div className="relative">
                  <button onClick={() => setShowDPal(p => !p)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                    <Palette size={14} />
                  </button>
                  <AnimatePresence>
                    {showDPal && (
                      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                        className="absolute bottom-9 right-0 flex gap-1 p-2 rounded-xl border border-white/10 shadow-xl z-50 bg-[#1a1a2e]">
                        {PAL.map(p => (
                          <button key={p.bg}
                            onClick={() => { setDColor(p.bg); setShowDPal(false); }}
                            className="w-5 h-5 rounded-full border-2 hover:scale-125 transition-transform"
                            style={{ background: p.bg, borderColor: dColor === p.bg ? p.ac : "transparent" }} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => setCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-white/35 hover:text-white hover:bg-white/10 transition-all">
                  Annuler
                </button>
                <button onClick={commitCreate}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: `${acOf(dColor)}22`, color: acOf(dColor), border: `1px solid ${acOf(dColor)}40` }}>
                  Enregistrer
                </button>
              </div>
            </motion.div>
          )}
        </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: filter === f.key ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.04)",
                color:      filter === f.key ? "#10b981" : "rgba(255,255,255,.4)",
                border:     `1px solid ${filter === f.key ? "rgba(16,185,129,.28)" : "rgba(255,255,255,.07)"}`,
              }}>
              <f.icon size={11}/>{f.label}
            </button>
          ))}
        </div>

                {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-white/25" />
          </div>
        )}

                {!loading && (
          <>
            {pinned.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Pin size={10} />Épinglées
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {pinned.map(n => (
                      <NoteCard key={n.id} note={n}
                        onOpen={() => openEdit(n)}
                        onPin={() => patchNote(n.id, { is_pinned: !n.is_pinned })}
                        onArchive={() => patchNote(n.id, { is_archived: true, is_pinned: false })}
                        onDelete={() => delNote(n.id)}
                        onColor={c => patchNote(n.id, { color: c })} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3">Autres</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {others.map(n => (
                      <NoteCard key={n.id} note={n}
                        onOpen={() => openEdit(n)}
                        onPin={() => patchNote(n.id, { is_pinned: !n.is_pinned })}
                        onArchive={() => patchNote(n.id, { is_archived: !n.is_archived })}
                        onDelete={() => delNote(n.id)}
                        onColor={c => patchNote(n.id, { color: c })} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {visible.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  {filter === "archived" ? <Archive size={28} className="text-white/25"/> : filter === "voice" ? <Mic size={28} className="text-white/25"/> : filter === "checklist" ? <Check size={28} className="text-white/25"/> : <FileText size={28} className="text-white/25"/>}
                </div>
                <div>
                  <p className="text-white/45 font-medium">
                    {search ? "Aucun résultat" : "Aucune note"}
                  </p>
                  <p className="text-sm text-white/25 mt-1">
                    {search ? `Rien pour "${search}"` : "Crée ta première note rapide"}
                  </p>
                </div>
                {!search && filter === "all" && (
                  <button onClick={() => openCreate()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                    <Plus size={15} />Créer une note
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

            <AnimatePresence>
        {editNote && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => { saveEdit(); setEditNote(null); }} />

            <motion.div
              initial={{ opacity:0, scale:0.94, y:16 }}
              animate={{ opacity:1, scale:1,    y:0  }}
              exit={{   opacity:0, scale:0.94, y:16 }}
              className="fixed inset-x-4 top-[4%] bottom-[4%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-50 rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
              style={{ background: editBg, borderColor: `${editAc}45` }}
              onClick={e => e.stopPropagation()}>

                            <div className="flex items-center gap-2 px-5 pt-4 pb-1 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full border"
                  style={{ borderColor:`${editAc}40`, color:editAc, background:`${editAc}12` }}>
                  {(eDraft.type ?? editNote.type) === "text" ? "Texte"
                    : (eDraft.type ?? editNote.type) === "checklist" ? "Checklist" : "Vocal"}
                </span>
                <span className="text-xs text-white/20 ml-auto">{relTime(editNote.updated_at)}</span>
                <button onClick={() => patchNote(editNote.id, { is_pinned: !editNote.is_pinned })}
                  style={{ color: editNote.is_pinned ? editAc : "rgba(255,255,255,.3)" }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                  <Pin size={14} fill={editNote.is_pinned ? "currentColor" : "none"} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowEPal(p => !p)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                    <Palette size={14} />
                  </button>
                  <AnimatePresence>
                    {showEPal && (
                      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                        className="absolute top-9 right-0 flex gap-1 p-2 rounded-xl border border-white/10 shadow-xl z-50 bg-[#1a1a2e]">
                        {PAL.map(p => (
                          <button key={p.bg}
                            onClick={() => { setEDraft(prev => ({ ...prev, color: p.bg })); setShowEPal(false); }}
                            className="w-5 h-5 rounded-full border-2 hover:scale-125 transition-transform"
                            style={{ background: p.bg, borderColor: editBg === p.bg ? p.ac : "transparent" }} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => { saveEdit(); setEditNote(null); }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  <X size={15} />
                </button>
              </div>

                            <input value={eDraft.title ?? ""}
                onChange={e => setEDraft(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre…"
                className="px-5 py-1.5 bg-transparent font-bold text-base text-white placeholder:text-white/18 focus:outline-none flex-shrink-0" />

                            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3 min-h-0">

                {(eDraft.type ?? editNote.type) === "text" && (
                  <textarea value={eDraft.content ?? ""}
                    onChange={e => setEDraft(p => ({ ...p, content: e.target.value }))}
                    placeholder="Contenu…"
                    className="w-full bg-transparent text-sm text-white/72 placeholder:text-white/18 focus:outline-none resize-none leading-relaxed min-h-[160px]" />
                )}

                {(eDraft.type ?? editNote.type) === "voice" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {recording ? (
                        <button onClick={stopRec}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs animate-pulse">
                          <StopCircle size={13} />Arrêter
                        </button>
                      ) : transcribing ? (
                        <span className="flex items-center gap-2 text-xs text-white/35">
                          <Loader2 size={12} className="animate-spin" />Transcription…
                        </span>
                      ) : (
                        <button onClick={() => startRec(false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                          style={{ background:`${editAc}12`, border:`1px solid ${editAc}30`, color:editAc }}>
                          <Mic size={13} />Ajouter vocal
                        </button>
                      )}
                    </div>
                    <textarea value={eDraft.content ?? ""}
                      onChange={e => setEDraft(p => ({ ...p, content: e.target.value }))}
                      placeholder="Transcription…"
                      className="w-full bg-white/5 rounded-xl p-3 text-sm text-white/70 placeholder:text-white/18 focus:outline-none resize-none leading-relaxed min-h-[120px] border border-white/10" />
                  </div>
                )}

                {(eDraft.type ?? editNote.type) === "checklist" && (
                  <div className="space-y-2">
                    {eItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2.5 group">
                        <button
                          onClick={() => eUpdateItems(p => p.map(i => i.id === item.id ? { ...i, done: !i.done } : i))}
                          className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all"
                          style={{ borderColor: editAc, background: item.done ? editAc : "transparent" }}>
                          {item.done && <Check size={11} className="text-black" strokeWidth={3} />}
                        </button>
                        <input value={item.text}
                          onChange={e => eUpdateItems(p => p.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); eUpdateItems(p => [...p, { id: uid(), text: "", done: false }]); }
                          }}
                          className={`flex-1 bg-transparent text-sm focus:outline-none ${item.done ? "line-through text-white/28" : "text-white/75"}`} />
                        <button onClick={() => eUpdateItems(p => p.filter(i => i.id !== item.id))}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => eUpdateItems(p => [...p, { id: uid(), text: "", done: false }])}
                      className="flex items-center gap-1 text-xs transition-all" style={{ color: editAc }}>
                      <Plus size={12} />Ajouter
                    </button>
                    {eItems.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/8">
                        <div className="flex justify-between text-[10px] text-white/25 mb-1">
                          <span>{eItems.filter(i => i.done).length}/{eItems.length} fait{eItems.filter(i=>i.done).length>1?"s":""}</span>
                          <span>{Math.round(eItems.filter(i=>i.done).length/eItems.length*100)}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full">
                          <div className="h-full rounded-full transition-all"
                            style={{ width:`${Math.round(eItems.filter(i=>i.done).length/eItems.length*100)}%`, background:editAc }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                                <div className="border-t border-white/8 pt-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {AI_ACTIONS.map(a => (
                      <button key={a.id}
                        onClick={() => callAI(a.id, (eDraft.type ?? editNote.type) === "checklist"
                          ? eItems.map(i=>i.text).join("\n")
                          : eDraft.content ?? editNote.content ?? "")}
                        disabled={aiLoading}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all disabled:opacity-40"
                        style={{
                          background: aiAction===a.id&&aiResult ? `${editAc}22` : "rgba(255,255,255,.05)",
                          color:      aiAction===a.id&&aiResult ? editAc : "rgba(255,255,255,.45)",
                          border:     `1px solid ${aiAction===a.id&&aiResult ? `${editAc}38` : "rgba(255,255,255,.07)"}`,
                        }}>
                        {aiLoading && aiAction===a.id ? <Loader2 size={10} className="animate-spin" /> : <a.icon size={10}/>}
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {aiResult && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                        className="rounded-xl border p-3 space-y-2"
                        style={{ background:`${editAc}0d`, borderColor:`${editAc}28` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold flex items-center gap-1" style={{ color:editAc }}><Sparkles size={11}/>IA</span>
                          <button onClick={() => { setAiResult(""); setAiAction(""); }} className="text-white/25 hover:text-white"><X size={11}/></button>
                        </div>
                        <p className="text-xs text-white/65 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">{aiResult}</p>
                        <div className="flex gap-2">
                          <button onClick={applyAI}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background:editAc, color:"#000" }}>
                            <Check size={10}/>Appliquer
                          </button>
                          <button onClick={() => { setAiResult(""); setAiAction(""); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/35 hover:text-white bg-white/5 hover:bg-white/10 transition-all">
                            <RotateCcw size={10}/>Ignorer
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                                <div className="border-t border-white/8 pt-3 flex flex-wrap gap-1.5 items-center">
                  <Hash size={11} className="text-white/20" />
                  {eTags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ background:`${editAc}12`, color:editAc, border:`1px solid ${editAc}28` }}>
                      {t}
                      <button onClick={() => setEDraft(p => ({ ...p, tags: eTags.filter(x => x!==t) }))}><X size={8}/></button>
                    </span>
                  ))}
                  <input value={eTagIn} onChange={e => setETagIn(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key==="Enter"||e.key===" ") && eTagIn.trim()) {
                        e.preventDefault();
                        const tag = eTagIn.trim().replace(/^#/,"");
                        if (tag && !eTags.includes(tag)) setEDraft(p => ({ ...p, tags:[...eTags,tag] }));
                        setETagIn("");
                      }
                    }}
                    placeholder="#tag…"
                    className="text-xs bg-transparent text-white/40 placeholder:text-white/12 focus:outline-none w-14" />
                </div>
              </div>

                            <div className="flex items-center gap-2 px-5 py-3 border-t border-white/8 flex-shrink-0">
                <button onClick={() => delNote(editNote.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={12}/>Supprimer
                </button>
                <button onClick={() => patchNote(editNote.id, { is_archived: !editNote.is_archived })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/35 hover:text-white hover:bg-white/10 transition-all">
                  <Archive size={12}/>{editNote.is_archived ? "Désarchiver" : "Archiver"}
                </button>
                <button onClick={() => { saveEdit(); setEditNote(null); }}
                  className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background:`${editAc}22`, color:editAc, border:`1px solid ${editAc}38` }}>
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11}/>}
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

            {!creating && !editNote && (
        <motion.button initial={{ scale:0 }} animate={{ scale:1 }}
          onClick={() => openCreate()}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center z-20 sm:hidden"
          style={{ background:"linear-gradient(135deg,#10b981,#059669)" }}>
          <Plus size={24} className="text-white" strokeWidth={2.5} />
        </motion.button>
      )}

            <AnimatePresence>
        {recording && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1a0808] border border-red-500/40 shadow-2xl z-50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400 font-medium">Enregistrement…</span>
            <button onClick={stopRec}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all">
              <StopCircle size={12}/>Arrêter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
