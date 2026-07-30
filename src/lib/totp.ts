/**
 * TOTP (RFC 6238) — implémentation pure Web Crypto, compatible Edge Runtime.
 * Fonctionne avec Google Authenticator, Authy, Bitwarden, etc.
 *
 * Le secret doit être base32 (ex: généré par `openssl rand -base32 20`).
 * L'ajouter dans .env.local : ADMIN_TOTP_SECRET=JBSWY3DPEHPK3PXP
 *
 * Si ADMIN_TOTP_SECRET n'est pas défini, la 2FA est désactivée (compatibilité
 * ascendante — définir la variable pour l'activer).
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(encoded: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  const upper = encoded.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");

  for (const char of upper) {
    const idx = BASE32.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    secret.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  // counter as big-endian 8-byte buffer
  const stepBuf = new ArrayBuffer(8);
  const view    = new DataView(stepBuf);
  view.setUint32(4, counter >>> 0, false);

  const hmac   = new Uint8Array(await crypto.subtle.sign("HMAC", key, stepBuf));
  const offset = hmac[19] & 0x0f;
  const code   =
    (((hmac[offset]     & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8)  |
       (hmac[offset + 3] & 0xff)) % 1_000_000;

  return code.toString().padStart(6, "0");
}

/**
 * Vérifie un code TOTP 6 chiffres.
 * Accepte le pas courant ±1 (60 secondes de tolérance d'horloge).
 */
export async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const cleaned = token.trim().replace(/\s/g, "");
  if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) return false;

  const keyBytes = decodeBase32(secret);
  const step     = Math.floor(Date.now() / 30_000);

  for (const delta of [-1, 0, 1]) {
    const expected = await hotp(keyBytes, step + delta);
    if (expected === cleaned) return true;
  }
  return false;
}

/** Indique si la 2FA est configurée (ADMIN_TOTP_SECRET défini et non vide). */
export function isTOTPEnabled(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET?.trim());
}
