import { describe, expect, test } from 'vite-plus/test'

import { DEFAULT_LANGUAGE, DEFAULT_STEP_MS } from './constants.ts'

describe('moonscratch/js/vm/constants.ts', () => {
  test('exports default constants', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(DEFAULT_STEP_MS).toBe(16)
  })
})
