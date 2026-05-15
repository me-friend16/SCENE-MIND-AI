import { ScreenplayBlock } from '@/store/useEditorStore';

export async function exportDocx(blocks: ScreenplayBlock[]): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');

  const paragraphs = blocks.map((block) => {
    const isUpper = ['scene-heading', 'character', 'transition'].includes(block.type);
    const text = isUpper ? block.content.toUpperCase() : block.content;

    let indent: { left?: number; right?: number; firstLine?: number } = {};
    let alignment = AlignmentType.LEFT;
    let bold = false;

    switch (block.type) {
      case 'scene-heading':
        bold = true;
        break;
      case 'character':
        indent = { left: 3600 };
        break;
      case 'dialogue':
        indent = { left: 1800, right: 1800 };
        break;
      case 'parenthetical':
        indent = { left: 2700, right: 2700 };
        break;
      case 'transition':
        alignment = AlignmentType.RIGHT;
        break;
    }

    return new Paragraph({
      alignment,
      indent,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text,
          bold,
          font: 'Courier New',
          size: 24,
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'screenplay.docx';
  a.click();
  URL.revokeObjectURL(url);
}
