"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, CreditCard,
  ShoppingCart, FileText, Star, Clock, Edit2, Plus,
  AlertTriangle, CheckCircle, Package, TrendingUp, DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { fmtDate, fmtEur } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";

import type { Fournisseur, FOrder, FInvoice, FRating, CatalogItem } from "../types";
import { CATEGORIES, ORDER_STATUS, INV_STATUS, violet, gold } from "../constants";
import { DarkCtx, Stars, selStyle } from "../ui";
import { FournModal } from "../FournModal";
import { OrderModal } from "../OrderModal";
import { InvoiceModal } from "../InvoiceModal";
import { RatingModal } from "../RatingModal";
import { EMPTY_FOURN, EMPTY_ORDER, EMPTY_INVOICE } from "../constants";
import type { FOrderItem } from "../types";

type Tab = "overview" | "orders" | "invoices" | "catalog" | "ratings" | "activity";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview",  label: "Vue d'ensemble", icon: Building2 },
  { key: "orders",    label: "Commandes",       icon: ShoppingCart },
  { key: "invoices",  label: "Factures",        icon: FileText },
  { key: "catalog",   label: "Catalogue",       icon: Package },
  { key: "ratings",   label: "Évaluations",     icon: Star },
  { key: "activity",  label: "Activité",        icon: Clock },
];

