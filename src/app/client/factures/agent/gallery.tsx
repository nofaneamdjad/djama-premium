"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Search, CheckCircle, Play, Globe, Mic, Settings2, X, ChevronDown } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const GOLD  = "#FFB900";
const NOIR  = "#0a0a12";

/* ─── Portrait engine ────────────────────────────────────────── */

type HairStyle = "long" | "bun" | "hijab" | "curly" | "afro" | "short" | "beard" | "slick";

interface PC {
  bg1: string; bg2: string;
  s1: string; s2: string; s3: string;
  h: string; hs: HairStyle;
  hj1?: string; hj2?: string;
  e: string; l: string;
  c1: string; c2: string;
}

const PORTRAITS: Record<string, PC> = {
  F1: { bg1:"#dde4f0",bg2:"#b8c4dc", s1:"#d4906a",s2:"#b06040",s3:"#854025", h:"#0d0808",hs:"long",  e:"#2a1808",l:"#9c5535", c1:"#1a2b4a",c2:"#e8e8f0" },
  F2: { bg1:"#d4e8e4",bg2:"#a4c4bc", s1:"#c8845e",s2:"#a06040",s3:"#784025", h:"#0d0a08",hs:"hijab",hj1:"#2d5a7a",hj2:"#1a3a52", e:"#1a2820",l:"#8a4530", c1:"#1e3040",c2:"#e8f0f0" },
  F3: { bg1:"#f0e4d8",bg2:"#d4c0a8", s1:"#f0c8a0",s2:"#d8a060",s3:"#b87030", h:"#1a0c06",hs:"bun",  e:"#201408",l:"#b07040", c1:"#6a1a28",c2:"#f4ece4" },
  F4: { bg1:"#e8e4f4",bg2:"#c8bce0", s1:"#5a3220",s2:"#3a1c08",s3:"#241008", h:"#080408",hs:"afro",  e:"#180c08",l:"#6a3828", c1:"#2a2050",c2:"#f4f0fc" },
  M1: { bg1:"#e4e8f4",bg2:"#c0c8dc", s1:"#f0c880",s2:"#d09848",s3:"#b07820", h:"#080808",hs:"short", e:"#181410",l:"#905840", c1:"#1a1a2a",c2:"#e8e8e8" },
  M2: { bg1:"#dce8e4",bg2:"#b4c8c0", s1:"#7a5030",s2:"#5a3010",s3:"#401808", h:"#0a0808",hs:"beard", e:"#1a1010",l:"#6a3820", c1:"#1a3028",c2:"#f0f4f0" },
  M3: { bg1:"#f0ece4",bg2:"#d4ccc0", s1:"#d8906a",s2:"#b06040",s3:"#844025", h:"#080808",hs:"slick", e:"#1a1818",l:"#8a4530", c1:"#484030",c2:"#f4f0e4" },
  M4: { bg1:"#dce8f0",bg2:"#b0c4d8", s1:"#e8b87a",s2:"#c08848",s3:"#906020", h:"#181010",hs:"short", e:"#1a2030",l:"#905840", c1:"#1a3050",c2:"#f0f4fc" },
};

