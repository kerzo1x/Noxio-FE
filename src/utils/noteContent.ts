import type {
  NoteBlock,
  NoteBlockSize,
  NoteBulletedListBlock,
  NoteListItemNode,
  NoteParagraphBlock,
  NoteSpan,
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

function isParagraph(block: NoteBlock): block is NoteParagraphBlock {
  return block.type === 'paragraph' && Array.isArray((block as NoteParagraphBlock).spans)
}

function isBulletedList(block: NoteBlock): block is NoteBulletedListBlock {
  return block.type === 'bulleted-list' && Array.isArray((block as NoteBulletedListBlock).items)
}

function normalizeListItemNode(raw: Partial<NoteListItemNode>): NoteListItemNode {
  const children = Array.isArray(raw.children)
    ? raw.children.map((child) => normalizeListItemNode(child as Partial<NoteListItemNode>))
    : []

  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : createListItemId(),
    size: raw.size === 'small' || raw.size === 'medium' || raw.size === 'large' ? raw.size : 'small',
    spans: normalizeSpans(raw.spans),
    children,
  }
}

function normalizeSpans(spans: unknown): NoteSpan[] {
  if (!Array.isArray(spans) || spans.length === 0) {
    return [{ text: '' }]
  }

  return spans.map((span) => {
    const record = span as { text?: string; bold?: boolean }
    return {
      text: typeof record.text === 'string' ? record.text : '',
      ...(record.bold ? { bold: true } : {}),
    }
  })
}

function normalizeParagraph(block: NoteParagraphBlock): NoteParagraphBlock {
  return {
    type: 'paragraph',
    size:
      block.size === 'small' || block.size === 'medium' || block.size === 'large'
        ? block.size
        : 'medium',
    spans: normalizeSpans(block.spans),
  }
}

function normalizeBulletedList(block: NoteBulletedListBlock): NoteBulletedListBlock {
  const items = Array.isArray(block.items) ? block.items : []
  const normalizedItems = items.length > 0 ? items.map((item) => normalizeListItemNode(item)) : [createListItem()]

  return {
    type: 'bulleted-list',
    items: normalizedItems,
  }
}

export function normalizeBlocksForApi(content: NoteBlock[]): NoteBlock[] {
  if (!content.length) {
    return createDefaultNoteContent()
  }

  return content.map((block) => {
    if (isParagraph(block)) {
      return normalizeParagraph(block)
    }
    if (isBulletedList(block)) {
      return normalizeBulletedList(block)
    }
    return block
  })
}

export function spansToPlainText(spans: NoteSpan[]): string {
  return spans.map((s) => s.text).join('')
}

export function plainTextToSpans(text: string, preserveBold = false, wasBold = false): NoteSpan[] {
  if (!preserveBold || !wasBold) {
    return [{ text }]
  }
  return [{ text, bold: true }]
}

export function blockToPlainText(block: NoteBlock): string {
  if (isParagraph(block)) {
    return spansToPlainText(block.spans)
  }
  if (isBulletedList(block)) {
    return block.items.map((item) => spansToPlainText(item.spans)).join(' ')
  }
  return ''
}

export function isBlockBold(block: NoteBlock): boolean {
  if (isParagraph(block)) {
    return block.spans.some((s) => s.bold)
  }
  if (isBulletedList(block) && block.items[0]) {
    return block.items[0].spans.some((s) => s.bold)
  }
  return false
}

export function toggleBlockBold(block: NoteBlock): NoteBlock {
  if (isParagraph(block)) {
    const nextBold = !isBlockBold(block)
    return {
      ...block,
      spans: block.spans.map((s) => ({
        text: s.text,
        ...(nextBold ? { bold: true } : {}),
      })),
    }
  }
  if (isBulletedList(block)) {
    const nextBold = !isBlockBold(block)
    return {
      ...block,
      items: block.items.map((item) => ({
        ...item,
        spans: item.spans.map((s) => ({
          text: s.text,
          ...(nextBold ? { bold: true } : {}),
        })),
      })),
    }
  }
  return block
}

export function setBlockSize(block: NoteBlock, size: NoteBlockSize): NoteBlock {
  if (isParagraph(block)) {
    return { ...block, size }
  }
  if (isBulletedList(block)) {
    return {
      ...block,
      items: block.items.map((item) => ({ ...item, size })),
    }
  }
  return block
}

export function getBlockSize(block: NoteBlock): NoteBlockSize {
  if (isParagraph(block)) {
    return block.size
  }
  if (isBulletedList(block) && block.items[0]) {
    return block.items[0].size
  }
  return 'medium'
}

export function blockSizeClass(size: NoteBlockSize): string {
  switch (size) {
    case 'large':
      return 'text-xl leading-relaxed'
    case 'medium':
      return 'text-[15px] leading-normal'
    case 'small':
    default:
      return 'text-[10px] leading-normal'
  }
}

export function blocksSnapshotEqual(a: NoteBlock[], b: NoteBlock[]): boolean {
  return JSON.stringify(normalizeBlocksForApi(a)) === JSON.stringify(normalizeBlocksForApi(b))
}

export function extractPreviewText(content: NoteBlock[] | undefined, maxLength = 200): string {
  if (!content?.length) return ''

  for (const block of content) {
    const text = blockToPlainText(block).trim()
    if (text) {
      if (text.length <= maxLength) return text
      return `${text.slice(0, maxLength).trimEnd()}...`
    }
  }

  return ''
}

export function noteBlocksToPlainParagraphs(content: NoteBlock[] | undefined): string[] {
  if (!content?.length) return []

  return content
    .map((block) => blockToPlainText(block).trim())
    .filter(Boolean)
}

export { isParagraph, isBulletedList }
