"use client";

/**
 * /client/factures/galerie — Galerie premium des 24 modèles DJAMA
 * 3 colonnes desktop · 2 tablette · 1 mobile
 * Aperçus A4 réels · sélection persistante · prévisualisation plein écran avec zoom
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Eye, Check, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Loader2, Palette, Maximize2,
} from "lucide-react";
import Link from "next/link";
import { TEMPLATE_CATALOG, TEMPLATE_FAMILIES } from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { ScaledA4 } from "@/components/invoice/TemplateSelector";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import type { TemplateType, TemplateFamily } from "@/lib/pdf/types";
import type { PreviewData } from "@/components/invoice/shared";

const YELLOW = "#FFB900";
const SETTING_KEY = "brand.template";

// ── Données de démonstration ──────────────────────────────────────────────────

const DEMO_DATA: PreviewData = {
  type:            "invoice",
  reference:       "FAC-2026-042",
  issue_date:      "2026-11-17",
  due_date:        "2026-12-17",
  client_name:     "Sophie Moreau",
  client_email:    "s.moreau@exemple.fr",
  client_company:  "Moreau Architecture SARL",
  client_address:  "8 rue Haussmann\n75009 Paris",
  subject:         "Développement interface web — Projet Horizon",
  items: [
    { description: "Conception UI/UX",         quantity: 8,  unit_price: 150, total: 1200 },
    { description: "Développement frontend",   quantity: 20, unit_price: 120, total: 2400 },
    { description: "Intégration API",          quantity: 12, unit_price: 130, total: 1560 },
    { description: "Recette & documentation",  quantity: 4,  unit_price: 100, total:  400 },
  ],
  subtotal:     5560,
  discount_rate: 5,
  discount:      278,
  tax_rate:      20,
  tax_amount:    1056.4,
  total:         6334.4,
  notes:         "Paiement à 30 jours. Pénalités de retard : 3× taux légal en vigueur.",
  company: {
    name:        "DJAMA Pro SASU",
    email:       "contact@djama.io",
    website:     "www.djama.io",
    phone:       "+33 1 23 45 67 89",
    address:     "42 avenue des Entrepreneurs",
    postal_code: "75008",
    city:        "Paris",
    siret:       "123 456 789 00012",
    vat_number:  "FR12345678900",
  },
};

// ── LazyPreview — ne rend la carte qu'une fois visible dans le viewport ───────

function LazyPreview({
  type, data, previewBg, previewColor,
}: {
  type: TemplateType;
  data: PreviewData;
  previewBg: string;
  previewColor: string;
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      {vis ? (
        <ScaledA4>
          <InvoiceTemplate type={type} data={data} />
        </ScaledA4>
      ) : (
        <div
          style={{
            aspectRatio: "595 / 842",
            background: `linear-gradient(160deg, ${previewBg} 0%, ${previewColor}20 60%, #f8f8f8 100%)`,
          }}
        />
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-xl"
      style={{ background: YELLOW, color: "#1a1200" }}
    >
      <Check size={14} strokeWidth={3} />
      {msg}
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function GaleriePage() {
  const { isDark } = useTheme();

  const [search,          setSearch]          = useState("");
  const [activeFamily,    setActiveFamily]    = useState<TemplateFamily | "all">("all");
  const [defaultTemplate, setDefaultTemplate] = useState<TemplateType>("min-ligne");
  const [savingId,        setSavingId]        = useState<string | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [fullscreen,      setFullscreen]      = useState<TemplateType | null>(null);
  const [fsType,          setFsType]          = useState<"invoice" | "quote">("invoice");
  const [zoom,            setZoom]            = useState(0.85);
  const [toast,           setToast]           = useState<string | null>(null);

  // ── Couleurs thème — UI adapte, documents restent blancs ──────────────────
  const pageBg   = isDark ? "#0f1117"                 : "#f4f4f6";
  const headerBg = isDark ? "#181820"                 : "#ffffff";
  const fg       = isDark ? "#f1f1f1"                 : "#111827";
  const fgMid    = isDark ? "rgba(255,255,255,0.45)"  : "#6b7280";
  const fgLow    = isDark ? "rgba(255,255,255,0.22)"  : "#9ca3af";
  const border   = isDark ? "rgba(255,255,255,0.08)"  : "#e5e7eb";
  const inputBg  = isDark ? "rgba(255,255,255,0.05)"  : "#f9fafb";

  // ── Chargement template par défaut ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (data?.value) setDefaultTemplate(data.value as TemplateType);
      setLoading(false);
    })();
  }, []);

  // ── Sauvegarder le template par défaut ─────────────────────────────────────
  const handleUse = useCallback(async (id: TemplateType) => {
    if (id === defaultTemplate) return;
    setSavingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_settings").upsert(
        { user_id: user.id, key: SETTING_KEY, value: id },
        { onConflict: "user_id,key" },
      );
    }
    setDefaultTemplate(id);
    setSavingId(null);
    setToast("Modèle par défaut mis à jour ✓");
  }, [defaultTemplate]);

  // ── Filtrage ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = activeFamily === "all"
      ? TEMPLATE_CATALOG
      : TEMPLATE_CATALOG.filter(t => t.family === activeFamily);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.family.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeFamily, search]);

  // ── Groupement par famille pour le mode "tous" ──────────────────────────────
  const grouped = useMemo(() => {
    if (activeFamily !== "all" || search.trim()) return null;
    return TEMPLATE_FAMILIES.map(fam => ({
      ...fam,
      templates: TEMPLATE_CATALOG.filter(t => t.family === fam.id),
    }));
  }, [activeFamily, search]);

  // ── Navigation fullscreen ───────────────────────────────────────────────────
  const fsIndex = fullscreen ? TEMPLATE_CATALOG.findIndex(t => t.id === fullscreen) : -1;
  const fsInfo  = fullscreen ? TEMPLATE_CATALOG.find(t => t.id === fullscreen) : null;

  const fsPrev = useCallback(() => {
    if (fsIndex > 0) setFullscreen(TEMPLATE_CATALOG[fsIndex - 1].id as TemplateType);
  }, [fsIndex]);
  const fsNext = useCallback(() => {
    if (fsIndex < TEMPLATE_CATALOG.length - 1)
      setFullscreen(TEMPLATE_CATALOG[fsIndex + 1].id as TemplateType);
  }, [fsIndex]);

  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape")     setFullscreen(null);
      if (e.key === "ArrowLeft")  fsPrev();
      if (e.key === "ArrowRight") fsNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fullscreen, fsPrev, fsNext]);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: pageBg }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b" style={{ background: headerBg, borderColor: border }}>
        {/* Titre + bouton Personnaliser */}
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div>
            <h1 className="text-sm font-extrabold" style={{ color: fg }}>Galerie des modèles</h1>
            <p className="text-xs" style={{ color: fgMid }}>24 modèles · 6 familles · aperçus A4 réels</p>
          </div>
          <Link
            href="/client/factures/parametres"
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ background: `${YELLOW}18`, color: YELLOW, border: `1px solid ${YELLOW}35` }}
          >
            <Palette size={12} />
            Personnaliser
          </Link>
        </div>

        {/* Recherche + filtres famille */}
        <div className="flex flex-wrap items-center gap-3 px-6 pb-3">
          {/* Champ recherche */}
          <div className="relative min-w-[180px] max-w-[240px]">
            <Search
              size={12}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: fgLow }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none transition"
              style={{ background: inputBg, border: `1px solid ${border}`, color: fg }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={10} style={{ color: fgLow }} />
              </button>
            )}
          </div>

          {/* Chips famille */}
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "all" as const, label: "Tous", count: 24 },
              ...TEMPLATE_FAMILIES.map(f => ({ id: f.id, label: f.label, count: f.count })),
            ].map(f => {
              const active = activeFamily === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFamily(f.id as TemplateFamily | "all")}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold transition"
                  style={active
                    ? { background: `${YELLOW}20`, color: YELLOW, border: `1px solid ${YELLOW}40` }
                    : { background: "transparent", color: fgMid, border: `1px solid ${border}` }
                  }
                >
                  {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── GRILLE ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: YELLOW }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search size={32} style={{ color: fgLow }} />
            <p className="text-sm font-semibold" style={{ color: fgMid }}>Aucun modèle trouvé</p>
            <p className="text-xs" style={{ color: fgLow }}>Essayez une autre recherche ou famille</p>
          </div>
        ) : grouped ? (
          /* Mode "tous" : sections par famille */
          <div className="space-y-10">
            {grouped.map(fam => (
              <section key={fam.id}>
                <div className="mb-4 flex items-center gap-3">
                  <h2
                    className="text-[10px] font-black tracking-widest uppercase"
                    style={{ color: fgLow }}
                  >
                    {fam.label}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: border }} />
                  <span className="text-[10px]" style={{ color: fgLow }}>4 modèles</span>
                </div>
                <TemplateGrid
                  templates={fam.templates}
                  defaultTemplate={defaultTemplate}
                  savingId={savingId}
                  isDark={isDark}
                  border={border}
                  onPreview={id => setFullscreen(id)}
                  onUse={handleUse}
                />
              </section>
            ))}
          </div>
        ) : (
          /* Mode filtré : grille plate */
          <TemplateGrid
            templates={filtered}
            defaultTemplate={defaultTemplate}
            savingId={savingId}
            isDark={isDark}
            border={border}
            onPreview={id => setFullscreen(id)}
            onUse={handleUse}
          />
        )}
      </div>

      {/* ── FULLSCREEN MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreen && fsInfo && (
          <motion.div
            key="fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          >
            {/* Barre supérieure */}
            <div
              className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b"
              style={{ background: "rgba(10,10,14,0.98)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              {/* Infos modèle */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: fsInfo.previewColor }} />
                <span className="text-sm font-bold text-white truncate">{fsInfo.label}</span>
                <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {fsInfo.family}
                </span>
                {fsInfo.badge && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: fsInfo.badge.bgColor, color: fsInfo.badge.textColor }}
                  >
                    {fsInfo.badge.label}
                  </span>
                )}
              </div>

              {/* Navigation + fermer */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fsPrev}
                  disabled={fsIndex === 0}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-30"
                  style={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <ChevronLeft size={12} /> Précédent
                </button>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {fsIndex + 1}/{TEMPLATE_CATALOG.length}
                </span>
                <button
                  onClick={fsNext}
                  disabled={fsIndex === TEMPLATE_CATALOG.length - 1}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-30"
                  style={{ color: "rgba(255,255,255,0.65)", borderColor: "rgba(255,255,255,0.12)" }}
                >
                  Suivant <ChevronRight size={12} />
                </button>
                <button
                  onClick={() => setFullscreen(null)}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl border transition"
                  style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)" }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Zone document zoomable */}
            <div className="flex-1 overflow-y-auto flex items-start justify-center px-4 py-8">
              <div className="w-full" style={{ maxWidth: `${Math.round(595 * zoom)}px` }}>
                <p className="text-center text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {fsInfo.description}
                </p>
                <div className="overflow-hidden rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                  <ScaledA4>
                    <InvoiceTemplate
                      type={fullscreen}
                      data={{ ...DEMO_DATA, type: fsType }}
                    />
                  </ScaledA4>
                </div>
                <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.18)" }}>
                  Données de démonstration — rendu identique à votre vraie facture
                </p>
              </div>
            </div>

            {/* Barre inférieure */}
            <div
              className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-t"
              style={{ background: "rgba(10,10,14,0.98)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              {/* Toggle Facture / Devis */}
              <div
                className="flex overflow-hidden rounded-xl border"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                {(["invoice", "quote"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFsType(t)}
                    className="px-3 py-1.5 text-xs font-semibold transition"
                    style={fsType === t
                      ? { background: YELLOW, color: "#1a1200" }
                      : { background: "transparent", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {t === "invoice" ? "Facture" : "Devis"}
                  </button>
                ))}
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, +(z - 0.125).toFixed(3)))}
                  className="p-1.5 rounded-lg border transition"
                  style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-xs font-mono w-10 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(1.2, +(z + 0.125).toFixed(3)))}
                  className="p-1.5 rounded-lg border transition"
                  style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Utiliser ce modèle */}
              <button
                onClick={async () => { await handleUse(fullscreen); setFullscreen(null); }}
                disabled={!!savingId || fullscreen === defaultTemplate}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition disabled:opacity-50"
                style={fullscreen === defaultTemplate
                  ? { background: `${YELLOW}20`, color: YELLOW, border: `1px solid ${YELLOW}40` }
                  : { background: YELLOW, color: "#1a1200" }
                }
              >
                {savingId === fullscreen ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : fullscreen === defaultTemplate ? (
                  <><Check size={12} strokeWidth={3} /> Modèle actuel</>
                ) : (
                  "Utiliser ce modèle"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── TemplateGrid ──────────────────────────────────────────────────────────────

type TplInfo = typeof TEMPLATE_CATALOG[0];

function TemplateGrid({
  templates, defaultTemplate, savingId, isDark, border, onPreview, onUse,
}: {
  templates:       TplInfo[];
  defaultTemplate: TemplateType;
  savingId:        string | null;
  isDark:          boolean;
  border:          string;
  onPreview:       (id: TemplateType) => void;
  onUse:           (id: TemplateType) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {templates.map(tpl => (
        <TemplateCard
          key={tpl.id}
          template={tpl}
          isDefault={tpl.id === defaultTemplate}
          isSaving={savingId === tpl.id}
          isDark={isDark}
          border={border}
          onPreview={onPreview}
          onUse={onUse}
        />
      ))}
    </div>
  );
}

// ── TemplateCard ──────────────────────────────────────────────────────────────

function TemplateCard({
  template, isDefault, isSaving, isDark, border, onPreview, onUse,
}: {
  template:  TplInfo;
  isDefault: boolean;
  isSaving:  boolean;
  isDark:    boolean;
  border:    string;
  onPreview: (id: TemplateType) => void;
  onUse:     (id: TemplateType) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        /* Les cartes sont toujours blanches — les documents sont sur du papier */
        background: "#ffffff",
        border: `${isDefault ? 2.5 : 1.5}px solid ${
          isDefault ? YELLOW : (isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb")
        }`,
        boxShadow: isDefault
          ? `0 0 0 3px ${YELLOW}22, 0 4px 20px rgba(0,0,0,0.12)`
          : isDark
            ? "0 2px 16px rgba(0,0,0,0.5)"
            : "0 2px 10px rgba(0,0,0,0.07)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge « Par défaut » */}
      {isDefault && (
        <div
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black shadow"
          style={{ background: YELLOW, color: "#1a1200" }}
        >
          <Check size={8} strokeWidth={3.5} />
          Par défaut
        </div>
      )}

      {/* Zone aperçu A4 — clique pour ouvrir la prévisualisation */}
      <div
        className="relative overflow-hidden cursor-pointer"
        onClick={() => onPreview(template.id as TemplateType)}
      >
        <LazyPreview
          type={template.id as TemplateType}
          data={DEMO_DATA}
          previewBg={template.previewBg}
          previewColor={template.previewColor}
        />

        {/* Overlay au survol */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-3"
              style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(3px)" }}
            >
              <button
                onClick={e => { e.stopPropagation(); onPreview(template.id as TemplateType); }}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <Maximize2 size={12} /> Aperçu
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (!isSaving && !isDefault) onUse(template.id as TemplateType);
                }}
                disabled={isSaving || isDefault}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-50"
                style={isDefault
                  ? { background: `${YELLOW}30`, color: YELLOW, border: `1px solid ${YELLOW}50` }
                  : { background: YELLOW, color: "#1a1200" }
                }
              >
                {isSaving
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Check size={12} strokeWidth={3} />
                }
                {isDefault ? "Par défaut" : "Utiliser"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer — toujours blanc (cohérence carte = document papier) */}
      <div className="px-3.5 py-3 border-t" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate text-gray-900">
              {template.label}
            </div>
            <div className="text-[10px] mt-0.5 capitalize text-gray-400">{template.family}</div>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
            style={{ background: template.badge.bgColor, color: template.badge.textColor }}
          >
            {template.badge.label}
          </span>
        </div>
        <p className="text-[11px] leading-snug line-clamp-2 text-gray-500 mb-2.5">
          {template.description}
        </p>
        {/* Deux actions explicites */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(template.id as TemplateType)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition"
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
          >
            <Eye size={11} /> Aperçu
          </button>
          <button
            onClick={() => { if (!isSaving && !isDefault) onUse(template.id as TemplateType); }}
            disabled={isSaving || isDefault}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition disabled:opacity-60"
            style={isDefault
              ? { background: `${YELLOW}15`, color: YELLOW, border: `1px solid ${YELLOW}30` }
              : { background: YELLOW, color: "#1a1200" }
            }
          >
            {isSaving
              ? <Loader2 size={11} className="animate-spin" />
              : <Check size={11} strokeWidth={3} />
            }
            {isDefault ? "Défaut" : "Utiliser"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
