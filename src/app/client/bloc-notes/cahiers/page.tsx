"use client";
/**
 * /client/bloc-notes/cahiers — page dédiée cahiers numériques DJAMA
 * Vue 1 : grille de cahiers (couvertures)
 * Vue 2 : éditeur canvas plein écran
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronLeft, ChevronRight, X, Loader2,
  Pencil, Eraser, Undo2, Save, Trash2,
  AlignLeft, LayoutGrid, CalendarDays, Hash, Square, Check,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NotebookCanvas, {
  type NbStroke, type NbTool, type NbPageStyle,
} from "@/components/NotebookCanvas";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ══════════════ CONSTANTS ══════════════ */
const amber = "#f59e0b";

const COVERS = [
  { id:"midnight", label:"Minuit",   g:"linear-gradient(150deg,#1a1040,#2d1b69,#0f0c29)", s:"#0c0820" },
  { id:"ocean",    label:"Océan",    g:"linear-gradient(150deg,#0c3260,#1a6fc4,#0ea5e9)", s:"#0a2040" },
  { id:"forest",   label:"Forêt",    g:"linear-gradient(150deg,#0a3020,#134e5e,#166534)", s:"#071a0f" },
  { id:"amber",    label:"Ambre",    g:"linear-gradient(150deg,#78350f,#d97706,#f59e0b)", s:"#451a03" },
  { id:"crimson",  label:"Cramoisi", g:"linear-gradient(150deg,#450a0a,#991b1b,#dc2626)", s:"#300707" },
  { id:"slate",    label:"Ardoise",  g:"linear-gradient(150deg,#0f172a,#1e293b,#334155)", s:"#070d1a" },
  { id:"purple",   label:"Violet",   g:"linear-gradient(150deg,#1e0a5e,#3730a3,#7c3aed)", s:"#130643" },
  { id:"emerald",  label:"Émeraude", g:"linear-gradient(150deg,#022c22,#065f46,#059669)", s:"#011a15" },
  { id:"rose",     label:"Rose",     g:"linear-gradient(150deg,#4c0519,#9d174d,#f43f5e)", s:"#2d0211" },
  { id:"copper",   label:"Cuivre",   g:"linear-gradient(150deg,#2c1503,#78350f,#b45309)", s:"#1a0c02" },
] as const;
type CoverId = typeof COVERS[number]["id"];

const PAGE_STYLES: { v: NbPageStyle; label: string; Icon: React.ElementType }[] = [
  { v:"blank",  label:"Blanche",    Icon:Square },
  { v:"lined",  label:"Lignes",     Icon:AlignLeft },
  { v:"grid",   label:"Carreaux",   Icon:LayoutGrid },
  { v:"dotted", label:"Pointillés", Icon:Hash },
  { v:"agenda", label:"Agenda",     Icon:CalendarDays },
];

const PEN_COLORS = [
  "#0f172a","#dc2626","#2563eb","#16a34a",
  "#d97706","#7c3aed","#db2777","#0891b2","#ffffff",
];

const WIDTHS = [{ l:"XS",v:1 },{ l:"S",v:2 },{ l:"M",v:4 },{ l:"L",v:9 },{ l:"XL",v:20 }];

/* ══════════════ TYPES ══════════════ */
interface Notebook {
  id:         string;
  user_id:    string;
  name:       string;
  cover_id:   CoverId | string;
  page_style: NbPageStyle;
  created_at: string;
  updated_at: string;
}
interface NbPage {
  id:          string;
  notebook_id: string;
  user_id:     string;
  page_number: number;
  strokes:     NbStroke[];
  created_at:  string;
  updated_at:  string;
}

/* ══════════════ HELPERS ══════════════ */
const getCover = (id: string) => COVERS.find(c => c.id === id) ?? COVERS[0];

