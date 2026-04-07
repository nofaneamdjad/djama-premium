"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { SocialLinkRow } from "@/types/db";

export type SiteSettingsMap = Record<string, string>;

const DEFAULT_SETTINGS: SiteSettingsMap = {
  "contact.email":    "contact@djama.fr",
  "contact.phone":    "+33 6 00 00 00 00",
  "contact.whatsapp": "+33 6 00 00 00 00",
  "contact.address":  "",
  "contact.hours":    "Lun–Ven 9h–18h",
  "contact.delay":    "Sous 24 heures",
  "cta.primary.text":    "Démarrer un projet",
  "cta.primary.href":    "/contact",
  "cta.secondary.text":  "Voir les services",
  "cta.secondary.href":  "/services",
  "site.name":        "DJAMA",
  "site.tagline":     "Création digitale, outils professionnels et accompagnement.",
  "hero.badge":       "🚀 Services DJAMA",
  "hero.title1":      "Créons ensemble",
  "hero.title2":      "votre présence digitale",
  "hero.subtitle":    "Sites web, applications, outils professionnels et accompagnement.",
  "cta.final.title1":  "Prêt à démarrer",
  "cta.final.title2":  "votre projet ?",
  "cta.final.subtitle": "Discutons de vos besoins. Réponse garantie sous 24h.",
  "footer.tagline":   "Création digitale & accompagnement professionnel.",
  "contact.page.title":    "Parlons de votre projet",
  "contact.page.subtitle": "Notre équipe répond sous 24h.",
};

/**
 * Hook client — charge les settings Supabase une fois au montage.
 * Retourne les valeurs locales en fallback si Supabase échoue.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsMap>(DEFAULT_SETTINGS);
  const [socials,  setSocials]  = useState<SocialLinkRow[]>([]);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [{ data: sData }, { data: rData }] = await Promise.all([
          supabase.from("site_settings").select("key, value"),
          supabase.from("social_links").select("*").eq("active", true).order("sort_order"),
        ]);

        if (!cancelled) {
          if (sData && sData.length > 0) {
            const map: SiteSettingsMap = { ...DEFAULT_SETTINGS };
            sData.forEach((r: { key: string; value: string }) => {
              if (r.value) map[r.key] = r.value;
            });
            setSettings(map);
          }
          if (rData) {
            setSocials(rData as SocialLinkRow[]);
          }
        }
      } catch {
        // silencieux — valeurs par défaut utilisées
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /** Raccourci pour lire une clé avec fallback */
  function get(key: string, fallback = ""): string {
    return settings[key] ?? DEFAULT_SETTINGS[key] ?? fallback;
  }

  return { settings, socials, ready, get };
}
