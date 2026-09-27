/**
 * Logos SVG illustrés style Odoo pour chaque application DJAMA.
 * Formes pleines colorées, pas de simples icônes outline.
 */

interface LogoProps { size?: number }

/* ─── helpers ─────────────────────────────────────────────────── */
const Svg = ({ size = 48, children }: { size?: number; children: React.ReactNode }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   FINANCE
══════════════════════════════════════════════════════════════ */

export const LogoFactures = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Document blanc */}
    <rect x="10" y="6" width="28" height="36" rx="3" fill="#dbeafe" />
    <rect x="10" y="6" width="28" height="36" rx="3" fill="url(#gf)" fillOpacity=".5" />
    {/* Lignes de texte */}
    <rect x="15" y="14" width="18" height="2.5" rx="1.2" fill="#2563eb" />
    <rect x="15" y="20" width="12" height="2" rx="1" fill="#93c5fd" />
    <rect x="15" y="25" width="14" height="2" rx="1" fill="#93c5fd" />
    <rect x="15" y="30" width="10" height="2" rx="1" fill="#93c5fd" />
    {/* Badge payé */}
    <rect x="22" y="34" width="13" height="6" rx="3" fill="#2563eb" />
    <text x="28.5" y="38.5" textAnchor="middle" fontSize="4.5" fill="white" fontWeight="700">PAYÉ</text>
    <defs>
      <linearGradient id="gf" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
      </linearGradient>
    </defs>
  </Svg>
);

export const LogoDepenses = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Carte */}
    <rect x="7" y="16" width="34" height="22" rx="4" fill="#ea580c" />
    <rect x="7" y="16" width="34" height="10" rx="4" fill="#c2410c" />
    {/* Bande magnétique */}
    <rect x="7" y="22" width="34" height="4" fill="#9a3412" />
    {/* Puce */}
    <rect x="13" y="28" width="8" height="6" rx="1.5" fill="#fbbf24" />
    <rect x="15" y="30" width="4" height="2" rx=".5" fill="#f59e0b" />
    {/* Numéros */}
    <rect x="24" y="29" width="3" height="2" rx=".5" fill="rgba(255,255,255,.5)" />
    <rect x="28.5" y="29" width="3" height="2" rx=".5" fill="rgba(255,255,255,.5)" />
    <rect x="33" y="29" width="3" height="2" rx=".5" fill="rgba(255,255,255,.5)" />
    {/* Scan coins */}
    <path d="M7 10 L7 13 M7 10 L10 10" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
    <path d="M41 10 L41 13 M41 10 L38 10" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const LogoTresorerie = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Fond vert dégradé */}
    <rect x="6" y="6" width="36" height="36" rx="8" fill="#d1fae5" />
    {/* Barres */}
    <rect x="12" y="28" width="5" height="12" rx="1.5" fill="#10b981" />
    <rect x="20" y="22" width="5" height="18" rx="1.5" fill="#059669" />
    <rect x="28" y="14" width="5" height="26" rx="1.5" fill="#047857" />
    {/* Flèche montante */}
    <path d="M35 10 L40 10 L40 15" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 16 L40 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const LogoComptabilite = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Livre */}
    <rect x="8" y="8" width="32" height="34" rx="3" fill="#e0f2fe" />
    <rect x="8" y="8" width="7" height="34" rx="3" fill="#0891b2" />
    {/* Lignes */}
    <rect x="19" y="16" width="16" height="2" rx="1" fill="#0891b2" />
    <rect x="19" y="21" width="10" height="2" rx="1" fill="#7dd3fc" />
    <rect x="19" y="26" width="14" height="2" rx="1" fill="#0891b2" />
    <rect x="19" y="31" width="8" height="2" rx="1" fill="#7dd3fc" />
    {/* Balance / séparateur */}
    <rect x="19" y="36" width="16" height="1.5" rx=".75" fill="#0891b2" />
  </Svg>
);

export const LogoBanque = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Bâtiment banque */}
    <rect x="10" y="38" width="28" height="3" rx="1" fill="#0369a1" />
    <rect x="8" y="20" width="32" height="3" rx="1" fill="#0369a1" />
    {/* Fronton */}
    <path d="M24 8 L40 20 L8 20 Z" fill="#0369a1" />
    {/* Colonnes */}
    <rect x="12" y="23" width="4" height="15" rx="1" fill="#3b82f6" />
    <rect x="20" y="23" width="4" height="15" rx="1" fill="#3b82f6" />
    <rect x="28" y="23" width="4" height="15" rx="1" fill="#3b82f6" />
    <rect x="36" y="23" width="4" height="15" rx="1" fill="#3b82f6" />
    {/* Étoile */}
    <circle cx="24" cy="15" r="3" fill="#fbbf24" />
  </Svg>
);

export const LogoDeclarations = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Enveloppe/doc */}
    <rect x="8" y="10" width="32" height="28" rx="3" fill="#ede9fe" />
    {/* Tampon calendrier */}
    <rect x="16" y="6" width="16" height="14" rx="2" fill="#7c3aed" />
    <rect x="16" y="12" width="16" height="8" rx="0" fill="#ede9fe" />
    {/* Numéro jour */}
    <text x="24" y="20" textAnchor="middle" fontSize="7" fill="#7c3aed" fontWeight="800">15</text>
    {/* Lignes doc */}
    <rect x="13" y="26" width="22" height="2" rx="1" fill="#a78bfa" />
    <rect x="13" y="31" width="16" height="2" rx="1" fill="#c4b5fd" />
    {/* Checkmark */}
    <circle cx="34" cy="34" r="5" fill="#7c3aed" />
    <path d="M31.5 34 L33.5 36 L36.5 31.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   COMMERCIAL
