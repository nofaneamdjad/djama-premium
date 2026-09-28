"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, Users, Truck } from "lucide-react";
import type { LoyalClient, ClientDelivery, Product } from "./types";
import { green, ease } from "./constants";
import { useDark, useInp, selStyle, Label } from "./ui";

export function ClientModal({ client, onSave, onClose }: {
  client: Partial<LoyalClient>; onSave: (c: Partial<LoyalClient>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<LoyalClient>>(client);
  const [saving, setSaving] = useState(false);
  const isDark = useDark();
  const inp = useInp();
  const set = (k: keyof LoyalClient, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "#6366f120", border: "1px solid #6366f130" }}>
              <Users size={14} style={{ color: "#818cf8" }}/>
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier le client" : "Nouveau client fidèle"}</h3>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
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
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
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

export function DeliveryModal({ delivery, clients, products, onSave, onClose }: {
  delivery: Partial<ClientDelivery>; clients: LoyalClient[]; products: Product[];
  onSave: (d: Partial<ClientDelivery>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ClientDelivery>>(delivery);
  const [saving, setSaving] = useState(false);
  const isDark = useDark();
  const inp = useInp();
  const set = <K extends keyof ClientDelivery>(k: K, v: ClientDelivery[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "#10b98120", border: "1px solid #10b98130" }}>
              <Truck size={14} style={{ color: green }}/>
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>Enregistrer une livraison</h3>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <Label>Client *</Label>
            <select value={form.client_id ?? ""} onChange={(e) => {
              const c = clients.find(c => c.id === e.target.value);
              set("client_id", e.target.value || null as unknown as string);
              if (c) set("client_name", c.name);
            }} className={inp()} style={selStyle(isDark)}>
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
            }} className={inp()} style={selStyle(isDark)}>
              <option value="">— Choisir un produit —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_current} {p.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantité *</Label>
              <input type="number" min={1} value={form.quantity ?? 1} onChange={(e) => set("quantity", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Label>Date de livraison</Label>
              <input type="date" value={form.delivery_date ?? ""} onChange={(e) => set("delivery_date", e.target.value)} className={inp()}/>
            </div>
          </div>
          <div><Label>Notes</Label><input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Référence commande…" className={inp()}/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
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
