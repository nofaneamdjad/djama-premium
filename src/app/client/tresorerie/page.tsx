"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle2,
  X, Download, Upload, Search, Plus, Edit2, Trash2,
  ArrowUpRight, ArrowDownRight, CreditCard, Users, FileText,
  Monitor, Car, Megaphone, ShoppingBag, Package, MoreHorizontal,
  BarChart2, Building2, Calendar, Zap, PiggyBank, Clock,
  ChevronDown, Receipt, RefreshCw, Banknote, Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import Toast, { type ToastData } from "@/components/ui/Toast";
import Pagination from "@/components/client/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { useTheme } from "@/lib/theme-context";

type TxType   = "income" | "expense";
type TxStatus = "completed" | "pending" | "cancelled";
type TxFreq   = "weekly" | "monthly" | "quarterly" | "yearly";

interface TAccount {
  id: string; user_id: string;
  name: string; bank: string; iban: string;
  balance: number; currency: string;
  color: string; is_default: boolean;
  created_at: string; updated_at: string;
}

interface Transaction {
  id: string; user_id: string; account_id: string | null;
  type: TxType; category: string; label: string;
  amount: number; currency: string; date: string;
  payment_method: string; status: TxStatus;
  client_supplier: string; invoice_ref: string;
  project: string; notes: string; created_at: string;
}

interface Recurring {
  id: string; user_id: string;
  type: TxType; label: string;
  amount: number; frequency: TxFreq;
  next_date: string | null;
  category: string; active: boolean; created_at: string;
}

interface RawDoc {
  id: string; numero: string; client_nom: string;
  total_ttc: number; statut: string;
  date_document: string; date_echeance: string | null;
}

const INCOME_CATS = [
  { v: "client",     l: "Paiement client",  c: "#10b981", I: Users      },
  { v: "abonnement", l: "Abonnement",        c: "#3b82f6", I: RefreshCw  },
  { v: "vente",      l: "Vente produit",     c: "#8b5cf6", I: ShoppingBag},
  { v: "subvention", l: "Subvention",        c: "#f59e0b", I: Zap        },
  { v: "autre",      l: "Autre revenu",      c: "#6b7280", I: Plus       },
] as const;

const EXPENSE_CATS = [
  { v: "salaires",     l: "Salaires",       c: "#ef4444", I: Users       },
  { v: "fournisseurs", l: "Fournisseurs",   c: "#f97316", I: Package     },
  { v: "logiciels",    l: "Logiciels",      c: "#8b5cf6", I: Monitor     },
  { v: "marketing",    l: "Marketing",      c: "#ec4899", I: Megaphone   },
  { v: "transport",    l: "Transport",      c: "#3b82f6", I: Car         },
  { v: "taxes",        l: "Taxes & impôts", c: "#dc2626", I: Building2   },
  { v: "bancaires",    l: "Frais bancaires",c: "#64748b", I: CreditCard  },
  { v: "autre",        l: "Autre",          c: "#6b7280", I: MoreHorizontal},
] as const;

const PAY_METHODS = [
  { v: "virement",    l: "Virement"    },
  { v: "carte",       l: "Carte"       },
  { v: "prelevement", l: "Prélèvement" },
  { v: "cash",        l: "Espèces"     },
  { v: "cheque",      l: "Chèque"      },
];

const TX_STATUSES = [
  { v: "completed", l: "Effectué",  c: "#10b981" },
  { v: "pending",   l: "En attente",c: "#f59e0b" },
  { v: "cancelled", l: "Annulé",    c: "#6b7280" },
] as const;

const FREQUENCIES = [
  { v: "weekly",    l: "Hebdomadaire" },
  { v: "monthly",   l: "Mensuel"      },
  { v: "quarterly", l: "Trimestriel"  },
  { v: "yearly",    l: "Annuel"       },
];

const ACCOUNT_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ec4899","#06b6d4","#c9a55a"];

type AlertThreshold = { accountId: string; min: number };
type BankLink = { accountId: string; bank: string; lastSync: string };
const BANKS = [
  { id: "bnp",  name: "BNP Paribas",      color: "#009966" },
  { id: "ca",   name: "Crédit Agricole",   color: "#00853F" },
  { id: "sg",   name: "Soc. Générale",     color: "#EE2E24" },
  { id: "lcl",  name: "LCL",              color: "#EF7D00" },
  { id: "bour", name: "Boursobank",        color: "#0070BA" },
  { id: "cic",  name: "CIC",              color: "#CC0000" },
  { id: "lbp",  name: "La Banque Postale", color: "#FF7900" },
  { id: "bpop", name: "Banque Populaire",  color: "#005A9C" },
];

