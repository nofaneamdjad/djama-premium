/**
 * Rate limiter — Upstash Redis en production, in-memory en fallback.
 *
 * En production Vercel (multi-instance) : utiliser Upstash Redis.
 * Sans les variables Upstash, bascule sur le Map en mémoire (dev / monorepo).
 *
 * Variables requises pour le mode distribué :
 *   UPSTASH_REDIS_REST_URL   → console.upstash.com → REST URL
 *   UPSTASH_REDIS_REST_TOKEN → console.upstash.com → REST Token
 *
 * Pas de dépendance npm Upstash — fetch() natif uniquement.
 *
 * FORMAT DES CLÉS Redis (namespacing recommandé) :
 *   Quota individuel : `rl:{userId}:{routeName}`   ex: "rl:uuid-123:blog-generate"
 *   Quota org        : `rl:org:{orgId}:{routeName}` ex: "rl:org:org-456:blog-generate"
 *   Quota financier  : `fin:{operation}:{userId}`   ex: "fin:refund:uuid-123"
 *   Toutes les clés sont préfixées par l'environnement : "prod:", "preview:", "dev:"
 *
 * SÉPARATION PROD/DEV : utiliser deux bases Upstash distinctes (prod et dev/preview).
 * Le préfixe REDIS_ENV_PREFIX offre une couche supplémentaire si les bases sont partagées.
 */

/* ── Fallback in-memory (dev / absence Upstash) ──────────── */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

/** Vide tous les compteurs in-memory — UNIQUEMENT pour tests en développement. */
export function resetRateLimitStore(): void {
  store.clear();
  lastCleanup = Date.now();
}

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function checkRateLimitInMemory(
  key: string,
  maxReq: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  maybeCleanup();
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxReq - 1, resetAt };
  }

  if (entry.count >= maxReq) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxReq - entry.count, resetAt: entry.resetAt };
}

/* ── Préfixe d'environnement pour les clés Redis ─────────── */
// Garantit l'isolation entre prod / preview / dev même si la même base est utilisée.
// VERCEL_ENV = "production" | "preview" | "development" (injecté par Vercel automatiquement)
const REDIS_ENV_PREFIX = (() => {
  const e = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "dev";
  if (e === "production")   return "prod";
  if (e === "preview")      return "preview";
  return "dev";
})();

/** Construit une clé Redis namespaced : "{env}:rl:{userId}:{routeName}" */
export function buildRateLimitKey(userId: string, routeName: string): string {
  return `${REDIS_ENV_PREFIX}:rl:${userId}:${routeName}`;
}

/** Construit une clé Redis d'organisation : "{env}:rl:org:{orgId}:{routeName}" */
export function buildOrgRateLimitKey(orgId: string, routeName: string): string {
  return `${REDIS_ENV_PREFIX}:rl:org:${orgId}:${routeName}`;
}

/* ── Upstash Redis (production) ───────────────────────────── */

async function checkRateLimitUpstash(
  key: string,
  maxReq: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const windowSec = Math.ceil(windowMs / 1000);
  const now       = Date.now();
  const resetAt   = now + windowMs;

  // INCR+EXPIRE atomique via Lua EVAL (Upstash REST API, format array).
  // Syntaxe body Upstash REST : [script, numkeys, key1, arg1, ...]
  //   KEYS[1] = clé Redis (préfixée par buildRateLimitKey)
  //   ARGV[1] = durée de la fenêtre en secondes (string — Redis coerce en integer)
  // Évite la race condition INCR puis EXPIRE non atomiques.
  const luaScript = `local c=redis.call('INCR',KEYS[1]) if c==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end return c`;
  const evalRes = await fetch(`${url}/eval`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify([luaScript, 1, key, String(windowSec)]),
    cache:   "no-store",
  });

  if (!evalRes.ok) {
    // Upstash indisponible (503, 429 Upstash-level, etc.) — l'appelant gère
    throw new Error(`Upstash HTTP ${evalRes.status}`);
  }

  const evalData = await evalRes.json() as { result?: number; error?: string };
  if (evalData.error) throw new Error(`Upstash EVAL: ${evalData.error}`);
  const count = evalData.result ?? 1;

  if (count > maxReq) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: maxReq - count, resetAt };
}

/* ── Interface publique ──────────────────────────────────── */

