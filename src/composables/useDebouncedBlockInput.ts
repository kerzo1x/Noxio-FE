const INPUT_DEBOUNCE_MS = 600

type FlushFn = (text: string) => void

const paragraphPending = new Map<number, string>()
const paragraphTimers = new Map<number, ReturnType<typeof setTimeout>>()
const listItemPending = new Map<string, string>()
const listItemTimers = new Map<string, ReturnType<typeof setTimeout>>()

function listItemKey(blockIndex: number, itemIndex: number) {
  return `${blockIndex}:${itemIndex}`
}

export function scheduleParagraphInput(blockIndex: number, text: string, flush: FlushFn) {
  paragraphPending.set(blockIndex, text)
  const existing = paragraphTimers.get(blockIndex)
  if (existing) clearTimeout(existing)
  paragraphTimers.set(
    blockIndex,
    setTimeout(() => {
      paragraphTimers.delete(blockIndex)
      const pending = paragraphPending.get(blockIndex)
      if (pending === undefined) return
      paragraphPending.delete(blockIndex)
      flush(pending)
    }, INPUT_DEBOUNCE_MS),
  )
}

export function flushParagraphInput(blockIndex: number, flush: FlushFn) {
  const timer = paragraphTimers.get(blockIndex)
  if (timer) {
    clearTimeout(timer)
    paragraphTimers.delete(blockIndex)
  }
  const text = paragraphPending.get(blockIndex)
  if (text === undefined) return
  paragraphPending.delete(blockIndex)
  flush(text)
}

export function getPendingParagraphText(blockIndex: number): string | undefined {
  return paragraphPending.get(blockIndex)
}

export function scheduleListItemInput(
  blockIndex: number,
  itemIndex: number,
  text: string,
  flush: FlushFn,
) {
  const key = listItemKey(blockIndex, itemIndex)
  listItemPending.set(key, text)
  const existing = listItemTimers.get(key)
  if (existing) clearTimeout(existing)
  listItemTimers.set(
    key,
    setTimeout(() => {
      listItemTimers.delete(key)
      const pending = listItemPending.get(key)
      if (pending === undefined) return
      listItemPending.delete(key)
      flush(pending)
    }, INPUT_DEBOUNCE_MS),
  )
}

export function flushListItemInput(blockIndex: number, itemIndex: number, flush: FlushFn) {
  const key = listItemKey(blockIndex, itemIndex)
  const timer = listItemTimers.get(key)
  if (timer) {
    clearTimeout(timer)
    listItemTimers.delete(key)
  }
  const text = listItemPending.get(key)
  if (text === undefined) return
  listItemPending.delete(key)
  flush(text)
}

export function flushListBlockInput(blockIndex: number, flushItem: (itemIndex: number) => void) {
  const prefix = `${blockIndex}:`
  const itemIndices: number[] = []
  for (const key of listItemPending.keys()) {
    if (!key.startsWith(prefix)) continue
    itemIndices.push(Number(key.slice(prefix.length)))
  }
  itemIndices.sort((a, b) => a - b)

  for (let i = 0; i < itemIndices.length; i++) {
    const itemIndex = itemIndices[i]
    flushItem(itemIndex)
  }
}

export function getPendingListItemText(
  blockIndex: number,
  itemIndex: number,
): string | undefined {
  return listItemPending.get(listItemKey(blockIndex, itemIndex))
}

export function cancelParagraphInput(blockIndex: number): string | undefined {
  const timer = paragraphTimers.get(blockIndex)
  if (timer) {
    clearTimeout(timer)
    paragraphTimers.delete(blockIndex)
  }
  const text = paragraphPending.get(blockIndex)
  if (text !== undefined) paragraphPending.delete(blockIndex)
  return text
}

export function cancelListItemInput(blockIndex: number, itemIndex: number): string | undefined {
  const key = listItemKey(blockIndex, itemIndex)
  const timer = listItemTimers.get(key)
  if (timer) {
    clearTimeout(timer)
    listItemTimers.delete(key)
  }
  const text = listItemPending.get(key)
  if (text !== undefined) listItemPending.delete(key)
  return text
}

export function cancelListBlockInput(blockIndex: number): void {
  const prefix = `${blockIndex}:`
  for (const key of [...listItemPending.keys()]) {
    if (!key.startsWith(prefix)) continue
    const timer = listItemTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      listItemTimers.delete(key)
    }
    listItemPending.delete(key)
  }
}

export function flushAllPendingInput(
  flushParagraph: (blockIndex: number, text: string) => void,
  flushListItem: (blockIndex: number, itemIndex: number, text: string) => void,
) {
  const paragraphIndices = [...paragraphPending.keys()].sort((a, b) => a - b)
  for (const index of paragraphIndices) {
    flushParagraphInput(index, (text) => flushParagraph(index, text))
  }

  const listKeys = [...listItemPending.keys()]
  const byBlock = new Map<number, number[]>()
  for (const key of listKeys) {
    const [blockIndex, itemIndex] = key.split(':').map(Number)
    const items = byBlock.get(blockIndex) ?? []
    items.push(itemIndex)
    byBlock.set(blockIndex, items)
  }

  for (const [blockIndex, itemIndices] of byBlock) {
    for (const itemIndex of itemIndices.sort((a, b) => a - b)) {
      flushListItemInput(blockIndex, itemIndex, (text) => flushListItem(blockIndex, itemIndex, text))
    }
  }
}
