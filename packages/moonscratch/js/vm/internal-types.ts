export interface RawVMOptions {
  turbo?: boolean
  compatibility_30tps?: boolean
  max_clones?: number
  deterministic?: boolean
  seed?: number
  pen_width?: number
  pen_height?: number
  step_timeout_ticks?: number
}

export interface RawFrameReport {
  active_threads: number
  tick_count: number
  op_count: number
  emitted_effects: number
  stop_reason: string
  should_render: boolean
  is_in_warp: boolean
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
