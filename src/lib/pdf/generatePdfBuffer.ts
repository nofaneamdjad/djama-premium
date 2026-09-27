/**
 * generatePdfBuffer — Server-side PDF generation (Node.js only).
 * Returns a Buffer containing the PDF bytes, suitable for email attachments.
 * Does NOT use browser APIs (FileReader, window.Image).
 */
import type { CompanySettings } from "./companySettings";
import type { TemplateType, RGB } from "./types";
import { getTheme } from "./pdfThemes";
import { renderPdfWithTheme } from "./pdfRenderer";
import type { PdfData } from "./generatePdf";

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [isNaN(r) ? 201 : r, isNaN(g) ? 165 : g, isNaN(b) ? 90 : b];
}

/** Extract image dimensions from PNG/JPEG bytes without an external library. */
function getImgDimensions(buf: Buffer, contentType: string): { w: number; h: number } {
  try {
    if (contentType.includes("png") && buf.length >= 24) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w > 0 && h > 0) return { w, h };
    }
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) break;
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xc3) {
          return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {}
  // Sensible fallback ratio for landscape logos
  return { w: 200, h: 80 };
}

async function loadLogoImageNode(url: string): Promise<{
  dataUri: string; naturalW: number; naturalH: number;
} | null> {
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    const buf = Buffer.from(ab);
    const ct = (resp.headers.get("content-type") ?? "image/png").split(";")[0].trim();
    const dataUri = `data:${ct};base64,${buf.toString("base64")}`;
    const { w: naturalW, h: naturalH } = getImgDimensions(buf, ct);
    return { dataUri, naturalW, naturalH };
  } catch (err) {
    console.warn("[generatePdfBuffer] Logo load failed:", err);
    return null;
  }
}

export async function generatePdfBuffer(data: PdfData): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");

  const template: TemplateType = data.template ?? "modern";
  let theme = getTheme(template);

  if (data.accentColor && theme.variant === "accent-bar") {
    const rgb = hexToRgb(data.accentColor);
    theme = { ...theme, accentBarColor: rgb, labelColor: rgb };
  }

  const co: Required<CompanySettings> = {
    logoUrl:          data.company?.logoUrl          ?? null,
    name:             data.company?.name             ?? "",
    email:            data.company?.email            ?? "",
    website:          data.company?.website          ?? "",
    phone:            data.company?.phone            ?? "",
    address:          data.company?.address          ?? "",
    postal_code:      data.company?.postal_code      ?? "",
    city:             data.company?.city             ?? "",
    country:          data.company?.country          ?? "",
    siret:            data.company?.siret            ?? "",
    ape:              data.company?.ape              ?? "",
    vat_number:       data.company?.vat_number       ?? "",
    iban:             data.company?.iban             ?? "",
    bic:              data.company?.bic              ?? "",
    forme_juridique:  data.company?.forme_juridique  ?? "",
    capital_social:   data.company?.capital_social   ?? "",
    garantie:         data.company?.garantie         ?? "",
    mentions_legales: data.company?.mentions_legales ?? "",
    logoSize:         data.company?.logoSize         ?? "md",
    logoHideName:     data.company?.logoHideName     ?? false,
    template:         data.company?.template         ?? "modern",
    color:            data.company?.color            ?? "#c9a55a",
    logoTransform:    data.company?.logoTransform    ?? null,
  };

  let logoImg = null;
  if (co.logoUrl) {
    logoImg = await loadLogoImageNode(co.logoUrl);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  await renderPdfWithTheme(
    doc,
    { ...data, template, logoTransform: data.logoTransform ?? null },
    co,
    theme,
    logoImg,
  );

  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}
