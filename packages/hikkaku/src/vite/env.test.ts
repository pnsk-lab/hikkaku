import { describe, expect, test } from 'vite-plus/test'
import { createHikkakuEnvironment } from './env'

describe('vite/env', () => {
  test('exports environment factory', () => {
    expect(typeof createHikkakuEnvironment).toBe('function')
  })
})
