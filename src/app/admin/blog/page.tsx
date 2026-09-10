"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Search, RefreshCw, Edit2, Eye, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";
const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string | null;
  tags: string[] | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BlogPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data } = await sb
        .from("blog_posts")
        .select("id, title, slug, published, created_at, updated_at, tags")
        .order("created_at", { ascending: false });
      setPosts(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase())
  );

  const published = posts.filter(p => p.published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Blog</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">{published} publié{published !== 1 ? "s" : ""} · {posts.length - published} brouillon{posts.length - published !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70" style={{ borderColor: BORDER }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-semibold text-black transition hover:opacity-90" style={{ background: GOLD }}>
            <Plus size={13} /> Nouvel article
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un article..." className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-4 text-[0.82rem] text-white placeholder-white/20 outline-none transition focus:border-white/20" style={{ borderColor: BORDER }} />
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        {loading ? (
          <div>{[...Array(5)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 border-b px-5 py-3.5" style={{ borderColor: BORDER }}>
              <div className="h-9 w-9 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5"><div className="h-3 w-48 rounded bg-white/[0.07]" /><div className="h-2 w-28 rounded bg-white/[0.04]" /></div>
              <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
            </div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={28} className="text-white/15" />
            <p className="text-[0.85rem] font-semibold text-white/30">{search ? "Aucun résultat" : "Aucun article"}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER }}>
                {["Article", "Slug", "Tags", "Créé", "Statut", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="group border-b transition hover:bg-white/[0.02]" style={{ borderColor: i === filtered.length - 1 ? "transparent" : BORDER }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${GOLDR},0.10)` }}>
                        <FileText size={13} style={{ color: GOLD }} />
                      </div>
                      <p className="max-w-[200px] truncate text-[0.83rem] font-semibold text-white/80">{p.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-[0.7rem] text-white/30">{p.slug}</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(p.tags ?? []).slice(0, 2).map(t => (
                        <span key={t} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem] text-white/35">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[0.78rem] text-white/30">{fmtDate(p.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${p.published ? "text-emerald-400 bg-emerald-400/10" : "text-white/30 bg-white/[0.05]"}`}>
                      {p.published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-white/35 transition hover:bg-white/[0.12]"><Edit2 size={10} /></button>
                      <a href={`/blog/${p.slug}`} target="_blank" className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-white/35 transition hover:bg-white/[0.12]"><Eye size={10} /></a>
                      <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/5 text-red-400 transition hover:bg-red-500/15"><Trash2 size={10} /></button>
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
