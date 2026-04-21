"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ToggleRight, ToggleLeft,
  Check, X, Camera, Upload, Link as LinkIcon, Search,
  ArrowUp, ArrowDown, Image,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import type { PhotoRetouchRow, PhotoRetouchCategory, PhotoRetouchStatus } from "@/types/db";

const ACCENT = "#ec4899";
const BUCKET = "photo-retouches";

const CATEGORY_OPTIONS: { value: PhotoRetouchCategory; label: string }[] = [
  { value: "portrait",    label: "Portrait" },
  { value: "beaute",      label: "Retouche beauté" },
  { value: "produit",     label: "Photo produit" },
  { value: "ecommerce",   label: "E-commerce" },
  { value: "pub",         label: "Visuel publicitaire" },
  { value: "detourage",   label: "Détourage / fond transparent" },
  { value: "amelioration",label: "Amélioration qualité" },
  { value: "couleur",     label: "Correction couleur / lumière" },
  { value: "impression",  label: "Préparation impression / web" },
  { value: "autre",       label: "Autre" },
];

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
  category: PhotoRetouchCategory;
  description: string;
  before_url: string;
  after_url: string;
  client: string;
  status: PhotoRetouchStatus;
  sort_order: number;
};

const EMPTY: ModalData = {
  title: "", category: "produit", description: "",
  before_url: "", after_url: "", client: "",
  status: "published", sort_order: 0,
};

