import { describe, expect, test } from 'vite-plus/test'

import { createHeadlessVM } from './factory.ts'
import type { ProjectJson } from './types.ts'

const NON_WARP_REDRAW_PROJECT: ProjectJson = {
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {},
      lists: {},
      blocks: {},
    },
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      lists: {},
      blocks: {
        hat_flag: {
          opcode: 'event_whenflagclicked',
          next: 'repeat_draw',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        repeat_draw: {
          opcode: 'control_repeat',
          next: null,
          parent: 'hat_flag',
          inputs: {
            TIMES: [4, 200],
            SUBSTACK: [2, 'pen_clear'],
          },
          fields: {},
          topLevel: false,
        },
        pen_clear: {
          opcode: 'pen_clear',
          next: null,
          parent: 'repeat_draw',
          inputs: {},
          fields: {},
          topLevel: false,
        },
      },
    },
  ],
}

const WARP_REDRAW_PROJECT: ProjectJson = {
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {},
      lists: {},
      blocks: {},
    },
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      lists: {},
      blocks: {
        hat_flag: {
          opcode: 'event_whenflagclicked',
          next: 'call_proc',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        call_proc: {
          opcode: 'procedures_call',
          next: null,
          parent: 'hat_flag',
          inputs: {},
          fields: {},
          mutation: {
            proccode: 'draw loop',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        proc_def: {
          opcode: 'procedures_definition',
          next: 'repeat_proc',
          parent: null,
          inputs: {
            custom_block: [1, 'proc_proto'],
          },
          fields: {},
          topLevel: true,
        },
        proc_proto: {
          opcode: 'procedures_prototype',
          next: null,
          parent: 'proc_def',
          inputs: {},
          fields: {},
          mutation: {
            proccode: 'draw loop',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        repeat_proc: {
          opcode: 'control_repeat',
          next: null,
          parent: 'proc_def',
          inputs: {
            TIMES: [4, 6000000],
            SUBSTACK: [2, 'looks_say_warp'],
          },
          fields: {},
          topLevel: false,
        },
        looks_say_warp: {
          opcode: 'looks_say',
          next: null,
          parent: 'repeat_proc',
          inputs: {
            MESSAGE: [1, [10, 'warp']],
          },
          fields: {},
          topLevel: false,
        },
      },
    },
  ],
}

describe('moonscratch/js/vm scheduler render contracts', () => {
  test('non-warp redraw stops frame with rerender reason and asks renderer update', () => {
    const vm = createHeadlessVM({
      projectJson: NON_WARP_REDRAW_PROJECT,
      initialNowMs: 0,
    })
    vm.greenFlag()
    vm.setTime(16)

    const frame = vm.stepFrame()

    expect(frame.stopReason).toBe('rerender')
    expect(frame.shouldRender).toBe(true)
    expect(frame.activeThreads).toBeGreaterThan(0)
  })

  test('warp redraw does not request render while warp is still active', () => {
    const vm = createHeadlessVM({
      projectJson: WARP_REDRAW_PROJECT,
      initialNowMs: 0,
      options: {
        stepTimeoutTicks: 1,
      },
    })
    vm.greenFlag()
    vm.setTime(16)

    const frame = vm.stepFrame()

    expect(frame.stopReason).toBe('timeout')
    expect(frame.shouldRender).toBe(false)
    expect(frame.activeThreads).toBeGreaterThan(0)
  })
})
