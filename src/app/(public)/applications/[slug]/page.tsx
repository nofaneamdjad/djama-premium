"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Calendar } from "lucide-react";
import { getAppBySlug } from "@/lib/applications-data";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-60px" };

export default function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const AppIcon = app.icon;
  const crossApp = app.crossSell ? getAppBySlug(app.crossSell.slug) : undefined;
  const CrossIcon = crossApp?.icon;

  return (
    <main className="min-h-screen bg-white">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-100 bg-white px-6 pt-[88px]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 py-3 text-[0.8rem] text-gray-400">
          <Link href="/applications" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <ArrowLeft size={13} />
            Toutes les applications
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: app.color }}>{app.category}</span>
          <span>/</span>
          <span className="text-gray-700">{app.label}</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 bg-white px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-12"
          >
            {/* Icône */}
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl shadow-xl sm:h-32 sm:w-32"
              style={{ background: app.bg }}
            >
              <AppIcon size={48} style={{ color: app.color }} strokeWidth={1.6} />
            </div>

            {/* Textes */}
            <div className="flex-1">
              <span
                className="mb-3 inline-block text-[0.72rem] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: app.color }}
              >
                {app.category}
              </span>
              <h1 className="text-[2rem] font-extrabold leading-[1.1] text-gray-900 sm:text-[2.8rem]">
                {app.hero.title}
              </h1>
              <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-gray-500">
                {app.hero.subtitle}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/espace-client"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[0.95rem] font-extrabold text-black shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                >
                  Lancez-vous — C&apos;est gratuit ! <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-[0.95rem] font-medium text-gray-700 transition-all hover:border-gray-300 hover:text-gray-900"
                >
                  <Calendar size={16} />
                  Rencontrer un conseiller
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Proposition de valeur ── */}
      <section className="border-b border-gray-100 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="text-[1.05rem] font-medium leading-relaxed text-gray-600"
          >
            <CheckCircle2
              size={18}
              className="mr-2 inline-block align-middle"
              style={{ color: app.color }}
            />
            {app.valueProposition}
          </motion.p>
        </div>
      </section>

      {/* ── Aperçu (mockup placeholder) ── */}
      <section className="border-b border-gray-100 bg-gray-50 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)` }}
          >
            {/* Barre de navigation simulée */}
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-red-400 opacity-80" />
              <span className="h-3 w-3 rounded-full bg-yellow-400 opacity-80" />
              <span className="h-3 w-3 rounded-full bg-green-400 opacity-80" />
              <div className="ml-4 flex-1 rounded-md bg-white/10 px-3 py-1 text-[0.7rem] text-white/40">
                djama.space/client/{slug}
              </div>
            </div>

            {/* Contenu fictif de l'interface */}
            <div className="px-6 py-10 sm:px-10 sm:py-16">
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: app.bg }}
                >
                  <AppIcon size={24} style={{ color: app.color }} />
                </div>
                <div>
                  <div className="h-3 w-32 rounded-full bg-white/20" />
                  <div className="mt-1.5 h-2 w-20 rounded-full bg-white/10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-4">
                    <div className="mb-3 h-2 w-16 rounded-full bg-white/20" />
                    <div className="h-8 w-20 rounded-lg" style={{ background: `${app.color}40` }} />
                    <div className="mt-3 h-2 w-24 rounded-full bg-white/10" />
                    <div className="mt-1 h-2 w-16 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className="rounded-lg px-4 py-2 text-[0.8rem] font-bold text-black"
                  style={{ background: GOLD }}
                >
                  + Nouveau
                </div>
                <div className="h-8 flex-1 rounded-lg bg-white/5" />
              </div>
            </div>
          </motion.div>

          <p className="mt-4 text-center text-[0.8rem] text-gray-400">
            Interface en cours de développement · Disponible dans votre espace client
          </p>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <h2 className="text-[1.9rem] font-extrabold text-gray-900 sm:text-[2.4rem]">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-3 text-[0.95rem] text-gray-500">
              {app.label} intègre toutes les fonctionnalités clés pour votre activité.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {app.features.map((feat, i) => {
              const FeatIcon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.45, ease, delay: i * 0.06 }}
                  className="flex gap-5 rounded-2xl border border-gray-100 p-6 transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: app.bg }}
                  >
                    <FeatIcon size={22} style={{ color: app.color }} />
                  </div>
                  <div>
                    <h3 className="text-[1rem] font-bold text-gray-900">{feat.title}</h3>
                    <p className="mt-1.5 text-[0.88rem] leading-relaxed text-gray-500">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA central ── */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: `linear-gradient(135deg, ${app.bg} 0%, white 100%)` }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-xl"
        >
          <h2 className="text-[2rem] font-extrabold text-gray-900 sm:text-[2.4rem]">
            Prêt à essayer {app.label} ?
          </h2>
          <p className="mt-3 text-[0.95rem] text-gray-500">
            Accès instantané · Aucune carte de crédit · Inclus dans votre abonnement DJAMA
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace-client"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-[1rem] font-extrabold text-black shadow-lg transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              Commencer gratuitement <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Cross-sell ── */}
      {app.crossSell && crossApp && CrossIcon && (
        <section className="border-t border-gray-100 px-6 py-10">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, ease }}
            >
              <Link
                href={`/applications/${app.crossSell.slug}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-6 transition-all duration-200 hover:border-gray-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: crossApp.bg }}
                  >
                    <CrossIcon size={22} style={{ color: crossApp.color }} />
                  </div>
                  <div>
                    <p className="text-[0.78rem] font-semibold uppercase tracking-wider text-gray-400">
                      Application complémentaire
                    </p>
                    <p className="mt-0.5 text-[0.95rem] font-semibold text-gray-800">
                      {app.crossSell.teaser}
                    </p>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-lg px-4 py-2 text-[0.85rem] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: crossApp.color }}
                >
                  {app.crossSell.label} →
                </span>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}
