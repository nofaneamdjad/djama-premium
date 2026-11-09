#!/usr/bin/env python3
"""Génère DJAMA_C05_RAPPORT_VALIDATION_v1.pdf"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

OUT = "docs/DJAMA_C05_RAPPORT_VALIDATION_v1.pdf"

# ── Couleurs ─────────────────────────────────────────────────────────────────
GOLD   = colors.HexColor("#C9A55A")
DARK   = colors.HexColor("#1A1A1A")
GREY   = colors.HexColor("#F5F5F5")
GREEN  = colors.HexColor("#27AE60")
RED    = colors.HexColor("#E74C3C")
AMBER  = colors.HexColor("#F39C12")
BLUE   = colors.HexColor("#2980B9")
WHITE  = colors.white

# ── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

H1 = S("H1", fontSize=18, textColor=GOLD, fontName="Helvetica-Bold",
        spaceAfter=6, spaceBefore=18)
H2 = S("H2", fontSize=13, textColor=DARK, fontName="Helvetica-Bold",
        spaceAfter=4, spaceBefore=12,
        borderPad=4, backColor=GREY, leftIndent=-4)
H3 = S("H3", fontSize=11, textColor=DARK, fontName="Helvetica-Bold",
        spaceAfter=3, spaceBefore=8)
BODY = S("Body", fontSize=9, fontName="Helvetica", leading=13,
         spaceAfter=3)
BODY_BOLD = S("BodyBold", fontSize=9, fontName="Helvetica-Bold", leading=13)
MONO = S("Mono", fontSize=8, fontName="Courier", leading=11, spaceAfter=2)
CAPTION = S("Caption", fontSize=8, textColor=colors.grey,
            fontName="Helvetica-Oblique", alignment=TA_CENTER)
RIGHT = S("Right", fontSize=8, alignment=TA_RIGHT, fontName="Helvetica")

# ── Tableau style ─────────────────────────────────────────────────────────────
def tbl_style(header_bg=DARK, stripe=GREY):
    return TableStyle([
        ("BACKGROUND",   (0, 0), (-1,  0), header_bg),
        ("TEXTCOLOR",    (0, 0), (-1,  0), WHITE),
        ("FONTNAME",     (0, 0), (-1,  0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1,  0), 8),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, stripe]),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
    ])

def badge(text, bg):
    return Paragraph(f'<font color="white"><b>{text}</b></font>',
                     ParagraphStyle("badge", fontSize=7, fontName="Helvetica-Bold",
                                    backColor=bg, alignment=TA_CENTER, borderPad=2))

# ── Document ──────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2*cm,
    title="DJAMA C-05 — Rapport de Validation Sessions Administrateur",
    author="AMDJAD Nofane",
)

W = A4[0] - 4*cm  # largeur utile

story = []

# ══════════════════════════════════════════════════════════════════════════════
# PAGE DE TITRE
# ══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 2*cm))
story.append(Paragraph("DJAMA ADMIN", S("T0", fontSize=11, textColor=colors.grey,
    fontName="Helvetica", alignment=TA_CENTER)))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Chantier C-05", S("T1", fontSize=28, textColor=GOLD,
    fontName="Helvetica-Bold", alignment=TA_CENTER)))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph("Gestion et Sécurisation des Sessions Administrateur",
    S("T2", fontSize=14, textColor=DARK, fontName="Helvetica-Bold",
      alignment=TA_CENTER)))
story.append(Spacer(1, 0.4*cm))
story.append(HRFlowable(width="80%", color=GOLD, thickness=2, hAlign="CENTER"))
story.append(Spacer(1, 0.4*cm))

meta = [
    ["Rapport", "Validation finale — Phase 6"],
    ["Version", "v1.0"],
    ["Date", datetime.now().strftime("%d/%m/%Y %H:%M")],
    ["Auteur", "AMDJAD Nofane"],
    ["Branche", "hotfix/secu-v1.7"],
    ["Environnement", "Local (Supabase local + Next.js dev)"],
    ["Score", "21/21 — 100% ✓"],
    ["Verdict", "GO (local) — déploiement prod selon blockers P1"],
]
t = Table(meta, colWidths=[3.5*cm, W - 3.5*cm])
t.setStyle(TableStyle([
    ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
    ("FONTNAME",    (1, 0), (1, -1), "Helvetica"),
    ("FONTSIZE",    (0, 0), (-1, -1), 9),
    ("GRID",        (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, GREY]),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING",  (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING",(0,0), (-1, -1), 3),
    ("BACKGROUND",  (0, 7), (-1, 7), colors.HexColor("#D5F5E3")),
    ("TEXTCOLOR",   (1, 7), (1, 7), GREEN),
    ("FONTNAME",    (1, 7), (1, 7), "Helvetica-Bold"),
]))
story.append(t)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# 1. RÉSUMÉ EXÉCUTIF
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("1. Résumé Exécutif", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph(
    "Le chantier C-05 couvre la gestion complète du cycle de vie des sessions administrateur DJAMA. "
    "Il succède à C-01 (remboursements), C-04 (sécurité S4) et S5 (auth renforcée), et constitue "
    "la sixième couche de sécurité du système admin.", BODY))

story.append(Paragraph(
    "<b>Périmètre :</b> audit de l'existant, extension de la table admin_sessions, "
    "API sessions enrichie (listing, révocation ciblée, cross-admin, lockdown global), "
    "interface admin professionnelle, déclencheurs SQL automatiques, et 21 tests unitaires.", BODY))

resume = [
    ["Dimension", "Résultat"],
    ["Tests exécutés", "21"],
    ["PASS", "21 (100%)"],
    ["FAIL", "0"],
    ["SKIP / BLOCKED", "0"],
    ["Bugs corrigés", "2 (void Supabase lazy + aal session)"],
    ["Score final", "21/21 — 100%"],
    ["Verdict local", "✓ GO"],
]
t = Table(resume, colWidths=[5*cm, W - 5*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.3*cm))

# ══════════════════════════════════════════════════════════════════════════════
# 2. AUDIT INITIAL — LACUNES IDENTIFIÉES
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("2. Audit Initial — Lacunes Identifiées", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph(
    "L'audit de Phase 1 a identifié 7 lacunes dans le système de sessions existant :", BODY))

audit = [
    ["#", "Lacune", "Criticité", "Statut"],
    ["A-01", "Colonne last_seen_at absente → impossible de détecter l'inactivité", "MOYEN", "CORRIGÉ"],
    ["A-02", "Pas de trigger sur désactivation compte (is_active=false)", "ÉLEVÉ", "CORRIGÉ"],
    ["A-03", "Pas de trigger sur changement de rôle", "ÉLEVÉ", "CORRIGÉ"],
    ["A-04", "Pas de trigger sur activation MFA (mfa_required=true)", "ÉLEVÉ", "CORRIGÉ"],
    ["A-05", "Aucun endpoint de vue cross-admin des sessions (super_admin aveugle)", "MOYEN", "CORRIGÉ"],
    ["A-06", "Pas d'endpoint de lockdown global d'urgence", "CRITIQUE", "CORRIGÉ"],
    ["A-07", "Page /admin/sessions absente — aucune UI de gestion", "MOYEN", "CORRIGÉ"],
]
crit_colors = {
    "CRITIQUE": RED, "ÉLEVÉ": AMBER, "MOYEN": BLUE,
}
t = Table(audit, colWidths=[0.7*cm, 10*cm, 2*cm, 2*cm])
ts = tbl_style()
for i, row in enumerate(audit[1:], 1):
    crit = row[2]
    if crit in crit_colors:
        ts.add("BACKGROUND", (2, i), (2, i), crit_colors[crit])
        ts.add("TEXTCOLOR", (2, i), (2, i), WHITE)
        ts.add("FONTNAME", (2, i), (2, i), "Helvetica-Bold")
    ts.add("BACKGROUND", (3, i), (3, i), GREEN)
    ts.add("TEXTCOLOR", (3, i), (3, i), WHITE)
    ts.add("FONTNAME", (3, i), (3, i), "Helvetica-Bold")
t.setStyle(ts)
story.append(t)

# ══════════════════════════════════════════════════════════════════════════════
# 3. CORRECTIONS APPORTÉES
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("3. Corrections Apportées", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

# 3.1 Migration
story.append(Paragraph("3.1 Migration SQL locale", H2))
story.append(Paragraph(
    "Fichier : <font face='Courier'>supabase/migrations/20261109000001_c05_sessions_management.sql</font>", BODY))

mig = [
    ["Élément", "Description"],
    ["Colonne last_seen_at", "TIMESTAMPTZ NULL + index sur admin_sessions"],
    ["Trigger trg_revoke_on_disabled", "Révoque toutes les sessions si is_active → FALSE"],
    ["Trigger trg_revoke_on_role_change", "Révoque toutes les sessions si role change"],
    ["Trigger trg_revoke_on_mfa_enabled", "Révoque les sessions aal1 si mfa_required → TRUE"],
    ["Table admin_security_events", "Journal des événements de sécurité majeurs"],
]
t = Table(mig, colWidths=[5*cm, W - 5*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.2*cm))

# 3.2 lib/admin-auth-v2.ts
story.append(Paragraph("3.2 src/lib/admin-auth-v2.ts", H2))
story.append(Paragraph(
    "Ajouts :", BODY_BOLD))
mods = [
    ["Modification", "Impact"],
    ["Export ROLE_HIERARCHY (super_admin:7 … viewer:0)",
     "Permet aux API de comparer les rangs pour la hiérarchie cross-admin"],
    ["Mise à jour last_seen_at non-bloquante (IIFE + await)",
     "Tracabilité de l'activité sans ralentir les requêtes (void + IIFE corrige le comportement lazy Supabase JS)"],
]
t = Table(mods, colWidths=[7*cm, W - 7*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.2*cm))

# 3.3 Routes API
story.append(Paragraph("3.3 Routes API nouvelles / modifiées", H2))
routes = [
    ["Route", "Méthode", "Description"],
    ["/api/admin/sessions", "GET",
     "Mes sessions / ?admin_id=X (cross-admin super_admin) / ?scope=all (toutes)"],
    ["/api/admin/sessions", "DELETE",
     "Révocation ciblée ?id= ou globale / cross-admin ?admin_id= avec vérif hiérarchie"],
    ["/api/admin/sessions/lockdown", "POST",
     "Lockdown global d'urgence (super_admin + re-auth security + rate limit 1/10min)"],
]
t = Table(routes, colWidths=[5.5*cm, 1.5*cm, W - 7*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.2*cm))

# 3.4 Pages UI
story.append(Paragraph("3.4 Pages UI", H2))
ui = [
    ["Fichier", "Contenu"],
    ["src/app/admin/sessions/page.tsx",
     "Onglets : mes sessions / toutes (super_admin) / historique. "
     "SessionCard : device info, AAL badge, is_current badge, révocation. "
     "Lockdown modal avec re-auth. Filtres recherche + rôle."],
    ["src/app/admin/layout.tsx",
     "Ajout lien « Sessions actives » dans le groupe Sécurité & Paramètres"],
]
t = Table(ui, colWidths=[5.5*cm, W - 5.5*cm])
t.setStyle(tbl_style())
story.append(t)

# ══════════════════════════════════════════════════════════════════════════════
# 4. BUGS DÉCOUVERTS ET CORRIGÉS PENDANT LES TESTS
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("4. Bugs Découverts et Corrigés pendant les Tests", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

bugs = [
    ["#", "Bug", "Cause", "Correction"],
    ["BUG-01",
     "Session test super_admin rejetée (401 MFA) sur tous les tests",
     "createAdminAndSession créait les sessions avec aal='aal1' "
     "alors que super_admin est dans ROLES_REQUIRING_MFA",
     "Détection automatique AAL selon le rôle dans createAdminAndSession "
     "(aal2 pour MFA-required roles)"],
    ["BUG-02",
     "last_seen_at toujours null même après de nombreuses requêtes",
     "void sb0.from(...).update(...) — le query builder Supabase JS v2 est lazy : "
     "la requête ne s'exécute pas sans await/.then()",
     "Encapsuler dans une IIFE async : void (async () => { await ... })()"],
]
t = Table(bugs, colWidths=[1.2*cm, 3.5*cm, 5*cm, W - 9.7*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph(
    "Note : BUG-02 est un pattern trompeur dans Supabase JS v2. "
    "Le `void expr` évalue l'expression mais ne déclenche jamais `.then()` sur le PromiseLike "
    "du query builder, donc la requête n'est jamais envoyée. Ce pattern doit être évité dans tout "
    "le code pour les mises à jour non-bloquantes.", BODY))

# ══════════════════════════════════════════════════════════════════════════════
# 5. RÉSULTATS DÉTAILLÉS DES TESTS
# ══════════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(Paragraph("5. Résultats Détaillés des Tests", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph(
    "Script : <font face='Courier'>scripts/test_c05_sessions.mjs</font> — "
    "Exécuté sur Next.js dev (localhost:3000) + Supabase local.", BODY))
story.append(Spacer(1, 0.2*cm))

tests = [
    ["#", "Scénario", "Statut", "Résultat observé"],
    ["TU-01", "Connexion valide — session listée", "PASS",
     "1 session active retournée avec aal, device, ip"],
    ["TU-02", "Deux sessions simultanées visibles", "PASS",
     "2 sessions (desktop Chrome + iPhone Safari)"],
    ["TU-03", "Session actuelle identifiée (is_current)", "PASS",
     "is_current=true sur la session courante"],
    ["TU-04", "Révocation session ciblée (?id=)", "PASS",
     "HTTP 200 — revoked_at confirmé en DB"],
    ["TU-05", "Session révoquée → 401", "PASS",
     "HTTP 401 sur réutilisation immédiate"],
    ["TU-06", "Vue globale scope=all (super_admin)", "PASS",
     "Toutes sessions avec admin info join"],
    ["TU-07", "scope=all refusé hors super_admin", "PASS",
     "HTTP 403 pour rôle commercial"],
    ["TU-08", "Lecture sessions cross-admin (GET ?admin_id=)", "PASS",
     "Sessions de l'admin commercial avec email"],
    ["TU-09", "Révocation cross-admin — toutes sessions", "PASS",
     "HTTP 200 — révocation des sessions inférieures"],
    ["TU-10", "Session cross-admin révoquée → 401", "PASS",
     "HTTP 401 sur token révoqué via cross-admin"],
    ["TU-11", "Révocation d'un admin de rang supérieur bloquée", "PASS",
     "HTTP 401/403 — hiérarchie respectée"],
    ["TU-12", "Compte désactivé → trigger → 401", "PASS",
     "is_active=false → trigger révoque → HTTP 401"],
    ["TU-13", "Changement de rôle → trigger → 401", "PASS",
     "role change → trigger révoque → HTTP 401"],
    ["TU-14", "Session expirée → 401", "PASS",
     "Session expires_at passé → HTTP 401"],
    ["TU-15", "Accès 403 — scope=all hors super_admin", "PASS",
     "HTTP 403 rôle insuffisant"],
    ["TU-16", "Token inexistant → 401", "PASS",
     "HTTP 401 sur token aléatoire inexistant en DB"],
    ["TU-17", "5 requêtes concurrentes — aucune corruption", "PASS",
     "5×200 — pas d'état corrompu"],
    ["TU-18", "last_seen_at mis à jour après requête", "PASS",
     "Timestamp updated (correction BUG-02 appliquée)"],
    ["TU-19", "Journaux d'audit SESSION_REVOKE présents", "PASS",
     "9 logs SESSION_REVOKE dans admin_audit_log"],
    ["TU-20", "MFA obligatoire → finance+aal1 refusée", "PASS",
     "HTTP 401 — rôle finance + aal1 → rejeté"],
    ["TU-21", "Lockdown → rate limit actif", "PASS",
     "HTTP 429 — rate limit 1/10min confirmé"],
]

col_w = [1.2*cm, 5.5*cm, 1.2*cm, W - 7.9*cm]
t = Table(tests, colWidths=col_w, repeatRows=1)
ts = tbl_style()
for i in range(1, len(tests)):
    statut = tests[i][2]
    bg = GREEN if statut == "PASS" else RED if statut == "FAIL" else AMBER
    ts.add("BACKGROUND", (2, i), (2, i), bg)
    ts.add("TEXTCOLOR", (2, i), (2, i), WHITE)
    ts.add("FONTNAME", (2, i), (2, i), "Helvetica-Bold")
    ts.add("FONTSIZE", (2, i), (2, i), 7)
t.setStyle(ts)
story.append(t)

# ══════════════════════════════════════════════════════════════════════════════
# 6. ARCHITECTURE DE SÉCURITÉ — NOTES
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("6. Notes d'Architecture de Sécurité", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

archi = [
    ["Point", "Détail"],
    ["Limitation JWT Supabase",
     "Les JWT access_token Supabase ont une durée de vie fixe de 1h et ne peuvent pas "
     "être révoqués avant expiration. La révocation DJAMA via admin_sessions (Strategy 0) "
     "est immédiatement effective car chaque requête vérifie revoked_at en DB."],
    ["Stratégie dual-auth",
     "Strategy 0 (djama_admin_tok cookie → SHA-256 → DB) est la voie principale. "
     "Strategy 1 (Supabase JWT) reste en fallback pour les flows Supabase Auth natifs. "
     "La révocation ciblée ne concerne que Strategy 0."],
    ["MFA (AAL2)",
     "Rôles obligatoires : super_admin, direction, admin, finance. "
     "Toute session avec aal='aal1' pour ces rôles est rejetée (401). "
     "Les triggers révoquent les sessions aal1 existantes si mfa_required=true est activé."],
    ["Hiérarchie de révocation",
     "Un admin ne peut révoquer que les sessions d'un admin de rang STRICTEMENT inférieur. "
     "Le super_admin (rang 7) peut révoquer tous les autres. "
     "Le lockdown global (super_admin + re-auth) révoque TOUTES les sessions sans exception."],
    ["Journalisation",
     "Toutes les révocations écrivent dans admin_audit_log (action SESSION_REVOKE_*). "
     "Les lockdowns écrivent aussi dans admin_security_events (event_type='global_lockdown')."],
]
t = Table(archi, colWidths=[4*cm, W - 4*cm])
t.setStyle(tbl_style())
story.append(t)

# ══════════════════════════════════════════════════════════════════════════════
# 7. RISQUES RÉSIDUELS
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("7. Risques Résiduels", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

risks = [
    ["#", "Risque", "Niveau", "Mitigation"],
    ["R-01",
     "JWT Supabase Strategy 1 non révocable immédiatement (1h TTL)",
     "FAIBLE",
     "Strategy 0 est la voie principale. Strategy 1 est un fallback. "
     "La rotation des clés JWT permet une révocation globale en urgence."],
    ["R-02",
     "Le lockdown révoque TOUTES les sessions y compris celle du déclencheur "
     "→ l'admin doit se reconnecter immédiatement",
     "ACCEPTABLE",
     "Comportement voulu en situation d'incident. Le re-auth obligatoire "
     "et le rate limit (1/10min) préventent les déclenchements accidentels."],
    ["R-03",
     "last_seen_at non-bloquant : si le serveur crashe entre la requête "
     "et la mise à jour, le timestamp n'est pas mis à jour",
     "TRÈS FAIBLE",
     "last_seen_at est indicatif, pas un contrôle de sécurité."],
    ["R-04",
     "Pas de nettoyage automatique des sessions expirées (table peut grossir)",
     "FAIBLE",
     "Un job cron de purge est à prévoir avant mise en production."],
]
t = Table(risks, colWidths=[1*cm, 5.5*cm, 2*cm, W - 8.5*cm])
ts = tbl_style()
level_colors = {"CRITIQUE": RED, "ÉLEVÉ": AMBER, "FAIBLE": GREEN,
                "TRÈS FAIBLE": GREEN, "ACCEPTABLE": BLUE}
for i, row in enumerate(risks[1:], 1):
    lvl = row[2]
    if lvl in level_colors:
        ts.add("BACKGROUND", (2, i), (2, i), level_colors[lvl])
        ts.add("TEXTCOLOR", (2, i), (2, i), WHITE)
        ts.add("FONTNAME", (2, i), (2, i), "Helvetica-Bold")
t.setStyle(ts)
story.append(t)

# ══════════════════════════════════════════════════════════════════════════════
# 8. VERDICT FINAL
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("8. Verdict Final", H1))
story.append(HRFlowable(width="100%", color=GOLD, thickness=1))
story.append(Spacer(1, 0.2*cm))

verdicts = [
    ["Environnement", "Score", "Verdict", "Conditions"],
    ["Local (dev)", "21/21 — 100%", "✓ GO",
     "Tous les tests passent. Migration locale appliquée."],
    ["Staging", "—", "⚠ EN ATTENTE",
     "Migration 20261109000001 à appliquer. Tests à ré-exécuter."],
    ["Production", "—", "🚫 BLOQUÉ",
     "Blockers P1 actifs (voir project_p1_blockers_prod.md). "
     "Aucun déploiement sans validation explicite."],
]
t = Table(verdicts, colWidths=[2.5*cm, 2.5*cm, 2*cm, W - 7*cm])
ts = tbl_style()
verdict_colors = {"✓ GO": GREEN, "⚠ EN ATTENTE": AMBER, "🚫 BLOQUÉ": RED}
for i, row in enumerate(verdicts[1:], 1):
    v = row[2]
    for text, c in verdict_colors.items():
        if text in v:
            ts.add("BACKGROUND", (2, i), (2, i), c)
            ts.add("TEXTCOLOR", (2, i), (2, i), WHITE)
            ts.add("FONTNAME", (2, i), (2, i), "Helvetica-Bold")
t.setStyle(ts)
story.append(t)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph(
    "<b>Contraintes actives :</b> aucun déploiement, aucune migration distante, "
    "aucune modification des comptes réels. C-06 interdit sans validation explicite du chantier C-05.", BODY))

story.append(Spacer(1, 0.6*cm))
story.append(HRFlowable(width="100%", color=GOLD, thickness=2))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — DJAMA ADMIN v1.7-SECU",
    CAPTION))

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f"[OK] Rapport genere : {OUT}")
