"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, RefreshCw, Loader2, Search, CheckCircle2,
  XCircle, Clock, Zap, TrendingUp, ChevronLeft, ChevronRight,
  ExternalLink, Users, BarChart3, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { V } from "@/components/hq";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Client {
  id: string; name: string; email: string;
  phone: string | null; company: string | null;
  statut: string | null; created_at: string;
}
interface Sub {
  user_id: string;
  is_active: boolean;
  plan_name: string | null;
  provider: string | null;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  current_period_end: string | null;
  beta_access: boolean | null;
  beta_expires_at: string | null;
  ai_calls_used: number | null;
  updated_at: string;
  clients: Client;
}
interface Stats {
  total: number; actifs: number; inactifs: number;
  mrr_estime: number; beta: number; expirant: number;
}
type Filtre = "tous" | "actif" | "inactif" | "bêta" | "expirant";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function planBadge(plan: string | null) {
  if (!plan) return { label: "—", color: V.textFaint, bg: "transparent" };
  if (plan.includes("entreprise"))  return { label: "Entreprise", color: "#60a5fa", bg: "rgba(96,165,250,0.10)" };
  if (plan.includes("outils") || plan.includes("premium"))
    return { label: "Outils DJAMA", color: V.gold, bg: V.goldDim };
  return { label: plan, color: V.textSub, bg: "rgba(255,255,255,0.05)" };
}

function providerIcon(p: string | null) {
  if (p === "stripe") return "💳";
  if (p === "admin")  return "🔑";
  if (p === "paypal") return "🅿️";
  return "—";
}

