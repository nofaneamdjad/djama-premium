"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Check } from "lucide-react";
import type { DraftForm, ContractType } from "./types";
import { gold, ease, CONTRACT_TYPES, TYPE_MAP, JURISDICTIONS, CURRENCIES, SUGGESTED_CLAUSES, EMPTY_FORM } from "./constants";
import { inp, Label } from "./ui";
import { supabase } from "@/lib/supabase";

export function CreateModal({
  onClose, onGenerate, onCreateBlank, generating, creating,
}: {
  onClose: () => void;
  onGenerate: (f: DraftForm) => void;
  onCreateBlank: (f: DraftForm) => void;
  generating: boolean; creating: boolean;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof DraftForm, v: string | string[]) => setForm((p) => ({ ...p, [k]: v }));

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `contracts/logos/${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("djama-media").upload(path, file, { upsert: true });
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from("djama-media").getPublicUrl(uploadData.path);
      set("logo", urlData.publicUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => set("logo", (ev.target?.result as string) ?? "");
      reader.readAsDataURL(file);
    }
  };

  const toggleClause = (c: string) => {
    set("selected_clauses", form.selected_clauses.includes(c)
      ? form.selected_clauses.filter((x) => x !== c)
      : [...form.selected_clauses, c]);
  };

  const canNext = step === 1 ? !!form.type
    : step === 2 ? !!(form.title && form.client_name)
    : true;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.4, ease }}
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <FileText size={14} style={{ color: gold }}/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Nouveau contrat IA</h3>
              <p className="text-[10px] text-white/30">Étape {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? gold : "rgba(255,255,255,0.08)" }}/>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {step === 1 && (
            <div>
              <p className="text-sm font-bold text-white/70 mb-4">Quel type de contrat ?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONTRACT_TYPES.map((t) => {
                  const TIcon = t.icon;
                  return (
                    <button key={t.value} onClick={() => set("type", t.value)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all ${form.type === t.value ? "border-transparent" : "border-white/[0.06] hover:border-white/[0.14] bg-white/[0.025]"}`}
                      style={form.type === t.value ? { background: gold + "14", border: `1px solid ${gold}40` } : {}}>
                      <TIcon size={18} className="text-white/50 mb-0.5"/>
                      <span className="text-xs font-bold text-white/80">{t.label}</span>
                      <span className="text-[10px] text-white/35">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label>Logo société (optionnel)</Label>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden"/>
                {form.logo ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logo} alt="Logo" className="h-10 w-auto max-w-[80px] object-contain rounded"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60">Logo chargé</p>
                      <p className="text-[10px] text-white/30 truncate">Affiché dans le PDF du contrat</p>
                    </div>
                    <button onClick={() => set("logo", "")} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-red-400 transition-colors">
                      <X size={12}/>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.2] transition-all text-left">
                    <div className="h-8 w-8 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
                      <ImageIcon size={14} style={{ color: gold }}/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/60">Ajouter un logo</p>
                      <p className="text-[10px] text-white/30">PNG, JPG, SVG · Apparaîtra dans le PDF</p>
                    </div>
                    <Upload size={13} className="ml-auto text-white/25"/>
                  </button>
                )}
              </div>
              <div><Label>Intitulé *</Label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Mission développement web" className={inp()}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client *</Label>
                  <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Nom du client" className={inp()}/>
                </div>
                <div><Label>Société</Label>
                  <input value={form.client_company} onChange={(e) => set("client_company", e.target.value)} placeholder="Entreprise" className={inp()}/>
                </div>
              </div>
              <div><Label>Email client</Label>
                <input type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} placeholder="client@email.com" className={inp()}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Montant</Label>
                  <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="5000" className={inp()}/>
                </div>
                <div><Label>Devise</Label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inp("appearance-none")}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Durée (mois)</Label>
                  <input type="number" value={form.duration_months} onChange={(e) => set("duration_months", e.target.value)} placeholder="12" className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Début</Label>
                  <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inp()}/>
                </div>
                <div><Label>Fin</Label>
                  <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Juridiction</Label>
                  <select value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} className={inp("appearance-none")}>
                    {JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}
                  </select>
                </div>
                <div><Label>Langue</Label>
                  <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inp("appearance-none")}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-white/60 mb-2">Clauses suggérées pour {TYPE_MAP[form.type as ContractType]}</p>
                <div className="space-y-1.5">
                  {SUGGESTED_CLAUSES[form.type as ContractType].map((clause) => (
                    <button key={clause} onClick={() => toggleClause(clause)}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${form.selected_clauses.includes(clause) ? "border-transparent" : "border-white/[0.06] text-white/50 hover:border-white/[0.14]"}`}
                      style={form.selected_clauses.includes(clause) ? { background: gold + "12", border: `1px solid ${gold}35`, color: gold } : {}}>
                      <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${form.selected_clauses.includes(clause) ? "" : "border-white/20"}`}
                        style={form.selected_clauses.includes(clause) ? { background: gold, border: "none" } : {}}>
                        {form.selected_clauses.includes(clause) && <Check size={9} color="#0a0f1e"/>}
                      </div>
                      {clause}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Clauses supplémentaires (optionnel)</Label>
                <textarea value={form.specifics} onChange={(e) => set("specifics", e.target.value)}
                  placeholder="Autres conditions spécifiques à votre contrat…"
                  rows={3} className={inp("resize-none")}/>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">
              <ChevronLeft size={14} className="inline-block"/>Retour
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: gold, color: "#0a0f1e" }}>
              Suivant <ChevronRight size={14} className="inline-block"/>
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onGenerate(form)} disabled={generating || creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                style={{ background: gold, color: "#0a0f1e", boxShadow: `0 4px 16px ${gold}40` }}>
                {generating ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles size={15}/></motion.div>Génération…</> : <><Sparkles size={15}/> Générer IA</>}
              </motion.button>
              <button onClick={() => onCreateBlank(form)} disabled={generating || creating}
                className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors disabled:opacity-40">
                {creating ? <RefreshCw size={13} className="animate-spin"/> : "Vide"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

