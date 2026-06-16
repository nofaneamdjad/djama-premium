"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Search, X, RefreshCw, Trash2, Edit2,
  AlertTriangle, TrendingUp, TrendingDown, BarChart2,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, AlertOctagon,
  Truck, Download, Eye, Check, ChevronDown, Filter,
  DollarSign, ShoppingCart, Zap, Activity, Star,
  Camera, ScanLine, Image as ImageIcon, Upload,
  Users, MapPin, Phone, Mail, CalendarDays,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtDate, fmtEur } from "@/lib/format";

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

interface LoyalClient {
  id: string; user_id: string; name: string; email: string; phone: string;
  address: string; notes: string; created_at: string;
}

interface ClientDelivery {
  id: string; user_id: string; client_id: string | null; client_name: string;
  product_id: string | null; product_name: string;
  quantity: number; unit: string; delivery_date: string; notes: string; created_at: string;
}

type StockState = "rupture" | "critique" | "faible" | "normal" | "surstock";

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
const EMPTY_CLIENT = (): Partial<LoyalClient> => ({
  name: "", email: "", phone: "", address: "", notes: "",
});
const EMPTY_DELIVERY = (): Partial<ClientDelivery> => ({
  client_id: null, client_name: "", product_id: null, product_name: "",
  quantity: 1, unit: "pièce", delivery_date: new Date().toISOString().split("T")[0], notes: "",
});

