import type Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type IntegrationType = "crm" | "rdv" | "boutique" | "factures";

export interface IntegrationMeta {
  type:        IntegrationType;
  label:       string;
  description: string;
  icon:        string;
  tools:       string[];
}

export const INTEGRATION_META: IntegrationMeta[] = [
  {
    type:        "crm",
    label:       "CRM — Contacts",
    description: "Permet au chatbot de rechercher des contacts et clients dans votre CRM.",
    icon:        "users",
    tools:       ["search_contacts"],
  },
  {
    type:        "rdv",
    label:       "Rendez-vous",
    description: "Affiche les disponibilités et permet de prendre un rendez-vous directement depuis le chat.",
    icon:        "calendar",
    tools:       ["get_booking_info", "get_available_slots", "book_appointment"],
  },
  {
    type:        "boutique",
    label:       "Catalogue produits",
    description: "Permet au chatbot de présenter vos produits et services avec leurs prix réels.",
    icon:        "shopping-bag",
    tools:       ["search_products"],
  },
  {
    type:        "factures",
    label:       "Factures",
    description: "Permet au chatbot de renseigner un client sur l'état de sa facture par sa référence.",
    icon:        "file-text",
    tools:       ["get_invoice"],
  },
];

// ── Définitions Anthropic par outil ───────────────────────────────────────────

const ALL_TOOLS: Record<string, Anthropic.Tool> = {
  search_contacts: {
    name:        "search_contacts",
    description: "Recherche des contacts/clients dans le CRM par nom, email ou téléphone.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nom, email ou téléphone à rechercher" },
      },
      required: ["query"],
    },
  },
  get_booking_info: {
    name:        "get_booking_info",
    description: "Récupère les pages de réservation actives avec leurs services, durées et horaires.",
    input_schema: { type: "object", properties: {} },
  },
  get_available_slots: {
    name:        "get_available_slots",
    description: "Retourne les créneaux disponibles pour une date et une page de réservation données.",
    input_schema: {
      type: "object",
      properties: {
        booking_page_id: { type: "string", description: "ID de la page de réservation" },
        date:            { type: "string", description: "Date au format YYYY-MM-DD" },
      },
      required: ["booking_page_id", "date"],
    },
  },
  book_appointment: {
    name:        "book_appointment",
    description: "Crée un rendez-vous confirmé. N'utiliser qu'avec l'accord explicite du visiteur.",
    input_schema: {
      type: "object",
      properties: {
        booking_page_id: { type: "string" },
        date:            { type: "string", description: "YYYY-MM-DD" },
        start_time:      { type: "string", description: "HH:MM" },
        client_name:     { type: "string" },
        client_email:    { type: "string" },
        client_message:  { type: "string" },
      },
      required: ["booking_page_id", "date", "start_time", "client_name", "client_email"],
    },
  },
  search_products: {
    name:        "search_products",
    description: "Recherche des produits/services dans le catalogue avec leurs prix réels (ne jamais inventer de prix).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nom ou description du produit/service" },
      },
      required: ["query"],
    },
  },
  get_invoice: {
    name:        "get_invoice",
    description: "Récupère les informations d'une facture par sa référence exacte.",
    input_schema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Référence de la facture (ex: FAC-2024-001)" },
      },
      required: ["reference"],
    },
  },
};

// ── Charger les outils activés pour un chatbot ────────────────────────────────

export async function getEnabledTools(chatbotId: string): Promise<Anthropic.Tool[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("chatbot_integrations")
    .select("type")
    .eq("chatbot_id", chatbotId)
    .eq("enabled", true);

  if (!data?.length) return [];

  const toolNames = new Set(
    data.flatMap(row => {
      const meta = INTEGRATION_META.find(m => m.type === row.type);
      return meta?.tools ?? [];
    }),
  );

  return Array.from(toolNames)
    .map(n => ALL_TOOLS[n])
    .filter(Boolean) as Anthropic.Tool[];
}

