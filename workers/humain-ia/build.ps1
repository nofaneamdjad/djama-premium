# build.ps1 — Build et push de l'image Docker humain-ia vers Docker Hub
# Usage : .\build.ps1 -Tag "votre-username/djama-humain-ia:v1"
#
# Pré-requis :
#   - Docker Desktop installé et démarré
#   - Connexion Docker Hub : docker login

param(
  [string]$Tag = "djama/humain-ia:latest"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/3] Build de l'image Docker..." -ForegroundColor Cyan
Write-Host "      Tag : $Tag`n"

docker build `
  --platform linux/amd64 `
  --tag $Tag `
  --progress plain `
  --dns 8.8.8.8 `
  --dns 8.8.4.4 `
  $ScriptDir

if ($LASTEXITCODE -ne 0) {
  Write-Host "`n[ERREUR] Build échoué." -ForegroundColor Red
  exit 1
}

Write-Host "`n[2/3] Push vers Docker Hub..." -ForegroundColor Cyan
docker push $Tag

if ($LASTEXITCODE -ne 0) {
  Write-Host "`n[ERREUR] Push échoué. Vérifiez : docker login" -ForegroundColor Red
  exit 1
}

Write-Host "`n[3/3] ✅ Image disponible : $Tag" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaine étape : créer l'endpoint RunPod Serverless avec cette image."
Write-Host "  → https://www.runpod.io/console/serverless"
Write-Host "  → New Endpoint → Container Image : $Tag"
Write-Host "  → GPU : NVIDIA RTX 4090 · Min Workers : 0 · Max Workers : 3"
Write-Host ""