const UPSTASH_ENABLED =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Rate limiting in-memory uniquement (par instance serveur).
 * ⚠️ En production multi-instance Vercel, les compteurs ne sont pas partagés.
 * Utiliser checkRateLimitAsync avec buildRateLimitKey.
 *
 * @deprecated Préférer checkRateLimitAsync dans les Route Handlers async.
 */
export function checkRateLimit(
  key: string,
  maxReq: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimitInMemory(key, maxReq, windowMs);
}

/**
 * Version async — utilise Upstash Redis si configuré, in-memory sinon.
 *
 * Usage recommandé dans les route handlers :
 *   const key = buildRateLimitKey(user.id, "blog-generate"); // clé par route
 *   const { allowed } = await checkRateLimitAsync(key, 10, 60 * 60 * 1000);
 */
export async function checkRateLimitAsync(
  key: string,
  maxReq: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (UPSTASH_ENABLED) {
    try {
      return await checkRateLimitUpstash(key, maxReq, windowMs);
    } catch (err) {
      console.warn("[RateLimit] Upstash error, fallback in-memory:", err);
      return checkRateLimitInMemory(key, maxReq, windowMs);
    }
  }
  return checkRateLimitInMemory(key, maxReq, windowMs);
}

/**
 * Version strict — propage l'erreur Upstash au lieu de basculer en in-memory.
 * À utiliser pour les opérations financières sensibles (fail-closed).
 * Si Upstash n'est pas configuré, bascule normalement sur in-memory.
 */
export async function checkRateLimitAsyncStrict(
  key: string,
  maxReq: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (UPSTASH_ENABLED) {
    return await checkRateLimitUpstash(key, maxReq, windowMs);
  }
  return checkRateLimitInMemory(key, maxReq, windowMs);
}

/**
 * Vérifie à la fois un quota individuel ET un quota organisationnel.
 * Utile pour les endpoints IA coûteux où une seule organisation ne doit pas
 * monopoliser les ressources même si ses membres ont des quotas individuels libres.
 *
 * @param userId   - ID Supabase de l'utilisateur (quota individuel)
 * @param orgId    - ID organisation (quota partagé entre membres)
 * @param routeName - Identifiant de la route (ex: "blog-generate")
 * @param maxPerUser - Quota individuel (ex: 10/h)
 * @param maxPerOrg  - Quota org (ex: 100/h). Si null, quota org non vérifié.
 * @param windowMs   - Fenêtre temporelle en ms (partagée pour les deux quotas)
 *
 * Usage :
 *   const { allowed, reason } = await checkRateLimitAsyncWithOrg(
 *     user.id, orgId, "blog-generate", 10, 100, 60 * 60 * 1000
 *   );
 *   if (!allowed) {
 *     const msg = reason === "org" ? "Quota organisation atteint." : "Quota personnel atteint.";
 *     return NextResponse.json({ error: msg }, { status: 429 });
 *   }
 */
export async function checkRateLimitAsyncWithOrg(
  userId:    string,
  orgId:     string | null,
  routeName: string,
  maxPerUser: number,
  maxPerOrg:  number | null,
  windowMs:  number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number; reason?: "user" | "org" }> {
  // Vérification quota individuel
  const userKey    = buildRateLimitKey(userId, routeName);
  const userResult = await checkRateLimitAsync(userKey, maxPerUser, windowMs);
  if (!userResult.allowed) {
    return { ...userResult, reason: "user" };
  }

  // Vérification quota organisationnel (optionnel)
  if (orgId && maxPerOrg !== null) {
    const orgKey    = buildOrgRateLimitKey(orgId, routeName);
    const orgResult = await checkRateLimitAsync(orgKey, maxPerOrg, windowMs);
    if (!orgResult.allowed) {
      return { ...orgResult, reason: "org" };
    }
  }

  return userResult;
}

/** Indique si Upstash Redis est configuré (utile pour les tests). */
export function isUpstashEnabled(): boolean {
  return UPSTASH_ENABLED;
}

/**
 * Réinitialise un compteur de rate limit spécifique.
 * Utile pour effacer un compteur brute force après une authentification réussie.
 * Silencieux en cas d'erreur — le reset n'est pas critique.
 */
export async function resetRateLimitKey(key: string): Promise<void> {
  if (UPSTASH_ENABLED) {
    const url   = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    try {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache:   "no-store",
      });
    } catch {
      // Reset silencieux — le compteur expire de toute façon via TTL
    }
  } else {
    store.delete(key);
  }
}

/**
 * Extrait l'IP depuis les headers Next.js / Vercel.
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : new Headers();
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
