"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, Lock } from "lucide-react";
import { APPS_DATA } from "@/lib/applications-data";

const FREE_LIMIT = 2;

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
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        if (next.size < FREE_LIMIT) next.add(slug);
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen" style={{ background: "#f3f3f3" }}>

      {/* ── En-tête ── */}
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
            <h1 className="text-[2.4rem] leading-tight text-gray-900 sm:text-[3.2rem]" style={cursive}>
              Sélectionnez vos Applications
            </h1>
            <div className="mx-auto mt-1.5 h-[4px] w-[65%] rounded-full" style={{ background: "#10b981" }} />
          </div>
          <p className="mt-4 text-[0.95rem] text-gray-500">
            Accès gratuit et instantané. Aucune carte de crédit nécessaire.
          </p>
        </motion.div>
      </section>

      {/* ── Bandeau "2 apps gratuites" ── */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3 sm:px-8">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "#10b98118" }}>
            <Gift size={15} style={{ color: "#10b981" }} />
          </div>
          <p className="text-[0.88rem] text-gray-600">
            <strong className="font-extrabold text-gray-900">Plan gratuit :</strong>{" "}
            choisissez <strong>2 applications</strong> au choix, sans limite d'utilisateurs.
            Ajoutez-en plus avec le plan{" "}
            <Link href="/tarification" className="font-semibold underline" style={{ color: "#4a3f5c" }}>
              Standard
            </Link>.
          </p>

          {/* Compteur visuel */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[0.7rem] font-extrabold transition-all duration-300"
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

      {/* ── Grille des apps ── */}
      <section className="mx-auto max-w-5xl px-6 py-10 pb-28 sm:px-8">
        {grouped.map(({ cat, apps }, gi) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: gi * 0.05 }}
            className="mb-8"
          >
            <h2 className="mb-3 text-[1.5rem] text-gray-800" style={cursive}>{cat}</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => {
                const Icon = app.icon;
                const isSelected = selected.has(app.slug);
                const isDisabled = atLimit && !isSelected;

                return (
                  <button
                    key={app.slug}
                    onClick={() => toggle(app.slug)}
                    disabled={isDisabled}
                    className="relative flex items-center gap-3 rounded-full border bg-white px-4 py-3.5 text-left transition-all"
                    style={{
                      borderColor: isSelected ? app.color : "#e5e7eb",
                      borderWidth: isSelected ? 2 : 1,
                      boxShadow: isSelected ? `0 0 0 3px ${app.color}20` : undefined,
                      opacity: isDisabled ? 0.45 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: app.bg }}
                    >
                      <Icon size={18} style={{ color: app.color }} />
                    </div>

                    <span className="text-[0.92rem] font-semibold text-gray-800">
                      {app.label}
                    </span>

                    <span className="ml-auto shrink-0">
                      {isSelected ? (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[0.7rem] font-bold"
                          style={{ background: app.color }}
                        >
                          ✓
                        </span>
                      ) : isDisabled ? (
                        <Lock size={13} className="text-gray-300" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Message si limite atteinte */}
        <AnimatePresence>
          {atLimit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-center"
            >
              <p className="text-[0.88rem] text-amber-700">
                Vous avez atteint la limite de <strong>2 apps gratuites</strong>.{" "}
                <Link href="/tarification" className="font-bold underline">
                  Passez au plan Standard
                </Link>{" "}
                pour accéder à toutes les applications.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Barre sticky ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-[0.88rem] text-gray-500">
            {count === 0
              ? "Choisissez jusqu'à 2 applications gratuites"
              : count === 1
              ? "1 / 2 app sélectionnée — encore 1 disponible"
              : "2 / 2 apps gratuites sélectionnées"}
          </p>
          <Link
            href={count > 0 ? "/espace-client" : "#"}
            onClick={(e) => { if (count === 0) e.preventDefault(); }}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.9rem] font-extrabold text-white transition-all"
            style={{
              background: count > 0 ? "#4a3f5c" : "#9ca3af",
              cursor: count > 0 ? "pointer" : "not-allowed",
            }}
          >
            Démarrer maintenant <ArrowRight size={15} />
          </Link>
        </div>
      </div>

    </main>
  );
}
