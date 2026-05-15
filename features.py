# features.py (FIXED GPU VERSION)

import torch
import torchaudio
from config import *

def extract_features(wave):

    device = wave.device  # 🔥 detect device

    mel = torchaudio.transforms.MelSpectrogram(
        sample_rate=SAMPLE_RATE,
        n_fft=400,
        hop_length=160,
        n_mels=N_MELS
    ).to(device)   # 🔥 MOVE TO SAME DEVICE

    x = mel(wave)
    x = torch.log(x + 1e-6)

    return x