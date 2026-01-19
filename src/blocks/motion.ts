import type * as sb3 from "@pnsk-lab/sb3-types"
import { fromPrimitiveSource } from "../compiler/block-helper"
import type { PrimitiveSource } from "../compiler/types"
import { block } from "../compiler/composer"

export const moveSteps = (steps: PrimitiveSource<number>) => {
  block('motion_movesteps', {
    inputs: {
      STEPS: fromPrimitiveSource(steps)
    },
  })
}

export const gotoXY = (x: PrimitiveSource<number>, y: PrimitiveSource<number>) => {
  block('motion_gotoxy', {
    inputs: {
      X: fromPrimitiveSource(x),
      Y: fromPrimitiveSource(y)
    },
  })
}

export const changeXBy = (dx: PrimitiveSource<number>) => {
  block('motion_changexby', {
    inputs: {
      DX: fromPrimitiveSource(dx)
    },
  })
}

export const changeYBy = (dy: PrimitiveSource<number>) => {
  block('motion_changeyby', {
    inputs: {
      DY: fromPrimitiveSource(dy)
    },
  })
}

export const setX = (x: PrimitiveSource<number>) => {
  block('motion_setx', {
    inputs: {
      X: fromPrimitiveSource(x)
    },
  })
}

export const setY = (y: PrimitiveSource<number>) => {
  block('motion_sety', {
    inputs: {
      Y: fromPrimitiveSource(y)
    },
  })
}