"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, BellOff, RefreshCw, Mail, AlertOctagon, ShieldAlert, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack } from "@/components/ui/ToastStack";
import type { Product, StockAlertConfig } from "./types";
import { gold, STOCK_STATES, getStockState } from "./constants";
import { useDark } from "./ui";

type AlertRow = {
  product: Product;
  config: StockAlertConfig | null;
};

export function AlertesView({ products, userId }: {
  products: Product[];
  userId: string;
}) {
  const [configs, setConfigs]       = useState<StockAlertConfig[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const { add: toast } = useToastStack();
  const isDark = useDark();

  const loadConfigs = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_alert_config")
      .select("*")
      .eq("user_id", userId);
    if (error) { toast(error.message, "error"); return; }
    setConfigs((data ?? []) as StockAlertConfig[]);
    setLoading(false);
  }, [userId, toast]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const configMap = new Map(configs.map(c => [c.product_id, c]));

  // Sort: alerts first, then by stock state severity
  const rows: AlertRow[] = [...products]
    .filter(p => p.is_active)
    .sort((a, b) => {
      const stateOrder = { rupture: 0, critique: 1, faible: 2, normal: 3, surstock: 4 };
      return (stateOrder[getStockState(a)] ?? 5) - (stateOrder[getStockState(b)] ?? 5);
    })
    .map(p => ({ product: p, config: configMap.get(p.id) ?? null }));

  async function toggleAlert(product: Product, enabled: boolean) {
    const existing = configMap.get(product.id);
    setSaving(product.id);

    if (existing) {
      const { data, error } = await supabase
        .from("stock_alert_config")
        .update({ enabled, threshold_qty: existing.threshold_qty })
        .eq("id", existing.id)
        .select()
        .single();
      setSaving(null);
      if (error) { toast(error.message, "error"); return; }
      setConfigs(prev => prev.map(c => c.id === existing.id ? data as StockAlertConfig : c));
    } else {
      const { data, error } = await supabase
        .from("stock_alert_config")
        .insert({
          user_id: userId,
          product_id: product.id,
          enabled,
          threshold_qty: product.stock_minimum,
          email_enabled: true,
        })
        .select()
        .single();
      setSaving(null);
      if (error) { toast(error.message, "error"); return; }
      setConfigs(prev => [...prev, data as StockAlertConfig]);
    }
    toast(enabled ? "Alerte activée" : "Alerte désactivée", "success");
  }

  async function updateThreshold(productId: string, threshold: number) {
    const existing = configMap.get(productId);
    if (!existing) return;
    const { data, error } = await supabase
      .from("stock_alert_config")
      .update({ threshold_qty: threshold })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) { toast(error.message, "error"); return; }
    setConfigs(prev => prev.map(c => c.id === existing.id ? data as StockAlertConfig : c));
  }

  const enabledCount = configs.filter(c => c.enabled).length;
  const alertsNow    = products.filter(p => p.stock_current <= p.stock_minimum && p.stock_current >= 0);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-600"}`}>
            Alertes de stock
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            {enabledCount} alerte{enabledCount > 1 ? "s" : ""} active{enabledCount > 1 ? "s" : ""} · {alertsNow.length} produit{alertsNow.length > 1 ? "s" : ""} en dessous du seuil
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: "rgba(201,165,90,0.1)", color: gold }}>
            <Bell size={10}/> {enabledCount} actives
          </span>
        </div>
      </div>

      {/* Current alerts banner */}
      {alertsNow.length > 0 && (
        <div className={`rounded-xl border p-3 space-y-1.5 ${isDark ? "bg-red-500/5 border-red-500/15" : "bg-red-50 border-red-200"}`}>
          <p className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <AlertOctagon size={11}/> Alertes actives maintenant
          </p>
          {alertsNow.slice(0, 5).map(p => {
            const s = STOCK_STATES[getStockState(p)];
            return (
              <div key={p.id} className="flex items-center justify-between">
                <span className={`text-xs ${isDark ? "text-white/60" : "text-gray-600"}`}>{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-400"}`}>
                    {p.stock_current} / seuil {p.stock_minimum} {p.unit}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
          {alertsNow.length > 5 && (
            <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>
              et {alertsNow.length - 5} autre{alertsNow.length - 5 > 1 ? "s" : ""}…
            </p>
          )}
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
          {/* Column headers */}
          <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b ${isDark ? "bg-white/[0.03] border-white/[0.06] text-white/25" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
            <span className="col-span-4">Produit</span>
            <span className="col-span-2 text-center">Stock actuel</span>
            <span className="col-span-2 text-center">Seuil</span>
            <span className="col-span-2 text-center">Alerte perso.</span>
            <span className="col-span-2 text-right">Email</span>
          </div>

          <div className="divide-y divide-opacity-5" style={{ '--tw-divide-opacity': '0.05' } as React.CSSProperties}>
            {rows.map(({ product, config }) => {
              const state = getStockState(product);
              const ss    = STOCK_STATES[state];
              const isEnabled = config?.enabled ?? false;

              return (
                <motion.div key={product.id} layout
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"} ${isDark ? "border-white/[0.04]" : "border-gray-100"} border-b last:border-0`}>
                  <div className="col-span-4 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{product.name}</p>
                    {product.sku && <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{product.sku}</p>}
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    <span className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{product.stock_current}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: ss.color, background: ss.bg }}>
                      {ss.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>{product.stock_minimum}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {config && config.enabled ? (
                      <input
                        type="number" min={0} defaultValue={config.threshold_qty}
                        onBlur={e => updateThreshold(product.id, parseFloat(e.target.value) || 0)}
                        className={`w-16 text-center rounded-lg px-2 py-1 text-xs border focus:outline-none ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
                      />
                    ) : (
                      <span className={`text-xs ${isDark ? "text-white/25" : "text-gray-300"}`}>—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    {config?.enabled && (
                      <Mail size={11} className={isDark ? "text-white/30" : "text-gray-400"}/>
                    )}
                    <button onClick={() => toggleAlert(product, !isEnabled)}
                      disabled={saving === product.id}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                      style={isEnabled
                        ? { background: "rgba(201,165,90,0.15)", color: gold }
                        : isDark ? { color: "rgba(255,255,255,0.3)" } : { color: "#9ca3af" }}>
                      {saving === product.id
                        ? <RefreshCw size={9} className="animate-spin"/>
                        : isEnabled ? <Bell size={9}/> : <BellOff size={9}/>}
                      {isEnabled ? "On" : "Off"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.15)" }}>
        <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: gold }}/>
        <p className={isDark ? "text-white/40" : "text-gray-500"}>
          Les alertes email sont envoyées via Resend lorsque le stock descend sous le seuil configuré.
          Configurez votre adresse email dans les paramètres DJAMA pour recevoir les notifications.
        </p>
      </div>

      {/* Phase 8 ABC legend */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? "text-white/25" : "text-gray-400"}`}>
          Analyse ABC — Répartition de la valeur
        </h4>
        <div className="flex gap-3">
          {[
            { label: "A — Critiques", desc: "Top 20% en valeur", color: "#ef4444" },
            { label: "B — Importants", desc: "30% suivants", color: "#f97316" },
            { label: "C — Courants", desc: "50% restants", color: "#10b981" },
          ].map(cat => (
            <div key={cat.label} className="flex-1 rounded-xl p-3 border" style={{ background: cat.color + "08", borderColor: cat.color + "25" }}>
              <p className="text-xs font-bold" style={{ color: cat.color }}>{cat.label}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
