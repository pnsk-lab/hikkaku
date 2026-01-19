import type * as sb3 from "@pnsk-lab/sb3-types"
import { fromPrimitiveSource } from "../compiler/block-helper"
import type { PrimitiveSource } from "../compiler/types"
import { block, substack } from "../compiler/composer"

export const forever = (handler: () => void) => {
  const substackId = substack(handler)
  return block('control_forever', {
    inputs: substackId ? {
      SUBSTACK: [2, substackId]
    } : {}
  })
}

