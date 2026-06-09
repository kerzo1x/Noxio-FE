import type { JSONContent } from '@tiptap/core'
import type {
  NoteBlock,
  NoteBlockSize,
  NoteBulletedListBlock,
  NoteListItemNode,
  NoteParagraphBlock,
  NoteSpan,
} from '@/types/notes'
import {
  createListItem,
  createListItemId,
  createParagraph,
  isBulletedList,
  isParagraph,
  normalizeBlocksForApi,
} from '@/utils/noteContent'
import { validateNoteBlocks } from '@/utils/validateNoteBlocks'

type TipTapMark = { type: string; attrs?: Record<string, unknown> }

/** ProseMirror rejects `{ type: 'text', text: '' }` — use no content nodes instead. */
function spansToTipTapContent(spans: NoteSpan[]): JSONContent[] | undefined {
  const nodes: JSONContent[] = []

  for (const span of spans) {
    if (!span.text || span.text.length === 0) continue

    const marks: TipTapMark[] = []
    if (span.bold) marks.push({ type: 'bold' })
    if (span.underline) marks.push({ type: 'underline' })
    if (span.color) marks.push({ type: 'textStyle', attrs: { color: span.color } })
    nodes.push({
      type: 'text',
      text: span.text,
      ...(marks.length > 0 ? { marks } : {}),
    })
  }

  return nodes.length > 0 ? nodes : undefined
}

function withInlineContent(node: JSONContent, spans: NoteSpan[]): JSONContent {
  const inline = spansToTipTapContent(spans)
  if (inline) {
    return { ...node, content: inline }
  }
  const { content: _removed, ...rest } = node
  return rest
}

function tipTapContentToSpans(content: JSONContent[] | undefined): NoteSpan[] {
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

function paragraphBlockToTipTap(block: NoteParagraphBlock): JSONContent {
  return withInlineContent(
    {
      type: 'backendParagraph',
      attrs: { size: block.size },
    },
    block.spans,
  )
}

function listItemsToTipTap(items: NoteListItemNode[]): JSONContent[] {
  return items.map((item) => {
    const children: JSONContent[] = [
      withInlineContent({ type: 'paragraph' }, item.spans),
    ]

    if (item.children?.length) {
      children.push({
        type: 'bulletList',
        content: listItemsToTipTap(item.children),
      })
    }

    return {
      type: 'listItem',
      attrs: {
        itemId: item.id,
        size: item.size,
        bulleted: item.bulleted !== false,
      },
      content: children,
    }
  })
}

function listBlockToTipTap(block: NoteBulletedListBlock): JSONContent {
  return {
    type: 'backendBulletedList',
    content: [
      {
        type: 'bulletList',
        content: listItemsToTipTap(block.items),
      },
    ],
  }
}

/** Strip invalid `{ type: 'text', text: '' }` nodes before TipTap/ProseMirror ingest. */
export function sanitizeTiptapDoc(doc: JSONContent): JSONContent {
  if (doc.type === 'text') {
    return doc
  }

  if (!doc.content?.length) {
    const { content: _removed, ...rest } = doc
    return rest
  }

  const content = doc.content
    .map((child) => sanitizeTiptapDoc(child))
    .filter((child) => {
      if (child.type !== 'text') return true
      return typeof child.text === 'string' && child.text.length > 0
    })

  if (content.length === 0) {
    const { content: _removed, ...rest } = doc
    return rest
  }

  return { ...doc, content }
}

export function noteBlocksToTiptap(blocks: NoteBlock[]): JSONContent {
  const normalized = normalizeBlocksForApi(blocks)
  const content = normalized.map((block) => {
    if (isParagraph(block)) return paragraphBlockToTipTap(block)
    if (isBulletedList(block)) return listBlockToTipTap(block)
    return paragraphBlockToTipTap(createParagraph())
  })

  return sanitizeTiptapDoc({
    type: 'doc',
    content: content.length > 0 ? content : [paragraphBlockToTipTap(createParagraph())],
  })
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
