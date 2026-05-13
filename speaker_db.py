# speaker_db.py

import os
import pickle

DB_PATH = "speakers_db.pkl"


def load_db():
    if not os.path.exists(DB_PATH):
        return {}
    with open(DB_PATH, "rb") as f:
        return pickle.load(f)


def save_db(db):
    with open(DB_PATH, "wb") as f:
        pickle.dump(db, f)


def add_speaker(name, embedding):
    db = load_db()
    db[name] = embedding.cpu()
    save_db(db)


def get_all_speakers():
    return load_db()


def list_speakers():
    return sorted(load_db().keys())


def delete_speaker(name):
    db = load_db()

    if name not in db:
        return False

    del db[name]
    save_db(db)
    return True
