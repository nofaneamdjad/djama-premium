"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Store, Star, MapPin, Search, ExternalLink, Heart } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

interface Service { id: string; name: string; category: string; price: string; rating: number; reviews: number; location: string; seller: string; emoji: string; liked: boolean }

const SERVICES: Service[] = [
  { id: "1",  name: "Création site vitrine IA",       category: "Développement web", price: "490 €",      rating: 4.9, reviews: 128, location: "Paris 75",    seller: "NovaDev",    emoji: "🌐", liked: false },
  { id: "2",  name: "Audit SEO + stratégie contenu",   category: "Marketing digital", price: "299 €",      rating: 4.8, reviews: 74,  location: "Lyon 69",     seller: "SEO Expert", emoji: "🔍", liked: true  },
  { id: "3",  name: "Logo + charte graphique",         category: "Design & Branding", price: "350 €",      rating: 4.7, reviews: 210, location: "Marseille 13", seller: "DesignLab",  emoji: "🎨", liked: false },
  { id: "4",  name: "Rédaction 10 articles de blog",   category: "Copywriting",       price: "199 €",      rating: 4.6, reviews: 55,  location: "Bordeaux 33", seller: "WordCraft",  emoji: "✍️", liked: false },
  { id: "5",  name: "Coaching business 1h/sem",        category: "Coaching",          price: "150 €/mois", rating: 5.0, reviews: 32,  location: "Toulouse 31", seller: "BizCoach",   emoji: "🎯", liked: true  },
  { id: "6",  name: "Comptabilité TPE mensuelle",      category: "Comptabilité",      price: "89 €/mois",  rating: 4.8, reviews: 98,  location: "Nantes 44",   seller: "ComptaPro",  emoji: "📊", liked: false },
];

const CATS = ["Tout", "Développement web", "Marketing digital", "Design & Branding", "Copywriting", "Coaching", "Comptabilité"];

export default function MarketplacePage() {
  const { isDark } = useTheme();
  const [cat, setCat]         = useState("Tout");
  const [query, setQuery]     = useState("");
  const [services, setServices] = useState<Service[]>(SERVICES);

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-white border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  const filtered = services.filter(sv =>
    (cat === "Tout" || sv.category === cat) &&
    (query === "" || sv.name.toLowerCase().includes(query.toLowerCase()) || sv.seller.toLowerCase().includes(query.toLowerCase()))
  );

  function toggleLike(id: string) { setServices(p => p.map(sv => sv.id === id ? { ...sv, liked: !sv.liked } : sv)); }

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center gap-3 mb-4">
          <ModuleHeaderIcon icon={Store} color="#0891b2" />
          <div>
            <h1 className={`text-[17px] font-black ${s.text}`}>Marketplace de services</h1>
            <p className={`text-[10px] ${s.muted}`}>{SERVICES.length} prestataires disponibles</p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
          <input className={`${s.input} pl-8`} placeholder="Rechercher un service ou prestataire…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {/* Catégories */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition whitespace-nowrap"
              style={cat === c
                ? { background: "rgba(8,145,178,0.18)", color: "#0891b2", border: "1px solid rgba(8,145,178,0.35)" }
                : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        {filtered.length === 0 && (
          <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
            <p className={`text-[12px] ${s.muted}`}>Aucun résultat pour "{query}"</p>
          </div>
        )}
        {filtered.map((sv, i) => (
          <motion.div key={sv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
            className={`rounded-2xl border p-4 ${s.card}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-2xl text-2xl flex items-center justify-center"
                  style={{ background: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.22)" }}>
                  {sv.emoji}
                </div>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold leading-tight ${s.text}`}>{sv.name}</p>
                  <p className={`text-[10.5px] font-semibold mt-0.5`} style={{ color: "#0891b2" }}>{sv.seller}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[9.5px] rounded px-1.5 py-0.5`}
                      style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                      {sv.category}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <MapPin size={9} className={s.muted} />
                      <span className={`text-[9.5px] ${s.muted}`}>{sv.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => toggleLike(sv.id)}>
                  <Heart size={15} style={{ color: sv.liked ? "#ef4444" : undefined, fill: sv.liked ? "#ef4444" : "none" }} className={sv.liked ? "" : s.muted} />
                </button>
                <p className="text-[15px] font-black" style={{ color: "#0891b2" }}>{sv.price}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={10} style={{ fill: idx < Math.round(sv.rating) ? "#f59e0b" : "transparent", color: idx < Math.round(sv.rating) ? "#f59e0b" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
                  ))}
                </div>
                <span className={`text-[10px] font-bold`} style={{ color: "#f59e0b" }}>{sv.rating}</span>
                <span className={`text-[10px] ${s.muted}`}>({sv.reviews} avis)</span>
              </div>
              <button className="flex items-center gap-1 text-[10.5px] font-bold rounded-xl px-3 py-1.5 transition"
                style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", color: "white" }}>
                Contacter <ExternalLink size={10} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
