"""
DJAMA Digital Human — TTS Module
=================================
Priorité :
  1. ElevenLabs API  (voix premium, ~0.3s latence)
  2. Piper local     (fallback offline, ~0.5s latence)

Retourne : chemin vers un fichier WAV temporaire
"""

import os
import time
import tempfile
import subprocess
import requests
from pathlib import Path

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
PIPER_BINARY       = "/usr/local/bin/piper"
PIPER_MODEL        = "/app/models/piper/fr_FR-siwis-medium.onnx"
PIPER_CONFIG       = "/app/models/piper/fr_FR-siwis-medium.onnx.json"

# Modèles Piper par langue
PIPER_MODELS: dict[str, tuple[str, str]] = {
    "fr": (
        "/app/models/piper/fr_FR-siwis-medium.onnx",
        "/app/models/piper/fr_FR-siwis-medium.onnx.json",
    ),
    "en": (
        "/app/models/piper/en_US-lessac-medium.onnx",
        "/app/models/piper/en_US-lessac-medium.onnx.json",
    ),
    "es": (
        "/app/models/piper/es_ES-mls_10246-low.onnx",
        "/app/models/piper/es_ES-mls_10246-low.onnx.json",
    ),
    "ar": (
        "/app/models/piper/ar_JO-kareem-medium.onnx",
        "/app/models/piper/ar_JO-kareem-medium.onnx.json",
    ),
}


def generate_audio(script: str, voice_id: str = "", language: str = "fr") -> tuple[str, float]:
    """
    Génère l'audio depuis le script.
    Retourne (chemin_wav, durée_secondes).
    """
    t0 = time.perf_counter()

    if ELEVENLABS_API_KEY and voice_id:
        wav_path = _elevenlabs(script, voice_id)
    else:
        wav_path = _piper(script, language)

    elapsed = time.perf_counter() - t0
    print(f"[tts] Audio généré en {elapsed:.2f}s : {wav_path}")
    return wav_path, elapsed


def _elevenlabs(script: str, voice_id: str) -> str:
    """Appel ElevenLabs API → WAV."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": script,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
        },
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"ElevenLabs erreur {resp.status_code}: {resp.text[:200]}")

    # Sauvegarder le MP3, convertir en WAV pour MuseTalk
    mp3_tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    mp3_tmp.write(resp.content)
    mp3_tmp.close()

    wav_path = mp3_tmp.name.replace(".mp3", ".wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", mp3_tmp.name, "-ar", "16000", "-ac", "1", wav_path],
        check=True, capture_output=True,
    )
    os.unlink(mp3_tmp.name)
    return wav_path


def _piper(script: str, language: str = "fr") -> str:
    """Piper local TTS → WAV."""
    lang = language if language in PIPER_MODELS else "fr"
    model_path, config_path = PIPER_MODELS[lang]

    if not Path(model_path).exists():
        # Fallback français
        model_path, config_path = PIPER_MODELS["fr"]
        if not Path(model_path).exists():
            raise RuntimeError(f"Modèle Piper introuvable : {model_path}")

    wav_tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    wav_path = wav_tmp.name
    wav_tmp.close()

    cmd = [
        PIPER_BINARY,
        "--model",   model_path,
        "--config",  config_path,
        "--output_file", wav_path,
    ]
    result = subprocess.run(
        cmd,
        input=script.encode("utf-8"),
        capture_output=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Piper erreur: {result.stderr.decode()[:300]}")

    # Resample à 16kHz pour MuseTalk
    wav_16k = wav_path.replace(".wav", "_16k.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-ar", "16000", "-ac", "1", wav_16k],
        check=True, capture_output=True,
    )
    os.unlink(wav_path)
    return wav_16k
