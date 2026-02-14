import type { RenderFrame } from './types.ts'

const parsePixel = (
  value: string | undefined,
): number | null => {
  if (!value) {
    return null
  }
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return null
  }
  return Math.round(n)
}

const parseFillColor = (
  fill: string | undefined,
  opacity: number,
): [number, number, number, number] | null => {
  if (!fill) {
    return null
  }
  if (fill.startsWith('rgb(')) {
  const parts = fill
    .slice(4, -1)
    .split(',')
    .map((item) => parseFloat(item))
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null
  }
  const [red, green, blue] = parts
  if (
    red === undefined ||
    green === undefined ||
    blue === undefined
  ) {
    return null
  }
  const alpha = Math.max(0, Math.min(255, Math.round(255 * opacity)))
  return [
    Math.max(0, Math.min(255, Math.round(red))),
    Math.max(0, Math.min(255, Math.round(green))),
    Math.max(0, Math.min(255, Math.round(blue))),
    alpha,
  ]
  }
  return null
}

const parseAttrMap = (text: string): Record<string, string> => {
  const attrs: Record<string, string> = {}
  const re = /([-\w]+)="([^"]*)"/g
  let match: RegExpExecArray | null = null
  while ((match = re.exec(text)) !== null) {
    const [, rawName, rawValue] = match
    if (typeof rawName !== 'string' || typeof rawValue !== 'string') {
      continue
    }
    attrs[rawName] = rawValue
  }
  return attrs
}

export const renderFrameFromLegacySVG = (svg: string): RenderFrame => {
  const width = parsePixel(svg.match(/width="(\d+)"/)?.[1])
  const height = parsePixel(svg.match(/height="(\d+)"/)?.[1])
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: 0, height: 0, pixels: new Uint8Array() }
  }

  const pixels = new Uint8Array(width * height * 4)
  const rectRe = /<rect\s+([^>]+?)\/>/g
  let rectMatch: RegExpExecArray | null = null
  while ((rectMatch = rectRe.exec(svg)) !== null) {
    const [, rawAttrs] = rectMatch
    if (typeof rawAttrs !== 'string') {
      continue
    }
    const attrs = parseAttrMap(rawAttrs)
    const x = parsePixel(attrs.x) ?? 0
    const y = parsePixel(attrs.y) ?? 0
    const rectWidth = parsePixel(attrs.width) ?? 1
    const rectHeight = parsePixel(attrs.height) ?? 1
    const opacity = Number(attrs['fill-opacity'] ?? '1')
    const color = parseFillColor(attrs.fill, opacity)
    if (!color || rectWidth <= 0 || rectHeight <= 0) {
      continue
    }
    const [r, g, b, a] = color
    for (let py = 0; py < rectHeight; py += 1) {
      for (let px = 0; px < rectWidth; px += 1) {
        const dx = x + px
        const dy = y + py
        if (dx < 0 || dx >= width || dy < 0 || dy >= height) {
          continue
        }
        const base = (dy * width + dx) * 4
        pixels[base] = r
        pixels[base + 1] = g
        pixels[base + 2] = b
        pixels[base + 3] = a
      }
    }
  }
  return { width, height, pixels }
}
