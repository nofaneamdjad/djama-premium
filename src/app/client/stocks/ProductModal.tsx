"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package, X, RefreshCw, Check, Upload, ScanLine, Image as ImageIcon } from "lucide-react";
import type { Product, Supplier, Warehouse } from "./types";
import { gold, green, ease, CATEGORIES, UNITS } from "./constants";
import { useDark, useInp, selStyle, Label } from "./ui";
import { ScannerOverlay } from "./ScannerOverlay";

export function ProductModal({ product, suppliers, warehouses, onSave, onClose }: {
  product: Partial<Product>; suppliers: Supplier[]; warehouses: Warehouse[];
  onSave: (p: Partial<Product>) => Promise<void>; onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
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
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: green + "18", border: `1px solid ${green}30` }}>
              <Package size={14} style={{ color: green }}/>
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier le produit" : "Nouveau produit"}</h3>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {/* Image upload */}
          <div>
            <Label>Photo du produit</Label>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
            {form.image_url ? (
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Produit" className={`h-16 w-16 object-cover rounded-xl border shrink-0 ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}/>
                <div className="flex flex-col gap-2 flex-1">
                  <button onClick={() => imageInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isDark ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/60" : "border-gray-200 bg-white hover:bg-gray-100 text-gray-600"}`}>
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
                className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all ${isDark ? "border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.22]" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"}`}>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
                  <ImageIcon size={16} style={{ color: gold }}/>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-gray-600"}`}>Ajouter une photo</p>
                  <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>JPG, PNG · Affiché dans l&apos;inventaire</p>
                </div>
                <Upload size={13} className={`ml-auto shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
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
                  className={`h-[42px] px-3 shrink-0 rounded-xl border transition-all flex items-center gap-1.5 ${isDark ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
                  <ScanLine size={14}/>
                  <span className="text-xs font-semibold">Scan</span>
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Catégorie</Label>
              <select value={form.category ?? "autre"} onChange={(e) => set("category", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Unité</Label>
              <select value={form.unit ?? "pièce"} onChange={(e) => set("unit", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><Label>TVA (%)</Label>
              <input type="number" value={form.vat_rate ?? 20} onChange={(e) => set("vat_rate", parseFloat(e.target.value))} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prix d&apos;achat (€ HT)</Label>
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
              }} className={inp("appearance-none")} style={selStyle(isDark)}>
                <option value="">Sans fournisseur</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><Label>Entrepôt</Label>
              <select value={form.warehouse_id ?? ""} onChange={(e) => set("warehouse_id", e.target.value || null)} className={inp("appearance-none")} style={selStyle(isDark)}>
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
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
            {form.id ? "Enregistrer" : "Créer le produit"}
          </button>
        </div>
      </motion.div>

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
