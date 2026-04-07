"use client";

import { useState, useEffect } from "react";
import { Star, Plus, Pencil, Trash2, X, Loader2, Check, ToggleLeft, ToggleRight, Image, Video } from "lucide-react";
// Toutes les opérations passent par les routes serveur (lues au runtime, pas au build)
import type { RealisationRow, RealisationStatus, RealisationMediaType } from "@/types/db";
import { MediaUploader } from "@/components/admin/MediaUploader";

const tagColors: Record<string, string> = {
  "E-commerce":  "#c9a55a",
  "Web":         "#60a5fa",
  "Application": "#a78bfa",
};

const ACCENT_PRESETS = ["#c9a55a", "#60a5fa", "#a78bfa", "#4ade80", "#f472b6", "#fb923c"];

type Toast = { id: number; msg: string; ok: boolean };

const EMPTY_FORM = {
  name:          "",
  category:      "",
  tag:           "",
  description:   "",
  year:          new Date().getFullYear(),
  status:        "brouillon" as RealisationStatus,
  url:           "",
  accent_color:  "#c9a55a",
  highlights:    [] as string[],
  // Médias
  media_type:    null as RealisationMediaType,
  image_url:     "",
  video_url:     "",
  thumbnail_url: "",
};

function statusStyle(s: string) {
  if (s === "publié")    return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "brouillon") return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

