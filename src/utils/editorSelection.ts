function setSelectionRange(range: Range) {
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

export function placeCaretAtEnd(el: HTMLElement) {
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  setSelectionRange(range)
}

export function placeCaretAtOffset(el: HTMLElement, offset: number) {
  el.focus()

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let charCount = 0
  let textNode = walker.nextNode()

  while (textNode) {
    const len = textNode.textContent?.length ?? 0
    if (charCount + len >= offset) {
      const range = document.createRange()
      range.setStart(textNode, offset - charCount)
      range.collapse(true)
      setSelectionRange(range)
      return
    }
    charCount += len
    textNode = walker.nextNode()
  }

  placeCaretAtEnd(el)
}

export function isCaretAtStart(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range = sel.getRangeAt(0)
  if (!el.contains(range.startContainer)) return false

  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.setEnd(range.startContainer, range.startOffset)
  return testRange.toString().length === 0
}

export function isContentEditableEmpty(el: HTMLElement): boolean {
  return el.innerText.replace(/\n/g, '').length === 0
}

export function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0

  const range = sel.getRangeAt(0)
  if (!el.contains(range.startContainer)) return 0

  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.setEnd(range.startContainer, range.startOffset)
  return testRange.toString().length
}

export function isCaretAtEnd(el: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false

  const range = sel.getRangeAt(0)
  if (!el.contains(range.endContainer)) return false

  const testRange = document.createRange()
  testRange.selectNodeContents(el)
  testRange.setStart(range.endContainer, range.endOffset)
  return testRange.toString().length === 0
}
