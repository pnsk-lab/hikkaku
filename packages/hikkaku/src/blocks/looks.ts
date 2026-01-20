import { fromCostumeSource, fromPrimitiveSource } from "../compiler/block-helper"
import { block } from "../compiler/composer"
import type { CostumeSource, PrimitiveSource } from "../compiler/types"

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

export const say = (message: PrimitiveSource<string>) => {
  return block('looks_say', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message)
    }
  })
}

export const sayForSecs = (
  message: PrimitiveSource<string>,
  seconds: PrimitiveSource<number>
) => {
  return block('looks_sayforsecs', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
      SECS: fromPrimitiveSource(seconds)
    }
  })
}

export const think = (message: PrimitiveSource<string>) => {
  return block('looks_think', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message)
    }
  })
}

export const thinkForSecs = (
  message: PrimitiveSource<string>,
  seconds: PrimitiveSource<number>
) => {
  return block('looks_thinkforsecs', {
    inputs: {
      MESSAGE: fromPrimitiveSource(message),
      SECS: fromPrimitiveSource(seconds)
    }
  })
}

export const show = () => {
  return block('looks_show', {})
}

export const hide = () => {
  return block('looks_hide', {})
}

export const switchCostumeTo = (costume: CostumeSource) => {
  return block('looks_switchcostumeto', {
    inputs: {
      COSTUME: fromCostumeSource(costume)
    }
  })
}

export const nextCostume = () => {
  return block('looks_nextcostume', {})
}

export const switchBackdropTo = (backdrop: PrimitiveSource<string>) => {
  return block('looks_switchbackdropto', {
    inputs: {
      BACKDROP: fromPrimitiveSource(backdrop)
    }
  })
}

export const switchBackdropToAndWait = (backdrop: PrimitiveSource<string>) => {
  return block('looks_switchbackdroptoandwait', {
    inputs: {
      BACKDROP: fromPrimitiveSource(backdrop)
    }
  })
}

export const nextBackdrop = () => {
  return block('looks_nextbackdrop', {})
}

export const changeLooksEffectBy = (
  effect: LookEffect,
  value: PrimitiveSource<number>
) => {
  return block('looks_changeeffectby', {
    inputs: {
      CHANGE: fromPrimitiveSource(value)
    },
    fields: {
      EFFECT: [effect, null]
    }
  })
}

export const setLooksEffectTo = (
  effect: LookEffect,
  value: PrimitiveSource<number>
) => {
  return block('looks_seteffectto', {
    inputs: {
      VALUE: fromPrimitiveSource(value)
    },
    fields: {
      EFFECT: [effect, null]
    }
  })
}

export const clearGraphicEffects = () => {
  return block('looks_cleargraphiceffects', {})
}

export const changeSizeBy = (value: PrimitiveSource<number>) => {
  return block('looks_changesizeby', {
    inputs: {
      CHANGE: fromPrimitiveSource(value)
    }
  })
}

export const setSizeTo = (value: PrimitiveSource<number>) => {
  return block('looks_setsizeto', {
    inputs: {
      SIZE: fromPrimitiveSource(value)
    }
  })
}

export const goToFrontBack = (position: FrontBack) => {
  return block('looks_gotofrontback', {
    fields: {
      FRONT_BACK: [position, null]
    }
  })
}

export const goForwardBackwardLayers = (
  direction: ForwardBackward,
  layers: PrimitiveSource<number>
) => {
  return block('looks_goforwardbackwardlayers', {
    inputs: {
      NUM: fromPrimitiveSource(layers)
    },
    fields: {
      FORWARD_BACKWARD: [direction, null]
    }
  })
}

export const getSize = () => {
  return block('looks_size', {})
}

export const getCostumeNumberName = (value: NumberName) => {
  return block('looks_costumenumbername', {
    fields: {
      NUMBER_NAME: [value, null]
    }
  })
}

export const getBackdropNumberName = (value: NumberName) => {
  return block('looks_backdropnumbername', {
    fields: {
      NUMBER_NAME: [value, null]
    }
  })
}
