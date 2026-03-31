"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [message, setMessage] = useState("");

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("Upload en cours...");

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `logo-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("actifs du site")
      .upload(fileName, file, { upsert: true });

    if (error) {
      setMessage("Erreur upload : " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("actifs du site")
      .getPublicUrl(fileName);

    setLogoUrl(data.publicUrl);
    setMessage("Logo uploadé avec succès !");
    setUploading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-5xl font-extrabold">Admin DJAMA</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-300 bg-white p-8">
            <h2 className="mb-6 text-2xl font-extrabold">Changer le logo</h2>

            <label className="flex h-72 w-full cursor-pointer items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-center text-2xl font-semibold text-zinc-800 hover:bg-zinc-100">
              {uploading ? "Upload..." : "Clique pour changer le logo"}
              <input
                type="file"
                accept="image/*"
                onChange={uploadLogo}
                className="hidden"
              />
            </label>

            {message ? (
              <p className="mt-6 text-lg text-zinc-700">{message}</p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-zinc-300 bg-white p-8">
            <h2 className="mb-6 text-2xl font-extrabold">Aperçu du logo</h2>

            <div className="flex h-72 items-center justify-center rounded-3xl border border-zinc-300 bg-zinc-50">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo uploadé"
                  className="h-40 w-40 object-contain"
                />
              ) : (
                <span className="text-2xl text-zinc-500">
                  Aucun logo pour le moment
                </span>
              )}
            </div>

            {logoUrl ? (
              <p className="mt-4 break-all text-sm text-zinc-600">{logoUrl}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
