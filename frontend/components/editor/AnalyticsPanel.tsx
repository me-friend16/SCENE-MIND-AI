'use client';

import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useEditorStore } from '@/store/useEditorStore';
import { analyzeStory } from '@/lib/api';

interface StoryAnalysis {
  story_score: number;
  pacing_analysis: {
    act_one: string;
    act_two: string;
    act_three: string;
  };
  recommendations: string[];
}

const pacingValue: Record<string, number> = {
  slow: 20,
  steady: 50,
  balanced: 60,
  accelerating: 78,
  intense: 95,
};

const pacingColor: Record<string, string> = {
  slow: '#64748b',
  steady: '#22DDCC',
  balanced: '#10b981',
  accelerating: '#FFAA44',
  intense: '#f43f5e',
};

const scoreColor = (score: number) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#FFAA44';
  if (score >= 40) return '#f97316';
  return '#f43f5e';
};

const scoreGradient = (score: number) => {
  if (score >= 80) return 'from-emerald-500 to-cyan';
  if (score >= 60) return 'from-amber to-yellow-300';
  if (score >= 40) return 'from-orange-500 to-amber';
  return 'from-rose-500 to-orange-500';
};

interface Props {
  projectId: string;
}

export default function AnalyticsPanel({ projectId }: Props) {
  const blocks = useEditorStore((s) => s.blocks);
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const text = blocks.map((b) => b.content).join('\n');
      const result = await analyzeStory({ project_id: projectId, screenplay_text: text });
      setAnalysis(result);
    } catch {
      setError('Analysis failed. Make sure the AI service is running.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, projectId]);

  // Quick stats
  const sceneCnt = blocks.filter((b) => b.type === 'scene-heading').length;
  const charCnt = [
    ...new Set(
      blocks
        .filter((b) => b.type === 'character')
        .map((b) => b.content.trim())
        .filter(Boolean),
    ),
  ].length;
  const wordCnt = blocks
    .map((b) => b.content)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Build per-scene tension curve from block density
  const tensionData = useMemo(() => {
    const sceneBlocks = blocks.reduce<{ scene: number; lines: number }[]>((acc, b) => {
      if (b.type === 'scene-heading') {
        acc.push({ scene: acc.length + 1, lines: 0 });
      } else if (acc.length > 0) {
        acc[acc.length - 1].lines += 1;
      }
      return acc;
    }, []);

    if (sceneBlocks.length === 0) return [];

    return sceneBlocks.map((s, i) => ({
      scene: `S${s.scene}`,
      tension: Math.min(100, Math.round(
        (s.lines * 8) +
        (i / sceneBlocks.length) * 30 +
        Math.sin(i * 0.7) * 12 +
        20,
      )),
    }));
  }, [blocks]);

  // Pacing bar data from analysis
  const pacingData = analysis
    ? [
        { act: 'Act I', pacing: analysis.pacing_analysis.act_one, value: pacingValue[analysis.pacing_analysis.act_one] ?? 50 },
        { act: 'Act II', pacing: analysis.pacing_analysis.act_two, value: pacingValue[analysis.pacing_analysis.act_two] ?? 50 },
        { act: 'Act III', pacing: analysis.pacing_analysis.act_three, value: pacingValue[analysis.pacing_analysis.act_three] ?? 50 },
      ]
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-cyan">
            Story Analytics
          </p>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || blocks.length === 0}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.08] disabled:opacity-40"
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      <div className="screenplay-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Scenes', value: sceneCnt },
            { label: 'Chars', value: charCnt },
            { label: 'Words', value: wordCnt > 999 ? `${(wordCnt / 1000).toFixed(1)}k` : wordCnt },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
            >
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-[10px] text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        {/* Tension curve chart */}
        {tensionData.length > 1 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Scene Tension Curve
            </p>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={tensionData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9B6DFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9B6DFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="scene"
                    tick={{ fontSize: 8, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 8, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#06061A',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      fontSize: 10,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#9B6DFF' }}
                    formatter={(v: number) => [`${v}`, 'Tension']}
                  />
                  <Area
                    type="monotone"
                    dataKey="tension"
                    stroke="#9B6DFF"
                    strokeWidth={2}
                    fill="url(#tensionGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
            <span className="text-[11px] text-slate-500">Running AI analysis…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2">
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}

        {!analysis && !isAnalyzing && tensionData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan/10">
              <span className="text-lg text-cyan">◈</span>
            </div>
            <p className="max-w-[180px] text-[11px] leading-relaxed text-slate-600">
              Write some scenes, then run Analyze for AI insights on story score and pacing.
            </p>
          </div>
        )}

        {analysis && (
          <>
            {/* Story score */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Story Score
              </p>
              <div className="flex items-end gap-3">
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: scoreColor(analysis.story_score) }}
                >
                  {analysis.story_score}
                </span>
                <span className="mb-1 text-sm text-slate-600">/ 100</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-700', scoreGradient(analysis.story_score))}
                  style={{ width: `${analysis.story_score}%` }}
                />
              </div>
            </div>

            {/* Pacing bar chart */}
            {pacingData.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Pacing by Act
                </p>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={pacingData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis
                        dataKey="act"
                        tick={{ fontSize: 9, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{
                          background: '#06061A',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          fontSize: 10,
                        }}
                        formatter={(v: number, _: string, p: { payload: { pacing: string } }) => [
                          p.payload.pacing,
                          'Pacing',
                        ]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {pacingData.map((d) => (
                          <Cell key={d.act} fill={pacingColor[d.pacing] ?? '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex justify-around text-[9px] text-slate-600">
                    {pacingData.map((d) => (
                      <span key={d.act} className="capitalize" style={{ color: pacingColor[d.pacing] ?? '#64748b' }}>
                        {d.pacing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  AI Recommendations
                </p>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-[10px] text-accent">✦</span>
                      <p className="text-[11px] leading-relaxed text-slate-300">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
