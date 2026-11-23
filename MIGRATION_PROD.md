# MIGRATION_PROD.md — V1.7-SECU Hotfix

Checklist de déploiement en production. À suivre dans l'ordre.
**Aucune de ces étapes ne sera effectuée automatiquement.**

---

## 0. Prérequis

- [ ] Branche `hotfix/secu-v1.7` mergée dans `master`
- [ ] Build Vercel déclenché et passé (0 erreur)
- [ ] Supabase Dashboard → Production ouvert en parallèle

---

## 1. Variables d'environnement Vercel (modifications requises)

Dans **Vercel → Settings → Environment Variables** :

### À AJOUTER / VÉRIFIER

| Variable | Valeur attendue | Pourquoi |
|---|---|---|
| `DJAMA_ENV` | `production` | fail-closed : serveur refuse de démarrer si absent |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | middleware Strategy B (session DB, distinct de NEXT_PUBLIC) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (secret) | upload, dashboard, migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | client Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | client Supabase |

### À SUPPRIMER

| Variable | Raison |
|---|---|
| `ADMIN_PASS` | Strategy A ADMIN_PASS supprimée (Bloquant 3). La variable n'est plus lue par aucun code. La laisser est inoffensif mais trompeur — la supprimer prouve l'élimination complète. |

> **Note dev** : dans `.env.local`, `DJAMA_ENV=development` et `SUPABASE_URL=http://127.0.0.1:54321`
> sont requis pour démarrer le serveur en local.

---

## 2. Ordre de déploiement

> **Code d'abord, migrations ensuite.**
> Les migrations ne cassent pas le code existant (DROP POLICY + ADD POLICY seulement).
> Le code peut tourner avec les anciennes policies le temps du déploiement.

```
1. Merge PR sur master
2. Vercel déploie automatiquement
3. Vérifier build OK (0 erreur TS, 0 erreur ESLint)
4. Appliquer migrations SQL dans l'ordre ci-dessous
5. Tests fonctionnels post-déploiement (section 4)
```

---

## 3. Migrations SQL en production

Appliquer dans l'ordre via **Supabase Dashboard → SQL Editor** ou `npx supabase db push --remote`.

> Les migrations sont désormais nommées `20261103000001_*`, `20261103000002_*`, `20261103000003_*`
> (renommées depuis `175_*`, `176_*`, `177_*` pour éviter un conflit de numérotation).

---

### Migration 20261103000001 — REVOKE RPCs anon

**Ce qu'elle fait :** retire le GRANT EXECUTE sur 3 RPCs (revenus, inscriptions) pour PUBLIC/anon/authenticated.
Ne bloque pas le dashboard admin — celui-ci utilise service_role (bypass total).

**Rollback testé localement :** oui (`supabase db reset` → 0 erreur)

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

### Migration 20261103000002 — RLS beta_config

**Ce qu'elle fait :** active RLS sur `beta_config` (table qui contient `signups_open`, `max_testers`, etc.).
Résultat : anon + authenticated → 0 lignes visibles (aucune policy SELECT publique).
Le code accède via `createSupabaseAdmin()` (service_role, bypass RLS) → aucun impact fonctionnel.

**Rollback testé localement :** oui

```sql
ALTER TABLE public.beta_config ENABLE ROW LEVEL SECURITY;
```

**Rollback :**
```sql
ALTER TABLE public.beta_config DISABLE ROW LEVEL SECURITY;
```

---

### Migration 20261103000003 — RLS tables admin + owner policies invoices/quotes