══════════════════════════════════════════════════════════════ */

export const LogoCrm = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Cercles personnes */}
    <circle cx="24" cy="13" r="6" fill="#7c3aed" />
    <circle cx="13" cy="32" r="5" fill="#a78bfa" />
    <circle cx="35" cy="32" r="5" fill="#a78bfa" />
    {/* Lignes connexion */}
    <path d="M19 17 L15 28" stroke="#c4b5fd" strokeWidth="1.5" />
    <path d="M29 17 L33 28" stroke="#c4b5fd" strokeWidth="1.5" />
    <path d="M18 33 L30 33" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="2 2" />
    {/* Icônes personnes */}
    <circle cx="24" cy="11" r="2.5" fill="white" />
    <path d="M20 15.5 Q24 13.5 28 15.5" fill="white" />
  </Svg>
);

export const LogoContrats = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Doc */}
    <rect x="10" y="7" width="24" height="30" rx="2.5" fill="#fef3c7" />
    <rect x="10" y="7" width="24" height="8" rx="2.5" fill="#d97706" />
    {/* Lignes texte */}
    <rect x="14" y="19" width="16" height="2" rx="1" fill="#b45309" />
    <rect x="14" y="24" width="12" height="2" rx="1" fill="#d97706" />
    <rect x="14" y="29" width="8" height="2" rx="1" fill="#d97706" />
    {/* Stylo signature */}
    <rect x="28" y="32" width="12" height="4" rx="1" transform="rotate(-30 28 32)" fill="#1e293b" />
    <path d="M36 41 L39 35 L41 37 Z" fill="#1e293b" />
    <path d="M14 34 Q18 36 22 34" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </Svg>
);

export const LogoFournisseurs = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Camion */}
    <rect x="6" y="20" width="26" height="18" rx="2" fill="#166534" />
    <path d="M32 26 L42 26 L42 38 L32 38 Z" fill="#15803d" />
    <path d="M32 26 L38 20 L42 20 L42 26 Z" fill="#166534" />
    {/* Cabine fenêtre */}
    <rect x="34" y="22" width="6" height="4" rx="1" fill="#bbf7d0" />
    {/* Roues */}
    <circle cx="14" cy="38" r="4" fill="#1e293b" />
    <circle cx="14" cy="38" r="2" fill="#374151" />
    <circle cx="36" cy="38" r="4" fill="#1e293b" />
    <circle cx="36" cy="38" r="2" fill="#374151" />
    {/* Cartons */}
    <rect x="10" y="12" width="10" height="10" rx="1" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
    <rect x="22" y="14" width="8" height="8" rx="1" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
    <path d="M10 17 L20 17" stroke="#16a34a" strokeWidth="1" />
    <path d="M15 12 L15 22" stroke="#16a34a" strokeWidth="1" />
  </Svg>
);

export const LogoStocks = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Cartons empilés */}
    <rect x="8" y="30" width="32" height="12" rx="2" fill="#0d9488" />
    <rect x="12" y="18" width="24" height="12" rx="2" fill="#0f766e" />
    <rect x="16" y="8" width="16" height="12" rx="2" fill="#115e59" />
    {/* Liens cartons */}
    <rect x="22" y="8" width="4" height="12" fill="rgba(255,255,255,.2)" />
    <rect x="20" y="18" width="8" height="12" fill="rgba(255,255,255,.2)" />
    <rect x="16" y="30" width="16" height="12" fill="rgba(255,255,255,.2)" />
    {/* Flèche check */}
    <circle cx="38" cy="10" r="5" fill="#14b8a6" />
    <path d="M35.5 10 L37.5 12 L40.5 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   OPÉRATIONS
══════════════════════════════════════════════════════════════ */

export const LogoProductivite = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Papier */}
    <rect x="10" y="8" width="28" height="32" rx="3" fill="#fce7f3" />
    {/* Cases à cocher */}
    <rect x="14" y="15" width="5" height="5" rx="1" fill="#be185d" />
    <path d="M15 17.5 L16.5 19 L19 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="21" y="16" width="13" height="2" rx="1" fill="#f9a8d4" />

    <rect x="14" y="23" width="5" height="5" rx="1" fill="#be185d" />
    <path d="M15 25.5 L16.5 27 L19 23.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="21" y="24" width="10" height="2" rx="1" fill="#f9a8d4" />

    <rect x="14" y="31" width="5" height="5" rx="1" fill="#fce7f3" stroke="#be185d" strokeWidth="1.5" />
    <rect x="21" y="32" width="12" height="2" rx="1" fill="#f9a8d4" />
  </Svg>
);

