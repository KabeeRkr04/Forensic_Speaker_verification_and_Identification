import base64
import binascii
import math
import os
import tempfile
from threading import Lock

import torch
import torch.nn.functional as F
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import CHECKPOINT_PATH, DEVICE, SAMPLE_RATE
from extract_embeddings import get_embedding
from features import extract_features
from scoring import llr_score
from speaker_db import add_speaker, delete_speaker, get_all_speakers, list_speakers
from utils import load_audio

VERIFY_THRESHOLD = 8.0
IDENTITY_THRESHOLD = 8.0
MAX_WAVEFORM_POINTS = 72
MAX_SPECTRUM_POINTS = 24
MAX_EMBEDDING_POINTS = 24
INFERENCE_LOCK = Lock()
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".api_uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="VoxForensic Backend",
    version="1.0.0",
    description="HTTP API for forensic speaker verification and identification.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AudioPayload(BaseModel):
    filename: str = Field(min_length=1)
    content_base64: str = Field(min_length=1)
    mime_type: str | None = None


class VerifyRequest(BaseModel):
    audio1: AudioPayload
    audio2: AudioPayload


class IdentifyRequest(BaseModel):
    audio: AudioPayload
    top_k: int = Field(default=5, ge=1, le=10)


class SaveSpeakerRequest(BaseModel):
    name: str = Field(min_length=1)
    audio: AudioPayload


def _score_to_percent(score: float) -> float:
    normalized = max(0.0, min(1.0, (score + 10.0) / 20.0))
    return round(normalized * 100.0, 2)


def _cosine_to_percent(score: float) -> float:
    normalized = max(0.0, min(1.0, (score + 1.0) / 2.0))
    return round(normalized * 100.0, 2)


def _relative_similarity(value1: float, value2: float) -> float:
    denominator = max(abs(value1), abs(value2), 1e-6)
    similarity = max(0.0, 1.0 - (abs(value1 - value2) / denominator))
    return round(similarity * 100.0, 2)


def _normalize_tensor(values: torch.Tensor, max_points: int, use_absolute: bool = True):
    flattened = values.detach().float().cpu().flatten()

    if flattened.numel() == 0:
        return []

    chunk_size = max(1, math.ceil(flattened.numel() / max_points))
    reduced = []

    for start in range(0, flattened.numel(), chunk_size):
        chunk = flattened[start:start + chunk_size]
        chunk_value = chunk.abs().mean() if use_absolute else chunk.mean()
        reduced.append(float(chunk_value.item()))

    if len(reduced) > max_points:
        reduced = reduced[:max_points]

    scale = max((abs(value) for value in reduced), default=1.0) or 1.0

    return [
        {"index": index, "value": round(value / scale, 6)}
        for index, value in enumerate(reduced)
    ]


def _embedding_preview(embedding: torch.Tensor):
    vector = embedding.detach().float().cpu().squeeze(0)[:MAX_EMBEDDING_POINTS]

    if vector.numel() == 0:
        return []

    scale = float(vector.abs().max().item()) or 1.0

    return [
        {
            "label": f"D{index + 1:02d}",
            "value": round(float(abs(value.item()) / scale), 6),
        }
        for index, value in enumerate(vector)
    ]


def _decode_audio_payload(payload: AudioPayload) -> str:
    try:
        raw_bytes = base64.b64decode(payload.content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 audio payload.") from exc

    suffix = os.path.splitext(payload.filename)[1] or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=UPLOAD_DIR) as handle:
        handle.write(raw_bytes)
        return handle.name


def _load_audio_from_payload(payload: AudioPayload) -> torch.Tensor:
    temp_path = _decode_audio_payload(payload)

    try:
        return load_audio(temp_path)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read audio file '{payload.filename}'.",
        ) from exc
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _analyze_audio(payload: AudioPayload):
    waveform = _load_audio_from_payload(payload)

    with INFERENCE_LOCK:
        embedding = get_embedding(waveform)
        features = extract_features(waveform)

    if features.dim() == 4:
        features = features.squeeze(1)

    features_cpu = features.detach().float().cpu()
    waveform_cpu = waveform.detach().float().cpu().squeeze(0)
    mel_profile = features_cpu.mean(dim=-1).squeeze(0)
    spectral_energy = torch.exp(features_cpu).mean().item()

    if waveform_cpu.numel() > 1:
        zero_crossing_rate = (waveform_cpu[1:] * waveform_cpu[:-1] < 0).float().mean().item()
    else:
        zero_crossing_rate = 0.0

    summary = {
        "filename": payload.filename,
        "duration_seconds": round(waveform_cpu.numel() / SAMPLE_RATE, 3),
        "rms": round(float(torch.sqrt(torch.mean(waveform_cpu.pow(2))).item()), 6),
        "peak": round(float(waveform_cpu.abs().max().item()), 6) if waveform_cpu.numel() else 0.0,
        "zero_crossing_rate": round(float(zero_crossing_rate), 6),
        "spectral_energy": round(float(spectral_energy), 6),
        "waveform": _normalize_tensor(waveform_cpu, MAX_WAVEFORM_POINTS, use_absolute=True),
        "spectrum": _normalize_tensor(mel_profile, MAX_SPECTRUM_POINTS, use_absolute=False),
        "embedding_preview": _embedding_preview(embedding),
    }

    return {
        "waveform": waveform,
        "embedding": embedding,
        "mel_profile": mel_profile,
        "summary": summary,
    }


