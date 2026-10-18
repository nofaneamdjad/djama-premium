// Benchmarks sectoriels statiques — sources : BPI France, INSEE 2023-2024
// Utilisés pour contextualiser les KPIs sans jamais inventer de données utilisateur.

export interface BenchmarkMetric {
  label:       string;
  unit:        string;
  your_value:  number;
  median:      number;
  top25:       number;
  description: string;
}

export interface SectorBenchmarks {
  sector_label: string;
  metrics:      BenchmarkMetric[];
}

// Référentiels de marges et ratios pour micro-entreprises / freelances FR
const FREELANCE_BENCHMARKS = {
  ratio_charges_median: 35,  // % charges / CA — médiane micro-entreprise
  ratio_charges_top25:  22,  // % charges / CA — top 25%
  taux_conversion_median: 30, // % devis → facture — médiane
  taux_conversion_top25:  55, // % devis → facture — top 25%
  recouvrement_median: 72,   // % factures payées — médiane
  recouvrement_top25:  90,   // % factures payées — top 25%
};

export function buildBenchmarks(params: {
  ca_current:      number;
  dep_current:     number;
  nb_factures:     number;
  nb_payees:       number;
  devis_total:     number;
  devis_acceptes:  number;
  deltaCA_pct:     number;
}): SectorBenchmarks {
  const ratio_charges    = params.ca_current > 0 ? Math.round((params.dep_current / params.ca_current) * 100) : 0;
  const taux_conversion  = params.devis_total > 0 ? Math.round((params.devis_acceptes / params.devis_total) * 100) : 0;
  const taux_recouvrement = params.nb_factures > 0 ? Math.round((params.nb_payees / params.nb_factures) * 100) : 0;

  return {
    sector_label: "Micro-entreprise / Freelance (France)",
    metrics: [
      {
        label:      "Ratio charges / CA",
        unit:       "%",
        your_value: ratio_charges,
        median:     FREELANCE_BENCHMARKS.ratio_charges_median,
        top25:      FREELANCE_BENCHMARKS.ratio_charges_top25,
        description: "Plus bas = meilleure maîtrise des coûts",
      },
      {
        label:      "Taux de conversion devis",
        unit:       "%",
        your_value: taux_conversion,
        median:     FREELANCE_BENCHMARKS.taux_conversion_median,
        top25:      FREELANCE_BENCHMARKS.taux_conversion_top25,
        description: "% devis transformés en facture",
      },
      {
        label:      "Taux de recouvrement",
        unit:       "%",
        your_value: taux_recouvrement,
        median:     FREELANCE_BENCHMARKS.recouvrement_median,
        top25:      FREELANCE_BENCHMARKS.recouvrement_top25,
        description: "% factures payées vs total émises",
      },
      {
        label:      "Croissance CA",
        unit:       "%",
        your_value: params.deltaCA_pct,
        median:     5,   // croissance annuelle médiane
        top25:      18,  // top 25% micro-entrepreneurs
        description: "Évolution du CA vs période précédente",
      },
    ],
  };
}

// Détermine si la valeur est au-dessus, dans la médiane, ou en dessous
export function benchmarkPosition(
  value: number,
  median: number,
  top25: number,
  lowerIsBetter = false,
): "excellent" | "bon" | "améliorer" {
  if (lowerIsBetter) {
    if (value <= top25)  return "excellent";
    if (value <= median) return "bon";
    return "améliorer";
  }
  if (value >= top25)  return "excellent";
  if (value >= median) return "bon";
  return "améliorer";
}
