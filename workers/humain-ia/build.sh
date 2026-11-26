#!/usr/bin/env bash
# build.sh — Build et push de l'image Docker humain-ia vers Docker Hub
# Usage : ./build.sh [tag]
#   tag par défaut : djama/humain-ia:latest
#
# Pré-requis :
#   - Docker installé et démarré
#   - docker login effectué

set -euo pipefail

TAG="${1:-djama/humain-ia:latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "[1/3] Build de l'image Docker..."
echo "      Tag : $TAG"
echo ""

docker build \
  --platform linux/amd64 \
  --tag "$TAG" \
  --progress plain \
  "$SCRIPT_DIR"

echo ""
echo "[2/3] Push vers Docker Hub..."
docker push "$TAG"

echo ""
echo "[3/3] ✅ Image disponible : $TAG"
echo ""
echo "Prochaine étape : créer l'endpoint RunPod Serverless avec cette image."
echo "  → https://www.runpod.io/console/serverless"
echo "  → New Endpoint → Container Image : $TAG"
echo "  → GPU : NVIDIA RTX 4090 · Min Workers : 0 · Max Workers : 3"
echo ""
