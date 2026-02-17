import type { RenderFrame, RenderFrameLike } from './types.ts'

const clampByte = (value: unknown): number => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return 0
  }
  const out = Math.trunc(n)
  if (out <= 0) {
    return 0
  }
  if (out >= 255) {
    return 255
  }
  return out
}

const toByteArray = (value: ArrayLike<number>): ArrayLike<number> => {
  return value
}

const normalizeRenderFrameMeta = (
  input: RenderFrameLike,
): {
  width: number
  height: number
  expectedLength: number
  rawPixels: ArrayLike<number>
} => {
  if (
    typeof input !== 'object' ||
    input === null ||
    typeof input.width !== 'number' ||
    !Number.isFinite(input.width) ||
    typeof input.height !== 'number' ||
    !Number.isFinite(input.height)
  ) {
    throw new Error('render frame input must be a finite width/height object')
  }
  const width = input.width
  const height = input.height
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('render frame width/height must be finite numbers')
  }
  const normalizedWidth = Math.trunc(width)
  const normalizedHeight = Math.trunc(height)
  if (normalizedWidth < 0 || normalizedHeight < 0) {
    throw new Error('render frame dimensions must be non-negative')
  }

  const expectedLength = normalizedWidth * normalizedHeight * 4
  const rawPixels = toByteArray(input.pixels)
  return {
    width: normalizedWidth,
    height: normalizedHeight,
    expectedLength,
    rawPixels,
  }
}

export const normalizeRenderFrame = (input: RenderFrameLike): RenderFrame => {
  const { width, height, expectedLength, rawPixels } =
    normalizeRenderFrameMeta(input)
  const pixels = new Uint8Array(expectedLength)
  const sourceLength = Math.min(expectedLength, rawPixels.length)
  for (let i = 0; i < sourceLength; i += 1) {
    pixels[i] = clampByte(rawPixels[i])
  }
  return {
    width,
    height,
    pixels,
  }
}

export const normalizeRenderFrameTrusted = (
  input: RenderFrameLike,
): RenderFrame => {
  const { width, height, expectedLength, rawPixels } =
    normalizeRenderFrameMeta(input)
  if (rawPixels instanceof Uint8Array) {
    return {
      width,
      height,
      pixels:
        rawPixels.length === expectedLength
          ? rawPixels
          : rawPixels.subarray(0, expectedLength),
    }
  }
  if (Array.isArray(rawPixels) && rawPixels.length >= expectedLength) {
    return {
      width,
      height,
      pixels: rawPixels as unknown as Uint8Array,
    }
  }
  const pixels = new Uint8Array(expectedLength)
  const sourceLength = Math.min(expectedLength, rawPixels.length)
  for (let i = 0; i < sourceLength; i += 1) {
    pixels[i] = rawPixels[i] as number
  }
  return {
    width,
    height,
    pixels,
  }
}
