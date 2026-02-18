import { describe, expect, test } from 'vite-plus/test'
import * as assets from './index'

describe('assets/index', () => {
  test('re-exports default assets and helpers', () => {
    expect(assets.IMAGES.BLANK_SVG.assetId).toBe(
      'cd21514d0531fdffb22204e0ec5ed84a',
    )
    expect(assets.SOUNDS.BOING.name).toBe('Boing')
    expect(typeof assets.svg).toBe('function')
  })
})
