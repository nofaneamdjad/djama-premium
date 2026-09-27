"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw } from "lucide-react";
import { Star } from "lucide-react";
import type { Fournisseur } from "./types";
import { ease, violet } from "./constants";
import { useDark, useInp, Lbl, Stars } from "./ui";

export function RatingModal({ fournisseur, onSave, onClose }: {
  fournisseur: Fournisseur;
  onSave: (r: { reliability: number; quality: number; price: number; delays: number; comment: string }) => Promise<void>;
  onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState({ reliability: 3, quality: 3, price: 3, delays: 3, comment: "" });
  const [saving, setSaving] = useState(false);

  const criteria = [
    { key: "reliability" as const, label: "Fiabilité" },
    { key: "quality"     as const, label: "Qualité" },
    { key: "price"       as const, label: "Prix" },
    { key: "delays"      as const, label: "Délais" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>
            Évaluer — {fournisseur.company_name}
          </h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
            <X size={14}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {criteria.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? "text-white/70" : "text-gray-600"}`}>{label}</span>
              <Stars value={form[key]} onChange={(n) => setForm((p) => ({ ...p, [key]: n }))}/>
            </div>
          ))}

          <div><Lbl>Commentaire</Lbl>
            <textarea value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
              rows={3} placeholder="Observations…" className={inp("resize-none")}/>
          </div>

          <div className={`text-center p-3 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-gray-400"}`}>Score moyen</p>
            <p className="text-2xl font-bold" style={{ color: violet }}>
              {((form.reliability + form.quality + form.price + form.delays) / 4).toFixed(1)}/5
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border ${isDark ? "text-white/50 border-white/10" : "text-gray-500 border-gray-200"}`}>
            Annuler
          </button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Star size={13}/>}
            Enregistrer l&apos;évaluation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
