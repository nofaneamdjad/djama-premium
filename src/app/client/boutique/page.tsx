"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, X, Trash2, Edit2, Check, Package, Tag, ShoppingCart } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

interface Product { id: string; name: string; price: number; stock: number; category: string; emoji: string; active: boolean }

const CATS = ["Service", "Produit physique", "Numérique", "Formation", "Abonnement"];
const DEMO_PRODUCTS: Product[] = [
  { id: "1", name: "Pack Coaching 3 mois", price: 890,  stock: 999, category: "Service",    emoji: "🎯", active: true },
  { id: "2", name: "Formation Excel Pro",  price: 149,  stock: 999, category: "Formation",   emoji: "📊", active: true },
  { id: "3", name: "Template CV Premium",  price: 29,   stock: 999, category: "Numérique",   emoji: "📄", active: true },
  { id: "4", name: "Livre blanc SEO 2026", price: 19,   stock: 999, category: "Numérique",   emoji: "📖", active: false },
];

export default function BoutiquePage() {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"produits" | "commandes">("produits");
  const [form, setForm] = useState<Partial<Product>>({ category: CATS[0], emoji: "📦", active: true });

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function save() {
    if (!form.name?.trim() || !form.price) return;
    setProducts(p => [{ id: uid(), name: form.name!, price: form.price!, stock: form.stock ?? 999, category: form.category!, emoji: form.emoji!, active: form.active ?? true }, ...p]);
    setForm({ category: CATS[0], emoji: "📦", active: true });
    setCreating(false);
  }

  const totalCA = products.filter(p => p.active).reduce((s2, p) => s2 + p.price, 0);
  const EMOJIS = ["📦", "🎯", "📊", "📄", "📖", "💡", "🎓", "🛍️", "⭐", "🔧"];

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={ShoppingBag} color="#ec4899" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Boutique en ligne</h1>
              <p className={`text-[10px] ${s.muted}`}>{products.filter(p => p.active).length} produits actifs</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}>
            <Plus size={14} /> Produit
          </button>
        </motion.div>

        <div className="flex gap-1.5 mt-4">
          {(["produits", "commandes"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-xl px-4 py-1.5 text-[11.5px] font-semibold transition"
              style={tab === t
                ? { background: "rgba(236,72,153,0.15)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.30)" }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              {t === "produits" ? "Catalogue" : "Commandes"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {tab === "produits" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: p.active ? 1 : 0.5, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25, ease, delay: i * 0.04 }}
                  className={`rounded-2xl border p-4 ${s.card}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                        style={{ background: "rgba(236,72,153,0.10)", border: "1px solid rgba(236,72,153,0.20)" }}>
                        {p.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-bold truncate ${s.text}`}>{p.name}</p>
                        <span className={`text-[10px] ${s.muted}`}>{p.category}</span>
                      </div>
                    </div>
                    <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))}
                      className={`shrink-0 rounded-lg p-1.5 hover:text-red-400 transition ${s.muted}`}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
                    <p className="text-[17px] font-black tabular-nums" style={{ color: "#ec4899" }}>{p.price.toLocaleString("fr-FR")} €</p>
                    <button onClick={() => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))}
                      className="text-[10px] font-bold rounded-full px-2.5 py-1 transition"
                      style={p.active
                        ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
                        : { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}` }}>
                      {p.active ? "✓ Actif" : "Inactif"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {tab === "commandes" && (
          <div className={`rounded-2xl border p-8 text-center mt-2 ${s.card}`}>
            <ShoppingCart size={36} className={`mx-auto mb-3 ${s.muted}`} />
            <p className={`text-[13px] font-bold ${s.text}`}>Aucune commande pour l'instant</p>
            <p className={`text-[11px] mt-1 ${s.muted}`}>Les commandes apparaîtront ici dès que vos clients achèteront</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-sm rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouveau produit</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Icône</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
                        className="w-8 h-8 text-lg rounded-lg transition"
                        style={{ background: form.emoji === e ? "rgba(236,72,153,0.20)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: form.emoji === e ? "1.5px solid rgba(236,72,153,0.50)" : "1px solid transparent" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Nom du produit *</label>
                  <input className={s.input} placeholder="Ex: Pack Coaching 3 mois" value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Prix (€) *</label>
                    <input type="number" min="0" className={s.input} placeholder="99" value={form.price ?? ""} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} />
                  </div>
                  <div>
                    <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Catégorie</label>
                    <select className={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={save} disabled={!form.name?.trim() || !form.price}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}>
                <Check size={15} /> Ajouter au catalogue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