**Ce qu'elle fait :**
1. Supprime 5 policies trop larges (authenticated = tout le monde)
2. Supprime 1 policy `upsert site_settings` (allow true → n'importe qui peut écrire)
3. Ajoute 4 owner policies : un client authentifié voit **uniquement** ses propres factures/devis

**Impact fonctionnel :** les clients du portail peuvent toujours voir leurs factures et devis
(via `auth.email() = client_email`). Le code admin utilise service_role → non affecté.

**Rollback testé localement :** oui

```sql
-- DROP des policies trop larges
DROP POLICY IF EXISTS "invoices_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoice_items_authenticated" ON public.invoice_items;
DROP POLICY IF EXISTS "quotes_authenticated" ON public.quotes;
DROP POLICY IF EXISTS "quote_items_authenticated" ON public.quote_items;
DROP POLICY IF EXISTS "upsert site_settings" ON public.site_settings;

-- ADD owner policies (Bloquant 1 — V1.7-SECU)
CREATE POLICY "invoices_owner_select" ON public.invoices
  FOR SELECT USING (auth.email() = client_email);

CREATE POLICY "invoice_items_owner_select" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.client_email = auth.email()
    )
  );

CREATE POLICY "quotes_owner_select" ON public.quotes
  FOR SELECT USING (auth.email() = client_email);

CREATE POLICY "quote_items_owner_select" ON public.quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.client_email = auth.email()
    )
  );
```

**Rollback :**
```sql
DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
DROP POLICY IF EXISTS "invoice_items_owner_select" ON public.invoice_items;
DROP POLICY IF EXISTS "quotes_owner_select" ON public.quotes;
DROP POLICY IF EXISTS "quote_items_owner_select" ON public.quote_items;

CREATE POLICY "invoices_authenticated" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoice_items_authenticated" ON public.invoice_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "quotes_authenticated" ON public.quotes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "quote_items_authenticated" ON public.quote_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "upsert site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
```

---

## 4. Requêtes de vérification SQL post-déploiement

Exécuter dans **Supabase Dashboard → SQL Editor** après chaque migration.

### Vérifier Migration 20261103000001 (RPCs)
```sql
SELECT proname, proacl
FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE pg_namespace.nspname = 'public'
  AND proname IN ('get_monthly_revenue','get_revenue_by_month','get_inscriptions_by_month')
ORDER BY proname;
```
**Résultat attendu :** `proacl` contient uniquement `{postgres=X/postgres,service_role=X/postgres}`.
Ne doit PAS contenir `anon=X` ni `authenticated=X`.

---

### Vérifier Migration 20261103000002 (RLS beta_config)
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'beta_config' AND schemaname = 'public';
```
**Résultat attendu :** `rowsecurity = true`

---

### Vérifier Migration 20261103000003 (policies invoices/quotes)
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('invoices','invoice_items','quotes','quote_items','site_settings')
ORDER BY tablename, policyname;
```
**Résultat attendu :**
- `invoices` → uniquement `invoices_owner_select` (SELECT, `auth.email() = client_email`)
- `invoice_items` → uniquement `invoice_items_owner_select` (SELECT, sous-requête EXISTS)
- `quotes` → uniquement `quotes_owner_select` (SELECT, `auth.email() = client_email`)
- `quote_items` → uniquement `quote_items_owner_select` (SELECT, sous-requête EXISTS)
- `site_settings` → uniquement `select site_settings` (SELECT, `true`) — pas de WRITE policy

---

### Vérifier absence de Strategy A/B dans les logs admin
```sql
SELECT action, created_at, admin_email
FROM admin_audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```
**Résultat attendu :** les connexions admin récentes utilisent `strategy=session` (non `password`).

---

### Vérifier beta_config inaccessible par anon
```sql
-- Exécuter avec le client anon (anon key) — doit retourner 0 lignes ou erreur RLS
SELECT count(*) FROM public.beta_config;
```
**Résultat attendu avec anon key :** `0` lignes (RLS ON + aucune policy SELECT publique).

---

## 5. Tests fonctionnels post-déploiement

- [ ] `/api/admin/dashboard` → 200 (RPCs service_role fonctionnent)
- [ ] `/api/beta/apply` GET → `{ open: false/true }` (beta_config via service_role)
- [ ] `/api/beta/apply` POST → 403 ou 200 (inscription fonctionne)
- [ ] Upload admin `/api/admin/upload` avec un SVG → 400 "non autorisé"
- [ ] Upload admin avec un HTML renommé en `.png` → 400 "signature non conforme"
- [ ] Upload admin avec un vrai PNG → 200
- [ ] Upload admin avec un PDF → 200
- [ ] Login admin avec email valide → 200 (Strategy 0 / Strategy 1)
- [ ] Login admin sans email (ancien ADMIN_PASS) → 400 "authentification individuelle requise"
- [ ] Pages admin factures, devis, paramètres → fonctionnelles (API routes)
- [ ] Portail client : un client voit ses propres factures → 200 avec ses données
- [ ] Portail client : un client NE voit PAS les factures d'un autre client → 0 lignes
- [ ] `DJAMA_ENV` absent → Vercel refuse de démarrer (fail-closed)

---

## 6. Rollback complet

Si une migration cause un incident :

1. Appliquer le SQL de rollback correspondant (section 3)
2. Redéployer le commit précédent sur Vercel (`vercel rollback`)
3. Vérifier les logs Vercel et Supabase

---

*Document mis à jour le 2026-11-04 — V1.7-SECU hotfix (Bloquants 1+2+3 + magic bytes)*
