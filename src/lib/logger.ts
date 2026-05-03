/**
 * Logger structuré DJAMA
 *
 * - En développement : tous les niveaux s'affichent
 * - En production    : seulement warn + error (pas de PII dans les logs Vercel)
 */

const isProd = process.env.NODE_ENV === "production";

function fmt(level: string, module: string, msg: string, data?: unknown): string {
  const ts = new Date().toISOString();
  return data !== undefined
    ? `[${ts}] [${level}] [${module}] ${msg} ${JSON.stringify(data)}`
    : `[${ts}] [${level}] [${module}] ${msg}`;
}

export function createLogger(module: string) {
  return {
    /** Infos générales — muet en production */
    info(msg: string, data?: unknown) {
      if (!isProd) console.log(fmt("INFO", module, msg, data));
    },

    /** Débogage — muet en production */
    debug(msg: string, data?: unknown) {
      if (!isProd) console.debug(fmt("DEBUG", module, msg, data));
    },

    /** Avertissements — toujours affiché, sans données sensibles */
    warn(msg: string) {
      console.warn(fmt("WARN", module, msg));
    },

    /** Erreurs — toujours affiché, message uniquement (pas de stack PII) */
    error(msg: string, err?: unknown) {
      const detail = err instanceof Error ? err.message : String(err ?? "");
      console.error(fmt("ERROR", module, msg, detail || undefined));
    },
  };
}
