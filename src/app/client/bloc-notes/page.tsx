"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Folder, FolderPlus, FileText, Star, Trash2,
  LayoutGrid, List, Loader2, X, BookOpen, Clock, AlignLeft,
  SortAsc, MoreHorizontal, Pencil, Check, Archive, RefreshCw,
  Upload, Users, Share2, Filter, ChevronDown,
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
  word_count?: number; page_format?: string;
  created_at: string; updated_at: string;
}
interface NoteFolder { id: string; name: string; color: string; }

type Section  = "all"|"recent"|"favorites"|"shared"|"templates"|"trash"|`folder:${string}`;
type SortBy   = "updated"|"created"|"alpha-asc"|"alpha-desc";
type ViewMode = "grid"|"list";

const GOLD = "#c9a55a";

const SIDEBAR_ITEMS: { id: Section; label: string; icon: React.FC<{size:number;className?:string}> }[] = [
  { id: "all",       label: "Tous les documents", icon: AlignLeft  },
  { id: "recent",    label: "Récents",             icon: Clock      },
  { id: "favorites", label: "Favoris",             icon: Star       },
  { id: "shared",    label: "Partagés avec moi",  icon: Share2     },
  { id: "templates", label: "Modèles",             icon: BookOpen   },
  { id: "trash",     label: "Corbeille",           icon: Trash2     },
];

const BUILT_IN_TEMPLATES = [
  { id: "blank",      title: "Document vierge",        desc: "Page blanche" },
  { id: "rapport",    title: "Rapport professionnel",  desc: "Structure formelle avec sections" },
  { id: "compte-rendu", title: "Compte rendu",        desc: "CR de réunion avec ordre du jour" },
  { id: "lettre",     title: "Lettre",                 desc: "Lettre professionnelle" },
  { id: "proposition",title: "Proposition commerciale",desc: "Offre de services" },
  { id: "university", title: "Rapport universitaire",  desc: "Rapport académique avec bibliographie" },
  { id: "meeting",    title: "Notes de réunion",       desc: "Agenda, décisions, actions" },
  { id: "cdc",        title: "Cahier des charges",     desc: "Spécifications techniques" },
];

function formatDate(iso: string) {
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `il y a ${Math.round(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.round(diff/3600)} h`;
  if (diff < 604800)return `il y a ${Math.round(diff/86400)} j`;
  return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year: diff>365*86400?"numeric":undefined });
}

// Couleurs par type
const TYPE_COLOR: Record<string, string> = {
  document: GOLD, template: "#8b5cf6", note: "#3b82f6",
};

