import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RotateCcw, Server } from 'lucide-react';

import { VoiceWaveBackground } from './components/VoiceWaveBackground';
import { LandingSection } from './components/LandingSection';
import { MainWorkSection } from './components/MainWorkSection';
import { IdentitySection } from './components/IdentitySection';
import { AnalysisSection } from './components/AnalysisSection';
import { IdentityAnalysisSection } from './components/IdentityAnalysisSection';
import { ForensicProcessingBackground } from './components/ForensicProcessingBackground';
import { cn } from './lib/utils';
import {
  fetchHealth,
  fetchSpeakers,
  identifyAudio,
  removeSpeaker,
  saveSpeaker,
  verifyAudio,
  type HealthResponse,
  type IdentifyResponse,
  type VerifyResponse,
} from './lib/api';

const MATCH_STEPS = [
  'Preprocessing Header Bitmasks',
  'Normalizing Spectral Coefficients',
  'Extracting MFCC Feature Maps',
  'Generating Neural Embeddings (ECAPA-TDNN)',
  'Synthesizing Probabilistic Similarity',
  'Cross-referencing Speaker Databases',
];

const IDENTITY_STEPS = [
  'Capturing Acoustic Profile',
  'Isolating Vocal Formants',
  'Hashing Neural Voiceprint',
  'Querying Identity Database',
  'Evaluating Biometric Uniqueness',
];

