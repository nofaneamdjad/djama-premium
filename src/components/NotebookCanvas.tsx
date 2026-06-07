"use client";
/**
 * NotebookCanvas — canvas de dessin DJAMA
 * v2: stylo/souris uniquement par défaut · fingerMode pour doigt · pinch-to-zoom
 */
import { useRef, useEffect, useCallback } from "react";

export type NbPageStyle = "blank" | "lined" | "grid" | "dotted" | "agenda";
export type NbTool      = "pen" | "eraser" | "highlighter";

export interface NbPoint  { x: number; y: number }
export interface NbStroke {
  id:      string;
  points:  NbPoint[];
  color:   string;
  width:   number;
  tool:    NbTool;
  opacity: number;
}

const PAGE_BG = "#f8f7f4";

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, style: NbPageStyle) {
  ctx.fillStyle = PAGE_BG;
  ctx.fillRect(0, 0, w, h);
  if (style === "blank") return;

  if (style === "lined") {
    ctx.save();
    ctx.strokeStyle = "rgba(100,116,139,0.18)"; ctx.lineWidth = 0.75;
    for (let y = 44; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(14,y); ctx.lineTo(w-14,y); ctx.stroke(); }
    ctx.strokeStyle = "rgba(220,38,38,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(58,0); ctx.lineTo(58,h); ctx.stroke();
    ctx.restore(); return;
  }

  if (style === "grid") {
    ctx.save(); ctx.strokeStyle = "rgba(100,116,139,0.15)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.restore(); return;
  }

  if (style === "dotted") {
    ctx.save(); ctx.fillStyle = "rgba(100,116,139,0.28)";
    for (let x = 24; x < w; x += 24)
      for (let y = 24; y < h; y += 24) { ctx.beginPath(); ctx.arc(x,y,0.9,0,Math.PI*2); ctx.fill(); }
    ctx.restore(); return;
  }

  if (style === "agenda") {
    const labels = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00",
                    "15:00","16:00","17:00","18:00","19:00","20:00"];
    ctx.save();
    ctx.font = "9.5px system-ui, -apple-system, sans-serif";
    labels.forEach((lbl, i) => {
      const y = 50 + i * 52;
      ctx.fillStyle = "rgba(100,116,139,0.45)"; ctx.fillText(lbl, 6, y+4);
      ctx.strokeStyle = "rgba(100,116,139,0.2)"; ctx.lineWidth = 0.75;
      ctx.beginPath(); ctx.moveTo(52,y); ctx.lineTo(w-8,y); ctx.stroke();
      ctx.save(); ctx.setLineDash([4,4]); ctx.strokeStyle = "rgba(100,116,139,0.08)";
      ctx.beginPath(); ctx.moveTo(52,y+26); ctx.lineTo(w-8,y+26); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
}

function paintStroke(ctx: CanvasRenderingContext2D, s: NbStroke) {
  if (!s.points.length) return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  const isEraser  = s.tool === "eraser";
  ctx.strokeStyle = isEraser ? PAGE_BG : s.color;
  ctx.fillStyle   = isEraser ? PAGE_BG : s.color;
  ctx.lineWidth   = s.width;
  ctx.lineCap     = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (s.points.length === 1) {
    ctx.arc(s.points[0].x, s.points[0].y, s.width/2, 0, Math.PI*2);
    ctx.fill();
  } else {
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length - 1; i++) {
      const mx = (s.points[i].x + s.points[i+1].x) / 2;
      const my = (s.points[i].y + s.points[i+1].y) / 2;
      ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my);
    }
    ctx.lineTo(s.points[s.points.length-1].x, s.points[s.points.length-1].y);
    ctx.stroke();
  }
  ctx.restore();
}

