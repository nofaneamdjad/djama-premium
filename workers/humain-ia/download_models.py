"""
Script de téléchargement des modèles — exécuté pendant le build Docker.
Télécharge tous les poids nécessaires dans /app/models/.

Usage: python download_models.py
"""

import os
import sys
import requests
from pathlib import Path

# Monkey-patch huggingface_hub 0.17.3
import huggingface_hub
if not hasattr(huggingface_hub, "cached_download"):
    huggingface_hub.cached_download = huggingface_hub.hf_hub_download
if not hasattr(huggingface_hub.constants, "HF_HUB_CACHE"):
    huggingface_hub.constants.HF_HUB_CACHE = os.environ.get(
        "HF_HOME", str(Path.home() / ".cache" / "huggingface")
    )

from huggingface_hub import snapshot_download

MODELS_DIR = Path("/app/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def dl_hf(repo_id: str, local_dir: str, **_kwargs):
    # ignore_patterns n'existe pas en huggingface_hub 0.17.3 — paramètre ignoré
    path = MODELS_DIR / local_dir
    if path.exists() and any(path.iterdir()):
        print(f"  ✓ {local_dir} (déjà téléchargé)")
        return
    print(f"  ↓ {repo_id} → {local_dir}")
    snapshot_download(
        repo_id=repo_id,
        local_dir=str(path),
    )
    print(f"  ✓ {local_dir}")


def dl_url(url: str, dest: str):
    path = MODELS_DIR / dest
    if path.exists():
        print(f"  ✓ {dest} (déjà téléchargé)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"  ↓ {url} → {dest}")
    resp = requests.get(url, stream=True, timeout=300)
    resp.raise_for_status()
    path.write_bytes(resp.content)
    print(f"  ✓ {dest}")


print("=== Téléchargement modèles DJAMA Digital Human ===")
print()

print("1/7 MuseTalk V1.5 (~2.5 GB)...")
dl_hf("TMElyralab/MuseTalk", "musetalk")

print("2/7 SD 1.5 VAE (~335 MB)...")
dl_hf("stabilityai/sd-vae-ft-mse", "sd-vae-ft-mse")

print("3/7 DWPose (~200 MB)...")
dl_hf("yzd-v/DWPose", "dwpose")

print("4/7 Whisper-tiny (~37 MB)...")
dl_hf("openai/whisper-tiny", "whisper-tiny")

print("5/7 LivePortrait (~1.8 GB)...")
dl_hf("KwaiVGI/LivePortrait", "liveportrait", ignore_patterns=["*.git*", "*.md"])

print("6/7 BiSeNet face parser...")
face_parse_dir = MODELS_DIR / "face_parse"
face_parse_dir.mkdir(exist_ok=True)
# 79999_iter.pth
dl_url(
    "https://drive.google.com/uc?id=154JgKpzCPW82qINcVieuPH3fZ2e0P812",
    "face_parse/79999_iter.pth",
)
# resnet18 backbone
dl_url(
    "https://download.pytorch.org/models/resnet18-5c106cde.pth",
    "face_parse/resnet18-5c106cde.pth",
)

print("7/7 Piper TTS (~150 MB)...")
piper_dir = MODELS_DIR / "piper"
piper_dir.mkdir(exist_ok=True)

PIPER_VOICES = {
    "fr_FR-siwis-medium.onnx":      "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "fr_FR-siwis-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json",
    "en_US-lessac-medium.onnx":     "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "en_US-lessac-medium.onnx.json":"https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
}

for fname, url in PIPER_VOICES.items():
    dl_url(url, f"piper/{fname}")

print()
print("=== Tous les modèles téléchargés ✓ ===")
