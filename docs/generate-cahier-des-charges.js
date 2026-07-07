const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents, ImageRun,
} = require("docx");
const fs = require("fs");

// ── Couleurs ──────────────────────────────────────────────────────────
const GOLD   = "C9A55A";
const DARK   = "1A0C35";
const GRAY   = "F5F5F5";
const LGRAY  = "E8E8E8";
const WHITE  = "FFFFFF";
const TEXT   = "1A1A1A";
const MUTED  = "6B7280";
const ACCENT = "7C3AED";
const GREEN  = "059669";
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDER_DEF = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const BORDERS = { top: BORDER_DEF, bottom: BORDER_DEF, left: BORDER_DEF, right: BORDER_DEF };

// ── Helpers texte ─────────────────────────────────────────────────────
const space = (before = 0, after = 0) => ({ spacing: { before, after } });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Arial" })],
    ...space(320, 160),
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: "Arial" })],
    ...space(240, 120),
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, color: GOLD, font: "Arial" })],
    ...space(200, 80),
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: TEXT, font: "Arial", ...opts })],
    ...space(40, 40),
  });
}

function bodyBold(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + " ", bold: true, size: 20, color: DARK, font: "Arial" }),
      new TextRun({ text: value, size: 20, color: TEXT, font: "Arial" }),
    ],
    ...space(40, 40),
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 20, color: TEXT, font: "Arial" })],
    ...space(30, 30),
  });
}

function gap(sz = 120) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 0, after: sz } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function sectionLabel(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 18, color: WHITE, font: "Arial" })],
    shading: { fill: DARK, type: ShadingType.CLEAR },
    ...space(200, 80),
    indent: { left: 120, right: 120 },
  });
}

// ── Screenshot ────────────────────────────────────────────────────────
const SCREENS_DIR = "C:/Users/nofam/djama-premium/docs/screenshots";

function screenshot(name, widthPx = 540, heightPx = 340) {
  const filePath = `${SCREENS_DIR}/${name}.png`;
  if (!fs.existsSync(filePath)) return gap(80);
  const data = fs.readFileSync(filePath);
  return new Paragraph({
    children: [new ImageRun({
      type: "jpeg",
      data,
      transformation: { width: widthPx, height: heightPx },
      altText: { title: name, description: `Capture d'écran module ${name}`, name },
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
  });
}

// ── Schéma de flux horizontal ─────────────────────────────────────────
function flowSchema(steps) {
  // steps = [{label, icon}]
  const n = steps.length;
  const stepW = Math.floor(8400 / (n * 2 - 1));
  const arrowW = stepW;
  const cols = [];
  const widths = [];

  for (let i = 0; i < n; i++) {
    cols.push(steps[i]);
    widths.push(stepW);
    if (i < n - 1) {
      cols.push(null); // arrow
      widths.push(arrowW);
    }
  }

  const totalW = widths.reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({
      children: cols.map((col, idx) => {
        if (!col) {
          return new TableCell({
            width: { size: widths[idx], type: WidthType.DXA },
            borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: "→", bold: true, size: 24, color: GOLD, font: "Arial" })],
              alignment: AlignmentType.CENTER,
            })],
          });
        }
        return new TableCell({
          width: { size: widths[idx], type: WidthType.DXA },
          shading: { fill: DARK, type: ShadingType.CLEAR },
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [new TextRun({ text: col.icon || "", size: 20, font: "Arial" })],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [new TextRun({ text: col.label, bold: true, size: 17, color: GOLD, font: "Arial" })],
              alignment: AlignmentType.CENTER,
            }),
          ],
        });
      }),
    })],
  });
}

// ── Carte de fonctionnalités ──────────────────────────────────────────
function moduleCard(title, subtitle, bullets) {
  const rows = [];

  rows.push(new TableRow({
    children: [new TableCell({
      columnSpan: 2,
      shading: { fill: DARK, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 22, color: GOLD, font: "Arial" })],
        }),
        new Paragraph({
          children: [new TextRun({ text: subtitle, size: 18, color: "AAAAAA", font: "Arial" })],
        }),
      ],
    })],
  }));

  for (let i = 0; i < bullets.length; i += 2) {
    const left = bullets[i] || "";
    const right = bullets[i + 1] || "";
    rows.push(new TableRow({
      children: [
        new TableCell({
          width: { size: 4200, type: WidthType.DXA },
          shading: { fill: i % 4 === 0 ? GRAY : WHITE, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 180, right: 100 },
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          children: [new Paragraph({
            children: [
              new TextRun({ text: "• ", bold: true, size: 20, color: GOLD, font: "Arial" }),
              new TextRun({ text: left, size: 20, color: TEXT, font: "Arial" }),
            ],
          })],
        }),
        new TableCell({
          width: { size: 4200, type: WidthType.DXA },
          shading: { fill: i % 4 === 0 ? GRAY : WHITE, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 100, right: 180 },
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          children: [new Paragraph({
            children: right ? [
              new TextRun({ text: "• ", bold: true, size: 20, color: GOLD, font: "Arial" }),
              new TextRun({ text: right, size: 20, color: TEXT, font: "Arial" }),
            ] : [new TextRun("")],
          })],
        }),
      ],
    }));
  }

  return new Table({
    width: { size: 8400, type: WidthType.DXA },
    columnWidths: [4200, 4200],
    rows,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

function compTable(rows) {
  return new Table({
    width: { size: 8400, type: WidthType.DXA },
    columnWidths: [3600, 3200, 1600],
    rows: rows.map((row, i) => new TableRow({
      children: row.map((cell, j) => new TableCell({
        width: { size: [3600, 3200, 1600][j], type: WidthType.DXA },
        shading: {
          fill: i === 0 ? DARK : (i === rows.length - 1 ? "FFF8ED" : (i % 2 === 0 ? GRAY : WHITE)),
          type: ShadingType.CLEAR,
        },
        borders: BORDERS,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({
            text: cell,
            size: i === 0 ? 18 : 20,
            bold: i === 0 || i === rows.length - 1,
            color: i === 0 ? WHITE : (i === rows.length - 1 ? "B8860B" : TEXT),
            font: "Arial",
          })],
          alignment: j === 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
        })],
      })),
    })),
  });
}

