"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, FileText, BarChart2, PiggyBank, Plus, X, Edit2, Trash2,
  Upload, Download, Search, Car, Coffee, Monitor, Building2, Package,
  Phone, BookOpen, Megaphone, ShoppingBag, HelpCircle, CreditCard,
  Banknote, Wallet, DollarSign, CheckCircle2, XCircle,
  Droplets, Calendar, FileCheck,
  AlertTriangle, Zap, ChevronDown,
} from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabase";
import Toast, { type ToastData } from "@/components/ui/Toast";

type ExpCat =
  | "transport" | "repas"   | "logiciel"  | "carburant" | "hotel"
  | "equipement"| "communication" | "formation" | "publicite"
  | "fournitures" | "autre";

type PayMethod = "carte_pro" | "carte_perso" | "virement" | "cash" | "autre";
type ExpStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed";
type Currency  = "EUR" | "USD" | "GBP" | "CHF" | "CAD" | "MAD";

interface Expense {
  id: string; user_id: string; expense_report_id: string | null;
  date: string; amount: number; currency: Currency;
  category: ExpCat; description: string;
  payment_method: PayMethod; status: ExpStatus;
  vat_amount: number; vat_recoverable: boolean;
  receipt_url: string; invoice_number: string;
  project: string; cost_center: string; notes: string;
  created_at: string; updated_at: string;
}

interface ExpenseReport {
  id: string; user_id: string; title: string;
  period_start: string | null; period_end: string | null;
  status: ExpStatus; total_amount: number; notes: string;
  submitted_at: string | null; approved_at: string | null;
  created_at: string; updated_at: string;
}

interface ExpenseBudget {
  id: string; user_id: string;
  category: ExpCat; amount: number;
  period: "monthly" | "yearly";
  year: number; month: number | null;
  created_at: string;
}

const CATS = [
  { v: "transport",     l: "Transport",     I: Car,        c: "#3b82f6" },
  { v: "repas",         l: "Repas",         I: Coffee,     c: "#f59e0b" },
  { v: "logiciel",      l: "Logiciel",      I: Monitor,    c: "#8b5cf6" },
  { v: "carburant",     l: "Carburant",     I: Droplets,   c: "#ef4444" },
  { v: "hotel",         l: "Hôtel",         I: Building2,  c: "#06b6d4" },
  { v: "equipement",    l: "Équipement",    I: Package,    c: "#10b981" },
  { v: "communication", l: "Communication", I: Phone,      c: "#6366f1" },
  { v: "formation",     l: "Formation",     I: BookOpen,   c: "#ec4899" },
  { v: "publicite",     l: "Publicité",     I: Megaphone,  c: "#f97316" },
  { v: "fournitures",   l: "Fournitures",   I: ShoppingBag,c: "#84cc16" },
  { v: "autre",         l: "Autre",         I: HelpCircle, c: "#6b7280" },
] as const;

const PAY_METHODS = [
  { v: "carte_pro",   l: "Carte pro",   I: CreditCard },
  { v: "carte_perso", l: "Carte perso", I: CreditCard },
  { v: "virement",    l: "Virement",    I: Banknote   },
  { v: "cash",        l: "Espèces",     I: Wallet     },
  { v: "autre",       l: "Autre",       I: DollarSign },
] as const;

const STATUSES = [
  { v: "draft",      l: "Brouillon", c: "#6b7280" },
  { v: "submitted",  l: "Soumis",    c: "#3b82f6" },
  { v: "approved",   l: "Approuvé",  c: "#10b981" },
  { v: "rejected",   l: "Refusé",    c: "#ef4444" },
  { v: "reimbursed", l: "Remboursé", c: "#8b5cf6" },
] as const;

const CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "CHF", "CAD", "MAD"];

const BLANK: Partial<Expense> = {
  date: new Date().toISOString().slice(0, 10),
  amount: 0, currency: "EUR", category: "autre", description: "",
  payment_method: "carte_pro", status: "draft",
  vat_amount: 0, vat_recoverable: false,
  receipt_url: "", invoice_number: "", project: "", cost_center: "", notes: "",
};

const fmtCur = (n: number, c = "EUR") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const fmtMonthYear = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

const getCat = (v: string) => CATS.find(c => c.v === v) ?? CATS[CATS.length - 1];
const getSt  = (v: string) => STATUSES.find(s => s.v === v) ?? STATUSES[0];

function CatBadge({ cat }: { cat: ExpCat }) {
  const { I, l, c } = getCat(cat);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold"
      style={{ backgroundColor: c + "22", color: c }}>
      <I size={10} />{l}
    </span>
  );
}

function StBadge({ st }: { st: ExpStatus }) {
  const { l, c } = getSt(st);
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ backgroundColor: c + "22", color: c }}>
      {l}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[0.65rem] font-medium text-white/35">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[0.8rem] text-white placeholder-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all";
