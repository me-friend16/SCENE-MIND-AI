'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore, BlockType, ScreenplayBlock } from '@/store/useEditorStore';
import { ScreenplayBlockComponent } from './ScreenplayBlock';
import { useScreenplayFormat } from '@/hooks/useScreenplayFormat';

function SortableBlock({
  block,
  isFocused,
  onUpdate,
  onKeyDown,
  onFocus,
  onMouseDown,
}: {
  block: ScreenplayBlock;
  isFocused: boolean;
  onUpdate: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScreenplayBlock) => void;
  onFocus: (id: string) => void;
  onMouseDown: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle — only visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-6 top-1 flex h-6 w-5 cursor-grab items-center justify-center rounded opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-30 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <span className="text-[10px] text-slate-600">⠿</span>
      </div>
      <ScreenplayBlockComponent
        block={block}
        isFocused={isFocused}
        onUpdate={onUpdate}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
      />
    </div>
  );
}

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
    reorderBlocks,
  } = useEditorStore();

  const { getNextBlockType, cycleBlockType } = useScreenplayFormat();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = blocks.findIndex((b) => b.id === active.id);
      const toIndex = blocks.findIndex((b) => b.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderBlocks(fromIndex, toIndex);
      }
    },
    [blocks, reorderBlocks],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScreenplayBlock) => {
      const ta = e.currentTarget;
      const isEmpty = ta.value.trim() === '';
      const atStart = ta.selectionStart === 0 && ta.selectionEnd === 0;
      const atEnd = ta.selectionStart === ta.value.length;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nextType = getNextBlockType(block.type);
        const newId = addBlock(block.id, nextType);
        setFocusedBlock(newId);
        return;
      }

      if (e.key === 'Backspace' && isEmpty) {
        e.preventDefault();
        const prevId = getPrevBlockId(block.id);
        deleteBlock(block.id);
        if (prevId) setFocusedBlock(prevId);
        return;
      }

      if (e.key === 'Backspace' && atStart && !isEmpty) {
        const prevId = getPrevBlockId(block.id);
        if (prevId) {
          e.preventDefault();
          mergeWithPrevious(block.id);
          return;
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setBlockType(block.id, cycleBlockType(block.type));
        return;
      }

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

      if (e.key === 'ArrowUp' && atStart) {
        const prevId = getPrevBlockId(block.id);
        if (prevId) {
          e.preventDefault();
          setFocusedBlock(prevId);
        }
      }

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="group">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                isFocused={focusedBlockId === block.id}
                onUpdate={handleUpdate}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onMouseDown={handleMouseDown}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div
        onClick={addTrailingBlock}
        className="mt-8 cursor-text py-10 text-center text-xs text-slate-800 transition-colors hover:text-slate-700 select-none"
      >
        — click to continue writing —
      </div>
    </div>
  );
}
