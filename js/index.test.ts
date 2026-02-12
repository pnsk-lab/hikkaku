import { describe, expect, test } from 'vite-plus/test'

import * as assetsIndex from './assets/index.ts'
import * as index from './index.ts'
import * as vmIndex from './vm/index.ts'

describe('moonscratch/js/index.ts', () => {
  test('re-exports vm and assets APIs', () => {
    expect(index.createHeadlessVM).toBe(vmIndex.createHeadlessVM)
    expect(index.createVM).toBe(vmIndex.createVM)
    expect(index.moonscratch).toBe(vmIndex.moonscratch)

    expect(index.fromRgbaBytes).toBe(assetsIndex.fromRgbaBytes)
    expect(index.fromImageData).toBe(assetsIndex.fromImageData)
    expect(index.fromCanvas).toBe(assetsIndex.fromCanvas)
    expect(index.fromRgbaMatrix).toBe(assetsIndex.fromRgbaMatrix)
    expect(index.fromImageBytes).toBe(assetsIndex.fromImageBytes)
    expect(index.fromImageFile).toBe(assetsIndex.fromImageFile)
  })
})
