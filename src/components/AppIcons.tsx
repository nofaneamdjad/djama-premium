/**
 * AppIcons — icônes premium style iOS App Store.
 */

import React from "react";

function Bg({ id, a, b, children }: { id: string; a: string; b: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="14" fill={`url(#${id})`} />
      {/* Highlight iOS */}
      <ellipse cx="30" cy="2" rx="24" ry="10" fill="white" opacity="0.14" />
      {children}
    </svg>
  );
}

export const APP_ICONS: Record<string, React.ReactElement> = {

  /* ════════ FINANCE ════════ */

  "/client/factures": (
    <Bg id="f1" a="#5b9cf6" b="#1a4fbc">
      {/* Feuille A4 */}
      <rect x="14" y="9" width="26" height="33" rx="4" fill="white" opacity="0.22" />
      <rect x="14" y="9" width="26" height="33" rx="4" stroke="white" strokeWidth="1.8" opacity="0.75" />
      {/* Coin plié */}
      <path d="M32 9L40 17H32V9Z" fill="white" opacity="0.45" />
      {/* Lignes */}
      <rect x="18" y="21" width="16" height="2.5" rx="1.25" fill="white" opacity="0.95" />
      <rect x="18" y="27" width="11" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="18" y="32" width="13" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="18" y="37" width="8" height="2" rx="1" fill="white" opacity="0.35" />
      {/* Checkmark badge vert */}
      <circle cx="43" cy="43" r="10" fill="#22c55e" />
      <path d="M38.5 43.5L41.5 46.5L47.5 40.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "/client/depenses": (
    <Bg id="f2" a="#ff6b47" b="#c0392b">
      {/* Carte */}
      <rect x="8" y="17" width="44" height="28" rx="6" fill="white" opacity="0.2" />
      <rect x="8" y="17" width="44" height="28" rx="6" stroke="white" strokeWidth="2" opacity="0.65" />
      {/* Bande magnétique */}
      <rect x="8" y="24" width="44" height="7" fill="white" opacity="0.18" />
      {/* Puce EMV */}
      <rect x="14" y="19.5" width="11" height="8" rx="2.5" fill="white" opacity="0.6" />
      <line x1="16" y1="21.5" x2="16" y2="25.5" stroke="#c0392b" strokeWidth="1" opacity="0.5" />
      <line x1="18.5" y1="21.5" x2="18.5" y2="25.5" stroke="#c0392b" strokeWidth="1" opacity="0.5" />
      <line x1="21" y1="21.5" x2="21" y2="25.5" stroke="#c0392b" strokeWidth="1" opacity="0.5" />
      {/* Numéro carte */}
      <rect x="14" y="36" width="6" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="23" y="36" width="6" height="3" rx="1.5" fill="white" opacity="0.5" />
      <rect x="32" y="36" width="6" height="3" rx="1.5" fill="white" opacity="0.4" />
      {/* Badge flèche sortante */}
      <circle cx="45" cy="17" r="9" fill="#ff3b30" stroke="white" strokeWidth="1.5" />
      <path d="M45 22V14M42 17L45 14L48 17" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "/client/tresorerie": (
    <Bg id="f3" a="#2ecc71" b="#0a5c36">
      {/* Barres */}
      <rect x="8"  y="35" width="10" height="17" rx="3" fill="white" opacity="0.5" />
      <rect x="22" y="27" width="10" height="25" rx="3" fill="white" opacity="0.7" />
      <rect x="36" y="18" width="10" height="34" rx="3" fill="white" opacity="0.92" />
      {/* Sol */}
      <line x1="6" y1="53" x2="54" y2="53" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      {/* Tendance */}
      <path d="M13 36L27 28L41 19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="41" cy="19" r="4" fill="white" />
      <circle cx="41" cy="19" r="2" fill="#0a5c36" />
    </Bg>
  ),

  "/client/comptabilite": (
    <Bg id="f4" a="#0ea5e9" b="#0369a1">
      {/* Livre comptable */}
      <rect x="12" y="8" width="28" height="36" rx="4" fill="white" opacity="0.2" />
      <rect x="12" y="8" width="28" height="36" rx="4" stroke="white" strokeWidth="1.8" opacity="0.7" />
      {/* Reliure */}
      <rect x="12" y="8" width="5" height="36" rx="2" fill="white" opacity="0.35" />
      {/* Colonnes chiffres */}
      <rect x="21" y="17" width="14" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="21" y="22" width="10" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="29" y="22" width="6" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="21" y="27" width="10" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="29" y="27" width="6" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="21" y="32" width="14" height="2" rx="1" fill="white" opacity="0.9" />
      {/* Trait total */}
      <line x1="21" y1="36" x2="35" y2="36" stroke="white" strokeWidth="1.2" opacity="0.5" />
      {/* Badge euro */}
      <circle cx="43" cy="43" r="10" fill="#0891b2" />
      <text x="43" y="47" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">€</text>
    </Bg>
  ),

  /* ════════ COMMERCIAL ════════ */

  "/client/crm": (
    <Bg id="c1" a="#b06ef5" b="#4c1d95">
      {/* Avatar */}
      <circle cx="30" cy="18" r="10" fill="white" opacity="0.95" />
      {/* Corps */}
      <path d="M10 52c0-11 9-18 20-18s20 7 20 18" fill="white" opacity="0.3" />
      <path d="M10 52c0-11 9-17 20-17s20 6 20 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      {/* Badge checkmark */}
      <circle cx="42" cy="16" r="9" fill="#7c3aed" stroke="white" strokeWidth="1.8" />
      <path d="M38.5 16L40.8 18.5L45.5 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "/client/contrats": (
    <Bg id="c2" a="#f5c542" b="#8b5e00">
      {/* Document */}
      <rect x="12" y="7" width="28" height="38" rx="4.5" fill="white" opacity="0.2" />
      <rect x="12" y="7" width="28" height="38" rx="4.5" stroke="white" strokeWidth="2" opacity="0.7" />
      {/* Corner fold */}
      <path d="M30 7L40 17H30V7Z" fill="white" opacity="0.42" />
      {/* Lignes de texte */}
      <rect x="17" y="22" width="18" height="2.5" rx="1.25" fill="white" opacity="0.95" />
      <rect x="17" y="28" width="13" height="2" rx="1" fill="white" opacity="0.65" />
      <rect x="17" y="33" width="15" height="2" rx="1" fill="white" opacity="0.65" />
      {/* Signature */}
      <path d="M17 42 Q20 38 23 42 Q26 46 29 42 Q32 38 35 42" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.95" />
    </Bg>
  ),

  "/client/fournisseurs": (
    <Bg id="c3" a="#52d68a" b="#145a32">
      {/* Remorque */}
      <rect x="5" y="22" width="30" height="20" rx="4" fill="white" opacity="0.2" />
      <rect x="5" y="22" width="30" height="20" rx="4" stroke="white" strokeWidth="2" opacity="0.7" />
      {/* Cabine */}
      <path d="M35 28L35 42L53 42L53 34L46 28Z" fill="white" opacity="0.2" />
      <path d="M35 28L35 42L53 42L53 34L46 28Z" stroke="white" strokeWidth="2" strokeLinejoin="round" opacity="0.7" />
      {/* Vitre */}
      <path d="M36.5 29.5L43 29.5L47 33L47 35.5L36.5 35.5Z" fill="white" opacity="0.55" />
      {/* Roues */}
      <circle cx="15" cy="44" r="5.5" fill="white" />
      <circle cx="15" cy="44" r="2.5" fill="#145a32" />
      <circle cx="44" cy="44" r="5.5" fill="white" />
      <circle cx="44" cy="44" r="2.5" fill="#145a32" />
    </Bg>
  ),

  "/client/stocks": (
    <Bg id="c4" a="#26e0d0" b="#0d6e68">
      {/* Boîte bas */}
      <rect x="8" y="36" width="44" height="16" rx="4" fill="white" opacity="0.2" />
      <rect x="8" y="36" width="44" height="16" rx="4" stroke="white" strokeWidth="2" opacity="0.55" />
      <line x1="8" y1="36" x2="52" y2="36" stroke="white" strokeWidth="1.5" opacity="0.4" />
      {/* Boîte milieu */}
      <rect x="12" y="23" width="36" height="14" rx="4" fill="white" opacity="0.35" />
      <rect x="12" y="23" width="36" height="14" rx="4" stroke="white" strokeWidth="2" opacity="0.7" />
      {/* Boîte haut */}
      <rect x="16" y="11" width="28" height="13" rx="4" fill="white" opacity="0.65" />
      <rect x="16" y="11" width="28" height="13" rx="4" stroke="white" strokeWidth="2" opacity="0.9" />
      {/* Ligne centrale boîte haut */}
      <line x1="30" y1="13" x2="30" y2="22" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
    </Bg>
  ),

  /* ════════ OPÉRATIONS ════════ */

  "/client/productivite": (
    <Bg id="o1" a="#f06292" b="#880e4f">
      {/* 3 rangées checklist */}
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <rect x="9" y={14 + i * 14} width="42" height="10" rx="5" fill="white" opacity={0.15 + i * 0.02} />
          <rect x="9" y={14 + i * 14} width="42" height="10" rx="5" stroke="white" strokeWidth="1.6" opacity={0.4 - i * 0.06} />
          <circle cx="19" cy={19 + i * 14} r="4.5" fill={i < 2 ? "white" : "none"} opacity={i < 2 ? 0.9 : 0} stroke={i === 2 ? "white" : "none"} strokeWidth={1.6} strokeOpacity={0.4} />
          {i < 2 && (
            <path
              d={`M${16.5} ${19 + i * 14}L${18.5} ${21 + i * 14}L${22} ${17 + i * 14}`}
              stroke="#880e4f"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <rect x="26" y={17.5 + i * 14} width="20" height="3" rx="1.5" fill="white" opacity={0.7 - i * 0.15} />
        </React.Fragment>
      ))}
    </Bg>
  ),

  "/client/planning": (
    <Bg id="o2" a="#7986cb" b="#283593">
      {/* Calendrier */}
      <rect x="8" y="14" width="44" height="39" rx="6" fill="white" opacity="0.18" />
      <rect x="8" y="14" width="44" height="39" rx="6" stroke="white" strokeWidth="2" opacity="0.6" />
      {/* Header rouge */}
      <rect x="8" y="14" width="44" height="13" rx="6" fill="white" opacity="0.25" />
      <rect x="8" y="20" width="44" height="7" fill="white" opacity="0.12" />
      {/* Anneaux */}
      <rect x="18" y="8" width="5" height="12" rx="2.5" fill="white" opacity="0.9" />
      <rect x="37" y="8" width="5" height="12" rx="2.5" fill="white" opacity="0.9" />
      {/* Jour surligné */}
      <circle cx="22" cy="38" r="7" fill="white" opacity="0.92" />
      <text x="22" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#283593">3</text>
      {/* Autres jours */}
      <rect x="33" y="34" width="12" height="3" rx="1.5" fill="white" opacity="0.55" />
      <rect x="33" y="40" width="8" height="3" rx="1.5" fill="white" opacity="0.35" />
    </Bg>
  ),

  "/client/equipe": (
    <Bg id="o3" a="#29b6f6" b="#01579b">
      {/* Personnes gauche et droite (petites) */}
      <circle cx="12" cy="20" r="7" fill="white" opacity="0.5" />
      <path d="M2 46c0-7 4.5-11 10-11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="48" cy="20" r="7" fill="white" opacity="0.5" />
      <path d="M58 46c0-7-4.5-11-10-11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Personne centrale (grande) */}
      <circle cx="30" cy="17" r="10" fill="white" opacity="0.95" />
      <path d="M12 50c0-10 8-16 18-16s18 6 18 16" fill="white" opacity="0.3" />
      <path d="M12 50c0-10 8-15 18-15s18 5 18 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.88" />
    </Bg>
  ),

  "/client/chrono": (
    <Bg id="o4" a="#ba68c8" b="#4a148c">
      {/* Bouton top */}
      <rect x="23" y="5" width="14" height="6" rx="3" fill="white" opacity="0.9" />
      {/* Bouton lateral */}
      <line x1="47" y1="16" x2="51" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      {/* Cadran */}
      <circle cx="30" cy="37" r="20" fill="white" opacity="0.12" />
      <circle cx="30" cy="37" r="20" stroke="white" strokeWidth="2.5" opacity="0.65" />
      {/* Marques heure */}
      <line x1="30" y1="19" x2="30" y2="22.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="30" y1="51.5" x2="30" y2="55" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="12" y1="37" x2="15.5" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="44.5" y1="37" x2="48" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {/* Aiguilles */}
      <line x1="30" y1="37" x2="30" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="37" x2="39" y2="43" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="37" r="3.5" fill="white" />
    </Bg>
  ),

  /* ════════ NOTES ════════ */

  "/client/notes": (
    <Bg id="n1" a="#ffca28" b="#8b5e00">
      <rect x="11" y="8" width="30" height="38" rx="5" fill="white" opacity="0.2" />
      <rect x="11" y="8" width="30" height="38" rx="5" stroke="white" strokeWidth="2" opacity="0.65" />
      <rect x="11" y="8" width="7" height="38" rx="5" fill="white" opacity="0.28" />
      <rect x="22" y="17" width="16" height="2.5" rx="1.25" fill="white" />
      <rect x="22" y="23" width="12" height="2" rx="1" fill="white" opacity="0.75" />
      <rect x="22" y="29" width="14" height="2" rx="1" fill="white" opacity="0.75" />
      <rect x="22" y="35" width="9" height="2" rx="1" fill="white" opacity="0.5" />
    </Bg>
  ),

  "/client/bloc-note": (
    <Bg id="n2" a="#ef5350" b="#7f0000">
      {/* Micro — Quick Capture vocal */}
      <rect x="22" y="8" width="16" height="26" rx="8" fill="white" opacity="0.22" />
      <rect x="22" y="8" width="16" height="26" rx="8" stroke="white" strokeWidth="2.2" opacity="0.75" />
      <path d="M14 30c0 9 5.5 16 16 16s16-7 16-16" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
      <line x1="30" y1="46" x2="30" y2="54" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
      <line x1="22" y1="54" x2="38" y2="54" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
    </Bg>
  ),

  "/client/bloc-notes": (
    <Bg id="n3" a="#f59e0b" b="#78350f">
      {/* Cahier spirale — Notes unifiées */}
      <rect x="14" y="9" width="34" height="42" rx="5" fill="white" opacity="0.18" />
      <rect x="14" y="9" width="34" height="42" rx="5" stroke="white" strokeWidth="2" opacity="0.65" />
      {/* Spirales à gauche */}
      <circle cx="14" cy="18" r="3.5" fill="white" opacity="0.85" />
      <circle cx="14" cy="30" r="3.5" fill="white" opacity="0.85" />
      <circle cx="14" cy="42" r="3.5" fill="white" opacity="0.85" />
      {/* Lignes de texte */}
      <rect x="22" y="17" width="20" height="2.5" rx="1.25" fill="white" opacity="0.95" />
      <rect x="22" y="24" width="16" height="2.5" rx="1.25" fill="white" opacity="0.75" />
      <rect x="22" y="31" width="18" height="2.5" rx="1.25" fill="white" opacity="0.75" />
      <rect x="22" y="38" width="12" height="2.5" rx="1.25" fill="white" opacity="0.55" />
    </Bg>
  ),

  "/client/checklists": (
    <Bg id="n4" a="#10b981" b="#065f46">
      {/* Cases à cocher */}
      <rect x="9" y="13" width="11" height="11" rx="3.5" fill="white" opacity="0.2" stroke="white" strokeWidth="1.8" strokeOpacity="0.7" />
      <path d="M11.5 18.5l2.5 2.5 4-4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="29" width="11" height="11" rx="3.5" fill="white" opacity="0.12" stroke="white" strokeWidth="1.8" strokeOpacity="0.45" />
      <rect x="9" y="45" width="11" height="7" rx="3.5" fill="white" opacity="0.08" stroke="white" strokeWidth="1.5" strokeOpacity="0.30" />
      {/* Lignes texte */}
      <rect x="24" y="16" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="24" y="32" width="18" height="3" rx="1.5" fill="white" opacity="0.6" />
      <rect x="24" y="47" width="21" height="3" rx="1.5" fill="white" opacity="0.35" />
      {/* Badge check */}
      <circle cx="44" cy="44" r="10" fill="#22c55e" />
      <path d="M39.5 44.5l2.5 2.5 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "/client/scanner": (
    <Bg id="n5" a="#0ea5e9" b="#075985">
      {/* Document */}
      <rect x="13" y="8" width="25" height="32" rx="4" fill="white" opacity="0.18" />
      <rect x="13" y="8" width="25" height="32" rx="4" stroke="white" strokeWidth="1.8" opacity="0.65" />
      {/* Lignes */}
      <rect x="17" y="16" width="17" height="2" rx="1" fill="white" opacity="0.85" />
      <rect x="17" y="21" width="13" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="17" y="26" width="15" height="2" rx="1" fill="white" opacity="0.5" />
      {/* Scan line animée (statique) */}
      <line x1="9" y1="44" x2="51" y2="44" stroke="white" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
      {/* Coins de scan */}
      <path d="M8 38v-6h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M52 38v-6h-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M8 50v6h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M52 50v6h-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </Bg>
  ),

  "/client/mindmap": (
    <Bg id="n6" a="#8b5cf6" b="#3b0764">
      {/* Nœud central */}
      <circle cx="30" cy="30" r="9" fill="white" opacity="0.9" />
      <circle cx="30" cy="30" r="9" fill="url(#mmGrad)" />
      <defs>
        <radialGradient id="mmGrad" cx="35%" cy="35%">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#5b21b6" />
        </radialGradient>
      </defs>
      {/* Branches */}
      <line x1="30" y1="21" x2="30" y2="11" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="2 2" />
      <circle cx="30" cy="8" r="5.5" fill="#c4b5fd" fillOpacity="0.55" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="39" y1="24" x2="47" y2="14" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="2 2" />
      <circle cx="50" cy="11" r="5.5" fill="#ec4899" fillOpacity="0.55" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="39" y1="36" x2="49" y2="44" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="2 2" />
      <circle cx="52" cy="47" r="5.5" fill="#10b981" fillOpacity="0.55" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="21" y1="36" x2="11" y2="44" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="2 2" />
      <circle cx="8" cy="47" r="5.5" fill="#f59e0b" fillOpacity="0.55" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="21" y1="24" x2="13" y2="14" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="2 2" />
      <circle cx="10" cy="11" r="5.5" fill="#0ea5e9" fillOpacity="0.55" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
    </Bg>
  ),

  /* ════════ INTELLIGENCE ════════ */

  "/client/sourcing": (
    <Bg id="i1" a="#9575cd" b="#311b92">
      {/* Loupe */}
      <circle cx="26" cy="26" r="16" fill="white" opacity="0.14" />
      <circle cx="26" cy="26" r="16" stroke="white" strokeWidth="3" opacity="0.75" />
      {/* Manche */}
      <line x1="37" y1="37" x2="50" y2="50" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
      {/* Étoile IA dans la loupe */}
      <path d="M26 18l2.5 7.5H36l-6.5 4.5 2.5 7.5L26 33l-6 4.5 2.5-7.5L16 25.5h7.5Z" fill="white" opacity="0.9" />
    </Bg>
  ),

  "/client/assistant": (
    <Bg id="i2" a="#00bcd4" b="#0d47a1">
      {/* Éclair bold */}
      <path d="M36 8L21 32H31L24 52L45 25H33L40 8Z" fill="white" opacity="0.95" />
    </Bg>
  ),

  "/client/reputation": (
    <Bg id="i3" a="#ef5350" b="#b71c1c">
      {/* Grande étoile centrée */}
      <path d="M30 9l5 15.5H51L38.5 33.5l5 16L30 41l-13.5 8.5 5-16L9 24.5H25Z" fill="white" opacity="0.95" />
    </Bg>
  ),

  "/client/reseaux-sociaux": (
    <Bg id="i4" a="#f06292" b="#6a1b9a">
      {/* 3 noeuds connectés (réseau social) */}
      <circle cx="30" cy="14" r="8" fill="white" opacity="0.9" />
      <circle cx="12" cy="44" r="8" fill="white" opacity="0.9" />
      <circle cx="48" cy="44" r="8" fill="white" opacity="0.9" />
      <line x1="24" y1="20" x2="15" y2="37" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      <line x1="36" y1="20" x2="44" y2="37" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      <line x1="20" y1="44" x2="40" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
    </Bg>
  ),

  "/coaching-ia/espace": (
    <Bg id="i5" a="#f48fb1" b="#880e4f">
      {/* Tête */}
      <circle cx="30" cy="22" r="14" fill="white" opacity="0.18" />
      <circle cx="30" cy="22" r="14" stroke="white" strokeWidth="2.2" opacity="0.7" />
      {/* ? géant */}
      <path d="M25 16.5q0-6 5-6t5 6q0 4.5-5 6.5v5" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.92" />
      <circle cx="30" cy="36" r="2.5" fill="white" opacity="0.92" />
      {/* Corps */}
      <path d="M13 54q0-12 17-12t17 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.68" />
    </Bg>
  ),

  /* ════════ GESTION ════════ */

  "/client/portail": (
    <Bg id="g1" a="#42a5f5" b="#4a148c">
      {/* Toit */}
      <path d="M6 26L30 8L54 26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {/* Murs */}
      <rect x="11" y="25" width="38" height="30" rx="3" fill="white" opacity="0.18" />
      <rect x="11" y="25" width="38" height="30" rx="3" stroke="white" strokeWidth="2" opacity="0.6" />
      {/* Fenêtres */}
      <rect x="14" y="28" width="11" height="10" rx="2.5" fill="white" opacity="0.65" />
      <rect x="35" y="28" width="11" height="10" rx="2.5" fill="white" opacity="0.65" />
      {/* Porte */}
      <rect x="23" y="38" width="14" height="17" rx="3" fill="white" opacity="0.9" />
      <circle cx="34" cy="47" r="1.8" fill="#4a148c" opacity="0.7" />
    </Bg>
  ),

  "/client/paie": (
    <Bg id="g2" a="#26d07c" b="#004d30">
      {/* Billet */}
      <rect x="6" y="16" width="48" height="30" rx="7" fill="white" opacity="0.18" />
      <rect x="6" y="16" width="48" height="30" rx="7" stroke="white" strokeWidth="2" opacity="0.6" />
      {/* Cercles déco coins */}
      <circle cx="13" cy="31" r="7" fill="white" opacity="0.18" />
      <circle cx="47" cy="31" r="7" fill="white" opacity="0.18" />
      {/* € géant */}
      <text x="30" y="39" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white" opacity="0.95" fontFamily="Arial, sans-serif">€</text>
    </Bg>
  ),

  "/client/blog": (
    <Bg id="g3" a="#ffb300" b="#7c4700">
      {/* Livre ouvert */}
      <path d="M30 12V50" stroke="white" strokeWidth="2" opacity="0.5" />
      {/* Page gauche */}
      <path d="M30 12C30 12 22 10 10 13V50C22 47 30 50 30 50Z" fill="white" opacity="0.25" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      {/* Page droite */}
      <path d="M30 12C30 12 38 10 50 13V50C38 47 30 50 30 50Z" fill="white" opacity="0.18" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      {/* Lignes page gauche */}
      <line x1="14" y1="22" x2="27" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="14" y1="28" x2="27" y2="27.5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      <line x1="14" y1="34" x2="27" y2="33.5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      {/* Plume droite */}
      <path d="M45 13C39 19 37 28 38 38L44 35C45.5 26 48 18 45 13Z" fill="white" opacity="0.9" />
      <line x1="38" y1="38" x2="34" y2="47" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
    </Bg>
  ),

  "/client/temoignages": (
    <Bg id="g4" a="#f97316" b="#7c2d12">
      {/* Grande étoile centrale */}
      <path d="M30 9 L33.5 20 L45 20 L36 27 L39.5 38 L30 31 L20.5 38 L24 27 L15 20 L26.5 20 Z" fill="white" opacity="0.95" />
      {/* Bulle avis en bas-droite */}
      <rect x="33" y="38" width="22" height="15" rx="4.5" fill="white" opacity="0.22" />
      <rect x="33" y="38" width="22" height="15" rx="4.5" stroke="white" strokeWidth="1.8" opacity="0.75" />
      <path d="M36 53 L33 58 L39 55 Z" fill="white" opacity="0.6" />
      {/* Lignes texte dans la bulle */}
      <rect x="36" y="42" width="16" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="36" y="47" width="11" height="2.5" rx="1.25" fill="white" opacity="0.65" />
    </Bg>
  ),

  "/client/planification": (
    <Bg id="g5" a="#29b6f6" b="#01579b">
      {/* Cibles */}
      <circle cx="30" cy="30" r="22" fill="white" opacity="0.1" />
      <circle cx="30" cy="30" r="22" stroke="white" strokeWidth="2.5" opacity="0.5" />
      <circle cx="30" cy="30" r="14" fill="white" opacity="0.15" />
      <circle cx="30" cy="30" r="14" stroke="white" strokeWidth="2.5" opacity="0.65" />
      <circle cx="30" cy="30" r="6" fill="white" opacity="0.95" />
      {/* Croix */}
      <line x1="30" y1="4" x2="30" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <line x1="30" y1="48" x2="30" y2="56" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <line x1="4" y1="30" x2="12" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      <line x1="48" y1="30" x2="56" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    </Bg>
  ),

  /* ════════ QUICK ACTIONS ════════ */

  "qa/devis": (
    <Bg id="qa1" a="#5b9cf6" b="#1a4fbc">
      {/* Même document que Facture */}
      <rect x="14" y="9" width="26" height="33" rx="4" fill="white" opacity="0.22" />
      <rect x="14" y="9" width="26" height="33" rx="4" stroke="white" strokeWidth="1.8" opacity="0.75" />
      <path d="M32 9L40 17H32V9Z" fill="white" opacity="0.45" />
      <rect x="18" y="21" width="16" height="2.5" rx="1.25" fill="white" opacity="0.95" />
      <rect x="18" y="27" width="11" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="18" y="32" width="13" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="18" y="37" width="8" height="2" rx="1" fill="white" opacity="0.35" />
      {/* Badge crayon orange (≠ check vert de Facture) */}
      <circle cx="43" cy="43" r="10" fill="#f97316" />
      <rect x="39" y="37" width="4" height="11" rx="2" fill="white" transform="rotate(-45 43 43)" />
      <path d="M36 49 L35 51 L38 50 Z" fill="white" />
    </Bg>
  ),

  "qa/contact": (
    <Bg id="qa2" a="#ab47bc" b="#4a148c">
      <circle cx="25" cy="18" r="10" fill="white" opacity="0.9" />
      <path d="M9 48c0-10 7-16 16-16" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <circle cx="43" cy="42" r="11" fill="#7b1fa2" stroke="white" strokeWidth="2" />
      <path d="M39 42L42 45.5L48 38.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "qa/note": (
    <Bg id="qa3" a="#ffa000" b="#7c4700">
      <rect x="10" y="8" width="28" height="36" rx="5" fill="white" opacity="0.2" />
      <rect x="10" y="8" width="28" height="36" rx="5" stroke="white" strokeWidth="2" opacity="0.65" />
      <rect x="10" y="8" width="7" height="36" rx="5" fill="white" opacity="0.25" />
      <rect x="20" y="17" width="15" height="2.5" rx="1.25" fill="white" />
      <rect x="20" y="23" width="11" height="2" rx="1" fill="white" opacity="0.7" />
      <rect x="20" y="29" width="13" height="2" rx="1" fill="white" opacity="0.7" />
      <circle cx="44" cy="44" r="10" fill="white" />
      <path d="M41 44L43.5 46.5L48 41" stroke="#7c4700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Bg>
  ),

  "qa/timer": (
    <Bg id="qa4" a="#0097a7" b="#4a148c">
      <rect x="23" y="5" width="14" height="6" rx="3" fill="white" opacity="0.9" />
      <line x1="46" y1="15" x2="50" y2="11" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      <circle cx="30" cy="37" r="18" fill="white" opacity="0.12" />
      <circle cx="30" cy="37" r="18" stroke="white" strokeWidth="2.5" opacity="0.65" />
      <line x1="30" y1="21" x2="30" y2="24.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="30" y1="49.5" x2="30" y2="53" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="14" y1="37" x2="17.5" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="42.5" y1="37" x2="46" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="30" y1="37" x2="30" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="37" x2="39" y2="43" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="37" r="3.5" fill="white" />
    </Bg>
  ),
};


/** Icône app-style avec verrouillage optionnel */
export function AppModuleIcon({
  href,
  size = 52,
  locked = false,
}: {
  href: string;
  size?: number;
  locked?: boolean;
}) {
  const icon = APP_ICONS[href];
  if (!icon) return null;
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        opacity: locked ? 0.4 : 1,
        boxShadow: locked ? "none" : "0 6px 20px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      {icon}
    </div>
  );
}
