"use client";

/**
 * PartnerLogosSection — Flux premium de logos partenaires.
 *
 * Architecture :
 *   • 2 lignes en sens opposés à vitesses légèrement différentes
 *     → effet "courant / eau" organique
 *   • Boucle seamless via duplication des items (track = 2× items)
 *     @keyframes ticker 0→-50% = exactement 1 copie défilée
 *   • Chaque tile : width fixe incluant le gap (→ calcul -50% exact)
 *   • Fade mask sur les bords gauche/droit via gradient overlay
 *   • prefers-reduced-motion : animation très lente (240s) plutôt
 *     qu'arrêtée, pour un mouvement imperceptible mais fluide
 *   • Hover desktop : pause animation + lift + glow subtil
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";

/* ════════════════════════════════════════════
   Constantes géométriques
   TILE_UNIT = tile_width + gap = unité atomique
   du ticker. Chaque tile occupe exactement cette
   largeur → -50% = N × TILE_UNIT = 1 tour exact.
════════════════════════════════════════════ */
const TILE_W    = 148;  // px — largeur de la carte logo
const TILE_GAP  = 16;   // px — espace entre les cartes
const TILE_UNIT = TILE_W + TILE_GAP; // 164px par slot
const TILE_H    = 76;   // px — hauteur fixe
const FILL_MIN  = 7;    // nombre minimal de logos visibles par ligne

/* ── Remplit un tableau jusqu'à FILL_MIN items ── */
function fillTrack(arr: PartnerLogoRow[]): PartnerLogoRow[] {
  if (!arr.length) return arr;
  const copies = Math.max(1, Math.ceil(FILL_MIN / arr.length));
  return Array.from({ length: copies }, () => arr).flat();
}

