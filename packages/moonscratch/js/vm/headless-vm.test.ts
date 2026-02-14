import { describe, expect, test, vi } from 'vite-plus/test'

import { createHeadlessVM } from './factory.ts'
import {
  EXAMPLE_PROJECT,
  getStageVariables,
  stepMany,
  TEXT_TO_SPEECH_TRANSLATE_PROJECT,
} from './test-projects.ts'

describe('moonscratch/js/vm/headless-vm.ts', () => {
  test('runs project and normalizes frame values', () => {
    const vm = createHeadlessVM({
      projectJson: EXAMPLE_PROJECT,
      initialNowMs: 0,
    })
    vm.greenFlag()

    const first = vm.stepFrame(1, 16.9)
    const second = vm.stepFrame()

    expect(first).toEqual({
      nowMs: 17,
      activeThreads: 0,
      ticks: 1,
      ops: 1,
      emittedEffects: 0,
      frameCount: 1,
      frameMs: 17,
      elapsedMs: 17,
    })
    expect(second.frameMs).toBe(33)
    expect(second.nowMs).toBe(50)
    expect(() => vm.stepFrame(1, Number.POSITIVE_INFINITY)).toThrow(
      'frameMs must be a finite number',
    )
    expect(getStageVariables(vm).var_score).toBe(42)
  })

  test('renders current scene as svg', () => {
    const vm = createHeadlessVM({ projectJson: EXAMPLE_PROJECT })
    const svg = vm.renderSvg()

    expect(svg).toContain('<svg')
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).toContain('rgb(255,255,255)')
    expect(svg).toContain('</svg>')
  })

  test('handleEffects dispatches handlers and caches translated text for next run', async () => {
    const vm = createHeadlessVM({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
      viewerLanguage: 'ja',
    })
    const translate = vi.fn(async () => 'こんにちは')
    const textToSpeech = vi.fn(async () => undefined)
    const effect = vi.fn(async () => undefined)

    vm.greenFlag()
    stepMany(vm, 6)

    const handled = await vm.handleEffects({ translate, textToSpeech, effect })
    expect(handled.map((item) => item.type)).toEqual([
      'translate_request',
      'text_to_speech',
    ])
    expect(translate).toHaveBeenCalledTimes(1)
    expect(textToSpeech).toHaveBeenCalledTimes(1)
    expect(effect).toHaveBeenCalledTimes(2)

    stepMany(vm, 10)
    expect(getStageVariables(vm).var_done).toBe(1)
    expect(getStageVariables(vm).var_trans).toBe('hello')

    vm.greenFlag()
    stepMany(vm, 6)

    const secondRunEffects = vm.takeEffects()
    expect(
      secondRunEffects.some((item) => item.type === 'translate_request'),
    ).toBe(false)
    const secondRunTts = secondRunEffects.find(
      (item): item is { type: 'text_to_speech'; waitKey: string } =>
        item.type === 'text_to_speech' &&
        typeof (item as { waitKey?: unknown }).waitKey === 'string',
    )
    expect(secondRunTts).toBeDefined()
    if (!secondRunTts) {
      throw new Error('text_to_speech effect was not found in second run')
    }
    vm.ackTextToSpeech(secondRunTts.waitKey)
    stepMany(vm, 10)

    expect(getStageVariables(vm).var_done).toBe(1)
    expect(getStageVariables(vm).var_trans).toBe('こんにちは')
  })
})
