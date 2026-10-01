/**
 * WOPI token generation/validation + file type helpers
 * Utilisé par le WOPI host DJAMA pour sécuriser l'accès à Collabora Online.
 *
 * Variable d'env requise : WOPI_SECRET (chaîne aléatoire ≥ 32 chars)
 * Générer avec : openssl rand -hex 32
 */
import { createHmac } from "crypto";

// ── Secret ──────────────────────────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.WOPI_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "[WOPI] WOPI_SECRET manquant ou trop court. " +
      "Ajoutez WOPI_SECRET dans .env.local et Vercel env vars.",
    );
  }
  return s;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type WopiRole = "owner" | "editor" | "commenter" | "viewer";

export type FileType = "document" | "spreadsheet" | "presentation";

export interface WopiTokenPayload {
  noteId:  string;
  userId:  string;
  role:    WopiRole;
  expires: number; // Unix ms
}

// ── Token ────────────────────────────────────────────────────────────────────

/** Génère un token WOPI signé HMAC, valide 1 heure. */
export function generateWopiToken(
  payload: Omit<WopiTokenPayload, "expires">,
): string {
  const expires = Date.now() + 60 * 60_000;
  const data = `${payload.noteId}|${payload.userId}|${payload.role}|${expires}`;
  const sig  = createHmac("sha256", getSecret()).update(data).digest("hex");
  return Buffer.from(`${data}|${sig}`).toString("base64url");
}

/**
 * Valide et décode un token WOPI.
 * Retourne null si expiré, signature incorrecte, ou format invalide.
 */
export function validateWopiToken(token: string): WopiTokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts   = decoded.split("|");
    if (parts.length !== 5) return null;

    const [noteId, userId, role, expiresStr, sig] = parts;
    const expires = Number(expiresStr);
    if (Number.isNaN(expires) || Date.now() > expires) return null;

    const data     = `${noteId}|${userId}|${role}|${expiresStr}`;
    const expected = createHmac("sha256", getSecret()).update(data).digest("hex");
    if (!timingSafeEqual(expected, sig)) return null;

    return { noteId, userId, role: role as WopiRole, expires };
  } catch {
    return null;
  }
}

/** Comparaison en temps constant pour prévenir les timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── File type helpers ────────────────────────────────────────────────────────

export const FILE_TYPE_META: Record<
  FileType,
  { extension: string; mimeType: string }
> = {
  document: {
    extension: ".docx",
    mimeType:  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  spreadsheet: {
    extension: ".xlsx",
    mimeType:  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  presentation: {
    extension: ".pptx",
    mimeType:  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

/** Chemin de stockage canonique dans le bucket "office-files". */
export function buildStoragePath(
  userId: string,
  noteId: string,
  fileType: FileType,
): string {
  const { extension } = FILE_TYPE_META[fileType];
  return `${userId}/${noteId}${extension}`;
}

/** Chemin d'une version archivée. */
export function buildVersionPath(
  noteId: string,
  timestamp: number,
  fileType: FileType,
): string {
  const { extension } = FILE_TYPE_META[fileType];
  return `versions/${noteId}/${timestamp}${extension}`;
}

/** URL complète vers l'éditeur Collabora pour un document. */
export function buildCollaboraUrl(params: {
  wopiSrc:     string;
  accessToken: string;
}): string {
  const base = process.env.NEXT_PUBLIC_COLLABORA_URL;
  if (!base) throw new Error("[WOPI] NEXT_PUBLIC_COLLABORA_URL non défini");

  const qs = new URLSearchParams({
    WOPISrc:      params.wopiSrc,
    access_token: params.accessToken,
  });
  return `${base}/browser/dist/cool.html?${qs.toString()}`;
}

/** URL de base WOPI pour un note_id donné. */
export function buildWopiSrc(noteId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://djama.space";
  return `${appUrl}/api/wopi/files/${noteId}`;
}
