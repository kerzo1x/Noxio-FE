export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim()
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

export function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return {
    h: h * 360,
    s: max === 0 ? 0 : d / max,
    v: max,
  }
}

export function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360
  const i = Math.floor(hh / 60)
  const f = hh / 60 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = 0
  let g = 0
  let b = 0
  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    default:
      r = v
      g = p
      b = q
      break
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function normalizeHex(hex: string, fallback = '#FFFFFF'): string {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return fallback
  return `#${h.toUpperCase()}`
}

export function isPresetColor(hex: string, presets: readonly string[]): boolean {
  const normalized = normalizeHex(hex, '')
  if (normalized === '') return false
  return presets.some((preset) => normalizeHex(preset) === normalized)
}

export function toApiColor(hex: string): string {
  return hex.trim().replace(/^#/, '').toUpperCase()
}

export function fromApiColor(raw: string): string {
  const h = raw.trim().replace(/^#/, '')
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return '#FFFFFF'
  return `#${h.toUpperCase()}`
}
