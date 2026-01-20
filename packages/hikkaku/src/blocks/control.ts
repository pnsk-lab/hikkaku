import { fromPrimitiveSource } from '../compiler/block-helper'
import { block, substack, valueBlock } from '../compiler/composer'
import type { PrimitiveSource, VariableReference } from '../compiler/types'

export type StopOption =
  | 'all'
  | 'this script'
  | 'other scripts in sprite'
  | 'other scripts in stage'

export const repeat = (times: PrimitiveSource<number>, handler: () => void) => {
  const substackId = substack(handler)
  return block('control_repeat', {
    inputs: {
      TIMES: fromPrimitiveSource(times),
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
  })
}

export const repeatUntil = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_repeat_until', {
    inputs: {
      CONDITION: fromPrimitiveSource(condition),
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
  })
}

export const repeatWhile = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_while', {
    inputs: {
      CONDITION: fromPrimitiveSource(condition),
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
  })
}

export const forEach = (
  variable: VariableReference,
  value: PrimitiveSource<number>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_for_each', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
    fields: {
      VARIABLE: [variable.name, variable.id],
    },
  })
}

export const forever = (handler: () => void) => {
  const substackId = substack(handler)
  return block('control_forever', {
    inputs: substackId
      ? {
          SUBSTACK: [2, substackId],
        }
      : {},
  })
}

export const wait = (seconds: PrimitiveSource<number>) => {
  return block('control_wait', {
    inputs: {
      DURATION: fromPrimitiveSource(seconds),
    },
  })
}

export const waitUntil = (condition: PrimitiveSource<boolean>) => {
  return block('control_wait_until', {
    inputs: {
      CONDITION: fromPrimitiveSource(condition),
    },
  })
}

export const ifThen = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_if', {
    inputs: {
      CONDITION: fromPrimitiveSource(condition),
      ...(substackId ? { SUBSTACK: [2, substackId] } : {}),
    },
  })
}

export const ifElse = (
  condition: PrimitiveSource<boolean>,
  thenHandler: () => void,
  elseHandler: () => void,
) => {
  const thenSubstackId = substack(thenHandler)
  const elseSubstackId = substack(elseHandler)
  return block('control_if_else', {
    inputs: {
      CONDITION: fromPrimitiveSource(condition),
      ...(thenSubstackId ? { SUBSTACK: [2, thenSubstackId] } : {}),
      ...(elseSubstackId ? { SUBSTACK2: [2, elseSubstackId] } : {}),
    },
  })
}

export const stop = (option: StopOption) => {
  return block('control_stop', {
    fields: {
      STOP_OPTION: [option, null],
    },
  })
}

export const createClone = (target: string) => {
  return block('control_create_clone_of', {
    fields: {
      CLONE_OPTION: [target, null],
    },
  })
}

export const deleteThisClone = () => {
  return block('control_delete_this_clone', {})
}

export const getCounter = () => {
  return valueBlock('control_get_counter', {})
}

export const incrCounter = () => {
  return block('control_incr_counter', {})
}

export const clearCounter = () => {
  return block('control_clear_counter', {})
}

export const allAtOnce = (handler: () => void) => {
  const substackId = substack(handler)
  return block('control_all_at_once', {
    inputs: substackId
      ? {
          SUBSTACK: [2, substackId],
        }
      : {},
  })
}
