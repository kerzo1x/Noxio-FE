import type {
  NoteBlock,
  NoteBlockSize,
  NoteBulletedListBlock,
  NoteListItemNode,
  NoteParagraphBlock,
} from '@/types/notes'

export function createListItemId(): string {
  return crypto.randomUUID()
}

export function createParagraph(
  text = '',
  size: NoteBlockSize = 'medium',
  bold = false,
): NoteParagraphBlock {
  return {
    type: 'paragraph',
    size,
    spans: [{ text, ...(bold ? { bold: true } : {}) }],
  }
}

export function createListItem(
  text = '',
  size: NoteBlockSize = 'small',
): NoteListItemNode {
  return {
    id: createListItemId(),
    size,
    spans: [{ text }],
    children: [],
    bulleted: true,
  }
}

export function createBulletedList(
  text = '',
  size: NoteBlockSize = 'small',
): NoteBulletedListBlock {
  return {
    type: 'bulleted-list',
    items: [createListItem(text, size)],
  }
}

export function createDefaultNoteContent(): NoteParagraphBlock[] {
  return [createParagraph()]
}

export function cloneBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return JSON.parse(JSON.stringify(blocks)) as NoteBlock[]
}
