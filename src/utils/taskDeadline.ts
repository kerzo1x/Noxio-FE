export function formatDdMmYyyyDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length < 8) return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`

  const day = Number.parseInt(d.slice(0, 2), 10)
  const month = Number.parseInt(d.slice(2, 4), 10)
  const year = d.slice(4, 8)
  return `${day}.${month}.${year}`
}

export function parseDdMmYyyy(
  input: string,
): { day: number; month: number; year: number } | null {
  const parts = input.split('.').filter(Boolean)
  if (parts.length !== 3) return null

  const day = Number.parseInt(parts[0] ?? '', 10)
  const month = Number.parseInt(parts[1] ?? '', 10)
  const year = Number.parseInt(parts[2] ?? '', 10)

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return { day, month, year }
}

export function deadlineToIso(input: string): string | null {
  const parsed = parseDdMmYyyy(input)
  if (!parsed) return null
  const date = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999)
  return date.toISOString()
}

export function formatDeadlineDisplay(input: string): string | null {
  const parsed = parseDdMmYyyy(input)
  if (!parsed) return null
  return `${parsed.day}.${parsed.month}.${parsed.year}`
}
