"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Trash2, Save, X, Search, Loader2,
  Tag, Eye, EyeOff, Check, Edit3, Hash, Sparkles, Globe,
  FileText, ArrowLeft, Copy, ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

type ArticleStatus = "draft" | "published";

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
  created_at: string;
  updated_at: string;
}

type Draft = Partial<Omit<Article, "id" | "user_id" | "created_at" | "updated_at">>;

const GOLD = "#c9a55a";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function readTime(text: string) {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
}

export default function BlogPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [userId,      setUserId]      = useState<string | null>(null);
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ArticleStatus>("all");
  const [selected,    setSelected]    = useState<Article | null>(null);
  const [draft,       setDraft]       = useState<Draft>({});
  const [mobileView,  setMobileView]  = useState<"list" | "editor">("list");
  const [tagInput,    setTagInput]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiContent,   setAiContent]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Theme vars ─────────────────────────────────────── */
  const bg      = isDark ? "bg-[#07080e]"                               : "bg-[#f4f5f9]";
  const sidebar  = isDark ? "bg-[#0d0e14] border-white/[0.06]"          : "bg-white border-black/[0.07]";
  const card     = isDark ? "border-white/[0.06] bg-white/[0.04]"       : "border-black/[0.07] bg-white shadow-sm";
  const cardHov  = isDark ? "hover:bg-white/[0.06]"                     : "hover:bg-black/[0.03]";
  const cardSel  = isDark ? "bg-amber-500/10 border-amber-500/25"       : "bg-amber-50 border-amber-200";
  const pri      = isDark ? "text-white"                                 : "text-[#0e1420]";
  const sec      = isDark ? "text-white/60"                              : "text-[#0e1420]/60";
  const mut      = isDark ? "text-white/35"                              : "text-[#0e1420]/40";
  const inp      = isDark
    ? "bg-white/[0.05] border-white/[0.08] text-white/70 placeholder-white/20 focus:border-amber-500/40"
    : "bg-black/[0.04] border-black/[0.08] text-[#0e1420]/80 placeholder-[#0e1420]/20 focus:border-amber-500/50";
  const toolbar  = isDark ? "bg-[#0d0e14]/80 border-white/[0.06]"       : "bg-white/90 border-black/[0.07] shadow-sm";
  const divider  = isDark ? "border-white/[0.06]"                       : "border-black/[0.07]";
  const editorBg = isDark ? "bg-[#07080e]"                              : "bg-[#f4f5f9]";

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUserId(user.id);
    const { data } = await supabase
      .from("blog_articles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    setSelected(null);
    setDraft({ title: "", content: "", excerpt: "", tags: [], status: "draft", slug: "" });
    setTagInput("");
    setMobileView("editor");
  };

  const openArticle = (a: Article) => {
    setSelected(a);
    setDraft({ title: a.title, content: a.content, excerpt: a.excerpt, tags: a.tags, status: a.status, slug: a.slug });
    setTagInput("");
    setMobileView("editor");
  };

  const closeEditor = () => {
    setSelected(null);
    setDraft({});
    setMobileView("list");
  };

  const autoSave = (updated: Draft) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doSave(updated, true), 2000);
  };

  const updateDraft = (patch: Partial<Draft>) => {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    if (selected) autoSave(updated);
  };

  const doSave = async (d: Draft = draft, silent = false) => {
    if (!userId || !d.title?.trim()) return;
    if (!silent) setSaving(true);
    const slug = d.slug?.trim() || slugify(d.title ?? "");
    const payload = {
      user_id:      userId,
      title:        d.title ?? "",
      slug,
      content:      d.content ?? "",
      excerpt:      d.excerpt ?? "",
      tags:         d.tags ?? [],
      status:       d.status ?? "draft",
      published_at: d.status === "published" ? new Date().toISOString() : null,
      updated_at:   new Date().toISOString(),
    };
    if (selected) {
      const { error } = await supabase.from("blog_articles").update(payload).eq("id", selected.id);
      if (!error) {
        setArticles(prev => prev.map(a => a.id === selected.id ? { ...a, ...payload } : a));
        setSelected(prev => prev ? { ...prev, ...payload } : prev);
        if (!silent) showToast("Article sauvegardé");
      } else if (!silent) showToast(error.message, false);
    } else {
      const { data, error } = await supabase.from("blog_articles").insert(payload).select().single();
      if (!error && data) {
        setArticles(prev => [data, ...prev]);
        setSelected(data);
        if (!silent) showToast("Article créé");
      } else if (!silent) showToast(error?.message ?? "Erreur", false);
    }
    if (!silent) setSaving(false);
  };

  const deleteArticle = async (id: string) => {
    setDeleting(id);
    await supabase.from("blog_articles").delete().eq("id", id);
    setArticles(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) closeEditor();
    setDeleting(null);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || draft.tags?.includes(t)) return;
    updateDraft({ tags: [...(draft.tags ?? []), t] });
    setTagInput("");
  };

  const removeTag = (t: string) => updateDraft({ tags: draft.tags?.filter(x => x !== t) ?? [] });

  const generateExcerpt = async () => {
    if (!draft.content?.trim()) return;
    setAiLoading(true);
    try {
      const res  = await fetch("/api/blog/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "excerpt", title: draft.title, content: draft.content }),
      });
      const json = await res.json() as { result?: string };
      if (json.result) updateDraft({ excerpt: json.result });
      else showToast("Erreur lors de la génération", false);
    } catch { showToast("Erreur réseau", false); }
    setAiLoading(false);
  };

  const generateContent = async () => {
    if (!draft.title?.trim()) return;
    setAiContent(true);
    try {
      const res  = await fetch("/api/blog/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "content", title: draft.title, tags: draft.tags }),
      });
      const json = await res.json() as { result?: string };
      if (json.result) { updateDraft({ content: json.result }); showToast("Article généré !"); }
      else showToast("Erreur lors de la génération", false);
    } catch { showToast("Erreur réseau", false); }
    setAiContent(false);
  };

  const filtered = articles.filter(a => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const isEditing      = draft.title !== undefined;
  const publishedCount = articles.filter(a => a.status === "published").length;
  const draftCount     = articles.filter(a => a.status === "draft").length;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${bg}`}>
        <Loader2 className="animate-spin" size={28} style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-56px)] overflow-hidden ${bg}`}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <div className={`flex-shrink-0 flex flex-col border-r w-full md:w-72 transition-all ${sidebar} ${mobileView === "editor" ? "hidden md:flex" : "flex"}`}>

        {/* Header */}
        <div className={`p-5 border-b ${divider}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{ background: `${GOLD}18`, borderColor: `${GOLD}35` }}>
                <BookOpen size={15} style={{ color: GOLD }} />
              </div>
              <div>
                <h1 className={`text-sm font-black ${pri}`}>Blog</h1>
                <p className={`text-[10px] ${mut}`}>{publishedCount} publié · {draftCount} brouillon</p>
              </div>
            </div>
          </div>
          <button onClick={openNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black transition-all hover:brightness-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }}>
            <Plus size={13} /> Nouvel article
          </button>
        </div>

        {/* Search + filters */}
        <div className={`p-3 space-y-2.5 border-b ${divider}`}>
          <div className="relative">
            <Search size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 ${mut}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className={`w-full rounded-xl border pl-8 pr-3 py-2 text-xs outline-none transition ${inp}`}
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "published", "draft"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                style={filterStatus === s
                  ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }
                  : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "rgba(14,20,32,0.35)" }}>
                {s === "all" ? "Tous" : s === "published" ? "Publié" : "Brouillon"}
              </button>
            ))}
          </div>
        </div>

        {/* Public blog share link */}
        {userId && (
          <div className={`p-3 border-b ${divider}`}>
            <p className={`text-[10px] font-semibold mb-2 flex items-center gap-1.5 ${mut}`}>
              <Globe size={10} /> Lien public du blog
            </p>
            <div className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 ${isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-black/[0.03]"}`}>
              <span className={`flex-1 text-[10px] truncate font-mono ${mut}`}>
                {typeof window !== "undefined" ? window.location.origin : ""}/blogs/{userId}
              </span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/blogs/${userId}`;
                  void navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Copier le lien"
                className={`flex-shrink-0 p-1 rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.07]"}`}>
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} style={{ color: GOLD }} />}
              </button>
              <a href={`/blogs/${userId}`} target="_blank" rel="noreferrer"
                title="Ouvrir le blog"
                className={`flex-shrink-0 p-1 rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.07]"}`}>
                <ExternalLink size={11} style={{ color: GOLD }} />
              </a>
            </div>
          </div>
        )}

        {/* Article list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
                <FileText size={20} style={{ color: GOLD, opacity: 0.6 }} />
              </div>
              <p className={`text-xs text-center ${mut}`}>
                {search ? "Aucun résultat" : "Aucun article pour l'instant"}
              </p>
            </motion.div>
          ) : filtered.map((a, i) => (
            <motion.button key={a.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openArticle(a)}
              className={`w-full text-left p-3 rounded-2xl border transition-all ${selected?.id === a.id ? cardSel : `border-transparent ${cardHov}`}`}>
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span className={`text-xs font-semibold line-clamp-2 leading-snug ${pri}`}>
                  {a.title || "Sans titre"}
                </span>
                <span className={`flex-shrink-0 mt-0.5 text-[9px] px-1.5 py-0.5 rounded-lg font-bold ${
                  a.status === "published"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : isDark ? "bg-amber-500/10 text-amber-400/70" : "bg-amber-100 text-amber-600"
                }`}>
                  {a.status === "published" ? "Pub." : "Draft"}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${mut}`}>
                <span>{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                {a.tags.length > 0 && <><span>·</span><span>{a.tags.slice(0, 2).join(", ")}</span></>}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ══ EDITOR ═══════════════════════════════════════════ */}
      <div className={`flex-1 flex-col overflow-hidden ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        <AnimatePresence mode="wait">

          {/* Empty state */}
          {!isEditing && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex-1 flex flex-col items-center justify-center text-center p-8 ${editorBg}`}>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
                style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
                <BookOpen size={36} style={{ color: GOLD, opacity: 0.7 }} />
              </div>
              <h2 className={`text-lg font-black mb-2 ${pri}`}>Votre blog</h2>
              <p className={`text-sm max-w-xs mb-6 ${mut}`}>
                Créez et gérez vos articles. Partagez votre expertise, attirez des clients.
              </p>
              <button onClick={openNew}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black hover:brightness-110 transition-all"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }}>
                <Plus size={15} /> Nouvel article
              </button>
            </motion.div>
          )}

          {/* Editor */}
          {isEditing && (
            <motion.div key="editor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex-1 flex flex-col overflow-hidden ${editorBg}`}>

              {/* Toolbar */}
              <div className={`flex items-center justify-between px-5 py-3 border-b backdrop-blur-sm ${toolbar}`}>
                <div className="flex items-center gap-3">
                  <button onClick={closeEditor}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-all ${mut} ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
                    <ArrowLeft size={13} /> <span className="hidden sm:inline">Retour</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                      draft.status === "published"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-600"
                    }`}>
                      {draft.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                    {draft.content && (
                      <span className={`hidden sm:block text-[10px] ${mut}`}>
                        {wordCount(draft.content ?? "")} mots · {readTime(draft.content ?? "")} min
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {draft.status === "draft" ? (
                    <button onClick={() => updateDraft({ status: "published" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/12 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                      <Globe size={12} /> Publier
                    </button>
                  ) : (
                    <button onClick={() => updateDraft({ status: "draft" })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${mut} ${isDark ? "bg-white/[0.05] hover:bg-white/[0.09]" : "bg-black/[0.05] hover:bg-black/[0.09]"}`}>
                      <EyeOff size={12} /> Dépublier
                    </button>
                  )}

                  <button onClick={() => void doSave()} disabled={saving || !draft.title?.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black disabled:opacity-40 hover:brightness-110 transition-all"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }}>
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {saving ? "…" : "Sauvegarder"}
                  </button>

                  {selected && (
                    <button
                      onClick={() => { if (confirm("Supprimer cet article ?")) void deleteArticle(selected.id); }}
                      disabled={deleting === selected.id}
                      className={`p-1.5 rounded-xl transition-all ${mut} ${isDark ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-red-50 hover:text-red-500"}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

                  {/* Title */}
                  <textarea
                    value={draft.title ?? ""}
                    onChange={e => updateDraft({ title: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Titre de l'article…"
                    rows={1}
                    className={`w-full bg-transparent text-2xl font-black placeholder-opacity-20 outline-none resize-none leading-tight ${pri} ${isDark ? "placeholder-white/15" : "placeholder-[#0e1420]/15"}`}
                    onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }}
                  />

                  {/* Slug */}
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"}`}>
                    <Hash size={11} className={mut} />
                    <input
                      value={draft.slug ?? ""}
                      onChange={e => updateDraft({ slug: e.target.value })}
                      placeholder="url-de-l-article"
                      className={`flex-1 bg-transparent text-xs outline-none font-mono ${mut}`}
                    />
                  </div>

                  <div className={`border-t ${divider}`} />

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${mut}`}>Extrait SEO</label>
                      <button onClick={generateExcerpt} disabled={aiLoading || !draft.content?.trim()}
                        className="flex items-center gap-1 text-[10px] font-semibold transition-all disabled:opacity-30"
                        style={{ color: GOLD }}>
                        {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Générer avec IA
                      </button>
                    </div>
                    <textarea
                      value={draft.excerpt ?? ""}
                      onChange={e => updateDraft({ excerpt: e.target.value })}
                      placeholder="Court résumé affiché dans les résultats de recherche…"
                      rows={2}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition ${inp}`}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${mut}`}>Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(draft.tags ?? []).map(t => (
                        <span key={t} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                          #{t}
                          <button onClick={() => removeTag(t)} className="ml-0.5 opacity-50 hover:opacity-100">
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                        placeholder="Ajouter un tag…"
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none transition ${inp}`}
                      />
                      <button onClick={addTag}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]" : "bg-black/[0.05] text-[#0e1420]/40 hover:bg-black/[0.09]"}`}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className={`border-t ${divider}`} />

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${mut}`}>Contenu</label>
                      <button onClick={generateContent} disabled={aiContent || !draft.title?.trim()}
                        className="flex items-center gap-1 text-[10px] font-semibold transition-all disabled:opacity-30"
                        style={{ color: GOLD }}>
                        {aiContent ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        {aiContent ? "Génération…" : "Générer avec IA"}
                      </button>
                    </div>

                    {aiContent && (
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${isDark ? "bg-amber-500/5 border-amber-500/15 text-amber-400/70" : "bg-amber-50 border-amber-200 text-amber-600"} text-xs`}>
                        <Loader2 size={12} className="animate-spin" />
                        Rédaction de l&apos;article en cours…
                      </div>
                    )}

                    <textarea
                      value={draft.content ?? ""}
                      onChange={e => updateDraft({ content: e.target.value })}
                      placeholder="Rédigez votre article ici… Markdown supporté."
                      className={`w-full min-h-[380px] bg-transparent text-sm outline-none resize-none leading-relaxed ${sec} ${isDark ? "placeholder-white/12" : "placeholder-[#0e1420]/15"}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-xl border ${
              toast.ok
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                : "bg-red-500/15 text-red-400 border-red-500/20"
            }`}>
            {toast.ok ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
