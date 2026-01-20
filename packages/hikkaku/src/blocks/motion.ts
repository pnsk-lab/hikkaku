import { fromPrimitiveSource } from '../compiler/block-helper'
import { block, valueBlock } from '../compiler/composer'
import type { PrimitiveSource } from '../compiler/types'

export const moveSteps = (steps: PrimitiveSource<number>) => {
  return block('motion_movesteps', {
    inputs: {
      STEPS: fromPrimitiveSource(steps),
    },
  })
}

export const gotoXY = (
  x: PrimitiveSource<number>,
  y: PrimitiveSource<number>,
) => {
  return block('motion_gotoxy', {
    inputs: {
      X: fromPrimitiveSource(x),
      Y: fromPrimitiveSource(y),
    },
  })
}

export const changeXBy = (dx: PrimitiveSource<number>) => {
  return block('motion_changexby', {
    inputs: {
      DX: fromPrimitiveSource(dx),
    },
  })
}

export const changeYBy = (dy: PrimitiveSource<number>) => {
  return block('motion_changeyby', {
    inputs: {
      DY: fromPrimitiveSource(dy),
    },
  })
}

export const setX = (x: PrimitiveSource<number>) => {
  return block('motion_setx', {
    inputs: {
      X: fromPrimitiveSource(x),
    },
  })
}

export const setY = (y: PrimitiveSource<number>) => {
  return block('motion_sety', {
    inputs: {
      Y: fromPrimitiveSource(y),
    },
  })
}

export const goTo = (target: string) => {
  return block('motion_goto', {
    fields: {
      TO: [target, null],
    },
  })
}

export const turnRight = (degrees: PrimitiveSource<number>) => {
  return block('motion_turnright', {
    inputs: {
      DEGREES: fromPrimitiveSource(degrees),
    },
  })
}

export const turnLeft = (degrees: PrimitiveSource<number>) => {
  return block('motion_turnleft', {
    inputs: {
      DEGREES: fromPrimitiveSource(degrees),
    },
  })
}

export const pointInDirection = (direction: PrimitiveSource<number>) => {
  return block('motion_pointindirection', {
    inputs: {
      DIRECTION: fromPrimitiveSource(direction),
    },
  })
}

export const pointTowards = (target: string) => {
  return block('motion_pointtowards', {
    fields: {
      TOWARDS: [target, null],
    },
  })
}

export const glide = (
  seconds: PrimitiveSource<number>,
  x: PrimitiveSource<number>,
  y: PrimitiveSource<number>,
) => {
  return block('motion_glidesecstoxy', {
    inputs: {
      SECS: fromPrimitiveSource(seconds),
      X: fromPrimitiveSource(x),
      Y: fromPrimitiveSource(y),
    },
  })
}

export const glideTo = (seconds: PrimitiveSource<number>, target: string) => {
  return block('motion_glideto', {
    inputs: {
      SECS: fromPrimitiveSource(seconds),
    },
    fields: {
      TO: [target, null],
    },
  })
}

export const ifOnEdgeBounce = () => {
  return block('motion_ifonedgebounce', {})
}

export const setRotationStyle = (
  style: 'all around' | 'left-right' | "don't rotate",
) => {
  return block('motion_setrotationstyle', {
    fields: {
      STYLE: [style, null],
    },
  })
}

export const getX = () => {
  return valueBlock('motion_xposition', {})
}

export const getY = () => {
  return valueBlock('motion_yposition', {})
}

export const getDirection = () => {
  return valueBlock('motion_direction', {})
}
