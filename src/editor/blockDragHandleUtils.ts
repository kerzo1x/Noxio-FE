import type { Node as PMNode, Schema } from '@tiptap/pm/model'

export function copyParagraphNode(schema: Schema, source: PMNode): PMNode {
  return schema.nodes.backendParagraph.create(source.attrs, source.content)
}

export function copyListItemNode(schema: Schema, source: PMNode): PMNode {
  return schema.nodes.listItem.create(source.attrs, source.content)
}

export function findListContext(
  doc: PMNode,
  insertPos: number,
): { list: PMNode; listDepth: number; wrapperStart: number; wrapperEnd: number; itemIndex: number } | null {
  const $pos = doc.resolve(insertPos)
  let listDepth: number | null = null
  let wrapperDepth: number | null = null
  for (let d = $pos.depth; d > 0; d--) {
    const name = $pos.node(d).type.name
    if (name === 'bulletList') listDepth = d
    if (name === 'backendBulletedList') wrapperDepth = d
  }
  if (listDepth === null || wrapperDepth === null) return null

  const list = $pos.node(listDepth)
  let itemIndex = $pos.index(listDepth)
  if (itemIndex > list.childCount) itemIndex = list.childCount

  return {
    list,
    listDepth,
    wrapperStart: $pos.before(wrapperDepth),
    wrapperEnd: $pos.after(wrapperDepth),
    itemIndex,
  }
}

export function isInsideBulletList(doc: PMNode, pos: number): boolean {
  return findListContext(doc, pos) !== null
}

/** Splits a top-level bulleted list and inserts a paragraph at the drop position. */
export function buildListSplitWithParagraph(
  doc: PMNode,
  insertPos: number,
  paragraph: PMNode,
  schema: Schema,
): { from: number; to: number; nodes: PMNode[] } | null {
  const ctx = findListContext(doc, insertPos)
  if (!ctx) return null

  const { list, wrapperStart, wrapperEnd, itemIndex } = ctx
  const itemsBefore: PMNode[] = []
  const itemsAfter: PMNode[] = []
  list.forEach((child, _offset, index) => {
    if (index < itemIndex) itemsBefore.push(child)
    else itemsAfter.push(child)
  })

  const { backendBulletedList, bulletList } = schema.nodes
  const nodes: PMNode[] = []
  if (itemsBefore.length) {
    nodes.push(backendBulletedList.create(null, bulletList.create(list.attrs, itemsBefore)))
  }
  nodes.push(paragraph)
  if (itemsAfter.length) {
    nodes.push(backendBulletedList.create(null, bulletList.create(list.attrs, itemsAfter)))
  }

  return { from: wrapperStart, to: wrapperEnd, nodes }
}

export function paragraphPosInSplit(from: number, nodes: PMNode[]): number {
  let pos = from
  for (const node of nodes) {
    if (node.type.name === 'backendParagraph') return pos
    pos += node.nodeSize
  }
  return from
}

export interface DragSource {
  node: PMNode
  isListItem: boolean
  deleteFrom: number
  deleteTo: number
  el: HTMLElement
}

export interface DropGap {
  insertPos: number
  inList: boolean
  y: number
  left: number
  width: number
}

export const HANDLE_DOTS_SVG =
  '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/></svg>'
