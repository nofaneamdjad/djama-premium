"""
DJAMA Digital Human — Pipeline MuseTalk + LivePortrait
========================================================
Phase C : Lip-sync via MuseTalk V1.5  (~54s RTX 4090)
Phase D : Animation tête via LivePortrait (~7s RTX 4090, optionnel)

Le pipeline est chargé une fois (warm start RunPod).
Chaque appel reçoit : portrait_url, script, voice_id, language, use_liveportrait.
"""

import os
import sys
import time
import base64
import tempfile
import subprocess
import shutil
import json
import requests
import numpy as np
from pathlib import Path
from typing import Optional

# ── Chemins ─────────────────────────────────────────────────────
MUSETALK_DIR     = Path("/app/MuseTalk")
LIVEPORTRAIT_DIR = Path("/app/LivePortrait")
# Les modèles sont sur le RunPod Network Volume (ou /app/models en local)
MODELS_DIR       = Path(os.environ.get("MODELS_DIR", "/runpod-volume/models"))
WORK_DIR         = Path("/tmp/djama_dh")

# ── Monkey-patch huggingface_hub (v0.17.3 missing cached_download attr) ──
def _patch_hf_hub():
    try:
        import huggingface_hub
        if not hasattr(huggingface_hub, "cached_download"):
            huggingface_hub.cached_download = huggingface_hub.hf_hub_download
        if not hasattr(huggingface_hub.constants, "HF_HUB_CACHE"):
            huggingface_hub.constants.HF_HUB_CACHE = os.environ.get(
                "HF_HOME", str(Path.home() / ".cache" / "huggingface")
            )
    except ImportError:
        pass

_patch_hf_hub()

from tts import generate_audio


