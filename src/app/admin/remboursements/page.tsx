"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Undo2, RefreshCw, Loader2, CheckCircle2, XCircle,
  AlertTriangle, TrendingDown,
} from "lucide-react";
import { V } from "@/components/hq";

interface Remboursement {
  id: string; reference: string; client_name: string; client_email: string;
  total: number; payment_status: string; payment_method: string | null;
  issue_date: string | null; updated_at: string;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type Filtre = "tous" | "remboursée" | "annulée";

export default function RemboursementsPage() {
  const [rows,     setRows]     = useState<Remboursement[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);
  const [filtre,   setFiltre]   = useState<Filtre>("tous");
  const [total,    setTotal]    = useState(0);
  const [totalR,   setTotalR]   = useState(0);
  const [acting,   setActing]   = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const params = filtre !== "tous" ? `?statut=${filtre}` : "";
      const r = await fetch(`/api/admin/remboursements${params}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setRows(d.remboursements ?? []);
      setTotal(d.total ?? 0);
      setTotalR(d.total_rembourse ?? 0);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, [filtre]);

  useEffect(() => { load(); }, [load]);

  async function process(invoiceId: string, action: "approuver" | "refuser") {
    setActing(invoiceId);
    try {
      const r = await fetch("/api/admin/remboursements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, action }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      await load(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setActing(null); }
  }

  const FILTRES: { id: Filtre; label: string }[] = [
    { id: "tous",       label: "Tous" },
    { id: "remboursée", label: "Remboursés" },
    { id: "annulée",    label: "Annulés" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <Undo2 size={18} style={{ color: V.gold }} />
            Remboursements
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            {total} enregistrement{total !== 1 ? "s" : ""} — Total remboursé :{" "}
            <span style={{ color: "#f87171", fontWeight: 700 }}>
              {totalR.toLocaleString("fr-FR")}€
            </span>
          </p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.78rem] font-medium transition"
          style={{ borderColor: V.border, color: V.textMuted }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* KPI */}
      <div className="flex gap-3">
        <div className="rounded-2xl border p-4 flex items-center gap-3"
          style={{ background: V.card, borderColor: V.border }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(248,113,113,0.10)" }}>
            <TrendingDown size={15} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
              Remboursé
            </p>
            <p className="text-[1.2rem] font-black" style={{ color: "#f87171" }}>
              {totalR.toLocaleString("fr-FR")}€
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {FILTRES.map(f => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className="rounded-xl border px-3 py-1.5 text-[0.78rem] font-semibold transition"
            style={{
              borderColor: filtre === f.id ? V.goldBorder : V.border,
              background:  filtre === f.id ? V.goldDim    : "transparent",
              color:       filtre === f.id ? V.gold       : V.textMuted,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Erreur */}
      {err && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Undo2 size={28} style={{ color: V.textFaint }} />
            <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
              Aucun remboursement
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Référence", "Client", "Montant", "Méthode", "Statut", "Date", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {rows.map(r => (
                  <tr key={r.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    className="transition-colors">
                    <td className="px-5 py-4 text-[0.78rem] font-mono" style={{ color: V.textSub }}>
                      {r.reference}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[0.83rem] font-semibold" style={{ color: V.text }}>{r.client_name}</p>
                      <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{r.client_email}</p>
                    </td>
                    <td className="px-5 py-4 text-[0.88rem] font-bold" style={{ color: "#f87171" }}>
                      -{Number(r.total).toLocaleString("fr-FR")}€
                    </td>
                    <td className="px-5 py-4 text-[0.8rem]" style={{ color: V.textSub }}>
                      {r.payment_method ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${
                        r.payment_status === "remboursée"
                          ? "bg-[rgba(74,222,128,0.10)] text-[#4ade80]"
                          : "bg-[rgba(255,255,255,0.05)] text-white/30"
                      }`}>
                        {r.payment_status === "remboursée"
                          ? <CheckCircle2 size={10} />
                          : <XCircle size={10} />
                        }
                        {r.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[0.8rem]" style={{ color: V.textSub }}>
                      {fmt(r.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                      {r.payment_status !== "remboursée" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => process(r.id, "approuver")}
                            disabled={acting === r.id}
                            className="rounded-lg border px-2.5 py-1 text-[0.73rem] font-semibold transition"
                            style={{ borderColor: "rgba(74,222,128,0.25)", color: "#4ade80", background: "rgba(74,222,128,0.08)" }}
                          >
                            {acting === r.id ? <Loader2 size={11} className="animate-spin inline" /> : "✓ Approuver"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
