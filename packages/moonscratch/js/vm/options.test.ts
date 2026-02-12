import { describe, expect, test } from 'vite-plus/test'

import { toOptionsJson } from './options.ts'

describe('moonscratch/js/vm/options.ts', () => {
  test('returns undefined when options are omitted', () => {
    expect(toOptionsJson(undefined)).toBeUndefined()
  })

  test('passes through raw options JSON strings', () => {
    expect(toOptionsJson('{"turbo":true}')).toBe('{"turbo":true}')
  })

  test('maps camelCase and snake_case fields to raw options', () => {
    const json = toOptionsJson({
      turbo: true,
      compatibility30tps: true,
      max_clones: 123,
      deterministic: true,
      seed: 42,
      penWidth: 480,
      pen_height: 360,
    })

    expect(json).toBe(
      '{"turbo":true,"compatibility_30tps":true,"max_clones":123,"deterministic":true,"seed":42,"pen_width":480,"pen_height":360}',
    )
  })
})
