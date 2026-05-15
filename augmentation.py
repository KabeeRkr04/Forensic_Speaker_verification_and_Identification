import torch
import random

def add_noise(waveform):
    noise = torch.randn_like(waveform) * random.uniform(0.001, 0.01)
    return waveform + noise