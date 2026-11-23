/**
 * _test-phase3.ts — Génère 18 PDFs de test Phase 3 via generatePdfBuffer.
 * Exécution : npx tsx _test-phase3.ts
 * Sortie : scratchpad/test-phase3/*.pdf
 */
import fs   from "node:fs";
import path from "node:path";
import { generatePdfBuffer } from "./src/lib/pdf/generatePdfBuffer.js";
import type { PdfData } from "./src/lib/pdf/generatePdf.js";

const OUT_DIR = String.raw`C:\Users\nofam\AppData\Local\Temp\claude\f8c7b46878a7a3bb\5e66be41-2897-4bb1-a214-acf70eeb27f3\scratchpad\test-phase3`;
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Société émettrice fictive ────────────────────────────────────────────────
const CO = {
  name: "Agence Tempo SAS", email: "contact@agence-tempo.fr",
  website: "www.agence-tempo.fr", phone: "+33 1 42 00 11 22",
  address: "15 Rue de la Paix", postal_code: "75002", city: "Paris",
  country: "France", siret: "987 654 321 00011", ape: "7311Z",
  vat_number: "FR98 987654321", iban: "FR76 1027 8060 3700 0202 1200 174",
  bic: "CMCIFR2A", forme_juridique: "SAS au capital de 50 000 €",
  capital_social: "50000", garantie: "",
  mentions_legales: "En cas de retard de paiement, pénalités au taux de 3× le taux légal + indemnité 40 €.",
  logoSize: "md" as const, logoHideName: false,
  template: "min-ligne" as const, color: "#c9a55a", logoTransform: null,
};

function r2(n: number) { return Math.round(n * 100) / 100; }

