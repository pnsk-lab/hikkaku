import type { ScratchProject, Meta } from 'sb3-types'

import type { HeadlessVM, JsonValue } from './index.ts'

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

export const getStageVariables = (vm: HeadlessVM): Record<string, JsonValue> => {
  const stage = vm.snapshot().targets.find((target) => target.isStage)
  if (!stage) {
    throw new Error('stage target was not found in snapshot')
  }
  return stage.variables
}

export const stepMany = (vm: HeadlessVM, count: number): void => {
  for (let i = 0; i < count; i += 1) {
    vm.step(16)
  }
}
