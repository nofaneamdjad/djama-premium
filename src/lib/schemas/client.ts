/**
 * Schemas de validation Zod — Espace client DJAMA
 *
 * Centralise la validation de tous les formulaires critiques.
 * Compatible Zod v4.
 */

import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────────
const optionalStr = z.string().optional().or(z.literal(""));
const isoDate     = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)");
const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Format date/heure invalide");
const hhmm        = z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis");
const positiveNum = z.coerce.number().min(0, "Doit être positif");

// ── CRM ────────────────────────────────────────────────────────────────────────
export const ContactSchema = z.object({
  name:            z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email:           z.string().email("Email invalide").or(z.literal("")).optional(),
  phone:           optionalStr,
  company:         z.string().max(100, "Trop long").optional().or(z.literal("")),
  status:          z.enum(["prospect", "actif", "inactif", "perdu"]),
  type:            z.enum(["prospect", "client", "partenaire", "fournisseur"]),
  budget:          positiveNum.optional(),
  interest_level:  z.coerce.number().min(0).max(10).optional(),
  city:            optionalStr,
  country:         optionalStr,
  source:          optionalStr,
  notes:           optionalStr,
});

export const OpportunitySchema = z.object({
  title:       z.string().min(1, "Titre requis"),
  amount:      positiveNum,
  probability: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
  stage:       z.enum(["nouveau", "qualifié", "proposition", "négociation", "gagné", "perdu"]),
  close_date:  isoDate.optional().or(z.literal("")).or(z.null()),
  notes:       optionalStr,
});

export const TaskCrmSchema = z.object({
  title:    z.string().min(1, "Titre requis"),
  due_date: isoDate.optional().or(z.literal("")).or(z.null()),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  type:     z.string().optional(),
  notes:    optionalStr,
});

// ── Planning ───────────────────────────────────────────────────────────────────
export const EventSchema = z.object({
  title:      z.string().min(1, "Titre requis"),
  start_at:   isoDateTime,
  end_at:     isoDateTime,
  event_type: z.enum(["event", "meeting", "task", "reminder"]).optional(),
  location:   optionalStr,
  notes:      optionalStr,
  color:      optionalStr,
}).refine(
  d => new Date(d.start_at) < new Date(d.end_at),
  { message: "La fin doit être après le début", path: ["end_at"] },
);

// ── Planification (shifts) ─────────────────────────────────────────────────────
export const ShiftSchema = z.object({
  title:       z.string().min(1, "Titre requis"),
  date:        isoDate,
  start_time:  hhmm,
  end_time:    hhmm,
  type:        z.string().default("task"),
  employee_id: z.string().optional().or(z.null()),
  notes:       optionalStr,
}).refine(
  d => d.start_time < d.end_time,
  { message: "L'heure de fin doit être après l'heure de début", path: ["end_time"] },
);

export const EmployeeSchema = z.object({
  name:       z.string().min(2, "Nom requis"),
  email:      z.string().email("Email invalide").or(z.literal("")).optional(),
  role:       z.string().min(1, "Rôle requis"),
  department: optionalStr,
  phone:      optionalStr,
});

// ── Contrats ───────────────────────────────────────────────────────────────────
export const ContractDraftSchema = z.object({
  title:        z.string().min(3, "Titre trop court (min 3 caractères)"),
  client_name:  z.string().min(2, "Nom client requis"),
  client_email: z.string().email("Email invalide").or(z.literal("")).optional(),
  amount:       z.coerce.number().min(0, "Montant invalide").optional(),
  start_date:   isoDate.optional().or(z.literal("")).or(z.null()),
  end_date:     isoDate.optional().or(z.literal("")).or(z.null()),
  type:         z.string().optional(),
});

// ── Factures ───────────────────────────────────────────────────────────────────
export const InvoiceClientSchema = z.object({
  client_nom:    z.string().min(1, "Nom client requis"),
  client_email:  z.string().email("Email invalide").or(z.literal("")).optional(),
  client_adresse: optionalStr,
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity:    z.coerce.number().min(0.01, "Quantité invalide"),
  unit_price:  z.coerce.number().min(0, "Prix invalide"),
  vat_rate:    z.coerce.number().min(0).max(100),
});

// ── Stocks ─────────────────────────────────────────────────────────────────────
export const ProductSchema = z.object({
  name:         z.string().min(1, "Nom requis"),
  sku:          optionalStr,
  category:     z.string().optional(),
  quantity:     z.coerce.number().min(0),
  min_quantity: z.coerce.number().min(0),
  price_buy:    positiveNum.optional(),
  price_sell:   positiveNum.optional(),
  unit:         optionalStr,
});

// ── Dépenses ───────────────────────────────────────────────────────────────────
export const ExpenseSchema = z.object({
  libelle:      z.string().min(1, "Libellé requis"),
  montant:      z.coerce.number().min(0.01, "Montant invalide"),
  categorie:    z.string().min(1, "Catégorie requise"),
  date_depense: isoDate,
  methode:      z.string().optional(),
  notes:        optionalStr,
});

// ── Équipe ─────────────────────────────────────────────────────────────────────
export const TeamMemberSchema = z.object({
  name:       z.string().min(2, "Nom requis"),
  email:      z.string().email("Email invalide").or(z.literal("")).optional(),
  role:       z.enum(["admin", "manager", "employee", "accountant", "extern"]),
  department: optionalStr,
  position:   optionalStr,
  phone:      optionalStr,
});

// ── Helpers de validation ──────────────────────────────────────────────────────
/**
 * Valide un objet avec un schema Zod et retourne un Record d'erreurs.
 * Usage : const errors = validate(ContactSchema, formData)
 *         if (errors) { setErrors(errors); return; }
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Record<string, string> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  const errs: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const key = issue.path[0] as string;
    if (key && !errs[key]) errs[key] = issue.message;
  });
  return errs;
}
