"use client";

/**
 * PartnerLogosSection — Ticker premium sur fond blanc.
 *
 * Technique logo sur fond clair :
 *   • Au repos  : grayscale(1) + opacity réduite → ton neutre, non intrusif
 *   • Au hover  : grayscale(0) + pleine opacité → couleur d'origine révélée
 *   → Standard industrie : Vercel, Notion, Linear, Stripe (section "trusted by")
 *
 * Animation ticker :
 *   • track = items × 2 ; keyframes 0 → -50% = exactement 1 copie
 *   • marginRight (pas gap CSS) → chaque tile = TILE_UNIT px exact → -50% pur
 *   • Ligne 1 : gauche 46 s / Ligne 2 : droite 61 s → effet courant organique
 *   • Pause hover desktop uniquement (pointer: fine) → jamais sur mobile
 *   • prefers-reduced-motion → 240 s (ralenti, non bloqué)
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";

/* ─── Géométrie ticker ─────────────────────────────────────────
   marginRight = TILE_GAP → chaque tile = TILE_UNIT px exact.
   -50% = N × TILE_UNIT : boucle mathématiquement sans coupure.
──────────────────────────────────────────────────────────────── */
const TILE_W    = 200;
const TILE_GAP  = 48;
const TILE_UNIT = TILE_W + TILE_GAP;   // 248 px — unité atomique
const TILE_H    = 88;
const FILL_MIN  = 6;                   // logos min visibles simultanément

function fillTrack(arr: PartnerLogoRow[]): PartnerLogoRow[] {
  if (!arr.length) return arr;
  const copies = Math.max(1, Math.ceil(FILL_MIN / arr.length));
  return Array.from({ length: copies }, () => arr).flat();
}

/* ─── LogoTile ──────────────────────────────────────────────────
   Sur fond blanc :
   Repos  : grayscale(1) opacity-50 → ton gris neutre discret
   Hover  : grayscale(0) opacity-95 → couleur originale, révélation
   Capsule: invisible au repos → légère ombre/bordure au hover
──────────────────────────────────────────────────────────────── */
function LogoTile({ logo }: { logo: PartnerLogoRow }) {
  const pill = (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden",
        /* Repos : structure invisible */
        "border border-transparent",
        /* Hover : capsule légère sur fond blanc */
        "group-hover:border-black/[0.07]",
        "group-hover:bg-black/[0.025]",
        "group-hover:shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]",
        /* Transition */
        "transition-[border-color,background-color,box-shadow] duration-[350ms] ease-out",
      ].join(" ")}
      style={{ width: TILE_W, height: TILE_H, marginRight: TILE_GAP, borderRadius: "9999px" }}
    >
      {/*
        Fond blanc → technique grayscale :
        Repos  : grayscale(1) opacity-[0.52] → gris neutre, présent sans agresser
        Hover  : grayscale(0) opacity-[0.92] → couleur d'origine révélée
        Transition fluide filter + opacity
      */}
      <img
        src={logo.logo_url}
        alt={logo.name}
        title={logo.name}
        draggable={false}
        loading="lazy"
        className={[
          "relative z-10 object-contain select-none",
          /* Tailles généreuses */
          "h-10 w-auto sm:h-11 md:h-12",
          "max-w-[116px] sm:max-w-[136px] md:max-w-[158px]",
          /* Repos : gris neutre */
          "grayscale opacity-[0.52]",
          /* Hover : couleur originale */
          "group-hover:grayscale-0 group-hover:opacity-[0.92]",
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
            background:   "rgba(0,0,0,0.05)",
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
         * Off-white premium chaud :
         * Commence et finit à #ffffff pour fondu propre avec les sections blanches.
         * Centre légèrement cassé vers #f5f4f1 → profondeur sans zone sombre.
         */
        background:
          "linear-gradient(180deg, #ffffff 0%, #faf9f7 28%, #f5f4f1 50%, #faf9f7 72%, #ffffff 100%)",
      }}
    >
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
          style={{ background: "linear-gradient(to right, transparent, rgba(0,0,0,0.10))" }}
        />
        <p className="flex-shrink-0 whitespace-nowrap text-[0.67rem] font-black uppercase tracking-[0.24em] text-[#b0aba3]">
          Ils nous font confiance
        </p>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to left, transparent, rgba(0,0,0,0.10))" }}
        />
      </motion.div>

      {/* Tickers */}
      <div className="relative space-y-5">
        {/* Fade gauche — blanc pour correspondre au fond de section */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 md:w-52"
          style={{ background: "linear-gradient(to right, #ffffff, transparent)" }}
          aria-hidden
        />
        {/* Fade droit */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 md:w-52"
          style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
          aria-hidden
        />

        {/* Ligne 1 → gauche, 46 s */}
        {ready ? <TickerRow logos={row1} direction="left"  duration={46} /> : <SkeletonRow />}
        {/* Ligne 2 ← droite, 61 s — écart 15 s = effet courant organique */}
        {ready ? <TickerRow logos={row2} direction="right" duration={61} /> : <SkeletonRow />}
      </div>
    </section>
  );
}
