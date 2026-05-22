"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Sparkles, Shield, Zap, ArrowRight } from "lucide-react";

const GOLD = "#c9a55a";

/** Détecte si l'app tourne en mode PWA (standalone) */
function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

export default function SplashScreen() {
  const [mode, setMode] = useState<"idle" | "pwa" | "web">("idle");
  const router = useRouter();

  useEffect(() => {
    const pwa = isPWA();
    if (pwa) {
      setMode("pwa");
    } else {
      // Navigateur web → pas de splash, on laisse la page s'afficher directement
      setMode("web");
    }
  }, []);

  // En mode web : rien à afficher
  if (mode === "web" || mode === "idle") return null;

  // En mode PWA : écran d'accueil dédié
  return (
    <AnimatePresence>
      {mode === "pwa" && (
        <motion.div
          initial={{ opacity: 1 }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-between bg-[#0a0f1e] select-none overflow-y-auto"
        >
          {/* Fond dégradé */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%,rgba(201,165,90,0.08),transparent 70%)" }} />

          {/* Contenu centré */}
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-xs mx-auto px-6 py-12 gap-8">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16,1,0.3,1], delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <Image
                src="/logo-navbar.png"
                alt="DJAMA"
                width={435}
                height={97}
                priority
                className="w-40 h-auto object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <div className="h-px w-8 rounded-full" style={{ background: `rgba(${GOLD},0.5)` }} />
            </motion.div>

            {/* Badge essai */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16,1,0.3,1], delay: 0.35 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(201,165,90,0.12)", border: "1px solid rgba(201,165,90,0.3)", color: GOLD }}
            >
              <Sparkles size={11} />
              30 jours d&apos;essai gratuit
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.5 }}
              className="flex flex-col gap-3 w-full"
            >
              {[
                { icon: Zap,    color: "#60a5fa", text: "Facturation, devis et gestion" },
                { icon: Shield, color: "#4ade80", text: "Planning, équipe et CRM" },
                { icon: Sparkles, color: GOLD,   text: "Assistant IA intégré" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${f.color}15` }}>
                    <f.icon size={13} style={{ color: f.color }} />
                  </div>
                  <p className="text-sm text-white/60">{f.text}</p>
                </div>
              ))}
            </motion.div>

            {/* Boutons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.7 }}
              className="flex flex-col gap-3 w-full"
            >
              {/* Créer un compte */}
              <button
                onClick={() => router.push("/register")}
                className="flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}
              >
                <div className="flex items-center gap-2">
                  <UserPlus size={15} />
                  Créer un compte
                </div>
                <ArrowRight size={14} />
              </button>

              {/* Se connecter */}
              <button
                onClick={() => router.push("/login")}
                className="flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
              >
                <div className="flex items-center gap-2">
                  <LogIn size={15} />
                  Se connecter
                </div>
                <ArrowRight size={14} className="text-white/30" />
              </button>

              {/* Espace équipe (membre) */}
              <button
                onClick={() => router.push("/membre/login")}
                className="text-xs text-white/25 hover:text-white/45 transition-colors text-center mt-1"
              >
                Connexion espace équipe →
              </button>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[10px] text-white/15 pb-6 text-center px-6"
          >
            Sans carte bancaire · Annulable à tout moment
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
