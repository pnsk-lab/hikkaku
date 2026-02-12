import { describe, expect, test } from 'vite-plus/test'

import { createHeadlessVM, createVM } from './factory.ts'
import { getStageVariables, stepMany, TEXT_TO_SPEECH_TRANSLATE_PROJECT } from './test-projects.ts'

describe('moonscratch/js/vm/factory.ts', () => {
  test('exports createVM as alias of createHeadlessVM', () => {
    expect(createVM).toBe(createHeadlessVM)
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
    expect(effects.some((effect) => effect.type === 'translate_request')).toBe(false)

    vm.ackTextToSpeech('text2speech_done_1')
    stepMany(vm, 10)

    const stageVars = getStageVariables(vm)
    expect(stageVars.var_viewer).toBe('ja')
    expect(stageVars.var_trans).toBe('こんにちは')
    expect(stageVars.var_done).toBe(1)
  })
})
