"use client";

/**
 * CouvertureMondiale — Phase 11
 *
 * Dashboard de couverture internationale DJAMA.
 * Affiche tous les pays du monde avec leur niveau de couverture réglementaire.
 *
 * Règles de sécurité (spec) :
 * - Ne jamais afficher un pays comme "couvert" si ses règles ne sont pas validées.
 * - Ne jamais inventer une réglementation pour remplir artificiellement une carte.
 * - Chaque niveau affiché correspond à ce qui existe réellement dans le catalogue.
 */

import { useState, useMemo } from "react";
import { Globe, Search, ChevronDown, ChevronUp, ExternalLink, Info, Lock } from "lucide-react";
import { tok, GOLD } from "../decl-utils";
import {
  WORLD_COUNTRIES,
  REGION_LABELS,
  getCountriesByRegion,
  getCoverageStats,
  type CountryEntry,
  type CountryRegion,
} from "@/lib/declarations/countries-registry";
import type { CoverageLevel } from "@/lib/declarations/obligations-catalogue";

interface Props {
  isDark:           boolean;
  currentCountry?:  string;   // pays_constitution du profil courant
}

/* ── Configuration visuelle des niveaux ─────────────────────────────────── */

const LEVEL_CFG: Record<CoverageLevel, {
  label:       string;
  description: string;
  color:       string;
  dot:         string;
  order:       number;
}> = {
  non_disponible:       {
    label:       "Non disponible",
    description: "Aucune règle fiscale vérifiée pour ce pays. La couverture est prévue — contribution de la communauté possible.",
    color:       "#6b7280",
    dot:         "rgba(107,114,128,0.3)",
    order:       0,
  },
  information:          {
    label:       "Information",
    description: "Informations réglementaires de base disponibles (taux, autorité, sources officielles). Pas encore de calcul automatique.",
    color:       "#3b82f6",
    dot:         "rgba(59,130,246,0.7)",
    order:       1,
  },
  calendrier_verifie:   {
    label:       "Calendrier vérifié",
    description: "Calendrier fiscal validé avec dates officielles vérifiées.",
    color:       "#06b6d4",
    dot:         "rgba(6,182,212,0.8)",
    order:       2,
  },
  preparation_assistee: {
    label:       "Préparation assistée",
    description: "Pré-remplissage automatique depuis vos données comptables, guidage formulaires, vérification avant dépôt.",
    color:       GOLD,
    dot:         `${GOLD}cc`,
    order:       3,
  },
  export_officiel:      {
    label:       "Export officiel",
    description: "Génération du fichier au format officiel requis par l'administration fiscale.",
    color:       "#8b5cf6",
    dot:         "rgba(139,92,246,0.8)",
    order:       4,
  },
  depot_integre:        {
    label:       "Dépôt intégré",
    description: "Dépôt électronique direct via l'API officielle de l'administration. Confirmation de réception.",
    color:       "#22c55e",
    dot:         "rgba(34,197,94,0.8)",
    order:       5,
  },
};

const ALL_REGIONS: CountryRegion[] = [
  "europe",
  "afrique",
  "amerique_nord",
  "amerique_latine",
  "moyen_orient",
  "asie",
  "oceanie",
];

/* ── Sous-composant : badge de niveau ───────────────────────────────────── */

