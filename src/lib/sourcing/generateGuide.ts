/**
 * generateGuide — PDF guide professionnel depuis une conversation Sourcing IA.
 *
 * Design : rapport d'entreprise sobre — blanc, navy, bleu accentué.
 * - Couverture : titre, sous-titre, séparateur, date, sommaire
 * - Pages : running header discret, chapitres, sections structurées, footer
 * - Aucune mention "IA" / "Copilote" / "DJAMA PRO" dans le contenu
 */

/* ─────────────────────────────────────────────────────────
   TYPES PUBLICS
───────────────────────────────────────────────────────── */
export interface GuideItem {
  name?:        string;
  country?:     string;
  type?:        string;
  description?: string;
  tip?:         string;
}

export interface GuideSection {
  type:  "supplier_list" | "steps" | "checklist" | "tips" | "text";
  title: string;
  items: GuideItem[];
}

export interface GuideMessage {
  role:      "user" | "assistant";
  content:   string;
  sections?: GuideSection[];
}

/* ─────────────────────────────────────────────────────────
   GÉNÉRATEUR PRINCIPAL
───────────────────────────────────────────────────────── */
export async function generateGuide(
  messages: GuideMessage[],
  rawTitle  = "Guide Sourcing & Marches",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  /* ── Dimensions ── */
  const W  = 210;
  const H  = 297;
  const ML = 20;          // marge gauche
  const MR = 20;          // marge droite
  const CW = W - ML - MR; // 170 mm de contenu
  const FOOT_Y = H - 18;  // ligne footer

  let y = 0;

  /* ── Palette ── */
  type RGB = [number, number, number];
  const NAVY:  RGB = [15,  23,  42];
  const N800:  RGB = [30,  41,  59];
  const N700:  RGB = [51,  65,  85];
  const BLUE:  RGB = [37,  99, 235];
  const B100:  RGB = [219, 234, 254];
  const S500:  RGB = [100, 116, 139];
  const S300:  RGB = [203, 213, 225];
  const S100:  RGB = [241, 245, 249];
  const AMBER: RGB = [217, 119,   6];
  const A50:   RGB = [255, 251, 235];
  const A200:  RGB = [253, 230, 138];
  const GREEN: RGB = [22,  163,  74];
  const WHITE: RGB = [255, 255, 255];

  /* ── Helpers couleurs ── */
  function sc(c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }
  function sf(c: RGB)  { doc.setFillColor(c[0], c[1], c[2]); }
  function sd(c: RGB)  { doc.setDrawColor(c[0], c[1], c[2]); }

  /* ── Wrap ── */
  function wrap(str: string, maxW: number, fs: number): string[] {
    doc.setFontSize(fs);
    return doc.splitTextToSize(str, maxW) as string[];
  }

  /* ── Titre court (max N chars, coupe sur espace) ── */
  function short(q: string, max = 60): string {
    if (q.length <= max) return q;
    const cut = q.slice(0, max);
    const sp  = cut.lastIndexOf(" ");
    return (sp > 15 ? cut.slice(0, sp) : cut) + "...";
  }

  /* ── Saut de page si nécessaire ── */
  function guard(needed = 20) {
    if (y + needed > FOOT_Y - 6) {
      doc.addPage();
      y = 18;
      runHead();
    }
  }

  /* ── Running header (pages 2+) ── */
  function runHead() {
    sf(S100);
    doc.rect(0, 0, W, 9, "F");
    sd(S300); doc.setLineWidth(0.25);
    doc.line(0, 9, W, 9);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); sc(S500);
    doc.text(short(rawTitle, 72), ML, 6);
    const d = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    doc.text(d, W - MR, 6, { align: "right" });
    y = 19;
  }

  /* ── Footers (toutes pages sauf couverture) ── */
  function applyFooters() {
    const total = doc.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      doc.setPage(p);
      sd(S300); doc.setLineWidth(0.25);
      doc.line(ML, FOOT_Y, W - MR, FOOT_Y);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); sc(S500);
      doc.text("Guide professionnel · Sourcing & Marches", ML, FOOT_Y + 5);
      doc.text(`Page ${p - 1} / ${total - 1}`, W - MR, FOOT_Y + 5, { align: "right" });
    }
  }

  /* ── Heading de section ── */
  function secHead(title: string) {
    guard(16);
    sf(BLUE); doc.rect(ML, y, 3, 9, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); sc(NAVY);
    doc.text(title, ML + 7, y + 6.4);
    y += 13;
  }

  /* ── Heading de chapitre ── */
  function chapHead(question: string, n: number) {
    // On anticipe : si peu d'espace, saut de page avant le séparateur
    const pageBefore = doc.getNumberOfPages();
    guard(36);
    const pageAfter = doc.getNumberOfPages();

    if (n > 1 && pageBefore === pageAfter) {
      // Séparateur entre chapitres uniquement si on n'a pas changé de page
      sd(B100); doc.setLineWidth(0.5);
      doc.line(ML, y, W - MR, y);
      y += 10;
    }

    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); sc(BLUE);
    doc.text(`CHAPITRE ${n}`, ML, y);
    y += 6;

    const lines = wrap(question, CW, 15);
    doc.setFontSize(15); doc.setFont("helvetica", "bold"); sc(NAVY);
    doc.text(lines.slice(0, 3), ML, y);
    y += Math.min(lines.length, 3) * 7.5 + 3;

    sd(B100); doc.setLineWidth(0.6);
    doc.line(ML, y, ML + 40, y);
    y += 9;
  }

  /* ════════════════════════════════════════════
     COUVERTURE
  ════════════════════════════════════════════ */

  // Barre navy top
  sf(NAVY); doc.rect(0, 0, W, 4, "F");
  sf(BLUE);  doc.rect(0, 4, W, 2, "F");

  y = 28;

  // Label catégorie
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); sc(BLUE);
  doc.text("GUIDE PROFESSIONNEL", ML, y);
  y += 9;

  // Titre principal
  const titleLines = wrap(short(rawTitle, 120), CW, 23);
  doc.setFontSize(23); doc.setFont("helvetica", "bold"); sc(NAVY);
  doc.text(titleLines.slice(0, 3), ML, y);
  y += Math.min(titleLines.length, 3) * 11 + 5;

  // Sous-titre = premier texte IA
  const firstIA   = messages.find(m => m.role === "assistant");
  const subText   = firstIA?.content?.trim()
    ? short(firstIA.content.trim(), 130)
    : "Methode de recherche, verification et selection de fournisseurs.";
  const subLines  = wrap(subText, CW, 11);
  doc.setFontSize(11); doc.setFont("helvetica", "normal"); sc(S500);
  doc.text(subLines.slice(0, 3), ML, y);
  y += Math.min(subLines.length, 3) * 6 + 12;

  // Filet décoratif bicolore
  sf(BLUE);  doc.rect(ML,      y, 28,        1.2, "F");
  sf(B100);  doc.rect(ML + 30, y, CW - 30,   1.2, "F");
  y += 9;

  // Date
  const coverDate = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(S500);
  doc.text(`Document du ${coverDate}`, ML, y);
  y += 22;

  // ── Sommaire ──
  const userQs = messages.filter(m => m.role === "user").slice(0, 8);
  if (userQs.length > 0) {
    const rowH  = 10;
    const tocH  = 11 + userQs.length * rowH + 6;

    sf(S100); sd(S300); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, tocH, 3, 3, "FD");

    // En-tête sommaire (bandeau navy)
    sf(N800);
    doc.roundedRect(ML, y, CW, 9, 3, 3, "F");
    doc.rect(ML, y + 5, CW, 4, "F");           // coins bas carrés
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); sc(WHITE);
    doc.text("SOMMAIRE", ML + 7, y + 6.3);
    y += 12;

    userQs.forEach((q, i) => {
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(N700);
      doc.text(`${i + 1}.`, ML + 7, y);
      doc.text(short(q.content, 88), ML + 14, y);
      y += rowH;
    });
    y += 5;
  }

  // Barre navy bottom couverture
  sf(NAVY); doc.rect(0, H - 13, W, 13, "F");
  sf(BLUE);  doc.rect(0, H - 13, W, 2,  "F");
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 140, 165);
  doc.text("Guide professionnel · Sourcing & Marches", ML, H - 5);
  doc.text(String(new Date().getFullYear()), W - MR, H - 5, { align: "right" });

  /* ════════════════════════════════════════════
     PAGES DE CONTENU
  ════════════════════════════════════════════ */
  doc.addPage();
  runHead();

  let chapNum = 0;

  for (const msg of messages) {

    /* ── Question → titre de chapitre ── */
    if (msg.role === "user") {
      chapNum++;
      chapHead(msg.content, chapNum);
    }

    /* ── Réponse → contenu structuré ── */
    if (msg.role === "assistant") {

      // Intro (max 4 lignes)
      if (msg.content?.trim()) {
        const lines = wrap(msg.content.trim(), CW, 10.5);
        const show  = lines.slice(0, 4);
        guard(show.length * 5.5 + 6);
        doc.setFontSize(10.5); doc.setFont("helvetica", "normal"); sc(N700);
        doc.text(show, ML, y);
        y += show.length * 5.5 + 10;
      }

      // Sections
      for (const section of (msg.sections ?? [])) {
        secHead(section.title);

        for (let idx = 0; idx < section.items.length; idx++) {
          const item = section.items[idx];

          /* ─── supplier_list ─── */
          if (section.type === "supplier_list") {
            const desc  = item.description ? wrap(item.description, CW - 16, 9)   : [];
            const tip   = item.tip         ? wrap("Conseil : " + item.tip, CW - 20, 8.5) : [];
            const metaH = (item.country || item.type) ? 5 : 0;
            const boxH  = 8 + metaH
                        + (desc.length ? desc.length * 4.5 + 3 : 0)
                        + (tip.length  ? tip.length  * 4.5 + 8 : 0)
                        + 4;
            guard(boxH + 5);

            // Carte
            sf(WHITE); sd(S300); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, CW, boxH, 2.5, 2.5, "FD");

            // Barre gauche bleue
            sf(BLUE);
            doc.rect(ML, y, 3.5, boxH, "F");
            doc.roundedRect(ML, y, 3.5, Math.min(boxH, 5), 1.5, 1.5, "F");

            let iy = y + 6;

            // Nom
            doc.setFontSize(10.5); doc.setFont("helvetica", "bold"); sc(NAVY);
            doc.text(item.name ?? "", ML + 8, iy);

            // Pays / type
            if (item.country || item.type) {
              iy += 5;
              doc.setFontSize(8); doc.setFont("helvetica", "normal"); sc(S500);
              doc.text([item.country, item.type].filter(Boolean).join("  ·  "), ML + 8, iy);
            }

            // Description
            if (desc.length) {
              iy += 5;
              doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(N700);
              doc.text(desc, ML + 8, iy);
              iy += desc.length * 4.5;
            }

            // Tip
            if (tip.length) {
              iy += 5;
              sf(A50); sd(A200); doc.setLineWidth(0.25);
              doc.roundedRect(ML + 5, iy - 2, CW - 10, tip.length * 4.5 + 7, 1.5, 1.5, "FD");
              doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); sc(AMBER);
              doc.text(tip, ML + 9, iy + 3.5);
            }

            y += boxH + 4;

          /* ─── steps ─── */
          } else if (section.type === "steps") {
            const name  = (item.name ?? "").replace(/^\d+\.\s*/, "");
            const nL    = wrap(name, CW - 18, 10.5);
            const dL    = item.description ? wrap(item.description, CW - 18, 9) : [];
            const rowH  = Math.max(13, nL.length * 5.5 + (dL.length ? dL.length * 4.5 + 3 : 0) + 4);
            guard(rowH + 5);

            // Cercle numéroté
            sf(BLUE);
            doc.circle(ML + 5.5, y + 5.5, 4.5, "F");
            doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); sc(WHITE);
            doc.text(String(idx + 1), ML + 5.5, y + 7, { align: "center" });

            // Connecteur vertical (sauf dernier)
            if (idx < section.items.length - 1) {
              sd(B100); doc.setLineWidth(0.8);
              doc.line(ML + 5.5, y + 10.5, ML + 5.5, y + rowH + 3);
            }

            // Texte
            let sy = y + 5;
            doc.setFontSize(10.5); doc.setFont("helvetica", "bold"); sc(NAVY);
            doc.text(nL, ML + 14, sy);
            sy += nL.length * 5.5;

            if (dL.length) {
              doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(N700);
              doc.text(dL, ML + 14, sy + 2);
            }
            y += rowH + 4;

          /* ─── checklist ─── */
          } else if (section.type === "checklist") {
            const lines = wrap(item.name ?? "", CW - 14, 9.5);
            const rH    = lines.length * 5.2 + 4;
            guard(rH + 3);

            // Case à cocher
            sd(BLUE); doc.setLineWidth(0.45);
            doc.roundedRect(ML + 1, y + 0.8, 5, 5, 1, 1, "D");

            // Coche verte
            sd(GREEN); doc.setLineWidth(0.75);
            doc.line(ML + 2.1, y + 3.4, ML + 3.3, y + 4.9);
            doc.line(ML + 3.3, y + 4.9, ML + 5.6, y + 2.2);

            doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); sc(N700);
            doc.text(lines, ML + 11, y + 4.8);
            y += rH;

            if (item.description) {
              const dL = wrap(item.description, CW - 14, 8.5);
              guard(dL.length * 4.5 + 2);
              doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); sc(S500);
              doc.text(dL, ML + 11, y);
              y += dL.length * 4.5 + 2;
            }

          /* ─── tips ─── */
          } else if (section.type === "tips") {
            const nL    = wrap(item.name ?? "", CW - 14, 9.5);
            const dL    = item.description ? wrap(item.description, CW - 14, 9) : [];
            const boxH  = 6 + nL.length * 5.5 + (dL.length ? dL.length * 4.5 + 3 : 0) + 5;
            guard(boxH + 5);

            sf(A50); sd(A200); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, CW, boxH, 2.5, 2.5, "FD");

            // Barre gauche ambrée
            sf(AMBER);
            doc.rect(ML, y, 3.5, boxH, "F");
            doc.roundedRect(ML, y, 3.5, Math.min(boxH, 5), 1.5, 1.5, "F");

            let ty = y + 6;
            doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); sc(AMBER);
            doc.text(nL, ML + 8, ty);
            ty += nL.length * 5.5 + 2;

            if (dL.length) {
              doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(N700);
              doc.text(dL, ML + 8, ty);
            }
            y += boxH + 4;

          /* ─── text ─── */
          } else {
            const content = [item.name ?? "", item.description ?? ""].filter(Boolean).join(" — ");
            const lines   = wrap(content, CW, 10);
            guard(lines.length * 5.5 + 4);
            doc.setFontSize(10); doc.setFont("helvetica", "normal"); sc(N700);
            doc.text(lines, ML, y);
            y += lines.length * 5.5 + 4;
          }
        } // items

        y += 7; // espacement inter-section
      } // sections

      y += 6;
    }
  } // messages

  applyFooters();

  const fname = `guide-sourcing-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
