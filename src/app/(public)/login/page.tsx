"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Lock, Mail, AlertCircle,
  ArrowRight, RefreshCw, CheckCircle2,
  ShieldCheck, Zap, Cloud,
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

/* ── Champ de formulaire animé ─────────────────── */
function AuthField({
  label, type, value, onChange, placeholder, icon: Icon, right, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; right?: React.ReactNode; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</label>
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
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-200 hover:border-white/20"
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

/* ── Page principale ───────────────────────────── */
function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect") ?? "/client";

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phase,       setPhase]       = useState<"idle" | "auth" | "checking" | "redirecting">("idle");
  const [resending,   setResending]   = useState(false);
  const [error,       setError]       = useState("");
  const [errorType,   setErrorType]   = useState<"credentials" | "other" | null>(null);
  const [resendOk,    setResendOk]    = useState(false);

  useEffect(() => {
    supabase.auth.signOut();
  }, []);

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
    /* Si OK, Supabase redirige automatiquement — pas besoin de setLoading(false) */
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorType(null);
    setResendOk(false);
    setLoading(true);
    setPhase("auth");

    const trimmedEmail = email.trim().toLowerCase();
    let willRedirect = false;

    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (sbError) {
        if (
          sbError.message.includes("Invalid login credentials") ||
          sbError.message.includes("invalid_credentials")
        ) {
          setError("Email ou mot de passe incorrect.");
          setErrorType("credentials");
        } else if (sbError.message.includes("Email not confirmed")) {
          setError("Votre adresse email n'est pas encore confirmée. Vérifiez vos spams.");
          setErrorType("credentials");
        } else {
          setError(`Erreur de connexion : ${sbError.message}`);
          setErrorType("other");
        }
        return;
      }

      if (!data.session) {
        setError("Session non créée. Vérifiez votre email de confirmation.");
        setErrorType("credentials");
        return;
      }

      const needsReset = data.session.user.user_metadata?.needs_password_reset === true;
      const dest       = needsReset ? "/definir-mot-de-passe" : redirectTo;

      setPhase("redirecting");
      willRedirect = true;
      window.location.href = dest;

    } catch {
      setError("Erreur inattendue. Vérifiez votre connexion et réessayez.");
      setErrorType("other");
    } finally {
      if (!willRedirect) {
        setLoading(false);
        setPhase("idle");
      }
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setError("Saisissez votre adresse email ci-dessus avant de renvoyer.");
      return;
    }
    setResending(true);
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });
    setResending(false);
    if (resendErr) {
      setError(`Impossible de renvoyer : ${resendErr.message}`);
    } else {
      setResendOk(true);
      setError("");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a0f] px-4 py-8">

      {/* Glows */}
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

      {/* Carte */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Bordure glow externe */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-[rgba(201,165,90,0.12)] to-transparent opacity-70 blur-sm" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f1117]/90 px-6 py-7 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">

          {/* Logo + titre */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mb-7 flex flex-col items-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.09)]">
              <Image
                src="/logo.png"
                alt="DJAMA"
                width={38}
                height={38}
                className="object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                <Lock size={9} />
                Espace client
              </span>
              <h1 className="mt-3 text-2xl font-extrabold text-white">Bon retour 👋</h1>
              <p className="mt-1 text-sm text-white/35">
                Vos outils professionnels vous attendent
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
              disabled={googleLoading || loading}
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

          {/* Formulaire email/mot de passe */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <AuthField label="Adresse e-mail" type="email" value={email} onChange={setEmail}
              placeholder="vous@exemple.com" icon={Mail} autoComplete="email" />

            <AuthField label="Mot de passe" type={showPwd ? "text" : "password"}
              value={password} onChange={setPassword} placeholder="••••••••"
              icon={Lock} autoComplete="current-password"
              right={
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="text-white/30 transition hover:text-white/60">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[0.7rem] text-white/30 transition hover:text-[#c9a55a]"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Messages d'erreur / succès */}
            <AnimatePresence mode="wait">
              {resendOk && (
                <motion.div
                  key="resend-ok"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-400" />
                    <p className="text-xs leading-relaxed text-green-300">
                      Email de confirmation renvoyé à <strong>{email}</strong>.
                      Vérifiez votre boîte mail (et vos spams).
                    </p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                    <div className="flex-1">
                      <p className="text-xs leading-relaxed text-red-300">{error}</p>
                      {errorType === "credentials" && (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending}
                          className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-semibold text-[#c9a55a] underline underline-offset-2 transition hover:text-[#e8cc94] disabled:opacity-50"
                        >
                          <RefreshCw size={10} className={resending ? "animate-spin" : ""} />
                          {resending ? "Envoi en cours…" : "Renvoyer l'email de confirmation"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton connexion */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              disabled={loading || googleLoading}
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
                    {phase === "auth"        && "Vérification…"}
                    {phase === "checking"    && "Chargement du compte…"}
                    {phase === "redirecting" && "Ouverture de l'espace client…"}
                    {phase === "idle"        && "Connexion…"}
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Badges de réassurance */}
          <div className="mt-5 flex items-center justify-center gap-4">
            {[
              { Icon: ShieldCheck, label: "Données sécurisées", color: "#4ade80" },
              { Icon: Zap,         label: "Accès instantané",   color: GOLD       },
              { Icon: Cloud,       label: "Sauvegarde auto",    color: "#60a5fa"  },
            ].map(({ Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <Icon size={11} style={{ color }} strokeWidth={2} />
                <span className="text-[0.6rem] text-white/25">{label}</span>
              </div>
            ))}
          </div>

          {/* Lien inscription */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <div className="h-px flex-1 bg-white/5" />
            <p className="mx-3 whitespace-nowrap text-xs text-white/30">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#c9a55a] underline underline-offset-2 transition hover:text-[#e8cc94]"
              >
                Créer un compte gratuit
              </Link>
            </p>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a0f]" />}>
      <LoginPageInner />
    </Suspense>
  );
}
