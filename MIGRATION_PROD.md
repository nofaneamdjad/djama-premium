# MIGRATION_PROD.md — V1.7-SECU Hotfix

Checklist de déploiement en production. À suivre dans l'ordre.
**Aucune de ces étapes ne sera effectuée automatiquement.**

---

## 0. Prérequis

- [ ] Branche `hotfix/secu-v1.7` mergée dans `master`
- [ ] Build Vercel déclenché et passé (0 erreur)
- [ ] Supabase Dashboard → Production ouvert en parallèle

---

## 1. Variables d'environnement Vercel (à vérifier / ajouter)

Dans **Vercel → Settings → Environment Variables** :

| Variable | Valeur attendue | Pourquoi |
|---|---|---|
| `DJAMA_ENV` | `production` | fail-closed Strategy 2 auth route |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | middleware Strategy B (distinct de NEXT_PUBLIC) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (secret) | upload, dashboard, migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | client Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | client Supabase |
| `ADMIN_PASS` | optionnel — legacy uniquement | Strategy A middleware (peut rester) |
| `ADMIN_PASS_DEPRECATED` | *(plus nécessaire — Strategy 2 supprimée)* | supprimable |

> **Note dev** : dans `.env.local`, ajouter `SUPABASE_URL=http://127.0.0.1:54321`
> pour que le middleware Strategy B valide les tokens contre la DB locale.

---

## 2. Migrations SQL en production

Appliquer dans l'ordre via **Supabase Dashboard → SQL Editor** ou `npx supabase db push --remote`.

### Migration 175 — REVOKE RPCs anon

```sql
REVOKE EXECUTE ON FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_revenue_by_month(date, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_inscriptions_by_month(date)
  FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_revenue_by_month(date, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_inscriptions_by_month(date)
  SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_month(date, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_inscriptions_by_month(date)
  TO service_role;
```

**Rollback :**
```sql
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_month(date, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inscriptions_by_month(date) TO anon, authenticated;
```

---

### Migration 176 — RLS beta_config

```sql
ALTER TABLE public.beta_config ENABLE ROW LEVEL SECURITY;
```

**Rollback :**
```sql
ALTER TABLE public.beta_config DISABLE ROW LEVEL SECURITY;
```

---

### Migration 177 — RLS tables admin-only

```sql
DROP POLICY IF EXISTS "invoices_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoice_items_authenticated" ON public.invoice_items;
DROP POLICY IF EXISTS "quotes_authenticated" ON public.quotes;
DROP POLICY IF EXISTS "quote_items_authenticated" ON public.quote_items;
DROP POLICY IF EXISTS "upsert site_settings" ON public.site_settings;
```

**Rollback :**
```sql
CREATE POLICY "invoices_authenticated" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoice_items_authenticated" ON public.invoice_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "quotes_authenticated" ON public.quotes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "quote_items_authenticated" ON public.quote_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "upsert site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
```

---

## 3. Requêtes de vérification SQL post-déploiement

Exécuter dans **Supabase Dashboard → SQL Editor** après chaque migration.

### Vérifier Migration 175 (RPCs)
```sql
SELECT proname, proacl
FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE pg_namespace.nspname = 'public'
  AND proname IN ('get_monthly_revenue','get_revenue_by_month','get_inscriptions_by_month')
ORDER BY proname;
```
**Résultat attendu :** `proacl` ne contient PAS `=X/postgres` ni `anon=X` ni `authenticated=X`.
Doit contenir uniquement `{postgres=X/postgres,service_role=X/postgres}`.

---

### Vérifier Migration 176 (RLS beta_config)
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'beta_config' AND schemaname = 'public';
```
**Résultat attendu :** `rowsecurity = true`

---

### Vérifier Migration 177 (politiques tables admin)
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('invoices','invoice_items','quotes','quote_items','site_settings')
ORDER BY tablename, policyname;
```
**Résultat attendu :** seule la politique `select site_settings` (SELECT, qual=true) reste.
Aucune politique sur invoices/invoice_items/quotes/quote_items.

---

### Vérifier absence routes supprimées
```sql
-- Ces tables de log ne doivent plus avoir de traces POST vers ces routes
SELECT action, created_at
FROM admin_audit_log
WHERE action LIKE '%activate-test%' OR action LIKE '%seed-blog%' OR action LIKE '%fork-session%'
ORDER BY created_at DESC
LIMIT 10;
```

---

### Vérifier beta_config accessible par service_role uniquement
```sql
-- Exécuter avec le client anon (anon key) — doit retourner 0 lignes ou erreur RLS
SELECT count(*) FROM public.beta_config;
```
**Résultat attendu avec anon key :** `ERROR: new row violates row-level security policy` ou `0 rows`.

---

## 4. Tests fonctionnels post-déploiement

- [ ] `/api/admin/dashboard` → 200 (RPCs service_role fonctionnent)
- [ ] `/api/beta/apply` GET → `{ open: false/true }` (beta_config via service_role)
- [ ] `/api/beta/apply` POST → 403 ou 200 (inscription fonctionne)
- [ ] Upload admin `/api/admin/upload` avec un SVG → 400 "non autorisé"
- [ ] Upload admin avec un PNG de 5MB → 200
- [ ] Login admin avec Strategy 2 (ADMIN_PASS) → 401 (DJAMA_ENV=production)
- [ ] Pages admin factures, devis, paramètres → fonctionnelles (API routes)

---

## 5. Rollback complet

Si une migration cause un incident :

1. Appliquer le SQL de rollback correspondant (section 2)
2. Redéployer le commit précédent sur Vercel (`vercel rollback`)
3. Vérifier les logs Vercel et Supabase

---

*Document généré le 2026-11-03 — V1.7-SECU hotfix*
