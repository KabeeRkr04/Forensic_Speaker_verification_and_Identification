import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog

from utils import load_audio
from extract_embeddings import get_embedding
from scoring import llr_score
from speaker_db import add_speaker, get_all_speakers

THRESHOLD = 8   # for verification
IDENTITY_THRESHOLD = 8   # 🔥 for identification


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Speaker Verification + Identification")
        self.root.geometry("560x520")
        self.root.configure(bg="#1e1e1e")

        self.a1 = None
        self.a2 = None

        tk.Label(root, text="🎙 Speaker System", font=("Arial", 18, "bold"),
                 bg="#1e1e1e", fg="white").pack(pady=10)

        # =========================
        # LOAD BUTTONS
        # =========================
        tk.Button(root, text="Load Audio 1", command=self.load1, width=25).pack(pady=5)
        self.l1 = tk.Label(root, text="No file", bg="#1e1e1e", fg="gray")
        self.l1.pack()

        tk.Button(root, text="Load Audio 2", command=self.load2, width=25).pack(pady=5)
        self.l2 = tk.Label(root, text="No file", bg="#1e1e1e", fg="gray")
        self.l2.pack()

        # =========================
        # VERIFY
        # =========================
        tk.Button(root, text="Verify", command=self.verify, width=25).pack(pady=10)

        # =========================
        # RADIO BUTTON (SELECT AUDIO)
        # =========================
        self.selected_audio = tk.IntVar(value=1)

        tk.Label(root, text="Select Audio to Save:",
                 bg="#1e1e1e", fg="white").pack()

        tk.Radiobutton(root, text="Audio 1", variable=self.selected_audio,
                       value=1, bg="#1e1e1e", fg="white", selectcolor="#333").pack()

        tk.Radiobutton(root, text="Audio 2", variable=self.selected_audio,
                       value=2, bg="#1e1e1e", fg="white", selectcolor="#333").pack()

        tk.Button(root, text="Save Speaker", command=self.save_selected, width=25).pack(pady=10)

        # =========================
        # IDENTIFY BOTH
        # =========================
        tk.Button(root, text="Identify Speakers", command=self.identify_both, width=25).pack(pady=10)

        # =========================
        # RESULT
        # =========================
        self.result = tk.Label(root, text="", font=("Arial", 12, "bold"),
                               bg="#1e1e1e", fg="white", justify="center")
        self.result.pack(pady=15)

    # =========================
    # LOAD
    # =========================
    def load1(self):
        self.a1 = filedialog.askopenfilename()
        if self.a1:
            self.l1.config(text=self.a1.split("/")[-1])

    def load2(self):
        self.a2 = filedialog.askopenfilename()
        if self.a2:
            self.l2.config(text=self.a2.split("/")[-1])

    # =========================
    # VERIFY
    # =========================
    def verify(self):
        if not self.a1 or not self.a2:
            messagebox.showerror("Error", "Load both audios")
            return

        w1 = load_audio(self.a1)
        w2 = load_audio(self.a2)

        e1 = get_embedding(w1)
        e2 = get_embedding(w2)

        score = llr_score(e1, e2).item()

        result = "✅ SAME SPEAKER" if score >= THRESHOLD else "❌ DIFFERENT SPEAKER"

        self.result.config(text=f"{result}\nScore: {score:.2f}")

    # =========================
    # SAVE SPEAKER
    # =========================
    def save_selected(self):
        if self.selected_audio.get() == 1:
            path = self.a1
        else:
            path = self.a2

        if not path:
            messagebox.showerror("Error", "Load selected audio first")
            return

        name = simpledialog.askstring("Input", "Enter speaker name:")
        if not name:
            return

        wav = load_audio(path)
        emb = get_embedding(wav)

        add_speaker(name, emb)

        messagebox.showinfo("Saved", f"Speaker '{name}' saved!")

    # =========================
    # IDENTIFY BOTH
    # =========================
    def identify_both(self):

        db = get_all_speakers()

        if len(db) == 0:
            self.result.config(text="⚠️ No saved speakers in database")
            return

        results = []

        for idx, path in enumerate([self.a1, self.a2], start=1):

            if not path:
                results.append(f"Audio {idx}: Not loaded")
                continue

            wav = load_audio(path)
            emb = get_embedding(wav)

            best_name = None
            best_score = -1

            for name, stored_emb in db.items():

                # 🔥 FIX DEVICE ISSUE
                stored_emb = stored_emb.to(emb.device)

                score = llr_score(emb, stored_emb).item()

                if score > best_score:
                    best_score = score
                    best_name = name

            # 🔥 THRESHOLD LOGIC (IMPORTANT)
            if best_score < IDENTITY_THRESHOLD:
                results.append(f"Audio {idx}: ❌ Unknown Speaker ({best_score:.2f})")
            else:
                results.append(f"Audio {idx}: ✅ {best_name} ({best_score:.2f})")

        self.result.config(text="\n".join(results))


# =========================
# RUN
# =========================
if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()