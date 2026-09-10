"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { APPS_DATA } from "@/lib/applications-data";
import { supabase } from "@/lib/supabase";

const FREE_LIMIT = 2;
const ease = [0.22, 1, 0.36, 1] as const;

const cursive: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

function iconBg(color: string): string {
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
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const count = selected.size;
  const atLimit = count >= FREE_LIMIT;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); }
      else if (next.size < FREE_LIMIT) { next.add(slug); }
      return next;
    });
  }

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (count === 0) return;

    const slugs = Array.from(selected);

    if (isLoggedIn) {
      // Utilisateur déjà connecté → sauvegarder directement
      setSaving(true);
      setError("");
      try {
        const res = await fetch("/api/free-plan/save-apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.locked) {
            // Déjà verrouillé — aller au dashboard quand même
            router.push("/client");
            return;
          }
          throw new Error(data.error ?? "Erreur lors de la sauvegarde");
        }
        router.push("/client");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inattendue");
        setSaving(false);
      }
    } else {
      // Non connecté → sauvegarder en localStorage et aller à /register
      try {
        localStorage.setItem("djama_pending_apps", JSON.stringify(slugs));
      } catch {}
      router.push("/register");
    }
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
            Choisissez vos 2 applications
          </h1>
          <p className="mt-3 text-[0.95rem] text-gray-400">
            Plan gratuit · 2 apps au choix · Sans carte bancaire · Accès illimité
          </p>
        </motion.div>
      </section>

      {/* ── Bandeau ── */}
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
            <h2 className="mb-3 px-1 text-[1.35rem] text-gray-700" style={cursive}>{cat}</h2>

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
                      disabled={isDisabled || saving}
                      className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-all"
                      style={{
                        opacity: isDisabled ? 0.35 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
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
                        {isSelected && (
                          <span
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-extrabold text-white"
                            style={{ background: "#10b981", border: "2px solid #fff" }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
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
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          {error && (
            <p className="text-[0.78rem] text-red-500">{error}</p>
          )}
          {!error && (
            <p className="text-[0.85rem] text-gray-400">
              {count === 0
                ? "Choisissez jusqu'à 2 applications gratuites"
                : count === 1
                ? "1 / 2 app sélectionnée"
                : "2 / 2 apps gratuites sélectionnées ✓"}
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={count === 0 || saving}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[0.88rem] font-extrabold text-white transition-all"
            style={{
              background: count > 0 && !saving ? "#4a3f5c" : "#d1d5db",
              cursor: count > 0 && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Enregistrement…</>
            ) : (
              <>Démarrer maintenant <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>

    </main>
  );
}
