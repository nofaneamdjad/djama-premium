"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Folder, FolderPlus, FileText, Star, Trash2,
  LayoutGrid, List, Loader2, X, ChevronRight, BookOpen,
  Clock, AlignLeft, SortAsc, MoreHorizontal, Pencil, Check,
  Archive, RefreshCw, Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import Toast, { type ToastData, type ToastType } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Doc {
  id: string; title: string;
  content?: string; thumbnail_text?: string;
  note_type?: string; doc_type?: string;
  folder_id?: string | null;
  is_favorite?: boolean; is_archived?: boolean; is_pinned?: boolean;
  word_count?: number; page_format?: string; page_orientation?: string;
  created_at: string; updated_at: string;
}
interface NoteFolder { id: string; name: string; color: string; }

type Section = "all" | "favorites" | "trash" | "templates" | `folder:${string}`;
type SortBy  = "updated" | "alpha" | "type";
type ViewMode= "grid" | "list";

const GOLD  = "#c9a55a";
const SECTIONS = [
  { id: "all"       as Section, label: "Tous les documents", icon: AlignLeft   },
  { id: "favorites" as Section, label: "Favoris",            icon: Star         },
  { id: "templates" as Section, label: "Modèles",            icon: BookOpen     },
  { id: "trash"     as Section, label: "Corbeille",          icon: Trash2       },
];

