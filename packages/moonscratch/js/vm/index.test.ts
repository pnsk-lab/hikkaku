import { describe, expect, test } from 'vite-plus/test'

import * as factory from './factory.ts'
import * as headless from './headless-vm.ts'
import * as index from './index.ts'
import * as scratchAssets from './scratch-assets.ts'

describe('moonscratch/js/vm/index.ts', () => {
  test('re-exports vm runtime APIs', () => {
    expect(index.createHeadlessVM).toBe(factory.createHeadlessVM)
    expect(index.createHeadlessVMFromProject).toBe(
      factory.createHeadlessVMFromProject,
    )
    expect(index.createHeadlessVMWithScratchAssets).toBe(
      factory.createHeadlessVMWithScratchAssets,
    )
    expect(index.createVM).toBe(factory.createVM)
    expect(index.createVMFromProject).toBe(factory.createVMFromProject)
    expect(index.createVMWithScratchAssets).toBe(
      factory.createVMWithScratchAssets,
    )
    expect(index.HeadlessVM).toBe(headless.HeadlessVM)
    expect(index.resolveMissingScratchAssets).toBe(
      scratchAssets.resolveMissingScratchAssets,
    )
    expect(index.moonscratch).toBe(factory.moonscratch)
  })
})
