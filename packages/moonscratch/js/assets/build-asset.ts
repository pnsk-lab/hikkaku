import { encodeBase64 } from './base64.ts'
import type { RgbaAsset } from './types.ts'
import { toByte, toPositiveInt } from './validation.ts'

export const buildAsset = (width: number, height: number, rgba: ArrayLike<number>): RgbaAsset => {
  const safeWidth = toPositiveInt(width, 'width')
  const safeHeight = toPositiveInt(height, 'height')
  const expectedLength = safeWidth * safeHeight * 4

  if (rgba.length < expectedLength) {
    throw new Error(`rgba length must be at least ${expectedLength}`)
  }

  const bytes = new Uint8Array(expectedLength)
  for (let i = 0; i < expectedLength; i += 1) {
    bytes[i] = toByte(rgba[i], `rgba[${i}]`)
  }

  return {
    width: safeWidth,
    height: safeHeight,
    rgbaBase64: encodeBase64(bytes),
  }
}
