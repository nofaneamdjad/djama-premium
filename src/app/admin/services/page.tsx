"use client";

import { useState, useEffect } from "react";
import { Briefcase, ToggleLeft, ToggleRight, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import type { ServiceRow, ServiceCategory } from "@/types/db";

// ── Appels via routes serveur (lues au runtime, pas au build) ──────────────────
async function apiFetchServices(): Promise<ServiceRow[]> {
  const res = await fetch("/api/admin/services", { cache: "no-store" });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiCreateService(payload: Omit<ServiceRow, "id" | "created_at">): Promise<ServiceRow> {
  const res = await fetch("/api/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiUpdateService(id: string, payload: Partial<Omit<ServiceRow, "id" | "created_at">>): Promise<ServiceRow> {
  const res = await fetch(`/api/admin/services?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiDeleteService(id: string): Promise<void> {
  const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.error ?? `HTTP ${res.status}`);
  }
}

const CATEGORIES: ServiceCategory[] = [
  "Digital",
  "Création de contenu",
  "Documents & Outils",
  "Accompagnement",
  "Coaching",
];

const catColors: Record<string, string> = {
  "Digital":               "#60a5fa",
  "Création de contenu":   "#f472b6",
  "Documents & Outils":    "#c9a55a",
  "Accompagnement":        "#4ade80",
  "Coaching":              "#a78bfa",
};

type Toast = { id: number; msg: string; ok: boolean };

const EMPTY_FORM = {
  slug: "",
  title: "",
  category: "Digital" as ServiceCategory,
  price: "",
  description: "",
  active: true,
  sort_order: 0,
};

export default function AdminServices() {
  const [services, setServices]   = useState<ServiceRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [modal, setModal]         = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]     = useState<ServiceRow | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setServices(await apiFetchServices());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AdminServices] apiFetchServices échoué :", msg);
      toast(`Erreur chargement : ${msg.slice(0, 120)}`, false);
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

  function openEdit(s: ServiceRow) {
    setEditing(s);
    setForm({
      slug: s.slug ?? "",
      title: s.title,
      category: s.category,
      price: s.price,
      description: s.description,
      active: s.active,
      sort_order: s.sort_order,
    });
    setModal("edit");
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (modal === "add") {
        const created = await apiCreateService(form);
        setServices(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        toast("Service créé", true);
      } else if (editing) {
        const updated = await apiUpdateService(editing.id, form);
        setServices(prev =>
          prev.map(s => s.id === editing.id ? updated : s).sort((a, b) => a.sort_order - b.sort_order)
        );
        toast("Service mis à jour", true);
      }
      setModal(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Erreur sauvegarde : ${msg.slice(0, 100)}`, false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: ServiceRow) {
    try {
      const updated = await apiUpdateService(s.id, { active: !s.active });
      setServices(prev => prev.map(x => x.id === s.id ? updated : x));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Erreur toggle : ${msg.slice(0, 80)}`, false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast("Service supprimé", true);
    } catch {
      toast("Erreur lors de la suppression", false);
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
            className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.84rem] font-semibold shadow-2xl transition-all ${
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
          <h1 className="text-[1.3rem] font-black text-white">Services</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {loading ? "Chargement…" : `${services.filter(s => s.active).length} actifs · ${services.filter(s => !s.active).length} inactifs`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-bold text-[#1a1308] hover:opacity-90"
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map(s => (
            <div
              key={s.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                s.active
                  ? "border-white/[0.07] bg-[#18181c]"
                  : "border-white/[0.04] bg-white/[0.02] opacity-50"
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${catColors[s.category] ?? "#c9a55a"}14` }}
              >
                <Briefcase size={16} style={{ color: catColors[s.category] ?? "#c9a55a" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.85rem] font-semibold text-white/85 truncate">{s.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[0.72rem]" style={{ color: catColors[s.category] ?? "#c9a55a" }}>{s.category}</span>
                  {s.price && <>
                    <span className="text-white/20">·</span>
                    <span className="text-[0.72rem] text-white/30">{s.price}</span>
                  </>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="text-white/20 transition-colors hover:text-[#60a5fa]"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmDel(s.id)}
                  className="text-white/20 transition-colors hover:text-[#f87171]"
                >
                  <Trash2 size={13} />
                </button>
                <button onClick={() => toggleActive(s)} className="ml-1 transition-opacity hover:opacity-70">
                  {s.active
                    ? <ToggleRight size={26} className="text-[#4ade80]" />
                    : <ToggleLeft  size={26} className="text-white/20" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[1rem] font-black text-white">
                {modal === "add" ? "Nouveau service" : "Modifier le service"}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Titre *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="Nom du service"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ServiceCategory }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-[#0f0f12] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Prix</label>
                <input
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="À partir de 490€"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="Description courte"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="transition-opacity hover:opacity-70"
                >
                  {form.active
                    ? <ToggleRight size={28} className="text-[#4ade80]" />
                    : <ToggleLeft  size={28} className="text-white/25" />
                  }
                </button>
                <span className="text-[0.82rem] text-white/50">
                  {form.active ? "Actif (visible sur le site)" : "Inactif (masqué)"}
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
                disabled={saving || !form.title.trim()}
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
            <h2 className="text-[1rem] font-black text-white">Supprimer ce service ?</h2>
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
