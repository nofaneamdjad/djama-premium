"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APPS_DATA } from "@/lib/applications-data";
import AppLogo from "@/components/AppLogos";

const ease = [0.22, 1, 0.36, 1] as const;

const categories = Array.from(new Set(APPS_DATA.map((a) => a.category)));
const byCategory = Object.fromEntries(
  categories.map((cat) => [cat, APPS_DATA.filter((a) => a.category === cat)])
);

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:pt-40">

        {/* Titre style Odoo */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-14 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
        >
          Un besoin,{" "}
          <span className="italic" style={{ color: "#c9a55a" }}>une app.</span>
        </motion.h1>

        {/* Catégories */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="flex flex-col gap-12"
        >
          {categories.map((cat) => {
            const apps = byCategory[cat];
            return (
              <motion.div
                key={cat}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
              >
                {/* En-tête catégorie */}
                <h2 className="mb-4 text-xl font-bold text-gray-900">{cat}</h2>

                {/* Liste apps — style Odoo : 1 colonne, logo + nom + desc */}
                <div className="flex flex-col gap-3">
                  {apps.map((app) => (
                    <Link
                      key={app.slug}
                      href={`/applications/${app.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 transition-all duration-150 hover:border-gray-200 hover:bg-white hover:shadow-sm"
                    >
                      {/* Logo SVG illustré */}
                      <AppLogo slug={app.slug} size={42} bg={app.bg} />

                      {/* Nom + description */}
                      <div className="min-w-0">
                        <p className="text-[0.88rem] font-semibold leading-snug text-gray-800 group-hover:text-gray-900">
                          {app.label}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-gray-400">
                          {app.valueProposition}
                        </p>
                      </div>

                      {/* Flèche hover */}
                      <svg
                        className="ml-auto shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </main>
  );
}