const DOC_TYPE_COLORS: Record<string, string> = {
  document: GOLD,
  template: "#8b5cf6",
  note:     "#3b82f6",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `il y a ${Math.round(diff/60)} min`;
  if (diff < 86400)return `il y a ${Math.round(diff/3600)} h`;
  if (diff < 604800)return `il y a ${Math.round(diff/86400)} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function thumbnail(doc: Doc): string {
  return (doc.thumbnail_text || doc.content || "").slice(0, 120);
}

export default function BlocNotesHome() {
  const router   = useRouter();
  const { isDark } = useTheme();

  // ── État ─────────────────────────────────────────────────────────────────
  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [folders,  setFolders]  = useState<NoteFolder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [section,  setSection]  = useState<Section>("all");
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<SortBy>("updated");
  const [view,     setView]     = useState<ViewMode>("grid");
  const [toast,    setToast]    = useState<ToastData | null>(null);
  const [menuDoc,  setMenuDoc]  = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal,  setRenameVal]  = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  function showToast(type: ToastType, msg: string) { setToast({ type, msg }); }

  // ── Chargement ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ section, sort: sortBy, limit: "100" });
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/notes/document?${params}`).catch(() => null);
    if (!res?.ok) { setLoading(false); return; }
    const { documents, folders: f } = await res.json();
    setDocs(documents ?? []);
    setFolders(f ?? []);
    setLoading(false);
  }, [section, sortBy, search]);

  useEffect(() => { void load(); }, [load]);

  // ── Créer un document ────────────────────────────────────────────────────
  async function createDoc(title = "Document sans titre", docType = "document", templateId?: string) {
    setCreating(true);
    const body: Record<string, unknown> = { title, doc_type: docType };
    if (section.startsWith("folder:")) body.folder_id = section.replace("folder:", "");
    if (templateId) body.template_id = templateId;
    const res = await fetch("/api/notes/document", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setCreating(false);
    if (!res?.ok) { showToast("error", "Erreur lors de la création"); return; }
    const { document: d } = await res.json();
    router.push(`/client/bloc-notes/${d.id}`);
  }

  // ── Actions doc ──────────────────────────────────────────────────────────
  async function toggleFavorite(id: string, cur: boolean) {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, is_favorite: !cur } : d));
    await fetch(`/api/notes/document/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !cur }),
    });
  }

  async function archiveDoc(id: string, archive = true) {
    const { error: e } = await fetch(`/api/notes/document/${id}`, {
      method: archive ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: archive ? undefined : JSON.stringify({ is_archived: false }),
    }).then(r => r.json()).catch(() => ({ error: "Erreur" }));
    if (e) { showToast("error", e); return; }
    setDocs(ds => ds.filter(d => d.id !== id));
    showToast("success", archive ? "Déplacé vers la corbeille" : "Document restauré");
    setMenuDoc(null);
  }

  async function deleteForever(id: string) {
    if (!confirm("Supprimer définitivement ce document ?")) return;
    await fetch(`/api/notes/document/${id}?permanent=true`, { method: "DELETE" });
    setDocs(ds => ds.filter(d => d.id !== id));
    showToast("success", "Document supprimé");
    setMenuDoc(null);
  }

  async function renameDoc() {
    if (!renamingId || !renameVal.trim()) return;
    await fetch(`/api/notes/document/${renamingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameVal.trim() }),
    });
    setDocs(ds => ds.map(d => d.id === renamingId ? { ...d, title: renameVal.trim() } : d));
    setRenamingId(null);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/notes/folder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), color: GOLD }),
    }).catch(() => null);
    if (!res?.ok) { showToast("error", "Erreur"); return; }
    const { folder } = await res.json();
    setFolders(f => [...f, folder]);
    setNewFolderOpen(false); setNewFolderName("");
  }

  // ── Clavier ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey) && e.key==="k") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="n") { e.preventDefault(); void createDoc(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Styles ───────────────────────────────────────────────────────────────
  const bg      = isDark ? "bg-[#05091a]"   : "bg-[#f4f5f7]";
  const sidebar  = isDark ? "bg-[#080f1e] border-white/8"  : "bg-white border-gray-200";
  const card     = isDark ? "bg-[#0c1525] border-white/8 hover:border-white/15" : "bg-white border-gray-200 hover:border-gray-300";
  const txt      = isDark ? "text-white"    : "text-gray-900";
  const txtMuted = isDark ? "text-white/40" : "text-gray-400";
  const inputCls = isDark ? "border-white/8 bg-white/4 text-white placeholder:text-white/25 focus:border-white/15"
                          : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300";

  const activeSection = (s: Section) =>
    section === s
      ? "bg-[rgba(201,165,90,0.12)] text-[#c9a55a] font-semibold"
      : isDark ? "text-white/50 hover:bg-white/6 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  return (
    <div className={`flex h-screen ${bg} overflow-hidden`}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`flex w-64 shrink-0 flex-col border-r ${sidebar}`}>
        {/* Logo / en-tête */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`}}>
            <FileText size={15} className="text-white"/>
          </div>
          <span className={`text-sm font-bold ${txt}`}>Documents</span>
        </div>

        {/* Bouton créer */}
        <div className="px-3 pb-3">
          <button
            onClick={() => void createDoc()}
            disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`,boxShadow:`0 4px 16px ${GOLD}25`}}>
            {creating ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
            {creating ? "Création…" : "Nouveau document"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition ${activeSection(s.id)}`}>
              <s.icon size={13}/>{s.label}
            </button>
          ))}

          {/* Séparateur dossiers */}
          <div className={`mx-2 my-2 border-t ${isDark?"border-white/6":"border-gray-100"}`}/>
          <div className={`flex items-center justify-between px-3 py-1 ${txtMuted}`}>
            <span className="text-[0.6rem] font-bold uppercase tracking-widest">Dossiers</span>
            <button onClick={() => setNewFolderOpen(true)} title="Nouveau dossier"
              className={`transition ${isDark?"hover:text-white":"hover:text-gray-700"}`}>
              <FolderPlus size={12}/>
            </button>
          </div>
          {folders.map(f => (
            <button key={f.id} onClick={() => setSection(`folder:${f.id}` as Section)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition ${activeSection(`folder:${f.id}` as Section)}`}>
              <Folder size={13} style={{color: f.color || GOLD}}/>{f.name}
            </button>
          ))}
          {folders.length === 0 && (
            <p className={`px-3 py-2 text-[11px] ${txtMuted}`}>Aucun dossier</p>
          )}

          {/* Formulaire nouveau dossier */}
          <AnimatePresence>
            {newFolderOpen && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                className="overflow-hidden px-3 pb-2">
                <div className="flex gap-1.5">
                  <input autoFocus ref={undefined} value={newFolderName} onChange={e=>setNewFolderName(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")void createFolder();if(e.key==="Escape")setNewFolderOpen(false);}}
                    placeholder="Nom du dossier" className={`flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none ${inputCls}`}/>
                  <button onClick={()=>void createFolder()} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"><Check size={11}/></button>
                  <button onClick={()=>setNewFolderOpen(false)} className={`flex h-7 w-7 items-center justify-center rounded-lg ${isDark?"text-white/30":"text-gray-400"}`}><X size={11}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Pied sidebar */}
        <div className={`border-t px-4 py-3 ${isDark?"border-white/6":"border-gray-100"}`}>
          <p className={`text-[10px] ${txtMuted}`}>{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
        </div>
      </aside>

      {/* ── Zone principale ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Barre d'outils ──────────────────────────────────────────── */}
        <div className={`flex shrink-0 items-center gap-3 border-b px-5 py-3 ${isDark?"border-white/8 bg-[#080f1e]":"border-gray-200 bg-white"}`}>

          {/* Titre de section */}
          <h1 className={`text-sm font-bold ${txt}`}>
            {SECTIONS.find(s=>s.id===section)?.label ??
             folders.find(f=>`folder:${f.id}`===section)?.name ?? "Documents"}
          </h1>

          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-sm">
            <Search size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 ${txtMuted}`}/>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Rechercher… (Ctrl+K)"
              className={`h-8 w-full rounded-xl border pl-8 pr-3 text-xs outline-none transition ${inputCls}`}/>
            {search && (
              <button onClick={() => setSearch("")} className={`absolute right-2 top-1/2 -translate-y-1/2 ${txtMuted}`}><X size={11}/></button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Tri */}
            <div className="relative group">
              <button className={`flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs transition ${isDark?"border-white/10 text-white/50 hover:border-white/20 hover:text-white":"border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
                <SortAsc size={11}/>
                {sortBy === "updated" ? "Récent" : sortBy === "alpha" ? "A-Z" : "Type"}
              </button>
              <div className={`absolute right-0 top-9 z-50 hidden w-36 rounded-xl border py-1 shadow-xl group-hover:block ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
                {(["updated","alpha","type"] as SortBy[]).map(s => (
                  <button key={s} onClick={()=>setSortBy(s)} className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition ${sortBy===s?"text-[#c9a55a] font-semibold":isDark?"text-white/60 hover:bg-white/6 hover:text-white":"text-gray-700 hover:bg-gray-50"}`}>
                    {s==="updated"?"Récemment modifié":s==="alpha"?"Nom A→Z":"Type"}
                  </button>
                ))}
              </div>
            </div>

            {/* Vue grille / liste */}
            <button onClick={()=>setView(v=>v==="grid"?"list":"grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark?"border-white/10 text-white/50 hover:border-white/20 hover:text-white":"border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700"}`}>
              {view === "grid" ? <List size={13}/> : <LayoutGrid size={13}/>}
            </button>
          </div>
        </div>

        {/* ── Contenu ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{color:GOLD}}/>
            </div>
          )}

          {!loading && docs.length === 0 && (
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{background:`${GOLD}15`}}>
                <FileText size={28} style={{color:GOLD}}/>
              </div>
              <div>
                <p className={`text-sm font-semibold ${txt}`}>
                  {section==="trash"?"La corbeille est vide":section==="favorites"?"Aucun favori":search?"Aucun résultat":"Aucun document"}
                </p>
                <p className={`mt-1 text-xs ${txtMuted}`}>
                  {section==="trash"?"Les documents supprimés apparaissent ici":section==="favorites"?"Marquez des documents comme favoris":search?`Aucun document pour "${search}"`:
                  "Créez votre premier document avec Ctrl+N"}
                </p>
              </div>
              {section !== "trash" && !search && (
                <button onClick={()=>void createDoc()} disabled={creating}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
                  style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`}}>
                  <Plus size={14}/> Nouveau document
                </button>
              )}
            </motion.div>
          )}

          {!loading && docs.length > 0 && (
            view === "grid" ? (
              <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))"}}>
                {docs.map(doc => (
                  <DocCard key={doc.id} doc={doc} isDark={isDark} card={card} txt={txt} txtMuted={txtMuted}
                    isMenuOpen={menuDoc===doc.id}
                    isRenaming={renamingId===doc.id}
                    renameVal={renameVal}
                    renameRef={renameRef}
                    onOpen={() => router.push(`/client/bloc-notes/${doc.id}`)}
                    onToggleFav={() => void toggleFavorite(doc.id, !!doc.is_favorite)}
                    onMenu={() => setMenuDoc(menuDoc===doc.id?null:doc.id)}
                    onCloseMenu={() => setMenuDoc(null)}
                    onRename={() => { setRenamingId(doc.id); setRenameVal(doc.title); setTimeout(()=>renameRef.current?.focus(),50); }}
                    onRenameChange={setRenameVal}
                    onRenameSubmit={()=>void renameDoc()}
                    onArchive={() => void archiveDoc(doc.id, !doc.is_archived)}
                    onDelete={() => void deleteForever(doc.id)}
                    inTrash={section==="trash"}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {docs.map(doc => (
                  <DocRow key={doc.id} doc={doc} isDark={isDark} txt={txt} txtMuted={txtMuted}
                    isMenuOpen={menuDoc===doc.id}
                    onOpen={() => router.push(`/client/bloc-notes/${doc.id}`)}
                    onToggleFav={() => void toggleFavorite(doc.id, !!doc.is_favorite)}
                    onMenu={() => setMenuDoc(menuDoc===doc.id?null:doc.id)}
                    onCloseMenu={() => setMenuDoc(null)}
                    onArchive={() => void archiveDoc(doc.id, !doc.is_archived)}
                    onDelete={() => void deleteForever(doc.id)}
                    inTrash={section==="trash"}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Menu contextuel (overlay de fermeture) ──────────────────────── */}
      {menuDoc && <div className="fixed inset-0 z-30" onClick={() => setMenuDoc(null)}/>}

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}

// ── Card (vue grille) ─────────────────────────────────────────────────────────
function DocCard({
  doc, isDark, card, txt, txtMuted,
  isMenuOpen, isRenaming, renameVal, renameRef,
  onOpen, onToggleFav, onMenu, onCloseMenu,
  onRename, onRenameChange, onRenameSubmit,
  onArchive, onDelete, inTrash,
}: {
  doc: Doc; isDark: boolean; card: string; txt: string; txtMuted: string;
  isMenuOpen: boolean; isRenaming: boolean; renameVal: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onOpen: ()=>void; onToggleFav: ()=>void; onMenu: ()=>void; onCloseMenu: ()=>void;
  onRename: ()=>void; onRenameChange: (v:string)=>void; onRenameSubmit: ()=>void;
  onArchive: ()=>void; onDelete: ()=>void; inTrash: boolean;
}) {
  const accent = DOC_TYPE_COLORS[doc.doc_type ?? "document"] ?? GOLD;
  return (
    <motion.div layout initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition cursor-pointer ${card}`}
      onClick={onOpen}>

      {/* Miniature */}
      <div className={`relative h-32 w-full overflow-hidden ${isDark?"bg-[#0a1020]":"bg-gray-50"}`}
        style={{borderBottom:`1.5px solid ${accent}20`}}>
        {/* Feuille simulée */}
        <div className="absolute inset-3 rounded-lg bg-white shadow-sm p-2.5 overflow-hidden">
          <div style={{height:3,background:`${accent}40`,borderRadius:2,marginBottom:4,width:"60%"}}/>
          {(thumbnail(doc)||"").split(/\s+/).slice(0,30).join(" ").split("").slice(0,200).length > 0
            ? <p className="text-[7px] leading-relaxed text-gray-400 line-clamp-6">{thumbnail(doc)}</p>
            : <div className="space-y-1.5">{[70,50,85,40].map((w,i)=>(
                <div key={i} className="h-1.5 rounded-full bg-gray-200" style={{width:`${w}%`}}/>
              ))}</div>
          }
        </div>
        {/* Indicateur type */}
        <div className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
          style={{background:accent}}>{(doc.doc_type??"document").toUpperCase()}</div>
        {/* Favori */}
        <button onClick={e=>{e.stopPropagation();onToggleFav();}}
          className={`absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 ${doc.is_favorite?"!opacity-100 text-amber-400":isDark?"text-white/40":"text-gray-300"}`}>
          <Star size={12} fill={doc.is_favorite?"currentColor":"none"}/>
        </button>
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-0.5 p-3">
        {isRenaming ? (
          <input ref={renameRef} value={renameVal} onChange={e=>onRenameChange(e.target.value)}
            onBlur={onRenameSubmit} onKeyDown={e=>{if(e.key==="Enter")onRenameSubmit();if(e.key==="Escape")onRenameChange(doc.title);}}
            className={`w-full rounded-lg border px-2 py-1 text-xs font-semibold outline-none ${isDark?"border-white/15 bg-white/6 text-white":"border-gray-300 bg-white text-gray-900"}`}
            onClick={e=>e.stopPropagation()}/>
        ) : (
          <p className={`truncate text-xs font-semibold ${txt}`}>{doc.title || "Sans titre"}</p>
        )}
        <div className={`flex items-center gap-1.5 text-[10px] ${txtMuted}`}>
          <Clock size={9}/>{formatDate(doc.updated_at)}
          {doc.word_count ? <><span>·</span>{doc.word_count} mots</> : null}
        </div>
      </div>

      {/* Menu contextuel */}
      <div className="absolute bottom-2 right-2">
        <button onClick={e=>{e.stopPropagation();onMenu();}}
          className={`flex h-6 w-6 items-center justify-center rounded-lg opacity-0 transition group-hover:opacity-100 ${isDark?"text-white/30 hover:bg-white/10 hover:text-white":"text-gray-300 hover:bg-gray-100 hover:text-gray-700"}`}>
          <MoreHorizontal size={12}/>
        </button>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{opacity:0,scale:0.95,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:4}}
              className={`absolute bottom-7 right-0 z-50 w-40 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}
              onClick={e=>e.stopPropagation()}>
              <CtxItem onClick={onRename} isDark={isDark} icon={<Pencil size={11}/>}>Renommer</CtxItem>
              <CtxItem onClick={onToggleFav} isDark={isDark} icon={<Star size={11}/>}>{doc.is_favorite?"Retirer des favoris":"Ajouter aux favoris"}</CtxItem>
              {inTrash
                ? <><CtxItem onClick={onArchive} isDark={isDark} icon={<RefreshCw size={11}/>}>Restaurer</CtxItem>
                    <CtxItem onClick={onDelete} isDark={isDark} icon={<Trash2 size={11}/>} danger>Supprimer définitivement</CtxItem></>
                : <CtxItem onClick={onArchive} isDark={isDark} icon={<Archive size={11}/>}>Mettre à la corbeille</CtxItem>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Ligne (vue liste) ─────────────────────────────────────────────────────────
function DocRow({
  doc, isDark, txt, txtMuted,
  isMenuOpen, onOpen, onToggleFav, onMenu, onCloseMenu,
  onArchive, onDelete, inTrash,
}: {
  doc: Doc; isDark: boolean; txt: string; txtMuted: string;
  isMenuOpen: boolean;
  onOpen: ()=>void; onToggleFav: ()=>void; onMenu: ()=>void; onCloseMenu: ()=>void;
  onArchive: ()=>void; onDelete: ()=>void; inTrash: boolean;
}) {
  const accent = DOC_TYPE_COLORS[doc.doc_type ?? "document"] ?? GOLD;
  return (
    <motion.div layout initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition ${isDark?"hover:bg-white/4":"hover:bg-gray-50"}`}
      onClick={onOpen}>
      {/* Icône type */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{background:`${accent}15`}}>
        <FileText size={14} style={{color:accent}}/>
      </div>
      {/* Titre + extrait */}
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-medium ${txt}`}>{doc.title || "Sans titre"}</p>
        <p className={`truncate text-[11px] ${txtMuted}`}>{thumbnail(doc).slice(0,80) || "Aucun contenu"}</p>
      </div>
      {/* Meta */}
      <div className={`hidden shrink-0 items-center gap-3 text-[10px] sm:flex ${txtMuted}`}>
        {doc.word_count ? <span>{doc.word_count} mots</span> : null}
        <span>{formatDate(doc.updated_at)}</span>
      </div>
      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={e=>{e.stopPropagation();onToggleFav();}}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${doc.is_favorite?"!opacity-100 text-amber-400":isDark?"text-white/30 hover:text-white":"text-gray-300 hover:text-gray-700"}`}>
          <Star size={12} fill={doc.is_favorite?"currentColor":"none"}/>
        </button>
        <div className="relative">
          <button onClick={e=>{e.stopPropagation();onMenu();}}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${isDark?"text-white/30 hover:bg-white/8 hover:text-white":"text-gray-300 hover:bg-gray-100 hover:text-gray-700"}`}>
            <MoreHorizontal size={12}/>
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div initial={{opacity:0,scale:0.95,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:4}}
                className={`absolute right-0 top-8 z-50 w-44 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}
                onClick={e=>e.stopPropagation()}>
                <CtxItem onClick={onToggleFav} isDark={isDark} icon={<Star size={11}/>}>{doc.is_favorite?"Retirer des favoris":"Ajouter aux favoris"}</CtxItem>
                {inTrash
                  ? <><CtxItem onClick={onArchive} isDark={isDark} icon={<RefreshCw size={11}/>}>Restaurer</CtxItem>
                      <CtxItem onClick={onDelete} isDark={isDark} icon={<Trash2 size={11}/>} danger>Supprimer définitivement</CtxItem></>
                  : <CtxItem onClick={onArchive} isDark={isDark} icon={<Archive size={11}/>}>Mettre à la corbeille</CtxItem>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Item menu contextuel ──────────────────────────────────────────────────────
function CtxItem({ onClick, isDark, icon, children, danger=false }: {
  onClick: ()=>void; isDark: boolean; icon: React.ReactNode; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition ${
        danger ? "text-red-400 hover:bg-red-500/10"
               : isDark ? "text-white/60 hover:bg-white/6 hover:text-white" : "text-gray-700 hover:bg-gray-50"
      }`}>
      {icon}{children}
    </button>
  );
}