export default function FournisseurDetailPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [fourn,    setFourn]    = useState<Fournisseur | null>(null);
  const [orders,   setOrders]   = useState<FOrder[]>([]);
  const [invoices, setInvoices] = useState<FInvoice[]>([]);
  const [catalog,  setCatalog]  = useState<CatalogItem[]>([]);
  const [ratings,  setRatings]  = useState<FRating[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("overview");

  const [showEdit,    setShowEdit]    = useState(false);
  const [showOrder,   setShowOrder]   = useState(false);
  const [showInv,     setShowInv]     = useState(false);
  const [showRating,  setShowRating]  = useState(false);
  const [editOrder,   setEditOrder]   = useState<Partial<FOrder>>(EMPTY_ORDER());
  const [editInv,     setEditInv]     = useState<Partial<FInvoice>>(EMPTY_INVOICE());

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fRes, oRes, iRes, cRes, rRes] = await Promise.all([
        supabase.from("fournisseurs").select("*").eq("id", id).single(),
        supabase.from("fournisseur_orders").select("*").eq("fournisseur_id", id).order("created_at", { ascending: false }),
        supabase.from("fournisseur_invoices").select("*").eq("fournisseur_id", id).order("created_at", { ascending: false }),
        supabase.from("catalog_items").select("*").eq("fournisseur_id", id).order("name"),
        supabase.from("fournisseur_ratings").select("*").eq("fournisseur_id", id).order("created_at", { ascending: false }),
      ]);
      if (fRes.data) setFourn(fRes.data as Fournisseur);
      else { toast("Fournisseur introuvable", "error"); router.replace("/client/fournisseurs"); return; }
      if (oRes.data) setOrders(oRes.data as FOrder[]);
      if (iRes.data) setInvoices(iRes.data as FInvoice[]);
      if (cRes.data) setCatalog(cRes.data as CatalogItem[]);
      if (rRes.data) setRatings(rRes.data as FRating[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveFourn = useCallback(async (form: Partial<Fournisseur>) => {
    if (!form.id) return;
    const { data, error } = await supabase.from("fournisseurs").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
    if (error) { toast(error.message, "error"); return; }
    setFourn(data as Fournisseur);
    toast("Fournisseur mis à jour", "success");
    setShowEdit(false);
  }, [toast]);

  const saveOrder = useCallback(async (form: Partial<FOrder>, items: FOrderItem[]) => {
    if (!fourn) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let orderId = form.id;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_orders").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setOrders((prev) => prev.map((o) => o.id === form.id ? data as FOrder : o));
      toast("Commande mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_orders").insert({ ...form, user_id: user.id, fournisseur_id: fourn.id, fournisseur_name: fourn.company_name }).select().single();
      if (error) { toast(error.message, "error"); return; }
      orderId = (data as FOrder).id;
      setOrders((prev) => [data as FOrder, ...prev]);
      toast("Commande créée", "success");
    }
    if (orderId && items.length > 0) {
      await supabase.from("fournisseur_order_items").delete().eq("order_id", orderId);
      const rows = items.filter((it) => it.name.trim()).map((it) => ({ ...it, order_id: orderId, id: undefined }));
      if (rows.length > 0) await supabase.from("fournisseur_order_items").insert(rows);
    }
    setShowOrder(false);
    setEditOrder(EMPTY_ORDER());
  }, [fourn, toast]);

  const saveInvoice = useCallback(async (form: Partial<FInvoice>) => {
    if (!fourn) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_invoices").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => prev.map((i) => i.id === form.id ? data as FInvoice : i));
      toast("Facture mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_invoices").insert({ ...form, user_id: user.id, fournisseur_id: fourn.id, fournisseur_name: fourn.company_name }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => [data as FInvoice, ...prev]);
      toast("Facture créée", "success");
    }
    setShowInv(false);
    setEditInv(EMPTY_INVOICE());
  }, [fourn, toast]);

  const saveRating = useCallback(async (r: { reliability: number; quality: number; price: number; delays: number; comment: string }) => {
    if (!fourn) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newR, error } = await supabase.from("fournisseur_ratings").insert({ ...r, user_id: user.id, fournisseur_id: fourn.id }).select().single();
    if (error) { toast("Erreur enregistrement", "error"); return; }
    setRatings((prev) => [newR as FRating, ...prev]);
    const allR = [newR as FRating, ...ratings];
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const upd = {
      score_reliability: avg(allR.map((r) => r.reliability)),
      score_quality:     avg(allR.map((r) => r.quality)),
      score_price:       avg(allR.map((r) => r.price)),
      score_delays:      avg(allR.map((r) => r.delays)),
    };
    const { data: updFourn } = await supabase.from("fournisseurs").update(upd).eq("id", fourn.id).select().single();
    if (updFourn) setFourn(updFourn as Fournisseur);
    toast("Évaluation enregistrée", "success");
    setShowRating(false);
  }, [fourn, ratings, toast]);

  const score = fourn && fourn.score_reliability > 0
    ? (fourn.score_reliability + fourn.score_quality + fourn.score_price + fourn.score_delays) / 4
    : null;
  const cat = fourn ? CATEGORIES.find((c) => c.value === fourn.category) : null;
  const today = new Date().toISOString().split("T")[0];
  const totalDue = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
  const activeOrders = orders.filter((o) => !["received","cancelled"].includes(o.status)).length;

  const row = `px-4 py-2 flex items-start gap-3 border-b ${isDark ? "border-white/[0.04]" : "border-gray-100"}`;
  const lbl = `text-[10px] uppercase tracking-wide shrink-0 w-28 pt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`;
  const val = `text-xs ${isDark ? "text-white/70" : "text-gray-600"}`;

  return (
    <DarkCtx.Provider value={isDark}>
      <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>
        <ToastStack toasts={toasts} remove={removeToast}/>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Chargement…</div>
          </div>
        ) : fourn ? (
          <>
            {/* Header */}
            <div className={`sticky top-0 z-10 shrink-0 ${isDark ? "bg-[#07080e] border-b border-white/[0.06]" : "bg-white border-b border-gray-200"}`}>
              <div className="px-5 pt-3 pb-0 sm:px-8">
                <div className="mx-auto max-w-7xl">
                  {/* Back + title row */}
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => router.back()}
                      className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all ${isDark ? "border-white/[0.08] text-white/40 hover:text-white hover:border-white/20" : "border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300"}`}>
                      <ArrowLeft size={14}/>
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold shrink-0"
                        style={{ background: violet + "18", color: violet, border: `1px solid ${violet}30` }}>
                        {fourn.company_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h1 className={`text-base font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{fourn.company_name}</h1>
                        <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>
                          {cat?.label}
                          {fourn.city && <><span>·</span>{fourn.city}</>}
                          {fourn.country && fourn.country !== "France" && <><span>·</span>{fourn.country}</>}
                          {score !== null && <><span>·</span><Stars value={Math.round(score)}/><span style={{ color: score >= 4 ? "#10b981" : score >= 3 ? violet : "#f97316" }}>{score.toFixed(1)}/5</span></>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setShowRating(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                        <Star size={11}/> Évaluer
                      </button>
                      <button onClick={() => setShowEdit(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                        <Edit2 size={11}/> Modifier
                      </button>
                    </div>
                  </div>

                  {/* KPI mini-strip */}
                  <div className="flex gap-4 mb-0">
                    {[
                      { label: "Commandes",  value: orders.length,    icon: ShoppingCart, color: "#3b82f6" },
                      { label: "En cours",   value: activeOrders,     icon: TrendingUp,   color: violet },
                      { label: "Montant dû", value: fmtEur(totalDue), icon: DollarSign,   color: "#f97316", str: true },
                      { label: "Évaluations", value: ratings.length,  icon: Star,         color: gold },
                    ].map((k) => (
                      <div key={k.label} className="flex items-center gap-1.5 py-2.5">
                        <k.icon size={12} style={{ color: k.color }}/>
                        <span className={`text-xs font-bold ${isDark ? "text-white/60" : "text-gray-600"}`}>{k.value}</span>
                        <span className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{k.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-0.5">
                    {TABS.map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setTab(key)}
                        className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all ${tab === key ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}`}>
                        <Icon size={11}/>
                        {label}
                        {tab === key && (
                          <motion.div layoutId="detail-tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                            style={{ background: gold }}/>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
                <AnimatePresence mode="wait">
                  {tab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Coordonnées */}
                      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                        <div className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b ${isDark ? "text-white/35 border-white/[0.06]" : "text-gray-400 border-gray-200"}`}>Coordonnées</div>
                        {fourn.contact_name && <div className={row}><span className={lbl}>Contact</span><span className={val}>{fourn.contact_name}</span></div>}
                        {fourn.email && <div className={row}><span className={lbl}><Mail size={10} className="inline mr-1"/>Email</span><a href={`mailto:${fourn.email}`} className="text-xs text-blue-400 hover:underline">{fourn.email}</a></div>}
                        {fourn.phone && <div className={row}><span className={lbl}><Phone size={10} className="inline mr-1"/>Téléphone</span><span className={val}>{fourn.phone}</span></div>}
                        {fourn.website && <div className={row}><span className={lbl}><Globe size={10} className="inline mr-1"/>Site web</span><a href={fourn.website} target="_blank" rel="noopener" className="text-xs text-blue-400 hover:underline truncate">{fourn.website}</a></div>}
                        {(fourn.address || fourn.city) && <div className={row}><span className={lbl}><MapPin size={10} className="inline mr-1"/>Adresse</span><span className={val}>{[fourn.address, fourn.city, fourn.country].filter(Boolean).join(", ")}</span></div>}
                      </div>

                      {/* Infos légales & financières */}
                      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                        <div className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b ${isDark ? "text-white/35 border-white/[0.06]" : "text-gray-400 border-gray-200"}`}>Légal & Finance</div>
                        {fourn.siret && <div className={row}><span className={lbl}>SIRET</span><span className={`${val} font-mono`}>{fourn.siret}</span></div>}
                        {fourn.vat_number && <div className={row}><span className={lbl}>N° TVA</span><span className={`${val} font-mono`}>{fourn.vat_number}</span></div>}
                        {fourn.iban && <div className={row}><span className={lbl}><CreditCard size={10} className="inline mr-1"/>IBAN</span><span className={`${val} font-mono`}>{fourn.iban}</span></div>}
                        <div className={row}><span className={lbl}>Paiement</span><span className={val}>{fourn.payment_method} · {fourn.payment_terms}</span></div>
                        <div className={row}><span className={lbl}>Devise</span><span className={val}>{fourn.currency}</span></div>
                        {(fourn.credit_limit ?? 0) > 0 && <div className={row}><span className={lbl}>Plafond crédit</span><span className={val}>{fmtEur(fourn.credit_limit)}</span></div>}
                        {fourn.contract_expires_at && (
                          <div className={row}>
                            <span className={lbl}>Contrat expire</span>
                            <span className={`${val} ${fourn.contract_expires_at <= today ? "text-red-400 font-semibold" : ""}`}>{fmtDate(fourn.contract_expires_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Scores */}
                      {score !== null && (
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                          <div className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b ${isDark ? "text-white/35 border-white/[0.06]" : "text-gray-400 border-gray-200"}`}>
                            Score moyen · {score.toFixed(1)}/5
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-4">
                            {[
                              { label: "Fiabilité",    value: fourn.score_reliability },
                              { label: "Qualité",      value: fourn.score_quality },
                              { label: "Prix",         value: fourn.score_price },
                              { label: "Délais",       value: fourn.score_delays },
                            ].map((s) => (
                              <div key={s.label}>
                                <p className={`text-[10px] mb-1 ${isDark ? "text-white/35" : "text-gray-400"}`}>{s.label}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                                    <div className="h-full rounded-full" style={{ width: `${(s.value / 5) * 100}%`, background: s.value >= 4 ? "#10b981" : s.value >= 3 ? violet : "#f97316" }}/>
                                  </div>
                                  <span className="text-xs font-bold" style={{ color: s.value >= 4 ? "#10b981" : s.value >= 3 ? violet : "#f97316" }}>{s.value.toFixed(1)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {fourn.notes && (
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                          <div className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b ${isDark ? "text-white/35 border-white/[0.06]" : "text-gray-400 border-gray-200"}`}>Notes</div>
                          <p className={`px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${isDark ? "text-white/50" : "text-gray-600"}`}>{fourn.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === "orders" && (
                    <motion.div key="orders" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>{orders.length} commande{orders.length !== 1 ? "s" : ""}</h2>
                        <button onClick={() => { setEditOrder({ ...EMPTY_ORDER(), fournisseur_id: fourn.id, fournisseur_name: fourn.company_name }); setShowOrder(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                          <Plus size={11}/> Nouvelle commande
                        </button>
                      </div>
                      {orders.length === 0 ? (
                        <div className={`flex flex-col items-center gap-3 py-16 rounded-2xl border ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <ShoppingCart size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
                          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune commande pour ce fournisseur</p>
                        </div>
                      ) : (
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <table className="w-full border-collapse">
                            <thead className={isDark ? "bg-white/[0.03]" : "bg-gray-50"}>
                              <tr className={isDark ? "border-b border-white/[0.06]" : "border-b border-gray-200"}>
                                {["N° commande","Statut","Date","Livraison prévue","Montant TTC","Actions"].map((h) => (
                                  <th key={h} className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((o) => {
                                const s = ORDER_STATUS[o.status];
                                const isLate = o.expected_date && o.expected_date < today && !["received","cancelled"].includes(o.status);
                                return (
                                  <tr key={o.id} className={`border-b last:border-0 transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.025]" : "border-gray-100 hover:bg-gray-50"}`}>
                                    <td className="px-4 py-3 text-xs font-mono">{o.order_number}</td>
                                    <td className="px-4 py-3 text-xs">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                                      {isLate && <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400"><AlertTriangle size={8}/>Retard</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtDate(o.order_date)}</td>
                                    <td className={`px-4 py-3 text-xs ${isLate ? "text-red-400 font-semibold" : isDark ? "text-white/50" : "text-gray-500"}`}>
                                      {o.expected_date ? fmtDate(o.expected_date) : "—"}
                                    </td>
                                    <td className={`px-4 py-3 text-xs font-bold tabular-nums ${isDark ? "text-white/75" : "text-gray-700"}`}>{fmtEur(o.total_amount)}</td>
                                    <td className="px-4 py-3 text-xs">
                                      <button onClick={() => { setEditOrder(o); setShowOrder(true); }}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${isDark ? "hover:bg-white/[0.08] text-white/40 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
                                        <Edit2 size={10}/> Modifier
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === "invoices" && (
                    <motion.div key="invoices" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h2 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>{invoices.length} facture{invoices.length !== 1 ? "s" : ""}</h2>
                          {totalDue > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-400 px-2 py-0.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                              <AlertTriangle size={10}/>{fmtEur(totalDue)} à payer
                            </span>
                          )}
                        </div>
                        <button onClick={() => { setEditInv({ ...EMPTY_INVOICE(), fournisseur_id: fourn.id, fournisseur_name: fourn.company_name }); setShowInv(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                          <Plus size={11}/> Nouvelle facture
                        </button>
                      </div>
                      {invoices.length === 0 ? (
                        <div className={`flex flex-col items-center gap-3 py-16 rounded-2xl border ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <FileText size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
                          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune facture pour ce fournisseur</p>
                        </div>
                      ) : (
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <table className="w-full border-collapse">
                            <thead className={isDark ? "bg-white/[0.03]" : "bg-gray-50"}>
                              <tr className={isDark ? "border-b border-white/[0.06]" : "border-b border-gray-200"}>
                                {["N° facture","Statut","Émission","Échéance","Montant TTC","Restant","Actions"].map((h) => (
                                  <th key={h} className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {invoices.map((inv) => {
                                const s = INV_STATUS[inv.status];
                                const remaining = inv.total_amount - inv.paid_amount;
                                const overdue = inv.due_date && inv.due_date < today && inv.status !== "paid";
                                return (
                                  <tr key={inv.id} className={`border-b last:border-0 transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.025]" : "border-gray-100 hover:bg-gray-50"}`}>
                                    <td className={`px-4 py-3 text-xs font-mono ${isDark ? "text-white/60" : "text-gray-600"}`}>{inv.invoice_number || "—"}</td>
                                    <td className="px-4 py-3 text-xs">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                                      {overdue && <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400"><AlertTriangle size={8}/>Échue</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtDate(inv.issue_date)}</td>
                                    <td className={`px-4 py-3 text-xs ${overdue ? "text-red-400 font-semibold" : isDark ? "text-white/50" : "text-gray-500"}`}>
                                      {inv.due_date ? fmtDate(inv.due_date) : "—"}
                                    </td>
                                    <td className={`px-4 py-3 text-xs font-bold tabular-nums ${isDark ? "text-white/75" : "text-gray-700"}`}>{fmtEur(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-xs tabular-nums">
                                      {remaining <= 0
                                        ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10}/>Soldé</span>
                                        : <span className="text-orange-400 font-semibold">{fmtEur(remaining)}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      <button onClick={() => { setEditInv(inv); setShowInv(true); }}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${isDark ? "hover:bg-white/[0.08] text-white/40 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
                                        <Edit2 size={10}/> Modifier
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === "catalog" && (
                    <motion.div key="catalog" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>{catalog.length} article{catalog.length !== 1 ? "s" : ""}</h2>
                      </div>
                      {catalog.length === 0 ? (
                        <div className={`flex flex-col items-center gap-3 py-16 rounded-2xl border ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <Package size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
                          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun article dans le catalogue</p>
                        </div>
                      ) : (
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <table className="w-full border-collapse">
                            <thead className={isDark ? "bg-white/[0.03]" : "bg-gray-50"}>
                              <tr className={isDark ? "border-b border-white/[0.06]" : "border-b border-gray-200"}>
                                {["Article","Référence","Catégorie","Unité","Prix unitaire","Délai"].map((h) => (
                                  <th key={h} className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {catalog.map((item) => (
                                <tr key={item.id} className={`border-b last:border-0 ${isDark ? "border-white/[0.04] hover:bg-white/[0.025]" : "border-gray-100 hover:bg-gray-50"}`}>
                                  <td className={`px-4 py-3 text-xs font-semibold ${isDark ? "text-white/80" : "text-gray-800"}`}>{item.name}</td>
                                  <td className={`px-4 py-3 text-xs font-mono ${isDark ? "text-white/40" : "text-gray-400"}`}>{item.reference || "—"}</td>
                                  <td className={`px-4 py-3 text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{item.category || "—"}</td>
                                  <td className={`px-4 py-3 text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{item.unit || "—"}</td>
                                  <td className={`px-4 py-3 text-xs font-bold tabular-nums ${isDark ? "text-white/75" : "text-gray-700"}`}>{fmtEur(item.unit_price)}</td>
                                  <td className={`px-4 py-3 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{item.lead_time_days ? `${item.lead_time_days} j` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === "ratings" && (
                    <motion.div key="ratings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-sm font-bold ${isDark ? "text-white/70" : "text-gray-700"}`}>{ratings.length} évaluation{ratings.length !== 1 ? "s" : ""}</h2>
                        <button onClick={() => setShowRating(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                          <Star size={11}/> Évaluer
                        </button>
                      </div>
                      {ratings.length === 0 ? (
                        <div className={`flex flex-col items-center gap-3 py-16 rounded-2xl border ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <Star size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
                          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune évaluation — soyez le premier à noter</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {ratings.map((r) => (
                            <div key={r.id} className={`rounded-2xl border p-4 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                              <div className="flex items-center justify-between mb-3">
                                <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{fmtDate(r.created_at)}</p>
                                <Stars value={Math.round((r.reliability + r.quality + r.price + r.delays) / 4)}/>
                              </div>
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                {[["Fiabilité", r.reliability], ["Qualité", r.quality], ["Prix", r.price], ["Délais", r.delays]].map(([label, val]) => (
                                  <div key={label as string}>
                                    <p className={`text-[10px] mb-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{label}</p>
                                    <p className="text-sm font-bold" style={{ color: (val as number) >= 4 ? "#10b981" : (val as number) >= 3 ? violet : "#f97316" }}>{val}/5</p>
                                  </div>
                                ))}
                              </div>
                              {r.comment && <p className={`text-xs leading-relaxed ${isDark ? "text-white/50" : "text-gray-600"}`}>{r.comment}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {tab === "activity" && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="space-y-1">
                        {[
                          ...orders.map((o) => ({ date: o.created_at, type: "order" as const, label: `Commande créée : ${o.order_number}`, sub: fmtEur(o.total_amount), color: "#3b82f6" })),
                          ...invoices.map((i) => ({ date: i.created_at, type: "invoice" as const, label: `Facture : ${i.invoice_number || "N° non défini"}`, sub: fmtEur(i.total_amount), color: "#f97316" })),
                          ...ratings.map((r) => ({ date: r.created_at, type: "rating" as const, label: `Évaluation : ${((r.reliability + r.quality + r.price + r.delays) / 4).toFixed(1)}/5`, sub: r.comment?.slice(0, 60) || "", color: gold })),
                          { date: fourn.created_at, type: "created" as const, label: "Fournisseur ajouté", sub: fourn.company_name, color: violet },
                        ]
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((ev, i) => (
                            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}>
                              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: ev.color + "18", border: `1px solid ${ev.color}30` }}>
                                <div className="h-2 w-2 rounded-full" style={{ background: ev.color }}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{ev.label}</p>
                                {ev.sub && <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{ev.sub}</p>}
                              </div>
                              <p className={`text-[10px] shrink-0 ${isDark ? "text-white/25" : "text-gray-400"}`}>{fmtDate(ev.date)}</p>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : null}

        {/* Modals */}
        <AnimatePresence>
          {showEdit && fourn && (
            <FournModal data={fourn} onSave={saveFourn} onClose={() => setShowEdit(false)}/>
          )}
          {showOrder && fourn && (
            <OrderModal fournisseurs={[fourn]} order={editOrder} onSave={saveOrder}
              onClose={() => { setShowOrder(false); setEditOrder(EMPTY_ORDER()); }}/>
          )}
          {showInv && fourn && (
            <InvoiceModal fournisseurs={[fourn]} invoice={editInv} onSave={saveInvoice}
              onClose={() => { setShowInv(false); setEditInv(EMPTY_INVOICE()); }}/>
          )}
          {showRating && fourn && (
            <RatingModal fournisseur={fourn} onSave={saveRating} onClose={() => setShowRating(false)}/>
          )}
        </AnimatePresence>
      </div>
    </DarkCtx.Provider>
  );
}
