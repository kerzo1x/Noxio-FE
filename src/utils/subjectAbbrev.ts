function firstGrapheme(word: string): string {
  const trimmed = word.trim()
  if (!trimmed) return ''
  const it = trimmed[Symbol.iterator]()
  const first = it.next().value
  return typeof first === 'string' ? first : ''
}

export function subjectAbbrev(subject: string): string {
  const trimmed = subject.trim()
  if (!trimmed) return '—'

  const words: string[] = []
  const parts = trimmed.split(/\s+/)
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) words.push(parts[i])
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toLocaleUpperCase()
  }

  let fromLongWords = ''
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (w.length < 2) continue
    fromLongWords += firstGrapheme(w)
  }

  let letters = fromLongWords
  if (letters.length === 0) {
    for (let i = 0; i < words.length; i++) {
      letters += firstGrapheme(words[i])
    }
  }

  const upper = letters.toLocaleUpperCase()
  if (upper.length >= 2) return upper.slice(0, 3)
  return trimmed.slice(0, 3).toLocaleUpperCase()
}
