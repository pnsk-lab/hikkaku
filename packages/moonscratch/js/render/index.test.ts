import { describe, expect, test, vi } from 'vite-plus/test'

import { renderWithSharp, renderWithSVG, renderWithWebGL } from './index.ts'

const sharpCalls: unknown[] = []

vi.mock('sharp', () => ({
  default: vi.fn((input?: unknown, options?: unknown) => {
    sharpCalls.push([input, options])
    return {
      raw() {
        return this
      },
      png() {
        return this
      },
      jpeg() {
        return this
      },
      webp() {
        return this
      },
      async toBuffer() {
        return Buffer.from([1, 2, 3, 4])
      },
    }
  }),
}))

describe('moonscratch/js/render', () => {
  const frame = {
    width: 2,
    height: 2,
    pixels: new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]),
  }

  test('renderWithSVG builds a compact svg payload', () => {
    const svg = renderWithSVG(frame)
    expect(svg).toContain('<svg')
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).toContain('fill="rgb(255,0,0)"')
    expect(svg).toContain('</svg>')
  })

  test('renderWithSharp calls sharp and returns buffer', async () => {
    const buffer = await renderWithSharp(frame)
    expect(sharpCalls).toEqual([
      [frame.pixels, { raw: { width: 2, height: 2, channels: 4 } }],
    ])
    expect(buffer).toEqual(Buffer.from([1, 2, 3, 4]))
  })

  test('renderWithWebGL throws when canvas is not available', () => {
    expect(() =>
      renderWithWebGL({
        ...frame,
        width: 1,
        height: 1,
        pixels: new Uint8Array([0, 0, 0, 255]),
      }),
    ).toThrow('renderWithWebGL')
  })
})
