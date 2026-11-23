"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Loader2, Package, Wrench, ShoppingBag, Tag,
  ChevronDown, Pencil, Copy, Archive, RotateCcw, Eye, Check,
  Upload, Download, FileDown, AlertCircle, Info,
  ArrowLeft, Filter, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

const YELLOW = "#FFB900";
const PAGE_SIZE = 15;

const CURRENCIES = [
  "EUR","USD","GBP","CHF","CAD","AUD","XOF","XAF","MAD","DZD","TND","NGN",
  "GHS","KES","ZAR","EGP","ETB","TZS","MXN","BRL","AED","INR","JPY","CNY",
];

const UNITS = [
  "—","h","j","semaine","mois","an",
  "pièce","unité","lot","carton","forfait",
  "kg","g","tonne","litre","m","cm","m²","m³","km",
  "consultation","séance","session","projet","livraison","page","formation","licence",
];

const TAX_PRESETS = [0, 2.1, 5.5, 8.5, 10, 18, 19.25, 20, 25];

interface CatalogItem {
  id: string;
  description: string;
  name: string | null;
  reference: string | null;
  type: "produit" | "service";
  category: string | null;
  status: "actif" | "archivé";
  unit: string;
  unit_price: number;
  vat_rate: number;
  devise: string;
  notes: string | null;
  has_stock: boolean;
  stock_qty: number;
  created_at: string;
  updated_at: string | null;
}

interface Stats {
  total: number;
  archived: number;
  products: number;
  services: number;
  categories: number;
}

interface FormState {
  description: string;
  reference: string;
  type: "produit" | "service";
  category: string;
  status: "actif" | "archivé";
  unit_price: string;
  devise: string;
  vat_rate: string;
  unit: string;
  notes: string;
  has_stock: boolean;
  stock_qty: string;
}

const DEFAULT_FORM: FormState = {
  description: "", reference: "", type: "service", category: "",
  status: "actif", unit_price: "0.00", devise: "EUR", vat_rate: "0",
  unit: "forfait", notes: "", has_stock: false, stock_qty: "0",
};

function itemDisplayName(it: CatalogItem) { return it.name || it.description; }

function fmtPrice(n: number, devise: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: devise,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${devise}`;
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ type, msg, onClose }: { type: "ok"|"err"|"warn"; msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold shadow-2xl max-w-xs text-center ${
        type === "ok"
          ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400"
          : type === "warn"
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
          : "border-red-500/20 bg-red-500/15 text-red-400"
      }`}>
      {type === "ok" ? <Check size={13}/> : <AlertCircle size={13} className="shrink-0"/>}
      {msg}
    </motion.div>
  );
}

// ── Badge type article ─────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: "produit"|"service" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      type === "produit"
        ? "bg-blue-500/10 text-blue-400"
        : "bg-purple-500/10 text-purple-400"
    }`}>
      {type === "produit" ? <ShoppingBag size={9}/> : <Wrench size={9}/>}
      {type === "produit" ? "Produit" : "Service"}
    </span>
  );
}

function StatusBadge({ status }: { status: "actif"|"archivé" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
      status === "actif"
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-gray-500/10 text-gray-400"
    }`}>
      {status === "actif" ? "Actif" : "Archivé"}
    </span>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ filtered, onAdd, onImport, isDark }: {
  filtered: boolean; onAdd: () => void; onImport: () => void; isDark: boolean;
}) {
  const t2 = isDark ? "text-white/60" : "text-gray-500";
  const t3 = isDark ? "text-white/30" : "text-gray-400";
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`}>
        <Package size={28} className={t3}/>
      </div>
      <div>
        <p className={`font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>
          {filtered ? "Aucun article ne correspond" : "Votre catalogue est vide"}
        </p>
        <p className={`mt-1 text-sm ${t2}`}>
          {filtered
            ? "Essayez d'élargir vos filtres ou d'effacer la recherche."
            : "Ajoutez vos premiers produits ou prestations pour les retrouver automatiquement dans vos factures et devis."}
        </p>
      </div>
      {!filtered && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={onAdd}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
            style={{ background: YELLOW }}>
            <Plus size={14}/> Créer un article
          </button>
          <button onClick={onImport}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/10 text-white/70 hover:bg-white/[0.05]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Upload size={14}/> Importer un catalogue
          </button>
        </div>
      )}
    </div>
  );
}

