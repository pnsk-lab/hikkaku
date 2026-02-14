import type { CanvasLike } from '../assets/types.ts'

export interface RenderFrame {
  width: number
  height: number
  pixels: Uint8Array
}

export interface RenderFrameLike {
  width: number
  height: number
  pixels: ArrayLike<number>
}

export interface RenderImageData {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface RenderWithSharpOptions {
  format?: 'png' | 'jpeg' | 'jpg' | 'webp'
}

export interface RenderWithWebGLOptions {
  canvas?: CanvasLike
}

export interface RenderWithWebGLResult {
  canvas: unknown
  toImageData: () => RenderImageData
  toImageElement: () => unknown
}

export type WebGLRenderResult = RenderWithWebGLResult
