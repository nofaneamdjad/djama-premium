"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Plus, Download, ArrowRight,
  Loader2, AlertCircle, ReceiptText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

type Facture = {
  id: string;
  numero: string;
  type_document: "Facture" | "Devis";
  client_nom: string;
  client_email: string;
  total_ttc: number;
  total_ht: number;
  date_emission: string | null;
  created_at: string;
  couleur: string;
};

const TYPE_COLOR: Record<string, string> = {
  Facture: "#c9a55a",
  Devis:   "#7c6fcd",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function ListeFactures() {
  const router = useRouter();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    async function load() {
      /* Vérifier la session */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      /* Charger les factures de l'utilisateur */
      const { data, error: sbErr } = await supabase
        .from("factures")
        .select("id, numero, type_document, client_nom, client_email, total_ttc, total_ht, date_emission, created_at, couleur")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (sbErr) {
        setError(sbErr.message);
      } else {
        setFactures(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-6 py-14">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--ink)]">Mes documents</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Toutes vos factures et devis enregistrés</p>
          </div>
          <Link
            href="/client/factures"
            className="btn-primary text-sm"
          >
            <Plus size={15} /> Nouveau document
          </Link>
        </motion.div>

        {/* Chargement */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-[#c9a55a]" />
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Liste vide */}
        {!loading && !error && factures.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[rgba(201,165,90,0.3)] bg-white py-24 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(201,165,90,0.1)]">
              <ReceiptText size={28} className="text-[#c9a55a]" />
            </div>
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Aucun document encore</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Créez votre première facture ou votre premier devis</p>
            <Link href="/client/factures" className="btn-primary mt-6 text-sm">
              <Plus size={14} /> Créer un document
            </Link>
          </motion.div>
        )}

        {/* Table des factures */}
        {!loading && !error && factures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[0_2px_12px_rgba(9,9,11,0.05)]"
          >
            {/* En-tête */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
              {["Type", "Client", "Date", "Montant TTC", ""].map((h) => (
                <span key={h} className="text-[0.6rem] font-extrabold uppercase tracking-widest text-[var(--muted)]">{h}</span>
              ))}
            </div>

            {/* Lignes */}
            {factures.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease, delay: i * 0.04 }}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 border-b border-[var(--border)] px-6 py-4 last:border-0 hover:bg-[var(--surface)] transition-colors duration-200"
              >
                {/* Badge type */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
                  style={{
                    background: `${TYPE_COLOR[f.type_document] ?? "#c9a55a"}15`,
                    color: TYPE_COLOR[f.type_document] ?? "#c9a55a",
                    border: `1px solid ${TYPE_COLOR[f.type_document] ?? "#c9a55a"}30`,
                  }}
                >
                  <FileText size={10} />
                  {f.type_document}
                </span>

                {/* Client */}
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">{f.client_nom || "—"}</p>
                  <p className="text-xs text-[var(--muted)]">{f.numero}</p>
                </div>

                {/* Date */}
                <p className="text-sm text-[var(--muted)]">{fmtDate(f.date_emission ?? f.created_at)}</p>

                {/* Montant */}
                <p className="text-sm font-extrabold text-[var(--ink)]">{fmt(f.total_ttc)}</p>

                {/* Action */}
                <Link
                  href="/client/factures"
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition-all hover:border-[rgba(201,165,90,0.3)] hover:text-[#c9a55a]"
                >
                  <Download size={11} /> PDF
                </Link>
              </motion.div>
            ))}

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
              <span className="text-xs text-[var(--muted)]">{factures.length} document{factures.length > 1 ? "s" : ""}</span>
              <Link href="/client/factures" className="flex items-center gap-1.5 text-xs font-bold text-[#c9a55a] hover:gap-2.5 transition-all duration-300">
                Nouveau document <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
