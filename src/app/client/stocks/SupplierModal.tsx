"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw } from "lucide-react";
import type { Supplier } from "./types";
import { ease } from "./constants";
import { useDark, useInp, Label } from "./ui";

export function SupplierModal({ supplier, onSave, onClose }: {
  supplier: Partial<Supplier>; onSave: (s: Partial<Supplier>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Supplier>>(supplier);
  const [saving, setSaving] = useState(false);
  const isDark = useDark();
  const inp = useInp();
  const set = (k: keyof Supplier, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier fournisseur" : "Nouveau fournisseur"}</h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto max-h-[65vh]">
          <div><Label>Nom *</Label><input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Nom du fournisseur" className={inp()}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact</Label><input value={form.contact ?? ""} onChange={(e) => set("contact", e.target.value)} placeholder="Nom du contact" className={inp()}/></div>
            <div><Label>Email</Label><input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="email@fournisseur.com" className={inp()}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Téléphone</Label><input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+33 6 00 00 00 00" className={inp()}/></div>
            <div><Label>Délai livraison (jours)</Label><input type="number" value={form.lead_time_days ?? 7} onChange={(e) => set("lead_time_days", parseInt(e.target.value))} className={inp()}/></div>
          </div>
          <div><Label>Conditions de paiement</Label><input value={form.payment_terms ?? "30 jours"} onChange={(e) => set("payment_terms", e.target.value)} className={inp()}/></div>
          <div><Label>Adresse</Label><input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inp()}/></div>
          <div><Label>Notes</Label><textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={async () => { if (!form.name) return; setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin inline"/> : form.id ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