export default function AdminRetouchePhotoPage() {
  const [projects, setProjects]   = useState<PhotoRetouchRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<ModalData | null>(null);
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<"before" | "after" | null>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef  = useRef<HTMLInputElement>(null);
  const { toasts, add } = useToasts();

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from("photo_retouches").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      setProjects((data ?? []) as PhotoRetouchRow[]);
    } catch { add("Erreur de chargement", false); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setModal({ ...EMPTY, sort_order: projects.length }); }
  function openEdit(p: PhotoRetouchRow) {
    setModal({
      id: p.id, title: p.title, category: p.category,
      description: p.description ?? "", before_url: p.before_url ?? "",
      after_url: p.after_url, client: p.client ?? "",
      status: p.status, sort_order: p.sort_order,
    });
  }

  async function handleUpload(file: File, field: "before" | "after") {
    if (!modal) return;
    setUploadingField(field);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${field}/${Date.now()}.${ext}`;
      const { error } = await getSupabase().storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl;
      setModal(m => m ? { ...m, [field === "before" ? "before_url" : "after_url"]: url } : m);
      add(`Image ${field === "before" ? "avant" : "après"} uploadée`);
    } catch { add("Erreur upload", false); }
    finally { setUploadingField(null); }
  }

  async function handleSave() {
    if (!modal || !modal.title || !modal.after_url) return;
    setSaving(true);
    try {
      const payload = {
        title: modal.title, category: modal.category,
        description: modal.description || null,
        before_url: modal.before_url || null,
        after_url: modal.after_url,
        client: modal.client || null,
        status: modal.status, sort_order: modal.sort_order,
      };
      if (modal.id) {
        await getSupabase().from("photo_retouches").update(payload).eq("id", modal.id);
        add("Projet mis à jour");
      } else {
        await getSupabase().from("photo_retouches").insert(payload);
        add("Projet ajouté");
      }
      setModal(null);
      load();
    } catch { add("Erreur lors de la sauvegarde", false); }
    finally { setSaving(false); }
  }

  async function handleToggle(p: PhotoRetouchRow) {
    const next: PhotoRetouchStatus = p.status === "published" ? "draft" : "published";
    try {
      await getSupabase().from("photo_retouches").update({ status: next }).eq("id", p.id);
      setProjects(ps => ps.map(x => x.id === p.id ? { ...x, status: next } : x));
      add(next === "published" ? "Publié" : "Mis en brouillon");
    } catch { add("Erreur", false); }
  }

  async function handleDelete(id: string) {
    try {
      await getSupabase().from("photo_retouches").delete().eq("id", id);
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
        getSupabase().from("photo_retouches").update({ sort_order: p.sort_order }).eq("id", p.id)
      ));
    } catch { add("Erreur réordonnancement", false); load(); }
  }

  const displayed = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Composant upload image ── */
  function ImageUploadField({
    label, value, onChange, fileRef, field,
  }: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    fileRef: React.RefObject<HTMLInputElement | null>;
    field: "before" | "after";
  }) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
        {value ? (
          <div className="relative mb-2 overflow-hidden rounded-xl" style={{ aspectRatio: "4/3" }}>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <button onClick={() => onChange("")}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/80 hover:text-white transition-colors">
              <X size={13} />
            </button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, field); }} />
          <button onClick={() => fileRef.current?.click()}
            disabled={uploadingField === field}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/[.15] py-2.5 text-xs text-white/50 transition-all hover:border-white/30 hover:text-white/80 disabled:opacity-50">
            <Upload size={12} /> {uploadingField === field ? "Upload…" : "Upload image"}
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.05] px-3 py-2.5">
            <LinkIcon size={11} className="shrink-0 text-white/30" />
            <input value={value} onChange={e => onChange(e.target.value)}
              placeholder="ou URL directe"
              className="w-full bg-transparent text-xs text-white placeholder-white/25 outline-none" />
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-extrabold text-white">Retouche photo</h1>
          <p className="text-sm text-white/40 mt-0.5">Portfolio avant/après et galerie affichés sur la page de service</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg,#be185d,${ACCENT})` }}>
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
          <Camera size={28} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40">{search ? "Aucun résultat" : "Aucun projet — ajoutez-en un !"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((p, idx) => (
            <div key={p.id}
              className="flex items-center gap-4 rounded-xl border border-white/[.07] bg-white/[.04] px-4 py-3 transition-all hover:bg-white/[.07]">
              {/* Thumbnail après */}
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg"
                style={{ background: "rgba(236,72,153,.08)", border: "1px solid rgba(255,255,255,.06)" }}>
                <img src={p.after_url} alt={p.title} className="h-full w-full object-cover" />
                {p.before_url && (
                  <div className="absolute left-0.5 top-0.5 rounded px-1 text-[6px] font-bold text-white"
                    style={{ background: `rgba(236,72,153,.8)` }}>A/A</div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                    style={{ background: "rgba(236,72,153,.15)", color: ACCENT }}>
                    {CATEGORY_OPTIONS.find(c => c.value === p.category)?.label ?? p.category}
                  </span>
                  {p.client && <span className="text-[10px] text-white/30">{p.client}</span>}
                  {p.before_url && (
                    <span className="text-[9px] text-white/30 border border-white/[.1] rounded px-1.5 py-0.5">Avant/Après</span>
                  )}
                </div>
              </div>
              {/* Toggle status */}
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
          style={{ background: "rgba(0,0,0,.8)" }}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[.1] shadow-2xl"
            style={{ background: "#0f0f14" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[.08] px-5 py-4">
              <h2 className="text-base font-bold text-white">{modal.id ? "Modifier le projet" : "Nouveau projet retouche"}</h2>
              <button onClick={() => setModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="max-h-[72vh] overflow-y-auto p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Titre *</label>
                <input value={modal.title} onChange={e => setModal(m => m ? { ...m, title: e.target.value } : m)}
                  placeholder="ex. Portrait corporate — Cabinet d'avocats"
                  className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(236,72,153,.5)]" />
              </div>
              {/* Category + Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Catégorie *</label>
                  <select value={modal.category}
                    onChange={e => setModal(m => m ? { ...m, category: e.target.value as PhotoRetouchCategory } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-[#111115] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(236,72,153,.5)] [&>option]:bg-[#111115]">
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Client (optionnel)</label>
                  <input value={modal.client} onChange={e => setModal(m => m ? { ...m, client: e.target.value } : m)}
                    placeholder="Nom du client"
                    className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(236,72,153,.5)]" />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Description (optionnel)</label>
                <textarea value={modal.description}
                  onChange={e => setModal(m => m ? { ...m, description: e.target.value } : m)}
                  placeholder="Contexte de la retouche, technique utilisée…" rows={2}
                  className="w-full resize-none rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[rgba(236,72,153,.5)]" />
              </div>

              {/* Image APRÈS (obligatoire) */}
              <ImageUploadField
                label="Image retouchée — APRÈS * (obligatoire)"
                value={modal.after_url}
                onChange={url => setModal(m => m ? { ...m, after_url: url } : m)}
                fileRef={afterFileRef}
                field="after"
              />

              {/* Image AVANT (optionnel — active slider) */}
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <label className="text-xs font-medium text-white/60">Image brute — AVANT (optionnel)</label>
                  <span className="rounded-full border border-white/[.1] px-2 py-0.5 text-[9px] text-white/35">Active le slider comparaison</span>
                </div>
                <ImageUploadField
                  label=""
                  value={modal.before_url}
                  onChange={url => setModal(m => m ? { ...m, before_url: url } : m)}
                  fileRef={beforeFileRef}
                  field="before"
                />
              </div>

              {/* Status + Ordre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Statut</label>
                  <select value={modal.status}
                    onChange={e => setModal(m => m ? { ...m, status: e.target.value as PhotoRetouchStatus } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-[#111115] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(236,72,153,.5)] [&>option]:bg-[#111115]">
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Ordre</label>
                  <input type="number" min={0} value={modal.sort_order}
                    onChange={e => setModal(m => m ? { ...m, sort_order: Number(e.target.value) } : m)}
                    className="w-full rounded-xl border border-white/[.1] bg-white/[.06] px-4 py-2.5 text-sm text-white outline-none focus:border-[rgba(236,72,153,.5)]" />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex gap-3 border-t border-white/[.08] px-5 py-4">
              <button onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/[.1] py-2.5 text-sm text-white/60 transition-all hover:border-white/20 hover:text-white">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || !modal.title || !modal.after_url}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg,#be185d,${ACCENT})` }}>
                {saving ? "Enregistrement…" : modal.id ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.82)" }}>
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
