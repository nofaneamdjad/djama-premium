-- Migration 146 — Moteur d'obligations déclaratives
-- Alignement de la table decl_obligations avec le nouveau catalogue vérifié.
--
-- Changements :
-- 1. Élargissement de la contrainte statut_couverture (nouveaux niveaux du catalogue)
-- 2. Ajout de url_autorite (lien vers le site officiel de l'autorité)
-- 3. Index de performance sur (user_id, pays, categorie)
-- 4. Valeurs par défaut harmonisées avec le moteur
--
-- Aucune donnée existante n'est modifiée.

-- ── 1. Mise à jour de la contrainte statut_couverture ───────────────────────
--
-- Ancien ensemble : information | preparation_assistee | export |
--                   transmission | non_pris_en_charge
-- Nouveau ensemble (catalogue obligations-catalogue.ts) :
--   non_disponible      — pays non couvert dans le catalogue
--   information         — informations générales uniquement (inchangé)
--   calendrier_verifie  — échéances vérifiées, pas de préparation guidée
--   preparation_assistee— DJAMA aide à préparer (inchangé)
--   export_officiel     — export au format officiel disponible
--   depot_integre       — dépôt électronique direct (intégration officielle)
--   non_pris_en_charge  — explicitement hors périmètre (inchangé)
--
-- Les deux valeurs obsolètes ('export', 'transmission') sont conservées
-- en lecture pour rétrocompatibilité, mais les nouvelles insertions
-- utilisent les nouveaux libellés.

ALTER TABLE decl_obligations
  DROP CONSTRAINT IF EXISTS decl_obligations_statut_couverture_check;

ALTER TABLE decl_obligations
  ADD CONSTRAINT decl_obligations_statut_couverture_check
  CHECK (statut_couverture IN (
    -- nouveaux niveaux catalogue
    'non_disponible',
    'information',
    'calendrier_verifie',
    'preparation_assistee',
    'export_officiel',
    'depot_integre',
    'non_pris_en_charge',
    -- anciens libellés conservés (rétrocompatibilité)
    'export',
    'transmission'
  ));

-- ── 2. Colonne url_autorite ──────────────────────────────────────────────────
-- Lien vers le site officiel de l'autorité (ex. https://www.impots.gouv.fr).
-- Présent dans ObligationRule du catalogue, stocké si l'obligation est importée.

ALTER TABLE decl_obligations
  ADD COLUMN IF NOT EXISTS url_autorite TEXT;

-- ── 3. Index de performance ──────────────────────────────────────────────────
-- Les requêtes les plus fréquentes filtrent par user_id + pays et/ou categorie.

CREATE INDEX IF NOT EXISTS decl_obligations_pays_idx
  ON decl_obligations (user_id, pays);

CREATE INDEX IF NOT EXISTS decl_obligations_categorie_idx
  ON decl_obligations (user_id, categorie);

CREATE INDEX IF NOT EXISTS decl_obligations_active_idx
  ON decl_obligations (user_id, active)
  WHERE active = true;

-- ── 4. Valeur par défaut harmonisée ─────────────────────────────────────────
-- Le moteur pose 'information' comme niveau minimal ; c'est déjà le défaut.
-- On s'assure que les lignes sans statut_couverture héritent bien de ce défaut.

ALTER TABLE decl_obligations
  ALTER COLUMN statut_couverture SET DEFAULT 'information';

-- ── 5. Commentaires colonnes ─────────────────────────────────────────────────
COMMENT ON COLUMN decl_obligations.statut_couverture IS
  'Niveau de couverture DJAMA : non_disponible | information | calendrier_verifie |
   preparation_assistee | export_officiel | depot_integre | non_pris_en_charge.
   Ne jamais afficher depot_integre si aucune intégration officielle n est en place.';

COMMENT ON COLUMN decl_obligations.url_autorite IS
  'URL officielle de l autorité fiscale ou sociale compétente.
   Ex. https://www.impots.gouv.fr, https://www.urssaf.fr';

COMMENT ON COLUMN decl_obligations.source_reglementaire IS
  'Référence légale vérifiée (article de loi, BOI, etc.).
   Ex. CGI art. 287 — BOI-TVA-DECLA-20-20. Ne jamais inventer.';

COMMENT ON COLUMN decl_obligations.date_verification IS
  'Date de la dernière vérification humaine des règles de cette obligation.
   À mettre à jour lors de chaque révision du catalogue.';