/* ─── Component ─── */
interface Props {
  pageStyle:       NbPageStyle;
  strokes:         NbStroke[];
  onStrokesChange: (s: NbStroke[]) => void;
  tool:            NbTool;
  penColor:        string;
  penWidth:        number;
  readOnly?:       boolean;
  /** false = stylo/souris uniquement  ·  true = le doigt peut dessiner aussi */
  fingerMode?:     boolean;
  /** zoom courant (pour le calcul du delta pinch) */
  currentZoom?:    number;
  /** appelé lors d'un pinch avec la nouvelle valeur de zoom souhaitée */
  onZoomChange?:   (z: number) => void;
}

export default function NotebookCanvas({
  pageStyle, strokes, onStrokesChange, tool, penColor, penWidth,
  readOnly = false, fingerMode = false, currentZoom = 1, onZoomChange,
}: Props) {
  const cvRef   = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const active  = useRef<NbStroke | null>(null);
  const sRef    = useRef(strokes);
  sRef.current  = strokes;

  /* Multi-touch tracking ─── */
  const touchPts  = useRef<Map<number, { x:number; y:number }>>(new Map());
  const pinchInfo = useRef<{ startDist:number; startZoom:number } | null>(null);
  const zRef      = useRef(currentZoom);
  zRef.current    = currentZoom;

  const redraw = useCallback(() => {
    const cv = cvRef.current;        if (!cv)  return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    drawBackground(ctx, cv.width, cv.height, pageStyle);
    sRef.current.forEach(s => paintStroke(ctx, s));
    if (active.current) paintStroke(ctx, active.current);
  }, [pageStyle]);

  useEffect(() => { redraw(); }, [redraw, strokes]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const parent = cv.parentElement ?? cv;
    const fit = () => { cv.width = cv.offsetWidth; cv.height = cv.offsetHeight; redraw(); };
    const ro = new ResizeObserver(fit);
    ro.observe(parent); fit();
    return () => ro.disconnect();
  }, [redraw]);

  /* Helpers ─── */
  const xy = (e: React.PointerEvent<HTMLCanvasElement>): NbPoint => {
    const r  = cvRef.current!.getBoundingClientRect();
    const cv = cvRef.current!;
    return {
      x: (e.clientX - r.left) * (cv.width  / r.width),
      y: (e.clientY - r.top)  * (cv.height / r.height),
    };
  };

  const dist2 = (a:{x:number;y:number}, b:{x:number;y:number}) =>
    Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

  /* ─── Pointer handlers ─── */
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    /* 2+ touches → pinch zoom (annule tout tracé en cours) */
    if (e.pointerType === "touch" && touchPts.current.size >= 2) {
      drawing.current = false;
      active.current  = null;
      const pts = Array.from(touchPts.current.values());
      pinchInfo.current = { startDist: dist2(pts[0], pts[1]), startZoom: zRef.current };
      return;
    }

    /* toucher unique en mode stylo-seul → ignoré */
    if (e.pointerType === "touch" && !fingerMode) return;

    /* Dessin normal */
    drawing.current = true;
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    active.current = {
      id, points: [xy(e)], color: penColor,
      width:   tool === "eraser" ? penWidth * 5 : penWidth,
      tool,
      opacity: tool === "highlighter" ? 0.28 : 1,
    };
    redraw();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchPts.current.has(e.pointerId))
      touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    /* Pinch en cours */
    if (touchPts.current.size >= 2 && pinchInfo.current) {
      const pts = Array.from(touchPts.current.values());
      const d   = dist2(pts[0], pts[1]);
      const nz  = (d / pinchInfo.current.startDist) * pinchInfo.current.startZoom;
      onZoomChange?.(Math.min(4, Math.max(0.5, nz)));
      return;
    }

    if (!drawing.current || !active.current) return;
    active.current.points.push(xy(e));
    redraw();
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touchPts.current.delete(e.pointerId);
    if (touchPts.current.size < 2) pinchInfo.current = null;
    if (!drawing.current || !active.current) return;
    drawing.current = false;
    onStrokesChange([...sRef.current, active.current]);
    active.current = null;
  };

  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    />
  );
}
