import type { RenderFrame } from './types.ts'
import { normalizeRenderFrame } from './utils.ts'

const appendRect = (
  parts: string[],
  x: number,
  y: number,
  width: number,
  rgba: [number, number, number, number],
): void => {
  const [r, g, b, a] = rgba
  if (width <= 0 || a <= 0) {
    return
  }
  const opacity = a < 255 ? ` fill-opacity="${a / 255}"` : ''
  parts.push(
    `<rect x="${x}" y="${y}" width="${width}" height="1" fill="rgb(${r},${g},${b})"${opacity}/>`,
  )
}

const isPixelEqual = (
  pixels: Uint8Array,
  base: number,
  otherBase: number,
): boolean =>
  pixels[base] === pixels[otherBase] &&
  pixels[base + 1] === pixels[otherBase + 1] &&
  pixels[base + 2] === pixels[otherBase + 2] &&
  pixels[base + 3] === pixels[otherBase + 3]

const pixelByte = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  return value
}

export const renderWithSVG = (frame: RenderFrame): string => {
  const normalized = normalizeRenderFrame(frame)
  const { width, height, pixels } = normalized
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`,
  ]

  for (let y = 0; y < height; y += 1) {
    let x = 0
    while (x < width) {
      const base = (y * width + x) * 4
      const r = pixelByte(pixels[base])
      const g = pixelByte(pixels[base + 1])
      const b = pixelByte(pixels[base + 2])
      const a = pixelByte(pixels[base + 3])
      let runWidth = 1
      while (x + runWidth < width) {
        const nextBase = (y * width + x + runWidth) * 4
        if (!isPixelEqual(pixels, base, nextBase)) {
          break
        }
        runWidth += 1
      }
      appendRect(parts, x, y, runWidth, [r, g, b, a])
      x += runWidth
    }
  }

  parts.push('</svg>')
  return parts.join('')
}
