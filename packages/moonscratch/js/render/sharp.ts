import type { RenderFrame, RenderWithSharpOptions } from './types.ts'
import { normalizeRenderFrame } from './utils.ts'

type SharpNamespace = {
  default?: SharpFactory
  sharp?: SharpFactory
}

type SharpFactory = (input?: unknown, options?: unknown) => SharpPipeline

type SharpPipeline = {
  raw?(): SharpPipeline
  png?(): SharpPipeline
  jpeg?(): SharpPipeline
  webp?(): SharpPipeline
  toBuffer(): Promise<unknown>
}

const loadSharp = async (): Promise<
  (input?: unknown, options?: unknown) => SharpPipeline
> => {
  try {
    const sharp = (await import('sharp')) as unknown as SharpNamespace
    if (sharp.default) {
      return sharp.default
    }
    const direct = sharp.sharp
    if (typeof direct === 'function') {
      return direct
    }
    throw new Error('invalid sharp module shape')
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      `sharp is required to render PNG/WebP/JPEG output: ${reason}`,
    )
  }
}

export const renderWithSharp = async (
  input: RenderFrame,
  options: RenderWithSharpOptions = {},
): Promise<Buffer> => {
  const frame = normalizeRenderFrame(input)
  if (frame.width <= 0 || frame.height <= 0) {
    return Buffer.from([])
  }

  const sharp = await loadSharp()
  const pipeline = sharp(frame.pixels, {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
  const format = options.format ?? 'png'
  let current = pipeline
  switch (format) {
    case 'png':
      if (typeof current.png === 'function') {
        current = current.png()
      }
      break
    case 'jpeg':
    case 'jpg':
      if (typeof current.jpeg === 'function') {
        current = current.jpeg()
      }
      break
    case 'webp':
      if (typeof current.webp === 'function') {
        current = current.webp()
      }
      break
    default:
      throw new Error(`unsupported sharp output format: ${String(format)}`)
  }

  if (typeof current.toBuffer !== 'function') {
    throw new Error('sharp pipeline does not expose toBuffer')
  }
  const rawBuffer = await current.toBuffer()
  if (rawBuffer instanceof Buffer) {
    return rawBuffer
  }
  if (rawBuffer instanceof Uint8Array) {
    return Buffer.from(rawBuffer)
  }
  throw new Error('sharp returned unsupported buffer type')
}
