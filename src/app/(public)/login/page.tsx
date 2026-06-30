"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const BG    = "#0d0821";

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
          style={{ background: BG }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease }}
          >
            <Image src="/logo-navbar.png" alt="DJAMA" width={220} height={50} className="h-[46px] w-auto object-contain" />
          </motion.div>

          {/* Progress bar Odoo-style */}
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

/* ── Google icon ── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Page ── */
function LoginPageInner() {
  const searchParams = useSearchParams();
  const rawRedirect  = searchParams.get("redirect") ?? "/client";
  const redirectTo   = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/client";

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [phase,         setPhase]         = useState<"idle"|"auth"|"redirecting">("idle");
  const [resending,     setResending]     = useState(false);
  const [error,         setError]         = useState("");
  const [errorType,     setErrorType]     = useState<"credentials"|"other"|null>(null);
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
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-5 pb-10 pt-14"
      style={{ background: `linear-gradient(175deg, #1a0c35 0%, ${BG} 50%, #060c18 100%)` }}
    >
      <SplashScreen visible={showSplash} />

      {/* Orb */}
      <div aria-hidden className="pointer-events-none fixed left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[100px] opacity-25"
        style={{ background: `rgba(${GOLDR},0.40)` }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[420px]"
      >
        {/* Logo — grand, centré */}
        <div className="mb-12 flex justify-center">
          <Link href="/">
            <Image src="/logo-navbar.png" alt="DJAMA" width={240} height={54} className="h-[48px] w-auto object-contain" priority />
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">

          {/* Email */}
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <p className="mb-0.5 text-[0.68rem] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
              Adresse e-mail
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
              autoFocus
              className="w-full bg-transparent text-[0.95rem] text-white placeholder:text-white/25 outline-none"
            />
          </div>

          {/* Password */}
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div className="mb-0.5 flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Mot de passe</p>
              <Link
                href="/forgot-password"
                className="text-[0.68rem] font-medium transition"
                style={{ color: `rgba(${GOLDR},0.70)` }}
              >
                Oublié ?
              </Link>
            </div>
            <div className="flex items-center">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="flex-1 bg-transparent text-[0.95rem] text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="ml-2 shrink-0 transition"
                style={{ color: "rgba(255,255,255,0.35)" }}
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
                className="overflow-hidden rounded-xl px-3.5 py-3"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)" }}
              >
                <div className="flex gap-2.5">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                  <p className="text-xs" style={{ color: "rgba(110,230,180,0.90)" }}>
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
                style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}
              >
                <div className="flex gap-2.5">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                  <div>
                    <p className="text-xs" style={{ color: "rgba(255,160,160,0.90)" }}>{error}</p>
                    {errorType === "credentials" && (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="mt-1.5 flex items-center gap-1 text-[0.68rem] font-semibold underline underline-offset-2 transition disabled:opacity-50"
                        style={{ color: "rgba(255,255,255,0.55)" }}
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

          {/* CTA Se connecter */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={loading || googleLoading}
            className="w-full rounded-2xl py-4 text-[1rem] font-bold uppercase tracking-wide text-white transition-all disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, rgba(${GOLDR},0.95) 0%, rgba(${GOLDR},0.72) 100%)`,
              boxShadow: `0 6px 24px rgba(${GOLDR},0.28)`,
              letterSpacing: "0.06em",
            }}
          >
            {loading
              ? phase === "auth" ? "Vérification…" : "Ouverture…"
              : "SE CONNECTER"}
          </motion.button>
        </form>

        {/* Google */}
        <div className="mt-3">
          <motion.button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            whileTap={{ scale: 0.985 }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[0.95rem] font-semibold transition-all disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.80)" }}
          >
            {googleLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 rounded-full"
                style={{ border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)" }}
              />
            ) : <GoogleIcon />}
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </motion.button>
        </div>

        {/* Créer un compte */}
        <p className="mt-8 text-center text-[0.95rem] font-semibold" style={{ color: GOLD }}>
          <Link href="/register" className="transition hover:opacity-75">
            Créer un compte
          </Link>
        </p>

        {/* Terms */}
        <p className="mt-6 text-center text-[0.70rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
          En continuant, vous acceptez les{" "}
          <Link href="/legal/cgu" className="underline underline-offset-2 transition hover:opacity-60">CGU</Link>{" "}
          et la{" "}
          <Link href="/legal/confidentialite" className="underline underline-offset-2 transition hover:opacity-60">Politique de confidentialité</Link>
        </p>

        {/* Bottom links */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-[0.70rem]" style={{ color: "rgba(255,255,255,0.18)" }}>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: BG }} />}>
      <LoginPageInner />
    </Suspense>
  );
}
