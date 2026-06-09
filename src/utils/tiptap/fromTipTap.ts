import type { JSONContent } from '@tiptap/core'
import type {
  NoteBlock,
  NoteBlockSize,
  NoteListItemNode,
  NoteSpan,
} from '@/types/notes'
import {
  createListItem,
  createListItemId,
  createParagraph,
} from '@/utils/noteContent'
import { validateNoteBlocks } from '@/utils/validateNoteBlocks'

export function tipTapContentToSpans(content: JSONContent[] | undefined): NoteSpan[] {
  if (!content?.length) return [{ text: '' }]

  const spans: NoteSpan[] = []

  for (const node of content) {
    if (node.type !== 'text' || typeof node.text !== 'string') continue

    const span: NoteSpan = { text: node.text }
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') span.bold = true
      if (mark.type === 'underline') span.underline = true
      if (mark.type === 'textStyle' && mark.attrs?.color) {
        const color = String(mark.attrs.color)
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) span.color = color
      }
      if (mark.type === 'textStyle' && !mark.attrs?.color && mark.attrs) {
        // @tiptap/extension-color may use color mark directly
      }
      if (mark.type === 'color' && mark.attrs?.color) {
        const color = String(mark.attrs.color)
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) span.color = color
      }
    }
    spans.push(span)
  }

  return spans.length > 0 ? spans : [{ text: '' }]
}

function tipTapParagraphToSpans(node: JSONContent): NoteSpan[] {
  return tipTapContentToSpans(node.content)
}

function tipTapListItemsToApi(nodes: JSONContent[] | undefined): NoteListItemNode[] {
  if (!nodes?.length) return [createListItem()]

  return nodes
    .filter((n) => n.type === 'listItem')
    .map((listItem) => {
      const attrs = listItem.attrs ?? {}
      const paragraph = listItem.content?.find((c) => c.type === 'paragraph')
      const nestedList = listItem.content?.find((c) => c.type === 'bulletList')

      return {
        id:
          typeof attrs.itemId === 'string' && attrs.itemId.length > 0
            ? attrs.itemId
            : createListItemId(),
        size: (attrs.size as NoteBlockSize) || 'small',
        spans: paragraph ? tipTapParagraphToSpans(paragraph) : [{ text: '' }],
        children: nestedList?.content
          ? tipTapListItemsToApi(nestedList.content)
          : [],
        bulleted: attrs.bulleted === false ? false : true,
      }
    })
}

export function tiptapToNoteBlocks(doc: JSONContent): NoteBlock[] {
  const topLevel = doc.content ?? []
  const blocks: NoteBlock[] = []

  for (const node of topLevel) {
    if (node.type === 'backendParagraph') {
      blocks.push({
        type: 'paragraph',
        size: (node.attrs?.size as NoteBlockSize) || 'medium',
        spans: tipTapContentToSpans(node.content),
      })
      continue
    }

    if (node.type === 'paragraph') {
      blocks.push({
        type: 'paragraph',
        size: 'medium',
        spans: tipTapContentToSpans(node.content),
      })
      continue
    }

    if (node.type === 'backendBulletedList') {
      const bulletList = node.content?.find((c) => c.type === 'bulletList')
      blocks.push({
        type: 'bulleted-list',
        items: tipTapListItemsToApi(bulletList?.content),
      })
      continue
    }

    if (node.type === 'bulletList') {
      blocks.push({
        type: 'bulleted-list',
        items: tipTapListItemsToApi(node.content),
      })
    }
  }

  if (blocks.length === 0) {
    return [createParagraph()]
  }

  return validateNoteBlocks(blocks).blocks
}

export function tiptapJsonToNoteBlocksWithWarnings(
  doc: JSONContent,
): ReturnType<typeof validateNoteBlocks> {
  const raw = tiptapToNoteBlocks(doc)
  return validateNoteBlocks(raw)
}
