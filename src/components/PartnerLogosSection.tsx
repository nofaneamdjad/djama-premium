"use client";

/**
 * PartnerLogosSection — Section partenaires premium fond blanc vivant.
 *
 * ── Fond animé ──────────────────────────────────────────────────────
 *   .partners-bg (globals.css) : dégradé 130° avec touches or DJAMA,
 *   violet et bleu très désaturés, background-size 400%, animation 22 s.
 *   → Section "respire" doucement, jamais distrayante.
 *
 * ── Logos ───────────────────────────────────────────────────────────
 *   Au repos : grayscale(1) opacity-52 → gris neutre, non intrusif
 *   Au hover : grayscale(0) opacity-92 → couleur révélée (Vercel/Notion style)
 *   Glow interne : radial or+violet derrière le logo au hover
 *
 * ── Micro-flottement ────────────────────────────────────────────────
 *   .partners-tile-float : 5 px amplitude, période par-tile variable
 *   (delay = index%5 × 0.5 s, durée = 3.2–4.4 s) → organique, jamais sync.
 *   Séparé du wrapper FM → pas de conflit avec whileHover.
 *
 * ── Rayon lumineux ──────────────────────────────────────────────────
 *   .partners-sweep : rayon or+blanc, traverse les tickers en 11 s,
 *   delay 4 s → surprise premium, pas trop fréquent.
 *   Clipé par overflow-hidden du container → disparaît proprement aux bords.
 *
 * ── Ticker ──────────────────────────────────────────────────────────
 *   TILE_GAP 24 (réduit depuis 48) → composition plus dense, plus compacte.
 *   Track = items × 2, keyframe 0→-50% : boucle zéro coupure.
 *   Ligne 1 → gauche 46 s / Ligne 2 ← droite 61 s : courant organique.
 *   Pause hover : @media (hover:hover) and (pointer:fine) — jamais mobile.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { PartnerLogoRow } from "@/types/db";

/* ─── Géométrie ─────────────────────────────────────────────────────
   TILE_GAP réduit à 24 (vs 48 précédemment) → composition dense, sans vide.
   marginRight = TILE_GAP (pas CSS gap) → chaque tile = TILE_UNIT px exact
   → -50% = N×TILE_UNIT : boucle mathématiquement sans coupure.
──────────────────────────────────────────────────────────────────── */
const TILE_W    = 196;
const TILE_GAP  = 24;                  // ← réduit : composition serrée
const TILE_UNIT = TILE_W + TILE_GAP;   // 220 px
const TILE_H    = 80;
const FILL_MIN  = 7;

function fillTrack(arr: PartnerLogoRow[]): PartnerLogoRow[] {
  if (!arr.length) return arr;
  const copies = Math.max(1, Math.ceil(FILL_MIN / arr.length));
  return Array.from({ length: copies }, () => arr).flat();
}

