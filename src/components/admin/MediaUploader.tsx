"use client";

/**
 * MediaUploader — composant réutilisable pour uploader images ou vidéos
 * vers Supabase Storage.
 *
 * Props :
 *   type        "image" | "video"
 *   bucket      Bucket Supabase (défaut : "djama-media")
 *   folder      Sous-dossier (défaut : "images" / "videos"). Vide = racine du bucket.
 *   currentUrl  URL actuellement stockée en base
 *   onUrlChange Callback avec la nouvelle URL (upload réussi OU saisie manuelle)
 *   label       Label affiché au-dessus (optionnel)
 *
 * Fixes appliqués :
 *   - Path : folder vide → fichier à la racine (pas de "/" en tête)
 *   - SVG   : bypass de la compression canvas (incompatible sur mobile)
 *   - Compression : fallback vers le fichier original si canvas échoue
 *   - Erreurs Supabase : messages contextuels (403, 404, réseau…)
 *   - État succès : visible 2,5 s avant reset
 *   - upsert: true pour éviter les conflits de nom (rare mais possible)
 */

import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, CheckCircle2, Film, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMG = 5  * 1024 * 1024;   // 5 MB
const MAX_VID = 50 * 1024 * 1024;   // 50 MB

// ⚠️ "image/jpg" n'est pas un MIME valide — on utilise "image/jpeg" uniquement
const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
const ACCEPT_VIDEO = "video/mp4,video/webm,video/quicktime";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Compresse une image via Canvas → Blob WebP (ou JPEG en fallback).
 * - SVG : contournement direct (pas de canvas ; rendu SVG mobile non fiable)
 * - Si canvas.toBlob() échoue : renvoie le fichier original non compressé
 * - maxWidth : 1920 px ; qualité : 0.85
 */
