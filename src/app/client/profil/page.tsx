"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Crown, CheckCircle2, Phone, Building2,
  LogOut, ArrowRight, Sparkles, Lock, Eye, EyeOff,
  AlertCircle, FileText, Camera, Bell, Key,
  RefreshCw, Clock, Globe, Smartphone, Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { PLAN_PRICE_LABEL } from "@/lib/plans";
import Link from "next/link";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

type NotifPrefs = {
  email_marketing: boolean;
  email_factures: boolean;
  email_rappels: boolean;
  push: boolean;
};

type ActivityEntry = {
  id: string;
  label: string;
  device: string;
  icon: "globe" | "smartphone";
  ts: string;
  current?: boolean;
};

const DEFAULT_NOTIF: NotifPrefs = {
  email_marketing: true,
  email_factures: true,
  email_rappels: true,
  push: false,
};

function generateApiKey(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "dja_" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Field({
  label, value, onChange, type = "text", placeholder, icon: Icon,
  readOnly = false, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; icon: React.ElementType;
  readOnly?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <Icon size={14} className={readOnly ? "text-white/20" : "text-white/40"} />
        </div>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${
            readOnly
              ? "cursor-not-allowed border-white/5 bg-white/3 text-white/30"
              : "border-white/8 bg-white/6 text-white placeholder-white/20 focus:border-white/20 focus:bg-white/8"
          }`}
        />
        {readOnly && (
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
            <Lock size={12} className="text-white/20" />
          </div>
        )}
      </div>
      {hint && <p className="mt-1 text-[0.65rem] text-white/30">{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onChange, label, description, icon: Icon }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon size={14} className="text-white/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xs text-white/30">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ background: enabled ? GOLD : "rgba(255,255,255,0.12)" }}
      >
        <motion.span
          animate={{ x: enabled ? 16 : 0 }}
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

function ProfilPage() {
  const sub = useSubscription();
  const { level, isPremium, name, email, userId } = sub;
  const searchParams = useSearchParams();
  const mustResetPwd = searchParams.get("reset") === "1";

  /* ── Infos perso ── */
  const [displayName, setDisplayName] = useState(name ?? "");
  const [phone,       setPhone]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

  /* ── Infos entreprise ── */
  const [nomSociete, setNomSociete] = useState("");
  const [siret,      setSiret]      = useState("");
  const [adresse,    setAdresse]    = useState("");
  const [savingBiz,  setSavingBiz]  = useState(false);
  const [savedBiz,   setSavedBiz]   = useState(false);

  /* ── Mot de passe ── */
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew,     setPwdNew]     = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [savedPwd,   setSavedPwd]   = useState(false);
  const [errorPwd,   setErrorPwd]   = useState("");

  /* ── Avatar ── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl,       setAvatarUrl]       = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ── Notifications ── */
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [savedNotif, setSavedNotif] = useState(false);

  /* ── Clé API ── */
  const [apiKey,       setApiKey]       = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey,    setCopiedKey]    = useState(false);
  const [showKey,      setShowKey]      = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  /* ── Activité ── */
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  /* Load all client data */
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("clients")
      .select("telephone, nom_societe, siret, adresse, avatar_url, notification_prefs, api_key")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const d = data as {
          telephone?: string; nom_societe?: string; siret?: string; adresse?: string;
          avatar_url?: string; notification_prefs?: NotifPrefs; api_key?: string;
        };
        setPhone(d.telephone ?? "");
        setNomSociete(d.nom_societe ?? "");
        setSiret(d.siret ?? "");
        setAdresse(d.adresse ?? "");
        if (d.avatar_url) setAvatarUrl(d.avatar_url);
        if (d.notification_prefs) setNotifPrefs({ ...DEFAULT_NOTIF, ...d.notification_prefs });
        if (d.api_key) setApiKey(d.api_key);
      });
  }, [userId]);

  /* Load activity from auth user */
  useEffect(() => {
    if (!userId) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const ua = navigator.userAgent;
      const isMobile = /mobile|android|iphone|ipad/i.test(ua);
      const browser = ua.includes("Chrome") ? "Chrome"
        : ua.includes("Firefox") ? "Firefox"
        : ua.includes("Safari") ? "Safari"
        : "Navigateur";
      const os = ua.includes("Windows") ? "Windows"
        : ua.includes("Mac") ? "macOS"
        : ua.includes("Linux") ? "Linux"
        : "Inconnu";
      const entries: ActivityEntry[] = [
        {
          id: "current",
          label: "Session en cours",
          device: `${browser} · ${os}`,
          icon: isMobile ? "smartphone" : "globe",
          ts: new Date().toISOString(),
          current: true,
        },
      ];
      if (user.last_sign_in_at) {
        entries.push({
          id: "last-signin",
          label: "Dernière connexion",
          device: `${browser} · ${os}`,
          icon: isMobile ? "smartphone" : "globe",
          ts: user.last_sign_in_at,
        });
      }
      setRecentActivity(entries);
    });
  }, [userId]);

  /* ── Handlers ── */
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!upErr) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.from("clients").update({ avatar_url: url }).eq("id", userId);
    }
    setUploadingAvatar(false);
    e.target.value = "";
  }

  async function handleToggleNotif(key: keyof NotifPrefs, val: boolean) {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    setSavedNotif(false);
    if (!userId) return;
    await supabase.from("clients").update({ notification_prefs: updated }).eq("id", userId);
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 2000);
  }

  async function handleGenerateKey() {
    if (!userId) return;
    setGeneratingKey(true);
    setConfirmRegen(false);
    const key = generateApiKey();
    await supabase.from("clients").update({ api_key: key }).eq("id", userId);
    setApiKey(key);
    setShowKey(true);
    setGeneratingKey(false);
  }

  async function handleCopyKey() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Le nom ne peut pas être vide."); return; }
    setSaving(true); setError(""); setSaved(false);
    await Promise.all([
      supabase.auth.updateUser({ data: { name: displayName.trim() } }),
      userId && supabase.from("clients").update({ nom: displayName.trim(), telephone: phone.trim() || null }).eq("id", userId),
    ]);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSaveBiz(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSavingBiz(true); setSavedBiz(false);
    await supabase.from("clients").update({
      nom_societe: nomSociete.trim() || null,
      siret: siret.trim() || null,
      adresse: adresse.trim() || null,
    }).eq("id", userId);
    setSavingBiz(false); setSavedBiz(true);
    setTimeout(() => setSavedBiz(false), 3000);
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    if (!pwdCurrent) { setErrorPwd("Saisissez votre mot de passe actuel."); return; }
    if (pwdNew.length < 8) { setErrorPwd("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (pwdCurrent === pwdNew) { setErrorPwd("Le nouveau mot de passe doit être différent de l'actuel."); return; }
    setSavingPwd(true); setErrorPwd(""); setSavedPwd(false);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: email ?? "", password: pwdCurrent });
    if (authErr) { setSavingPwd(false); setErrorPwd("Mot de passe actuel incorrect."); return; }
    const { error: err } = await supabase.auth.updateUser({ password: pwdNew });
    setSavingPwd(false);
    if (err) { setErrorPwd(err.message); }
    else { setSavedPwd(true); setPwdCurrent(""); setPwdNew(""); setTimeout(() => setSavedPwd(false), 3000); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (level === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#07080e]">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(201,165,90,0.2)" }} />
          <motion.div className="absolute inset-0 rounded-full"
            style={{ border: "2px solid transparent", borderTopColor: GOLD }}
            animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
        </div>
      </div>
    );
  }

  const planLabel = isPremium ? "DJAMA PRO" : "Plan Gratuit";
  const planColor = isPremium ? GOLD : "#6b7280";
  const PlanIcon  = isPremium ? Crown : Sparkles;
  const maskedKey = apiKey
    ? apiKey.substring(0, 8) + "•".repeat(16) + apiKey.slice(-6)
    : "";

  return (
    <div className="relative min-h-screen bg-[#07080e] text-white">
      <div className="mx-auto max-w-xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="mb-6">
            <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">Compte</p>
            <h1 className="text-xl font-black text-white">Mon profil</h1>
            <p className="mt-0.5 text-sm text-white/40">Gérez vos informations et votre abonnement</p>
          </div>

          {/* ── Avatar + plan ── */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <div className="relative shrink-0">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl transition"
                style={{ background: avatarUrl ? "transparent" : `${GOLD}14`, border: `1px solid ${GOLD}28` }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-extrabold" style={{ color: GOLD }}>
                    {(name?.[0] ?? email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 transition group-hover:opacity-100">
                  {uploadingAvatar ? (
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Camera size={16} className="text-white" />
                  )}
                </div>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-white">{name || email || "Mon compte"}</p>
              <p className="truncate text-sm text-white/40">{email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <PlanIcon size={11} style={{ color: planColor }} />
                <span className="text-[0.7rem] font-semibold" style={{ color: planColor }}>{planLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 text-[0.65rem] font-medium text-white/25 transition hover:text-white/50"
              >
                Changer la photo
              </button>
            </div>
          </div>

          {/* ── Informations personnelles ── */}
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-bold text-white">Informations personnelles</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <Field label="Nom affiché" value={displayName}
                onChange={v => { setDisplayName(v); setSaved(false); }}
                placeholder="Votre nom" icon={User} />
              <Field label="Adresse e-mail" value={email ?? ""} icon={Mail} readOnly
                hint="L'adresse e-mail ne peut pas être modifiée" />
              <Field label="Téléphone" value={phone} onChange={setPhone}
                placeholder="+33 6 00 00 00 00" icon={Phone} type="tel" />

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2">
                    <div className="flex gap-2">
                      <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={saving || saved}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-[#07080e] transition hover:opacity-90 disabled:opacity-60 shadow-lg shadow-white/10"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                {saved ? (<><CheckCircle2 size={14} /> Enregistré</>)
                  : saving ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60"
                      animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} /> Enregistrement…</>)
                  : "Sauvegarder"}
              </motion.button>
            </form>
          </div>

          {/* ── Informations entreprise ── */}
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-bold text-white">Informations entreprise</h2>
            <form onSubmit={handleSaveBiz} className="space-y-3">
              <Field label="Nom de la société" value={nomSociete} onChange={setNomSociete}
                placeholder="Ma Société SAS" icon={Building2} />
              <Field label="SIRET" value={siret} onChange={setSiret}
                placeholder="123 456 789 00010" icon={FileText} />
              <Field label="Adresse" value={adresse} onChange={setAdresse}
                placeholder="12 rue des Lilas, 75001 Paris" icon={Building2} />

              <motion.button type="submit" disabled={savingBiz || savedBiz}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/8 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/12 hover:text-white disabled:opacity-60">
                {savedBiz ? (<><CheckCircle2 size={14} className="text-emerald-400" /> Enregistré</>)
                  : savingBiz ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60"
                      animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} /> Enregistrement…</>)
                  : "Sauvegarder l'entreprise"}
              </motion.button>
            </form>
          </div>

          {/* ── Préférences de notifications ── */}
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Notifications</h2>
              <AnimatePresence>
                {savedNotif && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-400">
                    <CheckCircle2 size={10} /> Sauvegardé
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/25">E-mails</p>
              <Toggle
                enabled={notifPrefs.email_factures}
                onChange={v => handleToggleNotif("email_factures", v)}
                label="Factures & paiements"
                description="Nouvelles factures, confirmations de paiement"
                icon={Mail}
              />
              <Toggle
                enabled={notifPrefs.email_rappels}
                onChange={v => handleToggleNotif("email_rappels", v)}
                label="Rappels"
                description="Échéances, rendez-vous, tâches à faire"
                icon={Bell}
              />
              <Toggle
                enabled={notifPrefs.email_marketing}
                onChange={v => handleToggleNotif("email_marketing", v)}
                label="Actualités DJAMA"
                description="Nouveautés, conseils, offres spéciales"
                icon={Sparkles}
              />
              <div className="border-t border-white/6 pt-3">
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/25">Navigateur</p>
                <Toggle
                  enabled={notifPrefs.push}
                  onChange={v => handleToggleNotif("push", v)}
                  label="Notifications push"
                  description="Alertes instantanées dans le navigateur"
                  icon={Smartphone}
                />
              </div>
            </div>
          </div>

          {/* ── Activité récente ── */}
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-bold text-white">Activité récente</h2>
            {recentActivity.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white/50"
                  animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                <p className="text-sm text-white/30">Chargement…</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => {
                  const EntryIcon = entry.icon === "smartphone" ? Smartphone : Globe;
                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: entry.current ? `${GOLD}14` : "rgba(255,255,255,0.05)",
                          border: `1px solid ${entry.current ? `${GOLD}28` : "rgba(255,255,255,0.06)"}`,
                        }}>
                        <EntryIcon size={14} style={{ color: entry.current ? GOLD : "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white/80">{entry.label}</p>
                          {entry.current && (
                            <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold text-emerald-400"
                              style={{ background: "rgba(52,211,153,0.12)" }}>
                              Actif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/30">{entry.device}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[0.65rem] text-white/25">
                        <Clock size={10} />
                        <span>{formatRelative(entry.ts)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Clé API DJAMA ── */}
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-2">
              <Key size={14} style={{ color: GOLD }} />
              <h2 className="text-sm font-bold text-white">Clé API DJAMA</h2>
            </div>
            <p className="mb-4 text-xs text-white/30">
              Utilisez cette clé pour accéder à l'API DJAMA depuis vos intégrations.
            </p>

            {apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                  <Key size={12} className="shrink-0 text-white/25" />
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-white/55">
                    {showKey ? apiKey : maskedKey}
                  </code>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setShowKey(v => !v)}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60">
                      {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button type="button" onClick={handleCopyKey}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60">
                      {copiedKey
                        ? <CheckCircle2 size={12} className="text-emerald-400" />
                        : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {confirmRegen ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
                        <AlertCircle size={13} className="shrink-0 text-amber-400" />
                        <p className="flex-1 text-xs text-amber-400">L'ancienne clé sera invalidée immédiatement.</p>
                        <button type="button" onClick={handleGenerateKey} disabled={generatingKey}
                          className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50">
                          Confirmer
                        </button>
                        <button type="button" onClick={() => setConfirmRegen(false)}
                          className="text-xs text-white/30 transition hover:text-white/50">
                          Annuler
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button type="button" onClick={() => setConfirmRegen(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-white/30 transition hover:text-white/50">
                      <RefreshCw size={11} /> Régénérer la clé
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button type="button" onClick={handleGenerateKey} disabled={generatingKey}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/6 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/12 hover:text-white disabled:opacity-50">
                {generatingKey ? (
                  <><motion.div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60"
                    animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} /> Génération…</>
                ) : (
                  <><Key size={14} /> Générer ma clé API</>
                )}
              </motion.button>
            )}
          </div>

          {/* Banner reset forcé */}
          {mustResetPwd && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-400">
                Pour des raisons de sécurité, veuillez définir un nouveau mot de passe avant de continuer.
              </p>
            </div>
          )}

          {/* ── Changer le mot de passe ── */}
          <div className="rounded-2xl border bg-white/4 p-5 backdrop-blur-sm"
            style={{ borderColor: mustResetPwd ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)" }}>
            <h2 className="mb-4 text-sm font-bold text-white">Changer le mot de passe</h2>
            <form onSubmit={handleChangePwd} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Lock size={14} className="text-white/40" />
                  </div>
                  <input type="password" value={pwdCurrent}
                    onChange={e => { setPwdCurrent(e.target.value); setErrorPwd(""); }}
                    placeholder="Votre mot de passe actuel" autoComplete="current-password"
                    className="w-full rounded-xl border border-white/8 bg-white/6 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/20 focus:bg-white/8" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Lock size={14} className="text-white/40" />
                  </div>
                  <input type={showPwd ? "text" : "password"} value={pwdNew}
                    onChange={e => { setPwdNew(e.target.value); setSavedPwd(false); }}
                    placeholder="Minimum 8 caractères" autoComplete="new-password"
                    className="w-full rounded-xl border border-white/8 bg-white/6 py-3 pl-10 pr-12 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/20 focus:bg-white/8" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {errorPwd && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2">
                    <div className="flex gap-2">
                      <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                      <p className="text-xs text-red-400">{errorPwd}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit"
                disabled={savingPwd || savedPwd || !pwdCurrent || pwdNew.length < 8}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/8 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/12 hover:text-white disabled:opacity-50">
                {savedPwd ? (<><CheckCircle2 size={14} className="text-emerald-400" /> Mot de passe mis à jour</>)
                  : savingPwd ? (<><motion.div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60"
                      animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} /> Mise à jour…</>)
                  : "Mettre à jour le mot de passe"}
              </motion.button>
            </form>
          </div>

          {/* ── Abonnement ── */}
          <div className="rounded-2xl border bg-white/4 p-5 backdrop-blur-sm"
            style={{ borderColor: isPremium ? `${planColor}30` : "rgba(255,255,255,0.06)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Abonnement</h2>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
                style={{ background: `${planColor}14`, color: planColor }}>
                <PlanIcon size={10} /> {planLabel}
              </div>
            </div>
            {!isPremium ? (
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Vous êtes sur le <strong className="text-white/70">plan gratuit</strong>. Passez à DJAMA PRO pour accéder à tous les outils sans restriction.
                </p>
                <Link href="/client/abonnements"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-[#07080e] transition hover:opacity-90 shadow-lg shadow-white/10"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                  <Crown size={14} /> Passer à DJAMA PRO — {PLAN_PRICE_LABEL} <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-400">Accès complet à tous les outils DJAMA PRO</p>
                </div>
                <Link href="/client/abonnements"
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/40 transition hover:text-white/60">
                  Gérer mon abonnement <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>

          {/* ── Déconnexion ── */}
          <button onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/15 py-3.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/8 hover:text-red-400">
            <LogOut size={14} /> Se déconnecter
          </button>

          {userId && <p className="text-center text-[0.6rem] text-white/20">ID · {userId}</p>}
        </motion.div>
      </div>
    </div>
  );
}

export default function ProfilPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ProfilPage />
    </Suspense>
  );
}
