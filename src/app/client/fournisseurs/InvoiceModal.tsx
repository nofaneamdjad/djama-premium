"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, RefreshCw } from "lucide-react";
import { calcVat } from "@/lib/fournisseurs-calc";
import type { FInvoice, Fournisseur } from "./types";
import { INV_STATUS, PAYMENT_METHODS, ease } from "./constants";
import { useDark, useInp, selStyle, Lbl } from "./ui";

export function InvoiceModal({ fournisseurs, invoice, onSave, onClose }: {
  fournisseurs: Fournisseur[];
  invoice: Partial<FInvoice>;
  onSave: (i: Partial<FInvoice>) => Promise<void>;
  onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<FInvoice>>(invoice);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FInvoice, v: string | number | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>
            {form.id ? "Modifier facture" : "Nouvelle facture fournisseur"}
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
            <div><Lbl>N° de facture</Lbl>
              <input value={form.invoice_number ?? ""} onChange={(e) => set("invoice_number", e.target.value)} placeholder="FAC-2026-001" className={inp()}/>
            </div>
            <div><Lbl>Statut</Lbl>
              <select value={form.status ?? "unpaid"} onChange={(e) => set("status", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Date d&apos;émission</Lbl>
              <input type="date" value={form.issue_date ?? ""} onChange={(e) => set("issue_date", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Échéance</Lbl>
              <input type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} className={inp()}/>
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
            <div><Lbl>Montant HT</Lbl>
              <input type="number" min={0} step={0.01} value={form.subtotal ?? 0} onChange={(e) => {
                const ht = parseFloat(e.target.value) || 0;
                const { vatAmount, total } = calcVat(ht, form.vat_rate ?? 20);
                setForm((p) => ({ ...p, subtotal: ht, vat_amount: vatAmount, total_amount: total }));
              }} className={inp()}/>
            </div>
            <div><Lbl>TVA</Lbl>
              <input readOnly value={(form.vat_amount ?? 0).toFixed(2)} className={inp("opacity-50")}/>
            </div>
            <div><Lbl>Total TTC</Lbl>
              <input readOnly value={(form.total_amount ?? 0).toFixed(2)} className={inp("opacity-50")}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Montant payé</Lbl>
              <input type="number" min={0} step={0.01} value={form.paid_amount ?? 0} onChange={(e) => set("paid_amount", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Lbl>Mode de paiement</Lbl>
              <select value={form.payment_method ?? ""} onChange={(e) => set("payment_method", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                <option value="">Non défini</option>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div><Lbl>Notes</Lbl>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
            Annuler
          </button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
            disabled={saving || !form.fournisseur_id}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Check size={13}/>}
            {form.id ? "Enregistrer" : "Créer la facture"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
