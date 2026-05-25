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

/* ── Google SVG ─────────────────────────────────── */
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

/* ── Champ de formulaire ── */
function AuthField({
  label, type, value, onChange, placeholder, icon: Icon, right, autoComplete, optional,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode; autoComplete?: string; optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/40">
        {label}
        {optional && (
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[0.55rem] normal-case tracking-normal text-white/25">
            optionnel
          </span>
        )}
      </label>
      <div className="relative">
        <motion.div
          animate={{ opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 0 2px ${GOLD}80` }}
        />
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Icon size={15} style={{ color: focused ? GOLD : "rgba(255,255,255,0.25)" }} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-200 hover:border-white/20"
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [nom,          setNom]          = useState("");
  const [email,        setEmail]        = useState("");
  const [telephone,    setTelephone]    = useState("");
  const [password,     setPassword]     = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  async function handleGoogleAuth() {
    setError("");
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/client`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())          { setError("Le nom est requis."); return; }
    if (!email.trim())        { setError("L'adresse e-mail est requise."); return; }
    if (password.length < 8)  { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError("");
    setLoading(true);

    /* 1. Créer le compte — plan gratuit, aucun abonnement */
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: nom.trim(),
          /* Pas de subscription_active, pas de trial — compte gratuit par défaut */
        },
      },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("already been registered")
          ? "Un compte existe déjà avec cet e-mail."
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Erreur lors de la création du compte. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    /* 2. Insérer le profil dans la table clients (best-effort) */
    await supabase.from("clients").insert({
      id:        userId,
      nom:       nom.trim(),
      email:     email.trim().toLowerCase(),
      telephone: telephone.trim() || null,
      statut:    "actif",
    });

    setSuccess(true);
    setLoading(false);

    /* 3. Si session immédiate (confirm email désactivé) → espace client */
    if (data.session) {
      setTimeout(() => { window.location.href = "/client"; }, 1200);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a0f] px-4 py-12">

      {/* Glows d'arrière-plan */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(176,141,87,0.07)] blur-[120px]" />
        <div className="absolute left-[-100px] top-[10%] h-[300px] w-[300px] rounded-full bg-[rgba(59,157,255,0.04)] blur-[80px]" />
        <div className="absolute bottom-[10%] right-[-80px] h-[250px] w-[250px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Bordure glow */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-[rgba(201,165,90,0.12)] to-transparent opacity-70 blur-sm" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f1117]/90 px-6 py-7 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mb-7 flex flex-col items-center gap-3 text-center"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}28` }}
            >
              {/* DJAMA monogramme */}
              <span className="text-xl font-black" style={{ color: GOLD }}>D</span>
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, color: GOLD }}
              >
                Gratuit · Aucune carte requise
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-white">
                Centralisez votre activité
              </h1>
              <p className="mt-1 text-sm text-white/35">
                Vos outils professionnels dans un seul espace
              </p>
            </div>
          </motion.div>

          {/* Bouton Google */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
          >
            <motion.button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading || success}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/6 py-3.5 text-sm font-semibold text-white/85 transition-all duration-200 hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
            >
              {googleLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-white/70"
                />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </motion.button>
          </motion.div>

          {/* Séparateur OU */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/25">ou</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Formulaire */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <AuthField
              label="Nom complet" type="text" value={nom} onChange={setNom}
              placeholder="Jean Dupont" icon={User} autoComplete="name"
            />

            <AuthField
              label="Adresse e-mail" type="email" value={email} onChange={setEmail}
              placeholder="vous@exemple.com" icon={Mail} autoComplete="email"
            />

            <AuthField
              label="Téléphone" type="tel" value={telephone} onChange={setTelephone}
              placeholder="+33 6 00 00 00 00" icon={Phone} autoComplete="tel"
              optional
            />

            <AuthField
              label="Mot de passe" type={showPwd ? "text" : "password"}
              value={password} onChange={setPassword}
              placeholder="Minimum 8 caractères"
              icon={Lock} autoComplete="new-password"
              right={
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="text-white/30 transition hover:text-white/60">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-xs leading-relaxed text-red-300">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3"
                >
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-400" />
                  <p className="text-xs leading-relaxed text-green-300">
                    Compte créé avec succès !<br />
                    <span className="text-green-400/70">Redirection vers votre espace…</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              disabled={loading || success || googleLoading}
              className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-4 text-sm font-extrabold text-[#0a0a0a] shadow-[0_4px_20px_rgba(201,165,90,0.3)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(201,165,90,0.45)] disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70"
                    />
                    Création du compte…
                  </>
                ) : success ? (
                  <><CheckCircle2 size={15} /> Compte créé !</>
                ) : (
                  <>Créer mon espace client <ArrowRight size={15} /></>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Badges de réassurance */}
          <div className="mt-5 flex items-center justify-center gap-4">
            {[
              { src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f512.svg", label: "Données sécurisées" },
              { src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/26a1.svg",  label: "Accès instantané"   },
              { src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2601.svg",  label: "Sauvegarde auto"    },
            ].map(({ src, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" width={13} height={13} />
                <span className="text-[0.6rem] text-white/25">{label}</span>
              </div>
            ))}
          </div>

          {/* Note plan */}
          <p className="mt-3 text-center text-[0.65rem] text-white/20 leading-relaxed">
            Factures, Planning &amp; Bloc-note inclus gratuitement<br />
            Passez à PRO à tout moment depuis votre espace
          </p>

          <p className="mt-4 text-center text-xs text-white/25">
            Déjà un compte ?{" "}
            <Link href="/login"
              className="font-bold underline underline-offset-2 transition-colors hover:text-[#e8cc94]"
              style={{ color: GOLD }}>
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
