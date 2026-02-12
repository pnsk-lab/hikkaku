import { describe, expect, test } from 'vite-plus/test'

import { buildAsset } from './build-asset.ts'

describe('moonscratch/js/assets/build-asset.ts', () => {
  test('builds rgba asset from flat bytes', () => {
    const asset = buildAsset(2, 1, [0, 255, 0, 255, 255, 0, 0, 255])
    expect(asset).toEqual({
      width: 2,
      height: 1,
      rgbaBase64: 'AP8A//8AAP8=',
    })
  })

  test('throws when rgba length is shorter than expected', () => {
    expect(() => buildAsset(2, 1, [255, 0, 0, 255])).toThrow('rgba length must be at least 8')
  })

  test('throws when rgba contains invalid byte values', () => {
    expect(() => buildAsset(1, 1, [300, 0, 0, 255])).toThrow('rgba[0] must be between 0 and 255')
  })
})
