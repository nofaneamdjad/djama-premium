"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenLine, Plus, X, Check, Clock, Trash2, Send, FileText,
  ChevronRight, Loader2, Users, Calendar,
  CheckCircle2, XCircle, RefreshCw, Download, BookTemplate,
  Wifi, WifiOff,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import { getSupabase } from "@/lib/supabase";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;

type RequestStatus = "draft" | "sent" | "partially_signed" | "completed" | "refused" | "expired" | "cancelled";

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  order_index: number;
  status: "pending" | "sent" | "viewed" | "signed" | "refused";
  signed_at: string | null;
  viewed_at: string | null;
}

interface SignatureRequest {
  id: string;
  title: string;
  message: string;
  status: RequestStatus;
  sign_order: "parallel" | "sequential";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  signers: Signer[];
}

interface Template {
  id: string;
  name: string;
  title: string;
  message: string;
  sign_order: "parallel" | "sequential";
  signers: Array<{ name: string; email: string; role: string; order_index: number }>;
  created_at: string;
}

const STATUS_CFG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  draft:            { label: "Brouillon",       color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  sent:             { label: "Envoyé",           color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  partially_signed: { label: "En cours",         color: GOLD,      bg: "rgba(201,165,90,0.1)"  },
  completed:        { label: "Signé",             color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  refused:          { label: "Refusé",            color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  expired:          { label: "Expiré",            color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  cancelled:        { label: "Annulé",            color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const SIGNER_STATUS_CFG = {
  pending: { label: "En attente", color: "#9ca3af" },
  sent:    { label: "Envoyé",     color: "#3b82f6" },
  viewed:  { label: "Consulté",   color: GOLD       },
  signed:  { label: "Signé",      color: "#10b981"  },
  refused: { label: "Refusé",     color: "#ef4444"  },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(msg: string, ok = true) {
  const el = globalThis.document?.createElement("div");
  if (!el) return;
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
    background: ok ? "#10b981" : "#ef4444", color: "#fff",
    padding: "0.6rem 1.2rem", borderRadius: "12px", fontWeight: "700",
    fontSize: "0.82rem", zIndex: "9999", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    pointerEvents: "none",
  });
  globalThis.document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

interface SignerFormRow { name: string; email: string; role: string; }

const TABS = ["requests", "templates"] as const;
type Tab = typeof TABS[number];

export default function SignaturePage() {
  const { isDark } = useTheme();

  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);

  const [creating, setCreating] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", sign_order: "parallel" as "parallel" | "sequential", expires_at: "",
  });
  const [signers, setSigners] = useState<SignerFormRow[]>([{ name: "", email: "", role: "signataire" }]);
  const [saving, setSaving] = useState(false);

  const [sending, setSending] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloadingProof, setDownloadingProof] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof getSupabase>["channel"] extends (...a: never[]) => infer R ? R : never | null>(null);

  const s = {
    card:    isDark ? "bg-white/[0.03] border-white/[0.07]"   : "bg-white border-black/[0.07] shadow-sm",
    text:    isDark ? "text-white/85"                           : "text-gray-800",
    muted:   isDark ? "text-white/35"                           : "text-gray-400",
    sub:     isDark ? "text-white/55"                           : "text-gray-500",
    divider: isDark ? "border-white/[0.07]"                    : "border-gray-100",
    input:   `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border transition-colors ${
      isDark
        ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25 focus:border-[#c9a55a]/50"
        : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400 focus:border-[#c9a55a]/60"
    }`,
    bg: isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/signature/requests${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTpl(true);
    try {
      const res = await fetch("/api/signature/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } finally {
      setLoadingTpl(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { if (tab === "templates") fetchTemplates(); }, [tab, fetchTemplates]);

  // ── Phase 8 — Realtime subscription ──
  useEffect(() => {
    const supabase = getSupabase();

    // Subscribe to changes on signature_requests for the current user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = supabase.channel("sig-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table:  "signature_requests",
      }, () => {
        // Refresh the list when any request changes
        fetchRequests();
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table:  "signature_request_signers",
      }, () => {
        fetchRequests();
      })
      .subscribe(status => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channelRef.current = channel as any;
    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const selected = requests.find(r => r.id === selectedId) ?? null;

  async function createRequest() {
    if (!form.title.trim()) return;
    const validSigners = signers.filter(s => s.name.trim() && s.email.trim());
    setSaving(true);
    try {
      const res = await fetch("/api/signature/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:      form.title.trim(),
          message:    form.message.trim(),
          sign_order: form.sign_order,
          expires_at: form.expires_at || null,
          signers:    validSigners.map((s, i) => ({ ...s, order_index: i })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Erreur", false); return; }
      setRequests(prev => [data.request, ...prev]);
      setCreating(false);
      setForm({ title: "", message: "", sign_order: "parallel", expires_at: "" });
      setSigners([{ name: "", email: "", role: "signataire" }]);
      showToast("Demande créée");
    } finally {
      setSaving(false);
    }
  }

  async function saveAsTemplate() {
    if (!form.title.trim()) return;
    const validSigners = signers.filter(s => s.name.trim() && s.email.trim());
    const name = prompt("Nom du modèle :");
    if (!name?.trim()) return;
    setSavingTpl(true);
    try {
      const res = await fetch("/api/signature/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       name.trim(),
          title:      form.title.trim(),
          message:    form.message.trim(),
          sign_order: form.sign_order,
          signers:    validSigners.map((s, i) => ({ ...s, order_index: i })),
        }),
      });
      if (res.ok) showToast("Modèle enregistré");
      else { const d = await res.json(); showToast(d.error ?? "Erreur", false); }
    } finally {
      setSavingTpl(false);
    }
  }

  function applyTemplate(tpl: Template) {
    setForm({
      title:      tpl.title,
      message:    tpl.message,
      sign_order: tpl.sign_order,
      expires_at: "",
    });
    setSigners(
      tpl.signers.length > 0
        ? tpl.signers.map(s => ({ name: s.name, email: s.email, role: s.role }))
        : [{ name: "", email: "", role: "signataire" }],
    );
    setCreating(true);
    if (tab === "templates") setTab("requests");
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Supprimer ce modèle ?")) return;
    const res = await fetch(`/api/signature/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast("Modèle supprimé");
    }
  }

  async function sendRequest(id: string) {
    setSending(id);
    try {
      const res = await fetch(`/api/signature/requests/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Erreur d'envoi", false); return; }
      showToast(`${data.sent?.length ?? 0} email(s) envoyé(s)`);
      await fetchRequests();
    } finally {
      setSending(null);
    }
  }

  async function cancelRequest(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/signature/requests/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Erreur", false); return; }
      showToast("Demande annulée");
      await fetchRequests();
      if (selectedId === id) setSelectedId(null);
    } finally {
      setCancelling(null);
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm("Supprimer cette demande définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/signature/requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Erreur", false); return; }
      showToast("Demande supprimée");
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selectedId === id) setSelectedId(null);
    } finally {
      setDeleting(null);
    }
  }

  // Phase 9 — Download proof PDF
  async function downloadProof(id: string, title: string) {
    setDownloadingProof(id);
    try {
      const res = await fetch(`/api/signature/requests/${id}/proof`);
      if (!res.ok) { showToast("Erreur génération dossier", false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `preuve-${title.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Dossier de preuve téléchargé");
    } finally {
      setDownloadingProof(null);
    }
  }

  const counts = {
    total:   requests.length,
    signed:  requests.filter(r => r.status === "completed").length,
    pending: requests.filter(r => r.status === "sent" || r.status === "partially_signed").length,
    draft:   requests.filter(r => r.status === "draft").length,
  };

  const FILTERS: { key: "all" | RequestStatus; label: string }[] = [
    { key: "all",              label: "Tous"       },
    { key: "draft",            label: "Brouillons" },
    { key: "sent",             label: "Envoyés"    },
    { key: "partially_signed", label: "En cours"   },
    { key: "completed",        label: "Signés"     },
    { key: "refused",          label: "Refusés"    },
  ];

  return (
    <div className={`min-h-full pb-20 ${s.bg}`}>

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={PenLine} color="#059669" />
            <div>
              <h1 className={`text-[15px] font-extrabold leading-tight ${s.text}`}>Signature électronique</h1>
              <div className="flex items-center gap-1.5">
                <p className={`text-[11px] ${s.muted}`}>{counts.total} demande{counts.total !== 1 ? "s" : ""}</p>
                {realtimeConnected
                  ? <Wifi size={10} style={{ color: "#10b981" }} />
                  : <WifiOff size={10} className={s.muted} />
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchRequests} className={`p-2 rounded-xl border transition-colors ${s.card} ${s.muted} hover:opacity-80`}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-black"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              <Plus size={13} /> Nouvelle demande
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Signés",    value: counts.signed,  icon: CheckCircle2, color: "#10b981" },
          { label: "En cours",  value: counts.pending,  icon: Clock,        color: GOLD      },
          { label: "Brouillon", value: counts.draft,    icon: FileText,     color: "#6b7280" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-2xl border p-3 ${s.card}`}>
            <Icon size={14} style={{ color }} className="mb-1" />
            <p className={`text-[17px] font-extrabold ${s.text}`}>{value}</p>
            <p className={`text-[10px] font-semibold ${s.muted}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 mb-3 flex gap-2">
        {([["requests", "Demandes"], ["templates", "Modèles"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              tab === key ? "text-black border-transparent" : `${s.muted} ${s.card}`
            }`}
            style={tab === key ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, borderColor: "transparent" } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Requests tab ── */}
      {tab === "requests" && (
        <>
          {/* Filters */}
          <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  filter === f.key ? "text-black border-transparent" : `${s.muted} ${s.card}`
                }`}
                style={filter === f.key ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, borderColor: "transparent" } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="px-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} style={{ color: GOLD }} className="animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
                <PenLine size={32} className={`${s.muted} mx-auto mb-2`} />
                <p className={`text-[13px] font-semibold ${s.text}`}>Aucune demande de signature</p>
                <p className={`text-[11px] ${s.muted} mt-1`}>Créez votre première demande ci-dessus</p>
              </div>
            ) : (
              requests.map(req => {
                const cfg = STATUS_CFG[req.status];
                const isSelected = req.id === selectedId;
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border cursor-pointer transition-all ${s.card} ${isSelected ? "ring-1 ring-[#c9a55a]/40" : ""}`}
                    onClick={() => setSelectedId(isSelected ? null : req.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-bold truncate ${s.text}`}>{req.title}</p>
                          <p className={`text-[11px] ${s.muted} mt-0.5`}>{fmtDate(req.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.label}
                          </span>
                          <ChevronRight size={12} className={`${s.muted} transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      {req.signers && req.signers.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Users size={11} className={s.muted} />
                          <p className={`text-[11px] ${s.muted}`}>
                            {req.signers.map(sg => sg.name).slice(0, 3).join(", ")}
                            {req.signers.length > 3 && ` +${req.signers.length - 3}`}
                          </p>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease }}
                          className="overflow-hidden"
                        >
                          <div className={`border-t px-3 pb-3 pt-2 ${s.divider}`}>
                            {req.signers && req.signers.length > 0 && (
                              <div className="mb-3">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${s.muted} mb-1.5`}>Signataires</p>
                                <div className="space-y-1.5">
                                  {req.signers.map(sg => {
                                    const sc = SIGNER_STATUS_CFG[sg.status] ?? SIGNER_STATUS_CFG.pending;
                                    return (
                                      <div key={sg.id} className="flex items-center justify-between">
                                        <div>
                                          <p className={`text-[11.5px] font-semibold ${s.text}`}>{sg.name}</p>
                                          <p className={`text-[10px] ${s.muted}`}>{sg.email}</p>
                                        </div>
                                        <span className="text-[10px] font-bold" style={{ color: sc.color }}>{sc.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-2">
                              {(req.status === "draft" || req.status === "sent" || req.status === "partially_signed") && (
                                <button
                                  onClick={e => { e.stopPropagation(); sendRequest(req.id); }}
                                  disabled={sending === req.id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-black transition-opacity disabled:opacity-60"
                                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                                >
                                  {sending === req.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                                  {req.status === "draft" ? "Envoyer" : "Relancer"}
                                </button>
                              )}

                              {/* Phase 9 — Dossier de preuve */}
                              {(req.status === "completed" || req.status === "refused") && (
                                <button
                                  onClick={e => { e.stopPropagation(); downloadProof(req.id, req.title); }}
                                  disabled={downloadingProof === req.id}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${s.card} disabled:opacity-60`}
                                  style={{ color: "#10b981" }}
                                >
                                  {downloadingProof === req.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                                  Dossier de preuve
                                </button>
                              )}

                              {(req.status === "draft" || req.status === "sent" || req.status === "partially_signed") && (
                                <button
                                  onClick={e => { e.stopPropagation(); cancelRequest(req.id); }}
                                  disabled={cancelling === req.id}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${s.card} disabled:opacity-60`}
                                  style={{ color: "#ef4444" }}
                                >
                                  {cancelling === req.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                  Annuler
                                </button>
                              )}

                              {req.status !== "completed" && (
                                <button
                                  onClick={e => { e.stopPropagation(); deleteRequest(req.id); }}
                                  disabled={deleting === req.id}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${s.card} disabled:opacity-60`}
                                  style={{ color: "#9ca3af" }}
                                >
                                  {deleting === req.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                  Supprimer
                                </button>
                              )}
                            </div>

                            {req.expires_at && (
                              <div className="flex items-center gap-1 mt-2">
                                <Calendar size={10} className={s.muted} />
                                <p className={`text-[10px] ${s.muted}`}>Expire le {fmtDate(req.expires_at)}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── Templates tab — Phase 10 ── */}
      {tab === "templates" && (
        <div className="px-4 space-y-2">
          {loadingTpl ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} style={{ color: GOLD }} className="animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
              <BookTemplate size={32} className={`${s.muted} mx-auto mb-2`} />
              <p className={`text-[13px] font-semibold ${s.text}`}>Aucun modèle enregistré</p>
              <p className={`text-[11px] ${s.muted} mt-1`}>
                Créez une demande et cliquez sur &quot;Enregistrer comme modèle&quot;
              </p>
            </div>
          ) : (
            templates.map(tpl => (
              <div key={tpl.id} className={`rounded-2xl border p-3 ${s.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-bold ${s.text}`}>{tpl.name}</p>
                    <p className={`text-[11px] ${s.muted} mt-0.5 truncate`}>{tpl.title}</p>
                    {tpl.signers.length > 0 && (
                      <p className={`text-[10px] ${s.muted} mt-0.5`}>
                        {tpl.signers.length} signataire{tpl.signers.length !== 1 ? "s" : ""}
                        {tpl.sign_order === "sequential" ? " · séquentiel" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => applyTemplate(tpl)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-black"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                    >
                      <Plus size={11} /> Utiliser
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className={`p-1.5 rounded-lg border ${s.card}`}
                      style={{ color: "#9ca3af" }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Create modal ── */}
      <AnimatePresence>
        {creating && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ ease }}
              className={`relative w-full max-w-lg rounded-2xl border p-5 max-h-[90vh] overflow-y-auto ${
                isDark ? "bg-[#0d1120] border-white/[0.09]" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
                    <PenLine size={13} style={{ color: GOLD }} />
                  </div>
                  <h2 className={`text-[14px] font-extrabold ${s.text}`}>Nouvelle demande</h2>
                </div>
                <button onClick={() => setCreating(false)} className={`p-1.5 rounded-lg ${s.muted} hover:opacity-70`}><X size={15} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${s.muted} block mb-1`}>Titre *</label>
                  <input className={s.input} value={form.title} maxLength={255}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="ex : Contrat de prestation 2026" />
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${s.muted} block mb-1`}>Message (optionnel)</label>
                  <textarea className={`${s.input} resize-none`} rows={2}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Message pour les signataires…" />
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${s.muted} block mb-1`}>Ordre de signature</label>
                  <div className="flex gap-2">
                    {(["parallel", "sequential"] as const).map(opt => (
                      <button key={opt} onClick={() => setForm(f => ({ ...f, sign_order: opt }))}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                          form.sign_order === opt ? "" : `${s.muted} ${s.card}`
                        }`}
                        style={form.sign_order === opt ? { background: `${GOLD}20`, borderColor: GOLD, color: GOLD } : {}}
                      >
                        {opt === "parallel" ? "Simultané" : "Séquentiel"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${s.muted} block mb-1`}>Date d&apos;expiration</label>
                  <input type="date" className={s.input} value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-bold uppercase tracking-wider ${s.muted}`}>Signataires</label>
                    <button onClick={() => setSigners(prev => [...prev, { name: "", email: "", role: "signataire" }])}
                      className="text-[11px] font-bold flex items-center gap-1" style={{ color: GOLD }}>
                      <Plus size={11} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {signers.map((sg, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1.5">
                          <input className={s.input} value={sg.name}
                            onChange={e => setSigners(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                            placeholder="Nom complet" />
                          <input className={s.input} type="email" value={sg.email}
                            onChange={e => setSigners(prev => prev.map((s, j) => j === i ? { ...s, email: e.target.value } : s))}
                            placeholder="Email" />
                        </div>
                        {signers.length > 1 && (
                          <button onClick={() => setSigners(prev => prev.filter((_, j) => j !== i))}
                            className={`mt-1 p-1.5 rounded-lg ${s.muted}`}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setCreating(false)}
                  className={`py-2.5 px-4 rounded-xl text-[12px] font-bold border ${s.card} ${s.muted}`}>
                  Annuler
                </button>
                {/* Phase 10 — Save as template */}
                <button onClick={saveAsTemplate} disabled={savingTpl || !form.title.trim()}
                  className={`py-2.5 px-4 rounded-xl text-[12px] font-bold border ${s.card} disabled:opacity-40`}
                  style={{ color: GOLD }}>
                  {savingTpl ? <Loader2 size={12} className="animate-spin" /> : "Modèle"}
                </button>
                <button onClick={createRequest} disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-black disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
