"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, CheckCircle2, AlertCircle, Loader2,
  MessageSquarePlus, Send, Mail, Phone, MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

type Consent = { email: boolean; sms: boolean; whatsapp: boolean };

/* ── Star picker ────────────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent"];
  const active = hover || value;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-all duration-150 hover:scale-110 active:scale-95">
            <Star size={38}
              fill={i <= active ? "#f59e0b" : "transparent"}
              strokeWidth={1.5}
              className={i <= active ? "text-amber-400" : "text-white/20"} />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {active > 0 && (
          <motion.p key={active}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="text-sm font-bold text-amber-400">
            {labels[active]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Consent block ──────────────────────────────────────────── */
const CHANNELS = [
  { key: "email" as const,    icon: Mail,           label: "Email" },
  { key: "sms" as const,      icon: Phone,          label: "SMS" },
  { key: "whatsapp" as const, icon: MessageCircle,  label: "WhatsApp" },
];

function ConsentBlock({
  consent, onChange, businessName,
}: {
  consent: Consent;
  onChange: (c: Consent) => void;
  businessName: string;
}) {
  const toggle = (k: keyof Consent) => onChange({ ...consent, [k]: !consent[k] });
  const anyChecked = consent.email || consent.sms || consent.whatsapp;

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="mb-1 text-[0.72rem] font-bold text-white/55">
        Rester informé des offres de{" "}
        <span style={{ color: GOLD }}>{businessName}</span> ?
      </p>
      <p className="mb-3 text-[0.65rem] text-white/25">
        Choisissez comment vous souhaitez être contacté :
      </p>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map(({ key, icon: Icon, label }) => {
          const on = consent[key];
          return (
            <button key={key} type="button"
              onClick={() => toggle(key)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.75rem] font-semibold transition-all"
              style={on
                ? { background: `${GOLD}22`, borderColor: `${GOLD}50`, color: GOLD }
                : { background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
              <Icon size={12} />
              {label}
              {on && (
                <span className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black"
                  style={{ background: GOLD, color: "#0a0a0a" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
      {anyChecked && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-2.5 text-[0.62rem] text-white/20">
          Vous pouvez vous désinscrire à tout moment. Aucun spam.
        </motion.p>
      )}
    </div>
  );
}

/* ── Error box ──────────────────────────────────────────────── */
function ErrorBox({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="mb-4 overflow-hidden">
      <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle size={14} className="shrink-0" /> {msg}
      </div>
    </motion.div>
  );
}

/* ── Success screen ─────────────────────────────────────────── */
function SuccessScreen({
  displayName, rating, label, consent,
}: {
  displayName: string; rating?: number; label: string; consent: Consent;
}) {
  const channels = CHANNELS.filter(c => consent[c.key]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07080e] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${GOLD}22, transparent 70%)` }} />
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 flex flex-col items-center gap-5 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: `${GOLD}18`, border: `2px solid ${GOLD}40` }}>
          <CheckCircle2 size={36} style={{ color: GOLD }} />
        </motion.div>

        <div>
          <h1 className="text-2xl font-black">{label}</h1>
          <p className="mt-2 text-sm text-white/45">
            Votre message a bien été transmis à{" "}
            <span className="font-semibold text-white/70">{displayName}</span>.
          </p>
        </div>

        {rating !== undefined && (
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={20} fill={i <= rating ? "#f59e0b" : "transparent"}
                strokeWidth={1.5} className={i <= rating ? "text-amber-400" : "text-white/15"} />
            ))}
          </div>
        )}

        {channels.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-3">
            <p className="mb-2 text-[0.7rem] text-white/35">Vous serez contacté via :</p>
            <div className="flex justify-center gap-2">
              {channels.map(({ key, icon: Icon, label: l }) => (
                <span key={key}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[0.72rem] font-semibold"
                  style={{ borderColor: `${GOLD}35`, color: GOLD, background: `${GOLD}12` }}>
                  <Icon size={11} /> {l}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-xs text-white/20">Propulsé par DJAMA Premium</p>
      </motion.div>
    </div>
  );
}

/* ── Business avatar ────────────────────────────────────────── */
function BusinessAvatar({ logoUrl, name, loading }: { logoUrl: string | null; name: string; loading: boolean }) {
  if (loading) return <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-white/[0.06]" />;
  if (logoUrl) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease }}
        className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-white/[0.1]">
        <Image src={logoUrl} alt={name} width={64} height={64} className="h-full w-full object-cover" />
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4, ease }}
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-black"
      style={{ background: `${GOLD}18`, borderColor: `${GOLD}35`, color: GOLD }}>
      {name.charAt(0).toUpperCase()}
    </motion.div>
  );
}

const inputCls = "w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/20 focus:bg-white/[0.08]";
const labelCls = "mb-1.5 block text-[0.7rem] font-semibold text-white/40";

/* ══════════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════════ */
export default function AvisPublicPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  const [businessName, setBusinessName] = useState<string | null>(null);
  const [logoUrl,      setLogoUrl]      = useState<string | null>(null);
  const [loadingInfo,  setLoadingInfo]  = useState(true);

  const [tab, setTab] = useState<"avis" | "demande">("avis");

  /* avis */
  const [avisForm,       setAvisForm]       = useState({ clientName: "", rating: 0, message: "" });
  const [avisConsent,    setAvisConsent]    = useState<Consent>({ email: false, sms: false, whatsapp: false });
  const [avisSubmitted,  setAvisSubmitted]  = useState(false);
  const [avisSubmitting, setAvisSubmitting] = useState(false);
  const [avisError,      setAvisError]      = useState("");
  const avisNameRef    = useRef<HTMLInputElement>(null);
  const demandeNameRef = useRef<HTMLInputElement>(null);

  /* demande questionnaire */
  const [demandeForm, setDemandeForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    interet: "",  // ce qui intéresse le client
    budget:  "",  // budget estimé
    source:  "",  // comment il a découvert
    message: "",
  });
  const [demandeConsent,    setDemandeConsent]    = useState<Consent>({ email: false, sms: false, whatsapp: false });
  const [demandeSubmitted,  setDemandeSubmitted]  = useState(false);
  const [demandeSubmitting, setDemandeSubmitting] = useState(false);
  const [demandeError,      setDemandeError]      = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("key, value")
          .eq("user_id", userId)
          .in("key", ["brand.company_name", "brand.logo_url"]);
        if (data) {
          const name = data.find(r => r.key === "brand.company_name")?.value as string | undefined;
          const logo = data.find(r => r.key === "brand.logo_url")?.value as string | undefined;
          if (name) setBusinessName(name);
          if (logo) setLogoUrl(logo);
        }
      } catch {}
      setLoadingInfo(false);
    })();
  }, [userId]);

  const displayName = businessName ?? "DJAMA";

  /* Auto-focus name when rating is selected */
  useEffect(() => {
    if (avisForm.rating > 0 && !avisForm.clientName) {
      avisNameRef.current?.focus();
    }
  }, [avisForm.rating]);

  useEffect(() => {
    if (demandeForm.interet && !demandeForm.clientName) {
      demandeNameRef.current?.focus();
    }
  }, [demandeForm.interet]);

  const avisReady    = avisForm.rating > 0 && avisForm.clientName.trim().length > 0;
  const demandeReady = !!demandeForm.interet && demandeForm.clientName.trim().length > 0;

  async function submitAvis() {
    setAvisError("");
    if (!avisForm.clientName.trim()) { setAvisError("Votre nom est requis."); return; }
    if (avisForm.rating === 0)       { setAvisError("Sélectionnez une note."); return; }
    setAvisSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id:          userId,
      client_name:      avisForm.clientName.trim(),
      rating:           avisForm.rating,
      message:          avisForm.message.trim(),
      source:           "direct",
      project:          null,
      consent_email:    avisConsent.email,
      consent_sms:      avisConsent.sms,
      consent_whatsapp: avisConsent.whatsapp,
    });
    setAvisSubmitting(false);
    if (error) setAvisError("Une erreur est survenue. Veuillez réessayer.");
    else       setAvisSubmitted(true);
  }

  async function submitDemande() {
    setDemandeError("");
    if (!demandeForm.clientName.trim()) { setDemandeError("Votre nom est requis."); return; }
    if (!demandeForm.interet)           { setDemandeError("Indiquez ce qui vous intéresse."); return; }
    setDemandeSubmitting(true);
    const parts = [demandeForm.interet, demandeForm.budget, demandeForm.source].filter(Boolean);
    const subject = parts.join(" · ");
    const { error } = await supabase.from("client_requests").insert({
      user_id:          userId,
      client_name:      demandeForm.clientName.trim(),
      client_email:     demandeForm.clientEmail.trim() || null,
      client_phone:     demandeForm.clientPhone.trim() || null,
      subject,
      message:          demandeForm.message.trim() || null,
      consent_email:    demandeConsent.email,
      consent_sms:      demandeConsent.sms,
      consent_whatsapp: demandeConsent.whatsapp,
    });
    setDemandeSubmitting(false);
    if (error) setDemandeError("Une erreur est survenue. Veuillez réessayer.");
    else       setDemandeSubmitted(true);
  }

  if (avisSubmitted)    return <SuccessScreen displayName={displayName} rating={avisForm.rating} label="Merci pour votre avis !" consent={avisConsent} />;
  if (demandeSubmitted) return <SuccessScreen displayName={displayName} label="Questionnaire envoyé, merci !" consent={demandeConsent} />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#07080e] px-4 py-10 text-white">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${GOLD}18, transparent 70%)` }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">
          <BusinessAvatar logoUrl={logoUrl} name={displayName} loading={loadingInfo} />
          <h1 className="text-xl font-black">{displayName}</h1>
          <p className="mt-1.5 text-[0.75rem] text-white/35">
            {tab === "avis"
              ? "Donnez-nous votre avis — cela compte énormément"
              : "Remplissez ce questionnaire pour que nous puissions mieux vous servir"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5">
          {(["avis", "demande"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[0.78rem] font-bold transition-all">
              {tab === t && (
                <motion.div layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}0a)`, border: `1px solid ${GOLD}30` }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${tab === t ? "text-amber-400" : "text-white/35"}`}>
                {t === "avis"
                  ? <><Star size={13} />Laisser un avis</>
                  : <><MessageSquarePlus size={13} />Questionnaire</>}
              </span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm">
          <AnimatePresence mode="wait">

            {/* ── AVIS ── */}
            {tab === "avis" && (
              <motion.div key="avis"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>

                <div className="mb-6">
                  <p className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-widest text-white/30">
                    Votre note globale
                  </p>
                  <StarPicker value={avisForm.rating} onChange={v => setAvisForm(f => ({ ...f, rating: v }))} />
                </div>

                <div className="h-px bg-white/[0.06] mb-5" />

                <div className="mb-5">
                  <label className={labelCls}>Votre prénom / nom *</label>
                  <input
                    ref={avisNameRef}
                    value={avisForm.clientName}
                    onChange={e => setAvisForm(f => ({ ...f, clientName: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && avisReady) submitAvis(); }}
                    onBlur={() => { if (avisReady) submitAvis(); }}
                    placeholder="Jean Dupont"
                    className={inputCls}
                  />
                  <AnimatePresence>
                    {avisReady && !avisSubmitting && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} className="mt-1.5 text-center text-[0.65rem] text-white/25">
                        ↵ Appuyez sur Entrée pour envoyer
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mb-5">
                  <label className={labelCls}>
                    Témoignage <span className="text-white/20">(optionnel)</span>
                  </label>
                  <textarea value={avisForm.message}
                    onChange={e => setAvisForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Partagez votre expérience en quelques mots…"
                    rows={3} className={`${inputCls} resize-none`} />
                </div>

                <ConsentBlock consent={avisConsent} onChange={setAvisConsent} businessName={displayName} />

                <AnimatePresence>{avisError && <ErrorBox msg={avisError} />}</AnimatePresence>

                <AnimatePresence mode="wait">
                  {avisSubmitting ? (
                    <motion.div key="sending"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 py-3 text-sm text-white/50">
                      <Loader2 size={15} className="animate-spin" /> Envoi en cours…
                    </motion.div>
                  ) : (
                    <motion.button key="btn" onClick={submitAvis}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black transition-all hover:brightness-110"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a",
                        opacity: avisReady ? 1 : 0.45 }}>
                      <Star size={15} fill="currentColor" strokeWidth={0} />
                      Envoyer mon avis
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── DEMANDE ── */}
            {tab === "demande" && (
              <motion.div key="demande"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

                <div className="mb-4">
                  <label className={labelCls}>Votre prénom / nom *</label>
                  <input
                    ref={demandeNameRef}
                    value={demandeForm.clientName}
                    onChange={e => setDemandeForm(f => ({ ...f, clientName: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && demandeReady) submitDemande(); }}
                    onBlur={() => { if (demandeReady) submitDemande(); }}
                    placeholder="Jean Dupont"
                    className={inputCls}
                  />
                  <AnimatePresence>
                    {demandeReady && !demandeSubmitting && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} className="mt-1.5 text-center text-[0.65rem] text-white/25">
                        ↵ Appuyez sur Entrée pour envoyer
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className={labelCls}>Email <span className="text-white/20">(optionnel)</span></label>
                    <input value={demandeForm.clientEmail}
                      onChange={e => setDemandeForm(f => ({ ...f, clientEmail: e.target.value }))}
                      placeholder="jean@exemple.fr" type="email" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone <span className="text-white/20">(optionnel)</span></label>
                    <input value={demandeForm.clientPhone}
                      onChange={e => setDemandeForm(f => ({ ...f, clientPhone: e.target.value }))}
                      placeholder="+262 6XX XXX XXX" type="tel" className={inputCls} />
                  </div>
                </div>

                {/* Q1 — Intérêt */}
                <div className="mb-5">
                  <p className="mb-2 text-[0.7rem] font-bold text-white/40">
                    <span className="mr-1.5 text-amber-400/70">1.</span>
                    Qu'est-ce qui vous intéresse ? *
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Produit", "Service", "Abonnement", "Formation", "Consultation", "Autre"].map(v => {
                      const on = demandeForm.interet === v;
                      return (
                        <button key={v} type="button"
                          onClick={() => setDemandeForm(f => ({ ...f, interet: v }))}
                          className="rounded-xl border px-3.5 py-2 text-[0.78rem] font-semibold transition-all"
                          style={on
                            ? { background: `${GOLD}22`, borderColor: `${GOLD}55`, color: GOLD }
                            : { background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.38)" }}>
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q2 — Budget */}
                <div className="mb-5">
                  <p className="mb-2 text-[0.7rem] font-bold text-white/40">
                    <span className="mr-1.5 text-amber-400/70">2.</span>
                    Quel est votre budget ? <span className="text-white/20">(optionnel)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Moins de 100€", "100 – 500€", "500 – 2 000€", "Plus de 2 000€", "À définir"].map(v => {
                      const on = demandeForm.budget === v;
                      return (
                        <button key={v} type="button"
                          onClick={() => setDemandeForm(f => ({ ...f, budget: on ? "" : v }))}
                          className="rounded-xl border px-3.5 py-2 text-[0.78rem] font-semibold transition-all"
                          style={on
                            ? { background: `${GOLD}22`, borderColor: `${GOLD}55`, color: GOLD }
                            : { background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.38)" }}>
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q3 — Source */}
                <div className="mb-5">
                  <p className="mb-2 text-[0.7rem] font-bold text-white/40">
                    <span className="mr-1.5 text-amber-400/70">3.</span>
                    Comment nous avez-vous découvert ? <span className="text-white/20">(optionnel)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Réseaux sociaux", "Bouche-à-oreille", "Google", "Recommandation", "Autre"].map(v => {
                      const on = demandeForm.source === v;
                      return (
                        <button key={v} type="button"
                          onClick={() => setDemandeForm(f => ({ ...f, source: on ? "" : v }))}
                          className="rounded-xl border px-3.5 py-2 text-[0.78rem] font-semibold transition-all"
                          style={on
                            ? { background: `${GOLD}22`, borderColor: `${GOLD}55`, color: GOLD }
                            : { background: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.38)" }}>
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q4 — Précisions */}
                <div className="mb-5">
                  <p className="mb-2 text-[0.7rem] font-bold text-white/40">
                    <span className="mr-1.5 text-amber-400/70">4.</span>
                    Dites-nous en plus <span className="text-white/20">(optionnel)</span>
                  </p>
                  <textarea value={demandeForm.message}
                    onChange={e => setDemandeForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Décrivez votre besoin, vos attentes…"
                    rows={3} className={`${inputCls} resize-none`} />
                </div>

                <ConsentBlock consent={demandeConsent} onChange={setDemandeConsent} businessName={displayName} />

                <AnimatePresence>{demandeError && <ErrorBox msg={demandeError} />}</AnimatePresence>

                <AnimatePresence mode="wait">
                  {demandeSubmitting ? (
                    <motion.div key="sending"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 py-3 text-sm text-white/50">
                      <Loader2 size={15} className="animate-spin" /> Envoi en cours…
                    </motion.div>
                  ) : (
                    <motion.button key="btn" onClick={submitDemande}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black transition-all hover:brightness-110"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#0a0a0a",
                        opacity: demandeReady ? 1 : 0.45 }}>
                      <Send size={15} />
                      Envoyer mes réponses
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-[0.65rem] text-white/18">
          Transmis de façon sécurisée via DJAMA Premium.
        </p>
      </motion.div>
    </div>
  );
}
