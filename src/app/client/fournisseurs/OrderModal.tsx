"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calcVat } from "@/lib/fournisseurs-calc";
import type { FOrder, FOrderItem, Fournisseur } from "./types";
import { ORDER_STATUS, EMPTY_ITEM, calcItemTotal, ease, violet } from "./constants";
import { useDark, useInp, selStyle, Lbl } from "./ui";

export function OrderModal({ fournisseurs, order, onSave, onClose }: {
  fournisseurs: Fournisseur[];
  order: Partial<FOrder>;
  onSave: (o: Partial<FOrder>, items: FOrderItem[]) => Promise<void>;
  onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<FOrder>>(order);
  const [items, setItems] = useState<FOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FOrder, v: string | number | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!order.id) return;
    setLoadingItems(true);
    supabase.from("fournisseur_order_items")
      .select("*").eq("order_id", order.id)
      .then(({ data }) => {
        if (data) setItems(data as FOrderItem[]);
        setLoadingItems(false);
      });
  }, [order.id]);

  const setItem = (i: number, k: keyof FOrderItem, v: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[i], [k]: v };
      item.total_price = calcItemTotal(item);
      next[i] = item;
      const subtotal   = next.reduce((s, it) => s + it.total_price, 0);
      const vatAmount  = next.reduce((s, it) => s + calcVat(it.total_price, it.vat_rate).vatAmount, 0);
      setForm((p) => ({
        ...p,
        subtotal:     Math.round(subtotal * 100) / 100,
        vat_amount:   Math.round(vatAmount * 100) / 100,
        total_amount: Math.round((subtotal + vatAmount) * 100) / 100,
      }));
      return next;
    });
  };

  const addItem = () =>
    setItems((p) => [...p, { ...EMPTY_ITEM(), vat_rate: form.vat_rate ?? 20 }]);

  const removeItem = (i: number) => {
    setItems((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length === 0) return next;
      const subtotal  = next.reduce((s, it) => s + it.total_price, 0);
      const vatAmount = next.reduce((s, it) => s + calcVat(it.total_price, it.vat_rate).vatAmount, 0);
      setForm((p) => ({
        ...p,
        subtotal:     Math.round(subtotal * 100) / 100,
        vat_amount:   Math.round(vatAmount * 100) / 100,
        total_amount: Math.round((subtotal + vatAmount) * 100) / 100,
      }));
      return next;
    });
  };

  const selectedF = fournisseurs.find((f) => f.id === form.fournisseur_id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>
            {form.id ? "Modifier la commande" : "Nouvelle commande fournisseur"}
          </h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
            <X size={14}/>
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh]">
          <div><Lbl>Fournisseur *</Lbl>
            <select value={form.fournisseur_id ?? ""} onChange={(e) => {
              const f = fournisseurs.find((f) => f.id === e.target.value);
              set("fournisseur_id", e.target.value || null);
              set("fournisseur_name", f?.company_name ?? "");
            }} className={inp("appearance-none")} style={selStyle(isDark)}>
              <option value="">Sélectionner…</option>
              {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.company_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>N° de commande</Lbl>
              <input value={form.order_number ?? ""} onChange={(e) => set("order_number", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Statut</Lbl>
              <select value={form.status ?? "draft"} onChange={(e) => set("status", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Date commande</Lbl>
              <input type="date" value={form.order_date ?? ""} onChange={(e) => set("order_date", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Livraison prévue</Lbl>
              <input type="date" value={form.expected_date ?? ""} onChange={(e) => set("expected_date", e.target.value || null)} className={inp()}/>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div><Lbl>Taux TVA</Lbl>
              <select value={form.vat_rate ?? 20} onChange={(e) => {
                const rate = parseFloat(e.target.value);
                const { vatAmount, total } = calcVat(form.subtotal ?? 0, rate);
                setForm((p) => ({ ...p, vat_rate: rate, vat_amount: vatAmount, total_amount: total }));
              }} className={inp("appearance-none")} style={selStyle(isDark)}>
                <option value={0}>0 %</option>
                <option value={5.5}>5,5 %</option>
                <option value={10}>10 %</option>
                <option value={20}>20 %</option>
              </select>
            </div>
            <div><Lbl>HT (€)</Lbl>
              <input type="number" min={0} step={0.01} value={form.subtotal ?? 0} onChange={(e) => {
                const ht = parseFloat(e.target.value) || 0;
                const { vatAmount, total } = calcVat(ht, form.vat_rate ?? 20);
                setForm((p) => ({ ...p, subtotal: ht, vat_amount: vatAmount, total_amount: total }));
              }} className={inp()}/>
            </div>
            <div><Lbl>TVA (€)</Lbl>
              <input type="number" readOnly value={(form.vat_amount ?? 0).toFixed(2)} className={inp("opacity-50 cursor-not-allowed")}/>
            </div>
            <div><Lbl>TTC (€)</Lbl>
              <input type="number" readOnly value={(form.total_amount ?? 0).toFixed(2)} className={inp("opacity-50 cursor-not-allowed")}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>N° de suivi</Lbl>
              <input value={form.tracking_number ?? ""} onChange={(e) => set("tracking_number", e.target.value)} placeholder="DHL12345…" className={inp()}/>
            </div>
            <div><Lbl>Date réception</Lbl>
              <input type="date" value={form.received_date ?? ""} onChange={(e) => set("received_date", e.target.value || null)} className={inp()}/>
            </div>
          </div>

          {/* Lignes de commande */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Lbl>Lignes de commande</Lbl>
              <button onClick={addItem} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                style={{ background: violet + "20", color: violet }}>
                <Plus size={11}/> Ajouter
              </button>
            </div>
            {loadingItems && <p className={`text-xs py-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>Chargement…</p>}
            {items.length > 0 && (
              <div className={`rounded-xl border divide-y text-xs ${isDark ? "border-white/[0.08] divide-white/[0.06]" : "border-gray-200 divide-gray-100"}`}>
                {items.map((item, i) => (
                  <div key={i} className="p-2.5 space-y-2">
                    <div className="flex gap-2 items-start">
                      <input value={item.name} onChange={(e) => setItem(i, "name", e.target.value)}
                        placeholder="Désignation *" className={inp("flex-1 !py-1.5 !text-xs")}/>
                      <input value={item.reference} onChange={(e) => setItem(i, "reference", e.target.value)}
                        placeholder="Réf." className={inp("w-24 !py-1.5 !text-xs")}/>
                      <button onClick={() => removeItem(i)} className="h-7 w-7 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                        <X size={12}/>
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(["quantity","unit_price","discount_percent"] as const).map((field, fi) => (
                        <div key={field}>
                          <span className={`block mb-0.5 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                            {fi === 0 ? "Qté" : fi === 1 ? "P.U. HT" : "Rem. %"}
                          </span>
                          <input type="number" min={0} step={fi === 2 ? 0.1 : 0.01} value={item[field]}
                            onChange={(e) => setItem(i, field, parseFloat(e.target.value) || 0)}
                            className={inp("!py-1.5 !text-xs")}/>
                        </div>
                      ))}
                      <div>
                        <span className={`block mb-0.5 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>TVA %</span>
                        <select value={item.vat_rate} onChange={(e) => setItem(i, "vat_rate", parseFloat(e.target.value))}
                          className={inp("!py-1.5 !text-xs appearance-none")} style={selStyle(isDark)}>
                          <option value={0}>0</option>
                          <option value={5.5}>5,5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </div>
                      <div>
                        <span className={`block mb-0.5 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>Total HT</span>
                        <input readOnly value={item.total_price.toFixed(2)} className={inp("!py-1.5 !text-xs opacity-50 cursor-not-allowed")}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div><Lbl>Notes / Problèmes qualité</Lbl>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/>
          </div>

          {selectedF && (
            <div className={`rounded-xl px-3 py-2 text-xs border border-violet-500/15 bg-violet-500/5 ${isDark ? "text-white/50" : "text-gray-500"}`}>
              <span className="text-violet-400 font-semibold">{selectedF.company_name}</span>
              {" · "}{selectedF.payment_terms}
              {" · délai "}{selectedF.total_orders > 0
                ? `${selectedF.total_late_orders}/${selectedF.total_orders} retards`
                : "nouveau fournisseur"}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
            Annuler
          </button>
          <button onClick={async () => { setSaving(true); await onSave(form, items); setSaving(false); }}
            disabled={saving || !form.fournisseur_id}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Check size={13}/>}
            {form.id ? "Enregistrer" : "Créer la commande"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

