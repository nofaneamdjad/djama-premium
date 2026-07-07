"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle,
  Download, Euro, Calendar, Building2,
  MessageSquare, Send, Loader2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const ease = [0.16, 1, 0.3, 1] as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface DocItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface Document {
  id: string;
  type: string;
  numero: string;
  statut: string;
  sujet: string;
  emetteur_nom: string;
  emetteur_email: string;
  emetteur_adresse: string;
  emetteur_logo: string | null;
  client_nom: string;
  client_email: string;
  date_document: string;
  date_echeance: string | null;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  notes: string | null;
  conditions: string | null;
  rib_iban: string | null;
  rib_bic: string | null;
  rib_titulaire: string | null;
  items?: DocItem[];
}

interface PortalData {
  client_nom: string;
  client_email: string;
  emetteur_nom: string;
  documents: Document[];
}

interface Message {
  id: string;
  from_role: "admin" | "client";
  text: string;
  created_at: string;
}

function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  brouillon: { label: "Brouillon",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: Clock },
  envoyé:    { label: "Envoyé",     color: "#6366f1", bg: "rgba(99,102,241,0.1)",  icon: FileText },
  payé:      { label: "Payé",       color: "#10b981", bg: "rgba(16,185,129,0.1)",  icon: CheckCircle2 },
  en_retard: { label: "En retard",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: AlertTriangle },
};

