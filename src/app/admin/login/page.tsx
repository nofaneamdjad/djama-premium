"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }                   from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck, Mail, QrCode, RefreshCw } from "lucide-react";

type MfaStep = "none" | "challenge" | "enroll-qr" | "enroll-verify";

export default function AdminLogin() {
  const router = useRouter();

  /* ── Credentials ── */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);

  /* ── MFA ── */
  const [mfaStep,     setMfaStep]     = useState<MfaStep>("none");
  const [mfaCode,     setMfaCode]     = useState("");
  const [factorId,    setFactorId]    = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [enrollUri,   setEnrollUri]   = useState("");
  const [enrollSecret, setEnrollSecret] = useState("");

  /* ── UI ── */
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mfaStep !== "none") {
      setTimeout(() => codeRef.current?.focus(), 50);
    }
  }, [mfaStep]);

  function clearErr() { setError(""); }

  /* ══════════════════════════════════════════════════════════════
   * Étape 1 : email + password → POST /api/admin/auth
   * ══════════════════════════════════════════════════════════════ */
  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    clearErr();
    try {
      const res = await fetch("/api/admin/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json() as {
        ok?: boolean;
        mfaRequired?: boolean;
        hasFactors?: boolean;
        error?: string;
      };

      if (!res.ok && !data.mfaRequired) {
        setError(data.error ?? "Erreur inconnue");
        setTimeout(clearErr, 3500);
        return;
      }

      if (data.mfaRequired) {
        if (data.hasFactors) {
          // Facteurs existants → challenge
          await startChallenge();
        } else {
          // Pas de facteur → enrôlement
          await startEnroll();
        }
        return;
      }

      // Pas de MFA requis → connecté
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
      setTimeout(clearErr, 3500);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * MFA challenge : crée un challenge sur le premier facteur vérifié
   * ══════════════════════════════════════════════════════════════ */
  async function startChallenge() {
    setLoading(true);
    clearErr();
    try {
      const res  = await fetch("/api/admin/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "challenge" }),
      });
      const data = await res.json() as { factorId?: string; challengeId?: string; error?: string };
      if (!res.ok || !data.factorId || !data.challengeId) {
        setError(data.error ?? "Impossible de démarrer le challenge MFA");
        setTimeout(clearErr, 3500);
        return;
      }
      setFactorId(data.factorId);
      setChallengeId(data.challengeId);
      setMfaStep("challenge");
    } catch {
      setError("Erreur réseau");
      setTimeout(clearErr, 3500);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * MFA enrôlement : démarre l'enrôlement TOTP (QR code)
   * ══════════════════════════════════════════════════════════════ */
  async function startEnroll() {
    setLoading(true);
    clearErr();
    try {
      const res  = await fetch("/api/admin/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "enroll" }),
      });
      const data = await res.json() as {
        factorId?: string; qrCode?: string; secret?: string; error?: string;
      };
      if (!res.ok || !data.factorId) {
        setError(data.error ?? "Impossible de démarrer l'enrôlement MFA");
        setTimeout(clearErr, 3500);
        return;
      }
      setFactorId(data.factorId);
      setEnrollUri(data.qrCode ?? "");
      setEnrollSecret(data.secret ?? "");
      setMfaStep("enroll-qr");
    } catch {
      setError("Erreur réseau");
      setTimeout(clearErr, 3500);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * Vérification du challenge (login avec MFA actif)
   * ══════════════════════════════════════════════════════════════ */
  async function submitChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (mfaCode.length < 6) return;
    setLoading(true);
    clearErr();
    try {
      const res  = await fetch("/api/admin/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "verify", factorId, challengeId, code: mfaCode }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; invalid?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Code MFA invalide");
        setMfaCode("");
        setTimeout(clearErr, 3500);
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
      setTimeout(clearErr, 3500);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * Vérification de l'enrôlement (finalise + challenge)
   * ══════════════════════════════════════════════════════════════ */
  async function submitEnrollVerify(e: React.FormEvent) {
    e.preventDefault();
    if (mfaCode.length < 6) return;
    setLoading(true);
    clearErr();
    try {
      const res  = await fetch("/api/admin/auth/mfa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "verify-enroll", factorId, code: mfaCode }),
      });
      const data = await res.json() as { ok?: boolean; enrolled?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Code invalide");
        setMfaCode("");
        setTimeout(clearErr, 3500);
        return;
      }
      // Enrôlement OK → démarrer le challenge pour la session aal2
      setMfaCode("");
      await startChallenge();
    } catch {
      setError("Erreur réseau");
      setTimeout(clearErr, 3500);
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * Rendu
   * ══════════════════════════════════════════════════════════════ */
  const isChallenge = mfaStep === "challenge";
  const isEnrollQr  = mfaStep === "enroll-qr";
  const isEnrollVfy = mfaStep === "enroll-verify";
  const isMfaScreen = isChallenge || isEnrollQr || isEnrollVfy;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[1.6rem] font-black tracking-tight text-gray-900">DJAMA</p>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]">Espace Admin</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          {/* Icône */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(201,165,90,0.1)] border border-[rgba(201,165,90,0.2)]">
              {isMfaScreen
                ? (isEnrollQr ? <QrCode size={19} className="text-[#c9a55a]" /> : <ShieldCheck size={19} className="text-[#c9a55a]" />)
                : <Lock size={19} className="text-[#c9a55a]" />
              }
            </div>
          </div>

          {/* Titre */}
          <h1 className="mb-1 text-center text-[1rem] font-bold text-gray-900">
            {isEnrollQr  ? "Configurer la double authentification"  :
             isEnrollVfy ? "Confirmer l'enrôlement"                  :
             isChallenge ? "Vérification MFA"                        :
                           "Connexion administrateur"}
          </h1>
          <p className="mb-7 text-center text-[0.77rem] text-gray-400">
            {isEnrollQr  ? "Scannez ce QR code avec votre application d'authentification" :
             isEnrollVfy ? "Saisissez le code de votre application pour confirmer" :
             isChallenge ? "Saisissez le code de votre application d'authentification" :
                           "Accès réservé aux administrateurs DJAMA"}
          </p>

          {/* ── Formulaire credentials ── */}
          {!isMfaScreen && (
            <form onSubmit={submitCredentials} className="space-y-3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <Mail size={14} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearErr(); }}
                  placeholder="Email administrateur"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-[0.85rem] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[rgba(201,165,90,0.5)] focus:bg-white"
                />
              </div>

              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErr(); }}
                  placeholder="Mot de passe"
                  className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-11 text-[0.85rem] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[rgba(201,165,90,0.5)] focus:bg-white ${
                    error ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {error && <p className="text-center text-[0.77rem] text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full rounded-xl bg-[#c9a55a] py-3 text-[0.88rem] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Vérification…" : "Accéder à l'administration"}
              </button>
            </form>
          )}

          {/* ── QR code enrôlement ── */}
          {isEnrollQr && (
            <div className="space-y-4">
              {enrollUri ? (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={enrollUri} alt="QR code MFA" className="h-44 w-44 rounded-lg border border-gray-200" />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                  <RefreshCw size={22} className="animate-spin text-gray-400" />
                </div>
              )}

              {enrollSecret && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                  <p className="text-[0.68rem] text-gray-400 mb-1">Clé manuelle</p>
                  <p className="font-mono text-[0.78rem] tracking-wider text-gray-700 select-all">{enrollSecret}</p>
                </div>
              )}

              <p className="text-center text-[0.75rem] text-gray-500">
                Scannez, puis cliquez sur Continuer pour entrer le code de confirmation.
              </p>

              {error && <p className="text-center text-[0.77rem] text-red-500">{error}</p>}

              <button
                onClick={() => { setMfaCode(""); setMfaStep("enroll-verify"); }}
                disabled={loading}
                className="w-full rounded-xl bg-[#c9a55a] py-3 text-[0.88rem] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Continuer →
              </button>

              <button
                type="button"
                onClick={() => { setMfaStep("none"); setMfaCode(""); }}
                className="w-full text-center text-[0.75rem] text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Retour
              </button>
            </div>
          )}

          {/* ── Vérification du code (enrôlement ou challenge) ── */}
          {(isEnrollVfy || isChallenge) && (
            <form onSubmit={isEnrollVfy ? submitEnrollVerify : submitChallenge} className="space-y-3">
              <input
                ref={codeRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={e => { setMfaCode(e.target.value.replace(/\D/g, "")); clearErr(); }}
                placeholder="Code à 6 chiffres"
                autoComplete="one-time-code"
                className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-center text-[1.1rem] font-mono tracking-[0.3em] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[rgba(201,165,90,0.5)] focus:bg-white ${
                  error ? "border-red-300" : "border-gray-200"
                }`}
              />

              {error && <p className="text-center text-[0.77rem] text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="w-full rounded-xl bg-[#c9a55a] py-3 text-[0.88rem] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Vérification…" : isEnrollVfy ? "Confirmer l'enrôlement" : "Valider"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMfaStep(isEnrollVfy ? "enroll-qr" : "none");
                  setMfaCode("");
                  clearErr();
                }}
                className="w-full text-center text-[0.75rem] text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Retour
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
