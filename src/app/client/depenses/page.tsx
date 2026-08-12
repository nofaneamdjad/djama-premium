"use client";

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, FileText, BarChart2, PiggyBank, Plus, X, Edit2, Trash2,
  Upload, Download, Search, Car, Coffee, Monitor, Building2, Package,
  Phone, BookOpen, Megaphone, ShoppingBag, HelpCircle, CreditCard,
  Banknote, Wallet, DollarSign, CheckCircle2, XCircle,
  Droplets, Calendar, FileCheck, Landmark, ArrowLeftRight, Table2,
  AlertTriangle, Zap, ChevronDown, Repeat2, FileUp,
} from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabase";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import Toast, { type ToastData } from "@/components/ui/Toast";

type ExpCat =
  | "transport" | "repas"   | "logiciel"  | "carburant" | "hotel"
  | "equipement"| "communication" | "formation" | "publicite"
  | "fournitures" | "autre";

type PayMethod = "carte_pro" | "carte_perso" | "virement" | "cash" | "autre";
type ExpStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed";
type Currency  = "EUR" | "USD" | "GBP" | "CHF" | "CAD" | "MAD";

type RecurFreq = "hebdo" | "mensuel" | "trimestriel" | "annuel";

interface Expense {
  id: string; user_id: string; expense_report_id: string | null;
  date: string; amount: number; currency: Currency;
  category: ExpCat; description: string;
  payment_method: PayMethod; status: ExpStatus;
  vat_amount: number; vat_recoverable: boolean;
  receipt_url: string; invoice_number: string;
  project: string; cost_center: string; notes: string;
  recur_freq?:       RecurFreq | null;
  recur_next_date?:  string | null;
  approval_comment?: string;
  approved_at?:      string | null;
  exchange_rate?:    number;
  amount_eur?:       number | null;
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
  alert_threshold: number;
  notify_push:     boolean;
  notify_email:    boolean;
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
  recur_freq: null, recur_next_date: null,
  exchange_rate: 1, amount_eur: null,
};

const RECUR_FREQS: { v: RecurFreq; l: string }[] = [
  { v: "hebdo",       l: "Hebdomadaire" },
  { v: "mensuel",     l: "Mensuel"      },
  { v: "trimestriel", l: "Trimestriel"  },
  { v: "annuel",      l: "Annuel"       },
];

