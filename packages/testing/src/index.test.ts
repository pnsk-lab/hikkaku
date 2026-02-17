import { describe, expect, test } from 'vite-plus/test'
import * as pkg from './index'

describe('package exports', () => {
  test('exports public API symbols', () => {
    expect(typeof pkg.toScratchProject).toBe('function')
    expect(typeof pkg.getSnapshotTarget).toBe('function')
    expect(typeof pkg.getSnapshotVariable).toBe('function')
    expect(typeof pkg.createProjectHarness).toBe('function')
    expect(typeof pkg.runProjectUntilIdle).toBe('function')
    expect(typeof pkg.runProjectFrames).toBe('function')
    expect(typeof pkg.createHeadlessVMFromProject).toBe('function')
    expect(typeof pkg.createHeadlessVMWithScratchAssets).toBe('function')
  })
})
