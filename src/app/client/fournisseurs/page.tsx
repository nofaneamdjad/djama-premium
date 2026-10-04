"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle, ShoppingCart, DollarSign,
  BarChart2, Truck, FileText, Download, Plus, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtEur } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";
import { useOrganization } from "@/lib/use-organization";

import type { Fournisseur, FOrder, FInvoice, FOrderItem } from "./types";
import { EMPTY_FOURN, EMPTY_ORDER, EMPTY_INVOICE, gold, violet, ease } from "./constants";
import { DarkCtx } from "./ui";
import { FournModal } from "./FournModal";
import { OrderModal } from "./OrderModal";
import { InvoiceModal } from "./InvoiceModal";
import { RatingModal } from "./RatingModal";
import { DashboardView } from "./DashboardView";
import { FournisseursView } from "./FournisseursView";
import { OrdersView } from "./OrdersView";
import { InvoicesView } from "./InvoicesView";

type Tab = "dashboard" | "list" | "orders" | "invoices";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard",    icon: BarChart2 },
  { key: "list",      label: "Fournisseurs", icon: Truck },
  { key: "orders",    label: "Commandes",    icon: ShoppingCart },
  { key: "invoices",  label: "Factures",     icon: FileText },
];

export default function FournisseursPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const router  = useRouter();
  const orgState = useOrganization();
  const orgId    = orgState.status === "ready" ? orgState.org.id : null;

  const [userId,  setUserId]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("dashboard");

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [orders,       setOrders]       = useState<FOrder[]>([]);
  const [invoices,     setInvoices]     = useState<FInvoice[]>([]);

  const [showFournModal,  setShowFournModal]  = useState(false);
  const [editFourn,       setEditFourn]       = useState<Partial<Fournisseur>>(EMPTY_FOURN());
  const [showOrderModal,  setShowOrderModal]  = useState(false);
  const [editOrder,       setEditOrder]       = useState<Partial<FOrder>>(EMPTY_ORDER());
  const [showInvModal,    setShowInvModal]    = useState(false);
  const [editInv,         setEditInv]         = useState<Partial<FInvoice>>(EMPTY_INVOICE());
  const [ratingFourn,     setRatingFourn]     = useState<Fournisseur | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteType,      setDeleteType]      = useState<"fourn" | "order" | "invoice">("fourn");
  const [deleting,        setDeleting]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (process.env.NODE_ENV !== "development") router.replace("/login"); return; }
        setUserId(user.id);
        const [fRes, oRes, iRes] = await Promise.all([
          supabase.from("fournisseurs").select("*").eq("user_id", user.id).order("company_name").limit(500),
          supabase.from("fournisseur_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
          supabase.from("fournisseur_invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        ]);
        if (!fRes.error && fRes.data) setFournisseurs(fRes.data as Fournisseur[]);
        if (!oRes.error && oRes.data) setOrders(oRes.data as FOrder[]);
        if (!iRes.error && iRes.data) setInvoices(iRes.data as FInvoice[]);
      } catch {
        toast("Erreur réseau — impossible de charger les fournisseurs", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFourn = useCallback(async (form: Partial<Fournisseur>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseurs").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setFournisseurs((prev) => prev.map((f) => f.id === form.id ? data as Fournisseur : f));
      toast("Fournisseur mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseurs").insert({ ...form, user_id: userId, organization_id: orgId ?? null }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setFournisseurs((prev) => [...prev, data as Fournisseur].sort((a, b) => a.company_name.localeCompare(b.company_name)));
      toast("Fournisseur créé", "success");
    }
    setShowFournModal(false);
    setEditFourn(EMPTY_FOURN());
  }, [userId, orgId, toast]);

  const saveOrder = useCallback(async (form: Partial<FOrder>, items: FOrderItem[]) => {
    if (!userId) return;
    let orderId = form.id;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_orders").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setOrders((prev) => prev.map((o) => o.id === form.id ? data as FOrder : o));
      toast("Commande mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_orders").insert({ ...form, user_id: userId, organization_id: orgId ?? null }).select().single();
      if (error) { toast(error.message, "error"); return; }
      orderId = (data as FOrder).id;
      setOrders((prev) => [data as FOrder, ...prev]);
      toast("Commande créée", "success");
      if (form.fournisseur_id) {
        const f = fournisseurs.find((f) => f.id === form.fournisseur_id);
        if (f) await supabase.from("fournisseurs").update({ total_orders: (f.total_orders ?? 0) + 1 }).eq("id", f.id);
      }
    }
    if (orderId && items.length > 0) {
      await supabase.from("fournisseur_order_items").delete().eq("order_id", orderId);
      const rows = items.filter((it) => it.name.trim()).map((it) => ({ ...it, order_id: orderId, id: undefined }));
      if (rows.length > 0) await supabase.from("fournisseur_order_items").insert(rows);
    } else if (orderId && items.length === 0 && form.id) {
      await supabase.from("fournisseur_order_items").delete().eq("order_id", orderId);
    }
    setShowOrderModal(false);
    setEditOrder(EMPTY_ORDER());
  }, [userId, orgId, toast, fournisseurs]);

  const saveInvoice = useCallback(async (form: Partial<FInvoice>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_invoices").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => prev.map((i) => i.id === form.id ? data as FInvoice : i));
      toast("Facture mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_invoices").insert({ ...form, user_id: userId, organization_id: orgId ?? null }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => [data as FInvoice, ...prev]);
      toast("Facture créée", "success");
    }
    setShowInvModal(false);
    setEditInv(EMPTY_INVOICE());
  }, [userId, orgId, toast]);

  const saveRating = useCallback(async (r: { reliability: number; quality: number; price: number; delays: number; comment: string }) => {
    if (!userId || !ratingFourn) return;
    const { error: insErr } = await supabase.from("fournisseur_ratings").insert({ ...r, user_id: userId, fournisseur_id: ratingFourn.id, organization_id: orgId ?? null });
    if (insErr) { toast("Erreur enregistrement évaluation", "error"); return; }
    const { data: ratings } = await supabase.from("fournisseur_ratings").select("reliability,quality,price,delays").eq("fournisseur_id", ratingFourn.id);
    if (ratings && ratings.length > 0) {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const upd = {
        score_reliability: avg(ratings.map((r) => r.reliability)),
        score_quality:     avg(ratings.map((r) => r.quality)),
        score_price:       avg(ratings.map((r) => r.price)),
        score_delays:      avg(ratings.map((r) => r.delays)),
      };
      const { data } = await supabase.from("fournisseurs").update(upd).eq("id", ratingFourn.id).select().single();
      if (data) setFournisseurs((prev) => prev.map((f) => f.id === ratingFourn.id ? data as Fournisseur : f));
    }
    toast("Évaluation enregistrée", "success");
    setRatingFourn(null);
  }, [userId, orgId, ratingFourn, toast]);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const table = deleteType === "fourn" ? "fournisseurs" : deleteType === "order" ? "fournisseur_orders" : "fournisseur_invoices";
    const { error } = await supabase.from(table).delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (error) { toast(error.message, "error"); return; }
    if (deleteType === "fourn") setFournisseurs((prev) => prev.filter((f) => f.id !== confirmDeleteId));
    else if (deleteType === "order") setOrders((prev) => prev.filter((o) => o.id !== confirmDeleteId));
    else setInvoices((prev) => prev.filter((i) => i.id !== confirmDeleteId));
    toast("Supprimé", "info");
  }, [confirmDeleteId, deleteType, toast]);

  const exportCSV = useCallback(() => {
    const rows = [
      ["Entreprise","Contact","Email","Téléphone","Catégorie","Paiement","Score"].join(";"),
      ...fournisseurs.map((f) => [
        f.company_name, f.contact_name, f.email, f.phone, f.category, f.payment_terms,
        ((f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4).toFixed(1),
      ].join(";")),
    ];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "fournisseurs.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [fournisseurs]);

  const kpiStrip = [
    { label: "Total",      value: fournisseurs.length,                                                               icon: Building2,   onClick: () => setTab("list") },
    { label: "Actifs",     value: fournisseurs.filter((f) => f.is_active).length,                                   icon: CheckCircle, onClick: () => setTab("list") },
    { label: "Commandes",  value: orders.filter((o) => !["received","cancelled"].includes(o.status)).length,        icon: ShoppingCart, onClick: () => setTab("orders") },
    { label: "Montant dû", value: fmtEur(invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0)), icon: DollarSign, onClick: () => setTab("invoices") },
  ];

  return (
    <DarkCtx.Provider value={isDark}>
      <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>
        <ToastStack toasts={toasts} remove={removeToast}/>

        {/* Header */}
        <div className="relative overflow-hidden shrink-0 sticky top-0 z-10"
          style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#ffffff,#f8fafc,#ffffff)" }}>
          <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
          <div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }}/>

          <div className="relative px-5 pt-4 pb-3 sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <h1 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Fournisseurs</h1>
                <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>Fiches · Commandes · Factures · Évaluation</p>
              </motion.div>
              <div className="flex items-center gap-2">
                <button onClick={exportCSV} title="Exporter CSV"
                  className={`h-8 flex items-center gap-1.5 px-3 rounded-xl border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                  <Download size={13}/>
                  <span className="hidden sm:inline text-xs font-semibold">Exporter</span>
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                  style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                  <Plus size={13}/> Nouveau fournisseur
                </motion.button>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="relative px-5 pb-3 sm:px-8">
            <div className="mx-auto max-w-7xl grid grid-cols-4 gap-2">
              {kpiStrip.map((kpi, i) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.button key={kpi.label} onClick={kpi.onClick}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 border cursor-pointer transition-all text-left ${isDark ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                    <KpiIcon size={13} style={{ color: gold }} className="shrink-0"/>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-none truncate ${isDark ? "text-white" : "text-gray-800"}`}>{kpi.value}</p>
                      <p className={`text-[11px] uppercase tracking-wide mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="relative px-5 sm:px-8 flex gap-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab === key ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}`}>
                <Icon size={12}/>
                {label}
                {key === "invoices" && invoices.filter((i) => i.status !== "paid").length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: gold + "30", color: gold }}>
                    {invoices.filter((i) => i.status !== "paid").length}
                  </span>
                )}
                {tab === key && (
                  <motion.div layoutId="fourn-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: gold }}/>
                )}
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: isDark ? "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" : "linear-gradient(90deg,transparent,rgba(201,165,90,0.3),transparent)" }}/>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw size={22} className={`animate-spin ${isDark ? "text-white/30" : "text-gray-300"}`}/>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab === "dashboard" && (
              <DashboardView fournisseurs={fournisseurs} orders={orders} invoices={invoices}
                onNew={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }}
                onNewOrder={() => { setEditOrder(EMPTY_ORDER()); setShowOrderModal(true); }}
                onNewInvoice={() => { setEditInv(EMPTY_INVOICE()); setShowInvModal(true); }}/>
            )}
            {tab === "list" && (
              <FournisseursView fournisseurs={fournisseurs} orders={orders} invoices={invoices}
                onNew={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }}
                onEdit={(f) => { setEditFourn(f); setShowFournModal(true); }}
                onDelete={(id) => { setDeleteType("fourn"); setConfirmDeleteId(id); }}
                onRate={(f) => setRatingFourn(f)}
                onDetail={(f) => router.push(`/client/fournisseurs/${f.id}`)}/>
            )}
            {tab === "orders" && (
              <OrdersView orders={orders} fournisseurs={fournisseurs}
                onNew={() => { setEditOrder(EMPTY_ORDER()); setShowOrderModal(true); }}
                onEdit={(o) => { setEditOrder(o); setShowOrderModal(true); }}
                onDelete={(id) => { setDeleteType("order"); setConfirmDeleteId(id); }}/>
            )}
            {tab === "invoices" && (
              <InvoicesView invoices={invoices} fournisseurs={fournisseurs}
                onNew={() => { setEditInv(EMPTY_INVOICE()); setShowInvModal(true); }}
                onEdit={(i) => { setEditInv(i); setShowInvModal(true); }}
                onDelete={(id) => { setDeleteType("invoice"); setConfirmDeleteId(id); }}/>
            )}
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showFournModal && (
            <FournModal data={editFourn} onSave={saveFourn}
              onClose={() => { setShowFournModal(false); setEditFourn(EMPTY_FOURN()); }}/>
          )}
          {showOrderModal && (
            <OrderModal fournisseurs={fournisseurs} order={editOrder} onSave={saveOrder}
              onClose={() => { setShowOrderModal(false); setEditOrder(EMPTY_ORDER()); }}/>
          )}
          {showInvModal && (
            <InvoiceModal fournisseurs={fournisseurs} invoice={editInv} onSave={saveInvoice}
              onClose={() => { setShowInvModal(false); setEditInv(EMPTY_INVOICE()); }}/>
          )}
          {ratingFourn && (
            <RatingModal fournisseur={ratingFourn} onSave={saveRating}
              onClose={() => setRatingFourn(null)}/>
          )}
        </AnimatePresence>

        <ConfirmModal open={confirmDeleteId !== null}
          title={`Supprimer ${deleteType === "fourn" ? "ce fournisseur" : deleteType === "order" ? "cette commande" : "cette facture"} ?`}
          description="Cette action est irréversible."
          confirmLabel="Supprimer" loading={deleting}
          onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}/>
      </div>
    </DarkCtx.Provider>
  );
}
