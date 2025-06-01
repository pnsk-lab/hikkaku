import * as sb3 from "@pnsk-lab/sb3-types";
import type { PrimitiveSource } from "../compiler/types";
import { fromPrimitiveSource } from "../compiler/block-helper";
import { block } from "../compiler/composer";

export const add = (a: PrimitiveSource<number>, b: PrimitiveSource<number>) => {
  return block('operator_add', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b)
    }
  })
}