export const LogoPlanning = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Calendrier */}
    <rect x="8" y="12" width="32" height="28" rx="3" fill="#e0e7ff" />
    <rect x="8" y="12" width="32" height="10" rx="3" fill="#4f46e5" />
    {/* Anneaux */}
    <rect x="17" y="8" width="3" height="8" rx="1.5" fill="#4f46e5" />
    <rect x="28" y="8" width="3" height="8" rx="1.5" fill="#4f46e5" />
    {/* Grille jours */}
    <rect x="12" y="26" width="5" height="4" rx="1" fill="#818cf8" />
    <rect x="20" y="26" width="5" height="4" rx="1" fill="#4f46e5" />
    <rect x="28" y="26" width="5" height="4" rx="1" fill="#818cf8" />
    <rect x="12" y="33" width="5" height="4" rx="1" fill="#818cf8" />
    <rect x="20" y="33" width="5" height="4" rx="1" fill="#818cf8" />
    {/* Étoile sur un jour */}
    <path d="M30.5 33 L31.5 36 L34 36 L32 37.5 L33 40.5 L30.5 38.5 L28 40.5 L29 37.5 L27 36 L29.5 36 Z" fill="#fbbf24" />
  </Svg>
);

export const LogoEquipe = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* 3 personnes */}
    <circle cx="14" cy="16" r="5" fill="#a5f3fc" />
    <path d="M8 30 Q8 24 14 24 Q20 24 20 30" fill="#0891b2" />
    <circle cx="24" cy="14" r="6" fill="#22d3ee" />
    <path d="M17 30 Q17 22 24 22 Q31 22 31 30" fill="#0891b2" />
    <circle cx="34" cy="16" r="5" fill="#a5f3fc" />
    <path d="M28 30 Q28 24 34 24 Q40 24 40 30" fill="#0891b2" />
    {/* Barre planning sous */}
    <rect x="8" y="34" width="32" height="3" rx="1.5" fill="#e0f2fe" />
    <rect x="8" y="34" width="20" height="3" rx="1.5" fill="#0891b2" />
  </Svg>
);

export const LogoChrono = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Fond chrono */}
    <circle cx="24" cy="28" r="16" fill="#f3e8ff" />
    <circle cx="24" cy="28" r="16" stroke="#7c3aed" strokeWidth="2" fill="none" />
    <circle cx="24" cy="28" r="12" stroke="#a78bfa" strokeWidth="1" fill="none" strokeDasharray="2 3" />
    {/* Bouton top */}
    <rect x="21" y="10" width="6" height="4" rx="1" fill="#7c3aed" />
    <rect x="22.5" y="8" width="3" height="3" rx="1" fill="#6d28d9" />
    {/* Aiguilles */}
    <path d="M24 28 L24 18" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 28 L32 30" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="28" r="2" fill="#7c3aed" />
    {/* Ticks */}
    <rect x="23.5" y="13" width="1" height="2.5" rx=".5" fill="#7c3aed" />
    <rect x="23.5" y="39.5" width="1" height="2.5" rx=".5" fill="#7c3aed" />
    <rect x="11" y="27.5" width="2.5" height="1" rx=".5" fill="#7c3aed" />
    <rect x="34.5" y="27.5" width="2.5" height="1" rx=".5" fill="#7c3aed" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   NOTES
══════════════════════════════════════════════════════════════ */

export const LogoNotes = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Post-it jaune */}
    <rect x="8" y="8" width="30" height="30" rx="2" fill="#fef08a" />
    {/* Coin plié */}
    <path d="M38 8 L38 18 L28 8 Z" fill="#eab308" />
    <path d="M28 8 L38 18 L28 18 Z" fill="#fde047" />
    {/* Lignes texte */}
    <rect x="12" y="15" width="12" height="2" rx="1" fill="#a16207" />
    <rect x="12" y="20" width="16" height="2" rx="1" fill="#ca8a04" />
    <rect x="12" y="25" width="10" height="2" rx="1" fill="#ca8a04" />
    <rect x="12" y="30" width="14" height="2" rx="1" fill="#ca8a04" />
    {/* Micro icône voix */}
    <circle cx="36" cy="38" r="6" fill="#92400e" />
    <rect x="34" y="34" width="4" height="5" rx="2" fill="white" />
    <path d="M33 38 Q33 41 36 41 Q39 41 39 38" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <rect x="35.5" y="41" width="1" height="2" fill="white" />
  </Svg>
);

export const LogoChecklists = ({ size }: LogoProps) => (
  <Svg size={size}>
    <rect x="8" y="8" width="32" height="32" rx="4" fill="#d1fae5" />
    {/* Item 1 — coché */}
    <rect x="12" y="14" width="6" height="6" rx="1.5" fill="#10b981" />
    <path d="M13.5 17 L15 18.5 L18 14.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="21" y="16" width="15" height="2" rx="1" fill="#6ee7b7" />
    {/* Item 2 — coché */}
    <rect x="12" y="23" width="6" height="6" rx="1.5" fill="#10b981" />
    <path d="M13.5 26 L15 27.5 L18 23.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="21" y="25" width="12" height="2" rx="1" fill="#6ee7b7" />
    {/* Item 3 — vide */}
    <rect x="12" y="32" width="6" height="6" rx="1.5" fill="none" stroke="#10b981" strokeWidth="1.5" />
    <rect x="21" y="34" width="10" height="2" rx="1" fill="#a7f3d0" />
  </Svg>
);

