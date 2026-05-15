"use client";

/**
 * MediaUploader — composant réutilisable pour uploader images ou vidéos
 * vers Supabase Storage.
 *
 * Props :
 *   type          "image" | "video"
 *   bucket        Bucket Supabase (défaut : "djama-media")
 *   folder        Sous-dossier (défaut : "images" / "videos"). Vide = racine.
 *   apiPath       Si fourni, l'upload passe par cette route API serveur au lieu
 *                 d'appeler Supabase Storage directement depuis le client.
 *                 Nécessaire quand le client n'a pas de session Supabase Auth
 *                 (ex : admin avec auth localStorage). La route doit accepter
 *                 un POST multipart/form-data avec : file, bucket, path.
 *   currentUrl    URL actuellement stockée en base
 *   onUrlChange   Callback avec la nouvelle URL (upload réussi OU saisie manuelle)
 *   label         Label affiché au-dessus (optionnel)
 *
 * Fixes appliqués :
 *   - apiPath     : upload via route serveur (service_role) → bypass RLS
 *   - Path        : folder vide → fichier à la racine (pas de "/" en tête)
 *   - SVG         : bypass de la compression canvas (incompatible sur mobile)
 *   - Compression : fallback vers le fichier original si canvas échoue
 *   - Erreurs     : messages contextuels (403, 404, réseau…)
 *   - Succès      : visible 2,5 s avant reset
 *   - upsert:true : évite les conflits 409 (rare)
 */

import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, CheckCircle2, Film, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMG = 5  * 1024 * 1024;   // 5 MB
const MAX_VID = 50 * 1024 * 1024;   // 50 MB

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
 * - SVG  : contournement direct (pas de canvas ; rendu SVG mobile non fiable)
 * - Fail : renvoie le fichier original non compressé (ne rejette jamais)
 */
