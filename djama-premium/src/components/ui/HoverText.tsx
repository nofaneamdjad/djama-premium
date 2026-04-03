"use client";

/**
 * HoverText — DJAMA Premium micro-interactions
 *
 * Version allégée : pure CSS via className, zéro Framer Motion.
 * GPU-only (background-position, transform, opacity).
 * Compatible mobile : @media(hover:none) dans globals.css désactive tout.
 *
 * Composants :
 * - ShimmerText   : balayage lumineux via background-position
 * - UnderlineDraw : trait animé scaleX de gauche à droite
 * - HoverLift     : translation Y + color au hover
 * - GlowText      : halo text-shadow au hover
 *
 * Tous sont de simples wrappers HTML — aucun re-render, aucun state.
 */

import React from "react";

/* ════════════════════════════════════════════════════
   1. SHIMMER TEXT — CSS pur, GPU-only
   Balayage lumineux via background-position.
   Idéal : boutons, badges, nav links, labels courts.
════════════════════════════════════════════════════ */

type ShimmerVariant = "gold" | "white";

interface ShimmerTextProps {
  children: React.ReactNode;
  variant?: ShimmerVariant;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function ShimmerText({
  children,
  variant = "gold",
  className = "",
  as: Tag = "span",
}: ShimmerTextProps) {
  const cls = variant === "gold" ? "shimmer-gold" : "shimmer-white";
  
  return <Tag className={`${cls} ${className}`}>{children}</Tag>;
}

/* ════════════════════════════════════════════════════
   2. UNDERLINE DRAW — CSS pur
   Trait qui se dessine de gauche à droite au hover.
   Idéal : liens, nav, footer.
════════════════════════════════════════════════════ */

interface UnderlineDrawProps {
  children: React.ReactNode;
  className?: string;
  lineColor?: string;
  thickness?: number;
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
        className="absolute inset-x-0 origin-left scale-x-0 rounded-full transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ul:scale-x-100"
        style={{ bottom: -offset, height: thickness, background: lineColor }}
      />
    </span>
  );
}

/* ════════════════════════════════════════════════════
   3. HOVER LIFT — CSS via className
   Translation Y subtile + changement de couleur.
   Idéal : titres de cards, noms de projets.
════════════════════════════════════════════════════ */

interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function HoverLift({ children, className = "", as: Tag = "span" }: HoverLiftProps) {
  
  return <Tag className={`hover-lift ${className}`}>{children}</Tag>;
}

/* ════════════════════════════════════════════════════
   4. GLOW TEXT — CSS via className
   Halo text-shadow doré au hover.
   Idéal : accroches, badges, titres section.
════════════════════════════════════════════════════ */

interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: "gold" | "white";
  as?: keyof React.JSX.IntrinsicElements;
}

export function GlowText({ children, className = "", variant = "gold", as: Tag = "span" }: GlowTextProps) {
  const cls = variant === "gold" ? "hover-glow-gold" : "hover-glow-white";
  
  return <Tag className={`${cls} ${className}`}>{children}</Tag>;
}

/* ════════════════════════════════════════════════════
   Re-exports pour compatibilité ascendante
   (anciens noms utilisés dans services / réalisations)
════════════════════════════════════════════════════ */

/** @deprecated Utiliser HoverLift à la place */
export function WordLift({ text, className = "", as: Tag = "span" }: {
  text: string; className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  stagger?: number; yOffset?: number; hoverColor?: string;
}) {
  
  return <Tag className={`hover-lift ${className}`}>{text}</Tag>;
}

/** @deprecated Utiliser HoverLift à la place */
export function LetterReveal({ text, className = "", as: Tag = "span" }: {
  text: string; className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  yOffset?: number; stagger?: number; duration?: number; hoverColor?: string; color?: string;
}) {
  
  return <Tag className={`hover-lift ${className}`}>{text}</Tag>;
}

/** @deprecated Utiliser GlowText à la place */
export function GlowReveal({ children, className = "", as: Tag = "span" }: {
  children: React.ReactNode; className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  glowColor?: string; lift?: number;
}) {
  
  return <Tag className={`hover-glow-gold ${className}`}>{children}</Tag>;
}
