import { describe, expect, test } from 'vite-plus/test'

import {
  cloneTranslateCache,
  normalizeLanguage,
  normalizeMaxFrames,
  normalizeNowMs,
  toFrameReport,
} from './normalize.ts'

describe('moonscratch/js/vm/normalize.ts', () => {
  test('normalizes language code', () => {
    expect(normalizeLanguage(' JA ')).toBe('ja')
    expect(normalizeLanguage('')).toBe('en')
  })

  test('clones and normalizes translate cache', () => {
    const cache = cloneTranslateCache({ JA: { hello: 'こんにちは' } })
    expect(cache).toEqual({ ja: { hello: 'こんにちは' } })
  })

  test('normalizes frame inputs', () => {
    expect(normalizeNowMs(16.9)).toBe(16)
    expect(normalizeMaxFrames(10.7)).toBe(10)
  })

  test('maps raw frame report fields', () => {
    expect(
      toFrameReport({
        active_threads: 2,
        tick_count: 4,
        op_count: 100,
        emitted_effects: 3,
        stop_reason: 'timeout',
        should_render: true,
        is_in_warp: false,
      }),
    ).toEqual({
      activeThreads: 2,
      ticks: 4,
      ops: 100,
      emittedEffects: 3,
      stopReason: 'timeout',
      shouldRender: true,
      isInWarp: false,
    })
  })
})