export const LogoScanner = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Coins scan */}
    <path d="M8 16 L8 8 L16 8" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M40 16 L40 8 L32 8" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M8 32 L8 40 L16 40" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M40 32 L40 40 L32 40" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* QR mini */}
    <rect x="14" y="16" width="5" height="5" rx="1" fill="#0ea5e9" />
    <rect x="15" y="17" width="3" height="3" rx=".5" fill="#e0f2fe" />
    <rect x="22" y="16" width="5" height="5" rx="1" fill="#0ea5e9" />
    <rect x="23" y="17" width="3" height="3" rx=".5" fill="#e0f2fe" />
    <rect x="14" y="24" width="5" height="5" rx="1" fill="#0ea5e9" />
    <rect x="15" y="25" width="3" height="3" rx=".5" fill="#e0f2fe" />
    <rect x="22" y="22" width="2" height="2" rx=".5" fill="#0ea5e9" />
    <rect x="25" y="22" width="2" height="2" rx=".5" fill="#0ea5e9" />
    <rect x="22" y="25" width="7" height="2" rx=".5" fill="#0ea5e9" />
    <rect x="28" y="22" width="2" height="5" rx=".5" fill="#0ea5e9" />
    {/* Ligne scan */}
    <rect x="10" y="23" width="28" height="2" rx="1" fill="#38bdf8" fillOpacity=".5" />
  </Svg>
);

export const LogoMindmap = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Nœud central */}
    <circle cx="24" cy="24" r="6" fill="#8b5cf6" />
    {/* Branches */}
    <line x1="18" y1="24" x2="8" y2="14" stroke="#c4b5fd" strokeWidth="1.5" />
    <line x1="24" y1="18" x2="24" y2="8" stroke="#c4b5fd" strokeWidth="1.5" />
    <line x1="30" y1="24" x2="40" y2="14" stroke="#c4b5fd" strokeWidth="1.5" />
    <line x1="24" y1="30" x2="12" y2="40" stroke="#c4b5fd" strokeWidth="1.5" />
    <line x1="24" y1="30" x2="36" y2="40" stroke="#c4b5fd" strokeWidth="1.5" />
    <line x1="18" y1="24" x2="8" y2="32" stroke="#c4b5fd" strokeWidth="1.5" />
    {/* Nœuds secondaires */}
    <circle cx="8" cy="14" r="4" fill="#a78bfa" />
    <circle cx="24" cy="8" r="4" fill="#a78bfa" />
    <circle cx="40" cy="14" r="4" fill="#a78bfa" />
    <circle cx="12" cy="40" r="3.5" fill="#c4b5fd" />
    <circle cx="36" cy="40" r="3.5" fill="#c4b5fd" />
    <circle cx="8" cy="32" r="3.5" fill="#c4b5fd" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   INTELLIGENCE
══════════════════════════════════════════════════════════════ */

export const LogoSourcing = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Loupe */}
    <circle cx="21" cy="21" r="12" fill="#ede9fe" />
    <circle cx="21" cy="21" r="12" stroke="#6d28d9" strokeWidth="2.5" fill="none" />
    <path d="M30 30 L40 40" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" />
    {/* Sparkles dans la loupe */}
    <path d="M21 14 L22 18 L26 19 L22 20 L21 24 L20 20 L16 19 L20 18 Z" fill="#8b5cf6" />
    <circle cx="16" cy="25" r="1.5" fill="#a78bfa" />
    <circle cx="27" cy="16" r="1" fill="#a78bfa" />
  </Svg>
);

export const LogoAssistant = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Cerveau / IA */}
    <path d="M24 8 C17 8 12 13 12 19 C12 22 13 24 15 26 C15 30 18 33 21 33 L27 33 C30 33 33 30 33 26 C35 24 36 22 36 19 C36 13 31 8 24 8 Z" fill="#bfdbfe" />
    {/* Lignes neurones */}
    <path d="M18 18 L22 22 L26 18 L30 22" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="18" cy="18" r="1.5" fill="#2563eb" />
    <circle cx="26" cy="18" r="1.5" fill="#2563eb" />
    <circle cx="22" cy="22" r="1.5" fill="#1d4ed8" />
    <circle cx="30" cy="22" r="1.5" fill="#2563eb" />
    {/* Éclair */}
    <path d="M23 33 L20 42 L26 36 L22 36 L25 28 L19 35 Z" fill="#fbbf24" />
  </Svg>
);

export const LogoProjets = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Dossier */}
    <path d="M8 18 L8 38 Q8 40 10 40 L38 40 Q40 40 40 38 L40 18 Z" fill="#fff3e0" />
    <path d="M8 18 L8 14 Q8 12 10 12 L22 12 L24 16 L40 16 L40 18 Z" fill="#d97706" />
    {/* Gantt mini */}
    <rect x="13" y="23" width="20" height="2.5" rx="1" fill="#f59e0b" />
    <rect x="13" y="28" width="14" height="2.5" rx="1" fill="#fbbf24" />
    <rect x="13" y="33" width="24" height="2.5" rx="1" fill="#f59e0b" />
    {/* Ligne sépa */}
    <rect x="12" y="22" width="1" height="16" rx=".5" fill="#d97706" />
  </Svg>
);

