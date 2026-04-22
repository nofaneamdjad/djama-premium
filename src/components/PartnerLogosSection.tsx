"use client";

/**
 * PartnerLogosSection — Galerie premium de logos en flux continu.
 *
 * Design :
 *   • Capsules pill ultra-légères — pas de boîte rigide
 *   • Logos monochrome lumineux au repos → couleur pleine au hover
 *   • Fond section subtilement élevé (#09090b → #0d0d11)
 *   • Deux lignes inversées, vitesses différentes → "courant d'eau"
 *   • Espacement généreux, respiration visuelle SaaS/luxe
 *
 * Boucle seamless :
 *   track = items × 2, animation 0 → -50% = exactement 1 copie
 *   TILE_UNIT = tile_w + gap via marginRight → -50% mathématiquement exact
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";

/* ─── Géométrie ─────────────────────────────────────────────── */
const TILE_W    = 188;            // px — largeur capsule
const TILE_GAP  = 32;             // px — espacement aéré
const TILE_UNIT = TILE_W + TILE_GAP; // 220px — unité atomique ticker
const TILE_H    = 80;             // px — hauteur capsule
const FILL_MIN  = 6;              // logos min visibles par ligne

function fillTrack(arr: PartnerLogoRow[]): PartnerLogoRow[] {
  if (!arr.length) return arr;
  const copies = Math.max(1, Math.ceil(FILL_MIN / arr.length));
  return Array.from({ length: copies }, () => arr).flat();
}

/* ─── LogoTile ──────────────────────────────────────────────── */
function LogoTile({ logo }: { logo: PartnerLogoRow }) {
  /*
   * group est posé sur le motion wrapper → tous les enfants
   * peuvent utiliser group-hover: pour leurs transitions.
   */
  const pill = (
    <div
      className={[
        /* Capsule pill : structure légère */
        "relative flex items-center justify-center overflow-hidden",
        /* État repos */
        "border border-white/[0.06]",
        "bg-[rgba(255,255,255,0.018)]",
        /* État hover (via group sur le parent motion) */
        "group-hover:border-[rgba(201,165,90,0.22)]",
        "group-hover:bg-[rgba(201,165,90,0.042)]",
        "group-hover:shadow-[0_0_40px_rgba(176,141,87,0.09),0_0_0_1px_rgba(201,165,90,0.08)]",
        /* Transition */
        "transition-[border-color,background-color,box-shadow] duration-[380ms] ease-out",
      ].join(" ")}
      style={{ width: TILE_W, height: TILE_H, marginRight: TILE_GAP, borderRadius: "9999px" }}
    >
      {/* Halo derrière le logo au hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(201,165,90,0.10) 0%, transparent 70%)",
          borderRadius: "inherit",
        }}
        aria-hidden
      />

      {/* Logo — monochrome lumineux au repos, couleur au hover */}
      <img
        src={logo.logo_url}
        alt={logo.name}
        title={logo.name}
        draggable={false}
        loading="lazy"
        className={[
          "relative z-10",
          "h-9 w-auto sm:h-10 md:h-11",
          "max-w-[108px] sm:max-w-[124px] md:max-w-[140px]",
          "object-contain select-none",
          /* Repos : désaturé + lumineux → silhouette claire */
          "grayscale brightness-[1.85] opacity-[0.50]",
          /* Hover : couleur originale, présence pleine */
          "group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-[0.88]",
          "transition-[filter,opacity] duration-[380ms] ease-out",
        ].join(" ")}
      />
    </div>
  );

  /* Props Framer Motion partagés : lift vertical + group pour CSS hover */
  const fm = {
    whileHover: { y: -5 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
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
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 animate-pulse"
          style={{
            width:        TILE_W,
            height:       TILE_H,
            marginRight:  TILE_GAP,
            borderRadius: "9999px",
            background:   "rgba(255,255,255,0.032)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────── */
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
        /* Surface légèrement élevée — fond nuancé, pas de bloc massif */
        background:
          "linear-gradient(180deg, #09090b 0%, #0d0d11 30%, #0e0e13 50%, #0d0d11 70%, #09090b 100%)",
      }}
    >
      {/* Halo or ambiant — chaleur très subtile */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
        style={{
          width:      "min(900px, 100%)",
          height:     "240px",
          background: "radial-gradient(ellipse 70% 100% at 50% 50%, rgba(201,165,90,0.042) 0%, transparent 70%)",
          filter:     "blur(55px)",
          animation:  "glow-pulse 5s ease-in-out infinite",
        }}
      />

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mb-12 sm:mb-16 flex max-w-3xl items-center gap-5 px-8"
      >
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }}
        />
        <p className="flex-shrink-0 whitespace-nowrap text-[0.67rem] font-black uppercase tracking-[0.24em] text-white/25">
          Ils nous font confiance
        </p>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }}
        />
      </motion.div>

      {/* Tickers */}
      <div className="relative space-y-5">
        {/* Fade gauche */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 sm:w-36 md:w-56"
          style={{ background: "linear-gradient(to right, #09090b, transparent)" }}
          aria-hidden
        />
        {/* Fade droit */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 sm:w-36 md:w-56"
          style={{ background: "linear-gradient(to left, #09090b, transparent)" }}
          aria-hidden
        />

        {/* Ligne 1 → gauche (46 s) */}
        {ready ? <TickerRow logos={row1} direction="left"  duration={46} /> : <SkeletonRow />}
        {/* Ligne 2 ← droite (61 s — écart 15 s pour effet organique) */}
        {ready ? <TickerRow logos={row2} direction="right" duration={61} /> : <SkeletonRow />}
      </div>
    </section>
  );
}
