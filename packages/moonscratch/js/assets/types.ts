export interface RgbaAsset {
  width: number
  height: number
  rgbaBase64: string
}

export type RgbaTuple = readonly [number, number, number, number]
export type RgbaMatrix = ReadonlyArray<ReadonlyArray<RgbaTuple | ReadonlyArray<number>>>

export interface ImageDataLike {
  width: number
  height: number
  data: ArrayLike<number>
}

export interface Canvas2DContextLike {
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageDataLike
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: string, options?: unknown): Canvas2DContextLike | null
}
