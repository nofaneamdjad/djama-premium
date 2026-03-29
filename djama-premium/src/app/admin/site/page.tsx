"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type SiteSettingsRow = {
  id: string;
  logo: string | null;
  hero_title: string | null;
  hero_description: string | null;
  video: string | null;
  updated_at?: string | null;
};

export default function AdminSitePage() {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);
  const heroVideoInputRef = useRef<HTMLInputElement | null>(null);

  const [rowId, setRowId] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState("DJAMA");
  const [siteDescription, setSiteDescription] = useState(
    "Services digitaux & outils professionnels."
  );

  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSiteSettings() {
    setMessage("");

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setMessage(`Erreur chargement : ${error.message}`);
      return;
    }

    if (data) {
      const row = data as SiteSettingsRow;
      setRowId(row.id);
      setSiteTitle(row.hero_title || "DJAMA");
      setSiteDescription(row.hero_description || "Services digitaux & outils professionnels.");
      setLogoUrl(row.logo || "");
      setHeroVideoUrl(row.video || "");
    }
  }

  useEffect(() => {
    loadSiteSettings();
  }, []);

  async function uploadFile(file: File, folder: "logos" | "images" | "videos") {
    const ext = file.name.split(".").pop() || "file";
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage("Upload du logo...");
      const publicUrl = await uploadFile(file, "logos");
      setLogoUrl(publicUrl);
      setMessage("Logo téléversé.");
    } catch (error) {
      setMessage(
        error instanceof Error ? `Erreur logo : ${error.message}` : "Erreur logo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleHeroImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage("Upload de l’image...");
      const publicUrl = await uploadFile(file, "images");
      setHeroImageUrl(publicUrl);
      setHeroVideoUrl("");
      setMessage("Image téléversée.");
    } catch (error) {
      setMessage(
        error instanceof Error ? `Erreur image : ${error.message}` : "Erreur image."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleHeroVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage("Upload de la vidéo...");
      const publicUrl = await uploadFile(file, "videos");
      setHeroVideoUrl(publicUrl);
      setHeroImageUrl("");
      setMessage("Vidéo téléversée.");
    } catch (error) {
      setMessage(
        error instanceof Error ? `Erreur vidéo : ${error.message}` : "Erreur vidéo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSiteSettings() {
    try {
      setLoading(true);
      setMessage("Sauvegarde...");

      if (rowId) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            logo: logoUrl || null,
            hero_title: siteTitle,
            hero_description: siteDescription,
            video: heroVideoUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rowId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert({
            logo: logoUrl || null,
            hero_title: siteTitle,
            hero_description: siteDescription,
            video: heroVideoUrl || null,
          })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        setRowId(data.id);
      }

      setMessage("Site mis à jour avec succès.");
    } catch (error) {
      setMessage(
        error instanceof Error ? `Erreur sauvegarde : ${error.message}` : "Erreur sauvegarde."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Admin • Site
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Modifier le site
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Clique pour choisir un logo, une image ou une vidéo, puis sauvegarde.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-luxe bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {message}
          </div>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Paramètres du site</h2>

          <div className="mt-6 grid gap-6">
            <div className="rounded-2xl border border-luxe p-5">
              <h3 className="text-lg font-extrabold">Logo</h3>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="mt-4 flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold-soft bg-zinc-50"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-4 text-center text-sm font-bold text-zinc-500">
                    Cliquer pour choisir un logo
                  </span>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-luxe p-5">
              <h3 className="text-lg font-extrabold">Image d’accueil</h3>

              <input
                ref={heroImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => heroImageInputRef.current?.click()}
                className="mt-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold-soft bg-zinc-50"
              >
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Image accueil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-zinc-500">
                    Cliquer pour choisir une image
                  </span>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-luxe p-5">
              <h3 className="text-lg font-extrabold">Vidéo d’accueil</h3>

              <input
                ref={heroVideoInputRef}
                type="file"
                accept="video/*"
                onChange={handleHeroVideoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => heroVideoInputRef.current?.click()}
                className="mt-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold-soft bg-zinc-50"
              >
                {heroVideoUrl ? (
                  <video
                    src={heroVideoUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-zinc-500">
                    Cliquer pour choisir une vidéo
                  </span>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-luxe p-5">
              <h3 className="text-lg font-extrabold">Texte accueil</h3>

              <div className="mt-4 grid gap-4">
                <input
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  placeholder="Titre principal"
                  className="rounded-xl border border-luxe px-4 py-3"
                />

                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={5}
                  placeholder="Description"
                  className="rounded-xl border border-luxe px-4 py-3"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveSiteSettings}
              disabled={loading}
              className="rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
            >
              {loading ? "Enregistrement..." : "Sauvegarder"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Aperçu</h2>

          <div className="mt-6 overflow-hidden rounded-[32px] border border-luxe bg-white">
            <div className="grid items-center gap-8 px-8 py-12 lg:grid-cols-2">
              <div>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo aperçu"
                    className="mb-5 h-16 w-16 object-contain"
                  />
                ) : null}

                <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-xs font-extrabold text-zinc-800">
                  Nouvelle identité visuelle • DJAMA
                </div>

                <h3 className="mt-6 text-4xl font-extrabold leading-tight">
                  {siteTitle || "DJAMA"}
                </h3>

                <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                  {siteDescription || "Description du site"}
                </p>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-luxe bg-white p-4 shadow-luxe-soft">
                {heroVideoUrl ? (
                  <video
                    src={heroVideoUrl}
                    controls
                    className="h-[320px] w-full rounded-2xl object-cover"
                  />
                ) : heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Aperçu hero"
                    className="h-[320px] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500">
                    Aucun visuel sélectionné
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}