import { describe, expect, test, vi } from 'vite-plus/test'
import { renderWithSVG } from '../render/index.ts'
import {
  EXAMPLE_PROJECT,
  getStageVariables,
  INPUT_EVENT_PROJECT,
  stepMany,
  TEXT_TO_SPEECH_TRANSLATE_PROJECT,
} from '../test/test-projects.ts'
import { createHeadlessVM, createProgramModuleFromProject } from './factory.ts'
import type { CreateHeadlessVMOptions, ProjectJson } from './types.ts'

describe('moonscratch/js/vm/headless-vm.ts', () => {
  const createVm = (
    projectJson: ProjectJson,
    overrides: Omit<CreateHeadlessVMOptions, 'program'> = {},
  ) => {
    const program = createProgramModuleFromProject({ projectJson })
    return createHeadlessVM({
      program,
      ...overrides,
    })
  }

  test('runs project and normalizes frame values', () => {
    const vm = createVm(EXAMPLE_PROJECT, {
      initialNowMs: 0,
    })
    vm.greenFlag()
    expect(getStageVariables(vm).var_score).toBe(42)
    vm.setTime(17)

    const first = vm.stepFrame()
    const second = vm.stepFrame()

    expect(first).toEqual({
      activeThreads: 0,
      ticks: 0,
      ops: 0,
      emittedEffects: 0,
      stopReason: 'finished',
      shouldRender: true,
      isInWarp: false,
    })
    expect(second.stopReason).toBe('finished')
    expect(getStageVariables(vm).var_score).toBe(42)
  })

  test('renders current scene with renderFrame and renderWithSVG', () => {
    const vm = createVm(EXAMPLE_PROJECT)
    const frame = vm.renderFrame()
    const svg = renderWithSVG(frame)

    expect(frame.width).toBeGreaterThan(0)
    expect(frame.height).toBeGreaterThan(0)
    expect(frame.pixels.length).toBe(frame.width * frame.height * 4)
    expect(svg).toContain('<svg')
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).toContain('fill="rgb(255,255,255)"')
    expect(svg).toContain('</svg>')
  })

  test('detects click and key hats from input state', () => {
    const vm = createVm(INPUT_EVENT_PROJECT, {
      initialNowMs: 0,
    })
    vm.greenFlag()
    vm.setMouseState({
      x: 0,
      y: 0,
      isDown: true,
    })
    vm.setMouseTargets({
      stage: true,
      targets: ['Sprite1'],
    })
    vm.setKeysDown(['space'])
    stepMany(vm, 12)

    expect(getStageVariables(vm).var_stage_click).toBe(1)
    expect(getStageVariables(vm).var_sprite_click).toBe(1)
    expect(getStageVariables(vm).var_key).toBe(1)
  })

  test('handleEffects dispatches handlers and caches translated text for next run', async () => {
    const vm = createVm(TEXT_TO_SPEECH_TRANSLATE_PROJECT, {
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