/* ── État de stock ─────────────────────────────────────────────────── */
const STOCK_STATES: Record<StockState, { label: string; color: string; bg: string; border: string }> = {
  rupture:  { label: "RUPTURE",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  critique: { label: "CRITIQUE", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" },
  faible:   { label: "FAIBLE",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  normal:   { label: "NORMAL",   color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  surstock: { label: "SURSTOCK", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)" },
};

function getStockState(p: Product): StockState {
  if (p.stock_current <= 0) return "rupture";
  if (p.stock_minimum > 0 && p.stock_current <= p.stock_minimum * 0.5) return "critique";
  if (p.stock_minimum > 0 && p.stock_current <= p.stock_minimum) return "faible";
  if (p.stock_minimum > 0 && p.stock_current > p.stock_minimum * 4) return "surstock";
  return "normal";
}

function inp(extra = "") {
  return `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">{children}</label>;
}

// ─────────────────────────── SCANNER OVERLAY ───────────────────────────

function ScannerOverlay({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const stopped = useRef(false);

  const stopStream = () => {
    stopped.current = true;
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleScan = (code: string) => { stopStream(); onScan(code); };

  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped.current) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
        setStatus("scanning");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ("BarcodeDetector" in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ["ean_13","ean_8","code_128","code_39","qr_code","upc_a","upc_e"] });
          const loop = async () => {
            if (stopped.current) return;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const barcodes = await detector.detect(videoRef.current!);
              if (barcodes.length > 0) { handleScan(barcodes[0].rawValue); return; }
            } catch { /* ignore */ }
            animRef.current = requestAnimationFrame(loop);
          };
          animRef.current = requestAnimationFrame(loop);
        } else {
          setStatus("error");
          setErrorMsg("Scanner automatique non supporté sur ce navigateur.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Accès caméra refusé — vérifiez les permissions.");
      }
    }
    start();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) { handleScan(barcodes[0].rawValue); return; }
      }
      setErrorMsg("Aucun code-barres détecté dans l'image.");
    } catch { setErrorMsg("Erreur lors de l'analyse de l'image."); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScanLine size={16} style={{ color: gold }}/>
            <h3 className="text-sm font-bold text-white">Scanner code-barres</h3>
          </div>
          <button onClick={() => { stopStream(); onClose(); }} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={22} className="animate-spin text-white/30"/>
          </div>
        )}

        {status === "scanning" && (
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-black border border-white/[0.08]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-3/4 h-3/4 rounded-xl" style={{ border: `2px solid ${gold}60` }}>
                <motion.div className="absolute left-3 right-3 h-0.5 rounded-full" style={{ background: gold }}
                  animate={{ top: ["8%", "88%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}/>
                {/* Corner accents */}
                {[["top-0 left-0","border-t-2 border-l-2"],["top-0 right-0","border-t-2 border-r-2"],["bottom-0 left-0","border-b-2 border-l-2"],["bottom-0 right-0","border-b-2 border-r-2"]].map(([pos, cls]) => (
                  <div key={pos} className={`absolute h-5 w-5 ${pos} ${cls} rounded-sm`} style={{ borderColor: gold }}/>
                ))}
              </div>
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40">Pointez la caméra vers le code-barres</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-3 py-4">
            <div className="h-12 w-12 mx-auto flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
              <Camera size={20} style={{ color: gold }}/>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* File fallback — always shown */}
        <div className="mt-3 text-center">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>
          <button onClick={() => fileRef.current?.click()}
            className="text-xs underline underline-offset-2 transition-colors"
            style={{ color: gold + "80" }}>
            Ou analyser une photo
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────── PRODUCT MODAL ───────────────────────────

function ProductModal({ product, suppliers, warehouses, onSave, onClose }: {
  product: Partial<Product>; suppliers: Supplier[]; warehouses: Warehouse[];
  onSave: (p: Partial<Product>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(product);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Product, v: string | number | boolean | null) => setForm((p) => ({ ...p, [k]: v }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 480;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        set("image_url", canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

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
        className="w-full max-w-2xl bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: green + "18", border: `1px solid ${green}30` }}>
              <Package size={14} style={{ color: green }}/>
            </div>
            <h3 className="text-sm font-semibold text-white/90">{form.id ? "Modifier le produit" : "Nouveau produit"}</h3>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {/* Image upload */}
          <div>
            <Label>Photo du produit</Label>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
            {form.image_url ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Produit" className="h-16 w-16 object-cover rounded-xl border border-white/[0.08] shrink-0"/>
                <div className="flex flex-col gap-2 flex-1">
                  <button onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 transition-all">
                    <Upload size={11}/> Changer
                  </button>
                  <button onClick={() => set("image_url", "")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all">
                    <X size={11}/> Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.22] transition-all">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
                  <ImageIcon size={16} style={{ color: gold }}/>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white/60">Ajouter une photo</p>
                  <p className="text-[10px] text-white/30">JPG, PNG · Affiché dans l'inventaire</p>
                </div>
                <Upload size={13} className="ml-auto text-white/25 shrink-0"/>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nom du produit *</Label>
              <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Nom du produit" className={inp()}/>
            </div>
            <div><Label>SKU / Référence</Label>
              <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} placeholder="REF-001" className={inp()}/>
            </div>
            <div><Label>Code-barres</Label>
              <div className="flex gap-2">
                <input value={form.barcode ?? ""} onChange={(e) => set("barcode", e.target.value)} placeholder="EAN13, QR code…" className={inp()}/>
                <button onClick={() => setShowScanner(true)} title="Scanner"
                  className="h-[42px] px-3 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white transition-all flex items-center gap-1.5">
                  <ScanLine size={14}/>
                  <span className="text-xs font-semibold">Scan</span>
                </button>
              </div>
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
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
            {form.id ? "Enregistrer" : "Créer le produit"}
          </button>
        </div>
      </motion.div>

      {/* Scanner overlay — portal-like, above modal */}
      <AnimatePresence>
        {showScanner && (
          <ScannerOverlay
            onScan={(code) => { set("barcode", code); setShowScanner(false); }}
            onClose={() => setShowScanner(false)}/>
        )}
      </AnimatePresence>
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
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white/90">Nouveau mouvement de stock</h3>
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
            style={{ background: movType.color, color: "#07080e" }}>
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
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white/90">{form.id ? "Modifier fournisseur" : "Nouveau fournisseur"}</h3>
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
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
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

  const criticalStock = products.filter((p) => getStockState(p) === "critique");
  const overStock     = products.filter((p) => getStockState(p) === "surstock");

  const kpis = [
    { label: "Produits actifs",    value: totalProducts,         icon: Package,       color: "#10b981", bg: "bg-emerald-500/10" },
    { label: "Valeur totale stock",value: fmtEur(totalValue),   icon: DollarSign,    color: gold,      bg: "bg-amber-500/10", isStr: true },
    { label: "Stock critique",     value: criticalStock.length, icon: ShieldAlert,   color: "#f97316", bg: "bg-orange-500/10" },
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
            className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 flex flex-col gap-2">
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} style={{ color: k.color }}/>
            </div>
            <div>
              <div className={`font-bold text-white/90 ${k.isStr ? "text-sm" : "text-xl"}`}>{k.value}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(criticalStock.length > 0 || lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 flex items-center gap-1.5"><AlertTriangle size={12} className="text-orange-400"/> Alertes stock</h3>
          <div className="space-y-1.5">
            {outOfStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertOctagon size={13} className="text-red-400 shrink-0"/>
                  <span className="text-sm text-white/80">{p.name}</span>
                  <span className="text-xs text-red-400">{p.sku && `· ${p.sku}`}</span>
                </div>
                <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#ef4444",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)" }}>RUPTURE</span>
              </div>
            ))}
            {criticalStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><ShieldAlert size={13} className="text-orange-400 shrink-0"/>
                  <span className="text-sm text-white/80">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{p.stock_current} / min. {p.stock_minimum} {p.unit}</span>
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#f97316",background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.25)" }}>CRITIQUE</span>
                </div>
              </div>
            ))}
            {lowStock.filter(p => getStockState(p) === "faible").slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertTriangle size={13} className="text-amber-400 shrink-0"/>
                  <span className="text-sm text-white/80">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{p.stock_current} / min. {p.stock_minimum} {p.unit}</span>
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#f59e0b",background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)" }}>FAIBLE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top produits */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5"><Star size={12} style={{ color: gold }}/> Top produits par valeur</h3>
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">
            {topProducts.length === 0 ? (
              <p className="text-center text-white/25 text-sm py-8">Aucun produit</p>
            ) : topProducts.map((p, i) => {
              const val = p.stock_current * p.purchase_price;
              const maxVal = topProducts[0] ? topProducts[0].stock_current * topProducts[0].purchase_price : 1;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs font-semibold text-white/20 w-4 shrink-0">{i + 1}</span>
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
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">
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
  const [stockFilter, setStockFilter] = useState<"all" | StockState>("all");

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (stockFilter !== "all" && getStockState(p) !== stockFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none [color-scheme:dark]">
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none [color-scheme:dark]">
          <option value="all">Tous états</option>
          <option value="rupture">🔴 Rupture</option>
          <option value="critique">🟠 Critique</option>
          <option value="faible">🟡 Faible</option>
          <option value="normal">🟢 Normal</option>
          <option value="surstock">🔵 Surstock</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
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
            <div className="grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-medium text-white/20">
              <span className="col-span-4">Produit</span>
              <span className="col-span-2">SKU / Catégorie</span>
              <span className="col-span-2 text-right">Prix achat</span>
              <span className="col-span-2 text-right">Prix vente</span>
              <span className="col-span-2 text-right">Stocks</span>
            </div>
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="group grid grid-cols-12 gap-3 items-center bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-3 hover:border-white/[0.14] transition-all">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] overflow-hidden">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover"/>
                        : <Package size={14} className="text-white/40"/>}
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
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-white/85">{p.stock_current}</p>
                        {(() => { const s = STOCK_STATES[getStockState(p)]; return (
                          <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                            {s.label}
                          </span>
                        ); })()}
                      </div>
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
          className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none [color-scheme:dark]">
          <option value="all">Tous types</option>
          {MOV_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none appearance-none [color-scheme:dark] max-w-xs">
          <option value="all">Tous produits</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
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
                  className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.06] rounded-2xl px-4 py-3">
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
                    <p className="text-sm font-bold" style={{ color: mt.color }}>
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
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau fournisseur
        </button>
      </div>
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Truck size={28} className="text-white/20"/>
          <p className="text-white/30 text-sm">Aucun fournisseur</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: "rgba(201,165,90,0.15)", color: gold, border: `1px solid rgba(201,165,90,0.3)` }}>
            <Plus size={13}/> Ajouter
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const prodCount = products.filter((p) => p.supplier_id === s.id).length;
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="group bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.14] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl text-sm font-semibold" style={{ background: green + "18", color: green, border: `1px solid ${green}30` }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                    <button onClick={() => onEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70"><Edit2 size={12}/></button>
                    <button onClick={() => onDelete(s.id)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400"><Trash2 size={12}/></button>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white/90 mb-1">{s.name}</h4>
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

type StocksRapport = {
  score_sante:          number;
  resume_executif:      string;
  points_forts:         string[];
  alertes:              string[];
  recommandations:      string[];
  produits_prioritaires: { nom: string; sku: string; etat: string; action: string }[];
  objectif_semaine:     string;
};

function ReportView({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const { add: toast } = useToastStack();
  const [rapport, setRapport]               = useState<StocksRapport | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapportOpen, setRapportOpen]       = useState(false);

  const totalProducts   = products.filter((p) => p.is_active).length;
  const totalValue      = products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const totalSaleValue  = products.reduce((s, p) => s + p.stock_current * p.sale_price, 0);
  const potentialMargin = totalSaleValue - totalValue;
  const marginRate      = totalValue > 0 ? Math.round((potentialMargin / totalValue) * 100) : 0;
  const outOfStock      = products.filter((p) => p.stock_current <= 0).length;
  const lowStock        = products.filter((p) => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum).length;
  const criticalStock   = products.filter((p) => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum * 0.5).length;

  const totalIn  = movements.filter((m) => m.type === "entree" || m.type === "retour").reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter((m) => m.type === "sortie" || m.type === "perte" || m.type === "casse").reduce((s, m) => s + m.quantity, 0);

  const cats = [...new Set(products.map((p) => p.category))];
  const catStats = cats.map((cat) => {
    const catProds = products.filter((p) => p.category === cat);
    const val = catProds.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
    return { cat, count: catProds.length, val };
  }).sort((a, b) => b.val - a.val);
  const totalCatVal = catStats.reduce((s, c) => s + c.val, 0);

  async function runRapportIA() {
    setRapportLoading(true);
    setRapportOpen(false);
    try {
      const ruptures  = products.filter(p => p.stock_current <= 0).slice(0, 10)
        .map(p => ({ name: p.name, sku: p.sku ?? "", supplier: p.supplier_name ?? "" }));
      const alertsStock = products
        .filter(p => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum)
        .sort((a, b) => (a.stock_current / Math.max(a.stock_minimum, 1)) - (b.stock_current / Math.max(b.stock_minimum, 1)))
        .slice(0, 10)
        .map(p => ({
          name: p.name, sku: p.sku ?? "",
          current: p.stock_current, minimum: p.stock_minimum,
          state: getStockState(p),
        }));

      const res = await fetch("/api/stocks-rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalProducts, outOfStock, lowStock, criticalStock,
          totalValue, totalSaleValue, potentialMargin, marginRate,
          totalIn, totalOut,
          topCategories: catStats.slice(0, 6).map(c => ({ cat: c.cat, count: c.count, val: c.val })),
          ruptures,
          alertsStock,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json() as StocksRapport;
      setRapport(data);
      setRapportOpen(true);
    } catch {
      toast("Erreur lors de l'analyse IA — réessayez dans quelques instants.", "error");
    } finally {
      setRapportLoading(false);
    }
  }

  /* score gauge */
  const score      = rapport?.score_sante ?? 0;
  const R          = 28;
  const circ       = 2 * Math.PI * R;
  const dashOffset = circ * (1 - score / 100);
  const scoreColor = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  const kpis = [
    { label: "Produits actifs",    value: totalProducts,          sub: `${outOfStock} ruptures · ${lowStock} faibles` },
    { label: "Valeur stock achat", value: fmtEur(totalValue),    sub: "Prix de revient total" },
    { label: "Valeur stock vente", value: fmtEur(totalSaleValue), sub: "Prix de vente total" },
    { label: "Marge potentielle",  value: fmtEur(potentialMargin), sub: `${marginRate}% sur le coût` },
    { label: "Total entrées",      value: totalIn,                sub: "Toutes périodes" },
    { label: "Total sorties",      value: totalOut,               sub: "Toutes périodes" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">

      {/* ── Header + bouton Analyse IA ── */}
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/30">Rapport inventaire</p>
        <button
          onClick={runRapportIA}
          disabled={rapportLoading}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 hover:brightness-110 active:scale-95"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}
        >
          {rapportLoading
            ? <RefreshCw size={11} className="animate-spin"/>
            : <Zap size={11}/>
          }
          {rapportLoading ? "Analyse…" : "Analyse IA"}
        </button>
      </div>

      {/* ── Panneau IA ── */}
      <AnimatePresence>
        {rapportOpen && rapport && (
          <motion.div
            key="rapport-ia"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 space-y-5"
            style={{ background: "linear-gradient(135deg,rgba(201,165,90,0.07),rgba(201,165,90,0.03))", border: "1px solid rgba(201,165,90,0.18)" }}
          >
            {/* Score + résumé */}
            <div className="flex items-start gap-5">
              <div className="shrink-0 flex flex-col items-center gap-1">
                <svg width={72} height={72} viewBox="0 0 72 72">
                  <circle cx={36} cy={36} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}/>
                  <circle
                    cx={36} cy={36} r={R} fill="none"
                    stroke={scoreColor} strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`${circ}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 36 36)"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                  <text x={36} y={40} textAnchor="middle" fill={scoreColor} fontSize={15} fontWeight={900} fontFamily="inherit">{score}</text>
                </svg>
                <p className="text-[0.55rem] font-bold uppercase tracking-wider text-white/30">Score</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.65rem] font-black uppercase tracking-widest mb-1.5" style={{ color: "#c9a55a" }}>Résumé exécutif</p>
                <p className="text-[0.75rem] leading-relaxed text-white/70">{rapport.resume_executif}</p>
              </div>
            </div>

            {/* Points forts + Alertes */}
            <div className="grid sm:grid-cols-2 gap-4">
              {rapport.points_forts.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-400/70 mb-2.5">Points forts</p>
                  <ul className="space-y-1.5">
                    {rapport.points_forts.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-[0.72rem] text-white/65">
                        <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400"/>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.alertes.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-red-400/70 mb-2.5">Alertes</p>
                  <ul className="space-y-1.5">
                    {rapport.alertes.map((al, i) => (
                      <li key={i} className="flex items-start gap-2 text-[0.72rem] text-white/65">
                        <AlertTriangle size={10} className="mt-0.5 shrink-0 text-red-400"/>
                        {al}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommandations */}
            {rapport.recommandations.length > 0 && (
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest mb-2.5" style={{ color: "rgba(201,165,90,0.7)" }}>Recommandations</p>
                <ol className="space-y-2">
                  {rapport.recommandations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[0.72rem] text-white/65">
                      <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[0.55rem] font-black"
                        style={{ background: "rgba(201,165,90,0.15)", color: "#c9a55a" }}>{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Produits prioritaires */}
            {rapport.produits_prioritaires.length > 0 && (
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-white/30 mb-2.5">Produits prioritaires</p>
                <div className="space-y-1.5">
                  {rapport.produits_prioritaires.map((p, i) => {
                    const stateColor = p.etat === "rupture" ? "#ef4444" : p.etat === "critique" ? "#f97316" : "#f59e0b";
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center"
                            style={{ background: `${stateColor}18`, border: `1px solid ${stateColor}30` }}>
                            <Package size={10} style={{ color: stateColor }}/>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.7rem] font-bold text-white/80 truncate">{p.nom}</p>
                            {p.sku && <p className="text-[0.58rem] text-white/30">{p.sku}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[0.6rem] font-black uppercase" style={{ color: stateColor }}>{p.etat}</p>
                          <p className="text-[0.62rem] text-white/40 max-w-[120px] text-right leading-snug">{p.action}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Objectif semaine */}
            {rapport.objectif_semaine && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
                <Activity size={12} className="shrink-0 mt-0.5" style={{ color: "#c9a55a" }}/>
                <div>
                  <p className="text-[0.55rem] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(201,165,90,0.6)" }}>Objectif de la semaine</p>
                  <p className="text-[0.72rem] font-semibold text-white/70">{rapport.objectif_semaine}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-xl font-bold text-white/90">{k.value}</p>
            <p className="text-xs text-white/35 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Valeur par catégorie ── */}
      {catStats.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5">
            <BarChart2 size={12} style={{ color: green }}/> Valeur stock par catégorie
          </h3>
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 space-y-3">
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

      {/* ── Produits en rupture ── */}
      {products.filter((p) => p.stock_current <= 0).length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5">
            <AlertOctagon size={12} className="text-red-400"/> Produits en rupture
          </h3>
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

// ─────────────────────────── CLIENT MODALS ───────────────────────────

function ClientModal({ client, onSave, onClose }: {
  client: Partial<LoyalClient>; onSave: (c: Partial<LoyalClient>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<LoyalClient>>(client);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof LoyalClient, v: string) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "#6366f120", border: "1px solid #6366f130" }}>
              <Users size={14} style={{ color: "#818cf8" }}/>
            </div>
            <h3 className="text-sm font-semibold text-white/90">{form.id ? "Modifier le client" : "Nouveau client fidèle"}</h3>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto max-h-[65vh]">
          <div><Label>Nom *</Label><input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Nom du client" className={inp()}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="client@mail.com" className={inp()}/></div>
            <div><Label>Téléphone</Label><input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+33 6 00 00 00 00" className={inp()}/></div>
          </div>
          <div><Label>Adresse / Lieu de livraison</Label><input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="12 rue des lilas, 75001 Paris" className={inp()}/></div>
          <div><Label>Notes</Label><textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
          <button onClick={async () => { if (!form.name) return; setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff" }}>
            {saving ? <RefreshCw size={13} className="animate-spin inline"/> : form.id ? "Enregistrer" : "Créer le client"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeliveryModal({ delivery, clients, products, onSave, onClose }: {
  delivery: Partial<ClientDelivery>; clients: LoyalClient[]; products: Product[];
  onSave: (d: Partial<ClientDelivery>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ClientDelivery>>(delivery);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ClientDelivery>(k: K, v: ClientDelivery[K]) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className="w-full max-w-md bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "#10b98120", border: "1px solid #10b98130" }}>
              <Truck size={14} style={{ color: green }}/>
            </div>
            <h3 className="text-sm font-semibold text-white/90">Enregistrer une livraison</h3>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <Label>Client *</Label>
            <select value={form.client_id ?? ""} onChange={(e) => {
              const c = clients.find(c => c.id === e.target.value);
              set("client_id", e.target.value || null as unknown as string);
              if (c) set("client_name", c.name);
            }} className={inp() + " [color-scheme:dark]"}>
              <option value="">— Choisir un client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Produit livré *</Label>
            <select value={form.product_id ?? ""} onChange={(e) => {
              const p = products.find(p => p.id === e.target.value);
              set("product_id", e.target.value || null as unknown as string);
              if (p) { set("product_name", p.name); set("unit", p.unit); }
            }} className={inp() + " [color-scheme:dark]"}>
              <option value="">— Choisir un produit —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_current} {p.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantité *</Label>
              <input type="number" min={1} value={form.quantity ?? 1} onChange={(e) => set("quantity", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Date de livraison</Label>
              <input type="date" value={form.delivery_date ?? ""} onChange={(e) => set("delivery_date", e.target.value)} className={inp() + " [color-scheme:dark]"}/>
            </div>
          </div>
          <div><Label>Notes</Label><input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Référence commande…" className={inp()}/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
          <button onClick={async () => { if (!form.client_id || !form.product_id) return; setSaving(true); await onSave(form); setSaving(false); }}
            disabled={saving || !form.client_id || !form.product_id}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg,${green},#059669)`, color: "#fff" }}>
            {saving ? <RefreshCw size={13} className="animate-spin inline"/> : "Enregistrer la livraison"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── CLIENTS VIEW ───────────────────────────

function ClientsView({ clients, deliveries, products, onNewClient, onEditClient, onDeleteClient, onNewDelivery }: {
  clients: LoyalClient[]; deliveries: ClientDelivery[]; products: Product[];
  onNewClient: () => void; onEditClient: (c: LoyalClient) => void;
  onDeleteClient: (id: string) => void; onNewDelivery: (c?: LoyalClient) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getClientDeliveries = (clientId: string) =>
    deliveries.filter(d => d.client_id === clientId).sort((a,b) => b.delivery_date.localeCompare(a.delivery_date));

  const getLastDelivery = (clientId: string) => getClientDeliveries(clientId)[0];
  const getTotalDeliveries = (clientId: string) => getClientDeliveries(clientId).length;

  const selectedClient = clients.find(c => c.id === selected);
  const selectedDeliveries = selected ? getClientDeliveries(selected) : [];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left — client list */}
      <div className="w-72 xl:w-80 shrink-0 flex flex-col border-r border-white/[0.06]">
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none pl-8"/>
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"/>
          </div>
          <button onClick={onNewClient}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff" }}>
            <Plus size={13}/> Nouveau client
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
              <Users size={24} className="text-white/20"/>
              <p className="text-white/30 text-sm">Aucun client fidèle</p>
              <p className="text-white/20 text-xs">Ajoutez vos clients réguliers pour suivre leurs livraisons</p>
            </div>
          ) : filtered.map(c => {
            const last = getLastDelivery(c.id);
            const total = getTotalDeliveries(c.id);
            const isSelected = selected === c.id;
            return (
              <button key={c.id} onClick={() => setSelected(isSelected ? null : c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-indigo-500/40" : "border-white/[0.05] hover:border-white/10"}`}
                style={isSelected ? { background: "rgba(99,102,241,0.1)" } : { background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl text-xs font-bold"
                    style={{ background: "#6366f118", color: "#818cf8", border: "1px solid #6366f128" }}>
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{c.name}</p>
                    <p className="text-[10px] text-white/35 truncate">{c.email || c.phone || "Sans contact"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-white/50">{total} livr.</p>
                    {last && <p className="text-[9px] text-white/25">{new Date(last.delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right — detail panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: "#6366f112", border: "1px solid #6366f122" }}>
              <Users size={24} style={{ color: "#818cf8" }}/>
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">Sélectionnez un client</p>
              <p className="text-white/25 text-xs mt-1">pour voir son historique de livraisons</p>
            </div>
            {clients.length === 0 && (
              <button onClick={onNewClient}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold mt-2"
                style={{ background: "#6366f120", color: "#818cf8", border: "1px solid #6366f130" }}>
                <Plus size={13}/> Ajouter votre premier client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Client header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl text-base font-bold"
                  style={{ background: "#6366f118", color: "#818cf8", border: "1px solid #6366f128" }}>
                  {selectedClient.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedClient.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {selectedClient.email && <span className="flex items-center gap-1 text-xs text-white/40"><Mail size={10}/>{selectedClient.email}</span>}
                    {selectedClient.phone && <span className="flex items-center gap-1 text-xs text-white/40"><Phone size={10}/>{selectedClient.phone}</span>}
                    {selectedClient.address && <span className="flex items-center gap-1 text-xs text-white/40"><MapPin size={10}/>{selectedClient.address}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onNewDelivery(selectedClient)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: `${green}18`, color: green, border: `1px solid ${green}30` }}>
                  <Truck size={11}/> Livraison
                </button>
                <button onClick={() => onEditClient(selectedClient)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors">
                  <Edit2 size={11}/>
                </button>
                <button onClick={() => { onDeleteClient(selectedClient.id); setSelected(null); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/20 transition-colors">
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Livraisons", value: selectedDeliveries.length, icon: Truck, color: green },
                { label: "Produits différents", value: new Set(selectedDeliveries.map(d => d.product_id)).size, icon: Package, color: gold },
                { label: "Dernière livraison", value: selectedDeliveries[0] ? new Date(selectedDeliveries[0].delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : "—", icon: CalendarDays, color: "#818cf8" },
              ].map(kpi => {
                const KpiIcon = kpi.icon;
                return (
                  <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <KpiIcon size={13} style={{ color: kpi.color }} className="mb-2"/>
                    <p className="text-sm font-bold text-white/85">{kpi.value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{kpi.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Deliveries list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
                  <Truck size={11} style={{ color: green }}/> Historique des livraisons
                </h3>
                <button onClick={() => onNewDelivery(selectedClient)}
                  className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-75"
                  style={{ color: green }}>
                  <Plus size={11}/> Ajouter
                </button>
              </div>
              {selectedDeliveries.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed border-white/[0.08]">
                  <Truck size={20} className="text-white/20"/>
                  <p className="text-white/30 text-sm">Aucune livraison enregistrée</p>
                  <button onClick={() => onNewDelivery(selectedClient)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ background: `${green}18`, color: green, border: `1px solid ${green}30` }}>
                    <Plus size={11}/> Enregistrer une livraison
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDeliveries.map(d => (
                    <div key={d.id} className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.05] rounded-xl px-4 py-3">
                      <div className="h-8 w-8 flex items-center justify-center rounded-xl shrink-0" style={{ background: `${green}18` }}>
                        <Package size={13} style={{ color: green }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 truncate">{d.product_name}</p>
                        {d.notes && <p className="text-[10px] text-white/35 truncate">{d.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: green }}>{d.quantity} {d.unit}</p>
                        <p className="text-[10px] text-white/30">{new Date(d.delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient.notes && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-white/60 leading-relaxed">{selectedClient.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── MAIN PAGE ───────────────────────────

export default function StocksPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "products" | "movements" | "suppliers" | "report" | "clients">("dashboard");

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [clients, setClients] = useState<LoyalClient[]>([]);
  const [deliveries, setDeliveries] = useState<ClientDelivery[]>([]);

  const [showClientModal, setShowClientModal] = useState(false);
  const [editClientForm, setEditClientForm] = useState<Partial<LoyalClient>>(EMPTY_CLIENT());
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryPresetClient, setDeliveryPresetClient] = useState<LoyalClient | null>(null);

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }
        setUserId(user.id);

        const [prodRes, movRes, supRes, whRes, ordRes, cliRes, delRes] = await Promise.all([
          supabase.from("stock_products").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_movements").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
          supabase.from("stock_suppliers").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_warehouses").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_supplier_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("stock_loyal_clients").select("*").eq("user_id", user.id).order("name"),
          supabase.from("stock_client_deliveries").select("*").eq("user_id", user.id).order("delivery_date", { ascending: false }).limit(500),
        ]);

        if (!prodRes.error && prodRes.data) setProducts(prodRes.data as Product[]);
        if (!movRes.error && movRes.data) setMovements(movRes.data as Movement[]);
        if (!supRes.error && supRes.data) setSuppliers(supRes.data as Supplier[]);
        if (!whRes.error && whRes.data) setWarehouses(whRes.data as Warehouse[]);
        if (!ordRes.error && ordRes.data) setOrders(ordRes.data as SupplierOrder[]);
        if (!cliRes.error && cliRes.data) setClients(cliRes.data as LoyalClient[]);
        if (!delRes.error && delRes.data) setDeliveries(delRes.data as ClientDelivery[]);
      } catch {
        toast("Erreur réseau — impossible de charger les stocks", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSaveClient = useCallback(async (form: Partial<LoyalClient>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("stock_loyal_clients").update(form).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setClients(p => p.map(c => c.id === form.id ? data as LoyalClient : c));
      toast("Client mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("stock_loyal_clients").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setClients(p => [data as LoyalClient, ...p]);
      toast("Client ajouté", "success");
    }
    setShowClientModal(false);
    setEditClientForm(EMPTY_CLIENT());
  }, [userId, toast]);

  const handleDeleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("stock_loyal_clients").delete().eq("id", id);
    if (error) { toast(error.message, "error"); return; }
    setClients(p => p.filter(c => c.id !== id));
    toast("Client supprimé", "info");
  }, [toast]);

  const handleSaveDelivery = useCallback(async (form: Partial<ClientDelivery>) => {
    if (!userId || !form.client_id || !form.product_id) return;
    const { data, error } = await supabase.from("stock_client_deliveries")
      .insert({ ...form, user_id: userId }).select().single();
    if (error) { toast(error.message, "error"); return; }
    setDeliveries(p => [data as ClientDelivery, ...p]);
    toast("Livraison enregistrée", "success");
    setShowDeliveryModal(false);
    setDeliveryPresetClient(null);
  }, [userId, toast]);

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
    { key: "clients",    label: "Clients",       icon: Users },
    { key: "report",     label: "Rapport",       icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07080e] text-white flex flex-col">
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Animated header */}
      <div className="relative overflow-hidden shrink-0 sticky top-0 z-10" style={{ background: "linear-gradient(160deg,#07080e,#0c1020,#07080e)" }}>
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
        <div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#10b981,transparent)" }}/>

        {/* Main row */}
        <div className="relative px-5 pt-4 pb-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Package size={18} style={{ color: gold }}/>
              </motion.div>
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <h1 className="text-base font-bold text-white tracking-tight">Stocks & Inventaire</h1>
                <p className="text-[0.62rem] text-white/35">Gestion · Mouvements · Alertes · Fournisseurs</p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} title="Exporter CSV" className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all">
                <Download size={14}/>
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setEditProduct(EMPTY_PRODUCT()); setShowProductModal(true); }}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                <Plus size={13}/> Nouveau produit
              </motion.button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-3 sm:px-8">
          <div className="mx-auto max-w-7xl grid grid-cols-4 gap-2">
            {[
              { label: "Produits",  value: products.length,                                                              icon: Package },
              { label: "Ruptures",  value: products.filter((p) => p.stock_current <= 0).length,                         icon: AlertOctagon },
              { label: "Valeur",    value: fmtEur(products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0)), icon: DollarSign },
              { label: "Mvts",      value: movements.length,                                                             icon: Activity },
            ].map((kpi, i) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 border border-white/[0.06] bg-white/[0.03]">
                  <KpiIcon size={13} style={{ color: gold }} className="shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white leading-none truncate">{kpi.value}</p>
                    <p className="text-[0.58rem] text-white/35 uppercase tracking-wide mt-0.5">{kpi.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 sm:px-8 flex gap-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab === key ? "text-white" : "text-white/35 hover:text-white/60"}`}>
              <Icon size={12}/>
              {label}
              {tab === key && (
                <motion.div layoutId="stocks-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: gold }}/>
              )}
            </button>
          ))}
        </div>

        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
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
          {tab === "clients" && <ClientsView clients={clients} deliveries={deliveries} products={products}
            onNewClient={() => { setEditClientForm(EMPTY_CLIENT()); setShowClientModal(true); }}
            onEditClient={(c) => { setEditClientForm(c); setShowClientModal(true); }}
            onDeleteClient={handleDeleteClient}
            onNewDelivery={(c) => { setDeliveryPresetClient(c ?? null); setShowDeliveryModal(true); }}/>}
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
        {showClientModal && (
          <ClientModal client={editClientForm} onSave={handleSaveClient}
            onClose={() => { setShowClientModal(false); setEditClientForm(EMPTY_CLIENT()); }}/>
        )}
        {showDeliveryModal && (
          <DeliveryModal
            delivery={deliveryPresetClient ? { ...EMPTY_DELIVERY(), client_id: deliveryPresetClient.id, client_name: deliveryPresetClient.name } : EMPTY_DELIVERY()}
            clients={clients} products={products}
            onSave={handleSaveDelivery}
            onClose={() => { setShowDeliveryModal(false); setDeliveryPresetClient(null); }}/>
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
