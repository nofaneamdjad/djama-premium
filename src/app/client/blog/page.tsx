"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Sparkles, Send, Edit3, Trash2, Globe,
  ExternalLink, MoreHorizontal, ChevronDown, Copy, Check,
  FileText, Calendar, Lightbulb, BarChart2, Settings,
  Clock, Tag, Eye, ArrowUpRight, AlertCircle, Loader2,
  CheckCircle2, BookOpen, Filter, ArrowUpDown,
  Wand2, RefreshCw, Minimize2, Expand, Feather,
  ImageIcon, Link2, Upload,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

/* ── constants ──────────────────────────────────────────────────────── */
const GOLD = "#c9a55a";

type ArticleStatus = "draft" | "en_redaction" | "a_valider" | "planifie" | "published" | "archive";

const STATUS_META: Record<ArticleStatus, { label: string; color: string; bg: string }> = {
  draft:        { label: "Brouillon",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  en_redaction: { label: "En rédaction",color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  a_valider:    { label: "À valider",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  planifie:     { label: "Planifié",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  published:    { label: "Publié",      color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  archive:      { label: "Archivé",     color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

interface Article {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_url: string | null;
  tags: string[];
  status: ArticleStatus;
  published_at: string | null;
  scheduled_at: string | null;
  category: string;
  seo_title: string;
  seo_description: string;
  seo_image_url: string | null;
  read_count: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

type Tab = "articles" | "calendrier" | "idees" | "seo" | "analytics" | "parametres";
const TABS: { key: Tab; label: string; Icon: typeof FileText }[] = [
  { key: "articles",   label: "Articles",   Icon: FileText   },
  { key: "calendrier", label: "Calendrier", Icon: Calendar   },
  { key: "idees",      label: "Idées",      Icon: Lightbulb  },
  { key: "seo",        label: "SEO",        Icon: BarChart2  },
  { key: "analytics",  label: "Analytics",  Icon: Eye        },
  { key: "parametres", label: "Paramètres", Icon: Settings   },
];

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function readTime(text: string) { return Math.max(1, Math.ceil((text.trim().split(/\s+/).length) / 200)); }
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ── design tokens ──────────────────────────────────────────────────── */
function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#111111"                  : "#f8f8f5",
    surface:    isDark ? "#191919"                  : "#ffffff",
    glass:      isDark ? "rgba(255,255,255,0.04)"   : "rgba(0,0,0,0.025)",
    border:     isDark ? "rgba(255,255,255,0.08)"   : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)"   : "rgba(0,0,0,0.04)",
    text:       isDark ? "#e8e2d6"                  : "#1a1a1a",
    text2:      isDark ? "#a09880"                  : "#4a4a4a",
    text3:      isDark ? "#6b6256"                  : "#7a7a7a",
    text4:      isDark ? "#4a4540"                  : "#9a9a9a",
  };
}

/* ── markdown toolbar button ────────────────────────────────────────── */
function MdBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const { isDark } = useTheme();
  const t = tok(isDark);
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="px-2 py-1 rounded text-xs font-semibold transition hover:opacity-70"
      style={{ color: t.text2, background: t.glass, border: `1px solid ${t.border}` }}
    >
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ARTICLE EDITOR MODAL
══════════════════════════════════════════════════════════════════════ */
function ArticleEditor({
  article, userId, isDark,
  onClose, onSaved,
}: {
  article: Partial<Article> | null;
  userId: string;
  isDark: boolean;
  onClose: () => void;
  onSaved: (a: Article) => void;
}) {
  const t = tok(isDark);
  const isNew = !article?.id;
  const [title,       setTitle]       = useState(article?.title           ?? "");
  const [slug,        setSlug]        = useState(article?.slug            ?? "");
  const [content,     setContent]     = useState(article?.content         ?? "");
  const [excerpt,     setExcerpt]     = useState(article?.excerpt         ?? "");
  const [tags,        setTags]        = useState<string[]>(article?.tags  ?? []);
  const [status,      setStatus]      = useState<ArticleStatus>((article?.status as ArticleStatus) ?? "draft");
  const [category,    setCategory]    = useState((article as Article | null)?.category    ?? "Non classé");
  const [seoTitle,    setSeoTitle]    = useState((article as Article | null)?.seo_title   ?? "");
  const [seoDesc,     setSeoDesc]     = useState((article as Article | null)?.seo_description ?? "");
  const [scheduledAt, setScheduledAt] = useState((article as Article | null)?.scheduled_at?.slice(0, 16) ?? "");
  const [sideTab,     setSideTab]     = useState<"meta" | "seo">("meta");
  const [tagInput,    setTagInput]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [aiTask,  setAiTask]  = useState<"excerpt" | "content" | null>(null);
  const [coverUrl,       setCoverUrl]       = useState((article as Article | null)?.cover_url ?? "");
  const [focusKeyword,   setFocusKeyword]   = useState("");
  const [seoTips,        setSeoTips]        = useState<string[]>([]);
  const [seoTipsLoading, setSeoTipsLoading] = useState(false);
  const [selInfo,      setSelInfo]      = useState<{ start: number; end: number; text: string } | null>(null);
  const [aiSelTask,    setAiSelTask]    = useState<string | null>(null);
  const [imgPanel,     setImgPanel]     = useState(false);
  const [imgTab,       setImgTab]       = useState<"upload" | "url">("upload");
  const [imgUrl,       setImgUrl]       = useState("");
  const [imgAlt,       setImgAlt]       = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [copyPanel,    setCopyPanel]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slugAuto = useRef(isNew);

  useEffect(() => {
    if (slugAuto.current) setSlug(slugify(title));
  }, [title]);

  /* autosave */
  useEffect(() => {
    if (isNew || !article?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaved(false);
    saveTimer.current = setTimeout(() => doSave(false), 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, content, excerpt, tags, status]);

  async function doSave(close = false) {
    if (!title.trim()) return;
    setSaving(true);
    const payload: Partial<Article> = {
      title, slug: slug || slugify(title), content, excerpt,
      tags, status, category,
      cover_url: coverUrl || null,
      seo_title: seoTitle, seo_description: seoDesc,
      scheduled_at: status === "planifie" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      published_at: status === "published" ? (article?.published_at ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };
    let result: Article | null = null;
    if (isNew) {
      const { data, error } = await supabase.from("blog_articles")
        .insert({ ...payload, user_id: userId, created_at: new Date().toISOString() })
        .select().single();
      if (!error) result = data as Article;
    } else {
      const { data, error } = await supabase.from("blog_articles")
        .update(payload).eq("id", article!.id!).select().single();
      if (!error) result = data as Article;
    }
    setSaving(false);
    if (result) { setSaved(true); onSaved(result); if (close) onClose(); }
  }

  async function generateAI(type: "excerpt" | "content") {
    setAiTask(type);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content, tags }),
      });
      const json = await res.json();
      if (type === "excerpt") setExcerpt(json.result ?? "");
      else setContent(json.result ?? "");
    } finally { setAiTask(null); }
  }

  async function transformSelection(action: string) {
    if (!selInfo || aiSelTask) return;
    setAiSelTask(action);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: action, selectedText: selInfo.text, title }),
      });
      const json = await res.json();
      if (json.result) {
        const next = content.slice(0, selInfo.start) + json.result + content.slice(selInfo.end);
        setContent(next);
        setSelInfo(null);
        setTimeout(() => {
          const ta = textareaRef.current;
          if (ta) { ta.focus(); ta.setSelectionRange(selInfo.start, selInfo.start + json.result.length); }
        }, 0);
      }
    } finally { setAiSelTask(null); }
  }

  function checkSelection() {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    if (s !== e) setSelInfo({ start: s, end: e, text: content.slice(s, e) });
    else setSelInfo(null);
  }

  async function uploadImageFile(file: File): Promise<string | null> {
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/blog/upload-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { alert(json.error ?? "Erreur upload"); return null; }
      return json.url as string;
    } finally { setImgUploading(false); }
  }

  function insertImageMd(url: string, alt = "") {
    const ta = textareaRef.current;
    const md = `![${alt || "image"}](${url})`;
    if (!ta) { setContent(c => c + "\n" + md + "\n"); return; }
    const pos = ta.selectionStart;
    const next = content.slice(0, pos) + "\n" + md + "\n" + content.slice(pos);
    setContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + md.length + 2, pos + md.length + 2); }, 0);
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageFile(file);
    if (url) { insertImageMd(url, imgAlt); setImgPanel(false); setImgAlt(""); }
    e.target.value = "";
  }

  async function handleImageDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const file = [...e.dataTransfer.files].find(f => f.type.startsWith("image/"));
    if (!file) return;
    const url = await uploadImageFile(file);
    if (url) insertImageMd(url);
  }

  function insertMd(before: string, after = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const next = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length); }, 0);
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (!tags.includes(tag)) setTags(t => [...t, tag]);
      setTagInput("");
    }
  }

  const wc = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: t.bg }}>
      {/* top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-xl transition hover:opacity-70"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <X size={14} style={{ color: t.text2 }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs" style={{ color: t.text3 }}>
            <span>{isNew ? "Nouvel article" : "Modifier l'article"}</span>
            <span>·</span>
            <span>{wc} mots</span>
            <span>·</span>
            <span>{readTime(content)} min</span>
            {!isNew && (
              <>
                <span>·</span>
                {saving
                  ? <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Enregistrement…</span>
                  : saved ? <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={10} />Enregistré</span>
                  : null}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ArticleStatus)}
              className="appearance-none rounded-xl text-xs font-semibold px-3 py-1.5 pr-6 cursor-pointer outline-none"
              style={{
                background: STATUS_META[status].bg,
                color: STATUS_META[status].color,
                border: `1px solid ${STATUS_META[status].color}30`,
              }}
            >
              {(Object.entries(STATUS_META) as [ArticleStatus, typeof STATUS_META[ArticleStatus]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: STATUS_META[status].color }} />
          </div>
          <button
            onClick={() => doSave(false)}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
            style={{ background: GOLD, color: "#111" }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            {isNew ? "Créer" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* main */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-8 lg:px-16 py-8 max-w-4xl mx-auto w-full">
          {/* title */}
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de l'article…"
            rows={2}
            className="w-full resize-none bg-transparent text-2xl sm:text-3xl font-bold leading-tight outline-none placeholder:opacity-30"
            style={{ color: t.text, border: "none" }}
          />
          {/* slug */}
          <div className="flex items-center gap-2 mt-2 mb-6 text-xs" style={{ color: t.text4 }}>
            <Globe size={11} />
            <span>/blogs/{userId?.slice(0, 8)}…/</span>
            <input
              value={slug}
              onChange={e => { slugAuto.current = false; setSlug(e.target.value); }}
              className="bg-transparent outline-none flex-1 min-w-0"
              style={{ color: t.text3 }}
              placeholder="slug-de-l-article"
            />
          </div>

          {/* markdown toolbar */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <MdBtn label="H1" onClick={() => insertMd("# ")} />
            <MdBtn label="H2" onClick={() => insertMd("## ")} />
            <MdBtn label="H3" onClick={() => insertMd("### ")} />
            <MdBtn label="G" onClick={() => insertMd("**", "**")} />
            <MdBtn label="I" onClick={() => insertMd("_", "_")} />
            <MdBtn label='""' onClick={() => insertMd("> ")} />
            <MdBtn label="—" onClick={() => insertMd("\n---\n")} />
            <MdBtn label="• liste" onClick={() => insertMd("- ")} />
            <MdBtn label="1. liste" onClick={() => insertMd("1. ")} />
            <MdBtn label="lien" onClick={() => insertMd("[", "](url)")} />
            <MdBtn label="`code`" onClick={() => insertMd("`", "`")} />
            <MdBtn label="tableau" onClick={() => insertMd("\n| Col 1 | Col 2 |\n|-------|-------|\n| Val   | Val   |\n")} />
            <button
              disabled={!!aiTask}
              onMouseDown={e => { e.preventDefault(); generateAI("content"); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition hover:opacity-70 disabled:opacity-40"
              style={{ color: GOLD, background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}
            >
              {aiTask === "content" ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              Générer avec DJAMA
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); setImgPanel(p => !p); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition hover:opacity-70"
              style={{ color: t.text2, background: t.glass, border: `1px solid ${t.border}` }}
            >
              <ImageIcon size={10} />
              Image
            </button>
          </div>

          {/* panneau insertion image */}
          <AnimatePresence>
            {imgPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="mb-3 rounded-xl overflow-hidden"
                style={{ border: `1px solid ${t.border}`, background: t.surface }}
              >
                {/* tabs */}
                <div className="flex" style={{ borderBottom: `1px solid ${t.border}` }}>
                  {(["upload", "url"] as const).map(tab => (
                    <button key={tab}
                      onMouseDown={e => { e.preventDefault(); setImgTab(tab); }}
                      className="flex-1 py-2 text-xs font-semibold transition"
                      style={{
                        color: imgTab === tab ? GOLD : t.text3,
                        borderBottom: imgTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                        background: "transparent",
                      }}
                    >
                      {tab === "upload" ? "Uploader" : "Par URL"}
                    </button>
                  ))}
                  <button onMouseDown={e => { e.preventDefault(); setImgPanel(false); }}
                    className="px-3 transition hover:opacity-70" style={{ color: t.text4 }}>
                    <X size={12} />
                  </button>
                </div>

                <div className="p-3 flex flex-col gap-2">
                  {/* champ alt commun */}
                  <input
                    value={imgAlt}
                    onChange={e => setImgAlt(e.target.value)}
                    placeholder="Texte alternatif (optionnel)"
                    className="w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  />

                  {imgTab === "upload" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      <button
                        disabled={imgUploading}
                        onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click(); }}
                        className="flex items-center justify-center gap-2 w-full rounded-lg py-5 text-xs transition hover:opacity-80 disabled:opacity-40"
                        style={{ border: `2px dashed ${t.border}`, color: t.text3 }}
                      >
                        {imgUploading
                          ? <><Loader2 size={14} className="animate-spin" /> Envoi en cours…</>
                          : <><Upload size={14} /> Cliquer ou glisser une image (max 5 Mo)</>}
                      </button>
                    </div>
                  )}

                  {imgTab === "url" && (
                    <div className="flex gap-2">
                      <input
                        value={imgUrl}
                        onChange={e => setImgUrl(e.target.value)}
                        placeholder="https://…"
                        className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                        style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                      />
                      <button
                        disabled={!imgUrl.trim()}
                        onMouseDown={e => {
                          e.preventDefault();
                          if (imgUrl.trim()) { insertImageMd(imgUrl.trim(), imgAlt); setImgPanel(false); setImgUrl(""); setImgAlt(""); }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                        style={{ background: GOLD, color: "#111" }}
                      >
                        <Link2 size={10} /> Insérer
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* barre IA contextuelle — apparaît quand du texte est sélectionné */}
          <AnimatePresence>
            {selInfo && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex flex-wrap items-center gap-1.5 mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}30` }}
              >
                <Sparkles size={11} style={{ color: GOLD }} />
                <span className="text-xs font-semibold mr-1" style={{ color: GOLD }}>
                  {selInfo.text.trim().split(/\s+/).length} mots sélectionnés —
                </span>
                {([
                  { key: "improve",      label: "Améliorer",  Icon: Wand2      },
                  { key: "rewrite",      label: "Reformuler", Icon: RefreshCw  },
                  { key: "expand",       label: "Développer", Icon: Expand     },
                  { key: "summarize",    label: "Résumer",    Icon: Minimize2  },
                  { key: "simplify",     label: "Simplifier", Icon: Feather    },
                  { key: "translate_en", label: "→ EN",       Icon: Globe      },
                ] as const).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    disabled={!!aiSelTask}
                    onMouseDown={e => { e.preventDefault(); transformSelection(key); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition hover:opacity-80 disabled:opacity-40"
                    style={{ background: t.glass, color: aiSelTask === key ? GOLD : t.text2, border: `1px solid ${t.border}` }}
                  >
                    {aiSelTask === key
                      ? <Loader2 size={10} className="animate-spin" style={{ color: GOLD }} />
                      : <Icon size={10} />}
                    {label}
                  </button>
                ))}
                <button
                  onMouseDown={e => { e.preventDefault(); setSelInfo(null); }}
                  className="ml-auto flex items-center justify-center w-5 h-5 rounded transition hover:opacity-70"
                  style={{ color: t.text4 }}
                >
                  <X size={10} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* content textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onMouseUp={checkSelection}
            onKeyUp={checkSelection}
            onDragOver={e => e.preventDefault()}
            onDrop={handleImageDrop}
            placeholder="Commencez à écrire… (Markdown supporté) — glissez une image ici"
            className="flex-1 w-full resize-none bg-transparent text-sm leading-relaxed outline-none font-mono placeholder:opacity-30"
            style={{ color: t.text, minHeight: "400px", border: "none" }}
          />
        </div>

        {/* right sidebar metadata */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 overflow-y-auto"
          style={{ borderLeft: `1px solid ${t.border}`, background: t.surface }}>

          {/* sidebar tabs */}
          <div className="flex gap-0 shrink-0" style={{ borderBottom: `1px solid ${t.border}` }}>
            {(["meta", "seo"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                className="flex-1 py-3 text-xs font-semibold transition"
                style={{
                  color: sideTab === tab ? GOLD : t.text3,
                  borderBottom: sideTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                }}
              >
                {tab === "meta" ? "Métadonnées" : "SEO"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 p-5 overflow-y-auto">

            {sideTab === "meta" && <>
              {/* cover image */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Image de couverture</p>
                {coverUrl ? (
                  <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: "16/9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="couverture" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setCoverUrl("")}
                      className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-lg transition hover:opacity-80"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <Trash2 size={11} style={{ color: "#fff" }} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 w-full rounded-xl py-5 cursor-pointer transition hover:opacity-80"
                    style={{ border: `2px dashed ${t.border}`, color: t.text4 }}>
                    {imgUploading
                      ? <Loader2 size={16} className="animate-spin" style={{ color: GOLD }} />
                      : <><ImageIcon size={16} /><span className="text-xs">Ajouter une couverture</span></>}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) { const url = await uploadImageFile(file); if (url) setCoverUrl(url); }
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {coverUrl && (
                  <input
                    value={coverUrl}
                    onChange={e => setCoverUrl(e.target.value)}
                    placeholder="URL de l'image…"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none mt-1"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text3 }}
                  />
                )}
              </div>

              {/* category */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Catégorie</p>
                <input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex : Marketing, IA, Finance…"
                  className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                />
              </div>

              {/* tags */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Tags</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}25` }}>
                      {tag}
                      <button onClick={() => setTags(prev => prev.filter(x => x !== tag))}>
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Ajouter un tag (Entrée)"
                  className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                />
              </div>

              {/* scheduled_at — visible uniquement si statut planifié */}
              {status === "planifie" && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Date de publication</p>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  />
                </div>
              )}

              {/* excerpt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: t.text2 }}>Extrait</span>
                  <button
                    disabled={!!aiTask}
                    onClick={() => generateAI("excerpt")}
                    className="flex items-center gap-1 text-xs transition hover:opacity-70 disabled:opacity-40"
                    style={{ color: GOLD }}
                  >
                    {aiTask === "excerpt" ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Auto
                  </button>
                </div>
                <textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Résumé de l'article…"
                  className="w-full resize-none rounded-xl p-3 text-xs leading-relaxed outline-none"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                />
              </div>

              {/* public link */}
              {!isNew && article?.id && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Lien public</p>
                  <div className="flex items-center gap-2 rounded-xl p-2"
                    style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                    <span className="flex-1 text-xs truncate" style={{ color: t.text4 }}>
                      /blogs/…/{slug || "—"}
                    </span>
                    <Link href={`/blogs/${userId}/${slug}`} target="_blank">
                      <ExternalLink size={12} style={{ color: t.text3 }} />
                    </Link>
                  </div>
                </div>
              )}
            </>}

            {sideTab === "seo" && (() => {
              /* ── calculs SEO en ligne ─────────────────────────────────── */
              const words = content.trim() === "" ? [] : content.trim().split(/\s+/);
              const wc = words.length;
              const h2s  = (content.match(/^##\s.+$/gm)  ?? []);
              const h3s  = (content.match(/^###\s.+$/gm) ?? []);
              const allH = (content.match(/^#{1,3}\s.+$/gm) ?? []);
              const extLinks = (content.match(/\[.+?\]\(https?:\/\//g) ?? []);
              const sentences = content.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 3);
              const avgWPS = sentences.length ? wc / sentences.length : 0;
              const kw = focusKeyword.trim().toLowerCase();
              const kwCount = kw ? words.filter(w => w.toLowerCase().replace(/[^a-zàâäéèêëîïôùûüç]/g, "").includes(kw)).length : 0;
              const kwDensity = kw && wc > 0 ? (kwCount / wc) * 100 : null;

              /* score 0-100 */
              let score = 0;
              if (title.trim())                                                                     score += 10;
              if ((seoTitle||title).length > 0 && (seoTitle||title).length <= 60)                  score += 10;
              if ((seoDesc||excerpt).length > 0 && (seoDesc||excerpt).length <= 160)               score += 10;
              if (excerpt.trim())                                                                    score +=  5;
              if (wc > 300)                                                                          score += 10;
              if (wc > 600)                                                                          score +=  5;
              if (tags.length > 0)                                                                   score +=  5;
              if (category && category !== "Non classé")                                             score +=  5;
              if (coverUrl)                                                                          score += 10;
              if (kw)                                                                                score +=  5;
              if (kwDensity !== null && kwDensity >= 0.5 && kwDensity <= 3)                         score += 10;
              if (h2s.length >= 1)                                                                   score +=  5;
              if (h2s.length >= 2)                                                                   score +=  5;
              if (extLinks.length >= 1)                                                              score +=  5;
              score = Math.min(score, 100);

              const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
              const scoreLabel = score >= 80 ? "Excellent" : score >= 50 ? "À améliorer" : "Insuffisant";

              const readLabel = avgWPS === 0 ? "—" : avgWPS < 15 ? "Excellent" : avgWPS < 20 ? "Bon" : avgWPS < 25 ? "Moyen" : "Difficile";
              const readColor = avgWPS === 0 ? t.text4 : avgWPS < 20 ? "#22c55e" : avgWPS < 25 ? "#f59e0b" : "#ef4444";

              const kwDensLabel = kwDensity === null ? "—" : kwDensity < 0.5 ? "Trop faible" : kwDensity <= 3 ? "Optimal" : "Trop élevé";
              const kwDensColor = kwDensity === null ? t.text4 : kwDensity >= 0.5 && kwDensity <= 3 ? "#22c55e" : "#ef4444";

              /* arc SVG */
              const R = 28, C = 2 * Math.PI * R;
              const dash = (score / 100) * C;

              return <>
                {/* Score global */}
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={R} fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="6" />
                    <circle cx="36" cy="36" r={R} fill="none" stroke={scoreColor} strokeWidth="6"
                      strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
                      transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray .4s" }} />
                    <text x="36" y="40" textAnchor="middle" fontSize="16" fontWeight="700" fill={scoreColor}>{score}</text>
                  </svg>
                  <div>
                    <p className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
                    <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Score SEO global</p>
                    <p className="text-[10px] mt-1" style={{ color: t.text4 }}>{wc} mots · {allH.length} titres · {extLinks.length} lien{extLinks.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Mot-clé cible */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Mot-clé cible</p>
                  <input
                    value={focusKeyword}
                    onChange={e => setFocusKeyword(e.target.value)}
                    placeholder="Ex : facturation auto-entrepreneur"
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  />
                  {kw && (
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px]" style={{ color: t.text4 }}>
                        {kwCount} occurrence{kwCount !== 1 ? "s" : ""} — densité {kwDensity?.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: kwDensColor }}>{kwDensLabel}</span>
                    </div>
                  )}
                </div>

                {/* Titre SEO */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Titre SEO</p>
                  <input
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    placeholder={title || "Titre pour les moteurs de recherche…"}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: (seoTitle||title).length > 60 ? "#ef4444" : t.text4 }}>
                    {(seoTitle||title).length}/60 caractères
                  </p>
                </div>

                {/* Meta description */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Meta description</p>
                  <textarea
                    value={seoDesc}
                    onChange={e => setSeoDesc(e.target.value)}
                    rows={3}
                    placeholder={excerpt || "Description pour Google…"}
                    className="w-full resize-none rounded-xl p-3 text-xs leading-relaxed outline-none"
                    style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: (seoDesc||excerpt).length > 160 ? "#ef4444" : t.text4 }}>
                    {(seoDesc||excerpt).length}/160 caractères
                  </p>
                </div>

                {/* Aperçu Google */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Aperçu Google</p>
                  <div className="rounded-xl p-3" style={{ background: isDark ? "#1e2433" : "#fff", border: `1px solid ${t.border}` }}>
                    <p className="text-[10px] mb-0.5" style={{ color: "#5f6368" }}>djama.space › blogs</p>
                    <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: "#1a73e8" }}>
                      {seoTitle || title || "Titre de l'article"}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "#4d5156" }}>
                      {seoDesc || excerpt || "La description apparaîtra ici dans les résultats de recherche."}
                    </p>
                  </div>
                </div>

                {/* Lisibilité + structure */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                    <p className="text-[10px] mb-1" style={{ color: t.text4 }}>Lisibilité</p>
                    <p className="text-xs font-bold" style={{ color: readColor }}>{readLabel}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: t.text4 }}>{avgWPS > 0 ? `~${avgWPS.toFixed(0)} mots/phrase` : "—"}</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                    <p className="text-[10px] mb-1" style={{ color: t.text4 }}>Structure</p>
                    <p className="text-xs font-bold" style={{ color: t.text }}>
                      {h2s.length} H2 · {h3s.length} H3
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: h2s.length >= 2 ? "#22c55e" : "#f59e0b" }}>
                      {h2s.length >= 2 ? "Bien structuré" : h2s.length === 1 ? "Ajouter des H2" : "Aucun H2"}
                    </p>
                  </div>
                </div>

                {/* Plan du contenu */}
                {allH.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Plan du contenu</p>
                    <div className="flex flex-col gap-1 rounded-xl p-3 overflow-y-auto max-h-36"
                      style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                      {allH.map((h, i) => {
                        const level = (h.match(/^#+/) ?? [""])[0].length;
                        return (
                          <p key={i} className="text-[10px] truncate leading-relaxed"
                            style={{ color: level === 2 ? t.text2 : t.text3, paddingLeft: level === 2 ? 0 : level === 3 ? 8 : 0 }}>
                            {level === 2 ? "▸ " : level === 3 ? "  · " : ""}{h.replace(/^#+\s/, "")}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: t.text2 }}>Checklist</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: "Titre renseigné",       ok: !!title.trim() },
                      { label: "Titre SEO ≤ 60 car.",   ok: (seoTitle||title).length > 0 && (seoTitle||title).length <= 60 },
                      { label: "Meta desc. ≤ 160 car.", ok: (seoDesc||excerpt).length > 0 && (seoDesc||excerpt).length <= 160 },
                      { label: "Contenu > 300 mots",    ok: wc > 300 },
                      { label: "Image de couverture",   ok: !!coverUrl },
                      { label: "Au moins 2 sections H2",ok: h2s.length >= 2 },
                      { label: "Lien externe",          ok: extLinks.length >= 1 },
                      { label: "Tags définis",          ok: tags.length > 0 },
                      ...(kw ? [{ label: `Densité "${kw}" (0.5-3%)`, ok: kwDensity !== null && kwDensity >= 0.5 && kwDensity <= 3 }] : []),
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: ok ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.1)" }}>
                          {ok
                            ? <CheckCircle2 size={10} style={{ color: "#22c55e" }} />
                            : <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#94a3b8" }} />}
                        </div>
                        <span className="text-xs" style={{ color: ok ? t.text2 : t.text4 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions IA SEO */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: t.text2 }}>Suggestions IA</p>
                    <button
                      disabled={seoTipsLoading || (!content.trim() && !title.trim())}
                      onClick={async () => {
                        setSeoTipsLoading(true);
                        try {
                          const res = await fetch("/api/blog/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "seo_tips", title, content, seoTitle, seoDesc, focusKeyword }),
                          });
                          const json = await res.json();
                          setSeoTips(json.tips ?? []);
                        } finally { setSeoTipsLoading(false); }
                      }}
                      className="flex items-center gap-1 text-xs transition hover:opacity-70 disabled:opacity-40"
                      style={{ color: GOLD }}
                    >
                      {seoTipsLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      Analyser
                    </button>
                  </div>
                  {seoTips.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {seoTips.map((tip, i) => (
                        <div key={i} className="flex gap-2 rounded-xl p-2.5"
                          style={{ background: `${GOLD}0a`, border: `1px solid ${GOLD}20` }}>
                          <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color: GOLD }}>{i + 1}.</span>
                          <p className="text-[11px] leading-relaxed" style={{ color: t.text2 }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px]" style={{ color: t.text4 }}>
                      Clique sur "Analyser" pour obtenir des recommandations personnalisées.
                    </p>
                  )}
                </div>
              </>;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CREATE WITH DJAMA MODAL
══════════════════════════════════════════════════════════════════════ */
function CreateWithDjama({
  isDark, userId,
  onClose, onCreated,
}: {
  isDark: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (a: Article) => void;
}) {
  const t = tok(isDark);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"prompt" | "generating" | "done">("prompt");
  const [draft, setDraft] = useState<Partial<Article> | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const EXAMPLES = [
    "Écris un article de 1 200 mots sur l'automatisation des petites entreprises avec l'IA. Inclus 5 parties, un tableau comparatif et une FAQ.",
    "Guide complet sur la facturation pour auto-entrepreneurs en France : règles, délais, TVA, outils recommandés.",
    "7 façons concrètes d'utiliser l'IA pour gagner du temps dans la gestion quotidienne d'une PME.",
    "Comment créer une stratégie de contenu efficace pour attirer des clients B2B en 2025 ?",
  ];

  async function generate() {
    if (!prompt.trim()) return;
    setStep("generating");
    setLoading(true);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "content", title: prompt.trim(), content: "", tags: [] }),
      });
      const json = await res.json();
      if (json.result) {
        const firstLine = json.result.split("\n").find((l: string) => l.trim()) ?? prompt;
        const titleClean = firstLine.replace(/^#+\s*/, "").slice(0, 120);
        setDraft({
          title:   titleClean,
          slug:    slugify(titleClean),
          content: json.result,
          excerpt: "",
          tags:    [],
          status:  "draft",
        });
        setStep("done");
      }
    } finally { setLoading(false); }
  }

  /* done: auto-open editor */
  if (step === "done" && draft) {
    return (
      <ArticleEditor
        article={draft}
        userId={userId}
        isDark={isDark}
        onClose={onClose}
        onSaved={a => { onCreated(a); onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.24 }}
        className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${t.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
              <Sparkles size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: t.text }}>Créer avec DJAMA</p>
              <p className="text-xs" style={{ color: t.text3 }}>Décrivez l&apos;article que vous souhaitez</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: t.glass }}>
            <X size={14} style={{ color: t.text2 }} />
          </button>
        </div>

        {/* prompt */}
        <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <textarea
            ref={textRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate(); }}
            placeholder="Décrivez l'article : sujet, audience, longueur, ton, structure souhaitée…"
            rows={4}
            className="w-full bg-transparent text-sm resize-none outline-none placeholder:opacity-40 leading-relaxed"
            style={{ color: t.text }}
            autoFocus
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: t.text4 }}>Ctrl+Entrée pour générer</span>
            <button
              onClick={generate}
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
              style={{ background: GOLD, color: "#111" }}
            >
              {loading
                ? <><Loader2 size={12} className="animate-spin" />Génération…</>
                : <><Send size={12} />Générer l&apos;article</>}
            </button>
          </div>
        </div>

        {/* generating state */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
            <Loader2 size={16} style={{ color: GOLD }} className="animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium" style={{ color: GOLD }}>DJAMA rédige votre article…</p>
              <p className="text-xs mt-0.5" style={{ color: t.text3 }}>Cela prend généralement 10 à 20 secondes</p>
            </div>
          </div>
        )}

        {/* examples */}
        {!loading && (
          <div>
            <p className="text-xs font-semibold mb-2.5" style={{ color: t.text3 }}>Exemples de prompts</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(ex); textRef.current?.focus(); }}
                  className="text-left text-xs rounded-xl px-3 py-2 transition hover:opacity-80 line-clamp-2"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: ArticleStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMING SOON TAB
══════════════════════════════════════════════════════════════════════ */
function ComingSoon({ label, Icon, isDark }: { label: string; Icon: typeof FileText; isDark: boolean }) {
  const t = tok(isDark);
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${GOLD}14` }}>
        <Icon size={24} style={{ color: GOLD }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm" style={{ color: t.text }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: t.text3 }}>Cette section sera disponible prochainement</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ARTICLES TABLE
══════════════════════════════════════════════════════════════════════ */
function ArticlesTable({
  articles, loading, isDark, userId,
  onEdit, onDelete,
}: {
  articles: Article[];
  loading: boolean;
  isDark: boolean;
  userId: string;
  onEdit: (a: Article) => void;
  onDelete: (id: string) => void;
}) {
  const t = tok(isDark);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: t.glass }} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: t.glass }}>
          <FileText size={22} style={{ color: t.text4 }} />
        </div>
        <p className="text-sm" style={{ color: t.text3 }}>Aucun article trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
            {["Titre", "Catégorie", "Statut", "Publication", "Vues", ""].map(h => (
              <th key={h} className="px-3 pb-2 text-left text-xs font-semibold" style={{ color: t.text3 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr
              key={a.id}
              className="group transition"
              style={{ borderBottom: `1px solid ${t.borderSoft}` }}
            >
              {/* title */}
              <td className="px-3 py-3.5">
                <button
                  onClick={() => onEdit(a)}
                  className="flex flex-col items-start gap-0.5 text-left"
                >
                  <span className="text-sm font-medium line-clamp-1 transition group-hover:opacity-70" style={{ color: t.text }}>
                    {a.title || "Sans titre"}
                  </span>
                  {a.excerpt && (
                    <span className="text-xs line-clamp-1" style={{ color: t.text4 }}>{a.excerpt}</span>
                  )}
                </button>
              </td>
              {/* category */}
              <td className="px-3 py-3.5">
                <span className="text-xs rounded-full px-2 py-0.5"
                  style={{ background: t.glass, color: t.text3 }}>
                  {a.category || "Non classé"}
                </span>
              </td>
              {/* status */}
              <td className="px-3 py-3.5">
                <StatusBadge status={a.status} />
              </td>
              {/* date */}
              <td className="px-3 py-3.5">
                <span className="text-xs tabular-nums" style={{ color: t.text3 }}>
                  {a.status === "published" ? fmtDate(a.published_at) : fmtDate(a.created_at)}
                </span>
              </td>
              {/* read_count */}
              <td className="px-3 py-3.5">
                <span className="text-xs tabular-nums" style={{ color: t.text3 }}>
                  {(a.read_count ?? 0).toLocaleString("fr-FR")}
                </span>
              </td>
              {/* actions */}
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => onEdit(a)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition opacity-0 group-hover:opacity-100 hover:opacity-70"
                    style={{ background: t.glass }}>
                    <Edit3 size={12} style={{ color: t.text2 }} />
                  </button>
                  {a.status === "published" && (
                    <Link href={`/blogs/${userId}/${a.slug}`} target="_blank"
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition opacity-0 group-hover:opacity-100 hover:opacity-70"
                      style={{ background: t.glass }}>
                      <ExternalLink size={12} style={{ color: t.text2 }} />
                    </Link>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition opacity-0 group-hover:opacity-100 hover:opacity-70"
                      style={{ background: t.glass }}>
                      <MoreHorizontal size={12} style={{ color: t.text2 }} />
                    </button>
                    <AnimatePresence>
                      {menuOpen === a.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 z-30 rounded-xl overflow-hidden w-36"
                          style={{ background: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${t.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
                          <button
                            onClick={() => { onEdit(a); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs transition hover:opacity-70"
                            style={{ color: t.text2 }}>
                            <Edit3 size={11} /> Modifier
                          </button>
                          <button
                            onClick={() => { onDelete(a.id); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs transition hover:opacity-70"
                            style={{ color: "#ef4444" }}>
                            <Trash2 size={11} /> Supprimer
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════ */
export default function BlogPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);

  const [userId,   setUserId]   = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("articles");

  /* filters */
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ArticleStatus>("all");
  const [sortOrder,    setSortOrder]    = useState<"newest" | "oldest" | "alpha">("newest");

  /* modals */
  const [showDjama,  setShowDjama]  = useState(false);
  const [editingArt, setEditingArt] = useState<Article | Partial<Article> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  /* load */
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase.from("blog_articles")
      .select("id, user_id, title, slug, content, excerpt, cover_url, tags, status, published_at, scheduled_at, category, seo_title, seo_description, seo_image_url, read_count, word_count, created_at, updated_at")
      .order("created_at", { ascending: false });
    setArticles((data ?? []) as Article[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* computed */
  const filtered = articles
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "alpha") return a.title.localeCompare(b.title);
      if (sortOrder === "oldest") return a.created_at.localeCompare(b.created_at);
      return b.created_at.localeCompare(a.created_at);
    });

  const counts = {
    published: articles.filter(a => a.status === "published").length,
    draft:     articles.filter(a => a.status === "draft" || a.status === "en_redaction").length,
  };

  function openNew() {
    setEditingArt({ title: "", slug: "", content: "", excerpt: "", tags: [], status: "draft" });
    setEditorOpen(true);
  }

  function openEdit(a: Article) {
    setEditingArt(a);
    setEditorOpen(true);
  }

  async function deleteArticle(id: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    await supabase.from("blog_articles").delete().eq("id", id);
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  function onSaved(a: Article) {
    setArticles(prev => {
      const idx = prev.findIndex(x => x.id === a.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = a; return next; }
      return [a, ...prev];
    });
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: t.text }}>Blog</h1>
            <p className="text-sm mt-1" style={{ color: t.text3 }}>
              Gérez votre contenu et développez votre audience.
              <span className="ml-3 text-xs" style={{ color: t.text4 }}>
                {counts.published} publié · {counts.draft} brouillon
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDjama(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28`, color: GOLD }}
            >
              <Sparkles size={14} />
              Créer avec DJAMA
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95"
              style={{ background: GOLD, color: "#111" }}
            >
              <Plus size={14} />
              Nouvel article
            </button>
          </div>
        </div>

        {/* ── tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.Icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition whitespace-nowrap"
                style={{
                  background: active ? `${GOLD}14` : "transparent",
                  color: active ? GOLD : t.text3,
                  border: `1px solid ${active ? GOLD + "28" : "transparent"}`,
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── tab content ──────────────────────────────────────────── */}
        {activeTab === "articles" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* search */}
              <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
                style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                <Search size={14} style={{ color: t.text4, flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un article…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: t.text }}
                />
                {search && (
                  <button onClick={() => setSearch("")}><X size={12} style={{ color: t.text4 }} /></button>
                )}
              </div>

              {/* status filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="appearance-none rounded-xl px-3 py-2 text-sm outline-none cursor-pointer pr-8"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                >
                  <option value="all">Tous les statuts</option>
                  {(Object.entries(STATUS_META) as [ArticleStatus, typeof STATUS_META[ArticleStatus]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.text3 }} />
              </div>

              {/* sort */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                  className="appearance-none rounded-xl px-3 py-2 text-sm outline-none cursor-pointer pr-8"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
                >
                  <option value="newest">Plus récents</option>
                  <option value="oldest">Plus anciens</option>
                  <option value="alpha">Alphabétique</option>
                </select>
                <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.text3 }} />
              </div>
            </div>

            {/* results count */}
            {!loading && (
              <p className="text-xs mb-3" style={{ color: t.text4 }}>
                {filtered.length} article{filtered.length !== 1 ? "s" : ""}
                {filterStatus !== "all" ? ` · ${STATUS_META[filterStatus as ArticleStatus]?.label}` : ""}
              </p>
            )}

            {/* table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
              <ArticlesTable
                articles={filtered}
                loading={loading}
                isDark={isDark}
                userId={userId}
                onEdit={openEdit}
                onDelete={deleteArticle}
              />
            </div>
          </motion.div>
        )}

        {activeTab === "calendrier" && <ComingSoon label="Calendrier éditorial" Icon={Calendar} isDark={isDark} />}
        {activeTab === "idees"      && <ComingSoon label="Idées de contenu"     Icon={Lightbulb} isDark={isDark} />}
        {activeTab === "seo"        && <ComingSoon label="Analyse SEO"          Icon={BarChart2} isDark={isDark} />}
        {activeTab === "analytics"  && <ComingSoon label="Analytics"            Icon={Eye}       isDark={isDark} />}
        {activeTab === "parametres" && <ComingSoon label="Paramètres du blog"   Icon={Settings}  isDark={isDark} />}

      </div>

      {/* ── modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDjama && (
          <CreateWithDjama
            isDark={isDark}
            userId={userId}
            onClose={() => setShowDjama(false)}
            onCreated={a => { onSaved(a); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editorOpen && editingArt !== null && (
          <ArticleEditor
            article={editingArt}
            userId={userId}
            isDark={isDark}
            onClose={() => { setEditorOpen(false); setEditingArt(null); }}
            onSaved={a => { onSaved(a); setEditingArt(a); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
