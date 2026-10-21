"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Search, RefreshCw, ChevronLeft, ChevronRight, MailOpen } from "lucide-react";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Kpi  = { total: number; totalMois: number };
type Msg  = { id: string; nom?: string; name?: string; email?: string; message?: string; sujet?: string; created_at: string; lu?: boolean };

export default function SupportPage() {
  const [kpi, setKpi]       = useState<Kpi | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search) p.set("q", search);
    fetch(`/api/admin/hq/support?${p}`)
      .then(r => r.json())
      .then(d => {
        setKpi(d.kpi);
        setMessages(d.messages ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [load]);

  function senderName(m: Msg) { return m.nom ?? m.name ?? "—"; }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Support</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Espace Support</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Messages et demandes clients</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Messages totaux", value: loading ? "—" : String(kpi?.total ?? 0), color: "#3b82f6" },
          { label: "Ce mois",         value: loading ? "—" : String(kpi?.totalMois ?? 0), color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <MessageSquare size={13} style={{ color }} />
            </div>
            <p className="text-[1.5rem] font-black text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
        <Search size={13} className="shrink-0 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, email, message…"
          className="flex-1 bg-transparent text-[0.8rem] text-white/70 outline-none placeholder:text-white/25"
        />
      </div>

      {/* Messages */}
      {loading ? (
        <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: BORDER }}>
          <MessageSquare size={20} className="mx-auto mb-2 text-white/15" />
          <p className="text-[0.82rem] text-white/30">Aucun message</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <div
              key={m.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <button
                onClick={() => setExpanded(e => e === m.id ? null : m.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black bg-white/[0.06] text-white/50">
                  {senderName(m)[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.82rem] font-semibold text-white/85">{senderName(m)}</span>
                    {m.email && <span className="text-[0.72rem] text-white/35">{m.email}</span>}
                    {m.sujet && <span className="text-[0.72rem] text-white/50 italic">— {m.sujet}</span>}
                  </div>
                  {expanded !== m.id && m.message && (
                    <p className="mt-0.5 text-[0.72rem] text-white/30 truncate">{m.message}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {m.lu && <MailOpen size={12} className="text-white/20" />}
                  <span className="text-[0.68rem] text-white/25">
                    {new Date(m.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <ChevronRight size={13} className={`text-white/25 transition-transform ${expanded === m.id ? "rotate-90" : ""}`} />
                </div>
              </button>

              {expanded === m.id && m.message && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: BORDER }}>
                  <p className="text-[0.8rem] text-white/60 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[0.72rem] text-white/30">{total} messages — page {page}/{pages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[0.74rem] text-white/40 disabled:opacity-30"
              style={{ border: `1px solid ${BORDER}` }}>
              <ChevronLeft size={13} /> Précédent
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[0.74rem] text-white/40 disabled:opacity-30"
              style={{ border: `1px solid ${BORDER}` }}>
              Suivant <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
