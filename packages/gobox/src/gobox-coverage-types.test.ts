import { describe, expect, test } from 'vite-plus/test'
import { number, struct } from './types'

describe('gobox/types edge cases', () => {
  test('skips falsy struct field definitions', () => {
    const type = struct({
      skipped: undefined as never,
      value: number(42),
    } as {
      skipped: never
      value: ReturnType<typeof number>
    })

    expect(type.fieldOffsets).toHaveProperty('value', 0)
    expect((type.fieldOffsets as { skipped?: number }).skipped).toBeUndefined()
    expect(type.width).toBe(1)
    expect(type.defaults).toEqual([42])
  })
})