// ── Composants ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: V.card, borderColor: V.border }}>
      <div className="flex items-center justify-between">
        <p className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: V.textFaint }}>
          {label}
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}15` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-[1.6rem] font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AbonnementsPage() {
  const [subs,    setSubs]    = useState<Sub[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sLoading, setSLoading] = useState(true);
  const [err,     setErr]     = useState<string | null>(null);
  const [q,       setQ]       = useState("");
  const [filtre,  setFiltre]  = useState<Filtre>("tous");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const fetchStats = useCallback(async () => {
    setSLoading(true);
    try {
      const r = await fetch("/api/admin/subscriptions/stats");
      if (r.ok) setStats(await r.json());
    } finally { setSLoading(false); }
  }, []);

  const fetchSubs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(q      ? { q }          : {}),
        ...(filtre !== "tous" ? { statut: filtre } : {}),
      });
      const r = await fetch(`/api/admin/subscriptions?${params}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setSubs(d.subscriptions ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }, [q, filtre, page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [q, filtre]);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const FILTRES: { id: Filtre; label: string }[] = [
    { id: "tous",     label: "Tous" },
    { id: "actif",    label: "Actifs" },
    { id: "inactif",  label: "Inactifs" },
    { id: "bêta",     label: "Bêta" },
    { id: "expirant", label: "Expirant ≤7j" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight"
            style={{ color: V.text }}>
            <CreditCard size={18} style={{ color: V.gold }} />
            Abonnements
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            {total} abonnement{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchStats(); fetchSubs(true); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.78rem] font-medium transition"
            style={{ borderColor: V.border, color: V.textMuted }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <Link
            href="/admin/plans"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[0.78rem] font-medium transition"
            style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}
          >
            <ExternalLink size={12} />
            Voir les offres
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border animate-pulse"
              style={{ background: V.card, borderColor: V.border }} />
          ))
        ) : stats ? (
          <>
            <StatTile label="Total"         value={stats.total}      color={V.gold}    icon={Users}         />
            <StatTile label="Actifs"         value={stats.actifs}     color="#4ade80"   icon={CheckCircle2}  />
            <StatTile label="Inactifs"       value={stats.inactifs}   color="#f87171"   icon={XCircle}       />
            <StatTile label="MRR estimé"     value={`${stats.mrr_estime}€`} color={V.gold} icon={TrendingUp}
              sub="basé sur les plans actifs" />
            <StatTile label="Bêta actifs"    value={stats.beta}       color="#a78bfa"   icon={Zap}           />
            <StatTile label="Expirant ≤7j"   value={stats.expirant}   color="#fbbf24"   icon={AlertTriangle} />
          </>
        ) : null}
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: V.textFaint }} />
          <input
            type="text"
            placeholder="Rechercher email, nom…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="rounded-xl border bg-transparent py-1.5 pl-8 pr-3 text-[0.8rem] outline-none transition"
            style={{ borderColor: V.border, color: V.text, width: 220 }}
            onFocus={e => (e.target.style.borderColor = V.borderHov)}
            onBlur={e  => (e.target.style.borderColor = V.border)}
          />
        </div>
        {FILTRES.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltre(f.id)}
            className="rounded-xl border px-3 py-1.5 text-[0.78rem] font-semibold transition-all"
            style={{
              borderColor: filtre === f.id ? V.goldBorder : V.border,
              background:  filtre === f.id ? V.goldDim    : "transparent",
              color:       filtre === f.id ? V.gold       : V.textMuted,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Erreur */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <CreditCard size={20} style={{ color: V.textFaint }} />
            </div>
            <p className="text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
              Aucun abonnement trouvé
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Utilisateur", "Plan", "Fournisseur", "Statut", "Bêta", "Expiration", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {subs.map(s => {
                  const badge = planBadge(s.plan_name);
                  const isExpiring = s.current_period_end &&
                    new Date(s.current_period_end) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                    new Date(s.current_period_end) > new Date();
                  return (
                    <tr key={s.user_id} className="transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-5 py-4">
                        <p className="text-[0.83rem] font-semibold" style={{ color: V.text }}>
                          {s.clients?.name ?? "—"}
                        </p>
                        <p className="text-[0.72rem]" style={{ color: V.textFaint }}>
                          {s.clients?.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[0.82rem]" style={{ color: V.textSub }}>
                        {providerIcon(s.provider)} {s.provider ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#4ade80]">
                            <CheckCircle2 size={11} /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#f87171]">
                            <XCircle size={11} /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {s.beta_access ? (
                          <span className="inline-flex items-center gap-1 text-[0.73rem] font-semibold text-[#a78bfa]">
                            <Zap size={10} /> Bêta
                          </span>
                        ) : (
                          <span style={{ color: V.textFaint }} className="text-[0.73rem]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[0.8rem]"
                        style={{ color: isExpiring ? "#fbbf24" : V.textSub }}>
                        {isExpiring && <Clock size={11} className="inline mr-1" />}
                        {fmt(s.current_period_end)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/abonnements/${s.user_id}`}
                          className="rounded-lg border px-2.5 py-1 text-[0.73rem] font-medium transition"
                          style={{ borderColor: V.border, color: V.textMuted }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = V.goldBorder;
                            (e.currentTarget as HTMLAnchorElement).style.color = V.gold;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border;
                            (e.currentTarget as HTMLAnchorElement).style.color = V.textMuted;
                          }}
                        >
                          Gérer →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[0.78rem]" style={{ color: V.textFaint }}>
            Page {page}/{totalPages} — {total} résultats
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[0.78rem] disabled:opacity-40 transition"
              style={{ borderColor: V.border, color: V.textMuted }}
            >
              <ChevronLeft size={14} /> Préc.
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[0.78rem] disabled:opacity-40 transition"
              style={{ borderColor: V.border, color: V.textMuted }}
            >
              Suiv. <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Liens rapides */}
      <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
        <p className="mb-3 text-[0.82rem] font-bold" style={{ color: V.text }}>Actions rapides</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/paiements",      label: "Paiements",        icon: CreditCard   },
            { href: "/admin/remboursements",  label: "Remboursements",   icon: BarChart3    },
            { href: "/admin/coupons",         label: "Coupons",          icon: Zap          },
            { href: "/admin/essais",          label: "Essais gratuits",  icon: Clock        },
            { href: "/admin/resiliations",    label: "Résiliations",     icon: XCircle      },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.78rem] font-medium transition"
              style={{ borderColor: V.border, color: V.textMuted }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = V.borderHov;
                (e.currentTarget as HTMLAnchorElement).style.color = V.text;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = V.border;
                (e.currentTarget as HTMLAnchorElement).style.color = V.textMuted;
              }}
            >
              <Icon size={12} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