export const LogoReseauxSociaux = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Instagram-like */}
    <rect x="8" y="8" width="14" height="14" rx="4" fill="#e1306c" />
    <rect x="11" y="11" width="8" height="8" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
    <circle cx="15" cy="15" r="2" fill="none" stroke="white" strokeWidth="1.2" />
    <circle cx="19.5" cy="12.5" r=".8" fill="white" />
    {/* LinkedIn-like */}
    <rect x="26" y="8" width="14" height="14" rx="4" fill="#0a66c2" />
    <text x="33" y="20" textAnchor="middle" fontSize="9" fill="white" fontWeight="800">in</text>
    {/* Facebook-like */}
    <rect x="8" y="26" width="14" height="14" rx="4" fill="#1877f2" />
    <text x="15" y="37" textAnchor="middle" fontSize="10" fill="white" fontWeight="800">f</text>
    {/* X/Twitter-like */}
    <rect x="26" y="26" width="14" height="14" rx="4" fill="#1da1f2" />
    <path d="M29 29 L37 37 M37 29 L29 37" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const LogoCoachingIa = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Chapeau */}
    <path d="M14 22 L34 22 L30 14 L18 14 Z" fill="#9d174d" />
    <rect x="10" y="22" width="28" height="3" rx="1" fill="#9d174d" />
    <rect x="30" y="22" width="4" height="8" rx="1" fill="#9d174d" />
    <circle cx="32" cy="32" r="3" fill="#be185d" />
    {/* Cerveau stylisé */}
    <path d="M16 30 Q16 26 20 26 Q22 26 23 28 Q24 26 26 26 Q30 26 30 30 Q32 34 28 36 Q26 37 24 36 Q22 37 20 36 Q16 34 16 30 Z" fill="#fce7f3" stroke="#9d174d" strokeWidth="1" />
    <path d="M20 30 L23 29 L24 32 L27 29 L28 32" stroke="#be185d" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   VENTES
══════════════════════════════════════════════════════════════ */

export const LogoRendezVous = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Calendrier */}
    <rect x="8" y="12" width="32" height="28" rx="3" fill="#e0f2fe" />
    <rect x="8" y="12" width="32" height="10" rx="3" fill="#0891b2" />
    <rect x="17" y="8" width="3" height="8" rx="1.5" fill="#0891b2" />
    <rect x="28" y="8" width="3" height="8" rx="1.5" fill="#0891b2" />
    {/* Cases */}
    <rect x="12" y="26" width="5" height="4" rx="1" fill="#67e8f9" />
    <rect x="20" y="26" width="5" height="4" rx="1" fill="#22d3ee" />
    <rect x="28" y="26" width="5" height="4" rx="1" fill="#67e8f9" />
    <rect x="12" y="33" width="5" height="4" rx="1" fill="#67e8f9" />
    {/* Plus */}
    <circle cx="35" cy="36" r="6" fill="#0891b2" />
    <path d="M35 33 L35 39 M32 36 L38 36" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const LogoPaiements = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* QR code stylisé */}
    <rect x="8" y="8" width="14" height="14" rx="2" fill="#7c3aed" />
    <rect x="11" y="11" width="8" height="8" rx="1" fill="white" />
    <rect x="13" y="13" width="4" height="4" rx=".5" fill="#7c3aed" />

    <rect x="26" y="8" width="14" height="14" rx="2" fill="#7c3aed" />
    <rect x="29" y="11" width="8" height="8" rx="1" fill="white" />
    <rect x="31" y="13" width="4" height="4" rx=".5" fill="#7c3aed" />

    <rect x="8" y="26" width="14" height="14" rx="2" fill="#7c3aed" />
    <rect x="11" y="29" width="8" height="8" rx="1" fill="white" />
    <rect x="13" y="31" width="4" height="4" rx=".5" fill="#7c3aed" />
    {/* Zone données */}
    <rect x="26" y="26" width="6" height="2.5" rx=".5" fill="#7c3aed" />
    <rect x="34" y="26" width="6" height="2.5" rx=".5" fill="#7c3aed" />
    <rect x="26" y="30" width="14" height="2.5" rx=".5" fill="#a78bfa" />
    <rect x="26" y="34" width="6" height="2.5" rx=".5" fill="#7c3aed" />
    <rect x="34" y="34" width="6" height="2.5" rx=".5" fill="#a78bfa" />
    <rect x="26" y="38" width="10" height="2.5" rx=".5" fill="#7c3aed" />
  </Svg>
);

export const LogoSignature = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Document */}
    <rect x="10" y="8" width="28" height="32" rx="3" fill="#d1fae5" />
    <rect x="14" y="14" width="20" height="2" rx="1" fill="#a7f3d0" />
    <rect x="14" y="19" width="14" height="2" rx="1" fill="#a7f3d0" />
    <rect x="14" y="24" width="16" height="2" rx="1" fill="#a7f3d0" />
    {/* Ligne signature */}
    <rect x="13" y="32" width="22" height="1" rx=".5" fill="#059669" />
    {/* Signature cursive */}
    <path d="M14 30 Q17 27 19 30 Q21 32 23 29 Q25 26 28 30 Q29 32 31 28" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Badge vert validé */}
    <circle cx="36" cy="12" r="6" fill="#059669" />
    <path d="M33.5 12 L35.5 14 L38.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LogoBoutique = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Devanture */}
    <rect x="8" y="20" width="32" height="22" rx="2" fill="#fce7f3" />
    {/* Auvent */}
    <path d="M6 14 L42 14 L42 22 Q38 26 34 22 Q30 26 26 22 Q22 26 18 22 Q14 26 10 22 Q7 26 6 22 Z" fill="#ec4899" />
    {/* Fenêtre droite */}
    <rect x="26" y="28" width="10" height="10" rx="1.5" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1" />
    {/* Porte */}
    <rect x="14" y="30" width="8" height="12" rx="1.5" fill="#f9a8d4" />
    <circle cx="21" cy="36" r="1" fill="#ec4899" />
    {/* Enseigne */}
    <rect x="8" y="14" width="32" height="0" rx="1" fill="#db2777" />
    {/* Sac shopping */}
    <circle cx="38" cy="12" r="7" fill="#ec4899" />
    <path d="M35 12 Q35 8.5 38 8.5 Q41 8.5 41 12" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="33" y="12" width="10" height="7" rx="1" fill="#be185d" />
  </Svg>
);

