import torch

SAMPLE_RATE = 16000
N_MELS = 80
EMBEDDING_SIZE = 192

BATCH_SIZE = 16
EPOCHS = 20
LR = 1e-3

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

NUM_SPEAKERS = 251  # LibriSpeech train-clean-100 approx

CHECKPOINT_PATH = "checkpoints/ecapa.pth"
