"""
DJAMA Digital Human — RunPod Serverless Handler
================================================
Entrée (job["input"]) :
  portrait_url   str   URL d'une image 512×512 (Supabase Storage)
  script         str   Texte à lire par l'avatar
  voice_id       str   ID voix ElevenLabs (ex: "pNInz6obpgDQGcFmaJgB")
  language       str   "fr" | "en" | "es" | "ar" | ...
  use_liveportrait bool  Ajouter animation tête (default: False, +7s)

Sortie :
  video_base64   str   Vidéo MP4 encodée en base64 (512×512 H.264)
  duration_s     float Durée audio en secondes
  musetalk_s     float Temps MuseTalk
  lp_s           float Temps LivePortrait (0 si désactivé)
  total_s        float Temps total pipeline
  frames         int   Nombre de frames

Erreur :
  error          str   Message d'erreur
"""

import runpod
import traceback
from pipeline import DigitalHumanPipeline

# Initialiser le pipeline une seule fois (warm start)
_pipeline: DigitalHumanPipeline | None = None

def _get_pipeline() -> DigitalHumanPipeline:
    global _pipeline
    if _pipeline is None:
        print("[handler] Initialisation pipeline (cold start)...")
        _pipeline = DigitalHumanPipeline()
        print("[handler] Pipeline prêt.")
    return _pipeline


def handler(job: dict) -> dict:
    inp = job.get("input", {})

    portrait_url    = inp.get("portrait_url", "")
    script          = inp.get("script", "").strip()
    voice_id        = inp.get("voice_id", "")
    language        = inp.get("language", "fr")
    use_liveportrait = inp.get("use_liveportrait", False)

    # Validation
    if not portrait_url:
        return {"error": "portrait_url est requis"}
    if not script:
        return {"error": "script est requis"}
    if len(script) > 2000:
        return {"error": "script trop long (max 2000 caractères)"}

    try:
        pipeline = _get_pipeline()
        result = pipeline.generate(
            portrait_url=portrait_url,
            script=script,
            voice_id=voice_id,
            language=language,
            use_liveportrait=use_liveportrait,
        )
        return result

    except Exception as exc:
        tb = traceback.format_exc()
        print(f"[handler] ERREUR : {exc}\n{tb}")
        return {"error": str(exc)}


runpod.serverless.start({"handler": handler})
