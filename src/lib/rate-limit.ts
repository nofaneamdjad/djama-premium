/**
 * Rate limiter simple en mémoire (par IP)
 *
 * Adapté pour Next.js API Routes / Route Handlers.
 * Fonctionne en serverless (par instance) — pour un rate limiting
 * distribué, utiliser Redis (Upstash) à l'avenir.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique pour éviter les fuites mémoire
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // toutes les 60s
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Vérifie si une IP est dans les limites autorisées.
 *
 * @param ip         Adresse IP du client
 * @param maxReq     Nombre max de requêtes sur la fenêtre
 * @param windowMs   Durée de la fenêtre en millisecondes
 * @returns `{ allowed: boolean, remaining: number, resetAt: number }`
 */
export function checkRateLimit(
  ip: string,
  maxReq: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  maybeCleanup();
  const now = Date.now();
  const key = `${ip}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // Nouvelle fenêtre
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
