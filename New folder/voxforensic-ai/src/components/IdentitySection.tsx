import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Play, Search, Trash2, Upload, UserPlus } from 'lucide-react';

import { cn } from '../lib/utils';

interface IdentitySectionProps {
  backendReady: boolean;
  isProcessing: boolean;
  speakers: string[];
  onIdentify: (audio: File) => Promise<void>;
  onRegisterSpeaker: (name: string, audio: File) => Promise<void>;
  onDeleteSpeaker: (name: string) => Promise<void>;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  backendReady,
  isProcessing,
  speakers,
  onIdentify,
  onRegisterSpeaker,
  onDeleteSpeaker,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speakerName, setSpeakerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpeakers = speakers.filter((speaker) =>
    speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const acceptedTypes = ['audio/wav', 'audio/mpeg', 'audio/x-wav', 'audio/mp3', 'audio/flac'];
    const lowerName = selectedFile.name.toLowerCase();

    if (
      !acceptedTypes.includes(selectedFile.type) &&
      !lowerName.endsWith('.wav') &&
      !lowerName.endsWith('.mp3') &&
      !lowerName.endsWith('.flac')
    ) {
      setError('INVALID_FORMAT: USE .WAV, .MP3 OR .FLAC');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setSpeakerName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setError(null);
  };

  const handleIdentify = async () => {
    if (!file || !backendReady) {
      return;
    }

    await onIdentify(file);
  };

  const handleRegisterSpeaker = async () => {
    if (!file || !speakerName.trim() || !backendReady) {
      return;
    }

    await onRegisterSpeaker(speakerName.trim(), file);
    setSpeakerName('');
  };

  const canProcess = Boolean(file && backendReady && !isProcessing);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center p-6 z-10 overflow-hidden border-t border-white/5 bg-black/50">
      <AnimatePresence>
        {!isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-black text-[#E0E0E0] uppercase tracking-tighter mb-2">Speaker Identity Creator</h2>
              <p className="text-[#888888] font-mono text-[10px] uppercase tracking-[4px]">
                Identify a specimen or register it into the backend speaker database
              </p>
            </div>

            <motion.div
              onClick={() => !expanded && setExpanded(true)}
              layout
              className={cn(
                'relative group transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]',
                'bg-white/5 backdrop-blur-[20px] border border-white/20 overflow-hidden',
                'shadow-[0_0_50px_rgba(0,255,65,0.1),inset_0_0_20px_rgba(255,255,255,0.05)]',
                expanded ? 'w-[980px] min-h-[640px] rounded-[2rem] p-12' : 'w-48 h-48 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/10'
              )}
            >
              {!expanded ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <UserPlus className="w-10 h-10 text-[#00FF41] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono text-[#00FF41] tracking-[4px] uppercase text-center">Identify Voice</span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="h-full flex flex-col w-full"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex flex-col items-start text-left">
                      <h2 className="text-xl font-mono text-[#00FF41] tracking-[2px] flex items-center gap-2 uppercase">
                        Speaker Identification
                      </h2>
                      <span className="status-badge mt-2">
                        {backendReady ? 'VOICE DATABASE CONNECTED' : 'VOICE DATABASE OFFLINE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] group-focus-within/search:text-[#00FF41] transition-colors" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="SEARCH_VOICE_DATABASE..."
                          className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 font-mono text-[10px] text-[#00FF41] placeholder:text-[#444] outline-none focus:border-[#00FF41]/30 focus:bg-white/10 transition-all w-64"
                        />
                      </div>
                      <button className="bg-[#00FF41]/10 border border-[#00FF41]/20 p-2 rounded-lg text-[#00FF41] transition-colors">
                        <Database className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-8 flex-grow mb-10">
                    <div
                      className={cn(
                        'w-full flex flex-col items-center justify-center border rounded-xl p-12 transition-all bg-white/[0.02]',
                        file ? 'border-[#00FF41]/40 bg-[#00FF41]/5' : 'border-white/10',
                        error && 'border-red-500/50 bg-red-500/5'
                      )}
                    >
                      <label className="cursor-pointer flex flex-col items-center text-center w-full">
                        <Upload
                          className={cn(
                            'w-12 h-12 mb-6 transition-colors',
                            file ? 'text-[#00FF41]' : error ? 'text-red-500 animate-bounce' : 'text-white/20'
                          )}
                        />
                        <span className="text-[10px] font-mono text-[#00FF41] tracking-widest mb-4 uppercase">Specimen_Source_Input</span>
                        <div className="flex gap-1 h-8 items-end mb-6">
                          {[20, 50, 80, 40, 60, 90, 30, 70, 45, 85].map((height, index) => (
                            <div key={index} className={cn('w-1', file ? 'bg-[#00FF41]/40' : 'bg-white/10')} style={{ height: `${height}%` }} />
                          ))}
                        </div>
                        <span className={cn('text-xs font-mono truncate max-w-[300px]', error ? 'text-red-400' : 'text-[#888888]')}>
                          {error || file?.name || 'UPLOAD_SINGLE_VOICE_SPECIMEN.WAV'}
                        </span>
                        <input type="file" className="hidden" accept=".wav,.mp3,.flac,audio/*" onChange={handleFileChange} />
                      </label>

                      <div className="w-full mt-8 space-y-4">
                        <input
                          type="text"
                          value={speakerName}
                          onChange={(event) => setSpeakerName(event.target.value)}
                          placeholder="NEW_SPEAKER_NAME"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-[#00FF41] placeholder:text-[#444] outline-none focus:border-[#00FF41]/30 focus:bg-white/10 transition-all"
                        />

                        <button
                          onClick={() => void handleRegisterSpeaker()}
                          disabled={!file || !speakerName.trim() || !backendReady}
                          className={cn(
                            'w-full py-3 rounded-lg font-mono text-xs uppercase tracking-[0.25em] transition-all border',
                            file && speakerName.trim() && backendReady
                              ? 'bg-white text-black border-white hover:bg-[#dddddd]'
                              : 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed'
                          )}
                        >
                          Save_To_Speaker_Database
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[#00FF41] font-mono text-[10px] uppercase tracking-[0.3em]">
                          Stored Profiles
                        </h3>
                        <span className="text-[10px] font-mono text-[#888888]">
                          {speakers.length} total
                        </span>
                      </div>

                      <div className="flex-grow overflow-auto no-scrollbar space-y-2 pr-1">
                        {filteredSpeakers.length > 0 ? (
                          filteredSpeakers.map((speaker) => (
                            <div
                              key={speaker}
                              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-3"
                            >
                              <span className="text-sm text-[#E0E0E0] truncate">{speaker}</span>
                              <button
                                onClick={() => void onDeleteSpeaker(speaker)}
                                className="text-[#888888] hover:text-red-400 transition-colors"
                                aria-label={`Delete ${speaker}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="h-full min-h-[240px] rounded-lg border border-dashed border-white/10 flex items-center justify-center text-center px-6">
                            <p className="text-sm text-[#666] leading-relaxed">
                              {speakers.length === 0
                                ? 'No backend speaker profiles have been saved yet.'
                                : 'No speakers match the current search.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 w-full">
                    <button
                      onClick={() => void handleIdentify()}
                      disabled={!canProcess}
                      className={cn(
                        'flex-grow py-5 rounded-lg flex items-center justify-center gap-4 font-mono transition-all',
                        'text-sm font-bold tracking-[0.4em] uppercase',
                        canProcess
                          ? 'bg-[#00FF41] text-black hover:bg-[#00FF41]/80 shadow-[0_0_30px_rgba(0,255,65,0.3)]'
                          : 'bg-white/5 text-white/10 border border-white/10 cursor-not-allowed'
                      )}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Identify
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