export const LogoCaisse = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Caisse */}
    <rect x="8" y="20" width="32" height="22" rx="3" fill="#ccfbf1" />
    <rect x="8" y="20" width="32" height="8" rx="3" fill="#0d9488" />
    {/* Écran */}
    <rect x="12" y="22" width="18" height="4" rx="1" fill="#99f6e4" />
    {/* Boutons */}
    <rect x="32" y="22" width="4" height="2" rx=".5" fill="#5eead4" />
    <rect x="32" y="25" width="4" height="1.5" rx=".5" fill="#5eead4" />
    {/* Clavier touches */}
    <rect x="12" y="31" width="5" height="3" rx=".5" fill="#5eead4" />
    <rect x="19" y="31" width="5" height="3" rx=".5" fill="#5eead4" />
    <rect x="26" y="31" width="5" height="3" rx=".5" fill="#5eead4" />
    <rect x="12" y="36" width="5" height="3" rx=".5" fill="#5eead4" />
    <rect x="19" y="36" width="12" height="3" rx=".5" fill="#0d9488" />
    {/* Ticket */}
    <path d="M34 10 L38 10 L38 26 L34 26 Z" fill="#f0fdf4" />
    <path d="M34 26 L36 28 L38 26" fill="#d1fae5" />
    <rect x="35" y="13" width="2" height="1" rx=".3" fill="#9ca3af" />
    <rect x="35" y="16" width="2" height="1" rx=".3" fill="#9ca3af" />
    <rect x="35" y="19" width="2" height="1" rx=".3" fill="#9ca3af" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   DIGITAL
══════════════════════════════════════════════════════════════ */

export const LogoEmailMarketing = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Enveloppe */}
    <rect x="6" y="14" width="36" height="24" rx="3" fill="#fce7f3" />
    <path d="M6 17 L24 28 L42 17" stroke="#e1306c" strokeWidth="2" fill="none" />
    {/* Flap fermé */}
    <path d="M6 14 L24 26 L42 14 Z" fill="#e1306c" />
    {/* Badge envoi */}
    <circle cx="36" cy="12" r="8" fill="#e1306c" />
    <path d="M32 12 L38 12 M36 9 L39 12 L36 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LogoChatbot = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Bulle principale */}
    <rect x="8" y="10" width="32" height="24" rx="6" fill="#8b5cf6" />
    <path d="M14 34 L10 42 L22 36" fill="#8b5cf6" />
    {/* Yeux robot */}
    <rect x="14" y="18" width="7" height="7" rx="2" fill="white" />
    <circle cx="17.5" cy="21.5" r="2.5" fill="#6d28d9" />
    <circle cx="18.5" cy="20.5" r="1" fill="white" />
    <rect x="27" y="18" width="7" height="7" rx="2" fill="white" />
    <circle cx="30.5" cy="21.5" r="2.5" fill="#6d28d9" />
    <circle cx="31.5" cy="20.5" r="1" fill="white" />
    {/* Antenne */}
    <rect x="23.5" y="4" width="1.5" height="7" rx=".75" fill="#a78bfa" />
    <circle cx="24" cy="4" r="2.5" fill="#8b5cf6" />
  </Svg>
);

export const LogoAnalytics = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Fond tableau de bord */}
    <rect x="6" y="10" width="36" height="28" rx="4" fill="#ede9fe" />
    {/* Graphe courbe */}
    <path d="M10 30 Q14 22 18 25 Q22 28 26 18 Q30 10 38 14" stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Aire sous courbe */}
    <path d="M10 30 Q14 22 18 25 Q22 28 26 18 Q30 10 38 14 L38 34 L10 34 Z" fill="#8b5cf6" fillOpacity=".15" />
    {/* Axes */}
    <path d="M10 10 L10 34 L42 34" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
    {/* Points clés */}
    <circle cx="26" cy="18" r="3" fill="#7c3aed" />
    <circle cx="38" cy="14" r="3" fill="#7c3aed" />
    {/* Badge +% */}
    <rect x="30" y="6" width="14" height="7" rx="3" fill="#7c3aed" />
    <text x="37" y="11.5" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">+18%</text>
  </Svg>
);

export const LogoMarketplace = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Boutique */}
    <rect x="8" y="18" width="32" height="24" rx="2" fill="#e0f2fe" />
    <path d="M6 10 L42 10 L42 20 Q38 24 34 20 Q30 24 26 20 Q22 24 18 20 Q14 24 10 20 Q7 24 6 20 Z" fill="#0891b2" />
    {/* Fenêtres */}
    <rect x="12" y="26" width="10" height="8" rx="1" fill="#7dd3fc" />
    <rect x="26" y="26" width="10" height="8" rx="1" fill="#7dd3fc" />
    {/* Étoiles rating */}
    <path d="M24 38 L25 41 L28 41 L26 43 L27 46 L24 44 L21 46 L22 43 L20 41 L23 41 Z" fill="#fbbf24" />
    <path d="M33 36 L34 38 L36 38 L34.5 39.5 L35 41.5 L33 40.5 L31 41.5 L31.5 39.5 L30 38 L32 38 Z" fill="#fbbf24" />
    <path d="M15 36 L16 38 L18 38 L16.5 39.5 L17 41.5 L15 40.5 L13 41.5 L13.5 39.5 L12 38 L14 38 Z" fill="#fbbf24" />
  </Svg>
);

