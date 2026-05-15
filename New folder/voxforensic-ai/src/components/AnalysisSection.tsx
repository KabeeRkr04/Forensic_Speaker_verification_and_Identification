import React, { useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { CheckCircle2, Download, FileAudio, Fingerprint, Settings2, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { cn } from '../lib/utils';
import type { VerifyResponse } from '../lib/api';

const THEMES = [
  { id: 'matrix', name: 'Matrix Green', color: '#00FF41', secondary: '#004400' },
  { id: 'cyberpunk', name: 'Cyberpunk Pink', color: '#ff00ff', secondary: '#440044' },
  { id: 'neon', name: 'Neon Blue', color: '#00ffff', secondary: '#004444' },
  { id: 'amber', name: 'Vintage Amber', color: '#ffb000', secondary: '#442200' },
];

function formatValue(value: number, digits = 3) {
  return value.toFixed(digits);
}

export const AnalysisSection: React.FC<{ result: VerifyResponse }> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);

  const waveformLength = Math.max(result.audio_1.waveform.length, result.audio_2.waveform.length);
  const waveformData = Array.from({ length: waveformLength }, (_, index) => ({
    index,
    audio1: result.audio_1.waveform[index]?.value ?? 0,
    audio2: result.audio_2.waveform[index]?.value ?? 0,
  }));

  const embeddingLength = Math.max(
    result.audio_1.embedding_preview.length,
    result.audio_2.embedding_preview.length
  );
  const embeddingData = Array.from({ length: embeddingLength }, (_, index) => ({
    label:
      result.audio_1.embedding_preview[index]?.label ??
      result.audio_2.embedding_preview[index]?.label ??
      `D${index + 1}`,
    audio1: result.audio_1.embedding_preview[index]?.value ?? 0,
    audio2: result.audio_2.embedding_preview[index]?.value ?? 0,
  }));

  const exportPDF = async () => {
    if (!reportRef.current) {
      return;
    }

    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: '#050505',
      scale: 2,
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imageProps = pdf.getImageProperties(imageData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imageProps.height * pdfWidth) / imageProps.width;

    pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('VoxForensic_Report.pdf');
  };

  return (
    <section className="relative z-10 min-h-screen bg-[#050505]/95 p-8 space-y-8 pb-20">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#E0E0E0] uppercase tracking-widest font-mono mb-2">Analysis Dashboard</h2>
            <div className="status-badge inline-block uppercase">Backend Device: {result.device}</div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-lg">
              <Settings2 className="w-4 h-4 text-[#888888]" />
              <div className="flex gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentTheme(theme)}
                    title={theme.name}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all',
                      currentTheme.id === theme.id ? 'scale-110' : 'scale-90 opacity-40 hover:opacity-100'
                    )}
                    style={{ backgroundColor: theme.color, borderColor: currentTheme.id === theme.id ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-[#888888] ml-2">CORE_VISUALS</span>
            </div>

            <button
              onClick={exportPDF}
              className="flex items-center gap-2 border px-6 py-3 rounded-lg font-bold transition-all font-mono text-xs uppercase tracking-widest"
              style={{ borderColor: currentTheme.color, color: currentTheme.color }}
            >
              <Download className="w-4 h-4" /> Export_Report_PDF
            </button>
          </div>
        </div>

        <div ref={reportRef} className="space-y-8 p-4 bg-[#050505]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 bg-white/[0.04] backdrop-blur-[10px] border border-white/10 rounded-xl p-8 relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6" style={{ color: currentTheme.color }}>
                  <span className="text-[10px] font-mono tracking-[4px] uppercase border-b pb-1" style={{ borderColor: `${currentTheme.color}44` }}>
                    Final_Verdict
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  {result.same_speaker ? (
                    <CheckCircle2 className="w-10 h-10" style={{ color: currentTheme.color }} />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-400" />
                  )}
                  <h3 className="text-5xl 2xl:text-7xl font-black text-[#E0E0E0] uppercase font-sans tracking-tighter">
                    {result.verdict.replace(/_/g, ' ')}
                  </h3>
                </div>
                <p className="text-[#888888] font-mono text-sm max-w-xl leading-relaxed">
                  BACKEND_SCORE: <span style={{ color: currentTheme.color }}>{result.score.toFixed(4)}</span> //
                  NORMALIZED_MATCH: <span style={{ color: currentTheme.color }}> {result.score_percent.toFixed(2)}%</span> //
                  THRESHOLD: <span style={{ color: currentTheme.color }}> {result.threshold.toFixed(2)}</span>
                </p>
              </div>
              <div
                className="absolute top-[-20%] right-[-10%] p-8 font-mono text-[15rem] font-black pointer-events-none select-none"
                style={{ color: `${currentTheme.color}08` }}
              >
                {result.score_percent.toFixed(0)}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-xl p-8 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <h4 className="text-[#888888] font-mono text-[10px] uppercase tracking-[3px] mb-8">Match_Metric_Profile</h4>
                <div className="space-y-6">
                  {result.comparison_metrics.map((metric, index) => (
                    <div key={`${metric.name}-${index}`}>
                      <div className="flex justify-between text-[10px] font-mono text-[#888888] mb-2 uppercase italic">
                        <span>{metric.name}</span>
                        <span style={{ color: currentTheme.color }}>{metric.value.toFixed(2)}% Match</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${metric.value}%`, backgroundColor: currentTheme.color }} />
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-[#666]">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 2xl:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-8 h-[400px] flex flex-col">
              <h4 className="text-white font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: currentTheme.color }} /> Spectral Waveform Comparison
              </h4>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waveformData}>
                    <defs>
                      <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentTheme.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={currentTheme.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: currentTheme.color }}
                    />
                    <Area
                      type="monotone"
                      dataKey="audio1"
                      stroke={currentTheme.color}
                      fillOpacity={1}
                      fill="url(#colorWave)"
                      animationDuration={2000}
                    />
                    <Area
                      type="monotone"
                      dataKey="audio2"
                      stroke="#888"
                      strokeDasharray="5 5"
                      fill="transparent"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 2xl:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-8 h-[400px] flex flex-col">
              <h4 className="text-white font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" style={{ color: currentTheme.color }} /> Neural Vector Alignment
              </h4>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={embeddingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="label" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} domain={[0, 1]} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Bar dataKey="audio1" fill={currentTheme.color} radius={[4, 4, 0, 0]}>
                      {embeddingData.map((_, index) => (
                        <Cell key={`audio1-${index}`} fill={currentTheme.color} fillOpacity={0.4} />
                      ))}
                    </Bar>
                    <Bar dataKey="audio2" fill={currentTheme.color} radius={[4, 4, 0, 0]}>
                      {embeddingData.map((_, index) => (
                        <Cell key={`audio2-${index}`} fill={currentTheme.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-3">
                <FileAudio className="w-5 h-5" style={{ color: currentTheme.color }} />
                <h4 className="text-[#E0E0E0] font-mono uppercase tracking-[0.2em] text-sm">Reference Specimen</h4>
              </div>
              <p className="text-[#E0E0E0] text-lg truncate">{result.audio_1.filename}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <MetricCard label="Duration" value={`${formatValue(result.audio_1.duration_seconds, 2)} s`} />
                <MetricCard label="RMS" value={formatValue(result.audio_1.rms, 4)} />
                <MetricCard label="Peak" value={formatValue(result.audio_1.peak, 4)} />
                <MetricCard label="Zero Crossing" value={formatValue(result.audio_1.zero_crossing_rate, 4)} />
              </div>
            </div>

            <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-3">
                <FileAudio className="w-5 h-5" style={{ color: currentTheme.color }} />
                <h4 className="text-[#E0E0E0] font-mono uppercase tracking-[0.2em] text-sm">Questioned Specimen</h4>
              </div>
              <p className="text-[#E0E0E0] text-lg truncate">{result.audio_2.filename}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <MetricCard label="Duration" value={`${formatValue(result.audio_2.duration_seconds, 2)} s`} />
                <MetricCard label="RMS" value={formatValue(result.audio_2.rms, 4)} />
                <MetricCard label="Peak" value={formatValue(result.audio_2.peak, 4)} />
                <MetricCard label="Zero Crossing" value={formatValue(result.audio_2.zero_crossing_rate, 4)} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 flex items-center justify-between text-white/20 font-mono text-[10px] uppercase tracking-widest">
          <span>VoxForensic Analytical Engine v2.4.0</span>
          <span>End of Report</span>
        </div>
      </div>
    </section>
  );
};

const Activity = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-black/30 rounded-lg p-4">
    <span className="block text-[#666] uppercase text-[10px] font-mono mb-2">{label}</span>
    <span>{value}</span>
  </div>
);
