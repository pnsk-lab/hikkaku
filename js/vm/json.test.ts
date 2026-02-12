import { describe, expect, test } from 'vite-plus/test'

import { parseJson, toJsonString, toOptionalJsonString, unwrapResult } from './json.ts'

describe('moonscratch/js/vm/json.ts', () => {
  test('serializes JSON object inputs', () => {
    expect(toJsonString({ answer: 42 }, 'projectJson', true)).toBe('{"answer":42}')
  })

  test('rejects empty required JSON strings', () => {
    expect(() => toJsonString('  ', 'projectJson', true)).toThrow(
      'projectJson must be a non-empty JSON string or object',
    )
  })

  test('keeps optional JSON undefined', () => {
    expect(toOptionalJsonString(undefined, 'assets')).toBeUndefined()
  })

  test('unwraps moon results', () => {
    expect(unwrapResult({ $tag: 1, _0: 123 }, 'context')).toBe(123)
    expect(() => unwrapResult({ $tag: 0, _0: { _0: 'boom' } }, 'context')).toThrow('context: boom')
  })

  test('parses json and reports context on parse error', () => {
    expect(parseJson<{ value: number }>(' {"value": 1}', 'ctx').value).toBe(1)
    expect(() => parseJson('not-json', 'ctx')).toThrow('ctx: failed to parse JSON')
  })
})
