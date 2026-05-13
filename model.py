import torch
import torch.nn as nn
import torch.nn.functional as F
from config import EMBEDDING_SIZE

class SEBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.fc1 = nn.Linear(channels, channels // 8)
        self.fc2 = nn.Linear(channels // 8, channels)

    def forward(self, x):
        s = x.mean(dim=2)
        s = F.relu(self.fc1(s))
        s = torch.sigmoid(self.fc2(s)).unsqueeze(2)
        return x * s

class ECAPA(nn.Module):
    def __init__(self, channels=512):
        super().__init__()

        self.conv1 = nn.Conv1d(80, channels, 5, padding=2)
        self.bn1 = nn.BatchNorm1d(channels)

        self.conv2 = nn.Conv1d(channels, channels, 3, padding=2, dilation=2)
        self.bn2 = nn.BatchNorm1d(channels)

        self.se = SEBlock(channels)

        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(channels, EMBEDDING_SIZE)

    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.se(x)

        x = self.pool(x).squeeze(-1)
        emb = self.fc(x)

        return F.normalize(emb)