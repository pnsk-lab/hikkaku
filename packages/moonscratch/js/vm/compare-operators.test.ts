import { describe, expect, test } from 'vite-plus/test'
import { getStageVariables } from '../test/test-projects.ts'
import { createHeadlessVM, createProgramModuleFromProject } from './factory.ts'
import type { ProjectJson } from './types.ts'

const COMPARE_OPERATOR_PROJECT: ProjectJson = {
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {
        var_lt_bad: ['lt_bad', 0],
        var_lt_good: ['lt_good', 0],
        var_gt_good: ['gt_good', 0],
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
        hat: {
          opcode: 'event_whenflagclicked',
          next: 'if_lt_bad',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        if_lt_bad: {
          opcode: 'control_if',
          next: 'if_lt_good',
          parent: 'hat',
          inputs: {
            CONDITION: [2, 'lt_bad'],
            SUBSTACK: [2, 'set_lt_bad'],
          },
          fields: {},
          topLevel: false,
        },
        lt_bad: {
          opcode: 'operator_lt',
          next: null,
          parent: 'if_lt_bad',
          inputs: {
            OPERAND1: [1, [4, -24]],
            OPERAND2: [1, [4, -85]],
          },
          fields: {},
          topLevel: false,
        },
        set_lt_bad: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'if_lt_bad',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['lt_bad', 'var_lt_bad'] },
          topLevel: false,
        },
        if_lt_good: {
          opcode: 'control_if',
          next: 'if_gt_good',
          parent: 'if_lt_bad',
          inputs: {
            CONDITION: [2, 'lt_good'],
            SUBSTACK: [2, 'set_lt_good'],
          },
          fields: {},
          topLevel: false,
        },
        lt_good: {
          opcode: 'operator_lt',
          next: null,
          parent: 'if_lt_good',
          inputs: {
            OPERAND1: [1, [4, -85]],
            OPERAND2: [1, [4, -24]],
          },
          fields: {},
          topLevel: false,
        },
        set_lt_good: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'if_lt_good',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['lt_good', 'var_lt_good'] },
          topLevel: false,
        },
        if_gt_good: {
          opcode: 'control_if',
          next: null,
          parent: 'if_lt_good',
          inputs: {
            CONDITION: [2, 'gt_good'],
            SUBSTACK: [2, 'set_gt_good'],
          },
          fields: {},
          topLevel: false,
        },
        gt_good: {
          opcode: 'operator_gt',
          next: null,
          parent: 'if_gt_good',
          inputs: {
            OPERAND1: [1, [4, -24]],
            OPERAND2: [1, [4, -85]],
          },
          fields: {},
          topLevel: false,
        },
        set_gt_good: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'if_gt_good',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['gt_good', 'var_gt_good'] },
          topLevel: false,
        },
      },
    },
  ],
}

describe('moonscratch/js/vm compare operators', () => {
  test('compares negative numeric operands as numbers', () => {
    const program = createProgramModuleFromProject({
      projectJson: COMPARE_OPERATOR_PROJECT,
    })
    const vm = createHeadlessVM({
      program,
      initialNowMs: 0,
    })
    vm.greenFlag()
    vm.setTime(16)
    vm.stepFrame()

    expect(getStageVariables(vm).var_lt_bad).toBe(0)
    expect(getStageVariables(vm).var_lt_good).toBe(1)
    expect(getStageVariables(vm).var_gt_good).toBe(1)
  })
})
