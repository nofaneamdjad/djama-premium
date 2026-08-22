"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APPS_DATA } from "@/lib/applications-data";

const ease = [0.22, 1, 0.36, 1] as const;

/* Regroupe les apps par catégorie */
const categories = Array.from(new Set(APPS_DATA.map((a) => a.category)));
const byCategory = Object.fromEntries(
  categories.map((cat) => [cat, APPS_DATA.filter((a) => a.category === cat)])
);

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Grille style Odoo ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 pt-32 sm:py-24 sm:pt-40 sm:px-8">
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {categories.map((cat) => {
            const apps = byCategory[cat];
            const catColor = apps.find((a) => a.color)?.color ?? "#6b7280";

            return (
              <motion.div
                key={cat}
                variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
              >
                {/* En-tête catégorie */}
                <div className="mb-3 border-b-2 pb-2" style={{ borderColor: catColor }}>
                  <h2
                    className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em]"
                    style={{ color: catColor }}
                  >
                    {cat}
                  </h2>
                </div>

                {/* Liste d'apps — texte seul, style Odoo */}
                <ul className="flex flex-col">
                  {apps.map((app) => (
                    <li key={app.slug}>
                      <Link
                        href={`/applications/${app.slug}`}
                        className="block py-1 text-[0.88rem] text-gray-700 hover:text-gray-900 hover:underline hover:decoration-gray-300"
                      >
                        {app.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

    </main>
  );
}
