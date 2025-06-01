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
