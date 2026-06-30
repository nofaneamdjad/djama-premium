"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ArrowRight, Calendar, Tag, Search,
  Star, Lightbulb, Wrench, Newspaper, MessageSquare, Map, Rss,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

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

const CAT_META: Record<string, { Icon: React.ElementType; color: string; desc: string }> = {
  Conseils:     { Icon: Lightbulb,     color: GOLD,      desc: "Stratégies & bonnes pratiques" },
  Outils:       { Icon: Wrench,        color: "#a78bfa",  desc: "Apps, IA & automatisation" },
  Actualités:   { Icon: Newspaper,     color: "#38bdf8",  desc: "News du digital & de l'IA" },
  Témoignages:  { Icon: MessageSquare, color: "#4ade80",  desc: "Retours d'expérience clients" },
  Guides:       { Icon: Map,           color: "#f97316",  desc: "Tutoriels pas à pas" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const COMING_TOPICS = [
  { Icon: Lightbulb,     color: GOLD,     title: "Marchés publics",      desc: "Comment répondre à un appel d'offres en 5 étapes" },
  { Icon: Wrench,        color: "#a78bfa", title: "IA & productivité",    desc: "Les meilleurs outils IA pour entrepreneurs en 2026" },
  { Icon: Newspaper,     color: "#38bdf8", title: "Aides & subventions",  desc: "Les aides disponibles pour les TPE en 2026" },
  { Icon: MessageSquare, color: "#4ade80", title: "Témoignages clients",  desc: "Comment WEWE a décroché son premier marché public" },
  { Icon: Map,           color: "#f97316", title: "Guide fournisseurs",   desc: "Sourcing : trouver les meilleurs fournisseurs" },
  { Icon: BookOpen,      color: "#f472b6", title: "Coaching IA",          desc: "Utiliser ChatGPT pour rédiger vos devis en 2 min" },
];

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [cat,      setCat]      = useState("Tous");
  const [query,    setQuery]    = useState("");

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
    <main className="overflow-x-hidden">

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-4 pb-20 pt-32 sm:pb-28 sm:pt-44"
        style={{ background: "linear-gradient(160deg, #1a0e30 0%, #0d1829 50%, #071525 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[120px]" style={{ background: `rgba(201,165,90,0.07)` }} />
          <div className="absolute right-0 bottom-0 h-[250px] w-[250px] rounded-full bg-[rgba(167,139,250,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: GOLD + "35", backgroundColor: GOLD + "10" }}>
              <Rss size={11} style={{ color: GOLD }} />
              Blog & Actualités
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl md:text-[3.4rem]"
          >
            Ressources pour<br />
            <span style={{ color: GOLD }}>entrepreneurs.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.18 }}
            className="mx-auto mt-5 max-w-xl text-base text-white/45 sm:text-lg"
          >
            Conseils pratiques, guides et actualités pour développer votre activité avec le digital et l&apos;IA.
          </motion.p>

          {/* Search bar inline in hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.28 }}
            className="mx-auto mt-8 max-w-md"
          >
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un article…"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-[rgba(201,165,90,0.4)] focus:bg-white/[0.10]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FILTRES + CONTENU ═════════════════════════════════ */}
      <section className="bg-[#f5f5f8] px-4 py-10">
        <div className="mx-auto max-w-5xl">

          {/* Filtres catégories */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="rounded-full border px-4 py-2 text-xs font-bold transition-all duration-150"
                style={cat === c ? {
                  borderColor: GOLD + "40",
                  backgroundColor: GOLD + "12",
                  color: GOLD,
                } : {
                  borderColor: "var(--border)",
                  backgroundColor: "white",
                  color: "var(--muted)",
                }}
              >
                {c}
              </button>
            ))}
          </motion.div>

          {/* Grid articles / squelettes / état vide */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/60 border border-[var(--border)]" />
                ))}
              </motion.div>

            ) : filtered.length > 0 ? (
              <motion.div
                key="articles"
                variants={staggerContainerFast}
                initial="hidden"
                animate="visible"
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((a) => (
                  <motion.div key={a.id} variants={cardReveal}>
                    <Link href={`/blog/${a.slug}`}>
                      <motion.div
                        whileHover={{ scale: 1.02, y: -3 }}
                        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[rgba(201,165,90,0.25)]"
                      >
                        {a.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.image_url} alt={a.titre} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="flex h-44 w-full items-center justify-center" style={{ background: GOLD + "08" }}>
                            <BookOpen size={28} style={{ color: GOLD + "50" }} />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-5">
                          {a.categorie && (
                            <div className="mb-2 flex items-center gap-1.5">
                              <Tag size={9} style={{ color: GOLD + "80" }} />
                              <span className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: GOLD + "80" }}>{a.categorie}</span>
                            </div>
                          )}
                          <h2 className="mb-2 text-sm font-extrabold leading-snug text-[var(--ink)] transition group-hover:text-[#c9a55a]">
                            {a.titre}
                          </h2>
                          {a.extrait && (
                            <p className="mb-3 flex-1 text-xs leading-relaxed text-[var(--muted)] line-clamp-3">{a.extrait}</p>
                          )}
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[0.6rem] text-[var(--muted)]">
                              <Calendar size={9} />
                              <span>{fmtDate(a.published_at)}</span>
                            </div>
                            <span className="flex items-center gap-1 text-[0.65rem] font-bold transition" style={{ color: GOLD + "70" }}>
                              Lire <ArrowRight size={10} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

            ) : articles.length > 0 ? (
              /* Aucun résultat pour ce filtre */
              <motion.div key="no-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border)] bg-white">
                  <Search size={24} style={{ color: GOLD + "60" }} />
                </div>
                <p className="text-lg font-black text-[var(--ink)]">Aucun résultat</p>
                <p className="text-sm text-[var(--muted)]">Essayez un autre filtre ou mot-clé.</p>
                <button onClick={() => { setCat("Tous"); setQuery(""); }}
                  className="mt-2 rounded-2xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:border-[rgba(201,165,90,0.3)]">
                  Réinitialiser
                </button>
              </motion.div>

            ) : (
              /* Blog vide — état "bientôt" */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Annonce */}
                <div className="mb-10 overflow-hidden rounded-3xl border border-[var(--border)] bg-white px-8 py-10 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: GOLD + "12", border: `1px solid ${GOLD}30` }}>
                    <Rss size={22} style={{ color: GOLD }} />
                  </div>
                  <h2 className="text-xl font-black text-[var(--ink)]">Le blog arrive bientôt</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                    Du contenu de qualité est en cours de préparation — conseils, guides et actualités pour les entrepreneurs.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/contact"
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black transition hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 16px rgba(201,165,90,0.25)` }}>
                      Nous contacter <ArrowRight size={14} />
                    </Link>
                    <Link href="/services"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]">
                      Voir nos services
                    </Link>
                  </div>
                </div>

                {/* Aperçu des sujets à venir */}
                <FadeReveal className="mb-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Sujets à venir</p>
                </FadeReveal>

                <motion.div
                  variants={staggerContainerFast}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewport}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {COMING_TOPICS.map(({ Icon, color, title, desc }) => (
                    <motion.div
                      key={title}
                      variants={cardReveal}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all duration-200"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}0d 0%, transparent 60%)` }} />
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-widest"
                        style={{ color: color + "cc", borderColor: color + "25", backgroundColor: color + "0d" }}>
                        <Icon size={9} />
                        Bientôt
                      </div>
                      <p className="text-sm font-extrabold text-[var(--ink)]">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ CTA NEWSLETTER ════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ background: "linear-gradient(160deg, #1a0e30 0%, #0d1829 55%, #071525 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" style={{ background: `rgba(201,165,90,0.06)` }} />
        </div>
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <FadeReveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, borderColor: GOLD + "35", backgroundColor: GOLD + "10" }}>
              <Star size={10} fill={GOLD} style={{ color: GOLD }} />
              Restez informé
            </div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ne manquez aucun article.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
              Recevez nos meilleurs guides et actualités directement dans votre boîte mail — sans spam.
            </p>
          </FadeReveal>
          <FadeReveal delay={0.1}>
            <Link
              href="/contact"
              className="group relative mt-7 inline-flex items-center gap-2 overflow-hidden rounded-2xl px-8 py-3.5 text-sm font-extrabold text-black transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 20px rgba(201,165,90,0.3)` }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">Nous contacter <ArrowRight size={14} /></span>
            </Link>
          </FadeReveal>
        </div>
      </section>

    </main>
  );
}