// ── Exécution d'un outil ──────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  chatbotUserId: string,
): Promise<string> {
  const admin = createSupabaseAdmin();

  switch (toolName) {
    // ── CRM ──────────────────────────────────────────────────────────────────
    case "search_contacts": {
      const q = String(toolInput.query ?? "").trim();
      if (!q) return "Requête vide.";
      const { data } = await admin
        .from("contacts")
        .select("name, email, phone, company, status")
        .eq("user_id", chatbotUserId)
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(5);
      if (!data?.length) return "Aucun contact trouvé.";
      return data.map(c =>
        `• ${c.name}${c.company ? ` (${c.company})` : ""} — ${c.email ?? "—"}${c.phone ? ` / ${c.phone}` : ""} — Statut : ${c.status}`,
      ).join("\n");
    }

    // ── RDV — info ────────────────────────────────────────────────────────────
    case "get_booking_info": {
      const { data } = await admin
        .from("booking_pages")
        .select("id, title, description, duration_minutes, available_days, start_hour, end_hour")
        .eq("user_id", chatbotUserId)
        .eq("is_active", true)
        .limit(5);
      if (!data?.length) return "Aucune page de réservation active.";
      const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      return data.map(p =>
        `Service : ${p.title}${p.description ? `\n${p.description}` : ""}\nID : ${p.id}\nDurée : ${p.duration_minutes} min\nJours : ${(p.available_days as number[]).map(d => DAYS[d]).join(", ")}\nHoraires : ${p.start_hour}h–${p.end_hour}h`,
      ).join("\n\n");
    }

    // ── RDV — créneaux ────────────────────────────────────────────────────────
    case "get_available_slots": {
      const bookingPageId = String(toolInput.booking_page_id ?? "");
      const date          = String(toolInput.date ?? "");
      const { data: page } = await admin
        .from("booking_pages")
        .select("duration_minutes, start_hour, end_hour, available_days")
        .eq("id", bookingPageId)
        .eq("user_id", chatbotUserId)
        .single();
      if (!page) return "Page de réservation introuvable.";

      const dayOfWeek = new Date(date).getDay();
      if (!(page.available_days as number[]).includes(dayOfWeek)) {
        return `Aucune disponibilité le ${date} (jour non travaillé).`;
      }

      const { data: booked } = await admin
        .from("booking_appointments")
        .select("start_time")
        .eq("booking_page_id", bookingPageId)
        .eq("date", date)
        .eq("status", "confirmed");

      const bookedSet = new Set((booked ?? []).map(a => (a.start_time as string).slice(0, 5)));
      const slots: string[] = [];
      const dur = page.duration_minutes as number;

      for (let h = (page.start_hour as unknown as number); h < (page.end_hour as unknown as number); h++) {
        for (let m = 0; m < 60; m += dur) {
          const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (!bookedSet.has(time)) slots.push(time);
        }
      }
      if (!slots.length) return `Aucun créneau disponible le ${date}.`;
      return `Créneaux disponibles le ${date} :\n${slots.join(", ")}`;
    }

    // ── RDV — réservation ─────────────────────────────────────────────────────
    case "book_appointment": {
      const bpid   = String(toolInput.booking_page_id ?? "");
      const date   = String(toolInput.date ?? "");
      const stime  = String(toolInput.start_time ?? "");
      const cname  = String(toolInput.client_name ?? "");
      const cemail = String(toolInput.client_email ?? "");
      const cmsg   = String(toolInput.client_message ?? "");

      const { data: page } = await admin
        .from("booking_pages")
        .select("duration_minutes")
        .eq("id", bpid)
        .eq("user_id", chatbotUserId)
        .single();
      if (!page) return "Page de réservation introuvable.";

      const [h, m]   = stime.split(":").map(Number);
      const endMin   = h * 60 + m + (page.duration_minutes as number);
      const end_time = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

      const { data: appt, error } = await admin
        .from("booking_appointments")
        .insert({
          booking_page_id: bpid,
          user_id:         chatbotUserId,
          date,
          start_time:      stime,
          end_time,
          client_name:     cname,
          client_email:    cemail,
          client_message:  cmsg,
          status:          "confirmed",
        })
        .select("id")
        .single();

      if (error) return `Erreur lors de la réservation : ${error.message}`;
      const ref = (appt.id as string).slice(0, 8).toUpperCase();
      return `✅ Rendez-vous confirmé !\nDate : ${date} à ${stime}\nNom : ${cname}\nEmail : ${cemail}\nRéférence : #${ref}`;
    }

    // ── Boutique / Catalogue ──────────────────────────────────────────────────
    case "search_products": {
      const q = String(toolInput.query ?? "").trim();
      const { data } = await admin
        .from("catalog_items")
        .select("description, unit, unit_price, vat_rate")
        .eq("user_id", chatbotUserId)
        .ilike("description", `%${q}%`)
        .limit(8);
      if (!data?.length) return "Aucun produit ou service trouvé.";
      return data.map(p =>
        `• ${p.description}${p.unit ? ` (${p.unit})` : ""} — ${p.unit_price} € HT (TVA ${p.vat_rate}%)`,
      ).join("\n");
    }

    // ── Factures ──────────────────────────────────────────────────────────────
    case "get_invoice": {
      const ref = String(toolInput.reference ?? "").trim();
      const { data } = await admin
        .from("invoices")
        .select("reference, client_name, subject, status, total, due_date, payment_status")
        .eq("user_id", chatbotUserId)
        .eq("reference", ref)
        .single();
      if (!data) return `Aucune facture trouvée avec la référence « ${ref} ».`;
      return [
        `Facture ${data.reference}`,
        `Client : ${data.client_name}`,
        `Objet : ${data.subject}`,
        `Montant TTC : ${data.total} €`,
        `Statut : ${data.status} — Paiement : ${data.payment_status}`,
        data.due_date ? `Échéance : ${data.due_date}` : "",
      ].filter(Boolean).join("\n");
    }

    default:
      return "Outil inconnu.";
  }
}
