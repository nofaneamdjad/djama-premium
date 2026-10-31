"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Users, RefreshCw, Loader2, UserX, UserCheck,
  ChevronLeft, ChevronRight, ExternalLink, ShieldOff,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id:           string;
  name:         string;
  email:        string;
  phone:        string | null;
  company:      string | null;
  statut:       string | null;
  abonnement:   string | null;
  suspended_at: string | null;
  created_at:   string;
}

interface ListResponse {
  users:      User[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUT_COLORS: Record<string, string> = {
  actif:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  inactif:   "bg-white/5 text-white/40 border-white/10",
  prospect:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  suspendu:  "bg-red-500/15 text-red-400 border-red-500/20",
};

function Badge({ label }: { label: string }) {
  const cls = STATUT_COLORS[label] ?? "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] text-white/30 transition-colors hover:border-white/[0.15] hover:text-white/60 disabled:opacity-30"
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .map((p, i, arr) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && arr[i - 1] !== p - 1 && (
              <span className="text-[0.75rem] text-white/20">…</span>
            )}
            <button
              onClick={() => onChange(p)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-2 text-[0.8rem] font-semibold transition-all ${
                p === page
                  ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a] border border-[rgba(201,165,90,0.3)]"
                  : "border border-white/[0.07] text-white/30 hover:border-white/[0.15] hover:text-white/60"
              }`}
            >
              {p}
            </button>
          </span>
        ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] text-white/30 transition-colors hover:border-white/[0.15] hover:text-white/60 disabled:opacity-30"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function UtilisateursPage() {
  const [data,    setData]    = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState("");
  const [statut,  setStatut]  = useState("");
  const [plan,    setPlan]    = useState("");
  const [page,    setPage]    = useState(1);

  const load = useCallback(async (overrides?: { page?: number; q?: string; statut?: string; plan?: string }) => {
    setLoading(true);
    const p  = overrides?.page   ?? page;
    const sq = overrides?.q      ?? q;
    const ss = overrides?.statut ?? statut;
    const sp = overrides?.plan   ?? plan;

    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (sq) params.set("q", sq);
    if (ss) params.set("statut", ss);
    if (sp) params.set("plan", sp);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, q, statut, plan]);

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load({ page: 1 });
  }

  function handleStatut(v: string) {
    setStatut(v);
    setPage(1);
    load({ page: 1, statut: v });
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users size={20} className="text-[#c9a55a]" />
            Gestion des utilisateurs
          </h1>
          <p className="mt-0.5 text-[0.82rem] text-white/40">
            {data ? `${data.total} utilisateur${data.total !== 1 ? "s" : ""}` : "Chargement…"}
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[0.8rem] text-white/50 transition-colors hover:text-white/80"
        >
          <RefreshCw size={13} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="h-9 w-64 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-8 pr-3 text-[0.82rem] text-white placeholder-white/20 outline-none focus:border-[rgba(201,165,90,0.3)] focus:ring-1 focus:ring-[rgba(201,165,90,0.15)]"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-3 text-[0.8rem] font-medium text-[#c9a55a] transition-colors hover:bg-[rgba(201,165,90,0.15)]"
          >
            Rechercher
          </button>
        </form>

        <div className="flex gap-1.5">
          {[
            { v: "",          label: "Tous" },
            { v: "actif",     label: "Actifs" },
            { v: "inactif",   label: "Inactifs" },
            { v: "suspendu",  label: "Suspendus" },
            { v: "prospect",  label: "Prospects" },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => handleStatut(v)}
              className={`h-8 rounded-lg border px-3 text-[0.75rem] font-medium transition-all ${
                statut === v
                  ? "border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                  : "border-white/[0.07] text-white/40 hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/30">
            <Loader2 size={20} className="animate-spin mr-2" />
            Chargement…
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <Users size={24} />
            <span className="text-[0.85rem]">Aucun utilisateur trouvé</span>
          </div>
        ) : (
          <>
            <table className="w-full text-[0.82rem]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["Utilisateur", "Plan", "Statut", "Inscription", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[0.72rem] font-medium uppercase tracking-wider text-white/25">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.users.map(u => (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white/80">{u.name || "—"}</div>
                      <div className="text-white/35 text-[0.75rem]">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-white/50">
                      {u.abonnement || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={u.suspended_at ? "suspendu" : (u.statut ?? "inactif")} />
                    </td>
                    <td className="px-5 py-3.5 text-white/40 tabular-nums">
                      {fmt(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/utilisateurs/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[0.75rem] text-white/50 transition-colors hover:border-[rgba(201,165,90,0.2)] hover:text-[#c9a55a]"
                      >
                        <ExternalLink size={11} />
                        Fiche
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={p => { setPage(p); load({ page: p }); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
