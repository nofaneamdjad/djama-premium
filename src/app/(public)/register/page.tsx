"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Splash screen style Odoo — barre indéterminée ── */
function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090e]"
        >
          {/* Glow pulsant */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.07, 0.15, 0.07] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-[420px] w-[420px] rounded-full blur-[130px]"
            style={{ background: GOLD }}
          />

          {/* Logo */}
          <motion.span
            initial={{ opacity: 0, scale: 0.82, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
            className="relative mb-10 text-[3rem] font-black text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            DJAMA
          </motion.span>

          {/* Track */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-[200px] overflow-hidden rounded-full"
            style={{ height: "2px", background: "rgba(255,255,255,0.08)" }}
          >
            {/* Segment qui balaie en boucle */}
            <motion.div
              className="absolute top-0 h-full w-[45%] rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
              animate={{ x: ["-110%", "280%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Google SVG ── */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Champ animé ── */
function AuthField({
  label, type, value, onChange, placeholder, icon: Icon, right, autoComplete, optional, delay = 0,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode;
  autoComplete?: string; optional?: boolean; delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      className="flex flex-col gap-1.5"
    >
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/35">
        {label}
        {optional && (
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.5rem] normal-case tracking-normal text-white/20">
            optionnel
          </span>
        )}
      </label>
      <div className="relative">
        <motion.div
          animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.98 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 0 2px ${GOLD}70, 0 0 20px ${GOLD}18` }}
        />
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200">
          <Icon size={14} style={{ color: focused ? GOLD : "rgba(255,255,255,0.2)" }} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]"
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const [nom,           setNom]           = useState("");
  const [email,         setEmail]         = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  async function handleGoogleAuth() {
    setError(""); setGoogleLoading(true); setShowSplash(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/client`, queryParams: { access_type: "offline", prompt: "select_account" } },
    });
    if (err) { setError(err.message); setGoogleLoading(false); setShowSplash(false); }
    /* Si OK → redirection navigateur, splash reste */
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())         { setError("Le nom est requis."); return; }
    if (!email.trim())       { setError("L'adresse e-mail est requise."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError(""); setLoading(true); setShowSplash(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: nom.trim() } },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")
          ? "Un compte existe déjà avec cet e-mail."
          : signUpError.message
      );
      setLoading(false); setShowSplash(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Erreur lors de la création. Réessayez.");
      setLoading(false); setShowSplash(false);
      return;
    }

    await supabase.from("clients").insert({
      id: userId, nom: nom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim() || null,
      statut: "actif",
    });

    setLoading(false);

    if (data.session) {
      /* Session immédiate → redirection, splash reste affiché */
      setSuccess(true);
      setTimeout(() => { window.location.href = "/client"; }, 1000);
    } else {
      /* Email de confirmation requis → cacher splash, montrer message */
      setShowSplash(false);
      setSuccess(true);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090e] px-4 py-12">

      <SplashScreen visible={showSplash} />

      {/* ── Animated background orbs ── */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.06, 0.11, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{ background: "rgba(201,165,90,1)" }}
        />
        <motion.div
          animate={{ y: [0, -28, 0], x: [0, 12, 0], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -left-16 top-[12%] h-[320px] w-[320px] rounded-full blur-[90px]"
          style={{ background: "rgba(59,130,246,1)" }}
        />
        <motion.div
          animate={{ y: [0, 22, 0], x: [0, -14, 0], opacity: [0.04, 0.07, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-8 -right-12 h-[280px] w-[280px] rounded-full blur-[100px]"
          style={{ background: "rgba(139,92,246,1)" }}
        />
        <div className="absolute inset-0 opacity-[0.012]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }} />
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Outer glow */}
        <motion.div
          animate={{ opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[2.5rem] blur-md"
          style={{ background: `linear-gradient(135deg, ${GOLD}16, transparent 50%, rgba(99,102,241,0.07))` }}
        />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-[#0d0f16]/95 px-6 py-7 shadow-[0_40px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-8">

          {/* Animated gold top line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 h-[1px] origin-left"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)` }}
          />

          {/* Inner glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${GOLD}0e` }} />

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease }}
            className="relative mb-7 flex flex-col items-center gap-3 text-center"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.22 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}28`, boxShadow: `0 8px 28px ${GOLD}18` }}
            >
              <span className="text-2xl font-black" style={{ color: GOLD }}>D</span>
            </motion.div>
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.34, ease }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ borderColor: `${GOLD}22`, background: `${GOLD}0c`, color: GOLD }}
              >
                Gratuit · Aucune carte requise
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.42, ease }}
                className="mt-3 text-2xl font-extrabold text-white"
              >
                Centralisez votre activité
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-1 text-sm text-white/30"
              >
                Vos outils professionnels dans un seul espace
              </motion.p>
            </div>
          </motion.div>

          {/* ── Google ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.42, ease }}
          >
            <motion.button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading || success}
              whileHover={{ scale: 1.02, y: -1, boxShadow: "0 8px 24px rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] py-3 text-sm font-semibold text-white/75 transition-all duration-200 hover:border-white/18 hover:bg-white/[0.08] disabled:opacity-50"
            >
              {googleLoading
                ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-white/70" />
                : <GoogleIcon />
              }
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </motion.button>
          </motion.div>

          {/* ── Separator ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="my-5 flex items-center gap-3"
          >
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/20">ou</span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
          </motion.div>

          {/* ── Form ── */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            <AuthField label="Nom complet"    type="text"     value={nom}       onChange={setNom}       placeholder="Jean Dupont"         icon={User}  autoComplete="name"         delay={0.52} />
            <AuthField label="Adresse e-mail" type="email"    value={email}     onChange={setEmail}     placeholder="vous@exemple.com"    icon={Mail}  autoComplete="email"        delay={0.58} />
            <AuthField label="Téléphone"      type="tel"      value={telephone} onChange={setTelephone} placeholder="+33 6 00 00 00 00"   icon={Phone} autoComplete="tel"          delay={0.64} optional />
            <AuthField label="Mot de passe"   type={showPwd ? "text" : "password"} value={password} onChange={setPassword}
              placeholder="Minimum 8 caractères" icon={Lock} autoComplete="new-password" delay={0.70}
              right={
                <button type="button" onClick={() => setShowPwd(v => !v)} className="text-white/25 transition hover:text-white/55">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  transition={{ duration:0.22 }}
                  className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <div className="flex gap-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-400" />
                    <p className="text-xs text-green-300">Compte créé ! Redirection…</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.76, ease }}
            >
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2, boxShadow: `0 12px 36px ${GOLD}45` }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || success || googleLoading}
                className="group relative mt-1 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-[#0a0a0a] disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 20px ${GOLD}30` }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60" />
                      Création du compte…
                    </>
                  ) : success ? (
                    <><CheckCircle2 size={14} /> Compte créé !</>
                  ) : (
                    <>
                      Créer mon espace client
                      <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                        <ArrowRight size={14} />
                      </motion.span>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* ── Note plan ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.82 }}
            className="mt-4 text-center text-[0.62rem] text-white/18 leading-relaxed"
          >
            Factures, Planning &amp; Bloc-note inclus gratuitement<br />
            Passez à PRO à tout moment depuis votre espace
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.88 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            <p className="whitespace-nowrap text-xs text-white/25">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-bold transition-colors hover:text-[#e8cc94]" style={{ color: GOLD }}>
                Se connecter
              </Link>
            </p>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
