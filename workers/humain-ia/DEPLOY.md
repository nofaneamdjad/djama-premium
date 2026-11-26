# Guide de déploiement — Digital Human DJAMA

Checklist complète pour mettre en production le module Humain Numérique.

---

## Étape 1 — Supabase Storage

Ouvrir le SQL Editor du projet Supabase et exécuter **en tant que service_role** :

```sql
-- Copier-coller le contenu de :
-- supabase/migrations/20261126000001_humain_ia_jobs.sql  (table + RLS)
-- supabase/migrations/20261126000002_humain_ia_portraits_bucket.sql  (buckets)
```

Vérifier dans Storage → Buckets que ces deux buckets apparaissent :
- `digital-human-videos` (public, 10 MB max)
- `humain-ia-portraits` (public, 5 MB max)

---

## Étape 2 — Build Docker

Installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) puis :

```powershell
# Windows
cd workers\humain-ia
docker login   # entrer vos credentials Docker Hub
.\build.ps1 -Tag "VOTRE_USERNAME/djama-humain-ia:v1"
```

```bash
# Linux / Mac
cd workers/humain-ia
docker login
./build.sh VOTRE_USERNAME/djama-humain-ia:v1
```

Le build dure **30–60 minutes** (téléchargement ~8 GB de poids de modèles).

---

## Étape 3 — Endpoint RunPod Serverless

1. Aller sur https://www.runpod.io/console/serverless
2. Cliquer **New Endpoint**
3. Remplir :
   - **Container Image** : `VOTRE_USERNAME/djama-humain-ia:v1`
   - **Container Disk** : `20 GB`
   - **GPU** : `NVIDIA RTX 4090` (24 GB VRAM requis)
   - **Min Workers** : `0` (scale to zero = économique)
   - **Max Workers** : `3`
   - **Idle Timeout** : `60` secondes
4. Cliquer **Deploy**
5. Copier l'**Endpoint ID** (format : `xxxxxxxxxxxxxxxx`)

> **Coût estimé** : ~$0.08/appel · 3 req/h/utilisateur · cold start 30–90s

---

## Étape 4 — Variables d'environnement

### Développement local (`.env.local`)

```env
RUNPOD_API_KEY=rp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RUNPOD_ENDPOINT_ID=xxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Production (Vercel Dashboard → Settings → Environment Variables)

Ajouter les mêmes 3 variables avec les valeurs de production.

> Obtenir les clés :
> - RunPod : https://www.runpod.io/console/user/settings → API Keys
> - ElevenLabs : https://elevenlabs.io/app/settings/api-keys

---

## Étape 5 — Vérification locale

```bash
npm run dev
```

Aller sur `/client/humain-ia` :
1. Sélectionner un assistant
2. Uploader une photo portrait (JPG/PNG, visage centré, bonne luminosité)
3. Saisir un script court (5–10 secondes de parole)
4. Cliquer **Générer la vidéo**
5. Attendre ~60–120s (cold start inclus)
6. Vérifier la vidéo

---

## Étape 6 — Déploiement production

```bash
git push origin master
```

Vercel déploie automatiquement. Vérifier dans Vercel Logs que les routes
`/api/humain-ia/*` s'initialisent sans erreur.

---

## Troubleshooting

| Symptôme | Cause | Solution |
|---|---|---|
| `503 RunPod endpoint indisponible` | Endpoint non créé ou ID incorrect | Vérifier `RUNPOD_ENDPOINT_ID` |
| `Upload échoué` | Bucket Storage absent | Exécuter les migrations SQL |
| Cold start > 3 min | Modèles non mis en cache | Attendre la 2e requête (warm) |
| Vidéo muette | Voix ElevenLabs invalide | Vérifier `ELEVENLABS_API_KEY` ou utiliser voix Piper (id vide) |
| Lèvres désynchronisées | Portrait de mauvaise qualité | Utiliser photo frontale, bonne lumière, 512×512 idéal |

---

## Architecture de coût

| Usage | Coût estimé |
|---|---|
| 1 vidéo (60s pipeline) | ~$0.08 RunPod + ~$0.01 ElevenLabs |
| 100 vidéos/mois | ~$9/mois |
| 1 000 vidéos/mois | ~$90/mois |

Scale to zero : **$0 quand inutilisé** (vs $500–800/mois GPU dédié).
