import { describe, expect, test } from 'vite-plus/test'
import { InputType, Shadow } from './sb3-enum'

describe('core/sb3-enum', () => {
  test('exposes numeric enum values', () => {
    expect(Number.isInteger(Shadow.SameBlockShadow)).toBe(true)
    expect(Number.isInteger(Shadow.NoShadow)).toBe(true)
    expect(Number.isInteger(InputType.Number)).toBe(true)
    expect(Number.isInteger(InputType.Color)).toBe(true)
  })
})
