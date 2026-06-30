"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";

/* ── Splash ── */
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "#07090e" }}
        >
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.07, 0.16, 0.07] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: GOLD }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease }}
            className="relative mb-10"
          >
            <Image src="/logo-navbar.png" alt="DJAMA" width={200} height={45} className="h-[42px] w-auto object-contain" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            className="relative h-7 w-7"
          >
            <div className="absolute inset-0 rounded-full" style={{ border: `2px solid rgba(${GOLDR},0.18)` }} />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid transparent", borderTopColor: GOLD }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Google icon ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Input dark ── */
function DarkInput({ label, optional, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; optional?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
        {optional && (
          <span className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-normal normal-case tracking-normal" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.30)" }}>
            optionnel
          </span>
        )}
      </label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
        onFocus={(e) => { e.currentTarget.style.border = `1px solid rgba(${GOLDR},0.50)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${GOLDR},0.08)`; (props.onFocus as React.FocusEventHandler<HTMLInputElement> | undefined)?.(e); }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; (props.onBlur as React.FocusEventHandler<HTMLInputElement> | undefined)?.(e); }}
      />
    </div>
  );
}

export default function RegisterPage() {
  const [nom,           setNom]           = useState("");
  const [email,         setEmail]         = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  async function handleGoogleAuth() {
    setError(""); setGoogleLoading(true); setShowSplash(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/client`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); setShowSplash(false); }
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
      setSuccess(true);
      setTimeout(() => { window.location.href = "/client"; }, 1000);
    } else {
      setShowSplash(false);
      setSuccess(true);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(160deg, #0d0821 0%, #080d1a 55%, #060c14 100%)" }}
    >
      <SplashScreen visible={showSplash} />

      {/* Background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[130px]"
          style={{ background: `radial-gradient(circle, rgba(${GOLDR},0.07) 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-10%] right-[10%] h-[300px] w-[300px] rounded-full blur-[100px]"
          style={{ background: "rgba(79,52,130,0.10)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative w-full max-w-[420px]"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease }}
            className="mb-8 flex flex-col items-center"
          >
            <Link href="/" className="mb-6 block">
              <Image
                src="/logo-navbar.png"
                alt="DJAMA"
                width={220}
                height={50}
                className="h-[38px] w-auto object-contain"
                priority
              />
            </Link>
            <h1 className="mb-1.5 text-center text-[1.6rem] font-extrabold leading-tight text-white">
              Créez votre espace DJAMA
            </h1>
            <p className="text-center text-[0.85rem]" style={{ color: `rgba(${GOLDR},0.80)` }}>
              Gratuit · Aucune carte bancaire requise
            </p>
          </motion.div>

          {/* ── Auth buttons ── */}
          <div className="space-y-3">
            {/* Google */}
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12, ease }}
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading || success}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center rounded-xl py-3.5 text-[0.9rem] font-medium transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            >
              <span className="flex w-12 shrink-0 items-center justify-center">
                {googleLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)" }}
                  />
                ) : (
                  <GoogleIcon />
                )}
              </span>
              <span className="flex-1 text-center pr-12">
                {googleLoading ? "Connexion…" : "Continuer avec Google"}
              </span>
            </motion.button>

            {/* Divider */}
            {!showForm && (
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-[0.72rem]" style={{ color: "rgba(255,255,255,0.25)" }}>ou</span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            )}

            {/* Email toggle */}
            {!showForm && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18, ease }}
                type="button"
                onClick={() => setShowForm(true)}
                whileTap={{ scale: 0.985 }}
                className="flex w-full items-center rounded-xl py-3.5 text-[0.9rem] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              >
                <span className="flex w-12 shrink-0 items-center justify-center" style={{ color: "rgba(255,255,255,0.50)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <span className="flex-1 text-center pr-12">Continuer avec E-mail</span>
              </motion.button>
            )}
          </div>

          {/* ── Email form ── */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease }}
                onSubmit={handleRegister}
                className="overflow-hidden"
              >
                {/* Divider */}
                <div className="flex items-center gap-3 py-4">
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-[0.72rem]" style={{ color: "rgba(255,255,255,0.25)" }}>inscription par e-mail</span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>

                <div className="space-y-3.5">
                  <DarkInput
                    label="Nom complet"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    required
                    autoFocus
                  />
                  <DarkInput
                    label="Adresse e-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                  />
                  <DarkInput
                    label="Téléphone"
                    optional
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    autoComplete="tel"
                  />

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 caractères"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                        onFocus={(e) => { e.currentTarget.style.border = `1px solid rgba(${GOLDR},0.50)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${GOLDR},0.08)`; }}
                        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden rounded-xl px-3.5 py-3"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}
                      >
                        <div className="flex gap-2.5">
                          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                          <p className="text-xs" style={{ color: "rgba(255,160,160,0.90)" }}>{error}</p>
                        </div>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-xl px-3.5 py-3"
                        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)" }}
                      >
                        <div className="flex gap-2.5">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                          <p className="text-xs" style={{ color: "rgba(110,230,180,0.90)" }}>
                            Compte créé ! Vérifiez votre email pour activer votre compte.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || success || googleLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[0.92rem] font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, rgba(${GOLDR},0.90) 0%, rgba(${GOLDR},0.70) 100%)`, boxShadow: `0 4px 20px rgba(${GOLDR},0.22)` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px rgba(${GOLDR},0.35)`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(${GOLDR},0.22)`; }}
                  >
                    {loading ? "Création du compte…" : success ? "Compte créé !" : (
                      <>Créer mon espace client <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ── Footer ── */}
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold transition"
                style={{ color: GOLD }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                Se connecter
              </Link>
            </p>
            <p className="text-[0.68rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
              En continuant, vous acceptez les{" "}
              <Link href="/legal/cgu" className="underline underline-offset-2 transition hover:opacity-70">
                CGU
              </Link>{" "}
              et la{" "}
              <Link href="/legal/confidentialite" className="underline underline-offset-2 transition hover:opacity-70">
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom links */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-[0.72rem]" style={{ color: "rgba(255,255,255,0.22)" }}>
          <Link href="/legal/confidentialite" className="transition hover:opacity-60">Confidentialité</Link>
          <span>·</span>
          <Link href="/legal/cgu" className="transition hover:opacity-60">Conditions</Link>
          <span>·</span>
          <Link href="/contact" className="transition hover:opacity-60">Besoin d&apos;aide ?</Link>
        </div>
      </motion.div>
    </div>
  );
}
