"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle,
  Download, Euro, Calendar, Building2,
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
  documents: Document[];
}

function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  brouillon: { label: "Brouillon",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: Clock },
  envoyé:    { label: "Envoyé",     color: "#60a5fa", bg: "rgba(59,130,246,0.1)",  icon: FileText },
  payé:      { label: "Payé",       color: "#4ade80", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle2 },
  en_retard: { label: "En retard",  color: "#f87171", bg: "rgba(239,68,68,0.1)",   icon: AlertTriangle },
};

export default function PortailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [data,    setData]    = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [selected, setSelected] = useState<Document | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;

      /* ── Récupère le portail via le token ── */
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

      /* ── Vérifie l'expiration ── */
      if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
        setError("Ce lien a expiré. Contactez votre prestataire pour en obtenir un nouveau.");
        setLoading(false);
        return;
      }

      /* ── Récupère les documents du client ── */
      const { data: docs } = await supabase
        .from("documents")
        .select("id, type, numero, statut, sujet, emetteur_nom, emetteur_email, emetteur_adresse, emetteur_logo, client_nom, client_email, date_document, date_echeance, total_ht, total_tva, total_ttc, notes, conditions, rib_iban, rib_bic, rib_titulaire")
        .eq("user_id", portal.user_id)
        .eq("client_nom", portal.client_nom)
        .in("statut", ["envoyé", "payé", "en_retard"])
        .order("date_document", { ascending: false })
        .limit(30);

      /* ── Fetch items for each doc ── */
      const docsWithItems: Document[] = [];
      for (const doc of (docs ?? [])) {
        const { data: items } = await supabase
          .from("document_items")
          .select("description, quantity, unit_price, vat_rate")
          .eq("document_id", doc.id)
          .order("position");
        docsWithItems.push({ ...doc as Document, items: (items ?? []) as DocItem[] });
      }

      setData({ client_nom: portal.client_nom, client_email: portal.client_email, documents: docsWithItems });
      setLoading(false);
    }

    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a55a]" />
          <p className="text-sm text-white/40">Chargement de votre portail…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/8">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white">Accès impossible</h1>
          <p className="mt-2 text-sm text-white/45">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const unpaid = data.documents.filter(d => d.statut !== "payé" && d.type === "facture");
  const totalDue = unpaid.reduce((s, d) => s + d.total_ttc, 0);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]/70">Portail client</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Bonjour, {data.client_nom.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 text-sm text-white/45">
            Retrouvez ici tous vos documents. Portail sécurisé — accès privé.
          </p>
        </motion.div>

        {/* Alert total dû */}
        {totalDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
            className="mb-6 flex items-center gap-4 rounded-[1.25rem] border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] px-5 py-4"
          >
            <Euro size={18} className="shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-bold text-white">
                {unpaid.length} facture{unpaid.length > 1 ? "s" : ""} en attente de paiement
              </p>
              <p className="text-xs text-white/45">Total dû : <strong className="text-amber-400">{fmtEur(totalDue)}</strong></p>
            </div>
          </motion.div>
        )}

        {/* Documents */}
        <div className="space-y-3">
          {data.documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText size={30} className="text-white/15" />
              <p className="text-base font-semibold text-white/30">Aucun document disponible</p>
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
                        ? "border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.06)]"
                        : "border-white/8 bg-[rgba(15,17,23,0.6)] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <FileText size={16} style={{ color: doc.type === "facture" ? "#c9a55a" : "#60a5fa" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{doc.numero}</span>
                          <span className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase"
                            style={{ color: statut.color, background: statut.bg }}>
                            <StatutIcon size={8} className="mr-1 inline-block" />{statut.label}
                          </span>
                        </div>
                        {doc.sujet && <p className="text-xs text-white/45 truncate">{doc.sujet}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-black" style={{ color: "#c9a55a" }}>{fmtEur(doc.total_ttc)}</p>
                        <p className="text-[0.6rem] text-white/30">{fmtDate(doc.date_document)}</p>
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
                          <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                            {/* Emetteur */}
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-white/30" />
                              <span className="text-xs text-white/50">
                                {doc.emetteur_nom} · {doc.emetteur_email}
                              </span>
                            </div>
                            {doc.date_echeance && (
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className={doc.statut === "en_retard" ? "text-red-400" : "text-white/30"} />
                                <span className={`text-xs ${doc.statut === "en_retard" ? "font-bold text-red-400" : "text-white/50"}`}>
                                  Échéance : {fmtDate(doc.date_echeance)}
                                </span>
                              </div>
                            )}
                            {/* Items */}
                            {doc.items && doc.items.length > 0 && (
                              <div className="rounded-xl border border-white/6 bg-white/3 p-3 space-y-1.5">
                                {doc.items.map((it, j) => (
                                  <div key={j} className="flex items-center justify-between text-xs">
                                    <span className="text-white/65 truncate flex-1 mr-3">{it.description}</span>
                                    <span className="shrink-0 text-white/45">{it.quantity} × {fmtEur(it.unit_price)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between border-t border-white/6 pt-1.5 text-xs font-bold">
                                  <span className="text-white/50">Total TTC</span>
                                  <span style={{ color: "#c9a55a" }}>{fmtEur(doc.total_ttc)}</span>
                                </div>
                              </div>
                            )}
                            {/* RIB */}
                            {doc.rib_iban && (
                              <div className="rounded-xl border border-[rgba(201,165,90,0.12)] bg-[rgba(201,165,90,0.05)] p-3">
                                <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#c9a55a]/60">Coordonnées bancaires</p>
                                {doc.rib_titulaire && <p className="text-xs text-white/55">{doc.rib_titulaire}</p>}
                                <p className="text-xs text-white/55">IBAN : {doc.rib_iban}</p>
                                {doc.rib_bic && <p className="text-xs text-white/55">BIC : {doc.rib_bic}</p>}
                              </div>
                            )}
                            {doc.notes && (
                              <p className="text-xs italic text-white/35">{doc.notes}</p>
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center text-[0.65rem] text-white/15"
        >
          Portail sécurisé — DJAMA PRO · Ce lien est personnel et confidentiel
        </motion.p>
      </div>
    </div>
  );
}
