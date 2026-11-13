"use client";
import React from "react";

export type AppIconProps = { size?: number };
type IC = React.FC<AppIconProps>;

// White-on-color icons — designed for squircle colored backgrounds.
// All use fill/stroke="white" with fillOpacity for depth.
export const APP_ICONS: Record<string, IC> = {

  factures: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="13" height="17" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="6.5" y="5.5" width="8"   height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="6.5" y="8.2" width="5.5" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="6.5" y="11"  width="7"   height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <path d="M12 14c-.6.9-2.6 1-3.2 0" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="12" y2="13" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8" y1="15" x2="11" y2="15" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),

  depenses: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="7" width="19" height="12" rx="2.5" fill="white" fillOpacity=".9"/>
      <rect x="2.5" y="11" width="19" height="2" fill="white" fillOpacity=".25"/>
      <rect x="4.5" y="13.5" width="5" height="2.5" rx="1.25" fill="white" fillOpacity=".5"/>
      <circle cx="17.5" cy="7" r="4" fill="white" fillOpacity=".8"/>
      <path d="M19 6c-.4-.7-1.2-1-2-1-1.1 0-2 .9-2 2s.9 2 2 2c1.1 0 2-.9 2-2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <line x1="15.5" y1="7" x2="17.5" y2="7" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="15.5" y1="8.3" x2="17" y2="8.3" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),

  tresorerie: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 18c3-6 7-6 10-10" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M14 8l3-3 2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8"  cy="17" r="1.5" fill="white" fillOpacity=".7"/>
      <circle cx="13" cy="13" r="1.5" fill="white" fillOpacity=".7"/>
      <circle cx="17" cy="9"  r="1.5" fill="white" fillOpacity=".7"/>
    </svg>
  ),

  comptabilite: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="10" height="16" rx="1.5" fill="white" fillOpacity=".9"/>
      <rect x="12" y="4" width="10" height="16" rx="1.5" fill="white" fillOpacity=".7"/>
      <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="1.5"/>
      <rect x="4" y="6.5" width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="4" y="9"   width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="4" y="11.5" width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="14" y="6.5" width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="14" y="9"   width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="14" y="11.5" width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="4"  y="15" width="6" height="2" rx=".6" fill="white" fillOpacity=".6"/>
      <rect x="14" y="15" width="6" height="2" rx=".6" fill="white" fillOpacity=".6"/>
    </svg>
  ),

  banque: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 8L12 2l10 6z" fill="white" fillOpacity=".9"/>
      <rect x="4"  y="8"  width="3" height="9" fill="white" fillOpacity=".7"/>
      <rect x="10.5" y="8" width="3" height="9" fill="white" fillOpacity=".7"/>
      <rect x="17" y="8"  width="3" height="9" fill="white" fillOpacity=".7"/>
      <rect x="2"  y="18" width="20" height="2.5" rx="1" fill="white" fillOpacity=".9"/>
    </svg>
  ),

  declarations: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="13" height="17" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="5.5" y="5.5" width="8" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="5.5" y="8.2" width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <circle cx="17" cy="17" r="5" fill="white" fillOpacity=".85"/>
      <path d="M14.5 17l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  caisse: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2.5" fill="white" fillOpacity=".9"/>
      <rect x="4.5" y="8.5" width="11" height="5.5" rx="1.5" fill="white" fillOpacity=".4"/>
      <circle cx="17.5" cy="11.5" r="2" fill="white" fillOpacity=".6"/>
      <rect x="4.5" y="16" width="2.5" height="2.5" rx=".6" fill="white" fillOpacity=".6"/>
      <rect x="8"   y="16" width="2.5" height="2.5" rx=".6" fill="white" fillOpacity=".6"/>
      <rect x="11.5" y="16" width="2.5" height="2.5" rx=".6" fill="white" fillOpacity=".6"/>
      <path d="M6 2 L6 6 M10 2 L10 6 M14 2 L14 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  paiements: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5"  width="7" height="7" rx="1.2" fill="white" fillOpacity=".5"/>
      <rect x="2" y="13" width="7" height="7" rx="1.2" fill="white" fillOpacity=".5"/>
      <rect x="15" y="5" width="7" height="7" rx="1.2" fill="white" fillOpacity=".5"/>
      <rect x="3.5" y="6.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="3.5" y="9"   width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="6"   y="6.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="3.5" y="14.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="6"   y="14.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="6"   y="17"  width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="16.5" y="6.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="19"   y="6.5" width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <rect x="16.5" y="9"   width="1.5" height="1.5" fill="white" fillOpacity=".9"/>
      <path d="M13 13h4l-2 4h3l-4 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  crm: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6"  r="3"   fill="white" fillOpacity=".9"/>
      <circle cx="4"  cy="15" r="2.5" fill="white" fillOpacity=".8"/>
      <circle cx="20" cy="15" r="2.5" fill="white" fillOpacity=".8"/>
      <path d="M4 12.5c0-2 1.8-3.5 4-3.5h8c2.2 0 4 1.5 4 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="4"  y1="12.5" x2="4"  y2="12.5" stroke="white" strokeWidth="1.5"/>
      <path d="M7 20c0-1.7 1.3-3 3-3h4c1.7 0 3 1.3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  contrats: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="13" height="17" rx="2" fill="white" fillOpacity=".9"/>
      <path d="M4 5c0-1.1.9-2 2-2h9l3 3v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" fill="white" fillOpacity=".9"/>
      <path d="M13 3v4h4" fill="white" fillOpacity=".5"/>
      <rect x="6.5" y="8"  width="8" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <rect x="6.5" y="11" width="6" height="1.2" rx=".6" fill="white" fillOpacity=".4"/>
      <path d="M6.5 15.5c1-2 4-2 5 0" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="17" cy="18" r="3" fill="white" fillOpacity=".7"/>
      <circle cx="17" cy="18" r="1.5" fill="white" fillOpacity=".9"/>
    </svg>
  ),

  fournisseurs: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="8" width="14" height="10" rx="1.5" fill="white" fillOpacity=".9"/>
      <path d="M15 11l3-3h4l1 7h-8z" fill="white" fillOpacity=".8"/>
      <circle cx="5"  cy="20" r="2.5" fill="white" fillOpacity=".6" stroke="white" strokeWidth="1.5"/>
      <circle cx="5"  cy="20" r="1"   fill="white"/>
      <circle cx="18" cy="20" r="2.5" fill="white" fillOpacity=".6" stroke="white" strokeWidth="1.5"/>
      <circle cx="18" cy="20" r="1"   fill="white"/>
      <rect x="3" y="10.5" width="10" height="4.5" rx="1" fill="white" fillOpacity=".25"/>
    </svg>
  ),

  stocks: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="13" width="12" height="8" rx="1.5" fill="white" fillOpacity=".9"/>
      <rect x="4" y="9"  width="12" height="8" rx="1.5" fill="white" fillOpacity=".75"/>
      <rect x="2" y="5"  width="12" height="8" rx="1.5" fill="white" fillOpacity=".6"/>
      <line x1="8"  y1="13" x2="8"  y2="21" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
      <line x1="14" y1="9"  x2="14" y2="17" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
    </svg>
  ),

  boutique: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 8V6a6 6 0 1112 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="2" y="8" width="20" height="13" rx="2.5" fill="white" fillOpacity=".9"/>
      <line x1="6" y1="8" x2="6" y2="21" stroke="white" strokeWidth="1.2" strokeOpacity=".35"/>
      <line x1="12" y1="8" x2="12" y2="21" stroke="white" strokeWidth="1.2" strokeOpacity=".35"/>
      <line x1="18" y1="8" x2="18" y2="21" stroke="white" strokeWidth="1.2" strokeOpacity=".35"/>
    </svg>
  ),

  marketplace: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 10C2 7 4.5 5 7 5h10c2.5 0 5 2 5 5H2z" fill="white" fillOpacity=".9"/>
      <rect x="2" y="10" width="20" height="12" rx="2" fill="white" fillOpacity=".7"/>
      <rect x="2" y="10" width="20" height="2" fill="white" fillOpacity=".4"/>
      <rect x="9"  y="13" width="6" height="9" rx="1" fill="white" fillOpacity=".5"/>
      <circle cx="17.5" cy="7.5" r="3" fill="white" fillOpacity=".8"/>
      <line x1="16" y1="7.5" x2="19" y2="7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="17.5" y1="6" x2="17.5" y2="9" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),

  "email-marketing": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2.5" fill="white" fillOpacity=".9"/>
      <path d="M2 8l10 7 10-7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" fillOpacity=".5"/>
      <circle cx="18.5" cy="5.5" r="4" fill="white" fillOpacity=".85"/>
      <path d="M16.5 5.5l1.2 1.3 2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  agences: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="13" rx="2" fill="white" fillOpacity=".9"/>
      <path d="M7 8V6a5 5 0 0110 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="3" y1="14" x2="21" y2="14" stroke="white" strokeWidth="1.3" strokeOpacity=".35"/>
      <circle cx="9"  cy="11" r="1.5" fill="white" fillOpacity=".6"/>
      <circle cx="15" cy="11" r="1.5" fill="white" fillOpacity=".6"/>
      <path d="M9 17c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  productivite: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fillOpacity=".9"/>
      <circle cx="7.5" cy="8.5"  r="1.8" fill="white" fillOpacity=".5"/>
      <circle cx="7.5" cy="13.5" r="1.8" fill="white" fillOpacity=".5"/>
      <circle cx="7.5" cy="18.5" r="1.8" fill="white" fillOpacity=".25"/>
      <path d="M6.2 8.3l1 1.2 2-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.2 13.3l1 1.2 2-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="11" y="7.5"  width="8" height="1.5" rx=".75" fill="white" fillOpacity=".4"/>
      <rect x="11" y="12.5" width="8" height="1.5" rx=".75" fill="white" fillOpacity=".4"/>
      <rect x="11" y="17.5" width="5" height="1.5" rx=".75" fill="white" fillOpacity=".25"/>
    </svg>
  ),

  planning: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="18" rx="2.5" fill="white" fillOpacity=".9"/>
      <rect x="2" y="4" width="20" height="6"  rx="2.5" fill="white" fillOpacity=".5"/>
      <rect x="2" y="8" width="20" height="2"  fill="white" fillOpacity=".5"/>
      <line x1="8"  y1="2" x2="8"  y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8"  cy="14" r="2" fill="white" fillOpacity=".5"/>
      <circle cx="12" cy="14" r="2" fill="white" fillOpacity=".5"/>
      <circle cx="16" cy="14" r="2" fill="white" fillOpacity=".9"/>
      <circle cx="8"  cy="19" r="2" fill="white" fillOpacity=".5"/>
      <circle cx="12" cy="19" r="2" fill="white" fillOpacity=".5"/>
    </svg>
  ),

  equipe: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6"  r="3.5" fill="white" fillOpacity=".9"/>
      <circle cx="4.5" cy="8" r="2.8" fill="white" fillOpacity=".7"/>
      <circle cx="19.5" cy="8" r="2.8" fill="white" fillOpacity=".7"/>
      <path d="M5 20c0-3.3 3-6 7-6s7 2.7 7 6" fill="white" fillOpacity=".9"/>
      <path d="M1 20c0-2.5 1.6-4.5 3.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" fillOpacity=".6"/>
      <path d="M23 20c0-2.5-1.6-4.5-3.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" fillOpacity=".6"/>
    </svg>
  ),

  espaces: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="12" r="3.5" fill="white" fillOpacity=".5"/>
      <rect x="10.5" y="12" width="3" height="4" rx="1" fill="white" fillOpacity=".8"/>
      <circle cx="12" cy="12" r="1" fill="white" fillOpacity=".9"/>
    </svg>
  ),

  chrono: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8.5" fill="white" fillOpacity=".9"/>
      <path d="M9 2h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="12" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="13" r="8.5" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity=".3"/>
      <line x1="12" y1="8"  x2="12" y2="13" stroke="currentColor" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="12" y1="13" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  ),

  "rendez-vous": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="14" height="14" rx="2.5" fill="white" fillOpacity=".9"/>
      <rect x="2" y="4" width="14" height="5" rx="2.5" fill="white" fillOpacity=".5"/>
      <rect x="2" y="7.5" width="14" height="1.5" fill="white" fillOpacity=".5"/>
      <line x1="6"  y1="2" x2="6"  y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17.5" cy="17.5" r="5.5" fill="white" fillOpacity=".85"/>
      <line x1="17.5" y1="14.5" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17.5" y1="17.5" x2="19.5" y2="18.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),

  "ai-docs": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="13" height="17" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="5.5" y="5.5"  width="8" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="5.5" y="8.2"  width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="5.5" y="11"   width="7" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <path d="M17 7l1 2 2 .5-2 1-.5 2-1-2-2-.5 2-1z" fill="white" fillOpacity=".9"/>
      <path d="M15 15l.6 1.3L17 17l-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="white" fillOpacity=".7"/>
    </svg>
  ),

  checklists: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="white" fillOpacity=".9"/>
      <path d="M9 2a1 1 0 100 2h6a1 1 0 000-2H9z" fill="white" fillOpacity=".5"/>
      <rect x="4" y="2" width="16" height="2" rx="1" fill="white" fillOpacity=".4"/>
      <circle cx="8"  cy="8"  r="1.5" fill="white" fillOpacity=".5"/>
      <circle cx="8"  cy="13" r="1.5" fill="white" fillOpacity=".5"/>
      <circle cx="8"  cy="18" r="1.5" fill="white" fillOpacity=".5"/>
      <path d="M6.8 7.8l1 1.2 1.8-2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.8 12.8l1 1.2 1.8-2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="11" y="7.2"  width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="11" y="12.2" width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="11" y="17.2" width="4" height="1.3" rx=".65" fill="white" fillOpacity=".25"/>
    </svg>
  ),

  scanner: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="12" height="15" rx="1.5" fill="white" fillOpacity=".8"/>
      <rect x="6" y="6"  width="8" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="6" y="8.5" width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="6" y="11" width="7" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="2" y="13" width="20" height="2.5" rx="1.25" fill="white" fillOpacity=".9"/>
      <line x1="6"  y1="14.25" x2="18" y2="14.25" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
      <circle cx="4"  cy="14.25" r="1.25" fill="white" fillOpacity=".6"/>
      <circle cx="20" cy="14.25" r="1.25" fill="white" fillOpacity=".6"/>
    </svg>
  ),

  mindmap: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="3"  r="2.2" fill="white" fillOpacity=".7"/>
      <circle cx="12" cy="21" r="2.2" fill="white" fillOpacity=".7"/>
      <circle cx="3"  cy="12" r="2.2" fill="white" fillOpacity=".7"/>
      <circle cx="21" cy="12" r="2.2" fill="white" fillOpacity=".7"/>
      <circle cx="4.9" cy="4.9"   r="1.8" fill="white" fillOpacity=".6"/>
      <circle cx="19.1" cy="4.9"  r="1.8" fill="white" fillOpacity=".6"/>
      <line x1="12" y1="8.5"  x2="12" y2="5.2"  stroke="white" strokeWidth="1.4" strokeOpacity=".6"/>
      <line x1="12" y1="15.5" x2="12" y2="18.8" stroke="white" strokeWidth="1.4" strokeOpacity=".6"/>
      <line x1="8.5" y1="12"  x2="5.2" y2="12"  stroke="white" strokeWidth="1.4" strokeOpacity=".6"/>
      <line x1="15.5" y1="12" x2="18.8" y2="12" stroke="white" strokeWidth="1.4" strokeOpacity=".6"/>
      <line x1="9.5" y1="9.5"   x2="6.6" y2="6.6"   stroke="white" strokeWidth="1.2" strokeOpacity=".5"/>
      <line x1="14.5" y1="9.5"  x2="17.4" y2="6.6"  stroke="white" strokeWidth="1.2" strokeOpacity=".5"/>
    </svg>
  ),

  "bloc-notes": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="15" height="17" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="5" y="4" width="15" height="4" rx="2" fill="white" fillOpacity=".5"/>
      <circle cx="8"  cy="6" r="1.5" fill="white" fillOpacity=".8"/>
      <circle cx="12" cy="6" r="1.5" fill="white" fillOpacity=".8"/>
      <circle cx="16" cy="6" r="1.5" fill="white" fillOpacity=".8"/>
      <rect x="7.5" y="11" width="9"   height="1.3" rx=".65" fill="white" fillOpacity=".5"/>
      <rect x="7.5" y="14" width="7"   height="1.3" rx=".65" fill="white" fillOpacity=".5"/>
      <rect x="7.5" y="17" width="5.5" height="1.3" rx=".65" fill="white" fillOpacity=".35"/>
    </svg>
  ),

  signature: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 18c2-6 4-8 5-8s2 4 3 4 2-5 3-7 3-5 4-3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="3" y1="21" x2="21" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".5"/>
      <circle cx="20" cy="6" r="3" fill="white" fillOpacity=".8"/>
      <path d="M19 5.5l.8.9 1.5-1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  sourcing: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="7" fill="white" fillOpacity=".9"/>
      <circle cx="8"  cy="8"  r="1.5" fill="white" fillOpacity=".4"/>
      <circle cx="12" cy="8"  r="1.5" fill="white" fillOpacity=".4"/>
      <circle cx="10" cy="12" r="1.5" fill="white" fillOpacity=".4"/>
      <line x1="8"  y1="8"  x2="12" y2="8"  stroke="white" strokeWidth="1" strokeOpacity=".5"/>
      <line x1="8"  y1="8"  x2="10" y2="12" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
      <line x1="12" y1="8"  x2="10" y2="12" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  assistant: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16a1 1 0 011 1v9a1 1 0 01-1 1H8l-5 4V5a1 1 0 011-1z" fill="white" fillOpacity=".9"/>
      <circle cx="8"  cy="9.5" r="1.3" fill="white" fillOpacity=".5"/>
      <circle cx="12" cy="9.5" r="1.3" fill="white" fillOpacity=".5"/>
      <circle cx="16" cy="9.5" r="1.3" fill="white" fillOpacity=".5"/>
      <path d="M19 2l.8 1.6 1.7.6-1.7.6L19 6.5l-.8-1.7-1.7-.6 1.7-.6z" fill="white" fillOpacity=".8"/>
    </svg>
  ),

  projets: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 7h7l2-3h11v17H2z" fill="white" fillOpacity=".9"/>
      <path d="M2 7h7l2-3h11v5H2z" fill="white" fillOpacity=".5"/>
      <rect x="5"  y="12" width="12" height="2" rx="1" fill="white" fillOpacity=".6"/>
      <rect x="5"  y="16" width="8"  height="2" rx="1" fill="white" fillOpacity=".5"/>
      <rect x="5"  y="12" width="7"  height="2" rx="1" fill="white" fillOpacity=".8"/>
      <rect x="5"  y="16" width="4"  height="2" rx="1" fill="white" fillOpacity=".7"/>
    </svg>
  ),

  "reseaux-sociaux": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5"  r="3.5" fill="white" fillOpacity=".9"/>
      <circle cx="6"  cy="12" r="3.5" fill="white" fillOpacity=".9"/>
      <circle cx="18" cy="19" r="3.5" fill="white" fillOpacity=".9"/>
      <line x1="9.3"  y1="10.5" x2="14.7" y2="6.5"  stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="9.3"  y1="13.5" x2="14.7" y2="17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  "coaching-ia": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10C4 5.6 7.6 2 12 2s8 3.6 8 8c0 2.8-1.4 5.3-3.5 6.8V19H7.5v-2.2C5.4 15.3 4 12.8 4 10z" fill="white" fillOpacity=".9"/>
      <line x1="8" y1="21" x2="16" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="9" y1="23" x2="15" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9.5"  cy="10" r="1.2" fill="white" fillOpacity=".5"/>
      <circle cx="14.5" cy="10" r="1.2" fill="white" fillOpacity=".5"/>
      <path d="M10 13.5c.5.8 1.5 1 2 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M10 7l.5-2 1.5 1 1.5-1 .5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" fillOpacity=".6"/>
    </svg>
  ),

  chatbot: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="13" rx="3" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="4" r="2" fill="white" fillOpacity=".8"/>
      <line x1="12" y1="6" x2="12" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8.5"  cy="13" r="2" fill="white" fillOpacity=".5"/>
      <circle cx="15.5" cy="13" r="2" fill="white" fillOpacity=".5"/>
      <circle cx="8.5"  cy="13" r=".8" fill="white" fillOpacity=".9"/>
      <circle cx="15.5" cy="13" r=".8" fill="white" fillOpacity=".9"/>
      <rect x="8.5" y="16.5" width="7" height="1.5" rx=".75" fill="white" fillOpacity=".5"/>
    </svg>
  ),

  analytics: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="white" fillOpacity=".6"/>
      <rect x="10" y="8"  width="4" height="13" rx="1" fill="white" fillOpacity=".8"/>
      <rect x="17" y="4"  width="4" height="17" rx="1" fill="white" fillOpacity=".95"/>
      <path d="M4 11L10 7l7-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="4" r="2" fill="white"/>
    </svg>
  ),

  portail: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 22V8l8-6 8 6v14z" fill="white" fillOpacity=".9"/>
      <path d="M4 22V8l8-6 8 6v5H4z" fill="white" fillOpacity=".4"/>
      <rect x="9" y="13" width="6" height="9" fill="white" fillOpacity=".5"/>
      <circle cx="11.2" cy="17.5" r=".8" fill="white" fillOpacity=".8"/>
      <circle cx="17.5" cy="10" r="4" fill="white" fillOpacity=".85"/>
      <path d="M17.5 8v2.5l1.5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  paie: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="12" height="16" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="5" y="7"  width="8" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="5" y="10" width="6" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <circle cx="17" cy="7"  r="4"   fill="white" fillOpacity=".8"/>
      <circle cx="17" cy="16" r="5.5" fill="white" fillOpacity=".85"/>
      <line x1="15.2" y1="16" x2="18.8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15.2" y1="17.5" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M18.5 14.5c-.4-.7-1.2-1-2-1-1.1 0-2 .9-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  reputation: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.7l-6.2 3.4 1.2-6.9-5-4.9 6.9-1z" fill="white" fillOpacity=".9"/>
      <path d="M12 5.5l2 4 4.3.6-3.1 3 .7 4.3L12 15l-3.9 2.4.7-4.3-3.1-3L10 9.5z" fill="white" fillOpacity=".5"/>
    </svg>
  ),

  blog: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="5.5" y="7"  width="13" height="1.5" rx=".75" fill="white" fillOpacity=".5"/>
      <rect x="5.5" y="10" width="13" height="1.5" rx=".75" fill="white" fillOpacity=".5"/>
      <rect x="5.5" y="13" width="9"  height="1.5" rx=".75" fill="white" fillOpacity=".5"/>
      <circle cx="17" cy="17" r="4.5" fill="white" fillOpacity=".85"/>
      <path d="M15 17l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  temoignages: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16a1 1 0 011 1v9a1 1 0 01-1 1H8l-5 4V5a1 1 0 011-1z" fill="white" fillOpacity=".9"/>
      <path d="M8.5 8.5c0-1 .9-1.5 1.5-1.5s1.5.5 1.5 1.5c0 1.5-1.5 2.5-1.5 2.5s-1.5-1-1.5-2.5z" fill="white" fillOpacity=".5"/>
      <path d="M13 8.5c0-1 .9-1.5 1.5-1.5s1.5.5 1.5 1.5c0 1.5-1.5 2.5-1.5 2.5s-1.5-1-1.5-2.5z" fill="white" fillOpacity=".5"/>
    </svg>
  ),

  planification: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="white" fillOpacity=".25"/>
      <circle cx="12" cy="12" r="7"  fill="white" fillOpacity=".4"/>
      <circle cx="12" cy="12" r="4"  fill="white" fillOpacity=".6"/>
      <circle cx="12" cy="12" r="1.8" fill="white" fillOpacity=".95"/>
      <path d="M12 2l3 7-3-1-3 1z" fill="white" fillOpacity=".8"/>
    </svg>
  ),

  "carte-visite": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2.5" fill="white" fillOpacity=".9"/>
      <circle cx="8" cy="11" r="3" fill="white" fillOpacity=".5"/>
      <circle cx="8" cy="11" r="1.5" fill="white" fillOpacity=".8"/>
      <rect x="13" y="8.5" width="6"   height="1.3" rx=".65" fill="white" fillOpacity=".5"/>
      <rect x="13" y="11" width="4.5" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="2" y="15.5" width="20" height="1.5" rx="1" fill="white" fillOpacity=".25"/>
    </svg>
  ),

  "site-web": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="17" rx="2.5" fill="white" fillOpacity=".9"/>
      <rect x="2" y="3" width="20" height="4.5" rx="2.5" fill="white" fillOpacity=".5"/>
      <rect x="2" y="6" width="20" height="1.5" fill="white" fillOpacity=".5"/>
      <circle cx="5"  cy="5.25" r="1" fill="white" fillOpacity=".8"/>
      <circle cx="8"  cy="5.25" r="1" fill="white" fillOpacity=".8"/>
      <circle cx="11" cy="5.25" r="1" fill="white" fillOpacity=".8"/>
      <circle cx="12" cy="14.5" r="4.5" fill="white" fillOpacity=".5" stroke="white" strokeWidth="1"/>
      <ellipse cx="12" cy="14.5" rx="2" ry="4.5" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1"/>
      <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" stroke="white" strokeWidth="1" strokeOpacity=".6"/>
    </svg>
  ),

  "mes-sites": ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="17" height="13" rx="2" fill="white" fillOpacity=".9"/>
      <rect x="4" y="6" width="17" height="3.5" rx="2" fill="white" fillOpacity=".5"/>
      <rect x="4" y="8.5" width="17" height="1" fill="white" fillOpacity=".5"/>
      <circle cx="6.5"  cy="7.75" r=".8" fill="white" fillOpacity=".8"/>
      <circle cx="8.8"  cy="7.75" r=".8" fill="white" fillOpacity=".8"/>
      <rect x="2"  y="4" width="17" height="2.5" rx="1.5" fill="white" fillOpacity=".5"/>
      <rect x="2"  y="3" width="17" height="1.5" rx="1" fill="white" fillOpacity=".3"/>
      <rect x="6.5" y="11.5" width="11" height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
      <rect x="6.5" y="14"   width="8"  height="1.3" rx=".65" fill="white" fillOpacity=".4"/>
    </svg>
  ),

  // fallback
  default: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="12" r="4" fill="white" fillOpacity=".5"/>
    </svg>
  ),
};

