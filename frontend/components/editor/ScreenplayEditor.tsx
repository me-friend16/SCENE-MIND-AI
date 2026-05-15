'use client';

import { useCallback } from 'react';
import { useEditorStore, BlockType, ScreenplayBlock } from '@/store/useEditorStore';
import { ScreenplayBlockComponent } from './ScreenplayBlock';
import { useScreenplayFormat } from '@/hooks/useScreenplayFormat';

export default function ScreenplayEditor() {
  const {
    blocks,
    focusedBlockId,
    addBlock,
    updateBlock,
    setBlockType,
    deleteBlock,
    mergeWithPrevious,
    setFocusedBlock,
    getPrevBlockId,
    getNextBlockId,
  } = useEditorStore();

  const { getNextBlockType, cycleBlockType } = useScreenplayFormat();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScreenplayBlock) => {
      const ta = e.currentTarget;
      const isEmpty = ta.value.trim() === '';
      const atStart = ta.selectionStart === 0 && ta.selectionEnd === 0;
      const atEnd = ta.selectionStart === ta.value.length;

      // Enter → next logical block type
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nextType = getNextBlockType(block.type);
        const newId = addBlock(block.id, nextType);
        setFocusedBlock(newId);
        return;
      }

      // Backspace on empty block → delete and go to previous
      if (e.key === 'Backspace' && isEmpty) {
        e.preventDefault();
        const prevId = getPrevBlockId(block.id);
        deleteBlock(block.id);
        if (prevId) setFocusedBlock(prevId);
        return;
      }

      // Backspace at cursor start with content → merge with previous
      if (e.key === 'Backspace' && atStart && !isEmpty) {
        const prevId = getPrevBlockId(block.id);
        if (prevId) {
          e.preventDefault();
          mergeWithPrevious(block.id);
          return;
        }
      }

      // Tab → cycle block type
      if (e.key === 'Tab') {
        e.preventDefault();
        setBlockType(block.id, cycleBlockType(block.type));
        return;
      }

      // Ctrl/Cmd + Shift + 1–6 → set specific block type
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const typeMap: Record<string, BlockType> = {
          '1': 'scene-heading',
          '2': 'action',
          '3': 'character',
          '4': 'dialogue',
          '5': 'parenthetical',
          '6': 'transition',
        };
        if (typeMap[e.key]) {
          e.preventDefault();
          setBlockType(block.id, typeMap[e.key]);
          return;
        }
      }

      // Arrow Up at start → jump to previous block
      if (e.key === 'ArrowUp' && atStart) {
        const prevId = getPrevBlockId(block.id);
        if (prevId) {
          e.preventDefault();
          setFocusedBlock(prevId);
        }
      }

      // Arrow Down at end → jump to next block
      if (e.key === 'ArrowDown' && atEnd) {
        const nextId = getNextBlockId(block.id);
        if (nextId) {
          e.preventDefault();
          setFocusedBlock(nextId);
        }
      }
    },
    [
      getNextBlockType,
      cycleBlockType,
      addBlock,
      deleteBlock,
      mergeWithPrevious,
      setBlockType,
      getPrevBlockId,
      getNextBlockId,
      setFocusedBlock,
    ],
  );

  const handleUpdate = useCallback(
    (id: string, content: string) => updateBlock(id, content),
    [updateBlock],
  );

  const handleFocus = useCallback((id: string) => setFocusedBlock(id), [setFocusedBlock]);
  const handleMouseDown = useCallback((id: string) => setFocusedBlock(id), [setFocusedBlock]);

  const addTrailingBlock = () => {
    const last = blocks[blocks.length - 1];
    if (last && last.content === '') {
      setFocusedBlock(last.id);
    } else {
      const newId = addBlock(last?.id ?? null, 'action');
      setFocusedBlock(newId);
    }
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-[52rem] px-4 pb-24 pt-10 sm:pl-16 sm:pr-4">
      {blocks.map((block) => (
        <ScreenplayBlockComponent
          key={block.id}
          block={block}
          isFocused={focusedBlockId === block.id}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onMouseDown={handleMouseDown}
        />
      ))}

      {/* Click-to-continue zone */}
      <div
        onClick={addTrailingBlock}
        className="mt-8 cursor-text py-10 text-center text-xs text-slate-800 transition-colors hover:text-slate-700 select-none"
      >
        — click to continue writing —
      </div>
    </div>
  );
}
