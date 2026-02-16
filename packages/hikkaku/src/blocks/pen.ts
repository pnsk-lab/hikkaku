import {
  fromPrimitiveSource,
  fromPrimitiveSourceColor,
  menuInput,
} from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

export type PenColorParam =
  | 'color'
  | 'saturation'
  | 'brightness'
  | 'transparency'

/**
 * Clears all pen marks.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { eraseAll } from 'hikkaku/blocks'
 *
 * eraseAll()
 * ```
 */
export const eraseAll = () => {
  return block('pen_clear', {})
}

/**
 * Alias for {@link eraseAll}.
 *
 * Input: none.
 * Output: Same Scratch statement block definition as {@link eraseAll}.
 *
 * @example
 * ```ts
 * import { clear } from 'hikkaku/blocks'
 *
 * clear()
 * ```
 */
export const clear = eraseAll

/**
 * Stamps sprite costume.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { stamp } from 'hikkaku/blocks'
 *
 * stamp()
 * ```
 */
export const stamp = () => {
  return block('pen_stamp', {})
}

/**
 * Starts drawing.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { penDown } from 'hikkaku/blocks'
 *
 * penDown()
 * ```
 */
export const penDown = () => {
  return block('pen_penDown', {})
}

/**
 * Stops drawing.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { penUp } from 'hikkaku/blocks'
 *
 * penUp()
 * ```
 */
export const penUp = () => {
  return block('pen_penUp', {})
}

/**
 * Sets pen color.
 *
 * Input: `color`. like: #ffffff, #fff. This does not accept values like "red" or "green" that CSS accepts.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param color See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setPenColorTo } from 'hikkaku/blocks'
 *
 * setPenColorTo("#ff0000")
 * ```
 */
export const setPenColorTo = (
  color: PrimitiveSource<`#${string}` | (string & {})>,
) => {
  return block('pen_setPenColorToColor', {
    inputs: {
      COLOR: fromPrimitiveSourceColor(color),
    },
  })
}

/**
 * Alias for {@link setPenColorTo}.
 *
 * Input: `color`.
 * Output: Same Scratch statement block definition as {@link setPenColorTo}.
 *
 * @param color See function signature for accepted input values.
 * @example
 * ```ts
 * import { setPenColorToColor } from 'hikkaku/blocks'
 *
 * setPenColorToColor('#ff0000')
 * ```
 */
export const setPenColorToColor = setPenColorTo

/**
 * Changes pen color parameter by amount.
 *
 * Input: `param`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param param See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changePenColorParamBy } from 'hikkaku/blocks'
 *
 * changePenColorParamBy('color', 10)
 * ```
 */
export const changePenColorParamBy = (
  param: PrimitiveSource<PenColorParam>,
  value: PrimitiveSource<number>,
) => {
  return block('pen_changePenColorParamBy', {
    inputs: {
      COLOR_PARAM: menuInput(param, menuOfPenColorParam),
      VALUE: fromPrimitiveSource(value),
    },
  })
}
export const menuOfPenColorParam = (colorParam: PenColorParam = 'color') => {
  return valueBlock('pen_menu_colorParam', {
    fields: {
      colorParam: [colorParam, null],
    },
    isShadow: true,
  })
}

/**
 * Sets pen color parameter to value.
 *
 * Input: `param`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param param See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setPenColorParamTo } from 'hikkaku/blocks'
 *
 * setPenColorParamTo('color', 10)
 * ```
 */
export const setPenColorParamTo = (
  param: PrimitiveSource<PenColorParam>,
  value: PrimitiveSource<number>,
) => {
  return block('pen_setPenColorParamTo', {
    inputs: {
      COLOR_PARAM: menuInput(param, menuOfPenColorParam),
      VALUE: fromPrimitiveSource(value),
    },
  })
}

/**
 * Changes pen size by amount.
 *
 * Input: `size`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param size See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changePenSizeBy } from 'hikkaku/blocks'
 *
 * changePenSizeBy(10)
 * ```
 */
export const changePenSizeBy = (size: PrimitiveSource<number>) => {
  return block('pen_changePenSizeBy', {
    inputs: {
      SIZE: fromPrimitiveSource(size),
    },
  })
}

/**
 * Sets pen size to value.
 *
 * Input: `size`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param size See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setPenSizeTo } from 'hikkaku/blocks'
 *
 * setPenSizeTo(10)
 * ```
 */
export const setPenSizeTo = (size: PrimitiveSource<number>) => {
  return block('pen_setPenSizeTo', {
    inputs: {
      SIZE: fromPrimitiveSource(size),
    },
  })
}

/**
 * Sets pen shade to value.
 *
 * Input: `shade`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param shade See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setPenShadeToNumber } from 'hikkaku/blocks'
 *
 * setPenShadeToNumber(10)
 * ```
 */
export const setPenShadeToNumber = (shade: PrimitiveSource<number>) => {
  return block('pen_setPenShadeToNumber', {
    inputs: {
      SHADE: fromPrimitiveSource(shade),
    },
  })
}

/**
 * Changes pen shade by amount.
 *
 * Input: `shade`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param shade See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changePenShadeBy } from 'hikkaku/blocks'
 *
 * changePenShadeBy(10)
 * ```
 */
export const changePenShadeBy = (shade: PrimitiveSource<number>) => {
  return block('pen_changePenShadeBy', {
    inputs: {
      SHADE: fromPrimitiveSource(shade),
    },
  })
}

/**
 * Sets pen hue to value.
 *
 * Input: `hue`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param hue See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setPenHueToNumber } from 'hikkaku/blocks'
 *
 * setPenHueToNumber(10)
 * ```
 */
export const setPenHueToNumber = (hue: PrimitiveSource<number>) => {
  return block('pen_setPenHueToNumber', {
    inputs: {
      HUE: fromPrimitiveSource(hue),
    },
  })
}

/**
 * Changes pen hue by amount.
 *
 * Input: `hue`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param hue See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changePenHueBy } from 'hikkaku/blocks'
 *
 * changePenHueBy(10)
 * ```
 */
export const changePenHueBy = (hue: PrimitiveSource<number>) => {
  return block('pen_changePenHueBy', {
    inputs: {
      HUE: fromPrimitiveSource(hue),
    },
  })
}
