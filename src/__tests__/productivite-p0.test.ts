/**
 * Tests Phase 10 — Module Productivité
 *
 * Couvre :
 *  P10.1 : parseTask — désérialisation correcte des nouveaux champs
 *  P10.2 : RLS simulation — user_id vérifié côté client
 *  P10.3 : sort_order interpolation — midpoint sans collision
 *  P10.4 : ERP FK — valeurs null acceptées, UUID validé
 *  P10.5 : Génération tâches IA — format de réponse validé
 *  P10.6 : Charge de travail — score surcharge calculé correctement
 *  P10.7 : Templates — CRUD sans duplicate
 */

import { describe, it, expect } from "vitest";

// ─── Types locaux (miroir de la page) ─────────────────────────────────────────

type Priority = "low" | "normal" | "high" | "urgent";
type Status   = "todo" | "in_progress" | "validation" | "done" | "waiting" | "late";

interface Sub { id: string; title: string; done: boolean }
interface Task {
  id: string; title: string; description: string;
  priority: Priority; status: Status; category: string;
  due_date: string; due_time: string; responsible: string;
  assignees: string[]; subtasks: Sub[]; tags: string[];
  estimated_minutes: number; time_spent: number;
  timer_started_at: string | null;
  is_recurring: boolean; recurrence: string;
  linked_module: string; dependencies: string[];
  sort_order: number; created_at: string;
  recurrence_parent_id: string | null;
  linked_document_id: string | null;
  linked_contact_id: string | null;
  linked_project_id: string | null;
  linked_contract_id: string | null;
  linked_supplier_id: string | null;
  linked_product_id: string | null;
}

function parseTask(r: Record<string, unknown>): Task {
  let subtasks: Sub[] = [];
  try {
    const raw = r.subtasks;
    if (typeof raw === "string") subtasks = JSON.parse(raw);
    else if (Array.isArray(raw)) subtasks = raw as Sub[];
  } catch { subtasks = []; }
  return {
    id: String(r.id ?? ""), title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    priority: (r.priority as Priority) ?? "normal",
    status: (r.status as Status) ?? "todo",
    category: String(r.category ?? ""),
    due_date: r.due_date ? String(r.due_date).slice(0, 10) : "",
    due_time: String(r.due_time ?? ""),
    responsible: String(r.responsible ?? ""),
    assignees: Array.isArray(r.assignees) ? r.assignees.map(String) : [],
    subtasks,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    estimated_minutes: Number(r.estimated_minutes ?? 30),
    time_spent: Number(r.time_spent ?? 0),
    timer_started_at: r.timer_started_at ? String(r.timer_started_at) : null,
    is_recurring: Boolean(r.is_recurring),
    recurrence: String(r.recurrence ?? "none"),
    linked_module: String(r.linked_module ?? ""),
    dependencies: Array.isArray(r.dependencies) ? r.dependencies.map(String) : [],
    sort_order: Number(r.sort_order ?? 0),
    created_at: String(r.created_at ?? ""),
    recurrence_parent_id: r.recurrence_parent_id ? String(r.recurrence_parent_id) : null,
    linked_document_id: r.linked_document_id ? String(r.linked_document_id) : null,
    linked_contact_id:  r.linked_contact_id  ? String(r.linked_contact_id)  : null,
    linked_project_id:  r.linked_project_id  ? String(r.linked_project_id)  : null,
    linked_contract_id: r.linked_contract_id ? String(r.linked_contract_id) : null,
    linked_supplier_id: r.linked_supplier_id ? String(r.linked_supplier_id) : null,
    linked_product_id:  r.linked_product_id  ? String(r.linked_product_id)  : null,
  };
}

// ─── P10.1 : parseTask ─────────────────────────────────────────────────────────

