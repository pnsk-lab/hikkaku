import { describe, expect, test, vi } from 'vite-plus/test'

import {
  createHeadlessVM,
  createHeadlessVMWithScratchAssets,
  createVM,
  createVMWithScratchAssets,
} from './factory.ts'
import {
  getStageVariables,
  stepMany,
  TEXT_TO_SPEECH_TRANSLATE_PROJECT,
} from './test-projects.ts'

describe('moonscratch/js/vm/factory.ts', () => {
  test('exports createVM aliases', () => {
    expect(createVM).toBe(createHeadlessVM)
    expect(createVMWithScratchAssets).toBe(createHeadlessVMWithScratchAssets)
  })

  test('rejects empty project JSON strings', () => {
    expect(() => createHeadlessVM({ projectJson: '  ' })).toThrow(
      'projectJson must be a non-empty JSON string or object',
    )
  })

  test('normalizes viewer language and translate cache in constructor options', () => {
    const vm = createHeadlessVM({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
      viewerLanguage: ' JA ',
      translateCache: { JA: { hello: 'こんにちは' } },
    })

    vm.greenFlag()
    stepMany(vm, 6)

    const effects = vm.takeEffects()
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text_to_speech',
          waitKey: 'text2speech_done_1',
          language: 'ja',
        }),
      ]),
    )
    expect(effects.some((effect) => effect.type === 'translate_request')).toBe(
      false,
    )

    vm.ackTextToSpeech('text2speech_done_1')
    stepMany(vm, 10)

    const stageVars = getStageVariables(vm)
    expect(stageVars.var_viewer).toBe('ja')
    expect(stageVars.var_trans).toBe('こんにちは')
    expect(stageVars.var_done).toBe(1)
  })

  test('loads missing costume assets from Scratch CDN', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }))
    const decodeImageBytes = vi.fn(async () => ({
      width: 1,
      height: 1,
      rgbaBase64: 'AP8A/w==',
    }))

    const vm = await createHeadlessVMWithScratchAssets({
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
                bitmapResolution: 1,
                rotationCenterX: 0,
                rotationCenterY: 0,
              },
            ],
          },
        ],
      },
      fetchAsset,
      decodeImageBytes,
    })

    expect(vm).toBeDefined()
    expect(fetchAsset).toHaveBeenCalledWith(
      'https://cdn.scratch.mit.edu/internalapi/asset/bg_green.png/get/',
    )
    expect(decodeImageBytes).toHaveBeenCalledTimes(1)
  })
})
