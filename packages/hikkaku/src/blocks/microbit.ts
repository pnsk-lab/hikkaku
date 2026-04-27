import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type MicroBitButton = 'A' | 'B' | 'any'
export type MicroBitGesture =
  | 'moved'
  | 'shaken'
  | 'jumped'
export type MicroBitTiltDirection = 'front' | 'back' | 'left' | 'right'
export type MicroBitTiltDirectionAny =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'any'

/**
 * Hat block that triggers when a micro:bit button is pressed.
 *
 * Input: `button`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param button See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitWhenButtonPressed } from 'hikkaku/blocks'
 *
 * microbitWhenButtonPressed('A', () => {})
 * ```
 */
export const microbitWhenButtonPressed = (
  button: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('microbit_whenButtonPressed', {
    topLevel: true,
    inputs: {
      BTN: menuInput(button, microbitMenuOfButtons),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const microbitMenuOfButtons = (button: MicroBitButton = 'A') => {
  return valueBlock<HikkakuString>('microbit_menu_buttons', {
    fields: {
      buttons: [button, null],
    },
    isShadow: true,
  })
}

/**
 * Boolean check for whether a micro:bit button is pressed.
 *
 * Input: `button`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param button See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { microbitIsButtonPressed } from 'hikkaku/blocks'
 *
 * microbitIsButtonPressed('A')
 * ```
 */
export const microbitIsButtonPressed = (
  button: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuBool>('microbit_isButtonPressed', {
    inputs: {
      BTN: menuInput(button, microbitMenuOfButtons),
    },
  })
}

/**
 * Hat block that triggers when a micro:bit gesture is detected.
 *
 * Input: `gesture`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param gesture See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitWhenGesture } from 'hikkaku/blocks'
 *
 * microbitWhenGesture('moved', () => {})
 * ```
 */
export const microbitWhenGesture = (
  gesture: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('microbit_whenGesture', {
    topLevel: true,
    inputs: {
      GESTURE: menuInput(gesture, microbitMenuOfGestures),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const microbitMenuOfGestures = (gesture: MicroBitGesture = 'moved') => {
  return valueBlock<HikkakuString>('microbit_menu_gestures', {
    fields: {
      gestures: [gesture, null],
    },
    isShadow: true,
  })
}

/**
 * Displays a symbol on the micro:bit LED matrix.
 *
 * Input: `matrix`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param matrix See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitDisplaySymbol } from 'hikkaku/blocks'
 *
 * microbitDisplaySymbol('0101010101100010101000100')
 * ```
 */
export const microbitDisplaySymbol = (
  matrix: PrimitiveSource<HikkakuString>,
) => {
  return block('microbit_displaySymbol', {
    inputs: {
      MATRIX: fromPrimitiveSource(
        InputType.String,
        matrix,
        '0101010101100010101000100',
      ),
    },
  })
}

/**
 * Displays text on the micro:bit.
 *
 * Input: `text`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param text See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitDisplayText } from 'hikkaku/blocks'
 *
 * microbitDisplayText('Hello!')
 * ```
 */
export const microbitDisplayText = (text: PrimitiveSource<HikkakuString>) => {
  return block('microbit_displayText', {
    inputs: {
      TEXT: fromPrimitiveSource(InputType.String, text, 'Hello!'),
    },
  })
}

/**
 * Clears the micro:bit display.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitDisplayClear } from 'hikkaku/blocks'
 *
 * microbitDisplayClear()
 * ```
 */
export const microbitDisplayClear = () => {
  return block('microbit_displayClear', {})
}

/**
 * Hat block that triggers when micro:bit is tilted.
 *
 * Input: `direction`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param direction See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitWhenTilted } from 'hikkaku/blocks'
 *
 * microbitWhenTilted('any', () => {})
 * ```
 */
export const microbitWhenTilted = (
  direction: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('microbit_whenTilted', {
    topLevel: true,
    inputs: {
      DIRECTION: menuInput(direction, microbitMenuOfTiltDirectionAny),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const microbitMenuOfTiltDirectionAny = (
  direction: MicroBitTiltDirectionAny = 'any',
) => {
  return valueBlock<HikkakuString>('microbit_menu_tiltDirectionAny', {
    fields: {
      tiltDirectionAny: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Boolean check for whether micro:bit is tilted.
 *
 * Input: `direction`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param direction See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { microbitIsTilted } from 'hikkaku/blocks'
 *
 * microbitIsTilted('any')
 * ```
 */
export const microbitIsTilted = (direction: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuBool>('microbit_isTilted', {
    inputs: {
      DIRECTION: menuInput(direction, microbitMenuOfTiltDirectionAny),
    },
  })
}

/**
 * Returns the tilt angle of the micro:bit.
 *
 * Input: `direction`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param direction See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { microbitGetTiltAngle } from 'hikkaku/blocks'
 *
 * microbitGetTiltAngle('front')
 * ```
 */
export const microbitGetTiltAngle = (
  direction: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('microbit_getTiltAngle', {
    inputs: {
      DIRECTION: menuInput(direction, microbitMenuOfTiltDirection),
    },
  })
}

export const microbitMenuOfTiltDirection = (
  direction: MicroBitTiltDirection = 'front',
) => {
  return valueBlock<HikkakuString>('microbit_menu_tiltDirection', {
    fields: {
      tiltDirection: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when a micro:bit pin is connected.
 *
 * Input: `pin`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param pin See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { microbitWhenPinConnected } from 'hikkaku/blocks'
 *
 * microbitWhenPinConnected('0', () => {})
 * ```
 */
export const microbitWhenPinConnected = (
  pin: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('microbit_whenPinConnected', {
    topLevel: true,
    inputs: {
      PIN: menuInput(pin, microbitMenuOfTouchPins),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const microbitMenuOfTouchPins = (pin = '0') => {
  return valueBlock<HikkakuString>('microbit_menu_touchPins', {
    fields: {
      touchPins: [pin, null],
    },
    isShadow: true,
  })
}
