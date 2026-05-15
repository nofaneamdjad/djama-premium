"use client";
/**
 * TemplateSelector — Sélecteur de template premium.
 *
 * - Thumbnails A4 live avec ScaledA4 (ResizeObserver) + LazyThumbnail (IntersectionObserver)
 * - Cartes Framer Motion : hover scale, AnimatePresence check badge
 * - Badges par template (Populaire, Clean, Corporate…)
 * - Bouton "Aperçu" → PreviewModal plein écran avec navigation entre templates
 * - Mobile : scroll horizontal, ~2.5 cartes visibles
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { TemplateType }  from "@/lib/pdf/types";
import { TEMPLATE_INFO }      from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate }    from "./InvoiceTemplate";
import { DEMO_DATA }          from "./shared";
import type { PreviewData }   from "./shared";

export interface TemplateSelectorProps {
  value:    TemplateType;
  onChange: (t: TemplateType) => void;
  /** Données réelles pour les previews. Si absent → données de démo */
  data?:    PreviewData;
}

// ── ScaledA4 — adapte un rendu 595 × 842 px à la largeur du container ────────

function ScaledA4({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setScale(w / 595);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ aspectRatio: "595/842" }}>
      <div
        style={{
          width:           595,
          height:          842,
          transform:       `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents:   "none",
          userSelect:      "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── LazyThumbnail — ne rend qu'une fois la carte dans le viewport ─────────────

function LazyThumbnail({ type, data }: { type: TemplateType; data: PreviewData }) {
  const ref     = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const headerColor = TEMPLATE_INFO.find(t => t.id === type)?.headerColor ?? "#1a1a1a";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setReady(true); io.disconnect(); } },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ aspectRatio: "595/842" }}>
      {ready ? (
        <ScaledA4>
          <InvoiceTemplate type={type} data={data} />
        </ScaledA4>
      ) : (
        /* Skeleton coloré : simule la couleur du header du template */
        <div
          className="w-full h-full rounded-lg"
          style={{ background: `linear-gradient(160deg, ${headerColor} 0%, ${headerColor}40 35%, #f3f4f6 100%)` }}
        />
      )}
    </div>
  );
}

// ── PreviewModal — plein écran, navigation entre templates ────────────────────

