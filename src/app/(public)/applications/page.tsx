"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APPS_DATA } from "@/lib/applications-data";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-40px" };

/* Regroupe les apps par catégorie */
const categories = Array.from(new Set(APPS_DATA.map((a) => a.category)));
const byCategory = Object.fromEntries(
  categories.map((cat) => [cat, APPS_DATA.filter((a) => a.category === cat)])
);

const totalApps = APPS_DATA.length;

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero compact ── */}
      <section className="border-b border-gray-100 bg-white px-6 pb-14 pt-32 sm:pb-20 sm:pt-40">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-gray-400">
              {totalApps} applications · {categories.length} catégories · 1 abonnement
            </p>
            <h1 className="text-[2.8rem] font-extrabold leading-[1.08] text-gray-900 sm:text-[4rem]">
              Toutes nos applications
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-[1rem] leading-relaxed text-gray-500">
              Des outils professionnels organisés par métier, intégrés nativement et enrichis par l&apos;IA — inclus dans votre abonnement.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/espace-client"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[0.92rem] font-extrabold text-black transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
              >
                Essayer gratuitement <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Grille style Odoo ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24 sm:px-8">
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {categories.map((cat) => {
            const apps = byCategory[cat];
            const firstApp = apps[0];
            const CatIcon = firstApp.icon;
            const catColor = apps.find((a) => a.color)?.color ?? "#6b7280";

            return (
              <motion.div
                key={cat}
                variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
              >
                {/* En-tête catégorie */}
                <div className="mb-4 flex items-center gap-2 border-b-2 pb-3" style={{ borderColor: catColor }}>
                  <CatIcon size={15} style={{ color: catColor }} />
                  <h2
                    className="text-[0.75rem] font-extrabold uppercase tracking-[0.14em]"
                    style={{ color: catColor }}
                  >
                    {cat}
                  </h2>
                </div>

                {/* Liste d'apps */}
                <ul className="flex flex-col gap-0">
                  {apps.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <li key={app.slug}>
                        <Link
                          href={`/applications/${app.slug}`}
                          className="group flex items-start gap-2.5 py-2"
                        >
                          <AppIcon
                            size={15}
                            className="mt-0.5 shrink-0 transition-colors"
                            style={{ color: app.color }}
                          />
                          <div>
                            <span className="block text-[0.9rem] font-medium text-gray-800 group-hover:underline group-hover:decoration-gray-300">
                              {app.label}
                            </span>
                            <span className="block text-[0.73rem] leading-snug text-gray-400">
                              {app.hero.subtitle.split(".")[0]}.
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── CTA bas ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-lg"
        >
          <p className="text-[1.6rem] font-extrabold leading-snug text-gray-900 sm:text-[2rem]">
            Tout ça inclus dans votre abonnement.
          </p>
          <p className="mt-3 text-[0.9rem] text-gray-500">
            Accès immédiat · Aucune carte requise · IA native incluse
          </p>
          <Link
            href="/espace-client"
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
