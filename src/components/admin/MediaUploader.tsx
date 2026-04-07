"use client";

/**
 * MediaUploader — composant réutilisable pour uploader images ou vidéos
 * vers Supabase Storage (bucket "djama-media").
 *
 * Props :
 *   type        "image" | "video"
 *   folder      Sous-dossier dans le bucket (défaut : "images" / "videos")
 *   currentUrl  URL actuelle (image_url ou video_url)
 *   onUrlChange Callback appelé avec la nouvelle URL après upload OU saisie manuelle
 *
 * Fonctionnalités :
 *   - Onglet "Upload" : drag & drop + sélection fichier
 *   - Onglet "URL"    : coller une URL directement (YouTube, Vimeo, lien direct…)
 *   - Compression auto en WebP pour les images (Canvas API)
 *   - Barre de progression
 *   - Preview inline après upload
 *   - Limite : 5 MB images / 50 MB vidéos (vérification côté client)
 */

import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, CheckCircle2, Film } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMG      = 5  * 1024 * 1024;   // 5 MB
const MAX_VID      = 50 * 1024 * 1024;   // 50 MB
const ACCEPT_IMAGE = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml";
const ACCEPT_VIDEO = "video/mp4,video/webm,video/quicktime";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Génère un identifiant aléatoire court */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Compresse une image via Canvas et la retourne en Blob WebP.
 * Réduit la largeur max à 1920px et applique une qualité 0.85.
 * Fallback vers JPEG si WebP n'est pas supporté par le navigateur.
 */
