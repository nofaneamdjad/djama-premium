"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, X, Loader2, Trash2, Check, CheckCircle,
  Calendar, DollarSign, Clock, MessageSquare, Building2,
  ChevronDown, ChevronUp, Star, Award, XCircle,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type {
  VendorQuoteRequest, VendorQuoteResponse, QuoteStatus, ResponseStatus, Vendor,
} from "@/lib/vendors/types";
import { QUOTE_STATUS_LABELS } from "@/lib/vendors/types";

const ease = [0.22, 1, 0.36, 1] as const;

const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  ouvert:   "#6366f1",
  attribue: "#10b981",
  ferme:    "#6b7280",
  annule:   "#ef4444",
};

const RESP_STATUS_COLORS: Record<ResponseStatus, string> = {
  recu:    "#6366f1",
  retenu:  "#10b981",
  rejete:  "#6b7280",
};

const RESP_STATUS_LABELS: Record<ResponseStatus, string> = {
  recu:   "Reçu",
  retenu: "Retenu",
  rejete: "Rejeté",
};

interface ResponseFormState {
  vendor_id: string;
  amount: string;
  currency: string;
  delivery_days: string;
  validity_date: string;
  description: string;
  notes: string;
}

const EMPTY_RESP: ResponseFormState = {
  vendor_id: "", amount: "", currency: "EUR",
  delivery_days: "", validity_date: "", description: "", notes: "",
};

