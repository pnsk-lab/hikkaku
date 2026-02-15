import { Project } from 'hikkaku'
import {
  add,
  changeVariableBy,
  gt,
  ifElse,
  mathop,
  repeat,
  repeatUntil,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import type { Meta, ScratchProject } from 'sb3-types'

import type { HeadlessVM, JsonValue } from '../vm/index.ts'

const PROJECT_META: Meta = {
  semver: '3.0.0',
  vm: '0.2.0',
  agent: 'moonscratch-tests',
}

export const EXAMPLE_PROJECT: ScratchProject = {
  meta: PROJECT_META,
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: { var_score: ['score', 0] },
      lists: {},
      blocks: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
    },
    {
      isStage: false,
      name: 'Sprite1',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {
        hat: {
          opcode: 'event_whenflagclicked',
          next: 'set',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'hat',
          inputs: { VALUE: [1, [4, 42]] },
          fields: { VARIABLE: ['score', 'var_score'] },
          topLevel: false,
        },
      },
    },
  ],
}

export const TEXT_TO_SPEECH_TRANSLATE_PROJECT: ScratchProject = {
  meta: PROJECT_META,
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: {
        var_viewer: ['viewer', ''],
        var_trans: ['translated', ''],
        var_done: ['done', 0],
      },
      lists: {},
      blocks: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
    },
    {
      isStage: false,
      name: 'Sprite1',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {
        hat_flag: {
          opcode: 'event_whenflagclicked',
          next: 'set_viewer',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set_viewer: {
          opcode: 'data_setvariableto',
          next: 'set_translate',
          parent: 'hat_flag',
          inputs: { VALUE: [2, 'viewer_reporter'] },
          fields: { VARIABLE: ['viewer', 'var_viewer'] },
          topLevel: false,
        },
        viewer_reporter: {
          opcode: 'translate_getViewerLanguage',
          next: null,
          parent: 'set_viewer',
          inputs: {},
          fields: {},
          topLevel: false,
        },
        set_translate: {
          opcode: 'data_setvariableto',
          next: 'set_voice',
          parent: 'set_viewer',
          inputs: { VALUE: [2, 'translate_reporter'] },
          fields: { VARIABLE: ['translated', 'var_trans'] },
          topLevel: false,
        },
        translate_reporter: {
          opcode: 'translate_getTranslate',
          next: null,
          parent: 'set_translate',
          inputs: {
            WORDS: [1, [10, 'hello']],
            LANGUAGE: [1, [10, 'ja']],
          },
          fields: {},
          topLevel: false,
        },
        set_voice: {
          opcode: 'text2speech_setVoice',
          next: 'set_language',
          parent: 'set_translate',
          inputs: { VOICE: [1, [10, 'TENOR']] },
          fields: {},
          topLevel: false,
        },
        set_language: {
          opcode: 'text2speech_setLanguage',
          next: 'speak',
          parent: 'set_voice',
          inputs: { LANGUAGE: [1, [10, 'ja']] },
          fields: {},
          topLevel: false,
        },
        speak: {
          opcode: 'text2speech_speakAndWait',
          next: 'set_done',
          parent: 'set_language',
          inputs: { WORDS: [1, [10, 'hello']] },
          fields: {},
          topLevel: false,
        },
        set_done: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'speak',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['done', 'var_done'] },
          topLevel: false,
        },
      },
    },
  ],
}

export const INPUT_EVENT_PROJECT: ScratchProject = {
  meta: PROJECT_META,
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: {
        var_stage_click: ['stage_click', 0],
        var_sprite_click: ['sprite_click', 0],
        var_key: ['key_pressed', 0],
      },
      lists: {},
      blocks: {
        hat_stage_click: {
          opcode: 'event_whenstageclicked',
          next: 'set_stage_click',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set_stage_click: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'hat_stage_click',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['stage_click', 'var_stage_click'] },
          topLevel: false,
        },
      },
      broadcasts: {},
      costumes: [],
      sounds: [],
    },
    {
      isStage: false,
      name: 'Sprite1',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {
        hat_sprite_click: {
          opcode: 'event_whenthisspriteclicked',
          next: 'set_sprite_click',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set_sprite_click: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'hat_sprite_click',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['sprite_click', 'var_sprite_click'] },
          topLevel: false,
        },
        hat_key: {
          opcode: 'event_whenkeypressed',
          next: 'set_key',
          parent: null,
          inputs: {},
          fields: {
            KEY_OPTION: ['space', 'space'],
          },
          topLevel: true,
        },
        set_key: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'hat_key',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['key_pressed', 'var_key'] },
          topLevel: false,
        },
      },
    },
  ],
}

