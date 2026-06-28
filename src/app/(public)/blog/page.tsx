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
    <div className="min-h-screen bg-white">
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 pt-[108px] sm:px-6 sm:pt-[128px]">
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
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
            Ressources pour entrepreneurs
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
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
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un article…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition hover:border-gray-300 focus:border-[rgba(201,165,90,0.4)]"
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
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
              <div key={i} className="h-60 animate-pulse rounded-[1.5rem] bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 py-20 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)]">
              <BookOpen size={32} className="text-[#c9a55a]/40" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">
                {articles.length === 0 ? "Le blog arrive bientôt" : "Aucun résultat"}
              </p>
              {articles.length === 0 ? (
                <>
                  <p className="mt-2 max-w-sm text-sm text-gray-400">
                    Du contenu est en cours de préparation. Revenez prochainement ou contactez-nous directement.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", boxShadow: "0 4px 16px rgba(201,165,90,0.25)" }}
                    >
                      Nous contacter <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/services"
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
                    >
                      Voir nos services
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Essayez un autre filtre ou mot-clé.</p>
              )}
            </div>
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
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all hover:border-[rgba(201,165,90,0.2)]"
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
                      <h2 className="mb-2 text-base font-extrabold leading-snug text-gray-900 transition group-hover:text-[#c9a55a]">
                        {a.titre}
                      </h2>
                      {a.extrait && (
                        <p className="mb-3 flex-1 text-xs leading-relaxed text-gray-500 line-clamp-3">{a.extrait}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[0.62rem] text-gray-400">
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
