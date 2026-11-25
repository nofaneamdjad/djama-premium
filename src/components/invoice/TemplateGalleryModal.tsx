"use client";

/**
 * TemplateGalleryModal — Galerie premium de sélection de modèles DJAMA
 *
 * Layout desktop  : panneau gauche (grille 3–4 col) + panneau droit (aperçu A4 + color picker)
 * Layout mobile   : grille 2 col + footer sticky « Utiliser ce modèle »
 * Aperçus         : LazyThumbnail via IntersectionObserver (render on demand)
 * Color picker    : 12 swatches prédéfinis + input natif + saisie HEX
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATE_CATALOG, TEMPLATE_FAMILIES } from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate }  from "@/components/invoice/InvoiceTemplate";
import { ScaledA4 }         from "@/components/invoice/TemplateSelector";
import { DEMO_DATA }        from "@/components/invoice/shared";
import type { TemplateType, TemplateFamily } from "@/lib/pdf/types";

const GOLD = "#FFB900";

/** 12 couleurs d'accent suggérées */
const ACCENT_PALETTE = [
  "#FFB900", "#1a2e4f", "#0d0d14", "#7c3aed",
  "#e11d48", "#0ea5e9", "#16a34a", "#f97316",
  "#c09040", "#b8972a", "#374151", "#9a3900",
];

function isLight(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  } catch { return false; }
}

// ── LazyCard ──────────────────────────────────────────────────────────────────

interface LazyCardProps {
  id:           TemplateType;
  label:        string;
  description:  string;
  badge:        { label: string; textColor: string; bgColor: string };
  previewBg:    string;
  previewColor: string;
  selected:     boolean;
  onClick:      () => void;
}

function LazyCard({ id, label, description, badge, previewBg, previewColor, selected, onClick }: LazyCardProps) {
  const ref            = useRef<HTMLButtonElement>(null);
  const [vis, setVis]  = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={description}
      className="group relative flex flex-col overflow-hidden rounded-xl transition-all duration-200 focus:outline-none"
      style={{
        border:     `2px solid ${selected ? GOLD : "#e5e7eb"}`,
        boxShadow:  selected
          ? `0 0 0 2px rgba(255,185,0,0.18), 0 4px 16px rgba(255,185,0,0.1)`
          : "0 1px 4px rgba(0,0,0,0.06)",
        background: "#ffffff",
      }}
    >
      {/* A4 preview */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "595/842" }}>
        {vis ? (
          <ScaledA4>
            <InvoiceTemplate type={id} data={DEMO_DATA} />
          </ScaledA4>
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(160deg, ${previewBg} 0%, ${previewColor}30 55%, #f3f4f6 100%)`,
            }}
          />
        )}

        {/* Selection overlay */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="sel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-start justify-end p-2"
              style={{ background: "rgba(255,185,0,0.07)" }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full shadow-md"
                style={{ background: GOLD }}
              >
                <Check size={12} color="#000" strokeWidth={3} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 text-left" style={{ background: "#ffffff" }}>
        <div
          className="truncate text-[11px] font-semibold leading-tight"
          style={{ color: selected ? GOLD : "#1a1a2e" }}
        >
          {label}
        </div>
        <span
          className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-none"
          style={{ background: badge.bgColor, color: badge.textColor }}
        >
          {badge.label}
        </span>
      </div>
    </button>
  );
}

// ── ColorSwatch ───────────────────────────────────────────────────────────────

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 focus:outline-none"
      style={{
        background: color,
        border:     `2px solid ${active ? GOLD : "rgba(0,0,0,0.08)"}`,
        outline:    active ? `2px solid rgba(255,185,0,0.28)` : "none",
        outlineOffset: 1,
        transform:  active ? "scale(1.15)" : "scale(1)",
      }}
    >
      {active && (
        <Check
          size={12}
          style={{ color: isLight(color) ? "#1a1a2e" : "#ffffff" }}
          strokeWidth={3}
        />
      )}
    </button>
  );
}

// ── RightPanel — aperçu agrandi + color picker + CTA ─────────────────────────

interface RightPanelProps {
  template:         TemplateType;
  couleur:          string;
  onCouleurChange:  (c: string) => void;
  hexInput:         string;
  onHexInput:       (v: string) => void;
  onApply:          () => void;
}

