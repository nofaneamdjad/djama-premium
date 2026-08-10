"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X, Search,
  BookOpen, Loader2, Package, ChevronDown,
} from "lucide-react";
import Link from "next/link";

const GOLD = "#c9a55a";

const UNITS = ["—", "h", "j", "forfait", "pièce", "m²", "km", "kg", "mois", "lot"];
const TVA_RATES = [0, 2.1, 5.5, 8.5, 10, 20];

interface CatalogItem {
  id:          string;
  description: string;
  unit:        string;
  unit_price:  number;
  vat_rate:    number;
}

interface EditState {
  description: string;
  unit:        string;
  unit_price:  string;
  vat_rate:    string;
}

function r2(n: number) { return Math.round(n * 100) / 100; }
function fmtPrice(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " €";
}

export default function CataloguePage() {
  const { isDark } = useTheme();

  const [items,      setItems]      = useState<CatalogItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editState,  setEditState]  = useState<EditState | null>(null);
  const [savingId,   setSavingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [addState,   setAddState]   = useState<EditState>({ description: "", unit: "forfait", unit_price: "0.00", vat_rate: "20" });
  const [addSaving,  setAddSaving]  = useState(false);
  const [toast,      setToast]      = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // ── Styles adaptés thème ────────────────────────────────────────────────────
  const bg   = isDark ? "bg-[#0f1117]"        : "bg-gray-50";
  const bg2  = isDark ? "bg-[#181c28]"        : "bg-white";
  const bd   = isDark ? "border-white/[0.07]" : "border-gray-200";
  const bd2  = isDark ? "border-white/[0.1]"  : "border-gray-300";
  const t1   = isDark ? "text-white"          : "text-gray-900";
  const t2   = isDark ? "text-white/70"       : "text-gray-600";
  const t3   = isDark ? "text-white/40"       : "text-gray-400";
  const inp  = isDark
    ? "bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 focus:border-[rgba(201,165,90,0.4)]"
    : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-[rgba(201,165,90,0.5)]";

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Chargement ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog");
      const { items: data } = await res.json() as { items: CatalogItem[] };
      setItems(data ?? []);
    } catch { showToast("err", "Impossible de charger le catalogue"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Filtre recherche ─────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    items.filter(it => it.description.toLowerCase().includes(search.toLowerCase())),
  [items, search]);

  // ── Édition inline ───────────────────────────────────────────────────────────
  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditState({
      description: item.description,
      unit:        item.unit || "—",
      unit_price:  item.unit_price.toFixed(2),
      vat_rate:    item.vat_rate.toString(),
    });
  }

  function cancelEdit() { setEditingId(null); setEditState(null); }

  async function saveEdit(id: string) {
    if (!editState || !editState.description.trim()) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/catalog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editState.description,
          unit:        editState.unit === "—" ? "" : editState.unit,
          unit_price:  r2(parseFloat(editState.unit_price) || 0),
          vat_rate:    parseFloat(editState.vat_rate) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const { item: updated } = await res.json() as { item: CatalogItem };
      setItems(prev => prev.map(it => it.id === id ? updated : it));
      setEditingId(null); setEditState(null);
      showToast("ok", "Article mis à jour");
    } catch { showToast("err", "Erreur lors de la mise à jour"); }
    finally { setSavingId(null); }
  }

  // ── Suppression ──────────────────────────────────────────────────────────────
  async function deleteItem(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(it => it.id !== id));
      setConfirmDel(null);
      showToast("ok", "Article supprimé");
    } catch { showToast("err", "Erreur lors de la suppression"); }
    finally { setDeletingId(null); }
  }

  // ── Ajout ────────────────────────────────────────────────────────────────────
  async function addItem() {
    if (!addState.description.trim()) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: addState.description.trim(),
          unit:        addState.unit === "—" ? "" : addState.unit,
          unit_price:  r2(parseFloat(addState.unit_price) || 0),
          vat_rate:    parseFloat(addState.vat_rate) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const { item: newItem } = await res.json() as { item: CatalogItem };
      setItems(prev => [newItem, ...prev]);
      setAddState({ description: "", unit: "forfait", unit_price: "0.00", vat_rate: "20" });
      setAddOpen(false);
      showToast("ok", "Article ajouté au catalogue");
    } catch { showToast("err", "Erreur lors de l'ajout"); }
    finally { setAddSaving(false); }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen flex-col overflow-hidden ${bg}`}>

      {/* ── Barre supérieure ── */}
      <div className={`flex shrink-0 items-center justify-between border-b ${bd} ${isDark ? "bg-[#0f1117]/98" : "bg-white"} px-5 py-3 backdrop-blur`}>
        <Link href="/client/factures"
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${t2} transition hover:bg-white/[0.05] hover:${t1}`}>
          <ArrowLeft size={14}/> Factures
        </Link>

        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: GOLD }}/>
          <span className={`text-sm font-bold ${t1}`}>Catalogue articles</span>
          {items.length > 0 && (
            <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
              style={{ background: "rgba(201,165,90,0.15)", color: GOLD }}>
              {items.length}
            </span>
          )}
        </div>

        <button onClick={() => setAddOpen(v => !v)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.72rem] font-bold text-[#0a0a0a] transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
          <Plus size={13}/> Ajouter
        </button>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">

        {/* Formulaire ajout */}
        <AnimatePresence>
          {addOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border ${bd} ${bg2} p-5 shadow-sm`}>
              <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${t3}`}>Nouvel article</p>
              <div className="flex flex-col gap-3">
                <input
                  value={addState.description}
                  onChange={e => setAddState(s => ({ ...s, description: e.target.value }))}
                  placeholder="Description de la prestation ou du produit…"
                  className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition ${inp}`}
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") void addItem(); if (e.key === "Escape") setAddOpen(false); }}
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`mb-1 block text-[0.65rem] font-semibold uppercase tracking-wider ${t3}`}>Unité</label>
                    <div className="relative">
                      <select value={addState.unit} onChange={e => setAddState(s => ({ ...s, unit: e.target.value }))}
                        className={`w-full appearance-none rounded-xl py-2 pl-3 pr-7 text-sm outline-none transition ${inp}`}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                    </div>
                  </div>
                  <div>
                    <label className={`mb-1 block text-[0.65rem] font-semibold uppercase tracking-wider ${t3}`}>Prix HT</label>
                    <input type="number" min="0" step="0.01"
                      value={addState.unit_price}
                      onChange={e => setAddState(s => ({ ...s, unit_price: e.target.value }))}
                      className={`w-full rounded-xl px-3 py-2 text-right text-sm outline-none transition ${inp}`}/>
                  </div>
                  <div>
                    <label className={`mb-1 block text-[0.65rem] font-semibold uppercase tracking-wider ${t3}`}>TVA %</label>
                    <div className="relative">
                      <select value={addState.vat_rate} onChange={e => setAddState(s => ({ ...s, vat_rate: e.target.value }))}
                        className={`w-full appearance-none rounded-xl py-2 pl-3 pr-7 text-sm outline-none transition ${inp}`}>
                        {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAddOpen(false)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold ${t3} transition hover:${t2}`}>
                    Annuler
                  </button>
                  <button onClick={() => void addItem()} disabled={addSaving || !addState.description.trim()}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                    {addSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barre de recherche */}
        <div className={`flex items-center gap-2 rounded-xl border ${bd} ${isDark ? "bg-white/[0.03]" : "bg-white"} px-3 py-2`}>
          <Search size={13} className={t3}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Rechercher parmi ${items.length} article${items.length !== 1 ? "s" : ""}…`}
            className={`flex-1 bg-transparent text-sm outline-none ${t2} placeholder:${t3}`}
          />
          {search && (
            <button onClick={() => setSearch("")} className={`${t3} hover:${t2}`}><X size={12}/></button>
          )}
        </div>

        {/* Tableau / Liste */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin" style={{ color: GOLD }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
            <Package size={36} className={t3}/>
            <p className={`text-sm font-semibold ${t2}`}>
              {search ? "Aucun article ne correspond à la recherche" : "Catalogue vide"}
            </p>
            <p className={`text-xs ${t3}`}>
              {search ? "Essayez un autre terme" : "Ajoutez votre première prestation ou produit"}
            </p>
            {!search && (
              <button onClick={() => setAddOpen(true)}
                className="mt-2 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#0a0a0a]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                <Plus size={12}/> Ajouter un article
              </button>
            )}
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${bd} ${bg2}`}>
            {/* En-tête tableau */}
            <div className={`grid grid-cols-[1fr_80px_110px_70px_72px] gap-0 border-b ${bd} px-4 py-2`}>
              {["Description", "Unité", "Prix HT", "TVA", ""].map((h, i) => (
                <span key={i} className={`text-[0.6rem] font-bold uppercase tracking-wider ${t3} ${i >= 2 ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>

            {/* Lignes */}
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(item => {
                const isEditing = editingId === item.id;
                const isSaving  = savingId === item.id;
                const isDel     = confirmDel === item.id;

                return (
                  <div key={item.id}
                    className={`grid grid-cols-[1fr_80px_110px_70px_72px] items-center gap-0 px-4 transition ${
                      isEditing
                        ? isDark ? "bg-white/[0.04]" : "bg-amber-50/60"
                        : isDark ? "hover:bg-white/[0.025]" : "hover:bg-gray-50"
                    }`}>

                    {/* Description */}
                    <div className="py-3 pr-3">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editState!.description}
                          onChange={e => setEditState(s => s ? { ...s, description: e.target.value } : s)}
                          className={`w-full rounded-lg px-2 py-1 text-sm outline-none transition ${inp}`}
                          onKeyDown={e => { if (e.key === "Enter") void saveEdit(item.id); if (e.key === "Escape") cancelEdit(); }}
                        />
                      ) : (
                        <span className={`text-sm ${t1} leading-snug`}>{item.description}</span>
                      )}
                    </div>

                    {/* Unité */}
                    <div className="py-3 pr-3">
                      {isEditing ? (
                        <div className="relative">
                          <select value={editState!.unit}
                            onChange={e => setEditState(s => s ? { ...s, unit: e.target.value } : s)}
                            className={`w-full appearance-none rounded-lg py-1 pl-2 pr-6 text-xs outline-none transition ${inp}`}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <ChevronDown size={9} className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                        </div>
                      ) : (
                        <span className={`text-xs ${t2}`}>{item.unit || "—"}</span>
                      )}
                    </div>

                    {/* Prix HT */}
                    <div className="py-3 pr-3 text-right">
                      {isEditing ? (
                        <input type="number" min="0" step="0.01"
                          value={editState!.unit_price}
                          onChange={e => setEditState(s => s ? { ...s, unit_price: e.target.value } : s)}
                          className={`w-full rounded-lg px-2 py-1 text-right text-xs outline-none transition ${inp}`}/>
                      ) : (
                        <span className={`text-sm font-semibold tabular-nums ${t1}`}>{fmtPrice(item.unit_price)}</span>
                      )}
                    </div>

                    {/* TVA */}
                    <div className="py-3 pr-3 text-right">
                      {isEditing ? (
                        <div className="relative">
                          <select value={editState!.vat_rate}
                            onChange={e => setEditState(s => s ? { ...s, vat_rate: e.target.value } : s)}
                            className={`w-full appearance-none rounded-lg py-1 pl-2 pr-6 text-xs outline-none transition ${inp}`}>
                            {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                          <ChevronDown size={9} className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                        </div>
                      ) : (
                        <span className={`text-xs ${t2}`}>{item.vat_rate}%</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 py-3">
                      {isEditing ? (
                        <>
                          <button onClick={() => void saveEdit(item.id)} disabled={isSaving}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50">
                            {isSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                          </button>
                          <button onClick={cancelEdit}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/[0.05] ${t3}`}>
                            <X size={12}/>
                          </button>
                        </>
                      ) : isDel ? (
                        <>
                          <button onClick={() => void deleteItem(item.id)} disabled={deletingId === item.id}
                            className="flex h-7 items-center gap-1 rounded-lg bg-red-500/10 px-2 text-[0.62rem] font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50">
                            {deletingId === item.id ? <Loader2 size={10} className="animate-spin"/> : <Trash2 size={10}/>} Oui
                          </button>
                          <button onClick={() => setConfirmDel(null)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/[0.05] ${t3}`}>
                            <X size={11}/>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/[0.05] ${t3} hover:${t2}`}
                            title="Modifier">
                            <Pencil size={12}/>
                          </button>
                          <button onClick={() => setConfirmDel(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400/40 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Supprimer">
                            <Trash2 size={12}/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className={`border-t ${bd} px-4 py-2.5`}>
                <p className={`text-[0.62rem] ${t3}`}>
                  {filtered.length === items.length
                    ? `${items.length} article${items.length !== 1 ? "s" : ""} dans le catalogue`
                    : `${filtered.length} / ${items.length} articles`}
                  {" · "}utilisé automatiquement dans l'autocomplete des lignes de prestation
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xl ${
              toast.type === "ok"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/15 text-red-400 border border-red-500/20"
            }`}>
            {toast.type === "ok" ? <Check size={13}/> : <X size={13}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
