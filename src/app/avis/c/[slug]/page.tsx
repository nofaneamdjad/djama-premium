"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Campaign {
  id: string; name: string; question: string;
  collect_name: boolean; collect_email: boolean;
  org_id: string;
  organizations?: { name: string; logo_url?: string };
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent"];
  const active = hover || value;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
            className="transition-all duration-150 hover:scale-110 active:scale-95">
            <Star size={40} fill={i <= active ? "#f59e0b" : "transparent"}
              strokeWidth={1.5} className={i <= active ? "text-amber-400" : "text-white/20"} />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {active > 0 && (
          <motion.p key={active} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="text-sm font-bold text-amber-400">{labels[active]}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CampaignReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating]     = useState(0);
  const [message, setMessage]   = useState("");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [consent, setConsent]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await db.from("rep_campaigns")
        .select("id,name,question,collect_name,collect_email,org_id,organizations(name,logo_url)")
        .eq("slug", slug).eq("is_active", true).single();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setCampaign(data as Campaign);
      setLoading(false);
    }
    void load();
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Veuillez donner une note."); return; }
    setSubmitting(true); setError("");
    try {
      const r = await fetch("/api/reputation/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id:          campaign!.org_id,
          campaign_id:     campaign!.id,
          author_name:     name.trim() || undefined,
          author_email:    email.trim() || undefined,
          rating, message: message.trim() || undefined,
          consent_publish: consent,
          source:          "djama",
        }),
      });
      if (!r.ok) { const d = await r.json() as { error?: string }; setError(d.error ?? "Erreur"); return; }
      setDone(true);
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080e]">
      <Loader2 size={24} className="animate-spin text-amber-400" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07080e] px-6 text-center">
      <AlertCircle size={32} className="text-white/30" />
      <p className="text-white/50 text-sm">Ce lien de collecte n&apos;est plus disponible.</p>
    </div>
  );

  const orgName = (campaign?.organizations as { name?: string } | undefined)?.name ?? "DJAMA";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080e] px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="w-full max-w-md rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-8 space-y-6">

        {/* Logo / nom */}
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto"
            style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <span className="text-2xl font-black" style={{ color: GOLD }}>{orgName[0]}</span>
          </div>
          <p className="text-white font-black text-lg">{orgName}</p>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-400" />
            <p className="text-white font-bold text-lg">Merci pour votre avis !</p>
            <p className="text-white/40 text-sm">Votre retour nous aide à améliorer nos services.</p>
          </motion.div>
        ) : (
          <form onSubmit={e => void submit(e)} className="space-y-5">
            <p className="text-white/70 text-center text-sm leading-relaxed">{campaign?.question}</p>

            <StarPicker value={rating} onChange={setRating} />

            <div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                className="w-full resize-none rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40 transition"
                placeholder="Partagez votre expérience… (facultatif)" />
            </div>

            {campaign?.collect_name && (
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40 transition"
                placeholder="Votre prénom (facultatif)" />
            )}

            {campaign?.collect_email && (
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40 transition"
                placeholder="Votre email (facultatif)" />
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-amber-400" />
              <span className="text-xs text-white/40 leading-relaxed">
                J&apos;accepte que mon avis soit publié sur le site de {orgName}.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                <AlertCircle size={12} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting || rating === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
              style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Envoyer mon avis"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