function PreviewModal({
  initial,
  data,
  selected,
  onSelect,
  onClose,
}: {
  initial:  TemplateType;
  data:     PreviewData;
  selected: TemplateType;
  onSelect: (t: TemplateType) => void;
  onClose:  () => void;
}) {
  const [active, setActive] = useState<TemplateType>(initial);
  const info        = TEMPLATE_INFO.find(t => t.id === active)!;
  const activeIndex = TEMPLATE_INFO.findIndex(t => t.id === active);

  const prev = () => setActive(TEMPLATE_INFO[(activeIndex - 1 + TEMPLATE_INFO.length) % TEMPLATE_INFO.length].id);
  const next = () => setActive(TEMPLATE_INFO[(activeIndex + 1) % TEMPLATE_INFO.length].id);

  /* Escape pour fermer */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const isSelected = selected === active;

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl border border-gray-200 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.15)] overflow-hidden"
      >
        {/* ─── Header ─── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[0.9rem] font-black text-gray-900">{info.label}</p>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[0.59rem] font-bold"
                style={{ color: info.badge.textColor, background: info.badge.bgColor }}
              >
                {info.badge.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[0.67rem] text-gray-400">{info.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-xl border border-gray-200 p-2 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex shrink-0 gap-1 border-b border-gray-100 px-4 py-2.5 overflow-x-auto">
          {TEMPLATE_INFO.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                "shrink-0 rounded-full px-3 py-1 text-[0.65rem] font-bold transition-all duration-150",
                active === t.id
                  ? "bg-[#c9a55a] text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Preview scrollable ─── */}
        <div className="relative flex-1 overflow-y-auto p-5 bg-[#f8f9fa]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{    opacity: 0, x: -14 }}
              transition={{ duration: 0.16 }}
              className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <ScaledA4>
                <InvoiceTemplate type={active} data={data} />
              </ScaledA4>
            </motion.div>
          </AnimatePresence>

          {/* Flèches de navigation */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 backdrop-blur-sm transition-all hover:bg-white hover:text-gray-700 active:scale-95 shadow-sm"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 backdrop-blur-sm transition-all hover:bg-white hover:text-gray-700 active:scale-95 shadow-sm"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* ─── Footer ─── */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-5 py-3.5">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {TEMPLATE_INFO.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={[
                  "rounded-full transition-all duration-200",
                  active === t.id ? "w-5 h-1.5 bg-[#c9a55a]" : "w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300",
                ].join(" ")}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onSelect(active); onClose(); }}
            className={[
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.73rem] font-bold transition-all duration-150",
              isSelected
                ? "bg-[#c9a55a]/15 text-[#c9a55a] cursor-default"
                : "bg-[#c9a55a] text-white hover:bg-[#d4af6a] shadow-[0_4px_16px_rgba(201,165,90,0.3)]",
            ].join(" ")}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSelected ? (
                <motion.span key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <Check size={11} strokeWidth={3} /> Sélectionné
                </motion.span>
              ) : (
                <motion.span key="use" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Utiliser ce modèle
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PreviewCard — carte individuelle animée ───────────────────────────────────

interface PreviewCardProps {
  info:      (typeof TEMPLATE_INFO)[number];
  selected:  boolean;
  data:      PreviewData;
  onSelect:  () => void;
  onPreview: () => void;
}

function PreviewCard({ info, selected, data, onSelect, onPreview }: PreviewCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.028, y: -4 }}
      whileTap={{   scale: 0.975 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={onSelect}
      className={[
        "group relative cursor-pointer rounded-2xl border-2 bg-white transition-colors duration-200",
        selected
          ? "border-[#c9a55a] shadow-[0_0_0_1px_rgba(201,165,90,0.2),0_8px_28px_rgba(201,165,90,0.1)]"
          : "border-gray-200 hover:border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
      ].join(" ")}
    >
      {/* Badge top-left */}
      <div className="absolute -top-2 left-2 z-10">
        <span
          className="rounded-full px-2 py-0.5 text-[0.52rem] font-bold leading-none whitespace-nowrap"
          style={{
            color:      info.badge.textColor,
            background: info.badge.bgColor,
            border:     `1px solid ${info.badge.textColor}22`,
          }}
        >
          {info.badge.label}
        </span>
      </div>

      {/* Check badge top-right */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{    scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a55a] shadow-[0_2px_8px_rgba(201,165,90,0.55)]"
          >
            <Check size={9} className="text-white" strokeWidth={3.5} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail */}
      <div className="p-1.5 pb-0">
        <div
          className={[
            "overflow-hidden rounded-xl border transition-colors duration-200",
            selected ? "border-[#c9a55a]/20" : "border-gray-100",
          ].join(" ")}
        >
          <LazyThumbnail type={info.id} data={data} />
        </div>
      </div>

      {/* Label + bouton aperçu */}
      <div className="flex items-center justify-between px-2 pb-2 pt-1.5">
        <p
          className={[
            "text-[0.62rem] font-bold truncate transition-colors duration-150",
            selected ? "text-[#c9a55a]" : "text-gray-500 group-hover:text-gray-700",
          ].join(" ")}
        >
          {info.label}
        </p>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onPreview(); }}
          className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[0.5rem] font-bold text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
        >
          <Eye size={7} /> Aperçu
        </button>
      </div>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function TemplateSelector({ value, onChange, data }: TemplateSelectorProps) {
  const previewData  = data ?? DEMO_DATA;
  const [modalTpl, setModalTpl] = useState<TemplateType | null>(null);
  const currentInfo  = TEMPLATE_INFO.find(t => t.id === value);

  return (
    <>
      <div className="space-y-3">
        {/* Label + badge actif */}
        <div className="flex items-center justify-between">
          <label className="text-[0.72rem] font-bold uppercase tracking-[0.07em] text-gray-400">
            Modèle de document
          </label>
          <AnimatePresence mode="wait">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y:  0 }}
              exit={{    opacity: 0, y:  4 }}
              transition={{ duration: 0.15 }}
              className="rounded-full px-2 py-0.5 text-[0.59rem] font-bold"
              style={{
                color:      currentInfo?.badge.textColor,
                background: currentInfo?.badge.bgColor,
              }}
            >
              {currentInfo?.badge.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/*
          Mobile : flex scroll horizontal, ~2.5 cartes visibles.
          Desktop (sm+) : grid 5 colonnes.
        */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5 sm:overflow-x-visible sm:pb-0">
          {TEMPLATE_INFO.map(info => (
            <div key={info.id} className="w-[calc(38vw-8px)] min-w-[88px] shrink-0 sm:w-auto sm:min-w-0">
              <PreviewCard
                info={info}
                selected={value === info.id}
                data={previewData}
                onSelect={() => onChange(info.id)}
                onPreview={() => setModalTpl(info.id)}
              />
            </div>
          ))}
        </div>

        {/* Description animée du template sélectionné */}
        <AnimatePresence mode="wait">
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 5  }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -5 }}
            transition={{ duration: 0.17 }}
            className="text-[0.67rem] italic text-gray-400"
          >
            {currentInfo?.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {modalTpl && (
          <PreviewModal
            key="modal"
            initial={modalTpl}
            data={previewData}
            selected={value}
            onSelect={onChange}
            onClose={() => setModalTpl(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
