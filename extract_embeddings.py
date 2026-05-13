# extract_embeddings.py (UPDATED)

import torch
import torch.nn.functional as F
from model import ECAPA
from features import extract_features
from config import *

model = ECAPA().to(DEVICE)
model.load_state_dict(torch.load(CHECKPOINT_PATH, map_location=DEVICE))
model.eval()

def get_embedding(audio):
    with torch.no_grad():
        feat = extract_features(audio).to(DEVICE)

        if feat.dim() == 4:
            feat = feat.squeeze(1)

        emb = model(feat)

        # 🔥 IMPORTANT: normalize again
        emb = F.normalize(emb, dim=1)

    return emb