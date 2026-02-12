import { describe, expect, test } from 'vite-plus/test'

import { hasNumberField, hasStringField, isObjectRecord } from './value-guards.ts'

describe('moonscratch/js/vm/value-guards.ts', () => {
  test('isObjectRecord identifies plain objects', () => {
    expect(isObjectRecord({ foo: 'bar' })).toBe(true)
    expect(isObjectRecord(null)).toBe(false)
    expect(isObjectRecord([])).toBe(false)
  })

  test('hasStringField validates string fields', () => {
    expect(hasStringField({ name: 'Sprite1' }, 'name')).toBe(true)
    expect(hasStringField({ name: 1 }, 'name')).toBe(false)
  })

  test('hasNumberField validates number fields', () => {
    expect(hasNumberField({ beats: 1.5 }, 'beats')).toBe(true)
    expect(hasNumberField({ beats: '1.5' }, 'beats')).toBe(false)
  })
})
