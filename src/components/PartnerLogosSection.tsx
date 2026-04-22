"use client";

/**
 * PartnerLogosSection — Galerie premium de logos en flux continu.
 *
 * Technique logo blanc universel :
 *   filter: brightness(0) invert(1)
 *   → convertit n'importe quel logo (sombre, coloré, clair) en silhouette
 *     blanche pure, préserve la transparence → cohérence visuelle totale
 *   → même technique utilisée par Stripe / Apple / Linear
 *
 * Hover : retire le filtre → couleur originale à pleine opacité
 * (effet de révélation premium).
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";

/* ─── Géométrie ticker ──────────────────────────────────────────
   marginRight = TILE_GAP (pas de `gap` CSS) : chaque tile occupe
   exactement TILE_UNIT px → calcul -50% mathématiquement exact.
──────────────────────────────────────────────────────────────── */
const TILE_W    = 200;            // px — largeur slot logo
const TILE_GAP  = 40;             // px — espacement généreux
const TILE_UNIT = TILE_W + TILE_GAP; // 240px — unité atomique
const TILE_H    = 88;             // px — hauteur slot
const FILL_MIN  = 6;              // logos min simultanément visibles

function fillTrack(arr: PartnerLogoRow[]): PartnerLogoRow[] {
  if (!arr.length) return arr;
  const copies = Math.max(1, Math.ceil(FILL_MIN / arr.length));
  return Array.from({ length: copies }, () => arr).flat();
}

/* ─── LogoTile ──────────────────────────────────────────────────
   Au repos : blanc pur via brightness(0)+invert(1), opacity ~65 %.
   Au hover  : filtre retiré → couleur originale, pleine présence.
   Tile      : invisible au repos, legère capsule pill au hover.
──────────────────────────────────────────────────────────────── */
function LogoTile({ logo }: { logo: PartnerLogoRow }) {
  const pill = (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden",
        /* Repos : structure invisible */
        "border border-transparent",
        /* Hover : capsule légère */
        "group-hover:border-white/[0.12]",
        "group-hover:bg-white/[0.035]",
        "group-hover:shadow-[0_0_32px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.05)]",
        /* Transition */
        "transition-[border-color,background-color,box-shadow] duration-[350ms] ease-out",
      ].join(" ")}
      style={{ width: TILE_W, height: TILE_H, marginRight: TILE_GAP, borderRadius: "9999px" }}
    >
      {/* Logo
          Repos : brightness(0) invert(1) → silhouette blanche pure
                  opacity 0.65 → présence forte sans agressivité
          Hover : filtre reset → couleur d'origine, scale via parent FM
      */}
      <img
        src={logo.logo_url}
        alt={logo.name}
        title={logo.name}
        draggable={false}
        loading="lazy"
        className={[
          "relative z-10 object-contain select-none",
          /* Tailles généreuses — impact immédiat */
          "h-10 w-auto sm:h-11 md:h-12",
          "max-w-[116px] sm:max-w-[136px] md:max-w-[158px]",
          /* Repos : silhouette blanche */
          "brightness-0 invert opacity-[0.65]",
          /* Hover : couleur originale */
          "group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-[0.92]",
          /* Transition filtre fluide */
          "transition-[filter,opacity] duration-[350ms] ease-out",
        ].join(" ")}
      />
    </div>
  );

  const fm = {
    whileHover: { y: -5, scale: 1.04 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
    className: "group flex-shrink-0 block",
  };

  if (logo.website_url) {
    return (
      <motion.a
        {...fm}
        href={logo.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={logo.name}
      >
        {pill}
      </motion.a>
    );
  }

  return <motion.div {...fm}>{pill}</motion.div>;
}

/* ─── TickerRow ─────────────────────────────────────────────── */
function TickerRow({
  logos,
  direction = "left",
  duration  = 50,
}: {
  logos:      PartnerLogoRow[];
  direction?: "left" | "right";
  duration?:  number;
}) {
  const doubled = [...logos, ...logos];

  return (
    <div className="ticker-wrap overflow-hidden">
      <div
        className="ticker-track flex"
        style={{
          animationDuration:  `${duration}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
        aria-hidden={direction === "right"}
      >
        {doubled.map((logo, i) => (
          <LogoTile key={`${logo.id}-r${i}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

/* ─── SkeletonRow ───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 animate-pulse"
          style={{
            width:        TILE_W,
            height:       TILE_H,
            marginRight:  TILE_GAP,
            borderRadius: "9999px",
            background:   "rgba(255,255,255,0.05)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────── */
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

  if (ready && logos.length === 0) return null;

  const row1 = fillTrack(logos);
  const row2 = fillTrack([...logos].reverse());

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-24"
      aria-label="Nos partenaires"
      style={{
        /*
         * Surface légèrement élevée : le dégradé crée une "plaque"
         * distincte (~2 % plus claire que #09090b) sans bloc massif.
         * Commence et finit à #09090b → fondu propre avec les sections adjacentes.
         */
        background:
          "linear-gradient(180deg, #09090b 0%, #0d0d11 28%, #0f0f14 50%, #0d0d11 72%, #09090b 100%)",
      }}
    >
      {/* Halo doux — léger fond lumineux derrière les logos */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
        style={{
          width:      "min(1000px, 100%)",
          height:     "260px",
          background: "radial-gradient(ellipse 65% 100% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)",
          filter:     "blur(50px)",
        }}
      />

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mb-12 sm:mb-16 flex max-w-3xl items-center gap-5 px-8"
      >
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10))" }}
        />
        <p className="flex-shrink-0 whitespace-nowrap text-[0.67rem] font-black uppercase tracking-[0.24em] text-white/30">
          Ils nous font confiance
        </p>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.10))" }}
        />
      </motion.div>

      {/* Tickers */}
      <div className="relative space-y-5">
        {/* Fade gauche */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 md:w-52"
          style={{ background: "linear-gradient(to right, #09090b, transparent)" }}
          aria-hidden
        />
        {/* Fade droit */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 md:w-52"
          style={{ background: "linear-gradient(to left, #09090b, transparent)" }}
          aria-hidden
        />

        {/* Ligne 1 → gauche, 46 s */}
        {ready ? <TickerRow logos={row1} direction="left"  duration={46} /> : <SkeletonRow />}
        {/* Ligne 2 ← droite, 61 s — écart 15 s = effet organique */}
        {ready ? <TickerRow logos={row2} direction="right" duration={61} /> : <SkeletonRow />}
      </div>
    </section>
  );
}