// ── Drawer formulaire ──────────────────────────────────────────────────────────
function FormDrawer({
  open, mode, item, categories, isDark,
  onClose, onSave,
}: {
  open: boolean;
  mode: "create" | "edit" | "view";
  item: CatalogItem | null;
  categories: string[];
  isDark: boolean;
  onClose: () => void;
  onSave: (data: Partial<CatalogItem>) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const bg   = isDark ? "bg-[#181c28]" : "bg-white";
  const bd   = isDark ? "border-white/[0.07]" : "border-gray-200";
  const t1   = isDark ? "text-white" : "text-gray-900";
  const t2   = isDark ? "text-white/60" : "text-gray-500";
  const t3   = isDark ? "text-white/30" : "text-gray-400";
  const inp  = isDark
    ? "bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 focus:border-yellow-500/40"
    : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-yellow-400/60";
  const inpCls = `w-full rounded-xl px-3 py-2 text-sm outline-none transition ${inp}`;

  useEffect(() => {
    if (!open) return;
    if (item && mode !== "create") {
      setForm({
        description: item.description,
        reference: item.reference || "",
        type: item.type,
        category: item.category || "",
        status: item.status,
        unit_price: (item.unit_price ?? 0).toFixed(2),
        devise: item.devise || "EUR",
        vat_rate: (item.vat_rate ?? 0).toString(),
        unit: item.unit || "forfait",
        notes: item.notes || "",
        has_stock: item.has_stock || false,
        stock_qty: (item.stock_qty ?? 0).toString(),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErr(null);
  }, [item, mode, open]);

  async function handleSave() {
    if (!form.description.trim()) { setErr("Le nom de l'article est obligatoire"); return; }
    setSaving(true); setErr(null);
    try {
      await onSave({
        description: form.description.trim(),
        reference: form.reference.trim() || undefined,
        type: form.type,
        category: form.category.trim() || undefined,
        status: form.status,
        unit: form.unit === "—" ? "" : form.unit,
        unit_price: parseFloat(form.unit_price) || 0,
        devise: form.devise,
        vat_rate: parseFloat(form.vat_rate) || 0,
        notes: form.notes.trim() || undefined,
        has_stock: form.has_stock,
        stock_qty: form.has_stock ? (parseFloat(form.stock_qty) || 0) : 0,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const isView = mode === "view";
  const title = mode === "create" ? "Nouvel article" : mode === "edit" ? "Modifier l'article" : itemDisplayName(item!);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <p className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${t3}`}>{label}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${t3}`}>{label}</label>
      {children}
    </div>
  );

  const catSuggestions = categories.filter(c =>
    c.toLowerCase().includes(form.category.toLowerCase()) && c !== form.category
  ).slice(0, 5);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full flex-col sm:w-[500px] ${bg} border-l ${bd} shadow-2xl`}
      >
        {/* Header */}
        <div className={`flex shrink-0 items-center justify-between border-b ${bd} px-5 py-4`}>
          <div>
            <p className={`font-bold ${t1}`}>{title}</p>
            {item && mode !== "create" && (
              <p className={`text-xs ${t2}`}>
                {item.reference ? `Réf. ${item.reference} · ` : ""}
                {item.type === "produit" ? "Produit" : "Service"}
              </p>
            )}
          </div>
          <button onClick={onClose} className={`flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/[0.08] ${t2}`}>
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Type toggle */}
          <div className={`flex rounded-xl border ${bd} p-1`} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb" }}>
            {(["service", "produit"] as const).map(t => (
              <button key={t} disabled={isView}
                onClick={() => setForm(s => ({ ...s, type: t }))}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                  form.type === t
                    ? isDark ? "bg-white/[0.08] text-white" : "bg-white text-gray-900 shadow-sm"
                    : t2
                }`}>
                {t === "produit" ? <ShoppingBag size={12}/> : <Wrench size={12}/>}
                {t === "produit" ? "Produit" : "Service"}
              </button>
            ))}
          </div>

          <Section label="Informations générales">
            <Field label="Nom de l'article *">
              <input disabled={isView} value={form.description}
                onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                placeholder="Ex : Développement interface web"
                className={inpCls}/>
            </Field>
            <Field label="Référence / SKU">
              <input disabled={isView} value={form.reference}
                onChange={e => setForm(s => ({ ...s, reference: e.target.value }))}
                placeholder="DEV-001"
                className={inpCls}/>
            </Field>
            <Field label="Catégorie">
              <div className="relative">
                <input disabled={isView} value={form.category}
                  onChange={e => { setForm(s => ({ ...s, category: e.target.value })); setCatOpen(true); }}
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                  placeholder="Informatique, Conseil…"
                  className={inpCls}/>
                {catOpen && catSuggestions.length > 0 && (
                  <div className={`absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-xl border shadow-lg ${isDark ? "border-white/[0.08] bg-[#1a1f30]" : "border-gray-200 bg-white"}`}>
                    {catSuggestions.map(c => (
                      <button key={c}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setForm(s => ({ ...s, category: c })); setCatOpen(false); }}
                        className={`block w-full px-3 py-2 text-left text-sm transition ${isDark ? "text-white/70 hover:bg-white/[0.05]" : "text-gray-700 hover:bg-gray-50"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Statut">
              <div className={`flex rounded-xl border ${bd} p-1`} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb" }}>
                {(["actif", "archivé"] as const).map(s => (
                  <button key={s} disabled={isView}
                    onClick={() => setForm(fs => ({ ...fs, status: s }))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                      form.status === s
                        ? s === "actif"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isDark ? "bg-white/[0.08] text-white/60" : "bg-gray-200 text-gray-500"
                        : t2
                    }`}>
                    {s === "actif" ? "Actif" : "Archivé"}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          <div className={`border-t ${bd}`}/>

          <Section label="Tarification">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix unitaire">
                <input disabled={isView} type="number" min="0" step="0.01"
                  value={form.unit_price}
                  onChange={e => setForm(s => ({ ...s, unit_price: e.target.value }))}
                  className={`${inpCls} text-right`}/>
              </Field>
              <Field label="Devise">
                <div className="relative">
                  <select disabled={isView} value={form.devise}
                    onChange={e => setForm(s => ({ ...s, devise: e.target.value }))}
                    className={`${inpCls} appearance-none pr-7`}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taxe %">
                <div className="relative">
                  <input disabled={isView} type="number" min="0" max="100" step="0.1"
                    value={form.vat_rate}
                    onChange={e => setForm(s => ({ ...s, vat_rate: e.target.value }))}
                    className={`${inpCls} text-right pr-8`}/>
                  <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${t3}`}>%</span>
                </div>
                {!isView && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {TAX_PRESETS.map(p => (
                      <button key={p}
                        onClick={() => setForm(s => ({ ...s, vat_rate: p.toString() }))}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition ${
                          form.vat_rate === p.toString()
                            ? "text-black" : isDark ? "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        style={form.vat_rate === p.toString() ? { background: YELLOW } : {}}>
                        {p}%
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Unité">
                <div className="relative">
                  <select disabled={isView} value={form.unit}
                    onChange={e => setForm(s => ({ ...s, unit: e.target.value }))}
                    className={`${inpCls} appearance-none pr-7`}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${t3}`}/>
                </div>
              </Field>
            </div>
          </Section>

          <div className={`border-t ${bd}`}/>

          <Section label="Options">
            <Field label="Description détaillée / Notes internes">
              <textarea disabled={isView} value={form.notes}
                onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                rows={3} placeholder="Informations supplémentaires, conditions…"
                className={`${inpCls} resize-none`}/>
            </Field>
            {form.type === "produit" && (
              <div>
                <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${t3}`}>Suivi de stock</label>
                <div className="flex items-center gap-3">
                  <button disabled={isView}
                    onClick={() => setForm(s => ({ ...s, has_stock: !s.has_stock }))}
                    className={`relative h-5 w-9 rounded-full transition-colors ${form.has_stock ? "bg-yellow-500" : isDark ? "bg-white/[0.1]" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.has_stock ? "translate-x-4" : "translate-x-0.5"}`}/>
                  </button>
                  <span className={`text-xs ${t2}`}>{form.has_stock ? "Activé" : "Désactivé"}</span>
                </div>
                {form.has_stock && (
                  <div className="mt-3">
                    <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${t3}`}>Quantité en stock</label>
                    <input disabled={isView} type="number" min="0" step="1"
                      value={form.stock_qty}
                      onChange={e => setForm(s => ({ ...s, stock_qty: e.target.value }))}
                      className={`${inpCls} w-32 text-right`}/>
                  </div>
                )}
              </div>
            )}
          </Section>

        </div>

        {/* Footer */}
        {!isView && (
          <div className={`shrink-0 border-t ${bd} p-4 flex items-center gap-3`}>
            {err && <p className="flex-1 text-xs text-red-400">{err}</p>}
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? "text-white/50 hover:bg-white/[0.05]" : "text-gray-500 hover:bg-gray-100"}`}>
                Annuler
              </button>
              <button onClick={() => void handleSave()} disabled={saving}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                style={{ background: YELLOW }}>
                {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                {mode === "create" ? "Créer l'article" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
        {isView && (
          <div className={`shrink-0 border-t ${bd} p-4 flex gap-2 justify-end`}>
            <button onClick={onClose} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? "text-white/50 hover:bg-white/[0.05]" : "text-gray-500 hover:bg-gray-100"}`}>
              Fermer
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ── Modal import CSV ───────────────────────────────────────────────────────────
interface CsvRow { description: string; type?: string; reference?: string; category?: string; unit_price?: number; devise?: string; vat_rate?: number; unit?: string; notes?: string; }

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase()
    .replace("nom", "description").replace("libellé", "description").replace("libelle", "description")
    .replace("type", "type").replace("référence", "reference").replace("sku", "reference")
    .replace("catégorie", "category").replace("categorie", "category")
    .replace("prix", "unit_price").replace("price", "unit_price")
    .replace("devise", "devise").replace("currency", "devise")
    .replace("taxe %", "vat_rate").replace("tva", "vat_rate").replace("tax", "vat_rate")
    .replace("unité", "unit").replace("unite", "unit")
    .replace("notes", "notes")
  );
  return lines.slice(1).map(line => {
    const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { if (cells[i] !== undefined) row[h] = cells[i]; });
    return {
      description: row.description || "",
      type: row.type,
      reference: row.reference,
      category: row.category,
      unit_price: row.unit_price ? parseFloat(row.unit_price.replace(",", ".")) || 0 : 0,
      devise: row.devise || "EUR",
      vat_rate: row.vat_rate ? parseFloat(row.vat_rate) || 0 : 0,
      unit: row.unit,
      notes: row.notes,
    } as CsvRow;
  }).filter(r => r.description);
}

