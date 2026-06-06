"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Splash screen style Odoo ── */
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
          {/* Orb centré correctement */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: GOLD }}
          />
          {/* Logo DJAMA */}
          <motion.span
            initial={{ opacity: 0, scale: 0.82, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
            className="relative mb-10 text-[3rem] font-black text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            DJAMA
          </motion.span>
          {/* Spinner circulaire gold */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            className="relative h-7 w-7"
          >
            {/* Track */}
            <div className="absolute inset-0 rounded-full"
              style={{ border: `2px solid rgba(201,165,90,0.18)` }} />
            {/* Arc tournant */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid transparent`, borderTopColor: GOLD }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Mail SVG ── */
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

/* ── Page ── */
function LoginPageInner() {
  const searchParams = useSearchParams();
  /* Fix #3 — only allow relative internal paths, never external URLs */
  const rawRedirect  = searchParams.get("redirect") ?? "/client";
  const redirectTo   = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/client";

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [phase,         setPhase]         = useState<"idle"|"auth"|"redirecting">("idle");
  const [resending,     setResending]     = useState(false);
  const [error,         setError]         = useState("");
  const [errorType,     setErrorType]     = useState<"credentials"|"other"|null>(null);
  const [resendOk,      setResendOk]      = useState(false);

  // Pas de signOut automatique — cela détruisait les sessions OAuth

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
    setError(""); setErrorType(null); setResendOk(false); setShowSplash(true);
    setLoading(true); setPhase("auth");
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
      /* Fix #5 — /definir-mot-de-passe n'existe pas, rediriger vers profil avec flag */
      const dest = data.session.user.user_metadata?.needs_password_reset
        ? "/client/profil?reset=1"
        : redirectTo;
      setPhase("redirecting"); willRedirect = true;
      window.location.href = dest;
    } catch {
      setError("Erreur inattendue. Vérifiez votre connexion.");
      setErrorType("other");
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
    <div className="flex min-h-screen flex-col items-center bg-white px-4 pt-[15vh] pb-24">

      <SplashScreen visible={showSplash} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[380px]"
      >
        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8 flex flex-col items-center"
        >
          <div
            className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <Image
              src="/logo.png"
              alt="DJAMA"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <h1 className="mb-2 text-center text-[1.85rem] font-extrabold leading-tight text-gray-900">
            Bon retour sur DJAMA.
          </h1>
          <p className="text-center text-[0.95rem] text-gray-500">
            Connectez-vous à votre espace client
          </p>
        </motion.div>

        {/* ── Auth buttons ── */}
        <div className="space-y-3">
          {/* Google */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease }}
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            whileHover={{ backgroundColor: "#f5f5f5" }}
            whileTap={{ scale: 0.985 }}
            className="flex w-full items-center rounded-2xl border border-gray-200 bg-white py-4 text-[0.95rem] font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <span className="flex w-14 shrink-0 items-center justify-center">
              {googleLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-500"
                />
              ) : (
                <GoogleIcon />
              )}
            </span>
            <span className="flex-1 text-center pr-14">
              {googleLoading ? "Connexion…" : "Google"}
            </span>
          </motion.button>

          {/* Email toggle button */}
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18, ease }}
              type="button"
              onClick={() => setShowForm(true)}
              whileHover={{ backgroundColor: "#f5f5f5" }}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center rounded-2xl border border-gray-200 bg-white py-4 text-[0.95rem] font-medium text-gray-700 shadow-sm transition-colors"
            >
              <span className="flex w-14 shrink-0 items-center justify-center text-gray-500">
                <MailIcon />
              </span>
              <span className="flex-1 text-center pr-14">E-mail</span>
            </motion.button>
          )}
        </div>

        {/* ── Email form (expanded) ── */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              onSubmit={handleLogin}
              className="overflow-hidden"
            >
              <div className="mt-2.5 space-y-3">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
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
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">
                      Mot de passe
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-gray-400 transition hover:text-gray-700"
                    >
                      Oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-900/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      className="overflow-hidden rounded-lg border border-green-100 bg-green-50 px-3 py-2.5"
                    >
                      <div className="flex gap-2">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" />
                        <p className="text-xs text-green-700">
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
                      className="overflow-hidden rounded-lg border border-red-100 bg-red-50 px-3 py-2.5"
                    >
                      <div className="flex gap-2">
                        <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                        <div>
                          <p className="text-xs text-red-600">{error}</p>
                          {errorType === "credentials" && (
                            <button
                              type="button"
                              onClick={handleResend}
                              disabled={resending}
                              className="mt-1.5 flex items-center gap-1 text-[0.68rem] font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:opacity-50"
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
                  whileHover={{ backgroundColor: "#111827" }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading || googleLoading}
                  className="w-full rounded-2xl bg-gray-900 py-3.5 text-[0.95rem] font-semibold text-white transition-colors disabled:opacity-60"
                >
                  {loading
                    ? phase === "auth"
                      ? "Vérification…"
                      : "Ouverture…"
                    : "Se connecter"}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Footer links ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Nouveau sur DJAMA ?{" "}
            <Link
              href="/register"
              className="font-semibold text-gray-900 underline underline-offset-2 transition hover:text-gray-700"
            >
              Créer un compte
            </Link>
          </p>
        </motion.div>

        {/* ── Terms ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-5 text-center text-[0.68rem] leading-relaxed text-gray-400"
        >
          En continuant, vous reconnaissez avoir compris et accepté les{" "}
          <Link href="/legal/cgu" className="underline hover:text-gray-600">
            Conditions générales
          </Link>{" "}
          et la{" "}
          <Link href="/legal/confidentialite" className="underline hover:text-gray-600">
            Politique de confidentialité
          </Link>
        </motion.p>
      </motion.div>

      {/* ── Bottom nav ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-auto flex flex-wrap justify-center gap-4 text-xs text-gray-400"
      >
        <Link href="/legal/confidentialite" className="hover:text-gray-600">Confidentialité</Link>
        <span>·</span>
        <Link href="/legal/cgu" className="hover:text-gray-600">Conditions</Link>
        <span>·</span>
        <Link href="/contact" className="hover:text-gray-600">Besoin d&apos;aide ?</Link>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageInner />
    </Suspense>
  );
}
