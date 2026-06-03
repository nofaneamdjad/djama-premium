/**
 * AppIcons — bibliothèque d'icônes SVG partagées (style iOS app icon).
 * Utilisé dans : client/page.tsx  ·  client/dashboard/page.tsx
 */

import React from "react";

export const APP_ICONS: Record<string, React.ReactElement> = {
  "/client/factures": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai0" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#1d4ed8"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai0)"/>
      <rect x="12" y="9" width="18" height="24" rx="3" fill="white" opacity="0.2"/>
      <rect x="12" y="9" width="18" height="24" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="16" y="16" width="10" height="1.8" rx="0.9" fill="white"/>
      <rect x="16" y="20" width="7"  height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <rect x="16" y="24" width="8.5" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <circle cx="33" cy="33" r="8" fill="#22c55e"/>
      <path d="M29.5 33.5L32 36L36.5 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/depenses": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#dc2626"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai1)"/>
      <rect x="8" y="16" width="32" height="20" rx="4" fill="white" opacity="0.2"/>
      <rect x="8" y="16" width="32" height="20" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="8" y="21" width="32" height="4" fill="white" opacity="0.3"/>
      <rect x="12" y="28" width="8" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <path d="M34 10L34 20M30 14L34 10L38 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/tresorerie": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399"/><stop offset="1" stopColor="#059669"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai2)"/>
      <rect x="9"  y="26" width="6" height="10" rx="2" fill="white" opacity="0.9"/>
      <rect x="19" y="22" width="6" height="14" rx="2" fill="white" opacity="0.9"/>
      <rect x="29" y="18" width="6" height="18" rx="2" fill="white" opacity="0.9"/>
      <path d="M12 28L22 22L32 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="32" cy="17" r="2.5" fill="white"/>
    </svg>
  ),
  "/client/crm": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai3)"/>
      <circle cx="24" cy="16" r="7" fill="white" opacity="0.25"/>
      <circle cx="24" cy="16" r="5" fill="white" opacity="0.7"/>
      <path d="M10 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M10 36c0-7.732 6.268-10 14-10s14 2.268 14 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
    </svg>
  ),
  "/client/contrats": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#b45309"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai4)"/>
      <rect x="11" y="8" width="22" height="28" rx="3" fill="white" opacity="0.2"/>
      <rect x="11" y="8" width="22" height="28" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="15" y="15" width="14" height="1.8" rx="0.9" fill="white"/>
      <rect x="15" y="20" width="10" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="15" y="25" width="12" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <path d="M15 31 Q18 28 21 31 Q24 34 27 31" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
    </svg>
  ),
  "/client/fournisseurs": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai5" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4ade80"/><stop offset="1" stopColor="#166534"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai5)"/>
      <rect x="6" y="19" width="22" height="14" rx="3" fill="white" opacity="0.25"/>
      <rect x="6" y="19" width="22" height="14" rx="3" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <path d="M28 24L38 24L42 31L42 33L28 33Z" fill="white" opacity="0.25"/>
      <path d="M28 24L38 24L42 31L42 33L28 33Z" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="14" cy="35" r="3.5" fill="white"/>
      <circle cx="35" cy="35" r="3.5" fill="white"/>
    </svg>
  ),
  "/client/stocks": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai6" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0d9488"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai6)"/>
      <rect x="14" y="27" width="20" height="12" rx="2.5" fill="white" opacity="0.25"/>
      <rect x="14" y="27" width="20" height="12" rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <rect x="16" y="17" width="16" height="11" rx="2.5" fill="white" opacity="0.35"/>
      <rect x="16" y="17" width="16" height="11" rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <rect x="18" y="9"  width="12" height="9"  rx="2.5" fill="white" opacity="0.55"/>
      <rect x="18" y="9"  width="12" height="9"  rx="2.5" stroke="white" strokeWidth="1.5" opacity="0.8"/>
    </svg>
  ),
  "/client/productivite": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai7" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f472b6"/><stop offset="1" stopColor="#be185d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai7)"/>
      <rect x="10" y="13" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="13" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="15" cy="16" r="2.5" fill="white" opacity="0.8"/>
      <rect x="10" y="23" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="23" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <rect x="10" y="33" width="28" height="6" rx="3" fill="white" opacity="0.2"/>
      <rect x="10" y="33" width="28" height="6" rx="3" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <path d="M13 26.5L15 28.5L19 24.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 36.5L15 38.5L19 34.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/client/planning": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai8" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#4f46e5"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai8)"/>
      <rect x="9" y="14" width="30" height="26" rx="4" fill="white" opacity="0.2"/>
      <rect x="9" y="14" width="30" height="26" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="9" y="14" width="30" height="9" rx="4" fill="white" opacity="0.3"/>
      <rect x="16" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <rect x="29" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <circle cx="20" cy="31" r="3" fill="white" opacity="0.9"/>
      <rect x="26" y="29" width="8" height="2" rx="1" fill="white" opacity="0.6"/>
      <rect x="26" y="33" width="5" height="2" rx="1" fill="white" opacity="0.4"/>
    </svg>
  ),
  "/client/planification": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai8b" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0284c7"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai8b)"/>
      <rect x="9" y="14" width="30" height="26" rx="4" fill="white" opacity="0.2"/>
      <rect x="9" y="14" width="30" height="26" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="9" y="14" width="30" height="9" rx="4" fill="white" opacity="0.3"/>
      <rect x="16" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <rect x="29" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.8"/>
      <path d="M14 30h6M26 30h8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M14 35h4M22 35h12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <circle cx="21" cy="30" r="2" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/equipe": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai9" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0891b2"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai9)"/>
      <circle cx="17" cy="18" r="5.5" fill="white" opacity="0.6"/>
      <circle cx="31" cy="18" r="5.5" fill="white" opacity="0.6"/>
      <path d="M5 36c0-6.627 5.373-10 12-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M43 36c0-6.627-5.373-10-12-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <circle cx="24" cy="20" r="6" fill="white" opacity="0.9"/>
      <path d="M12 38c0-6.627 5.373-10 12-10s12 3.373 12 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),
  "/client/chrono": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai10" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c084fc"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai10)"/>
      <circle cx="24" cy="27" r="13" fill="white" opacity="0.18"/>
      <circle cx="24" cy="27" r="13" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <line x1="24" y1="27" x2="24" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="27" x2="29" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="27" r="2" fill="white"/>
      <rect x="21" y="9" width="6" height="3" rx="1.5" fill="white" opacity="0.8"/>
      <path d="M34 13L37 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/notes": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai11" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fde047"/><stop offset="1" stopColor="#d97706"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai11)"/>
      <rect x="11" y="10" width="22" height="28" rx="3" fill="white" opacity="0.25"/>
      <rect x="11" y="10" width="22" height="28" rx="3" stroke="white" strokeWidth="1.5" opacity="0.55"/>
      <rect x="11" y="10" width="4"  height="28" rx="3" fill="white" opacity="0.3"/>
      <rect x="17" y="17" width="12" height="1.8" rx="0.9" fill="white"/>
      <rect x="17" y="22" width="9"  height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="17" y="27" width="10.5" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <path d="M35 10L38 7L41 10L38 13Z" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/bloc-note": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai12" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fb7185"/><stop offset="1" stopColor="#9d174d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai12)"/>
      <rect x="19" y="9" width="10" height="18" rx="5" fill="white" opacity="0.25"/>
      <rect x="19" y="9" width="10" height="18" rx="5" stroke="white" strokeWidth="1.5" opacity="0.65"/>
      <path d="M14 24c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <line x1="24" y1="34" x2="24" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <line x1="18" y1="40" x2="30" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/sourcing": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai13" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai13)"/>
      <circle cx="21" cy="21" r="10" fill="white" opacity="0.18"/>
      <circle cx="21" cy="21" r="10" stroke="white" strokeWidth="2" opacity="0.6"/>
      <line x1="28" y1="28" x2="38" y2="38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M18 17L21 14L24 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <path d="M21 14L21 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M17 22L25 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/assistant": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai14" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai14)"/>
      <path d="M26 8L20 24H27L22 40L36 20H28L34 8Z" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/reputation": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai15" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f87171"/><stop offset="1" stopColor="#b91c1c"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai15)"/>
      <path d="M24 9L27.5 19.5H38.5L30 26L33 37L24 30.5L15 37L18 26L9.5 19.5H20.5Z" fill="white" opacity="0.9"/>
    </svg>
  ),
  "/client/reseaux-sociaux": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai17" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1306c"/><stop offset="1" stopColor="#833ab4"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai17)"/>
      <rect x="14" y="8" width="20" height="32" rx="4" fill="white" opacity="0.92"/>
      <rect x="17" y="14" width="7" height="7" rx="2" fill="#e1306c" opacity="0.55"/>
      <rect x="26" y="14" width="5" height="7" rx="2" fill="#833ab4" opacity="0.55"/>
      <rect x="17" y="23" width="5" height="7" rx="2" fill="#833ab4" opacity="0.55"/>
      <rect x="24" y="23" width="7" height="7" rx="2" fill="#e1306c" opacity="0.55"/>
    </svg>
  ),
  "/coaching-ia/espace": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai16" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9a8d4"/><stop offset="1" stopColor="#9d174d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai16)"/>
      <circle cx="24" cy="18" r="9" fill="white" opacity="0.2"/>
      <circle cx="24" cy="18" r="9" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <path d="M20 15Q20 11 24 11Q28 11 28 15Q28 18 25 19L25 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85"/>
      <circle cx="25" cy="24.5" r="1.2" fill="white" opacity="0.85"/>
      <path d="M12 38Q12 30 24 30Q36 30 36 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  "/client/portail": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai18" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai18)"/>
      <rect x="11" y="16" width="26" height="22" rx="3" fill="white" opacity="0.18"/>
      <rect x="11" y="16" width="26" height="22" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <path d="M8 18L24 8L40 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
      <rect x="20" y="27" width="8" height="11" rx="2" fill="white" opacity="0.85"/>
      <rect x="14" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
      <rect x="28" y="21" width="6" height="5" rx="1.5" fill="white" opacity="0.6"/>
    </svg>
  ),
  "/client/paie": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai19" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#34d399"/><stop offset="1" stopColor="#065f46"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai19)"/>
      <rect x="7" y="14" width="34" height="22" rx="4" fill="white" opacity="0.18"/>
      <rect x="7" y="14" width="34" height="22" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="7" y="19" width="34" height="6" fill="white" opacity="0.12"/>
      <text x="18" y="32" fontSize="14" fontWeight="bold" fill="white" opacity="0.9" fontFamily="Arial">€</text>
      <circle cx="34" cy="30" r="3" fill="white" opacity="0.8"/>
      <rect x="9" y="28" width="4" height="5" rx="1" fill="white" opacity="0.7"/>
      <rect x="14" y="25" width="4" height="8" rx="1" fill="white" opacity="0.7"/>
    </svg>
  ),
  "/client/bloc-notes": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="ai12b" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fb7185"/><stop offset="1" stopColor="#9d174d"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#ai12b)"/>
      <rect x="19" y="9" width="10" height="18" rx="5" fill="white" opacity="0.25"/>
      <rect x="19" y="9" width="10" height="18" rx="5" stroke="white" strokeWidth="1.5" opacity="0.65"/>
      <path d="M14 24c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <line x1="24" y1="34" x2="24" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <line x1="18" y1="40" x2="30" y2="40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  /* ── Quick actions ── */
  "qa/devis": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa0" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#0ea5e9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa0)"/>
      <rect x="12" y="8" width="18" height="24" rx="3" fill="white" opacity="0.18"/>
      <rect x="12" y="8" width="18" height="24" rx="3" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="16" y="15" width="10" height="1.8" rx="0.9" fill="white"/>
      <rect x="16" y="19" width="7"  height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <rect x="16" y="23" width="8.5" height="1.5" rx="0.75" fill="white" opacity="0.65"/>
      <path d="M27 37L35 29L38.5 32.5L30.5 40.5L27 40.5Z" fill="white" opacity="0.9"/>
      <path d="M33 31L36.5 34.5" stroke="rgba(99,102,241,0.4)" strokeWidth="1.2"/>
    </svg>
  ),
  "qa/contact": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa1)"/>
      <circle cx="24" cy="16" r="7.5" fill="white" opacity="0.22"/>
      <circle cx="24" cy="16" r="5.5" fill="white" opacity="0.75"/>
      <path d="M10 38C10 29.163 16.268 24 24 24C31.732 24 38 29.163 38 38" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.88"/>
      <circle cx="35" cy="34" r="6" fill="white"/>
      <path d="M32.5 34L34.5 36L38 32" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "qa/note": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#b45309"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa2)"/>
      <rect x="10" y="9" width="24" height="30" rx="4" fill="white" opacity="0.18"/>
      <rect x="10" y="9" width="24" height="30" rx="4" stroke="white" strokeWidth="1.5" opacity="0.5"/>
      <rect x="10" y="9" width="5"  height="30" rx="4" fill="white" opacity="0.22"/>
      <rect x="17" y="16" width="13" height="2" rx="1" fill="white"/>
      <rect x="17" y="21" width="9.5" height="1.6" rx="0.8" fill="white" opacity="0.7"/>
      <rect x="17" y="26" width="11"  height="1.6" rx="0.8" fill="white" opacity="0.7"/>
      <circle cx="36" cy="36" r="7" fill="white"/>
      <path d="M33 36L35.5 38.5L39 34" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "qa/timer": (
    <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
      <defs><linearGradient id="qa3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0891b2"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#qa3)"/>
      <circle cx="24" cy="28" r="14" fill="white" opacity="0.12"/>
      <circle cx="24" cy="28" r="14" stroke="white" strokeWidth="1.8" opacity="0.45"/>
      <circle cx="24" cy="28" r="2.5" fill="white"/>
      <line x1="24" y1="28" x2="24" y2="19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="24" y1="28" x2="30" y2="32" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="20" y="9" width="8" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
      <path d="M36 12L39.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <path d="M12 12L8.5 9"  stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    </svg>
  ),
};


/** Icône app-style 52×52 avec verrouillage optionnel */
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
      className="shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        opacity: locked ? 0.5 : 1,
      }}
    >
      {icon}
    </div>
  );
}
