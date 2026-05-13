# 🎙️ Forensic Speaker Verification & Identification System

This project was developed as part of an **Audio & Speech Processing (ASP)** course. It implements a deep learning-based forensic voice authentication system capable of performing both **speaker verification** and **speaker identification** using neural speaker embeddings and advanced speech processing techniques.

---

## 🚀 Project Overview

Human speech carries unique biometric characteristics such as vocal tract shape, pitch patterns, resonance, and articulation style. This project extracts those characteristics from speech signals and converts them into compact neural embeddings for forensic analysis.

The system allows users to:

- Compare two audio recordings to verify whether they belong to the same speaker
- Identify an unknown speaker from a registered speaker database
- Visualize embedding alignment and similarity scores
- Analyze Mel-spectrum based speaker characteristics
- Evaluate similarity using cosine distance and thresholding

---

## 🎯 Key Features

- Interactive **GUI-based speaker verification tool**
- Deep learning-based **speaker embedding extraction**
- Real-time **speaker verification & identification**
- Support for:
  - Audio upload
  - Speaker registration
  - Database matching
- Neural embedding visualization
- Cosine similarity scoring
- Threshold-based forensic decision system
- Noise augmentation for improved robustness

---

## 🧠 Technical Pipeline

```text
Raw Audio
   ↓
Preprocessing & Augmentation
   ↓
Log-Mel Spectrogram Extraction
   ↓
ECAPA-inspired Neural Network
   ↓
Speaker Embedding Generation
   ↓
Cosine Similarity Scoring
   ↓
Verification / Identification
```

---

## 🛠️ Tech Stack

| Tool/Library        | Purpose                                                  |
|---------------------|----------------------------------------------------------|
| Python              | Core implementation                                       |
| PyTorch             | Deep learning framework                                   |
| Torchaudio          | Audio loading & preprocessing                             |
| Librosa             | Audio feature extraction                                  |
| NumPy               | Numerical computation                                     |
| Matplotlib          | Visualization & spectrum plotting                         |
| Tkinter             | GUI framework                                             |
| LibriSpeech Dataset | Speaker training dataset                                  |

---

## 🔬 Audio & Speech Processing Concepts Used

- Sampling & Resampling (16 kHz)
- Mono audio conversion
- Short-Time Fourier Transform (STFT)
- Spectral Analysis
- Mel Frequency Scaling
- Log-Mel Spectrograms
- Speaker Embeddings
- Cosine Similarity
- Deep Metric Learning
- Equal Error Rate (EER)

---

## 🧪 Deep Learning Components

### 🔹 ECAPA-inspired Speaker Encoder
Used to extract discriminative speaker embeddings from speech signals.

### 🔹 Additive Angular Margin Softmax (AAM-Softmax)
Improves inter-speaker separation in angular embedding space.

### 🔹 Embedding Normalization
Projects embeddings onto a hypersphere for stable cosine similarity scoring.

---

## 📐 Mathematical Foundations

### Mel Scale

\[
m = 2595 \log_{10}(1 + f/700)
\]

### Cosine Similarity

\[
Similarity =
\frac{e_1 \cdot e_2}{||e_1|| ||e_2||}
\]

### Embedding Normalization

\[
\hat{e} = \frac{e}{||e||}
\]

### AAM-Softmax Loss

Enhances speaker discriminability by introducing angular margin penalties during training.

---

## 🖼️ Demonstration

### Example 1: Speaker Verification

> Two speech recordings from the same speaker produced highly aligned embeddings with cosine similarity close to **1.0**, resulting in successful verification.

<img width="1038" height="637" alt="Speaker Identification Results" src="https://github.com/user-attachments/assets/6d432c7a-03f9-4f23-9f32-018e0c4c8c09" />


### Example 2: Speaker Identification

> An unknown speech sample was compared against registered speaker embeddings in the database, and the system successfully identified the correct speaker based on the highest cosine similarity score.

<img width="1038" height="637" alt="Speaker Identification Results" src="https://github.com/user-attachments/assets/870440e1-67d9-4959-bcc3-d3c32ef8e855" />

## 📊 Evaluation Metrics

The system evaluates speaker similarity using:

- **Cosine Similarity Score**
- **Threshold-based Verification**
- **False Acceptance Rate (FAR)**
- **False Rejection Rate (FRR)**
- **Equal Error Rate (EER)**

---

## 📂 Project Structure

```text
├── augmentation.py        # Noise augmentation
├── config.py              # Configuration parameters
├── dataset.py             # Dataset loader
├── extract_embeddings.py  # Speaker embedding extraction
├── features.py            # Log-Mel feature extraction
├── gui.py                 # GUI interface
├── loss.py                # AAMSoftmax implementation
├── model.py               # ECAPA-inspired model
├── scoring.py             # Cosine similarity scoring
├── speaker_db.py          # Speaker database
├── threshold.py           # Threshold & EER computation
├── train.py               # Model training
└── utils.py               # Utility functions
```

---

## 📚 Dataset

### LibriSpeech (train-clean-100)

Used for:
- Speaker embedding training
- Verification testing
- Identification experiments

---

## 🎯 Applications

- Forensic voice analysis
- Criminal investigations
- Voice biometrics
- Smart authentication systems
- Banking voice login
- Access control systems

---

## ⚠️ Future Improvements

- Full ECAPA-TDNN implementation
- PLDA-based scoring
- Real-time streaming verification
- Voice Activity Detection (VAD)
- Multi-language speaker recognition
- Reverberation augmentation

---

## 📚 References

### 📘 Academic References

1. Desplanques, B., et al. (2020). *ECAPA-TDNN: Emphasized Channel Attention, Propagation and Aggregation in TDNN Based Speaker Verification*. Interspeech 2020.  

2. Snyder, D., et al. (2018). *X-vectors: Robust DNN Embeddings for Speaker Recognition*. ICASSP 2018.  

3. Deng, J., et al. (2019). *ArcFace: Additive Angular Margin Loss for Deep Face Recognition*. CVPR 2019.  

4. Davis, S., & Mermelstein, P. (1980). *Comparison of Parametric Representations for Monosyllabic Word Recognition in Continuously Spoken Sentences*. IEEE TASSP.  

5. LibriSpeech Dataset: https://www.openslr.org/12/

---

