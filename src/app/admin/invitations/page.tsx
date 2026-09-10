"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Clock, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";
const GOLDR  = "201,165,90";
const GOLD   = "#c9a55a";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string | null;
  expires_at: string | null;
  created_at: string;
  organization_id: string;
  org_name?: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "accepted" || s === "acceptée" ? "text-emerald-400 bg-emerald-400/10" :
    s === "expired" || s === "expirée" ? "text-red-400 bg-red-400/10" :
    "text-amber-400 bg-amber-400/10";
  const label = s === "pending" ? "En attente" : s === "accepted" ? "Acceptée" : s === "expired" ? "Expirée" : s;
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${cls}`}>{label}</span>;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data } = await sb
        .from("organization_invitations")
        .select("id, email, role, status, token, expires_at, created_at, organization_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!data) { setInvitations([]); return; }

      const orgIds = [...new Set(data.map(i => i.organization_id))];
      const { data: orgs } = await sb.from("organizations").select("id, name").in("id", orgIds);
      const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]));

      setInvitations(data.map(inv => ({ ...inv, org_name: orgMap[inv.organization_id] ?? "—" })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending  = invitations.filter(i => i.status === "pending");
  const accepted = invitations.filter(i => i.status === "accepted");
  const expired  = invitations.filter(i => i.status === "expired" || (i.expires_at && new Date(i.expires_at) < new Date() && i.status === "pending"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Invitations</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">
            <span className="text-amber-400">{pending.length} en attente</span>
            {" · "}{accepted.length} acceptées · {expired.length} expirées
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70" style={{ borderColor: BORDER }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        {loading ? (
          <div>{[...Array(5)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-3.5" style={{ borderColor: BORDER }}>
              <div className="h-8 w-8 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5"><div className="h-3 w-40 rounded bg-white/[0.07]" /><div className="h-2 w-24 rounded bg-white/[0.04]" /></div>
              <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
            </div>
          ))}</div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail size={28} className="text-white/15" />
            <p className="text-[0.85rem] font-semibold text-white/30">Aucune invitation</p>
            <p className="text-[0.74rem] text-white/20">Les invitations aux organisations apparaîtront ici</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER }}>
                {["Email", "Organisation", "Rôle", "Expiration", "Statut", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv, i) => (
                <tr key={inv.id} className="group border-b transition hover:bg-white/[0.02]" style={{ borderColor: i === invitations.length - 1 ? "transparent" : BORDER }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl text-[0.6rem] font-black" style={{ background: `rgba(${GOLDR},0.10)`, color: GOLD }}>
                        {inv.email.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[0.82rem] text-white/70">{inv.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem] text-white/45">{inv.org_name}</td>
                  <td className="px-5 py-3.5 text-[0.78rem] capitalize text-white/40">{inv.role}</td>
                  <td className="px-5 py-3.5 text-[0.75rem] text-white/30">
                    {inv.expires_at ? (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {fmtDate(inv.expires_at)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge s={inv.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/5 text-red-400 transition hover:bg-red-500/15">
                        <Trash2 size={10} />
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