function techTable(rows, widths) {
  const numCols = rows[0] ? rows[0].length : 2;
  const colWidths = widths || (numCols === 3 ? [3200, 2600, 2600] : [3600, 4800]);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((row, i) => new TableRow({
      children: row.map((cell, j) => new TableCell({
        width: { size: colWidths[j], type: WidthType.DXA },
        shading: {
          fill: i === 0 ? DARK : (i % 2 === 0 ? GRAY : WHITE),
          type: ShadingType.CLEAR,
        },
        borders: BORDERS,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({
            text: cell,
            size: i === 0 ? 18 : 20,
            bold: i === 0 || j === 0,
            color: i === 0 ? WHITE : (j === 0 ? DARK : TEXT),
            font: "Arial",
          })],
        })],
      })),
    })),
  });
}

// ── Document ──────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20, color: TEXT } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: GOLD },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },

  sections: [
    // ── PAGE DE COUVERTURE ────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [11906],
          rows: [new TableRow({
            height: { value: 500, rule: "exact" },
            children: [new TableCell({
              shading: { fill: GOLD, type: ShadingType.CLEAR },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              margins: { top: 120, bottom: 120, left: 720, right: 720 },
              children: [new Paragraph({
                children: [new TextRun({ text: "DJAMA", bold: true, size: 28, color: WHITE, font: "Arial" })],
                alignment: AlignmentType.RIGHT,
              })],
            })],
          })],
        }),

        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [11906],
          rows: [new TableRow({
            height: { value: 5000, rule: "exact" },
            children: [new TableCell({
              shading: { fill: DARK, type: ShadingType.CLEAR },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              margins: { top: 800, bottom: 400, left: 1080, right: 1080 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "CAHIER DES CHARGES", size: 52, bold: true, color: GOLD, font: "Arial" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 120 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "TECHNIQUE & FONCTIONNEL", size: 44, bold: true, color: WHITE, font: "Arial" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 400 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "————————————————————", size: 20, color: GOLD, font: "Arial" })],
                  spacing: { before: 0, after: 400 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "DJAMA Espace Client PRO", size: 36, bold: true, color: WHITE, font: "Arial" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 160 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Logiciel de Gestion Tout-en-Un pour Entrepreneurs", size: 24, color: "CCCCCC", font: "Arial" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 600 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Version 1.0  ", size: 18, color: "888888", font: "Arial" }),
                    new TextRun({ text: "  |  ", size: 18, color: "555555", font: "Arial" }),
                    new TextRun({ text: "  Juillet 2026  ", size: 18, color: "888888", font: "Arial" }),
                    new TextRun({ text: "  |  ", size: 18, color: "555555", font: "Arial" }),
                    new TextRun({ text: "  djama.space", size: 18, color: GOLD, font: "Arial" }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
            })],
          })],
        }),

        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [5953, 5953],
          rows: [new TableRow({
            height: { value: 2000, rule: "exact" },
            children: [
              new TableCell({
                shading: { fill: GRAY, type: ShadingType.CLEAR },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                margins: { top: 400, bottom: 400, left: 1080, right: 400 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Prix", size: 18, color: MUTED, font: "Arial" })],
                    spacing: { before: 0, after: 60 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "11,90 €/mois", size: 32, bold: true, color: DARK, font: "Arial" })],
                    spacing: { before: 0, after: 60 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "sans engagement • résiliable à tout moment", size: 16, color: MUTED, font: "Arial" })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: GRAY, type: ShadingType.CLEAR },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: { style: BorderStyle.SINGLE, size: 4, color: GOLD }, right: NO_BORDER },
                margins: { top: 400, bottom: 400, left: 600, right: 1080 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "21 outils professionnels intégrés", size: 20, bold: true, color: DARK, font: "Arial" })],
                    spacing: { before: 0, after: 80 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "Factures • CRM • Trésorerie • Contrats • Stocks", size: 16, color: MUTED, font: "Arial" })],
                    spacing: { before: 0, after: 40 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "Planning • Assistant IA • Équipe • et plus", size: 16, color: MUTED, font: "Arial" })],
                  }),
                ],
              }),
            ],
          })],
        }),

        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [11906],
          rows: [new TableRow({
            height: { value: 400, rule: "exact" },
            children: [new TableCell({
              shading: { fill: GOLD, type: ShadingType.CLEAR },
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              margins: { top: 100, bottom: 100, left: 1080, right: 1080 },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                children: [new TextRun({ text: "Confidentiel — Diffusion restreinte", size: 16, color: DARK, font: "Arial" })],
                alignment: AlignmentType.CENTER,
              })],
            })],
          })],
        }),
      ],
    },

    // ── SOMMAIRE + CONTENU ────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, right: 1080, bottom: 1200, left: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: 9746, type: WidthType.DXA },
              columnWidths: [5000, 4746],
              rows: [new TableRow({
                children: [
                  new TableCell({
                    borders: { top: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD }, left: NO_BORDER, right: NO_BORDER },
                    margins: { bottom: 80 },
                    children: [new Paragraph({
                      children: [new TextRun({ text: "DJAMA", bold: true, size: 20, color: DARK, font: "Arial" })],
                    })],
                  }),
                  new TableCell({
                    borders: { top: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD }, left: NO_BORDER, right: NO_BORDER },
                    margins: { bottom: 80 },
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Cahier des Charges — Espace Client PRO", size: 16, color: MUTED, font: "Arial" })],
                      alignment: AlignmentType.RIGHT,
                    })],
                  }),
                ],
              })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "djama.space  —  Version 1.0  —  Juillet 2026  —  Page ", size: 16, color: MUTED, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GOLD, font: "Arial", bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: LGRAY } },
            spacing: { before: 80 },
          })],
        }),
      },
      children: [
        // TABLE DES MATIÈRES
        new Paragraph({
          children: [new TextRun({ text: "TABLE DES MATIÈRES", bold: true, size: 28, color: DARK, font: "Arial" })],
          spacing: { before: 0, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } },
        }),
        gap(80),
        new TableOfContents("", { hyperlink: true, headingStyleRange: "1-2" }),
        pageBreak(),

        // ── 1. PRÉSENTATION ──────────────────────────────────────────
        h1("1. PRÉSENTATION DU PRODUIT"),
        gap(80),

        h2("1.1 Identité du produit"),
        bodyBold("Nom du produit :", "DJAMA Espace Client PRO"),
        bodyBold("Type :", "Logiciel SaaS (Software as a Service) — Application web"),
        bodyBold("Éditeur :", "DJAMA"),
        bodyBold("URL :", "https://djama.space/client"),
        bodyBold("Prix mensuel :", "11,90 € / mois (sans engagement)"),
        bodyBold("Prix annuel :", "9,90 € / mois — soit 118,80 €/an (économie de 24 €)"),
        bodyBold("Public cible :", "Auto-entrepreneurs, freelances, TPE, artisans, créatifs, consultants"),
        gap(),

        h2("1.2 Proposition de valeur"),
        body("DJAMA est une suite complète de gestion d'entreprise réunissant 21 outils professionnels dans un seul espace. Pour 11,90 €/mois, l'utilisateur accède à des fonctionnalités qui coûteraient en moyenne 188 € à 220 €/mois si achetées séparément (Quickbooks, Asana, HubSpot, Pennylane, DocuSign, Sage...)."),
        body("Le logiciel s'adresse à tout professionnel souhaitant gérer son activité depuis un unique tableau de bord, sans jongler entre 8 à 10 abonnements différents."),
        gap(),

        h2("1.3 Accès et compatibilité"),
        bullet("Accessible via navigateur web (Chrome, Firefox, Safari, Edge)"),
        bullet("Responsive mobile — tablette et smartphone"),
        bullet("Aucune installation requise"),
        bullet("Données synchronisées en temps réel entre tous les appareils"),
        bullet("Disponible 24h/24 — 7j/7 — 365 jours/an"),
        gap(160),

        // ── 2. ARCHITECTURE TECHNIQUE ─────────────────────────────────
        h1("2. ARCHITECTURE TECHNIQUE"),
        gap(80),

        h2("2.1 Stack technologique"),
        techTable([
          ["Composant", "Technologie"],
          ["Framework Frontend", "Next.js 14 (App Router)"],
          ["Langage", "TypeScript"],
          ["Style & Design", "Tailwind CSS v4"],
          ["Animations", "Framer Motion"],
          ["Base de données", "Supabase (PostgreSQL hébergé EU)"],
          ["Authentification", "Supabase Auth (email + Google OAuth)"],
          ["Stockage fichiers", "Supabase Storage"],
          ["Paiement", "Stripe (CB, Apple Pay, Google Pay, SEPA)"],
          ["Emails transactionnels", "Resend"],
          ["Intelligence Artificielle", "Anthropic Claude"],
          ["Hébergement & CDN", "Vercel (réseau mondial)"],
          ["Sécurité données", "Row Level Security (RLS) PostgreSQL"],
        ]),
        gap(),

        h2("2.2 Architecture de sécurité"),
        body("Chaque couche de l'application est sécurisée de manière indépendante :"),
        gap(80),
        flowSchema([
          { label: "Navigateur", icon: "HTTPS/TLS" },
          { label: "Vercel CDN", icon: "WAF/DDoS" },
          { label: "Next.js API", icon: "Auth JWT" },
          { label: "Supabase", icon: "RLS" },
          { label: "PostgreSQL", icon: "Chiffrement" },
        ]),
        gap(80),
        bullet("Chiffrement TLS/HTTPS sur l'intégralité des communications"),
        bullet("Row Level Security (RLS) activé sur 56 tables — chaque utilisateur ne voit que ses propres données"),
        bullet("Authentification JWT avec refresh automatique"),
        bullet("Conformité RGPD complète (droit d'accès, à l'oubli, portabilité)"),
        bullet("Hébergement sur infrastructure européenne (Supabase EU — AWS eu-west)"),
        bullet("Paiements gérés par Stripe — certifié PCI-DSS niveau 1"),
        gap(200),

        // ── 3. MODULES ───────────────────────────────────────────────
        h1("3. MODULES ET FONCTIONNALITÉS"),
        gap(80),

        sectionLabel("ACCES GRATUIT — Sans abonnement"),
        gap(80),

        // MODULE GRATUIT 1 — FACTURES
        h3("MODULE GRATUIT 1 — Factures & Devis"),
        body("Créez des factures et devis professionnels en quelques clics. Le module gère l'ensemble du cycle de vie d'un document commercial, de la création jusqu'à la signature électronique par le client."),
        gap(80),
        screenshot("factures", 540, 340),
        gap(80),
        body("Flux de travail :"),
        flowSchema([
          { label: "Créer", icon: "Nouveau doc" },
          { label: "Personnaliser", icon: "TVA / Logo" },
          { label: "Envoyer", icon: "Lien sécurisé" },
          { label: "Signature", icon: "Électronique" },
          { label: "Archiver", icon: "PDF / CSV" },
        ]),
        gap(80),
        moduleCard("Factures & Devis", "Gratuit • Limité à 5 documents", [
          "Création de factures et devis personnalisés", "Logo, couleurs et branding de l'entreprise",
          "Gestion des articles avec TVA et remises", "Statuts : Brouillon, Envoyé, Payé, En retard",
          "Export PDF haute qualité", "Numérotation automatique",
          "Gestion SIRET, TVA, IBAN de l'émetteur", "Signature électronique via lien sécurisé",
          "Lien de partage public (sans compte client)", "Export CSV des factures",
        ]),
        gap(80),
        body("Idéal pour : freelances, consultants, artisans souhaitant facturer rapidement et professionnellement.", { italics: true }),
        gap(200),

        // MODULE GRATUIT 2 — PLANNING
        h3("MODULE GRATUIT 2 — Planning & Agenda"),
        body("Un calendrier professionnel complet intégré dans votre espace de travail. Gérez événements, tâches et objectifs depuis une interface unifiée avec vues Mois, Semaine et Agenda."),
        gap(80),
        screenshot("planning", 540, 340),
        gap(80),
        body("Types d'événements disponibles :"),
        flowSchema([
          { label: "Evenement", icon: "Reunion" },
          { label: "Tache", icon: "A faire" },
          { label: "Rappel", icon: "Alerte" },
          { label: "Objectif", icon: "Mensuel" },
        ]),
        gap(80),
        moduleCard("Planning & Agenda", "Gratuit • Illimité", [
          "Vues : Mois, Semaine, Agenda", "Types : Événement, Réunion, Tâche, Rappel",
          "Statuts : À faire, En cours, Terminé, En retard", "Priorités : Faible, Normale, Haute, Urgente",
          "Participants et liens de réunion", "Rappels configurables",
          "Couleurs personnalisées par événement", "Objectifs hebdomadaires et mensuels",
        ]),
        gap(80),
        body("Idéal pour : tout professionnel souhaitant organiser son temps et ne rater aucun rendez-vous.", { italics: true }),
        gap(200),

        // MODULE GRATUIT 3 — BLOC-NOTES
        h3("MODULE GRATUIT 3 — Bloc-notes IA"),
        body("Prenez des notes de toutes formes : texte libre, checklists, compte-rendus de réunion, idées ou notes de code. L'intelligence artificielle intégrée vous aide à résumer, corriger, traduire et extraire des tâches depuis vos notes."),
        gap(80),
        screenshot("bloc-notes", 540, 340),
        gap(80),
        body("Capacités de l'IA intégrée :"),
        flowSchema([
          { label: "Saisir", icon: "Voix / Texte" },
          { label: "Organiser", icon: "Dossiers / Tags" },
          { label: "Ameliorer", icon: "IA correcteur" },
          { label: "Exporter", icon: "PDF / Taches" },
        ]),
        gap(80),
        moduleCard("Bloc-notes IA", "Gratuit • Illimité", [
          "Types : Texte, Checklist, Réunion, Idée, Journal, Code", "Enregistrement vocal avec transcription auto",
          "Organisation par dossiers et étiquettes", "Recherche full-text instantanée",
          "IA : Améliorer, Résumer, Extraire tâches, Corriger, Traduire", "Notebook Canvas (notes manuscrites)",
          "Favoris et archivage", "Export PDF",
        ]),
        gap(80),
        body("Idéal pour : tous les professionnels ayant besoin d'un espace de notes intelligent et organisé.", { italics: true }),
        gap(200),

        sectionLabel("ACCES PRO — 11,90 €/mois"),
        gap(80),

        // MODULE PRO 1 — DASHBOARD
        h3("MODULE PRO 1 — Tableau de bord"),
        body("La vue de contrôle de votre activité en temps réel. Le tableau de bord agrège l'ensemble de vos données (finances, tâches, factures, stock) en un écran unique avec analyse IA mensuelle de votre santé business."),
        gap(80),
        screenshot("dashboard", 540, 340),
        gap(80),
        body("Données affichées en temps réel :"),
        flowSchema([
          { label: "CA du mois", icon: "Factures" },
          { label: "Heures", icon: "Chrono" },
          { label: "Depenses", icon: "Frais" },
          { label: "Contacts", icon: "CRM" },
          { label: "Analyse IA", icon: "Score" },
        ]),
        gap(80),
        moduleCard("Tableau de bord", "PRO • Données temps réel", [
          "KPIs : CA, Heures, Dépenses, Contacts actifs", "Graphique de revenus mensuels",
          "Factures en retard avec alertes visuelles", "Rapport mensuel IA (score de santé business)",
          "Objectif mensuel personnalisable (sauvegardé cloud)", "Notifications : tâches en retard, stock épuisé",
          "Recherche globale Ctrl+K (6 sources simultanées)", "Actions rapides depuis le dashboard",
        ]),
        gap(80),
        body("Idéal pour : avoir une vision instantanée de la santé de son activité dès la première connexion de la journée.", { italics: true }),
        gap(200),

        // MODULE PRO 2 — CRM
        pageBreak(),
        h3("MODULE PRO 2 — CRM (Gestion de la relation client)"),
        body("Un CRM complet intégré à votre espace de travail. Suivez vos prospects et clients, gérez votre pipeline commercial et historicisez chaque interaction pour ne jamais perdre le fil d'une relation commerciale."),
        gap(80),
        screenshot("crm", 540, 340),
        gap(80),
        body("Pipeline commercial intégré :"),
        flowSchema([
          { label: "Prospect", icon: "Nouveau" },
          { label: "Qualifie", icon: "Contacte" },
          { label: "Proposition", icon: "Devis" },
          { label: "Gagne", icon: "Client" },
        ]),
        gap(80),
        moduleCard("CRM", "PRO • Pipeline commercial", [
          "Types : Prospect, Client, Partenaire, Fournisseur", "Statuts : Prospect, Actif, Inactif, Perdu",
          "Historique : Notes, Appels, Emails, Réunions", "Pipeline : Nouveau → Qualifié → Gagné/Perdu",
          "Tâches CRM associées aux contacts", "Tickets de support avec satisfaction",
          "Filtres avancés et pagination", "Export CSV des contacts",
        ]),
        gap(80),
        body("Idéal pour : commerciaux, consultants et entrepreneurs qui gèrent un portefeuille client et souhaitent optimiser leur taux de conversion.", { italics: true }),
        gap(200),

        // MODULE PRO 3 — TRÉSORERIE
        h3("MODULE PRO 3 — Trésorerie"),
        body("Suivez la santé financière de votre entreprise en temps réel. Le module de trésorerie centralise vos comptes bancaires, vos mouvements et vous aide à anticiper les flux futurs."),
        gap(80),
        screenshot("tresorerie", 540, 340),
        gap(80),
        body("Cycle de gestion financière :"),
        flowSchema([
          { label: "Ajouter compte", icon: "IBAN" },
          { label: "Saisir mouvements", icon: "Revenus/Deps" },
          { label: "Categoriser", icon: "Automatique" },
          { label: "Analyser", icon: "Rapports" },
        ]),
        gap(80),
        moduleCard("Trésorerie", "PRO • Multi-comptes", [
          "Comptes bancaires (IBAN, solde, devise)", "Transactions catégorisées revenus/dépenses",
          "Catégories : Client, Abonnement, Salaires, Taxes...", "Transactions récurrentes automatiques",
          "Moyens de paiement : Virement, Carte, Prélèvement", "Rapports et analyses de flux",
          "Suivi mensuel et annuel", "Solde en temps réel par compte",
        ]),
        gap(80),
        body("Idéal pour : tout chef d'entreprise souhaitant piloter sa trésorerie sans attendre la comptabilité mensuelle.", { italics: true }),
        gap(200),

        // MODULE PRO 4 — DÉPENSES
        pageBreak(),
        h3("MODULE PRO 4 — Dépenses & Notes de frais"),
        body("Centralisez toutes vos dépenses professionnelles avec justificatifs. Le module gère les remboursements, multi-devises et permet d'affecter un budget par catégorie avec suivi en temps réel."),
        gap(80),
        screenshot("depenses", 540, 340),
        gap(80),
        body("Cycle des dépenses :"),
        flowSchema([
          { label: "Saisir depense", icon: "Montant / Cat" },
          { label: "Joindre recu", icon: "Photo / PDF" },
          { label: "Approuver", icon: "Manager" },
          { label: "Rembourser", icon: "Paiement" },
        ]),
        gap(80),
        moduleCard("Dépenses", "PRO • Multi-devises", [
          "10 catégories : Transport, Repas, Logiciel, Formation...", "Modes : Carte pro/perso, Virement, Espèces",
          "Statuts : Brouillon, Soumis, Approuvé, Remboursé", "Multi-devises : EUR, USD, GBP, CHF, CAD, MAD",
          "TVA récupérable", "Rapports groupés",
          "Budgets par catégorie (mensuel/annuel)", "Upload de justificatifs (reçus)",
        ]),
        gap(80),
        body("Idéal pour : freelances et dirigeants souhaitant contrôler leurs frais professionnels et simplifier les notes de frais.", { italics: true }),
        gap(200),

        // MODULE PRO 5 — CONTRATS
        h3("MODULE PRO 5 — Contrats & Signatures"),
        body("Gérez l'intégralité de vos engagements contractuels depuis la rédaction jusqu'à la signature. L'IA analyse chaque contrat pour détecter les risques et suggérer des points d'attention avant signature."),
        gap(80),
        screenshot("contrats", 540, 340),
        gap(80),
        body("Cycle de vie d'un contrat :"),
        flowSchema([
          { label: "Creer", icon: "Modele" },
          { label: "Analyser", icon: "IA Risques" },
          { label: "Valider", icon: "Multi-niveau" },
          { label: "Signer", icon: "Numerique" },
          { label: "Archiver", icon: "PDF certifie" },
        ]),
        gap(80),
        moduleCard("Contrats", "PRO • Signature numérique", [
          "Types : Prestation, NDA, Partenariat, SaaS, CDI, CDD...", "Statuts complets : Brouillon → Signé → Expiré",
          "Signature numérique avec certificat", "Analyse IA : résumé + détection de risques",
          "Validations multi-niveaux (manager, légal, finance)", "Historique et audit complet",
          "Export PDF", "Suivi de la date d'expiration",
        ]),
        gap(80),
        body("Idéal pour : consultants, prestataires et PME qui gèrent des contrats récurrents et souhaitent sécuriser leurs engagements.", { italics: true }),
        gap(200),

        // MODULE PRO 6 — STOCKS
        pageBreak(),
        h3("MODULE PRO 6 — Stocks & Inventaire"),
        body("Un système complet de gestion des stocks avec entrepôts, alertes automatiques et traçabilité des mouvements. Recevez une notification dès qu'un article atteint son seuil critique."),
        gap(80),
        screenshot("stocks", 540, 340),
        gap(80),
        body("Flux de gestion des stocks :"),
        flowSchema([
          { label: "Creer produit", icon: "SKU / Photo" },
          { label: "Definir seuils", icon: "Min / Critique" },
          { label: "Mouvements", icon: "Entree/Sortie" },
          { label: "Alertes auto", icon: "Notification" },
          { label: "Reappro", icon: "Commande" },
        ]),
        gap(80),
        moduleCard("Stocks", "PRO • Alertes automatiques", [
          "Produits avec SKU, code-barres, photo", "Niveaux : Courant, Minimum, Réservé, En commande",
          "Alertes : Rupture, Critique, Faible, Surstock", "Mouvements : Entrée, Sortie, Retour, Transfert",
          "Entrepôts et localisations", "Commandes fournisseurs liées",
          "Livraisons clients", "Notification cloche : stock épuisé en temps réel",
        ]),
        gap(80),
        body("Idéal pour : boutiques en ligne, artisans et revendeurs gérant un inventaire physique.", { italics: true }),
        gap(200),

        // MODULE PRO 7 — PRODUCTIVITÉ
        h3("MODULE PRO 7 — Productivité & Tâches"),
        body("Un gestionnaire de tâches professionnel en vue Kanban avec timer intégré. Assignez, priorisez et suivez chaque tâche avec estimation de temps, sous-tâches et alertes automatiques en cas de retard."),
        gap(80),
        screenshot("productivite", 540, 340),
        gap(80),
        body("Vue Kanban à 4 colonnes :"),
        flowSchema([
          { label: "A faire", icon: "Backlog" },
          { label: "En cours", icon: "WIP" },
          { label: "Validation", icon: "Review" },
          { label: "Termine", icon: "Done" },
        ]),
        gap(80),
        moduleCard("Productivité", "PRO • Kanban + Timer", [
          "Vue Kanban : À faire → En cours → Validation → Terminé", "Priorités : Faible, Normale, Haute, Urgente",
          "Sous-tâches et dépendances", "Estimation et suivi du temps",
          "Timer intégré", "Tâches récurrentes (quotidien, hebdo, mensuel)",
          "7 catégories métier", "Alertes : tâches en retard dans les notifications",
        ]),
        gap(80),
        body("Idéal pour : freelances et équipes souhaitant structurer leur travail avec une méthode visuelle.", { italics: true }),
        gap(200),

        // MODULE PRO 8 — PROJETS
        pageBreak(),
        h3("MODULE PRO 8 — Projets"),
        body("Pilotez vos projets de A à Z avec suivi budgétaire, jalons, équipe et vue Gantt. Associez chaque projet à un client et suivez l'avancement en temps réel."),
        gap(80),
        screenshot("projets", 540, 340),
        gap(80),
        body("Phases d'un projet :"),
        flowSchema([
          { label: "Creer projet", icon: "Client / Budget" },
          { label: "Planifier", icon: "Jalons Gantt" },
          { label: "Assigner", icon: "Equipe" },
          { label: "Suivre", icon: "% avancement" },
          { label: "Cloturer", icon: "Bilan" },
        ]),
        gap(80),
        moduleCard("Projets", "PRO • Vue Gantt", [
          "Statuts : En cours, Terminé, En attente, Annulé", "Budget prévu vs dépenses réelles",
          "Tâches de projet avec assignation", "Jalons avec dates clés",
          "Vue Gantt temporelle", "Équipe assignée par projet",
          "7 catégories : Design, Développement, Marketing...", "Client associé au projet",
        ]),
        gap(80),
        body("Idéal pour : agences, développeurs et chefs de projet gérant plusieurs missions en parallèle.", { italics: true }),
        gap(200),

        // MODULE PRO 9 — ÉQUIPE
        h3("MODULE PRO 9 — Équipe & RH"),
        body("Gérez votre équipe depuis un espace centralisé : profils, tâches assignées, congés, réunions et communication. Le chat d'équipe intégré supprime le besoin d'un outil externe."),
        gap(80),
        screenshot("equipe", 540, 340),
        gap(80),
        body("Fonctions RH couvertes :"),
        flowSchema([
          { label: "Profils", icon: "Roles / Statuts" },
          { label: "Taches", icon: "Assignation" },
          { label: "Conges", icon: "Absences" },
          { label: "Chat", icon: "Canaux" },
          { label: "Reunions", icon: "Planification" },
        ]),
        gap(80),
        moduleCard("Équipe & RH", "PRO • Communication intégrée", [
          "Rôles : Admin, Manager, Employé, Comptable", "Statuts : Actif, Absent, Congé, Inactif",
          "Tâches d'équipe avec assignation", "Chat d'équipe par canal",
          "Congés : Vacances, Maladie, RTT, Formation", "Réunions d'équipe planifiées",
          "Organigramme visuel", "Profils avec contact et photo",
        ]),
        gap(80),
        body("Idéal pour : TPE et PME souhaitant gérer leur équipe sans multiplier les outils RH.", { italics: true }),
        gap(200),

        // MODULE PRO 10 — CHRONO
        pageBreak(),
        h3("MODULE PRO 10 — Chrono & Suivi du temps"),
        body("Mesurez précisément le temps passé sur chaque projet et client. Le module offre 4 modes de travail dont le Pomodoro pour maximiser la concentration, et génère des rapports de productivité détaillés."),
        gap(80),
        screenshot("chrono", 540, 340),
        gap(80),
        body("Les 4 modes de travail :"),
        flowSchema([
          { label: "Classique", icon: "Libre" },
          { label: "Pomodoro", icon: "25/5 min" },
          { label: "Countdown", icon: "Minuteur" },
          { label: "Focus", icon: "Objectif" },
        ]),
        gap(80),
        moduleCard("Chrono", "PRO • 4 modes de travail", [
          "Modes : Classique, Pomodoro, Countdown, Focus", "Phases Pomodoro configurables",
          "Saisie manuelle et automatique", "Projets avec tarif horaire",
          "Facturable / Non facturable", "Rapports de productivité",
          "Objectifs quotidiens et hebdomadaires", "Historique des sessions",
        ]),
        gap(80),
        body("Idéal pour : consultants facturant au temps passé et freelances souhaitant analyser leur productivité.", { italics: true }),
        gap(200),

        // MODULE PRO 11 — FOURNISSEURS
        h3("MODULE PRO 11 — Fournisseurs"),
        body("Centralisez la gestion de vos fournisseurs avec catalogue, commandes, factures et système d'évaluation. Comparez et notez chaque fournisseur sur 4 critères : fiabilité, qualité, prix, délais."),
        gap(80),
        screenshot("fournisseurs", 540, 340),
        gap(80),
        body("Cycle fournisseur :"),
        flowSchema([
          { label: "Referencer", icon: "Fiche SIRET" },
          { label: "Cataloguer", icon: "Articles / Prix" },
          { label: "Commander", icon: "Bon de cde" },
          { label: "Receptionner", icon: "Livraison" },
          { label: "Evaluer", icon: "Note / Avis" },
        ]),
        gap(80),
        moduleCard("Fournisseurs", "PRO • Catalogue & Commandes", [
          "Catalogue par catégorie : Produits, Services, Logiciels", "Fiche : SIRET, TVA, IBAN, conditions paiement",
          "Notation : Fiabilité, Qualité, Prix, Délais", "Commandes avec statuts (Brouillon → Reçue)",
          "Factures fournisseurs avec paiement", "Numéros de suivi / tracking",
          "Catalogue articles négociés", "Historique et évaluations",
        ]),
        gap(80),
        body("Idéal pour : commerçants, artisans et entreprises achetant régulièrement à plusieurs fournisseurs.", { italics: true }),
        gap(200),

        // MODULE PRO 12 — ASSISTANT IA
        pageBreak(),
        h3("MODULE PRO 12 — Assistant IA Business"),
        body("Un assistant intelligent qui connaît toutes vos données métier en temps réel. Posez des questions en langage naturel : l'IA analyse vos factures, tâches, dépenses et contacts pour répondre avec précision."),
        gap(80),
        screenshot("assistant", 540, 340),
        gap(80),
        body("Ce que l'IA peut faire pour vous :"),
        flowSchema([
          { label: "Bilan mois", icon: "CA / Frais" },
          { label: "Alertes", icon: "Retards" },
          { label: "Analyse", icon: "Risques" },
          { label: "Suggestions", icon: "Actions" },
        ]),
        gap(80),
        moduleCard("Assistant IA", "PRO • Données métier en temps réel", [
          "Questions libres en langage naturel", "Contexte enrichi depuis toutes vos données",
          "Bilan du mois, Tâches urgentes, Alertes stock", "Rapport business complet",
          "Analyse des risques et opportunités", "Historique des conversations",
          "Suggestions proactives", "Accès simultané à tous les modules",
        ]),
        gap(80),
        body("Idéal pour : tout entrepreneur souhaitant obtenir des insights sur son activité sans analyser des dizaines de tableaux.", { italics: true }),
        gap(200),

        // MODULE PRO 13 — ABONNEMENTS
        h3("MODULE PRO 13 — Mon Abonnement"),
        body("Gérez votre abonnement DJAMA PRO : consultation du plan actuel, gestion de la facturation via le portail Stripe sécurisé, et accès à l'historique des paiements."),
        gap(80),
        screenshot("abonnements", 540, 340),
        gap(80),
        moduleCard("Abonnements", "PRO • Gestion du plan", [
          "Statut de l'abonnement en temps réel", "Plan actuel : Mensuel ou Annuel",
          "Portail Stripe sécurisé pour modifier le plan", "Téléchargement des factures d'abonnement",
          "Résiliation sans engagement depuis l'interface", "Mise à niveau / downgrade instantané",
        ]),
        gap(200),

        // ── 4. FONCTIONNALITÉS TRANSVERSALES ─────────────────────────
        pageBreak(),
        h1("4. FONCTIONNALITÉS TRANSVERSALES"),
        gap(80),

        h2("4.1 Notifications intelligentes"),
        body("Un centre de notifications unifié regroupe toutes les alertes critiques de votre activité :"),
        bullet("Cloche de notifications en temps réel (coin supérieur droit de l'interface)"),
        bullet("Alertes événements du jour (bleu)"),
        bullet("Alertes documents en retard (rouge)"),
        bullet("Alertes tâches en retard (orange)"),
        bullet("Alertes stock épuisé (orange)"),
        bullet("Badge numérique indiquant le nombre d'alertes actives"),
        gap(),

        h2("4.2 Recherche globale (Ctrl+K)"),
        body("Un raccourci clavier accessible depuis n'importe quelle page de l'application lance une recherche simultanée dans 6 sources de données :"),
        bullet("Factures & Devis — par numéro, montant ou nom client"),
        bullet("Planning — par titre d'événement ou description"),
        bullet("Contacts CRM — par nom, email ou entreprise"),
        bullet("Contrats — par titre ou partie contractante"),
        bullet("Notes du bloc-notes — recherche full-text dans le contenu"),
        bullet("Tâches — par titre ou assignataire"),
        gap(),

        h2("4.3 Devis en ligne avec signature électronique"),
        body("Le processus de signature électronique est entièrement intégré et conforme légalement :"),
        gap(80),
        flowSchema([
          { label: "Generer lien", icon: "Token UUID" },
          { label: "Client ouvre", icon: "Sans compte" },
          { label: "Lit & signe", icon: "Canvas" },
          { label: "Consentement", icon: "Checkbox" },
          { label: "Archivage", icon: "Horodatage" },
        ]),
        gap(80),
        bullet("Génération d'un lien unique et sécurisé par devis (token UUID)"),
        bullet("Page publique accessible sans compte par le client"),
        bullet("Canvas de signature (dessin à la souris ou au doigt sur mobile)"),
        bullet("Validation légale avec checkbox de consentement électronique"),
        bullet("Mise à jour automatique du statut vers \"Accepté\" après signature"),
        bullet("Horodatage et archivage de la signature (nom + date)"),
        gap(),

        h2("4.4 Export CSV"),
        bullet("Disponible sur : Factures, Contacts CRM, Dépenses, Trésorerie"),
        bullet("Fichier CSV UTF-8 avec BOM (compatible Excel français)"),
        bullet("Toutes les colonnes avec en-têtes en français"),
        gap(),

        h2("4.5 Interface adaptative"),
        bullet("Design responsive : desktop, tablette, smartphone"),
        bullet("Barre de navigation latérale (desktop) et bottom tabs (mobile)"),
        bullet("Thème dark premium cohérent sur toutes les pages"),
        bullet("Animations fluides avec Framer Motion"),
        bullet("Accessibilité : contrastes élevés, navigation clavier"),
        gap(200),

        // ── 5. ONBOARDING ─────────────────────────────────────────────
        h1("5. ONBOARDING ET SUPPORT"),
        gap(80),

        h2("5.1 Parcours d'onboarding"),
        body("Dès la première connexion, l'utilisateur est guidé pas-à-pas pour prendre en main les outils essentiels :"),
        flowSchema([
          { label: "Bienvenue", icon: "Modal step 1" },
          { label: "Outils cles", icon: "Step 2" },
          { label: "Acces rapide", icon: "Step 3" },
          { label: "Dashboard", icon: "Pret" },
        ]),
        gap(80),
        bullet("Modal de bienvenue au premier login (3 étapes guidées)"),
        bullet("Présentation des outils principaux dès la première connexion"),
        bullet("Accès direct aux fonctionnalités clés depuis l'étape 2"),
        gap(),

        h2("5.2 Canaux de support"),
        bullet("Formulaire de contact : djama.space/contact"),
        bullet("Email : contact@djama.space"),
        bullet("WhatsApp disponible sur la page contact"),
        gap(200),

        // ── 6. TARIFICATION ───────────────────────────────────────────
        pageBreak(),
        h1("6. MODÈLE TARIFAIRE"),
        gap(80),

        h2("6.1 Récapitulatif des plans"),
        techTable([
          ["", "Plan Gratuit", "Plan PRO"],
          ["Prix", "0 € / mois", "11,90 € / mois"],
          ["Factures & Devis", "5 documents max", "Illimité"],
          ["Planning", "Oui", "Oui"],
          ["Bloc-notes IA", "Oui", "Oui"],
          ["Tableau de bord", "Non", "Oui"],
          ["CRM", "Non", "Oui"],
          ["Trésorerie", "Non", "Oui"],
          ["Dépenses", "Non", "Oui"],
          ["Contrats", "Non", "Oui"],
          ["Stocks", "Non", "Oui"],
          ["Productivité", "Non", "Oui"],
          ["Projets", "Non", "Oui"],
          ["Équipe & RH", "Non", "Oui"],
          ["Chrono", "Non", "Oui"],
          ["Fournisseurs", "Non", "Oui"],
          ["Réseaux Sociaux", "Non", "Oui"],
          ["Portail Client", "Non", "Oui"],
          ["Paie & Bulletins", "Non", "Oui"],
          ["Réputation", "Non", "Oui"],
          ["Sourcing IA", "Non", "Oui"],
          ["Assistant IA", "Non", "Oui"],
          ["Engagement", "Aucun", "Aucun — résiliable à tout moment"],
          ["Carte bancaire requise", "Non", "Oui"],
        ]),
        gap(),

        h2("6.2 Paiements acceptés"),
        bullet("Carte bancaire (Visa, Mastercard, American Express)"),
        bullet("Apple Pay / Google Pay"),
        bullet("Prélèvement SEPA"),
        bullet("Géré par Stripe — certifié PCI-DSS niveau 1"),
        gap(200),

        // ── 7. DONNÉES ────────────────────────────────────────────────
        h1("7. DONNÉES ET CONFORMITÉ RGPD"),
        gap(80),

        h2("7.1 Protection des données"),
        bullet("Conformité RGPD complète"),
        bullet("Politique de confidentialité : djama.space/legal/confidentialite"),
        bullet("Droit d'accès, de rectification et de suppression sur simple demande"),
        bullet("Aucune revente de données à des tiers"),
        bullet("Données hébergées en Europe (Supabase EU)"),
        gap(),

        h2("7.2 Sauvegardes et disponibilité"),
        bullet("Sauvegardes automatiques quotidiennes de la base de données"),
        bullet("Rétention des données pendant toute la durée de l'abonnement + 30 jours"),
        bullet("SLA : 99,9 % de disponibilité"),
        bullet("Infrastructure Supabase (AWS eu-west) + Vercel CDN mondial"),
        bullet("Mises à jour continues sans interruption de service"),
        gap(200),

        // ── 8. COMPARATIF ─────────────────────────────────────────────
        pageBreak(),
        h1("8. COMPARATIF CONCURRENTIEL"),
        gap(80),
        body("DJAMA PRO remplace à lui seul les 8 outils suivants, pour une fraction du prix total :"),
        gap(80),
        compTable([
          ["Outil", "Fonctionnalité principale", "Prix / mois"],
          ["Quickbooks", "Comptabilité", "~30 €"],
          ["HubSpot CRM", "CRM", "~41 €"],
          ["Asana", "Gestion de projet", "~11 €"],
          ["Pennylane", "Trésorerie", "~25 €"],
          ["DocuSign", "Signature électronique", "~15 €"],
          ["Buffer", "Réseaux sociaux", "~15 €"],
          ["Harvest", "Suivi du temps", "~11 €"],
          ["Sage", "Paie", "~40 €"],
          ["Total outils séparés", "", "~188 € / mois"],
          ["DJAMA PRO — Tous ces outils réunis", "", "11,90 € / mois"],
        ]),
        gap(80),
        body("Soit une économie de plus de 176 € par mois, pour des fonctionnalités intégrées et synchronisées entre elles."),
        gap(200),

        // ── 9. ROADMAP ────────────────────────────────────────────────
        h1("9. FEUILLE DE ROUTE (ROADMAP)"),
        gap(80),

        h2("9.1 En cours de développement"),
        bullet("Envoi de factures directement par email depuis l'application"),
        bullet("Rappels automatiques d'impayés"),
        bullet("Application mobile native (iOS / Android)"),
        bullet("Notifications push sur mobile (PWA)"),
        gap(),

        h2("9.2 Prévu à 6 mois"),
        bullet("API publique pour intégrations tierces"),
        bullet("Connecteur Zapier / Make (automatisations)"),
        bullet("Plan Équipe (multi-utilisateurs)"),
        bullet("Intégration comptable (export FEC)"),
        bullet("Intégration bancaire (import relevés)"),
        gap(200),

        // ── 10. INFORMATIONS LÉGALES ──────────────────────────────────
        h1("10. INFORMATIONS LÉGALES"),
        gap(80),
        bodyBold("Éditeur :", "DJAMA"),
        bodyBold("Site web :", "https://djama.space"),
        bodyBold("Email :", "contact@djama.space"),
        bodyBold("Conditions d'utilisation :", "djama.space/legal/cgu"),
        bodyBold("Politique de confidentialité :", "djama.space/legal/confidentialite"),
        bodyBold("Mentions légales :", "djama.space/legal/mentions-legales"),
        gap(160),

        new Paragraph({
          children: [
            new TextRun({ text: "Document établi le 2 juillet 2026 — Version 1.0", size: 16, color: MUTED, font: "Arial", italics: true }),
          ],
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: LGRAY } },
          spacing: { before: 80, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Toutes les fonctionnalités sont susceptibles d'évoluer. Les mises à jour sont communiquées par email.", size: 16, color: MUTED, font: "Arial", italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// ── Génération du fichier ─────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("C:/Users/nofam/djama-premium/docs/cahier-des-charges-djama-pro.docx", buffer);
  const sizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`✅ Fichier généré : docs/cahier-des-charges-djama-pro.docx (${sizeKB} KB)`);
}).catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
