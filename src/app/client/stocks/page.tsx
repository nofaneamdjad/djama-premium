"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Search, X, RefreshCw, Trash2, Edit2,
  AlertTriangle, TrendingUp, TrendingDown, BarChart2,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, AlertOctagon,
  Truck, Download, Eye, Check, ChevronDown, Filter,
  DollarSign, ShoppingCart, Zap, Activity, Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtDate, fmtEur } from "@/lib/format";

// ─────────────────────────── TYPES ───────────────────────────

type MovementType = "entree" | "sortie" | "retour" | "perte" | "casse" | "transfert" | "ajustement";
type OrderStatus  = "draft" | "sent" | "confirmed" | "received" | "cancelled";

interface Warehouse {
  id: string; user_id: string; name: string; address: string; is_default: boolean; created_at: string;
}

interface Supplier {
  id: string; user_id: string; name: string; contact: string; email: string; phone: string;
  address: string; payment_terms: string; lead_time_days: number; notes: string; created_at: string;
}

interface Product {
  id: string; user_id: string; supplier_id: string | null; warehouse_id: string | null;
  name: string; sku: string; barcode: string; description: string; category: string;
  image_url: string; unit: string; purchase_price: number; sale_price: number; vat_rate: number;
  stock_current: number; stock_minimum: number; stock_reserved: number; stock_on_order: number;
  location: string; supplier_name: string; is_active: boolean; created_at: string; updated_at: string;
}

interface Movement {
  id: string; user_id: string; product_id: string; product_name: string;
  type: MovementType; quantity: number; before_qty: number; after_qty: number;
  warehouse_id: string | null; warehouse_name: string;
  to_warehouse_id: string | null; to_warehouse_name: string;
  reason: string; reference: string; unit_cost: number; date: string; created_at: string;
}

interface SupplierOrder {
  id: string; user_id: string; supplier_id: string | null; supplier_name: string;
  status: OrderStatus; order_date: string; expected_date: string | null;
  total_amount: number; notes: string; created_at: string;
}

// ─────────────────────────── CONSTANTS ───────────────────────────

const gold = "#c9a55a";
const green = "#10b981";
const ease = [0.16, 1, 0.3, 1] as const;

const CATEGORIES = ["alimentaire", "électronique", "vêtement", "cosmétique", "mobilier", "papeterie", "outillage", "informatique", "sport", "santé", "autre"];
const UNITS = ["pièce", "kg", "g", "litre", "ml", "m²", "m", "boîte", "palette", "carton"];
const MOV_TYPES: { value: MovementType; label: string; color: string; sign: number }[] = [
  { value: "entree",     label: "Entrée",      color: "#10b981", sign: +1 },
  { value: "sortie",     label: "Sortie",      color: "#ef4444", sign: -1 },
  { value: "retour",     label: "Retour",      color: "#3b82f6", sign: +1 },
  { value: "perte",      label: "Perte",       color: "#f97316", sign: -1 },
  { value: "casse",      label: "Casse",       color: "#ef4444", sign: -1 },
  { value: "transfert",  label: "Transfert",   color: "#8b5cf6", sign:  0 },
  { value: "ajustement", label: "Ajustement",  color: "#c9a55a", sign:  0 },
];
const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Brouillon",  color: "text-white/40",   bg: "bg-white/[0.05]" },
  sent:      { label: "Envoyée",    color: "text-sky-400",    bg: "bg-sky-500/10" },
  confirmed: { label: "Confirmée",  color: "text-yellow-400", bg: "bg-yellow-500/10" },
  received:  { label: "Reçue",      color: "text-emerald-400",bg: "bg-emerald-500/10" },
  cancelled: { label: "Annulée",    color: "text-red-400",    bg: "bg-red-500/10" },
};

const EMPTY_PRODUCT = (): Partial<Product> => ({
  name: "", sku: "", barcode: "", description: "", category: "autre", unit: "pièce",
  purchase_price: 0, sale_price: 0, vat_rate: 20,
  stock_current: 0, stock_minimum: 0, stock_reserved: 0, stock_on_order: 0,
  location: "", supplier_name: "", is_active: true,
});
const EMPTY_SUPPLIER = (): Partial<Supplier> => ({
  name: "", contact: "", email: "", phone: "", address: "", payment_terms: "30 jours", lead_time_days: 7, notes: "",
});

