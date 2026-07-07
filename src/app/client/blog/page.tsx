"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Trash2, Save, X, Search, Loader2,
  Tag, Calendar, Eye, EyeOff, Star, FileText, Check,
  Edit3, ChevronRight, Hash, Sparkles, ImagePlus, Globe,
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
  const [userId, setUserId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ArticleStatus>("all");
  const [selected, setSelected] = useState<Article | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [mobilePanel, setMobilePanel] = useState<"list" | "editor">("list");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setMobilePanel("editor");
  };

  const openArticle = (a: Article) => {
    setSelected(a);
    setDraft({ title: a.title, content: a.content, excerpt: a.excerpt, tags: a.tags, status: a.status, slug: a.slug });
    setTagInput("");
    setMobilePanel("editor");
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
      user_id: userId,
      title: d.title ?? "",
      slug,
      content: d.content ?? "",
      excerpt: d.excerpt ?? "",
      tags: d.tags ?? [],
      status: d.status ?? "draft",
      published_at: d.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
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
    if (selected?.id === id) { setSelected(null); setDraft({}); }
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
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Génère un résumé/extrait de 2-3 phrases pour cet article de blog:\n\n${draft.content.slice(0, 2000)}` }),
      });
      const json = await res.json() as { result?: string };
      if (json.result) updateDraft({ excerpt: json.result });
    } catch {}
    setAiLoading(false);
  };

  const filtered = articles.filter(a => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const isEditing = draft.title !== undefined;
  const publishedCount = articles.filter(a => a.status === "published").length;
  const draftCount = articles.filter(a => a.status === "draft").length;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
        <Loader2 className="animate-spin text-[#c9a55a]" size={32} />
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-56px)] overflow-hidden ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 flex-col border-r border-white/6 bg-[#0d0e13] w-full md:w-72 ${mobilePanel === "editor" ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-5 border-b border-white/6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <BookOpen size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Blog</h1>
              <p className="text-[10px] text-white/30">{publishedCount} publié · {draftCount} brouillon</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-[#0d0e13] transition-all hover:brightness-110 active:scale-95"
            style={{ background: GOLD }}
          >
            <Plus size={13} /> Nouvel article
          </button>
        </div>

        {/* Search + filter */}
        <div className="p-3 space-y-2 border-b border-white/6">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "published", "draft"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${filterStatus === s ? "text-[#0d0e13]" : "text-white/30 bg-white/4 hover:bg-white/7"}`}
                style={filterStatus === s ? { background: GOLD } : {}}
              >
                {s === "all" ? "Tous" : s === "published" ? "Publié" : "Brouillon"}
              </button>
            ))}
          </div>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-xs">
              {search ? "Aucun résultat" : "Aucun article"}
            </div>
          ) : filtered.map(a => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => openArticle(a)}
              className={`w-full text-left p-3 rounded-xl transition-all group ${selected?.id === a.id ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-white/4 border border-transparent"}`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-medium text-white/80 line-clamp-2 leading-tight">{a.title || "Sans titre"}</span>
                <span className={`flex-shrink-0 mt-0.5 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${a.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/10 text-amber-400/70"}`}>
                  {a.status === "published" ? "Pub." : "Draft"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/25">
                <span>{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                {a.tags.length > 0 && <span>· {a.tags.slice(0, 2).join(", ")}</span>}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 flex-col overflow-hidden ${mobilePanel === "list" ? "hidden md:flex" : "flex"}`}>
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="p-5 rounded-2xl bg-amber-500/8 mb-4">
                <BookOpen size={36} style={{ color: GOLD }} />
              </div>
              <h2 className="text-lg font-semibold text-white/70 mb-2">Votre blog</h2>
              <p className="text-sm text-white/30 max-w-xs mb-6">
                Créez et gérez vos articles de blog. Partagez votre expertise, attirez des clients.
              </p>
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#0d0e13] hover:brightness-110 transition-all"
                style={{ background: GOLD }}
              >
                <Plus size={15} /> Nouvel article
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/6 bg-[#0d0e13]/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelected(null); setDraft({}); setMobilePanel("list"); }} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-all">
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${draft.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/10 text-amber-400/70"}`}>
                      {draft.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                    {selected && (
                      <span className="text-[10px] text-white/20">
                        {wordCount(draft.content ?? "")} mots · {readTime(draft.content ?? "")} min de lecture
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {draft.status === "draft" ? (
                    <button
                      onClick={() => updateDraft({ status: "published" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                    >
                      <Globe size={12} /> Publier
                    </button>
                  ) : (
                    <button
                      onClick={() => updateDraft({ status: "draft" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/6 text-white/40 hover:bg-white/10 transition-all"
                    >
                      <EyeOff size={12} /> Dépublier
                    </button>
                  )}
                  <button
                    onClick={() => void doSave()}
                    disabled={saving || !draft.title?.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-[#0d0e13] disabled:opacity-40 hover:brightness-110 transition-all"
                    style={{ background: GOLD }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                  {selected && (
                    <button
                      onClick={() => { if (confirm("Supprimer cet article ?")) void deleteArticle(selected.id); }}
                      disabled={deleting === selected.id}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
                  {/* Title */}
                  <textarea
                    value={draft.title ?? ""}
                    onChange={e => updateDraft({ title: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Titre de l'article..."
                    rows={1}
                    className="w-full bg-transparent text-2xl font-bold text-white/90 placeholder-white/15 outline-none resize-none leading-tight"
                    onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }}
                  />

                  {/* Slug */}
                  <div className="flex items-center gap-2">
                    <Hash size={11} className="text-white/20" />
                    <input
                      value={draft.slug ?? ""}
                      onChange={e => updateDraft({ slug: e.target.value })}
                      placeholder="url-de-l-article"
                      className="flex-1 bg-transparent text-xs text-white/25 placeholder-white/15 outline-none font-mono"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Extrait</label>
                      <button
                        onClick={generateExcerpt}
                        disabled={aiLoading || !draft.content?.trim()}
                        className="flex items-center gap-1 text-[10px] text-amber-400/60 hover:text-amber-400 transition-all disabled:opacity-30"
                      >
                        {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Générer avec IA
                      </button>
                    </div>
                    <textarea
                      value={draft.excerpt ?? ""}
                      onChange={e => updateDraft({ excerpt: e.target.value })}
                      placeholder="Court résumé affiché dans les listes et résultats de recherche..."
                      rows={2}
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 placeholder-white/15 outline-none focus:border-amber-500/30 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(draft.tags ?? []).map(t => (
                        <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-amber-500/10 text-amber-400/80">
                          <Tag size={9} />
                          {t}
                          <button onClick={() => removeTag(t)} className="ml-0.5 text-amber-400/40 hover:text-amber-400">
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
                        placeholder="Ajouter un tag..."
                        className="flex-1 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 outline-none focus:border-amber-500/30"
                      />
                      <button onClick={addTag} className="px-3 py-1.5 rounded-lg bg-white/6 text-white/40 hover:bg-white/10 text-xs transition-all">
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/6" />

                  {/* Content */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Contenu</label>
                    <textarea
                      value={draft.content ?? ""}
                      onChange={e => updateDraft({ content: e.target.value })}
                      placeholder="Rédigez votre article ici... Utilisez du Markdown pour la mise en forme."
                      className="w-full min-h-[400px] bg-transparent text-sm text-white/70 placeholder-white/15 outline-none resize-none leading-relaxed"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}
          >
            {toast.ok ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
