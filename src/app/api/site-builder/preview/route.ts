/**
 * POST /api/site-builder/preview
 * Génère le HTML d'un site sans le sauvegarder en base.
 * Utilisé par le wizard pour l'aperçu temps réel.
 */
import { NextRequest } from "next/server";
import { getClientIp, checkRateLimitAsync } from "@/lib/rate-limit";
import { renderSiteHTML, TEMPLATES } from "@/lib/site-builder";
import type { SiteConfig } from "@/lib/site-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`preview:${ip}`, 30, 60 * 60 * 1000);
  if (!allowed) return new Response("Rate limit", { status: 429 });

  let config: SiteConfig;
  let slug: string;
  try {
    const body = await req.json() as { config: SiteConfig; slug?: string };
    config = body.config;
    slug = String(body.slug || "preview").replace(/[^a-z0-9-]/g, "-").slice(0, 50) || "preview";
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!config || !TEMPLATES[config.template]) {
    return new Response("Invalid config", { status: 400 });
  }
  if (!config.businessName) config.businessName = "Mon entreprise";

  const html = renderSiteHTML(config, slug);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
