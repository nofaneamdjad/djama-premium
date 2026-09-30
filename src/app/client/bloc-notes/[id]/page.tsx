"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Trash2, Star, Clock, Loader2, Check, X,
  Sparkles, FileText, ZoomIn, ZoomOut, Maximize2, Minimize2,
  AlignJustify, AlertCircle, RefreshCw,
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
const MM   = 3.7795275591; // 1mm en px à 96dpi

const AI_ACTIONS = [
  { id: "improve",   label: "Améliorer",        icon: "✨" },
  { id: "correct",   label: "Corriger",          icon: "✓"  },
  { id: "rephrase",  label: "Reformuler",        icon: "↺"  },
  { id: "summarize", label: "Résumer",           icon: "∑"  },
  { id: "translate", label: "Traduire",          icon: "🌐" },
  { id: "chat",      label: "Instruction libre", icon: "💬" },
];

export default function DocumentEditor() {
  const router    = useRouter();
  const params    = useParams();
  const docId     = params?.id as string;
  const { isDark }= useTheme();

  // ── État ─────────────────────────────────────────────────────────────────
  const [doc,       setDoc]       = useState<NoteDoc | null>(null);
  const [versions,  setVersions]  = useState<Version[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [title,     setTitle]     = useState("Document sans titre");
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [toast, setToast] = useState<ToastData | null>(null);

  // ── Éditeur ──────────────────────────────────────────────────────────────
  const editorRef      = useRef<TiptapEditorRef | null>(null);
  const tiptapEditorRef= useRef<Editor | null>(null);  // instance Tiptap brute
  const [editorContent, setEditorContent] = useState<object | null>(null);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const dirtyRef    = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionCnt  = useRef(0);

  // ── UI ───────────────────────────────────────────────────────────────────
  const [zoom,         setZoom]        = useState(100);
  const [fullscreen,   setFullscreen]  = useState(false);
  const [showVersions, setShowVersions]= useState(false);
  const [showLayout,   setShowLayout]  = useState(false);
  const [showAI,       setShowAI]      = useState(false);
  const [aiAction,     setAiAction]    = useState("improve");
  const [aiInput,      setAiInput]     = useState("");
  const [aiLoading,    setAiLoading]   = useState(false);
  const [showExport,   setShowExport]  = useState(false);

  // ── Mise en page ─────────────────────────────────────────────────────────
  const [pageFormat,       setPageFormat]       = useState("A4");
  const [pageOrientation,  setPageOrientation]  = useState("portrait");
  const [marginTop,    setMarginTop]    = useState(25);
  const [marginBottom, setMarginBottom] = useState(25);
  const [marginLeft,   setMarginLeft]   = useState(25);
  const [marginRight,  setMarginRight]  = useState(25);

  function showToast(type: ToastType, msg: string) {
    setToast({ type, msg });
  }

  // ── Chargement ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    void (async () => {
      const res = await fetch(`/api/notes/document/${docId}`);
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({}));
        setPageError(e ?? "Erreur chargement"); setLoading(false); return;
      }
      const { document: d, versions: v } = await res.json();
      setDoc(d); setVersions(v ?? []);
      setTitle(d.title ?? "Document sans titre");
      setPageFormat(d.page_format ?? "A4");
      setPageOrientation(d.page_orientation ?? "portrait");
      setMarginTop(d.page_margin_top ?? 25);
      setMarginBottom(d.page_margin_bottom ?? 25);
      setMarginLeft(d.page_margin_left ?? 25);
      setMarginRight(d.page_margin_right ?? 25);
      if (d.content_json) {
        try { setEditorContent(JSON.parse(d.content_json)); } catch {}
      } else if (d.content) {
        // Convertir texte brut en contenu Tiptap basique
        setEditorContent({
          type: "doc",
          content: d.content.split("\n").filter(Boolean).map((line: string) => ({
            type: "paragraph",
            content: [{ type: "text", text: line }],
          })),
        });
      }
      setLoading(false);
    })();
  }, [docId]);

  // ── Sauvegarde ───────────────────────────────────────────────────────────
  const save = useCallback(async (opts: { version?: boolean; layout?: boolean } = {}) => {
    if (!docId || !editorRef.current) return;
    setSaveStatus("saving");
    try {
      const json = editorRef.current.getJSON();
      const text = editorRef.current.getText();
      const body: Record<string, unknown> = {
        title,
        content:        text.slice(0, 50000),
        content_json:   JSON.stringify(json),
        thumbnail_text: text.slice(0, 300),
        save_version:   opts.version ?? false,
      };
      if (opts.layout) {
        body.page_format      = pageFormat;
        body.page_orientation = pageOrientation;
        body.page_margin_top    = marginTop;
        body.page_margin_bottom = marginBottom;
        body.page_margin_left   = marginLeft;
        body.page_margin_right  = marginRight;
      }
      const res = await fetch(`/api/notes/document/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur sauvegarde");
      setSaveStatus("saved");
      dirtyRef.current = false;
      versionCnt.current += 1;
      if (opts.version && versionCnt.current > 0) {
        const { document: updated, versions: v } = await res.json().catch(() => ({}));
        if (v) setVersions(v);
      }
      setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 2500);
    } catch (e) {
      setSaveStatus("error");
      showToast("error", (e as Error).message);
    }
  }, [docId, title, pageFormat, pageOrientation, marginTop, marginBottom, marginLeft, marginRight]);

  function triggerSave(version = false) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void save({ version }), version ? 0 : 2000);
  }

  function handleEditorChange(json: object) {
    setEditorContent(json);
    dirtyRef.current = true;
    triggerSave();
  }

  useEffect(() => {
    if (!doc) return;
    dirtyRef.current = true;
    triggerSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Ctrl+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); void save({ version: true }); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  // Sauvegarder mise en page
  useEffect(() => {
    if (!doc) return;
    void save({ layout: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFormat, pageOrientation, marginTop, marginBottom, marginLeft, marginRight]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function toggleFavorite() {
    if (!doc) return;
    const next = !doc.is_favorite;
    setDoc(d => d ? { ...d, is_favorite: next } : d);
    await fetch(`/api/notes/document/${docId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: next }),
    });
  }

  async function moveToTrash() {
    if (!confirm("Déplacer vers la corbeille ?")) return;
    const res = await fetch(`/api/notes/document/${docId}`, { method: "DELETE" });
    if (res.ok) router.push("/client/bloc-notes");
    else showToast("error", "Erreur");
  }

  async function restoreVersion(vId: string) {
    showToast("info", "Restauration depuis la version…");
    setShowVersions(false);
    void save({ version: true });
  }

  async function runAI() {
    setAiLoading(true);
    const text = editorRef.current?.getText() ?? "";
    const res = await fetch("/api/notes/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: aiAction, content: text.slice(0, 6000), instruction: aiInput || undefined }),
    }).catch(() => null);
    setAiLoading(false);
    if (!res?.ok) {
      const { error: e } = await res?.json().catch(() => ({})) ?? {};
      showToast("error", e ?? "Erreur IA"); return;
    }
    const { result } = await res.json();
    if (!result) return;
    tiptapEditorRef.current?.commands.focus("end");
    tiptapEditorRef.current?.commands.setHorizontalRule();
    tiptapEditorRef.current?.commands.insertContent(
      `<p><em>[IA — ${AI_ACTIONS.find(a=>a.id===aiAction)?.label}]</em></p><p>${result.replace(/\n/g,"</p><p>")}</p>`
    );
    setShowAI(false);
    showToast("success", "Résultat IA inséré");
  }

  function exportDoc(format: "pdf"|"txt"|"md") {
    if (format === "pdf") { window.print(); setShowExport(false); return; }
    const text = editorRef.current?.getText() ?? "";
    const html  = editorRef.current?.getHTML() ?? "";
    let content = text;
    if (format === "md") {
      content = html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi,"# $1\n\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi,"## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi,"### $1\n\n").replace(/<strong[^>]*>(.*?)<\/strong>/gi,"**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi,"_$1_").replace(/<s[^>]*>(.*?)<\/s>/gi,"~~$1~~")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,"[$2]($1)")
        .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,"> $1\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi,"- $1\n").replace(/<hr\s*\/?>/gi,"---\n")
        .replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"")
        .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<")
        .replace(/&gt;/g,">").replace(/&quot;/g,'"').trim();
    }
    const blob = new Blob([content], { type: format==="md" ? "text/markdown" : "text/plain" });
    const a    = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${title}.${format}`;
    a.click(); setShowExport(false);
  }

  // ── Dimensions ───────────────────────────────────────────────────────────
  const [pgW, pgH] = PAGE_SIZES[pageFormat] ?? PAGE_SIZES.A4;
  const [pageW, pageH] = pageOrientation === "landscape" ? [pgH, pgW] : [pgW, pgH];

  function pt(mm: number) { return Math.round(mm * MM * zoom / 100); }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${isDark?"bg-[#080f1e]":"bg-gray-50"}`}>
      <Loader2 className="animate-spin text-[#c9a55a]" size={32} />
    </div>
  );
  if (pageError) return (
    <div className={`flex h-screen flex-col items-center justify-center gap-4 ${isDark?"bg-[#080f1e] text-white":"bg-gray-50 text-gray-900"}`}>
      <AlertCircle size={40} className="text-red-400"/><p className="text-sm">{pageError}</p>
      <button onClick={() => router.back()} className="rounded-lg border border-[#c9a55a]/30 px-4 py-2 text-sm text-[#c9a55a]">Retour</button>
    </div>
  );

  const barBase = isDark ? "border-white/8 bg-[#0c1525]" : "border-gray-200 bg-white";

  return (
    <>
      {/* CSS d'impression */}
      <style>{`
        @media print {
          body > div:not(.doc-printable) { display: none !important; }
          .doc-printable { display: block !important; position: static !important; }
          .doc-page { box-shadow: none !important; margin: 0 !important; break-after: page; }
        }
      `}</style>

      <div className={`flex h-screen flex-col ${isDark?"bg-[#080f1e]":"bg-gray-100"} ${fullscreen?"fixed inset-0 z-50":""}`}>

        {/* ── Barre de titre ────────────────────────────────────────────── */}
        <div className={`flex shrink-0 items-center gap-2 border-b px-3 py-2 ${barBase}`}>
          <button onClick={() => router.push("/client/bloc-notes")}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isDark?"text-white/40 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
            <ArrowLeft size={16}/>
          </button>

          <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={() => void save()}
            placeholder="Document sans titre"
            className={`flex-1 rounded-lg px-2 py-1 text-sm font-semibold outline-none transition focus:ring-1 ${isDark?"bg-transparent text-white placeholder:text-white/25 focus:bg-white/4 focus:ring-white/10":"bg-transparent text-gray-900 placeholder:text-gray-400 focus:bg-gray-50 focus:ring-gray-200"}`}/>

          <div className="flex shrink-0 items-center gap-1 text-[10px]">
            {saveStatus === "saving" && <><Loader2 size={11} className={`animate-spin ${isDark?"text-white/30":"text-gray-400"}`}/><span className={isDark?"text-white/25":"text-gray-400"}>Enregistrement…</span></>}
            {saveStatus === "saved"  && <><Check size={11} className="text-emerald-400"/><span className="text-emerald-400">Enregistré</span></>}
            {saveStatus === "error"  && <><AlertCircle size={11} className="text-red-400"/><span className="text-red-400">Erreur</span></>}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {/* Zoom */}
            <div className={`flex items-center gap-1 rounded-lg border px-1.5 py-1 ${isDark?"border-white/8":"border-gray-200"}`}>
              <button onClick={() => setZoom(z=>Math.max(50,z-25))} className={`${isDark?"text-white/40 hover:text-white":"text-gray-400 hover:text-gray-700"}`}><ZoomOut size={11}/></button>
              <span className={`w-9 text-center text-[10px] font-medium ${isDark?"text-white/50":"text-gray-600"}`}>{zoom}%</span>
              <button onClick={() => setZoom(z=>Math.min(200,z+25))} className={`${isDark?"text-white/40 hover:text-white":"text-gray-400 hover:text-gray-700"}`}><ZoomIn size={11}/></button>
            </div>

            <button onClick={() => setShowLayout(o=>!o)} title="Mise en page"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${showLayout?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a]":isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
              <AlignJustify size={14}/>
            </button>
            <button onClick={() => setShowAI(o=>!o)} title="Assistant IA"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${showAI?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a]":isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
              <Sparkles size={14}/>
            </button>
            <button onClick={() => setShowVersions(o=>!o)} title="Historique"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${showVersions?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a]":isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
              <Clock size={14}/>
            </button>

            <button onClick={toggleFavorite} title="Favori"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${doc?.is_favorite?"text-amber-400":isDark?"text-white/25 hover:text-white":"text-gray-300 hover:text-gray-700"}`}>
              <Star size={14} fill={doc?.is_favorite?"currentColor":"none"}/>
            </button>

            {/* Export */}
            <div className="relative">
              <button onClick={() => setShowExport(o=>!o)} title="Exporter"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark?"text-white/35 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
                <Download size={14}/>
              </button>
              <AnimatePresence>
                {showExport && (
                  <motion.div initial={{opacity:0,scale:0.95,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:-4}}
                    className={`absolute right-0 top-9 z-50 w-44 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)}/>
                    <div className="relative z-50">
                      {(["pdf","txt","md"] as const).map(f => (
                        <button key={f} onClick={() => exportDoc(f)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition ${isDark?"text-white/70 hover:bg-white/6 hover:text-white":"text-gray-700 hover:bg-gray-50"}`}>
                          <FileText size={11}/>{f==="pdf"?"PDF (impression)":f==="txt"?"Texte brut (.txt)":"Markdown (.md)"}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={moveToTrash} title="Corbeille"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark?"text-white/25 hover:bg-red-900/20 hover:text-red-400":"text-gray-300 hover:bg-red-50 hover:text-red-400"}`}>
              <Trash2 size={14}/>
            </button>
            <button onClick={() => setFullscreen(f=>!f)} title="Plein écran"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark?"text-white/25 hover:bg-white/8 hover:text-white":"text-gray-300 hover:bg-gray-100 hover:text-gray-700"}`}>
              {fullscreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
            </button>
          </div>
        </div>

        {/* ── Barre d'outils ──────────────────────────────────────────────── */}
        <EditorToolbar editor={tiptapEditorRef.current} isDark={isDark}/>

        {/* ── Zone principale ─────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Canvas de la page */}
          <div className={`flex-1 overflow-auto py-8 ${isDark?"bg-[#05091a]":"bg-[#e8eaed]"}`}>
            <div className="mx-auto" style={{ width: Math.round(pageW*zoom/100) }}>
              {/* Page blanche */}
              <div
                className="doc-page mx-auto"
                style={{
                  width:     Math.round(pageW * zoom / 100),
                  minHeight: Math.round(pageH * zoom / 100),
                  padding:   `${pt(marginTop)}px ${pt(marginRight)}px ${pt(marginBottom)}px ${pt(marginLeft)}px`,
                  background: "white",
                  boxShadow: isDark
                    ? "0 4px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
                    : "0 4px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                  color: "#111827",
                  fontSize: `${Math.round(14 * zoom / 100)}px`,
                  lineHeight: 1.7,
                  fontFamily: "'Times New Roman', Georgia, serif",
                  transformOrigin: "top center",
                }}
              >
                <TiptapEditor
                  content={editorContent}
                  editorRef={editorRef}
                  onChange={(json) => handleEditorChange(json)}
                  onEditorReady={(ed) => { tiptapEditorRef.current = ed; }}
                  isDark={false}
                  placeholder="Commencez à écrire votre document…"
                />
              </div>

              {/* Infos bas de page */}
              <div className={`mt-3 text-center text-[10px] ${isDark?"text-white/15":"text-gray-400"}`}>
                {pageFormat} {pageOrientation === "landscape" ? "Paysage" : "Portrait"} · {Math.round(pageW*zoom/100)}×{Math.round(pageH*zoom/100)}px · {zoom}%
              </div>
            </div>
          </div>

          {/* ── Panel mise en page ──────────────────────────────────────── */}
          <AnimatePresence>
            {showLayout && (
              <motion.div initial={{x:256,opacity:0}} animate={{x:0,opacity:1}} exit={{x:256,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`w-64 shrink-0 overflow-y-auto border-l ${barBase}`}>
                <PanelHeader title="Mise en page" onClose={() => setShowLayout(false)} isDark={isDark}/>
                <div className="space-y-5 p-4">
                  <LayoutGroup label="Format" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["A4","A3","Letter"].map(f => (
                        <PillBtn key={f} active={pageFormat===f} onClick={() => setPageFormat(f)} isDark={isDark}>{f}</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                  <LayoutGroup label="Orientation" isDark={isDark}>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[["portrait","Portrait"],["landscape","Paysage"]].map(([v,l]) => (
                        <PillBtn key={v} active={pageOrientation===v} onClick={() => setPageOrientation(v)} isDark={isDark}>{l}</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                  <LayoutGroup label="Marges (mm)" isDark={isDark}>
                    {([["Haut",marginTop,setMarginTop],["Bas",marginBottom,setMarginBottom],["Gauche",marginLeft,setMarginLeft],["Droite",marginRight,setMarginRight]] as [string,number,(v:number)=>void][]).map(([lbl,val,set]) => (
                      <div key={lbl} className="flex items-center gap-2">
                        <span className={`w-14 text-xs ${isDark?"text-white/40":"text-gray-500"}`}>{lbl}</span>
                        <input type="number" min="5" max="60" value={val}
                          onChange={e => set(parseInt(e.target.value,10)||25)}
                          className={`w-16 rounded-lg border px-2 py-1 text-center text-xs outline-none ${isDark?"border-white/10 bg-white/4 text-white":"border-gray-200 bg-gray-50 text-gray-900"}`}/>
                        <span className={`text-xs ${isDark?"text-white/25":"text-gray-400"}`}>mm</span>
                      </div>
                    ))}
                  </LayoutGroup>
                  <LayoutGroup label="Zoom" isDark={isDark}>
                    <div className="grid grid-cols-4 gap-1">
                      {[50,75,100,125,150,200].map(z => (
                        <PillBtn key={z} active={zoom===z} onClick={() => setZoom(z)} isDark={isDark}>{z}%</PillBtn>
                      ))}
                    </div>
                  </LayoutGroup>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Panel IA ────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showAI && (
              <motion.div initial={{x:288,opacity:0}} animate={{x:0,opacity:1}} exit={{x:288,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`w-72 shrink-0 overflow-y-auto border-l ${barBase}`}>
                <PanelHeader title="Assistant IA" icon={<Sparkles size={13} style={{color:GOLD}}/>} onClose={() => setShowAI(false)} isDark={isDark}/>
                <div className="space-y-3 p-4">
                  <div className="space-y-0.5">
                    {AI_ACTIONS.map(a => (
                      <button key={a.id} onClick={() => setAiAction(a.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${aiAction===a.id?"bg-[rgba(201,165,90,0.12)] text-[#c9a55a] font-medium":isDark?"text-white/60 hover:bg-white/6 hover:text-white":"text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                        <span className="text-base">{a.icon}</span>{a.label}
                      </button>
                    ))}
                  </div>
                  {aiAction === "chat" && (
                    <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Votre instruction…" rows={3}
                      className={`w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none ${isDark?"border-white/8 bg-white/4 text-white placeholder:text-white/25":"border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"}`}/>
                  )}
                  <button onClick={runAI} disabled={aiLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
                    style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`,boxShadow:`0 4px 16px ${GOLD}30`}}>
                    {aiLoading ? <Loader2 size={13} className="animate-spin"/> : <Sparkles size={13}/>}
                    {aiLoading ? "Génération…" : "Appliquer"}
                  </button>
                  <p className={`text-center text-[10px] ${isDark?"text-white/20":"text-gray-400"}`}>
                    L&apos;IA travaille sur tout le document.<br/>Sélectionnez du texte pour cibler une partie.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Panel versions ──────────────────────────────────────────── */}
          <AnimatePresence>
            {showVersions && (
              <motion.div initial={{x:240,opacity:0}} animate={{x:0,opacity:1}} exit={{x:240,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`w-60 shrink-0 overflow-y-auto border-l ${barBase}`}>
                <PanelHeader title="Historique" icon={<Clock size={13} style={{color:GOLD}}/>} onClose={() => setShowVersions(false)} isDark={isDark}/>
                <div className="space-y-1.5 p-3">
                  <button onClick={() => void save({ version: true })}
                    className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition ${isDark?"border-white/10 text-white/50 hover:border-white/20 hover:text-white":"border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
                    <RefreshCw size={11}/> Créer un snapshot
                  </button>
                  {versions.length === 0 && (
                    <p className={`py-6 text-center text-xs ${isDark?"text-white/20":"text-gray-400"}`}>
                      Aucune version.<br/>Ctrl+S pour créer un snapshot.
                    </p>
                  )}
                  {versions.map(v => (
                    <div key={v.id} className={`flex items-center gap-2 rounded-xl p-3 ${isDark?"border border-white/6 bg-white/3 hover:bg-white/6":"border border-gray-100 bg-gray-50 hover:bg-gray-100"}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-xs font-medium ${isDark?"text-white/70":"text-gray-700"}`}>{v.title||"Sans titre"}</p>
                        <p className={`text-[10px] ${isDark?"text-white/25":"text-gray-400"}`}>
                          {new Date(v.saved_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>
                      <button onClick={() => restoreVersion(v.id)} title="Restaurer"
                        className={`shrink-0 rounded-lg p-1 transition ${isDark?"text-white/25 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-200 hover:text-gray-700"}`}>
                        <RefreshCw size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)}/>}
      </AnimatePresence>
    </>
  );
}

// ── Composants UI helper ──────────────────────────────────────────────────────
function PanelHeader({ title, icon, onClose, isDark }: { title: string; icon?: React.ReactNode; onClose: ()=>void; isDark: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark?"border-white/8":"border-gray-100"}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-xs font-bold ${isDark?"text-white/70":"text-gray-700"}`}>{title}</span>
      </div>
      <button onClick={onClose} className={`${isDark?"text-white/25 hover:text-white":"text-gray-300 hover:text-gray-700"}`}><X size={14}/></button>
    </div>
  );
}
function LayoutGroup({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="space-y-2">
      <label className={`block text-[0.6rem] font-bold uppercase tracking-widest ${isDark?"text-white/35":"text-gray-400"}`}>{label}</label>
      {children}
    </div>
  );
}
function PillBtn({ active, onClick, children, isDark }: { active: boolean; onClick: ()=>void; children: React.ReactNode; isDark: boolean }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${active?"border-[#c9a55a]/50 bg-[rgba(201,165,90,0.1)] text-[#c9a55a]":isDark?"border-white/10 text-white/40 hover:border-white/20 hover:text-white":"border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
      {children}
    </button>
  );
}
