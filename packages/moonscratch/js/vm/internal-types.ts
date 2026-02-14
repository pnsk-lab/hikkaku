export interface RawVMOptions {
  turbo?: boolean
  compatibility_30tps?: boolean
  max_clones?: number
  deterministic?: boolean
  seed?: number
  pen_width?: number
  pen_height?: number
}

export interface RawFrameReport {
  now_ms: number
  active_threads: number
  tick_count: number
  op_count: number
  emitted_effects: number
}

interface MoonOk<T> {
  $tag: 1
  _0: T
}

interface MoonErr<E> {
  $tag: 0
  _0: E
}

export type MoonResult<T, E> = MoonOk<T> | MoonErr<E>
