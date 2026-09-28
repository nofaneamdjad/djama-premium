"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, Check } from "lucide-react";
import type { Movement, Product, Warehouse } from "./types";
import { ease, MOV_TYPES } from "./constants";
import { useDark, useInp, selStyle, Label } from "./ui";

export function MovementModal({ products, warehouses, onSave, onClose }: {
  products: Product[]; warehouses: Warehouse[];
  onSave: (m: Partial<Movement>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Movement>>({
    type: "entree", quantity: 1,
    date: new Date().toISOString().split("T")[0],
    reason: "", reference: "", unit_cost: 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Movement, v: string | number | null) => setForm((p) => ({ ...p, [k]: v }));

  const isDark = useDark();
  const inp = useInp();
  const movType = MOV_TYPES.find((m) => m.value === form.type) ?? MOV_TYPES[0];

  const save = async () => {
    if (!form.product_id || !form.quantity) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>Nouveau mouvement de stock</h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label>Type de mouvement</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {MOV_TYPES.map((m) => (
                <button key={m.value} onClick={() => set("type", m.value)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.type === m.value ? "border-transparent" : isDark ? "border-white/10 text-white/40 hover:border-white/20" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                  style={form.type === m.value ? { background: m.color + "20", color: m.color, border: `1px solid ${m.color}40` } : {}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Produit *</Label>
            <select value={form.product_id ?? ""} onChange={(e) => {
              const p = products.find((p) => p.id === e.target.value);
              set("product_id", e.target.value);
              set("product_name", p?.name ?? "");
            }} className={inp("appearance-none")} style={selStyle(isDark)}>
              <option value="">Sélectionner un produit…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_current} {p.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantité *</Label>
              <input type="number" min={0.01} step={0.01} value={form.quantity ?? ""} onChange={(e) => set("quantity", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Coût unitaire (€)</Label>
              <input type="number" min={0} step={0.01} value={form.unit_cost ?? 0} onChange={(e) => set("unit_cost", parseFloat(e.target.value))} className={inp()}/>
            </div>
          </div>
          {form.type === "transfert" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Entrepôt source</Label>
                <select value={form.warehouse_id ?? ""} onChange={(e) => set("warehouse_id", e.target.value || null)} className={inp("appearance-none")} style={selStyle(isDark)}>
                  <option value="">Par défaut</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><Label>Entrepôt destination</Label>
                <select value={form.to_warehouse_id ?? ""} onChange={(e) => set("to_warehouse_id", e.target.value || null)} className={inp("appearance-none")} style={selStyle(isDark)}>
                  <option value="">Par défaut</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label>
              <input type="date" value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} className={inp()}/>
            </div>
            <div><Label>Référence</Label>
              <input value={form.reference ?? ""} onChange={(e) => set("reference", e.target.value)} placeholder="N° facture, bon de livraison…" className={inp()}/>
            </div>
          </div>
          <div><Label>Motif</Label>
            <input value={form.reason ?? ""} onChange={(e) => set("reason", e.target.value)} placeholder="Motif du mouvement…" className={inp()}/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={save} disabled={saving || !form.product_id || !form.quantity}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: movType.color, color: "#07080e" }}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
            Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
