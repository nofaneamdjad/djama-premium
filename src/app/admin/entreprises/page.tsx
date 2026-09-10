"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Search, RefreshCw, ExternalLink, Mail, Users } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  owner_id: string | null;
  logo_url: string | null;
  created_at: string;
  member_count?: number;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function PlanBadge({ plan }: { plan: string | null }) {
  const cls =
    plan === "premium" || plan === "pro" ? "text-amber-400 bg-amber-400/10" :
    plan === "team" || plan === "business" ? "text-purple-400 bg-purple-400/10" :
    "text-white/30 bg-white/[0.05]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${cls}`}>
      {plan ?? "gratuit"}
    </span>
  );
}

export default function EntreprisesPage() {
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data } = await sb
        .from("organizations")
        .select("id, name, slug, plan, owner_id, logo_url, created_at")
        .order("created_at", { ascending: false });

      if (!data) { setOrgs([]); return; }

      /* Compter les membres par org */
      const withCounts = await Promise.all(
        data.map(async (org) => {
          const { count } = await sb
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);
          return { ...org, member_count: count ?? 0 };
        })
      );
      setOrgs(withCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orgs.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Entreprises</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">{orgs.length} organisation{orgs.length !== 1 ? "s" : ""} enregistrée{orgs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70"
          style={{ borderColor: BORDER }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise..."
          className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-4 text-[0.82rem] text-white placeholder-white/20 outline-none transition focus:border-white/20"
          style={{ borderColor: BORDER }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        {loading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-4" style={{ borderColor: BORDER }}>
                <div className="h-9 w-9 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 rounded bg-white/[0.07]" />
                  <div className="h-2 w-24 rounded bg-white/[0.04]" />
                </div>
                <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
                <div className="h-3 w-10 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 size={28} className="text-white/15" />
            <p className="text-[0.85rem] font-semibold text-white/30">Aucune entreprise</p>
            {search && <p className="text-[0.75rem] text-white/20">Aucun résultat pour &ldquo;{search}&rdquo;</p>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER }}>
                {["Entreprise", "Slug", "Plan", "Membres", "Créée le"].map(h => (
                  <th key={h} className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id} className="group border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.65rem] font-black"
                        style={{ background: `rgba(${GOLDR},0.10)`, color: GOLD }}
                      >
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[0.84rem] font-semibold text-white/80">{org.name}</p>
                        {org.owner_id && (
                          <p className="text-[0.68rem] text-white/25">owner: {org.owner_id.slice(0, 8)}…</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-[0.72rem] text-white/45">{org.slug}</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <PlanBadge plan={org.plan} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[0.8rem] text-white/50">
                      <Users size={11} className="text-white/25" />
                      {org.member_count}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[0.78rem] text-white/30">{fmtDate(org.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={`mailto:admin@djama.fr?subject=Org: ${org.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/35 transition hover:bg-white/[0.12] hover:text-white/70"
                      >
                        <Mail size={11} />
                      </a>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/35 transition hover:bg-white/[0.12] hover:text-white/70">
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
