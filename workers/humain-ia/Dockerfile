# DJAMA Digital Human Worker
# Base : RunPod PyTorch 2.0.1 · CUDA 11.8 · Python 3.10
# Compatible RTX 4090 (24 GB VRAM)
#
# Build : docker build -t riyann/djama-humain-ia:v1 .
# Push  : docker push riyann/djama-humain-ia:v1
#
# Les modèles (~8 GB) sont sur un RunPod Network Volume.
# Lancer setup_volume.py une seule fois sur un pod avec le volume monté.

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

# ── Code handler ─────────────────────────────────────────────────
COPY handler.py      /app/handler.py
COPY pipeline.py     /app/pipeline.py
COPY tts.py          /app/tts.py
COPY setup_volume.py /app/setup_volume.py

# ── Variables d'environnement ────────────────────────────────────
ENV PYTHONPATH="/app/MuseTalk:/app/LivePortrait:/app"
ENV HF_HOME="/runpod-volume/hf_cache"
ENV TORCH_HOME="/runpod-volume/torch_cache"
# Les modèles sont sur le Network Volume
ENV MODELS_DIR="/runpod-volume/models"

# ── Point d'entrée RunPod ────────────────────────────────────────
CMD ["python", "-u", "/app/handler.py"]
