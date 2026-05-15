import { BlockType, ScreenplayBlock } from '@/store/useEditorStore';

const nextTypeMap: Record<BlockType, BlockType> = {
  'scene-heading': 'action',
  action: 'action',
  character: 'dialogue',
  dialogue: 'character',
  parenthetical: 'dialogue',
  transition: 'scene-heading',
};

const cycleOrder: BlockType[] = [
  'scene-heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

const typeLabels: Record<BlockType, string> = {
  'scene-heading': 'Scene Heading',
  action: 'Action',
  character: 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
};

const blockPlaceholders: Record<BlockType, string> = {
  'scene-heading': 'INT./EXT. LOCATION - DAY',
  action: 'Action description...',
  character: 'CHARACTER NAME',
  dialogue: 'Dialogue...',
  parenthetical: '(beat)',
  transition: 'CUT TO:',
};

export function useScreenplayFormat() {
  const getNextBlockType = (current: BlockType): BlockType => nextTypeMap[current];

  const cycleBlockType = (current: BlockType): BlockType => {
    const idx = cycleOrder.indexOf(current);
    return cycleOrder[(idx + 1) % cycleOrder.length];
  };

  const detectType = (content: string): BlockType => {
    const trimmed = content.trim();
    const upper = trimmed.toUpperCase();
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(upper)) return 'scene-heading';
    if (/^(CUT TO:|DISSOLVE TO:|FADE OUT\.|FADE IN:|SMASH CUT TO:|MATCH CUT TO:)/.test(upper))
      return 'transition';
    if (/^\(.*\)$/.test(trimmed)) return 'parenthetical';
    return 'action';
  };

  const getLabel = (type: BlockType): string => typeLabels[type];
  const getPlaceholder = (type: BlockType): string => blockPlaceholders[type];

  const toFountain = (blocks: ScreenplayBlock[]): string =>
    blocks
      .map((b) => {
        switch (b.type) {
          case 'scene-heading':
            return b.content.toUpperCase();
          case 'character':
            return `\t\t\t${b.content.toUpperCase()}`;
          case 'dialogue':
            return `\t\t${b.content}`;
          case 'parenthetical':
            return `\t\t(${b.content.replace(/^\(|\)$/g, '')})`;
          case 'transition':
            return `\t\t\t\t\t\t${b.content.toUpperCase()}`;
          default:
            return b.content;
        }
      })
      .join('\n\n');

  const calcPageCount = (blocks: ScreenplayBlock[]): number => {
    const chars = blocks.reduce((acc, b) => acc + b.content.length, 0);
    return Math.max(1, Math.ceil(chars / 1500));
  };

  return {
    getNextBlockType,
    cycleBlockType,
    detectType,
    getLabel,
    getPlaceholder,
    toFountain,
    calcPageCount,
    cycleOrder,
    typeLabels,
  };
}
