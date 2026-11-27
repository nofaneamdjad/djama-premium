"""
DJAMA Digital Human — Setup Network Volume
===========================================
À exécuter UNE SEULE FOIS sur un RunPod pod avec le Network Volume monté.

Usage depuis RunPod Terminal :
  python /app/setup_volume.py

Le script télécharge ~8 GB de modèles dans /runpod-volume/models/.
Durée estimée : 10-20 min selon la bande passante RunPod.
"""

import os
import sys
import shutil
import requests
from pathlib import Path

# Monkey-patch huggingface_hub 0.17.3
import huggingface_hub
if not hasattr(huggingface_hub, "cached_download"):
    huggingface_hub.cached_download = huggingface_hub.hf_hub_download

from huggingface_hub import snapshot_download

MODELS_DIR = Path(os.environ.get("MODELS_DIR", "/runpod-volume/models"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print(f"=== DJAMA Digital Human — Setup Volume ===")
print(f"Destination : {MODELS_DIR}")
print()


def dl_hf(repo_id: str, local_dir: str):
    import time
    path = MODELS_DIR / local_dir
    if path.exists() and any(path.iterdir()):
        print(f"  ✓ {local_dir} (déjà présent)")
        return
    for attempt in range(1, 4):
        try:
            print(f"  ↓ {repo_id} → {local_dir} (tentative {attempt}/3)")
            snapshot_download(
                repo_id=repo_id,
                local_dir=str(path),
                force_download=(attempt > 1),
            )
            print(f"  ✓ {local_dir}")
            return
        except Exception as e:
            print(f"  ⚠ Erreur : {e}")
            if attempt < 3:
                print(f"  ↺ Nettoyage et retry dans 10s...")
                shutil.rmtree(path, ignore_errors=True)
                path.mkdir(parents=True, exist_ok=True)
                time.sleep(10)
            else:
                raise


def dl_url(url: str, dest: str):
    path = MODELS_DIR / dest
    if path.exists():
        print(f"  ✓ {dest} (déjà présent)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"  ↓ {dest}")
    resp = requests.get(url, stream=True, timeout=300)
    resp.raise_for_status()
    path.write_bytes(resp.content)
    print(f"  ✓ {dest}")


print("1/7  MuseTalk V1.5 (~2.5 GB)...")
dl_hf("TMElyralab/MuseTalk", "musetalk")

print("2/7  SD 1.5 VAE (~335 MB)...")
dl_hf("stabilityai/sd-vae-ft-mse", "sd-vae-ft-mse")

print("3/7  DWPose (~200 MB)...")
dl_hf("yzd-v/DWPose", "dwpose")

print("4/7  Whisper-tiny (~37 MB)...")
dl_hf("openai/whisper-tiny", "whisper-tiny")

print("5/7  LivePortrait (~1.8 GB)...")
dl_hf("KwaiVGI/LivePortrait", "liveportrait")

print("6/7  BiSeNet face parser...")
face_parse_dir = MODELS_DIR / "face_parse"
face_parse_dir.mkdir(exist_ok=True)
dl_url(
    "https://drive.google.com/uc?id=154JgKpzCPW82qINcVieuPH3fZ2e0P812",
    "face_parse/79999_iter.pth",
)
dl_url(
    "https://download.pytorch.org/models/resnet18-5c106cde.pth",
    "face_parse/resnet18-5c106cde.pth",
)

print("7/7  Piper TTS (~150 MB)...")
piper_dir = MODELS_DIR / "piper"
piper_dir.mkdir(exist_ok=True)
PIPER_VOICES = {
    "fr_FR-siwis-medium.onnx":       "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "fr_FR-siwis-medium.onnx.json":  "https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json",
    "en_US-lessac-medium.onnx":      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "en_US-lessac-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
}
for fname, url in PIPER_VOICES.items():
    dl_url(url, f"piper/{fname}")

# Symlinks pour MuseTalk (attend ses modèles dans ./models/)
print()
print("Création des symlinks MuseTalk...")
musetalk_models = Path("/app/MuseTalk/models")
musetalk_models.mkdir(exist_ok=True)
links = {
    "musetalk":      MODELS_DIR / "musetalk",
    "sd-vae-ft-mse": MODELS_DIR / "sd-vae-ft-mse",
    "dwpose":        MODELS_DIR / "dwpose",
    "whisper":       MODELS_DIR / "whisper-tiny",
    "face_parse":    MODELS_DIR / "face_parse",
}
for name, target in links.items():
    link = musetalk_models / name
    if link.exists() or link.is_symlink():
        link.unlink()
    link.symlink_to(target)
    print(f"  ✓ /app/MuseTalk/models/{name} → {target}")

# Symlink LivePortrait
lp_weights = Path("/app/LivePortrait/pretrained_weights")
if lp_weights.exists() or lp_weights.is_symlink():
    lp_weights.unlink()
lp_weights.symlink_to(MODELS_DIR / "liveportrait")
print(f"  ✓ /app/LivePortrait/pretrained_weights → {MODELS_DIR}/liveportrait")

print()
print("=== Setup terminé ✓ ===")
print(f"Modèles dans : {MODELS_DIR}")
print("Tu peux maintenant déployer l'endpoint Serverless.")
