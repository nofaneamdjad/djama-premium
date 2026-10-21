import { createSupabaseAdmin } from "@/lib/supabase-server";

export const HQ_PERMS = {
  CUSTOMERS_READ:           "customers.read",
  CUSTOMERS_SUPPORT:        "customers.support_access",
  CUSTOMERS_MANAGE:         "customers.manage",
  SUBSCRIPTIONS_READ:       "subscriptions.read",
  SUBSCRIPTIONS_MANAGE:     "subscriptions.manage",
  FINANCE_READ:             "finance.read",
  FINANCE_MANAGE:           "finance.manage",
  EMPLOYEES_READ:           "employees.read",
  EMPLOYEES_INVITE:         "employees.invite",
  EMPLOYEES_MANAGE:         "employees.manage",
  ROLES_READ:               "roles.read",
  ROLES_MANAGE:             "roles.manage",
  INCIDENTS_READ:           "incidents.read",
  INCIDENTS_MANAGE:         "incidents.manage",
  PLATFORM_SETTINGS_READ:   "platform.settings.read",
  PLATFORM_SETTINGS_MANAGE: "platform.settings.manage",
  PLATFORM_APPS_MANAGE:     "platform.apps.manage",
  AUDIT_LOGS_READ:          "audit_logs.read",
  CRM_READ:                 "crm.read",
  CRM_MANAGE:               "crm.manage",
  SUPPORT_READ:             "support.read",
  SUPPORT_MANAGE:           "support.manage",
  MARKETING_READ:           "marketing.read",
  MARKETING_MANAGE:         "marketing.manage",
  DATA_EXPORT:              "data.export",
} as const;

export type HqPermission = (typeof HQ_PERMS)[keyof typeof HQ_PERMS];

export async function getEmployeePermissions(userId: string): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const { data: emp } = await admin
    .from("hq_employees")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  if (!emp) return [];

  const { data } = await admin
    .from("hq_employee_roles")
    .select("role_id, hq_roles(hq_role_permissions(hq_permissions(slug)))")
    .eq("employee_id", emp.id);

  const slugs = new Set<string>();
  for (const er of data ?? []) {
    const role = (er as any).hq_roles;
    for (const rp of role?.hq_role_permissions ?? []) {
      const slug = rp?.hq_permissions?.slug;
      if (slug) slugs.add(slug);
    }
  }
  return [...slugs];
}

export async function employeeHasPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const perms = await getEmployeePermissions(userId);
  return perms.includes(permission);
}