async function compressImage(
  file: File,
  maxWidth = 1920,
  quality  = 0.85,
): Promise<{ blob: Blob; ext: string; mimeType: string }> {
  // ── SVG : pas de compression ──────────────────────────────────────────────
  if (file.type === "image/svg+xml") {
    return { blob: file, ext: "svg", mimeType: "image/svg+xml" };
  }

  return new Promise(resolve => {
    const img    = new window.Image();
    const objUrl = URL.createObjectURL(file);

    // ── Fallback : on ne reject() jamais, on renvoie le fichier original ──
    const useOriginal = () => {
      URL.revokeObjectURL(objUrl);
      const parts = file.name.split(".");
      const ext   = (parts[parts.length - 1] ?? "jpg").toLowerCase();
      resolve({ blob: file, ext, mimeType: file.type || "image/jpeg" });
    };

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
      if (!ctx) { useOriginal(); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // Essai WebP
      canvas.toBlob(
        webpBlob => {
          if (webpBlob && webpBlob.size > 0) {
            resolve({ blob: webpBlob, ext: "webp", mimeType: "image/webp" });
            return;
          }
          // Fallback JPEG
          canvas.toBlob(
            jpegBlob => {
              if (jpegBlob && jpegBlob.size > 0) {
                resolve({ blob: jpegBlob, ext: "jpg", mimeType: "image/jpeg" });
              } else {
                useOriginal();
              }
            },
            "image/jpeg",
            quality,
          );
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = useOriginal;
    img.src     = objUrl;
  });
}

/**
 * Formate une erreur Supabase Storage en message utilisateur compréhensible.
 * Beaucoup plus utile que le message générique "Vérifiez votre connexion".
 */
function formatStorageError(err: unknown, bucketName: string): string {
  if (!err) return "Erreur inconnue lors de l'upload.";

  // Erreur native JS (réseau, canvas…)
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("canvas") || m.includes("compression")) {
      return "Impossible de traiter l'image. Essayez un autre format (JPG ou PNG).";
    }
    if (m.includes("network") || m.includes("fetch") || m.includes("failed")) {
      return "Connexion interrompue. Vérifiez votre réseau et réessayez.";
    }
    return `Erreur : ${err.message}`;
  }

  // Erreur Supabase (objet avec statusCode / message / error)
  if (typeof err === "object" && err !== null) {
    const e    = err as Record<string, unknown>;
    const code = String(e.statusCode ?? e.status ?? "");
    const msg  = String(e.message ?? e.error ?? "").toLowerCase();

    if (code === "403" || msg.includes("unauthorized") || msg.includes("forbidden")) {
      return `Accès refusé au bucket "${bucketName}". ` +
             `Vérifiez les politiques RLS dans Supabase Storage.`;
    }
    if (code === "404" || msg.includes("not found") || msg.includes("bucket")) {
      return `Bucket introuvable : "${bucketName}". ` +
             `Créez-le dans Supabase → Storage → New bucket (accès public activé).`;
    }
    if (code === "413" || msg.includes("too large") || msg.includes("payload")) {
      return "Fichier trop volumineux pour le serveur. Réduisez la taille et réessayez.";
    }
    if (code === "409" || msg.includes("already exists")) {
      return "Un fichier avec ce nom existe déjà. Réessayez (nom généré automatiquement).";
    }
    const detail = String(e.message ?? e.error ?? "").trim();
    if (detail) return `Supabase Storage : ${detail}`;
  }

  return "Erreur lors de l'upload. Vérifiez votre connexion et réessayez.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MediaUploaderType = "image" | "video";

export interface MediaUploaderProps {
  type:        MediaUploaderType;
  /** Bucket Supabase Storage (défaut : "djama-media") */
  bucket?:     string;
  /** Sous-dossier. Vide ("") = racine du bucket. */
  folder?:     string;
  currentUrl:  string;
  onUrlChange: (url: string) => void;
  label?:      string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

export function MediaUploader({
  type,
  bucket   = "djama-media",
  folder,
  currentUrl,
  onUrlChange,
  label,
}: MediaUploaderProps) {
  const [tab,       setTab]       = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);        // 0-100
  const [success,   setSuccess]   = useState(false);    // état succès distinct
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const BUCKET = bucket;

  // ── folder vide → racine ; sinon "dossier/fichier" ──────────────────────
  // BUG FIX : quand folder="", `${folder}/${filename}` donnait "/filename.webp"
  // (slash initial) → rejeté par Supabase Storage.
  const effectiveFolder =
    folder !== undefined
      ? folder                                         // valeur explicite (même vide)
      : type === "image" ? "images" : "videos";        // défaut si prop absente

  const maxBytes   = type === "image" ? MAX_IMG : MAX_VID;
  const maxLabel   = type === "image" ? "5 MB"  : "50 MB";
  const acceptAttr = type === "image" ? ACCEPT_IMAGE : ACCEPT_VIDEO;

  // ── Upload vers Supabase Storage ─────────────────────────────────────────

  async function uploadFile(file: File) {
    setUploadErr(null);
    setSuccess(false);

    // Vérification taille côté client
    if (file.size > maxBytes) {
      setUploadErr(
        `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
        `Maximum autorisé : ${maxLabel}.`,
      );
      return;
    }

    setUploading(true);
    setProgress(5);

    try {
      let uploadBlob: Blob | File = file;
      let ext: string;
      let mimeType: string;

      if (type === "image") {
        setProgress(15);
        const result = await compressImage(file);
        uploadBlob   = result.blob;
        ext          = result.ext;
        mimeType     = result.mimeType;
        setProgress(40);
      } else {
        const parts = file.name.split(".");
        ext      = (parts[parts.length - 1] ?? "mp4").toLowerCase();
        mimeType = file.type || "video/mp4";
      }

      // ── Construction du chemin sans slash initial ──────────────────────
      // BUG FIX principal : si effectiveFolder est vide, on n'ajoute pas "/"
      const filename = `${Date.now()}-${uid()}.${ext}`;
      const path     = effectiveFolder ? `${effectiveFolder}/${filename}` : filename;

      setProgress(55);

      console.log(`[MediaUploader] uploading to ${BUCKET}/${path} (${mimeType})`);

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, uploadBlob, {
          contentType:  mimeType,
          cacheControl: "3600",
          upsert:       true,    // évite l'erreur 409 si collision de nom (rare)
        });

      if (storageError) {
        console.error("[MediaUploader] storageError:", storageError);
        throw storageError;
      }

      setProgress(90);

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;
      console.log(`[MediaUploader] success:`, publicUrl);

      onUrlChange(publicUrl);
      setProgress(100);
      setSuccess(true);

      // Reset après 2,5 s (assez long pour être vu sur mobile)
      setTimeout(() => {
        setProgress(0);
        setSuccess(false);
      }, 2500);

    } catch (err) {
      console.error("[MediaUploader] upload error:", err);
      setUploadErr(formatStorageError(err, BUCKET));
    } finally {
      setUploading(false);
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
    e.target.value = ""; // permet re-sélection du même fichier
  }

  function clearUrl() {
    onUrlChange("");
    setUploadErr(null);
    setSuccess(false);
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
        {(["upload", "url"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[0.74rem] font-bold transition-all ${
              tab === t
                ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"
                : "text-white/30 hover:text-white/55"
            }`}
          >
            {t === "upload"
              ? <><Upload size={11} /> Upload fichier</>
              : <><Link2  size={11} /> Coller une URL</>
            }
          </button>
        ))}
      </div>

      {/* ── Panneau Upload ───────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div className="space-y-2.5">

          {/* Zone drag & drop / tap */}
          <div
            onDragOver={e => { e.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && !uploading && inputRef.current?.click()}
            className={[
              "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2.5",
              "rounded-2xl border-2 border-dashed transition-all duration-200 select-none",
              uploading
                ? "pointer-events-none border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.05)]"
                : dragOver
                  ? "border-[rgba(201,165,90,0.6)] bg-[rgba(201,165,90,0.08)] scale-[1.01]"
                  : success
                    ? "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.05)]"
                    : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]",
            ].join(" ")}
          >
            {/* ── État : upload en cours ── */}
            {uploading && (
              <>
                <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
                <p className="text-[0.74rem] font-semibold text-white/40">
                  {isImage ? "Traitement et upload…" : "Upload en cours…"}
                </p>
                <div className="absolute bottom-3 left-5 right-5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#e8cc94] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}

            {/* ── État : succès ── */}
            {!uploading && success && (
              <>
                <CheckCircle2 size={24} className="text-[#4ade80]" />
                <p className="text-[0.78rem] font-bold text-[#4ade80]">Upload réussi !</p>
                <p className="text-[0.66rem] text-[#4ade80]/60">Cliquez pour uploader un autre fichier</p>
              </>
            )}

            {/* ── État : idle (prompt) ── */}
            {!uploading && !success && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                  {isImage
                    ? <Upload size={18} className="text-white/30" />
                    : <Film   size={18} className="text-white/30" />
                  }
                </div>
                <div className="px-4 text-center">
                  <p className="text-[0.82rem] font-semibold text-white/50">
                    {isImage ? "Glisser une image ici" : "Glisser une vidéo ici"}
                  </p>
                  <p className="mt-0.5 text-[0.67rem] text-white/25">
                    ou{" "}
                    <span className="text-white/40 underline underline-offset-2">
                      appuyer pour sélectionner
                    </span>
                    {" · "}
                    {isImage ? "JPG, PNG, WebP, SVG · max 5 MB" : "MP4, WebM · max 50 MB"}
                  </p>
                  {isImage && (
                    <p className="mt-1 text-[0.62rem] text-[rgba(201,165,90,0.55)]">
                      ✦ Converti automatiquement en WebP
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Input fichier caché — capture="environment" aide sur mobile */}
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleFileInput}
          />

          {/* ── Message d'erreur contextuel ── */}
          {uploadErr && (
            <div className="flex items-start gap-2 rounded-xl border border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.08)] px-3 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#f87171]" />
              <div className="min-w-0">
                <p className="text-[0.76rem] font-semibold text-[#f87171]">Erreur d&apos;upload</p>
                <p className="mt-0.5 text-[0.71rem] leading-relaxed text-[#f87171]/75">{uploadErr}</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadErr(null)}
                className="ml-auto shrink-0 text-[#f87171]/40 hover:text-[#f87171]"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Panneau URL ──────────────────────────────────────────────────── */}
      {tab === "url" && (
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
      )}

      {/* ── Aperçu de l'URL courante ─────────────────────────────────────── */}
      {hasUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="aperçu"
              className="h-10 w-14 shrink-0 rounded-lg object-contain bg-white/[0.04]"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Film size={18} className="shrink-0 text-white/25" />
          )}
          <p className="min-w-0 flex-1 truncate text-[0.7rem] text-white/40" title={currentUrl}>
            {currentUrl}
          </p>
          <button
            type="button"
            onClick={clearUrl}
            title={`Supprimer l'${typeLabel}`}
            className="shrink-0 rounded-lg p-1 text-white/20 transition-colors hover:bg-[rgba(248,113,113,0.1)] hover:text-[#f87171]"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
