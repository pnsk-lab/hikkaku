import { InputType, Shadow } from 'sb3-types/enum'
import {
  fromBooleanSource,
  fromPrimitiveSource,
  menuInput,
} from '../core/block-helper'
import { attachStack, block, substack, valueBlock } from '../core/composer'
import type { PrimitiveSource, VariableReference } from '../core/types'

export type StopOption =
  | 'all'
  | 'this script'
  | 'other scripts in sprite'
  | 'other scripts in stage'

/**
 * Repeats enclosed blocks a fixed number of times.
 *
 * Input: `times`, `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param times PrimitiveSource<number>. number of iterations
 * @param handler () => void. body of the loop
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { repeat } from 'hikkaku/blocks'
 *
 * repeat(10, () => {})
 * ```
 */
export const repeat = (times: PrimitiveSource<number>, handler: () => void) => {
  const substackId = substack(handler)
  return block('control_repeat', {
    inputs: {
      TIMES: fromPrimitiveSource(InputType.PositiveInteger, times, 10),
      ...(substackId ? { SUBSTACK: [Shadow.NoShadow, substackId] } : {}),
    },
  })
}

/**
 * Repeats until the condition becomes true.
 *
 * Input: `condition`, `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param condition PrimitiveSource<boolean>
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { repeatUntil } from 'hikkaku/blocks'
 *
 * repeatUntil(true, () => {})
 * ```
 */
export const repeatUntil = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_repeat_until', {
    inputs: {
      CONDITION: fromBooleanSource(condition),
      ...(substackId ? { SUBSTACK: [Shadow.NoShadow, substackId] } : {}),
    },
  })
}

/**
 * Repeats while the condition remains true.
 *
 * Input: `condition`, `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param condition PrimitiveSource<boolean>
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { repeatWhile } from 'hikkaku/blocks'
 *
 * repeatWhile(true, () => {})
 * ```
 */
export const repeatWhile = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_while', {
    inputs: {
      CONDITION: fromBooleanSource(condition),
      ...(substackId ? { SUBSTACK: [Shadow.NoShadow, substackId] } : {}),
    },
  })
}

/**
 * Loops with a loop variable.
 *
 * Input: `variable`, `value`, `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param variable VariableReference
 * @param value PrimitiveSource<number>. upper bound
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { forEach } from 'hikkaku/blocks'
 *
 * forEach(variable, 10, () => {})
 * ```
 */
export const forEach = (
  variable: VariableReference,
  value: PrimitiveSource<number>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_for_each', {
    inputs: {
      VALUE: fromPrimitiveSource(InputType.Number, value, 10),
      ...(substackId ? { SUBSTACK: [Shadow.NoShadow, substackId] } : {}),
    },
    fields: {
      VARIABLE: [variable.name, variable.id],
    },
  })
}

/**
 * Infinite loop.
 *
 * Input: `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { forever } from 'hikkaku/blocks'
 *
 * forever(() => {})
 * ```
 */
export const forever = (handler: () => void) => {
  const substackId = substack(handler)
  return block('control_forever', {
    inputs: substackId
      ? {
          SUBSTACK: [Shadow.NoShadow, substackId],
        }
      : {},
  })
}

/**
 * Pauses execution.
 *
 * Input: `seconds`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param seconds PrimitiveSource<number>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wait } from 'hikkaku/blocks'
 *
 * wait(10)
 * ```
 */
export const wait = (seconds: PrimitiveSource<number>) => {
  return block('control_wait', {
    inputs: {
      DURATION: fromPrimitiveSource(InputType.Number, seconds, 1),
    },
  })
}

/**
 * Waits until condition becomes true.
 *
 * Input: `condition`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param condition PrimitiveSource<boolean>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { waitUntil } from 'hikkaku/blocks'
 *
 * waitUntil(true)
 * ```
 */
export const waitUntil = (condition: PrimitiveSource<boolean>) => {
  return block('control_wait_until', {
    inputs: {
      CONDITION: fromBooleanSource(condition),
    },
  })
}

/**
 * Conditional execution.
 *
 * Input: `condition`, `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param condition PrimitiveSource<boolean>
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ifThen } from 'hikkaku/blocks'
 *
 * ifThen(true, () => {})
 * ```
 */
export const ifThen = (
  condition: PrimitiveSource<boolean>,
  handler: () => void,
) => {
  const substackId = substack(handler)
  return block('control_if', {
    inputs: {
      CONDITION: fromBooleanSource(condition),
      ...(substackId ? { SUBSTACK: [Shadow.NoShadow, substackId] } : {}),
    },
  })
}

/**
 * If / else branching.
 *
 * Input: `condition`, `thenHandler`, `elseHandler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param condition PrimitiveSource<boolean>
 * @param thenHandler () => void
 * @param elseHandler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ifElse } from 'hikkaku/blocks'
 *
 * ifElse(true, () => {}, () => {})
 * ```
 */
