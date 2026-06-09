import { describe, expect, it } from 'vitest'
import {
  createBulletedList,
  createListItem,
  createParagraph,
  normalizeBlocksForApi,
} from '@/utils/noteContent'
import {
  noteBlocksToTiptap,
  sanitizeTiptapDoc,
  tiptapToNoteBlocks,
} from '@/utils/tiptapNoteAdapter'
import { validateNoteBlocks, API_MAX_BLOCKS } from '@/utils/validateNoteBlocks'

function roundTrip(blocks: ReturnType<typeof normalizeBlocksForApi>) {
  const doc = noteBlocksToTiptap(blocks)
  return normalizeBlocksForApi(tiptapToNoteBlocks(doc))
}

describe('tiptapNoteAdapter', () => {
  it('round-trips empty paragraph', () => {
    const input = [createParagraph()]
    expect(roundTrip(input)).toEqual(normalizeBlocksForApi(input))
  })

  it('produces no empty text nodes for empty spans', () => {
    const doc = noteBlocksToTiptap([createParagraph(), createBulletedList('')])
    const json = JSON.stringify(doc)
    expect(json).not.toContain('"text":""')
  })

  it('sanitizeTiptapDoc removes stray empty text nodes', () => {
    const cleaned = sanitizeTiptapDoc({
      type: 'doc',
      content: [
        {
          type: 'backendParagraph',
          attrs: { size: 'medium' },
          content: [{ type: 'text', text: '' }, { type: 'text', text: 'ok' }],
        },
      ],
    })
    expect(JSON.stringify(cleaned)).not.toContain('"text":""')
    expect(cleaned.content?.[0]).toMatchObject({
      content: [{ type: 'text', text: 'ok' }],
    })
  })

  it('round-trips paragraph with only empty span entries', () => {
    const input = [{ type: 'paragraph' as const, size: 'medium' as const, spans: [{ text: '' }] }]
    expect(roundTrip(input)).toEqual(normalizeBlocksForApi(input))
  })

  it('round-trips paragraph with bold and underline', () => {
    const input = [
      {
        type: 'paragraph' as const,
        size: 'medium' as const,
        spans: [
          { text: 'Hello ', bold: true },
          { text: 'world', underline: true, color: '#ff0000' },
        ],
      },
    ]
    expect(roundTrip(input)).toEqual(normalizeBlocksForApi(input))
  })

  it('round-trips bulleted list', () => {
    const input = [createBulletedList('item one')]
    expect(roundTrip(input)).toEqual(normalizeBlocksForApi(input))
  })

  it('round-trips nested list children', () => {
    const child = createListItem('nested')
    const parent = createListItem('parent')
    parent.children = [child]
    const input = [
      {
        type: 'bulleted-list' as const,
        items: [parent],
      },
    ]
    expect(roundTrip(input)).toEqual(normalizeBlocksForApi(input))
  })

  it('preserves list item ids on round-trip', () => {
    const item = createListItem('stable id test')
    const input = [{ type: 'bulleted-list' as const, items: [item] }]
    const result = roundTrip(input)
    expect(result[0]).toMatchObject({
      type: 'bulleted-list',
      items: [{ id: item.id }],
    })
  })
})

describe('validateNoteBlocks', () => {
  it('truncates block count with warning', () => {
    const blocks = Array.from({ length: API_MAX_BLOCKS + 5 }, () => createParagraph('x'))
    const result = validateNoteBlocks(blocks)
    expect(result.blocks).toHaveLength(API_MAX_BLOCKS)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
