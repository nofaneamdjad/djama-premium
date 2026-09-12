"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Spinner ── */
function Spinner({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(255,255,255,0.8)" : GOLD;
  const f = light ? "rgba(255,255,255,0.2)" : "rgba(201,165,90,0.2)";
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
      className="inline-block h-[18px] w-[18px] rounded-full shrink-0"
      style={{ borderWidth: 2, borderStyle: "solid", borderTopColor: c, borderRightColor: f, borderBottomColor: f, borderLeftColor: f }}
    />
  );
}

/* ── Google icon ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ── Team icon ── */
function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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
          style={{ background: "#0d0821" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease }}
          >
            <Image src="/logo-white.png" alt="DJAMA" width={200} height={50} className="h-[44px] w-auto object-contain" />
          </motion.div>
          <div className="absolute bottom-12 left-8 right-8 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: GOLD }}
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main ── */
function LoginPageInner() {
  const searchParams = useSearchParams();
  const rawRedirect  = searchParams.get("redirect") ?? "/client";
  const redirectTo   = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/client";

  const [step,          setStep]          = useState<"welcome" | "form">("welcome");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [phase,         setPhase]         = useState<"idle" | "auth" | "redirecting">("idle");
  const [resending,     setResending]     = useState(false);
  const [error,         setError]         = useState("");
  const [errorType,     setErrorType]     = useState<"credentials" | "other" | null>(null);
  const [resendOk,      setResendOk]      = useState(false);

  async function handleGoogleAuth() {
    setError(""); setGoogleLoading(true); setShowSplash(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); setShowSplash(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setErrorType(null); setResendOk(false);
    setShowSplash(true); setLoading(true); setPhase("auth");
    let willRedirect = false;
    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (sbError) {
        setError(
          sbError.message.includes("Invalid login credentials") || sbError.message.includes("invalid_credentials")
            ? "Email ou mot de passe incorrect."
            : sbError.message.includes("Email not confirmed")
            ? "Adresse email non confirmée. Vérifiez vos spams."
            : `Erreur : ${sbError.message}`
        );
        setErrorType("credentials");
        return;
      }
      if (!data.session) { setError("Session non créée. Vérifiez votre email."); setErrorType("credentials"); return; }
      const dest = data.session.user.user_metadata?.needs_password_reset ? "/client/profil?reset=1" : redirectTo;
      setPhase("redirecting"); willRedirect = true;
      window.location.href = dest;
    } catch {
      setError("Erreur inattendue. Vérifiez votre connexion."); setErrorType("other");
    } finally {
      if (!willRedirect) { setLoading(false); setPhase("idle"); setShowSplash(false); }
    }
  }

  async function handleResend() {
    if (!email.trim()) { setError("Saisissez votre email ci-dessus."); return; }
    setResending(true);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
    setResending(false);
    if (err) setError(`Impossible de renvoyer : ${err.message}`);
    else { setResendOk(true); setError(""); }
  }

  return (
    <>
      <style>{`
        .btn-gold { background-color: #c9a55a; color: #fff; }
        .btn-gold:hover:not(:disabled) { background-color: #d4b06a; }
        .btn-outline:hover { background-color: #f8f9fa; }
        .field-wrap:focus-within { border-color: #c9a55a !important; }
        .link-gold { color: #c9a55a; }
        .link-gold:hover { text-decoration: underline; text-underline-offset: 2px; }
      `}</style>

      <div className="relative flex min-h-screen flex-col bg-white">
        <SplashScreen visible={showSplash} />

        <AnimatePresence mode="wait">

          {/* ══ Écran d'accueil ══ */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-1 flex-col items-center min-h-screen"
            >
              {/* Contenu centré */}
              <div className="flex flex-1 flex-col items-center justify-center w-full max-w-[420px] mx-auto px-6 py-16 gap-10">

                {/* Logo + titre + sous-titre */}
                <div className="flex flex-col items-center gap-6 text-center w-full">
                  <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm" style={{ "--tw-ring-color": GOLD } as React.CSSProperties}>
                    <Image
                      src="/logo-transparent.png"
                      alt="DJAMA"
                      width={160}
                      height={54}
                      className="h-[44px] w-auto object-contain"
                      priority
                    />
                  </Link>
                  <div className="space-y-2.5">
                    <h1 className="text-[1.65rem] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                      Bienvenue sur DJAMA
                    </h1>
                    <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                      Connectez-vous pour accéder à votre espace de travail.
                    </p>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="w-full flex flex-col gap-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.08, ease }}
                    onClick={() => setStep("form")}
                    whileTap={{ scale: 0.985 }}
                    className="btn-gold w-full h-[50px] rounded-xl text-[0.94rem] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ outlineColor: GOLD }}
                  >
                    Se connecter
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.14, ease }}
                  >
                    <Link
                      href="/register"
                      className="btn-outline flex w-full h-[50px] items-center justify-center rounded-xl text-[0.94rem] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        border: "1.5px solid rgba(17,24,39,.15)",
                        color: "var(--text-primary)",
                        outlineColor: GOLD,
                      }}
                    >
                      Créer un compte
                    </Link>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.20, ease }}
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading}
                    whileTap={{ scale: 0.985 }}
                    className="btn-outline flex w-full h-[50px] items-center justify-center gap-2.5 rounded-xl text-[0.92rem] font-medium transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      border: "1.5px solid rgba(17,24,39,.12)",
                      color: "var(--text-primary)",
                      outlineColor: GOLD,
                    }}
                  >
                    {googleLoading ? <Spinner /> : <GoogleIcon />}
                    {googleLoading ? "Connexion…" : "Continuer avec Google"}
                  </motion.button>
                </div>

                {/* Accès membre d'équipe */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.30, ease }}
                >
                  <Link
                    href="/client"
                    className="flex items-center gap-1.5 text-[0.81rem] font-medium transition-colors hover:underline underline-offset-2"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    <TeamIcon />
                    Accès membre d&apos;équipe
                  </Link>
                </motion.div>
              </div>

              {/* Footer */}
              <footer className="w-full pb-8 flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[0.72rem]" style={{ color: "var(--ink-muted)" }}>
                  <Link href="/legal/confidentialite" className="transition-colors hover:underline underline-offset-2">Confidentialité</Link>
                  <span aria-hidden className="opacity-40">·</span>
                  <Link href="/legal/cgu" className="transition-colors hover:underline underline-offset-2">Conditions</Link>
                  <span aria-hidden className="opacity-40">·</span>
                  <Link href="/contact" className="transition-colors hover:underline underline-offset-2">Aide</Link>
                </div>
                <p className="text-[0.67rem]" style={{ color: "var(--ink-faint)" }}>© 2026 DJAMA</p>
              </footer>
            </motion.div>
          )}

          {/* ══ Formulaire de connexion ══ */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-1 flex-col min-h-screen px-6 py-10"
            >
              <div className="w-full max-w-[420px] mx-auto flex flex-col flex-1">

                {/* Bouton retour */}
                <button
                  onClick={() => { setStep("welcome"); setError(""); }}
                  className="mb-8 flex items-center gap-1.5 self-start text-[0.82rem] font-medium transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                  style={{ color: "var(--ink-secondary)", outlineColor: GOLD }}
                >
                  <ChevronLeft size={15} strokeWidth={2.5} />
                  Retour
                </button>

                {/* Logo */}
                <div className="mb-7 flex justify-center">
                  <Link href="/">
                    <Image
                      src="/logo-transparent.png"
                      alt="DJAMA"
                      width={140}
                      height={47}
                      className="h-[36px] w-auto object-contain"
                      priority
                    />
                  </Link>
                </div>

                {/* Titre */}
                <div className="mb-7 text-center">
                  <h1 className="text-[1.4rem] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Connexion
                  </h1>
                  <p className="mt-1.5 text-[0.86rem]" style={{ color: "var(--ink-secondary)" }}>
                    Votre espace professionnel DJAMA
                  </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-3">
                  {/* Email */}
                  <div
                    className="field-wrap rounded-xl px-4 py-3 transition-all"
                    style={{ border: "1.5px solid rgba(17,24,39,.12)", background: "#fafafa" }}
                  >
                    <label className="block mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      required
                      autoFocus
                      className="w-full bg-transparent text-[0.93rem] outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>

                  {/* Mot de passe */}
                  <div
                    className="field-wrap rounded-xl px-4 py-3 transition-all"
                    style={{ border: "1.5px solid rgba(17,24,39,.12)", background: "#fafafa" }}
                  >
                    <div className="mb-0.5 flex items-center justify-between">
                      <label className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                        Mot de passe
                      </label>
                      <Link href="/forgot-password" className="link-gold text-[0.72rem] font-medium transition-colors">
                        Oublié ?
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        className="flex-1 bg-transparent text-[0.93rem] outline-none"
                        style={{ color: "var(--text-primary)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="shrink-0 transition-opacity hover:opacity-50"
                        style={{ color: "var(--ink-muted)" }}
                        aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <AnimatePresence mode="wait">
                    {resendOk && (
                      <motion.div
                        key="ok"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-xl px-3.5 py-3"
                        style={{ background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.22)" }}
                      >
                        <div className="flex gap-2">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                          <p className="text-xs" style={{ color: "#065f46" }}>
                            Email renvoyé à <strong>{email}</strong>. Vérifiez vos spams.
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {error && (
                      <motion.div
                        key="err"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden rounded-xl px-3.5 py-3"
                        style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.18)" }}
                      >
                        <div className="flex gap-2">
                          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                          <div>
                            <p className="text-xs" style={{ color: "#991b1b" }}>{error}</p>
                            {errorType === "credentials" && (
                              <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="mt-1.5 flex items-center gap-1 text-[0.67rem] font-semibold underline underline-offset-2 transition-opacity disabled:opacity-50"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                <RefreshCw size={9} className={resending ? "animate-spin" : ""} />
                                {resending ? "Envoi…" : "Renvoyer l'email de confirmation"}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.985 }}
                    disabled={loading || googleLoading}
                    className="btn-gold w-full h-[50px] rounded-xl text-[0.94rem] font-semibold transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ outlineColor: GOLD }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner light />
                        {phase === "auth" ? "Vérification…" : "Ouverture…"}
                      </span>
                    ) : "Se connecter"}
                  </motion.button>
                </form>

                {/* Séparateur */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "rgba(17,24,39,.09)" }} />
                  <span className="text-[0.72rem]" style={{ color: "var(--ink-muted)" }}>ou</span>
                  <div className="h-px flex-1" style={{ background: "rgba(17,24,39,.09)" }} />
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || loading}
                  className="btn-outline mt-3 flex w-full h-[50px] items-center justify-center gap-2.5 rounded-xl text-[0.92rem] font-medium transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    border: "1.5px solid rgba(17,24,39,.12)",
                    color: "var(--text-primary)",
                    outlineColor: GOLD,
                  }}
                >
                  {googleLoading ? <Spinner /> : <GoogleIcon />}
                  {googleLoading ? "Connexion…" : "Continuer avec Google"}
                </button>

                <p className="mt-6 text-center text-[0.85rem]" style={{ color: "var(--ink-secondary)" }}>
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="link-gold font-semibold transition-colors">
                    Créer un compte
                  </Link>
                </p>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageInner />
    </Suspense>
  );
}
