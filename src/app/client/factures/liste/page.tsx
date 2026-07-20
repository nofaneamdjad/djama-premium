"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Plus, ExternalLink, ArrowRight,
  Loader2, AlertCircle, ReceiptText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

/** Shape retournée par la table "documents" */
type Document = {
  id:           string;
  numero:       string;
  type:         "facture" | "devis";
  client_nom:   string;
  client_email: string;
  total_ttc:    number;
  total_ht:     number;
  date_document: string | null;
  created_at:   string;
  couleur:      string;
  statut:       string;
};

const TYPE_LABEL: Record<string, string> = {
  facture: "Facture",
  devis:   "Devis",
};

const TYPE_COLOR: Record<string, string> = {
  facture: "#c9a55a",
  devis:   "#7c6fcd",
};

const STATUT_COLOR: Record<string, string> = {
  brouillon: "#94a3b8",
  "envoyé":  "#60a5fa",
  "payé":    "#4ade80",
  en_retard: "#f87171",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function ListeDocuments() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }

      const { data, error: sbErr } = await supabase
        .from("documents")                          // ✅ table correcte
        .select("id, numero, type, client_nom, client_email, total_ttc, total_ht, date_document, created_at, couleur, statut")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (sbErr) {
        setError(sbErr.message);
      } else {
        setDocuments((data as Document[]) ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#07080e] text-white">
      <div className="mx-auto max-w-5xl px-6 py-14">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-white">Mes documents</h1>
            <p className="mt-1 text-sm text-white/60">Toutes vos factures et devis enregistrés</p>
          </div>
          <Link href="/client/factures"
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07080e] shadow-lg shadow-white/10 transition hover:opacity-90">
            <Plus size={15} /> Nouveau document
          </Link>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-[#c9a55a]" />
          </div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-400"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {!loading && !error && documents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-col items-center justify-center rounded-3xl border border-white/8 bg-white/4 py-24 text-center backdrop-blur-sm"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/4">
              <ReceiptText size={28} className="text-[#c9a55a]" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Aucun document encore</h2>
            <p className="mt-2 text-sm text-white/50">Créez votre première facture ou votre premier devis</p>
            <Link href="/client/factures"
              className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07080e] shadow-lg shadow-white/10 transition hover:opacity-90">
              <Plus size={14} /> Créer un document
            </Link>
          </motion.div>
        )}

        {!loading && !error && documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="overflow-hidden rounded-2xl border border-white/6 bg-white/4 backdrop-blur-sm"
          >
            {/* En-tête tableau */}
            <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-white/6 bg-white/4 px-6 py-3 sm:grid">
              {["Type", "Client / Numéro", "Date", "Montant TTC", ""].map((h) => (
                <span key={h} className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">{h}</span>
              ))}
            </div>

            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: i * 0.04 }}
                className="grid grid-cols-1 items-center gap-3 border-b border-white/6 px-6 py-4 last:border-0 hover:bg-white/4 transition-colors duration-200 sm:grid-cols-[auto_1fr_auto_auto_auto]"
              >
                {/* Type + statut */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
                    style={{
                      background: `${TYPE_COLOR[doc.type] ?? "#c9a55a"}15`,
                      color:      TYPE_COLOR[doc.type] ?? "#c9a55a",
                      border:     `1px solid ${TYPE_COLOR[doc.type] ?? "#c9a55a"}30`,
                    }}
                  >
                    <FileText size={10} />
                    {TYPE_LABEL[doc.type] ?? doc.type}
                  </span>
                  <span
                    className="hidden rounded-full px-2 py-0.5 text-[0.58rem] font-bold sm:inline"
                    style={{
                      color:      STATUT_COLOR[doc.statut] ?? "#94a3b8",
                      background: `${STATUT_COLOR[doc.statut] ?? "#94a3b8"}18`,
                    }}
                  >
                    {doc.statut}
                  </span>
                </div>

                {/* Client + numéro */}
                <div>
                  <p className="text-sm font-semibold text-white">{doc.client_nom || "—"}</p>
                  <p className="text-xs text-white/40">{doc.numero}</p>
                </div>

                {/* Date */}
                <p className="hidden text-sm text-white/60 sm:block">
                  {fmtDate(doc.date_document ?? doc.created_at)}
                </p>

                {/* Montant */}
                <p className="text-sm font-extrabold" style={{ color: doc.couleur || "#c9a55a" }}>
                  {fmt(doc.total_ttc)}
                </p>

                {/* CTA */}
                <Link
                  href="/client/factures"
                  className="inline-flex items-center gap-1 rounded-xl border border-white/8 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/60 transition-all hover:border-[rgba(201,165,90,0.3)] hover:text-[#c9a55a]"
                >
                  <ExternalLink size={11} /> Ouvrir
                </Link>
              </motion.div>
            ))}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/6 bg-white/4 px-6 py-4">
              <span className="text-xs text-white/40">
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </span>
              <Link href="/client/factures" className="flex items-center gap-1.5 text-xs font-bold text-[#c9a55a] transition-all hover:gap-2.5 duration-300">
                Nouveau document <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
