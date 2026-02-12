import { buildAsset } from './build-asset.ts'
import type { CanvasLike, ImageDataLike, RgbaAsset, RgbaMatrix } from './types.ts'
import { toByte, toPositiveInt } from './validation.ts'

export const fromRgbaBytes = (width: number, height: number, rgba: ArrayLike<number>): RgbaAsset =>
  buildAsset(width, height, rgba)

export const fromImageData = (imageData: ImageDataLike): RgbaAsset =>
  buildAsset(imageData.width, imageData.height, imageData.data)

export const fromCanvas = (canvas: CanvasLike): RgbaAsset => {
  const width = toPositiveInt(canvas.width, 'canvas.width')
  const height = toPositiveInt(canvas.height, 'canvas.height')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas.getContext("2d") returned null')
  }

  return fromImageData(context.getImageData(0, 0, width, height))
}

export const fromRgbaMatrix = (pixels: RgbaMatrix): RgbaAsset => {
  const height = pixels.length
  if (height <= 0) {
    throw new Error('pixels must have at least one row')
  }

  const firstRow = pixels[0]
  const width = firstRow?.length ?? 0
  if (width <= 0) {
    throw new Error('pixels must have at least one column')
  }

  const flat = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    const row = pixels[y]
    if (!row || row.length !== width) {
      throw new Error(`pixels[${y}] must contain exactly ${width} columns`)
    }

    for (let x = 0; x < width; x += 1) {
      const pixel = row[x]
      if (!pixel || pixel.length < 4) {
        throw new Error(`pixels[${y}][${x}] must contain 4 channels (RGBA)`)
      }

      const base = (y * width + x) * 4
      flat[base] = toByte(pixel[0], `pixels[${y}][${x}][0]`)
      flat[base + 1] = toByte(pixel[1], `pixels[${y}][${x}][1]`)
      flat[base + 2] = toByte(pixel[2], `pixels[${y}][${x}][2]`)
      flat[base + 3] = toByte(pixel[3], `pixels[${y}][${x}][3]`)
    }
  }

  return buildAsset(width, height, flat)
}

type SharpNamespace = {
  default?: (input?: unknown) => SharpPipeline
}

type SharpPipeline = {
  ensureAlpha(): SharpPipeline
  raw(): SharpPipeline
  toBuffer(options: { resolveWithObject: true }): Promise<{
    data: Uint8Array
    info: {
      width: number
      height: number
    }
  }>
}

const loadSharp = async (): Promise<(input?: unknown) => SharpPipeline> => {
  try {
    const sharp = (await import('sharp')) as SharpNamespace
    return (
      sharp.default ??
      ((sharp as unknown as { sharp?: (input?: unknown) => SharpPipeline }).sharp as
        | ((input?: unknown) => SharpPipeline)
        | undefined) ??
      (() => {
        throw new Error('invalid sharp module shape')
      })
    )
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`sharp is required to load image assets: ${reason}`)
  }
}

const fromSharpPipeline = async (pipeline: SharpPipeline): Promise<RgbaAsset> => {
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return fromRgbaBytes(info.width, info.height, data)
}

export const fromImageBytes = async (bytes: ArrayBuffer | Uint8Array): Promise<RgbaAsset> => {
  const sharp = await loadSharp()
  const normalized = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return fromSharpPipeline(sharp(normalized))
}

export const fromImageFile = async (path: string): Promise<RgbaAsset> => {
  const sharp = await loadSharp()
  return fromSharpPipeline(sharp(path))
}
