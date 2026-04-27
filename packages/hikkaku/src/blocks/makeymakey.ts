import { InputType } from 'sb3-types/enum'
import { menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

export type MakeyMakeyKey =
  | 'SPACE'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'w'
  | 'a'
  | 's'
  | 'd'
  | 'f'
  | 'g'

/**
 * Hat block that triggers when a Makey Makey key is pressed.
 *
 * Input: `key`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param key See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenMakeyKeyPressed } from 'hikkaku/blocks'
 *
 * whenMakeyKeyPressed('SPACE', () => {})
 * ```
 */
export const whenMakeyKeyPressed = (
  key: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('makeymakey_whenMakeyKeyPressed', {
    topLevel: true,
    inputs: {
      KEY: menuInput(key, menuOfKey),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfKey = (key: MakeyMakeyKey = 'SPACE') => {
  return valueBlock<HikkakuString>('makeymakey_menu_KEY', {
    fields: {
      KEY: [key, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when a sequence of Makey Makey keys is pressed in order.
 *
 * Input: `sequence`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param sequence See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenCodePressed } from 'hikkaku/blocks'
 *
 * whenCodePressed('LEFT UP RIGHT', () => {})
 * ```
 */
export const whenCodePressed = (
  sequence: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('makeymakey_whenCodePressed', {
    topLevel: true,
    inputs: {
      SEQUENCE: menuInput(sequence, menuOfSequence),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfSequence = (sequence = 'LEFT UP RIGHT') => {
  return valueBlock<HikkakuString>('makeymakey_menu_SEQUENCE', {
    fields: {
      SEQUENCE: [sequence, null],
    },
    isShadow: true,
  })
}