export const ifElse = (
  condition: PrimitiveSource<boolean>,
  thenHandler: () => void,
  elseHandler: () => void,
) => {
  const thenSubstackId = substack(thenHandler)
  const elseSubstackId = substack(elseHandler)
  return block('control_if_else', {
    inputs: {
      CONDITION: fromBooleanSource(condition),
      ...(thenSubstackId
        ? { SUBSTACK: [Shadow.NoShadow, thenSubstackId] }
        : {}),
      ...(elseSubstackId
        ? { SUBSTACK2: [Shadow.NoShadow, elseSubstackId] }
        : {}),
    },
  })
}

/**
 * Builds chained if / else-if / else branching from condition-handler pairs.
 *
 * Input: `branches`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param branches Input value used by this block.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { match } from 'hikkaku/blocks'
 *
 * match([true, () => {}], () => {})
 * ```
 */
export const match = (
  ...branches:
    | [condition: PrimitiveSource<boolean>, handler: () => void][]
    | [
        ...[condition: PrimitiveSource<boolean>, handler: () => void][],
        () => void,
      ]
) => {
  if (branches.length === 0) {
    return
  }

  const tail = branches[branches.length - 1]
  const defaultHandler = typeof tail === 'function' ? tail : null
  const branchList = (defaultHandler ? branches.slice(0, -1) : branches) as [
    PrimitiveSource<boolean>,
    () => void,
  ][]

  if (branchList.length === 0) {
    return defaultHandler?.()
  }

  let elseHandler: () => void = defaultHandler ?? (() => {})
  for (let i = branchList.length - 1; i >= 0; i--) {
    const branch = branchList[i]
    if (!branch) {
      continue
    }
    const [condition, handler] = branch
    const next = elseHandler
    elseHandler = () => {
      ifElse(condition, handler, next)
    }
  }

  return elseHandler()
}

/**
 * Stops scripts.
 *
 * Input: `option`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param option 'all' | 'this script' | 'other scripts in sprite' | 'other scripts in stage'
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { stop } from 'hikkaku/blocks'
 *
 * stop('all')
 * ```
 */
export const stop = (option: StopOption) => {
  return block('control_stop', {
    fields: {
      STOP_OPTION: [option, null],
    },
  })
}

/**
 * Special menu value for cloning the current sprite.
 *
 * Input: none.
 * Output: String constant used as the `target` argument of {@link createClone}.
 *
 * @example
 * ```ts
 * import { CREATE_CLONE_MYSELF, createClone } from 'hikkaku/blocks'
 *
 * createClone(CREATE_CLONE_MYSELF)
 * ```
 */
export const CREATE_CLONE_MYSELF = '_myself_'
/**
 * Creates a clone of a target.
 *
 * Input: `target`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param target string
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { createClone } from 'hikkaku/blocks'
 *
 * createClone('Sprite1')
 * ```
 */

export const createClone = (target: PrimitiveSource<string>) => {
  return block('control_create_clone_of', {
    inputs: {
      CLONE_OPTION: menuInput(target, menuOfCreateClone),
    },
  })
}

export const menuOfCreateClone = (
  target: (string & {}) | typeof CREATE_CLONE_MYSELF = CREATE_CLONE_MYSELF,
) => {
  return valueBlock('control_create_clone_of_menu', {
    fields: {
      CLONE_OPTION: [target, null],
    },
    isShadow: true,
  })
}

/**
 * Deletes the current clone.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { deleteThisClone } from 'hikkaku/blocks'
 *
 * deleteThisClone()
 * ```
 */
export const deleteThisClone = () => {
  return block('control_delete_this_clone', {})
}

/**
 * Returns the global counter value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getCounter } from 'hikkaku/blocks'
 *
 * getCounter()
 * ```
 */
export const getCounter = () => {
  return valueBlock('control_get_counter', {})
}

/**
 * Increments the counter.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { incrCounter } from 'hikkaku/blocks'
 *
 * incrCounter()
 * ```
 */
export const incrCounter = () => {
  return block('control_incr_counter', {})
}

/**
 * Resets the counter.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { clearCounter } from 'hikkaku/blocks'
 *
 * clearCounter()
 * ```
 */
export const clearCounter = () => {
  return block('control_clear_counter', {})
}

/**
 * Starts the script when the clone is created. You should use this to control clone behavior.
 *
 * Input: `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param stack Input value used by this block. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { controlStartAsClone } from 'hikkaku/blocks'
 *
 * controlStartAsClone(() => {})
 * ```
 */
export const controlStartAsClone = (stack?: () => void) => {
  const res = block('control_start_as_clone', {
    topLevel: true,
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Executes enclosed blocks without screen refresh.
 *
 * Input: `handler`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param handler () => void
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { allAtOnce } from 'hikkaku/blocks'
 *
 * allAtOnce(() => {})
 * ```
 */
export const allAtOnce = (handler: () => void) => {
  const substackId = substack(handler)
  return block('control_all_at_once', {
    inputs: substackId
      ? {
          SUBSTACK: [Shadow.NoShadow, substackId],
        }
      : {},
  })
}
