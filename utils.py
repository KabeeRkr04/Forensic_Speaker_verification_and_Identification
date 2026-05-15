# utils.py (UPDATED)

import torch
import torchaudio
from config import SAMPLE_RATE

def load_audio(path):
    wav, sr = torchaudio.load(path)

    wav = wav.to(torch.float32)

    if wav.shape[0] > 1:
        wav = wav.mean(dim=0, keepdim=True)

    if sr != SAMPLE_RATE:
        resampler = torchaudio.transforms.Resample(sr, SAMPLE_RATE)
        wav = resampler(wav)

    return wav


def split_audio(wav, segment_length=16000*3):  
    segments = []

    total_len = wav.shape[1]

    for start in range(0, total_len, segment_length):
        end = start + segment_length

        segment = wav[:, start:end]

        if segment.shape[1] < segment_length:
            pad = segment_length - segment.shape[1]
            segment = torch.nn.functional.pad(segment, (0, pad))

        segments.append(segment)

    return segments
