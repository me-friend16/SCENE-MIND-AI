'use client';

import { useLayoutEffect, useRef, memo } from 'react';
import clsx from 'clsx';
import { BlockType, ScreenplayBlock } from '@/store/useEditorStore';

interface Props {
  block: ScreenplayBlock;
  isFocused: boolean;
  onUpdate: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScreenplayBlock) => void;
  onFocus: (id: string) => void;
  onMouseDown: (id: string) => void;
}

const wrapperStyles: Record<BlockType, string> = {
  'scene-heading': 'mt-7 first:mt-0',
  action: 'mt-3',
  character: 'mt-6',
  dialogue: 'mt-1',
  parenthetical: 'mt-0.5',
  transition: 'mt-6',
};

const textareaStyles: Record<BlockType, string> = {
  'scene-heading':
    'font-mono text-cyan font-bold uppercase tracking-wider text-sm pl-3 border-l-2 border-cyan/40',
  action: 'font-mono text-slate-200 text-sm leading-relaxed',
  character: 'font-mono text-amber font-bold uppercase text-sm pl-[40%]',
  dialogue: 'font-mono text-white text-sm px-[20%]',
  parenthetical: 'font-mono text-slate-400 italic text-sm px-[27%]',
  transition: 'font-mono text-accent uppercase text-sm text-right',
};

const labelStyles: Record<BlockType, string> = {
  'scene-heading': 'text-cyan/50',
  action: 'text-slate-600',
  character: 'text-amber/50',
  dialogue: 'text-slate-600',
  parenthetical: 'text-slate-700',
  transition: 'text-accent/40',
};

const labels: Record<BlockType, string> = {
  'scene-heading': 'SCN',
  action: 'ACT',
  character: 'CHR',
  dialogue: 'DLG',
  parenthetical: 'PAR',
  transition: 'TRN',
};

const placeholders: Record<BlockType, string> = {
  'scene-heading': 'INT./EXT. LOCATION - DAY',
  action: 'Action...',
  character: 'CHARACTER NAME',
  dialogue: 'Dialogue...',
  parenthetical: '(beat)',
  transition: 'CUT TO:',
};

const autoUppercase = new Set<BlockType>(['scene-heading', 'character', 'transition']);

export const ScreenplayBlockComponent = memo(function ScreenplayBlockComponent({
  block,
  isFocused,
  onUpdate,
  onKeyDown,
  onFocus,
  onMouseDown,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus when this block becomes the focused one
  useLayoutEffect(() => {
    if (isFocused && textareaRef.current && document.activeElement !== textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  // Auto-resize textarea height
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [block.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = autoUppercase.has(block.type)
      ? e.target.value.toUpperCase()
      : e.target.value;
    onUpdate(block.id, value);
  };

  return (
    <div
      className={clsx('group relative', wrapperStyles[block.type])}
      onMouseDown={() => onMouseDown(block.id)}
    >
      {/* Block type badge (left gutter) */}
      <span
        className={clsx(
          'pointer-events-none absolute -left-12 top-0.5 hidden select-none text-[9px] font-bold tracking-widest transition-opacity lg:block',
          labelStyles[block.type],
          isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
        )}
      >
        {labels[block.type]}
      </span>

      <textarea
        ref={textareaRef}
        value={block.content}
        onChange={handleChange}
        onKeyDown={(e) => onKeyDown(e, block)}
        onFocus={() => onFocus(block.id)}
        placeholder={placeholders[block.type]}
        spellCheck={block.type === 'action' || block.type === 'dialogue'}
        className={clsx(
          'w-full resize-none bg-transparent outline-none transition-colors',
          'placeholder:text-white/10 placeholder:italic',
          textareaStyles[block.type],
          isFocused && 'placeholder:opacity-100',
        )}
        rows={1}
        style={{ overflow: 'hidden', minHeight: '1.5rem' }}
      />
    </div>
  );
});
