import type { NoteBlock, NoteListItemNode, NoteSpan } from '@/types/notes'
import { mergeSpans, normalizeBlocksForApi } from '@/utils/noteContent'

export const API_MAX_BLOCKS = 500
export const API_MAX_SPANS_PER_BLOCK = 200
export const API_MAX_SPAN_CHARS = 2000
export const API_MAX_LIST_CHILDREN = 20

export interface ValidateNoteBlocksResult {
  blocks: NoteBlock[]
  warnings: string[]
}

function clampSpanText(text: string): { text: string; truncated: boolean } {
  if (text.length <= API_MAX_SPAN_CHARS) {
    return { text, truncated: false }
  }
  return { text: text.slice(0, API_MAX_SPAN_CHARS), truncated: true }
}

function normalizeSpansForApi(spans: NoteSpan[]): NoteSpan[] {
  const merged = mergeSpans(spans, [])
  const result: NoteSpan[] = []

  for (const span of merged) {
    const { text } = clampSpanText(span.text)
    if (text.length === 0 && result.length > 0) continue
    result.push({
      text,
      ...(span.bold ? { bold: true } : {}),
      ...(span.underline ? { underline: true } : {}),
      ...(span.color ? { color: span.color } : {}),
    })
  }

  if (result.length === 0) {
    return [{ text: '' }]
  }

  if (result.length > API_MAX_SPANS_PER_BLOCK) {
    const first = result.slice(0, API_MAX_SPANS_PER_BLOCK - 1)
    const overflowText = result
      .slice(API_MAX_SPANS_PER_BLOCK - 1)
      .map((s) => s.text)
      .join('')
    const last = result[API_MAX_SPANS_PER_BLOCK - 1]
    first.push({
      ...last,
      text: (last.text + overflowText).slice(0, API_MAX_SPAN_CHARS),
    })
    return first
  }

  return result
}

function normalizeListItem(item: NoteListItemNode): NoteListItemNode {
  const children = (item.children ?? [])
    .slice(0, API_MAX_LIST_CHILDREN)
    .map(normalizeListItem)
  return {
    ...item,
    spans: normalizeSpansForApi(item.spans),
    children,
  }
}

export function validateNoteBlocks(blocks: NoteBlock[]): ValidateNoteBlocksResult {
  const warnings: string[] = []
  let normalized = normalizeBlocksForApi(blocks)

  if (normalized.length > API_MAX_BLOCKS) {
    warnings.push(`Note exceeds ${API_MAX_BLOCKS} blocks. Extra blocks were removed.`)
    normalized = normalized.slice(0, API_MAX_BLOCKS)
  }

  normalized = normalized.map((block) => {
    if (block.type === 'paragraph' && 'spans' in block) {
      const spans = normalizeSpansForApi(block.spans as NoteSpan[])
      return { ...block, spans }
    }

    if (block.type === 'bulleted-list' && 'items' in block) {
      const items = (block.items as NoteListItemNode[]).map(normalizeListItem)
      return { ...block, items: items.slice(0, API_MAX_LIST_CHILDREN) }
    }

    return block
  })

  return { blocks: normalized, warnings }
}

export function canInsertTopLevelBlock(currentCount: number): boolean {
  return currentCount < API_MAX_BLOCKS
}
