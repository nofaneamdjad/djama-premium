/**
 * Génère les icônes PWA à partir de logo-navbar.png
 * Usage : node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const DIR = "public/icons";
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

const BG = { r: 9, g: 9, b: 11, alpha: 1 }; // #09090b

async function makeIcon(size, outFile) {
  const logoPath = "public/logo-navbar.png";
  const meta = await sharp(logoPath).metadata();

  /* Scale logo to 65% of icon width, maintain ratio */
  const logoW = Math.round(size * 0.65);
  const logoH  = Math.round((meta.height / meta.width) * logoW);
  const left   = Math.round((size - logoW) / 2);
  const top    = Math.round((size - logoH) / 2);

  const resized = await sharp(logoPath)
    .resize(logoW, logoH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outFile);

  console.log(`✓ ${outFile}  (${size}×${size})`);
}

await makeIcon(512, join(DIR, "icon-512.png"));
await makeIcon(192, join(DIR, "icon-192.png"));
await makeIcon(180, join(DIR, "apple-touch-icon.png"));

console.log("✅ Icônes PWA générées dans public/icons/");