function LevelBadge({ level, small }: { level: CoverageLevel; small?: boolean }) {
  const cfg = LEVEL_CFG[level];
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      gap:           small ? 4 : 5,
      padding:       small ? "2px 7px" : "3px 9px",
      borderRadius:  99,
      background:    `${cfg.color}18`,
      border:        `1px solid ${cfg.color}40`,
      fontSize:      small ? 10 : 11,
      fontWeight:    600,
      color:         cfg.color,
      whiteSpace:    "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

/* ── Sous-composant : carte pays ────────────────────────────────────────── */

function CountryCard({ entry, isDark, isActive }: {
  entry:    CountryEntry;
  isDark:   boolean;
  isActive: boolean;
}) {
  const t   = tok(isDark);
  const cfg = LEVEL_CFG[entry.statut];

  return (
    <div style={{
      padding:      "10px 12px",
      borderRadius: 10,
      background:   isActive ? `${GOLD}12` : t.glass,
      border:       `1px solid ${isActive ? `${GOLD}50` : t.border}`,
      display:      "flex",
      flexDirection:"column",
      gap:          4,
      transition:   "all 0.15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: t.text, lineHeight: 1.3 }}>
          {entry.label}
        </span>
        <span style={{
          fontSize: 10, fontFamily: "monospace", color: t.text3,
          background: t.glassMd, borderRadius: 4, padding: "1px 5px",
          flexShrink: 0,
        }}>
          {entry.code}
        </span>
      </div>

      <LevelBadge level={entry.statut} small />

      {entry.note && (
        <span style={{ fontSize: 11, color: t.text3, fontStyle: "italic", marginTop: 2, lineHeight: 1.4 }}>
          {entry.note}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 11, color: t.text4 }}>{entry.devise}</span>
        {entry.statut === "non_disponible" && (
          <span style={{ fontSize: 11, color: t.text4, display: "flex", alignItems: "center", gap: 3 }}>
            <Lock size={10} /> Non couvert
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function CouvertureMondiale({ isDark, currentCountry }: Props) {
  const t     = tok(isDark);
  const stats = useMemo(() => getCoverageStats(), []);

  const [search,          setSearch]          = useState("");
  const [filterLevel,     setFilterLevel]     = useState<CoverageLevel | "all">("all");
  const [expandedRegions, setExpandedRegions] = useState<Set<CountryRegion>>(
    new Set(["europe"]),
  );

  function toggleRegion(r: CountryRegion) {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  }

  const filteredBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && filterLevel === "all") return WORLD_COUNTRIES;
    return WORLD_COUNTRIES.filter(c => {
      const matchQ = !q || c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchL = filterLevel === "all" || c.statut === filterLevel;
      return matchQ && matchL;
    });
  }, [search, filterLevel]);

  const filtered = filteredBySearch;
  const isFiltering = search.trim() !== "" || filterLevel !== "all";

  // Calcul de la barre de progression
  const progressPct = Math.round((stats.information + stats.assisted) / stats.total * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{
        padding:      "16px 18px",
        borderRadius: 12,
        background:   t.glass,
        border:       `1px solid ${t.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Globe size={18} color={GOLD} />
              <span style={{ fontWeight: 700, fontSize: 15, color: t.text }}>
                Couverture internationale DJAMA
              </span>
            </div>
            <p style={{ color: t.text3, fontSize: 13, margin: 0 }}>
              {stats.total} pays référencés · {stats.information + stats.assisted} avec informations réglementaires ·{" "}
              {stats.assisted} en préparation assistée
            </p>
          </div>

          {/* Progression */}
          <div style={{ minWidth: 120, textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
              {progressPct}%
            </div>
            <div style={{ fontSize: 11, color: t.text3 }}>couverts</div>
          </div>
        </div>

        {/* Barre de progression multi-niveau */}
        <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: t.glassMd, overflow: "hidden" }}>
          <div style={{ display: "flex", height: "100%" }}>
            <div style={{
              width: `${stats.assisted / stats.total * 100}%`,
              background: GOLD,
              transition: "width 0.5s",
            }} />
            <div style={{
              width: `${stats.information / stats.total * 100}%`,
              background: "#3b82f6",
              transition: "width 0.5s",
            }} />
          </div>
        </div>

        {/* Légende */}
        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          {([
            ["preparation_assistee", stats.assisted,   `${stats.assisted} pays`],
            ["information",          stats.information, `${stats.information} pays`],
            ["non_disponible",       stats.total - stats.covered, `${stats.total - stats.covered} pays`],
          ] as const).map(([level, , label]) => (
            <button
              key={level}
              onClick={() => setFilterLevel(prev => prev === level ? "all" : level)}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          5,
                fontSize:     11,
                color:        filterLevel === level ? LEVEL_CFG[level].color : t.text3,
                background:   "none",
                border:       "none",
                cursor:       "pointer",
                padding:      0,
                fontWeight:   filterLevel === level ? 700 : 400,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: LEVEL_CFG[level].dot,
                flexShrink: 0,
              }} />
              {label} · {LEVEL_CFG[level].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Avertissement réglementaire ──────────────────────────────────── */}
      <div style={{
        padding:      "10px 14px",
        borderRadius: 10,
        background:   "rgba(59,130,246,0.08)",
        border:       "1px solid rgba(59,130,246,0.25)",
        display:      "flex",
        gap:          8,
        alignItems:   "flex-start",
      }}>
        <Info size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: t.text2, margin: 0, lineHeight: 1.5 }}>
          <strong>Déploiement progressif et honnête.</strong>{" "}
          Le niveau "Information" indique que DJAMA a identifié les sources réglementaires officielles
          (taux, autorité, base légale) mais que le moteur de calcul automatique n&apos;est pas encore
          déployé pour ce pays. Aucune donnée fiscale n&apos;est inventée — les règles non validées
          n&apos;apparaissent pas dans votre profil.
        </p>
      </div>

      {/* ── Barre de recherche + filtre ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{
          flex:         1,
          minWidth:     200,
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          padding:      "8px 12px",
          borderRadius: 8,
          background:   t.glass,
          border:       `1px solid ${t.border}`,
        }}>
          <Search size={14} color={t.text3} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un pays…"
            style={{
              flex:       1,
              background: "none",
              border:     "none",
              outline:    "none",
              fontSize:   13,
              color:      t.text,
            }}
          />
        </div>

        {/* Filtre rapide par niveau */}
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value as CoverageLevel | "all")}
          style={{
            padding:      "8px 12px",
            borderRadius: 8,
            background:   t.glass,
            border:       `1px solid ${t.border}`,
            color:        t.text,
            fontSize:     13,
            cursor:       "pointer",
          }}
        >
          <option value="all">Tous les niveaux</option>
          {(Object.keys(LEVEL_CFG) as CoverageLevel[]).map(l => (
            <option key={l} value={l}>{LEVEL_CFG[l].label}</option>
          ))}
        </select>
      </div>

      {/* ── Liste filtrée (mode recherche) ──────────────────────────────── */}
      {isFiltering && (
        <div>
          <div style={{ fontSize: 12, color: t.text3, marginBottom: 10 }}>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </div>
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap:                 10,
          }}>
            {filtered.map(c => (
              <CountryCard
                key={c.code}
                entry={c}
                isDark={isDark}
                isActive={c.code === currentCountry}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{
              padding:    "32px 0",
              textAlign:  "center",
              color:      t.text3,
              fontSize:   13,
            }}>
              Aucun pays trouvé pour &quot;{search}&quot;
            </div>
          )}
        </div>
      )}

      {/* ── Vue par région (mode non-filtré) ────────────────────────────── */}
      {!isFiltering && ALL_REGIONS.map(region => {
        const countries = getCountriesByRegion(region);
        const covered   = countries.filter(c => c.statut !== "non_disponible").length;
        const isExpanded = expandedRegions.has(region);

        return (
          <div
            key={region}
            style={{
              borderRadius: 12,
              border:       `1px solid ${t.border}`,
              overflow:     "hidden",
            }}
          >
            {/* En-tête de région */}
            <button
              onClick={() => toggleRegion(region)}
              style={{
                width:          "100%",
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                padding:        "12px 16px",
                background:     t.glass,
                border:         "none",
                cursor:         "pointer",
                textAlign:      "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: t.text }}>
                  {REGION_LABELS[region]}
                </span>
                <span style={{
                  fontSize: 11, color: t.text3,
                  background: t.glassMd, borderRadius: 99,
                  padding: "2px 8px",
                }}>
                  {covered}/{countries.length} couverts
                </span>
              </div>
              {isExpanded
                ? <ChevronUp size={16} color={t.text3} />
                : <ChevronDown size={16} color={t.text3} />
              }
            </button>

            {/* Grille de pays */}
            {isExpanded && (
              <div style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                gap:                 10,
                padding:             "12px 14px 14px",
                background:          isDark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.5)",
              }}>
                {countries.map(c => (
                  <CountryCard
                    key={c.code}
                    entry={c}
                    isDark={isDark}
                    isActive={c.code === currentCountry}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Légende des niveaux ──────────────────────────────────────────── */}
      <div style={{
        padding:      "14px 16px",
        borderRadius: 12,
        background:   t.glass,
        border:       `1px solid ${t.border}`,
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: t.text3, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Signification des niveaux
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(Object.entries(LEVEL_CFG) as [CoverageLevel, typeof LEVEL_CFG[CoverageLevel]][])
            .sort((a, b) => b[1].order - a[1].order)
            .map(([level, cfg]) => (
              <div key={level} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <LevelBadge level={level} small />
                <span style={{ fontSize: 12, color: t.text3, lineHeight: 1.5 }}>
                  {cfg.description}
                </span>
              </div>
            ))}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
          <a
            href="https://djama.space/roadmap"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:     "inline-flex",
              alignItems:  "center",
              gap:         5,
              fontSize:    12,
              color:       GOLD,
              textDecoration: "none",
              fontWeight:  500,
            }}
          >
            <ExternalLink size={12} />
            Voir la feuille de route de l&apos;expansion internationale
          </a>
        </div>
      </div>
    </div>
  );
}
