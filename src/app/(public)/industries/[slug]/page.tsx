"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getIndustryBySlug, INDUSTRIES_BY_CATEGORY } from "@/lib/industries-data";
import { getAppBySlug } from "@/lib/applications-data";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-60px" };

const BENEFITS = [
  "Tout inclus dans un seul abonnement",
  "Données 100 % sécurisées et privées",
  "IA native intégrée à chaque outil",
  "Accès immédiat, sans carte requise",
];

export default function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const industry = getIndustryBySlug(slug);
  if (!industry) notFound();

  const { label, category, color, tagline, description, apps: appSlugs } = industry;

  /* Apps DJAMA recommandées pour cette industrie */
  const recommendedApps = appSlugs
    .map((s) => getAppBySlug(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getAppBySlug>>[];

  /* Autres industries de la même catégorie */
  const sameCategory = INDUSTRIES_BY_CATEGORY.find((g) => g.cat === category);
  const related = sameCategory?.items.filter((i) => i.slug !== slug).slice(0, 4) ?? [];

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 px-6 pb-16 pt-32 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-[0.8rem] text-gray-400">
              <Link href="/industries" className="hover:text-gray-700">Industries</Link>
              <span>/</span>
              <span style={{ color }}>{category}</span>
            </div>

            {/* Badge catégorie */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: `${color}40`, background: `${color}0d` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color }}>{category}</span>
            </div>

            <h1 className="text-[2.6rem] font-extrabold leading-[1.08] text-gray-900 sm:text-[3.6rem]">
              {label}
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] font-medium leading-relaxed text-gray-500">
              {tagline}
            </p>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-gray-400">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[0.92rem] font-extrabold text-black transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
              >
                Essayer gratuitement <ArrowRight size={15} />
              </Link>
              <Link
                href="/industries"
                className="inline-flex items-center gap-2 text-[0.88rem] font-medium text-gray-400 hover:text-gray-700"
              >
                <ArrowLeft size={14} /> Toutes les industries
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Apps recommandées ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
        >
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color }}>
            Applications recommandées
          </p>
          <h2 className="text-[1.8rem] font-extrabold text-gray-900 sm:text-[2.2rem]">
            Les outils DJAMA pour {label.toLowerCase()}
          </h2>
          <p className="mt-3 max-w-lg text-[0.95rem] text-gray-500">
            Ces applications sont particulièrement utiles pour votre activité — incluses dans votre abonnement.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommendedApps.map((app, i) => {
            const Icon = app.icon;
            return (
              <motion.div
                key={app.slug}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport} transition={{ duration: 0.45, ease, delay: i * 0.07 }}
              >
                <Link
                  href={`/applications/${app.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${app.color}18` }}>
                    <Icon size={18} style={{ color: app.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-gray-700">{app.label}</p>
                    <p className="mt-0.5 text-[0.83rem] leading-snug text-gray-400 line-clamp-2">
                      {app.hero.subtitle}
                    </p>
                  </div>
                  <ArrowRight size={14} className="mt-1 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Avantages ── */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-14">
        <div className="mx-auto max-w-5xl sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2.5">
                <CheckCircle2 size={16} style={{ color }} className="shrink-0" />
                <span className="text-[0.88rem] font-medium text-gray-700">{b}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Autres industries de la même catégorie ── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
          >
            <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color }}>
              {category} — Voir aussi
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/industries/${ind.slug}`}
                  className="group rounded-xl border border-gray-100 px-4 py-3 text-[0.88rem] font-medium text-gray-600 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  {ind.label} <ArrowRight size={12} className="ml-1 inline opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── CTA final ── */}
      <section className="border-t border-gray-100 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-md"
        >
          <p className="text-[1.6rem] font-extrabold leading-snug text-gray-900 sm:text-[2rem]">
            Prêt à digitaliser votre {label.toLowerCase()} ?
          </p>
          <p className="mt-3 text-[0.9rem] text-gray-400">
            Accès immédiat · Aucune carte requise · IA native incluse
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-[0.95rem] font-extrabold text-black transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
          >
            Commencer gratuitement <ArrowRight size={15} />
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
