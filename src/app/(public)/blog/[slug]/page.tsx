"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Tag, BookOpen } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;

interface Article {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  contenu: string;
  image_url: string | null;
  categorie: string;
  tags: string[];
  published_at: string;
}

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (!data) { setNotFound(true); }
      else { setArticle(data as Article); }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-100 border-t-[#c9a55a]" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <BookOpen size={40} className="text-gray-300" />
        <h1 className="text-xl font-black text-gray-800">Article introuvable</h1>
        <Link href="/blog" className="flex items-center gap-2 text-sm text-[#c9a55a] hover:underline">
          <ArrowLeft size={13} /> Retour au blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(99,102,241,0.04)] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-6">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease }}>
          <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-gray-700">
            <ArrowLeft size={13} /> Retour au blog
          </Link>
        </motion.div>

        {/* Hero image */}
        {article.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8 overflow-hidden rounded-[1.5rem]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image_url} alt={article.titre} className="w-full h-64 object-cover sm:h-80" />
          </motion.div>
        )}

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {article.categorie && (
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[#c9a55a]">
                <Tag size={9} /> {article.categorie}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[0.65rem] text-gray-400">
              <Calendar size={10} />
              {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          <h1 className="mb-4 text-2xl font-black leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
            {article.titre}
          </h1>

          {article.extrait && (
            <p className="mb-8 text-base leading-relaxed text-gray-500 border-l-2 border-[rgba(201,165,90,0.4)] pl-4">
              {article.extrait}
            </p>
          )}
        </motion.div>

        {/* Contenu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
          className="prose prose-lg max-w-none
            prose-headings:text-gray-900 prose-headings:font-extrabold
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-[#6366f1] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-800
            prose-ul:text-gray-600 prose-ol:text-gray-600
            prose-li:marker:text-[#c9a55a]
            prose-blockquote:border-[#c9a55a] prose-blockquote:text-gray-500 prose-blockquote:bg-gray-50
            prose-code:text-[#6366f1] prose-code:bg-gray-100 prose-code:rounded prose-code:px-1
            prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        {/* Tags */}
        {article.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-2 border-t border-gray-200 pt-6"
          >
            {article.tags.map(t => (
              <span key={t} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                #{t}
              </span>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 overflow-hidden rounded-[1.5rem] border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.04)] p-6 text-center"
        >
          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#6366f1]/70">DJAMA PRO</p>
          <h3 className="mb-2 text-lg font-extrabold text-gray-900">Prêt à passer à l'action ?</h3>
          <p className="mb-5 text-sm text-gray-500">Outils de gestion, IA et accompagnement pour développer votre activité.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)] transition hover:opacity-90">
              Demander un devis gratuit →
            </Link>
            <Link href="/blog" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:border-gray-300 hover:text-gray-700">
              <ArrowLeft size={13} /> Autres articles
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
