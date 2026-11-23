/**
 * scripts/mock-upstash-server.mjs
 *
 * Serveur HTTP minimal qui simule l'API REST Upstash Redis.
 * Utilisé pour les tests distribués S4 V2 — aucune dépendance externe.
 *
 * Implémente uniquement les endpoints utilisés par rate-limit.ts :
 *   POST /eval  → INCR + EXPIRE atomique (script Lua simulé)
 *
 * Usage :
 *   node scripts/mock-upstash-server.mjs
 *   # Écoute sur http://localhost:16480
 */

import { createServer } from "http";

const PORT = parseInt(process.env.MOCK_UPSTASH_PORT ?? "16480", 10);
const MOCK_TOKEN = process.env.MOCK_UPSTASH_TOKEN ?? "mock-token";

// Stockage partagé : simule la base de données Redis
const store = new Map(); // key → { count, resetAt }
const logs  = [];

function logOp(op, key, value) {
  logs.push({ ts: Date.now(), op, key, value });
}

/** Éxecution de la commande EVAL Lua INCR+EXPIRE (notre pattern rate-limit) */
function evalLuaRateLimit(key, windowSec) {
  const now    = Date.now();
  const entry  = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowSec * 1000;
    store.set(key, { count: 1, resetAt });
    logOp("INCR_NEW", key, 1);
    return 1;
  }

  entry.count++;
  logOp("INCR_EXISTING", key, entry.count);
  return entry.count;
}

function getEntry(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.resetAt) {
    store.delete(key);
    return null;
  }
  return entry;
}

const server = createServer((req, res) => {
  // Auth vérification
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.includes(MOCK_TOKEN)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    try {
      const url = req.url ?? "/";
      const method = req.method ?? "GET";

      // POST /eval — INCR+EXPIRE atomique
      if (method === "POST" && url === "/eval") {
        const payload = JSON.parse(body);
        // payload = [luaScript, numkeys, key, windowSec]
        const key       = payload[2];
        const windowSec = parseInt(payload[3], 10);

        const count = evalLuaRateLimit(key, windowSec);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result: count }));
        return;
      }

      // GET /get/:key — lecture directe (pour tests)
      if (method === "GET" && url.startsWith("/get/")) {
        const key   = decodeURIComponent(url.slice(5));
        const entry = getEntry(key);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result: entry ? entry.count : null }));
        return;
      }

      // DELETE /del/:key — suppression (pour reset entre tests)
      if (method === "DELETE" && url.startsWith("/del/")) {
        const key = decodeURIComponent(url.slice(5));
        store.delete(key);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result: 1 }));
        return;
      }

      // GET /flushall — vide tout (entre scénarios de test)
      if (method === "DELETE" && url === "/flushall") {
        store.clear();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result: "OK" }));
        return;
      }

      // GET /logs — pour inspection dans les tests
      if (method === "GET" && url === "/logs") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(logs.slice(-100)));
        return;
      }

      // GET /store — dump complet pour inspection
      if (method === "GET" && url === "/store") {
        const dump = {};
        for (const [k, v] of store.entries()) {
          dump[k] = { count: v.count, ttlMs: Math.max(0, v.resetAt - Date.now()) };
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(dump));
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));

    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`MOCK_UPSTASH_READY:${PORT}\n`);
});

server.on("error", (err) => {
  process.stderr.write(`Mock Upstash server error: ${err.message}\n`);
  process.exit(1);
});

// Export pour usage en in-process (via worker_threads ou import direct)
export { server, store, PORT, MOCK_TOKEN };
