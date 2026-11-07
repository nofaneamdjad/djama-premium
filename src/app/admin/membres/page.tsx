"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, Search, RefreshCw, Building2 } from "lucide-react";
import { V } from "@/components/hq";

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  organization_id: string;
  org_name?: string;
  user_email?: string;
  user_name?: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "owner" ? `bg-[rgba(${V.goldR},0.10)] text-[${V.gold}]` :
    role === "admin" ? "bg-purple-400/10 text-purple-400" :
    "bg-white/[0.06] text-white/35";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${cls}`}>{role}</span>;
}

export default function MembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membres");
      if (!res.ok) throw new Error("Erreur serveur");
      const { members } = await res.json() as { members: Member[] };
      setMembers(members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter(m =>
    !search ||
    m.org_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.role.includes(search.toLowerCase()) ||
    m.user_id.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Membres</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">{members.length} membre{members.length !== 1 ? "s" : ""} dans les organisations</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70" style={{ borderColor: V.border }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-4 text-[0.82rem] text-white placeholder-white/20 outline-none transition focus:border-white/20" style={{ borderColor: V.border }} />
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div>{[...Array(6)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-3.5" style={{ borderColor: V.border }}>
              <div className="h-8 w-8 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5"><div className="h-3 w-32 rounded bg-white/[0.07]" /><div className="h-2 w-20 rounded bg-white/[0.04]" /></div>
              <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
            </div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <UserCheck size={28} className="text-white/15" />
            <p className="text-[0.85rem] font-semibold text-white/30">Aucun membre</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: V.border }}>
                {["Utilisateur", "Organisation", "Rôle", "Rejoint le"].map(h => (
                  <th key={h} className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className="border-b transition hover:bg-white/[0.02]" style={{ borderColor: i === filtered.length - 1 ? "transparent" : V.border }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[0.6rem] font-black" style={{ background: `rgba(${V.goldR},0.10)`, color: V.gold }}>
                        {m.user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <code className="text-[0.72rem] text-white/40">{m.user_id.slice(0, 16)}…</code>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[0.8rem] text-white/55">
                      <Building2 size={11} className="text-white/25" />
                      {m.org_name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><RoleBadge role={m.role} /></td>
                  <td className="px-5 py-3.5 text-[0.78rem] text-white/30">{fmtDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
