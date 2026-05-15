'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import ScreenplayEditor from '@/components/editor/ScreenplayEditor';
import EditorToolbar from '@/components/editor/EditorToolbar';
import AIPanel from '@/components/editor/AIPanel';
import ContinuityPanel from '@/components/editor/ContinuityPanel';
import AnalyticsPanel from '@/components/editor/AnalyticsPanel';
import CommandPalette from '@/components/CommandPalette';
import { useEditorStore } from '@/store/useEditorStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useContinuity } from '@/hooks/useContinuity';
import { useScreenplayFormat } from '@/hooks/useScreenplayFormat';

type SidebarTab = 'ai' | 'continuity' | 'analytics' | null;

const SIDEBAR_TABS: { id: SidebarTab; label: string; color: string }[] = [
  { id: 'ai', label: '✦ AI', color: 'accent' },
  { id: 'continuity', label: 'Alerts', color: 'rose' },
  { id: 'analytics', label: 'Analytics', color: 'cyan' },
];

export default function EditorPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('ai');

  const blocks = useEditorStore((s) => s.blocks);
  const focusedBlockId = useEditorStore((s) => s.focusedBlockId);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setBlockType = useEditorStore((s) => s.setBlockType);
  const addBlock = useEditorStore((s) => s.addBlock);
  const setFocusedBlock = useEditorStore((s) => s.setFocusedBlock);
  const wordCount = useEditorStore((s) => s.wordCount);
  const pageCount = useEditorStore((s) => s.pageCount);

  const { save } = useAutoSave();
  const continuity = useContinuity(projectId);
  const { toFountain } = useScreenplayFormat();

  const focusedBlock = blocks.find((b) => b.id === focusedBlockId);
  const currentSceneText = blocks.map((b) => b.content).join('\n');

  const handleInsertAI = useCallback(
    (text: string) => {
      const afterId = focusedBlockId ?? blocks[blocks.length - 1]?.id ?? null;
      const newId = addBlock(afterId, 'action', text);
      setFocusedBlock(newId);
    },
    [focusedBlockId, blocks, addBlock, setFocusedBlock],
  );

  const handleRunContinuity = useCallback(() => {
    const characters = [
      ...new Set(
        blocks
          .filter((b) => b.type === 'character')
          .map((b) => b.content.trim())
          .filter(Boolean),
      ),
    ];
    continuity.runCheck(blocks, characters);
    setSidebarTab('continuity');
  }, [blocks, continuity]);

  const handleExportFountain = useCallback(() => {
    const text = toFountain(blocks);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'screenplay.fountain';
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks, toFountain]);

  const toggleTab = (tab: SidebarTab) => {
    setSidebarTab((current) => (current === tab ? null : tab));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-void">
      <CommandPalette projectId={projectId} />

      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/[0.04] bg-abyss/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs text-slate-500 transition-colors hover:bg-white/[0.08] hover:text-slate-300"
            title="Back to project"
          >
            ←
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="font-display text-sm font-semibold tracking-wide text-white/80">
            Screenplay Editor
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-700">
            {wordCount().toLocaleString()} words · {pageCount()}p
          </span>
          <span className={clsx('transition-colors', isDirty ? 'text-amber' : 'text-slate-700')}>
            {isDirty ? '● Unsaved' : '✓ Saved'}
          </span>

          <button
            onClick={handleExportFountain}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Export as Fountain (.fountain)"
          >
            ↓ Fountain
          </button>

          <button
            onClick={() => save()}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Save
          </button>
        </div>
      </div>

      {/* Block-type toolbar */}
      <EditorToolbar
        focusedBlockType={focusedBlock?.type ?? null}
        onSetBlockType={(type) => focusedBlockId && setBlockType(focusedBlockId, type)}
        wordCount={wordCount()}
        pageCount={pageCount()}
        isDirty={isDirty}
        onRunContinuity={handleRunContinuity}
        onToggleAI={() => toggleTab('ai')}
        onToggleContinuity={() => toggleTab('continuity')}
        aiOpen={sidebarTab === 'ai'}
        continuityOpen={sidebarTab === 'continuity'}
        alertCount={continuity.criticalCount}
      />

      {/* Editor + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Screenplay paper */}
        <div className="screenplay-scroll relative flex-1 overflow-y-auto">
          <ScreenplayEditor />
        </div>

        {/* Right panel */}
        {sidebarTab !== null && (
          <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-abyss/40 backdrop-blur-sm xl:w-80">
            {/* Tab bar */}
            <div className="flex flex-shrink-0 border-b border-white/[0.06]">
              {SIDEBAR_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => toggleTab(tab.id)}
                  className={clsx(
                    'flex-1 px-2 py-2.5 text-[11px] font-semibold transition-colors',
                    sidebarTab === tab.id
                      ? tab.id === 'ai'
                        ? 'border-b-2 border-accent text-accent'
                        : tab.id === 'continuity'
                          ? 'border-b-2 border-rose-400 text-rose-400'
                          : 'border-b-2 border-cyan text-cyan'
                      : 'text-slate-600 hover:text-slate-400',
                  )}
                >
                  {tab.label}
                  {tab.id === 'continuity' && continuity.criticalCount > 0 && (
                    <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                      {continuity.criticalCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {sidebarTab === 'ai' && (
                <AIPanel
                  projectId={projectId}
                  currentSceneText={currentSceneText}
                  onInsert={handleInsertAI}
                />
              )}
              {sidebarTab === 'continuity' && (
                <ContinuityPanel
                  alerts={continuity.alerts}
                  isChecking={continuity.isChecking}
                  lastChecked={continuity.lastChecked}
                  onResolve={continuity.resolveAlert}
                  onDismiss={continuity.dismissAlert}
                  onRunCheck={handleRunContinuity}
                />
              )}
              {sidebarTab === 'analytics' && (
                <AnalyticsPanel projectId={projectId} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
