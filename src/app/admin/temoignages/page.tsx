"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, Trash2, Save, X, Search, Loader2,
  Eye, EyeOff, User, ArrowLeft, Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

const GOLD  = "#c9a55a";
const ease  = [0.16, 1, 0.3, 1] as const;

interface Temoignage {
  id: string;
  nom: string;
  role: string;
  entreprise: string | null;
  texte: string;
  note: number;
  avatar_url: string | null;
  published: boolean;
  created_at: string;
}

const EMPTY = (): Omit<Temoignage, "id" | "created_at"> => ({
  nom:        "",
  role:       "",
  entreprise: null,
  texte:      "",
  note:       5,
  avatar_url: null,
  published:  false,
});

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition"
        >
          <Star
            size={18}
            fill={(hover || value) >= i ? GOLD : "none"}
            style={{ color: (hover || value) >= i ? GOLD : "rgba(255,255,255,0.2)" }}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminTemoignagesPage() {
  const [items,       setItems]       = useState<Temoignage[]>([]);
  const [selected,    setSelected]    = useState<Temoignage | null>(null);
  const [draft,       setDraft]       = useState<Omit<Temoignage, "id"|"created_at"> | null>(null);
  const [loadingAll,  setLoadingAll]  = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [query,       setQuery]       = useState("");
  const [mobileView,  setMobileView]  = useState<"list"|"editor">("list");
  const [toast,       setToast]       = useState<ToastData | null>(null);
  const [confirmDel,  setConfirmDel]  = useState(false);

  function showToast(type: "success" | "error", msg: string) { setToast({ type, msg } as ToastData); }

  const fetchItems = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Temoignage[]);
    setLoadingAll(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openItem(t: Temoignage) {
    setSelected(t);
    setDraft({ nom: t.nom, role: t.role || "", entreprise: t.entreprise, texte: t.texte, note: t.note ?? 5, avatar_url: t.avatar_url, published: t.published });
    setDirty(false);
    setMobileView("editor");
  }

  function newItem() {
    setSelected(null);
    setDraft(EMPTY());
    setDirty(true);
    setMobileView("editor");
  }

  function upd(k: keyof Omit<Temoignage, "id" | "created_at">, v: unknown) {
    setDraft(d => d ? { ...d, [k]: v } : d);
    setDirty(true);
  }

  async function handleSave() {
    if (!draft || !draft.nom.trim()) { showToast("error", "Le nom est requis"); return; }
    setSaving(true);

    if (selected) {
      const { error } = await supabase.from("testimonials").update({ ...draft }).eq("id", selected.id);
      if (error) { showToast("error", error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("testimonials").insert({ ...draft });
      if (error) { showToast("error", error.message); setSaving(false); return; }
    }

    showToast("success", "Témoignage enregistré");
    setDirty(false);
    setSaving(false);
    await fetchItems();
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    await supabase.from("testimonials").delete().eq("id", selected.id);
    setDeleting(false); setConfirmDel(false);
    setSelected(null); setDraft(null); setMobileView("list");
    showToast("success", "Témoignage supprimé");
    await fetchItems();
  }

  const filtered = items.filter(t =>
    !query || t.nom.toLowerCase().includes(query.toLowerCase()) || t.texte.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
            <Star size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Témoignages clients</h1>
            <p className="text-[0.65rem] text-white/30">{items.length} avis · {items.filter(t => t.published).length} publiés</p>
          </div>
        </div>
        <button onClick={newItem}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#0a0a0a] transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Liste */}
        <aside className={`flex w-full flex-col border-r border-white/[0.07] sm:w-[300px] sm:flex-none ${mobileView === "editor" ? "hidden sm:flex" : "flex"}`}>
          <div className="border-b border-white/[0.07] p-4">
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…"
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingAll ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-white/20" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Star size={22} className="text-white/15" />
                <p className="text-sm text-white/30">Aucun témoignage</p>
              </div>
            ) : (
              filtered.map(t => (
                <button key={t.id} onClick={() => openItem(t)}
                  className={`w-full border-b border-white/[0.05] px-4 py-3.5 text-left transition hover:bg-white/[0.04] ${selected?.id === t.id ? "bg-white/[0.04]" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={9} fill={(t.note ?? 5) >= i ? GOLD : "none"}
                          style={{ color: (t.note ?? 5) >= i ? GOLD : "rgba(255,255,255,0.15)" }} />
                      ))}
                    </div>
                    <span className={`text-[0.55rem] font-bold ${t.published ? "text-emerald-400" : "text-white/25"}`}>
                      {t.published ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white/85">{t.nom}</p>
                  <p className="text-[0.65rem] text-white/40">{t.role}{t.entreprise ? ` — ${t.entreprise}` : ""}</p>
                  <p className="mt-1 text-[0.62rem] text-white/25 line-clamp-2">{t.texte}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Éditeur */}
        <main className={`flex flex-1 flex-col overflow-hidden ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
          {!draft ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <Star size={28} style={{ color: GOLD }} />
              <p className="text-base font-bold text-white/60">Sélectionnez ou ajoutez un témoignage</p>
              <button onClick={newItem}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-[#0a0a0a]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-5 py-3">
                <button onClick={() => setMobileView("list")} className="text-xs text-white/30 hover:text-white/60 sm:hidden">
                  <ArrowLeft size={13} />
                </button>
                <button onClick={() => upd("published", !draft.published)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    draft.published
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/[0.1] bg-white/[0.04] text-white/35 hover:border-white/20"
                  }`}>
                  {draft.published ? <Eye size={11}/> : <EyeOff size={11}/>}
                  {draft.published ? "Publié" : "Brouillon"}
                </button>
                {dirty && (
                  <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold sm:inline-flex"
                    style={{ borderColor: `${GOLD}28`, background: `${GOLD}10`, color: GOLD }}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: GOLD }}/> Non sauvegardé
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {selected && (
                    <button onClick={() => setConfirmDel(true)} disabled={deleting}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400/70 transition hover:border-red-500/40 hover:bg-red-500/[0.08]">
                      {deleting ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !dirty}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                    {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7" style={{ background: "#0d0d11" }}>
                <div className="mx-auto max-w-2xl space-y-5">
                  {/* Note */}
                  <div>
                    <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Note</label>
                    <StarRating value={draft.note} onChange={n => upd("note", n)} />
                  </div>

                  {/* Nom + Role */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                        <User size={9} className="mr-1 inline-block"/> Nom *
                      </label>
                      <input value={draft.nom} onChange={e => upd("nom", e.target.value)} placeholder="Prénom Nom"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Poste / Rôle</label>
                      <input value={draft.role} onChange={e => upd("role", e.target.value)} placeholder="Directeur, Freelance…"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
                    </div>
                  </div>

                  {/* Entreprise + Avatar URL */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                        <Building2 size={9} className="mr-1 inline-block"/> Entreprise
                      </label>
                      <input value={draft.entreprise || ""} onChange={e => upd("entreprise", e.target.value || null)} placeholder="Nom de la société"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">URL avatar (optionnel)</label>
                      <input value={draft.avatar_url || ""} onChange={e => upd("avatar_url", e.target.value || null)} placeholder="https://…"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
                    </div>
                  </div>

                  {/* Texte */}
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Témoignage *</label>
                    <textarea value={draft.texte} onChange={e => upd("texte", e.target.value)} rows={6}
                      placeholder="Décrivez votre expérience avec DJAMA…"
                      className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"/>
                  </div>

                  {/* Preview */}
                  {draft.texte && (
                    <div className="rounded-[1.25rem] p-5"
                      style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}18` }}>
                      <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: `${GOLD}80` }}>Aperçu</p>
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12} fill={(draft.note ?? 5) >= i ? GOLD : "none"}
                            style={{ color: (draft.note ?? 5) >= i ? GOLD : "rgba(255,255,255,0.15)" }} />
                        ))}
                      </div>
                      <p className="text-sm italic leading-relaxed text-white/55">&ldquo;{draft.texte}&rdquo;</p>
                      <div className="mt-3 flex items-center gap-2">
                        {draft.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={draft.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover"/>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-[0.7rem] font-black text-white/40">
                            {draft.nom?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white/80">{draft.nom || "Nom"}</p>
                          <p className="text-[0.62rem] text-white/35">{draft.role}{draft.entreprise ? ` — ${draft.entreprise}` : ""}</p>
                        </div>
                      </div>
                    </div>
                  )}
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
              className="w-full max-w-sm rounded-[1.75rem] border border-white/[0.1] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
              style={{ background: "#111318" }}>
              <Trash2 size={18} className="mb-3 text-red-400" />
              <h3 className="text-base font-extrabold text-white">Supprimer ce témoignage ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmDel(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/40 hover:text-white/70 transition">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition">
                  {deleting && <Loader2 size={13} className="animate-spin"/>} Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
