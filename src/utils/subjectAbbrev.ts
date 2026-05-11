function firstGrapheme(word: string): string {
  const trimmed = word.trim()
  if (!trimmed) return ''
  const it = trimmed[Symbol.iterator]()
  const first = it.next().value
  return typeof first === 'string' ? first : ''
}

/**
 * 2–3 letter code for timetable cells: initials from words (skip 1-letter tokens),
 * or first 3 letters of a single word.
 */
export function subjectAbbrev(subject: string): string {
  const trimmed = subject.trim()
  if (!trimmed) return '—'

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    const w = words[0]
    return w.slice(0, 3).toLocaleUpperCase()
  }

  const fromLongWords = words
    .filter((w) => w.length >= 2)
    .map((w) => firstGrapheme(w))
    .join('')

  const letters =
    fromLongWords.length > 0
      ? fromLongWords
      : words.map((w) => firstGrapheme(w)).join('')

  const upper = letters.toLocaleUpperCase()
  if (upper.length >= 2) return upper.slice(0, 3)
  return trimmed.slice(0, 3).toLocaleUpperCase()
}
