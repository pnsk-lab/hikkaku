import { describe, expect, test } from 'vite-plus/test'

import { encodeBase64 } from './base64.ts'

describe('moonscratch/js/assets/base64.ts', () => {
  test('encodes rgba bytes as base64', () => {
    const encoded = encodeBase64(new Uint8Array([0, 255, 0, 255]))
    expect(encoded).toBe('AP8A/w==')
  })

  test('encodes empty bytes', () => {
    expect(encodeBase64(new Uint8Array([]))).toBe('')
  })
})
