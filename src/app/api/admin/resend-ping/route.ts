/**
 * GET /api/admin/resend-ping
 *
 * Valide la clé RESEND_API_KEY en appelant l'API Resend (GET /domains)
 * sans envoyer aucun email. Retourne un diagnostic complet.
 *
 * Réponse :
 *   { ok: true,  key_preview, from, domains[] }   ← clé valide
 *   { ok: false, error, key_preview, fix }         ← clé invalide ou absente
 */

import { NextResponse } from "next/server";

function sanitizeKey(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/^["']|["']$/g, "").trim();
}

export async function GET() {
  const rawKey  = process.env.RESEND_API_KEY;
  const key     = sanitizeKey(rawKey);
  const from    = process.env.RESEND_FROM?.trim() ?? "DJAMA <noreply@djama.space>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";

  // ── Diagnostic des variables ─────────────────────────────────
  const keyPreview = key
    ? `${key.slice(0, 7)}...${key.slice(-4)} (${key.length} chars)`
    : "ABSENTE";

  const hasQuotes = !!rawKey && (rawKey.startsWith('"') || rawKey.startsWith("'"));
  const hasSpaces = !!rawKey && rawKey !== rawKey.trim();

  const envInfo = {
    RESEND_API_KEY_set:    !!rawKey,
    RESEND_API_KEY_preview: keyPreview,
    RESEND_API_KEY_had_quotes: hasQuotes,
    RESEND_API_KEY_had_spaces: hasSpaces,
    RESEND_FROM:           from,
    NEXT_PUBLIC_SITE_URL:  siteUrl,
  };

  if (!key) {
    return NextResponse.json({
      ok:          false,
      error:       "RESEND_API_KEY absente ou vide dans les variables Vercel.",
      fix:         "Vercel → Settings → Environment Variables → Ajouter RESEND_API_KEY avec la valeur exacte de resend.com/api-keys",
      key_preview: keyPreview,
      env:         envInfo,
    }, { status: 500 });
  }

  if (!key.startsWith("re_")) {
    return NextResponse.json({
      ok:          false,
      error:       `La clé ne commence pas par "re_" — format invalide.`,
      fix:         `La valeur actuelle (${keyPreview}) ne ressemble pas à une clé Resend valide. Copiez-la directement depuis resend.com/api-keys.`,
      key_preview: keyPreview,
      env:         envInfo,
    }, { status: 400 });
  }

  // ── Appel API Resend (GET /domains — aucun email envoyé) ─────
  try {
    const res = await fetch("https://api.resend.com/domains", {
      method:  "GET",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/json",
      },
    });

    const body = await res.json() as {
      data?:    { id: string; name: string; status: string }[];
      name?:    string;
      message?: string;
      statusCode?: number;
    };

    if (!res.ok) {
      const errMsg = body.message ?? body.name ?? `HTTP ${res.status}`;
      return NextResponse.json({
        ok:          false,
        error:       errMsg,
        http_status: res.status,
        fix:         res.status === 401
          ? `Clé rejetée par Resend (401 Unauthorized). Vérifiez que la clé ${keyPreview} est bien active sur resend.com/api-keys et qu'elle n'a pas été révoquée.`
          : `Erreur Resend HTTP ${res.status} : ${errMsg}`,
        key_preview: keyPreview,
        env:         envInfo,
      }, { status: 400 });
    }

    const domains = body.data ?? [];
    const djamaDomain = domains.find(d => d.name?.includes("djama.space"));

    return NextResponse.json({
      ok:          true,
      message:     "Clé Resend valide ✓",
      key_preview: keyPreview,
      from,
      domains:     domains.map(d => ({ name: d.name, status: d.status })),
      djama_domain_status: djamaDomain
        ? `${djamaDomain.name} → ${djamaDomain.status}`
        : "djama.space non trouvé dans les domaines Resend",
      env:         envInfo,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok:          false,
      error:       `Erreur réseau : ${msg}`,
      fix:         "Vérifiez la connectivité réseau de la fonction Vercel.",
      key_preview: keyPreview,
      env:         envInfo,
    }, { status: 500 });
  }
}
