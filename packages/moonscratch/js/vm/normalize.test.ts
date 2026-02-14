import { describe, expect, test } from 'vite-plus/test'

import {
  cloneTranslateCache,
  normalizeFrameCount,
  normalizeFrameMs,
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
    expect(normalizeFrameCount(3.9)).toBe(3)
    expect(normalizeFrameMs(1000 / 30)).toBe(33)
    expect(normalizeNowMs(16.9)).toBe(16)
    expect(normalizeMaxFrames(10.7)).toBe(10)
    expect(() => normalizeFrameCount(0)).toThrow(
      'frameCount must be greater than 0',
    )
  })

  test('maps raw frame report fields', () => {
    expect(
      toFrameReport(
        {
          now_ms: 33,
          active_threads: 2,
          tick_count: 4,
          op_count: 100,
          emitted_effects: 3,
        },
        1,
        33,
      ),
    ).toEqual({
      nowMs: 33,
      activeThreads: 2,
      ticks: 4,
      ops: 100,
      emittedEffects: 3,
      frameCount: 1,
      frameMs: 33,
      elapsedMs: 33,
    })
  })
})
