"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Calendar, Tag, Search } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

interface Article {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  image_url: string | null;
  categorie: string;
  tags: string[];
  published_at: string;
  published: boolean;
}

const CATS = ["Tous", "Conseils", "Outils", "Actualités", "Témoignages", "Guides"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPage() {
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [cat,       setCat]       = useState("Tous");
  const [query,     setQuery]     = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("blog_articles")
        .select("id, titre, slug, extrait, image_url, categorie, tags, published_at, published")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      setArticles((data ?? []) as Article[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = articles.filter(a => {
    const matchCat   = cat === "Tous" || a.categorie === cat;
    const matchQuery = !query || a.titre.toLowerCase().includes(query.toLowerCase()) || a.extrait?.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            <BookOpen size={12} /> Blog & Actualités
          </div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            Ressources pour entrepreneurs
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/45">
            Conseils pratiques, guides et actualités pour développer votre activité avec le digital et l'IA.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(201,165,90,0.4)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  cat === c
                    ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                    : "border-white/8 text-white/40 hover:border-white/15 hover:text-white/65"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Articles grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-60 animate-pulse rounded-[1.5rem] bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <BookOpen size={32} className="text-white/15" />
            <p className="text-base font-semibold text-white/30">
              {articles.length === 0 ? "Aucun article publié pour l'instant" : "Aucun résultat"}
            </p>
            {articles.length === 0 && (
              <p className="text-sm text-white/20">Revenez bientôt — du contenu est en préparation !</p>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: i * 0.05 }}
              >
                <Link href={`/blog/${a.slug}`}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -3 }}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] backdrop-blur-sm transition-all hover:border-[rgba(201,165,90,0.2)]"
                  >
                    {a.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image_url} alt={a.titre} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-[rgba(201,165,90,0.06)]">
                        <BookOpen size={32} className="text-[#c9a55a]/30" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {a.categorie && (
                        <div className="mb-2 flex items-center gap-1.5">
                          <Tag size={10} className="text-[#c9a55a]/60" />
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]/60">
                            {a.categorie}
                          </span>
                        </div>
                      )}
                      <h2 className="mb-2 text-base font-extrabold leading-snug text-white transition group-hover:text-[#c9a55a]">
                        {a.titre}
                      </h2>
                      {a.extrait && (
                        <p className="mb-3 flex-1 text-xs leading-relaxed text-white/45 line-clamp-3">{a.extrait}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[0.62rem] text-white/25">
                          <Calendar size={10} />
                          <span>{fmtDate(a.published_at)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[0.7rem] font-bold text-[#c9a55a]/60 transition group-hover:text-[#c9a55a]">
                          Lire <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
