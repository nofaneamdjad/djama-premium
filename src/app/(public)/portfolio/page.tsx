"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type Category = "Tous" | "Sites web" | "Applications" | "Vidéos & Design" | "Automatisation";

interface Project {
  title:       string;
  description: string;
  image:       string;
  category:    Exclude<Category, "Tous">;
  tags:        string[];
  result?:     string;
}

const PROJECTS: Project[] = [
  {
    title:       "Site vitrine premium",
    description: "Conception d'un site web professionnel multi-pages avec animations, SEO optimisé et formulaire de contact.",
    image:       "/services-vitrine.jpg",
    category:    "Sites web",
    tags:        ["Next.js", "Design", "SEO"],
    result:      "+340% de visibilité organique",
  },
  {
    title:       "Boutique e-commerce",
    description: "Création d'une boutique en ligne complète : catalogue produits, panier, paiement Stripe et espace client.",
    image:       "/services-ecommerce.jpg",
    category:    "Sites web",
    tags:        ["E-commerce", "Stripe", "UX"],
    result:      "Mise en ligne en 10 jours",
  },
  {
    title:       "Application mobile UX",
    description: "Application mobile cross-platform avec interface intuitive, onboarding fluide et notifications push.",
    image:       "/services-app-mobile.jpg",
    category:    "Applications",
    tags:        ["React Native", "Push", "UI/UX"],
    result:      "4,8/5 en satisfaction utilisateur",
  },
  {
    title:       "Plateforme web sur-mesure",
    description: "Dashboard de gestion professionnel avec tableaux de bord, reporting temps réel et gestion des accès.",
    image:       "/services-plateforme.jpg",
    category:    "Applications",
    tags:        ["Dashboard", "Supabase", "Analytics"],
    result:      "2h économisées/jour",
  },
  {
    title:       "Montage Reels & Ads",
    description: "Création de contenus vidéo courts percutants pour Instagram, TikTok et Meta Ads — formats optimisés.",
    image:       "/services-montage-video.jpg",
    category:    "Vidéos & Design",
    tags:        ["Reels", "Ads", "After Effects"],
    result:      "+280% d'engagement",
  },
  {
    title:       "Visuels publicitaires",
    description: "Création de visuels statiques et animés pour campagnes digitales : bannières, affiches, flyers.",
    image:       "/services-visuels-pub.jpg",
    category:    "Vidéos & Design",
    tags:        ["Photoshop", "Illustrator", "Branding"],
    result:      "Livrables en 48h",
  },
  {
    title:       "Retouche & Identité photo",
    description: "Retouche professionnelle et cohérence visuelle pour renforcer l'image de marque sur tous les supports.",
    image:       "/services-retouche-photo.jpg",
    category:    "Vidéos & Design",
    tags:        ["Lightroom", "Photoshop", "Branding"],
  },
  {
    title:       "Automatisation IA business",
    description: "Mise en place de workflows automatisés : génération de documents, relances client, reporting hebdo.",
    image:       "/services-automatisation.jpg",
    category:    "Automatisation",
    tags:        ["IA", "Zapier", "No-code"],
    result:      "80% de tâches répétitives supprimées",
  },
  {
    title:       "Sourcing fournisseurs",
    description: "Identification, comparaison et négociation de fournisseurs qualifiés à l'international pour réduire les coûts.",
    image:       "/services-fournisseurs.jpg",
    category:    "Automatisation",
    tags:        ["Sourcing", "Négociation", "International"],
    result:      "−35% sur les coûts d'achat",
  },
];

const FILTERS: Category[] = ["Tous", "Sites web", "Applications", "Vidéos & Design", "Automatisation"];

const STATS = [
  { value: "100+", label: "Projets livrés" },
  { value: "50+",  label: "Clients satisfaits" },
  { value: "4.9",  label: "Note moyenne" },
  { value: "48h",  label: "Délai de réponse" },
];

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState<Category>("Tous");

  const filtered = useMemo(() =>
    activeFilter === "Tous" ? PROJECTS : PROJECTS.filter(p => p.category === activeFilter),
  [activeFilter]);

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#07080e] pt-[120px] pb-16">
        {/* Orb */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[600px] rounded-full blur-[120px]"
            style={{ background: "rgba(201,165,90,0.10)" }}/>
        </div>
        {/* Gold top line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px]"
          style={{ background: "linear-gradient(90deg,transparent 0%,rgba(201,165,90,0.7) 40%,rgba(201,165,90,0.3) 70%,transparent 100%)" }}/>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              Portfolio DJAMA
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
            className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            Nos réalisations
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="mx-auto mt-4 max-w-xl text-base text-white/50"
          >
            Sites web, applications, visuels, automatisation — chaque projet conçu pour générer des résultats concrets.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-medium text-white/35">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Filtres ── */}
      <section className="sticky top-[88px] z-30 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-6 py-3 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition-all duration-200 ${
                activeFilter === f
                  ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.1)] text-[#b08d45]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {f}
              {f !== "Tous" && (
                <span className="ml-1.5 text-[10px] opacity-50">
                  {PROJECTS.filter(p => p.category === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Grille projets ── */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease }}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20"/>
                  {/* Catégorie badge */}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full border border-[rgba(201,165,90,0.4)] bg-black/60 px-2.5 py-1 text-[10px] font-bold text-[#c9a55a] backdrop-blur-sm">
                      {project.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-base font-extrabold text-gray-900">{project.title}</h2>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{project.description}</p>

                  {/* Résultat */}
                  {project.result && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0"/>
                      <span className="text-[11px] font-bold text-emerald-700">{project.result}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#07080e] py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-2xl font-black text-white">Votre projet, notre prochain chef-d&apos;œuvre</h2>
            <p className="mt-3 text-sm text-white/45">
              Décrivez votre besoin — nous vous répondons sous 24h avec une estimation.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", boxShadow: "0 4px 16px rgba(201,165,90,0.3)" }}>
                Démarrer un projet <ArrowRight size={14}/>
              </Link>
              <Link href="/realisations"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-6 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10">
                Voir plus de réalisations <ExternalLink size={13}/>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
