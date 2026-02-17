import {
  fromPrimitiveSource,
  menuInput,
  unwrapCostumeSource,
} from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { CostumeSource, PrimitiveSource } from '../core/types'

export type LookEffect =
  | 'color'
  | 'fisheye'
  | 'whirl'
  | 'pixelate'
  | 'mosaic'
  | 'brightness'
  | 'ghost'

export type FrontBack = 'front' | 'back'
export type ForwardBackward = 'forward' | 'backward'
export type NumberName = 'number' | 'name'

/**
 * Displays a speech bubble.
 *
 * Input: `message`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { say } from 'hikkaku/blocks'
 *
 * say('Hello')
 * ```
 */
export const say = (message: PrimitiveSource<string>) => {
  return block('looks_say', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
    },
  })
}

/**
 * Speaks for duration.
 *
 * Input: `message`, `seconds`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @param seconds See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { sayForSecs } from 'hikkaku/blocks'
 *
 * sayForSecs('Hello', 10)
 * ```
 */
export const sayForSecs = (
  message: PrimitiveSource<string>,
  seconds: PrimitiveSource<number>,
) => {
  return block('looks_sayforsecs', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
      SECS: fromPrimitiveSource(seconds),
    },
  })
}

/**
 * Displays thought bubble.
 *
 * Input: `message`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { think } from 'hikkaku/blocks'
 *
 * think('Hello')
 * ```
 */
export const think = (message: PrimitiveSource<string>) => {
  return block('looks_think', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
    },
  })
}

/**
 * Thinks for duration.
 *
 * Input: `message`, `seconds`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param message See function signature for accepted input values.
 * @param seconds See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { thinkForSecs } from 'hikkaku/blocks'
 *
 * thinkForSecs('Hello', 10)
 * ```
 */
export const thinkForSecs = (
  message: PrimitiveSource<string>,
  seconds: PrimitiveSource<number>,
) => {
  return block('looks_thinkforsecs', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
      SECS: fromPrimitiveSource(seconds),
    },
  })
}

/**
 * Shows sprite.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { show } from 'hikkaku/blocks'
 *
 * show()
 * ```
 */
export const show = () => {
  return block('looks_show', {})
}

/**
 * Hides sprite.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { hide } from 'hikkaku/blocks'
 *
 * hide()
 * ```
 */
export const hide = () => {
  return block('looks_hide', {})
}

/**
 * Switches costume.
 *
 * Input: `costume`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param costume See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { switchCostumeTo } from 'hikkaku/blocks'
 *
 * switchCostumeTo('costume1')
 * ```
 */
export const switchCostumeTo = (costume: CostumeSource) => {
  return block('looks_switchcostumeto', {
    inputs: {
      COSTUME: menuInput(unwrapCostumeSource(costume), menuOfCostume),
    },
  })
}
export const menuOfCostume = (costume: string = '') => {
  return valueBlock('looks_costume', {
    fields: {
      COSTUME: [costume, null],
    },
    isShadow: true,
  })
}

/**
 * Next costume.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { nextCostume } from 'hikkaku/blocks'
 *
 * nextCostume()
 * ```
 */
export const nextCostume = () => {
  return block('looks_nextcostume', {})
}

/**
 * Switch backdrop.
 *
 * Input: `backdrop`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param backdrop See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { switchBackdropTo } from 'hikkaku/blocks'
 *
 * switchBackdropTo('backdrop1')
 * ```
 */
export const switchBackdropTo = (backdrop: PrimitiveSource<string>) => {
  return block('looks_switchbackdropto', {
    inputs: {
      BACKDROP: menuInput(backdrop, menuOfBackdrop),
    },
  })
}

export const menuOfBackdrop = (backdrop: string = '') => {
  return valueBlock('looks_backdrops', {
    fields: {
      BACKDROP: [backdrop, null],
    },
    isShadow: true,
  })
}

/**
 * Switch backdrop and wait.
 *
 * Input: `backdrop`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param backdrop See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { switchBackdropToAndWait } from 'hikkaku/blocks'
 *
 * switchBackdropToAndWait('backdrop1')
 * ```
 */