async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const img   = new window.Image();
    const objUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objUrl);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas non disponible")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Essai WebP
      canvas.toBlob(
        webpBlob => {
          if (webpBlob) {
            resolve({ blob: webpBlob, ext: "webp" });
          } else {
            // Fallback JPEG
            canvas.toBlob(
              jpegBlob => {
                if (jpegBlob) resolve({ blob: jpegBlob, ext: "jpg" });
                else reject(new Error("Compression impossible"));
              },
              "image/jpeg",
              quality
            );
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("Impossible de charger l'image"));
    };
    img.src = objUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MediaUploaderType = "image" | "video";

export interface MediaUploaderProps {
  /** "image" ou "video" */
  type: MediaUploaderType;
  /** Bucket Supabase Storage (défaut : "djama-media") */
  bucket?: string;
  /** Sous-dossier dans le bucket (défaut : "images" ou "videos") */
  folder?: string;
  /** URL actuellement stockée en base */
  currentUrl: string;
  /** Appelé à chaque changement d'URL (upload réussi OU saisie manuelle) */
  onUrlChange: (url: string) => void;
  /** Label affiché au-dessus du composant (optionnel) */
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function MediaUploader({
  type,
  bucket = "djama-media",
  folder,
  currentUrl,
  onUrlChange,
  label,
}: MediaUploaderProps) {
  const [tab,       setTab]       = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);      // 0-100
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const BUCKET          = bucket;
  const effectiveFolder = folder ?? (type === "image" ? "images" : "videos");
  const maxBytes        = type === "image" ? MAX_IMG : MAX_VID;
  const maxLabel        = type === "image" ? "5 MB"  : "50 MB";
  const acceptAttr      = type === "image" ? ACCEPT_IMAGE : ACCEPT_VIDEO;

  // ── Upload vers Supabase Storage ────────────────────────────────────────

  async function uploadFile(file: File) {
    setUploadErr(null);

    // Vérification taille
    if (file.size > maxBytes) {
      setUploadErr(`Fichier trop lourd. Maximum autorisé : ${maxLabel}.`);
      return;
    }

    setUploading(true);
    setProgress(5);

    try {
      let uploadBlob: Blob | File = file;
      let ext: string;

      if (type === "image") {
        // ── Compression WebP ──────────────────────────────────────────────
        setProgress(15);
        const result = await compressImage(file);
        uploadBlob   = result.blob;
        ext          = result.ext;
        setProgress(35);
      } else {
        // ── Vidéo : pas de compression, conserver l'extension d'origine ──
        const parts = file.name.split(".");
        ext         = (parts[parts.length - 1] ?? "mp4").toLowerCase();
      }

      const filename = `${Date.now()}-${uid()}.${ext}`;
      const path     = `${effectiveFolder}/${filename}`;
      const mimeType = type === "image"
        ? (ext === "webp" ? "image/webp" : "image/jpeg")
        : file.type;

      setProgress(50);

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, uploadBlob, {
          contentType:  mimeType,
          cacheControl: "3600",
          upsert:       false,
        });

      if (storageError) throw storageError;

      setProgress(90);

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      onUrlChange(urlData.publicUrl);
      setProgress(100);

      console.log(`[MediaUploader] uploaded ${type}:`, urlData.publicUrl);

    } catch (err) {
      console.error("[MediaUploader] upload error:", err);
      setUploadErr("Erreur lors de l'upload. Vérifiez votre connexion et réessayez.");
    } finally {
      setUploading(false);
      // Reset progress après un court délai
      setTimeout(() => setProgress(0), 800);
    }
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input pour permettre re-sélection du même fichier
    e.target.value = "";
  }

  // ── Suppression de l'URL courante ────────────────────────────────────────

  function clearUrl() {
    onUrlChange("");
    setUploadErr(null);
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  const isImage   = type === "image";
  const hasUrl    = currentUrl.trim().length > 0;
  const typeLabel = isImage ? "image" : "vidéo";

  return (
    <div className="space-y-2.5">
      {/* Label */}
      {label && (
        <label className="block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">
          {label}
        </label>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[0.74rem] font-bold transition-all ${
            tab === "upload"
              ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"
              : "text-white/30 hover:text-white/55"
          }`}
        >
          <Upload size={11} /> Upload fichier
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[0.74rem] font-bold transition-all ${
            tab === "url"
              ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"
              : "text-white/30 hover:text-white/55"
          }`}
        >
          <Link2 size={11} /> Coller une URL
        </button>
      </div>

      {/* ── Panneau Upload ───────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div className="space-y-2.5">
          {/* Zone drag & drop */}
          <div
            onDragOver={e => { e.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={[
              "relative flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2.5",
              "rounded-2xl border-2 border-dashed transition-all duration-200",
              uploading
                ? "pointer-events-none border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.05)]"
                : dragOver
                  ? "border-[rgba(201,165,90,0.55)] bg-[rgba(201,165,90,0.08)] scale-[1.01]"
                  : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]",
            ].join(" ")}
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin text-[#c9a55a]" />
                <p className="text-[0.74rem] font-semibold text-white/35">
                  {isImage ? "Compression et upload…" : "Upload en cours…"}
                </p>
                {/* Barre de progression */}
                {progress > 0 && (
                  <div className="absolute bottom-3 left-5 right-5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-[#c9a55a] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </>
            ) : progress === 100 ? (
              <>
                <CheckCircle2 size={20} className="text-[#4ade80]" />
                <p className="text-[0.74rem] font-semibold text-[#4ade80]">Upload réussi !</p>
              </>
            ) : (
              <>
                {isImage ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05]">
                    <Upload size={16} className="text-white/30" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05]">
                    <Film size={16} className="text-white/30" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[0.78rem] font-semibold text-white/45">
                    Glisser {isImage ? "une image" : "une vidéo"} ici
                  </p>
                  <p className="text-[0.66rem] text-white/22">
                    ou <span className="text-white/40 underline underline-offset-2">cliquer pour sélectionner</span>
                    {" · "}{isImage ? "JPG, PNG, WebP, GIF · max 5 MB" : "MP4, WebM · max 50 MB"}
                  </p>
                  {isImage && (
                    <p className="mt-0.5 text-[0.6rem] text-[rgba(201,165,90,0.5)]">
                      ✦ Compressé automatiquement en WebP
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Input fichier caché */}
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Message d'erreur upload */}
          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2.5">
              <X size={12} className="mt-0.5 shrink-0 text-[#f87171]" />
              <p className="text-[0.73rem] text-[#f87171]">{uploadErr}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Panneau URL ──────────────────────────────────────────────────── */}
      {tab === "url" && (
        <div>
          <input
            type="url"
            value={currentUrl}
            onChange={e => { onUrlChange(e.target.value); setUploadErr(null); }}
            placeholder={
              isImage
                ? "https://… (jpg, png, webp, svg)"
                : "https://youtube.com/watch?v=… · https://vimeo.com/… · ou lien direct .mp4"
            }
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.4)]"
          />
        </div>
      )}

      {/* ── Aperçu de l'URL courante (si présente) ───────────────────────── */}
      {hasUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="aperçu"
              className="h-10 w-14 shrink-0 rounded-lg object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Film size={18} className="shrink-0 text-white/25" />
          )}
          <p className="min-w-0 flex-1 truncate text-[0.7rem] text-white/40">
            {currentUrl}
          </p>
          <button
            type="button"
            onClick={clearUrl}
            title={`Supprimer l'${typeLabel}`}
            className="shrink-0 text-white/20 transition-colors hover:text-[#f87171]"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
