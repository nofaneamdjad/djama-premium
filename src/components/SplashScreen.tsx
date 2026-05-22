"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const GOLD = "#c9a55a";
const BG   = "#1a1033"; // violet sombre façon Odoo mais aux couleurs DJAMA

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
    setMode(isPWA() ? "pwa" : "web");
  }, []);

  if (mode !== "pwa") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center select-none"
        style={{ background: BG }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.15 }}
          className="flex flex-col items-center mb-14"
        >
          <Image
            src="/logo-navbar.png"
            alt="DJAMA"
            width={435}
            height={97}
            priority
            className="w-36 h-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          {/* Essai gratuit */}
          <p className="mt-4 text-xs font-semibold tracking-widest uppercase"
            style={{ color: `${GOLD}99` }}>
            30 jours d&apos;essai gratuit
          </p>
        </motion.div>

        {/* Boutons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.35 }}
          className="flex flex-col items-center gap-5 w-full px-8 max-w-xs"
        >
          {/* SE CONNECTER */}
          <button
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all active:scale-[0.97]"
            style={{ background: GOLD, color: "#0a0a0a" }}
          >
            Se connecter
          </button>

          {/* Créer un compte */}
          <button
            onClick={() => router.push("/register")}
            className="text-sm font-semibold transition-all"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Créer un compte
          </button>
        </motion.div>

        {/* Lien équipe discret en bas */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => router.push("/membre/login")}
          className="absolute bottom-10 text-xs transition-all"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Connexion espace équipe
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
