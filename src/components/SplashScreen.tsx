"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, LayoutDashboard, ArrowRight } from "lucide-react";

export default function SplashScreen() {
  const [visible,     setVisible]     = useState(true);
  const [showChoices, setShowChoices] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Une seule fois par session
    if (sessionStorage.getItem("djama_splash_seen")) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("djama_splash_seen", "1");
    document.body.style.overflow = "hidden";

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
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#09090b] select-none"
        >
          {/* Radial gold glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_50%,rgba(201,165,90,0.09),transparent_72%)]" />

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
                  "drop-shadow(0 0 28px rgba(201,165,90,0.7))",
                  "drop-shadow(0 0 6px rgba(201,165,90,0.15))",
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
              />
            </motion.div>
          </motion.div>

          {/* Divider doré */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 h-px w-10 origin-center rounded-full bg-gradient-to-r from-transparent via-[#c9a55a]/60 to-transparent"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
            className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-white/35"
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
                    border border-white/8 bg-white/[0.04]
                    hover:bg-white/[0.08] hover:border-white/15
                    transition-all duration-200 w-full sm:w-[220px] text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-none mb-1">Site général</p>
                    <p className="text-[11px] text-white/35 leading-none">Découvrir DJAMA</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                </button>

                {/* Espace client — mis en valeur */}
                <button
                  onClick={() => handleChoice("/client")}
                  className="group flex items-center gap-4 px-6 py-4 rounded-2xl
                    border border-[#c9a55a]/25 bg-[#c9a55a]/[0.07]
                    hover:bg-[#c9a55a]/[0.13] hover:border-[#c9a55a]/45
                    transition-all duration-200 w-full sm:w-[220px] text-left
                    shadow-[0_0_24px_rgba(201,165,90,0.08)]"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#c9a55a]/12 border border-[#c9a55a]/20 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-[#c9a55a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-none mb-1">Espace client</p>
                    <p className="text-[11px] text-[#c9a55a]/55 leading-none">Accès à votre tableau de bord</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#c9a55a]/30 group-hover:text-[#c9a55a]/70 flex-shrink-0 transition-colors" />
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
