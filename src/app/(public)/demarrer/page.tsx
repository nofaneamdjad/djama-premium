"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APPS_DATA } from "@/lib/applications-data";

const FREE_LIMIT = 2;
const ease = [0.22, 1, 0.36, 1] as const;

const cursive: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};


/* ─── Gradient vif pour chaque app ─── */
function iconBg(color: string): string {
  // darken color → lighter color gradient
  return `linear-gradient(145deg, ${color}ee, ${color}bb)`;
}

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

const grouped = CAT_ORDER.map((cat) => ({
  cat,
  apps: APPS_DATA.filter((a) => a.category === cat),
})).filter(({ apps }) => apps.length > 0);

export default function DemarrerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const count = selected.size;
  const atLimit = count >= FREE_LIMIT;

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); }
      else if (next.size < FREE_LIMIT) { next.add(slug); }
      return next;
    });
  }

  return (
    <main className="min-h-screen" style={{ background: "#f5f5f5" }}>

      {/* ── En-tête ── */}
      <section className="px-6 pb-10 pt-24 text-center sm:pt-32" style={{ background: "#fff" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-xl"
        >
          <h1 className="text-[2rem] font-extrabold uppercase tracking-tight text-gray-900 sm:text-[2.8rem]">
            Calculez vos économies
          </h1>
          <p className="mt-3 text-[0.95rem] text-gray-400">
            Sélectionnez les outils que vous utilisez déjà
          </p>
        </motion.div>
      </section>

      {/* ── Bandeau 2 apps gratuites ── */}
      <div className="border-y border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 sm:px-4">
          <p className="text-[0.83rem] text-gray-500">
            <strong className="font-bold text-gray-800">Plan gratuit :</strong>{" "}
            2 applications au choix — sans carte requise.{" "}
            <Link href="/tarification" className="underline" style={{ color: "#4a3f5c" }}>
              Plus avec Standard →
            </Link>
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.65rem] font-extrabold transition-all duration-300"
                style={{
                  borderColor: count >= i ? "#10b981" : "#d1d5db",
                  background: count >= i ? "#10b981" : "transparent",
                  color: count >= i ? "#fff" : "#9ca3af",
                }}
              >
                {count >= i ? "✓" : i}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grille icônes ── */}
      <section className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6">
        {grouped.map(({ cat, apps }, gi) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: gi * 0.05 }}
            className="mb-6"
          >
            {/* Titre de catégorie */}
            <h2 className="mb-3 px-1 text-[1.35rem] text-gray-700" style={cursive}>{cat}</h2>

            {/* Carte blanche contenant les apps */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {apps.map((app) => {
                  const Icon = app.icon;
                  const isSelected = selected.has(app.slug);
                  const isDisabled = atLimit && !isSelected;

                  return (
                    <button
                      key={app.slug}
                      onClick={() => toggle(app.slug)}
                      disabled={isDisabled}
                      className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-all"
                      style={{
                        opacity: isDisabled ? 0.35 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {/* Icône grande */}
                      <div
                        className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[18px] transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: iconBg(app.color),
                          boxShadow: isSelected
                            ? `0 0 0 3px #fff, 0 0 0 5px ${app.color}`
                            : "0 2px 8px rgba(0,0,0,0.12)",
                        }}
                      >
                        <Icon size={28} color="#fff" strokeWidth={1.8} />
                        {/* Badge check */}
                        {isSelected && (
                          <span
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-extrabold text-white"
                            style={{ background: "#10b981", border: "2px solid #fff" }}
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Nom de l'app */}
                      <p className="text-[0.72rem] font-bold leading-tight text-gray-800">
                        {app.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Message limite atteinte */}
        <AnimatePresence>
          {atLimit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-center"
            >
              <p className="text-[0.85rem] text-amber-700">
                Limite de <strong>2 apps gratuites</strong> atteinte.{" "}
                <Link href="/tarification" className="font-extrabold underline">
                  Passer au plan Standard
                </Link>{" "}
                pour tout débloquer.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Barre sticky ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-[0.85rem] text-gray-400">
            {count === 0
              ? "Choisissez jusqu'à 2 applications gratuites"
              : count === 1
              ? "1 / 2 app sélectionnée"
              : "2 / 2 apps gratuites sélectionnées ✓"}
          </p>
          <Link
            href={count > 0 ? "/register" : "#"}
            onClick={(e) => { if (count === 0) e.preventDefault(); }}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.88rem] font-extrabold text-white transition-all"
            style={{
              background: count > 0 ? "#4a3f5c" : "#d1d5db",
              cursor: count > 0 ? "pointer" : "not-allowed",
            }}
          >
            Démarrer maintenant <ArrowRight size={14} />
          </Link>
        </div>
      </div>

    </main>
  );
}