/* ══════════════ COMPONENT ══════════════ */
export default function CahiersPage() {

  /* state — list */
  const [books,      setBooks]      = useState<Notebook[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeBook, setActiveBook] = useState<Notebook|null>(null);
  const [toast,      setToast]      = useState<ToastData|null>(null);
  const [delBook,    setDelBook]    = useState<Notebook|null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* state — create */
  const [nbName,     setNbName]     = useState("");
  const [coverId,    setCoverId]    = useState<string>("midnight");
  const [pageStyle,  setPageStyle]  = useState<NbPageStyle>("lined");
  const [creating,   setCreating]   = useState(false);

  /* state — editor */
  const [pages,      setPages]      = useState<NbPage[]>([]);
  const [pageIdx,    setPageIdx]    = useState(0);
  const [strokes,    setStrokes]    = useState<NbStroke[]>([]);
  const [history,    setHistory]    = useState<NbStroke[][]>([]);
  const [tool,       setTool]       = useState<NbTool>("pen");
  const [color,      setColor]      = useState("#0f172a");
  const [wIdx,       setWIdx]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [dirty,      setDirty]      = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const showToast = (type: "success"|"error"|"info", msg: string) =>
    setToast({ type, msg } as ToastData);

  /* ── Fetch books ── */
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notebooks").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBooks(data as Notebook[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchBooks(); }, [fetchBooks]);

  /* ── Open book ── */
  const openBook = useCallback(async (nb: Notebook) => {
    setActiveBook(nb);
    const { data } = await supabase
      .from("notebook_pages").select("*").eq("notebook_id", nb.id)
      .order("page_number");
    if (data) {
      const ps = (data as NbPage[]).map(p => ({
        ...p, strokes: (Array.isArray(p.strokes) ? p.strokes : []) as NbStroke[],
      }));
      setPages(ps);
      setPageIdx(0);
      setStrokes(ps[0]?.strokes ?? []);
      setHistory([]); setDirty(false);
    }
  }, []);

  /* ── Create book ── */
  const createBook = useCallback(async () => {
    if (!nbName.trim()) return;
    setCreating(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const { data:nb, error } = await supabase.from("notebooks")
      .insert({ user_id:user.id, name:nbName.trim(), cover_id:coverId, page_style:pageStyle })
      .select().single();
    if (error || !nb) { showToast("error","Erreur création"); setCreating(false); return; }
    await supabase.from("notebook_pages").insert({
      notebook_id:nb.id, user_id:user.id, page_number:1, strokes:[],
    });
    setBooks(prev => [nb as Notebook, ...prev]);
    setCreateOpen(false); setNbName(""); setCreating(false);
    await openBook(nb as Notebook);
    showToast("success","Cahier créé");
  }, [nbName, coverId, pageStyle, openBook]);

  /* ── Add page ── */
  const addPage = useCallback(async () => {
    if (!activeBook) return;
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = (pages[pages.length-1]?.page_number ?? 0) + 1;
    const { data:pg } = await supabase.from("notebook_pages")
      .insert({ notebook_id:activeBook.id, user_id:user.id, page_number:next, strokes:[] })
      .select().single();
    if (pg) {
      const np = { ...pg as NbPage, strokes:[] };
      setPages(prev => [...prev, np]);
      setPageIdx(pages.length);
      setStrokes([]); setHistory([]); setDirty(false);
    }
  }, [activeBook, pages]);

  /* ── Save page ── */
  const savePage = useCallback(async (s: NbStroke[], silent = true) => {
    const pg = pages[pageIdx];
    if (!pg) return;
    setSaving(true);
    await supabase.from("notebook_pages").update({
      strokes: s as unknown as Record<string,unknown>[],
      updated_at: new Date().toISOString(),
    }).eq("id", pg.id);
    setPages(prev => prev.map((p, i) => i===pageIdx ? {...p, strokes:s} : p));
    setDirty(false); setSaving(false);
    if (!silent) showToast("success","Page sauvegardée");
  }, [pages, pageIdx]);

  /* ── Handle strokes (auto-save 1.5s) ── */
  const handleStrokes = useCallback((s: NbStroke[]) => {
    setStrokes(s);
    setHistory(h => [...h.slice(-30), s.slice(0,-1)]);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void savePage(s); }, 1500);
  }, [savePage]);

  /* ── Undo ── */
  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length-1];
    setStrokes(prev);
    setHistory(h => h.slice(0,-1));
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void savePage(prev); }, 1500);
  }, [history, savePage]);

  /* ── Switch page ── */
  const switchPage = useCallback((idx: number) => {
    setPageIdx(idx);
    setStrokes(pages[idx]?.strokes ?? []);
    setHistory([]); setDirty(false);
  }, [pages]);

  /* ── Delete book ── */
  const deleteBook = useCallback(async () => {
    if (!delBook) return;
    await supabase.from("notebooks").delete().eq("id", delBook.id);
    setBooks(prev => prev.filter(b => b.id !== delBook.id));
    if (activeBook?.id === delBook.id) setActiveBook(null);
    setDelBook(null);
    showToast("success","Cahier supprimé");
  }, [delBook, activeBook]);

  /* ═══════════════════════════════════════════
     VIEW 1 — BOOKS GRID
  ═══════════════════════════════════════════ */
  if (!activeBook) return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-[#080b14] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-3">
          <Link href="/client/bloc-notes"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">
            <ChevronLeft size={16}/>
          </Link>
          <div>
            <h1 className="text-[1rem] font-black text-white tracking-tight">Mes cahiers</h1>
            <p className="text-[0.62rem] text-white/28">{books.length} cahier{books.length!==1?"s":""}</p>
          </div>
        </div>
        <motion.button onClick={()=>setCreateOpen(true)}
          whileHover={{scale:1.04}} whileTap={{scale:0.97}}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold text-[#080a0f]"
          style={{background:`linear-gradient(135deg,${amber},#d97706)`,boxShadow:`0 6px 24px ${amber}40`}}>
          <Plus size={14}/> Nouveau cahier
        </motion.button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8" style={{scrollbarWidth:"none"}}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-white/20"/>
          </div>
        ) : books.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex h-full flex-col items-center justify-center gap-7 text-center px-6">
            <div className="relative h-36 w-28">
              <div className="absolute left-0 inset-y-0 w-5 rounded-l-2xl" style={{background:COVERS[0].s}}/>
              <div className="absolute left-4 inset-y-0 right-0 rounded-r-2xl shadow-2xl overflow-hidden" style={{background:COVERS[0].g}}>
                <div className="absolute inset-0 flex flex-col gap-4 px-3 pt-7 opacity-15">
                  {[0,1,2,3,4,5].map(i=><div key={i} className="h-px bg-white"/>)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-white/80">Aucun cahier</p>
              <p className="text-sm text-white/35 max-w-xs mx-auto leading-relaxed">
                Créez votre premier cahier numérique et écrivez à main levée.
              </p>
            </div>
            <motion.button onClick={()=>setCreateOpen(true)}
              whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-[#080a0f]"
              style={{background:`linear-gradient(135deg,${amber},#d97706)`,boxShadow:`0 8px 28px ${amber}45`}}>
              <Plus size={15}/> Créer mon premier cahier
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map(nb => {
              const cov = getCover(nb.cover_id);
              return (
                <motion.div key={nb.id} className="group flex flex-col items-center gap-3">
                  <motion.button
                    onClick={()=>void openBook(nb)}
                    whileHover={{y:-6,rotateY:8,scale:1.02}}
                    whileTap={{scale:0.97}}
                    className="relative w-full"
                    style={{aspectRatio:"3/4",transformStyle:"preserve-3d",perspective:"500px"}}>

                    {/* Spine */}
                    <div className="absolute left-0 inset-y-0 w-[20%] rounded-l-2xl"
                      style={{
                        background:`linear-gradient(to right, ${cov.s}, ${cov.s}cc)`,
                        boxShadow:"inset -3px 0 12px rgba(0,0,0,0.45)",
                      }}/>

                    {/* Cover */}
                    <div className="absolute left-[17%] inset-y-0 right-0 rounded-r-2xl overflow-hidden"
                      style={{
                        background:cov.g,
                        boxShadow:"5px 8px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
                      }}>
                      {/* Top sheen */}
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/15 to-transparent"/>
                      {/* Right shadow */}
                      <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/25 to-transparent"/>
                      {/* Lines decoration */}
                      <div className="absolute inset-0 flex flex-col gap-[18px] px-3 pt-8 pb-12 opacity-[0.13]">
                        {[0,1,2,3,4,5,6].map(i=><div key={i} className="h-px bg-white"/>)}
                      </div>
                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-3 pt-8 pb-3">
                        <p className="text-[0.62rem] font-black text-white leading-tight line-clamp-2 drop-shadow-md">{nb.name}</p>
                      </div>
                    </div>

                    {/* Delete button — on hover */}
                    <button
                      onClick={e=>{e.stopPropagation();setDelBook(nb)}}
                      className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/0 group-hover:text-white/60 transition-all hover:bg-red-500/70 hover:text-white backdrop-blur-sm">
                      <X size={11}/>
                    </button>
                  </motion.button>
                  <p className="max-w-full truncate text-center text-[0.7rem] font-semibold text-white/45">{nb.name}</p>
                </motion.div>
              );
            })}

            {/* New book card */}
            <motion.div className="flex flex-col items-center gap-3">
              <motion.button onClick={()=>setCreateOpen(true)}
                whileHover={{y:-6,scale:1.02}} whileTap={{scale:0.97}}
                className="relative w-full flex items-center justify-center rounded-2xl border-2 border-dashed border-white/10 transition-all hover:border-amber-400/30"
                style={{aspectRatio:"3/4"}}>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition group-hover:border-amber-400/30">
                    <Plus size={20} className="text-white/22"/>
                  </div>
                  <span className="text-[0.62rem] text-white/22">Nouveau</span>
                </div>
              </motion.button>
              <p className="text-[0.7rem] text-white/22">Créer</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div key="bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md" onClick={()=>setCreateOpen(false)}/>
            <motion.div key="modal"
              initial={{opacity:0,scale:0.92,y:28}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.95,y:10}} transition={{type:"spring",stiffness:320,damping:32}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl border border-white/[0.09] bg-[#0f1623] p-6 shadow-[0_48px_120px_rgba(0,0,0,0.75)]">

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[1rem] font-black text-white">Nouveau cahier</h2>
                <button onClick={()=>setCreateOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-white/40 transition hover:text-white/70"><X size={14}/></button>
              </div>

              {/* Name */}
              <input value={nbName} onChange={e=>setNbName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&void createBook()}
                autoFocus placeholder="Nom du cahier…"
                className="mb-5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder:text-white/20 outline-none focus:border-amber-400/40 transition"/>

              {/* Covers */}
              <p className="mb-2.5 text-[0.6rem] font-black uppercase tracking-widest text-white/25">Couverture</p>
              <div className="mb-5 grid grid-cols-5 gap-2">
                {COVERS.map(c=>(
                  <button key={c.id} onClick={()=>setCoverId(c.id)}
                    className="relative rounded-xl overflow-hidden transition-transform hover:scale-105"
                    style={{aspectRatio:"3/4",background:c.g,outline:coverId===c.id?`2px solid ${amber}`:"none",outlineOffset:"2px"}}>
                    {coverId===c.id&&(
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                          <Check size={9} style={{color:"#080a0f"}}/>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Page styles */}
              <p className="mb-2.5 text-[0.6rem] font-black uppercase tracking-widest text-white/25">Style de page</p>
              <div className="mb-6 grid grid-cols-5 gap-2">
                {PAGE_STYLES.map(s=>(
                  <button key={s.v} onClick={()=>setPageStyle(s.v)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${pageStyle===s.v
                      ? "border-amber-400/50 bg-amber-400/10"
                      : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"}`}>
                    <s.Icon size={14} className={pageStyle===s.v?"text-amber-300":"text-white/30"}/>
                    <span className={`text-[0.5rem] font-bold ${pageStyle===s.v?"text-amber-300":"text-white/28"}`}>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={()=>setCreateOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-3 text-sm font-semibold text-white/45 transition hover:border-white/15">
                  Annuler
                </button>
                <button onClick={()=>void createBook()} disabled={!nbName.trim()||creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-[#080a0f] disabled:opacity-40 transition hover:opacity-90"
                  style={{background:`linear-gradient(135deg,${amber},#d97706)`}}>
                  {creating?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>} Créer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirm ── */}
      <AnimatePresence>
        {delBook && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,opacity:0}}
              className="w-full max-w-xs rounded-3xl border border-white/[0.08] bg-[#0f1623] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.08]">
                <Trash2 size={18} className="text-red-400"/>
              </div>
              <h3 className="text-sm font-extrabold text-white">Supprimer ce cahier ?</h3>
              <p className="mt-1 text-xs text-white/38 leading-relaxed">
                &laquo;{delBook.name}&raquo; et toutes ses pages seront supprimés définitivement.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={()=>setDelBook(null)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/45">Annuler</button>
                <button onClick={()=>void deleteBook()}
                  className="flex-1 rounded-2xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );

  /* ═══════════════════════════════════════════
     VIEW 2 — CANVAS EDITOR
  ═══════════════════════════════════════════ */
  const cov = getCover(activeBook.cover_id);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-[#080b14] overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0d1117] px-4 py-2.5 flex-shrink-0">
        <button onClick={()=>setActiveBook(null)}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">
          <ChevronLeft size={13}/> Cahiers
        </button>
        <div className="h-4 w-px bg-white/[0.08] flex-shrink-0"/>
        <div className="h-5 w-[14px] flex-shrink-0 rounded-sm" style={{background:cov.g}}/>
        <span className="flex-1 truncate text-sm font-black text-white/80">{activeBook.name}</span>
        <span className="flex-shrink-0 text-[0.65rem] text-white/25">
          {pages[pageIdx]?.page_number ?? 1} / {pages.length}
        </span>
        <div className="flex-shrink-0 flex items-center gap-2 ml-2">
          {saving
            ? <Loader2 size={11} className="animate-spin text-amber-400/50"/>
            : dirty
              ? <span className="text-[0.58rem] text-amber-400/55">Non sauvegardé</span>
              : <span className="text-[0.58rem] text-white/18">Sauvegardé</span>}
          <button onClick={()=>void addPage()}
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-2.5 py-1 text-[0.68rem] font-bold text-white/35 transition hover:border-white/20 hover:text-white/65">
            <Plus size={11}/> Page
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Page thumbnails — desktop */}
        <div className="hidden lg:flex w-[68px] flex-col border-r border-white/[0.05] bg-[#0a0e16] overflow-y-auto p-2 gap-2 flex-shrink-0" style={{scrollbarWidth:"none"}}>
          {pages.map((pg, idx)=>(
            <button key={pg.id} onClick={()=>switchPage(idx)}
              className="relative w-full flex-shrink-0 overflow-hidden rounded-lg transition-all"
              style={{
                aspectRatio:"3/4",
                background:"#f8f7f4",
                outline: pageIdx===idx ? `2px solid ${amber}` : "1px solid rgba(255,255,255,0.07)",
              }}>
              <span className="absolute inset-0 flex items-center justify-center text-[0.48rem] font-bold text-slate-400/55">
                {pg.page_number}
              </span>
              {pageIdx===idx && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{background:amber}}/>
              )}
            </button>
          ))}
          <button onClick={()=>void addPage()}
            className="w-full flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-white/[0.08] transition hover:border-amber-400/25"
            style={{aspectRatio:"3/4"}}>
            <Plus size={12} className="text-white/18"/>
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Paper */}
          <div className="relative flex-1 overflow-hidden" style={{background:"#c8c4ba"}}>
            <div className="absolute inset-3 sm:inset-5 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.5)] overflow-hidden">
              <NotebookCanvas
                pageStyle={activeBook.page_style}
                strokes={strokes}
                onStrokesChange={handleStrokes}
                tool={tool}
                penColor={color}
                penWidth={WIDTHS[wIdx]?.v ?? 3}
              />
            </div>

            {/* Page arrows */}
            {pageIdx > 0 && (
              <button onClick={()=>switchPage(pageIdx-1)}
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/65 backdrop-blur-sm transition hover:bg-black/55">
                <ChevronLeft size={20}/>
              </button>
            )}
            {pageIdx < pages.length-1 && (
              <button onClick={()=>switchPage(pageIdx+1)}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/65 backdrop-blur-sm transition hover:bg-black/55">
                <ChevronRight size={20}/>
              </button>
            )}
          </div>

          {/* ── Drawing toolbar ── */}
          <div className="flex items-center gap-2 border-t border-white/[0.05] bg-[#0a0e16] px-4 py-3 overflow-x-auto flex-shrink-0" style={{scrollbarWidth:"none",minHeight:"56px"}}>

            {/* Undo */}
            <button onClick={undo} disabled={!history.length}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/[0.06] hover:text-white/65 disabled:opacity-20">
              <Undo2 size={17}/>
            </button>

            <div className="h-5 w-px flex-shrink-0 bg-white/[0.07]"/>

            {/* Tools */}
            <button onClick={()=>setTool("pen")}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition ${tool==="pen"
                ? "bg-amber-400/15 text-amber-300"
                : "text-white/30 hover:bg-white/[0.06] hover:text-white/65"}`}>
              <Pencil size={17}/>
            </button>
            <button onClick={()=>setTool("eraser")}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition ${tool==="eraser"
                ? "bg-amber-400/15 text-amber-300"
                : "text-white/30 hover:bg-white/[0.06] hover:text-white/65"}`}>
              <Eraser size={17}/>
            </button>

            <div className="h-5 w-px flex-shrink-0 bg-white/[0.07]"/>

            {/* Colors */}
            {PEN_COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)}
                className="h-8 w-8 flex-shrink-0 rounded-full transition-transform hover:scale-110"
                style={{
                  background:c,
                  outline: color===c ? "2.5px solid rgba(255,255,255,0.75)" : "none",
                  outlineOffset:"2px",
                  boxShadow: c==="#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.2)" : "none",
                }}/>
            ))}
            <label className="relative flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-white/20 overflow-hidden transition hover:border-white/40">
              <Plus size={12} className="text-white/28"/>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
            </label>

            <div className="h-5 w-px flex-shrink-0 bg-white/[0.07]"/>

            {/* Widths */}
            {WIDTHS.map((w,i)=>(
              <button key={i} onClick={()=>setWIdx(i)}
                className={`flex h-10 min-w-[36px] flex-shrink-0 items-center justify-center rounded-xl px-2 text-[0.62rem] font-black transition ${wIdx===i
                  ? "bg-amber-400/15 text-amber-300"
                  : "text-white/25 hover:bg-white/[0.05] hover:text-white/55"}`}>
                {w.l}
              </button>
            ))}

            <div className="h-5 w-px flex-shrink-0 bg-white/[0.07]"/>

            {/* Save */}
            <button onClick={()=>void savePage(strokes, false)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-bold text-white/35 transition hover:border-white/18 hover:text-white/65">
              <Save size={13}/> Sauver
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );
}
