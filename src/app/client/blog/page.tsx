"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Trash2, Save, X, Search, Loader2,
  Eye, EyeOff, Calendar, Tag, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

const ease = [0.16, 1, 0.3, 1] as const;

interface Article {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  contenu: string;
  image_url: string | null;
  categorie: string;
  tags: string[];
  published: boolean;
  published_at: string;
  created_at: string;
}

const CATS = ["Conseils", "Outils", "Actualités", "Témoignages", "Guides"];

function slugify(str: string) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

const EMPTY_ARTICLE = (): Omit<Article, "id" | "created_at"> => ({
  titre:        "",
  slug:         "",
  extrait:      "",
  contenu:      "",
  image_url:    null,
  categorie:    CATS[0],
  tags:         [],
  published:    false,
  published_at: new Date().toISOString().slice(0, 10),
});

export default function BlogAdminPage() {
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [selected,    setSelected]    = useState<Article | null>(null);
  const [draft,       setDraft]       = useState<Omit<Article, "id"|"created_at"> | null>(null);
  const [loadingAll,  setLoadingAll]  = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [query,       setQuery]       = useState("");
  const [mobileView,  setMobileView]  = useState<"list"|"editor">("list");
  const [toast,       setToast]       = useState<ToastData | null>(null);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [tagInput,    setTagInput]    = useState("");

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg } as ToastData);
  }

  const fetchArticles = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase
      .from("blog_articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setArticles((data ?? []) as Article[]);
    setLoadingAll(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  function openArticle(a: Article) {
    setSelected(a);
    setDraft({
      titre:        a.titre,
      slug:         a.slug,
      extrait:      a.extrait  || "",
      contenu:      a.contenu  || "",
      image_url:    a.image_url,
      categorie:    a.categorie || CATS[0],
      tags:         a.tags      || [],
      published:    a.published,
      published_at: a.published_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    });
    setDirty(false);
    setMobileView("editor");
  }

  function newArticle() {
    setSelected(null);
    setDraft(EMPTY_ARTICLE());
    setDirty(true);
    setMobileView("editor");
  }

  function upd(k: keyof Omit<Article, "id" | "created_at">, v: unknown) {
    setDraft(d => d ? { ...d, [k]: v } : d);
    setDirty(true);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || draft?.tags.includes(t)) return;
    upd("tags", [...(draft?.tags ?? []), t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("error", "Non connecté"); setSaving(false); return; }

    const payload = {
      ...draft,
      slug: draft.slug || slugify(draft.titre),
      user_id: user.id,
    };

    if (selected) {
      const { error } = await supabase.from("blog_articles").update(payload).eq("id", selected.id);
      if (error) { showToast("error", error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("blog_articles").insert(payload);
      if (error) { showToast("error", error.message); setSaving(false); return; }
    }

    showToast("success", "Article enregistré ✓");
    setDirty(false);
    setSaving(false);
    await fetchArticles();
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    await supabase.from("blog_articles").delete().eq("id", selected.id);
    setDeleting(false);
    setConfirmDel(false);
    setSelected(null); setDraft(null); setMobileView("list");
    showToast("success", "Article supprimé");
    await fetchArticles();
  }

  const filtered = articles.filter(a =>
    !query || a.titre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-[#080a0f] min-h-screen">
      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[130px]" />
      </div>

      {/* Sub-header */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)]">
              <BookOpen size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Blog & Actualités</h1>
              <p className="text-[0.65rem] text-white/30">{articles.length} article{articles.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={newArticle}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:opacity-90">
            <Plus size={13} /> Nouvel article
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-5 px-5 py-5">
        {/* Liste */}
        <aside className={`flex w-full flex-col border-r border-white/6 sm:w-[280px] sm:flex-none sm:rounded-[1.5rem] sm:border sm:border-white/8 bg-[rgba(15,17,23,0.6)] ${mobileView === "editor" ? "hidden sm:flex" : "flex"}`}>
          <div className="border-b border-white/6 p-4">
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…"
                className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingAll ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-white/20" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <BookOpen size={22} className="text-white/15" />
                <p className="text-sm text-white/25">Aucun article</p>
              </div>
            ) : (
              filtered.map(a => (
                <button key={a.id} onClick={() => openArticle(a)}
                  className={`w-full border-b border-white/5 px-4 py-3.5 text-left transition hover:bg-white/4 ${selected?.id === a.id ? "bg-white/6" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-widest text-white/30">
                      <Tag size={9} />{a.categorie || "—"}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.55rem] font-bold ${
                      a.published ? "bg-emerald-500/12 text-emerald-400" : "bg-white/8 text-white/30"
                    }`}>
                      {a.published ? <Eye size={8}/> : <EyeOff size={8}/>}
                      {a.published ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white/90 line-clamp-2">{a.titre || "(sans titre)"}</p>
                  <p className="mt-0.5 text-[0.62rem] text-white/30">
                    {new Date(a.published_at || a.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Éditeur */}
        <main className={`flex flex-1 flex-col overflow-hidden ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
          {!draft ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.4)] p-8 text-center">
              <BookOpen size={28} style={{ color: "#c9a55a" }} />
              <p className="text-base font-bold text-white">Sélectionnez ou créez un article</p>
              <button onClick={newArticle}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-sm font-extrabold text-[#0a0a0a]">
                <Plus size={14} /> Nouvel article
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden rounded-none bg-[rgba(15,17,23,0.6)] sm:rounded-[1.5rem] sm:border sm:border-white/8">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/6 px-5 py-3">
                <button onClick={() => setMobileView("list")} className="text-xs text-white/40 hover:text-white/70 sm:hidden">
                  <ArrowLeft size={13} />
                </button>
                {/* Published toggle */}
                <button
                  onClick={() => upd("published", !draft.published)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    draft.published
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
                  }`}
                >
                  {draft.published ? <Eye size={11} /> : <EyeOff size={11} />}
                  {draft.published ? "Publié" : "Brouillon"}
                </button>
                {dirty && (
                  <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-2.5 py-1 text-[0.6rem] font-semibold text-[#c9a55a] sm:inline-flex">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a55a]" /> Non sauvegardé
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {selected && (
                    <button onClick={() => setConfirmDel(true)} disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:text-red-400">
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !dirty}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-4 py-2 text-xs font-extrabold text-[#0a0a0a] shadow-[0_2px_12px_rgba(201,165,90,0.3)] transition hover:opacity-90 disabled:opacity-40">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
                <div className="mx-auto max-w-3xl space-y-5">
                  {/* Titre */}
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Titre *</label>
                    <input
                      value={draft.titre}
                      onChange={e => { upd("titre", e.target.value); if (!selected) upd("slug", slugify(e.target.value)); }}
                      placeholder="Titre de l'article"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]"
                    />
                  </div>

                  {/* Slug + Catégorie */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Slug URL</label>
                      <input value={draft.slug} onChange={e => upd("slug", e.target.value)}
                        placeholder="mon-article"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white/75 placeholder:text-white/20 outline-none transition hover:border-white/20" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Catégorie</label>
                      <select value={draft.categorie} onChange={e => upd("categorie", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition hover:border-white/20">
                        {CATS.map(c => <option key={c} value={c} style={{ background: "#0f1117" }}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Date + Image URL */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                        <Calendar size={9} className="mr-1 inline-block" /> Date de publication
                      </label>
                      <input type="date" value={draft.published_at} onChange={e => upd("published_at", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition hover:border-white/20" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">URL de l'image</label>
                      <input value={draft.image_url || ""} onChange={e => upd("image_url", e.target.value || null)}
                        placeholder="https://…"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white/75 placeholder:text-white/20 outline-none transition hover:border-white/20" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      <Tag size={9} className="mr-1 inline-block" /> Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {draft.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/65">
                          {t}
                          <button onClick={() => upd("tags", draft.tags.filter(x => x !== t))} className="ml-0.5 text-white/30 hover:text-red-400">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTag()}
                        placeholder="Ajouter un tag…"
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20" />
                      <button onClick={addTag}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/40 transition hover:border-white/20 hover:text-white/65">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Extrait */}
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Extrait / Description</label>
                    <textarea value={draft.extrait} onChange={e => upd("extrait", e.target.value)} rows={3}
                      placeholder="Courte description affichée dans les listings…"
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]" />
                  </div>

                  {/* Contenu */}
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Contenu (Markdown / HTML)</label>
                    <textarea value={draft.contenu} onChange={e => upd("contenu", e.target.value)} rows={18}
                      placeholder="Rédigez votre article ici…"
                      className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 font-mono text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(201,165,90,0.4)]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.93, y:16, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
              exit={{ scale:0.95, y:8, opacity:0 }} transition={{ duration:0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6">
              <Trash2 size={18} className="mb-3 text-red-400" />
              <h3 className="text-base font-extrabold text-white">Supprimer cet article ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmDel(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60">Annuler</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50">
                  {deleting && <Loader2 size={13} className="animate-spin" />} Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