/* ════════════════════════════════════════════
   LogoTile — carte individuelle
════════════════════════════════════════════ */
function LogoTile({ logo }: { logo: PartnerLogoRow }) {
  const card = (
    /* Chaque tile occupe TILE_UNIT en largeur (tile + gap via paddingRight)
       afin que -50% sur le track corresponde exactement à 1 tour. */
    <div
      className={[
        /* Slot incluant le gap */
        "flex-shrink-0",
        /* Contenu de la carte */
        "group relative flex items-center justify-center",
        "rounded-[14px]",
        "border border-white/[0.055]",
        "bg-[rgba(255,255,255,0.022)]",
        "overflow-hidden",
        /* Transitions hover */
        "transition-all duration-[380ms] ease-out",
        "hover:border-[rgba(201,165,90,0.22)]",
        "hover:bg-[rgba(201,165,90,0.04)]",
        "hover:shadow-[0_4px_28px_rgba(176,141,87,0.10),0_0_0_1px_rgba(201,165,90,0.08)]",
      ].join(" ")}
      style={{
        width:        TILE_W,
        height:       TILE_H,
        marginRight:  TILE_GAP,   /* gap via margin pour calcul -50% précis */
      }}
    >
      {/* Shimmer ligne haute au hover */}
      <div
        className={[
          "absolute inset-x-0 top-0 h-px",
          "bg-gradient-to-r from-transparent via-[rgba(201,165,90,0.30)] to-transparent",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-[380ms]",
        ].join(" ")}
        aria-hidden
      />

      {/* Logo */}
      <img
        src={logo.logo_url}
        alt={logo.name}
        title={logo.name}
        draggable={false}
        loading="lazy"
        className={[
          "h-7 w-auto max-w-[96px] object-contain select-none",
          /* État repos — discret */
          "opacity-40 grayscale brightness-110",
          /* État hover — pleine présence */
          "group-hover:opacity-80 group-hover:grayscale-0 group-hover:brightness-100",
          "transition-all duration-[380ms]",
        ].join(" ")}
      />
    </div>
  );

  /* Levée verticale au hover — sur le conteneur Framer Motion */
  const motionProps = {
    whileHover: { y: -4 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
    style: { flexShrink: 0, display: "block" } as const,
  };

  if (logo.website_url) {
    return (
      <motion.a
        {...motionProps}
        href={logo.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={logo.name}
      >
        {card}
      </motion.a>
    );
  }

  return <motion.div {...motionProps}>{card}</motion.div>;
}

/* ════════════════════════════════════════════
   TickerRow — une ligne de défilement
════════════════════════════════════════════ */
interface TickerRowProps {
  logos:     PartnerLogoRow[];
  direction: "left" | "right";
  duration:  number;           /* secondes pour 1 tour complet */
}

function TickerRow({ logos, direction, duration }: TickerRowProps) {
  /* Duplication × 2 → boucle seamless (-50% = 1 copie exacte) */
  const doubled = [...logos, ...logos];

  return (
    <div className="ticker-wrap overflow-hidden">
      {/*
        .ticker-track pose animation: ticker 48s linear infinite.
        On surcharge duration et direction via inline style.
        willChange: transform déjà posé par la classe CSS.
      */}
      <div
        className="ticker-track flex"
        style={{
          animationDuration:  `${duration}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
        aria-hidden={direction === "right"} /* la 2e ligne est décorative */
      >
        {doubled.map((logo, i) => (
          <LogoTile key={`${logo.id}-r${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SkeletonRow — placeholder pendant le fetch
════════════════════════════════════════════ */
function SkeletonRow() {
  return (
    <div className="flex overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded-[14px] bg-white/[0.035] animate-pulse"
          style={{ width: TILE_W, height: TILE_H, marginRight: TILE_GAP }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   Section principale
════════════════════════════════════════════ */
export default function PartnerLogosSection() {
  const [logos, setLogos] = useState<PartnerLogoRow[]>([]);
  const [ready, setReady] = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    supabase
      .from("partner_logos")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setLogos((data ?? []) as PartnerLogoRow[]);
        setReady(true);
      });
  }, []);

  /* Section invisible s'il n'y a aucun logo actif */
  if (ready && logos.length === 0) return null;

  /* Prépare les deux lignes :
     - row1 : ordre original → défile à gauche
     - row2 : ordre inversé → défile à droite (sensation de profondeur) */
  const row1 = fillTrack(logos);
  const row2 = fillTrack([...logos].reverse());

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20"
      aria-label="Nos partenaires"
    >
      {/* ── Halo ambiant central ─────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[140px] w-[700px] max-w-full rounded-full animate-glow-pulse"
          style={{
            background: "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(201,165,90,0.04), transparent)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* ── Titre ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mb-10 sm:mb-12 flex max-w-4xl items-center gap-5 px-8"
      >
        {/* Ligne gauche */}
        <div
          className="h-px flex-1"
          style={{
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.07))",
          }}
        />

        <p className="flex-shrink-0 text-[0.67rem] font-black uppercase tracking-[0.22em] text-white/28">
          Ils nous font confiance
        </p>

        {/* Ligne droite */}
        <div
          className="h-px flex-1"
          style={{
            background: "linear-gradient(to left, transparent, rgba(255,255,255,0.07))",
          }}
        />
      </motion.div>

      {/* ── Zone ticker ──────────────────────────── */}
      <div className="relative space-y-3.5">

        {/* Masque fondu — bord gauche */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 md:w-44"
          style={{ background: "linear-gradient(to right, #09090b, transparent)" }}
          aria-hidden
        />
        {/* Masque fondu — bord droit */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 md:w-44"
          style={{ background: "linear-gradient(to left, #09090b, transparent)" }}
          aria-hidden
        />

        {/* Ligne 1 — gauche, 46 s */}
        {ready
          ? <TickerRow logos={row1} direction="left"  duration={46} />
          : <SkeletonRow />
        }

        {/* Ligne 2 — droite, 61 s (15 s d'écart = effet organique) */}
        {ready
          ? <TickerRow logos={row2} direction="right" duration={61} />
          : <SkeletonRow />
        }
      </div>
    </section>
  );
}
