/**
 * Génère et vérifie le token de session admin.
 *
 * Au lieu de stocker le mot de passe brut dans le cookie,
 * on stocke un HMAC-SHA256 : même si le cookie est lu,
 * l'attaquant ne peut pas retrouver le mot de passe.
 *
 * Compatible Edge Runtime (middleware) et Node.js (API routes).
 */

const SALT = "djama_admin_session_v2";

async function hmac(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(password);
  const msgData = encoder.encode(password + SALT);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Génère le token à stocker dans le cookie à partir du mot de passe admin */
export async function generateAdminToken(password: string): Promise<string> {
  return hmac(password);
}

/** Vérifie que le cookie correspond au mot de passe admin */
export async function verifyAdminToken(
  token: string,
  password: string
): Promise<boolean> {
  if (!token || !password) return false;
  const expected = await hmac(password);
  // Comparaison à temps constant pour éviter les timing attacks
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
