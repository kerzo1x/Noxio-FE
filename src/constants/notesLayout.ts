export const NOTE_CARD_MAX_WIDTH_REM = 20.9375
export const NOTES_LIST_SIDE_PADDING_REM = 1 // px-4
export const NOTES_LIST_MIN_WIDTH_REM =
  NOTE_CARD_MAX_WIDTH_REM + NOTES_LIST_SIDE_PADDING_REM * 2

export function getNotesListMinWidthPx(): number {
  if (typeof document === 'undefined') {
    return NOTES_LIST_MIN_WIDTH_REM * 16
  }
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  )
  const remPx = Number.isNaN(rootFontSize) ? 16 : rootFontSize
  return NOTES_LIST_MIN_WIDTH_REM * remPx
}
