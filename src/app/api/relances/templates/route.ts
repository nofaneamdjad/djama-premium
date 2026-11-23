/**
 * GET    /api/relances/templates   → liste des modèles (défauts système + user)
 * POST   /api/relances/templates   → créer un modèle
 * PUT    /api/relances/templates   → mettre à jour un modèle (body: { id, ...fields })
 * DELETE /api/relances/templates   → supprimer un modèle (body: { id })
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

// Modèles système par défaut (seed)
const SYSTEM_TEMPLATES = [
  {
    level: "rappel",
    name: "Rappel courtois",
    subject: "Rappel — Facture {{numero}} — {{montant}}",
    body: `Bonjour {{client_nom}},

Nous vous contactons concernant la facture {{numero}} d'un montant de {{montant}}, dont l'échéance était prévue le {{date_echeance}}.

Peut-être s'agit-il d'un simple oubli ou d'un croisement de courriers. Si tel est le cas, nous vous invitons à procéder au règlement dans les prochains jours.

Si vous avez déjà effectué ce paiement, merci de ne pas tenir compte de ce message.

Nous restons bien entendu disponibles pour toute question.

Cordialement,
{{entreprise_nom}}
{{entreprise_email}}`,
  },
  {
    level: "amical",
    name: "Relance amicale",
    subject: "Relance — Facture {{numero}} en attente de règlement",
    body: `Bonjour {{client_nom}},

Nous revenons vers vous au sujet de la facture {{numero}} d'un montant de {{montant}}, qui reste impayée depuis le {{date_echeance}}.

Nous espérons que tout se passe bien de votre côté. Dans le cas où vous rencontriez des difficultés, nous sommes ouverts à trouver un arrangement à l'amiable.

Pouvez-vous nous confirmer la date à laquelle nous pouvons attendre le règlement ?

Merci de votre retour et bonne continuation,
{{entreprise_nom}}
{{entreprise_email}}`,
  },
  {
    level: "professionnel",
    name: "Relance professionnelle",
    subject: "Relance — Facture {{numero}} — Règlement attendu",
    body: `Bonjour {{client_nom}},

Malgré notre précédent message, nous constatons que la facture {{numero}} d'un montant de {{montant}}, échue le {{date_echeance}}, n'a toujours pas été réglée.

Nous vous demandons de bien vouloir procéder au paiement dans les meilleurs délais, ou de nous contacter afin d'envisager les modalités de règlement adaptées à votre situation.

Dans l'attente de votre retour,

Cordialement,
{{entreprise_nom}}
{{entreprise_email}}`,
  },
  {
    level: "ferme",
    name: "Relance ferme",
    subject: "URGENT — Facture {{numero}} impayée — Action requise",
    body: `Bonjour {{client_nom}},

Nous nous permettons de vous relancer une nouvelle fois concernant la facture {{numero}} d'un montant de {{montant}}, dont l'échéance est dépassée depuis maintenant {{jours_retard}} jours.

Malgré nos relances précédentes, ce paiement reste en attente. Nous vous demandons donc de régulariser votre situation dans un délai de 7 jours.

À défaut de règlement ou de réponse de votre part, nous nous verrons dans l'obligation d'envisager d'autres recours.

Veuillez nous contacter dès que possible.

{{entreprise_nom}}
{{entreprise_email}}`,
  },
  {
    level: "dernier",
    name: "Dernier rappel",
    subject: "DERNIER RAPPEL — Facture {{numero}} — Mise en recouvrement imminente",
    body: `Bonjour {{client_nom}},

Il s'agit de notre dernier rappel concernant la facture {{numero}} d'un montant de {{montant}}, impayée depuis {{jours_retard}} jours.

Nous avons tenté de vous contacter à plusieurs reprises sans succès. Si ce paiement n'est pas effectué dans les 48 heures, nous nous verrons contraints de transmettre ce dossier à notre service de recouvrement.

Cette démarche engendrerait des frais supplémentaires à votre charge.

Nous espérons pouvoir résoudre cette situation à l'amiable.

{{entreprise_nom}}
{{entreprise_email}}`,
  },
  {
    level: "mise_en_demeure",
    name: "Mise en demeure (à valider)",
    subject: "Mise en demeure — Facture {{numero}}",
    body: `Madame, Monsieur,

Par la présente, et conformément aux dispositions légales en vigueur, nous vous mettons en demeure de nous régler la somme de {{montant}} correspondant à la facture {{numero}}, émise le {{date_emission}} et dont l'échéance était fixée au {{date_echeance}}.

Ce document constitue une mise en demeure formelle. À défaut de règlement intégral dans un délai de 15 jours à compter de la réception du présent courrier, nous nous réservons le droit d'engager toute procédure judiciaire de recouvrement.

Nous vous rappelons que les frais de procédure seraient alors à votre charge.

{{entreprise_nom}}
{{entreprise_adresse}}
{{entreprise_email}}

AVERTISSEMENT : Ce modèle est fourni à titre indicatif. Sa valeur juridique dépend de la législation applicable dans votre pays. Consultez un professionnel du droit avant tout envoi.`,
  },
];

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Essayer de récupérer les modèles depuis la BDD
  const { data, error } = await admin
    .from("relance_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Si la table n'existe pas encore, retourner les modèles système par défaut
  if (error) {
    return NextResponse.json({
      templates: SYSTEM_TEMPLATES.map((t, i) => ({
        id: `system-${i}`,
        ...t,
        is_system: true,
        is_default: true,
        user_id: user.id,
      })),
      fallback: true,
    });
  }

  // Si vide, retourner les modèles système
  if (!data || data.length === 0) {
    return NextResponse.json({
      templates: SYSTEM_TEMPLATES.map((t, i) => ({
        id: `system-${i}`,
        ...t,
        is_system: true,
        is_default: true,
        user_id: user.id,
      })),
    });
  }

  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { level: string; name: string; subject: string; body: string };
  if (!body.level || !body.subject || !body.body) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("relance_templates")
    .upsert({
      user_id:  user.id,
      level:    body.level,
      name:     body.name ?? body.level,
      subject:  body.subject,
      body:     body.body,
      is_system: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,level" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id: string; name?: string; subject?: string; body?: string };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  if (body.id.startsWith("system-")) {
    return NextResponse.json({ error: "Impossible de modifier un modèle système" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("relance_templates")
    .update({
      ...(body.name    && { name:    body.name }),
      ...(body.subject && { subject: body.subject }),
      ...(body.body    && { body:    body.body }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id: string };
  if (!body.id || body.id.startsWith("system-")) {
    return NextResponse.json({ error: "Modèle non supprimable" }, { status: 400 });
  }

  const { error } = await admin
    .from("relance_templates")
    .delete()
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
