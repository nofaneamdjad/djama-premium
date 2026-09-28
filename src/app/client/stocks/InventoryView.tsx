"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList, Plus, X, RefreshCw, CheckCircle2,
  AlertTriangle, ChevronRight, FileText, Search,
  Filter, Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack } from "@/components/ui/ToastStack";
import type { Product, Warehouse, InventorySession, InventoryLine } from "./types";
import { gold, green, ease } from "./constants";
import { useDark, useInp, selStyle, Label } from "./ui";
import { fmtEur } from "@/lib/format";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<InventorySession["status"], string> = {
  ouvert: "En cours",
  valide: "Validé",
  annule: "Annulé",
};
const STATUS_COLOR: Record<InventorySession["status"], string> = {
  ouvert: "#f59e0b",
  valide: "#10b981",
  annule: "#6b7280",
};

function fmtDateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Create session modal ─────────────────────────────────────────────────────

function CreateSessionModal({ warehouses, onSave, onClose }: {
  warehouses: Warehouse[];
  onSave: (name: string, warehouseId: string | null, notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName]   = useState(`Inventaire du ${new Date().toLocaleDateString("fr-FR")}`);
  const [whId, setWhId]   = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const isDark = useDark();
  const inp    = useInp();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: gold + "18", border: `1px solid ${gold}30` }}>
              <ClipboardList size={14} style={{ color: gold }}/>
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>Nouvelle session d&apos;inventaire</h3>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3">
          <div><Label>Nom de la session *</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Inventaire mensuel…" className={inp()}/>
          </div>
          {warehouses.length > 0 && (
            <div><Label>Entrepôt (optionnel)</Label>
              <select value={whId} onChange={e => setWhId(e.target.value)} className={inp()} style={selStyle(isDark)}>
                <option value="">Tous les entrepôts</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
          <div><Label>Notes</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inp("resize-none")} placeholder="Périmètre, responsable…"/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={async () => { if (!name.trim()) return; setSaving(true); await onSave(name.trim(), whId || null, notes); setSaving(false); }}
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin inline"/> : "Démarrer l'inventaire"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Counting overlay ─────────────────────────────────────────────────────────

function CountingOverlay({ session, lines: initialLines, products, onClose, onValidated }: {
  session: InventorySession;
  lines: InventoryLine[];
  products: Product[];
  onClose: () => void;
  onValidated: () => void;
}) {
  const [lines, setLines] = useState<InventoryLine[]>(initialLines);
  const [filter, setFilter] = useState<"all" | "uncounted" | "diff">("all");
  const [search, setSearch] = useState("");
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const { add: toast } = useToastStack();
  const isDark = useDark();
  const inp    = useInp();

  const isReadOnly = session.status !== "ouvert";

  // Per-line counted_qty update (debounced save on blur)
  async function saveLine(lineId: string, counted_qty: number | null, justification: string) {
    setSaving(lineId);
    const { error } = await supabase.from("stock_inventory_lines")
      .update({ counted_qty, justification, updated_at: new Date().toISOString() })
      .eq("id", lineId);
    setSaving(null);
    if (error) toast(error.message, "error");
  }

  function updateLine(id: string, patch: Partial<InventoryLine>) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  const counted   = lines.filter(l => l.counted_qty !== null).length;
  const withDiff  = lines.filter(l => l.counted_qty !== null && l.counted_qty !== l.expected_qty).length;
  const allCounted = counted === lines.length;

  const visible = lines.filter(l => {
    if (filter === "uncounted" && l.counted_qty !== null) return false;
    if (filter === "diff" && (l.counted_qty === null || l.counted_qty === l.expected_qty)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.product_name.toLowerCase().includes(q) && !l.sku.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleValidate() {
    if (!allCounted) { toast("Comptez tous les produits avant de valider", "info"); return; }
    setValidating(true);
    const { error } = await supabase.rpc("validate_inventory_session", { p_session_id: session.id });
    setValidating(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Inventaire validé — mouvements créés", "success");
    onValidated();
  }

  async function handleCancel() {
    const { error } = await supabase.from("stock_inventory_sessions")
      .update({ status: "annule" }).eq("id", session.id);
    if (error) { toast(error.message, "error"); return; }
    toast("Session annulée", "info");
    onClose();
  }

  // Print PDF report (read-only sessions)
  function printReport() {
    const diffLines = lines.filter(l => l.counted_qty !== null && l.counted_qty !== l.expected_qty);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Inventaire ${session.name}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #111; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  .meta { color: #555; margin-bottom: 16px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { border: 1px solid #ddd; padding: 5px 8px; }
  .diff-pos { color: #059669; font-weight: bold; }
  .diff-neg { color: #dc2626; font-weight: bold; }
  .diff-zero { color: #6b7280; }
  @media print { button { display: none; } }
</style></head><body>
<h1>Rapport d'inventaire — ${session.name}</h1>
<p class="meta">Validé le ${session.validated_at ? fmtDateFr(session.validated_at) : "—"} · ${lines.length} produits · ${withDiff} écart(s)</p>
<button onclick="window.print()" style="margin-bottom:12px;padding:6px 14px;background:#c9a55a;color:#fff;border:none;border-radius:6px;cursor:pointer;">Imprimer / PDF</button>
<table>
<thead><tr><th>Produit</th><th>SKU</th><th>Unité</th><th>Théorique</th><th>Compté</th><th>Écart</th><th>Justification</th></tr></thead>
<tbody>
${lines.map(l => {
  const diff = l.counted_qty !== null ? l.counted_qty - l.expected_qty : null;
  const diffClass = diff === null ? "" : diff > 0 ? "diff-pos" : diff < 0 ? "diff-neg" : "diff-zero";
  return `<tr><td>${l.product_name}</td><td>${l.sku || "—"}</td><td>${l.unit}</td>
    <td>${l.expected_qty}</td>
    <td>${l.counted_qty !== null ? l.counted_qty : "—"}</td>
    <td class="${diffClass}">${diff !== null ? (diff > 0 ? "+" : "") + diff : "—"}</td>
    <td>${l.justification || ""}</td></tr>`;
}).join("")}
</tbody></table>
${diffLines.length > 0 ? `<p style="margin-top:12px;font-size:10px;color:#555;">
Total écarts : ${diffLines.length} produit(s) ajusté(s)</p>` : ""}
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col ${isDark ? "bg-[#07080e]" : "bg-white"}`}>

      {/* Header */}
      <div className={`shrink-0 flex items-center gap-3 px-5 py-3 border-b ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
        <button onClick={onClose} className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        <div className="flex-1 min-w-0">
          <h2 className={`text-sm font-bold truncate ${isDark ? "text-white/90" : "text-gray-800"}`}>{session.name}</h2>
          <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>
            {counted}/{lines.length} produits comptés · {withDiff} écart{withDiff > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isReadOnly && session.status === "valide" && (
            <button onClick={printReport}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isDark ? "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
              <FileText size={12}/> Rapport PDF
            </button>
          )}
          {!isReadOnly && (
            <>
              <button onClick={handleCancel}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/20" : "border-gray-200 text-gray-400 hover:text-red-400"}`}>
                Annuler
              </button>
              <button onClick={handleValidate} disabled={validating || !allCounted}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{ background: allCounted ? "linear-gradient(135deg,#10b981,#059669)" : undefined, color: allCounted ? "#fff" : undefined, border: allCounted ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}` }}>
                {validating ? <RefreshCw size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>}
                Valider l&apos;inventaire
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1 shrink-0 ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
        <motion.div className="h-full rounded-full"
          animate={{ width: `${lines.length > 0 ? (counted / lines.length) * 100 : 0}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ background: allCounted ? green : gold }}/>
      </div>

      {/* Filters */}
      <div className={`shrink-0 flex items-center gap-2 px-4 py-3 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher produit, SKU…"
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none pl-8 border ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"}`}/>
          <Search size={12} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <div className="flex items-center gap-1">
          <Filter size={11} className={isDark ? "text-white/30" : "text-gray-400"}/>
          {(["all","uncounted","diff"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={filter === f
                ? { background: gold + "20", color: gold }
                : isDark ? { color: "rgba(255,255,255,0.35)" } : { color: "#9ca3af" }}>
              {f === "all" ? "Tous" : f === "uncounted" ? "Non comptés" : "Avec écarts"}
            </button>
          ))}
        </div>
      </div>

      {/* Lines table */}
      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className={`sticky top-0 z-10 grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider border-b ${isDark ? "bg-[#07080e] border-white/[0.05] text-white/25" : "bg-white border-gray-100 text-gray-400"}`}>
          <span className="col-span-4">Produit</span>
          <span className="col-span-1 text-right">Unité</span>
          <span className="col-span-1 text-right">Théorique</span>
          <span className="col-span-2 text-right">Compté</span>
          <span className="col-span-1 text-right">Écart</span>
          <span className="col-span-3">Justification</span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun produit correspondant</p>
          </div>
        ) : visible.map(line => {
          const diff    = line.counted_qty !== null ? line.counted_qty - line.expected_qty : null;
          const diffColor = diff === null ? undefined : diff === 0 ? (isDark ? "rgba(255,255,255,0.4)" : "#9ca3af") : diff > 0 ? "#10b981" : "#ef4444";

          return (
            <div key={line.id} className={`grid grid-cols-12 gap-2 items-center px-4 py-2.5 border-b transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"}`}>
              <div className="col-span-4 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{line.product_name}</p>
                {line.sku && <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{line.sku}</p>}
              </div>
              <div className={`col-span-1 text-right text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{line.unit}</div>
              <div className={`col-span-1 text-right text-sm font-semibold ${isDark ? "text-white/60" : "text-gray-500"}`}>{line.expected_qty}</div>
              <div className="col-span-2 flex justify-end">
                {isReadOnly ? (
                  <span className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-700"}`}>
                    {line.counted_qty !== null ? line.counted_qty : "—"}
                  </span>
                ) : (
                  <div className="relative">
                    <input
                      type="number" min={0} step="any"
                      value={line.counted_qty !== null ? line.counted_qty : ""}
                      placeholder="—"
                      onChange={e => {
                        const v = e.target.value === "" ? null : parseFloat(e.target.value);
                        updateLine(line.id, { counted_qty: v });
                      }}
                      onBlur={e => {
                        const v = e.target.value === "" ? null : parseFloat(e.target.value);
                        saveLine(line.id, v, line.justification);
                      }}
                      className={`w-20 text-right rounded-xl px-2 py-1 text-sm font-semibold focus:outline-none border transition-colors ${
                        line.counted_qty !== null
                          ? diff !== 0
                            ? diff! > 0 ? "border-emerald-500/40 bg-emerald-500/8 text-emerald-400" : "border-red-500/40 bg-red-500/8 text-red-400"
                            : isDark ? "border-white/10 bg-white/[0.04] text-white/80" : "border-gray-200 bg-white text-gray-700"
                          : isDark ? "border-white/[0.08] bg-white/[0.04] text-white/50 placeholder:text-white/25" : "border-gray-200 bg-white text-gray-400"
                      }`}/>
                    {saving === line.id && (
                      <RefreshCw size={8} className={`absolute -right-3 top-1/2 -translate-y-1/2 animate-spin ${isDark ? "text-white/30" : "text-gray-300"}`}/>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-1 text-right">
                {diff !== null ? (
                  <span className="text-sm font-bold" style={{ color: diffColor }}>
                    {diff === 0 ? "=" : (diff > 0 ? "+" : "") + diff}
                  </span>
                ) : <span className={`text-xs ${isDark ? "text-white/20" : "text-gray-300"}`}>—</span>}
              </div>
              <div className="col-span-3">
                {isReadOnly ? (
                  <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{line.justification || ""}</span>
                ) : diff !== null && diff !== 0 ? (
                  <input
                    value={line.justification}
                    onChange={e => updateLine(line.id, { justification: e.target.value })}
                    onBlur={e => saveLine(line.id, line.counted_qty, e.target.value)}
                    placeholder="Motif de l'écart…"
                    className={`w-full rounded-lg px-2 py-1 text-xs focus:outline-none border ${isDark ? "bg-white/[0.04] border-white/[0.06] text-white/60 placeholder:text-white/20" : "bg-white border-gray-200 text-gray-600 placeholder:text-gray-300"}`}/>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className={`shrink-0 flex items-center gap-4 px-5 py-3 border-t text-xs ${isDark ? "border-white/[0.06] text-white/40" : "border-gray-200 text-gray-400"}`}>
        <span>{lines.length} produit{lines.length > 1 ? "s" : ""}</span>
        <span className={counted === lines.length ? "text-emerald-400 font-semibold" : ""}>{counted} comptés</span>
        {withDiff > 0 && <span style={{ color: "#f59e0b" }}>{withDiff} écart{withDiff > 1 ? "s" : ""}</span>}
        {withDiff > 0 && !isReadOnly && (
          <span className={isDark ? "text-white/30" : "text-gray-400"}>
            Valeur écart : {fmtEur(lines.filter(l => l.counted_qty !== null && l.counted_qty !== l.expected_qty)
              .reduce((s, l) => {
                const p = products.find(p => p.id === l.product_id);
                return s + Math.abs((l.counted_qty! - l.expected_qty) * (p?.purchase_price ?? 0));
              }, 0))}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main InventoryView ───────────────────────────────────────────────────────

export function InventoryView({ products, warehouses, userId, onSessionValidated }: {
  products: Product[];
  warehouses: Warehouse[];
  userId: string;
  onSessionValidated: () => Promise<void>;
}) {
  const [sessions, setSessions]         = useState<InventorySession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [activeLines, setActiveLines]   = useState<InventoryLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const { add: toast }  = useToastStack();
  const isDark = useDark();

  // Load sessions
  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_inventory_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) { toast(error.message, "error"); return; }
    setSessions((data ?? []) as InventorySession[]);
    setLoadingSessions(false);
  }, [userId, toast]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Open a session (load lines)
  async function openSession(session: InventorySession) {
    setLoadingLines(true);
    const { data, error } = await supabase
      .from("stock_inventory_lines")
      .select("*")
      .eq("session_id", session.id)
      .order("product_name");
    setLoadingLines(false);
    if (error) { toast(error.message, "error"); return; }
    setActiveLines((data ?? []) as InventoryLine[]);
    setActiveSession(session);
  }

  // Create + snapshot a new session
  async function handleCreate(name: string, warehouseId: string | null, notes: string) {
    // Insert session
    const { data: session, error: sErr } = await supabase
      .from("stock_inventory_sessions")
      .insert({ user_id: userId, name, warehouse_id: warehouseId, notes })
      .select()
      .single();
    if (sErr || !session) { toast(sErr?.message ?? "Erreur création", "error"); return; }

    // Snapshot: insert one line per active product (filtered by warehouse if set)
    const scope = warehouseId
      ? products.filter(p => p.is_active && p.warehouse_id === warehouseId)
      : products.filter(p => p.is_active);

    if (scope.length === 0) {
      toast("Aucun produit actif trouvé pour cet entrepôt", "info");
      await supabase.from("stock_inventory_sessions").update({ status: "annule" }).eq("id", session.id);
      return;
    }

    const lines = scope.map(p => ({
      session_id:   session.id,
      product_id:   p.id,
      product_name: p.name,
      sku:          p.sku ?? "",
      unit:         p.unit ?? "",
      expected_qty: p.stock_current,
    }));

    const { error: lErr } = await supabase.from("stock_inventory_lines").insert(lines);
    if (lErr) { toast(lErr.message, "error"); return; }

    setShowCreate(false);
    setSessions(prev => [session as InventorySession, ...prev]);
    await openSession(session as InventorySession);
    toast(`Session créée — ${scope.length} produits à compter`, "success");
  }

  // After validation: refresh sessions list + trigger products reload in parent
  async function handleValidated() {
    await loadSessions();
    await onSessionValidated();
    // Re-open in read-only mode to see the result
    const { data } = await supabase.from("stock_inventory_sessions").select("*").eq("id", activeSession!.id).single();
    if (data) setActiveSession(data as InventorySession);
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-600"}`}>
            {sessions.length} session{sessions.length > 1 ? "s" : ""} d&apos;inventaire
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>Comptage physique · Ajustements automatiques</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouvelle session
        </button>
      </div>

      {/* Sessions list */}
      {loadingSessions ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "12", border: `1px solid ${gold}20` }}>
            <ClipboardList size={24} style={{ color: gold }}/>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucune session d&apos;inventaire</p>
            <p className={`text-xs mt-1 ${isDark ? "text-white/25" : "text-gray-400"}`}>Créez une session pour démarrer un comptage physique</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: gold + "15", color: gold, border: `1px solid ${gold}30` }}>
            <Plus size={13}/> Première session
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const color = STATUS_COLOR[s.status];
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 border cursor-pointer transition-all ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}
                onClick={() => openSession(s)}>
                <div className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: color + "15", border: `1px solid ${color}25` }}>
                  <ClipboardList size={16} style={{ color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-sm font-semibold truncate ${isDark ? "text-white/90" : "text-gray-800"}`}>{s.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: color + "15", color, border: `1px solid ${color}25` }}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                    {fmtDateFr(s.created_at)}
                    {s.validated_at ? ` · Validé ${fmtDateFr(s.validated_at)}` : ""}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {s.status === "valide" && (
                    <button onClick={e => { e.stopPropagation(); openSession(s); }}
                      className={`flex items-center gap-1 text-xs font-semibold ${isDark ? "text-white/40" : "text-gray-400"}`}>
                      <FileText size={11}/> Rapport
                    </button>
                  )}
                  <ChevronRight size={14} className={isDark ? "text-white/25" : "text-gray-400"}/>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.15)" }}>
        <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: gold }}/>
        <p className={isDark ? "text-white/40" : "text-gray-500"}>
          La validation génère automatiquement des mouvements d&apos;ajustement pour chaque écart constaté et met à jour le stock en temps réel. Cette opération est irréversible.
        </p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateSessionModal warehouses={warehouses} onSave={handleCreate} onClose={() => setShowCreate(false)}/>
        )}
        {activeSession && !loadingLines && (
          <CountingOverlay
            session={activeSession}
            lines={activeLines}
            products={products}
            onClose={() => setActiveSession(null)}
            onValidated={handleValidated}/>
        )}
        {loadingLines && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <RefreshCw size={24} className="animate-spin text-white/60"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
