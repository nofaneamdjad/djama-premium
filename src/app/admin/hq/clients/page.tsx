"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, RefreshCw, ChevronRight, ChevronLeft, Star } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Client = {
  id: string; name: string; email: string; statut: string;
  company?: string; created_at: string;
  access: { espace_premium: boolean; outils_saas: boolean };
};

const STATUT_OPTS = [
  { value: "", label: "Tous" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
  { value: "suspendu", label: "Suspendus" },
];
const PREMIUM_OPTS = [
  { value: "", label: "Tous" },
  { value: "true", label: "Premium" },
  { value: "false", label: "Gratuit" },
];

function StatutBadge({ s }: { s: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    actif:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
    inactif:  { color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
    suspendu: { color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  };
  const s2 = map[s] ?? { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: s2.color, background: s2.bg }}>
      {s}
    </span>
  );
}

export default function HQClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,  setSearch]  = useState("");
  const [statut,  setStatut]  = useState("");
  const [premium, setPremium] = useState("");
  const [page,    setPage]    = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)  p.set("q", search);
    if (statut)  p.set("statut", statut);
    if (premium) p.set("premium", premium);
    p.set("page", String(page));

    fetch(`/api/admin/hq/clients?${p}`)
      .then(r => r.json())
      .then(d => {
        setClients(d.clients ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statut, premium, page]);

  useEffect(() => { setPage(1); }, [search, statut, premium]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Clients</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Clients</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">{total.toLocaleString("fr-FR")} clients enregistrés</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px]" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
          <Search size={13} className="shrink-0 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, entreprise…"
            className="min-w-0 flex-1 bg-transparent text-[0.8rem] text-white/70 outline-none placeholder:text-white/25"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {STATUT_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setStatut(o.value)}
              className="rounded-xl px-3 py-2 text-[0.74rem] font-medium transition-all"
              style={{
                background: statut === o.value ? `rgba(${GOLDR},0.12)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${statut === o.value ? `rgba(${GOLDR},0.3)` : BORDER}`,
                color: statut === o.value ? GOLD : "rgba(255,255,255,0.4)",
              }}
            >{o.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {PREMIUM_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setPremium(o.value)}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[0.74rem] font-medium transition-all"
              style={{
                background: premium === o.value ? `rgba(${GOLDR},0.12)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${premium === o.value ? `rgba(${GOLDR},0.3)` : BORDER}`,
                color: premium === o.value ? GOLD : "rgba(255,255,255,0.4)",
              }}
            >
              {o.value === "true" && <Star size={10} />}
              {o.label}
            </button>
          ))}
        </div>

        <button onClick={load} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.74rem] text-white/30 hover:text-white/60 transition-colors" style={{ border: `1px solid ${BORDER}` }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="py-16 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: BORDER }}>
          <p className="text-[0.82rem] text-white/30">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30">Client</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30 sm:table-cell">Entreprise</th>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30">Accès</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30 md:table-cell">Statut</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30 lg:table-cell">Inscription</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-[0.82rem] font-semibold text-white">{c.name}</p>
                      <p className="text-[0.7rem] text-white/35">{c.email}</p>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="text-[0.78rem] text-white/45">{c.company ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.access.espace_premium ? (
                      <span className="flex items-center gap-1 text-[0.68rem] font-semibold" style={{ color: GOLD }}>
                        <Star size={10} />Premium
                      </span>
                    ) : (
                      <span className="text-[0.68rem] text-white/30">Gratuit</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <StatutBadge s={c.statut ?? "actif"} />
                  </td>
                  <td className="hidden px-5 py-3.5 lg:table-cell">
                    <span className="text-[0.72rem] text-white/30">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="inline-flex items-center gap-1 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors"
                    >
                      Détail <ChevronRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[0.72rem] text-white/30">Page {page} / {pages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[0.74rem] text-white/40 disabled:opacity-30 hover:text-white/70 transition-colors"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <ChevronLeft size={13} /> Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[0.74rem] text-white/40 disabled:opacity-30 hover:text-white/70 transition-colors"
              style={{ border: `1px solid ${BORDER}` }}
            >
              Suivant <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
