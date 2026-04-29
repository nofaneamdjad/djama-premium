"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Afficher uniquement à la première visite de la session
    if (sessionStorage.getItem("djama_splash_seen")) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("djama_splash_seen", "1");
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setVisible(false), 2500);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => { document.body.style.overflow = ""; }}>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#09090b] select-none"
          aria-hidden="true"
        >
          {/* Radial gold glow background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(201,165,90,0.08),transparent_72%)]" />

          {/* Logo wrapper — entrance */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            {/* Logo glow keyframe after entrance */}
            <motion.div
              animate={{
                filter: [
                  "brightness(0) invert(1) drop-shadow(0 0 0px rgba(201,165,90,0))",
                  "brightness(0) invert(1) drop-shadow(0 0 28px rgba(201,165,90,0.7))",
                  "brightness(0) invert(1) drop-shadow(0 0 6px rgba(201,165,90,0.15))",
                ],
              }}
              transition={{ duration: 1.5, delay: 0.75, ease: "easeOut", times: [0, 0.45, 1] }}
            >
              <Image
                src="/logo.png"
                alt="DJAMA"
                width={320}
                height={104}
                priority
                className="w-44 sm:w-52 h-auto object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </motion.div>
          </motion.div>

          {/* Gold divider */}
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
            Bienvenue sur le site DJAMA
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.2, delay: 0.2, ease: "linear" }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
