"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, LayoutDashboard, ArrowRight } from "lucide-react";

export default function SplashScreen() {
  const [visible,     setVisible]     = useState(false); // false SSR → évite flash/hydration mismatch
  const [showChoices, setShowChoices] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Première visite de la session uniquement
    if (sessionStorage.getItem("djama_splash_seen")) return;

    sessionStorage.setItem("djama_splash_seen", "1");
    document.body.style.overflow = "hidden";
    setVisible(true); // monté côté client uniquement

    // Après l'animation d'intro → afficher les choix
    const t = setTimeout(() => setShowChoices(true), 1900);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  const handleChoice = (path: string) => {
    document.body.style.overflow = "";
    setVisible(false);
    setTimeout(() => router.push(path), 500);
  };

  return (
    <AnimatePresence onExitComplete={() => { document.body.style.overflow = ""; }}>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white select-none"
        >
          {/* Subtle radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_50%,rgba(99,102,241,0.05),transparent_72%)]" />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 0px rgba(201,165,90,0))",
                  "drop-shadow(0 0 20px rgba(201,165,90,0.35))",
                  "drop-shadow(0 0 4px rgba(201,165,90,0.08))",
                ],
              }}
              transition={{ duration: 1.5, delay: 0.75, ease: "easeOut", times: [0, 0.45, 1] }}
            >
              <Image
                src="/logo-navbar.png"
                alt="DJAMA"
                width={435}
                height={97}
                priority
                className="w-44 sm:w-52 h-auto object-contain"
                style={{ filter: "brightness(0)" }}
              />
            </motion.div>
          </motion.div>

          {/* Divider doré */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 h-px w-10 origin-center rounded-full bg-gradient-to-r from-transparent via-[#c9a55a]/50 to-transparent"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
            className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-gray-400"
          >
            Bienvenue sur DJAMA
          </motion.p>

          {/* ── Choix ─────────────────────────────────────── */}
          <AnimatePresence>
            {showChoices && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 flex flex-col sm:flex-row gap-4 px-6 w-full max-w-sm sm:max-w-none sm:w-auto items-center"
              >
                {/* Site général */}
                <button
                  onClick={() => handleChoice("/")}
                  className="group flex items-center gap-4 px-6 py-4 rounded-2xl
                    border border-gray-200 bg-gray-50
                    hover:bg-white hover:border-gray-300 hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]
                    transition-all duration-200 w-full sm:w-[220px] text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,.06)]">
                    <Globe className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-none mb-1">Site général</p>
                    <p className="text-[11px] text-gray-400 leading-none">Découvrir DJAMA</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                </button>

                {/* Espace client — mis en valeur */}
                <button
                  onClick={() => handleChoice("/espace-client")}
                  className="group flex items-center gap-4 px-6 py-4 rounded-2xl
                    border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.06)]
                    hover:bg-[rgba(201,165,90,0.10)] hover:border-[rgba(201,165,90,0.55)]
                    hover:shadow-[0_4px_20px_rgba(201,165,90,0.15)]
                    transition-all duration-200 w-full sm:w-[220px] text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[rgba(201,165,90,0.10)] border border-[rgba(201,165,90,0.25)] flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-[#c9a55a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-none mb-1">Espace client</p>
                    <p className="text-[11px] text-[#c9a55a]/70 leading-none">Accès à votre tableau de bord</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#c9a55a]/40 group-hover:text-[#c9a55a] flex-shrink-0 transition-colors" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barre de progression — uniquement avant les choix */}
          {!showChoices && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.7, delay: 0.2, ease: "linear" }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
