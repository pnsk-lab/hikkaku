import { describe, expect, test, vi } from 'vite-plus/test'

import { resolveMissingScratchAssets } from './scratch-assets.ts'

const RGBA_ASSET = {
  width: 1,
  height: 1,
  rgbaBase64: 'AP8A/w==',
}

const STAGE_PROJECT_WITH_COSTUMES = {
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {},
      lists: {},
      blocks: {},
      costumes: [
        {
          name: 'backdrop1',
          assetId: 'bg_green',
          md5ext: 'bg_green.png',
        },
      ],
    },
  ],
}

describe('moonscratch/js/vm/scratch-assets.ts', () => {
  test('downloads missing assets from Scratch CDN and maps by assetId + md5ext', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }))
    const decodeImageBytes = vi.fn(async () => RGBA_ASSET)

    const assets = await resolveMissingScratchAssets({
      projectJson: STAGE_PROJECT_WITH_COSTUMES,
      fetchAsset,
      decodeImageBytes,
    })

    expect(fetchAsset).toHaveBeenCalledWith(
      'https://cdn.scratch.mit.edu/internalapi/asset/bg_green.png/get/',
    )
    expect(decodeImageBytes).toHaveBeenCalledTimes(1)
    expect(assets.bg_green).toEqual(RGBA_ASSET)
    expect(assets['bg_green.png']).toEqual(RGBA_ASSET)
  })

  test('does not download when existing asset is keyed by md5ext', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }))

    const assets = await resolveMissingScratchAssets({
      projectJson: STAGE_PROJECT_WITH_COSTUMES,
      assets: {
        'bg_green.png': RGBA_ASSET,
      },
      fetchAsset,
    })

    expect(fetchAsset).not.toHaveBeenCalled()
    expect(assets.bg_green).toEqual(RGBA_ASSET)
    expect(assets['bg_green.png']).toEqual(RGBA_ASSET)
  })

  test('deduplicates repeated md5ext downloads', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }))
    const decodeImageBytes = vi.fn(async () => RGBA_ASSET)

    const assets = await resolveMissingScratchAssets({
      projectJson: {
        targets: [
          {
            isStage: true,
            name: 'Stage',
            variables: {},
            lists: {},
            blocks: {},
            costumes: [
              {
                name: 'backdrop1',
                assetId: 'bg_green',
                md5ext: 'bg_green.png',
              },
              {
                name: 'backdrop2',
                assetId: 'bg_green_2',
                md5ext: 'bg_green.png',
              },
            ],
          },
        ],
      },
      fetchAsset,
      decodeImageBytes,
    })

    expect(fetchAsset).toHaveBeenCalledTimes(1)
    expect(decodeImageBytes).toHaveBeenCalledTimes(1)
    expect(assets.bg_green).toEqual(RGBA_ASSET)
    expect(assets.bg_green_2).toEqual(RGBA_ASSET)
    expect(assets['bg_green.png']).toEqual(RGBA_ASSET)
  })

  test('throws when asset download fails', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      arrayBuffer: async () => new ArrayBuffer(0),
    }))

    await expect(
      resolveMissingScratchAssets({
        projectJson: STAGE_PROJECT_WITH_COSTUMES,
        fetchAsset,
      }),
    ).rejects.toThrow(
      'failed to download Scratch asset bg_green.png: 404 Not Found',
    )
  })
})
