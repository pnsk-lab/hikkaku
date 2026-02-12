import { describe, expect, test } from 'vite-plus/test'

import {
  cloneTranslateCache,
  normalizeLanguage,
  normalizeStepMs,
  toStepReport,
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

  test('normalizes step milliseconds', () => {
    expect(normalizeStepMs(16.9)).toBe(16)
    expect(normalizeStepMs(-1)).toBe(0)
    expect(() => normalizeStepMs(Number.POSITIVE_INFINITY)).toThrow('dtMs must be a finite number')
  })

  test('maps raw step report fields', () => {
    expect(
      toStepReport({
        now_ms: 16,
        active_threads: 2,
        stepped_threads: 1,
        emitted_effects: 3,
      }),
    ).toEqual({
      nowMs: 16,
      activeThreads: 2,
      steppedThreads: 1,
      emittedEffects: 3,
    })
  })
})
