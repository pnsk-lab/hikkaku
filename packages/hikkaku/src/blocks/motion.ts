import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

/**
 * Moves sprite.
 *
 * Input: `steps`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param steps See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { moveSteps } from 'hikkaku/blocks'
 *
 * moveSteps(10)
 * ```
 */
export const moveSteps = (steps: PrimitiveSource<number>) => {
  return block('motion_movesteps', {
    inputs: {
      STEPS: fromPrimitiveSource(InputType.Number, steps, 10),
    },
  })
}

/**
 * Moves to coordinates.
 *
 * Input: `x`, `y`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param x See function signature for accepted input values.
 * @param y See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { gotoXY } from 'hikkaku/blocks'
 *
 * gotoXY(10, 10)
 * ```
 */
export const gotoXY = (
  x: PrimitiveSource<number>,
  y: PrimitiveSource<number>,
) => {
  return block('motion_gotoxy', {
    inputs: {
      X: fromPrimitiveSource(InputType.Number, x, 0),
      Y: fromPrimitiveSource(InputType.Number, y, 0),
    },
  })
}

/**
 * Changes X.
 *
 * Input: `dx`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param dx See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeXBy } from 'hikkaku/blocks'
 *
 * changeXBy(10)
 * ```
 */
export const changeXBy = (dx: PrimitiveSource<number>) => {
  return block('motion_changexby', {
    inputs: {
      DX: fromPrimitiveSource(InputType.Number, dx, 10),
    },
  })
}

/**
 * Changes Y.
 *
 * Input: `dy`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param dy See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeYBy } from 'hikkaku/blocks'
 *
 * changeYBy(10)
 * ```
 */
export const changeYBy = (dy: PrimitiveSource<number>) => {
  return block('motion_changeyby', {
    inputs: {
      DY: fromPrimitiveSource(InputType.Number, dy, 10),
    },
  })
}

/**
 * Sets X.
 *
 * Input: `x`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param x See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setX } from 'hikkaku/blocks'
 *
 * setX(10)
 * ```
 */
export const setX = (x: PrimitiveSource<number>) => {
  return block('motion_setx', {
    inputs: {
      X: fromPrimitiveSource(InputType.Number, x, 0),
    },
  })
}

/**
 * Sets Y.
 *
 * Input: `y`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param y See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setY } from 'hikkaku/blocks'
 *
 * setY(10)
 * ```
 */
export const setY = (y: PrimitiveSource<number>) => {
  return block('motion_sety', {
    inputs: {
      Y: fromPrimitiveSource(InputType.Number, y, 0),
    },
  })
}

/**
 * Moves to target.
 *
 * Input: `target`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param target See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { goTo } from 'hikkaku/blocks'
 *
 * goTo('mouse-pointer')
 * ```
 */
export const goTo = (target: PrimitiveSource<string>) => {
  return block('motion_goto', {
    inputs: {
      TO: menuInput(target, menuOfGoTo),
    },
  })
}
export const GOTO_RANDOM = '_random_'
export const menuOfGoTo = (target: string = GOTO_RANDOM) => {
  return valueBlock('motion_goto_menu', {
    fields: {
      TO: [target, null],
    },
    isShadow: true,
  })
}

/**
 * Turns right.
 *
 * Input: `degrees`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param degrees See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { turnRight } from 'hikkaku/blocks'
 *
 * turnRight(10)
 * ```
 */
export const turnRight = (degrees: PrimitiveSource<number>) => {
  return block('motion_turnright', {
    inputs: {
      DEGREES: fromPrimitiveSource(InputType.Number, degrees, 15),
    },
  })
}

/**
 * Turns left.
 *
 * Input: `degrees`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param degrees See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { turnLeft } from 'hikkaku/blocks'
 *
 * turnLeft(10)
 * ```
 */
export const turnLeft = (degrees: PrimitiveSource<number>) => {
  return block('motion_turnleft', {
    inputs: {
      DEGREES: fromPrimitiveSource(InputType.Number, degrees, 15),
    },
  })
}

