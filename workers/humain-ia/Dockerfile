# DJAMA Digital Human Worker
# Base : RunPod PyTorch 2.0.1 · CUDA 11.8 · Python 3.10
# Compatible RTX 4090 (24 GB VRAM)
#
# Build : docker build -t djama/humain-ia:latest .
# Push  : docker push djama/humain-ia:latest
# (puis déployer sur RunPod Serverless)

FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel-ubuntu22.04

WORKDIR /app

# ── Paquets système ──────────────────────────────────────────────
RUN apt-get update -qq && apt-get install -y -qq \
    git wget curl ffmpeg \
    libsm6 libxext6 libgl1-mesa-glx libglib2.0-0 \
    unzip p7zip-full build-essential \
    && rm -rf /var/lib/apt/lists/*

# ── Piper TTS (binaire statique) ────────────────────────────────
RUN wget -q "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz" \
    -O /tmp/piper.tar.gz \
    && tar -xzf /tmp/piper.tar.gz -C /tmp/ \
    && cp /tmp/piper/piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm -rf /tmp/piper.tar.gz /tmp/piper

# ── Dépendances Python ───────────────────────────────────────────
# PyTorch déjà dans l'image de base
# On installe uniquement ce qui n'est pas déjà présent
RUN pip install --no-cache-dir \
    runpod==1.6.2 \
    pyyaml==6.0.1 \
    requests==2.31.0 \
    opencv-python-headless==4.8.0.76 \
    Pillow==9.5.0 \
    numpy==1.24.4 \
    scipy==1.11.1 \
    scikit-image==0.21.0 \
    huggingface_hub==0.17.3 \
    accelerate==0.21.0 \
    xformers==0.0.21 \
    diffusers==0.19.3 \
    transformers==4.31.0 \
    soundfile==0.12.1 \
    librosa==0.10.1

# ── mmlab (requis par MuseTalk / DWPose) ────────────────────────
RUN pip install --no-cache-dir openmim==0.3.9 \
    && mim install "mmengine==0.8.4" \
    && mim install "mmcv>=2.0.1,<2.1.0" \
    && mim install "mmdet>=3.1.0,<3.2.0" \
    && mim install "mmpose>=1.1.0,<1.2.0"

# ── Cloner MuseTalk V1.5 ─────────────────────────────────────────
# sed -i : supprime les lignes --hash en place (hash mismatch réseau)
RUN git clone --depth 1 https://github.com/TMElyralab/MuseTalk.git /app/MuseTalk \
    && cd /app/MuseTalk \
    && sed -i '/^\s*--hash/d; /^\s*\\\\/d; s/ \\$//' requirements.txt \
    && pip install --no-cache-dir -r requirements.txt

# ── Cloner LivePortrait ──────────────────────────────────────────
RUN git clone --depth 1 https://github.com/KwaiVGI/LivePortrait.git /app/LivePortrait \
    && cd /app/LivePortrait \
    && for f in requirements*.txt; do \
         sed -i '/^\s*--hash/d; /^\s*\\\\/d; s/ \\$//' "$f"; \
       done \
    && pip install --no-cache-dir -r requirements.txt

# ── Fix structure modèles MuseTalk (nested vs flat) ─────────────
# MuseTalk attend les poids dans ./models/ avec structure plate
# snapshot_download crée une structure imbriquée → corriger via symlinks dans download_models.py

# ── Télécharger les modèles au build ────────────────────────────
COPY download_models.py /app/download_models.py
RUN python /app/download_models.py

# ── Fix symlinks modèles MuseTalk ───────────────────────────────
RUN mkdir -p /app/MuseTalk/models \
    && ln -sfn /app/models/musetalk /app/MuseTalk/models/musetalk \
    && ln -sfn /app/models/sd-vae-ft-mse /app/MuseTalk/models/sd-vae-ft-mse \
    && ln -sfn /app/models/dwpose /app/MuseTalk/models/dwpose \
    && ln -sfn /app/models/whisper-tiny /app/MuseTalk/models/whisper \
    && ln -sfn /app/models/face_parse /app/MuseTalk/models/face_parse

# Fix : copier config.json MuseTalk (structure Musetalk HF vs repo)
RUN python - << 'EOF'
import os, json, shutil
from pathlib import Path

# MuseTalk attend : models/musetalk/musetalk.json + unet/ + ...
# HF snapshot crée parfois une structure différente → vérifier et corriger
src = Path("/app/models/musetalk")
dst_link = Path("/app/MuseTalk/models/musetalk")

# S'assurer que musetalk.json existe
if not (src / "musetalk.json").exists():
    # Chercher dans sous-dossiers
    jsons = list(src.rglob("musetalk.json"))
    if jsons:
        shutil.copy(jsons[0], src / "musetalk.json")
        print(f"Copié musetalk.json depuis {jsons[0]}")

print("Structure modèles OK")
EOF

# Modèles LivePortrait
RUN ln -sfn /app/models/liveportrait /app/LivePortrait/pretrained_weights

# ── Code handler ─────────────────────────────────────────────────
COPY handler.py  /app/handler.py
COPY pipeline.py /app/pipeline.py
COPY tts.py      /app/tts.py

# ── Variables d'environnement ────────────────────────────────────
ENV PYTHONPATH="/app/MuseTalk:/app/LivePortrait:/app"
ENV HF_HOME="/app/models/hf_cache"
ENV TORCH_HOME="/app/models/torch_cache"

# ── Point d'entrée RunPod ────────────────────────────────────────
CMD ["python", "-u", "/app/handler.py"]
