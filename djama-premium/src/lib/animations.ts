import type { Variants } from "framer-motion";

/* ═══════════════════════════════════════════════
   EASING CURVES
═══════════════════════════════════════════════ */

/** Easing "eau" — démarre vite, se pose avec une douceur
 *  extrême, comme une vague qui s'immobilise sur la rive. */
export const waterEase = [0.16, 1, 0.3, 1] as const;

/** Easing fluide général */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Easing doux pour les éléments secondaires */
export const easeSoft = [0.4, 0, 0.2, 1] as const;

/* ═══════════════════════════════════════════════
   VARIANTS TEXTE — EFFET EAU
═══════════════════════════════════════════════ */

/** Descente douce avec opacité — idéal pour sous-titres */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: waterEase },
  },
};

/** Fade pur, sans déplacement */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easeSoft },
  },
};

/** Révélation titre : glisse depuis le bas, aucun blur */
export const textReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: waterEase },
  },
};

/** Mot individuel : monte depuis son masque (overflow hidden) */
export const wordSlideUp: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.75, ease: waterEase },
  },
};

/* ═══════════════════════════════════════════════
   CONTAINERS STAGGER
═══════════════════════════════════════════════ */

/** Stagger classique pour sections */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

/** Stagger rapide pour listes de cartes */
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

/** Stagger mots — pour WordReveal manuel */
export const staggerWords: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.075, delayChildren: 0 },
  },
};

/* ═══════════════════════════════════════════════
   CARTES & ÉLÉMENTS UI
═══════════════════════════════════════════════ */

/** Carte : monte doucement avec micro-scale */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: waterEase },
  },
};

/** Slide depuis la gauche */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: waterEase },
  },
};

/** Slide depuis la droite */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: waterEase },
  },
};

/* ═══════════════════════════════════════════════
   VIEWPORT CONFIG
═══════════════════════════════════════════════ */
export const viewport = { once: true, margin: "-70px" } as const;
