/**
 * treasury-sync — Synchronisation bidirectionnelle Factures/Dépenses ↔ Trésorerie
 *
 * Chaque opération utilise supabaseAdmin (service_role) car la synchronisation
 * se fait depuis des routes API serveur. Les index partiels uniques sur
 * document_payment_id et expense_id (migration 073) garantissent qu'aucun
 * doublon ne peut exister — même en cas de retry.
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";

const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  transport:     "transport",
  repas:         "services",
  logiciels:     "logiciels",
  carburant:     "transport",
  hotel:         "services",
  equipement:    "fournisseurs",
  communication: "services",
  formation:     "services",
  publicite:     "marketing",
  fournitures:   "fournisseurs",
  autre:         "autre",
};

function mapExpenseCategory(cat: string): string {
  return EXPENSE_CATEGORY_MAP[cat] ?? "autre";
}

async function getDefaultAccountId(
  admin: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  orgId: string | null,
): Promise<string | null> {
  let query = admin
    .from("treasury_accounts")
    .select("id")
    .eq("is_default", true);

  if (orgId) {
    query = query.eq("organization_id", orgId);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data } = await query.maybeSingle();
  if (data?.id) return data.id;

  // Pas de compte par défaut — prendre le premier disponible
  let fallback = admin.from("treasury_accounts").select("id");
  if (orgId) {
    fallback = fallback.eq("organization_id", orgId);
  } else {
    fallback = fallback.eq("user_id", userId);
  }
  const { data: first } = await fallback.limit(1).maybeSingle();
  return first?.id ?? null;
}

// ─── Factures → Trésorerie ────────────────────────────────────────────────────

export async function syncPaymentToTreasury(params: {
  paymentId: string;
  documentId: string;
  amount: number;
  date: string;
  method: string;
  userId: string;
  orgId: string | null;
}): Promise<void> {
  const { paymentId, documentId, amount, date, method, userId, orgId } = params;
  const admin = createSupabaseAdmin();

  const accountId = await getDefaultAccountId(admin, userId, orgId);
  if (!accountId) return; // Pas de compte trésorerie — on passe

  // Lire le numéro et le client pour construire le libellé
  const { data: doc } = await admin
    .from("documents")
    .select("numero, client_nom")
    .eq("id", documentId)
    .maybeSingle();

  const label = doc
    ? `Paiement ${doc.numero} — ${doc.client_nom ?? "Client"}`
    : "Paiement facture";

  await admin.from("treasury_transactions").upsert(
    {
      user_id:             userId,
      organization_id:     orgId ?? null,
      account_id:          accountId,
      type:                "income",
      status:              "completed",
      amount:              Math.round(amount * 100) / 100,
      date,
      label,
      category:            "client",
      payment_method:      method,
      currency:            "EUR",
      document_payment_id: paymentId,
    },
    { onConflict: "document_payment_id", ignoreDuplicates: false },
  );
}

export async function unsyncPaymentFromTreasury(paymentId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("treasury_transactions")
    .delete()
    .eq("document_payment_id", paymentId);
}

// ─── Dépenses → Trésorerie ────────────────────────────────────────────────────

export async function syncExpenseToTreasury(params: {
  expenseId: string;
  userId: string;
  orgId: string | null;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category: string;
}): Promise<void> {
  const { expenseId, userId, orgId, amount, currency, description, date, category } = params;
  const admin = createSupabaseAdmin();

  const accountId = await getDefaultAccountId(admin, userId, orgId);
  if (!accountId) return;

  await admin.from("treasury_transactions").upsert(
    {
      user_id:         userId,
      organization_id: orgId ?? null,
      account_id:      accountId,
      type:            "expense",
      status:          "completed",
      amount:          Math.round(amount * 100) / 100,
      date,
      label:           description || "Dépense remboursée",
      category:        mapExpenseCategory(category),
      payment_method:  "virement",
      currency:        currency || "EUR",
      expense_id:      expenseId,
    },
    { onConflict: "expense_id", ignoreDuplicates: false },
  );
}

export async function unsyncExpenseFromTreasury(expenseId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("treasury_transactions")
    .delete()
    .eq("expense_id", expenseId);
}
