"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Trash2, RefreshCw, Package, CalendarDays, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack } from "@/components/ui/ToastStack";
import type { Product, StockLot } from "./types";
import { gold, ease } from "./constants";
import { useDark, useInp, Label } from "./ui";

const EMPTY_LOT = (): Partial<StockLot> => ({
  lot_number: "", expiry_date: null, quantity: 0, notes: "",
});

function fmtDateFr(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export function LotsView({ product, userId, onClose }: {
  product: Product; userId: string; onClose: () => void;
}) {
  const [lots, setLots]         = useState<StockLot[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<Partial<StockLot>>(EMPTY_LOT());
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { add: toast } = useToastStack();
  const isDark = useDark();
  const inp    = useInp();

  const loadLots = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_lots")
      .select("*")
      .eq("product_id", product.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) { toast(error.message, "error"); return; }
    setLots((data ?? []) as StockLot[]);
    setLoading(false);
  }, [product.id, userId, toast]);

  useEffect(() => { loadLots(); }, [loadLots]);

  const totalLots = lots.reduce((s, l) => s + l.quantity, 0);
  const expiringSoon = lots.filter(l => { const d = daysUntil(l.expiry_date); return d !== null && d <= 30 && d >= 0; });

  async function handleSave() {
    if (!form.lot_number?.trim()) { toast("Numéro de lot requis", "info"); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: userId,
      product_id: product.id,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("stock_lots").insert(payload).select().single();
    setSaving(false);
    if (error) { toast(error.message, "error"); return; }
    setLots(prev => [data as StockLot, ...prev]);
    setForm(EMPTY_LOT());
    setShowForm(false);
    toast("Lot créé", "success");
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("stock_lots").delete().eq("id", id);
    setDeleting(null);
    if (error) { toast(error.message, "error"); return; }
    setLots(prev => prev.filter(l => l.id !== id));
    toast("Lot supprimé", "info");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[80vh] ${isDark ? "bg-[#0d1117] border-white/[0.08]" : "bg-white border-gray-200"}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: gold + "18", border: `1px solid ${gold}30` }}>
              <Package size={14} style={{ color: gold }}/>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? "text-white/90" : "text-gray-800"}`}>Lots / Séries</h3>
              <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{product.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: gold + "18", color: gold, border: `1px solid ${gold}30` }}>
              <Plus size={11}/> Nouveau lot
            </button>
            <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400"}`}><X size={13}/></button>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex gap-4 px-5 py-3 border-b text-xs ${isDark ? "border-white/[0.05] text-white/40" : "border-gray-100 text-gray-500"}`}>
          <span>{lots.length} lot{lots.length > 1 ? "s" : ""}</span>
          <span className="font-semibold" style={{ color: gold }}>{totalLots} {product.unit} total</span>
          {expiringSoon.length > 0 && (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle size={10}/> {expiringSoon.length} expirant bientôt
            </span>
          )}
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`border-b overflow-hidden ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Numéro de lot *</Label>
                  <input value={form.lot_number ?? ""} onChange={e => setForm(f => ({...f, lot_number: e.target.value}))} placeholder="LOT-2026-001…" className={inp()}/>
                </div>
                <div><Label>Quantité</Label>
                  <input type="number" min={0} value={form.quantity ?? ""} onChange={e => setForm(f => ({...f, quantity: parseFloat(e.target.value)||0}))} className={inp()}/>
                </div>
                <div><Label>Date d&apos;expiration (DLC)</Label>
                  <input type="date" value={form.expiry_date ?? ""} onChange={e => setForm(f => ({...f, expiry_date: e.target.value || null}))} className={inp()}/>
                </div>
                <div className="col-span-2"><Label>Notes</Label>
                  <input value={form.notes ?? ""} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Fournisseur, conditionnement…" className={inp()}/>
                </div>
                <div className="col-span-2 flex gap-2">
                  <button onClick={() => { setShowForm(false); setForm(EMPTY_LOT()); }}
                    className={`px-3 py-2 rounded-xl text-xs border ${isDark ? "text-white/40 border-white/10" : "text-gray-400 border-gray-200"}`}>Annuler</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                    {saving ? <RefreshCw size={11} className="animate-spin inline"/> : "Enregistrer"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lots list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-6"><RefreshCw size={16} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/></div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Package size={22} className={isDark ? "text-white/20" : "text-gray-300"}/>
              <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun lot enregistré</p>
            </div>
          ) : lots.map(lot => {
            const days = daysUntil(lot.expiry_date);
            const expColor = days === null ? undefined : days < 0 ? "#ef4444" : days <= 7 ? "#f59e0b" : days <= 30 ? "#f97316" : undefined;
            return (
              <div key={lot.id} className={`group flex items-center gap-3 rounded-xl px-4 py-3 border ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-gray-200"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDark ? "text-white/85" : "text-gray-800"}`}>{lot.lot_number}</span>
                    <span className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-gray-600"}`}>{lot.quantity} {product.unit}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lot.expiry_date && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: expColor ?? (isDark ? "rgba(255,255,255,0.35)" : "#9ca3af") }}>
                        <CalendarDays size={9}/>
                        DLC {fmtDateFr(lot.expiry_date)}
                        {days !== null && days <= 30 && ` (${days < 0 ? "expiré" : days === 0 ? "aujourd'hui" : `J-${days}`})`}
                      </span>
                    )}
                    {lot.notes && <span className={`text-[10px] truncate ${isDark ? "text-white/25" : "text-gray-400"}`}>{lot.notes}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(lot.id)} disabled={deleting === lot.id}
                  className={`opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-lg transition-all text-red-400 hover:bg-red-500/10 ${isDark ? "" : ""}`}>
                  {deleting === lot.id ? <RefreshCw size={10} className="animate-spin"/> : <Trash2 size={10}/>}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