export const LogoCarteVisite = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Carte */}
    <rect x="6" y="14" width="36" height="22" rx="3" fill="#e0f2fe" />
    <rect x="6" y="14" width="36" height="8" rx="3" fill="#0891b2" />
    {/* Avatar */}
    <circle cx="15" cy="25" r="5" fill="#7dd3fc" />
    <circle cx="15" cy="23" r="2" fill="#0891b2" />
    <path d="M11 28 Q11 25 15 25 Q19 25 19 28" fill="#0891b2" />
    {/* Infos */}
    <rect x="22" y="24" width="15" height="2" rx="1" fill="#0891b2" />
    <rect x="22" y="28" width="10" height="1.5" rx=".75" fill="#7dd3fc" />
    <rect x="22" y="31" width="12" height="1.5" rx=".75" fill="#7dd3fc" />
    {/* QR coin */}
    <rect x="34" y="26" width="5" height="5" rx="1" fill="#0891b2" />
    <rect x="35" y="27" width="3" height="3" rx=".5" fill="#e0f2fe" />
    <rect x="35.5" y="27.5" width="2" height="2" rx=".3" fill="#0891b2" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   GESTION
══════════════════════════════════════════════════════════════ */

export const LogoPortail = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Bâtiment */}
    <rect x="10" y="16" width="28" height="26" rx="2" fill="#dbeafe" />
    <path d="M8 18 L24 8 L40 18 Z" fill="#3b82f6" />
    {/* Colonnes */}
    <rect x="13" y="26" width="5" height="16" rx="1" fill="#93c5fd" />
    <rect x="30" y="26" width="5" height="16" rx="1" fill="#93c5fd" />
    {/* Porte centrale */}
    <rect x="20" y="28" width="8" height="14" rx="1.5" fill="#2563eb" />
    {/* Clé */}
    <circle cx="38" cy="12" r="7" fill="#2563eb" />
    <circle cx="38" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.5" />
    <rect x="40" y="12" width="5" height="1.5" rx=".75" fill="white" />
    <rect x="43" y="13.5" width="1.5" height="2" rx=".5" fill="white" />
  </Svg>
);

export const LogoPaie = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Fiche de paie */}
    <rect x="10" y="6" width="28" height="36" rx="3" fill="#d1fae5" />
    <rect x="10" y="6" width="28" height="10" rx="3" fill="#10b981" />
    <text x="24" y="13.5" textAnchor="middle" fontSize="5.5" fill="white" fontWeight="700">PAIE</text>
    {/* Lignes */}
    <rect x="14" y="20" width="20" height="1.5" rx=".75" fill="#a7f3d0" />
    <rect x="14" y="24" width="14" height="1.5" rx=".75" fill="#a7f3d0" />
    <rect x="14" y="28" width="16" height="1.5" rx=".75" fill="#a7f3d0" />
    {/* Ligne totale */}
    <rect x="14" y="32" width="20" height="1" rx=".5" fill="#10b981" />
    <rect x="14" y="34" width="20" height="3" rx="1" fill="#10b981" />
    <text x="24" y="36.5" textAnchor="middle" fontSize="4" fill="white" fontWeight="700">NET À PAYER</text>
    {/* Billet */}
    <rect x="28" y="38" width="12" height="7" rx="1.5" fill="#059669" />
    <rect x="30" y="40" width="8" height="3" rx="1" fill="#34d399" />
  </Svg>
);

export const LogoReputation = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* 5 étoiles */}
    <path d="M24 8 L26 14 L32 14 L27.5 18 L29.5 24 L24 20.5 L18.5 24 L20.5 18 L16 14 L22 14 Z" fill="#fbbf24" />
    {/* Petites étoiles latérales */}
    <path d="M10 20 L11 23 L14 23 L11.5 25 L12.5 28 L10 26.5 L7.5 28 L8.5 25 L6 23 L9 23 Z" fill="#fcd34d" />
    <path d="M38 20 L39 23 L42 23 L39.5 25 L40.5 28 L38 26.5 L35.5 28 L36.5 25 L34 23 L37 23 Z" fill="#fcd34d" />
    {/* Avis texte */}
    <rect x="10" y="32" width="28" height="10" rx="3" fill="#fef3c7" />
    <rect x="13" y="35" width="20" height="2" rx="1" fill="#f59e0b" />
    <rect x="13" y="39" width="14" height="1.5" rx=".75" fill="#fcd34d" />
  </Svg>
);

export const LogoBlog = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Page article */}
    <rect x="8" y="8" width="32" height="36" rx="3" fill="#f0f9ff" />
    {/* Image placeholder */}
    <rect x="8" y="8" width="32" height="14" rx="3" fill="#0369a1" />
    <circle cx="14" cy="15" r="3" fill="#0ea5e9" />
    <path d="M10 22 L16 14 L22 20 L26 16 L38 22 Z" fill="#0284c7" fillOpacity=".5" />
    {/* Titre */}
    <rect x="12" y="26" width="24" height="3" rx="1" fill="#0369a1" />
    {/* Paragraphes */}
    <rect x="12" y="32" width="24" height="2" rx="1" fill="#7dd3fc" />
    <rect x="12" y="36" width="18" height="2" rx="1" fill="#7dd3fc" />
    {/* Stylo IA */}
    <circle cx="38" cy="38" r="6" fill="#0369a1" />
    <path d="M36 36 L40 40 M38 35 L39.5 36.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M35.5 40 L37 40 L36 41.5 Z" fill="white" />
  </Svg>
);

