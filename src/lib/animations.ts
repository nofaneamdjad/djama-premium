import type { Variants } from "framer-motion";

/* ═══════════════════════════════════════════════
   EASING CURVES
═══════════════════════════════════════════════ */
export const waterEase = [0.16, 1, 0.3, 1] as const;
export const ease      = [0.22, 1, 0.36, 1] as const;
export const easeSoft  = [0.4, 0, 0.2, 1] as const;

/* ═══════════════════════════════════════════════
   VARIANTS TEXTE
═══════════════════════════════════════════════ */

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: waterEase } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: easeSoft } },
};

export const textReveal: Variants = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: waterEase } },
};

export const wordSlideUp: Variants = {
  hidden:  { y: "105%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: waterEase } },
};

/* ═══════════════════════════════════════════════
   CONTAINERS STAGGER — durées réduites
═══════════════════════════════════════════════ */

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const staggerContainerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const staggerWords: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0 } },
};

/* ═══════════════════════════════════════════════
   CARTES & ÉLÉMENTS UI
═══════════════════════════════════════════════ */

export const cardReveal: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: waterEase } },
};

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: waterEase } },
};

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: waterEase } },
};

/* ═══════════════════════════════════════════════
   VIEWPORT CONFIG
═══════════════════════════════════════════════ */
export const viewport = { once: true, margin: "-50px" } as const;