export default function PortailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [data,     setData]     = useState<PortalData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState<Document | null>(null);

  // Messaging
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [msgInput,   setMsgInput]   = useState("");
  const [sending,    setSending]    = useState(false);
  const [msgError,   setMsgError]   = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;

      const { data: portal, error: portalErr } = await supabase
        .from("portail_clients")
        .select("client_nom, client_email, user_id, expires_at")
        .eq("token", token)
        .single();

      if (portalErr || !portal) {
        setError("Lien invalide ou expiré.");
        setLoading(false);
        return;
      }

      if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
        setError("Ce lien a expiré. Contactez votre prestataire pour en obtenir un nouveau.");
        setLoading(false);
        return;
      }

      const { data: docs } = await supabase
        .from("documents")
        .select("id, type, numero, statut, sujet, emetteur_nom, emetteur_email, emetteur_adresse, emetteur_logo, client_nom, client_email, date_document, date_echeance, total_ht, total_tva, total_ttc, notes, conditions, rib_iban, rib_bic, rib_titulaire")
        .eq("user_id", portal.user_id)
        .eq("client_nom", portal.client_nom)
        .in("statut", ["envoyé", "payé", "en_retard"])
        .order("date_document", { ascending: false })
        .limit(30);

      const docsWithItems: Document[] = [];
      for (const doc of (docs ?? [])) {
        const { data: items } = await supabase
          .from("document_items")
          .select("description, quantity, unit_price, vat_rate")
          .eq("document_id", doc.id)
          .order("position");
        docsWithItems.push({ ...doc as Document, items: (items ?? []) as DocItem[] });
      }

      const emetteurNom = docsWithItems[0]?.emetteur_nom ?? "Votre prestataire";

      setData({ client_nom: portal.client_nom, client_email: portal.client_email, emetteur_nom: emetteurNom, documents: docsWithItems });
      setLoading(false);

      // Load messages
      const res = await fetch(`/api/portail/messages?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const json = await res.json() as { messages: Message[] };
        setMessages(json.messages);
      }
    }

    load();
  }, [token]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function sendMessage() {
    if (!msgInput.trim() || sending) return;
    const text = msgInput.trim();
    setMsgInput("");
    setSending(true);
    setMsgError("");

    try {
      const res = await fetch("/api/portail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, text }),
      });
      if (res.ok) {
        const json = await res.json() as { message: Message };
        setMessages(prev => [...prev, json.message]);
      } else {
        setMsgError("Erreur lors de l'envoi. Réessayez.");
        setMsgInput(text);
      }
    } catch {
      setMsgError("Erreur réseau. Réessayez.");
      setMsgInput(text);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-100 border-t-[#c9a55a]" />
          <p className="text-sm text-gray-400">Chargement de votre portail…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Accès impossible</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const unpaid = data.documents.filter(d => d.statut !== "payé" && d.type === "facture");
  const totalDue = unpaid.reduce((s, d) => s + d.total_ttc, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">Portail client</p>
          <h1 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
            Bonjour, {data.client_nom.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Retrouvez ici tous vos documents et échangez directement avec {data.emetteur_nom}.
          </p>
        </motion.div>

        {/* Alert total dû */}
        {totalDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
            className="mb-6 flex items-center gap-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <Euro size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-gray-800">
                {unpaid.length} facture{unpaid.length > 1 ? "s" : ""} en attente de paiement
              </p>
              <p className="text-xs text-gray-500">Total dû : <strong className="text-amber-600">{fmtEur(totalDue)}</strong></p>
            </div>
          </motion.div>
        )}

        {/* Documents */}
        <div className="space-y-3">
          {data.documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText size={30} className="text-gray-300" />
              <p className="text-base font-semibold text-gray-400">Aucun document disponible</p>
            </div>
          ) : (
            data.documents.map((doc, i) => {
              const statut = STATUT_CONFIG[doc.statut] ?? STATUT_CONFIG.envoyé;
              const StatutIcon = statut.icon;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: 0.15 + i * 0.05 }}
                >
                  <button
                    onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
                    className={`w-full rounded-[1.25rem] border p-4 text-left transition-all ${
                      selected?.id === doc.id
                        ? "border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.05)] shadow-[0_4px_16px_rgba(201,165,90,0.12)]"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        <FileText size={16} style={{ color: doc.type === "facture" ? "#c9a55a" : "#6366f1" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{doc.numero}</span>
                          <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase"
                            style={{ color: statut.color, background: statut.bg }}>
                            <StatutIcon size={8} className="mr-1 inline-block" />{statut.label}
                          </span>
                        </div>
                        {doc.sujet && <p className="text-xs text-gray-500 truncate">{doc.sujet}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-black text-[#c9a55a]">{fmtEur(doc.total_ttc)}</p>
                        <p className="text-[0.6rem] text-gray-400">{fmtDate(doc.date_document)}</p>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {selected?.id === doc.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                            {/* Emetteur */}
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {doc.emetteur_nom} · {doc.emetteur_email}
                              </span>
                            </div>
                            {doc.date_echeance && (
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className={doc.statut === "en_retard" ? "text-red-500" : "text-gray-400"} />
                                <span className={`text-xs ${doc.statut === "en_retard" ? "font-bold text-red-500" : "text-gray-500"}`}>
                                  Échéance : {fmtDate(doc.date_echeance)}
                                </span>
                              </div>
                            )}
                            {/* Items */}
                            {doc.items && doc.items.length > 0 && (
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
                                {doc.items.map((it, j) => (
                                  <div key={j} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 truncate flex-1 mr-3">{it.description}</span>
                                    <span className="shrink-0 text-gray-500">{it.quantity} × {fmtEur(it.unit_price)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between border-t border-gray-200 pt-1.5 text-xs font-bold">
                                  <span className="text-gray-500">Total TTC</span>
                                  <span className="text-[#c9a55a]">{fmtEur(doc.total_ttc)}</span>
                                </div>
                              </div>
                            )}
                            {/* RIB */}
                            {doc.rib_iban && (
                              <div className="rounded-xl border border-[rgba(201,165,90,0.18)] bg-[rgba(201,165,90,0.05)] p-3">
                                <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#c9a55a]">Coordonnées bancaires</p>
                                {doc.rib_titulaire && <p className="text-xs text-gray-600">{doc.rib_titulaire}</p>}
                                <p className="text-xs text-gray-600">IBAN : {doc.rib_iban}</p>
                                {doc.rib_bic && <p className="text-xs text-gray-600">BIC : {doc.rib_bic}</p>}
                              </div>
                            )}
                            {doc.notes && (
                              <p className="text-xs italic text-gray-400">{doc.notes}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Messagerie ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
          className="mt-10"
        >
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-[#c9a55a]" />
            <h2 className="text-sm font-black text-gray-800">Messages</h2>
            {messages.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.6rem] font-bold text-gray-500">
                {messages.length}
              </span>
            )}
          </div>

          {/* Thread */}
          <div className="rounded-[1.25rem] border border-gray-200 bg-gray-50 overflow-hidden">
            <div className="min-h-[120px] max-h-80 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <MessageSquare size={22} className="text-gray-300" />
                  <p className="text-xs text-gray-400">Posez votre question à {data.emetteur_nom}</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isClient = msg.from_role === "client";
                  return (
                    <div key={msg.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isClient
                            ? "rounded-br-sm bg-[#c9a55a] text-white"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        {!isClient && (
                          <p className="mb-1 text-[0.55rem] font-bold uppercase tracking-wider opacity-60">
                            {data.emetteur_nom}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`mt-1 text-[0.58rem] ${isClient ? "text-white/60" : "text-gray-400"}`}>
                          {fmtTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-3">
              {msgError && (
                <p className="mb-2 text-[0.65rem] font-medium text-red-500">{msgError}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                  }}
                  placeholder={`Écrire un message à ${data.emetteur_nom}…`}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#c9a55a]/40 focus:ring-2 focus:ring-[#c9a55a]/10 transition-all"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!msgInput.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a55a] text-white shadow-sm transition-all hover:bg-[#b8944a] disabled:opacity-40"
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={15} />
                  }
                </button>
              </div>
              <p className="mt-1.5 text-[0.58rem] text-gray-400">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center text-[0.65rem] text-gray-300"
        >
          Portail sécurisé — DJAMA PRO · Ce lien est personnel et confidentiel
        </motion.p>
      </div>
    </div>
  );
}
