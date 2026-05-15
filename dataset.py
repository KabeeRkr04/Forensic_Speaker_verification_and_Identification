# dataset.py (FINAL STABLE VERSION)

import os
import torchaudio
import torch
from torch.utils.data import Dataset
from config import SAMPLE_RATE


class LibriSpeechDataset(Dataset):
    def __init__(self, root="./data"):

        # Ensure folder exists
        os.makedirs(root, exist_ok=True)

        # Auto download dataset
        self.dataset = torchaudio.datasets.LIBRISPEECH(
            root=root,
            url="train-clean-100",
            download=True
        )

        self.audio_paths = []
        self.labels = []

        # Build file list safely
        for fileid in self.dataset._walker:

            speaker_id, chapter_id, utterance_id = fileid.split("-")

            path = os.path.join(
                root,
                "LibriSpeech",
                "train-clean-100",
                speaker_id,
                chapter_id,
                f"{fileid}.flac"
            )

            # 🔥 Only add if file exists
            if os.path.exists(path):
                self.audio_paths.append(path)
                self.labels.append(int(speaker_id))
            else:
                print(f"⚠️ Missing file skipped: {path}")

        # Map labels → 0...N
        unique = sorted(list(set(self.labels)))
        self.spk_map = {spk: i for i, spk in enumerate(unique)}
        self.labels = [self.spk_map[l] for l in self.labels]

    def __len__(self):
        return len(self.audio_paths)

    def __getitem__(self, idx):

        # 🔥 Robust loading (skip corrupted files)
        while True:
            path = self.audio_paths[idx]
            label = self.labels[idx]

            try:
                wav, sr = torchaudio.load(path)

                # Resample if needed
                if sr != SAMPLE_RATE:
                    resampler = torchaudio.transforms.Resample(sr, SAMPLE_RATE)
                    wav = resampler(wav)

                # Convert to mono
                if wav.shape[0] > 1:
                    wav = wav.mean(dim=0, keepdim=True)

                return wav.squeeze(0), label

            except Exception:
                print(f"⚠️ Corrupted file skipped: {path}")
                idx = (idx + 1) % len(self.audio_paths)


def collate_fn(batch):
    audios = [x[0] for x in batch]
    labels = [x[1] for x in batch]

    max_len = max([a.shape[0] for a in audios])

    padded = []
    for a in audios:
        pad = max_len - a.shape[0]
        padded.append(torch.nn.functional.pad(a, (0, pad)))

    return torch.stack(padded), torch.tensor(labels)


def load_librispeech():
    return LibriSpeechDataset()