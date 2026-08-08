"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Trash2, Check, Receipt, Clock } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

interface Product { id: string; name: string; price: number; emoji: string }
interface CartItem { product: Product; qty: number }
interface Sale { id: string; items: CartItem[]; total: number; at: string; payMode: string }

const CATALOG: Product[] = [
  { id: "p1", name: "Consultation 30 min", price: 50,   emoji: "💬" },
  { id: "p2", name: "Consultation 1 heure", price: 90,  emoji: "🎯" },
  { id: "p3", name: "Formation demi-journée", price: 250, emoji: "📚" },
  { id: "p4", name: "Pack 5 séances", price: 350,       emoji: "⭐" },
  { id: "p5", name: "Audit + rapport", price: 180,      emoji: "📋" },
  { id: "p6", name: "Site vitrine IA", price: 490,      emoji: "🌐" },
];

export default function CaissePage() {
  const { isDark } = useTheme();
  const [cart, setCart]       = useState<CartItem[]>([]);
  const [sales, setSales]     = useState<Sale[]>([]);
  const [tab, setTab]         = useState<"caisse" | "historique">("caisse");
  const [payMode, setPayMode] = useState<"CB" | "Espèces" | "Virement">("CB");
  const [success, setSuccess] = useState(false);

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
  };

  function addToCart(p: Product) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === p.id);
      return ex ? prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { product: p, qty: 1 }];
    });
  }
  function removeFromCart(id: string) { setCart(prev => prev.filter(c => c.product.id !== id)); }
  function adjustQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  }

  const total = cart.reduce((s2, c) => s2 + c.product.price * c.qty, 0);

  function finalizeSale() {
    if (!cart.length) return;
    setSales(prev => [{ id: uid(), items: [...cart], total, at: new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }), payMode }, ...prev]);
    setCart([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  const todayTotal = sales.reduce((s2, x) => s2 + x.total, 0);

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={ShoppingCart} color="#0d9488" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Caisse / POS</h1>
              <p className={`text-[10px] ${s.muted}`}>{sales.length} ventes · {todayTotal.toLocaleString("fr-FR")} € aujourd'hui</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {(["caisse", "historique"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-semibold transition"
                style={tab === t
                  ? { background: "rgba(13,148,136,0.18)", color: "#0d9488", border: "1px solid rgba(13,148,136,0.35)" }
                  : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: s.muted, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {t === "caisse" ? "Caisse" : "Historique"}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {tab === "caisse" && (
        <div className="px-4 flex flex-col lg:flex-row gap-4">
          {/* Catalogue */}
          <div className="flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${s.muted}`}>Catalogue</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATALOG.map(p => (
                <motion.button key={p.id} whileTap={{ scale: 0.94 }} onClick={() => addToCart(p)}
                  className={`rounded-2xl border p-4 text-left transition hover:border-teal-500/40 ${s.card}`}>
                  <div className="text-2xl mb-2">{p.emoji}</div>
                  <p className={`text-[12px] font-semibold leading-tight ${s.text}`}>{p.name}</p>
                  <p className="text-[14px] font-black mt-1 tabular-nums" style={{ color: "#0d9488" }}>{p.price} €</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Panier */}
          <div className="lg:w-72 shrink-0">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${s.muted}`}>Panier ({cart.length})</p>
            <div className={`rounded-2xl border p-4 ${s.card}`}>
              {cart.length === 0 ? (
                <p className={`text-[11px] text-center py-8 ${s.muted}`}>Aucun article</p>
              ) : (
                <div className="space-y-2.5">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-[12px] font-semibold truncate ${s.text}`}>{item.product.name}</p>
                        <p className={`text-[10px] ${s.muted}`}>{item.product.price} €</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => adjustQty(item.product.id, -1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center"
                          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
                          <Minus size={10} className={s.muted} />
                        </button>
                        <span className={`text-[12px] font-bold w-5 text-center ${s.text}`}>{item.qty}</span>
                        <button onClick={() => adjustQty(item.product.id, 1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center"
                          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
                          <Plus size={10} className={s.muted} />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:text-red-400 transition">
                          <Trash2 size={10} className={s.muted} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 mt-1" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[12px] font-bold ${s.text}`}>Total</span>
                      <span className="text-[20px] font-black tabular-nums" style={{ color: "#0d9488" }}>{total.toLocaleString("fr-FR")} €</span>
                    </div>
                    <div className="flex gap-1.5 mb-3">
                      {(["CB", "Espèces", "Virement"] as const).map(m => (
                        <button key={m} onClick={() => setPayMode(m)}
                          className="flex-1 rounded-lg py-1 text-[10px] font-bold transition"
                          style={payMode === m ? { background: "#0d9488", color: "white" } : { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <motion.button onClick={finalizeSale}
                      whileTap={{ scale: 0.96 }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black text-white transition"
                      style={{ background: success ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                      {success ? <><Check size={15} /> Vente enregistrée !</> : <><ShoppingCart size={15} /> Encaisser {total.toLocaleString("fr-FR")} €</>}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "historique" && (
        <div className="px-4 space-y-2.5">
          {sales.length === 0 && (
            <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
              <Receipt size={32} className={`mx-auto mb-2 ${s.muted}`} />
              <p className={`text-[12px] ${s.muted}`}>Aucune vente enregistrée</p>
            </div>
          )}
          {sales.map((sale, i) => (
            <motion.div key={sale.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
              className={`rounded-2xl border p-4 ${s.card}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-[12px] font-bold ${s.text}`}>{sale.items.length} article{sale.items.length > 1 ? "s" : ""} · {sale.payMode}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={9} className={s.muted} />
                    <p className={`text-[10px] ${s.muted}`}>{sale.at}</p>
                  </div>
                </div>
                <p className="text-[18px] font-black tabular-nums" style={{ color: "#0d9488" }}>{sale.total.toLocaleString("fr-FR")} €</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