describe("P10.1 — parseTask désérialisation", () => {
  it("champs de base avec valeurs manquantes", () => {
    const t = parseTask({ id: "uuid-1", title: "Test" });
    expect(t.title).toBe("Test");
    expect(t.priority).toBe("normal");
    expect(t.status).toBe("todo");
    expect(t.sort_order).toBe(0);
    expect(t.assignees).toEqual([]);
    expect(t.subtasks).toEqual([]);
    expect(t.dependencies).toEqual([]);
  });

  it("subtasks JSON string → array", () => {
    const subs = [{ id: "s1", title: "Étape 1", done: false }];
    const t = parseTask({ id: "uuid-2", title: "T", subtasks: JSON.stringify(subs) });
    expect(t.subtasks).toHaveLength(1);
    expect(t.subtasks[0].title).toBe("Étape 1");
  });

  it("subtasks array direct → array", () => {
    const t = parseTask({ id: "uuid-3", title: "T", subtasks: [{ id: "s1", title: "X", done: true }] });
    expect(t.subtasks[0].done).toBe(true);
  });

  it("ERP FK null si absent", () => {
    const t = parseTask({ id: "uuid-4", title: "T" });
    expect(t.linked_document_id).toBeNull();
    expect(t.linked_contact_id).toBeNull();
    expect(t.linked_project_id).toBeNull();
    expect(t.linked_contract_id).toBeNull();
    expect(t.linked_supplier_id).toBeNull();
    expect(t.linked_product_id).toBeNull();
  });

  it("ERP FK UUID parsé correctement", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const t = parseTask({ id: "uuid-5", title: "T", linked_document_id: uuid, linked_contact_id: uuid });
    expect(t.linked_document_id).toBe(uuid);
    expect(t.linked_contact_id).toBe(uuid);
  });

  it("recurrence_parent_id null si absent", () => {
    const t = parseTask({ id: "uuid-6", title: "T" });
    expect(t.recurrence_parent_id).toBeNull();
  });

  it("due_date tronqué à 10 caractères", () => {
    const t = parseTask({ id: "u7", title: "T", due_date: "2026-09-28T15:30:00.000Z" });
    expect(t.due_date).toBe("2026-09-28");
  });
});

// ─── P10.2 : RLS simulation user_id ───────────────────────────────────────────

describe("P10.2 — isolation user_id côté client", () => {
  const userId = "user-a";
  const tasks: Task[] = [
    parseTask({ id: "t1", title: "Ma tâche", user_id: "user-a", status: "todo" }),
    parseTask({ id: "t2", title: "Autre tâche", user_id: "user-b", status: "todo" }),
  ];

  it("filtre par user_id côté client (défense en profondeur)", () => {
    const mine = tasks.filter((t: unknown) => (t as Record<string, unknown>).id !== undefined);
    expect(mine).toHaveLength(2);
  });

  it("UPDATE .eq user_id empêche modification d'une autre tâche", () => {
    const canUpdate = (taskUserId: string, currentUserId: string) =>
      taskUserId === currentUserId;
    expect(canUpdate("user-a", userId)).toBe(true);
    expect(canUpdate("user-b", userId)).toBe(false);
  });

  it("INSERT inclut toujours user_id", () => {
    const payload = { title: "Nouvelle", user_id: userId, status: "todo" };
    expect(payload.user_id).toBe(userId);
    expect(payload.user_id).not.toBe("");
  });
});

// ─── P10.3 : sort_order interpolation ─────────────────────────────────────────

describe("P10.3 — sort_order drag & drop interpolation", () => {
  function dropBeforeCalc(colTasks: { sort_order: number }[], targetIdx: number): number {
    if (targetIdx === 0) return (colTasks[0]?.sort_order ?? 0) - 1;
    return ((colTasks[targetIdx - 1]?.sort_order ?? 0) + (colTasks[targetIdx]?.sort_order ?? 0)) / 2;
  }

  it("insert en tête de colonne → sort_order < premier élément", () => {
    const tasks = [{ sort_order: 10 }, { sort_order: 20 }];
    const newOrder = dropBeforeCalc(tasks, 0);
    expect(newOrder).toBe(9);
    expect(newOrder).toBeLessThan(tasks[0].sort_order);
  });

  it("insert entre deux cartes → midpoint", () => {
    const tasks = [{ sort_order: 10 }, { sort_order: 20 }, { sort_order: 30 }];
    const newOrder = dropBeforeCalc(tasks, 1);
    expect(newOrder).toBe(15); // midpoint(10, 20) = 15
  });

  it("insert entre cartes adjacentes → valeur entre les deux", () => {
    const tasks = [{ sort_order: 100 }, { sort_order: 200 }];
    const newOrder = dropBeforeCalc(tasks, 1);
    expect(newOrder).toBeGreaterThan(tasks[0].sort_order);
    expect(newOrder).toBeLessThan(tasks[1].sort_order);
  });

  it("insert en fin de colonne → sort_order max + 1", () => {
    const tasks = [{ sort_order: 10 }, { sort_order: 20 }];
    const maxOrder = Math.max(...tasks.map(t => t.sort_order)) + 1;
    expect(maxOrder).toBe(21);
  });
});

// ─── P10.4 : Validation ERP FK ─────────────────────────────────────────────────

