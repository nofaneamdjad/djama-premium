"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ToggleRight, ToggleLeft,
  Check, X, Film, Upload, Link as LinkIcon, Search,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import type { VideoProjectRow, VideoCategory, VideoStatus } from "@/types/db";

const ACCENT = "#e11d48";
const BUCKET = "video-projects";

const CATEGORY_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: "reels",     label: "Reels Instagram" },
  { value: "tiktok",   label: "TikTok" },
  { value: "shorts",   label: "YouTube Shorts" },
  { value: "youtube",  label: "YouTube (long format)" },
  { value: "pub",      label: "Vidéo publicitaire" },
  { value: "teaser",   label: "Teaser" },
  { value: "corporate",label: "Corporate / Institutionnel" },
  { value: "evenement",label: "Aftermovie / Événement" },
  { value: "produit",  label: "Présentation produit" },
  { value: "autre",    label: "Autre" },
];

const FORMAT_OPTIONS = ["9:16", "16:9", "1:1", "4:3", "4:5", "21:9"];

type Toast = { id: number; msg: string; ok: boolean };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (msg: string, ok = true) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, add };
}

type ModalData = {
  id?: string;
  title: string;
  category: VideoCategory;
  description: string;
  thumbnail_url: string;
  video_url: string;
  format: string;
  client: string;
  status: VideoStatus;
  sort_order: number;
};

const EMPTY: ModalData = {
  title: "", category: "reels", description: "",
  thumbnail_url: "", video_url: "", format: "16:9",
  client: "", status: "published", sort_order: 0,
};

