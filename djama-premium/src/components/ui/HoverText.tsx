"use client";

/**
 * HoverText — DJAMA Premium micro-interactions
 *
 * Trois composants réutilisables pour les effets de texte au hover :
 *
 * 1. ShimmerText   — balayage lumineux sur le texte (boutons, badges, labels)
 * 2. LetterReveal  — chaque lettre se soulève au hover (titres de cartes)
 * 3. GlowReveal    — texte + léger halo qui apparaît au hover (accroches)
 *
 * Sur mobile (hover: none), tous les états hover restent visibles statiquement.
 */

import { motion, useReducedMotion } from "framer-motion";
import React, { useState, useMemo } from "react";

/* ─── ease DJAMA ─────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

/* ════════════════════════════════════════════════════
   1. SHIMMER TEXT
   Balayage lumineux GPU-accéléré via background-clip.
   Idéal : boutons, badges, labels, liens nav.
════════════════════════════════════════════════════ */

type ShimmerVariant = "gold" | "white" | "accent";

interface ShimmerTextProps {
  children: React.ReactNode;
  /** Couleur du balayage (default: "gold") */
  variant?: ShimmerVariant;
  /** Classes supplémentaires */
  className?: string;
  /** Tag HTML (default: "span") */
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  /** Vitesse du balayage en ms (default: 550) */
  duration?: number;
}

const SHIMMER_COLORS: Record<ShimmerVariant, string> = {
  gold:   "linear-gradient(90deg, currentColor 0%, currentColor 35%, #e8cc94 46%, #fff8e1 50%, #e8cc94 54%, currentColor 65%, currentColor 100%)",
  white:  "linear-gradient(90deg, currentColor 0%, currentColor 35%, rgba(255,255,255,0.95) 46%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 54%, currentColor 65%, currentColor 100%)",
  accent: "linear-gradient(90deg, currentColor 0%, currentColor 35%, rgba(201,165,90,0.9) 46%, #e8cc94 50%, rgba(201,165,90,0.9) 54%, currentColor 65%, currentColor 100%)",
};

export function ShimmerText({
  children,
  variant = "gold",
  className = "",
  as: Tag = "span",
  duration = 550,
}: ShimmerTextProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const style: React.CSSProperties = {
    display: "inline-block",
    backgroundImage: SHIMMER_COLORS[variant],
    backgroundSize: "250% auto",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundPosition: hovered && !prefersReduced ? "-100% center" : "100% center",
    transition: `background-position ${duration}ms cubic-bezier(0.16,1,0.3,1)`,
  };

  return (
    <Tag
      className={className}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Tag>
  );
}

/* ════════════════════════════════════════════════════
   2. LETTER REVEAL
   Chaque lettre se soulève individuellement au hover.
   Idéal : titres de cartes, accroches courtes, liens.
════════════════════════════════════════════════════ */

interface LetterRevealProps {
  text: string;
  /** Classes CSS du wrapper */
  className?: string;
  /** Tag HTML (default: "span") */
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Décalage en px (default: 6) */
  yOffset?: number;
  /** Délai entre lettres en ms (default: 18) */
  stagger?: number;
  /** Durée de chaque lettre en ms (default: 300) */
  duration?: number;
  /** Couleur accentuée au hover (optionnel) */
  hoverColor?: string;
  /** Couleur de base */
  color?: string;
}

export function LetterReveal({
  text,
  className = "",
  as: Tag = "span",
  yOffset = 5,
  stagger = 18,
  duration = 280,
  hoverColor,
  color,
}: LetterRevealProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  /* Split en mots → lettres, pour préserver les espaces */
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <Tag
      className={`inline-flex flex-wrap items-baseline gap-x-[0.25em] ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color }}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex" aria-hidden="true">
          {word.split("").map((char, ci) => {
            const delay = prefersReduced ? 0 : (wi * word.length + ci) * stagger;
            const isHov = hovered && !prefersReduced;
            return (
              <motion.span
                key={ci}
                animate={{
                  y: isHov ? -yOffset : 0,
                  color: isHov && hoverColor ? hoverColor : (color ?? "inherit"),
                }}
                transition={{
                  duration: duration / 1000,
                  ease,
                  delay: delay / 1000,
                }}
                style={{ display: "inline-block", willChange: "transform" }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/* ════════════════════════════════════════════════════
   3. GLOW REVEAL
   Texte + halo doré subtil qui apparaît au hover.
   Idéal : titres de sections, noms de projets, CTA.
════════════════════════════════════════════════════ */

interface GlowRevealProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  /** Couleur du glow (default: rgba(201,165,90,0.45)) */
  glowColor?: string;
  /** Intensité de l'élévation en px (default: 2) */
  lift?: number;
}

export function GlowReveal({
  children,
  className = "",
  as: Tag = "span",
  glowColor = "rgba(201,165,90,0.45)",
  lift = 2,
}: GlowRevealProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      // @ts-expect-error — motion.div supports any HTML tag via `as`
      as={Tag}
      className={`inline-block ${className}`}
      whileHover={prefersReduced ? {} : {
        y: -lift,
        textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        transition: { duration: 0.3, ease },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════
   4. UNDERLINE DRAW
   Soulignement qui se dessine de gauche à droite.
   Idéal : liens de navigation, liens dans les textes.
════════════════════════════════════════════════════ */

interface UnderlineDrawProps {
  children: React.ReactNode;
  className?: string;
  /** Couleur du trait (default: #c9a55a) */
  lineColor?: string;
  /** Épaisseur du trait en px (default: 1.5) */
  thickness?: number;
  /** Décalage depuis la ligne de base (default: 2) */
  offset?: number;
}

export function UnderlineDraw({
  children,
  className = "",
  lineColor = "#c9a55a",
  thickness = 1.5,
  offset = 2,
}: UnderlineDrawProps) {
  return (
    <span
      className={`group/ul relative inline-block ${className}`}
    >
      {children}
      <span
        className="absolute inset-x-0 origin-left scale-x-0 rounded-full transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ul:scale-x-100"
        style={{
          bottom: -offset,
          height: thickness,
          background: lineColor,
        }}
      />
    </span>
  );
}

/* ════════════════════════════════════════════════════
   5. WORD LIFT
   Chaque MOT se soulève avec un léger stagger.
   Plus subtil que LetterReveal — idéal pour titres moyens.
════════════════════════════════════════════════════ */

interface WordLiftProps {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
  stagger?: number;   // ms entre mots
  yOffset?: number;
  hoverColor?: string;
}

export function WordLift({
  text,
  className = "",
  as: Tag = "span",
  stagger = 30,
  yOffset = 4,
  hoverColor,
}: WordLiftProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReduced = useReducedMotion();
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <Tag
      className={`inline-flex flex-wrap items-baseline gap-x-[0.28em] ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={text}
    >
      {words.map((word, wi) => {
        const isHov = hovered && !prefersReduced;
        return (
          <motion.span
            key={wi}
            animate={{
              y: isHov ? -yOffset : 0,
              color: isHov && hoverColor ? hoverColor : "inherit",
            }}
            transition={{
              duration: 0.32,
              ease,
              delay: prefersReduced ? 0 : (wi * stagger) / 1000,
            }}
            style={{ display: "inline-block", willChange: "transform" }}
            aria-hidden="true"
          >
            {word}
          </motion.span>
        );
      })}
    </Tag>
  );
}
