"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Contact2, Download, QrCode, Share2, Check, Linkedin, Twitter, Instagram, Globe, Phone, Mail, MapPin } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

const THEMES = [
  { id: "violet",   name: "Violet",   bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", text: "white" },
  { id: "teal",     name: "Sarcelle",  bg: "linear-gradient(135deg,#0891b2,#0d9488)", text: "white" },
  { id: "rose",     name: "Rose",      bg: "linear-gradient(135deg,#ec4899,#db2777)", text: "white" },
  { id: "dark",     name: "Sombre",    bg: "linear-gradient(135deg,#0e1420,#1a2035)", text: "white" },
  { id: "light",    name: "Clair",     bg: "linear-gradient(135deg,#f8fafc,#f1f5f9)", text: "#1e293b" },
];

export default function CarteVIsitePage() {
  const { isDark } = useTheme();
  const [theme, setTheme]     = useState(THEMES[0]);
  const [copied, setCopied]   = useState(false);
  const [tab, setTab]         = useState<"carte" | "modifier">("carte");
  const [card, setCard] = useState({
    name: "AMDJAD Nofane",
    title: "Fondateur · DJAMA Pro",
    company: "DJAMA",
    phone: "+33 6 XX XX XX XX",
    email: "nofane@djama.pro",
    website: "djama.pro",
    location: "Paris, France",
    linkedin: "linkedin.com/in/nofane",
    twitter: "@djama_pro",
    instagram: "@djama.pro",
    bio: "Plateforme tout-en-un pour entrepreneurs & freelances. Facturation, CRM, IA — tout est là.",
  });

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function copyLink() {
    void navigator.clipboard.writeText(`https://djama.pro/v/${card.name.toLowerCase().replace(/\s+/g, "-")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Contact2} color="#0891b2" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Carte de visite digitale</h1>
              <p className={`text-[10px] ${s.muted}`}>Partageable en 1 lien · QR code inclus</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1.5 mt-4">
          {(["carte", "modifier"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-xl px-4 py-1.5 text-[11.5px] font-semibold transition"
              style={tab === t
                ? { background: "rgba(8,145,178,0.15)", color: "#0891b2", border: "1px solid rgba(8,145,178,0.30)" }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              {t === "carte" ? "Aperçu" : "Modifier"}
            </button>
          ))}
        </div>
      </div>

      {tab === "carte" && (
        <div className="px-4 space-y-4">
          {/* Carte visuelle */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease }}
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{ background: theme.bg }}>
            <div className="p-6">
              {/* Avatar initiales */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: theme.text === "white" ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.10)" }}>
                <span className="text-2xl font-black" style={{ color: theme.text }}>
                  {card.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </span>
              </div>
              <h2 className="text-[22px] font-black leading-tight" style={{ color: theme.text }}>{card.name}</h2>
              <p className="text-[13px] font-semibold opacity-75 mt-0.5" style={{ color: theme.text }}>{card.title}</p>
              <p className="text-[12px] font-bold opacity-60 mt-0.5" style={{ color: theme.text }}>{card.company}</p>

              {card.bio && <p className="text-[11.5px] leading-relaxed mt-4 opacity-70" style={{ color: theme.text }}>{card.bio}</p>}

              <div className="mt-5 space-y-2">
                {card.phone && <div className="flex items-center gap-2"><Phone size={12} style={{ color: theme.text, opacity: 0.65 }} /><span className="text-[12px] font-medium" style={{ color: theme.text, opacity: 0.85 }}>{card.phone}</span></div>}
                {card.email && <div className="flex items-center gap-2"><Mail size={12} style={{ color: theme.text, opacity: 0.65 }} /><span className="text-[12px] font-medium" style={{ color: theme.text, opacity: 0.85 }}>{card.email}</span></div>}
                {card.website && <div className="flex items-center gap-2"><Globe size={12} style={{ color: theme.text, opacity: 0.65 }} /><span className="text-[12px] font-medium" style={{ color: theme.text, opacity: 0.85 }}>{card.website}</span></div>}
                {card.location && <div className="flex items-center gap-2"><MapPin size={12} style={{ color: theme.text, opacity: 0.65 }} /><span className="text-[12px] font-medium" style={{ color: theme.text, opacity: 0.85 }}>{card.location}</span></div>}
              </div>

              {(card.linkedin || card.twitter || card.instagram) && (
                <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: theme.text === "white" ? "1px solid rgba(255,255,255,0.20)" : "1px solid rgba(0,0,0,0.12)" }}>
                  {card.linkedin && <div className="flex items-center gap-1.5"><Linkedin size={13} style={{ color: theme.text, opacity: 0.7 }} /><span className="text-[10.5px]" style={{ color: theme.text, opacity: 0.7 }}>{card.linkedin}</span></div>}
                </div>
              )}
            </div>
          </motion.div>

          {/* Thèmes */}
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${s.muted}`}>Thème</p>
            <div className="flex gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)}
                  className="h-8 w-8 rounded-xl transition"
                  style={{ background: t.bg, border: theme.id === t.id ? `2.5px solid #0891b2` : "2.5px solid transparent" }} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={copyLink}
              className="flex flex-col items-center gap-1.5 rounded-2xl border py-4 transition"
              style={copied ? { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)" } : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}>
              {copied ? <Check size={18} style={{ color: "#10b981" }} /> : <Share2 size={18} className={s.muted} />}
              <span className={`text-[10px] font-bold ${copied ? "text-green-400" : s.muted}`}>{copied ? "Copié !" : "Partager"}</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 rounded-2xl border py-4"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}>
              <QrCode size={18} className={s.muted} />
              <span className={`text-[10px] font-bold ${s.muted}`}>QR Code</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 rounded-2xl border py-4"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}>
              <Download size={18} className={s.muted} />
              <span className={`text-[10px] font-bold ${s.muted}`}>Télécharger</span>
            </button>
          </div>
        </div>
      )}

      {tab === "modifier" && (
        <div className="px-4 space-y-3">
          {[
            { key: "name",     label: "Nom complet *",     placeholder: "Prénom NOM" },
            { key: "title",    label: "Titre / Poste",      placeholder: "Fondateur · DJAMA" },
            { key: "company",  label: "Entreprise",         placeholder: "DJAMA" },
            { key: "phone",    label: "Téléphone",          placeholder: "+33 6 XX XX XX XX" },
            { key: "email",    label: "Email pro",          placeholder: "vous@exemple.fr" },
            { key: "website",  label: "Site web",           placeholder: "www.exemple.fr" },
            { key: "location", label: "Ville / Région",     placeholder: "Paris, France" },
            { key: "linkedin", label: "LinkedIn",           placeholder: "linkedin.com/in/profil" },
            { key: "bio",      label: "Bio (optionnel)",    placeholder: "Courte description…" },
          ].map(f => (
            <div key={f.key}>
              <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>{f.label}</label>
              {f.key === "bio"
                ? <textarea rows={2} className={`${s.input} resize-none`} placeholder={f.placeholder} value={(card as Record<string, string>)[f.key]} onChange={e => setCard(p => ({ ...p, [f.key]: e.target.value }))} />
                : <input className={s.input} placeholder={f.placeholder} value={(card as Record<string, string>)[f.key]} onChange={e => setCard(p => ({ ...p, [f.key]: e.target.value }))} />}
            </div>
          ))}
          <button onClick={() => setTab("carte")}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black text-white mt-2"
            style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
            <Check size={15} /> Voir l'aperçu
          </button>
        </div>
      )}
    </div>
  );
}