export const switchBackdropToAndWait = (backdrop: PrimitiveSource<string>) => {
  return block('looks_switchbackdroptoandwait', {
    inputs: {
      BACKDROP: menuInput(backdrop, menuOfBackdrop),
    },
  })
}

/**
 * Next backdrop.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { nextBackdrop } from 'hikkaku/blocks'
 *
 * nextBackdrop()
 * ```
 */
export const nextBackdrop = () => {
  return block('looks_nextbackdrop', {})
}

/**
 * Changes graphic effect.
 *
 * Input: `effect`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param effect See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeLooksEffectBy } from 'hikkaku/blocks'
 *
 * changeLooksEffectBy('color', 10)
 * ```
 */
export const changeLooksEffectBy = (
  effect: LookEffect,
  value: PrimitiveSource<number>,
) => {
  return block('looks_changeeffectby', {
    inputs: {
      CHANGE: fromPrimitiveSource(value),
    },
    fields: {
      EFFECT: [effect, null],
    },
  })
}

/**
 * Sets graphic effect.
 *
 * Input: `effect`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param effect See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setLooksEffectTo } from 'hikkaku/blocks'
 *
 * setLooksEffectTo('color', 10)
 * ```
 */
export const setLooksEffectTo = (
  effect: LookEffect,
  value: PrimitiveSource<number>,
) => {
  return block('looks_seteffectto', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      EFFECT: [effect, null],
    },
  })
}

/**
 * Clears effects.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { clearGraphicEffects } from 'hikkaku/blocks'
 *
 * clearGraphicEffects()
 * ```
 */
export const clearGraphicEffects = () => {
  return block('looks_cleargraphiceffects', {})
}

/**
 * Changes size.
 *
 * Input: `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeSizeBy } from 'hikkaku/blocks'
 *
 * changeSizeBy(10)
 * ```
 */
export const changeSizeBy = (value: PrimitiveSource<number>) => {
  return block('looks_changesizeby', {
    inputs: {
      CHANGE: fromPrimitiveSource(value),
    },
  })
}

/**
 * Sets size.
 *
 * Input: `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setSizeTo } from 'hikkaku/blocks'
 *
 * setSizeTo(10)
 * ```
 */
export const setSizeTo = (value: PrimitiveSource<number>) => {
  return block('looks_setsizeto', {
    inputs: {
      SIZE: fromPrimitiveSource(value),
    },
  })
}

/**
 * Moves sprite layer.
 *
 * Input: `position`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param position See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { goToFrontBack } from 'hikkaku/blocks'
 *
 * goToFrontBack('front')
 * ```
 */
export const goToFrontBack = (position: FrontBack) => {
  return block('looks_gotofrontback', {
    fields: {
      FRONT_BACK: [position, null],
    },
  })
}

/**
 * Moves layers.
 *
 * Input: `direction`, `layers`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param direction See function signature for accepted input values.
 * @param layers See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { goForwardBackwardLayers } from 'hikkaku/blocks'
 *
 * goForwardBackwardLayers('forward', 10)
 * ```
 */
export const goForwardBackwardLayers = (
  direction: ForwardBackward,
  layers: PrimitiveSource<number>,
) => {
  return block('looks_goforwardbackwardlayers', {
    inputs: {
      NUM: fromPrimitiveSource(layers),
    },
    fields: {
      FORWARD_BACKWARD: [direction, null],
    },
  })
}

/**
 * Returns size.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getSize } from 'hikkaku/blocks'
 *
 * getSize()
 * ```
 */
export const getSize = () => {
  return valueBlock('looks_size', {})
}

/**
 * Returns costume number or name.
 *
 * Input: `value`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getCostumeNumberName } from 'hikkaku/blocks'
 *
 * getCostumeNumberName(10)
 * ```
 */
export const getCostumeNumberName = (value: NumberName) => {
  return valueBlock('looks_costumenumbername', {
    fields: {
      NUMBER_NAME: [value, null],
    },
  })
}

/**
 * Returns backdrop number or name.
 *
 * Input: `value`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getBackdropNumberName } from 'hikkaku/blocks'
 *
 * getBackdropNumberName(10)
 * ```
 */
export const getBackdropNumberName = (value: NumberName) => {
  return valueBlock('looks_backdropnumbername', {
    fields: {
      NUMBER_NAME: [value, null],
    },
  })
}
