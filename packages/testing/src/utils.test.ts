import { describe, expect, test } from 'vite-plus/test'
import { isRecord, isVariableRef, isVariableTuple } from './utils'

describe('utils', () => {
  test('isRecord detects plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('foo')).toBe(false)
  })

  test('isVariableRef detects { id: string }', () => {
    expect(isVariableRef({ id: 'abc' })).toBe(true)
    expect(isVariableRef({ id: 123 })).toBe(false)
    expect(isVariableRef({})).toBe(false)
    expect(isVariableRef('abc')).toBe(false)
    expect(isVariableRef(null)).toBe(false)
  })

  test('isVariableTuple detects scratch-like variable tuple', () => {
    expect(isVariableTuple(['score', 0])).toBe(true)
    expect(isVariableTuple(['x', 1, 2])).toBe(true)
    expect(isVariableTuple([])).toBe(false)
    expect(isVariableTuple(['score'])).toBe(false)
    expect(isVariableTuple({ id: 'score' })).toBe(false)
  })
})