const sel = "w-full rounded-xl border border-white/[0.08] bg-[#131c30] px-3 py-2.5 pr-8 text-[0.8rem] text-white outline-none appearance-none [color-scheme:dark] focus:border-white/[0.15] transition-all";

function ExpenseModal({
  expense, reports, userId, onSave, onClose,
}: {
  expense: Partial<Expense> | null;
  reports: ExpenseReport[];
  userId: string;
  onSave: (e: Expense) => void;
  onClose: () => void;
}) {
  const supabase = supabaseClient;
  const fileRef  = useRef<HTMLInputElement>(null);
  const [form,     setForm]     = useState<Partial<Expense>>(expense ?? { ...BLANK });
  const [uploading,setUploading]= useState(false);
  const [saving,   setSaving]   = useState(false);
  const [ocrHint,  setOcrHint]  = useState(false);

  const set = (k: keyof Expense, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function uploadReceipt(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      set("receipt_url", data.publicUrl);
    } catch {
      alert("Erreur upload. Vérifiez que le bucket 'receipts' existe dans Supabase Storage.");
    } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!form.description?.trim() || !form.amount) return;
    setSaving(true);
    const payload = {
      ...form, user_id: userId,
      amount:     Number(form.amount),
      vat_amount: Number(form.vat_amount ?? 0),
    };
    if (expense?.id) {
      const { data, error } = await supabase.from("expenses").update(payload).eq("id", expense.id).select().single();
      if (!error && data) onSave(data as Expense);
    } else {
      const { data, error } = await supabase.from("expenses").insert(payload).select().single();
      if (!error && data) onSave(data as Expense);
    }
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 space-y-4"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {expense?.id ? "Modifier la dépense" : "Nouvelle dépense"}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors"><X size={18} /></button>
        </div>

                <div className="grid grid-cols-3 gap-3">
          <Field label="Date">
            <input type="date" value={form.date ?? ""} onChange={e => set("date", e.target.value)} className={`${inp} [color-scheme:dark]`} />
          </Field>
          <Field label="Montant">
            <input type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount ?? ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className={inp} />
          </Field>
          <Field label="Devise">
            <div className="relative">
              <select value={form.currency ?? "EUR"} onChange={e => set("currency", e.target.value)} className={sel}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        </div>

                <Field label="Description / Motif">
          <input type="text" placeholder="Ex: Déjeuner client Paris"
            value={form.description ?? ""} onChange={e => set("description", e.target.value)} className={inp} />
        </Field>

                <Field label="Catégorie">
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {CATS.map(({ v, l, I, c }) => (
              <button key={v} type="button" onClick={() => set("category", v)}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-[0.58rem] font-medium border transition-all"
                style={{
                  backgroundColor: form.category === v ? c + "2a" : "transparent",
                  borderColor:     form.category === v ? c + "55" : "rgba(255,255,255,0.06)",
                  color:           form.category === v ? c : "rgba(255,255,255,0.35)",
                }}>
                <I size={13} />
                <span className="truncate w-full text-center leading-tight">{l}</span>
              </button>
            ))}
          </div>
        </Field>

                <div className="grid grid-cols-2 gap-3">
          <Field label="Moyen de paiement">
            <div className="relative">
              <select value={form.payment_method ?? "carte_pro"} onChange={e => set("payment_method", e.target.value)} className={sel}>
                {PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
          <Field label="Statut">
            <div className="relative">
              <select value={form.status ?? "draft"} onChange={e => set("status", e.target.value)} className={sel}>
                {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        </div>

                <div className="grid grid-cols-2 gap-3">
          <Field label="Montant TVA (€)">
            <input type="number" step="0.01" min="0" placeholder="0.00"
              value={form.vat_amount ?? ""} onChange={e => set("vat_amount", parseFloat(e.target.value) || 0)} className={inp} />
          </Field>
          <Field label="TVA récupérable">
            <button type="button" onClick={() => set("vat_recoverable", !form.vat_recoverable)}
              className={`h-[42px] w-full rounded-xl border flex items-center gap-2 px-3 text-[0.78rem] font-medium transition-all ${
                form.vat_recoverable
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-white/[0.08] bg-white/[0.04] text-white/30"
              }`}>
              {form.vat_recoverable ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {form.vat_recoverable ? "Récupérable" : "Non récupérable"}
            </button>
          </Field>
        </div>

                <div className="grid grid-cols-3 gap-3">
          <Field label="N° Facture">
            <input type="text" placeholder="FACT-001"
              value={form.invoice_number ?? ""} onChange={e => set("invoice_number", e.target.value)} className={inp} />
          </Field>
          <Field label="Projet">
            <input type="text" placeholder="Ex: Alpha"
              value={form.project ?? ""} onChange={e => set("project", e.target.value)} className={inp} />
          </Field>
          <Field label="Centre de coût">
            <input type="text" placeholder="Ex: MKT-01"
              value={form.cost_center ?? ""} onChange={e => set("cost_center", e.target.value)} className={inp} />
          </Field>
        </div>

                {reports.length > 0 && (
          <Field label="Note de frais associée">
            <div className="relative">
              <select value={form.expense_report_id ?? ""} onChange={e => set("expense_report_id", e.target.value || null)} className={sel}>
                <option value="">— Sans note de frais —</option>
                {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        )}

                <Field label="Notes internes">
          <textarea rows={2} placeholder="Notes…"
            value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
            className={`${inp} resize-none`} />
        </Field>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-medium text-white/35">Justificatif</span>
            <button type="button" onClick={() => setOcrHint(h => !h)}
              className="flex items-center gap-1.5 text-[0.65rem] text-purple-400/60 hover:text-purple-400 transition-colors">
              <Zap size={11} /> Scan IA
            </button>
          </div>
          {ocrHint && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-[0.65rem] text-purple-300">
              Lecture automatique du ticket par IA — bientôt disponible.
            </div>
          )}
          {form.receipt_url ? (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/\.(jpe?g|png|webp)$/i.test(form.receipt_url) ? (
                  <a href={form.receipt_url} target="_blank" rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-white/[0.08]">
                                        <img src={form.receipt_url} alt="Justificatif" className="w-full max-h-36 object-cover" />
                  </a>
                ) : (
                  <a href={form.receipt_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[0.72rem] text-blue-400 hover:text-blue-300 transition-colors">
                    <FileCheck size={14} /> Voir le justificatif (PDF)
                  </a>
                )}
              </div>
              <button type="button" onClick={() => set("receipt_url", "")}
                className="shrink-0 rounded-lg p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] py-5 hover:border-white/20 hover:bg-white/[0.04] transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload size={18} className="text-white/20" />
              <span className="px-4 text-center text-[0.68rem] text-white/25">
                {uploading ? "Envoi en cours…" : "Cliquez pour uploader · JPG, PNG, PDF · max 10 Mo"}
              </span>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (f) await uploadReceipt(f);
                }} />
            </label>
          )}
        </div>

                <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.78rem] text-white/40 hover:text-white/60 transition-colors">
            Annuler
          </button>
          <button type="button" onClick={handleSave} disabled={saving || uploading}
            className="flex-1 rounded-xl py-2.5 text-[0.78rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? "Enregistrement…" : expense?.id ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReportModal({
  report, onSave, onClose,
}: {
  report: ExpenseReport | null;
  onSave: (f: Partial<ExpenseReport>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ExpenseReport>>(
    report ?? { title: "", status: "draft", notes: "" }
  );
  const set = (k: keyof ExpenseReport, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {report ? "Modifier la note" : "Nouvelle note de frais"}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors"><X size={18} /></button>
        </div>
        <Field label="Titre">
          <input className={inp} placeholder="Ex: Frais déplacement Mars 2025"
            value={form.title ?? ""} onChange={e => set("title", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début période">
            <input type="date" className={inp} value={form.period_start ?? ""}
              onChange={e => set("period_start", e.target.value || null)} />
          </Field>
          <Field label="Fin période">
            <input type="date" className={inp} value={form.period_end ?? ""}
              onChange={e => set("period_end", e.target.value || null)} />
          </Field>
        </div>
        <Field label="Statut">
          <div className="relative">
            <select className={sel} value={form.status ?? "draft"} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </Field>
        <Field label="Notes">
          <textarea rows={2} className={`${inp} resize-none`} placeholder="Notes…"
            value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.78rem] text-white/40 hover:text-white/60 transition-colors">
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={!form.title?.trim()}
            className="flex-1 rounded-xl py-2.5 text-[0.78rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {report ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BudgetInput({ value, onSave, color }: { value: number; onSave: (v: number) => void; color: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  function commit() { onSave(parseFloat(val) || 0); setEditing(false); }

  if (!editing) return (
    <button onClick={() => { setVal(String(value)); setEditing(true); }}
      className="min-w-[72px] text-right text-[0.72rem] text-white/50 hover:text-white transition-colors">
      {value > 0 ? fmtCur(value) : <span className="text-white/25">+ Budget</span>}
    </button>
  );
  return (
    <input autoFocus type="number" value={val} onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className="w-20 rounded-lg border bg-white/[0.06] px-2 py-0.5 text-right text-[0.72rem] text-white outline-none"
      style={{ borderColor: color + "44" }} />
  );
}

function BudgetView({
  expenses, budgets, userId, onBudgetsChange,
}: {
  expenses: Expense[];
  budgets: ExpenseBudget[];
  userId: string;
  onBudgetsChange: (b: ExpenseBudget[]) => void;
}) {
  const supabase = supabaseClient;
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [year, mo] = month.split("-").map(Number);

  const spent = useMemo(() => {
    const result: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.date.startsWith(month) && e.status !== "rejected") {
        result[e.category] = (result[e.category] ?? 0) + e.amount;
      }
    });
    return result;
  }, [expenses, month]);

  const getBudget = (cat: string) =>
    budgets.find(b => b.category === cat && b.period === "monthly" && b.year === year && b.month === mo)?.amount ?? 0;

  async function saveBudget(cat: string, amount: number) {
    const existing = budgets.find(b => b.category === cat && b.period === "monthly" && b.year === year && b.month === mo);
    if (existing) {
      const { data } = await supabase.from("expense_budgets").update({ amount }).eq("id", existing.id).select().single();
      if (data) onBudgetsChange(budgets.map(b => b.id === existing.id ? data as ExpenseBudget : b));
    } else {
      const { data } = await supabase.from("expense_budgets").insert({
        user_id: userId, category: cat, amount, period: "monthly", year, month: mo,
      }).select().single();
      if (data) onBudgetsChange([...budgets, data as ExpenseBudget]);
    }
  }

  const totalBudget = CATS.reduce((a, { v }) => a + getBudget(v), 0);
  const totalSpent  = Object.values(spent).reduce((a, b) => a + b, 0);
  const over = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <Calendar size={13} className="shrink-0 text-white/30" />
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="[color-scheme:dark] bg-transparent text-[0.78rem] text-white outline-none" />
        </div>
        <p className="text-[0.72rem] text-white/40">
          Budget total : <span className="font-semibold text-white">{fmtCur(totalBudget)}</span>
          {" · "}Dépensé : <span className={`font-semibold ${over ? "text-red-400" : "text-green-400"}`}>{fmtCur(totalSpent)}</span>
          {totalBudget > 0 && (
            <span className={`ml-1 ${over ? "text-red-400" : "text-white/30"}`}>
              ({over ? "+" : ""}{fmtCur(totalSpent - totalBudget)})
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        {CATS.map(({ v, l, I, c }) => {
          const budget = getBudget(v);
          const s    = spent[v] ?? 0;
          const pct  = budget > 0 ? Math.min((s / budget) * 100, 100) : 0;
          const catOver = budget > 0 && s > budget;
          return (
            <div key={v} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c + "22" }}>
                  <I size={13} style={{ color: c }} />
                </div>
                <span className="flex-1 text-[0.78rem] font-medium text-white/80">{l}</span>
                <span className="text-[0.72rem] text-white/50">{fmtCur(s)}</span>
                <span className="text-[0.6rem] text-white/20">/</span>
                <BudgetInput value={budget} onSave={v2 => saveBudget(v, v2)} color={c} />
                {catOver && <AlertTriangle size={13} className="shrink-0 text-red-400" />}
              </div>
              {budget > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ backgroundColor: catOver ? "#ef4444" : c }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RapportView({ expenses }: { expenses: Expense[] }) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const valid = useMemo(() => expenses.filter(e => e.status !== "rejected"), [expenses]);

  const thisTotal = useMemo(() => valid.filter(e => e.date.startsWith(thisMonth)).reduce((a, e) => a + e.amount, 0), [valid, thisMonth]);
  const lastTotal = useMemo(() => valid.filter(e => e.date.startsWith(lastMonth)).reduce((a, e) => a + e.amount, 0), [valid, lastMonth]);
  const totalVAT  = useMemo(() => expenses.filter(e => e.vat_recoverable).reduce((a, e) => a + e.vat_amount, 0), [expenses]);
  const toReimb   = useMemo(() => expenses.filter(e => e.payment_method === "carte_perso" && e.status !== "reimbursed" && e.status !== "rejected").reduce((a, e) => a + e.amount, 0), [expenses]);

  const pct = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  const byCat = useMemo(() => {
    const r: Record<string, number> = {};
    valid.forEach(e => { r[e.category] = (r[e.category] ?? 0) + e.amount; });
    return Object.entries(r).sort((a, b) => b[1] - a[1]);
  }, [valid]);

  const byPay = useMemo(() => {
    const r: Record<string, number> = {};
    valid.forEach(e => { r[e.payment_method] = (r[e.payment_method] ?? 0) + e.amount; });
    return Object.entries(r).sort((a, b) => b[1] - a[1]);
  }, [valid]);

  const trend = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      key,
      total: valid.filter(e => e.date.startsWith(key)).reduce((a, e) => a + e.amount, 0),
    };

  }), [valid]);

  const maxTrend = Math.max(...trend.map(t => t.total), 1);
  const maxCat   = byCat[0]?.[1] ?? 1;
  const allTotal = valid.reduce((a, e) => a + e.amount, 0) || 1;
  const top5     = useMemo(() => [...valid].sort((a, b) => b.amount - a.amount).slice(0, 5), [valid]);

  const KPI = [
    { l: "Ce mois",         v: fmtCur(thisTotal),
      sub: pct !== 0 ? `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}% vs mois précédent` : "Premier mois enregistré",
      c: pct > 0 ? "#ef4444" : "#10b981" },
    { l: "Mois précédent",  v: fmtCur(lastTotal),  sub: fmtMonthYear(lastMonth),    c: "#3b82f6" },
    { l: "TVA récupérable", v: fmtCur(totalVAT),   sub: "Toutes dépenses confondues", c: "#8b5cf6" },
    { l: "À rembourser",    v: fmtCur(toReimb),    sub: "Paiements carte perso",     c: "#f59e0b" },
  ];

  return (
    <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI.map(({ l, v, sub, c }) => (
          <div key={l} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-1">
            <p className="text-[0.65rem] font-medium text-white/35">{l}</p>
            <p className="text-xl font-bold leading-none text-white">{v}</p>
            <p className="text-[0.62rem] leading-tight" style={{ color: c }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Tendance 6 mois</h3>
          <div className="flex items-end gap-2" style={{ height: "100px" }}>
            {trend.map(({ label, key, total }) => (
              <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                {total > 0 && (
                  <span className="text-[0.5rem] text-white/30">
                    {(total / 1000).toFixed(0)}k
                  </span>
                )}
                <div className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((total / maxTrend) * 72, 4)}px`,
                    backgroundColor: key === thisMonth ? "#c9a55a" : "rgba(255,255,255,0.08)",
                  }} />
                <span className="text-[0.55rem] text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Par catégorie</h3>
          {byCat.length === 0
            ? <p className="py-6 text-center text-[0.72rem] text-white/20">Aucune dépense</p>
            : (
              <div className="space-y-2.5">
                {byCat.slice(0, 7).map(([cat, total]) => {
                  const info = getCat(cat);
                  const Icon = info.I;
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <Icon size={11} style={{ color: info.c }} className="shrink-0" />
                      <span className="w-20 shrink-0 truncate text-[0.65rem] text-white/50">{info.l}</span>
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${(total / maxCat) * 100}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          style={{ backgroundColor: info.c }} />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[0.65rem] font-semibold text-white/60">{fmtCur(total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Par moyen de paiement</h3>
          {byPay.length === 0
            ? <p className="py-6 text-center text-[0.72rem] text-white/20">Aucune dépense</p>
            : (
              <div className="space-y-3">
                {byPay.map(([pay, total]) => {
                  const info = PAY_METHODS.find(m => m.v === pay);
                  const Icon = info?.I ?? CreditCard;
                  const share = (total / allTotal) * 100;
                  return (
                    <div key={pay} className="flex items-center gap-3">
                      <Icon size={13} className="shrink-0 text-white/30" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[0.68rem] text-white/60">{info?.l ?? pay}</span>
                          <span className="text-[0.68rem] font-semibold text-white/70">{fmtCur(total)}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div className="h-full rounded-full bg-white/25"
                            initial={{ width: 0 }} animate={{ width: `${share}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }} />
                        </div>
                      </div>
                      <span className="shrink-0 text-[0.62rem] text-white/25">{share.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/30">Top dépenses</h3>
          {top5.length === 0
            ? <p className="py-6 text-center text-[0.72rem] text-white/20">Aucune dépense</p>
            : (
              <div className="space-y-1.5">
                {top5.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.02] transition-colors">
                    <span className="w-4 text-[0.6rem] font-semibold text-white/20">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[0.75rem] font-semibold text-white/80">{e.description}</p>
                      <p className="text-[0.6rem] text-white/30">{fmtDate(e.date)} · {getCat(e.category).l}</p>
                    </div>
                    <span className="shrink-0 text-[0.8rem] font-bold text-white">{fmtCur(e.amount, e.currency)}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function DepensesPage() {
  const supabase = supabaseClient;
  const [userId,  setUserId]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<ToastData | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports,  setReports]  = useState<ExpenseReport[]>([]);
  const [budgets,  setBudgets]  = useState<ExpenseBudget[]>([]);

  const [tab,             setTab]             = useState<"depenses"|"notes"|"budgets"|"rapport">("depenses");
  const [showModal,       setShowModal]       = useState(false);
  const [editExpense,     setEditExpense]     = useState<Expense | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport,      setEditReport]      = useState<ExpenseReport | null>(null);

  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("");
  const [filterSt,    setFilterSt]    = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterPay,   setFilterPay]   = useState("");

  const toast$ = (msg: string, type: "success"|"error" = "success") => setToast({ msg, type });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });

  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [eRes, rRes, bRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("expense_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("expense_budgets").select("*").eq("user_id", userId),
    ]);
    if (eRes.data) setExpenses(eRes.data as Expense[]);
    if (rRes.data) setReports(rRes.data as ExpenseReport[]);
    if (bRes.data) setBudgets(bRes.data as ExpenseBudget[]);
    setLoading(false);

  }, [userId]);

  useEffect(() => { if (userId) loadAll(); }, [userId, loadAll]);

    const filtered = useMemo(() => expenses.filter(e => {
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) &&
        !e.project.toLowerCase().includes(search.toLowerCase()) &&
        !e.invoice_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat   && e.category       !== filterCat)  return false;
    if (filterSt    && e.status         !== filterSt)   return false;
    if (filterPay   && e.payment_method !== filterPay)  return false;
    if (filterMonth && !e.date.startsWith(filterMonth)) return false;
    return true;
  }), [expenses, search, filterCat, filterSt, filterPay, filterMonth]);

  const filteredTotal = useMemo(() => filtered.filter(e => e.status !== "rejected").reduce((a, e) => a + e.amount, 0), [filtered]);
  const filteredVAT   = useMemo(() => filtered.filter(e => e.vat_recoverable).reduce((a, e) => a + e.vat_amount, 0), [filtered]);
  const filteredReimb = useMemo(() => filtered.filter(e => e.payment_method === "carte_perso" && e.status !== "reimbursed" && e.status !== "rejected").reduce((a, e) => a + e.amount, 0), [filtered]);
  const hasFilters    = !!(search || filterCat || filterSt || filterMonth || filterPay);

    async function deleteExpense(id: string) {
    if (!confirm("Supprimer cette dépense ?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast$("Erreur de suppression", "error");
    setExpenses(es => es.filter(e => e.id !== id));
    toast$("Dépense supprimée");
  }

  async function updateStatus(id: string, status: ExpStatus) {
    const { error } = await supabase.from("expenses").update({ status }).eq("id", id);
    if (error) return toast$("Erreur", "error");
    setExpenses(es => es.map(e => e.id === id ? { ...e, status } : e));
    toast$("Statut mis à jour");
  }

    async function saveReport(form: Partial<ExpenseReport>) {
    if (!form.title?.trim() || !userId) return;
    if (editReport) {
      const { data, error } = await supabase.from("expense_reports").update(form).eq("id", editReport.id).select().single();
      if (error) return toast$("Erreur", "error");
      setReports(rs => rs.map(r => r.id === editReport.id ? data as ExpenseReport : r));
      toast$("Note mise à jour");
    } else {
      const { data, error } = await supabase.from("expense_reports").insert({ ...form, user_id: userId }).select().single();
      if (error) return toast$("Erreur de création", "error");
      setReports(rs => [data as ExpenseReport, ...rs]);
      toast$("Note de frais créée");
    }
    setShowReportModal(false);
    setEditReport(null);
  }

  async function deleteReport(id: string) {
    if (!confirm("Supprimer cette note de frais ?")) return;
    const { error } = await supabase.from("expense_reports").delete().eq("id", id);
    if (error) return toast$("Erreur", "error");
    setReports(rs => rs.filter(r => r.id !== id));
    setExpenses(es => es.map(e => e.expense_report_id === id ? { ...e, expense_report_id: null } : e));
    toast$("Note supprimée");
  }

    function exportCSV() {
    const h = ["Date","Description","Catégorie","Montant","Devise","TVA","TVA récup.","Paiement","Statut","Projet","Centre coût","N° Facture"];
    const rows = filtered.map(e => [
      e.date, `"${e.description}"`, getCat(e.category).l,
      e.amount, e.currency, e.vat_amount, e.vat_recoverable ? "Oui" : "Non",
      PAY_METHODS.find(m => m.v === e.payment_method)?.l ?? e.payment_method,
      getSt(e.status).l, `"${e.project}"`, `"${e.cost_center}"`, `"${e.invoice_number}"`,
    ]);
    const csv  = [h.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "depenses.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const TABS = [
    { id: "depenses", l: "Dépenses",      I: Receipt,   badge: expenses.length },
    { id: "notes",    l: "Notes de frais",I: FileText,  badge: reports.filter(r => r.status === "submitted").length },
    { id: "budgets",  l: "Budgets",       I: PiggyBank, badge: 0 },
    { id: "rapport",  l: "Rapport",       I: BarChart2, badge: 0 },
  ] as const;

  const grandTotal = expenses.filter(e => e.status !== "rejected").reduce((a, e) => a + e.amount, 0);

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ background:"#0c1222" }}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#0c1222" }}>
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Animated header ── */}
      <div className="relative shrink-0 overflow-hidden px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>

        {/* Gold top line */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 h-[2px] origin-left"
          style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a,#c9a55a44,transparent)" }} />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle,#c9a55a,transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.25)" }}>
              <Receipt size={18} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Dépenses</h1>
              <p className="mt-0.5 text-[0.65rem] text-white/30">
                {expenses.length} dépense{expenses.length !== 1 ? "s" : ""} · {fmtCur(grandTotal)} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }} onClick={exportCSV} title="Exporter CSV"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Download size={14} />
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              onClick={() => { setEditExpense(null); setShowModal(true); }}
              className="flex h-8 items-center gap-2 rounded-xl px-4 text-[0.72rem] font-bold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              <Plus size={14} /> Dépense
            </motion.button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
          {[
            { l: "Total filtré",    v: fmtCur(filteredTotal), c: "#c9a55a", delay: 0.1 },
            { l: "TVA récupérable", v: fmtCur(filteredVAT),   c: "#10b981", delay: 0.15 },
            { l: "À rembourser",    v: fmtCur(filteredReimb), c: "#f59e0b", delay: 0.2 },
          ].map(({ l, v, c, delay }) => (
            <motion.div key={l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
              className="rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[0.6rem] font-semibold uppercase tracking-widest" style={{ color: c + "99" }}>{l}</p>
              <p className="mt-1 text-[1.05rem] font-black leading-tight text-white">{v}</p>
              <div className="mt-2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg,${c}60,transparent)` }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="relative shrink-0 flex border-b border-white/[0.07] px-4 sm:px-8"
        style={{ background: "rgba(6,8,14,0.5)" }}>
        {TABS.map(({ id, l, I }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[0.72rem] font-semibold transition-colors ${
              tab === id ? "text-white" : "text-white/30 hover:text-white/60"
            }`}>
            <I size={13} />{l}
            {tab === id && (
              <motion.div layoutId="dep-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a)" }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <AnimatePresence mode="wait">

            {tab === "depenses" && (
              <motion.div key="dep" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                    <Search size={13} className="shrink-0 text-white/25" />
                    <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                      className="flex-1 bg-transparent text-[0.78rem] text-white placeholder-white/20 outline-none" />
                  </div>
                  <div className="relative">
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                      className="appearance-none [color-scheme:dark] rounded-xl border border-white/[0.08] bg-[#0d1426] px-3 py-2 pr-7 text-[0.75rem] text-white/50 outline-none">
                      <option value="">Toutes catégories</option>
                      {CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                  </div>
                  <div className="relative">
                    <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
                      className="appearance-none [color-scheme:dark] rounded-xl border border-white/[0.08] bg-[#0d1426] px-3 py-2 pr-7 text-[0.75rem] text-white/50 outline-none">
                      <option value="">Tous statuts</option>
                      {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                  </div>
                  <div className="relative">
                    <select value={filterPay} onChange={e => setFilterPay(e.target.value)}
                      className="appearance-none [color-scheme:dark] rounded-xl border border-white/[0.08] bg-[#0d1426] px-3 py-2 pr-7 text-[0.75rem] text-white/50 outline-none">
                      <option value="">Tous paiements</option>
                      {PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                  </div>
                  <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                    className="[color-scheme:dark] rounded-xl border border-white/[0.08] bg-[#0d1426] px-3 py-2 text-[0.75rem] text-white/50 outline-none" />
                  {hasFilters && (
                    <button onClick={() => { setSearch(""); setFilterCat(""); setFilterSt(""); setFilterMonth(""); setFilterPay(""); }}
                      className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-3 py-2 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors">
                      <X size={12} /> Effacer
                    </button>
                  )}
                </div>

                {/* Expense list */}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
                      <Receipt size={24} style={{ color: "#c9a55a66" }} />
                    </div>
                    <p className="text-[0.78rem] text-white/30">
                      {hasFilters ? "Aucune dépense ne correspond aux filtres" : "Aucune dépense enregistrée"}
                    </p>
                    {!hasFilters && (
                      <button onClick={() => { setEditExpense(null); setShowModal(true); }}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] text-white/50 hover:text-white transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Plus size={13} /> Ajouter votre première dépense
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {filtered.map(e => {
                        const ci = getCat(e.category);
                        const CI = ci.I;
                        return (
                          <motion.div key={e.id} layout
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                            className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 hover:bg-white/[0.05] transition-all">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: ci.c + "22" }}>
                              <CI size={16} style={{ color: ci.c }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="truncate text-[0.78rem] font-semibold text-white/90">{e.description}</p>
                                {e.receipt_url && (
                                  <a href={e.receipt_url} target="_blank" rel="noreferrer"
                                    className="shrink-0 text-[0.6rem] text-blue-400/60 hover:text-blue-400 transition-colors" title="Justificatif">📎</a>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-[0.62rem] text-white/30">{fmtDate(e.date)}</span>
                                {e.project && <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[0.58rem] text-white/30">{e.project}</span>}
                                {e.invoice_number && <span className="text-[0.58rem] text-white/20">{e.invoice_number}</span>}
                              </div>
                            </div>

                            <div className="hidden sm:flex shrink-0 flex-col items-end gap-1">
                              <CatBadge cat={e.category} />
                              <StBadge st={e.status} />
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[0.88rem] font-bold text-white">{fmtCur(e.amount, e.currency)}</p>
                              {e.vat_recoverable && e.vat_amount > 0 && (
                                <p className="text-[0.58rem] text-green-400/60">TVA {fmtCur(e.vat_amount)}</p>
                              )}
                            </div>

                            <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditExpense(e); setShowModal(true); }}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-white/[0.08] hover:text-white transition-all">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => deleteExpense(e.id)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value as ExpStatus)}
                              className="shrink-0 cursor-pointer appearance-none [color-scheme:dark] rounded-lg border border-white/[0.05] bg-[#0d1426] px-2 py-1 text-[0.6rem] text-white/30 outline-none opacity-0 hover:border-white/15 group-hover:opacity-100 transition-all"
                              style={{ minWidth: "90px" }}>
                              {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                            </select>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <div className="flex flex-wrap items-center justify-end gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-4 py-2.5 text-[0.72rem]">
                      <span className="text-white/30">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
                      <span className="text-white/50">TVA rép. : <span className="font-semibold text-green-400">{fmtCur(filteredVAT)}</span></span>
                      <span className="font-bold text-white">Total : {fmtCur(filteredTotal)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "notes" && (
              <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => { setEditReport(null); setShowReportModal(true); }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] font-bold transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    <Plus size={14} /> Nouvelle note
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
                      <FileText size={24} style={{ color: "#c9a55a66" }} />
                    </div>
                    <p className="text-[0.78rem] text-white/30">Aucune note de frais</p>
                    <button onClick={() => { setEditReport(null); setShowReportModal(true); }}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] text-white/50 hover:text-white transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Plus size={13} /> Créer une note de frais
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map(r => {
                      const linked = expenses.filter(e => e.expense_report_id === r.id);
                      const total  = linked.reduce((a, e) => a + e.amount, 0);
                      const vatRec = linked.filter(e => e.vat_recoverable).reduce((a, e) => a + e.vat_amount, 0);
                      return (
                        <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[0.85rem] font-bold text-white">{r.title}</h3>
                                <StBadge st={r.status} />
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.65rem] text-white/30">
                                <span>{linked.length} dépense{linked.length !== 1 ? "s" : ""}</span>
                                {r.period_start && (
                                  <span>{fmtDate(r.period_start)} → {r.period_end ? fmtDate(r.period_end) : "en cours"}</span>
                                )}
                              </div>
                              {r.notes && <p className="mt-1 text-[0.65rem] italic text-white/25 truncate">{r.notes}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[0.95rem] font-semibold text-white">{fmtCur(total)}</p>
                              {vatRec > 0 && <p className="text-[0.6rem] text-green-400/60">TVA {fmtCur(vatRec)}</p>}
                            </div>
                            <div className="shrink-0 flex gap-1">
                              <button onClick={() => { setEditReport(r); setShowReportModal(true); }}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-white/[0.08] hover:text-white transition-all">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => deleteReport(r.id)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {linked.length > 0 ? (
                            <div className="space-y-1 border-t border-white/[0.04] pt-3">
                              {linked.map(e => {
                                const ci = getCat(e.category);
                                const CI = ci.I;
                                return (
                                  <div key={e.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.02] transition-colors">
                                    <CI size={11} style={{ color: ci.c }} className="shrink-0" />
                                    <span className="flex-1 truncate text-[0.68rem] text-white/50">{e.description}</span>
                                    <span className="shrink-0 text-[0.62rem] text-white/30">{fmtDate(e.date)}</span>
                                    <span className="shrink-0 text-[0.7rem] font-semibold text-white/70">{fmtCur(e.amount, e.currency)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="py-2 text-center text-[0.68rem] text-white/20">
                              Associez des dépenses à cette note via le formulaire de dépense.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "budgets" && (
              <motion.div key="bud" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {userId && (
                  <BudgetView
                    expenses={expenses} budgets={budgets}
                    userId={userId} onBudgetsChange={setBudgets}
                  />
                )}
              </motion.div>
            )}

            {tab === "rapport" && (
              <motion.div key="rap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <RapportView expenses={expenses} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showModal && userId && (
          <ExpenseModal
            expense={editExpense} reports={reports} userId={userId}
            onSave={saved => {
              if (editExpense) {
                setExpenses(es => es.map(e => e.id === saved.id ? saved : e));
                toast$("Dépense mise à jour");
              } else {
                setExpenses(es => [saved, ...es]);
                toast$("Dépense ajoutée");
              }
              setShowModal(false);
              setEditExpense(null);
            }}
            onClose={() => { setShowModal(false); setEditExpense(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            report={editReport}
            onSave={saveReport}
            onClose={() => { setShowReportModal(false); setEditReport(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
