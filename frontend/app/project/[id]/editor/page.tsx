'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import ScreenplayEditor from '@/components/editor/ScreenplayEditor';
import EditorToolbar from '@/components/editor/EditorToolbar';
import AIPanel from '@/components/editor/AIPanel';
import ContinuityPanel from '@/components/editor/ContinuityPanel';
import AnalyticsPanel from '@/components/editor/AnalyticsPanel';
import VersionHistoryPanel from '@/components/editor/VersionHistoryPanel';
import CommandPalette from '@/components/CommandPalette';
import { useEditorStore } from '@/store/useEditorStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useContinuity } from '@/hooks/useContinuity';
import { useScreenplayFormat } from '@/hooks/useScreenplayFormat';
import { fetchScreenplay } from '@/lib/api';
import { exportDocx } from '@/lib/export';

type SidebarTab = 'ai' | 'continuity' | 'analytics' | null;

const SIDEBAR_TABS: { id: SidebarTab; label: string }[] = [
  { id: 'ai', label: '✦ AI' },
  { id: 'continuity', label: 'Alerts' },
  { id: 'analytics', label: 'Analytics' },
];

export default function EditorPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('ai');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const loadedRef = useRef(false);

  const blocks = useEditorStore((s) => s.blocks);
  const focusedBlockId = useEditorStore((s) => s.focusedBlockId);
  const isDirty = useEditorStore((s) => s.isDirty);
  const screenplayId = useEditorStore((s) => s.screenplayId);
  const setBlockType = useEditorStore((s) => s.setBlockType);
  const addBlock = useEditorStore((s) => s.addBlock);
  const setFocusedBlock = useEditorStore((s) => s.setFocusedBlock);
  const wordCount = useEditorStore((s) => s.wordCount);
  const pageCount = useEditorStore((s) => s.pageCount);
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const setProjectId = useEditorStore((s) => s.setProjectId);
  const setScreenplayId = useEditorStore((s) => s.setScreenplayId);

  useEffect(() => {
    if (loadedRef.current || !projectId) return;
    loadedRef.current = true;
    setProjectId(projectId);

    fetchScreenplay(projectId)
      .then((data) => {
        const screenplay = data.screenplay;
        setScreenplayId(String(screenplay.id));
        if (Array.isArray(screenplay.blocks) && screenplay.blocks.length > 0) {
          loadBlocks(screenplay.blocks);
        }
      })
      .catch((err) => {
        console.error('[Editor] Failed to load screenplay:', err);
        setLoadError('Could not load screenplay — changes still auto-save.');
      })
      .finally(() => setIsLoading(false));
  }, [projectId, setProjectId, setScreenplayId, loadBlocks]);

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

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleExportDocx = useCallback(async () => {
    await exportDocx(blocks);
  }, [blocks]);

  const toggleTab = (tab: SidebarTab) => {
    setSidebarTab((current) => (current === tab ? null : tab));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-void">
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-white/[0.04] bg-abyss/80 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="h-4 w-36 animate-pulse rounded bg-white/[0.06]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-6 w-16 animate-pulse rounded-xl bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-white/[0.04] bg-abyss/60 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-20 animate-pulse rounded bg-white/[0.06]" />
          ))}
        </div>
        <div className="flex flex-1 items-start justify-center overflow-y-auto py-16">
          <div className="w-full max-w-[680px] space-y-3 px-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-5 animate-pulse rounded bg-white/[0.04]"
                style={{ width: `${55 + (i * 13) % 40}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body > *:not(#screenplay-print-root) { display: none !important; }
          #screenplay-print-root { display: block !important; }
          @page { size: Letter; margin: 1in; }
        }
        @media screen {
          #screenplay-print-root { display: none; }
        }
      `}</style>

      {/* Hidden print layer */}
      <div id="screenplay-print-root" className="font-mono text-sm leading-relaxed text-black">
        {blocks.map((b) => (
          <p
            key={b.id}
            style={{
              textTransform: ['scene-heading', 'character', 'transition'].includes(b.type)
                ? 'uppercase'
                : 'none',
              textAlign: b.type === 'transition' ? 'right' : 'left',
              paddingLeft:
                b.type === 'character' ? '40%' :
                b.type === 'dialogue' ? '20%' :
                b.type === 'parenthetical' ? '30%' : '0',
              paddingRight:
                b.type === 'dialogue' ? '20%' :
                b.type === 'parenthetical' ? '30%' : '0',
              fontWeight: b.type === 'scene-heading' ? 'bold' : 'normal',
              marginBottom: '0.5em',
            }}
          >
            {b.content || ''}
          </p>
        ))}
      </div>

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

          <div className="flex items-center gap-2 text-xs">
            {loadError && <span className="text-amber/80">{loadError}</span>}
            <span className="text-slate-700">
              {wordCount().toLocaleString()} words · {pageCount()}p
            </span>
            <span className={clsx('transition-colors', isDirty ? 'text-amber' : 'text-slate-700')}>
              {isDirty ? '● Unsaved' : '✓ Saved'}
            </span>

            {/* Export dropdown */}
            <div className="relative group">
              <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white">
                ↓ Export
              </button>
              <div className="absolute right-0 top-full z-30 mt-1 hidden w-36 rounded-2xl border border-white/[0.08] bg-abyss py-1 shadow-xl group-hover:block">
                {[
                  { label: 'Fountain (.fountain)', action: handleExportFountain },
                  { label: 'PDF (print)', action: handleExportPDF },
                  { label: 'Word (.docx)', action: handleExportDocx },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="block w-full px-4 py-2 text-left text-[11px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {screenplayId && (
              <button
                onClick={() => setShowVersions(true)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                title="Version history"
              >
                History
              </button>
            )}

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
          <div className="screenplay-scroll relative flex-1 overflow-y-auto">
            <ScreenplayEditor />
          </div>

          {sidebarTab !== null && (
            <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-l border-white/[0.05] bg-abyss/40 backdrop-blur-sm xl:w-80">
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

      {showVersions && screenplayId && (
        <VersionHistoryPanel
          screenplayId={screenplayId}
          onClose={() => setShowVersions(false)}
        />
      )}
    </>
  );
}
