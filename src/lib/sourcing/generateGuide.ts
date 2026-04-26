/**
 * generateGuide — Génère un PDF guide professionnel depuis une conversation Sourcing IA.
 *
 * Design : fond blanc, header bleu, typographie propre, sections colorées.
 * Côté client uniquement (jsPDF chargé dynamiquement).
 */

/* ─────────────────────────────────────────────────────────
   TYPES
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
   HELPERS COULEURS
───────────────────────────────────────────────────────── */
type RGB = [number, number, number];
const C_BLUE_700:  RGB = [29, 78, 216];
const C_BLUE_600:  RGB = [37, 99, 235];
const C_BLUE_100:  RGB = [219, 234, 254];
const C_BLUE_50:   RGB = [239, 246, 255];
const C_BLUE_200:  RGB = [191, 219, 254];
const C_AMBER_600: RGB = [217, 119, 6];
const C_AMBER_50:  RGB = [255, 251, 235];
const C_AMBER_200: RGB = [253, 230, 138];
const C_SLATE_950: RGB = [2, 6, 23];
const C_SLATE_700: RGB = [51, 65, 85];
const C_SLATE_500: RGB = [100, 116, 139];
const C_SLATE_200: RGB = [226, 232, 240];
const C_SLATE_50:  RGB = [248, 250, 252];
const C_WHITE:     RGB = [255, 255, 255];
const C_GREEN_600: RGB = [22, 163, 74];