function RightPanel({ template, couleur, onCouleurChange, hexInput, onHexInput, onApply }: RightPanelProps) {
  const info        = TEMPLATE_CATALOG.find(t => t.id === template);
  const previewData = useMemo(() => ({ ...DEMO_DATA, color: couleur }), [couleur]);

  return (
    <div className="hidden md:flex w-72 xl:w-80 shrink-0 flex-col border-l border-gray-100 overflow-y-auto">

      {/* A4 agrandi */}
      <div className="p-4 bg-[#f8f9fa] border-b border-gray-100 shrink-0">
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <ScaledA4>
            <InvoiceTemplate type={template} data={previewData} />
          </ScaledA4>
        </div>
      </div>

      {/* Infos modèle */}
      <div className="px-4 pt-3.5 pb-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{info?.label}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
            style={{ background: info?.badge.bgColor, color: info?.badge.textColor }}
          >
            {info?.badge.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">{info?.description}</p>
      </div>

      <div className="mx-4 h-px bg-gray-100 shrink-0" />

      {/* Color picker */}
      <div className="px-4 py-4 shrink-0">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">
          Couleur d&apos;accent
        </p>

        {/* Swatches 2 × 6 */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {ACCENT_PALETTE.map(c => (
            <ColorSwatch
              key={c}
              color={c}
              active={couleur === c}
              onClick={() => { onCouleurChange(c); onHexInput(c); }}
            />
          ))}
        </div>

        {/* Custom + HEX */}
        <div className="flex items-center gap-2">
          {/* Native color input wrapped in colored div */}
          <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer"
            style={{ background: couleur }}>
            <input
              type="color"
              value={couleur}
              onChange={e => { onCouleurChange(e.target.value); onHexInput(e.target.value); }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Couleur personnalisée"
            />
          </div>
          {/* HEX text input */}
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 select-none">#</span>
            <input
              type="text"
              value={hexInput.replace(/^#/, "").toUpperCase()}
              onChange={e => onHexInput(e.target.value)}
              maxLength={6}
              spellCheck={false}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-6 pr-3 text-xs font-mono uppercase outline-none transition focus:border-[#FFB900] focus:bg-white focus:ring-2 focus:ring-[rgba(255,185,0,0.15)]"
              style={{ color: "#1a1a2e" }}
              placeholder="FFB900"
            />
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gray-100 shrink-0" />

      {/* CTA */}
      <div className="p-4 mt-auto shrink-0">
        <button
          type="button"
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-[0_4px_16px_rgba(255,185,0,0.28)] transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: GOLD, color: "#000" }}
        >
          <Check size={15} strokeWidth={3} />
          Utiliser ce modèle
        </button>
      </div>
    </div>
  );
}

// ── TemplateGalleryModal ──────────────────────────────────────────────────────

export interface TemplateGalleryModalProps {
  open:            boolean;
  currentTemplate: TemplateType;
  currentCouleur:  string;
  onApply:         (template: TemplateType, couleur: string) => void;
  onClose:         () => void;
}

export function TemplateGalleryModal({
  open,
  currentTemplate,
  currentCouleur,
  onApply,
  onClose,
}: TemplateGalleryModalProps) {

  const [localTemplate, setLocalTemplate] = useState<TemplateType>(currentTemplate);
  const [localCouleur,  setLocalCouleur]  = useState(currentCouleur);
  const [hexInput,      setHexInput]      = useState(currentCouleur);
  const [search,        setSearch]        = useState("");
  const [family,        setFamily]        = useState<TemplateFamily | "all">("all");

  /* Sync state quand la modal s'ouvre */
  useEffect(() => {
    if (open) {
      setLocalTemplate(currentTemplate);
      setLocalCouleur(currentCouleur);
      setHexInput(currentCouleur);
      setSearch("");
      setFamily("all");
    }
  }, [open, currentTemplate, currentCouleur]);

  /* Escape pour fermer */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  /* Templates filtrés */
  const filtered = useMemo(() => {
    return TEMPLATE_CATALOG.filter(t => {
      const matchFamily = family === "all" || t.family === family;
      const q           = search.toLowerCase();
      const matchSearch = !q
        || t.label.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.badge.label.toLowerCase().includes(q)
        || t.family.toLowerCase().includes(q);
      return matchFamily && matchSearch;
    });
  }, [family, search]);

  /* Validation HEX depuis le champ texte */
  function handleHexInput(raw: string) {
    const sanitised = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexInput(sanitised);
    if (sanitised.length === 6) setLocalCouleur(`#${sanitised}`);
  }

  function handleApply() {
    onApply(localTemplate, localCouleur);
    onClose();
  }

  const selectedInfo = TEMPLATE_CATALOG.find(t => t.id === localTemplate);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gallery-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-stretch justify-center p-0 sm:items-center sm:p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)" }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="gallery-panel"
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.97, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-[0_32px_80px_rgba(0,0,0,0.3)] sm:h-[92vh] sm:rounded-2xl"
          >

            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0a0a12" }}>
                  Choisir un modèle
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {TEMPLATE_CATALOG.length} modèles professionnels · aperçus A4 réels
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* CTA visible dans le header sur desktop (redondant mais accessible) */}
                <button
                  type="button"
                  onClick={handleApply}
                  className="hidden sm:flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-[0_2px_10px_rgba(255,185,0,0.25)] transition hover:opacity-90 active:scale-[0.98]"
                  style={{ background: GOLD, color: "#000" }}
                >
                  <Check size={14} strokeWidth={3} />
                  Utiliser ce modèle
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Recherche + filtres famille ── */}
            <div className="shrink-0 border-b border-gray-100 px-5 py-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                {/* Search */}
                <div className="relative min-w-0 sm:w-56 shrink-0">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-[#FFB900] focus:bg-white focus:ring-2 focus:ring-[rgba(255,185,0,0.15)]"
                    style={{ color: "#1a1a2e" }}
                  />
                </div>
                {/* Filter chips */}
                <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setFamily("all")}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                    style={{
                      background: family === "all" ? GOLD : "#f3f4f6",
                      color:      family === "all" ? "#000" : "#6b7280",
                    }}
                  >
                    Tous ({TEMPLATE_CATALOG.length})
                  </button>
                  {TEMPLATE_FAMILIES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFamily(f.id)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                      style={{
                        background: family === f.id ? GOLD : "#f3f4f6",
                        color:      family === f.id ? "#000" : "#6b7280",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Corps : grille gauche + panneau droit ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* Grille scrollable */}
              <div className="flex-1 overflow-y-auto p-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                    <p className="text-sm font-medium">Aucun modèle trouvé</p>
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setFamily("all"); }}
                      className="mt-2 text-xs underline hover:text-gray-600 transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {filtered.map(t => (
                      <LazyCard
                        key={t.id}
                        id={t.id}
                        label={t.label}
                        description={t.description}
                        badge={t.badge}
                        previewBg={t.previewBg}
                        previewColor={t.previewColor}
                        selected={localTemplate === t.id}
                        onClick={() => setLocalTemplate(t.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Panneau droit — masqué sur mobile */}
              <RightPanel
                template={localTemplate}
                couleur={localCouleur}
                onCouleurChange={setLocalCouleur}
                hexInput={hexInput}
                onHexInput={handleHexInput}
                onApply={handleApply}
              />
            </div>

            {/* ── Footer mobile : modèle sélectionné + CTA ── */}
            <div
              className="flex md:hidden shrink-0 items-center gap-3 border-t border-gray-100 px-4 py-3"
              style={{ background: "#ffffff" }}
            >
              {/* Mini swatch couleur */}
              <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                style={{ background: localCouleur }}>
                <input
                  type="color"
                  value={localCouleur}
                  onChange={e => { setLocalCouleur(e.target.value); setHexInput(e.target.value); }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              {/* Info modèle */}
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-sm font-bold"
                  style={{ color: "#0a0a12" }}
                >
                  {selectedInfo?.label}
                </div>
                <div className="text-xs text-gray-400">{selectedInfo?.badge.label}</div>
              </div>
              {/* CTA */}
              <button
                type="button"
                onClick={handleApply}
                className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-[0_2px_8px_rgba(255,185,0,0.25)] transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: GOLD, color: "#000" }}
              >
                <Check size={14} strokeWidth={3} />
                Utiliser
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