def _speaker_name_or_400(name: str) -> str:
    normalized = name.strip()

    if not normalized:
        raise HTTPException(status_code=400, detail="Speaker name is required.")

    return normalized


@app.get("/")
def root():
    return {
        "name": "VoxForensic Backend API",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
        "verify": "/api/verify",
        "identify": "/api/identify",
        "speakers": "/api/speakers",
        "note": "Run the React frontend separately on port 3000.",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "checkpoint_path": CHECKPOINT_PATH,
        "verify_threshold": VERIFY_THRESHOLD,
        "identity_threshold": IDENTITY_THRESHOLD,
        "speaker_count": len(list_speakers()),
    }


@app.get("/api/speakers")
def speakers():
    speaker_names = list_speakers()
    return {"count": len(speaker_names), "speakers": speaker_names}


@app.post("/api/speakers")
def create_speaker(request: SaveSpeakerRequest):
    speaker_name = _speaker_name_or_400(request.name)
    analysis = _analyze_audio(request.audio)

    add_speaker(speaker_name, analysis["embedding"])
    speaker_names = list_speakers()

    return {
        "saved": True,
        "name": speaker_name,
        "speaker_count": len(speaker_names),
        "speakers": speaker_names,
    }


@app.delete("/api/speakers/{speaker_name}")
def remove_speaker(speaker_name: str):
    if not delete_speaker(speaker_name):
        raise HTTPException(status_code=404, detail="Speaker not found.")

    speaker_names = list_speakers()

    return {
        "deleted": True,
        "name": speaker_name,
        "speaker_count": len(speaker_names),
        "speakers": speaker_names,
    }


@app.post("/api/verify")
def verify(request: VerifyRequest):
    audio1 = _analyze_audio(request.audio1)
    audio2 = _analyze_audio(request.audio2)

    with INFERENCE_LOCK:
        score = float(llr_score(audio1["embedding"], audio2["embedding"]).item())

    spectral_cosine = float(
        F.cosine_similarity(
            audio1["mel_profile"].unsqueeze(0),
            audio2["mel_profile"].unsqueeze(0),
        ).item()
    )

    comparison_metrics = [
        {
            "name": "EMBEDDING",
            "value": _score_to_percent(score),
            "description": "Similarity of the ECAPA voiceprint embeddings.",
        },
        {
            "name": "DURATION",
            "value": _relative_similarity(
                audio1["summary"]["duration_seconds"],
                audio2["summary"]["duration_seconds"],
            ),
            "description": "Relative duration agreement after resampling to 16 kHz.",
        },
        {
            "name": "ENERGY",
            "value": _relative_similarity(
                audio1["summary"]["rms"],
                audio2["summary"]["rms"],
            ),
            "description": "RMS energy alignment across both specimens.",
        },
        {
            "name": "SPECTRUM",
            "value": _cosine_to_percent(spectral_cosine),
            "description": "Average mel-spectrum cosine similarity.",
        },
    ]

    return {
        "verdict": "MATCH_CONFIRMED" if score >= VERIFY_THRESHOLD else "MATCH_REJECTED",
        "same_speaker": score >= VERIFY_THRESHOLD,
        "score": round(score, 4),
        "score_percent": _score_to_percent(score),
        "threshold": VERIFY_THRESHOLD,
        "device": DEVICE,
        "audio_1": audio1["summary"],
        "audio_2": audio2["summary"],
        "comparison_metrics": comparison_metrics,
    }


@app.post("/api/identify")
def identify(request: IdentifyRequest):
    analysis = _analyze_audio(request.audio)
    database = get_all_speakers()

    matches = []

    for speaker_name, stored_embedding in database.items():
        candidate = stored_embedding.to(analysis["embedding"].device)

        with INFERENCE_LOCK:
            score = float(llr_score(analysis["embedding"], candidate).item())

        matches.append(
            {
                "name": speaker_name,
                "score": round(score, 4),
                "score_percent": _score_to_percent(score),
                "is_above_threshold": score >= IDENTITY_THRESHOLD,
            }
        )

    matches.sort(key=lambda item: item["score"], reverse=True)
    top_matches = matches[:request.top_k]
    best_match = top_matches[0] if top_matches else None
    identified = bool(best_match and best_match["score"] >= IDENTITY_THRESHOLD)

    return {
        "verdict": "IDENTIFIED" if identified else "UNKNOWN_SPEAKER",
        "identified": identified,
        "threshold": IDENTITY_THRESHOLD,
        "device": DEVICE,
        "speaker_count": len(database),
        "database_empty": len(database) == 0,
        "audio": analysis["summary"],
        "best_match": best_match,
        "top_matches": top_matches,
    }


if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
