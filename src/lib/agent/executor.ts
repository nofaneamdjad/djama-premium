import { createSupabaseAdmin } from "@/lib/supabase-server";

type ToolInput = Record<string, unknown>;

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type NavigateIntent = {
  navigate: true;
  url: string;
  label: string;
};

function dateRange(periode: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (periode) {
    case "mois_en_cours": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case "mois_dernier": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case "trimestre_en_cours": {
      const q = Math.floor(m / 3);
      const start = new Date(y, q * 3, 1);
      const end = new Date(y, q * 3 + 3, 0);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case "annee_en_cours":
    default: {
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
  }
}

export async function executeTool(
  name: string,
  input: ToolInput
): Promise<ToolResult | NavigateIntent> {
  const admin = createSupabaseAdmin();

  switch (name) {
    case "lister_factures": {
      const statut = (input.statut as string) || "toutes";
      const limit = Math.min(Number(input.limit) || 10, 20);

      let q = admin
        .from("invoices")
        .select("id, reference, client_name, subject, status, total, payment_status, issue_date, due_date")
        .order("issue_date", { ascending: false })
        .limit(limit);

      if (statut !== "toutes") {
        q = q.eq("status", statut);
      }

      const { data, error } = await q;
      if (error) return { ok: false, error: error.message };

      const total = (data ?? []).reduce((s, f) => s + (f.total ?? 0), 0);
      return {
        ok: true,
        data: {
          count: data?.length ?? 0,
          total_ht: total,
          factures: data ?? [],
        },
      };
    }

    case "lister_clients": {
      const recherche = (input.recherche as string) || "";
      const statut = (input.statut as string) || "tous";
      const limit = Math.min(Number(input.limit) || 10, 20);

      let q = admin
        .from("clients")
        .select("id, name, email, phone, company, status, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (statut !== "tous") {
        q = q.eq("status", statut);
      }

      if (recherche) {
        q = q.or(`name.ilike.%${recherche}%,email.ilike.%${recherche}%,company.ilike.%${recherche}%`);
      }

      const { data, error } = await q;
      if (error) return { ok: false, error: error.message };

      return { ok: true, data: { count: data?.length ?? 0, clients: data ?? [] } };
    }

    case "analyser_revenus": {
      const periode = (input.periode as string) || "mois_en_cours";
      const { start, end } = dateRange(periode);

      const { data, error } = await admin
        .from("invoices")
        .select("total, payment_status, status, issue_date")
        .gte("issue_date", start)
        .lte("issue_date", end);

      if (error) return { ok: false, error: error.message };

      const factures = data ?? [];
      const totalEmis = factures.reduce((s, f) => s + (f.total ?? 0), 0);
      const totalPaye = factures
        .filter((f) => f.payment_status === "payée")
        .reduce((s, f) => s + (f.total ?? 0), 0);
      const totalEnAttente = factures
        .filter((f) => f.payment_status === "non payée" && f.status !== "annulée")
        .reduce((s, f) => s + (f.total ?? 0), 0);
      const nbEnRetard = factures.filter((f) => f.status === "en retard").length;

      return {
        ok: true,
        data: {
          periode,
          du: start,
          au: end,
          nb_factures: factures.length,
          total_emis: totalEmis,
          total_encaisse: totalPaye,
          total_en_attente: totalEnAttente,
          nb_en_retard: nbEnRetard,
          taux_paiement: totalEmis > 0 ? Math.round((totalPaye / totalEmis) * 100) : 0,
        },
      };
    }

    case "lister_devis": {
      const statut = (input.statut as string) || "tous";
      const limit = Math.min(Number(input.limit) || 10, 20);

      let q = admin
        .from("quotes")
        .select("id, reference, client_name, subject, status, total, issue_date, valid_until")
        .order("issue_date", { ascending: false })
        .limit(limit);

      if (statut !== "tous") {
        q = q.eq("status", statut);
      }

      const { data, error } = await q;
      if (error) return { ok: false, error: error.message };

      return { ok: true, data: { count: data?.length ?? 0, devis: data ?? [] } };
    }

    case "creer_facture": {
      const params = new URLSearchParams();
      if (input.client_nom) params.set("client", String(input.client_nom));
      if (input.montant_ht) params.set("montant", String(input.montant_ht));
      if (input.description_service) params.set("desc", String(input.description_service));

      const url = `/client/factures/factures/nouveau${params.toString() ? `?${params}` : ""}`;
      return {
        navigate: true,
        url,
        label: "Créer la facture",
      };
    }

    case "creer_devis": {
      const params = new URLSearchParams();
      if (input.client_nom) params.set("client", String(input.client_nom));
      if (input.montant_ht) params.set("montant", String(input.montant_ht));
      if (input.description_service) params.set("desc", String(input.description_service));

      const url = `/client/factures/devis/nouveau${params.toString() ? `?${params}` : ""}`;
      return {
        navigate: true,
        url,
        label: "Créer le devis",
      };
    }

    case "obtenir_stats_dashboard": {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const startMois = new Date(y, m, 1).toISOString().slice(0, 10);
      const endMois = new Date(y, m + 1, 0).toISOString().slice(0, 10);

      const [invoicesRes, quotesRes, clientsRes] = await Promise.all([
        admin
          .from("invoices")
          .select("total, payment_status, status, issue_date")
          .gte("issue_date", startMois)
          .lte("issue_date", endMois),
        admin
          .from("quotes")
          .select("total, status")
          .neq("status", "refusé")
          .neq("status", "expiré"),
        admin.from("clients").select("id, status"),
      ]);

      const factures = invoicesRes.data ?? [];
      const revenuMois = factures
        .filter((f) => f.payment_status === "payée")
        .reduce((s, f) => s + (f.total ?? 0), 0);
      const facturesEnAttente = factures.filter(
        (f) => f.payment_status === "non payée" && f.status !== "annulée"
      );
      const totalEnAttente = facturesEnAttente.reduce((s, f) => s + (f.total ?? 0), 0);

      const devisActifs = (quotesRes.data ?? []).filter(
        (d) => d.status === "envoyé" || d.status === "brouillon"
      );
      const totalDevisActifs = devisActifs.reduce((s, d) => s + (d.total ?? 0), 0);

      const clients = clientsRes.data ?? [];
      const nbClientsActifs = clients.filter((c) => c.status === "actif").length;

      return {
        ok: true,
        data: {
          revenu_mois_encaisse: revenuMois,
          factures_en_attente: { count: facturesEnAttente.length, total: totalEnAttente },
          devis_actifs: { count: devisActifs.length, total: totalDevisActifs },
          nb_clients_actifs: nbClientsActifs,
        },
      };
    }

    default:
      return { ok: false, error: `Outil inconnu : ${name}` };
  }
}
