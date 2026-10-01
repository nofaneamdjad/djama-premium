#!/usr/bin/env bash
# setup-vps.sh — Installation Collabora sur VPS Ubuntu 22.04
# Exécuter en root ou avec sudo sur le VPS
# Usage : bash setup-vps.sh

set -euo pipefail

DOMAIN="editor.djama.space"
EMAIL="contact@djama.space"
INFRA_DIR="/opt/djama-infra"

echo "=== DJAMA — Installation Collabora Online ==="
echo "Domaine : $DOMAIN"
echo ""

# ── 1. Dépendances système ─────────────────────────────────────────────────────
echo "[1/6] Mise à jour système et installation des dépendances..."
apt-get update -q
apt-get install -y -q curl git certbot

# ── 2. Docker ─────────────────────────────────────────────────────────────────
echo "[2/6] Installation Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version

# ── 3. Copier les fichiers infra ───────────────────────────────────────────────
echo "[3/6] Déploiement des fichiers de configuration..."
mkdir -p "$INFRA_DIR/nginx"
cp docker-compose.yml "$INFRA_DIR/"
cp nginx/editor.conf  "$INFRA_DIR/nginx/"

# ── 4. Certificat SSL Let's Encrypt ───────────────────────────────────────────
echo "[4/6] Obtention du certificat SSL pour $DOMAIN..."
mkdir -p /var/www/certbot

# Lancer un nginx temporaire pour le challenge
docker run -d --rm --name certbot-nginx \
  -p 80:80 \
  -v /var/www/certbot:/var/www/certbot \
  -v /tmp/certbot-nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:1.27-alpine 2>/dev/null || true

# Config nginx minimale pour le challenge
cat > /tmp/certbot-nginx.conf <<'NGINX'
server {
    listen 80;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok"; }
}
NGINX

sleep 2

certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  --non-interactive || echo "Certbot: cert peut-être déjà existant, on continue."

docker stop certbot-nginx 2>/dev/null || true

# ── 5. Variables d'environnement ──────────────────────────────────────────────
echo "[5/6] Configuration des variables d'environnement..."
ENV_FILE="$INFRA_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Créer le fichier $ENV_FILE avec :"
  echo "   COLLABORA_ADMIN=admin"
  echo "   COLLABORA_PASS=<mot_de_passe_fort>"
  echo ""
  read -r -p "Mot de passe admin Collabora : " COLLAB_PASS
  cat > "$ENV_FILE" <<EOF
COLLABORA_ADMIN=admin
COLLABORA_PASS=${COLLAB_PASS}
DJAMA_DOMAIN=djama.space
EOF
  chmod 600 "$ENV_FILE"
fi

# ── 6. Démarrage ──────────────────────────────────────────────────────────────
echo "[6/6] Démarrage des services..."
cd "$INFRA_DIR"
docker compose --env-file .env up -d

echo ""
echo "=== Installation terminée ==="
echo "Collabora disponible sur : https://$DOMAIN"
echo "Admin Collabora : https://$DOMAIN/browser/dist/admin/admin.html"
echo ""
echo "Pour vérifier :"
echo "  docker compose -f $INFRA_DIR/docker-compose.yml logs -f"

# ── Renouvellement automatique SSL (cron) ─────────────────────────────────────
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $INFRA_DIR/docker-compose.yml exec nginx nginx -s reload") | crontab -
echo "Cron renouvellement SSL ajouté."
