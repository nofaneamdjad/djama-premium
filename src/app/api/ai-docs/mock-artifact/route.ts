// TEMPORAIRE — endpoint de démo pour visualiser le workspace sans migration
// À supprimer après application de 115_artifacts.sql
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    artifact: {
      id: "demo",
      organization_id: "org-demo",
      owner_id: "user-demo",
      type: "document",
      title: "Rapport d'activité Q4 2026",
      schema_version: 1,
      content: {
        settings: {
          theme: "professional", font: "serif", fontSize: 12, lineSpacing: 1.6,
          pageFormat: "A4", pageOrientation: "portrait",
          margins: { top: 25, bottom: 25, left: 25, right: 25 },
          language: "fr",
        },
        sections: [
          {
            id: "s1", type: "cover",
            title: "Rapport d'activité Q4 2026",
            subtitle: "DJAMA PREMIUM — Synthèse trimestrielle",
            elements: [],
          },
          {
            id: "s2", type: "section", title: "Résumé exécutif",
            elements: [
              { id: "e1", type: "paragraph", text: "Le quatrième trimestre 2026 marque une progression significative de l'ensemble des indicateurs clés. Le chiffre d'affaires consolidé atteint 487 000 €, soit une hausse de 23% par rapport au T3.", align: "justify" },
              { id: "e2", type: "callout", variant: "success", title: "Objectif atteint", text: "L'objectif annuel de 1,5 M€ de CA a été dépassé avec 1,62 M€ réalisés." },
            ],
          },
          {
            id: "s3", type: "section", title: "Indicateurs clés",
            elements: [
              { id: "e3", type: "table", headers: ["Indicateur", "T3 2026", "T4 2026", "Évolution"], rows: [["Chiffre d'affaires", "396 000 €", "487 000 €", "+23%"], ["Nouveaux clients", "18", "27", "+50%"], ["Taux de rétention", "87%", "91%", "+4 pts"]], caption: "Performance trimestrielle" },
            ],
          },
          {
            id: "s4", type: "section", title: "Conclusions",
            elements: [
              { id: "e4", type: "heading", level: 2, text: "Prochaines étapes" },
              { id: "e5", type: "list", style: "bullet", items: [{ id: "l1", text: "Lancement du module Recrutement IA — Q1 2027" }, { id: "l2", text: "Expansion Europe du Nord — 3 nouveaux marchés" }, { id: "l3", text: "Certification ISO 27001 — audit prévu en mars" }] },
            ],
          },
        ],
      },
      metadata: { wordCount: 340 },
      is_archived: false,
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    threadId: null,
  });
}