export default function DevisDetailPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest]     = useState<VendorQuoteRequest | null>(null);
  const [responses, setResponses] = useState<VendorQuoteResponse[]>([]);
  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [respModal, setRespModal]   = useState(false);
  const [respForm, setRespForm]     = useState<ResponseFormState>(EMPTY_RESP);
  const [savingResp, setSavingResp] = useState(false);

  const [attributing, setAttributing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const s = {
    page:  isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85" : "text-gray-800",
    muted: isDark ? "text-white/35" : "text-gray-400",
    sub:   isDark ? "text-white/55" : "text-gray-500",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"} focus:border-[#c9a55a]/60`,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, vendorRes] = await Promise.all([
        fetch(`/api/vendors/quote-requests/${id}`),
        fetch(`/api/vendors`),
      ]);
      if (!reqRes.ok) throw new Error("Demande introuvable");
      const reqData = await reqRes.json();
      setRequest(reqData.quoteRequest);
      setResponses(reqData.quoteRequest.responses ?? []);

      const vData = vendorRes.ok ? await vendorRes.json() : { vendors: [] };
      setVendors(vData.vendors ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addResponse() {
    if (!respForm.vendor_id || !request) return;
    setSavingResp(true);
    try {
      const res = await fetch(`/api/vendors/quote-requests/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id:     respForm.vendor_id,
          amount:        respForm.amount ? Number(respForm.amount) : null,
          currency:      respForm.currency,
          delivery_days: respForm.delivery_days ? Number(respForm.delivery_days) : null,
          validity_date: respForm.validity_date || null,
          description:   respForm.description || null,
          notes:         respForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResponses(prev => [...prev, data.response]);
      setRespModal(false);
      setRespForm(EMPTY_RESP);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSavingResp(false);
    }
  }

  async function selectWinner(responseId: string, vendorId: string) {
    if (!request) return;
    setAttributing(true);
    try {
      const res = await fetch(`/api/vendors/quote-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_vendor_id: vendorId, status: "attribue" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequest(data.quoteRequest);
      // Marquer la réponse comme retenue, les autres rejetées
      setResponses(prev => prev.map(r => ({
        ...r,
        status: r.id === responseId ? "retenu" as ResponseStatus : "rejete" as ResponseStatus,
      })));
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setAttributing(false);
    }
  }

  async function changeStatus(status: QuoteStatus) {
    if (!request) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/vendors/quote-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequest(data.quoteRequest);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setStatusSaving(false);
    }
  }

  async function deleteResponse(respId: string) {
    setResponses(prev => prev.filter(r => r.id !== respId));
  }

  // Tri : retenu en premier, puis par montant croissant
  const sortedResponses = [...responses].sort((a, b) => {
    if (a.status === "retenu") return -1;
    if (b.status === "retenu") return 1;
    if (a.status === "rejete" && b.status !== "rejete") return 1;
    if (b.status === "rejete" && a.status !== "rejete") return -1;
    return (a.amount ?? Infinity) - (b.amount ?? Infinity);
  });

  const minAmount = responses.filter(r => r.amount != null).reduce((min, r) => Math.min(min, r.amount!), Infinity);

  if (loading) {
    return (
      <div className={`min-h-full flex items-center justify-center ${s.page}`}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#c9a55a" }} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className={`min-h-full flex flex-col items-center justify-center gap-4 ${s.page}`}>
        <p className={`text-[13px] ${s.muted}`}>{error ?? "Demande introuvable"}</p>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px]" style={{ color: "#c9a55a" }}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    );
  }

  const statusColor = QUOTE_STATUS_COLORS[request.status];

  return (
    <div className={`min-h-full pb-20 ${s.page}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
            <ArrowLeft size={16} className={s.muted} />
          </button>
          <span className={`text-[11px] ${s.muted}`}>Demandes de devis</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-[17px] font-black ${s.text} leading-tight`}>{request.title}</h1>
                <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                  style={{ background: statusColor + "22", color: statusColor }}>
                  {QUOTE_STATUS_LABELS[request.status]}
                </span>
              </div>
              {request.category && <p className={`text-[12px] ${s.sub} mt-0.5`}>{request.category}</p>}
            </div>
          </div>

          {/* Infos clés */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {request.deadline && (
              <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                <Calendar size={10} /> Délai : {new Date(request.deadline).toLocaleDateString("fr-FR")}
              </span>
            )}
            {request.budget_max != null && (
              <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                <DollarSign size={10} /> Budget max : {request.budget_max.toLocaleString("fr-FR")} {request.currency}
              </span>
            )}
            <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
              <MessageSquare size={10} /> {responses.length} réponse{responses.length > 1 ? "s" : ""}
            </span>
          </div>

          {request.description && (
            <p className={`text-[12px] ${s.sub} mt-2 leading-relaxed`}>{request.description}</p>
          )}
        </motion.div>

        {/* Actions statut */}
        {request.status === "ouvert" && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => changeStatus("ferme")} disabled={statusSaving}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold border transition disabled:opacity-50 ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
              <XCircle size={12} /> Fermer
            </button>
            <button onClick={() => changeStatus("annule")} disabled={statusSaving}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold border border-red-500/30 text-red-400 transition disabled:opacity-50">
              Annuler
            </button>
          </div>
        )}

        {/* Attribution */}
        {request.selected_vendor && (
          <div className="mt-3 rounded-2xl border p-3 flex items-center gap-2"
            style={{ borderColor: "#10b98130", background: "#10b98108" }}>
            <Award size={14} className="text-emerald-500 shrink-0" />
            <p className={`text-[12px] font-semibold text-emerald-500`}>
              Attribué à <span className="font-black">{request.selected_vendor.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Réponses */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[13px] font-black ${s.text}`}>
            Réponses reçues{responses.length > 0 ? ` (${responses.length})` : ""}
          </h2>
          {request.status === "ouvert" && (
            <button onClick={() => setRespModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              <Plus size={12} /> Ajouter
            </button>
          )}
        </div>

        {sortedResponses.length === 0 ? (
          <div className={`rounded-2xl border p-6 text-center ${s.card}`}>
            <MessageSquare size={24} className="mx-auto mb-2 opacity-30" style={{ color: "#c9a55a" }} />
            <p className={`text-[12px] ${s.muted}`}>Aucune réponse pour l'instant</p>
            <p className={`text-[11px] ${s.muted} mt-1`}>Ajoutez les propositions reçues de vos prestataires</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedResponses.map((resp, i) => {
              const vendor = vendors.find(v => v.id === resp.vendor_id);
              const isExpanded = expandedId === resp.id;
              const isLowest = resp.amount === minAmount && resp.amount != null && responses.filter(r => r.amount != null).length > 1;
              const isWinner = resp.status === "retenu";

              return (
                <motion.div key={resp.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05, ease }}
                  className={`rounded-2xl border overflow-hidden ${s.card} ${isWinner ? "ring-1 ring-emerald-500/30" : ""}`}>
                  {/* Ligne principale */}
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: isWinner ? "#10b98118" : "#c9a55a18" }}>
                          {isWinner
                            ? <Award size={14} className="text-emerald-500" />
                            : <Building2 size={14} style={{ color: "#c9a55a" }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[13px] font-bold ${s.text} truncate`}>
                              {vendor?.name ?? resp.vendor?.name ?? "Prestataire inconnu"}
                            </span>
                            <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                              style={{ background: RESP_STATUS_COLORS[resp.status] + "22", color: RESP_STATUS_COLORS[resp.status] }}>
                              {RESP_STATUS_LABELS[resp.status]}
                            </span>
                            {isLowest && resp.status !== "rejete" && (
                              <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold"
                                style={{ background: "#c9a55a22", color: "#c9a55a" }}>
                                Plus bas
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {resp.amount != null && (
                              <span className={`text-[14px] font-black ${s.text}`}>
                                {resp.amount.toLocaleString("fr-FR")} {resp.currency}
                              </span>
                            )}
                            {resp.delivery_days != null && (
                              <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                                <Clock size={10} /> {resp.delivery_days} jour{resp.delivery_days > 1 ? "s" : ""}
                              </span>
                            )}
                            {resp.validity_date && (
                              <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                                <Calendar size={10} /> Valide jusqu'au {new Date(resp.validity_date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {request.status === "ouvert" && resp.status !== "retenu" && (
                          <button onClick={() => selectWinner(resp.id, resp.vendor_id)}
                            disabled={attributing}
                            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold transition disabled:opacity-50"
                            style={{ background: "#10b98122", color: "#10b981" }}>
                            {attributing ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                            Retenir
                          </button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : resp.id)}
                          className={`p-1.5 rounded-lg transition ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"}`}>
                          {isExpanded ? <ChevronUp size={13} className={s.muted} /> : <ChevronDown size={13} className={s.muted} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Détail expandé */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="px-3.5 pb-3.5 pt-0 border-t"
                          style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                          <div className="pt-3 space-y-2">
                            {resp.description && (
                              <div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted} mb-0.5`}>Proposition</p>
                                <p className={`text-[12px] ${s.sub} leading-relaxed`}>{resp.description}</p>
                              </div>
                            )}
                            {resp.notes && (
                              <div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wide ${s.muted} mb-0.5`}>Notes</p>
                                <p className={`text-[12px] ${s.sub}`}>{resp.notes}</p>
                              </div>
                            )}
                            {/* Comparaison si montant connu */}
                            {resp.amount != null && request.budget_max != null && (
                              <div className="rounded-xl p-2.5"
                                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                                <p className={`text-[10px] ${s.muted} mb-1`}>vs. budget max</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                    <div className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(100, (resp.amount / request.budget_max) * 100)}%`,
                                        background: resp.amount <= request.budget_max ? "#10b981" : "#ef4444",
                                      }} />
                                  </div>
                                  <span className={`text-[10px] font-semibold ${resp.amount <= request.budget_max ? "text-emerald-500" : "text-red-400"}`}>
                                    {resp.amount <= request.budget_max ? "Dans le budget" : `+${(resp.amount - request.budget_max).toLocaleString("fr-FR")} ${resp.currency}`}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Synthèse comparative */}
        {responses.filter(r => r.amount != null).length > 1 && (
          <div className={`mt-3 rounded-2xl border p-4 ${s.card}`}>
            <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted} mb-3`}>Comparaison</h3>
            <div className="space-y-2">
              {sortedResponses
                .filter(r => r.amount != null && r.status !== "rejete")
                .map(r => {
                  const vendor = vendors.find(v => v.id === r.vendor_id);
                  const maxAmount = responses.filter(x => x.amount != null).reduce((max, x) => Math.max(max, x.amount!), 0);
                  const pct = maxAmount > 0 ? (r.amount! / maxAmount) * 100 : 100;
                  return (
                    <div key={r.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[11px] ${s.sub} truncate max-w-[60%]`}>
                          {vendor?.name ?? r.vendor?.name ?? "—"}
                        </span>
                        <span className={`text-[12px] font-bold ${s.text}`}>
                          {r.amount!.toLocaleString("fr-FR")} {r.currency}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: r.status === "retenu" ? "#10b981" : r.amount === minAmount ? "#c9a55a" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                          }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Modal ajout réponse */}
      <AnimatePresence>
        {respModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={`w-full max-w-lg rounded-t-3xl overflow-hidden ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                <h2 className={`text-[15px] font-black ${s.text}`}>Ajouter une réponse</h2>
                <button onClick={() => setRespModal(false)}
                  className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
                  <X size={16} className={s.muted} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh] px-5 pb-6 pt-4 space-y-3">
                {/* Prestataire */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Prestataire *</label>
                  <select value={respForm.vendor_id} onChange={e => setRespForm(f => ({ ...f, vendor_id: e.target.value }))}
                    className={s.input}>
                    <option value="">— Sélectionner —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                {/* Montant + devise */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Montant proposé</label>
                    <input type="number" value={respForm.amount}
                      onChange={e => setRespForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0" className={s.input} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Devise</label>
                    <select value={respForm.currency} onChange={e => setRespForm(f => ({ ...f, currency: e.target.value }))}
                      className={s.input}>
                      {["EUR", "USD", "CHF", "CAD", "MAD", "XOF"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Délai + validité */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Délai (jours)</label>
                    <input type="number" value={respForm.delivery_days}
                      onChange={e => setRespForm(f => ({ ...f, delivery_days: e.target.value }))}
                      placeholder="Ex. 30" className={s.input} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Valide jusqu'au</label>
                    <input type="date" value={respForm.validity_date}
                      onChange={e => setRespForm(f => ({ ...f, validity_date: e.target.value }))}
                      className={s.input} />
                  </div>
                </div>

                {/* Proposition */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Proposition</label>
                  <textarea value={respForm.description}
                    onChange={e => setRespForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ce que le prestataire propose concrètement..."
                    rows={3} className={`${s.input} resize-none`} />
                </div>

                {/* Notes internes */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Notes internes</label>
                  <textarea value={respForm.notes}
                    onChange={e => setRespForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Vos impressions, points forts/faibles..."
                    rows={2} className={`${s.input} resize-none`} />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setRespModal(false)}
                    className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                    Annuler
                  </button>
                  <button onClick={addResponse} disabled={savingResp || !respForm.vendor_id}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                    {savingResp ? <Loader2 size={14} className="animate-spin" /> : null}
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
