import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Play, ServerCrash, Upload } from 'lucide-react';

import { cn } from '../lib/utils';

interface MainWorkSectionProps {
  backendReady: boolean;
  isProcessing: boolean;
  onVerify: (audio1: File, audio2: File) => Promise<void>;
}

export const MainWorkSection: React.FC<MainWorkSectionProps> = ({
  backendReady,
  isProcessing,
  onVerify,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<{ audio1: File | null; audio2: File | null }>({
    audio1: null,
    audio2: null,
  });
  const [errors, setErrors] = useState<{ audio1: string | null; audio2: string | null }>({
    audio1: null,
    audio2: null,
  });

  const handleFileChange = (key: 'audio1' | 'audio2', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const acceptedTypes = ['audio/wav', 'audio/mpeg', 'audio/x-wav', 'audio/mp3', 'audio/flac'];
    const lowerName = file.name.toLowerCase();

    if (
      !acceptedTypes.includes(file.type) &&
      !lowerName.endsWith('.wav') &&
      !lowerName.endsWith('.mp3') &&
      !lowerName.endsWith('.flac')
    ) {
      setErrors((current) => ({ ...current, [key]: 'INVALID_FORMAT: USE .WAV, .MP3 OR .FLAC' }));
      setFiles((current) => ({ ...current, [key]: null }));
      return;
    }

    setFiles((current) => ({ ...current, [key]: file }));
    setErrors((current) => ({ ...current, [key]: null }));
  };

  const canVerify = Boolean(files.audio1 && files.audio2 && backendReady && !isProcessing);

  const handleVerify = async () => {
    if (!files.audio1 || !files.audio2 || !backendReady) {
      return;
    }

    await onVerify(files.audio1, files.audio2);
  };

  return (
    <section className="relative min-height-[100vh] flex items-center justify-center p-6 z-10 overflow-hidden">
      <AnimatePresence>
        {!isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="flex flex-col items-center"
          >
            <motion.div
              onClick={() => !expanded && setExpanded(true)}
              layout
              className={cn(
                'relative group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]',
                'bg-white/5 backdrop-blur-[20px] border border-white/20 overflow-hidden',
                'shadow-[0_0_50px_rgba(0,255,65,0.15),inset_0_0_20px_rgba(255,255,255,0.05)]',
                expanded ? 'w-[800px] h-[580px] rounded-[2rem] p-10' : 'w-48 h-48 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/10'
              )}
            >
              {!expanded ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Fingerprint className="w-10 h-10 text-[#00FF41] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono text-[#00FF41] tracking-[4px] uppercase">Verify</span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="h-full flex flex-col"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col items-start">
                      <h2 className="text-xl font-mono text-[#00FF41] tracking-[2px] flex items-center gap-2">
                        Forensic Speaker Verification
                      </h2>
                      <span className="status-badge mt-2">
                        {backendReady ? 'BACKEND: ONLINE // READY' : 'BACKEND: OFFLINE // START API'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_200px_1fr] gap-8 mb-10 items-center flex-grow">
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center border rounded-xl p-8 transition-all bg-white/[0.02] h-full',
                        files.audio1 ? 'border-[#00FF41]/40 bg-[#00FF41]/5' : 'border-white/10',
                        errors.audio1 && 'border-red-500/50 bg-red-500/5'
                      )}
                    >
                      <label className="cursor-pointer flex flex-col items-center text-center">
                        <Upload
                          className={cn(
                            'w-10 h-10 mb-4 transition-colors',
                            files.audio1 ? 'text-[#00FF41]' : errors.audio1 ? 'text-red-500 animate-bounce' : 'text-white/20'
                          )}
                        />
                        <span className="text-[9px] font-mono text-[#00FF41] tracking-widest mb-2 uppercase">Input_Source_01</span>
                        <div className="flex gap-1 h-6 items-end mb-4">
                          {[40, 70, 50, 85, 30, 60, 90, 40].map((height, index) => (
                            <div key={index} className={cn('w-0.5', files.audio1 ? 'bg-[#00FF41]/40' : 'bg-white/10')} style={{ height: `${height}%` }} />
                          ))}
                        </div>
                        <span className={cn('text-[10px] font-mono truncate max-w-[150px]', errors.audio1 ? 'text-red-400' : 'text-[#888888]')}>
                          {errors.audio1 || files.audio1?.name || 'REFERENCE_A.WAV'}
                        </span>
                        <input type="file" className="hidden" accept=".wav,.mp3,.flac,audio/*" onChange={(event) => handleFileChange('audio1', event)} />
                      </label>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full match-btn-circular flex items-center justify-center border-[#00FF41]/20">
                        <Fingerprint className="w-8 h-8 text-[#00FF41] animate-pulse" />
                      </div>
                      <span className="text-[9px] font-mono text-[#888888] tracking-[3px] uppercase text-center">
                        {backendReady ? 'ECAPA_Backend_Linked' : 'Backend_Not_Reachable'}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'flex flex-col items-center justify-center border rounded-xl p-8 transition-all bg-white/[0.02] h-full',
                        files.audio2 ? 'border-[#00FF41]/40 bg-[#00FF41]/5' : 'border-white/10',
                        errors.audio2 && 'border-red-500/50 bg-red-500/5'
                      )}
                    >
                      <label className="cursor-pointer flex flex-col items-center text-center">
                        <Upload
                          className={cn(
                            'w-10 h-10 mb-4 transition-colors',
                            files.audio2 ? 'text-[#00FF41]' : errors.audio2 ? 'text-red-500 animate-bounce' : 'text-white/20'
                          )}
                        />
                        <span className="text-[9px] font-mono text-[#00FF41] tracking-widest mb-2 uppercase">Input_Source_02</span>
                        <div className="flex gap-1 h-6 items-end mb-4">
                          {[30, 55, 80, 40, 20, 70, 50, 95].map((height, index) => (
                            <div key={index} className={cn('w-0.5', files.audio2 ? 'bg-[#00FF41]/40' : 'bg-white/10')} style={{ height: `${height}%` }} />
                          ))}
                        </div>
                        <span className={cn('text-[10px] font-mono truncate max-w-[150px]', errors.audio2 ? 'text-red-400' : 'text-[#888888]')}>
                          {errors.audio2 || files.audio2?.name || 'QUESTIONED_B.WAV'}
                        </span>
                        <input type="file" className="hidden" accept=".wav,.mp3,.flac,audio/*" onChange={(event) => handleFileChange('audio2', event)} />
                      </label>
                    </div>
                  </div>

                  {!backendReady && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3 text-left">
                      <ServerCrash className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-100/80 leading-relaxed">
                        Start the Python API first. This verifier now uses the real backend model and will not run on demo data.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-6">
                    <button
                      onClick={() => void handleVerify()}
                      disabled={!canVerify}
                      className={cn(
                        'flex-grow py-5 rounded-lg flex items-center justify-center gap-4 font-mono transition-all',
                        'text-sm font-bold tracking-[0.4em] uppercase',
                        canVerify
                          ? 'bg-[#00FF41] text-black hover:bg-[#00FF41]/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]'
                          : 'bg-white/5 text-white/10 border border-white/10 cursor-not-allowed'
                      )}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Verify
                    </button>
                    <button
                      onClick={() => setExpanded(false)}
                      className="px-8 rounded-lg bg-white/5 text-[#888888] border border-white/10 hover:text-white hover:bg-white/10 transition-all font-mono text-xs tracking-widest uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
