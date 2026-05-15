export interface NormalizedPoint {
  index: number;
  value: number;
}

export interface EmbeddingPoint {
  label: string;
  value: number;
}

export interface AudioSummary {
  filename: string;
  duration_seconds: number;
  rms: number;
  peak: number;
  zero_crossing_rate: number;
  spectral_energy: number;
  waveform: NormalizedPoint[];
  spectrum: NormalizedPoint[];
  embedding_preview: EmbeddingPoint[];
}

export interface ComparisonMetric {
  name: string;
  value: number;
  description: string;
}

export interface VerifyResponse {
  verdict: string;
  same_speaker: boolean;
  score: number;
  score_percent: number;
  threshold: number;
  device: string;
  audio_1: AudioSummary;
  audio_2: AudioSummary;
  comparison_metrics: ComparisonMetric[];
}

export interface MatchCandidate {
  name: string;
  score: number;
  score_percent: number;
  is_above_threshold: boolean;
}

export interface IdentifyResponse {
  verdict: string;
  identified: boolean;
  threshold: number;
  device: string;
  speaker_count: number;
  database_empty: boolean;
  audio: AudioSummary;
  best_match: MatchCandidate | null;
  top_matches: MatchCandidate[];
}

export interface HealthResponse {
  status: string;
  device: string;
  checkpoint_path: string;
  verify_threshold: number;
  identity_threshold: number;
  speaker_count: number;
}

export interface SpeakersResponse {
  count: number;
  speakers: string[];
}

export interface SpeakerMutationResponse {
  name: string;
  speaker_count: number;
  speakers: string[];
  saved?: boolean;
  deleted?: boolean;
}

interface EncodedAudioPayload {
  filename: string;
  content_base64: string;
  mime_type: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      throw new Error(String((data as { detail: unknown }).detail));
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  return data as T;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Unable to encode audio file.'));
        return;
      }

      const [, base64] = result.split(',');

      if (!base64) {
        reject(new Error('Encoded audio payload is empty.'));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Unable to read audio file.'));
    reader.readAsDataURL(file);
  });
}

async function encodeAudio(file: File): Promise<EncodedAudioPayload> {
  return {
    filename: file.name,
    mime_type: file.type || 'audio/wav',
    content_base64: await fileToBase64(file),
  };
}

export async function fetchHealth() {
  return requestJson<HealthResponse>('/api/health');
}

export async function fetchSpeakers() {
  return requestJson<SpeakersResponse>('/api/speakers');
}

export async function verifyAudio(audio1: File, audio2: File) {
  return requestJson<VerifyResponse>('/api/verify', {
    method: 'POST',
    body: JSON.stringify({
      audio1: await encodeAudio(audio1),
      audio2: await encodeAudio(audio2),
    }),
  });
}

export async function identifyAudio(audio: File) {
  return requestJson<IdentifyResponse>('/api/identify', {
    method: 'POST',
    body: JSON.stringify({
      audio: await encodeAudio(audio),
    }),
  });
}

export async function saveSpeaker(name: string, audio: File) {
  return requestJson<SpeakerMutationResponse>('/api/speakers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      audio: await encodeAudio(audio),
    }),
  });
}

export async function removeSpeaker(name: string) {
  return requestJson<SpeakerMutationResponse>(`/api/speakers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}