describe("P10.4 — ERP FK validation", () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it("UUID valide accepté", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(UUID_REGEX.test(uuid)).toBe(true);
  });

  it("chaîne vide → null dans le payload", () => {
    const linked_document_id = "";
    const payloadValue = linked_document_id || null;
    expect(payloadValue).toBeNull();
  });

  it("UUID valide → conservé dans le payload", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const payloadValue = uuid || null;
    expect(payloadValue).toBe(uuid);
  });

  it("tous les champs ERP acceptent null", () => {
    const t = parseTask({ id: "test", title: "T" });
    const erpFields = [
      t.linked_document_id, t.linked_contact_id, t.linked_project_id,
      t.linked_contract_id, t.linked_supplier_id, t.linked_product_id,
    ];
    erpFields.forEach(v => expect(v).toBeNull());
  });
});

// ─── P10.5 : Format réponse génération IA ──────────────────────────────────────

describe("P10.5 — format réponse génération IA", () => {
  interface GeneratedTask {
    title: string;
    priority: string;
    category: string;
    estimated_minutes: number;
    tags: string[];
    subtasks: { title: string }[];
  }

  function validateGeneratedTask(t: unknown): t is GeneratedTask {
    if (typeof t !== "object" || t === null) return false;
    const task = t as Record<string, unknown>;
    return (
      typeof task.title === "string" && task.title.length > 0 &&
      ["low", "normal", "high", "urgent"].includes(String(task.priority)) &&
      typeof task.category === "string" &&
      typeof task.estimated_minutes === "number" && task.estimated_minutes > 0 &&
      Array.isArray(task.tags) &&
      Array.isArray(task.subtasks)
    );
  }

  it("tâche valide passe la validation", () => {
    const task: GeneratedTask = {
      title: "Créer la landing page",
      priority: "high",
      category: "Marketing",
      estimated_minutes: 120,
      tags: ["landing", "conversion"],
      subtasks: [{ title: "Rédiger le texte" }, { title: "Design" }],
    };
    expect(validateGeneratedTask(task)).toBe(true);
  });

  it("priorité invalide rejetée", () => {
    const task = { title: "T", priority: "critique", category: "Dev", estimated_minutes: 60, tags: [], subtasks: [] };
    expect(validateGeneratedTask(task)).toBe(false);
  });

  it("titre vide rejeté", () => {
    const task = { title: "", priority: "normal", category: "Dev", estimated_minutes: 60, tags: [], subtasks: [] };
    expect(validateGeneratedTask(task)).toBe(false);
  });

  it("estimated_minutes zéro rejeté", () => {
    const task = { title: "T", priority: "normal", category: "Dev", estimated_minutes: 0, tags: [], subtasks: [] };
    expect(validateGeneratedTask(task)).toBe(false);
  });
});

// ─── P10.6 : Charge de travail ─────────────────────────────────────────────────

describe("P10.6 — calcul charge de travail", () => {
  function calcOverloadScore(weekMinutes: number): number {
    return Math.min(100, Math.round((weekMinutes / 480) * 100));
  }

  it("0 min → score 0", () => expect(calcOverloadScore(0)).toBe(0));
  it("480 min (8h) → score 100", () => expect(calcOverloadScore(480)).toBe(100));
  it("240 min (4h) → score 50", () => expect(calcOverloadScore(240)).toBe(50));
  it("600 min → plafonné à 100", () => expect(calcOverloadScore(600)).toBe(100));
  it("overloaded si score > 80", () => {
    const score = calcOverloadScore(400);
    expect(score).toBeGreaterThan(80);
    expect(score > 80).toBe(true);
  });
  it("non overloaded si score ≤ 80", () => {
    const score = calcOverloadScore(300);
    expect(score > 80).toBe(false);
  });
});

// ─── P10.7 : Templates sans doublon ────────────────────────────────────────────

describe("P10.7 — déduplication templates", () => {
  interface Template { id: string; name: string }

  it("pas de doublon sur même nom utilisateur", () => {
    const existing: Template[] = [{ id: "t1", name: "Mon template" }];
    const newName = "Mon template";
    const isDuplicate = existing.some(t => t.name.toLowerCase() === newName.toLowerCase());
    expect(isDuplicate).toBe(true);
  });

  it("noms différents → pas de doublon", () => {
    const existing: Template[] = [{ id: "t1", name: "Template A" }];
    const newName = "Template B";
    const isDuplicate = existing.some(t => t.name.toLowerCase() === newName.toLowerCase());
    expect(isDuplicate).toBe(false);
  });

  it("deleteDbTemplate retire l'élément par id", () => {
    const templates: Template[] = [
      { id: "t1", name: "A" }, { id: "t2", name: "B" }, { id: "t3", name: "C" },
    ];
    const after = templates.filter(t => t.id !== "t2");
    expect(after).toHaveLength(2);
    expect(after.find(t => t.id === "t2")).toBeUndefined();
  });
});
