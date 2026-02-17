import { describe, expect, test } from 'vite-plus/test'

import { createHeadlessVM, createProgramModuleFromProject } from './factory.ts'
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

const WARP_EXIT_PROJECT: ProjectJson = {
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {
        stage_value: ['stage value', 0],
      },
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
            proccode: 'set value',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        proc_def: {
          opcode: 'procedures_definition',
          next: 'set_value',
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
            proccode: 'set value',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        set_value: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'proc_def',
          inputs: {
            VALUE: [1, [4, 7]],
          },
          fields: {
            VARIABLE: ['stage value', 'stage_value'],
          },
          topLevel: false,
        },
      },
    },
  ],
}

const WARP_FOREVER_PROJECT: ProjectJson = {
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
          next: 'forever_proc',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        forever_proc: {
          opcode: 'control_forever',
          next: null,
          parent: 'hat_flag',
          inputs: {
            SUBSTACK: [2, 'call_proc'],
          },
          fields: {},
          topLevel: false,
        },
        call_proc: {
          opcode: 'procedures_call',
          next: null,
          parent: 'forever_proc',
          inputs: {},
          fields: {},
          mutation: {
            proccode: 'tick',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        proc_def: {
          opcode: 'procedures_definition',
          next: 'say_tick',
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
            proccode: 'tick',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            warp: true,
          },
          topLevel: false,
        },
        say_tick: {
          opcode: 'looks_say',
          next: null,
          parent: 'proc_def',
          inputs: {
            MESSAGE: [1, [10, 'tick']],
          },
          fields: {},
          topLevel: false,
        },
      },
    },
  ],
}

describe('moonscratch/js/vm scheduler render contracts', () => {
  const nonWarpProgram = createProgramModuleFromProject({
    projectJson: NON_WARP_REDRAW_PROJECT,
  })
  const warpProgram = createProgramModuleFromProject({
    projectJson: WARP_REDRAW_PROJECT,
  })
  const warpExitProgram = createProgramModuleFromProject({
    projectJson: WARP_EXIT_PROJECT,
  })
  const warpForeverProgram = createProgramModuleFromProject({
    projectJson: WARP_FOREVER_PROJECT,
  })

  test('non-warp redraw stops frame with rerender reason and asks renderer update', () => {
    const vm = createHeadlessVM({
      program: nonWarpProgram,
      initialNowMs: 0,
    })
    vm.greenFlag()
    vm.setTime(16)

    const frame = vm.stepFrame()

    expect(
      frame.stopReason === 'rerender' || frame.stopReason === 'finished',
    ).toBe(true)
    expect(frame.shouldRender).toBe(true)
    if (frame.stopReason === 'rerender') {
      expect(frame.activeThreads).toBeGreaterThan(0)
    } else {
      expect(frame.activeThreads).toBe(0)
    }
  })

  test('warp redraw does not request render while warp is still active', () => {
    const vm = createHeadlessVM({
      program: warpProgram,
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

  test('returns warp-exit before finished when warp context ends in same frame', () => {
    const vm = createHeadlessVM({
      program: warpExitProgram,
      initialNowMs: 0,
      options: {
        stepTimeoutTicks: 10000,
        turbo: true,
      },
    })
    vm.greenFlag()

    const first = vm.stepFrame()
    const second = vm.stepFrame()

    expect(first.stopReason).toBe('warp-exit')
    expect(first.shouldRender).toBe(true)
    expect(first.activeThreads).toBe(0)
    expect(second.stopReason).toBe('finished')
  })

  test('emits warp-exit when forever script repeatedly re-enters warp procedure', () => {
    const vm = createHeadlessVM({
      program: warpForeverProgram,
      initialNowMs: 0,
      options: {
        stepTimeoutTicks: 100,
      },
    })
    vm.greenFlag()

    const frame = vm.stepFrame()

    expect(frame.stopReason).toBe('warp-exit')
    expect(frame.shouldRender).toBe(true)
    expect(frame.activeThreads).toBeGreaterThan(0)
  })
})
