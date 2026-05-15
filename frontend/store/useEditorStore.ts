import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type BlockType =
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition';

export interface ScreenplayBlock {
  id: string;
  type: BlockType;
  content: string;
  position: number;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface EditorStore {
  blocks: ScreenplayBlock[];
  focusedBlockId: string | null;
  isDirty: boolean;
  projectId: string | null;
  screenplayId: string | null;

  // Load / init
  loadBlocks: (blocks: ScreenplayBlock[]) => void;
  setProjectId: (id: string) => void;
  setScreenplayId: (id: string) => void;
  markClean: () => void;

  // Block CRUD
  addBlock: (afterId: string | null, type: BlockType, content?: string) => string;
  updateBlock: (id: string, content: string) => void;
  setBlockType: (id: string, type: BlockType) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  mergeWithPrevious: (id: string) => void;

  // Focus
  setFocusedBlock: (id: string | null) => void;

  // Navigation
  getBlockIndex: (id: string) => number;
  getPrevBlockId: (id: string) => string | null;
  getNextBlockId: (id: string) => string | null;

  // Computed (called as functions so they always read fresh state)
  wordCount: () => number;
  pageCount: () => number;
}

const seed = uid();
const initialBlocks: ScreenplayBlock[] = [
  { id: seed, type: 'scene-heading', content: '', position: 0 },
];

function reindex(blocks: ScreenplayBlock[]): ScreenplayBlock[] {
  return blocks.map((b, i) => ({ ...b, position: i }));
}

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    blocks: initialBlocks,
    focusedBlockId: null,
    isDirty: false,
    projectId: null,
    screenplayId: null,

    loadBlocks: (blocks) => set({ blocks: reindex(blocks), isDirty: false }),
    setProjectId: (id) => set({ projectId: id }),
    setScreenplayId: (id) => set({ screenplayId: id }),
    markClean: () => set({ isDirty: false }),

    addBlock: (afterId, type, content = '') => {
      const id = uid();
      set((state) => {
        const blocks = [...state.blocks];
        const insertIdx =
          afterId !== null ? blocks.findIndex((b) => b.id === afterId) + 1 : blocks.length;
        blocks.splice(insertIdx, 0, { id, type, content, position: insertIdx });
        return { blocks: reindex(blocks), isDirty: true };
      });
      return id;
    },

    updateBlock: (id, content) =>
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? { ...b, content } : b)),
        isDirty: true,
      })),

    setBlockType: (id, type) =>
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? { ...b, type } : b)),
        isDirty: true,
      })),

    deleteBlock: (id) =>
      set((state) => {
        if (state.blocks.length <= 1) return state;
        return {
          blocks: reindex(state.blocks.filter((b) => b.id !== id)),
          isDirty: true,
        };
      }),

    reorderBlocks: (fromIndex, toIndex) =>
      set((state) => {
        const blocks = [...state.blocks];
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        return { blocks: reindex(blocks), isDirty: true };
      }),

    mergeWithPrevious: (id) =>
      set((state) => {
        const idx = state.blocks.findIndex((b) => b.id === id);
        if (idx <= 0) return state;
        const prev = state.blocks[idx - 1];
        const curr = state.blocks[idx];
        const merged = { ...prev, content: prev.content + curr.content };
        const blocks = state.blocks
          .map((b, i) => (i === idx - 1 ? merged : b))
          .filter((_, i) => i !== idx);
        return { blocks: reindex(blocks), focusedBlockId: prev.id, isDirty: true };
      }),

    setFocusedBlock: (id) => set({ focusedBlockId: id }),

    getBlockIndex: (id) => get().blocks.findIndex((b) => b.id === id),

    getPrevBlockId: (id) => {
      const { blocks } = get();
      const idx = blocks.findIndex((b) => b.id === id);
      return idx > 0 ? blocks[idx - 1].id : null;
    },

    getNextBlockId: (id) => {
      const { blocks } = get();
      const idx = blocks.findIndex((b) => b.id === id);
      return idx < blocks.length - 1 ? blocks[idx + 1].id : null;
    },

    wordCount: () => {
      const text = get()
        .blocks.map((b) => b.content)
        .join(' ')
        .trim();
      return text.length === 0 ? 0 : text.split(/\s+/).length;
    },

    pageCount: () => {
      const { blocks } = get();
      // 1 page ≈ 55 lines; each block: content lines + 1 blank line separator
      const lines = blocks.reduce((acc, b) => {
        const contentLines = Math.max(1, Math.ceil(b.content.length / 60));
        return acc + contentLines + 1;
      }, 0);
      return Math.max(1, Math.ceil(lines / 55));
    },
  })),
);
