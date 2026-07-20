"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Tag, ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  content: string;
}

interface BizInfo { name: string; logo: string | null; }

function readTime(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

export default function PublicBlogPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  const [biz,      setBiz]      = useState<BizInfo>({ name: "Blog", logo: null });
  const [articles, setArticles] = useState<Article[]>([]);
  const [search,   setSearch]   = useState("");
  const [tag,      setTag]      = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      const [settRes, artRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("key, value")
          .eq("user_id", userId)
          .in("key", ["brand.company_name", "brand.logo_url"]),
        supabase
          .from("blog_articles")
          .select("id, title, slug, excerpt, tags, published_at, created_at, content")
          .eq("user_id", userId)
          .eq("status", "published")
          .order("published_at", { ascending: false }),
      ]);
      if (settRes.data) {
        const name = settRes.data.find(r => r.key === "brand.company_name")?.value as string | undefined;
        const logo = settRes.data.find(r => r.key === "brand.logo_url")?.value as string | undefined;
        if (name || logo) setBiz({ name: name ?? "Blog", logo: logo ?? null });
      }
      setArticles(artRes.data ?? []);
      setLoading(false);
    })();
  }, [userId]);

  const allTags = [...new Set(articles.flatMap(a => a.tags))];

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tag || a.tags.includes(tag);
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* Header */}
      <header className="border-b border-black/[0.06] bg-white sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
          {biz.logo ? (
            <Image src={biz.logo} alt={biz.name} width={36} height={36}
              className="h-9 w-9 rounded-xl object-cover border border-black/[0.08]" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border font-black text-sm"
              style={{ background: `${GOLD}18`, borderColor: `${GOLD}35`, color: GOLD }}>
              {biz.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-sm font-black text-[#0e1420]">{biz.name}</h1>
            <p className="text-[10px] text-[#0e1420]/40">{articles.length} article{articles.length !== 1 ? "s" : ""} publié{articles.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 rounded-xl border border-black/[0.08] bg-black/[0.03] px-3 py-1.5">
            <Search size={12} className="text-[#0e1420]/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent text-xs text-[#0e1420]/70 placeholder-[#0e1420]/25 outline-none w-36"
            />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Mobile search */}
        <div className="sm:hidden mb-5 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5">
          <Search size={13} className="text-[#0e1420]/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article…"
            className="bg-transparent text-sm text-[#0e1420]/70 placeholder-[#0e1420]/25 outline-none flex-1"
          />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-7">
            <button onClick={() => setTag("")}
              className="rounded-xl px-3 py-1.5 text-[0.72rem] font-semibold transition-all"
              style={!tag
                ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a" }
                : { background: "rgba(0,0,0,0.05)", color: "rgba(14,20,32,0.45)" }}>
              Tous
            </button>
            {allTags.map(t => (
              <button key={t} onClick={() => setTag(tag === t ? "" : t)}
                className="rounded-xl px-3 py-1.5 text-[0.72rem] font-semibold transition-all"
                style={tag === t
                  ? { background: `${GOLD}22`, borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}40`, color: GOLD }
                  : { background: "rgba(0,0,0,0.05)", color: "rgba(14,20,32,0.45)" }}>
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0e1420]/10 border-t-amber-500" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
              <BookOpen size={28} style={{ color: GOLD, opacity: 0.6 }} />
            </div>
            <p className="text-sm text-[#0e1420]/40">
              {search || tag ? "Aucun article correspond à votre recherche." : "Aucun article publié pour l'instant."}
            </p>
          </motion.div>
        )}

        {/* Articles */}
        <div className="space-y-4">
          {filtered.map((a, i) => (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}>
              <Link href={`/blogs/${userId}/${a.slug}`}
                className="group block rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm hover:shadow-md hover:border-black/[0.12] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black text-[#0e1420] group-hover:text-amber-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="text-sm text-[#0e1420]/55 line-clamp-2 leading-relaxed mb-4">
                        {a.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#0e1420]/35">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(a.published_at ?? a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {readTime(a.content)} min de lecture
                      </span>
                      {a.tags.slice(0, 3).map(t => (
                        <span key={t} className="flex items-center gap-1">
                          <Tag size={9} /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                    style={{ background: `${GOLD}12` }}>
                    <ArrowRight size={15} style={{ color: GOLD }}
                      className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 text-center text-[0.65rem] text-[#0e1420]/20">
          Propulsé par DJAMA Premium
        </p>
      </div>
    </div>
  );
}
