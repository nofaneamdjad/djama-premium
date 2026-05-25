"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Lock, Mail, AlertCircle,
  ArrowRight, RefreshCw, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

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
  label, type, value, onChange, placeholder, icon: Icon, right, autoComplete, delay = 0,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode; autoComplete?: string; delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      className="flex flex-col gap-1.5"
    >
      <label className="text-xs font-bold uppercase tracking-widest text-white/35">{label}</label>
      <div className="relative">
        {/* Focus ring */}
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
          required
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]"
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </motion.div>
  );
}

/* ── Page ── */
function LoginPageInner() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/client";

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phase,         setPhase]         = useState<"idle"|"auth"|"checking"|"redirecting">("idle");
  const [resending,     setResending]     = useState(false);
  const [error,         setError]         = useState("");
  const [errorType,     setErrorType]     = useState<"credentials"|"other"|null>(null);
  const [resendOk,      setResendOk]      = useState(false);

  useEffect(() => { supabase.auth.signOut(); }, []);

  async function handleGoogleAuth() {
    setError(""); setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/client`, queryParams: { access_type: "offline", prompt: "select_account" } },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setErrorType(null); setResendOk(false);
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
      const dest = data.session.user.user_metadata?.needs_password_reset ? "/definir-mot-de-passe" : redirectTo;
      setPhase("redirecting"); willRedirect = true;
      window.location.href = dest;
    } catch {
      setError("Erreur inattendue. Vérifiez votre connexion.");
      setErrorType("other");
    } finally {
      if (!willRedirect) { setLoading(false); setPhase("idle"); }
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090e] px-4 py-8">

      {/* ── Animated background orbs ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Central gold orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{ background: "rgba(201,165,90,1)" }}
        />
        {/* Blue orb top-left */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -left-20 top-[8%] h-[350px] w-[350px] rounded-full blur-[90px]"
          style={{ background: "rgba(59,130,246,1)" }}
        />
        {/* Purple orb bottom-right */}
        <motion.div
          animate={{ y: [0, 25, 0], x: [0, -18, 0], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-10 -right-16 h-[300px] w-[300px] rounded-full blur-[100px]"
          style={{ background: "rgba(139,92,246,1)" }}
        />
        {/* Subtle grid */}
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
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Outer glow border */}
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[2.5rem] blur-md"
          style={{ background: `linear-gradient(135deg, ${GOLD}18, transparent 50%, rgba(99,102,241,0.08))` }}
        />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-[#0d0f16]/95 px-6 py-7 shadow-[0_40px_100px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-8">

          {/* Animated gold top line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 h-[1px] origin-left"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)` }}
          />

          {/* Inner top glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `${GOLD}10` }}
          />

          {/* ── Logo + header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
            className="relative mb-7 flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.2 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}28`, boxShadow: `0 8px 32px ${GOLD}18` }}
            >
              <Image src="/logo.png" alt="DJAMA" width={36} height={36} className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </motion.div>
            <div className="text-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.32, ease }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ borderColor: `${GOLD}22`, background: `${GOLD}0c`, color: GOLD }}
              >
                <Lock size={8} /> Espace client
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease }}
                className="mt-3 text-2xl font-extrabold text-white"
              >
                Bon retour
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.48 }}
                className="mt-1 text-sm text-white/30"
              >
                Vos outils professionnels vous attendent
              </motion.p>
            </div>
          </motion.div>

          {/* ── Google ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.38, ease }}
          >
            <motion.button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
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
            transition={{ duration: 0.3, delay: 0.46 }}
            className="my-5 flex items-center gap-3"
          >
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/20">ou</span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
          </motion.div>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} className="space-y-4">
            <AuthField label="Adresse e-mail" type="email" value={email} onChange={setEmail}
              placeholder="vous@exemple.com" icon={Mail} autoComplete="email" delay={0.5} />

            <AuthField label="Mot de passe" type={showPwd ? "text" : "password"}
              value={password} onChange={setPassword} placeholder="••••••••"
              icon={Lock} autoComplete="current-password" delay={0.56}
              right={
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="text-white/25 transition hover:text-white/55">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.62 }}
              className="flex justify-end"
            >
              <Link href="/forgot-password" className="text-[0.68rem] text-white/25 transition hover:text-[#c9a55a]">
                Mot de passe oublié ?
              </Link>
            </motion.div>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {resendOk && (
                <motion.div key="ok" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-400" />
                    <p className="text-xs text-green-300">Email renvoyé à <strong>{email}</strong>. Vérifiez vos spams.</p>
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div key="err" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  transition={{ duration:0.22 }}
                  className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <div className="flex gap-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                    <div>
                      <p className="text-xs text-red-300">{error}</p>
                      {errorType === "credentials" && (
                        <button type="button" onClick={handleResend} disabled={resending}
                          className="mt-1.5 flex items-center gap-1 text-[0.68rem] font-semibold text-[#c9a55a] underline underline-offset-2 hover:text-[#e8cc94] disabled:opacity-50">
                          <RefreshCw size={9} className={resending ? "animate-spin" : ""} />
                          {resending ? "Envoi…" : "Renvoyer l'email de confirmation"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.66, ease }}
            >
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -2, boxShadow: `0 12px 36px ${GOLD}45` }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || googleLoading}
                className="group relative mt-1 w-full overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-[#0a0a0a] disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 20px ${GOLD}30` }}
              >
                {/* Shimmer */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60" />
                      {phase === "auth" ? "Vérification…" : phase === "redirecting" ? "Ouverture…" : "Connexion…"}
                    </>
                  ) : (
                    <>
                      Se connecter
                      <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                        <ArrowRight size={14} />
                      </motion.span>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* ── Footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="mt-6 flex items-center gap-3"
          >
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            <p className="whitespace-nowrap text-xs text-white/25">
              Pas encore de compte ?{" "}
              <Link href="/register" className="font-bold transition-colors hover:text-[#e8cc94]" style={{ color: GOLD }}>
                Créer un compte gratuit
              </Link>
            </p>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090e]" />}>
      <LoginPageInner />
    </Suspense>
  );
}
