import { describe, expect, test } from 'vite-plus/test'
import hikkaku from './index'

describe('vite/index', () => {
  test('creates vite plugins', () => {
    const plugins = hikkaku({ entry: '/tmp/project.ts' })
    expect(Array.isArray(plugins)).toBe(true)
    if (Array.isArray(plugins)) {
      expect(plugins.length).toBeGreaterThan(0)
    }
  })
})
