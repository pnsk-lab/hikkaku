import type { Plugin } from 'vite'
import { describe, expect, test } from 'vite-plus/test'
import { scratchProjectMinifier } from './vite'

type AssetBundle = Record<
  string,
  {
    type: 'asset'
    fileName: string
    names: string[]
    originalFileNames: string[]
    source: string
  }
>

describe('scratchProjectMinifier', () => {
  test('rewrites matching project.json assets', () => {
    const plugin = scratchProjectMinifier() as Plugin
    const generateBundle = plugin.generateBundle

    if (!generateBundle) {
      throw new Error('expected generateBundle hook')
    }
    const generateBundleHandler =
      typeof generateBundle === 'function'
        ? generateBundle
        : generateBundle.handler

    const bundle: AssetBundle = {
      'project.json': {
        type: 'asset',
        fileName: 'project.json',
        names: [],
        originalFileNames: [],
        source: JSON.stringify({
          meta: {
            semver: '3.0.0',
            agent: 'verbose user agent',
          },
          targets: [
            {
              isStage: true,
              name: 'Stage',
              currentCostume: 0,
              broadcasts: {},
              variables: {},
              lists: {},
              blocks: {},
              costumes: [],
              sounds: [],
              comments: {},
            },
          ],
        }),
      },
    }

    generateBundleHandler.call({} as never, {} as never, bundle as never, false)

    const asset = bundle['project.json']
    if (!asset || asset.type !== 'asset' || typeof asset.source !== 'string') {
      throw new Error('expected rewritten asset source')
    }

    expect(asset.source).not.toContain('verbose user agent')
    expect(asset.source).toContain('"semver":"3.0.0"')
  })
})
