#!/usr/bin/env python3
"""Genere docs/DJAMA_DESIGN_SYSTEM_GLOBAL_V1.pdf"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

OUT  = "docs/DJAMA_DESIGN_SYSTEM_GLOBAL_V1.pdf"
DATE = datetime.now().strftime("%d/%m/%Y")

DJAMA_Y = colors.HexColor("#FFB900")   # Jaune DJAMA officiel
DJAMA_K = colors.HexColor("#101114")   # Noir profond
DJAMA_A = colors.HexColor("#191B20")   # Anthracite
DJAMA_W = colors.HexColor("#F5F5F5")   # Blanc doux
GREY_L  = colors.HexColor("#F7F8FA")
GREY_M  = colors.HexColor("#E6E8EC")
RED     = colors.HexColor("#EF4444")
GREEN   = colors.HexColor("#22C55E")
AMBER   = colors.HexColor("#F59E0B")
BLUE    = colors.HexColor("#3B82F6")
WHITE   = colors.white

def S(name, **kw): return ParagraphStyle(name, **kw)

H0  = S("H0", fontSize=28, textColor=DJAMA_Y, fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
H1  = S("H1", fontSize=16, textColor=DJAMA_K, fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=16)
H2  = S("H2", fontSize=12, textColor=DJAMA_K, fontName="Helvetica-Bold", spaceAfter=4, spaceBefore=10)
H3  = S("H3", fontSize=10, textColor=DJAMA_K, fontName="Helvetica-Bold", spaceAfter=3, spaceBefore=6)
BD  = S("BD", fontSize=9,  textColor=DJAMA_K, spaceAfter=4, leading=14)
SM  = S("SM", fontSize=8,  textColor=colors.HexColor("#555"), spaceAfter=3, leading=12)
CT  = S("CT", fontSize=10, textColor=DJAMA_K, alignment=TA_CENTER)
YT  = S("YT", fontSize=24, textColor=DJAMA_Y, fontName="Helvetica-Bold", alignment=TA_CENTER)
ST  = S("ST", fontSize=11, textColor=colors.HexColor("#555"), alignment=TA_CENTER, spaceAfter=4)
WARN = S("WRN", fontSize=9, textColor=RED, fontName="Helvetica-Bold", spaceAfter=3)
OK_S = S("OKS", fontSize=9, textColor=GREEN, fontName="Helvetica-Bold", spaceAfter=3)

def ts(h=DJAMA_K):
    return TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), h),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, GREY_L]),
        ("GRID",          (0,0), (-1,-1), 0.4, GREY_M),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",   (0,0), (-1,-1), 5),
        ("RIGHTPADDING",  (0,0), (-1,-1), 5),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ])

PW = A4[0] - 4*28.35

def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
                            leftMargin=2*28.35, rightMargin=2*28.35,
                            topMargin=2*28.35,  bottomMargin=2*28.35)
    s = []

    # === COUVERTURE =========================================================
    s += [
        Spacer(1, 30),
        Paragraph("DJAMA", H0),
        Paragraph("Design System Global V1", YT),
        Paragraph("Charte graphique officielle — Identite NOIR / BLANC / JAUNE", ST),
        Spacer(1, 8),
        HRFlowable(width="100%", thickness=2, color=DJAMA_Y),
        Spacer(1, 6),
        Paragraph(f"Rapport d'audit et plan de refonte | {DATE}", CT),
        Paragraph("Branche : hotfix/secu-v1.7 | Environnement : local", S("sm2", fontSize=8, textColor=colors.HexColor("#888"), alignment=TA_CENTER)),
        Spacer(1, 20),
    ]

    score = Table([
        ["Accent actuel", "Accent cible", "Statut"],
        ["#C9A55A (or)", "#FFB900 (jaune DJAMA)", "MIGRATION REQUISE"],
        ["Rayons 12-28px", "Rayons 6-14px", "COMPACTIFIER"],
        ["Beige chaud client", "Blanc/gris pur", "CORRIGER"],
        ["Deux systemes couleurs", "Un seul design system", "HARMONISER"],
    ], colWidths=[PW/3]*3)
    score.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), DJAMA_K),
        ("TEXTCOLOR",    (0,0), (-1,0), WHITE),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, GREY_L]),
        ("GRID",         (0,0), (-1,-1), 0.4, GREY_M),
        ("ALIGN",        (0,0), (-1,-1), "CENTER"),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("BACKGROUND",   (2,1), (2,-1), colors.HexColor("#FFF3CD")),
        ("TEXTCOLOR",    (2,1), (2,-1), colors.HexColor("#B45309")),
        ("FONTNAME",     (2,1), (2,-1), "Helvetica-Bold"),
    ]))
    s += [score, Spacer(1, 20), PageBreak()]

    # === 1. RESUME EXECUTIF =================================================
    s.append(Paragraph("1. Resume executif", H1))
    s.append(Paragraph(
        "DJAMA possede deux interfaces complementaires : DJAMA Admin (console interne) et "
        "DJAMA Logiciel (plateforme clients). Ces deux interfaces coexistent avec deux "
        "systemes de design distincts et une couleur d'accent incorrecte (#C9A55A, or/dore) "
        "qui contredit l'identite officielle DJAMA (jaune #FFB900).",
        BD))
    s.append(Paragraph(
        "L'objectif de cette refonte est d'etablir un design system unique, professionnel et "
        "coherent, fonde sur la palette NOIR/BLANC/JAUNE DJAMA, avec un mode sombre par "
        "defaut et un mode clair de qualite egale.",
        BD))

    s.append(Paragraph("1.1 Problemes critiques identifies", H2))
    problems = [
        ["#", "Probleme", "Severite", "Fichier(s) concernes"],
        ["P-01", "Couleur accent or (#C9A55A) au lieu du jaune DJAMA (#FFB900)",       "CRITIQUE", "hq/index.tsx, globals.css, theme-context.tsx, 50+ pages"],
        ["P-02", "Palette beige chaud client (text: #e8e2d6, #a09880) non conforme",    "MAJEUR",   "client/page.tsx, client/factures/page.tsx + sidebar"],
        ["P-03", "Rayons trop grands (12-28px) — apparence generique arrondie",         "MAJEUR",   "globals.css, hq/index.tsx"],
        ["P-04", "Cartes trop espacees, padding excessif, zones vides",                 "MAJEUR",   "Toutes les pages client"],
        ["P-05", "globals.css declare color-scheme:light mais body bg est #111111",     "MOYEN",    "globals.css"],
        ["P-06", "ACCENT_OPTIONS du ThemeProvider inclut 'or' comme premier choix",     "MOYEN",    "lib/theme-context.tsx"],
        ["P-07", "const GOLD hardcode dans composants (Sidebar, Accueil...)",           "MOYEN",    "nav/Sidebar.tsx, client/page.tsx"],
        ["P-08", "Absence de tokens CSS globaux pour le systeme Admin (HQ est JS)",     "MINEUR",   "hq/index.tsx"],
        ["P-09", "Fonts Google importees en CSS mais sans preconnect dans le head",     "MINEUR",   "globals.css"],
        ["P-10", "Mode clair admin manque de contraste pour textes sur fond blanc",     "MINEUR",   "hq/index.tsx LIGHT_VARS"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in problems],
              colWidths=[PW*0.06, PW*0.38, PW*0.11, PW*0.45])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    # === 2. INVENTAIRE DESIGN SYSTEM ACTUEL =================================
    s.append(Paragraph("2. Inventaire du design system actuel", H1))

    s.append(Paragraph("2.1 Systeme Admin — HQ/V (src/components/hq/index.tsx)", H2))
    s.append(Paragraph(
        "Systeme JavaScript d'objets HQ et V utilises via inline styles dans les 60+ pages admin. "
        "Architecture correcte mais couleur or incorrecte. Le mecanisme HQThemeStyle injecte les "
        "variables CSS dans :root via dangerouslySetInnerHTML — fonctionne bien.",
        BD))
    admin_tokens = [
        ["Token HQ actuel", "Valeur actuelle", "Valeur cible", "Changement"],
        ["HQ.bg",           "#0B0D12",         "#101114",      "Ajuster"],
        ["HQ.sidebar",      "#0F1117",          "#0E1016",     "Ajuster"],
        ["HQ.card",         "#141720",          "#16181E",     "Ajuster"],
        ["HQ.surface",      "#171A22",          "#1C1F2B",     "Ajuster"],
        ["HQ.gold",         "#C9A55A",          "#FFB900",     "CRITIQUE"],
        ["HQ.goldR",        "201,165,90",       "255,185,0",   "CRITIQUE"],
        ["HQ.text",         "#F5F5F3",          "#F0F0F0",     "Mineur"],
        ["HQ.textSub",      "#87909E",          "#8A8F9C",     "Mineur"],
        ["HQ.r.sm",         "8px",              "6px",         "Compactifier"],
        ["HQ.r.md",         "12px",             "8px",         "Compactifier"],
        ["HQ.r.lg",         "16px",             "12px",        "Compactifier"],
        ["HQ.r.xl",         "20px",             "16px",        "Compactifier"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in admin_tokens],
              colWidths=[PW*0.22, PW*0.22, PW*0.22, PW*0.34])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    s.append(Paragraph("2.2 Systeme Client — ThemeProvider + tok() (src/lib/theme-context.tsx)", H2))
    s.append(Paragraph(
        "Le logiciel client utilise un React Context (ThemeProvider) avec hook useTheme(). "
        "Chaque page client definit localement une fonction tok(isDark) retournant ses propres "
        "couleurs — cela cree des inconsistances entre pages. L'accent par defaut est or (#c9a55a).",
        BD))

    s.append(Paragraph("2.3 CSS globaux (src/app/globals.css)", H2))
    s.append(Paragraph(
        "Contient les tokens CSS pour le site vitrine et partiellement le logiciel client. "
        "Utilise Tailwind v4 (@import 'tailwindcss'). La palette or (#c9a55a) doit etre "
        "remplacee par le jaune DJAMA (#FFB900). Les rayons doivent etre reduces.",
        BD))

    # === 3. PALETTE DJAMA OFFICIELLE ========================================
    s.append(Paragraph("3. Palette DJAMA officielle", H1))
    s.append(Paragraph(
        "La palette officielle est derivee du logo DJAMA (noir + jaune). "
        "Pas d'or, pas de beige, pas de dore. Jaune vif et contraste sur fond sombre.",
        BD))

    palette = [
        ["Nom", "Token", "Hex", "RGB", "Usage"],
        ["Jaune DJAMA",   "--djama-yellow",    "#FFB900", "255 185 0",   "Accent principal, boutons CTA, elements actifs"],
        ["Jaune survol",  "--djama-yellow-h",  "#FFC41A", "255 196 26",  "Hover sur elements jaunes"],
        ["Jaune fond",    "--djama-yellow-bg", "#FFB90014","—",          "Fond subtil elements actifs"],
        ["Noir profond",  "--djama-black",     "#101114", "16 17 20",    "Background principal, sidebar"],
        ["Anthracite",    "--djama-anthracite","#191B20", "25 27 32",    "Background page principale"],
        ["Surface 1",     "--djama-s1",        "#1E2029", "30 32 41",    "Cartes niveau 1"],
        ["Surface 2",     "--djama-s2",        "#23262F", "35 38 47",    "Surfaces elevees"],
        ["Surface hover", "--djama-s-hov",     "#2A2E3A", "42 46 58",    "Hover surfaces"],
        ["Blanc doux",    "--djama-white",     "#F0F0F0", "240 240 240", "Texte principal"],
        ["Gris 1",        "--djama-g1",        "#8C909C", "140 144 156", "Texte secondaire"],
        ["Gris 2",        "--djama-g2",        "#555968", "85 89 104",   "Texte tertiaire, labels"],
        ["Bordure fine",  "--djama-border",    "rgba(255,255,255,0.08)","—","Separateurs, contours cartes"],
        ["Succes",        "--djama-success",   "#22C55E", "34 197 94",   "Statuts OK, confirmations"],
        ["Erreur",        "--djama-error",     "#EF4444", "239 68 68",   "Alertes, rejets"],
        ["Avertissement", "--djama-warn",      "#F59E0B", "245 158 11",  "Prudence, en attente"],
        ["Info",          "--djama-info",      "#3B82F6", "59 130 246",  "Elements informatifs"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in palette],
              colWidths=[PW*0.14, PW*0.2, PW*0.1, PW*0.14, PW*0.42])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    # === 4. TYPOGRAPHIE =====================================================
    s.append(Paragraph("4. Typographie", H1))
    typo = [
        ["Element",         "Police",         "Taille", "Graisse", "Espacement ligne"],
        ["Titre H1",        "Inter",          "20px",   "700",     "28px"],
        ["Titre H2",        "Inter",          "16px",   "600",     "24px"],
        ["Titre H3",        "Inter",          "13px",   "600",     "20px"],
        ["Corps standard",  "Inter",          "13px",   "400",     "20px"],
        ["Corps compact",   "Inter",          "12px",   "400",     "18px"],
        ["Label/Caption",   "Inter",          "11px",   "500",     "16px"],
        ["Chiffre KPI",     "Inter",          "24px",   "700",     "32px"],
        ["Chiffre moyen",   "Inter",          "18px",   "600",     "28px"],
        ["Code/Monospace",  "JetBrains Mono", "12px",   "400",     "18px"],
        ["Badge/Tag",       "Inter",          "11px",   "500",     "16px"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in typo],
              colWidths=[PW*0.24, PW*0.18, PW*0.12, PW*0.12, PW*0.34])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    # === 5. COMPOSANTS ======================================================
    s.append(Paragraph("5. Composants — specifications", H1))

    comp_specs = [
        ["Composant",        "Specifications"],
        ["Bouton primaire",  "bg:#FFB900 / text:#101114 / border:none / radius:6px / px:16px py:8px / font:13px 600"],
        ["Bouton secondaire","bg:transparent / border:rgba(255,255,255,0.12) / radius:6px / text:white/70 / hover:white/90"],
        ["Bouton danger",    "bg:rgba(239,68,68,0.12) / text:#EF4444 / border:rgba(239,68,68,0.20) / hover bg intensifie"],
        ["Input",            "bg:rgba(255,255,255,0.04) / border:rgba(255,255,255,0.08) / radius:6px / focus border:#FFB900"],
        ["Carte",            "bg:#1E2029 / border:rgba(255,255,255,0.07) / radius:8px / p:16px"],
        ["Badge actif",      "bg:rgba(34,197,94,0.12) / text:#22C55E / radius:4px / px:8px py:2px / font:11px"],
        ["Badge erreur",     "bg:rgba(239,68,68,0.12) / text:#EF4444 / radius:4px"],
        ["Badge neutre",     "bg:rgba(255,255,255,0.06) / text:white/40 / radius:4px"],
        ["Tableau ligne",    "hover:bg:rgba(255,255,255,0.03) / bordure bas:rgba(255,255,255,0.05)"],
        ["Sidebar item actif","bg:rgba(255,185,0,0.10) / text:#FFB900 / bordure gauche 2px #FFB900"],
        ["Tooltip",          "bg:#1E2029 / border:rgba(255,255,255,0.10) / shadow prononce / radius:6px"],
        ["Modal",            "bg:#191B20 / border:rgba(255,255,255,0.08) / radius:12px / backdrop blur"],
        ["KPI Tile",         "compact: p:14px / titre:11px/textSub / valeur:22px bold / tendance:11px"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in comp_specs],
              colWidths=[PW*0.22, PW*0.78])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    # === 6. PLAN DE REFONTE =================================================
    s.append(Paragraph("6. Plan de refonte — phases et etapes", H1))

    plan = [
        ["Etape", "Description", "Fichiers", "Statut"],
        ["A — Audit",           "Inventaire complet design actuel, identification problemes",
         "Ce document",         "COMPLETE"],
        ["B — Fondations",      "Mise a jour tokens HQ/V, globals.css, theme-context — jaune #FFB900",
         "hq/index.tsx, globals.css, theme-context.tsx", "EN COURS"],
        ["C1 — Admin Dashboard","Prototype dense: KPIs compacts, graphiques, yellow accent",
         "admin/page.tsx",      "EN COURS"],
        ["C2 — Admin Remboursements","Table dense, filtres, statuts, boutons jaunes",
         "admin/remboursements/page.tsx", "EN COURS"],
        ["C3 — Client Accueil","Lanceur applis, quick actions, activite recente",
         "client/page.tsx",     "EN COURS"],
        ["C4 — Client Factures","Liste professionnelle, editeur document, filtres",
         "client/factures/page.tsx", "EN COURS"],
        ["D — Validation",      "Screenshots dark + clair, presentation pour validation",
         "—",                   "EN ATTENTE"],
        ["E — Generalisation",  "Application aux 50+ pages restantes apres validation",
         "Toutes pages",        "INTERDIT avant D"],
    ]
    t = Table([[Paragraph(c, SM) for c in row] for row in plan],
              colWidths=[PW*0.2, PW*0.42, PW*0.24, PW*0.14])
    t.setStyle(ts())
    s += [t, Spacer(1, 10)]

    # === 7. REGLES ABSOLUES =================================================
    s.append(Paragraph("7. Regles absolues de la refonte", H1))
    rules = [
        "Travail en environnement local uniquement.",
        "Aucun deploiement en production.",
        "Aucune migration de base de donnees distante.",
        "Aucune suppression de donnees.",
        "Aucun push force.",
        "Pas de doره, beige dore, degrade metallique, couleurs pastel dominantes.",
        "Pas d'emojis comme icones — Lucide uniquement.",
        "Jaune #FFB900 utilise uniquement pour les accents, pas comme fond general.",
        "Boutons primaires : fond jaune #FFB900 + texte noir #101114.",
        "Ne pas modifier les API, tables Supabase, RLS, permissions, workflows metier.",
        "Ne pas supprimer de fonctionnalites pour simplifier le design.",
        "Ne pas generaliser avant validation des 4 prototypes.",
    ]
    for r in rules:
        s.append(Paragraph(f"• {r}", BD))

    s += [
        Spacer(1, 20),
        HRFlowable(width="100%", thickness=1, color=DJAMA_Y),
        Spacer(1, 6),
        Paragraph(f"DJAMA Design System V1 | Audit initial | {DATE}", SM),
        Paragraph("Document confidentiel — usage interne uniquement", SM),
    ]

    doc.build(s)
    print("[OK] DJAMA_DESIGN_SYSTEM_GLOBAL_V1.pdf genere")

if __name__ == "__main__":
    build()
