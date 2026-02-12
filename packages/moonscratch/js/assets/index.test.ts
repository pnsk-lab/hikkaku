import { describe, expect, test } from 'vite-plus/test'

import * as create from './create.ts'
import * as index from './index.ts'

describe('moonscratch/js/assets/index.ts', () => {
  test('re-exports create helpers', () => {
    expect(index.fromRgbaBytes).toBe(create.fromRgbaBytes)
    expect(index.fromImageData).toBe(create.fromImageData)
    expect(index.fromCanvas).toBe(create.fromCanvas)
    expect(index.fromRgbaMatrix).toBe(create.fromRgbaMatrix)
    expect(index.fromImageBytes).toBe(create.fromImageBytes)
    expect(index.fromImageFile).toBe(create.fromImageFile)
  })
})
