import type { Input } from 'sb3-types'
import { InputType, Shadow } from '../core/sb3-enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { attachStack, block } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

/**
 * Runs when green flag is clicked.
 *
 * Input: `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param stack () => void Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenFlagClicked } from 'hikkaku/blocks'
 *
 * whenFlagClicked(() => {})
 * ```
 */
export const whenFlagClicked = (stack?: () => void) => {
  const res = block('event_whenflagclicked', {
    topLevel: true,
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when key is pressed.
 *
 * Input: `key`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param key string
 * @param stack Input value used by this block. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenKeyPressed } from 'hikkaku/blocks'
 *
 * whenKeyPressed('space', () => {})
 * ```
 */
export const whenKeyPressed = (key: string, stack?: () => void) => {
  const res = block('event_whenkeypressed', {
    topLevel: true,
    fields: {
      KEY_OPTION: [key, null],
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when sprite is clicked.
 *
 * Input: `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenThisSpriteClicked } from 'hikkaku/blocks'
 *
 * whenThisSpriteClicked(() => {})
 * ```
 */
export const whenThisSpriteClicked = (stack?: () => void) => {
  const res = block('event_whenthisspriteclicked', {
    topLevel: true,
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when stage is clicked.
 *
 * Input: `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenStageClicked } from 'hikkaku/blocks'
 *
 * whenStageClicked(() => {})
 * ```
 */
export const whenStageClicked = (stack?: () => void) => {
  const res = block('event_whenstageclicked', {
    topLevel: true,
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when backdrop changes.
 *
 * Input: `backdrop`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param backdrop See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenBackdropSwitchesTo } from 'hikkaku/blocks'
 *
 * whenBackdropSwitchesTo('backdrop1', () => {})
 * ```
 */
export const whenBackdropSwitchesTo = (
  backdrop: string,
  stack?: () => void,
) => {
  const res = block('event_whenbackdropswitchesto', {
    topLevel: true,
    fields: {
      BACKDROP: [backdrop, null],
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when a broadcast is received.
 *
 * Input: `broadcast`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param broadcast See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenBroadcastReceived } from 'hikkaku/blocks'
 *
 * whenBroadcastReceived('message1', () => {})
 * ```
 */
export const whenBroadcastReceived = (
  broadcast: string,
  stack?: () => void,
) => {
  const res = block('event_whenbroadcastreceived', {
    topLevel: true,
    fields: {
      BROADCAST_OPTION: [broadcast, null],
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Runs when touching object.
 *
 * Input: `target`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param target See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenTouchingObject } from 'hikkaku/blocks'
 *
 * whenTouchingObject('mouse-pointer', () => {})
 * ```
 */
export const whenTouchingObject = (target: string, stack?: () => void) => {
  const res = block('event_whentouchingobject', {
    topLevel: true,
    fields: {
      TOUCHINGOBJECTMENU: [target, null],
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Triggered by sensor threshold.
 *
 * Input: `menu`, `value`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param menu See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenGreaterThan } from 'hikkaku/blocks'
 *
 * whenGreaterThan('loudness', 10, () => {})
 * ```
 */
export const whenGreaterThan = (
  menu: string,
  value: PrimitiveSource<number>,
  stack?: () => void,
) => {
  const res = block('event_whengreaterthan', {
    topLevel: true,
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      WHENGREATERTHANMENU: [menu, null],
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Sends a broadcast.
 *
 * Input: `message`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { broadcast } from 'hikkaku/blocks'
 *
 * broadcast('Hello')
 * ```
 */
export const broadcast = (message: PrimitiveSource<string>) => {
  return block('event_broadcast', {
    inputs: {
      BROADCAST_INPUT:
        typeof message === 'string'
          ? ([
              Shadow.SameBlockShadow,
              [InputType.Broadcast, message, message],
            ] as Input)
          : fromPrimitiveSource(message),
    },
  })
}

/**
 * Broadcasts and waits.
 *
 * Input: `message`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { broadcastAndWait } from 'hikkaku/blocks'
 *
 * broadcastAndWait('Hello')
 * ```
 */
export const broadcastAndWait = (message: PrimitiveSource<string>) => {
  return block('event_broadcastandwait', {
    inputs: {
      BROADCAST_INPUT: fromPrimitiveSource(message),
    },
  })
}