export default function AdminMontageVideoPage() {
  const [projects, setProjects]   = useState<VideoProjectRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<ModalData | null>(null);
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, add } = useToasts();

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from("video_projects").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      setProjects((data ?? []) as VideoProjectRow[]);
    } catch { add("Erreur de chargement", false); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setModal({ ...EMPTY, sort_order: projects.length }); }
  function openEdit(p: VideoProjectRow) {
    setModal({
      id: p.id, title: p.title, category: p.category,
      description: p.description ?? "", thumbnail_url: p.thumbnail_url ?? "",
      video_url: p.video_url ?? "", format: p.format ?? "16:9",
      client: p.client ?? "", status: p.status, sort_order: p.sort_order,
    });
  }

  async function handleUpload(file: File) {
    if (!modal) return;
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `thumbnails/${Date.now()}.${ext}`;
      const { error } = await getSupabase().storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
      setModal(m => m ? { ...m, thumbnail_url: data.publicUrl } : m);
      add("Miniature uploadée");
    } catch { add("Erreur upload", false); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    if (!modal || !modal.title || !modal.category) return;
    setSaving(true);
    try {
      const payload = {
        title: modal.title, category: modal.category,
        description: modal.description || null,
        thumbnail_url: modal.thumbnail_url || null,
        video_url: modal.video_url || null,
        format: modal.format || null,
        client: modal.client || null,
        status: modal.status, sort_order: modal.sort_order,
      };
      if (modal.id) {
        await getSupabase().from("video_projects").update(payload).eq("id", modal.id);
        add("Projet mis à jour");
      } else {
        await getSupabase().from("video_projects").insert(payload);
        add("Projet ajouté");
      }
      setModal(null);
      load();
    } catch { add("Erreur lors de la sauvegarde", false); }
    finally { setSaving(false); }
  }

  async function handleToggle(p: VideoProjectRow) {
    const next: VideoStatus = p.status === "published" ? "draft" : "published";
    try {
      await getSupabase().from("video_projects").update({ status: next }).eq("id", p.id);
      setProjects(ps => ps.map(x => x.id === p.id ? { ...x, status: next } : x));
      add(next === "published" ? "Publié" : "Mis en brouillon");
    } catch { add("Erreur", false); }
  }

  async function handleDelete(id: string) {
    try {
      await getSupabase().from("video_projects").delete().eq("id", id);
      setProjects(ps => ps.filter(x => x.id !== id));
      add("Projet supprimé");
    } catch { add("Erreur suppression", false); }
    finally { setConfirmDelete(null); }
  }

  async function handleReorder(id: string, dir: "up" | "down") {
    const idx = projects.findIndex(p => p.id === id);
    if (idx < 0) return;
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === projects.length - 1) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    const updated = [...projects];
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    const reindexed = updated.map((p, i) => ({ ...p, sort_order: i }));
    setProjects(reindexed);
    try {
      await Promise.all(reindexed.map(p =>
        getSupabase().from("video_projects").update({ sort_order: p.sort_order }).eq("id", p.id)
      ));
    } catch { add("Erreur réordonnancement", false); load(); }
  }

  const displayed = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto"
            style={{
              background:  t.ok ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)",
              borderColor: t.ok ? "rgba(74,222,128,.3)" : "rgba(248,113,113,.3)",
              color:       t.ok ? "#4ade80"              : "#f87171",
            }}>
            {t.ok ? <Check size={14} /> : <X size={14} />} {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Projets vidéo</h1>
          <p className="text-sm text-white/40 mt-0.5">Portfolio montage vidéo affiché sur la page de service</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg,#c11d48,${ACCENT})` }}>
          <Plus size={15} /> Ajouter un projet
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2.5">
        <Search size={14} className="text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou catégorie…"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[.05]" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-white/[.07] bg-white/[.03] py-16 text-center">
          <Film size={28} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40">{search ? "Aucun résultat" : "Aucun projet vidéo — ajoutez-en un !"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((p, idx) => (
            <div key={p.id}
              className="flex items-center gap-4 rounded-xl border border-white/[.07] bg-white/[.04] px-4 py-3 transition-all hover:bg-white/[.07]">
              {/* Thumbnail */}
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg"
                style={{ background: "rgba(225,29,72,.1)", border: "1px solid rgba(255,255,255,.06)" }}>
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film size={14} className="text-white/20" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                    style={{ background: "rgba(225,29,72,.15)", color: ACCENT }}>
                    {CATEGORY_OPTIONS.find(c => c.value === p.category)?.label ?? p.category}
                  </span>
                  {p.format && (
                    <span className="text-[10px] text-white/35 border border-white/[.1] rounded px-1.5 py-0.5">{p.format}</span>
                  )}
                  {p.client && (
                    <span className="text-[10px] text-white/30">{p.client}</span>
                  )}
                </div>
              </div>
              {/* Status toggle */}
              <button onClick={() => handleToggle(p)} className="shrink-0 transition-opacity hover:opacity-80">
                {p.status === "published"
                  ? <ToggleRight size={22} style={{ color: ACCENT }} />
                  : <ToggleLeft size={22} className="text-white/30" />}
              </button>
              <span className={`hidden text-[10px] font-medium sm:block ${p.status === "published" ? "text-green-400" : "text-white/30"}`}>
                {p.status === "published" ? "Publié" : "Brouillon"}
              </span>
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleReorder(p.id, "up")} disabled={idx === 0}
                  className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => handleReorder(p.id, "down")} disabled={idx === displayed.length - 1}
                  className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                  <ArrowDown size={12} />
                </button>
              </div>
              {/* Actions */}
              <button onClick={() => openEdit(p)}
                className="rounded-lg border border-white/[.08] p-2 text-white/50 transition-all hover:border-white/20 hover:text-white">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDelete(p.id)}
                className="rounded-lg border border-red-500/20 p-2 text-red-400/60 transition-all hover:border-red-500/40 hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.78)" }}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[.1] shadow-2xl"
            style={{ background: "#0f0f14" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[.08] px-5 py-4">
              <h2 className="text-base font-bold text-white">{modal.id ? "Modifier le projet" : "Nouveau projet vidéo"}</h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Titre *</label>
                <input value={modal.title} onChange={e => setModal(m => m ? { ...m, title: e.target.value } : m)}
                  placeholder="ex. Aftermovie Soirée Entreprise 2024"
                  className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(225,29,72,.5)]" />
              </div>
              {/* Category + Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Catégorie *</label>
                  <select value={modal.category}
                    onChange={e => setModal(m => m ? { ...m, category: e.target.value as VideoCategory } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-[#111115] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(225,29,72,.5)] [&>option]:bg-[#111115]">
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Format</label>
                  <select value={modal.format}
                    onChange={e => setModal(m => m ? { ...m, format: e.target.value } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-[#111115] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(225,29,72,.5)] [&>option]:bg-[#111115]">
                    {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              {/* Client */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Client (optionnel)</label>
                <input value={modal.client} onChange={e => setModal(m => m ? { ...m, client: e.target.value } : m)}
                  placeholder="Nom du client ou de la marque"
                  className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(225,29,72,.5)]" />
              </div>
              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Description (optionnel)</label>
                <textarea value={modal.description}
                  onChange={e => setModal(m => m ? { ...m, description: e.target.value } : m)}
                  placeholder="Courte description du projet…" rows={2}
                  className="w-full resize-none rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(225,29,72,.5)]" />
              </div>
              {/* Thumbnail */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Miniature (thumbnail)</label>
                {modal.thumbnail_url ? (
                  <div className="relative mb-2 overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
                    <img src={modal.thumbnail_url} alt="thumbnail" className="h-full w-full object-cover" />
                    <button onClick={() => setModal(m => m ? { ...m, thumbnail_url: "" } : m)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/80 hover:text-white transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/[.15] py-2.5 text-xs text-white/50 transition-all hover:border-white/30 hover:text-white/80 disabled:opacity-50">
                    <Upload size={13} /> {uploading ? "Upload…" : "Upload image"}
                  </button>
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.05] px-3 py-2.5">
                    <LinkIcon size={12} className="shrink-0 text-white/30" />
                    <input value={modal.thumbnail_url}
                      onChange={e => setModal(m => m ? { ...m, thumbnail_url: e.target.value } : m)}
                      placeholder="ou coller une URL"
                      className="w-full bg-transparent text-xs text-white placeholder-white/25 outline-none" />
                  </div>
                </div>
              </div>
              {/* Video URL */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">URL vidéo (YouTube, Vimeo, Drive…)</label>
                <div className="flex items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5">
                  <LinkIcon size={13} className="shrink-0 text-white/30" />
                  <input value={modal.video_url}
                    onChange={e => setModal(m => m ? { ...m, video_url: e.target.value } : m)}
                    placeholder="https://youtube.com/watch?v=…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                </div>
              </div>
              {/* Status + sort */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Statut</label>
                  <select value={modal.status}
                    onChange={e => setModal(m => m ? { ...m, status: e.target.value as VideoStatus } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-[#111115] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(225,29,72,.5)] [&>option]:bg-[#111115]">
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Ordre</label>
                  <input type="number" min={0} value={modal.sort_order}
                    onChange={e => setModal(m => m ? { ...m, sort_order: Number(e.target.value) } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white outline-none focus:border-[rgba(225,29,72,.5)]" />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex gap-3 border-t border-white/[.08] px-5 py-4">
              <button onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/[.1] py-2.5 text-sm text-white/60 transition-all hover:border-white/20 hover:text-white">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || !modal.title}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg,#c11d48,${ACCENT})` }}>
                {saving ? "Enregistrement…" : modal.id ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.8)" }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[.1] p-6 shadow-2xl" style={{ background: "#0f0f14" }}>
            <h3 className="mb-2 text-base font-bold text-white">Supprimer ce projet ?</h3>
            <p className="mb-5 text-sm text-white/50">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-white/[.1] py-2.5 text-sm text-white/60 transition-all hover:text-white">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
