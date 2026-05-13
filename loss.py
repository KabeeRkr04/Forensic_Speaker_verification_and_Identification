import torch
import torch.nn as nn
import torch.nn.functional as F

class AAMSoftmax(nn.Module):
    def __init__(self, in_features, n_classes, s=30.0, m=0.2):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(n_classes, in_features))
        self.s = s
        self.m = m

    def forward(self, x, labels):
        cosine = F.linear(F.normalize(x), F.normalize(self.weight))
        phi = cosine - self.m

        one_hot = torch.zeros_like(cosine)
        one_hot.scatter_(1, labels.view(-1,1), 1)

        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)
        output *= self.s

        loss = F.cross_entropy(output, labels)
        return loss