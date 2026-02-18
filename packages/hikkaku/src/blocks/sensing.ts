import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

/**
 * Mouse position.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getMouseX } from 'hikkaku/blocks'
 *
 * getMouseX()
 * ```
 */
export const getMouseX = () => {
  return valueBlock('sensing_mousex', {})
}
/**
 * getMouseY block helper.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getMouseY } from 'hikkaku/blocks'
 *
 * getMouseY()
 * ```
 */
export const getMouseY = () => {
  return valueBlock('sensing_mousey', {})
}

export type CurrentMenu =
  | 'year'
  | 'month'
  | 'date'
  | 'dayofweek'
  | 'hour'
  | 'minute'
  | 'second'
export type DragMode = 'draggable' | 'not draggable'

/**
 * Touching target check.
 *
 * Input: `target`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param target See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { touchingObject } from 'hikkaku/blocks'
 *
 * touchingObject('mouse-pointer')
 * ```
 */
export const touchingObject = (target: string) => {
  return valueBlock('sensing_touchingobject', {
    inputs: {
      TOUCHINGOBJECTMENU: menuInput(target, menuOfTouchingObject),
    },
  })
}

export const menuOfTouchingObject = (target: string = '_mouse_') => {
  return valueBlock('sensing_touchingobjectmenu', {
    fields: {
      TOUCHINGOBJECTMENU: [target, null],
    },
    isShadow: true,
  })
}
/**
 * Touching color check.
 *
 * Input: `color`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param color See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { touchingColor } from 'hikkaku/blocks'
 *
 * touchingColor("#ff0000")
 * ```
 */
export const touchingColor = (color: PrimitiveSource<`#${string}`>) => {
  return valueBlock('sensing_touchingcolor', {
    inputs: {
      COLOR: fromPrimitiveSource(InputType.Color, color),
    },
  })
}

/**
 * Color overlap check.
 *
 * Input: `color`, `targetColor`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param color See function signature for accepted input values.
 * @param targetColor See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { colorTouchingColor } from 'hikkaku/blocks'
 *
 * colorTouchingColor("#ff0000", "#00ff00")
 * ```
 */
export const colorTouchingColor = (
  color: PrimitiveSource<`#${string}`>,
  targetColor: PrimitiveSource<`#${string}`>,
) => {
  return valueBlock('sensing_coloristouchingcolor', {
    inputs: {
      COLOR: fromPrimitiveSource(InputType.Color, color),
      COLOR2: fromPrimitiveSource(InputType.Color, targetColor),
    },
  })
}

/**
 * Distance to target.
 *
 * Input: `target`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param target See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { distanceTo } from 'hikkaku/blocks'
 *
 * distanceTo('mouse-pointer')
 * ```
 */
export const distanceTo = (target: string) => {
  return valueBlock('sensing_distanceto', {
    inputs: {
      DISTANCETOMENU: menuInput(target, menuOfDistanceTo),
    },
  })
}

export const menuOfDistanceTo = (target: string = '_mouse_') => {
  return valueBlock('sensing_distancetomenu', {
    fields: {
      DISTANCETOMENU: [target, null],
    },
    isShadow: true,
  })
}

/**
 * Timer value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getTimer } from 'hikkaku/blocks'
 *
 * getTimer()
 * ```
 */
export const getTimer = () => {
  return valueBlock('sensing_timer', {})
}

/**
 * Resets timer.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { resetTimer } from 'hikkaku/blocks'
 *
 * resetTimer()
 * ```
 */
export const resetTimer = () => {
  return block('sensing_resettimer', {})
}

/**
 * Sets drag behavior.
 *
 * Input: `mode`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param mode See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setDragMode } from 'hikkaku/blocks'
 *
 * setDragMode('draggable')
 * ```
 */
export const setDragMode = (mode: DragMode) => {
  return block('sensing_setdragmode', {
    fields: {
      DRAG_MODE: [mode, null],
    },
  })
}

/**
 * Mouse button state.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getMouseDown } from 'hikkaku/blocks'
 *
 * getMouseDown()
 * ```
 */
export const getMouseDown = () => {
  return valueBlock('sensing_mousedown', {})
}

/**
 * Key state.
 *
 * Input: `key`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param key See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getKeyPressed } from 'hikkaku/blocks'
 *
 * getKeyPressed('space')
 * ```
 */
export const getKeyPressed = (key: PrimitiveSource<string>) => {
  return valueBlock('sensing_keypressed', {
    inputs: {
      KEY_OPTION: menuInput(key, menuOfKeyOptions),
    },
  })
}

export const menuOfKeyOptions = (key: string = 'space') => {
  return valueBlock('sensing_keyoptions', {
    fields: {
      KEY_OPTION: [key, null],
    },
    isShadow: true,
  })
}

/**
 * Current date/time value.
 *
 * Input: `menu`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param menu See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { current } from 'hikkaku/blocks'
 *
 * current('loudness')
 * ```
 */
export const current = (menu: CurrentMenu) => {
  return valueBlock('sensing_current', {
    fields: {
      CURRENTMENU: [menu, null],
    },
  })
}
//TODO better typings
/**
 * Reads target attribute.
 *
 * Input: `property`, `target`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param property See function signature for accepted input values.
 * @param target See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getAttributeOf } from 'hikkaku/blocks'
 *
 * getAttributeOf('x position', 'cat')
 * ```
 */
export const getAttributeOf = (property: string, target: string) => {
  return valueBlock('sensing_of', {
    fields: {
      PROPERTY: [property, null],
    },
    inputs: {
      OBJECT: menuInput(target, menuOfAttributeObject),
    },
  })
}
export const menuOfAttributeObject = (object: string = '_stage_') => {
  return valueBlock('sensing_of_object_menu', {
    fields: {
      OBJECT: [object, null],
    },
    isShadow: true,
  })
}

/**
 * Days since 2000-01-01.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { daysSince2000 } from 'hikkaku/blocks'
 *
 * daysSince2000()
 * ```
 */
export const daysSince2000 = () => {
  return valueBlock('sensing_dayssince2000', {})
}

/**
 * Microphone loudness.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getLoudness } from 'hikkaku/blocks'
 *
 * getLoudness()
 * ```
 */
export const getLoudness = () => {
  return valueBlock('sensing_loudness', {})
}

/**
 * isLoud block helper.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { isLoud } from 'hikkaku/blocks'
 *
 * isLoud()
 * ```
 */
export const isLoud = () => {
  return valueBlock('sensing_loud', {})
}

/**
 * Asks user input.
 *
 * Input: `question`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param question See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { askAndWait } from 'hikkaku/blocks'
 *
 * askAndWait('Hello')
 * ```
 */
export const askAndWait = (question: PrimitiveSource<string>) => {
  return block('sensing_askandwait', {
    inputs: {
      QUESTION: fromPrimitiveSource(
        InputType.String,
        question,
        "What's your name?",
      ),
    },
  })
}

/**
 * Returns last answer.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getAnswer } from 'hikkaku/blocks'
 *
 * getAnswer()
 * ```
 */
export const getAnswer = () => {
  return valueBlock('sensing_answer', {})
}

/**
 * Returns username.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getUsername } from 'hikkaku/blocks'
 *
 * getUsername()
 * ```
 */
export const getUsername = () => {
  return valueBlock('sensing_username', {})
}
