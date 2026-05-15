'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/store/useEditorStore';

interface Command {
  id: string;
  label: string;
  description?: string;
  category: 'navigate' | 'editor' | 'ai' | 'project';
  shortcut?: string;
  action: () => void;
}

interface Props {
  projectId?: string;
}

export default function CommandPalette({ projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { focusedBlockId, setBlockType, addBlock, setFocusedBlock } = useEditorStore();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelected(0);
    }
  }, [open]);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'navigate',
      shortcut: 'D',
      action: () => { router.push('/dashboard'); close(); },
    },
    ...(projectId
      ? [
          {
            id: 'nav-editor',
            label: 'Open Screenplay Editor',
            description: 'Full-screen writing mode',
            category: 'editor' as const,
            action: () => { router.push(`/project/${projectId}/editor`); close(); },
          },
          {
            id: 'nav-project',
            label: 'Go to Project Overview',
            category: 'navigate' as const,
            action: () => { router.push(`/project/${projectId}`); close(); },
          },
        ]
      : []),
    // Editor commands (only when in editor with a focused block)
    ...(focusedBlockId
      ? [
          {
            id: 'block-heading',
            label: 'Set: Scene Heading',
            category: 'editor' as const,
            shortcut: '⌃⇧1',
            action: () => { setBlockType(focusedBlockId, 'scene-heading'); close(); },
          },
          {
            id: 'block-action',
            label: 'Set: Action',
            category: 'editor' as const,
            shortcut: '⌃⇧2',
            action: () => { setBlockType(focusedBlockId, 'action'); close(); },
          },
          {
            id: 'block-character',
            label: 'Set: Character',
            category: 'editor' as const,
            shortcut: '⌃⇧3',
            action: () => { setBlockType(focusedBlockId, 'character'); close(); },
          },
          {
            id: 'block-dialogue',
            label: 'Set: Dialogue',
            category: 'editor' as const,
            shortcut: '⌃⇧4',
            action: () => { setBlockType(focusedBlockId, 'dialogue'); close(); },
          },
          {
            id: 'block-transition',
            label: 'Set: Transition',
            category: 'editor' as const,
            shortcut: '⌃⇧6',
            action: () => { setBlockType(focusedBlockId, 'transition'); close(); },
          },
          {
            id: 'add-scene',
            label: 'Add Scene Heading',
            description: 'Insert a new scene after current block',
            category: 'editor' as const,
            action: () => {
              const newId = addBlock(focusedBlockId, 'scene-heading');
              setFocusedBlock(newId);
              close();
            },
          },
        ]
      : []),
    // Project actions
    {
      id: 'new-project',
      label: 'New Project',
      description: 'Create a new screenplay project',
      category: 'project',
      action: () => { router.push('/dashboard'); close(); },
    },
    // AI actions
    ...(projectId
      ? [
          {
            id: 'ai-generate',
            label: '✦ AI: Generate Scene',
            description: 'Open AI panel and generate a new scene',
            category: 'ai' as const,
            action: () => { router.push(`/project/${projectId}/editor`); close(); },
          },
          {
            id: 'ai-continuity',
            label: '✦ AI: Check Continuity',
            description: 'Scan screenplay for contradictions',
            category: 'ai' as const,
            action: () => close(),
          },
        ]
      : []),
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  const categoryOrder: Command['category'][] = ['navigate', 'editor', 'ai', 'project'];
  const grouped = categoryOrder.reduce<Record<string, Command[]>>((acc, cat) => {
    const items = filtered.filter((c) => c.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selected]?.action();
    }
  };

  const categoryLabels: Record<Command['category'], string> = {
    navigate: 'Navigate',
    editor: 'Editor',
    ai: 'AI',
    project: 'Project',
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2"
            >
              <div className="overflow-hidden rounded-3xl border border-white/[0.10] bg-card shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
                  <span className="text-slate-600">⌕</span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search commands…"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                  />
                  <kbd className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-600">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="screenplay-scroll max-h-[360px] overflow-y-auto py-2">
                  {filtered.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-600">
                      No commands found
                    </p>
                  )}

                  {Object.entries(grouped).map(([cat, items]) => {
                    const startIndex = filtered.indexOf(items[0]);
                    return (
                      <div key={cat}>
                        <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                          {categoryLabels[cat as Command['category']]}
                        </p>
                        {items.map((cmd, localIdx) => {
                          const globalIdx = startIndex + localIdx;
                          return (
                            <button
                              key={cmd.id}
                              onClick={cmd.action}
                              onMouseEnter={() => setSelected(globalIdx)}
                              className={clsx(
                                'flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors',
                                globalIdx === selected
                                  ? 'bg-accent/15 text-white'
                                  : 'text-slate-300 hover:bg-white/[0.04]',
                              )}
                            >
                              <div>
                                <p className="text-sm font-medium">{cmd.label}</p>
                                {cmd.description && (
                                  <p className="text-[11px] text-slate-600">{cmd.description}</p>
                                )}
                              </div>
                              {cmd.shortcut && (
                                <kbd className="flex-shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-500">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Footer hint */}
                <div className="border-t border-white/[0.06] px-4 py-2 flex items-center gap-4">
                  <span className="text-[10px] text-slate-700">↑↓ navigate</span>
                  <span className="text-[10px] text-slate-700">↵ select</span>
                  <span className="ml-auto text-[10px] text-slate-700">⌘K to toggle</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
