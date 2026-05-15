# threshold.py

import torch
import random
from extract_embeddings import get_embedding
from scoring import llr_score


def compute_threshold(dataset, num_trials=200):

    same_scores = []
    diff_scores = []

    # group by speaker
    speaker_dict = {}

    for i in range(len(dataset)):
        _, label = dataset[i]
        speaker_dict.setdefault(label, []).append(i)

    speakers = list(speaker_dict.keys())

    for _ in range(num_trials):

        # SAME speaker pair
        spk = random.choice(speakers)
        idx1, idx2 = random.sample(speaker_dict[spk], 2)

        wav1, _ = dataset[idx1]
        wav2, _ = dataset[idx2]

        e1 = get_embedding(wav1.unsqueeze(0))
        e2 = get_embedding(wav2.unsqueeze(0))

        same_scores.append(llr_score(e1, e2).item())

        # DIFFERENT speaker pair
        spk1, spk2 = random.sample(speakers, 2)

        idx1 = random.choice(speaker_dict[spk1])
        idx2 = random.choice(speaker_dict[spk2])

        wav1, _ = dataset[idx1]
        wav2, _ = dataset[idx2]

        e1 = get_embedding(wav1.unsqueeze(0))
        e2 = get_embedding(wav2.unsqueeze(0))

        diff_scores.append(llr_score(e1, e2).item())

    # find best threshold
    thresholds = sorted(same_scores + diff_scores)

    best_thr = 0
    best_diff = float("inf")

    for t in thresholds:
        FAR = sum(s >= t for s in diff_scores) / len(diff_scores)
        FRR = sum(s < t for s in same_scores) / len(same_scores)

        if abs(FAR - FRR) < best_diff:
            best_diff = abs(FAR - FRR)
            best_thr = t

    print(f"🔥 Best Threshold (EER): {best_thr:.2f}")
    return best_thr