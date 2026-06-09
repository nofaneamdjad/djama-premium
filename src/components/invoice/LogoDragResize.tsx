"use client";
/**
 * LogoDragResize — Overlay Canva-like pour repositionner/redimensionner
 * le logo directement dans l'aperçu de la facture.
 *
 * Coordonnées stockées en mm A4 (210 × 297 mm) pour correspondre
 * pixel-perfect au rendu jsPDF.
 *
 * Usage :
 *   <div style={{ position:"relative" }}>
 *     <InvoiceTemplate ... />
 *     {logo && <LogoDragResize src={logo} transform={t} onChange={setT} onReset={...} />}
 *   </div>
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { RotateCcw, Lock, Unlock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogoTransform {
  x: number;   // mm depuis le bord gauche  (A4 = 0 → 210)
  y: number;   // mm depuis le bord haut    (A4 = 0 → 297)
  w: number;   // mm largeur
  h: number;   // mm hauteur
}

export const DEFAULT_LOGO_TRANSFORM: LogoTransform = {
  x: 18,   // aligne sur la marge gauche jsPDF
  y: 5,    // top du header
  w: 48,   // taille "md" par défaut
  h: 18,
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const A4_W  = 210;
const A4_H  = 297;
const MIN_W = 8;
const MIN_H = 3;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ─── Types internes ───────────────────────────────────────────────────────────

type Dir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

const HANDLES: { dir: Dir; cursor: string; style: React.CSSProperties }[] = [
  { dir: "nw", cursor: "nw-resize", style: { top: -5,  left: -5 } },
  { dir: "n",  cursor: "n-resize",  style: { top: -5,  left: "50%",  transform: "translateX(-50%)" } },
  { dir: "ne", cursor: "ne-resize", style: { top: -5,  right: -5 } },
  { dir: "e",  cursor: "e-resize",  style: { top: "50%", right: -5,  transform: "translateY(-50%)" } },
  { dir: "se", cursor: "se-resize", style: { bottom: -5, right: -5 } },
  { dir: "s",  cursor: "s-resize",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)" } },
  { dir: "sw", cursor: "sw-resize", style: { bottom: -5, left: -5 } },
  { dir: "w",  cursor: "w-resize",  style: { top: "50%", left: -5,   transform: "translateY(-50%)" } },
];

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  src:       string;
  transform: LogoTransform;
  onChange:  (t: LogoTransform) => void;
  onReset:   () => void;
}

export function LogoDragResize({ src, transform, onChange, onReset }: Props) {
  const ref         = useRef<HTMLDivElement>(null);
  const [hov,  setHov]  = useState(false);
  const [sel,  setSel]  = useState(false);
  const [lock, setLock] = useState(true);

  const show = hov || sel;

  /* ── Clic à l'extérieur → déselectionne ─────────────────────────── */
  useEffect(() => {
    if (!sel) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setSel(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [sel]);

  /* ── Logique drag / resize ───────────────────────────────────────── */
  const interact = useCallback((e: React.MouseEvent, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    setSel(true);

    const sx = e.clientX;
    const sy = e.clientY;
    const snap = { ...transform };
    const aspect = snap.w / snap.h;

    // Récupère les dimensions CSS du conteneur parent (= la div relative qui wrap InvoiceTemplate)
    const container = ref.current?.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = A4_W / rect.width;   // px → mm
    const scaleY = A4_H / rect.height;  // px → mm

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - sx) * scaleX;
      const dy = (me.clientY - sy) * scaleY;
      let { x, y, w, h } = snap;

      if (dir === "move") {
        x = clamp(snap.x + dx, 0, A4_W - w);
        y = clamp(snap.y + dy, 0, A4_H - h);
      } else if (dir === "se") {
        w = Math.max(MIN_W, snap.w + dx);
        h = lock ? w / aspect : Math.max(MIN_H, snap.h + dy);
      } else if (dir === "sw") {
        const nw = Math.max(MIN_W, snap.w - dx);
        x = snap.x + snap.w - nw;
        w = nw;
        h = lock ? w / aspect : Math.max(MIN_H, snap.h + dy);
      } else if (dir === "ne") {
        w = Math.max(MIN_W, snap.w + dx);
        const nh = lock ? w / aspect : Math.max(MIN_H, snap.h - dy);
        y = snap.y + snap.h - nh;
        h = nh;
      } else if (dir === "nw") {
        const nw = Math.max(MIN_W, snap.w - dx);
        x = snap.x + snap.w - nw;
        w = nw;
        const nh = lock ? w / aspect : Math.max(MIN_H, snap.h - dy);
        y = snap.y + snap.h - nh;
        h = nh;
      } else if (dir === "e") {
        w = Math.max(MIN_W, snap.w + dx);
        if (lock) h = w / aspect;
      } else if (dir === "w") {
        const nw = Math.max(MIN_W, snap.w - dx);
        x = snap.x + snap.w - nw;
        w = nw;
        if (lock) h = w / aspect;
      } else if (dir === "s") {
        h = Math.max(MIN_H, snap.h + dy);
        if (lock) w = h * aspect;
      } else if (dir === "n") {
        const nh = Math.max(MIN_H, snap.h - dy);
        y = snap.y + snap.h - nh;
        h = nh;
        if (lock) w = h * aspect;
      }

      // Contraindre dans la page A4
      x = clamp(x, 0, A4_W - w);
      y = clamp(y, 0, A4_H - h);
      onChange({ x, y, w, h });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [transform, onChange, lock]);

  /* ── Style positionnel (% du conteneur A4) ───────────────────────── */
  const posStyle: React.CSSProperties = {
    position:  "absolute",
    left:      `${(transform.x / A4_W) * 100}%`,
    top:       `${(transform.y / A4_H) * 100}%`,
    width:     `${(transform.w / A4_W) * 100}%`,
    height:    `${(transform.h / A4_H) * 100}%`,
    boxSizing: "border-box",
    userSelect:"none",
    touchAction:"none",
    cursor:    show ? "move" : "default",
    zIndex:    20,
  };

  /* ── Rendu ───────────────────────────────────────────────────────── */
  return (
    <div
      ref={ref}
      style={posStyle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseDown={(e) => interact(e, "move")}
    >
      {/* Image logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="logo"
        draggable={false}
        style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", pointerEvents:"none" }}
      />

      {/* Handles + toolbar (visible au survol / sélection) */}
      {show && (
        <>
          {/* Bordure en pointillés */}
          <div style={{
            position:"absolute", inset:0,
            border:"1.5px dashed rgba(99,102,241,0.85)",
            borderRadius:3,
            pointerEvents:"none",
          }}/>

          {/* Poignées de redimensionnement */}
          {HANDLES.map(({ dir, cursor, style: hs }) => (
            <div
              key={dir}
              onMouseDown={(e) => { e.stopPropagation(); interact(e, dir); }}
              style={{
                position:"absolute",
                width:10, height:10,
                background:"#ffffff",
                border:"1.5px solid rgba(99,102,241,0.85)",
                borderRadius:2,
                cursor,
                zIndex:21,
                ...hs,
              }}
            />
          ))}

          {/* Barre d'outils flottante */}
          <div
            style={{
              position:"absolute",
              top: -30,
              right: 0,
              display:"flex",
              alignItems:"center",
              gap:3,
              padding:"3px 6px",
              background:"rgba(8,10,20,0.93)",
              border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:8,
              boxShadow:"0 4px 18px rgba(0,0,0,0.55)",
              backdropFilter:"blur(14px)",
              whiteSpace:"nowrap",
              pointerEvents:"all",
              cursor:"default",
              zIndex:30,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Coordonnées */}
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.38)", fontFamily:"monospace" }}>
              {Math.round(transform.x)},{Math.round(transform.y)} · {Math.round(transform.w)}×{Math.round(transform.h)} mm
            </span>

            <div style={{ width:1, height:12, background:"rgba(255,255,255,0.12)", margin:"0 3px" }}/>

            {/* Lock aspect ratio */}
            <button
              title={lock ? "Ratio verrouillé (cliquer pour libérer)" : "Ratio libre (cliquer pour verrouiller)"}
              onClick={() => setLock(l => !l)}
              style={{
                background: lock ? "rgba(99,102,241,0.22)" : "transparent",
                border:"none",
                borderRadius:4,
                padding:"2px 5px",
                cursor:"pointer",
                color: lock ? "rgba(99,102,241,1)" : "rgba(255,255,255,0.35)",
                display:"flex",
                alignItems:"center",
              }}
            >
              {lock
                ? <Lock   size={9} strokeWidth={2.5}/>
                : <Unlock size={9} strokeWidth={2.5}/>
              }
            </button>

            {/* Reset */}
            <button
              title="Réinitialiser la position"
              onClick={() => { setSel(false); setHov(false); onReset(); }}
              style={{
                background:"transparent",
                border:"none",
                borderRadius:4,
                padding:"2px 5px",
                cursor:"pointer",
                color:"rgba(255,255,255,0.35)",
                display:"flex",
                alignItems:"center",
              }}
            >
              <RotateCcw size={9} strokeWidth={2.5}/>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