function nextRecurDate(freq: RecurFreq, from: string): string {
  const d = new Date(from + "T12:00:00");
  switch (freq) {
    case "hebdo":        d.setDate(d.getDate() + 7);         break;
    case "mensuel":      d.setMonth(d.getMonth() + 1);       break;
    case "trimestriel":  d.setMonth(d.getMonth() + 3);       break;
    case "annuel":       d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

// ── CSV Import helpers ─────────────────────────────────────────────────────

function csvDetectSep(text: string): string {
  const first = (text.split("\n")[0] ?? "");
  return [";", ",", "\t"].map(s => ({ s, n: first.split(s).length })).sort((a, b) => b.n - a.n)[0].s;
}

function csvParseDate(s: string): string | null {
  s = s.trim().replace(/["']/g, "");
  const m1 = s.match(/^(\d{2})[/.](\d{2})[/.](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function csvParseAmount(s: string): number | null {
  if (!s || s.trim() === "" || s.trim() === "-") return null;
  s = s.replace(/["'\s]/g, "");
  // EU format: 1.234,56
  if (/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function csvDetectCols(headers: string[], sample: string[][]): { date: number; label: number; amount: number; debit: number; credit: number } {
  const h = headers.map(x => x.toLowerCase().replace(/["']/g, "").trim());
  const find = (keys: string[]) => { for (const k of keys) { const i = h.findIndex(x => x.includes(k)); if (i !== -1) return i; } return -1; };
  let date   = find(["date"]);
  let label  = find(["libellé","libelle","description","label","désignation","wording","détail"]);
  let amount = find(["montant","amount","solde"]);
  let debit  = find(["débit","debit","retrait"]);
  let credit = find(["crédit","credit","versement","dépôt"]);

  if (date === -1 || label === -1) {
    const types = headers.map((_, ci) => {
      const vals = sample.map(r => r[ci] ?? "").filter(Boolean);
      return {
        dates: vals.filter(v => csvParseDate(v) !== null).length,
        nums:  vals.filter(v => csvParseAmount(v) !== null && !csvParseDate(v)).length,
        tlen:  vals.reduce((a, v) => a + v.length, 0) / Math.max(vals.length, 1),
        total: vals.length,
      };
    });
    if (date  === -1) date  = types.findIndex(c => c.dates / Math.max(c.total, 1) > 0.6);
    if (label === -1) label = types.reduce((b, c, i) => c.dates === 0 && c.nums === 0 && c.tlen > (types[b]?.tlen ?? 0) ? i : b, 0);
    if (amount === -1 && debit === -1) {
      const numCols = types.map((c, i) => ({ i, n: c.nums })).filter(c => c.i !== date).sort((a, b) => b.n - a.n);
      if (numCols.length) amount = numCols[0].i;
    }
  }
  return { date, label, amount, debit, credit };
}

const CSV_CAT_RULES: { kw: string[]; cat: ExpCat }[] = [
  { kw: ["sncf","ratp","taxi","uber","bolt","trainline","ouigo","thalys","eurostar","flixbus","autocar","bibus","velo","aeroport","airport","navette"], cat: "transport" },
  { kw: ["restaurant","brasserie","cafe","snack","mcdonald","mcdo","kfc","pizza","sushi","burger","kebab","boulangerie","patisserie","traiteur","ubereats","deliveroo","just eat","frichti"], cat: "repas" },
  { kw: ["total","bp","shell","esso","elf","carburant","fuel","essence","diesel"], cat: "carburant" },
  { kw: ["hotel","ibis","novotel","mercure","accorhotels","booking","airbnb","kyriad","best western","marriott","hilton","hyatt","logement"], cat: "hotel" },
  { kw: ["google","apple","microsoft","adobe","slack","notion","github","figma","openai","anthropic","dropbox","mailchimp","stripe","zoom","canva","shopify","ovh","hostinger","cloudflare","vercel","heroku","aws","azure"], cat: "logiciel" },
  { kw: ["orange","sfr","bouygues","free mobile","iliad","telecom","numericable"], cat: "communication" },
  { kw: ["udemy","coursera","openclassrooms","linkedin learning","formation","certification","academie"], cat: "formation" },
  { kw: ["facebook","instagram","google ads","pub ","publicite","advertising"], cat: "publicite" },
  { kw: ["amazon","fnac","darty","cdiscount","ldlc","boulanger","cultura","leroy merlin","ikea","conforama","bureau vallee","materiel.net"], cat: "equipement" },
  { kw: ["carrefour","leclerc","intermarche","auchan","lidl","aldi","monoprix","franprix","casino","super u"], cat: "fournitures" },
];

function csvAutoCat(label: string): ExpCat {
  const l = label.toLowerCase();
  for (const { kw, cat } of CSV_CAT_RULES) { if (kw.some(k => l.includes(k))) return cat; }
  return "autre";
}

interface CsvRow { id: string; date: string; label: string; amount: number; cat: ExpCat; selected: boolean; }

function CsvImportModal({ userId, rules, onClose, onImported }: {
  userId: string;
  rules?: ExpenseRule[];
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const isDark  = useDark();
  const supabase = supabaseClient;
  const [step,    setStep]    = useState<"upload"|"preview">("upload");
  const [rows,    setRows]    = useState<CsvRow[]>([]);
  const [drag,    setDrag]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseText(text: string) {
    setErr(null);
    try {
      // Try UTF-8, then try to decode latin1 via re-interpretation
      const sep    = csvDetectSep(text);
      const lines  = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error("Fichier vide ou invalide.");
      const parse  = (l: string) => l.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ""));
      const headers = parse(lines[0]);
      const sample  = lines.slice(1, 6).map(parse);
      const cols    = csvDetectCols(headers, sample);
      if (cols.date === -1 && cols.label === -1 && cols.amount === -1 && cols.debit === -1)
        throw new Error("Impossible de détecter les colonnes. Vérifiez le format du fichier.");

      const parsed: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const v = parse(lines[i]);
        if (v.every(x => !x)) continue;
        const rawDate = cols.date  !== -1 ? v[cols.date]  : "";
        const rawLabel = cols.label !== -1 ? v[cols.label] : v.find(x => x.length > 5) ?? "";
        let amount = 0;
        if (cols.debit !== -1 || cols.credit !== -1) {
          const dv = cols.debit  !== -1 ? csvParseAmount(v[cols.debit])  : null;
          const cv = cols.credit !== -1 ? csvParseAmount(v[cols.credit]) : null;
          if (!dv && cv && cv > 0) continue; // credit (income) — skip
          amount = Math.abs(dv ?? 0);
        } else if (cols.amount !== -1) {
          const raw = csvParseAmount(v[cols.amount]);
          if (raw === null) continue;
          amount = Math.abs(raw);
        }
        if (amount <= 0) continue;
        parsed.push({
          id: Math.random().toString(36).slice(2),
          date:   csvParseDate(rawDate) ?? new Date().toISOString().slice(0, 10),
          label:  rawLabel || "Dépense importée",
          amount: Math.round(amount * 100) / 100,
          cat:    (rules?.length ? applyRules(rawLabel, rules) : null) ?? csvAutoCat(rawLabel),
          selected: true,
        });
      }
      if (parsed.length === 0) throw new Error("Aucune dépense détectée. Vérifiez que les montants sont négatifs (débits).");
      setRows(parsed); setStep("preview");
    } catch (e) { setErr((e as Error).message); }
  }

  function handleFile(file: File) {
    if (!file.name.match(/\.(csv|txt)$/i)) { setErr("Format non supporté — importez un fichier .csv"); return; }
    const reader = new FileReader();
    reader.onload = e => parseText(e.target?.result as string ?? "");
    reader.onerror = () => {
      // Retry with latin-1
      const r2 = new FileReader();
      r2.onload = e2 => parseText(e2.target?.result as string ?? "");
      r2.readAsText(file, "ISO-8859-1");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function doImport() {
    const sel = rows.filter(r => r.selected);
    if (!sel.length) return;
    setSaving(true);
    const { error } = await supabase.from("expenses").insert(sel.map(r => ({
      user_id: userId, date: r.date, amount: r.amount, currency: "EUR",
      category: r.cat, description: r.label,
      payment_method: "carte_pro", status: "draft",
      vat_amount: 0, vat_recoverable: false,
      receipt_url: "", invoice_number: "", project: "", cost_center: "",
      notes: "Importé depuis relevé bancaire", expense_report_id: null,
    })));
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onImported(sel.length);
  }

  const selCount = rows.filter(r => r.selected).length;
  const selTotal = rows.filter(r => r.selected).reduce((a, r) => a + r.amount, 0);

  const borderStyle = isDark ? "border-white/[0.07]" : "border-gray-200";

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className={`relative z-10 w-full sm:max-w-2xl flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden ${isDark ? "bg-[#0d1117]" : "bg-white"}`}
        style={{ maxHeight: "88vh", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>

        {/* Header */}
        <div className={`flex shrink-0 items-center justify-between px-5 py-3.5 border-b ${borderStyle}`}>
          <div className="flex items-center gap-2.5">
            <FileUp size={15} className="text-[#c9a55a]" />
            <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Importer un relevé bancaire</span>
          </div>
          <button onClick={onClose} className={`rounded-lg p-1.5 transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-700"}`}>
            <X size={14} />
          </button>
        </div>

        {step === "upload" ? (
          <div className="flex flex-col gap-5 p-6">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed py-12 text-center transition-all ${drag ? "border-[#c9a55a] bg-[rgba(201,165,90,0.06)]" : isDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"}`}>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <Upload size={30} className={`mx-auto mb-3 ${isDark ? "text-white/20" : "text-gray-300"}`} />
              <p className={`text-sm font-semibold ${isDark ? "text-white/50" : "text-gray-600"}`}>Déposez votre relevé CSV ici</p>
              <p className={`mt-1.5 text-xs ${isDark ? "text-white/25" : "text-gray-400"}`}>
                ou cliquez pour sélectionner · BNP, Société Générale, Crédit Agricole, Boursorama, LCL…
              </p>
            </div>
            {err && <p className="text-center text-xs text-red-400">{err}</p>}
            <p className={`text-center text-[0.65rem] leading-relaxed ${isDark ? "text-white/20" : "text-gray-400"}`}>
              Formats supportés : CSV séparateur « ; » ou « , » ou tabulation<br />
              Encodage UTF-8 ou Latin-1 · débits et crédits auto-détectés
            </p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className={`flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 border-b ${borderStyle}`}>
              <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>
                <span className="font-semibold text-[#c9a55a]">{selCount}</span> / {rows.length} sélectionnée{selCount !== 1 ? "s" : ""} · {fmtCur(selTotal)}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setRows(r => r.map(x => ({ ...x, selected: true  })))}
                  className={`rounded-lg px-2 py-1 text-[0.62rem] transition-colors ${isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"}`}>Tout sél.</button>
                <button onClick={() => setRows(r => r.map(x => ({ ...x, selected: false })))}
                  className={`rounded-lg px-2 py-1 text-[0.62rem] transition-colors ${isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-700"}`}>Tout désél.</button>
                <button onClick={() => { setStep("upload"); setRows([]); setErr(null); }}
                  className={`rounded-lg px-2 py-1 text-[0.62rem] transition-colors ${isDark ? "text-white/25 hover:text-white/50" : "text-gray-300 hover:text-gray-600"}`}>← Autre fichier</button>
              </div>
            </div>

            {/* Preview list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {rows.map((row, ri) => (
                <div key={row.id}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${row.selected ? isDark ? "bg-white/[0.04]" : "bg-gray-50" : "opacity-35"}`}>
                  <input type="checkbox" checked={row.selected}
                    onChange={e => setRows(r => r.map((x, i) => i === ri ? { ...x, selected: e.target.checked } : x))}
                    className="accent-[#c9a55a] shrink-0 cursor-pointer" />
                  <input type="date" value={row.date}
                    onChange={e => setRows(r => r.map((x, i) => i === ri ? { ...x, date: e.target.value } : x))}
                    className={`w-[108px] shrink-0 rounded-lg border px-2 py-1 text-[0.68rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-transparent text-white/80" : "border-gray-200 bg-white text-gray-700"}`} />
                  <input value={row.label}
                    onChange={e => setRows(r => r.map((x, i) => i === ri ? { ...x, label: e.target.value, cat: (rules?.length ? applyRules(e.target.value, rules) : null) ?? csvAutoCat(e.target.value) } : x))}
                    className={`flex-1 min-w-0 rounded-lg border px-2 py-1 text-[0.68rem] outline-none truncate ${isDark ? "border-white/[0.08] bg-transparent text-white/80" : "border-gray-200 bg-white text-gray-700"}`} />
                  <select value={row.cat} onChange={e => setRows(r => r.map((x, i) => i === ri ? { ...x, cat: e.target.value as ExpCat } : x))}
                    className={`w-[90px] shrink-0 rounded-lg border px-1.5 py-1 text-[0.62rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-transparent text-white/55" : "border-gray-200 bg-white text-gray-500"}`}>
                    {CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <input type="number" step="0.01" min="0" value={row.amount}
                      onChange={e => setRows(r => r.map((x, i) => i === ri ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))}
                      className={`w-[76px] rounded-lg border px-2 py-1 text-right text-[0.68rem] outline-none ${isDark ? "border-white/[0.08] bg-transparent text-white/80" : "border-gray-200 bg-white text-gray-700"}`} />
                    <span className={`text-[0.58rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>€</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={`flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3.5 ${borderStyle}`}>
              {err && <p className="flex-1 text-xs text-red-400">{err}</p>}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={onClose}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}>
                  Annuler
                </button>
                <button onClick={doImport} disabled={selCount === 0 || saving}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                  {saving
                    ? <div className="h-3 w-3 animate-spin rounded-full border border-t-transparent border-black/60" />
                    : <FileUp size={12} />}
                  Importer {selCount} dépense{selCount !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Règles de catégorisation ───────────────────────────────────────────────

type MatchOp = "contains" | "starts_with" | "ends_with" | "equals";

interface ExpenseRule {
  id: string; user_id: string; name: string;
  match_field: string; match_op: MatchOp; match_value: string;
  category: string; priority: number; active: boolean; created_at: string;
}

const OP_LABELS: Record<MatchOp, string> = {
  contains:    "contient",
  starts_with: "commence par",
  ends_with:   "finit par",
  equals:      "est exactement",
};

function applyRules(description: string, rules: ExpenseRule[]): ExpCat | null {
  const desc = description.toLowerCase().trim();
  const active = [...rules].filter(r => r.active).sort((a, b) => b.priority - a.priority);
  for (const rule of active) {
    const val = rule.match_value.toLowerCase();
    if (!val) continue;
    const ok =
      rule.match_op === "contains"    ? desc.includes(val)    :
      rule.match_op === "starts_with" ? desc.startsWith(val)  :
      rule.match_op === "ends_with"   ? desc.endsWith(val)    :
      desc === val;
    if (ok) return rule.category as ExpCat;
  }
  return null;
}

const BLANK_RULE: Omit<ExpenseRule, "id"|"user_id"|"created_at"> = {
  name: "", match_field: "description", match_op: "contains",
  match_value: "", category: "autre", priority: 0, active: true,
};

function RulesView({ rules, setRules, userId }: {
  rules: ExpenseRule[];
  setRules: React.Dispatch<React.SetStateAction<ExpenseRule[]>>;
  userId: string;
}) {
  const isDark   = useDark();
  const supabase = supabaseClient;
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [draft,   setDraft]   = useState<Omit<ExpenseRule, "id"|"user_id"|"created_at">>(BLANK_RULE);
  const [saving,  setSaving]  = useState(false);

  const borderC = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const inp = isDark
    ? "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[0.78rem] text-white outline-none focus:border-white/20"
    : "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[0.78rem] text-gray-900 outline-none focus:border-gray-300";

  function startNew() {
    setDraft({ ...BLANK_RULE });
    setEditing("new");
  }
  function startEdit(r: ExpenseRule) {
    setDraft({ name: r.name, match_field: r.match_field, match_op: r.match_op,
               match_value: r.match_value, category: r.category, priority: r.priority, active: r.active });
    setEditing(r.id);
  }
  function cancelEdit() { setEditing(null); }

  async function saveRule() {
    if (!draft.match_value.trim()) return;
    setSaving(true);
    if (editing === "new") {
      const { data, error } = await supabase.from("expense_rules")
        .insert({ ...draft, user_id: userId }).select().single();
      if (!error && data) setRules(rs => [data as ExpenseRule, ...rs]);
    } else {
      const { error } = await supabase.from("expense_rules")
        .update(draft).eq("id", editing!).eq("user_id", userId);
      if (!error) setRules(rs => rs.map(r => r.id === editing ? { ...r, ...draft } : r));
    }
    setSaving(false);
    setEditing(null);
  }

  async function deleteRule(id: string) {
    await supabase.from("expense_rules").delete().eq("id", id).eq("user_id", userId);
    setRules(rs => rs.filter(r => r.id !== id));
  }

  async function toggleActive(rule: ExpenseRule) {
    const next = !rule.active;
    await supabase.from("expense_rules").update({ active: next }).eq("id", rule.id).eq("user_id", userId);
    setRules(rs => rs.map(r => r.id === rule.id ? { ...r, active: next } : r));
  }

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Règles de catégorisation</p>
          <p className={`text-[0.68rem] mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>
            Appliquées automatiquement sur le libellé lors de la saisie et à l&apos;import CSV
          </p>
        </div>
        <button onClick={startNew} disabled={editing !== null}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] font-bold transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13} /> Nouvelle règle
        </button>
      </div>

      {/* New / Edit form */}
      {editing !== null && (
        <div className={`rounded-2xl p-4 space-y-3 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}
          style={{ border: `1px solid ${borderC}` }}>
          <p className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-gray-600"}`}>
            {editing === "new" ? "Nouvelle règle" : "Modifier la règle"}
          </p>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Nom de la règle (optionnel)" className={inp} />
          <div className="flex flex-wrap items-center gap-2 text-[0.78rem]">
            <span className={isDark ? "text-white/40" : "text-gray-500"}>Si le libellé</span>
            <div className="relative">
              <select value={draft.match_op}
                onChange={e => setDraft(d => ({ ...d, match_op: e.target.value as MatchOp }))}
                className={`${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/80" : "border-gray-200 bg-white text-gray-800"} appearance-none rounded-xl border px-3 py-2 pr-7 text-[0.75rem] outline-none`}>
                {(Object.entries(OP_LABELS) as [MatchOp, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <ChevronDown size={10} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            </div>
            <input value={draft.match_value} onChange={e => setDraft(d => ({ ...d, match_value: e.target.value }))}
              placeholder="mot-clé…" className={`${inp} max-w-[200px]`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[0.78rem] ${isDark ? "text-white/40" : "text-gray-500"}`}>→ Catégorie</span>
            <div className="relative">
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                className={`${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/80" : "border-gray-200 bg-white text-gray-800"} appearance-none rounded-xl border px-3 py-2 pr-7 text-[0.75rem] outline-none`}>
                {CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
              <ChevronDown size={10} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            </div>
            <span className={`text-[0.78rem] ${isDark ? "text-white/40" : "text-gray-500"}`}>Priorité</span>
            <input type="number" min="0" max="100" value={draft.priority}
              onChange={e => setDraft(d => ({ ...d, priority: parseInt(e.target.value) || 0 }))}
              className={`${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/80" : "border-gray-200 bg-white text-gray-800"} w-16 rounded-xl border px-2 py-2 text-[0.75rem] text-center outline-none`} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={cancelEdit} className={`rounded-xl px-4 py-2 text-xs transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}>
              Annuler
            </button>
            <button onClick={saveRule} disabled={!draft.match_value.trim() || saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              {saving ? <div className="h-3 w-3 animate-spin rounded-full border border-t-transparent border-black/60" /> : <CheckCircle2 size={12} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {sortedRules.length === 0 && editing === null ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
            <Zap size={24} style={{ color: "#c9a55a66" }} />
          </div>
          <p className={`text-[0.78rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>
            Aucune règle définie
          </p>
          <button onClick={startNew}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] transition-all ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
            <Plus size={13} /> Créer votre première règle
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRules.map(rule => (
            <div key={rule.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${!rule.active ? "opacity-45" : ""}`}
              style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#fff", border: `1px solid ${borderC}` }}>
              {/* Active toggle */}
              <button type="button" onClick={() => toggleActive(rule)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${rule.active ? "bg-[#c9a55a]" : isDark ? "bg-white/10" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              {/* Rule description */}
              <div className="flex-1 min-w-0">
                {rule.name && (
                  <p className={`text-[0.65rem] font-semibold mb-0.5 truncate ${isDark ? "text-white/50" : "text-gray-500"}`}>{rule.name}</p>
                )}
                <p className={`text-[0.72rem] truncate ${isDark ? "text-white/70" : "text-gray-700"}`}>
                  <span className={isDark ? "text-white/35" : "text-gray-400"}>Si le libellé </span>
                  <span className="font-medium">{OP_LABELS[rule.match_op]}</span>
                  <span className={isDark ? "text-white/35" : "text-gray-400"}> «&nbsp;</span>
                  <span className="font-semibold text-[#c9a55a]">{rule.match_value}</span>
                  <span className={isDark ? "text-white/35" : "text-gray-400"}>&nbsp;» → </span>
                  <span className="font-semibold">{getCat(rule.category).l}</span>
                  {rule.priority > 0 && (
                    <span className={`ml-2 text-[0.6rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>priorité {rule.priority}</span>
                  )}
                </p>
              </div>
              {/* Actions */}
              <button onClick={() => startEdit(rule)}
                className={`shrink-0 rounded-lg p-1.5 transition-colors ${isDark ? "text-white/25 hover:text-white/60" : "text-gray-400 hover:text-gray-700"}`}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => deleteRule(rule.id)}
                className={`shrink-0 rounded-lg p-1.5 transition-colors hover:text-red-400 ${isDark ? "text-white/20" : "text-gray-400"}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Theme context (partagé entre tous les sous-composants sans prop drilling) ──
const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);

const fmtCur = (n: number, c = "EUR") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);

// Convert any amount to EUR using live rates (rate = EUR per 1 unit of currency)
function amtEur(e: Pick<Expense, "amount" | "currency" | "amount_eur">, rates: Record<string, number>): number {
  if (e.amount_eur != null) return e.amount_eur;
  if (e.currency === "EUR") return e.amount;
  const rate = rates[e.currency] ?? 1;
  return e.amount / rate;
}

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
  const isDark = useDark();
  return (
    <div className="space-y-1">
      <label className={`text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>{label}</label>
      {children}
    </div>
  );
}

// Calculés localement dans chaque composant via useDark()
const INP_DARK = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[0.8rem] text-white placeholder-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all";
const INP_LITE = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[0.8rem] text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:bg-gray-50 transition-all";
const SEL_DARK = "w-full rounded-xl border border-white/[0.08] bg-[#0e1420] px-3 py-2.5 pr-8 text-[0.8rem] text-white outline-none appearance-none [color-scheme:dark] focus:border-white/[0.15] transition-all";
const SEL_LITE = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-[0.8rem] text-gray-900 outline-none appearance-none focus:border-gray-300 transition-all";

function ExpenseModal({
  expense, reports, userId, rules, rates, onSave, onClose,
}: {
  expense: Partial<Expense> | null;
  reports: ExpenseReport[];
  userId: string;
  rules?: ExpenseRule[];
  rates?: Record<string, number>;
  onSave: (e: Expense) => void;
  onClose: () => void;
}) {
  const isDark   = useDark();
  const inp      = isDark ? INP_DARK : INP_LITE;
  const sel      = isDark ? SEL_DARK : SEL_LITE;
  const supabase = supabaseClient;
  const fileRef  = useRef<HTMLInputElement>(null);
  const [form,      setForm]      = useState<Partial<Expense>>(expense ?? { ...BLANK });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [ocring,    setOcring]    = useState(false);
  const [ocrFields, setOcrFields] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const catManualRef = useRef(!!expense?.category && expense.category !== "autre");

  const set = (k: keyof Expense, v: unknown) => {
    if (k === "category") catManualRef.current = true;
    setForm(f => {
      const next = { ...f, [k]: v };
      if ((k === "amount" || k === "currency") && rates) {
        const cur  = (k === "currency" ? v : f.currency) as string ?? "EUR";
        const amt  = (k === "amount"   ? v : f.amount)   as number ?? 0;
        const rate = rates[cur] ?? 1;
        next.exchange_rate = rate;
        next.amount_eur    = cur === "EUR" ? amt : Math.round((amt / rate) * 100) / 100;
      }
      return next;
    });
  };

  async function uploadReceipt(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      set("receipt_url", data.publicUrl);

      // OCR via Claude vision (images uniquement)
      if (file.type.startsWith("image/")) {
        setOcring(true);
        try {
          const b64 = await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res((r.result as string).split(",")[1]);
            r.onerror = rej;
            r.readAsDataURL(file);
          });
          const ocrRes = await fetch("/api/depenses/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: b64, media_type: file.type }),
          });
          if (ocrRes.ok) {
            const ocr = await ocrRes.json() as {
              date?: string; amount?: number; description?: string; category?: string;
            };
            const filled: string[] = [];
            if (ocr.date)        { set("date",        ocr.date);        filled.push("Date");        }
            if (ocr.amount)      { set("amount",      ocr.amount);      filled.push("Montant");     }
            if (ocr.description) { set("description", ocr.description); filled.push("Description"); }
            if (ocr.category)    { set("category",    ocr.category);    filled.push("Catégorie");   }
            if (filled.length > 0) setOcrFields(filled);
          }
        } catch { /* OCR optionnel */ }
        finally  { setOcring(false); }
      }
    } catch {
      alert("Erreur upload. Vérifiez que le bucket 'receipts' existe dans Supabase Storage.");
    } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!form.description?.trim() || !form.amount) return;
    setSaving(true);
    setSaveError("");
    const payload = {
      ...form, user_id: userId,
      amount:     Number(form.amount),
      vat_amount: Number(form.vat_amount ?? 0),
    };
    if (expense?.id) {
      const { data, error } = await supabase.from("expenses").update(payload).eq("id", expense.id).eq("user_id", userId).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Expense);
    } else {
      const { data, error } = await supabase.from("expenses").insert(payload).select().single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) onSave(data as Expense);
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
        className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border p-5 space-y-4 ${isDark ? "border-white/[0.08] bg-[#0e1117]" : "border-gray-200 bg-white"}`}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {expense?.id ? "Modifier la dépense" : "Nouvelle dépense"}
          </h2>
          <button onClick={onClose} className={`transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}><X size={18} /></button>
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
              <ChevronDown size={11} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            </div>
          </Field>
        </div>
        {/* Conversion EUR */}
        {form.currency && form.currency !== "EUR" && form.amount_eur != null && rates && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[0.68rem] ${isDark ? "bg-white/[0.04] text-white/45" : "bg-amber-50 text-amber-700"}`}>
            <ArrowLeftRight size={12} className="shrink-0" />
            <span>
              {fmtCur(form.amount ?? 0, form.currency)} = <span className="font-semibold">{fmtCur(form.amount_eur)}</span>
              {" "}(taux : 1 EUR = {(rates[form.currency] ?? 1).toFixed(4)} {form.currency})
            </span>
          </div>
        )}

                <Field label="Description / Motif">
          <input type="text" placeholder="Ex: Déjeuner client Paris"
            value={form.description ?? ""} onChange={e => {
              const v = e.target.value;
              setForm(f => {
                if (!catManualRef.current && rules?.length) {
                  const matched = applyRules(v, rules);
                  if (matched) return { ...f, description: v, category: matched };
                }
                return { ...f, description: v };
              });
            }} className={inp} />
        </Field>

                <Field label="Catégorie">
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {CATS.map(({ v, l, I, c }) => (
              <button key={v} type="button" onClick={() => set("category", v)}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-[0.58rem] font-medium border transition-all"
                style={{
                  backgroundColor: form.category === v ? c + "2a" : "transparent",
                  borderColor:     form.category === v ? c + "55" : (isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb"),
                  color:           form.category === v ? c : (isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"),
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
              <ChevronDown size={11} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            </div>
          </Field>
          <Field label="Statut">
            <div className="relative">
              <select value={form.status ?? "draft"} onChange={e => set("status", e.target.value)} className={sel}>
                {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <ChevronDown size={11} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
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
                  : isDark ? "border-white/[0.08] bg-white/[0.04] text-white/30" : "border-gray-200 bg-gray-50 text-gray-400"
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
              <ChevronDown size={11} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            </div>
          </Field>
        )}

                <Field label="Notes internes">
          <textarea rows={2} placeholder="Notes…"
            value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
            className={`${inp} resize-none`} />
        </Field>

        {/* ── Récurrence ─────────────────────────────────────────────────── */}
        <div className={`rounded-xl border p-3 space-y-3 ${isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat2 size={13} className={isDark ? "text-white/35" : "text-gray-400"} />
              <span className={`text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>Dépense récurrente</span>
            </div>
            <button type="button"
              onClick={() => {
                const enabling = !form.recur_freq;
                set("recur_freq",      enabling ? "mensuel" : null);
                set("recur_next_date", enabling ? nextRecurDate("mensuel", form.date ?? new Date().toISOString().slice(0, 10)) : null);
              }}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.recur_freq ? "bg-[#c9a55a]" : isDark ? "bg-white/10" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.recur_freq ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {form.recur_freq && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Field label="Fréquence">
                <div className="relative">
                  <select value={form.recur_freq}
                    onChange={e => {
                      const f = e.target.value as RecurFreq;
                      set("recur_freq", f);
                      set("recur_next_date", nextRecurDate(f, form.date ?? new Date().toISOString().slice(0, 10)));
                    }}
                    className={sel}>
                    {RECUR_FREQS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </select>
                  <ChevronDown size={11} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
                </div>
              </Field>
              <Field label="Prochaine occurrence">
                <input type="date" value={form.recur_next_date ?? ""}
                  onChange={e => set("recur_next_date", e.target.value)}
                  className={`${inp} [color-scheme:dark]`} />
              </Field>
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-3 space-y-2.5 ${isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>Justificatif</span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={ocring || uploading}
              className="flex items-center gap-1.5 text-[0.65rem] text-purple-400/60 hover:text-purple-400 transition-colors disabled:opacity-40">
              {ocring
                ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-purple-400/40 border-t-purple-400" />
                : <Zap size={11} />}
              {ocring ? "Analyse IA…" : "Scan IA"}
            </button>
          </div>
          {ocrFields.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1.5 text-[0.62rem] text-green-400">
              <CheckCircle2 size={11} className="shrink-0" />
              <span>Extraits : {ocrFields.join(", ")}</span>
              <button type="button" onClick={() => setOcrFields([])} className="ml-auto text-green-400/40 hover:text-green-400 transition-colors"><X size={10} /></button>
            </div>
          )}
          {form.receipt_url ? (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/\.(jpe?g|png|webp)$/i.test(form.receipt_url) ? (
                  <a href={form.receipt_url} target="_blank" rel="noreferrer"
                    className={`block overflow-hidden rounded-xl border ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
                                        <img src={form.receipt_url} alt="Justificatif" className="w-full max-h-36 object-cover" />
                  </a>
                ) : (
                  <a href={form.receipt_url} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-[0.72rem] text-blue-400 hover:text-blue-500 transition-colors ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                    <FileCheck size={14} /> Voir le justificatif (PDF)
                  </a>
                )}
              </div>
              <button type="button" onClick={() => set("receipt_url", "")}
                className={`shrink-0 rounded-lg p-1.5 hover:text-red-400 hover:bg-red-500/10 transition-all ${isDark ? "text-white/20" : "text-gray-300"}`}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center gap-2 cursor-pointer rounded-xl border border-dashed py-5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""} ${isDark ? "border-white/[0.10] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}`}>
              <Upload size={18} className={isDark ? "text-white/20" : "text-gray-400"} />
              <span className={`px-4 text-center text-[0.68rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>
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

        {saveError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[0.7rem] text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            {saveError}
          </div>
        )}

                <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className={`flex-1 rounded-xl border py-2.5 text-[0.78rem] transition-colors ${isDark ? "border-white/[0.08] text-white/40 hover:text-white/60" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
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
  const isDark = useDark();
  const inp    = isDark ? INP_DARK : INP_LITE;
  const sel    = isDark ? SEL_DARK : SEL_LITE;
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
        className={`w-full max-w-sm rounded-2xl border p-5 space-y-4 ${isDark ? "border-white/[0.08] bg-[#0e1117]" : "border-gray-200 bg-white"}`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {report ? "Modifier la note" : "Nouvelle note de frais"}
          </h2>
          <button onClick={onClose} className={`transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}><X size={18} /></button>
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
            className={`flex-1 rounded-xl border py-2.5 text-[0.78rem] transition-colors ${isDark ? "border-white/[0.08] text-white/40 hover:text-white/60" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
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
  const isDark = useDark();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  function commit() { onSave(parseFloat(val) || 0); setEditing(false); }

  if (!editing) return (
    <button onClick={() => { setVal(String(value)); setEditing(true); }}
      className={`min-w-[72px] text-right text-[0.72rem] transition-colors ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
      {value > 0 ? fmtCur(value) : <span className={isDark ? "text-white/25" : "text-gray-400"}>+ Budget</span>}
    </button>
  );
  return (
    <input autoFocus type="number" value={val} onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className={`w-20 rounded-lg border px-2 py-0.5 text-right text-[0.72rem] outline-none ${isDark ? "bg-white/[0.06] text-white" : "bg-gray-50 text-gray-900"}`}
      style={{ borderColor: color + "44" }} />
  );
}

function BudgetView({
  expenses, budgets, userId, rates, onBudgetsChange,
}: {
  expenses: Expense[];
  budgets: ExpenseBudget[];
  userId: string;
  rates: Record<string, number>;
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
        result[e.category] = (result[e.category] ?? 0) + amtEur(e, rates);
      }
    });
    return result;
  }, [expenses, month, rates]);

  const isDark = useDark();
  const getBudget = (cat: string) =>
    budgets.find(b => b.category === cat && b.period === "monthly" && b.year === year && b.month === mo)?.amount ?? 0;

  async function saveBudget(cat: string, amount: number) {
    const existing = budgets.find(b => b.category === cat && b.period === "monthly" && b.year === year && b.month === mo);
    if (existing) {
      const { data } = await supabase.from("expense_budgets").update({ amount }).eq("id", existing.id).eq("user_id", userId).select().single();
      if (data) onBudgetsChange(budgets.map(b => b.id === existing.id ? data as ExpenseBudget : b));
    } else {
      const { data } = await supabase.from("expense_budgets").insert({
        user_id: userId, category: cat, amount, period: "monthly", year, month: mo,
        alert_threshold: 80, notify_push: true, notify_email: false,
      }).select().single();
      if (data) onBudgetsChange([...budgets, data as ExpenseBudget]);
    }
  }

  async function saveAlertSettings(budgetId: string, patch: Partial<Pick<ExpenseBudget, "alert_threshold" | "notify_push" | "notify_email">>) {
    const { data } = await supabase.from("expense_budgets").update(patch).eq("id", budgetId).select().single();
    if (data) onBudgetsChange(budgets.map(b => b.id === budgetId ? data as ExpenseBudget : b));
  }

  const totalBudget = CATS.reduce((a, { v }) => a + getBudget(v), 0);
  const totalSpent  = Object.values(spent).reduce((a, b) => a + b, 0);
  const over = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <Calendar size={13} className={`shrink-0 ${isDark ? "text-white/30" : "text-gray-400"}`} />
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className={`bg-transparent text-[0.78rem] outline-none ${isDark ? "[color-scheme:dark] text-white" : "text-gray-900"}`} />
        </div>
        <p className={`text-[0.72rem] ${isDark ? "text-white/40" : "text-gray-500"}`}>
          Budget total : <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{fmtCur(totalBudget)}</span>
          {" · "}Dépensé : <span className={`font-semibold ${over ? "text-red-400" : "text-green-400"}`}>{fmtCur(totalSpent)}</span>
          {totalBudget > 0 && (
            <span className={`ml-1 ${over ? "text-red-400" : isDark ? "text-white/30" : "text-gray-400"}`}>
              ({over ? "+" : ""}{fmtCur(totalSpent - totalBudget)})
            </span>
          )}
        </p>
      </div>

      {(() => {
        const overCats = CATS.filter(({ v }) => getBudget(v) > 0 && (spent[v] ?? 0) > getBudget(v));
        if (overCats.length === 0) return null;
        return (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
            <AlertTriangle size={14} className="shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="text-[0.72rem] font-semibold text-red-400">
                {overCats.length} catégorie{overCats.length > 1 ? "s" : ""} en dépassement ({fmtMonthYear(month)})
              </p>
              <p className="mt-0.5 text-[0.65rem] text-red-400/70">{overCats.map(c => c.l).join(", ")}</p>
            </div>
          </div>
        );
      })()}

      <div className="space-y-2">
        {CATS.map(({ v, l, I, c }) => {
          const budRec  = budgets.find(b => b.category === v && b.period === "monthly" && b.year === year && b.month === mo);
          const budget  = budRec?.amount ?? 0;
          const s       = spent[v] ?? 0;
          const pct     = budget > 0 ? Math.min((s / budget) * 100, 100) : 0;
          const catOver = budget > 0 && s > budget;
          const alertThr  = budRec?.alert_threshold ?? 80;
          const nPush     = budRec?.notify_push ?? true;
          const nEmail    = budRec?.notify_email ?? false;
          const threshPct = budget > 0 ? (s / budget) * 100 : 0;
          const nearAlert = budget > 0 && threshPct >= alertThr && !catOver;
          return (
            <div key={v} className={`rounded-xl border p-3 space-y-2 ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c + "22" }}>
                  <I size={13} style={{ color: c }} />
                </div>
                <span className={`flex-1 text-[0.78rem] font-medium ${isDark ? "text-white/80" : "text-gray-800"}`}>{l}</span>
                <span className={`text-[0.72rem] ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtCur(s)}</span>
                <span className={`text-[0.6rem] ${isDark ? "text-white/20" : "text-gray-300"}`}>/</span>
                <BudgetInput value={budget} onSave={v2 => saveBudget(v, v2)} color={c} />
                {catOver  && <AlertTriangle size={13} className="shrink-0 text-red-400" />}
                {nearAlert && !catOver && <AlertTriangle size={13} className="shrink-0 text-amber-400" />}
              </div>
              {budget > 0 && (
                <>
                  {/* Progress bar */}
                  <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: catOver ? "#ef4444" : nearAlert ? "#f59e0b" : c }} />
                  </div>
                  {/* Alert config */}
                  {budRec && (
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 border-t ${isDark ? "border-white/[0.05]" : "border-gray-100"}`}>
                      <span className={`text-[0.58rem] font-medium uppercase tracking-wider ${isDark ? "text-white/25" : "text-gray-400"}`}>Alerte</span>
                      {/* Threshold */}
                      <div className="flex gap-1">
                        {[50, 75, 80, 90, 100].map(t => (
                          <button key={t} onClick={() => saveAlertSettings(budRec.id, { alert_threshold: t })}
                            className="rounded px-1.5 py-0.5 text-[0.55rem] font-semibold border transition-all"
                            style={alertThr === t
                              ? { background: c, borderColor: c, color: "#fff" }
                              : { borderColor: "transparent", color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }
                            }>
                            {t}%
                          </button>
                        ))}
                      </div>
                      {/* Push toggle */}
                      <label className={`flex items-center gap-1 cursor-pointer select-none text-[0.6rem] ${isDark ? "text-white/40" : "text-gray-500"}`}>
                        <input type="checkbox" className="h-3 w-3 accent-[#c9a55a]" checked={nPush}
                          onChange={e => saveAlertSettings(budRec.id, { notify_push: e.target.checked })} />
                        Push
                      </label>
                      {/* Email toggle */}
                      <label className={`flex items-center gap-1 cursor-pointer select-none text-[0.6rem] ${isDark ? "text-white/40" : "text-gray-500"}`}>
                        <input type="checkbox" className="h-3 w-3 accent-[#c9a55a]" checked={nEmail}
                          onChange={e => saveAlertSettings(budRec.id, { notify_email: e.target.checked })} />
                        Email
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type BankTx = { id: string; date: string; desc: string; amount: number; matchedId: string | null };

function parseBankCSV(text: string): BankTx[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep  = lines[0].includes(";") ? ";" : ",";
  const raw  = (s: string) => s.trim().replace(/^"|"$/g, "");
  const hdrs = lines[0].split(sep).map(h => raw(h).toLowerCase());
  const find = (...kw: string[]) => hdrs.findIndex(h => kw.some(k => h.includes(k)));
  const dateI = find("date");
  const descI = find("libel", "descr", "motif", "opér", "intit");
  const amtI  = find("mont", "amount");
  const debI  = find("débit", "debit");
  const creI  = find("crédit", "credit");
  if (dateI === -1) return [];
  const toNum = (s: string) => parseFloat(s.replace(/[\s ]/g, "").replace(",", ".")) || 0;
  const result: BankTx[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c    = lines[i].split(sep).map(raw);
    const dRaw = c[dateI] ?? "";
    let date   = "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dRaw)) {
      const [d, m, y] = dRaw.split("/"); date = `${y}-${m}-${d}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dRaw)) date = dRaw;
    if (!date) continue;
    let amount = 0;
    if (amtI !== -1) amount = toNum(c[amtI] ?? "");
    else if (debI !== -1 || creI !== -1) {
      const deb = debI !== -1 ? toNum(c[debI] ?? "") : 0;
      const cre = creI !== -1 ? toNum(c[creI] ?? "") : 0;
      amount = cre - deb;
    }
    if (amount === 0) continue;
    const desc = descI !== -1 ? (c[descI] ?? "") : (c[1] ?? "");
    result.push({ id: `tx-${i}`, date, desc, amount, matchedId: null });
  }
  return result;
}

function autoMatch(txs: BankTx[], expenses: Expense[]): BankTx[] {
  return txs.map(tx => {
    if (tx.matchedId) return tx;
    const target = Math.abs(tx.amount);
    const match  = expenses.find(e => {
      const diff = Math.abs(new Date(e.date).getTime() - new Date(tx.date).getTime()) / 86_400_000;
      return diff <= 3 && target > 0 && Math.abs(e.amount - target) / target < 0.02;
    });
    return { ...tx, matchedId: match?.id ?? null };
  });
}

/* ─────────────────────────────── ExportPackModal ─────────────────────────── */

function sanitizeFilename(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40).replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function fileExtFromUrl(url: string): string {
  const m = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return m ? `.${m[1].toLowerCase()}` : ".bin";
}

function buildExpenseCsv(rows: Expense[]): string {
  const header = "Date;Catégorie;Description;Montant;Devise;Statut;Note de frais;Mode de paiement;Notes";
  const lines = rows.map(e => [
    e.date, getCat(e.category).l, `"${e.description.replace(/"/g,"'")}"`,
    e.amount.toFixed(2), e.currency, e.status,
    e.expense_report_id ?? "", e.payment_method,
    `"${(e.notes ?? "").replace(/"/g,"'")}"`,
  ].join(";"));
  return "﻿" + [header, ...lines].join("\r\n");
}

function ExportPackModal({
  expenses, reports, onClose,
}: {
  expenses: Expense[];
  reports: ExpenseReport[];
  onClose: () => void;
}) {
  const isDark = useDark();
  const inp    = isDark ? INP_DARK : INP_LITE;
  const sel    = isDark ? SEL_DARK : SEL_LITE;
  const now    = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [period,    setPeriod]    = useState(defaultPeriod);
  const [reportId,  setReportId]  = useState("");
  const [filterSt,  setFilterSt]  = useState("");
  const [progress,  setProgress]  = useState<{ done: number; total: number } | null>(null);
  const [error,     setError]     = useState("");

  const matching = useMemo(() => expenses.filter(e => {
    if (period   && !e.date.startsWith(period))            return false;
    if (reportId && e.expense_report_id !== reportId)       return false;
    if (filterSt && e.status !== filterSt)                  return false;
    return true;
  }), [expenses, period, reportId, filterSt]);

  const withReceipt = matching.filter(e => !!e.receipt_url);
  const total       = matching.reduce((a, e) => a + e.amount, 0);

  async function download() {
    setError("");
    setProgress({ done: 0, total: withReceipt.length + 1 });

    const JSZip = (await import("jszip")).default;
    const zip   = new JSZip();

    // CSV summary (all matching, not just receipts)
    zip.file("index.csv", buildExpenseCsv(matching));
    setProgress({ done: 1, total: withReceipt.length + 1 });

    // Receipts
    const folder = zip.folder("justificatifs")!;
    let done = 1;
    for (const e of withReceipt) {
      try {
        const res = await fetch(e.receipt_url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const ext  = fileExtFromUrl(e.receipt_url);
        const name = `${e.date}_${e.category}_${sanitizeFilename(e.description)}${ext}`;
        folder.file(name, blob);
      } catch {
        // skip inaccessible files silently
      }
      done++;
      setProgress({ done, total: withReceipt.length + 1 });
    }

    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `pack-depenses-${period || "export"}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setProgress(null);
    onClose();
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={progress ? undefined : onClose} />
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
        className={`relative z-10 w-full max-w-md rounded-2xl shadow-2xl ${isDark ? "bg-[#111827]" : "bg-white"}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "#c9a55a22" }}>
              <Download size={15} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Export pack justificatifs</h2>
              <p className={`text-[0.6rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>ZIP · index CSV + fichiers joints</p>
            </div>
          </div>
          {!progress && (
            <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-gray-100"}`}>
              <X size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`text-[0.63rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>Période (mois)</label>
              <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                className={`${inp} [color-scheme:${isDark ? "dark" : "light"}]`} />
            </div>
            <div className="space-y-1">
              <label className={`text-[0.63rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>Statut</label>
              <div className="relative">
                <select value={filterSt} onChange={e => setFilterSt(e.target.value)} className={sel}>
                  <option value="">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="submitted">Soumis</option>
                  <option value="approved">Approuvé</option>
                  <option value="reimbursed">Remboursé</option>
                  <option value="rejected">Rejeté</option>
                </select>
                <ChevronDown size={12} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
              </div>
            </div>
          </div>

          {reports.length > 0 && (
            <div className="space-y-1">
              <label className={`text-[0.63rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>Note de frais (optionnel)</label>
              <div className="relative">
                <select value={reportId} onChange={e => setReportId(e.target.value)} className={sel}>
                  <option value="">Toutes les notes</option>
                  {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <ChevronDown size={12} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className={`rounded-xl px-4 py-3 space-y-1.5 ${isDark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center">
              <span className={`text-[0.68rem] ${isDark ? "text-white/45" : "text-gray-500"}`}>Dépenses sélectionnées</span>
              <span className={`text-[0.78rem] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{matching.length} · {fmtCur(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-[0.68rem] ${isDark ? "text-white/45" : "text-gray-500"}`}>Avec justificatif</span>
              <span className={`text-[0.78rem] font-semibold ${withReceipt.length === 0 ? "text-red-400" : isDark ? "text-white" : "text-gray-900"}`}>
                {withReceipt.length} fichier{withReceipt.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-[0.68rem] ${isDark ? "text-white/45" : "text-gray-500"}`}>Contenu du ZIP</span>
              <span className={`text-[0.68rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>index.csv + {withReceipt.length} justificatif{withReceipt.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {error && <p className="text-[0.7rem] text-red-400">{error}</p>}

          {/* Progress */}
          {progress && (
            <div className="space-y-1.5">
              <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                <motion.div className="h-full rounded-full" style={{ background: "#c9a55a" }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className={`text-center text-[0.65rem] ${isDark ? "text-white/40" : "text-gray-400"}`}>
                {progress.done < progress.total
                  ? `Téléchargement ${progress.done}/${progress.total}…`
                  : "Génération du ZIP…"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!progress && (
          <div className={`px-5 pb-5 flex gap-2 border-t pt-4 ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
            <button onClick={onClose}
              className={`flex-1 rounded-xl py-2.5 text-[0.75rem] font-semibold border ${isDark ? "border-white/10 text-white/50" : "border-gray-200 text-gray-500"}`}>
              Annuler
            </button>
            <button disabled={matching.length === 0} onClick={download}
              className="flex-1 rounded-xl py-2.5 text-[0.75rem] font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#c9a55a,#e8c97a)" }}>
              {matching.length === 0 ? "Aucune dépense" : `Télécharger le pack`}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────── ApprobationView ─────────────────────────── */
const PIPELINE = [
  { id: "draft"      as ExpStatus, l: "Brouillons", color: "#6b7280", nextLabel: "Soumettre",  next: "submitted"  as ExpStatus },
  { id: "submitted"  as ExpStatus, l: "Soumis",     color: "#f59e0b", nextLabel: "Approuver",  next: "approved"   as ExpStatus, rejectLabel: "Rejeter" },
  { id: "approved"   as ExpStatus, l: "Approuvés",  color: "#10b981", nextLabel: "Rembourser", next: "reimbursed" as ExpStatus },
  { id: "reimbursed" as ExpStatus, l: "Remboursés", color: "#3b82f6" },
] as const;

function ApprobationView({
  expenses, setExpenses,
}: {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}) {
  const isDark   = useDark();
  const supabase = supabaseClient;
  const inp      = isDark ? INP_DARK : INP_LITE;

  const [step,    setStep]    = useState<ExpStatus>("submitted");
  const [pending, setPending] = useState<{ exp: Expense; next: ExpStatus } | null>(null);
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);

  const counts = Object.fromEntries(
    (["draft","submitted","approved","reimbursed","rejected"] as ExpStatus[]).map(s => [
      s, expenses.filter(e => e.status === s).length,
    ])
  );
  const shown    = expenses.filter(e => e.status === step);
  const pipe     = PIPELINE.find(p => p.id === step);
  const rejected = counts["rejected"] ?? 0;

  async function doTransition(exp: Expense, next: ExpStatus, cmt: string) {
    setSaving(true);
    const patch: Record<string, unknown> = { status: next, approval_comment: cmt };
    if (next === "approved") patch.approved_at = new Date().toISOString();
    if (next === "draft")    patch.approved_at = null;
    const { error } = await supabase.from("expenses").update(patch).eq("id", exp.id);
    setSaving(false);
    if (!error) {
      setExpenses(es => es.map(e => e.id === exp.id
        ? { ...e, status: next, approval_comment: cmt, approved_at: next === "approved" ? new Date().toISOString() : e.approved_at }
        : e
      ));
      setPending(null);
      setComment("");
    }
  }

  async function bulkNext(curr: ExpStatus, next: ExpStatus) {
    const targets = expenses.filter(e => e.status === curr);
    if (!targets.length) return;
    setSaving(true);
    const patch: Record<string, unknown> = { status: next };
    if (next === "approved") patch.approved_at = new Date().toISOString();
    await Promise.all(targets.map(e => supabase.from("expenses").update(patch).eq("id", e.id)));
    setSaving(false);
    setExpenses(es => es.map(e => e.status === curr
      ? { ...e, status: next, approved_at: next === "approved" ? new Date().toISOString() : e.approved_at }
      : e
    ));
  }

  return (
    <div className="space-y-5">
      {/* ── Pipeline stepper ── */}
      <div className={`rounded-2xl p-4 ${isDark ? "bg-white/[0.03]" : "bg-white"}`}>
        <div className="flex items-center gap-0 overflow-x-auto">
          {PIPELINE.map((p, i) => (
            <div key={p.id} className="flex items-center flex-1 min-w-0">
              <button onClick={() => setStep(p.id)}
                className="flex flex-col items-center gap-1 w-full py-2 px-1 rounded-xl transition-all"
                style={{
                  background:   step === p.id ? p.color + "18" : "transparent",
                  borderBottom: `2px solid ${step === p.id ? p.color : "transparent"}`,
                }}>
                <span className="text-xl font-extrabold tabular-nums leading-none" style={{ color: p.color }}>
                  {counts[p.id] ?? 0}
                </span>
                <span className={`text-[0.58rem] font-semibold uppercase tracking-wider ${isDark ? "text-white/50" : "text-gray-400"}`}>
                  {p.l}
                </span>
              </button>
              {i < PIPELINE.length - 1 && (
                <div className={`w-5 shrink-0 border-t-2 ${isDark ? "border-white/[0.07]" : "border-gray-100"}`} />
              )}
            </div>
          ))}
          {/* Rejetés — side branch */}
          {rejected > 0 && <>
            <div className={`w-5 shrink-0 border-t-2 border-dashed ${isDark ? "border-white/[0.07]" : "border-gray-200"}`} />
            <button onClick={() => setStep("rejected")}
              className="flex flex-col items-center gap-1 min-w-[68px] py-2 px-1 rounded-xl transition-all"
              style={{
                background:   step === "rejected" ? "#ef444418" : "transparent",
                borderBottom: `2px solid ${step === "rejected" ? "#ef4444" : "transparent"}`,
              }}>
              <span className="text-xl font-extrabold tabular-nums leading-none text-red-400">{rejected}</span>
              <span className={`text-[0.58rem] font-semibold uppercase tracking-wider ${isDark ? "text-white/50" : "text-gray-400"}`}>Rejetés</span>
            </button>
          </>}
        </div>
      </div>

      {/* ── Bulk action banner ── */}
      {pipe && "next" in pipe && pipe.next && shown.length > 1 && (
        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-100 bg-gray-50"}`}>
          <span className={`text-[0.72rem] ${isDark ? "text-white/45" : "text-gray-500"}`}>
            {shown.length} dépenses à traiter
          </span>
          <button disabled={saving} onClick={() => bulkNext(pipe.id, pipe.next as ExpStatus)}
            className="rounded-lg px-3 py-1 text-[0.7rem] font-semibold text-white disabled:opacity-50"
            style={{ background: pipe.color }}>
            {saving ? "…" : `Tout ${pipe.nextLabel.toLowerCase()}`}
          </button>
        </div>
      )}

      {/* ── Expense list ── */}
      {shown.length === 0 ? (
        <div className={`flex flex-col items-center gap-2 py-16 rounded-2xl ${isDark ? "bg-white/[0.02]" : "bg-white"}`}>
          <CheckCircle2 size={30} className="opacity-20" style={{ color: pipe?.color ?? "#6b7280" }} />
          <p className={`text-sm font-medium ${isDark ? "text-white/30" : "text-gray-400"}`}>
            Aucune dépense dans cette étape
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(exp => {
            const ci = getCat(exp.category);
            return (
              <div key={exp.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isDark ? "bg-white/[0.04]" : "bg-white"}`}>
                <div className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: ci.c + "22" }}>
                  <ci.I size={14} style={{ color: ci.c }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[0.78rem] font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                    {exp.description || "—"}
                  </p>
                  <p className={`text-[0.62rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    {fmtDate(exp.date)} · {ci.l} · {fmtCur(exp.amount, exp.currency)}
                  </p>
                  {exp.approval_comment && (
                    <p className={`text-[0.6rem] italic mt-0.5 truncate ${isDark ? "text-white/25" : "text-gray-400"}`}>
                      « {exp.approval_comment} »
                    </p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {pipe && "next" in pipe && pipe.next && (
                    <button
                      onClick={() => { setPending({ exp, next: pipe.next as ExpStatus }); setComment(exp.approval_comment ?? ""); }}
                      className="h-7 rounded-lg px-2.5 text-[0.65rem] font-semibold text-white"
                      style={{ background: pipe.color }}>
                      {pipe.nextLabel}
                    </button>
                  )}
                  {pipe && "rejectLabel" in pipe && (
                    <button
                      onClick={() => { setPending({ exp, next: "rejected" }); setComment(""); }}
                      className={`h-7 rounded-lg px-2 text-[0.65rem] font-semibold border ${isDark ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
                      Rejeter
                    </button>
                  )}
                  {step === "rejected" && (
                    <button
                      onClick={() => { setPending({ exp, next: "draft" }); setComment(""); }}
                      className={`h-7 rounded-lg px-2 text-[0.65rem] font-semibold border ${isDark ? "border-white/10 text-white/40" : "border-gray-200 text-gray-500"}`}>
                      ↩ Brouillon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm modal ── */}
      <AnimatePresence>
        {pending && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPending(null)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
              className={`relative z-10 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl ${isDark ? "bg-[#111827]" : "bg-white"}`}>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {pending.next === "rejected" ? "Rejeter" :
                   pending.next === "draft"    ? "Remettre en brouillon" :
                   (PIPELINE.find(p => p.id === step) as { nextLabel?: string } | undefined)?.nextLabel ?? "Confirmer"}
                </h3>
                <p className={`text-[0.7rem] mt-1 truncate ${isDark ? "text-white/40" : "text-gray-400"}`}>
                  {pending.exp.description} · {fmtCur(pending.exp.amount, pending.exp.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>
                  Commentaire (optionnel)
                </label>
                <input value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={pending.next === "rejected" ? "Motif du rejet…" : "Note…"}
                  className={inp} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPending(null)}
                  className={`flex-1 rounded-xl py-2 text-[0.75rem] font-semibold border ${isDark ? "border-white/10 text-white/50" : "border-gray-200 text-gray-500"}`}>
                  Annuler
                </button>
                <button disabled={saving} onClick={() => doTransition(pending.exp, pending.next, comment)}
                  className="flex-1 rounded-xl py-2 text-[0.75rem] font-semibold text-white disabled:opacity-50"
                  style={{ background: pending.next === "rejected" ? "#ef4444" : (PIPELINE.find(p => p.id === step)?.color ?? "#6b7280") }}>
                  {saving ? "…" : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── SVG Donut helper ───────────────────────────────────────────────────────── */
function DonutChart({ segments }: { segments: { color: string; pct: number }[] }) {
  const R = 52; const CX = 60; const CY = 60; const stroke = 14;
  let angle = -Math.PI / 2;
  const arcs: React.ReactNode[] = [];
  segments.forEach(({ color, pct }, i) => {
    if (pct <= 0) return;
    const sweep = (pct / 100) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    angle += sweep;
    const x2 = CX + R * Math.cos(angle);
    const y2 = CY + R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    arcs.push(
      <path key={i}
        d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="butt" />
    );
  });
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[120px]">
      {arcs}
    </svg>
  );
}

function RapportView({ expenses, rates = { EUR: 1 } }: { expenses: Expense[]; rates?: Record<string, number> }) {
  const now    = new Date();
  const isDark = useDark();

  /* ── Controls ── */
  const [year,       setYear]       = useState(now.getFullYear());
  const [focusMonth, setFocusMonth] = useState<string | null>(null); // "YYYY-MM"
  const [exporting,  setExporting]  = useState(false);

  /* ── Datasets ── */
  const valid = useMemo(() => expenses.filter(e => e.status !== "rejected"), [expenses]);

  const yearStr = String(year);
  const yearExp = useMemo(() => valid.filter(e => e.date.startsWith(yearStr)), [valid, yearStr]);

  const trend = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m   = String(i + 1).padStart(2, "0");
    const key = `${year}-${m}`;
    const d   = new Date(year, i, 1);
    return {
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      key,
      total: yearExp.filter(e => e.date.startsWith(key)).reduce((a, e) => a + amtEur(e, rates), 0),
      count: yearExp.filter(e => e.date.startsWith(key)).length,
    };
  }), [yearExp, year, rates]);

  const focusExp = focusMonth
    ? yearExp.filter(e => e.date.startsWith(focusMonth))
    : yearExp;

  const byCat = useMemo(() => {
    const r: Record<string, number> = {};
    focusExp.forEach(e => { r[e.category] = (r[e.category] ?? 0) + amtEur(e, rates); });
    return Object.entries(r).sort((a, b) => b[1] - a[1]);
  }, [focusExp, rates]);

  const byPay = useMemo(() => {
    const r: Record<string, number> = {};
    focusExp.forEach(e => { r[e.payment_method] = (r[e.payment_method] ?? 0) + amtEur(e, rates); });
    return Object.entries(r).sort((a, b) => b[1] - a[1]);
  }, [focusExp, rates]);

  /* ── KPIs ── */
  const maxTrend   = Math.max(...trend.map(t => t.total), 1);
  const allTotal   = yearExp.reduce((a, e) => a + amtEur(e, rates), 0);
  const allTotalFr = focusExp.reduce((a, e) => a + amtEur(e, rates), 0);
  const maxCat     = byCat[0]?.[1] ?? 1;
  const top5       = useMemo(() => [...focusExp].sort((a, b) => amtEur(b, rates) - amtEur(a, rates)).slice(0, 5), [focusExp, rates]);

  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthKey = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const thisTotal = valid.filter(e => e.date.startsWith(thisMonthKey)).reduce((a, e) => a + amtEur(e, rates), 0);
  const lastTotal = valid.filter(e => e.date.startsWith(prevMonthKey)).reduce((a, e) => a + amtEur(e, rates), 0);
  const momPct    = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const daysPassed = year < now.getFullYear() ? daysInYear
    : Math.min(now.getFullYear() === year
      ? Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / 86_400_000) + 1
      : daysInYear, daysInYear);
  const avgDay     = daysPassed > 0 ? allTotal / daysPassed : 0;

  const maxExp     = [...yearExp].sort((a, b) => amtEur(b, rates) - amtEur(a, rates))[0];
  const noReceipt  = yearExp.filter(e => !e.receipt_url).length;
  const approvedPct = yearExp.length > 0
    ? Math.round((yearExp.filter(e => e.status === "approved" || e.status === "reimbursed").length / yearExp.length) * 100)
    : 0;

  const KPI = [
    { l: "Ce mois",       v: fmtCur(thisTotal),
      sub: momPct !== 0 ? `${momPct > 0 ? "▲" : "▼"} ${Math.abs(momPct).toFixed(0)}% vs mois préc.` : "—",
      c: momPct > 5 ? "#ef4444" : momPct < -5 ? "#10b981" : "#6b7280" },
    { l: `Total ${year}`, v: fmtCur(allTotal),     sub: `${yearExp.length} dépense${yearExp.length !== 1 ? "s" : ""}`,      c: "#c9a55a" },
    { l: "Moy. / jour",   v: fmtCur(avgDay),       sub: `sur ${daysPassed} jour${daysPassed !== 1 ? "s" : ""}`,             c: "#3b82f6" },
    { l: "Dépense max",   v: maxExp ? fmtCur(amtEur(maxExp, rates)) : "—",
      sub: maxExp ? `${getCat(maxExp.category).l} · ${fmtDate(maxExp.date)}` : "Aucune", c: "#8b5cf6" },
    { l: "Taux approbation", v: `${approvedPct}%`, sub: `${yearExp.filter(e => e.status==="approved"||e.status==="reimbursed").length} / ${yearExp.length}`, c: "#10b981" },
    { l: "Sans justificatif", v: String(noReceipt), sub: `${yearExp.length > 0 ? Math.round((noReceipt/yearExp.length)*100) : 0}% des dépenses ${yearStr}`, c: noReceipt > 0 ? "#f59e0b" : "#10b981" },
  ];

  /* ── Donut segments ── */
  const donutSegs = byCat.slice(0, 8).map(([cat, total]) => ({
    color: getCat(cat).c,
    pct:   (total / (allTotalFr || 1)) * 100,
  }));

  /* ── PDF export ── */
  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const w = 210;
      // Header
      doc.setFillColor(10, 10, 14);
      doc.rect(0, 0, w, 30, "F");
      doc.setTextColor(201, 165, 90);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text(`Rapport de dépenses ${year}`, 14, 13);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} · ${yearExp.length} dépenses · Total : ${fmtCur(allTotal)}`, 14, 22);

      // KPI tiles
      doc.setTextColor(50, 50, 50); doc.setFontSize(8);
      let y = 40;
      const cols = [14, 65, 116, 160];
      [KPI.slice(0,3), KPI.slice(3,6)].forEach(row => {
        row.forEach(({ l, v }, i) => {
          doc.setFont("helvetica", "bold"); doc.setFontSize(7);
          doc.setTextColor(130, 130, 130);
          doc.text(l.toUpperCase(), cols[i], y);
          doc.setFont("helvetica", "bold"); doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(v, cols[i], y + 6);
        });
        y += 16;
      });

      // Monthly table
      y += 4;
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, w - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("MOIS", 16, y + 4);
      doc.text("DÉPENSES", 90, y + 4);
      doc.text("TOTAL (EUR)", 145, y + 4);
      y += 8;
      trend.forEach(({ label, key, total, count }) => {
        if (total === 0) return;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(label.charAt(0).toUpperCase() + label.slice(1) + ` ${year}`, 16, y);
        doc.text(String(count), 90, y);
        doc.setFont("helvetica", "bold");
        doc.text(fmtCur(total), 145, y);
        y += 6;
        if (y > 260) { doc.addPage(); y = 20; }
      });

      // Category breakdown
      y += 6;
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, w - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text("CATÉGORIE", 16, y + 4); doc.text("TOTAL", 145, y + 4); doc.text("%", 185, y + 4);
      y += 8;
      byCat.forEach(([cat, total]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(50, 50, 50);
        doc.text(getCat(cat).l, 16, y);
        doc.setFont("helvetica", "bold");
        doc.text(fmtCur(total), 145, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${Math.round((total / (allTotal || 1)) * 100)}%`, 185, y);
        y += 6;
      });

      // Footer
      doc.setFont("helvetica", "normal"); doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text("DJAMA · Gestion financière", 14, 288);
      doc.text(String(doc.getNumberOfPages()), w - 14, 288, { align: "right" });

      doc.save(`rapport-depenses-${year}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const card = `rounded-2xl border p-4 ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"}`;

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
          <button onClick={() => setYear(y => y - 1)}
            className={`h-6 w-6 flex items-center justify-center rounded-lg text-[0.75rem] transition-all ${isDark ? "hover:bg-white/[0.08] text-white/40" : "hover:bg-gray-100 text-gray-500"}`}>
            ‹
          </button>
          <span className={`w-10 text-center text-[0.8rem] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= now.getFullYear()}
            className={`h-6 w-6 flex items-center justify-center rounded-lg text-[0.75rem] transition-all disabled:opacity-30 ${isDark ? "hover:bg-white/[0.08] text-white/40" : "hover:bg-gray-100 text-gray-500"}`}>
            ›
          </button>
        </div>
        {focusMonth && (
          <button onClick={() => setFocusMonth(null)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.7rem] font-semibold ${isDark ? "border-[#c9a55a]/30 text-[#c9a55a] bg-[#c9a55a]/10" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
            <X size={10} /> {fmtMonthYear(focusMonth)} — voir toute l'année
          </button>
        )}
        <button disabled={exporting} onClick={exportPDF}
          className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-[0.72rem] font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
          <Download size={12} /> {exporting ? "Génération…" : `PDF ${year}`}
        </button>
      </div>

      {/* ── KPI tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KPI.map(({ l, v, sub, c }) => (
          <div key={l} className={`${card} space-y-1`}>
            <p className={`text-[0.62rem] font-medium uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>{l}</p>
            <p className={`text-[1.15rem] font-extrabold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>{v}</p>
            <p className="text-[0.6rem] leading-tight truncate" style={{ color: c }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── 12-month trend ── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-[0.68rem] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>
            Tendance {year} {focusMonth ? `· ${fmtMonthYear(focusMonth)}` : ""}
          </h3>
          <span className={`text-[0.62rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>Cliquer pour filtrer</span>
        </div>
        <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height: "100px" }}>
          {trend.map(({ label, key, total, count }) => {
            const isFocus = key === focusMonth;
            const isCur   = key === thisMonthKey;
            return (
              <button key={key} onClick={() => setFocusMonth(isFocus ? null : key)}
                className="flex flex-1 min-w-0 flex-col items-center gap-1 cursor-pointer group transition-all"
                style={{ minWidth: "16px" }}>
                {total > 0 && (
                  <span className={`text-[0.48rem] leading-none transition-opacity ${isDark ? "text-white/30" : "text-gray-400"} ${isFocus ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {total >= 1000 ? `${(total / 1000).toFixed(0)}k` : `${Math.round(total)}`}
                  </span>
                )}
                <div className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height:           `${Math.max((total / maxTrend) * 68, total > 0 ? 3 : 1)}px`,
                    backgroundColor:  isFocus ? "#c9a55a" : isCur ? "#c9a55a88" : isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb",
                    outline:          isFocus ? "2px solid #c9a55a" : "none",
                    outlineOffset:    "2px",
                  }} />
                <span className={`text-[0.5rem] transition-all ${isFocus ? "font-bold text-[#c9a55a]" : isDark ? "text-white/25" : "text-gray-400"}`}>
                  {label}
                </span>
                {count > 0 && (
                  <span className={`text-[0.45rem] leading-none ${isDark ? "text-white/15" : "text-gray-300"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category donut + breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${card} space-y-3`}>
          <h3 className={`text-[0.68rem] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>
            Catégories {focusMonth ? `· ${fmtMonthYear(focusMonth)}` : `· ${year}`}
          </h3>
          {byCat.length === 0
            ? <p className={`py-6 text-center text-[0.72rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune dépense</p>
            : (
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <DonutChart segments={donutSegs} />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {byCat.slice(0, 6).map(([cat, total]) => {
                    const info = getCat(cat);
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: info.c }} />
                        <span className={`flex-1 min-w-0 truncate text-[0.62rem] ${isDark ? "text-white/50" : "text-gray-500"}`}>{info.l}</span>
                        <span className={`shrink-0 text-[0.62rem] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>
                          {Math.round((total / (allTotalFr || 1)) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

        {/* ── Top 5 ── */}
        <div className={`${card} space-y-3`}>
          <h3 className={`text-[0.68rem] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>
            Top dépenses {focusMonth ? `· ${fmtMonthYear(focusMonth)}` : `· ${year}`}
          </h3>
          {top5.length === 0
            ? <p className={`py-6 text-center text-[0.72rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune dépense</p>
            : (
              <div className="space-y-1.5">
                {top5.map((e, i) => {
                  const eur = amtEur(e, rates);
                  return (
                    <div key={e.id} className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}>
                      <span className={`w-4 shrink-0 text-[0.58rem] font-semibold ${isDark ? "text-white/20" : "text-gray-300"}`}>#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-[0.72rem] font-semibold ${isDark ? "text-white/80" : "text-gray-800"}`}>{e.description || "—"}</p>
                        <p className={`text-[0.58rem] ${isDark ? "text-white/28" : "text-gray-400"}`}>{fmtDate(e.date)} · {getCat(e.category).l}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-[0.78rem] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{fmtCur(e.amount, e.currency)}</span>
                        {e.currency !== "EUR" && (
                          <p className={`text-[0.55rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>≈ {fmtCur(eur)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* ── Payment method ── */}
      <div className={`${card} space-y-3`}>
        <h3 className={`text-[0.68rem] font-bold uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>
          Par moyen de paiement {focusMonth ? `· ${fmtMonthYear(focusMonth)}` : `· ${year}`}
        </h3>
        {byPay.length === 0
          ? <p className={`py-4 text-center text-[0.72rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune dépense</p>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {byPay.map(([pay, total]) => {
                const info = PAY_METHODS.find(m => m.v === pay);
                const share = (total / (allTotalFr || 1)) * 100;
                return (
                  <div key={pay} className="flex items-center gap-2.5">
                    <div className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                      {info ? <info.I size={11} className={isDark ? "text-white/40" : "text-gray-500"} /> : <CreditCard size={11} />}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-[0.65rem] truncate ${isDark ? "text-white/55" : "text-gray-600"}`}>{info?.l ?? pay}</span>
                        <span className={`ml-2 shrink-0 text-[0.65rem] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{fmtCur(total)}</span>
                      </div>
                      <div className={`h-1 overflow-hidden rounded-full ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor: "#c9a55a" }}
                          initial={{ width: 0 }} animate={{ width: `${share}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }} />
                      </div>
                    </div>
                    <span className={`shrink-0 text-[0.58rem] w-7 text-right ${isDark ? "text-white/25" : "text-gray-400"}`}>{share.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

function RapprochementView({ expenses }: { expenses: Expense[] }) {
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [txs,       setTxs]       = useState<BankTx[]>([]);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setTxs(autoMatch(parseBankCSV(ev.target?.result as string ?? ""), expenses));
    reader.readAsText(f, "utf-8");
    e.target.value = "";
  }

  function handlePaste() {
    setTxs(autoMatch(parseBankCSV(pasteText), expenses));
    setShowPaste(false); setPasteText("");
  }

  function toggleMatch(txId: string, expId: string) {
    setTxs(prev => prev.map(t => t.id === txId ? { ...t, matchedId: t.matchedId === expId ? null : expId } : t));
  }

  const isDark         = useDark();
  const matchedCount   = txs.filter(t => t.matchedId !== null).length;
  const unmatchedCount = txs.filter(t => t.matchedId === null).length;

  if (txs.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`flex flex-col items-center gap-4 rounded-2xl border border-dashed py-12 ${isDark ? "border-white/[0.10] bg-white/[0.01]" : "border-gray-300 bg-gray-50"}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
            <Landmark size={24} style={{ color: "#c9a55a66" }} />
          </div>
          <div className="text-center space-y-1">
            <p className={`text-[0.85rem] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>Rapprochement bancaire</p>
            <p className={`text-[0.7rem] max-w-xs ${isDark ? "text-white/30" : "text-gray-500"}`}>Importez un relevé CSV de votre banque pour rapprocher automatiquement vos transactions avec vos dépenses enregistrées.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef2.current?.click()}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] font-bold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              <Upload size={13} /> Importer CSV
            </button>
            <button onClick={() => setShowPaste(true)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[0.72rem] transition-colors ${isDark ? "border-white/[0.08] text-white/40 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-900"}`}>
              Coller CSV
            </button>
          </div>
          <input ref={fileRef2} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
        </div>

        {showPaste && (
          <div className="space-y-2">
            <textarea rows={6} value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder={"Collez votre relevé bancaire CSV…\n\nEx: Date;Libellé;Montant\n15/01/2025;Déjeuner client;-45.50"}
              className={`w-full rounded-xl border px-3 py-2.5 text-[0.75rem] outline-none resize-none font-mono transition-all ${isDark ? "border-white/[0.08] bg-white/[0.03] text-white/70 placeholder-white/20 focus:border-white/20" : "border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:border-gray-300"}`} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPaste(false)} className={`rounded-xl border px-3 py-1.5 text-[0.7rem] transition-colors ${isDark ? "border-white/[0.08] text-white/30 hover:text-white/60" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>Annuler</button>
              <button onClick={handlePaste} disabled={!pasteText.trim()}
                className="rounded-xl px-4 py-1.5 text-[0.72rem] font-bold transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                Analyser
              </button>
            </div>
          </div>
        )}

        <div className={`rounded-xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-[0.65rem] font-semibold mb-1.5 ${isDark ? "text-white/30" : "text-gray-500"}`}>Formats supportés</p>
          <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-[0.62rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>
            <span>· Date;Libellé;Montant</span>
            <span>· Date;Description;Débit;Crédit</span>
            <span>· Date;Motif;Montant</span>
            <span>· DD/MM/YYYY ou YYYY-MM-DD</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className={`rounded-xl border px-3 py-2 text-[0.72rem] ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"}`}>
            <span className={isDark ? "text-white/30" : "text-gray-500"}>Total : </span><span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{txs.length} transactions</span>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-[0.72rem]">
            <span className="text-green-400/60">Rapprochées : </span><span className="font-bold text-green-400">{matchedCount}</span>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[0.72rem]">
            <span className="text-amber-400/60">Non rapprochées : </span><span className="font-bold text-amber-400">{unmatchedCount}</span>
          </div>
        </div>
        <button onClick={() => setTxs([])}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[0.7rem] hover:text-red-400 hover:border-red-500/20 transition-all ${isDark ? "border-white/[0.08] text-white/30" : "border-gray-200 text-gray-500"}`}>
          <Trash2 size={12} /> Réinitialiser
        </button>
      </div>

      <div className="space-y-2">
        {txs.map(tx => {
          const matchedExp   = tx.matchedId ? expenses.find(e => e.id === tx.matchedId) : null;
          const suggestions  = !tx.matchedId ? expenses.filter(e => {
            const diff = Math.abs(new Date(e.date).getTime() - new Date(tx.date).getTime()) / 86_400_000;
            return diff <= 7 && Math.abs(e.amount - Math.abs(tx.amount)) / Math.max(Math.abs(tx.amount), 1) < 0.1;
          }).slice(0, 3) : [];
          const isExpanded = expandedId === tx.id;

          return (
            <div key={tx.id} className={`rounded-xl border transition-all ${
              tx.matchedId !== null
                ? "border-green-500/20 bg-green-500/[0.04]"
                : isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : tx.id)}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  tx.matchedId !== null ? "bg-green-500/20" : isDark ? "bg-white/[0.05]" : "bg-gray-100"
                }`}>
                  {tx.matchedId !== null
                    ? <CheckCircle2 size={14} className="text-green-400" />
                    : <ArrowLeftRight size={12} className={isDark ? "text-white/25" : "text-gray-400"} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-[0.75rem] font-medium ${isDark ? "text-white/80" : "text-gray-800"}`}>{tx.desc || "—"}</p>
                  <p className={`text-[0.62rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(tx.date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[0.82rem] font-bold ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                    {tx.amount < 0 ? "−" : "+"}{fmtCur(Math.abs(tx.amount))}
                  </p>
                  {matchedExp && (
                    <p className="text-[0.58rem] text-green-400/60 truncate max-w-[120px]">{matchedExp.description}</p>
                  )}
                </div>
                <ChevronDown size={12} className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-white/20" : "text-gray-400"}`} />
              </div>

              {isExpanded && (
                <div className={`border-t px-3 pb-3 pt-2 space-y-2 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  {matchedExp ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-2">
                      <CheckCircle2 size={12} className="shrink-0 text-green-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.68rem] font-semibold text-green-400">{matchedExp.description}</p>
                        <p className="text-[0.6rem] text-green-400/60">{fmtDate(matchedExp.date)} · {fmtCur(matchedExp.amount)}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleMatch(tx.id, matchedExp.id); }}
                        className={`shrink-0 rounded-lg p-1 hover:text-red-400 hover:bg-red-500/10 transition-all ${isDark ? "text-white/20" : "text-gray-400"}`}>
                        <X size={11} />
                      </button>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className={`text-[0.62rem] ${isDark ? "text-white/25" : "text-gray-400"}`}>Correspondances possibles :</p>
                      {suggestions.map(e => (
                        <button key={e.id} onClick={ev => { ev.stopPropagation(); toggleMatch(tx.id, e.id); }}
                          className={`w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left hover:border-[#c9a55a44] transition-all ${isDark ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`truncate text-[0.7rem] font-medium ${isDark ? "text-white/70" : "text-gray-700"}`}>{e.description}</p>
                            <p className={`text-[0.6rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(e.date)} · {getCat(e.category).l}</p>
                          </div>
                          <span className={`shrink-0 text-[0.7rem] font-bold ${isDark ? "text-white/60" : "text-gray-600"}`}>{fmtCur(e.amount, e.currency)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`py-1 text-[0.65rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>Aucune correspondance trouvée (±7 jours, ±10 %)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DepensesPage() {
  const supabase = supabaseClient;
  const router   = useRouter();
  const { isDark } = useTheme();
  const [userId,  setUserId]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<ToastData | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports,  setReports]  = useState<ExpenseReport[]>([]);
  const [budgets,  setBudgets]  = useState<ExpenseBudget[]>([]);
  const [rules,    setRules]    = useState<ExpenseRule[]>([]);
  const [rates,    setRates]    = useState<Record<string, number>>({ EUR: 1 });

  const [tab,             setTab]             = useState<"depenses"|"notes"|"budgets"|"rapprochement"|"rapport"|"regles"|"approbation">("depenses");
  const [showModal,       setShowModal]       = useState(false);
  const [editExpense,     setEditExpense]     = useState<Expense | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport,      setEditReport]      = useState<ExpenseReport | null>(null);

  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("");
  const [filterSt,    setFilterSt]    = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterPay,   setFilterPay]   = useState("");

  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);
  const [confirmDeleteReportId,  setConfirmDeleteReportId]  = useState<string | null>(null);
  const [showCsvImport,          setShowCsvImport]          = useState(false);
  const [showExportPack,         setShowExportPack]         = useState(false);

  const toast$ = (msg: string, type: "success"|"error" = "success") => setToast({ msg, type });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
      else if (process.env.NODE_ENV !== "development") router.replace("/login");
    });
    fetch("/api/depenses/exchange-rates")
      .then(r => r.ok ? r.json() : null)
      .then((r: Record<string, number> | null) => { if (r) setRates(r); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [eRes, rRes, bRes, rlRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabase.from("expense_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("expense_budgets").select("*").eq("user_id", userId),
      supabase.from("expense_rules").select("*").eq("user_id", userId).order("priority", { ascending: false }),
    ]);
    if (eRes.data)  setExpenses(eRes.data as Expense[]);
    if (rRes.data)  setReports(rRes.data as ExpenseReport[]);
    if (bRes.data)  setBudgets(bRes.data as ExpenseBudget[]);
    if (rlRes.data) setRules(rlRes.data as ExpenseRule[]);
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

  const filteredTotal = useMemo(() => filtered.filter(e => e.status !== "rejected").reduce((a, e) => a + amtEur(e, rates), 0), [filtered, rates]);
  const filteredVAT   = useMemo(() => filtered.filter(e => e.vat_recoverable).reduce((a, e) => a + (e.currency === "EUR" ? e.vat_amount : e.vat_amount / (rates[e.currency] ?? 1)), 0), [filtered, rates]);
  const filteredReimb = useMemo(() => filtered.filter(e => e.payment_method === "carte_perso" && e.status !== "reimbursed" && e.status !== "rejected").reduce((a, e) => a + amtEur(e, rates), 0), [filtered, rates]);
  const hasFilters    = !!(search || filterCat || filterSt || filterMonth || filterPay);

    async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast$("Erreur de suppression", "error");
    setExpenses(es => es.filter(e => e.id !== id));
    setConfirmDeleteExpenseId(null);
    toast$("Dépense supprimée");
  }

  async function updateStatus(id: string, status: ExpStatus) {
    const { error } = await supabase.from("expenses").update({ status }).eq("id", id).eq("user_id", userId ?? "");
    if (error) return toast$("Erreur", "error");
    setExpenses(es => es.map(e => e.id === id ? { ...e, status } : e));
    toast$("Statut mis à jour");
  }

    async function saveReport(form: Partial<ExpenseReport>) {
    if (!form.title?.trim() || !userId) return;
    if (editReport) {
      const { data, error } = await supabase.from("expense_reports").update(form).eq("id", editReport.id).eq("user_id", userId ?? "").select().single();
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
    const { error } = await supabase.from("expense_reports").delete().eq("id", id);
    if (error) return toast$("Erreur", "error");
    setReports(rs => rs.filter(r => r.id !== id));
    setExpenses(es => es.map(e => e.expense_report_id === id ? { ...e, expense_report_id: null } : e));
    setConfirmDeleteReportId(null);
    toast$("Note supprimée");
  }

    async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 190;
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Rapport de dépenses", 10, 16);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
    doc.text(new Date().toLocaleDateString("fr-FR"), 10, 22);
    doc.text(`${filtered.length} dépense${filtered.length !== 1 ? "s" : ""} · Total : ${fmtCur(filteredTotal)}`, 10, 27);
    doc.setTextColor(0);
    let y = 35;
    const headers = ["Date", "Description", "Catégorie", "Montant", "Statut"];
    const colW    = [22, 70, 30, 28, 30];
    doc.setFillColor(245, 245, 245); doc.rect(10, y - 4, W, 7, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    let x = 10;
    headers.forEach((h, i) => { doc.text(h, x + 1, y); x += colW[i]; });
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    filtered.forEach(e => {
      if (y > 272) { doc.addPage(); y = 16; }
      x = 10;
      const row = [
        e.date, e.description.slice(0, 45), getCat(e.category).l,
        fmtCur(e.amount, e.currency), getSt(e.status).l,
      ];
      row.forEach((cell, i) => { doc.text(String(cell), x + 1, y); x += colW[i]; });
      y += 5.5;
    });
    doc.save("depenses.pdf");
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

  function exportXLSX() {
    const headers = ["Date","Description","Catégorie","Montant","Devise","TVA","TVA récup.","Paiement","Statut","Projet","Centre coût","N° Facture"];
    const rows = filtered.map(e => [
      e.date, e.description, getCat(e.category).l,
      e.amount, e.currency, e.vat_amount, e.vat_recoverable ? "Oui" : "Non",
      PAY_METHODS.find(m => m.v === e.payment_method)?.l ?? e.payment_method,
      getSt(e.status).l, e.project, e.cost_center, e.invoice_number,
    ]);
    const cell = (v: string | number) =>
      typeof v === "number"
        ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
        : `<Cell><Data ss:Type="String">${String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</Data></Cell>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Dépenses">
<Table>
<Row>${headers.map(cell).join("")}</Row>
${rows.map(r => `<Row>${r.map(cell).join("")}</Row>`).join("\n")}
</Table>
</Worksheet>
</Workbook>`;
    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "depenses.xls"; a.click();
    URL.revokeObjectURL(url);
  }

  const budgetAlertCount = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear(); const month = now.getMonth() + 1;
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    return CATS.filter(({ v }) => {
      const b = budgets.find(bud => bud.category === v && bud.period === "monthly" && bud.year === year && bud.month === month);
      if (!b || b.amount <= 0) return false;
      return expenses.filter(e => e.category === v && e.date.startsWith(ym) && e.status !== "rejected").reduce((a, e) => a + e.amount, 0) > b.amount;
    }).length;
  }, [expenses, budgets]);

  const TABS = [
    { id: "depenses",      l: "Dépenses",       I: Receipt,         badge: expenses.length },
    { id: "notes",         l: "Notes de frais", I: FileText,        badge: reports.filter(r => r.status === "submitted").length },
    { id: "budgets",       l: "Budgets",         I: PiggyBank,       badge: budgetAlertCount },
    { id: "rapprochement", l: "Rapprochement",   I: ArrowLeftRight,  badge: 0 },
    { id: "rapport",       l: "Rapport",         I: BarChart2,       badge: 0 },
    { id: "approbation",   l: "Approbation",      I: CheckCircle2,    badge: expenses.filter(e => e.status === "submitted").length },
    { id: "regles",        l: "Règles",           I: Zap,             badge: rules.filter(r => r.active).length },
  ] as const;

  const grandTotal = expenses.filter(e => e.status !== "rejected").reduce((a, e) => a + amtEur(e, rates), 0);

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ background: isDark ? "#07080e" : "#f8f9fa" }}>
      <div className={`h-8 w-8 animate-spin rounded-full border-2 border-t-[#c9a55a] ${isDark ? "border-white/10" : "border-gray-200"}`} />
    </div>
  );

  return (
    <DarkCtx.Provider value={isDark}>
    <div className="flex h-full flex-col overflow-hidden" style={{ background: isDark ? "#07080e" : "#f0f2f5" }}>
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Animated header ── */}
      <div className="relative shrink-0 overflow-hidden px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6"
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#09080e)" : "linear-gradient(160deg,#ffffff,#f8f9fa,#f0f2f5)" }}>

        {/* Gold top line */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 h-[2px] origin-left"
          style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a,#c9a55a44,transparent)" }} />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle,#c9a55a,transparent 70%)" }} />
          <div className="absolute top-4 left-1/4 h-32 w-32 rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
          <div className="absolute -bottom-4 left-1/2 h-28 w-28 rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Receipt} color="#ea580c" />
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Dépenses</h1>
              <p className={`mt-0.5 text-[0.65rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                {expenses.length} dépense{expenses.length !== 1 ? "s" : ""} · {fmtCur(grandTotal)} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 }} onClick={() => void exportPDF()} title="Exporter PDF"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
              <FileCheck size={14} />
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }} onClick={exportCSV} title="Exporter CSV"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isDark ? "text-white/30 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
              <Download size={14} />
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 }} onClick={exportXLSX} title="Exporter Excel"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isDark ? "text-white/30 hover:text-green-400" : "text-gray-400 hover:text-green-600"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
              <Table2 size={14} />
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 }} onClick={() => setShowExportPack(true)} title="Exporter pack justificatifs"
              className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-[0.72rem] font-semibold transition-all ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
              <Download size={13} /> Export
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.24 }} onClick={() => setShowCsvImport(true)} title="Importer relevé CSV"
              className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-[0.72rem] font-semibold transition-all ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
              <FileUp size={13} /> Import CSV
            </motion.button>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.26 }}
              onClick={() => { setEditExpense(null); setShowModal(true); }}
              className="flex h-8 items-center gap-2 rounded-xl px-4 text-[0.72rem] font-bold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              <Plus size={14} /> Dépense
            </motion.button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Total dépenses",  v: fmtCur(grandTotal),    c: "#c9a55a", sub: `${expenses.length} dépense${expenses.length !== 1 ? "s" : ""}`, delay: 0.08 },
            { l: "Total filtré",    v: fmtCur(filteredTotal),  c: "#6366f1", sub: `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`,  delay: 0.13 },
            { l: "TVA récupérable", v: fmtCur(filteredVAT),   c: "#10b981", sub: "Récupérable", delay: 0.18 },
            { l: "À rembourser",    v: fmtCur(filteredReimb), c: "#f59e0b", sub: "Carte perso",  delay: 0.23 },
          ].map(({ l, v, c, sub, delay }) => (
            <motion.div key={l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
              className="relative overflow-hidden rounded-2xl p-3.5"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
              <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-[0.15]"
                style={{ background: `radial-gradient(circle,${c},transparent 70%)` }} />
              <p className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: c + "aa" }}>{l}</p>
              <p className={`mt-1.5 text-[1.1rem] font-black leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>{v}</p>
              <p className="mt-0.5 text-[0.58rem]" style={{ color: c + "77" }}>{sub}</p>
              <div className="mt-2.5 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg,${c}55,transparent)` }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="relative shrink-0" style={{ background: isDark ? "rgba(7,8,14,0.8)" : "rgba(255,255,255,0.9)" }}>
        <div className={`flex overflow-x-auto border-b px-2 sm:px-8 ${isDark ? "border-white/[0.07]" : "border-gray-200"}`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {TABS.map(({ id, l, I, badge }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 sm:px-4 py-3 text-[0.72rem] font-semibold transition-colors ${
                tab === id ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600")
              }`}>
              <I size={13} />{l}
              {badge > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[0.55rem] font-bold"
                  style={{ background: id === "budgets" ? "rgba(239,68,68,0.25)" : "rgba(201,165,90,0.2)", color: id === "budgets" ? "#ef4444" : "#c9a55a" }}>
                  {badge}
                </span>
              )}
              {tab === id && (
                <motion.div layoutId="dep-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg,#c9a55a,#e8c97a)" }} />
              )}
            </button>
          ))}
        </div>
        {/* Fade droit — indique qu'il y a d'autres onglets */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:hidden"
          style={{ background: `linear-gradient(to left, ${isDark ? "rgba(7,8,14,0.9)" : "rgba(255,255,255,0.9)"}, transparent)` }} />
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
                  <div className={`flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                    <Search size={13} className={`shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`} />
                    <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                      className={`flex-1 bg-transparent text-[0.78rem] outline-none ${isDark ? "text-white placeholder-white/20" : "text-gray-900 placeholder-gray-400"}`} />
                  </div>
                  <div className="relative">
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                      className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-[0.75rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/50" : "border-gray-200 bg-white text-gray-500"}`}>
                      <option value="">Toutes catégories</option>
                      {CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                    <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`} />
                  </div>
                  <div className="relative">
                    <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
                      className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-[0.75rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/50" : "border-gray-200 bg-white text-gray-500"}`}>
                      <option value="">Tous statuts</option>
                      {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`} />
                  </div>
                  <div className="relative">
                    <select value={filterPay} onChange={e => setFilterPay(e.target.value)}
                      className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-[0.75rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/50" : "border-gray-200 bg-white text-gray-500"}`}>
                      <option value="">Tous paiements</option>
                      {PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`} />
                  </div>
                  <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                    className={`rounded-xl border px-3 py-2 text-[0.75rem] outline-none ${isDark ? "[color-scheme:dark] border-white/[0.08] bg-[#0e1420] text-white/50" : "border-gray-200 bg-white text-gray-500"}`} />
                  {hasFilters && (
                    <button onClick={() => { setSearch(""); setFilterCat(""); setFilterSt(""); setFilterMonth(""); setFilterPay(""); }}
                      className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-[0.72rem] transition-colors ${isDark ? "border-white/[0.08] text-white/30 hover:text-white/60" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
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
                    <p className={`text-[0.78rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                      {hasFilters ? "Aucune dépense ne correspond aux filtres" : "Aucune dépense enregistrée"}
                    </p>
                    {!hasFilters && (
                      <button onClick={() => { setEditExpense(null); setShowModal(true); }}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] transition-all ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
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
                            className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${isDark ? "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]" : "border-gray-200 bg-white hover:bg-gray-50"}`}>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: ci.c + "22" }}>
                              <CI size={16} style={{ color: ci.c }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`truncate text-[0.78rem] font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{e.description}</p>
                                {e.recur_freq && (
                                  <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.52rem] font-bold"
                                    style={{ background: "rgba(201,165,90,0.12)", color: "#c9a55a", border: "1px solid rgba(201,165,90,0.25)" }}
                                    title={`Récurrente — ${RECUR_FREQS.find(r => r.v === e.recur_freq)?.l ?? e.recur_freq}`}>
                                    <Repeat2 size={8} /> {RECUR_FREQS.find(r => r.v === e.recur_freq)?.l}
                                  </span>
                                )}
                                {e.receipt_url && (
                                  <a href={e.receipt_url} target="_blank" rel="noreferrer"
                                    className="shrink-0 text-[0.6rem] text-blue-400/60 hover:text-blue-400 transition-colors" title="Justificatif">📎</a>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className={`text-[0.62rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(e.date)}</span>
                                {e.project && <span className={`rounded-full px-1.5 py-0.5 text-[0.58rem] ${isDark ? "bg-white/[0.05] text-white/30" : "bg-gray-100 text-gray-500"}`}>{e.project}</span>}
                                {e.invoice_number && <span className={`text-[0.58rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>{e.invoice_number}</span>}
                              </div>
                            </div>

                            <div className="hidden sm:flex shrink-0 flex-col items-end gap-1">
                              <CatBadge cat={e.category} />
                              <StBadge st={e.status} />
                            </div>

                            <div className="shrink-0 text-right">
                              <p className={`text-[0.88rem] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{fmtCur(e.amount, e.currency)}</p>
                              {e.vat_recoverable && e.vat_amount > 0 && (
                                <p className="text-[0.58rem] text-green-400/60">TVA {fmtCur(e.vat_amount)}</p>
                              )}
                            </div>

                            <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {confirmDeleteExpenseId === e.id ? (
                                <>
                                  <button onClick={() => deleteExpense(e.id)}
                                    className="h-7 px-2 rounded-lg flex items-center gap-1 text-[0.6rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    <Trash2 size={10} /> Oui
                                  </button>
                                  <button onClick={() => setConfirmDeleteExpenseId(null)}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isDark ? "text-white/25 hover:bg-white/[0.08] hover:text-white/60" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
                                    <X size={10} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditExpense(e); setShowModal(true); }}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isDark ? "text-white/25 hover:bg-white/[0.08] hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => setConfirmDeleteExpenseId(e.id)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>

                            <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value as ExpStatus)}
                              className={`shrink-0 cursor-pointer appearance-none rounded-lg border px-2 py-1 text-[0.6rem] outline-none opacity-0 group-hover:opacity-100 transition-all ${isDark ? "[color-scheme:dark] border-white/[0.05] bg-[#0e1420] text-white/30 hover:border-white/15" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
                              style={{ minWidth: "90px" }}>
                              {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                            </select>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <div className={`flex flex-wrap items-center justify-end gap-4 rounded-2xl border px-4 py-2.5 text-[0.72rem] ${isDark ? "border-white/[0.04] bg-white/[0.01]" : "border-gray-200 bg-white"}`}>
                      <span className={isDark ? "text-white/30" : "text-gray-400"}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
                      <span className={isDark ? "text-white/50" : "text-gray-500"}>TVA rép. : <span className="font-semibold text-green-500">{fmtCur(filteredVAT)}</span></span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Total : {fmtCur(filteredTotal)}</span>
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
                    <p className={`text-[0.78rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune note de frais</p>
                    <button onClick={() => { setEditReport(null); setShowReportModal(true); }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[0.72rem] transition-all ${isDark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
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
                        <div key={r.id} className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-[0.85rem] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{r.title}</h3>
                                <StBadge st={r.status} />
                              </div>
                              <div className={`mt-1 flex flex-wrap items-center gap-3 text-[0.65rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                                <span>{linked.length} dépense{linked.length !== 1 ? "s" : ""}</span>
                                {r.period_start && (
                                  <span>{fmtDate(r.period_start)} → {r.period_end ? fmtDate(r.period_end) : "en cours"}</span>
                                )}
                              </div>
                              {r.notes && <p className={`mt-1 text-[0.65rem] italic truncate ${isDark ? "text-white/25" : "text-gray-400"}`}>{r.notes}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-[0.95rem] font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{fmtCur(total)}</p>
                              {vatRec > 0 && <p className="text-[0.6rem] text-green-500/70">TVA {fmtCur(vatRec)}</p>}
                            </div>
                            <div className="shrink-0 flex gap-1">
                              {confirmDeleteReportId === r.id ? (
                                <>
                                  <button onClick={() => deleteReport(r.id)}
                                    className="h-7 px-2 rounded-lg flex items-center gap-1 text-[0.6rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    <Trash2 size={10} /> Oui
                                  </button>
                                  <button onClick={() => setConfirmDeleteReportId(null)}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isDark ? "text-white/25 hover:bg-white/[0.08] hover:text-white/60" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
                                    <X size={10} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditReport(r); setShowReportModal(true); }}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isDark ? "text-white/25 hover:bg-white/[0.08] hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"}`}>
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => setConfirmDeleteReportId(r.id)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {linked.length > 0 ? (
                            <div className={`space-y-1 border-t pt-3 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                              {linked.map(e => {
                                const ci = getCat(e.category);
                                const CI = ci.I;
                                return (
                                  <div key={e.id} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}>
                                    <CI size={11} style={{ color: ci.c }} className="shrink-0" />
                                    <span className={`flex-1 truncate text-[0.68rem] ${isDark ? "text-white/50" : "text-gray-600"}`}>{e.description}</span>
                                    <span className={`shrink-0 text-[0.62rem] ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(e.date)}</span>
                                    <span className={`shrink-0 text-[0.7rem] font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{fmtCur(e.amount, e.currency)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={`py-2 text-center text-[0.68rem] ${isDark ? "text-white/20" : "text-gray-400"}`}>
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
                    userId={userId} rates={rates} onBudgetsChange={setBudgets}
                  />
                )}
              </motion.div>
            )}

            {tab === "rapprochement" && (
              <motion.div key="rap2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <RapprochementView expenses={expenses} />
              </motion.div>
            )}

            {tab === "rapport" && (
              <motion.div key="rap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <RapportView expenses={expenses} rates={rates} />
              </motion.div>
            )}

            {tab === "approbation" && (
              <motion.div key="appro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ApprobationView expenses={expenses} setExpenses={setExpenses} />
              </motion.div>
            )}

            {tab === "regles" && userId && (
              <motion.div key="regles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <RulesView rules={rules} setRules={setRules} userId={userId} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showModal && userId && (
          <ExpenseModal
            expense={editExpense} reports={reports} userId={userId} rules={rules} rates={rates}
            onSave={saved => {
              const isNew = !editExpense;
              if (isNew) {
                setExpenses(es => {
                  const next = [saved, ...es];
                  // Alerte budget dépassé
                  const now = new Date();
                  const ym  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
                  if (saved.date.startsWith(ym)) {
                    const cat   = saved.category;
                    const bud   = budgets.find(b => b.category===cat && b.period==="monthly" && b.year===now.getFullYear() && b.month===now.getMonth()+1);
                    if (bud && bud.amount > 0) {
                      const spent = next.filter(e => e.category===cat && e.date.startsWith(ym) && e.status!=="rejected").reduce((a,e) => a+e.amount, 0);
                      if (spent > bud.amount) toast$(`⚠️ Budget ${getCat(cat).l} dépassé (${fmtCur(spent)} / ${fmtCur(bud.amount)})`, "error");
                    }
                  }
                  return next;
                });
                toast$("Dépense ajoutée");
              } else {
                setExpenses(es => es.map(e => e.id === saved.id ? saved : e));
                toast$("Dépense mise à jour");
              }
              // Recalcul total note de frais liée
              if (saved.expense_report_id) {
                setExpenses(prev => {
                  const linked = prev.filter(e => e.expense_report_id === saved.expense_report_id && e.id !== saved.id);
                  const total  = [...linked, saved].filter(e => e.status !== "rejected").reduce((a,e) => a+e.amount, 0);
                  void supabaseClient.from("expense_reports").update({ total_amount: total }).eq("id", saved.expense_report_id!).eq("user_id", userId ?? "");
                  setReports(rs => rs.map(r => r.id === saved.expense_report_id ? { ...r, total_amount: total } : r));
                  return prev;
                });
              }
              // Vérification budgets côté serveur (push/email si seuil franchi)
              void fetch("/api/depenses/budget-alert", { method: "POST" });
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

      <AnimatePresence>
        {showCsvImport && userId && (
          <CsvImportModal
            userId={userId} rules={rules}
            onClose={() => setShowCsvImport(false)}
            onImported={count => {
              setShowCsvImport(false);
              toast$(`${count} dépense${count > 1 ? "s" : ""} importée${count > 1 ? "s" : ""} avec succès`);
              void loadAll();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExportPack && (
          <ExportPackModal
            expenses={expenses} reports={reports}
            onClose={() => setShowExportPack(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </DarkCtx.Provider>
  );
}
