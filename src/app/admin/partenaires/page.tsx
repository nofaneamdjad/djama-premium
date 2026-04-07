"use client";

import { useState, useEffect, useRef } from "react";
import {
  Award, Plus, Pencil, Trash2, X, Loader2, Check,
  RefreshCw, ToggleLeft, ToggleRight, GripVertical,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";
import { MediaUploader } from "@/components/admin/MediaUploader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Toast = { id: number; msg: string; ok: boolean };

const EMPTY_FORM = {
  name:        "",
  logo_url:    "",
  website_url: "",
  is_active:   true,
  sort_order:  0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminPartenaires() {
  const [logos,      setLogos]      = useState<PartnerLogoRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const [modal,      setModal]      = useState<"add" | "edit" | null>(null);
  const [editing,    setEditing]    = useState<PartnerLogoRow | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const loadRef = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("partner_logos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      addToast("Impossible de charger les logos.", false);
    } else {
      setLogos((data ?? []) as PartnerLogoRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────

  function addToast(msg: string, ok: boolean) {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }

  // ── Modal helpers ────────────────────────────────────────────────────────

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: logos.length });
    setModal("add");
  }

  function openEdit(l: PartnerLogoRow) {
    setEditing(l);
    setForm({
      name:        l.name,
      logo_url:    l.logo_url,
      website_url: l.website_url ?? "",
      is_active:   l.is_active,
      sort_order:  l.sort_order,
    });
    setModal("edit");
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.logo_url.trim()) { addToast("L'URL du logo est obligatoire.", false); return; }
    setSaving(true);
    const payload = {
      name:        form.name.trim(),
      logo_url:    form.logo_url.trim(),
      website_url: form.website_url.trim() || null,
      is_active:   form.is_active,
      sort_order:  form.sort_order,
    };

    try {
      if (modal === "add") {
        const { data, error } = await supabase
          .from("partner_logos")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setLogos(p => [...p, data as PartnerLogoRow]);
        addToast("Logo ajouté.", true);
      } else if (editing) {
        const { data, error } = await supabase
          .from("partner_logos")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        setLogos(p => p.map(l => l.id === editing.id ? (data as PartnerLogoRow) : l));
        addToast("Logo mis à jour.", true);
      }
      setModal(null);
    } catch (err) {
      console.error("[AdminPartenaires] save error:", err);
      addToast("Erreur lors de la sauvegarde.", false);
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  async function toggleActive(l: PartnerLogoRow) {
    const newVal = !l.is_active;
    const { error } = await supabase
      .from("partner_logos")
      .update({ is_active: newVal })
      .eq("id", l.id);
    if (error) {
      addToast("Erreur lors de la mise à jour.", false);
    } else {
      setLogos(p => p.map(x => x.id === l.id ? { ...x, is_active: newVal } : x));
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    const { error } = await supabase.from("partner_logos").delete().eq("id", id);
    if (error) {
      addToast("Erreur lors de la suppression.", false);
    } else {
      setLogos(p => p.filter(l => l.id !== id));
      addToast("Logo supprimé.", true);
    }
    setConfirmDel(null);
  }

  // ── Order up/down ─────────────────────────────────────────────────────────

  async function moveOrder(id: string, dir: "up" | "down") {
    const idx = logos.findIndex(l => l.id === id);
    if (dir === "up"   && idx === 0)               return;
    if (dir === "down" && idx === logos.length - 1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const updated = [...logos];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((l, i) => ({ ...l, sort_order: i }));
    setLogos(reordered);
    // Persist to DB
    await Promise.all(
      reordered.map(l =>
        supabase.from("partner_logos").update({ sort_order: l.sort_order }).eq("id", l.id)
      )
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const activeCount = logos.filter(l => l.is_active).length;

  return (
    <div className="space-y-6">

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.84rem] font-semibold shadow-2xl ${
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
          <h1 className="text-[1.3rem] font-black text-white">Logos partenaires</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {loading ? "Chargement…" : `${logos.length} logo${logos.length !== 1 ? "s" : ""} · ${activeCount} actif${activeCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(false)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181c] px-3.5 py-2.5 text-[0.8rem] text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAdd}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-bold text-[#1a1308] hover:opacity-90"
          >
            <Plus size={14} /> Ajouter un logo
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : logos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#18181c] py-16">
          <Award size={32} className="text-white/15" />
          <p className="text-sm text-white/30">Aucun logo pour l'instant</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-[rgba(201,165,90,0.12)] px-4 py-2 text-[0.82rem] font-bold text-[#c9a55a] hover:bg-[rgba(201,165,90,0.2)]"
          >
            <Plus size={13} /> Ajouter le premier logo
          </button>
        </div>
      ) : (
        /* ── Grille logos ── */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo, idx) => (
            <div
              key={logo.id}
              className={`group relative rounded-2xl border bg-[#18181c] p-4 transition-all ${
                logo.is_active
                  ? "border-white/[0.07]"
                  : "border-white/[0.04] opacity-50"
              }`}
            >
              {/* Drag handle (décoration) */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10">
                <GripVertical size={14} />
              </div>

              <div className="ml-5 flex items-center gap-3">
                {/* Logo preview */}
                <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.logo_url}
                    alt={logo.name}
                    className="max-h-9 max-w-[70px] object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>

                {/* Infos */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem] font-bold text-white/85">
                    {logo.name || <span className="text-white/25">Sans nom</span>}
                  </p>
                  {logo.website_url && (
                    <p className="truncate text-[0.7rem] text-white/30">{logo.website_url}</p>
                  )}
                  <p className="mt-0.5 text-[0.65rem] text-white/20">Ordre : {logo.sort_order}</p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(logo)}
                    title={logo.is_active ? "Désactiver" : "Activer"}
                    className="transition-opacity hover:opacity-70"
                  >
                    {logo.is_active
                      ? <ToggleRight size={22} className="text-[#4ade80]" />
                      : <ToggleLeft  size={22} className="text-white/25" />
                    }
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => moveOrder(logo.id, "up")}   disabled={idx === 0}                className="text-white/20 transition-colors hover:text-white/60 disabled:opacity-30">▲</button>
                    <button onClick={() => moveOrder(logo.id, "down")} disabled={idx === logos.length - 1} className="text-white/20 transition-colors hover:text-white/60 disabled:opacity-30">▼</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(logo)} className="text-white/25 transition-colors hover:text-[#60a5fa]">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(logo.id)} className="text-white/25 transition-colors hover:text-[#f87171]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Add / Edit ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[1rem] font-black text-white">
                {modal === "add" ? "Ajouter un logo" : "Modifier le logo"}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Nom du partenaire</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="Nom de la société"
                />
              </div>

              <MediaUploader
                type="image"
                folder="images"
                label="Logo du partenaire *"
                currentUrl={form.logo_url}
                onUrlChange={url => setForm(f => ({ ...f, logo_url: url }))}
              />

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Site web (optionnel)</label>
                <input
                  value={form.website_url}
                  onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="https://…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.82rem] font-semibold text-white/50 transition-colors hover:border-white/[0.14]"
                  >
                    {form.is_active
                      ? <><ToggleRight size={20} className="text-[#4ade80]" /> Actif</>
                      : <><ToggleLeft  size={20} className="text-white/25"  /> Inactif</>
                    }
                  </button>
                </div>
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
                disabled={saving || !form.logo_url.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a55a] py-2.5 text-[0.82rem] font-bold text-[#1a1308] hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <h2 className="text-[1rem] font-black text-white">Supprimer ce logo ?</h2>
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