/* ─────────────────────────────────────────────────────────
   GÉNÉRATEUR PRINCIPAL
───────────────────────────────────────────────────────── */
export async function generateGuide(
  messages: GuideMessage[],
  title     = "Guide Sourcing & Marchés",
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W  = 210;
  const H  = 297;
  const ML = 18;
  const MR = 18;
  const MB = 18;
  const CW = W - ML - MR;   // 174 mm

  let y    = 0;
  let page = 1;

  /* ── Helpers ── */
  function set(color: RGB) { doc.setTextColor(color[0], color[1], color[2]); }
  function fill(color: RGB) { doc.setFillColor(color[0], color[1], color[2]); }
  function draw(color: RGB) { doc.setDrawColor(color[0], color[1], color[2]); }

  function text(str: string, x: number, cy: number, opts?: Parameters<typeof doc.text>[3]) {
    doc.text(str, x, cy, opts);
  }

  function wrapText(str: string, maxW: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(str, maxW) as string[];
  }

  function checkPage(needed = 20) {
    if (y + needed > H - MB - 16) {
      doc.addPage();
      page++;
      y = 22;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    fill(C_BLUE_700);
    doc.rect(0, 0, W, 7, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    set(C_WHITE);
    text("DJAMA PRO — SOURCING IA & MARCHES", ML, 4.8);
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    text(dateStr, W - MR, 4.8, { align: "right" });
  }

  function pageFooter() {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      draw(C_SLATE_200);
      doc.setLineWidth(0.3);
      doc.line(ML, H - MB, W - MR, H - MB);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      set(C_SLATE_500);
      text("DJAMA Pro · Sourcing IA & Marches", ML, H - MB + 4.5);
      text(`Page ${p} / ${total}`, W - MR, H - MB + 4.5, { align: "right" });
    }
  }

  /* ─────────────────────────────────────────────────────────
     PAGE DE COUVERTURE
  ───────────────────────────────────────────────────────── */
  /* Header dégradé simulé */
  fill(C_BLUE_600);
  doc.rect(0, 0, W, 52, "F");
  fill(C_BLUE_700);
  doc.rect(0, 42, W, 10, "F");

  /* Logo / App name */
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  set(C_BLUE_100);
  text("DJAMA PRO", W - MR, 10, { align: "right" });

  /* Étiquette */
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  set(C_BLUE_200);
  text("SOURCING IA & MARCHES", ML, 22);

  /* Titre principal */
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  set(C_WHITE);
  const titleLines = wrapText(title, CW, 20);
  doc.text(titleLines, ML, 35);

  /* Date cover */
  const coverDate = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  set(C_BLUE_200);
  text(`Genere le ${coverDate}`, ML, 48.5);

  y = 68;

  /* Encadré intro */
  fill(C_BLUE_50);
  draw(C_BLUE_200);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  set(C_BLUE_700);
  text("Ce guide a ete genere par le Copilote Sourcing IA de DJAMA Pro.", ML + 5, y + 8);
  doc.setFont("helvetica", "normal");
  const aiCount = messages.filter(m => m.role === "assistant").length;
  text(`Il contient ${aiCount} analyse${aiCount > 1 ? "s" : ""} basee${aiCount > 1 ? "s" : ""} sur vos questions.`, ML + 5, y + 14.5);

  y += 30;

  /* Sommaire rapide */
  const userQuestions = messages.filter(m => m.role === "user").map(m => m.content);
  if (userQuestions.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    set(C_SLATE_950);
    text("Sujets traites dans ce guide", ML, y);
    y += 8;

    userQuestions.forEach((q, i) => {
      checkPage(10);
      fill(C_SLATE_50);
      draw(C_SLATE_200);
      doc.rect(ML, y, CW, 7.5, "FD");

      /* Numero */
      fill(C_BLUE_600);
      doc.circle(ML + 4.5, y + 3.75, 2.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      set(C_WHITE);
      text(String(i + 1), ML + 4.5, y + 4.8, { align: "center" });

      /* Question tronquée */
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      set(C_SLATE_700);
      const qShort = q.length > 90 ? q.slice(0, 87) + "..." : q;
      text(qShort, ML + 11, y + 4.8);
      y += 9;
    });
  }

  /* ─────────────────────────────────────────────────────────
     CONTENU — QUESTIONS / RÉPONSES
  ───────────────────────────────────────────────────────── */
  let qIndex = 0;

  messages.forEach((msg, msgIdx) => {

    /* ── QUESTION utilisateur ── */
    if (msg.role === "user") {
      qIndex++;
      checkPage(28);

      /* Séparateur entre Q/R */
      if (msgIdx > 0) {
        draw(C_SLATE_200);
        doc.setLineWidth(0.3);
        doc.line(ML, y, W - MR, y);
        y += 8;
      }

      /* Bandeau question */
      fill(C_BLUE_600);
      draw(C_BLUE_600);
      doc.roundedRect(ML, y, CW, 9, 2, 2, "F");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      set(C_WHITE);
      text(`QUESTION ${qIndex}`, ML + 3, y + 5.8);

      y += 11;

      /* Texte question */
      const qLines = wrapText(msg.content, CW, 10.5);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      set(C_SLATE_950);
      doc.text(qLines, ML, y);
      y += qLines.length * 5.5 + 7;
    }

    /* ── RÉPONSE IA ── */
    if (msg.role === "assistant") {

      /* Texte d'introduction */
      if (msg.content?.trim()) {
        checkPage(15);
        const introLines = wrapText(msg.content, CW, 10);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        set(C_SLATE_700);
        doc.text(introLines, ML, y);
        y += introLines.length * 5 + 7;
      }

      /* Sections structurées */
      (msg.sections ?? []).forEach(section => {
        checkPage(20);

        /* Titre de section */
        fill(C_SLATE_50);
        draw(C_SLATE_200);
        doc.setLineWidth(0.3);
        doc.rect(ML, y, CW, 8.5, "FD");

        fill(C_BLUE_600);
        doc.rect(ML, y, 3, 8.5, "F");

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        set(C_SLATE_950);
        text(section.title, ML + 6, y + 5.8);
        y += 11;

        /* Items selon le type */
        section.items.forEach((item, itemIdx) => {

          /* ── supplier_list ── */
          if (section.type === "supplier_list") {
            const descLines = item.description ? wrapText(item.description, CW - 10, 9) : [];
            const tipLines  = item.tip          ? wrapText("Conseil : " + item.tip, CW - 10, 8.5) : [];
            const boxH = 9 + (descLines.length > 0 ? descLines.length * 4.5 + 3 : 0) + (tipLines.length > 0 ? tipLines.length * 4.3 + 4 : 0);
            checkPage(boxH + 6);

            fill(C_WHITE);
            draw(C_SLATE_200);
            doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, CW, boxH, 2, 2, "FD");

            /* Nom */
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            set(C_SLATE_950);
            text(item.name ?? "", ML + 4, y + 6);

            /* Pays + Type */
            if (item.country || item.type) {
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");
              set(C_SLATE_500);
              text(`${item.country ?? ""}${item.country && item.type ? " — " : ""}${item.type ?? ""}`, ML + 4, y + 11);
              let subY = y + 15;
              if (descLines.length) {
                doc.setFontSize(9);
                set(C_SLATE_700);
                doc.setFont("helvetica", "normal");
                doc.text(descLines, ML + 4, subY);
                subY += descLines.length * 4.5 + 2;
              }
              if (tipLines.length) {
                fill(C_AMBER_50);
                draw(C_AMBER_200);
                doc.roundedRect(ML + 2, subY - 1, CW - 4, tipLines.length * 4.3 + 4, 1.5, 1.5, "FD");
                doc.setFontSize(8.5);
                doc.setFont("helvetica", "bold");
                set(C_AMBER_600);
                doc.text(tipLines, ML + 5, subY + 3);
              }
            } else {
              let subY = y + 9;
              if (descLines.length) {
                doc.setFontSize(9);
                set(C_SLATE_700);
                doc.setFont("helvetica", "normal");
                doc.text(descLines, ML + 4, subY);
                subY += descLines.length * 4.5 + 2;
              }
              if (tipLines.length) {
                fill(C_AMBER_50);
                draw(C_AMBER_200);
                doc.roundedRect(ML + 2, subY - 1, CW - 4, tipLines.length * 4.3 + 4, 1.5, 1.5, "FD");
                doc.setFontSize(8.5);
                doc.setFont("helvetica", "bold");
                set(C_AMBER_600);
                doc.text(tipLines, ML + 5, subY + 3);
              }
            }
            y += boxH + 4;

          /* ── steps ── */
          } else if (section.type === "steps") {
            const stepName  = (item.name ?? "").replace(/^\d+\.\s*/, "");
            const descLines = item.description ? wrapText(item.description, CW - 16, 9) : [];
            const rowH = 9 + (descLines.length > 0 ? descLines.length * 4.5 + 2 : 0);
            checkPage(rowH + 4);

            /* Cercle numéro */
            fill(C_BLUE_600);
            doc.circle(ML + 5, y + 5, 4, "F");
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            set(C_WHITE);
            text(String(itemIdx + 1), ML + 5, y + 6.5, { align: "center" });

            /* Titre de l'étape */
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            set(C_SLATE_950);
            text(stepName, ML + 13, y + 5.5);

            if (descLines.length) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              set(C_SLATE_700);
              doc.text(descLines, ML + 13, y + 11);
            }
            y += rowH + 3;

          /* ── checklist ── */
          } else if (section.type === "checklist") {
            const itemLines = wrapText(item.name ?? "", CW - 12, 9.5);
            checkPage(itemLines.length * 4.8 + 5);

            draw(C_BLUE_200);
            doc.setLineWidth(0.4);
            doc.roundedRect(ML + 1, y + 0.5, 5, 5, 1, 1, "D");

            /* Check mark visuel */
            doc.setLineWidth(0.7);
            set(C_GREEN_600);
            doc.line(ML + 2.2, y + 3.2, ML + 3.3, y + 4.5);
            doc.line(ML + 3.3, y + 4.5, ML + 5.3, y + 2);

            doc.setFontSize(9.5);
            doc.setFont("helvetica", "normal");
            set(C_SLATE_700);
            doc.text(itemLines, ML + 11, y + 4.5);
            y += itemLines.length * 4.8 + 3.5;

          /* ── tips ── */
          } else if (section.type === "tips") {
            const descLines = item.description ? wrapText(item.description, CW - 10, 9) : [];
            const boxH = 11 + (descLines.length > 0 ? descLines.length * 4.5 + 2 : 0);
            checkPage(boxH + 5);

            fill(C_AMBER_50);
            draw(C_AMBER_200);
            doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, CW, boxH, 2, 2, "FD");

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            set(C_AMBER_600);
            text(item.name ?? "", ML + 5, y + 7);

            if (descLines.length) {
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              set(C_SLATE_700);
              doc.text(descLines, ML + 5, y + 12.5);
            }
            y += boxH + 4;

          /* ── text ── */
          } else {
            const tLines = wrapText((item.name ?? "") + (item.description ? " " + item.description : ""), CW, 10);
            checkPage(tLines.length * 5 + 4);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            set(C_SLATE_700);
            doc.text(tLines, ML, y);
            y += tLines.length * 5 + 4;
          }
        }); // end items

        y += 6; // espace inter-section
      }); // end sections
    }
  }); // end messages

  /* ── Footers toutes pages ── */
  pageFooter();

  /* ── Téléchargement ── */
  const fname = `guide-sourcing-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
