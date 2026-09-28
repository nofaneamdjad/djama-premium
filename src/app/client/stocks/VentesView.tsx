"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowDownCircle, RotateCcw, Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack } from "@/components/ui/ToastStack";
import type { Product } from "./types";
import { gold, ease } from "./constants";
import { useDark } from "./ui";
import { fmtEur } from "@/lib/format";

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface LinkedDocument {
  id: string;
  type: "facture" | "avoir";
  numero: string;
  statut: string;
  client_nom: string;
  total_ttc: number;
  date_document: string;
  stock_applied: boolean;
  items: LinkedItem[];
}

interface LinkedItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  stock_product_id: string | null;
  product_name?: string;
}

function fmtDateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── VentesView ───────────────────────────────────────────────────────────────

export function VentesView({ products, userId, onStockChanged }: {
  products: Product[];
  userId: string;
  onStockChanged: () => Promise<void>;
}) {
  const [documents, setDocuments]     = useState<LinkedDocument[]>([]);
  const [loading, setLoading]         = useState(true);
  const [applying, setApplying]       = useState<string | null>(null);
  const { add: toast }  = useToastStack();
  const isDark = useDark();

  const productMap = new Map(products.map(p => [p.id, p]));

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    // Fetch factures/avoirs that have at least one item with stock_product_id
    const { data: items, error: iErr } = await supabase
      .from("document_items")
      .select("id,document_id,description,quantity,unit_price,stock_product_id")
      .not("stock_product_id", "is", null)
      .eq("quantity", null) // workaround — select all items with stock_product_id
      .limit(0); // dummy — use below query instead

    void items; void iErr;

    // Real query: get document_ids that have linked items
    const { data: linkedItems, error: liErr } = await supabase
      .from("document_items")
      .select("id,document_id,description,quantity,unit_price,stock_product_id")
      .not("stock_product_id", "is", null);

    if (liErr) { toast(liErr.message, "error"); setLoading(false); return; }

    const docIds = [...new Set((linkedItems ?? []).map(i => i.document_id))];

    if (docIds.length === 0) { setDocuments([]); setLoading(false); return; }

    const { data: docs, error: dErr } = await supabase
      .from("documents")
      .select("id,type,numero,statut,client_nom,total_ttc,date_document,stock_applied")
      .in("id", docIds)
      .in("type", ["facture", "avoir"])
      .eq("user_id", userId)
      .order("date_document", { ascending: false })
      .limit(100);

    if (dErr) { toast(dErr.message, "error"); setLoading(false); return; }

    const grouped: LinkedDocument[] = (docs ?? []).map(d => ({
      ...d,
      items: (linkedItems ?? [])
        .filter(i => i.document_id === d.id)
        .map(i => ({ ...i, product_name: productMap.get(i.stock_product_id ?? "")?.name })),
    })) as LinkedDocument[];

    setDocuments(grouped);
    setLoading(false);
  }, [userId, productMap, toast]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  async function handleApply(docId: string) {
    setApplying(docId);
    const { data, error } = await supabase.rpc("apply_document_to_stock", { p_document_id: docId });
    setApplying(null);
    if (error) { toast(error.message, "error"); return; }
    const count = data as number;
    toast(`${count} mouvement${count > 1 ? "s" : ""} créé${count > 1 ? "s" : ""} · Stock mis à jour`, "success");
    await loadDocuments();
    await onStockChanged();
  }

  const pending  = documents.filter(d => !d.stock_applied);
  const applied  = documents.filter(d => d.stock_applied);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div>
        <h3 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-600"}`}>
          Factures &amp; avoirs liés au stock
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
          Générez des mouvements de stock depuis vos documents de vente.
          Liez un produit stock à chaque ligne dans le module Factures.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`}/>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "12", border: `1px solid ${gold}20` }}>
            <FileText size={24} style={{ color: gold }}/>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucune facture liée au stock</p>
            <p className={`text-xs mt-1 ${isDark ? "text-white/25" : "text-gray-400"}`}>
              Dans le module Factures, associez un produit stock à chaque ligne de facture pour activer cette vue.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending documents */}
          {pending.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>
                <AlertTriangle size={11}/> En attente d&apos;application ({pending.length})
              </h4>
              <div className="space-y-2">
                {pending.map(doc => (
                  <DocCard key={doc.id} doc={doc} applying={applying}
                    isDark={isDark} onApply={handleApply}/>
                ))}
              </div>
            </div>
          )}

          {/* Applied documents */}
          {applied.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${isDark ? "text-emerald-400/70" : "text-emerald-600"}`}>
                <CheckCircle2 size={11}/> Appliqués ({applied.length})
              </h4>
              <div className="space-y-2">
                {applied.map(doc => (
                  <DocCard key={doc.id} doc={doc} applying={null}
                    isDark={isDark} onApply={handleApply}/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(201,165,90,0.06)", border: "1px solid rgba(201,165,90,0.15)" }}>
        <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: gold }}/>
        <p className={isDark ? "text-white/40" : "text-gray-500"}>
          Une fois appliqué, un document ne peut pas être annulé automatiquement. Pour corriger une erreur, créez un mouvement manuel dans l&apos;onglet Mouvements.
        </p>
      </div>
    </div>
  );
}

function DocCard({ doc, applying, isDark, onApply }: {
  doc: LinkedDocument; applying: string | null; isDark: boolean;
  onApply: (id: string) => void;
}) {
  const isFacture = doc.type === "facture";
  const icon = isFacture ? ArrowDownCircle : RotateCcw;
  const color = isFacture ? "#ef4444" : "#10b981";
  const DocIcon = icon;

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className={`rounded-2xl border p-4 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style={{ background: color + "18" }}>
          <DocIcon size={15} style={{ color }}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-bold ${isDark ? "text-white/90" : "text-gray-800"}`}>
              {doc.type === "facture" ? "Facture" : "Avoir"} {doc.numero}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${doc.stock_applied ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
              {doc.stock_applied ? "Appliqué" : "En attente"}
            </span>
          </div>
          <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
            {doc.client_nom} · {fmtDateFr(doc.date_document)} · {fmtEur(doc.total_ttc)}
          </p>

          {/* Items list */}
          <div className="mt-2 space-y-1">
            {doc.items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <Package size={10} className={isDark ? "text-white/25 shrink-0" : "text-gray-300 shrink-0"}/>
                <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>
                  {item.product_name ?? item.description}
                </span>
                <span className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-gray-600"}`}>×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
        {!doc.stock_applied && (
          <button onClick={() => onApply(doc.id)} disabled={applying === doc.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all disabled:opacity-40"
            style={{ background: color + "18", color, border: `1px solid ${color}30` }}>
            {applying === doc.id
              ? <RefreshCw size={10} className="animate-spin"/>
              : isFacture ? <ArrowDownCircle size={10}/> : <RotateCcw size={10}/>}
            Appliquer
          </button>
        )}
      </div>
    </motion.div>
  );
}