function inp(extra = "") {
  return `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[0.6rem] font-black uppercase tracking-widest text-white/25">{children}</label>;
}

// ─────────────────────────── PRODUCT MODAL ───────────────────────────

function ProductModal({ product, suppliers, warehouses, onSave, onClose }: {
  product: Partial<Product>; suppliers: Supplier[]; warehouses: Warehouse[];
  onSave: (p: Partial<Product>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(product);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Product, v: string | number | boolean | null) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) return;
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
        className="w-full max-w-2xl bg-[#0f1117] border border-white/[0.07] rounded-[1.75rem] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: green + "18", border: `1px solid ${green}30` }}>
              <Package size={14} style={{ color: green }}/>
            </div>
            <h3 className="text-sm font-extrabold text-white/90">{form.id ? "Modifier le produit" : "Nouveau produit"}</h3>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nom du produit *</Label>
              <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Nom du produit" className={inp()}/>
            </div>
            <div><Label>SKU / Référence</Label>
              <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} placeholder="REF-001" className={inp()}/>
            </div>
            <div><Label>Code-barres</Label>
              <input value={form.barcode ?? ""} onChange={(e) => set("barcode", e.target.value)} placeholder="EAN13..." className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Catégorie</Label>
              <select value={form.category ?? "autre"} onChange={(e) => set("category", e.target.value)} className={inp("appearance-none")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Unité</Label>
              <select value={form.unit ?? "pièce"} onChange={(e) => set("unit", e.target.value)} className={inp("appearance-none")}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><Label>TVA (%)</Label>
              <input type="number" value={form.vat_rate ?? 20} onChange={(e) => set("vat_rate", parseFloat(e.target.value))} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prix d'achat (€ HT)</Label>
              <input type="number" min={0} step={0.01} value={form.purchase_price ?? 0} onChange={(e) => set("purchase_price", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Prix de vente (€ HT)</Label>
              <input type="number" min={0} step={0.01} value={form.sale_price ?? 0} onChange={(e) => set("sale_price", parseFloat(e.target.value))} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><Label>Stock actuel</Label>
              <input type="number" value={form.stock_current ?? 0} onChange={(e) => set("stock_current", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Stock minimum</Label>
              <input type="number" value={form.stock_minimum ?? 0} onChange={(e) => set("stock_minimum", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Réservé</Label>
              <input type="number" value={form.stock_reserved ?? 0} onChange={(e) => set("stock_reserved", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>En commande</Label>
              <input type="number" value={form.stock_on_order ?? 0} onChange={(e) => set("stock_on_order", parseFloat(e.target.value))} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fournisseur</Label>
              <select value={form.supplier_id ?? ""} onChange={(e) => {
                const sup = suppliers.find((s) => s.id === e.target.value);
                set("supplier_id", e.target.value || null);
                set("supplier_name", sup?.name ?? "");
              }} className={inp("appearance-none")}>
                <option value="">Sans fournisseur</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><Label>Entrepôt</Label>
              <select value={form.warehouse_id ?? ""} onChange={(e) => set("warehouse_id", e.target.value || null)} className={inp("appearance-none")}>
                <option value="">Par défaut</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div><Label>Emplacement (rayon / case)</Label>
            <input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Ex: Rayon A – Case 3" className={inp()}/>
          </div>
          <div><Label>Description</Label>
            <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Description du produit…" className={inp("resize-none")}/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: green, color: "#080a0f" }}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
            {form.id ? "Enregistrer" : "Créer le produit"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── MOVEMENT MODAL ───────────────────────────

function MovementModal({ products, warehouses, onSave, onClose }: {
  products: Product[]; warehouses: Warehouse[];
  onSave: (m: Partial<Movement>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Movement>>({ type: "entree", quantity: 1, date: new Date().toISOString().split("T")[0], reason: "", reference: "", unit_cost: 0 });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Movement, v: string | number | null) => setForm((p) => ({ ...p, [k]: v }));

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
        className="w-full max-w-lg bg-[#0f1117] border border-white/[0.07] rounded-[1.75rem] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-extrabold text-white/90">Nouveau mouvement de stock</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type buttons */}
          <div>
            <Label>Type de mouvement</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {MOV_TYPES.map((m) => (
                <button key={m.value} onClick={() => set("type", m.value)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.type === m.value ? "border-transparent" : "border-white/10 text-white/40 hover:border-white/20"}`}
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
            }} className={inp("appearance-none")}>
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
                <select value={form.warehouse_id ?? ""} onChange={(e) => set("warehouse_id", e.target.value || null)} className={inp("appearance-none")}>
                  <option value="">Par défaut</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><Label>Entrepôt destination</Label>
                <select value={form.to_warehouse_id ?? ""} onChange={(e) => set("to_warehouse_id", e.target.value || null)} className={inp("appearance-none")}>
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
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
          <button onClick={save} disabled={saving || !form.product_id || !form.quantity}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: movType.color, color: "#080a0f" }}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
            Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── SUPPLIER MODAL ───────────────────────────

