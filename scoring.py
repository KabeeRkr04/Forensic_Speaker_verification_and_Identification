import torch.nn.functional as F

def llr_score(e1, e2):
    return F.cosine_similarity(e1, e2) * 10