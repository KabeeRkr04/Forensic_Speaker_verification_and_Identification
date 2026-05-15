import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Database, Fingerprint, Trash2, UserCheck, UserPlus } from 'lucide-react';

import type { IdentifyResponse } from '../lib/api';

interface IdentityAnalysisSectionProps {
  result: IdentifyResponse;
  sourceFile: File | null;
  isMutatingSpeaker: boolean;
  onRegisterSpeaker: (name: string, audio: File) => Promise<void>;
  onDeleteSpeaker: (name: string) => Promise<void>;
}

function formatValue(value: number, digits = 3) {
  return value.toFixed(digits);
}

export const IdentityAnalysisSection: React.FC<IdentityAnalysisSectionProps> = ({
  result,
  sourceFile,
  isMutatingSpeaker,
  onRegisterSpeaker,
  onDeleteSpeaker,
}) => {
  const [speakerName, setSpeakerName] = useState('');

  useEffect(() => {
    if (!sourceFile) {
      setSpeakerName('');
      return;
    }

    setSpeakerName(sourceFile.name.replace(/\.[^/.]+$/, ''));
  }, [sourceFile]);

  const waveformData = result.audio.waveform.map((point) => ({
    index: point.index,
    waveform: point.value,
  }));

  const spectrumData = result.audio.spectrum.map((point) => ({
    index: point.index,
    spectrum: point.value,
  }));

  const matchData = result.top_matches.map((match) => ({
    name: match.name,
    score: match.score_percent,
  }));

  const handleRegister = async () => {
    if (!sourceFile || !speakerName.trim()) {
      return;
    }

    await onRegisterSpeaker(speakerName.trim(), sourceFile);
  };

  return (
    <section className="relative z-10 min-h-screen bg-[#050505]/95 p-8 space-y-8 pb-32 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#E0E0E0] uppercase tracking-widest font-mono mb-2">Voiceprint Identity Analysis</h2>
            <div className="status-badge inline-block uppercase">
              {result.identified ? 'DATABASE MATCH FOUND' : 'NO MATCH ABOVE THRESHOLD'}
            </div>
          </div>

          <div className="text-right font-mono text-[10px] uppercase tracking-[0.3em] text-[#888888]">
            <p>Device: {result.device}</p>
            <p>Profiles: {result.speaker_count}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-[400px] flex flex-col relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#00FF41]/5 to-transparent pointer-events-none" />
              <h4 className="text-[#00FF41] font-mono text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Waveform_Profile
              </h4>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waveformData}>
                    <defs>
                      <linearGradient id="identityWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #00FF4133', borderRadius: '4px' }}
                      itemStyle={{ color: '#00FF41', fontSize: '10px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="waveform"
                      stroke="#00FF41"
                      fillOpacity={1}
                      fill="url(#identityWave)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <span className="text-[9px] font-mono text-[#888888]">
                  DURATION: {formatValue(result.audio.duration_seconds, 2)}s
                </span>
                <span className="text-[9px] font-mono text-[#888888]">
                  RMS: {formatValue(result.audio.rms, 4)}
                </span>
                <span className="text-[9px] font-mono text-[#888888]">
                  ZERO-X: {formatValue(result.audio.zero_crossing_rate, 4)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[280px]">
                <h5 className="text-[10px] font-mono text-[#888888] mb-4 uppercase tracking-widest">Mel_Spectrum_Profile</h5>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spectrumData}>
                    <defs>
                      <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="spectrum" stroke="#ffffff" fill="url(#spectrumFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[280px]">
                <h5 className="text-[10px] font-mono text-[#888888] mb-4 uppercase tracking-widest">Top_Match_Scores</h5>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                    <Bar dataKey="score" fill="#00FF41" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-8 h-full">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full flex flex-col text-center min-h-[500px]">
              {result.identified && result.best_match ? (
                <>
                  <div className="p-6 bg-[#00FF41]/10 rounded-full border border-[#00FF41]/20 inline-flex self-center">
                    <UserCheck className="w-16 h-16 text-[#00FF41]" />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-2xl font-black text-[#E0E0E0] uppercase tracking-tighter mb-2">Subject Identified</h3>
                    <p className="text-[#888888] font-mono text-xs">Best match from the real backend speaker database.</p>
                  </div>

                  <div className="w-full space-y-4 bg-black/40 p-6 rounded-lg border border-white/5 mt-8 text-left">
                    <DetailRow label="MATCH" value={result.best_match.name} accent />
                    <DetailRow label="RAW SCORE" value={result.best_match.score.toFixed(4)} />
                    <DetailRow label="NORMALIZED" value={`${result.best_match.score_percent.toFixed(2)}%`} accent />
                    <DetailRow label="THRESHOLD" value={result.threshold.toFixed(2)} />
                  </div>

                  <button
                    onClick={() => void onDeleteSpeaker(result.best_match.name)}
                    className="w-full mt-6 py-4 bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete_Matched_Profile
                  </button>
                </>
              ) : (
                <>
                  <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20 inline-flex self-center">
                    <UserPlus className="w-16 h-16 text-red-500" />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-2xl font-black text-[#E0E0E0] uppercase tracking-tighter mb-2">Unknown Source</h3>
                    <p className="text-[#888888] font-mono text-xs">
                      {result.database_empty
                        ? 'The backend database is empty. Save this voice to create the first profile.'
                        : 'No stored speaker crossed the identification threshold.'}
                    </p>
                  </div>

                  <div className="w-full mt-8 space-y-4 text-left">
                    <label className="text-[10px] font-mono text-[#888888] uppercase tracking-[0.2em]">
                      New Speaker Name
                    </label>
                    <input
                      type="text"
                      value={speakerName}
                      onChange={(event) => setSpeakerName(event.target.value)}
                      placeholder="ENTER_PROFILE_NAME"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-[#00FF41] placeholder:text-[#444] outline-none focus:border-[#00FF41]/30 focus:bg-white/10 transition-all"
                    />
                    <button
                      onClick={() => void handleRegister()}
                      disabled={!sourceFile || !speakerName.trim() || isMutatingSpeaker}
                      className="w-full py-4 bg-white text-black font-mono text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#dddddd] transition-all disabled:bg-white/5 disabled:text-white/20 disabled:border disabled:border-white/10 disabled:cursor-not-allowed"
                    >
                      {isMutatingSpeaker ? 'Saving_Profile...' : 'Create_New_Speaker_Profile'}
                    </button>
                  </div>

                  <div className="pt-6 text-left w-full space-y-2 mt-auto">
                    <p className="text-[10px] font-mono text-[#555] uppercase leading-relaxed">
                      Backend score threshold: {result.threshold.toFixed(2)}. Best observed match:{' '}
                      {result.best_match ? `${result.best_match.name} (${result.best_match.score.toFixed(4)})` : 'none'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-4 h-4 text-[#00FF41]" />
                <h4 className="text-[#E0E0E0] font-mono uppercase tracking-[0.2em] text-xs">Candidate Matches</h4>
              </div>
              <div className="space-y-3">
                {result.top_matches.length > 0 ? (
                  result.top_matches.map((match) => (
                    <div key={match.name} className="rounded-lg border border-white/10 bg-black/30 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[#E0E0E0] truncate">{match.name}</span>
                        <span className="text-[10px] font-mono text-[#00FF41]">
                          {match.score_percent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-[#00FF41]" style={{ width: `${match.score_percent}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#666] leading-relaxed">
                    No speaker candidates are available yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DetailRow = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
    <span className="text-[#888888]">{label}:</span>
    <span className={accent ? 'text-[#00FF41]' : 'text-white'}>{value}</span>
  </div>
);
