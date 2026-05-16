import type { NoteBlock, NoteParagraphBlock } from '@/types/notes'

export function createDefaultNoteContent(): NoteParagraphBlock[] {
  return [
    {
      type: 'paragraph',
      size: 'medium',
      spans: [{ text: '' }],
    },
  ]
}

function isParagraph(block: NoteBlock): block is NoteParagraphBlock {
  return block.type === 'paragraph' && Array.isArray((block as NoteParagraphBlock).spans)
}

function blockToPlainText(block: NoteBlock): string {
  if (isParagraph(block)) {
    return block.spans.map((s) => s.text).join('')
  }
  if (block.type === 'bulleted-list' && Array.isArray((block as { items?: unknown }).items)) {
    const items = (block as { items: Array<{ spans?: Array<{ text: string }> }> }).items
    return items.map((item) => (item.spans ?? []).map((s) => s.text).join('')).join(' ')
  }
  return ''
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
