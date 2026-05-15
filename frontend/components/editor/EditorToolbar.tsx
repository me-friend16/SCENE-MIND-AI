'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { BlockType } from '@/store/useEditorStore';
import { useScreenplayFormat } from '@/hooks/useScreenplayFormat';

const BLOCK_TYPES: BlockType[] = [
  'scene-heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

const shortKeys: Record<BlockType, string> = {
  'scene-heading': '⇧1',
  action: '⇧2',
  character: '⇧3',
  dialogue: '⇧4',
  parenthetical: '⇧5',
  transition: '⇧6',
};

interface Props {
  focusedBlockType: BlockType | null;
  onSetBlockType: (type: BlockType) => void;
  wordCount: number;
  pageCount: number;
  isDirty: boolean;
  onRunContinuity: () => void;
  onToggleAI: () => void;
  onToggleContinuity: () => void;
  aiOpen: boolean;
  continuityOpen: boolean;
  alertCount: number;
}

export default function EditorToolbar({
  focusedBlockType,
  onSetBlockType,
  wordCount,
  pageCount,
  isDirty,
  onRunContinuity,
  onToggleAI,
  onToggleContinuity,
  aiOpen,
  continuityOpen,
  alertCount,
}: Props) {
  const [typeOpen, setTypeOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { getLabel } = useScreenplayFormat();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] bg-abyss/50 px-4 py-2 backdrop-blur-sm">
      {/* Block type selector */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setTypeOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {focusedBlockType ? getLabel(focusedBlockType) : 'Select type'}
          <span className="text-slate-600">▾</span>
        </button>

        {typeOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-card shadow-xl">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onSetBlockType(type);
                  setTypeOpen(false);
                }}
                className={clsx(
                  'flex w-full items-center justify-between px-4 py-2 text-xs transition-colors',
                  type === focusedBlockType
                    ? 'bg-accent/20 text-accent'
                    : 'text-slate-300 hover:bg-white/[0.06]',
                )}
              >
                <span>{getLabel(type)}</span>
                <span className="ml-6 text-slate-600">{shortKeys[type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Centre stats */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{pageCount}p</span>
        <span className={clsx('transition-colors', isDirty ? 'text-amber' : 'text-slate-700')}>
          {isDirty ? '● unsaved' : '✓ saved'}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunContinuity}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-200"
        >
          Check
        </button>

        <button
          onClick={onToggleContinuity}
          className={clsx(
            'relative rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
            continuityOpen
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]',
          )}
        >
          Alerts
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>

        <button
          onClick={onToggleAI}
          className={clsx(
            'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
            aiOpen
              ? 'border-accent/40 bg-accent/15 text-accent shadow-glow-sm'
              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]',
          )}
        >
          ✦ AI
        </button>
      </div>
    </div>
  );
}
