-- ── Analytics Jalon C — Stats cross-modules ──────────────────────────────────
-- Migration 161 : fonctions RPC SECURITY DEFINER pour les 5 modules croisés
-- (chatbot, rdv, boutique, tâches, réputation)
-- Pas de nouvelles tables — lecture seule des tables existantes.

-- ── 1. Chatbot IA ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_chatbot_stats(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  nb_actifs       bigint,
  conversations   bigint,
  messages        bigint,
  taux_resolution numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM chatbots WHERE user_id = p_user_id AND is_active = true)::bigint,

    (SELECT COUNT(*)
     FROM chatbot_conversations cc
     JOIN chatbots cb ON cc.chatbot_id = cb.id
     WHERE cb.user_id = p_user_id
       AND cc.created_at::date BETWEEN p_start::date AND p_end::date
    )::bigint,

    (SELECT COUNT(*)
     FROM chatbot_messages cm
     JOIN chatbot_conversations cc ON cm.conversation_id = cc.id
     JOIN chatbots cb ON cc.chatbot_id = cb.id
     WHERE cb.user_id = p_user_id
       AND cm.created_at::date BETWEEN p_start::date AND p_end::date
    )::bigint,

    COALESCE(
      (SELECT ROUND(
        COUNT(*) FILTER (WHERE cc.status = 'closed')::numeric
        / NULLIF(COUNT(*), 0) * 100,
        1
      )
      FROM chatbot_conversations cc
      JOIN chatbots cb ON cc.chatbot_id = cb.id
      WHERE cb.user_id = p_user_id
        AND cc.created_at::date BETWEEN p_start::date AND p_end::date
      ), 0
    );
$$;

-- ── 2. Rendez-vous ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_rdv_stats(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  total     bigint,
  confirmes bigint,
  completes bigint,
  annules   bigint,
  no_show   bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'confirmed')::bigint,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint,
    COUNT(*) FILTER (WHERE status = 'cancelled')::bigint,
    COUNT(*) FILTER (WHERE status = 'no_show')::bigint
  FROM rdv_appointments
  WHERE user_id = p_user_id
    AND start_at::date BETWEEN p_start::date AND p_end::date;
$$;

-- ── 3. Boutique ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_boutique_stats(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  nb_commandes     bigint,
  ca_total         numeric,
  commandes_payees bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0)::numeric,
    COUNT(*) FILTER (WHERE payment_status = 'paid')::bigint
  FROM shop_orders
  WHERE user_id = p_user_id
    AND created_at::date BETWEEN p_start::date AND p_end::date;
$$;

-- ── 4. Tâches productivité ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_taches_stats(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  total      bigint,
  completees bigint,
  en_retard  bigint,
  urgentes   bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'done')::bigint,
    COUNT(*) FILTER (
      WHERE status = 'late'
         OR (due_date IS NOT NULL AND due_date < CURRENT_DATE AND status <> 'done')
    )::bigint,
    COUNT(*) FILTER (WHERE priority = 'urgent')::bigint
  FROM productivity_tasks
  WHERE user_id = p_user_id
    AND created_at::date BETWEEN p_start::date AND p_end::date;
$$;

-- ── 5. Réputation ─────────────────────────────────────────────────────────────
-- rep_reviews utilise org_id (pas user_id).
-- Pour les utilisateurs solo de DJAMA, org_id = user_id est la convention.

CREATE OR REPLACE FUNCTION analytics_reputation_stats(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  nb_avis      bigint,
  note_moyenne numeric,
  nb_positifs  bigint,
  nb_negatifs  bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*) FILTER (WHERE sentiment = 'positive')::bigint,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::bigint
  FROM rep_reviews
  WHERE org_id = p_user_id
    AND status IN ('published', 'pending')
    AND created_at::date BETWEEN p_start::date AND p_end::date;
$$;
