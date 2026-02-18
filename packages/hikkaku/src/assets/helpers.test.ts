import { describe, expect, test } from 'vite-plus/test'
import { png, sound, svg } from './helpers'

describe('assets/helpers', () => {
  test('creates svg and png costumes', () => {
    expect(svg('abc')).toMatchObject({
      dataFormat: 'svg',
      assetId: 'abc',
      md5ext: 'abc.svg',
    })
    expect(png('xyz')).toMatchObject({
      dataFormat: 'png',
      assetId: 'xyz',
    })
  })

  test('creates sounds', () => {
    expect(sound('pop', 'id1', 10, 22050)).toMatchObject({
      name: 'pop',
      assetId: 'id1',
      dataFormat: 'wav',
      md5ext: 'id1.wav',
      sampleCount: 10,
      rate: 22050,
    })
  })
})
