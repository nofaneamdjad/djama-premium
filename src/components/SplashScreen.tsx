"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const GOLD = "#c9a55a";
const BG   = "#1a1033";

function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

export default function SplashScreen() {
  const [show,    setShow]    = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);

  useEffect(() => {
    // Afficher uniquement sur la page d'accueil "/" en mode PWA
    if (isPWA() && window.location.pathname === "/") {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function go(path: string) {
    setPressed(path);
    setTimeout(() => { window.location.href = path; }, 120);
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: BG, touchAction: "manipulation" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.1 }}
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
        <p className="mt-4 text-xs font-semibold tracking-widest uppercase"
          style={{ color: `${GOLD}80` }}>
          30 jours d&apos;essai gratuit
        </p>
      </motion.div>

      {/* Boutons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16,1,0.3,1], delay: 0.3 }}
        className="flex flex-col items-center gap-4 w-full px-8"
        style={{ maxWidth: 320 }}
      >
        {/* SE CONNECTER */}
        <a
          href="/login"
          onClick={(e) => { e.preventDefault(); go("/login"); }}
          className="w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase text-center block"
          style={{
            background: pressed === "/login" ? "#a07840" : GOLD,
            color: "#0a0a0a",
            transform: pressed === "/login" ? "scale(0.97)" : "scale(1)",
            transition: "transform 0.1s, background 0.1s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {pressed === "/login" ? "Chargement…" : "Se connecter"}
        </a>

        {/* Créer un compte */}
        <a
          href="/register"
          onClick={(e) => { e.preventDefault(); go("/register"); }}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-center block"
          style={{
            background: pressed === "/register" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.12)",
            transition: "all 0.1s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {pressed === "/register" ? "Chargement…" : "Créer un compte"}
        </a>
      </motion.div>

      {/* Lien équipe */}
      <a
        href="/membre/login"
        onClick={(e) => { e.preventDefault(); go("/membre/login"); }}
        className="absolute bottom-10 text-xs"
        style={{ color: "rgba(255,255,255,0.22)", WebkitTapHighlightColor: "transparent" }}
      >
        Connexion espace équipe
      </a>
    </div>
  );
}
