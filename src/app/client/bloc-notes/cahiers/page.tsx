"use client";
/**
 * /client/bloc-notes/cahiers — Cahiers numériques DJAMA
 * Vue 1 : grille de cahiers  |  Vue 2 : éditeur plein-page
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronLeft, ChevronRight, X, Loader2,
  Pencil, Eraser, Undo2, Save, Trash2,
  AlignLeft, LayoutGrid, CalendarDays, Hash, Square, Check,
  Highlighter,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NotebookCanvas, {
  type NbStroke, type NbTool, type NbPageStyle,
} from "@/components/NotebookCanvas";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ─── constants ─── */
const AMBER = "#f59e0b";
const PAGE_BG = "#f8f7f4";

const COVERS = [
  { id:"midnight", label:"Minuit",   g:"linear-gradient(145deg,#1a1040,#2d1b69,#0f0c29)", s:"#0c0820" },
  { id:"ocean",    label:"Océan",    g:"linear-gradient(145deg,#0c3260,#1a6fc4,#0ea5e9)", s:"#0a2040" },
  { id:"forest",   label:"Forêt",    g:"linear-gradient(145deg,#0a3020,#134e5e,#166534)", s:"#071a0f" },
  { id:"amber",    label:"Ambre",    g:"linear-gradient(145deg,#78350f,#d97706,#f59e0b)", s:"#451a03" },
  { id:"crimson",  label:"Cramoisi", g:"linear-gradient(145deg,#450a0a,#991b1b,#dc2626)", s:"#300707" },
  { id:"slate",    label:"Ardoise",  g:"linear-gradient(145deg,#0f172a,#1e293b,#334155)", s:"#070d1a" },
  { id:"purple",   label:"Violet",   g:"linear-gradient(145deg,#1e0a5e,#3730a3,#7c3aed)", s:"#130643" },
  { id:"emerald",  label:"Émeraude", g:"linear-gradient(145deg,#022c22,#065f46,#059669)", s:"#011a15" },
  { id:"rose",     label:"Rose",     g:"linear-gradient(145deg,#4c0519,#9d174d,#f43f5e)", s:"#2d0211" },
  { id:"copper",   label:"Cuivre",   g:"linear-gradient(145deg,#2c1503,#78350f,#b45309)", s:"#1a0c02" },
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

/* visual radius for width dots */
const WIDTH_DOT = [5, 7, 10, 14, 19];
const WIDTHS    = [1, 2, 4, 9, 20];

/* ─── types ─── */
interface Notebook { id:string; user_id:string; name:string; cover_id:CoverId|string; page_style:NbPageStyle; created_at:string; updated_at:string; }
interface NbPage   { id:string; notebook_id:string; user_id:string; page_number:number; strokes:NbStroke[]; created_at:string; updated_at:string; }

const getCover = (id:string) => COVERS.find(c=>c.id===id) ?? COVERS[0];

/* ══════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════ */
export default function CahiersPage() {

  /* list state */
  const [books,      setBooks]      = useState<Notebook[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeBook, setActiveBook] = useState<Notebook|null>(null);
  const [toast,      setToast]      = useState<ToastData|null>(null);
  const [delBook,    setDelBook]    = useState<Notebook|null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* create state */
  const [nbName,   setNbName]   = useState("");
  const [coverId,  setCoverId]  = useState<string>("midnight");
  const [pStyle,   setPStyle]   = useState<NbPageStyle>("lined");
  const [creating, setCreating] = useState(false);

  /* editor state */
  const [pages,   setPages]   = useState<NbPage[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [strokes, setStrokes] = useState<NbStroke[]>([]);
  const [history, setHistory] = useState<NbStroke[][]>([]);
  const [tool,    setTool]    = useState<NbTool>("pen");
  const [color,   setColor]   = useState("#0f172a");
  const [wIdx,    setWIdx]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const show = (type:"success"|"error"|"info", msg:string) => setToast({type,msg} as ToastData);

  /* ── fetch books ── */
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("notebooks").select("*")
      .eq("user_id", user.id).order("created_at", { ascending:false });
    if (data) setBooks(data as Notebook[]);
    setLoading(false);
  }, []);
  useEffect(() => { void fetchBooks(); }, [fetchBooks]);

  /* ── open book ── */
  const openBook = useCallback(async (nb:Notebook) => {
    setActiveBook(nb);
    const { data } = await supabase.from("notebook_pages").select("*")
      .eq("notebook_id", nb.id).order("page_number");
    if (data) {
      const ps = (data as NbPage[]).map(p => ({ ...p, strokes:(Array.isArray(p.strokes)?p.strokes:[]) as NbStroke[] }));
      setPages(ps); setPageIdx(0); setStrokes(ps[0]?.strokes??[]); setHistory([]); setDirty(false);
    }
  }, []);

  /* ── create book ── */
  const createBook = useCallback(async () => {
    if (!nbName.trim()) return;
    setCreating(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const { data:nb, error } = await supabase.from("notebooks")
      .insert({ user_id:user.id, name:nbName.trim(), cover_id:coverId, page_style:pStyle })
      .select().single();
    if (error || !nb) { show("error","Erreur création"); setCreating(false); return; }
    await supabase.from("notebook_pages").insert({ notebook_id:nb.id, user_id:user.id, page_number:1, strokes:[] });
    setBooks(prev=>[nb as Notebook,...prev]);
    setCreateOpen(false); setNbName(""); setCreating(false);
    await openBook(nb as Notebook);
    show("success","Cahier créé");
  }, [nbName, coverId, pStyle, openBook]);

  /* ── add page ── */
  const addPage = useCallback(async () => {
    if (!activeBook) return;
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = (pages[pages.length-1]?.page_number??0)+1;
    const { data:pg } = await supabase.from("notebook_pages")
      .insert({ notebook_id:activeBook.id, user_id:user.id, page_number:next, strokes:[] })
      .select().single();
    if (pg) {
      const np = { ...pg as NbPage, strokes:[] };
      setPages(prev=>[...prev,np]);
      setPageIdx(pages.length);
      setStrokes([]); setHistory([]); setDirty(false);
    }
  }, [activeBook, pages]);

  /* ── save page ── */
  const savePage = useCallback(async (s:NbStroke[], silent=true) => {
    const pg = pages[pageIdx]; if (!pg) return;
    setSaving(true);
    await supabase.from("notebook_pages").update({
      strokes: s as unknown as Record<string,unknown>[],
      updated_at: new Date().toISOString(),
    }).eq("id", pg.id);
    setPages(prev=>prev.map((p,i)=>i===pageIdx?{...p,strokes:s}:p));
    setDirty(false); setSaving(false);
    if (!silent) show("success","Page sauvegardée");
  }, [pages, pageIdx]);

  /* ── strokes → auto-save 1.5s ── */
  const handleStrokes = useCallback((s:NbStroke[]) => {
    setStrokes(s);
    setHistory(h=>[...h.slice(-30), s.slice(0,-1)]);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{ void savePage(s); }, 1500);
  }, [savePage]);

  /* ── undo ── */
  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length-1];
    setStrokes(prev); setHistory(h=>h.slice(0,-1)); setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{ void savePage(prev); }, 1500);
  }, [history, savePage]);

  /* ── switch page ── */
  const switchPage = useCallback((idx:number) => {
    setPageIdx(idx); setStrokes(pages[idx]?.strokes??[]); setHistory([]); setDirty(false);
  }, [pages]);

  /* ── delete book ── */
  const deleteBook = useCallback(async () => {
    if (!delBook) return;
    await supabase.from("notebooks").delete().eq("id", delBook.id);
    setBooks(prev=>prev.filter(b=>b.id!==delBook.id));
    if (activeBook?.id===delBook.id) setActiveBook(null);
    setDelBook(null); show("success","Cahier supprimé");
  }, [delBook, activeBook]);

  /* ══════════════════════════════════════════
     VIEW 1 — BOOKS GRID
  ══════════════════════════════════════════ */
  if (!activeBook) return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-[#080b14] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 sm:px-8 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/client/bloc-notes"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/[0.06] hover:text-white/65">
            <ChevronLeft size={16}/>
          </Link>
          <div>
            <h1 className="text-[0.95rem] font-black text-white tracking-tight">Mes cahiers</h1>
            <p className="text-[0.6rem] text-white/25">{books.length} cahier{books.length!==1?"s":""}</p>
          </div>
        </div>
        <motion.button onClick={()=>setCreateOpen(true)}
          whileHover={{scale:1.03}} whileTap={{scale:0.97}}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold text-[#07080d]"
          style={{background:`linear-gradient(135deg,${AMBER},#d97706)`,boxShadow:`0 6px 22px ${AMBER}38`}}>
          <Plus size={14}/> Nouveau cahier
        </motion.button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8" style={{scrollbarWidth:"none"}}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white/18"/>
          </div>
        ) : books.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-8 text-center px-6">
            {/* Placeholder book */}
            <div className="relative h-40 w-28" style={{perspective:"400px"}}>
              <div className="absolute left-0 inset-y-0 w-5 rounded-l-2xl" style={{background:COVERS[0].s}}/>
              <div className="absolute left-[18px] inset-y-0 right-0 rounded-r-2xl overflow-hidden" style={{background:COVERS[0].g,boxShadow:"6px 10px 32px rgba(0,0,0,0.6)"}}>
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/12 to-transparent"/>
                <div className="absolute inset-0 flex flex-col gap-5 px-3 pt-9 opacity-10">
                  {[0,1,2,3,4].map(i=><div key={i} className="h-px bg-white"/>)}
                </div>
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-white/75">Aucun cahier</p>
              <p className="mt-1.5 text-sm text-white/30 max-w-xs mx-auto leading-relaxed">
                Créez votre premier cahier numérique et écrivez à main levée.
              </p>
            </div>
            <motion.button onClick={()=>setCreateOpen(true)}
              whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-extrabold text-[#07080d]"
              style={{background:`linear-gradient(135deg,${AMBER},#d97706)`,boxShadow:`0 10px 30px ${AMBER}42`}}>
              <Plus size={15}/> Créer mon premier cahier
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {books.map(nb => {
              const cov = getCover(nb.cover_id);
              return (
                <motion.div key={nb.id} className="group flex flex-col items-center gap-3">
                  <motion.button
                    onClick={()=>void openBook(nb)}
                    whileHover={{y:-8, rotateY:10, scale:1.03}}
                    whileTap={{scale:0.96}}
                    className="relative w-full"
                    style={{aspectRatio:"3/4", transformStyle:"preserve-3d", perspective:"600px"}}>
                    {/* Spine */}
                    <div className="absolute left-0 inset-y-0 w-[18%] rounded-l-2xl"
                      style={{background:`linear-gradient(to right,${cov.s},${cov.s}cc)`,boxShadow:"inset -4px 0 14px rgba(0,0,0,0.5)"}}/>
                    {/* Cover */}
                    <div className="absolute left-[15%] inset-y-0 right-0 rounded-r-2xl overflow-hidden"
                      style={{background:cov.g,boxShadow:"6px 10px 32px rgba(0,0,0,0.58),inset 0 1px 0 rgba(255,255,255,0.14)"}}>
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/16 to-transparent"/>
                      <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-l from-black/28 to-transparent"/>
                      <div className="absolute inset-0 flex flex-col gap-[19px] px-3 pt-9 pb-14 opacity-[0.12]">
                        {[0,1,2,3,4,5].map(i=><div key={i} className="h-px bg-white"/>)}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/28 to-transparent px-3 pt-10 pb-3.5">
                        <p className="text-[0.6rem] font-black text-white leading-snug line-clamp-2 drop-shadow">{nb.name}</p>
                      </div>
                    </div>
                    {/* Delete on hover */}
                    <button
                      onClick={e=>{e.stopPropagation();setDelBook(nb)}}
                      className="absolute top-2 right-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-transparent group-hover:text-white/55 transition-all hover:bg-red-500/75 hover:!text-white backdrop-blur-sm">
                      <X size={9}/>
                    </button>
                  </motion.button>
                  <p className="max-w-full truncate text-center text-[0.65rem] font-semibold text-white/40">{nb.name}</p>
                </motion.div>
              );
            })}

            {/* New book placeholder */}
            <motion.div className="flex flex-col items-center gap-3">
              <motion.button onClick={()=>setCreateOpen(true)}
                whileHover={{y:-8,scale:1.03}} whileTap={{scale:0.97}}
                className="relative w-full flex items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.08] transition hover:border-amber-400/25"
                style={{aspectRatio:"3/4"}}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 transition hover:border-amber-400/30">
                    <Plus size={18} className="text-white/20"/>
                  </div>
                  <span className="text-[0.58rem] text-white/18">Nouveau</span>
                </div>
              </motion.button>
              <p className="text-[0.65rem] text-white/20">Créer</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div key="bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md" onClick={()=>setCreateOpen(false)}/>
            <motion.div key="modal"
              initial={{opacity:0,scale:0.9,y:32}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.94,y:12}} transition={{type:"spring",stiffness:300,damping:30}}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-3xl border border-white/[0.08] bg-[#0e1420] p-6 shadow-[0_52px_130px_rgba(0,0,0,0.8)]">

              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-black text-white tracking-tight">Nouveau cahier</h2>
                <button onClick={()=>setCreateOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-white/35 transition hover:text-white/65">
                  <X size={13}/>
                </button>
              </div>

              <input value={nbName} onChange={e=>setNbName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&void createBook()} autoFocus
                placeholder="Nom du cahier…"
                className="mb-5 w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white placeholder:text-white/18 outline-none focus:border-amber-400/35 transition"/>

              <p className="mb-2 text-[0.58rem] font-black uppercase tracking-widest text-white/22">Couverture</p>
              <div className="mb-5 grid grid-cols-5 gap-2">
                {COVERS.map(c=>(
                  <button key={c.id} onClick={()=>setCoverId(c.id)}
                    className="relative rounded-xl overflow-hidden transition-transform hover:scale-105"
                    style={{aspectRatio:"3/4",background:c.g,outline:coverId===c.id?`2px solid ${AMBER}`:"none",outlineOffset:"2px"}}>
                    {coverId===c.id&&(
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
                          <Check size={8} className="text-[#080a0f]"/>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className="mb-2 text-[0.58rem] font-black uppercase tracking-widest text-white/22">Style de page</p>
              <div className="mb-6 grid grid-cols-5 gap-2">
                {PAGE_STYLES.map(s=>(
                  <button key={s.v} onClick={()=>setPStyle(s.v)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${pStyle===s.v
                      ?"border-amber-400/45 bg-amber-400/[0.08]"
                      :"border-white/[0.06] bg-white/[0.02] hover:border-white/12"}`}>
                    <s.Icon size={13} className={pStyle===s.v?"text-amber-300":"text-white/28"}/>
                    <span className={`text-[0.48rem] font-bold ${pStyle===s.v?"text-amber-300":"text-white/25"}`}>{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setCreateOpen(false)}
                  className="flex-1 rounded-2xl border border-white/[0.07] py-3 text-sm font-semibold text-white/38 transition hover:border-white/12">
                  Annuler
                </button>
                <button onClick={()=>void createBook()} disabled={!nbName.trim()||creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-[#07080d] disabled:opacity-40"
                  style={{background:`linear-gradient(135deg,${AMBER},#d97706)`}}>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <motion.div initial={{scale:0.88,y:24}} animate={{scale:1,y:0}} exit={{scale:0.94,opacity:0}}
              className="w-full max-w-xs rounded-3xl border border-white/[0.07] bg-[#0e1420] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.75)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/18 bg-red-500/[0.07]">
                <Trash2 size={17} className="text-red-400"/>
              </div>
              <h3 className="text-sm font-black text-white">Supprimer ce cahier ?</h3>
              <p className="mt-1.5 text-xs text-white/35 leading-relaxed">
                &laquo;{delBook.name}&raquo; et toutes ses pages seront supprimés définitivement.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={()=>setDelBook(null)}
                  className="flex-1 rounded-2xl border border-white/[0.07] py-2.5 text-sm font-semibold text-white/38">Annuler</button>
                <button onClick={()=>void deleteBook()}
                  className="flex-1 rounded-2xl bg-red-500/75 py-2.5 text-sm font-bold text-white transition hover:bg-red-500">Supprimer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );

  /* ══════════════════════════════════════════
     VIEW 2 — CANVAS EDITOR (full-page)
  ══════════════════════════════════════════ */
  const cov = getCover(activeBook.cover_id);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden" style={{background:PAGE_BG}}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 h-11 px-3 flex-shrink-0 border-b border-black/[0.07] bg-white/80 backdrop-blur-sm">

        {/* Back */}
        <button onClick={()=>setActiveBook(null)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-black/[0.04] hover:text-slate-700">
          <ChevronLeft size={13}/><span className="hidden sm:inline">Cahiers</span>
        </button>

        <div className="h-4 w-px bg-black/[0.08]"/>

        {/* Cover swatch */}
        <div className="h-4 w-2.5 rounded-sm flex-shrink-0 shadow-sm" style={{background:cov.g}}/>

        {/* Book name */}
        <span className="flex-1 truncate text-sm font-bold text-slate-700">{activeBook.name}</span>

        {/* Page count */}
        <span className="text-[0.62rem] font-semibold text-slate-400 flex-shrink-0 tabular-nums">
          {pages[pageIdx]?.page_number ?? 1} / {pages.length}
        </span>

        {/* Save dot */}
        <div className="flex-shrink-0 h-2 w-2 rounded-full transition-colors"
          style={{background: saving ? AMBER : dirty ? "#f97316" : "#22c55e", opacity: saving||dirty ? 1 : 0.45}}/>

        {/* Add page */}
        <button onClick={()=>void addPage()}
          className="flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1 text-[0.62rem] font-bold text-slate-500 transition hover:border-black/15 hover:text-slate-700 flex-shrink-0">
          <Plus size={10}/><span className="hidden xs:inline">Page</span>
        </button>

        {/* Thumbnails toggle — mobile */}
        <button onClick={()=>setThumbsOpen(o=>!o)}
          className={`lg:hidden flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.07] text-slate-500 transition flex-shrink-0 ${thumbsOpen?"bg-amber-50 border-amber-300/50 text-amber-600":""}`}>
          <LayoutGrid size={12}/>
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Page thumbnails — desktop always visible, mobile slide-in */}
        <AnimatePresence>
          {(thumbsOpen) && (
            <motion.div
              key="thumbs-mobile"
              initial={{x:-60,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-60,opacity:0}}
              transition={{type:"spring",stiffness:320,damping:32}}
              className="lg:hidden absolute left-0 top-11 bottom-14 z-20 w-[60px] flex flex-col border-r border-black/[0.07] bg-white/95 backdrop-blur-sm overflow-y-auto p-2 gap-2 shadow-xl"
              style={{scrollbarWidth:"none"}}>
              {pages.map((pg,idx)=>(
                <button key={pg.id} onClick={()=>{switchPage(idx);setThumbsOpen(false)}}
                  className="relative w-full flex-shrink-0 overflow-hidden rounded-lg transition-all"
                  style={{aspectRatio:"3/4",background:PAGE_BG,border:pageIdx===idx?`2px solid ${AMBER}`:"1.5px solid rgba(0,0,0,0.08)"}}>
                  <span className="absolute inset-0 flex items-center justify-center text-[0.42rem] font-bold text-slate-400">{pg.page_number}</span>
                </button>
              ))}
              <button onClick={()=>{void addPage();setThumbsOpen(false)}}
                className="w-full flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-black/12 transition hover:border-amber-400/40"
                style={{aspectRatio:"3/4"}}>
                <Plus size={11} className="text-slate-300"/>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop thumbnails — always visible */}
        <div className="hidden lg:flex w-[52px] flex-col border-r border-black/[0.06] bg-white/60 overflow-y-auto p-2 gap-2 flex-shrink-0" style={{scrollbarWidth:"none"}}>
          {pages.map((pg,idx)=>(
            <button key={pg.id} onClick={()=>switchPage(idx)}
              className="relative w-full flex-shrink-0 overflow-hidden rounded-lg transition-all"
              style={{aspectRatio:"3/4",background:PAGE_BG,border:pageIdx===idx?`2px solid ${AMBER}`:"1.5px solid rgba(0,0,0,0.07)"}}>
              <span className="absolute inset-0 flex items-center justify-center text-[0.42rem] font-bold text-slate-400">{pg.page_number}</span>
            </button>
          ))}
          <button onClick={()=>void addPage()}
            className="w-full flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-black/10 transition hover:border-amber-400/35"
            style={{aspectRatio:"3/4"}}>
            <Plus size={11} className="text-slate-300"/>
          </button>
        </div>

        {/* ── Canvas — fills the entire remaining space ── */}
        <div className="relative flex-1 overflow-hidden" style={{background:PAGE_BG}}>
          <NotebookCanvas
            pageStyle={activeBook.page_style}
            strokes={strokes}
            onStrokesChange={handleStrokes}
            tool={tool}
            penColor={color}
            penWidth={WIDTHS[wIdx] ?? 3}
          />

          {/* Subtle top shadow — depth */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-5"
            style={{background:"linear-gradient(to bottom, rgba(0,0,0,0.035), transparent)"}}/>

          {/* Page nav — prev */}
          {pageIdx > 0 && (
            <button onClick={()=>switchPage(pageIdx-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-slate-600 backdrop-blur-sm transition hover:bg-black/20">
              <ChevronLeft size={19}/>
            </button>
          )}
          {/* Page nav — next */}
          {pageIdx < pages.length-1 && (
            <button onClick={()=>switchPage(pageIdx+1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-slate-600 backdrop-blur-sm transition hover:bg-black/20">
              <ChevronRight size={19}/>
            </button>
          )}
        </div>
      </div>

      {/* ── Drawing toolbar ── */}
      <div
        className="flex items-center gap-1 border-t border-black/[0.07] bg-white/90 backdrop-blur-sm px-3 flex-shrink-0 overflow-x-auto"
        style={{scrollbarWidth:"none", height:"54px"}}>

        {/* Undo */}
        <button onClick={undo} disabled={!history.length}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-black/[0.05] hover:text-slate-700 disabled:opacity-20">
          <Undo2 size={16}/>
        </button>

        <div className="h-5 w-px flex-shrink-0 bg-black/[0.07] mx-0.5"/>

        {/* Pen */}
        <button onClick={()=>setTool("pen")}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${tool==="pen"
            ?"bg-amber-50 text-amber-600 shadow-sm":"text-slate-400 hover:bg-black/[0.04] hover:text-slate-600"}`}>
          <Pencil size={16}/>
        </button>

        {/* Highlighter */}
        <button onClick={()=>setTool("highlighter")}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${tool==="highlighter"
            ?"bg-amber-50 text-amber-600 shadow-sm":"text-slate-400 hover:bg-black/[0.04] hover:text-slate-600"}`}>
          <Highlighter size={16}/>
        </button>

        {/* Eraser */}
        <button onClick={()=>setTool("eraser")}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${tool==="eraser"
            ?"bg-amber-50 text-amber-600 shadow-sm":"text-slate-400 hover:bg-black/[0.04] hover:text-slate-600"}`}>
          <Eraser size={16}/>
        </button>

        <div className="h-5 w-px flex-shrink-0 bg-black/[0.07] mx-0.5"/>

        {/* Colors */}
        {PEN_COLORS.map(c=>(
          <button key={c} onClick={()=>setColor(c)}
            className="h-7 w-7 flex-shrink-0 rounded-full transition-transform hover:scale-110"
            style={{
              background:c,
              outline: color===c ? "2.5px solid #0f172a" : "none",
              outlineOffset:"2px",
              boxShadow: c==="#ffffff" ? "inset 0 0 0 1.5px rgba(0,0,0,0.18)" : "none",
            }}/>
        ))}

        {/* Custom color picker */}
        <label className="relative flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-300 overflow-hidden transition hover:border-slate-400">
          <Plus size={11} className="text-slate-400"/>
          <input type="color" value={color} onChange={e=>setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
        </label>

        <div className="h-5 w-px flex-shrink-0 bg-black/[0.07] mx-0.5"/>

        {/* Width — visual dots */}
        {WIDTH_DOT.map((r,i)=>(
          <button key={i} onClick={()=>setWIdx(i)}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${wIdx===i?"bg-amber-50":"hover:bg-black/[0.04]"}`}>
            <div className="rounded-full"
              style={{
                width:r, height:r,
                background: wIdx===i ? "#d97706" : "#94a3b8",
              }}/>
          </button>
        ))}

        <div className="flex-1"/>

        {/* Save */}
        <button onClick={()=>void savePage(strokes,false)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-black/15 hover:text-slate-700 shadow-sm">
          <Save size={12}/> Sauver
        </button>
      </div>

      <AnimatePresence>{toast&&<Toast toast={toast} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );
}