export function Portrait({ type, size = 160, responsive = false }: { type: string; size?: number; responsive?: boolean }) {
  const c = PORTRAITS[type];
  if (!c) return <div style={responsive ? { width: "100%", aspectRatio: "5/6", background: "#e0e4e8" } : { width: size, height: Math.round(size * 1.2), background: "#e0e4e8", borderRadius: 8 }} />;

  const h2 = Math.round(size * 1.2);
  const iid = type;
  const fy = 88; // face center Y
  const frx = type.startsWith("F") ? 36 : 38;
  const fry = type.startsWith("F") ? 40 : 42;

  const Hair = () => {
    if (c.hs === "long") return (
      <>
        <path d={`M44,82 Q40,106 42,130 Q46,140 54,142 Q48,118 48,100Z`} fill={c.h} />
        <path d={`M116,82 Q120,106 118,130 Q114,140 106,142 Q112,118 112,100Z`} fill={c.h} />
        <path d={`M44,82 Q44,54 80,50 Q116,54 116,82 Q110,66 80,62 Q50,66 44,82Z`} fill={c.h} />
      </>
    );
    if (c.hs === "bun") return (
      <>
        <path d={`M44,82 Q44,54 80,50 Q116,54 116,82 Q110,66 80,62 Q50,66 44,82Z`} fill={c.h} />
        <ellipse cx="80" cy="50" rx="15" ry="11" fill={c.h} />
      </>
    );
    if (c.hs === "hijab") return (
      <>
        <path d={`M36,92 Q36,52 80,44 Q124,52 124,92 Q118,76 80,72 Q42,76 36,92Z`} fill={c.hj1} />
        <path d={`M36,92 Q32,112 36,132 Q44,150 68,154 L80,150 L92,154 Q116,150 124,132 Q128,112 124,92 Q120,112 100,122 Q80,126 60,122 Q40,112 36,92Z`} fill={c.hj1} />
        <path d={`M36,92 Q38,80 50,74 Q36,78 36,92Z`} fill={c.hj2} />
        <path d={`M124,92 Q122,80 110,74 Q124,78 124,92Z`} fill={c.hj2} />
      </>
    );
    if (c.hs === "curly") return (
      <>
        <ellipse cx="80" cy="62" rx="40" ry="30" fill={c.h} />
        <path d="M40,86 Q38,100 42,116 Q44,124 50,126 Q44,112 44,98Z" fill={c.h} />
        <path d="M120,86 Q122,100 118,116 Q116,124 110,126 Q116,112 116,98Z" fill={c.h} />
        <path d={`M40,88 Q40,60 80,46 Q120,60 120,88 Q108,72 80,68 Q52,72 40,88Z`} fill={c.h} />
      </>
    );
    if (c.hs === "afro") return (
      <>
        <ellipse cx="80" cy="68" rx="46" ry="38" fill={c.h} />
        <path d={`M34,88 Q34,64 80,44 Q126,64 126,88 Q114,72 80,68 Q46,72 34,88Z`} fill={c.h} />
      </>
    );
    if (c.hs === "slick") return (
      <path d={`M44,86 Q44,56 80,50 Q116,56 116,86 Q112,68 80,66 Q48,68 44,86Z`} fill={c.h} />
    );
    // short + beard
    return (
      <path d={`M42,90 Q42,56 80,52 Q118,56 118,90 Q112,74 80,70 Q48,74 42,90Z`} fill={c.h} />
    );
  };

  return (
    <svg viewBox="0 0 160 192" width={responsive ? "100%" : size} height={responsive ? undefined : h2} xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`bg${iid}`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </radialGradient>
        <radialGradient id={`sk${iid}`} cx="45%" cy="38%" r="56%">
          <stop offset="0%" stopColor={c.s1} />
          <stop offset="55%" stopColor={c.s2} />
          <stop offset="100%" stopColor={c.s3} />
        </radialGradient>
      </defs>
      <rect width="160" height="192" fill={`url(#bg${iid})`} />
      {/* Clothing */}
      <path d="M10,192 Q22,160 50,148 L65,162 L80,150 L95,162 L110,148 Q138,160 150,192Z" fill={c.c1} />
      <path d="M65,162 L80,150 L95,162 L92,192 L68,192Z" fill={c.c2} />
      {/* Neck */}
      <rect x="71" y="122" width="18" height="28" rx="4" fill={`url(#sk${iid})`} />
      {/* Hair back */}
      <Hair />
      {/* Head */}
      <ellipse cx="80" cy={fy} rx={frx} ry={fry} fill={`url(#sk${iid})`} />
      {/* Ears (hidden under hijab) */}
      {c.hs !== "hijab" && (
        <>
          <ellipse cx="44" cy="92" rx="4" ry="5.5" fill={c.s2} />
          <ellipse cx="116" cy="92" rx="4" ry="5.5" fill={c.s2} />
        </>
      )}
      {/* Eyes */}
      <ellipse cx="66" cy={fy - 2} rx="8.5" ry="5.8" fill="white" />
      <ellipse cx="94" cy={fy - 2} rx="8.5" ry="5.8" fill="white" />
      <circle cx="67" cy={fy - 2} r="4.5" fill={c.e} />
      <circle cx="95" cy={fy - 2} r="4.5" fill={c.e} />
      <circle cx="67" cy={fy - 2} r="2" fill="#000" />
      <circle cx="95" cy={fy - 2} r="2" fill="#000" />
      <circle cx="69" cy={fy - 4} r="1.5" fill="rgba(255,255,255,.75)" />
      <circle cx="97" cy={fy - 4} r="1.5" fill="rgba(255,255,255,.75)" />
      {/* Eyebrows */}
      <path d={`M56,${fy - 13} Q66,${fy - 17} 76,${fy - 13}`} stroke={c.h} strokeWidth={type.startsWith("M") ? 2.8 : 2.2} fill="none" strokeLinecap="round" />
      <path d={`M84,${fy - 13} Q94,${fy - 17} 104,${fy - 13}`} stroke={c.h} strokeWidth={type.startsWith("M") ? 2.8 : 2.2} fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d={`M80,${fy + 10} L77,${fy + 20} Q80,${fy + 23} 83,${fy + 20}Z`} fill="rgba(0,0,0,.07)" />
      {/* Mouth */}
      <path d={`M68,${fy + 30} Q80,${fy + 37} 92,${fy + 30}`} stroke={c.l} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M68,${fy + 30} Q80,${fy + 34} 92,${fy + 30} Q80,${fy + 36} 68,${fy + 30}Z`} fill={`${c.l}44`} />
      {/* Beard */}
      {c.hs === "beard" && (
        <path d={`M55,${fy + 26} Q80,${fy + 42} 105,${fy + 26} Q110,${fy + 42} 80,${fy + 46} Q50,${fy + 42} 55,${fy + 26}Z`} fill={c.h} opacity="0.5" />
      )}
    </svg>
  );
}

/* ─── International assistants data ─────────────────────────── */

export interface AssistantData {
  id: string;
  name: string;
  region: string;
  country: string;
  gender: "f" | "m";
  portrait: string;
  langs: string[];
  voice: string;
  style: string;
  tenue: string;
  accent: string;
}

const REGIONS = [
  { id: "france",        label: "France",       countries: ["France"] },
  { id: "europe",        label: "Europe",       countries: ["Allemagne", "Espagne", "Italie", "Portugal"] },
  { id: "uae",           label: "Émirats arabes", countries: ["Émirats arabes unis"] },
  { id: "arabia",        label: "Arabie saoudite", countries: ["Arabie saoudite"] },
  { id: "maghreb",       label: "Maghreb",      countries: ["Maroc", "Algérie", "Tunisie"] },
  { id: "africa_west",   label: "Afrique de l'Ouest", countries: ["Sénégal", "Côte d'Ivoire", "Mali"] },
  { id: "africa_east",   label: "Afrique de l'Est", countries: ["Madagascar", "Comores", "Maurice"] },
  { id: "americas",      label: "Amériques",    countries: ["États-Unis", "Brésil", "Mexique"] },
  { id: "asia_east",     label: "Asie de l'Est", countries: ["Chine", "Japon", "Corée"] },
  { id: "asia_south",    label: "Asie du Sud",  countries: ["Inde", "Pakistan", "Bangladesh"] },
  { id: "sea",           label: "Asie du Sud-Est", countries: ["Malaisie", "Indonésie", "Singapour"] },
  { id: "other",         label: "International", countries: [] },
];

export const ALL_ASSISTANTS: AssistantData[] = [
  // France
  { id:"emma",      name:"Emma",      region:"france",      country:"France",             gender:"f", portrait:"F3", langs:["FR","EN"],       voice:"Chaleureuse", style:"Professionnel", tenue:"Professionnel", accent:"Paris" },
  { id:"camille",   name:"Camille",   region:"france",      country:"France",             gender:"f", portrait:"F4", langs:["FR","EN","ES"],   voice:"Calme",       style:"Direct",        tenue:"Professionnel", accent:"Paris" },
  { id:"thomas",    name:"Thomas",    region:"france",      country:"France",             gender:"m", portrait:"M4", langs:["FR","EN"],        voice:"Direct",      style:"Dynamique",     tenue:"Professionnel", accent:"Paris" },
  { id:"gabriel",   name:"Gabriel",   region:"france",      country:"France",             gender:"m", portrait:"M1", langs:["FR","EN","PT"],   voice:"Dynamique",   style:"Chaleureux",    tenue:"Professionnel", accent:"Lyonnais" },
  // UAE
  { id:"maryam",    name:"Maryam",    region:"uae",         country:"Émirats arabes unis",gender:"f", portrait:"F2", langs:["AR","EN","FR"],   voice:"Élégante",    style:"Formel",        tenue:"Hijab élégant", accent:"Golfe" },
  { id:"aisha",     name:"Aïsha",     region:"uae",         country:"Émirats arabes unis",gender:"f", portrait:"F1", langs:["AR","EN"],        voice:"Professionnelle",style:"Direct",      tenue:"Professionnel", accent:"Dubaï" },
  { id:"omar",      name:"Omar",      region:"uae",         country:"Émirats arabes unis",gender:"m", portrait:"M3", langs:["AR","EN","FR"],   voice:"Calme",       style:"Formel",        tenue:"Traditionnel",  accent:"Golfe" },
  { id:"khalid",    name:"Khalid",    region:"uae",         country:"Émirats arabes unis",gender:"m", portrait:"M2", langs:["AR","EN"],        voice:"Autorité",    style:"Professionnel", tenue:"Professionnel", accent:"Dubaï" },
  // Arabia
  { id:"fatima",    name:"Fatima",    region:"arabia",      country:"Arabie saoudite",    gender:"f", portrait:"F2", langs:["AR","EN"],        voice:"Douce",       style:"Chaleureux",    tenue:"Hijab élégant", accent:"Riyad" },
  { id:"abdullah",  name:"Abdullah",  region:"arabia",      country:"Arabie saoudite",    gender:"m", portrait:"M3", langs:["AR","EN","FR"],   voice:"Profond",     style:"Formel",        tenue:"Traditionnel",  accent:"Riyad" },
  // Maghreb
  { id:"nour",      name:"Nour",      region:"maghreb",     country:"Maroc",              gender:"f", portrait:"F1", langs:["FR","AR","EN"],   voice:"Chaleureuse", style:"Dynamique",     tenue:"Professionnel", accent:"Casablanca" },
  { id:"karim",     name:"Karim",     region:"maghreb",     country:"Maroc",              gender:"m", portrait:"M4", langs:["FR","AR","EN"],   voice:"Calme",       style:"Direct",        tenue:"Professionnel", accent:"Casablanca" },
  // Africa West
  { id:"aissatou",  name:"Aïssatou",  region:"africa_west", country:"Sénégal",            gender:"f", portrait:"F4", langs:["FR","EN","WO"],   voice:"Chaleureuse", style:"Chaleureux",    tenue:"Professionnel", accent:"Dakar" },
  { id:"mamadou",   name:"Mamadou",   region:"africa_west", country:"Sénégal",            gender:"m", portrait:"M2", langs:["FR","EN"],        voice:"Chaleureux",  style:"Direct",        tenue:"Professionnel", accent:"Dakar" },
  // Africa East
  { id:"amina",     name:"Amina",     region:"africa_east", country:"Comores",            gender:"f", portrait:"F4", langs:["FR","AR","SHI"],  voice:"Douce",       style:"Chaleureux",    tenue:"Professionnel", accent:"Moroni" },
  { id:"fara",      name:"Fara",      region:"africa_east", country:"Madagascar",         gender:"f", portrait:"F1", langs:["FR","MG","EN"],   voice:"Naturelle",   style:"Dynamique",     tenue:"Professionnel", accent:"Antananarivo" },
  // Americas
  { id:"olivia",    name:"Olivia",    region:"americas",    country:"États-Unis",         gender:"f", portrait:"F3", langs:["EN","ES","FR"],   voice:"Dynamique",   style:"Direct",        tenue:"Professionnel", accent:"Américain" },
  { id:"james",     name:"James",     region:"americas",    country:"États-Unis",         gender:"m", portrait:"M1", langs:["EN","ES"],        voice:"Clair",       style:"Professionnel", tenue:"Professionnel", accent:"Américain" },
  { id:"isabella",  name:"Isabella",  region:"americas",    country:"Brésil",             gender:"f", portrait:"F3", langs:["PT","ES","EN"],   voice:"Chaleureuse", style:"Dynamique",     tenue:"Professionnel", accent:"Brésilien" },
  { id:"lucas",     name:"Lucas",     region:"americas",    country:"Brésil",             gender:"m", portrait:"M4", langs:["PT","ES","EN"],   voice:"Direct",      style:"Dynamique",     tenue:"Professionnel", accent:"Brésilien" },
  // Asia East
  { id:"mei",       name:"Mei",       region:"asia_east",   country:"Chine",              gender:"f", portrait:"F3", langs:["ZH","EN","FR"],   voice:"Précise",     style:"Formel",        tenue:"Professionnel", accent:"Mandarin" },
  { id:"wei",       name:"Wei",       region:"asia_east",   country:"Chine",              gender:"m", portrait:"M1", langs:["ZH","EN"],        voice:"Calme",       style:"Professionnel", tenue:"Professionnel", accent:"Mandarin" },
  // Asia South
  { id:"priya",     name:"Priya",     region:"asia_south",  country:"Inde",               gender:"f", portrait:"F1", langs:["HI","EN","FR"],   voice:"Dynamique",   style:"Chaleureux",    tenue:"Professionnel", accent:"Mumbai" },
  { id:"arjun",     name:"Arjun",     region:"asia_south",  country:"Inde",               gender:"m", portrait:"M2", langs:["HI","EN"],        voice:"Direct",      style:"Direct",        tenue:"Professionnel", accent:"Delhi" },
];

const COUNTRY_TO_REGION: Record<string, string> = {
  "France": "france", "Allemagne": "europe", "Espagne": "europe",
  "Émirats arabes unis": "uae", "Arabie saoudite": "arabia",
  "Maroc": "maghreb", "Algérie": "maghreb", "Tunisie": "maghreb",
  "Sénégal": "africa_west", "Madagascar": "africa_east", "Comores": "africa_east",
  "États-Unis": "americas", "Brésil": "americas", "Mexique": "americas",
  "Chine": "asia_east", "Japon": "asia_east",
  "Inde": "asia_south", "Pakistan": "asia_south",
  "Malaisie": "sea", "Indonésie": "sea",
};

const COUNTRIES = Object.keys(COUNTRY_TO_REGION).sort((a, b) => a.localeCompare(b, "fr"));

/* ─── Personalization panel ──────────────────────────────────── */

export interface PersonalizationPrefs {
  assistantId: string;
  nickname: string;
  tutoiement: boolean;
  speed: "slow" | "normal" | "fast";
  commStyle: string;
  lang: string;
}

function PersonalizationPanel({
  prefs, assistant, isDark, onSave, onClose,
}: {
  prefs: PersonalizationPrefs;
  assistant: AssistantData;
  isDark: boolean;
  onSave: (p: PersonalizationPrefs) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<PersonalizationPrefs>(prefs);

  const bg   = isDark ? "rgba(10,10,18,.98)" : "#fff";
  const fg   = isDark ? "#fff"              : NOIR;
  const fg2  = isDark ? "rgba(255,255,255,.5)" : "#6b7280";
  const bd   = isDark ? "rgba(255,255,255,.1)" : "#e5e7eb";
  const inp  = isDark ? "rgba(255,255,255,.06)" : "#f9fafb";

  const STYLES = ["Professionnel", "Chaleureux", "Direct", "Formel", "Dynamique", "Calme"];
  const LANGS  = [...new Set(assistant.langs)];

  function set(k: keyof PersonalizationPrefs, v: unknown) {
    setLocal(p => ({ ...p, [k]: v }));
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div style={{
        width: "min(460px,94vw)", borderRadius: 18,
        background: bg, border: `1px solid ${bd}`,
        padding: 24, display: "flex", flexDirection: "column", gap: 18,
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: fg }}>Personnaliser {assistant.name}</div>
            <div style={{ fontSize: 12, color: fg2 }}>Vos préférences sont enregistrées individuellement</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: fg2 }}>
            <X size={18} />
          </button>
        </div>

        {/* Nickname */}
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg2, textTransform: "uppercase", letterSpacing: ".07em" }}>Prénom personnalisé</span>
          <input
            value={local.nickname}
            onChange={e => set("nickname", e.target.value)}
            placeholder={assistant.name}
            style={{
              padding: "9px 12px", borderRadius: 9, fontSize: 13, color: fg,
              background: inp, border: `1px solid ${bd}`, outline: "none",
            }}
          />
        </label>

        {/* Tu / vous */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg2, textTransform: "uppercase", letterSpacing: ".07em" }}>Forme d'adresse</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(isTu => (
              <button key={String(isTu)} onClick={() => set("tutoiement", isTu)} style={{
                flex: 1, padding: "9px", borderRadius: 9, fontSize: 13,
                background: local.tutoiement === isTu ? "rgba(255,185,0,.12)" : inp,
                border: `1px solid ${local.tutoiement === isTu ? GOLD : bd}`,
                cursor: "pointer", color: local.tutoiement === isTu ? GOLD : fg,
                fontWeight: local.tutoiement === isTu ? 600 : 400,
              }}>
                {isTu ? "Tutoiement (tu)" : "Vouvoiement (vous)"}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg2, textTransform: "uppercase", letterSpacing: ".07em" }}>Vitesse de parole</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["slow","normal","fast"] as const).map(s => (
              <button key={s} onClick={() => set("speed", s)} style={{
                flex: 1, padding: "9px", borderRadius: 9, fontSize: 13,
                background: local.speed === s ? "rgba(255,185,0,.12)" : inp,
                border: `1px solid ${local.speed === s ? GOLD : bd}`,
                cursor: "pointer", color: local.speed === s ? GOLD : fg,
                fontWeight: local.speed === s ? 600 : 400,
              }}>
                {s === "slow" ? "Lente" : s === "normal" ? "Normale" : "Rapide"}
              </button>
            ))}
          </div>
        </div>

        {/* Communication style */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg2, textTransform: "uppercase", letterSpacing: ".07em" }}>Style de communication</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => set("commStyle", s)} style={{
                padding: "7px 12px", borderRadius: 7, fontSize: 12,
                background: local.commStyle === s ? "rgba(255,185,0,.12)" : inp,
                border: `1px solid ${local.commStyle === s ? GOLD : bd}`,
                cursor: "pointer", color: local.commStyle === s ? GOLD : fg,
                fontWeight: local.commStyle === s ? 600 : 400,
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg2, textTransform: "uppercase", letterSpacing: ".07em" }}>Langue préférée</span>
          <div style={{ display: "flex", gap: 6 }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => set("lang", l)} style={{
                padding: "7px 14px", borderRadius: 7, fontSize: 12,
                background: local.lang === l ? "rgba(255,185,0,.12)" : inp,
                border: `1px solid ${local.lang === l ? GOLD : bd}`,
                cursor: "pointer", color: local.lang === l ? GOLD : fg,
                fontWeight: local.lang === l ? 600 : 400,
              }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={() => { onSave(local); onClose(); }} style={{
          padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: GOLD, border: "none", cursor: "pointer", color: NOIR,
        }}>
          Enregistrer mes préférences
        </button>
      </div>
    </div>
  );
}

/* ─── Gallery view ───────────────────────────────────────────── */

export function GalleryView({
  currentId, prefs, isDark,
  onSelect, onSavePrefs, onBack,
}: {
  currentId: string;
  prefs: PersonalizationPrefs;
  isDark: boolean;
  onSelect: (id: string) => void;
  onSavePrefs: (p: PersonalizationPrefs) => void;
  onBack: () => void;
}) {
  const bg    = isDark ? NOIR       : "#fafafa";
  const fg    = isDark ? "#fff"      : NOIR;
  const fg2   = isDark ? "rgba(255,255,255,.5)"  : "#6b7280";
  const fg3   = isDark ? "rgba(255,255,255,.25)" : "#9ca3af";
  const card  = isDark ? "rgba(255,255,255,.04)" : "#fff";
  const bd    = isDark ? "rgba(255,255,255,.08)" : "#e5e7eb";
  const inp   = isDark ? "rgba(255,255,255,.06)" : "#fff";

  const [search,      setSearch]      = useState("");
  const [genderF,     setGenderF]     = useState<"all"|"f"|"m">("all");
  const [regionF,     setRegionF]     = useState("all");
  const [countryF,    setCountryF]    = useState("all");
  const [styleF,      setStyleF]      = useState("all");
  const [preview,     setPreview]     = useState<string | null>(null);
  const [showPersonal, setShowPersonal] = useState(false);

  const previewedA = ALL_ASSISTANTS.find(a => a.id === preview) ?? null;
  const currentA   = ALL_ASSISTANTS.find(a => a.id === currentId) ?? ALL_ASSISTANTS[0];

  const filtered = useMemo(() => {
    return ALL_ASSISTANTS.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (genderF !== "all" && a.gender !== genderF) return false;
      if (regionF !== "all" && a.region !== regionF) return false;
      if (countryF !== "all" && a.country !== countryF) return false;
      if (styleF !== "all" && a.style !== styleF) return false;
      return true;
    });
  }, [search, genderF, regionF, countryF, styleF]);

  const STYLES_LIST = ["Professionnel", "Chaleureux", "Direct", "Formel", "Dynamique"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "14px 20px",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.07)" : "#e5e7eb"}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "none", border: `1px solid ${bd}`,
          cursor: "pointer", color: fg2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: fg }}>Choisir votre collaborateur</div>
          <div style={{ fontSize: 11, color: fg2 }}>{ALL_ASSISTANTS.length} assistants dans {REGIONS.length} régions du monde</div>
        </div>
        <button onClick={() => { setPreview(currentId); setShowPersonal(true); }} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: "rgba(255,185,0,.10)", border: "1px solid rgba(255,185,0,.25)",
          cursor: "pointer", color: GOLD,
        }}>
          <Settings2 size={12} />
          Personnaliser
        </button>
      </div>

      {/* Filters */}
      <div style={{
        flexShrink: 0,
        padding: "10px 16px",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,.05)" : "#f0f0f0"}`,
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: inp, border: `1px solid ${bd}`, borderRadius: 8,
          padding: "6px 10px", flex: "1 1 160px", minWidth: 120, maxWidth: 220,
        }}>
          <Search size={12} style={{ color: fg3, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12.5, color: fg }}
          />
        </div>

        {/* Gender toggle */}
        <div style={{ display: "flex", borderRadius: 8, border: `1px solid ${bd}`, overflow: "hidden" }}>
          {(["all","f","m"] as const).map(g => (
            <button key={g} onClick={() => setGenderF(g)} style={{
              padding: "6px 10px", fontSize: 11.5, fontWeight: 500, border: "none", cursor: "pointer",
              background: genderF === g ? GOLD : inp,
              color: genderF === g ? NOIR : fg2,
            }}>
              {g === "all" ? "Tous" : g === "f" ? "Femmes" : "Hommes"}
            </button>
          ))}
        </div>

        {/* Region select */}
        <div style={{ position: "relative" }}>
          <select
            value={regionF}
            onChange={e => { setRegionF(e.target.value); setCountryF("all"); }}
            style={{
              padding: "6px 28px 6px 10px", borderRadius: 8, fontSize: 12, color: fg,
              background: inp, border: `1px solid ${bd}`, cursor: "pointer", outline: "none",
              appearance: "none",
            }}
          >
            <option value="all">Toutes les régions</option>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: fg3, pointerEvents: "none" }} />
        </div>

        {/* Country select */}
        <div style={{ position: "relative" }}>
          <select
            value={countryF}
            onChange={e => setCountryF(e.target.value)}
            style={{
              padding: "6px 28px 6px 10px", borderRadius: 8, fontSize: 12, color: fg,
              background: inp, border: `1px solid ${bd}`, cursor: "pointer", outline: "none",
              appearance: "none",
            }}
          >
            <option value="all">Tous les pays</option>
            {[...new Set(ALL_ASSISTANTS.filter(a => regionF === "all" || a.region === regionF).map(a => a.country))].sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: fg3, pointerEvents: "none" }} />
        </div>

        {/* Style filter */}
        <div style={{ position: "relative" }}>
          <select
            value={styleF}
            onChange={e => setStyleF(e.target.value)}
            style={{
              padding: "6px 28px 6px 10px", borderRadius: 8, fontSize: 12, color: fg,
              background: inp, border: `1px solid ${bd}`, cursor: "pointer", outline: "none",
              appearance: "none",
            }}
          >
            <option value="all">Tous les styles</option>
            {STYLES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: fg3, pointerEvents: "none" }} />
        </div>
      </div>

      {/* Results count */}
      <div style={{ flexShrink: 0, padding: "7px 20px", fontSize: 11.5, color: fg3 }}>
        {filtered.length} collaborateur{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
        {filtered.length < ALL_ASSISTANTS.length && (
          <button onClick={() => { setSearch(""); setGenderF("all"); setRegionF("all"); setCountryF("all"); setStyleF("all"); }} style={{
            marginLeft: 10, fontSize: 11, color: GOLD, background: "none", border: "none", cursor: "pointer",
          }}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Grid + Preview split */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Portrait grid */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10, alignContent: "start",
        }}>
          {filtered.map(a => {
            const isCurrent = a.id === currentId;
            const isPreviewed = a.id === preview;
            return (
              <button key={a.id} onClick={() => setPreview(a.id)} style={{
                display: "block",
                background: isPreviewed ? (isDark ? "rgba(255,185,0,.10)" : "#fffdf0") : card,
                border: `1px solid ${isPreviewed ? GOLD : isCurrent ? "rgba(255,185,0,.4)" : bd}`,
                borderRadius: 14, cursor: "pointer", textAlign: "left",
                position: "relative", width: "100%",
              }}>
                {/* Portrait */}
                <div style={{ width: "100%", lineHeight: 0, overflow: "hidden", borderRadius: "13px 13px 0 0" }}>
                  <Portrait type={a.portrait} size={160} responsive />
                  {/* Current indicator */}
                  {isCurrent && (
                    <div style={{
                      position: "absolute", top: 7, right: 7,
                      width: 20, height: 20, borderRadius: "50%",
                      background: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <CheckCircle size={12} style={{ color: NOIR }} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "8px 10px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isPreviewed ? GOLD : fg, marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 10.5, color: fg3 }}>{a.country}</div>
                  <div style={{ fontSize: 10.5, color: fg3, marginTop: 1 }}>{a.langs.join(" · ")}</div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", color: fg3, fontSize: 13 }}>
              Aucun collaborateur ne correspond à ces critères.
            </div>
          )}
        </div>

        {/* Preview panel */}
        {previewedA && (
          <div style={{
            width: 260, flexShrink: 0,
            borderLeft: `1px solid ${bd}`,
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}>
            {/* Portrait */}
            <div style={{ width: "100%", overflow: "hidden", flexShrink: 0 }}>
              <Portrait type={previewedA.portrait} size={260} responsive />
            </div>

            {/* Details */}
            <div style={{ padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: fg, letterSpacing: "-.02em" }}>{previewedA.name}</div>
                <div style={{ fontSize: 12, color: fg2 }}>{previewedA.country} · DJAMA IA</div>
              </div>

              {/* Attributes */}
              {[
                { label: "Langues",   val: previewedA.langs.join(", ") },
                { label: "Accent",    val: previewedA.accent },
                { label: "Voix",      val: previewedA.voice },
                { label: "Style",     val: previewedA.style },
                { label: "Tenue",     val: previewedA.tenue },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 12, color: fg2, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: fg, textAlign: "right" }}>{val}</span>
                </div>
              ))}

              {/* Digital human notice */}
              <div style={{
                padding: "8px 10px", borderRadius: 8,
                background: isDark ? "rgba(255,185,0,.06)" : "rgba(255,185,0,.06)",
                border: "1px solid rgba(255,185,0,.15)",
                fontSize: 11, color: fg3, lineHeight: 1.5,
              }}>
                Avatar animé en temps réel — Sous-chantier F
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <button style={{
                  padding: "9px 12px", borderRadius: 9, fontSize: 12,
                  background: "rgba(255,185,0,.10)", border: "1px solid rgba(255,185,0,.25)",
                  cursor: "pointer", color: GOLD,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 500,
                }}>
                  <Mic size={12} />
                  Exemple de voix
                </button>

                <button
                  onClick={() => { onSelect(previewedA.id); }}
                  disabled={previewedA.id === currentId}
                  style={{
                    padding: "10px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                    background: previewedA.id === currentId ? (isDark ? "rgba(255,255,255,.06)" : "#f3f4f6") : GOLD,
                    border: "none", cursor: previewedA.id === currentId ? "default" : "pointer",
                    color: previewedA.id === currentId ? fg3 : NOIR,
                  }}>
                  {previewedA.id === currentId ? "Collaborateur actuel" : `Choisir ${previewedA.name}`}
                </button>

                <button
                  onClick={() => setShowPersonal(true)}
                  style={{
                    padding: "9px 12px", borderRadius: 9, fontSize: 12,
                    background: "none", border: `1px solid ${bd}`,
                    cursor: "pointer", color: fg2,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}>
                  <Settings2 size={12} />
                  Personnaliser
                </button>
              </div>

              {/* Country suggestions */}
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: fg3, marginBottom: 7 }}>
                  Du même pays
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {ALL_ASSISTANTS
                    .filter(a => a.country === previewedA.country && a.id !== previewedA.id)
                    .slice(0, 3)
                    .map(a => (
                      <button key={a.id} onClick={() => setPreview(a.id)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8,
                        background: "none", border: `1px solid ${bd}`,
                        cursor: "pointer", color: fg, fontSize: 12,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                        }}>
                          <Portrait type={a.portrait} size={28} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                          <div style={{ fontSize: 10.5, color: fg3 }}>{a.langs.join(" · ")}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personalization modal */}
      {showPersonal && previewedA && (
        <PersonalizationPanel
          prefs={prefs}
          assistant={previewedA}
          isDark={isDark}
          onSave={onSavePrefs}
          onClose={() => setShowPersonal(false)}
        />
      )}
    </div>
  );
}
