"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Check, AlertCircle, Sparkles, Clock,
  Star, Trash2, Download, Share2, Link2, RefreshCw, Plus,
  Search, X, FileText, FolderOpen, Copy, Printer,
  ZoomIn, ZoomOut, ChevronDown, Save,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import Toast, { type ToastData, type ToastType } from "@/components/ui/Toast";
import { TiptapEditor, type TiptapEditorRef, type Editor } from "@/components/notes/TiptapEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NoteDoc {
  id: string; user_id: string; title: string;
  content: string; content_json: string | null;
  note_type: string | null; doc_type: string;
  folder_id: string | null; is_archived: boolean | null;
  is_favorite: boolean | null; word_count: number | null;
  page_format: string; page_orientation: string;
  page_margin_top: number; page_margin_bottom: number;
  page_margin_left: number; page_margin_right: number;
  created_at: string; updated_at: string;
}
interface Version { id: string; title: string; saved_at: string; }

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [794, 1123], A3: [1123, 1587], Letter: [816, 1056],
};
const GOLD = "#c9a55a";
const MM   = 3.7795275591;

// Modèles de contenu prédéfinis
const TEMPLATES: Record<string, object> = {
  blank: { type: "doc", content: [{ type: "paragraph" }] },
  rapport: {
    type: "doc", content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Rapport" }] },
      { type: "paragraph", content: [{ type: "text", text: "Auteur : " }] },
      { type: "paragraph", content: [{ type: "text", text: "Date : " + new Date().toLocaleDateString("fr-FR") }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "1. Introduction" }] },
      { type: "paragraph", content: [{ type: "text", text: "Rédigez votre introduction ici." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. Corps du rapport" }] },
      { type: "paragraph", content: [{ type: "text", text: "Développez votre contenu ici." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "3. Conclusion" }] },
      { type: "paragraph", content: [{ type: "text", text: "Résumez vos conclusions ici." }] },
    ],
  },
};

const AI_ACTIONS = [
  { id: "correct",   label: "Corriger",        icon: "✓"  },
  { id: "rephrase",  label: "Reformuler",       icon: "↺"  },
  { id: "improve",   label: "Améliorer",        icon: "✨" },
  { id: "summarize", label: "Résumer",          icon: "∑"  },
  { id: "expand",    label: "Développer",       icon: "↔" },
  { id: "translate", label: "Traduire",         icon: "🌐" },
  { id: "simplify",  label: "Simplifier",       icon: "✂️" },
  { id: "chat",      label: "Instruction libre",icon: "💬" },
];

// ── Composant principal ───────────────────────────────────────────────────────
export default function DocumentEditor() {
  const router   = useRouter();
  const params   = useParams();
  const docId    = params?.id as string;
  const { isDark } = useTheme();

  // État principal
  const [doc,        setDoc]        = useState<NoteDoc | null>(null);
  const [versions,   setVersions]   = useState<Version[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState<string | null>(null);
  const [title,      setTitle]      = useState("Document sans titre");
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [toast,      setToast]      = useState<ToastData | null>(null);
  const [editorContent, setEditorContent] = useState<object | null>(null);

  // Refs
  const editorRef       = useRef<TiptapEditorRef | null>(null);
  const tiptapRef       = useRef<Editor | null>(null);
  const dirtyRef        = useRef(false);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionCntRef   = useRef(0);
  const titleRef        = useRef(title);
  titleRef.current      = title;

  // UI state
  const [zoom,           setZoom]          = useState(100);
  const [pageFormat,     setPageFormat]    = useState("A4");
  const [pageOrient,     setPageOrient]    = useState("portrait");
  const [marginTop,      setMarginTop]     = useState(25);
  const [marginBottom,   setMarginBottom]  = useState(25);
  const [marginLeft,     setMarginLeft]    = useState(25);
  const [marginRight,    setMarginRight]   = useState(25);
  const [wordCount,      setWordCount]     = useState(0);
  const [charCount,      setCharCount]     = useState(0);

  // Panels
  const [activePanel, setActivePanel] = useState<null|"ai"|"versions"|"layout"|"share"|"find">(null);
  const togglePanel = (p: typeof activePanel) => setActivePanel(a => a===p ? null : p);

  // Find/replace
  const [findText,   setFindText]   = useState("");
  const [replaceText,setReplaceText]= useState("");

  // AI
  const [aiAction,  setAiAction]  = useState("improve");
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string|null>(null);

  // Menu bar
  const [openMenu, setOpenMenu] = useState<string|null>(null);

  function showToast(type: ToastType, msg: string) { setToast({ type, msg }); }

  // ── Chargement ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    void (async () => {
      const res = await fetch(`/api/notes/document/${docId}`).catch(() => null);
      if (!res?.ok) {
        const { error: e } = await res?.json().catch(() => ({})) ?? {};
        setPageError(e ?? "Erreur chargement"); setLoading(false); return;
      }
      const { document: d, versions: v } = await res.json();
      setDoc(d); setVersions(v ?? []);
      setTitle(d.title ?? "Document sans titre");
      setPageFormat(d.page_format ?? "A4");
      setPageOrient(d.page_orientation ?? "portrait");
      setMarginTop(d.page_margin_top ?? 25);
      setMarginBottom(d.page_margin_bottom ?? 25);
      setMarginLeft(d.page_margin_left ?? 25);
      setMarginRight(d.page_margin_right ?? 25);
      if (d.content_json) {
        try { setEditorContent(JSON.parse(d.content_json)); } catch { /**/ }
      } else if (d.content) {
        setEditorContent({ type: "doc", content: d.content.split("\n").filter(Boolean).map((l: string) => ({ type: "paragraph", content: [{ type: "text", text: l }] })) });
      }
      setLoading(false);
    })();
  }, [docId]);

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const save = useCallback(async (opts: { version?: boolean; layout?: boolean } = {}) => {
    if (!docId || !editorRef.current) return;
    setSaveStatus("saving");
    try {
      const json = editorRef.current.getJSON();
      const text = editorRef.current.getText();
      const body: Record<string, unknown> = {
        title:          titleRef.current,
        content:        text.slice(0, 50000),
        content_json:   JSON.stringify(json),
        thumbnail_text: text.slice(0, 300),
        save_version:   opts.version ?? false,
      };
      if (opts.layout) {
        body.page_format      = pageFormat;
        body.page_orientation = pageOrient;
        body.page_margin_top    = marginTop;
        body.page_margin_bottom = marginBottom;
        body.page_margin_left   = marginLeft;
        body.page_margin_right  = marginRight;
      }
      const res = await fetch(`/api/notes/document/${docId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      setSaveStatus("saved");
      dirtyRef.current = false;
      versionCntRef.current += 1;
      if (opts.version) {
        const { versions: v } = await res.json().catch(() => ({}));
        if (v) setVersions(v);
        // reload versions
        const r2 = await fetch(`/api/notes/document/${docId}`).catch(()=>null);
        if (r2?.ok) { const { versions: v2 } = await r2.json(); if(v2) setVersions(v2); }
      }
      setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 2500);
    } catch (e) {
      setSaveStatus("error");
      showToast("error", (e as Error).message);
    }
  }, [docId, pageFormat, pageOrient, marginTop, marginBottom, marginLeft, marginRight]);

  function scheduleSave(version = false) {
    dirtyRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void save({ version }), version ? 0 : 2000);
  }

  function handleEditorChange(json: object) {
    setEditorContent(json);
    const wc = editorRef.current?.getWordCount() ?? 0;
    const cc = editorRef.current?.getCharacterCount() ?? 0;
    setWordCount(wc); setCharCount(cc);
    scheduleSave();
  }

  // Sauvegarde mise en page
  useEffect(() => {
    if (!doc) return;
    void save({ layout: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFormat, pageOrient, marginTop, marginBottom, marginLeft, marginRight]);

  // Ctrl+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); void save({ version: true }); }
      if ((e.ctrlKey||e.metaKey) && e.key==="f") { e.preventDefault(); togglePanel("find"); }
      if (e.key==="Escape") { setOpenMenu(null); setActivePanel(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  // Dimensions page
  const [pgW, pgH] = PAGE_SIZES[pageFormat] ?? PAGE_SIZES.A4;
  const [pageW, pageH] = pageOrient === "landscape" ? [pgH, pgW] : [pgW, pgH];
  function pt(mm: number) { return Math.round(mm * MM * zoom / 100); }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function duplicateDoc() {
    if (!editorRef.current || !doc) return;
    const res = await fetch("/api/notes/document", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title + " (copie)", content_json: JSON.stringify(editorRef.current.getJSON()), doc_type: doc.doc_type }),
    }).catch(()=>null);
    if (!res?.ok) { showToast("error", "Erreur"); return; }
    const { document: d } = await res.json();
    router.push(`/client/bloc-notes/${d.id}`);
  }

  async function moveToTrash() {
    if (!confirm("Déplacer vers la corbeille ?")) return;
    await fetch(`/api/notes/document/${docId}`, { method: "DELETE" });
    router.push("/client/bloc-notes");
  }

  async function toggleFavorite() {
    if (!doc) return;
    const next = !doc.is_favorite;
    setDoc(d => d ? { ...d, is_favorite: next } : d);
    await fetch(`/api/notes/document/${docId}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ is_favorite: next }) });
  }

  async function runAI() {
    setAiLoading(true); setAiPreview(null);
    const text = editorRef.current?.getText() ?? "";
    const res = await fetch("/api/notes/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: aiAction, content: text.slice(0,6000), instruction: aiInput||undefined }),
    }).catch(()=>null);
    setAiLoading(false);
    if (!res?.ok) { const {error: e}=await res?.json().catch(()=>({}))??{}; showToast("error",e??"Erreur IA"); return; }
    const { result } = await res.json();
    if (result) setAiPreview(result);
  }

  function insertAIResult() {
    if (!aiPreview) return;
    tiptapRef.current?.commands.focus("end");
    tiptapRef.current?.commands.setHorizontalRule();
    tiptapRef.current?.commands.insertContent(
      `<p><em style="color:#9ca3af">[IA — ${AI_ACTIONS.find(a=>a.id===aiAction)?.label}]</em></p>${aiPreview.split("\n").map(l=>`<p>${l}</p>`).join("")}`
    );
    setAiPreview(null); setActivePanel(null);
    showToast("success", "Résultat inséré");
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function exportDoc(format: "pdf"|"txt"|"md"|"docx") {
    setOpenMenu(null);
    if (format==="pdf") { window.print(); return; }
    const text = editorRef.current?.getText() ?? "";
    const html  = editorRef.current?.getHTML() ?? "";
    if (format==="txt") {
      const blob = new Blob([text],{type:"text/plain"});
      const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${title}.txt`; a.click(); return;
    }
    if (format==="md") {
      const md = html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi,"# $1\n\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi,"## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi,"### $1\n\n").replace(/<h4[^>]*>(.*?)<\/h4>/gi,"#### $1\n\n")
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi,"**$1**").replace(/<em[^>]*>(.*?)<\/em>/gi,"_$1_")
        .replace(/<s[^>]*>(.*?)<\/s>/gi,"~~$1~~").replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,"[$2]($1)")
        .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,"> $1\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi,"- $1\n").replace(/<hr[^>]*>/gi,"---\n")
        .replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"")
        .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
      const blob = new Blob([md],{type:"text/markdown"});
      const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${title}.md`; a.click();
    }
    if (format==="docx") {
      showToast("info", "Export DOCX — fonctionnalité disponible prochainement");
    }
  }

  async function importFile() {
    setOpenMenu(null);
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".txt,.md,.docx";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "txt" || ext === "md") {
        const text = await file.text();
        tiptapRef.current?.commands.setContent({ type: "doc", content: text.split("\n").filter(Boolean).map(l=>({ type:"paragraph", content:[{type:"text",text:l}] })) });
        showToast("success", "Fichier importé");
      } else if (ext === "docx") {
        const formData = new FormData(); formData.append("file", file);
        const res = await fetch("/api/notes/import", { method: "POST", body: formData }).catch(()=>null);
        if (!res?.ok) { showToast("error", "Erreur import DOCX"); return; }
        const { html } = await res.json();
        tiptapRef.current?.commands.setContent(html);
        showToast("success", "Document DOCX importé");
      }
    };
    input.click();
  }

  // ── Restaurer version ──────────────────────────────────────────────────────
  async function restoreVersion(vId: string) {
    const res = await fetch(`/api/notes/document/${docId}?version_id=${vId}`).catch(()=>null);
    if (!res?.ok) { showToast("error", "Erreur restauration"); return; }
    showToast("info", "Restauration en cours…");
    setActivePanel(null);
    window.location.reload();
  }

  // ── Erreur / Chargement ────────────────────────────────────────────────────
  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${isDark?"bg-[#080f1e]":"bg-gray-100"}`}>
      <Loader2 className="animate-spin" size={28} style={{color:GOLD}}/>
    </div>
  );
  if (pageError) return (
    <div className={`flex h-screen flex-col items-center justify-center gap-3 ${isDark?"bg-[#080f1e] text-white":"bg-gray-100 text-gray-900"}`}>
      <AlertCircle size={36} className="text-red-400"/>
      <p className="text-sm">{pageError}</p>
      <button onClick={()=>router.push("/client/bloc-notes")} className="rounded-lg px-4 py-2 text-sm" style={{background:GOLD,color:"white"}}>Retour</button>
    </div>
  );

  // ── Classes ────────────────────────────────────────────────────────────────
  const shell    = isDark ? "bg-[#080f1e]"  : "bg-white";
  const titleBar = isDark ? "bg-[#080f1e] border-white/8"  : "bg-white border-gray-200";
  const menuBar  = isDark ? "bg-[#0c1525] border-white/8"  : "bg-[#f8f8f8] border-gray-200";
  const canvas   = isDark ? "bg-[#1a1f35]"  : "bg-[#e8eaed]";
  const statusBar= isDark ? "bg-[#0c1525] border-white/8 text-white/40" : "bg-[#f8f8f8] border-gray-200 text-gray-400";
  const panelCls = isDark ? "bg-[#0c1525] border-white/8" : "bg-white border-gray-200";

  // ── Menu bar items ─────────────────────────────────────────────────────────
  type MenuItem = { label: string; action?: () => void; shortcut?: string; sep?: boolean; disabled?: boolean };
  const MENUS: Record<string, MenuItem[]> = {
    Fichier: [
      { label: "Nouveau document", action: ()=>{ setOpenMenu(null); router.push("/client/bloc-notes?new=1"); } },
      { label: "Dupliquer", action: ()=>{ setOpenMenu(null); void duplicateDoc(); } },
      { sep: true, label: "" },
      { label: "Enregistrer", action: ()=>{ setOpenMenu(null); void save({version:true}); }, shortcut: "Ctrl+S" },
      { label: "Importer…", action: ()=>void importFile() },
      { sep: true, label: "" },
      { label: "Exporter PDF", action: ()=>exportDoc("pdf"), shortcut: "Ctrl+P" },
      { label: "Exporter DOCX", action: ()=>exportDoc("docx") },
      { label: "Exporter Markdown", action: ()=>exportDoc("md") },
      { label: "Exporter TXT", action: ()=>exportDoc("txt") },
      { sep: true, label: "" },
      { label: "Imprimer…", action: ()=>{ setOpenMenu(null); window.print(); }, shortcut: "Ctrl+P" },
      { sep: true, label: "" },
      { label: "Déplacer vers la corbeille", action: ()=>{ setOpenMenu(null); void moveToTrash(); } },
    ],
    Édition: [
      { label: "Annuler",      action: ()=>{ tiptapRef.current?.commands.undo();                  setOpenMenu(null); }, shortcut: "Ctrl+Z" },
      { label: "Rétablir",     action: ()=>{ tiptapRef.current?.commands.redo();                  setOpenMenu(null); }, shortcut: "Ctrl+Y" },
      { sep: true, label: "" },
      { label: "Couper",       action: ()=>{ document.execCommand("cut");                         setOpenMenu(null); }, shortcut: "Ctrl+X" },
      { label: "Copier",       action: ()=>{ document.execCommand("copy");                        setOpenMenu(null); }, shortcut: "Ctrl+C" },
      { label: "Coller",       action: ()=>{ document.execCommand("paste");                       setOpenMenu(null); }, shortcut: "Ctrl+V" },
      { label: "Tout sélectionner", action: ()=>{ tiptapRef.current?.commands.selectAll();        setOpenMenu(null); }, shortcut: "Ctrl+A" },
      { sep: true, label: "" },
      { label: "Rechercher…",  action: ()=>{ setOpenMenu(null); togglePanel("find"); },           shortcut: "Ctrl+F" },
    ],
    Affichage: [
      { label: "Zoom 75%",  action: ()=>{ setZoom(75);  setOpenMenu(null); } },
      { label: "Zoom 100%", action: ()=>{ setZoom(100); setOpenMenu(null); } },
      { label: "Zoom 125%", action: ()=>{ setZoom(125); setOpenMenu(null); } },
      { label: "Zoom 150%", action: ()=>{ setZoom(150); setOpenMenu(null); } },
      { label: "Zoom 200%", action: ()=>{ setZoom(200); setOpenMenu(null); } },
      { sep: true, label: "" },
      { label: "Mise en page", action: ()=>{ setOpenMenu(null); togglePanel("layout"); } },
    ],
    Insertion: [
      { label: "Image",            action: ()=>{ setOpenMenu(null); const u=window.prompt("URL image :","https://"); if(u)tiptapRef.current?.commands.setImage({src:u}); } },
      { label: "Tableau (3×3)",    action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.insertTable({rows:3,cols:3,withHeaderRow:true}); } },
      { label: "Lien",             action: ()=>{ setOpenMenu(null); const u=window.prompt("URL :","https://"); if(u)tiptapRef.current?.commands.setLink({href:u}); } },
      { label: "Séparateur",       action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setHorizontalRule(); } },
      { label: "Liste à puces",    action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleBulletList(); } },
      { label: "Liste numérotée",  action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleOrderedList(); } },
      { label: "Cases à cocher",   action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleTaskList(); } },
    ],
    Format: [
      { label: "Gras",       action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleBold(); },      shortcut: "Ctrl+B" },
      { label: "Italique",   action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleItalic(); },    shortcut: "Ctrl+I" },
      { label: "Souligné",   action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleUnderline(); }, shortcut: "Ctrl+U" },
      { label: "Barré",      action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleStrike(); } },
      { sep: true, label: "" },
      { label: "Effacer le formatage", action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.unsetAllMarks(); tiptapRef.current?.commands.clearNodes(); } },
    ],
    Outils: [
      { label: "Assistant IA…", action: ()=>{ setOpenMenu(null); togglePanel("ai"); } },
      { label: "Historique des versions…", action: ()=>{ setOpenMenu(null); togglePanel("versions"); } },
      { label: "Partager…",    action: ()=>{ setOpenMenu(null); togglePanel("share"); } },
    ],
  };

  return (
    <>
      {/* CSS impression */}
      <style>{`
        @media print {
          body > *:not(.doc-print-root) { display: none !important; }
          .doc-print-root { display: block !important; }
          .doc-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className={`doc-print-root flex flex-col h-screen overflow-hidden ${shell}`}>

        {/* ── Barre de titre ──────────────────────────────────────────────── */}
        <div className={`no-print flex shrink-0 items-center gap-2 border-b px-3 py-1.5 ${titleBar}`}>
          <button onClick={()=>router.push("/client/bloc-notes")}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded transition ${isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100"}`}>
            <ArrowLeft size={14}/>
          </button>

          <input value={title} onChange={e=>{ setTitle(e.target.value); scheduleSave(); }}
            className={`flex-1 rounded px-2 py-0.5 text-sm font-semibold outline-none transition ${isDark?"bg-transparent text-white placeholder:text-white/25 focus:bg-white/4":"bg-transparent text-gray-900 placeholder:text-gray-400 focus:bg-gray-50"}`}
            placeholder="Sans titre"/>

          {/* Statut sauvegarde */}
          <div className={`flex shrink-0 items-center gap-1 text-[10px] ${isDark?"text-white/30":"text-gray-400"}`}>
            {saveStatus==="saving" && <><Loader2 size={10} className="animate-spin"/><span>Enregistrement…</span></>}
            {saveStatus==="saved"  && <><Check   size={10} className="text-emerald-400"/><span className="text-emerald-400">Enregistré</span></>}
            {saveStatus==="error"  && <><AlertCircle size={10} className="text-red-400"/><span className="text-red-400">Erreur</span></>}
          </div>

          {/* Actions rapides */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button onClick={()=>void save({version:true})} title="Enregistrer Ctrl+S"
              className={`flex h-7 w-7 items-center justify-center rounded transition ${isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100"}`}>
              <Save size={13}/>
            </button>
            <button onClick={toggleFavorite} title="Favori"
              className={`flex h-7 w-7 items-center justify-center rounded transition ${doc?.is_favorite?"text-amber-400":isDark?"text-white/25 hover:text-white":"text-gray-300 hover:text-gray-700"}`}>
              <Star size={13} fill={doc?.is_favorite?"currentColor":"none"}/>
            </button>
            {[
              ["ai","✨","Assistant IA"],["versions","🕐","Historique"],["share","🔗","Partager"],
            ].map(([p,icon,lbl])=>(
              <button key={p} onClick={()=>togglePanel(p as typeof activePanel)} title={lbl}
                className={`flex h-7 items-center gap-1 rounded px-1.5 text-[11px] transition ${activePanel===p?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a]":isDark?"text-white/30 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100"}`}>
                <span>{icon}</span>
              </button>
            ))}
            {/* Zoom */}
            <div className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${isDark?"border-white/8":"border-gray-200"}`}>
              <button onClick={()=>setZoom(z=>Math.max(50,z-25))} className={isDark?"text-white/30 hover:text-white":"text-gray-400"}><ZoomOut size={10}/></button>
              <span className={`w-8 text-center text-[10px] ${isDark?"text-white/40":"text-gray-500"}`}>{zoom}%</span>
              <button onClick={()=>setZoom(z=>Math.min(200,z+25))} className={isDark?"text-white/30 hover:text-white":"text-gray-400"}><ZoomIn size={10}/></button>
            </div>
          </div>
        </div>

        {/* ── Menu bar ────────────────────────────────────────────────────── */}
        <div className={`no-print flex shrink-0 items-center gap-0 border-b px-2 ${menuBar}`} style={{height:28}}>
          {Object.entries(MENUS).map(([name, items]) => (
            <div key={name} className="relative">
              <button onClick={()=>setOpenMenu(o=>o===name?null:name)}
                className={`flex h-full items-center px-2.5 text-[11px] transition ${openMenu===name?(isDark?"bg-white/10 text-white":"bg-gray-200 text-gray-900"):isDark?"text-white/60 hover:bg-white/6 hover:text-white":"text-gray-600 hover:bg-gray-100"}`}>
                {name}
              </button>
              {openMenu===name && (
                <>
                  <div className="fixed inset-0 z-40" onClick={()=>setOpenMenu(null)}/>
                  <div className={`absolute left-0 top-full z-50 w-52 rounded-b-xl border-x border-b py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
                    {items.map((item,i)=>
                      item.sep ? <div key={i} className={`my-1 border-t ${isDark?"border-white/8":"border-gray-100"}`}/>
                      : <button key={i} onClick={item.action} disabled={item.disabled}
                          className={`flex w-full items-center justify-between px-3 py-1.5 text-[11px] transition disabled:opacity-40 ${isDark?"text-white/70 hover:bg-white/6 hover:text-white":"text-gray-700 hover:bg-gray-50"}`}>
                          <span>{item.label}</span>
                          {item.shortcut && <span className={`text-[10px] ${isDark?"text-white/25":"text-gray-400"}`}>{item.shortcut}</span>}
                        </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Barre d'outils ──────────────────────────────────────────────── */}
        <EditorToolbar editor={tiptapRef.current} isDark={isDark}/>

        {/* ── Zone de travail + panels ────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Canvas */}
          <div className={`flex-1 overflow-auto ${canvas}`} style={{paddingTop:32,paddingBottom:64}}>
            <div className="mx-auto" style={{width:Math.round(pageW*zoom/100)}}>
              {/* Page A4 */}
              <div className="doc-page mx-auto"
                style={{
                  width:      Math.round(pageW*zoom/100),
                  minHeight:  Math.round(pageH*zoom/100),
                  padding:    `${pt(marginTop)}px ${pt(marginRight)}px ${pt(marginBottom)}px ${pt(marginLeft)}px`,
                  background: "white",
                  color:      "#111827",
                  fontSize:   `${Math.round(12*zoom/100)}px`,
                  lineHeight: 1.6,
                  fontFamily: "'Times New Roman',Georgia,serif",
                  boxShadow:  "0 2px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
                }}>
                <TiptapEditor
                  content={editorContent}
                  editorRef={editorRef}
                  onChange={handleEditorChange}
                  onEditorReady={ed => { tiptapRef.current = ed; }}
                  isDark={false}
                  placeholder="Commencez à rédiger votre document…"
                />
              </div>
              {/* Indicateur bas de page */}
              <p className={`mt-3 text-center text-[10px] ${isDark?"text-white/15":"text-gray-400"}`}>
                {pageFormat} {pageOrient==="landscape"?"Paysage":"Portrait"} — {Math.round(pageW*zoom/100)}×{Math.round(pageH*zoom/100)} px
              </p>
            </div>
          </div>

          {/* ── Panel IA ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {activePanel==="ai" && (
              <motion.aside key="ai" initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
                transition={{type:"spring",damping:28,stiffness:280}}
                className={`no-print w-72 shrink-0 overflow-y-auto border-l ${panelCls}`}>
                <PanelHeader title="Assistant IA" icon="✨" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="space-y-2 p-3">
                  <div className="space-y-0.5">
                    {AI_ACTIONS.map(a=>(
                      <button key={a.id} onClick={()=>setAiAction(a.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition ${aiAction===a.id?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a] font-medium":isDark?"text-white/60 hover:bg-white/6":"text-gray-600 hover:bg-gray-50"}`}>
                        <span>{a.icon}</span>{a.label}
                      </button>
                    ))}
                  </div>
                  {aiAction==="chat" && (
                    <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} rows={3}
                      placeholder="Votre instruction…"
                      className={`w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none ${isDark?"border-white/8 bg-white/4 text-white":"border-gray-200 text-gray-900"}`}/>
                  )}
                  <button onClick={runAI} disabled={aiLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-white disabled:opacity-50"
                    style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`}}>
                    {aiLoading?<Loader2 size={12} className="animate-spin"/>:<Sparkles size={12}/>}
                    {aiLoading?"Génération…":"Appliquer"}
                  </button>
                  {aiPreview && (
                    <div className={`rounded-lg border p-3 ${isDark?"border-white/8 bg-white/3":"border-gray-200 bg-gray-50"}`}>
                      <p className={`mb-2 text-[10px] font-bold ${isDark?"text-white/40":"text-gray-400"}`}>Aperçu du résultat</p>
                      <p className={`text-xs whitespace-pre-wrap ${isDark?"text-white/70":"text-gray-700"}`}>{aiPreview.slice(0,500)}{aiPreview.length>500?"…":""}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={insertAIResult} className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white" style={{background:GOLD}}>Insérer</button>
                        <button onClick={()=>setAiPreview(null)} className={`flex-1 rounded-lg border py-1.5 text-xs ${isDark?"border-white/10 text-white/50":"border-gray-200 text-gray-500"}`}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}

            {/* ── Panel historique ──────────────────────────────────────── */}
            {activePanel==="versions" && (
              <motion.aside key="versions" initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
                transition={{type:"spring",damping:28,stiffness:280}}
                className={`no-print w-64 shrink-0 overflow-y-auto border-l ${panelCls}`}>
                <PanelHeader title="Historique" icon="🕐" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-2">
                  <button onClick={()=>void save({version:true})}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition ${isDark?"border-white/10 text-white/50 hover:text-white":"border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                    <RefreshCw size={10}/> Créer un snapshot
                  </button>
                  {versions.length===0 && <p className={`py-6 text-center text-xs ${isDark?"text-white/20":"text-gray-400"}`}>Aucune version sauvegardée.</p>}
                  {versions.map(v=>(
                    <div key={v.id} className={`flex items-center gap-2 rounded-lg p-2.5 ${isDark?"border border-white/6 bg-white/3":"border border-gray-100 bg-gray-50"}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-xs font-medium ${isDark?"text-white/70":"text-gray-700"}`}>{v.title||"Sans titre"}</p>
                        <p className={`text-[10px] ${isDark?"text-white/25":"text-gray-400"}`}>{new Date(v.saved_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                      </div>
                      <button onClick={()=>void restoreVersion(v.id)} title="Restaurer"
                        className={`shrink-0 rounded p-1 ${isDark?"text-white/25 hover:text-white":"text-gray-400 hover:text-gray-700"}`}>
                        <RefreshCw size={10}/>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}

            {/* ── Panel mise en page ───────────────────────────────────── */}
            {activePanel==="layout" && (
              <motion.aside key="layout" initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
                transition={{type:"spring",damping:28,stiffness:280}}
                className={`no-print w-60 shrink-0 overflow-y-auto border-l ${panelCls}`}>
                <PanelHeader title="Mise en page" icon="📄" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="space-y-4 p-3">
                  <LayoutGroup label="Format" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-1">
                      {["A4","A3","Letter"].map(f=>(
                        <PillBtn key={f} active={pageFormat===f} onClick={()=>setPageFormat(f)} isDark={isDark}>{f}</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                  <LayoutGroup label="Orientation" isDark={isDark}>
                    <div className="grid grid-cols-2 gap-1">
                      {[["portrait","Portrait"],["landscape","Paysage"]].map(([v,l])=>(
                        <PillBtn key={v} active={pageOrient===v} onClick={()=>setPageOrient(v)} isDark={isDark}>{l}</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                  <LayoutGroup label="Marges (mm)" isDark={isDark}>
                    {([["Haut",marginTop,setMarginTop],["Bas",marginBottom,setMarginBottom],["Gauche",marginLeft,setMarginLeft],["Droite",marginRight,setMarginRight]] as [string,number,(v:number)=>void][]).map(([lbl,val,set])=>(
                      <div key={lbl} className="flex items-center gap-2">
                        <span className={`w-12 text-xs ${isDark?"text-white/40":"text-gray-500"}`}>{lbl}</span>
                        <input type="number" min="5" max="60" value={val} onChange={e=>set(parseInt(e.target.value)||25)}
                          className={`w-14 rounded border px-2 py-0.5 text-center text-xs outline-none ${isDark?"border-white/10 bg-white/4 text-white":"border-gray-200 bg-gray-50"}`}/>
                        <span className={`text-[10px] ${isDark?"text-white/20":"text-gray-400"}`}>mm</span>
                      </div>
                    ))}
                  </LayoutGroup>
                  <LayoutGroup label="Zoom" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-1">
                      {[50,75,100,125,150,200].map(z=>(
                        <PillBtn key={z} active={zoom===z} onClick={()=>setZoom(z)} isDark={isDark}>{z}%</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                </div>
              </motion.aside>
            )}

            {/* ── Panel partage ────────────────────────────────────────── */}
            {activePanel==="share" && (
              <motion.aside key="share" initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
                transition={{type:"spring",damping:28,stiffness:280}}
                className={`no-print w-64 shrink-0 overflow-y-auto border-l ${panelCls}`}>
                <PanelHeader title="Partager" icon="🔗" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-3">
                  <p className={`text-xs ${isDark?"text-white/50":"text-gray-500"}`}>
                    Le partage avec l&apos;équipe sera disponible dans la prochaine mise à jour (Phase 7).
                  </p>
                  <div className={`rounded-lg border p-3 text-xs ${isDark?"border-white/8 bg-white/3":"border-gray-200 bg-gray-50"}`}>
                    <p className={`mb-1 font-semibold ${isDark?"text-white/60":"text-gray-700"}`}>Lien de partage</p>
                    <p className={`truncate font-mono text-[10px] ${isDark?"text-white/30":"text-gray-400"}`}>{typeof window!=="undefined"?window.location.href:""}</p>
                    <button onClick={()=>{ navigator.clipboard.writeText(window.location.href).catch(()=>{}); showToast("success","Lien copié"); }}
                      className="mt-2 flex items-center gap-1 text-[10px]" style={{color:GOLD}}>
                      <Link2 size={10}/> Copier le lien
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}

            {/* ── Panel recherche ──────────────────────────────────────── */}
            {activePanel==="find" && (
              <motion.aside key="find" initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
                transition={{type:"spring",damping:28,stiffness:280}}
                className={`no-print w-64 shrink-0 overflow-y-auto border-l ${panelCls}`}>
                <PanelHeader title="Rechercher" icon="🔍" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-2">
                  <input value={findText} onChange={e=>setFindText(e.target.value)}
                    placeholder="Rechercher…"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${isDark?"border-white/8 bg-white/4 text-white":"border-gray-200 text-gray-900"}`}/>
                  <input value={replaceText} onChange={e=>setReplaceText(e.target.value)}
                    placeholder="Remplacer par…"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${isDark?"border-white/8 bg-white/4 text-white":"border-gray-200 text-gray-900"}`}/>
                  <div className="flex gap-2">
                    <button onClick={()=>{
                      if (!findText || !tiptapRef.current) return;
                      const html = tiptapRef.current.getHTML();
                      if (replaceText!==undefined) {
                        const updated = html.replaceAll(findText, replaceText);
                        tiptapRef.current.setContent({ type:"doc", content: [] });
                        setTimeout(()=>{ tiptapRef.current?.setContent(updated as unknown as object); }, 0);
                        showToast("success","Remplacement effectué");
                      }
                    }}
                      className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white" style={{background:GOLD}}>
                      Remplacer tout
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* ── Barre de statut ─────────────────────────────────────────────── */}
        <div className={`no-print flex shrink-0 items-center justify-between border-t px-4 py-1 text-[10px] ${statusBar}`}>
          <div className="flex items-center gap-4">
            <span>Page 1</span>
            <span>{wordCount} mot{wordCount!==1?"s":""}</span>
            <span>{charCount} caractère{charCount!==1?"s":""}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{pageFormat} {pageOrient==="landscape"?"Paysage":"Portrait"}</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>setZoom(z=>Math.max(50,z-25))}><ZoomOut size={10}/></button>
              <span>{zoom}%</span>
              <button onClick={()=>setZoom(z=>Math.min(200,z+25))}><ZoomIn size={10}/></button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </>
  );
}

// ── Helpers UI ────────────────────────────────────────────────────────────────
function PanelHeader({ title, icon, onClose, isDark }: { title: string; icon: string; onClose: ()=>void; isDark: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b px-3 py-2.5 ${isDark?"border-white/8":"border-gray-100"}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className={`text-xs font-bold ${isDark?"text-white/70":"text-gray-700"}`}>{title}</span>
      </div>
      <button onClick={onClose} className={isDark?"text-white/25 hover:text-white":"text-gray-300 hover:text-gray-700"}><X size={13}/></button>
    </div>
  );
}
function LayoutGroup({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className={`block text-[0.6rem] font-bold uppercase tracking-widest ${isDark?"text-white/30":"text-gray-400"}`}>{label}</label>
      {children}
    </div>
  );
}
function PillBtn({ active, onClick, children, isDark }: { active: boolean; onClick: ()=>void; children: React.ReactNode; isDark: boolean }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border py-1 text-[10px] font-medium transition ${active?`border-[#c9a55a]/40 bg-[rgba(201,165,90,0.08)] text-[#c9a55a]`:isDark?"border-white/8 text-white/40 hover:text-white":"border-gray-200 text-gray-500 hover:text-gray-700"}`}>
      {children}
    </button>
  );
}