export const CONTROL_OPERATOR_DATA_PROJECT: ScratchProject = {
  meta: PROJECT_META,
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: {
        var_result: ['result', 0],
        var_branch: ['branch', 0],
      },
      lists: {},
      blocks: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
    },
    {
      isStage: false,
      name: 'Sprite1',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {
        hat: {
          opcode: 'event_whenflagclicked',
          next: 'set_result_0',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set_result_0: {
          opcode: 'data_setvariableto',
          next: 'repeat_3',
          parent: 'hat',
          inputs: { VALUE: [1, [4, 0]] },
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        repeat_3: {
          opcode: 'control_repeat',
          next: 'if_else_branch',
          parent: 'set_result_0',
          inputs: {
            TIMES: [1, [4, 3]],
            SUBSTACK: [2, 'repeat_change_result'],
          },
          fields: {},
          topLevel: false,
        },
        repeat_change_result: {
          opcode: 'data_changevariableby',
          next: null,
          parent: 'repeat_3',
          inputs: { VALUE: [2, 'add_1_2'] },
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        add_1_2: {
          opcode: 'operator_add',
          next: null,
          parent: 'repeat_change_result',
          inputs: {
            NUM1: [1, [4, 1]],
            NUM2: [1, [4, 2]],
          },
          fields: {},
          topLevel: false,
        },
        if_else_branch: {
          opcode: 'control_if_else',
          next: 'while_lt_15',
          parent: 'repeat_3',
          inputs: {
            CONDITION: [2, 'gt_result_8'],
            SUBSTACK: [2, 'set_branch_1'],
            SUBSTACK2: [2, 'set_branch_2'],
          },
          fields: {},
          topLevel: false,
        },
        gt_result_8: {
          opcode: 'operator_gt',
          next: null,
          parent: 'if_else_branch',
          inputs: {
            OPERAND1: [2, 'report_result_1'],
            OPERAND2: [1, [4, 8]],
          },
          fields: {},
          topLevel: false,
        },
        report_result_1: {
          opcode: 'data_variable',
          next: null,
          parent: 'gt_result_8',
          inputs: {},
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        set_branch_1: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'if_else_branch',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['branch', 'var_branch'] },
          topLevel: false,
        },
        set_branch_2: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'if_else_branch',
          inputs: { VALUE: [1, [4, 2]] },
          fields: { VARIABLE: ['branch', 'var_branch'] },
          topLevel: false,
        },
        while_lt_15: {
          opcode: 'control_while',
          next: 'repeat_until_gt_17',
          parent: 'if_else_branch',
          inputs: {
            CONDITION: [2, 'lt_result_15'],
            SUBSTACK: [2, 'while_change_result'],
          },
          fields: {},
          topLevel: false,
        },
        lt_result_15: {
          opcode: 'operator_lt',
          next: null,
          parent: 'while_lt_15',
          inputs: {
            OPERAND1: [2, 'report_result_2'],
            OPERAND2: [1, [4, 15]],
          },
          fields: {},
          topLevel: false,
        },
        report_result_2: {
          opcode: 'data_variable',
          next: null,
          parent: 'lt_result_15',
          inputs: {},
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        while_change_result: {
          opcode: 'data_changevariableby',
          next: null,
          parent: 'while_lt_15',
          inputs: { VALUE: [1, [4, 2]] },
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        repeat_until_gt_17: {
          opcode: 'control_repeat_until',
          next: null,
          parent: 'while_lt_15',
          inputs: {
            CONDITION: [2, 'gt_result_17'],
            SUBSTACK: [2, 'until_change_result'],
          },
          fields: {},
          topLevel: false,
        },
        gt_result_17: {
          opcode: 'operator_gt',
          next: null,
          parent: 'repeat_until_gt_17',
          inputs: {
            OPERAND1: [2, 'report_result_3'],
            OPERAND2: [1, [4, 17]],
          },
          fields: {},
          topLevel: false,
        },
        report_result_3: {
          opcode: 'data_variable',
          next: null,
          parent: 'gt_result_17',
          inputs: {},
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
        until_change_result: {
          opcode: 'data_changevariableby',
          next: null,
          parent: 'repeat_until_gt_17',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['result', 'var_result'] },
          topLevel: false,
        },
      },
    },
  ],
}

const WASM_ONLY_HIKKAKU_PROJECT_BUILDER = new Project()
const wasmOnlyResult = WASM_ONLY_HIKKAKU_PROJECT_BUILDER.stage.createVariable(
  'result',
  0,
)
const wasmOnlyBranch = WASM_ONLY_HIKKAKU_PROJECT_BUILDER.stage.createVariable(
  'branch',
  0,
)
WASM_ONLY_HIKKAKU_PROJECT_BUILDER.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(wasmOnlyResult, 0)
    repeat(6, () => {
      changeVariableBy(wasmOnlyResult, add(1, 2))
    })
    ifElse(
      gt(wasmOnlyResult.get(), 17),
      () => {
        setVariableTo(wasmOnlyBranch, 1)
      },
      () => {
        setVariableTo(wasmOnlyBranch, 2)
      },
    )
  })
})