export const LogoTemoignages = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Grande bulle */}
    <rect x="6" y="8" width="36" height="24" rx="6" fill="#ffedd5" />
    <path d="M12 32 L8 40 L20 34" fill="#ffedd5" />
    {/* Guillemets */}
    <text x="14" y="26" fontSize="20" fill="#ea580c" fontWeight="800" opacity=".3">"</text>
    {/* Étoiles dans bulle */}
    <path d="M18 16 L19 19 L22 19 L20 21 L21 24 L18 22.5 L15 24 L16 21 L14 19 L17 19 Z" fill="#f97316" />
    <path d="M26 16 L27 19 L30 19 L28 21 L29 24 L26 22.5 L23 24 L24 21 L22 19 L25 19 Z" fill="#f97316" />
    <path d="M34 16 L35 19 L38 19 L36 21 L37 24 L34 22.5 L31 24 L32 21 L30 19 L33 19 Z" fill="#fb923c" />
  </Svg>
);

export const LogoPlanification = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Cible OKR */}
    <circle cx="24" cy="24" r="16" stroke="#0c4a6e" strokeWidth="1.5" fill="#e0f2fe" />
    <circle cx="24" cy="24" r="10" stroke="#0369a1" strokeWidth="1.5" fill="#bae6fd" />
    <circle cx="24" cy="24" r="5" fill="#075985" />
    <circle cx="24" cy="24" r="2" fill="#0c4a6e" />
    {/* Flèche OKR */}
    <path d="M36 10 L28 20" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 10 L30 10 M36 10 L36 16" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
    {/* Badge % */}
    <rect x="32" y="32" width="14" height="7" rx="3" fill="#075985" />
    <text x="39" y="37.5" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">78%</text>
  </Svg>
);

export const LogoSiteWeb = ({ size }: LogoProps) => (
  <Svg size={size}>
    {/* Globe */}
    <circle cx="22" cy="22" r="14" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
    {/* Méridiens */}
    <ellipse cx="22" cy="22" rx="5" ry="14" fill="none" stroke="#a78bfa" strokeWidth="1" />
    <line x1="8" y1="22" x2="36" y2="22" stroke="#a78bfa" strokeWidth="1" />
    <line x1="10" y1="16" x2="34" y2="16" stroke="#c4b5fd" strokeWidth=".8" />
    <line x1="10" y1="28" x2="34" y2="28" stroke="#c4b5fd" strokeWidth=".8" />
    {/* Curseur souris */}
    <path d="M34 32 L34 44 L38 40 L42 44 L44 42 L40 38 L44 34 Z" fill="#7c3aed" />
    <path d="M34 32 L34 44 L38 40 L42 44 L44 42 L40 38 L44 34 Z" stroke="white" strokeWidth="1" />
  </Svg>
);

/* ══════════════════════════════════════════════════════════════
   MAP  slug → composant
══════════════════════════════════════════════════════════════ */

const LOGOS: Record<string, React.FC<LogoProps>> = {
  "factures":         LogoFactures,
  "depenses":         LogoDepenses,
  "tresorerie":       LogoTresorerie,
  "comptabilite":     LogoComptabilite,
  "banque":           LogoBanque,
  "declarations":     LogoDeclarations,
  "crm":              LogoCrm,
  "contrats":         LogoContrats,
  "fournisseurs":     LogoFournisseurs,
  "stocks":           LogoStocks,
  "productivite":     LogoProductivite,
  "planning":         LogoPlanning,
  "equipe":           LogoEquipe,
  "chrono":           LogoChrono,
  "bloc-notes":       LogoNotes,
  "checklists":       LogoChecklists,
  "scanner":          LogoScanner,
  "mindmap":          LogoMindmap,
  "sourcing":         LogoSourcing,
  "assistant":        LogoAssistant,
  "projets":          LogoProjets,
  "reseaux-sociaux":  LogoReseauxSociaux,
  "coaching-ia":      LogoCoachingIa,
  "rendez-vous":      LogoRendezVous,
  "paiements":        LogoPaiements,
  "signature":        LogoSignature,
  "boutique":         LogoBoutique,
  "caisse":           LogoCaisse,
  "email-marketing":  LogoEmailMarketing,
  "chatbot":          LogoChatbot,
  "analytics":        LogoAnalytics,
  "marketplace":      LogoMarketplace,
  "carte-visite":     LogoCarteVisite,
  "portail":          LogoPortail,
  "paie":             LogoPaie,
  "reputation":       LogoReputation,
  "blog":             LogoBlog,
  "temoignages":      LogoTemoignages,
  "planification":    LogoPlanification,
  "site-web":         LogoSiteWeb,
};

interface AppLogoProps {
  slug: string;
  size?: number;
  bg?: string;
}

export default function AppLogo({ slug, size = 48, bg = "#f8f9fa" }: AppLogoProps) {
  const Logo = LOGOS[slug];
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl"
      style={{
        width: size + 16,
        height: size + 16,
        background: bg,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {Logo ? (
        <Logo size={size} />
      ) : (
        <div style={{ width: size, height: size, background: bg, borderRadius: 8 }} />
      )}
    </div>
  );
}
