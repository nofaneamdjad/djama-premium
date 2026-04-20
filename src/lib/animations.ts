import type { Variants } from "framer-motion";

/* ═══════════════════════════════════════════════
   EASING CURVES
═══════════════════════════════════════════════ */
export const waterEase = [0.16, 1, 0.3, 1] as const;
export const ease      = [0.22, 1, 0.36, 1] as const;
export const easeSoft  = [0.4, 0, 0.2, 1] as const;
export const easeSpring = { type: "spring", stiffness: 260, damping: 24 } as const;

/* ═══════════════════════════════════════════════
   VARIANTS TEXTE
═══════════════════════════════════════════════ */

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: waterEase } },
};

export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: waterEase } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: easeSoft } },
};

export const fadeLeft: Variants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: waterEase } },
};

export const fadeRight: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: waterEase } },
};

/** Blur + fade + translateY — most premium entrance effect */
export const blurReveal: Variants = {
  hidden:  { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: waterEase } },
};

/** Scale in from slightly smaller */
export const scaleReveal: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: waterEase } },
};

export const textReveal: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: waterEase } },
};

export const wordSlideUp: Variants = {
  hidden:  { y: "105%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: waterEase } },
};

/* ═══════════════════════════════════════════════
   CONTAINERS STAGGER
═══════════════════════════════════════════════ */

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export const staggerContainerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } },
};

export const staggerContainerSlow: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const staggerWords: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0 } },
};

/* ═══════════════════════════════════════════════
   CARTES & ÉLÉMENTS UI
═══════════════════════════════════════════════ */

export const cardReveal: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: waterEase } },
};

export const cardRevealBlur: Variants = {
  hidden:  { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: waterEase } },
};

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: waterEase } },
};

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: waterEase } },
};

/** Panel slides up with spring bounce */
export const panelReveal: Variants = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: waterEase },
  },
};

/* ═══════════════════════════════════════════════
   VIEWPORT CONFIG
═══════════════════════════════════════════════ */
export const viewport       = { once: true, margin: "-60px" } as const;
export const viewportEager  = { once: true, margin: "-20px" } as const;
export const viewportLazy   = { once: true, margin: "-100px" } as const;
