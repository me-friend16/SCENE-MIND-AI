'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
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

const pacingColors: Record<string, string> = {
  slow: 'text-slate-400 bg-slate-400/10',
  steady: 'text-cyan bg-cyan/10',
  accelerating: 'text-amber bg-amber/10',
  intense: 'text-rose-400 bg-rose-400/10',
  balanced: 'text-emerald-400 bg-emerald-400/10',
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber';
  if (score >= 40) return 'text-orange-400';
  return 'text-rose-400';
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

  const acts = analysis
    ? [
        { label: 'Act I', pacing: analysis.pacing_analysis.act_one },
        { label: 'Act II', pacing: analysis.pacing_analysis.act_two },
        { label: 'Act III', pacing: analysis.pacing_analysis.act_three },
      ]
    : [];

  // Count block types for the quick breakdown
  const sceneCnt = blocks.filter((b) => b.type === 'scene-heading').length;
  const charCnt = [...new Set(blocks.filter((b) => b.type === 'character').map((b) => b.content.trim()).filter(Boolean))].length;
  const wordCnt = blocks.map((b) => b.content).join(' ').trim().split(/\s+/).filter(Boolean).length;

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

      <div className="screenplay-scroll flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Scenes', value: sceneCnt },
            { label: 'Characters', value: charCnt },
            { label: 'Words', value: wordCnt.toLocaleString() },
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

        {isAnalyzing && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
            <span className="text-[11px] text-slate-500">Running story analysis…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2">
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}

        {!analysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan/10">
              <span className="text-lg text-cyan">◈</span>
            </div>
            <p className="max-w-[180px] text-[11px] leading-relaxed text-slate-600">
              Run an analysis to see your story score, pacing breakdown, and AI recommendations.
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
                <span className={clsx('text-4xl font-bold tabular-nums', scoreColor(analysis.story_score))}>
                  {analysis.story_score}
                </span>
                <span className="mb-1 text-sm text-slate-600">/ 100</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={clsx('h-full rounded-full bg-gradient-to-r transition-all', scoreGradient(analysis.story_score))}
                  style={{ width: `${analysis.story_score}%` }}
                />
              </div>
            </div>

            {/* Pacing */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Pacing
              </p>
              <div className="space-y-1.5">
                {acts.map(({ label, pacing }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 w-12">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full',
                          pacing === 'intense' ? 'w-full bg-rose-400' :
                          pacing === 'accelerating' ? 'w-3/4 bg-amber' :
                          pacing === 'steady' ? 'w-1/2 bg-cyan' :
                          'w-1/4 bg-slate-500'
                        )}
                      />
                    </div>
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                        pacingColors[pacing] ?? pacingColors.steady,
                      )}
                    >
                      {pacing}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                      <span className="mt-0.5 flex-shrink-0 text-accent text-[10px]">✦</span>
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