/* ─── LogoTile ──────────────────────────────────────────────────────
   index → stagger du flottement (delay + durée uniques per-tile)
   Float : sur le wrapper interne (div), pas sur FM → pas de conflit hover
──────────────────────────────────────────────────────────────────── */
function LogoTile({ logo, index }: { logo: PartnerLogoRow; index: number }) {
  /* Paramètres float organiques per-tile */
  const floatDelay    = `${(index % 5) * 0.50}s`;
  const floatDuration = `${3.2 + (index % 4) * 0.55}s`;

  const pill = (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden",
        /* Repos : structure invisible */
        "border border-transparent",
        /* Hover : capsule légère — bordure + bg + shadow */
        "group-hover:border-black/[0.07]",
        "group-hover:bg-black/[0.025]",
        "group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]",
        /* Transition */
        "transition-[border-color,background-color,box-shadow] duration-[350ms] ease-out",
      ].join(" ")}
      style={{ width: TILE_W, height: TILE_H, marginRight: TILE_GAP, borderRadius: "9999px" }}
    >
      {/*
        Glow interne — halo or DJAMA + violet derrière le logo.
        Invisible au repos → révélé au hover (transition 500 ms).
        Crée une présence lumineuse premium sans alourdir.
      */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 55%, rgba(201,165,90,0.16) 0%, rgba(139,92,246,0.07) 55%, transparent 100%)",
        }}
        aria-hidden
      />

      {/*
        Logo — fond blanc → technique grayscale :
          Repos  : grayscale(1) opacity-52 → ton gris neutre discret
          Hover  : grayscale(0) opacity-92 → couleur originale révélée
          Transition filter + opacity fluide
      */}
      <img
        src={logo.logo_url}
        alt={logo.name}
        title={logo.name}
        draggable={false}
        loading="lazy"
        className={[
          "relative z-10 object-contain select-none",
          "h-9 w-auto sm:h-10 md:h-[2.875rem]",
          "max-w-[108px] sm:max-w-[128px] md:max-w-[150px]",
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

  /* FM wrapper : hover lift + scale uniquement */
  const fmProps = {
    whileHover: { y: -6, scale: 1.05 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
    className: "group flex-shrink-0 block",
  };

  /*
    Wrapper interne float : séparé du FM pour éviter tout conflit.
    FM gère le y du hover, ce div gère le y du float CSS.
    Les transforms se composent : float (enfant) + hover-lift (parent).
  */
  const floatWrapper = (
    <div
      className="partners-tile-float"
      style={{ animationDelay: floatDelay, animationDuration: floatDuration }}
    >
      {pill}
    </div>
  );

  if (logo.website_url) {
    return (
      <motion.a
        {...fmProps}
        href={logo.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={logo.name}
      >
        {floatWrapper}
      </motion.a>
    );
  }

  return <motion.div {...fmProps}>{floatWrapper}</motion.div>;
}

/* ─── TickerRow ─────────────────────────────────────────────────── */
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
          <LogoTile key={`${logo.id}-r${i}`} logo={logo} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── SkeletonRow ───────────────────────────────────────────────── */
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
            background:   "rgba(0,0,0,0.05)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────────── */
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
    /*
     * partners-bg = fond animé (globals.css) :
     *   or DJAMA · violet · bleu — ultra-légers, background-size 400%, 22 s.
     *   Section "respire" en douceur → premium, jamais distrayante.
     */
    <section
      className="partners-bg relative overflow-hidden py-16 sm:py-20 md:py-24"
      aria-label="Nos partenaires"
    >
      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mb-10 sm:mb-14 flex max-w-3xl items-center gap-5 px-8"
      >
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,0,0,0.09))" }}
        />
        <p className="flex-shrink-0 whitespace-nowrap text-[0.67rem] font-black uppercase tracking-[0.24em] text-[#b0aba3]">
          Ils nous font confiance
        </p>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(to left, transparent, rgba(0,0,0,0.09))" }}
        />
      </motion.div>

      {/* Zone tickers — overflow-hidden pour clipper le rayon aux bords */}
      <div className="relative overflow-hidden space-y-4">

        {/* Fade gauche — blanc pour fondu propre */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 md:w-48"
          style={{ background: "linear-gradient(to right, #ffffff, transparent)" }}
          aria-hidden
        />
        {/* Fade droit */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 md:w-48"
          style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
          aria-hidden
        />

        {/*
          Rayon lumineux — or DJAMA + blanc central.
          Traverse les tickers de gauche à droite toutes les ~15 s.
          z-[5] → sous les fades (z-10) : disparaît proprement aux bords.
          .partners-sweep (globals.css) : animation 11 s, delay 4 s.
        */}
        <div
          className="partners-sweep pointer-events-none absolute inset-y-0 left-0 z-[5]"
          aria-hidden
        />

        {/* Ligne 1 → gauche, 46 s */}
        {ready ? <TickerRow logos={row1} direction="left"  duration={46} /> : <SkeletonRow />}
        {/* Ligne 2 ← droite, 61 s — écart 15 s = courant organique */}
        {ready ? <TickerRow logos={row2} direction="right" duration={61} /> : <SkeletonRow />}
      </div>
    </section>
  );
}