export default function BlocNotesHome() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { isDark }   = useTheme();

  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [folders,  setFolders]  = useState<NoteFolder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [section,  setSection]  = useState<Section>("all");
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<SortBy>("updated");
  const [view,     setView]     = useState<ViewMode>("grid");
  const [toast,    setToast]    = useState<ToastData | null>(null);
  const [menuDocId,setMenuDocId]= useState<string|null>(null);
  const [renamingId,setRenamingId]=useState<string|null>(null);
  const [renameVal, setRenameVal]=useState("");
  const [newFolderOpen,setNewFolderOpen]=useState(false);
  const [newFolderName,setNewFolderName]=useState("");
  const [showImport,setShowImport]=useState(false);
  const [showTemplates,setShowTemplates]=useState(false);
  const [showSort, setShowSort]=useState(false);

  const searchRef  = useRef<HTMLInputElement>(null);
  const renameRef  = useRef<HTMLInputElement>(null);
  const importRef  = useRef<HTMLInputElement>(null);

  function showToast(type: ToastType, msg: string) { setToast({ type, msg }); }

  // Créer depuis "?new=1" dans l'URL
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      router.replace("/client/bloc-notes");
      void createDoc();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chargement ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    let apiSection = section;
    if (section === "recent") apiSection = "all";
    const params = new URLSearchParams({ section: apiSection, sort: sortBy==="alpha-asc"?"alpha":sortBy==="alpha-desc"?"alpha":sortBy==="created"?"updated":"updated", limit:"100" });
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/notes/document?${params}`).catch(()=>null);
    if (!res?.ok) { setLoading(false); return; }
    const { documents, folders: f } = await res.json();
    let sorted: Doc[] = documents ?? [];
    if (sortBy==="alpha-desc") sorted = [...sorted].sort((a,b)=>b.title.localeCompare(a.title,"fr"));
    if (sortBy==="alpha-asc")  sorted = [...sorted].sort((a,b)=>a.title.localeCompare(b.title,"fr"));
    if (sortBy==="created")    sorted = [...sorted].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
    if (section==="recent")    sorted = sorted.slice(0,20);
    setDocs(sorted); setFolders(f ?? []); setLoading(false);
  }, [section, sortBy, search]);

  useEffect(() => { void load(); }, [load]);

  // ── Créer un document ──────────────────────────────────────────────────────
  // engine: 'collabora' = nouveau DOCX bureautique | 'tiptap' = ancien format (templates)
  async function createDoc(templateKey?: string, engine: "collabora" | "tiptap" = "collabora") {
    setCreating(true);
    const body: Record<string, unknown> = { title: "Document sans titre", doc_type: "document" };
    if (section.startsWith("folder:")) body.folder_id = section.replace("folder:","");
    if (engine === "collabora") {
      body.editor_engine = "collabora";
    } else if (templateKey && templateKey !== "blank") {
      body.template_id = templateKey;
    }
    const res = await fetch("/api/notes/document", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(()=>null);
    setCreating(false); setShowTemplates(false);
    if (!res?.ok) { showToast("error","Erreur lors de la création"); return; }
    const { document: d } = await res.json();
    router.push(`/client/bloc-notes/${d.id}`);
  }

  // ── Import fichier ─────────────────────────────────────────────────────────
  async function handleImport(file: File) {
    setShowImport(false);
    const ext = file.name.split(".").pop()?.toLowerCase();
    let content_json: string | undefined;
    let content_text = "";

    if (ext==="txt"||ext==="md") {
      content_text = await file.text();
    } else if (ext==="docx") {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/notes/import", { method: "POST", body: form }).catch(()=>null);
      if (!res?.ok) { showToast("error","Erreur import DOCX"); return; }
      const { html } = await res.json();
      content_text = html.replace(/<[^>]+>/g," ").trim();
      content_json = JSON.stringify({ type:"doc", content: [{ type:"paragraph", content:[{type:"text",text:content_text.slice(0,100)+"…"}] }] });
    } else {
      showToast("error","Format non supporté (.txt, .md, .docx)"); return;
    }

    const body: Record<string,unknown> = {
      title: file.name.replace(/\.[^.]+$/,""),
      content: content_text.slice(0,50000),
      doc_type: "document",
    };
    if (content_json) body.content_json = content_json;
    const res = await fetch("/api/notes/document", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body),
    }).catch(()=>null);
    if (!res?.ok) { showToast("error","Erreur création"); return; }
    const { document: d } = await res.json();
    showToast("success","Document importé");
    router.push(`/client/bloc-notes/${d.id}`);
  }

  // ── Actions document ───────────────────────────────────────────────────────
  async function toggleFav(id: string, cur: boolean) {
    setDocs(ds=>ds.map(d=>d.id===id?{...d,is_favorite:!cur}:d));
    await fetch(`/api/notes/document/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_favorite:!cur})});
  }
  async function archiveDoc(id: string, archive = true) {
    if (archive) {
      const res = await fetch(`/api/notes/document/${id}`,{method:"DELETE"});
      if (!res.ok) { showToast("error","Erreur"); return; }
    } else {
      await fetch(`/api/notes/document/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_archived:false})});
    }
    setDocs(ds=>ds.filter(d=>d.id!==id));
    showToast("success",archive?"Déplacé vers la corbeille":"Restauré");
    setMenuDocId(null);
  }
  async function deleteForever(id: string) {
    if (!confirm("Supprimer définitivement ?")) return;
    await fetch(`/api/notes/document/${id}?permanent=true`,{method:"DELETE"});
    setDocs(ds=>ds.filter(d=>d.id!==id));
    showToast("success","Supprimé"); setMenuDocId(null);
  }
  async function renameDoc() {
    if (!renamingId||!renameVal.trim()) { setRenamingId(null); return; }
    await fetch(`/api/notes/document/${renamingId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:renameVal.trim()})});
    setDocs(ds=>ds.map(d=>d.id===renamingId?{...d,title:renameVal.trim()}:d));
    setRenamingId(null);
  }
  async function createFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/notes/folder",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newFolderName.trim(),color:GOLD})}).catch(()=>null);
    if (!res?.ok) { showToast("error","Erreur"); return; }
    const { folder } = await res.json();
    setFolders(f=>[...f,folder]); setNewFolderOpen(false); setNewFolderName("");
  }

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey)&&e.key==="k") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="n") { e.preventDefault(); void createDoc(); }
    };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // ── Classes ────────────────────────────────────────────────────────────────
  const bg       = isDark ? "bg-[#05091a]"  : "bg-[#f0f2f5]";
  const side     = isDark ? "bg-[#080f1e] border-white/8" : "bg-white border-gray-200";
  const topbar   = isDark ? "bg-[#080f1e] border-white/8" : "bg-white border-gray-200";
  const txt      = isDark ? "text-white"  : "text-gray-900";
  const txtMuted = isDark ? "text-white/40" : "text-gray-400";
  const inputCls = isDark ? "border-white/8 bg-white/4 text-white placeholder:text-white/25 focus:border-white/15"
                          : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300";

  function activeSection(s: Section) {
    return section===s
      ? `bg-[rgba(201,165,90,0.1)] text-[#c9a55a] font-semibold`
      : isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  }

  const sectionLabel = SIDEBAR_ITEMS.find(s=>s.id===section)?.label
    ?? folders.find(f=>`folder:${f.id}`===section)?.name
    ?? "Documents";

  return (
    <div className={`flex h-screen overflow-hidden ${bg}`}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`flex w-60 shrink-0 flex-col border-r ${side}`}>
        {/* En-tête */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`linear-gradient(135deg,${GOLD},#a8821f)`}}>
            <FileText size={14} className="text-white"/>
          </div>
          <span className={`text-sm font-bold ${txt}`}>DJAMA Doc</span>
        </div>

        {/* Créer */}
        <div className="space-y-1 px-3 pb-2">
          <button onClick={()=>setShowTemplates(true)} disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{background:`linear-gradient(135deg,${GOLD},#a8821f)`,boxShadow:`0 3px 12px ${GOLD}25`}}>
            {creating?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>}
            Nouveau document
          </button>
          <button onClick={()=>importRef.current?.click()}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-1.5 text-xs transition ${isDark?"border-white/8 text-white/50 hover:bg-white/5 hover:text-white":"border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            <Upload size={11}/> Importer un fichier
          </button>
          <input ref={importRef} type="file" accept=".txt,.md,.docx" className="hidden"
            onChange={e=>{ const f=e.target.files?.[0]; if(f)void handleImport(f); e.target.value=""; }}/>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {SIDEBAR_ITEMS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition ${activeSection(s.id)}`}>
              <s.icon size={13}/>{s.label}
            </button>
          ))}

          {/* Dossiers */}
          <div className={`mx-1 my-2 border-t ${isDark?"border-white/6":"border-gray-100"}`}/>
          <div className={`flex items-center justify-between px-3 py-1 ${txtMuted}`}>
            <span className="text-[0.58rem] font-bold uppercase tracking-widest">Dossiers</span>
            <button onClick={()=>setNewFolderOpen(true)} title="Nouveau dossier" className={`transition ${isDark?"hover:text-white":"hover:text-gray-600"}`}><FolderPlus size={11}/></button>
          </div>
          {folders.map(f=>(
            <button key={f.id} onClick={()=>setSection(`folder:${f.id}` as Section)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition ${activeSection(`folder:${f.id}` as Section)}`}>
              <Folder size={12} style={{color:f.color||GOLD}}/>{f.name}
            </button>
          ))}
          {folders.length===0 && <p className={`px-3 py-1 text-[10px] ${txtMuted}`}>Aucun dossier</p>}

          {/* Nouveau dossier */}
          <AnimatePresence>
            {newFolderOpen && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden px-2 pb-1">
                <div className="flex gap-1">
                  <input autoFocus value={newFolderName} onChange={e=>setNewFolderName(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")void createFolder();if(e.key==="Escape")setNewFolderOpen(false);}}
                    placeholder="Nom du dossier" className={`flex-1 rounded-lg border px-2 py-1 text-xs outline-none ${inputCls}`}/>
                  <button onClick={()=>void createFolder()} className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"><Check size={10}/></button>
                  <button onClick={()=>setNewFolderOpen(false)} className={`flex h-6 w-6 items-center justify-center rounded-lg ${isDark?"text-white/30":"text-gray-400"}`}><X size={10}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Pied sidebar */}
        <div className={`border-t px-4 py-2 ${isDark?"border-white/6":"border-gray-100"}`}>
          <p className={`text-[10px] ${txtMuted}`}>{docs.length} document{docs.length!==1?"s":""}</p>
        </div>
      </aside>

      {/* ── Zone principale ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <div className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 ${topbar}`}>
          <h1 className={`shrink-0 text-sm font-bold ${txt}`}>{sectionLabel}</h1>

          {/* Recherche */}
          <div className="relative ml-3 flex-1 max-w-md">
            <Search size={11} className={`absolute left-3 top-1/2 -translate-y-1/2 ${txtMuted}`}/>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Rechercher un document… (Ctrl+K)"
              className={`h-8 w-full rounded-xl border pl-8 pr-7 text-xs outline-none transition ${inputCls}`}/>
            {search && <button onClick={()=>setSearch("")} className={`absolute right-2 top-1/2 -translate-y-1/2 ${txtMuted}`}><X size={10}/></button>}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Tri */}
            <div className="relative">
              <button onClick={()=>setShowSort(o=>!o)}
                className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs transition ${isDark?"border-white/8 text-white/50 hover:border-white/15 hover:text-white":"border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                <SortAsc size={11}/>
                {sortBy==="updated"?"Récent":sortBy==="created"?"Créé":sortBy==="alpha-asc"?"A-Z":"Z-A"}
                <ChevronDown size={9} className="opacity-50"/>
              </button>
              {showSort && <>
                <div className="fixed inset-0 z-40" onClick={()=>setShowSort(false)}/>
                <div className={`absolute right-0 top-9 z-50 w-40 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
                  {([["updated","Récemment modifié"],["created","Date de création"],["alpha-asc","Nom A→Z"],["alpha-desc","Nom Z→A"]] as [SortBy,string][]).map(([v,l])=>(
                    <button key={v} onClick={()=>{setSortBy(v);setShowSort(false);}}
                      className={`flex w-full items-center px-3 py-2 text-xs transition ${sortBy===v?`text-[${GOLD}] font-semibold`:isDark?"text-white/60 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </>}
            </div>

            {/* Vue */}
            <button onClick={()=>setView(v=>v==="grid"?"list":"grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark?"border-white/8 text-white/40 hover:border-white/15 hover:text-white":"border-gray-200 text-gray-400 hover:border-gray-300"}`}>
              {view==="grid"?<List size={13}/>:<LayoutGrid size={13}/>}
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Section Modèles — afficher la galerie en-tête */}
          {section==="templates" && (
            <div className="mb-6">
              <h2 className={`mb-3 text-xs font-bold uppercase tracking-widest ${txtMuted}`}>Modèles disponibles</h2>
              <div className="grid gap-2" style={{gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))"}}>
                {BUILT_IN_TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>void createDoc(t.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition hover:border-[${GOLD}]/40 ${isDark?"border-white/8 bg-white/3 hover:bg-white/6":"border-gray-200 bg-white hover:bg-gray-50"}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{background:`${GOLD}15`}}>
                      <FileText size={14} style={{color:GOLD}}/>
                    </div>
                    <p className={`text-xs font-semibold ${txt}`}>{t.title}</p>
                    <p className={`text-[10px] ${txtMuted}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
              {docs.length>0 && <div className={`my-5 border-t ${isDark?"border-white/6":"border-gray-200"}`}/>}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{color:GOLD}}/>
            </div>
          )}

          {!loading && docs.length===0 && section!=="templates" && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{background:`${GOLD}12`}}>
                <FileText size={22} style={{color:GOLD}}/>
              </div>
              <p className={`text-sm font-semibold ${txt}`}>
                {section==="trash"?"La corbeille est vide":section==="favorites"?"Aucun favori":section==="shared"?"Aucun document partagé":search?"Aucun résultat":"Aucun document"}
              </p>
              <p className={`text-xs ${txtMuted}`}>
                {section==="trash"?"Documents supprimés":section==="favorites"?"Marquez des favoris avec ⭐":search?`Aucun résultat pour "${search}"`:
                section==="shared"?"Les documents partagés avec vous apparaîtront ici":"Créez votre premier document (Ctrl+N)"}
              </p>
              {["all","recent"].includes(section) && !search && (
                <button onClick={()=>void createDoc()} disabled={creating}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white"
                  style={{background:`linear-gradient(135deg,${GOLD},#a8821f)`}}>
                  <Plus size={12}/> Nouveau document
                </button>
              )}
            </motion.div>
          )}

          {!loading && docs.length>0 && (
            view==="grid" ? (
              <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))"}}>
                {docs.map(doc=>(
                  <DocCard key={doc.id} doc={doc} isDark={isDark} txt={txt} txtMuted={txtMuted}
                    isMenuOpen={menuDocId===doc.id} isRenaming={renamingId===doc.id}
                    renameVal={renameVal} renameRef={renameRef}
                    onOpen={()=>router.push(`/client/bloc-notes/${doc.id}`)}
                    onToggleFav={()=>void toggleFav(doc.id,!!doc.is_favorite)}
                    onMenu={()=>setMenuDocId(menuDocId===doc.id?null:doc.id)}
                    onRename={()=>{setRenamingId(doc.id);setRenameVal(doc.title);setTimeout(()=>renameRef.current?.focus(),40);}}
                    onRenameChange={setRenameVal} onRenameSubmit={()=>void renameDoc()}
                    onArchive={()=>void archiveDoc(doc.id,!doc.is_archived)}
                    onDelete={()=>void deleteForever(doc.id)}
                    inTrash={section==="trash"}/>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {docs.map(doc=>(
                  <DocRow key={doc.id} doc={doc} isDark={isDark} txt={txt} txtMuted={txtMuted}
                    isMenuOpen={menuDocId===doc.id}
                    onOpen={()=>router.push(`/client/bloc-notes/${doc.id}`)}
                    onToggleFav={()=>void toggleFav(doc.id,!!doc.is_favorite)}
                    onMenu={()=>setMenuDocId(menuDocId===doc.id?null:doc.id)}
                    onArchive={()=>void archiveDoc(doc.id,!doc.is_archived)}
                    onDelete={()=>void deleteForever(doc.id)}
                    inTrash={section==="trash"}/>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Overlay fermeture menu */}
      {menuDocId && <div className="fixed inset-0 z-30" onClick={()=>setMenuDocId(null)}/>}

      {/* ── Modal choix modèle ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showTemplates && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={()=>setShowTemplates(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:8}}
              className={`fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-xl mx-auto rounded-2xl border shadow-2xl ${isDark?"border-white/10 bg-[#0c1525]":"border-gray-200 bg-white"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark?"border-white/8":"border-gray-100"}`}>
                <h2 className={`text-sm font-bold ${txt}`}>Nouveau document</h2>
                <button onClick={()=>setShowTemplates(false)} className={isDark?"text-white/30":"text-gray-400"}><X size={14}/></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Option principale : nouveau document bureautique Collabora */}
                <button onClick={()=>void createDoc(undefined, "collabora")} disabled={creating}
                  className="flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition"
                  style={{borderColor:`${GOLD}50`,background:`${GOLD}08`}}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-lg font-bold"
                    style={{background:`linear-gradient(135deg,${GOLD},#a8821f)`}}>W</div>
                  <div>
                    <p className={`text-sm font-bold ${txt}`}>Document bureautique (DOCX)</p>
                    <p className={`text-[10px] ${isDark?"text-white/40":"text-gray-400"}`}>Ouvre dans DJAMA Doc — compatible Word, LibreOffice</p>
                  </div>
                </button>

                {/* Modèles Tiptap existants */}
                <div>
                  <p className={`mb-2 text-[9px] font-bold uppercase tracking-widest ${isDark?"text-white/25":"text-gray-400"}`}>Modèles (éditeur texte)</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {BUILT_IN_TEMPLATES.map(t=>(
                      <button key={t.id} onClick={()=>void createDoc(t.id, "tiptap")} disabled={creating}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${isDark?"border-white/8 hover:border-[#c9a55a]/30 hover:bg-[rgba(201,165,90,0.06)]":"border-gray-200 hover:border-[#c9a55a]/40 hover:bg-[rgba(201,165,90,0.04)]"}`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:`${GOLD}12`}}>
                          <FileText size={18} style={{color:GOLD}}/>
                        </div>
                        <p className={`text-[11px] font-medium leading-tight ${txt}`}>{t.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}

// ── Card grille ───────────────────────────────────────────────────────────────
function DocCard({ doc, isDark, txt, txtMuted, isMenuOpen, isRenaming, renameVal, renameRef,
  onOpen, onToggleFav, onMenu, onRename, onRenameChange, onRenameSubmit, onArchive, onDelete, inTrash }: {
  doc: Doc; isDark: boolean; txt: string; txtMuted: string;
  isMenuOpen: boolean; isRenaming: boolean; renameVal: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onOpen:()=>void; onToggleFav:()=>void; onMenu:()=>void; onRename:()=>void;
  onRenameChange:(v:string)=>void; onRenameSubmit:()=>void;
  onArchive:()=>void; onDelete:()=>void; inTrash:boolean;
}) {
  const accent = TYPE_COLOR[doc.doc_type??"document"] ?? GOLD;
  const preview = (doc.thumbnail_text||doc.content||"").slice(0,200);
  return (
    <motion.div layout initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition ${isDark?"bg-[#0c1525] border-white/8 hover:border-white/15":"bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}
      onClick={onOpen}>
      {/* Miniature A4 simulée */}
      <div className={`relative h-36 overflow-hidden ${isDark?"bg-[#080f1e]":"bg-[#f5f5f5]"}`}
        style={{borderBottom:`2px solid ${accent}20`}}>
        {/* Feuille blanche */}
        <div className="absolute inset-2.5 rounded bg-white shadow-sm overflow-hidden p-2.5">
          {/* En-tête document */}
          <div style={{height:2.5,width:"65%",background:`${accent}60`,borderRadius:2,marginBottom:5}}/>
          {preview
            ? <p className="text-[6px] leading-relaxed text-gray-400 overflow-hidden" style={{maxHeight:72}}>{preview}</p>
            : <div className="space-y-1.5">{[65,80,55,70,45].map((w,i)=><div key={i} className="h-1.5 rounded-full bg-gray-200" style={{width:`${w}%`}}/>)}</div>
          }
        </div>
        {/* Badge type */}
        <span className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[8px] font-bold text-white" style={{background:accent}}>
          {(doc.doc_type??"DOC").toUpperCase()}
        </span>
        {/* Favori */}
        <button onClick={e=>{e.stopPropagation();onToggleFav();}}
          className={`absolute right-2 top-2 transition ${doc.is_favorite?"text-amber-400":"opacity-0 group-hover:opacity-100 text-gray-300 hover:text-amber-400"}`}>
          <Star size={11} fill={doc.is_favorite?"currentColor":"none"}/>
        </button>
      </div>

      {/* Infos */}
      <div className="flex-1 p-2.5">
        {isRenaming
          ? <input ref={renameRef} value={renameVal}
              onChange={e=>onRenameChange(e.target.value)}
              onBlur={onRenameSubmit}
              onKeyDown={e=>{if(e.key==="Enter")onRenameSubmit();if(e.key==="Escape")onRenameChange(doc.title);}}
              className={`w-full rounded border px-1.5 py-0.5 text-xs font-semibold outline-none ${isDark?"border-white/15 bg-white/6 text-white":"border-gray-300 bg-white text-gray-900"}`}
              onClick={e=>e.stopPropagation()}/>
          : <p className={`truncate text-xs font-semibold ${txt}`}>{doc.title||"Sans titre"}</p>
        }
        <p className={`mt-0.5 text-[10px] ${txtMuted}`}>{formatDate(doc.updated_at)}{doc.word_count?` · ${doc.word_count} mots`:""}</p>
      </div>

      {/* Menu contextuel */}
      <div className="absolute bottom-2 right-2 z-10">
        <button onClick={e=>{e.stopPropagation();onMenu();}}
          className={`flex h-6 w-6 items-center justify-center rounded-lg opacity-0 transition group-hover:opacity-100 ${isDark?"text-white/30 hover:bg-white/10 hover:text-white":"text-gray-300 hover:bg-gray-100 hover:text-gray-700"}`}>
          <MoreHorizontal size={11}/>
        </button>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{opacity:0,scale:0.95,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:4}}
              className={`absolute bottom-7 right-0 z-50 w-44 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}
              onClick={e=>e.stopPropagation()}>
              <CtxItem onClick={onRename} isDark={isDark} icon={<Pencil size={10}/>}>Renommer</CtxItem>
              <CtxItem onClick={onToggleFav} isDark={isDark} icon={<Star size={10}/>}>{doc.is_favorite?"Retirer des favoris":"Ajouter aux favoris"}</CtxItem>
              {inTrash
                ? <><CtxItem onClick={onArchive} isDark={isDark} icon={<RefreshCw size={10}/>}>Restaurer</CtxItem>
                    <CtxItem onClick={onDelete} isDark={isDark} icon={<Trash2 size={10}/>} danger>Supprimer définitivement</CtxItem></>
                : <CtxItem onClick={onArchive} isDark={isDark} icon={<Archive size={10}/>}>Corbeille</CtxItem>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Ligne liste ───────────────────────────────────────────────────────────────
function DocRow({ doc, isDark, txt, txtMuted, isMenuOpen, onOpen, onToggleFav, onMenu, onArchive, onDelete, inTrash }: {
  doc: Doc; isDark: boolean; txt: string; txtMuted: string;
  isMenuOpen: boolean;
  onOpen:()=>void; onToggleFav:()=>void; onMenu:()=>void;
  onArchive:()=>void; onDelete:()=>void; inTrash:boolean;
}) {
  const accent = TYPE_COLOR[doc.doc_type??"document"] ?? GOLD;
  return (
    <motion.div layout initial={{opacity:0}} animate={{opacity:1}}
      className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 cursor-pointer transition ${isDark?"hover:bg-white/4":"hover:bg-white hover:shadow-sm"}`}
      onClick={onOpen}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{background:`${accent}12`}}>
        <FileText size={14} style={{color:accent}}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-medium ${txt}`}>{doc.title||"Sans titre"}</p>
        <p className={`truncate text-[10px] ${txtMuted}`}>{(doc.thumbnail_text||doc.content||"Aucun contenu").slice(0,70)}</p>
      </div>
      <div className={`hidden shrink-0 items-center gap-3 text-[10px] sm:flex ${txtMuted}`}>
        {doc.word_count?<span>{doc.word_count} mots</span>:null}
        <span>{formatDate(doc.updated_at)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button onClick={e=>{e.stopPropagation();onToggleFav();}}
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${doc.is_favorite?"text-amber-400":isDark?"text-white/25 hover:text-amber-400":"text-gray-300 hover:text-amber-400"}`}>
          <Star size={11} fill={doc.is_favorite?"currentColor":"none"}/>
        </button>
        <div className="relative">
          <button onClick={e=>{e.stopPropagation();onMenu();}}
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${isDark?"text-white/25 hover:bg-white/8 hover:text-white":"text-gray-300 hover:bg-gray-100"}`}>
            <MoreHorizontal size={11}/>
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                className={`absolute right-0 top-8 z-50 w-44 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}
                onClick={e=>e.stopPropagation()}>
                <CtxItem onClick={onToggleFav} isDark={isDark} icon={<Star size={10}/>}>{doc.is_favorite?"Retirer des favoris":"Ajouter aux favoris"}</CtxItem>
                {inTrash
                  ? <><CtxItem onClick={onArchive} isDark={isDark} icon={<RefreshCw size={10}/>}>Restaurer</CtxItem>
                      <CtxItem onClick={onDelete} isDark={isDark} icon={<Trash2 size={10}/>} danger>Supprimer définitivement</CtxItem></>
                  : <CtxItem onClick={onArchive} isDark={isDark} icon={<Archive size={10}/>}>Corbeille</CtxItem>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function CtxItem({ onClick, isDark, icon, children, danger=false }: {
  onClick:()=>void; isDark:boolean; icon:React.ReactNode; children:React.ReactNode; danger?:boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition ${danger?"text-red-400 hover:bg-red-500/10":isDark?"text-white/60 hover:bg-white/6 hover:text-white":"text-gray-700 hover:bg-gray-50"}`}>
      {icon}{children}
    </button>
  );
}