const fmtC  = (n: number, c = "EUR") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(0)}%`;

const getCat = (type: TxType, v: string) =>
  type === "income"
    ? (INCOME_CATS.find(c => c.v === v) ?? INCOME_CATS[INCOME_CATS.length - 1])
    : (EXPENSE_CATS.find(c => c.v === v) ?? EXPENSE_CATS[EXPENSE_CATS.length - 1]);

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const recurringMonthly = (r: Recurring) => {
  if (!r.active) return 0;
  const map: Record<TxFreq, number> = { weekly: 4.33, monthly: 1, quarterly: 1/3, yearly: 1/12 };
  return r.amount * (map[r.frequency] ?? 1);
};

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

function TxBadge({ status }: { status: TxStatus }) {
  const s = TX_STATUSES.find(x => x.v === status) ?? TX_STATUSES[0];
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ backgroundColor: s.c + "22", color: s.c }}>
      {s.l}
    </span>
  );
}

const BLANK_TX: Partial<Transaction> = {
  type: "expense", category: "autre", label: "", amount: 0,
  currency: "EUR", date: new Date().toISOString().slice(0, 10),
  payment_method: "virement", status: "completed",
  client_supplier: "", invoice_ref: "", project: "", notes: "",
};

function TransactionModal({
  tx, accounts, userId, onSave, onClose,
}: {
  tx: Partial<Transaction> | null;
  accounts: TAccount[];
  userId: string;
  onSave: (t: Transaction) => void;
  onClose: () => void;
}) {
  const [form,      setForm]      = useState<Partial<Transaction>>(tx ?? { ...BLANK_TX });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof Transaction, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  async function save() {
    if (!form.label?.trim() || !form.amount) return;
    setSaving(true);
    setSaveError("");
    const payload = { ...form, user_id: userId, amount: Number(form.amount) };
    if (tx?.id) {
      const { data, error } = await supabase.from("treasury_transactions").update(payload).eq("id", tx.id).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Transaction);
    } else {
      const { data, error } = await supabase.from("treasury_transactions").insert(payload).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Transaction);
    }
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.1] p-5 space-y-4"
        style={{ background: "rgba(10,14,26,0.98)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{tx?.id ? "Modifier" : "Nouvelle transaction"}</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/60 transition-colors"><X size={18} /></button>
        </div>

                <div className="grid grid-cols-2 gap-2">
          {(["income", "expense"] as TxType[]).map(t => (
            <button key={t} type="button" onClick={() => { set("type", t); set("category", "autre"); }}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.78rem] font-bold border transition-all"
              style={{
                backgroundColor: form.type === t ? (t === "income" ? "#10b98122" : "#ef444422") : "transparent",
                borderColor:     form.type === t ? (t === "income" ? "#10b98144" : "#ef444444") : "rgba(255,255,255,0.08)",
                color:           form.type === t ? (t === "income" ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.3)",
              }}>
              {t === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {t === "income" ? "Encaissement" : "Dépense"}
            </button>
          ))}
        </div>

                <Field label="Libellé">
          <input className={inp} placeholder="Ex: Paiement facture FACT-042"
            value={form.label ?? ""} onChange={e => set("label", e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Montant">
              <input type="number" step="0.01" min="0" placeholder="0.00" className={inp}
                value={form.amount ?? ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="Devise">
            <div className="relative">
              <select className={sel} value={form.currency ?? "EUR"} onChange={e => set("currency", e.target.value)}>
                {["EUR","USD","GBP","CHF","MAD"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        </div>

                <Field label="Catégorie">
          <div className="grid grid-cols-4 gap-1.5">
            {cats.map(({ v, l, c, I }) => (
              <button key={v} type="button" onClick={() => set("category", v)}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-[0.58rem] font-medium border transition-all"
                style={{
                  backgroundColor: form.category === v ? c + "2a" : "transparent",
                  borderColor:     form.category === v ? c + "55" : "rgba(255,255,255,0.06)",
                  color:           form.category === v ? c : "rgba(255,255,255,0.35)",
                }}>
                <I size={12} /><span className="truncate w-full text-center">{l}</span>
              </button>
            ))}
          </div>
        </Field>

                <div className="grid grid-cols-3 gap-3">
          <Field label="Date">
            <input type="date" className={`${inp} [color-scheme:dark]`} value={form.date ?? ""} onChange={e => set("date", e.target.value)} />
          </Field>
          <Field label="Statut">
            <div className="relative">
              <select className={sel} value={form.status ?? "completed"} onChange={e => set("status", e.target.value)}>
                {TX_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
          <Field label="Paiement">
            <div className="relative">
              <select className={sel} value={form.payment_method ?? "virement"} onChange={e => set("payment_method", e.target.value)}>
                {PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        </div>

                <div className="grid grid-cols-2 gap-3">
          <Field label={form.type === "income" ? "Client" : "Fournisseur"}>
            <input className={inp} placeholder="Nom" value={form.client_supplier ?? ""}
              onChange={e => set("client_supplier", e.target.value)} />
          </Field>
          <Field label="Réf. facture">
            <input className={inp} placeholder="FACT-001" value={form.invoice_ref ?? ""}
              onChange={e => set("invoice_ref", e.target.value)} />
          </Field>
        </div>

                {accounts.length > 0 && (
          <Field label="Compte bancaire">
            <div className="relative">
              <select className={sel} value={form.account_id ?? ""} onChange={e => set("account_id", e.target.value || null)}>
                <option value="">— Sans compte —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank || "—"})</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        )}

                <Field label="Notes">
          <textarea rows={2} className={`${inp} resize-none`} placeholder="Notes…"
            value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} />
        </Field>

        {saveError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[0.7rem] text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            {saveError}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.78rem] text-white/40 hover:text-white/60 transition-colors">Annuler</button>
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-[0.78rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? "…" : tx?.id ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AccountModal({
  account, userId, onSave, onClose,
}: {
  account: TAccount | null;
  userId: string;
  onSave: (a: TAccount) => void;
  onClose: () => void;
}) {
  const [form,      setForm]      = useState<Partial<TAccount>>(account ?? {
    name: "", bank: "", iban: "", balance: 0, currency: "EUR", color: "#3b82f6", is_default: false,
  });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof TAccount, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name?.trim()) return;
    setSaving(true);
    setSaveError("");
    const payload = { ...form, user_id: userId, balance: Number(form.balance ?? 0) };
    if (account) {
      const { data, error } = await supabase.from("treasury_accounts").update(payload).eq("id", account.id).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as TAccount);
    } else {
      const { data, error } = await supabase.from("treasury_accounts").insert(payload).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as TAccount);
    }
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.1] p-5 space-y-4"
        style={{ background: "rgba(10,14,26,0.98)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{account ? "Modifier le compte" : "Nouveau compte"}</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/60"><X size={18} /></button>
        </div>
        <Field label="Nom du compte">
          <input className={inp} placeholder="Ex: Compte principal" value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Banque">
            <input className={inp} placeholder="Ex: BNP, CIC…" value={form.bank ?? ""} onChange={e => set("bank", e.target.value)} />
          </Field>
          <Field label="Solde actuel (€)">
            <input type="number" step="0.01" className={inp} value={form.balance ?? 0} onChange={e => set("balance", parseFloat(e.target.value) || 0)} />
          </Field>
        </div>
        <Field label="IBAN (optionnel)">
          <input className={inp} placeholder="FR76 …" value={form.iban ?? ""} onChange={e => set("iban", e.target.value)} />
        </Field>
        <Field label="Couleur">
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set("color", c)}
                className="h-7 w-7 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: form.color === c ? "white" : "transparent" }} />
            ))}
          </div>
        </Field>
        {saveError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[0.7rem] text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            {saveError}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.78rem] text-white/40 hover:text-white/60 transition-colors">Annuler</button>
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-[0.78rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {account ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecurringModal({
  item, userId, onSave, onClose,
}: {
  item: Recurring | null;
  userId: string;
  onSave: (r: Recurring) => void;
  onClose: () => void;
}) {
  const [form,      setForm]      = useState<Partial<Recurring>>(item ?? {
    type: "expense", label: "", amount: 0, frequency: "monthly", category: "autre", active: true,
  });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof Recurring, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const cats = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  async function save() {
    if (!form.label?.trim() || !form.amount) return;
    setSaving(true);
    setSaveError("");
    const payload = { ...form, user_id: userId, amount: Number(form.amount) };
    if (item) {
      const { data, error } = await supabase.from("treasury_recurring").update(payload).eq("id", item.id).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Recurring);
    } else {
      const { data, error } = await supabase.from("treasury_recurring").insert(payload).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Recurring);
    }
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.1] p-5 space-y-4"
        style={{ background: "rgba(10,14,26,0.98)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{item ? "Modifier" : "Nouvel élément récurrent"}</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/60"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["income","expense"] as TxType[]).map(t => (
            <button key={t} type="button" onClick={() => { set("type", t); set("category", "autre"); }}
              className="rounded-xl py-2 text-[0.75rem] font-bold border transition-all"
              style={{
                backgroundColor: form.type === t ? (t === "income" ? "#10b98122" : "#ef444422") : "transparent",
                borderColor:     form.type === t ? (t === "income" ? "#10b98144" : "#ef444444") : "rgba(255,255,255,0.08)",
                color:           form.type === t ? (t === "income" ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.3)",
              }}>
              {t === "income" ? "Revenu" : "Dépense"}
            </button>
          ))}
        </div>
        <Field label="Libellé">
          <input className={inp} placeholder="Ex: Abonnement Slack" value={form.label ?? ""} onChange={e => set("label", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant (€)">
            <input type="number" step="0.01" min="0" className={inp}
              value={form.amount ?? ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="Fréquence">
            <div className="relative">
              <select className={sel} value={form.frequency ?? "monthly"} onChange={e => set("frequency", e.target.value)}>
                {FREQUENCIES.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
        </div>
        <Field label="Catégorie">
          <div className="grid grid-cols-4 gap-1.5">
            {cats.map(({ v, l, c, I }) => (
              <button key={v} type="button" onClick={() => set("category", v)}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-[0.58rem] border transition-all"
                style={{
                  backgroundColor: form.category === v ? c + "2a" : "transparent",
                  borderColor:     form.category === v ? c + "55" : "rgba(255,255,255,0.06)",
                  color:           form.category === v ? c : "rgba(255,255,255,0.35)",
                }}>
                <I size={12} /><span className="truncate w-full text-center">{l}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Prochain prélèvement">
          <input type="date" className={`${inp} [color-scheme:dark]`} value={form.next_date ?? ""} onChange={e => set("next_date", e.target.value || null)} />
        </Field>
        {saveError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[0.7rem] text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            {saveError}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.78rem] text-white/40 hover:text-white/60 transition-colors">Annuler</button>
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-[0.78rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {item ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DashboardView({
  transactions, accounts, recurring, invoices, onNavigate, userId,
}: {
  transactions: Transaction[];
  accounts: TAccount[];
  recurring: Recurring[];
  invoices: RawDoc[];
  onNavigate: (tab: "transactions" | "previsions") => void;
  userId: string | null;
}) {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  useEffect(() => {
    if (!userId) return;
    void supabase.from("user_preferences").select("value").eq("user_id", userId).eq("key", "treasury_thresholds").maybeSingle()
      .then(({ data }) => { if (data?.value) setThresholds(data.value as AlertThreshold[]); });
  }, [userId]);
  const now = new Date();
  const mk  = monthKey(now);
  const prevMk = monthKey(new Date(now.getFullYear(), now.getMonth() - 1));

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  const thisIncome  = transactions.filter(t => t.type === "income"   && t.status === "completed" && t.date.startsWith(mk)).reduce((a, t) => a + t.amount, 0);
  const thisExpense = transactions.filter(t => t.type === "expense"  && t.status === "completed" && t.date.startsWith(mk)).reduce((a, t) => a + t.amount, 0);
  const lastIncome  = transactions.filter(t => t.type === "income"   && t.status === "completed" && t.date.startsWith(prevMk)).reduce((a, t) => a + t.amount, 0);
  const lastExpense = transactions.filter(t => t.type === "expense"  && t.status === "completed" && t.date.startsWith(prevMk)).reduce((a, t) => a + t.amount, 0);

  const pending    = transactions.filter(t => t.status === "pending").reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);
  const netMonth   = thisIncome - thisExpense;

  const mrrIncome  = recurring.filter(r => r.active && r.type === "income").reduce((a, r) => a + recurringMonthly(r), 0);
  const mrrExpense = recurring.filter(r => r.active && r.type === "expense").reduce((a, r) => a + recurringMonthly(r), 0);
  const forecast30 = totalBalance + mrrIncome - mrrExpense;

  const incomePct  = lastIncome  > 0 ? ((thisIncome  - lastIncome)  / lastIncome  * 100) : 0;
  const expensePct = lastExpense > 0 ? ((thisExpense - lastExpense) / lastExpense * 100) : 0;

  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = monthKey(d);
    const inc = transactions.filter(t => t.type === "income"  && t.status === "completed" && t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
    const exp = transactions.filter(t => t.type === "expense" && t.status === "completed" && t.date.startsWith(key)).reduce((a, t) => a + t.amount, 0);
    return { label: d.toLocaleDateString("fr-FR", { month: "short" }), key, inc, exp };
  });
  const maxVal = Math.max(...months6.flatMap(m => [m.inc, m.exp]), 1);

  const overdue = invoices.filter(inv => {
    if (!inv.date_echeance || inv.statut === "payé") return false;
    return new Date(inv.date_echeance) < now;
  });
  const upcoming30 = recurring.filter(r => r.active && r.next_date && new Date(r.next_date) <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())).sort((a, b) => a.amount - b.amount).slice(0, 3);

  const recent5 = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const threshAlerts = accounts.filter(a => {
    const t = thresholds.find(th => th.accountId === a.id);
    return t && a.balance < t.min;
  });

  const KPI = [
    { l: "Solde total",          v: totalBalance,      c: "#c9a55a", sub: `${accounts.length} compte${accounts.length !== 1 ? "s" : ""}`, I: Wallet,        delta: null,      subColor: null,   nav: null },
    { l: "Encaissements",        v: thisIncome,        c: "#10b981", sub: fmtPct(incomePct)  + " vs mois dernier", I: ArrowUpRight,  delta: incomePct,   subColor: incomePct  > 0 ? "#10b981" : incomePct  < 0 ? "#ef4444" : "#6b7280", nav: "transactions" as const },
    { l: "Dépenses",             v: thisExpense,       c: "#ef4444", sub: fmtPct(expensePct) + " vs mois dernier", I: ArrowDownRight,delta: -expensePct, subColor: expensePct > 0 ? "#ef4444" : expensePct < 0 ? "#10b981" : "#6b7280", nav: "transactions" as const },
    { l: "Résultat net",         v: netMonth,          c: netMonth >= 0 ? "#10b981" : "#ef4444", sub: "Ce mois", I: BarChart2,    delta: null,      subColor: null,   nav: "transactions" as const },
    { l: "En attente",           v: Math.abs(pending), c: "#f59e0b", sub: pending >= 0 ? "à encaisser" : "à payer", I: Clock,    delta: null,      subColor: null,   nav: "transactions" as const },
    { l: "Prévision 30 jours",   v: forecast30,        c: "#8b5cf6", sub: "Basé sur récurrents", I: Target,        delta: null,      subColor: null,   nav: "previsions"   as const },
  ];

  return (
    <div className="space-y-5">
            {(overdue.length > 0 || (totalBalance > 0 && forecast30 < 0) || threshAlerts.length > 0) && (
        <div className="space-y-2">
          {threshAlerts.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <AlertTriangle size={15} className="shrink-0 text-amber-400" />
              <p className="text-[0.75rem] text-amber-300">
                <strong>{a.name}</strong> — solde <strong>{fmtC(a.balance)}</strong> en dessous du seuil d'alerte de <strong>{fmtC(thresholds.find(t => t.accountId === a.id)!.min)}</strong>.
              </p>
            </div>
          ))}
          {forecast30 < 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <p className="text-[0.75rem] text-red-300">
                <strong>Risque de trésorerie négative</strong> dans 30 jours.
                Projection : <span className="font-bold">{fmtC(forecast30)}</span>
              </p>
            </div>
          )}
          {overdue.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <AlertTriangle size={15} className="shrink-0 text-amber-400" />
              <p className="text-[0.75rem] text-amber-300">
                <strong>{overdue.length} facture{overdue.length > 1 ? "s" : ""} en retard</strong> — relancez vos clients.
              </p>
            </div>
          )}
        </div>
      )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KPI.map(({ l, v, c, sub, I, delta, subColor, nav }) => (
          <button key={l} onClick={() => nav && onNavigate(nav)}
            className="rounded-2xl p-4 space-y-2 text-left transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: nav ? "pointer" : "default" }}>
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-medium text-white/40">{l}</p>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: c + "20" }}>
                <I size={12} style={{ color: c }} />
              </div>
            </div>
            <p className="text-xl font-bold leading-none" style={{ color: v < 0 && delta === null ? "#ef4444" : "white" }}>
              {fmtC(Math.abs(v))}{v < 0 ? " ↓" : ""}
            </p>
            <div className="flex items-center gap-1.5">
              {delta !== null && delta !== 0 && (
                delta > 0
                  ? <TrendingUp size={10} className="text-green-400" />
                  : <TrendingDown size={10} className="text-red-400" />
              )}
              <p className="text-[0.62rem]" style={{ color: (subColor ?? c) + "bb" }}>{sub}</p>
            </div>
          </button>
        ))}
      </div>

            <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/35">Cashflow — 6 mois</h3>
          <div className="flex items-center gap-3 text-[0.62rem] text-white/35">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-500/60" /> Entrées</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-500/60" /> Sorties</span>
          </div>
        </div>
        <div className="flex items-end gap-3" style={{ height: "96px" }}>
          {months6.map(({ label, key, inc, exp }) => (
            <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-end gap-0.5" style={{ height: "72px" }}>
                <motion.div className="flex-1 rounded-t-sm bg-green-500/50"
                  initial={{ height: 0 }} animate={{ height: `${Math.max((inc / maxVal) * 72, inc > 0 ? 3 : 0)}px` }}
                  transition={{ duration: 0.6, ease: "easeOut" }} />
                <motion.div className="flex-1 rounded-t-sm bg-red-500/50"
                  initial={{ height: 0 }} animate={{ height: `${Math.max((exp / maxVal) * 72, exp > 0 ? 3 : 0)}px` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }} />
              </div>
              <span className="text-[0.55rem] text-white/35">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming30.length > 0 && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/35">Prochains paiements</h3>
            <div className="space-y-2">
              {upcoming30.map(r => {
                const ci = getCat(r.type, r.category);
                const CI = ci.I;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <CI size={12} style={{ color: ci.c }} className="shrink-0" />
                    <span className="flex-1 text-[0.72rem] text-white/60 truncate">{r.label}</span>
                    <span className="shrink-0 text-[0.65rem] text-white/35">{r.next_date ? fmtDate(r.next_date) : "—"}</span>
                    <span className="shrink-0 text-[0.75rem] font-bold" style={{ color: r.type === "expense" ? "#ef4444" : "#10b981" }}>
                      {r.type === "income" ? "+" : "-"}{fmtC(r.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

                <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/35">Dernières transactions</h3>
          {recent5.length === 0
            ? <p className="py-4 text-center text-[0.72rem] text-white/25">Aucune transaction</p>
            : (
              <div className="space-y-1.5">
                {recent5.map(t => {
                  const ci = getCat(t.type, t.category);
                  const CI = ci.I;
                  return (
                    <div key={t.id} className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: ci.c + "22" }}>
                        <CI size={12} style={{ color: ci.c }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[0.72rem] font-medium text-white/70">{t.label}</p>
                        <p className="text-[0.6rem] text-white/35">{fmtDate(t.date)}</p>
                      </div>
                      <span className={`shrink-0 text-[0.78rem] font-bold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        {t.type === "income" ? "+" : "-"}{fmtC(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function TransactionsView({
  transactions, accounts, userId, onAdd, onEdit, onDelete, onStatusChange,
}: {
  transactions: Transaction[];
  accounts: TAccount[];
  userId: string;
  onAdd: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TxStatus) => void;
}) {
  const [search,            setSearch]            = useState("");
  const [filterType,        setFilterType]        = useState<"" | TxType>("");
  const [filterSt,          setFilterSt]          = useState("");
  const [filterMonth,       setFilterMonth]       = useState("");
  const [filterCat,         setFilterCat]         = useState("");
  const [showModal,         setShowModal]         = useState(false);
  const [editTx,            setEditTx]            = useState<Transaction | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  const filtered = useMemo(() => transactions.filter(t => {
    if (search && !t.label.toLowerCase().includes(search.toLowerCase()) &&
        !t.client_supplier.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType  && t.type         !== filterType)  return false;
    if (filterSt    && t.status       !== filterSt)    return false;
    if (filterMonth && !t.date.startsWith(filterMonth)) return false;
    if (filterCat   && t.category     !== filterCat)   return false;
    return true;
  }), [transactions, search, filterType, filterSt, filterMonth, filterCat]);

  const { page, setPage, paginated, totalPages, totalItems } = usePagination(filtered, 25);

  const totalIn  = filtered.filter(t => t.type === "income"  && t.status === "completed").reduce((a, t) => a + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === "expense" && t.status === "completed").reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
          <Search size={13} className="shrink-0 text-white/35" />
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[0.78rem] text-white placeholder-white/20 outline-none" />
        </div>
        <div className="relative">
          <select value={filterType} onChange={e => { setFilterType(e.target.value as "" | TxType); setFilterCat(""); setPage(1); }}
            className="rounded-xl border border-white/[0.08] bg-[#131c30] px-3 py-2 pr-8 text-[0.75rem] text-white/60 outline-none appearance-none [color-scheme:dark]">
            <option value="">Tout</option>
            <option value="income">Encaissements</option>
            <option value="expense">Dépenses</option>
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
        <div className="relative">
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/[0.08] bg-[#131c30] px-3 py-2 pr-8 text-[0.75rem] text-white/60 outline-none appearance-none [color-scheme:dark]">
            <option value="">Toutes catégories</option>
            {filterType !== "expense" && INCOME_CATS.map(c => <option key={`i-${c.v}`} value={c.v}>{c.l}</option>)}
            {filterType !== "income"  && EXPENSE_CATS.map(c => <option key={`e-${c.v}`} value={c.v}>{c.l}</option>)}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
        <div className="relative">
          <select value={filterSt} onChange={e => { setFilterSt(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/[0.08] bg-[#131c30] px-3 py-2 pr-8 text-[0.75rem] text-white/60 outline-none appearance-none [color-scheme:dark]">
            <option value="">Tous statuts</option>
            {TX_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
        <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/[0.08] bg-[#131c30] px-3 py-2 text-[0.75rem] text-white/60 outline-none [color-scheme:dark]" />
        {(search || filterType || filterSt || filterMonth || filterCat) && (
          <button onClick={() => { setSearch(""); setFilterType(""); setFilterSt(""); setFilterMonth(""); setFilterCat(""); setPage(1); }}
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] px-3 py-2 text-[0.72rem] text-white/35 hover:text-white/60">
            <X size={12} /> Effacer
          </button>
        )}
        <button onClick={() => { setEditTx(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.72rem] font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13} /> Transaction
        </button>
      </div>

            <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Entrées (filtré)</p>
          <p className="mt-0.5 text-base font-bold text-green-400">{fmtC(totalIn)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Sorties (filtré)</p>
          <p className="mt-0.5 text-base font-bold text-red-400">{fmtC(totalOut)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Net</p>
          <p className={`mt-0.5 text-base font-bold ${totalIn - totalOut >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtC(totalIn - totalOut)}</p>
        </div>
      </div>

            {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Receipt size={32} className="text-white/25" />
          <p className="text-[0.78rem] text-white/35">Aucune transaction trouvée</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {paginated.map(t => {
              const ci = getCat(t.type, t.category);
              const CI = ci.I;
              return (
                <motion.div key={t.id} layout
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 hover:bg-white/[0.05] transition-all">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: ci.c + "22" }}>
                    <CI size={14} style={{ color: ci.c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[0.78rem] font-semibold text-white/90">{t.label}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[0.62rem] text-white/35">{fmtDate(t.date)}</span>
                      {t.client_supplier && <span className="text-[0.6rem] text-white/35">{t.client_supplier}</span>}
                      <TxBadge status={t.status} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[0.88rem] font-bold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {t.type === "income" ? "+" : "-"}{fmtC(t.amount, t.currency)}
                    </p>
                    <p className="text-[0.6rem] text-white/25">{PAY_METHODS.find(m => m.v === t.payment_method)?.l}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {confirmDeleteTxId === t.id ? (
                      <>
                        <button onClick={() => { onDelete(t.id); setConfirmDeleteTxId(null); }}
                          className="h-7 px-2 rounded-lg flex items-center gap-1 text-[0.6rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                          <Trash2 size={10} /> Oui
                        </button>
                        <button onClick={() => setConfirmDeleteTxId(null)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-white/[0.08] hover:text-white/60 transition-all">
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditTx(t); setShowModal(true); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/35 hover:bg-white/[0.08] hover:text-white">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setConfirmDeleteTxId(t.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/35 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                  <select value={t.status} onChange={e => onStatusChange(t.id, e.target.value as TxStatus)}
                    className="shrink-0 cursor-pointer rounded-lg border border-white/[0.08] bg-[#131c30] px-2 py-1 text-[0.6rem] text-white/40 outline-none opacity-0 group-hover:opacity-100 transition-all appearance-none [color-scheme:dark]"
                    style={{ minWidth: "90px" }}>
                    {TX_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={25}/>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <TransactionModal
            tx={editTx} accounts={accounts} userId={userId}
            onSave={saved => { editTx ? onEdit(saved) : onAdd(saved); setShowModal(false); setEditTx(null); }}
            onClose={() => { setShowModal(false); setEditTx(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PrevisionsView({
  transactions, accounts, recurring, invoices, userId,
  onRecurringAdd, onRecurringEdit, onRecurringDelete,
}: {
  transactions: Transaction[];
  accounts: TAccount[];
  recurring: Recurring[];
  invoices: RawDoc[];
  userId: string;
  onRecurringAdd: (r: Recurring) => void;
  onRecurringEdit: (r: Recurring) => void;
  onRecurringDelete: (id: string) => void;
}) {
  const [horizon,            setHorizon]            = useState<30 | 90 | 365>(30);
  const [showModal,          setShowModal]          = useState(false);
  const [editItem,           setEditItem]           = useState<Recurring | null>(null);
  const [confirmDeleteRecId, setConfirmDeleteRecId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<"pessimiste" | "realiste" | "optimiste">("realiste");

  const SCENARIOS = [
    { id: "pessimiste" as const, l: "Pessimiste", incM: 0.7, expM: 1.3, color: "#ef4444" },
    { id: "realiste"   as const, l: "Réaliste",   incM: 1.0, expM: 1.0, color: "#c9a55a" },
    { id: "optimiste"  as const, l: "Optimiste",  incM: 1.3, expM: 0.7, color: "#10b981" },
  ];
  const sc = SCENARIOS.find(s => s.id === scenario)!;

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  const mrrIncomeBase  = recurring.filter(r => r.active && r.type === "income").reduce((a, r) => a + recurringMonthly(r), 0);
  const mrrExpenseBase = recurring.filter(r => r.active && r.type === "expense").reduce((a, r) => a + recurringMonthly(r), 0);
  const mrrIncome  = mrrIncomeBase  * sc.incM;
  const mrrExpense = mrrExpenseBase * sc.expM;
  const months     = horizon / 30;

  const openInvoices = invoices.filter(inv => inv.statut !== "payé").reduce((a, inv) => a + inv.total_ttc, 0);
  const forecast = totalBalance + (mrrIncome - mrrExpense) * months + (horizon <= 90 ? openInvoices : 0);

  const forecastPoints = Array.from({ length: Math.min(Math.ceil(months), 12) }, (_, i) => ({
    label: new Date(new Date().getFullYear(), new Date().getMonth() + i + 1, 1).toLocaleDateString("fr-FR", { month: "short" }),
    value: totalBalance + (mrrIncome - mrrExpense) * (i + 1),
  }));
  const minV = Math.min(...forecastPoints.map(p => p.value), 0);
  const maxV = Math.max(...forecastPoints.map(p => p.value), 1);
  const range = maxV - minV || 1;

  const burnRate = mrrExpense;
  const runway   = burnRate > 0 ? Math.floor(totalBalance / burnRate) : null;

  return (
    <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Solde actuel</p>
          <p className="mt-0.5 text-lg font-bold text-white">{fmtC(totalBalance)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">MRR</p>
          <p className="mt-0.5 text-lg font-bold text-green-400">{fmtC(mrrIncome)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Burn rate</p>
          <p className="mt-0.5 text-lg font-bold text-red-400">{fmtC(burnRate)}/mois</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[0.65rem] font-medium text-white/40">Runway</p>
          <p className="mt-0.5 text-lg font-bold" style={{ color: runway === null ? "#6b7280" : runway < 3 ? "#ef4444" : runway < 6 ? "#f59e0b" : "#10b981" }}>
            {runway === null ? "∞" : `${runway} mois`}
          </p>
        </div>
      </div>

            <div className="rounded-2xl p-4 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-[0.78rem] font-bold text-white">Projection trésorerie</h3>
            <p className="text-[0.65rem] text-white/35 mt-0.5">Basé sur les récurrents + factures ouvertes</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setScenario(s.id)}
                  className={`rounded-xl px-3 py-1.5 text-[0.68rem] font-bold transition-all border ${
                    scenario === s.id ? "bg-white/[0.07]" : "border-transparent text-white/35 hover:text-white/60"
                  }`}
                  style={scenario === s.id ? { color: s.color, borderColor: s.color + "40" } : {}}>
                  {s.l}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {([30, 90, 365] as const).map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`rounded-xl px-3 py-1.5 text-[0.68rem] font-bold transition-all ${
                    horizon === h ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"
                  }`}>
                  {h === 30 ? "30j" : h === 90 ? "90j" : "1 an"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <Target size={16} className="shrink-0 text-purple-400" />
          <div>
            <p className="text-[0.65rem] text-white/35">Trésorerie dans {horizon} jours</p>
            <p className={`text-2xl font-bold ${forecast < 0 ? "text-red-400" : "text-white"}`}>{fmtC(forecast)}</p>
          </div>
          {forecast < totalBalance
            ? <TrendingDown size={20} className="ml-auto text-red-400/60" />
            : <TrendingUp size={20} className="ml-auto text-green-400/60" />
          }
        </div>

                {forecastPoints.length > 0 && (
          <div className="flex items-end gap-1.5" style={{ height: "60px" }}>
            {forecastPoints.map(({ label, value }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <motion.div className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(((value - minV) / range) * 48, 2)}px`,
                    backgroundColor: value < 0 ? "#ef444450" : sc.color + "50",
                  }}
                  initial={{ height: 0 }} animate={{ height: `${Math.max(((value - minV) / range) * 48, 2)}px` }}
                  transition={{ duration: 0.5, ease: "easeOut" }} />
                <span className="text-[0.5rem] text-white/35">{label}</span>
              </div>
            ))}
          </div>
        )}

        {openInvoices > 0 && horizon <= 90 && (
          <p className="text-[0.65rem] text-white/35">
            + <span className="font-semibold text-amber-400">{fmtC(openInvoices)}</span> de factures ouvertes incluses dans la projection.
          </p>
        )}
      </div>

            <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.78rem] font-bold text-white">Éléments récurrents</h3>
          <button onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.68rem] font-semibold transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            <Plus size={12} /> Ajouter
          </button>
        </div>

        {recurring.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <RefreshCw size={24} className="text-white/25" />
            <p className="text-[0.75rem] text-white/35">Aucun élément récurrent</p>
            <p className="text-[0.65rem] text-white/25 text-center max-w-xs">Ajoutez vos revenus et dépenses récurrents pour activer la prévision.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {["income", "expense"].map(type => {
              const items = recurring.filter(r => r.type === type);
              if (items.length === 0) return null;
              const total = items.filter(r => r.active).reduce((a, r) => a + recurringMonthly(r), 0);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between px-1 py-1">
                    <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${type === "income" ? "text-green-400/60" : "text-red-400/60"}`}>
                      {type === "income" ? "Revenus récurrents" : "Dépenses récurrentes"}
                    </p>
                    <span className={`text-[0.68rem] font-bold ${type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {type === "income" ? "+" : "-"}{fmtC(total)}/mois
                    </span>
                  </div>
                  {items.map(r => {
                    const ci = getCat(r.type as TxType, r.category);
                    const CI = ci.I;
                    return (
                      <div key={r.id} className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${r.active ? "border-white/[0.07] bg-white/[0.03]" : "border-white/[0.03] bg-white/[0.025] opacity-50"}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: ci.c + "22" }}>
                          <CI size={13} style={{ color: ci.c }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.75rem] font-semibold text-white/70 truncate">{r.label}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.62rem] text-white/35">{FREQUENCIES.find(f => f.v === r.frequency)?.l}</span>
                            {r.next_date && <span className="text-[0.6rem] text-white/25">→ {fmtDate(r.next_date)}</span>}
                          </div>
                        </div>
                        <span className={`shrink-0 text-[0.82rem] font-bold ${r.type === "income" ? "text-green-400" : "text-red-400"}`}>
                          {r.type === "income" ? "+" : "-"}{fmtC(r.amount)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {confirmDeleteRecId === r.id ? (
                            <>
                              <button onClick={() => { onRecurringDelete(r.id); setConfirmDeleteRecId(null); }}
                                className="h-6 px-1.5 rounded-md flex items-center gap-1 text-[0.58rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                <Trash2 size={9} /> Oui
                              </button>
                              <button onClick={() => setConfirmDeleteRecId(null)}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:bg-white/[0.08] hover:text-white/60 transition-all">
                                <X size={9} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={async () => {
                                const { error } = await supabase.from("treasury_recurring").update({ active: !r.active }).eq("id", r.id);
                                if (!error) onRecurringEdit({ ...r, active: !r.active });
                              }} className="h-6 w-6 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.08] transition-all text-[0.6rem]" title={r.active ? "Désactiver" : "Activer"}>
                                {r.active ? "⏸" : "▶"}
                              </button>
                              <button onClick={() => { setEditItem(r); setShowModal(true); }}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.08]">
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => setConfirmDeleteRecId(r.id)}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <RecurringModal
            item={editItem} userId={userId}
            onSave={saved => { editItem ? onRecurringEdit(saved) : onRecurringAdd(saved); setShowModal(false); setEditItem(null); }}
            onClose={() => { setShowModal(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ComptesView({
  accounts, userId, transactions,
  onAccountAdd, onAccountEdit, onAccountDelete,
  onTxImported,
}: {
  accounts: TAccount[];
  userId: string;
  transactions: Transaction[];
  onAccountAdd: (a: TAccount) => void;
  onAccountEdit: (a: TAccount) => void;
  onAccountDelete: (id: string) => void;
  onTxImported: (txs: Transaction[]) => void;
}) {
  const [showModal,          setShowModal]          = useState(false);
  const [editAccount,        setEditAccount]        = useState<TAccount | null>(null);
  const [csvDraft,           setCsvDraft]           = useState<Partial<Transaction>[]>([]);
  const [csvImporting,       setCsvImporting]       = useState(false);
  const [confirmDeleteAccId, setConfirmDeleteAccId] = useState<string | null>(null);
  const [pdfFile,            setPdfFile]            = useState<File | null>(null);
  const [pdfAnalyzing,       setPdfAnalyzing]       = useState(false);
  const [pdfError,           setPdfError]           = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [thresholds,   setThresholdsState] = useState<AlertThreshold[]>([]);
  const [editThreshId, setEditThreshId]    = useState<string | null>(null);
  const [threshInput,  setThreshInput]     = useState("");
  const [bankLinks,    setBankLinksState]  = useState<BankLink[]>([]);
  const [bankModalId,  setBankModalId]     = useState<string | null>(null);
  const [connecting,   setConnecting]      = useState(false);

  useEffect(() => {
    void Promise.all([
      supabase.from("user_preferences").select("value").eq("user_id", userId).eq("key", "treasury_thresholds").maybeSingle(),
      supabase.from("user_preferences").select("value").eq("user_id", userId).eq("key", "treasury_banklinks").maybeSingle(),
    ]).then(([th, bl]) => {
      if (th.data?.value) setThresholdsState(th.data.value as AlertThreshold[]);
      if (bl.data?.value) setBankLinksState(bl.data.value as BankLink[]);
    });
  }, [userId]);

  function applyThreshold(accountId: string, val: string) {
    const min = parseFloat(val.replace(",", "."));
    if (isNaN(min)) return;
    const next = [...thresholds.filter(t => t.accountId !== accountId), { accountId, min }];
    setThresholdsState(next);
    void supabase.from("user_preferences").upsert(
      { user_id: userId, key: "treasury_thresholds", value: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
    setEditThreshId(null);
  }

  async function connectBank(accountId: string, bank: { id: string; name: string; color: string }) {
    setConnecting(true);
    await new Promise(r => setTimeout(r, 1200));
    const next = [...bankLinks.filter(l => l.accountId !== accountId), { accountId, bank: bank.name, lastSync: new Date().toISOString() }];
    setBankLinksState(next);
    void supabase.from("user_preferences").upsert(
      { user_id: userId, key: "treasury_banklinks", value: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
    setBankModalId(null);
    setConnecting(false);
  }

  async function analyzePdf() {
    if (!pdfFile || pdfAnalyzing) return;
    setPdfAnalyzing(true);
    setPdfError("");
    try {
      const form = new FormData();
      form.append("file", pdfFile);
      const res  = await fetch("/api/tresorerie/parse-pdf", { method: "POST", body: form });
      const data = await res.json() as { transactions?: Partial<Transaction>[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      if (!data.transactions?.length) throw new Error("Aucune transaction trouvée dans le relevé");
      setCsvDraft(data.transactions.map(t => ({
        ...t,
        user_id: userId,
      })));
      setPdfFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Erreur lors de l'analyse IA");
    } finally {
      setPdfAnalyzing(false);
    }
  }

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  function parseCSV(text: string): Partial<Transaction>[] {
    const lines = text.trim().split("\n").filter(Boolean);
    const result: Partial<Transaction>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ""));
      const [date, label, amountStr, type, category] = cols;
      const amount = parseFloat(amountStr?.replace(",", ".") ?? "0");
      if (!date || !label || isNaN(amount)) continue;
      result.push({
        date, label, amount: Math.abs(amount),
        type: (type?.toLowerCase() === "income" || type?.toLowerCase() === "revenu") ? "income" : "expense",
        category: category?.toLowerCase() || "autre",
        status: "completed", payment_method: "virement", currency: "EUR",
        user_id: userId,
      });
    }
    return result;
  }

  async function importCSV() {
    if (!csvDraft.length || !userId) return;
    setCsvImporting(true);
    const { data, error } = await supabase.from("treasury_transactions")
      .insert(csvDraft.map(t => ({ ...t, user_id: userId })))
      .select();
    if (!error && data) onTxImported(data as Transaction[]);
    setCsvDraft([]);
    setCsvImporting(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] text-white/35">Solde total consolidé</p>
          <p className="text-2xl font-bold text-white">{fmtC(totalBalance)}</p>
        </div>
        <button onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.72rem] font-bold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13} /> Compte
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Building2 size={32} className="text-white/25" />
          <p className="text-[0.78rem] text-white/35">Aucun compte bancaire</p>
          <button onClick={() => { setEditAccount(null); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] font-semibold transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            <Plus size={13} /> Ajouter un compte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map(a => {
            const txCount  = transactions.filter(t => t.account_id === a.id).length;
            const thresh   = thresholds.find(t => t.accountId === a.id);
            const blink    = bankLinks.find(l => l.accountId === a.id);
            const belowMin = thresh && a.balance < thresh.min;
            return (
              <div key={a.id} className="group rounded-2xl border bg-white/[0.03] p-4 space-y-3 hover:bg-white/[0.05] transition-all"
                style={{ borderColor: belowMin ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                      style={{ backgroundColor: a.color + "20", borderColor: a.color + "30" }}>
                      <Building2 size={15} style={{ color: a.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[0.82rem] font-bold text-white/90">{a.name}</p>
                        {blink && (
                          <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                            <CheckCircle2 size={8}/> Sync
                          </span>
                        )}
                      </div>
                      <p className="text-[0.62rem] text-white/35">
                        {blink ? blink.bank : (a.bank || "—")} · {txCount} transactions
                        {thresh && <span className="ml-1" style={{ color: belowMin ? "#fbbf24" : "inherit" }}>· seuil {fmtC(thresh.min)}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Bank connect */}
                    <button onClick={() => { setBankModalId(a.id); }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white/35 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                      title="Connecter une banque">
                      <Banknote size={12} />
                    </button>
                    {/* Alert threshold */}
                    <button onClick={() => { setEditThreshId(a.id); setThreshInput(thresh ? String(thresh.min) : ""); }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-amber-500/10 transition-all"
                      style={{ color: thresh ? "#fbbf24" : "rgba(255,255,255,0.35)" }}
                      title="Seuil d'alerte">
                      <AlertTriangle size={12} />
                    </button>
                    {confirmDeleteAccId === a.id ? (
                      <>
                        <button onClick={() => { onAccountDelete(a.id); setConfirmDeleteAccId(null); }}
                          className="h-7 px-2 rounded-lg flex items-center gap-1 text-[0.6rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                          <Trash2 size={10} /> Oui
                        </button>
                        <button onClick={() => setConfirmDeleteAccId(null)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:bg-white/[0.08] hover:text-white/60 transition-all">
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditAccount(a); setShowModal(true); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/35 hover:bg-white/[0.08] hover:text-white">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setConfirmDeleteAccId(a.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/35 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: a.balance < 0 ? "#ef4444" : "white" }}>
                    {fmtC(a.balance, a.currency)}
                  </p>
                  {a.iban && <p className="mt-0.5 text-[0.6rem] text-white/25 font-mono">{a.iban}</p>}
                </div>
                {/* Inline threshold editor */}
                <AnimatePresence>
                  {editThreshId === a.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 pt-1">
                        <AlertTriangle size={12} className="text-amber-400 shrink-0"/>
                        <span className="text-[0.65rem] text-amber-400/80">Seuil d'alerte (€)</span>
                        <input type="number" value={threshInput} onChange={e => setThreshInput(e.target.value)}
                          className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[0.72rem] text-amber-200 outline-none"
                          placeholder="ex: 500" autoFocus/>
                        <button onClick={() => applyThreshold(a.id, threshInput)}
                          className="h-7 px-2 rounded-lg text-[0.6rem] font-bold text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 transition-all">OK</button>
                        <button onClick={() => setEditThreshId(null)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60">
                          <X size={10}/>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Bank connection modal */}
      <AnimatePresence>
        {bankModalId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setBankModalId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/[0.08] p-5 space-y-4"
              style={{ background: "#0d1117" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote size={15} style={{ color: "#c9a55a" }}/>
                  <h3 className="text-sm font-bold text-white">Connecter ma banque</h3>
                </div>
                <button onClick={() => setBankModalId(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40"><X size={14}/></button>
              </div>
              {connecting ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]"/>
                  <p className="text-[0.75rem] text-white/50">Connexion en cours…</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(b => {
                    const linked = bankLinks.find(l => l.accountId === bankModalId && l.bank === b.name);
                    return (
                      <button key={b.id} onClick={() => connectBank(bankModalId!, b)}
                        className="flex items-center gap-2 rounded-xl border p-3 text-left transition-all hover:brightness-110"
                        style={{ borderColor: linked ? b.color + "50" : "rgba(255,255,255,0.07)", background: linked ? b.color + "12" : "rgba(255,255,255,0.03)" }}>
                        <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: b.color + "30" }}>
                          <Building2 size={11} style={{ color: b.color }}/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold text-white/80 truncate">{b.name}</p>
                          {linked && <p className="text-[0.55rem] text-emerald-400">Connecté</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Download size={15} className="text-white/35" />
          <div>
            <h3 className="text-[0.78rem] font-semibold text-white/70">Import relevé bancaire</h3>
            <p className="text-[0.62rem] text-white/35">CSV : date, libellé, montant, type, catégorie · PDF : analyse IA (bientôt)</p>
          </div>
        </div>

        {pdfFile ? (
          <div className="space-y-3">
            {/* Erreur IA */}
            {pdfError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[0.7rem] text-red-400">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            {/* Fichier sélectionné */}
            <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
              <FileText size={16} className="shrink-0 text-purple-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[0.78rem] font-semibold text-purple-200">{pdfFile.name}</p>
                <p className="text-[0.62rem] text-purple-300/50">{(pdfFile.size / 1024).toFixed(0)} Ko · Relevé bancaire PDF</p>
              </div>
            </div>

            {/* Aperçu pendant l'analyse */}
            {pdfAnalyzing && (
              <div className="flex items-center gap-3 rounded-xl border border-purple-500/10 bg-white/[0.02] px-4 py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-400 shrink-0" />
                <div>
                  <p className="text-[0.72rem] font-medium text-white/60">Analyse en cours…</p>
                  <p className="text-[0.62rem] text-white/30">Claude lit votre relevé et identifie les transactions</p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setPdfFile(null); setPdfError(""); if (fileRef.current) fileRef.current.value = ""; }}
                disabled={pdfAnalyzing}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[0.72rem] text-white/40 hover:text-white/60 disabled:opacity-40 transition-colors">
                Annuler
              </button>
              <button
                onClick={analyzePdf}
                disabled={pdfAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.72rem] font-bold disabled:opacity-50 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "white" }}>
                {pdfAnalyzing ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Zap size={13} /> Analyser avec Claude IA
                  </>
                )}
              </button>
            </div>
          </div>
        ) : csvDraft.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.025] py-6 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all">
            <Upload size={18} className="text-white/25" />
            <span className="text-[0.68rem] text-white/35">Cliquez pour importer · CSV ou PDF</span>
            <input ref={fileRef} type="file" accept=".csv,.txt,.pdf,application/pdf" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
                  setPdfFile(f);
                  setCsvDraft([]);
                  return;
                }
                const reader = new FileReader();
                reader.onload = ev => {
                  const text = ev.target?.result as string;
                  const draft = parseCSV(text);
                  setCsvDraft(draft);
                };
                reader.readAsText(f);
              }} />
          </label>
        ) : (
          <div className="space-y-3">
            <p className="text-[0.72rem] text-white/40">{csvDraft.length} transaction{csvDraft.length !== 1 ? "s" : ""} détectée{csvDraft.length !== 1 ? "s" : ""}</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {csvDraft.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1 text-[0.68rem]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === "income" ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="flex-1 truncate text-white/60">{t.label}</span>
                  <span className="shrink-0 text-white/40">{t.date}</span>
                  <span className={`shrink-0 font-semibold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {t.type === "income" ? "+" : "-"}{fmtC(t.amount ?? 0)}
                  </span>
                </div>
              ))}
              {csvDraft.length > 10 && <p className="text-center text-[0.65rem] text-white/25">+ {csvDraft.length - 10} autres…</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCsvDraft([]); setPdfFile(null); setPdfError(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex-1 rounded-xl border border-white/[0.08] py-2 text-[0.72rem] text-white/40 hover:text-white/60 transition-colors">
                Annuler
              </button>
              <button onClick={importCSV} disabled={csvImporting}
                className="flex-1 rounded-xl py-2 text-[0.72rem] font-bold disabled:opacity-40 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {csvImporting ? "Import…" : `Importer ${csvDraft.length} transactions`}
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <AccountModal
            account={editAccount} userId={userId}
            onSave={saved => { editAccount ? onAccountEdit(saved) : onAccountAdd(saved); setShowModal(false); setEditAccount(null); }}
            onClose={() => { setShowModal(false); setEditAccount(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RapportView({ transactions, recurring, accounts }: {
  transactions: Transaction[];
  recurring: Recurring[];
  accounts: TAccount[];
}) {
  const now   = new Date();
  const valid = transactions.filter(t => t.status === "completed");

  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return valid.filter(t => t.type === "expense" && t.date.startsWith(monthKey(d))).reduce((a, t) => a + t.amount, 0);
  });
  const burnRate3mo = last3Months.reduce((a, b) => a + b, 0) / 3;

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);
  const mrr = recurring.filter(r => r.active && r.type === "income").reduce((a, r) => a + recurringMonthly(r), 0);
  const arr = mrr * 12;
  const runway = burnRate3mo > 0 ? (totalBalance / burnRate3mo) : null;

  const thisMonth = monthKey(now);
  const thisIncome  = valid.filter(t => t.type === "income"  && t.date.startsWith(thisMonth)).reduce((a, t) => a + t.amount, 0);
  const thisExpense = valid.filter(t => t.type === "expense" && t.date.startsWith(thisMonth)).reduce((a, t) => a + t.amount, 0);
  const margin = thisIncome > 0 ? ((thisIncome - thisExpense) / thisIncome * 100) : 0;

  const byExpCat: Record<string, number> = {};
  valid.filter(t => t.type === "expense").forEach(t => {
    byExpCat[t.category] = (byExpCat[t.category] ?? 0) + t.amount;
  });
  const expCatList = Object.entries(byExpCat).sort((a, b) => b[1] - a[1]);
  const maxExpCat  = expCatList[0]?.[1] ?? 1;

  const byIncCat: Record<string, number> = {};
  valid.filter(t => t.type === "income").forEach(t => {
    byIncCat[t.category] = (byIncCat[t.category] ?? 0) + t.amount;
  });
  const incCatList = Object.entries(byIncCat).sort((a, b) => b[1] - a[1]);
  const maxIncCat  = incCatList[0]?.[1] ?? 1;

  const advKPI = [
    { l: "MRR",           v: fmtC(mrr),                       sub: "Revenu mensuel récurrent",   c: "#10b981" },
    { l: "ARR",           v: fmtC(arr),                       sub: "Revenu annuel récurrent",     c: "#3b82f6" },
    { l: "Burn rate",     v: fmtC(burnRate3mo) + "/mois",     sub: "Moy. 3 derniers mois",        c: "#ef4444" },
    { l: "Runway",        v: runway !== null ? `${Math.floor(runway)} mois` : "∞", sub: "Mois de trésorerie", c: runway !== null && runway < 3 ? "#ef4444" : runway !== null && runway < 6 ? "#f59e0b" : "#10b981" },
    { l: "Marge nette",   v: `${margin.toFixed(1)}%`,         sub: "Ce mois",                     c: margin >= 0 ? "#10b981" : "#ef4444" },
    { l: "Solde consolidé",v: fmtC(totalBalance),             sub: `${accounts.length} compte${accounts.length !== 1 ? "s" : ""}`, c: "#c9a55a" },
  ];

  function exportRapport() {
    const now = new Date();
    const lines = [
      `RAPPORT TRÉSORERIE — ${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`,
      "=".repeat(52),
      "",
      "KPI CLÉS",
      `  MRR              : ${fmtC(mrr)}`,
      `  ARR              : ${fmtC(arr)}`,
      `  Burn rate        : ${fmtC(burnRate3mo)}/mois`,
      `  Runway           : ${runway !== null ? `${Math.floor(runway)} mois` : "Infini"}`,
      `  Marge nette      : ${margin.toFixed(1)}%`,
      `  Solde consolidé  : ${fmtC(totalBalance)}`,
      `  Revenus (mois)   : ${fmtC(thisIncome)}`,
      `  Dépenses (mois)  : ${fmtC(thisExpense)}`,
      "",
      "RÉPARTITION DÉPENSES",
      ...expCatList.map(([cat, total]) => `  ${getCat("expense", cat).l.padEnd(20)} : ${fmtC(total)}`),
      "",
      "RÉPARTITION REVENUS",
      ...incCatList.map(([cat, total]) => `  ${getCat("income",  cat).l.padEnd(20)} : ${fmtC(total)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `rapport-tresorerie-${now.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[0.78rem] font-bold text-white/60 uppercase tracking-widest">Rapport financier</h2>
        <button onClick={exportRapport}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[0.68rem] font-semibold text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all">
          <Download size={12}/> Exporter
        </button>
      </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {advKPI.map(({ l, v, sub, c }) => (
          <div key={l} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-1">
            <p className="text-[0.65rem] font-medium text-white/40">{l}</p>
            <p className="text-xl font-bold leading-none text-white">{v}</p>
            <p className="text-[0.62rem]" style={{ color: c }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/35">Répartition dépenses</h3>
          {expCatList.length === 0
            ? <p className="py-6 text-center text-[0.72rem] text-white/25">Aucune dépense</p>
            : expCatList.slice(0, 7).map(([cat, total]) => {
              const ci = getCat("expense", cat);
              const CI = ci.I;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <CI size={11} style={{ color: ci.c }} className="shrink-0" />
                  <span className="w-20 shrink-0 truncate text-[0.65rem] text-white/40">{ci.l}</span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${(total / maxExpCat) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: ci.c }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[0.65rem] font-semibold text-white/60">{fmtC(total)}</span>
                </div>
              );
            })
          }
        </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-white/35">Répartition revenus</h3>
          {incCatList.length === 0
            ? <p className="py-6 text-center text-[0.72rem] text-white/25">Aucun revenu</p>
            : incCatList.slice(0, 7).map(([cat, total]) => {
              const ci = getCat("income", cat);
              const CI = ci.I;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <CI size={11} style={{ color: ci.c }} className="shrink-0" />
                  <span className="w-20 shrink-0 truncate text-[0.65rem] text-white/40">{ci.l}</span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${(total / maxIncCat) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: ci.c }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[0.65rem] font-semibold text-white/60">{fmtC(total)}</span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

export default function TresoreriePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [userId,       setUserId]       = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState<ToastData | null>(null);

  const [accounts,     setAccounts]     = useState<TAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring,    setRecurring]    = useState<Recurring[]>([]);
  const [invoices,     setInvoices]     = useState<RawDoc[]>([]);

  const [tab, setTab] = useState<"dashboard"|"transactions"|"previsions"|"comptes"|"rapport">("dashboard");

  const toast$ = (msg: string, type: "success"|"error" = "success") => setToast({ msg, type });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
      else router.replace("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [aRes, tRes, rRes, iRes] = await Promise.all([
      supabase.from("treasury_accounts").select("*").eq("user_id", userId).order("is_default", { ascending: false }),
      supabase.from("treasury_transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("treasury_recurring").select("*").eq("user_id", userId).order("label"),
      supabase.from("documents").select("id,numero,client_nom,total_ttc,statut,date_document,date_echeance").eq("user_id", userId).eq("type", "facture"),
    ]);
    if (aRes.data) setAccounts(aRes.data as TAccount[]);
    if (tRes.data) setTransactions(tRes.data as Transaction[]);
    if (rRes.data) setRecurring(rRes.data as Recurring[]);
    if (iRes.data) setInvoices(iRes.data as RawDoc[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) loadAll(); }, [userId, loadAll]);

    async function deleteTx(id: string) {
    const { error } = await supabase.from("treasury_transactions").delete().eq("id", id);
    if (error) return toast$("Erreur", "error");
    setTransactions(ts => ts.filter(t => t.id !== id));
    toast$("Transaction supprimée");
  }

  async function updateTxStatus(id: string, status: TxStatus) {
    const { error } = await supabase.from("treasury_transactions").update({ status }).eq("id", id);
    if (error) return toast$("Erreur", "error");
    setTransactions(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  }

    async function deleteAccount(id: string) {
    const { error } = await supabase.from("treasury_accounts").delete().eq("id", id);
    if (error) return toast$("Erreur", "error");
    setAccounts(as => as.filter(a => a.id !== id));
    toast$("Compte supprimé");
  }

    async function deleteRecurring(id: string) {
    const { error } = await supabase.from("treasury_recurring").delete().eq("id", id);
    if (error) return toast$("Erreur", "error");
    setRecurring(rs => rs.filter(r => r.id !== id));
    toast$("Élément supprimé");
  }

    function exportCSV() {
    const h = ["Date","Libellé","Montant","Type","Catégorie","Statut","Client/Fournisseur","Réf. facture"];
    const rows = transactions.map(t => [
      t.date, `"${t.label}"`, t.amount, t.type === "income" ? "Entrée" : "Sortie",
      t.category, TX_STATUSES.find(s => s.v === t.status)?.l ?? t.status,
      `"${t.client_supplier}"`, `"${t.invoice_ref}"`,
    ]);
    const csv  = [h.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tresorerie.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const TABS = [
    { id: "dashboard",    l: "Dashboard",    I: BarChart2,  badge: 0 },
    { id: "transactions", l: "Transactions", I: Receipt,    badge: transactions.filter(t => t.status === "pending").length },
    { id: "previsions",   l: "Prévisions",   I: Target,     badge: 0 },
    { id: "comptes",      l: "Comptes",      I: Building2,  badge: accounts.length },
    { id: "rapport",      l: "Rapport",      I: PiggyBank,  badge: 0 },
  ] as const;

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  if (loading) return (
    <div className={`flex h-full items-center justify-center ${isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]"}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
    </div>
  );

  return (
    <div className={`flex h-full flex-col overflow-hidden ${isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]"}`}>
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative shrink-0 overflow-hidden px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6"
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#09080e)" : "linear-gradient(160deg,#eef0f8,#e8ebf5,#eef0f8)" }}>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 h-[2px] origin-left"
          style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a,#c9a55a44,transparent)" }} />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle,#c9a55a,transparent 70%)" }} />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.25)" }}>
              <Wallet size={18} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Trésorerie</h1>
              <p className="mt-0.5 text-[0.65rem] text-white/30">
                Solde : <span className={totalBalance < 0 ? "text-red-400 font-bold" : "font-semibold"} style={totalBalance >= 0 ? { color: "#c9a55a" } : {}}>{fmtC(totalBalance)}</span>
                {" · "}{transactions.length} transactions
              </p>
            </div>
          </div>
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }} onClick={exportCSV} title="Exporter CSV"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Download size={14} />
          </motion.button>
        </div>
      </div>

      <div className="relative shrink-0 flex overflow-x-auto border-b border-white/[0.07] px-4 sm:px-8 scrollbar-none"
        style={{ background: "rgba(6,8,14,0.5)" }}>
        {TABS.map(({ id, l, I, badge }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-[0.72rem] font-semibold transition-colors ${
              tab === id ? "text-white" : "text-white/30 hover:text-white/60"
            }`}>
            <I size={13} />{l}
            {badge > 0 && (
              <span className="rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold"
                style={{ background: "rgba(201,165,90,0.15)", color: "#c9a55a" }}>{badge}</span>
            )}
            {tab === id && (
              <motion.div layoutId="tres-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a)" }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
        <AnimatePresence mode="wait">

          {tab === "dashboard" && (
            <motion.div key="dash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DashboardView transactions={transactions} accounts={accounts} recurring={recurring} invoices={invoices} onNavigate={t => setTab(t)} userId={userId} />
            </motion.div>
          )}

          {tab === "transactions" && (
            <motion.div key="tx" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {userId && (
                <TransactionsView
                  transactions={transactions} accounts={accounts} userId={userId}
                  onAdd={t => { setTransactions(ts => [t, ...ts]); toast$("Transaction ajoutée"); }}
                  onEdit={t => { setTransactions(ts => ts.map(x => x.id === t.id ? t : x)); toast$("Mise à jour"); }}
                  onDelete={deleteTx}
                  onStatusChange={updateTxStatus}
                />
              )}
            </motion.div>
          )}

          {tab === "previsions" && (
            <motion.div key="prev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {userId && (
                <PrevisionsView
                  transactions={transactions} accounts={accounts}
                  recurring={recurring} invoices={invoices} userId={userId}
                  onRecurringAdd={r => { setRecurring(rs => [...rs, r]); toast$("Récurrent ajouté"); }}
                  onRecurringEdit={r => setRecurring(rs => rs.map(x => x.id === r.id ? r : x))}
                  onRecurringDelete={deleteRecurring}
                />
              )}
            </motion.div>
          )}

          {tab === "comptes" && (
            <motion.div key="comp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {userId && (
                <ComptesView
                  accounts={accounts} userId={userId} transactions={transactions}
                  onAccountAdd={a => { setAccounts(as => [...as, a]); toast$("Compte ajouté"); }}
                  onAccountEdit={a => setAccounts(as => as.map(x => x.id === a.id ? a : x))}
                  onAccountDelete={deleteAccount}
                  onTxImported={txs => { setTransactions(ts => [...txs, ...ts]); toast$(`${txs.length} transactions importées`); }}
                />
              )}
            </motion.div>
          )}

          {tab === "rapport" && (
            <motion.div key="rap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <RapportView transactions={transactions} recurring={recurring} accounts={accounts} />
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
