"use client";

import { motion, Variants } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   Easing "eau" : très rapide au départ, s'étire et se pose
   doucement — comme une goutte d'eau qui s'immobilise.
───────────────────────────────────────────────────────── */
const waterEase = [0.16, 1, 0.3, 1] as const;

/* Variant d'un mot seul */
const wordVariant: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.75,
      ease: waterEase,
    },
  },
};

/* Container avec stagger entre chaque mot */
function makeContainer(stagger: number, delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };
}

/* ─────────────────────────────────────────────────────────
   WordReveal
   Découpe `text` en mots et les fait glisser vers le haut
   depuis leur masque (overflow: hidden), un par un.

   Props :
   - text     : la chaîne à découper en mots
   - as       : balise HTML de rendu (défaut : "span")
   - stagger  : délai entre mots (défaut : 0.075s)
   - delay    : délai global avant la 1ère animation
   - className: classes CSS sur le wrapper
───────────────────────────────────────────────────────── */
interface WordRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  stagger?: number;
  delay?: number;
  className?: string;
}

export function WordReveal({
  text,
  as = "span",
  stagger = 0.075,
  delay = 0,
  className = "",
}: WordRevealProps) {
  const Tag = motion[as] as typeof motion.span;
  const words = text.split(" ").filter(Boolean);

  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={makeContainer(stagger, delay)}
      className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}
      aria-label={text}
    >
      {words.map((word, i) => (
        /* Le overflow:hidden crée le masque : le mot "monte"
           depuis le bas sans jamais être visible avant d'entrer */
        <span key={i} style={{ overflow: "hidden", display: "inline-block", lineHeight: "1.15" }}>
          <motion.span
            variants={wordVariant}
            style={{ display: "inline-block" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────
   MultiLineReveal
   Chaque ligne est indépendante et s'anime avec un stagger
   de ligne. Idéal pour les grands titres multi-lignes.

   Props :
   - lines    : tableau de chaînes (chaque chaîne = une ligne)
   - highlight: indice de la ligne à colorer en or (optionnel)
   - stagger  : délai entre les lignes (défaut : 0.15s)
   - wordStagger : délai entre les mots d'une même ligne
   - className: classes sur le wrapper global
   - lineClassName: classes sur chaque ligne
───────────────────────────────────────────────────────── */
interface MultiLineRevealProps {
  lines: string[];
  highlight?: number;
  stagger?: number;
  wordStagger?: number;
  delay?: number;
  className?: string;
  lineClassName?: string;
}

export function MultiLineReveal({
  lines,
  highlight,
  stagger = 0.14,
  wordStagger = 0.07,
  delay = 0,
  className = "",
  lineClassName = "",
}: MultiLineRevealProps) {
  return (
    <span className={`flex flex-col gap-0 ${className}`} aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <WordReveal
          key={li}
          text={line}
          stagger={wordStagger}
          delay={delay + li * stagger}
          className={`${lineClassName} ${li === highlight ? "text-gold" : ""}`}
        />
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   FadeReveal
   Version plus douce : un seul bloc qui monte doucement
   et s'opacifie. Pour les paragraphes et sous-titres.
───────────────────────────────────────────────────────── */
const fadeUpVariant: Variants = {
  hidden: { y: 22, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.85,
      ease: waterEase,
    },
  },
};

interface FadeRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "p" | "div" | "span";
}

export function FadeReveal({ children, delay = 0, className = "", as = "div" }: FadeRevealProps) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        ...fadeUpVariant,
        visible: {
          ...fadeUpVariant.visible,
          transition: {
            ...(typeof fadeUpVariant.visible === "object" && "transition" in fadeUpVariant.visible
              ? (fadeUpVariant.visible as { transition: object }).transition
              : {}),
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