function SupplierModal({ supplier, onSave, onClose }: {
  supplier: Partial<Supplier>; onSave: (s: Partial<Supplier>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Supplier>>(supplier);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Supplier, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className="w-full max-w-lg bg-[#0f1117] border border-white/[0.07] rounded-[1.75rem] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-extrabold text-white/90">{form.id ? "Modifier fournisseur" : "Nouveau fournisseur"}</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70"><X size={14}/></button>
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
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
          <button onClick={async () => { if (!form.name) return; setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: green, color: "#080a0f" }}>
            {saving ? <RefreshCw size={13} className="animate-spin inline"/> : form.id ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── DASHBOARD VIEW ───────────────────────────

function DashboardView({ products, movements, onNewProduct, onNewMovement }: {
  products: Product[]; movements: Movement[];
  onNewProduct: () => void; onNewMovement: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const totalValue = products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const lowStock = products.filter((p) => p.stock_current > 0 && p.stock_current <= p.stock_minimum);
  const outOfStock = products.filter((p) => p.stock_current <= 0);
  const todayIn = movements.filter((m) => m.date === today && (m.type === "entree" || m.type === "retour")).reduce((s, m) => s + m.quantity, 0);
  const todayOut = movements.filter((m) => m.date === today && (m.type === "sortie" || m.type === "perte" || m.type === "casse")).reduce((s, m) => s + m.quantity, 0);
  const totalProducts = products.filter((p) => p.is_active).length;

  const kpis = [
    { label: "Produits actifs",    value: totalProducts,         icon: Package,       color: "#10b981", bg: "bg-emerald-500/10" },
    { label: "Valeur totale stock",value: fmtEur(totalValue),   icon: DollarSign,    color: gold,      bg: "bg-amber-500/10", isStr: true },
    { label: "Stock faible",       value: lowStock.length,      icon: AlertTriangle, color: "#f97316", bg: "bg-orange-500/10" },
    { label: "Ruptures de stock",  value: outOfStock.length,    icon: AlertOctagon,  color: "#ef4444", bg: "bg-red-500/10" },
    { label: "Entrées aujourd'hui",value: todayIn,              icon: ArrowUpCircle, color: "#10b981", bg: "bg-emerald-500/10" },
    { label: "Sorties aujourd'hui",value: todayOut,             icon: ArrowDownCircle,color: "#ef4444",bg: "bg-red-500/10" },
  ];

  // Top 5 products by stock value
  const topProducts = [...products].sort((a, b) => (b.stock_current * b.purchase_price) - (a.stock_current * a.purchase_price)).slice(0, 5);

  // Last 8 movements
  const recentMov = movements.slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-[#0f1117] p-4 flex flex-col gap-2">
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} style={{ color: k.color }}/>
            </div>
            <div>
              <div className={`font-extrabold text-white/90 ${k.isStr ? "text-sm" : "text-xl"}`}>{k.value}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 flex items-center gap-1.5"><AlertTriangle size={12} className="text-orange-400"/> Alertes stock</h3>
          <div className="space-y-1.5">
            {outOfStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertOctagon size={13} className="text-red-400 shrink-0"/>
                  <span className="text-sm text-white/80">{p.name}</span>
                  <span className="text-xs text-red-400">{p.sku && `· ${p.sku}`}</span>
                </div>
                <span className="text-xs font-bold text-red-400">RUPTURE</span>
              </div>
            ))}
            {lowStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertTriangle size={13} className="text-orange-400 shrink-0"/>
                  <span className="text-sm text-white/80">{p.name}</span>
                </div>
                <span className="text-xs font-bold text-orange-400">{p.stock_current} / min. {p.stock_minimum} {p.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top produits */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5"><Star size={12} style={{ color: gold }}/> Top produits par valeur</h3>
          <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
            {topProducts.length === 0 ? (
              <p className="text-center text-white/25 text-sm py-8">Aucun produit</p>
            ) : topProducts.map((p, i) => {
              const val = p.stock_current * p.purchase_price;
              const maxVal = topProducts[0] ? topProducts[0].stock_current * topProducts[0].purchase_price : 1;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs font-black text-white/20 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-white/80 truncate">{p.name}</span>
                      <span className="text-xs text-white/50 shrink-0">{fmtEur(val)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(val / maxVal) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: green }}/>
                    </div>
                  </div>
                  <span className="text-xs text-white/40 shrink-0">{p.stock_current} {p.unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Derniers mouvements */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5"><Activity size={12} className="text-blue-400"/> Derniers mouvements</h3>
          <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
            {recentMov.length === 0 ? (
              <p className="text-center text-white/25 text-sm py-8">Aucun mouvement</p>
            ) : recentMov.map((m) => {
              const mt = MOV_TYPES.find((t) => t.value === m.type) ?? MOV_TYPES[0];
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="h-7 w-7 flex items-center justify-center rounded-lg shrink-0" style={{ background: mt.color + "20" }}>
                    {mt.sign >= 0 ? <ArrowUpCircle size={13} style={{ color: mt.color }}/> : <ArrowDownCircle size={13} style={{ color: mt.color }}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{m.product_name}</p>
                    <p className="text-[10px] text-white/35">{mt.label} · {fmtDate(m.date)}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: mt.color }}>
                    {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : ""}{m.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: green + "15", border: `1px solid ${green}30` }}>
            <Package size={24} style={{ color: green }}/>
          </div>
          <p className="text-white/50 text-sm">Aucun produit — commencez par créer votre inventaire</p>
          <button onClick={onNewProduct} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: green + "20", color: green, border: `1px solid ${green}40` }}>
            <Plus size={13}/> Ajouter un produit
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── PRODUCTS VIEW ───────────────────────────

function ProductsView({ products, onNew, onEdit, onDelete, onAddMovement }: {
  products: Product[]; onNew: () => void; onEdit: (p: Product) => void;
  onDelete: (id: string) => void; onAddMovement: (p: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (stockFilter === "low" && !(p.stock_current > 0 && p.stock_current <= p.stock_minimum)) return false;
    if (stockFilter === "out" && p.stock_current > 0) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStockColor = (p: Product) => {
    if (p.stock_current <= 0) return "text-red-400";
    if (p.stock_current <= p.stock_minimum) return "text-orange-400";
    return "text-emerald-400";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-2 p-4 border-b border-white/[0.06] flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher produit, SKU…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.18] pl-8 transition-colors"/>
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"/>
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none">
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none">
          <option value="all">Tout le stock</option>
          <option value="low">Stock faible</option>
          <option value="out">Ruptures</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: green, color: "#080a0f" }}>
          <Plus size={13}/> Nouveau produit
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={28} className="text-white/20"/>
            <p className="text-white/30 text-sm">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/20">
              <span className="col-span-4">Produit</span>
              <span className="col-span-2">SKU / Catégorie</span>
              <span className="col-span-2 text-right">Prix achat</span>
              <span className="col-span-2 text-right">Prix vente</span>
              <span className="col-span-2 text-right">Stock</span>
            </div>
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="group grid grid-cols-12 gap-3 items-center bg-[#0f1117] border border-white/[0.07] rounded-2xl px-4 py-3 hover:border-white/[0.14] transition-all">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] text-lg">
                      <Package size={14} className="text-white/40"/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/85 truncate">{p.name}</p>
                      {p.supplier_name && <p className="text-xs text-white/35 truncate">{p.supplier_name}</p>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-white/50">{p.sku || "—"}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/35">{p.category}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold text-white/70">{fmtEur(p.purchase_price)}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold" style={{ color: green }}>{fmtEur(p.sale_price)}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${getStockColor(p)}`}>{p.stock_current}</p>
                      <p className="text-[10px] text-white/25">{p.unit} · min {p.stock_minimum}</p>
                    </div>
                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      <button onClick={() => onAddMovement(p)} title="Mouvement" className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-emerald-400 transition-all"><Zap size={11}/></button>
                      <button onClick={() => onEdit(p)} title="Modifier" className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-all"><Edit2 size={11}/></button>
                      <button onClick={() => onDelete(p.id)} title="Supprimer" className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all"><Trash2 size={11}/></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── MOVEMENTS VIEW ───────────────────────────

function MovementsView({ movements, products, warehouses, onNew }: {
  movements: Movement[]; products: Product[]; warehouses: Warehouse[]; onNew: () => void;
}) {
  const [typeFilter, setTypeFilter] = useState<MovementType | "all">("all");
  const [productFilter, setProductFilter] = useState("all");

  const filtered = movements.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (productFilter !== "all" && m.product_id !== productFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/[0.06] flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MovementType | "all")}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none">
          <option value="all">Tous types</option>
          {MOV_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none max-w-xs">
          <option value="all">Tous produits</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: green, color: "#080a0f" }}>
          <Plus size={13}/> Mouvement
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center"><Activity size={28} className="text-white/20"/><p className="text-white/30 text-sm">Aucun mouvement</p></div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((m) => {
              const mt = MOV_TYPES.find((t) => t.value === m.type) ?? MOV_TYPES[0];
              return (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-[#0f1117] border border-white/[0.07] rounded-2xl px-4 py-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style={{ background: mt.color + "18" }}>
                    {mt.sign > 0 ? <ArrowUpCircle size={16} style={{ color: mt.color }}/> : mt.sign < 0 ? <ArrowDownCircle size={16} style={{ color: mt.color }}/> : <RotateCcw size={16} style={{ color: mt.color }}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-white/85 truncate">{m.product_name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: mt.color + "20", color: mt.color }}>{mt.label}</span>
                    </div>
                    <p className="text-xs text-white/35">
                      {fmtDate(m.date)}{m.reference ? ` · Réf: ${m.reference}` : ""}{m.reason ? ` · ${m.reason}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold" style={{ color: mt.color }}>
                      {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : ""}{m.quantity}
                    </p>
                    <p className="text-[10px] text-white/30">{m.before_qty} → {m.after_qty}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── SUPPLIERS VIEW ───────────────────────────

function SuppliersView({ suppliers, products, orders, onNew, onEdit, onDelete }: {
  suppliers: Supplier[]; products: Product[]; orders: SupplierOrder[];
  onNew: () => void; onEdit: (s: Supplier) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/60">{suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}</h3>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: green, color: "#080a0f" }}>
          <Plus size={13}/> Nouveau fournisseur
        </button>
      </div>
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Truck size={28} className="text-white/20"/>
          <p className="text-white/30 text-sm">Aucun fournisseur</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: green + "20", color: green, border: `1px solid ${green}40` }}>
            <Plus size={13}/> Ajouter
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const prodCount = products.filter((p) => p.supplier_id === s.id).length;
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="group bg-[#0f1117] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl text-sm font-black" style={{ background: green + "18", color: green, border: `1px solid ${green}30` }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                    <button onClick={() => onEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70"><Edit2 size={12}/></button>
                    <button onClick={() => onDelete(s.id)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400"><Trash2 size={12}/></button>
                  </div>
                </div>
                <h4 className="text-sm font-extrabold text-white/90 mb-1">{s.name}</h4>
                {s.contact && <p className="text-xs text-white/45 mb-0.5">{s.contact}</p>}
                {s.email && <p className="text-xs text-white/35 mb-0.5">{s.email}</p>}
                {s.phone && <p className="text-xs text-white/35 mb-3">{s.phone}</p>}
                <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1 text-[10px] text-white/30"><Package size={10}/> {prodCount} produit{prodCount > 1 ? "s" : ""}</div>
                  <div className="flex items-center gap-1 text-[10px] text-white/30"><Truck size={10}/> {s.lead_time_days}j livraison</div>
                  <div className="text-[10px] text-white/25 ml-auto">{s.payment_terms}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── REPORT VIEW ───────────────────────────

function ReportView({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const totalProducts = products.filter((p) => p.is_active).length;
  const totalValue = products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const totalSaleValue = products.reduce((s, p) => s + p.stock_current * p.sale_price, 0);
  const potentialMargin = totalSaleValue - totalValue;
  const outOfStock = products.filter((p) => p.stock_current <= 0).length;
  const lowStock = products.filter((p) => p.stock_current > 0 && p.stock_current <= p.stock_minimum).length;

  // Total entrées / sorties
  const totalIn = movements.filter((m) => m.type === "entree" || m.type === "retour").reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter((m) => m.type === "sortie" || m.type === "perte" || m.type === "casse").reduce((s, m) => s + m.quantity, 0);

  // Rotation par catégorie
  const cats = [...new Set(products.map((p) => p.category))];
  const catStats = cats.map((cat) => {
    const catProds = products.filter((p) => p.category === cat);
    const val = catProds.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
    return { cat, count: catProds.length, val };
  }).sort((a, b) => b.val - a.val);
  const totalCatVal = catStats.reduce((s, c) => s + c.val, 0);

  const kpis = [
    { label: "Produits actifs",     value: totalProducts,                   sub: `${outOfStock} ruptures · ${lowStock} faibles` },
    { label: "Valeur stock achat",  value: fmtEur(totalValue),             sub: "Prix de revient total" },
    { label: "Valeur stock vente",  value: fmtEur(totalSaleValue),         sub: "Prix de vente total" },
    { label: "Marge potentielle",   value: fmtEur(potentialMargin),        sub: `${totalValue > 0 ? Math.round((potentialMargin / totalValue) * 100) : 0}% sur le coût` },
    { label: "Total entrées",       value: totalIn,                         sub: "Toutes périodes" },
    { label: "Total sorties",       value: totalOut,                        sub: "Toutes périodes" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0f1117] border border-white/[0.07] rounded-2xl p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-xl font-extrabold text-white/90">{k.value}</p>
            <p className="text-xs text-white/35 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {catStats.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5"><BarChart2 size={12} style={{ color: green }}/> Valeur stock par catégorie</h3>
          <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl p-4 space-y-3">
            {catStats.map(({ cat, count, val }) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/70 capitalize">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/35">{count} produit{count > 1 ? "s" : ""}</span>
                    <span className="text-xs font-bold text-white/80">{fmtEur(val)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${totalCatVal > 0 ? (val / totalCatVal) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: green }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.filter((p) => p.stock_current <= 0).length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5"><AlertOctagon size={12} className="text-red-400"/> Produits en rupture</h3>
          <div className="space-y-1.5">
            {products.filter((p) => p.stock_current <= 0).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2.5">
                <div>
                  <span className="text-sm font-semibold text-white/80">{p.name}</span>
                  {p.sku && <span className="text-xs text-white/35 ml-2">{p.sku}</span>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-red-400">RUPTURE</p>
                  <p className="text-[10px] text-white/30">{p.supplier_name || "Sans fournisseur"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── MAIN PAGE ───────────────────────────

export default function StocksPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "products" | "movements" | "suppliers" | "report">("dashboard");

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>(EMPTY_PRODUCT());
  const [showMovModal, setShowMovModal] = useState(false);
  const [movProductPreset, setMovProductPreset] = useState<Product | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Partial<Supplier>>(EMPTY_SUPPLIER());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"product" | "supplier">("product");
  const [deleting, setDeleting] = useState(false);

  // Load all data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [prodRes, movRes, supRes, whRes, ordRes] = await Promise.all([
        supabase.from("stock_products").select("*").eq("user_id", user.id).order("name"),
        supabase.from("stock_movements").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("stock_suppliers").select("*").eq("user_id", user.id).order("name"),
        supabase.from("stock_warehouses").select("*").eq("user_id", user.id).order("name"),
        supabase.from("stock_supplier_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);

      if (!prodRes.error && prodRes.data) setProducts(prodRes.data as Product[]);
      if (!movRes.error && movRes.data) setMovements(movRes.data as Movement[]);
      if (!supRes.error && supRes.data) setSuppliers(supRes.data as Supplier[]);
      if (!whRes.error && whRes.data) setWarehouses(whRes.data as Warehouse[]);
      if (!ordRes.error && ordRes.data) setOrders(ordRes.data as SupplierOrder[]);
      setLoading(false);
    })();
  }, []);

  const handleSaveProduct = useCallback(async (form: Partial<Product>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_products").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setProducts((prev) => prev.map((p) => p.id === form.id ? data as Product : p));
      toast("Produit mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_products").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setProducts((prev) => [data as Product, ...prev]);
      toast("Produit créé", "success");
    }
    setShowProductModal(false);
    setEditProduct(EMPTY_PRODUCT());
  }, [userId, toast]);

  const handleSaveMovement = useCallback(async (form: Partial<Movement>) => {
    if (!userId || !form.product_id || !form.quantity) return;
    const product = products.find((p) => p.id === form.product_id);
    if (!product) return;

    const mt = MOV_TYPES.find((m) => m.value === form.type) ?? MOV_TYPES[0];
    const before = product.stock_current;
    const delta = mt.sign * (form.quantity ?? 0);
    const after = form.type === "ajustement" ? (form.quantity ?? before) : Math.max(0, before + delta);

    const movPayload = {
      ...form, user_id: userId,
      product_name: product.name,
      before_qty: before, after_qty: after,
      quantity: form.type === "ajustement" ? Math.abs((form.quantity ?? before) - before) : form.quantity,
    };

    const { data: movData, error: movErr } = await supabase.from("stock_movements").insert(movPayload).select().single();
    if (movErr) { toast(movErr.message, "error"); return; }

    // Update product stock
    const { data: prodData, error: prodErr } = await supabase.from("stock_products")
      .update({ stock_current: after, updated_at: new Date().toISOString() })
      .eq("id", product.id).select().single();
    if (prodErr) { toast(prodErr.message, "error"); return; }

    setMovements((prev) => [movData as Movement, ...prev]);
    setProducts((prev) => prev.map((p) => p.id === product.id ? prodData as Product : p));
    toast("Mouvement enregistré", "success");
    setShowMovModal(false);
    setMovProductPreset(null);
  }, [userId, products, toast]);

  const handleSaveSupplier = useCallback(async (form: Partial<Supplier>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_suppliers").update(form).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setSuppliers((prev) => prev.map((s) => s.id === form.id ? data as Supplier : s));
      toast("Fournisseur mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_suppliers").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setSuppliers((prev) => [data as Supplier, ...prev]);
      toast("Fournisseur créé", "success");
    }
    setShowSupplierModal(false);
    setEditSupplier(EMPTY_SUPPLIER());
  }, [userId, toast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const table = deleteType === "product" ? "stock_products" : "stock_suppliers";
    const { error } = await supabase.from(table).delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (error) { toast(error.message, "error"); return; }
    if (deleteType === "product") setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    else setSuppliers((prev) => prev.filter((s) => s.id !== confirmDeleteId));
    toast("Supprimé", "info");
  }, [confirmDeleteId, deleteType, toast]);

  const exportCSV = useCallback(() => {
    const rows = [
      ["Nom","SKU","Catégorie","Stock actuel","Stock min","Prix achat","Prix vente","Fournisseur","Entrepôt"].join(";"),
      ...products.map((p) => [p.name, p.sku, p.category, p.stock_current, p.stock_minimum, p.purchase_price, p.sale_price, p.supplier_name, ""].join(";")),
    ];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "stocks.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [products]);

  const TABS = [
    { key: "dashboard",  label: "Dashboard",    icon: BarChart2 },
    { key: "products",   label: "Produits",      icon: Package },
    { key: "movements",  label: "Mouvements",    icon: Activity },
    { key: "suppliers",  label: "Fournisseurs",  icon: Truck },
    { key: "report",     label: "Rapport",       icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Sub-header */}
      <div className="border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: green + "30" }}/>
              <div className="relative h-10 w-10 flex items-center justify-center rounded-xl border" style={{ background: green + "14", borderColor: green + "28" }}>
                <Package size={18} style={{ color: green }}/>
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Stocks & Inventaire</h1>
              <p className="text-[0.65rem] text-white/30">Gestion · Mouvements · Alertes · Fournisseurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} title="Exporter CSV" className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all">
              <Download size={14}/>
            </button>
            <button onClick={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition-all hover:opacity-90"
              style={{ background: green, boxShadow: `0 4px 16px ${green}40` }}>
              <Plus size={13}/> Nouveau produit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] px-5 flex gap-1 bg-[#080a0f]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px ${tab === key ? "text-white/90" : "border-transparent text-white/35 hover:text-white/60"}`}
            style={tab === key ? { borderBottomColor: green, color: green } : {}}>
            <Icon size={12}/> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={22} className="animate-spin text-white/30"/>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "dashboard" && <DashboardView products={products} movements={movements} onNewProduct={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }} onNewMovement={() => setShowMovModal(true)}/>}
          {tab === "products" && <ProductsView products={products} onNew={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }} onEdit={(p) => { setEditProduct(p); setShowProductModal(true); }} onDelete={(id) => { setDeleteType("product"); setConfirmDeleteId(id); }} onAddMovement={(p) => { setMovProductPreset(p); setShowMovModal(true); }}/>}
          {tab === "movements" && <MovementsView movements={movements} products={products} warehouses={warehouses} onNew={() => setShowMovModal(true)}/>}
          {tab === "suppliers" && <SuppliersView suppliers={suppliers} products={products} orders={orders} onNew={() => { setEditSupplier(EMPTY_SUPPLIER()); setShowSupplierModal(true); }} onEdit={(s) => { setEditSupplier(s); setShowSupplierModal(true); }} onDelete={(id) => { setDeleteType("supplier"); setConfirmDeleteId(id); }}/>}
          {tab === "report" && <ReportView products={products} movements={movements}/>}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showProductModal && (
          <ProductModal product={editProduct} suppliers={suppliers} warehouses={warehouses}
            onSave={handleSaveProduct} onClose={() => { setShowProductModal(false); setEditProduct(EMPTY_PRODUCT()); }}/>
        )}
        {showMovModal && (
          <MovementModal
            products={movProductPreset ? [movProductPreset, ...products.filter((p) => p.id !== movProductPreset.id)] : products}
            warehouses={warehouses} onSave={handleSaveMovement}
            onClose={() => { setShowMovModal(false); setMovProductPreset(null); }}/>
        )}
        {showSupplierModal && (
          <SupplierModal supplier={editSupplier} onSave={handleSaveSupplier}
            onClose={() => { setShowSupplierModal(false); setEditSupplier(EMPTY_SUPPLIER()); }}/>
        )}
      </AnimatePresence>

      <ConfirmModal open={confirmDeleteId !== null}
        title={`Supprimer ce ${deleteType === "product" ? "produit" : "fournisseur"} ?`}
        description={deleteType === "product" ? "Le produit et tous ses mouvements seront supprimés." : "Le fournisseur sera supprimé."}
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDeleteId(null)}/>
    </div>
  );
}
