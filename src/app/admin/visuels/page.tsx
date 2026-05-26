"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Check,
  Image, Upload, ToggleLeft, ToggleRight,
} from "lucide-react";
import NextImage from "next/image";
import { getSupabase } from "@/lib/supabase";
import type { VisualRow, VisualCategory, VisualStatus } from "@/types/db";

const ACCENT = "#c9a55a";
const BUCKET  = "visuals"; // Supabase Storage bucket name

type Toast = { id: number; msg: string; ok: boolean };

const SUB_CATEGORIES = [
  "Post Instagram", "Story", "Bannière web", "Publicité Facebook",
  "Publicité Instagram", "Visuel LinkedIn", "Email marketing",
  "Affiche A3/A4", "Affiche grand format", "Bâche", "Banderole",
  "Panneau publicitaire", "Flyer", "Carte de visite", "Autre",
];

const EMPTY_FORM = {
  title:        "",
  category:     "digital" as VisualCategory,
  sub_category: "",
  description:  "",
  image_url:    "",
  status:       "published" as VisualStatus,
  sort_order:   0,
};

function statusStyle(s: VisualStatus) {
  return s === "published"
    ? "text-[#4ade80] bg-[rgba(74,222,128,0.10)]"
    : "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
}

export default function AdminVisuels() {
  const [items, setItems]         = useState<VisualRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [modal, setModal]         = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]     = useState<VisualRow | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from("visuals")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setItems((data ?? []) as VisualRow[]);
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`, false);
    } finally {
      setLoading(false);
    }
  }

  function toast(msg: string, ok: boolean) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal("add");
  }

  function openEdit(item: VisualRow) {
    setEditing(item);
    setForm({
      title:        item.title,
      category:     item.category,
      sub_category: item.sub_category ?? "",
      description:  item.description ?? "",
      image_url:    item.image_url,
      status:       item.status,
      sort_order:   item.sort_order,
    });
    setModal("edit");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await getSupabase().storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      toast("Image uploadée ✓", true);
    } catch (err) {
      toast(`Upload échoué : ${err instanceof Error ? err.message : String(err)}`, false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form.title || !form.image_url) {
      toast("Titre et image requis.", false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title:        form.title,
        category:     form.category,
        sub_category: form.sub_category || null,
        description:  form.description  || null,
        image_url:    form.image_url,
        status:       form.status,
        sort_order:   Number(form.sort_order) || 0,
      };
      if (editing) {
        const { error } = await getSupabase().from("visuals").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast("Visuel mis à jour ✓", true);
      } else {
        const { error } = await getSupabase().from("visuals").insert(payload);
        if (error) throw error;
        toast("Visuel ajouté ✓", true);
      }
      setModal(null);
      load();
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`, false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await getSupabase().from("visuals").delete().eq("id", id);
      if (error) throw error;
      setConfirmDel(null);
      toast("Visuel supprimé.", true);
      load();
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`, false);
    }
  }

  async function toggleStatus(item: VisualRow) {
    const next: VisualStatus = item.status === "published" ? "draft" : "published";
    try {
      const { error } = await getSupabase().from("visuals").update({ status: next }).eq("id", item.id);
      if (error) throw error;
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: next } : x));
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`, false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto"
            style={{
              background:   t.ok ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
              borderColor:  t.ok ? "rgba(74,222,128,0.3)"  : "rgba(248,113,113,0.3)",
              color:        t.ok ? "#4ade80"                : "#f87171",
            }}>
            {t.ok ? <Check size={15} /> : <X size={15} />} {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Visuels publicitaires</h1>
          <p className="text-sm text-white/40 mt-0.5">Galerie affichée sur la page de service</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg,#b08d45,${ACCENT})` }}>
          <Plus size={15} /> Ajouter un visuel
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-white/30" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] py-20 text-center">
          <Image size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">Aucun visuel pour l&apos;instant.</p>
          <button onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg,#b08d45,${ACCENT})` }}>
            <Plus size={14} /> Ajouter le premier visuel
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]" style={{ background: "rgba(255,255,255,.03)" }}>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/40">Aperçu</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/40">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/40 hidden sm:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/40 hidden md:table-cell">Ordre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/40">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/[0.08] shrink-0"
                      style={{ background: "rgba(255,255,255,.05)" }}>
                      {item.image_url
                        ? <NextImage fill src={item.image_url} alt={item.title} className="object-cover" sizes="48px" />
                        : <div className="w-full h-full flex items-center justify-center"><Image size={16} className="text-white/20" /></div>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white text-sm leading-tight">{item.title}</p>
                    {item.sub_category && <p className="text-[.65rem] text-white/35 mt-0.5">{item.sub_category}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[.65rem] font-bold px-2 py-1 rounded-full capitalize"
                      style={{
                        background: item.category === "digital" ? "rgba(201,165,90,.1)" : "rgba(96,165,250,.1)",
                        color:      item.category === "digital" ? ACCENT               : "#60a5fa",
                      }}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-white/40 text-xs">{item.sort_order}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(item)}
                      aria-label={item.status === "published" ? "Dépublier" : "Publier"}
                      className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
                      {item.status === "published"
                        ? <ToggleRight size={20} style={{ color: "#4ade80" }} />
                        : <ToggleLeft size={20} className="text-white/30" />}
                      <span className={`text-[.65rem] font-bold px-2 py-0.5 rounded-full ${statusStyle(item.status)}`}>
                        {item.status === "published" ? "Publié" : "Brouillon"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} aria-label="Modifier le visuel"
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.08] hover:bg-white/[0.06] text-white/50 hover:text-white transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDel(item.id)} aria-label="Supprimer le visuel"
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.75)" }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.12] overflow-hidden shadow-2xl"
            style={{ background: "#0f0f14" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h2 className="font-extrabold text-white">
                {modal === "add" ? "Ajouter un visuel" : "Modifier le visuel"}
              </h2>
              <button onClick={() => setModal(null)} aria-label="Fermer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2">Image *</label>
                {form.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.1]" style={{ aspectRatio: "1/1", maxWidth: 160 }}>
                    <NextImage fill src={form.image_url} alt="preview" className="object-cover" sizes="160px" />
                    <button
                      onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed py-8 transition-all hover:border-white/20"
                    style={{ borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.02)" }}>
                    {uploading
                      ? <Loader2 size={22} className="animate-spin text-white/40" />
                      : <Upload size={22} className="text-white/30" />}
                    <span className="text-xs text-white/35">{uploading ? "Upload en cours…" : "Cliquer pour uploader une image"}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <p className="text-[.6rem] text-white/25 mt-1.5">Ou coller une URL :</p>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[rgba(201,165,90,.4)] transition-colors"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2">Titre *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Campagne Instagram printemps 2025"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[rgba(201,165,90,.4)] transition-colors"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as VisualCategory }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(201,165,90,.4)] transition-colors [&>option]:bg-[#0f0f14]">
                    <option value="digital">Digital</option>
                    <option value="print">Print</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">Sous-catégorie</label>
                  <select
                    value={form.sub_category}
                    onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(201,165,90,.4)] transition-colors [&>option]:bg-[#0f0f14]">
                    <option value="">— Choisir —</option>
                    {SUB_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Brève description du visuel…"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none focus:border-[rgba(201,165,90,.4)] transition-colors"
                />
              </div>

              {/* Sort order + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(201,165,90,.4)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as VisualStatus }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(201,165,90,.4)] transition-colors [&>option]:bg-[#0f0f14]">
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]"
              style={{ background: "rgba(255,255,255,.02)" }}>
              <button onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.image_url}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg,#b08d45,${ACCENT})` }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde…</> : <><Check size={14} /> Sauvegarder</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.75)" }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.12] p-6 text-center shadow-2xl"
            style={{ background: "#0f0f14" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(248,113,113,.12)" }}>
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="font-extrabold text-white mb-2">Supprimer ce visuel ?</h3>
            <p className="text-sm text-white/40 mb-6">Cette action est irréversible. L&apos;image restera dans le Storage.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 border border-white/[0.08] hover:text-white hover:bg-white/[0.04] transition-all">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDel)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500/80 hover:bg-red-500 transition-all">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
