import { describe, expect, test } from 'vite-plus/test'

import * as assets from './assets.ts'
import * as assetsIndex from './assets/index.ts'

describe('moonscratch/js/assets.ts', () => {
  test('re-exports public asset APIs', () => {
    expect(assets.fromRgbaBytes).toBe(assetsIndex.fromRgbaBytes)
    expect(assets.fromImageData).toBe(assetsIndex.fromImageData)
    expect(assets.fromCanvas).toBe(assetsIndex.fromCanvas)
    expect(assets.fromRgbaMatrix).toBe(assetsIndex.fromRgbaMatrix)
    expect(assets.fromImageBytes).toBe(assetsIndex.fromImageBytes)
    expect(assets.fromImageFile).toBe(assetsIndex.fromImageFile)
  })
})
