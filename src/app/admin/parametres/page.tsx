"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save, Loader2, Check, X, AlertCircle,
  Instagram, Facebook, Linkedin, Youtube, Twitter, Globe,
  Phone, Mail, MapPin, Clock, MousePointerClick, Palette,
  Link2, ToggleLeft, ToggleRight, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SiteSettingRow, SocialLinkRow, SocialPlatform } from "@/types/db";

// ── Toast ─────────────────────────────────────────────────────────

type Toast = { id: number; msg: string; ok: boolean };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, ok: boolean) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[0.84rem] font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-2 ${
            t.ok
              ? "bg-[rgba(74,222,128,0.14)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]"
              : "bg-[rgba(248,113,113,0.12)] text-[#f87171] border border-[rgba(248,113,113,0.18)]"
          }`}
        >
          {t.ok ? <Check size={14} /> : <AlertCircle size={14} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Social platform meta ──────────────────────────────────────────

const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; icon: React.ElementType; color: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#e1306c" },
  facebook:  { label: "Facebook",  icon: Facebook,  color: "#1877f2" },
  linkedin:  { label: "LinkedIn",  icon: Linkedin,  color: "#0a66c2" },
  youtube:   { label: "YouTube",   icon: Youtube,   color: "#ff0000" },
  twitter:   { label: "X / Twitter", icon: Twitter, color: "#1d9bf0" },
  tiktok:    { label: "TikTok",    icon: Globe,     color: "#69c9d0" },
  snapchat:  { label: "Snapchat",  icon: Globe,     color: "#fffc00" },
};

// ── Sections config ───────────────────────────────────────────────

const SETTINGS_SECTIONS = [
  {
    id: "contact",
    title: "Contact & Communication",
    icon: Phone,
    color: "#60a5fa",
    fields: [
      { key: "contact.phone",    label: "Téléphone principal",  icon: Phone,    placeholder: "+33 6 00 00 00 00" },
      { key: "contact.whatsapp", label: "WhatsApp",             icon: Phone,    placeholder: "+33 6 00 00 00 00" },
      { key: "contact.email",    label: "Email de contact",     icon: Mail,     placeholder: "contact@djama.fr" },
      { key: "contact.address",  label: "Adresse",              icon: MapPin,   placeholder: "Paris, France" },
      { key: "contact.hours",    label: "Horaires",             icon: Clock,    placeholder: "Lun–Ven 9h–18h" },
      { key: "contact.delay",    label: "Délai de réponse",     icon: Clock,    placeholder: "Sous 24 heures" },
    ],
  },
  {
    id: "cta",
    title: "Boutons CTA",
    icon: MousePointerClick,
    color: "#a78bfa",
    fields: [
      { key: "cta.primary.text",   label: "Bouton principal — Texte", icon: MousePointerClick, placeholder: "Démarrer un projet" },
      { key: "cta.primary.href",   label: "Bouton principal — Lien",  icon: Link2,             placeholder: "/contact" },
      { key: "cta.secondary.text", label: "Bouton secondaire — Texte",icon: MousePointerClick, placeholder: "Voir les services" },
      { key: "cta.secondary.href", label: "Bouton secondaire — Lien", icon: Link2,             placeholder: "/services" },
    ],
  },
  {
    id: "branding",
    title: "Branding",
    icon: Palette,
    color: "#c9a55a",
    fields: [
      { key: "site.name",        label: "Nom du site",    icon: Palette, placeholder: "DJAMA" },
      { key: "site.tagline",     label: "Tagline",        icon: Palette, placeholder: "Création digitale & accompagnement" },
      { key: "site.description", label: "Description SEO",icon: Palette, placeholder: "Description courte du site" },
    ],
  },
];

// ── Skeleton ──────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.04] ${className ?? ""}`}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-6 space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* social */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-4 w-36" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-6 w-11 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Social row ────────────────────────────────────────────────────

interface SocialRowProps {
  link: SocialLinkRow;
  onUpdate: (id: string, patch: Partial<Pick<SocialLinkRow, "url" | "active" | "sort_order">>) => Promise<void>;
  toast: (msg: string, ok: boolean) => void;
}

