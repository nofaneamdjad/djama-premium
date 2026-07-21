/**
 * Génère et vérifie le token de session admin.
 *
 * Utilise PBKDF2-SHA256 (100 000 itérations) pour rendre le brute-force
 * hors-ligne 100 000× plus coûteux qu'un simple HMAC.
 * Le résultat dérivé est mis en cache en mémoire : seule la première
 * requête après démarrage paie le coût de dérivation (~100 ms).
 *
 * Compatible Edge Runtime et Node.js (crypto.subtle).
 */

const SALT = "djama_admin_session_v2";
const ITERATIONS = 100_000;

// Cache en mémoire : évite de recalculer PBKDF2 à chaque requête proxy.
let _cachedPass: string | null = null;
let _cachedToken: string | null = null;

async function derive(password: string): Promise<string> {
  if (_cachedPass === password && _cachedToken !== null) return _cachedToken;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(SALT), iterations: ITERATIONS },
    keyMaterial,
    256,
  );
  const result = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  _cachedPass = password;
  _cachedToken = result;
  return result;
}

/** Génère le token à stocker dans le cookie à partir du mot de passe admin */
export async function generateAdminToken(password: string): Promise<string> {
  return derive(password);
}

/** Vérifie que le cookie correspond au mot de passe admin */
export async function verifyAdminToken(
  token: string,
  password: string,
): Promise<boolean> {
  if (!token || !password) return false;
  const expected = await derive(password);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
