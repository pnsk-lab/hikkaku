import { describe, expect, test } from 'vite-plus/test'

import { toByte, toPositiveInt } from './validation.ts'

describe('moonscratch/js/assets/validation.ts', () => {
  test('toPositiveInt accepts finite positive integers', () => {
    expect(toPositiveInt(1, 'width')).toBe(1)
  })

  test('toPositiveInt rejects invalid values', () => {
    expect(() => toPositiveInt(Number.NaN, 'width')).toThrow('width must be a finite number')
    expect(() => toPositiveInt(1.5, 'height')).toThrow('height must be an integer')
    expect(() => toPositiveInt(0, 'height')).toThrow('height must be greater than 0')
  })

  test('toByte accepts byte values', () => {
    expect(toByte(255, 'rgba[0]')).toBe(255)
  })

  test('toByte rejects out-of-range values', () => {
    expect(() => toByte(-1, 'rgba[0]')).toThrow('rgba[0] must be between 0 and 255')
    expect(() => toByte(256, 'rgba[1]')).toThrow('rgba[1] must be between 0 and 255')
  })
})
