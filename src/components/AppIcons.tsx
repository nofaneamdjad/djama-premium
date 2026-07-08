/**
 * AppIcons — style Odoo : fond clair teinté, illustration plate et professionnelle.
 */

import React from "react";

/** Fond flat avec légère teinte couleur */
function Card({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="h-full w-full">
      <rect width="60" height="60" rx="14" fill={bg} />
      {children}
    </svg>
  );
}

export const APP_ICONS: Record<string, React.ReactElement> = {

  /* ════════ FINANCE ════════ */

  "/client/factures": (
    <Card bg="#EEF2FF">
      {/* Document */}
      <rect x="13" y="9" width="24" height="32" rx="3.5" fill="#4F46E5" />
      <path d="M29 9 L37 17 H29 Z" fill="#3730A3" />
      <rect x="17" y="21" width="13" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="17" y="26" width="9"  height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="17" y="30" width="11" height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="17" y="34" width="7"  height="2"   rx="1"    fill="white" opacity="0.4" />
      {/* Badge check */}
      <circle cx="40" cy="43" r="9" fill="#22C55E" />
      <path d="M36 43 L39 46 L45 40" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "/client/depenses": (
    <Card bg="#FFF7ED">
      {/* Carte bancaire */}
      <rect x="7" y="16" width="46" height="29" rx="6" fill="#EA580C" />
      <rect x="7" y="24" width="46" height="8"  fill="#C2410C" opacity="0.45" />
      {/* Puce */}
      <rect x="13" y="19" width="10" height="7" rx="2" fill="#FED7AA" />
      <line x1="15.5" y1="20.5" x2="15.5" y2="24.5" stroke="#EA580C" strokeWidth="1" opacity="0.5" />
      <line x1="18"   y1="20.5" x2="18"   y2="24.5" stroke="#EA580C" strokeWidth="1" opacity="0.5" />
      <line x1="20.5" y1="20.5" x2="20.5" y2="24.5" stroke="#EA580C" strokeWidth="1" opacity="0.5" />
      {/* Numéros */}
      <circle cx="14" cy="37" r="2.5" fill="white" opacity="0.7" />
      <circle cx="21" cy="37" r="2.5" fill="white" opacity="0.55" />
      <circle cx="28" cy="37" r="2.5" fill="white" opacity="0.4" />
      <circle cx="35" cy="37" r="2.5" fill="white" opacity="0.4" />
      {/* Badge flèche */}
      <circle cx="45" cy="17" r="8" fill="#F97316" stroke="white" strokeWidth="1.5" />
      <path d="M45 22 V14 M42 17 L45 14 L48 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "/client/tresorerie": (
    <Card bg="#F0FDF4">
      {/* Barres */}
      <rect x="8"  y="35" width="11" height="18" rx="3" fill="#86EFAC" />
      <rect x="23" y="27" width="11" height="26" rx="3" fill="#4ADE80" />
      <rect x="38" y="17" width="11" height="36" rx="3" fill="#16A34A" />
      <line x1="6" y1="54" x2="54" y2="54" stroke="#15803D" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      {/* Tendance */}
      <path d="M13.5 36 L28 27 L43 18" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="43" cy="18" r="3.5" fill="#15803D" />
    </Card>
  ),

  "/client/comptabilite": (
    <Card bg="#E0F2FE">
      {/* Livre ouvert */}
      <path d="M12 14 C12 12.9 12.9 12 14 12 H28 V47 H14 C12.9 47 12 46.1 12 45 Z" fill="#0284C7" />
      <path d="M28 12 H44 C45.1 12 46 12.9 46 14 V45 C46 46.1 45.1 47 44 47 H28 Z" fill="#0369A1" />
      <line x1="28" y1="12" x2="28" y2="47" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Lignes gauche */}
      <rect x="15" y="19" width="10" height="2" rx="1" fill="white" opacity="0.75" />
      <rect x="15" y="24" width="7"  height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="15" y="29" width="9"  height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="15" y="34" width="6"  height="1.5" rx="0.75" fill="white" opacity="0.4" />
      {/* Lignes droite */}
      <rect x="31" y="19" width="10" height="2" rx="1" fill="white" opacity="0.75" />
      <rect x="31" y="24" width="7"  height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="31" y="29" width="9"  height="1.5" rx="0.75" fill="white" opacity="0.5" />
      <rect x="31" y="34" width="6"  height="1.5" rx="0.75" fill="white" opacity="0.4" />
      {/* Badge € */}
      <circle cx="43" cy="43" r="9" fill="#0EA5E9" />
      <text x="43" y="47.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">€</text>
    </Card>
  ),

  /* ════════ COMMERCIAL ════════ */

  "/client/crm": (
    <Card bg="#F5F3FF">
      {/* Personne principale */}
      <circle cx="30" cy="19" r="9" fill="#7C3AED" />
      <path d="M13 47 C13 38.2 20.8 31 30 31 C39.2 31 47 38.2 47 47" fill="#7C3AED" />
      {/* Avatars secondaires */}
      <circle cx="46" cy="22" r="5.5" fill="#A78BFA" opacity="0.8" />
      <circle cx="14" cy="24" r="5" fill="#A78BFA" opacity="0.6" />
      {/* Pipeline dots */}
      <circle cx="20" cy="52" r="2" fill="#6D28D9" opacity="0.5" />
      <circle cx="30" cy="52" r="2" fill="#6D28D9" opacity="0.5" />
      <circle cx="40" cy="52" r="2" fill="#6D28D9" opacity="0.5" />
    </Card>
  ),

  "/client/contrats": (
    <Card bg="#FEFCE8">
      {/* Document */}
      <rect x="12" y="8" width="28" height="37" rx="3.5" fill="#CA8A04" />
      <path d="M32 8 L40 16 H32 Z" fill="#A16207" />
      <rect x="16" y="21" width="16" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="16" y="27" width="11" height="2" rx="1" fill="white" opacity="0.65" />
      <rect x="16" y="32" width="13" height="2" rx="1" fill="white" opacity="0.65" />
      {/* Ligne signature */}
      <line x1="16" y1="39" x2="30" y2="39" stroke="white" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
      {/* Stylo */}
      <g transform="rotate(-40 38 37)">
        <rect x="36" y="28" width="4" height="13" rx="2" fill="#FDE68A" />
        <path d="M36 41 L38 46 L40 41 Z" fill="#A16207" />
      </g>
    </Card>
  ),

  "/client/fournisseurs": (
    <Card bg="#ECFDF5">
      {/* Camion */}
      <rect x="4" y="25" width="32" height="21" rx="3.5" fill="#16A34A" />
      <path d="M36 30 H51 L55 38 V46 H36 Z" fill="#15803D" />
      <rect x="38" y="32" width="10" height="8" rx="2" fill="#BBF7D0" />
      {/* Roues */}
      <circle cx="14" cy="47" r="6" fill="#14532D" />
      <circle cx="14" cy="47" r="3" fill="#DCFCE7" />
      <circle cx="44" cy="47" r="6" fill="#14532D" />
      <circle cx="44" cy="47" r="3" fill="#DCFCE7" />
      {/* Lignes cargo */}
      <rect x="9" y="29" width="19" height="2" rx="1" fill="white" opacity="0.4" />
    </Card>
  ),

  "/client/stocks": (
    <Card bg="#F0FDFA">
      {/* Boîtes empilées */}
      <rect x="8"  y="37" width="22" height="16" rx="3" fill="#0D9488" />
      <line x1="19" y1="37" x2="19" y2="53" stroke="#0F766E" strokeWidth="1.5" />
      <line x1="8"  y1="45" x2="30" y2="45" stroke="#0F766E" strokeWidth="1" />
      <rect x="16" y="23" width="22" height="16" rx="3" fill="#14B8A6" />
      <line x1="27" y1="23" x2="27" y2="39" stroke="#0D9488" strokeWidth="1.5" />
      <line x1="16" y1="31" x2="38" y2="31" stroke="#0D9488" strokeWidth="1" />
      <rect x="28" y="10" width="20" height="15" rx="3" fill="#2DD4BF" />
      <line x1="38" y1="10" x2="38" y2="25" stroke="#14B8A6" strokeWidth="1.5" />
    </Card>
  ),

  /* ════════ OPÉRATIONS ════════ */

  "/client/productivite": (
    <Card bg="#FDF2F8">
      {/* Fond liste */}
      <rect x="10" y="9" width="40" height="42" rx="5" fill="#BE185D" />
      <rect x="10" y="9" width="40" height="8"  rx="5" fill="#9D174D" />
      <rect x="10" y="14" width="40" height="3"  fill="#9D174D" />
      {/* Item 1 — coché */}
      <rect x="16" y="21" width="7" height="7" rx="2" fill="white" opacity="0.9" />
      <path d="M17.5 24.5 L19.5 26.5 L23 22.5" stroke="#BE185D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="23" width="16" height="3" rx="1.5" fill="white" opacity="0.75" />
      {/* Item 2 — coché */}
      <rect x="16" y="31" width="7" height="7" rx="2" fill="white" opacity="0.9" />
      <path d="M17.5 34.5 L19.5 36.5 L23 32.5" stroke="#BE185D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="33" width="13" height="3" rx="1.5" fill="white" opacity="0.75" />
      {/* Item 3 — vide */}
      <rect x="16" y="41" width="7" height="7" rx="2" fill="white" opacity="0.3" />
      <rect x="27" y="43" width="10" height="3" rx="1.5" fill="white" opacity="0.4" />
    </Card>
  ),

  "/client/planning": (
    <Card bg="#EFF6FF">
      {/* Calendrier */}
      <rect x="8"  y="13" width="44" height="39" rx="5" fill="#4F46E5" />
      <rect x="8"  y="13" width="44" height="13" rx="5" fill="#4338CA" />
      <rect x="8"  y="21" width="44" height="5"  fill="#4338CA" />
      <rect x="18" y="8"  width="4"  height="10" rx="2" fill="#6366F1" />
      <rect x="38" y="8"  width="4"  height="10" rx="2" fill="#6366F1" />
      {/* Cases jours */}
      <rect x="13" y="30" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.65" />
      <rect x="24" y="30" width="7" height="6" rx="1.5" fill="white" opacity="0.9" />
      <rect x="35" y="30" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.65" />
      <rect x="46" y="30" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.65" />
      <rect x="13" y="40" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.45" />
      <rect x="24" y="40" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.45" />
      <rect x="35" y="40" width="7" height="6" rx="1.5" fill="#A5B4FC" opacity="0.45" />
    </Card>
  ),

  "/client/equipe": (
    <Card bg="#ECFEFF">
      {/* Gauche */}
      <circle cx="17" cy="21" r="7" fill="#67E8F9" />
      <path d="M5 45 C5 37.5 10.5 32 17 32" stroke="#67E8F9" strokeWidth="3" strokeLinecap="round" />
      {/* Droite */}
      <circle cx="43" cy="21" r="7" fill="#22D3EE" />
      <path d="M55 45 C55 37.5 49.5 32 43 32" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" />
      {/* Centre */}
      <circle cx="30" cy="19" r="9" fill="#0891B2" />
      <path d="M15 48 C15 39 21.7 33 30 33 C38.3 33 45 39 45 48" fill="#0891B2" />
    </Card>
  ),

  "/client/chrono": (
    <Card bg="#EEF2FF">
      {/* Cadran */}
      <circle cx="30" cy="35" r="19" fill="#7C3AED" />
      <circle cx="30" cy="35" r="15" fill="#6D28D9" />
      {/* Repères */}
      <line x1="30" y1="17" x2="30" y2="21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="30" y1="49" x2="30" y2="53" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="35" x2="16" y2="35" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <line x1="44" y1="35" x2="48" y2="35" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      {/* Aiguilles */}
      <line x1="30" y1="35" x2="30" y2="24" stroke="white"    strokeWidth="2.8" strokeLinecap="round" />
      <line x1="30" y1="35" x2="39" y2="30" stroke="#DDD6FE" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30" cy="35" r="2.8" fill="white" />
      {/* Couronne */}
      <rect x="26" y="12" width="8" height="5"  rx="2.5" fill="#8B5CF6" />
      <rect x="24" y="7"  width="4" height="6"  rx="2"   fill="#A78BFA" />
      <rect x="32" y="7"  width="4" height="6"  rx="2"   fill="#A78BFA" />
    </Card>
  ),

  /* ════════ NOTES ════════ */

  "/client/bloc-notes": (
    <Card bg="#FEFCE8">
      {/* Cahier spirale */}
      <rect x="14" y="9"  width="34" height="42" rx="4" fill="#CA8A04" />
      <circle cx="14" cy="18" r="3.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1.2" />
      <circle cx="14" cy="29" r="3.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1.2" />
      <circle cx="14" cy="40" r="3.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1.2" />
      <rect x="22" y="17" width="21" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="22" y="24" width="16" height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="22" y="31" width="18" height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="22" y="38" width="12" height="2"   rx="1"    fill="white" opacity="0.45" />
    </Card>
  ),

  "/client/checklists": (
    <Card bg="#F0FDF4">
      <rect x="10" y="10" width="40" height="40" rx="5" fill="#10B981" />
      {/* Item 1 */}
      <rect x="16" y="19" width="7" height="7" rx="2" fill="white" opacity="0.9" />
      <path d="M17.5 22.5 L19.5 24.5 L23.5 20.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="21" width="16" height="3" rx="1.5" fill="white" opacity="0.75" />
      {/* Item 2 */}
      <rect x="16" y="30" width="7" height="7" rx="2" fill="white" opacity="0.9" />
      <path d="M17.5 33.5 L19.5 35.5 L23.5 31.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="32" width="13" height="3" rx="1.5" fill="white" opacity="0.75" />
      {/* Item 3 */}
      <rect x="16" y="41" width="7" height="7" rx="2" fill="white" opacity="0.3" />
      <rect x="27" y="43" width="10" height="3" rx="1.5" fill="white" opacity="0.4" />
    </Card>
  ),

  "/client/scanner": (
    <Card bg="#E0F2FE">
      {/* Coins du scanner */}
      <path d="M11 22 V13 H20" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11 38 V47 H20" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M49 22 V13 H40" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M49 38 V47 H40" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Ligne de scan */}
      <rect x="12" y="28.5" width="36" height="3" fill="#BAE6FD" opacity="0.4" rx="1.5" />
      <line x1="12" y1="30" x2="48" y2="30" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
      {/* Document fantôme */}
      <rect x="21" y="18" width="18" height="24" rx="2" fill="#0EA5E9" opacity="0.12" />
      <rect x="24" y="23" width="10" height="1.5" rx="0.75" fill="#0369A1" opacity="0.45" />
      <rect x="24" y="27" width="7"  height="1.5" rx="0.75" fill="#0369A1" opacity="0.35" />
      <rect x="24" y="35" width="9"  height="1.5" rx="0.75" fill="#0369A1" opacity="0.35" />
    </Card>
  ),

  "/client/mindmap": (
    <Card bg="#FAF5FF">
      {/* Nœud central */}
      <circle cx="30" cy="30" r="8" fill="#8B5CF6" />
      {/* Branches */}
      <line x1="30" y1="22" x2="30" y2="13" stroke="#C4B5FD" strokeWidth="2" />
      <circle cx="30" cy="10" r="5" fill="#A78BFA" />
      <line x1="37.5" y1="25" x2="46" y2="18" stroke="#C4B5FD" strokeWidth="2" />
      <circle cx="49" cy="16" r="5" fill="#7C3AED" />
      <line x1="37.5" y1="35" x2="46" y2="42" stroke="#C4B5FD" strokeWidth="2" />
      <circle cx="49" cy="45" r="5" fill="#A78BFA" />
      <line x1="22.5" y1="35" x2="14" y2="42" stroke="#C4B5FD" strokeWidth="2" />
      <circle cx="11" cy="45" r="5" fill="#7C3AED" />
      <line x1="22.5" y1="25" x2="14" y2="18" stroke="#C4B5FD" strokeWidth="2" />
      <circle cx="11" cy="16" r="5" fill="#A78BFA" />
    </Card>
  ),

  /* ════════ INTELLIGENCE ════════ */

  "/client/projets": (
    <Card bg="#FFF3E0">
      {/* Dossier */}
      <path d="M8 22 C8 20.3 9.3 19 11 19 H23 L27 15 H49 C50.7 15 52 16.3 52 18 V44 C52 45.7 50.7 47 49 47 H11 C9.3 47 8 45.7 8 44 Z" fill="#F59E0B" />
      <path d="M8 24 H52 V44 C52 45.7 50.7 47 49 47 H11 C9.3 47 8 45.7 8 44 Z" fill="#FBBF24" />
      {/* Items dans le dossier */}
      <rect x="14" y="29" width="20" height="3" rx="1.5" fill="white" opacity="0.85" />
      <rect x="14" y="35" width="15" height="3" rx="1.5" fill="white" opacity="0.65" />
      <rect x="14" y="41" width="18" height="3" rx="1.5" fill="white" opacity="0.45" />
      {/* Badge check */}
      <circle cx="46" cy="46" r="9" fill="#D97706" />
      <path d="M42 46 L45 49 L51 43" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "/client/sourcing": (
    <Card bg="#EDE9FE">
      {/* Loupe */}
      <circle cx="25" cy="25" r="14" stroke="#6D28D9" strokeWidth="3" fill="#EDE9FE" />
      {/* Personne dans la loupe */}
      <circle cx="25" cy="21" r="5" fill="#7C3AED" />
      <path d="M17 33 C17 28.6 20.6 25 25 25 C29.4 25 33 28.6 33 33" fill="#7C3AED" />
      {/* Manche */}
      <line x1="35" y1="35" x2="50" y2="50" stroke="#5B21B6" strokeWidth="4.5" strokeLinecap="round" />
    </Card>
  ),

  "/client/assistant": (
    <Card bg="#E8F4FD">
      {/* Éclair IA */}
      <path d="M35 9 L19 33 H31 L25 51 L43 27 H31 Z" fill="#0369A1" />
      {/* Points lumineux */}
      <circle cx="45" cy="16" r="3"   fill="#38BDF8" opacity="0.7" />
      <circle cx="49" cy="27" r="2"   fill="#0EA5E9" opacity="0.55" />
      <circle cx="13" cy="41" r="2.5" fill="#38BDF8" opacity="0.5" />
    </Card>
  ),

  "/client/reputation": (
    <Card bg="#FEF2F2">
      {/* Étoile */}
      <path d="M30 10 L34.5 22.5 H48 L37 29.5 L41 42 L30 35 L19 42 L23 29.5 L12 22.5 H25.5 Z" fill="#DC2626" />
      <path d="M30 15 L33 24 H43 L35.5 28.5 L38 37.5 L30 32 L22 37.5 L24.5 28.5 L17 24 H27 Z" fill="#EF4444" />
      <circle cx="30" cy="28" r="5" fill="#FCA5A5" />
    </Card>
  ),

  "/client/reseaux-sociaux": (
    <Card bg="#FCE7F3">
      {/* 3 nœuds réseau */}
      <circle cx="30" cy="13" r="8" fill="#DB2777" />
      <circle cx="13" cy="43" r="8" fill="#EC4899" />
      <circle cx="47" cy="43" r="8" fill="#F472B6" />
      <line x1="24" y1="19" x2="17" y2="37" stroke="#FBCFE8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="19" x2="43" y2="37" stroke="#FBCFE8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="21" y1="44" x2="39" y2="44" stroke="#FBCFE8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Icône dans le nœud principal */}
      <path d="M27 13 L30 10 L33 13 M30 10 V16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "/coaching-ia/espace": (
    <Card bg="#FAF0FF">
      {/* Cerveau stylisé */}
      <path d="M30 11 C22 11 16 17 16 24 C16 27.5 17.5 30.5 20 32.5 L17 49 H43 L40 32.5 C42.5 30.5 44 27.5 44 24 C44 17 38 11 30 11 Z" fill="#9D174D" />
      {/* Sillon central */}
      <line x1="30" y1="11" x2="30" y2="35" stroke="#FBCFE8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Circonvolutions */}
      <path d="M22 22 Q27 19 30 22 Q33 25 38 22" stroke="#FBCFE8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M20 28 Q25 25 30 28 Q35 31 40 28" stroke="#FBCFE8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Point IA */}
      <circle cx="30" cy="13" r="3" fill="#F9A8D4" opacity="0.7" />
    </Card>
  ),

  /* ════════ GESTION ════════ */

  "/client/portail": (
    <Card bg="#EFF6FF">
      {/* Bâtiment */}
      <path d="M7 27 L30 11 L53 27" fill="#2563EB" />
      <rect x="11" y="26" width="38" height="26" rx="2" fill="#3B82F6" />
      {/* Fenêtres */}
      <rect x="15" y="30" width="9" height="8" rx="1.5" fill="#BFDBFE" />
      <rect x="28" y="30" width="9" height="8" rx="1.5" fill="#BFDBFE" />
      <rect x="41" y="30" width="9" height="8" rx="1.5" fill="#BFDBFE" />
      {/* Porte */}
      <rect x="24" y="38" width="12" height="14" rx="2" fill="#1D4ED8" />
      <circle cx="34" cy="46" r="1.5" fill="#BFDBFE" />
    </Card>
  ),

  "/client/paie": (
    <Card bg="#D1FAE5">
      {/* Billet */}
      <rect x="5" y="18" width="50" height="26" rx="6" fill="#16A34A" />
      <circle cx="30" cy="31" r="10" fill="#15803D" />
      <circle cx="30" cy="31" r="7"  fill="#166534" />
      <text x="30" y="35.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#4ADE80" fontFamily="Arial,sans-serif">€</text>
      {/* Décorations coins */}
      <rect x="9"  y="22" width="7" height="4" rx="1.5" fill="#15803D" opacity="0.55" />
      <rect x="44" y="22" width="7" height="4" rx="1.5" fill="#15803D" opacity="0.55" />
      <rect x="9"  y="36" width="7" height="4" rx="1.5" fill="#15803D" opacity="0.55" />
      <rect x="44" y="36" width="7" height="4" rx="1.5" fill="#15803D" opacity="0.55" />
    </Card>
  ),

  "/client/blog": (
    <Card bg="#F0F9FF">
      {/* Livre ouvert */}
      <rect x="8" y="13" width="44" height="35" rx="4" fill="#0369A1" />
      <line x1="30" y1="13" x2="30" y2="48" stroke="#075985" strokeWidth="2" opacity="0.6" />
      {/* Page gauche */}
      <rect x="12" y="20" width="14" height="2.5" rx="1.25" fill="white" opacity="0.85" />
      <rect x="12" y="25" width="10" height="1.8" rx="0.9"  fill="white" opacity="0.6" />
      <rect x="12" y="29" width="12" height="1.8" rx="0.9"  fill="white" opacity="0.6" />
      <rect x="12" y="33" width="8"  height="1.8" rx="0.9"  fill="white" opacity="0.45" />
      <rect x="12" y="37" width="11" height="1.8" rx="0.9"  fill="white" opacity="0.45" />
      {/* Page droite */}
      <rect x="34" y="20" width="14" height="2.5" rx="1.25" fill="white" opacity="0.85" />
      <rect x="34" y="25" width="9"  height="1.8" rx="0.9"  fill="white" opacity="0.6" />
      <rect x="34" y="29" width="11" height="1.8" rx="0.9"  fill="white" opacity="0.6" />
      <rect x="34" y="33" width="7"  height="1.8" rx="0.9"  fill="white" opacity="0.45" />
      <rect x="34" y="37" width="10" height="1.8" rx="0.9"  fill="white" opacity="0.45" />
      {/* Marque-page */}
      <path d="M42 8 V21 L46 18 L50 21 V8 Z" fill="#BAE6FD" />
    </Card>
  ),

  "/client/temoignages": (
    <Card bg="#FFF7ED">
      {/* Bulle principale */}
      <rect x="7"  y="9"  width="36" height="24" rx="6" fill="#EA580C" />
      <path d="M19 33 L13 42 L25 33 Z" fill="#EA580C" />
      {/* Guillemets */}
      <text x="15" y="27" fontSize="20" fontWeight="bold" fill="white" opacity="0.85" fontFamily="Georgia,serif">&ldquo;</text>
      <rect x="26" y="17" width="12" height="2"   rx="1"   fill="white" opacity="0.7" />
      <rect x="26" y="22" width="9"  height="2"   rx="1"   fill="white" opacity="0.55" />
      {/* Petite bulle */}
      <rect x="22" y="37" width="31" height="16" rx="5" fill="#F97316" />
      <rect x="27" y="41" width="18" height="2"  rx="1" fill="white" opacity="0.6" />
      <rect x="27" y="46" width="13" height="2"  rx="1" fill="white" opacity="0.45" />
    </Card>
  ),

  "/client/planification": (
    <Card bg="#CFFAFE">
      {/* Cible OKR */}
      <circle cx="30" cy="30" r="20" stroke="#0369A1" strokeWidth="2.5" fill="#BAE6FD" opacity="0.2" />
      <circle cx="30" cy="30" r="13" stroke="#0369A1" strokeWidth="2.5" fill="#7DD3FC" opacity="0.15" />
      <circle cx="30" cy="30" r="7"  stroke="#0369A1" strokeWidth="2.5" fill="#38BDF8" opacity="0.2" />
      <circle cx="30" cy="30" r="3.5" fill="#0369A1" />
      {/* Flèche */}
      <line x1="30" y1="30" x2="44" y2="16" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 14 H46 V22" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Card>
  ),

  /* ════════ QUICK ACTIONS ════════ */

  "qa/devis": (
    <Card bg="#EEF2FF">
      <rect x="13" y="9" width="24" height="32" rx="3.5" fill="#4F46E5" />
      <path d="M29 9 L37 17 H29 Z" fill="#3730A3" />
      <rect x="17" y="21" width="13" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="17" y="26" width="9"  height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="17" y="30" width="11" height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="17" y="34" width="7"  height="2"   rx="1"    fill="white" opacity="0.4" />
      {/* Badge crayon */}
      <circle cx="40" cy="43" r="9" fill="#F97316" />
      <g transform="translate(40,43) rotate(-45)">
        <rect x="-2" y="-6" width="4" height="10" rx="1.5" fill="white" />
        <path d="M-2 4 L0 8 L2 4 Z" fill="#EA580C" />
      </g>
    </Card>
  ),

  "qa/contact": (
    <Card bg="#F5F3FF">
      <circle cx="25" cy="19" r="9"  fill="#7C3AED" />
      <path d="M10 47 C10 38 16.8 32 25 32" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="43" r="10" fill="#7C3AED" />
      <path d="M38.5 43 L41.5 46 L48 39.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "qa/note": (
    <Card bg="#FEFCE8">
      <rect x="12" y="9"  width="30" height="36" rx="4" fill="#CA8A04" />
      <rect x="12" y="9"  width="7"  height="36" rx="4" fill="#B45309" />
      <circle cx="16" cy="17" r="2.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1" />
      <circle cx="16" cy="26" r="2.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1" />
      <circle cx="16" cy="35" r="2.5" fill="#FEF9C3" stroke="#92400E" strokeWidth="1" />
      <rect x="23" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.9" />
      <rect x="23" y="21" width="10" height="2"   rx="1"    fill="white" opacity="0.65" />
      <rect x="23" y="27" width="12" height="2"   rx="1"    fill="white" opacity="0.65" />
      <circle cx="44" cy="44" r="10" fill="#22C55E" />
      <path d="M40 44 L43 47 L49 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Card>
  ),

  "qa/timer": (
    <Card bg="#F5F3FF">
      <circle cx="30" cy="35" r="19" fill="#7C3AED" />
      <circle cx="30" cy="35" r="15" fill="#6D28D9" />
      <line x1="30" y1="17" x2="30" y2="21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="30" y1="49" x2="30" y2="53" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="35" x2="16" y2="35" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <line x1="44" y1="35" x2="48" y2="35" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      <line x1="30" y1="35" x2="30" y2="24" stroke="white"   strokeWidth="2.8" strokeLinecap="round" />
      <line x1="30" y1="35" x2="39" y2="30" stroke="#DDD6FE" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30" cy="35" r="2.8" fill="white" />
      <rect x="26" y="12" width="8" height="5"  rx="2.5" fill="#8B5CF6" />
      <rect x="24" y="7"  width="4" height="6"  rx="2"   fill="#A78BFA" />
      <rect x="32" y="7"  width="4" height="6"  rx="2"   fill="#A78BFA" />
    </Card>
  ),
};


/** Icône module style Odoo avec ombre légère */
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
        borderRadius: Math.round(size * 0.22),
        opacity: locked ? 0.45 : 1,
        boxShadow: locked
          ? "none"
          : "0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {icon}
    </div>
  );
}