type ViewMode = 'dashboard' | 'verification' | 'identity';
type ProcessingType = 'matching' | 'identity' | null;
type Notice = {
  type: 'error' | 'success';
  message: string;
} | null;

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [processingType, setProcessingType] = useState<ProcessingType>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const [identityResult, setIdentityResult] = useState<IdentifyResponse | null>(null);
  const [identitySourceFile, setIdentitySourceFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isMutatingSpeaker, setIsMutatingSpeaker] = useState(false);

  const isProcessing = processingType !== null;
  const steps = processingType === 'identity' ? IDENTITY_STEPS : MATCH_STEPS;
  const backendReady = health?.status === 'ok';

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  function syncSpeakers(nextSpeakers: string[]) {
    setSpeakers(nextSpeakers);
    setHealth((current) => current ? { ...current, speaker_count: nextSpeakers.length } : current);
  }

  async function loadBackendState() {
    setIsBootstrapping(true);

    try {
      const [healthResponse, speakersResponse] = await Promise.all([
        fetchHealth(),
        fetchSpeakers(),
      ]);

      setHealth(healthResponse);
      setSpeakers(speakersResponse.speakers);
    } catch (error) {
      setHealth(null);
      setSpeakers([]);
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Unable to connect to the backend API.'),
      });
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleVerify(audio1: File, audio2: File) {
    setNotice(null);
    setProcessingType('matching');

    try {
      const response = await verifyAudio(audio1, audio2);
      setVerificationResult(response);
      setView('verification');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Verification failed.'),
      });
    } finally {
      setProcessingType(null);
    }
  }

  async function handleIdentify(audio: File) {
    setNotice(null);
    setIdentitySourceFile(audio);
    setProcessingType('identity');

    try {
      const response = await identifyAudio(audio);
      setIdentityResult(response);
      setView('identity');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Identification failed.'),
      });
    } finally {
      setProcessingType(null);
    }
  }

  async function handleRegisterSpeaker(name: string, audio: File, refreshIdentity = false) {
    setNotice(null);
    setIsMutatingSpeaker(true);

    try {
      const response = await saveSpeaker(name, audio);
      syncSpeakers(response.speakers);
      setNotice({
        type: 'success',
        message: `Speaker '${response.name}' saved to the backend database.`,
      });

      if (refreshIdentity) {
        const refreshed = await identifyAudio(audio);
        setIdentitySourceFile(audio);
        setIdentityResult(refreshed);
        setView('identity');
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Unable to save speaker profile.'),
      });
      throw error;
    } finally {
      setIsMutatingSpeaker(false);
    }
  }

  async function handleDeleteSpeaker(name: string) {
    if (!window.confirm(`Delete '${name}' from the speaker database?`)) {
      return;
    }

    setNotice(null);
    setIsMutatingSpeaker(true);

    try {
      const response = await removeSpeaker(name);
      syncSpeakers(response.speakers);
      setNotice({
        type: 'success',
        message: `Speaker '${response.name}' removed from the backend database.`,
      });

      if (view === 'identity' && identitySourceFile) {
        const refreshed = await identifyAudio(identitySourceFile);
        setIdentityResult(refreshed);
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Unable to delete speaker profile.'),
      });
    } finally {
      setIsMutatingSpeaker(false);
    }
  }

  useEffect(() => {
    void loadBackendState();
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!processingType) {
      return;
    }

    setProcessingStep(0);

    const activeSteps = processingType === 'identity' ? IDENTITY_STEPS : MATCH_STEPS;
    const interval = window.setInterval(() => {
      setProcessingStep((current) => (current + 1) % activeSteps.length);
    }, 1200);

    return () => window.clearInterval(interval);
  }, [processingType]);

  return (
    <div className="bg-black min-h-screen text-white selection:bg-green-500/30">
      <VoiceWaveBackground
        intensity={isProcessing ? 15 : 4}
        simulating={isProcessing}
        activeProcess={isProcessing ? steps[processingStep] : ''}
      />

      <div className="relative z-10">
        <div className="fixed top-6 right-6 z-[120] flex flex-col gap-3 items-end">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 flex items-center gap-3">
            <Server className="w-4 h-4 text-[#00FF41]" />
            {isBootstrapping ? (
              <span>Syncing_Backend_State</span>
            ) : backendReady ? (
              <span>
                API_Online // {health.device.toUpperCase()} // {speakers.length}_Profiles
              </span>
            ) : (
              <span className="text-red-400">API_Offline</span>
            )}
            <button
              onClick={() => void loadBackendState()}
              className="text-[#00FF41] hover:text-white transition-colors"
              aria-label="Refresh backend status"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {notice && (
            <div
              className={cn(
                'max-w-md px-4 py-3 rounded-xl border backdrop-blur-md flex items-start gap-3',
                notice.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-100'
                  : 'bg-[#00FF41]/10 border-[#00FF41]/30 text-[#d9ffe4]'
              )}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{notice.message}</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && !isProcessing ? (
            <motion.div
              key="work-flow"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <LandingSection />
              <MainWorkSection
                backendReady={Boolean(backendReady)}
                isProcessing={isProcessing}
                onVerify={handleVerify}
              />
              <IdentitySection
                backendReady={Boolean(backendReady)}
                isProcessing={isProcessing}
                speakers={speakers}
                onIdentify={handleIdentify}
                onRegisterSpeaker={(name, audio) => handleRegisterSpeaker(name, audio, false)}
                onDeleteSpeaker={handleDeleteSpeaker}
              />
            </motion.div>
          ) : view === 'verification' && verificationResult && !isProcessing ? (
            <motion.div
              key="analysis-flow"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'circOut' }}
            >
              <AnalysisSection result={verificationResult} />

              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                  onClick={() => setView('dashboard')}
                  className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          ) : view === 'identity' && identityResult && !isProcessing ? (
            <motion.div
              key="identity-flow"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'circOut' }}
            >
              <IdentityAnalysisSection
                result={identityResult}
                sourceFile={identitySourceFile}
                isMutatingSpeaker={isMutatingSpeaker}
                onRegisterSpeaker={(name, audio) => handleRegisterSpeaker(name, audio, true)}
                onDeleteSpeaker={handleDeleteSpeaker}
              />

              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                  onClick={() => setView('dashboard')}
                  className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          ) : isProcessing ? (
            <motion.div
              key="simulation-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
            >
              <ForensicProcessingBackground />

              <div className="flex flex-col items-center gap-12 relative z-10">
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <motion.div className="absolute inset-0 border-[10px] border-[#00FF41]/10 rounded-full" />
                  <motion.div
                    className="absolute inset-0 border-[10px] border-[#00FF41] rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '2s' }}
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-mono text-[#00FF41] font-bold">
                      {Math.round(((processingStep + 1) / steps.length) * 100)}%
                    </span>
                    <span className="text-[10px] text-[#00FF41]/50 font-mono tracking-[4px] uppercase mt-2">
                      Backend_Analysis_Running
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 text-center">
                  <span className="text-[#00FF41] font-mono text-2xl tracking-[0.2em] uppercase animate-pulse">
                    {steps[processingStep]}
                  </span>
                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-12 h-1 transition-all duration-700',
                          index <= processingStep ? 'bg-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.6)]' : 'bg-white/10'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute top-12 left-12 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Live_Forensic_Extraction_Stream
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="fixed inset-0 pointer-events-none z-20 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
    </div>
  );
}