export default function AdminRealisations() {
  const [projects, setProjects]     = useState<RealisationRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [modal, setModal]           = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]       = useState<RealisationRow | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [hlInput, setHlInput]       = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/realisations", { cache: "no-store" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.error ?? `HTTP ${res.status}`); }
      setProjects(await res.json());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Erreur chargement : ${msg.slice(0, 100)}`, false);
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
    setHlInput("");
    setModal("add");
  }

  function openEdit(p: RealisationRow) {
    setEditing(p);
    setForm({
      name:          p.name,
      category:      p.category,
      tag:           p.tag,
      description:   p.description,
      year:          p.year,
      status:        p.status,
      url:           p.url ?? "",
      accent_color:  p.accent_color,
      highlights:    [...p.highlights],
      media_type:    p.media_type ?? null,
      image_url:     p.image_url ?? "",
      video_url:     p.video_url ?? "",
      thumbnail_url: p.thumbnail_url ?? "",
    });
    setHlInput("");
    setModal("edit");
  }

  function addHighlight() {
    const v = hlInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, highlights: [...f.highlights, v] }));
    setHlInput("");
  }

  function removeHighlight(i: number) {
    setForm(f => ({ ...f, highlights: f.highlights.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        url:           form.url           || null,
        media_type:    form.media_type    || null,
        image_url:     form.image_url     || null,
        video_url:     form.video_url     || null,
        thumbnail_url: form.thumbnail_url || null,
      };
      if (modal === "add") {
        const r = await fetch("/api/admin/realisations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b?.error ?? `HTTP ${r.status}`); }
        const created: RealisationRow = await r.json();
        setProjects(prev => [created, ...prev]);
        toast("Projet créé", true);
      } else if (editing) {
        const r = await fetch(`/api/admin/realisations?id=${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b?.error ?? `HTTP ${r.status}`); }
        const updated: RealisationRow = await r.json();
        setProjects(prev => prev.map(p => p.id === editing.id ? updated : p));
        toast("Projet mis à jour", true);
      }
      setModal(null);
    } catch {
      toast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(p: RealisationRow) {
    const newStatus: RealisationStatus = p.status === "publié" ? "brouillon" : "publié";
    try {
      const r = await fetch(`/api/admin/realisations?id=${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b?.error ?? `HTTP ${r.status}`); }
      const updated: RealisationRow = await r.json();
      setProjects(prev => prev.map(x => x.id === p.id ? updated : x));
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`.slice(0, 100), false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const r = await fetch(`/api/admin/realisations?id=${id}`, { method: "DELETE" });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b?.error ?? `HTTP ${r.status}`); }
      setProjects(prev => prev.filter(p => p.id !== id));
      toast("Projet supprimé", true);
    } catch (err) {
      toast(`Erreur : ${err instanceof Error ? err.message : String(err)}`.slice(0, 100), false);
    } finally {
      setConfirmDel(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.84rem] font-semibold shadow-2xl ${
              t.ok
                ? "bg-[rgba(74,222,128,0.15)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]"
                : "bg-[rgba(248,113,113,0.12)] text-[#f87171] border border-[rgba(248,113,113,0.18)]"
            }`}
          >
            {t.ok ? <Check size={14} /> : <X size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Réalisations</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {loading ? "Chargement…" : `${projects.length} projet${projects.length !== 1 ? "s" : ""} · ${projects.filter(p => p.status === "publié").length} publiés`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-bold text-[#1a1308] hover:opacity-90"
        >
          <Plus size={14} /> Ajouter un projet
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Projet", "Catégorie", "Tag", "Année", "Statut", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {projects.map(p => (
                  <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-xl"
                          style={{ background: `${p.accent_color}18` }}
                        >
                          <Star size={13} style={{ color: p.accent_color }} />
                        </div>
                        <span className="text-[0.85rem] font-bold text-white/85">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[0.81rem] text-white/45">{p.category}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[0.71rem] font-bold"
                        style={{
                          color: tagColors[p.tag] ?? "#c9a55a",
                          background: `${tagColors[p.tag] ?? "#c9a55a"}14`,
                        }}
                      >
                        {p.tag}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[0.82rem] text-white/35">{p.year}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStatus(p)}
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[0.71rem] font-bold transition-opacity hover:opacity-70 ${statusStyle(p.status)}`}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(p)} className="text-white/25 transition-colors hover:text-[#60a5fa]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDel(p.id)} className="text-white/25 transition-colors hover:text-[#f87171]">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.length === 0 && (
            <div className="py-12 text-center text-[0.85rem] text-white/25">Aucun projet</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[1rem] font-black text-white">
                {modal === "add" ? "Nouveau projet" : "Modifier le projet"}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Nom *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="MONDOUKA"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Année</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2024 }))}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Catégorie</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="E-commerce & Sourcing"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Tag</label>
                  <input
                    value={form.tag}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="E-commerce"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">URL du projet (optionnel)</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="https://…"
                />
              </div>

              {/* ── Média ── */}
              <div>
                <label className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Type de média</label>
                <div className="flex gap-2">
                  {([null, "image", "video"] as const).map(t => (
                    <button
                      key={String(t)}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, media_type: t }))}
                      className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.78rem] font-bold transition-colors"
                      style={{
                        borderColor: form.media_type === t ? "rgba(201,165,90,0.5)" : "rgba(255,255,255,0.07)",
                        background:  form.media_type === t ? "rgba(201,165,90,0.12)" : "rgba(255,255,255,0.03)",
                        color:       form.media_type === t ? "#c9a55a" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {t === null  && "Aucun (mockup)"}
                      {t === "image" && <><Image size={12} /> Image</>}
                      {t === "video" && <><Video size={12} /> Vidéo</>}
                    </button>
                  ))}
                </div>
              </div>

              {form.media_type === "image" && (
                <MediaUploader
                  type="image"
                  folder="images"
                  label="Image du projet"
                  currentUrl={form.image_url}
                  onUrlChange={url => setForm(f => ({ ...f, image_url: url }))}
                />
              )}

              {form.media_type === "video" && (
                <>
                  <MediaUploader
                    type="video"
                    folder="videos"
                    label="Vidéo du projet (YouTube · Vimeo · MP4)"
                    currentUrl={form.video_url}
                    onUrlChange={url => setForm(f => ({ ...f, video_url: url }))}
                  />
                  <MediaUploader
                    type="image"
                    folder="thumbnails"
                    label="Miniature / thumbnail (optionnel)"
                    currentUrl={form.thumbnail_url}
                    onUrlChange={url => setForm(f => ({ ...f, thumbnail_url: url }))}
                  />
                </>
              )}

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Couleur accent</label>
                <div className="flex items-center gap-2">
                  {ACCENT_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, accent_color: c }))}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: form.accent_color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Points forts</label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[0.75rem] text-white/60"
                    >
                      {h}
                      <button onClick={() => removeHighlight(i)} className="text-white/30 hover:text-white/70">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={hlInput}
                    onChange={e => setHlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }}
                    className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.82rem] text-white/70 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="Ex: SEO optimisé"
                  />
                  <button
                    onClick={addHighlight}
                    className="rounded-xl bg-white/[0.06] px-3 text-white/40 hover:text-white/70"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, status: f.status === "publié" ? "brouillon" : "publié" }))}
                  className="transition-opacity hover:opacity-70"
                >
                  {form.status === "publié"
                    ? <ToggleRight size={28} className="text-[#4ade80]" />
                    : <ToggleLeft  size={28} className="text-white/25" />
                  }
                </button>
                <span className="text-[0.82rem] text-white/50">
                  {form.status === "publié" ? "Publié (visible sur le site)" : "Brouillon (masqué)"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.82rem] font-semibold text-white/40 hover:text-white/70"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a55a] py-2.5 text-[0.82rem] font-bold text-[#1a1308] hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <h2 className="text-[1rem] font-black text-white">Supprimer ce projet ?</h2>
            <p className="mt-2 text-[0.82rem] text-white/40">Cette action est irréversible.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.82rem] font-semibold text-white/40 hover:text-white/70"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 rounded-xl bg-[rgba(248,113,113,0.15)] py-2.5 text-[0.82rem] font-bold text-[#f87171] hover:bg-[rgba(248,113,113,0.22)]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