class DigitalHumanPipeline:
    """Pipeline complet : TTS → MuseTalk → (LivePortrait)."""

    def __init__(self):
        WORK_DIR.mkdir(parents=True, exist_ok=True)
        self._verify_models()
        print("[pipeline] Prêt.")

    # ── Vérification ────────────────────────────────────────────

    def _verify_models(self):
        required = [
            MODELS_DIR / "musetalk" / "musetalk.json",
            MODELS_DIR / "sd-vae-ft-mse" / "config.json",
            MODELS_DIR / "dwpose",
            MODELS_DIR / "face_parse" / "79999_iter.pth",
        ]
        missing = [str(p) for p in required if not p.exists()]
        if missing:
            raise RuntimeError(f"Modèles manquants : {missing}")

    # ── Entrée principale ────────────────────────────────────────

    def generate(
        self,
        portrait_url: str,
        script: str,
        voice_id: str = "",
        language: str = "fr",
        use_liveportrait: bool = False,
    ) -> dict:
        job_id = f"job_{int(time.time() * 1000)}"
        job_dir = WORK_DIR / job_id
        job_dir.mkdir(parents=True)

        try:
            t_total = time.perf_counter()

            # Phase A : télécharger le portrait
            portrait_path = self._download_portrait(portrait_url, job_dir)

            # Phase B : TTS
            print(f"[pipeline:{job_id}] Phase B — TTS...")
            audio_path, tts_s = generate_audio(script, voice_id, language)

            # Phase C : MuseTalk lip-sync
            print(f"[pipeline:{job_id}] Phase C — MuseTalk...")
            t_muse = time.perf_counter()
            musetalk_video = self._run_musetalk(portrait_path, audio_path, job_dir)
            musetalk_s = time.perf_counter() - t_muse
            print(f"[pipeline:{job_id}] MuseTalk : {musetalk_s:.1f}s")

            # Phase D : LivePortrait (optionnel)
            lp_s = 0.0
            final_video = musetalk_video

            if use_liveportrait:
                print(f"[pipeline:{job_id}] Phase D — LivePortrait...")
                t_lp = time.perf_counter()
                lp_video = self._run_liveportrait(portrait_path, musetalk_video, job_dir)
                lp_s = time.perf_counter() - t_lp
                print(f"[pipeline:{job_id}] LivePortrait : {lp_s:.1f}s")
                final_video = lp_video

            # Lire la durée via ffprobe
            duration_s = self._get_duration(audio_path)

            # Encoder en base64
            with open(final_video, "rb") as f:
                video_b64 = base64.b64encode(f.read()).decode("utf-8")

            # Compter les frames
            frames = self._count_frames(final_video)

            total_s = time.perf_counter() - t_total
            print(f"[pipeline:{job_id}] Total : {total_s:.1f}s")

            return {
                "video_base64": video_b64,
                "duration_s":   round(duration_s, 2),
                "musetalk_s":   round(musetalk_s, 1),
                "lp_s":         round(lp_s, 1),
                "total_s":      round(total_s, 1),
                "frames":       frames,
                "job_id":       job_id,
            }

        finally:
            # Nettoyage espace disque
            shutil.rmtree(job_dir, ignore_errors=True)

    # ── Helpers ─────────────────────────────────────────────────

    def _download_portrait(self, url: str, job_dir: Path) -> Path:
        """Télécharge le portrait et le redimensionne à 512×512."""
        import cv2

        resp = requests.get(url, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"Portrait téléchargement échoué : {resp.status_code}")

        raw_path = job_dir / "portrait_raw.png"
        raw_path.write_bytes(resp.content)

        img = cv2.imread(str(raw_path))
        if img is None:
            raise RuntimeError("Portrait illisible (format non supporté)")

        img_512 = cv2.resize(img, (512, 512), interpolation=cv2.INTER_LANCZOS4)
        portrait_path = job_dir / "portrait.png"
        cv2.imwrite(str(portrait_path), img_512)
        return portrait_path

    def _run_musetalk(self, portrait: Path, audio: Path, job_dir: Path) -> Path:
        """Exécute inference.py de MuseTalk."""
        result_dir = job_dir / "musetalk_out"
        result_dir.mkdir()

        cmd = [
            sys.executable,
            str(MUSETALK_DIR / "inference.py"),
            "--inference_config", str(MUSETALK_DIR / "configs" / "inference" / "test.yaml"),
            "--result_dir", str(result_dir),
        ]

        # MuseTalk attend un fichier de config YAML ou des args directs selon la version
        # On utilise l'interface directe (via config yaml modifié en temp)
        config = self._make_musetalk_config(portrait, audio, result_dir, job_dir)

        cmd = [
            sys.executable,
            str(MUSETALK_DIR / "inference.py"),
            "--inference_config", str(config),
            "--result_dir", str(result_dir),
        ]

        env = os.environ.copy()
        env["PYTHONPATH"] = str(MUSETALK_DIR)

        proc = subprocess.run(
            cmd,
            cwd=str(MUSETALK_DIR),
            env=env,
            capture_output=True,
            timeout=300,
        )

        if proc.returncode != 0:
            stderr = proc.stderr.decode("utf-8", errors="replace")[-2000:]
            raise RuntimeError(f"MuseTalk échoué (rc={proc.returncode}):\n{stderr}")

        # Trouver la vidéo générée
        videos = list(result_dir.glob("*.mp4"))
        if not videos:
            # Chercher dans les sous-dossiers
            videos = list(result_dir.rglob("*_no_musetalk.mp4")) or list(result_dir.rglob("*.mp4"))
        if not videos:
            raise RuntimeError(f"MuseTalk : aucune vidéo générée dans {result_dir}")

        return videos[0]

    def _make_musetalk_config(
        self, portrait: Path, audio: Path, result_dir: Path, job_dir: Path
    ) -> Path:
        """Crée un fichier YAML de config pour MuseTalk."""
        import yaml

        config_data = {
            "inference_config": [
                {
                    "source_video_type": "image",
                    "video_path": str(portrait),
                    "audio_path": str(audio),
                    "bbox_shift": 0,
                    "result_dir": str(result_dir),
                }
            ]
        }

        config_path = job_dir / "musetalk_config.yaml"
        config_path.write_text(yaml.dump(config_data))
        return config_path

    def _run_liveportrait(self, portrait: Path, driving_video: Path, job_dir: Path) -> Path:
        """Exécute LivePortrait pour animer la tête."""
        lp_out = job_dir / "liveportrait_out"
        lp_out.mkdir()

        cmd = [
            sys.executable,
            str(LIVEPORTRAIT_DIR / "inference.py"),
            "--source_image",    str(portrait),
            "--driving_video",   str(driving_video),
            "--output_dir",      str(lp_out),
            "--no_flag_pasteback",  # sortie propre sans mix source
        ]

        env = os.environ.copy()
        env["PYTHONPATH"] = str(LIVEPORTRAIT_DIR)

        proc = subprocess.run(
            cmd,
            cwd=str(LIVEPORTRAIT_DIR),
            env=env,
            capture_output=True,
            timeout=120,
        )

        if proc.returncode != 0:
            # LivePortrait non-bloquant : on retourne la vidéo MuseTalk
            stderr = proc.stderr.decode("utf-8", errors="replace")[-500:]
            print(f"[pipeline] LivePortrait warning (fallback MuseTalk): {stderr}")
            return driving_video

        videos = list(lp_out.rglob("*.mp4"))
        if not videos:
            return driving_video

        # Réencoder avec l'audio original
        video_with_audio = job_dir / "final_with_audio.mp4"
        subprocess.run([
            "ffmpeg", "-y",
            "-i", str(videos[0]),
            "-i", str(driving_video),
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(video_with_audio),
        ], check=True, capture_output=True, timeout=60)

        return video_with_audio if video_with_audio.exists() else videos[0]

    def _get_duration(self, audio_path: Path) -> float:
        """Durée audio via ffprobe."""
        try:
            proc = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "json",
                    str(audio_path),
                ],
                capture_output=True, timeout=15,
            )
            data = json.loads(proc.stdout)
            return float(data["format"]["duration"])
        except Exception:
            return 0.0

    def _count_frames(self, video_path: Path) -> int:
        """Compte les frames via ffprobe."""
        try:
            proc = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=nb_frames",
                    "-of", "json",
                    str(video_path),
                ],
                capture_output=True, timeout=15,
            )
            data = json.loads(proc.stdout)
            return int(data["streams"][0].get("nb_frames", 0))
        except Exception:
            return 0
