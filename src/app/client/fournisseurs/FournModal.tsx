"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, X, ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react";
import type { Fournisseur } from "./types";
import { CATEGORIES, COUNTRIES, CURRENCIES, PAYMENT_METHODS, ease, violet } from "./constants";
import { useDark, useInp, selStyle, Lbl } from "./ui";

export function FournModal({ data, onSave, onClose }: {
  data: Partial<Fournisseur>;
  onSave: (f: Partial<Fournisseur>) => Promise<void>;
  onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<Fournisseur>>(data);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const set = (k: keyof Fournisseur, v: string | number | boolean | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: violet + "18", border: `1px solid ${violet}30` }}>
              <Truck size={14} style={{ color: violet }}/>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>
                {form.id ? "Modifier fournisseur" : "Nouveau fournisseur"}
              </h3>
              <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>Étape {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
            <X size={14}/>
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {[1,2,3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? violet : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}/>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {step === 1 && (
            <>
              <div><Lbl>Nom de l&apos;entreprise *</Lbl>
                <input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} placeholder="ACME Fournisseurs SARL" className={inp()}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Contact principal</Lbl>
                  <input value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} placeholder="Prénom Nom" className={inp()}/>
                </div>
                <div><Lbl>Catégorie</Lbl>
                  <select value={form.category ?? "produits"} onChange={(e) => set("category", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Email</Lbl>
                  <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="contact@fournisseur.com" className={inp()}/>
                </div>
                <div><Lbl>Téléphone</Lbl>
                  <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+33 1 00 00 00 00" className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Adresse</Lbl>
                  <input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="123 rue de la Paix" className={inp()}/>
                </div>
                <div><Lbl>Ville</Lbl>
                  <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Paris" className={inp()}/>
                </div>
              </div>
              <div><Lbl>Pays</Lbl>
                <select value={form.country ?? "France"} onChange={(e) => set("country", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Lbl>Site web</Lbl>
                <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://fournisseur.com" className={inp()}/>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>SIRET</Lbl>
                  <input value={form.siret ?? ""} onChange={(e) => set("siret", e.target.value)} placeholder="123 456 789 00012" className={inp()}/>
                </div>
                <div><Lbl>N° TVA</Lbl>
                  <input value={form.vat_number ?? ""} onChange={(e) => set("vat_number", e.target.value)} placeholder="FR 12 345678901" className={inp()}/>
                </div>
              </div>
              <div><Lbl>IBAN</Lbl>
                <input value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" className={inp()}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Lbl>Mode de paiement</Lbl>
                  <select value={form.payment_method ?? "virement"} onChange={(e) => set("payment_method", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><Lbl>Conditions</Lbl>
                  <input value={form.payment_terms ?? "30 jours"} onChange={(e) => set("payment_terms", e.target.value)} placeholder="30 jours" className={inp()}/>
                </div>
                <div><Lbl>Devise</Lbl>
                  <select value={form.currency ?? "EUR"} onChange={(e) => set("currency", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><Lbl>Limite de crédit (€)</Lbl>
                <input type="number" value={form.credit_limit ?? 0} onChange={(e) => set("credit_limit", parseFloat(e.target.value))} className={inp()}/>
              </div>
              <div><Lbl>Expiration contrat</Lbl>
                <input type="date" value={form.contract_expires_at ?? ""} onChange={(e) => set("contract_expires_at", e.target.value || null)} className={inp()}/>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div><Lbl>Notes internes</Lbl>
                <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Informations importantes sur ce fournisseur…" className={inp("resize-none")}/>
              </div>
              <div className={`rounded-2xl p-4 space-y-3 border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-xs font-bold ${isDark ? "text-white/50" : "text-gray-500"}`}>Récapitulatif</p>
                <div className={`grid grid-cols-2 gap-2 text-xs ${isDark ? "text-white/60" : "text-gray-700"}`}>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Société : </span>{form.company_name}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Catégorie : </span>{CATEGORIES.find((c) => c.value === form.category)?.label}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Email : </span>{form.email || "—"}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Paiement : </span>{form.payment_terms}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>SIRET : </span>{form.siret || "—"}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Devise : </span>{form.currency}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
              <ChevronLeft size={14}/>Retour
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!form.company_name}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              Suivant <ChevronRight size={14} className="inline-block"/>
            </button>
          ) : (
            <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.company_name}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
              {form.id ? "Enregistrer" : "Créer le fournisseur"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Re-export AnimatePresence for convenience (used in parent)
export { AnimatePresence };
