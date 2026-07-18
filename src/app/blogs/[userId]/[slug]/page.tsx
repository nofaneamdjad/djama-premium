"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

interface BizInfo { name: string; logo: string | null; }

function readTime(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><\/p>/g, "");
}

export default function PublicArticlePage({
  params,
}: {
  params: Promise<{ userId: string; slug: string }>;
}) {
  const { userId, slug } = use(params);

  const [biz,     setBiz]     = useState<BizInfo>({ name: "", logo: null });
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          .select("*")
          .eq("user_id", userId)
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle(),
      ]);
      if (settRes.data) {
        const name = settRes.data.find(r => r.key === "brand.company_name")?.value as string | undefined;
        const logo = settRes.data.find(r => r.key === "brand.logo_url")?.value as string | undefined;
        setBiz({ name: name ?? "", logo: logo ?? null });
      }
      if (artRes.data) setArticle(artRes.data as Article);
      else setNotFound(true);
      setLoading(false);
    })();
  }, [userId, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0e1420]/10 border-t-amber-500" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] text-center px-6">
        <p className="text-4xl mb-3">📄</p>
        <h1 className="text-lg font-black text-[#0e1420] mb-2">Article introuvable</h1>
        <p className="text-sm text-[#0e1420]/40 mb-6">Cet article n'existe pas ou n'est plus publié.</p>
        <Link href={`/blogs/${userId}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-[#0a0a0a] hover:brightness-110 transition-all"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
          <ArrowLeft size={14} /> Retour au blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* Header */}
      <header className="border-b border-black/[0.06] bg-white sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link href={`/blogs/${userId}`}
            className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-[#0e1420]/40 hover:text-[#0e1420]/70 transition-colors">
            <ArrowLeft size={13} /> Retour
          </Link>
          <div className="h-3 w-px bg-[#0e1420]/15 mx-1" />
          {biz.logo ? (
            <Image src={biz.logo} alt={biz.name} width={24} height={24}
              className="h-6 w-6 rounded-lg object-cover border border-black/[0.08]" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black"
              style={{ background: `${GOLD}18`, color: GOLD }}>
              {biz.name.charAt(0).toUpperCase()}
            </div>
          )}
          {biz.name && (
            <span className="text-xs font-bold text-[#0e1420]/60">{biz.name}</span>
          )}
        </div>
      </header>

      {/* Article */}
      <div className="max-w-2xl mx-auto px-5 py-10">
        <motion.article
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {article.tags.map(t => (
                <span key={t}
                  className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: `${GOLD}15`, color: GOLD }}>
                  <Tag size={9} /> {t}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#0e1420] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#0e1420]/35 mb-6 pb-6 border-b border-black/[0.07]">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              {new Date(article.published_at ?? article.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              {readTime(article.content)} min de lecture
            </span>
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-base text-[#0e1420]/60 leading-relaxed mb-7 font-medium border-l-2 pl-4"
              style={{ borderColor: GOLD }}>
              {article.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose-custom text-[#0e1420]/75 leading-relaxed text-[0.92rem]"
            style={{ lineHeight: "1.8" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />

        </motion.article>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-black/[0.06] flex items-center justify-between">
          <Link href={`/blogs/${userId}`}
            className="flex items-center gap-2 text-sm font-semibold text-[#0e1420]/40 hover:text-[#0e1420]/70 transition-colors">
            <ArrowLeft size={14} /> Voir tous les articles
          </Link>
          <p className="text-[0.65rem] text-[#0e1420]/20">Propulsé par DJAMA Premium</p>
        </div>
      </div>

      <style>{`
        .prose-custom h1 { font-size: 1.5rem; font-weight: 900; color: #0e1420; margin: 1.5rem 0 0.75rem; line-height: 1.3; }
        .prose-custom h2 { font-size: 1.2rem; font-weight: 800; color: #0e1420; margin: 1.4rem 0 0.6rem; }
        .prose-custom h3 { font-size: 1rem;   font-weight: 700; color: #0e1420cc; margin: 1.2rem 0 0.5rem; }
        .prose-custom p  { margin-bottom: 1rem; }
        .prose-custom strong { font-weight: 700; color: #0e1420; }
        .prose-custom em { font-style: italic; color: #0e1420aa; }
      `}</style>
    </div>
  );
}