async function compressImage(
  file: File,
  maxWidth = 1920,
  quality  = 0.85,
): Promise<{ blob: Blob; ext: string; mimeType: string }> {
  if (file.type === "image/svg+xml") {
    return { blob: file, ext: "svg", mimeType: "image/svg+xml" };
  }

  return new Promise(resolve => {
    const img    = new window.Image();
    const objUrl = URL.createObjectURL(file);

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

      canvas.toBlob(
        webpBlob => {
          if (webpBlob && webpBlob.size > 0) {
            resolve({ blob: webpBlob, ext: "webp", mimeType: "image/webp" });
            return;
          }
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
 * Formate une erreur Supabase Storage en message utilisateur lisible.
 */
function formatStorageError(err: unknown, bucketName: string): string {
  if (!err) return "Erreur inconnue lors de l'upload.";

  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("canvas") || m.includes("compression"))
      return "Impossible de traiter l'image. Essayez un autre format (JPG ou PNG).";
    if (m.includes("network") || m.includes("fetch") || m.includes("failed"))
      return "Connexion interrompue. Vérifiez votre réseau et réessayez.";
    return `Erreur : ${err.message}`;
  }

  if (typeof err === "object" && err !== null) {
    const e    = err as Record<string, unknown>;
    const code = String(e.statusCode ?? e.status ?? "");
    const msg  = String(e.message ?? e.error ?? "").toLowerCase();

    if (code === "403" || msg.includes("unauthorized") || msg.includes("forbidden"))
      return `Accès refusé au bucket "${bucketName}". Vérifiez les politiques RLS dans Supabase Storage.`;
    if (code === "404" || msg.includes("not found") || msg.includes("bucket"))
      return `Bucket introuvable : "${bucketName}". Créez-le dans Supabase → Storage → New bucket (accès public activé).`;
    if (code === "413" || msg.includes("too large") || msg.includes("payload"))
      return "Fichier trop volumineux pour le serveur. Réduisez la taille et réessayez.";
    if (code === "409" || msg.includes("already exists"))
      return "Un fichier avec ce nom existe déjà. Réessayez.";
    if (msg.includes("row-level security") || msg.includes("rls") || msg.includes("violates"))
      return `Politique de sécurité Supabase bloquante (RLS). ` +
             `L'upload doit passer par la route API serveur (prop apiPath). ` +
             `Vérifiez que apiPath="/api/admin/upload" est bien passé au composant.`;
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
  type:         MediaUploaderType;
  /** Bucket Supabase Storage (défaut : "djama-media") */
  bucket?:      string;
  /** Sous-dossier. Vide ("") = racine du bucket. */
  folder?:      string;
  /**
   * Route API serveur à utiliser pour l'upload (optionnel).
   * Quand fourni, le fichier est envoyé en POST multipart/form-data à cette URL
   * plutôt que directement à Supabase depuis le client.
   * Nécessaire quand le client n'a pas de session Supabase Auth (ex : admin
   * avec auth localStorage) — la route serveur utilise la service_role_key
   * et bypasse entièrement les RLS.
   * Ex : apiPath="/api/admin/upload"
   */
  apiPath?:     string;
  currentUrl:   string;
  onUrlChange:  (url: string) => void;
  label?:       string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

export function MediaUploader({
  type,
  bucket   = "djama-media",
  folder,
  apiPath,
  currentUrl,
  onUrlChange,
  label,
}: MediaUploaderProps) {
  const [tab,       setTab]       = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [success,   setSuccess]   = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const BUCKET = bucket;

  // folder="" → racine du bucket (pas de slash en tête du path)
  const effectiveFolder =
    folder !== undefined
      ? folder
      : type === "image" ? "images" : "videos";

  const maxBytes   = type === "image" ? MAX_IMG : MAX_VID;
  const maxLabel   = type === "image" ? "5 MB"  : "50 MB";
  const acceptAttr = type === "image" ? ACCEPT_IMAGE : ACCEPT_VIDEO;

  // ── Upload ───────────────────────────────────────────────────────────────

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
      // ── 1. Compression (image seulement) ──────────────────────────────
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

      // ── 2. Construction du path (sans slash initial) ──────────────────
      const filename = `${Date.now()}-${uid()}.${ext}`;
      const path     = effectiveFolder ? `${effectiveFolder}/${filename}` : filename;

      // ── 3. Logs de diagnostic ─────────────────────────────────────────
      console.group("[MediaUploader] upload diagnostics");
      console.log("bucket      :", BUCKET);
      console.log("path        :", path);
      console.log("mimeType    :", mimeType);
      console.log("size (blob) :", uploadBlob.size, "bytes");
      console.log("apiPath     :", apiPath ?? "(aucun — upload direct Supabase)");

      // Vérification session Supabase (info diagnostic)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        console.log("supabase session :", session ? `user=${session.user.id} role=${session.user.role}` : "null (anon)");
        if (!session && !apiPath) {
          console.warn(
            "⚠️  Pas de session Supabase + pas d'apiPath → l'upload va partir en rôle 'anon'.",
            "Les policies RLS 'FOR authenticated' ne matcheront pas.",
            "Passez apiPath='/api/admin/upload' pour contourner RLS via service_role.",
          );
        }
      } catch {
        console.log("supabase session : (impossible à lire)");
      }
      console.groupEnd();

      setProgress(55);

      // ── 4a. Upload via route API serveur (bypass RLS) ──────────────────
      if (apiPath) {
        const fd = new FormData();
        fd.append("file",   new File([uploadBlob], filename, { type: mimeType }));
        fd.append("bucket", BUCKET);
        fd.append("path",   path);

        const res = await fetch(apiPath, {
          method:  "POST",
          headers: { "x-djama-admin": "ok" },
          body:    fd,
        });

        setProgress(90);

        const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

        if (!res.ok) {
          console.error("[MediaUploader] API upload error:", json);
          const msg = typeof json?.error === "string" ? json.error : `Erreur serveur (${res.status})`;
          throw new Error(msg);
        }

        const publicUrl: string = json.url;
        console.log("[MediaUploader] API upload success →", publicUrl);
        onUrlChange(publicUrl);

      // ── 4b. Upload direct Supabase (si pas d'apiPath) ──────────────────
      } else {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .upload(path, uploadBlob, {
            contentType:  mimeType,
            cacheControl: "3600",
            upsert:       true,
          });

        if (storageError) {
          console.error("[MediaUploader] storageError:", JSON.stringify(storageError));
          throw storageError;
        }

        setProgress(90);

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        console.log("[MediaUploader] direct upload success →", publicUrl);
        onUrlChange(publicUrl);
      }

      // ── 5. Succès ─────────────────────────────────────────────────────
      setProgress(100);
      setSuccess(true);
      setTimeout(() => { setProgress(0); setSuccess(false); }, 2500);

    } catch (err) {
      console.error("[MediaUploader] upload error (final catch):", err);
      setUploadErr(
        err instanceof Error
          ? (err.message.length > 10 ? err.message : formatStorageError(err, BUCKET))
          : formatStorageError(err, BUCKET),
      );
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
    e.target.value = "";
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
        <label className="block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-gray-400">
          {label}
        </label>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(["upload", "url"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[0.74rem] font-bold transition-all ${
              tab === t
                ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"
                : "text-gray-500 hover:text-gray-700"
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
                ? "pointer-events-none border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.04)]"
                : dragOver
                  ? "border-[rgba(201,165,90,0.6)] bg-[rgba(201,165,90,0.06)] scale-[1.01]"
                  : success
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
            ].join(" ")}
          >
            {/* Upload en cours */}
            {uploading && (
              <>
                <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
                <p className="text-[0.74rem] font-semibold text-gray-500">
                  {isImage ? "Traitement et upload…" : "Upload en cours…"}
                </p>
                <div className="absolute bottom-3 left-5 right-5 h-[3px] overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a55a] to-[#e8cc94] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}

            {/* Succès */}
            {!uploading && success && (
              <>
                <CheckCircle2 size={24} className="text-[#4ade80]" />
                <p className="text-[0.78rem] font-bold text-[#4ade80]">Upload réussi !</p>
                <p className="text-[0.66rem] text-[#4ade80]/60">Cliquez pour uploader un autre fichier</p>
              </>
            )}

            {/* Idle */}
            {!uploading && !success && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  {isImage
                    ? <Upload size={18} className="text-gray-400" />
                    : <Film   size={18} className="text-gray-400" />
                  }
                </div>
                <div className="px-4 text-center">
                  <p className="text-[0.82rem] font-semibold text-gray-600">
                    {isImage ? "Glisser une image ici" : "Glisser une vidéo ici"}
                  </p>
                  <p className="mt-0.5 text-[0.67rem] text-gray-400">
                    ou{" "}
                    <span className="text-gray-600 underline underline-offset-2">
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

          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Erreur contextuelle */}
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
              : "https://youtube.com/… · https://vimeo.com/… · ou lien direct .mp4"
          }
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[0.84rem] text-gray-700 placeholder:text-gray-400 outline-none transition-colors focus:border-[rgba(201,165,90,0.5)] focus:bg-white"
        />
      )}

      {/* ── Aperçu ───────────────────────────────────────────────────────── */}
      {hasUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="aperçu"
              className="h-10 w-14 shrink-0 rounded-lg object-contain bg-gray-100"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Film size={18} className="shrink-0 text-gray-400" />
          )}
          <p className="min-w-0 flex-1 truncate text-[0.7rem] text-gray-500" title={currentUrl}>
            {currentUrl}
          </p>
          <button
            type="button"
            onClick={clearUrl}
            title={`Supprimer l'${typeLabel}`}
            className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