export const WASM_ONLY_HIKKAKU_PROJECT =
  WASM_ONLY_HIKKAKU_PROJECT_BUILDER.toScratch() as ScratchProject

export const WASM_ONLY_HIKKAKU_RESULT_ID = wasmOnlyResult.id
export const WASM_ONLY_HIKKAKU_BRANCH_ID = wasmOnlyBranch.id

const WASM_MATHOP_LOOP_PROJECT_BUILDER = new Project()
const wasmMathopCandidate =
  WASM_MATHOP_LOOP_PROJECT_BUILDER.stage.createVariable('candidate', 10)
const wasmMathopDivisor = WASM_MATHOP_LOOP_PROJECT_BUILDER.stage.createVariable(
  'divisor',
  1,
)
const wasmMathopCount = WASM_MATHOP_LOOP_PROJECT_BUILDER.stage.createVariable(
  'count',
  0,
)

WASM_MATHOP_LOOP_PROJECT_BUILDER.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(wasmMathopCandidate, 10)
    setVariableTo(wasmMathopDivisor, 1)
    setVariableTo(wasmMathopCount, 0)
    repeatUntil(
      gt(wasmMathopDivisor.get(), mathop('sqrt', wasmMathopCandidate.get())),
      () => {
        changeVariableBy(wasmMathopCount, 1)
        changeVariableBy(wasmMathopDivisor, 1)
      },
    )
  })
})

export const WASM_MATHOP_LOOP_PROJECT =
  WASM_MATHOP_LOOP_PROJECT_BUILDER.toScratch() as ScratchProject

export const WASM_MATHOP_LOOP_COUNT_ID = wasmMathopCount.id

export const HOST_OPCODE_FALLBACK_PROJECT: ScratchProject = {
  meta: PROJECT_META,
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: {
        var_done: ['done', 0],
      },
      lists: {},
      blocks: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
    },
    {
      isStage: false,
      name: 'Sprite1',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {
        hat: {
          opcode: 'event_whenflagclicked',
          next: 'set_language',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        set_language: {
          opcode: 'text2speech_setLanguage',
          next: 'set_done',
          parent: 'hat',
          inputs: { LANGUAGE: [1, [10, 'ja']] },
          fields: {},
          topLevel: false,
        },
        set_done: {
          opcode: 'data_setvariableto',
          next: null,
          parent: 'set_language',
          inputs: { VALUE: [1, [4, 1]] },
          fields: { VARIABLE: ['done', 'var_done'] },
          topLevel: false,
        },
      },
    },
  ],
}

export const getStageVariables = (
  vm: HeadlessVM,
): Record<string, JsonValue> => {
  const stage = vm.snapshot().targets.find((target) => target.isStage)
  if (!stage) {
    throw new Error('stage target was not found in snapshot')
  }
  return stage.variables
}

export const stepMany = (vm: HeadlessVM, count: number): void => {
  let nowMs = vm.snapshot().nowMs
  for (let index = 0; index < count; index += 1) {
    nowMs += 33
    vm.setTime(nowMs)
    vm.stepFrame()
  }
}
