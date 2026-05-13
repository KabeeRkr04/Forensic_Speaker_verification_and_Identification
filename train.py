# train.py (FINAL WORKING VERSION - NO HF DEPENDENCY)

import torch
import os
from torch.utils.data import DataLoader
from dataset import load_librispeech, collate_fn
from model import ECAPA
from features import extract_features
from augmentation import add_noise
from loss import AAMSoftmax
from config import *
from tqdm import tqdm


def main():

    # =========================
    # SETUP
    # =========================
    os.makedirs("checkpoints", exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))

    # =========================
    # DATASET (CUSTOM)
    # =========================
    ds = load_librispeech()

    loader = DataLoader(
        ds,
        batch_size=BATCH_SIZE,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=0,   # Windows safe
        pin_memory=True
    )

    # 🔥 IMPORTANT: get number of speakers from dataset
    num_speakers = len(set(ds.labels))

    # =========================
    # MODEL
    # =========================
    model = ECAPA().to(device)

    criterion = AAMSoftmax(
        EMBEDDING_SIZE,
        num_speakers
    ).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=LR)

    best_loss = float("inf")

    # =========================
    # TRAIN LOOP
    # =========================
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0

        loop = tqdm(loader, desc=f"Epoch {epoch+1}/{EPOCHS}")

        for audio, labels in loop:
            audio = audio.to(device)
            labels = labels.to(device)

            # 🔥 Augmentation
            audio = add_noise(audio)

            with torch.amp.autocast(device_type="cuda", enabled=(device.type == "cuda")):

                # Feature extraction
                features = extract_features(audio)

                # Fix shape
                if features.dim() == 4:
                    features = features.squeeze(1)

                features = features.to(device)

                # Forward
                emb = model(features)
                loss = criterion(emb, labels)

            # Backprop
            optimizer.zero_grad()
            scaler.scale(loss).backward()

            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)

            scaler.step(optimizer)
            scaler.update()

            total_loss += loss.item()
            loop.set_postfix(loss=loss.item())

        avg_loss = total_loss / len(loader)
        print(f"\nEpoch {epoch+1} Average Loss: {avg_loss:.4f}")

        # Save best model
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            print("✅ Best model saved!")

    print("\n🔥 Training Complete.")


# =========================
# WINDOWS SAFE ENTRY
# =========================
if __name__ == "__main__":
    main()