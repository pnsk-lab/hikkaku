import { describe, expect, test } from 'vite-plus/test'

import { DEFAULT_FPS, DEFAULT_FRAME_MS, DEFAULT_LANGUAGE } from './constants.ts'

describe('moonscratch/js/vm/constants.ts', () => {
  test('exports default constants', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(DEFAULT_FPS).toBe(30)
    expect(DEFAULT_FRAME_MS).toBeCloseTo(1000 / 30)
  })
})