// Color map per app id (from APPS_DATA)
export const APP_COLORS: Record<string, string> = {
  factures:          "#2563eb",
  depenses:          "#ea580c",
  tresorerie:        "#059669",
  comptabilite:      "#0891b2",
  banque:            "#0369a1",
  declarations:      "#7c3aed",
  caisse:            "#0d9488",
  paiements:         "#7c3aed",
  crm:               "#7c3aed",
  contrats:          "#b45309",
  fournisseurs:      "#166534",
  stocks:            "#0d9488",
  productivite:      "#be185d",
  planning:          "#4f46e5",
  equipe:            "#0891b2",
  espaces:           "#0f766e",
  chrono:            "#7c3aed",
  "rendez-vous":     "#0891b2",
  "ai-docs":         "#6d28d9",
  checklists:        "#10b981",
  scanner:           "#0ea5e9",
  mindmap:           "#8b5cf6",
  "bloc-notes":      "#92400e",
  signature:         "#059669",
  sourcing:          "#6d28d9",
  assistant:         "#0369a1",
  projets:           "#d97706",
  "reseaux-sociaux": "#e1306c",
  "coaching-ia":     "#9d174d",
  chatbot:           "#8b5cf6",
  analytics:         "#8b5cf6",
  portail:           "#3b82f6",
  paie:              "#10b981",
  reputation:        "#b91c1c",
  blog:              "#0369a1",
  temoignages:       "#9a3412",
  planification:     "#075985",
  "carte-visite":    "#0891b2",
  "site-web":        "#7c3aed",
  "mes-sites":       "#059669",
  agences:           "#6d28d9",
  marketplace:       "#0891b2",
  boutique:          "#ec4899",
  "email-marketing": "#e1306c",
  dashboard:         "#1d4ed8",
};
