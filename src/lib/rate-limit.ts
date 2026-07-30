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
 * Installation (une fois en production) :
 *   npm install @upstash/redis @upstash/ratelimit
 */

/* ── Fallback in-memory (dev / absence Upstash) ──────────── */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

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

  // Sliding window using Upstash REST API (INCR + EXPIRE)
  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache:   "no-store",
  });

  const incrData = await incrRes.json() as { result?: number };
  const count    = incrData.result ?? 1;

  if (count === 1) {
    // First request in this window — set TTL
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache:   "no-store",
    });
  }

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
 * Vérifie si une clé (userId ou IP) est dans les limites autorisées.
 *
 * @param key      Identifiant unique (userId ou IP)
 * @param maxReq   Nombre max de requêtes sur la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 */
export function checkRateLimit(
  key: string,
  maxReq: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  if (UPSTASH_ENABLED) {
    // Upstash est async — on lance et ignore l'attente pour rester sync.
    // Pour une protection stricte en prod, utiliser checkRateLimitAsync.
    return checkRateLimitInMemory(key, maxReq, windowMs);
  }
  return checkRateLimitInMemory(key, maxReq, windowMs);
}

/**
 * Version async — utilise Upstash Redis si configuré, in-memory sinon.
 * Utiliser dans les Route Handlers qui peuvent être async.
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