// ─── 18 cas de test ───────────────────────────────────────────────────────────
const CASES: Array<{ id: string; label: string; data: PdfData }> = [

  // ── Cat.1 : FACTURES SIMPLES (3) ────────────────────────────────────────────
  (() => {
    const items = [
      { description: "Audit UX & stratégie digitale",   quantity: 1, unit_price: 1500, total: 1500, tax_rate: 20 },
      { description: "Design d'interface (maquettes)",  quantity: 3, unit_price:  600, total: 1800, tax_rate: 20 },
      { description: "Intégration HTML/CSS responsive", quantity: 2, unit_price:  450, total:  900, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "F01-simple-prestas", label: "1 — Facture simple : 3 prestations, TVA 20%",
      data: {
        type: "invoice" as const, template: "corp-marine" as const, reference: "FAC-2026-001",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Sophie Martin", client_email: "s.martin@techcorp.fr",
        client_company: "TechCorp Europe SAS", client_address: "8 Boulevard Haussmann, 75009 Paris",
        client_vat: "FR55 123456789", subject: "Projet digital — Phase 1",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        rib_iban: CO.iban, rib_bic: CO.bic, rib_titulaire: CO.name, rib_banque: "CIC",
        notes: "Paiement par virement. Merci pour votre confiance.",
        footer_text: "Agence Tempo SAS — SIRET 987 654 321 00011 — TVA FR98 987654321",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Développement WordPress", quantity: 1, unit_price: 2800, total: 2800, tax_rate: 0 },
      { description: "Formation CMS (2h)",       quantity: 2, unit_price:  150, total:  300, tax_rate: 0 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    return {
      id: "F02-auto-entrepreneur", label: "2 — Facture auto-entrepreneur : TVA 0%",
      data: {
        type: "invoice" as const, template: "min-ligne" as const, reference: "FAC-2026-002",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Pierre Duval", client_email: "p.duval@mail.fr",
        subject: "Site web — livraison finale",
        items, subtotal: sub, tax_rate: 0, tax_amount: 0, total: sub,
        notes: "Paiement à réception. TVA non applicable, art. 293 B du CGI.",
        footer_text: "TVA non applicable, art. 293 B du CGI.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Annulation partielle — 1 maquette Design", quantity: 1, unit_price: 600, total: 600, tax_rate: 20 },
    ];
    const tva = r2(600 * 0.20);
    return {
      id: "F03-avoir", label: "3 — Avoir : rectificatif FAC-2026-001",
      data: {
        type: "invoice" as const, template: "prem-or" as const, reference: "AVO-2026-001",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Sophie Martin", client_email: "s.martin@techcorp.fr",
        client_company: "TechCorp Europe SAS",
        subject: "Avoir sur FAC-2026-001 du 14/11/2026",
        items, subtotal: 600, tax_rate: 20, tax_amount: tva, total: r2(600 + tva),
        notes: "Avoir relatif à la facture FAC-2026-001. Montant à déduire du prochain règlement.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  // ── Cat.2 : DEVIS PROFESSIONNELS (3) ────────────────────────────────────────
  (() => {
    const items = [
      { description: "Audit & benchmark concurrentiel",           quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20 },
      { description: "UX Research (interviews utilisateurs)",     quantity: 4, unit_price:  400, total: 1600, tax_rate: 20 },
      { description: "Design UI — wireframes + maquettes HD",     quantity: 1, unit_price: 2800, total: 2800, tax_rate: 20 },
      { description: "Développement Next.js + CMS headless",      quantity: 1, unit_price: 4500, total: 4500, tax_rate: 20 },
      { description: "Recette & déploiement",                      quantity: 1, unit_price:  800, total:  800, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "D01-refonte-web", label: "4 — Devis : refonte complète site web B2B",
      data: {
        type: "quote" as const, template: "corp-lateral" as const, reference: "DEV-2026-001",
        issue_date: "2026-11-14", valid_until: "2026-12-31",
        client_name: "Isabelle Renard", client_email: "i.renard@groupe-renard.fr",
        client_company: "Groupe Renard & Fils SA", client_vat: "FR22 789123456",
        subject: "Refonte digitale B2B — Proposition commerciale",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Devis valable jusqu'au 31/12/2026. Délai de réalisation : 12 semaines.\nAcompte de 30% à la commande.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Développeur Full-Stack Senior (régie)", quantity: 20, unit_price: 580, total: 11600, tax_rate: 20, unit: "j" },
      { description: "Architecte Cloud AWS",                   quantity:  5, unit_price: 850, total:  4250, tax_rate: 20, unit: "j" },
      { description: "Scrum Master (3 sprints)",               quantity: 15, unit_price: 650, total:  9750, tax_rate: 20, unit: "j" },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "D02-regie-esn", label: "5 — Devis ESN : régie informatique mensuelle",
      data: {
        type: "quote" as const, template: "tech-sombre" as const, reference: "DEV-2026-002",
        issue_date: "2026-11-14", valid_until: "2026-12-15",
        client_name: "Paul Lefebvre", client_email: "p.lefebvre@datastream.tech",
        client_company: "DataStream Technologies", client_vat: "FR99 456789123",
        subject: "Renforcement équipe technique — Sprint Q4 2026",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Tarifs journaliers valables jusqu'au 15/12/2026. TJM indicatifs hors frais de déplacement.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Stratégie de marque & naming",             quantity: 1, unit_price: 2500, total: 2500, tax_rate: 20 },
      { description: "Création logo + charte graphique",         quantity: 1, unit_price: 4800, total: 4800, tax_rate: 20 },
      { description: "Templates print (carte, papeterie)",       quantity: 1, unit_price: 1800, total: 1800, tax_rate: 20 },
      { description: "Déclinaisons digitales (bannières, RS)",   quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "D03-identite-luxe", label: "6 — Devis haut de gamme : identité visuelle luxe",
      data: {
        type: "quote" as const, template: "prem-nuit" as const, reference: "DEV-2026-003",
        issue_date: "2026-11-14", valid_until: "2026-12-20",
        client_name: "Charlotte Moreau", client_email: "c.moreau@maison-elegante.fr",
        client_company: "Maison Élégante", client_vat: "FR33 321654987",
        subject: "Création identité de marque — Luxe & Prestige",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Devis haut de gamme — livraison des fichiers sources incluse.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  // ── Cat.3 : MULTI-TAUX TVA (3) ───────────────────────────────────────────────
  (() => {
    const items = [
      { description: "Location salle de conférence (taux 5.5%)",  quantity: 1, unit_price: 1500, total: 1500, tax_rate: 5.5 },
      { description: "Buffet traiteur (taux 5.5%)",               quantity: 1, unit_price:  800, total:  800, tax_rate: 5.5 },
      { description: "Sonorisation & éclairage scénique (20%)",   quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20  },
      { description: "Animation & coordination événement (20%)",  quantity: 1, unit_price:  900, total:  900, tax_rate: 20  },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(items.reduce((s, i) => s + r2(i.total * i.tax_rate / 100), 0));
    return {
      id: "F04-multi-tva-event", label: "7 — Multi-TVA : événementiel (5.5% + 20%)",
      data: {
        type: "invoice" as const, template: "creat-vif" as const, reference: "FAC-2026-010",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Lucie Bernard", client_email: "l.bernard@events.fr",
        client_company: "Events & Co", client_vat: "FR44 654321789",
        subject: "Organisation soirée gala — Novembre 2026",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Tarif avec taux TVA mixtes : 5.5% (hébergement/repas) et 20% (services).",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Médicaments liste I (TVA 2.1%)",            quantity: 3,  unit_price:  28, total:  84, tax_rate: 2.1 },
      { description: "Dispositifs médicaux réutilisables (10%)",  quantity: 2,  unit_price:  85, total: 170, tax_rate: 10  },
      { description: "Consultation & services auxiliaires (20%)", quantity: 1,  unit_price: 180, total: 180, tax_rate: 20  },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(items.reduce((s, i) => s + r2(i.total * i.tax_rate / 100), 0));
    return {
      id: "F05-multi-tva-pharma", label: "8 — Multi-TVA : santé (2.1% + 10% + 20%)",
      data: {
        type: "invoice" as const, template: "serv-nature" as const, reference: "FAC-2026-011",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Dr. Arnaud Blanc", client_email: "a.blanc@clinique-lac.fr",
        client_company: "Clinique du Lac",
        subject: "Fournitures & prestations médicales — Nov. 2026",
        items, subtotal: sub, tax_rate: 10, tax_amount: tva, total: r2(sub + tva),
        notes: "Facturation avec taux TVA différenciés selon nature des produits et services.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Produits alimentaires bruts (TVA 0% — export)", quantity: 10, unit_price: 25, total: 250, tax_rate: 0   },
      { description: "Produits bio transformés (TVA 5.5%)",             quantity:  5, unit_price: 18, total:  90, tax_rate: 5.5 },
      { description: "Vêtements & accessoires de cuisine (TVA 20%)",    quantity:  2, unit_price: 45, total:  90, tax_rate: 20  },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(items.reduce((s, i) => s + r2(i.total * i.tax_rate / 100), 0));
    return {
      id: "F06-multi-tva-bio", label: "9 — Multi-TVA : alimentation (0% + 5.5% + 20%)",
      data: {
        type: "invoice" as const, template: "serv-chaud" as const, reference: "FAC-2026-012",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Emma Rousseau", client_email: "e.rousseau@jardin-bio.fr",
        client_company: "Le Jardin Bio",
        subject: "Commande fournisseur — Épicerie fine & traiteur",
        items, subtotal: sub, tax_rate: 5.5, tax_amount: tva, total: r2(sub + tva),
        notes: "Produits certifiés AB. Bon de livraison joint. TVA 0% sur produits alimentaires export.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  // ── Cat.4 : MULTI-PAGES (3) ─────────────────────────────────────────────────
  (() => {
    const items = [
      { description: "Cadrage projet & rédaction cahier des charges",     quantity: 3,  unit_price:  450, total: 1350, tax_rate: 20 },
      { description: "Architecture système & choix technologique",        quantity: 2,  unit_price:  600, total: 1200, tax_rate: 20 },
      { description: "Développement Back-end API REST (Node.js)",         quantity: 15, unit_price:  450, total: 6750, tax_rate: 20 },
      { description: "Développement Front-end React / Next.js",           quantity: 12, unit_price:  420, total: 5040, tax_rate: 20 },
      { description: "Base de données PostgreSQL & modélisation",         quantity: 4,  unit_price:  400, total: 1600, tax_rate: 20 },
      { description: "Tests unitaires & d'intégration (Jest + Cypress)",  quantity: 6,  unit_price:  350, total: 2100, tax_rate: 20 },
      { description: "Sécurité & audit OWASP",                            quantity: 2,  unit_price:  550, total: 1100, tax_rate: 20 },
      { description: "CI/CD Pipeline (GitHub Actions + Kubernetes)",      quantity: 3,  unit_price:  500, total: 1500, tax_rate: 20 },
      { description: "Migration données & import base existante",          quantity: 2,  unit_price:  480, total:  960, tax_rate: 20 },
      { description: "Formation équipe interne (2 jours)",                 quantity: 2,  unit_price:  650, total: 1300, tax_rate: 20 },
      { description: "Documentation technique & guide utilisateur",        quantity: 3,  unit_price:  300, total:  900, tax_rate: 20 },
      { description: "Maintenance corrective (1 mois post-livraison)",     quantity: 1,  unit_price: 1200, total: 1200, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "F07-multipage-it", label: "10 — Multi-pages : projet IT (12 lignes)",
      data: {
        type: "invoice" as const, template: "corp-bipart" as const, reference: "FAC-2026-020",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Marc Dupont", client_email: "m.dupont@banquedirecte.fr",
        client_company: "BanqueDirecte SA", client_vat: "FR55 987654321",
        subject: "Développement plateforme Core Banking — Phase 2",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Facturation conforme au bon de commande BC-2026-089. Jalons validés.",
        rib_iban: CO.iban, rib_bic: CO.bic, rib_titulaire: CO.name, rib_banque: "CIC",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Esquisse & avant-projet sommaire (APS)",         quantity: 1, unit_price: 2800, total: 2800, tax_rate: 20 },
      { description: "Avant-projet définitif (APD)",                   quantity: 1, unit_price: 3200, total: 3200, tax_rate: 20 },
      { description: "Permis de construire — dossier PC",              quantity: 1, unit_price: 2200, total: 2200, tax_rate: 20 },
      { description: "Projet — DCE (documents contractuels)",          quantity: 1, unit_price: 4800, total: 4800, tax_rate: 20 },
      { description: "Consultation entreprises & analyse offres",      quantity: 1, unit_price: 1500, total: 1500, tax_rate: 20 },
      { description: "Visa des plans d'exécution (VISA)",              quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20 },
      { description: "Direction de l'exécution (DET) — 6 mois",       quantity: 6, unit_price: 1200, total: 7200, tax_rate: 20 },
      { description: "Assistance aux opérations de réception (AOR)",  quantity: 1, unit_price:  900, total:  900, tax_rate: 20 },
      { description: "Synthèse & coordination BET",                    quantity: 3, unit_price:  600, total: 1800, tax_rate: 20 },
      { description: "Honoraires de représentation & déplacements",    quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "D04-multipage-archi", label: "11 — Multi-pages : maîtrise d'œuvre architecture",
      data: {
        type: "quote" as const, template: "prem-creme" as const, reference: "DEV-2026-010",
        issue_date: "2026-11-14", valid_until: "2027-01-31",
        client_name: "Famille Bertrand", client_email: "bertrand@exemple.fr",
        subject: "Maîtrise d'œuvre — Villa contemporaine 280m², Bordeaux",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Mission MOE complète selon contrat CCAG. Honoraires calculés sur la base des travaux estimés à 580 000 € HT.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Diagnostic stratégique — analyse SWOT étendue",   quantity: 2, unit_price: 1800, total: 3600, tax_rate: 20 },
      { description: "Benchmark concurrentiel (3 marchés)",              quantity: 1, unit_price: 2400, total: 2400, tax_rate: 20 },
      { description: "Ateliers de co-construction stratégique (2 j.)",   quantity: 2, unit_price: 2000, total: 4000, tax_rate: 20 },
      { description: "Modélisation financière & plan à 5 ans",           quantity: 1, unit_price: 3200, total: 3200, tax_rate: 20 },
      { description: "Feuille de route transformation digitale",         quantity: 1, unit_price: 2800, total: 2800, tax_rate: 20 },
      { description: "Présentation COMEX & livrables exécutifs",         quantity: 1, unit_price: 1600, total: 1600, tax_rate: 20 },
      { description: "Accompagnement implémentation (3 mois)",           quantity: 3, unit_price: 2500, total: 7500, tax_rate: 20 },
      { description: "Rapport final + propriété intellectuelle",          quantity: 1, unit_price: 1500, total: 1500, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "F08-multipage-conseil", label: "12 — Multi-pages : mission de conseil stratégique",
      data: {
        type: "invoice" as const, template: "min-grille" as const, reference: "FAC-2026-021",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Alexandre Fontaine", client_email: "a.fontaine@meridian.com",
        client_company: "Meridian Holdings Group", client_vat: "FR11 112233445",
        subject: "Mission stratégie & transformation — Q4 2026",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Mission menée du 01/10/2026 au 30/11/2026. Périmètre : France + Benelux + DACH.\nPropriété des livrables transférée à réception du règlement intégral.",
        rib_iban: CO.iban, rib_bic: CO.bic, rib_titulaire: CO.name, rib_banque: "CIC",
        currency: "EUR", company: CO,
      },
    };
  })(),

  // ── Cat.5 : REMISE + ACOMPTE (3) ────────────────────────────────────────────
  (() => {
    const items = [
      { description: "Développement e-commerce Shopify", quantity: 1, unit_price: 4800, total: 4800, tax_rate: 20 },
      { description: "Migration catalogue produits",      quantity: 1, unit_price: 1200, total: 1200, tax_rate: 20 },
      { description: "Intégration paiements Stripe",      quantity: 1, unit_price:  800, total:  800, tax_rate: 20 },
    ];
    const sub     = r2(items.reduce((s, i) => s + i.total, 0));
    const remPct  = 15;
    const rem     = r2(sub * remPct / 100);
    const ht      = r2(sub - rem);
    const tva     = r2(ht * 0.20);
    return {
      id: "F09-remise-globale", label: "13 — Remise globale 15% sur commande fidèle",
      data: {
        type: "invoice" as const, template: "comm-boutique" as const, reference: "FAC-2026-030",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Nathalie Vidal", client_email: "n.vidal@boutique-chic.fr",
        client_company: "Boutique Chic Online",
        subject: "Développement boutique en ligne — Remise fidélité 15%",
        items, subtotal: sub, discount_rate: remPct, discount: rem,
        tax_rate: 20, tax_amount: tva, total: r2(ht + tva),
        notes: "Remise de fidélité 15% accordée pour la 3e commande consécutive.",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Tournage vidéo institutionnelle (2 jours)",    quantity: 2, unit_price: 1800, total: r2(2 * 1800 * 0.90), tax_rate: 20 },
      { description: "Post-production & montage (étalonnage, SFX)",  quantity: 1, unit_price: 2400, total: r2(2400 * 0.80),     tax_rate: 20 },
      { description: "Motion design & animation générique",           quantity: 1, unit_price:  900, total: 900,                 tax_rate: 20 },
    ];
    const ht  = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(ht * 0.20);
    const ttc = r2(ht + tva);
    const dep = r2(ttc * 0.30);
    return {
      id: "F10-remise-acompte", label: "14 — Remises ligne + acompte 30%",
      data: {
        type: "invoice" as const, template: "creat-angle" as const, reference: "FAC-2026-031",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Kevin Leroy", client_email: "k.leroy@videofirst.fr",
        client_company: "VideoFirst Productions",
        subject: "Film institutionnel 2026 — Remises négociées + acompte 30%",
        items, subtotal: ht, tax_rate: 20, tax_amount: tva, total: ttc,
        deposit: dep, deposit_label: "Acompte versé à la commande (30%)",
        notes: "Remises à la ligne : -10% tournage (2 jours consécutifs) / -20% montage (délai express).",
        currency: "EUR", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Développement application mobile iOS & Android", quantity: 1,  unit_price: 28000, total: 28000, tax_rate: 20 },
      { description: "Maintenance 12 mois (SLA 99.5%)",                quantity: 12, unit_price:  1200, total: 14400, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    const ttc = r2(sub + tva);
    const dep = r2(ttc * 0.50);
    return {
      id: "F11-acompte-50pct", label: "15 — Acompte 50% sur grande prestation",
      data: {
        type: "invoice" as const, template: "corp-tampon" as const, reference: "FAC-2026-032",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Cyrille Pons", client_email: "c.pons@mobapp.fr",
        client_company: "MobApp Ventures",
        subject: "Développement app mobile cross-platform — Appel de fonds 50%",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: ttc,
        deposit: dep, deposit_label: "Acompte 50% reçu à la signature",
        notes: "Facturation en 2 appels de fonds : 50% à la signature, 50% à la livraison.",
        rib_iban: CO.iban, rib_bic: CO.bic, rib_titulaire: CO.name, rib_banque: "CIC",
        currency: "EUR", company: CO,
      },
    };
  })(),

  // ── Cat.6 : MULTI-DEVISES (3) ────────────────────────────────────────────────
  (() => {
    const items = [
      { description: "API Integration & Backend Development",   quantity: 10, unit_price: 350, total: 3500, tax_rate: 0 },
      { description: "Frontend React / React Native",           quantity:  8, unit_price: 320, total: 2560, tax_rate: 0 },
      { description: "Cloud Architecture Review (AWS)",         quantity:  2, unit_price: 500, total: 1000, tax_rate: 0 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    return {
      id: "F12-usd", label: "16 — Multi-devise USD : client américain",
      data: {
        type: "invoice" as const, template: "tech-circuit" as const, reference: "INV-2026-001",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "James Peterson", client_email: "j.peterson@acme.us",
        client_company: "Acme Corp Inc.", client_address: "350 5th Avenue, New York, NY 10118",
        client_vat: "US-EIN-12-3456789",
        subject: "Software Development Services — Q4 2026",
        items, subtotal: sub, tax_rate: 0, tax_amount: 0, total: sub,
        footer_text: "Agence Tempo SAS — SIRET 987 654 321 00011 — Reverse charge applicable per EU VAT rules.",
        currency: "USD", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Brand Identity Design", quantity: 1, unit_price: 2200, total: 2200, tax_rate: 0 },
      { description: "Website UX/UI Design",  quantity: 1, unit_price: 3800, total: 3800, tax_rate: 0 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    return {
      id: "F13-gbp", label: "17 — Multi-devise GBP : client britannique",
      data: {
        type: "invoice" as const, template: "min-blanc" as const, reference: "INV-2026-002",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Emily Clarke", client_email: "e.clarke@brandco.uk",
        client_company: "BrandCo Ltd", client_address: "10 Downing Street, London SW1A 2AA",
        client_vat: "GB123456789",
        subject: "Design Services — Brand & Digital",
        items, subtotal: sub, tax_rate: 0, tax_amount: 0, total: sub,
        footer_text: "Agence Tempo SAS — Intra-EU reverse charge — No UK VAT charged.",
        currency: "GBP", company: CO,
      },
    };
  })(),

  (() => {
    const items = [
      { description: "Formation React.js & Next.js (5 jours)", quantity: 5, unit_price: 3500, total: 17500, tax_rate: 20, unit: "j" },
      { description: "Support post-formation (1 mois)",         quantity: 1, unit_price: 4000, total:  4000, tax_rate: 20 },
    ];
    const sub = r2(items.reduce((s, i) => s + i.total, 0));
    const tva = r2(sub * 0.20);
    return {
      id: "F14-mad", label: "18 — Multi-devise MAD : client marocain",
      data: {
        type: "invoice" as const, template: "comm-classique" as const, reference: "FAC-2026-050",
        issue_date: "2026-11-14", due_date: "2026-12-14",
        client_name: "Youssef Alaoui", client_email: "y.alaoui@techma.ma",
        client_company: "TechMa Solutions", client_address: "23 Rue des Nations Unies, Casablanca 20000, Maroc",
        client_vat: "TVA-MA-12345",
        subject: "Formation & accompagnement technique — Casablanca",
        items, subtotal: sub, tax_rate: 20, tax_amount: tva, total: r2(sub + tva),
        notes: "Facturation en dirhams marocains. Paiement par virement bancaire international.\nTaux de change indicatif : 1 EUR = 10,8 MAD.",
        currency: "MAD", company: CO,
      },
    };
  })(),
];

// ─── Génération ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`Génération de ${CASES.length} PDFs de test Phase 3...\n`);

  const results: Array<{ id: string; label: string; ok: boolean; error?: string; size?: number }> = [];

  for (let i = 0; i < CASES.length; i++) {
    const { id, label, data } = CASES[i];
    try {
      const buf = await generatePdfBuffer(data);
      const out = path.join(OUT_DIR, `${String(i + 1).padStart(2, "0")}_${id}.pdf`);
      fs.writeFileSync(out, buf);
      results.push({ id, label, ok: true, size: buf.length });
      console.log(`  OK [${String(i + 1).padStart(2, "0")}/18] ${label} (${(buf.length / 1024).toFixed(0)} Ko)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id, label, ok: false, error: msg });
      console.error(`  KO [${String(i + 1).padStart(2, "0")}/18] ${label}`);
      console.error(`       ${msg}`);
    }
  }

  const ok  = results.filter(r => r.ok).length;
  const nok = results.filter(r => !r.ok).length;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Résultat : ${ok}/18 PDFs générés${nok > 0 ? ` (${nok} erreurs)` : " -- TOUS OK"}`);
  console.log(`Dossier  : ${OUT_DIR}`);

  if (nok > 0) {
    console.log("\nEchecs :");
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.id}: ${r.error}`));
    process.exit(1);
  }

  console.log("\n-- Résumé par catégorie --");
  console.log("  Cat.1 Factures simples (3)     : F01..F03");
  console.log("  Cat.2 Devis professionnels (3) : D01..D03");
  console.log("  Cat.3 Multi-taux TVA (3)        : F04..F06");
  console.log("  Cat.4 Multi-pages (3)           : F07..F08 + D04");
  console.log("  Cat.5 Remise + acompte (3)      : F09..F11");
  console.log("  Cat.6 Multi-devises (3)         : F12..F14");
}

main().catch(err => { console.error(err); process.exit(1); });
