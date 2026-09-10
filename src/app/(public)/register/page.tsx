"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye, EyeOff, Check, AlertCircle, CheckCircle2,
  ChevronDown, Search, X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { APPS_DATA } from "@/lib/applications-data";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Bandeau apps sélectionnées (comme Odoo) ── */
function SelectedAppsBanner() {
  const [apps, setApps] = useState<typeof APPS_DATA>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("djama_pending_apps");
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      const mapped = slugs
        .map((s) => APPS_DATA.find((a) => a.slug === s))
        .filter(Boolean) as typeof APPS_DATA;
      setApps(mapped);
    } catch {}
  }, []);

  if (apps.length === 0) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-white px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        {apps.map(({ slug, label, color, icon: Icon }) => (
          <div key={slug} className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(145deg, ${color}ee, ${color}bb)` }}
            >
              <Icon size={20} color="#fff" strokeWidth={1.8} />
            </div>
            <span className="text-[0.875rem] font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>
      <Link
        href="/demarrer"
        className="shrink-0 text-[0.8rem] text-gray-400 transition hover:text-gray-600"
      >
        Modifier la sélection
      </Link>
    </div>
  );
}

/* ── Pays ── */
type Country = { code: string; name: string; flag: string; tel: string };

const COUNTRIES: Country[] = [
  { code: "FR", name: "France",               flag: "🇫🇷", tel: "+33"  },
  { code: "YT", name: "Mayotte",              flag: "🇾🇹", tel: "+262" },
  { code: "RE", name: "La Réunion",           flag: "🇷🇪", tel: "+262" },
  { code: "GP", name: "Guadeloupe",           flag: "🇬🇵", tel: "+590" },
  { code: "MQ", name: "Martinique",           flag: "🇲🇶", tel: "+596" },
  { code: "GF", name: "Guyane française",     flag: "🇬🇫", tel: "+594" },
  { code: "NC", name: "Nouvelle-Calédonie",   flag: "🇳🇨", tel: "+687" },
  { code: "PF", name: "Polynésie française",  flag: "🇵🇫", tel: "+689" },
  { code: "BE", name: "Belgique",             flag: "🇧🇪", tel: "+32"  },
  { code: "CH", name: "Suisse",               flag: "🇨🇭", tel: "+41"  },
  { code: "LU", name: "Luxembourg",           flag: "🇱🇺", tel: "+352" },
  { code: "CA", name: "Canada",               flag: "🇨🇦", tel: "+1"   },
  { code: "MA", name: "Maroc",                flag: "🇲🇦", tel: "+212" },
  { code: "DZ", name: "Algérie",              flag: "🇩🇿", tel: "+213" },
  { code: "TN", name: "Tunisie",              flag: "🇹🇳", tel: "+216" },
  { code: "SN", name: "Sénégal",              flag: "🇸🇳", tel: "+221" },
  { code: "CI", name: "Côte d'Ivoire",        flag: "🇨🇮", tel: "+225" },
  { code: "CM", name: "Cameroun",             flag: "🇨🇲", tel: "+237" },
  { code: "MG", name: "Madagascar",           flag: "🇲🇬", tel: "+261" },
  { code: "KM", name: "Comores",              flag: "🇰🇲", tel: "+269" },
  { code: "MU", name: "Maurice",              flag: "🇲🇺", tel: "+230" },
  { code: "ML", name: "Mali",                 flag: "🇲🇱", tel: "+223" },
  { code: "GN", name: "Guinée",               flag: "🇬🇳", tel: "+224" },
  { code: "BF", name: "Burkina Faso",         flag: "🇧🇫", tel: "+226" },
  { code: "NE", name: "Niger",                flag: "🇳🇪", tel: "+227" },
  { code: "TD", name: "Tchad",                flag: "🇹🇩", tel: "+235" },
  { code: "CG", name: "Congo",                flag: "🇨🇬", tel: "+242" },
  { code: "GA", name: "Gabon",                flag: "🇬🇦", tel: "+241" },
  { code: "DJ", name: "Djibouti",             flag: "🇩🇯", tel: "+253" },
  { code: "GB", name: "Royaume-Uni",          flag: "🇬🇧", tel: "+44"  },
  { code: "DE", name: "Allemagne",            flag: "🇩🇪", tel: "+49"  },
  { code: "ES", name: "Espagne",              flag: "🇪🇸", tel: "+34"  },
  { code: "IT", name: "Italie",               flag: "🇮🇹", tel: "+39"  },
  { code: "PT", name: "Portugal",             flag: "🇵🇹", tel: "+351" },
  { code: "US", name: "États-Unis",           flag: "🇺🇸", tel: "+1"   },
  { code: "BR", name: "Brésil",               flag: "🇧🇷", tel: "+55"  },
  { code: "IN", name: "Inde",                 flag: "🇮🇳", tel: "+91"  },
  { code: "CN", name: "Chine",                flag: "🇨🇳", tel: "+86"  },
  { code: "JP", name: "Japon",                flag: "🇯🇵", tel: "+81"  },
  { code: "AU", name: "Australie",            flag: "🇦🇺", tel: "+61"  },
];

/* ── SplashScreen ── */
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
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease }}
          >
            <Image src="/logo-navbar.png" alt="DJAMA" width={220} height={50} className="h-[44px] w-auto object-contain" />
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


/* ── CountryPicker (modal indicatif) ── */
function CountryPicker({
  selected, onSelect, onClose,
}: { selected: Country; onSelect: (c: Country) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tel.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="w-full max-w-[440px] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(17,24,39,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.16)",
          maxHeight: "72vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[0.9rem] font-bold text-gray-900">Indicatif téléphonique</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5" style={{ background: "#f5f6f8", border: "1px solid rgba(17,24,39,0.07)" }}>
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto pb-6" style={{ maxHeight: "calc(72vh - 120px)" }}>
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => { onSelect(c); onClose(); }}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition"
              style={{
                background: c.code === selected.code ? "rgba(201,165,90,0.07)" : "transparent",
                borderLeft: c.code === selected.code ? `3px solid ${GOLD}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (c.code !== selected.code) (e.currentTarget as HTMLElement).style.background = "#f5f6f8"; }}
              onMouseLeave={(e) => { if (c.code !== selected.code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="flex-1 text-[0.88rem] font-medium text-gray-800">{c.name}</span>
              <span className="text-[0.78rem] tabular-nums text-gray-400">{c.tel}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Aucun résultat</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Classes communes des champs ── */
const fieldBase =
  "h-[56px] w-full rounded-lg border border-gray-200 bg-white transition-all outline-none " +
  "focus:border-[#c9a55a] focus:ring-2 focus:ring-[#c9a55a]/[0.16]";

/* Champ texte/email avec label flottant */
function FloatInput({
  id, label, type = "text", value, onChange,
  autoComplete, required, autoFocus,
  suffix,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        autoComplete={autoComplete}
        required={required}
        autoFocus={autoFocus}
        className={
          fieldBase +
          " px-4 pt-[22px] pb-[6px] text-[0.9rem] text-gray-900 peer" +
          (suffix ? " pr-11" : "")
        }
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-[18px] text-[0.9rem] text-gray-400 transition-all duration-150
          peer-focus:top-[8px] peer-focus:text-[0.72rem] peer-focus:text-gray-500
          peer-[:not(:placeholder-shown)]:top-[8px] peer-[:not(:placeholder-shown)]:text-[0.72rem] peer-[:not(:placeholder-shown)]:text-gray-500"
      >
        {label}
      </label>
      {suffix && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {suffix}
        </div>
      )}
    </div>
  );
}

/* ── RegisterForm ── */
function RegisterForm() {
  const searchParams   = useSearchParams();
  const redirectTo     = searchParams.get("redirect") ?? "/client";

  const [dialCountry,   setDialCountry]   = useState<Country>(COUNTRIES[0]);
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const [nom,           setNom]           = useState("");
  const [email,         setEmail]         = useState("");
  const [telNumber,     setTelNumber]     = useState("");
  const [pays,          setPays]          = useState("FR");
  const [password,      setPassword]      = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showSplash,    setShowSplash]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  const telephone = telNumber ? `${dialCountry.tel} ${telNumber}` : "";
  const pwdHas8     = password.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(password);
  const pwdHasDigit = /\d/.test(password);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim())         { setError("Le nom est requis."); return; }
    if (!email.trim())       { setError("L'adresse e-mail est requise."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setError(""); setLoading(true); setShowSplash(true);

    const selectedCountry = COUNTRIES.find(c => c.code === pays);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: nom.trim(), pays, pays_nom: selectedCountry?.name },
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
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
      id:        userId,
      nom:       nom.trim(),
      email:     email.trim().toLowerCase(),
      telephone: telephone || null,
      statut:    "actif",
    });

    if (data.session) {
      try {
        const raw = localStorage.getItem("djama_pending_apps");
        const pending = raw ? JSON.parse(raw) : null;
        if (Array.isArray(pending) && pending.length > 0) {
          await fetch("/api/free-plan/save-apps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: pending }),
          });
          localStorage.removeItem("djama_pending_apps");
          await supabase.auth.refreshSession();
        }
      } catch {}
    }

    setLoading(false);
    if (data.session) {
      setSuccess(true);
      setTimeout(() => { window.location.href = redirectTo; }, 1000);
    } else {
      setShowSplash(false);
      setSuccess(true);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SplashScreen visible={showSplash} />

      <AnimatePresence>
        {pickerOpen && (
          <CountryPicker
            selected={dialCountry}
            onSelect={setDialCountry}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header minimal ── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="DJAMA"
              width={120}
              height={28}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/login"
            className="text-[0.875rem] font-medium text-gray-500 transition hover:text-gray-900"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="mx-auto w-full max-w-[620px] px-5 pb-20 pt-12 md:pt-16">

        {/* Titre Caveat + soulignement doré */}
        <div className="mb-10 text-center">
          <h1
            className="text-[2.6rem] font-bold leading-tight text-gray-900 md:text-[3rem]"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Commencez avec{" "}
            <span className="relative inline-block">
              DJAMA
              <svg
                aria-hidden
                viewBox="0 0 140 10"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 w-full"
                style={{ height: "9px", overflow: "visible" }}
              >
                <path
                  d="M2 7 Q35 1, 70 6 Q105 10, 138 4"
                  stroke="#c9a55a"
                  strokeWidth="2.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-4 text-[0.9rem] text-gray-500">
            Accès gratuit et instantané. Aucune carte de crédit nécessaire.
          </p>
        </div>

        {/* Apps pré-sélectionnées */}
        <SelectedAppsBanner />

        {/* ── Carte formulaire ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="rounded-xl p-7 md:p-9"
          style={{ background: "#f5f6f8" }}
        >
          <form onSubmit={handleRegister} noValidate className="space-y-4">

            {/* Nom et prénom */}
            <FloatInput
              id="nom"
              label="Nom et prénom"
              value={nom}
              onChange={setNom}
              autoComplete="name"
              required
              autoFocus
            />

            {/* Email + Téléphone — 2 colonnes sur sm+ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Email */}
              <FloatInput
                id="email"
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />

              {/* Téléphone : champ composite avec label fixe en haut */}
              <div className="relative">
                <div
                  className={
                    "flex h-[56px] items-center overflow-hidden rounded-lg border border-gray-200 bg-white " +
                    "transition-all focus-within:border-[#c9a55a] focus-within:ring-2 focus-within:ring-[#c9a55a]/[0.16]"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex h-full shrink-0 items-center gap-1 pl-4 pr-2 text-[0.82rem] font-medium text-gray-700 transition-colors hover:text-gray-900 outline-none"
                  >
                    <span className="text-base leading-none">{dialCountry.flag}</span>
                    <span className="tabular-nums">{dialCountry.tel}</span>
                    <ChevronDown size={11} className="text-gray-400" />
                  </button>
                  <div className="h-5 w-px shrink-0 bg-gray-200" />
                  <input
                    type="tel"
                    value={telNumber}
                    onChange={(e) => setTelNumber(e.target.value)}
                    placeholder="Numéro de téléphone"
                    autoComplete="tel-national"
                    className="flex-1 min-w-0 bg-transparent px-3 text-[0.875rem] text-gray-900 placeholder:text-gray-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pays */}
            <div className="relative">
              <select
                id="pays"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className={
                  fieldBase +
                  " appearance-none cursor-pointer pl-4 pr-10 pt-[22px] pb-[6px] text-[0.9rem] text-gray-900"
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <label
                htmlFor="pays"
                className="pointer-events-none absolute left-4 top-[8px] text-[0.72rem] text-gray-500"
              >
                Pays
              </label>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <FloatInput
                id="password"
                label="Mot de passe"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-gray-400 transition hover:text-gray-600 outline-none"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              {/* Critères */}
              <AnimatePresence>
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 space-y-1.5 overflow-hidden"
                  >
                    {[
                      { met: pwdHas8,     label: "8 caractères minimum" },
                      { met: pwdHasUpper, label: "Une lettre majuscule"  },
                      { met: pwdHasDigit, label: "Un chiffre"            },
                    ].map(({ met, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border transition-all duration-200"
                          style={{
                            borderColor: met ? "#22c55e" : "#d1d5db",
                            background:  met ? "#22c55e" : "transparent",
                          }}
                        >
                          {met && <Check size={8} color="#fff" strokeWidth={3} />}
                        </span>
                        <span
                          className="text-[0.78rem] transition-colors duration-200"
                          style={{ color: met ? "#16a34a" : "#9ca3af" }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Erreur / succès */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-lg px-3.5 py-3"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
                >
                  <div className="flex gap-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden rounded-lg px-3.5 py-3"
                  style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)" }}
                >
                  <div className="flex gap-2.5">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                    <p className="text-xs text-emerald-700">
                      Compte créé ! Vérifiez votre email pour activer votre compte.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conditions */}
            <p className="text-[0.75rem] leading-relaxed text-gray-400">
              En cliquant sur{" "}
              <strong className="font-semibold text-gray-500">Créer mon compte</strong>
              , vous acceptez nos{" "}
              <Link href="/legal/cgu" className="text-gray-500 underline underline-offset-2 transition hover:text-gray-700">
                Conditions d&apos;utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="/legal/confidentialite" className="text-gray-500 underline underline-offset-2 transition hover:text-gray-700">
                Politique de confidentialité
              </Link>.
            </p>

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full h-[48px] justify-center text-[0.925rem] disabled:opacity-60"
              style={{ borderRadius: "6px" }}
            >
              {loading ? "Création en cours…" : success ? "Compte créé !" : "Créer mon compte"}
            </button>

          </form>
        </motion.div>

        {/* Login */}
        <p className="mt-7 text-center text-[0.875rem] text-gray-500">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold transition hover:opacity-80"
            style={{ color: GOLD }}
          >
            Se connecter
          </Link>
        </p>

        {/* Liens légaux discrets */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/legal/confidentialite" className="text-[0.70rem] text-gray-300 transition hover:text-gray-500">Confidentialité</Link>
          <span className="text-[0.70rem] text-gray-200">·</span>
          <Link href="/legal/cgu" className="text-[0.70rem] text-gray-300 transition hover:text-gray-500">Conditions</Link>
          <span className="text-[0.70rem] text-gray-200">·</span>
          <Link href="/contact" className="text-[0.70rem] text-gray-300 transition hover:text-gray-500">Besoin d&apos;aide ?</Link>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