/**
 * Points direction.
 *
 * Input: `direction`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param direction See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { pointInDirection } from 'hikkaku/blocks'
 *
 * pointInDirection('forward')
 * ```
 */
export const pointInDirection = (direction: PrimitiveSource<number>) => {
  return block('motion_pointindirection', {
    inputs: {
      DIRECTION: fromPrimitiveSource(InputType.Angle, direction, 90),
    },
  })
}

/**
 * Points toward target.
 *
 * Input: `target`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param target See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { pointTowards } from 'hikkaku/blocks'
 *
 * pointTowards('mouse-pointer')
 * ```
 */
export const pointTowards = (target: PrimitiveSource<string>) => {
  return block('motion_pointtowards', {
    inputs: {
      TOWARDS: menuInput(target, menuOfPointTowards),
    },
  })
}
const TOWARDS_MOUSE_POINTER = '_mouse_'
export const menuOfPointTowards = (target: string = TOWARDS_MOUSE_POINTER) => {
  return valueBlock('motion_pointtowards_menu', {
    fields: {
      TOWARDS: [target, null],
    },
    isShadow: true,
  })
}

/**
 * Glides to position.
 *
 * Input: `seconds`, `x`, `y`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param seconds See function signature for accepted input values.
 * @param x See function signature for accepted input values.
 * @param y See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { glide } from 'hikkaku/blocks'
 *
 * glide(10, 10, 10)
 * ```
 */
export const glide = (
  seconds: PrimitiveSource<number>,
  x: PrimitiveSource<number>,
  y: PrimitiveSource<number>,
) => {
  return block('motion_glidesecstoxy', {
    inputs: {
      SECS: fromPrimitiveSource(InputType.Number, seconds, 1),
      X: fromPrimitiveSource(InputType.Number, x, 0),
      Y: fromPrimitiveSource(InputType.Number, y, 0),
    },
  })
}

/**
 * Glides to target.
 *
 * Input: `seconds`, `target`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param seconds See function signature for accepted input values.
 * @param target See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { glideTo } from 'hikkaku/blocks'
 *
 * glideTo(10, 'mouse-pointer')
 * ```
 */
export const glideTo = (
  seconds: PrimitiveSource<number>,
  target: PrimitiveSource<string>,
) => {
  return block('motion_glideto', {
    inputs: {
      SECS: fromPrimitiveSource(InputType.Number, seconds, 1),
      TO: menuInput(target, menuOfGlideTo),
    },
  })
}

export const menuOfGlideTo = (target: string = GOTO_RANDOM) => {
  return valueBlock('motion_glideto_menu', {
    fields: {
      TO: [target, null],
    },
    isShadow: true,
  })
}

/**
 * Bounces on edge.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ifOnEdgeBounce } from 'hikkaku/blocks'
 *
 * ifOnEdgeBounce()
 * ```
 */
export const ifOnEdgeBounce = () => {
  return block('motion_ifonedgebounce', {})
}

/**
 * Sets rotation style.
 *
 * Input: `style`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param style See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setRotationStyle } from 'hikkaku/blocks'
 *
 * setRotationStyle('all around')
 * ```
 */
export const setRotationStyle = (
  style: 'all around' | 'left-right' | "don't rotate",
) => {
  return block('motion_setrotationstyle', {
    fields: {
      STYLE: [style, null],
    },
  })
}

/**
 * Returns X position.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getX } from 'hikkaku/blocks'
 *
 * getX()
 * ```
 */
export const getX = () => {
  return valueBlock('motion_xposition', {})
}

/**
 * Returns Y position.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getY } from 'hikkaku/blocks'
 *
 * getY()
 * ```
 */
export const getY = () => {
  return valueBlock('motion_yposition', {})
}

/**
 * Returns direction.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getDirection } from 'hikkaku/blocks'
 *
 * getDirection()
 * ```
 */
export const getDirection = () => {
  return valueBlock('motion_direction', {})
}