function SocialRow({ link, onUpdate, toast }: SocialRowProps) {
  const meta = PLATFORM_META[link.platform];
  const Icon = meta.icon;
  const [url, setUrl] = useState(link.url);
  const [toggling, setToggling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep url in sync if parent re-fetches
  useEffect(() => { setUrl(link.url); }, [link.url]);

  function handleUrlChange(val: string) {
    setUrl(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await onUpdate(link.id, { url: val });
      } catch {
        toast("Erreur lors de la mise à jour de l'URL", false);
      }
    }, 600);
  }

  async function handleBlur() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (url !== link.url) {
      try {
        await onUpdate(link.id, { url });
      } catch {
        toast("Erreur lors de la mise à jour de l'URL", false);
      }
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await onUpdate(link.id, { active: !link.active });
    } catch {
      toast("Erreur lors de la mise à jour", false);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.03]">
      {/* Icon + label */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${meta.color}18` }}
      >
        <Icon size={15} style={{ color: meta.color }} />
      </div>
      <span className="w-[100px] shrink-0 text-[0.8rem] font-semibold text-white/60">
        {meta.label}
      </span>

      {/* URL input */}
      <input
        type="url"
        value={url}
        onChange={e => handleUrlChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={`https://${link.platform}.com/votre-page`}
        className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[0.82rem] text-white/75 outline-none transition-colors placeholder:text-white/20 focus:border-[rgba(201,165,90,0.35)] focus:bg-white/[0.05]"
      />

      {/* Active toggle */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        title={link.active ? "Désactiver" : "Activer"}
        className="shrink-0 transition-opacity disabled:opacity-40"
      >
        {link.active ? (
          <ToggleRight size={26} className="text-[#c9a55a]" />
        ) : (
          <ToggleLeft size={26} className="text-white/20" />
        )}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function AdminParametres() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [rows, setRows]           = useState<SiteSettingRow[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([]);
  const [valuesMap, setValuesMap] = useState<Record<string, string>>({});
  const { toasts, push: toast }   = useToast();

  // ── Load ────────────────────────────────────────────────────────
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [{ data: settingsData, error: settingsError }, { data: sData, error: socialError }] =
        await Promise.all([
          supabase.from("site_settings").select("*").order("section").order("key"),
          supabase.from("social_links").select("*").order("sort_order"),
        ]);

      if (settingsError) throw settingsError;
      if (socialError) throw socialError;

      const settings = settingsData ?? [];
      const social = sData ?? [];

      setRows(settings);
      setSocialLinks(social);

      const map: Record<string, string> = {};
      settings.forEach((r: SiteSettingRow) => { map[r.key] = r.value; });
      setValuesMap(map);
    } catch {
      toast("Erreur lors du chargement des paramètres", false);
    } finally {
      setLoading(false);
    }
  }

  // ── Save all settings ───────────────────────────────────────────
  async function saveAll() {
    setSaving(true);
    try {
      const updates = Object.entries(valuesMap).map(([key, value]) =>
        supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key)
      );
      await Promise.all(updates);
      toast("Paramètres sauvegardés avec succès", true);
    } catch {
      toast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  }

  // ── Update a social link (used by SocialRow) ────────────────────
  async function handleSocialUpdate(
    id: string,
    patch: Partial<Pick<SocialLinkRow, "url" | "active" | "sort_order">>
  ) {
    const { data, error } = await supabase
      .from("social_links")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setSocialLinks(prev => prev.map(l => (l.id === id ? data : l)));
  }

  // ── Field change ────────────────────────────────────────────────
  function handleChange(key: string, value: string) {
    setValuesMap(prev => ({ ...prev, [key]: value }));
  }

  // ── Render ──────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)]">
            <Settings size={17} className="text-[#c9a55a]" />
          </div>
          <div>
            <h1 className="text-[1.3rem] font-black text-white">Paramètres</h1>
            <p className="mt-0.5 text-[0.8rem] text-white/35">
              Configuration globale du site DJAMA
            </p>
          </div>
        </div>

        <button
          onClick={saveAll}
          disabled={saving}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-5 py-2.5 text-[0.84rem] font-bold text-[#09090b] transition-all hover:bg-[#d4b16a] active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Sauvegarde…</>
          ) : (
            <><Save size={14} /> Sauvegarder tout</>
          )}
        </button>
      </div>

      {/* ── Settings sections ───────────────────────────────────── */}
      {SETTINGS_SECTIONS.map(({ id, title, icon: SectionIcon, color, fields }) => {
        return (
          <div
            key={id}
            className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-6"
          >
            {/* section header */}
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `${color}16` }}
              >
                <SectionIcon size={14} style={{ color }} />
              </div>
              <h2 className="text-[0.9rem] font-bold text-white">{title}</h2>
            </div>

            {/* fields grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(f => {
                // prefer label from DB row if exists
                const dbRow = rows.find(r => r.key === f.key);
                const label = dbRow?.label ?? f.label;
                const FieldIcon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.73rem] font-semibold uppercase tracking-[0.07em] text-white/30">
                      <FieldIcon size={11} />
                      {label}
                    </label>
                    <input
                      type="text"
                      value={valuesMap[f.key] ?? ""}
                      onChange={e => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[0.84rem] text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-[rgba(201,165,90,0.35)] focus:bg-[rgba(255,255,255,0.06)]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Réseaux sociaux ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-6">
        {/* section header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)]">
            <Link2 size={14} className="text-[#c9a55a]" />
          </div>
          <div>
            <h2 className="text-[0.9rem] font-bold text-white">Réseaux sociaux</h2>
            <p className="mt-0.5 text-[0.73rem] text-white/30">
              URL mise à jour en temps réel · toggle pour activer/désactiver
            </p>
          </div>
        </div>

        {socialLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-white/25">
            <Globe size={28} />
            <p className="text-[0.84rem]">Aucun réseau social configuré</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {socialLinks.map(link => (
              <SocialRow
                key={link.id}
                link={link}
                onUpdate={handleSocialUpdate}
                toast={toast}
              />
            ))}
          </div>
        )}

        {/* legend */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.05] pt-4">
          <span className="flex items-center gap-1.5 text-[0.73rem] text-white/25">
            <ToggleRight size={16} className="text-[#c9a55a]" />
            Actif — apparaît sur le site
          </span>
          <span className="flex items-center gap-1.5 text-[0.73rem] text-white/25">
            <ToggleLeft size={16} className="text-white/25" />
            Inactif — masqué du site
          </span>
        </div>
      </div>

      {/* ── Bottom save button ───────────────────────────────────── */}
      <div className="flex justify-end pb-2">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#c9a55a] px-6 py-3 text-[0.84rem] font-bold text-[#09090b] transition-all hover:bg-[#d4b16a] active:scale-[0.97] disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Sauvegarde…</>
          ) : (
            <><Save size={14} /> Sauvegarder tout</>
          )}
        </button>
      </div>
    </div>
  );
}