function CsvImportModal({ isDark, onClose, onImported }: {
  isDark: boolean; onClose: () => void; onImported: (count: number, v1Fallback: boolean) => void;
}) {
  type Step = "upload" | "preview" | "done";
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: { row: number; reason: string }[]; v1Fallback?: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bg  = isDark ? "bg-[#181c28]" : "bg-white";
  const bg2 = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bd  = isDark ? "border-white/[0.08]" : "border-gray-200";
  const t1  = isDark ? "text-white" : "text-gray-900";
  const t2  = isDark ? "text-white/60" : "text-gray-500";
  const t3  = isDark ? "text-white/30" : "text-gray-400";

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }

  function downloadTemplate() {
    const header = "Nom,Type,Référence,Catégorie,Prix,Devise,Taxe %,Unité,Notes";
    const example1 = "Développement web,service,DEV-001,Informatique,120,EUR,20,h,";
    const example2 = "Consultation stratégique,service,CONS-001,Conseil,200,EUR,0,h,Conseil en stratégie";
    const example3 = "Ordinateur portable,produit,PC-001,Matériel,800,EUR,20,pièce,";
    const csv = [header, example1, example2, example3].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modele-catalogue-djama.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/catalog/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json() as typeof result;
      setResult(data);
      setStep("done");
      if (data && data.imported > 0) onImported(data.imported, data.v1Fallback ?? false);
    } catch {
      setResult({ imported: 0, skipped: 0, errors: [{ row: 0, reason: "Erreur réseau" }] });
      setStep("done");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className={`fixed left-1/2 top-1/2 z-[70] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border ${bd} ${bg} shadow-2xl overflow-hidden`}>

        {/* Header */}
        <div className={`flex items-center justify-between border-b ${bd} px-5 py-4`}>
          <div>
            <p className={`font-bold ${t1}`}>
              {step === "upload" && "Importer un catalogue"}
              {step === "preview" && `Aperçu — ${rows.length} ligne${rows.length > 1 ? "s" : ""} détectée${rows.length > 1 ? "s" : ""}`}
              {step === "done" && "Import terminé"}
            </p>
            <p className={`text-xs ${t2}`}>Fichier CSV (encodage UTF-8)</p>
          </div>
          <button onClick={onClose} className={`flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-white/[0.08] ${t2}`}>
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
                  dragOver
                    ? "border-yellow-500/60 bg-yellow-500/5"
                    : isDark ? "border-white/[0.08] hover:border-white/[0.14]" : "border-gray-200 hover:border-gray-300"
                }`}>
                <Upload size={28} className={t3}/>
                <div>
                  <p className={`font-semibold text-sm ${t1}`}>Glissez votre fichier CSV ici</p>
                  <p className={`text-xs mt-1 ${t2}`}>ou cliquez pour sélectionner</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}/>
              </div>
              <button onClick={downloadTemplate}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark ? "border-white/[0.08] text-white/60 hover:bg-white/[0.04]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Download size={14}/> Télécharger le modèle CSV
              </button>
              <div className={`rounded-xl border ${bd} ${bg2} p-3`}>
                <p className={`text-[11px] font-semibold mb-1 ${t3}`}>Format attendu :</p>
                <p className={`text-[11px] font-mono ${t2}`}>Nom, Type, Référence, Catégorie, Prix, Devise, Taxe %, Unité, Notes</p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className={`overflow-x-auto rounded-xl border ${bd}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${bd} ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                      {["Nom","Type","Référence","Catégorie","Prix","Devise","Taxe","Unité"].map(h => (
                        <th key={h} className={`px-3 py-2 text-left font-bold uppercase tracking-wide ${t3}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i} className={`border-b ${bd} last:border-0`}>
                        <td className={`px-3 py-2 font-medium ${t1}`}>{r.description}</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.type || "service"}</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.reference || "—"}</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.category || "—"}</td>
                        <td className={`px-3 py-2 text-right ${t1}`}>{r.unit_price ?? 0}</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.devise || "EUR"}</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.vat_rate ?? 0}%</td>
                        <td className={`px-3 py-2 ${t2}`}>{r.unit || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 8 && <p className={`text-xs ${t3}`}>… et {rows.length - 8} ligne{rows.length - 8 > 1 ? "s" : ""} supplémentaire{rows.length - 8 > 1 ? "s" : ""}</p>}
            </div>
          )}

          {step === "done" && result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl border ${bd} p-3 text-center`}>
                  <p className="text-2xl font-bold text-emerald-400">{result.imported}</p>
                  <p className={`text-xs mt-1 ${t3}`}>Importés</p>
                </div>
                <div className={`rounded-xl border ${bd} p-3 text-center`}>
                  <p className={`text-2xl font-bold ${t1}`}>{result.skipped}</p>
                  <p className={`text-xs mt-1 ${t3}`}>Doublons</p>
                </div>
                <div className={`rounded-xl border ${bd} p-3 text-center`}>
                  <p className="text-2xl font-bold text-red-400">{result.errors.length}</p>
                  <p className={`text-xs mt-1 ${t3}`}>Erreurs</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className={`rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1`}>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-red-400">Ligne {e.row} : {e.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${bd} p-4 flex gap-2 justify-end`}>
          {step === "upload" && (
            <button onClick={onClose} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? "text-white/50 hover:bg-white/[0.05]" : "text-gray-500 hover:bg-gray-100"}`}>
              Annuler
            </button>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("upload")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? "text-white/50 hover:bg-white/[0.05]" : "text-gray-500 hover:bg-gray-100"}`}>
                Retour
              </button>
              <button onClick={() => void handleImport()} disabled={importing || rows.length === 0}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                style={{ background: YELLOW }}>
                {importing ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
                Importer {rows.length} article{rows.length > 1 ? "s" : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-black"
              style={{ background: YELLOW }}>
              <Check size={13}/> Fermer
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function CataloguePage() {
  const { isDark } = useTheme();

  const [items,      setItems]      = useState<CatalogItem[]>([]);
  const [stats,      setStats]      = useState<Stats>({ total: 0, archived: 0, products: 0, services: 0, categories: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Filtres
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState<"all"|"produit"|"service">("all");
  const [catFilter,    setCatFilter]    = useState("all");
  const [statusFilter, setStatusFilter] = useState<"actif"|"archivé"|"all">("actif");
  const [sortKey,      setSortKey]      = useState<"date_desc"|"date_asc"|"name_asc"|"name_desc"|"price_asc"|"price_desc">("date_desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create"|"edit"|"view">("create");
  const [drawerItem, setDrawerItem] = useState<CatalogItem | null>(null);

  // CSV
  const [csvOpen, setCsvOpen] = useState(false);

  // Actions
  const [savingId,  setSavingId]  = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "ok"|"err"|"warn"; msg: string } | null>(null);
  // Confirmation archivage
  const [confirmArchive, setConfirmArchive] = useState<CatalogItem | null>(null);

  const bg  = isDark ? "bg-[#0f1117]"        : "bg-gray-50";
  const bg2 = isDark ? "bg-[#181c28]"        : "bg-white";
  const bd  = isDark ? "border-white/[0.07]" : "border-gray-200";
  const t1  = isDark ? "text-white"          : "text-gray-900";
  const t2  = isDark ? "text-white/60"       : "text-gray-500";
  const t3  = isDark ? "text-white/30"       : "text-gray-400";
  const inp = isDark
    ? "bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/20 focus:border-yellow-500/40"
    : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-yellow-400/60";

  function showToast(type: "ok"|"err"|"warn", msg: string) {
    setToast({ type, msg });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (catFilter !== "all") params.set("category", catFilter);

      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json() as { items: CatalogItem[]; stats: Stats; categories: string[] };
      setItems(data.items ?? []);
      setStats(data.stats ?? { total: 0, archived: 0, products: 0, services: 0, categories: 0 });
      setCategories(data.categories ?? []);
    } catch { showToast("err", "Impossible de charger le catalogue"); }
    finally { setLoading(false); }
  }, [statusFilter, typeFilter, catFilter]);

  useEffect(() => { void load(); setPage(1); }, [load]);

  // Filtre + tri client-side
  const filtered = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(it =>
        it.description.toLowerCase().includes(q) ||
        (it.name && it.name.toLowerCase().includes(q)) ||
        (it.reference && it.reference.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q))
      );
    }
    const [field, dir] = sortKey.split("_") as [string, "asc"|"desc"];
    const d = dir === "asc" ? 1 : -1;
    return [...result].sort((a, b) => {
      if (field === "name")  return d * itemDisplayName(a).localeCompare(itemDisplayName(b), "fr", { sensitivity: "base" });
      if (field === "price") return d * (a.unit_price - b.unit_price);
      return d * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, [items, search, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search !== "" || statusFilter !== "actif" || typeFilter !== "all" || catFilter !== "all";
  function resetFilters() { setSearch(""); setStatusFilter("actif"); setTypeFilter("all"); setCatFilter("all"); setPage(1); }

  // ── Actions ────────────────────────────────────────────────────────────────
  function openCreate() { setDrawerMode("create"); setDrawerItem(null); setDrawerOpen(true); }
  function openEdit(it: CatalogItem) { setDrawerMode("edit"); setDrawerItem(it); setDrawerOpen(true); }
  function openView(it: CatalogItem) { setDrawerMode("view"); setDrawerItem(it); setDrawerOpen(true); }

  async function handleSave(data: Partial<CatalogItem>) {
    if (drawerMode === "create") {
      const res = await fetch("/api/catalog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      const json = await res.json() as { v1Fallback?: boolean };
      await load();
      setDrawerOpen(false);
      if (json.v1Fallback) {
        showToast("warn", "Article créé (nom + prix sauvegardés — référence, type et catégorie nécessitent la migration)");
      } else {
        showToast("ok", "Article créé");
      }
    } else {
      const res = await fetch(`/api/catalog/${drawerItem!.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      const json = await res.json() as { v1Fallback?: boolean };
      await load();
      setDrawerOpen(false);
      if (json.v1Fallback) {
        showToast("warn", "Sauvegarde partielle — nom, prix et unité mis à jour (statut, référence et catégorie nécessitent la migration)");
      } else {
        showToast("ok", "Article mis à jour");
      }
    }
  }

  async function handleDuplicate(it: CatalogItem) {
    setSavingId(it.id);
    try {
      const res = await fetch(`/api/catalog/${it.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const json = await res.json() as { v1Fallback?: boolean };
      await load();
      if (json.v1Fallback) {
        showToast("warn", "Copie créée (nom + prix uniquement — référence et catégorie nécessitent la migration)");
      } else {
        showToast("ok", "Article dupliqué");
      }
    } catch { showToast("err", "Impossible de dupliquer"); }
    finally { setSavingId(null); }
  }

  async function doArchive(it: CatalogItem) {
    setSavingId(it.id);
    try {
      const newStatus = it.status === "actif" ? "archivé" : "actif";
      const res = await fetch(`/api/catalog/${it.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...it, status: newStatus }),
      });
      if (!res.ok) {
        const e = await res.json() as { migrationRequired?: boolean; error?: string };
        if (e.migrationRequired) {
          showToast("warn", "Migration requise — statut non modifié en base de données");
        } else {
          showToast("err", "Impossible de modifier le statut");
        }
        return;
      }
      const json = await res.json() as { v1Fallback?: boolean };
      await load();
      if (json.v1Fallback) {
        showToast("warn", "Migration requise — statut non modifié en base de données");
      } else {
        showToast("ok", newStatus === "archivé" ? "Article archivé" : "Article restauré");
      }
    } catch { showToast("err", "Impossible de modifier le statut"); }
    finally { setSavingId(null); }
  }

  function handleArchive(it: CatalogItem) {
    if (it.status === "actif") {
      setConfirmArchive(it);
    } else {
      void doArchive(it);
    }
  }

  function handleExport() {
    if (filtered.length === 0) { showToast("err", "Aucun article à exporter"); return; }
    const header = ["Nom","Type","Référence","Catégorie","Prix","Devise","Taxe %","Unité","Notes","Statut"].join(",");
    const rows = filtered.map(it => [
      `"${it.description.replace(/"/g,"'")}"`,
      it.type,
      it.reference || "",
      it.category || "",
      it.unit_price,
      it.devise,
      it.vat_rate,
      it.unit || "",
      `"${(it.notes || "").replace(/"/g,"'")}"`,
      it.status,
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "catalogue-djama.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("ok", `${filtered.length} articles exportés`);
  }

  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
        active
          ? "text-black"
          : isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.09]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
      style={active ? { background: YELLOW } : {}}>
      {children}
    </button>
  );

  return (
    <div className={`flex min-h-screen flex-col ${bg}`}>

      {/* ── Header ── */}
      <div className={`sticky top-0 z-10 border-b ${bd} ${isDark ? "bg-[#0f1117]/95" : "bg-gray-50/95"} backdrop-blur px-5 py-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/client/factures"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? "text-white/40 hover:bg-white/[0.06]" : "text-gray-400 hover:bg-gray-100"}`}>
              <ArrowLeft size={15}/>
            </Link>
            <div>
              <h1 className={`text-lg font-bold leading-tight ${t1}`}>Catalogue</h1>
              <p className={`text-xs ${t2}`}>Gérez vos produits et prestations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCsvOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${isDark ? "border-white/[0.08] text-white/60 hover:bg-white/[0.05]" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
              <Upload size={12}/> Importer CSV
            </button>
            <button onClick={handleExport}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${isDark ? "border-white/[0.08] text-white/60 hover:bg-white/[0.05]" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
              <FileDown size={12}/> Exporter CSV
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black transition hover:opacity-90"
              style={{ background: YELLOW }}>
              <Plus size={13}/> Nouvel article
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total actifs", value: stats.total, icon: Package, color: YELLOW },
            { label: "Produits", value: stats.products, icon: ShoppingBag, color: "#3b82f6" },
            { label: "Services", value: stats.services, icon: Wrench, color: "#8b5cf6" },
            { label: "Catégories", value: stats.categories, icon: Tag, color: "#10b981" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-2xl border ${bd} ${bg2} px-4 py-3 flex items-center gap-3`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }}/>
              </div>
              <div>
                <p className={`text-xl font-bold tabular-nums ${t1}`}>{loading ? "—" : value}</p>
                <p className={`text-[11px] ${t3}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtres ── */}
        <div className={`overflow-hidden rounded-2xl border ${bd} ${bg2}`}>
          {/* Recherche */}
          <div className={`flex items-center gap-2 border-b ${bd} px-3.5 py-2.5`}>
            <Search size={13} className={t3}/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={`Rechercher parmi ${items.length} article${items.length !== 1 ? "s" : ""}…`}
              className={`flex-1 bg-transparent text-sm outline-none ${t1}`}
              style={{ caretColor: YELLOW }}/>
            {search && <button onClick={() => setSearch("")} className={t3}><X size={12}/></button>}
          </div>
          {/* Chips + tri */}
          <div className={`flex flex-wrap items-center gap-x-1 gap-y-1.5 px-3 py-2 ${isDark ? "" : "bg-gray-50/60"}`}>
            {/* Statut */}
            <FilterBtn active={statusFilter === "actif"}   onClick={() => { setStatusFilter("actif");   setPage(1); }}>Actifs</FilterBtn>
            <FilterBtn active={statusFilter === "archivé"} onClick={() => { setStatusFilter("archivé"); setPage(1); }}>Archivés</FilterBtn>
            <FilterBtn active={statusFilter === "all"}     onClick={() => { setStatusFilter("all");     setPage(1); }}>Tous</FilterBtn>
            <span className={`mx-1.5 text-xs ${t3}`}>·</span>
            {/* Type */}
            <FilterBtn active={typeFilter === "all"}     onClick={() => { setTypeFilter("all");     setPage(1); }}>Tous types</FilterBtn>
            <FilterBtn active={typeFilter === "produit"} onClick={() => { setTypeFilter("produit"); setPage(1); }}>Produits</FilterBtn>
            <FilterBtn active={typeFilter === "service"} onClick={() => { setTypeFilter("service"); setPage(1); }}>Services</FilterBtn>
            {/* Catégorie */}
            {categories.length > 0 && (
              <>
                <span className={`mx-1.5 text-xs ${t3}`}>·</span>
                <div className="relative">
                  <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
                    className={`appearance-none cursor-pointer rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold transition ${
                      catFilter !== "all"
                        ? "text-black"
                        : isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.09]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                    style={catFilter !== "all" ? { background: YELLOW } : {}}>
                    <option value="all">Toutes catégories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${catFilter !== "all" ? "text-black" : t3}`}/>
                </div>
              </>
            )}
            {/* Tri — aligné à droite */}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <select value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}
                  className={`appearance-none cursor-pointer rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold transition ${isDark ? "bg-white/[0.05] text-white/60 hover:bg-white/[0.09]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                  <option value="name_asc">Nom A → Z</option>
                  <option value="name_desc">Nom Z → A</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
                <ChevronDown size={11} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${t3}`}/>
              </div>
              {hasFilters && (
                <button onClick={resetFilters}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${isDark ? "bg-white/[0.05] text-white/40 hover:bg-white/[0.1] hover:text-white/60" : "border border-gray-200 text-gray-400 hover:bg-gray-100"}`}>
                  <RotateCcw size={10}/> Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tableau ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: YELLOW }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-2xl border ${bd} ${bg2}`}>
            <EmptyState filtered={!!search || typeFilter !== "all" || catFilter !== "all"} onAdd={openCreate} onImport={() => setCsvOpen(true)} isDark={isDark}/>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${bd} ${bg2}`}>
            {/* En-tête desktop — 7 colonnes : Article | Type | Catégorie | Prix HT | Taxe | Statut | Actions */}
            <div className={`hidden sm:grid border-b ${bd} px-4 py-2`}
              style={{ gridTemplateColumns: "minmax(0,1fr) 68px 90px 128px 48px 76px 128px" }}>
              {(["Article","Type","Catégorie","Prix HT","Taxe","Statut","Actions"] as const).map((h, i) => (
                <span key={h} className={`text-[10px] font-bold uppercase tracking-widest ${t3} ${
                  i === 3 || i === 4 ? "text-right" : i === 5 ? "text-center" : i === 6 ? "text-right" : ""
                }`}>{h}</span>
              ))}
            </div>

            {/* Lignes */}
            <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6" }}>
              {paginated.map(it => {
                const isSaving = savingId === it.id;
                return (
                  <div key={it.id}
                    className={`group flex flex-col gap-1.5 px-4 py-3 transition sm:grid sm:items-start ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/60"}`}
                    style={{ gridTemplateColumns: "minmax(0,1fr) 68px 90px 128px 48px 76px 128px" }}>

                    {/* Col 1 : Article */}
                    <div className="min-w-0">
                      <p className={`line-clamp-2 font-semibold text-sm leading-snug ${t1}`} title={itemDisplayName(it)}>
                        {itemDisplayName(it)}
                      </p>
                      {it.reference && <p className={`mt-0.5 truncate text-[11px] ${t3}`}>Réf. {it.reference}</p>}
                    </div>

                    {/* Mobile : badges type + catégorie + statut */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
                      <TypeBadge type={it.type}/>
                      {it.category && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-white/[0.06] text-white/50" : "bg-gray-100 text-gray-500"}`}>
                          {it.category}
                        </span>
                      )}
                      <StatusBadge status={it.status}/>
                    </div>

                    {/* Mobile : prix + actions */}
                    <div className="flex items-center justify-between sm:hidden">
                      <div>
                        <span className={`text-sm font-bold tabular-nums ${t1}`}>{fmtPrice(it.unit_price, it.devise)}</span>
                        <span className={`ml-1.5 text-[10px] ${t3}`}>HT{it.vat_rate > 0 ? ` · ${it.vat_rate}%` : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ActionButtons it={it} isSaving={isSaving} isDark={isDark} t3={t3}
                          onView={() => openView(it)} onEdit={() => openEdit(it)}
                          onDuplicate={() => void handleDuplicate(it)} onArchive={() => void handleArchive(it)}/>
                      </div>
                    </div>

                    {/* Col 2 : Type */}
                    <div className="hidden sm:block"><TypeBadge type={it.type}/></div>

                    {/* Col 3 : Catégorie */}
                    <div className="hidden sm:block min-w-0">
                      {it.category
                        ? <span className={`block truncate text-xs ${t2}`} title={it.category}>{it.category}</span>
                        : <span className={`text-xs ${t3}`}>—</span>}
                    </div>

                    {/* Col 4 : Prix HT */}
                    <div className="hidden sm:flex flex-col items-end">
                      <span className={`text-sm font-semibold tabular-nums leading-tight ${t1}`}>{fmtPrice(it.unit_price, it.devise)}</span>
                      <span className={`text-[10px] font-medium ${t3}`}>HT</span>
                    </div>

                    {/* Col 5 : Taxe */}
                    <div className={`hidden sm:block text-right text-xs tabular-nums ${t2}`}>{it.vat_rate}%</div>

                    {/* Col 6 : Statut */}
                    <div className="hidden sm:flex justify-center">
                      <StatusBadge status={it.status}/>
                    </div>

                    {/* Col 7 : Actions — toujours visibles, pas d'opacity-0 */}
                    <div className="hidden sm:flex items-center justify-end gap-1">
                      <ActionButtons it={it} isSaving={isSaving} isDark={isDark} t3={t3}
                        onView={() => openView(it)} onEdit={() => openEdit(it)}
                        onDuplicate={() => void handleDuplicate(it)} onArchive={() => void handleArchive(it)}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between border-t ${bd} px-4 py-3`}>
                <p className={`text-xs ${t3}`}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} article{filtered.length > 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${isDark ? "text-white/40 hover:bg-white/[0.06] disabled:opacity-20" : "text-gray-400 hover:bg-gray-100 disabled:opacity-30"}`}>
                    <ChevronDown size={13} className="rotate-90"/>
                  </button>
                  <span className={`flex h-7 items-center px-2 text-xs ${t3}`}>{page} / {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${isDark ? "text-white/40 hover:bg-white/[0.06] disabled:opacity-20" : "text-gray-400 hover:bg-gray-100 disabled:opacity-30"}`}>
                    <ChevronDown size={13} className="-rotate-90"/>
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`border-t ${bd} px-4 py-2.5`}>
              <p className={`text-[11px] ${t3}`}>
                {filtered.length} article{filtered.length > 1 ? "s" : ""} · utilisé automatiquement dans l'autocomplétion des factures et devis
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawer formulaire ── */}
      <AnimatePresence>
        {drawerOpen && (
          <FormDrawer
            open={drawerOpen} mode={drawerMode} item={drawerItem}
            categories={categories} isDark={isDark}
            onClose={() => setDrawerOpen(false)} onSave={handleSave}/>
        )}
      </AnimatePresence>

      {/* ── Import CSV ── */}
      <AnimatePresence>
        {csvOpen && (
          <CsvImportModal isDark={isDark}
            onClose={() => setCsvOpen(false)}
            onImported={(count, v1) => { void load(); v1 ? showToast("warn", `${count} article${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""} (nom + prix uniquement — migration requise pour les autres champs)`) : showToast("ok", `${count} article${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""}`); }}/>
        )}
      </AnimatePresence>

      {/* ── Confirmation archivage ── */}
      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmArchive(null)}>
          <div className={`w-full max-w-sm mx-4 rounded-2xl border ${bd} ${bg2} p-6 shadow-2xl`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <Archive size={18} className="text-orange-500"/>
              </div>
              <div>
                <h3 className={`text-sm font-bold ${t1}`}>Archiver cet article ?</h3>
                <p className={`mt-1 text-xs leading-relaxed ${t2}`}>
                  «&nbsp;{itemDisplayName(confirmArchive)}&nbsp;» ne sera plus visible dans les filtres actifs.
                  Vous pourrez le restaurer à tout moment via le filtre «&nbsp;Archivés&nbsp;».
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmArchive(null)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${isDark ? "bg-white/[0.06] text-white/60 hover:bg-white/[0.10]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Annuler
              </button>
              <button
                onClick={() => { const it = confirmArchive; setConfirmArchive(null); void doArchive(it); }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: "#f97316" }}>
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}

// ── Boutons d'action ───────────────────────────────────────────────────────────
function ActionButtons({ it, isSaving, isDark, t3, onView, onEdit, onDuplicate, onArchive }: {
  it: CatalogItem; isSaving: boolean; isDark: boolean; t3: string;
  onView: () => void; onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const btnCls = `flex h-7 w-7 items-center justify-center rounded-lg transition ${isDark ? "hover:bg-white/[0.08]" : "hover:bg-gray-100"} ${t3}`;
  return (
    <>
      <button onClick={onView}  className={btnCls} title="Consulter"><Eye size={12}/></button>
      <button onClick={onEdit}  className={btnCls} title="Modifier"><Pencil size={12}/></button>
      <button onClick={onDuplicate} disabled={isSaving} className={btnCls} title="Dupliquer">
        {isSaving ? <Loader2 size={12} className="animate-spin"/> : <Copy size={12}/>}
      </button>
      <button onClick={onArchive} disabled={isSaving}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          it.status === "actif"
            ? isDark ? "text-orange-400/50 hover:bg-orange-500/10 hover:text-orange-400" : "text-orange-400/60 hover:bg-orange-50 hover:text-orange-500"
            : isDark ? "text-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400" : "text-emerald-500/60 hover:bg-emerald-50 hover:text-emerald-600"
        }`}
        title={it.status === "actif" ? "Archiver" : "Restaurer"}>
        {it.status === "actif" ? <Archive size={12}/> : <RotateCcw size={12}/>}
      </button>
    </>
  );
}
