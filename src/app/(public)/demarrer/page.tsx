"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APPS_DATA } from "@/lib/applications-data";

/* ─── ordre d'affichage des catégories ─── */
const CAT_ORDER = [
  "Finance",
  "Commercial",
  "Ventes",
  "Digital",
  "Opérations",
  "Gestion",
  "Notes",
  "Intelligence",
];

const ease = [0.22, 1, 0.36, 1] as const;

const cursive: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

/* grouper par catégorie dans l'ordre voulu */
const grouped = CAT_ORDER.map((cat) => ({
  cat,
  apps: APPS_DATA.filter((a) => a.category === cat),
})).filter(({ apps }) => apps.length > 0);

export default function DemarrerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <main className="min-h-screen" style={{ background: "#f3f3f3" }}>

      {/* ── En-tête fond blanc/rose ── */}
      <section
        className="border-b border-gray-100 px-6 py-16 text-center"
        style={{ background: "linear-gradient(180deg, #fce8ea 0%, #ffffff 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-4 inline-block">
            <h1
              className="text-[2.4rem] leading-tight text-gray-900 sm:text-[3.2rem]"
              style={cursive}
            >
              Sélectionnez vos Applications
            </h1>
            {/* soulignement vert comme Odoo */}
            <div
              className="mx-auto mt-1.5 h-[4px] w-[65%] rounded-full"
              style={{ background: "#10b981" }}
            />
          </div>
          <p className="mt-4 text-[0.95rem] text-gray-500">
            Accès gratuit et instantané. Aucune carte de crédit nécessaire.
          </p>
        </motion.div>
      </section>

      {/* ── Grille des apps par catégorie ── */}
      <section className="mx-auto max-w-5xl px-6 py-10 pb-28 sm:px-8">
        {grouped.map(({ cat, apps }, gi) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: gi * 0.06 }}
            className="mb-8"
          >
            {/* Titre de catégorie en cursive */}
            <h2
              className="mb-3 text-[1.5rem] text-gray-800"
              style={cursive}
            >
              {cat}
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => {
                const Icon = app.icon;
                const isSelected = selected.has(app.slug);
                return (
                  <button
                    key={app.slug}
                    onClick={() => toggle(app.slug)}
                    className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all hover:shadow-md"
                    style={{
                      borderColor: isSelected ? app.color : "#e5e7eb",
                      borderWidth: isSelected ? 2 : 1,
                      boxShadow: isSelected ? `0 0 0 3px ${app.color}1a` : undefined,
                    }}
                  >
                    {/* Icône colorée */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: app.bg }}
                    >
                      <Icon size={18} style={{ color: app.color }} />
                    </div>

                    <span className="text-[0.92rem] font-semibold text-gray-800">
                      {app.label}
                    </span>

                    {/* Check visuel si sélectionné */}
                    {isSelected && (
                      <span
                        className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[0.65rem] font-bold"
                        style={{ background: app.color }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </section>

      {/* ── Barre sticky en bas ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-[0.88rem] text-gray-500">
            {selected.size === 0
              ? "Sélectionnez au moins une application"
              : `${selected.size} application${selected.size > 1 ? "s" : ""} sélectionnée${selected.size > 1 ? "s" : ""}`}
          </p>
          <Link
            href={selected.size > 0 ? "/espace-client" : "#"}
            onClick={(e) => { if (selected.size === 0) e.preventDefault(); }}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.9rem] font-extrabold text-white transition-all"
            style={{
              background: selected.size > 0 ? "#4a3f5c" : "#9ca3af",
              cursor: selected.size > 0 ? "pointer" : "not-allowed",
            }}
          >
            Démarrer maintenant <ArrowRight size={15} />
          </Link>
        </div>
      </div>

    </main>
  );
}
